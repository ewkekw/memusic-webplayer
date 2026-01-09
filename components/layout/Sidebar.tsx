
import React, { useContext, useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { View, LocalPlaylist } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { useTranslation } from '../../context/LanguageContext';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  navigateToPlaylist: (playlistId: string) => void;
}

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LibraryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" style={{ display: 'none' }} /> 
    <path d="M12 20v-6M6 20V10M18 20V4" />
  </svg>
);

const RealLibraryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <line x1="9" y1="20" x2="9" y2="4" />
        <line x1="15" y1="20" x2="15" y2="4" />
    </svg>
)

const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);


interface NavItemProps {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  ({ icon, label, isActive, onClick }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={`group relative z-10 flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'text-white'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      <div className={`flex items-center transition-transform duration-300 ease-out group-hover:translate-x-1 ${isActive ? 'translate-x-1' : ''}`}>
        {React.cloneElement(icon, { className: `w-6 h-6 mr-4 transition-colors duration-300 ${isActive ? 'text-[#fc4b08] drop-shadow-[0_0_5px_rgba(252,75,8,0.5)]' : ''}` })}
        <span className="truncate tracking-wide">{label}</span>
      </div>
    </button>
  )
);
NavItem.displayName = 'NavItem';


interface PlaylistSidebarItemProps {
  playlist: LocalPlaylist;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const PlaylistSidebarItem: React.FC<PlaylistSidebarItemProps> = ({ playlist, onClick, style, className }) => {
  const imageUrl = playlist.coverUrl || playlist.songs[0]?.image?.find(img => img.quality === '50x50')?.url || playlist.songs[0]?.image?.[0]?.url;
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center text-left p-2 rounded-lg transition-all hover:bg-white/5 group ${className || ''}`}
      title={playlist.name}
      style={style}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={playlist.name} className="w-10 h-10 rounded-md flex-shrink-0 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
      ) : (
        <div className="w-10 h-10 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
          <MinimalistMusicIcon className="w-5 h-5 text-gray-500" />
        </div>
      )}
      <div className="ml-3 min-w-0">
        <p className="font-semibold text-white truncate text-sm group-hover:text-[#fc4b08] transition-colors">{playlist.name}</p>
        <p className="text-xs text-gray-500 truncate">{t('sidebar.playlist')}</p>
      </div>
    </button>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, navigateToPlaylist }) => {
  const { playlists, playlistHistory } = useContext(UserMusicContext);
  const { t } = useTranslation();

  const [sliderStyle, setSliderStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [hasMounted, setHasMounted] = useState(false);
  
  const navRef = useRef<HTMLElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLButtonElement>(null);
  const libraryRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);

  const libraryViews: View[] = ['library', 'playlist', 'album', 'artist', 'api_playlist'];

  const navItems = useMemo(() => [
    {
      id: 'home',
      ref: homeRef,
      icon: <HomeIcon />,
      label: t('sidebar.home'),
      isActive: activeView === 'home',
      onClick: () => setActiveView('home'),
    },
    {
      id: 'search',
      ref: searchRef,
      icon: <SearchIcon />,
      label: t('sidebar.search'),
      isActive: activeView === 'search',
      onClick: () => setActiveView('search'),
    },
    {
      id: 'library',
      ref: libraryRef,
      icon: <RealLibraryIcon />,
      label: t('sidebar.library'),
      isActive: libraryViews.includes(activeView),
      onClick: () => setActiveView('library'),
    },
    {
      id: 'settings',
      ref: settingsRef,
      icon: <SettingsIcon />,
      label: t('sidebar.settings'),
      isActive: activeView === 'settings',
      onClick: () => setActiveView('settings'),
    },
  ], [activeView, setActiveView, t]);

  useLayoutEffect(() => {
    const activeItem = navItems.find(item => item.isActive);
    if (activeItem && activeItem.ref.current) {
      setSliderStyle({
        top: activeItem.ref.current.offsetTop,
        height: activeItem.ref.current.offsetHeight,
        opacity: 1,
      });
    }
  }, [activeView, navItems, hasMounted]);

  useEffect(() => {
    const timer = setTimeout(() => setHasMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  const recentPlaylists = useMemo(() => {
    return playlistHistory
      .map(id => playlists.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [playlistHistory, playlists]);
  
  return (
    <aside className="w-64 glass-panel border-r border-white/5 p-4 flex-col h-full hidden md:flex z-20">

      <nav ref={navRef} className="relative flex flex-col space-y-1 pt-1">
        <div
          aria-hidden="true"
          className="absolute left-0 w-full bg-white/5 rounded-lg shadow-inner border border-white/5"
          style={{
            ...sliderStyle,
            transition: hasMounted
              ? 'top 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
              : 'none',
          }}
        />
        {navItems.map(item => (
          <NavItem
            key={item.id}
            ref={item.ref}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive}
            onClick={item.onClick}
          />
        ))}
      </nav>
      
      <hr className="my-6 border-t border-white/5" />
      
      <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('library.recentPlaylists')}</h3>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
        {recentPlaylists.map((playlist, index) => (
          <PlaylistSidebarItem
            key={playlist.id}
            playlist={playlist}
            onClick={() => navigateToPlaylist(playlist.id)}
            className="playlist-item-enter"
            style={{ animationDelay: `${index * 50}ms` }}
          />
        ))}
      </div>
    </aside>
  );
};
