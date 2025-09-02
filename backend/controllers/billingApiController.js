// backend/controllers/billingApiController.js

const { Subscription, Invoice } = require('../models/Index');
const logger = require('../config/logger');

const billingApiController = {
  /**
   * API Endpoint to get all billing data (subscriptions and invoices) for the logged-in user.
   */
  getUserBillingData: async (req, res) => {
    try {
      const userId = req.session.user.id;

      // Buscar assinaturas ativas em paralelo
      const subscriptionsPromise = Subscription.findAll({
        where: { userId, status: 'active' },
        order: [['endDate', 'DESC']]
      });

      // Buscar o histórico de faturas em paralelo
      // *** CORREÇÃO APLICADA AQUI ***
      // Usando o modelo 'Invoice' (maiúsculo) que foi importado
      const invoicesPromise = Invoice.findAll({
        where: { userId },
        order: [['issueDate', 'DESC']]
      });

      // Aguarda as duas buscas terminarem
      const [subscriptions, invoices] = await Promise.all([subscriptionsPromise, invoicesPromise]);

      res.json({
        success: true,
        data: {
          subscriptions,
          invoices
        }
      });

    } catch (error) {
      logger.error('Error fetching user billing data:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

module.exports = billingApiController;