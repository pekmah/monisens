
import { KeyboardController } from '@/components/base/keyboard-controller';
import { AppSafeArea, type AppSafeAreaProps } from '@/components/base/safe-area';
import { useAppTheme } from '@/hooks/use-app-theme';

import type { ViewStyle } from 'react-native';
import type { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

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
  const paddedThemeStyle = getPaddedThemeStyle(theme.spacing.lg);

  return (
    <AppSafeArea>
      <KeyboardController
        contentContainerStyle={[
          padded ? paddedThemeStyle : undefined,
          contentContainerStyle,
        ]}
        {...props}>
        {children}
      </KeyboardController>
    </AppSafeArea>
  );
}

function getPaddedThemeStyle(padding: number): ViewStyle {
  return {
    padding,
  };
}

export default KeyboardScreen;
