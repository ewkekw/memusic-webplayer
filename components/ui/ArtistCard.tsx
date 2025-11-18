import React from 'react';
import { Artist } from '../../types';

interface ArtistCardProps {
  artist: Artist;
  onArtistClick: (artistId: string) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = React.memo(({ artist, onArtistClick }) => {
  const imageUrl = artist.image?.find(img => img.quality === '150x150')?.url || artist.image?.[0]?.url;

  return (
    <div 
        className="group bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 text-center cursor-pointer"
        onClick={() => onArtistClick(artist.id)}
    >
      <div className="relative w-full aspect-square mb-4">
        <img src={imageUrl} alt={artist.name} className="w-full h-full object-cover rounded-full shadow-lg animate-image-appear" loading="lazy" />
      </div>
      <h4 className="font-bold text-white truncate">{artist.name}</h4>
      <p className="text-sm text-gray-400 capitalize">{artist.type}</p>
    </div>
  );
});