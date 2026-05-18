# Expo App Architecture Guide

Use this file as the default AI coding guide for Monisens Expo + React Native work. It combines Expo Router structure, React Native performance guidance, and project-specific rules that keep the app scalable and smooth.

## 1. Architecture Goals

Every change should optimize for:

- Smooth user experience: avoid unnecessary re-renders, UI thread blocking, slow list rendering, nested virtualized lists, and heavy startup work.
- Clear ownership: route files compose screens; features own business logic; shared modules stay reusable.
- Type safety: TypeScript should describe data contracts, navigation params, component props, and domain models.
- Predictable growth: new workflows should fit the existing feature-based structure without broad shared abstractions too early.

## 2. Project Structure

This repo uses a feature-first structure with Expo Router routes kept thin.

```txt
src/
  app/                         # Expo Router route files only
  features/                    # Business features grouped by domain
    <feature>/
      index.tsx                # Feature screen or public entry point
      components/              # Feature-only components
      lib/                     # Feature-local hooks, services, schemas, types
  components/                  # Reusable app-wide UI
    base/
  constants/                   # Theme, fonts, and app constants
  hooks/                       # App-wide hooks
  lib/                         # Shared infrastructure, data stores, adapters
assets/                        # Static bundled assets
docs/                          # AI and contributor documentation
```

## 3. Route Rules

- `src/app` files should stay thin. They may configure layouts, redirects, guards, route metadata, or render a feature entry point.
- Screen UI and business logic belongs in `src/features`.
- Features must not import route files from `src/app`.
- Validate dynamic route params before loading data.
- Every nested screen should expose an obvious back or close affordance unless it is a root/tab surface.

## 4. Feature Module Standard

Use this feature shape by default:

```txt
src/features/<feature-name>/
  index.tsx
  components/
  lib/
```

Rules:

- `index.tsx` should orchestrate screen-level state, navigation, data loading, and feature components.
- Feature-specific JSX-heavy pieces, rows, empty states, loading states, and toolbars belong in `components/`.
- Feature-local hooks, services, types, schemas, and utilities belong in `lib/`.
- Promote code to `src/components`, `src/hooks`, or `src/lib` only after at least two features need it.
- Do not import from another feature's private `components` or `lib` folder.

## 5. Component Standards

- Use functional components.
- Define child components at module scope or in their own file. Do not declare a component inside another component body.
- Keep props explicit and typed.
- Avoid passing large objects when the component only needs a few fields.
- Prefer composition over broad flag props when variants become complex.
- Keep reusable app-wide components in `src/components`; keep feature-only components in `src/features/<feature>/components`.

## 6. Styling and Theming

Monisens uses native React Native styling APIs.

- Use `StyleSheet`, typed style props, and inline style arrays.
- Do not introduce NativeWind, Tamagui, Gluestack, React Native Paper, or another UI framework unless explicitly requested.
- Keep theme tokens in `src/constants/theme.ts`.
- Do not hardcode reusable dimensions such as icon sizes, min heights, font sizes, line heights, gaps, or radii. Use `Sizes`, `FontSizes`, `LineHeights`, `Spacing`, `Radii`, or `theme.*` values from `useAppTheme()`.
- Support light and dark mode for reusable components.
- Prefer tonal backgrounds, spacing, and subtle outlines over divider-heavy layouts.

## 7. Typography

- Use `font` from `@/constants/fonts` instead of hardcoding font names.
- Use Inter body weights through `font.regular`, `font.medium`, `font.semiBold`, and `font.bold`.
- Use Manrope header weights through `font.headerRegular`, `font.headerMedium`, `font.headerSemiBold`, and `font.headerBold`.
- Keep React Navigation font configuration and React Native `Text`/`TextInput` defaults aligned with `font`.

## 8. Lists and Performance

- Use a single virtualized list as the owning scroll container for large datasets.
- Do not nest `FlashList`, `FlatList`, or `SectionList` inside a `ScrollView`.
- Do not place a `FlashList` inside each section of another list. Flatten grouped data into rows when necessary.
- Memoize flattened rows and expensive derived values with stable dependencies.
- Keep `renderItem`, `keyExtractor`, separators, and row components stable.
- Avoid recalculating aggregate data inside every row render. Compute once per section or memoize in a dedicated component.
- Provide stable dimensions for repeated list rows and headers where practical so recycling does not shift layout.

## 9. Server State, Local State, and Mutations

- Use the existing data layer and query patterns in `src/lib` and feature `lib` folders.
- Mutations should refresh or invalidate every affected query/snapshot, not only the initiating screen.
- Optimistic updates should be paired with rollback or an explicit recovery path.
- Background sync, AI feedback, and remote queue work should not block local UI success unless the remote operation is required for correctness.
- API/storage errors should surface through shared UI feedback where available; avoid silent `void` promise failures for user-triggered actions.

## 10. Forms and Keyboard Handling

- All scrollable screens that contain inputs must handle keyboard behavior deliberately.
- Use appropriate keyboard-aware layout primitives, `keyboardShouldPersistTaps`, safe-area-aware padding, and content insets.
- Disable submit while a mutation is pending.
- Preserve edit-mode defaults from the loaded record.
- Create/update flows should navigate, refresh, or invalidate state predictably after success.

## 11. Comments

Comments should explain why code exists, what scenario is being handled, or what is not obvious from names.

Add comments when:

- A workaround exists for iOS, Android, Expo, Hermes, SQLite, permissions, navigation, file access, or OTA behavior.
- A condition handles a specific edge case.
- A value looks arbitrary, such as a timeout, retry count, threshold, cache time, or animation duration.
- Code prevents a non-obvious bug.
- A temporary compromise exists.

Do not comment obvious statements.

## 12. Validation

Baseline validation for app code:

```sh
bunx tsc --noEmit
npm run lint
```

For UI behavior, also verify manually in the app or through E2E flows when available. For OTA work, capture the safe deployment identifier and omit secrets.
