import React from 'react';
import { SongLanguageLabels } from '../utils/songLang';

const SongItem = ({ song, onClick }) => {
  // Generate a simple text-based thumbnail
  const generateThumbnail = (songName) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const colorIndex = songName.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    const textColor = '#FFFFFF';

    return (
      <div
        className="w-full h-32 rounded-lg flex items-center justify-center text-white font-bold text-xl"
        style={{ backgroundColor }}
      >
        {songName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
    >
      {generateThumbnail(song.song_name)}
      <h3 className="text-lg font-semibold text-white mb-2 truncate mt-2">
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
      {song.song_language && song.song_language.length > 0 && (
        <div className="text-sm text-gray-400 mt-1 truncate">
          語言: {(Array.isArray(song.song_language) ? song.song_language : [song.song_language]).filter(Boolean).map(lang => SongLanguageLabels[lang] || lang).join(', ')}
        </div>
      )}
    </div>
  );
};

export default SongItem;