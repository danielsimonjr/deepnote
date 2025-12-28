# Deepnote Monorepo Improvement Plan

This document outlines the remaining improvements identified during the codebase evaluation. Items already completed are marked as such.

## Completed Items ✅

### Type Safety

- [x] Fixed Zod import syntax (`import { z } from 'zod'`)
- [x] Created typed Zod schemas for all block metadata (`block-metadata-schemas.ts`)
- [x] Added Zod validation for Jupyter notebook parsing
- [x] Replaced `z.any()` with typed schemas in `deepnote-file-schema.ts`

### Error Handling

- [x] Created `VisualizationBlockError` class with proper error messages
- [x] Created `ButtonBlockError` class for button validation errors
- [x] Changed from silent empty string returns to throwing descriptive errors

### Input Validation

- [x] Added `MAX_CUSTOM_DAYS = 36500` constant for date range limits
- [x] Added slider min/max bounds validation

### Test Coverage

- [x] Added tests for `code-blocks.ts`
- [x] Added tests for `sql-blocks.ts`
- [x] Added tests for `button-blocks.ts`
- [x] Added tests for `big-number-blocks.ts`
- [x] Added tests for `visualization-blocks.ts`
- [x] Added tests for `text-blocks.ts`

---

## Phase 1: Validation Gaps ✅

### 1.1 Date Validation ✅

**File:** `packages/blocks/src/blocks/input-blocks.ts`

- [x] Added `isValidDate()` function to validate actual date validity (rejects `2024-02-30`, etc.)
- [x] Added `isValidDateRangeOrder()` function to validate date ranges (start <= end)
- [x] Updated `isValidAbsoluteDateRange()` to use both validations

### 1.2 Image URL Validation ✅

**File:** `packages/blocks/src/blocks/image-blocks.ts`

- [x] Added `isValidImageUrl()` to validate URL format and protocols
- [x] Added `sanitizeImageUrl()` to sanitize invalid URLs
- [x] Created `ImageBlockError` class for error handling
- [x] Whitelisted protocols: http, https, data: (image types only)
- [x] Blocks javascript: protocol (XSS prevention)

### 1.3 Variable Name Collision Detection ✅

**File:** `packages/blocks/src/blocks/python-utils.ts`

- [x] Added `PYTHON_KEYWORDS` set with all Python 3 reserved keywords
- [x] Added `PYTHON_BUILTINS` set with common built-in names
- [x] Added `isPythonKeyword()` and `isPythonBuiltin()` functions
- [x] Added `validatePythonVariableName()` for comprehensive validation with warnings

### 1.4 Deserialization Error Reporting ✅

**File:** `packages/blocks/src/deserialize-file/deserialize-deepnote-file.ts`

- [x] Created `DeepnoteFileParseError` custom error class
- [x] Shows up to 5 validation issues with context
- [x] Includes block/notebook index hints for location
- [x] Provides `firstIssueMessage` getter for simple error handling

---

## Phase 2: Additional Test Coverage

### 2.1 Edge Cases

**Tasks:**

- [ ] Add tests for empty inputs across all block types
- [ ] Add tests for unicode/special character handling
- [ ] Add tests for maximum length inputs
- [ ] Add tests for malformed metadata

### 2.2 Integration Tests

**Tasks:**

- [ ] Add end-to-end tests for notebook conversion
- [ ] Add tests for round-trip conversions (Deepnote → Jupyter → Deepnote)
- [ ] Add tests for real-world notebook files

### 2.3 Error Path Tests

**Tasks:**

- [ ] Add tests for all error conditions
- [ ] Add tests for validation failures
- [ ] Add tests for recovery from malformed data

---

## Phase 3: Code Quality & Architecture

### 3.1 Type Improvements

**Tasks:**

- [ ] Audit remaining uses of `as` type assertions
- [ ] Replace type assertions with type guards where possible
- [ ] Add branded types for IDs (BlockId, IntegrationId, etc.)

### 3.2 Code Organization

**Tasks:**

- [ ] Consider extracting validation logic into separate module
- [ ] Standardize error handling patterns across packages
- [ ] Add consistent logging/debugging support

### 3.3 Performance

**Tasks:**

- [ ] Profile Zod schema validation performance
- [ ] Consider lazy schema compilation if needed
- [ ] Add benchmarks for critical paths

---

## Phase 4: Documentation

### 4.1 API Documentation

**Tasks:**

- [ ] Add JSDoc comments to all public exports
- [ ] Document expected input/output formats
- [ ] Add usage examples in comments

### 4.2 Architecture Documentation

**Tasks:**

- [ ] Document the block system architecture
- [ ] Document the conversion pipeline
- [ ] Add diagrams for data flow

### 4.3 Error Documentation

**Tasks:**

- [ ] Document all error types and their meanings
- [ ] Add troubleshooting guide for common errors
- [ ] Document validation rules

---

## Phase 5: Future Enhancements

### 5.1 Extended Block Support

**Tasks:**

- [ ] Add support for additional block types as needed
- [ ] Consider plugin architecture for custom blocks

### 5.2 Validation Framework

**Tasks:**

- [ ] Consider creating a unified validation framework
- [ ] Add configurable validation levels (strict, lenient)
- [ ] Add validation result reporting

### 5.3 Developer Experience

**Tasks:**

- [ ] Add debug mode with verbose logging
- [ ] Add schema visualization tools
- [ ] Consider adding a CLI for validation

---

## Implementation Priority

1. **High Priority:** Phase 1 (Validation Gaps) - Security and correctness
2. **Medium Priority:** Phase 2 (Test Coverage) - Reliability
3. **Medium Priority:** Phase 3 (Code Quality) - Maintainability
4. **Lower Priority:** Phase 4 (Documentation) - Usability
5. **Future:** Phase 5 (Enhancements) - Features

## Notes

- Always run `pnpm test`, `pnpm typecheck`, and `pnpm biome:check` before committing
- Follow existing code patterns in the repository
- Add tests for any new functionality
- Update this document as items are completed
