import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { useTheme } from '@/theme';

export type IconBadgeTone = 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'solid';

type IconBadgeProps = {
  name: IconName;
  tone?: IconBadgeTone;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Tinted circular icon container with consistent icon proportions and semantic colors. */
export function IconBadge({ name, tone = 'primary', size = 40, style }: IconBadgeProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const palette = {
    primary: { bg: c.primaryMuted, fg: c.accent },
    neutral: { bg: c.surfaceSunken, fg: c.textSecondary },
    success: { bg: c.successBg, fg: c.successText },
    warning: { bg: c.warningBg, fg: c.warningText },
    error: { bg: c.errorBg, fg: c.errorText },
    info: { bg: c.infoBg, fg: c.infoText },
    solid: { bg: c.primary, fg: c.onPrimary },
  }[tone];
  const styles = useMemo(() => StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center' } }), []);

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2.4, backgroundColor: palette.bg },
        style,
      ]}
    >
      <Icon name={name} size={Math.round(size * 0.5)} color={palette.fg} />
    </View>
  );
}
