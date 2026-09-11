import Svg, { Path, Rect } from 'react-native-svg';

type GridFlowLogoProps = {
  size?: number;
};

export function GridFlowLogo({ size = 72 }: GridFlowLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect width="512" height="512" rx="112" fill="#e9eef5" />
      <Path
        d="M284 84 L144 268 C138 276 144 288 154 288 H252 L228 428 C226 440 240 447 248 438 L388 244 C394 236 388 224 378 224 H280 L304 94 C306 82 292 75 284 84 Z"
        fill="#0f766e"
      />
    </Svg>
  );
}
