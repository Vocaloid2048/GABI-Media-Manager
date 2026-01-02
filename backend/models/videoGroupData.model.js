const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes, uid) => {
  class VideoGroupData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VideoGroupData.init({
    group_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    group_title: DataTypes.TEXT,
    group_desc: DataTypes.TEXT,
    group_author: DataTypes.TEXT,
    group_tags: DataTypes.TEXT,
    group_thumb_name: DataTypes.TEXT,
    group_add_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'VideoGroupData',
    tableName: `video_group_data`,
    underscored: true,
    timestamps: false

  });
  return VideoGroupData;
};
