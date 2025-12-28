import { describe, expect, it } from 'vitest'
import {
  combineValidationResults,
  ValidationError,
  validateDefined,
  validateNonEmptyArray,
  validateNonEmptyString,
  validateNumberInRange,
  validateOneOf,
  validationFailure,
  validationSuccess,
} from './index'

describe('validationSuccess', () => {
  it('creates a successful result with data', () => {
    const result = validationSuccess('test data')
    expect(result.success).toBe(true)
    expect(result.data).toBe('test data')
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('includes warnings if provided', () => {
    const result = validationSuccess('test', ['warning 1', 'warning 2'])
    expect(result.success).toBe(true)
    expect(result.warnings).toEqual(['warning 1', 'warning 2'])
  })
})

describe('validationFailure', () => {
  it('creates a failed result with errors', () => {
    const result = validationFailure(['error 1', 'error 2'])
    expect(result.success).toBe(false)
    expect(result.data).toBeUndefined()
    expect(result.errors).toEqual(['error 1', 'error 2'])
    expect(result.warnings).toEqual([])
  })

  it('includes warnings if provided', () => {
    const result = validationFailure(['error'], ['warning'])
    expect(result.warnings).toEqual(['warning'])
  })
})

describe('combineValidationResults', () => {
  it('succeeds when all results succeed', () => {
    const results = [validationSuccess('a'), validationSuccess('b')]
    const combined = combineValidationResults(results)
    expect(combined.success).toBe(true)
    expect(combined.errors).toEqual([])
  })

  it('fails when any result fails', () => {
    const results = [validationSuccess('a'), validationFailure(['error']), validationSuccess('c')]
    const combined = combineValidationResults(results)
    expect(combined.success).toBe(false)
    expect(combined.errors).toEqual(['error'])
  })

  it('collects all errors and warnings', () => {
    const results = [
      validationFailure(['error 1'], ['warning 1']),
      validationSuccess('ok', ['warning 2']),
      validationFailure(['error 2']),
    ]
    const combined = combineValidationResults(results)
    expect(combined.errors).toEqual(['error 1', 'error 2'])
    expect(combined.warnings).toEqual(['warning 1', 'warning 2'])
  })
})

describe('ValidationError', () => {
  it('creates error with message', () => {
    const error = new ValidationError('test error')
    expect(error.name).toBe('ValidationError')
    expect(error.message).toBe('test error')
    expect(error.errors).toEqual(['test error'])
  })

  it('creates error with custom errors array', () => {
    const error = new ValidationError('summary', ['error 1', 'error 2'])
    expect(error.errors).toEqual(['error 1', 'error 2'])
  })

  it('creates error from ValidationResult', () => {
    const result = validationFailure(['error 1', 'error 2'], ['warning'])
    const error = ValidationError.fromResult(result)
    expect(error.message).toBe('error 1; error 2')
    expect(error.errors).toEqual(['error 1', 'error 2'])
    expect(error.warnings).toEqual(['warning'])
  })
})

describe('validateDefined', () => {
  it('passes for defined values', () => {
    expect(validateDefined('test', 'field').success).toBe(true)
    expect(validateDefined(0, 'field').success).toBe(true)
    expect(validateDefined(false, 'field').success).toBe(true)
    expect(validateDefined([], 'field').success).toBe(true)
  })

  it('fails for null', () => {
    const result = validateDefined(null, 'myField')
    expect(result.success).toBe(false)
    expect(result.errors).toEqual(['myField is required'])
  })

  it('fails for undefined', () => {
    const result = validateDefined(undefined, 'myField')
    expect(result.success).toBe(false)
    expect(result.errors).toEqual(['myField is required'])
  })
})

describe('validateNonEmptyString', () => {
  it('passes for non-empty strings', () => {
    const result = validateNonEmptyString('test', 'field')
    expect(result.success).toBe(true)
    expect(result.data).toBe('test')
  })

  it('trims whitespace', () => {
    const result = validateNonEmptyString('  test  ', 'field')
    expect(result.data).toBe('test')
  })

  it('fails for empty string', () => {
    const result = validateNonEmptyString('', 'field')
    expect(result.success).toBe(false)
  })

  it('fails for whitespace-only string', () => {
    const result = validateNonEmptyString('   ', 'field')
    expect(result.success).toBe(false)
  })

  it('fails for null/undefined', () => {
    expect(validateNonEmptyString(null, 'field').success).toBe(false)
    expect(validateNonEmptyString(undefined, 'field').success).toBe(false)
  })
})

describe('validateNumberInRange', () => {
  it('passes for numbers in range', () => {
    const result = validateNumberInRange(5, 0, 10, 'field')
    expect(result.success).toBe(true)
    expect(result.data).toBe(5)
  })

  it('passes for boundary values', () => {
    expect(validateNumberInRange(0, 0, 10, 'field').success).toBe(true)
    expect(validateNumberInRange(10, 0, 10, 'field').success).toBe(true)
  })

  it('fails for numbers below range', () => {
    const result = validateNumberInRange(-1, 0, 10, 'field')
    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('between 0 and 10')
  })

  it('fails for numbers above range', () => {
    const result = validateNumberInRange(11, 0, 10, 'field')
    expect(result.success).toBe(false)
  })
})

describe('validateOneOf', () => {
  const options = ['a', 'b', 'c'] as const

  it('passes for valid option', () => {
    const result = validateOneOf('b', options, 'field')
    expect(result.success).toBe(true)
    expect(result.data).toBe('b')
  })

  it('fails for invalid option', () => {
    const result = validateOneOf('d', options, 'field')
    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('a, b, c')
    expect(result.errors[0]).toContain('d')
  })
})

describe('validateNonEmptyArray', () => {
  it('passes for non-empty arrays', () => {
    const result = validateNonEmptyArray([1, 2, 3], 'field')
    expect(result.success).toBe(true)
    expect(result.data).toEqual([1, 2, 3])
  })

  it('fails for empty array', () => {
    const result = validateNonEmptyArray([], 'field')
    expect(result.success).toBe(false)
  })

  it('fails for null/undefined', () => {
    expect(validateNonEmptyArray(null, 'field').success).toBe(false)
    expect(validateNonEmptyArray(undefined, 'field').success).toBe(false)
  })
})
