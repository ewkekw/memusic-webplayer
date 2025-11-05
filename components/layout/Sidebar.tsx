import React, { useContext } from 'react';
import { View } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { v4 as uuidv4 } from 'uuid';
import AsciiLogo from './AsciiLogo';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

// Fix: Changed icon type to React.ReactElement<{ className?: string }> to provide more specific typing for React.cloneElement.
interface NavItemProps {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
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

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-white/20 text-white shadow-lg'
        : 'text-gray-400 hover:bg-white/10 hover:text-white'
    }`}
  >
    {React.cloneElement(icon, { className: 'w-6 h-6 mr-4' })}
    <span className="truncate">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { createPlaylist } = useContext(UserMusicContext);

  const handleCreatePlaylist = () => {
    const playlistName = prompt("Enter new playlist name:", `My Playlist ${uuidv4().substring(0,4)}`);
    if(playlistName) {
        createPlaylist(playlistName, "My new collection of songs.");
        setActiveView('library');
    }
  }
  
  return (
    <aside className="w-64 bg-black/30 backdrop-blur-md p-4 flex flex-col h-full border-r border-white/10">
      <div className="my-8">
        <AsciiLogo />
      </div>

      <nav className="flex flex-col space-y-2">
        <NavItem
          icon={<HomeIcon />}
          label="Home"
          isActive={activeView === 'home'}
          onClick={() => setActiveView('home')}
        />
        <NavItem
          icon={<SearchIcon />}
          label="Search"
          isActive={activeView === 'search'}
          onClick={() => setActiveView('search')}
        />
        <NavItem
          icon={<LibraryIcon />}
          label="Library"
          isActive={activeView === 'library'}
          onClick={() => setActiveView('library')}
        />
        <NavItem
          icon={<HeartIcon />}
          label="Favorites"
          isActive={activeView === 'favorites'}
          onClick={() => setActiveView('favorites')}
        />
        <NavItem
          icon={<PlusIcon />}
          label="New Playlist"
          isActive={false}
          onClick={handleCreatePlaylist}
        />
      </nav>
    </aside>
  );
};