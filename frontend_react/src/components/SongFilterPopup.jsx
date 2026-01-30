import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../lang/LanguageContext';
import { FaTimes } from 'react-icons/fa';
import { SongLanguageLabels } from '../utils/songLang';

const SongFilterPopup = ({ tagList, selectedTags, selectedLanguages, onClose, onApply }) => {
  const { locale, language } = useLanguage();
  const [localSelectedTags, setLocalSelectedTags] = React.useState(selectedTags);
  const [localSelectedLanguages, setLocalSelectedLanguages] = React.useState(selectedLanguages);

  const toggleLocalTag = (tagId) => {
    setLocalSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const toggleLocalLanguage = (lang) => {
    setLocalSelectedLanguages(prev => {
      if (prev.includes(lang)) {
        return prev.filter(l => l !== lang);
      } else {
        return [...prev, lang];
      }
    });
  };

  const handleReset = () => {
    onApply([], []);
    onClose();
  };

  const handleApply = () => {
    onApply(localSelectedTags, localSelectedLanguages);
    onClose();
  };

  // Group tags by type
  const groupedTags = React.useMemo(() => {
    const groups = {};
    tagList.forEach(tag => {
      const type = tag.tag_type || 'other';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(tag);
    });
    return groups;
  }, [tagList]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}</style>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-gray-700 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header Section */}
        <div className="p-6 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6 sm:hidden"></div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">{locale('filter.title')}</h3>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
            >
                <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2 pr-2 mr-1">
          <div className="space-y-6 pr-3">
            {Object.entries(groupedTags).map(([tagType, tags]) => (
              <div key={tagType}>
                <h4 className="text-sm text-gray-400 mb-3 font-medium capitalize">
                  {tagType === 'other' ? locale('filter.other') || 'Other' : tagType}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isSelected = localSelectedTags.includes(tag.tag_id);
                    return (
                      <button
                        key={tag.tag_id}
                        onClick={() => toggleLocalTag(tag.tag_id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${isSelected
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600'
                          }`}
                      >
                        {language === 'zh' ? tag.tag_zh_name : tag.tag_en_name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Language Filter Section */}
            
              <div>
                <h4 className="text-sm text-gray-400 mb-3 font-medium">
                  {locale('song.language_label') || 'Language'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(SongLanguageLabels).map(lang => {
                    const isSelected = localSelectedLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        onClick={() => toggleLocalLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${isSelected
                          ? 'bg-green-600 text-white border-green-500'
                          : 'bg-gray-700 text-gray-300 border-transparent hover:bg-gray-600'
                          }`}
                      >
                        {locale(SongLanguageLabels[lang].localeKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-6 pt-4 shrink-0 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold rounded-xl transition-colors shrink-0"
          >
            {locale('filter.reset')}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
          >
            {locale('filter.apply')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SongFilterPopup;