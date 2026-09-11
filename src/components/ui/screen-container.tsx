import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { theme } from '@/theme';

type ScreenContainerProps = ViewProps & {
  edges?: Edge[];
};

export function ScreenContainer({ style, edges = ['top'], children, ...props }: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges} {...props}>
      {children}
    </SafeAreaView>
  );
}

export function ScreenContent({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});
