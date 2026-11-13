import type { StyleProp, ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';

type AuthPrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean | null;
  accessibilityLabel?: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Auth call-to-action. Thin wrapper over the shared `Button` so the auth flow uses the same
 * primary / disabled / loading (circular `ButtonLoader`) styles as the rest of the app.
 */
export function AuthPrimaryButton({
  label,
  loading = false,
  disabled,
  style,
  onPress,
  accessibilityLabel,
}: AuthPrimaryButtonProps) {
  return (
    <Button
      label={label}
      loading={loading}
      disabled={Boolean(disabled)}
      style={style}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
    />
  );
}
