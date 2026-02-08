import React, { useState, useEffect, useRef } from 'react';
import { FaFilter, FaSearch, FaArrowRight, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../lang/LanguageContext';

const HoverNav = ({ onFilterClick, onSearch, filterCount = 0, hasActiveSearch = false }) => {
  const { locale } = useLanguage();
  const [showSearch, setShowSearch] = useState(false);
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
    setShowSearch(false);
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
    <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center pb-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center">
        {/* History List Bubble */}
        <AnimatePresence>
          {showHistory && recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="mb-3 bg-gray-900/95 backdrop-blur border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col-reverse w-[400px]"
            >
              {recentSearches.slice(0, 5).map(term => (
                <button
                  key={term}
                  onClick={() => handleHistoryClick(term)}
                  className="text-left px-5 py-3.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white border-b border-gray-800/50 last:border-0 truncate flex items-center gap-3 transition-colors"
                >
                  <FaSearch className="text-gray-500 text-xs" />
                  {term}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          transition={{
            layout: { duration: 0.3, ease: "easeInOut" }
          }}
          className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center px-1.5 py-1.5 gap-1 overflow-hidden"
          style={{ width: showSearch ? 400 : 'auto' }}
        >
          <AnimatePresence mode="wait">
            {!showSearch ? (
              <motion.div 
                key="icons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-4"
              >
                <button
                  onClick={onFilterClick}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  <div className="relative">
                    <FaFilter className="text-xl" />
                    {filterCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-blue-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full border-2 border-black">
                        {filterCount > 99 ? '99+' : filterCount}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setShowSearch(true)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all ${hasActiveSearch ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  <div className="relative">
                    <FaSearch className="text-lg" />
                    {hasActiveSearch && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 w-2.5 h-2.5 rounded-full border-2 border-black"></span>
                    )}
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-0 w-full h-8"
              >
                <button 
                  onClick={() => setShowSearch(false)}
                  className="text-gray-500 hover:text-white transition-colors pl-2"
                >
                  <FaTimes />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={locale('nav.search')}
                  className="bg-transparent text-white flex-1 outline-none text-sm font-medium placeholder-gray-500 min-w-0"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (e.target.value) setShowHistory(false);
                    else setShowHistory(true);
                  }}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                />
                <button 
                  onClick={handleSearchSubmit} 
                  className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 active:scale-95 transition-all"
                >
                  <FaArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default HoverNav;