import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const VideoItem = React.forwardRef(({ group }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Construct navigation path: {domain}/group/{group_id}
  // Assuming group has a unique name or index. Using id for now as fallback.
  const navPath = `/group/${group.group_id}`;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={{ y: -5 }}
      transition={{
        layout: { type: "spring", bounce: 0, duration: 0.25 },
        opacity: { duration: 0.2 }
      }}
      className="cursor-pointer group relative rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(navPath)}
    >
      <div className="aspect-video w-full bg-gray-900 relative">
        <img
          src={`/api/video/thumb?name=${group.group_thumb_name}${isHovered ? '_anim.webp' : '.webp'}`}
          alt={group.group_title}
          className="w-full h-full object-cover transition-opacity"
        />
        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-10">
          <h3 className="text-white font-bold text-sm truncate">{group.group_title}</h3>
        </div>
      </div>
    </motion.div>
  );
});

const VideoGrid = ({ groups }) => {
  return (
    <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pt-32 pb-24 ">
      <AnimatePresence mode="popLayout">
        {groups.map(group => (
          <VideoItem key={group.group_id} group={group} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default VideoGrid;
