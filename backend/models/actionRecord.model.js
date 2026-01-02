const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes, uid) => {
  class ActionRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ActionRecord.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: DataTypes.INTEGER,
    action_type: DataTypes.TEXT,
    action_info: DataTypes.TEXT('medium'),
    ip_addr: DataTypes.TEXT,
    datetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ActionRecord',
    tableName: `action_record`,
    underscored: true,
    timestamps: false

  });
  return ActionRecord;
};
