
import React, { useState, useContext } from 'react';
import { View } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { Loader } from '../ui/Loader';
import { SongList } from '../ui/SongList';
import { AlbumCard } from '../ui/AlbumCard';
import { ArtistCard } from '../ui/ArtistCard';
import { useArtist } from '../../hooks/useArtist';
import { useTranslation } from '../../context/LanguageContext';
import { CinematicHeader } from '../ui/CinematicHeader';

interface ArtistViewProps {
  artistId: string;
  setActiveView: (view: View) => void;
  navigateToAlbum: (albumId: string) => void;
  navigateToArtist: (artistId: string) => void;
}

const ArtistView: React.FC<ArtistViewProps> = ({ artistId, setActiveView, navigateToAlbum, navigateToArtist }) => {
  const { artist, loading, error } = useArtist(artistId);
  const { playSong, isPlaying, togglePlay, contextId } = useContext(PlayerContext);
  const { isFavoriteArtist, toggleFavoriteArtist } = useContext(UserMusicContext);
  const { t } = useTranslation();
  const [showFullBio, setShowFullBio] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader /></div>;
  if (error || !artist) return <div className="p-8 text-center text-gray-400">{error || 'Artist not found or failed to load.'}</div>;

  const topSongs = artist.topSongs?.slice(0, 5) ?? [];
  const isArtistCurrentlyPlaying = contextId === artist.id;
  const imageUrl = artist.image?.find(img => img.quality === '500x500')?.url || artist.image?.[0]?.url;

  const handlePlay = () => {
    if (isArtistCurrentlyPlaying) {
      togglePlay();
    } else if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs, { type: 'artist', id: artist.id });
    }
  };

  const bioText = artist.bio?.find(b => b.title === 'Bio')?.text || artist.bio?.[0]?.text || '';
  const shortBio = bioText.split(' ').slice(0, 40).join(' ') + (bioText.split(' ').length > 40 ? '...' : '');

  const metaString = t('artistView.followers', { count: parseInt(artist.fanCount || '0').toLocaleString() });

  return (
    <div className="text-white pb-20">
      <CinematicHeader
        title={artist.name}
        type="Artist"
        imageUrl={imageUrl}
        isVerified={artist.isVerified || false}
        meta={metaString}
        isPlaying={isPlaying}
        isCurrentContext={isArtistCurrentlyPlaying}
        onPlay={handlePlay}
        isFavorite={isFavoriteArtist(artist.id)}
        onToggleFavorite={() => toggleFavoriteArtist(artist)}
      >
         <button 
            onClick={() => toggleFavoriteArtist(artist)}
            className={`px-6 py-3 font-bold rounded-full transition-colors border ${isFavoriteArtist(artist.id) ? 'bg-white/10 border-white/20 text-white' : 'border-white/30 text-white hover:bg-white/10'}`}
          >
            {isFavoriteArtist(artist.id) ? t('artistView.following') : t('artistView.follow')}
          </button>
      </CinematicHeader>
      
      <div className="px-6 md:px-10 space-y-16 mt-8">
        
        {topSongs.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">{t('artistView.popular')}</h2>
            <div className="bg-white/5 rounded-3xl border border-white/5 p-2 md:p-6 shadow-xl backdrop-blur-sm">
                <SongList
                    songs={topSongs}
                    navigateToArtist={navigateToArtist}
                    context={{ type: 'artist', id: artist.id }}
                />
            </div>
          </section>
        )}

        {artist.topAlbums && artist.topAlbums.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">{t('artistView.albums')}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {artist.topAlbums.map((album, idx) => (
                        <div key={album.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards">
                            <AlbumCard album={album} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                        </div>
                    ))}
                </div>
            </section>
        )}
        
        {bioText && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-6 tracking-tight">{t('artistView.about')}</h2>
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg">
                    <p>{showFullBio ? bioText : shortBio}</p>
                    {bioText.length > shortBio.length && (
                        <button onClick={() => setShowFullBio(!showFullBio)} className="text-[#fc4b08] font-bold mt-2 hover:underline">
                        {showFullBio ? t('artistView.showLess') : t('artistView.readMore')}
                        </button>
                    )}
                </div>
            </div>
            
            <div className="bg-white/5 rounded-3xl p-8 border border-white/5 h-fit">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Artist Stats</h3>
                <div className="space-y-4">
                    <div>
                        <div className="text-3xl font-black text-white">{artist.fanCount || 'N/A'}</div>
                        <div className="text-sm text-gray-400">Total Followers</div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white capitalize">{artist.dominantType || artist.type}</div>
                        <div className="text-sm text-gray-400">Artist Type</div>
                    </div>
                    {artist.availableLanguages && (
                        <div>
                            <div className="text-sm font-medium text-white capitalize">{artist.availableLanguages.join(', ')}</div>
                            <div className="text-sm text-gray-400">Languages</div>
                        </div>
                    )}
                </div>
            </div>
          </section>
        )}

        {artist.similarArtists && artist.similarArtists.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 pb-10">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">{t('artistView.fansLike')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {artist.similarArtists.map((simArtist, idx) => (
                <div key={simArtist.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards">
                    <ArtistCard artist={simArtist} onArtistClick={navigateToArtist} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ArtistView;
