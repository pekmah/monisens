import "@/lib/configure-default-fonts";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { HotUpdater } from "@hot-updater/react-native";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { ToastProvider } from "@/components/toast";
import { font } from "@/constants/fonts";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { FinanceProvider } from "@/lib/finance";
import { getHotUpdaterOptions, OtaUpdateController } from "@/lib/ota-updates";
import { getThemes } from "@/lib/theme";
import { ThemeControllerProvider } from "@/lib/theme-controller";

export const unstable_settings = {
  anchor: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [fontsLoaded] = useFonts({
    [font.regular]: Inter_400Regular,
    [font.medium]: Inter_500Medium,
    [font.semiBold]: Inter_600SemiBold,
    [font.bold]: Inter_700Bold,
    [font.headerRegular]: Manrope_400Regular,
    [font.headerMedium]: Manrope_500Medium,
    [font.headerSemiBold]: Manrope_600SemiBold,
    [font.headerBold]: Manrope_700Bold,
    [font.headerExtraBold]: Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeControllerProvider>
      <FinanceProvider>
        <RootNavigator />
      </FinanceProvider>
    </ThemeControllerProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { appTheme, navigationTheme } = useMemo(
    () => getThemes(colorScheme),
    [colorScheme],
  );

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(appTheme.colors.background);
  }, [appTheme.colors.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider value={navigationTheme}>
          <BottomSheetModalProvider>
            <ToastProvider>
              <OtaUpdateController>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="transactions/new"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="transactions/[id]"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="sms/review"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="sms/ai"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/appearance"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/security"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/categories"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/sms"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/sms-sources"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/sms-source-editor"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/sms-ignored"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/data"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/updates"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/backups"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                  />
                </Stack>
              </OtaUpdateController>
              <StatusBar style={appTheme.dark ? "light" : "dark"} />
            </ToastProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default HotUpdater.wrap(getHotUpdaterOptions())(RootLayout);
