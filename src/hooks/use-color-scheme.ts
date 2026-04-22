import { useThemeController } from '@/lib/theme-controller';

export function useColorScheme(): 'light' | 'dark' {
  return useThemeController().colorScheme;
}
