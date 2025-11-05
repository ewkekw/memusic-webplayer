
import React, { useContext } from 'react';
import { UserMusicContext } from '../../context/UserMusicContext';
import { SongList } from '../ui/SongList';
import { AlbumCard } from '../ui/AlbumCard';
import { PlaylistCard } from '../ui/PlaylistCard';
import { Playlist } from '../../types';

interface FavoritesProps {
    navigateToAlbum: (albumId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
}

const Favorites: React.FC<FavoritesProps> = ({ navigateToAlbum, navigateToArtist, navigateToApiPlaylist }) => {
    const { favoriteSongs, favoriteAlbums, favoriteApiPlaylists } = useContext(UserMusicContext);

    return (
        <div className="p-8 text-white space-y-12">
            <h1 className="text-5xl font-bold">Your Favorites</h1>

            <section>
                <h2 className="text-3xl font-bold mb-4">Favorite Songs</h2>
                {favoriteSongs.length > 0 ? (
                    <SongList songs={favoriteSongs} navigateToArtist={navigateToArtist} />
                ) : (
                    <p className="text-gray-400">You haven't favorited any songs yet.</p>
                )}
            </section>

            <section>
                <h2 className="text-3xl font-bold mb-4">Favorite Albums</h2>
                {favoriteAlbums.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {favoriteAlbums.map(album => (
                            <AlbumCard key={album.id} album={album} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">You haven't favorited any albums yet.</p>
                )}
            </section>
            
            <section>
                <h2 className="text-3xl font-bold mb-4">Favorite Playlists</h2>
                {favoriteApiPlaylists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {favoriteApiPlaylists.map(playlist => (
                           <PlaylistCard key={playlist.id} playlist={playlist} onClick={navigateToApiPlaylist} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">You haven't favorited any public playlists yet.</p>
                )}
            </section>
        </div>
    );
};

export default Favorites;