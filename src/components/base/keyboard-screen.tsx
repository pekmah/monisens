import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

import { AppSafeArea, type AppSafeAreaProps } from '@/components/base/safe-area';
import { KeyboardController } from '@/components/base/keyboard-controller';
import { useAppTheme } from '@/hooks/use-app-theme';

export type KeyboardScreenProps = AppSafeAreaProps &
  KeyboardAwareScrollViewProps & {
    padded?: boolean;
  };

export function KeyboardScreen({
  children,
  contentContainerStyle,
  padded = true,
  ...props
}: KeyboardScreenProps) {
  const theme = useAppTheme();

  return (
    <AppSafeArea>
      <KeyboardController
        contentContainerStyle={[
          padded ? { padding: theme.spacing.lg } : undefined,
          contentContainerStyle,
        ]}
        {...props}>
        {children}
      </KeyboardController>
    </AppSafeArea>
  );
}

export default KeyboardScreen;
