
import React, { createContext, useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Song, PlayerContextType, PlayerContextTypeString, PlayerSettings, PlayerQueueState, AppState } from '../types';
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
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / sampleRate) / duration, decay);
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
        if (shuffled[i].artists.primary[0]?.id === shuffled[i - 1].artists.primary[0]?.id) {
            const swapIndex = shuffled.findIndex((song, j) => j > i && song.artists.primary[0]?.id !== shuffled[i].artists.primary[0]?.id);
            if (swapIndex !== -1) [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentQuality, setCurrentQuality] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [autoplayStartIndex, setAutoplayStartIndex] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const safePlayerSettings = playerSettings || defaultAppState.settings.player;
  const safePlayerQueue = playerQueue || defaultAppState.playerQueue;
  
  const { volume, selectedQuality, isShuffle, repeatMode, eqSettings, isEqEnabled, is8DEnabled, isReverbEnabled, reverbMix } = safePlayerSettings;
  const { currentQueue, currentIndex, contextType, contextId, originalQueueUnshuffled } = safePlayerQueue;
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioNodesRef = useRef<{
    context: AudioContext | null; source: MediaElementAudioSourceNode | null; eqNodes: BiquadFilterNode[]; panner: PannerNode | null; analyser: AnalyserNode | null; convolver: ConvolverNode | null; reverbWetGain: GainNode | null; reverbDryGain: GainNode | null; pannerOscillator: OscillatorNode | null; pannerGain: GainNode | null; pannerDelay: DelayNode | null;
  }>({ context: null, source: null, eqNodes: [], panner: null, analyser: null, convolver: null, reverbWetGain: null, reverbDryGain: null, pannerOscillator: null, pannerGain: null, pannerDelay: null });
  const seekTimeOnQualityChangeRef = useRef<number | null>(null);
  
  const currentSong = currentQueue[currentIndex] || null;
  
  const updatePlayerSettings = (updater: (draft: PlayerSettings) => void) => setAppState(s => { updater(s.settings.player); });
  const updatePlayerQueue = (updater: (draft: PlayerQueueState) => void) => setAppState(s => { updater(s.playerQueue); });

  useEffect(() => {
    if (!audioRef.current || audioNodesRef.current.context) return;
    const initAudioContext = () => {
        if (audioNodesRef.current.context) return;
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
        if (context.state === 'suspended') context.resume();
        
        const source = context.createMediaElementSource(audioRef.current!);
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

        const pannerOscillator = context.createOscillator(); 
        const pannerGain = context.createGain(); pannerGain.gain.value = 0;
        const pannerDelay = context.createDelay(5.0); 
        
        pannerOscillator.frequency.value = 0.2;
        pannerDelay.delayTime.value = (1 / 0.2) / 4;
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
        d.currentIndex = d.currentQueue.length === 0 ? -1 : (d.currentIndex + 1) % d.currentQueue.length;
    });
  }, [updatePlayerQueue]);

  useEffect(() => {
    if (!currentSong || (currentSong.downloadUrl && currentSong.downloadUrl.length > 0)) return;
    let isCancelled = false;
    getSongsByIds([currentSong.id]).then(res => {
        if (isCancelled) return;
        const fullSongData = res.success && res.data.length > 0 ? res.data[0] : null;
        if (fullSongData && fullSongData.downloadUrl?.length > 0) {
            updatePlayerQueue(d => { d.currentQueue = d.currentQueue.map(s => s.id === currentSong.id ? fullSongData : s); });
        } else {
            playNext();
        }
    }).catch(() => !isCancelled && playNext());
    return () => { isCancelled = true; };
  }, [currentSong, playNext, updatePlayerQueue]);

  const fetchRecommendations = useCallback(async (seedSong: Song): Promise<Song[]> => {
      const collected = new Map<string, Song>([[seedSong.id, seedSong]]);
      const addUnique = (list: Song[]) => list.forEach(s => { if (!collected.has(s.id)) collected.set(s.id, s); });

      try {
          const res = await getSongSuggestions(seedSong.id, 15);
          if (res.success) addUnique(res.data);
      } catch {}

      if (collected.size < 5) {
          try {
              const artistId = seedSong.artists.primary[0]?.id;
              if (artistId) {
                  const res = await getArtistDetails(artistId);
                  if (res.success) {
                       if (res.data.topSongs) addUnique(res.data.topSongs);
                       if (res.data.singles) addUnique(res.data.singles);
                  }
              }
          } catch {}
      }
      
      if (collected.size < 5) {
          try {
              const artistName = seedSong.artists.primary[0]?.name;
              if (artistName) {
                  const res = await searchSongs(artistName, 1, 20);
                  if (res.success) addUnique(res.data.results);
              }
          } catch {}
      }

      if (collected.size < 3) {
           try {
              const query = `${seedSong.name} ${seedSong.artists.primary[0]?.name || ''}`;
              const res = await searchSongs(query, 1, 10);
              if (res.success) addUnique(res.data.results);
           } catch {}
      }
      
      return Array.from(collected.values()).sort(() => Math.random() - 0.5);
  }, []);
  
  const populateQueueWithRadio = useCallback(async (seedSong: Song) => {
      try {
          const newSongs = await fetchRecommendations(seedSong);
          updatePlayerQueue(d => {
            const currentIds = new Set(d.currentQueue.map(qs => qs.id));
            const songsToAdd = newSongs.filter(s => !currentIds.has(s.id));
            if (songsToAdd.length > 0) {
              const oldQueueSize = d.currentQueue.length;
              d.currentQueue.push(...songsToAdd);
              setAutoplayStartIndex(prev => prev === null ? oldQueueSize : prev);
            } else if (d.currentQueue.length < 5) {
                d.currentQueue.push(...newSongs);
            }
          });
      } catch (e) { console.error(e); }
  }, [fetchRecommendations, updatePlayerQueue]);

  const handleEnded = useCallback(async () => {
    if (audioRef.current?.loop) return;
    const isLastSong = currentIndex === currentQueue.length - 1;

    if (isLastSong && repeatMode === 'off' && currentSong) {
       await populateQueueWithRadio(currentSong);
       updatePlayerQueue(d => {
           if (d.currentQueue.length > d.currentIndex + 1) {
               d.currentIndex++;
               setIsPlaying(true);
           } else {
               setIsPlaying(false);
               if (audioRef.current) audioRef.current.currentTime = 0;
           }
       });
    } else {
      updatePlayerQueue(d => { if (d.currentQueue.length > 0) d.currentIndex = (d.currentIndex + 1) % d.currentQueue.length; });
      setIsPlaying(true);
    }
  }, [repeatMode, currentIndex, currentQueue, currentSong, updatePlayerQueue, populateQueueWithRadio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const timeUpdate = () => setCurrentTime(audio.currentTime);
    const loadedMeta = () => setDuration(audio.duration);
    const canPlay = () => {
      if (seekTimeOnQualityChangeRef.current !== null) {
        audio.currentTime = seekTimeOnQualityChangeRef.current;
        seekTimeOnQualityChangeRef.current = null;
      }
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    };
    
    audio.addEventListener('timeupdate', timeUpdate);
    audio.addEventListener('loadedmetadata', loadedMeta);
    audio.addEventListener('canplay', canPlay);
    audio.addEventListener('ended', handleEnded);
    
    if (currentSong) {
      if (currentSong.id !== audio.dataset.songId || selectedQuality !== audio.dataset.quality) {
        const getUrl = (q: string) => currentSong.downloadUrl?.find(i => i.quality === q)?.url;
        const songUrl = getUrl(selectedQuality) || getUrl('320kbps') || getUrl('160kbps') || currentSong.downloadUrl[0]?.url;
        
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
    } else {
      audio.removeAttribute('src');
      audio.dataset.songId = '';
      setCurrentQuality(null);
      if (isPlaying) setIsPlaying(false);
    }
    
    if (isPlaying && audio.src) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();

    audio.volume = volume;
    audio.loop = repeatMode === 'one';
    audio.playbackRate = playbackRate;

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
                d.currentQueue = [currentlyPlaying, ...smartShuffle(others)];
                d.currentIndex = 0;
            }
        } else {
            if (d.originalQueueUnshuffled) {
                const id = d.currentQueue[d.currentIndex]?.id;
                d.currentQueue = d.originalQueueUnshuffled;
                const newIndex = d.currentQueue.findIndex(s => s.id === id);
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
        if(node && eqSettings[i]) node.gain.value = isEqEnabled ? eqSettings[i].gain : 0;
    });
  }, [eqSettings, isEqEnabled]);

  useEffect(() => {
    const { reverbWetGain, reverbDryGain, context } = audioNodesRef.current;
    if (!reverbWetGain || !reverbDryGain || !context) return;
    const wetValue = isReverbEnabled ? reverbMix : 0; 
    const dryValue = 1 - (isReverbEnabled ? reverbMix * 0.5 : 0); 
    reverbWetGain.gain.setTargetAtTime(wetValue, context.currentTime, 0.015);
    reverbDryGain.gain.setTargetAtTime(dryValue, context.currentTime, 0.015);
  }, [isReverbEnabled, reverbMix]);

  useEffect(() => {
    const { pannerGain, context } = audioNodesRef.current;
    if (!pannerGain || !context) return;
    pannerGain.gain.setTargetAtTime(is8DEnabled && isPlaying ? 2.5 : 0, context.currentTime, 0.5);
  }, [is8DEnabled, isPlaying]);

  const cycleRepeatMode = () => updatePlayerSettings(d => {
    if (d.repeatMode === 'off') d.repeatMode = 'all';
    else if (d.repeatMode === 'all') d.repeatMode = 'one';
    else d.repeatMode = 'off';
  });
  
  const togglePlay = useCallback(() => { if (currentSong) setIsPlaying(prev => !prev); }, [currentSong]);
  
  const playPrev = useCallback(() => {
    updatePlayerQueue(d => {
        d.currentIndex = d.currentQueue.length === 0 ? -1 : (d.currentIndex - 1 + d.currentQueue.length) % d.currentQueue.length;
    });
  }, [updatePlayerQueue]);

  const playSong = useCallback(async (song: Song, queue: Song[], playContext: { type: PlayerContextTypeString; id: string; }) => {
    setAutoplayStartIndex(null);
    updatePlayerQueue(d => {
        if (song.id === d.currentQueue[d.currentIndex]?.id) {
            setIsPlaying(p => !p);
            return;
        }
        if (playContext.id === d.contextId && playContext.type === d.contextType && playContext.type !== 'search') {
            const idx = d.currentQueue.findIndex(s => s.id === song.id);
            if (idx !== -1) {
                d.currentIndex = idx;
                setIsPlaying(true);
                return;
            }
        }
        
        let finalQueue = [...queue];
        if (isShuffle) {
            d.originalQueueUnshuffled = [...finalQueue];
            const other = finalQueue.filter(s => s.id !== song.id);
            finalQueue = [song, ...smartShuffle(other)];
        } else {
            d.originalQueueUnshuffled = null;
        }

        d.currentQueue = finalQueue;
        d.contextType = playContext.type;
        d.contextId = playContext.id;
        d.currentIndex = finalQueue.findIndex(s => s.id === song.id);

        if (playContext.type === 'playlist') addToPlaylistHistory(playContext.id);
        setIsPlaying(true);
        addToHistory(song);
    });

    if (queue.length === 1) populateQueueWithRadio(song);
  }, [isPlaying, isShuffle, updatePlayerQueue, addToHistory, addToPlaylistHistory, populateQueueWithRadio]);

  const playRadio = useCallback(async (song: Song) => {
    setIsPlaying(false); 
    const suggestions = await fetchRecommendations(song);
    const radioQueue = [song, ...suggestions].filter((s, i, self) => i === self.findIndex(t => t.id === s.id));
    
    setAutoplayStartIndex(1);
    updatePlayerQueue(d => {
        if (isShuffle) {
            d.originalQueueUnshuffled = [...radioQueue];
            d.currentQueue = [radioQueue[0], ...smartShuffle(radioQueue.slice(1))];
        } else {
            d.originalQueueUnshuffled = null;
            d.currentQueue = radioQueue;
        }
        d.contextType = 'song';
        d.contextId = song.id;
        d.currentIndex = 0;
    });
    setIsPlaying(true);
    addToHistory(song);
  }, [isShuffle, updatePlayerQueue, addToHistory, fetchRecommendations]);

  const toggleQueue = useCallback((force?: boolean) => {
      setIsQueueOpen(p => force !== undefined ? force : !p);
  }, []);

  const toggleLyrics = useCallback((force?: boolean) => {
      setIsLyricsOpen(p => force !== undefined ? force : !p);
  }, []);

  const seek = useCallback((time: number) => { if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); } }, []);
  const setVolume = (v: number) => updatePlayerSettings(d => { d.volume = Math.max(0, Math.min(1, v)); });
  const setSelectedQuality = (q: string) => updatePlayerSettings(d => { d.selectedQuality = q; });
  const setReverbMix = (mix: number) => updatePlayerSettings(d => { d.reverbMix = mix; });

  const addSongNext = (song: Song) => {
    setAutoplayStartIndex(p => p !== null ? p + 1 : null);
    updatePlayerQueue(d => {
        if (d.currentQueue.length === 0) {
             d.currentQueue = [song]; d.currentIndex = 0; d.contextType = 'queue'; d.contextId = 'queue'; setIsPlaying(true);
        } else d.currentQueue.splice(d.currentIndex + 1, 0, song);
    });
  };
  
  const addSongsToEnd = (songs: Song[]) => {
    updatePlayerQueue(d => {
        const songsToAdd = songs.filter(s => !d.currentQueue.some(qs => qs.id === s.id));
        d.currentQueue.push(...songsToAdd);
        if (d.currentIndex === -1 && songsToAdd.length > 0) {
            d.currentIndex = d.currentQueue.length - songsToAdd.length;
            d.contextType = 'queue'; d.contextId = 'queue'; setIsPlaying(true);
        }
    });
  };

  const reorderQueue = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    setAutoplayStartIndex(null);
    updatePlayerQueue(d => {
        const [moved] = d.currentQueue.splice(oldIndex, 1);
        d.currentQueue.splice(newIndex, 0, moved);
        d.currentIndex = d.currentQueue.findIndex(s => s.id === d.currentQueue[d.currentIndex]?.id);
    });
  };

  const removeSongFromQueue = (songId: string) => {
    updatePlayerQueue(d => {
        const idx = d.currentQueue.findIndex(s => s.id === songId);
        if(idx === -1) return;
        if (autoplayStartIndex !== null && idx < autoplayStartIndex) setAutoplayStartIndex(p => p !== null ? p - 1 : null);

        const wasPlaying = idx === d.currentIndex;
        d.currentQueue.splice(idx, 1);
        
        if(idx < d.currentIndex) d.currentIndex--;
        else if (wasPlaying && d.currentQueue.length > 0 && d.currentQueue.length <= d.currentIndex) d.currentIndex = 0;
        
        if (d.currentQueue.length === 0) {
            setIsPlaying(false); d.currentIndex = -1; d.contextId = null; d.contextType = null; setAutoplayStartIndex(null);
        } else if (wasPlaying && audioRef.current) audioRef.current.dataset.songId = ''; 
    });
  };

  const moveSongInQueue = (songId: string, direction: 'top' | 'bottom') => {
    setAutoplayStartIndex(null);
    updatePlayerQueue(d => {
        const idx = d.currentQueue.findIndex(s => s.id === songId);
        if (idx === -1 || idx === d.currentIndex) return;
        const [song] = d.currentQueue.splice(idx, 1);
        d.currentQueue.splice(direction === 'top' ? d.currentIndex + 1 : d.currentQueue.length, 0, song);
    });
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentSong) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        navigator.mediaSession.metadata = new MediaMetadata({
          title: decodeHtml(currentSong.name), 
          artist: currentSong.artists.primary.map(a => decodeHtml(a.name)).join(', '), 
          album: decodeHtml(currentSong.album.name || ''), 
          artwork: currentSong.image?.map(img => ({ src: img.url.replace(/^http:/, 'https:'), sizes: img.quality, type: 'image/jpeg' })) || []
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
      isPlaying, duration, currentTime, currentQuality, isQueueOpen, isLyricsOpen, analyser, audioContext, autoplayStartIndex, playbackRate,
      currentSong, currentQueue, volume, selectedQuality, isShuffle, repeatMode, eqSettings, isEqEnabled, is8DEnabled, isReverbEnabled, reverbMix, contextId, contextType,
      playSong, togglePlay, seek, setVolume, setSelectedQuality, playNext, playPrev, playRadio, toggleQueue, toggleLyrics, addSongNext, addSongsToEnd, reorderQueue, removeSongFromQueue, moveSongInQueue,
      toggleShuffle, cycleRepeatMode, toggle8D, setEqGain, resetEq, toggleEq, toggleReverb, setReverbMix, setPlaybackRate,
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
