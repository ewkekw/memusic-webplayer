
import React, { useContext, useState, useRef, useEffect } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { PartyContext } from '../../context/PartyContext';
import { PartyParticipant, Song, PartyQueueSong } from '../../types';
import { PartyParticipantList } from '../party/PartyParticipantList';
import { useTranslation } from '../../context/LanguageContext';

const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const SignalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);


interface QueueItemProps {
    song: Song | PartyQueueSong;
    isPlaying: boolean;
    onPlay: () => void;
    navigateToArtist: (artistId: string) => void;
    addedBy?: PartyParticipant | null;
    isGhost?: boolean;
}

const QueueItem: React.FC<QueueItemProps> = React.memo(({ song, isPlaying, onPlay, navigateToArtist, addedBy, isGhost = false }) => {
    const { removeSongFromQueue, moveSongInQueue } = useContext(PlayerContext);
    const { partyState, myId, isHost, removeSongFromPartyQueue } = useContext(PartyContext);
    const { t } = useTranslation();
    const imageUrl = song.image?.find(img => img.quality === '50x50')?.url || song.image?.[0]?.url;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuAction = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    }
    
    const canRemove = isHost || (partyState?.mode === 'collaborative' && (song as PartyQueueSong).addedBy === myId);

    return (
        <div 
            onClick={onPlay}
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${isGhost ? 'bg-white/5 shadow-lg' : ''} ${isPlaying ? 'bg-white/10' : 'hover:bg-white/10'}`}
        >
            <div className="relative flex-shrink-0 w-10 h-10 mr-3">
                <img src={imageUrl} alt={song.name} className="w-full h-full rounded-md object-cover animate-image-appear" loading="lazy" />
                {addedBy && (
                    <img
                        src={addedBy.imageUrl}
                        title={`Added by ${addedBy.name}`}
                        className="w-5 h-5 rounded-full absolute -bottom-1 -right-1 border-2 border-[#1e1e1e] shadow-md"
                    />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isPlaying ? 'text-[#fc4b08]' : 'text-white'}`}>{song.name}</p>
                <p className="text-sm text-gray-400 truncate">
                    {song.artists.primary.map((artist, index) => (
                        <React.Fragment key={artist.id}>
                            <span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:underline cursor-pointer">
                                {artist.name}
                            </span>
                            {index < song.artists.primary.length - 1 && ', '}
                        </React.Fragment>
                    ))}
                </p>
            </div>
            {!isGhost && (!partyState || canRemove) && (
                <div className="relative" ref={menuRef}>
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p);}} className="p-2 rounded-full hover:bg-white/20 text-gray-400 hover:text-white">
                        <MoreIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-50">
                            {!partyState && <button onClick={() => handleMenuAction(() => moveSongInQueue(song.id, 'top'))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">{t('queue.moveToTop')}</button>}
                            {!partyState && <button onClick={() => handleMenuAction(() => moveSongInQueue(song.id, 'bottom'))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">{t('queue.moveToBottom')}</button>}
                            <button onClick={() => handleMenuAction(() => partyState ? removeSongFromPartyQueue(song.id) : removeSongFromQueue(song.id))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 text-red-400 hover:text-red-300">{t('queue.removeFromQueue')}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

interface DraggableQueueItemProps {
    song: Song | PartyQueueSong;
    index: number;
    isNowPlaying?: boolean;
    draggedIndex: number | null;
    dropTargetIndex: number | null;
    onDragStart: (index: number) => void;
    onDragEnter: (index: number) => void;
    onDragEnd: () => void;
    onDrop: (index: number) => void;
    onPlay: () => void;
    navigateToArtist: (artistId: string) => void;
    addedBy?: PartyParticipant | null;
}

const DraggableQueueItem: React.FC<DraggableQueueItemProps> = React.memo(({ song, index, isNowPlaying = false, draggedIndex, dropTargetIndex, onDragStart, onDragEnter, onDragEnd, onDrop, onPlay, navigateToArtist, addedBy }) => {
    const isBeingDragged = draggedIndex === index;
    const isDropTarget = dropTargetIndex === index && draggedIndex !== index;
    const { partyState, isHost } = useContext(PartyContext);
    const canDrag = !isNowPlaying && (!partyState || isHost || partyState.mode === 'collaborative');

    const handleDragStart = (e: React.DragEvent) => {
        if(!canDrag) {
             e.preventDefault();
             return;
        }
        e.dataTransfer.effectAllowed = 'move';
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        setTimeout(() => onDragStart(index), 0);
    };

    return (
        <div
            draggable={canDrag}
            onDragStart={handleDragStart}
            onDragEnter={(e) => {
                if (isBeingDragged) return;
                canDrag && onDragEnter(index)
            }}
            onDragEnd={onDragEnd}
            onDrop={(e) => { e.preventDefault(); canDrag && onDrop(index); }}
            onDragOver={(e) => e.preventDefault()}
            className="touch-none"
        >
            <div
                className={`w-full transition-all duration-200 ease-out`}
                style={{
                    height: isDropTarget ? '2px' : '0px',
                    opacity: isDropTarget ? 1 : 0,
                    margin: isDropTarget ? '2px 0' : '0',
                    backgroundColor: '#fc4b08'
                }}
            />
            <div className={`transition-opacity duration-200 ${isBeingDragged ? 'opacity-40' : 'opacity-100'}`}>
                <QueueItem song={song} isPlaying={isNowPlaying} onPlay={onPlay} navigateToArtist={navigateToArtist} addedBy={addedBy} />
            </div>
        </div>
    );
});

const QueueView: React.FC<{ navigateToArtist: (artistId: string) => void }> = ({ navigateToArtist }) => {
    const { currentQueue, currentSong, playSong, reorderQueue, contextId, contextType, autoplayStartIndex, repeatMode } = useContext(PlayerContext);
    const { partyState, isHost, reorderPartyQueue } = useContext(PartyContext);
    const { t } = useTranslation();
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

    const queue = partyState ? (partyState.currentQueue || []) : currentQueue;
    const song = partyState ? partyState.currentSong : currentSong;
    const playContext = partyState ? { type: 'party' as const, id: partyState.partyId } : { type: contextType || 'queue', id: contextId || song?.id || '' };

    const currentSongIndex = song ? queue.findIndex(s => s.id === song.id) : -1;
    
    const upNextSongs = currentSongIndex !== -1 ? queue.slice(currentSongIndex + 1) : queue;
    const previouslyPlayedSongs = currentSongIndex !== -1 ? queue.slice(0, currentSongIndex) : [];

    const isAutoplayEnabled = !partyState && repeatMode === 'off';
    
    const willAutoplaySoon = isAutoplayEnabled && upNextSongs.length === 0;

    const handleDragStart = (index: number) => setDraggedIndex(index);
    const handleDragEnter = (index: number) => { if (draggedIndex !== null && draggedIndex !== index) setDropTargetIndex(index); };
    const handleDrop = (index: number) => {
        if (draggedIndex === null) return;
        partyState ? reorderPartyQueue(draggedIndex, index) : reorderQueue(draggedIndex, index);
        handleDragEnd();
    };
    const handleDragEnd = () => { setDraggedIndex(null); setDropTargetIndex(null); };

    const handlePlaySongFromQueue = (songToPlay: Song) => {
        if (songToPlay.id === song?.id || (partyState && !isHost)) return;
        playSong(songToPlay, queue as Song[], playContext as any);
    };
    
    const commonDragProps = {
        draggedIndex, dropTargetIndex, onDragStart: handleDragStart, onDragEnter: handleDragEnter, onDrop: handleDrop, onDragEnd: handleDragEnd, navigateToArtist,
    };
    
    const renderDraggableItem = (songItem: PartyQueueSong | Song, index: number, isNowPlaying = false) => {
        const addedBy = (partyState && 'addedBy' in songItem)
            ? partyState.participants.find(p => p.id === (songItem as PartyQueueSong).addedBy)
            : undefined;
        return <DraggableQueueItem {...commonDragProps} onPlay={() => handlePlaySongFromQueue(songItem)} song={songItem} index={index} isNowPlaying={isNowPlaying} addedBy={addedBy} />;
    }
    
    const AutoplayBanner = () => (
         <div className="my-3 p-3 bg-white/5 border border-white/10 rounded-lg flex items-center space-x-3 animate-in fade-in">
            <div className="p-2 bg-[#fc4b08]/20 rounded-full flex-shrink-0">
                <SignalIcon className="w-5 h-5 text-[#fc4b08]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{t('queue.autoplay')}</p>
                <p className="text-[10px] md:text-xs text-gray-400 leading-tight">{t('queue.autoplaySubtitle')}</p>
            </div>
        </div>
    );

    return (
         <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
             {song && currentSongIndex !== -1 && (
                <div className="mb-4">
                    <p className="text-sm font-bold uppercase text-gray-400 mb-2 px-2">{t('queue.nowPlaying')}</p>
                    {renderDraggableItem(song, currentSongIndex, true)}
                </div>
            )}
            
             {upNextSongs.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-bold uppercase text-gray-400 mb-2 px-2">{t('queue.upNext')}</p>
                    {upNextSongs.map((s, i) => {
                        const originalIndex = currentSongIndex + 1 + i;
                        const isFirstAutoplaySong = !partyState && autoplayStartIndex !== null && originalIndex === autoplayStartIndex;
                        return (
                            <React.Fragment key={s.id + originalIndex}>
                                {isFirstAutoplaySong && <AutoplayBanner />}
                                {renderDraggableItem(s, originalIndex)}
                            </React.Fragment>
                        );
                    })}
                </div>
             )}
             
             {willAutoplaySoon && <AutoplayBanner />}

             {previouslyPlayedSongs.length > 0 && (
                 <div className="pt-4 border-t border-white/10 mt-4">
                    <p className="text-sm font-bold uppercase text-gray-400 mb-2 px-2">{t('queue.previouslyPlayed')}</p>
                    {previouslyPlayedSongs.map((s, i) => (
                       <React.Fragment key={s.id + i}>
                        {renderDraggableItem(s, i)}
                       </React.Fragment>
                    ))}
                </div>
             )}
             
            {queue.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <QueueIcon className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="font-bold text-gray-400">{t('queue.empty')}</h3>
                    <p className="text-sm text-gray-500">{t('queue.emptySubtitle')}</p>
                </div>
            )}
        </div>
    );
};


export const QueueSidebar: React.FC<{ navigateToArtist: (artistId: string) => void }> = ({ navigateToArtist }) => {
    const { partyState } = useContext(PartyContext);
    const { toggleQueue } = useContext(PlayerContext);
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!partyState?.partyId) return;
        navigator.clipboard.writeText(partyState.partyId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <aside className="w-full bg-black/40 backdrop-blur-3xl p-6 flex flex-col h-full border-l border-white/10 shadow-2xl">
            {partyState ? (
                <>
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{t('queue.party')}</h2>
                            <button
                                onClick={handleCopy}
                                title={t('queue.copyCode')}
                                className="relative text-xs font-bold uppercase bg-[#fc4b08]/20 text-[#fc4b08] px-3 py-1 rounded-md hover:bg-[#fc4b08]/30 transition-all duration-200 border border-[#fc4b08]/20"
                                style={{ minWidth: '70px' }}
                            >
                               <span className={`transition-opacity duration-300 ${copied ? 'opacity-0' : 'opacity-100'}`}>{partyState.partyId}</span>
                               <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`}>{t('queue.copied')}</span>
                            </button>
                        </div>
                        <button onClick={() => toggleQueue(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-shrink-0 mb-6">
                        <PartyParticipantList />
                    </div>
                    <hr className="border-white/10 mb-6"/>
                    <QueueView navigateToArtist={navigateToArtist} />
                </>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-white tracking-tight">{t('queue.queue')}</h2>
                        <button onClick={() => toggleQueue(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <QueueView navigateToArtist={navigateToArtist} />
                </>
            )}
        </aside>
    );
};
