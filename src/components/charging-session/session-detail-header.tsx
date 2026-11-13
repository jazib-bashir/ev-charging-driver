import { ScreenHero } from '@/components/layout/screen-hero';

type SessionDetailHeaderProps = {
  onBack: () => void;
};

export function SessionDetailHeader({ onBack }: SessionDetailHeaderProps) {
  return <ScreenHero title="Session details" onBack={onBack} />;
}
