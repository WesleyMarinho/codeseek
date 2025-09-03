#!/bin/bash

# ==============================================================================
# Script de instalação interativo do CodeSeek em ambiente de produção
# ==============================================================================
#
# Este script irá guiá-lo através da instalação e configuração completa
# da aplicação CodeSeek, incluindo:
#   - Dependências do sistema (Nginx, PostgreSQL, Node.js, Redis)
#   - Configuração do banco de dados
#   - Configuração do serviço (systemd)
#   - Configuração do Nginx como proxy reverso
#   - (Opcional) Geração de certificado SSL com Let's Encrypt
#
# Uso: sudo bash install.sh
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

prompt() {
    echo -e "${BLUE}[INPUT]${NC} $1"
}

# --- Verificação de Root ---
if [ "$(id -u)" -ne 0 ]; then
    error "Este script precisa ser executado como root. Use: sudo bash $0"
fi

# ==============================================================================
# 1. COLETANDO INFORMAÇÕES DO USUÁRIO
# ==============================================================================

clear
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Instalação do CodeSeek - Configuração  ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo "Vamos configurar as variáveis para a sua instalação."
echo "Pressione Enter para usar o valor padrão entre colchetes."
echo ""

# --- Domínio da Aplicação ---
prompt "Digite o domínio para a aplicação (ex: codeseek.meudominio.com):"
while [[ -z "$DOMAIN" ]]; do
    read -p "> " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        echo -e "${YELLOW}O domínio não pode ser vazio.${NC}"
    fi
done

# --- Configurações do Banco de Dados ---
prompt "Digite o nome do banco de dados de produção [codeseek_prod]:"
read -p "> " DB_NAME
DB_NAME=${DB_NAME:-codeseek_prod}

prompt "Digite o nome de usuário para o banco de dados [codeseek_user]:"
read -p "> " DB_USER
DB_USER=${DB_USER:-codeseek_user}

# --- Configuração de SSL com Let's Encrypt ---
prompt "Deseja configurar um certificado SSL gratuito com Let's Encrypt (Certbot)? (s/n) [s]:"
read -p "> " SETUP_SSL
SETUP_SSL=${SETUP_SSL:-s}

if [[ "$SETUP_SSL" =~ ^[Ss]$ ]]; then
    prompt "Digite um e-mail para o registro do certificado SSL (ex: admin@meudominio.com):"
    while [[ -z "$SSL_EMAIL" ]]; do
        read -p "> " SSL_EMAIL
        if [[ -z "$SSL_EMAIL" ]]; then
            echo -e "${YELLOW}O e-mail é necessário para o Let's Encrypt.${NC}"
        fi
    done
    APP_URL="https://$DOMAIN"
else
    APP_URL="http://$DOMAIN"
    warning "A instalação prosseguirá sem HTTPS. É altamente recomendável usar SSL em produção."
fi


# --- Resumo e Confirmação ---
echo -e "\n${YELLOW}================== RESUMO DA CONFIGURAÇÃO ==================${NC}"
echo -e "Domínio da Aplicação:   ${GREEN}$DOMAIN${NC}"
echo -e "URL Final:              ${GREEN}$APP_URL${NC}"
echo -e "Usuário do Sistema:     ${GREEN}codeseek${NC}"
echo -e "Diretório da Aplicação: ${GREEN}/opt/codeseek${NC}"
echo -e "Nome do Banco de Dados: ${GREEN}$DB_NAME${NC}"
echo -e "Usuário do Banco:       ${GREEN}$DB_USER${NC}"
if [[ "$SETUP_SSL" =~ ^[Ss]$ ]]; then
    echo -e "Configurar SSL:         ${GREEN}Sim (com o e-mail: $SSL_EMAIL)${NC}"
else
    echo -e "Configurar SSL:         ${RED}Não${NC}"
fi
echo -e "${YELLOW}============================================================${NC}\n"

prompt "As configurações acima estão corretas? (s/n)"
read -p "> " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    error "Instalação cancelada pelo usuário."
fi


# ==============================================================================
# 2. EXECUÇÃO DA INSTALAÇÃO
# ==============================================================================

# --- Configurações Fixas ---
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
GIT_REPO="https://github.com/WesleyMarinho/codeseek.git"

# 1. Atualizar o sistema
log "Atualizando o sistema..."
apt update && apt upgrade -y || error "Falha ao atualizar o sistema"

# 2. Instalar dependências
log "Instalando dependências..."
DEPS="git curl wget nginx postgresql postgresql-contrib redis-server build-essential python3 python3-pip"
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
node -v
npm -v

# 4. Criar usuário para a aplicação
log "Criando usuário do sistema '$APP_USER'..."
if ! id -u $APP_USER &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER || error "Falha ao criar usuário $APP_USER"
else
    log "Usuário '$APP_USER' já existe."
fi

# 5. Criar diretório da aplicação
log "Criando diretório da aplicação em '$APP_DIR'..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# 6. Clonar o repositório
log "Clonando o repositório..."
if [ -d "$APP_DIR/.git" ]; then
    warning "O diretório '$APP_DIR' já contém um repositório git. Pulando a clonagem."
else
    sudo -u $APP_USER git clone $GIT_REPO $APP_DIR || error "Falha ao clonar o repositório"
fi
chown -R $APP_USER:$APP_USER $APP_DIR

# 7. Instalar dependências do backend
log "Instalando dependências do backend (npm install)..."
cd $APP_DIR/backend
sudo -u $APP_USER npm install --production || error "Falha ao instalar dependências do backend"

# 8. Configurar variáveis de ambiente (.env)
log "Configurando variáveis de ambiente (.env)..."
ENV_FILE="$APP_DIR/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    cp "$APP_DIR/backend/.env.example" "$ENV_FILE"

    # Gerar senhas e segredos
    DB_PASSWORD=$(openssl rand -hex 16)
    SESSION_SECRET=$(openssl rand -hex 32)

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

    chown $APP_USER:$APP_USER "$ENV_FILE"
    chmod 600 "$ENV_FILE" # Permissões restritas para o arquivo .env
else
    warning "Arquivo .env já existe. Pulando a configuração automática."
fi
DB_PASSWORD=$(grep DB_PASSWORD $ENV_FILE | cut -d '=' -f2) # Carrega a senha para usar abaixo

# 9. Configurar banco de dados PostgreSQL
log "Configurando banco de dados PostgreSQL..."
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

# 10. Configurar Redis
log "Configurando Redis..."
systemctl enable --now redis-server || error "Falha ao iniciar ou habilitar o Redis"

# 11. Configurar Nginx
log "Configurando Nginx para o domínio $DOMAIN..."
NGINX_CONF="/etc/nginx/sites-available/codeseek"
cp $APP_DIR/nginx.conf $NGINX_CONF
sed -i "s/your_domain.com/$DOMAIN/g" $NGINX_CONF
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t || error "Configuração do Nginx inválida. Verifique o arquivo $NGINX_CONF"
systemctl restart nginx

# 12. Configurar SSL com Certbot (se selecionado)
if [[ "$SETUP_SSL" =~ ^[Ss]$ ]]; then
    log "Configurando certificado SSL com Certbot..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect || error "Falha ao gerar o certificado SSL. Verifique se o DNS do seu domínio aponta para este servidor."
    log "Certificado SSL configurado com sucesso."
fi

# 13. Configurar serviço systemd
log "Configurando serviço systemd..."
sed -i "s/User=codeseek/User=$APP_USER/" $APP_DIR/codeseek.service
sed -i "s|WorkingDirectory=/opt/codeseek/backend|WorkingDirectory=$APP_DIR/backend|" $APP_DIR/codeseek.service
cp $APP_DIR/codeseek.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable codeseek.service

# 14. Configurar diretórios de uploads
log "Configurando diretório de uploads..."
mkdir -p $APP_DIR/backend/uploads
chown -R $APP_USER:$APP_USER $APP_DIR/backend/uploads
chmod -R 755 $APP_DIR/backend/uploads

# 15. Inicializar o banco de dados
log "Inicializando o banco de dados (schema e seeds)..."
cd $APP_DIR/backend
sudo -u $APP_USER NODE_ENV=production node setup-database.js || error "Falha ao configurar o schema do banco de dados"
sudo -u $APP_USER NODE_ENV=production node seed-database.js || warning "Falha ao popular o banco de dados com dados iniciais (pode não ser um erro se já foi executado)"

# 16. Compilar assets do frontend
log "Compilando assets do frontend..."
cd $APP_DIR/frontend
# Precisamos instalar as dependências de desenvolvimento para compilar
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build-css-prod || warning "Falha ao compilar CSS do frontend"
# Removemos as dependências de desenvolvimento após a compilação
sudo -u $APP_USER npm prune --production

# 17. Iniciar o serviço
log "Iniciando o serviço CodeSeek..."
systemctl start codeseek.service

# --- Finalização ---
log "Aguardando o serviço iniciar..."
sleep 5
systemctl status codeseek.service --no-pager

echo -e "\n${GREEN}=================================================="
echo -e "  Instalação do CodeSeek concluída com sucesso! "
echo -e "==================================================${NC}"
echo -e "URL da aplicação:   ${BLUE}$APP_URL${NC}"
echo -e "Diretório:          ${BLUE}$APP_DIR${NC}"
echo -e "Usuário do Sistema:   ${BLUE}$APP_USER${NC}"
echo -e "Banco de Dados:     ${BLUE}$DB_NAME${NC}"
echo -e "Usuário do Banco:     ${BLUE}$DB_USER${NC}"
echo -e "Senha do Banco:       ${YELLOW}$DB_PASSWORD${NC} (guarde em local seguro!)"
echo -e "${GREEN}==================================================${NC}"
echo -e "Para verificar os logs em tempo real, use:"
echo -e "${YELLOW}sudo journalctl -u codeseek.service -f${NC}"
echo -e "${GREEN}==================================================${NC}"