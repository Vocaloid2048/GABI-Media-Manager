// create time router
const router = require('express').Router()
const time = require("../controllers/time.controller")

// ./api/time
router.get('/', time.getTime)


module.exports = router