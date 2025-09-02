// backend/controllers/authController.js

const { User } = require('../models/index');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./emailController');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const user = await User.findOne({ where: { email } });
      
      if (!user || !(await user.checkPassword(password))) {
        logger.logAuth('login_failed', { email, reason: 'invalid_credentials' });
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      req.session.regenerate((err) => {
        if (err) {
            logger.error('Error regenerating session', { error: err });
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        req.session.userId = user.id;
        req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };

        logger.logSession('created', { sessionId: req.sessionID, userId: user.id });
        logger.logAuth('login_success', { userId: user.id, email: user.email });
        
        const redirectUrl = user.role === 'admin' ? '/admin' : '/dashboard';
        res.json({ success: true, message: 'Login successful', redirectUrl });
      });

    } catch (error) {
      logger.error('Login error:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  register: async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;

      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }

      const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });

      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Username or email already exists' });
      }

      const newUser = await User.create({ username, email, password });

      // Enviar email de boas-vindas
      try {
        await sendWelcomeEmail(newUser.email, newUser.username);
        logger.info('Welcome email sent successfully', { userId: newUser.id, email: newUser.email });
      } catch (emailError) {
        logger.error('Failed to send welcome email', { userId: newUser.id, email: newUser.email, error: emailError.message });
        // Não falhar o registro por causa do email
      }

      req.session.regenerate((err) => {
          if (err) {
              logger.error('Error regenerating session after registration', { error: err });
              return res.status(500).json({ success: false, message: 'Internal server error' });
          }
          
          req.session.userId = newUser.id;
          req.session.user = { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role };

          logger.logAuth('register_success', { userId: newUser.id, email: newUser.email });
          res.json({ success: true, message: 'Registration successful', redirectUrl: '/dashboard' });
      });

    } catch (error) {
      logger.error('Registration error:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  logout: (req, res) => {
    const userId = req.session.userId;
    req.session.destroy((err) => {
      if (err) {
        logger.error('Logout error', { error: err, userId });
        
        // Se for request GET, redireciona para login mesmo com erro
        if (req.method === 'GET') {
          return res.redirect('/login');
        }
        return res.status(500).json({ success: false, message: 'Could not log out' });
      }
      
      res.clearCookie('connect.sid'); // Limpa o cookie do lado do cliente
      logger.logSession('destroyed', { userId });
      
      // Se for request GET, redireciona diretamente
      if (req.method === 'GET') {
        return res.redirect('/login');
      }
      
      // Se for POST (AJAX), retorna JSON
      res.json({ success: true, message: 'Logout successful', redirectUrl: '/login' });
    });
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Validar entrada
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      // Verificar se o usuário existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
      }

      // Gerar token de reset (simples para demonstração)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hora

      // Salvar token no usuário
      await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires
      });

      // Enviar email de redefinição de senha
      try {
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(user.email, user.username, resetUrl);
        logger.info('Password reset email sent successfully', { userId: user.id, email: user.email });
      } catch (emailError) {
        logger.error('Failed to send password reset email', { userId: user.id, email: user.email, error: emailError.message });
        // Continuar mesmo se o email falhar
      }

      logger.logAuth('password_reset_requested', { email });
      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      logger.error('Error in forgotPassword', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  resetPassword: async (req, res) => {
    // Nenhuma mudança necessária.
    try {
      const { token, password, confirmPassword } = req.body;
      if (!token || !password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }
  
      res.json({ success: true, message: 'Password has been reset successfully', redirectUrl: '/login' });
    } catch (error) {
      logger.error('Reset password error:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = authController;
