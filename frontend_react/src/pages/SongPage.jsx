import React, { useState, useEffect, useRef } from 'react';
import { FaDownload, FaArchive } from 'react-icons/fa';
import LyricPopup from '../components/LyricPopup';
import SongUploadPopup from '../components/SongUploadPopup';
import TagBar from '../components/TagBar';
import HoverNav from '../components/HoverNav';
import SongGrid from '../components/SongGrid';
import { generateDs } from '../utils/auth';
import { SongLanguageLabels, SongTagTypeEnum } from '../utils/songLang';

const SongPage = () => {
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
      const response = await fetch(`/api/song`, {
        headers: {
          'user_id': userId,
          'ds': ds
        }
      });

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
      const response = await fetch(`/api/song/tags`, {
        headers: {
          'user_id': userId,
          'ds': ds
        }
      });
      const data = await response.json();
      if (data.retcode === 1) {
        setTagsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const getTagNames = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return [];
    return tagIds.map(id => {
      const tag = tagsData.find(t => t.tag_id === id);
      return tag ? tag.tag_zh_name : id;
    });
  };

  const handleSongClick = (song) => {
    // Format song data for LyricPopup
    const copyright = song.song_copyright || {};
    const formattedSong = {
      title: song.song_name,
      slides: song.content || [],
      composer: copyright.composer,
      lyricist: copyright.lyricist,
      arranger: copyright.arranger,
      album: copyright.album,
      publisher: copyright.publisher,
      year: copyright.year,
      song_tags: getTagNames(song.song_tags),
      song_language: song.song_language
    };
    setSelectedSong(formattedSong);
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
      <TagBar 
        tags={tagsData} 
        selectedTags={selectedTags} 
        onToggleTag={handleToggleTag} 
        onRefreshTags={handleRefreshTags} 
        isVisible={isTagBarVisible}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative p-6"
      >
        <div className="max-w-6xl mx-auto">
          <SongGrid songs={filteredSongs} onSongClick={handleSongClick} />
        </div>
      </div>

      <HoverNav
        onFilterClick={handleFilterClick}
        onSearch={handleSearch}
        filterCount={selectedTags.length}
        hasActiveSearch={searchTerm.length > 0}
      />

      {/* Lyric Popup */}
      {selectedSong && (
        <LyricPopup
          lyric={selectedSong}
          onClose={() => setSelectedSong(null)}
          onDownloadLyrics={handleDownloadLyrics}
          onMakeProBundle={handleMakeProBundle}
        />
      )}

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