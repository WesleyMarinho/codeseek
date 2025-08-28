const path = require('path');
const { Op } = require('sequelize');
const { User, Product, License, Subscription, Invoice } = require('../models');
const logger = require('../config/logger');

// --- Helper Functions ---
const serveDashboardPage = (pageName) => (req, res) => {
  res.sendFile(path.join(__dirname, `../../frontend/dashboard/${pageName}.html`));
};
const serveAdminPage = (pageName) => (req, res) => {
  res.sendFile(path.join(__dirname, `../../frontend/admin/${pageName}.html`));
};


// ===============================================================
// --- EXPORTAÇÃO DO CONTROLLER ---
// ===============================================================

const dashboardController = {
  // --- Funções para servir páginas estáticas do Dashboard do Usuário ---
  index: serveDashboardPage('index'),
  profile: serveDashboardPage('profile'),
  products: serveDashboardPage('products'),
  licenses: serveDashboardPage('licenses'),
  billing: serveDashboardPage('billing'),
  support: serveDashboardPage('support'),
  includedProducts: serveDashboardPage('included-products'),
  manageLicense: serveDashboardPage('manage-license'),

  // --- Funções para servir páginas estáticas do Painel Administrativo ---
  adminIndex: serveAdminPage('index'),
  adminUsers: serveAdminPage('users'),
  adminProducts: serveAdminPage('products'),
  adminCategories: serveAdminPage('categories'),
  adminLicenses: serveAdminPage('licenses'),
  adminSubscriptions: serveAdminPage('subscriptions'),
  adminSettings: serveAdminPage('settings'),
  adminWebhooks: serveAdminPage('webhooks'),
  adminAddUser: serveAdminPage('add-user'),
  adminEditUser: serveAdminPage('edit-user'),
  adminAddProduct: serveAdminPage('add-product'),
  adminEditProduct: serveAdminPage('edit-product'),

  // --- API para a página "My Products" ---
  getUserProducts: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const licenses = await License.findAll({
        where: { userId },
        include: { model: Product, as: 'product', attributes: ['id', 'name'] },
        order: [['createdAt', 'DESC']]
      });

      const allProducts = licenses.map(license => {
        const isAllAccess = license.product.name === 'All Access Pass';
        return {
          productName: license.product.name,
          purchaseDate: license.createdAt,
          type: isAllAccess ? 'subscription' : 'license',
          licenseId: license.id
        };
      });
      res.json({ success: true, products: allProducts });
    } catch (error) {
      logger.error('Error fetching user products:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // --- API para a página "Included Products" (All Access) ---
  getAllAccessProducts: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const allAccessLicense = await License.findOne({
        where: { userId, status: 'active' },
        include: { model: Product, as: 'product', where: { name: 'All Access Pass' } }
      });

      if (!allAccessLicense) {
        return res.status(403).json({ success: false, message: "No active 'All Access Pass' subscription found." });
      }

      const includedProducts = await Product.findAll({
        where: { isAllAccessIncluded: true, isActive: true },
        attributes: ['id', 'name', 'description', 'price', 'files']
      });

      res.json({ success: true, products: includedProducts });
    } catch (error) {
      logger.error('Error fetching all-access products:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // --- API para dados do Dashboard do Usuário ---
  getUserDashboardData: async (req, res) => {
    try {
      // Verificar se a sessão existe
      if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const userId = req.session.user.id;
      const userPromise = User.findByPk(userId, { attributes: ['username', 'email', 'role', 'createdAt'] });
      const activeLicensesPromise = License.count({ where: { userId, status: 'active' } });
      const activeSubscriptionsPromise = Subscription.count({ where: { userId, status: 'active' } });
      const nextSubscriptionPromise = Subscription.findOne({ 
        where: { userId, status: 'active' }, 
        order: [['currentPeriodEnd', 'ASC']] 
      });
      const recentLicensesPromise = License.findAll({
        where: { userId },
        include: [{ model: Product, as: 'product', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      const [user, activeLicenses, activeSubscriptions, nextSubscription, recentLicenses] = await Promise.all([
        userPromise, activeLicensesPromise, activeSubscriptionsPromise, nextSubscriptionPromise, recentLicensesPromise
      ]);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const dashboardData = {
        user: user,
        stats: {
          activeLicenses,
          activeSubscriptions,
          nextInvoice: nextSubscription ? { amount: nextSubscription.price, date: nextSubscription.currentPeriodEnd } : null
        },
        recentActivity: recentLicenses.map(license => ({
          date: license.createdAt,
          product: license.product?.name || 'Unknown Product',
          activity: 'License activated',
        }))
      };
      res.json({ success: true, data: dashboardData });
    } catch (error) {
      logger.error('Error fetching user dashboard data:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
  
  // --- API para dados do Dashboard do Admin ---
  getAdminDashboardStats: async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));

        const mrrPromise = Subscription.sum('price', { where: { status: 'active' } });
        const activeSubscriptionsPromise = Subscription.count({ where: { status: 'active' } });
        const newUsersPromise = User.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } });
        const recentSalesPromise = Invoice.findAll({
            where: { status: 'paid' },
            limit: 5,
            order: [['issueDate', 'DESC']],
            include: [
                { model: User, as: 'user', attributes: ['email'] },
                { model: Subscription, as: 'subscription', attributes: ['plan'] }
            ]
        });

        const [mrr, activeSubscriptions, newUsers, recentSales] = await Promise.all([
            mrrPromise, activeSubscriptionsPromise, newUsersPromise, recentSalesPromise
        ]);

        res.json({
            success: true,
            stats: {
                mrr: mrr || 0,
                activeSubscriptions,
                newUsers
            },
            recentSales
        });

    } catch (error) {
        logger.error('Error fetching admin dashboard stats:', { error: error.message });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

module.exports = dashboardController;