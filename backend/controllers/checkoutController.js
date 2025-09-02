const { Product, User, Invoice, Subscription, Setting } = require('../models');
const logger = require('../config/logger');
const { initializeChargebee, getChargebeeConfig } = require('../config/chargebee');

class CheckoutController {
    // Criar sessão de checkout para produto individual
    static async createProductCheckout(req, res) {
        try {
            const { productId, billingPeriod = 'one_time' } = req.body;
            
            // Inicializar Chargebee com configurações do banco
            const chargebee = await initializeChargebee();
            
            // Verificar se usuário está logado
            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Buscar produto
            const product = await Product.findByPk(productId);
            if (!product || !product.isActive) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found or inactive'
                });
            }

            // Buscar usuário
            const user = await User.findByPk(req.session.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Determinar preço baseado no período de cobrança
            let price, priceData;
            
            if (billingPeriod === 'monthly' && product.monthlyPrice) {
                price = product.monthlyPrice;
                priceData = {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        description: product.shortDescription,
                        images: product.featuredMedia ? [`${process.env.BASE_URL}/uploads/products/images/${product.featuredMedia}`] : []
                    },
                    unit_amount: Math.round(parseFloat(price) * 100),
                    recurring: {
                        interval: 'month'
                    }
                };
            } else if (billingPeriod === 'yearly' && product.annualPrice) {
                price = product.annualPrice;
                priceData = {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        description: product.shortDescription,
                        images: product.featuredMedia ? [`${process.env.BASE_URL}/uploads/products/images/${product.featuredMedia}`] : []
                    },
                    unit_amount: Math.round(parseFloat(price) * 100),
                    recurring: {
                        interval: 'year'
                    }
                };
            } else {
                price = product.price;
                priceData = {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        description: product.shortDescription,
                        images: product.featuredMedia ? [`${process.env.BASE_URL}/uploads/products/images/${product.featuredMedia}`] : []
                    },
                    unit_amount: Math.round(parseFloat(price) * 100)
                };
            }

            // Criar ou encontrar customer no Chargebee
            let chargebeeCustomer;
            if (user.chargebeeCustomerId) {
                const customerResult = await chargebee.customer.retrieve(user.chargebeeCustomerId).request();
                chargebeeCustomer = customerResult.customer;
            } else {
                const customerResult = await chargebee.customer.create({
                    email: user.email,
                    first_name: user.username,
                    id: `user_${user.id}`
                }).request();
                chargebeeCustomer = customerResult.customer;

                // Salvar customer ID no usuário
                await user.update({ chargebeeCustomerId: chargebeeCustomer.id });
            }

            // Criar hosted page para checkout
            let hostedPageResult;
            if (billingPeriod === 'one_time') {
                // Para pagamentos únicos, usar checkout_one_time
                hostedPageResult = await chargebee.hosted_page.checkout_one_time({
                    customer_id: chargebeeCustomer.id,
                    currency_code: 'USD',
                    invoice_note: `Purchase: ${product.name}`,
                    charges: [{
                        amount: Math.round(price * 100), // Chargebee usa centavos
                        description: product.name
                    }],
                    redirect_url: `${process.env.BASE_URL}/checkout/success`,
                    cancel_url: `${process.env.BASE_URL}/checkout/cancel`
                }).request();
            } else {
                // Para assinaturas, usar checkout_new_subscription
                hostedPageResult = await chargebee.hosted_page.checkout_new_subscription({
                    subscription: {
                        plan_id: `product_${product.id}_${billingPeriod}`,
                        customer_id: chargebeeCustomer.id
                    },
                    redirect_url: `${process.env.BASE_URL}/checkout/success`,
                    cancel_url: `${process.env.BASE_URL}/checkout/cancel`
                }).request();
            }
            
            const hostedPage = hostedPageResult.hosted_page;

            logger.info('Checkout hosted page created for product', {
                hostedPageId: hostedPage.id,
                productId: product.id,
                userId: user.id,
                amount: price
            });

            res.json({
                success: true,
                checkoutUrl: hostedPage.url,
                hostedPageId: hostedPage.id
            });

        } catch (error) {
            logger.error('Error creating product checkout:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create checkout session'
            });
        }
    }

    // Criar sessão de checkout para carrinho
    static async createCartCheckout(req, res) {
        try {
            // Inicializar Chargebee com configurações do banco
            const chargebee = await initializeChargebee();
            
            // Verificar se usuário está logado
            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Verificar se carrinho existe e não está vazio
            if (!req.session.cart || req.session.cart.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Buscar usuário
            const user = await User.findByPk(req.session.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Validar produtos do carrinho
            const productIds = req.session.cart.map(item => item.productId);
            const validProducts = await Product.findAll({
                where: { 
                    id: productIds,
                    isActive: true 
                }
            });

            if (validProducts.length !== req.session.cart.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some products in cart are no longer available'
                });
            }

            // Criar ou encontrar customer no Chargebee
            let chargebeeCustomer;
            if (user.chargebeeCustomerId) {
                const customerResult = await chargebee.customer.retrieve(user.chargebeeCustomerId).request();
                chargebeeCustomer = customerResult.customer;
            } else {
                const customerResult = await chargebee.customer.create({
                    email: user.email,
                    first_name: user.username,
                    id: `user_${user.id}`
                }).request();
                chargebeeCustomer = customerResult.customer;

                await user.update({ chargebeeCustomerId: chargebeeCustomer.id });
            }

            // Criar charges para checkout do carrinho
            const charges = req.session.cart.map(item => ({
                amount: Math.round(parseFloat(item.price) * 100), // Chargebee usa centavos
                description: item.name
            }));

            // Criar hosted page para checkout do carrinho
            const hostedPageResult = await chargebee.hosted_page.checkout_one_time({
                customer_id: chargebeeCustomer.id,
                currency_code: 'USD',
                invoice_note: 'Cart Purchase',
                charges: charges,
                redirect_url: `${process.env.BASE_URL}/checkout/success`,
                cancel_url: `${process.env.BASE_URL}/checkout/cancel`
            }).request();
            
            const hostedPage = hostedPageResult.hosted_page;

            logger.info('Checkout hosted page created for cart', {
                hostedPageId: hostedPage.id,
                userId: user.id,
                productCount: req.session.cart.length
            });

            res.json({
                success: true,
                checkoutUrl: hostedPage.url,
                hostedPageId: hostedPage.id
            });

        } catch (error) {
            logger.error('Error creating cart checkout:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create checkout session'
            });
        }
    }

    // Criar sessão para assinatura All Access
    static async createAllAccessCheckout(req, res) {
        try {
            const { billingPeriod = 'monthly' } = req.body;
            
            // Inicializar Chargebee com configurações do banco
            const chargebee = await initializeChargebee();

            // Verificar se usuário está logado
            if (!req.session.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Buscar usuário
            const user = await User.findByPk(req.session.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verificar se usuário já tem assinatura ativa
            const existingSubscription = await Subscription.findOne({
                where: {
                    userId: user.id,
                    status: 'active'
                }
            });

            if (existingSubscription) {
                return res.status(400).json({
                    success: false,
                    message: 'User already has an active subscription'
                });
            }

            // Buscar configurações de preços
            const monthlyPriceSetting = await Setting.findOne({ where: { key: 'all_access_monthly_price' } });
            const yearlyPriceSetting = await Setting.findOne({ where: { key: 'all_access_yearly_price' } });

            const monthlyPrice = monthlyPriceSetting ? parseFloat((monthlyPriceSetting.value && monthlyPriceSetting.value.value) || monthlyPriceSetting.value) : 497;
            const yearlyPrice = yearlyPriceSetting ? parseFloat((yearlyPriceSetting.value && yearlyPriceSetting.value.value) || yearlyPriceSetting.value) : 4970;

            const price = billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
            const interval = billingPeriod === 'yearly' ? 'year' : 'month';

            // Create or retrieve Chargebee customer
            let chargebeeCustomer;
            if (user.chargebeeCustomerId) {
                const customerResult = await chargebee.customer.retrieve(user.chargebeeCustomerId).request();
                chargebeeCustomer = customerResult.customer;
            } else {
                const customerResult = await chargebee.customer.create({
                    email: user.email,
                    first_name: user.username,
                    id: `user_${user.id}`
                }).request();
                chargebeeCustomer = customerResult.customer;
                await user.update({ chargebeeCustomerId: chargebeeCustomer.id });
            }

            // Criar hosted page para assinatura All Access
            const hostedPageResult = await chargebee.hosted_page.checkout_new_subscription({
                subscription: {
                    plan_id: `all_access_${billingPeriod}`,
                    customer_id: chargebeeCustomer.id
                },
                redirect_url: `${process.env.BASE_URL}/checkout/success`,
                cancel_url: `${process.env.BASE_URL}/checkout/cancel`
            }).request();
            
            const hostedPage = hostedPageResult.hosted_page;

            logger.info('All Access checkout hosted page created', {
                hostedPageId: hostedPage.id,
                userId: user.id,
                billingPeriod,
                amount: price
            });

            res.json({
                success: true,
                checkoutUrl: hostedPage.url,
                hostedPageId: hostedPage.id
            });

        } catch (error) {
            logger.error('Error creating All Access checkout:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create checkout session'
            });
        }
    }

    // Verificar status da hosted page
    static async verifySession(req, res) {
        try {
            const hostedPageId = req.params.hostedPageId || req.params.sessionId;
            
            // Inicializar Chargebee com configurações do banco
            const chargebee = await initializeChargebee();

            if (!hostedPageId) {
                return res.status(400).json({
                    success: false,
                    message: 'Hosted Page ID is required'
                });
            }

            const hostedPageResult = await chargebee.hosted_page.retrieve(hostedPageId).request();
            const hostedPage = hostedPageResult.hosted_page;

            res.json({
                success: true,
                hostedPage: {
                    id: hostedPage.id,
                    type: hostedPage.type,
                    url: hostedPage.url,
                    state: hostedPage.state,
                    created_at: hostedPage.created_at,
                    updated_at: hostedPage.updated_at
                }
            });

        } catch (error) {
            logger.error('Error verifying hosted page:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify hosted page'
            });
        }
    }
}

module.exports = CheckoutController;
