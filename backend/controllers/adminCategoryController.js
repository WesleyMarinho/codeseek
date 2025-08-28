// backend/controllers/adminCategoryController.js
const { Category, Product, sequelize } = require('../models');
const logger = require('../config/logger');

const adminCategoryController = {
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.findAll({
                attributes: {
                    include: [
                        [sequelize.fn("COUNT", sequelize.col("products.id")), "productCount"]
                    ]
                },
                include: [{
                    model: Product,
                    as: 'products',
                    attributes: [],
                    required: false
                }],
                group: ['Category.id'],
                order: [['name', 'ASC']]
            });
            res.json({ success: true, categories });
        } catch (error) {
            logger.error('Error fetching categories:', { error: error.message });
            res.status(500).json({ success: false, message: 'Server error while fetching categories.' });
        }
    },

    // Criar uma nova categoria
    createCategory: async (req, res) => {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ success: false, message: 'Category name is required.' });
            }
            const newCategory = await Category.create({ name, description });
            res.status(201).json({ success: true, message: 'Category created successfully.', category: newCategory });
        } catch (error) {
            logger.error('Error creating category:', { error: error.message, stack: error.stack });
            if (error.name === 'SequelizeValidationError') {
                const messages = error.errors.map(e => e.message);
                return res.status(400).json({ success: false, message: 'Validation error.', errors: messages });
            }
            res.status(500).json({ success: false, message: 'Server error while creating category.' });
        }
    },

    // Atualizar uma categoria
    updateCategory: async (req, res) => {
        try {
            const { name, description } = req.body;
            const category = await Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({ success: false, message: 'Category not found.' });
            }
            if (!name) {
                return res.status(400).json({ success: false, message: 'Category name is required.' });
            }
            await category.update({ name, description });
            res.json({ success: true, message: 'Category updated successfully.', category });
        } catch (error) {
            logger.error('Error updating category:', { error: error.message, stack: error.stack });
            if (error.name === 'SequelizeValidationError') {
                const messages = error.errors.map(e => e.message);
                return res.status(400).json({ success: false, message: 'Validation error.', errors: messages });
            }
            res.status(500).json({ success: false, message: 'Server error while updating category.' });
        }
    },

    // Deletar uma categoria
    deleteCategory: async (req, res) => {
        try {
            const category = await Category.findByPk(req.params.id, {
                include: {
                    model: Product,
                    as: 'products',
                    attributes: ['id']
                }
            });
            if (!category) {
                return res.status(404).json({ success: false, message: 'Category not found.' });
            }
            // Regra de negócio: Não permitir deletar categoria com produtos
            if (category.products && category.products.length > 0) {
                return res.status(400).json({ success: false, message: 'Cannot delete category with associated products.' });
            }
            await category.destroy();
            res.json({ success: true, message: 'Category deleted successfully.' });
        } catch (error) {
            logger.error('Error deleting category:', { error: error.message, stack: error.stack });
            res.status(500).json({ success: false, message: 'Server error while deleting category.' });
        }
    }
};

module.exports = adminCategoryController;
