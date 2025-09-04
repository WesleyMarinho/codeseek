#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Instalação Automática em Uma Linha (Versão Completa e Corrigida)
# ==============================================================================
#
# Este script automatiza completamente a instalação do CodeSeek V1,
# incluindo correções para problemas comuns de dependência (Node.js/npm)
# e permissões de diretório (PM2 logs).
#
# Uso:
#   curl -fsSL https://URL_PARA_ESTE_SCRIPT/install.sh | sudo bash -s -- yourdomain.com admin@yourdomain.com
#
# Ou localmente:
#   sudo bash install.sh yourdomain.com admin@yourdomain.com [db_name] [db_user]
#
# Parâmetros:
#   $1 - DOMAIN (obrigatório): Domínio da aplicação (ex: codeseek.com)
#   $2 - SSL_EMAIL (obrigatório): Email para certificado SSL
#   $3 - DB_NAME (opcional): Nome do banco de dados (padrão: codeseek_db)
#   $4 - DB_USER (opcional): Usuário do banco de dados (padrão: codeseek_user)
#
# ==============================================================================

set -euo pipefail # Exit on error, undefined vars, pipe failures

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
    curl wget git build-essential software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release \
    unzip openssl ufw fail2ban
log "Dependências básicas instaladas"

# ==============================================================================
# 3. INSTALAÇÃO DO NODE.JS (LÓGICA CORRIGIDA)
# ==============================================================================

step "Verificando e instalando Node.js 18.x"
if ! command_exists node || ! command_exists npm || [[ "$(node --version 2>/dev/null)" != v18* ]]; then
    info "Node.js/npm não encontrado ou em estado inconsistente. Realizando instalação/reinstalação completa."
    
    warning "Removendo versões anteriores do Node.js e npm..."
    apt-get purge -y nodejs npm >/dev/null 2>&1
    apt-get autoremove -y >/dev/null 2>&1
    rm -f /etc/apt/sources.list.d/nodesource.list

    info "Adicionando repositório NodeSource e instalando Node.js v18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs

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
# 5. INSTALAÇÃO DOS SERVIÇOS (PostgreSQL, Redis, Nginx, Certbot)
# ==============================================================================

step "Instalando serviços: PostgreSQL, Redis, Nginx, Certbot"
apt-get install -y -qq postgresql postgresql-contrib redis-server nginx certbot python3-certbot-nginx

systemctl start postgresql && systemctl enable postgresql
wait_for_service postgresql

systemctl start redis-server && systemctl enable redis-server
wait_for_service redis-server

systemctl start nginx && systemctl enable nginx
wait_for_service nginx

log "Serviços instalados e habilitados"

# ==============================================================================
# 6. CONFIGURAÇÃO DO USUÁRIO E DIRETÓRIO DA APLICAÇÃO
# ==============================================================================

step "Configurando usuário e diretório da aplicação"
APP_DIR="/opt/codeseek"

if ! id "codeseek" &>/dev/null; then
    useradd -r -s /bin/bash -d $APP_DIR -m codeseek
    log "Usuário 'codeseek' criado"
else
    log "Usuário 'codeseek' já existe"
fi

if [ -d "$APP_DIR" ]; then
    warning "Diretório de aplicação existente detectado. Fazendo backup..."
    mv "$APP_DIR" "/tmp/codeseek-old-$(date +%Y%m%d-%H%M%S)"
fi
mkdir -p "$APP_DIR"
chown codeseek:codeseek "$APP_DIR"
log "Diretório da aplicação configurado em $APP_DIR"

# ==============================================================================
# 7. CLONAGEM DO REPOSITÓRIO
# ==============================================================================

step "Clonando repositório"
REPO_URL="https://github.com/WesleyMarinho/codeseek.git"
info "Clonando de: $REPO_URL"
sudo -u codeseek git clone "$REPO_URL" "$APP_DIR"
log "Código fonte obtido"

# ==============================================================================
# 8. INSTALAÇÃO DE DEPENDÊNCIAS DO BACKEND
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
# 9. CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ==============================================================================

step "Configurando variáveis de ambiente"
DB_PASSWORD=$(generate_password)
SESSION_SECRET=$(generate_password)
JWT_SECRET=$(generate_password)

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
# Application Configuration
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
APP_URL=https://$DOMAIN
# Security
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET
# SSL Configuration
SSL_EMAIL=$SSL_EMAIL
# Paths and Logs
UPLOAD_DIR=/opt/codeseek/uploads
LOG_FILE=/opt/codeseek/logs/app.log
EOF
chown codeseek:codeseek "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"
log "Arquivo .env configurado com credenciais seguras"

# ==============================================================================
# 10. CONFIGURAÇÃO DO POSTGRESQL
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
# 11. CONFIGURAÇÃO DE DIRETÓRIOS (COM CORREÇÃO PARA PM2)
# ==============================================================================

step "Configurando diretórios da aplicação e de logs"
mkdir -p "$APP_DIR/uploads" "$APP_DIR/logs"
chown -R codeseek:codeseek "$APP_DIR"
chmod 750 "$APP_DIR/uploads" "$APP_DIR/logs"

# CORREÇÃO: Cria o diretório de log para o PM2 e define as permissões corretas
info "Criando diretório de log para PM2 em /var/log/codeseek"
mkdir -p /var/log/codeseek
chown codeseek:codeseek /var/log/codeseek
log "Diretórios configurados com sucesso"

# ==============================================================================
# 12. INICIALIZAÇÃO DO BANCO DE DADOS
# ==============================================================================

step "Inicializando banco de dados"
cd "$APP_DIR/backend"
sudo -u codeseek NODE_ENV=production node setup-database.js
log "Schema do banco de dados criado"
sudo -u codeseek NODE_ENV=production node seed-database.js
log "Dados iniciais inseridos"

# ==============================================================================
# 13. COMPILAÇÃO DO FRONTEND
# ==============================================================================

step "Compilando frontend"
cd "$APP_DIR/frontend"
sudo -u codeseek npm install
sudo -u codeseek npm run build
sudo -u codeseek npm prune --production
log "Frontend compilado"

# ==============================================================================
# 14. CONFIGURAÇÃO DO NGINX
# ==============================================================================

step "Configurando Nginx"
rm -f /etc/nginx/sites-enabled/default
cat > "/etc/nginx/sites-available/codeseek" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 10M;

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
ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
if ! nginx -t; then
    error "Configuração do Nginx inválida"
    exit 1
fi
log "Configuração do Nginx válida"

# ==============================================================================
# 15. CONFIGURAÇÃO DO PM2
# ==============================================================================

step "Configurando PM2"
cd "$APP_DIR"
# Inicia a aplicação como usuário 'codeseek'
su - codeseek -c "pm2 start ecosystem.config.js"
# Gera o comando de startup
pm2 startup systemd -u codeseek --hp /home/codeseek | sudo -E bash -
# Salva a configuração de processos
su - codeseek -c "pm2 save"
log "PM2 configurado para iniciar com o sistema"

# ==============================================================================
# 16. CONFIGURAÇÃO DO FIREWALL
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
# 17. CONFIGURAÇÃO SSL
# ==============================================================================

step "Configurando SSL com Certbot"
systemctl reload nginx
if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect; then
    log "Certificado SSL configurado com sucesso para $DOMAIN"
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    log "Renovação automática do SSL configurada"
else
    warning "Falha na configuração automática do SSL. Será necessário configurar manualmente."
fi

# ==============================================================================
# 18. FINALIZAÇÃO
# ==============================================================================

step "Finalizando e reiniciando serviços"
su - codeseek -c "pm2 restart codeseek"
systemctl reload nginx
log "Serviços reiniciados"

# ==============================================================================
# 19. RELATÓRIO FINAL
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
echo -e "   1. Acesse ${BLUE}https://$DOMAIN${NC} para verificar se a aplicação está funcionando."
echo -e "   2. Configure as variáveis de email e pagamento em ${BLUE}$APP_DIR/backend/.env${NC} e reinicie com ${BLUE}pm2 restart codeseek${NC}."
echo -e "\n${GREEN}🎉 Instalação concluída! Sua aplicação CodeSeek está pronta para uso.${NC}\n"

cat > "$APP_DIR/installation-info.txt" << EOF
CodeSeek V1 - Informações da Instalação
========================================
Data da instalação: $(date)
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
