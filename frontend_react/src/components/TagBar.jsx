import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TagBar = ({ tags, selectedTags, onToggleTag }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
          <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar">
            {tags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white shadow-blue-500/30 shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TagBar;
