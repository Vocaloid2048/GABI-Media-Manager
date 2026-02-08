import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSync } from 'react-icons/fa';
import { useLanguage } from '../lang/LanguageContext';

const TagBar = ({ tags, selectedTags, onToggleTag, onRefreshTags, isVisible = true }) => {
  const { locale, language } = useLanguage();
  const scrollRef = useRef(null);

  // Enable horizontal scrolling with mouse wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const onWheel = (e) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        el.scrollTo({
          left: el.scrollLeft + e.deltaY,
          behavior: 'smooth' // Optional: smooth scrolling
        });
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, [isVisible]); // Re-attach if visibility changes (though component unmounts so maybe just [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 left-0 right-0 bg-gray-800/95 backdrop-blur-md z-40 py-3 shadow-lg"
        >
          <div className="flex items-center px-4">
            <div 
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto no-scrollbar flex-1 mask-image-linear-gradient pr-4"
            >
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.tag_id);
                const displayTag = language === 'zh' ? tag.tag_zh_name : tag.tag_en_name;
                
                return (
                  <button
                    key={tag.tag_id}
                    onClick={() => onToggleTag(tag.tag_id)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {displayTag}
                    {isSelected && <FaTimes className="text-xs opacity-80 hover:opacity-100" />}
                  </button>
                );
              })}
            </div>
            
            {/* Refresh Button */}
            <div className="pl-2 border-l border-gray-700 ml-2 shrink-0">
              <button 
                onClick={onRefreshTags}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all active:rotate-180"
                title={locale('common.refresh')}
              >
                <FaSync />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TagBar;
