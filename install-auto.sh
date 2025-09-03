#!/bin/bash

# ==============================================================================
# Script de instalação AUTOMÁTICA do CodeSeek em ambiente de produção
# ==============================================================================
#
# Este script executa a instalação e configuração completa da aplicação CodeSeek
# de forma 100% automática, sem intervenção manual.
#
# Uso: sudo bash install-auto.sh [DOMAIN] [SSL_EMAIL] [DB_NAME] [DB_USER]
#
# Exemplos:
#   sudo bash install-auto.sh codeseek.exemplo.com admin@exemplo.com
#   sudo bash install-auto.sh localhost "" codeseek_dev dev_user
#
# Parâmetros:
#   DOMAIN    - Domínio da aplicação (obrigatório)
#   SSL_EMAIL - Email para Let's Encrypt (opcional, se vazio = sem SSL)
#   DB_NAME   - Nome do banco de dados (padrão: codeseek_prod)
#   DB_USER   - Usuário do banco (padrão: codeseek_user)
#
# ==============================================================================

# --- Cores para output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Funções de Logging ---
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# --- Verificação de Root ---
if [ "$(id -u)" -ne 0 ]; then
    error "Este script precisa ser executado como root. Use: sudo bash $0"
fi

# ==============================================================================
# 1. CONFIGURAÇÃO AUTOMÁTICA DE PARÂMETROS
# ==============================================================================

# Parâmetros da linha de comando
DOMAIN="$1"
SSL_EMAIL="$2"
DB_NAME="${3:-codeseek_prod}"
DB_USER="${4:-codeseek_user}"

# Validação do domínio (obrigatório)
if [[ -z "$DOMAIN" ]]; then
    error "Domínio é obrigatório. Uso: sudo bash $0 <DOMAIN> [SSL_EMAIL] [DB_NAME] [DB_USER]"
fi

# Configuração de SSL
if [[ -n "$SSL_EMAIL" ]]; then
    SETUP_SSL="s"
    APP_URL="https://$DOMAIN"
    log "SSL será configurado com o email: $SSL_EMAIL"
else
    SETUP_SSL="n"
    APP_URL="http://$DOMAIN"
    warning "Instalação prosseguirá sem HTTPS"
fi

# --- Configurações Fixas ---
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
GIT_REPO="https://github.com/WesleyMarinho/codeseek.git"

# --- Resumo da Configuração ---
echo -e "\n${YELLOW}================== CONFIGURAÇÃO AUTOMÁTICA ==================${NC}"
echo -e "Domínio da Aplicação:   ${GREEN}$DOMAIN${NC}"
echo -e "URL Final:              ${GREEN}$APP_URL${NC}"
echo -e "Usuário do Sistema:     ${GREEN}$APP_USER${NC}"
echo -e "Diretório da Aplicação: ${GREEN}$APP_DIR${NC}"
echo -e "Nome do Banco de Dados: ${GREEN}$DB_NAME${NC}"
echo -e "Usuário do Banco:       ${GREEN}$DB_USER${NC}"
if [[ "$SETUP_SSL" =~ ^[Ss]$ ]]; then
    echo -e "Configurar SSL:         ${GREEN}Sim (email: $SSL_EMAIL)${NC}"
else
    echo -e "Configurar SSL:         ${RED}Não${NC}"
fi
echo -e "${YELLOW}============================================================${NC}\n"

log "Iniciando instalação automática em 5 segundos..."
sleep 5

# ==============================================================================
# 2. EXECUÇÃO AUTOMÁTICA DA INSTALAÇÃO
# ==============================================================================

# 1. Atualizar o sistema
log "Atualizando o sistema..."
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y || error "Falha ao atualizar o sistema"

# 2. Instalar dependências
log "Instalando dependências..."
DEPS="git curl wget nginx postgresql postgresql-contrib redis-server build-essential python3 python3-pip software-properties-common"
if [[ "$SETUP_SSL" =~ ^[Ss]$ ]]; then
    DEPS="$DEPS certbot python3-certbot-nginx"
fi
apt install -y $DEPS || error "Falha ao instalar dependências"

# 3. Instalar Node.js 18.x
log "Instalando Node.js 18.x..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -ne 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - || error "Falha ao configurar repositório do Node.js"
    apt-get install -y nodejs || error "Falha ao instalar Node.js"
else
    log "Node.js v18.x ou superior já está instalado."
fi
log "Versões instaladas: Node.js $(node -v), npm $(npm -v)"

# 4. Instalar PM2
log "Instalando PM2..."
npm install -g pm2 || error "Falha ao instalar PM2"
log "PM2 $(pm2 -v) instalado"

# 5. Criar usuário para a aplicação
log "Criando usuário do sistema '$APP_USER'..."
if ! id -u $APP_USER &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER || error "Falha ao criar usuário $APP_USER"
else
    log "Usuário '$APP_USER' já existe."
fi

# 6. Criar diretório da aplicação
log "Criando diretório da aplicação em '$APP_DIR'..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# 7. Clonar o repositório
log "Clonando o repositório..."
if [ -d "$APP_DIR/.git" ]; then
    warning "O diretório '$APP_DIR' já contém um repositório git. Atualizando..."
    cd $APP_DIR
    sudo -u $APP_USER git fetch origin
    sudo -u $APP_USER git reset --hard origin/main
else
    sudo -u $APP_USER git clone $GIT_REPO $APP_DIR || error "Falha ao clonar o repositório"
fi
chown -R $APP_USER:$APP_USER $APP_DIR

# 8. Instalar dependências do backend
log "Instalando dependências do backend (npm install)..."
cd $APP_DIR/backend
sudo -u $APP_USER npm install --production || error "Falha ao instalar dependências do backend"

# 9. Configurar variáveis de ambiente (.env)
log "Configurando variáveis de ambiente (.env)..."
ENV_FILE="$APP_DIR/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    cp "$APP_DIR/backend/.env.example" "$ENV_FILE"

    # Gerar senhas e segredos
    DB_PASSWORD=$(openssl rand -hex 16)
    SESSION_SECRET=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)

    # Atualizar variáveis no arquivo .env
    sed -i "s/PORT=3000/PORT=3000/" "$ENV_FILE"
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" "$ENV_FILE"
    sed -i "s/DB_HOST=localhost/DB_HOST=localhost/" "$ENV_FILE"
    sed -i "s/DB_NAME=codeseek_db/DB_NAME=$DB_NAME/" "$ENV_FILE"
    sed -i "s/DB_USER=postgres/DB_USER=$DB_USER/" "$ENV_FILE"
    sed -i "s/DB_PASSWORD=sua_senha_aqui/DB_PASSWORD=$DB_PASSWORD/" "$ENV_FILE"
    sed -i "s/REDIS_HOST=localhost/REDIS_HOST=localhost/" "$ENV_FILE"
    sed -i "s/SESSION_SECRET=sua_chave_secreta_muito_forte_aqui/SESSION_SECRET=$SESSION_SECRET/" "$ENV_FILE"
    sed -i "s|BASE_URL=http://localhost:3000|BASE_URL=$APP_URL|" "$ENV_FILE"
    
    # Adicionar JWT_SECRET se não existir
    if ! grep -q "JWT_SECRET" "$ENV_FILE"; then
        echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
    fi

    chown $APP_USER:$APP_USER "$ENV_FILE"
    chmod 600 "$ENV_FILE" # Permissões restritas para o arquivo .env
    log "Arquivo .env criado e configurado"
else
    warning "Arquivo .env já existe. Carregando configurações existentes..."
fi
DB_PASSWORD=$(grep DB_PASSWORD $ENV_FILE | cut -d '=' -f2) # Carrega a senha para usar abaixo

# 10. Configurar banco de dados PostgreSQL
log "Configurando banco de dados PostgreSQL..."
# Iniciar PostgreSQL se não estiver rodando
systemctl enable --now postgresql || error "Falha ao iniciar PostgreSQL"

# Aguardar PostgreSQL estar pronto
log "Aguardando PostgreSQL estar pronto..."
for i in {1..30}; do
    if sudo -u postgres psql -c "SELECT 1" &>/dev/null; then
        break
    fi
    sleep 1
done

# Verificar se o usuário existe
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    warning "Usuário do banco '$DB_USER' já existe."
else
    log "Criando usuário do banco '$DB_USER'..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || error "Falha ao criar usuário do banco."
fi

# Verificar se o banco de dados existe
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    warning "Banco de dados '$DB_NAME' já existe."
else
    log "Criando banco de dados '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || error "Falha ao criar banco de dados."
fi
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 11. Configurar Redis
log "Configurando Redis..."
systemctl enable --now redis-server || error "Falha ao iniciar ou habilitar o Redis"

# 12. Configurar Nginx
log "Configurando Nginx para o domínio $DOMAIN..."
NGINX_CONF="/etc/nginx/sites-available/codeseek"
cp $APP_DIR/nginx.conf $NGINX_CONF
sed -i "s/your_domain.com/$DOMAIN/g" $NGINX_CONF
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t || error "Configuração do Nginx inválida. Verifique o arquivo $NGINX_CONF"
systemctl restart nginx

# 13. Configurar SSL com Certbot (se selecionado)
if [[ "$SETUP_SSL" =~ ^[Ss]$ ]]; then
    log "Configurando certificado SSL com Certbot..."
    # Aguardar Nginx estar pronto
    sleep 3
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect || {
        warning "Falha ao gerar o certificado SSL. Continuando sem SSL..."
        warning "Verifique se o DNS do seu domínio aponta para este servidor."
        APP_URL="http://$DOMAIN"
    }
    if [[ $? -eq 0 ]]; then
        log "Certificado SSL configurado com sucesso."
    fi
fi

# 14. Configurar PM2
log "Configurando PM2..."
npm install -g pm2 >/dev/null 2>&1 || true
su - $APP_USER -c "pm2 start $APP_DIR/ecosystem.config.js"
pm2 startup systemd -u $APP_USER --hp $APP_DIR >/dev/null
su - $APP_USER -c "pm2 save"

# 15. Configurar diretórios de uploads
log "Configurando diretório de uploads..."
mkdir -p $APP_DIR/backend/uploads
chown -R $APP_USER:$APP_USER $APP_DIR/backend/uploads
chmod -R 755 $APP_DIR/backend/uploads

# 16. Inicializar o banco de dados
log "Inicializando o banco de dados (schema e seeds)..."
cd $APP_DIR/backend

# Aguardar banco estar pronto
log "Testando conexão com o banco de dados..."
for i in {1..30}; do
    if sudo -u $APP_USER NODE_ENV=production node -e "require('./config/database.js').authenticate().then(() => console.log('OK')).catch(() => process.exit(1))" &>/dev/null; then
        log "Conexão com banco de dados estabelecida"
        break
    fi
    if [ $i -eq 30 ]; then
        error "Falha ao conectar com o banco de dados após 30 tentativas"
    fi
    sleep 2
done

sudo -u $APP_USER NODE_ENV=production node setup-database.js || error "Falha ao configurar o schema do banco de dados"
sudo -u $APP_USER NODE_ENV=production node seed-database.js || warning "Falha ao popular o banco de dados com dados iniciais (pode não ser um erro se já foi executado)"

# 17. Compilar assets do frontend
log "Compilando assets do frontend..."
cd $APP_DIR/frontend
# Instalar dependências de desenvolvimento para compilar
sudo -u $APP_USER npm install || warning "Falha ao instalar dependências do frontend"
sudo -u $APP_USER npm run build-css-prod || warning "Falha ao compilar CSS do frontend"
# Remover dependências de desenvolvimento após a compilação
sudo -u $APP_USER npm prune --production || warning "Falha ao remover dependências de desenvolvimento"

# 18. Iniciar o serviço
log "Iniciando o serviço CodeSeek..."
su - $APP_USER -c "pm2 restart codeseek || pm2 start $APP_DIR/ecosystem.config.js"
su - $APP_USER -c "pm2 save"

# 19. Verificar se o serviço está rodando
log "Verificando status do serviço..."
sleep 10

if su - $APP_USER -c "pm2 describe codeseek" >/dev/null 2>&1; then
    log "Serviço CodeSeek está rodando com sucesso!"
else
    error "Falha ao iniciar o serviço CodeSeek. Verifique os logs com: pm2 logs codeseek"
fi

# 20. Teste de conectividade
log "Testando conectividade da aplicação..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302\|404"; then
        log "Aplicação está respondendo na porta 3000"
        break
    fi
    if [ $i -eq 30 ]; then
        warning "Aplicação não está respondendo na porta 3000. Verifique os logs."
    fi
    sleep 2
done

# ==============================================================================
# 3. FINALIZAÇÃO E RELATÓRIO
# ==============================================================================

echo -e "\n${GREEN}==================================================="
echo -e "  Instalação do CodeSeek concluída com sucesso! "
echo -e "===================================================${NC}"
echo -e "URL da aplicação:     ${BLUE}$APP_URL${NC}"
echo -e "Diretório:            ${BLUE}$APP_DIR${NC}"
echo -e "Usuário do Sistema:   ${BLUE}$APP_USER${NC}"
echo -e "Banco de Dados:       ${BLUE}$DB_NAME${NC}"
echo -e "Usuário do Banco:     ${BLUE}$DB_USER${NC}"
echo -e "Senha do Banco:       ${YELLOW}$DB_PASSWORD${NC} (guarde em local seguro!)"  
echo -e "${GREEN}===================================================${NC}"
echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "Ver logs em tempo real:    ${BLUE}pm2 logs codeseek${NC}"
echo -e "Reiniciar serviço:         ${BLUE}sudo -u $APP_USER pm2 restart codeseek${NC}"
echo -e "Status do serviço:         ${BLUE}pm2 status codeseek${NC}"
echo -e "Diagnóstico da aplicação:  ${BLUE}cd $APP_DIR/backend && node diagnose.js${NC}"
echo -e "${GREEN}===================================================${NC}"

# Salvar informações importantes
INFO_FILE="$APP_DIR/installation-info.txt"
cat > "$INFO_FILE" << EOF
CodeSeek Installation Information
================================
Installation Date: $(date)
Domain: $DOMAIN
App URL: $APP_URL
App Directory: $APP_DIR
App User: $APP_USER
Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASSWORD
SSL Configured: $([[ "$SETUP_SSL" =~ ^[Ss]$ ]] && echo "Yes" || echo "No")
$([[ "$SETUP_SSL" =~ ^[Ss]$ ]] && echo "SSL Email: $SSL_EMAIL")

Useful Commands:
- View logs: pm2 logs codeseek
- Restart service: sudo -u $APP_USER pm2 restart codeseek
- Service status: pm2 status codeseek
- Diagnose: cd $APP_DIR/backend && node diagnose.js
EOF

chown $APP_USER:$APP_USER "$INFO_FILE"
chmod 600 "$INFO_FILE"

log "Informações da instalação salvas em: $INFO_FILE"
log "Instalação automática concluída com sucesso!"