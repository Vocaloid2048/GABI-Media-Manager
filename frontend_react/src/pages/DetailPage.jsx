import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TitleHeader from '../components/TitleHeader';
import DownloadResolutionPopup from '../components/DownloadResolutionPopup';
import { FaDownload, FaInfoCircle } from 'react-icons/fa';
import TitleFooter from '../components/TitleFooter';
import {TagClip} from '../components/TagClip';
import { COLOR_MAP } from '../components/ColorMapTable'; // Import Color Map
import { useLanguage } from '../lang/LanguageContext';
import { generateDs } from '../utils/auth';

const VideoItem = ({ video, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { locale } = useLanguage();

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
          onError={(e) => { e.target.src = '/no_preview.webp'; }}
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
          className={`absolute bottom-2 right-2 bg-gray-900 hover:bg-gray-500 text-white p-2 rounded-full shadow-lg transition-all duration-200 opacity-100 scale-100`}
          title={locale('common.download')}
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
  const { locale } = useLanguage();
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

  const trigDownload = async (itemData, options) => {
    const userId = localStorage.getItem('user_id');
    const ds = generateDs(userId);

    if (!ds) {
      alert('Authentication error. Please login again.');
      return;
    }

    // 1. Check Auth First
    try {
      const checkUrl = `/api/video/download?check=true&user_id=${userId}&ds=${encodeURIComponent(ds)}`;
      const res = await fetch(checkUrl);
      const json = await res.json();

      if (json.retcode === -1001) {
        alert('Session expired. Please login again.');
        localStorage.clear();
        window.location.reload();
        return;
      } else if (json.retcode !== 1) {
        alert('Download error: ' + (json.message || 'Unknown error'));
        return;
      }
    } catch (e) {
      console.error("Auth check failed", e);
      // Optional: decide whether to proceed or stop. 
      // If network error, maybe stop.
      return;
    }

    // 2. Proceed to Download
    const downloadUrl = `/api/video/download?id=${itemData.video_id || itemData.group_id}&options=${options}&user_id=${userId}&ds=${encodeURIComponent(ds)}`;

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
        <h2 className="text-2xl font-bold text-gray-400 mt-10">{locale('detail.notFound')}</h2>
      </div>
    );
  }

  const groupThumbUrl = `/api/video/thumb?name=${groupData.group_thumb_name}.webp`;
  const groupAnimUrl = `/api/video/thumb?name=${groupData.group_thumb_name}_anim.webp`;

  const formats = getUniqueValues(videoList, 'video_format');
  const frameRates = getUniqueValues(videoList, 'video_frame_rate');
  const resolutions = getUniqueValues(videoList, 'video_resolution');
  const codecs = getUniqueValues(videoList, 'video_codec');

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-10 font-sans">
      <TitleHeader />

      <div className="pt-24 px-4 max-w-[90rem] mx-auto">
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
              onError={(e) => { e.target.src = '/no_preview.webp'; }}
            />

          </div>

          {/* Info */}
          <div className="w-full lg:w-5/12 flex flex-col">

            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{groupData.group_title}</h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-xs font-bold tracking-wider bg-blue-500/10 px-2 py-1 rounded">{groupData.group_author}</span>
            </div>

            <div className="flex flex-wrap mb-2">
              {groupData.group_tags && groupData.group_tags.slice(",").map((tag) => (
                <TagClip key={tag.tag_id} tagData={tag} />
              ))}
            </div>

            {/* Color Tags */}
            {groupData.group_colors && (
              <div className="flex flex-wrap mb-2">
                {groupData.group_colors.split(',').map((color, idx) => {
                   // Clean hex string (remove # if exists, though data seems to include it or not)
                   const safeColor = color.trim();
                   const hexCode = safeColor.replace('#', '').toLowerCase();
                   const translationKey = `color.${hexCode}`;
                   
                   // Try to get translation, fallback to the hex code itself 
                   const colorName = locale(translationKey) !== translationKey ? locale(translationKey) : safeColor;

                   return (
                    <div key={idx} className="group relative mr-2 mb-2">
                      <div 
                        className="w-5 h-5 rounded-full border border-gray-500 shadow-sm hover:scale-110 transition-transform cursor-help"
                        style={{ backgroundColor: safeColor }}
                      />
                      {/* Simple Custom Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {colorName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-gray-400 mb-2 leading-relaxed text-sm md:text-base">{groupData.group_desc}</p>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-s uppercase font-bold mb-1">{locale('detail.format')}</span>
                <span className="text-gray-200 font-mono text-sm">{formats}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-s uppercase font-bold mb-1">{locale('detail.frame_rate')}</span>
                <span className="text-gray-200 font-mono text-sm">{Number(frameRates).toFixed(2)} FPS</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-s uppercase font-bold mb-1">{locale('detail.resolution')}</span>
                <span className="text-gray-200 font-mono text-sm">{resolutions}</span>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                <span className="text-gray-500 block text-s uppercase font-bold mb-1">{locale('detail.codec')}</span>
                <span className="text-gray-200 font-mono text-sm">{codecs.toUpperCase()}</span>
              </div>
            </div>

            <button
              onClick={() => trigDownload(groupData)}
              className="mt-auto w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <FaDownload className="text-lg" />
              <span>{locale('detail.download_collection')}</span>
            </button>
          </div>
        </div>

        {/* Videos Table */}
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white">{locale('detail.included_videos')}</h2>
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
