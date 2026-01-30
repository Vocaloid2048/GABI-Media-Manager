import { useState, useEffect, useRef } from 'react';

export function fontNameToCss(fontName, fontFamily) {
  if (!fontName && !fontFamily) return 'sans-serif';
  const name = (fontName || fontFamily || '').toLowerCase();
  if (name.includes('jheng') || name.includes('microsoft jheng')) return '"Microsoft JhengHei", "Noto Sans TC", sans-serif';
  if (name.includes('ping') || name.includes('heiti') || name.includes('ming')) return '"PingFang TC", "Noto Sans TC", sans-serif';
  if (name.includes('arial')) return 'Arial, Helvetica, sans-serif';
  if (name.includes('roboto')) return 'Roboto, system-ui, sans-serif';
  return 'sans-serif';
}

export function measureTextWidth(text, font) {
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
}

export function useLyricItem(slide, dynamicScale) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [computedFontPx, setComputedFontPx] = useState(null);

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
      justifyContent: slide.page === 1 ? 'flex-start' : 'center',
      padding: '0px',
      boxSizing: 'border-box'
    };
  };

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
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: slide.page === 1 ? 'left' : 'center',
    margin: 0
  };

  return {
    containerRef,
    textRef,
    calculateElementStyle,
    textStyle,
    bounds
  };
}