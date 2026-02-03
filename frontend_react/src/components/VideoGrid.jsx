import React from 'react';
import { AnimatePresence } from 'framer-motion';
import VideoItem from './VideoItem';

const VideoGrid = ({ groups }) => {
  return (
    <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pt-18 pb-4 ">
      <AnimatePresence mode="popLayout">
        {groups.map(group => (
          <VideoItem key={group.group_id} group={group} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default VideoGrid;
