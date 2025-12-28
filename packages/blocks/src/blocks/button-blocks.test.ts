import { describe, expect, it } from 'vitest'
import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'
import {
  type ButtonBlock,
  ButtonBlockError,
  type ButtonExecutionContext,
  createPythonCodeForButtonBlock,
  isButtonBlock,
} from './button-blocks'

describe('createPythonCodeForButtonBlock', () => {
  describe('set_variable behavior', () => {
    it('sets variable to False when not in execution context', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_behavior: 'set_variable',
          deepnote_variable_name: 'my_button',
        },
      }

      const result = createPythonCodeForButtonBlock(block)

      expect(result).toBe('my_button = False')
    })

    it('sets variable to True when in execution context', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_behavior: 'set_variable',
          deepnote_variable_name: 'my_button',
        },
      }

      const context: ButtonExecutionContext = {
        variableContext: ['my_button'],
      }

      const result = createPythonCodeForButtonBlock(block, context)

      expect(result).toBe('my_button = True')
    })

    it('sets variable to False when different variable in context', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_behavior: 'set_variable',
          deepnote_variable_name: 'button_a',
        },
      }

      const context: ButtonExecutionContext = {
        variableContext: ['button_b', 'button_c'],
      }

      const result = createPythonCodeForButtonBlock(block, context)

      expect(result).toBe('button_a = False')
    })

    it('throws error when set_variable behavior has no variable name', () => {
      const block: ButtonBlock = {
        id: 'test-button-id',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_behavior: 'set_variable',
        },
      }

      expect(() => createPythonCodeForButtonBlock(block)).toThrow(ButtonBlockError)
      expect(() => createPythonCodeForButtonBlock(block)).toThrow('test-button-id')
      expect(() => createPythonCodeForButtonBlock(block)).toThrow('deepnote_variable_name')
    })

    it('sanitizes invalid Python variable names by removing invalid chars', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_behavior: 'set_variable',
          deepnote_variable_name: 'my-button-name',
        },
      }

      const result = createPythonCodeForButtonBlock(block)

      // Note: sanitizePythonVariableName removes invalid chars (hyphens), not replaces them
      expect(result).toBe('mybuttonname = False')
    })
  })

  describe('run behavior', () => {
    it('returns empty string for run behavior', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_behavior: 'run',
        },
      }

      const result = createPythonCodeForButtonBlock(block)

      expect(result).toBe('')
    })

    it('returns empty string for run behavior even with variable name', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_behavior: 'run',
          deepnote_variable_name: 'ignored_variable',
        },
      }

      const result = createPythonCodeForButtonBlock(block)

      expect(result).toBe('')
    })
  })

  describe('legacy behavior (no behavior field)', () => {
    it('returns empty string for legacy button blocks', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {},
      }

      const result = createPythonCodeForButtonBlock(block)

      expect(result).toBe('')
    })

    it('returns empty string for legacy blocks with title only', () => {
      const block: ButtonBlock = {
        id: '123',
        type: 'button',
        content: '',
        blockGroup: 'abc',
        sortingKey: 'a0',
        metadata: {
          deepnote_button_title: 'Click Me',
          deepnote_button_color_scheme: 'blue',
        },
      }

      const result = createPythonCodeForButtonBlock(block)

      expect(result).toBe('')
    })
  })
})

describe('isButtonBlock', () => {
  it('returns true for button blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'button',
      sortingKey: 'a0',
    }

    expect(isButtonBlock(block)).toBe(true)
  })

  it('returns false for code blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'code',
      content: 'print("test")',
      sortingKey: 'a0',
    }

    expect(isButtonBlock(block)).toBe(false)
  })

  it('returns false for input blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'input-text',
      sortingKey: 'a0',
    }

    expect(isButtonBlock(block)).toBe(false)
  })
})
