import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type ProfileHeroProps = {
  name: string;
  email: string;
  phone?: string | null;
  onEdit: () => void;
  disabled?: boolean;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '';
  }
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Obsidian identity card: emerald initials avatar, contact lines and an edit affordance. */
export function ProfileHero({
  name,
  email,
  phone,
  onEdit,
  disabled = false,
}: ProfileHeroProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const phoneLabel = phone?.trim() || null;
  const emailLabel = email.trim() && email.trim() !== '—' ? email.trim() : null;
  const initials = initialsOf(name);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        {initials ? (
          <Text style={styles.initials}>{initials}</Text>
        ) : (
          <Icon name="user" size={30} color={theme.colors.onPrimary} />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {name || 'Driver'}
        </Text>
        {phoneLabel ? (
          <Text style={styles.lineText} numberOfLines={1}>
            {phoneLabel}
          </Text>
        ) : null}
        {emailLabel ? (
          <Text style={styles.lineText} numberOfLines={1}>
            {emailLabel}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onEdit}
        disabled={disabled}
        hitSlop={8}
        style={({ pressed }) => [
          styles.edit,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
      >
        <Icon name="create" size={18} color={theme.colors.heroText} />
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 20,
      borderRadius: theme.radius.xxl,
      backgroundColor: theme.colors.heroBackground,
      borderWidth: 1,
      borderColor: theme.colors.heroBorder,
      ...theme.shadows.raised,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    initials: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 24,
      letterSpacing: -0.5,
      color: theme.colors.onPrimary,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    name: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.4,
      color: theme.colors.heroText,
    },
    lineText: {
      flexShrink: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: theme.colors.heroTextMuted,
    },
    edit: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.heroSurface,
      borderWidth: 1,
      borderColor: theme.colors.heroBorder,
    },
    pressed: {
      opacity: 0.8,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
