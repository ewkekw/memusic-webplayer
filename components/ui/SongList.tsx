
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Song } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { ModalContext } from '../../App';
import { CreatePlaylistForm } from './CreatePlaylistForm';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>);

const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-:--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

interface SongListItemProps {
  song: Song;
  index: number;
  songs: Song[];
  playlistId?: string;
  navigateToArtist: (artistId: string) => void;
  onInteraction?: () => void;
  navigateToPlaylist?: (playlistId: string) => void;
}

const SongListItem: React.FC<SongListItemProps> = ({ song, index, songs, playlistId, navigateToArtist, onInteraction, navigateToPlaylist }) => {
    const { playSong, addSongNext, addSongsToEnd } = useContext(PlayerContext);
    const { isFavoriteSong, toggleFavoriteSong, removeSongFromPlaylist, playlists, createPlaylist, addSongToPlaylist } = useContext(UserMusicContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const [activeMenu, setActiveMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const handlePlay = () => {
        onInteraction?.();
        playSong(song, songs, playlistId);
    }
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setActiveMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuAction = (action: () => void) => {
        onInteraction?.();
        action();
        setActiveMenu(false);
    };

    const handleCreateNewPlaylist = (songToAdd: Song) => {
        showModal({
            title: "Create New Playlist",
            content: <CreatePlaylistForm initialSong={songToAdd} onCancel={hideModal} onConfirm={(name, desc) => {
                const newPlaylist = createPlaylist(name, desc, [songToAdd]);
                hideModal();
                if (navigateToPlaylist) navigateToPlaylist(newPlaylist.id);
            }} />,
        });
    };

    const imageUrl = song.image?.find(img => img.quality === '50x50')?.url || song.image?.[0]?.url;

    return (
        <div onMouseLeave={() => setActiveMenu(false)} className="group flex items-center p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 h-20">
            <div className="w-8 text-center text-gray-400 mr-4 flex-shrink-0 group-hover:hidden">{index + 1}</div>
            <button onClick={handlePlay} className="w-8 h-8 items-center justify-center rounded-full text-white hidden group-hover:flex mr-4 flex-shrink-0"><PlayIcon className="w-5 h-5 translate-x-px" /></button>
            <img src={imageUrl} alt={song.name} className="w-12 h-12 rounded-md mr-4 flex-shrink-0" />
            <div className="flex-1 min-w-0" onClick={handlePlay}>
                <p className="font-semibold text-white leading-snug line-clamp-2 cursor-pointer" title={song.name}>{song.name}</p>
                <p className="text-sm text-gray-400 truncate leading-snug">
                    {song.artists.primary.map((artist, i) => (<React.Fragment key={artist.id}><span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:underline cursor-pointer">{artist.name}</span>{i < song.artists.primary.length - 1 && ', '}</React.Fragment>))}
                </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
                <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => toggleFavoriteSong(song)); }} className="text-gray-400 hover:text-[#fc4b08] p-2 rounded-full hover:bg-white/10"><HeartIcon className={`w-5 h-5 ${isFavoriteSong(song.id) ? 'fill-[#fc4b08] text-[#fc4b08]' : ''}`} /></button>
                {playlistId && (<button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => removeSongFromPlaylist(playlistId, song.id)); }} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-white/10"><TrashIcon className="w-5 h-5" /></button>)}
                <div className="relative" ref={menuRef}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(prev => !prev); }} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"><MoreIcon className="w-5 h-5" /></button>
                    {activeMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30 max-h-60 overflow-y-auto custom-scrollbar">
                            <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => addSongNext(song)) }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Play Next</button>
                            <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => addSongsToEnd([song])) }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Add to Queue</button>
                            <hr className="border-t border-white/10 my-1"/>
                            <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase">Add to playlist</p>
                            <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => handleCreateNewPlaylist(song)) }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">New Playlist</button>
                            {playlists.map(p => (<button key={p.id} onClick={(e) => { e.stopPropagation(); handleMenuAction(() => addSongToPlaylist(p.id, song)) }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 truncate">{p.name}</button>))}
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-400 w-12 text-right">{formatDuration(song.duration)}</p>
            </div>
        </div>
    );
};

interface SongListProps {
  songs: Song[];
  playlistId?: string;
  navigateToArtist: (artistId: string) => void;
  onInteraction?: () => void;
  navigateToPlaylist?: (playlistId: string) => void;
}

export const SongList: React.FC<SongListProps> = (props) => {
  const { songs } = props;

  if (!songs || songs.length === 0) {
    return <p className="text-gray-400 p-4 text-center">No songs to display.</p>;
  }

  return (
    <div className="space-y-1">
      {songs.map((song, index) => (
        <SongListItem
          key={song.id + index}
          song={song}
          index={index}
          songs={songs}
          {...props}
        />
      ))}
    </div>
  );
};
