
import React, { useContext, useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { View, LocalPlaylist } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  navigateToPlaylist: (playlistId: string) => void;
}

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const LibraryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.127c-.331.183-.581.495-.644.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.127.332-.183.582-.495.644-.87l.213-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const MinimalistMusicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-2m0 0l-6 2m6-2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2zm-6 2v6a2 2 0 002 2h2a2 2 0 002-2v-6" />
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
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <div className="flex items-center transition-transform duration-300 ease-in-out group-hover:translate-x-1">
        {React.cloneElement(icon, { className: 'w-6 h-6 mr-4' })}
        <span className="truncate">{label}</span>
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

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center text-left p-2 rounded-lg transition-colors hover:bg-white/10 ${className || ''}`}
      title={playlist.name}
      style={style}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={playlist.name} className="w-12 h-12 rounded-md flex-shrink-0 object-cover" />
      ) : (
        <div className="w-12 h-12 bg-white/5 rounded-md flex items-center justify-center flex-shrink-0">
          <MinimalistMusicIcon className="w-6 h-6 text-gray-500" />
        </div>
      )}
      <div className="ml-3 min-w-0">
        <p className="font-semibold text-white truncate">{playlist.name}</p>
        <p className="text-sm text-gray-400 truncate">Playlist</p>
      </div>
    </button>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, navigateToPlaylist }) => {
  const { playlists, playlistHistory } = useContext(UserMusicContext);

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
      label: 'Home',
      isActive: activeView === 'home',
      onClick: () => setActiveView('home'),
    },
    {
      id: 'search',
      ref: searchRef,
      icon: <SearchIcon />,
      label: 'Search',
      isActive: activeView === 'search',
      onClick: () => setActiveView('search'),
    },
    {
      id: 'library',
      ref: libraryRef,
      icon: <LibraryIcon />,
      label: 'Library',
      isActive: libraryViews.includes(activeView),
      onClick: () => setActiveView('library'),
    },
    {
      id: 'settings',
      ref: settingsRef,
      icon: <SettingsIcon />,
      label: 'Settings',
      isActive: activeView === 'settings',
      onClick: () => setActiveView('settings'),
    },
  ], [activeView, setActiveView]);

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
    // Enable transitions only after the initial position has been set.
    // This prevents the "surge" animation on first load.
    const timer = setTimeout(() => setHasMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  const recentPlaylists = useMemo(() => {
    return playlistHistory
      .map(id => playlists.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [playlistHistory, playlists]);
  
  return (
    <aside className="w-64 bg-black/30 backdrop-blur-md p-4 flex-col h-full border-r border-white/10 hidden md:flex">

      <nav ref={navRef} className="relative flex flex-col space-y-2 pt-1">
        <div
          aria-hidden="true"
          className="absolute left-0 w-full bg-white/20 rounded-lg shadow-lg"
          style={{
            ...sliderStyle,
            transition: hasMounted
              ? 'top 0.35s cubic-bezier(0.4, 0, 0.2, 1), height 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
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
      
      <hr className="my-4 border-t border-white/10" />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
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