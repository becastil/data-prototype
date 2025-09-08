Repository Cleanup and Refactor Plan

This plan identifies redundant artifacts, proposes a clear structure, flags dead code, and lists concrete steps to clean the repo.

1) Remove Generated/Binary Artifacts from Git
- Do not commit build outputs:
  - `.next/**` (currently tracked)
  - `tsconfig.tsbuildinfo` (currently tracked)
  - Any `*.pack.gz` caches under `.next/cache` (currently tracked)

Actions:
- Untrack generated files and keep ignoring via .gitignore:
  ```bash
  git rm -r --cached .next || true
  git rm -r --cached tsconfig.tsbuildinfo || true
  git rm -r --cached **/*.tsbuildinfo || true
  ```

2) Consolidate by Responsibility (Target Structure)
- Keep Next.js app router. Group by feature and layer:
  - app/(dashboard)/page.tsx              # main dashboard route
  - app/(demos)/**                        # demos and experiments
  - app/components/{charts,data,loaders,navigation,ui}
  - app/constants/**
  - app/lib/**                            # runtime logic (security/storage)
  - app/utils/**                          # stateless helpers (formatting, parsing)
  - app/styles/**                         # vanilla-extract, tailwind config
  - app/types/**
  - scripts/**
  - docs/**
  - public/**                             # static assets & small sample CSVs

Notes:
- Prefer a single charting library for production. Keep others under (demos) or remove.
- Consider moving `.bmad-core/` and `.claude/` under `tools/` (or remove) if not necessary at runtime.

3) Flagged Duplicates / Redundancy
- Two command palettes: `CommandPalette.tsx` and `TheatreCommandPalette.tsx` → pick one (keep basic one in prod; move Theatre version to demos if needed).
- Multiple chart libs: ECharts, Recharts, MUI X Charts. Standardize on one for production; keep others in demos.
- Validation helpers are split: `app/utils/schemas.ts` and `app/lib/validation.ts` both validate; avoid duplicate function names (e.g., `validateEnvironment` also exists in `app/lib/security.ts`).

4) Dead/Unused or Demo-Only Code
- `app/demos/**` and `app/variants/**` are experiments → keep under `app/(demos)` or remove for production builds.
- Large CSS with many gradient helpers in `app/globals.css` → prune non‑used blocks after standardizing the theme.
- `.next/**` build outputs, several cache blobs under `.next/cache` → remove from repo.
- `sample_data/archive/*.csv` large archives → move to `docs/samples/` or store externally if not used.

5) Naming, Style, Imports (Inconsistencies)
- Mixed file naming (PascalCase and camel/kebab). Adopt kebab-case filenames; components export PascalCase.
- Imports: sometimes relative, sometimes with aliases. Prefer aliases (`@/`, `@components/*`, `@utils/*`) consistently.
- Duplicate function name `validateEnvironment` in two modules → rename one to `parseEnvironment` (lib/validation) and update imports.

6) Modularization Targets
- Large components to split:
  - `app/components/charts/EChartsEnterpriseChart.tsx` → extract option builders (series/options) to `chartOptions.ts`.
  - `app/components/accessibility/AccessibilityEnhancements.tsx` → split into `a11y-live-region.tsx`, `a11y-focus-trap.tsx`, `a11y-error-boundary.tsx`.
  - `app/globals.css` → relocate design tokens to vanilla-extract theme and keep CSS minimal.

7) Security & Data Handling
- CSP (amplify.yml) currently allows `'unsafe-eval'`/inline; ship a strict production CSP and keep lenient policy only for development.
- PHI handling is client-side only (good). Add a user-visible summary of dropped/pseudonymized columns during CSV import.
- CSV export already mitigates Excel formula injection (prefix apostrophe) — keep this pattern.

8) Practical Cleanup Steps
1. Remove tracked build artifacts:
   ```bash
   git rm -r --cached .next || true
   git rm -r --cached tsconfig.tsbuildinfo || true
   git rm -r --cached **/*.tsbuildinfo || true
   ```
2. Move demos and extra chart libs under `app/(demos)`:
   - Keep a single chart lib for production (recommend Recharts or MUI X Charts for simplicity) and migrate references.
3. Unify validation:
   - Rename `app/lib/validation.ts:validateEnvironment` → `parseEnvironment` and update imports.
   - Keep data row validation in `app/utils/schemas.ts`.
4. De-duplicate command palettes:
   - Keep `app/components/navigation/CommandPalette.tsx` in production; move the Theatre-enhanced version to demos or remove.
5. Tighten CSP (Amplify):
   - Provide production header without `'unsafe-eval'`/inline; allow only required domains in `connect-src`.
6. Add consistent code style (see CODESTYLE.md) and run format/lint:
   ```bash
   npm run lint:fix
   npm run typecheck
   ```
7. Optional: move `.bmad-core/` and `.claude/` to `tools/agents/` or remove if not needed.

9) Scripts
- Use `scripts/repo-clean.ps1` to clean artifacts locally (Windows-friendly), then commit removals.

