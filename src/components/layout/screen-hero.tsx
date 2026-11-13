import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useCallback,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/auth-context';
import { AppHeader } from '@/components/layout/app-header';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type ScreenHeroProps = {
  title: string;
  subtitle?: string;
  /** Overrides initials derived from the signed-in user. */
  avatarInitials?: string;
  onBack?: () => void;
  /** When true (or when `onBack` is set), shows the hero back control. */
  showBack?: boolean;
  /** Small muted line above the title (e.g. today's date). */
  eyebrow?: string;
  /** Defaults to true so the bell matches profile availability on every screen. */
  showNotifications?: boolean;
  /** Optional control beside the title (share, live badge…). */
  trailing?: ReactNode;
  /** Controls rendered below the subtitle (search chrome, filters…). */
  children?: ReactNode;
};

type HeroSize = {
  width: number;
  height: number;
};

type HeroBackdropProps = {
  size: HeroSize;
};

function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Decorative Obsidian backdrop: hero gradient with a soft Emerald (`heroAccent`) glow.
 * Sized in pixels from the parent `onLayout` — percentage Svg height does not
 * reliably fill content-sized parents on Android.
 */
function HeroBackdrop({ size }: HeroBackdropProps) {
  const { theme } = useTheme();
  const { heroBackground, heroBackgroundEnd, heroAccent } = theme.colors;
  const reactId = useId();
  const idPrefix = reactId.replace(/:/g, '');
  const baseId = `${idPrefix}-heroBase`;
  const glowId = `${idPrefix}-heroGlow`;

  if (size.width <= 0 || size.height <= 0) {
    return null;
  }

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={baseId} x1="0" y1="0" x2="0.35" y2="1">
          <Stop offset="0" stopColor={heroBackground} />
          <Stop offset="1" stopColor={heroBackgroundEnd} />
        </LinearGradient>
        <RadialGradient id={glowId} cx="0.86" cy="0.28" rx="0.55" ry="0.7">
          <Stop offset="0" stopColor={heroAccent} stopOpacity="0.28" />
          <Stop offset="1" stopColor={heroAccent} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={size.width} height={size.height} fill={`url(#${baseId})`} />
      <Rect width={size.width} height={size.height} fill={`url(#${glowId})`} />
    </Svg>
  );
}

/** Light status-bar content while the dark hero is on screen (tab screens stay mounted). */
function HeroStatusBar() {
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  return focused ? <StatusBar style="light" /> : null;
}

function handleDefaultBack(onBack?: () => void) {
  if (onBack) {
    onBack();
  } else if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export function ScreenHero({
  title,
  subtitle,
  avatarInitials,
  onBack,
  showBack,
  eyebrow,
  showNotifications = true,
  trailing,
  children,
}: ScreenHeroProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, isAuthenticated } = useAuth();
  const resolvedInitials =
    avatarInitials ??
    (isAuthenticated ? initialsOf(user?.name) || undefined : undefined);
  const [size, setSize] = useState<HeroSize>({ width: 0, height: 0 });
  const shouldShowBack = showBack ?? onBack != null;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  }, []);

  return (
    <View style={[styles.hero, { paddingTop: insets.top }]} onLayout={onLayout}>
      <HeroBackdrop size={size} />
      <HeroStatusBar />

      <AppHeader
        variant="hero"
        avatarInitials={resolvedInitials}
        showNotifications={showNotifications}
        hasUnread
      />

      <View style={styles.body}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <View style={styles.titleRow}>
          {shouldShowBack ? (
            <Pressable
              onPress={() => handleDefaultBack(onBack)}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <Icon name="back" size={22} color={theme.colors.heroText} />
            </Pressable>
          ) : null}
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children ? <View style={styles.children}>{children}</View> : null}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    hero: {
      backgroundColor: theme.colors.heroBackground,
      borderBottomLeftRadius: theme.radius.xxl,
      borderBottomRightRadius: theme.radius.xxl,
      overflow: 'hidden',
      paddingBottom: theme.spacing.lg + theme.spacing.xs,
    },
    body: {
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.xs,
    },
    eyebrow: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.heroTextMuted,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    backBtn: {
      width: 36,
      height: 36,
      marginLeft: -theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      ...theme.textStyles.h1,
      color: theme.colors.heroText,
    },
    trailing: {
      flexShrink: 0,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.normal,
      color: theme.colors.heroTextMuted,
    },
    children: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm + 2,
    },
  });
}
