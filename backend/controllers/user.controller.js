const { actionRecord, LOGIN } = require("../middlewares/actionRecord");
const { auth } = require("../middlewares/auth");
const { raiseError, returnSuccess, checkParamsExisted, errorByAPI, USER_DOES_NOT_EXISTED, INVALID_REQUEST, WRONG_AUTHIZATION, MISSING_REQUIRE_KEYS, USER_ALREADY_EXISTED, INVALID_INVITATION_CODE } = require("../middlewares/error");
const db = require("../models");
const sha256 = require('js-sha256');

// Helper to hash password
const hashPassword = (password) => {
    return sha256(password);
};

exports.postLoginRequest = async (req, res) => {
    let username = req.body.username || req.get("username");
    let password = req.body.password; // Expecting client-side hash
    let passwordHash = null;

    if(!checkParamsExisted(username)) {
        raiseError(res, MISSING_REQUIRE_KEYS);
        return;
    }

    // If password provided (it should be the client-side hash), hash it again
    if (password) {
        passwordHash = hashPassword(password);
    }

    if(!checkParamsExisted(password)) {
        raiseError(res, MISSING_REQUIRE_KEYS);
        return;
    }

    const user = await db.VideoDb.userData.findOne({ where: { username: username, password_hash: passwordHash } });

    if (user === null) {
        raiseError(res, WRONG_AUTHIZATION);
        return;
    }

    returnSuccess(res, { user_id: user.user_id, username: user.username, salt: process.env.DS_SALT });

    // Update last login time
    user.last_login_at = new Date();
    await user.save();
    
    actionRecord(req, res, user.user_id, LOGIN, `User ${username} logged in`);
    
}

exports.postRegisterRequest = async (req, res) => {
    const { username, password, invitation_code } = req.body;

    if(!checkParamsExisted(username) || !checkParamsExisted(password) || !checkParamsExisted(invitation_code)) {
        raiseError(res, MISSING_REQUIRE_KEYS);
        return;
    }

    // Check Invitation Code
    const validCode = process.env.INVITATION_CODE || 'GABI2024';
    if (invitation_code !== validCode) {
        raiseError(res, INVALID_INVITATION_CODE);
        return;
    }

    // Check if user exists
    const existingUser = await db.VideoDb.userData.findOne({ where: { username: username } });
    if (existingUser) {
        raiseError(res, USER_ALREADY_EXISTED);
        return;
    }

    // Create User
    // Hash the client-side hash with server salt
    const passwordHash = hashPassword(password);
    
    try {
        const newUser = await db.VideoDb.userData.create({
            username: username,
            password_hash: passwordHash,
            role: 'user', // Default role
            last_login_at: new Date()
        });

        returnSuccess(res, { user_id: newUser.user_id, username: newUser.username, salt: process.env.DS_SALT});
        actionRecord(req, res, newUser.user_id, LOGIN, `User ${username} registered and logged in`);
    } catch (err) {
        errorByAPI(res, err);
    }
}

exports.getUserInfo = async (req, res) => {
    const user_id = req.query.user_id;
    const ds =  req.get("ds");

    if(!checkParamsExisted(user_id) || !checkParamsExisted(ds)) {
        raiseError(res, MISSING_REQUIRE_KEYS);
        return;
    }

    if(!auth(user_id, ds)) {
        raiseError(res, WRONG_AUTHIZATION);
        return;
    }

    // Else, fetch user info
    const user = await db.VideoDb.userData.findOne({ where: { user_id: user_id } });
    if (user === null) {
        raiseError(res, USER_DOES_NOT_EXISTED);
        return;
    }

    returnSuccess(res, user);
}

// GET /api/user/history/download
// Requires Auth
exports.getDownloadHistory = async (req, res) => {
    // User ID should be attached by auth middleware
    // If not, try to get from query/body (careful with security, depend on auth implementation)
    // Assuming checkAuth middleware populates req.user or we use session/token
    
    // For now, based on existing code style (passing user_id often in query), checking both.
    // Ideally, req.user.user_id from JWT.
    
    let user_id = null;
    if (req.user && req.user.user_id) user_id = req.user.user_id;
    else if (req.query.user_id) user_id = req.query.user_id;
    
    if (!user_id) {
        return errorByAPI(res, INVALID_REQUEST);
    }

    try {
        const history = await db.VideoDb.historyData.findAll({
            where: { 
                user_id: user_id,
                action_type: 'DOWNLOAD'
            },
            include: [
                {
                    model: db.VideoDb.videoGroupData,
                    as: 'groupInfo',
                    attributes: ['group_id', 'group_title', 'group_thumb_name']
                },
                {
                    model: db.VideoDb.videoData,
                    as: 'videoInfo',
                    attributes: ['video_id', 'video_filename', 'video_resolution']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        // Use Promise.all to handle async index lookup
        const formattedHistory = await Promise.all(history.map(async h => {
             const groupData = h.groupInfo ? h.groupInfo.dataValues : {};
             const videoData = h.videoInfo ? h.videoInfo.dataValues : null;

             let displayTitle = groupData.group_title || 'Unknown Video';
             
             // If specific video was downloaded, append info or customize title
             if (videoData) {
                 // Calculate Index based on all videos in this group
                 try {
                     const allVideos = await db.VideoDb.videoData.findAll({
                        where: { group_id: h.group_id },
                        order: [['video_filename', 'ASC']],
                        attributes: ['video_id']
                     });
                     
                     const idx = allVideos.findIndex(v => v.video_id === videoData.video_id) + 1;
                     const paddedIndex = String(idx).padStart(2, '0');
                     const resolution = videoData.video_resolution ? `(${videoData.video_resolution})` : '';

                     // Format: GroupTitle 01 (Resolution)
                     displayTitle = `${groupData.group_title} ${paddedIndex} ${resolution}`;

                 } catch (idxErr) {
                     console.error("Error calculating index", idxErr);
                     // Fallback
                     displayTitle = `${groupData.group_title} - ${videoData.video_resolution || 'Video'}`;
                 }
             } else {
                 displayTitle = `${groupData.group_title} (All)`;
             }

             return {
                 id: h.history_id,
                 date: h.created_at.toISOString().split('T')[0], // YYYY-MM-DD
                 title: displayTitle,
                 video_id: videoData ? videoData.video_id : null,
                 group_id: h.group_id
             };
        }));

        return returnSuccess(res, formattedHistory);

    } catch (err) {
        console.error(err);
        return errorByAPI(res, err, true);
    }
};
