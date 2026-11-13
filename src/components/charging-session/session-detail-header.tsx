import { ScreenHeader } from '@/components/ui/screen-header';

type SessionDetailHeaderProps = {
  onBack: () => void;
};

export function SessionDetailHeader({ onBack }: SessionDetailHeaderProps) {
  return <ScreenHeader title="Session details" onBack={onBack} />;
}
