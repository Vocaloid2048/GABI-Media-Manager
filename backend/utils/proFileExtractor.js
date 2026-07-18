const protobuf = require("protobufjs");
const path = require("path");
const fs = require("fs");

// 群組標籤映射表（與 readProFile.js 保持一致）
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

function mapTagToKey(tag) {
  if (!tag) return tag;
  const upperTag = tag.toUpperCase().replace(/\s+/g, '');
  if (GROUP_LABEL_LIST[upperTag]) return upperTag;
  for (const [key, val] of Object.entries(GROUP_LABEL_LIST)) {
    if (
      tag === val.en ||
      tag === val.zh_cn ||
      tag === val.zh_hk ||
      tag.replace(/\s+/g, '') === val.en.replace(/\s+/g, '') ||
      tag.replace(/\s+/g, '') === val.zh_cn.replace(/\s+/g, '') ||
      tag.replace(/\s+/g, '') === val.zh_hk.replace(/\s+/g, '')
    ) {
      return key;
    }
  }
  return tag;
}

// RTF 到純文字的轉換函數（與 readProFile.js 一致）
function rtfToText(rtfData) {
  try {
    const rtfString = Buffer.from(rtfData, 'base64').toString('utf8');
    let text = rtfString;

    text = text.replace(/\\u(-?\d+)\s*\?/g, (match, code) => {
      const charCode = parseInt(code);
      if (charCode < 0) {
        return String.fromCharCode(65536 + charCode);
      }
      return String.fromCharCode(charCode);
    });

    const rtfHeaderEnd = text.indexOf('\\viewkind');
    if (rtfHeaderEnd !== -1) {
      text = text.substring(rtfHeaderEnd);
    }

    text = text.replace(/\\par/g, '\n');
    text = text.replace(/\\[a-z]+[\d-]*/gi, '');
    text = text.replace(/\\\S*/g, '');
    text = text.replace(/[{}]/g, '');
    text = text.replace(/[^\u4e00-\u9fff\u0020-\u007e\n]+/g, '');
    text = text.replace(/[ \t]+/g, ' ');

    return text.trim().replace(/\n\n/g, '\n');
  } catch (error) {
    console.error('Error converting RTF to text:', error);
    return '';
  }
}

// 載入 ProPresenter proto 檔案
async function loadProPresenterProto() {
  const root = new protobuf.Root();
  const protoDir = path.join(__dirname, "../proto");
  const protoFiles = fs.readdirSync(protoDir).filter(f => f.endsWith(".proto"));
  await root.load(
    protoFiles.map(f => path.join(protoDir, f))
  );
  return root;
}

/**
 * 從 .pro 檔案提取所有 slide 的內容（每個 cue 一個 slide）
 * 返回原始內容，不區分語言，由前端用戶手動標註
 * @param {string} proFilePath - .pro 檔案路徑
 * @returns {Promise<{name: string, slides: Array}>} 
 *   slides: [{page, content, tag, cueName}]
 */
async function extractAllSlides(proFilePath) {
  try {
    const root = await loadProPresenterProto();
    const Presentation = root.lookupType("rv.data.Presentation");
    const buffer = fs.readFileSync(proFilePath);
    const presentation = Presentation.decode(buffer);

    const name = presentation.name || 'Unknown Song';
    const slides = [];

    // 建立 cue UUID 到群組名稱的映射
    const cueToGroupMap = {};
    if (presentation.cueGroups) {
      presentation.cueGroups.forEach(group => {
        const groupName = group.group.name;
        if (group.cueIdentifiers) {
          group.cueIdentifiers.forEach(cueId => {
            cueToGroupMap[cueId.string] = groupName;
          });
        }
      });
    }

    // 遍歷 cues，每個 cue 視為一個 slide
    if (presentation.cues && presentation.cues.length > 0) {
      presentation.cues.forEach((cue, cueIndex) => {
        let tag = cueToGroupMap[cue.uuid.string];
        tag = mapTagToKey(tag);
        
        let slideContent = '';
        
        // 提取每個 text element 的獨立內容
        const elements = [];
        
        if (cue.actions && cue.actions.length > 0) {
          cue.actions.forEach(action => {
            if (action.slide && action.slide.presentation && action.slide.presentation.baseSlide) {
              const slide = action.slide.presentation.baseSlide;
              if (slide.elements && slide.elements.length > 0) {
                slide.elements.forEach((elementWrapper) => {
                  if (elementWrapper.element && elementWrapper.element.text && elementWrapper.element.text.rtfData) {
                    const rtfData = elementWrapper.element.text.rtfData;
                    const decodedText = rtfToText(rtfData);
                    const cleanText = decodedText.split('\nd')
                      .filter(line => {
                        const trimmed = line.trim();
                        if (/^[A-Za-z\s]*;{3,}/.test(trimmed)) {
                          return false;
                        }
                        return true;
                      })
                      .join('\n')
                      .trim();
                    const textContent = cleanText.replace(/;+/g, '').trim();

                    if (textContent.trim()) {
                      elements.push(textContent);
                      if (slideContent) {
                        slideContent += '\n' + textContent;
                      } else {
                        slideContent += textContent;
                      }
                    }
                  }
                });
              }
            }
          });
        }

        // 即使 content 為空也保留（空白 slide），但標記為 BLANK
        const finalTag = slideContent.trim() ? tag : 'BLANK';
        
        slides.push({
          page: cueIndex + 1,
          content: slideContent.trim(),
          elements: elements,
          tag: finalTag || 'VERSE',
          cueName: cue.name || ''
        });
      });
    }

    return { name, slides };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  extractAllSlides
};
