import React, { useState, useEffect, useMemo } from 'react';
import { FaDownload, FaTimes, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';

const DownloadFilePopup = ({ isOpen, onClose, title, items = [] }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const { locale } = useLanguage();

  // Reset selection when modal opens or items change
  useEffect(() => {
    if (isOpen) {
      // Default select all
      setSelectedIds(items.map(item => item.video_id));
    }
  }, [isOpen, items]);

  const totalSize = useMemo(() => {
    return items
      .filter(item => selectedIds.includes(item.video_id))
      .reduce((acc, item) => acc + (item.video_filesize || 0), 0);
  }, [items, selectedIds]);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.video_id));
    }
  };

  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDownload = async () => {
    if (selectedIds.length === 0) return;

    setIsDownloading(true);

    try {
      // Scenario 1: Single file download
      if (selectedIds.length === 1) {
        const video = items.find(item => item.video_id === selectedIds[0]);
        // Assuming backend serves video at /api/video/stream or similar, or static file
        // We can trigger a direct download. 
        // If you have a specific download endpoint:
        const downloadUrl = `/api/video/download?id=${video.video_id}`;
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', video.video_filename); // Optional: hint filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      // Scenario 2: Multiple files (ZIP)
      else {
        // Trigger backend to generate ZIP
        // We'll use fetch to post the IDs, and handle the blob response
        const response = await fetch('/api/download/zip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ video_ids: selectedIds }),
        });

        if (!response.ok) throw new Error('Download failed');

        // Handle blob download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `collection_${Date.now()}.zip`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      onClose();
    } catch (error) {
      console.error('Download error:', error);
      alert(locale('download.failed'));
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border border-gray-700">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FaDownload className="text-blue-400" />
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content - List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4 px-2">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
            >
              {selectedIds.length === items.length ? <FaCheckSquare className="text-blue-500" /> : <FaSquare className="text-gray-600" />}
              {locale('common.selectAll')} ({items.length})
            </button>
            <span className="text-sm text-gray-400">
              {locale('common.selected')} {formatSize(totalSize)}
            </span>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div 
                key={item.video_id}
                onClick={() => toggleItem(item.video_id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                  selectedIds.includes(item.video_id) 
                    ? 'bg-blue-900/20 border-blue-500/50' 
                    : 'bg-gray-700/30 border-transparent hover:bg-gray-700/50'
                }`}
              >
                <div className="text-lg">
                  {selectedIds.includes(item.video_id) 
                    ? <FaCheckSquare className="text-blue-500" /> 
                    : <FaSquare className="text-gray-600" />
                  }
                </div>
                <div className="w-16 h-9 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                   <img 
                    src={`/api/video/thumb?name=${item.video_thumb_name || item.video_filename}.webp`} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{item.video_filename}</p>
                  <p className="text-xs text-gray-500">{item.video_resolution} • {formatSize(item.video_filesize)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            {locale('common.cancel')}
          </button>
          <button 
            onClick={handleDownload}
            disabled={selectedIds.length === 0 || isDownloading}
            className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
              selectedIds.length === 0 || isDownloading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                {locale('common.processing')}
              </>
            ) : (
              <>
                <FaDownload />
                {locale('common.download')} ({selectedIds.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadFilePopup;
