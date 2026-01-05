const { auth } = require("./auth");
const { raiseError, WRONG_AUTHIZATION } = require("./error");

module.exports = (req, res, next) => {
    const user_id = req.get("user_id") || req.query.user_id;
    const ds_key = req.get("ds") || req.query.ds;

    if (!auth(ds_key, user_id)) {
        return raiseError(res, WRONG_AUTHIZATION);
    }
    
    next();
};
