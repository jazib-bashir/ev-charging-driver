import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import { theme } from '@/theme';

export type IconName =
  | 'bolt'
  | 'price'
  | 'bell'
  | 'search'
  | 'sliders'
  | 'list'
  | 'map'
  | 'navigate'
  | 'charger'
  | 'home'
  | 'user'
  | 'image'
  | 'back'
  | 'share'
  | 'location'
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
  list: { family: 'ionicons', name: 'list' },
  map: { family: 'ionicons', name: 'map' },
  navigate: { family: 'ionicons', name: 'navigate' },
  charger: { family: 'material', name: 'ev-station' },
  home: { family: 'ionicons', name: 'home' },
  user: { family: 'ionicons', name: 'person' },
  image: { family: 'ionicons', name: 'image-outline' },
  back: { family: 'ionicons', name: 'chevron-back' },
  share: { family: 'ionicons', name: 'share-social-outline' },
  location: { family: 'ionicons', name: 'location-outline' },
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
  add: { family: 'ionicons', name: 'add' },
  'log-out': { family: 'ionicons', name: 'log-out-outline' },
  trash: { family: 'ionicons', name: 'trash-outline' },
  more: { family: 'ionicons', name: 'ellipsis-vertical' },
};

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 20, color = theme.colors.textPrimary }: IconProps) {
  const config = ICON_MAP[name];

  if (config.family === 'material') {
    return (
      <MaterialCommunityIcons
        name={config.name}
        size={size}
        color={color}
      />
    );
  }

  return (
    <Ionicons
      name={config.name}
      size={size}
      color={color}
    />
  );
}
