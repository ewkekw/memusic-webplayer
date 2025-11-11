

import React, { createContext, useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Song } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserMusicContext } from './UserMusicContext';
import { getSongsByIds } from '../services/jioSaavnApi';

const decodeHtml = (html: string | null) => {
    if (!html) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

const eqBands = [
    { f: 60, type: 'lowshelf' as const },
    { f: 230, type: 'peaking' as const },
    { f: 910, type: 'peaking' as const },
    { f: 3600, type: 'peaking' as const },
    { f: 14000, type: 'highshelf' as const },
];

export interface EqSetting {
    gain: number;
}
interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  selectedQuality: string;
  currentQuality: string | null;
  playSong: (song: Song, queue?: Song[], playlistId?: string) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSelectedQuality: (quality: string) => void;
  playNext: () => void;
  playPrev: () => void;
  currentQueue: Song[];
  isQueueOpen: boolean;
  toggleQueue: () => void;
  addSongNext: (song: Song) => void;
  addSongsToEnd: (songs: Song[]) => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  removeSongFromQueue: (songId: string) => void;
  moveSongInQueue: (songId: string, direction: 'top' | 'bottom') => void;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  analyser: AnalyserNode | null;
  is8DEnabled: boolean;
  toggle8D: () => void;
  eqSettings: EqSetting[];
  setEqGain: (bandIndex: number, gain: number) => void;
  resetEq: () => void;
  isEqEnabled: boolean;
  toggleEq: () => void;
  isReverbEnabled: boolean;
  toggleReverb: () => void;
  reverbMix: number;
  setReverbMix: (mix: number) => void;
  audioContext: AudioContext | null;
}

export const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType);

const createImpulseResponse = (context: AudioContext): AudioBuffer => {
    const sampleRate = context.sampleRate;
    const duration = 2;
    const decay = 2;
    const numChannels = 2;
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

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToPlaylistHistory } = useContext(UserMusicContext);
  const [currentQueue, setCurrentQueue] = useLocalStorage<Song[]>('metromusic-queue', []);
  const [currentIndex, setCurrentIndex] = useLocalStorage<number>('metromusic-queue-index', -1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useLocalStorage('metromusic-volume', 1);
  const [selectedQuality, setSelectedQuality] = useLocalStorage('metromusic-quality', '320kbps');
  const [currentQuality, setCurrentQuality] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isShuffle, setIsShuffle] = useLocalStorage('metromusic-shuffle', false);
  const [repeatMode, setRepeatMode] = useLocalStorage<'off' | 'all' | 'one'>('metromusic-repeat', 'off');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  const [eqSettings, setEqSettings] = useLocalStorage<EqSetting[]>('metromusic-eq', eqBands.map(() => ({ gain: 0 })));
  const [isEqEnabled, setIsEqEnabled] = useLocalStorage('metromusic-eq-enabled', false);
  const [is8DEnabled, setIs8DEnabled] = useLocalStorage('metromusic-8d-enabled', false);
  const [isReverbEnabled, setIsReverbEnabled] = useLocalStorage('metromusic-reverb-enabled', false);
  const [reverbMix, setReverbMix] = useLocalStorage('metromusic-reverb-mix', 0.3);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioNodesRef = useRef<{
    context: AudioContext | null;
    source: MediaElementAudioSourceNode | null;
    eqNodes: BiquadFilterNode[];
    panner: PannerNode | null;
    analyser: AnalyserNode | null;
    convolver: ConvolverNode | null;
    reverbWetGain: GainNode | null;
    reverbDryGain: GainNode | null;
    pannerOscillator: OscillatorNode | null;
    pannerGain: GainNode | null;
    pannerDelay: DelayNode | null;
  }>({ context: null, source: null, eqNodes: [], panner: null, analyser: null, convolver: null, reverbWetGain: null, reverbDryGain: null, pannerOscillator: null, pannerGain: null, pannerDelay: null });

  const seekTimeOnQualityChangeRef = useRef<number | null>(null);
  const prevSongIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initAudioContext = () => {
        if (audioNodesRef.current.context || !audioRef.current) return;
        
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
        if (context.state === 'suspended') {
            context.resume();
        }
        const source = context.createMediaElementSource(audioRef.current);
        const panner = context.createPanner();
        panner.panningModel = 'HRTF';
        
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;
        
        const eqNodes = eqBands.map((band, i) => {
            const filter = context.createBiquadFilter();
            filter.type = band.type;
            filter.frequency.value = band.f;
            filter.gain.value = isEqEnabled ? eqSettings[i].gain : 0;
            return filter;
        });
    
        let lastNode: AudioNode = source;
        eqNodes.forEach(filter => {
            lastNode.connect(filter);
            lastNode = filter;
        });

        const convolver = context.createConvolver();
        convolver.buffer = createImpulseResponse(context);
        const reverbWetGain = context.createGain();
        const reverbDryGain = context.createGain();
        reverbWetGain.gain.value = 0;
        reverbDryGain.gain.value = 1;
    
        lastNode.connect(reverbDryGain);
        lastNode.connect(convolver);
        convolver.connect(reverbWetGain);
    
        reverbDryGain.connect(panner);
        reverbWetGain.connect(panner);
        
        // 8D Audio Nodes (using oscillators for background-safe animation)
        const pannerOscillator = context.createOscillator();
        const pannerFrequency = 0.2; // ~5 second rotation
        pannerOscillator.frequency.setValueAtTime(pannerFrequency, context.currentTime);
        const pannerGain = context.createGain();
        pannerGain.gain.setValueAtTime(0, context.currentTime); // Start disabled
        const pannerDelay = context.createDelay();
        pannerDelay.delayTime.setValueAtTime((1 / pannerFrequency) / 4, context.currentTime); // 90-degree phase shift

        pannerOscillator.connect(pannerGain);
        pannerGain.connect(panner.positionZ); // Sine component
        pannerGain.connect(pannerDelay);
        pannerDelay.connect(panner.positionX); // Cosine (delayed sine) component
        pannerOscillator.start();

        panner.connect(analyserNode);
        analyserNode.connect(context.destination);
    
        audioNodesRef.current = { context, source, eqNodes, panner, analyser: analyserNode, convolver, reverbWetGain, reverbDryGain, pannerOscillator, pannerGain, pannerDelay };
        setAnalyser(analyserNode);
    };

    document.body.addEventListener('click', initAudioContext, { once: true });
    document.body.addEventListener('keydown', initAudioContext, { once: true });
    
    return () => {
      document.body.removeEventListener('click', initAudioContext);
      document.body.removeEventListener('keydown', initAudioContext);
    }
  }, [eqSettings, isEqEnabled]);
  
  const currentSong = currentIndex >= 0 && currentIndex < currentQueue.length ? currentQueue[currentIndex] : null;

  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const toggleEq = () => setIsEqEnabled(prev => !prev);
  const toggle8D = () => setIs8DEnabled(prev => !prev);
  const toggleReverb = () => setIsReverbEnabled(prev => !prev);

  const setEqGain = (bandIndex: number, gain: number) => {
    setEqSettings(prev => {
        const newSettings = [...prev];
        newSettings[bandIndex].gain = gain;
        return newSettings;
    });
  };

  const resetEq = () => {
    setEqSettings(eqBands.map(() => ({ gain: 0 })));
  };

  useEffect(() => {
    audioNodesRef.current.eqNodes.forEach((node, i) => {
        if(node && eqSettings[i]){
            node.gain.value = isEqEnabled ? eqSettings[i].gain : 0;
        }
    });
  }, [eqSettings, isEqEnabled]);

  useEffect(() => {
    const { reverbWetGain, reverbDryGain, context } = audioNodesRef.current;
    if (!reverbWetGain || !reverbDryGain || !context) return;
  
    const wetValue = isReverbEnabled ? reverbMix : 0;
    // Keep the dry signal at full volume to avoid perceived loudness drop.
    // The reverb is ADDED to the original signal.
    const dryValue = 1; 
  
    const transitionTime = 0.015;
    reverbWetGain.gain.setTargetAtTime(wetValue, context.currentTime, transitionTime);
    reverbDryGain.gain.setTargetAtTime(dryValue, context.currentTime, transitionTime);
  }, [isReverbEnabled, reverbMix]);

  useEffect(() => {
    const { pannerGain, context } = audioNodesRef.current;
    if (!pannerGain || !context) return;
    
    const radius = 2.5;
    const transitionTime = 0.5; // Smoothly fade effect in/out

    if (is8DEnabled && isPlaying) {
        pannerGain.gain.setTargetAtTime(radius, context.currentTime, transitionTime);
    } else {
        pannerGain.gain.setTargetAtTime(0, context.currentTime, transitionTime);
    }
  }, [is8DEnabled, isPlaying]);


  const cycleRepeatMode = () => {
    setRepeatMode(prev => {
        if (prev === 'off') return 'all';
        if (prev === 'all') return 'one';
        return 'off';
    });
  };

  const playRandom = useCallback(() => {
    if (currentQueue.length === 0) return;
    if (currentQueue.length === 1) {
        setCurrentIndex(0);
        return;
    }
    let nextIndex;
    do {
        nextIndex = Math.floor(Math.random() * currentQueue.length);
    } while (nextIndex === currentIndex);
    setCurrentIndex(nextIndex);
  }, [currentQueue.length, currentIndex, setCurrentIndex]);

  const playNext = useCallback(() => {
    if (currentQueue.length === 0) return;
    if (isShuffle) {
        playRandom();
    } else {
        const nextIndex = (currentIndex + 1) % currentQueue.length;
        setCurrentIndex(nextIndex);
    }
  }, [currentQueue.length, currentIndex, isShuffle, playRandom, setCurrentIndex]);

  const playPrev = useCallback(() => {
    if (currentQueue.length > 0) {
      if (isShuffle) {
        playRandom();
      } else {
        const prevIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
        setCurrentIndex(prevIndex);
      }
    }
  }, [currentQueue.length, currentIndex, isShuffle, playRandom, setCurrentIndex]);

  const playSong = (song: Song, queue?: Song[], playlistId?: string) => {
    const newQueue = queue && queue.length > 0 ? queue : [song];
    setCurrentQueue(newQueue);
    const songIndex = newQueue.findIndex(s => s.id === song.id);
    setCurrentIndex(songIndex !== -1 ? songIndex : 0);
    setIsPlaying(true);
    if (playlistId) {
      addToPlaylistHistory(playlistId);
    }
  };

  const toggleQueue = useCallback(() => {
    setIsQueueOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current && currentSong) {
        localStorage.setItem(
          'metromusic-last-played',
          JSON.stringify({ songId: currentSong.id, time: audioRef.current.currentTime })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSong]);
  
  useEffect(() => {
    if (!currentSong || (currentSong.downloadUrl && currentSong.downloadUrl.length > 0)) {
      return;
    }

    let isCancelled = false;
    
    const fetchSongDetails = async () => {
      try {
        const res = await getSongsByIds([currentSong.id]);
        const fullSongData = res.success && res.data.length > 0 ? res.data[0] : null;

        if (isCancelled) return;

        if (fullSongData && fullSongData.downloadUrl?.length > 0) {
          setCurrentQueue(prev => prev.map(s => s.id === currentSong.id ? fullSongData : s));
        } else {
          playNext();
        }
      } catch (error) {
        if (!isCancelled) {
          playNext();
        }
      }
    };

    fetchSongDetails();

    return () => {
      isCancelled = true;
    };
  }, [currentSong, playNext, setCurrentQueue]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const isDifferentSong = prevSongIdRef.current !== currentSong?.id;
    prevSongIdRef.current = currentSong?.id ?? null;

    if (currentSong && currentSong.downloadUrl && currentSong.downloadUrl.length > 0) {
        const getUrlForQuality = (quality: string) => currentSong.downloadUrl?.find(q => q.quality === quality)?.url;
        const songUrl = getUrlForQuality(selectedQuality) || getUrlForQuality('320kbps') || getUrlForQuality('160kbps') || getUrlForQuality('96kbps') || currentSong.downloadUrl[0]?.url;

        if (songUrl) {
            const httpsUrl = songUrl.replace(/^http:/, 'https:');
            const qualityLabel = currentSong.downloadUrl.find(q => q.url.replace(/^http:/, 'https:') === httpsUrl)?.quality || null;
            setCurrentQuality(qualityLabel);
            
            if (audio.src !== httpsUrl) {
                if (isDifferentSong) {
                    seekTimeOnQualityChangeRef.current = null; 
                    audio.currentTime = 0;
                } else {
                    const timeToSeek = audio.currentTime;
                    seekTimeOnQualityChangeRef.current = timeToSeek > 0 ? timeToSeek : null;
                }
                audio.src = httpsUrl;
            }
        } else {
            playNext();
        }
    } else if (!currentSong) {
        audio.src = '';
        setCurrentQuality(null);
        if (isPlaying) setIsPlaying(false);
    }
}, [currentSong, selectedQuality, playNext]);


  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
          if (!audio.src) return;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  if (error.name !== 'AbortError') {
                      setIsPlaying(false);
                  }
              });
          }
      } else {
          audio.pause();
      }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.loop = repeatMode === 'one';

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    
    const handleCanPlay = () => {
      if (seekTimeOnQualityChangeRef.current) {
        audio.currentTime = seekTimeOnQualityChangeRef.current;
        seekTimeOnQualityChangeRef.current = null;
      }
      if (isPlaying) {
        audio.play().catch(error => {
          if (error.name !== 'AbortError') {
            console.error("Autoplay after quality change failed:", error);
            setIsPlaying(false);
          }
        });
      }
    };

    const handleEnded = () => {
        if (audio.loop) return;
        if (isShuffle) {
            playRandom();
            setIsPlaying(true);
            return;
        }
        const isLastSong = currentIndex === currentQueue.length - 1;
        if (isLastSong && repeatMode === 'off') {
            setIsPlaying(false);
            if (audio) audio.currentTime = 0;
        } else {
            playNext();
            setIsPlaying(true);
        }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [volume, repeatMode, isShuffle, playRandom, currentIndex, currentQueue.length, playNext, isPlaying]);
  
  const togglePlay = useCallback(() => {
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleSetVolume = (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(clampedVolume);
      if (audioRef.current) {
        audioRef.current.volume = clampedVolume;
      }
  };

  const addSongNext = (song: Song) => {
    if (currentQueue.length === 0 || currentIndex === -1) {
      playSong(song, [song]);
    } else {
      const newQueue = [...currentQueue];
      newQueue.splice(currentIndex + 1, 0, song);
      setCurrentQueue(newQueue);
    }
  };

  const addSongsToEnd = (songs: Song[]) => {
    const newQueue = [...currentQueue];
    const songsToAdd = songs.filter(s => !newQueue.some(qs => qs.id === s.id));
    setCurrentQueue([...newQueue, ...songsToAdd]);
    if (currentIndex === -1 && songsToAdd.length > 0) {
      setCurrentIndex(newQueue.length);
      setIsPlaying(true);
    }
  };

  const reorderQueue = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    const newQueue = [...currentQueue];
    const [movedSong] = newQueue.splice(oldIndex, 1);
    newQueue.splice(newIndex, 0, movedSong);
    const newCurrentIndex = newQueue.findIndex(s => s.id === currentSong?.id);
    setCurrentQueue(newQueue);
    setCurrentIndex(newCurrentIndex);
  };
  
  const removeSongFromQueue = (songId: string) => {
    const songToRemoveIndex = currentQueue.findIndex(s => s.id === songId);
    if(songToRemoveIndex === -1) return;
    const newQueue = currentQueue.filter(s => s.id !== songId);
    if(songToRemoveIndex < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    } else if (songToRemoveIndex === currentIndex) {
        if (newQueue.length <= songToRemoveIndex && newQueue.length > 0) {
            setCurrentIndex(0);
        }
    }
    setCurrentQueue(newQueue);
    if (newQueue.length === 0) {
      setIsPlaying(false);
      setCurrentIndex(-1);
    }
  };

  const moveSongInQueue = (songId: string, direction: 'top' | 'bottom') => {
    const songIndex = currentQueue.findIndex(s => s.id === songId);
    if (songIndex === -1) return;
    if (direction === 'top' && songIndex === 0) return;
    if (direction === 'bottom' && songIndex === currentQueue.length - 1) return;
    const newQueue = [...currentQueue];
    const [songToMove] = newQueue.splice(songIndex, 1);
    if(direction === 'top') {
      newQueue.unshift(songToMove);
    } else {
      newQueue.push(songToMove);
    }
    const newCurrentIndex = newQueue.findIndex(s => s.id === currentSong?.id);
    setCurrentQueue(newQueue);
    setCurrentIndex(newCurrentIndex);
  };

  // Media Session API Integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentSong) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        
        const artwork = currentSong.image?.map(img => ({
          src: img.url.replace(/^http:/, 'https:'),
          sizes: img.quality,
          type: 'image/jpeg', 
        })) || [];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: decodeHtml(currentSong.name),
          artist: currentSong.artists.primary.map(a => decodeHtml(a.name)).join(', '),
          album: decodeHtml(currentSong.album.name || ''),
          artwork: artwork,
        });

        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const skipTime = details.seekOffset || 10;
            seek(Math.max(currentTime - skipTime, 0));
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const skipTime = details.seekOffset || 10;
            seek(Math.min(currentTime + skipTime, duration));
        });
      } else {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
      }
    }
  }, [currentSong, isPlaying, playPrev, playNext, togglePlay, seek, currentTime, duration]);

  return (
    <PlayerContext.Provider value={{ currentSong, isPlaying, duration, currentTime, volume, playSong, togglePlay, seek, setVolume: handleSetVolume, playNext, playPrev, currentQueue, selectedQuality, setSelectedQuality, currentQuality, isQueueOpen, toggleQueue, addSongNext, addSongsToEnd, reorderQueue, removeSongFromQueue, moveSongInQueue, isShuffle, repeatMode, toggleShuffle, cycleRepeatMode, analyser, is8DEnabled, toggle8D, eqSettings, setEqGain, resetEq, isEqEnabled, toggleEq, isReverbEnabled, toggleReverb, reverbMix, setReverbMix, audioContext }}>
      {children}
      <audio ref={audioRef} crossOrigin="anonymous" />
    </PlayerContext.Provider>
  );
};