import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Playlist, Song, View } from '../../types';
import { searchSongs } from '../../services/jioSaavnApi';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { Loader } from '../ui/Loader';
import { ModalContext } from '../../App';

declare const JSZip: any;

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const MusicNoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.07 1.918l-7.5 4.5a2.25 2.25 0 01-2.36 0L3.32 16.17a2.25 2.25 0 01-1.07-1.918v-3.75m11.25-6.333V3.75A2.25 2.25 0 0010.5 1.5h-5.25A2.25 2.25 0 003 3.75v5.25m11.25 0l-10.5-3m10.5 3v6.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5V9.75m11.25-3.75z" />
    </svg>
);

const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const ApiPlaylistTrackItem: React.FC<{
    song: Song;
    index: number;
    playlistSongs: Song[];
    navigateToArtist: (artistId: string) => void;
}> = ({ song, index, playlistSongs, navigateToArtist }) => {
    const { playSong, currentSong, addSongNext, addSongsToEnd } = useContext(PlayerContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isCurrent = song.id === currentSong?.id;

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
          }
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
        <div onClick={() => playSong(song, playlistSongs)} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 p-2 px-4 rounded-md hover:bg-white/10 cursor-pointer group">
            <span className={`text-center w-5 ${isCurrent ? 'text-[#fc4b08]' : 'text-gray-400'}`}>{index + 1}</span>
            <div>
                <p className={`font-medium truncate ${isCurrent ? 'text-[#fc4b08]' : 'text-white'}`}>{song.name}</p>
                <p className="text-sm text-gray-400 truncate">
                    {song.artists.primary.map((a, i) => (
                        <React.Fragment key={a.id}>
                            <span onClick={(e) => { e.stopPropagation(); navigateToArtist(a.id); }} className="hover:underline">{a.name}</span>
                            {i < song.artists.primary.length - 1 && ', '}
                        </React.Fragment>
                    ))}
                </p>
            </div>
            <span className="text-sm text-gray-400 opacity-70 group-hover:opacity-100 transition-opacity">{formatDuration(song.duration)}</span>
            <div className="relative" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreIcon className="w-5 h-5"/>
                </button>
                {isMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-1 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                        <button onClick={(e) => handleMenuAction(e, () => addSongNext(song))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Play Next</button>
                        <button onClick={(e) => handleMenuAction(e, () => addSongsToEnd([song]))} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Add to Queue</button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ApiPlaylistViewProps {
    playlist: Playlist;
    setActiveView: (view: View) => void;
    navigateToArtist: (artistId: string) => void;
}

const getTitleClass = (name: string): string => {
    const base = "font-extrabold tracking-tighter leading-tight";
    if (name.length > 50) return `${base} text-3xl sm:text-4xl`;
    if (name.length > 30) return `${base} text-4xl sm:text-5xl`;
    return `${base} text-4xl sm:text-6xl`;
}

const ApiPlaylistView: React.FC<ApiPlaylistViewProps> = ({ playlist, setActiveView, navigateToArtist }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<'default' | 'title' | 'duration'>('default');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const { showModal, hideModal } = useContext(ModalContext);

    const { playSong, addSongsToEnd, currentSong, isPlaying, togglePlay } = useContext(PlayerContext);
    const { createPlaylist, playlists: localPlaylists, isFavoriteApiPlaylist, toggleFavoriteApiPlaylist } = useContext(UserMusicContext);
    
    useEffect(() => {
        const fetchSongs = async () => {
            if (!playlist) return;
            setLoading(true);
            try {
                const response = await searchSongs(playlist.name, 1, 50);
                if (response.success) setSongs(response.data.results);
            } catch (error) {
                console.error("Failed to fetch playlist songs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSongs();
    }, [playlist]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) setIsSortMenuOpen(false);
          if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) setIsActionMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedSongs = useMemo(() => {
        const songsCopy = [...songs];
        switch (sortKey) {
            case 'title': return songsCopy.sort((a, b) => a.name.localeCompare(b.name));
            case 'duration': return songsCopy.sort((a, b) => (a.duration || 0) - (b.duration || 0));
            default: return songs;
        }
    }, [songs, sortKey]);

    if (!playlist) return <div className="p-8 text-center text-gray-400">Playlist not found.</div>;

    const isPlaylistCurrentlyPlaying = songs.some(s => s.id === currentSong?.id);

    const handlePlayPlaylist = () => {
        if (isPlaylistCurrentlyPlaying) togglePlay();
        else if (songs.length > 0) playSong(songs[0], songs);
    };

    const isPlaylistSaved = useMemo(() => localPlaylists.some(p => p.name === playlist.name), [localPlaylists, playlist.name]);

    const handleSavePlaylist = () => {
        if (songs.length > 0 && !isPlaylistSaved) {
            createPlaylist(playlist.name, playlist.description || `From public playlist`, songs);
            showModal({
                title: "Playlist Saved",
                content: (
                    <>
                        <p className="text-gray-300 mb-6">{`"${playlist.name}" has been added to your library.`}</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Close</button>
                            <button onClick={() => { hideModal(); setActiveView('library'); }} className="px-4 py-2 rounded-md bg-[#fc4b08] text-black font-bold">View in Library</button>
                        </div>
                    </>
                )
            });
        }
    };
    
    const handleDownloadAll = async () => {
        if (!songs || songs.length === 0) return;
        const zip = new JSZip();
        let filesAdded = 0;
        const totalFiles = songs.length;
        showModal({ title: "Preparing Download", content: <p>Fetching... (0/${totalFiles})</p> });
        for (const song of songs) {
            const url = song.downloadUrl.find(q => q.quality === '320kbps')?.url || song.downloadUrl[0]?.url;
            if (!url) continue;
            try {
                const response = await fetch(url.replace(/^http:/, 'https:'));
                const blob = await response.blob();
                zip.file(`${song.artists.primary.map(a => a.name).join(', ')} - ${song.name}.mp3`, blob);
                filesAdded++;
                showModal({ title: "Preparing Download", content: <div className="space-y-2"><p>Fetching song {filesAdded} of {totalFiles}...</p><div className="w-full bg-gray-600 rounded-full h-2.5"><div className="bg-[#fc4b08] h-2.5 rounded-full" style={{ width: `${(filesAdded / totalFiles) * 100}%` }}></div></div></div> });
            } catch (error) { console.error(`Download failed for ${song.name}:`, error); }
        }
        if (filesAdded === 0) {
            showModal({ title: "Download Failed", content: <p>Could not download any songs.</p> });
            return;
        }
        showModal({ title: "Zipping Files", content: <p>Creating .zip file...</p> });
        zip.generateAsync({ type: "blob" }, (metadata) => {
            showModal({ title: "Zipping Files", content: <div className="space-y-2"><p>Compressing... {metadata.percent.toFixed(0)}%</p><div className="w-full bg-gray-600 rounded-full h-2.5"><div className="bg-[#fc4b08] h-2.5 rounded-full" style={{ width: `${metadata.percent}%` }}></div></div></div> });
        }).then((content) => {
            const zipUrl = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = `${playlist.name}.zip`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(zipUrl);
            a.remove();
            hideModal();
        }).catch(err => {
            showModal({ title: "Error", content: <p>Failed to create .zip file.</p> });
        });
      };

    const imageUrl = playlist.image?.find(img => img.quality === '500x500')?.url || playlist.image?.[0]?.url;
    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);

    return (
        <div className="text-white">
            <div className="p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 relative">
                <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
                    {imageUrl && <img src={imageUrl} className="w-full h-full object-cover blur-3xl scale-125" alt=""/>}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
                </div>
                <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-lg shadow-2xl z-10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                    {imageUrl ? <img src={imageUrl} alt={playlist.name} className="w-full h-full object-cover rounded-lg" /> : <MusicNoteIcon className="w-1/2 h-1/2 text-gray-400"/>}
                </div>
                <div className="z-10 text-center sm:text-left">
                    <p className="text-sm font-bold uppercase tracking-wider">Public Playlist</p>
                    <h1 className={getTitleClass(playlist.name)}>{playlist.name}</h1>
                    <div className="flex items-center justify-center sm:justify-start text-gray-300 mt-2 text-sm">
                        <span>{songs.length || playlist.songCount} songs, {`${Math.floor(totalDuration / 60)} min`}</span>
                    </div>
                </div>
            </div>
            
            <div className="sticky top-0 z-20 backdrop-blur-md bg-gradient-to-b from-[#121212] via-[#121212]/70 to-transparent">
                <div className="px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button onClick={handlePlayPlaylist} className="w-14 h-14 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 transform hover:scale-105 transition-all">
                          {isPlaylistCurrentlyPlaying && isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 ml-1"/>}
                        </button>
                        <button onClick={handleSavePlaylist} disabled={isPlaylistSaved} title={isPlaylistSaved ? "Already in your library" : "Save to your library"} className="p-3 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                            {isPlaylistSaved ? <CheckIcon className="w-8 h-8 text-green-400" /> : <PlusIcon className="w-8 h-8 text-gray-400 hover:text-white" />}
                        </button>
                        <button onClick={() => toggleFavoriteApiPlaylist(playlist)} title="Favorite" className="p-3 rounded-full hover:bg-white/10 transition-colors">
                            <HeartIcon className={`w-8 h-8 ${isFavoriteApiPlaylist(playlist.id) ? 'fill-[#fc4b08] text-[#fc4b08]' : 'text-gray-400 hover:text-white'}`}/>
                        </button>
                        <button onClick={handleDownloadAll} title="Download all" className="p-3 rounded-full hover:bg-white/10 transition-colors">
                            <DownloadIcon className="w-8 h-8 text-gray-400 hover:text-white"/>
                        </button>
                        <div className="relative" ref={actionMenuRef}>
                            <button onClick={() => setIsActionMenuOpen(p => !p)} title="More..." className="p-3 rounded-full hover:bg-white/10 transition-colors">
                                <MoreIcon className="w-8 h-8 text-gray-400 hover:text-white"/>
                            </button>
                             {isActionMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                                    <button onClick={() => {addSongsToEnd(songs); setIsActionMenuOpen(false);}} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Add to queue</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-8 pb-8">
                 {loading ? <Loader /> : songs.length > 0 ? (
                    <>
                    <div className="flex justify-between items-center text-gray-400 border-b border-white/10 pb-2 mb-2 px-4 text-sm uppercase font-semibold">
                        <div className="flex items-center gap-x-4"><span className="text-center w-5">#</span><span>Title</span></div>
                        <div className="flex items-center gap-x-4">
                        <div className="relative" ref={sortMenuRef}>
                            <button onClick={() => setIsSortMenuOpen(p => !p)} className="flex items-center gap-2 text-xs hover:text-white"><span >SORT BY</span><ChevronDownIcon className="w-4 h-4"/></button>
                            {isSortMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                                    <button onClick={() => {setSortKey('default'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-md h:bg-white/10 ${sortKey === 'default' && 'text-[#fc4b08]'}`}>Default</button>
                                    <button onClick={() => {setSortKey('title'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-md h:bg-white/10 ${sortKey === 'title' && 'text-[#fc4b08]'}`}>Title</button>
                                    <button onClick={() => {setSortKey('duration'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-md h:bg-white/10 ${sortKey === 'duration' && 'text-[#fc4b08]'}`}>Duration</button>
                                </div>
                            )}
                        </div>
                        <span title="Duration"><ClockIcon className="w-5 h-5" /></span><div className="w-5"></div>
                        </div>
                    </div>
                    {sortedSongs.map((song, index) => <ApiPlaylistTrackItem key={song.id+index} song={song} index={index} playlistSongs={sortedSongs} navigateToArtist={navigateToArtist} />)}
                    </>
                 ) : (
                    <div className="text-center py-10"><p className="text-gray-400">Could not find songs for this playlist.</p></div>
                 )}
            </div>
        </div>
    );
};

export default ApiPlaylistView;