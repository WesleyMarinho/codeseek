#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Script de Instalação 100% Automático para VPS Ubuntu  
# ==============================================================================
# Descrição: Instalação completamente automatizada que resolve todos os problemas
# Versão: 3.0.0 - INSTALAÇÃO AUTOMÁTICA COMPLETA
# Uso: 
#   sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/install-vps-auto.sh)" -- [dominio] [email]
#   ou: sudo bash install-vps-auto.sh [dominio] [email]
# ==============================================================================

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
LOG_FILE="/var/log/codeseek-install.log"
DOMAIN=""
EMAIL=""
USE_SSL=false

# Funções de logging
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE" 2>/dev/null || true
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE" 2>/dev/null || true
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] $1" >> "$LOG_FILE" 2>/dev/null || true
}

success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# Verificar se é root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root (use sudo)"
    fi
}

# Processar argumentos da linha de comando
process_arguments() {
    if [[ $# -ge 1 ]]; then
        DOMAIN="$1"
    fi
    
    if [[ $# -ge 2 ]]; then
        EMAIL="$2"
        USE_SSL=true
    fi
    
    # Validar domínio se fornecido
    if [[ -n "$DOMAIN" && "$DOMAIN" != "localhost" ]]; then
        if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
            warning "Domínio '$DOMAIN' inválido, usando 'localhost'"
            DOMAIN="localhost"
            USE_SSL=false
        fi
    fi
    
    if [[ -z "$DOMAIN" ]]; then
        DOMAIN="localhost"
    fi
    
    log "Configuração: Domínio=$DOMAIN, Email=$EMAIL, SSL=$USE_SSL"
}

# Banner de início
show_banner() {
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              🚀 CodeSeek V1 - Auto Installer               ║"
    echo "║                                                            ║"
    echo "║    Instalação 100% Automática para VPS Ubuntu             ║"
    echo "║    ✅ Resolve todos os problemas automaticamente           ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log "🎯 Iniciando instalação automática do CodeSeek V1"
    log "📍 Domínio: $DOMAIN"
    log "📧 Email: ${EMAIL:-'Não fornecido'}"
    log "🔒 SSL: $USE_SSL"
}

# Atualizar sistema
update_system() {
    log "📦 Atualizando sistema..."
    export DEBIAN_FRONTEND=noninteractive
    
    apt-get update -qq
    apt-get upgrade -y -qq
    apt-get install -y -qq curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
    
    success "Sistema atualizado"
}

# Instalar Node.js 18.x
install_nodejs() {
    log "📗 Instalando Node.js 18.x..."
    
    # Remover versões antigas se existirem
    apt-get remove -y nodejs npm >/dev/null 2>&1 || true
    
    # Instalar Node.js 18.x via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Instalar PM2 globalmente
    npm install -g pm2@latest
    
    # Verificar instalação
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    log "Node.js: $NODE_VERSION"
    log "NPM: $NPM_VERSION"
    
    success "Node.js instalado"
}

# Instalar PostgreSQL
install_postgresql() {
    log "🐘 Instalando PostgreSQL..."
    
    apt-get install -y postgresql postgresql-contrib
    
    # Iniciar e habilitar PostgreSQL
    systemctl enable postgresql
    systemctl start postgresql
    
    success "PostgreSQL instalado"
}

# Instalar Redis
install_redis() {
    log "🔴 Instalando Redis..."
    
    apt-get install -y redis-server
    
    # Configurar Redis para produção
    sed -i 's/^# maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    # Iniciar e habilitar Redis
    systemctl enable redis-server
    systemctl restart redis-server
    
    success "Redis instalado"
}

# Instalar Nginx
install_nginx() {
    log "🌐 Instalando Nginx..."
    
    apt-get install -y nginx
    
    # Iniciar e habilitar Nginx
    systemctl enable nginx
    systemctl start nginx
    
    # Configurar firewall básico
    ufw --force enable >/dev/null 2>&1 || true
    ufw allow ssh >/dev/null 2>&1 || true
    ufw allow 'Nginx Full' >/dev/null 2>&1 || true
    
    success "Nginx instalado"
}

# Criar usuário da aplicação
create_app_user() {
    log "👤 Criando usuário da aplicação..."
    
    # Criar usuário se não existir
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -m -s /bin/bash "$APP_USER"
    fi
    
    # Criar diretórios
    mkdir -p "$APP_DIR"
    mkdir -p /var/log/codeseek
    
    success "Usuário criado"
}

# Configurar banco de dados
setup_database() {
    log "🔧 Configurando banco de dados..."
    
    # Gerar senha forte para o banco
    DB_PASSWORD=$(openssl rand -hex 16)
    
    # Criar usuário e banco
    sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS codeseek_db;
DROP USER IF EXISTS codeseek_user;
CREATE USER codeseek_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE codeseek_db OWNER codeseek_user;
GRANT ALL PRIVILEGES ON DATABASE codeseek_db TO codeseek_user;
EOF

    log "Banco de dados configurado com senha gerada"
    
    # Salvar credenciais
    echo "DB_PASSWORD=$DB_PASSWORD" > /opt/codeseek-credentials.env
    chmod 600 /opt/codeseek-credentials.env
    
    success "Banco configurado"
}

# Clonar repositório
clone_repository() {
    log "📥 Clonando repositório..."
    
    # Remover diretório se existir
    rm -rf "$APP_DIR" >/dev/null 2>&1 || true
    
    # Clonar repositório
    git clone https://github.com/WesleyMarinho/codeseek.git "$APP_DIR"
    
    success "Repositório clonado"
}

# Instalar dependências
install_dependencies() {
    log "📦 Instalando dependências..."
    
    cd "$APP_DIR/backend"
    npm install --production --silent
    
    success "Dependências instaladas"
}

# Configurar environment
setup_environment() {
    log "⚙️ Configurando environment..."
    
    # Ler senha do banco
    DB_PASSWORD=$(grep "DB_PASSWORD" /opt/codeseek-credentials.env | cut -d'=' -f2)
    SESSION_SECRET=$(openssl rand -hex 32)
    
    # Criar arquivo .env
    cat > "$APP_DIR/backend/.env" <<EOF
# Configurações do Servidor
PORT=3000
NODE_ENV=production
BASE_URL=https://$DOMAIN
DOMAIN=$DOMAIN

# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeseek_db
DB_USER=codeseek_user
DB_PASSWORD=$DB_PASSWORD

# Configurações de Sessão e Segurança
SESSION_SECRET=$SESSION_SECRET

# Configurações do Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Configurações de Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@$DOMAIN

# Configurações de Logging
LOG_LEVEL=info
LOG_FILE=/var/log/codeseek/app.log

# Admin Padrão
ADMIN_EMAIL=admin@$DOMAIN
EOF

    # Definir permissões
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    chmod 600 "$APP_DIR/backend/.env"
    
    success "Environment configurado"
}

# Executar seed do banco de dados
run_database_seed() {
    log "🌱 Populando banco de dados..."
    
    cd "$APP_DIR/backend"
    sudo -u "$APP_USER" node seed-database.js
    
    success "Banco populado com dados iniciais"
}

# Configurar PM2
setup_pm2() {
    log "🔄 Configurando PM2..."
    
    cd "$APP_DIR"
    
    # Parar processos antigos
    sudo -u "$APP_USER" pm2 kill >/dev/null 2>&1 || true
    
    # Iniciar aplicação
    sudo -u "$APP_USER" pm2 start ecosystem.config.js --env production
    sudo -u "$APP_USER" pm2 save
    
    # Configurar startup
    env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" --service-name "pm2-$APP_USER"
    systemctl enable "pm2-$APP_USER"
    
    success "PM2 configurado"
}

# Configurar Nginx
setup_nginx() {
    log "🌐 Configurando Nginx..."
    
    # Criar configuração do Nginx
    cat > /etc/nginx/sites-available/codeseek <<'EOF'
# Configuração otimizada para CodeSeek V1
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Static files with caching
    location /public/ {
        alias /opt/codeseek/frontend/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        
        # Handle missing files gracefully
        try_files $uri $uri/ =404;
    }
    
    # Frontend static files
    location / {
        # Try static files first, then proxy to Node.js
        try_files $uri @nodejs;
    }
    
    # Proxy to Node.js application
    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Buffering settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API routes (explicit proxy)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # No caching for API
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Auth routes (explicit proxy)  
    location ~ ^/(login|register|logout)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Admin routes (explicit proxy)
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # Substituir placeholder do domínio
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/codeseek
    
    # Ativar site
    ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t
    systemctl reload nginx
    
    success "Nginx configurado"
}

# Configurar SSL com Let's Encrypt
setup_ssl() {
    if [[ "$USE_SSL" == "true" && "$DOMAIN" != "localhost" ]]; then
        log "🔒 Configurando SSL com Let's Encrypt..."
        
        # Instalar Certbot
        apt-get install -y certbot python3-certbot-nginx
        
        # Obter certificado
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect
        
        # Configurar renovação automática
        crontab -l 2>/dev/null | grep -v certbot > /tmp/cron || true
        echo "0 12 * * * /usr/bin/certbot renew --quiet" >> /tmp/cron
        crontab /tmp/cron
        rm /tmp/cron
        
        success "SSL configurado com sucesso"
    else
        log "🔒 SSL não configurado (domínio: $DOMAIN)"
    fi
}

# Configurar logrotate
setup_logrotate() {
    log "📄 Configurando rotação de logs..."
    
    cat > /etc/logrotate.d/codeseek <<'EOF'
/var/log/codeseek/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 codeseek codeseek
    postrotate
        sudo -u codeseek pm2 reload codeseek
    endscript
}
EOF

    success "Logrotate configurado"
}

# Verificar serviços
verify_services() {
    log "🔍 Verificando serviços..."
    
    # Verificar PostgreSQL
    if systemctl is-active --quiet postgresql; then
        success "✅ PostgreSQL: Online"
    else
        error "❌ PostgreSQL: Offline"
    fi
    
    # Verificar Redis
    if systemctl is-active --quiet redis-server; then
        success "✅ Redis: Online"
    else
        error "❌ Redis: Offline"
    fi
    
    # Verificar Nginx
    if systemctl is-active --quiet nginx; then
        success "✅ Nginx: Online"
    else
        error "❌ Nginx: Offline"
    fi
    
    # Verificar PM2
    if sudo -u "$APP_USER" pm2 list | grep -q "online"; then
        success "✅ PM2/CodeSeek: Online"
    else
        error "❌ PM2/CodeSeek: Offline"
    fi
    
    # Testar conexão HTTP
    sleep 5
    if curl -s "http://localhost:3000" >/dev/null 2>&1; then
        success "✅ Aplicação: Respondendo"
    else
        warning "⚠️ Aplicação: Pode estar iniciando..."
    fi
}

# Mostrar informações finais
show_final_info() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗"
    echo -e "║              🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!          ║"
    echo -e "╚════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}📋 INFORMAÇÕES DE ACESSO:${NC}"
    echo -e "   🌐 URL: ${BLUE}$([ "$USE_SSL" == "true" ] && echo "https://$DOMAIN" || echo "http://$DOMAIN")${NC}"
    echo -e "   🔑 Admin: ${YELLOW}admin@codeseek.com${NC}"
    echo -e "   🔐 Senha: ${YELLOW}admin123456${NC}"
    echo
    echo -e "${CYAN}📊 COMANDOS ÚTEIS:${NC}"
    echo -e "   Status:   ${BLUE}sudo -u $APP_USER pm2 status${NC}"
    echo -e "   Logs:     ${BLUE}sudo -u $APP_USER pm2 logs codeseek${NC}"
    echo -e "   Restart:  ${BLUE}sudo -u $APP_USER pm2 restart codeseek${NC}"
    echo -e "   Monitor:  ${BLUE}sudo -u $APP_USER pm2 monit${NC}"
    echo
    echo -e "${CYAN}📁 ARQUIVOS IMPORTANTES:${NC}"
    echo -e "   App:      ${BLUE}$APP_DIR${NC}"
    echo -e "   Config:   ${BLUE}$APP_DIR/backend/.env${NC}"
    echo -e "   Logs:     ${BLUE}/var/log/codeseek/${NC}"
    echo -e "   Creds:    ${BLUE}/opt/codeseek-credentials.env${NC}"
    echo
    echo -e "${RED}⚠️ IMPORTANTE: Altere a senha do admin após o primeiro login!${NC}"
    echo
}

# Função principal
main() {
    # Verificar se é root
    check_root
    
    # Processar argumentos
    process_arguments "$@"
    
    # Mostrar banner
    show_banner
    
    # Executar instalação
    update_system
    install_nodejs
    install_postgresql  
    install_redis
    install_nginx
    create_app_user
    setup_database
    clone_repository
    install_dependencies
    setup_environment
    run_database_seed
    setup_pm2
    setup_nginx
    setup_ssl
    setup_logrotate
    
    # Verificar serviços
    verify_services
    
    # Mostrar informações finais
    show_final_info
    
    log "✅ Instalação do CodeSeek V1 concluída com sucesso!"
}

# Executar função principal
main "$@"