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
  const { songs, loading, addSong, refetch: refetchSongs, applyFilters } = useSongs();
  const { tagsData, refetch: refetchTags } = useSongTags();

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