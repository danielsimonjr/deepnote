/**
 * Branded types for type-safe IDs.
 *
 * Branded types prevent accidental mixing of different ID types
 * even though they're all strings at runtime.
 *
 * @example
 * const blockId: BlockId = 'block-123' as BlockId
 * const notebookId: NotebookId = 'notebook-456' as NotebookId
 *
 * // This would be a compile-time error:
 * // const wrongId: BlockId = notebookId
 */

/**
 * Brand symbol for creating nominal types from structural types.
 */
declare const __brand: unique symbol

/**
 * Creates a branded type from a base type.
 * The brand makes it incompatible with other branded types of the same base type.
 */
type Brand<T, B> = T & { readonly [__brand]: B }

/**
 * Branded type for block IDs.
 */
export type BlockId = Brand<string, 'BlockId'>

/**
 * Branded type for notebook IDs.
 */
export type NotebookId = Brand<string, 'NotebookId'>

/**
 * Branded type for project IDs.
 */
export type ProjectId = Brand<string, 'ProjectId'>

/**
 * Branded type for integration IDs.
 */
export type IntegrationId = Brand<string, 'IntegrationId'>

/**
 * Helper to create a BlockId from a string.
 * Use this when you have a validated block ID string.
 */
export function asBlockId(id: string): BlockId {
  return id as BlockId
}

/**
 * Helper to create a NotebookId from a string.
 * Use this when you have a validated notebook ID string.
 */
export function asNotebookId(id: string): NotebookId {
  return id as NotebookId
}

/**
 * Helper to create a ProjectId from a string.
 * Use this when you have a validated project ID string.
 */
export function asProjectId(id: string): ProjectId {
  return id as ProjectId
}

/**
 * Helper to create an IntegrationId from a string.
 * Use this when you have a validated integration ID string.
 */
export function asIntegrationId(id: string): IntegrationId {
  return id as IntegrationId
}

/**
 * Checks if a value is a valid ID format (non-empty string).
 */
export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
