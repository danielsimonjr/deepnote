import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { v4 as uuid } from 'uuid'

export interface KernelInfo {
  id: string
  status: 'starting' | 'idle' | 'busy' | 'error' | 'dead'
  executionCount: number
  createdAt: Date
}

export interface ExecutionResult {
  status: 'ok' | 'error'
  executionCount: number
  outputs: Array<{
    type: 'text' | 'error' | 'image' | 'html'
    content: string
  }>
}

export class KernelManager extends EventEmitter {
  private kernels: Map<string, KernelInstance> = new Map()

  async createKernel(): Promise<string> {
    const id = uuid()
    const kernel = new KernelInstance(id)

    kernel.on('status', (status) => {
      this.emit('kernelStatus', { kernelId: id, status })
    })

    kernel.on('output', (output) => {
      this.emit('kernelOutput', { kernelId: id, ...output })
    })

    this.kernels.set(id, kernel)
    await kernel.start()

    return id
  }

  async execute(kernelId: string, code: string, blockId: string): Promise<ExecutionResult> {
    const kernel = this.kernels.get(kernelId)
    if (!kernel) {
      throw new Error(`Kernel ${kernelId} not found`)
    }
    return kernel.execute(code, blockId)
  }

  async interrupt(kernelId: string): Promise<void> {
    const kernel = this.kernels.get(kernelId)
    if (!kernel) {
      throw new Error(`Kernel ${kernelId} not found`)
    }
    kernel.interrupt()
  }

  async restart(kernelId: string): Promise<void> {
    const kernel = this.kernels.get(kernelId)
    if (!kernel) {
      throw new Error(`Kernel ${kernelId} not found`)
    }
    await kernel.restart()
  }

  async shutdown(kernelId: string): Promise<void> {
    const kernel = this.kernels.get(kernelId)
    if (!kernel) return

    await kernel.shutdown()
    this.kernels.delete(kernelId)
  }

  async shutdownAll(): Promise<void> {
    const promises = Array.from(this.kernels.keys()).map((id) => this.shutdown(id))
    await Promise.all(promises)
  }

  getKernel(kernelId: string): KernelInfo | null {
    const kernel = this.kernels.get(kernelId)
    if (!kernel) return null
    return kernel.getInfo()
  }

  getActiveKernels(): KernelInfo[] {
    return Array.from(this.kernels.values()).map((k) => k.getInfo())
  }
}

class KernelInstance extends EventEmitter {
  private process: ChildProcess | null = null
  private status: KernelInfo['status'] = 'starting'
  private executionCount = 0
  private createdAt = new Date()
  private outputBuffer = ''
  private currentBlockId: string | null = null

  constructor(private id: string) {
    super()
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Start Python REPL process
      this.process = spawn('python', ['-u', '-i', '-q'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      })

      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleOutput(data.toString(), 'text')
      })

      this.process.stderr?.on('data', (data: Buffer) => {
        const text = data.toString()
        // Python REPL sends prompts to stderr, filter them
        if (!text.match(/^(>>>|\.\.\.) /)) {
          this.handleOutput(text, 'error')
        }
      })

      this.process.on('error', (err) => {
        this.setStatus('error')
        reject(err)
      })

      this.process.on('exit', () => {
        this.setStatus('dead')
      })

      // Give Python time to start
      setTimeout(() => {
        this.setStatus('idle')
        resolve()
      }, 500)
    })
  }

  private handleOutput(text: string, type: 'text' | 'error'): void {
    if (this.currentBlockId) {
      this.emit('output', {
        blockId: this.currentBlockId,
        type,
        content: text,
        executionCount: this.executionCount,
      })
    }
  }

  private setStatus(status: KernelInfo['status']): void {
    this.status = status
    this.emit('status', status)
  }

  async execute(code: string, blockId: string): Promise<ExecutionResult> {
    if (!this.process || this.status === 'dead') {
      throw new Error('Kernel is not running')
    }

    this.currentBlockId = blockId
    this.executionCount++
    this.setStatus('busy')

    return new Promise((resolve) => {
      const outputs: ExecutionResult['outputs'] = []
      const marker = `__EXEC_DONE_${this.executionCount}__`

      const onData = (data: Buffer) => {
        const text = data.toString()
        if (text.includes(marker)) {
          // Execution complete
          this.process?.stdout?.off('data', onData)
          this.setStatus('idle')
          this.currentBlockId = null

          const cleanOutput = text.replace(marker, '').trim()
          if (cleanOutput) {
            outputs.push({ type: 'text', content: cleanOutput })
          }

          resolve({
            status: 'ok',
            executionCount: this.executionCount,
            outputs,
          })
        } else {
          outputs.push({ type: 'text', content: text })
          this.emit('output', { blockId, type: 'text', content: text })
        }
      }

      const onError = (data: Buffer) => {
        const text = data.toString()
        if (!text.match(/^(>>>|\.\.\.) /)) {
          outputs.push({ type: 'error', content: text })
          this.emit('output', { blockId, type: 'error', content: text })
        }
      }

      this.process?.stdout?.on('data', onData)
      this.process?.stderr?.on('data', onError)

      // Send code to execute, followed by a marker print
      const fullCode = `${code}\nprint("${marker}")\n`
      this.process?.stdin?.write(fullCode)
    })
  }

  interrupt(): void {
    if (this.process) {
      // Send SIGINT to interrupt execution
      this.process.kill('SIGINT')
    }
  }

  async restart(): Promise<void> {
    await this.shutdown()
    await this.start()
  }

  async shutdown(): Promise<void> {
    if (this.process) {
      this.process.kill()
      this.process = null
    }
    this.setStatus('dead')
  }

  getInfo(): KernelInfo {
    return {
      id: this.id,
      status: this.status,
      executionCount: this.executionCount,
      createdAt: this.createdAt,
    }
  }
}
