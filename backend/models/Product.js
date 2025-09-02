const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class Product extends Model { }

  Product.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT }, // Descrição completa
    shortDescription: { type: DataTypes.STRING(500) }, // Descrição curta para licenciamento
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    monthlyPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, validate: { min: 0 } },
    annualPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true, validate: { min: 0 } },
    categoryId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'categories', key: 'id' } },
  files: { type: DataTypes.JSONB, defaultValue: [] },
  downloadFile: { type: DataTypes.STRING, allowNull: true }, // Caminho do arquivo ZIP do produto
    changelog: { type: DataTypes.TEXT }, // Campo para changelog
    featuredMedia: { type: DataTypes.STRING }, // URL/caminho da mídia de destaque
    mediaFiles: { type: DataTypes.JSONB, defaultValue: [] }, // Array de objetos com mídia
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isAllAccessIncluded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    maxActivations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true
  });

  return Product;
};
