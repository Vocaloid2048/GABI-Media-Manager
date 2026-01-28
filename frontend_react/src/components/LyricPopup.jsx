import React from 'react';
import { SongLanguageLabels } from '../utils/songLang';

const LyricPopup = ({ lyric, onClose, onDownloadLyrics, onMakeProBundle }) => {
  if (!lyric) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{lyric.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tags */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">標籤</h3>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(lyric.tags) ? lyric.tags : []).map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Slides */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">歌詞分頁</h3>
            <div className="space-y-3">
              {(Array.isArray(lyric.slides) ? lyric.slides : []).map((slide) => (
                <div
                  key={slide.page}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {slide.page}
                    </span>
                    <span className="text-gray-300 text-sm">第 {slide.page} 頁 - {slide.tag}</span>
                  </div>
                  <p className="text-white leading-relaxed">{slide.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">版權資訊</h3>
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              {lyric.composer && (
                <div className="flex">
                  <span className="text-gray-400 w-16">作曲：</span>
                  <span className="text-white">{lyric.composer}</span>
                </div>
              )}
              {lyric.lyricist && (
                <div className="flex">
                  <span className="text-gray-400 w-16">填詞：</span>
                  <span className="text-white">{lyric.lyricist}</span>
                </div>
              )}
              {lyric.arranger && (
                <div className="flex">
                  <span className="text-gray-400 w-16">編曲：</span>
                  <span className="text-white">{lyric.arranger}</span>
                </div>
              )}
              {lyric.album && (
                <div className="flex">
                  <span className="text-gray-400 w-16">專輯：</span>
                  <span className="text-white">{lyric.album}</span>
                </div>
              )}
              {lyric.publisher && (
                <div className="flex">
                  <span className="text-gray-400 w-16">出版：</span>
                  <span className="text-white">{lyric.publisher}</span>
                </div>
              )}
              {lyric.year && (
                <div className="flex">
                  <span className="text-gray-400 w-16">年份：</span>
                  <span className="text-white">{lyric.year}</span>
                </div>
              )}
              {lyric.song_tags && lyric.song_tags.length > 0 && (
                <div className="flex">
                  <span className="text-gray-400 w-16">類別：</span>
                  <span className="text-white">{lyric.song_tags.join(', ')}</span>
                </div>
              )}
              {lyric.song_language && lyric.song_language.length > 0 && (
                <div className="flex">
                  <span className="text-gray-400 w-16">語言：</span>
                  <span className="text-white">{(Array.isArray(lyric.song_language) ? lyric.song_language : [lyric.song_language]).filter(Boolean).map(lang => SongLanguageLabels[lang] || lang).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={() => onDownloadLyrics(lyric)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            下載歌詞
          </button>
          <button
            onClick={() => onMakeProBundle(lyric)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            製作 ProBundle
          </button>
        </div>
      </div>
    </div>
  );
};

export default LyricPopup;