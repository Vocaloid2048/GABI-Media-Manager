const {
    Model,
  } = require('sequelize');
  
  module.exports = (sequelize, DataTypes, uid) => {
    class TagData extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
        // define association here
      }
    }
    TagData.init({
      tag_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        defaultValue:0
      },
      tag_name: DataTypes.TEXT,
      tag_locale_name: DataTypes.TEXT,
    }, {
      sequelize,
      modelName: 'TagData',
      tableName:`tag_data`,
      underscored: true,
      timestamps: false
  
    });
    return TagData;
  };
  