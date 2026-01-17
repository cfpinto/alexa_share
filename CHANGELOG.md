# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-01-17

### Added
- Split search component with hierarchical dropdown filters
- Filter entities by Domain (light, switch, sensor, etc.)
- Filter entities by Area (Living Room, Kitchen, etc.)
- Filter entities by Manufacturer (Philips, Ecobee, etc.)
- Combined filtering: use dropdowns and text search together

### Changed
- Sync toggle now displays blue color when active
- Updated @material-tailwind/react to 2.1.10

## [1.0.1] - 2025-01-16

### Added
- Initial public release
- Web UI for selecting Home Assistant entities to expose to Amazon Alexa
- Support for multiple entity domains: lights, switches, sensors, binary sensors, climate, scenes, buttons, and automations
- Search functionality to filter entities by name
- Tab-based filtering by sync status (All, Synced, Unsynced)
- Pagination for large entity lists
- Sortable columns (Name, Domain, Area)
- Publish changes dialog with confirmation
- Home Assistant ingress support for seamless integration
- Multi-architecture support (amd64, aarch64)
- Responsive design for mobile and desktop
