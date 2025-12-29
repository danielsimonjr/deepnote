import { useCallback, useEffect, useRef } from 'react'
import { useKernelStore } from '../stores/kernel-store'
import { useNotebookStore } from '../stores/notebook-store'

interface WSMessage {
  type: string
  kernelId?: string
  blockId?: string
  status?: string
  result?: {
    status: string
    executionCount: number
    outputs: Array<{ type: string; content: string }>
  }
  content?: string
  outputType?: string
  error?: string
}

export function useKernel() {
  const ws = useRef<WebSocket | null>(null)
  const kernelId = useRef<string | null>(null)
  const { setStatus, setError, setCurrentExecution } = useKernelStore()
  const { setBlockExecuting, setBlockOutput } = useNotebookStore()

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws`

    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      // Create a kernel on connection
      send({ type: 'create_kernel' })
    }

    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
      setStatus('disconnected')
      // Attempt reconnect after delay
      setTimeout(connect, 3000)
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('WebSocket connection failed')
    }

    ws.current.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)
        handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
  }, [setStatus, setError])

  const handleMessage = useCallback(
    (message: WSMessage) => {
      switch (message.type) {
        case 'kernel_created':
          kernelId.current = message.kernelId ?? null
          setStatus('idle')
          break

        case 'kernel_status':
          setStatus(message.status as 'idle' | 'busy' | 'error')
          break

        case 'execution_started':
          if (message.blockId) {
            setBlockExecuting(message.kernelId ?? '', message.blockId, true)
          }
          setStatus('busy')
          break

        case 'execution_output':
          // Real-time output streaming
          if (message.blockId && message.content) {
            console.log(`Output [${message.blockId}]:`, message.content)
          }
          break

        case 'execution_complete':
          if (message.blockId && message.result) {
            const outputs = message.result.outputs.map((o) => ({
              type: o.type as 'text' | 'error' | 'image' | 'html',
              content: o.content,
              executionCount: message.result?.executionCount,
            }))
            // Get the notebook ID from somewhere - for now we'll need to track it
            const notebook = useNotebookStore.getState().getActiveNotebook()
            if (notebook) {
              setBlockOutput(notebook.id, message.blockId, outputs)
            }
          }
          setStatus('idle')
          setCurrentExecution(null)
          break

        case 'execution_error':
          setError(message.error ?? 'Execution failed')
          setStatus('idle')
          setCurrentExecution(null)
          break

        case 'kernel_interrupted':
        case 'kernel_restarted':
          setStatus('idle')
          break

        case 'error':
          setError(message.error ?? 'Unknown error')
          break
      }
    },
    [setStatus, setError, setBlockExecuting, setBlockOutput, setCurrentExecution]
  )

  const send = useCallback((message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }, [])

  const execute = useCallback(
    (code: string, blockId: string) => {
      if (!kernelId.current) {
        setError('No kernel available')
        return
      }

      send({
        type: 'execute',
        kernelId: kernelId.current,
        blockId,
        code,
      })
    },
    [send, setError]
  )

  const interrupt = useCallback(() => {
    if (!kernelId.current) return
    send({ type: 'interrupt', kernelId: kernelId.current })
  }, [send])

  const restart = useCallback(() => {
    if (!kernelId.current) return
    send({ type: 'restart', kernelId: kernelId.current })
  }, [send])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    return () => {
      ws.current?.close()
    }
  }, [connect])

  return {
    execute,
    interrupt,
    restart,
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  }
}
