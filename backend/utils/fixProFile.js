const protobuf = require("protobufjs");
const path = require("path");
const fs = require("fs");
const unzipper = require("unzipper");
const archiver = require("archiver");

// Load ProPresenter proto files
async function loadProPresenterProto() {
  const root = new protobuf.Root();
  const protoDir = path.join(__dirname, "../proto");
  const protoFiles = fs.readdirSync(protoDir).filter(f => f.endsWith(".proto"));
  await root.load(protoFiles.map(f => path.join(protoDir, f)));
  return root;
}

// Check if a file should be moved to Media folder
function isMediaFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename);
    // User rule: "flatten finding non-.pro, data, pdf files"
    if (ext === '.pro' || ext === '.proplaylist') return false;
    if (basename === 'data') return false;
    if (ext === '.pdf') return false;
    return true; // Everything else (images, videos, etc) goes to Media
}

// Recursively normalize strings in an object to NFC and Fix Paths
function normalizeObject(obj, fixPaths = false) {
  if (typeof obj === "string") {
    let val = obj.normalize("NFC");
    if (fixPaths) {
      // Fix Paths logic:
      // If the string looks like an absolute path or relative path to a media asset
      // We change it to "Media/<basename>"
      
      const ext = path.extname(val).toLowerCase();
      // Heuristic: checking if it ends with typical media extensions or just seems to be a file path we care about.
      // Since we are moving ALL non-pro/data/pdf/dirs to Media, we should update paths pointing to them.
      // We can use a broad check for extensions or path structure.
      
      // Common extensions for assets
      const assetExts = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', 
                         '.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff',
                         '.mp3', '.wav', '.aac', '.m4a', '.ogg'];
                         
      if (assetExts.includes(ext)) {
          // It's likely a media file reference.
          // Extract basename and remove directory
          const basename = path.basename(val);
          // User request: remove paths, keep only filename for media refs in .pro
          val = basename;
      }
    }
    return val;
  } else if (Array.isArray(obj)) {
    return obj.map(item => normalizeObject(item, fixPaths));
  } else if (typeof obj === "object" && obj !== null) {
    if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
      return obj;
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = normalizeObject(obj[key], fixPaths);
      }
    }
    return obj;
  }
  return obj;
}

async function fixProFileContent(buffer, root, filename, fixPaths = false) {
  // Try to guess type or fallback
  // List of likely types to try
  const strategies = ["rv.data.Presentation", "rv.data.Playlist", "rv.data.Action"];
  
  // Optimization based on filename
  if (filename) {
      if (filename.toLowerCase().endsWith(".proplaylist")) {
          // Move Playlist to front
          const idx = strategies.indexOf("rv.data.Playlist");
          if (idx > -1) strategies.unshift(strategies.splice(idx, 1)[0]);
      }
  }

  let lastError = null;

  for (const typeUrl of strategies) {
    const Type = root.lookupType(typeUrl);
    try {
        // Attempt decode
        const message = Type.decode(buffer);
        
        const object = Type.toObject(message, {
            longs: String,
            enums: String,
            bytes: String,
            defaults: true,
            arrays: true
        });

        // Normalize strings and fix paths
        const fixedObject = normalizeObject(object, fixPaths);

        // Encode back
        const verifyError = Type.verify(fixedObject);
        if (verifyError) {
           console.warn(`Verification Warning (${typeUrl}):`, verifyError);
        }
    
        const newMessage = Type.fromObject(fixedObject);
        return Type.encode(newMessage).finish();

    } catch (e) {
        lastError = e;
        // Continue to next strategy
    }
  }

  console.warn(`Failed to parse file ${filename} with any strategy. Last error: ${lastError?.message}`);
  return buffer; 
}

async function fixProBundle(filePath, outputPath) {
  const root = await loadProPresenterProto();
  const output = fs.createWriteStream(outputPath);
  
  // Create zip stream with forceLocalTime to try to help Windows encoding issues
  const archive = archiver("zip", { 
    zlib: { level: 9 },
    forceLocalTime: true,
  });

  const streamFinished = new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('end', resolve);
      output.on('error', reject);
      archive.on('error', reject);
  });

  archive.pipe(output);

  // Ensure "Media" and "PDF" folders exist
  archive.append(null, { name: 'Media/' });
  archive.append(null, { name: 'PDF/' });

  // Map to track what we've added
  const addedFiles = new Set();

  console.log("Fixing Bundle: Extracting...");
  
  const tempExtractDir = path.join(path.dirname(filePath), `ext_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);
  
  try {
    await fs.promises.mkdir(tempExtractDir, { recursive: true });
    
    // Unzip
    await fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: tempExtractDir }))
      .promise();

    // Recursive walk helper
    async function walk(dir) {
        const list = await fs.promises.readdir(dir);
        for (const file of list) {
            const fullPath = path.join(dir, file);
            const stat = await fs.promises.stat(fullPath);
            if (stat && stat.isDirectory()) {
                await walk(fullPath);
            } else {
                // It's a file
                // Determine destination
                const basename = path.basename(file).normalize("NFC");
                const ext = path.extname(basename).toLowerCase();

                let destName = basename;
                let shouldFixContent = false;
                let fixPaths = false;

                if (basename === 'data') {
                    destName = basename; // Root
                    // Optimization: data file in bundle usually does not need content fix if it's playlist
                    // unless we want to normalize strings deeply. 
                    // User requested: "只是data檔案那邊，直接複製貼上就好"
                    // So we skip shouldFixContent for 'data'
                    shouldFixContent = false; 
                } else if (ext === '.pro' || ext === '.proplaylist') {
                    destName = basename; // Root
                    shouldFixContent = true;
                    fixPaths = (ext === '.pro'); // Only fix paths for .pro (presentations)
                } else if (ext === '.pdf') {
                    destName = `PDF/${basename}`;
                } else {
                    // Everything else -> Media
                    destName = `Media/${basename}`;
                }

                // Read content
                const content = await fs.promises.readFile(fullPath);
                
                let finalContent = content;
                if (shouldFixContent) {
                    // Fix content
                    finalContent = await fixProFileContent(content, root, basename, fixPaths);
                }

                if (!addedFiles.has(destName)) {
                    archive.append(finalContent, { name: destName });
                    addedFiles.add(destName);
                } else {
                    console.warn(`Duplicate file during flatten: ${destName}, skipping.`);
                }
            }
        }
    }
    
    await walk(tempExtractDir);

  } catch (err) {
      console.error("Error processing zip contents:", err);
      throw err;
  } finally {
      // Cleanup temp
      try {
        await fs.promises.rm(tempExtractDir, { recursive: true, force: true });
      } catch (e) {}
  }

  await archive.finalize();
  await streamFinished; // Wait for write stream to finish
  return outputPath;
}

async function fixProFile(filePath, outputPath) {
    const root = await loadProPresenterProto();
    const buffer = fs.readFileSync(filePath);
    // Single file fix: Do NOT fix paths, only encoding
    const fixedBuffer = await fixProFileContent(buffer, root, filePath, false);
    fs.writeFileSync(outputPath, fixedBuffer);
    return outputPath;
}

module.exports = {
  fixProBundle,
  fixProFile
};
