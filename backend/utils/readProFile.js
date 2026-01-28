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
        // 取得群組名稱作為 tag
        const tag = cueToGroupMap[cue.uuid.string] || 'verse';
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
                      // 取得群組名稱作為 tag
                      const tag = cueToGroupMap[cue.uuid.string] || 'verse';

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
    console.error('Error extracting song data from ProPresenter file:', error);
    throw error;
  }
}

module.exports = {
  extractSongData,
  extractSongDataFromJSON
};