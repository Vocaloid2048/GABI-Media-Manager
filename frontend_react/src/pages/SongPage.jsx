import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDownload, FaArchive } from 'react-icons/fa';
import SongUploadPopup from '../components/SongUploadPopup';
import TagBar from '../components/TagBar';
import HoverNav from '../components/HoverNav';
import SongGrid from '../components/SongGrid';
import { generateDs } from '../utils/auth';
import { SongLanguageLabels, SongTagTypeEnum } from '../utils/songLang';

const SongPage = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagsData, setTagsData] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagBarVisible, setIsTagBarVisible] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchSongs();
    fetchTags();
  }, []);

  const fetchSongs = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);
      const response = await fetch(`/api/song`);

      const data = await response.json();
      if (data.retcode === 1) {
        setSongs(data.data);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);
      const response = await fetch(`/api/song/tags`);
      const data = await response.json();
      if (data.retcode === 1) {
        setTagsData(data.data);
      }
      console.log("Fetched tags data:", data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };


  const handleSongClick = (song) => {
    // Navigate to lyric page
    navigate(`/song/${song.song_id}`);
  };

  const handleDownloadLyrics = async (song) => {
    // Find the original song data
    const originalSong = songs.find(s => s.song_name === song.title);
    if (!originalSong) return;

    try {
      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);
      const response = await fetch(`/api/song/${originalSong.song_id}/download`, {
        headers: {
          'user_id': userId,
          'ds': ds
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${song.title}.pro`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('下載失敗');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('下載失敗');
    }
  };

  const handleMakeProBundle = (song) => {
    // TODO: Implement ProBundle creation
    alert('製作 ProBundle 功能即將推出');
  };

  const handleUploadSuccess = (newSong) => {
    setSongs(prev => [newSong, ...prev]);
  };

  const handleToggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleRefreshTags = () => {
    fetchTags();
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterClick = () => {
    setIsTagBarVisible(!isTagBarVisible);
  };

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.song_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      (song.song_tags && song.song_tags.some(tagId => selectedTags.includes(tagId)));
    return matchesSearch && matchesTags;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative p-6"
      >
        <div className="max-w-7xl mx-auto">
          <SongGrid songs={filteredSongs} songTagList={tagsData} onSongClick={handleSongClick} />
        </div>
      </div>

      <HoverNav
        onFilterClick={handleFilterClick}
        onSearch={handleSearch}
        filterCount={selectedTags.length}
        hasActiveSearch={searchTerm.length > 0}
      />

      {/* Upload Popup */}
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