import { Text, TextInput } from 'react-native';

import { font } from '@/constants/fonts';

type DefaultableComponent = {
  defaultProps?: {
    style?: unknown;
    [key: string]: unknown;
  };
};

const defaultFontStyle = { fontFamily: font.regular };

function applyDefaultFont(Component: DefaultableComponent) {
  Component.defaultProps = {
    ...Component.defaultProps,
    style: [defaultFontStyle, Component.defaultProps?.style],
  };
}

applyDefaultFont(Text as DefaultableComponent);
applyDefaultFont(TextInput as DefaultableComponent);
