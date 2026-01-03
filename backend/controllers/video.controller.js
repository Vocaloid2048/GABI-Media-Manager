const { raiseError, returnSuccess, checkParamsExisted, errorByAPI, USER_DOES_NOT_EXISTED, INVALID_REQUEST, WRONG_AUTHIZATION } = require("../middlewares/error");
const db = require("../models");
const { auth } = require("../middlewares/auth");
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
            const tagOrClauses = tags.map(tag => 
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('group_tags')),
                    { [Sequelize.Op.like]: `%${tag.toLowerCase()}%` }
                )
            );
            whereConditions.push({ [Sequelize.Op.or]: tagOrClauses });
        }
    }

    // 2. Handle Search Words (Case Insensitive)
    if (searchWords.trim() !== "") {
        const needle = searchWords.trim().toLowerCase();
        whereConditions.push({
            [Sequelize.Op.or]: [
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('group_title')),
                    { [Sequelize.Op.like]: `%${needle}%` }
                ),
                Sequelize.where(
                    Sequelize.fn('LOWER', Sequelize.col('group_tags')),
                    { [Sequelize.Op.like]: `%${needle}%` }
                )
            ]
        });
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
    const offset = req.query.offset || 0;

    // Fetch All Video Tags
    const data = await db.VideoDb.tagData.findAll(limitRequirement(offset));

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
    const ds_key = req.get("ds");
    const options = req.query.options || null;
    const groupId = req.query.group_id || null;

    // Check Auth
    const authResult = auth(user_id, ds_key);
    if (!authResult) { raiseError(res, WRONG_AUTHIZATION); return; }

    // Check Required Params
    if (!checkParamsExisted(groupId)) { raiseError(res, MISSING_REQUIRE_KEYS); return; }

    // Fetch Video List in the Group
    const videoQuery = await db.VideoDb.videoData.findAll({
        where: { group_id: groupId },
    });
    const videoList = videoQuery.map(video => video.video_filename + "." + video.video_format.toLowerCase());

    if (!videoList || videoList.length === 0) { raiseError(res, INVALID_REQUEST); }


    // If video_id is provided, return specific video download link
    if (videoList.length > 1) {
        // Prepare zip file for video group
        const videoGroupNameQuery = await db.VideoDb.videoGroupData.findOne({
            where: { group_id: groupId },
        })

        const videoGroupName = videoGroupNameQuery.group_title

        // Have to zip all videos in the group and return the zip file link
        const zipName = videoGroupName
            .replaceAll(" ", "_")
            .replace(/[!@#$%^&*();:<>{}[\]'\",]/g, "")
            + "_" + Date.now()
            + ".zip";
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

        // Zip the file and save to temp location
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            throw err;
        });
        archive.pipe(res);

        // Add video files to the zip
        for (const video of videoList) {
            const safeName = generateSafeName(video);
            if (!safeName) {
                continue;
            }
            const filePath = path.join(process.env.VIDEO_DIR, safeName);
            if (!fs.existsSync(filePath)) {
                continue;
            }
            archive.file(filePath, { name: safeName });
        }

        await archive.finalize();
        return;

    } else {
        // Prepare single video file download link, Video Name : FileName_HD.mp4
        const safeVideoName = generateSafeName(videoList[0]);

        const filePath = path.join(process.env.VIDEO_DIR, safeVideoName);
        if (!fs.existsSync(filePath)) {
            raiseError(res, INVALID_REQUEST);
            return;
        }

        return res.download(filePath, safeVideoName);
    }
}