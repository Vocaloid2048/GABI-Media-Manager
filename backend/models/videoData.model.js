const {
    Model,
  } = require('sequelize');
  
  module.exports = (sequelize, DataTypes, uid) => {
    class VideoData extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
        // define association here
      }
    }
    VideoData.init({
      video_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      group_id: DataTypes.UUID,
      video_filename: DataTypes.TEXT,
      video_resolution: DataTypes.TEXT,
      video_format: DataTypes.TEXT,
      video_duration: DataTypes.FLOAT,
      video_filesize: DataTypes.INTEGER,
      video_frame_rate: DataTypes.FLOAT,
      video_codec: DataTypes.TEXT,
      video_thumb_name: DataTypes.TEXT
    }, {
      sequelize,
      modelName: 'VideoData',
      tableName:`video_data`,
      underscored: true,
      timestamps: false
  
    });
    return VideoData;
  };
  