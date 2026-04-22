import { Feather } from '@expo/vector-icons';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFlashList, AppPressable, AppText } from '@/components/base';
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  description?: string;
  duration?: number;
  title: string;
  variant?: ToastVariant;
};

type ToastItem = Required<Pick<ToastOptions, 'duration' | 'variant'>> &
  Pick<ToastOptions, 'description' | 'title'> & {
    id: string;
  };

type ToastContextValue = {
  dismissToast: (id: string) => void;
  showToast: (toast: ToastOptions) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_DURATION = 15000;
const MAX_VISIBLE_TOASTS = 3;
const COLLAPSED_DESCRIPTION_LENGTH = 56;
const COLLAPSED_DESCRIPTION_HEIGHT = LineHeights.sm;
const EXPAND_ANIMATION_MS = 260;
const EXPANDED_DESCRIPTION_HEIGHT = Sizes['15xl'];

const toastMeta = {
  success: {
    background: '#ffffff',
    border: '#edf4ef',
    body: '#6d716d',
    closeBackground: '#f7faf7',
    icon: 'check-circle',
    iconBackground: '#edf7ef',
    iconColor: '#176b2d',
    shadow: '#dfece3',
    titleColor: '#1f211f',
    title: 'Payment Complete',
  },
  error: {
    background: '#fffdfd',
    border: '#f7e4e4',
    body: '#6d716d',
    closeBackground: '#fbf5f5',
    icon: 'x-octagon',
    iconBackground: '#faeeee',
    iconColor: '#bb2b2b',
    shadow: '#f1d7d7',
    titleColor: '#1f211f',
    title: 'Transaction Declined',
  },
  info: {
    background: '#ffffff',
    border: '#f5eaf9',
    body: '#6d716d',
    closeBackground: '#fbf7fd',
    icon: 'info',
    iconBackground: '#fbf2ff',
    iconColor: '#8b3bb8',
    shadow: '#eadbf4',
    titleColor: '#1f211f',
    title: 'Tax Optimization Tip',
  },
  warning: {
    background: '#fffdf9',
    border: '#f4e4c9',
    body: '#6d716d',
    closeBackground: '#fff8ed',
    icon: 'alert-triangle',
    iconBackground: '#fff3df',
    iconColor: '#f3a51b',
    shadow: '#f1dfc4',
    titleColor: '#1f211f',
    title: 'Security Update Required',
  },
} as const;

export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ description, duration = DEFAULT_DURATION, title, variant = 'info' }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: ToastItem = { description, duration, id, title, variant };

      setToasts((current) => [toast, ...current].slice(0, MAX_VISIBLE_TOASTS));
      timers.current.set(
        id,
        setTimeout(() => {
          dismissToast(id);
        }, duration)
      );

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[
          styles.host,
          {
            left: theme.spacing.lg,
            right: theme.spacing.lg,
            top: Math.max(insets.top, theme.spacing.lg) + theme.spacing.sm,
          },
        ]}>
        <AppFlashList
          data={toasts}
          keyExtractor={(toast) => toast.id}
          renderItem={({ item: toast, index }) => (
            <View style={index === 0 ? undefined : styles.stackedToast}>
              <ToastCard onDismiss={() => dismissToast(toast.id)} toast={toast} />
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

function ToastCard({
  onDismiss,
  toast,
}: {
  onDismiss: () => void;
  toast: ToastItem;
}) {
  const theme = useAppTheme();
  const meta = toastMeta[toast.variant];
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand = (toast.description?.length ?? 0) > COLLAPSED_DESCRIPTION_LENGTH;
  const progress = useDerivedValue(() => withTiming(isExpanded ? 1 : 0, { duration: EXPAND_ANIMATION_MS }));
  const animatedDescriptionStyle = useAnimatedStyle(() => {
    if (!canExpand) {
      return {};
    }

    return {
      maxHeight: interpolate(
        progress.value,
        [0, 1],
        [COLLAPSED_DESCRIPTION_HEIGHT, EXPANDED_DESCRIPTION_HEIGHT]
      ),
    };
  });

  const toggleExpanded = () => {
    setIsExpanded((current) => !current);
  };

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        theme.elevation.ambient,
        {
          backgroundColor: meta.background,
          borderColor: meta.border,
          shadowColor: meta.shadow,
        },
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: meta.iconBackground }]}>
        <Feather color={meta.iconColor} name={meta.icon} size={Sizes.xl} />
      </View>
      <View style={styles.copy}>
        <AppText style={[styles.title, { color: meta.titleColor }]} variant="titleMd">
          {toast.title}
        </AppText>
        {toast.description ? (
          <>
            {canExpand ? (
              <Animated.View style={[styles.descriptionClip, animatedDescriptionStyle]}>
                <AppText style={[styles.description, { color: meta.body }]} variant="bodyMd">
                  {toast.description}
                </AppText>
              </Animated.View>
            ) : (
              <AppText style={[styles.description, { color: meta.body }]} variant="bodyMd">
                {toast.description}
              </AppText>
            )}
            {canExpand ? (
              <AppPressable onPress={toggleExpanded} style={styles.expandButton}>
                <AppText style={[styles.expandText, { color: meta.iconColor }]} variant="labelMd">
                  {isExpanded ? 'Show less' : 'Show more'}
                </AppText>
              </AppPressable>
            ) : null}
          </>
        ) : null}
      </View>
      <AppPressable
        accessibilityLabel="Dismiss notification"
        onPress={onDismiss}
        style={[styles.dismiss, { backgroundColor: meta.closeBackground }]}>
        <AppText style={[styles.dismissText, { color: meta.body }]} variant="titleMd">
          ×
        </AppText>
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  description: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  descriptionClip: {
    overflow: 'hidden',
  },
  dismiss: {
    alignItems: 'center',
    borderColor: '#e5e7e5',
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    height: Sizes['6xl'],
    justifyContent: 'center',
    width: Sizes['6xl'],
  },
  dismissText: {
    color: '#6e736f',
    fontSize: FontSizes['2xl'],
    fontWeight: '300',
    lineHeight: LineHeights['3xl'],
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  expandText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  host: {
    maxWidth: Sizes['20xl'] + Sizes['17xl'] + Sizes['4xl'] + Sizes.xxs,
    pointerEvents: 'box-none',
    position: 'absolute',
    zIndex: 1000,
    ...(Platform.OS === 'web' ? { alignSelf: 'center' } : null),
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: Radii.full,
    height: Sizes['6xl'],
    justifyContent: 'center',
    width: Sizes['6xl'],
  },
  stackedToast: {
    marginTop: Sizes.sm + Sizes.xxs,
  },
  title: {
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.md,
  },
  toast: {
    alignItems: 'center',
    borderRadius: Radii.md + Sizes.xxs,
    borderWidth: Sizes.hairline,
    flexDirection: 'row',
    gap: Sizes.md + Sizes.xxs,
    minHeight: Sizes['13xl'] - Sizes.xxs,
    paddingHorizontal: Sizes['2xl'],
    paddingVertical: Sizes.md + Sizes.xxs,
  },
});
