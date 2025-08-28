// backend/controllers/pageController.js

const path = require('path');
const logger = require('../config/logger');

// ===============================================================
// --- HELPER FUNCTIONS ---
// Funções reutilizáveis para manter o código limpo (DRY).
// ===============================================================

/**
 * Cria um handler para servir uma página HTML estática.
 * @param {string} pageName - O nome do arquivo HTML (sem a extensão).
 * @param {string} [subfolder=''] - O subdiretório opcional dentro de 'frontend/'.
 * @returns {Function} - Um middleware do Express.
 */
const servePage = (pageName, subfolder = '') => (req, res) => {
  const filePath = path.join(__dirname, '../../frontend', subfolder, `${pageName}.html`);
  res.sendFile(filePath);
};

/**
 * Middleware para redirecionar usuários que já estão autenticados.
 * Impede que acessem páginas como /login ou /register.
 */
const redirectIfLoggedIn = (req, res, next) => {
  if (req.session.user) {
    logger.debug('User already logged in, redirecting away from auth page.', { userId: req.session.user.id });
    const redirectUrl = req.session.user.role === 'admin' ? '/admin' : '/dashboard';
    return res.redirect(redirectUrl);
  }
  next();
};


// ===============================================================
// --- EXPORTAÇÃO DO CONTROLLER ---
// ===============================================================

const pageController = {
  // --- Páginas Públicas ---
  // Acessíveis por qualquer visitante.
  home: servePage('index'),
  products: servePage('products'),
  productDetail: servePage('product-detail'),
  // pricing: servePage('pricing'), // Removido - página não existe
  about: servePage('about'),
  contact: servePage('contact'),
  privacy: servePage('privacy'),
  terms: servePage('terms'),
  errors: servePage('errors'),
  

  // --- Páginas de Autenticação ---
  // Usam o middleware redirectIfLoggedIn para evitar que usuários logados as acessem.
  login: [redirectIfLoggedIn, servePage('login')],
  register: [redirectIfLoggedIn, servePage('register')],
  forgotPassword: [redirectIfLoggedIn, servePage('forgot-password')],
  resetPassword: [redirectIfLoggedIn, servePage('reset-password')],
  

  // --- Páginas Protegidas (requerem 'requireAuth' nas rotas) ---
  // A lógica de proteção fica no arquivo `web.js`.
  cart: servePage('cart'),
  
  // Checkout redireciona para sistema de pagamentos externo
  checkout: (req, res) => {
    // TODO: Implementar redirecionamento para Chargebee Hosted Pages ou sistema de pagamentos
    logger.info('Redirecting to external payment system', { userId: req.session.userId });
    // Por enquanto, redireciona para o carrinho até implementar o sistema de pagamentos
    res.redirect('/cart?checkout=true');
  },
  
  checkoutSuccess: servePage('success', 'checkout'),
  checkoutCancel: servePage('cancel', 'checkout'),

  
  // --- Lógica de API para Carrinho ---
  addToCart: (req, res) => {
    // TODO: Implementar lógica de sessão para o carrinho
    logger.info('Adding item to cart', { body: req.body, userId: req.session.userId });
    res.json({ success: true, message: 'Product added to cart' });
  },

  removeFromCart: (req, res) => {
    // TODO: Implementar lógica de sessão para o carrinho
    logger.info('Removing item from cart', { body: req.body, userId: req.session.userId });
    res.json({ success: true, message: 'Product removed from cart' });
  },
};

module.exports = pageController;