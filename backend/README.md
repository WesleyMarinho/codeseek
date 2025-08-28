# DigiServer Backend V2

Backend para o sistema DigiServer V2 - Plataforma de vendas digitais.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados principal
- **Sequelize** - ORM para PostgreSQL
- **Redis** - Cache e gerenciamento de sessões
- **bcryptjs** - Hash de senhas
- **express-session** - Gerenciamento de sessões

## 📁 Estrutura do Projeto

```
backend/
├── config/           # Configurações (database, redis)
├── controllers/      # Lógica dos controllers
├── models/          # Modelos do Sequelize
├── routes/          # Definição das rotas
├── server.js        # Arquivo principal
├── .env.example     # Exemplo de configuração
└── package.json     # Dependências do projeto
```

## 🛠️ Configuração

### 1. Pré-requisitos

- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- Redis (versão 6 ou superior)

### 2. Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env
```

### 3. Configuração do Banco de Dados

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digiserver_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# Configurações do Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Chave secreta para sessões
SESSION_SECRET=sua_chave_muito_forte_aqui
```

### 4. Executar o Projeto

```bash
# Modo desenvolvimento (com nodemon)
npm run dev

# Modo produção
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 📊 Modelos de Dados

### User
- `id`, `username`, `email`, `password`, `role`, `createdAt`, `updatedAt`

### Category
- `id`, `name`, `description`, `createdAt`, `updatedAt`

### Product
- `id`, `name`, `description`, `price`, `categoryId`, `files`, `isActive`, `createdAt`, `updatedAt`

### License
- `id`, `productId`, `userId`, `key`, `activatedOn`, `expiresOn`, `status`, `createdAt`, `updatedAt`

### Subscription
- `id`, `userId`, `plan`, `status`, `startDate`, `endDate`, `price`, `createdAt`, `updatedAt`

## 🔗 Principais Rotas

### Páginas Web
- `GET /` - Página inicial
- `GET /login` - Página de login
- `GET /register` - Página de registro
- `GET /products` - Lista de produtos
- `GET /dashboard` - Dashboard do usuário
- `GET /admin` - Dashboard administrativo

### Autenticação
- `POST /login` - Processar login
- `POST /register` - Processar registro
- `POST /logout` - Fazer logout

### API
- `GET /api/license/verify/:key` - Verificar licença (público)
- `GET /api/user/licenses` - Licenças do usuário
- `GET /api/user/subscriptions` - Assinaturas do usuário

## 🔒 Segurança

- Senhas são criptografadas com bcrypt
- Sessões são armazenadas no Redis
- Validação de entrada em todos os endpoints
- Proteção contra ataques comuns

## 📝 Status do Desenvolvimento

✅ Estrutura básica criada  
✅ Modelos de dados definidos  
✅ Sistema de autenticação  
✅ Rotas principais  
✅ API de verificação de licenças  
🔄 Em desenvolvimento: Interface de administração  
🔄 Em desenvolvimento: Sistema de pagamentos  
🔄 Em desenvolvimento: Envio de emails  

## 🤝 Contribuição

Este é um projeto interno. Para contribuir, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Projeto proprietário - DigiServer Team
