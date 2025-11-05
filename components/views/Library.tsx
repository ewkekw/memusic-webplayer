
import React, { useContext } from 'react';
import { UserMusicContext } from '../../context/UserMusicContext';
import { SongList } from '../ui/SongList';
import { LocalPlaylist } from '../../types';
import { AlbumCard } from '../ui/AlbumCard';

interface LibraryProps {
    navigateToAlbum: (albumId: string) => void;
    navigateToPlaylist: (playlistId: string) => void;
    navigateToArtist: (artistId: string) => void;
}

const MusicNoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.07 1.918l-7.5 4.5a2.25 2.25 0 01-2.36 0L3.32 16.17a2.25 2.25 0 01-1.07-1.918v-3.75m11.25-6.333V3.75A2.25 2.25 0 0010.5 1.5h-5.25A2.25 2.25 0 003 3.75v5.25m11.25 0l-10.5-3m10.5 3v6.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5V9.75m11.25-3.75z" />
    </svg>
);

const PlaylistCard: React.FC<{ playlist: LocalPlaylist; onClick: () => void; }> = ({ playlist, onClick }) => {
    const imageUrl = playlist.songs[0]?.image?.find(img => img.quality === '150x150')?.url || playlist.songs[0]?.image?.[0]?.url;

    return (
        <div 
          className="group relative bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          onClick={onClick}
        >
          <div className="relative w-full aspect-square">
            {imageUrl ? (
                <img src={imageUrl} alt={playlist.name} className="w-full h-full object-cover rounded-md shadow-lg" />
            ) : (
                <div className="w-full h-full bg-white/5 rounded-md flex items-center justify-center">
                    <MusicNoteIcon className="w-1/2 h-1/2 text-gray-500"/>
                </div>
            )}
          </div>
          <h4 className="font-bold text-white mt-3 truncate">{playlist.name}</h4>
          <p className="text-sm text-gray-400 truncate">{playlist.songs.length} songs</p>
        </div>
    );
};

const Library: React.FC<LibraryProps> = ({ navigateToAlbum, navigateToPlaylist, navigateToArtist }) => {
    const { playlists, favoriteAlbums, history } = useContext(UserMusicContext);
    
    return (
        <div className="p-8 text-white space-y-12">
            <header>
                <h1 className="text-5xl font-bold">Library</h1>
                <p className="text-lg text-gray-400 mt-2">Your personal music collection.</p>
            </header>

            <section>
                <h2 className="text-3xl font-bold mb-4">Playlists</h2>
                {playlists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {playlists.map(p => (
                            <PlaylistCard key={p.id} playlist={p} onClick={() => navigateToPlaylist(p.id)} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">You haven't created any playlists yet. Click "New Playlist" to start.</p>
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
                <h2 className="text-3xl font-bold mb-4">Recently Played</h2>
                {history.length > 0 ? (
                    <SongList songs={history.slice(0, 10)} navigateToArtist={navigateToArtist} />
                ) : (
                     <p className="text-gray-400">Your listening history will appear here.</p>
                )}
            </section>
        </div>
    );
};

export default Library;
