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
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

step() {
    echo -e "\n${CYAN}[STEP]${NC} $1"
}

# --- Variáveis ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS=(
    "install.sh"
    "install-auto.sh"
    "one-line-install.sh"
    "pre-install-check.sh"
    "post-install-check.sh"
    "troubleshoot.sh"
    "setup-scripts.sh"
)

echo -e "${MAGENTA}"
echo "==============================================="
echo "    CodeSeek V1 - Setup de Scripts"
echo "==============================================="
echo -e "${NC}\n"

info "Diretório: $SCRIPT_DIR"
info "Scripts a configurar: ${#SCRIPTS[@]}"

# ==============================================================================
# 1. VERIFICAR EXISTÊNCIA DOS SCRIPTS
# ==============================================================================

step "Verificando existência dos scripts"

MISSING_SCRIPTS=()
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        log "$script encontrado"
    else
        error "$script não encontrado"
        MISSING_SCRIPTS+=("$script")
    fi
done

if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
    error "Scripts faltando: ${MISSING_SCRIPTS[*]}"
    warning "Certifique-se de que todos os scripts estão no diretório correto"
    exit 1
fi

# ==============================================================================
# 2. TORNAR SCRIPTS EXECUTÁVEIS
# ==============================================================================

step "Tornando scripts executáveis"

for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        chmod +x "$SCRIPT_DIR/$script"
        log "$script agora é executável"
    fi
done

# ==============================================================================
# 3. VERIFICAR SINTAXE DOS SCRIPTS
# ==============================================================================

step "Verificando sintaxe dos scripts"

SYNTAX_ERRORS=()
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        if bash -n "$SCRIPT_DIR/$script" 2>/dev/null; then
            log "$script - sintaxe OK"
        else
            error "$script - erro de sintaxe"
            SYNTAX_ERRORS+=("$script")
        fi
    fi
done

if [ ${#SYNTAX_ERRORS[@]} -gt 0 ]; then
    error "Scripts com erro de sintaxe: ${SYNTAX_ERRORS[*]}"
    warning "Corrija os erros antes de prosseguir"
    exit 1
fi

# ==============================================================================
# 4. CRIAR LINKS SIMBÓLICOS (OPCIONAL)
# ==============================================================================

step "Criando links simbólicos (opcional)"

if [ "$EUID" -eq 0 ]; then
    # Se rodando como root, criar links em /usr/local/bin
    BIN_DIR="/usr/local/bin"
    
    for script in "${SCRIPTS[@]}"; do
        script_name="codeseek-${script%.*}"  # Remove .sh e adiciona prefixo
        
        if [ -f "$SCRIPT_DIR/$script" ]; then
            ln -sf "$SCRIPT_DIR/$script" "$BIN_DIR/$script_name"
            log "Link criado: $BIN_DIR/$script_name -> $SCRIPT_DIR/$script"
        fi
    done
    
    info "Scripts agora podem ser executados de qualquer lugar:"
    echo -e "   ${BLUE}codeseek-install${NC} - Script de instalação original"
    echo -e "   ${BLUE}codeseek-install-auto${NC} - Instalação automática"
    echo -e "   ${BLUE}codeseek-one-line-install${NC} - Instalação em uma linha"
    echo -e "   ${BLUE}codeseek-pre-install-check${NC} - Verificação pré-instalação"
    echo -e "   ${BLUE}codeseek-post-install-check${NC} - Verificação pós-instalação"
    echo -e "   ${BLUE}codeseek-troubleshoot${NC} - Diagnóstico e correção"
else
    info "Execute como root para criar links simbólicos globais"
fi

# ==============================================================================
# 5. CRIAR ARQUIVO DE CONFIGURAÇÃO
# ==============================================================================

step "Criando arquivo de configuração"

cat > "$SCRIPT_DIR/scripts.conf" << EOF
# Configuração dos Scripts do CodeSeek V1
# ========================================

# Diretório dos scripts
SCRIPT_DIR="$SCRIPT_DIR"

# Scripts disponíveis
INSTALL_SCRIPT="$SCRIPT_DIR/install.sh"
INSTALL_AUTO_SCRIPT="$SCRIPT_DIR/install-auto.sh"
ONE_LINE_INSTALL_SCRIPT="$SCRIPT_DIR/one-line-install.sh"
PRE_CHECK_SCRIPT="$SCRIPT_DIR/pre-install-check.sh"
POST_CHECK_SCRIPT="$SCRIPT_DIR/post-install-check.sh"
TROUBLESHOOT_SCRIPT="$SCRIPT_DIR/troubleshoot.sh"

# Configurações padrão
DEFAULT_APP_DIR="/opt/codeseek"
DEFAULT_APP_USER="codeseek"
DEFAULT_DB_NAME="codeseek_db"
DEFAULT_DB_USER="codeseek_user"

# Logs
LOG_DIR="/var/log/codeseek"
INSTALL_LOG="$LOG_DIR/install.log"

# Data de configuração
SETUP_DATE="$(date)"
EOF

log "Arquivo de configuração criado: $SCRIPT_DIR/scripts.conf"

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
echo -e "   Repositório: https://github.com/seu-usuario/codeseek"
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

# Verificar se todos os scripts são executáveis
NON_EXECUTABLE=()
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ] && [ ! -x "$SCRIPT_DIR/$script" ]; then
        NON_EXECUTABLE+=("$script")
    fi
done

if [ ${#NON_EXECUTABLE[@]} -gt 0 ]; then
    error "Scripts não executáveis: ${NON_EXECUTABLE[*]}"
else
    log "Todos os scripts são executáveis"
fi

# Verificar espaço em disco
DISK_USAGE=$(df "$SCRIPT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    warning "Pouco espaço em disco: ${DISK_USAGE}% usado"
else
    log "Espaço em disco OK: ${DISK_USAGE}% usado"
fi

# ==============================================================================
# 9. RELATÓRIO FINAL
# ==============================================================================

echo -e "\n${MAGENTA}"
echo "==============================================="
echo "    Setup Concluído com Sucesso!"
echo "==============================================="
echo -e "${NC}\n"

echo -e "${GREEN}✓ Todos os scripts foram configurados e estão prontos para uso!${NC}\n"

echo -e "${CYAN}📋 Scripts Configurados:${NC}"
for script in "${SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        echo -e "   ✅ ${BLUE}$script${NC}"
    fi
done

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

echo -e "\n${GREEN}🎉 Setup concluído! Seus scripts estão prontos para instalar o CodeSeek V1.${NC}\n"

# Salvar log do setup
echo "Setup dos scripts concluído em $(date)" > "$SCRIPT_DIR/setup.log"
echo "Scripts configurados: ${SCRIPTS[*]}" >> "$SCRIPT_DIR/setup.log"
echo "Diretório: $SCRIPT_DIR" >> "$SCRIPT_DIR/setup.log"