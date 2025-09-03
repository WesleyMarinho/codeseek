#!/bin/bash

# ==============================================================================
# Script de verificação pós-instalação do CodeSeek
# ==============================================================================
#
# Este script verifica se a instalação do CodeSeek foi bem-sucedida
# e se todos os serviços estão funcionando corretamente.
#
# Uso: sudo bash post-install-check.sh [DOMAIN]
#
# ==============================================================================

# --- Cores para output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Funções de Logging ---
log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# --- Variáveis ---
DOMAIN="$1"
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
ERROR_COUNT=0
WARNING_COUNT=0

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CodeSeek - Verificação Pós-Instalação  ${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# ==============================================================================
# 1. VERIFICAÇÕES DE ARQUIVOS E DIRETÓRIOS
# ==============================================================================

info "Verificando estrutura de arquivos..."

if [ -d "$APP_DIR" ]; then
    log "Diretório da aplicação existe: $APP_DIR"
else
    error "Diretório da aplicação não encontrado: $APP_DIR"
    ((ERROR_COUNT++))
fi

if [ -f "$APP_DIR/backend/server.js" ]; then
    log "Arquivo principal do servidor encontrado"
else
    error "Arquivo principal do servidor não encontrado"
    ((ERROR_COUNT++))
fi

if [ -f "$APP_DIR/backend/.env" ]; then
    log "Arquivo de configuração .env encontrado"
    
    # Verificar variáveis essenciais
    if grep -q "DB_NAME=" "$APP_DIR/backend/.env" && 
       grep -q "DB_USER=" "$APP_DIR/backend/.env" && 
       grep -q "DB_PASSWORD=" "$APP_DIR/backend/.env"; then
        log "Variáveis de banco de dados configuradas"
    else
        error "Variáveis de banco de dados não configuradas corretamente"
        ((ERROR_COUNT++))
    fi
else
    error "Arquivo de configuração .env não encontrado"
    ((ERROR_COUNT++))
fi

if [ -d "$APP_DIR/backend/node_modules" ]; then
    log "Dependências do backend instaladas"
else
    error "Dependências do backend não instaladas"
    ((ERROR_COUNT++))
fi

if [ -d "$APP_DIR/backend/uploads" ]; then
    log "Diretório de uploads configurado"
else
    warning "Diretório de uploads não encontrado"
    ((WARNING_COUNT++))
fi

# ==============================================================================
# 2. VERIFICAÇÕES DE USUÁRIO E PERMISSÕES
# ==============================================================================

info "Verificando usuário e permissões..."

if id -u $APP_USER &>/dev/null; then
    log "Usuário '$APP_USER' existe"
    
    # Verificar propriedade dos arquivos
    if [ "$(stat -c '%U' $APP_DIR)" == "$APP_USER" ]; then
        log "Propriedade do diretório da aplicação está correta"
    else
        error "Propriedade do diretório da aplicação está incorreta"
        ((ERROR_COUNT++))
    fi
else
    error "Usuário '$APP_USER' não existe"
    ((ERROR_COUNT++))
fi

# ==============================================================================
# 3. VERIFICAÇÕES DE SERVIÇOS
# ==============================================================================

info "Verificando serviços do sistema..."

# PostgreSQL
if systemctl is-active --quiet postgresql; then
    log "PostgreSQL está rodando"
    
    # Testar conexão
    if sudo -u postgres psql -c "SELECT 1" &>/dev/null; then
        log "PostgreSQL está respondendo"
    else
        error "PostgreSQL não está respondendo"
        ((ERROR_COUNT++))
    fi
else
    error "PostgreSQL não está rodando"
    ((ERROR_COUNT++))
fi

# Redis
if systemctl is-active --quiet redis-server; then
    log "Redis está rodando"
    
    # Testar conexão
    if redis-cli ping | grep -q "PONG"; then
        log "Redis está respondendo"
    else
        error "Redis não está respondendo"
        ((ERROR_COUNT++))
    fi
else
    error "Redis não está rodando"
    ((ERROR_COUNT++))
fi

# Nginx
if systemctl is-active --quiet nginx; then
    log "Nginx está rodando"
    
    # Verificar configuração
    if nginx -t &>/dev/null; then
        log "Configuração do Nginx está válida"
    else
        error "Configuração do Nginx está inválida"
        ((ERROR_COUNT++))
    fi
else
    error "Nginx não está rodando"
    ((ERROR_COUNT++))
fi

# CodeSeek Service
if systemctl is-active --quiet codeseek.service; then
    log "Serviço CodeSeek está rodando"
else
    error "Serviço CodeSeek não está rodando"
    ((ERROR_COUNT++))
fi

# ==============================================================================
# 4. VERIFICAÇÕES DE BANCO DE DADOS
# ==============================================================================

info "Verificando banco de dados..."

if [ -f "$APP_DIR/backend/.env" ]; then
    DB_NAME=$(grep DB_NAME "$APP_DIR/backend/.env" | cut -d '=' -f2)
    DB_USER=$(grep DB_USER "$APP_DIR/backend/.env" | cut -d '=' -f2)
    
    # Verificar se o banco existe
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log "Banco de dados '$DB_NAME' existe"
        
        # Verificar se há tabelas
        TABLE_COUNT=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
        if [ "$TABLE_COUNT" -gt 0 ]; then
            log "Banco de dados possui $TABLE_COUNT tabela(s)"
        else
            warning "Banco de dados está vazio (sem tabelas)"
            ((WARNING_COUNT++))
        fi
    else
        error "Banco de dados '$DB_NAME' não existe"
        ((ERROR_COUNT++))
    fi
    
    # Verificar se o usuário do banco existe
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
        log "Usuário do banco '$DB_USER' existe"
    else
        error "Usuário do banco '$DB_USER' não existe"
        ((ERROR_COUNT++))
    fi
fi

# ==============================================================================
# 5. VERIFICAÇÕES DE CONECTIVIDADE
# ==============================================================================

info "Verificando conectividade da aplicação..."

# Testar porta 3000 (aplicação)
if netstat -tuln | grep -q ":3000 "; then
    log "Aplicação está escutando na porta 3000"
    
    # Testar resposta HTTP
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
    if [[ "$HTTP_CODE" =~ ^(200|302|404)$ ]]; then
        log "Aplicação está respondendo (HTTP $HTTP_CODE)"
    else
        error "Aplicação não está respondendo corretamente (HTTP $HTTP_CODE)"
        ((ERROR_COUNT++))
    fi
else
    error "Aplicação não está escutando na porta 3000"
    ((ERROR_COUNT++))
fi

# Testar porta 80 (Nginx)
if netstat -tuln | grep -q ":80 "; then
    log "Nginx está escutando na porta 80"
else
    error "Nginx não está escutando na porta 80"
    ((ERROR_COUNT++))
fi

# Testar porta 443 (HTTPS) se configurado
if netstat -tuln | grep -q ":443 "; then
    log "Nginx está escutando na porta 443 (HTTPS)"
else
    info "Nginx não está escutando na porta 443 (HTTPS não configurado)"
fi

# ==============================================================================
# 6. VERIFICAÇÕES DE DOMÍNIO (se fornecido)
# ==============================================================================

if [[ -n "$DOMAIN" ]]; then
    info "Verificando configuração do domínio $DOMAIN..."
    
    # Verificar se o domínio está configurado no Nginx
    if grep -r "$DOMAIN" /etc/nginx/sites-enabled/ &>/dev/null; then
        log "Domínio '$DOMAIN' configurado no Nginx"
    else
        error "Domínio '$DOMAIN' não configurado no Nginx"
        ((ERROR_COUNT++))
    fi
    
    # Testar acesso HTTP
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" http://localhost || echo "000")
    if [[ "$HTTP_CODE" =~ ^(200|302|404)$ ]]; then
        log "Domínio responde via HTTP (código $HTTP_CODE)"
    else
        warning "Domínio não responde via HTTP (código $HTTP_CODE)"
        ((WARNING_COUNT++))
    fi
    
    # Verificar certificado SSL se HTTPS estiver configurado
    if netstat -tuln | grep -q ":443 "; then
        if echo | openssl s_client -servername "$DOMAIN" -connect localhost:443 2>/dev/null | grep -q "Verify return code: 0"; then
            log "Certificado SSL válido para $DOMAIN"
        else
            warning "Certificado SSL pode ter problemas para $DOMAIN"
            ((WARNING_COUNT++))
        fi
    fi
fi

# ==============================================================================
# 7. VERIFICAÇÕES DE LOGS
# ==============================================================================

info "Verificando logs recentes..."

# Verificar logs do CodeSeek
if journalctl -u codeseek.service --since "5 minutes ago" | grep -i error; then
    warning "Erros encontrados nos logs do CodeSeek (últimos 5 minutos)"
    ((WARNING_COUNT++))
else
    log "Nenhum erro nos logs do CodeSeek (últimos 5 minutos)"
fi

# Verificar logs do Nginx
if tail -n 50 /var/log/nginx/error.log 2>/dev/null | grep -i error; then
    warning "Erros encontrados nos logs do Nginx"
    ((WARNING_COUNT++))
else
    log "Nenhum erro recente nos logs do Nginx"
fi

# ==============================================================================
# 8. TESTE DE FUNCIONALIDADES BÁSICAS
# ==============================================================================

info "Testando funcionalidades básicas..."

# Testar diagnóstico da aplicação
if [ -f "$APP_DIR/backend/diagnose.js" ]; then
    cd "$APP_DIR/backend"
    if sudo -u $APP_USER node diagnose.js &>/dev/null; then
        log "Diagnóstico da aplicação passou"
    else
        warning "Diagnóstico da aplicação falhou"
        ((WARNING_COUNT++))
    fi
else
    info "Script de diagnóstico não encontrado"
fi

# ==============================================================================
# 9. RELATÓRIO FINAL
# ==============================================================================

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}  Relatório da Verificação Pós-Instalação  ${NC}"
echo -e "${BLUE}=========================================${NC}\n"

if [ "$ERROR_COUNT" -eq 0 ] && [ "$WARNING_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ Instalação bem-sucedida! Todos os testes passaram.${NC}"
    echo -e "\n${GREEN}🎉 CodeSeek está pronto para uso!${NC}"
    
    if [[ -n "$DOMAIN" ]]; then
        echo -e "\nAcesse sua aplicação em:"
        if netstat -tuln | grep -q ":443 "; then
            echo -e "${BLUE}https://$DOMAIN${NC}"
        else
            echo -e "${BLUE}http://$DOMAIN${NC}"
        fi
    else
        echo -e "\nAcesse sua aplicação em:"
        echo -e "${BLUE}http://localhost${NC} ou ${BLUE}http://SEU_IP${NC}"
    fi
    
elif [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Instalação concluída com $WARNING_COUNT aviso(s)${NC}"
    echo -e "\nA aplicação deve estar funcionando, mas há alguns avisos."
    echo -e "Recomenda-se revisar os avisos acima."
    
else
    echo -e "${RED}✗ Instalação com problemas!${NC}"
    echo -e "\nEncontrados $ERROR_COUNT erro(s) e $WARNING_COUNT aviso(s)."
    echo -e "\nA aplicação pode não estar funcionando corretamente."
    echo -e "\n${YELLOW}Comandos úteis para diagnóstico:${NC}"
    echo -e "Ver logs do CodeSeek:     ${BLUE}sudo journalctl -u codeseek.service -f${NC}"
    echo -e "Ver logs do Nginx:        ${BLUE}sudo tail -f /var/log/nginx/error.log${NC}"
    echo -e "Reiniciar CodeSeek:       ${BLUE}sudo systemctl restart codeseek.service${NC}"
    echo -e "Diagnóstico da aplicação: ${BLUE}cd $APP_DIR/backend && sudo -u $APP_USER node diagnose.js${NC}"
    echo -e "\nPara troubleshooting detalhado, execute:"
    echo -e "${BLUE}sudo bash troubleshoot.sh${NC}"
fi

echo -e "\n${BLUE}=========================================${NC}"
echo -e "Erros: ${RED}$ERROR_COUNT${NC} | Avisos: ${YELLOW}$WARNING_COUNT${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# Salvar relatório
REPORT_FILE="$APP_DIR/post-install-report.txt"
cat > "$REPORT_FILE" << EOF
CodeSeek Post-Installation Report
=================================
Check Date: $(date)
Domain: ${DOMAIN:-"Not specified"}
Errors: $ERROR_COUNT
Warnings: $WARNING_COUNT

Status Summary:
- Application Directory: $([ -d "$APP_DIR" ] && echo "OK" || echo "MISSING")
- CodeSeek Service: $(systemctl is-active codeseek.service 2>/dev/null || echo "inactive")
- PostgreSQL: $(systemctl is-active postgresql 2>/dev/null || echo "inactive")
- Redis: $(systemctl is-active redis-server 2>/dev/null || echo "inactive")
- Nginx: $(systemctl is-active nginx 2>/dev/null || echo "inactive")
- Port 3000: $(netstat -tuln | grep -q ":3000 " && echo "LISTENING" || echo "NOT LISTENING")
- Port 80: $(netstat -tuln | grep -q ":80 " && echo "LISTENING" || echo "NOT LISTENING")
- Port 443: $(netstat -tuln | grep -q ":443 " && echo "LISTENING" || echo "NOT LISTENING")

For detailed logs, check:
- CodeSeek: sudo journalctl -u codeseek.service
- Nginx: sudo tail /var/log/nginx/error.log
- PostgreSQL: sudo tail /var/log/postgresql/postgresql-*-main.log
EOF

if [ -d "$APP_DIR" ]; then
    chown $APP_USER:$APP_USER "$REPORT_FILE" 2>/dev/null
fi

info "Relatório salvo em: $REPORT_FILE"

exit $ERROR_COUNT