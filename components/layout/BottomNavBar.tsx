

import React, { useContext } from 'react';
import { View } from '../../types';
import { ProfileContext } from '../../context/ProfileContext';
import { useTranslation } from '../../context/LanguageContext';

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);
const LibraryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
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
