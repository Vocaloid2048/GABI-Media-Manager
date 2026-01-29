import React from 'react';
import { getSongTagListLocale, SongLanguageLabels } from '../utils/songLang';
import { useLanguage } from '../lang/LanguageContext';

const SongItem = ({ song, songTagList, onClick }) => {
  console.log("songTagList in SongItem:", songTagList);
  const { locale, language } = useLanguage();
  const copyright = JSON.parse(song.song_copyright || '{}');
  const chipList = [...getSongTagListLocale(song.song_tags, songTagList, language, locale), ...getSongTagListLocale(song.song_language, songTagList, language, locale)];
  
  // Generate a simple text-based thumbnail
  const generateThumbnail = (songName) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const colorIndex = songName.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];

    return (
      <div
        className="w-32 h-32 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
        style={{ backgroundColor }}
      >
        {songName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors flex gap-4"
    >
      <div className='flex justify-center items-center'>
        {generateThumbnail(song.song_name)}
      </div>

      <div className="flex-1 min-w-0">
        {/* 歌名 */}
        <h3 className="text-xl font-semibold text-white truncate">
          {song.song_name}
        </h3>

        {/* 標籤和語言的chip row */}
        <div className="flex flex-wrap gap-1 mb-2">
          {/* 標籤 chips */}
          {chipList.map((tag, index) => (
            <div className="inline-block" key={`chip-${index}`}>
              <span
                className="text-xs font-medium px-3 py-1 rounded-full text-black"
                style={{ backgroundColor: chipList[index].color || '#777777' }}
              >
                {locale(chipList[index].tag)}
              </span>
            </div>
          ))}
        </div>

        {/* 作者信息 */}
        {(copyright?.composer || copyright?.lyricist || copyright?.arranger) && (
          <div className="text-sm text-gray-400 mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {locale('song.author_label')}{[
              copyright.composer && `${copyright.composer}`,
              copyright.lyricist && `${copyright.lyricist}`,
              copyright.arranger && `${copyright.arranger}`
            ].filter(Boolean).join('、')}
          </div>
        )}

        {/* 出版信息 */}
        {copyright?.publisher && (
          <div className="text-sm text-gray-400 mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {locale('song.publisher_label')}{copyright.publisher}
          </div>
        )}

        {/* 上載者信息 */}
        <div className="text-sm text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
          {locale('song.upload_label')}{song.uploader_name || locale('song.unknown')}
        </div>
      </div>
    </div>
  );
};

export default SongItem;