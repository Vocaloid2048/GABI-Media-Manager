const fs = require('fs');
const path = require('path');
const { fixProFile, fixProBundle } = require('../utils/fixProFile');
const { convertProFileTags, convertProBundleTags } = require('../utils/tagConverter');
const { raiseError, returnSuccess, INVALID_REQUEST, errorByAPI } = require('../middlewares/error');
const uploadQueue = require('../middlewares/uploadQueue');

const validExtensions = ['.pro', '.proplaylist', '.probundle'];

exports.uploadToolFile = async (req, res) => {
    // Auth is handled by middleware

    // Handle File Upload
    const file = req.file;

    // --- Cancellation Handling ---
    // If request closes prematurely, delete the uploaded file/chunk
    req.on('close', async () => {
        if (!res.headersSent) {
            console.log('Request cancelled by user. Cleaning up...');
            if (file && file.path) {
                try {
                    await fs.promises.access(file.path);
                    await fs.promises.unlink(file.path);
                    console.log(`Deleted temp file: ${file.path}`);
                } catch (e) { /* ignore if already gone */ }
            }
        }
    });

    // Validate file extension (only for the first chunk or when fileName is provided)
    const fileNameToCheck = req.body.fileName || file.originalname;
    if (fileNameToCheck && !validExtensions.includes(path.extname(fileNameToCheck).toLowerCase())) {
        return raiseError(res, INVALID_REQUEST);
    }

    // --- Chunked Upload Handling ---
    if (req.body.chunkIndex != null && req.body.totalChunks != null && req.body.fileId) {
        return await handleChunkedToolUpload(req, res, file);
    }

    // Single file processing (if needed, but currently all are chunked)
    return raiseError(res, 'Chunked upload required');
};

exports.uploadTagConvertFile = async (req, res) => {
    const file = req.file;

    // Cancellation Handling
    req.on('close', async () => {
        if (!res.headersSent) {
            if (file && file.path) {
                try {
                    await fs.promises.access(file.path);
                    await fs.promises.unlink(file.path);
                } catch (e) { }
            }
        }
    });

    const fileNameToCheck = req.body.fileName || file.originalname;
    if (fileNameToCheck && !validExtensions.includes(path.extname(fileNameToCheck).toLowerCase())) {
        return raiseError(res, INVALID_REQUEST);
    }

    if (req.body.chunkIndex != null && req.body.totalChunks != null && req.body.fileId) {
        return await handleChunkedTagConvertUpload(req, res, file);
    }

    return raiseError(res, 'Chunked upload required');
};

async function handleChunkedToolUpload(req, res, file) {
    const { chunkIndex, totalChunks, fileId, fileName } = req.body;
    const index = parseInt(chunkIndex);
    const total = parseInt(totalChunks);
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
    const files = fs.readdirSync(chunksDir);
    if (files.length < total) {
        return returnSuccess(res, { status: 'chunk_received', index });
    }

    console.log(`All ${total} chunks received for ${fileId}, merging...`);
    
    // Merge
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

    // Now process the merged file
    await exports.uploadToolFileImpl(mergedPath, safeBase, res);
}

async function handleChunkedTagConvertUpload(req, res, file) {
    const { chunkIndex, totalChunks, fileId, fileName, targetLang } = req.body;
    const index = parseInt(chunkIndex);
    const total = parseInt(totalChunks);
    const tempDir = process.env.TEMP_DIR || path.join(__dirname, '../Temp');
    const chunksDir = path.join(tempDir, 'tool_chunks', fileId);

    if (!fs.existsSync(chunksDir)) {
        fs.mkdirSync(chunksDir, { recursive: true });
    }

    const chunkPath = path.join(chunksDir, `${index}`);
    
    try {
        fs.renameSync(file.path, chunkPath);
    } catch (err) {
        fs.copyFileSync(file.path, chunkPath);
        fs.unlinkSync(file.path);
    }

    const files = fs.readdirSync(chunksDir);
    if (files.length < total) {
        return returnSuccess(res, { status: 'chunk_received', index });
    }

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
        return raiseError(res, errorByAPI(null, "Merge failed", false));
    }

    await new Promise((resolve) => writeStream.on('finish', resolve));

    try {
        fs.rmSync(chunksDir, { recursive: true, force: true });
    } catch(e) {}

    await exports.uploadTagConvertFileImpl(mergedPath, safeBase, targetLang, res);
}

exports.uploadToolFileImpl = async (filePath, originalName, res) => {
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
            await fixProBundle(filePath, outputPath);
        } else {
            try { fs.unlinkSync(filePath); } catch(e) {}
            return raiseError(res, 'Unsupported file extension. Only .pro, .proplaylist and .probundle are supported.');
        }

        // Send file back
        res.download(outputPath, outputFilename, (err) => {
            // Cleanup files after download
            try { fs.unlinkSync(filePath); } catch(e) {}
            try { fs.unlinkSync(outputPath); } catch(e) {}
        });
    } catch (error) {
        console.error("Processing error:", error);
        try { fs.unlinkSync(filePath); } catch(e) {}
        return raiseError(res, errorByAPI(null, error.message || "Processing failed", false));
    }
};

exports.uploadTagConvertFileImpl = async (filePath, originalName, targetLang, res) => {
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext);
    const tempDir = path.dirname(filePath);
    
    const outputFilename = `${baseName}_tag_${targetLang}${ext}`;
    const outputPath = path.join(tempDir, `fixed_${Date.now()}_${outputFilename}`);

    try {
        if (ext === '.pro') {
            await convertProFileTags(filePath, outputPath, targetLang);
        } else if (ext === '.proplaylist' || ext === '.probundle') {
            await convertProBundleTags(filePath, outputPath, targetLang);
        } else {
            try { fs.unlinkSync(filePath); } catch(e) {}
            return raiseError(res, 'Unsupported file extension.');
        }

        res.download(outputPath, outputFilename, (err) => {
            try { fs.unlinkSync(filePath); } catch(e) {}
            try { fs.unlinkSync(outputPath); } catch(e) {}
        });
    } catch (error) {
        console.error("Tag conversion processing error:", error);
        try { fs.unlinkSync(filePath); } catch(e) {}
        return raiseError(res, errorByAPI(null, error.message || "Tag conversion failed", false));
    }
};

exports.cancelToolUpload = async (req, res) => {
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
};
