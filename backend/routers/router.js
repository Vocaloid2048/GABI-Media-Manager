const timeRouter = require('./time.route')
const videoRouter = require('./video.route')
const uploadRouter = require('./upload.route')

const router = require('express').Router()

router.get('/', (req, res) => {
  res.send('Here is api router')
})

router.use('/time', timeRouter)

router.use('/video', videoRouter)

router.use('/upload', uploadRouter)

module.exports = router
