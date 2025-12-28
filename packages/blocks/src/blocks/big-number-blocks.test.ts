import { describe, expect, it } from 'vitest'
import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'
import { type BigNumberBlock, createPythonCodeForBigNumberBlock, isBigNumberBlock } from './big-number-blocks'

describe('createPythonCodeForBigNumberBlock', () => {
  it('creates Python code with title and value', () => {
    const block: BigNumberBlock = {
      id: '123',
      type: 'big-number',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_big_number_title: 'Total Sales',
        deepnote_big_number_value: 'total_sales',
      },
    }

    const result = createPythonCodeForBigNumberBlock(block)

    expect(result).toContain('__deepnote_big_number__')
    expect(result).toContain("'Total Sales'")
    expect(result).toContain('f"{total_sales}"')
    expect(result).toContain('import json')
    expect(result).toContain('import jinja2')
  })

  it('creates Python code with comparison values', () => {
    const block: BigNumberBlock = {
      id: '123',
      type: 'big-number',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_big_number_title: 'Revenue',
        deepnote_big_number_value: 'revenue',
        deepnote_big_number_comparison_title: 'vs Last Month',
        deepnote_big_number_comparison_value: 'revenue_change',
      },
    }

    const result = createPythonCodeForBigNumberBlock(block)

    expect(result).toContain('comparisonTitle')
    expect(result).toContain('comparisonValue')
    expect(result).toContain('f"{revenue_change}"')
  })

  it('handles empty title and value', () => {
    const block: BigNumberBlock = {
      id: '123',
      type: 'big-number',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {},
    }

    const result = createPythonCodeForBigNumberBlock(block)

    expect(result).toContain('__deepnote_big_number__')
    expect(result).toContain("''") // Empty string for missing title
    // Note: empty value gets sanitized to 'input_1' fallback by sanitizePythonVariableName
    expect(result).toContain('f"{input_1}"')
  })

  it('handles Jinja2 template in title', () => {
    const block: BigNumberBlock = {
      id: '123',
      type: 'big-number',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_big_number_title: 'Sales for {{ year }}',
        deepnote_big_number_value: 'total_sales',
      },
    }

    const result = createPythonCodeForBigNumberBlock(block)

    expect(result).toContain('render_template')
    expect(result).toContain('{{ year }}')
  })

  it('sanitizes variable names by removing invalid chars', () => {
    const block: BigNumberBlock = {
      id: '123',
      type: 'big-number',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_big_number_title: 'Total',
        deepnote_big_number_value: 'my-value-name',
      },
    }

    const result = createPythonCodeForBigNumberBlock(block)

    // Note: sanitizePythonVariableName removes invalid chars (hyphens), not replaces them
    expect(result).toContain('myvaluename')
  })

  it('handles special characters in title', () => {
    const block: BigNumberBlock = {
      id: '123',
      type: 'big-number',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_big_number_title: 'It\'s a "test"',
        deepnote_big_number_value: 'value',
      },
    }

    const result = createPythonCodeForBigNumberBlock(block)

    expect(result).toContain("'It\\'s a \"test\"'")
  })
})

describe('isBigNumberBlock', () => {
  it('returns true for big-number blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'big-number',
      sortingKey: 'a0',
    }

    expect(isBigNumberBlock(block)).toBe(true)
  })

  it('returns false for code blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'code',
      content: 'print("test")',
      sortingKey: 'a0',
    }

    expect(isBigNumberBlock(block)).toBe(false)
  })

  it('returns false for visualization blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'visualization',
      sortingKey: 'a0',
    }

    expect(isBigNumberBlock(block)).toBe(false)
  })
})
