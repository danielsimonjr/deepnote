import { describe, expect, it } from 'vitest'
import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'
import {
  type BulletTextBlock,
  type CalloutTextBlock,
  createMarkdownForSeparatorBlock,
  createMarkdownForTextBlock,
  type Heading1TextBlock,
  type Heading2TextBlock,
  type Heading3TextBlock,
  isSeparatorBlock,
  isTextBlock,
  type ParagraphTextBlock,
  type SeparatorBlock,
  stripMarkdownFromTextBlock,
  type TodoTextBlock,
} from './text-blocks'

describe('createMarkdownForTextBlock', () => {
  describe('heading blocks', () => {
    it('creates h1 markdown', () => {
      const block: Heading1TextBlock = {
        id: '123',
        type: 'text-cell-h1',
        content: 'Main Title',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toBe('# Main Title')
    })

    it('creates h2 markdown', () => {
      const block: Heading2TextBlock = {
        id: '123',
        type: 'text-cell-h2',
        content: 'Section Title',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toBe('## Section Title')
    })

    it('creates h3 markdown', () => {
      const block: Heading3TextBlock = {
        id: '123',
        type: 'text-cell-h3',
        content: 'Subsection',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toBe('### Subsection')
    })
  })

  describe('paragraph blocks', () => {
    it('creates paragraph markdown', () => {
      const block: ParagraphTextBlock = {
        id: '123',
        type: 'text-cell-p',
        content: 'This is a paragraph.',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toBe('This is a paragraph\\.')
    })

    it('escapes special markdown characters', () => {
      const block: ParagraphTextBlock = {
        id: '123',
        type: 'text-cell-p',
        content: 'Text with *bold* and _italic_ and `code`',
        sortingKey: 'a0',
        metadata: {},
      }

      const result = createMarkdownForTextBlock(block)

      expect(result).toContain('\\*bold\\*')
      expect(result).toContain('\\_italic\\_')
      expect(result).toContain('\\`code\\`')
    })
  })

  describe('bullet blocks', () => {
    it('creates bullet list item markdown', () => {
      const block: BulletTextBlock = {
        id: '123',
        type: 'text-cell-bullet',
        content: 'List item',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toBe('- List item')
    })
  })

  describe('todo blocks', () => {
    it('creates unchecked todo markdown', () => {
      const block: TodoTextBlock = {
        id: '123',
        type: 'text-cell-todo',
        content: 'Task to do',
        sortingKey: 'a0',
        metadata: {
          checked: false,
        },
      }

      expect(createMarkdownForTextBlock(block)).toBe('- [ ] Task to do')
    })

    it('creates checked todo markdown', () => {
      const block: TodoTextBlock = {
        id: '123',
        type: 'text-cell-todo',
        content: 'Completed task',
        sortingKey: 'a0',
        metadata: {
          checked: true,
        },
      }

      expect(createMarkdownForTextBlock(block)).toBe('- [x] Completed task')
    })

    it('defaults to unchecked when checked is undefined', () => {
      const block: TodoTextBlock = {
        id: '123',
        type: 'text-cell-todo',
        content: 'Task',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toBe('- [ ] Task')
    })
  })

  describe('callout blocks', () => {
    it('creates callout markdown', () => {
      const block: CalloutTextBlock = {
        id: '123',
        type: 'text-cell-callout',
        content: 'Important note',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toBe('> Important note')
    })
  })

  describe('special characters', () => {
    it('escapes backslashes', () => {
      const block: ParagraphTextBlock = {
        id: '123',
        type: 'text-cell-p',
        content: 'Path: C:\\Users\\name',
        sortingKey: 'a0',
        metadata: {},
      }

      expect(createMarkdownForTextBlock(block)).toContain('\\\\')
    })

    it('escapes brackets', () => {
      const block: ParagraphTextBlock = {
        id: '123',
        type: 'text-cell-p',
        content: '[link](url)',
        sortingKey: 'a0',
        metadata: {},
      }

      const result = createMarkdownForTextBlock(block)

      expect(result).toContain('\\[link\\]')
      expect(result).toContain('\\(url\\)')
    })
  })
})

describe('stripMarkdownFromTextBlock', () => {
  it('strips h1 prefix', () => {
    const block: Heading1TextBlock = {
      id: '123',
      type: 'text-cell-h1',
      content: '# Title',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('Title')
  })

  it('strips h2 prefix', () => {
    const block: Heading2TextBlock = {
      id: '123',
      type: 'text-cell-h2',
      content: '## Section',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('Section')
  })

  it('strips h3 prefix (and handles h4-h6)', () => {
    const block: Heading3TextBlock = {
      id: '123',
      type: 'text-cell-h3',
      content: '#### Subsubsection',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('Subsubsection')
  })

  it('strips bullet prefix', () => {
    const block: BulletTextBlock = {
      id: '123',
      type: 'text-cell-bullet',
      content: '- List item',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('List item')
  })

  it('strips todo prefix (unchecked)', () => {
    const block: TodoTextBlock = {
      id: '123',
      type: 'text-cell-todo',
      content: '- [ ] Task',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('Task')
  })

  it('strips todo prefix (checked)', () => {
    const block: TodoTextBlock = {
      id: '123',
      type: 'text-cell-todo',
      content: '- [x] Completed',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('Completed')
  })

  it('strips callout prefix', () => {
    const block: CalloutTextBlock = {
      id: '123',
      type: 'text-cell-callout',
      content: '> Note',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('Note')
  })

  it('trims paragraph content', () => {
    const block: ParagraphTextBlock = {
      id: '123',
      type: 'text-cell-p',
      content: '  some text  ',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(stripMarkdownFromTextBlock(block)).toBe('some text')
  })
})

describe('createMarkdownForSeparatorBlock', () => {
  it('creates hr tag', () => {
    const block: SeparatorBlock = {
      id: '123',
      type: 'separator',
      content: '',
      sortingKey: 'a0',
      metadata: {},
    }

    expect(createMarkdownForSeparatorBlock(block)).toBe('<hr>')
  })
})

describe('isTextBlock', () => {
  it('returns true for paragraph blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-p', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(true)
  })

  it('returns true for h1 blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-h1', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(true)
  })

  it('returns true for h2 blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-h2', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(true)
  })

  it('returns true for h3 blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-h3', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(true)
  })

  it('returns true for bullet blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-bullet', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(true)
  })

  it('returns true for todo blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-todo', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(true)
  })

  it('returns true for callout blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-callout', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(true)
  })

  it('returns false for code blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'code', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(false)
  })

  it('returns false for separator blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'separator', sortingKey: 'a0' }
    expect(isTextBlock(block)).toBe(false)
  })
})

describe('isSeparatorBlock', () => {
  it('returns true for separator blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'separator', sortingKey: 'a0' }
    expect(isSeparatorBlock(block)).toBe(true)
  })

  it('returns false for text blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'text-cell-p', sortingKey: 'a0' }
    expect(isSeparatorBlock(block)).toBe(false)
  })

  it('returns false for code blocks', () => {
    const block: DeepnoteBlock = { id: '1', type: 'code', sortingKey: 'a0' }
    expect(isSeparatorBlock(block)).toBe(false)
  })
})
