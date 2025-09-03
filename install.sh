#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Interactive Installation Script
# ==============================================================================
# Description: Interactive installation and configuration for CodeSeek
# Author: CodeSeek Team
# Version: 2.0.0
# Usage: sudo ./install.sh
# ==============================================================================

set -euo pipefail

# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
GIT_REPO="https://github.com/WesleyMarinho/codeseek.git"
LOG_FILE="/var/log/codeseek-install.log"

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================

log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[INFO]${NC} $message"
    echo "[$timestamp] [INFO] $message" >> "$LOG_FILE"
}

error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} $message"
    echo "[$timestamp] [ERROR] $message" >> "$LOG_FILE"
    exit 1
}

warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARN]${NC} $message"
    echo "[$timestamp] [WARN] $message" >> "$LOG_FILE"
}

prompt() {
    local message="$1"
    echo -e "${BLUE}[INPUT]${NC} $message"
}

step() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${PURPLE}[STEP]${NC} $message"
    echo "[$timestamp] [STEP] $message" >> "$LOG_FILE"
}

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

check_os() {
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine OS version"
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        error "This script only supports Ubuntu and Debian"
    fi
    
    log "Detected OS: $PRETTY_NAME"
}

validate_domain() {
    local domain="$1"
    if [[ ! "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        return 1
    fi
    return 0
}

validate_email() {
    local email="$1"
    if [[ ! "$email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        return 1
    fi
    return 0
}

# ==============================================================================
# INITIALIZATION
# ==============================================================================

# Check prerequisites
check_root
check_os

# Create log file
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log "Starting CodeSeek installation..."

# ==============================================================================
# USER INPUT COLLECTION
# ==============================================================================

collect_user_input() {
    clear
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}  CodeSeek Installation - Configuration  ${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo "Let's configure the variables for your installation."
    echo "Press Enter to use the default value in brackets."
    echo ""
    
    # --- Application Domain ---
    while true; do
        prompt "Enter the domain for the application (e.g., codeseek.mydomain.com):"
        read -p "> " DOMAIN
        if [[ -n "$DOMAIN" ]]; then
            if validate_domain "$DOMAIN"; then
                break
            else
                warning "Invalid domain format. Please enter a valid domain."
            fi
        else
            warning "Domain cannot be empty."
        fi
    done
    
    # --- Database Configuration ---
    while true; do
        prompt "Enter the production database name [codeseek_prod]:"
        read -p "> " DB_NAME
        DB_NAME=${DB_NAME:-codeseek_prod}
        if [[ "$DB_NAME" =~ ^[a-zA-Z][a-zA-Z0-9_]*$ ]]; then
            break
        else
            warning "Invalid database name. Use only letters, numbers, and underscores (must start with letter)."
        fi
    done
    
    while true; do
        prompt "Enter the database username [codeseek_user]:"
        read -p "> " DB_USER
        DB_USER=${DB_USER:-codeseek_user}
        if [[ "$DB_USER" =~ ^[a-zA-Z][a-zA-Z0-9_]*$ ]]; then
            break
        else
            warning "Invalid username. Use only letters, numbers, and underscores (must start with letter)."
        fi
    done
    
    # --- SSL Configuration with Let's Encrypt ---
    while true; do
        prompt "Do you want to configure a free SSL certificate with Let's Encrypt (Certbot)? (y/n) [y]:"
        read -p "> " SETUP_SSL
        SETUP_SSL=${SETUP_SSL:-y}
        case $SETUP_SSL in
            [Yy]* )
                while true; do
                    prompt "Enter an email for SSL certificate registration (e.g., admin@mydomain.com):"
                    read -p "> " SSL_EMAIL
                    if [[ -n "$SSL_EMAIL" ]]; then
                        if validate_email "$SSL_EMAIL"; then
                            break
                        else
                            warning "Invalid email format. Please enter a valid email."
                        fi
                    else
                        warning "Email is required for Let's Encrypt."
                    fi
                done
                APP_URL="https://$DOMAIN"
                break
                ;;
            [Nn]* )
                APP_URL="http://$DOMAIN"
                warning "Installation will proceed without HTTPS. SSL is highly recommended for production."
                break
                ;;
            * )
                warning "Please answer with 'y' for yes or 'n' for no."
                ;;
        esac
    done
    
    # Generate secure passwords and secrets
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    log "Configuration collected successfully."
}

# Call the function to collect user input
collect_user_input


# ==============================================================================
# CONFIGURATION SUMMARY
# ==============================================================================

show_configuration_summary() {
    echo -e "\n${YELLOW}=== Configuration Summary ===${NC}\n"
    echo "Domain: $DOMAIN"
    echo "SSL: $([ "$SETUP_SSL" = "y" ] && echo "Enabled" || echo "Disabled")"
    echo "Database: $DB_NAME"
    echo "Database User: $DB_USER"
    echo "Application Directory: $APP_DIR"
    echo "Application User: $APP_USER"
    echo "Git Repository: $GIT_REPO"
    
    echo -e "\n${BLUE}Press Enter to continue or Ctrl+C to cancel...${NC}"
    read
    
    log "Configuration confirmed by user."
}

# Show configuration summary
show_configuration_summary

# ==============================================================================
# INSTALLATION FUNCTIONS
# ==============================================================================

update_system() {
    step "Updating system packages..."
    if ! apt update && apt upgrade -y; then
        error "Failed to update system packages"
    fi
    log "System updated successfully"
}

install_dependencies() {
    step "Installing basic dependencies..."
    local packages=(
        "curl"
        "wget"
        "gnupg2"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "lsb-release"
        "unzip"
        "git"
    )
    
    if ! apt install -y "${packages[@]}"; then
        error "Failed to install basic dependencies"
    fi
    log "Basic dependencies installed successfully"
}

install_nodejs() {
    step "Installing Node.js 18.x..."
    
    # Add NodeSource repository
    if ! curl -fsSL https://deb.nodesource.com/setup_18.x | bash -; then
        error "Failed to add NodeSource repository"
    fi
    
    # Install Node.js
    if ! apt install -y nodejs; then
        error "Failed to install Node.js"
    fi
    
    # Verify installation
    local node_version=$(node --version 2>/dev/null || echo "not found")
    local npm_version=$(npm --version 2>/dev/null || echo "not found")
    
    if [[ "$node_version" == "not found" ]] || [[ "$npm_version" == "not found" ]]; then
        error "Node.js or npm installation verification failed"
    fi
    
    log "Node.js $node_version and npm $npm_version installed successfully"
}

install_postgresql() {
    step "Installing PostgreSQL..."
    
    if ! apt install -y postgresql postgresql-contrib; then
        error "Failed to install PostgreSQL"
    fi
    
    # Start and enable PostgreSQL
    if ! systemctl start postgresql || ! systemctl enable postgresql; then
        error "Failed to start PostgreSQL service"
    fi
    
    log "PostgreSQL installed and started successfully"
}

install_redis() {
    step "Installing Redis..."
    
    if ! apt install -y redis-server; then
        error "Failed to install Redis"
    fi
    
    # Configure Redis to start on boot
    if ! systemctl enable redis-server; then
        warning "Failed to enable Redis service"
    fi
    
    log "Redis installed successfully"
}

install_nginx() {
    step "Installing Nginx..."
    
    if ! apt install -y nginx; then
        error "Failed to install Nginx"
    fi
    
    # Start and enable Nginx
    if ! systemctl start nginx || ! systemctl enable nginx; then
        error "Failed to start Nginx service"
    fi
    
    log "Nginx installed and started successfully"
}

install_certbot() {
    if [[ "$SETUP_SSL" == "y" ]]; then
        step "Installing Certbot for SSL certificates..."
        
        if ! apt install -y certbot python3-certbot-nginx; then
            error "Failed to install Certbot"
        fi
        
        log "Certbot installed successfully"
    fi
}

install_additional_packages() {
    step "Installing additional required packages..."
    
    local packages=(
        "build-essential"
        "python3"
        "python3-pip"
    )
    
    if ! apt install -y "${packages[@]}"; then
        error "Failed to install additional packages"
    fi
    
    log "Additional packages installed successfully"
}

# ==============================================================================
# INSTALLATION EXECUTION
# ==============================================================================

run_installation() {
    log "Starting installation process..."
    
    update_system
    install_dependencies
    install_nodejs
    install_postgresql
    install_redis
    install_nginx
    install_certbot
    install_additional_packages
    
    log "All system dependencies installed successfully"
}

# Execute installation
run_installation

# ==============================================================================
# APPLICATION SETUP FUNCTIONS
# ==============================================================================

create_app_user() {
    step "Creating application user: $APP_USER..."
    
    if ! id "$APP_USER" &>/dev/null; then
        if ! useradd -r -s /bin/bash -d "$APP_DIR" "$APP_USER"; then
            error "Failed to create user $APP_USER"
        fi
        log "User $APP_USER created successfully"
    else
        log "User $APP_USER already exists"
    fi
}

setup_app_directory() {
    step "Setting up application directory..."
    
    # Create application directory
    if ! mkdir -p "$APP_DIR"; then
        error "Failed to create directory $APP_DIR"
    fi
    
    # Set ownership
    if ! chown "$APP_USER:$APP_USER" "$APP_DIR"; then
        error "Failed to set directory ownership"
    fi
    
    # Set permissions
    if ! chmod 755 "$APP_DIR"; then
        error "Failed to set directory permissions"
    fi
    
    log "Application directory setup completed"
}

clone_repository() {
    step "Cloning application repository..."
    
    cd "$APP_DIR" || error "Failed to access directory $APP_DIR"
    
    if [[ -d ".git" ]]; then
        log "Repository already exists. Updating..."
        if ! sudo -u "$APP_USER" git pull; then
            warning "Failed to update repository, continuing with existing code"
        fi
    else
        if ! sudo -u "$APP_USER" git clone "$GIT_REPO" .; then
            error "Failed to clone repository from $GIT_REPO"
        fi
        log "Repository cloned successfully"
    fi
}

install_backend_dependencies() {
    step "Installing backend dependencies..."
    
    cd "$APP_DIR/backend" || error "Failed to access backend directory"
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        error "package.json not found in $APP_DIR/backend"
    fi
    
    # Install dependencies as app user
    if ! sudo -u "$APP_USER" npm install --production; then
        error "Failed to install backend dependencies"
    fi
    
    log "Backend dependencies installed successfully"
}

# ==============================================================================
# APPLICATION SETUP EXECUTION
# ==============================================================================

setup_application() {
    log "Setting up CodeSeek application..."
    
    create_app_user
    setup_app_directory
    clone_repository
    install_backend_dependencies
    
    log "Application setup completed successfully"
}

# Execute application setup
setup_application

# ==============================================================================
# ENVIRONMENT CONFIGURATION FUNCTIONS
# ==============================================================================

configure_environment() {
    step "Configuring environment variables..."
    
    local env_file="$APP_DIR/backend/.env"
    
    # Create .env file
    cat > "$env_file" << EOF
# ==============================================================================
# CodeSeek V1 - Production Environment Configuration
# ==============================================================================
# Generated on: $(date)
# Domain: $DOMAIN
# ==============================================================================

# Application Settings
NODE_ENV=production
PORT=3000
APP_URL=$APP_URL
APP_NAME=CodeSeek
APP_VERSION=1.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# Security Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
SESSION_SECRET=$SESSION_SECRET
SESSION_MAX_AGE=86400000
BCRYPT_ROUNDS=12

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# File Upload Configuration
UPLOAD_PATH=$APP_DIR/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt,zip

# Email Configuration (configure as needed)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@$DOMAIN

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=$APP_DIR/logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# CORS Configuration
CORS_ORIGIN=$APP_URL
CORS_CREDENTIALS=true
EOF
    
    # Set proper permissions
    if ! chown "$APP_USER:$APP_USER" "$env_file"; then
        error "Failed to set ownership of .env file"
    fi
    
    if ! chmod 600 "$env_file"; then
        error "Failed to set permissions of .env file"
    fi
    
    log "Environment configuration completed"
}

create_directories() {
    step "Creating application directories..."
    
    local directories=(
        "$APP_DIR/uploads"
        "$APP_DIR/logs"
        "$APP_DIR/tmp"
        "$APP_DIR/backups"
    )
    
    for dir in "${directories[@]}"; do
        if ! mkdir -p "$dir"; then
            error "Failed to create directory: $dir"
        fi
        
        if ! chown "$APP_USER:$APP_USER" "$dir"; then
            error "Failed to set ownership of directory: $dir"
        fi
        
        if ! chmod 755 "$dir"; then
            error "Failed to set permissions of directory: $dir"
        fi
    done
    
    log "Application directories created successfully"
}

# Execute environment configuration
configure_environment
create_directories

# ==============================================================================
# DATABASE CONFIGURATION FUNCTIONS
# ==============================================================================

configure_postgresql() {
    step "Configuring PostgreSQL database..."
    
    # Wait for PostgreSQL to be ready
    local max_attempts=30
    local attempt=1
    
    while ! sudo -u postgres psql -c "SELECT 1;" >/dev/null 2>&1; do
        if [[ $attempt -ge $max_attempts ]]; then
            error "PostgreSQL is not responding after $max_attempts attempts"
        fi
        log "Waiting for PostgreSQL to be ready... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # Create database user
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        log "Database user '$DB_USER' already exists"
    else
        if ! sudo -u postgres createuser --createdb --no-superuser --no-createrole "$DB_USER"; then
            error "Failed to create database user '$DB_USER'"
        fi
        log "Database user '$DB_USER' created successfully"
    fi
    
    # Set user password
    if ! sudo -u postgres psql -c "ALTER USER $DB_USER PASSWORD '$DB_PASSWORD';"; then
        error "Failed to set password for database user '$DB_USER'"
    fi
    
    # Create database
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log "Database '$DB_NAME' already exists"
    else
        if ! sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"; then
            error "Failed to create database '$DB_NAME'"
        fi
        log "Database '$DB_NAME' created successfully"
    fi
    
    # Grant privileges
    if ! sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"; then
        warning "Failed to grant privileges, but continuing..."
    fi
    
    log "PostgreSQL configuration completed"
}

configure_redis() {
    step "Configuring Redis..."
    
    # Configure Redis for production
    local redis_conf="/etc/redis/redis.conf"
    
    if [[ -f "$redis_conf" ]]; then
        # Backup original configuration
        if [[ ! -f "$redis_conf.backup" ]]; then
            cp "$redis_conf" "$redis_conf.backup"
        fi
        
        # Configure Redis settings
        sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' "$redis_conf"
        sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' "$redis_conf"
        sed -i 's/^save /# save /' "$redis_conf"  # Disable automatic saves
        
        log "Redis configuration updated"
    fi
    
    # Start and enable Redis
    if ! systemctl enable redis-server; then
        error "Failed to enable Redis service"
    fi
    
    if ! systemctl start redis-server; then
        error "Failed to start Redis service"
    fi
    
    # Verify Redis is running
    if ! systemctl is-active --quiet redis-server; then
        error "Redis service is not running"
    fi
    
    # Test Redis connection
    if ! redis-cli ping >/dev/null 2>&1; then
        error "Cannot connect to Redis"
    fi
    
    log "Redis configured and running successfully"
}

run_database_migrations() {
    step "Running database migrations..."
    
    cd "$APP_DIR/backend" || error "Failed to access backend directory"
    
    # Check if migration scripts exist
    if [[ -f "package.json" ]] && grep -q "migrate" package.json; then
        if ! sudo -u "$APP_USER" npm run migrate; then
            warning "Database migration failed, but continuing..."
        else
            log "Database migrations completed successfully"
        fi
    elif [[ -d "migrations" ]] || [[ -d "database/migrations" ]]; then
        log "Migration directory found but no npm script. Manual migration may be required."
    else
        log "No migration scripts found, skipping..."
    fi
}

# ==============================================================================
# DATABASE SETUP EXECUTION
# ==============================================================================

setup_database() {
    log "Setting up database services..."
    
    configure_postgresql
    configure_redis
    run_database_migrations
    
    log "Database setup completed successfully"
}

# Execute database setup
setup_database

# ==============================================================================
# NGINX CONFIGURATION FUNCTIONS
# ==============================================================================

configure_nginx() {
    step "Configuring Nginx reverse proxy..."
    
    local nginx_config="/etc/nginx/sites-available/codeseek"
    local nginx_enabled="/etc/nginx/sites-enabled/codeseek"
    
    # Remove default Nginx site
    if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
        rm -f "/etc/nginx/sites-enabled/default"
        log "Removed default Nginx site"
    fi
    
    # Create Nginx configuration
    cat > "$nginx_config" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf "$nginx_config" "$nginx_enabled"
    
    # Test Nginx configuration
    if ! nginx -t; then
        error "Invalid Nginx configuration"
    fi
    
    # Reload Nginx
    if ! systemctl reload nginx; then
        error "Failed to reload Nginx"
    fi
    
    log "Nginx configured successfully"
}

configure_ssl() {
    if [[ "$SETUP_SSL" != "y" ]]; then
        log "SSL setup skipped"
        return 0
    fi
    
    step "Configuring SSL with Let's Encrypt..."
    
    # Verify domain is accessible
    if ! curl -s --max-time 10 "http://$DOMAIN/health" >/dev/null; then
        warning "Domain $DOMAIN is not accessible. SSL setup may fail."
        read -p "Continue with SSL setup? (y/N): " -r continue_ssl
        if [[ ! "$continue_ssl" =~ ^[Yy]$ ]]; then
            log "SSL setup skipped by user"
            return 0
        fi
    fi
    
    # Request SSL certificate
    if ! certbot --nginx -d "$DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive --redirect; then
        error "Failed to obtain SSL certificate. Please check domain configuration."
    fi
    
    # Set up automatic renewal
    if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        log "SSL certificate auto-renewal configured"
    fi
    
    log "SSL configured successfully"
}

# ==============================================================================
# WEB SERVER SETUP EXECUTION
# ==============================================================================

setup_webserver() {
    log "Setting up web server..."
    
    configure_nginx
    configure_ssl
    
    log "Web server setup completed successfully"
}

# Execute web server setup
setup_webserver

# ==============================================================================
# SYSTEMD SERVICE CONFIGURATION
# ==============================================================================

configure_systemd_service() {
    step "Configuring systemd service..."
    
    local service_file="/etc/systemd/system/codeseek.service"
    
    cat > "$service_file" << EOF
[Unit]
Description=CodeSeek Application Server
Documentation=https://github.com/codeseek/codeseek
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service
Requires=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=/usr/bin/node server.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
TimeoutStartSec=60
TimeoutStopSec=20
KillMode=mixed
KillSignal=SIGTERM

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=codeseek

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    if ! systemctl daemon-reload; then
        error "Failed to reload systemd daemon"
    fi
    
    if ! systemctl enable codeseek; then
        error "Failed to enable CodeSeek service"
    fi
    
    log "Systemd service configured successfully"
}

build_frontend() {
    step "Building frontend application..."
    
    cd "$APP_DIR/frontend" || error "Frontend directory not found"
    
    # Install frontend dependencies
    if ! sudo -u "$APP_USER" npm ci --production; then
        error "Failed to install frontend dependencies"
    fi
    
    # Build frontend
    if ! sudo -u "$APP_USER" npm run build; then
        error "Failed to build frontend"
    fi
    
    log "Frontend built successfully"
}

start_services() {
    step "Starting CodeSeek services..."
    
    # Start CodeSeek service
    if ! systemctl start codeseek; then
        error "Failed to start CodeSeek service"
    fi
    
    # Wait for service to be ready
    local max_attempts=30
    local attempt=1
    
    while ! systemctl is-active --quiet codeseek; do
        if [[ $attempt -ge $max_attempts ]]; then
            error "CodeSeek service failed to start after $max_attempts attempts"
        fi
        log "Waiting for CodeSeek service to start... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # Test application endpoint
    if ! curl -s --max-time 10 "http://localhost:3000/health" >/dev/null; then
        warning "Application health check failed, but service is running"
    fi
    
    log "CodeSeek service started successfully"
}

run_post_install_checks() {
    step "Running post-installation checks..."
    
    local check_script="$APP_DIR/post-install-check.sh"
    
    if [[ -f "$check_script" ]]; then
        if ! bash "$check_script"; then
            warning "Post-installation checks found some issues. Please review the output above."
        else
            log "All post-installation checks passed"
        fi
    else
        log "Post-installation check script not found, skipping..."
    fi
}

show_installation_summary() {
    local ssl_protocol="http"
    if [[ "$SETUP_SSL" == "y" ]]; then
        ssl_protocol="https"
    fi
    
    echo
    log "${GREEN}🎉 CodeSeek Installation Completed Successfully!${NC}"
    echo
    log "📋 Installation Summary:"
    log "   🌐 Application URL: ${ssl_protocol}://$DOMAIN"
    log "   👤 Database User: $DB_USER"
    log "   🗄️  Database Name: $DB_NAME"
    log "   📁 Installation Directory: $APP_DIR"
    log "   👥 Application User: $APP_USER"
    echo
    log "🔧 Service Management:"
    log "   Status: systemctl status codeseek"
    log "   Start:  systemctl start codeseek"
    log "   Stop:   systemctl stop codeseek"
    log "   Restart: systemctl restart codeseek"
    log "   Logs:   journalctl -u codeseek -f"
    echo
    log "📊 System Information:"
    log "   PostgreSQL: $(systemctl is-active postgresql)"
    log "   Redis: $(systemctl is-active redis-server)"
    log "   Nginx: $(systemctl is-active nginx)"
    log "   CodeSeek: $(systemctl is-active codeseek)"
    echo
    log "⚠️  Important Notes:"
    log "   1. Ensure your DNS points to this server IP"
    log "   2. Configure regular database backups"
    log "   3. Monitor application logs regularly"
    log "   4. Keep the system updated"
    echo
    log "📖 Documentation: https://github.com/codeseek/codeseek"
    log "🆘 Support: Run './troubleshoot.sh' for diagnostics"
    echo
    log "${GREEN}🚀 CodeSeek is now ready! Access ${ssl_protocol}://$DOMAIN to get started.${NC}"
    echo
}

# ==============================================================================
# FINALIZATION EXECUTION
# ==============================================================================

finalize_installation() {
    log "Finalizing installation..."
    
    configure_systemd_service
    build_frontend
    start_services
    run_post_install_checks
    show_installation_summary
    
    log "Installation finalization completed"
}

# ==============================================================================
# MAIN INSTALLATION FUNCTION
# ==============================================================================

main() {
    # Initialize logging
    log "Starting CodeSeek installation at $(date)"
    log "Installation directory: $APP_DIR"
    log "Log file: $LOG_FILE"
    
    # Pre-installation checks
    check_root
    check_os
    
    # Collect user input
    collect_user_input
    
    # Show configuration summary
    show_configuration_summary
    
    # Execute installation steps
    run_installation
    setup_application
    setup_database
    setup_webserver
    finalize_installation
    
    log "CodeSeek installation completed successfully at $(date)"
}

# ==============================================================================
# SCRIPT EXECUTION
# ==============================================================================

# Trap errors and cleanup
trap 'error "Installation failed at line $LINENO. Check $LOG_FILE for details."' ERR

# Execute main function
main "$@"
