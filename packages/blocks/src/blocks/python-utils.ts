export function escapePythonString(value: string): string {
  // We have to escape backslashes, single quotes, and newlines
  const escaped = value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')

  // Wrap the escaped string in single quotes
  return `'${escaped}'`
}

// Python reserved keywords (Python 3.x)
// https://docs.python.org/3/reference/lexical_analysis.html#keywords
export const PYTHON_KEYWORDS = new Set([
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
])

// Common Python built-in names that shouldn't be shadowed
// These are not reserved but shadowing them can cause confusion
export const PYTHON_BUILTINS = new Set([
  'abs',
  'all',
  'any',
  'bin',
  'bool',
  'bytes',
  'callable',
  'chr',
  'classmethod',
  'compile',
  'complex',
  'delattr',
  'dict',
  'dir',
  'divmod',
  'enumerate',
  'eval',
  'exec',
  'filter',
  'float',
  'format',
  'frozenset',
  'getattr',
  'globals',
  'hasattr',
  'hash',
  'help',
  'hex',
  'id',
  'input',
  'int',
  'isinstance',
  'issubclass',
  'iter',
  'len',
  'list',
  'locals',
  'map',
  'max',
  'memoryview',
  'min',
  'next',
  'object',
  'oct',
  'open',
  'ord',
  'pow',
  'print',
  'property',
  'range',
  'repr',
  'reversed',
  'round',
  'set',
  'setattr',
  'slice',
  'sorted',
  'staticmethod',
  'str',
  'sum',
  'super',
  'tuple',
  'type',
  'vars',
  'zip',
])

/**
 * Checks if a variable name is a Python reserved keyword.
 * @param name - The variable name to check
 * @returns true if the name is a Python keyword
 */
export function isPythonKeyword(name: string): boolean {
  return PYTHON_KEYWORDS.has(name)
}

/**
 * Checks if a variable name shadows a Python built-in.
 * @param name - The variable name to check
 * @returns true if the name shadows a Python built-in
 */
export function isPythonBuiltin(name: string): boolean {
  return PYTHON_BUILTINS.has(name)
}

export interface VariableNameValidation {
  isValid: boolean
  isKeyword: boolean
  isBuiltin: boolean
  sanitizedName: string
  warnings: string[]
}

/**
 * Validates a Python variable name and returns detailed information.
 * @param name - The variable name to validate
 * @returns Validation result with sanitized name and warnings
 */
export function validatePythonVariableName(name: string): VariableNameValidation {
  const sanitizedName = sanitizePythonVariableName(name)
  const warnings: string[] = []

  const isKeyword = isPythonKeyword(sanitizedName)
  const isBuiltin = isPythonBuiltin(sanitizedName)

  if (isKeyword) {
    warnings.push(`"${sanitizedName}" is a Python reserved keyword and cannot be used as a variable name.`)
  }

  if (isBuiltin) {
    warnings.push(`"${sanitizedName}" shadows a Python built-in function. This may cause unexpected behavior.`)
  }

  return {
    isValid: !isKeyword,
    isKeyword,
    isBuiltin,
    sanitizedName,
    warnings,
  }
}

export function sanitizePythonVariableName(
  name: string,
  options: Partial<{ disableEmptyFallback: boolean }> = {}
): string {
  let sanitizedVariableName = name
    // Convert whitespace to underscores
    .replace(/\s+/g, '_')
    // Remove invalid characters
    .replace(/[^0-9a-zA-Z_]/g, '')
    // Remove invalid leading characters
    .replace(/^[^a-zA-Z_]+/g, '')

  // Set a default value
  if (sanitizedVariableName === '' && !options.disableEmptyFallback) {
    sanitizedVariableName = 'input_1' // We don't want to call it just `input` to avoid name clashes
  }

  return sanitizedVariableName
}
