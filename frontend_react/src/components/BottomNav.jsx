import React from 'react';
import { FaFilter, FaSearch, FaCloudUploadAlt } from 'react-icons/fa';

const BottomNav = ({ onFilterClick, onSearchClick, onUploadClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 h-16 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <button 
        onClick={onFilterClick} 
        className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
      >
        <FaFilter className="text-xl mb-1" />
        <span className="text-xs font-medium">Filter</span>
      </button>
      
      <div className="w-px h-8 bg-gray-800"></div>

      <button 
        onClick={onSearchClick} 
        className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
      >
        <FaSearch className="text-xl mb-1" />
        <span className="text-xs font-medium">Search</span>
      </button>

      <div className="w-px h-8 bg-gray-800"></div>

      <button 
        onClick={onUploadClick} 
        className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
      >
        <FaCloudUploadAlt className="text-xl mb-1" />
        <span className="text-xs font-medium">Upload</span>
      </button>
    </div>
  );
};

export default BottomNav;
