
import React, { useContext, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { CreatePlaylistForm } from '../ui/CreatePlaylistForm';
import { ModalContext } from '../../App';
import { Song } from '../../types';
import { PartyContext } from '../../context/PartyContext';
import { PartyModal } from '../party/PartyModal';
import { useTranslation } from '../../context/LanguageContext';

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
const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
);
const SignalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12z" />
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

const SongInfo: React.FC<{ song: Song; navigateToArtist: (id: string) => void }> = React.memo(({ song, navigateToArtist }) => {
    const smallImage = song.image?.find(img => img.quality === '50x50')?.url || song.image?.[0]?.url;
    return (
        <div className="flex items-center space-x-3 md:space-x-4 min-w-0 overflow-hidden">
            {smallImage && <img src={smallImage} alt={decodeHtml(song.name)} className="w-12 h-12 md:w-14 md:h-14 rounded-md shadow-lg flex-shrink-0 animate-image-appear" loading="lazy" />}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate text-sm md:text-base" title={decodeHtml(song.name)}>{decodeHtml(song.name)}</h3>
                <p className="text-xs md:text-sm text-gray-400 truncate">
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
});

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
    const { t } = useTranslation();
    const prevButtonRef = useRef<HTMLButtonElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);
    const { partyState, isHost, togglePartyPlayer, playNextParty, playPrevParty } = useContext(PartyContext);

    const canControlPlayback = !partyState || isHost || (partyState.mode === 'collaborative');
    const canControlSettings = !partyState || isHost;

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
        if (!canControlPlayback) return;
        if (partyState) playPrevParty(); else playPrev();

        if (!partyState || isHost) {
            handleAnimation(prevButtonRef, 'animate-skip-prev');
        }
    };

    const handlePlayNext = () => {
        if (!canControlPlayback) return;
        if (partyState) playNextParty(); else playNext();
        
        if (!partyState || isHost) {
            handleAnimation(nextButtonRef, 'animate-skip-next');
        }
    };
    
    const handleTogglePlay = () => {
        if (!canControlPlayback) return;
        if (partyState) togglePartyPlayer(); else togglePlay();
    };

    return (
        <div className={`flex items-center space-x-2 ${!canControlPlayback ? 'opacity-60' : ''}`}>
            <button disabled={!canControlSettings} onClick={toggleShuffle} title={t('player.shuffle')} className={`relative transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 ${isShuffle ? 'text-[#fc4b08]' : 'text-gray-400 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-60`}>
                <span className="font-bold text-lg leading-none transition-transform duration-200 ease-in-out group-hover:scale-105">S</span>
                <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fc4b08] rounded-full transition-transform duration-200 ease-out origin-bottom ${isShuffle ? 'scale-y-100' : 'scale-y-0'}`}></div>
            </button>
            <button disabled={!canControlPlayback} ref={prevButtonRef} onClick={handlePlayPrev} className="group text-gray-300 hover:text-[#fc4b08] transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed"><PrevIcon className="w-6 h-6 chevron-prev" /></button>
            <button 
                disabled={!canControlPlayback}
                onClick={handleTogglePlay} 
                className={`w-10 h-10 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 hover:shadow-xl hover:shadow-[#fc4b08]/40 transition-all duration-200 active:scale-95 play-pause-container ${isPlaying ? 'is-playing' : ''} disabled:cursor-not-allowed`}
            >
                <PauseIcon className="w-6 h-6 pause-icon" />
                <PlayIcon className="w-6 h-6 play-icon" />
            </button>
            <button disabled={!canControlPlayback} ref={nextButtonRef} onClick={handlePlayNext} className="group text-gray-300 hover:text-[#fc4b08] transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed"><NextIcon className="w-6 h-6 chevron-next" /></button>
            <button disabled={!canControlSettings} onClick={cycleRepeatMode} title={t('player.repeat', { mode: repeatMode })} className={`relative transition-colors w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 ${repeatMode !== 'off' ? 'text-[#fc4b08]' : 'text-gray-400 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-60`}>
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
    const { partyState, isHost, seekPartyPlayer } = useContext(PartyContext);
    const canSeek = !partyState || isHost || (partyState.mode === 'collaborative');
    const isDisabled = !canSeek;

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
        if (isDisabled) return;
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
            if (partyState) {
                seekPartyPlayer(finalTime);
            } else {
                seek(finalTime);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isSeeking, calculateSeekTime, seek, partyState, seekPartyPlayer]);
    
    return (
        <div className="w-full flex items-center space-x-2">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(isSeeking ? seekTime : currentTime)}</span>
            <div 
                ref={progressBarRef}
                className={`w-full h-1.5 bg-gray-600/50 rounded-full group relative ${isSeeking ? 'seeking' : ''} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
        className={`flex items-center justify-center h-10 px-3 rounded-md transition-colors duration-200 ease-in-out ${isActive ? 'bg-[#fc4b08]/20 text-[#fc4b08]' : 'text-gray-300 hover:bg-white/10 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const PlayerActions: React.FC<{
    song: Song | null;
    onDownload: () => void;
    isDownloading: boolean;
    onAddToPlaylist: () => void;
    onToggleFavorite: () => void;
    isHeartAnimating: boolean;
    handlePartyModeClick: () => void;
}> = ({ song, onDownload, isDownloading, onAddToPlaylist, onToggleFavorite, isHeartAnimating, handlePartyModeClick }) => {
    const { t } = useTranslation();
    const playerContext = useContext(PlayerContext);
    const userMusicContext = useContext(UserMusicContext);
    const { partyState } = useContext(PartyContext);

    const [openModal, setOpenModal] = useState<'playlist' | null>(null);
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
            if (playlistButtonRef.current && !playlistButtonRef.current.contains(target)) {
                setOpenModal(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!song) return null;

    return (
        <div className="flex items-center justify-end space-x-1">
            <PlayerActionButton onClick={handlePartyModeClick} title={t('player.partyMode')} isActive={!!partyState}>
                <SignalIcon className="w-5 h-5"/>
            </PlayerActionButton>
            
            <PlayerActionButton onClick={onDownload} isDisabled={isDownloading} title={t('player.download')}>
              {isDownloading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5"/>}
            </PlayerActionButton>
            
            <div className="relative" ref={playlistButtonRef}>
                <PlayerActionButton onClick={() => setOpenModal(p => p ? null : 'playlist')} isActive={openModal === 'playlist'} title={t('player.addToPlaylist')}>
                    <div className={`transition-transform duration-300 ease-out transform-gpu will-change-transform ${openModal === 'playlist' ? 'rotate-[135deg]' : ''}`}>
                        <PlusCircleIcon className="w-5 h-5"/>
                    </div>
                </PlayerActionButton>
                <div className={`absolute bottom-full right-0 mb-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-lg p-2 z-30 max-h-48 overflow-y-auto custom-scrollbar transition-all duration-200 ease-out origin-bottom-right ${openModal === 'playlist' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                      <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase">{t('player.addToPlaylist')}</p>
                      <button onClick={() => { onAddToPlaylist(); setOpenModal(null); }} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10">{t('player.newPlaylist')}</button>
                      <hr className="my-1 border-white/10"/>
                      {userMusicContext.playlists.length > 0 ? userMusicContext.playlists.map(p => (
                        <button key={p.id} onClick={() => { userMusicContext.addSongToPlaylist(p.id, song); setOpenModal(null); }} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10 truncate">
                          {p.name}
                        </button>
                      )) : <p className="px-3 py-1.5 text-sm text-gray-500">{t('player.noPlaylists')}</p>}
                </div>
            </div>

            <PlayerActionButton onClick={onToggleFavorite} title={t('player.favorite')}>
              <HeartIcon className={`w-5 h-5 transition-all ${isHeartAnimating ? 'heart-pop' : ''} ${userMusicContext.isFavoriteSong(song.id) ? 'fill-[#fc4b08] text-[#fc4b08]' : ''}`}/>
            </PlayerActionButton>

            <PlayerActionButton onClick={playerContext.toggleQueue} title={t('player.showQueue')} isActive={playerContext.isQueueOpen}>
                <QueueIcon className="w-5 h-5"/>
            </PlayerActionButton>

            <div className="group flex items-center">
                 <PlayerActionButton onClick={handleMuteToggle} title={isMuted ? t('player.unmute') : t('player.mute')}>
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
  const { t } = useTranslation();
  const playerContext = useContext(PlayerContext);
  const userMusicContext = useContext(UserMusicContext);
  const modalContext = useContext(ModalContext);
  const { partyState, isHost, togglePartyPlayer } = useContext(PartyContext);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  
  const displayedSong = (isHost || !partyState) ? playerContext.currentSong : partyState.currentSong;
  const isPlaying = (isHost || !partyState) ? playerContext.isPlaying : partyState.isPlaying;
  const currentTime = (isHost || !partyState) ? playerContext.currentTime : partyState.currentTime;
  const duration = displayedSong?.duration ?? 0;

  
  const handleDownload = async () => {
      if (!displayedSong || isDownloading) return;
      const songUrl = displayedSong.downloadUrl.find(q => q.quality === playerContext.currentQuality)?.url;
      if (!songUrl) return;

      setIsDownloading(true);
      try {
          const response = await fetch(songUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const fileExtension = displayedSong.name.endsWith('.mp3') ? '' : '.mp3';
          a.download = `${displayedSong.name} - ${displayedSong.artists.primary.map(a => a.name).join(', ')}${fileExtension}`;
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
    if (!displayedSong) return;
    
    const isCurrentlyFavorite = userMusicContext.isFavoriteSong(displayedSong.id);
    if (!isCurrentlyFavorite) {
        setIsHeartAnimating(true);
        setTimeout(() => setIsHeartAnimating(false), 300);
    }
    userMusicContext.toggleFavoriteSong(displayedSong);
  };

  const handleCreateNewPlaylist = () => {
    if (!displayedSong) return;
    modalContext.showModal({
        title: t('modals.createPlaylist.title'),
        content: <CreatePlaylistForm
            initialSong={displayedSong}
            onCancel={modalContext.hideModal}
            onConfirm={(name, desc) => {
                userMusicContext.createPlaylist(name, desc, [displayedSong]);
                modalContext.hideModal();
            }}
        />
    });
  };

  const handlePartyModeClick = () => {
    if (partyState) {
        playerContext.toggleQueue();
    } else {
        modalContext.showModal({
            content: <PartyModal onClose={modalContext.hideModal} />
        });
    }
  };

  if (!displayedSong) {
    return (
      <div className="h-full bg-black/30 backdrop-blur-md border-t border-white/10 flex items-center justify-center">
        <p className="text-gray-500">{t('player.noSong')}</p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = userMusicContext.isFavoriteSong(displayedSong.id);
  
  const { togglePlay, ...restOfPlayerContext } = playerContext;
  
  // Use a different variable for mobile toggle play to avoid breaking desktop context
  const handleMobileTogglePlay = () => {
      if (partyState) {
        if (isHost || partyState.mode === 'collaborative') {
            togglePartyPlayer();
        }
      } else {
        togglePlay();
      }
  }


  return (
    <div className="relative h-full bg-black/40 backdrop-blur-lg border-t border-white/10 p-2 md:p-4 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_2fr_1fr] items-center gap-2 md:gap-4">
      {/* Mobile-only progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-600/50 md:hidden">
          <div className="bg-[#fc4b08] h-full" style={{ width: `${progress}%` }} />
      </div>

      <SongInfo song={displayedSong} navigateToArtist={navigateToArtist} />
      
      {/* Desktop Controls */}
      <div className="hidden md:flex flex-col items-center justify-center gap-1 w-full">
        <PlayerControls {...restOfPlayerContext} isPlaying={isPlaying} togglePlay={togglePlay} />
        <PlayerProgressBar currentTime={currentTime} duration={duration} seek={playerContext.seek} />
      </div>
      
      {/* Desktop Actions */}
      <div className="hidden md:block">
          <PlayerActions
            song={displayedSong}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            onAddToPlaylist={handleCreateNewPlaylist}
            onToggleFavorite={handleToggleFavorite}
            isHeartAnimating={isHeartAnimating}
            handlePartyModeClick={handlePartyModeClick}
          />
      </div>

      {/* Mobile Controls */}
      <div className="flex md:hidden items-center gap-2">
           <button onClick={handleToggleFavorite} title={t('player.favorite')} className="p-2">
              <HeartIcon className={`w-6 h-6 transition-all ${isHeartAnimating ? 'heart-pop' : ''} ${isFav ? 'fill-[#fc4b08] text-[#fc4b08]' : 'text-gray-300'}`}/>
            </button>
            <button onClick={handlePartyModeClick} title={t('player.partyMode')} className={`p-2 rounded-full ${!!partyState ? 'text-[#fc4b08]' : 'text-gray-300'}`}>
                <SignalIcon className="w-6 h-6"/>
            </button>
            <button 
                onClick={handleMobileTogglePlay} 
                className={`w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-black transition-transform active:scale-95`}
            >
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 pl-0.5" />}
            </button>
      </div>
    </div>
  );
};
