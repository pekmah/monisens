import { ActivityIndicator, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { AppPressable } from '@/components/base/app-pressable';
import { AppText } from '@/components/base/app-text';
import { useAppTheme } from '@/hooks/use-app-theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  fullWidth?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
  variant?: AppButtonVariant;
};

export function AppButton({
  disabled,
  fullWidth,
  loading,
  style,
  title,
  variant = 'primary',
  ...props
}: AppButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.error
        : variant === 'secondary'
          ? theme.colors.surfaceContainerHighest
          : 'transparent';
  const color =
    variant === 'primary'
      ? theme.colors.onPrimary
      : variant === 'danger'
        ? theme.colors.onError
        : variant === 'secondary'
          ? theme.colors.onSurface
          : theme.colors.primary;

  return (
    <AppPressable
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor,
          borderRadius: theme.radii.sm,
          opacity: isDisabled ? 0.6 : 1,
        },
        fullWidth ? styles.fullWidth : undefined,
        style,
      ]}
      {...props}>
      {loading ? <ActivityIndicator color={color} /> : <AppText style={{ color }} variant="labelMd">{title}</AppText>}
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  fullWidth: {
    width: '100%',
  },
});

export default AppButton;
