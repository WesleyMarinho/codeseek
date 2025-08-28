// backend/migrations/add-product-enhancements.js

const { sequelize } = require('../models');

async function addProductEnhancements() {
  try {
    console.log('🔄 Iniciando migração de melhorias dos produtos...');

    // Adicionar novos campos à tabela products
    await sequelize.getQueryInterface().addColumn('products', 'shortDescription', {
      type: sequelize.Sequelize.STRING(500),
      allowNull: true
    });

    await sequelize.getQueryInterface().addColumn('products', 'monthlyPrice', {
      type: sequelize.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    });

    await sequelize.getQueryInterface().addColumn('products', 'annualPrice', {
      type: sequelize.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    });

    await sequelize.getQueryInterface().addColumn('products', 'changelog', {
      type: sequelize.Sequelize.TEXT,
      allowNull: true
    });

    await sequelize.getQueryInterface().addColumn('products', 'featuredMedia', {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    });

    await sequelize.getQueryInterface().addColumn('products', 'mediaFiles', {
      type: sequelize.Sequelize.JSONB,
      defaultValue: [],
      allowNull: true
    });

    console.log('✅ Migração concluída com sucesso!');
    console.log('📋 Campos adicionados:');
    console.log('   - shortDescription (STRING 500)');
    console.log('   - monthlyPrice (DECIMAL 10,2)');
    console.log('   - annualPrice (DECIMAL 10,2)');
    console.log('   - changelog (TEXT)');
    console.log('   - featuredMedia (STRING)');
    console.log('   - mediaFiles (JSONB)');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    throw error;
  }
}

module.exports = { addProductEnhancements };

// Executar migração se chamado diretamente
if (require.main === module) {
  addProductEnhancements()
    .then(() => {
      console.log('🎉 Migração executada com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}
