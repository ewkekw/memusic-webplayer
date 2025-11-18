

import React from 'react';
import Logo from './Logo';
import { View, AppState } from '../../types';
import { ProfileContext } from '../../context/ProfileContext';
import { useTranslation } from '../../context/LanguageContext';

const BackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
const ForwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);

const HistoryNav: React.FC<{
  canGoBack: boolean; canGoForward: boolean; goBack: () => void; goForward: () => void;
}> = ({ canGoBack, canGoForward, goBack, goForward }) => (
  <div className="flex items-center space-x-2">
    <button onClick={goBack} disabled={!canGoBack} className="p-2 rounded-full bg-black/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/60 transition-all" aria-label="Go back"><BackIcon className="h-5 w-5" /></button>
    <button onClick={goForward} disabled={!canGoForward} className="p-2 rounded-full bg-black/30 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/60 transition-all" aria-label="Go forward"><ForwardIcon className="h-5 w-5" /></button>
  </div>
);

const GlobalSearchBar: React.FC<{
    onSearch: (query: string) => void;
    searchHistory: string[];
    setAppState: (updater: (draft: AppState) => void) => void;
}> = ({ onSearch, searchHistory, setAppState }) => {
    const { t } = useTranslation();
    const [query, setQuery] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const searchContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
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
            setAppState(draft => {
                const lowerCaseTerm = trimmedTerm.toLowerCase();
                draft.searchHistory = [
                    trimmedTerm,
                    ...draft.searchHistory.filter(item => item.toLowerCase() !== lowerCaseTerm)
                ].slice(0, 10);
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
        setAppState(draft => {
            draft.searchHistory = draft.searchHistory.filter(item => item !== itemToRemove);
        });
    };

    return (
        <div className="relative w-full max-w-2xl" ref={searchContainerRef}>
            <div className="relative">
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(query); } }} onFocus={() => setIsFocused(true)} placeholder={t('search.placeholder')} className="w-full bg-white/5 backdrop-blur-xl p-3 pl-12 rounded-full text-base placeholder-gray-300 border border-white/10 hover:border-white/20 focus:bg-white/10 focus:border-[#fc4b08] focus:outline-none focus:ring-1 focus:ring-[#fc4b08] transition-all duration-300"/>
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none"><SearchIcon className="h-5 w-5" /></div>
                {query && (<button onClick={() => setQuery('')} type="button" className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400/70 hover:text-white transition-colors" aria-label="Clear search"><CloseIcon className="w-5 h-5" /></button>)}
            </div>

            {isFocused && query === '' && searchHistory.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#1c1c1c]/70 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl p-2 z-30 max-h-60 overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase">{t('search.recent')}</p>
                    {searchHistory.map((item, index) => (
                        <div key={index} onClick={() => handleHistoryClick(item)} className="group flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-white/10 cursor-pointer">
                            <span className="truncate">{item}</span>
                            <button onClick={(e) => handleRemoveHistoryItem(e, item)} className="ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white hover:bg-white/10"><CloseIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface HeaderProps {
    canGoBack: boolean; canGoForward: boolean; goBack: () => void; goForward: () => void;
    onSearch: (query: string) => void; activeView: View; setActiveView: (view: View) => void;
    searchHistory: string[]; setAppState: (updater: (draft: AppState) => void) => void;
}

export const Header: React.FC<HeaderProps> = ({ canGoBack, canGoForward, goBack, goForward, onSearch, setActiveView, searchHistory, setAppState }) => {
    const { imageUrl } = React.useContext(ProfileContext);

    return (
        <header className="h-20 bg-black/30 backdrop-blur-md px-4 flex items-center gap-4 z-20 flex-shrink-0 border-b border-white/10 md:grid md:grid-cols-[16rem_1fr_auto] md:h-24 md:px-6">
            <div className="hidden md:flex items-center pl-4"><Logo size="small" /></div>
            <div className="md:hidden"><HistoryNav canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} /></div>
            
            <div className="flex-1 min-w-0 md:flex md:justify-center">
                <GlobalSearchBar onSearch={onSearch} searchHistory={searchHistory} setAppState={setAppState} />
            </div>

            <div className="hidden md:flex justify-end items-center">
                <HistoryNav canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} />
                <button onClick={() => setActiveView('settings')} className="ml-4 h-10 w-10 rounded-full bg-black/30 hover:ring-2 hover:ring-offset-2 hover:ring-offset-black/30 hover:ring-[#fc4b08] transition-all" aria-label="Profile and settings">
                    <img src={imageUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
                </button>
            </div>
        </header>
    );
};