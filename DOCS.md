# Alexa Share Documentation

## Overview

Alexa Share is a Home Assistant add-on that provides a web interface for selecting which Home Assistant entities to expose to Amazon Alexa. Instead of exposing your entire smart home, you can choose exactly which entities should be shared.

## Prerequisites

Before using Alexa Share, ensure you have:

1. **Home Assistant** version 2023.0.0 or later
2. **Amazon Alexa integration** configured in Home Assistant
3. A Home Assistant **Supervisor** installation (Home Assistant OS or Supervised)

## Installation

### Quick Install

Click the button below to add the repository to your Home Assistant instance:

[![Add Repository](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fcfpinto%2Falexa_share)

### Manual Installation

1. Navigate to **Settings** > **Add-ons** > **Add-on Store**
2. Click the menu icon (three dots) in the top right corner
3. Select **Repositories**
4. Add the following URL: `https://github.com/cfpinto/alexa_share`
5. Click **Add**
6. Find "Alexa Share" in the add-on store and click **Install**

## Configuration

### Add-on Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ha_websocket_url` | URL | `http://supervisor/core/websocket` | Home Assistant WebSocket URL. Usually doesn't need to be changed. |
| `ha_access_token` | Password | (empty) | Long-lived access token. Leave empty to use the Supervisor token (recommended). |
| `ha_entity_domains` | List | See below | Entity domains to display in the UI |

### Default Entity Domains

By default, the following entity domains are available:

- `switch` - Switches and smart plugs
- `scene` - Scenes
- `sensor` - Sensors
- `binary_sensor` - Binary sensors (on/off)
- `light` - Lights
- `climate` - Thermostats and HVAC
- `button` - Buttons
- `automation` - Automations

You can customize this list in the add-on configuration to show only the domains you need.

### Example Configuration

```yaml
ha_websocket_url: http://supervisor/core/websocket
ha_access_token: ""
ha_entity_domains:
  - light
  - switch
  - climate
  - scene
```

## Usage

### Accessing the UI

After installation, access Alexa Share through:

- **Sidebar**: Click "Alexa Share" in the Home Assistant sidebar
- **Add-on page**: Go to the add-on and click "Open Web UI"

### Selecting Entities

1. **Browse entities**: The main table shows all entities from your configured domains
2. **Search**: Use the search box to filter entities by name
3. **Filter by status**: Use the tabs to show All, Synced (selected), or Unsynced entities
4. **Toggle sync**: Click the toggle switch to select/deselect an entity for Alexa
5. **Sort**: Click column headers to sort by Name, Domain, or Area

### Publishing Changes

After selecting your entities:

1. Click the **Publish** button in the top right
2. Review the number of entities that will be synced
3. Click **Confirm** to save changes
4. The add-on writes the configuration to your Home Assistant `configuration.yaml`

### Reloading Alexa Integration

After publishing changes, you need to reload the Alexa integration:

1. Go to **Settings** > **Devices & Services**
2. Find the **Amazon Alexa** integration
3. Click the menu and select **Reload**
4. Wait for the integration to refresh

Alternatively, ask Alexa to "discover devices" to sync the changes.

## How It Works

Alexa Share modifies the `alexa` section in your Home Assistant `configuration.yaml` file. It uses entity filters to specify exactly which entities should be exposed to Alexa.

Example of the generated configuration:

```yaml
alexa:
  smart_home:
    filter:
      include_entities:
        - light.living_room
        - switch.bedroom_fan
        - climate.thermostat
```

## Troubleshooting

### Add-on won't start

- Check the add-on logs for error messages
- Ensure Home Assistant is version 2023.0.0 or later
- Verify the Supervisor is running properly

### Entities not showing

- Verify the entity domain is included in `ha_entity_domains` configuration
- Check that entities exist and are not disabled in Home Assistant
- Try clicking the **Reload Devices** button

### Changes not reflected in Alexa

1. Ensure you clicked **Publish** and confirmed the changes
2. Reload the Alexa integration in Home Assistant
3. Ask Alexa to "discover devices"
4. Wait a few minutes for changes to propagate

### WebSocket connection errors

- Ensure `ha_websocket_url` is correct (default works for most setups)
- If using a custom URL, ensure it's accessible from the add-on container
- Check Home Assistant core logs for WebSocket errors

### Permission errors

- The add-on needs write access to `/config` (Home Assistant configuration directory)
- Ensure the add-on has the required API permissions enabled

## Support

- **Issues**: [GitHub Issues](https://github.com/cfpinto/alexa_share/issues)
- **Source Code**: [GitHub Repository](https://github.com/cfpinto/alexa_share)

## License

This add-on is released under the [MIT License](LICENSE).
