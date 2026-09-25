import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';

type ProfileHeroProps = {
  name: string;
  email: string;
  phone?: string | null;
  onEdit: () => void;
  disabled?: boolean;
};

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

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onEdit}
        disabled={disabled}
        style={styles.avatarButton}
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
      >
        <View style={styles.avatar}>
          <Icon name="user" size={36} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.editBadge}>
          <Icon name="create" size={13} color={theme.colors.textInverse} />
        </View>
      </Pressable>

      <Text style={styles.name}>{name || 'Driver'}</Text>
      <Text style={styles.email}>{email || '—'}</Text>
      {phoneLabel ? <Text style={styles.phone}>{phoneLabel}</Text> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      gap: 6,
    },
    avatarButton: {
      position: 'relative',
      marginBottom: theme.spacing.sm,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.iconBackground,
      borderWidth: 3,
      borderColor: theme.colors.surface,
      ...theme.shadows.card,
    },
    editBadge: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brand,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    name: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
      textAlign: 'center',
    },
    email: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    phone: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });
}
