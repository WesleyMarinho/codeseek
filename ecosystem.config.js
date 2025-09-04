module.exports = {
  apps: [
    {
      name: 'codeseek',
      script: './backend/server.js',
      
      // Configuração otimizada para VPS
      instances: 1, // Uma instância é suficiente para VPS pequenos/médios
      exec_mode: 'fork', // Fork mode é mais eficiente para aplicações single-core
      
      // Configuração de memória adequada para VPS
      max_memory_restart: '512M', // Limite adequado para VPS típicos
      
      // Configuração de logs simplificada
      log_file: '/var/log/codeseek/combined.log',
      error_file: '/var/log/codeseek/error.log',
      out_file: '/var/log/codeseek/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Configuração de restart automático
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Variáveis de ambiente
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ],
  
  // Configuração de deploy (opcional)
  deploy: {
    production: {
      user: 'root',
      ref: 'origin/main',
      repo: 'https://github.com/WesleyMarinho/codeseek.git',
      path: '/opt/codeseek',
      'post-deploy': 'cd backend && npm install --production && pm2 reload ecosystem.config.js --env production'
    }
  }
};
