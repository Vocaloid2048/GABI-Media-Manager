const db = require('../models');
const { errorByAPI } = require('./error');

module.exports = {
    LOGIN: 'LOGIN',
    SEARCH_RESULT: 'SEARCH_RESULT',
    VIEW_RESULT: 'VIEW_RESULT',
    UPLOAD_VIDEO: 'UPLOAD_VIDEO',
    DOWNLOAD_VIDEO: 'DOWNLOAD_VIDEO',

    actionRecord(req, res, user_id, actionType, actionInfo){
        // Try to get IP from various reliable sources
        let ip = req.ip || 
                 req.headers['x-forwarded-for'] || 
                 (req.socket && req.socket.remoteAddress) || 
                 (req.connection && req.connection.remoteAddress) || 
                 null;

        // x-forwarded-for can be a list: "client, proxy1, proxy2"
        if (ip && typeof ip === 'string' && ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }

        // Handle IPv6 mapped IPv4 (e.g., ::ffff:127.0.0.1)
        if (ip && typeof ip === 'string' && ip.includes('::ffff:')) {
            ip = ip.split('::ffff:')[1];
        }

        db.VideoDb.actionRecord.create({
            user_id: user_id || null,
            action_type: actionType,
            action_info: actionInfo || null,
            ip_addr: ip,
        }).catch((err) => {
            errorByAPI(null, err, true);
        });
    }
}