#!/bin/bash

# CodeSeek V1 - Deploy Automático Completo
# Autor: CodeSeek Team
# Versão: 1.0.0
# Descrição: Script para deploy 100% automático do CodeSeek V1

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações padrão
DEFAULT_DOMAIN="localhost"
DEFAULT_EMAIL="admin@localhost"
DEFAULT_DB_NAME="codeseek_db"
DEFAULT_DB_USER="codeseek_user"

# Variáveis globais
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/codeseek-deploy-$(date +%Y%m%d-%H%M%S).log"
START_TIME=$(date +%s)
ERROR_COUNT=0
WARNING_COUNT=0

# Função de logging
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$LOG_FILE"
            ((WARNING_COUNT++))
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
            ((ERROR_COUNT++))
            ;;
        "DEBUG")
            echo -e "${PURPLE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        *)
            echo -e "$message" | tee -a "$LOG_FILE"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Função para exibir banner
show_banner() {
    clear
    echo -e "${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                    CodeSeek V1 - Deploy                     ║
║                  Sistema de Licenciamento                   ║
║                                                              ║
║              🚀 Deploy 100% Automático 🚀                   ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo
}

# Função para verificar privilégios
check_privileges() {
    log "INFO" "Verificando privilégios de usuário..."
    
    if [[ $EUID -ne 0 ]]; then
        log "ERROR" "Este script deve ser executado como root (sudo)"
        echo
        echo -e "${YELLOW}Uso correto:${NC}"
        echo -e "  ${GREEN}sudo bash deploy.sh [domain] [email] [db_name] [db_user]${NC}"
        echo
        echo -e "${YELLOW}Exemplos:${NC}"
        echo -e "  ${CYAN}sudo bash deploy.sh${NC}                                    # Instalação local"
        echo -e "  ${CYAN}sudo bash deploy.sh meusite.com admin@meusite.com${NC}      # Com domínio"
        echo -e "  ${CYAN}sudo bash deploy.sh meusite.com admin@meusite.com db user${NC} # Personalizado"
        exit 1
    fi
    
    log "SUCCESS" "Privilégios verificados com sucesso"
}

# Função para validar parâmetros
validate_parameters() {
    log "INFO" "Validando parâmetros de entrada..."
    
    # Parâmetros
    DOMAIN="${1:-$DEFAULT_DOMAIN}"
    EMAIL="${2:-$DEFAULT_EMAIL}"
    DB_NAME="${3:-$DEFAULT_DB_NAME}"
    DB_USER="${4:-$DEFAULT_DB_USER}"
    
    # Validação de domínio
    if [[ "$DOMAIN" != "localhost" ]]; then
        if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
            log "WARNING" "Domínio '$DOMAIN' pode não ser válido"
        fi
    fi
    
    # Validação de email
    if ! [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        log "WARNING" "Email '$EMAIL' pode não ser válido"
    fi
    
    # Validação de nome do banco
    if ! [[ "$DB_NAME" =~ ^[a-zA-Z][a-zA-Z0-9_]*$ ]]; then
        log "ERROR" "Nome do banco '$DB_NAME' inválido (deve começar com letra)"
        exit 1
    fi
    
    # Validação de usuário do banco
    if ! [[ "$DB_USER" =~ ^[a-zA-Z][a-zA-Z0-9_]*$ ]]; then
        log "ERROR" "Usuário do banco '$DB_USER' inválido (deve começar com letra)"
        exit 1
    fi
    
    log "SUCCESS" "Parâmetros validados com sucesso"
    
    # Exibir configuração
    echo
    log "INFO" "Configuração do Deploy:"
    echo -e "  ${CYAN}Domínio:${NC} $DOMAIN"
    echo -e "  ${CYAN}Email:${NC} $EMAIL"
    echo -e "  ${CYAN}Banco:${NC} $DB_NAME"
    echo -e "  ${CYAN}Usuário DB:${NC} $DB_USER"
    echo -e "  ${CYAN}Log File:${NC} $LOG_FILE"
    echo
}

# Função para executar script com verificação
execute_script() {
    local script_name="$1"
    local description="$2"
    local optional="${3:-false}"
    
    log "INFO" "Executando: $description"
    
    if [[ ! -f "$SCRIPT_DIR/$script_name" ]]; then
        if [[ "$optional" == "true" ]]; then
            log "WARNING" "Script '$script_name' não encontrado (opcional)"
            return 0
        else
            log "ERROR" "Script '$script_name' não encontrado"
            return 1
        fi
    fi
    
    if [[ ! -x "$SCRIPT_DIR/$script_name" ]]; then
        log "INFO" "Tornando '$script_name' executável"
        chmod +x "$SCRIPT_DIR/$script_name"
    fi
    
    echo -e "${YELLOW}" && echo "═══════════════════════════════════════════════════════════════" && echo -e "${NC}"
    
    if bash "$SCRIPT_DIR/$script_name" "$DOMAIN" "$EMAIL" "$DB_NAME" "$DB_USER" 2>&1 | tee -a "$LOG_FILE"; then
        log "SUCCESS" "$description - Concluído com sucesso"
        return 0
    else
        local exit_code=$?
        if [[ "$optional" == "true" ]]; then
            log "WARNING" "$description - Falhou (opcional, continuando)"
            return 0
        else
            log "ERROR" "$description - Falhou com código $exit_code"
            return $exit_code
        fi
    fi
}

# Função para testar conectividade
test_connectivity() {
    log "INFO" "Testando conectividade..."
    
    # Testar porta 3000
    if netstat -tuln | grep -q ":3000 "; then
        log "SUCCESS" "Porta 3000 está ativa"
    else
        log "WARNING" "Porta 3000 não está ativa"
    fi
    
    # Testar porta 80
    if netstat -tuln | grep -q ":80 "; then
        log "SUCCESS" "Porta 80 está ativa"
    else
        log "WARNING" "Porta 80 não está ativa"
    fi
    
    # Testar porta 443 (se SSL configurado)
    if netstat -tuln | grep -q ":443 "; then
        log "SUCCESS" "Porta 443 está ativa (SSL)"
    else
        log "INFO" "Porta 443 não está ativa (SSL não configurado)"
    fi
    
    # Testar URL local
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200\|302\|301"; then
        log "SUCCESS" "Aplicação respondendo em localhost:3000"
    else
        log "WARNING" "Aplicação não está respondendo em localhost:3000"
    fi
    
    # Testar domínio (se não for localhost)
    if [[ "$DOMAIN" != "localhost" ]]; then
        if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "200\|302\|301"; then
            log "SUCCESS" "Aplicação respondendo em $DOMAIN"
        else
            log "WARNING" "Aplicação não está respondendo em $DOMAIN"
        fi
    fi
}

# Função para gerar relatório final
generate_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    echo
    echo -e "${CYAN}" && echo "═══════════════════════════════════════════════════════════════" && echo -e "${NC}"
    echo -e "${GREEN}🎉 DEPLOY CONCLUÍDO! 🎉${NC}"
    echo -e "${CYAN}" && echo "═══════════════════════════════════════════════════════════════" && echo -e "${NC}"
    echo
    
    # Informações de tempo
    log "INFO" "Tempo total de execução: ${minutes}m ${seconds}s"
    log "INFO" "Erros encontrados: $ERROR_COUNT"
    log "INFO" "Avisos gerados: $WARNING_COUNT"
    echo
    
    # URLs de acesso
    echo -e "${YELLOW}🌐 URLs de Acesso:${NC}"
    if [[ "$DOMAIN" == "localhost" ]]; then
        echo -e "  ${GREEN}Site Principal:${NC} http://localhost:3000"
        echo -e "  ${GREEN}Painel Admin:${NC} http://localhost:3000/admin"
        echo -e "  ${GREEN}Dashboard:${NC} http://localhost:3000/dashboard"
        echo -e "  ${GREEN}API:${NC} http://localhost:3000/api"
    else
        echo -e "  ${GREEN}Site Principal:${NC} http://$DOMAIN"
        echo -e "  ${GREEN}Painel Admin:${NC} http://$DOMAIN/admin"
        echo -e "  ${GREEN}Dashboard:${NC} http://$DOMAIN/dashboard"
        echo -e "  ${GREEN}API:${NC} http://$DOMAIN/api"
        
        # Verificar se SSL está configurado
        if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
            echo -e "  ${GREEN}Site Principal (SSL):${NC} https://$DOMAIN"
            echo -e "  ${GREEN}Painel Admin (SSL):${NC} https://$DOMAIN/admin"
        fi
    fi
    echo
    
    # Comandos úteis
    echo -e "${YELLOW}🔧 Comandos Úteis:${NC}"
    echo -e "  ${CYAN}Status do serviço:${NC} sudo systemctl status codeseek"
    echo -e "  ${CYAN}Logs em tempo real:${NC} sudo journalctl -u codeseek -f"
    echo -e "  ${CYAN}Reiniciar serviço:${NC} sudo systemctl restart codeseek"
    echo -e "  ${CYAN}Verificar instalação:${NC} bash post-install-check.sh"
    echo -e "  ${CYAN}Diagnóstico:${NC} sudo bash troubleshoot.sh"
    echo
    
    # Diretórios importantes
    echo -e "${YELLOW}📁 Diretórios Importantes:${NC}"
    echo -e "  ${CYAN}Aplicação:${NC} /opt/codeseek"
    echo -e "  ${CYAN}Logs:${NC} /var/log/codeseek"
    echo -e "  ${CYAN}Configuração Nginx:${NC} /etc/nginx/sites-available/codeseek"
    echo -e "  ${CYAN}Serviço:${NC} /etc/systemd/system/codeseek.service"
    echo
    
    # Credenciais padrão
    echo -e "${YELLOW}🔑 Credenciais Padrão:${NC}"
    echo -e "  ${CYAN}Admin Email:${NC} admin@localhost"
    echo -e "  ${CYAN}Admin Senha:${NC} admin123 ${RED}(ALTERE APÓS PRIMEIRO LOGIN!)${NC}"
    echo -e "  ${CYAN}Banco de Dados:${NC} $DB_NAME"
    echo -e "  ${CYAN}Usuário DB:${NC} $DB_USER"
    echo
    
    # Próximos passos
    echo -e "${YELLOW}🎯 Próximos Passos:${NC}"
    echo -e "  ${GREEN}1.${NC} Acesse o painel admin e altere a senha padrão"
    echo -e "  ${GREEN}2.${NC} Configure o branding (logo, cores, textos)"
    echo -e "  ${GREEN}3.${NC} Configure o email SMTP para notificações"
    echo -e "  ${GREEN}4.${NC} Adicione produtos para venda"
    echo -e "  ${GREEN}5.${NC} Configure gateway de pagamento"
    echo
    
    # Log file
    echo -e "${YELLOW}📋 Log Completo:${NC} $LOG_FILE"
    echo
    
    if [[ $ERROR_COUNT -eq 0 ]]; then
        echo -e "${GREEN}✅ Deploy realizado com sucesso! O CodeSeek V1 está pronto para uso.${NC}"
    else
        echo -e "${YELLOW}⚠️  Deploy concluído com $ERROR_COUNT erro(s). Verifique os logs para mais detalhes.${NC}"
    fi
    
    echo
    echo -e "${CYAN}" && echo "═══════════════════════════════════════════════════════════════" && echo -e "${NC}"
}

# Função principal
main() {
    # Exibir banner
    show_banner
    
    # Verificar privilégios
    check_privileges
    
    # Validar parâmetros
    validate_parameters "$@"
    
    # Iniciar log
    log "INFO" "Iniciando deploy automático do CodeSeek V1"
    log "INFO" "Timestamp: $(date)"
    log "INFO" "Usuário: $(whoami)"
    log "INFO" "Diretório: $SCRIPT_DIR"
    
    echo
    echo -e "${YELLOW}🚀 Iniciando Deploy Automático...${NC}"
    echo
    
    # Etapa 1: Configuração de Scripts
    execute_script "setup-scripts.sh" "Configuração de Scripts" || {
        log "ERROR" "Falha na configuração de scripts"
        exit 1
    }
    
    # Etapa 2: Verificação Pré-Instalação
    execute_script "pre-install-check.sh" "Verificação Pré-Instalação" || {
        log "ERROR" "Falha na verificação pré-instalação"
        exit 1
    }
    
    # Etapa 3: Instalação Principal
    if [[ -f "$SCRIPT_DIR/one-line-install.sh" ]]; then
        execute_script "one-line-install.sh" "Instalação Principal (One-Line)" || {
            log "ERROR" "Falha na instalação principal"
            exit 1
        }
    elif [[ -f "$SCRIPT_DIR/install-auto.sh" ]]; then
        execute_script "install-auto.sh" "Instalação Principal (Auto)" || {
            log "ERROR" "Falha na instalação principal"
            exit 1
        }
    else
        log "ERROR" "Nenhum script de instalação encontrado"
        exit 1
    fi
    
    # Etapa 4: Verificação Pós-Instalação
    execute_script "post-install-check.sh" "Verificação Pós-Instalação" || {
        log "WARNING" "Falha na verificação pós-instalação (continuando)"
    }
    
    # Etapa 5: Troubleshooting (com correção automática)
    if [[ -f "$SCRIPT_DIR/troubleshoot.sh" ]]; then
        log "INFO" "Executando diagnóstico e correção automática"
        if bash "$SCRIPT_DIR/troubleshoot.sh" --auto-fix 2>&1 | tee -a "$LOG_FILE"; then
            log "SUCCESS" "Diagnóstico e correção - Concluído"
        else
            log "WARNING" "Diagnóstico encontrou problemas (verifique logs)"
        fi
    fi
    
    # Etapa 6: Teste de Conectividade
    test_connectivity
    
    # Etapa 7: Relatório Final
    generate_report
}

# Tratamento de sinais
trap 'log "ERROR" "Deploy interrompido pelo usuário"; exit 130' INT TERM

# Executar função principal
main "$@"