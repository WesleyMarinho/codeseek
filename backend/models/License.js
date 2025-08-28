// backend/models/License.js
const { DataTypes, Model } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class License extends Model {
    isValid() {
      if (this.status !== 'active') return false;
      if (this.expiresOn && new Date() > this.expiresOn) return false;
      return true;
    }
  }

  License.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    key: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    activatedOn: { type: DataTypes.DATE },
    expiresOn: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('active', 'expired', 'revoked', 'pending'), defaultValue: 'pending' },
    maxActivations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'License',
    tableName: 'licenses',
    timestamps: true,
    hooks: {
      beforeValidate: (license) => {
        if (!license.key) {
          license.key = crypto.randomBytes(16).toString('hex').toUpperCase();
        }
      }
    }
  });

  return License;
};