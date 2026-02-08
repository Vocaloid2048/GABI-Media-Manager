import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';

const SearchPopup = ({ onClose, onSearch }) => {
  const { locale } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  React.useEffect(() => {
    const history = localStorage.getItem('gabi_search_history');
    if (history) {
      try {
        setRecentSearches(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse search history', e);
      }
    }
  }, []);

  const saveToHistory = (term) => {
    const newHistory = [term, ...recentSearches.filter(t => t !== term)].slice(0, 10);
    setRecentSearches(newHistory);
    localStorage.setItem('gabi_search_history', JSON.stringify(newHistory));
  };

  const removeFromHistory = (e, term) => {
    e.stopPropagation();
    const newHistory = recentSearches.filter(t => t !== term);
    setRecentSearches(newHistory);
    localStorage.setItem('gabi_search_history', JSON.stringify(newHistory));
  };

  const activeSearch = (term) => {
    // 如果 term 有值，儲存到歷史紀錄
    if (term && term.trim() !== '') {
        saveToHistory(term.trim());
    }
    // 無論是否為空，都觸發搜尋 (空字串代表重置/搜尋全部)
    if (onSearch) {
      onSearch(term);
    }
    onClose();
  }

  const handleSearch = () => {
    activeSearch(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-24 px-4">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gray-800 w-full max-w-2xl rounded-2xl p-4 border border-gray-700 shadow-2xl"
      >
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <FaSearch 
            className="text-gray-400 text-lg rounded-full cursor-pointer hover:text-white transition-colors" 
            onClick={handleSearch}
          />
          <input 
            type="text" 
            placeholder={locale('search.placeholder')} 
            className="bg-transparent text-white w-full outline-none text-lg placeholder-gray-500"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {inputValue && (
            <button onClick={handleClear} className="text-gray-400 hover:text-white p-1">
                <FaTimes />
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700 rounded-lg px-3 py-2 text-sm font-medium ml-2">{locale('common.cancel')}</button>
        </div>
        
        {(!inputValue || inputValue.trim() === '') && recentSearches.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs text-gray-500 uppercase font-bold mb-2 px-2 flex justify-between">
                {locale('search.recent')}
                <button 
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('gabi_search_history');
                  }}
                  className="text-[10px] text-gray-600 hover:text-red-400"
                >
                    CLEAR ALL
                </button>
            </h4>
            <div className="space-y-1">
                {recentSearches.map(term => (
                <div 
                    key={term} 
                    onClick={() => activeSearch(term)}
                    className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors flex items-center justify-between group cursor-pointer"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-gray-500 shrink-0"><FaSearch size={12} /></span>
                        <span className="truncate">{term}</span>
                    </div>
                    <button 
                        onClick={(e) => removeFromHistory(e, term)} 
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                        <FaTimes size={12} />
                    </button>
                </div>
                ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SearchPopup;
