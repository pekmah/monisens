import { Platform } from 'react-native';

import { FontFamilies } from '@/constants/fonts';

export type AppThemeName = 'light' | 'dark';

export type AppThemeColors = {
  background: string;
  error: string;
  errorContainer: string;
  errorDim: string;
  icon: string;
  inverseOnSurface: string;
  inversePrimary: string;
  inverseSurface: string;
  mutedText: string;
  onBackground: string;
  onError: string;
  onErrorContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  onSecondary: string;
  onSecondaryContainer: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  onTertiary: string;
  onTertiaryContainer: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  primaryContainer: string;
  primaryDim: string;
  primaryFixed: string;
  primaryFixedDim: string;
  secondary: string;
  secondaryContainer: string;
  secondaryDim: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  surface: string;
  surfaceBright: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLow: string;
  surfaceContainerLowest: string;
  surfaceDim: string;
  surfaceTint: string;
  surfaceVariant: string;
  tabIconDefault: string;
  tabIconSelected: string;
  tertiary: string;
  tertiaryContainer: string;
  tertiaryDim: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  text: string;
  tint: string;
};

export type AppTheme = {
  name: AppThemeName;
  dark: boolean;
  colors: AppThemeColors;
  elevation: typeof Elevation;
  fonts: typeof Fonts;
  radii: typeof Radii;
  spacing: typeof Spacing;
  typography: typeof Typography;
};

const lightColors = {
  background: '#fcf9f8',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  errorDim: '#ba1a1a',
  icon: '#707a6c',
  inverseOnSurface: '#f3f0ef',
  inversePrimary: '#88d982',
  inverseSurface: '#313030',
  mutedText: '#40493d',
  onBackground: '#1c1b1b',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#cbffc2',
  onPrimaryFixed: '#002204',
  onPrimaryFixedVariant: '#005312',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#003670',
  onSecondaryFixed: '#001b3d',
  onSecondaryFixedVariant: '#00468c',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#40493d',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#fcecff',
  onTertiaryFixed: '#2f004b',
  onTertiaryFixedVariant: '#6a1b9a',
  outline: '#707a6c',
  outlineVariant: '#bfcaba',
  primary: '#0d631b',
  primaryContainer: '#2e7d32',
  primaryDim: '#0d631b',
  primaryFixed: '#a3f69c',
  primaryFixedDim: '#88d982',
  secondary: '#005db7',
  secondaryContainer: '#64a1ff',
  secondaryDim: '#005db7',
  secondaryFixed: '#d6e3ff',
  secondaryFixedDim: '#a9c7ff',
  surface: '#fcf9f8',
  surfaceBright: '#fcf9f8',
  surfaceContainer: '#f0edec',
  surfaceContainerHigh: '#ebe7e7',
  surfaceContainerHighest: '#e5e2e1',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#dcd9d9',
  surfaceTint: '#1b6d24',
  surfaceVariant: '#e5e2e1',
  tabIconDefault: '#707a6c',
  tabIconSelected: '#0d631b',
  tertiary: '#7a2faa',
  tertiaryContainer: '#954bc5',
  tertiaryDim: '#7a2faa',
  tertiaryFixed: '#f4d9ff',
  tertiaryFixedDim: '#e4b5ff',
  text: '#1c1b1b',
  tint: '#0d631b',
} satisfies AppThemeColors;

const darkColors = {
  background: '#100e0d',
  error: '#ff716c',
  errorContainer: '#9f0519',
  errorDim: '#d7383b',
  icon: '#afaaa8',
  inverseOnSurface: '#585453',
  inversePrimary: '#006e36',
  inverseSurface: '#fff8f5',
  mutedText: '#afaaa8',
  onBackground: '#ffffff',
  onError: '#490006',
  onErrorContainer: '#ffa8a3',
  onPrimary: '#005f2e',
  onPrimaryContainer: '#002f13',
  onPrimaryFixed: '#004a22',
  onPrimaryFixedVariant: '#006a34',
  onSecondary: '#005e3e',
  onSecondaryContainer: '#e1ffeb',
  onSecondaryFixed: '#00492f',
  onSecondaryFixedVariant: '#006946',
  onSurface: '#ffffff',
  onSurfaceVariant: '#afaaa8',
  onTertiary: '#005361',
  onTertiaryContainer: '#004956',
  onTertiaryFixed: '#00333d',
  onTertiaryFixedVariant: '#005361',
  outline: '#797473',
  outlineVariant: '#4b4746',
  primary: '#6dfe9c',
  primaryContainer: '#19be64',
  primaryDim: '#5def8f',
  primaryFixed: '#6dfe9c',
  primaryFixedDim: '#5def8f',
  secondary: '#73fbbc',
  secondaryContainer: '#006c48',
  secondaryDim: '#64ecaf',
  secondaryFixed: '#73fbbc',
  secondaryFixedDim: '#64ecaf',
  surface: '#100e0d',
  surfaceBright: '#2f2b2a',
  surfaceContainer: '#1c1918',
  surfaceContainerHigh: '#221f1d',
  surfaceContainerHighest: '#282523',
  surfaceContainerLow: '#151312',
  surfaceContainerLowest: '#000000',
  surfaceDim: '#100e0d',
  surfaceTint: '#6dfe9c',
  surfaceVariant: '#282523',
  tabIconDefault: '#afaaa8',
  tabIconSelected: '#6dfe9c',
  tertiary: '#7ce6ff',
  tertiaryContainer: '#00dcfe',
  tertiaryDim: '#00cded',
  tertiaryFixed: '#00dcfe',
  tertiaryFixedDim: '#00cded',
  text: '#ffffff',
  tint: '#6dfe9c',
} satisfies AppThemeColors;

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const Radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
} as const;

export const Elevation = {
  none: {
    elevation: 0,
    shadowOpacity: 0,
  },
  ambient: {
    elevation: 8,
    shadowColor: lightColors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
  },
} as const;

export const Typography = {
  displayLg: {
    fontFamily: FontFamilies.bold,
    fontSize: 56,
    fontWeight: '700' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  headlineSm: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleMd: {
    fontFamily: FontFamilies.medium,
    fontSize: 18,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  bodyMd: {
    fontFamily: FontFamilies.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyLg: {
    fontFamily: FontFamilies.regular,
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  labelMd: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 16,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    mono: 'ui-monospace',
    rounded: FontFamilies.semiBold,
    sans: FontFamilies.regular,
    serif: 'ui-serif',
  },
  default: {
    mono: 'monospace',
    rounded: FontFamilies.semiBold,
    sans: FontFamilies.regular,
    serif: 'serif',
  },
  web: {
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    rounded: FontFamilies.semiBold,
    sans: FontFamilies.regular,
    serif: "Georgia, 'Times New Roman', serif",
  },
});

export const AppThemes = {
  light: {
    name: 'light',
    dark: false,
    colors: lightColors,
    elevation: Elevation,
    fonts: Fonts,
    radii: Radii,
    spacing: Spacing,
    typography: Typography,
  },
  dark: {
    name: 'dark',
    dark: true,
    colors: darkColors,
    elevation: Elevation,
    fonts: Fonts,
    radii: Radii,
    spacing: Spacing,
    typography: Typography,
  },
} as const satisfies Record<AppThemeName, AppTheme>;

export function getAppTheme(themeName: AppThemeName) {
  return AppThemes[themeName];
}
