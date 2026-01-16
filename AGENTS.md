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
pnpm test             # Run unit tests with Vitest
pnpm test:ui          # Interactive test UI
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run E2E tests with Playwright
pnpm test:e2e:ui      # Interactive E2E test UI
pnpm test:e2e:headed  # Run E2E tests in headed browser
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

## Testing

### Unit Tests (Vitest)
- Located in `src/**/*.test.ts(x)` files alongside source code
- Uses `@testing-library/react` for component testing
- Coverage reports generated with `@vitest/coverage-v8`

### E2E Tests (Playwright)
- Located in `e2e/` directory
- Uses mock WebSocket server to simulate Home Assistant

#### E2E Architecture
```
e2e/
├── home.spec.ts              # E2E test specs
├── fixtures/
│   └── home-assistant.ts     # Mock data (devices, entities, areas)
├── mocks/
│   └── mock-ha-websocket-server.ts  # Mock WebSocket server
├── global-setup.ts           # Starts mock server, creates config files
└── global-teardown.ts        # Cleanup
```

#### Mock WebSocket Server
The mock server (`e2e/mocks/mock-ha-websocket-server.ts`) simulates Home Assistant's WebSocket protocol:
1. Sends `auth_required` on connection
2. Validates auth token and sends `auth_ok`
3. Responds to registry requests (devices, entities, areas)
4. Returns mock data from `e2e/fixtures/home-assistant.ts`

#### E2E Best Practices
- Use `page.waitForSelector("table")` before interacting with loaded content
- Use `{ force: true }` on clicks when toast notifications may overlay elements
- Use `.first()` selector when multiple elements match (Material Tailwind quirk)
- For tabs, use `page.locator('[role="tablist"]').getByText("TabName")` instead of role selectors
- Add `waitForToastToDismiss()` helper when toasts interfere with interactions

## Docker Deployment

Multi-stage build: deps → builder → runner (nginx + Next.js)
- Port 8080: nginx proxy
- Port 3000: Next.js app
- Mounts: `/homeassistant` (config), `/data` (addon options)

## Commit Convention

Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
Scopes: `entities`, `websocket`, `api`, `ui`, `config`, `docker`
