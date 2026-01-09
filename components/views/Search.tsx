
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchSongs, searchAlbums, searchArtists, searchPlaylists } from '../../services/jioSaavnApi';
import { Song, Album, Artist, Playlist } from '../../types';
import { SongList } from '../ui/SongList';
import { AlbumCard } from '../ui/AlbumCard';
import { ArtistCard } from '../ui/ArtistCard';
import { PlaylistCard } from '../ui/PlaylistCard';
import { Loader, AnimatedTabs, TabItem } from '../ui/Loader';
import { useTranslation } from '../../context/LanguageContext';

type SearchTab = 'songs' | 'albums' | 'artists' | 'playlists';

interface SearchResultsProps {
    activeTab: SearchTab;
    loading: boolean;
    query: string;
    songs: Song[];
    albums: Album[];
    artists: Artist[];
    playlists: Playlist[];
    onResultClick: (type: 'album' | 'artist' | 'playlist' | 'song', id: string | Playlist) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ activeTab, loading, query, songs, albums, artists, playlists, onResultClick }) => {
    const { t } = useTranslation();
    
    if (loading) return <div className="flex justify-center mt-20"><Loader /></div>;
    
    const hasResults = songs.length > 0 || albums.length > 0 || artists.length > 0 || playlists.length > 0;

    if (!hasResults) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-in fade-in zoom-in-95 duration-500">
                <p className="text-xl font-medium mb-2">{t('search.noResults')}</p>
                <p className="text-sm opacity-60">Try searching for something else.</p>
            </div>
        );
    }

    const containerClass = "animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out";

    switch (activeTab) {
        case 'songs':
            return songs.length > 0 ? (
                <div className={containerClass}>
                    <SongList
                        songs={songs}
                        navigateToArtist={(artistId) => onResultClick('artist', artistId)}
                        context={{ type: 'search', id: query }}
                    />
                </div>
            ) : <p className="text-gray-400 mt-10 text-center">{t('search.noSongs')}</p>;
        case 'albums':
            return albums.length > 0 ? (
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 ${containerClass}`}>
                    {albums.map((album, idx) => (
                        <div key={album.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards">
                            <AlbumCard 
                                album={album} 
                                onAlbumClick={(albumId) => onResultClick('album', albumId)} 
                                onArtistClick={(artistId) => onResultClick('artist', artistId)} 
                            />
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-400 mt-10 text-center">{t('search.noAlbums')}</p>;
        case 'artists':
             return artists.length > 0 ? (
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 ${containerClass}`}>
                    {artists.map((artist, idx) => (
                        <div key={artist.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards">
                            <ArtistCard 
                                artist={artist} 
                                onArtistClick={(artistId) => onResultClick('artist', artistId)} 
                            />
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-400 mt-10 text-center">{t('search.noArtists')}</p>;
        case 'playlists':
             return playlists.length > 0 ? (
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 ${containerClass}`}>
                    {playlists.map((playlist, idx) => (
                        <div key={playlist.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards">
                            <PlaylistCard playlist={playlist} onClick={(p) => onResultClick('playlist', p)} />
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-400 mt-10 text-center">{t('search.noPlaylists')}</p>;
        default:
            return null;
    }
};

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

interface Category {
    id: string;
    label: string;
    gradient: string;
}

const CATEGORIES: Category[] = [
    { id: 'pop', label: 'Pop', gradient: 'from-pink-500 to-rose-500' },
    { id: 'hip hop', label: 'Hip Hop', gradient: 'from-orange-500 to-amber-500' },
    { id: 'rock', label: 'Rock', gradient: 'from-red-600 to-red-800' },
    { id: 'electronic', label: 'Electronic', gradient: 'from-teal-400 to-emerald-500' },
    { id: 'indie', label: 'Indie', gradient: 'from-purple-500 to-indigo-500' },
    { id: 'r&b', label: 'R&B', gradient: 'from-violet-600 to-purple-600' },
    { id: 'workout', label: 'Workout', gradient: 'from-lime-500 to-green-600' },
    { id: 'chill', label: 'Chill', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'party', label: 'Party', gradient: 'from-fuchsia-500 to-pink-600' },
    { id: 'focus', label: 'Focus', gradient: 'from-sky-600 to-indigo-700' },
    { id: 'jazz', label: 'Jazz', gradient: 'from-yellow-500 to-orange-600' },
    { id: 'classical', label: 'Classical', gradient: 'from-slate-500 to-gray-700' },
];

const SearchLanding: React.FC<{ onCategoryClick: (term: string) => void }> = ({ onCategoryClick }) => {
    return (
        <div className="pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Browse Genres</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {CATEGORIES.map((cat, idx) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryClick(cat.label)}
                        className={`relative h-40 rounded-3xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] bg-gradient-to-br ${cat.gradient}`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                        <span className="absolute top-5 left-5 text-2xl font-black text-white tracking-tight drop-shadow-md z-10">{cat.label}</span>
                        <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 ease-out" />
                        <div className="absolute -top-6 -left-6 w-20 h-20 bg-black/10 rounded-full blur-xl" />
                    </button>
                ))}
            </div>
        </div>
    );
};

interface SearchProps {
    navigateToAlbum: (albumId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
    initialQuery?: string;
}

const Search: React.FC<SearchProps> = ({ navigateToAlbum, navigateToArtist, navigateToApiPlaylist, initialQuery }) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState(initialQuery || '');
    const [activeTab, setActiveTab] = useState<SearchTab>('songs');
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);
    
    const lastRequestId = useRef(0);

    const searchTabs: TabItem<SearchTab>[] = [
        { id: 'songs', label: t('library.songs') },
        { id: 'albums', label: t('library.albums') },
        { id: 'artists', label: t('library.artists') },
        { id: 'playlists', label: t('library.playlists') },
    ];
    
    useEffect(() => {
        if (initialQuery !== undefined) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    const handleResultInteraction = useCallback((type: 'album' | 'artist' | 'playlist' | 'song', data: string | Playlist) => {
        if (type === 'album' && typeof data === 'string') navigateToAlbum(data);
        if (type === 'artist' && typeof data === 'string') navigateToArtist(data);
        if (type === 'playlist' && typeof data !== 'string') navigateToApiPlaylist(data);
    }, [navigateToAlbum, navigateToArtist, navigateToApiPlaylist]);

    const performSearch = useCallback(async (searchQuery: string) => {
        const requestId = ++lastRequestId.current;
        
        if (!searchQuery.trim()) {
            if (requestId === lastRequestId.current) {
                setSongs([]); setAlbums([]); setArtists([]); setPlaylists([]);
            }
            return;
        }
        
        setLoading(true);
        
        try {
            const [songsRes, albumsRes, artistsRes, playlistsRes] = await Promise.all([
                searchSongs(searchQuery), 
                searchAlbums(searchQuery), 
                searchArtists(searchQuery), 
                searchPlaylists(searchQuery),
            ]);
            
            if (requestId === lastRequestId.current) {
                if (songsRes.success) setSongs(songsRes.data.results);
                if (albumsRes.success) setAlbums(albumsRes.data.results);
                if (artistsRes.success) setArtists(artistsRes.data.results);
                if (playlistsRes.success) setPlaylists(playlistsRes.data.results);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            if (requestId === lastRequestId.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    const handleCategoryClick = (term: string) => {
        setQuery(term);
    };

    return (
        <div className="p-6 md:p-10 text-white min-h-full pb-32">
            {query.trim() ? (
                <>
                    <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-2">
                        <AnimatedTabs
                            tabs={searchTabs}
                            activeTab={activeTab}
                            onTabClick={setActiveTab}
                        />
                        <button 
                            onClick={() => setQuery('')}
                            className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors hidden sm:block"
                        >
                            Clear Results
                        </button>
                    </div>

                    <SearchResults 
                        activeTab={activeTab} 
                        loading={loading}
                        query={query}
                        songs={songs} 
                        albums={albums} 
                        artists={artists} 
                        playlists={playlists} 
                        onResultClick={handleResultInteraction} 
                    />
                </>
            ) : (
                <SearchLanding onCategoryClick={handleCategoryClick} />
            )}
        </div>
    );
};

export default Search;
    