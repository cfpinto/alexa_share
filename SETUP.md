# Quick Setup Guide

## First Time Setup

```bash
# 1. Clone the repository (if not already done)
git clone <repository-url>
cd alexa

# 2. Create environment file from template
cp .env.example .env

# 3. Edit .env if needed (optional, defaults work fine)
# nano .env  # or use your preferred editor

# 4. Create required directories
mkdir -p homeassistant_config addon_config

# 5. Start the application
docker-compose up -d

# 6. Check logs to ensure everything is running
docker-compose logs -f
```

## Access the Application

- **Nginx (recommended)**: http://localhost:8080
- **Direct Next.js**: http://localhost:3000

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Check service status
docker-compose ps
```

## Environment Configuration

The `.env` file contains all configuration:

```env
# Ports (change if already in use)
NGINX_PORT=8080
APP_PORT=3000

# Application settings
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

**Note**: The `.env` file is automatically loaded by Docker Compose and is **not committed to git**.

## Troubleshooting

### Port conflicts

Edit `.env` and change `NGINX_PORT` or `APP_PORT`:

```env
NGINX_PORT=8081
APP_PORT=3001
```

### Permission issues

```bash
chmod -R 755 homeassistant_config addon_config
```

### Clean rebuild

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## For More Details

See [DOCKER.md](DOCKER.md) for comprehensive documentation.
