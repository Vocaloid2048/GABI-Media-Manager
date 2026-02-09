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

  processMergedFile: async (req, res, filePath, originalName) => {
      const ext = path.extname(originalName).toLowerCase();
      const baseName = path.basename(originalName, ext);
      const tempDir = path.dirname(filePath);
      
      // Output filename with suffix "_fix" before extension
      const outputFilename = `${baseName}_fix${ext}`;
      const outputPath = path.join(tempDir, `fixed_${Date.now()}_${outputFilename}`);

      try {
        if (ext === '.pro') {
          await fixProFile(filePath, outputPath);
        } else if (ext === '.proplaylist' || ext === '.probundle') {
          // Both handled as bundle/zip structure now
          await fixProBundle(filePath, outputPath);
        } else {
             try { fs.unlinkSync(filePath); } catch(e) {}
             return raiseError(res, 'Unsupported file extension. Only .pro, .proplaylist and .probundle are supported.');
        }

        // Send file back
        res.download(outputPath, outputFilename, (err) => {
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
