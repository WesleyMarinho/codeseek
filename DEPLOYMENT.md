# Guia de Implantação do DigiServer em Produção

Este documento contém instruções detalhadas para implantar o DigiServer em um servidor Ubuntu em ambiente de produção.

## Requisitos do Sistema

- Ubuntu 20.04 LTS ou superior
- Node.js 18.x
- PostgreSQL 12+
- Redis 6+
- Nginx
- Git

## Opções de Implantação

Existem duas maneiras de implantar o DigiServer:

1. **Instalação Automatizada**: Usando o script de instalação fornecido
2. **Instalação Manual**: Seguindo o passo a passo detalhado

## 1. Instalação Automatizada

O método mais simples é usar o script de instalação automatizado:

```bash
# 1. Faça login no seu servidor via SSH
ssh root@seu_servidor

# 2. Clone o repositório ou faça upload dos arquivos
git clone https://github.com/seu-usuario/digiserver.git /tmp/digiserver
cd /tmp/digiserver

# 3. Edite as configurações no script de instalação (opcional)
nano install.sh
# Altere as variáveis GIT_REPO e DOMAIN conforme necessário

# 4. Execute o script de instalação
sudo bash install.sh

# 5. Verifique se o serviço está rodando
systemctl status digiserver.service
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
sudo useradd -m -s /bin/bash digiserver
```

### 2.4. Configurar o Diretório da Aplicação

```bash
# Criar diretório da aplicação
sudo mkdir -p /opt/digiserver
sudo chown -R digiserver:digiserver /opt/digiserver

# Clonar o repositório
cd /opt/digiserver
sudo -u digiserver git clone https://github.com/seu-usuario/digiserver.git .
```

### 2.5. Configurar o Banco de Dados PostgreSQL

```bash
# Criar usuário e banco de dados
sudo -u postgres psql -c "CREATE USER digiserver_user WITH PASSWORD 'senha_segura';"
sudo -u postgres psql -c "CREATE DATABASE digiserver_prod;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE digiserver_prod TO digiserver_user;"
sudo -u postgres psql -c "ALTER USER digiserver_user WITH SUPERUSER;"
```

### 2.6. Configurar o Redis

```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

### 2.7. Instalar Dependências do Backend

```bash
cd /opt/digiserver/backend
sudo -u digiserver npm install --production
```

### 2.8. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
sudo -u digiserver cp .env.example .env

# Editar o arquivo .env
sudo -u digiserver nano .env
```

Atualize as seguintes variáveis no arquivo .env:

```
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=digiserver_prod
DB_USER=digiserver_user
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
sudo cp /opt/digiserver/nginx.conf /etc/nginx/sites-available/digiserver

# Editar o arquivo de configuração
sudo nano /etc/nginx/sites-available/digiserver
```

Atualize o `server_name` para o seu domínio.

```bash
# Ativar o site
sudo ln -sf /etc/nginx/sites-available/digiserver /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 2.10. Configurar o Serviço Systemd

```bash
# Copiar arquivo de serviço
sudo cp /opt/digiserver/digiserver.service /etc/systemd/system/

# Recarregar configurações do systemd
sudo systemctl daemon-reload
sudo systemctl enable digiserver.service
```

### 2.11. Configurar Diretórios de Uploads

```bash
sudo mkdir -p /opt/digiserver/backend/uploads
sudo chown -R digiserver:digiserver /opt/digiserver/backend/uploads
sudo chmod -R 755 /opt/digiserver/backend/uploads
```

### 2.12. Inicializar o Banco de Dados

```bash
cd /opt/digiserver/backend
sudo -u digiserver NODE_ENV=production node setup-database.js
sudo -u digiserver NODE_ENV=production node seed-database.js
```

### 2.13. Compilar Assets do Frontend

```bash
cd /opt/digiserver/frontend
sudo -u digiserver npm install
sudo -u digiserver npm run build-css-prod
```

### 2.14. Iniciar o Serviço

```bash
sudo systemctl start digiserver.service
sudo systemctl status digiserver.service
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
cd /opt/digiserver
sudo -u digiserver git pull origin main
cd /opt/digiserver/backend
sudo -u digiserver npm install --production
cd /opt/digiserver/frontend
sudo -u digiserver npm install
sudo -u digiserver npm run build-css-prod
sudo systemctl restart digiserver.service
```

### Monitorar Logs

```bash
# Ver logs do serviço
sudo journalctl -u digiserver.service -f

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup do Banco de Dados

```bash
# Criar backup
sudo -u postgres pg_dump digiserver_prod > /tmp/digiserver_backup_$(date +%Y%m%d).sql

# Restaurar backup
sudo -u postgres psql digiserver_prod < backup_file.sql
```

## Solução de Problemas

### Verificar Status do Serviço

```bash
sudo systemctl status digiserver.service
```

### Reiniciar Serviços

```bash
# Reiniciar aplicação
sudo systemctl restart digiserver.service

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
sudo -u digiserver psql -h localhost -U digiserver_user -d digiserver_prod

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
- [Documentação do PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)

## Suporte

Para suporte adicional, entre em contato com a equipe de desenvolvimento ou abra uma issue no repositório do projeto.