import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

type ConnectorTagProps = {
  label: string;
};

export function ConnectorTag({ label }: ConnectorTagProps) {
  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.connectorBorder,
    backgroundColor: theme.colors.connectorBg,
  },
  label: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.connectorText,
    letterSpacing: 0.2,
  },
});
