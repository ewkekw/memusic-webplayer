
import React, { useContext } from 'react';
import { Album } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { getAlbumDetails } from '../../services/jioSaavnApi';

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

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onAlbumClick, onArtistClick }) => {
  const imageUrl = album.image?.find(img => img.quality === '500x500')?.url || album.image?.find(img => img.quality === '150x150')?.url || album.image?.[0]?.url;
  const { playSong } = useContext(PlayerContext);

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

  return (
    <div 
      className="group relative bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
      onClick={() => onAlbumClick(album.id)}
    >
      <div className="relative w-full aspect-square mb-3">
        <img src={imageUrl} alt={album.name} className="w-full h-full object-cover rounded-md shadow-lg" />
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
};
