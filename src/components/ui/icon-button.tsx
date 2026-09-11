import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type IconButtonProps = Omit<PressableProps, 'style'> & {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ size = 36, style, children, ...props }: IconButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
