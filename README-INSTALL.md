# CodeSeek V1 - Installation Guide

## 🚀 Quick Installation

### One-Line Installation (Recommended)

For Ubuntu/Debian servers with domain and SSL:

```bash
curl -fsSL https://raw.githubusercontent.com/WesleyMarinho/codeseek/main/one-line-install.sh | sudo bash -s -- yourdomain.com admin@yourdomain.com
```

### Local Development Installation

```bash
# Clone and setup
git clone https://github.com/WesleyMarinho/codeseek.git
cd codeseek
sudo bash install.sh
```

## 📋 System Requirements

- **OS**: Ubuntu 20.04+ / Debian 11+
- **Node.js**: 18.x or higher
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Memory**: 2GB RAM minimum
- **Storage**: 10GB available space

## 🔧 Installation Scripts

| Script | Purpose |
|--------|---------|
| `one-line-install.sh` | Complete automated production setup |
| `install.sh` | Interactive installation with options |
| `pre-install-check.sh` | Verify system requirements |
| `post-install-check.sh` | Validate installation |
| `troubleshoot.sh` | Diagnose and fix issues |

## ⚙️ Configuration

### Environment Variables

Key variables in `.env`:

```bash
# Database
DB_HOST=localhost
DB_NAME=codeseek
DB_USER=codeseek
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
APP_SECRET=your_app_secret_key
DOMAIN=yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Payment (Optional)
CHARGEBEE_SITE=your_site
CHARGEBEE_API_KEY=your_api_key
```

### SSL Configuration

SSL certificates are automatically configured with Let's Encrypt during installation.

## 🔍 Verification

After installation, verify the setup:

```bash
# Run post-installation checks
bash post-install-check.sh

# Check service status
sudo systemctl status codeseek

# View logs
sudo journalctl -u codeseek -f
```

## 🌐 Access Points

- **Main Site**: https://yourdomain.com
- **Admin Panel**: https://yourdomain.com/admin
- **API Health**: https://yourdomain.com/api/health
- **API Docs**: https://yourdomain.com/api/docs

## 🛠️ Maintenance

### Backup Database
```bash
bash backup-database.sh
```

### Monitor System
```bash
bash monitor.sh
```

### Update Application
```bash
cd /opt/codeseek
git pull origin main
npm install --production
sudo systemctl restart codeseek
```

## 🆘 Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   bash troubleshoot.sh
   ```

2. **Database connection errors**
   ```bash
   sudo -u postgres psql -c "\l" | grep codeseek
   ```

3. **SSL certificate issues**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **Permission errors**
   ```bash
   sudo chown -R codeseek:codeseek /opt/codeseek
   ```

### Log Locations

- **Application**: `/var/log/codeseek/`
- **Nginx**: `/var/log/nginx/`
- **System**: `sudo journalctl -u codeseek`

## 📞 Support

For issues and support:

1. Run diagnostic: `bash troubleshoot.sh`
2. Check logs: `sudo journalctl -u codeseek -n 50`
3. Review documentation: `cat README.md`
4. Create GitHub issue with diagnostic output

---

**Installation Time**: ~10-15 minutes  
**Difficulty**: Beginner-friendly  
**Support**: Community & Documentation