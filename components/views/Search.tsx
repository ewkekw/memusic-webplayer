import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchSongs, searchAlbums, searchArtists, searchPlaylists } from '../../services/jioSaavnApi';
import { Song, Album, Artist, Playlist } from '../../types';
import { SongList } from '../ui/SongList';
import { AlbumCard } from '../ui/AlbumCard';
import { ArtistCard } from '../ui/ArtistCard';
import { PlaylistCard } from '../ui/PlaylistCard';
import { Loader, AnimatedTabs, TabItem } from '../ui/Loader';

type SearchTab = 'songs' | 'albums' | 'artists' | 'playlists';

interface SearchResultsProps {
    activeTab: SearchTab;
    loading: boolean;
    songs: Song[];
    albums: Album[];
    artists: Artist[];
    playlists: Playlist[];
    onResultClick: (type: 'album' | 'artist' | 'playlist' | 'song', id: string | Playlist) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ activeTab, loading, songs, albums, artists, playlists, onResultClick }) => {
    if (loading) return <div className="flex justify-center mt-8"><Loader /></div>;
    if (!songs.length && !albums.length && !artists.length && !playlists.length) {
        return <p className="text-center text-gray-400 mt-8">No results found.</p>;
    }

    switch (activeTab) {
        case 'songs':
            return songs.length > 0 ? (
                <SongList
                    songs={songs}
                    navigateToArtist={(artistId) => onResultClick('artist', artistId)}
                />
            ) : <p className="text-gray-400">No songs found for this query.</p>;
        case 'albums':
            return albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {albums.map(album => (
                        <AlbumCard 
                            key={album.id} 
                            album={album} 
                            onAlbumClick={(albumId) => onResultClick('album', albumId)} 
                            onArtistClick={(artistId) => onResultClick('artist', artistId)} 
                        />
                    ))}
                </div>
            ) : <p className="text-gray-400">No albums found for this query.</p>;
        case 'artists':
             return artists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {artists.map(artist => (
                        <ArtistCard 
                            key={artist.id} 
                            artist={artist} 
                            onArtistClick={(artistId) => onResultClick('artist', artistId)} 
                        />
                    ))}
                </div>
            ) : <p className="text-gray-400">No artists found for this query.</p>;
        case 'playlists':
             return playlists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {playlists.map(playlist => <PlaylistCard key={playlist.id} playlist={playlist} onClick={(p) => onResultClick('playlist', p)} />)}
                </div>
            ) : <p className="text-gray-400">No playlists found for this query.</p>;
        default:
            return null;
    }
};

interface SearchProps {
    navigateToAlbum: (albumId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
    initialQuery?: string;
}

const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const searchTabs: TabItem<SearchTab>[] = [
    { id: 'songs', label: 'Songs' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' },
    { id: 'playlists', label: 'Playlists' },
];

const Search: React.FC<SearchProps> = ({ navigateToAlbum, navigateToArtist, navigateToApiPlaylist, initialQuery }) => {
    const [query, setQuery] = useState(initialQuery || '');
    const [activeTab, setActiveTab] = useState<SearchTab>('songs');
    const [songs, setSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        setQuery(initialQuery || '');
    }, [initialQuery]);

    const handleResultInteraction = useCallback((type: 'album' | 'artist' | 'playlist' | 'song', data: string | Playlist) => {
        if (type === 'album' && typeof data === 'string') navigateToAlbum(data);
        if (type === 'artist' && typeof data === 'string') navigateToArtist(data);
        if (type === 'playlist' && typeof data !== 'string') navigateToApiPlaylist(data);
    }, [navigateToAlbum, navigateToArtist, navigateToApiPlaylist]);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setSongs([]); setAlbums([]); setArtists([]); setPlaylists([]);
            return;
        }
        setLoading(true);
        try {
            const [songsRes, albumsRes, artistsRes, playlistsRes] = await Promise.all([
                searchSongs(searchQuery), searchAlbums(searchQuery), searchArtists(searchQuery), searchPlaylists(searchQuery),
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
        performSearch(query);
    }, [query, performSearch]);

    return (
        <div className="p-4 md:p-6 text-white">
            <div className="flex mb-6">
                <AnimatedTabs
                    tabs={searchTabs}
                    activeTab={activeTab}
                    onTabClick={setActiveTab}
                />
            </div>

            <div>
                {query.trim() ? (
                    <SearchResults 
                        activeTab={activeTab} 
                        loading={loading} 
                        songs={songs} 
                        albums={albums} 
                        artists={artists} 
                        playlists={playlists} 
                        onResultClick={handleResultInteraction} 
                    />
                ) : (
                    <div className="text-center text-gray-500 pt-16">
                        <p className="text-lg">Search for your favorite music.</p>
                        <p>Results will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;