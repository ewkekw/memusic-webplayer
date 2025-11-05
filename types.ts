
export type View = 'home' | 'search' | 'library' | 'favorites' | 'album' | 'playlist' | 'artist' | 'api_playlist';

export interface ImageQuality {
  quality: string;
  url: string;
}

export interface AlbumInfo {
  id: string | null;
  name: string | null;
  url: string | null;
}

export interface ArtistInfo {
  id: string;
  name: string;
  role: string;
  type: string;
  image: ImageQuality[];
  url: string;
}

export interface Artists {
  primary: ArtistInfo[];
  featured: ArtistInfo[];
  all: ArtistInfo[];
}

export interface Song {
  id: string;
  name: string;
  type: string;
  year: string | null;
  releaseDate: string | null;
  duration: number | null;
  label: string | null;
  explicitContent: boolean;
  playCount: number | null;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string | null;
  album: AlbumInfo;
  artists: Artists;
  image: ImageQuality[];
  downloadUrl: ImageQuality[];
}

export interface Album {
    id: string;
    name: string;
    description: string;
    year: number | null;
    type: string;
    playCount: number | null;
    language: string;
    explicitContent: boolean;
    artists: Artists;
    songCount: number | null;
    url: string;
    image: ImageQuality[];
    songs: Song[] | null;
}

export interface Artist {
    id: string;
    name: string;
    role: string;
    type: string;
    image: ImageQuality[];
    url: string;
}

export interface Playlist {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    image: ImageQuality[];
    url: string;
    songCount: number | null;
    language: string;
    explicitContent: boolean;
    songs?: Song[] | null;
}


export interface SearchSongsResponse {
    success: boolean;
    data: {
        total: number;
        start: number;
        results: Song[];
    }
}

export interface SearchAlbumsResponse {
    success: boolean;
    data: {
        total: number;
        start: number;
        results: Album[];
    }
}

export interface GetAlbumDetailsResponse {
    success: boolean;
    data: Album;
}

export interface SearchArtistsResponse {
    success: boolean;
    data: {
        total: number;
        start: number;
        results: Artist[];
    }
}

export interface SearchPlaylistsResponse {
    success: boolean;
    data: {
        total: number;
        start: number;
        results: Playlist[];
    }
}

export interface LocalPlaylist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  coverUrl?: string;
}

export interface SongSuggestionsResponse {
  success: boolean;
  data: Song[];
}

export interface FullArtist {
    id: string;
    name: string;
    url: string;
    type: string;
    image: ImageQuality[];
    followerCount: number | null;
    fanCount: string | null;
    isVerified: boolean | null;
    dominantLanguage: string | null;
    dominantType: string | null;
    bio: { text: string | null, title: string | null }[] | null;
    dob: string | null;
    fb: string | null;
    twitter: string | null;
    wiki: string | null;
    availableLanguages: string[];
    isRadioPresent: boolean | null;
    topSongs: Song[] | null;
    topAlbums: Album[] | null;
    singles: Song[] | null;
    similarArtists: Artist[] | null;
}

export interface GetArtistDetailsResponse {
    success: boolean;
    data: FullArtist;
}

export interface UserMusicContextType {
  favoriteSongs: Song[];
  favoriteAlbums: Album[];
  playlists: LocalPlaylist[];
  history: Song[];
  favoriteApiPlaylists: Playlist[];
  isFavoriteSong: (songId: string) => boolean;
  toggleFavoriteSong: (song: Song) => void;
  isFavoriteAlbum: (albumId: string) => boolean;
  toggleFavoriteAlbum: (album: Album) => void;
  isFavoriteApiPlaylist: (playlistId: string) => boolean;
  toggleFavoriteApiPlaylist: (playlist: Playlist) => void;
  createPlaylist: (name: string, description: string, songs?: Song[]) => void;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<LocalPlaylist>) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  addToHistory: (song: Song) => void;
  importData: (data: string) => boolean;
  exportData: () => string;
}