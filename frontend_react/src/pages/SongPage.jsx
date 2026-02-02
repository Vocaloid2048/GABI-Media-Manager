import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SongUploadPopup from '../components/SongUploadPopup';
import SongFilterPopup from '../components/SongFilterPopup';
import HoverNav from '../components/HoverNav';
import SongGrid from '../components/SongGrid';
import { useLanguage } from '../lang/LanguageContext';
import { useSongs, useSongTags } from '../hooks/useSongs';

const SongPage = () => {
  const navigate = useNavigate();
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isTagBarVisible, setIsTagBarVisible] = useState(false);
  const scrollContainerRef = useRef(null);

  const { locale } = useLanguage();
  const { songs, loading, hasMore, isLoadingMore, addSong, refetch: refetchSongs, applyFilters, loadMore } = useSongs();
  const { tagsData, refetch: refetchTags } = useSongTags();

  // Load saved filter options from localStorage on component mount
  React.useEffect(() => {
    const savedSongFilters = localStorage.getItem('songFilters');
    if (savedSongFilters) {
      try {
        const { tags, languages } = JSON.parse(savedSongFilters);
        setSelectedTags(tags || []);
        setSelectedLanguages(languages || []);
      } catch (error) {
        console.error('Failed to parse saved song filters:', error);
      }
    }
  }, []);

  // Infinite scroll logic
  React.useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      if (loading || isLoadingMore || !hasMore) return;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
        loadMore();
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [loading, isLoadingMore, hasMore, loadMore]);

  // Auto-fetch more if screen is not filled
  React.useEffect(() => {
    if (!loading && !isLoadingMore && hasMore && songs.length > 0) {
      const container = scrollContainerRef.current;
      if (container && container.scrollHeight < container.clientHeight + 100) {
        loadMore();
      }
    }
  }, [songs, loading, isLoadingMore, hasMore, loadMore]);

  const handleSongClick = (song) => {
    navigate(`/song/${song.song_id}`);
  };

  const handleUploadSuccess = (newSong) => {
    addSong(newSong);
  };

  const handleFilterApply = (newSelectedTags, newSelectedLanguages) => {
    setSelectedTags(newSelectedTags);
    setSelectedLanguages(newSelectedLanguages);
    setIsTagBarVisible(false);
    
    // Save filter options to localStorage
    localStorage.setItem('songFilters', JSON.stringify({
      tags: newSelectedTags,
      languages: newSelectedLanguages
    }));
    
    // Apply filters through backend
    applyFilters({
      tags: newSelectedTags,
      languages: newSelectedLanguages
    });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Apply search through backend
    applyFilters({
      search: term,
      tags: selectedTags,
      languages: selectedLanguages
    });
  };

  const handleFilterClick = () => {
    setIsTagBarVisible(!isTagBarVisible);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white">{locale('song.loading')}</div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative p-6"
      >
        <div className="max-w-[90rem] mx-auto">
          <SongGrid
            songs={songs}
            songTagList={tagsData}
            onSongClick={handleSongClick}
            isLoadingMore={isLoadingMore}
          />
        </div>
      </div>

      <HoverNav
        onFilterClick={handleFilterClick}
        onSearch={handleSearch}
        filterCount={selectedTags.length + selectedLanguages.length}
        hasActiveSearch={searchTerm.length > 0}
      />

      {isTagBarVisible && (
        <SongFilterPopup
          tagList={tagsData}
          selectedTags={selectedTags}
          selectedLanguages={selectedLanguages}
          onClose={() => setIsTagBarVisible(false)}
          onApply={handleFilterApply}
        />
      )}

      {showUploadPopup && (
        <SongUploadPopup
          onClose={() => setShowUploadPopup(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
};

export default SongPage;