const { generateProFile, saveProFile } = require('../utils/genProFile');
const db = require('../models');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Pagination Requirement
const limitRequirement = (offset) => ({ limit: 12, offset: offset });
const { Sequelize } = require('sequelize');
const { returnSuccess, raiseError, errorByAPI, checkParamsExisted, INVALID_REQUEST, MISSING_REQUIRE_KEYS } = require('../middlewares/error');
const { extractSongData } = require('../utils/readProFile');

exports.getAllSongs = async (req, res) => {
  try {
    // Get Query Params
    const searchWords = req.query.search || "";
    const searchTags = req.query.tags || "";
    const offset = parseInt(req.query.offset) || 0;
    const limit = 12; // Default limit

    const whereConditions = [];

    // 1. Handle Tags Filter
    if (searchTags.trim() !== "") {
      const tags = searchTags.split("|").map(t => t.trim()).filter(t => t.length > 0);
      if (tags.length > 0) {
        // song_tags stores array of tag IDs like [1, 2, 3]
        // Convert to string for LIKE queries: "[1,2,3]"
        const tagConditions = tags.map(tagId => ({
          song_tags: {
            [Sequelize.Op.like]: `%${tagId}%`
          }
        }));
        whereConditions.push({ [Sequelize.Op.or]: tagConditions });
      }
    }

    // 2. Handle Search Words (Case Insensitive)
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

    returnSuccess(res, songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    errorByAPI(res, error);
  }
};

exports.uploadSong = async (req, res) => {
  try {
    const file = req.body.file || req.file;

    if (file === undefined) { return raiseError(res, INVALID_REQUEST); }

    // Check is video info params existed
    const { song_name, song_copyright, song_tags, song_language } = req.body;
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

    // 這裡 songData 需包含所有欄位，或可根據需要自行擴充
    const song = await db.VideoDb.songData.create({
      song_name: song_name,
      content: songData.content,
      song_copyright: JSON.stringify(song_copyright || "{}"),
      song_tags: song_tags || "",
      song_language: song_language || "",
      uploader_id: req.get("user_id"),
    });

    fs.unlinkSync(tempPath);
    returnSuccess(res, song);
  } catch (error) {
    console.error('Error uploading song:', error);
    errorByAPI(res, error);
  }
};

exports.downloadSongProFile = async (req, res) => {
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

    // 生成 ProPresenter 文件結構
    const presentation = await generateProFile(song);

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
        console.error('Error downloading file:', err);
      }
    });

  } catch (error) {
    console.error('Error downloading ProPresenter file:', error);
    errorByAPI(res, error);
  }
};

exports.getSongTags = async (req, res) => {
  const typeOption = req.query.type || null;

  // Fetch All Video Tags
  const data = await db.VideoDb.songTagData.findAll(
    typeOption ? { where: { tag_type: typeOption } } : {}
  );

  returnSuccess(res, data);
}