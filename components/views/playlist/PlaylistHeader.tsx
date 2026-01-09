
import React, { useState, useRef, useEffect, useContext } from 'react';
import { LocalPlaylist, View } from '../../../types';
import { PlayerContext } from '../../../context/PlayerContext';
import { UserMusicContext } from '../../../context/UserMusicContext';
import { ModalContext } from '../../../context/ModalContext';
import { CinematicHeader } from '../../ui/CinematicHeader';
import { useTranslation } from '../../../context/LanguageContext';
import { SmartMenu } from '../../ui/SmartMenu';

declare const JSZip: any;

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
);
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const ShuffleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
);
const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
);
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
);

interface PlaylistHeaderProps {
    playlist: LocalPlaylist;
    setActiveView: (view: View) => void;
    onOpenQuickAdd: () => void;
}

export const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({ playlist, setActiveView, onOpenQuickAdd }) => {
    const { t } = useTranslation();
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const { showModal, hideModal } = useContext(ModalContext);

    const { playSong, addSongsToEnd, isPlaying, togglePlay, selectedQuality, contextId } = useContext(PlayerContext);
    const { deletePlaylist, updatePlaylist } = useContext(UserMusicContext);
    
    const isPlaylistCurrentlyPlaying = contextId === playlist.id;

    const handlePlayPlaylist = () => {
        if (isPlaylistCurrentlyPlaying) togglePlay();
        else if (playlist.songs && playlist.songs.length > 0) playSong(playlist.songs[0], playlist.songs, { type: 'playlist', id: playlist.id });
    }

    const handleDelete = () => {
        setIsActionMenuOpen(false);
        showModal({
          title: t('playlistView.deletePlaylistTitle'),
          content: (
              <>
                  <p className="text-gray-300 mb-6">{t('playlistView.deletePlaylistConfirm', { name: playlist.name })}</p>
                  <div className="flex justify-end space-x-4">
                      <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">{t('playlistView.cancel')}</button>
                      <button onClick={() => { deletePlaylist(playlist.id); hideModal(); setActiveView('library'); }} className="px-4 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-500">{t('playlistView.delete')}</button>
                  </div>
              </>
          )
        })
    }
  
    const handleEditDetails = () => {
      let newName = playlist.name;
      let newDesc = playlist.description;
      showModal({
        title: t('playlistView.editDetailsTitle'),
        content: (
          <>
              <div className="space-y-4 text-gray-300 mb-6 mt-4">
                  <input type="text" defaultValue={newName} onChange={e => newName = e.target.value} className="w-full bg-white/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc4b08]" placeholder={t('playlistView.playlistName')} />
                  <textarea rows={3} defaultValue={newDesc} onChange={e => newDesc = e.target.value} className="w-full bg-white/10 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fc4b08]" placeholder={t('playlistView.description')} />
              </div>
              <div className="flex justify-end space-x-4">
                   <button onClick={hideModal} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-bold">{t('playlistView.cancel')}</button>
                   <button onClick={() => { updatePlaylist(playlist.id, { name: newName, description: newDesc }); hideModal(); }} className="px-6 py-2 rounded-lg bg-[#fc4b08] text-black font-bold shadow-lg shadow-[#fc4b08]/20">{t('playlistView.save')}</button>
              </div>
          </>
        )
      });
    };
  
    const handleCoverChange = (file: File) => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const base64 = loadEvent.target?.result as string;
            updatePlaylist(playlist.id, { coverUrl: base64 });
        };
        reader.readAsDataURL(file);
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
          playSong(shuffled[0], shuffled, { type: 'playlist', id: playlist.id });
      }
      setIsActionMenuOpen(false);
    };
  
    const handleDownloadAll = async () => {
      if (!playlist?.songs || playlist.songs.length === 0) return;
      const zip = new JSZip();
      let filesAdded = 0;
      const totalFiles = playlist.songs.length;
      showModal({ title: t('albumView.downloadPreparing'), content: <p>{t('albumView.downloadFetching', {current: 0, total: totalFiles})}</p> });
      
      for (const song of playlist.songs) {
          const url = song.downloadUrl.find(q => q.quality === '320kbps')?.url || song.downloadUrl[0]?.url;
          if (!url) continue;
          try {
              const response = await fetch(url.replace(/^http:/, 'https:'));
              const blob = await response.blob();
              zip.file(`${song.artists.primary.map(a => a.name).join(', ')} - ${song.name}.mp3`, blob);
              filesAdded++;
               showModal({ 
                   title: t('albumView.downloadPreparing'), 
                   content: (
                       <div className="space-y-2">
                           <p>{t('albumView.downloadFetching_plural', {current: filesAdded, total: totalFiles})}</p>
                           <div className="w-full bg-gray-600 rounded-full h-1"><div className="bg-[#fc4b08] h-1 rounded-full" style={{ width: `${(filesAdded / totalFiles) * 100}%` }}></div></div>
                       </div>
                   ) 
                });
          } catch (error) { console.error(`Download failed for ${song.name}:`, error); }
      }
      if (filesAdded === 0) {
          showModal({ title: t('albumView.downloadFailed'), content: <p>{t('albumView.downloadFailedMsg')}</p> });
          return;
      }
      showModal({ title: t('albumView.downloadCompressing'), content: <p>{t('albumView.downloadCompressingMsg')}</p> });
      zip.generateAsync({ type: "blob" }, (metadata: { percent: number }) => {
          showModal({ title: t('albumView.downloadCompressing'), content: <div className="space-y-2"><p>{t('albumView.downloadCompressingProgress', { percent: metadata.percent.toFixed(0) })}</p><div className="w-full bg-gray-600 rounded-full h-1"><div className="bg-[#fc4b08] h-1 rounded-full" style={{ width: `${metadata.percent}%` }}></div></div></div> });
      }).then((content: Blob) => {
          const zipUrl = URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = zipUrl;
          a.download = `${playlist.name}.zip`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(zipUrl);
          a.remove();
          hideModal();
      }).catch((err: unknown) => {
          showModal({ title: t('albumView.error'), content: <p>{t('albumView.errorZip')}</p> });
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
    const metaString = `${playlist.songs.length} songs • ${formatTotalDuration(totalDuration)}`;

    return (
        <>
            <CinematicHeader
                title={playlist.name}
                description={playlist.description}
                type={t('playlistView.playlist')}
                imageUrl={imageUrl}
                meta={metaString}
                isPlaying={isPlaying}
                isCurrentContext={isPlaylistCurrentlyPlaying}
                onPlay={handlePlayPlaylist}
                isFavorite={true}
                onToggleFavorite={() => {}}
                isEditable={true}
                onEditTitle={handleEditDetails}
                onImageUpload={handleCoverChange}
            >
                <button 
                    ref={moreButtonRef}
                    onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(p => !p); }} 
                    className="w-12 h-12 rounded-full border border-transparent hover:bg-white/5 flex items-center justify-center transition-all text-gray-400 hover:text-white"
                >
                    <MoreIcon className="w-6 h-6" />
                </button>

                <button 
                    onClick={onOpenQuickAdd} 
                    className="flex items-center gap-2 px-6 py-3 font-bold rounded-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 text-white transition-all ml-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>{t('playlistView.addSongs')}</span>
                </button>
            </CinematicHeader>

            <SmartMenu isOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} triggerRef={moreButtonRef} width="w-64">
                <div className="flex flex-col py-1">
                    <button onClick={handleAddToQueue} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><QueueIcon className="w-4 h-4" />{t('albumView.addToQueue')}</button>
                    <button onClick={handlePlayShuffle} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><ShuffleIcon className="w-4 h-4" />{t('albumView.playShuffle')}</button>
                    <div className="h-px bg-white/10 my-1 mx-2" />
                    <button onClick={() => {handleEditDetails(); setIsActionMenuOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><PencilIcon className="w-4 h-4"/>{t('playlistView.editDetails')}</button>
                    <button onClick={() => {handleDownloadAll(); setIsActionMenuOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><DownloadIcon className="w-4 h-4"/>{t('apiPlaylistView.downloadZip')}</button>
                    <button onClick={handleDownloadM3U} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><DownloadIcon className="w-4 h-4"/>{t('albumView.downloadM3U')}</button>
                    <div className="h-px bg-white/10 my-1 mx-2" />
                    <button onClick={handleDelete} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"><TrashIcon className="w-4 h-4"/>{t('playlistView.delete')}</button>
                </div>
            </SmartMenu>
        </>
    );
};
