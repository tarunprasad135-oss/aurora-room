import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAurora } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';

const STRESS_OPTIONS = [
  { key: 'low', label: '◦', fullLabel: 'Low', color: '#00d4aa' },
  { key: 'medium', label: '◉', fullLabel: 'Med', color: '#cc8800' },
  { key: 'high', label: '●', fullLabel: 'High', color: '#ff4400' },
];

function StressButton({ option, isSelected, onPress }) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1.1, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    onPress(option.key);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.stressButton,
          isSelected && {
            backgroundColor: option.color + '22',
            borderColor: option.color,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.stressIcon, { color: isSelected ? option.color : UI_COLORS.textDim }]}>
          {option.label}
        </Text>
        <Text style={[styles.stressLabel, { color: isSelected ? option.color : UI_COLORS.textDim }]}>
          {option.fullLabel}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StressToggle() {
  const { manualStress, updateManualStress } = useAurora();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How are you feeling?</Text>
      <View style={styles.toggleRow}>
        {STRESS_OPTIONS.map(option => (
          <StressButton
            key={option.key}
            option={option}
            isSelected={manualStress === option.key}
            onPress={updateManualStress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  heading: {
    color: UI_COLORS.textDim,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stressButton: {
    width: 68,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    backgroundColor: UI_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stressIcon: {
    fontSize: 22,
  },
  stressLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});