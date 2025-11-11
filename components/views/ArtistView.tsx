

import React, { useState, useEffect, useContext } from 'react';
import { FullArtist, View, Album, Song, Artist } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { Loader } from '../ui/Loader';
import { SongList } from '../ui/SongList';
import { AlbumCard } from '../ui/AlbumCard';
import { ArtistCard } from '../ui/ArtistCard';
import { useArtist } from '../../hooks/useArtist';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);


interface ArtistViewProps {
  artistId: string;
  setActiveView: (view: View) => void;
  navigateToAlbum: (albumId: string) => void;
  navigateToArtist: (artistId: string) => void;
}

const ArtistView: React.FC<ArtistViewProps> = ({ artistId, setActiveView, navigateToAlbum, navigateToArtist }) => {
  const { artist, loading, error } = useArtist(artistId);
  const { playSong, currentSong, isPlaying, togglePlay } = useContext(PlayerContext);
  const { isFavoriteArtist, toggleFavoriteArtist } = useContext(UserMusicContext);
  const [showFullBio, setShowFullBio] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader /></div>;
  if (error || !artist) return <div className="p-8 text-center text-gray-400">{error || 'Artist not found or failed to load.'}</div>;

  const topSongs = artist.topSongs?.slice(0, 5) ?? [];
  const isArtistCurrentlyPlaying = topSongs.some(s => s.id === currentSong?.id);
  const imageUrl = artist.image?.find(img => img.quality === '500x500')?.url || artist.image?.[0]?.url;

  const handlePlay = () => {
    if (isArtistCurrentlyPlaying && isPlaying) {
      togglePlay();
    } else if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs);
    }
  };

  const bioText = artist.bio?.find(b => b.title === 'Bio')?.text || artist.bio?.[0]?.text || '';
  const shortBio = bioText.split(' ').slice(0, 30).join(' ') + (bioText.split(' ').length > 30 ? '...' : '');

  const latestRelease = artist.topAlbums?.sort((a, b) => (b.year || 0) - (a.year || 0))[0];

  return (
    <div className="text-white">
      <div className="p-4 md:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 relative">
        <div className="absolute inset-0 z-0 opacity-30 overflow-hidden">
          {imageUrl && <img src={imageUrl} className="w-full h-full object-cover blur-3xl scale-125" alt="" loading="lazy" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
        </div>
        
        {imageUrl && <img src={imageUrl} alt={artist.name} className="w-40 h-40 sm:w-52 sm:h-52 rounded-full shadow-2xl z-10 flex-shrink-0 animate-image-appear" loading="lazy" />}
        <div className="z-10 text-center sm:text-left">
          {artist.isVerified && <p className="text-sm font-bold uppercase tracking-wider text-blue-400">Verified Artist</p>}
          <h1 className="font-extrabold tracking-tighter leading-tight text-4xl sm:text-6xl">{artist.name}</h1>
          <p className="text-gray-300 mt-2 text-sm">{artist.fanCount} followers</p>
        </div>
      </div>

      <div className="px-4 md:px-8 py-5">
        <div className="flex items-center gap-4 md:gap-5">
          <button onClick={handlePlay} className="w-12 h-12 md:w-14 md:h-14 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 transform hover:scale-105 transition-all">
            {isArtistCurrentlyPlaying && isPlaying ? <PauseIcon className="w-7 md:w-8 h-7 md:h-8"/> : <PlayIcon className="w-7 md:w-8 h-7 md:h-8 ml-1"/>}
          </button>
           <button 
            onClick={() => toggleFavoriteArtist(artist)}
            className={`px-6 py-2 md:py-3 border-2 font-bold rounded-full transition-colors ${isFavoriteArtist(artist.id) ? 'bg-white/10 border-gray-500 text-gray-300' : 'border-gray-500 text-gray-300 hover:border-white hover:text-white'}`}
          >
            {isFavoriteArtist(artist.id) ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
      
      <div className="px-4 md:px-8 pb-8 space-y-12">
        {topSongs.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Popular</h2>
            <SongList songs={topSongs} navigateToArtist={navigateToArtist} />
          </section>
        )}

        {latestRelease && (
            <section>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Latest Release</h2>
                <div className="max-w-md">
                    <AlbumCard album={latestRelease} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                </div>
            </section>
        )}

        {artist.topAlbums && artist.topAlbums.length > 0 && (
            <section>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Albums</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {artist.topAlbums.map(album => (
                        <AlbumCard key={album.id} album={album} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                    ))}
                </div>
            </section>
        )}
        
        {bioText && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">About</h2>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {showFullBio ? bioText : shortBio}
              {bioText.length > shortBio.length && (
                <button onClick={() => setShowFullBio(!showFullBio)} className="text-[#fc4b08] font-bold ml-2">
                  {showFullBio ? 'Show Less' : 'Read More'}
                </button>
              )}
            </p>
          </section>
        )}

        {artist.similarArtists && artist.similarArtists.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Fans Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {artist.similarArtists.map(simArtist => (
                <ArtistCard key={simArtist.id} artist={simArtist} onArtistClick={navigateToArtist} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ArtistView;