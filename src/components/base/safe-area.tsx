import { StyleSheet } from 'react-native';
import {
  SafeAreaView as NativeSafeAreaView,
  type SafeAreaViewProps,
} from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';

import type { PropsWithChildren } from 'react';

export type AppSafeAreaProps = PropsWithChildren<
  SafeAreaViewProps & {
    lightColor?: string;
    darkColor?: string;
  }
>;

export function AppSafeArea({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  lightColor,
  darkColor,
  style,
  ...props
}: AppSafeAreaProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <NativeSafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor }, style]}
      {...props}>
      {children}
    </NativeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppSafeArea;
