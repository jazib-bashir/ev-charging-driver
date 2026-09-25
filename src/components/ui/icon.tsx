import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Platform, type StyleProp, type TextStyle } from 'react-native';

import { theme } from '@/theme';

export type IconName =
  | 'bolt'
  | 'price'
  | 'bell'
  | 'search'
  | 'sliders'
  | 'filter'
  | 'list'
  | 'map'
  | 'map-outline'
  | 'navigate'
  | 'navigate-outline'
  | 'charger'
  | 'home'
  | 'home-outline'
  | 'user'
  | 'person-outline'
  | 'document'
  | 'image'
  | 'back'
  | 'share'
  | 'location'
  | 'map-pin'
  | 'checkmark'
  | 'wifi'
  | 'coffee'
  | 'dining'
  | 'restroom'
  | 'car'
  | 'close'
  | 'locate'
  | 'check'
  | 'search-off'
  | 'refresh'
  | 'chevron-forward'
  | 'chevron-down'
  | 'warning'
  | 'time'
  | 'create'
  | 'star'
  | 'star-outline'
  | 'add'
  | 'log-out'
  | 'trash'
  | 'more';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconConfig =
  | { family: 'ionicons'; name: IoniconName }
  | { family: 'material'; name: MaterialIconName };

const ICON_MAP: Record<IconName, IconConfig> = {
  bolt: { family: 'ionicons', name: 'flash' },
  price: { family: 'ionicons', name: 'pricetag-outline' },
  bell: { family: 'ionicons', name: 'notifications-outline' },
  search: { family: 'ionicons', name: 'search' },
  sliders: { family: 'ionicons', name: 'options' },
  filter: { family: 'ionicons', name: 'filter' },
  list: { family: 'ionicons', name: 'list' },
  map: { family: 'ionicons', name: 'map' },
  'map-outline': { family: 'ionicons', name: 'map-outline' },
  navigate: { family: 'ionicons', name: 'navigate' },
  'navigate-outline': { family: 'ionicons', name: 'navigate-outline' },
  charger: { family: 'material', name: 'ev-station' },
  home: { family: 'ionicons', name: 'home' },
  'home-outline': { family: 'ionicons', name: 'home-outline' },
  user: { family: 'ionicons', name: 'person' },
  'person-outline': { family: 'ionicons', name: 'person-outline' },
  document: { family: 'ionicons', name: 'document-text-outline' },
  image: { family: 'ionicons', name: 'image-outline' },
  back: { family: 'ionicons', name: 'chevron-back' },
  share: { family: 'ionicons', name: 'share-social-outline' },
  location: { family: 'ionicons', name: 'location-outline' },
  'map-pin': { family: 'ionicons', name: 'location' },
  checkmark: { family: 'ionicons', name: 'checkmark-circle' },
  check: { family: 'ionicons', name: 'checkmark' },
  close: { family: 'ionicons', name: 'close' },
  locate: { family: 'ionicons', name: 'locate-outline' },
  'search-off': { family: 'material', name: 'magnify-close' },
  wifi: { family: 'ionicons', name: 'wifi' },
  coffee: { family: 'ionicons', name: 'cafe-outline' },
  dining: { family: 'ionicons', name: 'restaurant-outline' },
  restroom: { family: 'ionicons', name: 'male-female-outline' },
  car: { family: 'ionicons', name: 'car-outline' },
  refresh: { family: 'ionicons', name: 'refresh' },
  'chevron-forward': { family: 'ionicons', name: 'chevron-forward' },
  'chevron-down': { family: 'ionicons', name: 'chevron-down' },
  warning: { family: 'ionicons', name: 'warning-outline' },
  time: { family: 'ionicons', name: 'time-outline' },
  create: { family: 'ionicons', name: 'create-outline' },
  star: { family: 'ionicons', name: 'star' },
  'star-outline': { family: 'ionicons', name: 'star-outline' },
  add: { family: 'ionicons', name: 'add' },
  'log-out': { family: 'ionicons', name: 'log-out-outline' },
  trash: { family: 'ionicons', name: 'trash-outline' },
  more: { family: 'ionicons', name: 'ellipsis-vertical' },
};

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** Optical offsets for glyphs whose visual mass is not centered in the font box. */
const OPTICAL_OFFSET: Partial<Record<IconName, { x: number; y: number }>> = {
  navigate: { x: -1, y: 1 },
  'navigate-outline': { x: -1, y: 1 },
  'map-pin': { x: 0, y: 1 },
  location: { x: 0, y: 1 },
};

export function Icon({ name, size = 20, color = theme.colors.textPrimary, style }: IconProps) {
  const config = ICON_MAP[name];
  const offset = OPTICAL_OFFSET[name];
  const iconStyle: StyleProp<TextStyle> = [
    {
      width: size,
      height: size,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
      ...(offset
        ? { transform: [{ translateX: offset.x }, { translateY: offset.y }] }
        : null),
    },
    style,
  ];

  if (config.family === 'material') {
    return (
      <MaterialCommunityIcons
        name={config.name}
        size={size}
        color={color}
        style={iconStyle}
      />
    );
  }

  return (
    <Ionicons
      name={config.name}
      size={size}
      color={color}
      style={iconStyle}
    />
  );
}
