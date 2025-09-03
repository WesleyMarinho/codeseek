module.exports = {
  apps: [{
    name: 'codeseek',
    script: 'server.js',
    cwd: '/opt/codeseek/backend',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/codeseek/error.log',
    out_file: '/var/log/codeseek/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};