import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Song } from '../types';
import { PlayerContext } from '../context/PlayerContext';

export const usePreviewPlayer = () => {
  const { isPlaying: isMainPlayerPlaying, togglePlay: toggleMainPlay } = useContext(PlayerContext);
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const resetPreviewState = useCallback(() => {
    const audio = previewAudioRef.current;
    if (audio) {
      if (!audio.paused) {
        audio.pause();
      }
      audio.currentTime = 0;
      audio.src = '';
    }
    setIsPreviewPlaying(false);
    setPreviewingSongId(null);
    setPreviewProgress(0);
  }, []);

  useEffect(() => {
    // Initialize audio element once
    previewAudioRef.current = new Audio();
    const audio = previewAudioRef.current;

    const onPlay = () => setIsPreviewPlaying(true);
    const onPause = () => setIsPreviewPlaying(false);
    const onEnded = () => resetPreviewState();
    const onTimeUpdate = () => {
      if (audio && !audio.paused) {
        const currentTime = audio.currentTime;
        if (currentTime >= 30) {
          resetPreviewState();
        } else {
          setPreviewProgress((currentTime / 30) * 100);
        }
      }
    };
    const onLoadedData = () => setPreviewProgress(0);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadeddata', onLoadedData);
    
    // Cleanup function
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadeddata', onLoadedData);
      if (audio && !audio.paused) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [resetPreviewState]);

  // Effect for exclusive playback
  useEffect(() => {
    if (isMainPlayerPlaying && isPreviewPlaying) {
      resetPreviewState();
    }
  }, [isMainPlayerPlaying, isPreviewPlaying, resetPreviewState]);

  const handlePreview = useCallback((e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    const audio = previewAudioRef.current;
    if (!audio) return;

    const isCurrentlyPreviewingThisSong = previewingSongId === song.id;

    if (isCurrentlyPreviewingThisSong) {
      if (audio.paused) {
        if (isMainPlayerPlaying) toggleMainPlay();
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    } else {
      if (isMainPlayerPlaying) toggleMainPlay();
      
      const previewUrl = song.downloadUrl.find(q => q.quality === '96kbps')?.url || song.downloadUrl[0]?.url;
      if (previewUrl) {
        setPreviewingSongId(song.id);
        setIsPreviewPlaying(true); // Set to true immediately for better UI feedback
        setPreviewProgress(0);
        audio.src = previewUrl.replace(/^http:/, 'https:');
        audio.load();
        audio.play().catch(err => {
          console.error("Preview play failed:", err);
          if (err.name !== 'AbortError') {
            resetPreviewState();
          }
        });
      } else {
        console.warn('No preview URL for song:', song.name);
        resetPreviewState();
      }
    }
  }, [isMainPlayerPlaying, toggleMainPlay, previewingSongId, resetPreviewState]);

  return {
    previewingSongId,
    isPreviewPlaying,
    previewProgress,
    handlePreview,
  };
};
