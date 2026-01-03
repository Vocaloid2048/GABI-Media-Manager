import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VideoItem = ({ group }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Construct navigation path: {domain}/group/{group_id}
  // Assuming group has a unique name or index. Using id for now as fallback.
  const navPath = `/group/${group.group_id}`;

  return (
    <div 
      className="cursor-pointer group relative rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(navPath)}
    >
      <div className="aspect-video w-full bg-gray-900 relative">
        <img 
          src={`${(import.meta.env.VITE_API_BASE_URL || '')}/api/video/thumb?name=${group.group_thumb_name}${isHovered ? '_anim.webp' : '.webp'}`} 
          alt={group.group_title}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {/* Overlay info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-10">
          <h3 className="text-white font-bold text-sm truncate">{group.group_title}</h3>
          <div className="flex justify-between items-center mt-1">
             <p className="text-gray-300 text-xs truncate">{group.group_author}</p>
             <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-200">{'0'} Videos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoGrid = ({ groups }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pt-32 pb-24 ">
      {groups.map(group => (
        <VideoItem key={group.group_id} group={group} />
      ))}
    </div>
  );
};

export default VideoGrid;
