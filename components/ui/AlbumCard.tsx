

import React, { useContext } from 'react';
import { Album } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { getAlbumDetails } from '../../services/jioSaavnApi';
import { UserMusicContext } from '../../context/UserMusicContext';

interface AlbumCardProps {
  album: Album;
  onAlbumClick: (albumId: string) => void;
  onArtistClick: (artistId: string) => void;
}

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

export const AlbumCard: React.FC<AlbumCardProps> = React.memo(({ album, onAlbumClick, onArtistClick }) => {
  const imageUrl = album.image?.find(img => img.quality === '500x500')?.url || album.image?.find(img => img.quality === '150x150')?.url || album.image?.[0]?.url;
  const { playSong } = useContext(PlayerContext);
  const { isFavoriteAlbum, toggleFavoriteAlbum } = useContext(UserMusicContext);
  const isFav = isFavoriteAlbum(album.id);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const response = await getAlbumDetails(album.id);
        if(response.success && response.data.songs && response.data.songs.length > 0) {
            playSong(response.data.songs[0], response.data.songs);
        }
    } catch (error) {
        console.error("Failed to play album:", error);
    }
  };
  
  const handleArtistClick = (e: React.MouseEvent, artistId: string) => {
    e.stopPropagation();
    onArtistClick(artistId);
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteAlbum(album);
  }

  return (
    <div 
      className="group relative bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
      onClick={() => onAlbumClick(album.id)}
    >
       <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 z-10"
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <HeartIcon className={`w-5 h-5 transition-all ${isFav ? 'fill-[#fc4b08] text-[#fc4b08]' : 'text-gray-300'}`} />
        </button>
      <div className="relative w-full aspect-square mb-3">
        <img src={imageUrl} alt={album.name} className="w-full h-full object-cover rounded-md shadow-lg animate-image-appear" loading="lazy" />
        <button
          onClick={handlePlayClick}
          className="absolute bottom-2 right-2 w-12 h-12 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
          aria-label={`Play ${album.name}`}
        >
            <PlayIcon className="w-7 h-7 ml-1" />
        </button>
      </div>
      <h4 className="font-bold text-white truncate">{album.name}</h4>
      <div className="text-sm text-gray-400 truncate">
          {album.artists.primary.map((artist, index) => (
              <React.Fragment key={artist.id}>
                  <span onClick={(e) => handleArtistClick(e, artist.id)} className="hover:underline">
                      {artist.name}
                  </span>
                  {index < album.artists.primary.length - 1 && ', '}
              </React.Fragment>
          ))}
      </div>
    </div>
  );
});