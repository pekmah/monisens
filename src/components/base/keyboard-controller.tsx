import { StyleSheet, type ViewStyle } from 'react-native';
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
  const containerThemeStyle = getContainerThemeStyle(backgroundColor);

  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      style={[styles.container, containerThemeStyle, style]}
      {...props}>
      {children}
    </KeyboardAwareScrollView>
  );
}

function getContainerThemeStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
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

export default KeyboardController;
