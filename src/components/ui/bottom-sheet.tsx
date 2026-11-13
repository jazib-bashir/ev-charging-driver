import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Optional title row with a close button. */
  title?: string;
  /** Optional action rendered left of the close button (e.g. "Clear all"). */
  headerRight?: ReactNode;
  /** Max sheet height as a fraction of the screen (default 0.86). */
  maxHeightRatio?: number;
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Shared konnectEV bottom sheet: dimmed backdrop, grab handle, rounded 28dp top corners, raised surface.
 * Slides with a native-driver animation and respects the bottom safe area.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  headerRight,
  maxHeightRatio = 0.86,
  children,
  contentStyle,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: visible ? 240 : 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: visible ? 0 : SCREEN_HEIGHT,
        duration: visible ? 300 : 220,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fade, slide]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Dismiss">
          <Animated.View style={[styles.backdrop, { opacity: fade }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: SCREEN_HEIGHT * maxHeightRatio,
              paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
              transform: [{ translateY: slide }],
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.headerActions}>
              {headerRight}
              <IconButton
                appearance="soft"
                size={36}
                onPress={onClose}
                accessibilityLabel={`Close ${title}`}
              >
                <Icon name="close" size={16} color={theme.colors.textSecondary} />
              </IconButton>
              </View>
            </View>
          ) : null}

          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.colors.overlay },
    sheet: {
      backgroundColor: theme.colors.surfaceRaised,
      borderTopLeftRadius: theme.radius.xxl,
      borderTopRightRadius: theme.radius.xxl,
      ...theme.shadows.floating,
    },
    handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.borderStrong,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: 6,
      paddingBottom: 14,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      letterSpacing: -0.5,
      color: theme.colors.textPrimary,
    },
    content: { paddingHorizontal: theme.spacing.gutter },
  });
}
