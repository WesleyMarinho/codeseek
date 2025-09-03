# CodeSeek - Digital Marketplace Platform

CodeSeek is a modern, secure digital marketplace platform built with Node.js, designed for selling digital products, managing licenses, and handling subscriptions with integrated payment processing.

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

## 🔒 Security Features

- **Content Security Policy (CSP)**: Implemented strict CSP headers to prevent XSS attacks
- **Secure Event Handling**: All inline event handlers replaced with secure addEventListener patterns
- **Session Security**: Redis-based session management with secure cookies
- **Input Validation**: Comprehensive server-side validation and sanitization
- **CSRF Protection**: Built-in CSRF token validation
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries

## 🏗️ Technology Stack

- **Backend**: Node.js 18+ with Express.js 4.x framework
- **Database**: PostgreSQL 14+ with Sequelize ORM 6.x
- **Session Management**: Redis 6+ for session storage and caching
- **Frontend**: HTML5, CSS3, Vanilla JavaScript with modern ES6+ features
- **Security**: Content Security Policy (CSP), secure event handling
- **Payment Processing**: Chargebee API integration for subscriptions
- **Email**: SMTP with customizable HTML templates
- **Development**: Nodemon for hot reloading, ESLint for code quality

## 📁 Project Structure

```
CodeSeek/
├── backend/                    # Node.js backend application
│   ├── server.js              # Application entry point with middleware
│   ├── package.json           # Dependencies and scripts
│   ├── .env.example          # Environment variables template
│   ├── config/               # Configuration files
│   ├── models/              # Sequelize data models
│   ├── controllers/         # Business logic handlers
│   ├── routes/             # Route definitions
│   ├── middleware/         # Custom middleware
│   ├── utils/             # Utility functions
│   └── migrations/        # Database migration files
│
├── frontend/                  # Static frontend files
│   ├── admin/               # Admin dashboard pages
│   ├── dashboard/           # User dashboard pages
│   ├── checkout/            # Checkout process pages
│   ├── public/              # Public assets (CSS, JS, images)
│   └── *.html              # Main pages (index, products, etc.)
│
├── .gitignore             # Git ignore rules for security
├── README.md              # Project documentation
├── ROADMAP.md             # Development roadmap
├── docker-compose.yml     # Docker configuration
└── Dockerfile             # Docker build instructions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Git
- Ubuntu/Debian Linux (for automated installation)

### 🎯 One-Line Automated Installation (Recommended)

For production deployment on Ubuntu/Debian servers:

```bash
# Complete automated installation with domain and admin email
curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/one-line-install.sh | sudo bash -s -- yourdomain.com admin@yourdomain.com
```

**What the automated installer does:**
- ✅ Installs all system dependencies (Node.js, PostgreSQL, Redis, Nginx)
- ✅ Creates dedicated `codeseek` user for security
- ✅ Clones and configures the application
- ✅ Sets up SSL certificates with Let's Encrypt
- ✅ Configures Nginx reverse proxy
- ✅ Creates systemd service for auto-start
- ✅ Runs security hardening
- ✅ Provides post-installation verification

**Installation Parameters:**
- `DOMAIN`: Your domain name (required)
- `ADMIN_EMAIL`: Admin email for SSL certificates (required)
- `DB_PASSWORD`: Custom database password (optional)
- `APP_SECRET`: Custom app secret (optional)

### 📋 Available Installation Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `one-line-install.sh` | Complete automated installation | Production deployment |
| `install-auto.sh` | Interactive installation with prompts | Custom configurations |
| `pre-install-check.sh` | System requirements verification | Pre-deployment check |
| `post-install-check.sh` | Installation verification | Post-deployment validation |
| `troubleshoot.sh` | Diagnostic and repair tools | Issue resolution |
| `setup-scripts.sh` | Script management utility | Development/maintenance |

### 🔧 Manual Local Development Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/WesleyMarinho/codeseek.git
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
   - User Dashboard: `http://localhost:3000/dashboard`

### 🔍 Post-Installation Verification

After installation, verify your deployment:

```bash
# Run post-installation checks
sudo bash /opt/codeseek/post-install-check.sh

# Check application status
sudo systemctl status codeseek

# View application logs
sudo journalctl -u codeseek -f
```

### 🛠️ Troubleshooting Common Issues

#### Services with Pending Restart
If you see services requiring restart after installation:

```bash
# Restart system services
sudo systemctl restart NetworkManager.service
sudo systemctl restart getty@tty1.service
sudo systemctl restart lightdm.service
sudo systemctl restart networkd-dispatcher.service
sudo systemctl restart systemd-logind.service
sudo systemctl restart unattended-upgrades.service

# Restart user sessions if needed
sudo systemctl restart user@$(id -u).service
```

#### Repository Clone Issues
If you encounter "directory not empty" errors:

```bash
# The installer automatically handles this, but for manual fixes:
sudo rm -rf /opt/codeseek/*
sudo rm -rf /opt/codeseek/.[!.]*
sudo -u codeseek git clone https://github.com/WesleyMarinho/codeseek.git /opt/codeseek
```

#### Application Diagnostics
Run comprehensive diagnostics:

```bash
# Full system troubleshooting
sudo bash /opt/codeseek/troubleshoot.sh

# Application-specific diagnostics
cd /opt/codeseek/backend && sudo -u codeseek node diagnose.js
```

## 🐳 Docker Setup

For quick setup using Docker:

```bash
# Clone and start with Docker Compose
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek
docker-compose up --build
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

# Database Operations
npm run migrate      # Run all pending migrations
npm run seed         # Seed database with sample data
npm run db:reset     # Reset database (drop + migrate + seed)

# Code Quality
npm test             # Run test suite
npm run lint         # Run ESLint code analysis
npm run format       # Format code with Prettier
```

## 🗺️ Roadmap

### Current Development Focus
- ✅ **Core Marketplace**: Fully functional with product management
- ✅ **License System**: Automated generation and validation
- ✅ **Payment Integration**: Chargebee subscription management
- ✅ **Security**: CSP implementation and secure event handling
- ✅ **Admin Dashboard**: Comprehensive management tools
- ✅ **Automated Deployment**: One-line installation system
- 🔄 **API Documentation**: In progress
- ⏳ **CI/CD Pipeline**: Planned for Q1 2025
- ⏳ **Multi-language Support**: Planned for Q2 2025

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- 🐛 **Issues**: [GitHub Issues](https://github.com/WesleyMarinho/codeseek/issues)
- 📖 **Documentation**: [Project Wiki](https://github.com/WesleyMarinho/codeseek/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/WesleyMarinho/codeseek/discussions)

### Troubleshooting Tools
- 🔧 **System Check**: `sudo bash /opt/codeseek/pre-install-check.sh`
- ✅ **Post-Install Verification**: `sudo bash /opt/codeseek/post-install-check.sh`
- 🛠️ **Troubleshooting**: `sudo bash /opt/codeseek/troubleshoot.sh`
- 📊 **Application Diagnostics**: `cd /opt/codeseek/backend && sudo -u codeseek node diagnose.js`

## 🏆 Current Status

- ✅ **Core Marketplace**: Fully functional with product management
- ✅ **License System**: Automated generation and validation
- ✅ **Payment Integration**: Chargebee subscription management
- ✅ **Security**: CSP implementation and secure event handling
- ✅ **Admin Dashboard**: Comprehensive management tools
- ✅ **Automated Deployment**: One-line installation system
- ✅ **Production Ready**: Complete deployment automation
- ✅ **Troubleshooting Tools**: Comprehensive diagnostic scripts
- ✅ **Responsive Design**: Mobile-first approach
- 🔄 **API Documentation**: In progress
- ⏳ **CI/CD Pipeline**: Planned for Q1 2025

### 🚀 Latest Updates (v1.0.0)
- **Automated Installation**: Complete one-line deployment system
- **Security Hardening**: Production-ready security configurations
- **Troubleshooting Suite**: Comprehensive diagnostic and repair tools
- **Documentation Consolidation**: Streamlined installation guides
- **Repository Corrections**: Fixed all deployment script URLs

---

*Last updated: January 2025 - Version 1.0.0*

