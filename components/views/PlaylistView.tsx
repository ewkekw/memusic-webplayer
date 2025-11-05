
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Song, View, LocalPlaylist } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';

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
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
const MusicNoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.07 1.918l-7.5 4.5a2.25 2.25 0 01-2.36 0L3.32 16.17a2.25 2.25 0 01-1.07-1.918v-3.75m11.25-6.333V3.75A2.25 2.25 0 0010.5 1.5h-5.25A2.25 2.25 0 003 3.75v5.25m11.25 0l-10.5-3m10.5 3v6.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5V9.75m11.25-3.75z" />
    </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
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

interface PlaylistViewProps {
  playlistId: string;
  setActiveView: (view: View) => void;
  navigateToArtist: (artistId: string) => void;
  showModal: (content: { title: string; content: React.ReactNode; actions: React.ReactNode; }) => void;
  hideModal: () => void;
}

const getTitleClass = (name: string): string => {
    const base = "font-extrabold tracking-tighter leading-tight";
    if (name.length > 50) return `${base} text-3xl sm:text-4xl`;
    if (name.length > 30) return `${base} text-4xl sm:text-5xl`;
    return `${base} text-4xl sm:text-6xl`;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, setActiveView, navigateToArtist, showModal, hideModal }) => {
  const [playlist, setPlaylist] = useState<LocalPlaylist | null>(null);
  const [sortKey, setSortKey] = useState<'default' | 'title' | 'duration'>('default');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);


  const { playSong, addSongsToEnd, currentSong, isPlaying, togglePlay, selectedQuality } = useContext(PlayerContext);
  const { playlists, deletePlaylist } = useContext(UserMusicContext);

  useEffect(() => {
    const foundPlaylist = playlists.find(p => p.id === playlistId) || null;
    setPlaylist(foundPlaylist);
  }, [playlistId, playlists]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedSongs = useMemo(() => {
    if (!playlist?.songs) return [];
    const songsCopy = [...playlist.songs];
    switch (sortKey) {
        case 'title':
            return songsCopy.sort((a, b) => a.name.localeCompare(b.name));
        case 'duration':
            return songsCopy.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        case 'default':
        default:
            return playlist.songs;
    }
  }, [playlist?.songs, sortKey]);

  if (!playlist) return <div className="p-8 text-center text-gray-400">Playlist not found. It may have been deleted.</div>;

  const isPlaylistCurrentlyPlaying = playlist.songs?.some(s => s.id === currentSong?.id);

  const handlePlayPlaylist = () => {
      if (isPlaylistCurrentlyPlaying) {
          togglePlay();
      } else if (playlist.songs && playlist.songs.length > 0) {
          playSong(playlist.songs[0], playlist.songs);
      }
  }

  const handleDelete = () => {
      if(window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
          deletePlaylist(playlist.id);
          setActiveView('library');
      }
      setIsActionMenuOpen(false);
  }

  const handleAddToQueue = () => {
    if (playlist?.songs) {
        addSongsToEnd(playlist.songs);
    }
    setIsActionMenuOpen(false);
  };
  
  const handlePlayShuffle = () => {
    if (playlist?.songs && playlist.songs.length > 0) {
        const shuffled = [...playlist.songs];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        playSong(shuffled[0], shuffled);
    }
    setIsActionMenuOpen(false);
  };

  const handleDownloadAll = async () => {
    if (!playlist?.songs || playlist.songs.length === 0) return;

    const zip = new JSZip();
    let filesAdded = 0;
    const totalFiles = playlist.songs.length;

    showModal({
        title: "Preparing Download",
        content: `Fetching songs... (0/${totalFiles})`,
        actions: <div className="text-gray-400">Please wait...</div>,
    });

    for (const song of playlist.songs) {
        const url = song.downloadUrl.find(q => q.quality === '320kbps')?.url || song.downloadUrl[0]?.url;
        if (!url) {
            console.warn(`Skipping ${song.name}: No download URL found.`);
            continue;
        }

        try {
            const response = await fetch(url.replace(/^http:/, 'https:'));
            const blob = await response.blob();
            const fileName = `${song.artists.primary.map(a => a.name).join(', ')} - ${song.name}.mp3`;
            zip.file(fileName, blob);
            filesAdded++;
             showModal({
                title: "Preparing Download",
                content: (
                  <div className="space-y-2">
                    <p>Fetching song {filesAdded} of {totalFiles}...</p>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <div className="bg-[#fc4b08] h-2.5 rounded-full" style={{ width: `${(filesAdded / totalFiles) * 100}%` }}></div>
                    </div>
                  </div>
                ),
                actions: <div className="text-gray-400">Please wait...</div>,
            });
        } catch (error) {
            console.error(`Failed to download ${song.name}:`, error);
        }
    }

    if (filesAdded === 0) {
        showModal({
            title: "Download Failed",
            content: "Could not download any songs for this playlist.",
            actions: <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Close</button>
        });
        return;
    }

    showModal({
        title: "Zipping Files",
        content: "Creating your .zip file. This might take a moment...",
        actions: <div className="text-gray-400">Please wait...</div>,
    });

    zip.generateAsync({ type: "blob" }, (metadata) => {
        showModal({
            title: "Zipping Files",
            content: (
              <div className="space-y-2">
                <p>Compressing... {metadata.percent.toFixed(0)}%</p>
                 <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div className="bg-[#fc4b08] h-2.5 rounded-full" style={{ width: `${metadata.percent}%` }}></div>
                </div>
              </div>
            ),
            actions: <div className="text-gray-400">Please wait...</div>,
        });
    }).then((content) => {
        const zipUrl = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = zipUrl;
        a.download = `${playlist.name}.zip`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(zipUrl);
        a.remove();
        hideModal();
    }).catch(err => {
        console.error("Failed to generate zip file", err);
         showModal({
            title: "Error",
            content: "Failed to create the .zip file.",
            actions: <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Close</button>
        });
    });
  };

  const handleDownloadM3U = () => {
    if (!playlist || !playlist.songs) return;

    let m3uContent = "#EXTM3U\n";
    playlist.songs.forEach(song => {
        const duration = song.duration ?? -1;
        const artist = song.artists.primary.map(a => a.name).join(', ');
        const title = song.name;
        const url = song.downloadUrl.find(q => q.quality === selectedQuality)?.url || song.downloadUrl.find(q => q.quality === '320kbps')?.url || song.downloadUrl[0]?.url;

        if (url) {
            m3uContent += `#EXTINF:${duration},${artist} - ${title}\n`;
            m3uContent += `${url.replace(/^http:/, 'https:')}\n`;
        }
    });

    const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsActionMenuOpen(false);
  };

  const totalDuration = playlist.songs?.reduce((acc, song) => acc + (song.duration || 0), 0) || 0;
  const formatTotalDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} min`;
  };

  const imageUrl = playlist.coverUrl || playlist.songs[0]?.image?.find(img => img.quality === '500x500')?.url || playlist.songs[0]?.image?.[0]?.url;

  const handleSortSelect = (key: 'default' | 'title' | 'duration') => {
    setSortKey(key);
    setIsSortMenuOpen(false);
  }

  return (
    <div className="text-white">
      <div className="p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 relative">
          <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
             {imageUrl && <img src={imageUrl} className="w-full h-full object-cover blur-3xl scale-125" alt=""/>}
             <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
          </div>

          <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-lg shadow-2xl z-10 flex-shrink-0 bg-white/5 flex items-center justify-center">
            {imageUrl ? (
                <img src={imageUrl} alt={playlist.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
                <MusicNoteIcon className="w-1/2 h-1/2 text-gray-400"/>
            )}
          </div>

          <div className="z-10 text-center sm:text-left">
              <p className="text-sm font-bold uppercase tracking-wider">Playlist</p>
              <h1 className={getTitleClass(playlist.name)}>{playlist.name}</h1>
              {playlist.description && <p className="text-gray-300 mt-1">{playlist.description}</p>}
              <div className="flex items-center justify-center sm:justify-start text-gray-300 mt-2 text-sm">
                  <span>{playlist.songs.length} songs, {formatTotalDuration(totalDuration)}</span>
              </div>
          </div>
      </div>
      
      <div className="relative">
        <div className="sticky top-0 z-20 backdrop-blur-md bg-gradient-to-b from-[#121212] via-[#121212]/70 to-transparent">
            <div className="px-8 py-5">
                <div className="flex items-center gap-5">
                    <button onClick={handlePlayPlaylist} className="w-14 h-14 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 transform hover:scale-105 transition-all">
                      {isPlaylistCurrentlyPlaying && isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 ml-1"/>}
                    </button>
                    <button onClick={handleDownloadAll} title="Download all songs" className="p-3 rounded-full hover:bg-white/10 transition-colors">
                        <DownloadIcon className="w-7 h-7 text-gray-400 hover:text-white"/>
                    </button>
                     <div className="relative" ref={actionMenuRef}>
                        <button onClick={() => setIsActionMenuOpen(p => !p)} title="More options" className="p-3 rounded-full hover:bg-white/10 transition-colors">
                            <MoreIcon className="w-7 h-7 text-gray-400 hover:text-white"/>
                        </button>
                        {isActionMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                                <button onClick={handleAddToQueue} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Add to queue</button>
                                <button onClick={handlePlayShuffle} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Play with shuffle</button>
                                <button onClick={handleDownloadM3U} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Download .m3u playlist</button>
                                <hr className="border-t border-white/10 my-1"/>
                                <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-sm rounded-md text-red-400 hover:bg-white/10 hover:text-red-300">Delete playlist</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="px-4 sm:px-8 pb-8">
            <div className="flex justify-between items-center text-gray-400 border-b border-white/10 pb-2 mb-2 px-4 text-sm uppercase font-semibold">
                <div className="flex items-center gap-x-4">
                  <span className="text-center w-5">#</span>
                  <span>Title</span>
                </div>
                <div className="flex items-center gap-x-4">
                  <div className="relative" ref={sortMenuRef}>
                      <button onClick={() => setIsSortMenuOpen(p => !p)} className="flex items-center gap-2 text-xs hover:text-white transition-colors">
                          <span>SORT BY</span>
                          <ChevronDownIcon className="w-4 h-4"/>
                      </button>
                      {isSortMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                              <button onClick={() => handleSortSelect('default')} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 ${sortKey === 'default' ? 'text-[#fc4b08]' : ''}`}>Default Order</button>
                              <button onClick={() => handleSortSelect('title')} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 ${sortKey === 'title' ? 'text-[#fc4b08]' : ''}`}>Title</button>
                              <button onClick={() => handleSortSelect('duration')} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 ${sortKey === 'duration' ? 'text-[#fc4b08]' : ''}`}>Duration</button>
                          </div>
                      )}
                  </div>
                  <span title="Duration"><ClockIcon className="w-5 h-5" /></span>
                  <div className="w-5"></div>
                </div>
            </div>
            {sortedSongs.map((song, index) => (
                <PlaylistTrackItem key={song.id} song={song} index={index} playlistSongs={sortedSongs || []} playlistId={playlist.id} navigateToArtist={navigateToArtist} />
            ))}
            {sortedSongs.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-gray-400">This playlist is empty.</p>
                    <p className="text-sm text-gray-500">Find some songs to add!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistView;