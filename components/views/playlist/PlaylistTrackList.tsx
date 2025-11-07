
import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';
import { Song, LocalPlaylist } from '../../../types';
import { PlayerContext } from '../../../context/PlayerContext';
import { UserMusicContext } from '../../../context/UserMusicContext';

// Icons
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
);

const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

interface PlaylistTrackItemProps {
    song: Song;
    index: number;
    playlistSongs: Song[];
    playlistId: string;
    navigateToArtist: (artistId: string) => void;
}

const PlaylistTrackItem: React.FC<PlaylistTrackItemProps> = ({ song, index, playlistSongs, playlistId, navigateToArtist }) => {
    const { playSong, currentSong, addSongNext, addSongsToEnd } = useContext(PlayerContext);
    const { removeSongFromPlaylist } = useContext(UserMusicContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isCurrent = song.id === currentSong?.id;

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        setIsMenuOpen(false);
    }

    return (
        <div onClick={() => playSong(song, playlistSongs, playlistId)} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 p-2 px-4 rounded-md hover:bg-white/10 cursor-pointer group">
            <span className={`text-center w-5 ${isCurrent ? 'text-[#fc4b08]' : 'text-gray-400'}`}>{index + 1}</span>
            <div>
                <p className={`font-medium truncate ${isCurrent ? 'text-[#fc4b08]' : 'text-white'}`}>{song.name}</p>
                <p className="text-sm text-gray-400 truncate">
                    {song.artists.primary.map((artist, index) => (<React.Fragment key={artist.id}><span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:underline cursor-pointer">{artist.name}</span>{index < song.artists.primary.length - 1 && ', '}</React.Fragment>))}
                </p>
            </div>
            <span className="text-sm text-gray-400 opacity-70 group-hover:opacity-100 transition-opacity">{formatDuration(song.duration)}</span>
            <div className="relative" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreIcon className="w-5 h-5"/>
                </button>
                {isMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-1 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                        <button onClick={(e) => handleMenuAction(e, () => addSongNext(song))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Play Next</button>
                        <button onClick={(e) => handleMenuAction(e, () => addSongsToEnd([song]))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Add to Queue</button>
                        <button onClick={(e) => handleMenuAction(e, () => removeSongFromPlaylist(playlistId, song.id))} className="w-full text-left px-3 py-2 text-sm rounded-md text-red-400 hover:bg-white/10 hover:text-red-300">Remove from Playlist</button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface PlaylistTrackListProps {
    playlist: LocalPlaylist;
    navigateToArtist: (artistId: string) => void;
}

export const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({ playlist, navigateToArtist }) => {
    const [sortKey, setSortKey] = useState<'default' | 'title' | 'duration'>('default');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) setIsSortMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedSongs = useMemo(() => {
        if (!playlist?.songs) return [];
        const songsCopy = [...playlist.songs];
        switch (sortKey) {
            case 'title': return songsCopy.sort((a, b) => a.name.localeCompare(b.name));
            case 'duration': return songsCopy.sort((a, b) => (a.duration || 0) - (b.duration || 0));
            default: return playlist.songs;
        }
    }, [playlist?.songs, sortKey]);

    return (
        <>
            {playlist.songs && playlist.songs.length > 0 ? (
                <>
                <div className="flex justify-between items-center text-gray-400 border-b border-white/10 pb-2 mb-2 px-4 text-sm uppercase font-semibold">
                    <div className="flex items-center gap-x-4"><span className="text-center w-5">#</span><span>Title</span></div>
                    <div className="flex items-center gap-x-4">
                    <div className="relative" ref={sortMenuRef}>
                        <button onClick={() => setIsSortMenuOpen(p => !p)} className="flex items-center gap-2 text-xs hover:text-white"><span >SORT BY</span><ChevronDownIcon className="w-4 h-4"/></button>
                        {isSortMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                                <button onClick={() => {setSortKey('default'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 ${sortKey === 'default' ? 'text-[#fc4b08]' : ''}`}>Default</button>
                                <button onClick={() => {setSortKey('title'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 ${sortKey === 'title' ? 'text-[#fc4b08]' : ''}`}>Title</button>
                                <button onClick={() => {setSortKey('duration'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 ${sortKey === 'duration' ? 'text-[#fc4b08]' : ''}`}>Duration</button>
                            </div>
                        )}
                    </div>
                    <span title="Duration"><ClockIcon className="w-5 h-5" /></span><div className="w-5"></div>
                    </div>
                </div>
                {sortedSongs.map((song, index) => <PlaylistTrackItem key={song.id+index} song={song} index={index} playlistSongs={sortedSongs} playlistId={playlist.id} navigateToArtist={navigateToArtist} />)}
                </>
            ) : (
                <div className="text-center py-10"><p className="text-gray-400">This playlist is empty.</p></div>
            )}
        </>
    );
};
