const router = require('express').Router();
const user = require("../controllers/user.controller");

// ./api/user
router.post('/login', user.postLoginRequest);
router.post('/register', user.postRegisterRequest);
router.get('/history/download', user.getDownloadHistory);
module.exports = router;