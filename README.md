# Digital Server - Complete Digital Sales Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-6+-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-Proprietary-yellow.svg)](#)

## 📋 Project Overview

Digital Server is a comprehensive digital sales platform designed for managing digital products, licenses, and subscriptions. The system provides a complete solution for selling digital goods with automated license management, user authentication, payment processing, and administrative tools.

### Key Features

- **🔐 User Authentication & Authorization** - Secure login/registration with role-based access control
- **📦 Product Management** - Complete CRUD operations with media upload support
- **🎫 License Management** - Automated license generation and verification system
- **💳 Payment Processing** - Integrated with Chargebee for subscription management
- **🛒 Shopping Cart** - Session-based cart with checkout functionality
- **👥 User Dashboard** - Personal dashboard for license and subscription management
- **⚙️ Admin Panel** - Comprehensive administrative interface
- **📊 Analytics & Logging** - Structured logging with Winston
- **🔄 Real-time Updates** - Redis-powered session management

### Technology Stack

- **Backend**: Node.js 18+ with Express.js framework
- **Database**: PostgreSQL with Sequelize ORM
- **Cache/Sessions**: Redis with connect-redis
- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **File Upload**: Multer with Dropzone.js integration
- **Payment**: Chargebee integration for subscriptions
- **Security**: Helmet.js, bcryptjs password hashing
- **Logging**: Winston for structured logging

## 🚀 Installation Guide

### Prerequisites

Before installing Digital Server, ensure you have the following software installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (version 12 or higher) - [Download here](https://postgresql.org/download/)
- **Redis** (version 6 or higher) - [Download here](https://redis.io/download)
- **Git** - [Download here](https://git-scm.com/downloads)

### Step-by-Step Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/WesleyMarinho/Digital-Server.git
cd Digital-Server
```

#### 2. Install Dependencies

```bash
cd backend
npm install
```

#### 3. Database Setup

**Create PostgreSQL Database:**

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE digiserver_db;

-- Create user (optional)
CREATE USER digiserver_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE digiserver_db TO digiserver_user;
```

#### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your configurations
nano .env
```

#### 5. Initialize Database

```bash
# Setup database tables
npm run setup

# Seed initial data (optional)
npm run seed
```

#### 6. Start the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📦 Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|----------|
| express | ^4.21.2 | Web framework |
| sequelize | ^6.37.7 | PostgreSQL ORM |
| pg | ^8.16.3 | PostgreSQL client |
| redis | ^4.6.13 | Redis client |
| bcryptjs | ^2.4.3 | Password hashing |
| express-session | ^1.18.2 | Session management |
| connect-redis | ^6.1.3 | Redis session store |
| helmet | ^8.1.0 | Security middleware |
| winston | ^3.17.0 | Logging |
| multer | ^2.0.2 | File upload handling |
| dotenv | ^17.2.1 | Environment variables |
| axios | ^1.11.0 | HTTP client |
| chargebee | ^2.39.0 | Payment processing |
| nodemailer | ^7.0.5 | Email sending |
| node-cron | ^4.2.1 | Task scheduling |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|----------|
| nodemon | ^3.1.10 | Development auto-reload |

### Frontend Dependencies (CDN)

- **Tailwind CSS** - Utility-first CSS framework
- **Dropzone.js** - File upload interface
- **Chart.js** - Data visualization (admin panel)

## 🔧 Usage Instructions

### For End Users

#### 1. Account Registration
1. Navigate to `/register`
2. Fill in your details (username, email, password)
3. Verify your email address
4. Login with your credentials

#### 2. Browsing Products
1. Visit the products page at `/products`
2. Browse available digital products
3. View detailed product information
4. Add products to your cart

#### 3. Making Purchases
1. Review items in your cart at `/cart`
2. Proceed to checkout
3. Complete payment through Chargebee
4. Access your licenses in the dashboard

#### 4. Managing Licenses
1. Access your dashboard at `/dashboard`
2. View active licenses and subscriptions
3. Download purchased products
4. Manage license activations

### For Administrators

#### 1. Admin Access
1. Login with admin credentials
2. Navigate to `/admin`
3. Access administrative functions

#### 2. Product Management
1. Go to `/admin/products`
2. Create, edit, or delete products
3. Upload product files and media
4. Set pricing and categories

#### 3. User Management
1. Access `/admin/users`
2. View and manage user accounts
3. Assign roles and permissions
4. Monitor user activity

#### 4. License Management
1. Visit `/admin/licenses`
2. Generate new licenses
3. Monitor license usage
4. Handle license issues

### API Usage

#### License Verification API

```bash
# Verify a license key
GET /api/license/verify/{license_key}

# Response
{
  "success": true,
  "valid": true,
  "license": {
    "key": "LICENSE-KEY-HERE",
    "product": "Product Name",
    "status": "active",
    "expiresOn": "2024-12-31T23:59:59.000Z"
  }
}
```

#### User API Endpoints

```bash
# Get user licenses
GET /api/user/licenses

# Get user subscriptions
GET /api/user/subscriptions

# Update user profile
PUT /api/user/profile
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digiserver_db
DB_USER=postgres
DB_PASSWORD=your_database_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security Configuration
SESSION_SECRET=your_very_strong_session_secret_here
BCRYPT_ROUNDS=12

# Payment Configuration (Chargebee)
CHARGEBEE_SITE=your_chargebee_site
CHARGEBEE_API_KEY=your_chargebee_api_key
```

### Application Settings

The application includes a settings management system accessible through the admin panel:

#### Site Settings
- Site name and description
- Logo and branding
- Contact information
- Social media links

#### Payment Settings
- Chargebee configuration
- Currency settings
- Tax configuration

#### Email Settings
- SMTP configuration
- Email templates
- Notification settings

### File Upload Configuration

File upload settings in `config/upload.js`:

```javascript
// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  videos: ['.mp4', '.avi', '.mov', '.wmv']
};
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

**Problem**: `ECONNREFUSED` or database connection errors

**Solutions**:
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`
- Verify network connectivity and firewall settings

```bash
# Test database connection
psql -h localhost -U postgres -d digiserver_db
```

#### 2. Redis Connection Issues

**Problem**: Redis connection failures or session issues

**Solutions**:
- Check if Redis is running: `redis-cli ping`
- Verify Redis configuration in `.env`
- Restart Redis service: `sudo systemctl restart redis`

```bash
# Test Redis connection
redis-cli
127.0.0.1:6379> ping
PONG
```

#### 3. File Upload Issues

**Problem**: Files not uploading or upload errors

**Solutions**:
- Check file size limits (max 100MB)
- Verify file type is allowed
- Ensure upload directory permissions: `chmod 755 backend/uploads`
- Check disk space availability

#### 4. Session/Authentication Issues

**Problem**: Users getting logged out or session errors

**Solutions**:
- Verify `SESSION_SECRET` is set in `.env`
- Check Redis connection
- Clear browser cookies
- Restart the application

#### 5. Payment Integration Issues

**Problem**: Chargebee integration not working

**Solutions**:
- Verify Chargebee credentials in `.env`
- Check Chargebee site configuration
- Review webhook endpoints
- Test in Chargebee sandbox mode first

### Logging and Debugging

#### Log Files Location

```
backend/logs/
├── combined.log    # All logs
├── error.log       # Error logs only
└── debug.log       # Debug information
```

#### Enable Debug Mode

```bash
# Set environment variable
NODE_ENV=development
DEBUG=digiserver:*

# Run with debug output
npm run dev
```

#### Database Debugging

```bash
# Check database migrations
npm run migrate:status

# Run pending migrations
npm run migrate:run

# Reset database (development only)
npm run setup
```

### Performance Issues

#### 1. Slow Database Queries
- Review database indexes
- Optimize Sequelize queries
- Monitor PostgreSQL performance

#### 2. High Memory Usage
- Monitor Redis memory usage
- Check for memory leaks in Node.js
- Optimize file upload handling

#### 3. Slow File Uploads
- Check network bandwidth
- Optimize file size limits
- Consider CDN for static files

## 🤝 Contribution Guidelines

### Getting Started

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Digital-Server.git
   cd Digital-Server
   ```

2. **Set Up Development Environment**
   ```bash
   # Install dependencies
   cd backend
   npm install
   
   # Copy environment file
   cp .env.example .env
   
   # Setup database
   npm run setup
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Standards

#### Code Style
- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing project structure

#### Commit Guidelines

```bash
# Commit message format
type(scope): description

# Examples
feat(auth): add password reset functionality
fix(upload): resolve file size validation issue
docs(readme): update installation instructions
refactor(models): optimize database queries
```

#### Testing

```bash
# Run tests (when available)
npm test

# Manual testing checklist
- Test user registration/login
- Verify product upload functionality
- Check license generation
- Test payment integration
- Validate admin panel features
```

### Pull Request Process

1. **Before Submitting**
   - Ensure code follows project standards
   - Test functionality thoroughly
   - Update documentation if needed
   - Check for conflicts with main branch

2. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement
   
   ## Testing
   - [ ] Manual testing completed
   - [ ] No breaking changes
   
   ## Screenshots (if applicable)
   Add screenshots for UI changes
   ```

3. **Review Process**
   - Code review by maintainers
   - Automated checks (if configured)
   - Testing in staging environment
   - Approval and merge

### Reporting Issues

#### Bug Reports

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Environment**
- OS: [e.g., Windows 10]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome 91]
```

#### Feature Requests

```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other approaches considered
```

### Development Roadmap

#### Current Priorities
- [ ] Enhanced security features
- [ ] API rate limiting
- [ ] Advanced analytics dashboard
- [ ] Mobile-responsive improvements
- [ ] Automated testing suite

#### Future Enhancements
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Integration with more payment providers
- [ ] Mobile application
- [ ] Advanced user roles and permissions

## 📄 License

This project is proprietary software owned by the DigiServer Team. All rights reserved.

## 📞 Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub
- **Email**: Contact the development team
- **Community**: Join our developer community

## 🙏 Acknowledgments

- **Node.js Community** for the excellent ecosystem
- **PostgreSQL Team** for the robust database system
- **Redis Team** for the high-performance caching solution
- **Express.js Team** for the web framework
- **All Contributors** who have helped improve this project

---

**Digital Server** - Empowering digital commerce with robust, scalable solutions.