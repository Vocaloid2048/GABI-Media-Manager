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
    // If token16 is provided in query (from frontend upload logic), use it to prefix the filename
    // Format: <token16>-<unixTime>_<originalExt> (or .zip)
    const token16 = req.query.token16 || req.body.token16; 
    const ext = path.extname(file.originalname);

    if (token16) {
       cb(null, `${token16}-${Date.now()}${ext}`);
    } else {
       cb(null, Date.now() + ext);
    }
  }
});

const upload = multer({ storage });

const router = express.Router();
// Order: Auth -> Queue -> Multer -> Controller
router.post('/', checkAuth, uploadQueue, upload.single('file'), uploadController.uploadVideoFile);
router.post('/cancel', checkAuth, uploadController.cancelUpload);

module.exports = router;