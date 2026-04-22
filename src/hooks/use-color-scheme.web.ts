import { useThemeController } from '@/lib/theme-controller';

export function useColorScheme() {
  return useThemeController().colorScheme;
}
