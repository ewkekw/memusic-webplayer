
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Playlist, Song, View } from '../../types';
import { searchSongs } from '../../services/jioSaavnApi';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { Loader } from '../ui/Loader';
import { ModalContext } from '../../context/ModalContext';
import { CinematicHeader } from '../ui/CinematicHeader';
import { useTranslation } from '../../context/LanguageContext';
import { SmartMenu } from '../ui/SmartMenu';

declare const JSZip: any;

const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
);
const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const RadioIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>
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
    playlist: Playlist;
    navigateToArtist: (artistId: string) => void;
}> = ({ song, index, playlistSongs, playlist, navigateToArtist }) => {
    const { playSong, currentSong, addSongNext, addSongsToEnd, playRadio } = useContext(PlayerContext);
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLButtonElement>(null);

    const isCurrent = song.id === currentSong?.id;

    const handleMenuAction = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    }

    return (
        <div onClick={() => playSong(song, playlistSongs, { type: 'api_playlist', id: playlist.id })} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 p-3 px-4 rounded-xl hover:bg-white/10 cursor-pointer group transition-colors">
            <span className={`text-center w-6 font-medium ${isCurrent ? 'text-[#fc4b08]' : 'text-gray-500'}`}>{index + 1}</span>
            <div>
                <p className={`font-semibold truncate text-base ${isCurrent ? 'text-[#fc4b08]' : 'text-white'}`}>{song.name}</p>
                <p className="text-sm text-gray-400 truncate mt-0.5">
                    {song.artists.primary.map((a, i) => (
                        <React.Fragment key={a.id}>
                            <span onClick={(e) => { e.stopPropagation(); navigateToArtist(a.id); }} className="hover:text-white hover:underline transition-colors">{a.name}</span>
                            {i < song.artists.primary.length - 1 && ', '}
                        </React.Fragment>
                    ))}
                </p>
            </div>
            <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors hidden sm:block font-variant-numeric tabular-nums">{formatDuration(song.duration)}</span>
            
            <button ref={menuRef} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                <MoreIcon className="w-5 h-5"/>
            </button>
            
            <SmartMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} triggerRef={menuRef}>
                <div className="flex flex-col py-1">
                    <button onClick={(e) => {e.stopPropagation(); handleMenuAction(() => playRadio(song))}} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 flex items-center gap-3 text-gray-200 transition-colors"><RadioIcon className="w-4 h-4"/>{t('songlist.menu.goToRadio')}</button>
                    <button onClick={(e) => {e.stopPropagation(); handleMenuAction(() => addSongNext(song))}} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors">{t('songlist.menu.playNext')}</button>
                    <button onClick={(e) => {e.stopPropagation(); handleMenuAction(() => addSongsToEnd([song]))}} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors">{t('songlist.menu.addToQueue')}</button>
                </div>
            </SmartMenu>
        </div>
    );
};

interface ApiPlaylistViewProps {
    playlist: Playlist;
    setActiveView: (view: View) => void;
    navigateToArtist: (artistId: string) => void;
}

const ApiPlaylistView: React.FC<ApiPlaylistViewProps> = ({ playlist, setActiveView, navigateToArtist }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<'default' | 'title' | 'duration'>('default');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const sortMenuRef = useRef<HTMLButtonElement>(null);
    const moreButtonRef = useRef<HTMLButtonElement>(null);
    const { showModal, hideModal } = useContext(ModalContext);
    const { t } = useTranslation();

    const { playSong, addSongsToEnd, isPlaying, togglePlay, contextId } = useContext(PlayerContext);
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

    const sortedSongs = useMemo(() => {
        const songsCopy = [...songs];
        switch (sortKey) {
            case 'title': return songsCopy.sort((a, b) => a.name.localeCompare(b.name));
            case 'duration': return songsCopy.sort((a, b) => (a.duration || 0) - (b.duration || 0));
            default: return songs;
        }
    }, [songs, sortKey]);

    if (!playlist) return <div className="p-8 text-center text-gray-400">Playlist not found.</div>;

    const isPlaylistCurrentlyPlaying = contextId === playlist.id;

    const handlePlayPlaylist = () => {
        if (isPlaylistCurrentlyPlaying) togglePlay();
        else if (songs.length > 0) playSong(songs[0], songs, { type: 'api_playlist', id: playlist.id });
    };

    const isPlaylistSaved = useMemo(() => localPlaylists.some(p => p.name === playlist.name), [localPlaylists, playlist.name]);

    const handleSavePlaylist = () => {
        if (songs.length > 0 && !isPlaylistSaved) {
            createPlaylist(playlist.name, playlist.description || `From public playlist`, songs);
            showModal({
                title: t('apiPlaylistView.savedModalTitle'),
                content: (
                    <>
                        <p className="text-gray-300 mb-6">{t('apiPlaylistView.savedModalMsg', { name: playlist.name })}</p>
                        <div className="flex justify-end space-x-4">
                            <button onClick={hideModal} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 font-bold transition-colors">{t('apiPlaylistView.close')}</button>
                            <button onClick={() => { hideModal(); setActiveView('library'); }} className="px-4 py-2 rounded-lg bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] transition-colors">{t('apiPlaylistView.viewInLibrary')}</button>
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
        showModal({ title: t('albumView.downloadPreparing'), content: <p>{t('albumView.downloadFetching', {current: 0, total: totalFiles})}</p> });
        for (const song of songs) {
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

    const imageUrl = playlist.image?.find(img => img.quality === '500x500')?.url || playlist.image?.[0]?.url;
    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);
    const metaString = `${songs.length || playlist.songCount} songs • ${Math.floor(totalDuration / 60)} min`;

    return (
        <div className="text-white pb-20">
            <CinematicHeader
                title={playlist.name}
                description="Public Playlist"
                type={t('apiPlaylistView.publicPlaylist')}
                imageUrl={imageUrl}
                meta={metaString}
                isPlaying={isPlaying}
                isCurrentContext={isPlaylistCurrentlyPlaying}
                onPlay={handlePlayPlaylist}
                isFavorite={isFavoriteApiPlaylist(playlist.id)}
                onToggleFavorite={() => toggleFavoriteApiPlaylist(playlist)}
            >
                <button 
                    ref={moreButtonRef}
                    onClick={(e) => { e.stopPropagation(); setIsActionMenuOpen(p => !p); }} 
                    className="w-12 h-12 rounded-full border border-transparent hover:bg-white/5 flex items-center justify-center transition-all text-gray-400 hover:text-white"
                >
                    <MoreIcon className="w-6 h-6" />
                </button>

                <button 
                    onClick={handleSavePlaylist} 
                    disabled={isPlaylistSaved} 
                    title={isPlaylistSaved ? t('apiPlaylistView.alreadySaved') : t('apiPlaylistView.saveToLibrary')} 
                    className="flex items-center gap-2 px-6 py-3 font-bold rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                >
                    {isPlaylistSaved ? <CheckIcon className="w-5 h-5 text-green-400" /> : <PlusIcon className="w-5 h-5" />}
                    <span>{isPlaylistSaved ? 'Saved' : 'Save'}</span>
                </button>
            </CinematicHeader>

            <SmartMenu isOpen={isActionMenuOpen} onClose={() => setIsActionMenuOpen(false)} triggerRef={moreButtonRef} width="w-56">
                <div className="flex flex-col py-1">
                    <button onClick={() => {addSongsToEnd(songs); setIsActionMenuOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><QueueIcon className="w-4 h-4"/>{t('apiPlaylistView.addToQueue')}</button>
                    <button onClick={() => {handleDownloadAll(); setIsActionMenuOpen(false);}} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 text-gray-200 transition-colors"><DownloadIcon className="w-4 h-4"/>{t('apiPlaylistView.downloadZip')}</button>
                </div>
            </SmartMenu>

            <div className="px-6 md:px-10 mt-8">
                 {loading ? <div className="py-20"><Loader /></div> : songs.length > 0 ? (
                    <div className="bg-white/5 rounded-3xl border border-white/5 p-2 md:p-6 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        <div className="flex justify-between items-center text-gray-400 border-b border-white/10 pb-4 mb-2 px-4 text-xs uppercase font-bold tracking-wider">
                            <div className="flex items-center gap-x-6"><span className="text-center w-6">#</span><span>{t('apiPlaylistView.title')}</span></div>
                            <div className="flex items-center gap-x-6">
                                <div className="relative hidden sm:block">
                                    <button ref={sortMenuRef} onClick={() => setIsSortMenuOpen(p => !p)} className="flex items-center gap-2 hover:text-white transition-colors">
                                        <span>{t('apiPlaylistView.sortBy')}</span>
                                        <ChevronDownIcon className="w-4 h-4"/>
                                    </button>
                                    <SmartMenu isOpen={isSortMenuOpen} onClose={() => setIsSortMenuOpen(false)} triggerRef={sortMenuRef} width="w-48">
                                        <div className="flex flex-col py-1">
                                            <button onClick={() => {setSortKey('default'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors ${sortKey === 'default' ? 'text-[#fc4b08] font-bold' : 'text-gray-300'}`}>{t('apiPlaylistView.sort_default')}</button>
                                            <button onClick={() => {setSortKey('title'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors ${sortKey === 'title' ? 'text-[#fc4b08] font-bold' : 'text-gray-300'}`}>{t('apiPlaylistView.sort_title')}</button>
                                            <button onClick={() => {setSortKey('duration'); setIsSortMenuOpen(false);}} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/10 transition-colors ${sortKey === 'duration' ? 'text-[#fc4b08] font-bold' : 'text-gray-300'}`}>{t('apiPlaylistView.sort_duration')}</button>
                                        </div>
                                    </SmartMenu>
                                </div>
                                <span title="Duration" className="hidden sm:block"><ClockIcon className="w-5 h-5" /></span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            {sortedSongs.map((song, index) => (
                                <ApiPlaylistTrackItem key={song.id+index} song={song} index={index} playlistSongs={sortedSongs} playlist={playlist} navigateToArtist={navigateToArtist} />
                            ))}
                        </div>
                    </div>
                 ) : (
                    <div className="text-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/5">{t('apiPlaylistView.noSongs')}</div>
                 )}
            </div>
        </div>
    );
};

export default ApiPlaylistView;
