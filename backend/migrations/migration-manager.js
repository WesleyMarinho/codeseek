// backend/migrations/migration-manager.js

const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../config/database');

/**
 * Sistema de Migração Padronizado para DigiServer
 * - Gerencia migrações de forma versionada
 * - Mantém histórico de migrações aplicadas
 * - Suporta rollback seguro
 */

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname);
    this.migrationsTable = 'database_migrations';
  }

  /**
   * Cria tabela de controle de migrações se não existir
   */
  async ensureMigrationsTable() {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${this.migrationsTable}" (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        rollback_sql TEXT
      )
    `);
  }

  /**
   * Lista todas as migrações disponíveis
   */
  async listAvailableMigrations() {
    const files = await fs.readdir(this.migrationsPath);
    return files
      .filter(file => file.endsWith('.js') && file !== 'migration-manager.js')
      .sort()
      .map(file => ({
        name: file.replace('.js', ''),
        path: path.join(this.migrationsPath, file)
      }));
  }

  /**
   * Lista migrações já executadas
   */
  async listExecutedMigrations() {
    await this.ensureMigrationsTable();
    const [results] = await sequelize.query(`
      SELECT migration_name, executed_at 
      FROM "${this.migrationsTable}" 
      ORDER BY executed_at ASC
    `);
    return results;
  }

  /**
   * Executa migrações pendentes
   */
  async runPendingMigrations() {
    const available = await this.listAvailableMigrations();
    const executed = await this.listExecutedMigrations();
    const executedNames = executed.map(m => m.migration_name);
    
    const pending = available.filter(m => !executedNames.includes(m.name));
    
    if (pending.length === 0) {
      console.log('✅ Nenhuma migração pendente encontrada.');
      return;
    }

    console.log(`🔄 Executando ${pending.length} migração(ões) pendente(s)...`);

    for (const migration of pending) {
      await this.executeMigration(migration);
    }

    console.log('✅ Todas as migrações foram executadas com sucesso!');
  }

  /**
   * Executa uma migração específica
   */
  async executeMigration(migration) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`📦 Executando migração: ${migration.name}`);
      
      // Carrega e executa a migração
      const migrationModule = require(migration.path);
      const Sequelize = require('sequelize');
      
      if (typeof migrationModule.up === 'function') {
        await migrationModule.up(sequelize.getQueryInterface(), Sequelize);
      } else {
        console.warn(`⚠️ Migração ${migration.name} não possui função 'up'`);
      }

      // Registra a migração como executada
      await sequelize.query(`
        INSERT INTO "${this.migrationsTable}" (migration_name, rollback_sql) 
        VALUES (?, ?)
      `, {
        replacements: [
          migration.name,
          migrationModule.down ? migrationModule.down.toString() : null
        ],
        transaction
      });

      await transaction.commit();
      console.log(`✅ Migração ${migration.name} executada com sucesso!`);
      
    } catch (error) {
      await transaction.rollback();
      console.error(`❌ Erro ao executar migração ${migration.name}:`, error);
      throw error;
    }
  }

  /**
   * Status das migrações
   */
  async status() {
    const available = await this.listAvailableMigrations();
    const executed = await this.listExecutedMigrations();
    const executedNames = executed.map(m => m.migration_name);

    console.log('\n📊 Status das Migrações:');
    console.log('==========================');
    
    available.forEach(migration => {
      const isExecuted = executedNames.includes(migration.name);
      const status = isExecuted ? '✅ Executada' : '⏳ Pendente';
      console.log(`${status} - ${migration.name}`);
    });

    const pending = available.filter(m => !executedNames.includes(m.name));
    console.log(`\n📈 Total: ${available.length} | Executadas: ${executed.length} | Pendentes: ${pending.length}`);
  }
}

// CLI para execução direta
if (require.main === module) {
  const manager = new MigrationManager();
  const command = process.argv[2];

  switch (command) {
    case 'status':
      manager.status().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
      });
      break;
    
    case 'run':
      manager.runPendingMigrations().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
      });
      break;
    
    default:
      console.log(`
Uso: node migration-manager.js <comando>

Comandos disponíveis:
  status  - Mostra status das migrações
  run     - Executa migrações pendentes

Exemplos:
  node migration-manager.js status
  node migration-manager.js run
      `);
      process.exit(0);
  }
}

module.exports = MigrationManager;
