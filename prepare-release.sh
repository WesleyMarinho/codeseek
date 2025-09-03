#!/bin/bash

# ==============================================================================
# Script para Preparar Release do CodeSeek V1
# ==============================================================================
#
# Este script prepara o projeto CodeSeek V1 para distribuição,
# configurando permissões, validando scripts e criando documentação.
#
# Uso: bash prepare-release.sh
#
# ==============================================================================

set -euo pipefail

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

header() {
    echo -e "\n${MAGENTA}"
    echo "==============================================="
    echo "    $1"
    echo "==============================================="
    echo -e "${NC}\n"
}

# --- Variáveis ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.0.0"
RELEASE_DATE=$(date +"%Y-%m-%d")

# Lista de scripts de instalação
INSTALL_SCRIPTS=(
    "deploy.sh"
    "install.sh"
    "install-auto.sh"
    "one-line-install.sh"
    "pre-install-check.sh"
    "post-install-check.sh"
    "troubleshoot.sh"
    "setup-scripts.sh"
    "help.sh"
    "prepare-release.sh"
)

# Lista de arquivos de documentação
DOC_FILES=(
    "README-INSTALL.md"
    "INSTALLATION.md"
    "README.md"
)

# Lista de arquivos de configuração
CONFIG_FILES=(
    "package.json"
    "package-lock.json"
    ".env.example"
    "docker-compose.yml"
    "Dockerfile"
)

header "CodeSeek V1 - Preparação para Release v$VERSION"

info "Diretório: $SCRIPT_DIR"
info "Versão: $VERSION"
info "Data: $RELEASE_DATE"

# ==============================================================================
# 1. VERIFICAR ESTRUTURA DO PROJETO
# ==============================================================================

step "Verificando estrutura do projeto"

# Verificar diretórios principais
REQUIRED_DIRS=(
    "backend"
    "frontend"
    "database"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$SCRIPT_DIR/$dir" ]; then
        log "Diretório $dir encontrado"
    else
        warning "Diretório $dir não encontrado"
    fi
done

# ==============================================================================
# 2. VALIDAR SCRIPTS DE INSTALAÇÃO
# ==============================================================================

step "Validando scripts de instalação"

MISSING_SCRIPTS=()
INVALID_SCRIPTS=()

for script in "${INSTALL_SCRIPTS[@]}"; do
    script_path="$SCRIPT_DIR/$script"
    
    if [ -f "$script_path" ]; then
        # Verificar sintaxe
        if bash -n "$script_path" 2>/dev/null; then
            log "$script - OK"
        else
            error "$script - Erro de sintaxe"
            INVALID_SCRIPTS+=("$script")
        fi
    else
        warning "$script - Não encontrado"
        MISSING_SCRIPTS+=("$script")
    fi
done

if [ ${#INVALID_SCRIPTS[@]} -gt 0 ]; then
    error "Scripts com erro de sintaxe: ${INVALID_SCRIPTS[*]}"
    exit 1
fi

# ==============================================================================
# 3. CONFIGURAR PERMISSÕES
# ==============================================================================

step "Configurando permissões"

# Tornar scripts executáveis
for script in "${INSTALL_SCRIPTS[@]}"; do
    script_path="$SCRIPT_DIR/$script"
    if [ -f "$script_path" ]; then
        chmod +x "$script_path"
        log "$script agora é executável"
    fi
done

# Configurar permissões de diretórios
find "$SCRIPT_DIR" -type d -exec chmod 755 {} \;
find "$SCRIPT_DIR" -type f -name "*.md" -exec chmod 644 {} \;
find "$SCRIPT_DIR" -type f -name "*.json" -exec chmod 644 {} \;
find "$SCRIPT_DIR" -type f -name "*.js" -exec chmod 644 {} \;
find "$SCRIPT_DIR" -type f -name "*.css" -exec chmod 644 {} \;
find "$SCRIPT_DIR" -type f -name "*.html" -exec chmod 644 {} \;

log "Permissões configuradas"

# ==============================================================================
# 4. VALIDAR DOCUMENTAÇÃO
# ==============================================================================

step "Validando documentação"

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$doc" ]; then
        # Verificar se não está vazio
        if [ -s "$SCRIPT_DIR/$doc" ]; then
            log "$doc - OK"
        else
            warning "$doc - Arquivo vazio"
        fi
    else
        warning "$doc - Não encontrado"
    fi
done

# ==============================================================================
# 5. CRIAR ARQUIVO DE VERSÃO
# ==============================================================================

step "Criando arquivo de versão"

cat > "$SCRIPT_DIR/VERSION" << EOF
CodeSeek V1
Versão: $VERSION
Data de Release: $RELEASE_DATE
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
Branch: $(git branch --show-current 2>/dev/null || echo "N/A")
EOF

log "Arquivo VERSION criado"

# ==============================================================================
# 6. CRIAR CHECKSUMS
# ==============================================================================

step "Gerando checksums"

# Gerar checksums dos scripts principais
echo "# CodeSeek V1 - Checksums" > "$SCRIPT_DIR/CHECKSUMS.md5"
echo "# Gerado em: $(date)" >> "$SCRIPT_DIR/CHECKSUMS.md5"
echo "" >> "$SCRIPT_DIR/CHECKSUMS.md5"

for script in "${INSTALL_SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        md5sum "$script" >> "$SCRIPT_DIR/CHECKSUMS.md5"
    fi
done

log "Checksums gerados"

# ==============================================================================
# 7. CRIAR ARQUIVO DE RELEASE NOTES
# ==============================================================================

step "Criando release notes"

cat > "$SCRIPT_DIR/RELEASE-NOTES.md" << EOF
# CodeSeek V1 - Release Notes

## Versão $VERSION - $RELEASE_DATE

### 🚀 Novidades

- ✅ **Deploy 100% Automático**: Script \`deploy.sh\` que executa toda a instalação sem intervenção manual
- ✅ **Verificações Automáticas**: Scripts de pré e pós-instalação com correção automática
- ✅ **Troubleshooting Inteligente**: Diagnóstico e correção automática de problemas
- ✅ **Documentação Completa**: Guias detalhados e exemplos práticos
- ✅ **Configuração SSL**: Certificados automáticos com Let's Encrypt
- ✅ **Monitoramento**: Scripts de verificação e logs detalhados

### 📋 Scripts Incluídos

| Script | Descrição |
|--------|----------|
| \`deploy.sh\` | 🎯 Deploy completo automático (recomendado) |
| \`one-line-install.sh\` | Instalação rápida em uma linha |
| \`install-auto.sh\` | Instalação automática com parâmetros |
| \`pre-install-check.sh\` | Verificação pré-instalação |
| \`post-install-check.sh\` | Verificação pós-instalação |
| \`troubleshoot.sh\` | Diagnóstico e correção |
| \`setup-scripts.sh\` | Configuração de scripts |
| \`help.sh\` | Ajuda e documentação |

### 🛠️ Requisitos do Sistema

- **OS**: Ubuntu 18.04+ / Debian 9+ / CentOS 7+
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Disco**: Mínimo 10GB livres
- **Rede**: Conexão com internet
- **Privilégios**: Acesso root (sudo)

### 🚀 Instalação Rápida

\`\`\`bash
# Clone o repositório
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek

# Execute o deploy automático
sudo bash deploy.sh meudominio.com admin@meudominio.com
\`\`\`

### 🔧 Funcionalidades

- **Backend**: Node.js + Express
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Banco de Dados**: PostgreSQL + Redis
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (automático)
- **Monitoramento**: Systemd + Logs
- **Backup**: Scripts automatizados

### 📚 Documentação

- **[README-INSTALL.md](README-INSTALL.md)** - Guia rápido de instalação
- **[INSTALLATION.md](INSTALLATION.md)** - Documentação completa
- **[help.sh](help.sh)** - Ajuda dos scripts

### 🐛 Correções

- Corrigido problema de permissões em uploads
- Melhorado tratamento de erros na instalação
- Otimizado processo de configuração do banco
- Corrigido configuração SSL para múltiplos domínios

### ⚠️ Notas Importantes

- Altere as credenciais padrão após a instalação
- Configure backups regulares
- Monitore os logs regularmente
- Mantenha o sistema atualizado

### 🔗 Links Úteis

- **Repositório**: https://github.com/WesleyMarinho/codeseek
- **Documentação**: https://docs.codeseek.com
- **Suporte**: https://support.codeseek.com
- **Issues**: https://github.com/WesleyMarinho/codeseek/issues

---

**Desenvolvido com ❤️ pela equipe CodeSeek**
EOF

log "Release notes criadas"

# ==============================================================================
# 8. CRIAR SCRIPT DE VERIFICAÇÃO DE INTEGRIDADE
# ==============================================================================

step "Criando script de verificação de integridade"

cat > "$SCRIPT_DIR/verify-integrity.sh" << 'EOF'
#!/bin/bash

# Script de verificação de integridade do CodeSeek V1

echo "Verificando integridade do CodeSeek V1..."

# Verificar checksums
if [ -f "CHECKSUMS.md5" ]; then
    echo "Verificando checksums..."
    if md5sum -c CHECKSUMS.md5 --quiet; then
        echo "✅ Checksums OK"
    else
        echo "❌ Checksums inválidos"
        exit 1
    fi
else
    echo "⚠️ Arquivo de checksums não encontrado"
fi

# Verificar scripts principais
SCRIPTS=("deploy.sh" "one-line-install.sh" "pre-install-check.sh" "post-install-check.sh")

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        echo "✅ $script OK"
    else
        echo "❌ $script não encontrado ou não executável"
        exit 1
    fi
done

echo "✅ Verificação de integridade concluída com sucesso!"
EOF

chmod +x "$SCRIPT_DIR/verify-integrity.sh"
log "Script de verificação criado"

# ==============================================================================
# 9. EXECUTAR CONFIGURAÇÃO DE SCRIPTS
# ==============================================================================

step "Executando configuração de scripts"

if [ -f "$SCRIPT_DIR/setup-scripts.sh" ]; then
    bash "$SCRIPT_DIR/setup-scripts.sh"
    log "Scripts configurados"
else
    warning "setup-scripts.sh não encontrado"
fi

# ==============================================================================
# 10. CRIAR ARQUIVO DE DISTRIBUIÇÃO
# ==============================================================================

step "Criando informações de distribuição"

cat > "$SCRIPT_DIR/DISTRIBUTION.md" << EOF
# CodeSeek V1 - Informações de Distribuição

## Versão
- **Versão**: $VERSION
- **Data**: $RELEASE_DATE
- **Commit**: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")

## Arquivos Incluídos

### Scripts de Instalação
$(for script in "${INSTALL_SCRIPTS[@]}"; do echo "- \`$script\`"; done)

### Documentação
$(for doc in "${DOC_FILES[@]}"; do echo "- \`$doc\`"; done)

### Arquivos de Sistema
- \`VERSION\`
- \`CHECKSUMS.md5\`
- \`RELEASE-NOTES.md\`
- \`verify-integrity.sh\`

## Verificação de Integridade

\`\`\`bash
# Verificar integridade dos arquivos
bash verify-integrity.sh
\`\`\`

## Instalação

\`\`\`bash
# Instalação rápida
sudo bash deploy.sh meudominio.com admin@meudominio.com
\`\`\`

## Suporte

- **Documentação**: README-INSTALL.md
- **Ajuda**: bash help.sh
- **Issues**: GitHub Issues
EOF

log "Informações de distribuição criadas"

# ==============================================================================
# 11. VERIFICAÇÃO FINAL
# ==============================================================================

step "Verificação final"

# Executar verificação de integridade
if bash "$SCRIPT_DIR/verify-integrity.sh" >/dev/null 2>&1; then
    log "Verificação de integridade passou"
else
    error "Verificação de integridade falhou"
    exit 1
fi

# Verificar se todos os scripts são executáveis
NON_EXECUTABLE=()
for script in "${INSTALL_SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ] && [ ! -x "$SCRIPT_DIR/$script" ]; then
        NON_EXECUTABLE+=("$script")
    fi
done

if [ ${#NON_EXECUTABLE[@]} -gt 0 ]; then
    error "Scripts não executáveis: ${NON_EXECUTABLE[*]}"
    exit 1
fi

# Contar arquivos
TOTAL_FILES=$(find "$SCRIPT_DIR" -type f | wc -l)
TOTAL_SCRIPTS=$(find "$SCRIPT_DIR" -name "*.sh" -type f | wc -l)
TOTAL_DOCS=$(find "$SCRIPT_DIR" -name "*.md" -type f | wc -l)

# ==============================================================================
# 12. RELATÓRIO FINAL
# ==============================================================================

header "Preparação Concluída!"

echo -e "${GREEN}🎉 CodeSeek V1 v$VERSION está pronto para distribuição!${NC}\n"

echo -e "${CYAN}📊 Estatísticas:${NC}"
echo -e "   📁 Total de arquivos: ${BLUE}$TOTAL_FILES${NC}"
echo -e "   🔧 Scripts: ${BLUE}$TOTAL_SCRIPTS${NC}"
echo -e "   📚 Documentação: ${BLUE}$TOTAL_DOCS${NC}"
echo -e "   📅 Data: ${BLUE}$RELEASE_DATE${NC}"
echo -e "   🏷️  Versão: ${BLUE}$VERSION${NC}"

echo -e "\n${CYAN}📋 Scripts Principais:${NC}"
for script in "${INSTALL_SCRIPTS[@]}"; do
    if [ -f "$SCRIPT_DIR/$script" ]; then
        echo -e "   ✅ ${BLUE}$script${NC}"
    fi
done

echo -e "\n${CYAN}📚 Documentação:${NC}"
for doc in "${DOC_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$doc" ]; then
        echo -e "   📖 ${BLUE}$doc${NC}"
    fi
done

echo -e "\n${CYAN}🔧 Arquivos de Sistema:${NC}"
echo -e "   📋 ${BLUE}VERSION${NC}"
echo -e "   🔐 ${BLUE}CHECKSUMS.md5${NC}"
echo -e "   📝 ${BLUE}RELEASE-NOTES.md${NC}"
echo -e "   ✅ ${BLUE}verify-integrity.sh${NC}"
echo -e "   📦 ${BLUE}DISTRIBUTION.md${NC}"

echo -e "\n${CYAN}🚀 Próximos Passos:${NC}"
echo -e "   1. Teste a instalação: ${BLUE}sudo bash deploy.sh${NC}"
echo -e "   2. Verifique integridade: ${BLUE}bash verify-integrity.sh${NC}"
echo -e "   3. Leia a documentação: ${BLUE}cat README-INSTALL.md${NC}"
echo -e "   4. Crie release no GitHub"
echo -e "   5. Distribua para usuários"

echo -e "\n${CYAN}📦 Comando de Distribuição:${NC}"
echo -e "   ${BLUE}tar -czf codeseek-v$VERSION.tar.gz *${NC}"

echo -e "\n${GREEN}✅ Preparação concluída com sucesso!${NC}"
echo -e "${GREEN}🎯 CodeSeek V1 v$VERSION está pronto para uso!${NC}\n"

# Salvar log da preparação
echo "Preparação para release concluída em $(date)" > "$SCRIPT_DIR/prepare.log"
echo "Versão: $VERSION" >> "$SCRIPT_DIR/prepare.log"
echo "Scripts: ${INSTALL_SCRIPTS[*]}" >> "$SCRIPT_DIR/prepare.log"
echo "Documentação: ${DOC_FILES[*]}" >> "$SCRIPT_DIR/prepare.log"
echo "Total de arquivos: $TOTAL_FILES" >> "$SCRIPT_DIR/prepare.log"