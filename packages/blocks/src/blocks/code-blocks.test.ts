import { dedent } from 'ts-dedent'
import { describe, expect, it } from 'vitest'
import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'
import { type CodeBlock, createPythonCodeForCodeBlock, isCodeBlock } from './code-blocks'

describe('createPythonCodeForCodeBlock', () => {
  it('creates Python code with content and default DataFrame config', () => {
    const block: CodeBlock = {
      id: '123',
      type: 'code',
      content: 'print("Hello World")',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {},
    }

    const result = createPythonCodeForCodeBlock(block)

    expect(result).toEqual(dedent`
      if '_dntk' in globals():
        _dntk.dataframe_utils.configure_dataframe_formatter('{}')
      else:
        _deepnote_current_table_attrs = '{}'

      print("Hello World")
    `)
  })

  it('creates Python code with table state configuration', () => {
    const block: CodeBlock = {
      id: '123',
      type: 'code',
      content: 'df.head()',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_table_state: {
          pageSize: 10,
          pageIndex: 0,
          sortBy: [{ id: 'name', desc: false }],
        },
      },
    }

    const result = createPythonCodeForCodeBlock(block)

    expect(result).toContain('configure_dataframe_formatter')
    expect(result).toContain('"pageSize":10')
    expect(result).toContain('"pageIndex":0')
    expect(result).toContain('df.head()')
  })

  it('handles empty content', () => {
    const block: CodeBlock = {
      id: '123',
      type: 'code',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {},
    }

    const result = createPythonCodeForCodeBlock(block)

    expect(result).toContain("configure_dataframe_formatter('{}')")
  })

  it('handles multiline content', () => {
    const block: CodeBlock = {
      id: '123',
      type: 'code',
      content: 'import pandas as pd\n\ndf = pd.DataFrame()\nprint(df)',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {},
    }

    const result = createPythonCodeForCodeBlock(block)

    expect(result).toContain('import pandas as pd')
    expect(result).toContain('df = pd.DataFrame()')
    expect(result).toContain('print(df)')
  })

  it('handles content with special characters', () => {
    const block: CodeBlock = {
      id: '123',
      type: 'code',
      content: "text = 'It\\'s a \"test\"'",
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {},
    }

    const result = createPythonCodeForCodeBlock(block)

    expect(result).toContain("text = 'It\\'s a \"test\"'")
  })

  it('handles table state with filters and hidden columns', () => {
    const block: CodeBlock = {
      id: '123',
      type: 'code',
      content: 'df',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_table_state: {
          filters: [{ id: 'status', value: 'active' }],
          hiddenColumnIds: ['internal_id', 'created_at'],
        },
      },
    }

    const result = createPythonCodeForCodeBlock(block)

    expect(result).toContain('"filters"')
    expect(result).toContain('"hiddenColumnIds"')
  })
})

describe('isCodeBlock', () => {
  it('returns true for code blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'code',
      content: 'print("test")',
      sortingKey: 'a0',
    }

    expect(isCodeBlock(block)).toBe(true)
  })

  it('returns false for non-code blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'markdown',
      content: '# Heading',
      sortingKey: 'a0',
    }

    expect(isCodeBlock(block)).toBe(false)
  })

  it('returns false for sql blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT * FROM users',
      sortingKey: 'a0',
    }

    expect(isCodeBlock(block)).toBe(false)
  })
})
