#!/bin/bash

# Script para backup automático do banco de dados PostgreSQL
# Recomendado para ser executado via cron diariamente
# Exemplo: 0 2 * * * /opt/digiserver/backup-database.sh

# Configurações
BACKUP_DIR="/opt/digiserver/backups"
DB_NAME="digiserver_prod"
DB_USER="digiserver_user"
MAX_BACKUPS=7  # Manter apenas os últimos 7 backups

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    exit 1
}

# Criar diretório de backup se não existir
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR" || error "Falha ao criar diretório de backup"
    log "Diretório de backup criado: $BACKUP_DIR"
fi

# Nome do arquivo de backup com timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

# Realizar backup
log "Iniciando backup do banco de dados $DB_NAME..."
sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE" || error "Falha ao realizar backup"

# Comprimir o arquivo
log "Comprimindo arquivo de backup..."
gzip "$BACKUP_FILE" || error "Falha ao comprimir arquivo de backup"

# Verificar se o backup foi criado com sucesso
if [ -f "${BACKUP_FILE}.gz" ]; then
    log "Backup concluído com sucesso: ${BACKUP_FILE}.gz"
    log "Tamanho do arquivo: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"
else
    error "Arquivo de backup não encontrado após a conclusão"
fi

# Remover backups antigos
log "Verificando backups antigos..."
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    NUM_TO_DELETE=$((BACKUP_COUNT - MAX_BACKUPS))
    log "Removendo $NUM_TO_DELETE backups antigos..."
    
    ls -1t "$BACKUP_DIR"/*.gz | tail -n "$NUM_TO_DELETE" | xargs rm -f
    
    log "Backups antigos removidos. Mantendo apenas os últimos $MAX_BACKUPS backups."
fi

# Listar backups disponíveis
log "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/*.gz | awk '{print $9, "(", $5, ")"}'  

log "Processo de backup concluído com sucesso."