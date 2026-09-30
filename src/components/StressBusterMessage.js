import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAurora } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PREF_MESSAGES = {
  music: "Maybe your playlist deserves a moment right now. Put on something comforting.",
  walk: "Even a five-minute walk around the room tends to reset your mind.",
  breathe: "Three slow, deep breaths. Inhale clarity, exhale the deadline rush.",
  snack: "Go grab a glass of water or a light snack. The work will wait for you.",
  friend: "Text a friend. Not about your assignments — just to share a laugh.",
  journal: "Write down what's stressing you. Get it out of your head and onto paper.",
};

const DEFAULT_MESSAGE = "You've handled pressure before. Take a breath — you'll handle this one too.";

export default function StressBusterMessage() {
  const { showStressBuster, dismissStressBuster, stressBusterPrefs, currentAuroraState } = useAurora();

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  const primaryColor = currentAuroraState?.primary || '#00d4aa';

  useEffect(() => {
    if (showStressBuster) {
      translateY.value = withSpring(0, { damping: 16, stiffness: 110 });
      opacity.value = withTiming(1, { duration: 350 });
    } else {
      translateY.value = withTiming(100, { duration: 250, easing: Easing.in(Easing.ease) });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [showStressBuster]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getMessage = () => {
    if (!stressBusterPrefs || stressBusterPrefs.length === 0) return DEFAULT_MESSAGE;
    const pref = stressBusterPrefs[Math.floor(Math.random() * stressBusterPrefs.length)];
    return PREF_MESSAGES[pref] || DEFAULT_MESSAGE;
  };

  if (!showStressBuster) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Outer ambient glow wrapper */}
      <View style={[styles.glowWrapper, { shadowColor: primaryColor }]}>
        <BlurView intensity={50} tint="dark" style={styles.blur}>
          <LinearGradient
            colors={['rgba(20, 18, 48, 0.92)', 'rgba(10, 10, 26, 0.95)']}
            style={[styles.card, { borderColor: primaryColor + '66' }]}
          >
            {/* Aurora header badge */}
            <View style={styles.badgeRow}>
              <View style={[styles.auroraOrb, { backgroundColor: primaryColor + '44' }]}>
                <View style={[styles.auroraOrbCore, { backgroundColor: primaryColor }]} />
              </View>
              <Text style={[styles.badgeText, { color: primaryColor }]}>AURORA CHECK-IN</Text>
            </View>

            {/* Message Body */}
            <Text style={styles.message}>"{getMessage()}"</Text>

            {/* Action Button */}
            <TouchableOpacity onPress={dismissStressBuster} style={styles.dismissButton}>
              <LinearGradient
                colors={['#7b2ff7', '#00d4aa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.dismissText}>I've got this ✨</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  glowWrapper: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  blur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  auroraOrb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justify: 'center',
  },
  auroraOrbCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  message: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.2,
    paddingHorizontal: 6,
  },
  dismissButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});