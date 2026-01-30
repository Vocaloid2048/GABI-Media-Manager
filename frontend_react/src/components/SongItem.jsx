import React from 'react';
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

  const authorInfo = [
    copyright.composer,
    copyright.lyricist,
    copyright.arranger
  ].filter(Boolean).join('、');

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors flex gap-4 relative"
    >
      <div className='flex justify-center items-center'>
        <div
          className="w-32 h-32 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
          style={{ backgroundColor: thumbnail.backgroundColor }}
        >
          {thumbnail.initial}
        </div>
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

        {authorInfo && (
          <div className="text-sm text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
            {locale('song.author_label')}{authorInfo}
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