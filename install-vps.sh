#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Script de Instalação Simplificado para VPS Ubuntu
# ==============================================================================
# Descrição: Instalação automatizada e otimizada para VPS Ubuntu
# Autor: CodeSeek Team
# Versão: 1.0.0
# Uso: sudo bash install-vps.sh
# ==============================================================================

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
LOG_FILE="/var/log/codeseek-install.log"

# Funções de logging
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] $1" >> "$LOG_FILE"
}

# Verificar se é root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script deve ser executado como root (use sudo)"
    fi
}

# Detectar sistema operacional
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        error "Não foi possível determinar a versão do SO"
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        error "Este script foi otimizado para Ubuntu"
    fi
    
    log "Sistema detectado: $PRETTY_NAME"
}

# Instalar dependências
install_dependencies() {
    log "Atualizando pacotes do sistema..."
    apt-get update -y

    log "Instalando dependências básicas..."
    apt-get install -y curl wget git unzip software-properties-common

    # Node.js 18.x
    if ! command -v node &> /dev/null; then
        log "Instalando Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi

    # PostgreSQL
    if ! command -v psql &> /dev/null; then
        log "Instalando PostgreSQL..."
        apt-get install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
    fi

    # Redis
    if ! command -v redis-server &> /dev/null; then
        log "Instalando Redis..."
        apt-get install -y redis-server
        systemctl start redis
        systemctl enable redis
    fi

    # Nginx
    if ! command -v nginx &> /dev/null; then
        log "Instalando Nginx..."
        apt-get install -y nginx
        systemctl start nginx
        systemctl enable nginx
    fi

    # PM2
    if ! command -v pm2 &> /dev/null; then
        log "Instalando PM2..."
        npm install -g pm2
        pm2 install pm2-logrotate
    fi
}

# Configurar usuário da aplicação
setup_user() {
    if ! id "$APP_USER" &>/dev/null; then
        log "Criando usuário $APP_USER..."
        useradd -m -s /bin/bash "$APP_USER"
        usermod -aG www-data "$APP_USER"
    fi
}

# Configurar banco de dados
setup_database() {
    log "Configurando PostgreSQL..."
    
    # Gerar senha aleatória se não existir
    DB_PASSWORD=$(openssl rand -hex 16)
    
    sudo -u postgres psql <<EOF
CREATE USER codeseek_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE codeseek_db OWNER codeseek_user;
GRANT ALL PRIVILEGES ON DATABASE codeseek_db TO codeseek_user;
\q
EOF
    
    # Salvar credenciais
    echo "DB_PASSWORD=$DB_PASSWORD" > /opt/codeseek-credentials.env
    chmod 600 /opt/codeseek-credentials.env
    
    log "Banco de dados configurado. Credenciais salvas em /opt/codeseek-credentials.env"
}

# Clonar projeto (se não existir)
clone_project() {
    if [[ ! -d "$APP_DIR" ]]; then
        log "Clonando projeto CodeSeek..."
        git clone https://github.com/WesleyMarinho/codeseek.git "$APP_DIR"
        chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    else
        log "Atualizando projeto existente..."
        cd "$APP_DIR"
        sudo -u "$APP_USER" git pull origin main
    fi
}

# Instalar dependências da aplicação
install_app_dependencies() {
    log "Instalando dependências do backend..."
    cd "$APP_DIR/backend"
    sudo -u "$APP_USER" npm install --production

    log "Instalando dependências do frontend..."
    cd "$APP_DIR/frontend"
    sudo -u "$APP_USER" npm install
    sudo -u "$APP_USER" npm run build 2>/dev/null || true
}

# Configurar variáveis de ambiente
setup_environment() {
    log "Configurando variáveis de ambiente..."
    
    # Source das credenciais
    source /opt/codeseek-credentials.env
    
    cat > "$APP_DIR/backend/.env" <<EOF
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeseek_db
DB_USER=codeseek_user
DB_PASSWORD=$DB_PASSWORD

# Configurações do Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Configurações de Sessão
SESSION_SECRET=$(openssl rand -hex 32)

# Configurações de Segurança
BCRYPT_ROUNDS=12

# Configurações da Aplicação
BASE_URL=http://localhost:3000
EOF

    chown "$APP_USER:$APP_USER" "$APP_DIR/backend/.env"
    chmod 600 "$APP_DIR/backend/.env"
}

# Configurar logs
setup_logs() {
    log "Configurando diretório de logs..."
    mkdir -p /var/log/codeseek
    chown "$APP_USER:$APP_USER" /var/log/codeseek
    chmod 755 /var/log/codeseek
}

# Configurar Nginx
setup_nginx() {
    log "Configurando Nginx..."
    
    cat > /etc/nginx/sites-available/codeseek <<EOF
server {
    listen 80;
    server_name localhost;
    
    # Servir arquivos estáticos
    location /public {
        alias $APP_DIR/frontend/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Ativar site
    ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t && systemctl reload nginx
}

# Inicializar banco de dados
initialize_database() {
    log "Inicializando banco de dados..."
    cd "$APP_DIR/backend"
    sudo -u "$APP_USER" npm run setup 2>/dev/null || true
    sudo -u "$APP_USER" npm run seed 2>/dev/null || true
}

# Iniciar aplicação com PM2
start_application() {
    log "Iniciando aplicação com PM2..."
    cd "$APP_DIR"
    sudo -u "$APP_USER" pm2 start ecosystem.config.js --env production
    sudo -u "$APP_USER" pm2 save
    
    # Configurar PM2 para iniciar no boot
    pm2 startup
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
}

# Status da instalação
show_status() {
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN} CodeSeek V1 Instalado com Sucesso! ${NC}"
    echo -e "${GREEN}================================${NC}\n"
    
    echo -e "${BLUE}📍 URLs de Acesso:${NC}"
    echo -e "   🌐 Site: http://$(hostname -I | awk '{print $1}')"
    echo -e "   🌐 Local: http://localhost"
    
    echo -e "\n${BLUE}📋 Comandos Úteis:${NC}"
    echo -e "   Status: sudo -u $APP_USER pm2 status"
    echo -e "   Logs: sudo -u $APP_USER pm2 logs codeseek"
    echo -e "   Restart: sudo -u $APP_USER pm2 restart codeseek"
    echo -e "   Stop: sudo -u $APP_USER pm2 stop codeseek"
    
    echo -e "\n${BLUE}📁 Arquivos Importantes:${NC}"
    echo -e "   App: $APP_DIR"
    echo -e "   Logs: /var/log/codeseek/"
    echo -e "   Credenciais: /opt/codeseek-credentials.env"
    echo -e "   Env: $APP_DIR/backend/.env"
    
    echo -e "\n${YELLOW}⚠️  Próximos Passos:${NC}"
    echo -e "   1. Configure seu domínio no Nginx (/etc/nginx/sites-available/codeseek)"
    echo -e "   2. Configure SSL com Let's Encrypt se necessário"
    echo -e "   3. Ajuste as configurações em $APP_DIR/backend/.env"
    echo -e "   4. Configure backup do banco de dados"
    
    echo -e "\n${GREEN}✅ Instalação concluída!${NC}\n"
}

# Função principal
main() {
    log "Iniciando instalação do CodeSeek V1..."
    
    check_root
    check_os
    install_dependencies
    setup_user
    setup_database
    clone_project
    install_app_dependencies
    setup_environment
    setup_logs
    setup_nginx
    initialize_database
    start_application
    show_status
    
    log "Instalação concluída com sucesso!"
}

# Executar instalação
main "$@"