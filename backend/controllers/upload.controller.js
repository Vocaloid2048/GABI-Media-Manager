const { raiseError, returnSuccess, checkParamsExisted, errorByAPI, USER_DOES_NOT_EXISTED, INVALID_REQUEST, WRONG_AUTHIZATION } = require("../middlewares/error");
const db = require("../models");
const { auth } = require("../middlewares/auth");
const { Sequelize, where } = require("sequelize");
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { generateSafeName, generateThumbnail, generateThumbnailGroup } = require("../middlewares/generateThumb");
const unzipper = require('unzipper');
const { group } = require("console");
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');

const validExtensions = (process.env.VALID_VIDEO_EXTENSIONS || '.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm').split(',');

exports.uploadVideoFile = async (req, res) => {
    // Auth is handled by middleware
    
    // Handle File Upload
    const file = req.file;
    if (file === undefined
        || !validExtensions.includes(path.extname(file.originalname).toLowerCase()) 
        && !path.extname(file.originalname).toLowerCase().includes('.zip')
    ) { return raiseError(res, INVALID_REQUEST); }

    // Check is video info params existed
    let videoInfo = JSON.parse(req.body.videoInfo || '{}')
    if (videoInfo.group_title === undefined || videoInfo.group_title === null || videoInfo.group_title === '') {
        return raiseError(res, INVALID_REQUEST);
    }

    // Process Tags
    try {
        const finalTags = new Set(videoInfo.selectedTags || []);

        // Create New Tags
        if (videoInfo.newTags && Array.isArray(videoInfo.newTags)) {
            for (const newTag of videoInfo.newTags) {
                if (newTag.tag_zh_name && newTag.tag_type) {
                    const createdTag = await db.VideoDb.tagData.create({
                        tag_zh_name: newTag.tag_zh_name,
                        tag_en_name: newTag.tag_en_name || newTag.tag_zh_name,
                        tag_type: newTag.tag_type
                    });
                    finalTags.add(createdTag.tag_id);
                }
            }
        }
        
        videoInfo.group_tags = Array.from(finalTags);

    } catch (err) {
        console.error("Error processing tags:", err);
        // Continue even if tag creation fails? Or fail?
        // Let's log and continue with what we have
    }
    
    // Return Success Response
    returnSuccess(res, null);    

    try {
        const fileLocation = file.path || path.join(process.env.TEMP_DIR || '/tmp', file.filename);

        // Move uploaded file to TEMP_DIR
        if (path.extname(file.filename).toLowerCase() === '.zip') {
            await exports.uploadVideoZipImpl(fileLocation, videoInfo);
        } else {
            await exports.uploadVideoFileImpl(fileLocation, videoInfo);
        }
    } catch (error) {
        errorByAPI(null, error, true); 
    }
}

exports.uploadVideoFileImpl = async (fileLocation, videoInfo) => {
    await processVideoFiles([fileLocation], videoInfo);
}

exports.uploadVideoZipImpl = async (zipFileLocation, videoInfo) => {   
    const baseTemp = process.env.TEMP_DIR || path.dirname(zipFileLocation);
    const extractDir = path.join(baseTemp, `extract_${Date.now()}`);

    await fs.promises.mkdir(extractDir, { recursive: true });

    try {
        await fs.promises.access(zipFileLocation);
    } catch {
        throw new Error(`Zip file not found at ${zipFileLocation}`);
    }

    // Wait for extraction to complete
    await fs.createReadStream(zipFileLocation)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

    // Extraction complete, now process
    const extractedFiles = await fs.promises.readdir(extractDir);
    const fullPaths = extractedFiles.map(f => path.join(extractDir, f));
    const videoFiles = fullPaths.filter(f => validExtensions.includes(path.extname(f).toLowerCase()));

    await processVideoFiles(videoFiles, videoInfo);

    // Cleanup
    try {
        await fs.promises.rm(zipFileLocation, { force: true });
        await fs.promises.rm(extractDir, { recursive: true, force: true });
    } catch (e) {
        console.error("Cleanup error:", e);
    }
};

async function processVideoFiles(videoFiles, videoInfo) {
    if (videoFiles.length === 0) { return true; }

    // Generate UUID for group
    const groupId = crypto.randomUUID();
    const groupThumbName = groupId; // Use UUID for group thumbnail

    await db.VideoDb.videoGroupData.create({
        group_id: groupId,
        group_title: videoInfo.group_title,
        group_desc: videoInfo.group_desc || '',
        group_author: videoInfo.group_author || 'Unknown',
        group_tags: videoInfo.group_tags ? videoInfo.group_tags.join(',') : '',
        group_thumb_name: groupThumbName,
    });

    const videoDir = process.env.VIDEO_DIR;
    await fs.promises.mkdir(videoDir, { recursive: true }); // Ensure video directory exists

    // Limit concurrency to avoid CPU starvation (ffmpeg) and DB locking
    const CONCURRENCY_LIMIT = 2;
    const results = [];
    
    for (let i = 0; i < videoFiles.length; i += CONCURRENCY_LIMIT) {
        const chunk = videoFiles.slice(i, i + CONCURRENCY_LIMIT);
        const chunkResults = await Promise.all(chunk.map(file => (async () => {
            try {
                try {
                    await fs.promises.access(file);
                } catch {
                    throw new Error(`Source missing: ${file}`);
                }
                
                // Generate UUID for video
                const videoId = crypto.randomUUID();
                const suffix = path.extname(file).toLowerCase();
                
                // Use UUID for storage filename and thumbnail
                const videoStorageName = videoId; 
                const destPath = path.join(videoDir, `${videoStorageName}${suffix}`);

                try {
                    await fs.promises.rename(file, destPath);
                } catch (err) {
                    if (err.code === 'EXDEV') {
                        // Cross-device move: copy and delete
                        await fs.promises.copyFile(file, destPath);
                        await fs.promises.unlink(file);
                    } else {
                        throw err;
                    }
                }

                const metadata = await getVideoMetadata(destPath);
                const { streams, format } = metadata;
                const videoStream = streams.find(s => s.codec_type === 'video');

                await db.VideoDb.videoData.create({
                    video_id: videoId,
                    group_id: groupId,
                    video_filename: videoStorageName, // Stored as UUID
                    video_resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'Unknown',
                    video_format: suffix.replace('.', '').toUpperCase(),
                    video_duration: format.duration,
                    video_filesize: format.size,
                    video_frame_rate: videoStream && videoStream.avg_frame_rate?.includes('/')
                        ? Number(videoStream.avg_frame_rate.split('/')[0]) / Number(videoStream.avg_frame_rate.split('/')[1] || 1)
                        : (Number(videoStream?.avg_frame_rate) || 0),
                    video_codec: videoStream ? videoStream.codec_name : 'Unknown',
                    video_thumb_name: videoStorageName, // Stored as UUID
                });

                await generateThumbnail(`${videoStorageName}${suffix}`);
                return true;
            } catch (error) {
                console.error(`Failed to process video ${file}:`, error);
                errorByAPI(null, error, true);
                return false;
            }
        })()));
        results.push(...chunkResults);
    }

    const successCount = results.filter(r => r === true).length;

    if (successCount > 0) {
        await generateThumbnailGroup(groupId);
    } else {
        console.error(`No videos were successfully processed for group ${groupId}. Skipping group thumbnail generation.`);
    }
}

const getVideoMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                return reject(err);
            }
            resolve(metadata);
        });
    });
};