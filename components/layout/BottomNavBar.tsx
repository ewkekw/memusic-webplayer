
import React, { useContext } from 'react';
import { View } from '../../types';
import { ProfileContext } from '../../context/ProfileContext';
import { useTranslation } from '../../context/LanguageContext';

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
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <line x1="9" y1="20" x2="9" y2="4" />
        <line x1="15" y1="20" x2="15" y2="4" />
    </svg>
);


interface NavItemProps {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 ${
            isActive ? 'text-[#fc4b08]' : 'text-gray-400 hover:text-white'
        }`}
    >
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
        <span className="text-xs font-medium">{label}</span>
    </button>
);


interface BottomNavBarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
    const { imageUrl } = useContext(ProfileContext);
    const { t } = useTranslation();
    const libraryViews: View[] = ['library', 'playlist', 'album', 'artist', 'api_playlist'];

    const navItems = [
        { id: 'home', icon: <HomeIcon />, label: t('sidebar.home'), view: 'home' as View },
        { id: 'search', icon: <SearchIcon />, label: t('sidebar.search'), view: 'search' as View },
        { id: 'library', icon: <LibraryIcon />, label: t('sidebar.library'), view: 'library' as View },
        { id: 'settings', icon: <img src={imageUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />, label: t('settings.profile.title'), view: 'settings' as View },
    ];
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-lg border-t border-white/10 z-30 flex items-center justify-around md:hidden">
            {navItems.map(item => (
                <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={item.view === 'library' ? libraryViews.includes(activeView) : activeView === item.view}
                    onClick={() => setActiveView(item.view)}
                />
            ))}
        </nav>
    );
};
