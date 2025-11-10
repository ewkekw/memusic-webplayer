

import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Song, View, Playlist, Album, LocalPlaylist } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { getArtistDetails, getSongSuggestions } from '../../services/jioSaavnApi';
import { Loader } from '../ui/Loader';
import { PlayerContext } from '../../context/PlayerContext';
import { AlbumCard } from '../ui/AlbumCard';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Icons
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);
const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-2m0 0l-6 2m6-2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2zm-6 2v6a2 2 0 002 2h2a2 2 0 002-2v-6" /></svg>
);


// New Quick Access Card Component
const QuickAccessCard: React.FC<{
  item: Song | LocalPlaylist;
  onPlay: () => void;
  onClick: () => void;
}> = ({ item, onPlay, onClick }) => {
  const imageUrl = ('songs' in item) 
    ? item.coverUrl || item.songs[0]?.image?.find(img => img.quality === '150x150')?.url || item.songs[0]?.image?.[0]?.url
    : item.image?.find(img => img.quality === '150x150')?.url || item.image?.[0]?.url;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  return (
    <div className="group bg-white/5 rounded-md flex items-center pr-4 relative overflow-hidden transition-all duration-300 hover:bg-white/10" onClick={onClick}>
      <div className="w-20 h-20 flex-shrink-0 bg-black/20">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MinimalistMusicIcon className="w-8 h-8 text-gray-500" />
          </div>
        )}
      </div>
      <p className="font-bold text-white ml-4 truncate flex-1">{item.name}</p>
      <button
        onClick={handlePlay}
        className="absolute right-4 w-10 h-10 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90 translate-x-4 group-hover:translate-x-0 transition-all duration-300"
        aria-label={`Play ${item.name}`}
      >
        <PlayIcon className="w-6 h-6 ml-0.5" />
      </button>
    </div>
  );
};


interface SongCardProps {
  song: Song;
}
const SongCard: React.FC<SongCardProps> = ({ song }) => {
  const { playSong } = useContext(PlayerContext);
  const imageUrl = song.image?.find(img => img.quality === '150x150')?.url || song.image?.[0]?.url;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song, [song]);
  };
  
  return (
    <div 
      className="group relative bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer w-48 flex-shrink-0"
      onClick={handlePlay}
    >
       <div className="relative w-full aspect-square mb-3">
        <img src={imageUrl} alt={song.name} className="w-full h-full object-cover rounded-md shadow-lg" />
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 w-12 h-12 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
          aria-label={`Play ${song.name}`}
        >
            <PlayIcon className="w-7 h-7 ml-1" />
        </button>
      </div>
      <h4 className="font-bold text-white truncate">{song.name}</h4>
      <p className="text-sm text-gray-400 truncate">
          {song.artists.primary.map(a => a.name).join(', ')}
      </p>
    </div>
  );
};

const HorizontalScroller: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(true);

    const handleScroll = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const scrollLeft = el.scrollLeft;
        const scrollWidth = el.scrollWidth;
        const clientWidth = el.clientWidth;
        
        setShowLeftFade(scrollLeft > 1);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;

        handleScroll();
        el.addEventListener('scroll', handleScroll, { passive: true });

        const observer = new ResizeObserver(handleScroll);
        observer.observe(el);

        return () => {
            el.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [handleScroll]);

    return (
        <section>
            <h2 className="text-3xl font-bold mb-4">{title}</h2>
            <div className="relative">
                <div 
                    ref={scrollerRef}
                    className="flex space-x-6 overflow-x-auto pb-4 custom-scrollbar-hidden -mx-8 px-8"
                >
                    {children}
                </div>
                <div className={`absolute top-0 bottom-4 left-[-2rem] w-8 bg-gradient-to-r from-[#121212] to-transparent pointer-events-none transition-opacity duration-300 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute top-0 bottom-4 right-[-2rem] w-8 bg-gradient-to-l from-[#121212] to-transparent pointer-events-none transition-opacity duration-300 ${showRightFade ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>
        </section>
    );
};

interface HomeProps {
    setActiveView: (view: View) => void;
    navigateToAlbum: (albumId: string) => void;
    navigateToArtist: (artistId: string) => void;
    navigateToSearch: (query: string) => void;
    navigateToApiPlaylist: (playlist: Playlist) => void;
    navigateToPlaylist: (playlistId: string) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveView, navigateToAlbum, navigateToArtist, navigateToSearch, navigateToApiPlaylist, navigateToPlaylist }) => {
    const { history, favoriteArtists, playlists, playlistHistory } = useContext(UserMusicContext);
    const { playSong } = useContext(PlayerContext);
    
    const [newReleases, setNewReleases] = useState<Album[]>([]);
    const [recommendations, setRecommendations] = useState<Song[]>([]);
    
    const [loading, setLoading] = useState({
        releases: true,
        recommendations: true,
    });
    
    useEffect(() => {
        const fetchNewReleases = async () => {
            if (favoriteArtists.length === 0) {
                setNewReleases([]);
                setLoading(prev => ({ ...prev, releases: false }));
                return;
            }
            setLoading(prev => ({ ...prev, releases: true }));

            try {
                const artistsToFetch = favoriteArtists.slice(0, 5);
                const artistDetailsPromises = artistsToFetch.map(artist => getArtistDetails(artist.id));
                const responses = await Promise.all(artistDetailsPromises);

                const allAlbums = responses.flatMap(res => res.success ? (res.data.topAlbums || []) : []);
                
                const uniqueAlbumsMap = new Map<string, Album>();
                allAlbums.forEach(album => {
                    if (!uniqueAlbumsMap.has(album.id)) {
                        uniqueAlbumsMap.set(album.id, album);
                    }
                });

                const uniqueAlbums = Array.from(uniqueAlbumsMap.values());
                const sortedReleases = uniqueAlbums.sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 10);

                setNewReleases(sortedReleases);
            } catch (error) {
                console.error("Failed to fetch new releases from favorite artists:", error);
            } finally {
                setLoading(prev => ({ ...prev, releases: false }));
            }
        };

        fetchNewReleases();
    }, [favoriteArtists]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (history.length === 0) {
                setRecommendations([]);
                setLoading(prev => ({ ...prev, recommendations: false }));
                return;
            }
            setLoading(prev => ({ ...prev, recommendations: true }));
            try {
                const seedSongs = history.slice(0, 5);
                const recPromises = seedSongs.map(s => getSongSuggestions(s.id, 5));
                const responses = await Promise.all(recPromises);
                const allRecs = responses.flatMap(res => res.success ? res.data : []);
                
                const uniqueRecs = allRecs.filter((song, index, self) =>
                    index === self.findIndex(s => s.id === song.id) && !history.some(h => h.id === song.id)
                );
                setRecommendations(uniqueRecs.slice(0, 10));
            } catch (error) {
                console.error("Failed to fetch recommendations", error);
                setRecommendations([]); // Fail gracefully
            } finally {
                setLoading(prev => ({ ...prev, recommendations: false }));
            }
        };

        fetchRecommendations();
    }, [history]);
    
    const recentPlaylists = useMemo(() => {
        return playlistHistory
          .map(id => playlists.find(p => p.id === id))
          .filter((p): p is LocalPlaylist => p !== undefined);
    }, [playlistHistory, playlists]);
    
    const recentItems = useMemo(() => {
        const combined = [...recentPlaylists, ...history];
        const unique = combined.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );
        return unique.slice(0, 6);
    }, [history, recentPlaylists]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const isLoading = loading.releases || loading.recommendations;

    return (
        <div className="p-6 text-white space-y-12">
            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader /></div>
            ) : (
                <>
                    {recentItems.length > 0 && (
                        <section>
                            <h1 className="text-3xl font-bold mb-4">{getGreeting()}</h1>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {recentItems.map(item => {
                                    const isSong = !('songs' in item);
                                    return (
                                        <QuickAccessCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => {
                                                if (isSong) playSong(item as Song, [item as Song]);
                                                else navigateToPlaylist((item as LocalPlaylist).id);
                                            }}
                                            onPlay={() => {
                                                if (isSong) {
                                                    playSong(item as Song, [item as Song]);
                                                } else {
                                                    const pl = item as LocalPlaylist;
                                                    if (pl.songs.length > 0) playSong(pl.songs[0], pl.songs, pl.id);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    )}
                    
                    {recommendations.length > 0 && (
                        <HorizontalScroller title="Recommended For You">
                            {recommendations.map(song => (
                                <SongCard key={song.id} song={song} />
                            ))}
                        </HorizontalScroller>
                    )}
                    
                    {newReleases.length > 0 && (
                        <HorizontalScroller title="New Releases From Your Artists">
                            {newReleases.map(album => (
                                <div key={album.id} className="w-48 flex-shrink-0">
                                    <AlbumCard album={album} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                                </div>
                            ))}
                        </HorizontalScroller>
                    )}
                </>
            )}
        </div>
    );
};

export default Home;