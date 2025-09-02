const { License, Product, User, Subscription, Activation } = require('../models/Index');
const logger = require('../config/logger');

const licenseApiController = {
  /**
   * API Endpoint to verify a license key (public).
   */
  verifyLicense: async (req, res) => {
    try {
      const { key } = req.params;
      if (!key) {
        return res.status(400).json({ success: false, message: 'License key is required' });
      }

      const license = await License.findOne({ where: { key } });

      if (!license) {
            return res.status(404).json({ success: false, message: 'Licença inválida - CodeSeek', status: 'invalid' });
        }
      
      // Implemente sua lógica de validação completa aqui
      res.json({ success: true, message: "Licença válida - CodeSeek", status: license.status });

    } catch (error) {
      logger.error('Error verifying license:', { error: error.message, key: req.params.key });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint to get all licenses for the logged-in user.
   */
  getUserLicenses: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const licenses = await License.findAll({
        where: { userId },
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name'] },
          { model: Activation, as: 'activations', attributes: ['id'] } // Inclui contagem de ativações
        ],
        order: [['createdAt', 'DESC']]
      });

      const formattedLicenses = licenses.map(license => {
        const usageLimit = 5; // Exemplo: Limite fixo
        const currentUsage = license.activations.length;
        
        return {
          id: license.id,
          key: license.key,
          productName: license.product ? license.product.name : 'Unknown Product',
          expiresOn: license.expiresOn,
          status: license.status,
          usage: `${currentUsage}/${usageLimit}`,
          usagePercent: (currentUsage / usageLimit) * 100,
        };
      });

      res.json({ success: true, licenses: formattedLicenses });

    } catch (error) {
      logger.error('Error fetching user licenses:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint to get all subscriptions for the logged-in user.
   */
  getUserSubscriptions: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const subscriptions = await Subscription.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, subscriptions });
    } catch (error) {
      logger.error('Error fetching user subscriptions:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint to get details for a single license.
   */
  getLicenseDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;

      const license = await License.findOne({
        where: { id, userId },
        include: [
          { model: Product, as: 'product', attributes: ['name'] },
          { model: Activation, as: 'activations', attributes: ['id', 'domain', 'activatedAt'], order: [['activatedAt', 'DESC']] }
        ]
      });

      if (!license) {
        return res.status(404).json({ success: false, message: 'License not found or access denied.' });
      }

      const usageLimit = 5; // Em um sistema real, isso viria do produto ou plano

      const response = {
        id: license.id,
        key: license.key,
        productName: license.product.name,
        activations: license.activations,
        usageLimit: usageLimit
      };

      res.json({ success: true, license: response });
    } catch (error) {
      logger.error('Error fetching license details:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint to add an activation to a license.
   */
  addActivation: async (req, res) => {
    try {
      const { id } = req.params;
      const { domain } = req.body;
      const userId = req.session.user.id;

      if (!domain) {
        return res.status(400).json({ success: false, message: 'Domain is required.' });
      }

      const license = await License.findOne({ where: { id, userId }, include: 'activations' });

      if (!license) {
        return res.status(404).json({ success: false, message: 'License not found or access denied.' });
      }
      
      const usageLimit = 5; // Limite de exemplo
      if (license.activations.length >= usageLimit) {
        return res.status(403).json({ success: false, message: 'Activation limit reached for this license.' });
      }
      
      const newActivation = await Activation.create({ licenseId: id, domain });

      res.status(201).json({ success: true, message: 'Domain activated successfully.', activation: newActivation });
    } catch (error) {
      logger.error('Error adding activation:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint to remove an activation from a license.
   */
  removeActivation: async (req, res) => {
    try {
      const { id, activationId } = req.params;
      const userId = req.session.user.id;

      const license = await License.findOne({ where: { id, userId } });
      if (!license) {
        return res.status(404).json({ success: false, message: 'License not found or access denied.' });
      }
      
      const activation = await Activation.findOne({ where: { id: activationId, licenseId: id } });
      if (!activation) {
        return res.status(404).json({ success: false, message: 'Activation not found for this license.' });
      }

      await activation.destroy();

      res.json({ success: true, message: 'Domain deactivated successfully.' });
    } catch (error) {
      logger.error('Error removing activation:', { error: error.message, userId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

module.exports = licenseApiController;