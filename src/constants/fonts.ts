export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  headerRegular: "Manrope_400Regular",
  headerMedium: "Manrope_500Medium",
  headerSemiBold: "Manrope_600SemiBold",
  headerBold: "Manrope_700Bold",
  headerExtraBold: "Manrope_800ExtraBold",
} as const;

export const FontFamilies = font;

export type FontToken = keyof typeof font;
