import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import type { AppThemeName } from '@/constants/theme';

type ThemeControllerValue = {
  colorScheme: AppThemeName;
  setThemeOverride: (theme: AppThemeName | null) => void;
  systemColorScheme: AppThemeName;
  themeOverride: AppThemeName | null;
  toggleTheme: () => void;
};

const ThemeControllerContext = createContext<ThemeControllerValue | null>(null);

export function ThemeControllerProvider({ children }: PropsWithChildren) {
  const nativeColorScheme = useNativeColorScheme();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [themeOverride, setThemeOverride] = useState<AppThemeName | null>(null);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme: AppThemeName =
    hasHydrated && nativeColorScheme === 'dark' ? 'dark' : 'light';
  const colorScheme = themeOverride ?? systemColorScheme;

  const value = useMemo(
    () => ({
      colorScheme,
      setThemeOverride,
      systemColorScheme,
      themeOverride,
      toggleTheme: () => setThemeOverride((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [colorScheme, systemColorScheme, themeOverride]
  );

  return (
    <ThemeControllerContext.Provider value={value}>{children}</ThemeControllerContext.Provider>
  );
}

export function useThemeController() {
  const context = useContext(ThemeControllerContext);

  if (!context) {
    throw new Error('useThemeController must be used within ThemeControllerProvider');
  }

  return context;
}
