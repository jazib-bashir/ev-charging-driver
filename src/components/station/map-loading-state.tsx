import { StyleSheet, View } from 'react-native';

import { PageLoader } from '@/components/loaders';
import { useTheme } from '@/theme';

export function MapLoadingState() {
  const { theme } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}>
      <PageLoader message="Loading stations on map…" />
    </View>
  );
}
