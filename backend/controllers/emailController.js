// backend/controllers/emailController.js
const nodemailer = require('nodemailer');
const { Setting } = require('../models');
const logger = require('../config/logger');

// Função para converter dados do Editor.js para HTML
function editorJsToHtml(editorData) {
    if (!editorData || !editorData.blocks) {
        return '';
    }

    return editorData.blocks.map(block => {
        switch (block.type) {
            case 'paragraph':
                return `<p>${block.data.text || ''}</p>`;
            case 'header':
                const level = block.data.level || 1;
                return `<h${level}>${block.data.text || ''}</h${level}>`;
            case 'list':
                const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
                const items = block.data.items.map(item => `<li>${item}</li>`).join('');
                return `<${listType}>${items}</${listType}>`;
            case 'quote':
                return `<blockquote><p>${block.data.text || ''}</p><cite>${block.data.caption || ''}</cite></blockquote>`;
            case 'code':
                return `<pre><code>${block.data.code || ''}</code></pre>`;
            case 'delimiter':
                return '<hr>';
            default:
                return `<p>${block.data.text || ''}</p>`;
        }
    }).join('\n');
}

// Função para obter configurações SMTP do banco de dados
async function getSMTPConfig() {
    try {
        const settings = await Setting.findAll({
            where: {
                key: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name']
            }
        });

        const config = {};
        settings.forEach(setting => {
            config[setting.key] = setting.value.value;
        });

        return {
            host: config.smtp_host,
            port: parseInt(config.smtp_port) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: config.smtp_user,
                pass: config.smtp_pass
            },
            fromEmail: config.smtp_from_email || config.smtp_user,
            fromName: config.smtp_from_name || 'DigiServer'
        };
    } catch (error) {
        logger.error('Error getting SMTP config:', error);
        throw new Error('SMTP configuration not found');
    }
}

// Função para criar transporter do nodemailer
async function createTransporter() {
    const smtpConfig = await getSMTPConfig();
    return nodemailer.createTransport(smtpConfig);
}

// Função para obter template de email do banco de dados
async function getEmailTemplate(templateKey) {
    try {
        // Primeiro tenta buscar o template completo (novo formato)
        const templateSetting = await Setting.findOne({ where: { key: `email_template_${templateKey}` } });
        
        if (templateSetting && templateSetting.value) {
            return {
                subject: templateSetting.value.subject || '',
                body: templateSetting.value.body || ''
            };
        }
        
        // Fallback para o formato antigo (separado)
        const subjectSetting = await Setting.findOne({ where: { key: `email_${templateKey}_subject` } });
        const bodySetting = await Setting.findOne({ where: { key: `email_${templateKey}_body` } });

        return {
            subject: subjectSetting ? subjectSetting.value : '',
            body: bodySetting ? bodySetting.value : ''
        };
    } catch (error) {
        logger.error(`Error getting email template ${templateKey}:`, error);
        throw new Error(`Email template ${templateKey} not found`);
    }
}

// Função para substituir variáveis no template
function replaceTemplateVariables(template, variables = {}) {
    let result = template;
    
    // Variáveis padrão
    const defaultVariables = {
        siteName: 'DigiServer Pro',
        supportEmail: 'support@digiserver.com',
        currentYear: new Date().getFullYear()
    };

    const allVariables = { ...defaultVariables, ...variables };

    // Substituir variáveis no formato {{variableName}}
    Object.keys(allVariables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, allVariables[key]);
    });

    return result;
}

// Função principal para enviar email
exports.sendEmail = async (to, templateKey, variables = {}) => {
    try {
        const smtpConfig = await getSMTPConfig();
        const transporter = nodemailer.createTransport(smtpConfig);
        const template = await getEmailTemplate(templateKey);

        // Substituir variáveis no assunto
        const subject = replaceTemplateVariables(template.subject, variables);

        // Converter Editor.js para HTML e substituir variáveis
        let htmlBody;
        if (typeof template.body === 'string') {
            // Template simples (string)
            htmlBody = replaceTemplateVariables(template.body, variables);
        } else {
            // Template do Editor.js (objeto)
            const editorHtml = editorJsToHtml(template.body);
            htmlBody = replaceTemplateVariables(editorHtml, variables);
        }

        // Envolver em template HTML básico
        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                h1, h2, h3, h4, h5, h6 { color: #2c3e50; }
                .header { background: #3498db; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }
                .content { padding: 20px; }
                .footer { background: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 20px; }
                blockquote { border-left: 4px solid #3498db; padding-left: 15px; margin: 15px 0; font-style: italic; }
                code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
                pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{{siteName}}</h1>
            </div>
            <div class="content">
                ${htmlBody}
            </div>
            <div class="footer">
                <p>© {{currentYear}} {{siteName}}. All rights reserved.</p>
                <p>If you have any questions, contact us at {{supportEmail}}</p>
            </div>
        </body>
        </html>
        `;

        // Substituir variáveis no HTML final
        const finalHtml = replaceTemplateVariables(fullHtml, variables);

        // Determinar o remetente
        const fromEmail = variables.fromEmail || smtpConfig.fromEmail;
        const fromName = variables.fromName || smtpConfig.fromName;
        const fromAddress = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

        const mailOptions = {
            from: fromAddress,
            to: to,
            subject: subject,
            html: finalHtml
        };

        const result = await transporter.sendMail(mailOptions);
        logger.info('Email sent successfully:', { to, templateKey, messageId: result.messageId });
        
        return { success: true, messageId: result.messageId };
    } catch (error) {
        logger.error('Error sending email:', { to, templateKey, error: error.message });
        throw error;
    }
};

// Função auxiliar para envio de teste de email (para uso interno)
exports.sendTestEmailInternal = async (templateKey, testEmail, variables = {}) => {
    // Adicionar variáveis de teste padrão
    const testVariables = {
        username: 'Test User',
        productName: 'Test Product',
        licenseKey: 'TEST-1234-5678-9012',
        amount: '$29.99',
        invoiceNumber: 'INV-TEST-001',
        resetLink: 'https://example.com/reset-password?token=test-token',
        ...variables
    };

    return await exports.sendEmail(testEmail, templateKey, testVariables);
};

// POST /api/admin/email/test
exports.sendTestEmail = async (req, res) => {
    try {
        const { templateKey, testEmail, variables = {} } = req.body;

        if (!templateKey || !testEmail) {
            return res.status(400).json({ message: 'Template key and test email are required' });
        }

        await exports.sendTestEmailInternal(templateKey, testEmail, variables);
        
        res.json({ message: 'Test email sent successfully!' });
    } catch (error) {
        logger.error('Error sending test email:', error);
        res.status(500).json({ message: 'Error sending test email: ' + error.message });
    }
};

// GET /api/admin/email/templates
exports.getEmailTemplates = async (req, res) => {
    try {
        const templateKeys = [
            'welcome',
            'purchase',
            'renewal', 
            'payment_failed',
            'password_reset',
            'license_activated',
            'subscription_cancelled'
        ];

        const templates = {};
        
        for (const key of templateKeys) {
            try {
                templates[key] = await getEmailTemplate(key);
            } catch (error) {
                templates[key] = { subject: '', body: '' };
            }
        }

        res.json(templates);
    } catch (error) {
        logger.error('Error getting email templates:', error);
        res.status(500).json({ message: 'Error getting email templates' });
    }
};

// PUT /api/admin/email/templates
exports.updateEmailTemplates = async (req, res) => {
    try {
        const templates = req.body;
        const promises = [];

        Object.keys(templates).forEach(templateKey => {
            const template = templates[templateKey];
            
            // Salvar subject
            promises.push(
                Setting.upsert({
                    key: `email_${templateKey}_subject`,
                    value: { value: template.subject }
                })
            );

            // Salvar body
            promises.push(
                Setting.upsert({
                    key: `email_${templateKey}_body`,
                    value: { value: template.body }
                })
            );
        });

        await Promise.all(promises);
        
        logger.info('Email templates updated successfully by user:', { userId: req.session.userId });
        res.json({ message: 'Email templates updated successfully!' });
    } catch (error) {
        logger.error('Error updating email templates:', error);
        res.status(500).json({ message: 'Error updating email templates' });
    }
};

// Funções específicas para diferentes tipos de email
exports.sendWelcomeEmail = async (userEmail, username) => {
    return exports.sendEmail(userEmail, 'welcome', { username });
};

exports.sendPurchaseEmail = async (userEmail, username, productName, amount, licenseKey) => {
    return exports.sendEmail(userEmail, 'purchase', { 
        username, 
        productName, 
        amount, 
        licenseKey 
    });
};

exports.sendPasswordResetEmail = async (userEmail, username, resetLink) => {
    return exports.sendEmail(userEmail, 'password_reset', { 
        username, 
        resetLink 
    });
};

exports.sendPaymentFailedEmail = async (userEmail, username, amount, invoiceNumber) => {
    return exports.sendEmail(userEmail, 'payment_failed', { 
        username, 
        amount, 
        invoiceNumber 
    });
};

exports.sendRenewalEmail = async (userEmail, username, planName, amount) => {
    return exports.sendEmail(userEmail, 'renewal', { 
        username, 
        planName, 
        amount 
    });
};

exports.sendLicenseActivatedEmail = async (userEmail, username, productName, licenseKey) => {
    return exports.sendEmail(userEmail, 'license_activated', { 
        username, 
        productName, 
        licenseKey 
    });
};

exports.sendSubscriptionCancelledEmail = async (userEmail, username, planName) => {
    return exports.sendEmail(userEmail, 'subscription_cancelled', { 
        username, 
        planName 
    });
};