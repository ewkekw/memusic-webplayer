
interface LrcLibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

export const getSyncedLyrics = async (
  trackName: string,
  artistName: string,
  albumName: string,
  duration: number
): Promise<LrcLibResponse> => {
  try {
    const url = new URL('https://lrclib.net/api/get');
    url.searchParams.append('track_name', trackName);
    url.searchParams.append('artist_name', artistName);
    url.searchParams.append('album_name', albumName);
    url.searchParams.append('duration', duration.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Lyrics not found: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    try {
        const searchUrl = new URL('https://lrclib.net/api/search');
        searchUrl.searchParams.append('q', `${trackName} ${artistName}`);
        
        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) throw error;
        
        const searchData = await searchRes.json();
        const match = searchData.find((item: any) => Math.abs(item.duration - duration) < 5);
        
        if (match) return match;
        throw error;
    } catch (e) {
        throw e;
    }
  }
};
