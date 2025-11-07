
import React, { useContext, useEffect, useState } from 'react';
import { Song, View, Playlist, Album } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { getArtistDetails, getSongSuggestions } from '../../services/jioSaavnApi';
import { Loader } from '../ui/Loader';
import { PlayerContext } from '../../context/PlayerContext';
import { AlbumCard } from '../ui/AlbumCard';

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

interface SongCardProps {
  song: Song;
}
const SongCard: React.FC<SongCardProps> = ({ song }) => {
  const { playSong } = useContext(PlayerContext);
  const imageUrl = song.image?.find(img => img.quality === '150x150')?.url || song.image?.[0]?.url;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song, [song]);
  };
  
  const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="group w-40 flex-shrink-0" onClick={handlePlay}>
      <div className="relative w-full aspect-square cursor-pointer">
        <img src={imageUrl} alt={song.name} className="w-full h-full object-cover rounded-lg shadow-lg" />
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 w-10 h-10 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90 translate-y-1 group-hover:translate-y-0 transition-all duration-300"
          aria-label={`Play ${song.name}`}
        >
          <PlayIcon className="w-6 h-6 ml-0.5" />
        </button>
      </div>
      <div className="mt-2">
        <h4 className="font-bold text-white truncate text-sm">{song.name}</h4>
        <p className="text-xs text-gray-400 truncate">
          {song.artists.primary.map(a => a.name).join(', ')}
        </p>
      </div>
    </div>
  );
};

const HorizontalScroller: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => {
    return (
        <section>
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <div className="flex space-x-6 overflow-x-auto pb-4 custom-scrollbar -mx-8 px-8">
                {children}
            </div>
        </section>
    );
};

interface HomeProps {
    setActiveView: (view: View) => void;
    navigateToAlbum: (albumId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToSearch: (query: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveView, navigateToAlbum, navigateToArtist, navigateToSearch, navigateToApiPlaylist }) => {
    const { history, favoriteArtists } = useContext(UserMusicContext);
    const [searchQuery, setSearchQuery] = useState('');

    const [newReleases, setNewReleases] = useState<Album[]>([]);
    const [recommendations, setRecommendations] = useState<Song[]>([]);
    
    const [loading, setLoading] = useState({
        releases: true,
        recommendations: true,
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigateToSearch(searchQuery.trim());
        }
    };
    
    useEffect(() => {
        const fetchNewReleases = async () => {
            if (favoriteArtists.length === 0) {
                setNewReleases([]);
                setLoading(prev => ({ ...prev, releases: false }));
                return;
            }
            setLoading(prev => ({ ...prev, releases: true }));

            try {
                const artistsToFetch = favoriteArtists.slice(0, 5);
                const artistDetailsPromises = artistsToFetch.map(artist => getArtistDetails(artist.id));
                const responses = await Promise.all(artistDetailsPromises);

                const allAlbums = responses.flatMap(res => res.success ? (res.data.topAlbums || []) : []);
                
                const uniqueAlbumsMap = new Map<string, Album>();
                allAlbums.forEach(album => {
                    if (!uniqueAlbumsMap.has(album.id)) {
                        uniqueAlbumsMap.set(album.id, album);
                    }
                });

                const uniqueAlbums = Array.from(uniqueAlbumsMap.values());
                const sortedReleases = uniqueAlbums.sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 10);

                setNewReleases(sortedReleases);
            } catch (error) {
                console.error("Failed to fetch new releases from favorite artists:", error);
            } finally {
                setLoading(prev => ({ ...prev, releases: false }));
            }
        };

        fetchNewReleases();
    }, [favoriteArtists]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (history.length === 0) {
                setRecommendations([]);
                setLoading(prev => ({ ...prev, recommendations: false }));
                return;
            }
            setLoading(prev => ({ ...prev, recommendations: true }));
            try {
                const seedSongs = history.slice(0, 5);
                const recPromises = seedSongs.map(s => getSongSuggestions(s.id, 5));
                const responses = await Promise.all(recPromises);
                const allRecs = responses.flatMap(res => res.success ? res.data : []);
                
                const uniqueRecs = allRecs.filter((song, index, self) =>
                    index === self.findIndex(s => s.id === song.id) && !history.some(h => h.id === song.id)
                );
                setRecommendations(uniqueRecs.slice(0, 10));
            } catch (error) {
                console.error("Failed to fetch recommendations", error);
                setRecommendations([]); // Fail gracefully
            } finally {
                setLoading(prev => ({ ...prev, recommendations: false }));
            }
        };

        fetchRecommendations();
    }, [history]);

    const recentlyPlayed = history.slice(0, 10);
    const isLoading = loading.releases || loading.recommendations;

    return (
        <div className="p-8 text-white space-y-12">
            <header>
                <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
                 <form onSubmit={handleSearchSubmit} className="max-w-xl relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none z-10">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="What do you want to listen to?"
                        className="w-full bg-white/5 backdrop-blur-sm p-4 pl-12 rounded-full text-lg border-2 border-transparent hover:border-white/20 focus:outline-none focus:bg-white/10 focus:border-[#fc4b08] transition-all duration-300"
                    />
                </form>
            </header>

            {isLoading && (
                <div className="flex justify-center items-center h-64">
                    <Loader />
                </div>
            )}

            {!isLoading && (
                <>
                    {recentlyPlayed.length > 0 && (
                        <HorizontalScroller title="Continue Listening">
                            {recentlyPlayed.map(song => (
                                <SongCard key={song.id} song={song} />
                            ))}
                        </HorizontalScroller>
                    )}
                    
                    {recommendations.length > 0 && (
                        <HorizontalScroller title="Recommended For You">
                            {recommendations.map(song => (
                                <SongCard key={song.id} song={song} />
                            ))}
                        </HorizontalScroller>
                    )}
                    
                    {newReleases.length > 0 && (
                        <HorizontalScroller title="New Releases From Your Artists">
                            {newReleases.map(album => (
                                <div key={album.id} className="w-48 flex-shrink-0">
                                    <AlbumCard album={album} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                                </div>
                            ))}
                        </HorizontalScroller>
                    )}
                </>
            )}
        </div>
    );
};

export default Home;
