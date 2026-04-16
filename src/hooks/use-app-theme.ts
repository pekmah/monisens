import { getAppTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  return getAppTheme(useColorScheme());
}
