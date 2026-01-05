import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../lang/LanguageContext';

const FilterPopup = ({ onClose }) => {
  const { locale } = useLanguage();
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: "200%" }}
        animate={{ y: 0 }}
        exit={{ y: "200%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 border-t sm:border border-gray-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6 sm:hidden"></div>
        <h3 className="text-lg font-bold text-white mb-6">{locale('filter.advanced_title')}</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm text-gray-400 mb-3 font-medium">{locale('filter.style')}</h4>
            <div className="flex flex-wrap gap-2">
              {['Realistic', 'Anime', '3D', 'Sketch', 'Abstract'].map(style => (
                <button key={style} className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                  {locale(`filter.opt_${style.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm text-gray-400 mb-3 font-medium">{locale('filter.speed')}</h4>
            <div className="flex flex-wrap gap-2">
              {['Slow', 'Normal', 'Fast', 'Timelapse'].map(speed => (
                <button key={speed} className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                  {locale(`filter.opt_${speed.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm text-gray-400 mb-3 font-medium">{locale('filter.resolution')}</h4>
            <div className="flex flex-wrap gap-2">
              {['720p', '1080p', '2K', '4K', '8K'].map(res => (
                <button key={res} className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                  {res}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
          {locale('filter.apply')}
        </button>
      </motion.div>
    </div>
  );
};

export default FilterPopup;
