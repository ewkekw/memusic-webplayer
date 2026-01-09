

export type View = 'home' | 'search' | 'library' | 'album' | 'playlist' | 'artist' | 'api_playlist' | 'settings';

// --- API Response Interfaces (unchanged) ---
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
    data: { total: number; start: number; results: Song[]; }
}
export interface SearchAlbumsResponse {
    success: boolean;
    data: { total: number; start: number; results: Album[]; }
}
export interface GetAlbumDetailsResponse {
    success: boolean;
    data: Album;
}
export interface SearchArtistsResponse {
    success: boolean;
    data: { total: number; start: number; results: Artist[]; }
}
export interface SearchPlaylistsResponse {
    success: boolean;
    data: { total: number; start: number; results: Playlist[]; }
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
export interface GetSongsResponse {
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
export interface GetLyricsResponse {
    success: boolean;
    data: {
        lyrics: string;
        snippet: string;
        copyright: string;
    }
}

// --- App State Interfaces for Consolidated Storage ---

export type PlayerContextTypeString = 'album' | 'playlist' | 'api_playlist' | 'artist' | 'song' | 'queue' | 'search' | 'library-songs' | 'party';

export interface EqSetting {
    gain: number;
}

export interface PlayerSettings {
  volume: number;
  selectedQuality: string;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  eqSettings: EqSetting[];
  isEqEnabled: boolean;
  is8DEnabled: boolean;
  isReverbEnabled: boolean;
  reverbMix: number;
}

export interface PlayerQueueState {
  currentQueue: Song[];
  currentIndex: number;
  contextType: PlayerContextTypeString | null;
  contextId: string | null;
  originalQueueUnshuffled: Song[] | null;
}

export interface ProfileData {
  name: string;
  imageUrl: string;
}

export interface MusicData {
  favoriteSongs: Song[];
  favoriteAlbums: Album[];
  playlists: LocalPlaylist[];
  history: Song[];
  playlistHistory: string[];
  favoriteApiPlaylists: Playlist[];
  favoriteArtists: Artist[];
}

export interface AppSettings {
    language: 'en' | 'pt';
    player: PlayerSettings;
}

export interface AppState {
    version: number;
    profile: ProfileData;
    settings: AppSettings;
    music: MusicData;
    playerQueue: PlayerQueueState;
    searchHistory: string[];
}

// --- Context Interfaces ---

export interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  selectedQuality: string;
  currentQuality: string | null;
  playbackRate: number; // Added for smooth party sync
  setPlaybackRate: (rate: number) => void; // Added for smooth party sync
  playSong: (song: Song, queue: Song[], playContext: { type: PlayerContextTypeString; id: string; }) => Promise<void>;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSelectedQuality: (quality: string) => void;
  playNext: () => void;
  playPrev: () => void;
  playRadio: (song: Song) => void;
  currentQueue: Song[];
  isQueueOpen: boolean;
  toggleQueue: (force?: boolean) => void;
  isLyricsOpen: boolean;
  toggleLyrics: (force?: boolean) => void;
  addSongNext: (song: Song) => void;
  addSongsToEnd: (songs: Song[]) => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  removeSongFromQueue: (songId: string) => void;
  moveSongInQueue: (songId: string, direction: 'top' | 'bottom') => void;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  analyser: AnalyserNode | null;
  is8DEnabled: boolean;
  toggle8D: () => void;
  eqSettings: EqSetting[];
  setEqGain: (bandIndex: number, gain: number) => void;
  resetEq: () => void;
  isEqEnabled: boolean;
  toggleEq: () => void;
  isReverbEnabled: boolean;
  toggleReverb: () => void;
  reverbMix: number;
  setReverbMix: (mix: number) => void;
  audioContext: AudioContext | null;
  contextType: PlayerContextTypeString | null;
  contextId: string | null;
  autoplayStartIndex: number | null;
  // New setters for import
  setIsShuffle: (shuffle: boolean) => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  setIsEqEnabled: (enabled: boolean) => void;
  setIs8DEnabled: (enabled: boolean) => void;
  setIsReverbEnabled: (enabled: boolean) => void;
  setAppState: (updater: (draft: AppState) => AppState) => void;
}

export interface UserMusicContextType {
  favoriteSongs: Song[];
  favoriteAlbums: Album[];
  playlists: LocalPlaylist[];
  history: Song[];
  playlistHistory: string[];
  favoriteApiPlaylists: Playlist[];
  favoriteArtists: Artist[];
  isFavoriteSong: (songId: string) => boolean;
  toggleFavoriteSong: (song: Song) => void;
  isFavoriteAlbum: (albumId: string) => boolean;
  toggleFavoriteAlbum: (album: Album) => void;
  isFavoriteApiPlaylist: (playlistId: string) => boolean;
  toggleFavoriteApiPlaylist: (playlist: Playlist) => void;
  isFavoriteArtist: (artistId: string) => boolean;
  toggleFavoriteArtist: (artist: Artist | FullArtist) => void;
  createPlaylist: (name: string, description: string, songs?: Song[]) => LocalPlaylist;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<LocalPlaylist>) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  addToHistory: (song: Song) => void;
  addToPlaylistHistory: (playlistId: string) => void;
  importData: (jsonString: string, mode: 'replace' | 'merge') => { success: boolean, messageKey: string };
  exportData: () => string;
}

export interface ProfileContextType {
  name: string;
  imageUrl: string;
  updateName: (name: string) => void;
  updateImage: (imageUrl: string) => void;
}

// --- Listening Party Types (unchanged) ---
export type PartyMode = 'dj' | 'collaborative';
export interface PartyParticipant { id: string; name: string; imageUrl: string; isHost: boolean; }
export interface PartyQueueSong extends Song { addedBy: string; }
export interface PartyReaction { id: string; emoji: string; senderId: string; }
export interface PartyState {
  partyId: string;
  hostId: string;
  mode: PartyMode;
  participants: PartyParticipant[];
  isPlaying: boolean;
  currentSong: Song | null;
  currentQueue: PartyQueueSong[];
  currentTime: number;
  lastSeekTime: number; 
  lastStateUpdate: number;
  hostPing: number;
  reactions: PartyReaction[];
}
export interface PartyContextType {
    partyState: PartyState | null;
    isHost: boolean;
    myId: string;
    startParty: (mode: PartyMode, onStatusUpdate?: (status: string) => void) => Promise<string>;
    joinParty: (partyId: string) => Promise<{success: boolean, messageKey: string, errorMessage?: string}>;
    leaveParty: () => void;
    endParty: () => void;
    seekPartyPlayer: (time: number) => void;
    togglePartyPlayer: () => void;
    playNextParty: () => void;
    playPrevParty: () => void;
    addSongToPartyQueue: (song: Song) => void;
    removeSongFromPartyQueue: (songId: string) => void;
    reorderPartyQueue: (oldIndex: number, newIndex: number) => void;
    sendReaction: (emoji: string) => void;
    partyEndedMessage: { key: string; replacements?: { [key: string]: string | number } } | null;
    clearPartyEndedMessage: () => void;
}
