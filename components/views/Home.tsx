
import React, { useContext, useEffect, useState } from 'react';
import { Song, View, Album } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { getSongSuggestions } from '../../services/jioSaavnApi';
import { SongList } from '../ui/SongList';
import { Loader } from '../ui/Loader';
import { AlbumCard } from '../ui/AlbumCard';

interface HomeProps {
    setActiveView: (view: View) => void;
    navigateToAlbum: (albumId: string) => void;
    navigateToArtist: (artistId: string) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveView, navigateToAlbum, navigateToArtist }) => {
    const { history, favoriteAlbums } = useContext(UserMusicContext);
    const [recommendations, setRecommendations] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (history.length > 0) {
                setLoading(true);
                try {
                    const seedSongId = history[0].id;
                    const response = await getSongSuggestions(seedSongId, 15);
                    if (response.success) {
                        setRecommendations(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch recommendations:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchRecommendations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [history.length > 0 ? history[0].id : null]); // Depend on the first song ID

    return (
        <div className="p-8 text-white space-y-12">
            <header>
                <h1 className="text-5xl font-bold">Welcome to MetroMusic</h1>
                <p className="text-lg text-gray-400 mt-2">Discover and enjoy your favorite music with a fresh new look.</p>
            </header>

            {history.length > 0 && (
                <section>
                    <h2 className="text-3xl font-bold mb-4">Continue Listening</h2>
                    <SongList songs={history.slice(0, 5)} navigateToArtist={navigateToArtist} />
                </section>
            )}

            {loading ? <Loader /> : recommendations.length > 0 && (
                <section>
                    <h2 className="text-3xl font-bold mb-4">Recommended For You</h2>
                    <SongList songs={recommendations} navigateToArtist={navigateToArtist} />
                </section>
            )}
            
            {favoriteAlbums.length > 0 && (
                <section>
                    <h2 className="text-3xl font-bold mb-4">Favorite Albums</h2>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {favoriteAlbums.slice(0,6).map(album => (
                            <AlbumCard key={album.id} album={album} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                        ))}
                    </div>
                </section>
            )}

            {!history.length && !recommendations.length && !favoriteAlbums.length && (
                <div className="text-center py-20 bg-white/5 rounded-lg">
                    <h3 className="text-2xl font-bold">It's a bit quiet here...</h3>
                    <p className="text-gray-400 mt-2">Start by searching for a song to build your library.</p>
                    <button 
                        onClick={() => setActiveView('search')}
                        className="mt-6 px-6 py-3 bg-[#fc4b08] text-black font-bold rounded-full hover:bg-[#ff5f22] transition-colors duration-200"
                    >
                        Search Music
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;
