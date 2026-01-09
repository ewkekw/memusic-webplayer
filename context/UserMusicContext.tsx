

import React, { createContext, useCallback } from 'react';
import { Song, Album, LocalPlaylist, UserMusicContextType, Playlist, Artist, FullArtist, AppState, MusicData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { defaultAppState } from '../hooks/useStorage';

export const UserMusicContext = createContext<UserMusicContextType>({} as UserMusicContextType);

interface UserMusicProviderProps {
    children: React.ReactNode;
    musicData: MusicData;
    fullState: AppState;
    setAppState: (updater: (draft: AppState) => void) => void;
}

export const UserMusicProvider: React.FC<UserMusicProviderProps> = ({ children, musicData, fullState, setAppState }) => {
  const safeMusicData = (
    musicData &&
    Array.isArray(musicData.favoriteSongs) &&
    Array.isArray(musicData.favoriteAlbums) &&
    Array.isArray(musicData.playlists) &&
    Array.isArray(musicData.history)
  ) ? musicData : defaultAppState.music;
  
  const { favoriteSongs, favoriteAlbums, playlists, history, playlistHistory, favoriteApiPlaylists, favoriteArtists } = safeMusicData;

  const updateMusicData = (updater: (draft: MusicData) => void) => {
    setAppState(draft => {
        updater(draft.music);
    });
  };

  const isFavoriteSong = useCallback((songId: string) => favoriteSongs.some(s => s.id === songId), [favoriteSongs]);
  const toggleFavoriteSong = (song: Song) => {
    updateMusicData(draft => {
        const isFav = draft.favoriteSongs.some(s => s.id === song.id);
        if (isFav) draft.favoriteSongs = draft.favoriteSongs.filter(s => s.id !== song.id);
        else draft.favoriteSongs.unshift(song);
    });
  };

  const isFavoriteAlbum = useCallback((albumId: string) => favoriteAlbums.some(a => a.id === albumId), [favoriteAlbums]);
  const toggleFavoriteAlbum = (album: Album) => {
    updateMusicData(draft => {
        const isFav = draft.favoriteAlbums.some(a => a.id === album.id);
        if (isFav) draft.favoriteAlbums = draft.favoriteAlbums.filter(a => a.id !== album.id);
        else draft.favoriteAlbums.unshift(album);
    });
  };

  const isFavoriteApiPlaylist = useCallback((playlistId: string) => favoriteApiPlaylists.some(p => p.id === playlistId), [favoriteApiPlaylists]);
  const toggleFavoriteApiPlaylist = (playlist: Playlist) => {
    updateMusicData(draft => {
        const isFav = draft.favoriteApiPlaylists.some(p => p.id === playlist.id);
        if(isFav) draft.favoriteApiPlaylists = draft.favoriteApiPlaylists.filter(p => p.id !== playlist.id);
        else draft.favoriteApiPlaylists.unshift(playlist);
    });
  };

  const isFavoriteArtist = useCallback((artistId: string) => favoriteArtists.some(a => a.id === artistId), [favoriteArtists]);
  const toggleFavoriteArtist = (artist: Artist | FullArtist) => {
    const artistToStore: Artist = {
        id: artist.id, name: artist.name, role: 'role' in artist ? artist.role : artist.dominantType || artist.type,
        type: artist.type, image: artist.image, url: artist.url,
    };
    updateMusicData(draft => {
        const isFav = draft.favoriteArtists.some(a => a.id === artist.id);
        if (isFav) draft.favoriteArtists = draft.favoriteArtists.filter(a => a.id !== artist.id);
        else draft.favoriteArtists.unshift(artistToStore);
    });
  };

  const createPlaylist = (name: string, description: string, songs: Song[] = []): LocalPlaylist => {
    const newPlaylist: LocalPlaylist = { id: uuidv4(), name, description, songs };
    updateMusicData(draft => { draft.playlists.unshift(newPlaylist); });
    return newPlaylist;
  };
  
  const deletePlaylist = (playlistId: string) => {
    updateMusicData(draft => {
        draft.playlists = draft.playlists.filter(p => p.id !== playlistId);
        draft.playlistHistory = draft.playlistHistory.filter(id => id !== playlistId);
    });
  }
  
  const updatePlaylist = (playlistId: string, updates: Partial<LocalPlaylist>) => {
    updateMusicData(draft => {
        const index = draft.playlists.findIndex(p => p.id === playlistId);
        if (index > -1) draft.playlists[index] = { ...draft.playlists[index], ...updates };
    });
  }

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    updateMusicData(draft => {
        const playlist = draft.playlists.find(p => p.id === playlistId);
        if (playlist && !playlist.songs.some(s => s.id === song.id)) {
            playlist.songs.push(song);
        }
    });
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    updateMusicData(draft => {
        const playlist = draft.playlists.find(p => p.id === playlistId);
        if (playlist) playlist.songs = playlist.songs.filter(s => s.id !== songId);
    });
  };

  const addToHistory = (song: Song) => {
    updateMusicData(draft => {
      draft.history = [song, ...draft.history.filter(s => s.id !== song.id)].slice(0, 50);
    });
  };

  const addToPlaylistHistory = (playlistId: string) => {
    updateMusicData(draft => {
        draft.playlistHistory = [playlistId, ...draft.playlistHistory.filter(id => id !== playlistId)].slice(0, 10);
    });
  };
  
  const exportData = (): string => {
    return JSON.stringify(fullState, null, 2);
  };
  
  const importData = (jsonString: string, mode: 'replace' | 'merge'): { success: boolean, messageKey: string } => {
    try {
      const data: AppState = JSON.parse(jsonString);
      if (typeof data !== 'object' || data === null) {
        return { success: false, messageKey: 'settings.data.importInvalidFormat' };
      }
      
      setAppState(draft => {
        if (data.profile) draft.profile = { ...defaultAppState.profile, ...data.profile };
        if (data.settings) draft.settings = { ...defaultAppState.settings, ...data.settings };
        
        const musicData: Partial<MusicData> = data.music || {};
        if (mode === 'replace') {
            draft.music = { ...defaultAppState.music, ...musicData };
        } else {
            const mergeUniqueById = (prev: any[], incoming: any[] | undefined) => {
                if (!Array.isArray(incoming)) return prev;
                const existingIds = new Set(prev.map(item => item.id));
                const newItems = incoming.filter(item => item && item.id && !existingIds.has(item.id));
                return [...newItems, ...prev];
            };
            
            draft.music.favoriteSongs = mergeUniqueById(draft.music.favoriteSongs, musicData.favoriteSongs);
            draft.music.favoriteAlbums = mergeUniqueById(draft.music.favoriteAlbums, musicData.favoriteAlbums);
            draft.music.playlists = mergeUniqueById(draft.music.playlists, musicData.playlists);
            draft.music.favoriteApiPlaylists = mergeUniqueById(draft.music.favoriteApiPlaylists, musicData.favoriteApiPlaylists);
            draft.music.favoriteArtists = mergeUniqueById(draft.music.favoriteArtists, musicData.favoriteArtists);
            
            if (Array.isArray(musicData.history)) {
                const combined = [...musicData.history, ...draft.music.history];
                draft.music.history = combined.filter((song, index, self) => song && song.id && index === self.findIndex(s => s.id === song.id)).slice(0, 50);
            }
            if (Array.isArray(musicData.playlistHistory)) {
                draft.music.playlistHistory = [...new Set([...musicData.playlistHistory, ...musicData.playlistHistory])].slice(0, 10);
            }
        }
      });
      return { success: true, messageKey: mode === 'replace' ? "settings.data.importReplaceSuccess" : "settings.data.importMergeSuccess" };
    } catch(e: any) {
      console.error("Failed to import data", e);
      return { success: false, messageKey: 'settings.data.importParseError' };
    }
  };

  return (
    <UserMusicContext.Provider value={{
      favoriteSongs, favoriteAlbums, playlists, history, playlistHistory, favoriteApiPlaylists, favoriteArtists,
      isFavoriteSong, toggleFavoriteSong, isFavoriteAlbum, toggleFavoriteAlbum, isFavoriteApiPlaylist, toggleFavoriteApiPlaylist, isFavoriteArtist, toggleFavoriteArtist,
      createPlaylist, deletePlaylist, updatePlaylist, addSongToPlaylist, removeSongFromPlaylist,
      addToHistory, addToPlaylistHistory, importData, exportData
    }}>
      {children}
    </UserMusicContext.Provider>
  );
};