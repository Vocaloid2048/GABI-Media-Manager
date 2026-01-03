import React, { useState, useEffect, useRef } from 'react';
import { FaFilter, FaSearch, FaCloudUploadAlt, FaTimes, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNav = ({ onFilterClick, onSearchClick, onUploadClick, showSearch, onCloseSearch, onSearch }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch(inputValue);
    }
    // Optional: Close search after submit or keep it open? 
    // Usually keeping it open or showing results is better, but let's follow the popup behavior which closed.
    // But here it's part of the nav. Let's close it for now to return to nav state.
    if (onCloseSearch) onCloseSearch();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 h-16 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      
      {/* Floating Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 right-0 mx-auto max-w-[320px] bg-gray-800 border border-gray-700 rounded-full shadow-xl flex items-center px-3 py-2 gap-2"
          >
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Search" 
              className="bg-transparent text-white flex-1 outline-none text-sm min-w-0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearchSubmit} className="text-blue-500 text-sm">
                <FaArrowRight />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-around items-center h-full">
        <button 
          onClick={onFilterClick} 
          className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
        >
          <FaFilter className="text-xl mb-1" />
          <span className="text-xs font-medium">Filter</span>
        </button>
        
        <div className="w-px h-8 bg-gray-800"></div>

        <button 
          onClick={() => showSearch ? onCloseSearch() : onSearchClick()} 
          className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-all ${showSearch ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
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
    </div>
  );
};

export default BottomNav;
