

import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Album, Song, View } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { Loader } from '../ui/Loader';
import { SongList } from '../ui/SongList';
import { ModalContext } from '../../App';
import { useAlbum } from '../../hooks/useAlbum';

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
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

interface AlbumViewProps {
  albumId: string;
  setActiveView: (view: View) => void;
  navigateToArtist: (artistId: string) => void;
  navigateToPlaylist: (playlistId: string) => void;
}

const getTitleClass = (name: string): string => {
    const base = "font-extrabold tracking-tighter leading-tight";
    if (name.length > 50) return `${base} text-3xl sm:text-4xl`;
    if (name.length > 30) return `${base} text-4xl sm:text-5xl`;
    return `${base} text-4xl sm:text-6xl`;
}

const AlbumView: React.FC<AlbumViewProps> = ({ albumId, setActiveView, navigateToArtist, navigateToPlaylist }) => {
  const { album, loading, error } = useAlbum(albumId);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const { showModal, hideModal } = useContext(ModalContext);

  const { playSong, addSongsToEnd, currentSong, isPlaying, togglePlay, selectedQuality } = useContext(PlayerContext);
  const { isFavoriteAlbum, toggleFavoriteAlbum } = useContext(UserMusicContext);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader /></div>;
  if (error || !album) return <div className="p-8 text-center text-gray-400">{error || 'Album not found or failed to load.'}</div>;

  const isAlbumCurrentlyPlaying = album.songs?.some(s => s.id === currentSong?.id);

  const handlePlayAlbum = () => {
      if (isAlbumCurrentlyPlaying) {
          togglePlay();
      } else if (album.songs && album.songs.length > 0) {
          playSong(album.songs[0], album.songs);
      }
  }

  const handleAddToQueue = () => {
    if (album?.songs) {
        addSongsToEnd(album.songs);
    }
    setIsActionMenuOpen(false);
  };
  
  const handlePlayShuffle = () => {
    if (album?.songs && album.songs.length > 0) {
        const shuffled = [...album.songs];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        playSong(shuffled[0], shuffled);
    }
    setIsActionMenuOpen(false);
  };
  
  const handleDownloadAll = async () => {
    if (!album?.songs || album.songs.length === 0) return;
    const zip = new JSZip();
    let filesAdded = 0;
    const totalFiles = album.songs.length;
    showModal({
        title: "Preparing Download",
        content: <p>Fetching songs... (0/${totalFiles})</p>,
    });
    for (const song of album.songs) {
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
            });
        } catch (error) {
            console.error(`Failed to download ${song.name}:`, error);
        }
    }
    if (filesAdded === 0) {
        showModal({
            title: "Download Failed",
            content: <><p className="text-gray-300 mb-6">Could not download any songs for this album.</p><div className="flex justify-end"><button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Close</button></div></>,
        });
        return;
    }
    showModal({
        title: "Zipping Files",
        content: <p>Creating your .zip file. This might take a moment...</p>,
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
        });
    }).then((content) => {
        const zipUrl = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = zipUrl;
        a.download = `${album.name}.zip`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(zipUrl);
        a.remove();
        hideModal();
    }).catch(err => {
        console.error("Failed to generate zip file", err);
         showModal({
            title: "Error",
            content: <><p className="text-gray-300 mb-6">Failed to create the .zip file.</p><div className="flex justify-end"><button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Close</button></div></>,
        });
    });
  };
  
  const handleDownloadM3U = () => {
    if (!album || !album.songs) return;
    let m3uContent = "#EXTM3U\n";
    album.songs.forEach(song => {
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
    a.download = `${album.name}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsActionMenuOpen(false);
  };

  const totalDuration = album.songs?.reduce((acc, song) => acc + (song.duration || 0), 0) || 0;
  const formatTotalDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} min`;
  };
  const imageUrl = album.image?.find(img => img.quality === '500x500')?.url || album.image?.[0]?.url;

  return (
    <div className="text-white">
      <div className="p-4 md:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 relative">
          <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
             <img src={imageUrl} className="w-full h-full object-cover blur-3xl scale-125" alt="" loading="lazy" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
          </div>

          <img src={imageUrl} alt={album.name} className="w-40 h-40 sm:w-52 sm:h-52 rounded-lg shadow-2xl z-10 flex-shrink-0 object-cover animate-image-appear" loading="lazy" />
          <div className="z-10 text-center sm:text-left">
              <p className="text-sm font-bold uppercase tracking-wider">Album</p>
              <h1 className={getTitleClass(album.name)}>{album.name}</h1>
              <div className="flex items-center justify-center sm:justify-start text-gray-300 mt-2 text-sm flex-wrap">
                  <span>
                    {album.artists.primary.map((a, i) => (
                        <React.Fragment key={a.id}>
                            <span onClick={() => navigateToArtist(a.id)} className="hover:underline cursor-pointer">{a.name}</span>
                            {i < album.artists.primary.length - 1 && ', '}
                        </React.Fragment>
                    ))}
                  </span>
                  <span className="mx-2 hidden sm:inline">&bull;</span>
                  <span className="hidden sm:inline">{album.year}</span>
                  <span className="mx-2 hidden sm:inline">&bull;</span>
                  <span>{album.songCount} songs, {formatTotalDuration(totalDuration)}</span>
              </div>
          </div>
      </div>
      
      <div className="relative">
        <div className="sticky top-0 z-20 backdrop-blur-md bg-gradient-to-b from-[#121212] via-[#121212]/70 to-transparent">
            <div className="px-4 md:px-8 py-5">
                <div className="flex items-center">
                    <div className="flex items-center gap-4 md:gap-5">
                        <button onClick={handlePlayAlbum} className="w-12 h-12 md:w-14 md:h-14 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 transform hover:scale-105 transition-all">
                          {isAlbumCurrentlyPlaying && isPlaying ? <PauseIcon className="w-7 md:w-8 h-7 md:h-8"/> : <PlayIcon className="w-7 md:w-8 h-7 md:h-8 ml-1"/>}
                        </button>
                        <button onClick={() => toggleFavoriteAlbum(album)} title={isFavoriteAlbum(album.id) ? "Remove from favorites" : "Add to favorites"} className="p-2 md:p-3 rounded-full hover:bg-white/10 transition-colors">
                            <HeartIcon className={`w-7 md:w-8 h-7 md:h-8 transition-all ${isFavoriteAlbum(album.id) ? 'fill-[#fc4b08] text-[#fc4b08]' : 'text-gray-400 hover:text-white'}`}/>
                        </button>
                        <button onClick={handleDownloadAll} title="Download all songs" className="p-2 md:p-3 rounded-full hover:bg-white/10 transition-colors">
                            <DownloadIcon className="w-7 md:w-8 h-7 md:h-8 text-gray-400 hover:text-white"/>
                        </button>
                        <div className="relative" ref={actionMenuRef}>
                            <button onClick={() => setIsActionMenuOpen(p => !p)} title="More options" className="p-2 md:p-3 rounded-full hover:bg-white/10 transition-colors">
                                <MoreIcon className="w-7 md:w-8 h-7 md:h-8 text-gray-400 hover:text-white"/>
                            </button>
                            {isActionMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                                    <button onClick={handleAddToQueue} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Add to queue</button>
                                    <button onClick={handlePlayShuffle} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Play with shuffle</button>
                                    <button onClick={handleDownloadM3U} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Download .m3u playlist</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="px-4 sm:px-8 pb-8">
            <SongList songs={album.songs || []} navigateToArtist={navigateToArtist} navigateToPlaylist={navigateToPlaylist}/>
        </div>
      </div>
    </div>
  );
};

export default AlbumView;