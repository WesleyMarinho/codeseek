# CodeSeek V1 - Guia de Instalação VPS Ubuntu

## 🚀 Instalação Rápida (Recomendado)

### OPÇÃO 1: Instalação Direta com Argumentos
```bash
# Com domínio personalizado e SSL automático
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/install-vps.sh)" -- meudominio.com admin@meudominio.com

# Ou apenas com IP (sem domínio personalizado)
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/install-vps.sh)" -- localhost
```

### OPÇÃO 2: Download e Instalação Interativa
```bash
# Baixar script
wget https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/install-vps.sh
chmod +x install-vps.sh

# Executar com interação
sudo ./install-vps.sh
```

### OPÇÃO 3: Via Clone do Repositório  
```bash
# Clone o repositório
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek

# Execute o script de instalação
sudo bash install-vps.sh meudominio.com admin@meudominio.com
```

⚠️ **IMPORTANTE:** A instalação via `curl | bash` não suporta entrada interativa. Use sempre os métodos acima.

## 📋 O que o script instala

- **Node.js 18.x** - Runtime JavaScript
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **Nginx** - Proxy reverso e servidor web
- **PM2** - Gerenciador de processos

## 🔧 Configurações Automáticas

### Usuários e Diretórios
- **Usuário**: `codeseek`
- **Diretório**: `/opt/codeseek`
- **Logs**: `/var/log/codeseek/`

### Banco de Dados
- **Nome**: `codeseek_db`
- **Usuário**: `codeseek_user`
- **Senha**: Gerada automaticamente e salva em `/opt/codeseek-credentials.env`

### Serviços
- **Aplicação**: PM2 (porta 3000)
- **Nginx**: Porta 80 (proxy para 3000)
- **PostgreSQL**: Porta 5432
- **Redis**: Porta 6379

## 🌐 Configuração de Domínio

### 1. Editar Nginx
```bash
sudo nano /etc/nginx/sites-available/codeseek
```

Alterar:
```nginx
server_name localhost;
```

Para:
```nginx
server_name seu-dominio.com www.seu-dominio.com;
```

### 2. Recarregar Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

## 📊 Comandos de Gerenciamento

### Status da Aplicação
```bash
sudo -u codeseek pm2 status
sudo -u codeseek pm2 logs codeseek
sudo -u codeseek pm2 monit
```

### Reiniciar Serviços
```bash
# Aplicação
sudo -u codeseek pm2 restart codeseek

# Nginx
sudo systemctl restart nginx

# Banco de dados
sudo systemctl restart postgresql redis
```

### Visualizar Logs
```bash
# Logs da aplicação
sudo -u codeseek pm2 logs codeseek --lines 50

# Logs do Nginx
sudo tail -f /var/log/nginx/codeseek_error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

## 🛠 Solução de Problemas

### 1. Aplicação não inicia
```bash
# Verificar erro
sudo -u codeseek pm2 logs codeseek

# Verificar configuração
cd /opt/codeseek
sudo -u codeseek cat backend/.env

# Testar manualmente
cd /opt/codeseek/backend
sudo -u codeseek node server.js
```

### 2. Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
sudo -u codeseek pm2 status

# Verificar porta 3000
sudo netstat -tlnp | grep :3000

# Reiniciar aplicação
sudo -u codeseek pm2 restart codeseek
```

### 3. Erro de conexão com banco
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Testar conexão
sudo -u postgres psql -c "\l"

# Verificar usuário do banco
sudo -u postgres psql -c "\du"
```

### 4. Problema com Redis
```bash
# Verificar Redis
sudo systemctl status redis

# Testar conexão
redis-cli ping
```

## 📈 Otimizações Recomendadas

### 1. Monitoramento
```bash
# Instalar htop para monitoramento
sudo apt install htop

# Configurar logrotate
sudo nano /etc/logrotate.d/codeseek
```

### 2. Backup Automático
```bash
# Criar script de backup
sudo nano /opt/backup-codeseek.sh

# Agendar no crontab
sudo crontab -e
# Adicionar: 0 2 * * * /opt/backup-codeseek.sh
```

### 3. Firewall (UFW)
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 🔍 Verificação Pós-Instalação

1. **Acesse**: `http://seu-ip-do-vps`
2. **Verifique logs**: Sem erros críticos
3. **Teste funcionalidades**: Registro, login, etc.
4. **Monitore recursos**: CPU e RAM

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/WesleyMarinho/codeseek/issues)
- **Logs**: `/var/log/codeseek/`
- **Configurações**: `/opt/codeseek/backend/.env`
- **Credenciais**: `/opt/codeseek-credentials.env`