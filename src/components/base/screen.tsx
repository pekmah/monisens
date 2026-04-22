import { ScrollView, StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';

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
  const contentStyle = [
    styles.content,
    padded ? { padding: theme.spacing.lg } : undefined,
    contentContainerStyle,
  ];

  return (
    <AppSafeArea {...props}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          style={[styles.container, style]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[contentStyle, style]}>{children}</View>
      )}
    </AppSafeArea>
  );
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
