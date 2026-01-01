const timeRouter = require('./time.route')

const router = require('express').Router()

router.get('/', (req, res) => {
  res.send('Here is api router')
})

router.use('/time', timeRouter) // Complete

module.exports = router
