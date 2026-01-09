
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Album, View } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { Loader } from '../ui/Loader';
import { SongList } from '../ui/SongList';
import { ModalContext } from '../../context/ModalContext';
import { useAlbum } from '../../hooks/useAlbum';
import { useTranslation } from '../../context/LanguageContext';
import { CinematicHeader } from '../ui/CinematicHeader';
import { SmartMenu } from '../ui/SmartMenu';

declare const JSZip: any;

const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
);
const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
);
const ShuffleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
);

interface AlbumViewProps {
  albumId: string;
  setActiveView: (view: View) => void;
  navigateToArtist: (artistId: string) => void;
  navigateToPlaylist: (playlistId: string) => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({ albumId, setActiveView, navigateToArtist, navigateToPlaylist }) => {
  const { album, loading, error } = useAlbum(albumId);
  const { t } = useTranslation();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const { showModal, hideModal } = useContext(ModalContext);

  const { playSong, addSongsToEnd, isPlaying, togglePlay, selectedQuality, contextId } = useContext(PlayerContext);
  const { isFavoriteAlbum, toggleFavoriteAlbum } = useContext(UserMusicContext);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader /></div>;
  if (error || !album) return <div className="p-8 text-center text-gray-400">{error || 'Album not found or failed to load.'}</div>;

  const isAlbumCurrentlyPlaying = contextId === album.id;

  const handlePlayAlbum = () => {
      if (isAlbumCurrentlyPlaying) {
          togglePlay();
      } else if (album.songs && album.songs.length > 0) {
          playSong(album.songs[0], album.songs, { type: 'album', id: album.id });
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
        playSong(shuffled[0], shuffled, { type: 'album', id: album.id });
    }
    setIsActionMenuOpen(false);
  };
  
  const handleDownloadAll = async () => {
    if (!album?.songs || album.songs.length === 0) return;
    const zip = new JSZip();
    let filesAdded = 0;
    const totalFiles = album.songs.length;
    showModal({
        title: t('albumView.downloadPreparing'),
        content: <p>{t('albumView.downloadFetching', {current: 0, total: totalFiles})}</p>,
    });
    for (const song of album.songs) {
        const url = song.downloadUrl.find(q => q.quality === '320kbps')?.url || song.downloadUrl[0]?.url;
        if (!url) {
            continue;
        }
        try {
            const response = await fetch(url.replace(/^http:/, 'https:'));
            const blob = await response.blob();
            const fileName = `${song.artists.primary.map(a => a.name).join(', ')} - ${song.name}.mp3`;
            zip.file(fileName, blob);
            filesAdded++;
             showModal({
                title: t('albumView.downloadPreparing'),
                content: (
                  <div className="space-y-2">
                    <p>{t('albumView.downloadFetching_plural', {current: filesAdded, total: totalFiles})}</p>
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
            title: t('albumView.downloadFailed'),
            content: <><p className="text-gray-300 mb-6">{t('albumView.downloadFailedMsg')}</p><div className="flex justify-end"><button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">{t('albumView.close')}</button></div></>,
        });
        return;
    }
    showModal({
        title: t('albumView.downloadCompressing'),
        content: <p>{t('albumView.downloadCompressingMsg')}</p>,
    });
    zip.generateAsync({ type: "blob" }, (metadata: { percent: number }) => {
        showModal({
            title: t('albumView.downloadCompressing'),
            content: (
              <div className="space-y-2">
                <p>{t('albumView.downloadCompressingProgress', { percent: metadata.percent.toFixed(0) })}</p>
                 <div className="w-full bg-gray-600 rounded-full h-2.5">
                    <div className="bg-[#fc4b08] h-2.5 rounded-full" style={{ width: `${metadata.percent}%` }}></div>
                </div>
              </div>
            ),
        });
    }).then((content: any) => {
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
    }).catch((err: any) => {
        console.error("Failed to generate zip", err);
         showModal({
            title: t('albumView.error'),
            content: <><p className="text-gray-300 mb-6">{t('albumView.errorZip')}</p><div className="flex justify-end"><button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">{t('albumView.close')}</button></div></>,
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
      return t('albumView.duration', { duration: minutes });
  };
  const imageUrl = album.image?.find(img => img.quality === '500x500')?.url || album.image?.[0]?.url;
  
  const subtitle = (
      <span>
        {album.artists.primary.map((a, i) => (
            <React.Fragment key={a.id}>
                <span onClick={(e) => {e.stopPropagation(); navigateToArtist(a.id)}} className="hover:text-white hover:underline cursor-pointer transition-colors font-bold">{a.name}</span>
                {i < album.artists.primary.length - 1 && ', '}
            </React.Fragment>
        ))}
      </span>
  );

  const metaString = `${album.year} • ${t('albumView.songs', { count: album.songCount || 0 })} • ${formatTotalDuration(totalDuration)}`;

  return (
    <div className="text-white pb-20">
      <CinematicHeader
        title={album.name}
        type={t('albumView.album')}
        subtitle={subtitle}
        imageUrl={imageUrl}
        meta={metaString}
        isPlaying={isPlaying}
        isCurrentContext={isAlbumCurrentlyPlaying}
        onPlay={handlePlayAlbum}
        isFavorite={isFavoriteAlbum(album.id)}
        onToggleFavorite={() => toggleFavoriteAlbum(album)}
      >
        <button 
            ref={moreButtonRef}
            onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(p => !p); }} 
            className="p-3 rounded-full hover:bg-white/10 transition-all active:scale-90 text-gray-300 hover:text-white"
        >
            <MoreIcon className="w-7 h-7" />
        </button>
      </CinematicHeader>

      <SmartMenu isOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} triggerRef={moreButtonRef} width="w-64">
        <div className="flex flex-col py-1">
            <button onClick={handleAddToQueue} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><QueueIcon className="w-4 h-4" />{t('albumView.addToQueue')}</button>
            <button onClick={handlePlayShuffle} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><ShuffleIcon className="w-4 h-4" />{t('albumView.playShuffle')}</button>
            <div className="h-px bg-white/10 my-1 mx-2" />
            <button onClick={() => {handleDownloadAll(); setIsActionMenuOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><DownloadIcon className="w-4 h-4"/>{t('albumView.downloadAll')}</button>
            <button onClick={handleDownloadM3U} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><DownloadIcon className="w-4 h-4"/>{t('albumView.downloadM3U')}</button>
        </div>
      </SmartMenu>

      <div className="px-6 md:px-12 mt-8">
        <div className="bg-white/5 rounded-[2rem] border border-white/5 p-2 md:p-6 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <SongList
                songs={album.songs || []}
                navigateToArtist={navigateToArtist}
                navigateToPlaylist={navigateToPlaylist}
                context={{ type: 'album', id: album.id }}
            />
        </div>
      </div>
    </div>
  );
};

export default AlbumView;
