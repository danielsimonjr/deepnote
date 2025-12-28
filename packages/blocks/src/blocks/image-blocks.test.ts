import { describe, expect, it } from 'vitest'
import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'
import {
  createMarkdownForImageBlock,
  type ImageBlock,
  isImageBlock,
  isValidImageUrl,
  sanitizeImageUrl,
} from './image-blocks'

describe('isValidImageUrl', () => {
  describe('valid URLs', () => {
    it('returns true for empty URL', () => {
      expect(isValidImageUrl('')).toBe(true)
    })

    it('returns true for https URLs', () => {
      expect(isValidImageUrl('https://example.com/image.png')).toBe(true)
      expect(isValidImageUrl('https://cdn.example.com/path/to/image.jpg')).toBe(true)
    })

    it('returns true for http URLs', () => {
      expect(isValidImageUrl('http://example.com/image.png')).toBe(true)
    })

    it('returns true for valid data URLs with image types', () => {
      expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA')).toBe(true)
      expect(isValidImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA')).toBe(true)
      expect(isValidImageUrl('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAAB')).toBe(true)
      expect(isValidImageUrl('data:image/webp;base64,UklGRiYAAABXRUJQVlA4IBoAAAAwAQCdAS')).toBe(true)
      expect(isValidImageUrl('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcv')).toBe(true)
    })
  })

  describe('invalid URLs', () => {
    it('returns false for javascript: URLs (XSS)', () => {
      expect(isValidImageUrl('javascript:alert(1)')).toBe(false)
      expect(isValidImageUrl('JAVASCRIPT:alert(1)')).toBe(false)
      expect(isValidImageUrl('JavaScript:alert(document.cookie)')).toBe(false)
    })

    it('returns false for data URLs with non-image types', () => {
      expect(isValidImageUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isValidImageUrl('data:application/javascript,alert(1)')).toBe(false)
    })

    it('returns false for invalid URL format', () => {
      expect(isValidImageUrl('not-a-valid-url')).toBe(false)
      expect(isValidImageUrl('ftp://example.com/file.txt')).toBe(false)
      expect(isValidImageUrl('file:///etc/passwd')).toBe(false)
    })
  })
})

describe('sanitizeImageUrl', () => {
  it('returns valid URLs unchanged', () => {
    expect(sanitizeImageUrl('https://example.com/image.png')).toBe('https://example.com/image.png')
    expect(sanitizeImageUrl('')).toBe('')
  })

  it('returns empty string for invalid URLs', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeImageUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })
})

describe('createMarkdownForImageBlock', () => {
  it('creates markdown with valid URL', () => {
    const block: ImageBlock = {
      id: '123',
      type: 'image',
      content: '',
      sortingKey: 'a0',
      metadata: {
        deepnote_img_src: 'https://example.com/image.png',
        deepnote_img_width: '400',
        deepnote_img_alignment: 'center',
      },
    }

    const result = createMarkdownForImageBlock(block)

    expect(result).toBe('<img src="https://example.com/image.png" width="400" align="center" />')
  })

  it('sanitizes javascript: URLs in src', () => {
    const block: ImageBlock = {
      id: '123',
      type: 'image',
      content: '',
      sortingKey: 'a0',
      metadata: {
        deepnote_img_src: 'javascript:alert(1)',
        deepnote_img_width: '400',
        deepnote_img_alignment: 'center',
      },
    }

    const result = createMarkdownForImageBlock(block)

    expect(result).toBe('<img src="" width="400" align="center" />')
  })

  it('escapes HTML special characters in URL', () => {
    const block: ImageBlock = {
      id: '123',
      type: 'image',
      content: '',
      sortingKey: 'a0',
      metadata: {
        deepnote_img_src: 'https://example.com/image.png?a=1&b=2',
        deepnote_img_width: '400',
        deepnote_img_alignment: 'left',
      },
    }

    const result = createMarkdownForImageBlock(block)

    expect(result).toContain('&amp;')
  })

  it('handles missing metadata', () => {
    const block: ImageBlock = {
      id: '123',
      type: 'image',
      content: '',
      sortingKey: 'a0',
      metadata: {},
    }

    const result = createMarkdownForImageBlock(block)

    expect(result).toBe('<img src="" width="" align="" />')
  })

  it('sanitizes width to only allow numeric values', () => {
    const block: ImageBlock = {
      id: '123',
      type: 'image',
      content: '',
      sortingKey: 'a0',
      metadata: {
        deepnote_img_src: 'https://example.com/image.png',
        deepnote_img_width: '400px; background: red',
        deepnote_img_alignment: 'center',
      },
    }

    const result = createMarkdownForImageBlock(block)

    expect(result).toContain('width="400"')
  })

  it('sanitizes alignment to only allow valid values', () => {
    const block: ImageBlock = {
      id: '123',
      type: 'image',
      content: '',
      sortingKey: 'a0',
      metadata: {
        deepnote_img_src: 'https://example.com/image.png',
        deepnote_img_width: '400',
        deepnote_img_alignment: 'invalid-alignment',
      },
    }

    const result = createMarkdownForImageBlock(block)

    expect(result).toContain('align=""')
  })
})

describe('isImageBlock', () => {
  it('returns true for image blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'image',
      sortingKey: 'a0',
    }

    expect(isImageBlock(block)).toBe(true)
  })

  it('returns false for code blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'code',
      content: 'print("test")',
      sortingKey: 'a0',
    }

    expect(isImageBlock(block)).toBe(false)
  })

  it('returns false for markdown blocks', () => {
    const block: DeepnoteBlock = {
      id: '123',
      type: 'markdown',
      content: '# Heading',
      sortingKey: 'a0',
    }

    expect(isImageBlock(block)).toBe(false)
  })
})
