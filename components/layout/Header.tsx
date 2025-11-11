import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import { View } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const HistoryNav: React.FC<{
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
}> = ({ canGoBack, canGoForward, goBack, goForward }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={goBack}
      disabled={!canGoBack}
      className="p-2 rounded-full bg-black/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/60 transition-all"
      aria-label="Go back"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button
      onClick={goForward}
      disabled={!canGoForward}
      className="p-2 rounded-full bg-black/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/60 transition-all"
      aria-label="Go forward"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const GlobalSearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('metromusic-search-history', []);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (searchTerm: string) => {
        const trimmedTerm = searchTerm.trim();
        if (trimmedTerm) {
            setSearchHistory(prev => {
                const lowerCaseTerm = trimmedTerm.toLowerCase();
                const newHistory = [
                    trimmedTerm,
                    ...prev.filter(item => item.toLowerCase() !== lowerCaseTerm)
                ].slice(0, 10);
                return newHistory;
            });
            onSearch(trimmedTerm);
            setIsFocused(false);
        }
    };
    
    const handleHistoryClick = (searchTerm: string) => {
        setQuery(searchTerm);
        handleSearch(searchTerm);
    };

    const handleRemoveHistoryItem = (e: React.MouseEvent, itemToRemove: string) => {
        e.stopPropagation();
        setSearchHistory(prev => prev.filter(item => item !== itemToRemove));
    };

    return (
        <div className="relative w-full max-w-2xl" ref={searchContainerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(query); } }}
                    onFocus={() => setIsFocused(true)}
                    placeholder="Search for songs, albums, artists..."
                    className="w-full bg-white/5 backdrop-blur-xl p-3 pl-12 rounded-full text-base placeholder-gray-300 border border-white/10 hover:border-white/20 focus:bg-white/10 focus:border-[#fc4b08] focus:outline-none focus:ring-1 focus:ring-[#fc4b08] transition-all duration-300"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {query && (
                    <button onClick={() => setQuery('')} type="button" className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400/70 hover:text-white transition-colors" aria-label="Clear search">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isFocused && query === '' && searchHistory.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#1c1c1c]/70 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl p-2 z-30 max-h-60 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase">Recent Searches</p>
                    {searchHistory.map((item, index) => (
                        <div key={index} onClick={() => handleHistoryClick(item)} className="group flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-white/10 cursor-pointer">
                            <span className="truncate">{item}</span>
                            <button onClick={(e) => handleRemoveHistoryItem(e, item)} className="ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white hover:bg-white/10">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface HeaderProps {
    canGoBack: boolean;
    canGoForward: boolean;
    goBack: () => void;
    goForward: () => void;
    onSearch: (query: string) => void;
    activeView: View;
}

export const Header: React.FC<HeaderProps> = ({ canGoBack, canGoForward, goBack, goForward, onSearch }) => {
    return (
        <header className="h-20 bg-black/30 backdrop-blur-md px-4 flex items-center gap-4 z-20 flex-shrink-0 border-b border-white/10 md:grid md:grid-cols-[16rem_1fr_16rem] md:h-24 md:px-6">
            {/* Column 1: Logo (Desktop) / History (Mobile) */}
            <div className="hidden md:flex items-center pl-4">
                <Logo size="small" />
            </div>
            <div className="md:hidden">
                <HistoryNav canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} />
            </div>
            
            {/* Column 2: Search Bar */}
            <div className="flex-1 min-w-0 md:flex md:justify-center">
                <GlobalSearchBar onSearch={onSearch} />
            </div>

            {/* Column 3: History Nav (Desktop) */}
            <div className="hidden md:flex justify-end">
                <HistoryNav canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} />
            </div>
        </header>
    );
};