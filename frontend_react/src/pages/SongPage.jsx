import React, { useState, useEffect } from 'react';
import { FaPlus, FaDownload, FaArchive } from 'react-icons/fa';
import LyricPopup from '../components/LyricPopup';
import SongUploadPopup from '../components/SongUploadPopup';
import { API_URL } from '../config';
import { SongLanguageLabels } from '../utils/songLang';

const SongPage = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagsData, setTagsData] = useState([]);

  useEffect(() => {
    fetchSongs();
    fetchTags();
  }, []);

  const fetchSongs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/song`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/song/tag`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/song/${originalSong.song_id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  const filteredSongs = songs.filter(song =>
    song.song_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">詩歌管理</h1>
          <button
            onClick={() => setShowUploadPopup(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FaPlus />
            上載詩歌
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜尋詩歌..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Songs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSongs.map((song) => (
            <div
              key={song.song_id}
              onClick={() => handleSongClick(song)}
              className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2 truncate">
                {song.song_name}
              </h3>
              <div className="text-sm text-gray-400 mb-2">
                上載者: {song.uploader?.username || '未知'}
              </div>
              <div className="text-sm text-gray-400">
                分頁: {song.content ? song.content.length : 0} 頁
              </div>
              {(song.song_copyright?.composer) && (
                <div className="text-sm text-gray-400 mt-1 truncate">
                  作曲: {song.song_copyright.composer}
                </div>
              )}
              {song.song_tags && song.song_tags.length > 0 && (
                <div className="text-sm text-gray-400 mt-1 truncate">
                  類別: {getTagNames(song.song_tags).join(', ')}
                </div>
              )}
              {song.song_language && song.song_language.length > 0 && (
                <div className="text-sm text-gray-400 mt-1 truncate">
                  語言: {song.song_language.map(lang => SongLanguageLabels[lang] || lang).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSongs.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            {searchTerm ? '沒有找到匹配的詩歌' : '還沒有詩歌，點擊上載按鈕開始'}
          </div>
        )}

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
          />
        )}
      </div>
    </div>
  );
};

export default SongPage;