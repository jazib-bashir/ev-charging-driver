import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { QueueMember } from '@/types/queue';
import { getQueueRank } from '@/utils/queue-display';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ON_ACCENT = '#0F172A';

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
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 24,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, visible]);

  if (!member) {
    return null;
  }

  const rank = getQueueRank(member);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onConfirm}>
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onConfirm}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, theme.spacing.md),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          <View style={styles.iconWrap}>
            <Icon name="checkmark" size={32} color={theme.colors.brand} />
          </View>

          <Text style={styles.title}>You&apos;re in the queue</Text>
          <Text style={styles.subtitle}>
            {stationName
              ? `Your spot at ${stationName} is reserved.`
              : 'Your queue spot is reserved.'}
          </Text>

          <View style={styles.rankCard}>
            <Text style={styles.rankLabel}>Your position</Text>
            <Text style={styles.rankValue}>#{rank}</Text>
            <Text style={styles.rankHint}>We&apos;ll notify you as your turn approaches.</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheetContainer: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  handlePill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandMuted,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  rankCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.brandMuted,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  rankValue: {
    fontSize: 40,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  rankHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: ON_ACCENT,
  },
});
