const { User } = require('../models');
const { Op } = require('sequelize'); // <-- CORREÇÃO: Importação do Op adicionada aqui
const logger = require('../config/logger');

const adminApiController = {
  /**
   * API Endpoint for admins to get a list of all users.
   */
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt'], // Não expor o hash da senha
        order: [['createdAt', 'DESC']]
      });

      res.json({ success: true, users });

    } catch (error) {
      logger.error('Error fetching all users for admin:', { error: error.message, adminId: req.session.user.id });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint for admins to get a single user by ID.
   */
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: ['id', 'username', 'email', 'role', 'status']
      });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      res.json({ success: true, user });
    } catch (error) {
      logger.error('Error fetching user by ID:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint for admins to update a user.
   */
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, role, status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Previne que o admin se rebaixe ou suspenda
      if (user.id === req.session.user.id && (role !== 'admin' || status !== 'active')) {
        return res.status(403).json({ success: false, message: 'Admins cannot change their own role or status.' });
      }

      await user.update({ username, email, role, status });

      // Retorna o usuário atualizado (sem a senha)
      const updatedUser = { id: user.id, username, email, role, status };
      res.json({ success: true, message: 'User updated successfully.', user: updatedUser });

    } catch (error) {
      logger.error('Error updating user:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint for admins to delete a user.
   */
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Regra de segurança: impede que um admin se auto-delete
      if (user.id === req.session.user.id) {
          return res.status(403).json({ success: false, message: "Admins cannot delete their own account." });
      }

      await user.destroy();
      res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
      logger.error('Error deleting user:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint for admins to create a new user.
   */
  createUser: async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      // Validações básicas
      if (!username || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      // Verifica se o email ou username já existem
      const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'A user with this email or username already exists.' });
      }

      // Cria o novo usuário (o hook no modelo User cuidará do hashing da senha)
      const newUser = await User.create({
        username,
        email,
        password,
        role
      });

      // Não retornar a senha na resposta
      const userResponse = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      };

      res.status(201).json({ success: true, message: 'User created successfully.', user: userResponse });
    } catch (error) {
      // Trata erros de validação do Sequelize
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ success: false, message: messages.join(', ') });
      }
      logger.error('Error creating user:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * API Endpoint for admins to update a user's status (suspend/reactivate).
   */
  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validação do status
      if (!status || !['active', 'suspended'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided.' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Regra de segurança: impede que um admin se auto-suspenda
      if (user.id === req.session.user.id) {
        return res.status(403).json({ success: false, message: 'Admins cannot suspend their own account.' });
      }

      user.status = status;
      await user.save();

      res.json({ success: true, message: `User status updated to ${status}.` });
    } catch (error) {
      logger.error('Error updating user status:', { error: error.message });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

module.exports = adminApiController;