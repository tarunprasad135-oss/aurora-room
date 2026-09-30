import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useAurora } from '../context/AuroraContext';
import AuroraEngine from './AuroraEngine';

const { width, height } = Dimensions.get('window');

const SKY_TOP = height * 0.14;
const SKY_BOTTOM = height * 0.52;
const SKY_LEFT = 0;
const SKY_RIGHT = width;

export default function RoomBackground({ children }) {
  const {
    currentAuroraState,
    auroraSpeed,
    pitchDarkness,
  } = useAurora();

  const sharedProgress = useSharedValue(0);
  const darkOpacity = useSharedValue(pitchDarkness || 0);

  useEffect(() => {
    sharedProgress.value = 0;
    sharedProgress.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: 7000 / Math.max(auroraSpeed, 0.1),
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [auroraSpeed]);

  useEffect(() => {
    darkOpacity.value = withTiming(pitchDarkness || 0, {
      duration: 1200,
      easing: Easing.inOut(Easing.ease),
    });
  }, [pitchDarkness]);

  const tintOpacity = useSharedValue(0.04);
  useEffect(() => {
    tintOpacity.value = withTiming(0.04, {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
    });
  }, [currentAuroraState]);

  const tintStyle = useAnimatedStyle(() => ({
    backgroundColor: currentAuroraState?.primary || '#00d4aa',
    opacity: tintOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    backgroundColor: currentAuroraState?.primary || '#00d4aa',
    opacity: 0.10,
  }));

  const darkStyle = useAnimatedStyle(() => ({
    opacity: darkOpacity.value,
  }));

  const skyW = SKY_RIGHT - SKY_LEFT;
  const skyH = SKY_BOTTOM - SKY_TOP;

  return (
    <View style={styles.room}>
      {/* LAYER 1: Night sky */}
      <Image
        source={require('../../assets/sky.png')}
        style={styles.fullscreenImage}
        resizeMode="cover"
      />

      {/* LAYER 2: Aurora waves */}
      <View
        style={[
          styles.auroraArea,
          { top: SKY_TOP, left: SKY_LEFT, width: skyW, height: skyH },
        ]}
        pointerEvents="none"
      >
        <AuroraEngine
          totalSkyWidth={skyW}
          xOffset={0}
          areaWidth={skyW}
          areaHeight={skyH}
          sharedProgress={sharedProgress}
        />
      </View>

      {/* LAYER 3: Room frame with transparent window */}
      <Image
        source={require('../../assets/room-frame.png')}
        style={styles.fullscreenImage}
        resizeMode="cover"
      />

      {/* Deadline gravity dark pitch */}
      <Animated.View pointerEvents="none" style={[styles.pitchDark, darkStyle]} />

      {/* Window bloom */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.windowBloom,
          {
            top: SKY_TOP - 20,
            left: SKY_LEFT,
            width: skyW,
            height: skyH + 40,
          },
          glowStyle,
        ]}
      />

      {/* Mood tint */}
      <Animated.View style={[styles.moodTint, tintStyle]} pointerEvents="none" />

      {/* UI Content */}
      <View style={styles.contentLayer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  room: { flex: 1, backgroundColor: '#0a0a1a', position: 'relative' },
  fullscreenImage: { position: 'absolute', top: 0, left: 0, width, height },
  auroraArea: { position: 'absolute' },
  pitchDark: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000010' },
  windowBloom: { position: 'absolute', borderRadius: 40 },
  moodTint: { ...StyleSheet.absoluteFillObject },
  contentLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});