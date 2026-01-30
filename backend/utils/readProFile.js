// 群組標籤映射表
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

// 反查映射表：中英文→英文大寫key
function mapTagToKey(tag) {
  if (!tag) return tag;
  const upperTag = tag.toUpperCase().replace(/\s+/g, '');
  if (GROUP_LABEL_LIST[upperTag]) return upperTag;
  // 支援中英文反查
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
  return tag; // 若找不到則保留原名
}
const protobuf = require("protobufjs");
const path = require("path");
const fs = require("fs");

// RTF 到純文字的轉換函數
function rtfToText(rtfData) {
  try {
    // RTF 數據是 base64 編碼的
    const rtfString = Buffer.from(rtfData, 'base64').toString('utf8');

    // 簡單的 RTF 解析：移除控制字符，保留文字內容
    let text = rtfString;

    // 處理 Unicode 字符 \uXXXX
    // RTF 中的 Unicode 字符格式：\u-XXXX ? 或 \uXXXX ?
    text = text.replace(/\\u(-?\d+)\s*\?/g, (match, code) => {
      const charCode = parseInt(code);
      if (charCode < 0) {
        // 負數表示 Unicode 字符，使用 65536 + charCode
        return String.fromCharCode(65536 + charCode);
      }
      return String.fromCharCode(charCode);
    });

    // 移除 RTF 標頭
    const rtfHeaderEnd = text.indexOf('\\viewkind');
    if (rtfHeaderEnd !== -1) {
      text = text.substring(rtfHeaderEnd);
    }

    // 移除 RTF 控制字符
    text = text.replace(/\\par/g, '\n'); // 先處理段落分隔
    text = text.replace(/\\[a-z]+[\d-]*/gi, ''); // 移除控制字（包含負數）
    text = text.replace(/\\\S*/g, ''); // 移除所有以反斜槓開頭的序列
    text = text.replace(/[{}]/g, ''); // 移除大括號
    text = text.replace(/[^\u4e00-\u9fff\u0020-\u007e\n]+/g, ''); // 只保留中文、英文、數字、空格和換行
    text = text.replace(/[ \t]+/g, ' '); // 只壓縮連續的空格和製表符，保留換行

    return text.trim().replace(/\n\n/g, '\n');
  } catch (error) {
    console.error('Error converting RTF to text:', error);
    return '';
  }
}

// 載入 ProPresenter proto 檔案
async function loadProPresenterProto() {
  const root = new protobuf.Root();

  // 載入所有 proto 檔案
  const protoDir = path.join(__dirname, "../proto");
  const protoFiles = fs.readdirSync(protoDir).filter(f => f.endsWith(".proto"));
  await root.load(
    protoFiles.map(f => path.join(protoDir, f))
  );

  return root;
}

// 從 ProPresenter JSON 導出格式提取歌曲數據（參考 doc_output.json）
function extractSongDataFromJSON(jsonData) {
  const name = jsonData.name || 'Unknown Song';

  const cueGroups = jsonData.cueGroups || [];
  const cues = jsonData.cues || [];

  // 建立 cue UUID 到群組名稱的映射
  const cueToGroupMap = {};
  cueGroups.forEach(group => {
    const groupName = group.group.name;
    if (group.cueIdentifiers) {
      group.cueIdentifiers.forEach(cueId => {
        cueToGroupMap[cueId.string] = groupName;
      });
    }
  });

  const content = [];
  let pageNumber = 1;

  cues.forEach((cue, index) => {
    // 取得群組名稱作為 tag
    const tag = cueToGroupMap[cue.uuid.string] || 'verse';

    // 從 actions 中提取文字內容
    let slideContent = '';
    if (cue.actions && cue.actions.length > 0) {
      cue.actions.forEach(action => {
        if (action.slide && action.slide.presentation && action.slide.presentation.baseSlide) {
          const elements = action.slide.presentation.baseSlide.elements;
          if (elements && elements.length > 0) {
            elements.forEach(elementWrapper => {
              if (elementWrapper.element && elementWrapper.element.text && elementWrapper.element.text.rtfData) {
                // 解碼 RTF 為純文字
                const decodedText = rtfToText(elementWrapper.element.text.rtfData);
                // 只保留包含實際文字內容的元素，過濾掉只有字體信息的空元素
                const cleanText = decodedText.split('\nd')
                  .filter(line => {
                    const trimmed = line.trim();
                    // 移除只包含字體信息和分號的行（至少3個分號）
                    if (/^[A-Za-z\s]*;{3,}/.test(trimmed)) {
                      return false; // 移除字體信息行
                    }
                    return true; // 保留其他行
                  })
                  .join('\n')
                  .trim();
                // 移除 RTF 殘留字符和字體信息前綴，但保留英文內容
                const finalText = cleanText.replace(/;+/g, '').trim();
                if (finalText) {
                  // 在元素之間添加段落分隔符
                  if (slideContent) {
                    slideContent += '\n' + finalText;
                  } else {
                    slideContent += finalText;
                  }
                }
              }
            });
          }
        }
      });
    }

    if (tag) {
      content.push({
        page: pageNumber++,
        tag: tag,
        content: slideContent.trim()
      });
    }
  });

  return {
    name,
    content
  };
}

// 從 ProPresenter 文件提取歌曲數據
async function extractSongData(proFilePath) {
  try {
    const root = await loadProPresenterProto();
    const Presentation = root.lookupType("rv.data.Presentation");

    // 讀取二進制文件
    const buffer = fs.readFileSync(proFilePath);

    // 解碼 Presentation
    const presentation = Presentation.decode(buffer);

    const name = presentation.name || 'Unknown Song';

    const content = [];

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

    // 遍歷 cues
    if (presentation.cues && presentation.cues.length > 0) {
      presentation.cues.forEach((cue, cueIndex) => {
        // 取得群組名稱作為 tag, tag可以是空的，表示沒有分類
        let tag = cueToGroupMap[cue.uuid.string];
        tag = mapTagToKey(tag);
        if (cue.actions && cue.actions.length > 0) {
          cue.actions.forEach((action, actionIndex) => {
            if (action.slide && action.slide.presentation && action.slide.presentation.baseSlide) {
              const slide = action.slide.presentation.baseSlide;
              if (slide.elements && slide.elements.length > 0) {
                slide.elements.forEach((elementWrapper, elementIndex) => {
                  if (elementWrapper.element && elementWrapper.element.text && elementWrapper.element.text.rtfData) {
                    const rtfData = elementWrapper.element.text.rtfData;
                    const decodedText = rtfToText(rtfData);
                    // 只保留包含實際文字內容的元素，過濾掉只有字體信息的空元素
                    const cleanText = decodedText.split('\nd')
                      .filter(line => {
                        const trimmed = line.trim();
                        // 移除只包含字體信息和分號的行（至少3個分號）
                        if (/^[A-Za-z\s]*;{3,}/.test(trimmed)) {
                          return false; // 移除字體信息行
                        }
                        return true; // 保留其他行
                      })
                      .join('\n')
                      .trim();
                    // 移除 RTF 殘留字符和字體信息前綴，但保留英文內容
                    const textContent = cleanText.replace(/;+/g, '').trim();

                    if (textContent.trim()) {
                      content.push({
                        page: content.length + 1,
                        tag: tag,
                        content: textContent.trim()
                      });
                    }
                  }
                });
              }
            }
          });
        }
      });
    }

    return {
      name,
      content
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  extractSongData,
  extractSongDataFromJSON
};