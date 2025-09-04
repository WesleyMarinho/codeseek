#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Instalação Automática em Uma Linha (Versão Corrigida)
# ==============================================================================
#
# Este script automatiza completamente a instalação do CodeSeek V1
# e inclui uma verificação robusta para instalações corrompidas do Node.js.
#
# Uso:
#   curl -fsSL <URL_DO_SCRIPT_CORRIGIDO> | sudo bash -s -- yourdomain.com admin@yourdomain.com
#
# Ou localmente:
#   sudo bash install-codeseek.sh yourdomain.com admin@yourdomain.com [db_name] [db_user]
#
# ==============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# --- Cores para output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Funções de Logging ---
log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

step() {
    echo -e "\n${CYAN}[STEP]${NC} $1"
}

# --- Função para gerar senhas seguras ---
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# --- Função para verificar se comando existe ---
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# --- Função para aguardar serviço ---
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    if [ "$WSL_DETECTED" = "true" ]; then
        warning "WSL detectado - pulando verificação de serviço para $service"
        return 0
    fi
    
    while [ $attempt -le $max_attempts ]; do
        if systemctl is-active --quiet "$service"; then
            log "$service está ativo"
            return 0
        fi
        
        info "Aguardando $service... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    error "$service não iniciou após $max_attempts tentativas"
    return 1
}

# --- Função para verificar conectividade ---
check_connectivity() {
    if ! ping -c 1 google.com &> /dev/null && ! ping -c 1 8.8.8.8 &> /dev/null; then
        error "Sem conectividade com a internet"
        exit 1
    fi
}

# --- Função para verificar espaço em disco ---
check_disk_space() {
    local required_space=2048  # 2GB em MB
    local available_space=$(df / | awk 'NR==2 {print int($4/1024)}')
    
    if [ "$available_space" -lt "$required_space" ]; then
        error "Espaço insuficiente em disco. Necessário: ${required_space}MB, Disponível: ${available_space}MB"
        exit 1
    fi
    
    log "Espaço em disco suficiente: ${available_space}MB disponível"
}

# --- Função para backup de configurações existentes ---
backup_existing_configs() {
    local backup_dir="/tmp/codeseek-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    [ -f "/etc/nginx/sites-enabled/codeseek" ] && cp "/etc/nginx/sites-enabled/codeseek" "$backup_dir/"
    [ -f "/etc/systemd/system/codeseek.service" ] && cp "/etc/systemd/system/codeseek.service" "$backup_dir/"
    [ -d "/opt/codeseek" ] && cp -r "/opt/codeseek/.env" "$backup_dir/" 2>/dev/null || true
    
    info "Backup das configurações salvo em: $backup_dir"
}

# ==============================================================================
# VALIDAÇÃO DE PARÂMETROS
# ==============================================================================

if [ $# -lt 2 ]; then
    error "Uso: $0 <DOMAIN> <SSL_EMAIL> [DB_NAME] [DB_USER]"
    error "Exemplo: $0 codeseek.com admin@codeseek.com"
    exit 1
fi

DOMAIN="$1"
SSL_EMAIL="$2"
DB_NAME="${3:-codeseek_db}"
DB_USER="${4:-codeseek_user}"

if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    error "Domínio inválido: $DOMAIN"
    exit 1
fi

if [[ ! "$SSL_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    error "Email inválido: $SSL_EMAIL"
    exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
    error "Este script deve ser executado como root (use sudo)"
    exit 1
fi

if [ ! -f /etc/debian_version ]; then
    error "Este script é compatível apenas com sistemas Debian/Ubuntu"
    exit 1
fi

if grep -qi microsoft /proc/version 2>/dev/null; then
    warning "WSL detectado - algumas funcionalidades podem ser limitadas"
    export WSL_DETECTED=true
else
    export WSL_DETECTED=false
fi

# ==============================================================================
# INÍCIO DA INSTALAÇÃO
# ==============================================================================

echo -e "${MAGENTA}"
echo "==============================================="
echo "    CodeSeek V1 - Instalação Automática"
echo "==============================================="
echo -e "${NC}"

info "Domínio: $DOMAIN"
info "Email SSL: $SSL_EMAIL"
info "Banco de dados: $DB_NAME"
info "Usuário do banco: $DB_USER"
info "Diretório da aplicação: /opt/codeseek"
info "Usuário da aplicação: codeseek"

echo -e "\n${YELLOW}A instalação começará em 5 segundos...${NC}"
sleep 5

step "Verificando conectividade"
check_connectivity
log "Conectividade OK"

step "Verificando espaço em disco"
check_disk_space

step "Fazendo backup de configurações existentes"
backup_existing_configs

# ==============================================================================
# 1. ATUALIZAÇÃO DO SISTEMA
# ==============================================================================

step "Atualizando sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
log "Sistema atualizado"

# ==============================================================================
# 2. INSTALAÇÃO DE DEPENDÊNCIAS
# ==============================================================================

step "Instalando dependências básicas"
apt-get install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    openssl \
    ufw \
    fail2ban \
    htop \
    nano \
    vim
log "Dependências básicas instaladas"

# ==============================================================================
# 3. INSTALAÇÃO DO NODE.JS (VERSÃO CORRIGIDA)
# ==============================================================================

step "Verificando e instalando Node.js 18.x"
# Condição de reinstalação:
# 1. Se 'node' não existe
# 2. Se 'npm' não existe (corrige o problema de instalação incompleta)
# 3. Se a versão do 'node' não é a 18.x
if ! command_exists node || ! command_exists npm || [[ "$(node --version 2>/dev/null)" != v18* ]]; then
    info "Node.js/npm não encontrado ou em estado inconsistente. Realizando instalação/reinstalação completa."

    # Passo 1: Remover qualquer instalação anterior para garantir um ambiente limpo
    warning "Removendo versões anteriores do Node.js e npm..."
    apt-get purge -y nodejs npm >/dev/null 2>&1
    apt-get autoremove -y >/dev/null 2>&1
    rm -f /etc/apt/sources.list.d/nodesource.list

    # Passo 2: Instalar a versão correta do Node.js 18.x
    info "Adicionando repositório NodeSource e instalando Node.js v18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs

    # Passo 3: Verificação pós-instalação
    if ! command_exists node || ! command_exists npm; then
        error "Falha crítica na reinstalação do Node.js e npm. A instalação não pode continuar."
        exit 1
    fi
    log "Node.js $(node --version) e npm $(npm --version) instalados com sucesso."
else
    log "Node.js $(node --version) e npm $(npm --version) já estão instalados e na versão correta."
fi


# ==============================================================================
# 4. INSTALAÇÃO DO PM2
# ==============================================================================

step "Instalando PM2"
if ! command_exists pm2; then
    npm install -g pm2
    log "PM2 instalado"
else
    log "PM2 já está instalado"
fi

# ==============================================================================
# 5. INSTALAÇÃO DO POSTGRESQL
# ==============================================================================

step "Instalando PostgreSQL"
if ! command_exists psql; then
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    wait_for_service postgresql
else
    log "PostgreSQL já está instalado"
    systemctl start postgresql || true
fi

# ==============================================================================
# 6. INSTALAÇÃO DO REDIS
# ==============================================================================

step "Instalando Redis"
if ! command_exists redis-server; then
    apt-get install -y redis-server
    systemctl start redis-server
    systemctl enable redis-server
    wait_for_service redis-server
else
    log "Redis já está instalado"
    systemctl start redis-server || true
fi

# ==============================================================================
# 7. INSTALAÇÃO DO NGINX
# ==============================================================================

step "Instalando Nginx"
if ! command_exists nginx; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
    wait_for_service nginx
else
    log "Nginx já está instalado"
    systemctl start nginx || true
fi

# ==============================================================================
# 8. INSTALAÇÃO DO CERTBOT
# ==============================================================================

step "Instalando Certbot"
if ! command_exists certbot; then
    apt-get install -y certbot python3-certbot-nginx
    log "Certbot instalado"
else
    log "Certbot já está instalado"
fi

# ==============================================================================
# 9. CONFIGURAÇÃO DO USUÁRIO DA APLICAÇÃO
# ==============================================================================

step "Configurando usuário da aplicação"
if ! id "codeseek" &>/dev/null; then
    useradd -r -s /bin/bash -d /opt/codeseek -m codeseek
    log "Usuário 'codeseek' criado"
else
    log "Usuário 'codeseek' já existe"
fi

# ==============================================================================
# 10. CONFIGURAÇÃO DO DIRETÓRIO DA APLICAÇÃO
# ==============================================================================

step "Configurando diretório da aplicação"
APP_DIR="/opt/codeseek"
if [ -d "$APP_DIR" ]; then
    warning "Diretório de aplicação existente. Fazendo backup..."
    mv "$APP_DIR" "/tmp/codeseek-old-$(date +%Y%m%d-%H%M%S)"
fi
mkdir -p "$APP_DIR"
chown codeseek:codeseek "$APP_DIR"

# ==============================================================================
# 11. CLONAGEM DO REPOSITÓRIO
# ==============================================================================

step "Clonando repositório"
REPO_URL="https://github.com/WesleyMarinho/codeseek.git"
info "Clonando de: $REPO_URL"
sudo -u codeseek git clone "$REPO_URL" "$APP_DIR"
log "Código fonte obtido"

# ==============================================================================
# 12. INSTALAÇÃO DE DEPENDÊNCIAS DO BACKEND
# ==============================================================================

step "Instalando dependências do backend"
cd "$APP_DIR/backend"
if [ -f "package.json" ]; then
    sudo -u codeseek npm install --production
    log "Dependências do backend instaladas"
else
    error "package.json não encontrado em $APP_DIR/backend"
    exit 1
fi

# ==============================================================================
# 13. CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ==============================================================================

step "Configurando variáveis de ambiente"
DB_PASSWORD=$(generate_password)
SESSION_SECRET=$(generate_password)
JWT_SECRET=$(generate_password)
ENCRYPTION_KEY=$(generate_password)

cat > "$APP_DIR/backend/.env" << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# Application Configuration
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
APP_URL=https://$DOMAIN
# Security
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
# SSL Configuration
SSL_EMAIL=$SSL_EMAIL
# Upload Configuration
UPLOAD_DIR=/opt/codeseek/uploads
MAX_FILE_SIZE=10485760
# Email Configuration (configure conforme necessário)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=$SSL_EMAIL
# Payment Configuration (configure conforme necessário)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Analytics (opcional)
GOOGLE_ANALYTICS_ID=
# Logging
LOG_LEVEL=info
LOG_FILE=/opt/codeseek/logs/app.log
EOF

chown codeseek:codeseek "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"
log "Arquivo .env configurado"

# ==============================================================================
# 14. CONFIGURAÇÃO DO POSTGRESQL
# ==============================================================================

step "Configurando PostgreSQL"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    log "Usuário '$DB_USER' criado no PostgreSQL"
else
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    log "Senha do usuário '$DB_USER' atualizada"
fi

if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    log "Banco de dados '$DB_NAME' criado"
else
    log "Banco de dados '$DB_NAME' já existe"
fi

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
log "Privilégios concedidos ao usuário '$DB_USER'"

# ==============================================================================
# 15. CONFIGURAÇÃO DE DIRETÓRIOS
# ==============================================================================

step "Configurando diretórios"
mkdir -p "$APP_DIR/uploads"
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/backups"
chown -R codeseek:codeseek "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod 700 "$APP_DIR/uploads" "$APP_DIR/logs" "$APP_DIR/backups"
log "Diretórios configurados"

# ==============================================================================
# 16. INICIALIZAÇÃO DO BANCO DE DADOS
# ==============================================================================

step "Inicializando banco de dados"
cd "$APP_DIR/backend"
if [ -f "setup-database.js" ]; then
    sudo -u codeseek NODE_ENV=production node setup-database.js
    log "Schema do banco de dados criado"
else
    warning "Script setup-database.js não encontrado"
fi

if [ -f "seed-database.js" ]; then
    sudo -u codeseek NODE_ENV=production node seed-database.js
    log "Dados iniciais inseridos"
else
    warning "Script seed-database.js não encontrado"
fi

# ==============================================================================
# 17. COMPILAÇÃO DO FRONTEND
# ==============================================================================

step "Compilando frontend"
if [ -d "$APP_DIR/frontend" ] && [ -f "$APP_DIR/frontend/package.json" ]; then
    cd "$APP_DIR/frontend"
    sudo -u codeseek npm install
    if grep -q "build" package.json; then
        sudo -u codeseek npm run build
    fi
    sudo -u codeseek npm prune --production
    log "Frontend compilado"
else
    info "Frontend não requer compilação ou não encontrado"
fi

# ==============================================================================
# 18. CONFIGURAÇÃO DO NGINX
# ==============================================================================

step "Configurando Nginx"
rm -f /etc/nginx/sites-enabled/default
cat > "/etc/nginx/sites-available/codeseek" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    location /static/ {
        alias $APP_DIR/frontend/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    location ~ /\. {
        deny all;
    }
    client_max_body_size 10M;
}
EOF
ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
if ! nginx -t; then
    error "Configuração do Nginx inválida"
    exit 1
fi
log "Configuração do Nginx válida"

# ==============================================================================
# 19. CONFIGURAÇÃO DO PM2
# ==============================================================================

step "Configurando PM2"
if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    su - codeseek -c "pm2 start $APP_DIR/ecosystem.config.js"
    # O comando de startup do PM2 pode ser interativo; redirecionando para /dev/null
    env PATH=$PATH:/usr/bin pm2 startup systemd -u codeseek --hp "/home/codeseek" | sudo -E bash -
    su - codeseek -c "pm2 save"
    log "PM2 configurado para iniciar com o sistema"
else
    error "Arquivo ecosystem.config.js não encontrado!"
    exit 1
fi

# ==============================================================================
# 20. CONFIGURAÇÃO DO FIREWALL
# ==============================================================================

step "Configurando firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configurado"

# ==============================================================================
# 21. CONFIGURAÇÃO SSL
# ==============================================================================

step "Configurando SSL"
systemctl reload nginx
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect; then
    log "Certificado SSL configurado para $DOMAIN"
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    log "Renovação automática do SSL configurada"
else
    warning "Falha na configuração do SSL - continuando sem HTTPS"
fi

# ==============================================================================
# 22. INICIALIZAÇÃO DOS SERVIÇOS
# ==============================================================================

step "Iniciando serviços"
su - codeseek -c "pm2 restart codeseek"
systemctl reload nginx
log "Todos os serviços iniciados"

# ==============================================================================
# 23. VERIFICAÇÃO FINAL
# ==============================================================================

step "Executando verificação final"
sleep 10
if ! curl -s --head http://localhost:3000 | head -n 1 | grep "HTTP/1.1 [23].." > /dev/null; then
    error "Aplicação não está respondendo corretamente na porta 3000"
    pm2 logs codeseek --lines 20
else
    log "Aplicação respondendo na porta 3000"
fi

# ==============================================================================
# 24. RELATÓRIO FINAL
# ==============================================================================

echo -e "\n${MAGENTA}"
echo "==============================================="
echo "    Instalação Concluída com Sucesso!"
echo "==============================================="
echo -e "${NC}\n"
echo -e "${GREEN}✓ CodeSeek V1 foi instalado e configurado com sucesso!${NC}\n"
echo -e "${CYAN}📋 Informações da Instalação:${NC}"
echo -e "   🌐 Domínio: ${BLUE}https://$DOMAIN${NC}"
echo -e "   📧 Email SSL: ${BLUE}$SSL_EMAIL${NC}"
echo -e "   🗄️  Banco de dados: ${BLUE}$DB_NAME${NC}"
echo -e "   👤 Usuário do banco: ${BLUE}$DB_USER${NC}"
echo -e "\n${CYAN}🔐 Credenciais Geradas (salvas em $APP_DIR/installation-info.txt):${NC}"
echo -e "   🗄️  Senha do banco: ${YELLOW}$DB_PASSWORD${NC}"
echo -e "\n${CYAN}🛠️  Comandos Úteis:${NC}"
echo -e "   Status da aplicação: ${BLUE}pm2 status codeseek${NC}"
echo -e "   Logs em tempo real: ${BLUE}pm2 logs codeseek${NC}"
echo -e "   Reiniciar aplicação: ${BLUE}sudo -u codeseek pm2 restart codeseek${NC}"
echo -e "\n${CYAN}🔧 Próximos Passos:${NC}"
echo -e "   1. Acesse ${BLUE}https://$DOMAIN${NC} para verificar se tudo está funcionando."
echo -e "   2. Configure as variáveis de email e pagamento em ${BLUE}$APP_DIR/backend/.env${NC} e reinicie com ${BLUE}pm2 restart codeseek${NC}."
echo -e "\n${GREEN}🎉 Instalação concluída! Sua aplicação CodeSeek está pronta para uso.${NC}\n"

cat > "$APP_DIR/installation-info.txt" << EOF
CodeSeek V1 - Informações da Instalação
========================================
Data: $(date)
Domínio: $DOMAIN
Email SSL: $SSL_EMAIL
Banco de dados: $DB_NAME
Usuário do banco: $DB_USER
Senha do banco: $DB_PASSWORD
Diretório: $APP_DIR
EOF

chown codeseek:codeseek "$APP_DIR/installation-info.txt"
chmod 600 "$APP_DIR/installation-info.txt"

info "💾 Informações da instalação salvas em: $APP_DIR/installation-info.txt"
