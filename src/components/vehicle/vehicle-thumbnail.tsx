import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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
  const styles = createStyles(theme);
  const [imageFailed, setImageFailed] = useState(false);

  const trimmedUri = uri?.trim() || null;
  const showImage = Boolean(trimmedUri) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [trimmedUri]);

  const content = showImage ? (
    <Image
      source={{ uri: trimmedUri! }}
      style={styles.image}
      contentFit="contain"
      recyclingKey={trimmedUri!}
      onError={() => setImageFailed(true)}
      accessibilityLabel={accessibilityLabel}
    />
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

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
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
  });
}
