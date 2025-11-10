

import React, { useContext, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { CreatePlaylistForm } from '../ui/CreatePlaylistForm';
import { ModalContext } from '../../App';
import { Song } from '../../types';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="3" height="14" rx="1" />
    <rect x="15" y="5" width="3" height="14" rx="1" />
  </svg>
);
const NextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path className="chevron-inner" strokeLinecap="round" strokeLinejoin="round" d="M13 5l5 7-5 7" />
        <path className="chevron-outer" strokeLinecap="round" strokeLinejoin="round" d="M6 5l5 7-5 7" />
    </svg>
);
const PrevIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path className="chevron-inner" strokeLinecap="round" strokeLinejoin="round" d="M11 19l-5-7 5-7" />
        <path className="chevron-outer" strokeLinecap="round" strokeLinejoin="round" d="M18 19l-5-7 5-7" />
    </svg>
);
const VolumeUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);
const VolumeDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9.75a3 3 0 010 4.5M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);
const VolumeMuteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);
const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
);

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const decodeHtml = (html: string | null) => {
    if (!html) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

const SongInfo: React.FC<{ song: Song; navigateToArtist: (id: string) => void }> = ({ song, navigateToArtist }) => {
    const smallImage = song.image?.find(img => img.quality === '50x50')?.url || song.image?.[0]?.url;
    return (
        <div className="flex items-center space-x-4 min-w-0 overflow-hidden">
            {smallImage && <img src={smallImage} alt={decodeHtml(song.name)} className="w-14 h-14 rounded-md shadow-lg flex-shrink-0" />}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate" title={decodeHtml(song.name)}>{decodeHtml(song.name)}</h3>
                <p className="text-sm text-gray-400 truncate">
                    {song.artists.primary.map((artist, index) => (
                        <React.Fragment key={artist.id}>
                            <span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:underline cursor-pointer" title={decodeHtml(artist.name)}>
                                {decodeHtml(artist.name)}
                            </span>
                            {index < song.artists.primary.length - 1 && ', '}
                        </React.Fragment>
                    ))}
                </p>
            </div>
        </div>
    );
};

const PlayerControls: React.FC<{
    isPlaying: boolean;
    isShuffle: boolean;
    repeatMode: 'off' | 'all' | 'one';
    togglePlay: () => void;
    playPrev: () => void;
    playNext: () => void;
    toggleShuffle: () => void;
    cycleRepeatMode: () => void;
}> = ({ isPlaying, isShuffle, repeatMode, togglePlay, playPrev, playNext, toggleShuffle, cycleRepeatMode }) => {
    const prevButtonRef = useRef<HTMLButtonElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    const handleAnimation = (buttonRef: React.RefObject<HTMLButtonElement>, animationClass: string) => {
        const button = buttonRef.current;
        if (button) {
            button.classList.remove(animationClass);
            void button.offsetWidth; // Trigger reflow to restart animation
            button.classList.add(animationClass);
            button.addEventListener('animationend', () => button.classList.remove(animationClass), { once: true });
        }
    };

    const handlePlayPrev = () => {
        playPrev();
        handleAnimation(prevButtonRef, 'animate-skip-prev');
    };

    const handlePlayNext = () => {
        playNext();
        handleAnimation(nextButtonRef, 'animate-skip-next');
    };

    return (
        <div className="flex items-center space-x-2">
            <button onClick={toggleShuffle} title="Shuffle" className={`relative transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 ${isShuffle ? 'text-[#fc4b08]' : 'text-gray-400 hover:text-white'}`}>
                <span className="font-bold text-lg leading-none transition-transform duration-200 ease-in-out group-hover:scale-105">S</span>
                <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fc4b08] rounded-full transition-transform duration-200 ease-out origin-bottom ${isShuffle ? 'scale-y-100' : 'scale-y-0'}`}></div>
            </button>
            <button ref={prevButtonRef} onClick={handlePlayPrev} className="group text-gray-300 hover:text-[#fc4b08] transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95"><PrevIcon className="w-6 h-6 chevron-prev" /></button>
            <button 
                onClick={togglePlay} 
                className={`w-10 h-10 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 hover:shadow-xl hover:shadow-[#fc4b08]/40 transition-all duration-200 active:scale-95 play-pause-container ${isPlaying ? 'is-playing' : ''}`}
            >
                <PauseIcon className="w-6 h-6 pause-icon" />
                <PlayIcon className="w-6 h-6 play-icon" />
            </button>
            <button ref={nextButtonRef} onClick={handlePlayNext} className="group text-gray-300 hover:text-[#fc4b08] transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95"><NextIcon className="w-6 h-6 chevron-next" /></button>
            <button onClick={cycleRepeatMode} title={`Repeat: ${repeatMode}`} className={`relative transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 ${repeatMode !== 'off' ? 'text-[#fc4b08]' : 'text-gray-400 hover:text-white'}`}>
                <span className="font-bold text-lg leading-none transition-transform duration-200 ease-in-out group-hover:scale-105">R</span>
                <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fc4b08] rounded-full transition-transform duration-200 ease-out origin-bottom ${repeatMode !== 'off' ? 'scale-y-100' : 'scale-y-0'}`}></div>
                <span className={`absolute top-0 right-1.5 text-[#fc4b08] text-[10px] font-bold leading-none transition-all duration-200 ease-out ${repeatMode === 'one' ? 'opacity-100 translate-y-0.5' : 'opacity-0 -translate-y-1'}`}>1</span>
            </button>
        </div>
    );
};

const PlayerProgressBar: React.FC<{
    currentTime: number;
    duration: number;
    seek: (time: number) => void;
}> = ({ currentTime, duration, seek }) => {
    const progressBarRef = useRef<HTMLDivElement>(null);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekTime, setSeekTime] = useState(0);

    const progress = useMemo(() => {
        const time = isSeeking ? seekTime : currentTime;
        return duration > 0 ? (time / duration) * 100 : 0;
    }, [isSeeking, seekTime, currentTime, duration]);

    const calculateSeekTime = useCallback((clientX: number) => {
        if (!progressBarRef.current || duration <= 0) return 0;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const newTime = (clickX / rect.width) * duration;
        return Math.max(0, Math.min(newTime, duration));
    }, [duration]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsSeeking(true);
        const newTime = calculateSeekTime(e.clientX);
        setSeekTime(newTime);
    };

    useEffect(() => {
        if (!isSeeking) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newTime = calculateSeekTime(e.clientX);
            setSeekTime(newTime);
        };
        const handleMouseUp = (e: MouseEvent) => {
            setIsSeeking(false);
            const finalTime = calculateSeekTime(e.clientX);
            seek(finalTime);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isSeeking, calculateSeekTime, seek]);
    
    return (
        <div className="w-full flex items-center space-x-2">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(isSeeking ? seekTime : currentTime)}</span>
            <div 
                ref={progressBarRef}
                className={`w-full h-1.5 bg-gray-600/50 rounded-full group cursor-pointer relative ${isSeeking ? 'seeking' : ''}`}
                onMouseDown={handleMouseDown}
            >
                <div className="bg-[#fc4b08] h-1.5 rounded-full group-hover:bg-[#ff5f22] progress-bar-fill" style={{ width: `${progress}%` }} />
                <div 
                    className="w-3 h-3 bg-white rounded-full absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 progress-bar-thumb"
                    style={{ left: `${progress}%` }}
                />
            </div>
            <span className="text-xs text-gray-400 w-10 text-left">{formatTime(duration)}</span>
        </div>
    );
};

const PlayerActionButton: React.FC<{
    onClick?: () => void;
    title: string;
    children: React.ReactNode;
    isActive?: boolean;
    isDisabled?: boolean;
    className?: string;
}> = ({ onClick, title, children, isActive = false, isDisabled = false, className = '' }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={isDisabled}
        className={`flex items-center justify-center h-10 px-3 rounded-md transition-all duration-200 ease-in-out ${isActive ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const PlayerActions: React.FC<{
    onDownload: () => void;
    isDownloading: boolean;
    onAddToPlaylist: () => void;
    onToggleFavorite: () => void;
    isHeartAnimating: boolean;
}> = ({ onDownload, isDownloading, onAddToPlaylist, onToggleFavorite, isHeartAnimating }) => {
    const playerContext = useContext(PlayerContext);
    const userMusicContext = useContext(UserMusicContext);

    const [openModal, setOpenModal] = useState<'quality' | 'playlist' | null>(null);
    const bitrateButtonRef = useRef<HTMLDivElement>(null);
    const playlistButtonRef = useRef<HTMLDivElement>(null);
    const volumeSliderRef = useRef<HTMLInputElement>(null);
    const [previousVolume, setPreviousVolume] = useState(playerContext.volume);
    
    const { volume, setVolume } = playerContext;
    const isMuted = useMemo(() => volume === 0, [volume]);

    useEffect(() => {
        if (volumeSliderRef.current) {
            volumeSliderRef.current.style.setProperty('--volume-progress', `${volume * 100}%`);
        }
    }, [volume]);
    
    const handleMuteToggle = () => {
        if (isMuted) {
            setVolume(previousVolume > 0.01 ? previousVolume : 0.5);
        } else {
            setPreviousVolume(volume);
            setVolume(0);
        }
    };

    const VolumeIcon = useMemo(() => {
        if (isMuted) return VolumeMuteIcon;
        if (volume > 0.5) return VolumeUpIcon;
        return VolumeDownIcon;
    }, [volume, isMuted]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (bitrateButtonRef.current && !bitrateButtonRef.current.contains(target) &&
                playlistButtonRef.current && !playlistButtonRef.current.contains(target)) {
                setOpenModal(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!playerContext.currentSong) return null;

    const handleModalToggle = (modal: 'quality' | 'playlist') => {
        setOpenModal(prev => (prev === modal ? null : modal));
    };

    return (
        <div className="flex items-center justify-end space-x-1">
            <div className="relative" ref={bitrateButtonRef}>
                <PlayerActionButton onClick={() => handleModalToggle('quality')} isActive={openModal === 'quality'} title="Select quality" className="min-w-[7rem] justify-between">
                    <span className="text-sm">{playerContext.currentQuality || 'auto'}</span>
                    <ChevronDownIcon className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ease-in-out ${openModal === 'quality' ? 'rotate-180' : ''}`}/>
                </PlayerActionButton>
              <div className={`absolute bottom-full right-0 mb-2 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30 transition-all duration-200 ease-out origin-bottom-right ${openModal === 'quality' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                  <p className="px-2 py-1 text-xs text-gray-400 font-bold uppercase tracking-widest">Quality</p>
                  <div className="mt-1 flex flex-col">
                      {playerContext.currentSong.downloadUrl.map(q => (
                        <button key={q.quality} onClick={() => { playerContext.setSelectedQuality(q.quality); setOpenModal(null); }} className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${playerContext.selectedQuality === q.quality ? 'bg-[#fc4b08] text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}>
                          {q.quality}
                        </button>
                      ))}
                  </div>
              </div>
            </div>

            <PlayerActionButton onClick={onDownload} isDisabled={isDownloading} title="Download song">
              {isDownloading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5"/>}
            </PlayerActionButton>
            
            <div className="relative" ref={playlistButtonRef}>
                <PlayerActionButton onClick={() => handleModalToggle('playlist')} isActive={openModal === 'playlist'} title="Add to playlist">
                    <PlusCircleIcon className={`w-5 h-5 transition-transform duration-300 ease-in-out ${openModal === 'playlist' ? 'rotate-[135deg]' : ''}`}/>
                </PlayerActionButton>
                <div className={`absolute bottom-full right-0 mb-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-lg p-2 z-30 max-h-48 overflow-y-auto custom-scrollbar transition-all duration-200 ease-out origin-bottom-right ${openModal === 'playlist' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                      <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase">Add to playlist</p>
                      <button onClick={() => { onAddToPlaylist(); setOpenModal(null); }} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10">New Playlist</button>
                      <hr className="my-1 border-white/10"/>
                      {userMusicContext.playlists.length > 0 ? userMusicContext.playlists.map(p => (
                        <button key={p.id} onClick={() => { userMusicContext.addSongToPlaylist(p.id, playerContext.currentSong!); setOpenModal(null); }} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10 truncate">
                          {p.name}
                        </button>
                      )) : <p className="px-3 py-1.5 text-sm text-gray-500">No playlists.</p>}
                </div>
            </div>

            <PlayerActionButton onClick={onToggleFavorite} title="Favorite song">
              <HeartIcon className={`w-5 h-5 transition-all ${isHeartAnimating ? 'heart-pop' : ''} ${userMusicContext.isFavoriteSong(playerContext.currentSong.id) ? 'fill-[#fc4b08] text-[#fc4b08]' : ''}`}/>
            </PlayerActionButton>

            <PlayerActionButton onClick={playerContext.toggleQueue} title="Show queue" isActive={playerContext.isQueueOpen}>
                <QueueIcon className="w-5 h-5"/>
            </PlayerActionButton>

            <div className="group flex items-center">
                 <PlayerActionButton onClick={handleMuteToggle} title={isMuted ? "Unmute" : "Mute"}>
                    <VolumeIcon className="w-5 h-5" />
                </PlayerActionButton>
                <div className="w-0 group-hover:w-32 transition-[width] duration-300 ease-in-out flex items-center h-10 overflow-hidden">
                    <input 
                        ref={volumeSliderRef}
                        type="range" min="0" max="1" step="0.01" value={volume} 
                        onChange={(e) => playerContext.setVolume(parseFloat(e.target.value))}
                        className="volume-slider" 
                    />
                </div>
            </div>
        </div>
    );
};


interface PlayerProps {
    navigateToArtist: (artistId: string) => void;
}

export const Player: React.FC<PlayerProps> = ({ navigateToArtist }) => {
  const playerContext = useContext(PlayerContext);
  const userMusicContext = useContext(UserMusicContext);
  const modalContext = useContext(ModalContext);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  
  const handleDownload = async () => {
      if (!playerContext.currentSong || isDownloading) return;
      const songUrl = playerContext.currentSong.downloadUrl.find(q => q.quality === playerContext.currentQuality)?.url;
      if (!songUrl) return;

      setIsDownloading(true);
      try {
          const response = await fetch(songUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const fileExtension = playerContext.currentSong.name.endsWith('.mp3') ? '' : '.mp3';
          a.download = `${playerContext.currentSong.name} - ${playerContext.currentSong.artists.primary.map(a => a.name).join(', ')}${fileExtension}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
      } catch (error) {
          console.error('Download failed:', error);
      } finally {
        setIsDownloading(false);
      }
  };
  
  const handleToggleFavorite = () => {
    if (!playerContext.currentSong) return;
    
    const isCurrentlyFavorite = userMusicContext.isFavoriteSong(playerContext.currentSong.id);
    if (!isCurrentlyFavorite) {
        setIsHeartAnimating(true);
        setTimeout(() => setIsHeartAnimating(false), 300);
    }
    userMusicContext.toggleFavoriteSong(playerContext.currentSong);
  };

  const handleCreateNewPlaylist = () => {
    if (!playerContext.currentSong) return;
    modalContext.showModal({
        title: "Create New Playlist",
        content: <CreatePlaylistForm
            initialSong={playerContext.currentSong}
            onCancel={modalContext.hideModal}
            onConfirm={(name, desc) => {
                userMusicContext.createPlaylist(name, desc, [playerContext.currentSong!]);
                modalContext.hideModal();
            }}
        />
    });
  };

  if (!playerContext.currentSong) {
    return (
      <div className="h-24 bg-black/30 backdrop-blur-md border-t border-white/10 flex items-center justify-center">
        <p className="text-gray-500">No song selected</p>
      </div>
    );
  }

  return (
    <div className="h-24 bg-black/40 backdrop-blur-lg border-t border-white/10 p-4 grid grid-cols-[1fr_2fr_1fr] items-center gap-4">
      <SongInfo song={playerContext.currentSong} navigateToArtist={navigateToArtist} />
      
      <div className="flex flex-col items-center justify-center gap-1 w-full">
        <PlayerControls {...playerContext} />
        <PlayerProgressBar {...playerContext} />
      </div>
      
      <PlayerActions 
        onDownload={handleDownload}
        isDownloading={isDownloading}
        onAddToPlaylist={handleCreateNewPlaylist}
        onToggleFavorite={handleToggleFavorite}
        isHeartAnimating={isHeartAnimating}
      />
    </div>
  );
};