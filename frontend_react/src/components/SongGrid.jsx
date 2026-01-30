import React from 'react';
import SongItem from './SongItem';

const SongGrid = ({ songs, songTagList, onSongClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 pt-4 pb-4">
      {songs.map((song) => (
        <SongItem
          key={song.song_id}
          song={song}
          songTagList={songTagList}
          onClick={() => onSongClick(song)}
        />
      ))}
      {songs.length === 0 && (
        <div className="col-span-full text-center text-gray-400 mt-12">
          {locale('song.no_matches')}
        </div>
      )}
    </div>
  );
};

export default SongGrid;