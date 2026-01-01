const { raiseError, returnSuccess, checkParamsExisted, errorByAPI, USER_DOES_NOT_EXISTED, INVALID_REQUEST } = require("../middlewares/error");
const db = require("../models");
const { auth } = require("../middlewares/auth");
const { Sequelize, where } = require("sequelize");

/**
 * Get Video Group Info
 * @param {*} req Request object
 * @param {*} res Response object
 * @returns Video Group Info
 */
exports.getVideoGroupInfo = async (req, res) => {
    // Optional Auth
    const ds_key = req.get("ds");
    const user_id = req.query.user_id;
    const group_id = req.query.group_id;
    if (!auth(ds_key, user_id)) return raiseError(res, WRONG_AUTHIZATION);

    // Check Required Params
    if (!checkParamsExisted(user_id, group_id)) { raiseError(res, MISSING_REQUIRE_KEYS); return; }

    // Search Video Group Info
    const data = await db.VideoDb.videoGroupData.findOne({
        where: { id: group_id },
    })

    // Return Result
    if (data === null) {
        return raiseError(res, INVALID_REQUEST);
    } else {
        return returnSuccess(res, data);
    }
};