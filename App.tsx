

import React, { useState, useContext, useEffect, ReactNode, createContext, useCallback, lazy, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/layout/Sidebar';
import { Player } from './components/layout/Player';
import { PlayerProvider, PlayerContext } from './context/PlayerContext';
import { UserMusicProvider } from './context/UserMusicContext';
import { View, Playlist } from './types';
import { QueueSidebar } from './components/layout/QueueSidebar';
import { Header } from './components/layout/Header';
import { Loader } from './components/ui/Loader';
import { BottomNavBar } from './components/layout/BottomNavBar';

const Home = lazy(() => import('./components/views/Home'));
const Search = lazy(() => import('./components/views/Search'));
const Library = lazy(() => import('./components/views/Library'));
const AlbumView = lazy(() => import('./components/views/AlbumView'));
const PlaylistView = lazy(() => import('./components/views/PlaylistView'));
const ArtistView = lazy(() => import('./components/views/ArtistView'));
const ApiPlaylistView = lazy(() => import('./components/views/ApiPlaylistView'));
const Settings = lazy(() => import('./components/views/Settings'));


interface ModalContextType {
  showModal: (content: { title: string; content: ReactNode; }) => void;
  hideModal: () => void;
}
export const ModalContext = createContext<ModalContextType>({} as ModalContextType);


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsShowing(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(onClose, 300); 
  };

  if (!isOpen) {
    return null;
  }

  const backdropClasses = isShowing ? 'opacity-100' : 'opacity-0';
  const modalClasses = isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-out ${backdropClasses}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={`bg-[#282828] rounded-lg shadow-2xl p-6 w-full max-w-md m-4 border border-white/10 text-white transform transition-all duration-300 ease-out ${modalClasses}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

interface HistoryEntry {
  key: string;
  view: View;
  albumId?: string | null;
  playlistId?: string | null;
  artistId?: string | null;
  apiPlaylist?: Playlist | null;
  searchQuery?: string;
}

const App: React.FC = () => {
  return (
    <UserMusicProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </UserMusicProvider>
  );
};

const MainApp: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([{ key: uuidv4(), view: 'home' }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward' | null>(null);
  
  const { currentSong, isQueueOpen } = useContext(PlayerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: ReactNode; } | null>(null);

  const showModal = (content: { title: string; content: ReactNode; }) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalContent(null), 300);
  };

  const navigate = useCallback((entry: Omit<HistoryEntry, 'key'>, replace = false) => {
    const currentEntry = history[historyIndex];
    if ( !replace && currentEntry.view === entry.view && currentEntry.albumId === entry.albumId && currentEntry.playlistId === entry.playlistId && currentEntry.artistId === entry.artistId && currentEntry.apiPlaylist?.id === entry.apiPlaylist?.id && currentEntry.searchQuery === entry.searchQuery ) {
        return;
    }

    setNavDirection('forward');
    const newHistory = history.slice(0, historyIndex + (replace ? 0 : 1));
    const newEntry = { ...entry, key: uuidv4() };
    const finalHistory = [...newHistory, newEntry];
    setHistory(finalHistory);
    setHistoryIndex(finalHistory.length - 1);
  }, [history, historyIndex]);

  const goBack = () => {
    if (historyIndex > 0) {
      setNavDirection('backward');
      setHistoryIndex(i => i - 1);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setNavDirection('forward');
      setHistoryIndex(i => i + 1);
    }
  };

  const changeView = (view: View) => navigate({ view });
  const navigateToAlbum = (albumId: string) => navigate({ view: 'album', albumId });
  const navigateToPlaylist = (playlistId: string) => navigate({ view: 'playlist', playlistId });
  const navigateToApiPlaylist = (playlist: Playlist) => navigate({ view: 'api_playlist', apiPlaylist: playlist });
  const navigateToArtist = (artistId: string) => navigate({ view: 'artist', artistId });
  const navigateToSearch = (query: string) => {
      const isCurrentlySearch = history[historyIndex].view === 'search';
      navigate({ view: 'search', searchQuery: query }, isCurrentlySearch);
  };

  const currentViewEntry = history[historyIndex];
  const animationClass = navDirection === 'forward' ? 'view-enter-forward' : navDirection === 'backward' ? 'view-enter-backward' : '';

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  
  const renderView = () => {
    switch (currentViewEntry.view) {
      case 'home':
        return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToSearch={navigateToSearch} navigateToApiPlaylist={navigateToApiPlaylist} navigateToPlaylist={navigateToPlaylist} />;
      case 'search':
        return <Search navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} initialQuery={currentViewEntry.searchQuery} />;
      case 'library':
        return <Library setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToPlaylist={navigateToPlaylist} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} />;
      case 'album':
        return <AlbumView albumId={currentViewEntry.albumId!} setActiveView={changeView} navigateToArtist={navigateToArtist} navigateToPlaylist={navigateToPlaylist} />;
      case 'playlist':
        return <PlaylistView playlistId={currentViewEntry.playlistId!} setActiveView={changeView} navigateToArtist={navigateToArtist} />;
      case 'api_playlist':
        return <ApiPlaylistView playlist={currentViewEntry.apiPlaylist!} setActiveView={changeView} navigateToArtist={navigateToArtist} />;
      case 'artist':
        return <ArtistView artistId={currentViewEntry.artistId!} setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} />;
      case 'settings':
        return <Settings />;
      default:
        return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToSearch={navigateToSearch} navigateToApiPlaylist={navigateToApiPlaylist} navigateToPlaylist={navigateToPlaylist} />;
    }
  };
  
  const highQualityImage = currentSong?.image?.find(img => img.quality === '500x500')?.url || currentSong?.image?.[0]?.url || '';

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      <div className="relative h-screen w-screen overflow-hidden text-gray-200 font-sans bg-[#121212]">
        {highQualityImage && (
          <div 
            className="absolute inset-0 z-0 transition-[background-image] duration-500 ease-in-out"
            style={{
              backgroundImage: `url(${highQualityImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-3xl"></div>
          </div>
        )}
        <div className="relative z-10 flex flex-col h-full">
          <Header
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            goBack={goBack}
            goForward={goForward}
            onSearch={navigateToSearch}
            activeView={currentViewEntry.view}
          />
          <div className="flex flex-1 overflow-hidden">
              <Sidebar activeView={currentViewEntry.view} setActiveView={changeView} navigateToPlaylist={navigateToPlaylist} />
              <main className="flex-1 overflow-y-auto custom-scrollbar pb-36 md:pb-0">
                <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader /></div>}>
                  <div key={currentViewEntry.key} className={animationClass} onAnimationEnd={() => setNavDirection(null)}>
                    {renderView()}
                  </div>
                </Suspense>
              </main>
              <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${isQueueOpen ? 'w-80' : 'w-0'}`}>
                <QueueSidebar navigateToArtist={navigateToArtist} />
              </div>
          </div>
          
          <div className={`z-20 shrink-0 transition-[height] duration-300 ease-in-out ${currentSong ? 'h-20 md:h-24' : 'h-0'}`}>
              <div className={`h-full transition-opacity duration-200 ${currentSong ? 'opacity-100' : 'opacity-0'}`}>
                <Player navigateToArtist={navigateToArtist} />
              </div>
          </div>
           <BottomNavBar activeView={currentViewEntry.view} setActiveView={changeView} />
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={hideModal}
          title={modalContent?.title || ''}
        >
          {modalContent?.content}
        </Modal>
      </div>
    </ModalContext.Provider>
  );
};


export default App;