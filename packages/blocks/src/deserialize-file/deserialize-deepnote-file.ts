import type { ZodIssue } from 'zod'
import { type DeepnoteFile, deepnoteFileSchema } from './deepnote-file-schema'
import { parseYaml } from './parse-yaml'

/**
 * Error thrown when deserializing a Deepnote file fails.
 * Provides detailed information about validation errors.
 */
export class DeepnoteFileParseError extends Error {
  /** All validation issues encountered */
  readonly issues: ZodIssue[]
  /** The maximum number of issues to show in the error message */
  static readonly MAX_ISSUES_TO_SHOW = 5

  constructor(issues: ZodIssue[]) {
    const formattedIssues = DeepnoteFileParseError.formatIssues(issues)
    super(`Failed to parse the Deepnote file:\n${formattedIssues}`)
    this.name = 'DeepnoteFileParseError'
    this.issues = issues
  }

  /**
   * Formats validation issues into a human-readable string.
   */
  private static formatIssues(issues: ZodIssue[]): string {
    const displayIssues = issues.slice(0, DeepnoteFileParseError.MAX_ISSUES_TO_SHOW)
    const remaining = issues.length - displayIssues.length

    const formatted = displayIssues.map((issue, index) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
      const location = DeepnoteFileParseError.getLocationHint(issue)
      return `  ${index + 1}. [${path}] ${issue.message}${location}`
    })

    if (remaining > 0) {
      formatted.push(`  ... and ${remaining} more issue(s)`)
    }

    return formatted.join('\n')
  }

  /**
   * Extracts helpful location hints from the error path.
   */
  private static getLocationHint(issue: ZodIssue): string {
    const path = issue.path

    // Try to extract block ID or notebook name for better context
    const blockIndex = path.indexOf('blocks')
    if (blockIndex !== -1 && typeof path[blockIndex + 1] === 'number') {
      return ` (block index: ${path[blockIndex + 1]})`
    }

    const notebookIndex = path.indexOf('notebooks')
    if (notebookIndex !== -1 && typeof path[notebookIndex + 1] === 'number') {
      return ` (notebook index: ${path[notebookIndex + 1]})`
    }

    return ''
  }

  /**
   * Returns just the first error message for simple error handling.
   */
  get firstIssueMessage(): string {
    const issue = this.issues[0]
    if (!issue) return 'Invalid Deepnote file'
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  }
}

/**
 * Deserialize a YAML string into a DeepnoteFile object.
 * @throws {DeepnoteFileParseError} If the file is invalid
 */
export function deserializeDeepnoteFile(yamlContent: string): DeepnoteFile {
  const parsed = parseYaml(yamlContent)
  const result = deepnoteFileSchema.safeParse(parsed)

  if (!result.success) {
    throw new DeepnoteFileParseError(result.error.issues)
  }

  return result.data
}
