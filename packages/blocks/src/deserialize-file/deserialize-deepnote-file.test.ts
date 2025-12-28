import { describe, expect, it, vi } from 'vitest'
import { deepnoteFileSchema } from './deepnote-file-schema'
import { DeepnoteFileParseError, deserializeDeepnoteFile } from './deserialize-deepnote-file'
import * as parseYamlModule from './parse-yaml'

vi.mock('./parse-yaml', async () => {
  const actual = await vi.importActual<typeof import('./parse-yaml')>('./parse-yaml')
  return {
    ...actual,
    parseYaml: vi.fn(),
  }
})

describe('deserializeDeepnoteFile', () => {
  const parseYaml = vi.mocked(parseYamlModule.parseYaml)

  it('successfully deserializes a valid Deepnote YAML file', () => {
    const yaml = `
      metadata:
        createdAt: '2025-01-01T00:00:00Z'
      version: '1'
      project:
        id: 'project-123'
        name: 'Test Project'
        notebooks: []
    `

    const validObject = {
      metadata: {
        createdAt: '2025-01-01T00:00:00Z',
      },
      version: '1',
      project: {
        id: 'project-123',
        name: 'Test Project',
        notebooks: [],
      },
    }

    parseYaml.mockReturnValue(validObject)

    const result = deserializeDeepnoteFile(yaml)
    expect(result).toEqual(validObject)
  })

  it('throws error if YAML parsing fails', () => {
    parseYaml.mockImplementation(() => {
      throw new Error('Failed to parse Deepnote file: invalid syntax')
    })

    expect(() => deserializeDeepnoteFile('bad: yaml')).toThrow(Error)
    expect(() => deserializeDeepnoteFile('bad: yaml')).toThrow(/Failed to parse Deepnote file/)
  })

  it('throws DeepnoteFileParseError if schema validation fails', () => {
    parseYaml.mockReturnValue({
      version: 1,
      blocks: [{}],
    })

    expect(() => deserializeDeepnoteFile('invalid schema')).toThrow(DeepnoteFileParseError)
    expect(() => deserializeDeepnoteFile('invalid schema')).toThrow(/Failed to parse the Deepnote file:/)
  })

  it('provides access to all validation issues', () => {
    const safeParseSpy = vi.spyOn(deepnoteFileSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: {
        issues: [
          { path: ['field1'], message: 'Error 1', code: 'custom' },
          { path: ['field2'], message: 'Error 2', code: 'custom' },
        ],
      },
    } as unknown as ReturnType<typeof deepnoteFileSchema.safeParse>)

    parseYaml.mockReturnValue({})

    try {
      deserializeDeepnoteFile('invalid')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(DeepnoteFileParseError)
      const parseError = error as DeepnoteFileParseError
      expect(parseError.issues).toHaveLength(2)
      expect(parseError.firstIssueMessage).toBe('field1: Error 1')
    }

    safeParseSpy.mockRestore()
  })

  it('formats multiple issues in error message', () => {
    const safeParseSpy = vi.spyOn(deepnoteFileSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: {
        issues: [
          { path: ['blocks', 0, 'type'], message: 'Required', code: 'custom' },
          { path: ['blocks', 1, 'id'], message: 'Invalid', code: 'custom' },
        ],
      },
    } as unknown as ReturnType<typeof deepnoteFileSchema.safeParse>)

    parseYaml.mockReturnValue({})

    try {
      deserializeDeepnoteFile('bad')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(DeepnoteFileParseError)
      const parseError = error as DeepnoteFileParseError
      expect(parseError.message).toContain('blocks.0.type')
      expect(parseError.message).toContain('blocks.1.id')
      expect(parseError.message).toContain('(block index: 0)')
      expect(parseError.message).toContain('(block index: 1)')
    }

    safeParseSpy.mockRestore()
  })

  it('truncates issues if there are more than MAX_ISSUES_TO_SHOW', () => {
    const issues = Array.from({ length: 10 }, (_, i) => ({
      path: [`field${i}`],
      message: `Error ${i}`,
      code: 'custom',
    }))

    const safeParseSpy = vi.spyOn(deepnoteFileSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: { issues },
    } as unknown as ReturnType<typeof deepnoteFileSchema.safeParse>)

    parseYaml.mockReturnValue({})

    try {
      deserializeDeepnoteFile('bad')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(DeepnoteFileParseError)
      const parseError = error as DeepnoteFileParseError
      expect(parseError.message).toContain('... and 5 more issue(s)')
    }

    safeParseSpy.mockRestore()
  })

  it('handles empty issues array gracefully', () => {
    const safeParseSpy = vi.spyOn(deepnoteFileSchema, 'safeParse').mockReturnValueOnce({
      success: false,
      error: { issues: [] },
    } as unknown as ReturnType<typeof deepnoteFileSchema.safeParse>)

    parseYaml.mockReturnValue({})

    try {
      deserializeDeepnoteFile('invalid')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(DeepnoteFileParseError)
      const parseError = error as DeepnoteFileParseError
      expect(parseError.firstIssueMessage).toBe('Invalid Deepnote file')
    }

    safeParseSpy.mockRestore()
  })
})

describe('DeepnoteFileParseError', () => {
  it('has correct name', () => {
    const error = new DeepnoteFileParseError([{ path: ['test'], message: 'Test error', code: 'custom' }] as never)
    expect(error.name).toBe('DeepnoteFileParseError')
  })

  it('includes notebook index in location hint', () => {
    const error = new DeepnoteFileParseError([
      { path: ['project', 'notebooks', 0, 'name'], message: 'Required', code: 'custom' },
    ] as never)
    expect(error.message).toContain('(notebook index: 0)')
  })

  it('includes block index in location hint', () => {
    const error = new DeepnoteFileParseError([
      { path: ['project', 'notebooks', 0, 'blocks', 2, 'type'], message: 'Invalid', code: 'custom' },
    ] as never)
    expect(error.message).toContain('(block index: 2)')
  })

  it('shows (root) for empty path', () => {
    const error = new DeepnoteFileParseError([{ path: [], message: 'Invalid root', code: 'custom' }] as never)
    expect(error.message).toContain('[(root)]')
  })
})
