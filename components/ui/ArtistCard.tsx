
import React from 'react';
import { Artist } from '../../types';

interface ArtistCardProps {
  artist: Artist;
  onArtistClick: (artistId: string) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onArtistClick }) => {
  const imageUrl = artist.image?.find(img => img.quality === '150x150')?.url || artist.image?.[0]?.url;

  return (
    <div 
        className="group bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 text-center cursor-pointer"
        onClick={() => onArtistClick(artist.id)}
    >
      <img src={imageUrl} alt={artist.name} className="w-32 h-32 rounded-full mx-auto shadow-lg" />
      <h4 className="font-bold text-white mt-4 truncate">{artist.name}</h4>
      <p className="text-sm text-gray-400 capitalize">{artist.type}</p>
    </div>
  );
};
