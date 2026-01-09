
import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { UserMusicContext } from '../../context/UserMusicContext';
import { SongList } from '../ui/SongList';
import { LocalPlaylist, Playlist, View, Song, Artist, Album } from '../../types';
import { AlbumCard } from '../ui/AlbumCard';
import { ArtistCard } from '../ui/ArtistCard';
import { PlaylistCard as ApiPlaylistCard } from '../ui/PlaylistCard';
import { ModalContext } from '../../context/ModalContext';
import { CreatePlaylistForm } from '../ui/CreatePlaylistForm';
import { AnimatedTabs, TabItem } from '../ui/Loader';
import { PlayerContext } from '../../context/PlayerContext';
import { useTranslation } from '../../context/LanguageContext';

type LibraryFilter = 'all' | 'playlists' | 'songs' | 'artists' | 'albums';
type NavFunc = (id: any) => void;

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>);
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const PlaylistPlaceholderIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);

const CreatePlaylistCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div 
        onClick={onClick} 
        className="group relative aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-[#fc4b08] hover:bg-white/10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden"
    >
      <div className="p-4 rounded-full bg-white/5 group-hover:bg-[#fc4b08] transition-colors duration-300 group-hover:scale-110 shadow-lg">
        <PlusIcon className="w-8 h-8 text-gray-400 group-hover:text-black transition-colors" />
      </div>
      <h4 className="font-bold text-gray-400 group-hover:text-white transition-colors tracking-wide text-sm uppercase">Create Playlist</h4>
    </div>
);

const LocalPlaylistCard: React.FC<{ playlist: LocalPlaylist; onClick: () => void; }> = ({ playlist, onClick }) => {
    const { deletePlaylist } = useContext(UserMusicContext);
    const { playSong } = useContext(PlayerContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const imageUrl = playlist.coverUrl || playlist.songs[0]?.image?.find(img => img.quality === '500x500')?.url || playlist.songs[0]?.image?.[0]?.url;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        showModal({
            title: "Delete Playlist",
            content: (
                <>
                    <p className="text-gray-300 mb-6">{`Are you sure you want to permanently delete "${playlist.name}"?`}</p>
                    <div className="flex justify-end space-x-4">
                        <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
                        <button onClick={() => { deletePlaylist(playlist.id); hideModal(); }} className="px-4 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-500">Delete</button>
                    </div>
                </>
            ),
        });
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (playlist.songs.length > 0) {
            playSong(playlist.songs[0], playlist.songs, { type: 'playlist', id: playlist.id });
        }
    };

    return (
        <div 
            onClick={onClick} 
            className="group relative bg-white/5 p-4 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-2 flex flex-col"
        >
            <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-2xl shadow-lg bg-[#121212]">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={playlist.name} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                        loading="lazy" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                        <PlaylistPlaceholderIcon className="w-16 h-16" />
                    </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <button
                    onClick={handlePlay}
                    className="absolute bottom-4 right-4 w-12 h-12 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-black/40 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                >
                    <PlayIcon className="w-6 h-6 ml-1" />
                </button>
            </div>

            <div className="flex justify-between items-start relative">
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-white truncate text-lg tracking-tight group-hover:text-[#fc4b08] transition-colors">{playlist.name}</h4>
                    <p className="text-sm text-gray-400 truncate mt-0.5">{playlist.songs.length} tracks</p>
                </div>
                
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }} 
                        className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreIcon className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-1 z-20 animate-in fade-in zoom-in-95">
                            <button onClick={handleDelete} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-md text-red-400 hover:bg-white/10 hover:text-red-300">
                                <TrashIcon className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ title: string; subtitle: string; actionText?: string; onAction?: () => void }> = ({ title, subtitle, actionText, onAction }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <SearchIcon className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 max-w-xs mx-auto mb-8">{subtitle}</p>
        {actionText && onAction && (
            <button 
                onClick={onAction}
                className="px-8 py-3 rounded-full bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] transition-colors shadow-lg shadow-[#fc4b08]/20"
            >
                {actionText}
            </button>
        )}
    </div>
);

const SectionHeader: React.FC<{ title: string; count?: number; children?: React.ReactNode }> = ({ title, count, children }) => (
    <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/5">
        <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            {count !== undefined && <span className="text-sm font-bold text-gray-500">{count}</span>}
        </div>
        {children}
    </div>
);

const PlaylistsView: React.FC<{ onCreate: () => void; onNavigate: NavFunc; onApiNavigate: NavFunc; }> = ({ onCreate, onNavigate, onApiNavigate }) => {
    const { playlists, favoriteApiPlaylists } = useContext(UserMusicContext);
    
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <section>
                <SectionHeader title="My Playlists" count={playlists.length} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    <CreatePlaylistCard onClick={onCreate} />
                    {playlists.map(p => (
                        <LocalPlaylistCard key={p.id} playlist={p} onClick={() => onNavigate(p.id)} />
                    ))}
                </div>
            </section>
            
            {favoriteApiPlaylists.length > 0 && (
                <section>
                    <SectionHeader title="Saved Playlists" count={favoriteApiPlaylists.length} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {favoriteApiPlaylists.map(p => (
                            <div key={p.id} className="group relative bg-white/5 p-4 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                                <ApiPlaylistCard playlist={p} onClick={() => onApiNavigate(p)} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

const SongsView: React.FC<{ onNavigateArtist: NavFunc; onNavigatePlaylist: NavFunc; }> = ({ onNavigateArtist, onNavigatePlaylist }) => {
    const { favoriteSongs } = useContext(UserMusicContext);
    const [sortKey, setSortKey] = useState<'date_added' | 'title_asc' | 'title_desc'>('date_added');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) setIsSortMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedSongs = useMemo(() => {
        const songsCopy = [...favoriteSongs];
        if (sortKey === 'title_asc') return songsCopy.sort((a, b) => a.name.localeCompare(b.name));
        if (sortKey === 'title_desc') return songsCopy.sort((a, b) => b.name.localeCompare(a.name));
        return favoriteSongs;
    }, [favoriteSongs, sortKey]);

    const sortOptions = [
        { key: 'date_added', label: t('library.sort_date_added') }, 
        { key: 'title_asc', label: t('library.sort_title_asc') }, 
        { key: 'title_desc', label: t('library.sort_title_desc') }
    ] as const;
    
    const currentSortLabel = sortOptions.find(opt => opt.key === sortKey)?.label;

    if (favoriteSongs.length === 0) return <EmptyState title="No Liked Songs" subtitle="Tap the heart icon on any song to save it here." />;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <SectionHeader title="Liked Songs" count={favoriteSongs.length}>
                <div className="relative" ref={sortMenuRef}>
                    <button 
                        onClick={() => setIsSortMenuOpen(p => !p)} 
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
                    >
                        <span className="text-gray-400">Sort by:</span>
                        <span className="text-white">{currentSortLabel}</span>
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    {isSortMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1c1c1c] border border-white/10 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95">
                            {sortOptions.map(opt => (
                                <button 
                                    key={opt.key} 
                                    onClick={() => { setSortKey(opt.key); setIsSortMenuOpen(false); }} 
                                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${sortKey === opt.key ? 'bg-[#fc4b08] text-black font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </SectionHeader>
            <div className="bg-black/20 rounded-3xl border border-white/5 p-2 md:p-6">
                <SongList songs={sortedSongs} navigateToArtist={onNavigateArtist} navigateToPlaylist={onNavigatePlaylist} context={{ type: 'library-songs', id: 'favorites' }} />
            </div>
        </section>
    );
};

const ArtistsView: React.FC<{ onNavigate: NavFunc }> = ({ onNavigate }) => {
    const { favoriteArtists } = useContext(UserMusicContext);
    
    if (favoriteArtists.length === 0) return <EmptyState title="No Followed Artists" subtitle="Follow artists to see them in your library." />;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <SectionHeader title="Artists" count={favoriteArtists.length} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {favoriteArtists.map(a => (
                    <div key={a.id} className="animate-in fade-in zoom-in-95 duration-500">
                        <ArtistCard artist={a} onArtistClick={onNavigate} />
                    </div>
                ))}
            </div>
        </section>
    );
};

const AlbumsView: React.FC<{ onNavigateAlbum: NavFunc; onNavigateArtist: NavFunc }> = ({ onNavigateAlbum, onNavigateArtist }) => {
    const { favoriteAlbums } = useContext(UserMusicContext);

    if (favoriteAlbums.length === 0) return <EmptyState title="No Saved Albums" subtitle="Save albums to build your collection." />;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <SectionHeader title="Albums" count={favoriteAlbums.length} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {favoriteAlbums.map(a => (
                    <div key={a.id} className="animate-in fade-in zoom-in-95 duration-500">
                        <AlbumCard album={a} onAlbumClick={onNavigateAlbum} onArtistClick={onNavigateArtist} />
                    </div>
                ))}
            </div>
        </section>
    );
};

const AllView: React.FC<{ onNavigatePlaylist: NavFunc; onNavigateAlbum: NavFunc; onNavigateArtist: NavFunc; onCreate: () => void }> = ({ onNavigatePlaylist, onNavigateAlbum, onNavigateArtist, onCreate }) => {
    const { playlists, favoriteAlbums, favoriteArtists, favoriteSongs } = useContext(UserMusicContext);
    const hasContent = playlists.length || favoriteAlbums.length || favoriteArtists.length || favoriteSongs.length;
    
    if (!hasContent) return <EmptyState title="Your Collection is Empty" subtitle="Start exploring and save music you love." actionText="Find Music" onAction={() => {}} />; // Action handled by parent if needed, simplistic here

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <section>
                <SectionHeader title="Jump Back In" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    <CreatePlaylistCard onClick={onCreate} />
                    {playlists.slice(0, 5).map(p => (
                        <LocalPlaylistCard key={p.id} playlist={p} onClick={() => onNavigatePlaylist(p.id)} />
                    ))}
                </div>
            </section>

            {(favoriteAlbums.length > 0 || favoriteArtists.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {favoriteAlbums.length > 0 && (
                        <section>
                            <SectionHeader title="Recent Albums" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {favoriteAlbums.slice(0, 6).map(a => (
                                    <AlbumCard key={a.id} album={a} onAlbumClick={onNavigateAlbum} onArtistClick={onNavigateArtist} />
                                ))}
                            </div>
                        </section>
                    )}
                    {favoriteArtists.length > 0 && (
                        <section>
                            <SectionHeader title="Recent Artists" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {favoriteArtists.slice(0, 6).map(a => (
                                    <ArtistCard key={a.id} artist={a} onArtistClick={onNavigateArtist} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {favoriteSongs.length > 0 && (
                <section>
                    <SectionHeader title="Recently Liked Songs" />
                    <div className="bg-black/20 rounded-3xl border border-white/5 p-2 md:p-6">
                        <SongList songs={favoriteSongs.slice(0, 5)} navigateToArtist={onNavigateArtist} navigateToPlaylist={onNavigatePlaylist} context={{ type: 'library-songs', id: 'favorites' }} />
                    </div>
                </section>
            )}
        </div>
    );
};

interface LibraryProps {
    navigateToAlbum: (albumId: string) => void;
    navigateToPlaylist: (playlistId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
    setActiveView: (view: View) => void;
}

const libraryFilters: TabItem<LibraryFilter>[] = [
    { id: 'all', label: 'Overview' },
    { id: 'playlists', label: 'Playlists' },
    { id: 'songs', label: 'Liked Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' },
];

const Library: React.FC<LibraryProps> = ({ navigateToAlbum, navigateToPlaylist, navigateToArtist, navigateToApiPlaylist, setActiveView }) => {
    const { createPlaylist, playlists, favoriteSongs } = useContext(UserMusicContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const { t } = useTranslation();
    const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
    
    const handleCreatePlaylist = () => {
        showModal({
            title: t('modals.createPlaylist.title'),
            content: <CreatePlaylistForm onCancel={hideModal} onConfirm={(name, desc) => { const newP = createPlaylist(name, desc); hideModal(); navigateToPlaylist(newP.id); }} />
        });
    };

    const renderContent = () => {
        switch (activeFilter) {
            case 'playlists': return <PlaylistsView onCreate={handleCreatePlaylist} onNavigate={navigateToPlaylist} onApiNavigate={navigateToApiPlaylist} />;
            case 'songs': return <SongsView onNavigateArtist={navigateToArtist} onNavigatePlaylist={navigateToPlaylist} />;
            case 'artists': return <ArtistsView onNavigate={navigateToArtist} />;
            case 'albums': return <AlbumsView onNavigateAlbum={navigateToAlbum} onNavigateArtist={navigateToArtist} />;
            default: return <AllView onCreate={handleCreatePlaylist} onNavigatePlaylist={navigateToPlaylist} onNavigateAlbum={navigateToAlbum} onNavigateArtist={navigateToArtist} />;
        }
    };
    
    return (
        <div className="min-h-full p-6 md:p-10 pb-32 text-white">
            <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Your Collection
                </h1>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <AnimatedTabs
                        tabs={libraryFilters}
                        activeTab={activeFilter}
                        onTabClick={setActiveFilter}
                    />
                    
                    <div className="flex gap-6 text-sm font-bold text-gray-500 uppercase tracking-widest px-2">
                        <span>{playlists.length} Playlists</span>
                        <span>•</span>
                        <span>{favoriteSongs.length} Songs</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                {renderContent()}
            </main>
        </div>
    );
};

export default Library;
