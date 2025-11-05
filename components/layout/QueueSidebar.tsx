
import React, { useContext, useState, useRef, useEffect } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { Song } from '../../types';

const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);
const SpeakerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

// Fix: Added QueueIcon definition to resolve "Cannot find name 'QueueIcon'" error.
const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
);

interface QueueItemProps {
    song: Song;
    isPlaying: boolean;
    onPlay: () => void;
    index: number;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    navigateToArtist: (artistId: string) => void;
}

const QueueItem: React.FC<QueueItemProps> = ({ song, isPlaying, onPlay, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, navigateToArtist }) => {
    const { removeSongFromQueue, moveSongInQueue } = useContext(PlayerContext);
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

    return (
        <div 
            onClick={onPlay}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            onDragEnd={onDragEnd}
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-300 ${isPlaying ? 'bg-white/10' : 'hover:bg-white/10'} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        >
            <img src={imageUrl} alt={song.name} className="w-10 h-10 rounded-md mr-3 flex-shrink-0" />
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
            <div className="relative" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p);}} className="p-2 rounded-full hover:bg-white/20 text-gray-400 hover:text-white">
                    <MoreIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-50">
                        <button onClick={() => handleMenuAction(() => moveSongInQueue(song.id, 'top'))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Move to Top</button>
                        <button onClick={() => handleMenuAction(() => moveSongInQueue(song.id, 'bottom'))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Move to Bottom</button>
                        <button onClick={() => handleMenuAction(() => removeSongFromQueue(song.id))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 text-red-400 hover:text-red-300">Remove from Queue</button>
                    </div>
                )}
            </div>
        </div>
    );
};


export const QueueSidebar: React.FC<{ navigateToArtist: (artistId: string) => void }> = ({ navigateToArtist }) => {
    const { currentQueue, currentSong, playSong, reorderQueue } = useContext(PlayerContext);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

    const currentSongIndex = currentSong ? currentQueue.findIndex(song => song.id === currentSong.id) : -1;
    
    const upNextSongs = currentSongIndex !== -1 ? currentQueue.slice(currentSongIndex + 1) : [];
    const previouslyPlayedSongs = currentSongIndex !== -1 ? currentQueue.slice(0, currentSongIndex) : [];
    
    if(currentSongIndex === -1 && currentQueue.length > 0) {
        upNextSongs.push(...currentQueue);
    }
    
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDropTargetIndex(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if(draggedIndex === null) return;
        reorderQueue(draggedIndex, index);
        handleDragEnd();
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDropTargetIndex(null);
    };

    return (
        <aside className="w-80 bg-black/30 backdrop-blur-md p-4 flex flex-col space-y-4 h-full border-l border-white/10">
            <h2 className="text-2xl font-bold text-white">Queue</h2>
            
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                 {currentSong && currentSongIndex !== -1 && (
                    <div className="mb-4">
                        <p className="text-sm font-bold uppercase text-gray-400 mb-2 px-2">Now Playing</p>
                        <QueueItem 
                            song={currentSong} 
                            isPlaying={true} 
                            onPlay={() => {}} 
                            index={currentSongIndex}
                            onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd}
                            isDragging={draggedIndex === currentSongIndex}
                            navigateToArtist={navigateToArtist}
                        />
                    </div>
                )}

                 {upNextSongs.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-bold uppercase text-gray-400 mb-2 px-2">Up Next</p>
                        {upNextSongs.map((song, i) => {
                            const originalIndex = currentSongIndex + 1 + i;
                            return (
                                <div key={song.id + i} className="relative">
                                    <QueueItem
                                        song={song}
                                        isPlaying={false}
                                        onPlay={() => playSong(song, currentQueue)}
                                        index={originalIndex}
                                        onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd}
                                        isDragging={draggedIndex === originalIndex}
                                        navigateToArtist={navigateToArtist}
                                    />
                                    {dropTargetIndex === originalIndex && <div className="absolute -top-1 left-0 right-0 h-0.5 bg-[#fc4b08]"></div>}
                                </div>
                            );
                        })}
                    </div>
                 )}

                 {previouslyPlayedSongs.length > 0 && (
                     <div className="pt-4 border-t border-white/10">
                        <p className="text-sm font-bold uppercase text-gray-400 mb-2 px-2">Previously Played</p>
                        {previouslyPlayedSongs.map((song, i) => (
                           <div key={song.id + i} className="relative">
                             <QueueItem
                                 song={song}
                                 isPlaying={false}
                                 onPlay={() => playSong(song, currentQueue)}
                                 index={i}
                                 onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd}
                                 isDragging={draggedIndex === i}
                                 navigateToArtist={navigateToArtist}
                             />
                             {dropTargetIndex === i && <div className="absolute -top-1 left-0 right-0 h-0.5 bg-[#fc4b08]"></div>}
                           </div>
                        ))}
                    </div>
                 )}

                {currentQueue.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <QueueIcon className="w-12 h-12 text-gray-600 mb-4" />
                        <h3 className="font-bold text-gray-400">Your Queue is Empty</h3>
                        <p className="text-sm text-gray-500">Add some songs to get started!</p>
                    </div>
                )}
            </div>
        </aside>
    );
};
