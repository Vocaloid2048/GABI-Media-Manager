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
import TitleFooter from '../components/TitleFooter';

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
  const scrollContainerRef = React.useRef(null);

  // Website initial data fetch

  // If scrolled to the bottom, load more videos (infinite scroll)
  React.useEffect(() => {
    const handleScroll = () => {
      if (isLoading || isFetchingRef.current || !hasMore) return;
      const container = scrollContainerRef.current;
      if (!container) return;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
        const newOffset = offset + 12;
        setOffset(newOffset);
        fetchVideoGroups(true, newOffset);
      }
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
    }
    
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [offset, isLoading, hasMore]);

  // Auto-fetch more if screen is not filled
  React.useEffect(() => {
    if (!isLoading && !isFetchingRef.current && hasMore && videoGroupData.length > 0) {
      const container = scrollContainerRef.current;
      if (container && container.scrollHeight < container.clientHeight + 100) {
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
      let url = `/api/video/list?offset=${fetchOffset}`;
      
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
    <div className="bg-gray-900 h-[100dvh] flex flex-col text-white font-sans overflow-hidden">
      <TitleHeader isHomePage={true} />
      <TagBar tags={tagsList} selectedTags={selectedTags} onToggleTag={toggleTag} />
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative"
      >
        <VideoGrid groups={videoGroupData} />
      </div>
      
      <BottomNav 
        className="w-full z-50"
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
