#!/bin/bash

# ==============================================================================
# CodeSeek V1 - Troubleshoot Script
# ==============================================================================
# Description: Automated troubleshooting and problem resolution for CodeSeek
# Author: CodeSeek Team
# Version: 2.0.0
# Usage: sudo ./troubleshoot.sh [--fix] [--verbose]
# ==============================================================================

set -euo pipefail

# ==============================================================================
# CONFIGURATION
# ==============================================================================

APP_DIR="/opt/codeseek"
APP_USER="codeseek"
LOG_FILE="/var/log/codeseek-troubleshoot.log"
FIX_MODE=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==============================================================================
# LOGGING FUNCTIONS
# ==============================================================================

log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[INFO]${NC} $message"
    echo "[$timestamp] [INFO] $message" >> "$LOG_FILE"
}

warn() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARN]${NC} $message"
    echo "[$timestamp] [WARN] $message" >> "$LOG_FILE"
}

error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} $message"
    echo "[$timestamp] [ERROR] $message" >> "$LOG_FILE"
}

step() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[STEP]${NC} $message"
    echo "[$timestamp] [STEP] $message" >> "$LOG_FILE"
}

fix() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${PURPLE}[FIX]${NC} $message"
    echo "[$timestamp] [FIX] $message" >> "$LOG_FILE"
}

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

service_is_active() {
    systemctl is-active --quiet "$1" 2>/dev/null
}

service_is_enabled() {
    systemctl is-enabled --quiet "$1" 2>/dev/null
}

check_port() {
    local port="$1"
    netstat -tuln | grep -q ":$port "
}

# ==============================================================================
# DIAGNOSTIC FUNCTIONS
# ==============================================================================

diagnose_nodejs() {
    step "Diagnosing Node.js installation..."
    
    if ! command_exists node; then
        error "Node.js is not installed or not in PATH"
        if [[ "$FIX_MODE" == "true" ]]; then
            fix_nodejs
        fi
        return 1
    fi
    
    if ! command_exists npm; then
        error "npm is not installed or not in PATH"
        if [[ "$FIX_MODE" == "true" ]]; then
            fix_npm_path
        fi
        return 1
    fi
    
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log "Node.js version: $node_version"
    log "npm version: $npm_version"
    
    # Check if codeseek user can access npm
    if ! sudo -u "$APP_USER" which npm >/dev/null 2>&1; then
        error "User '$APP_USER' cannot access npm"
        if [[ "$FIX_MODE" == "true" ]]; then
            fix_npm_path
        fi
        return 1
    fi
    
    log "Node.js and npm are properly configured"
    return 0
}

diagnose_services() {
    step "Diagnosing system services..."
    
    local services=("postgresql" "redis-server" "nginx" "codeseek")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if ! service_is_active "$service"; then
            error "Service '$service' is not running"
            failed_services+=("$service")
        else
            log "Service '$service' is running"
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]] && [[ "$FIX_MODE" == "true" ]]; then
        fix_services "${failed_services[@]}"
    fi
    
    return ${#failed_services[@]}
}

diagnose_database() {
    step "Diagnosing database connection..."
    
    if ! service_is_active "postgresql"; then
        error "PostgreSQL service is not running"
        return 1
    fi
    
    # Test PostgreSQL connection
    if ! sudo -u postgres psql -c "SELECT 1" >/dev/null 2>&1; then
        error "Cannot connect to PostgreSQL"
        if [[ "$FIX_MODE" == "true" ]]; then
            fix_postgresql
        fi
        return 1
    fi
    
    # Check if CodeSeek database exists
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw codeseek; then
        warn "CodeSeek database does not exist"
        if [[ "$FIX_MODE" == "true" ]]; then
            fix_database_setup
        fi
        return 1
    fi
    
    log "Database connection is working"
    return 0
}

diagnose_permissions() {
    step "Diagnosing file permissions..."
    
    if [[ ! -d "$APP_DIR" ]]; then
        error "Application directory does not exist: $APP_DIR"
        return 1
    fi
    
    local owner=$(stat -c '%U' "$APP_DIR")
    if [[ "$owner" != "$APP_USER" ]]; then
        error "Incorrect ownership of $APP_DIR (owner: $owner, expected: $APP_USER)"
        if [[ "$FIX_MODE" == "true" ]]; then
            fix_permissions
        fi
        return 1
    fi
    
    # Check critical files
    local critical_files=(
        "$APP_DIR/backend/server.js"
        "$APP_DIR/backend/package.json"
        "$APP_DIR/backend/.env"
    )
    
    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Critical file missing: $file"
            return 1
        fi
        
        local file_owner=$(stat -c '%U' "$file")
        if [[ "$file_owner" != "$APP_USER" ]]; then
            error "Incorrect ownership of $file (owner: $file_owner, expected: $APP_USER)"
            if [[ "$FIX_MODE" == "true" ]]; then
                fix_permissions
            fi
            return 1
        fi
    done
    
    log "File permissions are correct"
    return 0
}

diagnose_network() {
    step "Diagnosing network connectivity..."
    
    # Check if ports are available
    local ports=("3000" "5432" "6379" "80" "443")
    
    for port in "${ports[@]}"; do
        if check_port "$port"; then
            log "Port $port is in use"
        else
            warn "Port $port is not in use"
        fi
    done
    
    # Test external connectivity
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log "External connectivity is working"
    else
        error "No external connectivity"
        return 1
    fi
    
    return 0
}

# ==============================================================================
# FIX FUNCTIONS
# ==============================================================================

fix_nodejs() {
    fix "Installing Node.js..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    log "Node.js installation completed"
}

fix_npm_path() {
    fix "Fixing npm PATH issues..."
    
    # Add npm to PATH for all users
    local npm_path=$(which npm 2>/dev/null || echo "/usr/bin/npm")
    local npm_dir=$(dirname "$npm_path")
    
    # Update PATH for codeseek user
    if [[ -f "/home/$APP_USER/.bashrc" ]]; then
        if ! grep -q "$npm_dir" "/home/$APP_USER/.bashrc"; then
            echo "export PATH=\$PATH:$npm_dir" >> "/home/$APP_USER/.bashrc"
        fi
    fi
    
    # Create symlink if needed
    if [[ ! -f "/usr/local/bin/npm" ]] && [[ -f "$npm_path" ]]; then
        sudo ln -sf "$npm_path" "/usr/local/bin/npm"
    fi
    
    log "npm PATH issues fixed"
}

fix_services() {
    local services=("$@")
    
    for service in "${services[@]}"; do
        fix "Starting service: $service"
        
        # Enable and start service
        sudo systemctl enable "$service" 2>/dev/null || true
        sudo systemctl start "$service"
        
        # Wait for service to start
        sleep 2
        
        if service_is_active "$service"; then
            log "Service '$service' started successfully"
        else
            error "Failed to start service '$service'"
            # Show service status for debugging
            sudo systemctl status "$service" --no-pager -l
        fi
    done
}

fix_postgresql() {
    fix "Fixing PostgreSQL issues..."
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    sleep 3
    
    # Check if it's running now
    if service_is_active "postgresql"; then
        log "PostgreSQL restarted successfully"
    else
        error "Failed to restart PostgreSQL"
        sudo systemctl status postgresql --no-pager -l
    fi
}

fix_database_setup() {
    fix "Setting up CodeSeek database..."
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE codeseek;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER codeseek WITH PASSWORD 'codeseek123';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE codeseek TO codeseek;" 2>/dev/null || true
    
    log "Database setup completed"
}

fix_permissions() {
    fix "Fixing file permissions..."
    
    # Fix ownership
    sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    # Fix permissions
    sudo chmod -R 755 "$APP_DIR"
    sudo chmod 600 "$APP_DIR/backend/.env" 2>/dev/null || true
    
    log "File permissions fixed"
}

fix_dependencies() {
    fix "Installing missing dependencies..."
    
    cd "$APP_DIR/backend"
    
    # Install backend dependencies as codeseek user
    sudo -u "$APP_USER" npm install
    
    log "Dependencies installation completed"
}

# ==============================================================================
# MAIN FUNCTIONS
# ==============================================================================

show_help() {
    echo "CodeSeek V1 Troubleshoot Script"
    echo ""
    echo "Usage: sudo $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --fix, -f       Automatically fix detected problems"
    echo "  --verbose, -v   Enable verbose output"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  sudo $0                    # Diagnose problems only"
    echo "  sudo $0 --fix             # Diagnose and fix problems"
    echo "  sudo $0 --fix --verbose   # Diagnose, fix with verbose output"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --fix|-f)
                FIX_MODE=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

run_diagnostics() {
    local total_issues=0
    
    step "Starting CodeSeek troubleshooting..."
    
    if [[ "$FIX_MODE" == "true" ]]; then
        log "Fix mode enabled - will attempt to resolve issues automatically"
    else
        log "Diagnostic mode - will only identify issues"
    fi
    
    # Run all diagnostic functions
    diagnose_nodejs || ((total_issues++))
    diagnose_services || ((total_issues++))
    diagnose_database || ((total_issues++))
    diagnose_permissions || ((total_issues++))
    diagnose_network || ((total_issues++))
    
    return $total_issues
}

generate_report() {
    local issues_found=$1
    
    echo ""
    echo "======================================"
    echo "CodeSeek Troubleshoot Report"
    echo "======================================"
    echo "Timestamp: $(date)"
    echo "Fix mode: $([[ "$FIX_MODE" == "true" ]] && echo "Enabled" || echo "Disabled")"
    echo "Issues found: $issues_found"
    echo "Log file: $LOG_FILE"
    echo ""
    
    if [[ $issues_found -eq 0 ]]; then
        echo -e "${GREEN}✓ No issues detected - CodeSeek appears to be working correctly${NC}"
    elif [[ "$FIX_MODE" == "true" ]]; then
        echo -e "${YELLOW}⚠ Issues were detected and fix attempts were made${NC}"
        echo "Please run the script again to verify fixes were successful"
    else
        echo -e "${RED}✗ Issues detected${NC}"
        echo "Run with --fix flag to attempt automatic resolution:"
        echo "sudo $0 --fix"
    fi
    
    echo ""
    echo "For manual troubleshooting, check the log file: $LOG_FILE"
}

main() {
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Run diagnostics
    local issues_found=0
    run_diagnostics || issues_found=$?
    
    # Generate report
    generate_report $issues_found
    
    # Exit with appropriate code
    exit $issues_found
}

# Execute main function
main "$@"