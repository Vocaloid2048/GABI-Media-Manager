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
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasFetchedRef = useRef(false);
  const currentFiltersRef = useRef({});

  const fetchSongs = async (filters = {}, force = false, append = false) => {
    const { search = '', tags = [], languages = [] } = filters;
    
    // Create query string
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tags.length > 0) params.append('tags', tags.join('|'));
    if (languages.length > 0) params.append('languages', languages.join('|'));
    if (append) {
      params.append('offset', offset.toString());
    }
    
    const queryString = params.toString();
    const url = `/api/song${queryString ? `?${queryString}` : ''}`;

    // If appending, don't use cache
    if (!append) {
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
    }

    try {
      if (!append) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const fetchPromise = fetch(url);
      if (!append) {
        songsPromise = fetchPromise;
      }

      const response = await fetchPromise;
      const data = await response.json();

      if (data.retcode === 1) {
        if (append) {
          const newSongs = [...filteredSongs, ...data.data];
          setFilteredSongs(newSongs);
          setSongs(newSongs); // Update all songs
          setOffset(prev => prev + 12); // Assuming limit is 12
          if (data.data.length < 12) {
            setHasMore(false);
          }
        } else {
          // Cache the result
          if (!songsCache) songsCache = {};
          songsCache[url] = data.data;
          setSongs(data.data); // Keep all songs for reference
          setFilteredSongs(data.data);
          setOffset(12);
          setHasMore(data.data.length >= 12);
        }
        currentFiltersRef.current = filters;
      } else {
        setError('Failed to fetch songs');
        if (!append) {
          setFilteredSongs([]); // Set to empty array on error
        }
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setError(error.message);
      if (!append) {
        setFilteredSongs([]); // Set to empty array on error
      }
    } finally {
      if (!append) {
        setLoading(false);
        songsPromise = null;
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSongs({}, true); // Force refresh on initial load
    }
  }, []);

  const addSong = (newSong) => {
    const updatedSongs = [newSong, ...songs];
    setSongs(updatedSongs);
    setFilteredSongs(updatedSongs); // Update filtered songs too
    songsCache = updatedSongs; // Update cache
  };

  const applyFilters = (filters) => {
    setOffset(0);
    setHasMore(true);
    fetchSongs(filters, true); // Force refresh with filters
  };

  const loadMore = () => {
    if (hasMore && !isLoadingMore && !loading) {
      fetchSongs(currentFiltersRef.current, false, true);
    }
  };

  return {
    songs: filteredSongs, // Return filtered songs instead of all songs
    allSongs: songs, // Keep reference to all songs
    loading,
    error,
    hasMore,
    isLoadingMore,
    refetch: () => fetchSongs({}, true), // Force refresh without filters
    addSong,
    applyFilters,
    loadMore
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