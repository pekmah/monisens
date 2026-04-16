import { StyleSheet, View, type ViewProps } from 'react-native';

import { AppText } from '@/components/base/app-text';
import { AppButton, type AppButtonProps } from '@/components/base/button';
import { Sizes } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type EmptyStateProps = ViewProps & {
  action?: Pick<AppButtonProps, 'onPress' | 'title' | 'variant'>;
  description?: string;
  title: string;
};

export function EmptyState({ action, description, style, title, ...props }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.md, padding: theme.spacing.xl }, style]} {...props}>
      <View style={styles.copy}>
        <AppText style={styles.centerText} variant="titleMd">
          {title}
        </AppText>
        {description ? (
          <AppText color="mutedText" style={styles.centerText} variant="bodyMd">
            {description}
          </AppText>
        ) : null}
      </View>
      {action ? <AppButton {...action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centerText: {
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: Sizes.sm - Sizes.xxs,
  },
});

export default EmptyState;
