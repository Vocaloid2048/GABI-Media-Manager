const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadController = require('../controllers/upload.controller');
const uploadQueue = require('../middlewares/uploadQueue');
const checkAuth = require('../middlewares/checkAuth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.TEMP_DIR || '/tmp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

const router = express.Router();
// Order: Auth -> Queue -> Multer -> Controller
router.post('/', checkAuth, uploadQueue, upload.single('file'), uploadController.uploadVideoFile);

module.exports = router;