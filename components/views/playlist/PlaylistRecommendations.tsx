
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { Song } from '../../../types';
import { getSongSuggestions } from '../../../services/jioSaavnApi';
import { UserMusicContext } from '../../../context/UserMusicContext';
import { Loader } from '../../ui/Loader';

// Icons
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="3" height="14" rx="1" />
    <rect x="15" y="5" width="3" height="14" rx="1" />
  </svg>
);
const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-2m0 0l-6 2m6-2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2zm-6 2v6a2 2 0 002 2h2a2 2 0 002-2v-6" /></svg>
);
const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

interface PreviewPlayerProps {
    previewingSongId: string | null;
    isPreviewPlaying: boolean;
    previewProgress: number;
    handlePreview: (e: React.MouseEvent, song: Song) => void;
}

interface PlaylistRecommendationsProps extends PreviewPlayerProps {
    playlistId: string;
    playlistSongs: Song[];
    navigateToArtist: (artistId: string) => void;
}

export const PlaylistRecommendations: React.FC<PlaylistRecommendationsProps> = ({ playlistId, playlistSongs, navigateToArtist, previewingSongId, isPreviewPlaying, previewProgress, handlePreview }) => {
    const { addSongToPlaylist } = useContext(UserMusicContext);
    const [fetchedRecommendations, setFetchedRecommendations] = useState<Song[]>([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsError, setRecsError] = useState<string | null>(null);
    
    const fetchRecommendations = useCallback(async () => {
        if (playlistSongs.length === 0) return;

        setRecsLoading(true);
        setRecsError(null);
        
        try {
            // 1. Create a diverse seed pool from the ENTIRE playlist
            // Deduplicate based on ID to ensure random sampling is fair
            const uniquePlaylistSongs = Array.from(new Map(playlistSongs.map((s: Song) => [s.id, s])).values());
            
            // 2. Randomly sample up to 5 songs from the playlist to get a "vibe" snapshot
            const seedSongs = [...uniquePlaylistSongs].sort(() => 0.5 - Math.random()).slice(0, 5);
            
            // 3. Fetch suggestions for these seeds
            const recommendationPromises = seedSongs.map(song => getSongSuggestions(song.id, 5));
            const responses = await Promise.all(recommendationPromises);
            
            // 4. Flatten results
            const allSuggestions: Song[] = responses.flatMap(res => (res.success ? res.data : []));
            
            // 5. Deduplicate suggestions and filter out songs already in the playlist
            const existingIds = new Set(playlistSongs.map(s => s.id));
            const uniqueSuggestions = allSuggestions.filter((song: Song, index: number) => 
                index === allSuggestions.findIndex((t: Song) => t.id === song.id) && !existingIds.has(song.id)
            );

            // 6. Shuffle the final results to mix the sources
            const shuffledRecs = uniqueSuggestions.sort(() => 0.5 - Math.random());
            
            // Keep a pool of 20 to show
            setFetchedRecommendations(shuffledRecs.slice(0, 20));
        } catch (e) {
            console.error("Failed to fetch recommendations", e);
            setRecsError("Could not fetch recommendations.");
        } finally {
            setRecsLoading(false);
        }
    }, [playlistSongs]);

    // Reset state when playlist changes
    useEffect(() => {
        setFetchedRecommendations([]);
    }, [playlistId]);

    // Initial fetch if playlist has songs and we have no recs
    useEffect(() => {
        if (fetchedRecommendations.length === 0 && playlistSongs.length > 0 && !recsLoading) {
            fetchRecommendations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistId]); // Only trigger on mount/id change to avoid auto-refresh loop on add

    // Filter locally to avoid re-fetching when user adds a song
    const visibleRecommendations = useMemo(() => {
        return fetchedRecommendations.filter(rec => 
            !playlistSongs.some(existing => existing.id === rec.id)
        ).slice(0, 10); // Show top 10 valid ones
    }, [fetchedRecommendations, playlistSongs]);


    const handleAddSong = (song: Song) => {
        addSongToPlaylist(playlistId, song);
    };
    
    const handleRefresh = () => {
        fetchRecommendations();
    };

    const renderSongItem = (song: Song) => {
        const imageUrl = song.image?.find(i => i.quality === '50x50')?.url;
        const isPreviewingThisSong = previewingSongId === song.id;
        const pathLength = 141; 
        const strokeDashoffset = pathLength - (pathLength * previewProgress / 100);

        return (
             <div key={song.id} className="flex items-center p-2 rounded-lg hover:bg-white/10 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-md mr-3 flex-shrink-0 relative">
                    {imageUrl ? <img src={imageUrl} alt={song.name} className="w-full h-full object-cover rounded-md animate-image-appear" loading="lazy" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-md"><MinimalistMusicIcon className="w-6 h-6 text-gray-500" /></div>}
                    
                    {isPreviewingThisSong && (
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 3px #ff5f22)' }}>
                           <path
                                d="M20 1.5 L34 1.5 A4.5 4.5 0 0 1 38.5 6 L38.5 34 A4.5 4.5 0 0 1 34 38.5 L6 38.5 A4.5 4.5 0 0 1 1.5 34 L1.5 6 A4.5 4.5 0 0 1 6 1.5 L19.999 1.5"
                                stroke="#ff5f22"
                                strokeWidth="3"
                                strokeLinecap="round"
                                style={{
                                    strokeDasharray: pathLength,
                                    strokeDashoffset: strokeDashoffset,
                                }}
                            />
                        </svg>
                    )}

                    <button onClick={(e) => handlePreview(e, song)} aria-label={isPreviewingThisSong && isPreviewPlaying ? 'Pause preview' : 'Play preview'} className={`absolute inset-0 bg-black/50 flex items-center justify-center text-white rounded-md transition-opacity ${isPreviewingThisSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isPreviewingThisSong && isPreviewPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{song.name}</p>
                    <p className="text-sm text-gray-400 truncate">
                        {song.artists.primary.map((artist, index) => (<React.Fragment key={artist.id}><span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:underline cursor-pointer">{artist.name}</span>{index < song.artists.primary.length - 1 && ', '}</React.Fragment>))}
                    </p>
                </div>
                <button 
                    onClick={() => handleAddSong(song)} 
                    className="px-4 py-1.5 text-sm font-bold rounded-full transition-colors bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95"
                >
                    Add
                </button>
            </div>
        );
    }

    if (playlistSongs.length === 0) {
         return (
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
                <p className="text-gray-500 text-sm">Add some songs to start getting recommendations.</p>
            </div>
        );
    }

    return (
        <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">Recommended Songs</h3>
                    <p className="text-gray-400 text-sm mt-1">Based on the vibes of this playlist.</p>
                </div>
                <button 
                    onClick={handleRefresh} 
                    disabled={recsLoading}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-gray-400 hover:text-white transition-all text-sm font-medium hover:bg-white/5"
                >
                    <RefreshIcon className={`w-4 h-4 ${recsLoading ? 'animate-spin' : ''}`} />
                    <span>{recsLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
            </div>

            {recsLoading && visibleRecommendations.length === 0 ? (
                 <div className="py-8"><Loader /></div>
            ) : recsError ? (
                <div className="text-center py-8 text-red-400 text-sm">{recsError}</div>
            ) : visibleRecommendations.length > 0 ? (
                <div className="space-y-2">
                    {visibleRecommendations.map(renderSongItem)}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 text-sm">No new recommendations found. Try refreshing!</div>
            )}
        </div>
    );
};
