require('dotenv').config();
const { Client } = require('pg');
const { sequelize, syncDatabase } = require('./models/Index'); // Importa o syncDatabase
const { seedDatabase } = require('./seed-database'); // Importa o seed

async function setupDatabase() {
  const dbName = process.env.DB_NAME;

  // 1. Conectar ao postgres para garantir que nosso DB exista
  const adminClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  try {
    console.log('🔗 Connecting to PostgreSQL to verify database existence...');
    await adminClient.connect();
    
    const checkDb = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (checkDb.rows.length === 0) {
      console.log(`📊 Creating database '${dbName}'...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log('✅ Database created successfully!');
    } else {
      console.log(`✅ Database '${dbName}' already exists.`);
    }
    await adminClient.end();

    // 2. Conectar com Sequelize e FORÇAR a sincronização (DROP e CREATE)
    console.log(`🔄 Forcing synchronization for '${dbName}' (dropping all tables)...`);
    // Agora chamamos a função syncDatabase com force: true
    await syncDatabase(true); 
    console.log('✅ All tables dropped and recreated successfully!');

    // 3. Popular o banco de dados recém-criado
    console.log('🌱 Seeding the database...');
    await seedDatabase();
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ An error occurred during database setup:', error);
    throw error;
  } finally {
    // Garante que a conexão do sequelize seja fechada
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('\n🎉 Full database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Full database setup failed.');
      process.exit(1);
    });
}

module.exports = { setupDatabase };
