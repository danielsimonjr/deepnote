import { UnsupportedBlockTypeError } from './blocks'
import { createPythonCodeForBigNumberBlock, isBigNumberBlock } from './blocks/big-number-blocks'
import { type ButtonExecutionContext, createPythonCodeForButtonBlock, isButtonBlock } from './blocks/button-blocks'
import { createPythonCodeForCodeBlock, isCodeBlock } from './blocks/code-blocks'
import {
  createPythonCodeForInputCheckboxBlock,
  createPythonCodeForInputDateBlock,
  createPythonCodeForInputDateRangeBlock,
  createPythonCodeForInputFileBlock,
  createPythonCodeForInputSelectBlock,
  createPythonCodeForInputSliderBlock,
  createPythonCodeForInputTextareaBlock,
  createPythonCodeForInputTextBlock,
  isInputCheckboxBlock,
  isInputDateBlock,
  isInputDateRangeBlock,
  isInputFileBlock,
  isInputSelectBlock,
  isInputSliderBlock,
  isInputTextareaBlock,
  isInputTextBlock,
} from './blocks/input-blocks'
import { createPythonCodeForSqlBlock, isSqlBlock } from './blocks/sql-blocks'
import { createPythonCodeForVisualizationBlock, isVisualizationBlock } from './blocks/visualization-blocks'
import type { DeepnoteBlock } from './deserialize-file/deepnote-file-schema'

/**
 * Converts a Deepnote block to executable Python code.
 *
 * This function handles various block types including:
 * - Code blocks (returns content directly)
 * - SQL blocks (generates DataFrame query code)
 * - Input blocks (text, textarea, checkbox, select, slider, file, date, date-range)
 * - Visualization blocks
 * - Button blocks (with execution context)
 * - Big number blocks
 *
 * @param block - The Deepnote block to convert
 * @param executionContext - Optional context for button blocks, containing information
 *                          about the action to execute (set_variable, run_sql, etc.)
 * @returns The generated Python code as a string
 * @throws {UnsupportedBlockTypeError} If the block type is not supported
 * @throws {VisualizationBlockError} If a visualization block is missing required fields
 * @throws {ButtonBlockError} If a button block has invalid configuration
 *
 * @example
 * // Code block
 * const code = createPythonCode({
 *   type: 'code',
 *   content: 'print("Hello")',
 *   id: 'block-1',
 *   sortingKey: 'a0'
 * })
 * // Returns: 'print("Hello")'
 *
 * @example
 * // Input text block
 * const code = createPythonCode({
 *   type: 'input-text',
 *   content: '',
 *   id: 'block-1',
 *   sortingKey: 'a0',
 *   metadata: {
 *     deepnote_variable_name: 'my_var',
 *     deepnote_variable_value: 'Hello World'
 *   }
 * })
 * // Returns: "my_var = 'Hello World'"
 */
export function createPythonCode(block: DeepnoteBlock, executionContext?: ButtonExecutionContext): string {
  if (isCodeBlock(block)) {
    return createPythonCodeForCodeBlock(block)
  }

  if (isSqlBlock(block)) {
    return createPythonCodeForSqlBlock(block)
  }

  if (isInputTextBlock(block)) {
    return createPythonCodeForInputTextBlock(block)
  }

  if (isInputTextareaBlock(block)) {
    return createPythonCodeForInputTextareaBlock(block)
  }

  if (isInputCheckboxBlock(block)) {
    return createPythonCodeForInputCheckboxBlock(block)
  }

  if (isInputSelectBlock(block)) {
    return createPythonCodeForInputSelectBlock(block)
  }

  if (isInputSliderBlock(block)) {
    return createPythonCodeForInputSliderBlock(block)
  }

  if (isInputFileBlock(block)) {
    return createPythonCodeForInputFileBlock(block)
  }

  if (isInputDateBlock(block)) {
    return createPythonCodeForInputDateBlock(block)
  }

  if (isInputDateRangeBlock(block)) {
    return createPythonCodeForInputDateRangeBlock(block)
  }

  if (isVisualizationBlock(block)) {
    return createPythonCodeForVisualizationBlock(block)
  }

  if (isButtonBlock(block)) {
    return createPythonCodeForButtonBlock(block, executionContext)
  }

  if (isBigNumberBlock(block)) {
    return createPythonCodeForBigNumberBlock(block)
  }

  throw new UnsupportedBlockTypeError(`Creating python code from block type ${block.type} is not supported yet.`)
}
