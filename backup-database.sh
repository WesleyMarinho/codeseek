#!/bin/bash

#######################################################################
# CodeSeek Database Backup Script
# 
# Description: Automated PostgreSQL database backup with rotation
# Author: CodeSeek Team
# Version: 2.0.0
# Last Modified: $(date '+%Y-%m-%d')
# 
# Usage: ./backup-database.sh [options]
# Cron Example: 0 2 * * * /opt/codeseek/backup-database.sh
# 
# Features:
# - Automated PostgreSQL backup with pg_dump
# - Compression with gzip
# - Backup rotation (configurable retention)
# - Error handling and logging
# - Email notifications on failure
# - Backup verification
#######################################################################

# Strict error handling
set -euo pipefail

# Configurações (podem ser sobrescritas por variáveis de ambiente)
BACKUP_DIR="${CODESEEK_BACKUP_DIR:-/opt/codeseek/backups}"
DB_NAME="${CODESEEK_DB_NAME:-codeseek_prod}"
DB_USER="${CODESEEK_DB_USER:-codeseek_user}"
DB_HOST="${CODESEEK_DB_HOST:-localhost}"
DB_PORT="${CODESEEK_DB_PORT:-5432}"
MAX_BACKUPS="${CODESEEK_MAX_BACKUPS:-7}"
LOG_DIR="${CODESEEK_LOG_DIR:-/var/log/codeseek}"
ALERT_EMAIL="${CODESEEK_ALERT_EMAIL:-}"
COMPRESSION_LEVEL="${CODESEEK_COMPRESSION_LEVEL:-6}"
BACKUP_TIMEOUT="${CODESEEK_BACKUP_TIMEOUT:-3600}"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Arquivo de log
LOG_FILE="${LOG_DIR}/backup-database.log"

# Funções utilitárias
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Funções de log aprimoradas
log() {
    local message="[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

info() {
    local message="[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

step() {
    local message="[STEP] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${CYAN}${message}${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

warning() {
    local message="[WARNING] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${YELLOW}${message}${NC}" >&2
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

error() {
    local message="[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo -e "${RED}${message}${NC}" >&2
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
    send_alert "Erro no backup do banco de dados: $1"
    exit 1
}

# Função para envio de alertas
send_alert() {
    local subject="$1"
    local body="${2:-Verifique os logs para mais detalhes: $LOG_FILE}"
    
    if [ -n "$ALERT_EMAIL" ]; then
        if command_exists mail; then
            echo "$body" | mail -s "[CodeSeek] $subject" "$ALERT_EMAIL" 2>/dev/null || true
        elif command_exists sendmail; then
            {
                echo "To: $ALERT_EMAIL"
                echo "Subject: [CodeSeek] $subject"
                echo ""
                echo "$body"
            } | sendmail "$ALERT_EMAIL" 2>/dev/null || true
        fi
    fi
}

# Função de inicialização
initialize_backup() {
    step "Inicializando sistema de backup"
    
    # Criar diretório de log se necessário
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR" 2>/dev/null || {
            warning "Não foi possível criar diretório de log: $LOG_DIR"
            LOG_FILE="/tmp/backup-database.log"
        }
    fi
    
    # Verificar se o arquivo de log é gravável
    if ! touch "$LOG_FILE" 2>/dev/null; then
        warning "Não foi possível escrever no arquivo de log: $LOG_FILE"
        LOG_FILE="/tmp/backup-database.log"
    fi
    
    log "Sistema de backup inicializado"
    info "Arquivo de log: $LOG_FILE"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    step "Verificando pré-requisitos"
    
    # Verificar se pg_dump está disponível
    if ! command_exists pg_dump; then
        error "pg_dump não encontrado. Instale o PostgreSQL client."
    fi
    
    # Verificar se gzip está disponível
    if ! command_exists gzip; then
        error "gzip não encontrado. Instale gzip para compressão."
    fi
    
    # Verificar conectividade com o banco
    if ! sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        error "Não foi possível conectar ao banco de dados $DB_NAME"
    fi
    
    log "Pré-requisitos verificados com sucesso"
}

# Função para preparar diretório de backup
prepare_backup_directory() {
    step "Preparando diretório de backup"
    
    # Criar diretório de backup se não existir
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR" || error "Falha ao criar diretório de backup: $BACKUP_DIR"
        log "Diretório de backup criado: $BACKUP_DIR"
    fi
    
    # Verificar permissões de escrita
    if [ ! -w "$BACKUP_DIR" ]; then
        error "Sem permissão de escrita no diretório: $BACKUP_DIR"
    fi
    
    # Verificar espaço em disco
    local available_space
    available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}' || echo "0")
    if [ "$available_space" -lt 1048576 ]; then  # Menos de 1GB
        warning "Pouco espaço disponível no diretório de backup: $(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')"
    fi
    
    log "Diretório de backup preparado: $BACKUP_DIR"
}

# Função para realizar o backup
perform_backup() {
    step "Realizando backup do banco de dados"
    
    local timestamp
    local backup_file
    local start_time
    local end_time
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="${BACKUP_DIR}/${DB_NAME}_${timestamp}.sql"
    start_time=$(date +%s)
    
    log "Iniciando backup: $DB_NAME -> $backup_file"
    
    # Realizar backup com timeout
    if ! timeout "$BACKUP_TIMEOUT" sudo -u postgres pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$backup_file" 2>/dev/null; then
        rm -f "$backup_file" 2>/dev/null || true
        error "Falha ao realizar backup (timeout ou erro de conexão)"
    fi
    
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Verificar se o arquivo foi criado e não está vazio
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        rm -f "$backup_file" 2>/dev/null || true
        error "Arquivo de backup não foi criado ou está vazio"
    fi
    
    log "Backup SQL concluído em ${duration}s: $(du -h "$backup_file" | cut -f1)"
    
    # Comprimir o arquivo
    step "Comprimindo arquivo de backup"
    if ! gzip -"$COMPRESSION_LEVEL" "$backup_file"; then
        rm -f "$backup_file" "${backup_file}.gz" 2>/dev/null || true
        error "Falha ao comprimir arquivo de backup"
    fi
    
    # Verificar arquivo comprimido
    if [ ! -f "${backup_file}.gz" ] || [ ! -s "${backup_file}.gz" ]; then
        rm -f "${backup_file}.gz" 2>/dev/null || true
        error "Arquivo comprimido não foi criado ou está vazio"
    fi
    
    log "Backup comprimido com sucesso: ${backup_file}.gz"
    info "Tamanho final: $(du -h "${backup_file}.gz" | cut -f1)"
    
    # Retornar o nome do arquivo para uso posterior
    echo "${backup_file}.gz"
}

# Função para rotação de backups
rotate_backups() {
    step "Verificando rotação de backups"
    
    local backup_count
    local num_to_delete
    
    # Contar backups existentes
    backup_count=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f 2>/dev/null | wc -l || echo "0")
    
    log "Backups encontrados: $backup_count (máximo: $MAX_BACKUPS)"
    
    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        num_to_delete=$((backup_count - MAX_BACKUPS))
        log "Removendo $num_to_delete backups antigos..."
        
        # Remover os backups mais antigos
        find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | \
            sort -n | head -n "$num_to_delete" | cut -d' ' -f2- | \
            xargs rm -f 2>/dev/null || true
        
        log "Backups antigos removidos. Mantendo os últimos $MAX_BACKUPS backups"
    else
        log "Nenhum backup antigo para remover"
    fi
}

# Função para listar backups disponíveis
list_available_backups() {
    step "Listando backups disponíveis"
    
    local backup_files
    backup_files=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f 2>/dev/null | sort -r || true)
    
    if [ -n "$backup_files" ]; then
        echo "$backup_files" | while read -r file; do
            local size
            local date_created
            size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "?")
            date_created=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "?")
            info "$(basename "$file") - $size - $date_created"
        done
    else
        warning "Nenhum backup encontrado"
    fi
}

# Função principal
main() {
    local backup_file
    local exit_code=0
    
    # Configurar trap para capturar erros
    trap 'error "Erro durante execução do backup na linha $LINENO"; exit 1' ERR
    
    # Inicializar sistema
    initialize_backup
    
    log "Iniciando processo de backup do banco de dados CodeSeek"
    info "Configurações: DB=$DB_NAME, Host=$DB_HOST:$DB_PORT, Retenção=$MAX_BACKUPS"
    
    # Executar todas as etapas
    check_prerequisites
    prepare_backup_directory
    backup_file=$(perform_backup)
    rotate_backups
    list_available_backups
    
    # Resultado final
    log "Processo de backup concluído com sucesso!"
    info "Arquivo criado: $(basename "$backup_file")"
    info "Localização: $backup_file"
    
    exit $exit_code
}

# Executar função principal se script for chamado diretamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi