// backend/controllers/adminSettingsController.js
const { Setting } = require('../models');
const logger = require('../config/logger');
const nodemailer = require('nodemailer');
const { sendEmail, sendTestEmailInternal } = require('./emailController');

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll();
        // Transform the array of settings into a key-value object for easier use on the frontend
        const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        logger.error('Error fetching settings:', { message: error.message, stack: error.stack });
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

// PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
    const settingsToUpdate = req.body;

    try {
        const promises = Object.entries(settingsToUpdate).map(([key, value]) => {
            // The value from the form is a simple string, but our model expects a JSON object.
            // We wrap it in an object like { value: ... } to match the structure.
            return Setting.upsert({ key, value: { value } });
        });

        await Promise.all(promises);
        
        logger.info('Settings updated successfully by user:', { userId: req.session.userId });
        res.json({ message: 'Settings updated successfully!' });

    } catch (error) {
        logger.error('Error updating settings:', { message: error.message, stack: error.stack, body: req.body });
        res.status(500).json({ message: 'Error updating settings' });
    }
};

// POST /api/admin/settings/smtp/test
exports.testSMTPConnection = async (req, res) => {
    try {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, smtp_from_name, test_email } = req.body;

        if (!smtp_host || !smtp_port || !smtp_user || !smtp_pass || !test_email) {
            return res.status(400).json({ message: 'All SMTP fields and test email are required' });
        }

        // Criar transporter com as configurações fornecidas
        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: parseInt(smtp_port),
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_user,
                pass: smtp_pass
            }
        });

        // Verificar conexão
        await transporter.verify();

        // Determinar o remetente
        const fromEmail = smtp_from_email || smtp_user;
        const fromName = smtp_from_name || 'DigiServer';
        const fromAddress = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

        // Enviar email de teste
        const testMailOptions = {
            from: fromAddress,
            to: test_email,
            subject: 'DigiServer Pro - SMTP Test',
            html: `
                <h2>SMTP Configuration Test</h2>
                <p>This is a test email to verify your SMTP configuration.</p>
                <p><strong>Server:</strong> ${smtp_host}:${smtp_port}</p>
                <p><strong>User:</strong> ${smtp_user}</p>
                <p><strong>From:</strong> ${fromAddress}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <p><em>DigiServer Pro Email System</em></p>
            `
        };

        const result = await transporter.sendMail(testMailOptions);
        
        logger.info('SMTP test successful:', { 
            host: smtp_host, 
            port: smtp_port, 
            user: smtp_user, 
            testEmail: test_email,
            messageId: result.messageId 
        });
        
        res.json({ 
            message: 'SMTP test successful! Check your email inbox.',
            messageId: result.messageId 
        });

    } catch (error) {
        logger.error('SMTP test failed:', { error: error.message, stack: error.stack });
        
        let errorMessage = 'SMTP test failed: ';
        if (error.code === 'EAUTH') {
            errorMessage += 'Authentication failed. Check your username and password.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage += 'Connection failed. Check your host and port.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage += 'Connection timeout. Check your network and firewall settings.';
        } else {
            errorMessage += error.message;
        }
        
        res.status(500).json({ message: errorMessage });
    }
};

// GET /api/admin/settings/smtp
exports.getSMTPSettings = async (req, res) => {
    try {
        const smtpKeys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name', 'test_email'];
        const settings = await Setting.findAll({
            where: {
                key: smtpKeys
            }
        });

        const smtpSettings = settings.reduce((acc, setting) => {
            // Para campos sensíveis como senha, não retornar o valor real
            if (setting.key === 'smtp_pass') {
                acc[setting.key] = setting.value.value ? '••••••••' : '';
            } else {
                acc[setting.key] = setting.value.value || '';
            }
            return acc;
        }, {});

        // Garantir que todos os campos existam
        smtpKeys.forEach(key => {
            if (!smtpSettings[key]) {
                smtpSettings[key] = '';
            }
        });

        res.json(smtpSettings);
    } catch (error) {
        logger.error('Error fetching SMTP settings:', error);
        res.status(500).json({ message: 'Error fetching SMTP settings' });
    }
};

// PUT /api/admin/settings/smtp
exports.updateSMTPSettings = async (req, res) => {
    try {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, smtp_from_name, test_email } = req.body;
        
        const smtpSettings = {
            smtp_host: smtp_host || '',
            smtp_port: smtp_port || '587',
            smtp_user: smtp_user || '',
            smtp_from_email: smtp_from_email || '',
            smtp_from_name: smtp_from_name || '',
            test_email: test_email || ''
        };

        // Só atualizar a senha se foi fornecida (não é '••••••••')
        if (smtp_pass && smtp_pass !== '••••••••') {
            smtpSettings.smtp_pass = smtp_pass;
        }

        const promises = Object.entries(smtpSettings).map(([key, value]) => {
            return Setting.upsert({ key, value: { value } });
        });

        await Promise.all(promises);
        
        logger.info('SMTP settings updated successfully by user:', { userId: req.session.userId });
        res.json({ message: 'SMTP settings updated successfully!' });

    } catch (error) {
        logger.error('Error updating SMTP settings:', error);
        res.status(500).json({ message: 'Error updating SMTP settings' });
    }
};

// GET /api/admin/email/templates
exports.getEmailTemplates = async (req, res) => {
    try {
        const templateKeys = [
            'email_template_welcome',
            'email_template_purchase', 
            'email_template_renewal',
            'email_template_password_reset',
            'email_template_payment_failed',
            'email_template_license_activated',
            'email_template_subscription_cancelled'
        ];

        const settings = await Setting.findAll({
            where: {
                key: templateKeys
            }
        });

        const templates = {};
        
        // Mapear os templates para o formato esperado pelo frontend
        const templateMapping = {
            'email_template_welcome': 'welcome',
            'email_template_purchase': 'purchase',
            'email_template_renewal': 'renewal', 
            'email_template_password_reset': 'password_reset',
            'email_template_payment_failed': 'payment_failed',
            'email_template_license_activated': 'license_activated',
            'email_template_subscription_cancelled': 'subscription_cancelled'
        };

        settings.forEach(setting => {
            const templateKey = templateMapping[setting.key];
            if (templateKey) {
                templates[templateKey] = setting.value || { subject: '', body: {} };
            }
        });

        // Garantir que todos os templates existam com valores padrão
        Object.values(templateMapping).forEach(templateKey => {
            if (!templates[templateKey]) {
                templates[templateKey] = { subject: '', body: {} };
            }
        });

        res.json(templates);
    } catch (error) {
        logger.error('Error fetching email templates:', error);
        res.status(500).json({ message: 'Error fetching email templates' });
    }
};

// PUT /api/admin/email/templates
exports.updateEmailTemplates = async (req, res) => {
    try {
        const templates = req.body;
        
        const templateMapping = {
            'welcome': 'email_template_welcome',
            'purchase': 'email_template_purchase',
            'renewal': 'email_template_renewal',
            'password_reset': 'email_template_password_reset',
            'payment_failed': 'email_template_payment_failed',
            'license_activated': 'email_template_license_activated',
            'subscription_cancelled': 'email_template_subscription_cancelled'
        };

        const promises = Object.entries(templates).map(([templateKey, templateData]) => {
            const settingKey = templateMapping[templateKey];
            if (settingKey) {
                return Setting.upsert({ 
                    key: settingKey, 
                    value: templateData 
                });
            }
        }).filter(Boolean);

        await Promise.all(promises);
        
        logger.info('Email templates updated successfully by user:', { userId: req.session.userId });
        res.json({ message: 'Email templates updated successfully!' });

    } catch (error) {
        logger.error('Error updating email templates:', error);
        res.status(500).json({ message: 'Error updating email templates' });
    }
};

// POST /api/admin/email/test
exports.sendTestEmailTemplate = async (req, res) => {
    try {
        const { templateKey, testEmail } = req.body;
        
        if (!templateKey || !testEmail) {
            return res.status(400).json({ message: 'Template key and test email are required' });
        }

        // Obter configurações SMTP
        const smtpSettings = await Setting.findAll({
            where: {
                key: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass']
            }
        });

        const smtpConfig = smtpSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value.value;
            return acc;
        }, {});

        if (!smtpConfig.smtp_host || !smtpConfig.smtp_user) {
            return res.status(400).json({ message: 'SMTP configuration is incomplete' });
        }

        // Obter template
        const templateMapping = {
            'welcome': 'email_template_welcome',
            'purchase': 'email_template_purchase',
            'renewal': 'email_template_renewal',
            'password_reset': 'email_template_password_reset',
            'payment_failed': 'email_template_payment_failed',
            'license_activated': 'email_template_license_activated',
            'subscription_cancelled': 'email_template_subscription_cancelled'
        };

        const settingKey = templateMapping[templateKey];
        if (!settingKey) {
            return res.status(400).json({ message: 'Invalid template key' });
        }

        const templateSetting = await Setting.findOne({ where: { key: settingKey } });
        const template = templateSetting?.value || { subject: 'Test Email', body: {} };

        // Dados de teste para substituição de variáveis
        const testData = {
            userName: 'João Silva',
            userEmail: testEmail,
            productName: 'DigiServer Pro',
            planName: 'Premium Plan',
            amount: 'R$ 99,90',
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            resetLink: 'https://example.com/reset-password?token=test123',
            licenseKey: 'DIGI-TEST-1234-5678',
            supportEmail: 'support@digiserver.com'
        };

        // Usar a função sendTestEmailInternal do emailController
        await sendTestEmailInternal(templateKey, testEmail, testData);
        
        logger.info('Test email sent successfully:', { 
            templateKey, 
            testEmail, 
            userId: req.session.userId 
        });
        
        res.json({ message: 'Test email sent successfully!' });

    } catch (error) {
        logger.error('Error sending test email:', error);
        res.status(500).json({ message: 'Error sending test email: ' + error.message });
    }
};

// POST /api/admin/smtp/test
exports.testSMTPOnly = async (req, res) => {
    try {
        // Obter configurações SMTP do banco
        const smtpSettings = await Setting.findAll({
            where: {
                key: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_test_email']
            }
        });

        const smtpConfig = smtpSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value.value;
            return acc;
        }, {});

        if (!smtpConfig.smtp_host || !smtpConfig.smtp_user || !smtpConfig.smtp_test_email) {
            return res.status(400).json({ message: 'SMTP configuration is incomplete' });
        }

        // Criar transporter
        const transporter = nodemailer.createTransport({
            host: smtpConfig.smtp_host,
            port: parseInt(smtpConfig.smtp_port) || 587,
            secure: false,
            auth: {
                user: smtpConfig.smtp_user,
                pass: smtpConfig.smtp_pass
            }
        });

        // Verificar conexão
        await transporter.verify();

        // Enviar email de teste
        const testMailOptions = {
            from: smtpConfig.smtp_user,
            to: smtpConfig.smtp_test_email,
            subject: 'DigiServer Pro - SMTP Connection Test',
            html: `
                <h2>SMTP Connection Test</h2>
                <p>This is a test email to verify your SMTP configuration.</p>
                <p><strong>Server:</strong> ${smtpConfig.smtp_host}:${smtpConfig.smtp_port}</p>
                <p><strong>User:</strong> ${smtpConfig.smtp_user}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                <hr>
                <p><em>DigiServer Pro Email System</em></p>
            `
        };

        const result = await transporter.sendMail(testMailOptions);
        
        logger.info('SMTP test successful:', { 
            host: smtpConfig.smtp_host, 
            port: smtpConfig.smtp_port, 
            user: smtpConfig.smtp_user, 
            testEmail: smtpConfig.smtp_test_email,
            messageId: result.messageId 
        });
        
        res.json({ 
            message: 'SMTP test successful! Check your email inbox.',
            messageId: result.messageId 
        });

    } catch (error) {
        logger.error('SMTP test failed:', { error: error.message, stack: error.stack });
        
        let errorMessage = 'SMTP test failed: ';
        if (error.code === 'EAUTH') {
            errorMessage += 'Authentication failed. Check your username and password.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage += 'Connection failed. Check your host and port.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage += 'Connection timeout. Check your network and firewall settings.';
        } else {
            errorMessage += error.message;
        }
        
        res.status(500).json({ message: errorMessage });
    }
};
