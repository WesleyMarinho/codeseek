# CodeSeek - Digital Marketplace Platform

CodeSeek is a modern, secure digital marketplace platform built with Node.js, designed for selling digital products, managing licenses, and handling subscriptions with integrated payment processing. The platform features enterprise-grade security, responsive design, and comprehensive admin tools.

## 🔒 Security Features

- **Content Security Policy (CSP)**: Implemented strict CSP headers to prevent XSS attacks
- **Secure Event Handling**: All inline event handlers replaced with secure addEventListener patterns
- **Session Security**: Redis-based session management with secure cookies
- **Input Validation**: Comprehensive server-side validation and sanitization
- **CSRF Protection**: Built-in CSRF token validation
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries

## 🚀 Features

### Core Marketplace Features
- **Product Management**: Upload, categorize, and manage digital products
- **License System**: Automatic license generation and validation with API
- **User Management**: Registration, authentication, and profile management
- **Shopping Cart**: Add to cart, checkout process with multiple payment options
- **Order Management**: Complete order processing and fulfillment
- **File Delivery**: Secure download links for purchased products

### Advanced Features
- **Subscription Management**: Recurring billing with Chargebee integration
- **Admin Dashboard**: Comprehensive admin panel with dynamic settings
- **Public API**: RESTful APIs for license validation and integrations
- **Email System**: Automated email notifications with customizable templates
- **Dynamic Branding**: Configurable site name, logo, and favicon
- **Responsive Design**: Mobile-first approach with modern UI

## 🏗️ Architecture

CodeSeek follows a monolithic MVC architecture with clear separation of concerns:

### Technology Stack
- **Backend**: Node.js 18+ with Express.js 4.x framework
- **Database**: PostgreSQL 14+ with Sequelize ORM 6.x
- **Session Management**: Redis 6+ for session storage and caching
- **Frontend**: HTML5, CSS3, Vanilla JavaScript with modern ES6+ features
- **Security**: Content Security Policy (CSP), secure event handling
- **Payment Processing**: Chargebee API integration for subscriptions
- **Email**: SMTP with customizable HTML templates
- **Development**: Nodemon for hot reloading, ESLint for code quality

### Core Components
- **server.js**: Main application entry point with middleware setup
- **Routes**: Organized API and web routes with authentication
- **Config**: Environment-based configuration management
- **Models**: Sequelize data models with relationships
- **Controllers**: Business logic handlers with error management
- **Middleware**: Authentication, validation, and utility middleware
- **Frontend**: Static assets with dynamic content loading

### Data Models (Sequelize)
- **User**: User accounts with roles and authentication
- **Product**: Digital products with metadata, pricing, and files
- **Category**: Product categorization system
- **License**: Generated licenses with validation and usage tracking
- **Activation**: License activation records with domain binding
- **Subscription**: Chargebee subscription management
- **Invoice**: Payment and billing records
- **WebhookLog**: Webhook processing logs
- **Setting**: Dynamic application configuration (site name, logo, etc.)

### Marketplace Flow
1. **Browse**: Users browse products on the public marketplace
2. **Cart**: Add products to shopping cart with session management
3. **Checkout**: Process payment through Chargebee integration
4. **License Generation**: Automatic license creation post-purchase
5. **Download**: Secure access to purchased digital products
6. **Management**: Users manage licenses through dashboard

### API Flow
1. **License Validation**: External products validate licenses via public API
2. **Usage Tracking**: Monitor license usage and activations
3. **Webhook Processing**: Handle Chargebee payment events
4. **Public Settings**: Dynamic site configuration via API

## 📁 Project Structure

```
CodeSeek/
├── backend/                    # Node.js backend application
│   ├── server.js              # Application entry point with middleware
│   ├── package.json           # Dependencies and scripts
│   ├── .env.example          # Environment variables template
│   ├── config/               # Configuration files
│   │   ├── database.js       # Sequelize database configuration
│   │   ├── redis.js         # Redis connection setup
│   │   └── chargebee.js     # Payment processing config
│   ├── models/              # Sequelize data models
│   │   ├── User.js          # User accounts and authentication
│   │   ├── Product.js       # Digital products and metadata
│   │   ├── License.js       # License generation and validation
│   │   ├── Setting.js       # Dynamic application settings
│   │   ├── Category.js      # Product categorization
│   │   ├── Activation.js    # License activation tracking
│   │   └── Subscription.js  # Chargebee subscription management
│   ├── controllers/         # Business logic handlers
│   │   ├── authController.js     # Authentication and authorization
│   │   ├── productController.js  # Product management
│   │   ├── licenseController.js  # License operations
│   │   ├── adminController.js    # Admin dashboard logic
│   │   └── webhookController.js  # Chargebee webhook handling
│   ├── routes/             # Route definitions
│   │   ├── api.js         # Protected API routes (auth required)
│   │   ├── web.js         # Public web routes (marketplace)
│   │   ├── public.js      # Public API routes (license validation)
│   │   └── admin.js       # Admin dashboard routes
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js        # Authentication middleware
│   │   ├── validation.js  # Input validation
│   │   └── security.js    # Security headers (CSP, CORS)
│   ├── utils/             # Utility functions
│   │   ├── emailService.js    # Email sending utilities
│   │   ├── licenseGenerator.js # License key generation
│   │   └── fileUpload.js      # File handling utilities
│   └── migrations/        # Database migration files
│
frontend/                      # Static frontend files
├── public/                   # Public marketplace assets
│   ├── css/                 # Stylesheets with responsive design
│   │   ├── main.css        # Main marketplace styles
│   │   ├── admin.css       # Admin dashboard styles
│   │   └── responsive.css  # Mobile-first responsive styles
│   ├── js/                 # JavaScript files (ES6+)
│   │   ├── main.js         # Main marketplace functionality
│   │   ├── admin.js        # Admin dashboard scripts
│   │   ├── cart.js         # Shopping cart management
│   │   └── license.js      # License management utilities
│   └── images/             # Image assets and uploads
├── admin/                   # Admin dashboard pages
│   ├── dashboard.html      # Main admin dashboard
│   ├── products.html       # Product management
│   ├── users.html          # User management
│   ├── licenses.html       # License overview
│   ├── settings.html       # Site configuration
│   └── billing.html        # Billing and invoices
├── user/                    # User dashboard pages
│   ├── dashboard.html      # User dashboard
│   ├── licenses.html       # User license management
│   ├── manage-license.html # Individual license details
│   ├── billing.html        # User billing history
│   └── included-products.html # Products included in licenses
├── index.html              # Homepage/marketplace
├── products.html           # Product listing page
├── product-detail.html     # Individual product page
├── cart.html              # Shopping cart
├── checkout.html          # Checkout process
├── login.html             # User authentication
└── register.html          # User registration
│
├── .gitignore             # Git ignore rules for security
├── README.md              # Project documentation
├── ROADMAP.md             # Development roadmap
└── package.json           # Root package configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Git
- PM2 (for production)
- Nginx (for reverse proxy)

### Local Development Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:WesleyMarinho/codeseek.git
   cd codeseek
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database, Redis, and Chargebee credentials
   ```

4. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb codeseek
   
   # Run migrations to create tables
   npm run migrate
   
   # Optional: Seed with sample data
   npm run seed
   ```

5. **Redis setup**
   ```bash
   # Make sure Redis is running
   redis-server
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Marketplace: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3000/admin`
   - User Dashboard: `http://localhost:3000/user`
   - API Documentation: `http://localhost:3000/api/docs`

## 🖥️ VPS Production Deployment

### System Requirements
- Ubuntu 20.04+ or CentOS 8+
- 2GB+ RAM
- 20GB+ Storage
- Root or sudo access

### Step 1: Server Preparation

#### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
# For CentOS: sudo yum update -y
```

#### Install essential packages
```bash
sudo apt install -y curl wget git build-essential
# For CentOS: sudo yum groupinstall -y "Development Tools"
```

### Step 2: Install Node.js 18+

#### Using NodeSource repository (recommended)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

#### Alternative: Using NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18
```

### Step 3: Install PostgreSQL 14+

#### Ubuntu/Debian
```bash
# Add PostgreSQL official repository
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql-14 postgresql-client-14

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### CentOS/RHEL
```bash
# Install PostgreSQL repository
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL
sudo yum install -y postgresql14-server postgresql14

# Initialize and start
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb
sudo systemctl start postgresql-14
sudo systemctl enable postgresql-14
```

#### Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE codeseek;
CREATE USER codeseek_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE codeseek TO codeseek_user;
\q

# Configure authentication (edit pg_hba.conf)
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add line: local   codeseek   codeseek_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 4: Install Redis 6+

#### Ubuntu/Debian
```bash
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Uncomment and set: requireauth your_redis_password
# Set: bind 127.0.0.1

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

#### CentOS/RHEL
```bash
# Enable EPEL repository
sudo yum install -y epel-release

# Install Redis
sudo yum install -y redis

# Start and enable Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### Step 5: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
# Follow the instructions shown to run the generated command
```

### Step 6: Install Nginx (Reverse Proxy)

#### Ubuntu/Debian
```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### CentOS/RHEL
```bash
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 7: Deploy Application

#### Clone and setup project
```bash
# Create application directory
sudo mkdir -p /var/www/codeseek
sudo chown $USER:$USER /var/www/codeseek

# Clone repository
cd /var/www/codeseek
git clone https://github.com/WesleyMarinho/codeseek.git .

# Install dependencies
cd backend
npm install --production
```

#### Configure environment
```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

**Production .env configuration:**
```env
# Application Settings
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-super-secure-session-secret-here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeseek
DB_USER=codeseek_user
DB_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Chargebee (if using)
CHARGEBEE_SITE=your-chargebee-site
CHARGEBEE_API_KEY=your-chargebee-api-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourdomain.com

# Security
CSP_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
```

#### Setup database
```bash
# Run database migrations
npm run migrate

# Optional: Seed with initial data
npm run seed
```

### Step 8: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/codeseek
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (add your SSL certificates)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location /public {
        alias /var/www/codeseek/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # File upload size limit
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/codeseek_access.log;
    error_log /var/log/nginx/codeseek_error.log;
}
```

#### Enable site and restart Nginx
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 9: Domain Configuration and DNS Setup

#### Configure DNS Records
Before setting up SSL, you need to point your domain to your server:

**Required DNS Records:**
```
# A Records (point to your server's IP address)
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600

# Optional: CNAME for subdomains
Type: CNAME
Name: api
Value: yourdomain.com
TTL: 3600
```

#### DNS Provider Instructions

**Cloudflare:**
1. Login to Cloudflare dashboard
2. Select your domain
3. Go to DNS > Records
4. Add A record: `@` pointing to `YOUR_SERVER_IP`
5. Add A record: `www` pointing to `YOUR_SERVER_IP`
6. Set Proxy status to "DNS only" (gray cloud) initially

**Namecheap:**
1. Login to Namecheap account
2. Go to Domain List > Manage
3. Advanced DNS tab
4. Add A Record: Host `@`, Value `YOUR_SERVER_IP`
5. Add A Record: Host `www`, Value `YOUR_SERVER_IP`

**GoDaddy:**
1. Login to GoDaddy account
2. Go to My Products > DNS
3. Add A record: Name `@`, Value `YOUR_SERVER_IP`
4. Add A record: Name `www`, Value `YOUR_SERVER_IP`

#### Verify DNS Propagation
```bash
# Check DNS propagation (may take 24-48 hours)
nslookup yourdomain.com
dig yourdomain.com

# Online tools for checking:
# https://www.whatsmydns.net/
# https://dnschecker.org/
```

### Step 10: Setup SSL Certificate (Let's Encrypt)

#### Install Certbot
```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx

# Alternative: Snap installation (works on all distributions)
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

#### Obtain SSL Certificate
```bash
# Make sure your domain is pointing to the server first!
# Test with: curl -I http://yourdomain.com

# Obtain certificate for your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# 1. Enter email address for notifications
# 2. Agree to terms of service
# 3. Choose whether to share email with EFF
# 4. Select redirect option (recommended: redirect HTTP to HTTPS)
```

#### Setup Automatic Certificate Renewal
```bash
# Test renewal process
sudo certbot renew --dry-run

# Setup automatic renewal (multiple options)

# Option 1: Crontab (recommended)
sudo crontab -e
# Add line: 0 12 * * * /usr/bin/certbot renew --quiet

# Option 2: Systemd timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Option 3: Custom script with notifications
sudo nano /usr/local/bin/certbot-renew.sh
```

**Custom renewal script with notifications:**
```bash
#!/bin/bash
LOG_FILE="/var/log/certbot-renew.log"
EMAIL="admin@yourdomain.com"

# Attempt renewal
/usr/bin/certbot renew --quiet >> $LOG_FILE 2>&1

if [ $? -eq 0 ]; then
    echo "$(date): SSL certificates renewed successfully" >> $LOG_FILE
    # Reload nginx to use new certificates
    systemctl reload nginx
else
    echo "$(date): SSL certificate renewal failed" >> $LOG_FILE
    # Send notification email (requires mailutils)
    echo "SSL certificate renewal failed on $(hostname)" | mail -s "SSL Renewal Failed" $EMAIL
fi
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/certbot-renew.sh

# Add to crontab
sudo crontab -e
# Add line: 0 12 * * * /usr/local/bin/certbot-renew.sh
```

#### SSL Configuration Verification
```bash
# Test SSL configuration
sudo nginx -t

# Check certificate details
sudo certbot certificates

# Test SSL online
# https://www.ssllabs.com/ssltest/
# https://www.digicert.com/help/
```

### Step 10: Start Application with PM2

```bash
# Navigate to backend directory
cd /var/www/codeseek/backend

# Start application with PM2
pm2 start server-robust.js --name "codeseek" --instances max

# Save PM2 configuration
pm2 save

# Setup PM2 monitoring (optional)
pm2 install pm2-logrotate
```

### Step 11: Security Hardening

#### SSH Hardening
```bash
# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

**Recommended SSH security settings:**
```bash
# Change default port (optional but recommended)
Port 2222

# Disable root login
PermitRootLogin no

# Use key-based authentication only
PasswordAuthentication no
PubkeyAuthentication yes

# Limit login attempts
MaxAuthTries 3
MaxStartups 3

# Disable empty passwords
PermitEmptyPasswords no

# Disable X11 forwarding if not needed
X11Forwarding no

# Set login grace time
LoginGraceTime 60

# Allow specific users only (replace with your username)
AllowUsers yourusername

# Disable unused authentication methods
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no
```

```bash
# Restart SSH service
sudo systemctl restart sshd

# Test SSH connection before closing current session!
# Open new terminal and test: ssh -p 2222 yourusername@yourserver
```

#### Configure Firewall

```bash
# Ubuntu UFW
# Allow SSH (adjust port if changed)
sudo ufw allow 22/tcp
# If you changed SSH port to 2222:
# sudo ufw allow 2222/tcp

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow specific application ports if needed
# sudo ufw allow 3000/tcp  # Node.js app (only if direct access needed)

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

```bash
# CentOS/RHEL Firewalld
# Allow SSH
sudo firewall-cmd --permanent --add-service=ssh
# If you changed SSH port:
# sudo firewall-cmd --permanent --add-port=2222/tcp

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

#### Additional Security Measures

**Install and configure Fail2Ban:**
```bash
# Ubuntu/Debian
sudo apt install -y fail2ban

# CentOS/RHEL
sudo yum install -y epel-release
sudo yum install -y fail2ban

# Create custom configuration
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban configuration:**
```ini
[DEFAULT]
# Ban time in seconds (1 hour)
bantime = 3600

# Find time window (10 minutes)
findtime = 600

# Max retry attempts
maxretry = 3

# Ignore local IPs
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
# If you changed SSH port:
# port = 2222
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

```bash
# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

**Setup automatic security updates:**
```bash
# Ubuntu/Debian
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# CentOS/RHEL
sudo yum install -y yum-cron
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

### Step 12: Setup Monitoring and Logs

```bash
# Create log rotation for application
sudo nano /etc/logrotate.d/codeseek
```

**Log rotation configuration:**
```
/var/www/codeseek/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload codeseek
    endscript
}
```

### Step 13: Comprehensive Backup Strategy

#### Database Backup Script
```bash
# Create backup directory
sudo mkdir -p /var/backups/codeseek/{database,files,configs}

# Create comprehensive backup script
sudo nano /usr/local/bin/codeseek-backup.sh
```

**Enhanced backup script:**
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/codeseek"
APP_DIR="/var/www/codeseek"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
S3_BUCKET="your-backup-bucket"  # Optional: for cloud backup
EMAIL="admin@yourdomain.com"

# Create backup directories
mkdir -p $BACKUP_DIR/{database,files,configs,logs}

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a $BACKUP_DIR/backup.log
}

log_message "Starting backup process"

# 1. Database Backup
log_message "Backing up database"
pg_dump -h localhost -U codeseek_user codeseek | gzip > $BACKUP_DIR/database/db_backup_$DATE.sql.gz

if [ $? -eq 0 ]; then
    log_message "Database backup completed successfully"
else
    log_message "Database backup failed"
    echo "Database backup failed on $(hostname)" | mail -s "Backup Failed" $EMAIL
    exit 1
fi

# 2. Application Files Backup
log_message "Backing up application files"
tar -czf $BACKUP_DIR/files/app_backup_$DATE.tar.gz -C $APP_DIR \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='.git' \
    .

# 3. Configuration Files Backup
log_message "Backing up configuration files"
tar -czf $BACKUP_DIR/configs/config_backup_$DATE.tar.gz \
    /etc/nginx/sites-available/codeseek \
    /etc/ssl/certs/ \
    /etc/ssl/private/ \
    $APP_DIR/backend/.env \
    /etc/postgresql/*/main/postgresql.conf \
    /etc/redis/redis.conf \
    2>/dev/null

# 4. Application Logs Backup
log_message "Backing up application logs"
tar -czf $BACKUP_DIR/logs/logs_backup_$DATE.tar.gz $APP_DIR/backend/logs/ 2>/dev/null

# 5. Redis Backup (if using persistence)
if [ -f /var/lib/redis/dump.rdb ]; then
    log_message "Backing up Redis data"
    cp /var/lib/redis/dump.rdb $BACKUP_DIR/database/redis_backup_$DATE.rdb
fi

# 6. Upload to cloud storage (optional)
if command -v aws &> /dev/null && [ ! -z "$S3_BUCKET" ]; then
    log_message "Uploading backups to S3"
    aws s3 sync $BACKUP_DIR s3://$S3_BUCKET/codeseek-backups/$(date +%Y/%m/%d)/
fi

# 7. Cleanup old backups
log_message "Cleaning up old backups"
find $BACKUP_DIR -name "*backup*" -mtime +$RETENTION_DAYS -delete

# 8. Generate backup report
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
log_message "Backup completed. Total size: $BACKUP_SIZE"

# Send success notification
echo "Backup completed successfully on $(hostname). Size: $BACKUP_SIZE" | \
    mail -s "Backup Successful" $EMAIL

log_message "Backup process finished"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/codeseek-backup.sh

# Setup daily backup cron
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/codeseek-backup.sh
```

#### Disaster Recovery Procedures

**Database Recovery:**
```bash
# Stop application
pm2 stop codeseek

# Restore database from backup
gunzip -c /var/backups/codeseek/database/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
    psql -h localhost -U codeseek_user -d codeseek

# Restore Redis data (if backed up)
sudo systemctl stop redis
sudo cp /var/backups/codeseek/database/redis_backup_YYYYMMDD_HHMMSS.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo systemctl start redis

# Start application
pm2 start codeseek
```

**Application Recovery:**
```bash
# Extract application backup
cd /var/www
sudo rm -rf codeseek_old
sudo mv codeseek codeseek_old
sudo mkdir codeseek
sudo tar -xzf /var/backups/codeseek/files/app_backup_YYYYMMDD_HHMMSS.tar.gz -C codeseek
sudo chown -R $USER:$USER codeseek

# Restore configuration
sudo tar -xzf /var/backups/codeseek/configs/config_backup_YYYYMMDD_HHMMSS.tar.gz -C /

# Reinstall dependencies
cd /var/www/codeseek/backend
npm install --production

# Restart services
sudo systemctl restart nginx
pm2 restart codeseek
```

#### Backup Monitoring

```bash
# Create backup monitoring script
sudo nano /usr/local/bin/backup-monitor.sh
```

**Backup monitoring script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/codeseek"
EMAIL="admin@yourdomain.com"
MAX_AGE_HOURS=25  # Alert if backup is older than 25 hours

# Check if recent backup exists
LATEST_BACKUP=$(find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime -1 | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "No recent database backup found!" | mail -s "Backup Alert" $EMAIL
else
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    echo "Latest backup: $LATEST_BACKUP (Size: $BACKUP_SIZE)" | \
        mail -s "Backup Status OK" $EMAIL
fi
```

```bash
# Make executable and schedule
sudo chmod +x /usr/local/bin/backup-monitor.sh
sudo crontab -e
# Add line: 0 8 * * * /usr/local/bin/backup-monitor.sh
```

### Step 14: Health Monitoring

```bash
# Create health check script
sudo nano /usr/local/bin/codeseek-health.sh
```

**Health check script:**
```bash
#!/bin/bash
HEALTH_URL="https://yourdomain.com/health"
LOG_FILE="/var/log/codeseek-health.log"

# Check application health
response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -eq 200 ]; then
    echo "$(date): Application is healthy" >> $LOG_FILE
else
    echo "$(date): Application health check failed (HTTP $response)" >> $LOG_FILE
    # Restart application if unhealthy
    pm2 restart codeseek
    echo "$(date): Application restarted" >> $LOG_FILE
fi
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/codeseek-health.sh

# Setup health check every 5 minutes
sudo crontab -e
# Add line: */5 * * * * /usr/local/bin/codeseek-health.sh
```

### Useful Production Commands

```bash
# PM2 Management
pm2 status                    # Check application status
pm2 logs codeseek            # View application logs
pm2 restart codeseek         # Restart application
pm2 reload codeseek          # Zero-downtime reload
pm2 stop codeseek            # Stop application
pm2 delete codeseek          # Remove from PM2

# Database Operations
pg_dump -h localhost -U codeseek_user codeseek > backup.sql
psql -h localhost -U codeseek_user codeseek < backup.sql

# Nginx Operations
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload configuration
sudo systemctl restart nginx  # Restart Nginx

# SSL Certificate Renewal
sudo certbot renew --dry-run  # Test renewal
sudo certbot renew            # Renew certificates

# System Monitoring
htop                          # System resources
sudo journalctl -u nginx      # Nginx logs
sudo tail -f /var/log/nginx/codeseek_error.log  # Nginx error logs
```

### Advanced Troubleshooting Guide

#### Application Issues

**Application won't start:**
```bash
# Check PM2 logs with details
pm2 logs codeseek --lines 100
pm2 describe codeseek

# Check environment variables
cd /var/www/codeseek/backend
node -e "require('dotenv').config(); console.log('NODE_ENV:', process.env.NODE_ENV);"
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST);"

# Test application startup manually
cd /var/www/codeseek/backend
NODE_ENV=production node server-robust.js

# Check file permissions
ls -la /var/www/codeseek/backend/
sudo chown -R $USER:$USER /var/www/codeseek
```

**Memory issues:**
```bash
# Check system memory
free -h
htop

# Check Node.js memory usage
pm2 monit

# Increase Node.js memory limit
pm2 delete codeseek
pm2 start server-robust.js --name "codeseek" --node-args="--max-old-space-size=2048"
```

#### Network and SSL Issues

**502 Bad Gateway:**
```bash
# Check if application is running
pm2 status
netstat -tlnp | grep :3000

# Check Nginx configuration
sudo nginx -t
sudo nginx -T | grep -A 10 -B 10 "server_name yourdomain.com"

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/codeseek_error.log

# Test direct connection to app
curl -I http://localhost:3000
```

**SSL Certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate expiration
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | \
    openssl x509 -noout -dates

# Force certificate renewal
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

**DNS issues:**
```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com
dig @8.8.8.8 yourdomain.com

# Check from different locations
curl -H "Host: yourdomain.com" http://YOUR_SERVER_IP
```

#### Database Issues

**Database connection problems:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Test database connection
psql -h localhost -U codeseek_user -d codeseek -c "SELECT version();"

# Check database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='codeseek';"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('codeseek'));"
```

**Database performance issues:**
```bash
# Check slow queries
sudo -u postgres psql -d codeseek -c "
    SELECT query, mean_time, calls 
    FROM pg_stat_statements 
    ORDER BY mean_time DESC 
    LIMIT 10;"

# Analyze table statistics
sudo -u postgres psql -d codeseek -c "ANALYZE;"

# Check database locks
sudo -u postgres psql -d codeseek -c "
    SELECT * FROM pg_locks 
    WHERE NOT granted;"
```

#### Redis Issues

**Redis connection problems:**
```bash
# Check Redis status
sudo systemctl status redis
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Test Redis with password
redis-cli -a your_redis_password ping

# Check Redis memory usage
redis-cli info memory

# Check Redis connections
redis-cli info clients
```

#### Performance Monitoring

**System performance:**
```bash
# CPU and memory usage
htop
vmstat 1 5
iostat -x 1 5

# Disk usage
df -h
du -sh /var/www/codeseek
du -sh /var/log

# Network connections
netstat -tulpn
ss -tulpn
```

**Application performance:**
```bash
# PM2 monitoring
pm2 monit
pm2 logs codeseek --lines 50

# Check application metrics
curl -s http://localhost:3000/health | jq

# Monitor response times
for i in {1..10}; do
    time curl -s -o /dev/null http://localhost:3000
done
```

#### Log Analysis

**Centralized log checking:**
```bash
# Application logs
tail -f /var/www/codeseek/backend/logs/combined.log
tail -f /var/www/codeseek/backend/logs/error.log

# System logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
sudo journalctl -u redis -f

# Search for errors
grep -r "ERROR" /var/www/codeseek/backend/logs/
grep -r "500" /var/log/nginx/
```

#### Emergency Procedures

**Quick restart sequence:**
```bash
#!/bin/bash
# Save as /usr/local/bin/emergency-restart.sh

echo "Starting emergency restart..."

# Stop application
pm2 stop codeseek

# Restart services
sudo systemctl restart redis
sudo systemctl restart postgresql
sudo systemctl restart nginx

# Wait for services to start
sleep 10

# Start application
pm2 start codeseek

# Check status
pm2 status
curl -I http://localhost:3000/health

echo "Emergency restart completed"
```

**Rollback procedure:**
```bash
#!/bin/bash
# Save as /usr/local/bin/rollback.sh

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 YYYYMMDD_HHMMSS"
    exit 1
fi

echo "Rolling back to backup: $BACKUP_DATE"

# Stop application
pm2 stop codeseek

# Restore database
gunzip -c /var/backups/codeseek/database/db_backup_$BACKUP_DATE.sql.gz | \
    psql -h localhost -U codeseek_user -d codeseek

# Restore application files
cd /var/www
sudo mv codeseek codeseek_failed
sudo mkdir codeseek
sudo tar -xzf /var/backups/codeseek/files/app_backup_$BACKUP_DATE.tar.gz -C codeseek
sudo chown -R $USER:$USER codeseek

# Restart application
cd /var/www/codeseek/backend
npm install --production
pm2 start codeseek

echo "Rollback completed"
 ```

### Useful Commands Reference

#### PM2 Management
```bash
# Application management
pm2 start server-robust.js --name "codeseek"
pm2 stop codeseek
pm2 restart codeseek
pm2 reload codeseek  # Zero-downtime restart
pm2 delete codeseek

# Monitoring
pm2 status
pm2 logs codeseek
pm2 logs codeseek --lines 100
pm2 monit
pm2 describe codeseek

# Save PM2 configuration
pm2 save
pm2 startup  # Generate startup script

# Update PM2
npm install -g pm2@latest
pm2 update
```

#### System Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up disk space
sudo apt autoremove -y
sudo apt autoclean
sudo journalctl --vacuum-time=7d

# Check disk usage
df -h
du -sh /var/log/*
du -sh /var/www/codeseek

# Monitor system resources
htop
iotop
netstat -tulpn
```

#### Database Maintenance
```bash
# PostgreSQL maintenance
sudo -u postgres psql -d codeseek -c "VACUUM ANALYZE;"
sudo -u postgres psql -d codeseek -c "REINDEX DATABASE codeseek;"

# Check database statistics
sudo -u postgres psql -d codeseek -c "SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del FROM pg_stat_user_tables;"

# Redis maintenance
redis-cli BGSAVE
redis-cli FLUSHDB  # Clear current database (use with caution)
redis-cli CONFIG GET '*'
```

#### SSL Certificate Management
```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiration
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### Log Management
```bash
# Rotate logs manually
sudo logrotate -f /etc/logrotate.conf

# Check log sizes
sudo du -sh /var/log/*
sudo du -sh /var/www/codeseek/backend/logs/*

# Archive old logs
sudo find /var/log -name "*.log" -mtime +30 -exec gzip {} \;

# Real-time log monitoring
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
tail -f /var/www/codeseek/backend/logs/combined.log
```

### Performance Optimization Tips

#### Node.js Optimization
```bash
# Increase memory limit
pm2 start server-robust.js --name "codeseek" --node-args="--max-old-space-size=2048"

# Enable cluster mode
pm2 start server-robust.js --name "codeseek" -i max

# Monitor memory usage
pm2 monit
node --inspect server-robust.js  # For debugging
```

#### Database Optimization
```bash
# PostgreSQL configuration tuning
sudo nano /etc/postgresql/14/main/postgresql.conf

# Key settings to adjust:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# work_mem = 4MB
# maintenance_work_mem = 64MB
# max_connections = 100

# Apply changes
sudo systemctl restart postgresql
```

#### Redis Optimization
```bash
# Redis configuration
sudo nano /etc/redis/redis.conf

# Key settings:
# maxmemory 512mb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

# Apply changes
sudo systemctl restart redis
```

#### Nginx Optimization
```bash
# Nginx performance tuning
sudo nano /etc/nginx/nginx.conf

# Key settings:
# worker_processes auto;
# worker_connections 1024;
# keepalive_timeout 65;
# gzip on;
# gzip_types text/plain text/css application/json application/javascript;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Support and Documentation

#### Getting Help
- **Application Logs**: `/var/www/codeseek/backend/logs/`
- **System Logs**: `/var/log/`
- **Configuration Files**: `/var/www/codeseek/backend/.env`
- **Nginx Config**: `/etc/nginx/sites-available/codeseek`

#### Health Check Endpoints
- **Application Health**: `https://yourdomain.com/health`
- **API Health**: `https://yourdomain.com/api/health`
- **Database Status**: Check via health endpoints
- **Redis Status**: Check via health endpoints

#### Emergency Contacts
```bash
# Create emergency contact script
sudo nano /usr/local/bin/emergency-contact.sh
```

**Emergency contact script:**
```bash
#!/bin/bash
EMAIL="admin@yourdomain.com"
SUBJECT="CodeSeek Emergency Alert"
SERVER_IP=$(curl -s ifconfig.me)
TIMESTAMP=$(date)

MESSAGE="Emergency alert from CodeSeek server:
Server IP: $SERVER_IP
Timestamp: $TIMESTAMP
Issue: $1

Please check the server immediately."

echo "$MESSAGE" | mail -s "$SUBJECT" "$EMAIL"
echo "Emergency alert sent to $EMAIL"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/emergency-contact.sh

# Usage
/usr/local/bin/emergency-contact.sh "Database connection failed"
```

#### Documentation Links
- **Node.js**: https://nodejs.org/docs/
- **Express.js**: https://expressjs.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Redis**: https://redis.io/documentation
- **PM2**: https://pm2.keymetrics.io/docs/
- **Nginx**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes and version history.

Your CodeSeek application should now be running in production at `https://yourdomain.com`!

### Environment Variables

Create a `.env` file in the `backend/` directory with the following configuration:

```env
# Application Settings
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secure-session-secret-here
JWT_SECRET=your-secure-jwt-secret-here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeseek
DB_USER=postgres
DB_PASS=your-database-password
DB_DIALECT=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=
REDIS_DB=0

# Chargebee Payment Processing
CHARGEBEE_SITE=your-chargebee-site
CHARGEBEE_API_KEY=your-chargebee-api-key
CHARGEBEE_WEBHOOK_SECRET=your-webhook-secret

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@codeseek.com
FROM_NAME=CodeSeek

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=.zip,.rar,.7z,.tar.gz

# Security Settings
CSP_ENABLED=true
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Admin Settings
ADMIN_EMAIL=admin@codeseek.com
DEFAULT_ADMIN_PASSWORD=change-this-password
```

## 📚 API Documentation

### Public API

#### License Validation
```http
POST /api/public/validate-license
Content-Type: application/json

{
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "domain": "example.com"
}
```

#### Public Settings
```http
GET /api/public/settings
```

### Protected API

#### User Licenses
```http
GET /api/user/licenses
Authorization: Bearer <token>
```

#### Admin Operations
```http
GET /api/admin/products
POST /api/admin/products
PUT /api/admin/products/:id
DELETE /api/admin/products/:id
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run watch        # Watch for file changes

# Database Operations
npm run migrate      # Run all pending migrations
npm run migrate:undo # Rollback last migration
npm run seed         # Seed database with sample data
npm run db:reset     # Reset database (drop + migrate + seed)

# Code Quality
npm test             # Run test suite
npm run lint         # Run ESLint code analysis
npm run format       # Format code with Prettier
npm run validate     # Run all validation checks

# Production
npm run build        # Build for production
npm run pm2:start    # Start with PM2 process manager
npm run pm2:stop     # Stop PM2 processes
```

### Database Operations

```bash
# Create migration
npm run migration:create -- --name add-new-field

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:undo
```

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed development roadmap and future plans.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 🐛 Issues: [GitHub Issues](https://github.com/WesleyMarinho/codeseek/issues)
- 📖 Documentation: [Project Wiki](https://github.com/WesleyMarinho/codeseek/wiki)
- 🗺️ Roadmap: [ROADMAP.md](./ROADMAP.md)
- 💬 Discussions: [GitHub Discussions](https://github.com/WesleyMarinho/codeseek/discussions)

## 🏆 Current Status

- ✅ **Core Marketplace**: Fully functional with product management
- ✅ **License System**: Automated generation and validation
- ✅ **Payment Integration**: Chargebee subscription management
- ✅ **Security**: CSP implementation and secure event handling
- ✅ **Admin Dashboard**: Comprehensive management tools
- ✅ **Responsive Design**: Mobile-first approach
- 🔄 **API Documentation**: In progress
- ⏳ **CI/CD Pipeline**: Planned for Q1 2025

---

*Last updated: January 2025 - Version 3.0*

