import React, { useRef, useEffect, useState } from 'react';
import { useLyricItem } from '../hooks/useLyricItem';

const LyricItem = ({ slide, tagInfo }) => {
  const containerRef = useRef(null);
  const [dynamicScale, setDynamicScale] = useState(1);

  const { textRef, calculateElementStyle, textStyle } = useLyricItem(slide, dynamicScale);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const newScale = width / 1920;
        setDynamicScale(newScale);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="bg-gray-800 overflow-hidden">
      <div
        style={{ border: `2px solid ${tagInfo.colorHex}` }}
        className="relative rounded-t-lg"
        ref={containerRef}
      >
        <div className="pt-1 pb-4 px-4 h-full relative" style={{ aspectRatio: '16/9' }}>
          <div style={calculateElementStyle()}>
            <p ref={textRef} style={textStyle}>
              {slide.content}
            </p>
          </div>
        </div>
      </div>

      <div
        className="px-3 py-2 text-white text-sm font-medium flex justify-between items-center rounded-b-lg"
        style={{ backgroundColor: tagInfo.colorHex }}
      >
        <span>{slide.page}</span>
        <span>{tagInfo.labelName}</span>
      </div>
    </div>
  );
};

export default LyricItem;