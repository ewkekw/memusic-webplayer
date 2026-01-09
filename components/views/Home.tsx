
import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Song, View, Playlist, Album, LocalPlaylist } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { getArtistDetails, getSongSuggestions } from '../../services/jioSaavnApi';
import { Loader } from '../ui/Loader';
import { PlayerContext } from '../../context/PlayerContext';
import { AlbumCard } from '../ui/AlbumCard';
import { useTranslation } from '../../context/LanguageContext';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3l14 9-14 9V3z" />
    </svg>
);
const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
    </svg>
);

const HeroSection: React.FC<{ album: Album; onPlay: () => void; onClick: () => void; }> = ({ album, onPlay, onClick }) => {
    const imageUrl = album.image?.find(img => img.quality === '500x500')?.url || album.image?.[0]?.url;
    
    return (
        <div 
            onClick={onClick}
            className="relative w-full h-[55vh] md:h-[65vh] rounded-[2rem] overflow-hidden cursor-pointer group shadow-2xl transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
        >
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] ease-out group-hover:scale-105" 
                style={{ backgroundImage: `url(${imageUrl})` }}
            ></div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent"></div>
            
            <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end items-start">
                <div className="transform transition-all duration-700 translate-y-4 group-hover:translate-y-0 opacity-0 animate-in fade-in slide-in-from-bottom-8 fill-mode-forwards" style={{ animationDelay: '0.1s' }}>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.2em] text-white uppercase bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#fc4b08] animate-pulse"></span>
                        Featured Release
                    </span>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-4 drop-shadow-xl max-w-5xl line-clamp-2 mix-blend-overlay">
                        {album.name}
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-gray-200 mb-10 font-light tracking-wide max-w-2xl drop-shadow-md">
                        {album.artists.primary.map(a => a.name).join(', ')}
                    </p>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPlay(); }}
                        className="group/btn relative flex items-center gap-4 px-8 py-4 bg-[#fc4b08] text-black rounded-full overflow-hidden transition-all duration-300 hover:pr-6 hover:shadow-[0_0_40px_rgba(252,75,8,0.4)]"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <PlayIcon className="w-6 h-6 relative z-10" />
                        <span className="font-bold text-lg tracking-wide relative z-10">LISTEN NOW</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuickAccessCard: React.FC<{
  item: Song | LocalPlaylist;
  onPlay: () => void;
  onClick: () => void;
}> = React.memo(({ item, onPlay, onClick }) => {
  const imageUrl = ('songs' in item) 
    ? item.coverUrl || item.songs[0]?.image?.find(img => img.quality === '150x150')?.url || item.songs[0]?.image?.[0]?.url
    : item.image?.find(img => img.quality === '150x150')?.url || item.image?.[0]?.url;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  };

  return (
    <div 
        className="group relative flex items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl backdrop-blur-sm overflow-hidden" 
        onClick={onClick}
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <MinimalistMusicIcon className="w-8 h-8 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
        
        <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]"
        >
            <div className="w-10 h-10 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                <PlayIcon className="w-5 h-5 ml-0.5" />
            </div>
        </button>
      </div>
      
      <div className="ml-4 flex-1 min-w-0 pr-2">
        <p className="font-bold text-white truncate text-base group-hover:text-[#fc4b08] transition-colors">{item.name}</p>
        <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider opacity-60">
            {'songs' in item ? 'Playlist' : (item as Song).artists.primary[0]?.name || 'Song'}
        </p>
      </div>
    </div>
  );
});

const SongCard: React.FC<{ song: Song }> = React.memo(({ song }) => {
  const { playSong } = useContext(PlayerContext);
  const imageUrl = song.image?.find(img => img.quality === '500x500')?.url || song.image?.[0]?.url;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song, [song], { type: 'song', id: song.id });
  };
  
  return (
    <div 
      className="group relative w-44 md:w-56 flex-shrink-0 cursor-pointer"
      onClick={handlePlay}
    >
       <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-2xl shadow-lg border border-white/5">
        <img src={imageUrl} alt={song.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
        
        <button
          onClick={handlePlay}
          className="absolute bottom-4 right-4 w-12 h-12 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-xl shadow-black/30 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out"
          aria-label={`Play ${song.name}`}
        >
            <PlayIcon className="w-6 h-6 ml-1" />
        </button>
      </div>
      
      <div className="px-1">
        <h4 className="font-bold text-white truncate text-base leading-tight group-hover:text-[#fc4b08] transition-colors">{song.name}</h4>
        <p className="text-sm text-gray-400 truncate mt-1 group-hover:text-gray-300 transition-colors">
            {song.artists.primary.map(a => a.name).join(', ')}
        </p>
      </div>
    </div>
  );
});

const HorizontalScroller: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    const handleScroll = useCallback(() => {
        window.requestAnimationFrame(() => {
            const el = scrollerRef.current;
            if (!el) return;
            const { scrollLeft, scrollWidth, clientWidth } = el;
            setShowLeftFade(scrollLeft > 1);
            setShowRightFade(scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 1);
        });
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
        <section className="relative">
            <div className="flex items-end justify-between mb-8 px-6 md:px-10">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{title}</h2>
                <div className="hidden md:flex items-center gap-2">
                    <div className="h-[1px] w-12 bg-white/10"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scroll</span>
                </div>
            </div>
            
            <div className="relative group">
                {/* Fade Masks */}
                <div className={`absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none transition-opacity duration-500 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none transition-opacity duration-500 ${showRightFade ? 'opacity-100' : 'opacity-0'}`} />

                <div 
                    ref={scrollerRef}
                    className="flex space-x-6 overflow-x-auto pb-8 pt-2 custom-scrollbar-hidden px-6 md:px-10 scroll-smooth snap-x snap-mandatory"
                >
                    {children}
                </div>
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
    const { t } = useTranslation();
    
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
                allAlbums.forEach(album => { if (!uniqueAlbumsMap.has(album.id)) uniqueAlbumsMap.set(album.id, album); });
                setNewReleases(Array.from(uniqueAlbumsMap.values()).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 10));
            } catch (error) {
                console.error(error);
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
                const uniqueRecs = allRecs.filter((song, index, self) => index === self.findIndex(s => s.id === song.id) && !history.some(h => h.id === song.id));
                setRecommendations(uniqueRecs.slice(0, 15));
            } catch (error) {
                setRecommendations([]); 
            } finally {
                setLoading(prev => ({ ...prev, recommendations: false }));
            }
        };
        fetchRecommendations();
    }, [history]);
    
    const recentPlaylists = useMemo(() => playlistHistory.map(id => playlists.find(p => p.id === id)).filter((p): p is LocalPlaylist => p !== undefined), [playlistHistory, playlists]);
    
    const recentItems = useMemo(() => {
        const combined = [...recentPlaylists, ...history];
        const unique = combined.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
        return unique.slice(0, 8);
    }, [history, recentPlaylists]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home.goodMorning');
        if (hour < 18) return t('home.goodAfternoon');
        return t('home.goodEvening');
    };

    const getDateString = () => {
        return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const isLoading = loading.releases || loading.recommendations;
    const heroRelease = newReleases.length > 0 ? newReleases[0] : null;
    const remainingReleases = newReleases.length > 0 ? newReleases.slice(1) : [];

    return (
        <div className="text-white pb-32">
            {isLoading && !heroRelease ? (
                <div className="flex justify-center items-center h-[80vh]"><Loader /></div>
            ) : (
                <div className="space-y-16">
                    <div className="px-6 md:px-10 pt-8">
                        <div className="flex flex-col mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                            <p className="text-sm font-bold text-[#fc4b08] uppercase tracking-widest mb-1 opacity-80">{getDateString()}</p>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{getGreeting()}</h1>
                        </div>

                        {heroRelease && (
                            <div className="animate-in fade-in zoom-in-95 duration-1000">
                                <HeroSection 
                                    album={heroRelease} 
                                    onPlay={() => navigateToAlbum(heroRelease.id)}
                                    onClick={() => navigateToAlbum(heroRelease.id)}
                                />
                            </div>
                        )}
                    </div>

                    {recentItems.length > 0 && (
                        <section className="px-6 md:px-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-2xl font-bold tracking-tight">Jump Back In</h2>
                                <ArrowRightIcon className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {recentItems.map((item, idx) => {
                                    const isSong = !('songs' in item);
                                    return (
                                        <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <QuickAccessCard
                                                item={item}
                                                onClick={() => isSong ? playSong(item as Song, [item as Song], { type: 'song', id: item.id }) : navigateToPlaylist((item as LocalPlaylist).id)}
                                                onPlay={() => {
                                                    if (isSong) playSong(item as Song, [item as Song], { type: 'song', id: item.id });
                                                    else {
                                                        const pl = item as LocalPlaylist;
                                                        if (pl.songs.length > 0) playSong(pl.songs[0], pl.songs, { type: 'playlist', id: pl.id });
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                    
                    {recommendations.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            <HorizontalScroller title={t('home.recommended')}>
                                {recommendations.map(song => (
                                    <div key={song.id} className="snap-start">
                                        <SongCard song={song} />
                                    </div>
                                ))}
                            </HorizontalScroller>
                        </div>
                    )}
                    
                    {remainingReleases.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                            <HorizontalScroller title="New Releases">
                                {remainingReleases.map(album => (
                                    <div key={album.id} className="w-44 md:w-56 flex-shrink-0 snap-start">
                                        <AlbumCard album={album} onAlbumClick={navigateToAlbum} onArtistClick={navigateToArtist} />
                                    </div>
                                ))}
                            </HorizontalScroller>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;
