# Bills UI Refresh and Keyboard-Aware Forms

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows the repository planning standard in `PLANS.md`.

## Purpose / Big Picture

The Bills screen should feel like a modern operational surface instead of a long undifferentiated list. Users should be able to quickly see monthly commitment, urgent bills, the next upcoming obligations, schedule health, and paid items without scanning every row.

Scrollable screens that contain inputs should use the app's keyboard-aware infrastructure backed by `react-native-keyboard-controller`, so focused fields and actions remain reachable on iOS and Android.

## Progress

- [x] (2026-05-19 21:42Z) Inspect bills screens, current scroll wrappers, and installed keyboard package.
- [x] (2026-05-19 21:50Z) Replace shared `Screen` scroll mode with `KeyboardController`.
- [x] (2026-05-19 21:53Z) Update Budgeting tab's input scroll container to use `KeyboardController`.
- [x] (2026-05-19 22:05Z) Redesign Bills index with summary, upcoming bills, and tabs.
- [x] (2026-05-19 22:15Z) Validate with type check, lint, inline-style search, and diff review.

## Surprises & Discoveries

- Observation: `react-native-keyboard-controller` is already installed and `KeyboardProvider` already wraps the app.
  Evidence: `src/app/_layout.tsx` imports `KeyboardProvider`, and `package.json` lists `react-native-keyboard-controller`.

- Observation: The bill editor already uses `KeyboardScreen`.
  Evidence: `src/features/bills/editor.tsx` renders `KeyboardScreen` around the form.

- Observation: Several non-bill scrollable form screens use `Screen scroll`, so making that base path keyboard-aware improves multiple screens without broad feature rewrites.
  Evidence: `src/features/sms-import/index.tsx`, `src/features/settings-categories/index.tsx`, and `src/features/settings-sms-sources/editor.tsx` use `Screen contentContainerStyle={...} scroll`.

- Observation: The bills editor and detail files still had existing JSX inline style objects.
  Evidence: targeted `rg` found dynamic `backgroundColor` and `borderColor` objects in `src/features/bills/editor.tsx` and `src/features/bills/detail.tsx`.

- Observation: `npm run lint` still passes with the same warning set observed before this update.
  Evidence: lint exit code was 0 with 17 warnings in AI, finance, and theme modules.

## Decision Log

- Decision: Implement tabs directly in `src/features/bills/index.tsx` instead of adding navigation routes.
  Rationale: The user asked for tabs as a design improvement, and local segmented tabs keep the bill overview fast and focused.
  Date/Author: 2026-05-19 / Codex

- Decision: Use `KeyboardController` inside shared `Screen` scroll mode.
  Rationale: This applies keyboard-aware behavior to existing scrollable form screens that already follow the base screen API.
  Date/Author: 2026-05-19 / Codex

- Decision: Update the Budgeting tab directly because it owns its own `ScrollView` inside `TabScreen`.
  Rationale: The shared `Screen` change does not affect tab screens that do not use `Screen scroll`.
  Date/Author: 2026-05-19 / Codex

## Outcomes & Retrospective

Implemented.

- `src/features/bills/index.tsx` now presents Bills as a modern overview with monthly commitment, metric tiles, upcoming bills, and local tabs for due, upcoming, schedules, and paid.
- Bill transaction-match confirmation still works from the due list.
- `src/components/base/screen.tsx` now uses `KeyboardController` for `scroll` mode, making existing `Screen scroll` form screens keyboard-aware through `react-native-keyboard-controller`.
- `src/features/tabs/budgeting/index.tsx` now uses `KeyboardController` for its create-budget form area because that screen owns a custom scroll container inside `TabScreen`.
- Touched bills/base/budgeting files no longer use JSX inline style objects for dynamic styles.

Validation:

- `bunx tsc --noEmit` passed.
- `npm run lint` passed with the existing 17 warnings recorded above.
- `git diff --check` passed.
- Targeted inline-style search over touched bills, budgeting, and base keyboard/screen files returned no matches.

## Validation and Acceptance

Required checks:

    bunx tsc --noEmit
    npm run lint
    git diff --check

Acceptance criteria:

- Bills index has a modern summary, an upcoming bills display, and tabs for due, upcoming, schedules, and paid.
- Bill rows still allow transaction match confirmation.
- Shared `Screen scroll` flows are keyboard-aware through `react-native-keyboard-controller`.
- Budgeting tab's create-budget form is keyboard-aware.
- Touched JSX avoids inline style objects.
