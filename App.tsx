
import React, { useState, useContext, useEffect, ReactNode, createContext, useCallback, lazy, Suspense, ErrorInfo, Component } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/layout/Sidebar';
import { Player } from './components/layout/Player';
import { PlayerProvider, PlayerContext } from './context/PlayerContext';
import { UserMusicContext, UserMusicProvider } from './context/UserMusicContext';
import { View, Playlist, AppState } from './types';
import { QueueSidebar } from './components/layout/QueueSidebar';
import { Header } from './components/layout/Header';
import { Loader } from './components/ui/Loader';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { ProfileProvider } from './context/ProfileContext';
import { PartyProvider, PartyContext } from './context/PartyContext';
import { EphemeralReactions } from './components/party/EphemeralReactions';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { useStorage } from './hooks/useStorage';

const Home = lazy(() => import('./components/views/Home'));
const Search = lazy(() => import('./components/views/Search'));
const Library = lazy(() => import('./components/views/Library'));
const AlbumView = lazy(() => import('./components/views/AlbumView'));
const PlaylistView = lazy(() => import('./components/views/PlaylistView'));
const ArtistView = lazy(() => import('./components/views/ArtistView'));
const ApiPlaylistView = lazy(() => import('./components/views/ApiPlaylistView'));
const Settings = lazy(() => import('./components/views/Settings'));

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error and the component stack for better debugging
    console.error("Uncaught application error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    // It's also helpful to log the current state of localStorage
    console.log("LocalStorage content at time of error:", localStorage.getItem('memusic-v1-storage'));
  }

  handleReset = () => {
    try {
        localStorage.clear();
    } catch (e) {
        console.error("Failed to clear localStorage.", e);
    }
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#121212] text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Application Error</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-md">Failed to load the app. This might be due to corrupted data or a recent update. Reloading or resetting the app usually fixes it.</p>
          <div className="flex flex-col sm:flex-row gap-4">
             <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-white/10 font-semibold hover:bg-white/20 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 rounded-full bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] transition-colors"
            >
              Reset App & Reload
            </button>
          </div>
           {this.state.error && (
            <details className="mt-10 text-left max-w-lg w-full bg-black/20 p-4 rounded-lg">
                <summary className="cursor-pointer text-gray-400">Error Details</summary>
                <pre className="mt-2 text-sm text-red-300 overflow-auto max-h-40 custom-scrollbar">
                    <code className="text-xs">
                        {this.state.error.stack || this.state.error.toString()}
                    </code>
                </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

interface ModalContextType {
  showModal: (content: { title?: string; content: ReactNode; size?: 'md' | 'lg' | 'xl'; }) => void;
  hideModal: () => void;
}
export const ModalContext = createContext<ModalContextType>({} as ModalContextType);


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-out bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-[#282828] rounded-lg shadow-2xl p-6 w-full m-4 border border-white/10 text-white transform transition-all duration-300 ease-out animate-in fade-in zoom-in-95 ${ {md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl'}[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
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
    const [appState, setAppState] = useStorage();
  
    return (
      <LanguageProvider language={appState.settings.language} setAppState={setAppState}>
        <ProfileProvider profile={appState.profile} setAppState={setAppState}>
          <UserMusicProvider musicData={appState.music} setAppState={setAppState} fullState={appState}>
            <PlayerProvider playerSettings={appState.settings.player} playerQueue={appState.playerQueue} setAppState={setAppState}>
              <PartyProvider>
                <ErrorBoundary>
                  <MainApp searchHistory={appState.searchHistory} setAppState={setAppState} />
                </ErrorBoundary>
              </PartyProvider>
            </PlayerProvider>
          </UserMusicProvider>
        </ProfileProvider>
      </LanguageProvider>
    );
};
  
interface MainAppProps {
    searchHistory: string[];
    setAppState: (updater: (draft: AppState) => void) => void;
}

const MainApp: React.FC<MainAppProps> = ({ searchHistory, setAppState }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([{ key: uuidv4(), view: 'home' }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward' | null>(null);
  
  const { currentSong, isQueueOpen } = useContext(PlayerContext);
  const { partyState, partyEndedMessage, clearPartyEndedMessage } = useContext(PartyContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title?: string; content: ReactNode; size?: 'md' | 'lg' | 'xl'; } | null>(null);
  const { t } = useTranslation();

  const showModal = (content: { title?: string; content: ReactNode; size?: 'md' | 'lg' | 'xl' }) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const hideModal = () => setIsModalOpen(false);

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
  
  const displayedSong = partyState ? partyState.currentSong : currentSong;
  const highQualityImage = displayedSong?.image?.find(img => img.quality === '500x500')?.url || displayedSong?.image?.[0]?.url || '';
  
  const partyEndedMessageText = partyEndedMessage ? t(partyEndedMessage.key, partyEndedMessage.replacements) : null;

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
            setActiveView={changeView}
            searchHistory={searchHistory}
            setAppState={setAppState}
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
          
          <div className={`z-20 shrink-0 transition-[height] duration-300 ease-in-out ${displayedSong ? 'h-20 md:h-24' : 'h-0'}`}>
              <div className={`h-full transition-opacity duration-200 ${displayedSong ? 'opacity-100' : 'opacity-0'}`}>
                <Player navigateToArtist={navigateToArtist} />
              </div>
          </div>
           <BottomNavBar activeView={currentViewEntry.view} setActiveView={changeView} />
        </div>
        <EphemeralReactions />
        <Modal
          isOpen={isModalOpen}
          onClose={hideModal}
          title={modalContent?.title}
          size={modalContent?.size}
        >
          {modalContent?.content}
        </Modal>
        <Modal
          isOpen={!!partyEndedMessageText}
          onClose={clearPartyEndedMessage}
          title={t('modals.partyEnded.title')}
        >
          <p className="text-gray-300 mb-6">{partyEndedMessageText}</p>
          <div className="flex justify-end">
              <button onClick={clearPartyEndedMessage} className="px-4 py-2 rounded-md bg-[#fc4b08] text-black font-bold">{t('modals.partyEnded.ok')}</button>
          </div>
        </Modal>
      </div>
    </ModalContext.Provider>
  );
};


export default App;
