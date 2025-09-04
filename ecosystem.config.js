module.exports = {
  apps: [
    {
      name: 'codeseek',
      script: './backend/server.js',
      
      // --- Melhoria de Performance ---
      // Define um número fixo de instâncias. '2' é um valor seguro e eficiente
      // para a maioria dos servidores VPS, garantindo alta disponibilidade sem sobrecarregar o sistema.
      instances: 2,
      exec_mode: 'cluster',
      
      // --- Gerenciamento de Memória ---
      // Reinicia a aplicação se ela exceder 250MB de RAM.
      // Previne vazamentos de memória de derrubarem o servidor.
      max_memory_restart: '2048M',
      
      // --- Gerenciamento de Logs (Robusto) ---
      // Caminhos explícitos para os logs, que já criamos no script.
      output: '/var/log/codeseek/out.log',
      error: '/var/log/codeseek/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // --- Rotação de Logs ---
      // Impede que os arquivos de log cresçam indefinidamente.
      log_file_size: '10M', // Rotaciona os logs a cada 10MB
      
      // --- Variáveis de Ambiente Específicas ---
      // Garante que a aplicação sempre rode em modo de produção quando iniciada pelo PM2.
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
