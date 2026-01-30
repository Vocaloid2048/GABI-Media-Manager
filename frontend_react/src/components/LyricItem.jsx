import React, { useRef, useEffect, useState } from 'react';

const fontNameToCss = (fontName, fontFamily) => {
  if (!fontName && !fontFamily) return 'sans-serif';
  const name = (fontName || fontFamily || '').toLowerCase();
  if (name.includes('jheng') || name.includes('microsoft jheng')) return '"Microsoft JhengHei", "Noto Sans TC", sans-serif';
  if (name.includes('ping') || name.includes('heiti') || name.includes('ming')) return '"PingFang TC", "Noto Sans TC", sans-serif';
  if (name.includes('arial')) return 'Arial, Helvetica, sans-serif';
  if (name.includes('roboto')) return 'Roboto, system-ui, sans-serif';
  return 'sans-serif';
};

const measureTextWidth = (text, font) => {
  const canvas = measureTextWidth._canvas || (measureTextWidth._canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  const lines = String(text || '').split('\n');
  let max = 0;
  lines.forEach(l => {
    const m = ctx.measureText(l).width;
    if (m > max) max = m;
  });
  return max;
};

const LyricItem = ({ slide, tagInfo }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [computedFontPx, setComputedFontPx] = useState(null);
  const [dynamicScale, setDynamicScale] = useState(1);

  // Hardcoded bounds for 青少崇拜 theme
  const bounds = slide.page === 1 
    ? { x: 52.61261261261268, y: 45.630630630630606, width: 1772.972972972973, height: 161.35135135135135 }
    : { x: 52.61261261261268, y: 45.63063063063058, width: 1819.099099099099, height: 494.3693693693694 };

  const calculateElementStyle = () => {
    const scaledX = bounds.x * dynamicScale;
    const scaledY = bounds.y * dynamicScale;
    const scaledWidth = bounds.width * dynamicScale;
    const scaledHeight = bounds.height * dynamicScale;

    return {
      position: 'absolute',
      left: `${scaledX}px`,
      top: `${scaledY}px`,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: slide.page === 1 ? 'flex-start' : 'center',
      padding: '0px',
      boxSizing: 'border-box'
    };
  };

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

  useEffect(() => {
    // compute adaptive font size when mounted or when content/theme change
    const compute = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const availableWidth = container.clientWidth - 16; // padding
      const availableHeight = container.clientHeight - 16;
      const baseFontPx = (slide.page === 1 ? 130 : 115) * dynamicScale;
      // prepare CSS font string for canvas measure
      const cssFont = `bold ${baseFontPx}px Microsoft JhengHei UI, sans-serif`;
      const text = slide.content || '';
      const maxTextWidth = measureTextWidth(text, cssFont);

      // 確保字體一樣大小，不縮小；允許文字換行處理
      let finalFont = baseFontPx;

      setComputedFontPx(finalFont);
    };

    // compute after next paint to ensure element sizes known
    setTimeout(compute, 10);
  }, [slide.content, slide.page, dynamicScale]);
  const textColor = 'rgb(255,255,255)';

  const fontFamilyCss = 'Microsoft JhengHei UI, sans-serif';
  const baseFontPx = (slide.page === 1 ? 130 : 115) * dynamicScale;

  const textStyle = {
    fontFamily: fontFamilyCss,
    fontSize: `${baseFontPx}px`,
    fontWeight: '700',
    color: textColor,
    textShadow: `0 1px 0 rgba(0,0,0,0.8), 0 -1px 0 rgba(0,0,0,0.8)`,
    lineHeight: '1.1',
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
    textAlign: slide.page === 1 ? 'left' : 'center',
    margin: 0
  };

  return (
    <div className="bg-gray-800 overflow-hidden">
      {/* 16:9 content area */}
      <div
        style={{ border: `2px solid ${tagInfo.colorHex}` }}
        className="relative rounded-t-lg"
        ref={containerRef}
      >
        {/* Page content with positioned text */}
        <div className="pt-1 pb-4 px-4 h-full relative" style={{ aspectRatio: '16/9' }}>
          <div style={calculateElementStyle()}>
            <p ref={textRef} style={textStyle}>
              {slide.content}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar with page number and tag */}
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