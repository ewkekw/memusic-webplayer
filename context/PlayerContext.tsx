

import React, { createContext, useState, useRef, useEffect, useCallback, useContext, Dispatch, SetStateAction } from 'react';
import { Song, PlayerContextType, PlayerContextTypeString, EqSetting, PlayerSettings, PlayerQueueState, AppState } from '../types';
import { UserMusicContext } from './UserMusicContext';
import { getSongsByIds, getSongSuggestions, getArtistDetails, searchSongs } from '../services/jioSaavnApi';
import { defaultAppState } from '../hooks/useStorage';

const decodeHtml = (html: string | null) => {
    if (!html) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

const eqBands = [
    { f: 60, type: 'lowshelf' as const }, { f: 230, type: 'peaking' as const },
    { f: 910, type: 'peaking' as const }, { f: 3600, type: 'peaking' as const },
    { f: 14000, type: 'highshelf' as const },
];

export const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType);

const createImpulseResponse = (context: AudioContext): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const duration = 2; const decay = 2; const numChannels = 2;
    const frameCount = sampleRate * duration;
    const buffer = context.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);
        }
    }
    return buffer;
};

const smartShuffle = (songs: Song[]): Song[] => {
    const shuffled = [...songs];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 1; i < shuffled.length; i++) {
        const prevArtistId = shuffled[i - 1].artists.primary[0]?.id;
        const currentArtistId = shuffled[i].artists.primary[0]?.id;
        if (prevArtistId && prevArtistId === currentArtistId) {
            const swapIndex = shuffled.findIndex((song, j) => j > i && song.artists.primary[0]?.id !== currentArtistId);
            if (swapIndex !== -1) {
                [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
            }
        }
    }
    return shuffled;
};

interface PlayerProviderProps {
    children: React.ReactNode;
    playerSettings: PlayerSettings;
    playerQueue: PlayerQueueState;
    setAppState: (updater: (draft: AppState) => void) => void;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children, playerSettings, playerQueue, setAppState }) => {
  const { addToHistory, addToPlaylistHistory } = useContext(UserMusicContext);
  // --- Ephemeral State (not persisted in global storage) ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentQuality, setCurrentQuality] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [autoplayStartIndex, setAutoplayStartIndex] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // --- Persistent State (from props) ---
  const safePlayerSettings = (playerSettings && typeof playerSettings.volume === 'number' && Array.isArray(playerSettings.eqSettings))
    ? playerSettings
    : defaultAppState.settings.player;
  const safePlayerQueue = (playerQueue && typeof playerQueue.currentIndex === 'number' && Array.isArray(playerQueue.currentQueue))
    ? playerQueue
    : defaultAppState.playerQueue;
  
  const { volume, selectedQuality, isShuffle, repeatMode, eqSettings, isEqEnabled, is8DEnabled, isReverbEnabled, reverbMix } = safePlayerSettings;
  const { currentQueue, currentIndex, contextType, contextId, originalQueueUnshuffled } = safePlayerQueue;
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioNodesRef = useRef<{
    context: AudioContext | null; source: MediaElementAudioSourceNode | null; eqNodes: BiquadFilterNode[]; panner: PannerNode | null; analyser: AnalyserNode | null; convolver: ConvolverNode | null; reverbWetGain: GainNode | null; reverbDryGain: GainNode | null; pannerOscillator: OscillatorNode | null; pannerGain: GainNode | null; pannerDelay: DelayNode | null;
  }>({ context: null, source: null, eqNodes: [], panner: null, analyser: null, convolver: null, reverbWetGain: null, reverbDryGain: null, pannerOscillator: null, pannerGain: null, pannerDelay: null });
  const seekTimeOnQualityChangeRef = useRef<number | null>(null);
  
  const currentSong = currentIndex >= 0 && currentIndex < currentQueue.length ? currentQueue[currentIndex] : null;
  
  // --- State Updaters ---
  const updatePlayerSettings = (updater: (draft: PlayerSettings) => void) => setAppState(s => { updater(s.settings.player); });
  const updatePlayerQueue = (updater: (draft: PlayerQueueState) => void) => setAppState(s => { updater(s.playerQueue); });

  useEffect(() => {
    if (!audioRef.current) return;
    const initAudioContext = () => {
        if (audioNodesRef.current.context || !audioRef.current) return;
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
        if (context.state === 'suspended') context.resume();
        const source = context.createMediaElementSource(audioRef.current);
        const panner = context.createPanner(); panner.panningModel = 'HRTF';
        const analyserNode = context.createAnalyser(); analyserNode.fftSize = 256;
        const eqNodes = eqBands.map((band, i) => {
            const filter = context.createBiquadFilter();
            filter.type = band.type; filter.frequency.value = band.f;
            filter.gain.value = isEqEnabled ? eqSettings[i].gain : 0;
            return filter;
        });
        let lastNode: AudioNode = source;
        eqNodes.forEach(filter => { lastNode.connect(filter); lastNode = filter; });
        const convolver = context.createConvolver(); convolver.buffer = createImpulseResponse(context);
        const reverbWetGain = context.createGain(); const reverbDryGain = context.createGain();
        reverbWetGain.gain.value = 0; reverbDryGain.gain.value = 1;
        lastNode.connect(reverbDryGain); lastNode.connect(convolver); convolver.connect(reverbWetGain);
        reverbDryGain.connect(panner); reverbWetGain.connect(panner);
        const pannerOscillator = context.createOscillator(); const pannerFrequency = 0.2;
        pannerOscillator.frequency.setValueAtTime(pannerFrequency, context.currentTime);
        const pannerGain = context.createGain(); pannerGain.gain.setValueAtTime(0, context.currentTime);
        
        // CRITICAL FIX: Set max delay time to 5.0 seconds to accommodate the 1.25s calculation.
        const pannerDelay = context.createDelay(5.0); 
        pannerDelay.delayTime.setValueAtTime((1 / pannerFrequency) / 4, context.currentTime);
        
        pannerOscillator.connect(pannerGain); pannerGain.connect(panner.positionZ); pannerGain.connect(pannerDelay); pannerDelay.connect(panner.positionX);
        pannerOscillator.start();
        panner.connect(analyserNode); analyserNode.connect(context.destination);
        audioNodesRef.current = { context, source, eqNodes, panner, analyser: analyserNode, convolver, reverbWetGain, reverbDryGain, pannerOscillator, pannerGain, pannerDelay };
        setAnalyser(analyserNode);
    };
    const init = () => initAudioContext();
    document.body.addEventListener('click', init, { once: true });
    document.body.addEventListener('keydown', init, { once: true });
    return () => { document.body.removeEventListener('click', init); document.body.removeEventListener('keydown', init); }
  }, [eqSettings, isEqEnabled]);

  const playNext = useCallback(() => {
    updatePlayerQueue(d => {
        if (d.currentQueue.length === 0) {
            d.currentIndex = -1;
            return;
        }
        d.currentIndex = (d.currentIndex + 1) % d.currentQueue.length;
    });
  }, [updatePlayerQueue]);

  useEffect(() => {
    if (!currentSong || (currentSong.downloadUrl && currentSong.downloadUrl.length > 0)) return;
    let isCancelled = false;
    const fetchSongDetails = async () => {
      try {
        const res = await getSongsByIds([currentSong.id]);
        if (isCancelled) return;
        const fullSongData = res.success && res.data.length > 0 ? res.data[0] : null;
        if (fullSongData && fullSongData.downloadUrl?.length > 0) {
          updatePlayerQueue(d => { d.currentQueue = d.currentQueue.map(s => s.id === currentSong.id ? fullSongData : s); });
        } else {
            console.warn(`Could not fetch download URL for ${currentSong.name}, skipping.`);
            playNext();
        }
      } catch (error) { 
        console.error(`Error fetching song details for ${currentSong.name}, skipping.`, error);
        if (!isCancelled) playNext();
       }
    };
    fetchSongDetails();
    return () => { isCancelled = true; };
  }, [currentSong, playNext, updatePlayerQueue]);

  /**
   * Enhanced Radio Algorithm with 4-Layer Resilience
   */
  const fetchRecommendations = useCallback(async (seedSong: Song): Promise<Song[]> => {
      const collectedSongs: Song[] = [];
      const seenIds = new Set<string>();
      seenIds.add(seedSong.id);

      const addUnique = (songs: Song[]) => {
          songs.forEach(s => {
              if (!seenIds.has(s.id)) {
                  seenIds.add(s.id);
                  collectedSongs.push(s);
              }
          });
      };

      // Layer 1: Direct Station API (Best Quality)
      try {
          const res = await getSongSuggestions(seedSong.id, 15);
          if (res.success && res.data.length > 0) {
              addUnique(res.data);
          }
      } catch (e) {
          console.warn("Layer 1 (Station) failed, attempting fallback...");
      }

      // Layer 2: Artist Mix (Top Songs + Singles) - Only if we have fewer than 5 songs
      if (collectedSongs.length < 5) {
          try {
              const artistId = seedSong.artists.primary[0]?.id;
              if (artistId) {
                  const res = await getArtistDetails(artistId);
                  if (res.success) {
                       if (res.data.topSongs) addUnique(res.data.topSongs);
                       if (res.data.singles) addUnique(res.data.singles);
                  }
              }
          } catch (e) {
               console.warn("Layer 2 (Artist) failed, attempting fallback...");
          }
      }
      
      // Layer 3: Broad Search by Artist (Discovery) - If still low
      if (collectedSongs.length < 5) {
          try {
              const artistName = seedSong.artists.primary[0]?.name;
              if (artistName) {
                  const res = await searchSongs(artistName, 1, 20);
                  if (res.success) addUnique(res.data.results);
              }
          } catch (e) {
              console.warn("Layer 3 (Search Artist) failed...");
          }
      }

      // Layer 4: Final Resort - Search by Song Name (Covers/Remixes)
      if (collectedSongs.length < 3) {
           try {
              const query = `${seedSong.name} ${seedSong.artists.primary[0]?.name || ''}`;
              const res = await searchSongs(query, 1, 10);
              if (res.success) addUnique(res.data.results);
           } catch(e) {
               console.error("All radio layers failed.");
           }
      }
      
      // If ABSOLUTELY nothing found, just return the seed song again to loop
      if (collectedSongs.length === 0) {
          return [seedSong];
      }

      // Shuffle results to simulate radio randomness
      return collectedSongs.sort(() => Math.random() - 0.5);
  }, []);
  
  const populateQueueWithRadio = useCallback(async (seedSong: Song) => {
      try {
          const newSongs = await fetchRecommendations(seedSong);
          updatePlayerQueue(d => {
            // Filter out duplicates against existing queue to prevent loops
            const currentIds = new Set(d.currentQueue.map(qs => qs.id));
            const songsToAdd = newSongs.filter(s => !currentIds.has(s.id));

            if (songsToAdd.length > 0) {
              const oldQueueSize = d.currentQueue.length;
              d.currentQueue.push(...songsToAdd);
              // If autoplayStartIndex isn't set, set it to where we started adding
              setAutoplayStartIndex(prev => prev === null ? oldQueueSize : prev);
            } else {
                // If all recommendations were duplicates, force add specific new ones from layer 4 logic
                // Or just allow duplicates if the queue is small.
                 if (d.currentQueue.length < 5) {
                    d.currentQueue.push(...newSongs);
                 }
            }
          });
      } catch (e) {
          console.error("Autoplay population failed:", e);
      }
  }, [fetchRecommendations, updatePlayerQueue]);

  const handleEnded = useCallback(async () => {
    if (audioRef.current?.loop) return;

    const isLastSong = currentIndex === currentQueue.length - 1;

    if (isLastSong && repeatMode === 'off' && currentSong) {
       // Fallback logic if queue was not pre-populated
       await populateQueueWithRadio(currentSong);
       
       // Force a check on the queue state via functional update
       updatePlayerQueue(d => {
           if (d.currentQueue.length > d.currentIndex + 1) {
               d.currentIndex = d.currentIndex + 1;
               setIsPlaying(true);
           } else {
               setIsPlaying(false);
               if (audioRef.current) audioRef.current.currentTime = 0;
           }
       });

    } else {
      updatePlayerQueue(d => {
        if (d.currentQueue.length > 0) {
          d.currentIndex = (d.currentIndex + 1) % d.currentQueue.length;
        }
      });
      setIsPlaying(true);
    }
  }, [repeatMode, currentIndex, currentQueue, currentSong, updatePlayerQueue, populateQueueWithRadio]);

  // Main consolidated audio effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // --- Event Listeners Setup ---
    const timeUpdate = () => setCurrentTime(audio.currentTime);
    const loadedMeta = () => setDuration(audio.duration);
    const canPlay = () => {
      if (seekTimeOnQualityChangeRef.current !== null) {
        audio.currentTime = seekTimeOnQualityChangeRef.current;
        seekTimeOnQualityChangeRef.current = null;
      }
      if (isPlaying) {
        audio.play().catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Audio play failed on 'canplay' event:", e);
            setIsPlaying(false);
          }
        });
      }
    };
    audio.addEventListener('timeupdate', timeUpdate);
    audio.addEventListener('loadedmetadata', loadedMeta);
    audio.addEventListener('canplay', canPlay);
    audio.addEventListener('ended', handleEnded);
    
    // --- Source Management ---
    if (currentSong) {
      if (currentSong.id !== audio.dataset.songId || selectedQuality !== audio.dataset.quality) {
        const hasUrl = currentSong.downloadUrl && currentSong.downloadUrl.length > 0;
        if (hasUrl) {
          const getUrl = (q: string) => currentSong.downloadUrl?.find(i => i.quality === q)?.url;
          const songUrl = getUrl(selectedQuality) || getUrl('320kbps') || getUrl('160kbps') || getUrl('96kbps') || currentSong.downloadUrl[0]?.url;
          if (songUrl) {
            const httpsUrl = songUrl.replace(/^http:/, 'https:');
            const newQuality = currentSong.downloadUrl.find(q => q.url.replace(/^http:/, 'https:') === httpsUrl)?.quality || null;
            
            const timeToSeek = audio.dataset.songId === currentSong.id ? audio.currentTime : 0;
            seekTimeOnQualityChangeRef.current = timeToSeek;
            
            audio.src = httpsUrl;
            audio.dataset.songId = currentSong.id;
            audio.dataset.quality = selectedQuality;
            setCurrentQuality(newQuality);
            audio.load();
          } else {
             playNext();
          }
        }
      }
    } else {
      audio.src = '';
      audio.removeAttribute('src');
      audio.dataset.songId = '';
      setCurrentQuality(null);
      if (isPlaying) setIsPlaying(false);
    }
    
    // --- Playback State & Properties ---
    if (isPlaying && audio.src) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            console.error("Audio play failed:", error);
            setIsPlaying(false);
          }
        });
      }
    } else {
      audio.pause();
    }
    audio.volume = volume;
    audio.loop = repeatMode === 'one';
    audio.playbackRate = playbackRate;

    // --- Cleanup ---
    return () => {
      audio.removeEventListener('timeupdate', timeUpdate);
      audio.removeEventListener('loadedmetadata', loadedMeta);
      audio.removeEventListener('canplay', canPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, selectedQuality, isPlaying, volume, repeatMode, handleEnded, playNext, playbackRate]);
  
  const toggleShuffle = () => {
    const newShuffleState = !isShuffle;
    updatePlayerSettings(d => { d.isShuffle = newShuffleState; });
    updatePlayerQueue(d => {
        if (newShuffleState) {
            if (d.currentQueue.length > 1) {
                d.originalQueueUnshuffled = [...d.currentQueue];
                const currentlyPlaying = d.currentQueue[d.currentIndex];
                const others = d.currentQueue.filter(s => s.id !== currentlyPlaying.id);
                const shuffledQueue = [currentlyPlaying, ...smartShuffle(others)];
                d.currentQueue = shuffledQueue;
                d.currentIndex = 0;
            }
        } else {
            if (d.originalQueueUnshuffled) {
                const currentlyPlayingId = d.currentQueue[d.currentIndex]?.id;
                d.currentQueue = d.originalQueueUnshuffled;
                const newIndex = d.currentQueue.findIndex(s => s.id === currentlyPlayingId);
                d.currentIndex = newIndex !== -1 ? newIndex : 0;
                d.originalQueueUnshuffled = null;
            }
        }
    });
  };

  const setRepeatMode = (mode: 'off' | 'all' | 'one') => updatePlayerSettings(d => { d.repeatMode = mode; });
  const toggleEq = () => updatePlayerSettings(d => { d.isEqEnabled = !d.isEqEnabled; });
  const toggle8D = () => updatePlayerSettings(d => { d.is8DEnabled = !d.is8DEnabled; });
  const toggleReverb = () => updatePlayerSettings(d => { d.isReverbEnabled = !d.isReverbEnabled; });
  
  const setEqGain = (bandIndex: number, gain: number) => updatePlayerSettings(d => { d.eqSettings[bandIndex].gain = gain; });
  const resetEq = () => updatePlayerSettings(d => { d.eqSettings = eqBands.map(() => ({ gain: 0 })); });

  useEffect(() => {
    audioNodesRef.current.eqNodes.forEach((node, i) => {
        if(node && eqSettings[i]){ node.gain.value = isEqEnabled ? eqSettings[i].gain : 0; }
    });
  }, [eqSettings, isEqEnabled]);

  useEffect(() => {
    const { reverbWetGain, reverbDryGain, context } = audioNodesRef.current;
    if (!reverbWetGain || !reverbDryGain || !context) return;
    const wetValue = isReverbEnabled ? reverbMix : 0; const dryValue = 1 - (isReverbEnabled ? reverbMix * 0.5 : 0); 
    const transitionTime = 0.015;
    reverbWetGain.gain.setTargetAtTime(wetValue, context.currentTime, transitionTime);
    reverbDryGain.gain.setTargetAtTime(dryValue, context.currentTime, transitionTime);
  }, [isReverbEnabled, reverbMix]);

  useEffect(() => {
    const { pannerGain, context } = audioNodesRef.current;
    if (!pannerGain || !context) return;
    const radius = 2.5; const transitionTime = 0.5;
    if (is8DEnabled && isPlaying) pannerGain.gain.setTargetAtTime(radius, context.currentTime, transitionTime);
    else pannerGain.gain.setTargetAtTime(0, context.currentTime, transitionTime);
  }, [is8DEnabled, isPlaying]);

  const cycleRepeatMode = () => updatePlayerSettings(d => {
    if (d.repeatMode === 'off') d.repeatMode = 'all';
    else if (d.repeatMode === 'all') d.repeatMode = 'one';
    else d.repeatMode = 'off';
  });
  
  const togglePlay = useCallback(() => { if (currentSong) setIsPlaying(prev => !prev); }, [currentSong]);
  
  const playPrev = useCallback(() => {
    updatePlayerQueue(d => {
        if (d.currentQueue.length === 0) {
            d.currentIndex = -1;
            return;
        }
        d.currentIndex = (d.currentIndex - 1 + d.currentQueue.length) % d.currentQueue.length;
    });
  }, [updatePlayerQueue]);

  const playSong = useCallback(async (song: Song, queue: Song[], playContext: { type: PlayerContextTypeString; id: string; }) => {
    // Reset autoplay state when explicit play action occurs
    setAutoplayStartIndex(null);

    updatePlayerQueue(d => {
        if (song.id === d.currentQueue[d.currentIndex]?.id) {
            setIsPlaying(prev => !prev);
            return;
        }
        
        if (playContext.id === d.contextId && playContext.type === d.contextType && playContext.type !== 'search') {
            const songIndexInCurrentQueue = d.currentQueue.findIndex(s => s.id === song.id);
            if (songIndexInCurrentQueue !== -1) {
                d.currentIndex = songIndexInCurrentQueue;
                if (!isPlaying) setIsPlaying(true);
                return;
            }
        }
        
        let finalQueue = [...queue];

        if (isShuffle) {
            d.originalQueueUnshuffled = [...finalQueue];
            const otherSongs = finalQueue.filter(s => s.id !== song.id);
            finalQueue = [song, ...smartShuffle(otherSongs)];
        } else {
            d.originalQueueUnshuffled = null;
        }

        d.currentQueue = finalQueue;
        d.contextType = playContext.type;
        d.contextId = playContext.id;
        d.currentIndex = finalQueue.findIndex(s => s.id === song.id);

        if (playContext.type === 'playlist') {
            addToPlaylistHistory(playContext.id);
        }
        setIsPlaying(true);
        addToHistory(song);
    });

    // If queue only contains this song (typical for search result click), populate with radio immediately
    if (queue.length === 1) {
        // We fire this asynchronously to not block the UI update for playing the clicked song
        populateQueueWithRadio(song);
    }

  }, [isPlaying, isShuffle, updatePlayerQueue, addToHistory, addToPlaylistHistory, populateQueueWithRadio]);

  const playRadio = useCallback(async (song: Song) => {
    setIsPlaying(false); 
    let suggestions: Song[] = await fetchRecommendations(song);

    // If absolutely nothing returns (rare with new logic), just play the song itself
    const radioQueue = [song, ...suggestions];

    // Ensure unique songs and remove the seed song if it appeared in suggestions
    const uniqueSongs = radioQueue.filter((s, index, self) => 
        index === self.findIndex(t => t.id === s.id)
    );
    
    setAutoplayStartIndex(1);

    updatePlayerQueue(d => {
        if (isShuffle) {
            d.originalQueueUnshuffled = [...uniqueSongs];
            d.currentQueue = [uniqueSongs[0], ...smartShuffle(uniqueSongs.slice(1))];
        } else {
            d.originalQueueUnshuffled = null;
            d.currentQueue = uniqueSongs;
        }
        d.contextType = 'song';
        d.contextId = song.id;
        d.currentIndex = 0;
    });
    
    setIsPlaying(true);
    addToHistory(song);
  }, [playSong, isShuffle, updatePlayerQueue, addToHistory, fetchRecommendations]);

  const toggleQueue = useCallback((force?: boolean) => setIsQueueOpen(prev => force !== undefined ? force : !prev), []);

  const seek = useCallback((time: number) => { if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); } }, []);
  const setVolume = (v: number) => updatePlayerSettings(d => { d.volume = Math.max(0, Math.min(1, v)); });
  const setSelectedQuality = (q: string) => updatePlayerSettings(d => { d.selectedQuality = q; });
  const setReverbMix = (mix: number) => updatePlayerSettings(d => { d.reverbMix = mix; });

  const addSongNext = (song: Song) => {
    setAutoplayStartIndex(prev => prev !== null ? prev + 1 : null);
    updatePlayerQueue(d => {
        if (d.currentQueue.length === 0 || d.currentIndex === -1) {
             d.currentQueue = [song];
             d.currentIndex = 0;
             d.contextType = 'queue';
             d.contextId = 'queue';
             setIsPlaying(true);
        } else {
            d.currentQueue.splice(d.currentIndex + 1, 0, song);
        }
    });
  };
  const addSongsToEnd = (songs: Song[]) => {
    updatePlayerQueue(d => {
        const songsToAdd = songs.filter(s => !d.currentQueue.some(qs => qs.id === s.id));
        d.currentQueue.push(...songsToAdd);
        if (d.currentIndex === -1 && songsToAdd.length > 0) {
            d.currentIndex = d.currentQueue.length - songsToAdd.length;
            d.contextType = 'queue';
            d.contextId = 'queue';
            setIsPlaying(true);
        }
    });
  };
  const reorderQueue = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    // If user reorders, autoplay assumption is usually broken, or we shift index.
    setAutoplayStartIndex(null);
    updatePlayerQueue(d => {
        const [movedSong] = d.currentQueue.splice(oldIndex, 1);
        d.currentQueue.splice(newIndex, 0, movedSong);
        const currentlyPlayingId = d.currentQueue[d.currentIndex]?.id;
        d.currentIndex = d.currentQueue.findIndex(s => s.id === currentlyPlayingId);
    });
  };
  const removeSongFromQueue = (songId: string) => {
    updatePlayerQueue(d => {
        const songToRemoveIndex = d.currentQueue.findIndex(s => s.id === songId);
        if(songToRemoveIndex === -1) return;
        
        // If removing a song that was part of autoplay, adjust the index
        if (autoplayStartIndex !== null && songToRemoveIndex < autoplayStartIndex) {
             setAutoplayStartIndex(prev => prev !== null ? prev - 1 : null);
        }

        const wasCurrentlyPlaying = songToRemoveIndex === d.currentIndex;
        d.currentQueue.splice(songToRemoveIndex, 1);
        
        if(songToRemoveIndex < d.currentIndex) {
            d.currentIndex -= 1;
        } else if (wasCurrentlyPlaying && d.currentQueue.length > 0) {
            if (d.currentQueue.length <= d.currentIndex) {
                d.currentIndex = 0;
            }
        }
        
        if (d.currentQueue.length === 0) {
            setIsPlaying(false);
            d.currentIndex = -1;
            d.contextId = null;
            d.contextType = null;
            setAutoplayStartIndex(null);
        } else if (wasCurrentlyPlaying) {
            // Re-trigger effect to play the new song at currentIndex
            if (audioRef.current) {
                audioRef.current.dataset.songId = ''; 
            }
        }
    });
  };
  const moveSongInQueue = (songId: string, direction: 'top' | 'bottom') => {
    setAutoplayStartIndex(null);
    updatePlayerQueue(d => {
        const songIndex = d.currentQueue.findIndex(s => s.id === songId);
        if (songIndex === -1 || songIndex === d.currentIndex) return;
        
        const [songToMove] = d.currentQueue.splice(songIndex, 1);
        const insertIndex = direction === 'top' ? d.currentIndex + 1 : d.currentQueue.length;
        d.currentQueue.splice(insertIndex, 0, songToMove);
    });
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentSong) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        const artwork = currentSong.image?.map(img => ({ src: img.url.replace(/^http:/, 'https:'), sizes: img.quality, type: 'image/jpeg' })) || [];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: decodeHtml(currentSong.name), artist: currentSong.artists.primary.map(a => decodeHtml(a.name)).join(', '), album: decodeHtml(currentSong.album.name || ''), artwork: artwork,
        });
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('seekbackward', (d) => seek(Math.max(currentTime - (d.seekOffset || 10), 0)));
        navigator.mediaSession.setActionHandler('seekforward', (d) => seek(Math.min(currentTime + (d.seekOffset || 10), duration)));
      } else {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward'].forEach(h => navigator.mediaSession.setActionHandler(h as any, null));
      }
    }
  }, [currentSong, isPlaying, playPrev, playNext, togglePlay, seek, currentTime, duration]);
  
  const contextValue: PlayerContextType = {
      // Ephemeral state
      isPlaying, duration, currentTime, currentQuality, isQueueOpen, analyser, audioContext, autoplayStartIndex, playbackRate,
      // Persistent state
      currentSong, currentQueue, volume, selectedQuality, isShuffle, repeatMode, eqSettings, isEqEnabled, is8DEnabled, isReverbEnabled, reverbMix, contextId, contextType,
      // Functions
      playSong, togglePlay, seek, setVolume, setSelectedQuality, playNext, playPrev, playRadio, toggleQueue, addSongNext, addSongsToEnd, reorderQueue, removeSongFromQueue, moveSongInQueue,
      toggleShuffle, cycleRepeatMode, toggle8D, setEqGain, resetEq, toggleEq, toggleReverb, setReverbMix, setPlaybackRate,
      // Setters for import
      setIsShuffle: (s: boolean) => updatePlayerSettings(d => { d.isShuffle = s; }),
      setRepeatMode,
      setIsEqEnabled: (e: boolean) => updatePlayerSettings(d => { d.isEqEnabled = e; }),
      setIs8DEnabled: (e: boolean) => updatePlayerSettings(d => { d.is8DEnabled = e; }),
      setIsReverbEnabled: (e: boolean) => updatePlayerSettings(d => { d.isReverbEnabled = e; }),
      setAppState: setAppState as any
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} crossOrigin="anonymous" />
    </PlayerContext.Provider>
  );
};