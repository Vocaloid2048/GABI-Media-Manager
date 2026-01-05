import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TitleHeader from '../components/TitleHeader';
import DownloadResolutionPopup from '../components/DownloadResolutionPopup';
import { FaDownload, FaInfoCircle } from 'react-icons/fa';
import TitleFooter from '../components/TitleFooter';
import TagClip from '../components/TagClip';

const VideoItem = ({ video, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);

  const thumbName = video.video_thumb_name || video.video_filename;
  const thumbUrl = `/api/video/thumb?name=${thumbName}.webp`;
  const animUrl = `/api/video/thumb?name=${thumbName}_anim.webp`;

  return (
    <div
      className="cursor-pointer rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-700 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video w-full bg-gray-900 relative">
        <img
          src={isHovered ? animUrl : thumbUrl}
          alt={video.video_filename}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => { e.target.src = '/src/assets/no_preview.webp'; }}
        />

        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-white">
          {video.video_duration.toFixed(1)}s
        </div>

        {/* Download Button Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(video);
          }}
          className={`absolute bottom-2 right-2 bg-gray-900 hover:bg-gray-500 text-white p-2 rounded-full shadow-lg transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          title="Download"
        >
          <FaDownload size={12} />
        </button>
      </div>
      <div className="p-3">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{video.video_resolution}</span>
          <span>{video.video_filesize ? (video.video_filesize / 1024 / 1024).toFixed(1) + ' MB' : ''}</span>
        </div>
      </div>
    </div>
  );
};

const DetailPage = () => {
  const { id } = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution Popup State
  const [isResPopupOpen, setIsResPopupOpen] = useState(false);
  const [resPopupVideo, setResPopupVideo] = useState(null);

  const handleOpenResPopup = (video) => {
    setResPopupVideo(video);
    setIsResPopupOpen(true);
  };

  const handleResConfirm = (itemData, options) => {
    setIsResPopupOpen(false);
    trigDownload(itemData, options);
  };

  const trigDownload = (itemData, options) => {
    const downloadUrl = `/api/video/download?id=${itemData.video_id || itemData.group_id}&options=${options}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', itemData.video_filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/video/group?group_id=${id}`);
        const json = await res.json();

        if (json.retcode === 1) {
          setGroupData(json.data.groupData);
          setVideoList(json.data.videoData || []);
        } else {
          console.error("Failed to fetch group data:", json.message);
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center">
        <TitleHeader />
        <h2 className="text-2xl font-bold text-gray-400 mt-10">Group not found</h2>
      </div>
    );
  }

  const groupThumbUrl = `/api/video/thumb?name=${groupData.group_thumb_name}.webp`;
  const groupAnimUrl = `/api/video/thumb?name=${groupData.group_thumb_name}_anim.webp`;

  const formats = getUniqueValues(videoList, 'video_format');
  const frameRates = getUniqueValues(videoList, 'video_frame_rate', ' FPS');
  const resolutions = getUniqueValues(videoList, 'video_resolution');
  const codecs = getUniqueValues(videoList, 'video_codec');

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
              src={isHovered ? groupAnimUrl : groupThumbUrl}
              alt={groupData.group_title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { e.target.src = '/src/assets/no_preview.webp'; }}
            />

          </div>

          {/* Info */}
          <div className="w-full lg:w-5/12 flex flex-col">

            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{groupData.group_title}</h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-xs font-bold tracking-wider bg-blue-500/10 px-2 py-1 rounded">{groupData.group_author}</span>
            </div>

            <div className="flex flex-wrap">
              {groupData.group_tags && groupData.group_tags.slice(",").map((tag) => (
                <TagClip key={tag.tag_id} tagData={tag} />
              ))}
            </div>

            <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base">{groupData.group_desc}</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Format</span>
                <span className="text-gray-200 font-mono text-sm">{formats}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Frame Rate</span>
                <span className="text-gray-200 font-mono text-sm">{frameRates}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Resolution</span>
                <span className="text-gray-200 font-mono text-sm">{resolutions}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-xs uppercase font-bold mb-1">Codec</span>
                <span className="text-gray-200 font-mono text-sm">{codecs}</span>
              </div>
            </div>

            <button
              onClick={() => trigDownload(groupData)}
              className="mt-auto w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <FaDownload className="text-lg" />
              <span>Download Full Collection</span>
            </button>
          </div>
        </div>

        {/* Videos Table */}
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white">Included Videos</h2>
          <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">{videoList.length}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videoList.map(video => (
            <VideoItem
              key={video.video_id}
              video={video}
              onDownload={(v) => trigDownload(v)}
            />
          ))}
        </div>
      </div>

      <DownloadResolutionPopup
        isOpen={isResPopupOpen}
        onClose={() => setIsResPopupOpen(false)}
        video={resPopupVideo}
        onConfirm={handleResConfirm}
      />

      <TitleFooter />
    </div>
  );
};

// Helper to get unique values
export const getUniqueValues = (list, key, suffix = '') => {
  if (!list || list.length === 0) return 'N/A';
  const values = [...new Set(list.map(item => item[key]).filter(v => v !== null && v !== undefined && v !== ''))];
  if (values.length === 0) return 'N/A';
  return values.join(' / ') + suffix;
};

export default DetailPage;
