const {
    Model,
  } = require('sequelize');
  
  module.exports = (sequelize, DataTypes, uid) => {
    class SongTagData extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
        // define association here
      }
    }
    SongTagData.init({
      tag_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      tag_en_name: DataTypes.TEXT,
      tag_zh_name: DataTypes.TEXT,
      tag_type: DataTypes.TEXT
    }, {
      sequelize,
      modelName: 'SongTagData',
      tableName:`song_tag_data`,
      underscored: true,
      timestamps: false
  
    });
    return SongTagData;
  };
  