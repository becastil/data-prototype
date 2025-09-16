# FINDINGS

## Key Modules & Exports
- **Fees configuration UI** – `app/components/forms/FeesConfigurator.tsx` (lines ~1-420)
  - Exports `RateBasis`, `FeeItem`, `FeesConfig`, and default `FeesConfigurator` component.
  - Manages base fees, global budget/rebate inputs, and per-month overrides via `perMonthToOverrideRows` and `toPerMonth` helpers.
  - Interfaces with bulk apply (`BulkApplyModal`) and normalization helpers.
- **Bulk apply modal workflow** – `app/components/forms/BulkApplyModal.tsx` (lines ~1-420)
  - Presents dialog for selecting range, components, conflict policy; uses `expandMonths`, `validateBulkApply`, `generatePreview`.
  - Applies high-contrast styling updates; surfaces validation errors/warnings.
- **Bulk apply domain services** – `app/services/bulkApplyService.ts` (lines ~1-500)
  - Exports `expandMonths`, `monthlyFromBasis`, `validateBulkApply`, `generatePreview`, `executeBulkApply`, `extractEnrollmentData`.
  - Returns `BulkApplyResult` including `updatedConfig` for downstream persistence; handles conflict policies and enrollment-driven calculations.
- **Bulk apply hook** – `app/hooks/useBulkApply.ts` (lines ~1-140)
  - Wraps validation, preview generation, and execution with async guard rails; surfaces latest result and processing state.
- **Dashboard aggregation** – `app/page.tsx` (effective budget logic at lines ~300-420)
  - `normalizeMonthKey` helper associates CSV rows with `perMonth` overrides.
  - `effectiveBudget` memo applies per-month overrides to compute fixed costs, budget, reimbursements, rebates before rendering.
- **Summary KPIs** – `app/components/DashboardSummaryTiles.tsx` (lines ~40-120)
  - Aggregates budget, claims, fixed costs (uses computed totals), and revenues across recent months for dashboard tiles.
- **Type definitions** – `app/types/bulkApply.ts` (lines ~1-120)
  - Declares `BulkApplyConfig`, `BulkApplyComponents`, `BulkApplyResult` (now with `updatedConfig`), and related enums.
- **Domain normalization tests** – `__tests__/domain/normalize.test.ts` (validates CSV normalization paths).
- **Bulk apply regression tests** – `__tests__/domain/bulkApply.test.ts`
  - Verifies `executeBulkApply` returns updated configuration with overrides applied.

## Feature Location Map
- **Fee entry & overrides**: configuration form + summary existing in `FeesConfigurator` and `effectiveBudget` (app/page).
- **Bulk apply UX flow**: `FeesConfigurator` (open modal) → `BulkApplyModal` (collect inputs) → `executeBulkApply` service → `FeesConfigurator` updates overrides.
- **KPI aggregation**: `app/page.tsx` + `DashboardSummaryTiles.tsx` (uses computed budgets and costs).

## Known Gaps / Risks vs Future Acceptance Criteria
- Acceptance criteria not provided for the upcoming task; additional requirements needed to identify concrete gaps.
- No feature flag currently wraps bulk-apply override behavior; if a safe rollout toggle is required, plumbing must be added.
- UI styling recently moved to monochrome palette in modal; confirm matches target accessibility spec when criteria are defined.

## Module Map Additions
- `__tests__/domain/bulkApply.test.ts` – New Vitest suite covering bulk apply config persistence (added in recent commit).

Provide acceptance criteria or change requests to evaluate specific gaps or propose minimal deltas.
