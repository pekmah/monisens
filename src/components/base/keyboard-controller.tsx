import { StyleSheet } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

import { useThemeColor } from '@/hooks/use-theme-color';

import type { PropsWithChildren } from 'react';

const DEFAULT_BOTTOM_OFFSET = 60;

export type KeyboardControllerProps = PropsWithChildren<
  KeyboardAwareScrollViewProps & {
    lightColor?: string;
    darkColor?: string;
  }
>;

export function KeyboardController({
  children,
  bottomOffset = DEFAULT_BOTTOM_OFFSET,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  lightColor,
  darkColor,
  style,
  ...props
}: KeyboardControllerProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      style={[styles.container, { backgroundColor }, style]}
      {...props}>
      {children}
    </KeyboardAwareScrollView>
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

export default KeyboardController;
