import type { DeepnoteBlock } from '../deserialize-file/deepnote-file-schema'

export interface ImageBlockMetadata {
  deepnote_img_src?: string
  deepnote_img_width?: string
  deepnote_img_alignment?: string
}

export interface ImageBlock extends DeepnoteBlock {
  content: ''
  metadata: ImageBlockMetadata
  type: 'image'
}

// Allowed URL protocols for image sources
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:']

/**
 * Error thrown when an image block has an invalid URL.
 */
export class ImageBlockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageBlockError'
  }
}

/**
 * Validates that a URL has an allowed protocol and is well-formed.
 * @param url - The URL to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return true // Empty URLs are allowed

  // Check for javascript: protocol (XSS vector) - case insensitive
  if (/^javascript:/i.test(url)) {
    return false
  }

  // Check for data: URLs - they're allowed but we validate the format
  if (url.startsWith('data:')) {
    // Data URLs should have the format: data:[<mediatype>][;base64],<data>
    // We only allow image media types
    const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml|bmp|ico)(;base64)?,/i
    return dataUrlPattern.test(url)
  }

  // For http/https URLs, validate the URL format
  try {
    const parsedUrl = new URL(url)
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)
  } catch {
    // Invalid URL format
    return false
  }
}

/**
 * Sanitizes an image URL, returning an empty string for invalid URLs.
 * @param url - The URL to sanitize
 * @returns The sanitized URL or empty string if invalid
 */
export function sanitizeImageUrl(url: string): string {
  if (!isValidImageUrl(url)) {
    return ''
  }
  return url
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeWidth(width: string): string {
  // Extract only numeric characters
  const numericWidth = width.replace(/[^0-9]/g, '')
  return numericWidth || ''
}

function sanitizeAlignment(alignment: string): string {
  // Only allow specific alignment values
  const validAlignments = ['left', 'center', 'right']
  return validAlignments.includes(alignment.toLowerCase()) ? alignment.toLowerCase() : ''
}

export function createMarkdownForImageBlock(block: ImageBlock): string {
  const rawSrc = block.metadata.deepnote_img_src ?? ''
  const sanitizedSrc = sanitizeImageUrl(rawSrc)
  const src = escapeHtmlAttribute(sanitizedSrc)
  const width = sanitizeWidth(block.metadata.deepnote_img_width ?? '')
  const alignment = sanitizeAlignment(block.metadata.deepnote_img_alignment ?? '')

  return `<img src="${src}" width="${width}" align="${alignment}" />`
}

export function isImageBlock(block: DeepnoteBlock): block is ImageBlock {
  return block.type === 'image'
}
