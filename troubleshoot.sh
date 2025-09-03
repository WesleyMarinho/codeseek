#!/bin/bash

# ==============================================================================
# Script de troubleshooting do CodeSeek
# ==============================================================================
#
# Este script diagnostica e resolve problemas comuns da instalação do CodeSeek
#
# Uso: sudo bash troubleshoot.sh [--fix]
#
# Opções:
#   --fix    Tenta corrigir automaticamente os problemas encontrados
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

fix() {
    echo -e "${BLUE}[FIX]${NC} $1"
}

# --- Variáveis ---
APP_DIR="/opt/codeseek"
APP_USER="codeseek"
FIX_MODE=false
ISSUES_FOUND=0
ISSUES_FIXED=0

if [[ "$1" == "--fix" ]]; then
    FIX_MODE=true
    info "Modo de correção automática ativado"
fi

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CodeSeek - Troubleshooting  ${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# ==============================================================================
# 1. DIAGNÓSTICO DE SERVIÇOS
# ==============================================================================

info "Diagnosticando serviços..."

# PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    error "PostgreSQL não está rodando"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Tentando iniciar PostgreSQL..."
        if systemctl start postgresql; then
            log "PostgreSQL iniciado com sucesso"
            ((ISSUES_FIXED++))
        else
            error "Falha ao iniciar PostgreSQL"
            warning "Verifique os logs: sudo journalctl -u postgresql"
        fi
    fi
else
    log "PostgreSQL está rodando"
fi

# Redis
if ! systemctl is-active --quiet redis-server; then
    error "Redis não está rodando"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Tentando iniciar Redis..."
        if systemctl start redis-server; then
            log "Redis iniciado com sucesso"
            ((ISSUES_FIXED++))
        else
            error "Falha ao iniciar Redis"
            warning "Verifique os logs: sudo journalctl -u redis-server"
        fi
    fi
else
    log "Redis está rodando"
fi

# Nginx
if ! systemctl is-active --quiet nginx; then
    error "Nginx não está rodando"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Verificando configuração do Nginx..."
        if nginx -t; then
            fix "Tentando iniciar Nginx..."
            if systemctl start nginx; then
                log "Nginx iniciado com sucesso"
                ((ISSUES_FIXED++))
            else
                error "Falha ao iniciar Nginx"
            fi
        else
            error "Configuração do Nginx inválida"
            warning "Corrija a configuração em /etc/nginx/sites-enabled/"
        fi
    fi
else
    log "Nginx está rodando"
fi

# CodeSeek Service
if ! systemctl is-active --quiet codeseek.service; then
    error "Serviço CodeSeek não está rodando"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Tentando iniciar serviço CodeSeek..."
        if systemctl start codeseek.service; then
            log "Serviço CodeSeek iniciado com sucesso"
            ((ISSUES_FIXED++))
        else
            error "Falha ao iniciar serviço CodeSeek"
            warning "Verificando logs detalhados..."
            journalctl -u codeseek.service --no-pager -n 20
        fi
    fi
else
    log "Serviço CodeSeek está rodando"
fi

# ==============================================================================
# 2. DIAGNÓSTICO DE CONECTIVIDADE
# ==============================================================================

info "Diagnosticando conectividade..."

# Porta 3000 (aplicação)
if ! netstat -tuln | grep -q ":3000 "; then
    error "Aplicação não está escutando na porta 3000"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Verificando processo na porta 3000..."
        if lsof -ti:3000; then
            warning "Processo encontrado na porta 3000, mas não é o esperado"
            fix "Tentando reiniciar serviço CodeSeek..."
            systemctl restart codeseek.service
            sleep 5
            if netstat -tuln | grep -q ":3000 "; then
                log "Porta 3000 agora está ativa"
                ((ISSUES_FIXED++))
            fi
        else
            warning "Nenhum processo na porta 3000"
            fix "Verificando configuração do serviço..."
            if [ -f "/etc/systemd/system/codeseek.service" ]; then
                systemctl daemon-reload
                systemctl restart codeseek.service
                sleep 5
                if netstat -tuln | grep -q ":3000 "; then
                    log "Serviço reiniciado e porta 3000 ativa"
                    ((ISSUES_FIXED++))
                fi
            fi
        fi
    fi
else
    log "Aplicação está escutando na porta 3000"
fi

# Teste de resposta HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [[ ! "$HTTP_CODE" =~ ^(200|302|404)$ ]]; then
    error "Aplicação não está respondendo corretamente (HTTP $HTTP_CODE)"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Tentando reiniciar aplicação..."
        systemctl restart codeseek.service
        sleep 10
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
        if [[ "$HTTP_CODE" =~ ^(200|302|404)$ ]]; then
            log "Aplicação agora está respondendo (HTTP $HTTP_CODE)"
            ((ISSUES_FIXED++))
        else
            error "Aplicação ainda não está respondendo após reinicialização"
        fi
    fi
else
    log "Aplicação está respondendo (HTTP $HTTP_CODE)"
fi

# ==============================================================================
# 3. DIAGNÓSTICO DE BANCO DE DADOS
# ==============================================================================

info "Diagnosticando banco de dados..."

# Conectividade PostgreSQL
if ! sudo -u postgres psql -c "SELECT 1" &>/dev/null; then
    error "Não é possível conectar ao PostgreSQL"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Tentando reiniciar PostgreSQL..."
        systemctl restart postgresql
        sleep 5
        if sudo -u postgres psql -c "SELECT 1" &>/dev/null; then
            log "Conexão com PostgreSQL restaurada"
            ((ISSUES_FIXED++))
        else
            error "Ainda não é possível conectar ao PostgreSQL"
            warning "Verifique os logs: sudo journalctl -u postgresql"
        fi
    fi
else
    log "Conexão com PostgreSQL OK"
fi

# Verificar banco de dados da aplicação
if [ -f "$APP_DIR/backend/.env" ]; then
    DB_NAME=$(grep DB_NAME "$APP_DIR/backend/.env" | cut -d '=' -f2)
    DB_USER=$(grep DB_USER "$APP_DIR/backend/.env" | cut -d '=' -f2)
    
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        error "Banco de dados '$DB_NAME' não existe"
        ((ISSUES_FOUND++))
        
        if $FIX_MODE; then
            fix "Tentando recriar banco de dados..."
            DB_PASSWORD=$(grep DB_PASSWORD "$APP_DIR/backend/.env" | cut -d '=' -f2)
            
            # Criar usuário se não existir
            if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
                sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
            fi
            
            # Criar banco
            if sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"; then
                sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
                log "Banco de dados '$DB_NAME' criado"
                
                # Executar setup do banco
                cd "$APP_DIR/backend"
                if sudo -u $APP_USER NODE_ENV=production node setup-database.js; then
                    log "Schema do banco de dados configurado"
                    ((ISSUES_FIXED++))
                else
                    error "Falha ao configurar schema do banco"
                fi
            fi
        fi
    else
        log "Banco de dados '$DB_NAME' existe"
    fi
fi

# ==============================================================================
# 4. DIAGNÓSTICO DE ARQUIVOS E PERMISSÕES
# ==============================================================================

info "Diagnosticando arquivos e permissões..."

# Verificar propriedade dos arquivos
if [ -d "$APP_DIR" ]; then
    if [ "$(stat -c '%U' $APP_DIR)" != "$APP_USER" ]; then
        error "Propriedade incorreta do diretório $APP_DIR"
        ((ISSUES_FOUND++))
        
        if $FIX_MODE; then
            fix "Corrigindo propriedade dos arquivos..."
            chown -R $APP_USER:$APP_USER $APP_DIR
            log "Propriedade dos arquivos corrigida"
            ((ISSUES_FIXED++))
        fi
    else
        log "Propriedade dos arquivos está correta"
    fi
fi

# Verificar arquivo .env
if [ ! -f "$APP_DIR/backend/.env" ]; then
    error "Arquivo .env não encontrado"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        if [ -f "$APP_DIR/backend/.env.example" ]; then
            fix "Criando arquivo .env a partir do exemplo..."
            cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
            chown $APP_USER:$APP_USER "$APP_DIR/backend/.env"
            chmod 600 "$APP_DIR/backend/.env"
            warning "Arquivo .env criado, mas precisa ser configurado manualmente"
            ((ISSUES_FIXED++))
        fi
    fi
else
    log "Arquivo .env encontrado"
fi

# Verificar dependências do Node.js
if [ ! -d "$APP_DIR/backend/node_modules" ]; then
    error "Dependências do Node.js não instaladas"
    ((ISSUES_FOUND++))
    
    if $FIX_MODE; then
        fix "Instalando dependências do Node.js..."
        cd "$APP_DIR/backend"
        if sudo -u $APP_USER npm install --production; then
            log "Dependências instaladas com sucesso"
            ((ISSUES_FIXED++))
        else
            error "Falha ao instalar dependências"
        fi
    fi
else
    log "Dependências do Node.js instaladas"
fi

# ==============================================================================
# 5. DIAGNÓSTICO DE LOGS
# ==============================================================================

info "Analisando logs recentes..."

# Logs do CodeSeek
echo -e "\n${YELLOW}--- Últimos logs do CodeSeek ---${NC}"
journalctl -u codeseek.service --no-pager -n 10

# Logs do Nginx (se houver erros)
if [ -f "/var/log/nginx/error.log" ]; then
    NGINX_ERRORS=$(tail -n 20 /var/log/nginx/error.log | grep -i error | wc -l)
    if [ "$NGINX_ERRORS" -gt 0 ]; then
        echo -e "\n${YELLOW}--- Últimos erros do Nginx ---${NC}"
        tail -n 20 /var/log/nginx/error.log | grep -i error
    fi
fi

# ==============================================================================
# 6. TESTES DE DIAGNÓSTICO DA APLICAÇÃO
# ==============================================================================

info "Executando diagnóstico da aplicação..."

if [ -f "$APP_DIR/backend/diagnose.js" ]; then
    cd "$APP_DIR/backend"
    echo -e "\n${YELLOW}--- Diagnóstico da Aplicação ---${NC}"
    sudo -u $APP_USER node diagnose.js
else
    warning "Script de diagnóstico não encontrado"
fi

# ==============================================================================
# 7. RELATÓRIO FINAL
# ==============================================================================

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}  Relatório de Troubleshooting  ${NC}"
echo -e "${BLUE}=========================================${NC}\n"

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✓ Nenhum problema encontrado!${NC}"
    echo -e "\nSe você ainda está enfrentando problemas, verifique:"
    echo -e "- Logs detalhados: ${BLUE}sudo journalctl -u codeseek.service -f${NC}"
    echo -e "- Configuração do Nginx: ${BLUE}sudo nginx -t${NC}"
    echo -e "- Conectividade de rede e DNS"
elif $FIX_MODE; then
    echo -e "${YELLOW}Problemas encontrados: $ISSUES_FOUND${NC}"
    echo -e "${GREEN}Problemas corrigidos: $ISSUES_FIXED${NC}"
    
    if [ "$ISSUES_FIXED" -eq "$ISSUES_FOUND" ]; then
        echo -e "\n${GREEN}✓ Todos os problemas foram corrigidos!${NC}"
        echo -e "\nExecute a verificação pós-instalação para confirmar:"
        echo -e "${BLUE}sudo bash post-install-check.sh${NC}"
    else
        echo -e "\n${YELLOW}⚠ Alguns problemas não puderam ser corrigidos automaticamente${NC}"
        echo -e "\nProblemas restantes requerem intervenção manual."
    fi
else
    echo -e "${YELLOW}$ISSUES_FOUND problema(s) encontrado(s)${NC}"
    echo -e "\nPara tentar corrigir automaticamente, execute:"
    echo -e "${BLUE}sudo bash troubleshoot.sh --fix${NC}"
fi

echo -e "\n${YELLOW}Comandos úteis para diagnóstico manual:${NC}"
echo -e "Status dos serviços:      ${BLUE}sudo systemctl status codeseek nginx postgresql redis-server${NC}"
echo -e "Logs do CodeSeek:         ${BLUE}sudo journalctl -u codeseek.service -f${NC}"
echo -e "Logs do Nginx:            ${BLUE}sudo tail -f /var/log/nginx/error.log${NC}"
echo -e "Testar configuração:      ${BLUE}sudo nginx -t${NC}"
echo -e "Reiniciar todos serviços: ${BLUE}sudo systemctl restart codeseek nginx postgresql redis-server${NC}"
echo -e "Verificação completa:     ${BLUE}sudo bash post-install-check.sh${NC}"

echo -e "\n${BLUE}=========================================${NC}\n"