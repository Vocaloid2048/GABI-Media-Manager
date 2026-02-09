const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const toolController = require('../controllers/tool.controller');

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
    cb(null, `upload_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

router.post('/fix-encoding', upload.single('file'), toolController.fixEncoding);

module.exports = router;
