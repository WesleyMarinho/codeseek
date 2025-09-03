// backend/models/Index.js
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../config/logger');

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Category = require('./Category')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const License = require('./License')(sequelize, Sequelize.DataTypes);
const Subscription = require('./Subscription')(sequelize, Sequelize.DataTypes);
const Activation = require('./Activation')(sequelize, Sequelize.DataTypes);
const Invoice = require('./Invoice')(sequelize, Sequelize.DataTypes);
const WebhookLog = require('./WebhookLog')(sequelize, Sequelize.DataTypes);
const Setting = require('./Setting')(sequelize, Sequelize.DataTypes);

// Define associations
// User associations
User.hasMany(License, { foreignKey: 'userId', as: 'licenses' });
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });

// Category associations
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

// Product associations
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Product.hasMany(License, { foreignKey: 'productId', as: 'licenses' });

// License associations
License.belongsTo(User, { foreignKey: 'userId', as: 'user' });
License.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
License.hasMany(Activation, { foreignKey: 'licenseId', as: 'activations' });

// Subscription associations
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Activation associations
Activation.belongsTo(License, { foreignKey: 'licenseId', as: 'license' });

// Invoice associations
Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sync database function
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.info(`Database synchronized ${force ? '(forced)' : '(safe)'}`);
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  User,
  Category,
  Product,
  License,
  Subscription,
  Activation,
  Invoice,
  WebhookLog,
  Setting,
  syncDatabase
};
