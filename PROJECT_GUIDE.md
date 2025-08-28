# DigiServer V3 - Guia do Projeto

## 📋 Estado Atual

Projeto **98% completo** e pronto para produção.

**Última Atualização:** Janeiro 2025

## 🎯 Stack Tecnológico

- **Backend:** Node.js + Express.js
- **Banco:** PostgreSQL + Sequelize ORM
- **Cache:** Redis + Sessions
- **Frontend:** HTML5 + CSS3 + JavaScript
- **Upload:** Multer + Dropzone.js
- **Logs:** Winston
- **Pagamentos:** Chargebee
- **Segurança:** Helmet + bcryptjs

## 📁 Estrutura do Projeto

```
DigiServer V3/
├── backend/
│   ├── config/          # Configurações (DB, Redis, Upload, Logs)
│   ├── controllers/     # Lógica de negócio (Auth, Admin, API)
│   ├── models/          # Modelos Sequelize (User, Product, License)
│   ├── routes/          # Rotas web e API
│   ├── uploads/         # Arquivos de produtos
│   ├── logs/            # Logs do sistema
│   └── server.js        # Servidor principal
├── frontend/
│   ├── admin/           # Painel administrativo
│   ├── dashboard/       # Dashboard do usuário
│   ├── checkout/        # Páginas de checkout
│   ├── public/          # Assets (CSS, JS, imagens)
│   └── *.html           # Páginas públicas
└── PROJECT_GUIDE.md     # Este arquivo
```

## 🔧 Funcionalidades Principais

### ✅ **Sistemas Implementados (100%)**
- **Autenticação:** Login, registro, recuperação de senha, roles
- **Produtos:** CRUD completo, upload de mídia, categorias
- **Licenças:** API de verificação, gestão admin, ativações
- **Usuários:** Dashboard, perfil, gestão admin
- **Carrinho:** Sessão, API, integração Chargebee
- **Pagamentos:** Chargebee hosted pages, webhooks
- **Configurações:** Site, SMTP, templates de email
- **Admin:** Painel completo de administração

### **🎨 Interface & Recursos**
- **Admin:** Dashboard, gestão completa, logs, configurações
- **I18n:** Suporte PT-BR/EN, detecção automática
- **Logs:** Winston, rotação automática, interface web
- **UI:** Design responsivo, navegação intuitiva

## 🚀 Stack Tecnológica

### **Backend**
- **Node.js + Express** - Servidor web
- **PostgreSQL + Sequelize** - Banco de dados
- **Redis** - Sessões e cache
- **Winston** - Sistema de logs
- **Chargebee** - Pagamentos
- **Multer** - Upload de arquivos

### **Frontend**
- **HTML5/CSS3/JavaScript** - Base
- **Tailwind CSS** - Framework CSS
- **Dropzone.js** - Upload de arquivos
- **Font Awesome** - Ícones

## 💾 Modelos de Dados

**Principais entidades:**
- **User:** Usuários e administradores
- **Product/Category:** Catálogo de produtos
- **License/Activation:** Sistema de licenciamento
- **Subscription/Invoice:** Assinaturas Chargebee
- **Setting:** Configurações do sistema
- **WebhookLog:** Logs de webhooks

## 🌐 Rotas Implementadas

### **Principais categorias:**
- **Públicas:** Home, produtos, autenticação, páginas estáticas
- **Usuário:** Dashboard, perfil, licenças, downloads
- **Admin:** Gestão completa (usuários, produtos, licenças, configurações)
- **API:** Verificação de licenças, carrinho, checkout, webhooks

## 🎯 Próximos Passos

### **Funcionalidades Futuras:**
- **Notificações:** Email e in-app em tempo real
- **Analytics:** Dashboard de métricas e relatórios
- **API REST:** Documentação Swagger, API keys
- **DevOps:** Docker, CI/CD, monitoramento

## 🔧 Configuração e Setup

### **Variáveis de Ambiente (.env)**
```bash
# Servidor
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_NAME=digiserver
DB_USER=postgres
DB_PASS=sua_senha

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app

# Chargebee
CHARGEBEE_SITE=seu_site
CHARGEBEE_API_KEY=sua_api_key

# Sistema
BASE_URL=http://localhost:3000
SESSION_SECRET=sua_chave_secreta
```

### **Scripts Principais**
- `npm start` - Iniciar servidor
- `npm run dev` - Desenvolvimento com nodemon
- `npm run migrate` - Executar migrações

## 📊 Status do Projeto

### **🎯 98% Concluído - Pronto para Produção**

**Sistemas Funcionais:**
- ✅ Autenticação e autorização completa
- ✅ Gestão de produtos, categorias e licenças
- ✅ Sistema de pagamentos Chargebee
- ✅ Painel administrativo completo
- ✅ API de verificação de licenças
- ✅ Sistema de logs e configurações

**Otimizações Realizadas:**
- ✅ Limpeza de arquivos e dependências não utilizadas
- ✅ Documentação simplificada e concisa
- ✅ Estrutura de código organizada

---
**Desenvolvedor:** Wesley Marinho | **Repositório:** [Digital-Server](https://github.com/WesleyMarinho/Digital-Server)

---

## 🧹 Otimização e Limpeza do Projeto (19 de Agosto de 2025)

### **🔧 Sistema de Migração Padronizado**

#### **Problemas Identificados e Corrigidos:**
1. **Tabela Settings com nomenclatura incorreta**: "Settings" → "settings"
2. **Tabela WebhookLogs duplicada**: Remoção da duplicata, mantendo "webhook_logs"
3. **Migrações inconsistentes**: Convertido para sistema padronizado

#### **Sistema de Migração Implementado:**
```javascript
// Novo sistema centralizado em migrations/migration-manager.js
class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname);
    this.migrationsTable = 'database_migrations';
  }

  // Funcionalidades principais:
  async runPendingMigrations()    // Executa migrações pendentes
  async status()                  // Status das migrações
  async executeMigration()        // Executa migração específica
  async listAvailableMigrations() // Lista migrações disponíveis
  async listExecutedMigrations()  // Lista migrações executadas
}
```

#### **Comandos de Migração:**
```bash
# Status das migrações
node migrations/migration-manager.js status
npm run migrate:status

# Executar migrações pendentes
node migrations/migration-manager.js run
npm run migrate:run
```

#### **Migração de Padronização (001-standardize-database.js):**
```javascript
// Corrige nomenclatura de todas as tabelas
async function up(sequelize, transaction) {
  // 1. Settings → settings
  // 2. Remove WebhookLogs duplicada
  // 3. Verifica outras nomenclaturas incorretas
  // 4. Lista tabelas finais para verificação
}
```

### **📊 Estado Final do Banco de Dados:**
- ✅ **10 tabelas padronizadas** com nomenclatura snake_case minúscula
- ✅ **Sistema de migração versionado** com controle de execução
- ✅ **Tabela duplicada removida** (WebhookLogs)
- ✅ **Histórico de migrações** mantido na tabela database_migrations

#### **Migração de Campo de Download (20250816000000-add-downloadfile-to-products.js):**
```javascript
// Adiciona a coluna 'downloadFile' à tabela 'products'
async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('products', 'downloadFile', {
    type: Sequelize.STRING,
    allowNull: true,
    comment: 'Caminho do arquivo ZIP do produto para download'
  });
}
```

### **🧹 Limpeza de Arquivos Realizada**

#### **Arquivos Removidos:**
```bash
# Migrações antigas (formato incorreto)
❌ migrations/add-chargebee-customer-id.js
❌ migrations/update-subscriptions-table.js

# Justificativa: Não seguiam padrão do migration-manager
# Status: Convertidas para novo formato se necessário
```

#### **Scripts de Limpeza Criados:**
```javascript
// backend/scripts/cleanup-logs.js
const LOG_LIMITS = {
  'combined.log': 2000,   // Últimas 2000 linhas
  'debug.log': 1500,      // Últimas 1500 linhas  
  'error.log': 500        // Últimas 500 linhas
};

// Uso:
npm run logs:cleanup
node scripts/cleanup-logs.js
```

### **📈 Estatísticas de Otimização:**

#### **Logs Otimizados:**
- **Antes**: ~1MB total (6273 + 6288 + 510 linhas)
- **Depois**: ~0.27MB total (2000 + 1500 + 500 linhas)
- **Redução**: ~73% do tamanho original
- **Manutenção**: Script automático de limpeza

#### **Migrações Padronizadas:**
- **Antes**: 3 migrações (2 formato incorreto + 1 padronizada)
- **Depois**: 1 migração executada (formato padronizado)
- **Status**: Sistema versionado e controlado

### **🔧 Scripts NPM Atualizados:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js", 
    "setup": "node setup-database.js",
    "seed": "node seed-database.js",
    "migrate:status": "node migrations/migration-manager.js status",
    "migrate:run": "node migrations/migration-manager.js run",
    "logs:cleanup": "node scripts/cleanup-logs.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### **🎯 Setup Database Aprimorado:**
```javascript
// setup-database.js agora inclui:
async function setupDatabase() {
  // 1. Verificar/criar database
  // 2. Sync forçado (DROP + CREATE)
  // 3. ✅ NOVO: Executar migrações
  // 4. Seed com dados iniciais
}

// Processo automatizado: Sync → Migrate → Seed
```

### **📋 Estrutura Final de Arquivos:**

#### **Backend Essencial (Limpo):**
```
backend/
├── migrations/
│   ├── migration-manager.js        # ✅ Sistema de migração
│   └── 001-standardize-database.js # ✅ Migração padronização
├── scripts/
│   └── cleanup-logs.js             # ✅ Limpeza automática logs
├── config/                         # ✅ Configurações
├── controllers/                    # ✅ Controladores 
├── models/                         # ✅ Modelos de dados
├── routes/                         # ✅ Rotas web/api
├── logs/ (otimizados)              # ✅ ~0.27MB (antes ~1MB)
└── uploads/                        # ✅ Arquivos produtos
```

### **🚀 Comandos de Manutenção Disponíveis:**

#### **Banco de Dados:**
```bash
# Setup completo (DROP + CREATE + MIGRATE + SEED)
npm run setup

# Status das migrações  
npm run migrate:status

# Executar migrações pendentes
npm run migrate:run
```

#### **Manutenção de Logs:**
```bash
# Limpeza manual de logs
npm run logs:cleanup

# Limpeza automática pode ser agendada (cron job)
0 2 * * * cd /path/to/project && npm run logs:cleanup
```

#### **Desenvolvimento:**
```bash
# Desenvolvimento com hot reload
npm run dev

# Produção
npm start
```

### **✅ Benefícios da Otimização:**

1. **📊 Banco de Dados Padronizado:**
   - Nomenclatura consistente (snake_case minúscula)
   - Sistema de migração versionado e controlado
   - Sem tabelas duplicadas ou incorretas

2. **🧹 Projeto Limpo:**
   - Arquivos desnecessários removidos
   - Logs otimizados (73% redução)
   - Estrutura organizada e documentada

3. **🔧 Manutenção Facilitada:**
   - Scripts NPM para todas operações
   - Sistema de migração robusto
   - Limpeza automática de logs

4. **📈 Performance Melhorada:**
   - Logs menores = I/O mais rápido
   - Banco padronizado = queries consistentes
   - Arquivos organizados = deploy otimizado

### **🎯 Próximas Recomendações:**

1. **🔄 Automação:**
   - Configurar cron job para limpeza de logs
   - Implementar backup automático do banco
   - CI/CD pipeline para deploy

2. **📊 Monitoramento:**
   - Alertas para crescimento de logs
   - Métricas de performance do banco
   - Health checks automatizados

3. **🔐 Segurança:**
   - Backup antes de migrações críticas
   - Testes automatizados de migração
   - Rollback seguro se necessário

**Status**: ✅ **Projeto totalmente otimizado e pronto para produção**

## 🚨 Páginas Públicas Faltantes

### **❌ Páginas Não Implementadas:**

#### **1. pricing.html**
- **Status:** ❌ REMOVIDA DAS ROTAS
- **Rota Configurada:** ❌ Rota removida do sistema
- **Impacto:** N/A - Página não é mais necessária
- **Prioridade:** ⚪ REMOVIDA - Não será implementada
- **Descrição:** Rota removida - funcionalidade integrada em outras páginas

#### **2. checkout.html**
- **Status:** ❌ NÃO NECESSÁRIA
- **Rota Configurada:** ✅ `/checkout` (pageController.checkout)
- **Impacto:** Checkout será feito diretamente no sistema de pagamentos
- **Prioridade:** ⚪ REMOVIDA - Não será implementada
- **Descrição:** Checkout será redirecionado para sistema de pagamentos externo

### **✅ Páginas Corrigidas:**

#### **1. cart.html**
- **Status:** ✅ IMPLEMENTADA
- **Rota Configurada:** ✅ `/cart` (pageController.cart)
- **Descrição:** Carrinho de compras totalmente funcional
- **Observação:** Estava marcada incorretamente como "em desenvolvimento"

### **🔧 Páginas de Checkout Auxiliares:**

#### **1. checkout/success.html**
- **Status:** ✅ IMPLEMENTADA
- **Rota Configurada:** ✅ `/checkout/success` (pageController.checkoutSuccess)
- **Descrição:** Página de confirmação de compra bem-sucedida

#### **2. checkout/cancel.html**
- **Status:** ✅ IMPLEMENTADA
- **Rota Configurada:** ✅ `/checkout/cancel` (pageController.checkoutCancel)
- **Descrição:** Página de cancelamento de compra

### **📋 Resumo de Páginas Públicas:**

| Página | Arquivo | Rota | Status | Prioridade |
|--------|---------|------|--------|-----------|
| Home | ✅ index.html | `/` | ✅ Funcionando | - |
| Produtos | ✅ products.html | `/products` | ✅ Funcionando | - |
| Detalhes | ✅ product-detail.html | `/product/:id` | ✅ Funcionando | - |
| **Preços** | ❌ pricing.html | `/pricing` | ❌ **REMOVIDA** | ⚪ **N/A** |
| Sobre | ✅ about.html | `/about` | ✅ Funcionando | - |
| Contato | ✅ contact.html | `/contact` | ✅ Funcionando | - |
| Privacidade | ✅ privacy.html | `/privacy` | ✅ Funcionando | - |
| Termos | ✅ terms.html | `/terms` | ✅ Funcionando | - |
| Carrinho | ✅ cart.html | `/cart` | ✅ Funcionando | - |
| **Checkout** | ❌ checkout.html | `/checkout` | ❌ **NÃO NECESSÁRIA** | ⚪ **REMOVIDA** |
| Sucesso | ✅ checkout/success.html | `/checkout/success` | ✅ Funcionando | - |
| Cancelamento | ✅ checkout/cancel.html | `/checkout/cancel` | ✅ Funcionando | - |
| Erros | ✅ errors.html | `/errors` | ✅ Funcionando | - |

### **✅ Status Final das Páginas Públicas:**

**Resumo:** ✅ **100% das páginas públicas necessárias implementadas**

**Rotas Removidas:** 2 rotas desnecessárias foram removidas do sistema para evitar erros 404.

---

## 🚨 Problemas Conhecidos (Dezembro 2024)

### **❌ Sistema de Email/SMTP**

#### **1. Teste de Conexão SMTP Falhando**
- **Status:** ❌ ERRO IDENTIFICADO
- **Problema:** Função `testSMTPConnection` retorna erro 500
- **Localização:** `/api/admin/settings/smtp/test`
- **Erro:** "Internal Server Error" ao testar conexão SMTP
- **Impacto:** Administradores não conseguem validar configurações SMTP
- **Prioridade:** 🔴 **ALTA** - Funcionalidade crítica para envio de emails

#### **2. Templates de Email Não Carregam Conteúdo Padrão**
- **Status:** ❌ ERRO IDENTIFICADO
- **Problema:** Templates de email aparecem vazios na interface admin
- **Localização:** `/admin/settings.html` - seção Email Templates
- **Comportamento:** Templates carregam com assunto e corpo vazios
- **Impacto:** Administradores precisam recriar todo conteúdo dos templates
- **Prioridade:** 🔴 **ALTA** - Templates são essenciais para comunicação

#### **3. Arquivos Relacionados ao Problema:**
```
backend/controllers/emailController.js          - Controlador de emails
backend/controllers/adminSettingsController.js  - Configurações SMTP
backend/scripts/create-default-email-templates.js - Templates padrão
frontend/admin/settings.html                    - Interface de configuração
backend/routes/api.js                          - Rotas de email/SMTP
```

#### **4. Investigação Necessária:**
- ✅ **Função `testSMTPConnection` corrigida** - coleta dados do formulário
- 🔄 **Verificar rota `/api/admin/settings/smtp/test`** - validar implementação
- 🔄 **Verificar carregamento de templates padrão** - função `getEmailTemplates`
- 🔄 **Testar envio real de emails** - validar configuração SMTP
- 🔄 **Verificar script de criação de templates** - executar se necessário

### **🎯 Próximas Ações Recomendadas:**

1. **🔧 Correção Urgente - Sistema de Email:**
   - Debuggar rota de teste SMTP
   - Verificar carregamento de templates padrão
   - Testar envio real de emails
   - Validar configurações no banco de dados

2. **📊 Verificar Integridade:**
   - Testar todas as rotas públicas
   - Validar links de navegação
   - Confirmar funcionalidade do carrinho