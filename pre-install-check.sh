#!/bin/bash

# ==============================================================================
# Script de verificação pré-instalação do CodeSeek
# ==============================================================================
#
# Este script verifica se o ambiente está pronto para a instalação do CodeSeek
# e identifica possíveis problemas antes da instalação.
#
# Uso: sudo bash pre-install-check.sh [DOMAIN]
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
ERROR_COUNT=0
WARNING_COUNT=0

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  CodeSeek - Verificação Pré-Instalação  ${NC}"
echo -e "${BLUE}=========================================${NC}\n"

# ==============================================================================
# 1. VERIFICAÇÕES DO SISTEMA
# ==============================================================================

info "Verificando sistema operacional..."
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
        log "Sistema operacional suportado: $PRETTY_NAME"
    else
        warning "Sistema operacional não testado: $PRETTY_NAME"
        ((WARNING_COUNT++))
    fi
else
    error "Não foi possível identificar o sistema operacional"
    ((ERROR_COUNT++))
fi

info "Verificando privilégios de root..."
if [ "$(id -u)" -eq 0 ]; then
    log "Executando como root"
else
    error "Este script precisa ser executado como root (sudo)"
    ((ERROR_COUNT++))
fi

info "Verificando conectividade com a internet..."
if ping -c 1 google.com &> /dev/null; then
    log "Conectividade com a internet OK"
else
    error "Sem conectividade com a internet"
    ((ERROR_COUNT++))
fi

info "Verificando espaço em disco..."
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
REQUIRED_SPACE=2097152 # 2GB em KB
if [ "$AVAILABLE_SPACE" -gt "$REQUIRED_SPACE" ]; then
    log "Espaço em disco suficiente: $(($AVAILABLE_SPACE / 1024 / 1024))GB disponível"
else
    error "Espaço em disco insuficiente. Necessário: 2GB, Disponível: $(($AVAILABLE_SPACE / 1024 / 1024))GB"
    ((ERROR_COUNT++))
fi

info "Verificando memória RAM..."
TOTAL_RAM=$(free -m | awk 'NR==2{print $2}')
if [ "$TOTAL_RAM" -gt 512 ]; then
    log "Memória RAM suficiente: ${TOTAL_RAM}MB"
else
    warning "Memória RAM baixa: ${TOTAL_RAM}MB (recomendado: 1GB+)"
    ((WARNING_COUNT++))
fi

# ==============================================================================
# 2. VERIFICAÇÕES DE REDE E DOMÍNIO
# ==============================================================================

if [[ -n "$DOMAIN" ]]; then
    info "Verificando resolução DNS para $DOMAIN..."
    if nslookup "$DOMAIN" &> /dev/null; then
        SERVER_IP=$(curl -s ifconfig.me)
        DOMAIN_IP=$(nslookup "$DOMAIN" | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        
        if [[ "$SERVER_IP" == "$DOMAIN_IP" ]]; then
            log "DNS configurado corretamente: $DOMAIN -> $SERVER_IP"
        else
            warning "DNS pode não estar apontando para este servidor"
            warning "Servidor: $SERVER_IP, Domínio: $DOMAIN_IP"
            ((WARNING_COUNT++))
        fi
    else
        warning "Não foi possível resolver o DNS para $DOMAIN"
        ((WARNING_COUNT++))
    fi
else
    info "Domínio não fornecido, pulando verificação DNS"
fi

info "Verificando portas necessárias..."
PORTS=("80" "443" "3000" "5432" "6379")
for port in "${PORTS[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        warning "Porta $port já está em uso"
        ((WARNING_COUNT++))
    else
        log "Porta $port disponível"
    fi
done

# ==============================================================================
# 3. VERIFICAÇÕES DE SOFTWARE
# ==============================================================================

info "Verificando gerenciador de pacotes..."
if command -v apt &> /dev/null; then
    log "APT disponível"
    
    info "Verificando se o sistema está atualizado..."
    apt list --upgradable 2>/dev/null | grep -q upgradable
    if [ $? -eq 0 ]; then
        warning "Sistema possui atualizações pendentes (recomendado: apt update && apt upgrade)"
        ((WARNING_COUNT++))
    else
        log "Sistema está atualizado"
    fi
else
    error "APT não encontrado (sistema não suportado)"
    ((ERROR_COUNT++))
fi

info "Verificando Git..."
if command -v git &> /dev/null; then
    log "Git já instalado: $(git --version)"
else
    info "Git será instalado durante a instalação"
fi

info "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 16 ]; then
        log "Node.js compatível já instalado: $(node -v)"
    else
        warning "Node.js versão antiga detectada: $(node -v) (será atualizado para v18)"
        ((WARNING_COUNT++))
    fi
else
    info "Node.js será instalado durante a instalação"
fi

info "Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    log "PostgreSQL já instalado: $(psql --version)"
    if systemctl is-active --quiet postgresql; then
        log "PostgreSQL está rodando"
    else
        warning "PostgreSQL instalado mas não está rodando"
        ((WARNING_COUNT++))
    fi
else
    info "PostgreSQL será instalado durante a instalação"
fi

info "Verificando Redis..."
if command -v redis-server &> /dev/null; then
    log "Redis já instalado: $(redis-server --version | head -1)"
    if systemctl is-active --quiet redis-server; then
        log "Redis está rodando"
    else
        warning "Redis instalado mas não está rodando"
        ((WARNING_COUNT++))
    fi
else
    info "Redis será instalado durante a instalação"
fi

info "Verificando Nginx..."
if command -v nginx &> /dev/null; then
    log "Nginx já instalado: $(nginx -v 2>&1)"
    if systemctl is-active --quiet nginx; then
        log "Nginx está rodando"
    else
        warning "Nginx instalado mas não está rodando"
        ((WARNING_COUNT++))
    fi
else
    info "Nginx será instalado durante a instalação"
fi

# ==============================================================================
# 4. VERIFICAÇÕES DE SEGURANÇA
# ==============================================================================

info "Verificando firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    if [[ "$UFW_STATUS" == *"active"* ]]; then
        log "UFW firewall está ativo"
        # Verificar se as portas necessárias estão abertas
        if ufw status | grep -q "80/tcp"; then
            log "Porta 80 (HTTP) está aberta no firewall"
        else
            warning "Porta 80 (HTTP) não está aberta no firewall"
            ((WARNING_COUNT++))
        fi
        if ufw status | grep -q "443/tcp"; then
            log "Porta 443 (HTTPS) está aberta no firewall"
        else
            warning "Porta 443 (HTTPS) não está aberta no firewall"
            ((WARNING_COUNT++))
        fi
    else
        warning "UFW firewall não está ativo"
        ((WARNING_COUNT++))
    fi
else
    info "UFW não instalado (firewall será configurado manualmente se necessário)"
fi

info "Verificando usuário codeseek..."
if id -u codeseek &>/dev/null; then
    warning "Usuário 'codeseek' já existe (será reutilizado)"
    ((WARNING_COUNT++))
else
    log "Usuário 'codeseek' será criado durante a instalação"
fi

info "Verificando diretório /opt/codeseek..."
if [ -d "/opt/codeseek" ]; then
    warning "Diretório /opt/codeseek já existe (conteúdo pode ser sobrescrito)"
    ((WARNING_COUNT++))
else
    log "Diretório /opt/codeseek será criado durante a instalação"
fi

# ==============================================================================
# 5. RELATÓRIO FINAL
# ==============================================================================

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}  Relatório da Verificação Pré-Instalação  ${NC}"
echo -e "${BLUE}=========================================${NC}\n"

if [ "$ERROR_COUNT" -eq 0 ] && [ "$WARNING_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ Sistema está pronto para instalação!${NC}"
    echo -e "\nPara instalar o CodeSeek, execute:"
    if [[ -n "$DOMAIN" ]]; then
        echo -e "${BLUE}sudo bash install-auto.sh $DOMAIN [SSL_EMAIL]${NC}"
    else
        echo -e "${BLUE}sudo bash install-auto.sh <DOMAIN> [SSL_EMAIL]${NC}"
    fi
elif [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Sistema pode ser instalado, mas há $WARNING_COUNT aviso(s)${NC}"
    echo -e "\nRecomenda-se revisar os avisos acima antes de prosseguir."
    echo -e "\nPara instalar mesmo assim, execute:"
    if [[ -n "$DOMAIN" ]]; then
        echo -e "${BLUE}sudo bash install-auto.sh $DOMAIN [SSL_EMAIL]${NC}"
    else
        echo -e "${BLUE}sudo bash install-auto.sh <DOMAIN> [SSL_EMAIL]${NC}"
    fi
else
    echo -e "${RED}✗ Sistema NÃO está pronto para instalação!${NC}"
    echo -e "\nEncontrados $ERROR_COUNT erro(s) e $WARNING_COUNT aviso(s)."
    echo -e "\nCorreja os erros acima antes de tentar a instalação."
    exit 1
fi

echo -e "\n${BLUE}=========================================${NC}"
echo -e "Erros: ${RED}$ERROR_COUNT${NC} | Avisos: ${YELLOW}$WARNING_COUNT${NC}"
echo -e "${BLUE}=========================================${NC}\n"