const fs = require('fs');
const path = require('path');
const { fixProFile, fixProBundle } = require('../utils/fixProFile');
const { raiseError, returnSuccess, INVALID_REQUEST, errorByAPI } = require('../middlewares/error');

const toolController = {
  handleChunkedToolUpload: async (req, res) => {
    const { chunkIndex, totalChunks, fileId, fileName } = req.body;
    const index = parseInt(chunkIndex);
    const total = parseInt(totalChunks);
    const file = req.file;

    if (!file) {
         return raiseError(res, "No chunk file uploaded");
    }

    const tempDir = process.env.TEMP_DIR || path.join(__dirname, '../Temp');
    const chunksDir = path.join(tempDir, 'tool_chunks', fileId);

    // Ensure chunks directory exists
    if (!fs.existsSync(chunksDir)) {
        fs.mkdirSync(chunksDir, { recursive: true });
    }

    // Move current chunk to correct location
    const chunkPath = path.join(chunksDir, `${index}`);
    
    try {
        fs.renameSync(file.path, chunkPath);
    } catch (err) {
        // Fallback for cross-device
        fs.copyFileSync(file.path, chunkPath);
        fs.unlinkSync(file.path);
    }

    // Check if we have all chunks
    // Simplest way: check if count of files == total
    const files = fs.readdirSync(chunksDir);
    if (files.length < total) {
        return returnSuccess(res, { status: 'chunk_received', index });
    }

    console.log(`All ${total} chunks received for ${fileId}, merging...`);
    
    // Merge
    // Use fileName provided by frontend to preserve non-ASCII
    const safeBase = fileName ? path.basename(fileName) : `${fileId}.probundle`;
    const mergedPath = path.join(tempDir, `merged_${Date.now()}_${safeBase}`);
    const writeStream = fs.createWriteStream(mergedPath);

    try {
        for (let i = 0; i < total; i++) {
            const chunkP = path.join(chunksDir, `${i}`);
            const data = fs.readFileSync(chunkP);
            writeStream.write(data);
        }
        writeStream.end();
    } catch (err) {
        console.error("Merge error:", err);
        return raiseError(res, errorByAPI(null, "Merge failed", false));
    }

    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });

    // Clean chunks
    try {
        fs.rmSync(chunksDir, { recursive: true, force: true });
    } catch(e) {}

    // Now convert/fix the merged file
    // We reuse the fixEncoding logic but with a local file path
    await toolController.processMergedFile(req, res, mergedPath, safeBase);
  },

  cancelToolUpload: async (req, res) => {
    const { fileId, token16 } = req.body;
    const targetToken = token16 || fileId;

    if (!targetToken) {
        return raiseError(res, INVALID_REQUEST);
    }

    const tempDir = process.env.TEMP_DIR || path.join(__dirname, '../Temp');
    const chunksDir = path.join(tempDir, 'tool_chunks', targetToken);

    console.log(`[Tool] User cancelled upload ${targetToken}, cleaning up...`);

    try {
        if (fs.existsSync(chunksDir)) {
            fs.rmSync(chunksDir, { recursive: true, force: true });
        }
        
        // Also cleanup merged files if they exist but weren't finished
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
           if (file.includes(targetToken)) {
               try { fs.unlinkSync(path.join(tempDir, file)); } catch(e) {}
           }
        }
        
        returnSuccess(res, { message: 'Upload cancelled and cleaned' });
    } catch (err) {
        console.error(`[Tool] Failed to clean up cancelled upload ${targetToken}:`, err);
        returnSuccess(res, { message: 'Cleanup attempted' });
    }
  },

  processMergedFile: async (req, res, filePath, originalName) => {
      const ext = path.extname(originalName).toLowerCase();
      const baseName = path.basename(originalName, ext);
      const tempDir = path.dirname(filePath);
      
      // Output filename with suffix "_fix" before extension
      const outputFilename = `${baseName}_fix${ext}`;
      const outputPath = path.join(tempDir, `fixed_${Date.now()}_${outputFilename}`);

      try {
const isZip = require('unzipper').Open.file(filePath)
            .then(d => { d.files; return true; })
            .catch(() => false); // Simple check if it can open

        if (ext === '.pro') {
          await fixProFile(filePath, outputPath);
        } else if (ext === '.proplaylist') {
          // Check if it is a zip (bundle) or single file
          // We can try to unzip it, if error, fallback to single file
          try {
             await fixProBundle(filePath, outputPath);
          } catch(e) {
             console.log("ProPlaylist is not a zip, treating as single file");
             await fixProFile(filePath, outputPath);
          }
        } else if (ext === '.probundle') {
          // Both handled as bundle/zip structure now
          await fixProBundle(filePath, outputPath);
        } else {
             try { fs.unlinkSync(filePath); } catch(e) {}
             return raiseError(res, 'Unsupported file extension. Only .pro, .proplaylist and .probundle are supported.');
        }

        // Send file back
        // Ensure UTF-8 filename in Content-Disposition for legacy/compat
        const encodedFilename = encodeURIComponent(outputFilename);
        res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.setHeader('Content-Type', 'application/zip'); // Assuming zip output for most, but .pro is binary. 
        // Actually res.download sets CD, we should use that but with headers.
        
        res.download(outputPath, outputFilename, {
            headers: {
                'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
            }
        }, (err) => {
          // Cleanup files after download
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          } catch (e) {
            console.error('Error cleaning up temp files:', e);
          }
        });

      } catch (error) {
        console.error('Error fixing ProPresenter file:', error);
        // Cleanup on error
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {}
        
        // Since this might be a background request for chunking?
        // Wait, if it's the last chunk request, the client is waiting for response.
        // We can return error json.
        // But if res.download was called, headers are sent.
        if (!res.headersSent) {
             return raiseError(res, 'Failed to process file: ' + error.message);
        }
      }
  },

  fixEncoding: async (req, res) => {
    // If chunked upload
    if (req.body.chunkIndex !== undefined) {
        return await toolController.handleChunkedToolUpload(req, res);
    }
  
    // Single file upload
    const file = req.file;
    if (!file) {
      return raiseError(res, 'No file uploaded');
    }
    
    // Process directly
    await toolController.processMergedFile(req, res, file.path, file.originalname);
  }
};

module.exports = toolController;
