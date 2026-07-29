// 群組標籤映射表（與 genProFile.js 保持一致）
const GROUP_LABEL_LIST = {
  "VERSE": { colorHex: "#0072C6", en: "Verse", zh_cn: "主歌", zh_hk: "主歌" },
  "VERSE1": { colorHex: "#0072C6", en: "Verse 1", zh_cn: "主歌1", zh_hk: "主歌1" },
  "VERSE2": { colorHex: "#0072C6", en: "Verse 2", zh_cn: "主歌2", zh_hk: "主歌2" },
  "VERSE3": { colorHex: "#0072C6", en: "Verse 3", zh_cn: "主歌3", zh_hk: "主歌3" },
  "VERSE4": { colorHex: "#0072C6", en: "Verse 4", zh_cn: "主歌4", zh_hk: "主歌4" },
  "VERSE5": { colorHex: "#005A9E", en: "Verse 5", zh_cn: "主歌5", zh_hk: "主歌5" },
  "VERSE6": { colorHex: "#002050", en: "Verse 6", zh_cn: "主歌6", zh_hk: "主歌6" },
  "CHORUS": { colorHex: "#D41243", en: "Chorus", zh_cn: "副歌", zh_hk: "副歌" },
  "CHORUS1": { colorHex: "#D41243", en: "Chorus 1", zh_cn: "副歌1", zh_hk: "副歌1" },
  "CHORUS2": { colorHex: "#D41243", en: "Chorus 2", zh_cn: "副歌2", zh_hk: "副歌2" },
  "CHORUS3": { colorHex: "#5B0025", en: "Chorus 3", zh_cn: "副歌3", zh_hk: "副歌3" },
  "CHORUS4": { colorHex: "#D41243", en: "Chorus 4", zh_cn: "副歌4", zh_hk: "副歌4" },
  "BRIDGE": { colorHex: "#6F00FF", en: "Bridge", zh_cn: "桥段", zh_hk: "橋段" },
  "BRIDGE1": { colorHex: "#6F00FF", en: "Bridge 1", zh_cn: "桥段1", zh_hk: "橋段1" },
  "BRIDGE2": { colorHex: "#5000B8", en: "Bridge 2", zh_cn: "桥段2", zh_hk: "橋段2" },
  "BRIDGE3": { colorHex: "#300060", en: "Bridge 3", zh_cn: "桥段3", zh_hk: "橋段3" },
  "PRECHORUS": { colorHex: "#D41299", en: "PreChorus", zh_cn: "副歌预热", zh_hk: "副歌預熱" },
  "TAG": { colorHex: "#E71D36", en: "Tag", zh_cn: "标签", zh_hk: "標籤" },
  "INTRO": { colorHex: "#BCA922", en: "Intro", zh_cn: "前奏", zh_hk: "前奏" },
  "ENDING": { colorHex: "#BCA922", en: "Ending", zh_cn: "结尾", zh_hk: "結尾" },
  "OUTRO": { colorHex: "#8A7B15", en: "Outro", zh_cn: "结尾", zh_hk: "結尾" },
  "INTERLUDE": { colorHex: "#28C840", en: "Interlude", zh_cn: "间奏", zh_hk: "間奏" },
  "VAMP": { colorHex: "#28C840", en: "Vamp", zh_cn: "即兴伴奏", zh_hk: "即興伴奏" },
  "TURNAROUND": { colorHex: "#28C840", en: "Turnaround", zh_cn: "变调", zh_hk: "變調" },
  "BLANK": { colorHex: "#000000", en: "Blank", zh_cn: "空白", zh_hk: "空白" }
};

// 生成唯一 ID
function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(0, 6);
}

/**
 * 判斷一行文字是否為標籤行
 * 支援格式：[Verse 1], Verse 1, [Chorus], Chorus, 主歌, 副歌 等
 * 參照 GROUP_LABEL_LIST 映射表
 * @param {string} line 
 * @returns {string|null} 返回對應的標籤 key，如果不是標籤行則返回 null
 */
function detectTag(line) {
  if (!line || !line.trim()) return null;
  
  const trimmed = line.trim();
  
  // 移除 [] 包裹
  let cleaned = trimmed;
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  
  // 如果移除 [] 後為空，返回 null
  if (!cleaned) return null;
  
  const upperCleaned = cleaned.toUpperCase().replace(/\s+/g, '');
  
  // 1. 直接匹配英文 key（如 VERSE1, CHORUS）
  if (GROUP_LABEL_LIST[upperCleaned]) {
    return upperCleaned;
  }
  
  // 2. 匹配 GROUP_LABEL_LIST 中的 en / zh_cn / zh_hk
  for (const [key, val] of Object.entries(GROUP_LABEL_LIST)) {
    const enNoSpace = val.en ? val.en.toUpperCase().replace(/\s+/g, '') : '';
    const zhCnNoSpace = val.zh_cn ? val.zh_cn.replace(/\s+/g, '') : '';
    const zhHkNoSpace = val.zh_hk ? val.zh_hk.replace(/\s+/g, '') : '';
    
    const cleanedNoSpace = cleaned.toUpperCase().replace(/\s+/g, '');
    
    if (
      cleanedNoSpace === enNoSpace ||
      cleanedNoSpace === zhCnNoSpace ||
      cleanedNoSpace === zhHkNoSpace
    ) {
      return key;
    }
  }
  
  return null;
}

/**
 * 解析純文字歌詞，返回段落列表
 * @param {string} text - 純文字歌詞
 * @returns {Array} [{id, content, tag, order}]
 */
function parseLyricText(text) {
  if (!text || !text.trim()) return [];
  
  // 統一換行符
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');
  
  const stanzas = [];
  let currentStanzaLines = [];
  let currentTag = null;
  let order = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tag = detectTag(line);
    
    if (tag) {
      // 這是一個標籤行
      // 如果之前有累積的段落內容，先保存
      if (currentStanzaLines.length > 0) {
        const content = currentStanzaLines.join('\n').trim();
        if (content) {
          stanzas.push({
            id: generateId(),
            content: content,
            tag: currentTag,
            order: order++
          });
        }
        currentStanzaLines = [];
      }
      
      // 設定新的標籤
      currentTag = tag;
    } else if (line.trim() === '' && currentStanzaLines.length > 0) {
      // 空行表示段落結束
      const content = currentStanzaLines.join('\n').trim();
      if (content) {
        stanzas.push({
          id: generateId(),
          content: content,
          tag: currentTag,
          order: order++
        });
      }
      currentStanzaLines = [];
      // 空行只結束當前段落，不重置標籤；
      // 若下一段沒有新標籤行，則沿用上一段標籤（例如同一 [Chorus] 因空行分頁）。
    } else {
      // 普通歌詞行
      currentStanzaLines.push(line);
    }
  }
  
  // 處理最後一個段落
  if (currentStanzaLines.length > 0) {
    const content = currentStanzaLines.join('\n').trim();
    if (content) {
      stanzas.push({
        id: generateId(),
        content: content,
        tag: currentTag,
        order: order++
      });
    }
  }
  
  return stanzas;
}

/**
 * 合併中英段落為 slide 結構
 * @param {Array} zhStanzas - 中文段落
 * @param {Array} enStanzas - 英文段落
 * @param {Array} pairings - 配對關係 [{zhId, enId}]
 * @returns {Array} slides [{page, tag, zhContent, enContent, content}]
 */
function buildSlides(zhStanzas, enStanzas, pairings, layoutMode = 'interleave', layoutSwap = false) {
  const slides = [];
  let page = 1;
  
  // 建立 ID 到 stanza 的映射
  const zhMap = new Map(zhStanzas.map(s => [s.id, s]));
  const enMap = new Map(enStanzas.map(s => [s.id, s]));
  
  // 按 pairings 順序生成 slides
  for (const pairing of pairings) {
    const zhStanza = zhMap.get(pairing.zhId);
    const enStanza = enMap.get(pairing.enId);
    
    const zhContent = zhStanza ? zhStanza.content : '';
    const enContent = enStanza ? enStanza.content : '';
    
    // 決定標籤：優先使用中文段落的標籤，若無則使用英文段落的標籤
    const tag = (zhStanza && zhStanza.tag) || (enStanza && enStanza.tag) || 'VERSE';
    
    // 根據排版模式合併內容
    const content = mergeContent(zhContent, enContent, layoutMode, layoutSwap);
    
    slides.push({
      page: page++,
      tag: tag,
      zhContent: zhContent,
      enContent: enContent,
      content: content
    });
  }
  
  return slides;
}

/**
 * 根據排版模式合併中英內容
 */
function mergeContent(zhContent, enContent, layoutMode, layoutSwap) {
  const first = layoutSwap ? enContent : zhContent;
  const second = layoutSwap ? zhContent : enContent;
  
  switch (layoutMode) {
    case 'interleave':
      return mergeInterleave(first, second);
    case 'top-bottom':
    case 'center-split':
    default:
      // 先全部中文，再換行，再全部英文
      if (first && second) {
        return first + '\n\n' + second;
      }
      return first || second || '';
  }
}

/**
 * 中英交錯：一行中文一行英文交替
 */
function mergeInterleave(zhContent, enContent) {
  if (!zhContent && !enContent) return '';
  if (!zhContent) return enContent;
  if (!enContent) return zhContent;
  
  const zhLines = zhContent.split('\n').filter(l => l.trim());
  const enLines = enContent.split('\n').filter(l => l.trim());
  
  const result = [];
  const maxLen = Math.max(zhLines.length, enLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (zhLines[i]) result.push(zhLines[i]);
    if (enLines[i]) result.push(enLines[i]);
  }
  
  return result.join('\n');
}

/**
 * 自動配對中英段落（簡單按順序一對一配對）
 * @param {Array} zhStanzas 
 * @param {Array} enStanzas 
 * @returns {Array} [{zhId, enId}]
 */
function autoPairStanzas(zhStanzas, enStanzas) {
  const pairings = [];
  const maxLen = Math.max(zhStanzas.length, enStanzas.length);
  
  for (let i = 0; i < maxLen; i++) {
    pairings.push({
      zhId: zhStanzas[i] ? zhStanzas[i].id : null,
      enId: enStanzas[i] ? enStanzas[i].id : null
    });
  }
  
  return pairings;
}

module.exports = {
  parseLyricText,
  buildSlides,
  mergeContent,
  autoPairStanzas,
  detectTag,
  GROUP_LABEL_LIST
};
