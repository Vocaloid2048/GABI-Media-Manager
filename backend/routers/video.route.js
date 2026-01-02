const router = require('express').Router()
const video = require("../controllers/video.controller")

// ./api/video
router.get('/list', video.getVideoGroupList)
router.get('/group', video.getVideoGroupInfo)
router.get('/download', video.getDownloadableVideo)

module.exports = router