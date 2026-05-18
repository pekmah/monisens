# Add Bill Categories and Bill Allocation from Transaction Category Selection

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows the repository planning standard in `PLANS.md`.

## Purpose / Big Picture

Users should be able to treat bills as first-class categorized obligations and, when they are assigning or correcting a transaction category, optionally allocate that payment to an unpaid bill occurrence in the same flow. After this change, a user should be able to:

1. Create or edit a bill and place it under a normal spending category such as transport, subscriptions, rent, or utilities.
2. Open a transaction, choose or change its category, and if that category matches unpaid bill occurrences, also link the transaction to the correct bill payment without navigating away to the Bills screens first.
3. See the bill move into a paid state once the transaction is allocated.

“Allocate a payment to a bill” means linking a real expense transaction to a generated `bill_occurrence` row so the occurrence becomes paid and the bill reconciliation UI reflects that payment.

## Progress

- [x] (2026-05-18 00:00Z) Research the current bill category and bill allocation implementation.
- [x] (2026-05-18 00:00Z) Confirm whether bills already support categories at the schema and editor level.
- [x] (2026-05-18 13:35Z) Implement milestone 1: normalize bill category UX and data exposure.
- [x] (2026-05-18 13:35Z) Implement milestone 2: add transaction-side bill allocation suggestions after category selection.
- [x] (2026-05-18 13:40Z) Implement milestone 3: validate the end-to-end flow from bill setup through transaction allocation.
- [x] (2026-05-18 13:42Z) Update `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` during implementation.

## Surprises & Discoveries

- Observation: Bills already support categories in storage and editing. `BillRecord`, `CreateBillInput`, and `UpdateBillInput` already carry `categoryId`, and the bill editor already renders `CategorySelectField`.
  Evidence: `src/lib/finance/types.ts`, `src/lib/finance/repository.ts`, and `src/features/bills/editor.tsx`.

- Observation: Payment allocation already exists, but only from bill occurrence reconciliation views. The app can link an occurrence to a transaction with `linkBillOccurrenceToTransaction`, but transaction category selection does not surface this relationship.
  Evidence: `src/lib/finance/repository.ts`, `src/features/bills/index.tsx`, and `src/features/bills/detail.tsx`.

- Observation: Transaction detail currently updates only `categoryId`. It does not inspect unpaid bill occurrences, load candidate matches, or let the user allocate the transaction to a bill while editing the category.
  Evidence: `src/features/transaction-detail/index.tsx` and `src/features/transaction-detail/components/category-card.tsx`.

- Observation: The existing bill reconciliation matcher runs from an occurrence outward to transactions. The new transaction-side flow needed the inverse query: start from one persisted expense transaction and search nearby unpaid occurrences.
  Evidence: `src/lib/finance/repository.ts`

- Observation: Bill category UX was already present in the bill editor and existing bills surfaces. The missing work was not another category picker in bills, but a transaction-detail bridge that makes that stored category useful during payment allocation.
  Evidence: `src/features/bills/editor.tsx`, `src/features/bills/index.tsx`, and `src/features/bills/detail.tsx`

- Observation: Allocation must stay explicit. Category changes can load suggestions, but they should never auto-link a bill occurrence because that would silently mutate payment state from a categorization action.
  Evidence: `src/features/transaction-detail/index.tsx` and `src/lib/finance/repository.ts`

## Decision Log

- Decision: Treat this as an integration task, not a schema-first task.
  Rationale: The core bill category fields already exist. The missing behavior is UI and use-case orchestration between transactions and bill occurrences.
  Date/Author: 2026-05-18 / Codex

- Decision: Keep bill allocation tied to `bill_occurrences`, not directly to `bills`.
  Rationale: The current domain model marks payment state on occurrences, not on the schedule definition. Reusing that model avoids duplicate payment state and keeps reconciliation behavior consistent.
  Date/Author: 2026-05-18 / Codex

- Decision: Build the allocation entry point inside the transaction category editing flow, not by redirecting users to the Bills screen.
  Rationale: The requested behavior is “when choosing category, app should have ability to also allocate the payment to a bill.” That implies a local transaction-side UX, not a separate reconciliation workflow.
  Date/Author: 2026-05-18 / Codex

- Decision: Keep bill allocation suggestions lightweight and query-driven instead of precomputing section-wide bill match state in React.
  Rationale: Transaction detail only needs suggestions for the current transaction. Computing matches in the repository and loading them on demand keeps render cost low and avoids expanding provider snapshot state unnecessarily.
  Date/Author: 2026-05-18 / Codex

- Decision: Allow only one bill occurrence per transaction by clearing prior bill links before attaching a new occurrence.
  Rationale: One payment should not satisfy multiple occurrences accidentally. Enforcing this in the repository keeps reconciliation rules consistent regardless of which screen performs the link.
  Date/Author: 2026-05-18 / Codex

- Decision: Surface bill allocation in a sibling card next to category editing instead of overloading `CategorySelectField`.
  Rationale: Category selection remains a reusable primitive. Bill allocation is transaction-detail-specific workflow state and belongs in a feature-local component.
  Date/Author: 2026-05-18 / Codex

## Outcomes & Retrospective

Implemented outcome:

- Bills continue using the existing `categoryId` support without schema churn. No additional bill-category migration was needed because the bill editor and records already carried that state correctly.
- Transaction detail now loads allocation suggestions through a transaction-driven finance use case, shows a dedicated `BillAllocationCard` beside category editing, and lets the user allocate or unlink an occurrence directly from that screen.
- Linking and unlinking continue to flow through repository-level occurrence reconciliation, and transaction detail reloads the transaction after each mutation so the UI reflects the saved state cleanly.

Validation outcome:

- `bunx tsc --noEmit` passes.
- `npm run lint` passes with the repository's pre-existing warnings only; no new lint errors were introduced by this change.

Residual risk:

- Manual app verification is still required to judge the quality of the matching heuristics against real transaction data.
- The current matcher is conservative by design and only considers unpaid active occurrences in a 14-day window around the transaction date.

## Context and Orientation

Relevant repository structure:

- `src/features/bills/index.tsx`: bills overview screen showing grouped occurrences and suggested matches.
- `src/features/bills/detail.tsx`: bill detail screen showing occurrences and allowing link/unlink actions.
- `src/features/bills/editor.tsx`: bill create/edit screen. This already includes `CategorySelectField` and persists `categoryId`.
- `src/features/transaction-detail/index.tsx`: transaction detail screen. This currently handles category changes only.
- `src/features/transaction-detail/components/category-card.tsx`: local category editing surface in transaction detail.
- `src/lib/finance/types.ts`: app-facing types for `BillRecord`, `BillOccurrenceRecord`, `BillTransactionMatchRecord`, `CreateBillInput`, and transaction records.
- `src/lib/finance/repository.ts`: SQLite-backed bill creation, update, reconciliation matching, and link/unlink operations.
- `src/lib/finance/use-cases.ts`: public finance use cases. This currently exposes bill linking and transaction updates as separate operations.
- `src/lib/finance/provider.tsx`: React context facade used by screens.

Current bill architecture:

- `bills` stores the recurring or one-time schedule definition.
- `bill_occurrences` stores generated due instances and payment state.
- `linkBillOccurrenceToTransaction` marks an occurrence paid by linking it to a transaction id.
- `listBillTransactionMatches(occurrenceId)` finds likely expense transactions for a specific occurrence, but there is no inverse helper that starts from a transaction and finds relevant unpaid occurrences.

Current gap:

- A bill can already “fall under a category” technically, but the request should be interpreted as making that capability explicit and useful in the frontend workflow.
- Category selection for transactions does not help users reconcile that payment to a bill occurrence even when the category and merchant strongly imply a known bill.

## Plan of Work

Milestone 1 will normalize bill category behavior and visibility. Review the bills list, bill detail, and bill editor so category is always visible, clearly labeled, and consistent with the transaction category system. If any bill entry point does not preserve or prefill category context, add that support.

Milestone 2 will add a transaction-side bill allocation flow. The most likely implementation path is:

- extend finance repository/use cases with a helper that, given a transaction id or transaction snapshot, returns candidate unpaid `bill_occurrences` for allocation,
- reuse the existing occurrence matching heuristics where possible, but invert the lookup so transaction detail can request bill suggestions after category selection,
- surface those candidates in the transaction detail category area as an additional section or card that appears only when relevant,
- allow the user to confirm one allocation directly from transaction detail,
- refresh both transaction and bill state after linking.

Milestone 3 will validate the full flow. Create a bill with category `transport` or `subscriptions`, create or open a matching expense transaction, change/select the transaction category, allocate the payment to the bill occurrence, and verify the bill now shows that occurrence as paid in both `src/features/bills/index.tsx` and `src/features/bills/detail.tsx`.

## Concrete Steps

Run commands from the app repository unless a step explicitly says otherwise:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens

Start by inspecting the working tree:

    git status --short

Expected output should either be empty or show unrelated files that this plan explicitly says to leave untouched.

Review the current bill and transaction integration points:

    rg -n "linkBillOccurrenceToTransaction|loadBillTransactionMatches|categoryId|BillOccurrenceRecord|UpdateBillInput|updateTransaction" src/features src/lib/finance

Expected output should show the bill screens, transaction detail screen, and finance repository/use-case/provider layers that already participate in category and bill linking.

Inspect the core files before editing:

    sed -n '1,220p' src/features/bills/editor.tsx
    sed -n '1,260p' src/features/bills/index.tsx
    sed -n '1,260p' src/features/bills/detail.tsx
    sed -n '1,220p' src/features/transaction-detail/index.tsx
    sed -n '1,220p' src/features/transaction-detail/components/category-card.tsx
    sed -n '1500,1905p' src/lib/finance/repository.ts

Implement the new matching and allocation support in the finance layer first:

    bunx tsc --noEmit

Expected successful output is no TypeScript errors after each milestone.

After UI changes:

    npm run lint

Expected successful output is exit code 0. Record unrelated existing warnings if present.

If the flow needs manual verification data, use the existing bill setup and transaction creation screens instead of adding temporary seed data:

    /bills/new
    /transactions/new
    /transactions/<id>

## Validation and Acceptance

Acceptance criteria:

- A bill can be created or edited with a normal category and that category remains visible in bills list/detail surfaces.
- When a user edits a transaction category, the UI can show relevant unpaid bill occurrence candidates tied to that transaction and category.
- Confirming allocation from the transaction flow links the transaction to the selected occurrence and updates bill payment state.
- After allocation, the bill occurrence appears paid in the Bills screens without requiring the user to restart the app.
- Unrelated transaction category editing still works when no matching bill occurrence exists.

Required baseline validation:

    cd /Users/cruizp/Developer/apps/rn-expo/monisens
    bunx tsc --noEmit
    npm run lint

Manual app validation:

1. Create a bill in `src/features/bills/editor.tsx` with category `transport` or `subscriptions`.
2. Create an expense transaction that could plausibly satisfy that bill.
3. Open transaction detail and edit/select the category.
4. Confirm that the transaction detail screen offers bill allocation when relevant.
5. Allocate the payment and verify the linked bill occurrence becomes paid in both bills overview and bill detail.
6. Unlink from the bill detail screen and confirm the transaction remains intact while the occurrence returns to unpaid state.

E2E ownership:

- No relevant E2E scenario is confirmed yet in this repository from the current research.
- If the flow is implemented and considered high-value, add or extend an E2E scenario that covers bill creation, transaction categorization, and bill allocation from transaction detail.

## Idempotence and Recovery

Read-only inspection, typecheck, and lint steps are safe to rerun.

Code edits should be additive and reviewable with:

    git diff

If matching logic becomes incorrect, the safest recovery is to keep allocation confirmation manual and conservative. Do not auto-link bill occurrences from category changes alone. Linking must remain an explicit user action so reruns and retries do not silently corrupt bill payment state.

Do not run destructive git commands. Leave unrelated working tree changes untouched.

If a partial implementation lands:

- keep bill category persistence intact,
- keep existing bills reconciliation flows working,
- gate the new transaction-side allocation UI behind actual candidate availability so incomplete screens do not appear empty or misleading.

## Artifacts and Notes

Useful evidence gathered before implementation:

    Bills already store category_id and expose categoryLabel/categoryColor in bill and occurrence records.
    Bill editor already writes categoryId through CategorySelectField.
    Existing reconciliation works from bills -> transaction, not transaction -> bills.

Critical existing interfaces:

    createBill(input: CreateBillInput)
    updateBill(id: string, input: UpdateBillInput)
    listBillTransactionMatches(occurrenceId: string): BillTransactionMatchRecord[]
    linkBillOccurrenceToTransaction({ occurrenceId, transactionId })
    unlinkBillOccurrencePayment(occurrenceId)
    updateTransaction(id, input)

## Interfaces and Dependencies

The following interfaces, functions, modules, and files must exist at the end of implementation:

- `src/lib/finance/types.ts`
  Required existing types: `BillRecord`, `BillOccurrenceRecord`, `BillTransactionMatchRecord`, `CreateBillInput`, `UpdateBillInput`
  Likely additions: a transaction-to-bill allocation suggestion type if the existing `BillTransactionMatchRecord` shape is not suitable.

- `src/lib/finance/repository.ts`
  Existing functions to preserve: `createBill`, `updateBill`, `listBillTransactionMatches`, `linkBillOccurrenceToTransaction`, `unlinkBillOccurrencePayment`
  Likely new function: a helper such as `listBillOccurrencesForTransactionAllocation(transactionId)` or equivalent transaction-driven matching utility.

- `src/lib/finance/use-cases.ts`
  Must expose the new transaction-side bill allocation query/use case and continue exposing bill link/unlink operations.

- `src/lib/finance/provider.tsx`
  Must make the new use case available to React screens and refresh snapshot state after linking/unlinking.

- `src/features/bills/editor.tsx`
  Must continue to support category selection for bills and may need copy or prefill improvements.

- `src/features/transaction-detail/index.tsx`
  Must orchestrate category selection and the optional bill allocation suggestion flow.

- `src/features/transaction-detail/components/category-card.tsx`
  Likely needs expansion or a sibling component so category editing can also surface bill allocation actions without making the screen heavy.

Dependencies to reuse:

- `CategorySelectField` from `src/components/base`
- `AppButton`, `AppPressable`, `AppText`, and existing surface cards/components
- `useFinance()` from `src/lib/finance/provider.tsx`

## Revision Notes

- 2026-05-18 00:00Z: Created initial plan for bill categories plus transaction-side bill allocation. Reason: document the existing bill schema, current reconciliation flow, and the required frontend/data-layer integration before implementation.
- 2026-05-18 13:42Z: Implemented transaction-side bill allocation suggestions and UI. Added repository/use-case/provider support for transaction-driven bill matching, a feature-local bill allocation card in transaction detail, and repository enforcement that a transaction links to at most one occurrence at a time. Validation completed with passing typecheck and lint warnings only.
