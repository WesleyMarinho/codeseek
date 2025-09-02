# 🐳 CodeSeek - Docker Setup

Guia completo para executar o CodeSeek usando Docker e Docker Compose.

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)
- 4GB+ de RAM disponível
- 10GB+ de espaço em disco

## 🚀 Início Rápido

### 1. Clone o repositório
```bash
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp backend/.env.example backend/.env

# Edite as configurações conforme necessário
# As configurações padrão do docker-compose.yml já estão otimizadas
```

### 3. Execute com Docker Compose
```bash
# Build e start todos os serviços
docker-compose up --build

# Ou execute em background
docker-compose up --build -d
```

### 4. Acesse a aplicação
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🏗️ Arquitetura dos Containers

### Serviços Incluídos

| Serviço | Container | Porta | Descrição |
|---------|-----------|-------|----------|
| **app** | codeseek-app | 3000 | Aplicação principal (Backend + Frontend) |
| **postgres** | codeseek-postgres | 5432 | Banco de dados PostgreSQL |
| **redis** | codeseek-redis | 6379 | Cache e sessões |

### Volumes Persistentes

- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis
- `uploads_data`: Arquivos enviados pelos usuários
- `./backend/logs`: Logs da aplicação (mapeado do host)

## 🔧 Comandos Úteis

### Gerenciamento dos Containers
```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker-compose down -v

# Rebuild apenas a aplicação
docker-compose build app

# Ver logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# Status dos serviços
docker-compose ps
```

### Acesso aos Containers
```bash
# Acessar container da aplicação
docker-compose exec app sh

# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d digiserver_db

# Acessar Redis
docker-compose exec redis redis-cli -a 08d0bdd400563b50d631
```

### Backup e Restore
```bash
# Backup do banco de dados
docker-compose exec postgres pg_dump -U postgres digiserver_db > backup.sql

# Restore do banco de dados
docker-compose exec -T postgres psql -U postgres digiserver_db < backup.sql
```

## 🔒 Configuração de Produção

### 1. Variáveis de Ambiente
Crie um arquivo `.env.production` com:

```env
# Configurações de Produção
NODE_ENV=production
PORT=3000

# Database (use valores seguros)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=digiserver_db
DB_USER=postgres
DB_PASSWORD=sua_senha_super_segura

# Redis (use valores seguros)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=sua_senha_redis_segura

# Security (MUDE ESTAS CHAVES!)
SESSION_SECRET=sua_chave_secreta_muito_forte_e_unica
BCRYPT_ROUNDS=12

# Chargebee (configure com suas credenciais)
CHARGEBEE_SITE=seu_site_chargebee
CHARGEBEE_API_KEY=sua_api_key_chargebee

# Application
BASE_URL=https://seu-dominio.com
```

### 2. Docker Compose para Produção
Crie um `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    env_file:
      - backend/.env.production
    restart: always
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
  
  postgres:
    restart: always
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.3'
  
  redis:
    restart: always
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.2'
```

Execute com:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Erro de conexão com banco de dados
```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps postgres

# Verifique os logs
docker-compose logs postgres

# Teste a conexão
docker-compose exec postgres pg_isready -U postgres
```

#### 2. Erro de conexão com Redis
```bash
# Verifique se o Redis está rodando
docker-compose ps redis

# Teste a conexão
docker-compose exec redis redis-cli -a 08d0bdd400563b50d631 ping
```

#### 3. Aplicação não inicia
```bash
# Verifique os logs da aplicação
docker-compose logs app

# Verifique se as dependências estão instaladas
docker-compose exec app npm list
```

#### 4. Porta já em uso
```bash
# Verifique quais portas estão em uso
netstat -tulpn | grep :3000

# Pare outros serviços ou mude a porta no docker-compose.yml
```

### Health Checks

Todos os serviços têm health checks configurados:

```bash
# Verificar status de saúde
docker-compose ps

# Health check manual da aplicação
curl http://localhost:3000/health
```

## 📊 Monitoramento

### Logs
```bash
# Logs em tempo real
docker-compose logs -f

# Logs específicos
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis
```

### Métricas
```bash
# Uso de recursos
docker stats

# Informações dos containers
docker-compose ps
docker-compose top
```

## 🔄 Atualizações

```bash
# Pull das últimas mudanças
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose up --build -d

# Ou rebuild apenas a aplicação
docker-compose build app
docker-compose up -d app
```

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Verifique o status: `docker-compose ps`
3. Teste os health checks: `curl http://localhost:3000/health`
4. Consulte a documentação do Docker
5. Abra uma issue no repositório

---

**Nota**: Este setup é otimizado para desenvolvimento. Para produção, considere usar orquestradores como Kubernetes ou Docker Swarm, e implemente monitoramento adequado.