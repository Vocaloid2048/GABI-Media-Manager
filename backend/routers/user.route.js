const router = require('express').Router();
const user = require("../controllers/user.controller");
const checkAuth = require("../middlewares/checkAuth");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Avatar Storage Setup
const avatarDir = process.env.AVATAR_DIR || path.join(__dirname, '../storage/avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const user_id = req.get("user_id") || "unknown";
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${user_id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storage });

// ./api/user
router.post('/login', user.postLoginRequest);
router.post('/register', user.postRegisterRequest);

router.get('/info', checkAuth, user.getUserInfo);
router.post('/update', checkAuth, user.updateProfile);
router.post('/password', checkAuth, user.changePassword);
router.post('/avatar', checkAuth, upload.single('avatar'), user.updateAvatar);
router.get('/avatar', user.getAvatar);

router.get('/history/download', checkAuth, user.getDownloadHistory);

module.exports = router;