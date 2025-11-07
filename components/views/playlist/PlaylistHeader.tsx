import React, { useState, useRef, useEffect, useContext } from 'react';
import { LocalPlaylist, View } from '../../../types';
import { PlayerContext } from '../../../context/PlayerContext';
import { UserMusicContext } from '../../../context/UserMusicContext';
import { ModalContext } from '../../../App';

declare const JSZip: any;

// Icons
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>
);
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);
const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-2m0 0l-6 2m6-2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2zm-6 2v6a2 2 0 002 2h2a2 2 0 002-2v-6" /></svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
);
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
);
const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);

const getTitleClass = (name: string): string => {
    const base = "font-extrabold tracking-tighter leading-tight";
    if (name.length > 50) return `${base} text-3xl sm:text-4xl`;
    if (name.length > 30) return `${base} text-4xl sm:text-5xl`;
    return `${base} text-4xl sm:text-6xl`;
}

interface PlaylistHeaderProps {
    playlist: LocalPlaylist;
    setActiveView: (view: View) => void;
    onOpenQuickAdd: () => void;
}

export const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({ playlist, setActiveView, onOpenQuickAdd }) => {
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showModal, hideModal } = useContext(ModalContext);

    const { playSong, addSongsToEnd, currentSong, isPlaying, togglePlay, selectedQuality } = useContext(PlayerContext);
    const { deletePlaylist, updatePlaylist } = useContext(UserMusicContext);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) setIsActionMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const isPlaylistCurrentlyPlaying = playlist.songs?.some(s => s.id === currentSong?.id);

    const handlePlayPlaylist = () => {
        if (isPlaylistCurrentlyPlaying) togglePlay();
        else if (playlist.songs && playlist.songs.length > 0) playSong(playlist.songs[0], playlist.songs, playlist.id);
    }

    const handleDelete = () => {
        setIsActionMenuOpen(false);
        showModal({
          title: "Delete Playlist",
          content: (
              <>
                  <p className="text-gray-300 mb-6">{`Are you sure you want to delete "${playlist.name}"?`}</p>
                  <div className="flex justify-end space-x-4">
                      <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
                      <button onClick={() => { deletePlaylist(playlist.id); hideModal(); setActiveView('library'); }} className="px-4 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-500">Delete</button>
                  </div>
              </>
          )
        })
    }
  
    const handleEditDetails = () => {
      let newName = playlist.name;
      let newDesc = playlist.description;
      showModal({
        title: "Edit Details",
        content: (
          <>
              <div className="space-y-4 text-gray-300 mb-6 mt-4">
                  <input type="text" defaultValue={newName} onChange={e => newName = e.target.value} className="w-full bg-white/10 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc4b08]" placeholder="Playlist Name" />
                  <textarea rows={3} defaultValue={newDesc} onChange={e => newDesc = e.target.value} className="w-full bg-white/10 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc4b08]" placeholder="Description (optional)" />
              </div>
              <div className="flex justify-end space-x-4">
                   <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
                   <button onClick={() => { updatePlaylist(playlist.id, { name: newName, description: newDesc }); hideModal(); }} className="px-4 py-2 rounded-md bg-[#fc4b08] text-black font-bold">Save</button>
              </div>
          </>
        )
      });
    };
  
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
              const base64 = loadEvent.target?.result as string;
              updatePlaylist(playlist.id, { coverUrl: base64 });
          };
          reader.readAsDataURL(file);
      }
    };
  
    const handleAddToQueue = () => {
      if (playlist?.songs) addSongsToEnd(playlist.songs);
      setIsActionMenuOpen(false);
    };
    
    const handlePlayShuffle = () => {
      if (playlist?.songs && playlist.songs.length > 0) {
          const shuffled = [...playlist.songs];
          for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          playSong(shuffled[0], shuffled, playlist.id);
      }
      setIsActionMenuOpen(false);
    };
  
    const handleDownloadAll = async () => {
      if (!playlist?.songs || playlist.songs.length === 0) return;
      const zip = new JSZip();
      let filesAdded = 0;
      const totalFiles = playlist.songs.length;
      showModal({ title: "Preparing Download", content: <p>Fetching... (0/${totalFiles})</p> });
      for (const song of playlist.songs) {
          const url = song.downloadUrl.find(q => q.quality === '320kbps')?.url || song.downloadUrl[0]?.url;
          if (!url) continue;
          try {
              const response = await fetch(url.replace(/^http:/, 'https:'));
              const blob = await response.blob();
              zip.file(`${song.artists.primary.map(a => a.name).join(', ')} - ${song.name}.mp3`, blob);
              filesAdded++;
               showModal({ title: "Preparing Download", content: <div className="space-y-2"><p>Fetching {filesAdded}/{totalFiles}...</p><div className="w-full bg-gray-600 rounded-full h-2.5"><div className="bg-[#fc4b08] h-2.5 rounded-full" style={{ width: `${(filesAdded / totalFiles) * 100}%` }}></div></div></div> });
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
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours > 0 ? hours + ' hr ' : ''}${minutes} min`;
    };
    const imageUrl = playlist.coverUrl || playlist.songs[0]?.image?.find(img => img.quality === '500x500')?.url || playlist.songs[0]?.image?.[0]?.url;

    return (
        <>
            <div className="p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 relative">
                <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
                    {imageUrl && <img src={imageUrl} className="w-full h-full object-cover blur-3xl scale-125" alt=""/>}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
                </div>
                <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-lg shadow-2xl z-10 flex-shrink-0 bg-white/5 flex items-center justify-center group relative overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleCoverChange} accept="image/*" className="hidden"/>
                    {imageUrl ? <img src={imageUrl} alt={playlist.name} className="w-full h-full object-cover" /> : <MinimalistMusicIcon className="w-1/2 h-1/2 text-gray-400"/>}
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <CameraIcon className="w-10 h-10"/>
                        <span className="text-sm font-bold mt-1">Choose Photo</span>
                    </div>
                </div>
                <div className="z-10 text-center sm:text-left">
                    <p className="text-sm font-bold uppercase tracking-wider">Playlist</p>
                    <h1 className={`${getTitleClass(playlist.name)} cursor-pointer`} onClick={handleEditDetails}>{playlist.name}</h1>
                    <p className="text-gray-300 mt-1 text-sm cursor-pointer line-clamp-2" onClick={handleEditDetails}>{playlist.description}</p>
                    <div className="flex items-center justify-center sm:justify-start text-gray-300 mt-2 text-sm">
                        <span>{playlist.songs.length} songs, {formatTotalDuration(totalDuration)}</span>
                    </div>
                </div>
            </div>
            
            <div className="sticky top-0 z-20 backdrop-blur-md bg-gradient-to-b from-[#121212] via-[#121212]/70 to-transparent">
                <div className="px-8 py-5">
                    <div className="flex items-center gap-5">
                        <button onClick={handlePlayPlaylist} className="w-14 h-14 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 transform hover:scale-105 transition-all">
                        {isPlaylistCurrentlyPlaying && isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 ml-1"/>}
                        </button>
                        <div className="relative" ref={actionMenuRef}>
                            <button onClick={() => setIsActionMenuOpen(p => !p)} title="More options" className="p-3 rounded-full hover:bg-white/10 transition-colors">
                                <MoreIcon className="w-8 h-8 text-gray-400 hover:text-white"/>
                            </button>
                            {isActionMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                                    <button onClick={handleAddToQueue} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Add to queue</button>
                                    <button onClick={handlePlayShuffle} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Play with shuffle</button>
                                    <hr className="border-t border-white/10 my-1"/>
                                    <button onClick={() => {handleEditDetails(); setIsActionMenuOpen(false);}} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-md hover:bg-white/10"><PencilIcon className="w-4 h-4"/>Edit details</button>
                                    <button onClick={() => {handleDownloadAll(); setIsActionMenuOpen(false);}} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-md hover:bg-white/10"><DownloadIcon className="w-4 h-4"/>Download .zip</button>
                                    <button onClick={handleDownloadM3U} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10">Download .m3u playlist</button>
                                    <hr className="border-t border-white/10 my-1"/>
                                    <button onClick={handleDelete} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-md text-red-400 hover:bg-white/10 hover:text-red-300"><TrashIcon className="w-4 h-4"/>Delete playlist</button>
                                </div>
                            )}
                        </div>
                        <button onClick={onOpenQuickAdd} title="Add songs" className="p-2 rounded-full hover:bg-white/10 transition-colors ml-auto">
                            <PlusIcon className="w-7 h-7 text-gray-300 hover:text-white"/>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
