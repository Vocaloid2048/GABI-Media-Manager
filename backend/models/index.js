const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const VideoDb = {};
VideoDb.sequelize = new Sequelize({
  storage: './db/video_database.db',
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

// Initialize the database and create tables if they don't exist
function initDb() {
  if(VideoDb.sequelize.authenticate() == null) { return false; }

  // Create tables(actionRecord, tagData, ...) if they do not exist
  VideoDb.sequelize.sync()
    .then(() => {
      console.log("Database & tables created!");
    })
    .catch((error) => {
      console.error("Error creating database tables:", error);
    });
  return true;
}

module.exports = {VideoDb, initDb};