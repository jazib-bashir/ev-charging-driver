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

const ON_ACCENT = '#0F172A';

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
        style={[styles.avatarButton, disabled && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
      >
        <View style={styles.avatar}>
          <Icon name="user" size={40} color={theme.colors.textMuted} />
        </View>
        <View style={styles.editBadge}>
          <Icon name="create" size={13} color={ON_ACCENT} />
        </View>
      </Pressable>

      <Text style={styles.name}>{name || 'Driver'}</Text>
      {phoneLabel ? <Text style={styles.phone}>{phoneLabel}</Text> : null}
      {email.trim() ? <Text style={styles.email}>{email.trim()}</Text> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 4,
      gap: 6,
    },
    avatarButton: {
      position: 'relative',
      marginBottom: 10,
    },
    disabled: {
      opacity: 0.55,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
      borderWidth: 2,
      borderColor: theme.colors.selectionBorder,
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
      backgroundColor: theme.colors.accent,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    name: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      lineHeight: 30,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.2,
    },
    phone: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    email: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
      textAlign: 'center',
      opacity: 0.9,
    },
  });
}
