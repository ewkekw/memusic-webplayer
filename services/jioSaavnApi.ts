

import { SearchSongsResponse, SearchAlbumsResponse, SearchArtistsResponse, SearchPlaylistsResponse, SongSuggestionsResponse, GetAlbumDetailsResponse, GetArtistDetailsResponse, GetSongsResponse, GetLyricsResponse } from '../types';

const API_BASE_URL = 'https://lowkey-backend.vercel.app';

const CACHE_LIMIT = 100;
const cache = new Map<string, any>();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<Response> => {
    try {
        const response = await fetch(url);
        if (!response.ok && (response.status >= 500 || response.status === 429)) {
             throw new Error(`Server/Network Error: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries === 0) throw error;
        await wait(delay);
        return fetchWithRetry(url, retries - 1, delay * 2);
    }
};

const apiRequest = async <T,>(endpoint: string, cacheKey?: string): Promise<T> => {
  if (cacheKey && cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    cache.delete(cacheKey);
    cache.set(cacheKey, cachedData);
    return Promise.resolve(cachedData as T);
  }

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    
    const data = await response.json() as T;
    
    if (cacheKey) {
        if (cache.size >= CACHE_LIMIT) {
            const firstKey = cache.keys().next().value;
            if (firstKey) cache.delete(firstKey);
        }
        cache.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    throw error;
  }
};

export const searchSongs = (query: string, page: number = 1, limit: number = 20) => apiRequest<SearchSongsResponse>(`/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
export const getSongsByIds = (ids: string[]) => apiRequest<GetSongsResponse>(`/api/songs?ids=${ids.join(',')}`);
export const searchAlbums = (query: string, page: number = 1, limit: number = 20) => apiRequest<SearchAlbumsResponse>(`/api/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
export const getAlbumDetails = (albumId: string) => apiRequest<GetAlbumDetailsResponse>(`/api/albums?id=${albumId}`, `album-${albumId}`);
export const getArtistDetails = (artistId: string) => apiRequest<GetArtistDetailsResponse>(`/api/artists?id=${artistId}`, `artist-${artistId}`);
export const searchArtists = (query: string, page: number = 1, limit: number = 20) => apiRequest<SearchArtistsResponse>(`/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
export const searchPlaylists = (query: string, page: number = 1, limit: number = 20) => apiRequest<SearchPlaylistsResponse>(`/api/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
export const getSongSuggestions = (songId: string, limit: number = 10) => apiRequest<SongSuggestionsResponse>(`/api/songs/${songId}/suggestions?limit=${limit}`);
export const getLyrics = (songId: string) => apiRequest<GetLyricsResponse>(`/api/songs/${songId}/lyrics`, `lyrics-${songId}`);
