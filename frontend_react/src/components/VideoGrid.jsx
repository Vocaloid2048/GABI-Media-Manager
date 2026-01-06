import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const VideoItem = React.forwardRef(({ group }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const longPressTimer = React.useRef(null);
  const isLongPress = React.useRef(false);

  // Construct navigation path: {domain}/group/{group_id}
  const navPath = `/group/${group.group_id}`;

  const handleMouseDown = (e) => {
    // 禁用中鍵按下時的自動捲動 (Autoscroll) 功能
    if (e.button === 1) {
      e.preventDefault();
    }
    
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      window.open(navPath, '_blank');
    }, 600);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsHovered(false);
  };

  const handleClick = (e) => {
    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    navigate(navPath);
  };

  const handleAuxClick = (e) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      window.open(navPath, '_blank');
    }
  };

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
      className="group relative rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
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

      {/* Interaction Layer (Invisible Box) */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onAuxClick={handleAuxClick}
        onContextMenu={(e) => {
          if (isLongPress.current) e.preventDefault();
        }}
      />
    </motion.div>
  );
});

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
