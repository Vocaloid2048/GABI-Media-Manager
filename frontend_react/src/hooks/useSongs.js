import { useState, useEffect } from 'react';

export function useSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/song');
      const data = await response.json();

      if (data.retcode === 1) {
        setSongs(data.data);
      } else {
        setError('Failed to fetch songs');
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const addSong = (newSong) => {
    setSongs(prev => [newSong, ...prev]);
  };

  return {
    songs,
    loading,
    error,
    refetch: fetchSongs,
    addSong
  };
}

export function useSongTags() {
  const [tagsData, setTagsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/song/tags');
      const data = await response.json();

      if (data.retcode === 1) {
        setTagsData(data.data);
      } else {
        setError('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return {
    tagsData,
    loading,
    error,
    refetch: fetchTags
  };
}