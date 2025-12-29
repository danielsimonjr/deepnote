import { Router } from 'express'
import { KernelManager } from '../kernel/kernel-manager.js'
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { parse, stringify } from 'yaml'

export function createApiRouter(kernelManager: KernelManager): Router {
  const router = Router()
  const workspacePath = process.env.WORKSPACE_PATH || './workspace'

  // Ensure workspace exists
  if (!existsSync(workspacePath)) {
    mkdirSync(workspacePath, { recursive: true })
  }

  // Kernel endpoints
  router.post('/kernels', async (_req, res) => {
    try {
      const kernelId = await kernelManager.createKernel()
      res.json({ kernelId })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create kernel' })
    }
  })

  router.get('/kernels', (_req, res) => {
    const kernels = kernelManager.getActiveKernels()
    res.json({ kernels })
  })

  router.get('/kernels/:id', (req, res) => {
    const kernel = kernelManager.getKernel(req.params.id)
    if (!kernel) {
      return res.status(404).json({ error: 'Kernel not found' })
    }
    res.json(kernel)
  })

  router.delete('/kernels/:id', async (req, res) => {
    try {
      await kernelManager.shutdown(req.params.id)
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to shutdown kernel' })
    }
  })

  router.post('/kernels/:id/interrupt', async (req, res) => {
    try {
      await kernelManager.interrupt(req.params.id)
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to interrupt kernel' })
    }
  })

  router.post('/kernels/:id/restart', async (req, res) => {
    try {
      await kernelManager.restart(req.params.id)
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to restart kernel' })
    }
  })

  // File endpoints
  router.get('/files', (_req, res) => {
    try {
      const files = listFiles(workspacePath)
      res.json({ files })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list files' })
    }
  })

  router.get('/files/*', (req, res) => {
    try {
      const filePath = join(workspacePath, req.params[0])
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' })
      }
      const content = readFileSync(filePath, 'utf-8')

      if (filePath.endsWith('.deepnote')) {
        const parsed = parse(content)
        res.json({ content: parsed, raw: content })
      } else {
        res.json({ content })
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to read file' })
    }
  })

  router.put('/files/*', (req, res) => {
    try {
      const filePath = join(workspacePath, req.params[0])
      const { content } = req.body

      // Ensure directory exists
      const dir = join(filePath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      if (filePath.endsWith('.deepnote') && typeof content === 'object') {
        writeFileSync(filePath, stringify(content))
      } else {
        writeFileSync(filePath, content)
      }

      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to write file' })
    }
  })

  router.delete('/files/*', (req, res) => {
    try {
      const filePath = join(workspacePath, req.params[0])
      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' })
      }
      const { unlinkSync } = require('fs')
      unlinkSync(filePath)
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete file' })
    }
  })

  return router
}

function listFiles(dir: string, base = ''): Array<{ name: string; path: string; type: 'file' | 'directory' }> {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: Array<{ name: string; path: string; type: 'file' | 'directory' }> = []

  for (const entry of entries) {
    const path = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push({ name: entry.name, path, type: 'directory' })
      files.push(...listFiles(join(dir, entry.name), path))
    } else {
      files.push({ name: entry.name, path, type: 'file' })
    }
  }

  return files
}
