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
  | 'image';

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
