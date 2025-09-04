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

## 🚀 Instalação Rápida

### 🎯 Instalação em VPS Ubuntu (Recomendado)

```bash
# 1. Clone o repositório
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek

# 2a. Instalação com domínio e SSL automático
sudo bash install-vps.sh meudominio.com admin@meudominio.com

# 2b. Instalação simples (apenas IP)
sudo bash install-vps.sh

# 2c. Instalação interativa
sudo bash install-vps.sh
# O script irá perguntar sobre domínio e SSL
```

### 🔑 **Login Administrativo**
- **Email**: `admin@codeseek.com`
- **Senha**: `admin123456`
- **⚠️ ALTERE A SENHA após o primeiro login!**

### 🔧 Instalação Manual

```bash
# 1. Clone o repositório
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek

# 2. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações

# 3. Instale as dependências
cd backend && npm install
cd ../frontend && npm install && npm run build

# 4. Configure o banco de dados PostgreSQL
sudo -u postgres createuser codeseek_user
sudo -u postgres createdb codeseek_db -O codeseek_user

# 5. Inicie a aplicação
pm2 start ecosystem.config.js --env production
```

### 📋 Pré-requisitos
- **SO**: Ubuntu 20.04+ (recomendado)
- **Node.js**: 18.x ou superior
- **PostgreSQL**: 14+ 
- **Redis**: 6+
- **PM2**: Para gerenciamento de processos
- **Nginx**: Para proxy reverso

### ⚡ Instalação Ultra-Rápida
```bash
# Comando único para instalação completa
curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/install-vps.sh | sudo bash
```

## 🔧 Configuração

### Variáveis de Ambiente Principais

Edite o arquivo `backend/.env` (baseado em `.env.example`):

```bash
# Banco de Dados
DB_HOST=localhost
DB_NAME=codeseek_db
DB_USER=codeseek_user
DB_PASSWORD=sua_senha_muito_forte

# Aplicação
BASE_URL=http://seu-dominio.com
DOMAIN=seu-dominio.com
ADMIN_EMAIL=admin@seu-dominio.com
SESSION_SECRET=chave_secreta_de_32_caracteres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Opcionais
CHARGEBEE_SITE=seu_site_chargebee
CHARGEBEE_API_KEY=sua_api_key
```

### 🌐 Configuração de Domínio

1. **Edite o Nginx**: `/etc/nginx/sites-available/codeseek`
2. **Substitua**: `server_name localhost;` por `server_name seu-dominio.com;`
3. **Recarregue**: `sudo systemctl reload nginx`

### 🔒 SSL/HTTPS (Opcional)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicione: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 Solução de Problemas

### Comandos de Diagnóstico

```bash
# Status da aplicação
sudo -u codeseek pm2 status

# Ver logs da aplicação
sudo -u codeseek pm2 logs codeseek

# Ver logs do sistema
sudo journalctl -u nginx -f

# Reiniciar serviços
sudo -u codeseek pm2 restart codeseek
sudo systemctl restart nginx postgresql redis
```

### Problemas Comuns

1. **Erro de conexão com banco**: Verifique credenciais em `.env`
2. **Porta 3000 ocupada**: `sudo lsof -i :3000` e mate o processo
3. **Nginx erro 502**: Verifique se a aplicação está rodando com `pm2 status`
4. **Permissões**: `sudo chown -R codeseek:codeseek /opt/codeseek`

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

