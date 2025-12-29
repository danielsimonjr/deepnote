# @deepnote/server

Backend server for Deepnote Local with Python kernel management.

## Features

- **Kernel Management**: Start, stop, restart Python kernels
- **Code Execution**: Execute Python code and stream output
- **File API**: Read/write .deepnote notebook files
- **WebSocket**: Real-time communication with frontend

## Getting Started

```bash
# From the repository root
pnpm install
pnpm dev:server
```

Server runs at http://localhost:8000

## Requirements

- Node.js 22+
- Python 3.8+ (for kernel execution)

## API Endpoints

### Kernels

- `POST /api/kernels` - Create new kernel
- `GET /api/kernels` - List active kernels
- `GET /api/kernels/:id` - Get kernel status
- `DELETE /api/kernels/:id` - Shutdown kernel
- `POST /api/kernels/:id/interrupt` - Interrupt execution
- `POST /api/kernels/:id/restart` - Restart kernel

### Files

- `GET /api/files` - List workspace files
- `GET /api/files/*` - Read file content
- `PUT /api/files/*` - Write file content
- `DELETE /api/files/*` - Delete file

## WebSocket Protocol

Connect to `ws://localhost:8000/ws`

### Messages

**Create Kernel:**
```json
{ "type": "create_kernel" }
```

**Execute Code:**
```json
{
  "type": "execute",
  "kernelId": "...",
  "blockId": "...",
  "code": "print('Hello')"
}
```

**Interrupt:**
```json
{ "type": "interrupt", "kernelId": "..." }
```

**Restart:**
```json
{ "type": "restart", "kernelId": "..." }
```

## Architecture

```
src/
  api/
    router.ts        # REST API routes
  kernel/
    kernel-manager.ts  # Kernel lifecycle
    websocket.ts       # WebSocket handler
  files/
    (file operations)
  index.ts           # Server entry point
```

## Tech Stack

- Express.js
- WebSocket (ws)
- Python subprocess for kernel
