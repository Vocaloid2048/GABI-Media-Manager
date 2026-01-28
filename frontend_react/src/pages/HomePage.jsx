import React, { useState } from 'react';
import TitleHeader from '../components/TitleHeader';
import BottomNav from '../components/BottomNav';
import UserPage from './UserPage';
import VideoPage from './VideoPage';
import SongPage from './SongPage';
import LoginPopup from '../components/LoginPopup';
import UploadPopup from '../components/UploadPopup';
import FilterPopup from '../components/FilterPopup';
import { COLOR_MAP } from '../components/ColorMapTable';
import SearchPopup from '../components/SearchPopup';
import { AnimatePresence } from 'framer-motion';
import SongUploadPopup from '../components/SongUploadPopup';

const HomePage = () => {
  const [currentPage, setCurrentPage] = useState('video'); // 'video', 'song', 'user'
  const [showLogin, setShowLogin] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showSongUpload, setShowSongUpload] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [tagsList, setTagsList] = useState([]);
  const [fullTagList, setFullTagList] = useState([]);

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
  const lastScrollTopRef = React.useRef(0);
  const [isTagBarVisible, setIsTagBarVisible] = useState(true);

  // Website initial data fetch
  React.useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/video/tags');
        const json = await res.json();
        if (json.retcode === 1 && Array.isArray(json.data)) {
          setFullTagList(json.data);

          const shuffled = json.data.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 15);

          setTagsList(selected);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }

    };

    fetchTags();
  }, []);

  // If scrolled to the bottom, load more videos (infinite scroll)
  React.useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      // TagBar visibility logic
      const currentScrollTop = container.scrollTop;
      if (currentScrollTop > lastScrollTopRef.current && currentScrollTop > 50) {
        setIsTagBarVisible(false);
      } else {
        setIsTagBarVisible(true);
      }
      lastScrollTopRef.current = currentScrollTop;

      if (isLoading || isFetchingRef.current || !hasMore) return;

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

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const handleRefreshTags = () => {
    if (fullTagList.length > 0) {
      // Reset selected tags
      setSelectedTags([]);
      const shuffled = fullTagList.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 15);
      setTagsList(selected);
    }
  };

  // Watch selectedTags for changes to trigger fetch
  React.useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setVideoGroupData([]);
    fetchVideoGroups(false, 0);
  }, [selectedTags]); 

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

      // Separate tags (IDs) and colors (Hex Strings)
      const apiTags = [];
      const apiColors = [];
      
      currentSearchTags.forEach(t => {
        if (typeof t === 'number') {
          apiTags.push(t);
        } else if (typeof t === 'string') {
          if (t.startsWith('#')) {
             apiColors.push(t);
          } else if (COLOR_MAP && COLOR_MAP[t]) {
             apiColors.push(COLOR_MAP[t].color);
          }
        }
      });

      if (apiTags.length > 0) {
        url += `&tags=${apiTags.join('|')}`;
      }

      if (apiColors.length > 0) {
        url += `&colors=${encodeURIComponent(apiColors.join('|'))}`;
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
    setCurrentPage('video');
    setSearchWord(word);
    setOffset(0);
    setHasMore(true);
    setVideoGroupData([]); // Clear existing data
    fetchVideoGroups(false, 0, word);
  };

  const handleApplyFilter = (newTags) => {
    setSelectedTags(newTags);
  };

  return (
    <div className="bg-gray-900 h-[100dvh] flex flex-col text-white font-sans overflow-hidden">
      <TitleHeader 
        isHomePage={true} 
        isRightButtonVisible={currentPage === 'song' || currentPage === 'video'} 
        onUploadClick={() => {
          switch (currentPage) {
          case 'song':
            setShowSongUpload(true);
            break;
          case 'video':
            setShowUpload(true);
          break;
        }
      }} />
      
      <div className="h-16 shrink-0" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentPage === 'video' && (
          <VideoPage
            tagsList={tagsList}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onRefreshTags={handleRefreshTags}
            isTagBarVisible={isTagBarVisible}
            videoGroupData={videoGroupData}
            onSearch={handleSearch}
            filterCount={selectedTags.length}
            hasActiveSearch={!!searchWord}
            onFilterClick={() => setShowFilter(true)}
            scrollContainerRef={scrollContainerRef}
          />
        )}
        {currentPage === 'song' && <SongPage />}
        {currentPage === 'user' && <UserPage />}
      </div>

      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />

      <AnimatePresence>
        {showSongUpload && <SongUploadPopup onClose={() => setShowSongUpload(false)} />}
        {showUpload && <UploadPopup onClose={() => setShowUpload(false)} />}
        {showFilter && <FilterPopup tagList={fullTagList} selectedTags={selectedTags} onClose={() => setShowFilter(false)} onApply={handleApplyFilter} />}
        {showLogin && <LoginPopup onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
