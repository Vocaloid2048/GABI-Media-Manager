const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const VideoDb = {};
VideoDb.sequelize = new Sequelize({
  storage: './db/video_database.db',
  dialect: 'sqlite',
  logging: false, // Reduce console noise
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    // 移除無效的 mode 設定，改用 initDb 中的 PRAGMA 設定
  }
});

VideoDb.actionRecord = require("./actionRecord.model")(VideoDb.sequelize,Sequelize)
VideoDb.tagData = require("./tagData.model")(VideoDb.sequelize,Sequelize)
VideoDb.videoData = require("./videoData.model")(VideoDb.sequelize,Sequelize)
VideoDb.userData = require("./userData.model")(VideoDb.sequelize,Sequelize)
VideoDb.videoGroupData = require("./videoGroupData.model")(VideoDb.sequelize,Sequelize)
VideoDb.historyData = require("./historyData.model")(VideoDb.sequelize, Sequelize)

// Define Associations
// HistoryData belongs to User
VideoDb.historyData.belongsTo(VideoDb.userData, { foreignKey: 'user_id' });
// HistoryData belongs to VideoGroup (for display title/thumb)
VideoDb.historyData.belongsTo(VideoDb.videoGroupData, { foreignKey: 'group_id', as: 'groupInfo' });
// HistoryData belongs to VideoData (if specific video downloaded)
VideoDb.historyData.belongsTo(VideoDb.videoData, { foreignKey: 'video_id', as: 'videoInfo' });


// Initialize the database and create tables if they don't exist
async function initDb() {
  try {
    await VideoDb.sequelize.authenticate();
    
    // 配置 SQLite 優化與鎖定處理
    // Journal Mode: WAL (Write-Ahead Logging) 提高並發性能
    await VideoDb.sequelize.query('PRAGMA journal_mode=WAL;');
    // Busy Timeout: 當資料庫鎖定時，等待 5000ms 而不是立即拋出 error
    await VideoDb.sequelize.query('PRAGMA busy_timeout=5000;');
    // Synchronous: NORMAL 在 WAL 模式下通常是安全的，且能提高寫入效能
    await VideoDb.sequelize.query('PRAGMA synchronous=NORMAL;');
    
    // [選擇性] 如果之前崩潰導致 WAL 檔案殘留，嘗試 Checkpoint 清理
    await VideoDb.sequelize.query('PRAGMA wal_checkpoint(TRUNCATE);');

    // Sync models
    await VideoDb.sequelize.sync();
    console.log("Database & tables created & WAL configured!");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

module.exports = {VideoDb, initDb};