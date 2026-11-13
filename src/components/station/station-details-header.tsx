import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme';

type StationDetailsHeaderProps = {
  onBack: () => void;
  onShare?: () => void;
};

export function StationDetailsHeader({ onBack, onShare }: StationDetailsHeaderProps) {
  const { theme } = useTheme();

  return (
    <ScreenHeader
      title="Station Details"
      onBack={onBack}
      right={
        <IconButton appearance="soft" size={44} onPress={onShare} accessibilityLabel="Share station">
          <Icon name="share" size={20} color={theme.colors.textPrimary} />
        </IconButton>
      }
    />
  );
}
