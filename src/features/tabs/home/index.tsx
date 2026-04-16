import { Image } from 'expo-image';
import { Platform, StyleSheet, Switch } from 'react-native';

import { AppButton } from '@/components/base';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useThemeController } from '@/lib/theme-controller';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { colorScheme, setThemeOverride } = useThemeController();
  const isDark = colorScheme === 'dark';

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: theme.colors.surfaceContainerLow,
        dark: theme.colors.surfaceContainerLow,
      }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView
        lightColor={theme.colors.surfaceContainerLowest}
        darkColor={theme.colors.surfaceContainerHighest}
        style={styles.themeSwitchCard}>
        <ThemedView
          lightColor={theme.colors.surfaceContainerLowest}
          darkColor={theme.colors.surfaceContainerHighest}
          style={styles.themeSwitchText}>
          <ThemedText type="defaultSemiBold">Dark mode</ThemedText>
          <ThemedText darkColor={theme.colors.onSurfaceVariant} lightColor={theme.colors.mutedText}>
            Toggle the Stitch light and dark palettes.
          </ThemedText>
        </ThemedView>
        <Switch
          ios_backgroundColor={theme.colors.surfaceContainerHighest}
          onValueChange={(value) => setThemeOverride(value ? 'dark' : 'light')}
          thumbColor={isDark ? theme.colors.primary : theme.colors.surfaceContainerLowest}
          trackColor={{
            false: theme.colors.surfaceContainerHighest,
            true: theme.colors.primaryContainer,
          }}
          value={isDark}
        />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Toast checks</ThemedText>
        <ThemedText darkColor={theme.colors.onSurfaceVariant} lightColor={theme.colors.mutedText}>
          Trigger stacked floating notifications using the Stitch light and dark palettes.
        </ThemedText>
        <ThemedView style={styles.toastGrid}>
          <AppButton
            title="Success"
            onPress={() =>
              showToast({
                description: 'Global Holdings Wire Processed',
                title: 'Payment Complete',
                variant: 'success',
              })
            }
            style={styles.toastButton}
          />
          <AppButton
            title="Info"
            variant="secondary"
            onPress={() =>
              showToast({
                description:
                  'Consider tax-loss harvesting before the end of the month. This may reduce taxable gains while keeping your portfolio allocation aligned with your current strategy.',
                title: 'Tax Optimization Tip',
                variant: 'info',
              })
            }
            style={styles.toastButton}
          />
          <AppButton
            title="Warning"
            variant="ghost"
            onPress={() =>
              showToast({
                description: 'Legacy authentication detected',
                title: 'Security Update Required',
                variant: 'warning',
              })
            }
            style={styles.toastButton}
          />
          <AppButton
            title="Error"
            variant="danger"
            onPress={() =>
              showToast({
                description: 'Insufficient cash balance for purchase',
                title: 'Transaction Declined',
                variant: 'error',
              })
            }
            style={styles.toastButton}
          />
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{' '}
          <ThemedText type="defaultSemiBold">src/features/tabs/home/index.tsx</ThemedText> to see
          changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">src/app</ThemedText> directory. This will move the
          current <ThemedText type="defaultSemiBold">src/app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  themeSwitchCard: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    padding: 16,
  },
  themeSwitchText: {
    flex: 1,
    gap: 4,
  },
  toastButton: {
    flex: 1,
    minWidth: 120,
  },
  toastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
