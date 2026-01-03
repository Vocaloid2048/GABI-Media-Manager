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
  
  const [tagsList, setTagsList] = useState(["All", "Nature", "City", "Abstract", "Tech", "People", "Animals", "Space", "Dark", "Light", "Colorful", "Monochrome", "Vintage", "Modern"]);

  const [videoGroupData, setVideoGroupData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [searchWord, setSearchWord] = useState('');
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedTags, setSelectedTags] = useState(['All']);

  // Website initial data fetch

  // If scrolled to the bottom, load more videos (infinite scroll)
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        const newOffset = offset + 12;
        setOffset(newOffset);
        fetchVideoGroups(true, newOffset);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTag = (tag) => {
    if (tag === 'All') {
      setSelectedTags(['All']);
      return;
    }
    
    let newTags = selectedTags.includes('All') ? [] : [...selectedTags];
    
    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag);
    } else {
      newTags.push(tag);
    }

    if (newTags.length === 0) newTags = ['All'];
    setSelectedTags(newTags);
  };

  async function fetchVideoGroups(keepPrevious = false, fetchOffset = 0) {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${API_BASE}/api/video/list?offset=${fetchOffset}${tagsList.length > 0 ? "&tags=" + tagsList.join('|') : ''}`;
      console.log('Fetching video groups:', url);
      const res = await fetch(url);
      if (!res.ok) {
        console.error('Network response was not ok', res.statusText);
        return;
      }
      const json = await res.json();
      if (json && json.retcode === 1) {
        const data = Array.isArray(json.data) ? json.data : [];
        setVideoGroupData(prevData => keepPrevious ? [...prevData, ...data] : data);
      } else {
        console.error('API error:', json && json.message ? json.message : json);
      }
    } catch (err) {
      console.error('Fetch failed', err);
    }
  }

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
      />

      <AnimatePresence>
        {showUpload && <UploadPopup onClose={() => setShowUpload(false)} />}
        {showFilter && <FilterPopup onClose={() => setShowFilter(false)} />}
        {showSearch && <SearchPopup onClose={() => setShowSearch(false)} />}
        {showLogin && <LoginPopup onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
