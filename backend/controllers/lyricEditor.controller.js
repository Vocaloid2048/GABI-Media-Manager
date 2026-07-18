const { parseLyricText, buildSlides, autoPairStanzas } = require('../utils/lyricParser');
const { extractAllSlides } = require('../utils/proFileExtractor');
const { generateMultiLangProFile, saveProFile } = require('../utils/genProFile');
const { returnSuccess, raiseError, INVALID_REQUEST, errorByAPI } = require('../middlewares/error');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 配置 multer 用於 .pro 檔案上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.TEMP_DIR || path.join(__dirname, '../tmp');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `pro_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage });

/**
 * POST /api/tool/lyric-editor/parse-text
 * 解析純文字歌詞，返回段落列表
 */
exports.parseText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return raiseError(res, INVALID_REQUEST);
    }

    const stanzas = parseLyricText(text);
    returnSuccess(res, stanzas);
  } catch (error) {
    errorByAPI(res, error);
  }
};

/**
 * POST /api/tool/lyric-editor/parse-pro
 * 解析 .pro 檔案，返回所有 slides
 */
exports.parsePro = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return raiseError(res, INVALID_REQUEST);
    }

    const result = await extractAllSlides(file.path);

    // 清理暫存檔案
    try { fs.unlinkSync(file.path); } catch (e) {}

    returnSuccess(res, result);
  } catch (error) {
    console.error('Parse pro error:', error);
    errorByAPI(res, error);
  }
};

/**
 * POST /api/tool/lyric-editor/generate-pro
 * 根據前端提供的 slides 和設定生成 .pro 檔案並下載
 */
exports.generatePro = async (req, res) => {
  try {
    const {
      songName,
      slides,
      copyright,
      theme,
      labelLanguage,
      spacing,
      addTitlePage,
      addBlankPage,
      showCopyright,
      copyrightLanguage,
      useIntroAsLabel
    } = req.body;

    if (!songName || !Array.isArray(slides) || slides.length === 0) {
      return raiseError(res, INVALID_REQUEST);
    }

    const presentation = await generateMultiLangProFile({
      songName,
      slides,
      copyright: copyright || {},
      theme: theme || 'default_Theme',
      labelLanguage: labelLanguage || 'zh_hk',
      spacing: spacing || '1',
      addTitlePage: addTitlePage !== false,
      addBlankPage: addBlankPage === true,
      showCopyright: showCopyright !== false,
      copyrightLanguage: copyrightLanguage || 'zh_hk',
      useIntroAsLabel: useIntroAsLabel === true
    });

    // 創建臨時文件
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const safeName = songName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const fileName = `${safeName}_${Date.now()}.pro`;
    const filePath = path.join(tempDir, fileName);

    await saveProFile(presentation, filePath);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    res.download(filePath, fileName, (err) => {
      try { fs.unlinkSync(filePath); } catch (e) {}
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    console.error('Generate pro error:', error);
    errorByAPI(res, error);
  }
};

// 導出 multer upload 中間件供路由使用
exports.uploadPro = upload.single('file');
