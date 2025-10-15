# Repository Guidelines

## Project Structure & Modules
- `t3-paridaderisco/`: Main app (Next.js + TRPC + Prisma + Tailwind + Auth).
  - `src/app/`: Route groups and pages (App Router).
  - `src/server/`: TRPC routers (`src/server/api/routers/*`), services, scheduler.
  - `src/features/` and `src/components/`: UI and domain features.
  - `prisma/`: `schema.prisma` and `seed.ts`.
  - Tests: unit/integration in `src/__tests__`, E2E in `tests/e2e`.

## Build, Test, and Development Commands
- Install: `cd t3-paridaderisco && npm install`
- Dev server: `npm run dev` (http://localhost:3000)
- Build/Start: `npm run build && npm start`
- Lint: `npm run lint`
- Unit/Integration: `npm test` or `npm run test:run` (Vitest, jsdom)
- E2E: `npm run test:e2e` (Playwright; auto-starts dev server)
- Database: `npm run db:migrate`, `npm run db:seed`, `npm run db:reset`

## Coding Style & Naming Conventions
- TypeScript: `camelCase` vars/functions, `PascalCase` components, `SCREAMING_SNAKE_CASE` constants.
- File names: components in `PascalCase.tsx`; hooks `useX.ts` under `src/hooks`.
- Imports: use alias `~` for `src` (e.g., `import { api } from "~/server/api"`).
- ESLint: Next + TypeScript (`.eslintrc.json`); fix issues before PRs.
- Styling: TailwindCSS (`tailwind.config.ts`); prefer utility classes and small UI components in `src/components/ui`.

## Testing Guidelines
- Unit/Integration (Vitest): place `*.test.ts(x)` alongside code or under `src/__tests__`.
- Setup: `vitest.config.ts` loads `src/test/setup.ts` with `jsdom` env.
- E2E (Playwright): tests in `tests/e2e`; base URL `http://localhost:3000` (see `playwright.config.ts`).
- Aim to cover core flows: auth, portfolio CRUD, charts rendering, and API error states.

## Commit & Pull Request Guidelines
- Commits: imperative, concise; use types like `feat:`, `fix:`, `chore:`, optional scope (e.g., `feat(charts): add comparison view`).
- PRs: clear description, linked issues, steps to test, screenshots for UI, and notes on DB migrations/env changes.

## Security & Configuration
- Env files: start from `t3-paridaderisco/.env.example`; do not commit secrets.
- Required vars: `DATABASE_URL` (PostgreSQL), and auth-related secrets (e.g., `NEXTAUTH_SECRET`).
- Prefer configuration via env over hardcoding; review `next.config.js` and Prisma datasource.
