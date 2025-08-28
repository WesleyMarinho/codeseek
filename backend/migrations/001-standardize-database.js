// backend/migrations/001-standardize-database.js

/**
 * Migração 001: Padronização do banco de dados
 * - Corrige nomenclatura de tabelas para snake_case minúsculo
 * - Remove tabelas duplicadas ou incorretas
 * - Garante consistência no schema
 */

async function up(sequelize, transaction) {
  console.log('🔄 Iniciando padronização do banco de dados...');
  
  // 1. Verificar e corrigir tabela Settings -> settings
  const [settingsTable] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Settings'",
    { transaction }
  );
  
  if (settingsTable && settingsTable.length > 0) {
    console.log('📝 Renomeando tabela "Settings" para "settings"...');
    await sequelize.query('ALTER TABLE "Settings" RENAME TO "settings"', { transaction });
  }
  
  // 2. Verificar e remover tabela WebhookLogs duplicada (mantém webhook_logs)
  const [webhookLogsTable] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'WebhookLogs'",
    { transaction }
  );
  
  if (webhookLogsTable && webhookLogsTable.length > 0) {
    console.log('🗑️ Removendo tabela duplicada "WebhookLogs"...');
    await sequelize.query('DROP TABLE "WebhookLogs" CASCADE', { transaction });
  }
  
  // 3. Verificar outras tabelas com nomenclatura incorreta
  const incorrectTables = [
    { wrong: 'Users', correct: 'users' },
    { wrong: 'Categories', correct: 'categories' },
    { wrong: 'Products', correct: 'products' },
    { wrong: 'Licenses', correct: 'licenses' },
    { wrong: 'Subscriptions', correct: 'subscriptions' },
    { wrong: 'Activations', correct: 'activations' },
    { wrong: 'Invoices', correct: 'invoices' }
  ];
  
  for (const table of incorrectTables) {
    const [wrongTable] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table.wrong}'`,
      { transaction }
    );
    
    if (wrongTable && wrongTable.length > 0) {
      console.log(`📝 Renomeando tabela "${table.wrong}" para "${table.correct}"...`);
      await sequelize.query(`ALTER TABLE "${table.wrong}" RENAME TO "${table.correct}"`, { transaction });
    }
  }
  
  // 4. Listar tabelas finais para verificação
  const [allTables] = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    { transaction }
  );
  
  console.log('📊 Tabelas no banco após padronização:');
  if (allTables && allTables.length > 0) {
    allTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
  }
  
  console.log('✅ Padronização do banco de dados concluída!');
}

async function down(sequelize, transaction) {
  console.log('🔄 Revertendo padronização do banco de dados...');
  // Nota: Rollback complexo, melhor fazer backup antes da migração
  console.log('⚠️ Rollback da padronização não é recomendado - faça backup antes da migração');
}

// Compatibilidade com execução direta (legacy)
async function standardizeDatabase() {
  const { sequelize } = require('../config/database');
  const transaction = await sequelize.transaction();
  
  try {
    await up(sequelize, transaction);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro durante a padronização:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  standardizeDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { up, down, standardizeDatabase };
