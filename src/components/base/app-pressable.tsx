import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type PressableStyle = PressableProps['style'];

export type AppPressableProps = Omit<PressableProps, 'style'> & {
  disabledOpacity?: number;
  pressedOpacity?: number;
  style?: PressableStyle;
};

function resolveStyle(style: PressableStyle, pressed: boolean): StyleProp<ViewStyle> {
  return typeof style === 'function' ? style({ hovered: false, pressed }) : style;
}

export function AppPressable({
  disabled,
  disabledOpacity = 0.5,
  hitSlop = 8,
  pressedOpacity = 0.72,
  style,
  ...props
}: AppPressableProps) {
  const isDisabled = !!disabled;

  return (
    <Pressable
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        resolveStyle(style, pressed),
        {
          opacity: isDisabled ? disabledOpacity : pressed ? pressedOpacity : 1,
        },
      ]}
      {...props}
    />
  );
}

export default AppPressable;
