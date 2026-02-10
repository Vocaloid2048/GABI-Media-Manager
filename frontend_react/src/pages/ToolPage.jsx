import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTools, FaWrench, FaApple, FaWindows } from 'react-icons/fa';
import ToolPopup from '../components/ToolPopup';
import { useLanguage } from '../lang/LanguageContext';
import { useRef } from 'react';

const ToolPage = () => {
  const [activeTool, setActiveTool] = useState(null);
  const scrollContainerRef = useRef(null);
  const { locale } = useLanguage();

  const tools = [
    {
      id: 'propresenter-fix',
      title: locale('tool.propresenter_fix_title'),
      description: locale('tool.propresenter_fix_desc'),
      icon: <FaWrench className="text-yellow-500 text-3xl" />,
      platforms: ['macOS']
    },
    // Future tools can be added here
  ];

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto no-scrollbar relative p-6"
    >
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <FaTools className="text-blue-500" />
                {locale('tool.title')}
            </h1>
            <p className="text-gray-400">{locale('tool.description')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <motion.div
              key={tool.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-800/80 backdrop-blur border border-gray-700/50 rounded-xl p-6 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => setActiveTool(tool.id)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  {tool.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{tool.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">
                    {tool.description}
                  </p>
                  <div className="flex gap-2">
                    {tool.platforms.includes('macOS') && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                             <FaApple /> macOS
                        </span>
                    )}
                    {tool.platforms.includes('Windows') && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                             <FaWindows /> Windows
                        </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeTool === 'propresenter-fix' && (
          <ToolPopup 
            title={locale('tool.propresenter_fix_title')}
            onClose={() => setActiveTool(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolPage;
