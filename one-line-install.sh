#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Instalação Automática Robusta (Versão Final Recomendada)
# ==============================================================================

set -euo pipefail

# --- Cores e Funções de Logging ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; BLUE='\033[0;34m'; MAGENTA='\033[0;35m'; CYAN='\033[0;36m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1" >&2; }
warning() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
step() { echo -e "\n${CYAN}[STEP]${NC} $1"; }
command_exists() { command -v "$1" >/dev/null 2>&1; }

# --- Validação de Parâmetros ---
if [ $# -lt 2 ]; then error "Uso: $0 <DOMAIN> <SSL_EMAIL> [DB_NAME] [DB_USER]"; exit 1; fi
DOMAIN="$1"; SSL_EMAIL="$2"; DB_NAME="${3:-codeseek_db}"; DB_USER="${4:-codeseek_user}"
if [ "$(id -u)" -ne 0 ]; then error "Este script deve ser executado como root (use sudo)"; exit 1; fi

# ==============================================================================
# INÍCIO DA INSTALAÇÃO
# ==============================================================================
echo -e "${MAGENTA}===============================================\n    CodeSeek V1 - Instalação Automática\n===============================================${NC}"
info "Domínio: $DOMAIN, Email SSL: $SSL_EMAIL"
sleep 5

# --- 1. ATUALIZAÇÃO E DEPENDÊNCIAS ---
step "Atualizando sistema e instalando dependências"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git build-essential software-properties-common apt-transport-https ca-certificates gnupg unzip ufw
log "Sistema e dependências básicas prontos."

# --- 2. INSTALAÇÃO DO NODE.JS E PM2 ---
step "Instalando Node.js 18.x e PM2"
if ! command_exists node || ! command_exists npm || [[ "$(node --version 2>/dev/null)" != v18* ]]; then
    info "Instalando/Reinstalando Node.js..."
    apt-get purge -y nodejs npm >/dev/null 2>&1 && apt-get autoremove -y >/dev/null 2>&1
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >/dev/null
    apt-get install -y nodejs
fi
npm install -g pm2
log "Node.js $(node --version) e PM2 $(pm2 -v) instalados."

# --- 3. INSTALAÇÃO DOS SERVIÇOS ---
step "Instalando PostgreSQL, Redis e Nginx"
apt-get install -y -qq postgresql redis-server nginx certbot python3-certbot-nginx
systemctl enable --now postgresql redis-server nginx
log "Serviços de banco de dados e web instalados e ativados."

# --- 4. CONFIGURAÇÃO DA APLICAÇÃO ---
step "Configurando usuário, diretório e código-fonte"
APP_DIR="/opt/codeseek"
if ! id "codeseek" &>/dev/null; then useradd -r -s /bin/bash -d $APP_DIR -m codeseek; fi
rm -rf "$APP_DIR" && mkdir -p "$APP_DIR" && chown codeseek:codeseek "$APP_DIR"
sudo -u codeseek git clone "https://github.com/WesleyMarinho/codeseek.git" "$APP_DIR"
log "Aplicação clonada em $APP_DIR."

step "Instalando dependências e compilando frontend"
cd "$APP_DIR/backend" && sudo -u codeseek npm install --production
cd "$APP_DIR/frontend" && sudo -u codeseek npm install && sudo -u codeseek npm run build
log "Dependências instaladas e frontend compilado."

# --- 5. CONFIGURAÇÃO DE AMBIENTE E BANCO DE DADOS ---
step "Configurando variáveis de ambiente e banco de dados"
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
SESSION_SECRET=$(openssl rand -base64 32)
cat > "$APP_DIR/backend/.env" << EOF
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
APP_URL=https://$DOMAIN
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
SESSION_SECRET=$SESSION_SECRET
EOF
chown codeseek:codeseek "$APP_DIR/backend/.env" && chmod 600 "$APP_DIR/backend/.env"
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
cd "$APP_DIR/backend" && sudo -u codeseek node setup-database.js && sudo -u codeseek node seed-database.js
log "Banco de dados e .env configurados."

# --- 6. CONFIGURAÇÃO DO PM2 (VERSÃO ROBUSTA) ---
step "Configurando PM2 para inicialização automática"
LOG_DIR="/var/log/codeseek"
mkdir -p "$LOG_DIR" && chown codeseek:codeseek "$LOG_DIR"
cd "$APP_DIR"
# Inicia a aplicação primeiro
info "Iniciando a aplicação com PM2..."
sudo -u codeseek pm2 start ecosystem.config.js
# Aguarda 5 segundos para garantir que os processos estejam estáveis
info "Aguardando estabilização dos processos..."
sleep 5
# Salva a lista de processos para garantir que ela sobreviva a reinicializações
info "Salvando a lista de processos do PM2..."
sudo -u codeseek pm2 save
# Gera e executa o script de inicialização do sistema de forma limpa
info "Configurando o serviço de boot do PM2..."
pm2 startup systemd -u codeseek --hp /home/codeseek | sudo -E bash -
log "PM2 configurado para gerenciar a aplicação."

# --- 7. CONFIGURAÇÃO DO NGINX, FIREWALL E SSL ---
step "Configurando Nginx, Firewall e SSL"
rm -f /etc/nginx/sites-enabled/default
cat > "/etc/nginx/sites-available/codeseek" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
ufw --force reset &>/dev/null; ufw allow ssh &>/dev/null; ufw allow http &>/dev/null; ufw allow https &>/dev/null; ufw --force enable &>/dev/null
nginx -t && systemctl reload nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect
log "Nginx, Firewall e SSL configurados."

# --- 8. FINALIZAÇÃO ---
echo -e "\n${MAGENTA}===============================================\n    Instalação Concluída com Sucesso!\n===============================================${NC}\n"
echo -e "${GREEN}✓ Aplicação CodeSeek está online e configurada.${NC}"
echo -e "   🌐 Acesse em: ${BLUE}https://$DOMAIN${NC}"
echo -e "   🛠️  Verifique o status com: ${BLUE}pm2 status${NC}"
