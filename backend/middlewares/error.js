const fs = require('fs');
const path = require('path');

module.exports = {

    INVALID_REQUEST: ({ "retcode": -1000, "message": 'Invalid Request', "data": null }),
    WRONG_AUTHIZATION: ({ "retcode": -1001, "message": 'Wrong Authization', "data": null }),
    MISSING_REQUIRE_KEYS: ({ "retcode": -1002, "message": 'Missing Required Keys', "data": null }),
    DATATYPE_MISMATCH: ({ "retcode": -1003, "message": 'DataType Mismatch', "data": null }),
    KEY_CONFUSION: ({ "retcode": -1004, "message": 'Key Confusion', "data": null }),
    
    raiseError(res, apiErrors) {
        return res.status(200).json(apiErrors || { "retcode": -2, "message": 'Unknown', "data": null })
    },

    errorByAPI(res, err, isInternal = false) {
        //Now Time
        const logUnix = new Date()

        //To Readable Unix Timestamp
        const logDate = logUnix.toISOString()

        //Log Message
        const logMessage = `RES: ${res}\n\n${logDate} : ${err}\n${err.stack}`;

        //Log File Location
        const logDir = path.resolve(__dirname, '../logs');
        const logFile = path.join(logDir, `${logUnix.toISOString().replaceAll(":","-")}.log`);

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        fs.appendFileSync(logFile, logMessage, 'utf8');

        console.log(`${logDate} : ${err}\n${err.stack}`)

        if(!isInternal && ( res !== null || res !== undefined)) {
            return res.status(200).json({ "retcode": -1, "message": "API Error Without Specific Reasons in ", "data": null })
        }
    },

    exportToFile(res, data, dirPath, fileName, isInternal = false) {
        const logDir = path.resolve(__dirname, dirPath);
        const logFile = path.join(logDir, fileName);

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        fs.writeFileSync(logFile, data, 'utf8');

        if(!isInternal && ( res !== null || res !== undefined)) {
            return res.status(200).json({ "retcode": 1, "message": "Success", "data": null })
        }
    },

    returnSuccess(res, data) {
        return res.status(200).json(
            {
                retcode: 1,
                message: "Success",
                data: data || null
            }
        )
    },

    checkParamsExisted(params) {
        if (params === undefined || params === null) {
            return false
        }

        const values = Object.values(params)
        for (var param = 0 ; param < values.length ; param++) {
            if (values[param] === undefined || values[param] === null) {
                return false
            }
        }
        return true
    }
}