# Project Conventions

## Code Style

- TypeScript strict mode — no `any`, use `unknown` + type narrowing
- All `core/` functions must have JSDoc with `@param`, `@returns`, `@throws`
- Worker message contracts: single shared type file `app/workers/message-contracts.ts`
- Never use `console.log` in `core/` — use `core/utils/logger.ts`

## Testing

- Unit tests: `tests/unit/` — use Vitest + `@vue/test-utils`
- Integration tests: `tests/integration/` — test full pipeline
- E2E tests: `tests/e2e/` — Playwright on Chrome, Firefox, Safari
- Test naming: `describe('ModuleName') > it('should [expected behavior] when [condition]')`
- Every new feature MUST have tests before merge

## Git

- Format: `<type>: <short message>` (≤ 50 chars)
- Prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `style:`
- Each commit passes: `npm run lint && npm run test:unit && npm run typecheck`
- Never commit broken builds or failing tests

## Architecture

- `core/` = zero Vue/Nuxt dependency — pure TypeScript
- `app/workers/` imports from `core/` only
- `app/components/` imports from `composables/` and `stores/` only
- Pinia stores: one per domain, no cross-imports
