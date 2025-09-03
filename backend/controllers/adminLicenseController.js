const { User, Product, License, Activation } = require('../models/Index');
const { fn, col } = require('sequelize');
const crypto = require('crypto');

// GET /api/admin/licenses - Listar todas as licenças
exports.getAllLicenses = async (req, res) => {
    try {
        const licenses = await License.findAll({
            attributes: {
                include: [
                    [fn('COUNT', col('activations.id')), 'activationCount']
                ]
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'status']
                },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'description']
                },
                {
                    model: Activation,
                    as: 'activations',
                    attributes: [],
                    duplicating: false
                }
            ],
            group: ['License.id', 'user.id', 'product.id'],
            order: [['createdAt', 'DESC']]
        });

        // Mapeia o resultado para um formato mais simples para o frontend
        const licensesWithCount = licenses.map(license => {
            const plainLicense = license.toJSON();
            plainLicense.activationCount = parseInt(plainLicense.activationCount, 10);
            return plainLicense;
        });

        res.json({
            success: true,
            licenses: licensesWithCount
        });
    } catch (error) {
        console.error('Error fetching licenses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch licenses'
        });
    }
};

// GET /api/admin/licenses/:id - Buscar detalhes de uma licença
exports.getLicenseById = async (req, res) => {
    try {
        const { id } = req.params;

        const license = await License.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'status']
                },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'description', 'maxActivations']
                },
                {
                    model: Activation,
                    as: 'activations',
                    attributes: ['id', 'machineId', 'activatedAt']
                }
            ]
        });

        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'License not found'
            });
        }

        res.json({
            success: true,
            license: license
        });
    } catch (error) {
        console.error('Error fetching license:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch license'
        });
    }
};

// POST /api/admin/licenses - Criar uma nova licença
exports.createLicense = async (req, res) => {
    try {
        const { productId, userId, expiresOn, maxActivations } = req.body;

        // Validações básicas
        if (!productId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and User ID are required'
            });
        }

        // Verificar se o produto existe
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Verificar se o usuário existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Gerar chave única
        let key;
        let isUnique = false;
        while (!isUnique) {
            key = crypto.randomBytes(16).toString('hex').toUpperCase();
            const existingLicense = await License.findOne({ where: { key } });
            if (!existingLicense) {
                isUnique = true;
            }
        }

        // Criar a licença
        const license = await License.create({
            productId,
            userId,
            key,
            expiresOn: expiresOn ? new Date(expiresOn) : null,
            maxActivations: maxActivations || product.maxActivations,
            status: 'active'
        });

        // Buscar a licença criada com includes
        const createdLicense = await License.findByPk(license.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'status']
                },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'License created successfully',
            license: createdLicense
        });
    } catch (error) {
        console.error('Error creating license:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create license'
        });
    }
};

// PUT /api/admin/licenses/:id - Atualizar uma licença
exports.updateLicense = async (req, res) => {
    try {
        const { id } = req.params;
        const { productId, userId, expiresOn, maxActivations } = req.body;

        const license = await License.findByPk(id);
        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'License not found'
            });
        }

        // Validar produto se fornecido
        if (productId) {
            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
        }

        // Validar usuário se fornecido
        if (userId) {
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
        }

        // Atualizar a licença
        await license.update({
            productId: productId || license.productId,
            userId: userId || license.userId,
            expiresOn: expiresOn ? new Date(expiresOn) : license.expiresOn,
            maxActivations: maxActivations !== undefined ? maxActivations : license.maxActivations
        });

        // Buscar a licença atualizada com includes
        const updatedLicense = await License.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'status']
                },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        res.json({
            success: true,
            message: 'License updated successfully',
            license: updatedLicense
        });
    } catch (error) {
        console.error('Error updating license:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update license'
        });
    }
};

// PUT /api/admin/licenses/:id/status - Atualizar status da licença
exports.updateLicenseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['active', 'expired', 'revoked', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required (active, expired, revoked, pending)'
            });
        }

        const license = await License.findByPk(id);
        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'License not found'
            });
        }

        await license.update({ status });

        res.json({
            success: true,
            message: `License status updated to ${status}`,
            license: license
        });
    } catch (error) {
        console.error('Error updating license status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update license status'
        });
    }
};

// POST /api/admin/licenses/:id/reset - Resetar licença (deletar ativações)
exports.resetLicense = async (req, res) => {
    try {
        const { id } = req.params;

        const license = await License.findByPk(id);
        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'License not found'
            });
        }

        // Deletar todas as ativações desta licença
        const deletedCount = await Activation.destroy({
            where: { licenseId: id }
        });

        // Resetar a data de ativação
        await license.update({ activatedOn: null });

        res.json({
            success: true,
            message: `License reset successfully. ${deletedCount} activations removed.`,
            license: license
        });
    } catch (error) {
        console.error('Error resetting license:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset license'
        });
    }
};

// DELETE /api/admin/licenses/:id - Deletar licença permanentemente
exports.deleteLicense = async (req, res) => {
    try {
        const { id } = req.params;

        const license = await License.findByPk(id);
        if (!license) {
            return res.status(404).json({
                success: false,
                message: 'License not found'
            });
        }

        // Deletar ativações relacionadas primeiro
        await Activation.destroy({
            where: { licenseId: id }
        });

        // Deletar a licença
        await license.destroy();

        res.json({
            success: true,
            message: 'License deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting license:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete license'
        });
    }
};

// GET /api/admin/licenses/options - Buscar usuários e produtos para formulários
exports.getFormOptions = async (req, res) => {
    try {
        const [users, products] = await Promise.all([
            User.findAll({
                attributes: ['id', 'username', 'email'],
                where: { status: 'active' },
                order: [['username', 'ASC']]
            }),
            Product.findAll({
                attributes: ['id', 'name', 'maxActivations'],
                where: { isActive: true },
                order: [['name', 'ASC']]
            })
        ]);

        res.json({
            success: true,
            users: users,
            products: products
        });
    } catch (error) {
        console.error('Error fetching form options:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch form options'
        });
    }
};

