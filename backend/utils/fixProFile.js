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
          // Extract basename and prefix with Media/
          // Note: Windows usage of forward slash is generally fine in Pro file paths, 
          // but if we want to be super specific for Windows we could use backslash,
          // however ProPresenter usually handles / fine or uses URIs.
          // Since we are in a bundle, relative path "Media/file.ext" is standard.
          const basename = path.basename(val);
          val = "Media/" + basename;
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
  // Determine type based on extension
  let typeUrl = "rv.data.Presentation"; // Default to Presentation
  if (filename && filename.toLowerCase().endsWith(".proplaylist")) {
    typeUrl = "rv.data.Playlist";
  }

  const Type = root.lookupType(typeUrl);
  
  try {
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
      console.warn("Verification Warning:", verifyError);
    }
    
    const newMessage = Type.fromObject(fixedObject); // Re-create message from object
    return Type.encode(newMessage).finish();
  } catch (e) {
    console.warn(`Failed to parse as ${typeUrl}, trying raw normalization. error: ${e.message}`);
    // Fallback: If proto parsing fails, we could try string replacement on buffer? 
    // But modifying binary buffer blindly is risky. 
    // We return original buffer.
    return buffer; 
  }
}

async function fixProBundle(filePath, outputPath) {
  const root = await loadProPresenterProto();
  const output = fs.createWriteStream(outputPath);
  
  // Create zip stream with forceLocalTime to try to help Windows encoding issues
  const archive = archiver("zip", { 
    zlib: { level: 9 },
    forceLocalTime: true,
  });

  archive.pipe(output);

  // Ensure "Media" and "PDF" folders exist
  archive.append(null, { name: 'Media/' });
  archive.append(null, { name: 'PDF/' });

  // Map to track what we've added to avoid duplicates if zip has same-named files in diff folders (flatten collision)
  const addedFiles = new Set();
  // But wait, if we flatten, we might overwrite. We accept that or rename?
  // User didn't specify rename strategy for collisions. Assuming mostly unique basenames.

  console.log("Fixing Bundle: Extracting...");
  
  // We extract to temp dir first to ensure we catch everything properly
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
                if (basename === 'data') {
                    destName = basename; // Root
                } else if (ext === '.pro' || ext === '.proplaylist') {
                    destName = basename; // Root
                } else if (ext === '.pdf') {
                    destName = `PDF/${basename}`;
                } else {
                    // Everything else -> Media
                    destName = `Media/${basename}`;
                }

                // Read content
                const content = await fs.promises.readFile(fullPath);
                
                let finalContent = content;
                if (ext === '.pro' || ext === '.proplaylist') {
                    // Fix content
                    finalContent = await fixProFileContent(content, root, basename, true); // fixPaths = true
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
