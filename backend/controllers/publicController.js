// backend/controllers/publicController.js (VERSÃO FINAL E CORRIGIDA)

const { Product, Category, sequelize } = require('../models/index');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const publicController = {
  getPublicProducts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        sort = 'createdAt-desc',
        search,
        category,
        minPrice,
        maxPrice
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereClause = { isActive: true };
      if (search) {
        whereClause.name = { [Op.iLike]: `%${search}%` };
      }
      if (category) {
        whereClause.categoryId = category;
      }

      if (minPrice !== undefined && maxPrice !== undefined) {
        if (parseFloat(minPrice) === 0 && parseFloat(maxPrice) === 0) {
          whereClause.price = 0;
          whereClause.monthlyPrice = null;
        } else {
          whereClause.monthlyPrice = {
            [Op.between]: [minPrice, maxPrice]
          };
        }
      } else if (minPrice !== undefined) {
        whereClause.monthlyPrice = { [Op.gte]: minPrice };
      } else if (maxPrice !== undefined) {
        whereClause.monthlyPrice = { [Op.lte]: maxPrice };
      }

      const [sortField, sortOrder] = sort.split('-');
      const order = [[sortField || 'createdAt', sortOrder || 'DESC']];

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: { model: Category, as: 'category', attributes: ['id', 'name'] },
        attributes: [
          'id', 'name', 'description', 'shortDescription',
          'price', 'monthlyPrice', 'annualPrice',
          'featuredMedia', 'isAllAccessIncluded'
        ],
        order,
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        products: products,
        pagination: {
          total: count,
          pages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page)
        }
      });

    } catch (error) {
      logger.error('Error fetching public products:', { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, message: 'Server error while fetching products.' });
    }
  },

  // CÓDIGO NOVO E CORRIGIDO
  getPublicProduct: async (req, res) => {
    try {
      const product = await Product.findOne({
        where: { id: req.params.id, isActive: true },
        include: {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        attributes: [
          'id', 'name', 'description', 'shortDescription',
          'price', 'monthlyPrice', 'annualPrice',
          'featuredMedia', 'mediaFiles', 'changelog',
          'isAllAccessIncluded'
        ]
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found or inactive.' });
      }

      res.json({ success: true, product: product });

    } catch (error) {
      logger.error(`Error fetching public product ${req.params.id}:`, { error: error.message, stack: error.stack });
      res.status(500).json({ success: false, message: 'Server error while fetching product.' });
    }
  },

  // Listar categorias públicas
  getPublicCategories: async (req, res) => {
    try {
      const categories = await Category.findAll({
        attributes: [
          'id', 'name',
          [sequelize.fn("COUNT", sequelize.col("products.id")), "productCount"]
        ],
        include: [{
          model: Product,
          as: 'products',
          attributes: [],
          where: { isActive: true },
          required: false // Left join para incluir categorias sem produtos
        }],
        group: ['Category.id'],
        order: [['name', 'ASC']]
      });
      res.json({ success: true, categories });
    } catch (error) {
      logger.error('Error fetching public categories:', { error: error.message });
      res.status(500).json({ success: false, message: 'Server error while fetching categories.' });
    }
  },

  // Buscar informações do All Access Pass
  getAllAccessInfo: async (req, res) => {
    // ... (código existente sem alterações)
    try {
      const allAccessProduct = await Product.findOne({
        where: { name: 'All Access Pass', isActive: true },
        attributes: ['id', 'name', 'description', 'price', 'monthlyPrice', 'annualPrice']
      });

      if (!allAccessProduct) {
        return res.status(404).json({ success: false, message: 'All Access Pass not found.' });
      }

      const includedProductsCount = await Product.count({
        where: { isAllAccessIncluded: true, isActive: true }
      });

      res.json({ success: true, allAccess: { ...allAccessProduct.toJSON(), includedProductsCount } });
    } catch (error) {
      logger.error('Error fetching All Access info:', { error: error.message });
      res.status(500).json({ success: false, message: 'Server error while fetching All Access info.' });
    }
  }
};

module.exports = publicController;
