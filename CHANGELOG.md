# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed — CI now runs on this fork, and is green rather than red-on-arrival (2026-08-14)

GitHub disables inherited workflows on a fork, so `ci.yml` had **never run** since
this repository was created and PRs #17, #18 and #19 all merged with **no gate** —
`MERGEABLE / CLEAN` reported the absence of a merge conflict, nothing more. Actions
is now enabled. Switching it on unmodified would have produced a permanently-red
gate, so the causes were fixed first:

- **`@deepnote/blocks` advertised files that do not exist.** `package.json` declared
  `types: ./dist/index.d.ts` and `import: ./dist/index.js`, but `tsdown --dts` emits
  `index.d.cts` / `index.d.mts` / `index.mjs`. Every consumer silently resolved **no
  types**, and an ESM `import` resolved to a missing file. Now uses per-condition
  `exports` pointing at what is actually built. (Present upstream too; not a local
  regression.)
- **`pnpm typecheck` went from 237 errors to 0.** The root `tsconfig.json` set no
  `include`, so it type-checked the whole repo — including `packages/web`'s browser
  code with `jsx` unset and no `dom` lib. Adding those at the root would leak DOM
  globals into the server packages, so the fix is structural: `blocks`, `convert` and
  `database-integrations` each get their own `tsconfig.json`, and the root pass is
  scoped to `vitest.config.ts` + `test-helpers/`. **Verified by mutation** — a
  deliberate type error injected into each of the five packages _and_ into
  `test-helpers/` is caught, so the pass is not green merely because it stopped
  looking.
- **`pnpm audit` clean** (was 1 high / 1 moderate / 1 low, all dev-only). Fixed at the
  parents, not the leaves: `cspell` 9.2.2 → 10.0.1 (`smol-toml`), `tsdown` 0.15.9 →
  0.22.14 (`diff`), and `postcss` in `@deepnote/web` (`nanoid`).
- **`pnpm spell-check` clean** — 33 findings in 13 files, mostly real Python builtins
  in `python-utils.ts` plus test fixtures, added to `cspell.json`.
- **`pnpm lintAndFormat` clean** — 44 biome errors, none of them cosmetic. 17 `<button>`
  elements had no `type`, so they defaulted to `submit`; 6 labels in `InputBlocks` named
  no control and are now paired by `htmlFor`/`id`; two `autoFocus` attributes became a
  ref focused on _entering_ edit mode (autoFocus also fires on first paint and pulls a
  screen reader out of the document); and the markdown preview was click-only, so it
  gained `role`/`tabIndex`/Enter-Space. Three rules are suppressed with their reasoning
  inline — a `<button>` may not contain the links rendered markdown produces, the
  dataframe table is a never-reordered projection with no natural row id, and completing
  `useKernel`'s dependency array would reopen the WebSocket every render.
  Plus prettier on 4 unformatted markdown files.
- **Codecov upload no longer fails the Test job for a missing credential.** On a push
  to `main` the fork-PR guard does not apply, so the step ran with no `CODECOV_TOKEN`
  and `fail_ci_if_error: true` failed the job. The token is checked in a dedicated
  step and kept **out of job-level `env`** — hoisting it there would place the secret
  in the environment of `pnpm install` and `pnpm run test:coverage`, which execute
  third-party package code.

### Fixed — `.husky/pre-push` guarded the wrong thing (2026-08-14)

The hook decided from `git symbolic-ref --short HEAD` (what is checked out)
instead of from the refspec git feeds it on stdin (what is being pushed).
That was wrong in both directions, and both were reproduced by running the
hook against synthetic refspecs before the fix:

- **False negative** — from a feature branch, `git push origin HEAD:main`
  passed. That is the exact push the hook exists to block.
- **False positive** — standing on `main`, `git push origin --delete
some-branch` was rejected as "pushing directly to main", though `main` is
  untouched. A guard that fires on unrelated work is what trains people to
  reach for `--no-verify`, which then disables the true positive too.

The hook now reads `<local_ref> <local_oid> <remote_ref> <remote_oid>` per
line and acts only on `refs/heads/main`. An all-zero `local_oid` means a
deletion, so deleting `main` is refused with its own message; the zero test
is `case $local_oid in *[!0]*)`, which holds for SHA-1 and SHA-256 without
hard-coding either length.

### Security — both open Dependabot alerts resolved (2026-08-03)

- `brace-expansion` 5.0.6 -> 5.0.9 (high, needs 5.0.7)
- `body-parser` 1.20.5 -> 1.20.6 (low)
- `dompurify` 3.4.11 -> 3.4.13 (low, needs 3.4.12) — a second tree position
  that Dependabot's own PR #15 did not reach

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

### Known issue — `pnpm typecheck` remains red (pre-existing) — RESOLVED 2026-08-14

> Resolved by the CI entry at the top of this file, along the structural lines this
> note predicted: per-package `tsconfig.json` for the three packages that lacked one,
> and the root pass scoped to the root-level TS files.

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
