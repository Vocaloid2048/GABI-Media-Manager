const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const VideoDb = {};
VideoDb.sequelize = new Sequelize('database', 'username', 'password', {
  storage: '../db/video_database.db',
  dialect: 'sqlite'
});

VideoDb.actionRecord = require("./actionRecord.model")(VideoDb.sequelize,Sequelize)
VideoDb.tagData = require("./tagData.model")(VideoDb.sequelize,Sequelize)
VideoDb.videoData = require("./videoData.model")(VideoDb.sequelize,Sequelize)
VideoDb.userData = require("./userData.model")(VideoDb.sequelize,Sequelize)
VideoDb.videoGroupData = require("./videoGroupData.model")(VideoDb.sequelize,Sequelize)

// Define associations
VideoDb.videoData.belongsToMany(VideoDb.tagData, { through: 'VideoTags', foreignKey: 'videoId' });
VideoDb.tagData.belongsToMany(VideoDb.videoData, { through: 'VideoTags', foreignKey: 'tagId' });

module.exports = {VideoDb};