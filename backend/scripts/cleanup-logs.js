#!/usr/bin/env node
// backend/scripts/cleanup-logs.js

/**
 * Script de Limpeza de Logs
 * Mantém apenas as últimas N linhas dos arquivos de log
 * para evitar que cresçam indefinidamente
 */

const fs = require('fs').promises;
const path = require('path');

const LOG_LIMITS = {
  'combined.log': 2000,   // Últimas 2000 linhas
  'debug.log': 1500,      // Últimas 1500 linhas  
  'error.log': 500        // Últimas 500 linhas
};

async function cleanupLogs() {
  const logsDir = path.join(__dirname, '..', 'logs');
  
  try {
    console.log('🧹 Iniciando limpeza de logs...');
    
    for (const [filename, maxLines] of Object.entries(LOG_LIMITS)) {
      const logPath = path.join(logsDir, filename);
      
      try {
        // Verificar se arquivo existe
        await fs.access(logPath);
        
        // Ler arquivo
        const content = await fs.readFile(logPath, 'utf8');
        const lines = content.split('\n');
        
        if (lines.length > maxLines) {
          // Manter apenas as últimas N linhas
          const trimmedLines = lines.slice(-maxLines);
          const trimmedContent = trimmedLines.join('\n');
          
          // Escrever arquivo trimado
          await fs.writeFile(logPath, trimmedContent);
          
          console.log(`✂️ ${filename}: ${lines.length} → ${trimmedLines.length} linhas`);
        } else {
          console.log(`✅ ${filename}: ${lines.length} linhas (dentro do limite)`);
        }
        
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          console.log(`⚠️ ${filename}: Arquivo não encontrado (ok)`);
        } else {
          console.error(`❌ Erro ao processar ${filename}:`, fileError.message);
        }
      }
    }
    
    console.log('✅ Limpeza de logs concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanupLogs()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Falha na limpeza:', error);
      process.exit(1);
    });
}

module.exports = { cleanupLogs };
