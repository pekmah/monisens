import { ThemeProvider } from '@react-navigation/native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '@/lib/configure-default-fonts';
import 'react-native-reanimated';

import { ToastProvider } from '@/components/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeControllerProvider } from '@/lib/theme-controller';
import { getThemes } from '@/lib/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
      <RootNavigator />
    </ThemeControllerProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { appTheme, navigationTheme } = useMemo(() => getThemes(colorScheme), [colorScheme]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(appTheme.colors.background);
  }, [appTheme.colors.background]);

  return (
    <KeyboardProvider>
      <ThemeProvider value={navigationTheme}>
        <ToastProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style={appTheme.dark ? 'light' : 'dark'} />
        </ToastProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}
