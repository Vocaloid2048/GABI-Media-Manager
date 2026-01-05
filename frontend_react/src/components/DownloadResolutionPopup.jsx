import React, { useState } from 'react';
import { FaDownload, FaTimes, FaVideo } from 'react-icons/fa';
import { getUniqueValues } from '../pages/DetailPage';
import { useLanguage } from '../lang/LanguageContext';

const DownloadResolutionPopup = ({ isOpen, onClose, video: itemData, onConfirm }) => {
  const { locale } = useLanguage();
  const [selectedRes, setSelectedRes] = useState('Original');

  if (!isOpen || !itemData) return null;

  const resolutions = [
    { label: locale('download.res_original'), desc: locale('download.quality_source') },
    { label: '1080p', desc: locale('download.quality_high') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FaVideo className="text-blue-400" />
            {locale('download.options_title')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">

          <div className="space-y-3">
            {resolutions.map((res) => (
              <label 
                key={res.label}
                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedRes === res.label 
                    ? 'bg-blue-600/20 border-blue-500' 
                    : 'bg-gray-700/30 border-transparent hover:bg-gray-700/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="resolution" 
                  value={res.label}
                  checked={selectedRes === res.label}
                  onChange={(e) => setSelectedRes(e.target.value)}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                />
                <div className="ml-3">
                  <span className={`block font-bold ${selectedRes === res.label ? 'text-blue-400' : 'text-gray-200'}`}>
                    {res.label}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {res.desc}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            {locale('common.cancel')}
          </button>
          <button 
            onClick={() => onConfirm(itemData, selectedRes)}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2"
          >
            <FaDownload />
            {locale('common.download')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadResolutionPopup;
