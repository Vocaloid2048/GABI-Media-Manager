const db = require('../models');
const { errorByAPI } = require('./error');

module.exports = {
    LOGIN: 'LOGIN',
    SEARCH_RESULT: 'SEARCH_RESULT',
    VIEW_RESULT: 'VIEW_RESULT',
    UPLOAD_VIDEO: 'UPLOAD_VIDEO',
    DOWNLOAD_VIDEO: 'DOWNLOAD_VIDEO',

    actionRecord(req, res, user_id, actionType, actionInfo){
        db.VideoDb.actionRecord.create({
            user_id: user_id || null,
            action_type: actionType,
            actionInfo: actionInfo || null,
            ip_addr: req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
        }).catch((err) => {
            errorByAPI(null, err, true);
        });
    }
}