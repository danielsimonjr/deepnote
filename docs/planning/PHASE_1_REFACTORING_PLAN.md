# Phase 1 Refactoring Plan

> Based on findings from [COMPREHENSIVE_CODEBASE_REVIEW.md](../analysis/COMPREHENSIVE_CODEBASE_REVIEW.md)
>
> **Goal:** Address technical debt, reduce code duplication, and improve maintainability before it compounds.

---

## Overview

This plan breaks down the Phase 1 refactoring into **8 sprints** with **4-5 atomic tasks** each. Tasks are designed to be independently implementable by AI subagents (Claude Haiku/Sonnet) with minimal context.

### Priority Matrix

| Sprint | Priority | Risk | Effort | Impact |
|--------|----------|------|--------|--------|
| Sprint 1: Date Range Consolidation | 🔴 High | Low | Medium | High |
| Sprint 2: Block Dispatcher Refactor | 🔴 High | Medium | Medium | High |
| Sprint 3: Python Template Extraction | 🟡 Medium | Medium | High | Medium |
| Sprint 4: Type/Schema Unification | 🟡 Medium | Low | Medium | High |
| Sprint 5: String Escaping Hardening | 🔴 High | Low | Low | High |
| Sprint 6: Integration Test Suite | 🟡 Medium | Low | Medium | Medium |
| Sprint 7: Code Duplication Cleanup | 🟢 Low | Low | Low | Medium |
| Sprint 8: Documentation & Exports | 🟢 Low | Low | Low | Medium |

---

## Sprint 1: Date Range Function Consolidation

**Objective:** Reduce 6 near-identical date range functions to 1 parameterized function.

**Files Affected:**
- `packages/blocks/src/python-snippets.ts`
- `packages/blocks/src/blocks/input-blocks.ts`

### Task 1.1: Create Unified Date Range Generator

**File:** `packages/blocks/src/python-snippets.ts`

**Description:** Create a single `dateRangePastPeriod` function that accepts a period type and generates the appropriate Python code.

**Current Code (lines 96-146):**
```typescript
dateRangePast7days: (name: string) => { /* ... timedelta(days=7) */ },
dateRangePast14days: (name: string) => { /* ... timedelta(days=14) */ },
dateRangePastMonth: (name: string) => { /* ... relativedelta(months=1) */ },
dateRangePast3months: (name: string) => { /* ... relativedelta(months=3) */ },
dateRangePast6months: (name: string) => { /* ... relativedelta(months=6) */ },
dateRangePastYear: (name: string) => { /* ... relativedelta(years=1) */ },
```

**Target Implementation:**
```typescript
type DateRangePeriod =
  | { type: 'days'; count: number }
  | { type: 'months'; count: number }
  | { type: 'years'; count: number }

dateRangePastPeriod: (name: string, period: DateRangePeriod) => {
  const sanitizedName = sanitizePythonVariableName(name)

  if (period.type === 'days') {
    return dedent`
      from datetime import datetime, timedelta
      ${sanitizedName} = [datetime.now().date() - timedelta(days=${period.count}), datetime.now().date()]
    `
  }

  // months and years use relativedelta
  return dedent`
    from datetime import datetime
    from dateutil.relativedelta import relativedelta
    ${sanitizedName} = [datetime.now().date() - relativedelta(${period.type}=${period.count}), datetime.now().date()]
  `
}
```

**Acceptance Criteria:**
- [ ] Single function handles all period types
- [ ] Uses discriminated union for type safety
- [ ] Maintains backward compatibility via wrapper functions (temporary)
- [ ] All existing tests pass

---

### Task 1.2: Update DATE_RANGE_INPUT_RELATIVE_RANGES Mapping

**File:** `packages/blocks/src/blocks/input-blocks.ts`

**Description:** Update the `DATE_RANGE_INPUT_RELATIVE_RANGES` constant to use the new unified function.

**Current Code (lines 22-29):**
```typescript
export const DATE_RANGE_INPUT_RELATIVE_RANGES = [
  { value: 'past7days', pythonCode: pythonCode.dateRangePast7days },
  { value: 'past14days', pythonCode: pythonCode.dateRangePast14days },
  // ... etc
] as const
```

**Target Implementation:**
```typescript
export const DATE_RANGE_INPUT_RELATIVE_RANGES = [
  { value: 'past7days', period: { type: 'days', count: 7 } },
  { value: 'past14days', period: { type: 'days', count: 14 } },
  { value: 'pastMonth', period: { type: 'months', count: 1 } },
  { value: 'past3months', period: { type: 'months', count: 3 } },
  { value: 'past6months', period: { type: 'months', count: 6 } },
  { value: 'pastYear', period: { type: 'years', count: 1 } },
] as const satisfies ReadonlyArray<{ value: string; period: DateRangePeriod }>
```

**Acceptance Criteria:**
- [ ] Mapping uses period objects instead of function references
- [ ] Type is properly constrained with `satisfies`
- [ ] No runtime behavior changes

---

### Task 1.3: Update createPythonCodeForInputDateRangeBlock

**File:** `packages/blocks/src/blocks/input-blocks.ts`

**Description:** Update the date range block code generation to use the new unified function.

**Current Code (lines 326-334):**
```typescript
const range = DATE_RANGE_INPUT_RELATIVE_RANGES.find(range => range.value === block.metadata.deepnote_variable_value)
if (!range) {
  throw new Error(...)
}
return dedent`
  ${range.pythonCode(sanitizedPythonVariableName)}`
```

**Target Implementation:**
```typescript
const range = DATE_RANGE_INPUT_RELATIVE_RANGES.find(r => r.value === block.metadata.deepnote_variable_value)
if (!range) {
  throw new Error(...)
}
return pythonCode.dateRangePastPeriod(sanitizedPythonVariableName, range.period)
```

**Acceptance Criteria:**
- [ ] Uses new unified function
- [ ] Error handling preserved
- [ ] All date range tests pass

---

### Task 1.4: Remove Deprecated Individual Date Functions

**File:** `packages/blocks/src/python-snippets.ts`

**Description:** Remove the 6 individual date range functions after migration is complete.

**Functions to Remove:**
- `dateRangePast7days`
- `dateRangePast14days`
- `dateRangePastMonth`
- `dateRangePast3months`
- `dateRangePast6months`
- `dateRangePastYear`

**Acceptance Criteria:**
- [ ] All 6 functions removed
- [ ] No references to removed functions remain
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes

---

### Task 1.5: Add Tests for Unified Date Range Function

**File:** `packages/blocks/src/python-snippets.test.ts` (new file)

**Description:** Create comprehensive tests for the new unified date range function.

**Test Cases:**
```typescript
describe('dateRangePastPeriod', () => {
  it('generates correct Python for days period', () => {
    const result = pythonCode.dateRangePastPeriod('my_range', { type: 'days', count: 7 })
    expect(result).toContain('timedelta(days=7)')
    expect(result).toContain('my_range = [')
  })

  it('generates correct Python for months period', () => {
    const result = pythonCode.dateRangePastPeriod('my_range', { type: 'months', count: 3 })
    expect(result).toContain('relativedelta(months=3)')
  })

  it('generates correct Python for years period', () => {
    const result = pythonCode.dateRangePastPeriod('my_range', { type: 'years', count: 1 })
    expect(result).toContain('relativedelta(years=1)')
  })

  it('sanitizes variable names', () => {
    const result = pythonCode.dateRangePastPeriod('123invalid', { type: 'days', count: 7 })
    expect(result).toContain('input_1 = [')
  })
})
```

**Acceptance Criteria:**
- [ ] Tests cover all period types (days, months, years)
- [ ] Tests verify variable name sanitization
- [ ] Tests verify correct Python syntax generation
- [ ] All tests pass

---

## Sprint 2: Block Dispatcher Refactoring

**Objective:** Replace the 15-item if-else chain with a type-safe dispatch table.

**Files Affected:**
- `packages/blocks/src/python-code.ts`
- `packages/blocks/src/blocks/index.ts`

### Task 2.1: Define Block Handler Registry Type

**File:** `packages/blocks/src/python-code.ts`

**Description:** Create a type-safe registry type for block handlers.

**Target Implementation:**
```typescript
import type { DeepnoteBlock } from './deserialize-file/deepnote-file-schema'
import type { ButtonExecutionContext } from './blocks/button-blocks'

type BlockHandler<T extends DeepnoteBlock = DeepnoteBlock> = (
  block: T,
  executionContext?: ButtonExecutionContext
) => string

type BlockType = DeepnoteBlock['type']

interface BlockHandlerRegistry {
  handlers: Map<BlockType, BlockHandler>
  register<T extends DeepnoteBlock>(type: T['type'], handler: BlockHandler<T>): void
  get(type: BlockType): BlockHandler | undefined
}
```

**Acceptance Criteria:**
- [ ] Type properly constrains handlers to their block types
- [ ] Registry supports type-safe registration
- [ ] No `any` types used

---

### Task 2.2: Create Block Handler Registry Implementation

**File:** `packages/blocks/src/python-code.ts`

**Description:** Implement the block handler registry with all existing handlers.

**Target Implementation:**
```typescript
const blockHandlerRegistry: BlockHandlerRegistry = {
  handlers: new Map(),

  register(type, handler) {
    this.handlers.set(type, handler as BlockHandler)
  },

  get(type) {
    return this.handlers.get(type)
  }
}

// Register all handlers
blockHandlerRegistry.register('code', createPythonCodeForCodeBlock)
blockHandlerRegistry.register('sql', createPythonCodeForSqlBlock)
blockHandlerRegistry.register('input-text', createPythonCodeForInputTextBlock)
blockHandlerRegistry.register('input-textarea', createPythonCodeForInputTextareaBlock)
blockHandlerRegistry.register('input-checkbox', createPythonCodeForInputCheckboxBlock)
blockHandlerRegistry.register('input-select', createPythonCodeForInputSelectBlock)
blockHandlerRegistry.register('input-slider', createPythonCodeForInputSliderBlock)
blockHandlerRegistry.register('input-file', createPythonCodeForInputFileBlock)
blockHandlerRegistry.register('input-date', createPythonCodeForInputDateBlock)
blockHandlerRegistry.register('input-date-range', createPythonCodeForInputDateRangeBlock)
blockHandlerRegistry.register('visualization', createPythonCodeForVisualizationBlock)
blockHandlerRegistry.register('button', createPythonCodeForButtonBlock)
blockHandlerRegistry.register('big-number', createPythonCodeForBigNumberBlock)
```

**Acceptance Criteria:**
- [ ] All 13 block types registered
- [ ] Registry is properly typed
- [ ] No runtime behavior changes

---

### Task 2.3: Refactor createPythonCode to Use Registry

**File:** `packages/blocks/src/python-code.ts`

**Description:** Replace the if-else chain with registry lookup.

**Current Code (lines 70-124):**
```typescript
export function createPythonCode(block: DeepnoteBlock, executionContext?: ButtonExecutionContext): string {
  if (isCodeBlock(block)) {
    return createPythonCodeForCodeBlock(block)
  }
  if (isSqlBlock(block)) {
    return createPythonCodeForSqlBlock(block)
  }
  // ... 11 more if statements
  throw new UnsupportedBlockTypeError(...)
}
```

**Target Implementation:**
```typescript
export function createPythonCode(block: DeepnoteBlock, executionContext?: ButtonExecutionContext): string {
  const handler = blockHandlerRegistry.get(block.type)

  if (!handler) {
    throw new UnsupportedBlockTypeError(`Creating python code from block type ${block.type} is not supported yet.`)
  }

  return handler(block, executionContext)
}
```

**Acceptance Criteria:**
- [ ] If-else chain completely removed
- [ ] Same error message for unsupported types
- [ ] All existing tests pass
- [ ] `pnpm typecheck` passes

---

### Task 2.4: Remove Unused Type Guard Imports

**File:** `packages/blocks/src/python-code.ts`

**Description:** Remove the type guard imports that are no longer needed after refactoring.

**Imports to Evaluate:**
```typescript
// These may no longer be needed in python-code.ts:
import { isCodeBlock } from './blocks/code-blocks'
import { isSqlBlock } from './blocks/sql-blocks'
import { isInputTextBlock, isInputTextareaBlock, ... } from './blocks/input-blocks'
import { isVisualizationBlock } from './blocks/visualization-blocks'
import { isButtonBlock } from './blocks/button-blocks'
import { isBigNumberBlock } from './blocks/big-number-blocks'
```

**Acceptance Criteria:**
- [ ] Unused imports removed
- [ ] `pnpm biome:check` passes (no unused imports error)
- [ ] Type guards still exported from their original modules for external use

---

### Task 2.5: Add Registry Tests

**File:** `packages/blocks/src/python-code.test.ts`

**Description:** Add tests for the registry pattern and ensure dispatch works correctly.

**Test Cases:**
```typescript
describe('createPythonCode dispatch', () => {
  it('dispatches code blocks correctly', () => {
    const block = { type: 'code', content: 'print("hi")', ... }
    expect(createPythonCode(block)).toBe('print("hi")')
  })

  it('throws UnsupportedBlockTypeError for unknown types', () => {
    const block = { type: 'unknown-type' as any, ... }
    expect(() => createPythonCode(block)).toThrow(UnsupportedBlockTypeError)
  })

  it('passes execution context to button handlers', () => {
    const block = { type: 'button', ... }
    const context = { action: 'set_variable', ... }
    // Verify context is used
  })
})
```

**Acceptance Criteria:**
- [ ] Tests verify correct dispatch for each block type
- [ ] Tests verify error handling for unknown types
- [ ] Tests verify execution context passing

---

## Sprint 3: Python Template Extraction

**Objective:** Move embedded Python code from TypeScript strings to maintainable template files.

**Files Affected:**
- `packages/blocks/src/python-snippets.ts`
- `packages/blocks/templates/` (new directory)

### Task 3.1: Create Template Directory Structure

**Description:** Set up the directory structure for Python templates.

**Structure:**
```
packages/blocks/
├── src/
│   └── python-snippets.ts
└── templates/
    ├── big-number.py.template
    ├── date-range.py.template
    └── visualization.py.template
```

**Acceptance Criteria:**
- [ ] Directory created
- [ ] `.py.template` extension chosen for syntax highlighting
- [ ] Templates directory included in package build

---

### Task 3.2: Extract Big Number Template

**File:** `packages/blocks/templates/big-number.py.template`

**Description:** Extract the `executeBigNumber` Python code to a template file.

**Current Code (python-snippets.ts lines 11-87):**
```typescript
executeBigNumber: (...) => {
  return `
def __deepnote_big_number__():
    import json
    import jinja2
    ...
`
}
```

**Template Format:**
```python
# big-number.py.template
# Variables: {{title_template}}, {{value_variable}}, {{comparison_title_template}}, {{comparison_variable}}

def __deepnote_big_number__():
    import json
    import jinja2
    from jinja2 import meta

    def render_template(template):
        parsed_content = jinja2.Environment().parse(template)
        required_variables = meta.find_undeclared_variables(parsed_content)
        context = {
            variable_name: globals().get(variable_name)
            for variable_name in required_variables
        }
        result = jinja2.Environment().from_string(template).render(context)
        return result

    rendered_title = render_template({{title_template}})
{{#if has_comparison}}
    rendered_comparison_title = render_template({{comparison_title_template}})

    return json.dumps({
        "comparisonTitle": rendered_comparison_title,
        "comparisonValue": {{comparison_value}},
        "title": rendered_title,
        "value": {{value}}
    })
{{else}}
    return json.dumps({
        "title": rendered_title,
        "value": {{value}}
    })
{{/if}}

__deepnote_big_number__()
```

**Acceptance Criteria:**
- [ ] Template extracted with clear variable placeholders
- [ ] Comments document expected variables
- [ ] Original functionality preserved

---

### Task 3.3: Create Template Loader Utility

**File:** `packages/blocks/src/template-loader.ts`

**Description:** Create a utility to load and interpolate Python templates.

**Implementation:**
```typescript
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const templateCache = new Map<string, string>()

export function loadTemplate(name: string): string {
  if (templateCache.has(name)) {
    return templateCache.get(name)!
  }

  const templatePath = join(__dirname, '..', 'templates', `${name}.py.template`)
  const content = readFileSync(templatePath, 'utf-8')
  templateCache.set(name, content)
  return content
}

export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}
```

**Acceptance Criteria:**
- [ ] Templates loaded from file system
- [ ] Caching prevents repeated file reads
- [ ] Simple interpolation with `{{variable}}` syntax
- [ ] Works in both Node.js and bundled contexts

---

### Task 3.4: Update executeBigNumber to Use Template

**File:** `packages/blocks/src/python-snippets.ts`

**Description:** Refactor `executeBigNumber` to use the template loader.

**Target Implementation:**
```typescript
import { interpolateTemplate, loadTemplate } from './template-loader'

executeBigNumber: (titleTemplate, valueVariableName, comparisonTitleTemplate = '', comparisonVariableName = '') => {
  const sanitizedValueVariable = sanitizePythonVariableName(valueVariableName)
  const hasComparison = comparisonTitleTemplate || comparisonVariableName

  const templateName = hasComparison ? 'big-number-comparison' : 'big-number'
  const template = loadTemplate(templateName)

  return interpolateTemplate(template, {
    title_template: escapePythonString(titleTemplate),
    value: sanitizedValueVariable ? `f"{${sanitizedValueVariable}}"` : '""',
    comparison_title_template: escapePythonString(comparisonTitleTemplate),
    comparison_value: comparisonVariableName ? `f"{${sanitizePythonVariableName(comparisonVariableName)}}"` : '""',
  })
}
```

**Acceptance Criteria:**
- [ ] Uses template loader
- [ ] Same output as before
- [ ] All existing tests pass

---

### Task 3.5: Add Template Loading Tests

**File:** `packages/blocks/src/template-loader.test.ts`

**Description:** Create tests for the template loading system.

**Test Cases:**
```typescript
describe('template-loader', () => {
  describe('loadTemplate', () => {
    it('loads existing templates', () => {
      const template = loadTemplate('big-number')
      expect(template).toContain('def __deepnote_big_number__')
    })

    it('caches templates on subsequent loads', () => {
      const first = loadTemplate('big-number')
      const second = loadTemplate('big-number')
      expect(first).toBe(second) // Same reference
    })

    it('throws for non-existent templates', () => {
      expect(() => loadTemplate('nonexistent')).toThrow()
    })
  })

  describe('interpolateTemplate', () => {
    it('replaces single variable', () => {
      const result = interpolateTemplate('Hello {{name}}', { name: 'World' })
      expect(result).toBe('Hello World')
    })

    it('replaces multiple occurrences', () => {
      const result = interpolateTemplate('{{x}} + {{x}}', { x: '1' })
      expect(result).toBe('1 + 1')
    })

    it('leaves unknown variables unchanged', () => {
      const result = interpolateTemplate('{{known}} {{unknown}}', { known: 'yes' })
      expect(result).toBe('yes {{unknown}}')
    })
  })
})
```

**Acceptance Criteria:**
- [ ] Template loading tests pass
- [ ] Interpolation tests cover edge cases
- [ ] Error handling tested

---

## Sprint 4: Type/Schema Unification

**Objective:** Eliminate duplicate TypeScript interfaces and Zod schemas by generating types from schemas.

**Files Affected:**
- `packages/blocks/src/blocks/input-blocks.ts`
- `packages/blocks/src/deserialize-file/block-metadata-schemas.ts`

### Task 4.1: Audit Duplicate Type/Schema Definitions

**Description:** Create an inventory of all places where both a TypeScript interface and Zod schema exist for the same structure.

**Expected Duplications:**
| Interface | Zod Schema | Location |
|-----------|------------|----------|
| `InputTextBlockMetadata` | `inputTextBlockMetadataSchema` | input-blocks.ts / block-metadata-schemas.ts |
| `InputCheckboxBlockMetadata` | `inputCheckboxBlockMetadataSchema` | input-blocks.ts / block-metadata-schemas.ts |
| `InputSelectBlockMetadata` | `inputSelectBlockMetadataSchema` | input-blocks.ts / block-metadata-schemas.ts |
| ... | ... | ... |

**Acceptance Criteria:**
- [ ] Complete inventory documented
- [ ] Differences between interfaces and schemas identified
- [ ] Migration path determined for each pair

---

### Task 4.2: Convert Input Block Metadata to Schema-First

**File:** `packages/blocks/src/blocks/input-blocks.ts`

**Description:** Replace TypeScript interfaces with types inferred from Zod schemas.

**Current Pattern:**
```typescript
export interface InputTextBlockMetadata extends InputBlockMetadata {
  deepnote_variable_value: string
}
```

**Target Pattern:**
```typescript
import { inputTextBlockMetadataSchema } from '../deserialize-file/block-metadata-schemas'

export type InputTextBlockMetadata = z.infer<typeof inputTextBlockMetadataSchema>
```

**Acceptance Criteria:**
- [ ] All 8 input block metadata types use `z.infer<>`
- [ ] No duplicate type definitions
- [ ] All existing tests pass
- [ ] `pnpm typecheck` passes

---

### Task 4.3: Ensure Schema Completeness

**File:** `packages/blocks/src/deserialize-file/block-metadata-schemas.ts`

**Description:** Verify all Zod schemas have complete field definitions matching the original interfaces.

**Verification Checklist:**
```typescript
// Ensure these schemas have all fields from their interface counterparts:
- inputTextBlockMetadataSchema
- inputTextareaBlockMetadataSchema
- inputCheckboxBlockMetadataSchema
- inputSelectBlockMetadataSchema (includes deepnote_variable_options, etc.)
- inputSliderBlockMetadataSchema (includes min/max/step)
- inputFileBlockMetadataSchema
- inputDateBlockMetadataSchema (includes version)
- inputDateRangeBlockMetadataSchema
```

**Acceptance Criteria:**
- [ ] All optional fields marked with `.optional()`
- [ ] Default values specified where appropriate
- [ ] No schema is missing fields from original interface

---

### Task 4.4: Update Block Type Definitions

**File:** `packages/blocks/src/blocks/input-blocks.ts`

**Description:** Update the block type definitions to use the new schema-derived metadata types.

**Current Pattern:**
```typescript
export interface InputTextBlock extends DeepnoteBlock {
  content: string
  metadata: InputTextBlockMetadata
  type: 'input-text'
}
```

**Target Pattern:**
```typescript
export type InputTextBlock = DeepnoteBlock & {
  content: string
  metadata: z.infer<typeof inputTextBlockMetadataSchema>
  type: 'input-text'
}
```

**Acceptance Criteria:**
- [ ] All 8 input block types updated
- [ ] Type compatibility maintained
- [ ] All tests pass

---

### Task 4.5: Export Schemas from Package Index

**File:** `packages/blocks/src/index.ts`

**Description:** Export the Zod schemas for external validation use.

**Additions:**
```typescript
// Block metadata schemas
export {
  inputTextBlockMetadataSchema,
  inputCheckboxBlockMetadataSchema,
  inputSelectBlockMetadataSchema,
  inputSliderBlockMetadataSchema,
  inputFileBlockMetadataSchema,
  inputDateBlockMetadataSchema,
  inputDateRangeBlockMetadataSchema,
} from './deserialize-file/block-metadata-schemas'
```

**Acceptance Criteria:**
- [ ] Schemas exported from package
- [ ] JSDoc comments added for public API
- [ ] No breaking changes to existing exports

---

## Sprint 5: String Escaping Hardening

**Objective:** Harden the Python string escaping with fuzz testing and edge case coverage.

**Files Affected:**
- `packages/blocks/src/blocks/python-utils.ts`
- `packages/blocks/src/blocks/python-utils.test.ts`

### Task 5.1: Add Carriage Return Escaping

**File:** `packages/blocks/src/blocks/python-utils.ts`

**Description:** Add handling for carriage returns which are currently not escaped.

**Current Code:**
```typescript
export function escapePythonString(value: string): string {
  const escaped = value.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n')
  return `'${escaped}'`
}
```

**Target Code:**
```typescript
export function escapePythonString(value: string): string {
  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
  return `'${escaped}'`
}
```

**Acceptance Criteria:**
- [ ] Carriage returns escaped as `\r`
- [ ] Tabs escaped as `\t`
- [ ] Existing tests still pass
- [ ] New tests added for `\r` and `\t`

---

### Task 5.2: Add Unicode Edge Case Tests

**File:** `packages/blocks/src/blocks/python-utils.test.ts`

**Description:** Add tests for Unicode edge cases that could cause issues.

**Test Cases:**
```typescript
describe('escapePythonString unicode handling', () => {
  it('handles astral plane characters (emoji)', () => {
    expect(escapePythonString('Hello 👋 World')).toBe("'Hello 👋 World'")
  })

  it('handles zero-width characters', () => {
    expect(escapePythonString('a\u200Bb')).toBe("'a\u200Bb'") // Zero-width space
  })

  it('handles right-to-left override', () => {
    expect(escapePythonString('test\u202Eevil')).toBe("'test\u202Eevil'")
  })

  it('handles null character', () => {
    expect(escapePythonString('a\x00b')).toBe("'a\\x00b'")
  })

  it('handles combining characters', () => {
    expect(escapePythonString('é')).toBe("'é'") // e + combining acute
  })

  it('handles surrogate pairs correctly', () => {
    expect(escapePythonString('𝕳𝖊𝖑𝖑𝖔')).toBe("'𝕳𝖊𝖑𝖑𝖔'")
  })
})
```

**Acceptance Criteria:**
- [ ] All Unicode edge cases tested
- [ ] Tests verify Python interpreter compatibility
- [ ] Any needed escaping added

---

### Task 5.3: Add Null Byte Handling

**File:** `packages/blocks/src/blocks/python-utils.ts`

**Description:** Handle null bytes which can cause issues in Python strings.

**Implementation:**
```typescript
export function escapePythonString(value: string): string {
  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
    .replaceAll('\0', '\\x00')  // Null byte
  return `'${escaped}'`
}
```

**Acceptance Criteria:**
- [ ] Null bytes properly escaped
- [ ] Test verifies Python can parse the output
- [ ] No breaking changes

---

### Task 5.4: Add Property-Based Test Framework

**File:** `packages/blocks/src/blocks/python-utils.test.ts`

**Description:** Add property-based tests using fast-check to fuzz the escaping function.

**Implementation:**
```typescript
import fc from 'fast-check'

describe('escapePythonString property-based tests', () => {
  it('always produces valid Python string literals', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const escaped = escapePythonString(input)
        // Must start and end with single quote
        expect(escaped.startsWith("'")).toBe(true)
        expect(escaped.endsWith("'")).toBe(true)
        // Must not contain unescaped single quotes
        const inner = escaped.slice(1, -1)
        expect(inner).not.toMatch(/(?<!\\)'/)
      })
    )
  })

  it('never produces strings with unescaped newlines', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const escaped = escapePythonString(input)
        const inner = escaped.slice(1, -1)
        expect(inner).not.toContain('\n')
        expect(inner).not.toContain('\r')
      })
    )
  })

  it('preserves string content through escape/unescape cycle', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const escaped = escapePythonString(input)
        // This would require a Python unescape function to fully verify
        // For now, verify length is >= input length
        expect(escaped.length).toBeGreaterThanOrEqual(input.length + 2)
      })
    )
  })
})
```

**Acceptance Criteria:**
- [ ] fast-check added as dev dependency
- [ ] Property-based tests cover escaping invariants
- [ ] 1000+ iterations per property
- [ ] All tests pass

---

### Task 5.5: Document Escaping Guarantees

**File:** `packages/blocks/src/blocks/python-utils.ts`

**Description:** Add comprehensive JSDoc documentation for the escaping function.

**Documentation:**
```typescript
/**
 * Escapes a string for safe inclusion in Python source code as a string literal.
 *
 * ## Guarantees
 * - Output is always a valid Python 3 string literal
 * - Output can be safely concatenated into Python source code
 * - No code injection is possible through the escaped string
 *
 * ## Escaped Characters
 * - `\` → `\\` (backslash)
 * - `'` → `\'` (single quote)
 * - `\n` → `\\n` (newline)
 * - `\r` → `\\r` (carriage return)
 * - `\t` → `\\t` (tab)
 * - `\0` → `\\x00` (null byte)
 *
 * ## Unicode Handling
 * - All valid Unicode is preserved as-is
 * - Astral plane characters (emoji, etc.) are passed through
 * - This relies on Python 3's native Unicode string support
 *
 * @param value - The string to escape
 * @returns A Python string literal including surrounding quotes
 *
 * @example
 * escapePythonString("Hello") // "'Hello'"
 * escapePythonString("It's") // "'It\\'s'"
 * escapePythonString("Line1\nLine2") // "'Line1\\nLine2'"
 */
export function escapePythonString(value: string): string {
  // ...
}
```

**Acceptance Criteria:**
- [ ] JSDoc documents all escaped characters
- [ ] Security guarantees documented
- [ ] Unicode behavior documented
- [ ] Examples provided

---

## Sprint 6: Integration Test Suite

**Objective:** Add end-to-end tests for the complete conversion pipeline.

**Files Affected:**
- `packages/convert/src/__tests__/` (new directory)
- `packages/blocks/src/__tests__/` (new directory)

### Task 6.1: Create Test Fixtures Directory

**Description:** Set up a fixtures directory with sample notebooks for testing.

**Structure:**
```
packages/convert/
└── fixtures/
    ├── simple-notebook.ipynb
    ├── complex-notebook.ipynb
    ├── notebook-with-outputs.ipynb
    ├── empty-notebook.ipynb
    └── malformed-notebook.ipynb
```

**Acceptance Criteria:**
- [ ] Directory structure created
- [ ] At least 5 representative test notebooks
- [ ] Notebooks cover edge cases

---

### Task 6.2: Create Jupyter to Deepnote Integration Test

**File:** `packages/convert/src/jupyter-to-deepnote.integration.test.ts`

**Description:** Create end-to-end tests for the full conversion pipeline.

**Test Cases:**
```typescript
describe('Jupyter to Deepnote Integration', () => {
  it('converts simple notebook correctly', async () => {
    const result = await convertIpynbFilesToDeepnoteFile(
      ['fixtures/simple-notebook.ipynb'],
      { outputPath: '/tmp/test.deepnote', projectName: 'Test' }
    )

    // Verify output file exists and is valid YAML
    const content = await fs.readFile('/tmp/test.deepnote', 'utf-8')
    const parsed = YAML.parse(content)

    expect(parsed.project.notebooks).toHaveLength(1)
    expect(parsed.project.notebooks[0].blocks).toHaveLength(/* expected */)
  })

  it('preserves code cell content exactly', async () => {
    // ...
  })

  it('converts markdown cells to markdown blocks', async () => {
    // ...
  })

  it('handles multiple input files', async () => {
    // ...
  })
})
```

**Acceptance Criteria:**
- [ ] Full pipeline tested
- [ ] Output file validity verified
- [ ] Content preservation verified

---

### Task 6.3: Create Python Code Generation Integration Test

**File:** `packages/blocks/src/python-code.integration.test.ts`

**Description:** Test the complete flow from Deepnote block to executable Python.

**Test Cases:**
```typescript
describe('Python Code Generation Integration', () => {
  it('generates executable Python for all input block types', () => {
    const blocks = [
      createInputTextBlock({ name: 'var1', value: 'test' }),
      createInputSliderBlock({ name: 'var2', value: 50, min: 0, max: 100 }),
      createInputCheckboxBlock({ name: 'var3', value: true }),
    ]

    for (const block of blocks) {
      const code = createPythonCode(block)
      // Verify code is syntactically valid Python
      expect(() => validatePythonSyntax(code)).not.toThrow()
    }
  })

  it('generates correct variable assignments', () => {
    // ...
  })
})
```

**Acceptance Criteria:**
- [ ] All block types tested in integration
- [ ] Python syntax validated
- [ ] Edge cases covered

---

### Task 6.4: Create Round-Trip Conversion Test

**File:** `packages/convert/src/round-trip.integration.test.ts`

**Description:** Test that converting Jupyter → Deepnote → back produces equivalent content.

**Note:** This may require a Deepnote → Jupyter converter which doesn't exist yet. If not feasible, document as future work.

**Acceptance Criteria:**
- [ ] Test implemented OR documented as future work
- [ ] Content equivalence verified where possible

---

### Task 6.5: Add CI Integration Test Job

**File:** `.github/workflows/ci.yml`

**Description:** Add a dedicated job for integration tests that runs separately from unit tests.

**Addition:**
```yaml
integration-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'pnpm'
    - run: pnpm install
    - run: pnpm test:integration
```

**Acceptance Criteria:**
- [ ] Separate CI job for integration tests
- [ ] `pnpm test:integration` script added to package.json
- [ ] Integration tests isolated from unit tests

---

## Sprint 7: Code Duplication Cleanup

**Objective:** Eliminate remaining code duplication patterns.

### Task 7.1: Consolidate Error Message Formatting

**Files:** Multiple files with error throwing

**Description:** Create a centralized error message formatter.

**Target Implementation:**
```typescript
// packages/blocks/src/errors/format.ts
export function formatBlockError(blockId: string, blockType: string, message: string): string {
  return `[${blockType}:${blockId}] ${message}`
}

export function formatValidationError(field: string, expected: string, got: unknown): string {
  return `${field} must be ${expected}, got ${typeof got}: ${JSON.stringify(got)}`
}
```

**Acceptance Criteria:**
- [ ] Error formatting centralized
- [ ] Consistent error message format
- [ ] All block errors use formatter

---

### Task 7.2: Extract Common Metadata Access Patterns

**Files:** Various block handler files

**Description:** Create helper functions for common metadata access patterns.

**Patterns to Extract:**
```typescript
// Common pattern seen in multiple files:
const variableName = sanitizePythonVariableName(block.metadata.deepnote_variable_name)
const value = block.metadata.deepnote_variable_value

// Could become:
const { variableName, value } = extractInputBlockValues(block)
```

**Acceptance Criteria:**
- [ ] Common patterns identified and extracted
- [ ] Helper functions created
- [ ] Existing code refactored to use helpers

---

### Task 7.3: Consolidate Zod Schema Patterns

**File:** `packages/blocks/src/deserialize-file/block-metadata-schemas.ts`

**Description:** Create reusable schema components for repeated patterns.

**Reusable Components:**
```typescript
// Base schemas for common patterns
const variableNameSchema = z.string().min(1)
const variableValueStringSchema = z.string()
const variableValueBooleanSchema = z.boolean()

// Reusable metadata base
const inputBlockMetadataBase = z.object({
  deepnote_variable_name: variableNameSchema,
})
```

**Acceptance Criteria:**
- [ ] Common schema patterns extracted
- [ ] Schemas composed from base components
- [ ] No duplicate schema definitions

---

### Task 7.4: Remove Dead Code

**Description:** Identify and remove any dead code paths.

**Areas to Check:**
- Unused exports
- Unreachable branches
- Commented-out code
- Unused utility functions

**Acceptance Criteria:**
- [ ] Audit completed
- [ ] Dead code removed
- [ ] `pnpm biome:check` passes

---

### Task 7.5: Consolidate Import Patterns

**Description:** Standardize import organization across all files.

**Standard Order:**
1. Node.js built-ins (with `node:` prefix)
2. External dependencies (zod, ts-dedent, etc.)
3. Internal absolute imports
4. Relative imports

**Acceptance Criteria:**
- [ ] All files follow standard import order
- [ ] `pnpm biome:check` passes
- [ ] Consistent patterns across codebase

---

## Sprint 8: Documentation & Export Cleanup

**Objective:** Improve documentation and clean up package exports.

### Task 8.1: Document All Public Exports

**File:** `packages/blocks/src/index.ts`

**Description:** Ensure all exports have JSDoc documentation.

**Acceptance Criteria:**
- [ ] Every export has JSDoc
- [ ] Examples provided for complex APIs
- [ ] Parameter types documented

---

### Task 8.2: Create API Reference Document

**File:** `packages/blocks/README.md`

**Description:** Create comprehensive API reference documentation.

**Sections:**
- Installation
- Quick Start
- API Reference (all exports)
- Error Handling
- Examples

**Acceptance Criteria:**
- [ ] README comprehensive
- [ ] All public APIs documented
- [ ] Examples for common use cases

---

### Task 8.3: Add Deprecation Warnings

**Description:** Add deprecation warnings for any APIs that should be phased out.

**Implementation:**
```typescript
/**
 * @deprecated Use `dateRangePastPeriod` instead. Will be removed in v2.0.
 */
export function dateRangePast7days(name: string): string {
  console.warn('dateRangePast7days is deprecated. Use dateRangePastPeriod instead.')
  return dateRangePastPeriod(name, { type: 'days', count: 7 })
}
```

**Acceptance Criteria:**
- [ ] Deprecated APIs marked with `@deprecated`
- [ ] Runtime warnings added
- [ ] Migration path documented

---

### Task 8.4: Create CHANGELOG

**File:** `CHANGELOG.md`

**Description:** Create a changelog following Keep a Changelog format.

**Format:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Unified date range function
- Block handler registry pattern
- Property-based tests for string escaping

### Changed
- Block dispatch now uses registry instead of if-else chain
- Type definitions now derived from Zod schemas

### Deprecated
- Individual date range functions (use `dateRangePastPeriod`)

### Removed
- N/A

### Fixed
- String escaping now handles carriage returns and tabs
```

**Acceptance Criteria:**
- [ ] CHANGELOG created
- [ ] Follows Keep a Changelog format
- [ ] All Phase 1 changes documented

---

### Task 8.5: Update CLAUDE.md

**File:** `CLAUDE.md`

**Description:** Update Claude development guide with new patterns and conventions.

**Additions:**
- Block handler registry pattern
- Template loading system
- Schema-first type definitions
- New testing conventions

**Acceptance Criteria:**
- [ ] CLAUDE.md updated with new patterns
- [ ] Examples provided
- [ ] Deprecations noted

---

## Execution Guidelines

### For AI Subagents (Haiku/Sonnet)

1. **Read the target file(s) first** - Understand existing code before making changes
2. **Run tests before and after** - `pnpm test` must pass
3. **Check types** - `pnpm typecheck` must pass
4. **Check linting** - `pnpm biome:check` must pass
5. **Make atomic commits** - One logical change per commit
6. **Document decisions** - Add comments for non-obvious choices

### Task Completion Checklist

For each task:
- [ ] Code changes implemented
- [ ] Tests added/updated
- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm biome:check` passes
- [ ] Changes committed with descriptive message
- [ ] Task marked complete in this document

### Rollback Plan

If a sprint causes issues:
1. Revert to pre-sprint commit
2. Document what went wrong
3. Break task into smaller pieces
4. Re-attempt with more specific guidance

---

## Success Metrics

After Phase 1 completion:

| Metric | Before | Target |
|--------|--------|--------|
| Date range functions | 6 | 1 |
| Lines in if-else chain | 50+ | 5 |
| Duplicate type definitions | ~15 | 0 |
| String escaping test coverage | Basic | 100+ property tests |
| Integration tests | 0 | 10+ |

---

*Plan created: 2025-12-29*
*Based on: COMPREHENSIVE_CODEBASE_REVIEW.md*
*Estimated sprints: 8*
*Estimated tasks: 40*
