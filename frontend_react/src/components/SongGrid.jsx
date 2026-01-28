import React from 'react';
import SongItem from './SongItem';

const SongGrid = ({ songs, onSongClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {songs.map((song) => (
        <SongItem
          key={song.song_id}
          song={song}
          onClick={() => onSongClick(song)}
        />
      ))}
      {songs.length === 0 && (
        <div className="col-span-full text-center text-gray-400 mt-12">
          沒有找到匹配的詩歌
        </div>
      )}
    </div>
  );
};

export default SongGrid;