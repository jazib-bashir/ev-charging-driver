import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GridFlowLogo } from '@/components/gridflow-logo';
import { GridFlowColors } from '@/constants/colors';

export default function HomeScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <GridFlowLogo size={72} />
        <Text style={styles.version}>v{version}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GridFlowColors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  version: {
    fontSize: 11,
    color: GridFlowColors.textMuted,
  },
});
