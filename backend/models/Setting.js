const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Setting extends Model {}

  Setting.init({
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: true,
  });

  return Setting;
};
