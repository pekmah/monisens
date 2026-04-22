import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

import type { AppThemeName } from '@/constants/theme';
import {
  canDecreaseFontScale,
  canIncreaseFontScale,
  clampFontScale,
  DEFAULT_FONT_SCALE,
  getNextFontScale,
} from '@/lib/font-scale';
import {
  getStoredFontScale,
  getStoredThemeOverride,
  setStoredFontScale,
  setStoredThemeOverride,
} from '@/lib/settings-storage';

type ThemeControllerValue = {
  canDecreaseFontScale: boolean;
  canIncreaseFontScale: boolean;
  colorScheme: AppThemeName;
  decreaseFontScale: () => void;
  fontScale: number;
  increaseFontScale: () => void;
  setThemeOverride: (theme: AppThemeName | null) => void;
  setFontScale: (scale: number) => void;
  systemColorScheme: AppThemeName;
  themeOverride: AppThemeName | null;
  toggleTheme: () => void;
};

const ThemeControllerContext = createContext<ThemeControllerValue | null>(null);

export function ThemeControllerProvider({ children }: PropsWithChildren) {
  const nativeColorScheme = useNativeColorScheme();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [fontScale, setFontScaleState] = useState<number>(getStoredFontScale);
  const [themeOverride, setThemeOverrideState] = useState<AppThemeName | null>(
    getStoredThemeOverride
  );

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const setFontScale = useCallback((scale: number) => {
    const nextScale = clampFontScale(scale);
    setFontScaleState(nextScale);
    setStoredFontScale(nextScale);
  }, []);

  const setThemeOverride = useCallback((theme: AppThemeName | null) => {
    setThemeOverrideState(theme);
    setStoredThemeOverride(theme);
  }, []);

  const systemColorScheme: AppThemeName =
    hasHydrated && nativeColorScheme === 'dark' ? 'dark' : 'light';
  const colorScheme = themeOverride ?? systemColorScheme;

  const value = useMemo(
    () => ({
      canDecreaseFontScale: canDecreaseFontScale(fontScale),
      canIncreaseFontScale: canIncreaseFontScale(fontScale),
      colorScheme,
      decreaseFontScale: () => setFontScale(getNextFontScale(fontScale, 'decrease')),
      fontScale,
      increaseFontScale: () => setFontScale(getNextFontScale(fontScale, 'increase')),
      setThemeOverride,
      setFontScale,
      systemColorScheme,
      themeOverride,
      toggleTheme: () => setThemeOverride(colorScheme === 'dark' ? 'light' : 'dark'),
    }),
    [colorScheme, fontScale, systemColorScheme, themeOverride]
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
