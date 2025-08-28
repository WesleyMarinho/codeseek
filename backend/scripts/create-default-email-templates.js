// Script para criar templates de email padrão no banco de dados
const { Setting } = require('../models');
const logger = require('../config/logger');

// Templates padrão com conteúdo HTML e variáveis
const defaultTemplates = {
    email_template_welcome: {
        subject: 'Bem-vindo ao {{siteName}}!',
        body: {
            "time": Date.now(),
            "blocks": [
                {
                    "id": "welcome-header",
                    "type": "header",
                    "data": {
                        "text": "Bem-vindo ao {{siteName}}!",
                        "level": 1
                    }
                },
                {
                    "id": "welcome-content",
                    "type": "paragraph",
                    "data": {
                        "text": "Olá {{userName}},<br><br>Seja muito bem-vindo ao {{siteName}}! Estamos muito felizes em tê-lo conosco.<br><br>Sua conta foi criada com sucesso e você já pode começar a explorar nossos produtos e serviços.<br><br>Se precisar de ajuda, nossa equipe de suporte está sempre disponível em {{supportEmail}}."
                    }
                },
                {
                    "id": "welcome-footer",
                    "type": "paragraph",
                    "data": {
                        "text": "Atenciosamente,<br>Equipe {{siteName}}"
                    }
                }
            ],
            "version": "2.28.2"
        }
    },
    
    email_template_purchase: {
        subject: 'Compra confirmada - {{productName}}',
        body: {
            "time": Date.now(),
            "blocks": [
                {
                    "id": "purchase-header",
                    "type": "header",
                    "data": {
                        "text": "Compra Confirmada!",
                        "level": 1
                    }
                },
                {
                    "id": "purchase-content",
                    "type": "paragraph",
                    "data": {
                        "text": "Olá {{userName}},<br><br>Sua compra foi processada com sucesso!<br><br><strong>Produto:</strong> {{productName}}<br><strong>Valor:</strong> {{amount}}<br><strong>Chave de Licença:</strong> {{licenseKey}}<br><br>Você pode acessar seus produtos no painel de controle.<br><br>Obrigado por escolher o {{siteName}}!"
                    }
                },
                {
                    "id": "purchase-footer",
                    "type": "paragraph",
                    "data": {
                        "text": "Atenciosamente,<br>Equipe {{siteName}}"
                    }
                }
            ],
            "version": "2.28.2"
        }
    },
    
    email_template_renewal: {
        subject: 'Assinatura renovada - {{planName}}',
        body: {
            "time": Date.now(),
            "blocks": [
                {
                    "id": "renewal-header",
                    "type": "header",
                    "data": {
                        "text": "Assinatura Renovada!",
                        "level": 1
                    }
                },
                {
                    "id": "renewal-content",
                    "type": "paragraph",
                    "data": {
                        "text": "Olá {{userName}},<br><br>Sua assinatura foi renovada com sucesso!<br><br><strong>Plano:</strong> {{planName}}<br><strong>Valor:</strong> {{amount}}<br><strong>Próxima renovação:</strong> {{renewalDate}}<br><br>Continue aproveitando todos os benefícios do seu plano.<br><br>Obrigado por continuar conosco!"
                    }
                },
                {
                    "id": "renewal-footer",
                    "type": "paragraph",
                    "data": {
                        "text": "Atenciosamente,<br>Equipe {{siteName}}"
                    }
                }
            ],
            "version": "2.28.2"
        }
    },
    
    email_template_password_reset: {
        subject: 'Redefinição de senha - {{siteName}}',
        body: {
            "time": Date.now(),
            "blocks": [
                {
                    "id": "reset-header",
                    "type": "header",
                    "data": {
                        "text": "Redefinição de Senha",
                        "level": 1
                    }
                },
                {
                    "id": "reset-content",
                    "type": "paragraph",
                    "data": {
                        "text": "Olá {{userName}},<br><br>Recebemos uma solicitação para redefinir sua senha.<br><br>Clique no link abaixo para criar uma nova senha:<br><br><a href='{{resetLink}}' style='background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Redefinir Senha</a><br><br>Se você não solicitou esta redefinição, ignore este email.<br><br>Este link expira em 1 hora."
                    }
                },
                {
                    "id": "reset-footer",
                    "type": "paragraph",
                    "data": {
                        "text": "Atenciosamente,<br>Equipe {{siteName}}"
                    }
                }
            ],
            "version": "2.28.2"
        }
    },
    
    email_template_payment_failed: {
        subject: 'Falha no pagamento - {{siteName}}',
        body: {
            "time": Date.now(),
            "blocks": [
                {
                    "id": "payment-failed-header",
                    "type": "header",
                    "data": {
                        "text": "Problema com o Pagamento",
                        "level": 1
                    }
                },
                {
                    "id": "payment-failed-content",
                    "type": "paragraph",
                    "data": {
                        "text": "Olá {{userName}},<br><br>Infelizmente, não conseguimos processar seu pagamento.<br><br><strong>Valor:</strong> {{amount}}<br><strong>Motivo:</strong> Falha no processamento<br><br>Por favor, verifique seus dados de pagamento e tente novamente.<br><br>Se o problema persistir, entre em contato conosco em {{supportEmail}}."
                    }
                },
                {
                    "id": "payment-failed-footer",
                    "type": "paragraph",
                    "data": {
                        "text": "Atenciosamente,<br>Equipe {{siteName}}"
                    }
                }
            ],
            "version": "2.28.2"
        }
    },
    
    email_template_license_activated: {
        subject: 'Licença ativada - {{productName}}',
        body: {
            "time": Date.now(),
            "blocks": [
                {
                    "id": "license-header",
                    "type": "header",
                    "data": {
                        "text": "Licença Ativada!",
                        "level": 1
                    }
                },
                {
                    "id": "license-content",
                    "type": "paragraph",
                    "data": {
                        "text": "Olá {{userName}},<br><br>Sua licença foi ativada com sucesso!<br><br><strong>Produto:</strong> {{productName}}<br><strong>Chave de Licença:</strong> {{licenseKey}}<br><br>Você já pode começar a usar o produto. Acesse o painel de controle para fazer o download.<br><br>Aproveite!"
                    }
                },
                {
                    "id": "license-footer",
                    "type": "paragraph",
                    "data": {
                        "text": "Atenciosamente,<br>Equipe {{siteName}}"
                    }
                }
            ],
            "version": "2.28.2"
        }
    },
    
    email_template_subscription_cancelled: {
        subject: 'Assinatura cancelada - {{siteName}}',
        body: {
            "time": Date.now(),
            "blocks": [
                {
                    "id": "cancel-header",
                    "type": "header",
                    "data": {
                        "text": "Assinatura Cancelada",
                        "level": 1
                    }
                },
                {
                    "id": "cancel-content",
                    "type": "paragraph",
                    "data": {
                        "text": "Olá {{userName}},<br><br>Sua assinatura foi cancelada conforme solicitado.<br><br>Você ainda terá acesso aos serviços até o final do período já pago.<br><br>Sentiremos sua falta! Se mudar de ideia, estaremos aqui para recebê-lo de volta.<br><br>Se precisar de ajuda, entre em contato em {{supportEmail}}."
                    }
                },
                {
                    "id": "cancel-footer",
                    "type": "paragraph",
                    "data": {
                        "text": "Atenciosamente,<br>Equipe {{siteName}}"
                    }
                }
            ],
            "version": "2.28.2"
        }
    }
};

async function createDefaultEmailTemplates() {
    try {
        logger.info('Creating default email templates...');
        
        const promises = Object.entries(defaultTemplates).map(([key, template]) => {
            return Setting.upsert({
                key: key,
                value: template
            });
        });
        
        await Promise.all(promises);
        
        logger.info('Default email templates created successfully!');
        console.log('✅ Templates de email padrão criados com sucesso!');
        
    } catch (error) {
        logger.error('Error creating default email templates:', error);
        console.error('❌ Erro ao criar templates de email padrão:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createDefaultEmailTemplates()
        .then(() => {
            console.log('Script executado com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { createDefaultEmailTemplates, defaultTemplates };