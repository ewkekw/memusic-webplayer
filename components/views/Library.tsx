import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { UserMusicContext } from '../../context/UserMusicContext';
import { SongList } from '../ui/SongList';
import { LocalPlaylist, Playlist, View, Song, Artist, Album } from '../../types';
import { AlbumCard } from '../ui/AlbumCard';
import { ArtistCard } from '../ui/ArtistCard';
import { PlaylistCard as ApiPlaylistCard } from '../ui/PlaylistCard';
import { ModalContext } from '../../App';
import { CreatePlaylistForm } from '../ui/CreatePlaylistForm';
import { AnimatedTabs, TabItem } from '../ui/Loader';

type LibraryFilter = 'all' | 'playlists' | 'songs' | 'artists' | 'albums';
type NavFunc = (id: any) => void;

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);

// Sub-component: CreatePlaylistCard
const CreatePlaylistCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div onClick={onClick} className="group relative bg-transparent border-2 border-dashed border-white/20 p-4 rounded-lg hover:bg-white/10 hover:border-white/40 transition-all duration-200 cursor-pointer flex items-center justify-center aspect-square flex-col">
      <PlusIcon className="w-12 h-12 text-gray-400 group-hover:text-white transition-colors" />
      <h4 className="font-bold text-white mt-3 truncate">New Playlist</h4>
    </div>
);

// Sub-component: LocalPlaylistCard
const LocalPlaylistCard: React.FC<{ playlist: LocalPlaylist; onClick: () => void; }> = ({ playlist, onClick }) => {
    const { deletePlaylist } = useContext(UserMusicContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const imageUrl = playlist.coverUrl || playlist.songs[0]?.image?.find(img => img.quality === '150x150')?.url || playlist.songs[0]?.image?.[0]?.url;

    const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>);
    const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
    const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-2m0 0l-6 2m6-2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2zm-6 2v6a2 2 0 002 2h2a2 2 0 002-2v-6" /></svg>);
    
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

    return (
        <div onClick={onClick} className="group relative bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer">
          <div className="absolute top-1 right-1 z-10" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }} className="p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60" aria-label="More options"><MoreIcon className="w-5 h-5" /></button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-36 bg-[#282828] border border-white/10 rounded-md shadow-2xl p-1 z-20">
                        <button onClick={handleDelete} className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm rounded-md text-red-400 hover:bg-white/10 hover:text-red-300"><TrashIcon className="w-4 h-4" />Delete</button>
                    </div>
                )}
            </div>
            <div className="relative w-full aspect-square">{imageUrl ? <img src={imageUrl} alt={playlist.name} className="w-full h-full object-cover rounded-md shadow-lg" /> : <div className="w-full h-full bg-white/5 rounded-md flex items-center justify-center"><MinimalistMusicIcon className="w-1/2 h-1/2 text-gray-500"/></div>}</div>
            <h4 className="font-bold text-white mt-3 truncate">{playlist.name}</h4>
            <p className="text-sm text-gray-400 truncate">{playlist.songs.length} songs</p>
        </div>
    );
};

// View-specific components
const AllView: React.FC<{ onNavigatePlaylist: NavFunc; onNavigateAlbum: NavFunc; onNavigateArtist: NavFunc; }> = ({ onNavigatePlaylist, onNavigateAlbum, onNavigateArtist }) => {
    const { playlists, favoriteAlbums, favoriteArtists, favoriteSongs } = useContext(UserMusicContext);
    const hasContent = playlists.length || favoriteAlbums.length || favoriteArtists.length || favoriteSongs.length;
    if (!hasContent) {
        return <div className="text-center py-20 bg-white/5 rounded-lg"><h3 className="text-2xl font-bold">Your library is empty</h3><p className="text-gray-400 mt-2">Save songs, albums, and artists to see them here.</p></div>;
    }
    return (
        <div className="space-y-12">
            {playlists.length > 0 && (<section><h2 className="text-2xl font-bold mb-4">Recent Playlists</h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{playlists.slice(0,6).map(p => <LocalPlaylistCard key={p.id} playlist={p} onClick={() => onNavigatePlaylist(p.id)} />)}</div></section>)}
            {favoriteAlbums.length > 0 && (<section><h2 className="text-2xl font-bold mb-4">Recent Albums</h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{favoriteAlbums.slice(0,6).map(a => <AlbumCard key={a.id} album={a} onAlbumClick={onNavigateAlbum} onArtistClick={onNavigateArtist} />)}</div></section>)}
            {favoriteArtists.length > 0 && (<section><h2 className="text-2xl font-bold mb-4">Recent Artists</h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{favoriteArtists.slice(0,6).map(a => <ArtistCard key={a.id} artist={a} onArtistClick={onNavigateArtist} />)}</div></section>)}
            {favoriteSongs.length > 0 && (<section><h2 className="text-2xl font-bold mb-4">Recent Songs</h2><SongList songs={favoriteSongs.slice(0,5)} navigateToArtist={onNavigateArtist} navigateToPlaylist={onNavigatePlaylist} /></section>)}
        </div>
    );
};

const PlaylistsView: React.FC<{ onCreate: () => void; onNavigate: NavFunc; onApiNavigate: NavFunc; }> = ({ onCreate, onNavigate, onApiNavigate }) => {
    const { playlists, favoriteApiPlaylists } = useContext(UserMusicContext);
    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-3xl font-bold mb-4">My Playlists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    <CreatePlaylistCard onClick={onCreate} />
                    {playlists.map(p => <LocalPlaylistCard key={p.id} playlist={p} onClick={() => onNavigate(p.id)} />)}
                </div>
            </section>
            <section>
                <h2 className="text-3xl font-bold mb-4">Favorite Playlists</h2>
                 {favoriteApiPlaylists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{favoriteApiPlaylists.map(p => <ApiPlaylistCard key={p.id} playlist={p} onClick={() => onApiNavigate(p)} />)}</div>
                ) : <p className="text-gray-400">You haven't favorited any public playlists yet.</p>}
            </section>
        </div>
    );
};

const SongsView: React.FC<{ onNavigateArtist: NavFunc; onNavigatePlaylist: NavFunc; }> = ({ onNavigateArtist, onNavigatePlaylist }) => {
    const { favoriteSongs } = useContext(UserMusicContext);
    const [sortKey, setSortKey] = useState<'date_added' | 'title_asc' | 'title_desc'>('date_added');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>);
    
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

    const sortOptions = [{ key: 'date_added', label: 'Date Added' }, { key: 'title_asc', label: 'Title (A-Z)' }, { key: 'title_desc', label: 'Title (Z-A)' }] as const;
    const currentSortLabel = sortOptions.find(opt => opt.key === sortKey)?.label;

    return (
        <section>
            <div className="flex justify-end mb-4">
                <div className="relative" ref={sortMenuRef}>
                    <button onClick={() => setIsSortMenuOpen(p => !p)} className="flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-all bg-white/10 hover:bg-white/20 text-gray-300"><span>Sort by: {currentSortLabel}</span><ChevronDownIcon className="w-4 h-4 flex-shrink-0"/></button>
                    {isSortMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                            {/* Fix: Use opt.key directly as it's now correctly typed due to 'as const' on sortOptions */}
                            {sortOptions.map(opt => <button key={opt.key} onClick={() => { setSortKey(opt.key); setIsSortMenuOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${sortKey === opt.key ? 'bg-[#fc4b08] text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}>{opt.label}</button>)}
                        </div>
                    )}
                </div>
            </div>
            {sortedSongs.length > 0 ? <SongList songs={sortedSongs} navigateToArtist={onNavigateArtist} navigateToPlaylist={onNavigatePlaylist} /> : <p className="text-gray-400">You haven't favorited any songs yet.</p>}
        </section>
    );
};

const ArtistsView: React.FC<{ onNavigate: NavFunc }> = ({ onNavigate }) => {
    const { favoriteArtists } = useContext(UserMusicContext);
    return (
        <section>
            {favoriteArtists.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{favoriteArtists.map(a => <ArtistCard key={a.id} artist={a} onArtistClick={onNavigate} />)}</div>) : <p className="text-gray-400">You haven't followed any artists yet.</p>}
        </section>
    );
};

const AlbumsView: React.FC<{ onNavigateAlbum: NavFunc; onNavigateArtist: NavFunc }> = ({ onNavigateAlbum, onNavigateArtist }) => {
    const { favoriteAlbums } = useContext(UserMusicContext);
    return (
        <section>
            {favoriteAlbums.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{favoriteAlbums.map(a => <AlbumCard key={a.id} album={a} onAlbumClick={onNavigateAlbum} onArtistClick={onNavigateArtist} />)}</div>) : <p className="text-gray-400">You haven't favorited any albums yet.</p>}
        </section>
    );
};

// Main Library Component
interface LibraryProps {
    navigateToAlbum: (albumId: string) => void;
    navigateToPlaylist: (playlistId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
    setActiveView: (view: View) => void;
}

const libraryFilters: TabItem<LibraryFilter>[] = [
    { id: 'all', label: 'All' },
    { id: 'playlists', label: 'Playlists' },
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' },
];

const Library: React.FC<LibraryProps> = ({ navigateToAlbum, navigateToPlaylist, navigateToArtist, navigateToApiPlaylist, setActiveView }) => {
    const { createPlaylist } = useContext(UserMusicContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const [activeFilter, setActiveFilter] = useState<LibraryFilter>('all');
    
    const handleCreatePlaylist = () => {
        showModal({
            title: "Create New Playlist",
            content: <CreatePlaylistForm onCancel={hideModal} onConfirm={(name, desc) => { const newP = createPlaylist(name, desc); hideModal(); navigateToPlaylist(newP.id); }} />
        });
    };

    const renderContent = () => {
        switch (activeFilter) {
            case 'playlists': return <PlaylistsView onCreate={handleCreatePlaylist} onNavigate={navigateToPlaylist} onApiNavigate={navigateToApiPlaylist} />;
            case 'songs': return <SongsView onNavigateArtist={navigateToArtist} onNavigatePlaylist={navigateToPlaylist} />;
            case 'artists': return <ArtistsView onNavigate={navigateToArtist} />;
            case 'albums': return <AlbumsView onNavigateAlbum={navigateToAlbum} onNavigateArtist={navigateToArtist} />;
            default: return <AllView onNavigatePlaylist={navigateToPlaylist} onNavigateAlbum={navigateToAlbum} onNavigateArtist={navigateToArtist} />;
        }
    };
    
    return (
        <div className="p-6 text-white space-y-6">
            <div className="flex">
                <AnimatedTabs
                    tabs={libraryFilters}
                    activeTab={activeFilter}
                    onTabClick={setActiveFilter}
                />
            </div>

            <div>{renderContent()}</div>
        </div>
    );
};

export default Library;