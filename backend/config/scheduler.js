const cron = require('node-cron');
const { WebhookLog } = require('../models/index');
const { Op } = require('sequelize');
const logger = require('./logger');

class Scheduler {
  constructor() {
    this.tasks = [];
  }

  // Inicializar todas as tarefas agendadas
  init() {
    logger.startup('Agendador de tarefas inicializado');
    
    // Tarefa para limpeza automática de webhook logs (executa todos os dias à meia-noite)
    this.scheduleWebhookLogCleanup();
    
    logger.startup(`${this.tasks.length} tarefas agendadas`);
  }

  // Agendar limpeza automática de logs de webhook
  scheduleWebhookLogCleanup() {
    // Executa todos os dias à meia-noite (00:00)
    const task = cron.schedule('0 0 * * *', async () => {
      try {
        logger.debug('Limpeza automática de webhook logs iniciada');
        
        // Calcular data de 30 dias atrás
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Deletar logs mais antigos que 30 dias
        const result = await WebhookLog.destroy({
          where: {
            createdAt: {
              [Op.lt]: thirtyDaysAgo
            }
          }
        });
        
        logger.info(`✅ Webhook logs cleanup completed. Removed ${result} old records.`);
        
      } catch (error) {
        logger.error('❌ Error during webhook logs cleanup:', error);
      }
    }, {
      scheduled: false, // Não iniciar automaticamente
      timezone: 'America/Sao_Paulo' // Ajustar para seu fuso horário
    });

    this.tasks.push({
      name: 'webhook-logs-cleanup',
      schedule: '0 0 * * *',
      description: 'Clean up webhook logs older than 30 days',
      task
    });

    // Iniciar a tarefa
    task.start();
    logger.info('📅 Webhook logs cleanup task scheduled (daily at midnight)');
  }

  // Método para executar limpeza manual (útil para testes)
  async runWebhookLogCleanupNow() {
    try {
      logger.info('🧹 Running manual webhook logs cleanup...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await WebhookLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });
      
      logger.info(`✅ Manual webhook logs cleanup completed. Removed ${result} old records.`);
      return result;
      
    } catch (error) {
      logger.error('❌ Error during manual webhook logs cleanup:', error);
      throw error;
    }
  }

  // Listar todas as tarefas agendadas
  getTasks() {
    return this.tasks.map(({ task, ...info }) => info);
  }

  // Parar uma tarefa específica
  stopTask(name) {
    const taskInfo = this.tasks.find(t => t.name === name);
    if (taskInfo) {
      taskInfo.task.stop();
      logger.info(`⏹️ Task '${name}' stopped`);
      return true;
    }
    return false;
  }

  // Iniciar uma tarefa específica
  startTask(name) {
    const taskInfo = this.tasks.find(t => t.name === name);
    if (taskInfo) {
      taskInfo.task.start();
      logger.info(`▶️ Task '${name}' started`);
      return true;
    }
    return false;
  }

  // Parar todas as tarefas
  stopAll() {
    this.tasks.forEach(({ task, name }) => {
      task.stop();
      logger.info(`⏹️ Task '${name}' stopped`);
    });
    logger.info('🛑 All scheduled tasks stopped');
  }

  // Reiniciar todas as tarefas
  restartAll() {
    this.tasks.forEach(({ task, name }) => {
      task.start();
      logger.info(`🔄 Task '${name}' restarted`);
    });
    logger.info('🔄 All scheduled tasks restarted');
  }
}

// Exportar instância singleton
const scheduler = new Scheduler();
module.exports = scheduler;
