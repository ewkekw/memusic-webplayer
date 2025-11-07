
import { SearchSongsResponse, SearchAlbumsResponse, SearchArtistsResponse, SearchPlaylistsResponse, SongSuggestionsResponse, GetAlbumDetailsResponse, GetArtistDetailsResponse, GetSongsResponse } from '../types';

const API_BASE_URL = 'https://lowkey-backend.vercel.app';

const apiRequest = async <T,>(endpoint: string): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const searchSongs = (query: string, page: number = 1, limit: number = 20): Promise<SearchSongsResponse> => {
    return apiRequest<SearchSongsResponse>(`/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
};

export const getSongsByIds = (ids: string[]): Promise<GetSongsResponse> => {
    return apiRequest<GetSongsResponse>(`/api/songs?ids=${ids.join(',')}`);
};

export const searchAlbums = (query: string, page: number = 1, limit: number = 20): Promise<SearchAlbumsResponse> => {
    return apiRequest<SearchAlbumsResponse>(`/api/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
};

export const getAlbumDetails = (albumId: string): Promise<GetAlbumDetailsResponse> => {
    return apiRequest<GetAlbumDetailsResponse>(`/api/albums?id=${albumId}`);
};

export const getArtistDetails = (artistId: string): Promise<GetArtistDetailsResponse> => {
    return apiRequest<GetArtistDetailsResponse>(`/api/artists?id=${artistId}`);
};

export const searchArtists = (query: string, page: number = 1, limit: number = 20): Promise<SearchArtistsResponse> => {
    return apiRequest<SearchArtistsResponse>(`/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
};

export const searchPlaylists = (query: string, page: number = 1, limit: number = 20): Promise<SearchPlaylistsResponse> => {
    return apiRequest<SearchPlaylistsResponse>(`/api/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
};

export const getSongSuggestions = (songId: string, limit: number = 10): Promise<SongSuggestionsResponse> => {
    return apiRequest<SongSuggestionsResponse>(`/api/songs/${songId}/suggestions?limit=${limit}`);
};