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

### Installation

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

