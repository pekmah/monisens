# Monisens Frontend Architecture Map

This repo is an Expo React Native app using `expo-router` for file-based routing, native React Native styling APIs, and a local component system under `src/components`.

The app follows a feature-based architecture:

- route files in `src/app/` are thin entry points
- feature screens and logic live in `src/features/<feature>/...`
- reusable UI lives in `src/components`
- shared infrastructure lives in `src/lib`
- app-wide constants live in `src/constants`

## 1. Tech Stack

- Runtime: Expo SDK, React Native, React
- Navigation: Expo Router and React Navigation
- Styling: React Native `StyleSheet`, inline style arrays, and typed style props
- Fonts: Inter for body text and Manrope for headers through `src/constants/fonts.ts`
- Theme: tokens in `src/constants/theme.ts`, consumed with `useAppTheme()` and `useThemeColor()`
- Lists: `@shopify/flash-list` wrapped by `src/components/base/app-flash-list.tsx`
- Local finance data: SQLite-backed repository and use cases under `src/lib/finance`
- Server state: React Query where used by feature/shared data modules
- OTA: Hot Updater configured by `hot-updater.config.ts`

## 2. Folder Responsibility Map

### Routing

`src/app/` is the route tree. Route files should render feature entry points and keep UI/business logic out of route files.

### Features

`src/features/` owns user-facing verticals such as:

- `tabs/dashboard`
- `tabs/transactions`
- `tabs/settings`
- `transaction-entry`
- `transaction-detail`
- `sms-sync`
- `sms-import`
- `settings-categories`
- `bills`

Feature-specific components must live in that feature's `components/` folder.

### Shared UI

`src/components/base/` contains reusable primitives such as buttons, text, screen layout, pressables, bottom sheets, category fields, and FlashList wrappers.

### Theme and Fonts

- `src/constants/theme.ts`: spacing, sizes, radii, type scale, colors, and elevation tokens
- `src/constants/fonts.ts`: font family names and weights
- `src/hooks/use-app-theme.ts`: full theme access
- `src/hooks/use-theme-color.ts`: one-off color lookup

### Finance/Data Layer

- `src/lib/finance/repository.ts`: SQLite reads and writes
- `src/lib/finance/use-cases.ts`: domain operations and orchestration
- `src/lib/finance/provider.tsx`: React context facade for screens
- `src/lib/finance/types.ts`: app-facing finance domain types
- `src/lib/ai/`: AI queue, transport, and feedback support

## 3. Route-to-Feature Pattern

Route files should look like thin wrappers:

```tsx
import SmsReviewScreen from "@/features/sms-sync";

export default SmsReviewScreen;
```

If a route needs params, validate them in the feature entry point or a feature-local helper before loading data.

## 4. UI Composition Pattern

Feature `index.tsx` files should orchestrate:

- data loading
- screen-level state
- navigation calls
- callbacks passed to child components

Feature components should render:

- list rows
- headers/toolbars
- empty/loading/error states
- cards and sections
- reusable pieces that are not needed outside the feature

Promote a component to `src/components` only when it is app-wide or at least two features need it.

## 5. Performance Map

High-risk performance areas:

- Transactions list: keep a single top-level `FlashList`; flatten grouped sections into rows.
- SMS review queue: avoid remounting rows while bottom sheets or modals are dismissing.
- Backup/import flows: avoid large synchronous reads on the JS thread where async file APIs exist.
- AI queue operations: keep background queue work from blocking local user actions unless required.

Rules:

- Keep expensive derived values in `useMemo`.
- Keep list renderers in `useCallback`.
- Avoid nested virtualized lists.
- Avoid declaring child components inside parent component bodies.
- Avoid parsing formatted labels to recover raw values; carry raw data needed for calculations.

## 6. Release and Debugging Notes

For release-mode diagnostics, prefer structured `console.log`, `console.warn`, and `console.error` prefixes that identify the subsystem, for example `[MonisensBackup]` or `[MonisensAI]`.

Temporary debug data and temporary logs must be gated, documented, and removed before final commit unless the user explicitly asks to keep them.

For OTA deployment, use the scripts in `package.json` and record safe deployment IDs only. Do not paste secrets or full env files into plans, commits, or chat.
