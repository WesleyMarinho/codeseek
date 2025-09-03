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

### 🎯 Production Installation

```bash
# One-line automated installation
curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/one-line-install.sh | sudo bash -s -- yourdomain.com admin@yourdomain.com
```

### 🔧 Development Setup

```bash
# Clone and install
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek
sudo bash install.sh
```

**For detailed installation instructions, see [README-INSTALL.md](README-INSTALL.md)**

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Ubuntu/Debian Linux (for automated installation)

## 🔧 Configuration

Key environment variables (see `.env.example`):

```bash
# Database
DB_HOST=localhost
DB_NAME=codeseek
DB_USER=codeseek
DB_PASSWORD=your_secure_password

# Application
APP_SECRET=your_app_secret_key
DOMAIN=yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Optional: Payment Integration
CHARGEBEE_SITE=your_site
CHARGEBEE_API_KEY=your_api_key
```

## 🚨 Troubleshooting

For issues and diagnostics:

```bash
# Run comprehensive diagnostics
bash troubleshoot.sh

# Check installation
bash post-install-check.sh

# View service logs
sudo journalctl -u codeseek -f
```

**For detailed troubleshooting, see [README-INSTALL.md](README-INSTALL.md)**

## 🐳 Docker Setup

```bash
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek
docker-compose up --build
```

## 📚 API Documentation

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/products` - List products
- `GET /api/products/:id` - Product details
- `GET /api/categories` - List categories
- `GET /api/search?q=query` - Search products

### Protected Endpoints
- `GET /api/admin/users` - User management (Admin)
- `POST /api/admin/products` - Product management (Admin)
- `GET /api/licenses` - User licenses
- `POST /api/licenses/validate` - License validation

## 🛠️ Development

```bash
npm run dev          # Development server
npm run start        # Production server
npm run migrate      # Database migrations
npm test             # Run tests
```

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](LICENSE).

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/WesleyMarinho/codeseek/issues)
- **Installation Guide**: [README-INSTALL.md](README-INSTALL.md)
- **Email**: support@codeseek.com

---

**CodeSeek V1** - Production-ready digital marketplace platform.

