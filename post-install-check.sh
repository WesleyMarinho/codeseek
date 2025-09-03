#!/bin/bash

# ==============================================================================
# POST-INSTALL CHECK SCRIPT - CodeSeek v1.0
# ==============================================================================
# Script para verificação pós-instalação do CodeSeek
# Verifica se todos os componentes estão funcionando corretamente
#
# Uso: sudo bash post-install-check.sh [DOMAIN]
# ==============================================================================

set -euo pipefail

# --- Cores para output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Funções de log ---
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
step() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

# --- Variáveis ---
DOMAIN="${1:-}"
APP_DIR="/opt/codeseek"
USER="codeseek"
SERVICE="codeseek"
CHECK_RESULTS=()
FAILED_CHECKS=0
TOTAL_CHECKS=0

# --- Função para adicionar resultado de check ---
add_check_result() {
    local check_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status" = "PASS" ]; then
        CHECK_RESULTS+=("✅ $check_name: $details")
        log "$check_name: PASS - $details"
    else
        CHECK_RESULTS+=("❌ $check_name: $details")
        error "$check_name: FAIL - $details"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# --- Função para verificar se comando existe ---
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# --- Verificar usuário codeseek ---
check_user() {
    step "Verificando usuário codeseek"
    
    if id "$USER" &>/dev/null; then
        local user_home=$(getent passwd "$USER" | cut -d: -f6)
        add_check_result "Usuário codeseek" "PASS" "Usuário existe com home: $user_home"
    else
        add_check_result "Usuário codeseek" "FAIL" "Usuário não encontrado"
    fi
}

# --- Verificar diretório da aplicação ---
check_app_directory() {
    step "Verificando diretório da aplicação"
    
    if [ -d "$APP_DIR" ]; then
        local owner=$(stat -c '%U' "$APP_DIR")
        local permissions=$(stat -c '%a' "$APP_DIR")
        add_check_result "Diretório da aplicação" "PASS" "Existe em $APP_DIR (owner: $owner, perms: $permissions)"
        
        # Verificar estrutura de diretórios
        local missing_dirs=()
        for dir in "frontend" "backend" "logs"; do
            if [ ! -d "$APP_DIR/$dir" ]; then
                missing_dirs+=("$dir")
            fi
        done
        
        if [ ${#missing_dirs[@]} -eq 0 ]; then
            add_check_result "Estrutura de diretórios" "PASS" "Todos os diretórios necessários existem"
        else
            add_check_result "Estrutura de diretórios" "FAIL" "Diretórios ausentes: ${missing_dirs[*]}"
        fi
    else
        add_check_result "Diretório da aplicação" "FAIL" "Diretório $APP_DIR não encontrado"
    fi
}

# --- Verificar Node.js e npm ---
check_nodejs() {
    step "Verificando Node.js e npm"
    
    if command_exists node; then
        local node_version=$(node --version)
        add_check_result "Node.js" "PASS" "Versão: $node_version"
    else
        add_check_result "Node.js" "FAIL" "Node.js não encontrado"
    fi
    
    if command_exists npm; then
        local npm_version=$(npm --version)
        add_check_result "npm" "PASS" "Versão: $npm_version"
        
        # Verificar se npm funciona para o usuário codeseek
        if sudo -u "$USER" which npm >/dev/null 2>&1; then
            add_check_result "npm para usuário codeseek" "PASS" "npm acessível para usuário codeseek"
        else
            add_check_result "npm para usuário codeseek" "FAIL" "npm não acessível para usuário codeseek"
        fi
    else
        add_check_result "npm" "FAIL" "npm não encontrado"
    fi
}

# --- Verificar dependências do backend ---
check_backend_dependencies() {
    step "Verificando dependências do backend"
    
    if [ -f "$APP_DIR/backend/package.json" ]; then
        add_check_result "package.json" "PASS" "Arquivo encontrado"
        
        if [ -d "$APP_DIR/backend/node_modules" ]; then
            local modules_count=$(find "$APP_DIR/backend/node_modules" -maxdepth 1 -type d | wc -l)
            add_check_result "node_modules" "PASS" "$modules_count módulos instalados"
        else
            add_check_result "node_modules" "FAIL" "Diretório node_modules não encontrado"
        fi
    else
        add_check_result "package.json" "FAIL" "Arquivo não encontrado"
    fi
}

# --- Verificar build do frontend ---
check_frontend_build() {
    step "Verificando build do frontend"
    
    if [ -d "$APP_DIR/frontend/dist" ]; then
        local files_count=$(find "$APP_DIR/frontend/dist" -type f | wc -l)
        add_check_result "Build do frontend" "PASS" "$files_count arquivos no diretório dist"
    else
        add_check_result "Build do frontend" "FAIL" "Diretório dist não encontrado"
    fi
}

# --- Verificar serviço PM2 ---
check_pm2_service() {
    step "Verificando serviço PM2"

    if pm2 describe "$SERVICE" >/dev/null 2>&1; then
        add_check_result "Processo PM2" "PASS" "$SERVICE encontrado"
    else
        add_check_result "Processo PM2" "FAIL" "$SERVICE não encontrado ou inativo"
    fi
}

# --- Verificar Nginx ---
check_nginx() {
    step "Verificando Nginx"
    
    if command_exists nginx; then
        local nginx_version=$(nginx -v 2>&1 | cut -d' ' -f3)
        add_check_result "Nginx" "PASS" "Versão: $nginx_version"
        
        if [ -f "/etc/nginx/sites-available/codeseek" ]; then
            add_check_result "Configuração Nginx" "PASS" "Arquivo de configuração encontrado"
            
            if [ -L "/etc/nginx/sites-enabled/codeseek" ]; then
                add_check_result "Site habilitado" "PASS" "Site codeseek habilitado"
            else
                add_check_result "Site habilitado" "FAIL" "Site codeseek não habilitado"
            fi
            
            # Testar configuração
            if nginx -t >/dev/null 2>&1; then
                add_check_result "Teste de configuração" "PASS" "Configuração Nginx válida"
            else
                add_check_result "Teste de configuração" "FAIL" "Configuração Nginx inválida"
            fi
        else
            add_check_result "Configuração Nginx" "FAIL" "Arquivo de configuração não encontrado"
        fi
        
        local nginx_status=$(systemctl is-active nginx 2>/dev/null || echo "inactive")
        if [ "$nginx_status" = "active" ]; then
            add_check_result "Status Nginx" "PASS" "Nginx está ativo"
        else
            add_check_result "Status Nginx" "FAIL" "Nginx não está ativo (status: $nginx_status)"
        fi
    else
        add_check_result "Nginx" "FAIL" "Nginx não encontrado"
    fi
}

# --- Gerar relatório final ---
generate_report() {
    step "Relatório Final"
    
    echo
    echo "==========================================="
    echo "         RELATÓRIO DE VERIFICAÇÃO"
    echo "==========================================="
    echo
    
    for result in "${CHECK_RESULTS[@]}"; do
        echo "$result"
    done
    
    echo
    echo "==========================================="
    echo "RESUMO: $((TOTAL_CHECKS - FAILED_CHECKS))/$TOTAL_CHECKS verificações passaram"
    
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        log "✅ Todas as verificações passaram! CodeSeek está funcionando corretamente."
        echo
        echo "🚀 Próximos passos:"
        echo "   • Acesse sua aplicação no navegador"
        echo "   • Configure seu primeiro projeto"
        echo "   • Monitore os logs em $APP_DIR/logs"
        return 0
    else
        error "❌ $FAILED_CHECKS verificações falharam. Verifique os problemas acima."
        echo
        echo "🔧 Para resolver problemas:"
        echo "   • Execute: sudo ./troubleshoot.sh"
        echo "   • Verifique logs: sudo journalctl -u $SERVICE -f"
        echo "   • Reinicie serviços: sudo systemctl restart $SERVICE nginx"
        return 1
    fi
}

# --- Função principal ---
main() {
    echo "==========================================="
    echo "    CodeSeek v1.0 - Verificação Pós-Instalação"
    echo "==========================================="
    echo
    
    # Verificar se está executando como root
    if [ "$(id -u)" -ne 0 ]; then
        error "Este script deve ser executado como root (use sudo)"
        exit 1
    fi
    
    # Executar todas as verificações
    check_user
    check_app_directory
    check_nodejs
    check_backend_dependencies
    check_frontend_build
    check_pm2_service
    check_nginx
    
    # Gerar relatório final
    generate_report
}

# Executar script principal
main "$@"

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