const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const toolController = require('../controllers/tool.controller');
const uploadQueue = require('../middlewares/uploadQueue');
const checkAuth = require('../middlewares/checkAuth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure Temp directory exists
    const dir = path.join(__dirname, '../Temp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Use token16 or Date
    const token16 = req.query.token16 || req.body.token16; 
    if (token16) {
        cb(null, `${token16}_${Date.now()}_${file.originalname}`);
    } else {
        cb(null, `upload_${Date.now()}_${file.originalname}`);
    }
  }
});

const upload = multer({ storage: storage });

router.post('/fix-encoding', checkAuth, uploadQueue, upload.single('file'), toolController.uploadToolFile);
router.post('/tag-convert', checkAuth, uploadQueue, upload.single('file'), toolController.uploadTagConvertFile);
router.post('/cancel', checkAuth, toolController.cancelToolUpload);

module.exports = router;
