import type { QueueMember } from '@/types/queue';
import { isActiveQueueMemberState } from '@/types/queue';
import { getQueueRank } from '@/utils/queue-display';

/**
 * Picks the queue membership shown on Home. Non-CHARGING active members win; if the only
 * active membership is CHARGING (e.g. session not yet visible), still return it so the
 * journey is not hidden.
 */
export function selectPrimaryActiveQueueMembership(
  members: QueueMember[],
): QueueMember | null {
  const activeNonCharging = members.filter(
    (member) =>
      isActiveQueueMemberState(member.state) && member.state !== 'CHARGING',
  );

  if (activeNonCharging.length > 0) {
    return [...activeNonCharging].sort(
      (left, right) => getQueueRank(left) - getQueueRank(right),
    )[0];
  }

  const chargingMember = members.find(
    (member) => member.state === 'CHARGING' && isActiveQueueMemberState(member.state),
  );

  return chargingMember ?? null;
}
