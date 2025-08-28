const express = require('express');
const router = express.Router();

// --- Controladores ---
const authController = require('../controllers/authController');
const pageController = require('../controllers/pageController');
const dashboardController = require('../controllers/dashboardController');
const logger = require('../config/logger');

// ===============================================================
// --- MIDDLEWARES DE AUTORIZAÇÃO ---
// ===============================================================

const requireAuth = (req, res, next) => {
  if (req.session.user) return next();
  
  logger.warn('Authentication required, redirecting to login', { url: req.originalUrl });
  const redirectUrl = `/login?redirect=${encodeURIComponent(req.originalUrl)}`;
  return res.redirect(redirectUrl);
};

const requireAdmin = (req, res, next) => {
  if (req.session.user.role === 'admin') return next();

  logger.warn('Admin access denied for user', { userId: req.session.user.id, url: req.originalUrl });
  const error = "Sorry, you don't have permission to access this page.";
  return res.redirect(`/errors?code=403&message=${encodeURIComponent(error)}`);
};

// ===============================================================
// --- ROTAS PÚBLICAS ---
// ===============================================================
router.get('/', pageController.home);
router.get('/products', pageController.products);
router.get('/product/:id', pageController.productDetail);
// router.get('/pricing', pageController.pricing); // Removido - página não existe
router.get('/about', pageController.about);
router.get('/contact', pageController.contact);
router.get('/privacy', pageController.privacy);
router.get('/terms', pageController.terms);
router.get('/errors', pageController.errors);
router.get('/cart', pageController.cart); // Cart page is public, auth is for checkout

// ===============================================================
// --- ROTAS DE AUTENTICAÇÃO ---
// ===============================================================
router.get('/login', pageController.login);
router.post('/login', authController.login);
router.get('/register', pageController.register);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.get('/forgot-password', pageController.forgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', pageController.resetPassword);
router.post('/reset-password', authController.resetPassword);

// ===============================================================
// --- ROTAS PROTEGIDAS PARA USUÁRIOS ---
// ===============================================================
const userRouter = express.Router();
userRouter.use(requireAuth);

// Checkout Flow
userRouter.get('/checkout', pageController.checkout);
userRouter.get('/checkout/success', pageController.checkoutSuccess);
userRouter.get('/checkout/cancel', pageController.checkoutCancel);

// Dashboard do Usuário
const dashboardRouter = express.Router();
dashboardRouter.get('/', dashboardController.index);
dashboardRouter.get('/profile', dashboardController.profile);
dashboardRouter.get('/products', dashboardController.products);
dashboardRouter.get('/licenses', dashboardController.licenses);
dashboardRouter.get('/billing', dashboardController.billing);
dashboardRouter.get('/included-products', dashboardController.includedProducts);
dashboardRouter.get('/manage-license/:id', dashboardController.manageLicense);
userRouter.use('/dashboard', dashboardRouter);

router.use(userRouter);

// ===============================================================
// --- ROTAS PROTEGIDAS PARA ADMINS ---
// ===============================================================
const adminRouter = express.Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/', dashboardController.adminIndex);
adminRouter.get('/users', dashboardController.adminUsers);
adminRouter.get('/add-user', dashboardController.adminAddUser);
adminRouter.get('/edit-user/:id', dashboardController.adminEditUser);
adminRouter.get('/products', dashboardController.adminProducts);
adminRouter.get('/edit-product/:id', dashboardController.adminEditProduct);
adminRouter.get('/categories', dashboardController.adminCategories);
adminRouter.get('/licenses', dashboardController.adminLicenses);
adminRouter.get('/subscriptions', dashboardController.adminSubscriptions);
adminRouter.get('/settings', dashboardController.adminSettings);
adminRouter.get('/webhooks', dashboardController.adminWebhooks);

router.use('/admin', adminRouter);

module.exports = router;