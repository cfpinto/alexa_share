# Docker Setup Guide

This guide explains how to run the Alexa Share application using Docker and Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)
- A Home Assistant instance (for the app to connect to)

## Quick Start

### 1. Create Required Directories

Before starting, create the directories that will be mounted as volumes:

```bash
# Create Home Assistant config directory (if not already present)
mkdir -p homeassistant_config

# Create addon config directory for persistent data
mkdir -p addon_config
```

### 2. Configuration

Copy the environment example file and configure your environment:

```bash
cp .env.example .env
```

Edit `.env` to customize your setup. **Important**: The `.env` file is automatically loaded by Docker Compose and is excluded from version control.

**Required step**: You must create a `.env` file before running `docker-compose up`. At minimum, copy the `.env.example` file:

```bash
# Quick setup with defaults
cp .env.example .env

# Or create with custom values
cat > .env << 'EOF'
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOST=0.0.0.0
HOSTNAME=0.0.0.0
NGINX_PORT=8080
APP_PORT=3000
EOF
```

### 3. Start the Application

Build and start the containers:

```bash
docker-compose up -d
```

This will:
- Build the Docker image from the Dockerfile
- Start the container in detached mode
- Mount the `homeassistant_config` directory to `/config` inside the container
- Mount the `addon_config` directory to `/data` inside the container
- Expose ports 8080 (Nginx) and 3000 (Next.js)

### 4. Access the Application

- **Via Nginx (recommended)**: http://localhost:8080
- **Direct Next.js access**: http://localhost:3000

## Docker Compose Commands

### Start the containers

```bash
docker-compose up -d
```

### Stop the containers

```bash
docker-compose down
```

### View logs

```bash
# All logs
docker-compose logs -f

# Only Alexa Share logs
docker-compose logs -f alexa-share
```

### Restart the containers

```bash
docker-compose restart
```

### Rebuild after code changes

```bash
docker-compose up -d --build
```

### Remove everything (containers, networks, volumes)

```bash
docker-compose down -v
```

## Volume Mounts

The docker-compose.yml file mounts two directories:

1. **`./homeassistant_config:/config:rw`**
   - Your Home Assistant configuration directory
   - Read-write access
   - The app reads and writes Alexa Share configuration here

2. **`./addon_config:/data:rw`**
   - Persistent data directory for the addon
   - Read-write access
   - Used for any addon-specific data that needs to persist

## Ports

- **8080**: Nginx reverse proxy (recommended for production)
- **3000**: Next.js application (direct access)

## Environment Variables

The `.env` file is **automatically loaded** by Docker Compose using the `env_file` directive. All variables defined in `.env` are available to the container.

### Available Environment Variables

Configure these in your `.env` file:

```env
# Next.js Environment
NODE_ENV=production              # Set to 'development' for dev mode
NEXT_TELEMETRY_DISABLED=1        # Disable Next.js telemetry

# Server Configuration
PORT=3000                        # Internal Next.js port
HOST=0.0.0.0                     # Bind to all interfaces
HOSTNAME=0.0.0.0                 # Hostname for Next.js

# Docker Port Mappings (host machine ports)
NGINX_PORT=8080                  # Nginx port on host
APP_PORT=3000                    # Next.js port on host

# Home Assistant (optional)
# HA_URL=http://homeassistant.local:8123
```

### Environment Variable Loading

Docker Compose loads variables in this order (later sources override earlier ones):

1. `.env` file (automatically loaded)
2. `env_file` directive in docker-compose.yml
3. `environment` section in docker-compose.yml
4. Command-line with `docker-compose --env-file`

### Default Values

The docker-compose.yml includes fallback defaults using the syntax `${VAR:-default}`:

- `NGINX_PORT`: defaults to `8080`
- `APP_PORT`: defaults to `3000`
- `NODE_ENV`: defaults to `production`
- `PORT`: defaults to `3000`
- `HOST`: defaults to `0.0.0.0`

This means the application will work even if `.env` is missing, using sensible defaults.

## Health Check

The container includes a health check that verifies the Nginx server is responding:

```bash
# Check container health status
docker-compose ps
```

A healthy container will show `healthy` in the status.

## Troubleshooting

### Container won't start

Check the logs:

```bash
docker-compose logs alexa-share
```

### Permission issues with volumes

Ensure the mounted directories have the correct permissions:

```bash
chmod -R 755 homeassistant_config addon_config
```

### Port already in use

If ports 8080 or 3000 are already in use, modify your `.env` file:

```env
# Change host ports (left side of mapping)
NGINX_PORT=8081  # Use port 8081 instead of 8080
APP_PORT=3001    # Use port 3001 instead of 3000
```

The ports will be automatically picked up by docker-compose on next start.

### Rebuild from scratch

If you need to completely rebuild:

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

For production deployments:

1. Always use the Nginx port (8080) for external access
2. Consider using a reverse proxy (Traefik, Nginx Proxy Manager) in front
3. Enable HTTPS with proper SSL certificates
4. Regularly backup the `homeassistant_config` and `addon_config` directories
5. Monitor container logs for errors
6. Set up automatic restarts:

```yaml
restart: always  # Instead of unless-stopped
```

## Integration with Home Assistant

If you're running this alongside Home Assistant:

1. Ensure both containers can communicate (use the same Docker network)
2. Mount your existing Home Assistant config directory
3. The app will access Home Assistant's WebSocket API at `ws://homeassistant.local:8123/api/websocket`

Example with custom network:

```yaml
services:
  alexa-share:
    # ... existing config
    networks:
      - homeassistant

networks:
  homeassistant:
    external: true
```

## Development vs Production

For development:
- Use `docker-compose.dev.yml` if available
- Mount source code as volume for hot-reloading
- Use `NODE_ENV=development`

For production:
- Use the standard `docker-compose.yml`
- Let Docker build and bundle the application
- Use `NODE_ENV=production`

## Backup and Restore

### Backup

```bash
# Backup configuration
tar -czf alexa-share-backup-$(date +%Y%m%d).tar.gz homeassistant_config addon_config
```

### Restore

```bash
# Extract backup
tar -xzf alexa-share-backup-YYYYMMDD.tar.gz
```

## Updates

To update to the latest version:

```bash
# Pull latest code changes (if using git)
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Support

For issues and questions:
- Check container logs: `docker-compose logs -f`
- Verify volume mounts are correct
- Ensure Home Assistant is accessible
- Check network connectivity between containers
