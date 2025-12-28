import { describe, expect, it } from 'vitest'
import {
  asBlockId,
  asIntegrationId,
  asNotebookId,
  asProjectId,
  type BlockId,
  type IntegrationId,
  isValidId,
  type NotebookId,
  type ProjectId,
} from './branded-ids'

describe('branded ID helpers', () => {
  describe('asBlockId', () => {
    it('creates a BlockId from a string', () => {
      const id = asBlockId('block-123')
      expect(id).toBe('block-123')
      // Type check: this should compile
      const blockId: BlockId = id
      expect(blockId).toBe('block-123')
    })
  })

  describe('asNotebookId', () => {
    it('creates a NotebookId from a string', () => {
      const id = asNotebookId('notebook-456')
      expect(id).toBe('notebook-456')
      const notebookId: NotebookId = id
      expect(notebookId).toBe('notebook-456')
    })
  })

  describe('asProjectId', () => {
    it('creates a ProjectId from a string', () => {
      const id = asProjectId('project-789')
      expect(id).toBe('project-789')
      const projectId: ProjectId = id
      expect(projectId).toBe('project-789')
    })
  })

  describe('asIntegrationId', () => {
    it('creates an IntegrationId from a string', () => {
      const id = asIntegrationId('integration-abc')
      expect(id).toBe('integration-abc')
      const integrationId: IntegrationId = id
      expect(integrationId).toBe('integration-abc')
    })
  })
})

describe('isValidId', () => {
  it('returns true for non-empty strings', () => {
    expect(isValidId('abc')).toBe(true)
    expect(isValidId('block-123')).toBe(true)
    expect(isValidId('a')).toBe(true)
  })

  it('returns false for empty strings', () => {
    expect(isValidId('')).toBe(false)
  })

  it('returns false for non-string values', () => {
    expect(isValidId(null)).toBe(false)
    expect(isValidId(undefined)).toBe(false)
    expect(isValidId(123)).toBe(false)
    expect(isValidId({})).toBe(false)
    expect(isValidId([])).toBe(false)
  })
})

// Type-level tests: These verify that the branded types work correctly at compile time
// If these compile, the branded types are working
describe('type safety (compile-time checks)', () => {
  it('branded types are assignable from helper functions', () => {
    // These lines verify that the helper functions return the correct branded types
    const blockId: BlockId = asBlockId('test')
    const notebookId: NotebookId = asNotebookId('test')
    const projectId: ProjectId = asProjectId('test')
    const integrationId: IntegrationId = asIntegrationId('test')

    // All should be strings at runtime
    expect(typeof blockId).toBe('string')
    expect(typeof notebookId).toBe('string')
    expect(typeof projectId).toBe('string')
    expect(typeof integrationId).toBe('string')
  })

  it('branded IDs can be used as strings', () => {
    const blockId = asBlockId('block-123')

    // Branded IDs should work with string methods
    expect(blockId.startsWith('block-')).toBe(true)
    expect(blockId.length).toBe(9)
    expect(blockId.toUpperCase()).toBe('BLOCK-123')
  })
})
