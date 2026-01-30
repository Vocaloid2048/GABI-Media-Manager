import { useState, useEffect, useRef } from 'react';

// Global cache to prevent duplicate fetches
let songsCache = null;
let tagsCache = null;
let songsPromise = null;
let tagsPromise = null;

export function useSongs() {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);

  const fetchSongs = async (filters = {}, force = false) => {
    const { search = '', tags = [], languages = [] } = filters;
    
    // Create query string
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tags.length > 0) params.append('tags', tags.join('|'));
    if (languages.length > 0) params.append('languages', languages.join('|'));
    
    const queryString = params.toString();
    const url = `/api/song${queryString ? `?${queryString}` : ''}`;

    // If we already have cached data for this query and not forcing refresh, use cache
    const cacheKey = url;
    if (songsCache && songsCache[cacheKey] && !force) {
      setFilteredSongs(songsCache[cacheKey]);
      setLoading(false);
      return;
    }

    // If there's already a fetch in progress, wait for it
    if (songsPromise && !force) {
      try {
        const data = await songsPromise;
        setFilteredSongs(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fetchPromise = fetch(url);
      songsPromise = fetchPromise;

      const response = await fetchPromise;
      const data = await response.json();

      if (data.retcode === 1) {
        // Cache the result
        if (!songsCache) songsCache = {};
        songsCache[cacheKey] = data.data;
        setSongs(data.data); // Keep all songs for reference
        setFilteredSongs(data.data);
      } else {
        setError('Failed to fetch songs');
        setFilteredSongs([]); // Set to empty array on error
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError(error.message);
      setFilteredSongs([]); // Set to empty array on error
    } finally {
      setLoading(false);
      songsPromise = null;
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSongs();
    }
  }, []);

  const addSong = (newSong) => {
    const updatedSongs = [newSong, ...songs];
    setSongs(updatedSongs);
    setFilteredSongs(updatedSongs); // Update filtered songs too
    songsCache = updatedSongs; // Update cache
  };

  const applyFilters = (filters) => {
    fetchSongs(filters, true); // Force refresh with filters
  };

  return {
    songs: filteredSongs, // Return filtered songs instead of all songs
    allSongs: songs, // Keep reference to all songs
    loading,
    error,
    refetch: () => fetchSongs({}, true), // Force refresh without filters
    addSong,
    applyFilters
  };
}

export function useSongTags() {
  const [tagsData, setTagsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);

  const fetchTags = async (force = false) => {
    // If we already have cached data and not forcing refresh, use cache
    if (tagsCache && !force) {
      setTagsData(tagsCache);
      setLoading(false);
      return;
    }

    // If there's already a fetch in progress, wait for it
    if (tagsPromise && !force) {
      try {
        const data = await tagsPromise;
        setTagsData(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fetchPromise = fetch('/api/song/tags');
      tagsPromise = fetchPromise;

      const response = await fetchPromise;
      const data = await response.json();

      if (data.retcode === 1) {
        tagsCache = data.data;
        setTagsData(data.data);
      } else {
        setError('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      tagsPromise = null;
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchTags();
    } else if (tagsCache) {
      // If already fetched elsewhere, use cached data
      setTagsData(tagsCache);
      setLoading(false);
    }
  }, []);

  return {
    tagsData,
    loading,
    error,
    refetch: () => fetchTags(true) // Force refresh
  };
}