#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Monitor Script
# ==============================================================================
# Script para monitoramento básico do servidor e da aplicação CodeSeek
# Recomendado para ser executado via cron a cada 5 minutos
# Exemplo: */5 * * * * /opt/codeseek/monitor.sh
#
# Funcionalidades:
# - Monitoramento de processos PM2
# - Verificação de saúde da aplicação
# - Monitoramento de recursos (CPU, memória, disco)
# - Verificação de banco de dados e Redis
# - Alertas por email
# - Logs detalhados
# ==============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configurações padrão
LOG_FILE="${CODESEEK_LOG_DIR:-/var/log/codeseek}/monitor.log"
ALERT_EMAIL="${CODESEEK_ALERT_EMAIL:-admin@example.com}"
APP_URL="${CODESEEK_APP_URL:-http://localhost:3000/health}"
SERVICE_NAME="${CODESEEK_SERVICE_NAME:-codeseek}"
MAX_CPU=${CODESEEK_MAX_CPU:-90}  # Alerta se CPU > 90%
MAX_MEM=${CODESEEK_MAX_MEM:-90}  # Alerta se memória > 90%
MAX_DISK=${CODESEEK_MAX_DISK:-90} # Alerta se disco > 90%
CHECK_TIMEOUT=${CODESEEK_CHECK_TIMEOUT:-10}  # Timeout para verificações HTTP
DB_NAME="${CODESEEK_DB_NAME:-codeseek_prod}"
REDIS_HOST="${CODESEEK_REDIS_HOST:-localhost}"
REDIS_PORT="${CODESEEK_REDIS_PORT:-6379}"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==============================================================================
# FUNÇÕES UTILITÁRIAS
# ==============================================================================

# Verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se processo PM2 existe
service_exists() {
    pm2 describe "$1" >/dev/null 2>&1
}

# Função para exibir mensagens
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[INFO]${NC} $timestamp - $1"
    echo "$timestamp - INFO - $1" >> "$LOG_FILE" 2>/dev/null || true
}

warning() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING]${NC} $timestamp - $1"
    echo "$timestamp - WARNING - $1" >> "$LOG_FILE" 2>/dev/null || true
}

error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} $timestamp - $1"
    echo "$timestamp - ERROR - $1" >> "$LOG_FILE" 2>/dev/null || true
    
    # Enviar alerta por email se disponível
    send_alert "$1"
}

info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[INFO]${NC} $timestamp - $1"
    echo "$timestamp - INFO - $1" >> "$LOG_FILE" 2>/dev/null || true
}

step() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${CYAN}[STEP]${NC} $timestamp - $1"
    echo "$timestamp - STEP - $1" >> "$LOG_FILE" 2>/dev/null || true
}

# Função para enviar alertas
send_alert() {
    local message="$1"
    local subject="[ALERTA] CodeSeek Monitor - $(hostname)"
    
    # Tentar diferentes métodos de envio de email
    if command_exists mail; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    elif command_exists sendmail; then
        {
            echo "To: $ALERT_EMAIL"
            echo "Subject: $subject"
            echo ""
            echo "$message"
        } | sendmail "$ALERT_EMAIL" 2>/dev/null || true
    else
        warning "Nenhum sistema de email disponível para enviar alertas"
    fi
}

# Função para inicializar o monitor
initialize_monitor() {
    # Criar diretório de log se não existir
    local log_dir=$(dirname "$LOG_FILE")
    if [ ! -d "$log_dir" ]; then
        mkdir -p "$log_dir" 2>/dev/null || {
            warning "Não foi possível criar diretório de log: $log_dir"
            LOG_FILE="/tmp/codeseek-monitor.log"
            warning "Usando arquivo de log temporário: $LOG_FILE"
        }
    fi
    
    # Verificar se pode escrever no arquivo de log
    if ! touch "$LOG_FILE" 2>/dev/null; then
        warning "Não foi possível escrever no arquivo de log: $LOG_FILE"
        LOG_FILE="/tmp/codeseek-monitor.log"
        warning "Usando arquivo de log temporário: $LOG_FILE"
    fi
}

# ==============================================================================
# FUNÇÕES DE VERIFICAÇÃO
# ==============================================================================

# Verificar status do processo PM2
check_service_status() {
    step "Verificando status do processo $SERVICE_NAME"

    if ! service_exists "$SERVICE_NAME"; then
        error "Processo $SERVICE_NAME não encontrado!"
        return 1
    fi

    if ! pm2 describe "$SERVICE_NAME" >/dev/null 2>&1; then
        error "Processo $SERVICE_NAME não está rodando!"

        warning "Tentando reiniciar o processo..."
        if pm2 restart "$SERVICE_NAME" 2>/dev/null; then
            sleep 3
            if pm2 describe "$SERVICE_NAME" >/dev/null 2>&1; then
                log "Processo $SERVICE_NAME reiniciado com sucesso"
            else
                error "Falha ao reiniciar o processo $SERVICE_NAME"
                return 1
            fi
        else
            error "Não foi possível reiniciar o processo $SERVICE_NAME"
            return 1
        fi
    else
        log "Processo $SERVICE_NAME está rodando normalmente"
    fi

    return 0
}

# Verificar endpoint de saúde da aplicação
check_application_health() {
    step "Verificando endpoint de saúde da aplicação"
    
    if ! command_exists curl; then
        warning "curl não está disponível - pulando verificação de saúde HTTP"
        return 0
    fi
    
    local health_check
    local response_time
    
    # Fazer requisição com timeout
    health_check=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$CHECK_TIMEOUT" "$APP_URL" 2>/dev/null || echo "000")
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$CHECK_TIMEOUT" "$APP_URL" 2>/dev/null || echo "0")
    
    case "$health_check" in
        "200")
            log "Endpoint de saúde respondendo normalmente (HTTP 200)"
            info "Tempo de resposta: ${response_time}s"
            ;;
        "000")
            error "Falha ao conectar com o endpoint de saúde: $APP_URL"
            return 1
            ;;
        *)
            error "Endpoint de saúde retornou código HTTP $health_check"
            return 1
            ;;
    esac
    
    return 0
}

# Verificar uso de CPU
check_cpu_usage() {
    step "Verificando uso de CPU"
    
    local cpu_usage
    
    # Tentar diferentes métodos para obter uso de CPU
    if command_exists top; then
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | cut -d. -f1 2>/dev/null || echo "0")
    elif command_exists vmstat; then
        cpu_usage=$(vmstat 1 2 | tail -1 | awk '{print 100-$15}' 2>/dev/null || echo "0")
    elif [ -f /proc/stat ]; then
        # Método alternativo usando /proc/stat
        cpu_usage=$(awk '/^cpu / {usage=($2+$4)*100/($2+$3+$4+$5)} END {print int(usage)}' /proc/stat 2>/dev/null || echo "0")
    else
        warning "Não foi possível determinar uso de CPU"
        return 0
    fi
    
    # Validar se é um número
    if ! [[ "$cpu_usage" =~ ^[0-9]+$ ]]; then
        warning "Valor de CPU inválido: $cpu_usage"
        return 0
    fi
    
    if [ "$cpu_usage" -gt "$MAX_CPU" ]; then
        error "Uso de CPU está em $cpu_usage%, acima do limite de $MAX_CPU%!"
        return 1
    else
        log "Uso de CPU: $cpu_usage% (limite: $MAX_CPU%)"
    fi
    
    return 0
}

# Verificar uso de memória
check_memory_usage() {
    step "Verificando uso de memória"
    
    local mem_usage
    
    if command_exists free; then
        mem_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}' 2>/dev/null || echo "0")
    elif [ -f /proc/meminfo ]; then
        # Método alternativo usando /proc/meminfo
        local mem_total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
        local mem_available=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
        if [ -n "$mem_total" ] && [ -n "$mem_available" ]; then
            mem_usage=$(( (mem_total - mem_available) * 100 / mem_total ))
        else
            mem_usage=0
        fi
    else
        warning "Não foi possível determinar uso de memória"
        return 0
    fi
    
    # Validar se é um número
    if ! [[ "$mem_usage" =~ ^[0-9]+$ ]]; then
        warning "Valor de memória inválido: $mem_usage"
        return 0
    fi
    
    if [ "$mem_usage" -gt "$MAX_MEM" ]; then
        error "Uso de memória está em $mem_usage%, acima do limite de $MAX_MEM%!"
        return 1
    else
        log "Uso de memória: $mem_usage% (limite: $MAX_MEM%)"
    fi
    
    return 0
}

# Verificar uso de disco
check_disk_usage() {
    step "Verificando uso de disco"
    
    local disk_usage
    
    if command_exists df; then
        disk_usage=$(df -h / 2>/dev/null | awk 'NR==2 {print $5}' | cut -d% -f1 2>/dev/null || echo "0")
    else
        warning "Comando 'df' não disponível - pulando verificação de disco"
        return 0
    fi
    
    # Validar se é um número
    if ! [[ "$disk_usage" =~ ^[0-9]+$ ]]; then
        warning "Valor de disco inválido: $disk_usage"
        return 0
    fi
    
    if [ "$disk_usage" -gt "$MAX_DISK" ]; then
        error "Uso de disco está em $disk_usage%, acima do limite de $MAX_DISK%!"
        return 1
    else
        log "Uso de disco: $disk_usage% (limite: $MAX_DISK%)"
    fi
    
    return 0
}

# Verificar conexões de banco de dados
check_database_connections() {
    step "Verificando conexões de banco de dados"
    
    local db_connections
    
    if ! command_exists psql; then
        warning "PostgreSQL client (psql) não disponível - pulando verificação de BD"
        return 0
    fi
    
    # Tentar conectar e obter número de conexões
    db_connections=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='$DB_NAME';" 2>/dev/null | grep -E '^\s*[0-9]+' | awk '{print $1}' || echo "0")
    
    # Validar se é um número
    if ! [[ "$db_connections" =~ ^[0-9]+$ ]]; then
        warning "Não foi possível obter número de conexões do banco de dados"
        return 0
    fi
    
    log "Conexões ativas no banco de dados: $db_connections"
    
    return 0
}

# Verificar conexões Redis
check_redis_connections() {
    step "Verificando conexões Redis"
    
    local redis_connections
    
    if ! command_exists redis-cli; then
        warning "Redis client (redis-cli) não disponível - pulando verificação Redis"
        return 0
    fi
    
    # Tentar conectar ao Redis e obter informações
    redis_connections=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --raw info clients 2>/dev/null | grep connected_clients | cut -d: -f2 | tr -d '\r' || echo "0")
    
    # Validar se é um número
    if ! [[ "$redis_connections" =~ ^[0-9]+$ ]]; then
        warning "Não foi possível obter número de conexões Redis"
        return 0
    fi
    
    log "Conexões ativas no Redis: $redis_connections"
    
    return 0
}

# Verificar logs de erro recentes
check_error_logs() {
    step "Verificando logs de erro recentes"
    
    local error_count
    
    if ! command_exists journalctl; then
        warning "journalctl não disponível - tentando verificar logs alternativos"
        
        # Tentar verificar logs do sistema alternativos
        if [ -f "/var/log/syslog" ]; then
            error_count=$(grep -i "$SERVICE_NAME" /var/log/syslog | grep -i error | tail -20 | wc -l 2>/dev/null || echo "0")
        elif [ -f "/var/log/messages" ]; then
            error_count=$(grep -i "$SERVICE_NAME" /var/log/messages | grep -i error | tail -20 | wc -l 2>/dev/null || echo "0")
        else
            warning "Não foi possível verificar logs de erro"
            return 0
        fi
    else
        # Usar journalctl se disponível
        error_count=$(journalctl -u "$SERVICE_NAME" --since "5 minutes ago" 2>/dev/null | grep -i error | wc -l || echo "0")
    fi
    
    # Validar se é um número
    if ! [[ "$error_count" =~ ^[0-9]+$ ]]; then
        warning "Não foi possível contar erros nos logs"
        return 0
    fi
    
    if [ "$error_count" -gt 0 ]; then
        warning "Encontrados $error_count erros nos logs dos últimos 5 minutos"
    else
        log "Nenhum erro encontrado nos logs recentes"
    fi
    
    return 0
}

# Função principal de monitoramento
main() {
    local exit_code=0
    
    # Configurar trap para capturar erros
    trap 'error "Erro durante execução do monitoramento na linha $LINENO"; exit 1' ERR
    
    # Inicializar monitoramento
    initialize_monitor
    
    log "Iniciando monitoramento do sistema CodeSeek"
    info "Configurações: CPU<=$MAX_CPU%, MEM<=$MAX_MEM%, DISK<=$MAX_DISK%"
    
    # Executar todas as verificações
    check_service_status || exit_code=1
    check_application_health || exit_code=1
    check_cpu_usage || exit_code=1
    check_memory_usage || exit_code=1
    check_disk_usage || exit_code=1
    check_database_connections || exit_code=1
    check_redis_connections || exit_code=1
    check_error_logs || exit_code=1
    
    # Resultado final
    if [ $exit_code -eq 0 ]; then
        log "Monitoramento concluído com sucesso!"
        info "Todos os sistemas estão funcionando normalmente"
    else
        error "Monitoramento detectou problemas - verifique os logs acima"
        send_alert "Problemas detectados no monitoramento do CodeSeek"
    fi
    
    exit $exit_code
}

# Executar função principal se script for chamado diretamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi