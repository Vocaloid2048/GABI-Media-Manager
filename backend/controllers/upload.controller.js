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

const validExtensions = (process.env.VALID_VIDEO_EXTENSIONS || '.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm').split(',');

exports.uploadVideoFile = async (req, res) => {
    const user_id = req.query.user_id;
    const ds_key = req.get("ds");

    // Authenticate User
    const user = auth(user_id, ds_key);
    if (!user) { return raiseError(res, WRONG_AUTHIZATION); }

    // Handle File Upload
    const file = req.file;
    if (file === undefined
        || !validExtensions.includes(path.extname(file.originalname).toLowerCase()) 
        && !path.extname(file.originalname).toLowerCase().includes('.zip')
    ) { return raiseError(res, INVALID_REQUEST); }

    // Check is video info params existed
    const videoInfo = JSON.parse(req.body.videoInfo || '{}')
    if (videoInfo.group_title === undefined || videoInfo.group_title === null || videoInfo.group_title === '') {
        return raiseError(res, INVALID_REQUEST);
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

    fs.mkdirSync(extractDir, { recursive: true });

    // Wait for extraction to complete
    await fs.createReadStream(zipFileLocation)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

    // Extraction complete, now process
    const extractedFiles = fs.readdirSync(extractDir).map(f => path.join(extractDir, f));
    const videoFiles = extractedFiles.filter(f => validExtensions.includes(path.extname(f).toLowerCase()));

    await processVideoFiles(videoFiles, videoInfo);

    // Cleanup
    fs.rmSync(zipFileLocation, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });
};

async function processVideoFiles(videoFiles, videoInfo) {
    if (videoFiles.length === 0) { return true; }

    const groupId = await db.VideoDb.videoGroupData.create({
        group_title: videoInfo.group_title,
        group_desc: videoInfo.group_desc || '',
        group_author: videoInfo.group_author || 'Unknown',
        group_tags: videoInfo.group_tags ? videoInfo.group_tags.join(',') : '',
        group_thumb_name: generateSafeName(videoInfo.group_title) + "_main_" + Date.now() || '',
        group_add_at: Date.now()
    }).then(group => group.group_id);

    const videoDir = process.env.VIDEO_DIR;
    fs.mkdirSync(videoDir, { recursive: true }); // Ensure video directory exists

    const tasks = videoFiles.map((file, index) => (async () => {
        try {
            if (!fs.existsSync(file)) throw new Error(`Source missing: ${file}`);
            const videoName = `${generateSafeName(videoInfo.group_title)}_${String(index + 1).padStart(2, '0')}_${Date.now()}`;
            const suffix = path.extname(file).toLowerCase();
            const destPath = path.join(videoDir, `${videoName}${suffix}`);

            fs.renameSync(file, destPath);

            const metadata = await getVideoMetadata(destPath);
            const { streams, format } = metadata;
            const videoStream = streams.find(s => s.codec_type === 'video');

            await db.VideoDb.videoData.create({
                group_id: groupId,
                video_filename: `${videoName}`,
                video_resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'Unknown',
                video_format: suffix.replace('.', '').toUpperCase(),
                video_duration: format.duration,
                video_filesize: format.size,
                video_frame_rate: videoStream && videoStream.avg_frame_rate?.includes('/')
                    ? Number(videoStream.avg_frame_rate.split('/')[0]) / Number(videoStream.avg_frame_rate.split('/')[1] || 1)
                    : (Number(videoStream?.avg_frame_rate) || 0),
                video_codec: videoStream ? videoStream.codec_name : 'Unknown',
                video_thumb_name: videoName,
            });

            await generateThumbnail(`${videoName}${suffix}`);
        } catch (error) {
            errorByAPI(null, error, true);
        }
    })());

    await Promise.all(tasks).then(async () => await generateThumbnailGroup(groupId));
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