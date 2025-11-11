

import React, { useState, useEffect, useContext } from 'react';
import { Song } from '../../../types';
import { getSongSuggestions } from '../../../services/jioSaavnApi';
import { UserMusicContext } from '../../../context/UserMusicContext';
import { Loader } from '../../ui/Loader';

// Icons
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>
);
const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-2m0 0l-6 2m6-2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2zm-6 2v6a2 2 0 002 2h2a2 2 0 002-2v-6" /></svg>
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
    const [recommendations, setRecommendations] = useState<Song[]>([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsError, setRecsError] = useState<string | null>(null);
    const [addedSongs, setAddedSongs] = useState<Set<string>>(new Set());
    
    const canShowRecs = playlistSongs.length >= 3;

    useEffect(() => {
        if (!canShowRecs) {
            setRecommendations([]);
            return;
        }
        
        const fetchRecommendations = async () => {
            setRecsLoading(true);
            setRecsError(null);
            try {
                const seedSongs = playlistSongs.slice(-3);
                const recommendationPromises = seedSongs.map(song => getSongSuggestions(song.id, 5));
                const responses = await Promise.all(recommendationPromises);
                
                const allSuggestions = responses.flatMap(res => (res.success ? res.data : []));
                
                const uniqueSuggestions = allSuggestions.reduce((acc, current) => {
                    if (!acc.find(item => item.id === current.id) && !playlistSongs.some(ps => ps.id === current.id)) {
                        acc.push(current);
                    }
                    return acc;
                }, [] as Song[]);

                for (let i = uniqueSuggestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [uniqueSuggestions[i], uniqueSuggestions[j]] = [uniqueSuggestions[j], uniqueSuggestions[i]];
                }
                setRecommendations(uniqueSuggestions.slice(0, 10));
            } catch (e) {
                console.error("Failed to fetch recommendations", e);
                setRecsError("Could not fetch recommendations. The service might be temporarily unavailable.");
            } finally {
                setRecsLoading(false);
            }
        };
        fetchRecommendations();
    }, [playlistSongs, canShowRecs]);
    
    const handleAddSong = (song: Song) => {
        addSongToPlaylist(playlistId, song);
        setAddedSongs(prev => new Set(prev).add(song.id));
    };

    const renderSongItem = (song: Song) => {
        const isAdded = addedSongs.has(song.id) || playlistSongs.some(ps => ps.id === song.id);
        const imageUrl = song.image?.find(i => i.quality === '50x50')?.url;
        const isPreviewingThisSong = previewingSongId === song.id;
        const pathLength = 141; // Perimeter of a 37x37 rounded rect with radius 4.5, inset for a 3px stroke
        const strokeDashoffset = pathLength - (pathLength * previewProgress / 100);

        return (
             <div key={song.id} className="flex items-center p-2 rounded-lg hover:bg-white/10 transition-colors group">
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
                <button onClick={() => handleAddSong(song)} disabled={isAdded} className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${isAdded ? 'bg-green-500/20 text-green-400 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}>{isAdded ? 'Added' : 'Add'}</button>
            </div>
        );
    }

    if (!canShowRecs) {
        return <div className="text-center py-10"><p className="text-gray-400">Add at least 3 songs to get recommendations.</p></div>;
    }

    if (recsLoading) return <div className="mt-8"><Loader /></div>;

    if (recsError)