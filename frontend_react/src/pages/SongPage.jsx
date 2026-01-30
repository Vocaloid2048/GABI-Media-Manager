import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SongUploadPopup from '../components/SongUploadPopup';
import TagBar from '../components/TagBar';
import HoverNav from '../components/HoverNav';
import SongGrid from '../components/SongGrid';
import { useLanguage } from '../lang/LanguageContext';
import { useSongs, useSongTags } from '../hooks/useSongs';

const SongPage = () => {
  const navigate = useNavigate();
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagBarVisible, setIsTagBarVisible] = useState(false);
  const scrollContainerRef = useRef(null);

  const { locale } = useLanguage();
  const { songs, loading, addSong } = useSongs();
  const { tagsData, refetch: refetchTags } = useSongTags();

  const handleSongClick = (song) => {
    navigate(`/song/${song.song_id}`);
  };

  const handleUploadSuccess = (newSong) => {
    addSong(newSong);
  };

  const handleToggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleRefreshTags = () => {
    refetchTags();
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterClick = () => {
    setIsTagBarVisible(!isTagBarVisible);
  };

  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      const matchesSearch = song.song_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 ||
        (song.song_tags && song.song_tags.some(tagId => selectedTags.includes(tagId)));
      return matchesSearch && matchesTags;
    });
  }, [songs, searchTerm, selectedTags]);

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
            songs={filteredSongs}
            songTagList={tagsData}
            onSongClick={handleSongClick}
          />
        </div>
      </div>

      <HoverNav
        onFilterClick={handleFilterClick}
        onSearch={handleSearch}
        filterCount={selectedTags.length}
        hasActiveSearch={searchTerm.length > 0}
      />

      {isTagBarVisible && (
        <TagBar
          tags={tagsData}
          selectedTags={selectedTags}
          onTagToggle={handleToggleTag}
          onRefresh={handleRefreshTags}
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