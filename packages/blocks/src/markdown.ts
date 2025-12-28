import { UnsupportedBlockTypeError } from './blocks'
import { createMarkdownForImageBlock, isImageBlock } from './blocks/image-blocks'
import {
  createMarkdownForSeparatorBlock,
  createMarkdownForTextBlock,
  isSeparatorBlock,
  isTextBlock,
  stripMarkdownFromTextBlock,
} from './blocks/text-blocks'
import type { DeepnoteBlock } from './deserialize-file/deepnote-file-schema'

/**
 * Converts a Deepnote block to Markdown format.
 *
 * Supported block types:
 * - Markdown blocks (returns content directly)
 * - Text blocks (paragraph, headings, bullet, todo, callout)
 * - Separator blocks (horizontal rule)
 * - Image blocks (HTML img tag)
 *
 * @param block - The Deepnote block to convert
 * @returns The generated Markdown string
 * @throws {UnsupportedBlockTypeError} If the block type is not supported
 *
 * @example
 * // Heading block
 * createMarkdown({
 *   type: 'text-cell-h1',
 *   content: 'My Title',
 *   id: 'block-1',
 *   sortingKey: 'a0',
 *   metadata: {}
 * })
 * // Returns: '# My Title'
 *
 * @example
 * // Todo block
 * createMarkdown({
 *   type: 'text-cell-todo',
 *   content: 'Task item',
 *   id: 'block-1',
 *   sortingKey: 'a0',
 *   metadata: { checked: true }
 * })
 * // Returns: '- [x] Task item'
 */
export function createMarkdown(block: DeepnoteBlock): string {
  if (block.type === 'markdown') {
    return block.content ?? ''
  }

  if (isTextBlock(block)) {
    return createMarkdownForTextBlock(block)
  }

  if (isSeparatorBlock(block)) {
    return createMarkdownForSeparatorBlock(block)
  }

  if (isImageBlock(block)) {
    return createMarkdownForImageBlock(block)
  }

  throw new UnsupportedBlockTypeError(`Creating markdown from block type ${block.type} is not supported yet.`)
}

/**
 * Strips Markdown formatting from a text block, returning plain text.
 *
 * This function removes Markdown syntax like heading prefixes (#),
 * list markers (-), checkbox indicators ([ ], [x]), and callout markers (>).
 *
 * @param block - The text block to strip formatting from
 * @returns The plain text content without Markdown formatting
 * @throws {UnsupportedBlockTypeError} If the block type is not a text block
 *
 * @example
 * stripMarkdown({
 *   type: 'text-cell-h1',
 *   content: '# My Heading',
 *   id: 'block-1',
 *   sortingKey: 'a0',
 *   metadata: {}
 * })
 * // Returns: 'My Heading'
 */
export function stripMarkdown(block: DeepnoteBlock): string {
  if (isTextBlock(block)) {
    return stripMarkdownFromTextBlock(block)
  }

  throw new UnsupportedBlockTypeError(`Stripping markdown from block type ${block.type} is not supported yet.`)
}
