// backend/models/Invoice.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Invoice extends Model {}

  Invoice.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    subscriptionId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'subscriptions', key: 'id' } },
    chargebeeInvoiceId: { type: DataTypes.STRING, allowNull: true, unique: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM('paid', 'pending', 'failed'), allowNull: false, defaultValue: 'pending' },
    issueDate: { type: DataTypes.DATE, allowNull: false },
    dueDate: { type: DataTypes.DATE, allowNull: false },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    pdfUrl: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true
  });

  return Invoice;
};