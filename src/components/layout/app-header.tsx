import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { KonnectEvLogo } from '@/components/brand/konnectev-logo';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

/** Below this window width the logo shrinks (100dp is the brand minimum) so the row fits at 320dp. */
const COMPACT_WIDTH = 360;
const LOGO_WIDTH = 148;
const LOGO_WIDTH_COMPACT = 124;

type AppHeaderProps = {
  showNotifications?: boolean;
  hasUnread?: boolean;
  unreadCount?: number;
  avatarInitials?: string;
  onAvatarPress?: () => void;
  onNotificationsPress?: () => void;
  /** `hero` renders light-on-dark text for use inside `ScreenHero`. */
  variant?: 'default' | 'hero';
};

export function AppHeader({
  showNotifications = false,
  hasUnread = false,
  unreadCount = 0,
  avatarInitials,
  onAvatarPress,
  onNotificationsPress,
  variant = 'default',
}: AppHeaderProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_WIDTH;
  const logoWidth = compact ? LOGO_WIDTH_COMPACT : LOGO_WIDTH;
  const styles = useMemo(
    () => createStyles(theme, variant === 'hero'),
    [theme, variant],
  );
  const isHero = variant === 'hero';
  const logoTone = isHero || theme.isDark ? 'onDark' : 'onLight';
  const badgeLabel =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <View style={styles.row}>
      <View accessibilityRole="header" style={styles.brand}>
        <KonnectEvLogo width={logoWidth} tone={logoTone} />
      </View>

      <View style={styles.actions}>
        {showNotifications ? (
          <Pressable
            style={styles.bellWrap}
            onPress={
              onNotificationsPress ??
              (() => router.push('/notifications' as Href))
            }
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
          >
            <Icon
              name="bell"
              size={18}
              color={isHero ? theme.colors.heroText : theme.colors.textPrimary}
            />
            {badgeLabel ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{badgeLabel}</Text>
              </View>
            ) : hasUnread ? (
              <View style={styles.bellDot} />
            ) : null}
          </Pressable>
        ) : null}
        {avatarInitials ? (
          <Pressable
            style={styles.avatar}
            onPress={
              onAvatarPress ??
              (() => router.push('/(tabs)/profile' as Href))
            }
            accessibilityRole="button"
            accessibilityLabel="Driver profile"
          >
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  isHero: boolean,
) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    brand: {
      flexShrink: 1,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    bellWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isHero ? theme.colors.heroBorder : theme.colors.border,
      backgroundColor: isHero ? theme.colors.heroSurface : theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellDot: {
      position: 'absolute',
      top: 7,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: theme.colors.notification,
      borderWidth: 1.5,
      borderColor: isHero ? theme.colors.heroBackground : theme.colors.surface,
    },
    bellBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      backgroundColor: theme.colors.notification,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellBadgeText: {
      color: theme.colors.textInverse,
      fontSize: 9,
      lineHeight: 11,
      fontFamily: theme.typography.fontFamily.bold,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.onPrimary,
    },
  });
}
