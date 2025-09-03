#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Instalação Automática em Uma Linha
# ==============================================================================
#
# Este script automatiza completamente a instalação do CodeSeek V1
# sem necessidade de intervenção manual.
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/one-line-install.sh | sudo bash -s -- yourdomain.com admin@yourdomain.com
#
# Ou localmente:
#   sudo bash one-line-install.sh yourdomain.com admin@yourdomain.com [db_name] [db_user]
#
# Parâmetros:
#   $1 - DOMAIN (obrigatório): Domínio da aplicação (ex: codeseek.com)
#   $2 - SSL_EMAIL (obrigatório): Email para certificado SSL
#   $3 - DB_NAME (opcional): Nome do banco de dados (padrão: codeseek_db)
#   $4 - DB_USER (opcional): Usuário do banco de dados (padrão: codeseek_user)
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
    if ! ping -c 1 google.com &> /dev/null; then
        error "Sem conectividade com a internet"
        exit 1
    fi
}

# --- Função para backup de configurações existentes ---
backup_existing_configs() {
    local backup_dir="/tmp/codeseek-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup de configurações existentes
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

# Parâmetros obrigatórios
DOMAIN="$1"
SSL_EMAIL="$2"

# Parâmetros opcionais com valores padrão
DB_NAME="${3:-codeseek_db}"
DB_USER="${4:-codeseek_user}"

# Validação de domínio
if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    error "Domínio inválido: $DOMAIN"
    exit 1
fi

# Validação de email
if [[ ! "$SSL_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    error "Email inválido: $SSL_EMAIL"
    exit 1
fi

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (use sudo)"
    exit 1
fi

# Verificar sistema operacional
if [ ! -f /etc/debian_version ]; then
    error "Este script é compatível apenas com sistemas Debian/Ubuntu"
    exit 1
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

# Verificar conectividade
step "Verificando conectividade"
check_connectivity
log "Conectividade OK"

# Backup de configurações existentes
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
# 3. INSTALAÇÃO DO NODE.JS
# ==============================================================================

step "Instalando Node.js 18.x"
if ! command_exists node || [[ "$(node --version)" != v18* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verificar instalação
    if ! command_exists node || ! command_exists npm; then
        error "Falha na instalação do Node.js"
        exit 1
    fi
    
    log "Node.js $(node --version) instalado"
    log "npm $(npm --version) instalado"
else
    log "Node.js já está instalado: $(node --version)"
fi

# ==============================================================================
# 4. INSTALAÇÃO DO POSTGRESQL
# ==============================================================================

step "Instalando PostgreSQL"
if ! command_exists psql; then
    apt-get install -y postgresql postgresql-contrib
    
    # Iniciar e habilitar PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    wait_for_service postgresql
else
    log "PostgreSQL já está instalado"
    systemctl start postgresql || true
fi

# ==============================================================================
# 5. INSTALAÇÃO DO REDIS
# ==============================================================================

step "Instalando Redis"
if ! command_exists redis-server; then
    apt-get install -y redis-server
    
    # Configurar Redis para iniciar automaticamente
    systemctl start redis-server
    systemctl enable redis-server
    
    wait_for_service redis-server
else
    log "Redis já está instalado"
    systemctl start redis-server || true
fi

# ==============================================================================
# 6. INSTALAÇÃO DO NGINX
# ==============================================================================

step "Instalando Nginx"
if ! command_exists nginx; then
    apt-get install -y nginx
    
    # Iniciar e habilitar Nginx
    systemctl start nginx
    systemctl enable nginx
    
    wait_for_service nginx
else
    log "Nginx já está instalado"
    systemctl start nginx || true
fi

# ==============================================================================
# 7. INSTALAÇÃO DO CERTBOT
# ==============================================================================

step "Instalando Certbot"
if ! command_exists certbot; then
    apt-get install -y certbot python3-certbot-nginx
    log "Certbot instalado"
else
    log "Certbot já está instalado"
fi

# ==============================================================================
# 8. CONFIGURAÇÃO DO USUÁRIO DA APLICAÇÃO
# ==============================================================================

step "Configurando usuário da aplicação"
if ! id "codeseek" &>/dev/null; then
    useradd -r -s /bin/bash -d /opt/codeseek -m codeseek
    log "Usuário 'codeseek' criado"
else
    log "Usuário 'codeseek' já existe"
fi

# ==============================================================================
# 9. CONFIGURAÇÃO DO DIRETÓRIO DA APLICAÇÃO
# ==============================================================================

step "Configurando diretório da aplicação"
APP_DIR="/opt/codeseek"

# Remover instalação anterior se existir
if [ -d "$APP_DIR/.git" ]; then
    warning "Instalação anterior detectada, fazendo backup..."
    mv "$APP_DIR" "/tmp/codeseek-old-$(date +%Y%m%d-%H%M%S)"
fi

# Criar diretório se não existir
mkdir -p "$APP_DIR"
chown codeseek:codeseek "$APP_DIR"

# ==============================================================================
# 10. CLONAGEM DO REPOSITÓRIO
# ==============================================================================

step "Clonando repositório"
cd "$APP_DIR"

# Detectar URL do repositório (assumindo que está no mesmo diretório)
if [ -f "/tmp/repo_url.txt" ]; then
    REPO_URL=$(cat /tmp/repo_url.txt)
elif [ -d "$(dirname "$0")/.git" ]; then
    REPO_URL=$(cd "$(dirname "$0")" && git config --get remote.origin.url 2>/dev/null || echo "")
else
    # URL padrão - ajuste conforme necessário
    REPO_URL="https://github.com/WesleyMarinho/codeseek.git"
fi

if [ -n "$REPO_URL" ]; then
    info "Clonando de: $REPO_URL"
    # Verificar se o diretório está vazio antes do clone
    if [ "$(ls -A $APP_DIR 2>/dev/null)" ]; then
        warning "Diretório não está vazio, removendo conteúdo anterior..."
        rm -rf "$APP_DIR"/*
        rm -rf "$APP_DIR"/.[!.]* 2>/dev/null || true
    fi
    sudo -u codeseek git clone "$REPO_URL" .
else
    warning "URL do repositório não detectada, copiando arquivos locais..."
    # Copiar arquivos do diretório atual
    cp -r "$(dirname "$0")"/* .
    chown -R codeseek:codeseek .
fi

log "Código fonte obtido"

# ==============================================================================
# 11. INSTALAÇÃO DE DEPENDÊNCIAS DO BACKEND
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
# 12. CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ==============================================================================

step "Configurando variáveis de ambiente"

# Gerar senhas seguras
DB_PASSWORD=$(generate_password)
SESSION_SECRET=$(generate_password)
JWT_SECRET=$(generate_password)
ENCRYPTION_KEY=$(generate_password)

# Criar arquivo .env
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

# Definir permissões seguras
chown codeseek:codeseek "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"

log "Arquivo .env configurado"

# ==============================================================================
# 13. CONFIGURAÇÃO DO POSTGRESQL
# ==============================================================================

step "Configurando PostgreSQL"

# Criar usuário do banco de dados
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    log "Usuário '$DB_USER' criado no PostgreSQL"
else
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    log "Senha do usuário '$DB_USER' atualizada"
fi

# Criar banco de dados
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    log "Banco de dados '$DB_NAME' criado"
else
    log "Banco de dados '$DB_NAME' já existe"
fi

# Conceder privilégios
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
log "Privilégios concedidos ao usuário '$DB_USER'"

# ==============================================================================
# 14. CONFIGURAÇÃO DE DIRETÓRIOS
# ==============================================================================

step "Configurando diretórios"

# Criar diretórios necessários
mkdir -p "$APP_DIR/uploads"
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/backups"

# Definir permissões
chown -R codeseek:codeseek "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod 700 "$APP_DIR/uploads"
chmod 700 "$APP_DIR/logs"
chmod 700 "$APP_DIR/backups"

log "Diretórios configurados"

# ==============================================================================
# 15. INICIALIZAÇÃO DO BANCO DE DADOS
# ==============================================================================

step "Inicializando banco de dados"
cd "$APP_DIR/backend"

# Executar setup do banco
if [ -f "setup-database.js" ]; then
    sudo -u codeseek NODE_ENV=production node setup-database.js
    log "Schema do banco de dados criado"
else
    warning "Script setup-database.js não encontrado"
fi

# Executar seeds se existir
if [ -f "seed-database.js" ]; then
    sudo -u codeseek NODE_ENV=production node seed-database.js
    log "Dados iniciais inseridos"
else
    warning "Script seed-database.js não encontrado"
fi

# ==============================================================================
# 16. COMPILAÇÃO DO FRONTEND
# ==============================================================================

step "Compilando frontend"
cd "$APP_DIR"

# Verificar se existe frontend para compilar
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    cd "frontend"
    
    # Instalar dependências de desenvolvimento
    sudo -u codeseek npm install
    
    # Compilar assets
    if grep -q "build" package.json; then
        sudo -u codeseek npm run build
    elif grep -q "compile" package.json; then
        sudo -u codeseek npm run compile
    fi
    
    # Remover dependências de desenvolvimento
    sudo -u codeseek npm prune --production
    
    log "Frontend compilado"
else
    info "Frontend não requer compilação ou não encontrado"
fi

# ==============================================================================
# 17. CONFIGURAÇÃO DO NGINX
# ==============================================================================

step "Configurando Nginx"

# Remover configuração padrão
rm -f /etc/nginx/sites-enabled/default

# Criar configuração do CodeSeek
cat > "/etc/nginx/sites-available/codeseek" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files
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
    
    # Main application
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
    
    # File upload size
    client_max_body_size 10M;
}
EOF

# Habilitar site
ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/

# Testar configuração
if nginx -t; then
    log "Configuração do Nginx válida"
else
    error "Configuração do Nginx inválida"
    exit 1
fi

# ==============================================================================
# 18. CONFIGURAÇÃO DO SERVIÇO SYSTEMD
# ==============================================================================

step "Configurando serviço systemd"

cat > "/etc/systemd/system/codeseek.service" << EOF
[Unit]
Description=CodeSeek Application
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
User=codeseek
Group=codeseek
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/backend/.env

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=codeseek

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd e habilitar serviço
systemctl daemon-reload
systemctl enable codeseek.service

log "Serviço systemd configurado"

# ==============================================================================
# 19. CONFIGURAÇÃO DO FIREWALL
# ==============================================================================

step "Configurando firewall"

# Configurar UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH
ufw allow ssh

# Permitir HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
ufw --force enable

log "Firewall configurado"

# ==============================================================================
# 20. CONFIGURAÇÃO SSL
# ==============================================================================

step "Configurando SSL"

# Recarregar Nginx antes do SSL
systemctl reload nginx

# Obter certificado SSL
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect; then
    log "Certificado SSL configurado para $DOMAIN"
    
    # Configurar renovação automática
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    log "Renovação automática do SSL configurada"
else
    warning "Falha na configuração do SSL - continuando sem HTTPS"
    warning "Você pode configurar o SSL manualmente depois com: certbot --nginx -d $DOMAIN"
fi

# ==============================================================================
# 21. INICIALIZAÇÃO DOS SERVIÇOS
# ==============================================================================

step "Iniciando serviços"

# Iniciar aplicação
systemctl start codeseek.service
wait_for_service codeseek.service

# Recarregar Nginx
systemctl reload nginx

log "Todos os serviços iniciados"

# ==============================================================================
# 22. VERIFICAÇÃO FINAL
# ==============================================================================

step "Executando verificação final"

# Aguardar aplicação inicializar
sleep 10

# Testar conectividade local
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    log "Aplicação respondendo na porta 3000"
else
    error "Aplicação não está respondendo na porta 3000"
fi

# Testar Nginx
if curl -f http://localhost >/dev/null 2>&1; then
    log "Nginx respondendo na porta 80"
else
    warning "Nginx não está respondendo na porta 80"
fi

# Executar diagnóstico se disponível
if [ -f "$APP_DIR/backend/diagnose.js" ]; then
    cd "$APP_DIR/backend"
    sudo -u codeseek node diagnose.js
fi

# ==============================================================================
# 23. RELATÓRIO FINAL
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
echo -e "   📁 Diretório: ${BLUE}$APP_DIR${NC}"
echo -e "   👤 Usuário da aplicação: ${BLUE}codeseek${NC}"

echo -e "\n${CYAN}🔐 Credenciais Geradas:${NC}"
echo -e "   🗄️  Senha do banco: ${YELLOW}$DB_PASSWORD${NC}"
echo -e "   🔑 Session Secret: ${YELLOW}$SESSION_SECRET${NC}"
echo -e "   🔑 JWT Secret: ${YELLOW}$JWT_SECRET${NC}"
echo -e "   🔑 Encryption Key: ${YELLOW}$ENCRYPTION_KEY${NC}"

echo -e "\n${CYAN}📝 Arquivos Importantes:${NC}"
echo -e "   ⚙️  Configuração: ${BLUE}$APP_DIR/backend/.env${NC}"
echo -e "   📋 Logs da aplicação: ${BLUE}$APP_DIR/logs/app.log${NC}"
echo -e "   📋 Logs do sistema: ${BLUE}journalctl -u codeseek.service${NC}"
echo -e "   🌐 Configuração Nginx: ${BLUE}/etc/nginx/sites-available/codeseek${NC}"

echo -e "\n${CYAN}🛠️  Comandos Úteis:${NC}"
echo -e "   Status dos serviços: ${BLUE}sudo systemctl status codeseek nginx postgresql redis-server${NC}"
echo -e "   Logs em tempo real: ${BLUE}sudo journalctl -u codeseek.service -f${NC}"
echo -e "   Reiniciar aplicação: ${BLUE}sudo systemctl restart codeseek${NC}"
echo -e "   Verificar configuração: ${BLUE}sudo bash $APP_DIR/post-install-check.sh${NC}"
echo -e "   Troubleshooting: ${BLUE}sudo bash $APP_DIR/troubleshoot.sh${NC}"

echo -e "\n${CYAN}🔧 Próximos Passos:${NC}"
echo -e "   1. Acesse ${BLUE}https://$DOMAIN${NC} para verificar se tudo está funcionando"
echo -e "   2. Configure as variáveis de email e pagamento em ${BLUE}$APP_DIR/backend/.env${NC}"
echo -e "   3. Personalize a aplicação conforme suas necessidades"
echo -e "   4. Configure backups regulares do banco de dados"
echo -e "   5. Monitore os logs regularmente"

echo -e "\n${GREEN}🎉 Instalação concluída! Sua aplicação CodeSeek está pronta para uso.${NC}\n"

# Salvar informações da instalação
cat > "$APP_DIR/installation-info.txt" << EOF
CodeSeek V1 - Informações da Instalação
========================================

Data da instalação: $(date)
Domínio: $DOMAIN
Email SSL: $SSL_EMAIL
Banco de dados: $DB_NAME
Usuário do banco: $DB_USER
Senha do banco: $DB_PASSWORD

Diretório da aplicação: $APP_DIR
Usuário da aplicação: codeseek

Arquivos importantes:
- Configuração: $APP_DIR/backend/.env
- Logs: $APP_DIR/logs/app.log
- Configuração Nginx: /etc/nginx/sites-available/codeseek
- Serviço systemd: /etc/systemd/system/codeseek.service

Comandos úteis:
- Status: sudo systemctl status codeseek
- Logs: sudo journalctl -u codeseek.service -f
- Reiniciar: sudo systemctl restart codeseek
- Verificação: sudo bash $APP_DIR/post-install-check.sh
- Troubleshooting: sudo bash $APP_DIR/troubleshoot.sh
EOF

chown codeseek:codeseek "$APP_DIR/installation-info.txt"
chmod 600 "$APP_DIR/installation-info.txt"

echo -e "${INFO}💾 Informações da instalação salvas em: $APP_DIR/installation-info.txt${NC}\n"