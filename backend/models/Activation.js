// backend/models/Activation.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Activation extends Model {}

  Activation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    licenseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'licenses', // nome da tabela
        key: 'id'
      }
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/i // Validação simples de domínio
      }
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIP: true
      }
    },
    activatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Activation',
    tableName: 'activations',
    timestamps: false // Não precisamos de createdAt/updatedAt aqui
  });

  return Activation;
};