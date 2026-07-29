const protobuf = require("protobufjs");
const path = require("path");
const fs = require("fs");

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
  "BLANK": { colorHex: "#000000", en: "Blank", zh_cn: "空白", zh_hk: "空白" },
  "TITLE": { colorHex: "#FFA500", en: "Title", zh_cn: "标题", zh_hk: "標題" }
};

const COPYRIGHT_LABEL_LIST = {
  composer: { en: "Composer: ", zh_cn: "作曲：", zh_hk: "作曲：" },
  lyricist: { en: "Lyricist: ", zh_cn: "填词：", zh_hk: "填詞：" },
  arranger: { en: "Arranger: ", zh_cn: "编曲：", zh_hk: "編曲：" },
  publisher: { en: "Publisher: ", zh_cn: "出版：", zh_hk: "出版：" }
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

// 載入主題文件
async function loadTheme(themePath) {
  const root = await loadProPresenterProto();
  const buffer = fs.readFileSync(themePath);

  const candidates = [
    'rv.data.Template.Document'
  ];

  for (const t of candidates) {
    const type = root.lookupType(t);
    if (!type) continue;
    try {
      const msg = type.decode(buffer);
      const obj = type.toObject(msg, { longs: String, enums: Number, bytes: String, defaults: true });
      if (obj && obj.slides) {
        return obj.slides;
      }
    } catch (e) {
      // ignore decode errors
    }
  }

  throw new Error("Could not decode theme file");
}

// 將純文本轉換為 RTF 格式，使用主題 RTF 作為模板
// 主題模板因 3-run 間有 \par\pard 分隔（3 個獨立段落），若同時填入文字會堆疊顯示。
// 只在第一個 run 填入用戶文字，其餘 2 個 run 清空（保留 strokec 描邊色但無文字內容）。
// 在用戶文字前加 1 個空格（防止左邊界 stroke 裁切首字）。
function textToRTF(text, baseSlide, fontName = "MicrosoftJhengHeiUI", fontSize = 72, bold = false, rtfTemplate = null, alignment = null) {
  const templateRtf = rtfTemplate
    ? Buffer.from(rtfTemplate, 'base64').toString('utf8')
    : Buffer.from(baseSlide.elements.find(e => e.info === 2).element.text.rtfData, 'base64').toString('utf8');

  // 在用戶文字前加 1 個空格：避免左邊界 stroke 裁切首字
  const paddedText = ' ' + text;

  // 生成 RTF 轉義後的文字（不改變大小寫）
  const escapedText = paddedText
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, '\\par ')
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      if (code > 127) {
        return `\\u${code} ?`;
      }
      return char;
    })
    .join('');

  // 找出所有 \cb3 run 的邊界（從 \cb3 之後到 \par 或 }）
  const cbRuns = [];
  let pos = 0;
  while ((pos = templateRtf.indexOf('\\cb3', pos)) !== -1) {
    const afterMarker = pos + 4;
    let endPos = templateRtf.indexOf('\\par', afterMarker);
    const bracePos = templateRtf.indexOf('}', afterMarker);
    if (bracePos !== -1 && (endPos === -1 || bracePos < endPos)) {
      endPos = bracePos;
    }
    if (endPos === -1) endPos = templateRtf.length;
    cbRuns.push({ afterMarker, endPos });
    pos = endPos;
  }

  // 從後往���替換：只在第一個 run 填入文字，其餘清空（避免位置偏移）
  let result = templateRtf;
  for (let i = cbRuns.length - 1; i >= 0; i--) {
    const { afterMarker, endPos } = cbRuns[i];
    const replacement = i === 0 ? escapedText : '';
    result = result.substring(0, afterMarker) + replacement + result.substring(endPos);
  }

  // 如果需要左對齊，將 \qc（居中）替換為 \ql（左對齊）
  if (alignment === 'left') {
    result = result.replace(/\\qc/g, '\\ql');
  }

  return Buffer.from(result, 'utf8').toString('base64');
}

// 創建一個新的 text element，基於模板 element
function createTextElement(templateElement, bounds, fontName, fontSize, bold) {
  const cloned = JSON.parse(JSON.stringify(templateElement));
  cloned.element.uuid = { string: generateUUID() };
  cloned.element.bounds = {
    origin: { x: bounds.x, y: bounds.y },
    size: { width: bounds.width, height: bounds.height }
  };
  cloned.element.text.attributes.font.name = fontName;
  cloned.element.text.attributes.font.size = fontSize;
  cloned.element.text.attributes.font.bold = bold;
  cloned.element.text.attributes.font.family = fontName.replace(/(Bold|Regular|Italic)$/, '');
  cloned.element.text.attributes.font.face = bold ? 'Bold' : 'Regular';
  return cloned;
}

// 深拷貝 baseSlide 並更新 UUIDs
function cloneBaseSlide(baseSlide) {
  // 創建 element UUID 映射
  const elementUuidMap = new Map();
  baseSlide.elements.forEach(e => {
    elementUuidMap.set(e.element.uuid.string, generateUUID());
  });

  const cloned = {
    ...baseSlide,
    uuid: { string: generateUUID() },
    elements: baseSlide.elements.map(e => ({
      ...e,
      element: {
        ...e.element,
        uuid: { string: elementUuidMap.get(e.element.uuid.string) },
        text: e.element.text ? { ...e.element.text } : undefined
      }
    })),
    elementBuildOrder: baseSlide.elementBuildOrder ? baseSlide.elementBuildOrder.map(uuid => ({
      string: elementUuidMap.get(uuid.string) || uuid.string
    })) : []
  };
  return cloned;
}

// 從 songData 生成 ProPresenter 文件
async function generateProFile(songData, options = {}) {
  const { spacing = '1', addBlankPage = false, theme = 'default_Theme', labelLanguage = 'zh_hk', addTitlePage = true, showCopyright = true, copyrightLanguage = 'zh_hk' } = options;
  const themePath = path.join(__dirname, "theme", theme);
  try {
    const root = await loadProPresenterProto();
    const Presentation = root.lookupType("rv.data.Presentation");
    

    // 載入主題
    const themeSlides = await loadTheme(themePath);
    
    // 找到標題和歌詞模板
    const titleSlide = themeSlides.find(s => s.name === "詩歌名字");
    const lyricsSlide = themeSlides.find(s => s.name === "詩歌歌詞");
    
    if (!titleSlide || !lyricsSlide) {
      throw new Error("Theme does not contain required slides: 詩歌名字 and 詩歌歌詞");
    }

    // 基本文件結構
    const presentation = {
      applicationInfo: {
        platform: 2, // PLATFORM_WINDOWS
        platformVersion: {
          majorVersion: 10,
          patchVersion: 4294967295,
          build: "22631"
        },
        application: 1, // APPLICATION_PROPRESENTER
        applicationVersion: {
          majorVersion: 18,
          minorVersion: 4,
          patchVersion: 1,
          build: "302252289"
        }
      },
      uuid: {
        string: generateUUID()
      },
      name: songData.song_name,
      lastDateUsed: {
        seconds: Math.floor(Date.now() / 1000)
      },
      lastModifiedDate: {
        seconds: Math.floor(Date.now() / 1000)
      },
      background: {
        color: {
          alpha: 1
        }
      },
      selectedArrangement: {
        string: generateUUID()
      },
      arrangements: [],
      cueGroups: [],
      cues: [],
      ccli: {}
    };

    // 處理 CCLI 版權資訊
    if (songData.song_copyright) {
      try {
        const copyright = JSON.parse(songData.song_copyright);
        const authorParts = [];
        
        if (copyright.composer && copyright.composer.trim()) {
          authorParts.push(`${COPYRIGHT_LABEL_LIST.composer[copyrightLanguage] || COPYRIGHT_LABEL_LIST.composer.en}${copyright.composer.trim()}`);
        }
        if (copyright.lyricist && copyright.lyricist.trim()) {
          authorParts.push(`${COPYRIGHT_LABEL_LIST.lyricist[copyrightLanguage] || COPYRIGHT_LABEL_LIST.lyricist.en}${copyright.lyricist.trim()}`);
        }
        if (copyright.arranger && copyright.arranger.trim()) {
          authorParts.push(`${COPYRIGHT_LABEL_LIST.arranger[copyrightLanguage] || COPYRIGHT_LABEL_LIST.arranger.en}${copyright.arranger.trim()}`);
        }

        presentation.ccli = {
          author: authorParts.join('\n'),
          publisher: copyright.publisher || '',
          songTitle: songData.song_name || '',
          album: copyright.album || '',
          display: showCopyright
        };
        if (copyright.year && Number.isInteger(+copyright.year)) {
          presentation.ccli.copyrightYear = parseInt(copyright.year);
        }
      } catch (error) {
        console.warn('Failed to parse song_copyright:', error);
        presentation.ccli = {};
      }
    }

    // 生成 cues
    const cuesByGroup = {};

    // 處理 content 應用選項
    let processedContent = songData.content;
    if (Array.isArray(processedContent)) {
      processedContent = processedContent.map(slide => ({
        ...slide,
        content: slide.content.replace("\t", " ").replace(/ /g, (spacing === 'tab' ? '\t' : " ".repeat(parseInt(spacing) || 1)))
      }));

      // 如果添加首頁，但第一個不是標題頁，則插入標題頁
      if (addTitlePage && (!processedContent[0] || !processedContent[0].is_title)) {
        processedContent.unshift({
          is_title: true,
          content: songData.song_name || "Title",
          tag: 'TAG'
        });
      }

      // 如果不添加首頁，過濾掉標題頁
      if (!addTitlePage) {
        processedContent = processedContent.filter(slide => !slide.is_title);
      }
    }

    if (processedContent && Array.isArray(processedContent)) {
      processedContent.forEach((slide, index) => {
        let tagKey, cueName, assetName, baseSlideToUse, textContent, fontName, fontSize, bold;

        if (slide.is_title && addTitlePage) {
          // 標題頁
          tagKey = mapTagToKey('TAG');
          cueName = getGroupLabel(tagKey, labelLanguage) || 'TAG';
          baseSlideToUse = titleSlide.baseSlide;
          textContent = slide.content || songData.song_name || "Title";
          fontName = "MicrosoftJhengHeiUIBold";
          fontSize = 130;
          bold = true;
        } else {
          // 歌詞頁
          tagKey = mapTagToKey(slide.tag) || 'VERSE';
          cueName = getGroupLabel(tagKey, labelLanguage) || slide.tag || `Verse ${index + 1}`;
          baseSlideToUse = lyricsSlide.baseSlide;
          textContent = slide.content || "";
          fontName = "ArialMT";
          fontSize = 72;
          bold = false;
        }

        const cue = {
          uuid: {
            string: generateUUID()
          },
          name: cueName,
          isEnabled: true,
          completionTargetUuid: {
            string: "00000000-0000-0000-0000-000000000000"
          },
          completionActionUuid: {
            string: "00000000-0000-0000-0000-000000000000"
          },
          triggerTime: (slide.is_title && addTitlePage) ? {} : { time: 0 },
          actions: [
            {
              uuid: {
                string: generateUUID()
              },
              name: "Presentation Slide",
              label: {
                text: assetName
              },
              isEnabled: true,
              type: 11,
              slide: {
                presentation: {
                  baseSlide: cloneBaseSlide(baseSlideToUse)
                }
              }
            }
          ]
        };

        // 更新文字內容
        const textElement = cue.actions[0].slide.presentation.baseSlide.elements.find(e => e.info === 2);
        if (textElement) {
          textElement.element.text.rtfData = textToRTF(textContent, baseSlideToUse, fontName, fontSize, bold);
        }

        presentation.cues.push(cue);

        // 分組
        if (!cuesByGroup[tagKey]) {
          cuesByGroup[tagKey] = [];
        }
        cuesByGroup[tagKey].push(cue.uuid.string);
      });

      // 如果需要，添加空白頁
      if (addBlankPage) {
        const blankAssetName = undefined;
        const blankCue = {
          uuid: {
            string: generateUUID()
          },
          name: getGroupLabel('BLANK', labelLanguage),
          isEnabled: true,
          completionTargetUuid: {
            string: "00000000-0000-0000-0000-000000000000"
          },
          completionActionUuid: {
            string: "00000000-0000-0000-0000-000000000000"
          },
          triggerTime: {
            time: 0
          },
          actions: [
            {
              uuid: {
                string: generateUUID()
              },
              name: "Presentation Slide",
              label: {
                text: blankAssetName
              },
              isEnabled: true,
              type: 11,
              slide: {
                presentation: {
                  baseSlide: cloneBaseSlide(lyricsSlide.baseSlide)
                }
              }
            }
          ]
        };

        // 空白頁沒有文字內容
        const blankTextElement = blankCue.actions[0].slide.presentation.baseSlide.elements.find(e => e.info === 2);
        if (blankTextElement) {
          blankTextElement.element.text.rtfData = textToRTF("", lyricsSlide.baseSlide, "ArialMT", 72, false);
        }

        presentation.cues.push(blankCue);

        // 添加到BLANK分組
        if (!cuesByGroup['BLANK']) {
          cuesByGroup['BLANK'] = [];
        }
        cuesByGroup['BLANK'].push(blankCue.uuid.string);
      }
    }

    // 不使用 arrangements，直接讓所有 cues 啟用
    // presentation.arrangements = [];

    // 創建 cue groups 根據 tag 分組
    for (const [tagKey, cueUuids] of Object.entries(cuesByGroup)) {
      const groupLabel = GROUP_LABEL_LIST[tagKey] || GROUP_LABEL_LIST['VERSE'];
      const colorHex = groupLabel.colorHex;
      const r = parseInt(colorHex.slice(1, 3), 16) / 255;
      const g = parseInt(colorHex.slice(3, 5), 16) / 255;
      const b = parseInt(colorHex.slice(5, 7), 16) / 255;

      const cueGroup = {
        group: {
          uuid: {
            string: generateUUID()
          },
          name: getGroupLabel(tagKey, labelLanguage) || tagKey,
          color: {
            red: r,
            green: g,
            blue: b,
            alpha: 1
          }
        },
        cueIdentifiers: cueUuids.map(uuid => ({ string: uuid }))
      };
      presentation.cueGroups.push(cueGroup);
    }



    return presentation;
  } catch (error) {
    console.error("Error generating ProPresenter file:", error);
    throw error;
  }
}

// 生成 UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 保存 ProPresenter 文件
async function saveProFile(presentation, outputPath) {
  try {
    const root = await loadProPresenterProto();
    const Presentation = root.lookupType("rv.data.Presentation");

    const message = Presentation.create(presentation);
    const err = Presentation.verify(presentation);
    if (err) {
      throw new Error(err);
    }
    const buffer = Presentation.encode(message).finish();

    // 保存到文件
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    throw error;
  }
}

const getGroupLabel = (tagKey, labelLanguage = 'zh_hk') => {
  const groupLabel = GROUP_LABEL_LIST[tagKey] || GROUP_LABEL_LIST['VERSE'];
  return (() => {
    switch (labelLanguage) {
      case 'zh_cn':
        return groupLabel.zh_cn;
      case 'en':
        return groupLabel.en;
      case 'zh_hk':
        return groupLabel.zh_hk;
      default:
        return tagKey;
    }
  })();
}

/**
 * 生成多語言 .pro 檔案
 * @param {Object} params
 * @param {string} params.songName - 歌曲名稱
 * @param {Array} params.slides - slide 列表 [{page, tag, content}]
 * @param {Object} params.copyright - 版權資訊
 * @param {string} params.theme - 主題名稱
 * @param {string} params.labelLanguage - 標籤語言
 * @param {string} params.spacing - 空格間距
 * @param {boolean} params.addTitlePage - 是否添加標題頁
 * @param {boolean} params.showCopyright - 是否顯示版權
 * @param {string} params.copyrightLanguage - 版權語言
 * @returns {Promise<Object>} presentation 物件
 */
async function generateMultiLangProFile(params) {
  const {
    songName,
    slides,
    copyright = {},
    theme = 'default_Theme',
    labelLanguage = 'zh_hk',
    spacing = '1',
    addTitlePage = true,
    addBlankPage = false,
    showCopyright = true,
    copyrightLanguage = 'zh_hk',
    useIntroAsLabel = false
  } = params;

  const themePath = path.join(__dirname, "theme", theme);
  const root = await loadProPresenterProto();
  const Presentation = root.lookupType("rv.data.Presentation");

  // 載入主題
  const themeSlides = await loadTheme(themePath);
  const titleSlide = themeSlides.find(s => s.name === "詩歌名字");
  const lyricsSlide = themeSlides.find(s => s.name === "詩歌歌詞");

  if (!titleSlide || !lyricsSlide) {
    throw new Error("Theme does not contain required slides: 詩歌名字 and 詩歌歌詞");
  }

  // 基本文件結構（複用 generateProFile 的結構）
  const presentation = {
    applicationInfo: {
      platform: 2,
      platformVersion: {
        majorVersion: 10,
        patchVersion: 4294967295,
        build: "22631"
      },
      application: 1,
      applicationVersion: {
        majorVersion: 18,
        minorVersion: 4,
        patchVersion: 1,
        build: "302252289"
      }
    },
    uuid: { string: generateUUID() },
    name: songName,
    lastDateUsed: { seconds: Math.floor(Date.now() / 1000) },
    lastModifiedDate: { seconds: Math.floor(Date.now() / 1000) },
    background: { color: { alpha: 1 } },
    selectedArrangement: { string: generateUUID() },
    arrangements: [],
    cueGroups: [],
    cues: [],
    ccli: {}
  };

  // 處理 CCLI 版權資訊
  if (copyright) {
    const authorParts = [];
    if (copyright.composer && copyright.composer.trim()) {
      authorParts.push(`${COPYRIGHT_LABEL_LIST.composer[copyrightLanguage] || COPYRIGHT_LABEL_LIST.composer.en}${copyright.composer.trim()}`);
    }
    if (copyright.lyricist && copyright.lyricist.trim()) {
      authorParts.push(`${COPYRIGHT_LABEL_LIST.lyricist[copyrightLanguage] || COPYRIGHT_LABEL_LIST.lyricist.en}${copyright.lyricist.trim()}`);
    }
    if (copyright.arranger && copyright.arranger.trim()) {
      authorParts.push(`${COPYRIGHT_LABEL_LIST.arranger[copyrightLanguage] || COPYRIGHT_LABEL_LIST.arranger.en}${copyright.arranger.trim()}`);
    }

    presentation.ccli = {
      author: authorParts.join('\n'),
      publisher: copyright.publisher || '',
      songTitle: songName || '',
      album: copyright.album || '',
      display: showCopyright
    };
    if (copyright.year && Number.isInteger(+copyright.year)) {
      presentation.ccli.copyrightYear = parseInt(copyright.year);
    }
  }

  const cuesByGroup = {};
  let processedSlides = [...slides];

  // 應用 spacing
  processedSlides = processedSlides.map(slide => ({
    ...slide,
    zhContent: (slide.zhContent || '').replace("\t", " ").replace(/ /g, (spacing === 'tab' ? '\t' : " ".repeat(parseInt(spacing) || 1))),
    enContent: (slide.enContent || '').replace("\t", " ").replace(/ /g, (spacing === 'tab' ? '\t' : " ".repeat(parseInt(spacing) || 1)))
  }));

  // 如果添加標題頁，在前面插入
  if (addTitlePage) {
    processedSlides.unshift({
      is_title: true,
      content: songName || "Title",
      tag: 'TAG'
    });
  }

  // 如果添加尾頁，在後面插入
  if (addBlankPage) {
    processedSlides.push({
      tag: 'BLANK',
      content: ''
    });
  }

  // 獲取主題中 info=2 的 text element 模板（用於雙語排版）
  const lyricsTextTemplate = lyricsSlide.baseSlide.elements.find(e => e.info === 2);
  const rtfTemplate = lyricsTextTemplate ? lyricsTextTemplate.element.text.rtfData : null;

  // 生成 cues
  processedSlides.forEach((slide, index) => {
    let tagKey, cueName, baseSlideToUse, fontName, fontSize, bold;
    let isDualText = false;

    if (slide.is_title && addTitlePage) {
      tagKey = mapTagToKey(useIntroAsLabel ? 'INTRO' : 'TAG');
      cueName = getGroupLabel(tagKey, labelLanguage) || (useIntroAsLabel ? 'INTRO' : 'TAG');
      baseSlideToUse = titleSlide.baseSlide;
      fontName = "MicrosoftJhengHeiUIBold";
      fontSize = 130;
      bold = true;
    } else if (slide.tag === 'BLANK' || (!slide.zhContent && !slide.enContent && !slide.content)) {
      // 空白頁
      tagKey = 'BLANK';
      cueName = getGroupLabel('BLANK', labelLanguage) || 'Blank';
      baseSlideToUse = lyricsSlide.baseSlide;
      fontName = "ArialMT";
      fontSize = 72;
      bold = false;
    } else {
      // 歌詞頁（雙 text element）
      tagKey = mapTagToKey(slide.tag) || 'VERSE';
      cueName = getGroupLabel(tagKey, labelLanguage) || slide.tag || `Verse ${index + 1}`;
      baseSlideToUse = lyricsSlide.baseSlide;
      fontName = "ArialMT";
      fontSize = 72;
      bold = false;
      isDualText = true;
    }

    const cue = {
      uuid: { string: generateUUID() },
      name: cueName,
      isEnabled: true,
      completionTargetUuid: { string: "00000000-0000-0000-0000-000000000000" },
      completionActionUuid: { string: "00000000-0000-0000-0000-000000000000" },
      triggerTime: (slide.is_title && addTitlePage) ? {} : { time: 0 },
      actions: [
        {
          uuid: { string: generateUUID() },
          name: "Presentation Slide",
          label: { text: undefined },
          isEnabled: true,
          type: 11,
          slide: {
            presentation: {
              baseSlide: cloneBaseSlide(baseSlideToUse)
            }
          }
        }
      ]
    };

    const baseSlideElements = cue.actions[0].slide.presentation.baseSlide.elements;

    if (isDualText && lyricsTextTemplate) {
      // 雙語排版：創建兩個 text element
      // 移除原來的 info=2 element
      const filteredElements = baseSlideElements.filter(e => e.info !== 2);

      // Text（中文）：bounds = (53, 47, 1819, 451), fontSize = 115
      const zhTextElement = createTextElement(
        lyricsTextTemplate,
        { x: 53, y: 47, width: 1819, height: 451 },
        "MicrosoftJhengHeiUIBold",
        115,
        true
      );
      zhTextElement.element.text.rtfData = textToRTF(
        slide.zhContent || "", baseSlideToUse, "MicrosoftJhengHeiUIBold", 115, true, rtfTemplate
      );

      // Text2（英文）：bounds = (53, 624, 1819, 411), fontSize = 90
      const enTextElement = createTextElement(
        lyricsTextTemplate,
        { x: 53, y: 624, width: 1819, height: 411 },
        "ArialMT",
        90,
        false
      );
      enTextElement.element.text.rtfData = textToRTF(
        slide.enContent || "", baseSlideToUse, "ArialMT", 90, false, rtfTemplate
      );

      // 添加兩個 text element
      filteredElements.push(zhTextElement, enTextElement);
      cue.actions[0].slide.presentation.baseSlide.elements = filteredElements;

      // 更新 elementBuildOrder
      cue.actions[0].slide.presentation.baseSlide.elementBuildOrder = [
        { string: zhTextElement.element.uuid.string },
        { string: enTextElement.element.uuid.string }
      ];
    } else {
      // 單語排版（標題頁或空白頁）
      const textElement = baseSlideElements.find(e => e.info === 2);
      if (textElement) {
        const textContent = slide.content || slide.zhContent || slide.enContent || "";
        // 標題頁使用左對齊，不居中
        const alignment = slide.is_title ? 'left' : null;
        textElement.element.text.rtfData = textToRTF(textContent, baseSlideToUse, fontName, fontSize, bold, slide.is_title ? null : rtfTemplate, alignment);
      }
    }

    presentation.cues.push(cue);

    if (!cuesByGroup[tagKey]) {
      cuesByGroup[tagKey] = [];
    }
    cuesByGroup[tagKey].push(cue.uuid.string);
  });

  // 創建 cue groups
  for (const [tagKey, cueUuids] of Object.entries(cuesByGroup)) {
    const groupLabel = GROUP_LABEL_LIST[tagKey] || GROUP_LABEL_LIST['VERSE'];
    const colorHex = groupLabel.colorHex;
    const r = parseInt(colorHex.slice(1, 3), 16) / 255;
    const g = parseInt(colorHex.slice(3, 5), 16) / 255;
    const b = parseInt(colorHex.slice(5, 7), 16) / 255;

    const cueGroup = {
      group: {
        uuid: { string: generateUUID() },
        name: getGroupLabel(tagKey, labelLanguage) || tagKey,
        color: { red: r, green: g, blue: b, alpha: 1 }
      },
      cueIdentifiers: cueUuids.map(uuid => ({ string: uuid }))
    };
    presentation.cueGroups.push(cueGroup);
  }

  return presentation;
}

module.exports = {
  generateProFile,
  generateMultiLangProFile,
  saveProFile,
  loadTheme,
  textToRTF,
  GROUP_LABEL_LIST,
  mapTagToKey,
  getGroupLabel
};