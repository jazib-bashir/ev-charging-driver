import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type ConnectorTagProps = {
  label: string;
};

export function ConnectorTag({ label }: ConnectorTagProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    tag: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.connectorBorder,
      backgroundColor: theme.colors.connectorBg,
    },
    label: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      color: theme.colors.connectorText,
      letterSpacing: 0.2,
    },
  });
}
