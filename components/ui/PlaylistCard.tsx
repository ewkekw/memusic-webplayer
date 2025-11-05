
import React, { useContext } from 'react';
import { Playlist } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { searchSongs } from '../../services/jioSaavnApi';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);


interface PlaylistCardProps {
  playlist: Playlist;
  onClick: (playlist: Playlist) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  const imageUrl = playlist.image?.find(img => img.quality === '150x150')?.url || playlist.image?.[0]?.url;
  const { playSong } = useContext(PlayerContext);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const response = await searchSongs(playlist.name, 1, 50);
        if (response.success && response.data.results.length > 0) {
            playSong(response.data.results[0], response.data.results);
        } else {
            alert(`Could not find any songs matching "${playlist.name}"`);
        }
    } catch (error) {
        console.error("Failed to play playlist:", error);
    }
  };

  return (
    <div 
        onClick={() => onClick(playlist)}
        className="group relative bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
    >
       <div className="relative w-full aspect-square mb-3">
        <img src={imageUrl} alt={playlist.name} className="w-full h-full object-cover rounded-md shadow-lg" />
         <button
          onClick={handlePlayClick}
          className="absolute bottom-2 right-2 w-12 h-12 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
          aria-label={`Play songs from ${playlist.name}`}
        >
            <PlayIcon className="w-7 h-7 ml-1" />
        </button>
      </div>
      <h4 className="font-bold text-white mt-3 truncate">{playlist.name}</h4>
      <p className="text-sm text-gray-400 truncate">{playlist.songCount} songs</p>
    </div>
  );
};