import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createApiRouter } from './api/router.js'
import { KernelManager } from './kernel/kernel-manager.js'
import { setupWebSocket } from './kernel/websocket.js'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000

const app = express()
const server = createServer(app)

// Middleware
app.use(cors())
app.use(express.json())

// Initialize kernel manager
const kernelManager = new KernelManager()

// API routes
app.use('/api', createApiRouter(kernelManager))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', kernels: kernelManager.getActiveKernels().length })
})

// WebSocket server for kernel communication
const wss = new WebSocketServer({ server, path: '/ws' })
setupWebSocket(wss, kernelManager)

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Deepnote Local server running at http://localhost:${PORT}`)
  console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  await kernelManager.shutdownAll()
  server.close()
  process.exit(0)
})
