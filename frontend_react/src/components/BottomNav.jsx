import React, { useState, useEffect, useRef } from 'react';
import { FaFilter, FaSearch, FaUser, FaTimes, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lang/LanguageContext';

const BottomNav = ({ onFilterClick, onSearchClick, onUserClick, showSearch, onCloseSearch, onSearch, className, filterCount = 0, hasActiveSearch = false }) => {
  const { locale } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
      // Load history
      const history = localStorage.getItem('gabi_search_history');
      if (history) {
        try {
          setRecentSearches(JSON.parse(history));
        } catch (e) {}
      }
    } else {
        setShowHistory(false);
    }
  }, [showSearch]);

  const saveToHistory = (term) => {
    const newHistory = [term, ...recentSearches.filter(t => t !== term)].slice(0, 10);
    setRecentSearches(newHistory);
    localStorage.setItem('gabi_search_history', JSON.stringify(newHistory));
  };

  const handleActiveSearch = (term) => {
    // 儲存有內容的搜尋
    if (term && term.trim() !== '') {
        saveToHistory(term.trim());
    } 
    // 執行搜尋 (包含空值重置)
    if (onSearch) onSearch(term);
    
    // 關閉浮動搜尋列
    if (onCloseSearch) onCloseSearch();
    setShowHistory(false);
  };

  const handleSearchSubmit = () => {
    handleActiveSearch(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleInputFocus = () => {
    if (!inputValue) setShowHistory(true);
  };

  const handleHistoryClick = (term) => {
    handleActiveSearch(term);
  };

  return (
    <div className={`bg-gray-900/95 backdrop-blur border-t border-gray-800 h-16 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${className || 'fixed bottom-0 left-0 right-0'}`}>
      
      {/* Floating Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -10, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-full left-4 right-4 mx-auto max-w-[400px] flex flex-col gap-2 ${showHistory && recentSearches.length > 0 ? 'items-stretch' : 'items-center'}`}
          >
            {/* History List Bubble */}
            {showHistory && recentSearches.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden mb-1 flex flex-col-reverse"
                >
                    {recentSearches.slice(0, 5).map(term => (
                        <button
                            key={term}
                            onClick={() => handleHistoryClick(term)}
                            className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700/50 last:border-0 truncate flex items-center gap-2"
                        >
                            <FaSearch className="text-gray-500 text-xs" />
                            {term}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Input Bar */}
            <div className="bg-gray-800 border border-gray-700 rounded-full shadow-xl flex items-center px-4 py-3 gap-2 w-full">
                <input 
                ref={inputRef}
                type="text" 
                placeholder={locale('nav.search')} 
                className="bg-transparent text-white flex-1 outline-none text-base min-w-0"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    if (e.target.value) setShowHistory(false);
                    else setShowHistory(true);
                }}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                />
                <button onClick={handleSearchSubmit} className="text-blue-500 p-1">
                    <FaArrowRight />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-around items-center h-full">
        <button 
          onClick={onFilterClick} 
          className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
        >
          <div className="relative">
            <FaFilter className="text-xl mb-1" />
            {filterCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full border border-gray-900 shadow-sm">
                {filterCount > 99 ? '99+' : filterCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">{locale('nav.filter')}</span>
        </button>
        
        <div className="w-px h-8 bg-gray-800"></div>

        <button 
          onClick={() => showSearch ? onCloseSearch() : onSearchClick()} 
          className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-all ${hasActiveSearch ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
        >
          <div className="relative">
            <FaSearch className="text-xl mb-1" />
            {hasActiveSearch && (
              <span className="absolute -top-1 -right-1 bg-blue-500 w-2.5 h-2.5 rounded-full border border-gray-900 shadow-sm"></span>
            )}
          </div>
          <span className="text-xs font-medium">{locale('nav.search')}</span>
        </button>

        <div className="w-px h-8 bg-gray-800"></div>

        <button 
          onClick={onUserClick} 
          className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500 active:scale-95 transition-all"
        >
          <FaUser className="text-xl mb-1" />
          <span className="text-xs font-medium">{locale('nav.user')}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
