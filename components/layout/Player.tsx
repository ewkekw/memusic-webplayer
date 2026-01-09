
import React, { useContext, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { CreatePlaylistForm } from '../ui/CreatePlaylistForm';
import { ModalContext } from '../../context/ModalContext';
import { Song } from '../../types';
import { PartyContext } from '../../context/PartyContext';
import { PartyModal } from '../party/PartyModal';
import { useTranslation } from '../../context/LanguageContext';
import { SmartMenu } from '../ui/SmartMenu';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 3l14 9-14 9V3z" />
  </svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="2" />
    <rect x="14" y="4" width="4" height="16" rx="2" />
  </svg>
);
const NextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 4l10 8-10 8V4z" />
        <path d="M19 5h-2v14h2V5z" />
    </svg>
);
const PrevIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 4l-10 8 10 8V4z" />
        <path d="M5 5h2v14H5V5z" />
    </svg>
);
const VolumeUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const VolumeDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
);
const VolumeMuteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);
const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);
const SignalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
);
const ShuffleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M4 20L21 3" />
        <path d="M21 16v5h-5" />
        <path d="M15 15l6 6" />
        <path d="M4 4l5 5" />
    </svg>
);
const RepeatIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m17 2 4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="m7 22-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
);
const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
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
    const smallImage = song.image?.find(img => img.quality === '150x150')?.url || song.image?.[0]?.url;
    
    return (
        <div className="flex items-center space-x-4 min-w-0 overflow-hidden relative group p-2 rounded-xl transition-colors hover:bg-white/5">
            {/* Ambient shadow for album art - The "Glow" Effect */}
            <div className="absolute left-3 w-10 h-10 md:w-14 md:h-14 blur-xl opacity-60 rounded-full transition-opacity duration-700 animate-pulse"
                 style={{ backgroundImage: `url(${smallImage})`, backgroundSize: 'cover' }}></div>
            
            {smallImage && (
                <div className="relative z-10">
                    <img 
                        src={smallImage} 
                        alt={decodeHtml(song.name)} 
                        className="w-12 h-12 md:w-14 md:h-14 rounded-lg shadow-lg flex-shrink-0 animate-image-appear object-cover border border-white/5 ring-1 ring-white/5" 
                        loading="lazy" 
                    />
                </div>
            )}
            <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
                <div className="relative overflow-hidden mask-linear-fade">
                    <h3 className="font-bold text-white truncate text-sm md:text-base leading-tight tracking-tight drop-shadow-sm cursor-default hover:text-[#fc4b08] transition-colors" title={decodeHtml(song.name)}>
                        {decodeHtml(song.name)}
                    </h3>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5 font-medium tracking-wide">
                    {song.artists.primary.map((artist, index) => (
                        <React.Fragment key={artist.id}>
                            <span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:text-white hover:underline cursor-pointer transition-colors" title={decodeHtml(artist.name)}>
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
    const { partyState, isHost, togglePartyPlayer, playNextParty, playPrevParty } = useContext(PartyContext);

    const canControlPlayback = !partyState || isHost || (partyState.mode === 'collaborative');
    const canControlSettings = !partyState || isHost;

    const handlePlayPrev = () => { if (canControlPlayback) (partyState ? playPrevParty() : playPrev()); };
    const handlePlayNext = () => { if (canControlPlayback) (partyState ? playNextParty() : playNext()); };
    const handleTogglePlay = () => { if (canControlPlayback) (partyState ? togglePartyPlayer() : togglePlay()); };

    return (
        <div className={`flex items-center gap-6 md:gap-8 ${!canControlPlayback ? 'opacity-50 pointer-events-none' : ''}`}>
            <button 
                disabled={!canControlSettings} 
                onClick={toggleShuffle} 
                title={t('player.shuffle')} 
                className={`group relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isShuffle ? 'text-[#fc4b08]' : 'text-gray-500 hover:text-white'}`}
            >
                <ShuffleIcon className="w-4 h-4" />
                {isShuffle && <span className="absolute -bottom-1 w-1 h-1 bg-[#fc4b08] rounded-full shadow-[0_0_5px_#fc4b08]" />}
            </button>

            <div className="flex items-center gap-4">
                <button 
                    disabled={!canControlPlayback} 
                    onClick={handlePlayPrev} 
                    className="text-gray-300 hover:text-white transition-all active:scale-90 hover:bg-white/5 p-2 rounded-full"
                >
                    <PrevIcon className="w-6 h-6 md:w-7 md:h-7" />
                </button>
                
                <button 
                    disabled={!canControlPlayback}
                    onClick={handleTogglePlay} 
                    className={`relative w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 active:scale-95 group border-2 border-transparent hover:border-[#fc4b08]`}
                >
                    {isPlaying ? (
                        <PauseIcon className="w-6 h-6 md:w-7 md:h-7 fill-black group-hover:fill-[#fc4b08] transition-colors" />
                    ) : (
                        <PlayIcon className="w-6 h-6 md:w-7 md:h-7 fill-black group-hover:fill-[#fc4b08] ml-1 transition-colors" />
                    )}
                </button>

                <button 
                    disabled={!canControlPlayback} 
                    onClick={handlePlayNext} 
                    className="text-gray-300 hover:text-white transition-all active:scale-90 hover:bg-white/5 p-2 rounded-full"
                >
                    <NextIcon className="w-6 h-6 md:w-7 md:h-7" />
                </button>
            </div>

            <button 
                disabled={!canControlSettings} 
                onClick={cycleRepeatMode} 
                title={t('player.repeat', { mode: repeatMode })} 
                className={`group relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${repeatMode !== 'off' ? 'text-[#fc4b08]' : 'text-gray-500 hover:text-white'}`}
            >
                <RepeatIcon className="w-4 h-4" />
                {repeatMode !== 'off' && <span className="absolute -bottom-1 w-1 h-1 bg-[#fc4b08] rounded-full shadow-[0_0_5px_#fc4b08]" />}
                {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-[#fc4b08] text-black px-1 rounded-full leading-tight">1</span>}
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
        if (!canSeek) return;
        e.preventDefault();
        setIsSeeking(true);
        setSeekTime(calculateSeekTime(e.clientX));
    };

    useEffect(() => {
        if (!isSeeking) return;
        const handleMouseMove = (e: MouseEvent) => setSeekTime(calculateSeekTime(e.clientX));
        const handleMouseUp = (e: MouseEvent) => {
            setIsSeeking(false);
            const finalTime = calculateSeekTime(e.clientX);
            partyState ? seekPartyPlayer(finalTime) : seek(finalTime);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isSeeking, calculateSeekTime, seek, partyState, seekPartyPlayer]);
    
    return (
        <div className="w-full flex items-center space-x-3 mt-1 group/bar select-none">
            <span className="text-xs font-medium text-gray-500 w-10 text-right tabular-nums tracking-wide">{formatTime(isSeeking ? seekTime : currentTime)}</span>
            <div 
                ref={progressBarRef}
                className={`flex-1 h-6 flex items-center cursor-pointer ${!canSeek ? 'cursor-not-allowed opacity-50' : ''}`}
                onMouseDown={handleMouseDown}
            >
                <div className="w-full h-1 bg-white/10 rounded-full relative overflow-visible group-hover/bar:h-1.5 transition-all duration-300">
                    <div 
                        className="absolute h-full bg-white rounded-full group-hover/bar:bg-[#fc4b08] shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover/bar:shadow-[0_0_15px_rgba(252,75,8,0.5)] transition-all duration-100" 
                        style={{ width: `${progress}%` }} 
                    >
                        {/* Scrubber Handle */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 transform scale-0 group-hover/bar:scale-100" />
                    </div>
                </div>
            </div>
            <span className="text-xs font-medium text-gray-500 w-10 text-left tabular-nums tracking-wide">{formatTime(duration)}</span>
        </div>
    );
};

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

    const [openModal, setOpenModal] = useState(false);
    const playlistButtonRef = useRef<HTMLButtonElement>(null);
    const volumeSliderRef = useRef<HTMLInputElement>(null);
    const [previousVolume, setPreviousVolume] = useState(playerContext.volume);
    
    const { volume, setVolume, toggleLyrics, isLyricsOpen } = playerContext;
    const isMuted = useMemo(() => volume === 0, [volume]);

    useEffect(() => {
        if (volumeSliderRef.current) {
            volumeSliderRef.current.style.setProperty('--volume-progress', `${volume * 100}%`);
        }
    }, [volume]);
    
    const toggleMute = () => {
        if (isMuted) setVolume(previousVolume > 0.05 ? previousVolume : 0.5);
        else { setPreviousVolume(volume); setVolume(0); }
    };
    
    if (!song) return null;

    return (
        <div className="flex items-center justify-end gap-1 md:gap-2">
            <button onClick={() => toggleLyrics()} title="Lyrics" className={`p-2 rounded-full transition-all duration-300 hover:bg-white/10 ${isLyricsOpen ? 'text-[#fc4b08] bg-[#fc4b08]/10 shadow-[0_0_10px_rgba(252,75,8,0.3)]' : 'text-gray-400 hover:text-white'}`}>
                <MicIcon className="w-5 h-5"/>
            </button>

            <button onClick={handlePartyModeClick} title={t('player.partyMode')} className={`p-2 rounded-full transition-colors hover:bg-white/10 ${partyState ? 'text-[#fc4b08] bg-[#fc4b08]/10' : 'text-gray-400 hover:text-white'}`}>
                <SignalIcon className="w-5 h-5"/>
            </button>
            
            <button onClick={onDownload} disabled={isDownloading} title={t('player.download')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">
              {isDownloading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5"/>}
            </button>
            
            <button ref={playlistButtonRef} onClick={() => setOpenModal(p => !p)} title={t('player.addToPlaylist')} className={`p-2 rounded-full transition-colors hover:bg-white/10 ${openModal ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                <PlusCircleIcon className={`w-5 h-5 transition-transform duration-300 ${openModal ? 'rotate-[135deg]' : ''}`}/>
            </button>
            
            <SmartMenu isOpen={openModal} onClose={() => setOpenModal(false)} triggerRef={playlistButtonRef}>
                <div className="flex flex-col py-1">
                    <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase">{t('player.addToPlaylist')}</p>
                    <button onClick={() => { onAddToPlaylist(); setOpenModal(false); }} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10 text-white">{t('player.newPlaylist')}</button>
                    <hr className="my-1 border-white/10"/>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {userMusicContext.playlists.length > 0 ? userMusicContext.playlists.map(p => (
                            <button key={p.id} onClick={() => { userMusicContext.addSongToPlaylist(p.id, song); setOpenModal(false); }} className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10 truncate text-white">{p.name}</button>
                        )) : <p className="px-3 py-1.5 text-sm text-gray-500">{t('player.noPlaylists')}</p>}
                    </div>
                </div>
            </SmartMenu>

            <button onClick={onToggleFavorite} title={t('player.favorite')} className="p-2 rounded-full hover:bg-white/10 transition-colors group">
              <HeartIcon className={`w-5 h-5 transition-all ${isHeartAnimating ? 'scale-125' : 'group-active:scale-90'} ${userMusicContext.isFavoriteSong(song.id) ? 'fill-[#fc4b08] text-[#fc4b08] drop-shadow-[0_0_8px_rgba(252,75,8,0.6)]' : 'text-gray-400 group-hover:text-white'}`}/>
            </button>

            <button onClick={() => playerContext.toggleQueue()} title={t('player.showQueue')} className={`p-2 rounded-full transition-colors hover:bg-white/10 ${playerContext.isQueueOpen ? 'text-[#fc4b08] bg-[#fc4b08]/10' : 'text-gray-400 hover:text-white'}`}>
                <QueueIcon className="w-5 h-5"/>
            </button>

            {/* Volume Control - Sleek Bar */}
            <div className="flex items-center group/volume ml-2 pl-2 border-l border-white/10 h-8">
                 <button onClick={toggleMute} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                    {isMuted ? <VolumeMuteIcon className="w-5 h-5" /> : volume > 0.5 ? <VolumeUpIcon className="w-5 h-5" /> : <VolumeDownIcon className="w-5 h-5" />}
                </button>
                <div className="w-0 group-hover/volume:w-24 transition-all duration-300 overflow-hidden flex items-center mx-1">
                    <input 
                        ref={volumeSliderRef}
                        type="range" min="0" max="1" step="0.01" value={volume} 
                        onChange={(e) => playerContext.setVolume(parseFloat(e.target.value))}
                        className="volume-slider" 
                        title="Volume"
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
      <div className="h-full glass-panel-heavy border-t border-white/10 flex items-center justify-center">
        <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">{t('player.noSong')}</p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = userMusicContext.isFavoriteSong(displayedSong.id);
  const { togglePlay, ...restOfPlayerContext } = playerContext;
  
  const handleMobileTogglePlay = () => {
      if (partyState) {
        if (isHost || partyState.mode === 'collaborative') togglePartyPlayer();
      } else {
        togglePlay();
      }
  }

  return (
    <div className="relative h-full glass-panel-heavy px-4 md:px-8 grid grid-cols-[1fr_auto] md:grid-cols-[300px_1fr_300px] items-center gap-4 z-50 transition-all duration-300 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      
      {/* Mobile-only progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 md:hidden pointer-events-none">
          <div className="bg-[#fc4b08] h-full shadow-[0_0_10px_#fc4b08]" style={{ width: `${progress}%` }} />
      </div>

      {/* Left: Song Info */}
      <div className="flex justify-start min-w-0">
        <SongInfo song={displayedSong} navigateToArtist={navigateToArtist} />
      </div>
      
      {/* Center: Controls */}
      <div className="hidden md:flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
        <PlayerControls {...restOfPlayerContext} isPlaying={isPlaying} togglePlay={togglePlay} />
        <PlayerProgressBar currentTime={currentTime} duration={duration} seek={playerContext.seek} />
      </div>
      
      {/* Right: Actions */}
      <div className="hidden md:flex justify-end">
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
      <div className="flex md:hidden items-center gap-4 pr-2">
           <button onClick={handleToggleFavorite} title={t('player.favorite')} className="p-2">
              <HeartIcon className={`w-6 h-6 transition-all ${isHeartAnimating ? 'scale-125' : ''} ${isFav ? 'fill-[#fc4b08] text-[#fc4b08] drop-shadow-[0_0_5px_rgba(252,75,8,0.5)]' : 'text-gray-400'}`}/>
            </button>
            <button 
                onClick={handleMobileTogglePlay} 
                className={`w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg shadow-white/10 active:scale-95 border-2 border-transparent ${isPlaying ? '' : 'border-[#fc4b08]'}`}
            >
                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 pl-0.5" />}
            </button>
      </div>
    </div>
  );
};
