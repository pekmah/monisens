import { StyleSheet, View, type ScrollViewProps, type ViewProps, type ViewStyle } from 'react-native';

import { KeyboardController } from '@/components/base/keyboard-controller';
import { AppSafeArea, type AppSafeAreaProps } from '@/components/base/safe-area';
import { useAppTheme } from '@/hooks/use-app-theme';

type BaseScreenProps = AppSafeAreaProps & {
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  padded?: boolean;
  scroll?: boolean;
};

export type ScreenProps = BaseScreenProps & ViewProps & Pick<ScrollViewProps, 'keyboardShouldPersistTaps'>;

export function Screen({
  children,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  padded = true,
  scroll,
  style,
  ...props
}: ScreenProps) {
  const theme = useAppTheme();
  const paddedThemeStyle = getPaddedThemeStyle(theme.spacing.lg);
  const contentStyle = [
    styles.content,
    padded ? paddedThemeStyle : undefined,
    contentContainerStyle,
  ];

  return (
    <AppSafeArea {...props}>
      {scroll ? (
        <KeyboardController
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          style={[styles.container, style]}>
          {children}
        </KeyboardController>
      ) : (
        <View style={[contentStyle, style]}>{children}</View>
      )}
    </AppSafeArea>
  );
}

function getPaddedThemeStyle(padding: number): ViewStyle {
  return {
    padding,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});

export default Screen;
