# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

**Important**: Keep this file in sync with `CLAUDE.md`. When updating one, update the other.

## Project Overview

Alexa Share is a Home Assistant add-on that provides a web UI for selecting which Home Assistant entities to expose to Amazon Alexa. Built with Next.js, it connects to Home Assistant via WebSocket, fetches entity/device/area registries, and writes selections to `configuration.yaml`.

## Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Start production server
pnpm test             # Run tests with Vitest
pnpm test:ui          # Interactive test UI
pnpm test:coverage    # Run tests with coverage report
pnpm lint             # Run Biome linter
pnpm lint:fix         # Auto-fix linting issues
pnpm type-check       # TypeScript type checking
pnpm docker:build     # Build Docker image
pnpm docker:run:dev   # Run Docker container locally
```

## Architecture

### Data Flow
1. WebSocket hook (`use-ha-websocket.hook.ts`) connects to Home Assistant
2. Fetches devices, entities, and areas from HA registry APIs
3. Compiles entities with device/area info into `CompiledEntity[]`
4. User selections managed via `use-synced-entities.hook.ts`
5. Changes published to `/api/publish-alexa-config` → writes to `configuration.yaml`

### Key Directories
- `src/hooks/` - Custom React hooks for WebSocket, entities, and config management
- `src/pages/api/` - API routes: `ha-config`, `get-alexa-config`, `publish-alexa-config`, `health`
- `src/guards/` - Type guards for Home Assistant message types
- `src/utils/` - YAML config parsing (`ha-config.util.ts`), addon options (`addon-options.util.ts`)
- `src/types/` - TypeScript types for HA entities, devices, areas, compiled entities

### Home Assistant Integration
- WebSocket protocol: `auth_required` → `auth` → `auth_ok` → registry requests
- Message types defined in `MessageType` enum (`home-assistant.types.ts`)
- Entity filtering by domain: switch, scene, sensor, binary_sensor, light, climate, button, automation

### Configuration
- Path alias: `@/*` → `./src/*`
- Biome: tabs, double quotes for JS
- Tailwind with Material Tailwind and custom `ha.*` color namespace
- Coverage threshold: 73%

## Docker Deployment

Multi-stage build: deps → builder → runner (nginx + Next.js)
- Port 8080: nginx proxy
- Port 3000: Next.js app
- Mounts: `/homeassistant` (config), `/data` (addon options)

## Commit Convention

Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
Scopes: `entities`, `websocket`, `api`, `ui`, `config`, `docker`
