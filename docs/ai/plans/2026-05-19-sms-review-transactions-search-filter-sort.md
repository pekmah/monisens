# Add Search, Filter, Sort, and Passive SMS Review Updates

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows the repository planning standard in `PLANS.md`.

## Purpose / Big Picture

Users should be able to find and organize records quickly in two high-volume surfaces:

- The SMS ingestion review queue at `src/features/sms-sync/index.tsx`.
- The Transactions tab at `src/features/tabs/transactions/index.tsx`.

After this change, both screens should support search, sort, and filter controls. Search should cover amount, merchant/name, notes, reference, category, direction, source, and other relevant fields for each domain. The SMS review queue should also feel smooth when a candidate is accepted or dismissed: the reviewed row should leave the visible list through a passive local update instead of forcing a full page reload that remounts heavy rows.

“Passive updating” means the local visible list updates immediately after the database mutation succeeds, while the global finance snapshot refresh is deferred, debounced, or otherwise kept off the critical row interaction path. The database remains the source of truth.

## Progress

- [x] (2026-05-19 20:14Z) Create this plan from `docs/ai/plans/TEMPLATE.md` and replace placeholders with task-specific context.
- [x] Research the relevant app code, docs, data layer, and list performance constraints.
- [x] (2026-05-19 20:43Z) Implement query types and repository support.
- [x] (2026-05-19 20:51Z) Implement Transactions search/filter/sort UI and data wiring.
- [x] (2026-05-19 21:04Z) Implement SMS review search/filter/sort UI, pagination, and passive accept/dismiss updates.
- [x] (2026-05-19 21:10Z) Validate with type check, lint, and targeted source searches.
- [x] (2026-05-19 21:18Z) Update `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective`.

## Surprises & Discoveries

- Observation: The Transactions screen already has a basic search path through `FinanceProvider.searchText` and `listTransactions(searchText)`, but SQL currently searches only merchant and notes.
  Evidence: `src/features/tabs/transactions/index.tsx` consumes `searchText`/`setSearchText`; `src/lib/finance/repository.ts` has `listTransactions(searchText?: string)`.

- Observation: The SMS review queue is paged through `loadPendingSmsCandidatesPage({ limit, offset })`, and full reloads are currently triggered when `snapshot.sms.candidateCount` changes.
  Evidence: `src/features/sms-sync/index.tsx` uses local `candidates`, `hasMore`, `nextOffset`, `loadFirstPage`, and an effect keyed by `candidateCount`.

- Observation: Accepting and dismissing SMS candidates currently refresh the global snapshot immediately from the provider.
  Evidence: `src/lib/finance/provider.tsx` calls `await refresh()` in `acceptSmsCandidate`, `dismissSmsCandidate`, and `updateCandidateCategory`.

- Observation: The SMS candidate card had existing uncommitted behavior that kept the reviewer in the queue after accept by showing a toast instead of navigating to transaction detail.
  Evidence: `src/features/sms-sync/components/sms-candidate-card.tsx` was dirty before this feature work and already removed the `router.replace` accept flow.

- Observation: `npm run lint` completes successfully but reports pre-existing warnings in AI, finance, and theme modules.
  Evidence: lint exit code was 0; warnings remain for `Array<T>` style, existing hook dependency warnings, and an unused `DEFAULT_FONT_SCALE` in `src/lib/theme-controller.tsx`.

## Decision Log

- Decision: Use this ExecPlan as the source of truth before editing code.
  Rationale: The user explicitly asked to thoroughly plan and display the plan first, and `AGENTS.md`/`PLANS.md` require significant plans under `docs/ai/plans/`.
  Date/Author: 2026-05-19 / Codex

- Decision: Keep SMS candidate search/filter/sort in SQLite rather than loading all candidates into JS.
  Rationale: The SMS review queue is explicitly described as heavy, and the architecture guide requires a single virtualized list and memoized/efficient derived data for large datasets.
  Date/Author: 2026-05-19 / Codex

- Decision: Use allowlisted sort keys and parameterized SQL conditions.
  Rationale: Sort direction and column names cannot be passed as SQL parameters safely, so only controlled internal constants should affect SQL clauses.
  Date/Author: 2026-05-19 / Codex

- Decision: Keep transaction query state in `FinanceProvider` as `transactionQuery` while preserving `searchText` and `setSearchText`.
  Rationale: Existing consumers may still rely on the simple search facade, but the Transactions screen needs a richer query object for sorting and filtering.
  Date/Author: 2026-05-19 / Codex

- Decision: Let SMS review accept/dismiss pass `{ refresh: false }` into provider mutations, remove the reviewed row locally, and schedule a later `refresh()` through `InteractionManager`.
  Rationale: This keeps the database mutation authoritative while taking full snapshot rebuilds off the critical interaction path for heavy review rows.
  Date/Author: 2026-05-19 / Codex

## Outcomes & Retrospective

Implemented the requested search, sort, filter, and passive update behavior.

- Query contracts were added in `src/lib/finance/types.ts` and wired through the repository, use-case, and provider layers.
- `listTransactions` now accepts a query object and searches merchant/name, notes, reference, account label, currency, direction, source, category label, and numeric amount values. It also supports direction, category, source, and controlled sort filters.
- `listPendingSmsCandidatesPage` now accepts a query object and searches candidate fields, source/parser/status fields, category labels, sender, SMS body, and numeric amount values. It also supports direction, category, AI status, parser/source, classification source, and controlled sort filters.
- The Transactions tab now has a richer toolbar with search, sort chips, direction/source/category filters, and reset.
- The SMS review queue now has a toolbar with debounced search, sort chips, direction/category/AI status/source filters, and reset.
- Accepting or dismissing an SMS candidate now removes the row from local visible state after the database mutation succeeds, suppresses the immediate candidate-count reload, quietly refills the page when the visible list gets low, and schedules a passive global refresh after interactions.

Validation:

- `bunx tsc --noEmit` passed.
- `npm run lint` passed with existing warnings recorded above.
- Targeted inline-style search over touched SMS review and Transactions feature files returned no JSX inline style matches.

## Context and Orientation

This is an Expo React Native app. Route files live under `src/app`, feature screens live under `src/features`, reusable UI lives under `src/components`, shared data and infrastructure live under `src/lib`, and theme tokens live under `src/constants/theme.ts`.

Relevant files:

- `AGENTS.md`: project instructions. This task must follow feature ownership, no inline style objects in JSX, native React Native styling, and route-thin architecture.
- `docs/expo-app-architecture.md`: list performance, data mutation, routing, styling, and validation rules.
- `docs/app-coding-guidelines.md`: complete list screen, refresh, mutation, UI state, and definition-of-done expectations.
- `src/features/sms-sync/index.tsx`: SMS review queue screen. Owns current local pagination state and renders a single `AppFlashList`.
- `src/features/sms-sync/components/review-header.tsx`: SMS review header.
- `src/features/sms-sync/components/sms-candidate-card.tsx`: heavy candidate row with category picker, metadata, accept, and dismiss actions.
- `src/features/tabs/transactions/index.tsx`: Transactions tab screen. Currently passes search text into the finance provider and renders `TransactionList`.
- `src/features/tabs/transactions/components/transactions-toolbar.tsx`: current transaction search toolbar.
- `src/features/tabs/transactions/components/transaction-list.tsx`: single virtualized list that flattens transaction sections.
- `src/lib/finance/provider.tsx`: finance context facade. Owns global snapshot, current transaction search text, SMS candidate mutations, and refresh behavior.
- `src/lib/finance/repository.ts`: SQLite queries for `listTransactions` and `listPendingSmsCandidatesPage`.
- `src/lib/finance/use-cases.ts`: use-case wrapper layer for repository functions.
- `src/lib/finance/types.ts`: domain records and query type home for `SmsCandidatePage`, `SmsTransactionCandidateRecord`, transaction section types, and new query input types.
- `src/lib/finance/utils.ts`: `buildTransactionSections`, money formatting, and transaction list formatting helpers.

## Plan of Work

Milestone 1: Define query contracts and repository support.

- Add typed query inputs in `src/lib/finance/types.ts` for transaction and SMS review lists.
- Update `src/lib/finance/repository.ts`:
  - Replace `listTransactions(searchText?: string)` with a query-object version while preserving current default behavior.
  - Expand transaction search to merchant/name, notes, reference, category label, account label, source, direction, currency, and amount.
  - Add filters for direction, category, and source.
  - Add controlled sort options such as newest, oldest, highest amount, lowest amount, and merchant A-Z.
  - Extend `listPendingSmsCandidatesPage` to accept query filters while keeping `limit` and `offset`.
  - Expand SMS search to merchant/name, sender, SMS body, amount, reference, notes, category label, suggested category, direction, parser/source, and AI status.
  - Add controlled sort options such as newest, oldest, highest amount, lowest amount, merchant A-Z, and confidence.
- Update `src/lib/finance/use-cases.ts` and `src/lib/finance/provider.tsx` signatures.

Milestone 2: Transactions screen UI and state.

- Update `src/features/tabs/transactions/components/transactions-toolbar.tsx` to include:
  - Search input with improved placeholder text.
  - Sort control.
  - Filter controls for direction, category, and source.
  - Active filter state affordances and a reset action.
- Update `src/features/tabs/transactions/index.tsx` to pass query state/control callbacks into the toolbar.
- Keep `TransactionList` as the single virtualized owner.
- Ensure the footer messaging distinguishes loading, errors, empty list, and no matching results.

Milestone 3: SMS review search/filter/sort and passive updates.

- Add an SMS review toolbar/header component under `src/features/sms-sync/components`.
- Keep `ReviewHeader` but compose search/filter/sort controls as the `ListHeaderComponent`.
- Update `src/features/sms-sync/index.tsx`:
  - Track SMS review query state locally.
  - Debounce search text before resetting pagination.
  - Pass the active query to `loadPendingSmsCandidatesPage`.
  - Use `page.totalCount` for filtered result count.
  - Update `loadNextPage` to use the current query.
- Implement passive accept/dismiss:
  - On accept/dismiss success, remove the candidate from local `candidates` immediately.
  - Avoid immediate `loadFirstPage` triggered by the global candidate count update for locally reviewed rows.
  - Refill from the next page quietly when the visible list gets low and `hasMore` is true.
  - Defer global `refresh()` by provider option or local callback so settings/dashboard counts eventually update but the row interaction is smooth.
- Preserve the existing optimistic category update behavior.

Milestone 4: Validation and cleanup.

- Run type checking and linting.
- Search touched files for inline style objects.
- Review `git diff` to ensure no unrelated dirty files are staged.
- Record any existing unrelated warnings.

## Concrete Steps

Run commands from the app repository:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens

Start by inspecting the working tree:

    git status --short

Expected output may include unrelated dirty files from prior work. Do not revert them or include them unless directly required for this task.

Inspect the relevant code:

    rg "listTransactions|listPendingSmsCandidatesPage|SmsCandidatePage|TransactionsToolbar|SmsReviewScreen" src/lib src/features -n

After implementation, run:

    bunx tsc --noEmit

Expected successful output is no TypeScript errors and exit code 0.

Run lint:

    npm run lint

Expected successful output is exit code 0. Existing unrelated warnings should be recorded rather than silently mixed into this task.

Search for inline style objects in touched areas:

    rg "style=\{\{|\{ (backgroundColor|borderColor|color|width|height|flex|fontFamily|bottom|shadowColor):" src/features/sms-sync src/features/tabs/transactions src/lib/finance -n

Expected result should be empty for touched feature files, except non-JSX helper-return object literals in data modules are acceptable.

## Validation and Acceptance

Required baseline validation:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens
    bunx tsc --noEmit
    npm run lint

Acceptance criteria:

- Transactions screen search finds rows by merchant/name, amount, category, notes, reference, account label, source, direction, and currency.
- Transactions screen supports sort by newest, oldest, highest amount, lowest amount, and merchant A-Z.
- Transactions screen supports filters for direction, category, and source.
- SMS review queue search finds candidates by merchant/name, sender, SMS body, amount, reference, notes, category, suggested category, direction, parser/source, and AI status.
- SMS review queue supports sort by newest, oldest, highest amount, lowest amount, merchant A-Z, and confidence.
- SMS review queue supports filters for direction, category, AI status, and source/parser.
- Query changes reset SMS pagination and subsequent pages keep the same query.
- Accepting or dismissing an SMS candidate removes it from the visible list without full list reload or visible jump.
- SMS review queue quietly refills from later pages when needed.
- Global finance snapshot counts eventually update after passive SMS review actions.
- Empty, loading, and no-match states are clear on both screens.

E2E ownership: no relevant E2E scenario was found during planning. If an existing E2E suite is added or discovered during implementation, add coverage for transaction search and SMS passive review where practical. Otherwise, record manual verification steps.

## Idempotence and Recovery

Read-only inspections, `bunx tsc --noEmit`, `npm run lint`, and `rg` searches are safe to rerun.

Code edits should be additive and reviewable with `git diff`. Do not run destructive commands such as `git reset --hard` or `git checkout -- <file>` unless the user explicitly requests them. Do not revert unrelated working tree changes.

If SQL query changes fail type checking or runtime validation, revert only the local edited query logic by applying a targeted patch. Keep the previous simple behavior available until the expanded query object compiles.

If SMS passive updates cause stale count or pagination issues, preserve the database mutation path and temporarily fall back to a delayed `loadFirstPage` after row removal, then document the compromise in `Surprises & Discoveries`.

## Artifacts and Notes

Initial research commands:

    $ rg "sms.*review|review queue|Sms|SMS|transactions" src/features src/lib src/app -n
    <confirmed SMS review, transactions screen, provider, repository, and route locations>

    $ sed -n '1,280p' src/features/sms-sync/index.tsx
    <confirmed local paged candidate state and candidateCount reload effect>

    $ sed -n '780,930p' src/lib/finance/repository.ts
    <confirmed pending SMS page query and current transaction list query>

Do not include secrets from `.env`, `.env.local`, `.env.hotupdater`, deployment logs, or user data.

## Interfaces and Dependencies

Expected interfaces at the end of the plan:

- `TransactionListQuery` in `src/lib/finance/types.ts`.
- `SmsCandidateQuery` or equivalent in `src/lib/finance/types.ts`.
- `listTransactions(query?: TransactionListQuery)` in `src/lib/finance/repository.ts`.
- `listPendingSmsCandidatesPage(input: SmsCandidateQuery & { limit: number; offset: number })` in `src/lib/finance/repository.ts`.
- Provider methods and state for transaction query controls in `src/lib/finance/provider.tsx`.
- SMS review local query state and passive row removal in `src/features/sms-sync/index.tsx`.
- Updated toolbar components in:
  - `src/features/tabs/transactions/components/transactions-toolbar.tsx`
  - `src/features/sms-sync/components/*`

Use existing dependencies only: React, React Native, Expo Router, `@shopify/flash-list`, existing base components, SQLite repository helpers, theme tokens, and `useAppTheme()`.

## Revision Notes

- 2026-05-19 20:14Z: Created initial plan from `docs/ai/plans/TEMPLATE.md`. Reason: document the requested significant feature work before implementation, per `AGENTS.md` and `PLANS.md`.
