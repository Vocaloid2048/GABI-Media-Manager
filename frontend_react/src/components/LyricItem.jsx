import React, { useRef, useEffect, useState } from 'react';
import { useLyricItem } from '../hooks/useLyricItem';

const LyricItem = ({ slide, tagInfo, ccli, isTitlePage, showCopyright }) => {
  const containerRef = useRef(null);
  const [dynamicScale, setDynamicScale] = useState(1);

  const { textRef, calculateElementStyle, textStyle, bounds } = useLyricItem(slide, dynamicScale);

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

  // 計算中/英文文字框的位置
  const zhBounds = { x: 53, y: 47, width: 1819, height: 451 };
  const enBounds = { x: 53, y: 515, width: 1819, height: 517 };

  const scaledStyle = (b) => ({
    position: 'absolute',
    left: `${b.x * dynamicScale}px`,
    top: `${b.y * dynamicScale}px`,
    width: `${b.width * dynamicScale}px`,
    height: `${b.height * dynamicScale}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    boxSizing: 'border-box',
    overflow: 'hidden'
  });

  return (
    <div className="bg-gray-800 overflow-hidden">
      <div
        style={{ border: `2px solid ${tagInfo.colorHex}` }}
        className="relative rounded-t-lg"
        ref={containerRef}
      >
        <div className="pt-1 pb-4 px-4 h-full relative" style={{ aspectRatio: '16/9' }}>
          {/* 標題頁：單一文字框 (53,46,1773,412) — 頂置、靠左、width 撐滿 */}
          {isTitlePage && (
            <div style={{ ...scaledStyle(bounds), justifyContent: 'flex-start' }}>
              <p style={{ ...textStyle, width: '100%' }}>
                {slide.content}
              </p>
            </div>
          )}

          {/* 歌詞頁：中文 (53,47,1819,451) 上半 + 英文 (53,515,1819,517) 下半 */}
          {!isTitlePage && (
            <>
              {/* 中文 Text2 - 最多 3 行 */}
              <div style={scaledStyle(zhBounds)}>
                <p style={{ ...textStyle, fontSize: `${115 * dynamicScale}px` }}>
                  {(slide.zhContent || '').split('\n').slice(0, 3).join('\n')}
                </p>
              </div>
              {/* 英文 Text - 最多 4 行 */}
              <div style={scaledStyle(enBounds)}>
                <p style={{ ...textStyle, fontSize: `${90 * dynamicScale}px`, textAlign: 'center' }}>
                  {(slide.enContent || '').split('\n').slice(0, 4).join('\n')}
                </p>
              </div>
            </>
          )}

          {isTitlePage && showCopyright && ccli && (
            <div
              className="absolute text-white text-right"
              style={{
                left: `${1067 * dynamicScale}px`,
                top: `${599 * dynamicScale}px`,
                width: `${823 * dynamicScale}px`,
                height: `${447 * dynamicScale}px`,
                fontSize: `${50 * dynamicScale}px`,
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'flex-end'
              }}
            >
              <div style={{ whiteSpace: 'pre-line' }}>
                {ccli.songTitle && <div>{ccli.songTitle}</div>}
                {ccli.author && <div>{ccli.author}</div>}
                {(ccli.publisher || ccli.copyrightYear) && (
                  <div>
                    {ccli.publisher}
                    {ccli.publisher && ccli.copyrightYear && ' © '}
                    {ccli.copyrightYear}
                  </div>
                )}
              </div>
            </div>
          )}
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