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

### Local Development Installation

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

