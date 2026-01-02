const { actionRecord, LOGIN } = require("../middlewares/actionRecord");
const { raiseError, returnSuccess, checkParamsExisted, errorByAPI, USER_DOES_NOT_EXISTED, INVALID_REQUEST, WRONG_AUTHIZATION } = require("../middlewares/error");
const db = require("../models");

exports.postLoginRequest = async (req, res) => {
    const username = req.get("username");
    const passwordHash = req.get("password_hash");

    if(!checkParamsExisted(username) || !checkParamsExisted(passwordHash)) {
        raiseError(res, MISSING_REQUIRE_KEYS);
        return;
    }

    const user = await db.VideoDb.userData.findOne({ where: { username: username, password_hash: passwordHash } });

    if (user === null) {
        raiseError(res, WRONG_AUTHIZATION);
        return;
    }

    returnSuccess(res, { user_id: user.id, salt: process.env.DS_SALT });

    // Update last login time
    user.last_login_at = Date.now();
    await user.save();
    
    actionRecord(req, res, user.user_id, LOGIN, `User ${username} logged in`);
    
}