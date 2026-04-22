import { Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";

import type { AppThemeName } from "@/constants/theme";
import { clampFontScale, DEFAULT_FONT_SCALE } from "@/lib/font-scale";

const FONT_SCALE_KEY = "preferences.fontScale";
const THEME_OVERRIDE_KEY = "preferences.themeOverride";

const nativeStorage = Platform.OS === "web" ? null : createMMKV();

function getWebStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getStoredFontScale() {
  if (Platform.OS === "web") {
    const value = getWebStorage()?.getItem(FONT_SCALE_KEY);
    return value ? clampFontScale(Number(value)) : DEFAULT_FONT_SCALE;
  }

  const value = nativeStorage?.getString(FONT_SCALE_KEY);
  return value ? clampFontScale(Number(value)) : DEFAULT_FONT_SCALE;
}

export function setStoredFontScale(value: number) {
  const normalizedValue = String(clampFontScale(value));

  if (Platform.OS === "web") {
    getWebStorage()?.setItem(FONT_SCALE_KEY, normalizedValue);
    return;
  }

  nativeStorage?.set(FONT_SCALE_KEY, normalizedValue);
}

export function getStoredThemeOverride() {
  const value =
    Platform.OS === "web"
      ? getWebStorage()?.getItem(THEME_OVERRIDE_KEY)
      : nativeStorage?.getString(THEME_OVERRIDE_KEY);

  return value === "light" || value === "dark" ? (value satisfies AppThemeName) : null;
}

export function setStoredThemeOverride(value: AppThemeName | null) {
  if (Platform.OS === "web") {
    const storage = getWebStorage();

    if (!storage) {
      return;
    }

    if (value) {
      storage.setItem(THEME_OVERRIDE_KEY, value);
    } else {
      storage.removeItem(THEME_OVERRIDE_KEY);
    }

    return;
  }

  if (value) {
    nativeStorage?.set(THEME_OVERRIDE_KEY, value);
  } else {
    nativeStorage?.remove(THEME_OVERRIDE_KEY);
  }
}
