import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { generateDs } from '../utils/auth';
import { SongLanguageLabels, SongTagTypeEnum } from '../utils/songLang';
import { useLanguage } from '../lang/LanguageContext';

const SongUploadPopup = ({ onClose }) => {
  const { locale, language } = useLanguage();
  const [file, setFile] = useState(null);
  const [songName, setSongName] = useState("");
  const [composer, setComposer] = useState('');
  const [lyricist, setLyricist] = useState('');
  const [arranger, setArranger] = useState('');
  const [album, setAlbum] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [songTags, setSongTags] = useState([]);
  const [songLanguage, setSongLanguage] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [fullTagList, setFullTagList] = useState([]);

  // Use useRef for XHR to ensure immediate access without re-renders
  const xhrRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const fetchTags = async () => {
      try {
        const res = await fetch('/api/song/tags');
        const json = await res.json();
        if (mountedRef.current && json.retcode === 1 && Array.isArray(json.data)) {
          setFullTagList(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (xhrRef.current) {
        console.log('Unmounting: Aborting active upload');
        xhrRef.current.abort();
      }
    };
  }, []);

  const toggleSongTag = (tagId) => {
    setSongTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleSongLanguage = (language) => {
    setSongLanguage(prev =>
      prev.includes(language) ? prev.filter(l => l !== language) : [...prev, language]
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.pro')) {
        setFile(droppedFile);
      } else {
        alert(locale('pleaseDragProFile'));
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.pro')) {
        alert(locale('pleaseSelectProFile'));
        e.target.value = '';
        return;
      }
      if (selectedFile.size > 1024 * 1024) {
        alert(locale('fileSizeExceed'));
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {

    if (!songName.trim()) {
      alert(locale('pleaseEnterSongName'));
      return;
    }
    if (!file) {
      alert(locale('pleaseSelectFile'));
      return;
    }

    setUploading(true);
    try {
      // 讀取檔案內容為 base64
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);


      const payload = {
        song_name: songName,
        fileName: file.name,
        file: fileContent,
        song_copyright: {composer, lyricist, arranger, album, publisher, year},
        song_tags: songTags.join(','),
        song_language: songLanguage.join(',')
      };

      const response = await fetch(`/api/song/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_id': userId,
          'ds': ds
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.retcode === 1) {
        alert(locale('songUploadSuccess'));
        onClose();
        window.location.reload();
      } else {
        alert(locale('uploadFailed') + ': ' + data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(locale('uploadFailed') + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-gray-700 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header Section */}
        <div className="p-6 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6 sm:hidden"></div>

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">{locale('uploadSong')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2 pr-2 mr-1">
          {/* 新增詩歌名稱欄位 */}
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('songName')}
            </label>
            <input
              type="text"
              value={songName}
              onChange={e => setSongName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={locale('pleaseEnterSongName')}
              maxLength={100}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.composer')}
            </label>
            <input
              type="text"
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={locale('song.composer_placeholder')}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.lyricist')}
            </label>
            <input
              type="text"
              value={lyricist}
              onChange={(e) => setLyricist(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={locale('song.lyricist_placeholder')}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.arranger')}
            </label>
            <input
              type="text"
              value={arranger}
              onChange={(e) => setArranger(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={locale('song.arranger_placeholder')}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.album')}
            </label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={locale('song.album_placeholder')}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.publisher')}
            </label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={locale('song.publisher_placeholder')}
            />
          </div>

          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.year')}
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder={locale('song.year_placeholder')}
            />
          </div>

          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.language_label')}
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SongLanguageLabels).map(([value, langInfo]) => {
                const isSelected = songLanguage.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleSongLanguage(value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${isSelected
                      ? 'text-white border-transparent'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600'
                      }`}
                    style={isSelected ? { backgroundColor: langInfo.color } : {}}
                  >
                    {langInfo.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.category_label')}
            </label>
            <div className="space-y-6 pr-3">
              {Object.keys(SongTagTypeEnum).map((tagType) => (
                <div key={tagType}>
                  <h4 className="text-sm text-gray-400 mb-3 font-medium">{locale(SongTagTypeEnum[tagType].localeKey)}</h4>
                  <div className="flex flex-wrap gap-2">
                    {fullTagList.filter(tagItem => tagItem.tag_type === tagType).map(tag => {
                      return (
                        <button
                          key={tag.tag_id}
                          onClick={() => setSongTags(prev =>
                            prev.includes(tag.tag_id) ? prev.filter(id => id !== tag.tag_id) : [...prev, tag.tag_id]
                          )}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${songTags.includes(tag.tag_id)
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600'
                            }`}
                        >
                          {language === 'zh' ? tag.tag_zh_name : tag.tag_en_name}
                        </button>
                      );
                    })}
                  </div>

                </div>
              ))}

            </div>
          </div>
          {/* 將選擇 .pro 檔案移到最底 */}
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              {locale('song.select_pro_file')}
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${file ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-900/50 hover:bg-gray-900 hover:border-gray-500'}`}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('proFileInput').click()}
            >
              <FaCloudUploadAlt className={`text-4xl mb-3 ${file ? 'text-blue-400' : 'text-gray-500'}`} />
              <p className="text-gray-300 text-sm text-center font-medium">
                {file ? file.name : locale('song.drag_drop_pro')}
              </p>
              <input
                type="file"
                id="proFileInput"
                className="hidden"
                onChange={handleFileChange}
                accept=".pro"
              />
            </div>
          </div>
        </div>
        {/* Footer Section */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium">{locale('common.cancel')}</button>
          <button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className={`px-6 py-2 rounded-lg text-white font-medium text-sm transition-all shadow-lg ${
              !file || uploading 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {uploading ? locale('upload.uploading') : locale('common.confirm')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SongUploadPopup;