const router = require('express').Router();
const login = require("../controllers/login.controller");

// ./api/login
router.post('/', login.postLoginRequest);
router.post('/register', login.postRegisterRequest);
module.exports = router;