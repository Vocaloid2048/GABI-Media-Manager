const express = require('express');
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/upload.controller');

const storage = multer.diskStorage({
  destination: process.env.TEMP_DIR || '/tmp',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

const router = express.Router();
router.post('/', upload.single('file'), uploadController.uploadVideoFile);

module.exports = router;