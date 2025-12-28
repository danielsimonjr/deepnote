import { describe, expect, it } from 'vitest'
import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'
import { createPythonCodeForSqlBlock, isSqlBlock, type SqlBlock } from './sql-blocks'

describe('createPythonCodeForSqlBlock', () => {
  it('creates Python code with variable assignment', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT * FROM users',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df_users',
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain('df_users = _dntk.execute_sql(')
    expect(result).toContain("'SELECT * FROM users'")
    expect(result).toContain("return_variable_type='dataframe'")
    expect(result).toContain('df_users')
  })

  it('creates Python code without variable assignment', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT * FROM users',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {},
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain('_dntk.execute_sql(')
    expect(result).not.toContain('= _dntk.execute_sql')
  })

  it('uses custom integration ID for connection', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT * FROM users',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
        sql_integration_id: 'my-postgres-connection',
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain('MY_POSTGRES_CONNECTION')
  })

  it('uses default connection env var when no integration ID', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT 1',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'result',
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain('SQL_ALCHEMY_JSON_ENV_VAR')
  })

  it('uses query_preview return type when specified', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT * FROM large_table',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'preview',
        deepnote_return_variable_type: 'query_preview',
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain("return_variable_type='query_preview'")
  })

  it('escapes special characters in SQL query', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: "SELECT * FROM users WHERE name = 'O\\'Brien'",
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain("'SELECT * FROM users WHERE name = \\'O\\\\\\'Brien\\''")
  })

  it('includes DataFrame config', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT * FROM users',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
        deepnote_table_state: {
          pageSize: 50,
        },
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain('configure_dataframe_formatter')
    expect(result).toContain('"pageSize":50')
  })

  it('sanitizes variable name by removing invalid characters', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT * FROM users',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my-variable-name',
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    // Note: sanitizePythonVariableName removes invalid chars (hyphens), not replaces them
    expect(result).toContain('myvariablename')
  })

  it('handles multiline SQL queries', () => {
    const block: SqlBlock = {
      id: '123',
      type: 'sql',
      content: `SELECT
  id,
  name,
  email
FROM users
WHERE active = true`,
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
      },
    }

    const result = createPythonCodeForSqlBlock(block)

    expect(result).toContain('SELECT')
    expect(result).toContain('FROM users')
  })
})

describe('isSqlBlock', () => {
  it('returns true for sql blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'sql',
      content: 'SELECT 1',
      sortingKey: 'a0',
    }

    expect(isSqlBlock(block)).toBe(true)
  })

  it('returns false for code blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'code',
      content: 'print("test")',
      sortingKey: 'a0',
    }

    expect(isSqlBlock(block)).toBe(false)
  })

  it('returns false for markdown blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'markdown',
      content: '# Heading',
      sortingKey: 'a0',
    }

    expect(isSqlBlock(block)).toBe(false)
  })
})
