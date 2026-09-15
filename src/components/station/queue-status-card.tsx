import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { theme } from '@/theme';
import type { QueueMember } from '@/types/queue';
import { formatQueueMemberState } from '@/types/queue';
import {
  formatArrivalWindow,
  formatAssignedEvse,
  formatEstimatedTurn,
  formatEvseBay,
  formatEvseConnectorPower,
  formatEvseHeadline,
  getPeopleAhead,
  getQueueRank,
  getQueueStatusHeadline,
  getQueueStatusSubheadline,
  shouldShowQueuePosition,
  shouldShowQueueTiming,
} from '@/utils/queue-display';

type QueueStatusCardProps = {
  membership: QueueMember;
  isLeaving?: boolean;
  onLeave?: () => void;
};

function QueueInfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, highlight && styles.infoValueHighlight]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function AssignedEvseSection({ membership }: { membership: QueueMember }) {
  const evseHeadline = formatEvseHeadline(membership.allocation);
  const connectorPower = formatEvseConnectorPower(membership.allocation);
  const bayLabel = formatEvseBay(membership.allocation);

  if (!evseHeadline) {
    return null;
  }

  return (
    <View style={styles.assignedEvseSection}>
      <Text style={styles.assignedEvseHeadline}>{evseHeadline}</Text>
      {connectorPower ? (
        <Text style={styles.assignedEvseDetail}>{connectorPower}</Text>
      ) : null}
      {bayLabel ? <Text style={styles.assignedEvseBay}>{bayLabel}</Text> : null}
    </View>
  );
}

function FindingEvseSection() {
  return (
    <View style={styles.findingEvseSection}>
      <ActivityIndicator color={theme.colors.brand} />
      <Text style={styles.findingEvseText}>Finding a compatible EVSE…</Text>
    </View>
  );
}

export function QueueStatusCard({
  membership,
  isLeaving = false,
  onLeave,
}: QueueStatusCardProps) {
  const isQueued = membership.state === 'QUEUED';
  const isApproaching = membership.state === 'APPROACHING';
  const showQueuePosition = shouldShowQueuePosition(membership.state);
  const rank = showQueuePosition ? getQueueRank(membership) : 0;
  const peopleAhead = showQueuePosition ? getPeopleAhead(membership) : 0;
  const showTiming = shouldShowQueueTiming(membership.state);
  const estimatedTurn = showTiming
    ? formatEstimatedTurn(membership.estimatedTurnAt)
    : null;
  const arrivalWindow = showTiming
    ? formatArrivalWindow(membership.arrivalWindowStart, membership.arrivalWindowEnd)
    : null;
  const assignedEvse = formatAssignedEvse(membership.allocation);
  const canLeave = isQueued;
  const hasAllocation = !!membership.allocation;

  const handleLeavePress = () => {
    if (!onLeave || isLeaving) {
      return;
    }

    Alert.alert(
      'Leave queue?',
      'You will lose your place in line at this station.',
      [
        { text: 'Stay in queue', style: 'cancel' },
        { text: 'Leave queue', style: 'destructive', onPress: onLeave },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Icon name="list" size={18} color={theme.colors.brand} />
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{getQueueStatusHeadline(membership.state)}</Text>
            <Badge label="Booked" variant="available" />
          </View>
          <Text style={styles.subtitle}>
            {getQueueStatusSubheadline(membership.state, hasAllocation)}
          </Text>
        </View>
      </View>

      {showQueuePosition ? (
        <View style={styles.rankBanner}>
          <Text style={styles.rankNumber}>#{rank}</Text>
          <View style={styles.rankCopy}>
            <Text style={styles.rankLabel}>Your place in line</Text>
            <Text style={styles.rankDetail}>
              {peopleAhead === 0
                ? 'You are next'
                : `${peopleAhead} driver${peopleAhead === 1 ? '' : 's'} ahead`}
            </Text>
          </View>
        </View>
      ) : isApproaching ? (
        hasAllocation ? (
          <AssignedEvseSection membership={membership} />
        ) : (
          <FindingEvseSection />
        )
      ) : null}

      <View style={styles.detailsSection}>
        <QueueInfoRow label="Status" value={formatQueueMemberState(membership.state)} />
        {estimatedTurn ? (
          <QueueInfoRow label="Estimated turn" value={estimatedTurn} />
        ) : null}
        {arrivalWindow ? (
          <QueueInfoRow label="Recommended arrival" value={arrivalWindow} />
        ) : null}
        {!isApproaching && assignedEvse ? (
          <QueueInfoRow
            label="Assigned EVSE"
            value={assignedEvse}
            highlight
          />
        ) : null}
      </View>

      {canLeave && onLeave ? (
        <Pressable
          style={({ pressed }) => [
            styles.leaveButton,
            (pressed || isLeaving) && styles.leaveButtonPressed,
          ]}
          onPress={handleLeavePress}
          disabled={isLeaving}
          accessibilityRole="button"
          accessibilityLabel="Leave queue"
        >
          {isLeaving ? (
            <ActivityIndicator color={theme.colors.textSecondary} />
          ) : (
            <Text style={styles.leaveButtonText}>Leave queue</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.brandMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brandDark,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  rankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  rankNumber: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brand,
    letterSpacing: -1,
    minWidth: 56,
    textAlign: 'center',
  },
  rankCopy: {
    flex: 1,
    gap: 2,
  },
  rankLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  rankDetail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  assignedEvseSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
  },
  assignedEvseHeadline: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brandDark,
  },
  assignedEvseDetail: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  assignedEvseBay: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  findingEvseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  findingEvseText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  detailsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: 4,
  },
  infoLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  infoValue: {
    flex: 1.2,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: theme.colors.brandDark,
  },
  leaveButton: {
    height: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonPressed: {
    opacity: 0.8,
  },
  leaveButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
});
