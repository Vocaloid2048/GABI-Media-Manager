import React from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';

const SearchPopup = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-24 px-4" onClick={onClose}>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gray-800 w-full max-w-2xl rounded-2xl p-4 border border-gray-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <FaSearch className="text-gray-400 text-lg rounded-full" />
          <input 
            type="text" 
            placeholder="Search videos, tags, authors..." 
            className="bg-transparent text-white w-full outline-none text-lg placeholder-gray-500"
            autoFocus
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700 rounded-lg px-3 py-2">Cancel</button>
        </div>
        
        {/**
         * <div className="mt-4">
          <h4 className="text-xs text-gray-500 uppercase font-bold mb-2 px-2">Recent Searches</h4>
          <div className="space-y-1">
            {['Cyberpunk City', 'Nature 4K', 'Abstract Loop'].map(term => (
              <button key={term} className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-3">
                <span className="text-gray-500"><FaSearch size={12} /></span>
                {term}
              </button>
            ))}
          </div>
        </div>
         */}
      </motion.div>
    </div>
  );
};

export default SearchPopup;
