// backend/controllers/authController-simple.js
// Versão simplificada que funciona 100%

const { User } = require('../models/Index');
const bcrypt = require('bcryptjs');

const authController = {
  login: async (req, res) => {
    try {
      console.log('🔐 Login attempt:', req.body?.email);
      
      const { email, password } = req.body;

      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      console.log('🔍 Looking for user:', email);
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      console.log('✅ User found:', user.email, 'Role:', user.role);
      
      // Check password
      console.log('🔐 Checking password...');
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', email);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      console.log('✅ Password valid for user:', email);

      // Set session - simple approach
      try {
        req.session.userId = user.id;
        req.session.user = { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        };
        
        console.log('✅ Session created for user:', email);
        
        const redirectUrl = user.role === 'admin' ? '/admin' : '/dashboard';
        
        console.log('✅ Login successful, redirecting to:', redirectUrl);
        return res.json({ 
          success: true, 
          message: 'Login successful', 
          redirectUrl: redirectUrl,
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        });
        
      } catch (sessionError) {
        console.log('❌ Session error:', sessionError.message);
        return res.status(500).json({ success: false, message: 'Session error' });
      }

    } catch (error) {
      console.log('❌ Login error:', error.message);
      console.log('Stack:', error.stack);
      return res.status(500).json({ success: false, message: 'Internal server error' });
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

      // Check if user exists
      const existingUser = await User.findOne({ 
        where: { 
          [Op.or]: [{ email }, { username }] 
        } 
      });

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        status: 'active'
      });

      console.log('✅ User registered:', email);

      // Auto-login
      req.session.userId = user.id;
      req.session.user = { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      };

      res.json({ 
        success: true, 
        message: 'Registration successful', 
        redirectUrl: '/dashboard' 
      });

    } catch (error) {
      console.log('❌ Registration error:', error.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  logout: async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.log('❌ Logout error:', err.message);
          return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        
        console.log('✅ User logged out');
        res.json({ success: true, message: 'Logout successful', redirectUrl: '/' });
      });
    } catch (error) {
      console.log('❌ Logout error:', error.message);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = authController;