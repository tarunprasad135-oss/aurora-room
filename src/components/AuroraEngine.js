import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  BlurMask,
  Group,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { useAurora } from '../context/AuroraContext';

// Builds a wavy aurora ribbon path
function buildWavyPath(totalW, xOffset, drawW, yBase, amplitude, phase, thickness, waveCount) {
  'worklet';
  const path = Skia.Path.Make();
  const step = drawW / 50;
  const points = [];

  for (let x = -50; x <= drawW + 50; x += step) {
    const globalX = x + xOffset;
    const wave1 = Math.sin((globalX / totalW) * Math.PI * waveCount + phase) * amplitude;
    const wave2 =
      Math.sin((globalX / totalW) * Math.PI * (waveCount * 2.3) + phase * 1.5) *
      (amplitude * 0.4);
    const y = yBase + wave1 + wave2;
    points.push({ x, y });
  }

  path.moveTo(points[0].x, points[0].y - thickness);
  for (let i = 1; i < points.length; i++) {
    path.lineTo(points[i].x, points[i].y - thickness);
  }
  for (let i = points.length - 1; i >= 0; i--) {
    path.lineTo(points[i].x, points[i].y + thickness);
  }
  path.close();

  return path;
}

function AuroraRibbon({
  totalW,
  xOffset,
  drawW,
  colors,
  yBase,
  amplitude,
  thickness,
  waveCount,
  blurAmount,
  opacity,
  sharedProgress,
}) {
  const path = useDerivedValue(() => {
    return buildWavyPath(
      totalW,
      xOffset,
      drawW,
      yBase,
      amplitude,
      sharedProgress.value,
      thickness,
      waveCount
    );
  });

  return (
    <Group opacity={opacity} blendMode="screen">
      <Path path={path}>
        <LinearGradient
          start={vec(0, yBase - thickness)}
          end={vec(0, yBase + thickness)}
          colors={colors}
        />
        <BlurMask blur={blurAmount} style="normal" />
      </Path>
    </Group>
  );
}

export default function AuroraEngine({
  totalSkyWidth,
  xOffset = 0,
  areaWidth = 300,
  areaHeight = 300,
  sharedProgress,
}) {
  const { currentAuroraState, stressLevel } = useAurora();
  const state = currentAuroraState;
  const totalW = totalSkyWidth || areaWidth;

  // Amplitude boost: when stressed, aurora dances more wildly
  const amp = stressLevel === 'high' || stressLevel === 'critical' ? 1.4
            : stressLevel === 'medium' ? 1.15
            : 1;
  // Ribbons spread from TOP (5%) to BOTTOM (92%) of the sky area
  // so the aurora feels like it fills the entire sky, not a band.
  const y1 = areaHeight * 0.08;  // very top — faint sky haze
  const y2 = areaHeight * 0.22;  // upper sky glow
  const y3 = areaHeight * 0.38;  // main body upper
  const y4 = areaHeight * 0.52;  // BRIGHT hero ribbon
  const y5 = areaHeight * 0.68;  // main body lower
  const y6 = areaHeight * 0.82;  // low sky wisp
  const y7 = areaHeight * 0.94;  // horizon glow

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={styles.canvas}>
        {/* Layer 1: Very faint top-sky haze — barely visible, adds depth */}
        <AuroraRibbon
          totalW={totalW} xOffset={xOffset} drawW={areaWidth}
          sharedProgress={sharedProgress}
          colors={[
            state.tertiary + '00',
            state.tertiary + '20',
            state.primary   + '18',
            state.tertiary + '00',
          ]}
          yBase={y1}
          amplitude={8}
          thickness={60}
          waveCount={1.2}
          blurAmount={70}
          opacity={0.35}
        />

        {/* Layer 2: Upper sky soft wash */}
        <AuroraRibbon
          totalW={totalW} xOffset={xOffset} drawW={areaWidth}
          sharedProgress={sharedProgress}
          colors={[
            state.secondary + '00',
            state.secondary + '40',
            state.primary   + '30',
            state.secondary + '00',
          ]}
          yBase={y2}
          amplitude={14}
          thickness={55}
          waveCount={1.6}
          blurAmount={55}
          opacity={0.5}
        />

        {/* Layer 3: Main aurora upper body */}
        <AuroraRibbon
          totalW={totalW} xOffset={xOffset} drawW={areaWidth}
          sharedProgress={sharedProgress}
          colors={[
            state.primary + '00',
            state.primary + '75',
            state.primary + 'a0',
            state.primary + '75',
            state.primary + '00',
          ]}
          yBase={y3}
          amplitude={20}
          thickness={42}
          waveCount={2.0}
          blurAmount={38}
          opacity={0.65}
        />

        {/* Layer 4: BRIGHT hero ribbon — the eye-catcher */}
        <AuroraRibbon
          totalW={totalW} xOffset={xOffset} drawW={areaWidth}
          sharedProgress={sharedProgress}
          colors={[
            state.primary   + '00',
            state.primary   + 'd0',
            state.secondary + 'c0',
            state.primary   + 'd0',
            state.primary   + '00',
          ]}
          yBase={y4}
          amplitude={22}
          thickness={26}
          waveCount={2.5}
          blurAmount={22}
          opacity={0.8}
        />

        {/* Layer 5: Main aurora lower body */}
        <AuroraRibbon
          totalW={totalW} xOffset={xOffset} drawW={areaWidth}
          sharedProgress={sharedProgress}
          colors={[
            state.primary + '00',
            state.primary + '80',
            state.secondary + '70',
            state.primary + '00',
          ]}
          yBase={y5}
          amplitude={20}
          thickness={38}
          waveCount={2.2}
          blurAmount={34}
          opacity={0.6}
        />

        {/* Layer 6: Low bright wisp */}
        <AuroraRibbon
          totalW={totalW} xOffset={xOffset} drawW={areaWidth}
          sharedProgress={sharedProgress}
          colors={[
            state.tertiary + '00',
            state.tertiary + 'c0',
            state.primary   + '80',
            state.tertiary + '00',
          ]}
          yBase={y6}
          amplitude={18}
          thickness={16}
          waveCount={3.0}
          blurAmount={18}
          opacity={0.55}
        />

        {/* Layer 7: Very faint horizon glow — fades into sky bottom */}
        <AuroraRibbon
          totalW={totalW} xOffset={xOffset} drawW={areaWidth}
          sharedProgress={sharedProgress}
          colors={[
            state.primary   + '00',
            state.tertiary + '25',
            state.primary   + '18',
            state.primary   + '00',
          ]}
          yBase={y7}
          amplitude={8}
          thickness={50}
          waveCount={1.3}
          blurAmount={65}
          opacity={0.3}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});