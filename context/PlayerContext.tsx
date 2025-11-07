
import React, { createContext, useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Song } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserMusicContext } from './UserMusicContext';
import { getSongsByIds } from '../services/jioSaavnApi';

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
}

export const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType);

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

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextInitiated = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const initAudioContext = () => {
      if (audioContextInitiated.current || !audio) return;
      audioContextInitiated.current = true;
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (context.state === 'suspended') {
          context.resume();
      }
      const source = context.createMediaElementSource(audio);
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      analyserNode.connect(context.destination);
      setAnalyser(analyserNode);
    };

    document.body.addEventListener('click', initAudioContext, { once: true });
    document.body.addEventListener('keydown', initAudioContext, { once: true });
    
    return () => {
      document.body.removeEventListener('click', initAudioContext);
      document.body.removeEventListener('keydown', initAudioContext);
    }
  }, []);
  
  const currentSong = currentIndex >= 0 && currentIndex < currentQueue.length ? currentQueue[currentIndex] : null;

  const toggleShuffle = () => setIsShuffle(prev => !prev);

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
    
    if (currentSong && currentSong.downloadUrl && currentSong.downloadUrl.length > 0) {
      const getUrlForQuality = (quality: string) => currentSong.downloadUrl?.find(q => q.quality === quality)?.url;
      const songUrl = getUrlForQuality(selectedQuality) || getUrlForQuality('320kbps') || getUrlForQuality('160kbps') || getUrlForQuality('96kbps') || currentSong.downloadUrl[0]?.url;

      if (songUrl) {
          const httpsUrl = songUrl.replace(/^http:/, 'https:');
          const qualityLabel = currentSong.downloadUrl.find(q => q.url.replace(/^http:/, 'https:') === httpsUrl)?.quality || null;
          setCurrentQuality(qualityLabel);
          if (audio.src !== httpsUrl) {
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
  }, [currentSong, selectedQuality, playNext, isPlaying]);


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
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.loop = repeatMode === 'one';

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    
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

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, repeatMode, isShuffle, playRandom, currentIndex, currentQueue.length, playNext]);
  
  const togglePlay = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

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


  return (
    <PlayerContext.Provider value={{ currentSong, isPlaying, duration, currentTime, volume, playSong, togglePlay, seek, setVolume: handleSetVolume, playNext, playPrev, currentQueue, selectedQuality, setSelectedQuality, currentQuality, isQueueOpen, toggleQueue, addSongNext, addSongsToEnd, reorderQueue, removeSongFromQueue, moveSongInQueue, isShuffle, repeatMode, toggleShuffle, cycleRepeatMode, analyser }}>
      {children}
      <audio ref={audioRef} crossOrigin="anonymous" />
    </PlayerContext.Provider>
  );
};
