import { WebSocketServer, WebSocket } from 'ws'
import { KernelManager } from './kernel-manager.js'

interface WSMessage {
  type: string
  kernelId?: string
  blockId?: string
  code?: string
  [key: string]: unknown
}

export function setupWebSocket(wss: WebSocketServer, kernelManager: KernelManager): void {
  const clients = new Map<WebSocket, { kernelId?: string }>()

  // Forward kernel events to WebSocket clients
  kernelManager.on('kernelStatus', ({ kernelId, status }) => {
    broadcast({ type: 'kernel_status', kernelId, status })
  })

  kernelManager.on('kernelOutput', ({ kernelId, blockId, type, content, executionCount }) => {
    broadcast({ type: 'execution_output', kernelId, blockId, outputType: type, content, executionCount })
  })

  function broadcast(message: object): void {
    const data = JSON.stringify(message)
    for (const [client] of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }

  function sendTo(ws: WebSocket, message: object): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected')
    clients.set(ws, {})

    ws.on('message', async (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString())
        await handleMessage(ws, message)
      } catch (error) {
        sendTo(ws, {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    ws.on('close', () => {
      console.log('WebSocket client disconnected')
      clients.delete(ws)
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })

  async function handleMessage(ws: WebSocket, message: WSMessage): Promise<void> {
    switch (message.type) {
      case 'create_kernel': {
        const kernelId = await kernelManager.createKernel()
        const clientData = clients.get(ws)
        if (clientData) {
          clientData.kernelId = kernelId
        }
        sendTo(ws, { type: 'kernel_created', kernelId })
        break
      }

      case 'execute': {
        const { kernelId, blockId, code } = message
        if (!kernelId || !blockId || !code) {
          throw new Error('Missing kernelId, blockId, or code')
        }

        sendTo(ws, { type: 'execution_started', kernelId, blockId })

        try {
          const result = await kernelManager.execute(kernelId, code, blockId)
          sendTo(ws, {
            type: 'execution_complete',
            kernelId,
            blockId,
            result,
          })
        } catch (error) {
          sendTo(ws, {
            type: 'execution_error',
            kernelId,
            blockId,
            error: error instanceof Error ? error.message : 'Execution failed',
          })
        }
        break
      }

      case 'interrupt': {
        const { kernelId } = message
        if (!kernelId) throw new Error('Missing kernelId')
        await kernelManager.interrupt(kernelId)
        sendTo(ws, { type: 'kernel_interrupted', kernelId })
        break
      }

      case 'restart': {
        const { kernelId } = message
        if (!kernelId) throw new Error('Missing kernelId')
        await kernelManager.restart(kernelId)
        sendTo(ws, { type: 'kernel_restarted', kernelId })
        break
      }

      case 'shutdown': {
        const { kernelId } = message
        if (!kernelId) throw new Error('Missing kernelId')
        await kernelManager.shutdown(kernelId)
        sendTo(ws, { type: 'kernel_shutdown', kernelId })
        break
      }

      case 'get_status': {
        const kernels = kernelManager.getActiveKernels()
        sendTo(ws, { type: 'status', kernels })
        break
      }

      default:
        sendTo(ws, { type: 'error', message: `Unknown message type: ${message.type}` })
    }
  }
}
