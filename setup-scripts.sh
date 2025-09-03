#!/bin/bash

# ==============================================================================
# Script para preparar e configurar todos os scripts de instalação
# ==============================================================================
#
# Este script prepara todos os scripts de instalação do CodeSeek V1,
# tornando-os executáveis e verificando sua integridade.
#
# Uso: bash setup-scripts.sh
#
# ==============================================================================

# --- Cores para output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Funções de Logging ---
log() {
    local message="$1"
    echo -e "${GREEN}[✓]${NC} $message"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $message" >> "$LOG_FILE"
}

error() {
    local message="$1"
    echo -e "${RED}[✗]${NC} $message" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $message" >> "$LOG_FILE"
}

warning() {
    local message="$1"
    echo -e "${YELLOW}[!]${NC} $message"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $message" >> "$LOG_FILE"
}

info() {
    local message="$1"
    echo -e "${BLUE}[i]${NC} $message"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $message" >> "$LOG_FILE"
}

step() {
    local message="$1"
    echo -e "\n${CYAN}[STEP]${NC} $message"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [STEP] $message" >> "$LOG_FILE"
}

# --- Funções Utilitárias ---
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_permissions() {
    if [ ! -w "$SCRIPT_DIR" ]; then
        error "Sem permissão de escrita no diretório: $SCRIPT_DIR"
        return 1
    fi
    return 0
}

# --- Variáveis ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/setup.log"

# Scripts principais do CodeSeek
SCRIPTS=(
    "install.sh"
    "install-auto.sh"
    "one-line-install.sh"
    "pre-install-check.sh"
    "post-install-check.sh"
    "troubleshoot.sh"
    "setup-scripts.sh"
)

# Scripts opcionais (podem não existir)
OPTIONAL_SCRIPTS=(
    "deploy.sh"
    "backup-database.sh"
    "monitor.sh"
    "prepare-release.sh"
)

# --- Função de Inicialização ---
initialize_setup() {
    # Criar arquivo de log se não existir
    touch "$LOG_FILE" 2>/dev/null || {
        error "Não foi possível criar arquivo de log: $LOG_FILE"
        exit 1
    }
    
    # Verificar permissões
    check_permissions || exit 1
    
    # Log de início
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [START] Setup iniciado" >> "$LOG_FILE"
}

# Função para exibir cabeçalho
show_header() {
    echo -e "${MAGENTA}"
    echo "==============================================="
    echo "    CodeSeek V1 - Setup de Scripts"
    echo "==============================================="
    echo -e "${NC}\n"
}

# ==============================================================================
# 1. VERIFICAR EXISTÊNCIA DOS SCRIPTS
# ==============================================================================

step "Verificando existência dos scripts"

# Verificar scripts principais (obrigatórios)
MISSING_SCRIPTS=()
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        log "$script encontrado"
    else
        error "$script não encontrado (obrigatório)"
        MISSING_SCRIPTS+=("$script")
    fi
done

# Verificar scripts opcionais
OPTIONAL_FOUND=()
OPTIONAL_MISSING=()
for script in "${OPTIONAL_SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        info "$script encontrado (opcional)"
        OPTIONAL_FOUND+=("$script")
    else
        warning "$script não encontrado (opcional)"
        OPTIONAL_MISSING+=("$script")
    fi
done

if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
    error "Scripts obrigatórios faltando: ${MISSING_SCRIPTS[*]}"
    warning "Certifique-se de que todos os scripts estão no diretório correto"
    exit 1
fi

if [ ${#OPTIONAL_FOUND[@]} -gt 0 ]; then
    info "Scripts opcionais encontrados: ${OPTIONAL_FOUND[*]}"
fi

# ==============================================================================
# 2. TORNAR SCRIPTS EXECUTÁVEIS
# ==============================================================================

step "Tornando scripts executáveis"

# Tornar scripts principais executáveis
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        chmod +x "$SCRIPT_DIR/$script"
        log "$script agora é executável"
    fi
done

# Tornar scripts opcionais executáveis
for script in "${OPTIONAL_FOUND[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        chmod +x "$SCRIPT_DIR/$script"
        log "$script (opcional) agora é executável"
    fi
done

# ==============================================================================
# 3. VERIFICAR SINTAXE DOS SCRIPTS
# ==============================================================================

step "Verificando sintaxe dos scripts"

# Função para verificar sintaxe
check_script_syntax() {
    local script="$1"
    local script_type="$2"
    
    if [ -f "$SCRIPT_DIR/$script" ]; then
        local syntax_output
        if syntax_output=$(bash -n "$SCRIPT_DIR/$script" 2>&1); then
            log "$script ($script_type) - sintaxe OK"
            return 0
        else
            error "$script ($script_type) - erro de sintaxe:"
            echo "$syntax_output" | while IFS= read -r line; do
                error "  $line"
            done
            return 1
        fi
    fi
    return 0
}

SYNTAX_ERRORS=()

# Verificar scripts principais
for script in "${SCRIPTS[@]}"; do
    if ! check_script_syntax "$script" "principal"; then
        SYNTAX_ERRORS+=("$script")
    fi
done

# Verificar scripts opcionais
for script in "${OPTIONAL_FOUND[@]}"; do
    if ! check_script_syntax "$script" "opcional"; then
        SYNTAX_ERRORS+=("$script")
    fi
done

if [ ${#SYNTAX_ERRORS[@]} -gt 0 ]; then
    error "Scripts com erro de sintaxe: ${SYNTAX_ERRORS[*]}"
    warning "Corrija os erros antes de prosseguir"
    warning "Verifique o log para detalhes: $LOG_FILE"
    exit 1
fi

# ==============================================================================
# 4. CRIAR LINKS SIMBÓLICOS (OPCIONAL)
# ==============================================================================

step "Criando links simbólicos (opcional)"

# Função para criar link simbólico
create_symlink() {
    local script="$1"
    local script_type="$2"
    local script_name="codeseek-${script%.*}"  # Remove .sh e adiciona prefixo
    
    if [ -f "$SCRIPT_DIR/$script" ]; then
        if ln -sf "$SCRIPT_DIR/$script" "$BIN_DIR/$script_name" 2>/dev/null; then
            log "Link criado ($script_type): $BIN_DIR/$script_name -> $SCRIPT_DIR/$script"
            return 0
        else
            warning "Falha ao criar link para $script ($script_type)"
            return 1
        fi
    fi
    return 0
}

if [ "$EUID" -eq 0 ]; then
    # Se rodando como root, criar links em /usr/local/bin
    BIN_DIR="/usr/local/bin"
    
    # Verificar se o diretório existe e é gravável
    if [ ! -d "$BIN_DIR" ]; then
        warning "Diretório $BIN_DIR não existe"
    elif [ ! -w "$BIN_DIR" ]; then
        warning "Sem permissão de escrita em $BIN_DIR"
    else
        # Criar links para scripts principais
        for script in "${SCRIPTS[@]}"; do
            create_symlink "$script" "principal"
        done
        
        # Criar links para scripts opcionais
        for script in "${OPTIONAL_FOUND[@]}"; do
            create_symlink "$script" "opcional"
        done
        
        info "Scripts agora podem ser executados de qualquer lugar:"
        echo -e "   ${BLUE}codeseek-install${NC} - Script de instalação original"
        echo -e "   ${BLUE}codeseek-install-auto${NC} - Instalação automática"
        echo -e "   ${BLUE}codeseek-one-line-install${NC} - Instalação em uma linha"
        echo -e "   ${BLUE}codeseek-pre-install-check${NC} - Verificação pré-instalação"
        echo -e "   ${BLUE}codeseek-post-install-check${NC} - Verificação pós-instalação"
        echo -e "   ${BLUE}codeseek-troubleshoot${NC} - Diagnóstico e correção"
        
        if [ ${#OPTIONAL_FOUND[@]} -gt 0 ]; then
            echo -e "   ${CYAN}Scripts opcionais também disponíveis${NC}"
        fi
    fi
else
    info "Execute como root para criar links simbólicos globais"
    info "Ou adicione $SCRIPT_DIR ao seu PATH"
fi

# ==============================================================================
# 5. CRIAR ARQUIVO DE CONFIGURAÇÃO
# ==============================================================================

step "Criando arquivo de configuração"

# Criar arquivo de configuração dinâmico
cat > "$SCRIPT_DIR/scripts.conf" << EOF
# Configuração dos Scripts do CodeSeek V1
# ========================================
# Gerado automaticamente em $(date)

# Diretório dos scripts
SCRIPT_DIR="$SCRIPT_DIR"
LOG_FILE="$LOG_FILE"

# Scripts principais disponíveis
INSTALL_SCRIPT="$SCRIPT_DIR/install.sh"
INSTALL_AUTO_SCRIPT="$SCRIPT_DIR/install-auto.sh"
ONE_LINE_INSTALL_SCRIPT="$SCRIPT_DIR/one-line-install.sh"
PRE_CHECK_SCRIPT="$SCRIPT_DIR/pre-install-check.sh"
POST_CHECK_SCRIPT="$SCRIPT_DIR/post-install-check.sh"
TROUBLESHOOT_SCRIPT="$SCRIPT_DIR/troubleshoot.sh"
SETUP_SCRIPT="$SCRIPT_DIR/setup-scripts.sh"

EOF

# Adicionar scripts opcionais encontrados
if [ ${#OPTIONAL_FOUND[@]} -gt 0 ]; then
    cat >> "$SCRIPT_DIR/scripts.conf" << EOF
# Scripts opcionais disponíveis
EOF
    for script in "${OPTIONAL_FOUND[@]}"; do
        script_var="$(echo "${script%.*}" | tr '[:lower:]-' '[:upper:]_')_SCRIPT"
        echo "$script_var=\"$SCRIPT_DIR/$script\"" >> "$SCRIPT_DIR/scripts.conf"
    done
    echo "" >> "$SCRIPT_DIR/scripts.conf"
fi

# Adicionar configurações padrão
cat >> "$SCRIPT_DIR/scripts.conf" << EOF
# Configurações padrão da aplicação
DEFAULT_APP_DIR="/opt/codeseek"
DEFAULT_APP_USER="codeseek"
DEFAULT_DB_NAME="codeseek_db"
DEFAULT_DB_USER="codeseek_user"
DEFAULT_REDIS_PORT="6379"
DEFAULT_APP_PORT="3000"

# Diretórios de log
LOG_DIR="/var/log/codeseek"
INSTALL_LOG="\$LOG_DIR/install.log"
APP_LOG="\$LOG_DIR/app.log"
NGINX_LOG="\$LOG_DIR/nginx.log"

# Informações do setup
SETUP_DATE="$(date)"
SETUP_VERSION="1.0.0"
SCRIPTS_CONFIGURED="${#SCRIPTS[@]}"
OPTIONAL_SCRIPTS_FOUND="${#OPTIONAL_FOUND[@]}"
EOF

log "Arquivo de configuração criado: $SCRIPT_DIR/scripts.conf"
info "Configuração inclui ${#SCRIPTS[@]} scripts principais e ${#OPTIONAL_FOUND[@]} opcionais"

# ==============================================================================
# 6. CRIAR SCRIPT DE AJUDA
# ==============================================================================

step "Criando script de ajuda"

cat > "$SCRIPT_DIR/help.sh" << 'EOF'
#!/bin/bash

# Script de ajuda do CodeSeek V1

echo -e "\033[0;36m"
echo "==============================================="
echo "    CodeSeek V1 - Scripts Disponíveis"
echo "==============================================="
echo -e "\033[0m\n"

echo -e "\033[0;32m📦 Scripts de Instalação:\033[0m"
echo -e "   \033[0;34minstall.sh\033[0m                 - Instalação interativa original"
echo -e "   \033[0;34minstall-auto.sh\033[0m            - Instalação automática com parâmetros"
echo -e "   \033[0;34mone-line-install.sh\033[0m        - Instalação em uma linha (recomendado)"
echo

echo -e "\033[0;32m🔍 Scripts de Verificação:\033[0m"
echo -e "   \033[0;34mpre-install-check.sh\033[0m       - Verificação antes da instalação"
echo -e "   \033[0;34mpost-install-check.sh\033[0m      - Verificação após a instalação"
echo

echo -e "\033[0;32m🛠️ Scripts de Manutenção:\033[0m"
echo -e "   \033[0;34mtroubleshoot.sh\033[0m            - Diagnóstico e correção de problemas"
echo -e "   \033[0;34msetup-scripts.sh\033[0m           - Configuração dos scripts"
echo -e "   \033[0;34mhelp.sh\033[0m                   - Este arquivo de ajuda"
echo

echo -e "\033[0;33m💡 Exemplos de Uso:\033[0m"
echo -e "   # Instalação rápida:"
echo -e "   \033[0;36msudo bash one-line-install.sh meudominio.com admin@meudominio.com\033[0m"
echo
echo -e "   # Verificação pré-instalação:"
echo -e "   \033[0;36msudo bash pre-install-check.sh\033[0m"
echo
echo -e "   # Diagnóstico com correção:"
echo -e "   \033[0;36msudo bash troubleshoot.sh --fix\033[0m"
echo
echo -e "   # Verificação pós-instalação:"
echo -e "   \033[0;36msudo bash post-install-check.sh\033[0m"
echo

echo -e "\033[0;33m📚 Documentação:\033[0m"
echo -e "   \033[0;34mINSTALLATION.md\033[0m            - Guia completo de instalação"
echo -e "   \033[0;34mREADME.md\033[0m                 - Documentação do projeto"
echo

echo -e "\033[0;33m🔗 Links Úteis:\033[0m"
echo -e "   Repositório: https://github.com/WesleyMarinho/codeseek"
echo -e "   Documentação: https://docs.codeseek.com"
echo -e "   Suporte: https://support.codeseek.com"
echo
EOF

chmod +x "$SCRIPT_DIR/help.sh"
log "Script de ajuda criado: $SCRIPT_DIR/help.sh"

# ==============================================================================
# 7. CRIAR MAKEFILE (OPCIONAL)
# ==============================================================================

step "Criando Makefile"

cat > "$SCRIPT_DIR/Makefile" << 'EOF'
# Makefile para CodeSeek V1

.PHONY: help install check clean setup

# Variáveis
DOMAIN ?= localhost
EMAIL ?= admin@localhost
DB_NAME ?= codeseek_db
DB_USER ?= codeseek_user

help:
	@echo "CodeSeek V1 - Comandos Disponíveis:"
	@echo ""
	@echo "  make install DOMAIN=meudominio.com EMAIL=admin@meudominio.com"
	@echo "    Instala o CodeSeek com os parâmetros especificados"
	@echo ""
	@echo "  make check"
	@echo "    Executa verificação pré-instalação"
	@echo ""
	@echo "  make verify"
	@echo "    Executa verificação pós-instalação"
	@echo ""
	@echo "  make troubleshoot"
	@echo "    Executa diagnóstico e correção"
	@echo ""
	@echo "  make setup"
	@echo "    Configura os scripts"
	@echo ""
	@echo "  make clean"
	@echo "    Remove arquivos temporários"

install:
	@echo "Instalando CodeSeek V1..."
	@sudo bash one-line-install.sh $(DOMAIN) $(EMAIL) $(DB_NAME) $(DB_USER)

check:
	@echo "Executando verificação pré-instalação..."
	@sudo bash pre-install-check.sh

verify:
	@echo "Executando verificação pós-instalação..."
	@sudo bash post-install-check.sh

troubleshoot:
	@echo "Executando diagnóstico..."
	@sudo bash troubleshoot.sh --fix

setup:
	@echo "Configurando scripts..."
	@bash setup-scripts.sh

clean:
	@echo "Limpando arquivos temporários..."
	@rm -f *.log
	@rm -f /tmp/codeseek-*
EOF

log "Makefile criado: $SCRIPT_DIR/Makefile"

# ==============================================================================
# 8. VERIFICAÇÃO FINAL
# ==============================================================================

step "Verificação final"

# Função para verificar se script é executável
check_executable() {
    local script="$1"
    local script_type="$2"
    
    if [ -f "$SCRIPT_DIR/$script" ]; then
        if [ -x "$SCRIPT_DIR/$script" ]; then
            log "$script ($script_type) é executável"
            return 0
        else
            error "$script ($script_type) não é executável"
            return 1
        fi
    fi
    return 0
}

# Verificar se todos os scripts são executáveis
NON_EXECUTABLE=()

# Verificar scripts principais
for script in "${SCRIPTS[@]}"; do
    if ! check_executable "$script" "principal"; then
        NON_EXECUTABLE+=("$script")
    fi
done

# Verificar scripts opcionais
for script in "${OPTIONAL_FOUND[@]}"; do
    if ! check_executable "$script" "opcional"; then
        NON_EXECUTABLE+=("$script")
    fi
done

if [ ${#NON_EXECUTABLE[@]} -gt 0 ]; then
    error "Scripts não executáveis: ${NON_EXECUTABLE[*]}"
    warning "Execute: chmod +x ${NON_EXECUTABLE[*]}"
else
    log "Todos os scripts configurados são executáveis"
fi

# Verificar espaço em disco
if command_exists df; then
    DISK_USAGE=$(df "$SCRIPT_DIR" 2>/dev/null | awk 'NR==2 {print $5}' | sed 's/%//' 2>/dev/null || echo "0")
    if [ "$DISK_USAGE" -gt 90 ] 2>/dev/null; then
        warning "Pouco espaço em disco: ${DISK_USAGE}% usado"
    elif [ "$DISK_USAGE" -gt 0 ] 2>/dev/null; then
        log "Espaço em disco OK: ${DISK_USAGE}% usado"
    else
        info "Não foi possível verificar espaço em disco"
    fi
else
    info "Comando 'df' não disponível - pulando verificação de espaço"
fi

# Verificar se arquivos de configuração foram criados
CONFIG_FILES=("scripts.conf" "help.sh" "Makefile")
for config_file in "${CONFIG_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$config_file" ]; then
        log "Arquivo de configuração criado: $config_file"
    else
        warning "Arquivo de configuração não encontrado: $config_file"
    fi
done

# ==============================================================================
# 9. RELATÓRIO FINAL
# ==============================================================================

echo -e "\n${MAGENTA}"
echo "==============================================="
echo "    Setup Concluído com Sucesso!"
echo "==============================================="
echo -e "${NC}\n"

echo -e "${GREEN}✓ Todos os scripts foram configurados e estão prontos para uso!${NC}\n"

echo -e "${CYAN}📋 Scripts Principais Configurados:${NC}"
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        echo -e "   ✅ ${BLUE}$script${NC}"
    else
        echo -e "   ❌ ${RED}$script${NC} (não encontrado)"
    fi
done

if [ ${#OPTIONAL_FOUND[@]} -gt 0 ]; then
    echo -e "\n${CYAN}📋 Scripts Opcionais Encontrados:${NC}"
    for script in "${OPTIONAL_FOUND[@]}"; do
        echo -e "   ✅ ${BLUE}$script${NC}"
    done
fi

if [ ${#OPTIONAL_MISSING[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}📋 Scripts Opcionais Não Encontrados:${NC}"
    for script in "${OPTIONAL_MISSING[@]}"; do
        echo -e "   ⚠️  ${YELLOW}$script${NC}"
    done
fi

echo -e "\n${CYAN}🚀 Próximos Passos:${NC}"
echo -e "   1. Execute a verificação pré-instalação:"
echo -e "      ${BLUE}sudo bash pre-install-check.sh${NC}"
echo -e "\n   2. Execute a instalação automática:"
echo -e "      ${BLUE}sudo bash one-line-install.sh seudominio.com admin@seudominio.com${NC}"
echo -e "\n   3. Execute a verificação pós-instalação:"
echo -e "      ${BLUE}sudo bash post-install-check.sh${NC}"
echo -e "\n   4. Se houver problemas, execute o troubleshooting:"
echo -e "      ${BLUE}sudo bash troubleshoot.sh --fix${NC}"

echo -e "\n${CYAN}📚 Documentação:${NC}"
echo -e "   📖 Guia completo: ${BLUE}INSTALLATION.md${NC}"
echo -e "   ❓ Ajuda: ${BLUE}bash help.sh${NC}"
echo -e "   🔧 Makefile: ${BLUE}make help${NC}"

echo -e "\n${CYAN}📁 Arquivos Criados:${NC}"
echo -e "   ⚙️  Configuração: ${BLUE}scripts.conf${NC}"
echo -e "   ❓ Ajuda: ${BLUE}help.sh${NC}"
echo -e "   🔧 Makefile: ${BLUE}Makefile${NC}"

echo -e "\n${CYAN}📊 Estatísticas do Setup:${NC}"
echo -e "   📁 Diretório: ${BLUE}$SCRIPT_DIR${NC}"
echo -e "   📜 Scripts principais: ${BLUE}${#SCRIPTS[@]}${NC}"
echo -e "   📜 Scripts opcionais encontrados: ${BLUE}${#OPTIONAL_FOUND[@]}${NC}"
echo -e "   📜 Scripts opcionais ausentes: ${YELLOW}${#OPTIONAL_MISSING[@]}${NC}"
echo -e "   📝 Log: ${BLUE}$LOG_FILE${NC}"

echo -e "\n${GREEN}🎉 Setup concluído! Seus scripts estão prontos para instalar o CodeSeek V1.${NC}\n"

# Finalizar log do setup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] Setup concluído com sucesso" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Scripts principais configurados: ${SCRIPTS[*]}" >> "$LOG_FILE"
if [ ${#OPTIONAL_FOUND[@]} -gt 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Scripts opcionais encontrados: ${OPTIONAL_FOUND[*]}" >> "$LOG_FILE"
fi
if [ ${#OPTIONAL_MISSING[@]} -gt 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] Scripts opcionais ausentes: ${OPTIONAL_MISSING[*]}" >> "$LOG_FILE"
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Diretório: $SCRIPT_DIR" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [END] Setup finalizado" >> "$LOG_FILE"

# ==============================================================================
# FUNÇÃO PRINCIPAL
# ==============================================================================

main() {
    # Trap para capturar erros
    trap 'echo "[$(date "+%Y-%m-%d %H:%M:%S")] [ERROR] Script interrompido na linha $LINENO" >> "$LOG_FILE"; exit 1' ERR
    
    # Exibir cabeçalho
    show_header
    
    # Inicializar setup
    initialize_setup
    
    info "Diretório: $SCRIPT_DIR"
    info "Scripts principais: ${#SCRIPTS[@]}"
    info "Scripts opcionais: ${#OPTIONAL_SCRIPTS[@]}"
    info "Log: $LOG_FILE"
    
    # Executar todas as etapas do setup
    # (As etapas estão definidas no corpo do script acima)
    
    log "Setup-scripts.sh executado com sucesso"
}

# Executar função principal se script for chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi