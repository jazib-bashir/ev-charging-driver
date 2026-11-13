import { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ButtonLoader } from '@/components/loaders/button-loader';
import { useTheme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a circular ButtonLoader, keeps the button's exact dimensions and blocks duplicate taps. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
  /** Render on an obsidian hero panel (outline/secondary/tertiary adapt to the dark surface). */
  onHero?: boolean;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 };
const FONT: Record<ButtonSize, number> = { sm: 11, md: 13, lg: 14 };
const ICON: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

/**
 * konnectEV button system – primary / secondary / outline / tertiary / destructive (+ disabled).
 * Every variant consumes theme tokens, so light and dark themes stay consistent.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  leadingIcon,
  trailingIcon,
  style,
  accessibilityLabel,
  testID,
  onHero = false,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;
  const palette = useMemo(() => resolvePalette(theme, variant, disabled && !loading, onHero), [theme, variant, disabled, loading, onHero]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      testID={testID}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: pressed && !isDisabled ? palette.pressedBackground : palette.background,
          borderColor: palette.border,
          borderWidth: palette.border === 'transparent' ? 0 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'sm' ? 16 : 22,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
        palette.elevated && theme.shadows.card,
        style,
      ]}
    >
      <View style={[styles.row, loading && styles.hidden]}>
        {leadingIcon ? <Icon name={leadingIcon} size={ICON[size]} color={palette.text} /> : null}
        <Text
          numberOfLines={1}
          style={[styles.label, { color: palette.text, fontSize: FONT[size] }]}
        >
          {label}
        </Text>
        {trailingIcon ? <Icon name={trailingIcon} size={ICON[size]} color={palette.text} /> : null}
      </View>
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ButtonLoader size={size === 'sm' ? 18 : 22} color={palette.text} />
        </View>
      ) : null}
    </Pressable>
  );
}

function resolvePalette(
  theme: ReturnType<typeof useTheme>['theme'],
  variant: ButtonVariant,
  showDisabled: boolean,
  onHero: boolean,
) {
  const c = theme.colors;
  if (showDisabled) {
    return {
      background: c.disabledBackground,
      pressedBackground: c.disabledBackground,
      border: 'transparent',
      text: c.disabledText,
      elevated: false,
    };
  }
  if (onHero && variant !== 'primary' && variant !== 'destructive') {
    return {
      background: variant === 'secondary' ? c.heroSurface : 'transparent',
      pressedBackground: c.heroSurface,
      border: variant === 'outline' ? c.heroBorder : 'transparent',
      text: c.heroText,
      elevated: false,
    };
  }
  switch (variant) {
    case 'secondary':
      return {
        background: c.primaryMuted,
        pressedBackground: c.primarySoft,
        border: 'transparent',
        text: c.textLink,
        elevated: false,
      };
    case 'outline':
      return {
        background: c.surface,
        pressedBackground: c.surfaceSunken,
        border: c.borderStrong,
        text: c.textPrimary,
        elevated: false,
      };
    case 'tertiary':
      return {
        background: 'transparent',
        pressedBackground: c.primaryMuted,
        border: 'transparent',
        text: c.textLink,
        elevated: false,
      };
    case 'destructive':
      return {
        background: c.errorBg,
        pressedBackground: c.errorBorder,
        border: c.errorBorder,
        text: c.errorText,
        elevated: false,
      };
    default:
      return {
        background: c.primary,
        pressedBackground: c.primaryPressed,
        border: 'transparent',
        text: c.onPrimary,
        elevated: !theme.isDark,
      };
  }
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.control,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    hidden: {
      opacity: 0,
    },
    label: {
      fontFamily: theme.typography.fontFamily.bold,
      letterSpacing: 0.1,
    },
    loader: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
