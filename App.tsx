import React, { useState, useContext, useEffect, ReactNode } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Player } from './components/layout/Player';
import Home from './components/views/Home';
import Search from './components/views/Search';
import Library from './components/views/Library';
import Favorites from './components/views/Favorites';
import AlbumView from './components/views/AlbumView';
import PlaylistView from './components/views/PlaylistView';
import ArtistView from './components/views/ArtistView';
import ApiPlaylistView from './components/views/ApiPlaylistView';
import { PlayerProvider, PlayerContext } from './context/PlayerContext';
import { UserMusicProvider } from './context/UserMusicContext';
import { View, Playlist } from './types';
import { QueueSidebar } from './components/layout/QueueSidebar';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // Fix: Corrected invalid type 'React.React.ReactNode' to 'React.ReactNode'.
  children: React.ReactNode;
  // Fix: Corrected invalid type 'React.React.ReactNode' to 'React.ReactNode'.
  actions: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, actions }) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Use a timeout to allow the component to mount before starting the animation
      const timer = setTimeout(() => setIsShowing(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(onClose, 300); // Must match animation duration
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
        <div className="text-gray-300 mb-6">{children}</div>
        <div className="flex justify-end space-x-4">{actions}</div>
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
  const { currentSong, isQueueOpen } = useContext(PlayerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: ReactNode; actions: ReactNode; } | null>(null);

  const showModal = (content: { title: string; content: ReactNode; actions: ReactNode; }) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
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

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} />;
      case 'search':
        return <Search navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} />;
      case 'library':
        return <Library navigateToAlbum={navigateToAlbum} navigateToPlaylist={navigateToPlaylist} navigateToArtist={navigateToArtist} />;
      case 'favorites':
        return <Favorites navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} />;
      case 'album':
        return <AlbumView albumId={selectedAlbumId!} setActiveView={changeView} navigateToArtist={navigateToArtist} showModal={showModal} hideModal={hideModal} />;
      case 'playlist':
        return <PlaylistView playlistId={selectedPlaylistId!} setActiveView={changeView} navigateToArtist={navigateToArtist} showModal={showModal} hideModal={hideModal} />;
      case 'api_playlist':
        return <ApiPlaylistView playlist={selectedApiPlaylist!} setActiveView={changeView} navigateToArtist={navigateToArtist} showModal={showModal} hideModal={hideModal} />;
      case 'artist':
        return <ArtistView artistId={selectedArtistId!} setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} />;
      default:
        return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} />;
    }
  };
  
  const highQualityImage = currentSong?.image?.find(img => img.quality === '500x500')?.url || currentSong?.image?.[0]?.url || '';

  return (
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

      {/* Changed to a flex-col layout to ensure sidebars touch the player */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Main content area that fills available space */}
        <div className="flex flex-1 overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={changeView} />
            <main className="flex-1 overflow-y-auto custom-scrollbar">
              {renderView()}
            </main>
            {isQueueOpen && <QueueSidebar navigateToArtist={navigateToArtist} />}
        </div>
        
        {/* Player with a fixed height */}
        <div className="z-20 shrink-0">
            <Player navigateToArtist={navigateToArtist} />
        </div>
      </div>
       <Modal
        isOpen={isModalOpen}
        onClose={() => {
            // The modal's internal state handles the closing animation
            hideModal();
            // Clear content after animation is finished in the modal itself if needed
            setTimeout(() => setModalContent(null), 300);
        }}
        title={modalContent?.title || ''}
        actions={modalContent?.actions}
      >
        {modalContent?.content}
      </Modal>
    </div>
  );
};


export default App;