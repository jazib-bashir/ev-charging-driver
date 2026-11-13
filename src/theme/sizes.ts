/** Shared component dimensions so controls line up across screens. */
export const sizes = {
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  control: { sm: 40, md: 48, lg: 56 },
  input: 54,
  hitSlop: 44,
  avatar: { sm: 36, md: 48, lg: 72 },
  tabBar: { height: 64, floatInset: 16, radius: 22 },
  otpBox: { width: 48, height: 58 },
} as const;

export type ThemeSizes = typeof sizes;
