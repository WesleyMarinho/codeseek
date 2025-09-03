#!/bin/bash

# Script para monitoramento básico do servidor e da aplicação CodeSeek
# Recomendado para ser executado via cron a cada 5 minutos
# Exemplo: */5 * * * * /opt/codeseek/monitor.sh

# Configurações
LOG_FILE="/var/log/codeseek/monitor.log"
ALERT_EMAIL="admin@example.com"
APP_URL="http://localhost:3000/health"
SERVICE_NAME="codeseek.service"
MAX_CPU=90  # Alerta se CPU > 90%
MAX_MEM=90  # Alerta se memória > 90%
MAX_DISK=90 # Alerta se disco > 90%

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - INFO - $1" >> "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - WARNING - $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR - $1" >> "$LOG_FILE"
    
    # Enviar alerta por email
    if command -v mail &> /dev/null; then
        echo "$1" | mail -s "[ALERTA] CodeSeek - $1" "$ALERT_EMAIL"
    fi
}

# Criar diretório de log se não existir
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null

# Iniciar monitoramento
log "Iniciando monitoramento do sistema..."

# Verificar status do serviço
log "Verificando status do serviço $SERVICE_NAME..."
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
    error "Serviço $SERVICE_NAME não está rodando!"
    
    # Tentar reiniciar o serviço
    log "Tentando reiniciar o serviço..."
    systemctl restart "$SERVICE_NAME"
    
    # Verificar se o reinício foi bem-sucedido
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        warning "Serviço $SERVICE_NAME reiniciado com sucesso."
    else
        error "Falha ao reiniciar o serviço $SERVICE_NAME!"
    fi
else
    log "Serviço $SERVICE_NAME está rodando normalmente."
fi

# Verificar endpoint de saúde da aplicação
log "Verificando endpoint de saúde da aplicação..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")

if [ "$HEALTH_CHECK" != "200" ]; then
    error "Endpoint de saúde retornou código HTTP $HEALTH_CHECK!"
else
    log "Endpoint de saúde está respondendo normalmente (HTTP 200)."
fi

# Verificar uso de CPU
log "Verificando uso de CPU..."
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | cut -d. -f1)

if [ "$CPU_USAGE" -gt "$MAX_CPU" ]; then
    error "Uso de CPU está em $CPU_USAGE%, acima do limite de $MAX_CPU%!"
else
    log "Uso de CPU: $CPU_USAGE% (limite: $MAX_CPU%)."
fi

# Verificar uso de memória
log "Verificando uso de memória..."
MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')

if [ "$MEM_USAGE" -gt "$MAX_MEM" ]; then
    error "Uso de memória está em $MEM_USAGE%, acima do limite de $MAX_MEM%!"
else
    log "Uso de memória: $MEM_USAGE% (limite: $MAX_MEM%)."
fi

# Verificar uso de disco
log "Verificando uso de disco..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d% -f1)

if [ "$DISK_USAGE" -gt "$MAX_DISK" ]; then
    error "Uso de disco está em $DISK_USAGE%, acima do limite de $MAX_DISK%!"
else
    log "Uso de disco: $DISK_USAGE% (limite: $MAX_DISK%)."
fi

# Verificar conexões de banco de dados
log "Verificando conexões de banco de dados..."
DB_CONNECTIONS=$(sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='codeseek_prod';" | sed -n 3p | tr -d ' ')

log "Conexões ativas no banco de dados: $DB_CONNECTIONS"

# Verificar conexões Redis
log "Verificando conexões Redis..."
REDIS_CONNECTIONS=$(redis-cli info clients | grep connected_clients | cut -d: -f2 | tr -d '\r')

log "Conexões ativas no Redis: $REDIS_CONNECTIONS"

# Verificar logs de erro recentes
log "Verificando logs de erro recentes..."
ERROR_COUNT=$(journalctl -u "$SERVICE_NAME" --since "5 minutes ago" | grep -i error | wc -l)

if [ "$ERROR_COUNT" -gt 0 ]; then
    warning "Encontrados $ERROR_COUNT erros nos logs dos últimos 5 minutos."
else
    log "Nenhum erro encontrado nos logs recentes."
fi

log "Monitoramento concluído com sucesso."