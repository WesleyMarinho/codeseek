#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Script de Instalação Completo para VPS Ubuntu
# ==============================================================================
# Descrição: Instalação automatizada com domínio e SSL
# Autor: CodeSeek Team
# Versão: 2.0.0
# Uso: sudo bash install-vps.sh [dominio] [email]
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

# Processar argumentos da linha de comando
process_arguments() {
    if [[ $# -ge 1 ]]; then
        DOMAIN="$1"
        log "Domínio fornecido: $DOMAIN"
    fi
    
    if [[ $# -ge 2 ]]; then
        EMAIL="$2"
        log "Email fornecido: $EMAIL"
    fi
}

# Solicitar informações do usuário
get_user_input() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN} CodeSeek V1 - Configuração${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
    
    # Solicitar domínio se não fornecido
    if [[ -z "$DOMAIN" ]]; then
        echo -e "${BLUE}🌐 Configuração de Domínio${NC}"
        echo -e "${YELLOW}Deixe em branco para usar apenas IP (localhost)${NC}"
        read -p "Digite seu domínio (ex: meusite.com): " DOMAIN
        echo ""
    fi
    
    # Validar domínio
    if [[ -n "$DOMAIN" ]] && [[ "$DOMAIN" != "localhost" ]]; then
        if [[ "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$ ]]; then
            log "Domínio válido: $DOMAIN"
            
            # Perguntar sobre SSL
            echo -e "${BLUE}🔒 Configuração SSL${NC}"
            echo -e "${YELLOW}Deseja configurar SSL automático com Let's Encrypt?${NC}"
            read -p "SSL automático? (y/n) [y]: " ssl_choice
            ssl_choice=${ssl_choice:-y}
            
            if [[ "$ssl_choice" =~ ^[Yy]$ ]]; then
                USE_SSL=true
                
                # Solicitar email se não fornecido
                if [[ -z "$EMAIL" ]]; then
                    read -p "Digite seu email para Let's Encrypt: " EMAIL
                fi
                
                if [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                    log "Email válido: $EMAIL"
                else
                    warning "Email inválido, SSL será configurado manualmente"
                    USE_SSL=false
                fi
            fi
        else
            warning "Domínio inválido, usando localhost"
            DOMAIN="localhost"
        fi
    else
        DOMAIN="localhost"
        log "Usando localhost (sem domínio personalizado)"
    fi
    
    echo -e "${PURPLE}📋 Resumo da Configuração:${NC}"
    echo -e "   Domínio: $DOMAIN"
    echo -e "   SSL: $USE_SSL"
    if [[ "$USE_SSL" == "true" ]]; then
        echo -e "   Email: $EMAIL"
    fi
    echo ""
    
    read -p "Continuar com essa configuração? (y/n) [y]: " confirm
    confirm=${confirm:-y}
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        error "Instalação cancelada pelo usuário"
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
    log "Configurando Nginx para domínio: $DOMAIN"
    
    # Determinar server_name baseado no domínio
    local server_name="$DOMAIN"
    if [[ "$DOMAIN" == "localhost" ]]; then
        server_name="localhost"
    else
        server_name="$DOMAIN www.$DOMAIN"
    fi
    
    cat > /etc/nginx/sites-available/codeseek <<EOF
server {
    listen 80;
    server_name $server_name;
    
    # Configuração de logs
    access_log /var/log/nginx/codeseek_access.log;
    error_log /var/log/nginx/codeseek_error.log;

    # Configuração de segurança
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Configuração de compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Servir arquivos estáticos
    location /public/ {
        alias $APP_DIR/frontend/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Headers específicos para diferentes tipos de arquivo
        location ~* \.(css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Upload de arquivos
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 7d;
        add_header Cache-Control "private, no-cache";
    }

    # Configuração para Let's Encrypt
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
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
        
        # Configurações de timeout
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer otimizado
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Bloquear arquivos sensíveis
    location ~ /\.(env|git|htaccess) {
        deny all;
        return 404;
    }
    
    # Limite de tamanho de upload
    client_max_body_size 10M;
}
EOF

    # Ativar site
    ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t && systemctl reload nginx
}

# Configurar SSL com Let's Encrypt
setup_ssl() {
    if [[ "$USE_SSL" != "true" ]] || [[ "$DOMAIN" == "localhost" ]]; then
        log "Pulando configuração SSL"
        return 0
    fi
    
    log "Configurando SSL com Let's Encrypt para $DOMAIN"
    
    # Instalar Certbot
    if ! command -v certbot &> /dev/null; then
        log "Instalando Certbot..."
        apt-get update -y
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Verificar se o domínio está apontando para este servidor
    log "Verificando DNS do domínio..."
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "unknown")
    
    if [[ "$EXTERNAL_IP" != "unknown" ]]; then
        log "IP externo detectado: $EXTERNAL_IP"
        
        # Tentar resolver o domínio
        if command -v nslookup &> /dev/null; then
            DOMAIN_IP=$(nslookup "$DOMAIN" | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1 2>/dev/null || echo "")
            
            if [[ "$DOMAIN_IP" == "$EXTERNAL_IP" ]]; then
                log "✅ DNS configurado corretamente ($DOMAIN -> $EXTERNAL_IP)"
            else
                warning "⚠️  DNS pode não estar configurado corretamente"
                warning "   Domínio resolve para: $DOMAIN_IP"
                warning "   IP do servidor: $EXTERNAL_IP"
                warning "   Certifique-se de que o domínio aponta para este servidor"
                
                read -p "Continuar mesmo assim? (y/n) [n]: " continue_ssl
                continue_ssl=${continue_ssl:-n}
                
                if [[ ! "$continue_ssl" =~ ^[Yy]$ ]]; then
                    warning "Configuração SSL cancelada. Configure o DNS primeiro."
                    return 0
                fi
            fi
        fi
    fi
    
    # Obter certificado SSL
    log "Obtendo certificado SSL..."
    
    # Criar diretório para desafio
    mkdir -p /var/www/html
    
    # Tentar obter o certificado
    if certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
       --non-interactive \
       --agree-tos \
       --email "$EMAIL" \
       --redirect; then
        
        log "✅ SSL configurado com sucesso!"
        
        # Configurar renovação automática
        log "Configurando renovação automática..."
        
        # Criar script de renovação
        cat > /etc/cron.daily/certbot-renewal <<'EOL'
#!/bin/bash
/usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
EOL
        
        chmod +x /etc/cron.daily/certbot-renewal
        
        # Testar renovação
        log "Testando renovação automática..."
        certbot renew --dry-run
        
        log "🔒 HTTPS configurado! Site disponível em:"
        log "   https://$DOMAIN"
        log "   https://www.$DOMAIN"
        
    else
        error "Falha ao obter certificado SSL. Verifique se:"
        error "1. O domínio está apontando para este servidor"
        error "2. As portas 80 e 443 estão abertas"
        error "3. Não há firewall bloqueando"
    fi
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
    local EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || "IP_DESCONHECIDO")
    
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN} CodeSeek V1 Instalado com Sucesso! ${NC}"
    echo -e "${GREEN}================================${NC}\n"
    
    echo -e "${BLUE}📍 URLs de Acesso:${NC}"
    if [[ "$USE_SSL" == "true" && "$DOMAIN" != "localhost" ]]; then
        echo -e "   🔒 Site: https://$DOMAIN"
        echo -e "   🔒 Site: https://www.$DOMAIN"
    elif [[ "$DOMAIN" != "localhost" ]]; then
        echo -e "   🌐 Site: http://$DOMAIN"
        echo -e "   🌐 Site: http://www.$DOMAIN"
    else
        echo -e "   🌐 Site: http://$EXTERNAL_IP"
        echo -e "   🌐 Local: http://localhost"
    fi
    
    echo -e "\n${BLUE}🔑 Login Administrativo:${NC}"
    echo -e "   Email: admin@codeseek.com"
    echo -e "   Senha: admin123456"
    echo -e "   ${YELLOW}⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!${NC}"
    
    echo -e "\n${BLUE}📋 Comandos Úteis:${NC}"
    echo -e "   Status: sudo -u $APP_USER pm2 status"
    echo -e "   Logs: sudo -u $APP_USER pm2 logs codeseek"
    echo -e "   Restart: sudo -u $APP_USER pm2 restart codeseek"
    echo -e "   Stop: sudo -u $APP_USER pm2 stop codeseek"
    
    echo -e "\n${BLUE}📁 Arquivos Importantes:${NC}"
    echo -e "   App: $APP_DIR"
    echo -e "   Logs: /var/log/codeseek/"
    echo -e "   Credenciais DB: /opt/codeseek-credentials.env"
    echo -e "   Env: $APP_DIR/backend/.env"
    echo -e "   Nginx: /etc/nginx/sites-available/codeseek"
    
    echo -e "\n${BLUE}🛠️  Configuração Aplicada:${NC}"
    echo -e "   Domínio: $DOMAIN"
    echo -e "   SSL: $USE_SSL"
    if [[ "$USE_SSL" == "true" ]]; then
        echo -e "   Email SSL: $EMAIL"
    fi
    
    if [[ "$DOMAIN" == "localhost" ]]; then
        echo -e "\n${YELLOW}📝 Próximos Passos:${NC}"
        echo -e "   1. Configure seu domínio personalizado"
        echo -e "   2. Execute novamente com: sudo bash install-vps.sh meudominio.com"
        echo -e "   3. Configure backup do banco de dados"
    else
        echo -e "\n${YELLOW}📝 Próximos Passos:${NC}"
        echo -e "   1. Teste o site nos URLs acima"
        echo -e "   2. Altere a senha do admin"
        echo -e "   3. Configure backup do banco de dados"
        echo -e "   4. Configure monitoramento"
    fi
    
    echo -e "\n${GREEN}✅ Instalação concluída!${NC}\n"
}

# Função principal
main() {
    # Processar argumentos e solicitar informações
    process_arguments "$@"
    get_user_input
    
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
    setup_ssl
    initialize_database
    start_application
    show_status
    
    log "Instalação concluída com sucesso!"
}

# Executar instalação
main "$@"