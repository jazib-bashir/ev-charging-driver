import { useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type SectionHeaderProps = {
  title: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Groups content: optional eyebrow, Space Grotesk title and a trailing text action. */
export function SectionHeader({ title, eyebrow, actionLabel, onActionPress, style }: SectionHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={10} accessibilityRole="button">
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    titles: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.colors.textLink,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      lineHeight: 25,
      letterSpacing: -0.4,
      color: theme.colors.textPrimary,
    },
    action: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      color: theme.colors.textLink,
    },
  });
}
