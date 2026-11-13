import { SessionListItem } from '@/components/charging-session/session-list-item';
import type { ChargingSession } from '@/types/charging-session';

type ProfileSessionPreviewProps = {
  session: ChargingSession;
  stationName?: string;
  index: number;
  onPress: () => void;
};

/** Recent-session row: shares the sessions list card so history looks identical everywhere. */
export function ProfileSessionPreview({
  session,
  stationName,
  onPress,
}: ProfileSessionPreviewProps) {
  return (
    <SessionListItem
      session={session}
      stationName={stationName}
      evseLabel={session.evseLabel ?? undefined}
      connectorLabel={session.connectorLabel ?? undefined}
      onPress={onPress}
    />
  );
}
