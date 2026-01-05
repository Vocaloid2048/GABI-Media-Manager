const router = require('express').Router()
const video = require("../controllers/video.controller")

// ./api/video
router.get('/list', video.getVideoGroupList)
router.get('/group', video.getVideoGroupInfo)
router.get('/download', video.getDownloadableVideo)
router.get('/thumb', video.getVideoThumbnail)
router.get('/tags', video.getVideoTagsList)

module.exports = router