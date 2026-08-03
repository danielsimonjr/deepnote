# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security — both open Dependabot alerts resolved (2026-08-03)

- `brace-expansion` 5.0.6 -> 5.0.9 (high, needs 5.0.7)
- `body-parser` 1.20.5 -> 1.20.6 (low)

Both moved with a plain in-range `pnpm update -r`; no manifest change.

### Fixed — `pnpm build` was failing in `packages/server` (2026-08-03)

Pre-existing and unrelated to the dependency updates; confirmed by
reproducing it on the unmodified lockfile. `tsc` failed with three
TS7053 errors on `req.params[0]` in `src/api/router.ts`.

Root cause: `packages/server` declared `express: ^4.21.2` but
`@types/express: ^5.0.0` — the types were a major ahead of the runtime, so
they modelled the Express 5 router and inferred `req.params` for the
`/files/*` routes as `{ "": string[] }`. The runtime code was correct;
only the types were wrong. Fixes:

- `@types/express` `^5.0.0` -> `^4.17.21`, aligned to the installed express.
- Express 4's `RouteParameters` does not model the `*` wildcard (it infers
  `{}`), so the three `/files/*` handlers now state their params generic
  explicitly: `router.get<{ 0: string }>('/files/*', ...)`. This keeps the
  runtime behaviour identical — Express 4 places the wildcard match at
  `req.params[0]` — while typing the access instead of casting it away.

`pnpm build` and `pnpm test` (556/556 across 25 files) now pass.

Touching the file also brought it under Biome's pre-commit lint, which
flagged three pre-existing `lint/style/useNodejsImportProtocol` violations
on lines this change did not otherwise alter (`fs`, `path`, and a
`require('fs')`). They are now imported as `node:fs` / `node:path`.

### Known issue — `pnpm typecheck` remains red (pre-existing)

Not caused by, and not fixed by, the above. The script is
`tsc --noEmit -p tsconfig.json && pnpm -r exec tsc --noEmit`. The root
`tsconfig.json` sets no `include`, so it type-checks every file in the
repo, including `packages/web`'s browser code — with `jsx` unset and no
`dom` lib. Adding those to the root config would leak DOM globals into the
server packages, so it is the wrong fix. The real problem is structural:
3 of the 5 packages (`blocks`, `convert`, `database-integrations`) have no
`tsconfig.json` of their own, so the per-package pass falls back to the
root config too. Fixing this properly means giving each package a
tsconfig and scoping the root pass to the 3 root-level TS files
(`vitest.config.ts` and `test-helpers/`). Left for a dedicated change.

### Security

- **Sanitize HTML block output to prevent XSS (`@deepnote/web`).** `BlockContainer` rendered `output.content` for `html`-type outputs via `dangerouslySetInnerHTML` with no sanitization. A notebook opened from an untrusted source can carry stored HTML outputs containing `<script>` / `onerror` / `javascript:` payloads (a well-known notebook XSS vector), which would execute on render. Output is now passed through `DOMPurify.sanitize()`, which strips active content while preserving safe markup so rich output (DataFrames, etc.) still renders. Added `dompurify` as a direct dependency of `@deepnote/web`.

### Fixed

- **@deepnote/web typecheck errors.** `pnpm --filter @deepnote/web typecheck` was failing: an invalid `minHeight` prop was passed to the Monaco `<Editor>` in `CodeBlock.tsx` and `SQLBlock.tsx` (TS2322), and `SQLBlock.tsx` declared an unused `databaseName` (TS6133). Removed the `minHeight` props (the wrapping `div` already enforces the minimum via `min-h-*`) and the dead variable. Typecheck now passes.

### Added

#### New Packages

- **@deepnote/web** - React + Vite frontend for localhost Deepnote
  - Notebook editor with drag-drop block reordering
  - 13 block types: Code, SQL, Text, Image, Big Number, Table, Text Input, Number Input, Checkbox, Select, Slider, Date Input, Button
  - Monaco Editor integration for code/SQL editing
  - Dark/light theme toggle with persistent settings
  - Zustand state management for notebooks, kernel, and UI
  - TailwindCSS styling

- **@deepnote/server** - Express backend with Python kernel support
  - Python kernel management (start/stop/restart/interrupt)
  - Code execution with real-time output streaming
  - WebSocket server for frontend communication
  - REST API for file operations
  - Support for .deepnote file format (YAML)

#### Root Package Updates

- Added `pnpm dev` script to run both web and server concurrently
- Added `pnpm dev:web` and `pnpm dev:server` for individual package development
- Created `pnpm-workspace.yaml` for monorepo package management

### Technical Details

- Frontend runs on http://localhost:3000
- Backend runs on http://localhost:8000
- WebSocket connection at ws://localhost:8000/ws
- Requires Python 3.8+ for kernel execution
