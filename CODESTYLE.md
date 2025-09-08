Code Style and Conventions

This repository follows a pragmatic, consistent set of conventions for naming, layout, and imports to keep the codebase maintainable.

Naming
- Files: kebab-case for files and folders (e.g., claim-table.tsx, date-range-dropdown.tsx).
- Components: React components use PascalCase exports, even when filename is kebab-case (e.g., animated-dashboard-card.tsx exports AnimatedDashboardCard).
- Types: PascalCase for types and interfaces (e.g., ClaimData, ServiceType).
- Constants: SCREAMING_SNAKE_CASE for compile-time constants (e.g., VALIDATION_LIMITS).
- Functions/variables: camelCase.

Imports
- Prefer path aliases over deep relative paths:
  - `@/` points to repository root (e.g., `@/app/components/...`).
  - `@components/*` → `app/components/*`
  - `@utils/*` → `app/utils/*`
  - `@styles/*` → `app/styles/*`
- Group imports: node built-ins → third-party → internal. Keep import groups separated by a blank line.

Folder Structure (Target)
- app/
  - (dashboard)/
    - page.tsx (core dashboard)
  - (demos)/
    - demos/ (all demos & experiments)
  - components/
    - charts/ (one charting library preferred; see Cleanup Plan)
    - data/
    - loaders/
    - navigation/
    - ui/
  - constants/
  - lib/ (runtime helpers, security, storage)
  - utils/ (pure helpers; formatting, parsing)
  - styles/
  - types/
- config/ (optional: tailwind, postcss, next config can live at repo root if preferred)
- scripts/ (dev/build/clean scripts)
- docs/
- public/

Formatting
- Use XO + Prettier for JS/TS; Ruff for Python.
- Keep line length sane (100–120 chars), but let Prettier manage wrapping.
- Ensure trailing commas where supported; single quotes in TS; double quotes in JSON.

React/TS
- Client components: include "use client" at the top when needed.
- Prefer function components + hooks; avoid class components except error boundaries.
- Keep components focused; split files >300 lines into logical submodules.

CSS/Styling
- Prefer Vanilla Extract or Tailwind utility classes for layout; keep custom CSS variables in a single place.
- Avoid duplicating design tokens; re-use variables from `app/styles`.

Testing (future)
- Unit: colocate with files under `__tests__` or `*.test.ts(x)`.
- E2E: in `e2e/` (Playwright/Cypress).

