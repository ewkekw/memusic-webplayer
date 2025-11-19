
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Song } from '../../../types';
import { searchSongs } from '../../../services/jioSaavnApi';
import { UserMusicContext } from '../../../context/UserMusicContext';
import { Loader } from '../../ui/Loader';
import { usePreviewPlayer } from '../../../hooks/usePreviewPlayer';

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
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);

interface AddSongsContentProps {
    playlistId: string;
    playlistSongs: Song[];
    navigateToArtist: (artistId: string) => void;
}

const AddSongsContent: React.FC<AddSongsContentProps> = ({ playlistId, playlistSongs, navigateToArtist }) => {
    const { addSongToPlaylist } = useContext(UserMusicContext);
    const {
        previewingSongId,
        isPreviewPlaying,
        previewProgress,
        handlePreview,
    } = usePreviewPlayer();
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [addedSongs, setAddedSongs] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);

    const hasQuery = query.trim().length > 0;

    // Auto-focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!hasQuery) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        const handler = setTimeout(async () => {
            try {
                const res = await searchSongs(query, 1, 15);
                if (res.success) {
                    setSearchResults(res.data.results);
                }
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [query, hasQuery]);
    
    const handleAddSong = (song: Song) => {
        addSongToPlaylist(playlistId, song);
        setAddedSongs(prev => new Set(prev).add(song.id));
    };

    const renderSongItem = (song: Song) => {
        const isAdded = addedSongs.has(song.id) || playlistSongs.some(ps => ps.id === song.id);
        const imageUrl = song.image?.find(i => i.quality === '50x50')?.url;
        const isPreviewingThisSong = previewingSongId === song.id;
        const pathLength = 141;
        const strokeDashoffset = pathLength - (pathLength * previewProgress / 100);

        return (
             <div key={song.id} className="flex items-center p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group animate-in fade-in">
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
                    disabled={isAdded} 
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${isAdded ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed' : 'bg-[#fc4b08] text-black hover:bg-[#ff5f22] hover:scale-105 active:scale-95 shadow-lg shadow-[#fc4b08]/20'}`}
                >
                    {isAdded ? 'Added' : 'Add'}
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full">
             <div className="relative mb-4 shrink-0">
                <input 
                    ref={inputRef}
                    type="text" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    placeholder="Search songs..." 
                    className="w-full bg-black/20 border border-white/10 p-4 pl-12 pr-10 rounded-xl focus:outline-none focus:border-[#fc4b08]/50 focus:ring-1 focus:ring-[#fc4b08]/50 text-white placeholder-gray-500 transition-all" 
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none"><SearchIcon className="h-5 w-5" /></div>
                {query && (
                    <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-white transition-colors">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
            {/* Fixed height container for results to prevent jumping */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px] relative">
                {hasQuery ? (
                    <>
                        {searchLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#282828]/50 z-10">
                                <Loader />
                            </div>
                        ) : null}
                        
                        {searchResults.length > 0 ? (
                            <div className="space-y-1 pb-2">
                                {searchResults.map(renderSongItem)}
                            </div>
                        ) : (
                             !searchLoading && <div className="flex flex-col items-center justify-center h-40 text-gray-500 animate-in fade-in">
                                <p>No results for "{query}"</p>
                             </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500/50 space-y-2">
                        <SearchIcon className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Type to search for songs</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface PlaylistQuickAddProps {
    isOpen: boolean;
    onClose: () => void;
    playlistId: string;
    playlistSongs: Song[];
    navigateToArtist: (artistId: string) => void;
}

export const PlaylistQuickAdd: React.FC<PlaylistQuickAddProps> = ({ isOpen, onClose, ...props }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={onClose}>
            <div 
                ref={contentRef}
                className="bg-[#282828] rounded-2xl shadow-2xl border border-white/10 w-full max-w-2xl m-4 flex flex-col overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 scale-100" 
                style={{ height: '70vh', maxHeight: '800px' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-white">Quick Add</h2>
                        <p className="text-sm text-gray-400">Expand your playlist instantly.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 flex-1 overflow-hidden flex flex-col">
                    <AddSongsContent {...props} />
                </div>
            </div>
        </div>
    );
};
