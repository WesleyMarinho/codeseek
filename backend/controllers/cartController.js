const { Product, Category, Setting } = require('../models/index');
const logger = require('../config/logger');

class CartController {
    // Adicionar produto ao carrinho
    static async addToCart(req, res) {
        try {
            const { productId } = req.body;
            
            // Verificar se produto existe
            const product = await Product.findByPk(productId, {
                include: [{ model: Category, as: 'category' }]
            });
            
            if (!product || !product.isActive) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Product not found or inactive' 
                });
            }

            // Inicializar carrinho na sessão se não existir
            if (!req.session.cart) {
                req.session.cart = [];
            }

            // Verificar se produto já está no carrinho
            const existingItem = req.session.cart.find(item => String(item.productId) === String(productId));
            
            if (existingItem) {
                return res.json({
                    success: false,
                    message: 'Product already in cart',
                    cartCount: req.session.cart.length
                });
            }

            // Adicionar produto ao carrinho
            const cartItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                monthlyPrice: product.monthlyPrice,
                annualPrice: product.annualPrice,
                featuredMedia: product.featuredMedia,
                category: product.category ? product.category.name : null
            };

            req.session.cart.push(cartItem);

            logger.info(`Product ${productId} added to cart`, {
                userId: req.session.userId,
                cartCount: req.session.cart.length
            });

            res.json({
                success: true,
                message: 'Product added to cart',
                cartCount: req.session.cart.length,
                item: cartItem
            });

        } catch (error) {
            logger.error('Error adding product to cart:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    // Obter carrinho
    static async getCart(req, res) {
        try {
            const cart = req.session.cart || [];
            
            // Calcular totais
            const subtotal = cart.reduce((total, item) => total + parseFloat(item.price || 0), 0);
            const tax = 0; // Implementar lógica de impostos se necessário
            const total = subtotal + tax;

            res.json({
                success: true,
                cart: {
                    items: cart,
                    itemCount: cart.length,
                    subtotal: subtotal.toFixed(2),
                    tax: tax.toFixed(2),
                    total: total.toFixed(2)
                }
            });

        } catch (error) {
            logger.error('Error getting cart:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    // Remover produto do carrinho
    static async removeFromCart(req, res) {
        try {
            const { productId } = req.params;

            if (!req.session.cart) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Cart is empty' 
                });
            }

            const initialLength = req.session.cart.length;
            // Converter productId para string para comparação consistente
            req.session.cart = req.session.cart.filter(item => String(item.productId) !== String(productId));

            if (req.session.cart.length === initialLength) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Product not found in cart' 
                });
            }

            logger.info(`Product ${productId} removed from cart`, {
                userId: req.session.userId,
                cartCount: req.session.cart.length
            });

            res.json({
                success: true,
                message: 'Product removed from cart',
                cartCount: req.session.cart.length
            });

        } catch (error) {
            logger.error('Error removing product from cart:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    // Limpar carrinho
    static async clearCart(req, res) {
        try {
            req.session.cart = [];

            logger.info('Cart cleared', {
                userId: req.session.userId
            });

            res.json({
                success: true,
                message: 'Cart cleared',
                cartCount: 0
            });

        } catch (error) {
            logger.error('Error clearing cart:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    // Obter contagem do carrinho
    static async getCartCount(req, res) {
        try {
            const cartCount = req.session.cart ? req.session.cart.length : 0;

            res.json({
                success: true,
                cartCount
            });

        } catch (error) {
            logger.error('Error getting cart count:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    // Verificar se produto está no carrinho
    static async checkProductInCart(req, res) {
        try {
            const { productId } = req.params;
            const cart = req.session.cart || [];
            
            const isInCart = cart.some(item => String(item.productId) === String(productId));

            res.json({
                success: true,
                isInCart,
                cartCount: cart.length
            });

        } catch (error) {
            logger.error('Error checking product in cart:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }
}

module.exports = CartController;
