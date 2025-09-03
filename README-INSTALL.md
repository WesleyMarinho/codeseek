# 🚀 CodeSeek V1 - Instalação Automática

> **Deploy 100% automático sem intervenção manual**

## ⚡ Instalação Rápida (Recomendada)

### 1️⃣ Deploy Completo em Uma Linha

```bash
# Clone o repositório
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek

# Execute o deploy automático
sudo bash deploy.sh meudominio.com admin@meudominio.com
```

**Pronto! 🎉** O CodeSeek V1 estará instalado e funcionando.

---

## 📋 O que o Deploy Automático Faz

✅ **Configuração de Scripts** - Prepara todos os scripts de instalação  
✅ **Verificação Pré-Instalação** - Checa requisitos do sistema  
✅ **Instalação Completa** - Instala todas as dependências e serviços  
✅ **Configuração de Banco** - PostgreSQL + Redis  
✅ **Configuração Web** - Nginx + SSL (se domínio válido)  
✅ **Verificação Pós-Instalação** - Testa se tudo está funcionando  
✅ **Correção Automática** - Resolve problemas automaticamente  
✅ **Testes de Conectividade** - Verifica portas e URLs  
✅ **Relatório Final** - Mostra URLs, credenciais e comandos úteis  

---

## 🎯 Parâmetros do Deploy

```bash
sudo bash deploy.sh [DOMAIN] [EMAIL] [DB_NAME] [DB_USER]
```

| Parâmetro | Descrição | Padrão | Exemplo |
|-----------|-----------|--------|---------|
| `DOMAIN` | Domínio do site | `localhost` | `meusite.com` |
| `EMAIL` | Email para SSL | `admin@localhost` | `admin@meusite.com` |
| `DB_NAME` | Nome do banco | `codeseek_db` | `meu_banco` |
| `DB_USER` | Usuário do banco | `codeseek_user` | `meu_usuario` |

### Exemplos:

```bash
# Instalação local (desenvolvimento)
sudo bash deploy.sh

# Instalação com domínio (produção)
sudo bash deploy.sh meusite.com admin@meusite.com

# Instalação personalizada
sudo bash deploy.sh meusite.com admin@meusite.com meu_banco meu_usuario
```

---

## 🔧 Scripts Disponíveis

| Script | Descrição | Uso |
|--------|-----------|-----|
| **`deploy.sh`** | 🎯 **Deploy completo automático** | `sudo bash deploy.sh [domain] [email]` |
| `one-line-install.sh` | Instalação rápida | `sudo bash one-line-install.sh` |
| `install-auto.sh` | Instalação automática | `sudo bash install-auto.sh` |
| `pre-install-check.sh` | Verificação pré-instalação | `bash pre-install-check.sh` |
| `post-install-check.sh` | Verificação pós-instalação | `bash post-install-check.sh` |
| `troubleshoot.sh` | Diagnóstico e correção | `sudo bash troubleshoot.sh` |
| `setup-scripts.sh` | Configuração de scripts | `bash setup-scripts.sh` |
| `monitor.sh` | Monitoramento do sistema | `bash monitor.sh` |
| `backup-database.sh` | Backup automático | `bash backup-database.sh` |
| `help.sh` | Ajuda e exemplos | `bash help.sh` |

---

## 📊 Comandos Úteis (Pós-Instalação)

### Status do Sistema
```bash
# Status geral
sudo systemctl status codeseek

# Logs em tempo real
sudo journalctl -u codeseek -f

# Status do Nginx
sudo systemctl status nginx

# Status do PostgreSQL
sudo systemctl status postgresql

# Status do Redis
sudo systemctl status redis
```

### Controle do Serviço
```bash
# Parar o serviço
sudo systemctl stop codeseek

# Iniciar o serviço
sudo systemctl start codeseek

# Reiniciar o serviço
sudo systemctl restart codeseek

# Recarregar configuração
sudo systemctl reload codeseek
```

### Logs e Diagnóstico
```bash
# Logs da aplicação
sudo tail -f /var/log/codeseek/app.log

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Diagnóstico completo
sudo bash troubleshoot.sh

# Verificação pós-instalação
bash post-install-check.sh
```

---

## 🌐 URLs de Acesso

Após a instalação, acesse:

- **Site Principal**: `http://seu-dominio.com` ou `http://localhost:3000`
- **Painel Admin**: `http://seu-dominio.com/admin`
- **Dashboard**: `http://seu-dominio.com/dashboard`
- **API**: `http://seu-dominio.com/api`

---

## 🔑 Credenciais Padrão

### Banco de Dados
- **Host**: `localhost`
- **Porta**: `5432`
- **Banco**: `codeseek_db`
- **Usuário**: `codeseek_user`
- **Senha**: Gerada automaticamente (veja logs)

### Admin Padrão
- **Email**: `admin@localhost`
- **Senha**: `admin123` (altere após primeiro login)

### Redis
- **Host**: `localhost`
- **Porta**: `6379`
- **Sem senha** (configuração local)

---

## 📁 Estrutura de Diretórios

```
/opt/codeseek/          # Aplicação principal
├── backend/            # Backend Node.js
├── frontend/           # Frontend estático
├── logs/              # Logs da aplicação
└── uploads/           # Arquivos enviados

/etc/nginx/sites-available/codeseek  # Configuração Nginx
/etc/systemd/system/codeseek.service # Serviço systemd
/var/log/codeseek/                   # Logs do sistema
```

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Serviço não inicia
```bash
# Verificar logs
sudo journalctl -u codeseek -n 50

# Verificar configuração
sudo bash troubleshoot.sh

# Reiniciar serviços
sudo systemctl restart codeseek nginx postgresql redis
```

#### 2. Erro de conexão com banco
```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Testar conexão
sudo -u postgres psql -c "\l"

# Recriar banco (cuidado!)
sudo bash troubleshoot.sh --fix-database
```

#### 3. SSL não funciona
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Reconfigurar SSL
sudo bash troubleshoot.sh --fix-ssl
```

#### 4. Porta 3000 em uso
```bash
# Verificar processo na porta
sudo lsof -i :3000

# Matar processo
sudo kill -9 <PID>

# Reiniciar serviço
sudo systemctl restart codeseek
```

### Correção Automática
```bash
# Diagnóstico e correção automática
sudo bash troubleshoot.sh --auto-fix

# Verificação completa
bash post-install-check.sh
```

---

## 📚 Documentação Completa

- **[INSTALLATION.md](INSTALLATION.md)** - Guia detalhado de instalação
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia de deploy em produção
- **[ROADMAP.md](ROADMAP.md)** - Próximas funcionalidades
- **[README.md](README.md)** - Visão geral do projeto

---

## 🔒 Segurança (Pós-Instalação)

### Configurações Recomendadas
```bash
# Alterar senha do admin
# Acesse: http://seu-dominio.com/admin

# Configurar firewall UFW
sudo ufw enable
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS

# Desabilitar login root SSH (opcional)
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
sudo systemctl restart ssh
```

### Backup Automático
```bash
# Configurar backup diário
sudo crontab -e
# Adicionar: 0 2 * * * /opt/codeseek/backup-database.sh

# Testar backup
sudo bash backup-database.sh
```

---

## 🎯 Próximos Passos

1. **Configurar domínio** - Apontar DNS para o servidor
2. **Personalizar branding** - Logo, cores, textos
3. **Configurar email** - SMTP para notificações
4. **Adicionar produtos** - Cadastrar produtos para venda
5. **Configurar pagamentos** - Integrar gateway de pagamento
6. **Monitoramento** - Configurar alertas e backups

---

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/WesleyMarinho/codeseek/issues)
- **Documentação**: Arquivos MD no repositório
- **Logs**: `/var/log/codeseek/`
- **Diagnóstico**: `sudo bash troubleshoot.sh`

---

**✨ CodeSeek V1 - Licenciamento de software simplificado!**