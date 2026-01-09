
import React, { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Song } from '../../../types';
import { searchSongs } from '../../../services/jioSaavnApi';
import { UserMusicContext } from '../../../context/UserMusicContext';
import { Loader } from '../../ui/Loader';
import { usePreviewPlayer } from '../../../hooks/usePreviewPlayer';

// Icons - Premium Style
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="2" /><rect x="14" y="4" width="4" height="16" rx="2" /></svg>
);
const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

interface AddSongsContentProps {
    playlistId: string;
    playlistSongs: Song[];
    navigateToArtist: (artistId: string) => void;
    onClose: () => void;
}

const AddSongsContent: React.FC<AddSongsContentProps> = ({ playlistId, playlistSongs, navigateToArtist, onClose }) => {
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
                const res = await searchSongs(query, 1, 10);
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
        const imageUrl = song.image?.find(i => i.quality === '150x150')?.url || song.image?.[0]?.url;
        const isPreviewingThisSong = previewingSongId === song.id;
        const pathLength = 141;
        const strokeDashoffset = pathLength - (pathLength * previewProgress / 100);

        return (
             <div key={song.id} className="group flex items-center p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 border border-transparent hover:border-white/5">
                <div className="w-14 h-14 rounded-xl mr-4 flex-shrink-0 relative overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                    {imageUrl ? <img src={imageUrl} alt={song.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-xl"><MinimalistMusicIcon className="w-6 h-6 text-gray-500" /></div>}
                    
                    {isPreviewingThisSong && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                    )}

                    {isPreviewingThisSong && (
                        <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 3px #fc4b08)' }}>
                            <path
                                d="M20 1.5 L34 1.5 A4.5 4.5 0 0 1 38.5 6 L38.5 34 A4.5 4.5 0 0 1 34 38.5 L6 38.5 A4.5 4.5 0 0 1 1.5 34 L1.5 6 A4.5 4.5 0 0 1 6 1.5 L19.999 1.5"
                                stroke="#fc4b08"
                                strokeWidth="3"
                                strokeLinecap="round"
                                style={{
                                    strokeDasharray: pathLength,
                                    strokeDashoffset: strokeDashoffset,
                                    transition: 'stroke-dashoffset 0.1s linear'
                                }}
                            />
                        </svg>
                    )}

                    <button 
                        onClick={(e) => handlePreview(e, song)} 
                        aria-label={isPreviewingThisSong && isPreviewPlaying ? 'Pause preview' : 'Play preview'} 
                        className={`absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 ${isPreviewingThisSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 bg-black/40'}`}
                    >
                        {isPreviewingThisSong && isPreviewPlaying ? <PauseIcon className="w-6 h-6 drop-shadow-md" /> : <PlayIcon className="w-6 h-6 drop-shadow-md" />}
                    </button>
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-white text-base truncate group-hover:text-[#fc4b08] transition-colors">{song.name}</p>
                    <p className="text-sm text-gray-400 truncate flex items-center gap-1">
                        {song.artists.primary.map((artist, index) => (
                            <React.Fragment key={artist.id}>
                                <span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:text-white hover:underline cursor-pointer transition-colors">{artist.name}</span>
                                {index < song.artists.primary.length - 1 && ', '}
                            </React.Fragment>
                        ))}
                    </p>
                </div>
                
                <button 
                    onClick={() => handleAddSong(song)} 
                    disabled={isAdded} 
                    className={`h-10 px-5 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ease-out 
                        ${isAdded 
                            ? 'bg-green-500 text-black w-28 cursor-default' 
                            : 'bg-white/10 text-white hover:bg-white/20 w-20 hover:scale-105 active:scale-95'}`}
                >
                    <span className={`absolute transition-all duration-300 ${isAdded ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>Add</span>
                    <span className={`absolute flex items-center gap-1 transition-all duration-300 ${isAdded ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
                        <CheckIcon className="w-4 h-4" /> Added
                    </span>
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-[#121212]/95 backdrop-blur-3xl">
             <div className="relative p-6 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 pl-4 focus-within:ring-2 focus-within:ring-[#fc4b08]/50 focus-within:bg-black/40 transition-all duration-300">
                    <SearchIcon className="h-6 w-6 text-[#fc4b08]" />
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        placeholder="Search for songs to add..." 
                        className="w-full bg-transparent border-none text-xl font-medium text-white placeholder-gray-500 focus:outline-none h-12"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors mr-1">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative px-4 pb-4">
                {hasQuery ? (
                    <>
                        {searchLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Loader />
                            </div>
                        ) : null}
                        
                        {searchResults.length > 0 ? (
                            <div className="space-y-2 pt-2">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">Results</div>
                                {searchResults.map(renderSongItem)}
                            </div>
                        ) : (
                             !searchLoading && <div className="flex flex-col items-center justify-center h-64 text-gray-500 animate-in fade-in">
                                <p className="text-lg">No results found for "{query}"</p>
                             </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500/30 space-y-4">
                        <SearchIcon className="w-16 h-16 opacity-20" />
                        <p className="text-base font-medium">Start typing to find music</p>
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-white/5 flex justify-end">
                <button onClick={onClose} className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    Done
                </button>
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted || !document.body) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-md animate-in fade-in duration-300" />
            
            <div 
                className="relative bg-[#121212] rounded-[32px] shadow-[0_0_60px_rgba(252,75,8,0.15)] w-full max-w-2xl flex flex-col overflow-hidden transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] animate-in zoom-in-90 scale-100 border border-white/10" 
                style={{ height: '75vh', maxHeight: '800px' }}
                onClick={e => e.stopPropagation()}
            >
                <AddSongsContent {...props} onClose={onClose} />
            </div>
        </div>,
        document.body
    );
};
