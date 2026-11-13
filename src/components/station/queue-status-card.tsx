import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { QueueRings } from '@/components/charging/queue-rings';
import { ButtonLoader } from '@/components/loaders/button-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';
import type { QueueMember } from '@/types/queue';
import { formatQueueMemberState } from '@/types/queue';
import { confirmAsync } from '@/utils/user-prompt';
import {
  formatArrivalWindow,
  formatAssignedEvse,
  formatEstimatedTurn,
  formatEvseBay,
  formatEvseConnectorPower,
  formatEvseHeadline,
  getPeopleAhead,
  getQueueRank,
  EVSE_UNAVAILABLE_MESSAGE,
  getQueueStatusHeadline,
  getQueueStatusSubheadline,
  hasOperationalEvseAllocation,
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function AssignedEvseSection({ membership }: { membership: QueueMember }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const evseHeadline = formatEvseHeadline(membership.allocation);
  const connectorPower = formatEvseConnectorPower(membership.allocation);
  const bayLabel = formatEvseBay(membership.allocation);

  if (!evseHeadline) {
    return null;
  }

  return (
    <View style={styles.assignedEvse}>
      <View style={styles.assignedIcon}>
        <Icon name="plug" size={20} color={theme.colors.secondary} />
      </View>
      <View style={styles.assignedCopy}>
        <Text style={styles.assignedHeadline}>{evseHeadline}</Text>
        {connectorPower ? <Text style={styles.assignedDetail}>{connectorPower}</Text> : null}
        {bayLabel ? <Text style={styles.assignedBay}>{bayLabel}</Text> : null}
      </View>
    </View>
  );
}

function PendingEvseSection({ message }: { message: string }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.pendingEvse}>
      <ButtonLoader size={20} />
      <Text style={styles.pendingText}>{message}</Text>
    </View>
  );
}

/**
 * Queue hero: obsidian panel with concentric rings around the driver's place in line, followed by
 * the timing / EVSE details. All queue state logic comes from `@/utils/queue-display`.
 */
export function QueueStatusCard({ membership, isLeaving = false, onLeave }: QueueStatusCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isQueued = membership.state === 'QUEUED';
  const isApproaching = membership.state === 'APPROACHING';
  const showQueuePosition = shouldShowQueuePosition(membership.state);
  const rank = showQueuePosition ? getQueueRank(membership) : 0;
  const peopleAhead = showQueuePosition ? getPeopleAhead(membership) : 0;
  const showTiming = shouldShowQueueTiming(membership.state);
  const estimatedTurn = showTiming ? formatEstimatedTurn(membership.estimatedTurnAt) : null;
  const arrivalWindow = showTiming
    ? formatArrivalWindow(membership.arrivalWindowStart, membership.arrivalWindowEnd)
    : null;
  const assignedEvse = formatAssignedEvse(membership.allocation);
  const canLeave = isQueued;
  const hasOperationalAllocation = hasOperationalEvseAllocation(membership.allocation);
  const needsEvseReassignment = membership.needsEvseReassignment ?? false;

  const handleLeavePress = () => {
    if (!onLeave || isLeaving) {
      return;
    }

    void confirmAsync({
      title: 'Leave queue?',
      message: 'You will lose your place in line at this station.',
      confirmText: 'Leave queue',
      cancelText: 'Stay in queue',
      destructive: true,
    }).then((confirmed) => {
      if (confirmed) {
        onLeave();
      }
    });
  };

  return (
    <Surface variant="hero" padding={theme.spacing.lg} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{getQueueStatusHeadline(membership.state)}</Text>
          <Text style={styles.subtitle}>
            {getQueueStatusSubheadline(membership.state, {
              hasOperationalAllocation,
              needsEvseReassignment,
            })}
          </Text>
        </View>
        <Badge label="Booked" variant="solid" />
      </View>

      {showQueuePosition ? (
        <View style={styles.rankBlock}>
          <QueueRings rank={rank} size={168} />
          <Text style={styles.rankDetail}>
            {peopleAhead === 0
              ? 'You are next'
              : `${peopleAhead} driver${peopleAhead === 1 ? '' : 's'} ahead of you`}
          </Text>
        </View>
      ) : isApproaching ? (
        needsEvseReassignment ? (
          <PendingEvseSection message={EVSE_UNAVAILABLE_MESSAGE} />
        ) : hasOperationalAllocation ? (
          <AssignedEvseSection membership={membership} />
        ) : (
          <PendingEvseSection message="Finding a compatible EVSE…" />
        )
      ) : membership.state === 'READY' && needsEvseReassignment ? (
        <PendingEvseSection message={EVSE_UNAVAILABLE_MESSAGE} />
      ) : null}

      <View style={styles.details}>
        <QueueInfoRow label="Status" value={formatQueueMemberState(membership.state)} />
        {estimatedTurn ? <QueueInfoRow label="Estimated turn" value={estimatedTurn} /> : null}
        {arrivalWindow ? <QueueInfoRow label="Recommended arrival" value={arrivalWindow} /> : null}
        {!isApproaching && assignedEvse ? (
          <QueueInfoRow label="Assigned EVSE" value={assignedEvse} highlight />
        ) : null}
      </View>

      {canLeave && onLeave ? (
        <Button
          label="Leave queue"
          variant="outline"
          onHero
          onPress={handleLeavePress}
          loading={isLeaving}
          fullWidth
          style={styles.leave}
        />
      ) : null}
    </Surface>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      letterSpacing: -0.4,
      color: theme.colors.heroText,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: 19,
      color: theme.colors.heroTextMuted,
    },
    rankBlock: {
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    rankDetail: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.heroText,
    },
    assignedEvse: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.heroSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.heroBorder,
    },
    assignedIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.16)',
    },
    assignedCopy: {
      flex: 1,
      gap: 2,
    },
    assignedHeadline: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.heroText,
    },
    assignedDetail: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.heroText,
    },
    assignedBay: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.heroTextMuted,
    },
    pendingEvse: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.heroSurface,
    },
    pendingText: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: 19,
      color: theme.colors.heroText,
    },
    details: {
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.heroSurface,
      paddingHorizontal: theme.spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.lg,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.heroBorder,
    },
    infoLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.heroTextMuted,
    },
    infoValue: {
      flex: 1,
      textAlign: 'right',
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.heroText,
    },
    infoValueHighlight: {
      color: theme.colors.secondary,
    },
    leave: {
      marginTop: theme.spacing.xs,
    },
  });
}
