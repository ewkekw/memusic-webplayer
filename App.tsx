



import React, { useState, useContext, useEffect, ReactNode, createContext } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Player } from './components/layout/Player';
import Home from './components/views/Home';
import Search from './components/views/Search';
import Library from './components/views/Library';
import AlbumView from './components/views/AlbumView';
import PlaylistView from './components/views/PlaylistView';
import ArtistView from './components/views/ArtistView';
import ApiPlaylistView from './components/views/ApiPlaylistView';
import { PlayerProvider, PlayerContext } from './context/PlayerContext';
import { UserMusicProvider } from './context/UserMusicContext';
import { View, Playlist } from './types';
import { QueueSidebar } from './components/layout/QueueSidebar';

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
  const [activeView, setActiveView] = useState<View>('home');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedApiPlaylist, setSelectedApiPlaylist] = useState<Playlist | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const { currentSong, isQueueOpen } = useContext(PlayerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: ReactNode; } | null>(null);

  const showModal = (content: { title: string; content: ReactNode; }) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
    // Delay clearing content to allow for fade-out animation
    setTimeout(() => setModalContent(null), 300);
  };

  const changeView = (view: View) => {
    if (view !== 'album') setSelectedAlbumId(null);
    if (view !== 'playlist') setSelectedPlaylistId(null);
    if (view !== 'artist') setSelectedArtistId(null);
    if (view !== 'api_playlist') setSelectedApiPlaylist(null);
    setActiveView(view);
  }

  const navigateToAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setActiveView('album');
  }

  const navigateToPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActiveView('playlist');
  }
  
  const navigateToApiPlaylist = (playlist: Playlist) => {
    setSelectedApiPlaylist(playlist);
    setActiveView('api_playlist');
  }

  const navigateToArtist = (artistId: string) => {
    setSelectedArtistId(artistId);
    setActiveView('artist');
  }

  const navigateToSearch = (query: string) => {
    setInitialSearchQuery(query);
    setActiveView('search');
  };

  const clearInitialSearchQuery = () => {
    setInitialSearchQuery('');
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToSearch={navigateToSearch} navigateToApiPlaylist={navigateToApiPlaylist} />;
      case 'search':
        return <Search navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} initialQuery={initialSearchQuery} onQueryConsumed={clearInitialSearchQuery} />;
      case 'library':
        return <Library setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToPlaylist={navigateToPlaylist} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} />;
      case 'album':
        return <AlbumView albumId={selectedAlbumId!} setActiveView={changeView} navigateToArtist={navigateToArtist} navigateToPlaylist={navigateToPlaylist} />;
      case 'playlist':
        return <PlaylistView playlistId={selectedPlaylistId!} setActiveView={changeView} navigateToArtist={navigateToArtist} />;
      case 'api_playlist':
        return <ApiPlaylistView playlist={selectedApiPlaylist!} setActiveView={changeView} navigateToArtist={navigateToArtist} />;
      case 'artist':
        return <ArtistView artistId={selectedArtistId!} setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} />;
      default:
        return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToSearch={navigateToSearch} navigateToApiPlaylist={navigateToApiPlaylist} />;
    }
  };
  
  const highQualityImage = currentSong?.image?.find(img => img.quality === '500x500')?.url || currentSong?.image?.[0]?.url || '';

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      <div className="relative h-screen w-screen overflow-hidden text-gray-200 font-sans bg-[#121212]">
        {highQualityImage && (
          <div 
            className="absolute inset-0 z-0 transition-all duration-1000"
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
          <div className="flex flex-1 overflow-hidden">
              <Sidebar activeView={activeView} setActiveView={changeView} navigateToPlaylist={navigateToPlaylist} />
              <main className="flex-1 overflow-y-auto custom-scrollbar">
                {renderView()}
              </main>
              <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${isQueueOpen ? 'w-80' : 'w-0'}`}>
                <QueueSidebar navigateToArtist={navigateToArtist} />
              </div>
          </div>
          
          <div className="z-20 shrink-0">
              <Player navigateToArtist={navigateToArtist} />
          </div>
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