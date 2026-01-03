import React, { useState } from 'react';
import TitleHeader from '../components/TitleHeader';
import TagBar from '../components/TagBar';
import VideoGrid from '../components/VideoGrid';
import BottomNav from '../components/BottomNav';
import LoginPopup from '../components/LoginPopup';
import UploadPopup from '../components/UploadPopup';
import FilterPopup from '../components/FilterPopup';
import SearchPopup from '../components/SearchPopup';
import { AnimatePresence } from 'framer-motion';

const HomePage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const [tagsList, setTagsList] = useState(["Nature", "City", "Abstract", "Tech", "People", "Animals", "Space", "Dark", "Light", "Colorful", "Monochrome", "Vintage", "Modern"]);

  const [videoGroupData, setVideoGroupData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchWord, setSearchWord] = useState('');
  const [searchTags, setSearchTags] = useState([]);
  const isFetchingRef = React.useRef(false);
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);

  // Website initial data fetch

  // If scrolled to the bottom, load more videos (infinite scroll)
  React.useEffect(() => {
    const handleScroll = () => {
      if (isLoading || isFetchingRef.current || !hasMore) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        const newOffset = offset + 12;
        setOffset(newOffset);
        fetchVideoGroups(true, newOffset);
      }
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [offset, isLoading, hasMore]);

  // Auto-fetch more if screen is not filled
  React.useEffect(() => {
    if (!isLoading && !isFetchingRef.current && hasMore && videoGroupData.length > 0) {
      if (document.body.offsetHeight < window.innerHeight + 100) {
        const newOffset = offset + 12;
        setOffset(newOffset);
        fetchVideoGroups(true, newOffset);
      }
    }
  }, [videoGroupData, isLoading, hasMore, offset]);

  const toggleTag = (tag) => {
    let newTags = [...selectedTags];
    
    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag);
    } else {
      newTags.push(tag);
    }

    setSelectedTags(newTags);
  };

  async function fetchVideoGroups(keepPrevious = false, fetchOffset = 0, newSearchWord = null) {
    if (isLoading || isFetchingRef.current) return;
    if (keepPrevious && !hasMore) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    // Use newSearchWord if provided, otherwise use current searchWord state
    const currentSearchWord = newSearchWord !== null ? newSearchWord : searchWord;
    
    // Update searchTags based on selectedTags
    const currentSearchTags = selectedTags;
    setSearchTags(currentSearchTags);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      let url = `${API_BASE}/api/video/list?offset=${fetchOffset}`;
      
      if (currentSearchTags.length > 0) {
        url += `&tags=${currentSearchTags.join('|')}`;
      }
      
      if (currentSearchWord) {
        url += `&search=${encodeURIComponent(currentSearchWord)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        console.error('Network response was not ok', res.statusText);
        return;
      }

      const json = await res.json();
      if (json && json.retcode === 1) {
        const data = Array.isArray(json.data) ? json.data : [];
        
        if (data.length < 12) setHasMore(false);
        else setHasMore(true);

        setVideoGroupData(prevData => keepPrevious ? [...prevData, ...data] : data);
      } else {
        console.error('API error:', json && json.message ? json.message : json);
      }
    } catch (err) {
      console.error('Fetch failed', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }

  const handleSearch = (word) => {
    setSearchWord(word);
    setOffset(0);
    setHasMore(true);
    setVideoGroupData([]); // Clear existing data
    fetchVideoGroups(false, 0, word);
  };

  // initial load on mount
  React.useEffect(() => {
    fetchVideoGroups(false, 0);
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
      <TitleHeader isHomePage={true} />
      <TagBar tags={tagsList} selectedTags={selectedTags} onToggleTag={toggleTag} />
      
      <VideoGrid groups={videoGroupData} />
      
      <BottomNav 
        onFilterClick={() => setShowFilter(true)}
        onSearchClick={() => setShowSearch(true)}
        onUploadClick={() => setShowUpload(true)}
        showSearch={showSearch}
        onCloseSearch={() => setShowSearch(false)}
        onSearch={handleSearch}
      />

      <AnimatePresence>
        {showUpload && <UploadPopup onClose={() => setShowUpload(false)} />}
        {showFilter && <FilterPopup onClose={() => setShowFilter(false)} />}
        {showLogin && <LoginPopup onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
