const express = require('express');
const router = express.Router();
const lyricEditorController = require('../controllers/lyricEditor.controller');
const checkAuth = require('../middlewares/checkAuth');

router.post('/parse-text', checkAuth, lyricEditorController.parseText);
router.post('/parse-pro', checkAuth, lyricEditorController.uploadPro, lyricEditorController.parsePro);
router.post('/generate-pro', checkAuth, lyricEditorController.generatePro);

module.exports = router;
