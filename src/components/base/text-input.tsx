import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/base/app-text';
import { Sizes, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type AppTextInputProps = TextInputProps & {
  error?: string;
  helperText?: string;
  label?: string;
};

export function AppTextInput({
  editable = true,
  error,
  helperText,
  label,
  placeholderTextColor,
  style,
  ...props
}: AppTextInputProps) {
  const theme = useAppTheme();
  const supportingText = error ?? helperText;

  return (
    <View style={[styles.container, { gap: theme.spacing.xs }]}>
      {label ? <AppText variant="labelMd">{label}</AppText> : null}
      <TextInput
        editable={editable}
        placeholderTextColor={placeholderTextColor ?? theme.colors.mutedText}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceContainerLowest,
            borderColor: error ? theme.colors.error : theme.colors.outlineVariant,
            borderRadius: theme.radii.sm,
            color: theme.colors.text,
            fontFamily: theme.typography.bodyLg.fontFamily,
            fontSize: theme.typography.bodyLg.fontSize,
            opacity: editable ? 1 : 0.6,
          },
          style,
        ]}
        {...props}
      />
      {supportingText ? (
        <AppText color={error ? 'error' : 'mutedText'} variant="labelMd">
          {supportingText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: Sizes['10xl'],
    paddingHorizontal: Sizes.md + Sizes.xxs,
    paddingVertical: Spacing.md,
  },
});

export default AppTextInput;
