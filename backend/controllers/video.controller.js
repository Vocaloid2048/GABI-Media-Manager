const { raiseError, returnSuccess, checkParamsExisted, errorByAPI, USER_DOES_NOT_EXISTED, INVALID_REQUEST, WRONG_AUTHIZATION, MISSING_REQUIRE_KEYS } = require("../middlewares/error");
const db = require("../models");
const { actionRecord, SEARCH_RESULT, VIEW_RESULT, DOWNLOAD_VIDEO } = require("../middlewares/actionRecord");
const { Sequelize, where } = require("sequelize");
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { generateSafeName } = require("../middlewares/generateThumb");

// Pagination Requirement
const limitRequirement = (offset) => ({ limit: 12, offset: offset });

exports.getVideoGroupList = async (req, res) => {
    // Get Query Params
    const searchWords = req.query.search || "";
    const searchTags = req.query.tags || ""; 
    const offset = req.query.offset || 0;

    const whereConditions = [];

    // 1. Handle Tags Filter
    if (searchTags.trim() !== "") {
        const tags = searchTags.split("|").map(t => t.trim()).filter(t => t.length > 0);
        if (tags.length > 0) {
            // Match any of the selected tags (OR logic)
            const tagOrClauses = tags.map(tag => ({
                [Sequelize.Op.or]: [
                    Sequelize.where(Sequelize.col('group_tags'), { [Sequelize.Op.eq]: tag }),
                    Sequelize.where(Sequelize.col('group_tags'), { [Sequelize.Op.like]: `${tag},%` }),
                    Sequelize.where(Sequelize.col('group_tags'), { [Sequelize.Op.like]: `%,${tag}` }),
                    Sequelize.where(Sequelize.col('group_tags'), { [Sequelize.Op.like]: `%,${tag},%` })
                ]
            }));
            whereConditions.push({ [Sequelize.Op.or]: tagOrClauses });
        }
    }

    // 2. Handle Search Words (Case Insensitive)
    if (searchWords.trim() !== "") {
        const needle = searchWords.trim().toLowerCase();
        whereConditions.push(
            Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('group_title')),
                { [Sequelize.Op.like]: `%${needle}%` }
            )
        );
    }

    const queryOptions = {
        ...limitRequirement(offset),
        order: [['group_add_at', 'DESC']]
    };

    if (whereConditions.length > 0) {
        queryOptions.where = {
            [Sequelize.Op.and]: whereConditions
        };
    }

    const data = await db.VideoDb.videoGroupData.findAll(queryOptions);

    // Filter out user_id if multiple searches are happening? 
    // Usually SEARCH is just "user searched X", so we log it.
    // If no search words/tags, maybe just listing -> skip log to avoid spam?
    // Let's log only if there's a search occurring.
    if ((searchWords && searchWords.trim() !== "") || (searchTags && searchTags.trim() !== "")) {
        const userId = req.get("user_id") || req.query.user_id || null;
        if (userId) {
            actionRecord(req, res, userId, SEARCH_RESULT, `Search: "${searchWords}" Tags: "${searchTags}"`);
        }
    }

    return returnSuccess(res, data);
}

/**
 * Get Video Group Info
 * @param {*} req Request object
 * @param {*} res Response object
 * @returns Video Group Info
 */
exports.getVideoGroupInfo = async (req, res) => {
    const group_id = req.query.group_id;

    // Check Required Params
    if (!checkParamsExisted(group_id)) { raiseError(res, MISSING_REQUIRE_KEYS); return; }

    // Search Video Group Info
    const groupData = await db.VideoDb.videoGroupData.findOne({
        where: { group_id: group_id },
    })

    const videoData = await db.VideoDb.videoData.findAll({
        where: { group_id: group_id },
        order: [['video_filename', 'ASC']]
    });

    // Return Result
    if (groupData === null) {
        raiseError(res, INVALID_REQUEST);
    } else {
        // Process tags: Convert comma-separated IDs string to array of Tag objects
        if (groupData.group_tags) {
            const tagIds = groupData.group_tags.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            if (tagIds.length > 0) {
                const tags = await db.VideoDb.tagData.findAll({
                    where: {
                        tag_id: {
                            [Sequelize.Op.in]: tagIds
                        }
                    }
                });
                // Replace the string with the array of tag objects
                groupData.dataValues.group_tags = tags;
            } else {
                groupData.dataValues.group_tags = [];
            }
        } else {
            groupData.dataValues.group_tags = [];
        }

        // Action Record
        const userId = req.get("user_id") || req.query.user_id || null;
        if(userId){
             actionRecord(req, res, userId, VIEW_RESULT, `View Group: ${groupData.group_title} (${group_id})`);
        }

        returnSuccess(res, { groupData, videoData });
    }
};

exports.getVideoThumbnail = async (req, res) => {
    const thumb_name = req.query.name;

    // Check Required Params
    if (!checkParamsExisted(thumb_name)) { raiseError(res, MISSING_REQUIRE_KEYS); return; }

    // Return the thumbnail file
    const filePath = path.join(process.env.THUMB_DIR, thumb_name);
    if (!fs.existsSync(filePath)) {
        raiseError(res, INVALID_REQUEST);
        return;
    }

    return res.sendFile(filePath);
}

exports.getVideoTagsList = async (req, res) => {
    const typeOption = req.query.type || null;

    // Fetch All Video Tags
    const data = await db.VideoDb.tagData.findAll(
        typeOption ? { where: { tag_type: typeOption } } : {}
    );

    returnSuccess(res, data);
}

/**
 * Get Downloadable Video Request
 * @param {*} req Request object
 * @param {*} res Response object
 * @returns Downloadable Video Request
 */
exports.getDownloadableVideo = async (req, res) => {
    const user_id = req.query.user_id;
    const options = req.query.options || null;
    const reqId = req.query.id || null;

    // Check Mode
    if (req.query.check === 'true') {
        returnSuccess(res, { message: "Auth Valid" });
        return;
    }

    // Options Parsing, not used currently

    // Check Required Params
    if (!checkParamsExisted(reqId)) { raiseError(res, MISSING_REQUIRE_KEYS); return; }

    // Fetch Video List in the Group
    const videoQuery = await db.VideoDb.videoData.findAll({
        // where group_id = reqId OR video_id = reqId
        where: {
            [Sequelize.Op.or]: [
                { group_id: reqId },
                { video_id: reqId }
            ]
        },
        order: [['video_filename', 'ASC']]
    });
    
    if (!videoQuery || videoQuery.length === 0) { raiseError(res, INVALID_REQUEST); return; }

    console.log(`Preparing download for ID: ${reqId}, found ${videoQuery.length} videos.`);


    // If video_id is provided, return specific video download link
    if (videoQuery.length > 1) {
        // Prepare zip file for video group
        const videoGroupNameQuery = await db.VideoDb.videoGroupData.findOne({
            where: { group_id: reqId },
        })

        const videoGroupName = videoGroupNameQuery.group_title

        // Have to zip all videos in the group and return the zip file link
        const zipName = videoGroupName
            .replaceAll(" ", "_")
            .replace(/[!@#$%^&*();:<>{}[\]'\",]/g, "")
            + "_" + Date.now()
            + ".zip";
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipName)}"`);

        // Zip the file and save to temp location
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            throw err;
        });
        archive.pipe(res);

        // Rename those video files to meaningful names, E.g. TitleName_XX.mp4
        // Add video files to the zip
        let index = 1;

        // Log to HistoryData
        try {
            db.VideoDb.historyData.create({
                user_id: user_id, 
                group_id: reqId, 
                action_type: 'DOWNLOAD'
            });
            actionRecord(req, res, user_id, DOWNLOAD_VIDEO, `Download Zip: ${videoGroupName} (${reqId})`);
        } catch (logErr) {
            console.error("Failed to log download history", logErr);
        }

        for (const video of videoQuery) {
            const ext = video.video_format.toLowerCase();
            const safeName = generateSafeName(video.video_filename + "." + ext);
            
            if (!safeName) continue;
            
            const filePath = path.join(process.env.VIDEO_DIR, safeName);
            if (!fs.existsSync(filePath)) continue;

            // Generate meaningful name: GroupTitle_01.mp4
            // Sanitize group title for filename
            const safeTitle = videoGroupName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
            const newName = `${safeTitle}_${String(index).padStart(2, '0')}.${ext}`;
            
            archive.file(filePath, { name: newName });
            index++;
        }

        await archive.finalize();
        return;

    } else {
        // Prepare single video file download link
        const video = videoQuery[0];
        const ext = video.video_format.toLowerCase();

        // 1. Find actual file on disk (using original filename)
        const diskFileName = generateSafeName(video.video_filename + "." + ext);
        const filePath = path.join(process.env.VIDEO_DIR, diskFileName);

        if (!fs.existsSync(filePath)) {
            raiseError(res, INVALID_REQUEST);
            return;
        }

        // 2. Generate meaningful download name: GroupTitle_XX.mp4
        let downloadName = diskFileName;

        const group = await db.VideoDb.videoGroupData.findOne({
            where: { group_id: video.group_id },
        });

        if (group) {
            // Find index of this video in the group
            const allVideos = await db.VideoDb.videoData.findAll({
                where: { group_id: video.group_id },
                order: [['video_filename', 'ASC']],
                attributes: ['video_id']
            });
            
            const index = allVideos.findIndex(v => v.video_id === video.video_id) + 1;
            const safeTitle = group.group_title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
            downloadName = `${safeTitle}_${String(index).padStart(2, '0')}.${ext}`;
        }
        
        // Log to HistoryData
        try {
            db.VideoDb.historyData.create({
                user_id: user_id,
                group_id: video.group_id,
                video_id: video.video_id,
                action_type: 'DOWNLOAD'
            });
            actionRecord(req, res, user_id, DOWNLOAD_VIDEO, `Download File: ${downloadName} (${video.video_id})`);
        } catch (logErr) {
            console.error("Failed to log download history", logErr);
        }

        return res.download(filePath, downloadName);
    }
}