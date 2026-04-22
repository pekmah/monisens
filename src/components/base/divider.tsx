import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export type DividerProps = ViewProps & {
  inset?: boolean;
};

export function Divider({ inset, style, ...props }: DividerProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: theme.colors.outlineVariant,
          marginHorizontal: inset ? theme.spacing.lg : 0,
          opacity: 0.35,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});

export default Divider;
