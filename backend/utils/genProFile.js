const protobuf = require("protobufjs");
const path = require("path");
const fs = require("fs");

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

// 將純文本轉換為簡單的 RTF 格式
function textToRTF(text, fontName = "MicrosoftJhengHeiUI", fontSize = 72) {
  // 簡單的 RTF 標頭
  const rtfHeader = `{\\rtf1\\ansi\\ansicpg1252{\\fonttbl{\\f0\\fnil ${fontName};}}`;

  // 將文字中的特殊字符進行轉義
  const escapedText = text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, '\\par ');

  // RTF 內容
  const rtfContent = `\\viewkind4\\uc1\\pard\\li0\\fi0\\ri0\\ql\\sb0\\sa0\\sl240\\slmult1\\f0\\fs${fontSize * 2}\\cf1\\b ${escapedText}}`;

  return Buffer.from(rtfHeader + rtfContent, 'utf8').toString('base64');
}

// 從 songData 生成 ProPresenter 文件
async function generateProFile(songData) {
  try {
    const root = await loadProPresenterProto();
    const Presentation = root.lookupType("rv.data.Presentation");

    // 基本文件結構
    const presentation = {
      applicationInfo: {
        platform: "PLATFORM_WINDOWS",
        platformVersion: {
          majorVersion: 10,
          patchVersion: 4294967295,
          build: "22631"
        },
        application: "APPLICATION_PROPRESENTER",
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
        seconds: Math.floor(Date.now() / 1000).toString()
      },
      lastModifiedDate: {
        seconds: Math.floor(Date.now() / 1000).toString()
      },
      background: {
        color: {
          alpha: 1
        }
      },
      selectedArrangement: {
        string: generateUUID()
      },
      cues: []
    };

    // 生成 cues（每個 content 項目對應一個 cue）
    if (songData.content && Array.isArray(songData.content)) {
      songData.content.forEach((slide, index) => {
        const cue = {
          uuid: {
            string: generateUUID()
          },
          completionTargetUuid: {
            string: "00000000-0000-0000-0000-000000000000"
          },
          completionActionType: "COMPLETION_ACTION_TYPE_LAST",
          completionActionUuid: {
            string: "00000000-0000-0000-0000-000000000000"
          },
          triggerTime: {},
          actions: [
            {
              uuid: {
                string: generateUUID()
              },
              label: {
                text: `Slide_${index + 1}`
              },
              isEnabled: true,
              type: "ACTION_TYPE_PRESENTATION_SLIDE",
              slide: {
                presentation: {
                  baseSlide: {
                    elements: [
                      {
                        element: {
                          uuid: {
                            string: generateUUID()
                          },
                          name: slide.tag || "Lyrics",
                          bounds: {
                            origin: {
                              x: 52.61261261261268,
                              y: 200
                            },
                            size: {
                              width: 1772.972972972973,
                              height: 600
                            }
                          },
                          opacity: 1,
                          path: {
                            closed: true,
                            points: [
                              { point: {}, q0: {}, q1: {} },
                              { point: { x: 1 }, q0: { x: 1 }, q1: { x: 1 } },
                              { point: { x: 1, y: 1 }, q0: { x: 1, y: 1 }, q1: { x: 1, y: 1 } },
                              { point: { y: 1 }, q0: { y: 1 }, q1: { y: 1 } }
                            ]
                          },
                          fill: {
                            color: {
                              alpha: 1
                            },
                            opacity: 0.75
                          },
                          feather: {},
                          text: {
                            attributes: {
                              font: {
                                name: "MicrosoftJhengHeiUI",
                                size: 72,
                                bold: false,
                                family: "MicrosoftJhengHeiUI",
                                face: "Regular"
                              },
                              textSolidFill: {
                                red: 1,
                                green: 1,
                                blue: 1,
                                alpha: 1
                              },
                              paragraphStyle: {
                                lineHeightMultiple: 1,
                                textList: {}
                              },
                              strokeWidth: 0,
                              strokeColor: {
                                alpha: 1
                              }
                            },
                            shadow: {
                              angle: 315,
                              radius: 5,
                              color: {
                                alpha: 1
                              },
                              opacity: 0.75,
                              enable: true
                            },
                            rtfData: textToRTF(slide.content || ""),
                            margins: {},
                            isSuperscriptStandardized: true,
                            transformDelimiter: "  •  ",
                            chordPro: {
                              color: {
                                alpha: 1
                              }
                            }
                          },
                          textLineMask: {}
                        },
                        info: 3,
                        textScroller: {
                          scrollRate: 0.5,
                          shouldRepeat: true,
                          repeatDistance: 0.056402439024390245
                        }
                      }
                    ],
                    backgroundColor: {
                      alpha: 1
                    },
                    size: {
                      width: 1920,
                      height: 1080
                    },
                    transition: {
                      type: "TRANSITION_TYPE_NONE"
                    }
                  }
                }
              }
            }
          ]
        };

        presentation.cues.push(cue);
      });
    }

    // 如果沒有內容，創建一個默認的標題 slide
    if (!presentation.cues.length) {
      const titleCue = {
        uuid: {
          string: generateUUID()
        },
        completionTargetUuid: {
          string: "00000000-0000-0000-0000-000000000000"
        },
        completionActionType: "COMPLETION_ACTION_TYPE_LAST",
        completionActionUuid: {
          string: "00000000-0000-0000-0000-000000000000"
        },
        triggerTime: {},
        actions: [
          {
            uuid: {
              string: generateUUID()
            },
            label: {
              text: "Title"
            },
            isEnabled: true,
            type: "ACTION_TYPE_PRESENTATION_SLIDE",
            slide: {
              presentation: {
                baseSlide: {
                  elements: [
                    {
                      element: {
                        uuid: {
                          string: generateUUID()
                        },
                        name: "Title",
                        bounds: {
                          origin: {
                            x: 52.61261261261268,
                            y: 400
                          },
                          size: {
                            width: 1772.972972972973,
                            height: 200
                          }
                        },
                        opacity: 1,
                        path: {
                          closed: true,
                          points: [
                            { point: {}, q0: {}, q1: {} },
                            { point: { x: 1 }, q0: { x: 1 }, q1: { x: 1 } },
                            { point: { x: 1, y: 1 }, q0: { x: 1, y: 1 }, q1: { x: 1, y: 1 } },
                            { point: { y: 1 }, q0: { y: 1 }, q1: { y: 1 } }
                          ]
                        },
                        fill: {
                          color: {
                            alpha: 1
                          },
                          opacity: 0.75
                        },
                        feather: {},
                        text: {
                          attributes: {
                            font: {
                              name: "MicrosoftJhengHeiUIBold",
                              size: 130,
                              bold: true,
                              family: "MicrosoftJhengHeiUIBold",
                              face: "Regular"
                            },
                            textSolidFill: {
                              red: 1,
                              green: 1,
                              blue: 1,
                              alpha: 1
                            },
                            paragraphStyle: {
                              lineHeightMultiple: 1,
                              textList: {}
                            },
                            strokeWidth: 5,
                            strokeColor: {
                              alpha: 1
                            }
                          },
                          shadow: {
                            angle: 315,
                            radius: 5,
                            color: {
                              alpha: 1
                            },
                            opacity: 0.75,
                            enable: true
                          },
                          rtfData: textToRTF(songData.song_name),
                          margins: {},
                          isSuperscriptStandardized: true,
                          transformDelimiter: "  •  ",
                          chordPro: {
                            color: {
                              alpha: 1
                            }
                          }
                        },
                        textLineMask: {}
                      },
                      info: 3,
                      textScroller: {
                        scrollRate: 0.5,
                        shouldRepeat: true,
                        repeatDistance: 0.056402439024390245
                      }
                    }
                  ],
                  backgroundColor: {
                    alpha: 1
                  },
                  size: {
                    width: 1920,
                    height: 1080
                  },
                  transition: {
                    type: "TRANSITION_TYPE_NONE"
                  }
                }
              }
            }
          }
        ]
      };

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

    // 編碼為 protobuf
    const message = Presentation.create(presentation);
    const buffer = Presentation.encode(message).finish();

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
  saveProFile
};