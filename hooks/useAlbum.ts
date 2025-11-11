import { useState, useEffect } from 'react';
import { Album } from '../types';
import { getAlbumDetails } from '../services/jioSaavnApi';

export const useAlbum = (albumId: string) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAlbumDetails(albumId);
        if (response.success) {
          setAlbum(response.data);
        } else {
          setError('Failed to fetch album details.');
        }
      } catch (err) {
        console.error("Failed to fetch album details:", err);
        setError('An error occurred while fetching album details.');
      } finally {
        setLoading(false);
      }
    };
    
    if (albumId) {
        fetchAlbum();
    } else {
        setLoading(false);
        setAlbum(null);
    }
  }, [albumId]);

  return { album, loading, error };
};
