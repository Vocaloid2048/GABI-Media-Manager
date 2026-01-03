import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import TitleHeader from '../components/TitleHeader';
import { FaDownload, FaPlay, FaInfoCircle } from 'react-icons/fa';

const VideoItem = ({ video }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      className="cursor-pointer rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video w-full bg-gray-900 relative">
        <img 
          src={isHovered ? video.gif : video.thumb} 
          alt={video.title}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <FaPlay className="text-white/80 text-2xl drop-shadow-lg" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium truncate text-gray-200">{video.title}</h4>
      </div>
    </div>
  );
};

const DetailPage = () => {
  const { id } = useParams();
  const [isHovered, setIsHovered] = useState(false);

  // Mock Data based on ID
  const group = {
    title: `Cinematic Masterpiece Collection #${id}`,
    desc: "Experience the ultimate visual journey with this curated collection of high-fidelity footage. Perfect for creative projects, background visuals, or pure aesthetic enjoyment. Includes various lighting conditions and camera angles.",
    author: "VisualArtist_Pro",
    thumb: `https://picsum.photos/seed/${id}/800/450`,
    gif: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif",
    info: {
      format: "MP4 / MOV",
      fps: "60 / 120",
      resolution: "3840x2160 (4K)",
      codec: "ProRes 422 / H.265"
    },
    videos: Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      thumb: `https://picsum.photos/seed/${id}_${i}/400/225`,
      gif: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp4eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eXJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif",
      title: `Sequence_0${i + 1}_Final_Cut`
    }))
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-10 font-sans">
      <TitleHeader />
      
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Thumbnail */}
          <div 
            className="w-full lg:w-7/12 aspect-video bg-gray-800 rounded-2xl overflow-hidden relative shadow-2xl border border-gray-700 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img 
              src={isHovered ? group.gif : group.thumb} 
              alt={group.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
              <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full border border-white/10">
                <FaPlay className="text-4xl text-white pl-1" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="w-full lg:w-5/12 flex flex-col">
            <div className="mb-1">
              <span className="text-blue-400 text-xs font-bold tracking-wider uppercase bg-blue-500/10 px-2 py-1 rounded">Premium Collection</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{group.title}</h1>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">VA</div>
              <p className="text-gray-300 text-sm font-medium">{group.author}</p>
            </div>
            
            <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base">{group.desc}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Format</span>
                <span className="text-gray-200 font-mono text-sm">{group.info.format}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Frame Rate</span>
                <span className="text-gray-200 font-mono text-sm">{group.info.fps}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Resolution</span>
                <span className="text-gray-200 font-mono text-sm">{group.info.resolution}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Codec</span>
                <span className="text-gray-200 font-mono text-sm">{group.info.codec}</span>
              </div>
            </div>

            <button className="mt-auto w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
              <FaDownload className="text-lg" /> 
              <span>Download Full Collection</span>
            </button>
          </div>
        </div>

        {/* Videos Table */}
        <div className="mb-6 flex items-center gap-2">
           <h2 className="text-2xl font-bold text-white">Included Videos</h2>
           <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">{group.videos.length}</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {group.videos.map(video => (
            <VideoItem key={video.id} video={video} />
          ))}
        </div>
      </div>

      <footer className="mt-24 text-center text-gray-600 text-sm border-t border-gray-800/50 pt-10 pb-6">
        <p className="font-medium text-gray-500 mb-2">GABI Media Manager</p>
        <p>&copy; 2026 Project GABI. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default DetailPage;
