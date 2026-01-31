import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaPen, FaShare } from 'react-icons/fa';
import TitleHeader from '../components/TitleHeader';
import TitleFooter from '../components/TitleFooter';
import LyricItem from '../components/LyricItem';
import { getSongTagListLocale, SongLanguageLabels, SongTagTypeEnum } from '../utils/songLang';
import { generateDs } from '../utils/auth';
import { useLanguage } from '../lang/LanguageContext';
import { GROUP_LABEL_LIST, mapTagToKey } from '../constants/lyrics';
import { useLyricOptions } from '../hooks/useLyricOptions';

const LyricPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);

  const [songTagsData, setSongTagsData] = useState([]);
  const { language, locale } = useLanguage();
  const { spacing, setSpacing, addBlankPage, setAddBlankPage, selectedTheme, setSelectedTheme, labelLanguage, setLabelLanguage, addTitlePage, setAddTitlePage, showCopyright, setShowCopyright, copyrightLanguage, setCopyrightLanguage } = useLyricOptions();
  const [themes, setThemes] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`/api/song/tags`);
        const data = await response.json();
        if (data.retcode === 1) {
          setSongTagsData(data.data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    if (id && songTagsData.length === 0) {
      fetchTags();
    }
  }, [id, songTagsData.length]);

  useEffect(() => {
    const fetchSong = async () => {
      if (songTagsData.length === 0) return; // Wait for tags to be loaded

      try {
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

            // Generate CCLI info
            const authorParts = [];
            if (songCopyright.composer && songCopyright.composer.trim()) {
              authorParts.push(`作曲：${songCopyright.composer.trim()}`);
            }
            if (songCopyright.lyricist && songCopyright.lyricist.trim()) {
              authorParts.push(`填詞：${songCopyright.lyricist.trim()}`);
            }
            if (songCopyright.arranger && songCopyright.arranger.trim()) {
              authorParts.push(`編曲：${songCopyright.arranger.trim()}`);
            }

            const ccli = {
              songTitle: songData.song_name || '',
              author: authorParts.join('\n'),
              publisher: songCopyright.publisher || '',
              copyrightYear: songCopyright.year || ''
            };

            setSong({
              ...songData,
              song_tags: songTags,
              song_language: songLanguage,
              song_copyright: songCopyright,
              ccli: ccli
            });
          }
        }
      } catch (error) {
        console.error('Error fetching song:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id && songTagsData.length > 0) {
      fetchSong();
    }
  }, [id, songTagsData, language, locale]);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch('/api/song/themes');
        const data = await response.json();
        if (data.retcode === 1) {
          setThemes(data.data);
          // 如果沒有選擇主題或選擇的主題不在列表中，設置為第一個主題
          if (!selectedTheme || !data.data.includes(selectedTheme)) {
            setSelectedTheme(data.data[0] || '');
          }
        }
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };

    fetchThemes();
  }, []);

  // 獲取Label的顯示名稱和顏色
  const getLabelDisplay = (label) => {
    const upperLabel = label ? label.toUpperCase().replace(/\s+/g, '') : '';
    const groupInfo = GROUP_LABEL_LIST[upperLabel];
    if (!groupInfo) {
      return { colorHex: '#777777', labelName: label || 'Unknown' };
    }

    let labelName;
    switch (labelLanguage) {
      case 'zh_cn':
        labelName = groupInfo.zh_cn || groupInfo.en || label;
        break;
      case 'en':
        labelName = groupInfo.en || label;
        break;
      case 'zh_hk':
      default:
        labelName = groupInfo.zh_hk || groupInfo.en || label;
        break;
    }

    return { colorHex: groupInfo.colorHex, labelName };
  };

  // 提取 YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 處理內容根據選項
  const processedContent = React.useMemo(() => {
    if (!song?.content || !Array.isArray(song.content)) return [];

    let content = song.content.map(slide => ({
      ...slide,
      content: slide.content.replace("\t", " ").replace(/ /g, (spacing === 'tab' ? '\t' : " ".repeat(parseInt(spacing) || 1)))
    }));

    // 如果添加首頁，但第一個不是標題頁，則插入標題頁
    if (addTitlePage && (!content[0] || !content[0].is_title)) {
      content.unshift({
        is_title: true,
        content: song.song_name || "Title",
        tag: 'TAG'
      });
    }

    // 如果不添加首頁，過濾掉標題頁
    if (!addTitlePage) {
      content = content.filter(slide => !slide.is_title);
    }

    // 重新分配頁數
    content = content.map((slide, index) => ({
      ...slide,
      page: index + 1
    }));

    if (addBlankPage) {
      content.push({
        page: content.length + 1,
        tag: 'BLANK',
        content: ''
      });
    }

    return content;
  }, [song?.content, song?.song_name, spacing, addBlankPage, addTitlePage]);

  // 生成 CCLI 資訊根據版權語言
  const ccliInfo = React.useMemo(() => {
    if (!song?.song_copyright) return null;

    const copyright = song.song_copyright;
    const authorParts = [];

    const labels = {
      composer: { en: "Composer: ", zh_cn: "作曲：", zh_hk: "作曲：" },
      lyricist: { en: "Lyricist: ", zh_cn: "填词：", zh_hk: "填詞：" },
      arranger: { en: "Arranger: ", zh_cn: "编曲：", zh_hk: "編曲：" }
    };

    if (copyright.composer && copyright.composer.trim()) {
      authorParts.push(`${labels.composer[copyrightLanguage] || labels.composer.en}${copyright.composer.trim()}`);
    }
    if (copyright.lyricist && copyright.lyricist.trim()) {
      authorParts.push(`${labels.lyricist[copyrightLanguage] || labels.lyricist.en}${copyright.lyricist.trim()}`);
    }
    if (copyright.arranger && copyright.arranger.trim()) {
      authorParts.push(`${labels.arranger[copyrightLanguage] || labels.arranger.en}${copyright.arranger.trim()}`);
    }

    return {
      songTitle: song.song_name || '',
      author: authorParts.join('\n'),
      publisher: copyright.publisher || '',
      copyrightYear: copyright.year || ''
    };
  }, [song?.song_copyright, song?.song_name, copyrightLanguage]);

  const handleDownloadLyrics = async () => {
    if (!song) return;

    try {
      const userId = localStorage.getItem('user_id');
      const ds = generateDs(userId);
      const response = await fetch(`/api/song/${song.song_id}/download?spacing=${spacing}&addBlankPage=${addBlankPage}&theme=${selectedTheme + "_Theme"}&labelLanguage=${labelLanguage}&addTitlePage=${addTitlePage}&showCopyright=${showCopyright}&copyrightLanguage=${copyrightLanguage}&user_id=${userId}&ds=${encodeURIComponent(ds)}`);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${song.song_name}.pro`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(locale('song.download_failed'));
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(locale('song.download_failed'));
    }
  };

  const handleMakeProBundle = () => {
    // TODO: Implement ProBundle creation
    alert(locale('song.bundle_coming_soon'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">{locale('song.loading')}</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">{locale('song.not_found')}</div>
      </div>
    );
  }

  const copyright = song.song_copyright || {};

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <TitleHeader onBack={() => navigate('/songs')} />

      {/* Main Content */}
      <div className="pt-16 pb-8"> {/* Account for fixed header */}
        <div className="max-w-[90rem] mx-auto px-6 py-8">
          {/* Header with title and actions */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold">{song.song_name}</h1>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={handleMakeProBundle}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <FaPen size={16} />
                  {locale('song.make_bundle')}
                </button>
                <button
                  onClick={handleDownloadLyrics}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <FaDownload size={16} />
                  {locale('song.download_lyrics')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Song Info */}
            <div className="xl:col-span-1 space-y-6">
              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{locale('song.tags')}</h3>
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
                <h3 className="text-lg font-semibold text-white mb-2">{locale('song.copyright_info')}</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1">{locale('song.composer')}</span>
                      <span className="text-white">{copyright.composer || "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1">{locale('song.lyricist')}</span>
                      <span className="text-white">{copyright.lyricist || "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1">{locale('song.arranger')}</span>
                      <span className="text-white">{copyright.arranger || "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1">{locale('song.album')}</span>
                      <span className="text-white">{copyright.album || "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1">{locale('song.publisher')}</span>
                      <span className="text-white">{copyright.publisher || "--"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm mb-1">{locale('song.year')}</span>
                      <span className="text-white">{copyright.year || "--"}</span>
                    </div>
                    {/** YouTube Link + iFrame */}
                    <div className="flex flex-col col-span-2">
                      <span className="text-gray-400 text-sm mb-1">{locale('song.youtube_link')}</span>
                      {song?.song_ytlink && getYouTubeVideoId(song.song_ytlink) && (<div className="aspect-video">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(song.song_ytlink)}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg"
                        ></iframe>
                      </div>) || <span className="text-white">{"--"}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Lyrics Grid */}
            <div className="xl:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">{locale('lyrics.pages')}</h3>
              </div>


              {/* Options */}
              <div className="p-4 bg-gray-800 rounded-lg mb-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-white">{locale('lyrics.spacing')}</label>
                    <select
                      value={spacing}
                      onChange={(e) => setSpacing(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-1 rounded"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="tab">Tab</option>
                    </select>
                  </div>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <label className="text-white">{locale('lyrics.theme')}</label>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-1 rounded"
                    >
                      {themes.map((theme) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <label className="text-white">{locale('lyrics.label_language')}</label>
                    <select
                      value={labelLanguage}
                      onChange={(e) => setLabelLanguage(e.target.value)}
                      className="bg-gray-700 text-white px-3 py-1 rounded"
                    >
                      <option value="zh_cn">簡體中文</option>
                      <option value="zh_hk">繁體中文</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="addBlankPage"
                      checked={addBlankPage}
                      onChange={(e) => setAddBlankPage(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="addBlankPage" className="text-white">{locale('lyrics.add_blank_page')}</label>
                  </div>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="addTitlePage"
                      checked={addTitlePage}
                      onChange={(e) => setAddTitlePage(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="addTitlePage" className="text-white">{locale('lyrics.add_title_page')}</label>
                  </div>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showCopyright"
                      checked={showCopyright}
                      onChange={(e) => setShowCopyright(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="showCopyright" className="text-white">{locale('lyrics.show_copyright')}</label>
                  </div>
                  <div className="w-px h-6 bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <label className="text-white">{locale('lyrics.copyright_language')}</label>
                    <select
                      value={copyrightLanguage}
                      onChange={(e) => setCopyrightLanguage(e.target.value)}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                    >
                      <option value="zh_cn">簡體中文</option>
                      <option value="zh_hk">繁體中文</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedContent.map((slide) => {
                  const tagInfo = getLabelDisplay(slide.tag);

                  return (
                    <LyricItem
                      key={slide.page}
                      slide={slide}
                      tagInfo={tagInfo}
                      ccli={ccliInfo}
                      isTitlePage={slide.is_title && addTitlePage}
                      showCopyright={showCopyright}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TitleFooter />
    </div>
  )
};

export default LyricPage;