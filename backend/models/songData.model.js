const {
    Model,
  } = require('sequelize');
  
  module.exports = (sequelize, DataTypes, uid) => {
    class SongData extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
      }
    }
    SongData.init({
      song_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      song_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
      song_tags: {
        type: DataTypes.STRING,
        allowNull: false
      },
      song_language: {
        type: DataTypes.STRING,
        allowNull: false
      },
      song_copyright: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      song_ytlink: {
        type: DataTypes.STRING,
        allowNull: true
      },
      uploader_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user_data',
          key: 'user_id'
        }
      }
    }, {
      sequelize,
      modelName: 'SongData',
      tableName: 'song_data',
      timestamps: true
    });
    return SongData;
  };