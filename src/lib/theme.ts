import type { Theme as NavigationTheme } from '@react-navigation/native';

import { FontFamilies } from '@/constants/fonts';
import { type AppTheme, type AppThemeName, getAppTheme } from '@/constants/theme';

const navigationFonts = {
  regular: {
    fontFamily: FontFamilies.regular,
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: FontFamilies.medium,
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: FontFamilies.bold,
    fontWeight: '700' as const,
  },
  heavy: {
    fontFamily: FontFamilies.bold,
    fontWeight: '700' as const,
  },
};

export function createNavigationTheme(appTheme: AppTheme): NavigationTheme {
  return {
    dark: appTheme.dark,
    colors: {
      background: appTheme.colors.background,
      border: appTheme.colors.outlineVariant,
      card: appTheme.colors.surfaceContainerLow,
      notification: appTheme.colors.error,
      primary: appTheme.colors.primary,
      text: appTheme.colors.onSurface,
    },
    fonts: navigationFonts,
  };
}

export function getThemes(themeName: AppThemeName) {
  const appTheme = getAppTheme(themeName);

  return {
    appTheme,
    navigationTheme: createNavigationTheme(appTheme),
  };
}
