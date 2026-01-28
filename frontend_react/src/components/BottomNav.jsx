import React from 'react';
import { FaUser, FaMusic, FaVideo } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';

const BottomNav = ({ currentPage, onPageChange, className }) => {
  const { locale } = useLanguage();

  return (
    <div className={`bg-gray-900/95 backdrop-blur border-t border-gray-800 h-16 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${className || 'fixed bottom-0 left-0 right-0'}`}>
      {/* Navigation Buttons */}
      <div className="flex justify-around items-center h-full">
        <button 
          onClick={() => onPageChange('song')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${
            currentPage === 'song' ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
          }`}
        >
          <FaMusic className="text-xl mb-1" />
          <span className="text-xs font-medium">詩歌</span>
        </button>

        <div className="w-px h-8 bg-gray-800"></div>

        <button 
          onClick={() => onPageChange('video')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${
            currentPage === 'video' ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
          }`}
        >
          <FaVideo className="text-xl mb-1" />
          <span className="text-xs font-medium">影片</span>
        </button>

        <div className="w-px h-8 bg-gray-800"></div>

        <button 
          onClick={() => onPageChange('user')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${
            currentPage === 'user' ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
          }`}
        >
          <FaUser className="text-xl mb-1" />
          <span className="text-xs font-medium">{locale('nav.user')}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
