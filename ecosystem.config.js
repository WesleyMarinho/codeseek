module.exports = {
  apps: [{
    name: 'digiserver',
    script: 'server.js',
    cwd: '/opt/digiserver/backend',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/digiserver/error.log',
    out_file: '/var/log/digiserver/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};