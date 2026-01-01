const router = require('express').Router()
const video = require("../controllers/video.controller")

// ./api/video
router.get('/group', video.getVideoGroupInfo)

module.exports = router