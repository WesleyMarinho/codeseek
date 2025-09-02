const { Subscription, User } = require('../models/index');
const logger = require('../config/logger');

// ===============================================================
// --- LISTAR TODAS AS ASSINATURAS ---
// ===============================================================
const listSubscriptions = async (req, res) => {
    try {
        logger.info('Listando assinaturas');

        const subscriptions = await Subscription.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Formatar dados para o frontend
        const formattedSubscriptions = subscriptions.map(sub => ({
            id: sub.id,
            userId: sub.userId,
            chargebeeSubscriptionId: sub.chargebeeSubscriptionId,
            plan: sub.plan,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            price: sub.price,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
            user: sub.user ? {
                id: sub.user.id,
                username: sub.user.username,
                email: sub.user.email,
                role: sub.user.role
            } : null
        }));

        logger.info(`${subscriptions.length} assinaturas encontradas`);
        
        res.json({
            success: true,
            subscriptions: formattedSubscriptions,
            total: subscriptions.length
        });

    } catch (error) {
        logger.error('Erro ao listar assinaturas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// ===============================================================
// --- OBTER ESTATÍSTICAS DAS ASSINATURAS ---
// ===============================================================
const getSubscriptionStats = async (req, res) => {
    try {
        logger.info('Obtendo estatísticas das assinaturas');

        // Contar assinaturas por status
        const statsPromises = [
            Subscription.count({ where: { status: 'active' } }),
            Subscription.count({ where: { status: 'cancelled' } }),
            Subscription.count({ where: { status: 'expired' } }),
            Subscription.count(),
        ];

        const [activeCount, cancelledCount, expiredCount, totalCount] = await Promise.all(statsPromises);

        // Contar assinaturas por plano
        const planStats = await Subscription.findAll({
            attributes: [
                'plan',
                [Subscription.sequelize.fn('COUNT', 'id'), 'count']
            ],
            group: ['plan']
        });

        const planCounts = {};
        planStats.forEach(stat => {
            planCounts[stat.plan] = parseInt(stat.dataValues.count);
        });

        const stats = {
            total: totalCount,
            active: activeCount,
            cancelled: cancelledCount,
            expired: expiredCount,
            planBreakdown: planCounts
        };

        logger.info('Estatísticas das assinaturas obtidas:', stats);
        
        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Erro ao obter estatísticas das assinaturas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// ===============================================================
// --- OBTER DETALHES DE UMA ASSINATURA ---
// ===============================================================
const getSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        
        logger.info('Obtendo detalhes da assinatura:', id);

        const subscription = await Subscription.findByPk(id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'role', 'createdAt']
            }]
        });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Assinatura não encontrada'
            });
        }

        logger.info('Assinatura encontrada:', subscription.id);
        
        res.json({
            success: true,
            subscription: {
                id: subscription.id,
                chargebeeSubscriptionId: subscription.chargebeeSubscriptionId,
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                createdAt: subscription.createdAt,
                updatedAt: subscription.updatedAt,
                user: subscription.user ? {
                    id: subscription.user.id,
                    username: subscription.user.username,
                    email: subscription.user.email,
                    role: subscription.user.role,
                    createdAt: subscription.user.createdAt
                } : null
            }
        });

    } catch (error) {
        logger.error('Erro ao obter assinatura:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// ===============================================================
// --- ATUALIZAR STATUS DA ASSINATURA ---
// ===============================================================
const updateSubscriptionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        logger.info('Atualizando status da assinatura:', { id, status });

        // Validar status
        const validStatuses = ['active', 'cancelled', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido. Deve ser: active, cancelled ou expired'
            });
        }

        const subscription = await Subscription.findByPk(id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Assinatura não encontrada'
            });
        }

        await subscription.update({ status });

        logger.info('Status da assinatura atualizado:', { id, oldStatus: subscription.status, newStatus: status });
        
        res.json({
            success: true,
            message: 'Status da assinatura atualizado com sucesso',
            subscription: {
                id: subscription.id,
                status: subscription.status
            }
        });

    } catch (error) {
        logger.error('Erro ao atualizar assinatura:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// ===============================================================
// --- DELETAR ASSINATURA ---
// ===============================================================
const deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        
        logger.info('Deletando assinatura:', id);

        const subscription = await Subscription.findByPk(id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Assinatura não encontrada'
            });
        }

        await subscription.destroy();

        logger.info('Assinatura deletada:', id);
        
        res.json({
            success: true,
            message: 'Assinatura deletada com sucesso'
        });

    } catch (error) {
        logger.error('Erro ao deletar assinatura:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// ===============================================================
// --- CRIAR NOVA ASSINATURA ---
// ===============================================================
const createSubscription = async (req, res) => {
    try {
        const { userId, plan, status, price, startDate, endDate, chargebeeSubscriptionId } = req.body;

        logger.info('Criando nova assinatura', { 
            body: req.body,
            userId: userId,
            plan: plan,
            status: status,
            price: price,
            startDate: startDate,
            endDate: endDate,
            chargebeeSubscriptionId: chargebeeSubscriptionId
        });

        // Validar dados obrigatórios
        if (!userId || !plan || !status) {
            logger.error('Dados obrigatórios faltando:', { 
                userId: !!userId, 
                plan: !!plan, 
                status: !!status,
                receivedBody: req.body 
            });
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: userId, plan, status',
                debug: {
                    receivedUserId: userId,
                    receivedPlan: plan,
                    receivedStatus: status,
                    fullBody: req.body
                }
            });
        }

        // Verificar se o usuário existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Definir preço padrão baseado no plano se não fornecido
        let finalPrice = price;
        if (!finalPrice) {
            const defaultPrices = {
                'basic': 9.99,
                'premium': 19.99,
                'all_access': 29.99
            };
            finalPrice = defaultPrices[plan] || 29.99;
        }

        // Definir datas padrão se não fornecidas
        const now = new Date();
        const defaultStartDate = startDate ? new Date(startDate) : now;
        const defaultEndDate = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

        // Criar assinatura
        const subscription = await Subscription.create({
            userId: parseInt(userId),
            plan,
            status,
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            currentPeriodStart: defaultStartDate,
            currentPeriodEnd: defaultEndDate,
            price: parseFloat(finalPrice),
            chargebeeSubscriptionId: chargebeeSubscriptionId || null
        });

        logger.info(`Assinatura criada com ID: ${subscription.id}`);

        // Buscar a assinatura com dados do usuário
        const createdSubscription = await Subscription.findByPk(subscription.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'role']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Assinatura criada com sucesso',
            subscription: {
                id: createdSubscription.id,
                userId: createdSubscription.userId,
                chargebeeSubscriptionId: createdSubscription.chargebeeSubscriptionId,
                plan: createdSubscription.plan,
                status: createdSubscription.status,
                startDate: createdSubscription.startDate,
                endDate: createdSubscription.endDate,
                currentPeriodStart: createdSubscription.currentPeriodStart,
                currentPeriodEnd: createdSubscription.currentPeriodEnd,
                price: createdSubscription.price,
                createdAt: createdSubscription.createdAt,
                updatedAt: createdSubscription.updatedAt,
                user: createdSubscription.user ? {
                    id: createdSubscription.user.id,
                    username: createdSubscription.user.username,
                    email: createdSubscription.user.email,
                    role: createdSubscription.user.role
                } : null
            }
        });

    } catch (error) {
        logger.error('Erro ao criar assinatura:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
};

// ===============================================================
// --- ATUALIZAR ASSINATURA ---
// ===============================================================
const updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, plan, status, price, startDate, endDate, chargebeeSubscriptionId } = req.body;

        logger.info('Atualizando assinatura', { id, updates: req.body });

        // Buscar assinatura
        const subscription = await Subscription.findByPk(id);
        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'Assinatura não encontrada'
            });
        }

        // Se userId foi alterado, verificar se o novo usuário existe
        if (userId && userId !== subscription.userId) {
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }
        }

        // Atualizar campos
        const updateData = {};
        if (userId !== undefined) updateData.userId = userId;
        if (plan !== undefined) updateData.plan = plan;
        if (status !== undefined) updateData.status = status;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (startDate !== undefined) {
            updateData.startDate = startDate;
            updateData.currentPeriodStart = startDate;
        }
        if (endDate !== undefined) {
            updateData.endDate = endDate;
            updateData.currentPeriodEnd = endDate;
        }
        if (chargebeeSubscriptionId !== undefined) updateData.chargebeeSubscriptionId = chargebeeSubscriptionId || null;

        await subscription.update(updateData);

        logger.info(`Assinatura ${id} atualizada com sucesso`);

        // Buscar a assinatura atualizada com dados do usuário
        const updatedSubscription = await Subscription.findByPk(id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'role']
            }]
        });

        res.json({
            success: true,
            message: 'Assinatura atualizada com sucesso',
            subscription: {
                id: updatedSubscription.id,
                chargebeeSubscriptionId: updatedSubscription.chargebeeSubscriptionId,
                plan: updatedSubscription.plan,
                status: updatedSubscription.status,
                startDate: updatedSubscription.startDate,
                endDate: updatedSubscription.endDate,
                currentPeriodStart: updatedSubscription.currentPeriodStart,
                currentPeriodEnd: updatedSubscription.currentPeriodEnd,
                price: updatedSubscription.price,
                createdAt: updatedSubscription.createdAt,
                updatedAt: updatedSubscription.updatedAt,
                user: updatedSubscription.user ? {
                    id: updatedSubscription.user.id,
                    username: updatedSubscription.user.username,
                    email: updatedSubscription.user.email,
                    role: updatedSubscription.user.role
                } : null
            }
        });

    } catch (error) {
        logger.error('Erro ao atualizar assinatura:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    listSubscriptions,
    getSubscriptionStats,
    getSubscription,
    createSubscription,
    updateSubscription,
    updateSubscriptionStatus,
    deleteSubscription
};
