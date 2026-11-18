import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkeletonLoader } from '@/components/loaders/skeleton-loader';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { useTheme } from '@/theme';

type FullScreenImageModalProps = {
  visible: boolean;
  uri: string | null;
  accessibilityLabel?: string;
  onClose: () => void;
};

export function FullScreenImageModal({
  visible,
  uri,
  accessibilityLabel = 'Vehicle image',
  onClose,
}: FullScreenImageModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    setIsImageLoading(Boolean(visible && uri));
  }, [visible, uri]);

  return (
    <Modal
      visible={visible && Boolean(uri)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close image"
        />
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            onLoadStart={() => setIsImageLoading(true)}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
            accessibilityLabel={accessibilityLabel}
          />
        ) : null}
        {isImageLoading ? (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <SkeletonLoader width="72%" height={220} radius={theme.radius.xl} />
          </View>
        ) : null}
        <IconButton
          appearance="soft"
          size={44}
          onPress={onClose}
          accessibilityLabel="Close image"
          style={[styles.closeButton, { top: insets.top + 8 }]}
        >
          <Icon name="close" size={20} color={theme.colors.textInverse} />
        </IconButton>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '80%',
    },
    loaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing.gutter,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
    },
  });
}
