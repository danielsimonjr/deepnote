import { describe, expect, it } from 'vitest'
import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'
import {
  createPythonCodeForVisualizationBlock,
  isVisualizationBlock,
  type VisualizationBlock,
  VisualizationBlockError,
} from './visualization-blocks'

describe('createPythonCodeForVisualizationBlock', () => {
  it('creates Python code with variable name and spec', () => {
    const block: VisualizationBlock = {
      id: '123',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
        deepnote_visualization_spec: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          mark: 'bar',
          encoding: {
            x: { field: 'category' },
            y: { field: 'value' },
          },
        },
      },
    }

    const result = createPythonCodeForVisualizationBlock(block)

    expect(result).toContain('_dntk.DeepnoteChart')
    expect(result).toContain('df')
    expect(result).toContain('vega.github.io')
  })

  it('includes filters in the output', () => {
    const block: VisualizationBlock = {
      id: '123',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
        deepnote_visualization_spec: { mark: 'point' },
        deepnote_chart_filter: {
          advancedFilters: [{ field: 'status', value: 'active' }],
        },
      },
    }

    const result = createPythonCodeForVisualizationBlock(block)

    expect(result).toContain('filters=')
    expect(result).toContain('status')
  })

  it('handles empty filters', () => {
    const block: VisualizationBlock = {
      id: '123',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
        deepnote_visualization_spec: { mark: 'bar' },
        deepnote_chart_filter: {},
      },
    }

    const result = createPythonCodeForVisualizationBlock(block)

    expect(result).toContain('filters=')
    expect(result).toContain('[]')
  })

  it('throws error when variable name is missing', () => {
    const block: VisualizationBlock = {
      id: 'test-viz-id',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_visualization_spec: { mark: 'bar' },
      },
    }

    expect(() => createPythonCodeForVisualizationBlock(block)).toThrow(VisualizationBlockError)
    expect(() => createPythonCodeForVisualizationBlock(block)).toThrow('test-viz-id')
    expect(() => createPythonCodeForVisualizationBlock(block)).toThrow('deepnote_variable_name')
  })

  it('throws error when visualization spec is missing', () => {
    const block: VisualizationBlock = {
      id: 'test-viz-id',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'df',
      },
    }

    expect(() => createPythonCodeForVisualizationBlock(block)).toThrow(VisualizationBlockError)
    expect(() => createPythonCodeForVisualizationBlock(block)).toThrow('deepnote_visualization_spec')
  })

  it('throws error when both variable name and spec are missing', () => {
    const block: VisualizationBlock = {
      id: 'test-viz-id',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(() => createPythonCodeForVisualizationBlock(block)).toThrow(VisualizationBlockError)
    expect(() => createPythonCodeForVisualizationBlock(block)).toThrow('deepnote_variable_name')
  })

  it('sanitizes invalid Python variable names by removing invalid chars', () => {
    const block: VisualizationBlock = {
      id: '123',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'my-data-frame',
        deepnote_visualization_spec: { mark: 'bar' },
      },
    }

    const result = createPythonCodeForVisualizationBlock(block)

    // Note: sanitizePythonVariableName removes invalid chars (hyphens), not replaces them
    expect(result).toContain('mydataframe')
  })

  it('handles complex visualization spec', () => {
    const block: VisualizationBlock = {
      id: '123',
      type: 'visualization',
      content: '',
      blockGroup: 'abc',
      sortingKey: 'a0',
      metadata: {
        deepnote_variable_name: 'sales_df',
        deepnote_visualization_spec: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          title: 'Sales by Region',
          mark: { type: 'bar', color: '#4c78a8' },
          encoding: {
            x: { field: 'region', type: 'nominal', title: 'Region' },
            y: { field: 'sales', type: 'quantitative', title: 'Total Sales' },
          },
          width: 400,
          height: 300,
        },
      },
    }

    const result = createPythonCodeForVisualizationBlock(block)

    expect(result).toContain('_dntk.DeepnoteChart(sales_df')
    expect(result).toContain('Sales by Region')
  })
})

describe('isVisualizationBlock', () => {
  it('returns true for visualization blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'visualization',
      sortingKey: 'a0',
    }

    expect(isVisualizationBlock(block)).toBe(true)
  })

  it('returns false for code blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'code',
      content: 'print("test")',
      sortingKey: 'a0',
    }

    expect(isVisualizationBlock(block)).toBe(false)
  })

  it('returns false for big-number blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'big-number',
      sortingKey: 'a0',
    }

    expect(isVisualizationBlock(block)).toBe(false)
  })
})
