# App Coding Guidelines

These rules define the default behavior expected when building or changing Monisens screens. They are concrete so coding agents and contributors can use them as acceptance criteria.

## 1. Resource Screens Must Be Complete

Any resource that users can create in the app should expose the matching actions that the app domain allows.

Required actions:

- Create: show an entry point when the workflow supports creation.
- Read: list rows should open a detail view, modal, or full detail screen.
- Update: show edit actions where the domain supports changes.
- Delete, dismiss, archive, or remove: show destructive or terminal actions when the domain supports them.
- Domain actions: show status-specific actions such as accept, restore, retry, import, export, sync, link, unlink, confirm, or dismiss when those actions exist.

Rules:

- Do not hide core actions only behind a secondary route if the list is the primary management surface.
- If a row opens a detail modal, the modal should also expose the same primary actions where practical.
- Destructive actions must use confirmation UI and destructive visual treatment.
- Domain actions should update the visible UI automatically after success.

## 2. Lists Must Refresh Safely

Every data-backed list screen should support an intentional refresh path.

Rules:

- `FlashList`, `FlatList`, and `SectionList` screens should wire refresh props or a visible retry/refresh action when pull-to-refresh is not appropriate.
- Pull-to-refresh should refetch the list and any visible summary/KPI data that depends on the list.
- After create, update, delete, restore, import, sync, or domain actions, invalidate or refresh affected data.
- Empty, loading, error, and refreshing states must be visually distinct.
- Error states should include a retry action when recovery is possible.

## 3. Data State and Mutations

Rules:

- Use existing React Query, local SQLite, snapshot, or provider patterns already present in the feature.
- Query keys must include all context that changes the result.
- Mutations must invalidate or refresh every affected query/snapshot family.
- Optimistic updates are allowed only when rollback or eventual refresh is implemented.
- User-triggered mutation failures should be visible to the user unless the action is explicitly background-only.
- Background queue failures should log useful context and avoid blocking completed local actions.

## 4. Resource Row Standards

Rows should be actionable, scan-friendly, and stable.

Rules:

- Tapping the row should open the most useful read/detail surface.
- Action buttons should use icons for common commands when an icon exists.
- Icon-only buttons need accessibility labels and stable test IDs where practical.
- Rows should not resize unexpectedly when actions appear, load, or become disabled.
- Amounts, dates, statuses, and counterparties should use shared formatters.
- Status labels should be human-readable and should not expose raw enum names with underscores.

## 5. Forms and Submission

Forms must be safe to submit and retry.

Rules:

- Use schema validation or a clear typed validation helper for non-trivial forms.
- Disable submit while a mutation is pending.
- Preserve edit-mode defaults from the loaded resource.
- Create/update screens should navigate or refresh predictably after success.
- File import/export flows should show pending state, recoverable errors, and useful release-mode logs when failures are hard to reproduce.

## 6. Navigation and Route Files

Expo Router files should stay thin.

Rules:

- Route files in `src/app` should compose guards/layouts and render feature screens.
- Business logic belongs in `src/features/<feature>`.
- Dynamic route params must be validated before querying.
- Programmatic route strings should stay consistent with existing route patterns.
- Every nested screen must expose a visible back or close action unless it is a root/tab screen.

## 7. UI State Requirements

Every data-driven screen should handle:

- Initial loading.
- Empty result.
- Error with retry or recovery.
- Refreshing state.
- Mutation pending or disabled action state.
- Permission or capability-hidden actions when a workflow is not available.

Do not ship a list or detail screen that only works in the happy path.

## 8. Test IDs and E2E Readiness

Interactive workflows should be easy to automate.

Rules:

- Use stable `testID` values for critical create, edit, delete, filter, submit, retry, and row actions where practical.
- Prefer IDs based on resource IDs or stable slugs.
- Do not use display text as the only selector for critical flows when E2E coverage exists or is planned.
- New workflows should update or add E2E coverage when practical.

## 9. Styling and Interaction

Use existing app primitives and visual language.

Rules:

- Use shared UI primitives from `src/components/base` where they fit.
- Use theme tokens from `src/constants/theme.ts` and `useAppTheme()`.
- Edit actions use brand/neutral treatment.
- Destructive actions use error/destructive treatment.
- Status/domain actions use semantic colors: success, warning, danger/error, info, or neutral.
- Avoid nested cards and oversized decorative layouts for operational screens.
- Keep touch targets large enough for mobile use.
- Keep text inside buttons, rows, cards, headers, and badges from clipping across device sizes.

## 10. Definition of Done for Resource Work

Before considering a resource feature complete:

- [ ] The list can refresh or retry intentionally.
- [ ] Create, read, update, delete/remove, and domain actions are surfaced where the workflow allows.
- [ ] Actions update caches, snapshots, and visible UI automatically.
- [ ] Loading, empty, error, and retry states exist.
- [ ] Destructive actions have confirmation dialogs.
- [ ] Shared formatters are used for dates, money, and statuses.
- [ ] Critical actions have stable test IDs where practical.
- [ ] `bunx tsc --noEmit` passes.
- [ ] `npm run lint` passes or only reports unrelated existing warnings.
