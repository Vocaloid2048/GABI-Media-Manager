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
  "CHORUS 1": { colorHex: "#D41243", en: "Chorus 1", zh_cn: "副歌1", zh_hk: "副歌1" },
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

// 將純文本轉換為簡單的 RTF 格式，使用主題 RTF 作為模板
function textToRTF(text, fontName = "MicrosoftJhengHeiUI", fontSize = 72, bold = false) {
  // 從主題獲取 RTF 模板
  const theme = JSON.parse(fs.readFileSync(path.join(__dirname, "default_theme_export.json"), 'utf8'));
  const titleSlide = theme.data.slides.find(s => s.name === "詩歌名字");
  const titleElement = titleSlide.baseSlide.elements.find(e => e.info === 2);
  const templateRtf = Buffer.from(titleElement.element.text.rtfData, 'base64').toString('utf8');

  // 替換文字部分
  // 找到文字部分：從 \cb3 之後到 }
  const textStart = templateRtf.indexOf('\\cb3') + 4;
  const textEnd = templateRtf.lastIndexOf('}');
  const beforeText = templateRtf.substring(0, textStart);
  const afterText = templateRtf.substring(textEnd);

  // 生成新的文字
  const escapedText = text
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

  const newRtf = beforeText + escapedText + afterText;

  return Buffer.from(newRtf, 'utf8').toString('base64');
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
        uuid: { string: elementUuidMap.get(e.element.uuid.string) }
      }
    })),
    elementBuildOrder: baseSlide.elementBuildOrder ? baseSlide.elementBuildOrder.map(uuid => ({
      string: elementUuidMap.get(uuid.string) || uuid.string
    })) : []
  };
  return cloned;
}

// 從 songData 生成 ProPresenter 文件
async function generateProFile(songData, themePath = path.join(__dirname, "default_Theme")) {
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
      cues: []
    };

    // 生成 cues
    // 第一個 cue 是標題頁
    const titleCue = {
      uuid: {
        string: generateUUID()
      },
      name: "Title",
      isEnabled: true,
      completionTargetUuid: {
        string: "00000000-0000-0000-0000-000000000000"
      },
      completionActionUuid: {
        string: "00000000-0000-0000-0000-000000000000"
      },
      triggerTime: {},
      actions: [
        {
          uuid: {
            string: generateUUID()
          },
          name: "Presentation Slide",
          label: {
            text: "Title"
          },
          isEnabled: true,
          type: 11,
          slide: {
            presentation: {
              baseSlide: cloneBaseSlide(titleSlide.baseSlide)
            }
          }
        }
      ]
    };

    // 更新標題頁的文字內容
    const titleElement = titleCue.actions[0].slide.presentation.baseSlide.elements.find(e => e.info === 2);
    if (titleElement) {
      titleElement.element.text.rtfData = textToRTF(songData.song_name, "MicrosoftJhengHeiUIBold", 130, true);
    }

    presentation.cues.push(titleCue);

    // 添加標題到分組
    const cuesByGroup = {};
    cuesByGroup['TITLE'] = [titleCue.uuid.string];

    // 生成歌詞頁 cues（每個 content 項目對應一個 cue）
    if (songData.content && Array.isArray(songData.content)) {
      songData.content.forEach((slide, index) => {
        const tagKey = mapTagToKey(slide.tag) || 'VERSE';
        const groupLabel = GROUP_LABEL_LIST[tagKey] || GROUP_LABEL_LIST['VERSE'];
        const cueName = groupLabel.zh_hk || slide.tag || `Verse ${index + 1}`;

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
                text: cueName
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

        // 更新歌詞頁的文字內容
        const lyricsElement = cue.actions[0].slide.presentation.baseSlide.elements.find(e => e.info === 2);
        if (lyricsElement) {
          lyricsElement.element.text.rtfData = textToRTF(slide.content || "", "ArialMT", 72, false);
        }

        presentation.cues.push(cue);

        // 分組
        if (!cuesByGroup[tagKey]) {
          cuesByGroup[tagKey] = [];
        }
        cuesByGroup[tagKey].push(cue.uuid.string);
      });
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
          name: groupLabel.zh_hk,
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

    // 如果沒有內容，創建一個默認的標題 slide
    if (!presentation.cues.length) {
      const titleCue = {
        uuid: {
          string: generateUUID()
        },
        name: "Title",
        isEnabled: true,
        completionTargetUuid: {
          string: "00000000-0000-0000-0000-000000000000"
        },
        completionActionUuid: {
          string: "00000000-0000-0000-0000-000000000000"
        },
        triggerTime: {},
        actions: [
          {
            uuid: {
              string: generateUUID()
            },
            name: "Presentation Slide",
            label: {
              text: "Title"
            },
            isEnabled: true,
            type: "ACTION_TYPE_PRESENTATION_SLIDE",
            slide: {
              presentation: {
                baseSlide: cloneBaseSlide(titleSlide.baseSlide)
              }
            }
          }
        ]
      };

      // 更新標題頁的文字內容
      const titleElement = titleCue.actions[0].slide.presentation.baseSlide.elements.find(e => e.info === 2);
      if (titleElement) {
        titleElement.element.text.rtfData = textToRTF(songData.song_name, "MicrosoftJhengHeiUIBold", 130, true);
      }

      presentation.cues.push(titleCue);
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

    console.log("Creating message...");
    const message = Presentation.create(presentation);
    console.log("Verifying message...");
    const err = Presentation.verify(presentation);
    if (err) {
      console.error("Verification error:", err);
      throw new Error(err);
    }
    console.log("Encoding message...");
    const buffer = Presentation.encode(message).finish();

    console.log(`Buffer length: ${buffer.length}`);

    // 保存到文件
    fs.writeFileSync(outputPath, buffer);
    console.log(`ProPresenter file saved to: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("Error saving ProPresenter file:", error);
    throw error;
  }
}

module.exports = {
  generateProFile,
  saveProFile,
  loadTheme,
  textToRTF
};