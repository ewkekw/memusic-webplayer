

import React, { createContext, useCallback } from 'react';
import { Song, Album, LocalPlaylist, UserMusicContextType, Playlist, Artist, FullArtist } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';

export const UserMusicContext = createContext<UserMusicContextType>({} as UserMusicContextType);

export const UserMusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteSongs, setFavoriteSongs] = useLocalStorage<Song[]>('metromusic-fav-songs', []);
  const [favoriteAlbums, setFavoriteAlbums] = useLocalStorage<Album[]>('metromusic-fav-albums', []);
  const [playlists, setPlaylists] = useLocalStorage<LocalPlaylist[]>('metromusic-playlists', []);
  const [history, setHistory] = useLocalStorage<Song[]>('metromusic-history', []);
  const [playlistHistory, setPlaylistHistory] = useLocalStorage<string[]>('metromusic-playlist-history', []);
  const [favoriteApiPlaylists, setFavoriteApiPlaylists] = useLocalStorage<Playlist[]>('metromusic-fav-api-playlists', []);
  const [favoriteArtists, setFavoriteArtists] = useLocalStorage<Artist[]>('metromusic-fav-artists', []);


  const isFavoriteSong = useCallback((songId: string) => favoriteSongs.some(s => s.id === songId), [favoriteSongs]);
  const toggleFavoriteSong = (song: Song) => {
    if (isFavoriteSong(song.id)) {
      setFavoriteSongs(prev => prev.filter(s => s.id !== song.id));
    } else {
      setFavoriteSongs(prev => [song, ...prev]);
    }
  };

  const isFavoriteAlbum = useCallback((albumId: string) => favoriteAlbums.some(a => a.id === albumId), [favoriteAlbums]);
  const toggleFavoriteAlbum = (album: Album) => {
    if (isFavoriteAlbum(album.id)) {
      setFavoriteAlbums(prev => prev.filter(a => a.id !== album.id));
    } else {
      setFavoriteAlbums(prev => [album, ...prev]);
    }
  };

  const isFavoriteApiPlaylist = useCallback((playlistId: string) => favoriteApiPlaylists.some(p => p.id === playlistId), [favoriteApiPlaylists]);
  const toggleFavoriteApiPlaylist = (playlist: Playlist) => {
    if (isFavoriteApiPlaylist(playlist.id)) {
      setFavoriteApiPlaylists(prev => prev.filter(p => p.id !== playlist.id));
    } else {
      setFavoriteApiPlaylists(prev => [playlist, ...prev]);
    }
  };

  const isFavoriteArtist = useCallback((artistId: string) => favoriteArtists.some(a => a.id === artistId), [favoriteArtists]);
  const toggleFavoriteArtist = (artist: Artist | FullArtist) => {
    const artistToStore: Artist = {
        id: artist.id,
        name: artist.name,
        role: 'role' in artist ? artist.role : artist.dominantType || artist.type,
        type: artist.type,
        image: artist.image,
        url: artist.url,
    };
    if (isFavoriteArtist(artist.id)) {
      setFavoriteArtists(prev => prev.filter(a => a.id !== artist.id));
    } else {
      setFavoriteArtists(prev => [artistToStore, ...prev]);
    }
  };

  const createPlaylist = (name: string, description: string, songs: Song[] = []): LocalPlaylist => {
    const newPlaylist: LocalPlaylist = { id: uuidv4(), name, description, songs };
    setPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist;
  };
  
  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    setPlaylistHistory(prev => prev.filter(id => id !== playlistId));
  }
  
  const updatePlaylist = (playlistId: string, updates: Partial<LocalPlaylist>) => {
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, ...updates } : p));
  }

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId && !p.songs.some(s => s.id === song.id)) {
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    }));
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
      setPlaylists(prev => prev.map(p => {
          if (p.id === playlistId) {
              return { ...p, songs: p.songs.filter(s => s.id !== songId) };
          }
          return p;
      }));
  };

  const addToHistory = (song: Song) => {
    setHistory(prev => {
      const newHistory = [song, ...prev.filter(s => s.id !== song.id)];
      return newHistory.slice(0, 50);
    });
  };

  const addToPlaylistHistory = (playlistId: string) => {
    setPlaylistHistory(prev => {
        const newHistory = [playlistId, ...prev.filter(id => id !== playlistId)];
        return newHistory.slice(0, 10); // Keep history limited to 10 playlists
    });
  };
  
  const exportData = () => {
    const data = {
      favoriteSongs,
      favoriteAlbums,
      playlists,
      history,
      playlistHistory,
      favoriteApiPlaylists,
      favoriteArtists
    };
    return JSON.stringify(data, null, 2);
  };
  
  const importData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if(data.favoriteSongs) setFavoriteSongs(data.favoriteSongs);
      if(data.favoriteAlbums) setFavoriteAlbums(data.favoriteAlbums);
      if(data.playlists) setPlaylists(data.playlists);
      if(data.history) setHistory(data.history);
      if(data.playlistHistory) setPlaylistHistory(data.playlistHistory);
      if(data.favoriteApiPlaylists) setFavoriteApiPlaylists(data.favoriteApiPlaylists);
      if(data.favoriteArtists) setFavoriteArtists(data.favoriteArtists);
      return true;
    } catch(e) {
      console.error("Failed to import data", e);
      return false;
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