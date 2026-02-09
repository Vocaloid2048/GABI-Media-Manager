const timeRouter = require('./time.route')
const videoRouter = require('./video.route')
const uploadRouter = require('./upload.route')
const userRouter = require('./user.route')
const songRouter = require('./song.route')
const toolRouter = require('./tool.route')

const router = require('express').Router()

router.get('/', (req, res) => {
  res.send('Here is api router')
})

router.use('/time', timeRouter)

router.use('/video', videoRouter)

router.use('/upload', uploadRouter)

router.use('/user', userRouter)

router.use('/song', songRouter)

router.use('/tool', toolRouter)

module.exports = router
