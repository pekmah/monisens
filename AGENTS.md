# AI Architecture Guide

This Expo app uses a feature-based architecture modeled after `reemio-app`.

## Related AI Guides

- Use `PLANS.md` for significant execution plans and keep plans in `docs/ai/plans/`.
- Use `docs/expo-app-architecture.md` for Expo, React Native, routing, performance, and folder ownership rules.
- Use `docs/app-coding-guidelines.md` for screen completeness, list refresh, mutation, form, and resource workflow expectations.
- Use `docs/frontend-architecture.md` for this app's route, feature, UI, data-layer, and performance map.

## Source Layout

- Keep Expo Router route files in `src/app`.
- Route files should stay thin. They may configure navigation/layouts, guards, and route metadata, but screen UI and business logic belongs in `src/features`.
- Put feature code under `src/features/<feature-name>`.
- Use this feature shape by default:
  - `index.tsx` for the feature's main screen or public entry point.
  - `components/` for components used only by that feature.
  - `lib/` for feature-local hooks, services, types, schemas, and utilities.
- Put reusable app-wide UI in `src/components`.
- Put app-wide constants in `src/constants`.
- Put app-wide hooks in `src/hooks`.
- Put cross-feature infrastructure in `src/lib`.
- Keep static images and other bundled assets in root `assets`.

## Imports

- Use the `@/` alias for local imports.
- `@/` resolves to `src` first, then the repo root for assets and configuration files.
- Do not import from another feature's private `components` or `lib` folder. If code must be shared, move it to `src/components`, `src/hooks`, or `src/lib`.
- Keep route imports one-way: `src/app` can import features, but features should not import route files from `src/app`.

## Fonts

- Inter is the default app font.
- Use `font` from `@/constants/fonts` instead of hardcoding font names. Use `font.regular`, `font.medium`, `font.semiBold`, and `font.bold` for Inter body text, and `font.headerRegular`, `font.headerMedium`, `font.headerSemiBold`, and `font.headerBold` for Manrope headers/titles.
- Load new Inter or Manrope weights in `src/app/_layout.tsx` and add them to `src/constants/fonts` before use.
- Keep React Navigation font configuration and React Native `Text`/`TextInput` defaults aligned with `font`.

## Theming

- Use the native React Native styling APIs (`StyleSheet`, inline style arrays, and typed style props). Do not add a UI framework such as NativeWind, Tamagui, Gluestack, or React Native Paper for this project.
- Keep theme tokens in `src/constants/theme.ts`. Add colors, spacing, sizes, font sizes, line heights, radii, typography, and elevation there before using new visual values in components.
- Do not hardcode reusable dimensions such as icon sizes, widths, heights, min heights, font sizes, line heights, or common gaps. Prefer `Sizes`, `FontSizes`, `LineHeights`, `Spacing`, and `Radii` from `@/constants/theme`, or their `theme.*` equivalents from `useAppTheme()`.
- Source product color tokens from the Stitch `Smart Spend Intelligence` design system unless the user explicitly changes the design direction.
- Support both light and dark mode for every reusable component. Prefer `useAppTheme()` for full theme access and `useThemeColor()` for one-off color lookups.
- Avoid 1px divider-first layouts. Follow the Stitch design direction by separating surfaces through tonal background changes, spacing, and subtle outline variants only when accessibility requires it.
- Keep Inter as the app default even when Stitch reference screens use display-oriented headline fonts.

## Component Structure

- Do not declare a React component inside the body of another component. Define child components at module scope or move them into a separate file. Nested component declarations are recreated on every parent render, which can cause unnecessary work and UI state loss.
- Feature-specific components must live in that feature's `src/features/<feature-name>/components` folder. Keep `src/features/<feature-name>/index.tsx` focused on screen orchestration and move screen sections, list rows, empty/loading states, and other JSX-heavy pieces into feature-local component files.

## Forms and Keyboard Handling

- All scrollable screens that contain inputs must handle the keyboard deliberately. Use the appropriate React Native keyboard-aware layout primitives, `keyboardShouldPersistTaps`, safe-area-aware padding, and content insets so focused inputs and primary actions remain reachable on iOS and Android.

## Comments

- Add comments while coding to explain what is happening in the codebase, especially around state transitions, data loading, optimistic updates, derived values, and non-obvious UI behavior. Keep comments useful and concise: explain intent and context, not what an obvious line of code already says.

## Feature Boundaries

- New user-facing workflows should start as a feature under `src/features`.
- Keep API calls, storage adapters, and domain types close to the feature unless they are used by multiple features.
- Avoid broad shared abstractions until at least two features need the same behavior.
- Keep generated or native files out of feature folders.
