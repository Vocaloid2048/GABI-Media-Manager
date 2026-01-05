const { actionRecord, LOGIN } = require("../middlewares/actionRecord");
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