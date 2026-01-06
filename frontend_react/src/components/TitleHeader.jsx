import React from 'react';
import { FaArrowCircleLeft, FaBackward, FaPlayCircle, FaGlobe, FaArrowLeft, FaCloudUploadAlt } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';

const TitleHeader = ({isHomePage = false, onUploadClick}) => {
  const { locale, toggleLanguage, language } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900 text-white flex items-center justify-between px-4 z-50 shadow-md border-b border-gray-800 shadow-black/20">
      {/* Left: Back Button */}
      <div className="flex items-center w-10 shrink-0">
        {isHomePage !== true && 
          <FaArrowLeft className="text-2xl cursor-pointer hover:text-gray-300 transition-colors" onClick={() => window.history.back()} />
        }
      </div>

      {/* Center: Logo & Title */}
      <div onClick={() => window.location.href = '/'} className="flex-1 flex items-center justify-center gap-3 cursor-pointer overflow-hidden px-2">
        <img src="/src/assets/gabi.webp" alt="GABI Media Manager Logo" className="h-10 w-10 rounded-full shrink-0" />
        <h1 className="text-xl font-bold truncate whitespace-nowrap">{locale('app.title')}</h1>
      </div>

      {/* Right: Upload Button (Moved from BottomNav) */}
      <div className="w-10 shrink-0 flex justify-end">
        <button onClick={onUploadClick} className="text-gray-400 hover:text-white transition-colors">
            <FaCloudUploadAlt size={24} />
        </button>
      </div>
    </header>
  );
};

export default TitleHeader;
