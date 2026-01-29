const express = require('express');
const router = express.Router();
const songController = require('../controllers/song.controller');
const checkAuth = require('../middlewares/checkAuth');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.TEMP_DIR || '/tmp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  }})

const upload = multer({ storage });

router.get('/', songController.getAllSongs);
router.get('/tags', songController.getSongTags);
router.post('/upload', checkAuth, upload.single('file'), songController.uploadSong);
router.get('/:id', songController.getSongById);
router.get('/:id/download', checkAuth, songController.downloadSongProFile);

module.exports = router;