import React, { useState } from 'react';
import { getSongTagListLocale, SongLanguageLabels } from '../utils/songLang';
import { useLanguage } from '../lang/LanguageContext';
import { generateSongThumbnail, formatCopyrightInfo } from '../utils/songUtils';

const SongItem = ({ song, songTagList, onClick }) => {
  const { locale, language } = useLanguage();
  const copyright = formatCopyrightInfo(song.song_copyright);
  const chipList = [
    ...getSongTagListLocale(song.song_tags, songTagList, language, locale),
    ...getSongTagListLocale(song.song_language, songTagList, language, locale)
  ];

  const thumbnail = generateSongThumbnail(song.song_name);
  const [imageError, setImageError] = useState(false);
  const [thumbnailQuality, setThumbnailQuality] = useState('maxresdefault');

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(song.song_ytlink);
  const youtubeThumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/${thumbnailQuality}.jpg` : null;

  const authorInfo = [
    copyright.composer,
    copyright.lyricist,
    copyright.arranger
  ].filter(Boolean);

  const uniqueAuthors = [...new Set(authorInfo)].join(', ');

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors flex gap-4 relative"
    >
      <div className='flex justify-center items-center'>
        {youtubeThumbnailUrl && !imageError ? (
          <img
            src={youtubeThumbnailUrl}
            alt={song.song_name}
            className="w-32 h-32 rounded-lg object-cover"
            onLoad={(e) => {
              // Check if it's a placeholder (small dimensions indicate placeholder)
              if (e.target.naturalWidth < 200 || e.target.naturalHeight < 200) {
                if (thumbnailQuality === 'maxresdefault') {
                  setThumbnailQuality('default');
                }
              }
            }}
            onError={() => {
              if (thumbnailQuality === 'maxresdefault') {
                setThumbnailQuality('default');
              } else {
                setImageError(true);
              }
            }}
          />
        ) : (
          <div
            className="w-32 h-32 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: thumbnail.backgroundColor }}
          >
            {thumbnail.initial}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-semibold text-white truncate">
          {song.song_name}
        </h3>

        <div className="flex flex-wrap gap-1 mb-2">
          {chipList.map((tag, index) => (
            <span
              key={`chip-${index}`}
              className="text-xs font-medium px-3 py-1 rounded-full text-black"
              style={{ backgroundColor: tag.color || '#777777' }}
            >
              {locale(tag.tag)}
            </span>
          ))}
        </div>

        {uniqueAuthors && (
          <div className="text-sm text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
            {locale('song.author_label')}{uniqueAuthors}
          </div>
        )}

        {copyright.publisher && (
          <div className="text-sm text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
            {locale('song.publisher_label')}{copyright.publisher}
          </div>
        )}

        <div className="text-sm text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
          {locale('song.upload_label')}{song.uploader_name || locale('song.unknown')}
        </div>
      </div>

    </div>
  );
};

export default SongItem;