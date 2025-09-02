const { WebhookLog, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const { sendPurchaseEmail, sendPaymentFailedEmail, sendRenewalEmail, sendLicenseActivatedEmail, sendSubscriptionCancelledEmail } = require('./emailController');

const webhookController = {
  // Receber webhooks de provedores externos
  async handleWebhook(req, res) {
    const { provider } = req.params;
    const payload = req.body;

    try {
      // Extrair o tipo de evento do payload
      let eventType = 'unknown';
      if (payload.type) {
        eventType = payload.type; // Stripe format
      } else if (payload.event_type) {
        eventType = payload.event_type; // Custom format
      } else if (payload.eventType) {
        eventType = payload.eventType; // Alternative format
      }

      // Criar o log do webhook imediatamente
      const webhookLog = await WebhookLog.create({
        provider,
        eventType,
        payload,
        status: 'pending'
      });

      // Responder imediatamente ao provedor (importante para não causar timeout)
      res.status(200).json({ 
        success: true, 
        message: 'Webhook received successfully',
        webhookId: webhookLog.id 
      });

      // Processar o webhook de forma assíncrona
      setImmediate(async () => {
        try {
          await webhookController._processWebhook(webhookLog);
        } catch (error) {
          logger.error('Error processing webhook asynchronously:', error);
        }
      });

    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  // Processar o webhook (lógica interna)
  async _processWebhook(webhookLog) {
    try {
      const { provider, eventType, payload } = webhookLog;

      logger.info(`Processing webhook: ${provider} - ${eventType}`);

      // Switch baseado no provedor e tipo de evento
      switch (provider) {
        case 'chargebee':
          await webhookController._processChargebeeWebhook(webhookLog, eventType, payload);
          break;
        case 'custom':
          await webhookController._processCustomWebhook(webhookLog, eventType, payload);
          break;
        default:
          await webhookController._processGenericWebhook(webhookLog, eventType, payload);
      }

      // Marcar como processado
      await webhookLog.update({
        status: 'processed',
        errorMessage: null
      });

      logger.info(`Webhook processed successfully: ${webhookLog.id}`);

    } catch (error) {
      logger.error(`Error processing webhook ${webhookLog.id}:`, error);
      
      // Marcar como falhou
      await webhookLog.update({
        status: 'failed',
        errorMessage: error.message
      });
    }
  },

  // Processar webhooks do Chargebee
  async _processChargebeeWebhook(webhookLog, eventType, payload) {
    switch (eventType) {
      case 'invoice.payment_succeeded':
        await webhookController._handlePaymentSucceeded(payload);
        break;
      case 'invoice.payment_failed':
        await webhookController._handlePaymentFailed(payload);
        break;
      case 'customer.subscription.created':
        await webhookController._handleSubscriptionCreated(payload);
        break;
      case 'customer.subscription.updated':
        await webhookController._handleSubscriptionUpdated(payload);
        break;
      case 'customer.subscription.deleted':
        await webhookController._handleSubscriptionDeleted(payload);
        break;
      default:
        logger.info(`Unhandled Chargebee event type: ${eventType}`);
    }
  },

  // Processar webhooks customizados
  async _processCustomWebhook(webhookLog, eventType, payload) {
    switch (eventType) {
      case 'user.subscription.renewed':
        await webhookController._handleSubscriptionRenewed(payload);
        break;
      case 'license.activated':
        await webhookController._handleLicenseActivated(payload);
        break;
      default:
        logger.info(`Unhandled custom event type: ${eventType}`);
    }
  },

  // Processar webhooks genéricos
  async _processGenericWebhook(webhookLog, eventType, payload) {
    logger.info(`Processing generic webhook: ${eventType}`);
    // Implementar lógica genérica aqui se necessário
  },

  // Handlers específicos para diferentes tipos de eventos
  async _handlePaymentSucceeded(payload) {
    logger.info('Processing payment succeeded event');
    try {
      // Buscar usuário pelo customer_id ou email
      const customerId = payload.customer?.id || payload.customer_id;
      const customerEmail = payload.customer?.email || payload.email;
      
      let user = null;
      if (customerId) {
        user = await User.findOne({ where: { chargebeeCustomerId: customerId } });
      }
      if (!user && customerEmail) {
        user = await User.findOne({ where: { email: customerEmail } });
      }
      
      if (user) {
        // Enviar email de confirmação de compra
        const productName = payload.subscription?.plan_id || payload.plan?.name || 'CodeSeek Pro';
        const amount = payload.invoice?.total || payload.amount || 0;
        
        await sendPurchaseEmail(user.email, user.username, productName, amount);
        logger.info('Purchase confirmation email sent', { userId: user.id, email: user.email });
      }
    } catch (error) {
      logger.error('Error sending purchase email:', error);
    }
  },

  async _handlePaymentFailed(payload) {
    logger.info('Processing payment failed event');
    try {
      // Buscar usuário pelo customer_id ou email
      const customerId = payload.customer?.id || payload.customer_id;
      const customerEmail = payload.customer?.email || payload.email;
      
      let user = null;
      if (customerId) {
        user = await User.findOne({ where: { chargebeeCustomerId: customerId } });
      }
      if (!user && customerEmail) {
        user = await User.findOne({ where: { email: customerEmail } });
      }
      
      if (user) {
        // Enviar email de falha de pagamento
        const amount = payload.invoice?.total || payload.amount || 0;
        const reason = payload.failure_reason || 'Payment processing failed';
        
        await sendPaymentFailedEmail(user.email, user.username, amount, reason);
        logger.info('Payment failed email sent', { userId: user.id, email: user.email });
      }
    } catch (error) {
      logger.error('Error sending payment failed email:', error);
    }
  },

  async _handleSubscriptionCreated(payload) {
    logger.info('Processing subscription created event');
    // Implementar lógica de nova assinatura
  },

  async _handleSubscriptionUpdated(payload) {
    logger.info('Processing subscription updated event');
    // Implementar lógica de assinatura atualizada
  },

  async _handleSubscriptionDeleted(payload) {
    logger.info('Processing subscription deleted event');
    try {
      // Buscar usuário pelo customer_id ou email
      const customerId = payload.customer?.id || payload.customer_id;
      const customerEmail = payload.customer?.email || payload.email;
      
      let user = null;
      if (customerId) {
        user = await User.findOne({ where: { chargebeeCustomerId: customerId } });
      }
      if (!user && customerEmail) {
        user = await User.findOne({ where: { email: customerEmail } });
      }
      
      if (user) {
        // Enviar email de cancelamento de assinatura
        const planName = payload.subscription?.plan_id || payload.plan?.name || 'CodeSeek Pro';
        
        await sendSubscriptionCancelledEmail(user.email, user.username, planName);
        logger.info('Subscription cancelled email sent', { userId: user.id, email: user.email });
      }
    } catch (error) {
      logger.error('Error sending subscription cancelled email:', error);
    }
  },

  async _handleSubscriptionRenewed(payload) {
    logger.info('Processing subscription renewed event');
    try {
      // Buscar usuário pelo customer_id ou email
      const customerId = payload.customer?.id || payload.customer_id;
      const customerEmail = payload.customer?.email || payload.email;
      
      let user = null;
      if (customerId) {
        user = await User.findOne({ where: { chargebeeCustomerId: customerId } });
      }
      if (!user && customerEmail) {
        user = await User.findOne({ where: { email: customerEmail } });
      }
      
      if (user) {
        // Enviar email de renovação
        const planName = payload.subscription?.plan_id || payload.plan?.name || 'CodeSeek Pro';
        const nextBillingDate = payload.subscription?.next_billing_at || payload.next_billing_date;
        
        await sendRenewalEmail(user.email, user.username, planName, nextBillingDate);
        logger.info('Renewal email sent', { userId: user.id, email: user.email });
      }
    } catch (error) {
      logger.error('Error sending renewal email:', error);
    }
  },

  async _handleLicenseActivated(payload) {
    logger.info('Processing license activated event');
    try {
      // Buscar usuário pelo customer_id ou email
      const customerId = payload.customer?.id || payload.customer_id;
      const customerEmail = payload.customer?.email || payload.email;
      
      let user = null;
      if (customerId) {
        user = await User.findOne({ where: { chargebeeCustomerId: customerId } });
      }
      if (!user && customerEmail) {
        user = await User.findOne({ where: { email: customerEmail } });
      }
      
      if (user) {
        // Enviar email de ativação de licença
        const licenseKey = payload.license?.key || payload.license_key || 'Your License Key';
        const productName = payload.product?.name || payload.product_name || 'CodeSeek Pro';
        
        await sendLicenseActivatedEmail(user.email, user.username, licenseKey, productName);
        logger.info('License activated email sent', { userId: user.id, email: user.email });
      }
    } catch (error) {
      logger.error('Error sending license activated email:', error);
    }
  },

  // Listar todos os logs de webhook (admin)
  async getAllWebhookLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const { provider, status, eventType } = req.query;
      
      // Construir filtros
      const where = {};
      if (provider) where.provider = provider;
      if (status) where.status = status;
      if (eventType) where.eventType = eventType;

      const { rows: webhookLogs, count } = await WebhookLog.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: webhookLogs,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      logger.error('Error fetching webhook logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching webhook logs'
      });
    }
  },

  // Tentar reprocessar um webhook que falhou
  async retryWebhook(req, res) {
    const { id } = req.params;

    try {
      const webhookLog = await WebhookLog.findByPk(id);

      if (!webhookLog) {
        return res.status(404).json({
          success: false,
          message: 'Webhook log not found'
        });
      }

      if (webhookLog.status === 'processed') {
        return res.status(400).json({
          success: false,
          message: 'Webhook already processed successfully'
        });
      }

      // Resetar status para pending
      await webhookLog.update({
        status: 'pending',
        errorMessage: null
      });

      // Reprocessar
      setImmediate(async () => {
        try {
          await webhookController._processWebhook(webhookLog);
        } catch (error) {
          logger.error('Error reprocessing webhook:', error);
        }
      });

      res.json({
        success: true,
        message: 'Webhook queued for reprocessing'
      });

    } catch (error) {
      logger.error('Error retrying webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrying webhook'
      });
    }
  },

  // Limpar todos os logs de webhook (admin)
  async clearAllWebhookLogs(req, res) {
    try {
      await WebhookLog.destroy({ truncate: true });

      logger.info('All webhook logs cleared by admin');

      res.json({
        success: true,
        message: 'All webhook logs cleared successfully'
      });

    } catch (error) {
      logger.error('Error clearing webhook logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing webhook logs'
      });
    }
  },

  // Obter estatísticas dos webhooks
  async getWebhookStats(req, res) {
    try {
      const stats = await WebhookLog.findAll({
        attributes: [
          'provider',
          'status',
          [WebhookLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['provider', 'status']
      });

      const totalCount = await WebhookLog.count();

      // Estatísticas das últimas 24 horas
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await WebhookLog.count({
        where: {
          createdAt: {
            [Op.gte]: last24Hours
          }
        }
      });

      res.json({
        success: true,
        data: {
          total: totalCount,
          last24Hours: recentCount,
          byProviderAndStatus: stats
        }
      });

    } catch (error) {
      logger.error('Error fetching webhook stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching webhook statistics'
      });
    }
  }
};

module.exports = webhookController;
