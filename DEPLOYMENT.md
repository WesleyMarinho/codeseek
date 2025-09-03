# Guia de Implantação do CodeSeek em Produção

Este documento contém instruções detalhadas para implantar o CodeSeek em um servidor Ubuntu em ambiente de produção.

## Requisitos do Sistema

- Ubuntu 20.04 LTS ou superior
- Node.js 18.x
- PostgreSQL 12+
- Redis 6+
- Nginx
- Git

## Opções de Implantação

Existem duas maneiras de implantar o CodeSeek:

1. **Instalação Automatizada**: Usando o script de instalação fornecido
2. **Instalação Manual**: Seguindo o passo a passo detalhado

## 1. Instalação Automatizada

O método mais simples é usar o script de instalação automatizado:

```bash
# 1. Faça login no seu servidor via SSH
ssh root@seu_servidor

# 2. Clone o repositório
git clone https://github.com/WesleyMarinho/codeseek.git /tmp/codeseek
cd /tmp/codeseek

# 3. Edite as configurações no script de instalação (opcional)
nano install.sh
# Altere as variáveis GIT_REPO e DOMAIN conforme necessário

# 4. Execute o script de instalação
sudo bash install.sh

# 5. Verifique se o serviço está rodando
systemctl status codeseek.service
```

O script realizará todas as etapas necessárias, incluindo:
- Atualização do sistema
- Instalação de dependências
- Configuração do banco de dados
- Configuração do Nginx
- Configuração do serviço systemd
- Inicialização do aplicativo

## 2. Instalação Manual

Se preferir realizar a instalação manualmente, siga estas etapas:

### 2.1. Atualizar o Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2. Instalar Dependências

```bash
# Instalar dependências básicas
sudo apt install -y git curl wget nginx postgresql postgresql-contrib redis-server build-essential python3 python3-pip

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node -v
npm -v
```

### 2.3. Criar Usuário para a Aplicação

```bash
sudo useradd -m -s /bin/bash codeseek
```

### 2.4. Configurar o Diretório da Aplicação

```bash
# Criar diretório da aplicação
sudo mkdir -p /opt/codeseek
sudo chown -R codeseek:codeseek /opt/codeseek

# Clonar o repositório
cd /opt/codeseek
sudo -u codeseek git clone https://github.com/WesleyMarinho/codeseek.git .
```

### 2.5. Configurar o Banco de Dados PostgreSQL

```bash
# Criar usuário e banco de dados
sudo -u postgres psql -c "CREATE USER codeseek_user WITH PASSWORD 'senha_segura';"
sudo -u postgres psql -c "CREATE DATABASE codeseek_prod;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE codeseek_prod TO codeseek_user;"
sudo -u postgres psql -c "ALTER USER codeseek_user WITH SUPERUSER;"
```

### 2.6. Configurar o Redis

```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

### 2.7. Instalar Dependências do Backend

```bash
cd /opt/codeseek/backend
sudo -u codeseek npm install --production
```

### 2.8. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
sudo -u codeseek cp .env.example .env

# Editar o arquivo .env
sudo -u codeseek nano .env
```

Atualize as seguintes variáveis no arquivo .env:

```
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeseek_prod
DB_USER=codeseek_user
DB_PASSWORD=senha_segura

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

SESSION_SECRET=gere_uma_chave_secreta_forte

BASE_URL=https://seu-dominio.com
```

### 2.9. Configurar o Nginx

```bash
# Copiar arquivo de configuração
sudo cp /opt/codeseek/nginx.conf /etc/nginx/sites-available/codeseek

# Editar o arquivo de configuração
sudo nano /etc/nginx/sites-available/codeseek
```

Atualize o `server_name` para o seu domínio.

```bash
# Ativar o site
sudo ln -sf /etc/nginx/sites-available/codeseek /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 2.10. Configurar o Serviço Systemd

```bash
# Copiar arquivo de serviço
sudo cp /opt/codeseek/codeseek.service /etc/systemd/system/

# Recarregar configurações do systemd
sudo systemctl daemon-reload
sudo systemctl enable codeseek.service
```

### 2.11. Configurar Diretórios de Uploads

```bash
sudo mkdir -p /opt/codeseek/backend/uploads
sudo chown -R codeseek:codeseek /opt/codeseek/backend/uploads
sudo chmod -R 755 /opt/codeseek/backend/uploads
```

### 2.12. Inicializar o Banco de Dados

```bash
cd /opt/codeseek/backend
sudo -u codeseek NODE_ENV=production node setup-database.js
sudo -u codeseek NODE_ENV=production node seed-database.js
```

### 2.13. Compilar Assets do Frontend

```bash
cd /opt/codeseek/frontend
sudo -u codeseek npm install
sudo -u codeseek npm run build-css-prod
```

### 2.14. Iniciar o Serviço

```bash
sudo systemctl start codeseek.service
sudo systemctl status codeseek.service
```

## Configuração de SSL/TLS (HTTPS)

Para configurar HTTPS com Let's Encrypt:

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

## Manutenção e Atualizações

### Atualizar o Aplicativo

```bash
cd /opt/codeseek
sudo -u codeseek git pull origin main
cd /opt/codeseek/backend
sudo -u codeseek npm install --production
cd /opt/codeseek/frontend
sudo -u codeseek npm install
sudo -u codeseek npm run build-css-prod
sudo systemctl restart codeseek.service
```

### Monitorar Logs

```bash
# Ver logs do serviço
sudo journalctl -u codeseek.service -f

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup do Banco de Dados

```bash
# Criar backup
sudo -u postgres pg_dump codeseek_prod > /tmp/codeseek_backup_$(date +%Y%m%d).sql

# Restaurar backup
sudo -u postgres psql codeseek_prod < backup_file.sql
```

## Solução de Problemas

### Verificar Status do Serviço

```bash
sudo systemctl status codeseek.service
```

### Reiniciar Serviços

```bash
# Reiniciar aplicação
sudo systemctl restart codeseek.service

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Reiniciar Redis
sudo systemctl restart redis-server
```

### Verificar Conectividade

```bash
# Testar conexão com o banco de dados
sudo -u codeseek_user psql -h localhost -U codeseek_user -d codeseek_prod

# Testar conexão com o Redis
redis-cli ping
```

## Segurança

### Firewall

```bash
# Configurar UFW
sudo apt install -y ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
sudo ufw status
```

### Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Recursos Adicionais

- [Documentação do Node.js](https://nodejs.org/en/docs/)
- [Documentação do PostgreSQL](https://www.postgresql.org/docs/)
- [Documentação do Nginx](https://nginx.org/en/docs/)
- [Documentação do Redis](https://redis.io/documentation)

## Suporte

Para suporte adicional, entre em contato com a equipe de desenvolvimento ou abra uma issue no repositório do projeto.