import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeedbackIllustration } from '@/components/brand/illustrations';
import { QueueRings } from '@/components/charging/queue-rings';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';
import type { QueueMember } from '@/types/queue';
import { getQueueRank } from '@/utils/queue-display';

type QueueBookingConfirmationSheetProps = {
  visible: boolean;
  stationName?: string;
  member: QueueMember | null;
  onConfirm: () => void;
};

export function QueueBookingConfirmationSheet({
  visible,
  stationName,
  member,
  onConfirm,
}: QueueBookingConfirmationSheetProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!member) {
    return null;
  }

  const rank = getQueueRank(member);

  return (
    <BottomSheet visible={visible} onClose={onConfirm} contentStyle={styles.content}>
      <FeedbackIllustration kind="success" size={84} />

      <Text style={styles.title}>You&apos;re in the queue</Text>
      <Text style={styles.subtitle}>
        {stationName
          ? `Your spot at ${stationName} is reserved.`
          : 'Your queue spot is reserved.'}
      </Text>

      <View style={styles.rankPanel}>
        <QueueRings rank={rank} size={148} caption="Your position" />
        <Text style={styles.rankHint}>We&apos;ll notify you as your turn approaches.</Text>
      </View>

      <Button label="Done" onPress={onConfirm} accessibilityLabel="Done" />
    </BottomSheet>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { alignItems: 'stretch', gap: theme.spacing.md, paddingTop: theme.spacing.sm },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      letterSpacing: -0.8,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    rankPanel: {
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xl,
      borderRadius: theme.radius.xxl,
      backgroundColor: theme.colors.heroBackground,
    },
    rankHint: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.heroTextMuted,
      textAlign: 'center',
    },
  });
}
