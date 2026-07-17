import React from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { FaGripLines } from 'react-icons/fa';
import { useLanguage } from '../../lang/LanguageContext';
import { GROUP_LABEL_LIST } from '../../constants/lyrics';

const StepArrange = ({ data, onChange, onNext, onPrev }) => {
  const { locale } = useLanguage();

  const handleReorder = (newOrder) => {
    // 更新 slides 順序，重新分配 page 編號
    const updatedSlides = newOrder.map((slide, index) => ({
      ...slide,
      page: index + 1
    }));
    onChange({ slides: updatedSlides });
  };

  const getTagLabel = (tagKey) => {
    const info = GROUP_LABEL_LIST[tagKey];
    return info ? (info.zh_hk || info.en) : tagKey;
  };

  const getTagColor = (tagKey) => {
    const info = GROUP_LABEL_LIST[tagKey];
    return info ? info.colorHex : '#777777';
  };

  // 預覽內容（簡短截斷）
  const previewContent = (content) => {
    if (!content) return '';
    const lines = content.split('\n').filter(l => l.trim());
    const preview = lines.slice(0, 3).join(' / ');
    return preview.length > 80 ? preview.substring(0, 80) + '...' : preview;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{locale('lyric_editor.slide_order')}</h3>
        <p className="text-gray-400 text-sm">{locale('lyric_editor.drag_to_reorder')}</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <Reorder.Group axis="y" values={data.slides || []} onReorder={handleReorder} className="space-y-2">
          <AnimatePresence>
            {(data.slides || []).map((slide) => (
              <Reorder.Item
                key={slide.page}
                value={slide}
                className="bg-gray-700 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="text-gray-400">
                    <FaGripLines />
                  </div>
                  <div
                    className="w-2 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: getTagColor(slide.tag) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">#{slide.page}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: getTagColor(slide.tag) }}
                      >
                        {getTagLabel(slide.tag)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs truncate">
                      {previewContent(slide.content)}
                    </p>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      {/* 底部導航 */}
      <div className="flex justify-between pt-4 border-t border-gray-700">
        <button
          onClick={onPrev}
          className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          {locale('lyric_editor.prev_step')}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 rounded-lg text-white font-medium text-sm transition-all bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20"
        >
          {locale('lyric_editor.next_step')}
        </button>
      </div>
    </div>
  );
};

export default StepArrange;
