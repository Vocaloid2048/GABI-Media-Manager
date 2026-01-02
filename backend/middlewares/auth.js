const { errorByAPI } = require("./error")
const { generateDs } = require("./generateDs")

// Export the function as a module
exports.auth = (ds, uid) => {
    if(process.env.NODE_ENV === 'development_no_auth') {
        return true
    }

    try {
        if ([undefined, null].includes(ds) || [undefined, null].includes(uid)) { return false }

        const dsSplit = ds.split(",")
        if (dsSplit.length < 3) { return false }
        const dsTime = dsSplit[0]
        const dsRandom = dsSplit[1]

        if (ds !== generateDs(uid, dsTime, dsRandom)
            //    && Math.floor(Date.now() / 1000) - dsTime < 300
        ) { return false }

        return true
    } catch (error) {
        errorByAPI(null, error);
        return false
    }
}