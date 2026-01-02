const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes, uid) => {
  class UserData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserData.init({
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: DataTypes.TEXT,
    locale_name: DataTypes.TEXT,
    password_hash: DataTypes.TEXT,
    role: DataTypes.TEXT,
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'UserData',
    tableName: `user_data`,
    underscored: true,
    timestamps: false

  });
  return UserData;
};
