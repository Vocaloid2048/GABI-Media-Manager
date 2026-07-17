import React, { useRef, useEffect, useState } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { FaGripLines } from 'react-icons/fa';
import { useLanguage } from '../../lang/LanguageContext';
import { GROUP_LABEL_LIST } from '../../constants/lyrics';

const StepArrange = ({ data, onChange, onNext, onPrev }) => {
  const { locale } = useLanguage();

  const handleReorder = (newOrder) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{locale('lyric_editor.slide_order')}</h3>
        <p className="text-gray-400 text-sm">{locale('lyric_editor.drag_to_reorder')}</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <Reorder.Group axis="y" values={data.slides || []} onReorder={handleReorder} className="space-y-3">
          <AnimatePresence>
            {(data.slides || []).map((slide) => (
              <Reorder.Item
                key={slide.page}
                value={slide}
                className="cursor-grab active:cursor-grabbing"
              >
                <SlidePreviewCard
                  slide={slide}
                  tagLabel={getTagLabel(slide.tag)}
                  tagColor={getTagColor(slide.tag)}
                  pageNum={slide.page}
                />
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

// 預覽卡片組件
const SlidePreviewCard = ({ slide, tagLabel, tagColor, pageNum }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setScale(width / 1920);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const lines = (slide.content || '').split('\n').filter(l => l.trim());
  const isEmpty = lines.length === 0;

  return (
    <div
      className="bg-gray-700 rounded-lg border-2 overflow-hidden"
      style={{ borderColor: tagColor }}
    >
      {/* 頂部標籤欄 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800/80">
        <div className="flex items-center gap-2">
          <div className="text-gray-400">
            <FaGripLines size={14} />
          </div>
          <span className="text-white text-sm font-bold">#{pageNum}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: tagColor }}
          >
            {tagLabel}
          </span>
        </div>
      </div>

      {/* 內容預覽區（16:9 比例） */}
      <div
        ref={containerRef}
        className="relative bg-gray-900 w-full"
        style={{ aspectRatio: '16/9' }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {isEmpty ? (
            <span className="text-gray-600 text-sm">{locale('lyric_editor.empty_slide')}</span>
          ) : (
            <div className="text-center w-full" style={{ transform: `scale(${scale * 40})`, transformOrigin: 'center' }}>
              {lines.slice(0, 6).map((line, i) => (
                <p key={i} className="text-white text-xs leading-tight truncate" style={{ fontSize: `${16 * scale}px` }}>
                  {line}
                </p>
              ))}
              {lines.length > 6 && (
                <p className="text-gray-500 text-xs mt-1">... ({lines.length - 6} more)</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepArrange;
