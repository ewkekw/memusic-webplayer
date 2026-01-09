import React, { Component, useState, useContext, useEffect, ReactNode, useCallback, lazy, Suspense, ErrorInfo } from 'react';
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
import { CinematicBackground } from './components/layout/CinematicBackground';
import { ModalContext, Modal } from './context/ModalContext';
import { LyricsOverlay } from './components/views/LyricsOverlay';

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
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    let safeError: Error;
    if (error instanceof Error) {
        safeError = error;
    } else {
        try {
            safeError = new Error(JSON.stringify(error));
        } catch {
            safeError = new Error(String(error));
        }
        if (safeError.message === '{}' || safeError.message === '[object Object]') {
             safeError = new Error('An unknown error occurred (non-Error object thrown). Check console for details.');
        }
    }
    return { hasError: true, error: safeError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
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
        <div className="h-screen w-screen bg-[#121212] text-white flex flex-col items-center justify-center p-8 text-center font-sans glass-panel">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Application Error</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-md">Failed to load the app. Reloading or resetting usually fixes it.</p>
          <div className="flex flex-col sm:flex-row gap-4">
             <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-full bg-white/10 font-semibold hover:bg-white/20 transition-colors">
              Reload Page
            </button>
            <button onClick={this.handleReset} className="px-6 py-3 rounded-full bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] transition-colors shadow-lg shadow-orange-500/20">
              Reset App & Reload
            </button>
          </div>
           {this.state.error && (
            <details className="mt-10 text-left max-w-lg w-full bg-black/20 p-4 rounded-lg border border-white/5">
                <summary className="cursor-pointer text-gray-400">Error Details</summary>
                <pre className="mt-2 text-sm text-red-300 overflow-auto max-h-40 custom-scrollbar">
                    <code className="text-xs">{this.state.error.stack || this.state.error.message}</code>
                </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children || null;
  }
}

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
  
  const { currentSong, isPlaying, isQueueOpen, toggleQueue, isLyricsOpen, toggleLyrics } = useContext(PlayerContext);
  const { partyState, partyEndedMessage, clearPartyEndedMessage } = useContext(PartyContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title?: string; content: ReactNode; size?: 'md' | 'lg' | 'xl'; } | null>(null);
  const { t } = useTranslation();
  const [wasInParty, setWasInParty] = useState(false);

  useEffect(() => {
    if (partyState && !wasInParty) {
        setWasInParty(true);
        toggleQueue(true); 
    } else if (!partyState && wasInParty) {
        setWasInParty(false);
    }
  }, [partyState, wasInParty, toggleQueue]);

  const showModal = (content: { title?: string; content: ReactNode; size?: 'md' | 'lg' | 'xl' }) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const hideModal = () => setIsModalOpen(false);

  const navigate = useCallback((entry: Omit<HistoryEntry, 'key'>, replace = false) => {
    // Auto-close lyrics on navigation to ensure free flow
    if (isLyricsOpen) {
        toggleLyrics(false);
    }

    const currentEntry = history[historyIndex];
    const isSameView = currentEntry.view === entry.view && 
                       currentEntry.albumId === entry.albumId && 
                       currentEntry.playlistId === entry.playlistId && 
                       currentEntry.artistId === entry.artistId && 
                       currentEntry.apiPlaylist?.id === entry.apiPlaylist?.id && 
                       currentEntry.searchQuery === entry.searchQuery;

    if (!replace && isSameView) return;

    setNavDirection('forward');
    const newHistory = history.slice(0, historyIndex + (replace ? 0 : 1));
    const newEntry = { ...entry, key: uuidv4() };
    setHistory([...newHistory, newEntry]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex, isLyricsOpen, toggleLyrics]);

  const goBack = () => {
    if (historyIndex > 0) {
      if (isLyricsOpen) toggleLyrics(false);
      setNavDirection('backward');
      setHistoryIndex(i => i - 1);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      if (isLyricsOpen) toggleLyrics(false);
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
      case 'home': return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToSearch={navigateToSearch} navigateToApiPlaylist={navigateToApiPlaylist} navigateToPlaylist={navigateToPlaylist} />;
      case 'search': return <Search navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} initialQuery={currentViewEntry.searchQuery} />;
      case 'library': return <Library setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToPlaylist={navigateToPlaylist} navigateToArtist={navigateToArtist} navigateToApiPlaylist={navigateToApiPlaylist} />;
      case 'album': return <AlbumView albumId={currentViewEntry.albumId!} setActiveView={changeView} navigateToArtist={navigateToArtist} navigateToPlaylist={navigateToPlaylist} />;
      case 'playlist': return <PlaylistView playlistId={currentViewEntry.playlistId!} setActiveView={changeView} navigateToArtist={navigateToArtist} />;
      case 'api_playlist': return <ApiPlaylistView playlist={currentViewEntry.apiPlaylist!} setActiveView={changeView} navigateToArtist={navigateToArtist} />;
      case 'artist': return <ArtistView artistId={currentViewEntry.artistId!} setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} />;
      case 'settings': return <Settings />;
      default: return <Home setActiveView={changeView} navigateToAlbum={navigateToAlbum} navigateToArtist={navigateToArtist} navigateToSearch={navigateToSearch} navigateToApiPlaylist={navigateToApiPlaylist} navigateToPlaylist={navigateToPlaylist} />;
    }
  };
  
  const displayedSong = partyState ? partyState.currentSong : currentSong;
  const highQualityImage = displayedSong?.image?.find(img => img.quality === '500x500')?.url || displayedSong?.image?.[0]?.url || '';
  const partyEndedMessageText = partyEndedMessage ? t(partyEndedMessage.key, partyEndedMessage.replacements) : null;

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      <div className="relative h-screen w-screen overflow-hidden text-gray-200 font-sans selection:bg-[#fc4b08] selection:text-white">

        <CinematicBackground songImage={highQualityImage} isPlaying={isPlaying} />
        
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
          <div className="flex flex-1 overflow-hidden relative">
              <Sidebar activeView={currentViewEntry.view} setActiveView={changeView} navigateToPlaylist={navigateToPlaylist} />
              
              <div className="relative flex-1 flex flex-col overflow-hidden min-w-0">
                  <main className="flex-1 overflow-y-auto custom-scrollbar pb-36 md:pb-0 relative z-0">
                    <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader /></div>}>
                      <div key={currentViewEntry.key} className={animationClass} onAnimationEnd={() => setNavDirection(null)}>
                        {renderView()}
                      </div>
                    </Suspense>
                  </main>
                  <LyricsOverlay />
              </div>

              <div className={`flex-shrink-0 overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-white/5 glass-panel ${isQueueOpen ? 'w-96' : 'w-0'}`}>
                <QueueSidebar navigateToArtist={navigateToArtist} />
              </div>
          </div>
          
          <div className={`z-50 shrink-0 transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${displayedSong ? 'h-24 md:h-28' : 'h-0'}`}>
              <div className={`h-full transition-opacity duration-500 ${displayedSong ? 'opacity-100' : 'opacity-0'}`}>
                <Player navigateToArtist={navigateToArtist} />
              </div>
          </div>
           <BottomNavBar activeView={currentViewEntry.view} setActiveView={changeView} />
        </div>
        <EphemeralReactions />
        
        <Modal isOpen={isModalOpen} onClose={hideModal} title={modalContent?.title} size={modalContent?.size}>
          {modalContent?.content}
        </Modal>
        
        <Modal isOpen={!!partyEndedMessageText} onClose={clearPartyEndedMessage} title={t('modals.partyEnded.title')}>
          <p className="text-gray-300 mb-6">{partyEndedMessageText}</p>
          <div className="flex justify-end">
              <button onClick={clearPartyEndedMessage} className="px-6 py-2 rounded-full bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] transition-colors shadow-lg shadow-orange-500/20">{t('modals.partyEnded.ok')}</button>
          </div>
        </Modal>
      </div>
    </ModalContext.Provider>
  );
};

export default App;