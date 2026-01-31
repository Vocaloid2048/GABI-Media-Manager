const { generateProFile, saveProFile } = require('../utils/genProFile');
const db = require('../models');
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { returnSuccess, raiseError, errorByAPI, checkParamsExisted, INVALID_REQUEST, MISSING_REQUIRE_KEYS } = require('../middlewares/error');
const { extractSongData } = require('../utils/readProFile');

exports.getAllSongs = async (req, res) => {
  try {
    // Get Query Params
    const searchWords = req.query.search || "";
    const searchTags = req.query.tags || "";
    const searchLanguages = req.query.languages || "";
    const offset = parseInt(req.query.offset) || 0;
    const limit = 12; // Default limit

    const whereConditions = [];

    // 1. Handle Tags Filter
    if (searchTags.trim() !== "") {
      const tags = searchTags.split("|").map(t => t.trim()).filter(t => t.length > 0);
      if (tags.length > 0) {
        // song_tags stores comma-separated tag IDs like "1,2,3"
        const tagConditions = tags.map(tagId => ({
          song_tags: {
            [Sequelize.Op.like]: `%${tagId}%`
          }
        }));
        whereConditions.push({ [Sequelize.Op.or]: tagConditions });
      }
    }

    // 2. Handle Languages Filter
    if (searchLanguages.trim() !== "") {
      const languages = searchLanguages.split("|").map(l => l.trim()).filter(l => l.length > 0);
      if (languages.length > 0) {
        // song_language stores comma-separated languages like "zh,en"
        const languageConditions = languages.map(lang => ({
          song_language: {
            [Sequelize.Op.like]: `%${lang}%`
          }
        }));
        whereConditions.push({ [Sequelize.Op.or]: languageConditions });
      }
    }

    // 3. Handle Search Words (Case Insensitive)
    if (searchWords.trim() !== "") {
      const needle = searchWords.trim().toLowerCase();
      whereConditions.push(
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('song_name')),
          { [Sequelize.Op.like]: `%${needle}%` }
        )
      );
    }

    const queryOptions = {
      offset: offset,
      limit: limit,
      order: [['createdAt', 'DESC']],
    };

    if (whereConditions.length > 0) {
      queryOptions.where = {
        [Sequelize.Op.and]: whereConditions
      };
    }

    const songs = await db.VideoDb.songData.findAll(queryOptions);

    // Add uploader names to songs
    const songsWithNames = await Promise.all(songs.map(async (song) => {
      const user = await db.VideoDb.userData.findOne({
        where: { user_id: song.uploader_id }
      });
      return {
        ...song.toJSON(), // Convert Sequelize instance to plain object
        uploader_name: user ? (user.locale_name || user.username) : "未知使用者"
      };
    }));

    returnSuccess(res, songsWithNames);
  } catch (error) {
    errorByAPI(res, error);
  }
};

exports.uploadSong = async (req, res) => {
  try {
    const file = req.body.file || req.file;

    if (file === undefined) { return raiseError(res, INVALID_REQUEST); }

    // Check is video info params existed
    const { song_name, song_copyright, song_tags, song_language, hasTitlePage } = req.body;
    if (!song_name || !song_copyright || !song_tags || !song_language) {
      return raiseError(res, MISSING_REQUIRE_KEYS);
    }


    // 讀取檔案內容
    // 將 base64 字串轉回 buffer（二進位）
    let fileBuffer;
    if (typeof file === 'string') {
      fileBuffer = Buffer.from(file, 'base64');
    } else {
      fileBuffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    }

    // 將 buffer 寫入暫存檔案
    const tempDir = process.env.TEMP_DIR || path.join(__dirname, '../tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempPath = path.join(tempDir, `upload_${Date.now()}.pro`);
    fs.writeFileSync(tempPath, fileBuffer);

    // 解析暫存檔案取得歌曲資料
    const songData = await extractSongData(tempPath);

    // 修改 content，如果有標題頁，標記第一頁為 is_title
    let content = songData.content;
    if (hasTitlePage && Array.isArray(content) && content.length > 0) {
      content[0].is_title = true;
    }

    // 這裡 songData 需包含所有欄位，或可根據需要自行擴充
    const song = await db.VideoDb.songData.create({
      song_name: song_name,
      content: content,
      song_copyright: JSON.stringify(song_copyright || "{}"),
      song_tags: song_tags,
      song_language: song_language,
      uploader_id: req.get("user_id") || req.query.user_id,
    });

    fs.unlinkSync(tempPath);
    returnSuccess(res, song);
  } catch (error) {
    errorByAPI(res, error);
  }
};

exports.downloadSongProFile = async (req, res) => {
  try {
    const songId = req.params.id;
    const spacing = req.query.spacing || '1';
    const addBlankPage = req.query.addBlankPage === 'true';
    const theme = req.query.theme || 'default_Theme';
    const labelLanguage = req.query.labelLanguage || 'zh_hk';
    const addTitlePage = req.query.addTitlePage !== 'false'; // default true
    const showCopyright = req.query.showCopyright !== 'false'; // default true
    const copyrightLanguage = req.query.copyrightLanguage || 'zh_hk';

    if (!checkParamsExisted({ songId })) {
      return raiseError(res, MISSING_REQUIRE_KEYS);
    }

    // 從資料庫獲取歌曲資料
    const song = await db.VideoDb.songData.findOne({
      where: { song_id: songId }
    });

    if (!song) {
      return raiseError(res, INVALID_REQUEST);
    }

    // 生成 ProPresenter 文件結構
    const presentation = await generateProFile(song, { spacing, addBlankPage, theme, labelLanguage, addTitlePage, showCopyright, copyrightLanguage });

    // 創建臨時文件路徑
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 生成安全的檔案名稱
    const safeName = song.song_name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const fileName = `${safeName}_${Date.now()}.pro`;
    const filePath = path.join(tempDir, fileName);

    // 保存 ProPresenter 文件
    await saveProFile(presentation, filePath);

    // 設置下載標頭
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // 發送文件
    res.download(filePath, fileName, (err) => {
      // 下載完成後刪除臨時文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (err) {
        // Error downloading file - file cleanup already handled above
      }
    });

  } catch (error) {
    errorByAPI(res, error);
  }
};

exports.getThemes = async (req, res) => {
  try {
    const themeDir = path.join(__dirname, '../utils/theme');
    const files = fs.readdirSync(themeDir);
    let themes = files
      .filter(file => file.endsWith('_Theme'))
      .map(file => file.replace('_Theme', ''));

    // 如果有其他非 default_Theme 的檔案，則不展示 default_Theme
    const hasOtherThemes = themes.some(theme => theme !== 'default');
    if (hasOtherThemes) {
      themes = themes.filter(theme => theme !== 'default');
    }

    returnSuccess(res, themes);
  } catch (error) {
    errorByAPI(res, error);
  }
};

exports.getSongTags = async (req, res) => {
  const typeOption = req.query.type || null;

  // Fetch All Song Tags
  const data = await db.VideoDb.songTagData.findAll(
    typeOption ? { where: { tag_type: typeOption } } : {}
  );

  returnSuccess(res, data);
};

exports.getSongById = async (req, res) => {
  try {
    const songId = req.params.id;

    if (!checkParamsExisted({ songId })) {
      return raiseError(res, MISSING_REQUIRE_KEYS);
    }

    // 從資料庫獲取歌曲資料
    const song = await db.VideoDb.songData.findOne({
      where: { song_id: songId }
    });

    if (!song) {
      return raiseError(res, INVALID_REQUEST);
    }

    returnSuccess(res, song);
  } catch (error) {
    errorByAPI(res, error);
  }
};