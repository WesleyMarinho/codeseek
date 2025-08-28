// backend/models/index.js

const { sequelize } = require('../config/database');
const logger = require('../config/logger');

// --- Carregar e Inicializar todos os Modelos ---
// Este padrão garante que todos os modelos sejam inicializados corretamente com a mesma instância do Sequelize.
const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const License = require('./License')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Activation = require('./Activation')(sequelize);
const Invoice = require('./Invoice')(sequelize);
const WebhookLog = require('./WebhookLog')(sequelize);
const Setting = require('./Setting')(sequelize);

const db = {
  sequelize,
  User,
  Category,
  Product,
  License,
  Subscription,
  Activation,
  Invoice,
  WebhookLog,
  Setting
};

// --- Definir as Associações ---
// User
User.hasMany(License, { foreignKey: 'userId', as: 'licenses' });
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
User.hasMany(Invoice, { foreignKey: 'userId', as: 'invoices' });

// Category
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

// Product
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Product.hasMany(License, { foreignKey: 'productId', as: 'licenses' });

// License
License.belongsTo(User, { foreignKey: 'userId', as: 'user' });
License.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
// Uma licença pode ter muitas ativações.
License.hasMany(Activation, {
  foreignKey: 'licenseId',
  as: 'activations',
  onDelete: 'CASCADE'
});

// Activation
Activation.belongsTo(License, {
  foreignKey: 'licenseId',
  as: 'license'
});

// Subscription
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Subscription.hasMany(Invoice, { foreignKey: 'subscriptionId', as: 'invoices' });

// Invoice
Invoice.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Invoice.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });


// --- Função de Sincronização ---
// Adicionamos o objeto `db` ao escopo da função para referência.
db.syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.startup('Database sincronizado');
  } catch (error) {
    logger.error(`Erro ao sincronizar database: ${error.message}`);
    throw error;
  }
};

module.exports = db;