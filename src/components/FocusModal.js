import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ScrollView, TextInput, Alert, Vibration
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAurora } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';

const CATEGORIES = [
  { id: 'study',   label: 'Study & Reading', emoji: '📖' },
  { id: 'solve',   label: 'Solving / HW',   emoji: '🧩' },
  { id: 'lecture', label: 'Watch Lecture',  emoji: '🎧' },
  { id: 'custom',  label: 'Custom Task',    emoji: '✍️' },
];

const DISTRACTIONS = [
  { id: 'phone',    label: 'Social / Doomscroll', emoji: '📱' },
  { id: 'gaming',   label: 'Gaming / Videos',    emoji: '🎮' },
  { id: 'wandering',label: 'Mind Wandering',     emoji: '💭' },
  { id: 'other',    label: 'Other Distraction',  emoji: '☕' },
];

export default function FocusModal({ visible, onClose }) {
  const [stage, setStep] = useState('setup');
  const [category, setCategory] = useState('study');
  const [customCategory, setCustomCategory] = useState('');
  const [mode, setMode] = useState('target');
  const [targetMinutes, setTargetMinutes] = useState('25');
  const [isPanicMode, setIsPanicMode] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [quitHoldProgress, setQuitHoldProgress] = useState(0);
  const quitTimerRef = useRef(null);

  const [actualFocusInput, setActualFocusInput] = useState('');
  const [distractionInput, setDistractionInput] = useState('');
  const [mainDistraction, setMainDistraction] = useState('phone');
  const [customDistractionText, setCustomDistractionText] = useState('');

  const { logFocusSession, updateManualStress } = useAurora();

  const isShortSession = elapsedSeconds < 60;
  const timeUnitLabel = isShortSession ? 'Secs' : 'Mins';

  const handleTargetMinutesChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setTargetMinutes('');
      return;
    }
    const num = parseInt(cleaned, 10);
    if (num > 1440) setTargetMinutes('1440');
    else setTargetMinutes(num.toString());
  };

  useEffect(() => {
    let interval = null;
    if (stage === 'running') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          const targetSecs = (parseInt(targetMinutes, 10) || 0) * 60;
          if (mode === 'target' && targetSecs > 0 && next === targetSecs) {
            Vibration.vibrate([0, 500, 200, 500, 200, 500]);
            Alert.alert('🎉 Target Reached!', `Great job! You completed your ${targetMinutes}m focus session!`);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, mode, targetMinutes]);

  const handleStartSession = () => {
    if (mode === 'target') {
      const mins = parseInt(targetMinutes, 10);
      if (!mins || mins <= 0) {
        Alert.alert('Invalid Duration', 'Please enter a target time between 1 and 1440 minutes.');
        return;
      }
    }
    if (category === 'custom' && !customCategory.trim()) {
      Alert.alert('Custom Task', 'Please enter a name for your custom task.');
      return;
    }
    setElapsedSeconds(0);
    setQuitHoldProgress(0);
    setStep('running');
  };

  const handleStopSession = () => {
    if (isPanicMode) {
      const targetSecs = (parseInt(targetMinutes, 10) || 0) * 60;
      if (mode === 'target' && elapsedSeconds < targetSecs) {
        Alert.alert(
          '🚨 Panic Mode Active!',
          'Giving up early in Panic Mode will force your room into Critical Storm Mode. Hold the quit button below for 3 seconds if you must abandon.',
        );
        return;
      }
    }
    proceedToReflect();
  };

  const startQuitHold = () => {
    if (!isPanicMode) {
      proceedToReflect();
      return;
    }
    Vibration.vibrate(100);
    let progress = 0;
    quitTimerRef.current = setInterval(() => {
      progress += 10;
      setQuitHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(quitTimerRef.current);
        Vibration.vibrate([0, 300, 100, 300]);
        updateManualStress('critical');
        Alert.alert('⚡ Session Abandoned', 'Aurora Sky forced into Critical Storm Mode due to early exit!');
        proceedToReflect();
      }
    }, 200);
  };

  const cancelQuitHold = () => {
    if (quitTimerRef.current) clearInterval(quitTimerRef.current);
    setQuitHoldProgress(0);
  };

  const proceedToReflect = () => {
    setStep('reflect');
    if (elapsedSeconds < 60) {
      setActualFocusInput(String(elapsedSeconds));
      setDistractionInput('0');
    } else {
      const totalMins = Math.round(elapsedSeconds / 60);
      const focus = Math.max(1, Math.round(totalMins * 0.8));
      const dist = Math.max(0, totalMins - focus);
      setActualFocusInput(String(focus));
      setDistractionInput(String(dist));
    }
  };

  const handleSaveReflection = async () => {
    const focusVal = parseInt(actualFocusInput, 10);
    const distractVal = parseInt(distractionInput, 10);

    if (isNaN(focusVal) || focusVal < 0 || isNaN(distractVal) || distractVal < 0) {
      Alert.alert('Invalid Input', 'Please enter valid non-negative numbers.');
      return;
    }
    if (focusVal + distractVal === 0) {
      Alert.alert('Time required', 'Please enter your actual time spent.');
      return;
    }

    const focusMins = isShortSession ? focusVal / 60 : focusVal;
    const distractMins = isShortSession ? distractVal / 60 : distractVal;
    const finalDistraction = mainDistraction === 'other' && customDistractionText.trim()
      ? customDistractionText.trim()
      : mainDistraction;

    const result = await logFocusSession({
      category,
      customCategory,
      mode,
      isPanicMode,
      targetMinutes: mode === 'target' ? parseInt(targetMinutes, 10) || 0 : null,
      elapsedSeconds,
      actualFocusMins: focusMins,
      distractionMins: distractMins,
      mainDistraction: finalDistraction,
    });

    const ratio = result?.ratio ?? (focusVal / (focusVal + distractVal));
    const pct = Math.round(ratio * 100);

    if (isPanicMode && ratio >= 0.7) {
      Alert.alert('🔥 Panic Mode Survived!', `Legendary focus — ${pct}% focused in Panic Mode!`);
    } else if (ratio >= 0.6) {
      Alert.alert('Focus Streak +1 🔥', `Nice session — ${pct}% focused.`);
    } else {
      Alert.alert('Honest Check 📱', `${pct}% focused. High distraction noted.`);
    }

    setStep('setup');
    setCustomDistractionText('');
    onClose();
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationText = (totalSecs) => {
    if (totalSecs < 60) return `${totalSecs} sec${totalSecs !== 1 ? 's' : ''}`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#0a0a1a', '#0d1a2e']} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {stage === 'running'
                ? (isPanicMode ? '🚨 Panic Focus Active' : 'Focus Active')
                : stage === 'reflect'
                  ? 'Introspection Check'
                  : 'Focus Block'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {stage === 'setup' && (
              <View style={styles.setupArea}>
                <Text style={styles.heroTitle}>Start a Focus Block</Text>
                <Text style={styles.heroSub}>Choose what you are working on & track real vs. wasted time.</Text>

                <Text style={styles.label}>1. SELECT ACTIVITY</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catCard, category === c.id && styles.catCardActive]}
                      onPress={() => setCategory(c.id)}
                    >
                      <Text style={styles.catEmoji}>{c.emoji}</Text>
                      <Text style={styles.catLabel}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {category === 'custom' && (
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter custom task name..."
                    placeholderTextColor={UI_COLORS.textDim}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                  />
                )}

                <Text style={styles.label}>2. TRACKING MODE</Text>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[styles.modeCard, mode === 'target' && styles.modeCardActive]}
                    onPress={() => setMode('target')}
                  >
                    <Text style={styles.modeTitle}>⏱ Target Goal</Text>
                    <Text style={styles.modeSub}>Set target duration (e.g. 25m)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeCard, mode === 'open' && styles.modeCardActive]}
                    onPress={() => setMode('open')}
                  >
                    <Text style={styles.modeTitle}>♾ Open Timer</Text>
                    <Text style={styles.modeSub}>Start now, stop whenever</Text>
                  </TouchableOpacity>
                </View>

                {mode === 'target' && (
                  <View style={styles.targetRow}>
                    <Text style={styles.targetLabel}>Target Duration (1-1440 Mins):</Text>
                    <TextInput
                      style={styles.targetInput}
                      keyboardType="number-pad"
                      value={targetMinutes}
                      onChangeText={handleTargetMinutesChange}
                      maxLength={4}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.panicToggle, isPanicMode && styles.panicToggleActive]}
                  onPress={() => setIsPanicMode(!isPanicMode)}
                >
                  <Text style={styles.panicEmoji}>🚨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.panicTitle}>Panic Mode (Strict Lock)</Text>
                    <Text style={styles.panicSub}>Early exit triggers storm penalty & breaks streak</Text>
                  </View>
                  <Text style={styles.panicStatus}>{isPanicMode ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.startButton} onPress={handleStartSession}>
                  <LinearGradient
                    colors={isPanicMode ? ['#ff0055', '#ff5500'] : ['#7b2ff7', '#00d4aa']}
                    style={styles.startGradient}
                  >
                    <Text style={styles.startText}>
                      {isPanicMode ? 'Start Panic Block 🚨' : 'Start Focus Session 🚀'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {stage === 'running' && (
              <View style={styles.runningArea}>
                <Text style={[styles.runningBadge, isPanicMode && { color: '#ff0055' }]}>
                  {isPanicMode ? '🚨 PANIC MODE ACTIVE' : '⏱ FOCUSING NOW'}
                </Text>
                <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
                {mode === 'target' && (
                  <Text style={styles.targetSubText}>Target: {targetMinutes} mins</Text>
                )}

                <Text style={styles.runningSub}>
                  {isPanicMode
                    ? 'Put phone face down. Quitting early will trigger Storm Mode!'
                    : 'Put phone face down and stay focused. Tap stop when finished.'}
                </Text>

                {isPanicMode ? (
                  <TouchableOpacity
                    style={styles.panicStopButton}
                    onPressIn={startQuitHold}
                    onPressOut={cancelQuitHold}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.holdProgressOverlay, { width: `${quitHoldProgress}%` }]} />
                    <Text style={styles.panicStopText}>
                      {quitHoldProgress > 0
                        ? `HOLDING (${Math.round(quitHoldProgress)}%)...`
                        : 'HOLD 3s TO ABANDON 🚨'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.stopButton} onPress={handleStopSession}>
                    <Text style={styles.stopText}>End Session & Reflect 🛑</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {stage === 'reflect' && (
              <View style={styles.reflectArea}>
                <Text style={styles.reflectTitle}>Honest Introspection 🧠</Text>
                <Text style={styles.reflectSub}>
                  Total session length: <Text style={styles.highlightText}>{formatDurationText(elapsedSeconds)}</Text>{'\n'}
                  Be honest — how was your time actually split?
                </Text>

                <View style={styles.reflectBox}>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>🎯 Actual Focused Time ({timeUnitLabel}):</Text>
                    <TextInput
                      style={styles.reflectInput}
                      keyboardType="number-pad"
                      value={actualFocusInput}
                      onChangeText={(t) => setActualFocusInput(t.replace(/[^0-9]/g, ''))}
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>📱 Wasted / Distracted Time ({timeUnitLabel}):</Text>
                    <TextInput
                      style={styles.reflectInput}
                      keyboardType="number-pad"
                      value={distractionInput}
                      onChangeText={(t) => setDistractionInput(t.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                </View>

                <Text style={styles.label}>WHAT WAS THE MAIN DISTRACTION?</Text>
                <View style={styles.distGrid}>
                  {DISTRACTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.distCard, mainDistraction === d.id && styles.distCardActive]}
                      onPress={() => setMainDistraction(d.id)}
                    >
                      <Text style={styles.distEmoji}>{d.emoji}</Text>
                      <Text style={styles.distLabel}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {mainDistraction === 'other' && (
                  <TextInput
                    style={styles.customInput}
                    placeholder="Describe custom distraction..."
                    placeholderTextColor={UI_COLORS.textDim}
                    value={customDistractionText}
                    onChangeText={setCustomDistractionText}
                  />
                )}

                <TouchableOpacity style={styles.startButton} onPress={handleSaveReflection}>
                  <LinearGradient colors={['#7b2ff7', '#00d4aa']} style={styles.startGradient}>
                    <Text style={styles.startText}>Save & Update Aurora Sky 🌌</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a1a' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: UI_COLORS.border,
  },
  headerTitle: { color: UI_COLORS.text, fontSize: 18, fontWeight: '600' },
  closeButton: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: UI_COLORS.text, fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  setupArea: { gap: 14, marginBottom: 30 },
  heroTitle: { color: UI_COLORS.text, fontSize: 24, fontWeight: '700' },
  heroSub: { color: UI_COLORS.textDim, fontSize: 13, lineHeight: 18 },
  label: { color: '#00d4aa', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 10 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '48%', backgroundColor: UI_COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: UI_COLORS.border, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  catCardActive: { borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)' },
  catEmoji: { fontSize: 22 },
  catLabel: { color: UI_COLORS.text, fontSize: 13, fontWeight: '600', flex: 1 },
  customInput: {
    backgroundColor: UI_COLORS.surface, borderRadius: 12, borderWidth: 1,
    borderColor: UI_COLORS.border, padding: 12, color: UI_COLORS.text, fontSize: 13, marginTop: 8,
  },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1, backgroundColor: UI_COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: UI_COLORS.border, padding: 12,
  },
  modeCardActive: { borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)' },
  modeTitle: { color: UI_COLORS.text, fontSize: 14, fontWeight: '600' },
  modeSub: { color: UI_COLORS.textDim, fontSize: 11, marginTop: 4 },

  targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  targetLabel: { color: UI_COLORS.textDim, fontSize: 13 },
  targetInput: {
    backgroundColor: UI_COLORS.surface, borderRadius: 10, borderWidth: 1,
    borderColor: UI_COLORS.border, width: 80, textAlign: 'center',
    color: '#00d4aa', fontSize: 16, fontWeight: '700', paddingVertical: 6,
  },

  panicToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: UI_COLORS.surface, borderRadius: 14, borderWidth: 1,
    borderColor: UI_COLORS.border, padding: 12, marginTop: 10,
  },
  panicToggleActive: { borderColor: '#ff0055', backgroundColor: 'rgba(255,0,85,0.1)' },
  panicEmoji: { fontSize: 22 },
  panicTitle: { color: UI_COLORS.text, fontSize: 14, fontWeight: '700' },
  panicSub: { color: UI_COLORS.textDim, fontSize: 11, marginTop: 2 },
  panicStatus: { color: '#ff0055', fontSize: 12, fontWeight: '800' },

  startButton: { borderRadius: 16, overflow: 'hidden', marginTop: 14 },
  startGradient: { paddingVertical: 16, alignItems: 'center' },
  startText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  runningArea: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  runningBadge: { color: '#00d4aa', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  timerDisplay: { color: '#fff', fontSize: 56, fontWeight: '800', letterSpacing: 2 },
  targetSubText: { color: '#00d4aa', fontSize: 14, fontWeight: '600' },

  runningSub: {
    color: UI_COLORS.textDim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  stopButton: {
    backgroundColor: '#ff3366',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  stopText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  panicStopButton: {
    backgroundColor: 'rgba(255,0,85,0.2)',
    borderWidth: 1.5,
    borderColor: '#ff0055',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
    position: 'relative',
    width: '85%',
    alignItems: 'center',
  },
  holdProgressOverlay: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    backgroundColor: '#ff0055', opacity: 0.5,
  },
  panicStopText: { color: '#fff', fontSize: 14, fontWeight: '800', zIndex: 2 },

  reflectArea: { gap: 14, marginBottom: 30 },
  reflectTitle: { color: UI_COLORS.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  reflectSub: { color: UI_COLORS.textDim, fontSize: 13, textAlign: 'center', lineHeight: 21 },
  highlightText: { color: '#00d4aa', fontWeight: '700' },
  reflectBox: {
    backgroundColor: UI_COLORS.surface, borderRadius: 18, borderWidth: 1,
    borderColor: UI_COLORS.border, padding: 16, gap: 12, marginTop: 10,
  },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputLabel: { color: UI_COLORS.text, fontSize: 13, fontWeight: '500', flex: 1 },
  reflectInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, borderWidth: 1,
    borderColor: UI_COLORS.border, width: 65, textAlign: 'center',
    color: '#00d4aa', fontSize: 16, fontWeight: '700', paddingVertical: 6,
  },
  divider: { height: 1, backgroundColor: UI_COLORS.border },

  distGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  distCard: {
    width: '48%', backgroundColor: UI_COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: UI_COLORS.border, padding: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  distCardActive: { borderColor: '#ffaa00', backgroundColor: 'rgba(255,170,0,0.08)' },
  distEmoji: { fontSize: 18 },
  distLabel: { color: UI_COLORS.text, fontSize: 12, fontWeight: '500' },
});