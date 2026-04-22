import { Typography } from "@/constants/theme";

import type { TextStyle } from "react-native";

export type AppTextVariant = keyof typeof Typography;

export const FONT_SCALE_STEPS = [0.9, 1, 1.1, 1.2, 1.3] as const;
export const DEFAULT_FONT_SCALE = 1;

const scalableVariants = new Set<AppTextVariant>([
  "bodyMd",
  "bodyLg",
  "labelMd",
  "titleMd",
]);

export function clampFontScale(value: number) {
  return FONT_SCALE_STEPS.reduce((closest, step) =>
    Math.abs(step - value) < Math.abs(closest - value) ? step : closest,
  );
}

export function canDecreaseFontScale(value: number) {
  return FONT_SCALE_STEPS.indexOf(clampFontScale(value)) > 0;
}

export function canIncreaseFontScale(value: number) {
  return FONT_SCALE_STEPS.indexOf(clampFontScale(value)) < FONT_SCALE_STEPS.length - 1;
}

export function getNextFontScale(value: number, direction: "decrease" | "increase") {
  const currentIndex = FONT_SCALE_STEPS.indexOf(clampFontScale(value));
  const nextIndex =
    direction === "increase"
      ? Math.min(currentIndex + 1, FONT_SCALE_STEPS.length - 1)
      : Math.max(currentIndex - 1, 0);

  return FONT_SCALE_STEPS[nextIndex];
}

export function getFontScaleLabel(value: number) {
  const scale = clampFontScale(value);

  if (scale <= 0.9) {
    return "Smaller";
  }

  if (scale >= 1.3) {
    return "Largest";
  }

  if (scale >= 1.2) {
    return "Larger";
  }

  if (scale > DEFAULT_FONT_SCALE) {
    return "Large";
  }

  return "Default";
}

export function shouldScaleVariant(variant: AppTextVariant) {
  return scalableVariants.has(variant);
}

export function getScaledTypographyStyle(style: TextStyle, fontScale: number): TextStyle {
  const scale = clampFontScale(fontScale);

  return {
    ...style,
    fontSize:
      typeof style.fontSize === "number" ? Math.round(style.fontSize * scale) : style.fontSize,
    lineHeight:
      typeof style.lineHeight === "number"
        ? Math.round(style.lineHeight * scale)
        : style.lineHeight,
  };
}
