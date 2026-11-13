import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import type { StationMapProps } from './station-map';

/** Clears floating search / chips / location banner on the map stage. */
const MAP_CHROME_CLEARANCE = 168;

export function StationMap(_props: StationMapProps) {
  return (
    <View style={styles.wrap}>
      <EmptyState
        title="Map view"
        message="Open this app on iOS or Android to use the station map."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: MAP_CHROME_CLEARANCE,
  },
});
