const timeRouter = require('./time.route')
const videoRouter = require('./video.route')

const router = require('express').Router()

router.get('/', (req, res) => {
  res.send('Here is api router')
})

router.use('/time', timeRouter)

router.use('/video', videoRouter)

module.exports = router
