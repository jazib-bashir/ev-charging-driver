import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SkeletonLoader } from '@/components/loaders/skeleton-loader';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';

type VehicleThumbnailProps = {
  uri: string | null;
  accessibilityLabel: string;
  width?: number;
  height?: number;
  iconSize?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function VehicleThumbnail({
  uri,
  accessibilityLabel,
  width = 72,
  height = 72,
  iconSize = 28,
  onPress,
  style,
}: VehicleThumbnailProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [imageFailed, setImageFailed] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const trimmedUri = uri?.trim() || null;
  const showImage = Boolean(trimmedUri) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
    setIsImageLoading(Boolean(trimmedUri));
  }, [trimmedUri]);

  const content = showImage ? (
    <>
      <Image
        source={{ uri: trimmedUri! }}
        style={styles.image}
        contentFit="contain"
        recyclingKey={trimmedUri!}
        onLoadStart={() => setIsImageLoading(true)}
        onLoad={() => setIsImageLoading(false)}
        onError={() => {
          setImageFailed(true);
          setIsImageLoading(false);
        }}
        accessibilityLabel={accessibilityLabel}
      />
      {isImageLoading ? (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <SkeletonLoader width="100%" height={height} radius={theme.radius.md} />
        </View>
      ) : null}
    </>
  ) : (
    <Icon name="car" size={iconSize} color={theme.colors.placeholderIcon} />
  );

  const wrapStyle = [
    styles.wrap,
    { width, height, borderRadius: theme.radius.md },
    style,
  ];

  if (onPress && showImage) {
    return (
      <Pressable
        onPress={onPress}
        style={wrapStyle}
        accessibilityRole="button"
        accessibilityLabel={`View ${accessibilityLabel}`}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={wrapStyle}>{content}</View>;
}

function createStyles(_theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    loaderOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
  });
}
