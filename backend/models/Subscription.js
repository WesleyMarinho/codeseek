const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Subscription extends Model {
    /**
     * Checks if the subscription is currently active.
     * @returns {boolean}
     */
    isActive() {
      if (this.status !== 'active') return false;
      if (this.endDate && new Date() > this.endDate) return false;
      return true;
    }
  }

  Subscription.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    plan: { type: DataTypes.ENUM('basic', 'premium', 'all_access'), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending'), defaultValue: 'pending' },
    startDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    endDate: { type: DataTypes.DATE },
    currentPeriodStart: { type: DataTypes.DATE, allowNull: true },
    currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    chargebeeSubscriptionId: { type: DataTypes.STRING, allowNull: true, unique: true }
  }, {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true
  });

  return Subscription;
};