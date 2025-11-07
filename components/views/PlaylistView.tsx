
import React, { useState, useEffect, useContext } from 'react';
import { View, LocalPlaylist } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { PlaylistHeader } from './playlist/PlaylistHeader';
import { PlaylistTrackList } from './playlist/PlaylistTrackList';
import { PlaylistQuickAdd } from './playlist/PlaylistQuickAdd';
import { PlaylistRecommendations } from './playlist/PlaylistRecommendations';
import { usePreviewPlayer } from '../../hooks/usePreviewPlayer';

interface PlaylistViewProps {
  playlistId: string;
  setActiveView: (view: View) => void;
  navigateToArtist: (artistId: string) => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, setActiveView, navigateToArtist }) => {
  const [playlist, setPlaylist] = useState<LocalPlaylist | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { playlists } = useContext(UserMusicContext);
  const { previewingSongId, isPreviewPlaying, previewProgress, handlePreview } = usePreviewPlayer();

  useEffect(() => {
    const foundPlaylist = playlists.find(p => p.id === playlistId) || null;
    setPlaylist(foundPlaylist);
  }, [playlistId, playlists]);

  if (!playlist) {
    return <div className="p-8 text-center text-gray-400">Playlist not found. It may have been deleted.</div>;
  }

  return (
    <div className="text-white">
      <PlaylistHeader 
        playlist={playlist}
        setActiveView={setActiveView}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />
      
      <div className="px-4 sm:px-8 pb-8">
        <PlaylistTrackList 
          playlist={playlist}
          navigateToArtist={navigateToArtist}
        />
        
        <PlaylistRecommendations
            playlistId={playlist.id}
            playlistSongs={playlist.songs}
            navigateToArtist={navigateToArtist}
            previewingSongId={previewingSongId}
            isPreviewPlaying={isPreviewPlaying}
            previewProgress={previewProgress}
            handlePreview={handlePreview}
        />
      </div>

      <PlaylistQuickAdd
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        playlistId={playlist.id} 
        playlistSongs={playlist.songs} 
        navigateToArtist={navigateToArtist}
      />
    </div>
  );
};

export default PlaylistView;
