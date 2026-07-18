const protobuf = require("protobufjs");
const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const archiver = require("archiver");
const { mapTagToKey, getGroupLabel } = require("./genProFile");

async function loadProPresenterProto() {
  const root = new protobuf.Root();
  const protoDir = path.join(__dirname, "../proto");
  const protoFiles = fs.readdirSync(protoDir).filter(f => f.endsWith(".proto"));
  await root.load(protoFiles.map(f => path.join(protoDir, f)));
  return root;
}

/**
 * 遍歷並轉換物件內的標籤
 */
function convertTagsInObject(obj, targetLanguage) {
  if (!obj || typeof obj !== "object") return obj;

  // 1. 處理 Presentation 中的 cueGroups
  if (obj.cueGroups && Array.isArray(obj.cueGroups)) {
    obj.cueGroups.forEach(cg => {
      if (cg.group && cg.group.name) {
        const key = mapTagToKey(cg.group.name);
        cg.group.name = getGroupLabel(key, targetLanguage);
      }
    });
  }

  // 2. 處理 Presentation 中的 cues 名稱 (通常與 Group 名稱一致)
  if (obj.cues && Array.isArray(obj.cues)) {
    obj.cues.forEach(cue => {
      if (cue.name) {
        const key = mapTagToKey(cue.name);
        // 如果是已知標籤才轉換，避免轉換自定義名稱
        const mappedLabel = getGroupLabel(key, targetLanguage);
        if (mappedLabel !== key) {
           cue.name = mappedLabel;
        }
      }
    });
  }

  // 3. 處理 Playlist 中的 items
  if (obj.items && Array.isArray(obj.items)) {
    obj.items.forEach(item => {
      if (item.header && item.header.cueGroup && item.header.cueGroup.name) {
        const key = mapTagToKey(item.header.cueGroup.name);
        item.header.cueGroup.name = getGroupLabel(key, targetLanguage);
      }
    });
  }

  return obj;
}

async function convertProFileContent(buffer, root, filename, targetLanguage) {
  const strategies = ["rv.data.Presentation", "rv.data.Playlist"];
  
  if (filename && filename.toLowerCase().endsWith(".proplaylist")) {
    strategies.reverse();
  }

  for (const typeUrl of strategies) {
    const Type = root.lookupType(typeUrl);
    try {
      const message = Type.decode(buffer);
      let object = Type.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true,
        arrays: true
      });

      // 執行標籤轉換
      object = convertTagsInObject(object, targetLanguage);

      const newMessage = Type.fromObject(object);
      return Type.encode(newMessage).finish();
    } catch (e) {
      // 嘗試下一種策略
    }
  }
  return buffer;
}

async function convertProBundleTags(filePath, outputPath, targetLanguage) {
  const root = await loadProPresenterProto();
  const output = fs.createWriteStream(outputPath);
  
  const archive = archiver("zip", { zlib: { level: 1 }, forceLocalTime: true });
  const streamFinished = new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    output.on('error', reject);
  });

  archive.pipe(output);

  try {
    const zip = await unzipper.Open.file(filePath);
    
    for (const entry of zip.files) {
      const entryPath = entry.path;
      const basename = path.basename(entryPath).normalize("NFC");
      const ext = path.extname(basename).toLowerCase();

      // 跳過資料夾條目
      if (entry.type === 'Directory') continue;

      if (ext === '.pro' || ext === '.proplaylist') {
        const buffer = await entry.buffer();
        const finalContent = await convertProFileContent(buffer, root, basename, targetLanguage);
        archive.append(finalContent, { name: entryPath });
      } else if (basename === 'data') {
        const buffer = await entry.buffer();
        const finalContent = await convertProFileContent(buffer, root, basename, targetLanguage);
        archive.append(finalContent, { name: entryPath });
      } else {
        // 其他檔案保持原路徑直接流轉
        archive.append(entry.stream(), { name: entryPath });
      }
    }
  } catch (err) {
    console.error("Tag conversion error in bundle:", err);
    throw err;
  }

  await archive.finalize();
  await streamFinished;
  return outputPath;
}

async function convertProFileTags(filePath, outputPath, targetLanguage) {
  const root = await loadProPresenterProto();
  const buffer = fs.readFileSync(filePath);
  const fixedBuffer = await convertProFileContent(buffer, root, path.basename(filePath), targetLanguage);
  fs.writeFileSync(outputPath, fixedBuffer);
  return outputPath;
}

module.exports = {
  convertProFileTags,
  convertProBundleTags
};