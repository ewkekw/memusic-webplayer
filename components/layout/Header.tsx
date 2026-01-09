
import React from 'react';
import Logo from './Logo';
import { View, AppState } from '../../types';
import { ProfileContext } from '../../context/ProfileContext';
import { useTranslation } from '../../context/LanguageContext';

const BackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
    </svg>
);
const ForwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
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
        <div className="relative w-full max-w-2xl group mx-auto z-50" ref={searchContainerRef}>
            <div className={`relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] transform ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}>
                <div className={`absolute -inset-[1px] bg-gradient-to-r from-[#fc4b08] via-[#ff5f22] to-[#fc4b08] rounded-2xl blur-md transition-opacity duration-700 ease-in-out ${isFocused ? 'opacity-30' : 'opacity-0'}`}></div>
                
                <div className="relative">
                    <input 
                        type="text" 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(query); } }} 
                        onFocus={() => setIsFocused(true)} 
                        placeholder={t('search.placeholder')} 
                        className={`w-full py-4 pl-14 pr-12 rounded-2xl text-lg font-medium placeholder-gray-500 text-white border transition-all duration-300 shadow-lg
                            ${isFocused 
                                ? 'bg-[#050505] border-[#fc4b08]/30 shadow-[0_10px_40px_-10px_rgba(252,75,8,0.2)]' 
                                : 'bg-[#181818] border-white/5 hover:bg-[#202020] hover:border-white/10'
                            }
                        `}
                    />
                    <div className={`absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none transition-colors duration-300 ${isFocused ? 'text-[#fc4b08]' : 'text-gray-400'}`}>
                        <SearchIcon className="h-6 w-6" />
                    </div>
                    {query && (
                        <button 
                            onClick={() => setQuery('')} 
                            type="button" 
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition-colors" 
                            aria-label="Clear search"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {isFocused && query === '' && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-[#121212]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="px-5 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('search.recent')}</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                        {searchHistory.map((item, index) => (
                            <div key={index} onClick={() => handleHistoryClick(item)} className="group/item flex items-center justify-between w-full text-left px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer transition-all duration-200">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-2 rounded-lg bg-white/5 text-gray-500 group-hover/item:text-[#fc4b08] group-hover/item:bg-[#fc4b08]/10 transition-colors">
                                        <SearchIcon className="w-4 h-4" />
                                    </div>
                                    <span className="truncate font-medium text-base">{item}</span>
                                </div>
                                <button onClick={(e) => handleRemoveHistoryItem(e, item)} className="p-2 rounded-full opacity-0 group-hover/item:opacity-100 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all transform hover:scale-110">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
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
        <header className="h-24 bg-[#050505]/80 backdrop-blur-xl px-4 flex items-center gap-6 z-40 flex-shrink-0 border-b border-white/5 md:grid md:grid-cols-[16rem_1fr_auto] md:px-8 shadow-sm">
            <div className="hidden md:flex items-center pl-2"><Logo size="small" /></div>
            <div className="md:hidden"><HistoryNav canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} /></div>
            
            <div className="flex-1 min-w-0 md:flex md:justify-center px-2 md:px-12">
                <GlobalSearchBar onSearch={onSearch} searchHistory={searchHistory} setAppState={setAppState} />
            </div>

            <div className="hidden md:flex justify-end items-center">
                <HistoryNav canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} />
                <button 
                    onClick={() => setActiveView('settings')} 
                    className="ml-8 h-12 w-12 rounded-full p-[2px] bg-gradient-to-tr from-[#fc4b08] to-purple-600 hover:scale-105 transition-transform duration-300 shadow-lg shadow-[#fc4b08]/20" 
                    aria-label="Profile and settings"
                >
                    <div className="h-full w-full rounded-full p-[2px] bg-[#121212]">
                        <img src={imageUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    </div>
                </button>
            </div>
        </header>
    );
};
