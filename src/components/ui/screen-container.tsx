import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type ScreenContainerProps = ViewProps & {
  edges?: Edge[];
};

export function ScreenContainer({ style, edges = ['top'], children, ...props }: ScreenContainerProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={[styles.container, style]} edges={edges} {...props}>
      {children}
    </SafeAreaView>
  );
}

export function ScreenContent({ style, children, ...props }: ViewProps) {
  return (
    <View style={[{ flex: 1 }, style]} {...props}>
      {children}
    </View>
  );
}
