const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WebhookLog = sequelize.define('WebhookLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Provider name (e.g., chargebee, custom)'
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Event type (e.g., invoice.payment_succeeded)'
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Complete webhook payload'
    },
    status: {
      type: DataTypes.ENUM('processed', 'failed', 'pending'),
      defaultValue: 'pending',
      allowNull: false
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if processing failed'
    }
  }, {
    tableName: 'webhook_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['provider']
      },
      {
        fields: ['eventType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return WebhookLog;
};
