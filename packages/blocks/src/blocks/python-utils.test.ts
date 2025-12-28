import { describe, expect, it } from 'vitest'
import {
  escapePythonString,
  isPythonBuiltin,
  isPythonKeyword,
  PYTHON_BUILTINS,
  PYTHON_KEYWORDS,
  sanitizePythonVariableName,
  validatePythonVariableName,
} from './python-utils'

describe('escapePythonString', () => {
  it('escapes single quotes', () => {
    expect(escapePythonString("it's")).toBe("'it\\'s'")
  })

  it('escapes backslashes', () => {
    expect(escapePythonString('path\\to\\file')).toBe("'path\\\\to\\\\file'")
  })

  it('escapes newlines', () => {
    expect(escapePythonString('line1\nline2')).toBe("'line1\\nline2'")
  })

  it('handles multiple escapes together', () => {
    expect(escapePythonString("it's a\\path\nwith lines")).toBe("'it\\'s a\\\\path\\nwith lines'")
  })

  it('handles empty strings', () => {
    expect(escapePythonString('')).toBe("''")
  })
})

describe('sanitizePythonVariableName', () => {
  it('converts whitespace to underscores', () => {
    expect(sanitizePythonVariableName('my variable')).toBe('my_variable')
    expect(sanitizePythonVariableName('my\tvariable')).toBe('my_variable')
  })

  it('removes invalid characters', () => {
    expect(sanitizePythonVariableName('my-variable-name')).toBe('myvariablename')
    expect(sanitizePythonVariableName('my@variable!name')).toBe('myvariablename')
  })

  it('removes invalid leading characters', () => {
    expect(sanitizePythonVariableName('123variable')).toBe('variable')
    expect(sanitizePythonVariableName('---variable')).toBe('variable')
  })

  it('returns fallback for empty result', () => {
    expect(sanitizePythonVariableName('')).toBe('input_1')
    expect(sanitizePythonVariableName('123')).toBe('input_1')
    expect(sanitizePythonVariableName('---')).toBe('input_1')
  })

  it('allows disabling empty fallback', () => {
    expect(sanitizePythonVariableName('', { disableEmptyFallback: true })).toBe('')
    expect(sanitizePythonVariableName('123', { disableEmptyFallback: true })).toBe('')
  })

  it('keeps valid variable names unchanged', () => {
    expect(sanitizePythonVariableName('my_variable')).toBe('my_variable')
    expect(sanitizePythonVariableName('_private')).toBe('_private')
    expect(sanitizePythonVariableName('MyClass')).toBe('MyClass')
  })
})

describe('isPythonKeyword', () => {
  it('returns true for Python keywords', () => {
    expect(isPythonKeyword('if')).toBe(true)
    expect(isPythonKeyword('for')).toBe(true)
    expect(isPythonKeyword('while')).toBe(true)
    expect(isPythonKeyword('class')).toBe(true)
    expect(isPythonKeyword('def')).toBe(true)
    expect(isPythonKeyword('return')).toBe(true)
    expect(isPythonKeyword('import')).toBe(true)
    expect(isPythonKeyword('from')).toBe(true)
    expect(isPythonKeyword('True')).toBe(true)
    expect(isPythonKeyword('False')).toBe(true)
    expect(isPythonKeyword('None')).toBe(true)
    expect(isPythonKeyword('async')).toBe(true)
    expect(isPythonKeyword('await')).toBe(true)
  })

  it('returns false for non-keywords', () => {
    expect(isPythonKeyword('variable')).toBe(false)
    expect(isPythonKeyword('my_func')).toBe(false)
    expect(isPythonKeyword('IF')).toBe(false) // Case sensitive
    expect(isPythonKeyword('For')).toBe(false) // Case sensitive
  })
})

describe('isPythonBuiltin', () => {
  it('returns true for Python built-ins', () => {
    expect(isPythonBuiltin('print')).toBe(true)
    expect(isPythonBuiltin('len')).toBe(true)
    expect(isPythonBuiltin('list')).toBe(true)
    expect(isPythonBuiltin('dict')).toBe(true)
    expect(isPythonBuiltin('str')).toBe(true)
    expect(isPythonBuiltin('int')).toBe(true)
    expect(isPythonBuiltin('float')).toBe(true)
    expect(isPythonBuiltin('input')).toBe(true)
    expect(isPythonBuiltin('open')).toBe(true)
    expect(isPythonBuiltin('range')).toBe(true)
  })

  it('returns false for non-built-ins', () => {
    expect(isPythonBuiltin('variable')).toBe(false)
    expect(isPythonBuiltin('my_func')).toBe(false)
    expect(isPythonBuiltin('PRINT')).toBe(false) // Case sensitive
    expect(isPythonBuiltin('Len')).toBe(false) // Case sensitive
  })
})

describe('validatePythonVariableName', () => {
  it('validates regular variable names as valid', () => {
    const result = validatePythonVariableName('my_variable')

    expect(result.isValid).toBe(true)
    expect(result.isKeyword).toBe(false)
    expect(result.isBuiltin).toBe(false)
    expect(result.sanitizedName).toBe('my_variable')
    expect(result.warnings).toEqual([])
  })

  it('detects Python keywords as invalid', () => {
    const result = validatePythonVariableName('class')

    expect(result.isValid).toBe(false)
    expect(result.isKeyword).toBe(true)
    expect(result.isBuiltin).toBe(false)
    expect(result.sanitizedName).toBe('class')
    expect(result.warnings).toContain('"class" is a Python reserved keyword and cannot be used as a variable name.')
  })

  it('warns about shadowing built-ins but still valid', () => {
    const result = validatePythonVariableName('print')

    expect(result.isValid).toBe(true) // Built-ins are allowed but warned
    expect(result.isKeyword).toBe(false)
    expect(result.isBuiltin).toBe(true)
    expect(result.sanitizedName).toBe('print')
    expect(result.warnings).toContain('"print" shadows a Python built-in function. This may cause unexpected behavior.')
  })

  it('sanitizes the variable name before checking', () => {
    const result = validatePythonVariableName('my-variable-name')

    expect(result.isValid).toBe(true)
    expect(result.sanitizedName).toBe('myvariablename')
  })

  it('handles empty input with fallback', () => {
    const result = validatePythonVariableName('')

    expect(result.isValid).toBe(true)
    expect(result.sanitizedName).toBe('input_1')
    expect(result.isBuiltin).toBe(false)
  })
})

describe('PYTHON_KEYWORDS set', () => {
  it('contains all Python 3 keywords', () => {
    // A subset of essential keywords to verify
    const essentialKeywords = [
      'False',
      'None',
      'True',
      'and',
      'as',
      'assert',
      'async',
      'await',
      'break',
      'class',
      'continue',
      'def',
      'del',
      'elif',
      'else',
      'except',
      'finally',
      'for',
      'from',
      'global',
      'if',
      'import',
      'in',
      'is',
      'lambda',
      'nonlocal',
      'not',
      'or',
      'pass',
      'raise',
      'return',
      'try',
      'while',
      'with',
      'yield',
    ]

    for (const keyword of essentialKeywords) {
      expect(PYTHON_KEYWORDS.has(keyword)).toBe(true)
    }
  })
})

describe('PYTHON_BUILTINS set', () => {
  it('contains common Python built-ins', () => {
    const commonBuiltins = [
      'abs',
      'all',
      'any',
      'bool',
      'dict',
      'enumerate',
      'filter',
      'float',
      'int',
      'len',
      'list',
      'map',
      'max',
      'min',
      'open',
      'print',
      'range',
      'set',
      'sorted',
      'str',
      'sum',
      'tuple',
      'type',
      'zip',
    ]

    for (const builtin of commonBuiltins) {
      expect(PYTHON_BUILTINS.has(builtin)).toBe(true)
    }
  })
})
