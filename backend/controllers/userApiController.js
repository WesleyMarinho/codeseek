const { User } = require('../models/index');
const logger = require('../config/logger');

/**
 * @description Update user's profile information (username)
 * @route PUT /api/user/profile
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { username } = req.body;

    if (!username || username.trim() === '') {
      return res.status(400).json({ success: false, message: 'Username cannot be empty.' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.username = username.trim();
    await user.save();

    // IMPORTANT: Update the session with the new username
    req.session.user.username = user.username;

    logger.info(`User profile updated successfully for userId: ${userId}`);
    res.status(200).json({ success: true, message: 'Profile updated successfully!', user: { username: user.username, email: user.email } });

  } catch (error) {
    logger.error('Error updating user profile:', { error: error.message, userId: req.session.user.id });
    res.status(500).json({ success: false, message: 'Server error while updating profile.' });
  }
};

/**
 * @description Change user's password
 * @route PUT /api/user/password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    } 

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.checkPassword(currentPassword);

    if (!isMatch) {
      return res.status(403).json({ success: false, message: 'Incorrect current password.' });
    }

    // The beforeUpdate hook in the User model will automatically hash the password
    user.password = newPassword;
    await user.save();

    logger.info(`User password changed successfully for userId: ${userId}`);
    res.status(200).json({ success: true, message: 'Password changed successfully!' });

  } catch (error) {
    logger.error('Error changing user password:', { error: error.message, userId: req.session.user.id });
    res.status(500).json({ success: false, message: 'Server error while changing password.' });
  }
};

module.exports = {
  updateProfile,
  changePassword,
};
