# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

#### New Packages

- **@deepnote/web** - React + Vite frontend for localhost Deepnote
  - Notebook editor with drag-drop block reordering
  - 13 block types: Code, SQL, Text, Image, Big Number, Table, Text Input, Number Input, Checkbox, Select, Slider, Date Input, Button
  - Monaco Editor integration for code/SQL editing
  - Dark/light theme toggle with persistent settings
  - Zustand state management for notebooks, kernel, and UI
  - TailwindCSS styling

- **@deepnote/server** - Express backend with Python kernel support
  - Python kernel management (start/stop/restart/interrupt)
  - Code execution with real-time output streaming
  - WebSocket server for frontend communication
  - REST API for file operations
  - Support for .deepnote file format (YAML)

#### Root Package Updates

- Added `pnpm dev` script to run both web and server concurrently
- Added `pnpm dev:web` and `pnpm dev:server` for individual package development
- Created `pnpm-workspace.yaml` for monorepo package management

### Technical Details

- Frontend runs on http://localhost:3000
- Backend runs on http://localhost:8000
- WebSocket connection at ws://localhost:8000/ws
- Requires Python 3.8+ for kernel execution
