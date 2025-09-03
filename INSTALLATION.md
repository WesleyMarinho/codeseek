# CodeSeek V1 - Guia de Instalação Automática

## 🚀 Instalação em Uma Linha (Recomendado)

Para uma instalação completamente automática sem intervenção manual:

```bash
# Instalação direta do repositório
curl -fsSL https://raw.githubusercontent.com/seu-usuario/codeseek/main/one-line-install.sh | sudo bash -s -- yourdomain.com admin@yourdomain.com

# Ou instalação local
sudo bash one-line-install.sh yourdomain.com admin@yourdomain.com
```

## 🎯 Deploy Completo Automático

Para um deploy 100% automático com verificações e correções:

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/codeseek.git
cd codeseek

# Execute o deploy completo
sudo bash deploy.sh meudominio.com admin@meudominio.com codeseek_db codeseek_user
```

O script `deploy.sh` executa automaticamente:
- ✅ Configuração de todos os scripts
- ✅ Verificação pré-instalação
- ✅ Instalação completa
- ✅ Verificação pós-instalação
- ✅ Correção automática de problemas
- ✅ Testes de conectividade
- ✅ Relatório final detalhado

### Parâmetros

- `yourdomain.com` - Seu domínio (obrigatório)
- `admin@yourdomain.com` - Email para certificado SSL (obrigatório)
- `db_name` - Nome do banco de dados (opcional, padrão: codeseek_db)
- `db_user` - Usuário do banco (opcional, padrão: codeseek_user)

### Exemplo Completo

```bash
sudo bash one-line-install.sh meusite.com admin@meusite.com minha_db meu_usuario
```

---

## 📋 Scripts Disponíveis

### 1. `deploy.sh` (🎯 Recomendado)
Deploy completo 100% automático com todas as verificações e correções.

**Uso:**
```bash
sudo bash deploy.sh [DOMAIN] [EMAIL] [DB_NAME] [DB_USER]
```

**Funcionalidades:**
- ✅ Configuração automática de scripts
- ✅ Verificação pré-instalação
- ✅ Instalação completa
- ✅ Verificação pós-instalação
- ✅ Correção automática de problemas
- ✅ Testes de conectividade
- ✅ Relatório final detalhado
- ✅ Logs completos
- ✅ Tratamento de erros

### 2. `one-line-install.sh` - Instalação Automática Completa

**O que faz:**
- ✅ Atualiza o sistema
- ✅ Instala todas as dependências (Node.js, PostgreSQL, Redis, Nginx)
- ✅ Configura usuário e diretórios
- ✅ Clona o repositório
- ✅ Configura banco de dados
- ✅ Gera senhas seguras
- ✅ Configura SSL com Let's Encrypt
- ✅ Configura firewall
- ✅ Inicia todos os serviços
- ✅ Executa verificações finais

**Uso:**
```bash
sudo bash one-line-install.sh DOMAIN SSL_EMAIL [DB_NAME] [DB_USER]
```

### 3. `install-auto.sh` - Instalação Automática Alternativa

**O que faz:**
- Similar ao `one-line-install.sh` mas com interface ligeiramente diferente
- Aceita parâmetros via linha de comando
- Inclui verificações adicionais

**Uso:**
```bash
sudo bash install-auto.sh --domain=meusite.com --email=admin@meusite.com
```

### 4. `setup-scripts.sh` - Configuração de Scripts

**O que faz:**
- Configura todos os scripts e cria arquivos auxiliares
- Prepara o ambiente para instalação
- Gera arquivos de configuração

**Uso:**
```bash
sudo bash setup-scripts.sh
```

### 5. `pre-install-check.sh` - Verificação Pré-Instalação

**O que faz:**
- ✅ Verifica sistema operacional
- ✅ Verifica privilégios de root
- ✅ Verifica conectividade
- ✅ Verifica espaço em disco e memória
- ✅ Verifica portas necessárias
- ✅ Verifica dependências existentes

**Uso:**
```bash
sudo bash pre-install-check.sh
```

### 6. `post-install-check.sh` - Verificação Pós-Instalação

**O que faz:**
- ✅ Verifica se todos os serviços estão rodando
- ✅ Testa conectividade da aplicação
- ✅ Verifica configurações do banco
- ✅ Testa SSL e domínio
- ✅ Verifica logs por erros

**Uso:**
```bash
sudo bash post-install-check.sh
```

### 7. `troubleshoot.sh` - Diagnóstico e Correção

**O que faz:**
- 🔍 Diagnostica problemas comuns
- 🔧 Corrige problemas automaticamente (com --fix)
- 📋 Gera relatório detalhado
- 📊 Analisa logs de erro

**Uso:**
```bash
# Apenas diagnóstico
sudo bash troubleshoot.sh

# Diagnóstico + correção automática
sudo bash troubleshoot.sh --fix
```

### 8. `help.sh` - Ajuda e Documentação

**O que faz:**
- Exibe ajuda completa sobre todos os scripts
- Lista exemplos de uso
- Mostra links úteis

**Uso:**
```bash
bash help.sh
```

---

## 🛠️ Processo de Instalação Completo

### Passo 1: Preparação

```bash
# 1. Conecte-se à sua VPS
ssh root@seu-servidor.com

# 2. Atualize o sistema (opcional - o script faz isso)
apt update && apt upgrade -y

# 3. Baixe os scripts
wget https://github.com/seu-usuario/codeseek/archive/main.zip
unzip main.zip
cd codeseek-main
```

### Passo 2: Verificação Pré-Instalação (Opcional)

```bash
sudo bash pre-install-check.sh
```

### Passo 3: Instalação Automática

```bash
# Substitua pelos seus dados
sudo bash one-line-install.sh meudominio.com admin@meudominio.com
```

### Passo 4: Verificação Pós-Instalação

```bash
sudo bash post-install-check.sh
```

### Passo 5: Troubleshooting (Se Necessário)

```bash
# Se houver problemas
sudo bash troubleshoot.sh --fix
```

---

## 📊 O Que é Instalado

### Dependências do Sistema
- **Node.js 18.x** - Runtime da aplicação
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **Nginx** - Servidor web e proxy reverso
- **Certbot** - Certificados SSL automáticos
- **UFW** - Firewall
- **Fail2ban** - Proteção contra ataques

### Estrutura de Diretórios
```
/opt/codeseek/
├── backend/           # Aplicação Node.js
│   ├── .env          # Variáveis de ambiente
│   ├── server.js     # Servidor principal
│   └── ...
├── frontend/         # Assets do frontend
├── uploads/          # Arquivos enviados
├── logs/            # Logs da aplicação
├── backups/         # Backups do banco
└── installation-info.txt  # Info da instalação
```

### Serviços Configurados
- **codeseek.service** - Aplicação principal
- **nginx** - Servidor web
- **postgresql** - Banco de dados
- **redis-server** - Cache

---

## 🔧 Configuração Pós-Instalação

### 1. Variáveis de Ambiente

Edite `/opt/codeseek/backend/.env` para configurar:

```bash
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# Pagamentos (Stripe)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

### 2. Reiniciar Após Mudanças

```bash
sudo systemctl restart codeseek
```

### 3. Configurar Backups Automáticos

```bash
# Adicionar ao crontab
sudo crontab -e

# Backup diário às 2h da manhã
0 2 * * * /opt/codeseek/backup-database.sh
```

---

## 🔍 Comandos de Monitoramento

### Status dos Serviços
```bash
sudo systemctl status codeseek nginx postgresql redis-server
```

### Logs em Tempo Real
```bash
# Logs da aplicação
sudo journalctl -u codeseek.service -f

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Logs da aplicação (arquivo)
sudo tail -f /opt/codeseek/logs/app.log
```

### Verificar Conectividade
```bash
# Testar aplicação local
curl http://localhost:3000

# Testar Nginx
curl http://localhost

# Testar HTTPS
curl https://seudominio.com
```

### Verificar Banco de Dados
```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Listar bancos
\l

# Conectar ao banco da aplicação
\c codeseek_db

# Listar tabelas
\dt
```

---

## 🚨 Troubleshooting Comum

### Problema: Aplicação não inicia
```bash
# Verificar logs
sudo journalctl -u codeseek.service -n 50

# Verificar arquivo .env
sudo cat /opt/codeseek/backend/.env

# Testar manualmente
cd /opt/codeseek/backend
sudo -u codeseek node server.js
```

### Problema: Erro de banco de dados
```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Verificar conectividade
sudo -u postgres psql -c "SELECT 1"

# Recriar banco se necessário
sudo -u postgres dropdb codeseek_db
sudo -u postgres createdb codeseek_db -O codeseek_user
```

### Problema: SSL não funciona
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Reconfigurar SSL
sudo certbot --nginx -d seudominio.com
```

### Problema: Nginx não inicia
```bash
# Testar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Recarregar configuração
sudo systemctl reload nginx
```

---

## 🔄 Comandos de Manutenção

### Reiniciar Todos os Serviços
```bash
sudo systemctl restart codeseek nginx postgresql redis-server
```

### Atualizar Aplicação
```bash
cd /opt/codeseek
sudo -u codeseek git pull
cd backend
sudo -u codeseek npm install --production
sudo systemctl restart codeseek
```

### Backup Manual
```bash
# Backup do banco
sudo -u postgres pg_dump codeseek_db > /opt/codeseek/backups/backup-$(date +%Y%m%d).sql

# Backup dos arquivos
tar -czf /opt/codeseek/backups/files-$(date +%Y%m%d).tar.gz /opt/codeseek/uploads
```

### Restaurar Backup
```bash
# Restaurar banco
sudo -u postgres psql codeseek_db < /opt/codeseek/backups/backup-20231201.sql

# Restaurar arquivos
tar -xzf /opt/codeseek/backups/files-20231201.tar.gz -C /
```

---

## 📞 Suporte

Se você encontrar problemas:

1. **Execute o diagnóstico automático:**
   ```bash
   sudo bash troubleshoot.sh --fix
   ```

2. **Verifique os logs:**
   ```bash
   sudo journalctl -u codeseek.service -n 100
   ```

3. **Execute a verificação pós-instalação:**
   ```bash
   sudo bash post-install-check.sh
   ```

4. **Consulte a documentação completa no repositório**

---

## 🔒 Segurança

### Configurações Aplicadas Automaticamente
- ✅ Firewall UFW configurado
- ✅ Fail2ban para proteção SSH
- ✅ SSL/TLS com Let's Encrypt
- ✅ Headers de segurança no Nginx
- ✅ Permissões restritivas nos arquivos
- ✅ Usuário dedicado para a aplicação
- ✅ Senhas geradas automaticamente

### Recomendações Adicionais
- 🔑 Altere a porta SSH padrão
- 🔑 Configure autenticação por chave SSH
- 🔑 Monitore logs regularmente
- 🔑 Mantenha o sistema atualizado
- 🔑 Configure backups automáticos

---

## 📈 Performance

### Otimizações Incluídas
- ✅ Compressão Gzip no Nginx
- ✅ Cache de arquivos estáticos
- ✅ Pool de conexões do banco
- ✅ Redis para cache de sessões
- ✅ Configurações otimizadas do Node.js

### Monitoramento
```bash
# Uso de recursos
htop

# Espaço em disco
df -h

# Uso de memória
free -h

# Conexões de rede
netstat -tuln
```

---

**🎉 Pronto! Sua instalação do CodeSeek V1 está completa e otimizada para produção.**