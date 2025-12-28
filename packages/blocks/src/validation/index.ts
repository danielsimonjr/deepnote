/**
 * Centralized validation utilities for the blocks package.
 *
 * This module provides a unified approach to validation across the package,
 * with consistent error handling and reporting.
 */

/**
 * Result of a validation operation.
 */
export interface ValidationResult<T = unknown> {
  /** Whether the validation passed */
  success: boolean
  /** The validated/sanitized data (only present if success is true) */
  data?: T
  /** Error messages if validation failed */
  errors: string[]
  /** Warning messages that don't fail validation but should be noted */
  warnings: string[]
}

/**
 * Creates a successful validation result.
 */
export function validationSuccess<T>(data: T, warnings: string[] = []): ValidationResult<T> {
  return {
    success: true,
    data,
    errors: [],
    warnings,
  }
}

/**
 * Creates a failed validation result.
 */
export function validationFailure<T = never>(errors: string[], warnings: string[] = []): ValidationResult<T> {
  return {
    success: false,
    data: undefined,
    errors,
    warnings,
  }
}

/**
 * Combines multiple validation results into one.
 * Fails if any result fails.
 */
export function combineValidationResults(results: ValidationResult[]): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  for (const result of results) {
    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
  }

  return {
    success: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

/**
 * Base class for validation errors.
 * Provides a consistent error type for all validation failures.
 */
export class ValidationError extends Error {
  readonly errors: string[]
  readonly warnings: string[]

  constructor(message: string, errors: string[] = [], warnings: string[] = []) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors.length > 0 ? errors : [message]
    this.warnings = warnings
  }

  /**
   * Creates a ValidationError from a ValidationResult.
   */
  static fromResult(result: ValidationResult): ValidationError {
    const message = result.errors.join('; ') || 'Validation failed'
    return new ValidationError(message, result.errors, result.warnings)
  }
}

/**
 * Validates that a value is defined (not null or undefined).
 */
export function validateDefined<T>(value: T | null | undefined, fieldName: string): ValidationResult<T> {
  if (value === null || value === undefined) {
    return validationFailure([`${fieldName} is required`])
  }
  return validationSuccess(value)
}

/**
 * Validates that a string is non-empty.
 */
export function validateNonEmptyString(value: string | null | undefined, fieldName: string): ValidationResult<string> {
  if (!value || value.trim() === '') {
    return validationFailure([`${fieldName} must be a non-empty string`])
  }
  return validationSuccess(value.trim())
}

/**
 * Validates that a number is within a range.
 */
export function validateNumberInRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult<number> {
  if (value < min || value > max) {
    return validationFailure([`${fieldName} must be between ${min} and ${max}, got ${value}`])
  }
  return validationSuccess(value)
}

/**
 * Validates that a value is one of the allowed options.
 */
export function validateOneOf<T extends string>(
  value: string,
  options: readonly T[],
  fieldName: string
): ValidationResult<T> {
  if (!options.includes(value as T)) {
    return validationFailure([`${fieldName} must be one of: ${options.join(', ')}. Got: ${value}`])
  }
  return validationSuccess(value as T)
}

/**
 * Validates an array has at least one element.
 */
export function validateNonEmptyArray<T>(value: T[] | null | undefined, fieldName: string): ValidationResult<T[]> {
  if (!value || value.length === 0) {
    return validationFailure([`${fieldName} must have at least one element`])
  }
  return validationSuccess(value)
}
