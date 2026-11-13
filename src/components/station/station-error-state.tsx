import { ErrorState } from '@/components/ui/empty-state';

type StationErrorStateProps = {
  onRetry: () => void;
};

export function StationErrorState({ onRetry }: StationErrorStateProps) {
  return (
    <ErrorState
      title="Unable to load stations"
      message="Please check your connection and try again."
      primaryActionLabel="Retry"
      onPrimaryAction={onRetry}
    />
  );
}
