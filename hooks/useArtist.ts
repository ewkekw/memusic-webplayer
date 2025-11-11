import { useState, useEffect } from 'react';
import { FullArtist } from '../types';
import { getArtistDetails } from '../services/jioSaavnApi';

export const useArtist = (artistId: string) => {
  const [artist, setArtist] = useState<FullArtist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      setLoading(true);
      setError(null);
      setArtist(null);
      try {
        const response = await getArtistDetails(artistId);
        if (response.success) {
          setArtist(response.data);
        } else {
          setError('Failed to fetch artist details.');
        }
      } catch (err) {
        console.error("Failed to fetch artist details:", err);
        setError('An error occurred while fetching artist details.');
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
        fetchArtist();
    } else {
        setLoading(false);
        setArtist(null);
    }
  }, [artistId]);

  return { artist, loading, error };
};
