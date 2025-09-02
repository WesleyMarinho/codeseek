const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { sequelize } = require('../config/database');
const redisClient = require('../config/redis');

// --- Controladores ---
const licenseApiController = require('../controllers/licenseApiController');
const dashboardController = require('../controllers/dashboardController');
const billingApiController =require('../controllers/billingApiController');
const userApiController = require('../controllers/userApiController');
const adminApiController = require('../controllers/adminApiController');
const adminProductController = require('../controllers/adminProductController');
const adminCategoryController = require('../controllers/adminCategoryController');
const adminLicenseController = require('../controllers/adminLicenseController');
const adminSubscriptionController = require('../controllers/adminSubscriptionController');
const adminSettingsController = require('../controllers/adminSettingsController');
const emailController = require('../controllers/emailController');
const webhookController = require('../controllers/webhookController');
const publicController = require('../controllers/publicController');
const CartController = require('../controllers/cartController');
const CheckoutController = require('../controllers/checkoutController');

// --- Configurações e Modelos ---
const { upload, settingsUpload, handleUploadError, deleteFile } = require('../config/upload');
const logger = require('../config/logger');
const { Product, License } = require('../models/Index');

// ===============================================================
// --- ROTAS PÚBLICAS ---
// ===============================================================
router.get('/license/verify/:key', licenseApiController.verifyLicense);
router.get('/public/products', publicController.getPublicProducts);
router.get('/public/products/:id', publicController.getPublicProduct);
router.get('/public/categories', publicController.getPublicCategories);
router.get('/public/all-access', publicController.getAllAccessInfo);
router.get('/public/settings', adminSettingsController.getPublicSettings);
router.post('/webhooks/:provider', webhookController.handleWebhook);

// Saúde da API / Infra
router.get('/health', async (req, res) => {
  const result = { api: 'ok', db: 'unknown', redis: 'unknown' };
  try {
    await sequelize.authenticate();
    result.db = 'ok';
  } catch (e) {
    result.db = 'error';
  }
  try {
    // For node-redis v4, if connected, ping works via legacy client or direct
    if (redisClient?.isOpen || redisClient?.connected) {
      result.redis = 'ok';
    } else {
      // try connecting quickly without altering global state heavily
      await redisClient.connect().catch(() => {});
      result.redis = (redisClient?.isOpen || redisClient?.connected) ? 'ok' : 'error';
    }
  } catch (e) {
    result.redis = 'error';
  }
  const status = result.db === 'ok' && result.redis === 'ok' ? 200 : 503;
  return res.status(status).json(result);
});

// ===============================================================
// --- ROTAS DE UPLOAD E CARRINHO (Sessão) ---
// ===============================================================
router.post('/temp-upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }
    try {
        const uploadsDir = path.join(__dirname, '../uploads');
        const relativePath = req.file.path.replace(uploadsDir, '').replace(/\\/g, '/');
        const fullUrl = `/uploads${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
        
        logger.info('Temp upload successful', { filename: req.file.filename, url: fullUrl });
        
        return res.status(200).json({ 
            success: true, 
            url: fullUrl,
            path: relativePath,
            filename: req.file.filename
        });
    } catch (error) {
        logger.error('Erro no upload temporário', { error: error.message });
        return res.status(500).json({ success: false, message: 'Erro no processamento do upload.' });
    }
});

router.delete('/temp-upload/:filename', (req, res) => {
    try {
    const { filename } = req.params;
    // deleteFile agora resolve o caminho correto automaticamente (images/files/videos)
    if (deleteFile(filename)) {
            logger.info('Temp file deleted successfully', { filename });
            return res.json({ success: true, message: 'Arquivo temporário deletado.' });
        } else {
            logger.warn('Temp file not found for deletion', { filename });
            return res.status(404).json({ success: false, message: 'Arquivo não encontrado.' });
        }
    } catch (error) {
        logger.error('Erro ao deletar arquivo temporário', { filename: req.params.filename, error: error.message });
        return res.status(500).json({ success: false, message: 'Erro ao deletar arquivo.' });
    }
});

router.post('/cart/add', CartController.addToCart);
router.get('/cart', CartController.getCart);
router.delete('/cart/item/:productId', CartController.removeFromCart);
router.delete('/cart/clear', CartController.clearCart);
router.get('/cart/count', CartController.getCartCount);
router.get('/cart/check/:productId', CartController.checkProductInCart);

// ===============================================================
// --- MIDDLEWARES DE AUTORIZAÇÃO ---
// ===============================================================
const requireApiAuth = (req, res, next) => {
  if (req.session.user) return next();
  logger.warn('API Unauthorized access attempt', { url: req.originalUrl, ip: req.ip });
  return res.status(401).json({ success: false, message: 'Authentication required' });
};

const requireApiAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  logger.warn('API Admin access denied', { userId: req.session.user ? req.session.user.id : 'N/A', url: req.originalUrl });
  return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
};

// ===============================================================
// --- ROTAS PROTEGIDAS PARA USUÁRIOS ---
// ===============================================================
const userRouter = express.Router();
userRouter.use(requireApiAuth);

// Perfil e Senha
userRouter.get('/user/profile', (req, res) => res.json({ success: true, user: req.session.user }));
userRouter.put('/user/profile', userApiController.updateProfile);
userRouter.put('/user/password', userApiController.changePassword);

// Checkout
userRouter.post('/checkout/product', CheckoutController.createProductCheckout);
userRouter.post('/checkout/cart', CheckoutController.createCartCheckout);
userRouter.post('/checkout/all-access', CheckoutController.createAllAccessCheckout);
userRouter.get('/checkout/verify/:sessionId', CheckoutController.verifySession);

// Licenças, Assinaturas e Faturamento
userRouter.get('/user/licenses', licenseApiController.getUserLicenses);
userRouter.get('/user/subscriptions', licenseApiController.getUserSubscriptions);
userRouter.get('/user/products', dashboardController.getUserProducts);
userRouter.get('/user/all-access-products', dashboardController.getAllAccessProducts);
userRouter.get('/user/billing', billingApiController.getUserBillingData);
userRouter.get('/user/dashboard/data', dashboardController.getUserDashboardData);

// Gerenciamento de Licença Individual
userRouter.get('/license/:id', licenseApiController.getLicenseDetails);
userRouter.post('/license/:id/activations', licenseApiController.addActivation);
userRouter.delete('/license/:id/activations/:activationId', licenseApiController.removeActivation);

// Download de Produto
userRouter.get('/products/:id/download', async (req, res) => {
    try {
        const license = await License.findOne({ 
            where: { userId: req.session.user.id, productId: req.params.id, status: 'active' } 
        });
        if (!license) {
            return res.status(403).json({ success: false, message: 'Você não possui licença ativa para este produto.' });
        }
        
        const product = await Product.findByPk(req.params.id);
        if (!product || !product.downloadFile) {
            return res.status(404).json({ success: false, message: 'Arquivo de download não encontrado para este produto.' });
        }
        
        const filePath = path.join(__dirname, '../uploads', product.downloadFile);
        if (!fs.existsSync(filePath)) {
            logger.error('Physical file not found for download', { productId: product.id, path: filePath });
            return res.status(404).json({ success: false, message: 'Arquivo físico não encontrado no servidor.' });
        }
        
        res.download(filePath, `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`);
    } catch (error) {
        logger.error('Erro ao baixar arquivo do produto', { error: error.message, productId: req.params.id });
        res.status(500).json({ success: false, message: 'Erro interno ao processar o download.' });
    }
});

router.use(userRouter);

// ===============================================================
// --- ROTAS PROTEGIDAS PARA ADMINS ---
// ===============================================================
const adminRouter = express.Router();
adminRouter.use(requireApiAuth, requireApiAdmin);

// Dashboard e Usuários
adminRouter.get('/dashboard-stats', dashboardController.getAdminDashboardStats);
adminRouter.get('/users', adminApiController.getAllUsers);
adminRouter.post('/users', adminApiController.createUser); 
adminRouter.get('/users/:id', adminApiController.getUserById);
adminRouter.put('/users/:id', adminApiController.updateUser);
adminRouter.delete('/users/:id', adminApiController.deleteUser);
adminRouter.put('/users/:id/status', adminApiController.updateUserStatus); 

// Configurações
adminRouter.get('/settings', adminSettingsController.getSettings); 
const settingsUploadFields = settingsUpload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]);
adminRouter.put('/settings', settingsUploadFields, handleUploadError, adminSettingsController.updateSettings);

// Configurações SMTP
adminRouter.get('/settings/smtp', adminSettingsController.getSMTPSettings);
adminRouter.put('/settings/smtp', adminSettingsController.updateSMTPSettings);
adminRouter.post('/settings/smtp/test', adminSettingsController.testSMTPConnection);

// Produtos
const productUploadFields = upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'downloadFile', maxCount: 1 }
]);
adminRouter.get('/products', adminProductController.getAllProducts);
adminRouter.post('/products', productUploadFields, handleUploadError, adminProductController.createProduct);
adminRouter.get('/products/:id', adminProductController.getProductById);
adminRouter.put('/products/:id', productUploadFields, handleUploadError, adminProductController.updateProduct);
adminRouter.delete('/products/:id', adminProductController.deleteProduct);

// Mídia de Produtos
adminRouter.delete('/products/:productId/media/:mediaId', adminProductController.deleteProductMedia);
adminRouter.put('/products/:productId/featured-media', adminProductController.setFeaturedMedia);
adminRouter.delete('/products/:productId/download', adminProductController.deleteProductDownloadFile);

// Categorias
adminRouter.get('/categories', adminCategoryController.getAllCategories);
adminRouter.post('/categories', adminCategoryController.createCategory);
adminRouter.put('/categories/:id', adminCategoryController.updateCategory);
adminRouter.delete('/categories/:id', adminCategoryController.deleteCategory);

// Licenças
adminRouter.get('/licenses', adminLicenseController.getAllLicenses);
adminRouter.post('/licenses', adminLicenseController.createLicense);
adminRouter.get('/licenses/options', adminLicenseController.getFormOptions);
adminRouter.get('/licenses/:id', adminLicenseController.getLicenseById);
adminRouter.put('/licenses/:id', adminLicenseController.updateLicense);
adminRouter.delete('/licenses/:id', adminLicenseController.deleteLicense);
adminRouter.put('/licenses/:id/status', adminLicenseController.updateLicenseStatus);
adminRouter.post('/licenses/:id/reset', adminLicenseController.resetLicense);

// Assinaturas
adminRouter.get('/subscriptions', adminSubscriptionController.listSubscriptions);
adminRouter.post('/subscriptions', adminSubscriptionController.createSubscription);
adminRouter.get('/subscriptions/stats', adminSubscriptionController.getSubscriptionStats);
adminRouter.get('/subscriptions/:id', adminSubscriptionController.getSubscription);
adminRouter.put('/subscriptions/:id', adminSubscriptionController.updateSubscription);
adminRouter.delete('/subscriptions/:id', adminSubscriptionController.deleteSubscription);
adminRouter.put('/subscriptions/:id/status', adminSubscriptionController.updateSubscriptionStatus);

// Email Templates e Testes
adminRouter.get('/email/templates', adminSettingsController.getEmailTemplates);
adminRouter.put('/email/templates', adminSettingsController.updateEmailTemplates);
adminRouter.post('/email/test', adminSettingsController.sendTestEmailTemplate);
adminRouter.post('/smtp/test', adminSettingsController.testSMTPOnly);

// Webhooks
adminRouter.get('/webhooks', webhookController.getAllWebhookLogs);
adminRouter.get('/webhooks/stats', webhookController.getWebhookStats);
adminRouter.post('/webhooks/retry/:id', webhookController.retryWebhook);
adminRouter.delete('/webhooks/clear', webhookController.clearAllWebhookLogs);

// Monta o adminRouter com o prefixo /admin
router.use('/admin', adminRouter);

module.exports = router;
