# Delivery Roadmap

This plan tracks the seven incremental pull requests required to stabilize the healthcare analytics prototype. Each PR keeps diffs small, adds tests, and supports offline-only constraints.

## PR Checklists & Impact Estimates

- [ ] **PR-001 · Introduce typed domain & normalization layer**
  - Scope: Add canonical TypeScript domain types, zod schemas for CSV headers, and normalization services with fixtures.
  - Impact: High changeability; unlocks typed pipeline and validation in later work.
- [ ] **PR-002 · Extract KPI & fee computation services**
  - Scope: Move all KPI math into pure services with golden tests covering PMPM/PEPM, surplus, rebates, stop-loss logic.
  - Impact: High correctness; isolates business logic for future iteration.
- [ ] **PR-003 · Streaming, worker-based CSV parsing**
  - Scope: Enable Papa Parse worker streaming, incremental normalization, and progress UI with cancellation.
  - Impact: High performance; protects main thread with 100k-row uploads.
- [ ] **PR-004 · State & data flow cleanup**
  - Scope: Add orchestrator hook (or store) feeding charts/tables from normalized data; remove prop drilling.
  - Impact: High maintainability; reduces coupling and re-render churn.
- [ ] **PR-005 · Performance safeguards**
  - Scope: Memoize monthly aggregates, virtualize large tables, and add dev-only performance overlay with timing percentiles.
  - Impact: Medium performance; guards against regressions during uploads and browsing.
- [ ] **PR-006 · Error handling & accessibility**
  - Scope: Add error boundary UX, validation messaging, downloadable diagnostics, and accessibility enhancements (aria-live, focus).
  - Impact: Medium reliability; improves trust and inclusive UX.
- [ ] **PR-007 · Tests, CI, and docs**
  - Scope: Bring in Vitest + Testing Library + Playwright, GH Actions pipeline, ADRs, and README updates/disclaimers.
  - Impact: High hygiene; enforces quality gates and clarifies privacy limitations.

## Working Agreements

- Maintain offline-only behavior and avoid PHI exposure.
- Target ≥80% coverage on KPI/fees services and keep PRs ≤500 LOC logical diff.
- Update `CHANGELOG.md` and relevant docs alongside each PR.
