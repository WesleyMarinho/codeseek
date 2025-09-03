#!/bin/bash

# Script de instalação do CodeSeek em ambiente de produção
# Uso: sudo bash install.sh

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se está rodando como root
if [ "$(id -u)" -ne 0 ]; then
    error "Este script precisa ser executado como root. Use: sudo bash $0"
fi

# Configurações
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
GIT_REPO="https://github.com/WesleyMarinho/codeseek.git"
DOMAIN="seu-dominio.com"

# 1. Atualizar o sistema
log "Atualizando o sistema..."
apt update && apt upgrade -y || error "Falha ao atualizar o sistema"

# 2. Instalar dependências
log "Instalando dependências..."
apt install -y git curl wget nginx postgresql postgresql-contrib redis-server build-essential python3 python3-pip || error "Falha ao instalar dependências"

# 3. Instalar Node.js 18.x
log "Instalando Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - || error "Falha ao configurar repositório do Node.js"
apt install -y nodejs || error "Falha ao instalar Node.js"

# Verificar versão do Node.js
node -v
npm -v

# 4. Criar usuário para a aplicação
log "Criando usuário para a aplicação..."
id -u $APP_USER &>/dev/null || useradd -m -s /bin/bash $APP_USER || error "Falha ao criar usuário $APP_USER"

# 5. Criar diretório da aplicação
log "Criando diretório da aplicação..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# 6. Clonar o repositório
log "Clonando o repositório..."
cd $APP_DIR
git clone $GIT_REPO . || error "Falha ao clonar o repositório"
chown -R $APP_USER:$APP_USER $APP_DIR

# 7. Instalar dependências do backend
log "Instalando dependências do backend..."
cd $APP_DIR/backend
npm install --production || error "Falha ao instalar dependências do backend"

# 8. Configurar variáveis de ambiente
log "Configurando variáveis de ambiente..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
    
    # Gerar senha segura para SESSION_SECRET
    SESSION_SECRET=$(openssl rand -hex 32)
    
    # Atualizar variáveis no arquivo .env
    sed -i "s/PORT=3000/PORT=3000/" $APP_DIR/backend/.env
    sed -i "s/NODE_ENV=development/NODE_ENV=production/" $APP_DIR/backend/.env
    sed -i "s/DB_HOST=localhost/DB_HOST=localhost/" $APP_DIR/backend/.env
    sed -i "s/DB_NAME=codeseek_db/DB_NAME=codeseek_prod/" $APP_DIR/backend/.env
    sed -i "s/DB_USER=postgres/DB_USER=codeseek_user/" $APP_DIR/backend/.env
    sed -i "s/DB_PASSWORD=sua_senha_aqui/DB_PASSWORD=$(openssl rand -hex 12)/" $APP_DIR/backend/.env
    sed -i "s/REDIS_HOST=localhost/REDIS_HOST=localhost/" $APP_DIR/backend/.env
    sed -i "s/SESSION_SECRET=sua_chave_secreta_muito_forte_aqui/SESSION_SECRET=$SESSION_SECRET/" $APP_DIR/backend/.env
    sed -i "s|BASE_URL=http://localhost:3000|BASE_URL=https://$DOMAIN|" $APP_DIR/backend/.env
    
    # Salvar senha do banco para uso posterior
    DB_PASSWORD=$(grep DB_PASSWORD $APP_DIR/backend/.env | cut -d '=' -f2)
    echo "Senha do banco de dados: $DB_PASSWORD"
fi

# 9. Configurar banco de dados PostgreSQL
log "Configurando banco de dados PostgreSQL..."
DB_USER="codeseek_user"
DB_NAME="codeseek_prod"
DB_PASSWORD=$(grep DB_PASSWORD $APP_DIR/backend/.env | cut -d '=' -f2)

# Criar usuário e banco de dados PostgreSQL
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || warning "Usuário do banco já pode existir"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || warning "Banco de dados já pode existir"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || warning "Privilégios já podem estar configurados"
sudo -u postgres psql -c "ALTER USER $DB_USER WITH SUPERUSER;" || warning "Falha ao configurar superuser"

# 10. Configurar Redis
log "Configurando Redis..."
systemctl enable redis-server
systemctl restart redis-server

# 11. Configurar Nginx
log "Configurando Nginx..."
cp $APP_DIR/nginx.conf /etc/nginx/sites-available/codeseek
sed -i "s/your_domain.com/$DOMAIN/g" /etc/nginx/sites-available/codeseek
ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t || error "Configuração do Nginx inválida"
systemctl restart nginx

# 12. Configurar serviço systemd
log "Configurando serviço systemd..."
cp $APP_DIR/codeseek.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable codeseek.service

# 13. Configurar diretórios de uploads
log "Configurando diretórios de uploads..."
mkdir -p $APP_DIR/backend/uploads
chown -R $APP_USER:$APP_USER $APP_DIR/backend/uploads
chmod -R 755 $APP_DIR/backend/uploads

# 14. Inicializar o banco de dados
log "Inicializando o banco de dados..."
cd $APP_DIR/backend
sudo -u $APP_USER NODE_ENV=production node setup-database.js || error "Falha ao configurar o banco de dados"
sudo -u $APP_USER NODE_ENV=production node seed-database.js || warning "Falha ao popular o banco de dados com dados iniciais"

# 15. Compilar assets do frontend
log "Compilando assets do frontend..."
cd $APP_DIR/frontend
npm install
npm run build-css-prod || warning "Falha ao compilar CSS"

# 16. Iniciar o serviço
log "Iniciando o serviço CodeSeek..."
systemctl start codeseek.service

# 17. Verificar status
log "Verificando status do serviço..."
systemctl status codeseek.service

log "\n=================================================="
log "Instalação do CodeSeek concluída com sucesso!"
log "=================================================="
log "URL da aplicação: https://$DOMAIN"
log "Diretório da aplicação: $APP_DIR"
log "Usuário do sistema: $APP_USER"
log "Banco de dados: $DB_NAME"
log "Usuário do banco: $DB_USER"
log "Senha do banco: $DB_PASSWORD"
log "=================================================="
log "Para verificar os logs: sudo journalctl -u codeseek.service -f"
log "=================================================="