
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchSongs, searchAlbums, searchArtists, searchPlaylists } from '../../services/jioSaavnApi';
import { Song, Album, Artist, Playlist } from '../../types';
import { SongList } from '../ui/SongList';
import { AlbumCard } from '../ui/AlbumCard';
import { ArtistCard } from '../ui/ArtistCard';
import { PlaylistCard } from '../ui/PlaylistCard';
import { Loader } from '../ui/Loader';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type SearchTab = 'songs' | 'albums' | 'artists' | 'playlists';

interface SearchProps {
    navigateToAlbum: (albumId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
}

const TabButton: React.FC<{
  tab: SearchTab;
  label: string;
  activeTab: SearchTab;
  onClick: (tab: SearchTab) => void;
}> = ({ tab, label, activeTab, onClick }) => (
  <button
    onClick={() => onClick(tab)}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      activeTab === tab ? 'bg-[#fc4b08] text-black' : 'bg-white/10 hover:bg-white/20'
    }`}
  >
    {label}
  </button>
);

const Search: React.FC<SearchProps> = ({ navigateToAlbum, navigateToArtist, navigateToApiPlaylist }) => {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<SearchTab>('songs');
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('metromusic-search-history', []);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    const addToHistory = useCallback((searchTerm: string) => {
        if (!searchTerm.trim()) return;
        const lowerCaseTerm = searchTerm.trim().toLowerCase();
        setSearchHistory(prev => {
            const newHistory = [
                lowerCaseTerm,
                ...prev.filter(item => item.toLowerCase() !== lowerCaseTerm)
            ].slice(0, 10);
            return newHistory;
        });
    }, [setSearchHistory]);

    const handleResultInteraction = useCallback(() => {
        if (query.trim()) {
            addToHistory(query);
        }
    }, [query, addToHistory]);

    const removeFromHistory = (e: React.MouseEvent, item: string) => {
        e.stopPropagation();
        setSearchHistory(prev => prev.filter(h => h !== item));
    };

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setSongs([]);
            setAlbums([]);
            setArtists([]);
            setPlaylists([]);
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
            if (songsRes.success) setSongs(songsRes.data.results);
            if (albumsRes.success) setAlbums(albumsRes.data.results);
            if (artistsRes.success) setArtists(artistsRes.data.results);
            if (playlistsRes.success) setPlaylists(playlistsRes.data.results);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(query);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [query, performSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsInputFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const renderResults = () => {
        if (loading) return <Loader />;
        if (!query.trim()) return null;

        switch (activeTab) {
            case 'songs':
                return songs.length > 0 ? (
                    <SongList
                        songs={songs}
                        navigateToArtist={(artistId) => {
                            handleResultInteraction();
                            navigateToArtist(artistId);
                        }}
                        onInteraction={handleResultInteraction}
                    />
                ) : <p>No songs found.</p>;
            case 'albums':
                return albums.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {albums.map(album => (
                            <AlbumCard 
                                key={album.id} 
                                album={album} 
                                onAlbumClick={(albumId) => {
                                    handleResultInteraction();
                                    navigateToAlbum(albumId);
                                }} 
                                onArtistClick={(artistId) => {
                                    handleResultInteraction();
                                    navigateToArtist(artistId);
                                }} 
                            />
                        ))}
                    </div>
                ) : <p>No albums found.</p>;
            case 'artists':
                 return artists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {artists.map(artist => (
                            <ArtistCard 
                                key={artist.id} 
                                artist={artist} 
                                onArtistClick={(artistId) => {
                                    handleResultInteraction();
                                    navigateToArtist(artistId);
                                }} 
                            />
                        ))}
                    </div>
                ) : <p>No artists found.</p>;
            case 'playlists':
                 return playlists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {playlists.map(playlist => <PlaylistCard key={playlist.id} playlist={playlist} onClick={navigateToApiPlaylist} />)}
                    </div>
                ) : <p>No playlists found.</p>;
            default:
                return null;
        }
    };

    return (
        <div className="p-8 text-white">
            <div className="relative mb-8" ref={searchContainerRef}>
                 <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    placeholder="Search for songs, albums, artists..."
                    className="w-full bg-white/10 backdrop-blur-sm p-4 pl-12 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-[#fc4b08]"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {isInputFocused && !query && searchHistory.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-[#282828]/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl p-2 z-30">
                        <ul className="list-none p-0 m-0">
                            {searchHistory.map((item, index) => (
                                <React.Fragment key={index}>
                                    <li
                                        onClick={() => {
                                            setQuery(item);
                                            setIsInputFocused(false);
                                        }}
                                        className="flex justify-between items-center px-3 py-2 text-sm rounded-md hover:bg-white/10 cursor-pointer text-gray-200"
                                    >
                                        <span className="capitalize">{item}</span>
                                        <button onClick={(e) => removeFromHistory(e, item)} className="text-gray-500 hover:text-white p-1 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </li>
                                    {index < searchHistory.length - 1 && (
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-3"></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex space-x-4 mb-8">
                <TabButton tab="songs" label="Songs" activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="albums" label="Albums" activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="artists" label="Artists" activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="playlists" label="Playlists" activeTab={activeTab} onClick={setActiveTab} />
            </div>

            <div>
                {renderResults()}
            </div>
        </div>
    );
};

export default Search;