
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
        className="group bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all duration-300 text-center cursor-pointer border border-white/5 hover:border-white/10 hover:shadow-2xl hover:-translate-y-1"
        onClick={() => onArtistClick(artist.id)}
    >
      <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-full shadow-lg border-2 border-transparent group-hover:border-[#fc4b08]/50 transition-colors duration-300">
        <img 
            src={imageUrl} 
            alt={artist.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 animate-image-appear" 
            loading="lazy" 
        />
      </div>
      <h4 className="font-bold text-white truncate text-lg tracking-tight group-hover:text-[#fc4b08] transition-colors">{artist.name}</h4>
      <p className="text-sm text-gray-400 capitalize mt-1">{artist.type}</p>
    </div>
  );
});
