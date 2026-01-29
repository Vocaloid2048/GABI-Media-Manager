import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaPen, FaShare } from 'react-icons/fa';
import TitleHeader from '../components/TitleHeader';
import TitleFooter from '../components/TitleFooter';
import { getSongTagListLocale, SongLanguageLabels, SongTagTypeEnum } from '../utils/songLang';
import { generateDs } from '../utils/auth';
import { useLanguage } from '../lang/LanguageContext';

const GROUP_LABEL_LIST = {
  "VERSE": { colorHex: "#0072C6", en: "Verse", zh_cn: "主歌", zh_hk: "主歌" },
  "VERSE1": { colorHex: "#0072C6", en: "Verse 1", zh_cn: "主歌1", zh_hk: "主歌1" },
  "VERSE2": { colorHex: "#0072C6", en: "Verse 2", zh_cn: "主歌2", zh_hk: "主歌2" },
  "VERSE3": { colorHex: "#0072C6", en: "Verse 3", zh_cn: "主歌3", zh_hk: "主歌3" },
  "VERSE4": { colorHex: "#0072C6", en: "Verse 4", zh_cn: "主歌4", zh_hk: "主歌4" },
  "VERSE5": { colorHex: "#005A9E", en: "Verse 5", zh_cn: "主歌5", zh_hk: "主歌5" },
  "VERSE6": { colorHex: "#002050", en: "Verse 6", zh_cn: "主歌6", zh_hk: "主歌6" },
  "CHORUS": { colorHex: "#D41243", en: "Chorus", zh_cn: "副歌", zh_hk: "副歌" },
  "CHORUS 1": { colorHex: "#D41243", en: "Chorus 1", zh_cn: "副歌1", zh_hk: "副歌1" },
  "CHORUS2": { colorHex: "#D41243", en: "Chorus 2", zh_cn: "副歌2", zh_hk: "副歌2" },
  "CHORUS3": { colorHex: "#5B0025", en: "Chorus 3", zh_cn: "副歌3", zh_hk: "副歌3" },
  "CHORUS4": { colorHex: "#D41243", en: "Chorus 4", zh_cn: "副歌4", zh_hk: "副歌4" },
  "BRIDGE": { colorHex: "#6F00FF", en: "Bridge", zh_cn: "桥段", zh_hk: "橋段" },
  "BRIDGE1": { colorHex: "#6F00FF", en: "Bridge 1", zh_cn: "桥段1", zh_hk: "橋段1" },
  "BRIDGE2": { colorHex: "#5000B8", en: "Bridge 2", zh_cn: "桥段2", zh_hk: "橋段2" },
  "BRIDGE3": { colorHex: "#300060", en: "Bridge 3", zh_cn: "桥段3", zh_hk: "橋段3" },
  "PRECHORUS": { colorHex: "#D41299", en: "PreChorus", zh_cn: "副歌预热", zh_hk: "副歌預熱" },
  "TAG": { colorHex: "#E71D36", en: "Tag", zh_cn: "标签", zh_hk: "標籤" },
  "INTRO": { colorHex: "#BCA922", en: "Intro", zh_cn: "前奏", zh_hk: "前奏" },
  "ENDING": { colorHex: "#BCA922", en: "Ending", zh_cn: "结尾", zh_hk: "結尾" },
  "OUTRO": { colorHex: "#8A7B15", en: "Outro", zh_cn: "结尾", zh_hk: "結尾" },
  "INTERLUDE": { colorHex: "#28C840", en: "Interlude", zh_cn: "间奏", zh_hk: "間奏" },
  "VAMP": { colorHex: "#28C840", en: "Vamp", zh_cn: "即兴伴奏", zh_hk: "即興伴奏" },
  "TURNAROUND": { colorHex: "#28C840", en: "Turnaround", zh_cn: "变调", zh_hk: "變調" },
  "BLANK": { colorHex: "#000000", en: "Blank", zh_cn: "空白", zh_hk: "空白" }
};

function mapTagToKey(tag) {
  if (!tag) return tag;
  const upperTag = tag.toUpperCase().replace(/\s+/g, '');
  if (GROUP_LABEL_LIST[upperTag]) return upperTag;
  // 支援中英文反查
  for (const [key, val] of Object.entries(GROUP_LABEL_LIST)) {
    if (
      tag === val.en ||
      tag === val.zh_cn ||
      tag === val.zh_hk ||
      tag.replace(/\s+/g, '') === val.en.replace(/\s+/g, '') ||
      tag.replace(/\s+/g, '') === val.zh_cn.replace(/\s+/g, '') ||
      tag.replace(/\s+/g, '') === val.zh_hk.replace(/\s+/g, '')
    ) {
      return key;
    }
  }
  return tag; // 若找不到則保留原名
}

const LyricPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);

  const [songTagsData, setSongTagsData] = useState([]);
  const { language, locale } = useLanguage();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        const ds = generateDs(userId);
        const response = await fetch(`/api/song/tags`);
        const data = await response.json();
        if (data.retcode === 1) {
          setSongTagsData(data.data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    const fetchSong = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        const ds = generateDs(userId);

        const response = await fetch(`/api/song/${id}`);

        if (response.ok) {
          const data = await response.json();
          if (data.retcode === 1) {
            const songData = data.data;

            // Parse tags (comma-separated string)
            const songTags = getSongTagListLocale(songData.song_tags, songTagsData, language, locale);
            // Parse language (comma-separated string)
            const songLanguage = getSongTagListLocale(songData.song_language, songTagsData, language, locale);
            // Parse copyright (JSON string)
            const songCopyright = JSON.parse(songData.song_copyright || '{}');

            setSong({
              ...songData,
              song_tags: songTags,
              song_language: songLanguage,
              song_copyright: songCopyright
            });
          }
        }
      } catch (error) {
        console.error('Error fetching song:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTags();
      fetchSong();
    }
  }, [id, songTagsData]);

  // 獲取Label的顯示名稱和顏色
  const getLabelDisplay = (label) => {
    const upperLabel = label ? label.toUpperCase().replace(/\s+/g, '') : '';
    return { colorHex: GROUP_LABEL_LIST[upperLabel].colorHex || '#777777', labelName: language === 'zh' ? (GROUP_LABEL_LIST[upperLabel].zh_hk || label) : (GROUP_LABEL_LIST[upperLabel].en || label) };
  };

  const handleDownloadLyrics = async () => {
    if (!song) return;

    try {
      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);
      const response = await fetch(`/api/song/${song.song_id}/download`, {
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
        a.download = `${song.song_name}.pro`;
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

  const handleMakeProBundle = () => {
    // TODO: Implement ProBundle creation
    alert('製作 ProBundle 功能開發中');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">歌曲不存在</div>
      </div>
    );
  }

  const copyright = song.song_copyright;
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <TitleHeader />

      {/* Main Content */}
      <div className="pt-16 pb-8"> {/* Account for fixed header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header with title and actions */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">{song.song_name}</h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={handleMakeProBundle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <FaPen size={16} />
                製作 .proBundle 檔案
              </button>
              <button
                onClick={handleDownloadLyrics}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <FaDownload size={16} />
                下載 .pro 檔案 (僅歌詞)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Song Info */}
            <div className="xl:col-span-1 space-y-6">
              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">標籤</h3>
                <div className="flex flex-wrap gap-2">
                  {[...song.song_tags, ...song.song_language].map((tag, index) => (
                    <span
                      key={index}
                      className="text-white px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Copyright */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">版權資訊</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {copyright.composer && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-sm mb-1">作曲</span>
                        <span className="text-white">{copyright.composer}</span>
                      </div>
                    )}
                    {copyright.lyricist && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-sm mb-1">填詞</span>
                        <span className="text-white">{copyright.lyricist}</span>
                      </div>
                    )}
                    {copyright.arranger && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-sm mb-1">編曲</span>
                        <span className="text-white">{copyright.arranger}</span>
                      </div>
                    )}
                    {copyright.album && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-sm mb-1">專輯</span>
                        <span className="text-white">{copyright.album}</span>
                      </div>
                    )}
                    {copyright.publisher && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-sm mb-1">出版</span>
                        <span className="text-white">{copyright.publisher}</span>
                      </div>
                    )}
                    {copyright.year && (
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-sm mb-1">年份</span>
                        <span className="text-white">{copyright.year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Lyrics Grid */}
            <div className="xl:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">歌詞分頁</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Array.isArray(song.content) ? song.content : []).map((slide) => {
                  const tagInfo = getLabelDisplay(slide.tag);
                  return (
                    <div
                      key={slide.page}
                      className="bg-gray-800 rounded-lg overflow-hidden"
                      style={{ border: `2px solid ${tagInfo.colorHex}` }}
                    >
                      {/* Page content */}
                      <div className="p-4 min-h-[200px] flex flex-col">
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-white leading-relaxed whitespace-pre-line text-center">
                            {slide.content}
                          </p>
                        </div>
                      </div>

                      {/* Bottom bar with page number and tag */}
                      <div
                        className="px-3 py-2 text-white text-sm font-medium flex justify-between items-center"
                        style={{ backgroundColor: tagInfo.colorHex }}
                      >
                        <span>{slide.page}</span>
                        <span>{tagInfo.labelName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TitleFooter />
    </div>
  );
};

export default LyricPage;