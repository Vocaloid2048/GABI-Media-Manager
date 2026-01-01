const { raiseError, returnSuccess } = require("../middlewares/error");

exports.getTime = async(req, res) => {
    try {
        const date = new Date();

        returnSuccess(res, {
            //"dateTime": newdate,
            "unixTime": Date.now()
        });

    } catch (error) {
        console.log(error);
    }
};