import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, ActivityIndicator, ScrollView, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { extractDeadlineFromImage } from '../services/aiService';
import { useAurora } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';

const MAX_FREE_SCANS = 3;

const FEELINGS = [
  { id: 'confident', label: 'Confident', emoji: '😌', desc: "I've got this" },
  { id: 'neutral',   label: 'Neutral',   emoji: '😐', desc: 'Just another task' },
  { id: 'anxious',   label: 'Anxious',   emoji: '😰', desc: 'This one worries me' },
];

export default function DocumentUploadScreen({ onClose }) {
  const [step, setStep] = useState('upload');
  const [extractedData, setExtractedData] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedCourse, setEditedCourse] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [feeling, setFeeling] = useState(null);
  const [error, setError] = useState(null);
  const [showLimitCard, setShowLimitCard] = useState(false);

  const {
    addTask,
    isPremium,
    aiScanCount,
    incrementAiScanCount,
    setShowPaywall,
    courses,
  } = useAurora();

  const safeCourses = Array.isArray(courses) ? courses : [];

  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  const usedScans = Number(aiScanCount) || 0;
  const remainingScans = Math.max(0, MAX_FREE_SCANS - usedScans);
  const canUseAiScan = isPremium || remainingScans > 0;

  const showCard = () => {
    cardScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    cardOpacity.value = withTiming(1, { duration: 300 });
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const openPaywall = () => {
    onClose();
    setTimeout(() => setShowPaywall(true), 300);
  };

  const handlePickImage = async () => {
    if (!canUseAiScan) {
      setShowLimitCard(true);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Aurora Room needs photo access to scan assignments.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    if (!canUseAiScan) {
      setShowLimitCard(true);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Aurora Room needs camera access to snap assignments.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri) => {
    setStep('extracting');
    setError(null);
    setShowLimitCard(false);

    const result = await extractDeadlineFromImage(uri);
    if (result.success) {
      await incrementAiScanCount();

      setExtractedData(result.data);
      setEditedName(result.data.name || '');
      setEditedCourse(result.data.course || '');
      if (result.data.deadline) {
        setDeadlineDate(new Date(result.data.deadline));
      }
      setStep('details');
      showCard();
    } else {
      setError(result.error || 'Could not read that image. Try another photo or enter manually.');
      setStep('upload');
    }
  };

  const handleManualEntry = () => {
    setShowLimitCard(false);
    setExtractedData(null);
    setEditedName('');
    setEditedCourse('');
    setStep('details');
    showCard();
  };

  const goToFeeling = () => {
    if (!editedName.trim()) {
      Alert.alert('Name required', 'Please enter an assignment name.');
      return;
    }
    setStep('feeling');
  };

  const handleFinalSave = async (chosenFeeling) => {
    const task = {
      name: editedName,
      course: editedCourse,
      deadline: deadlineDate.toISOString(),
      feeling: chosenFeeling,
      priority: extractedData?.priority || 'medium',
    };
    await addTask(task);
    onClose();
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDeadlineDate(selectedDate);
  };

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#0a0a1a', '#0d1a2e']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'feeling' ? 'How do you feel?' : 'Add Assignment'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {step === 'upload' && (
            <View style={styles.uploadArea}>
              <View style={[styles.scanBadge, !canUseAiScan && styles.scanBadgeLocked]}>
                <Text style={[styles.scanBadgeText, !canUseAiScan && styles.scanBadgeTextLocked]}>
                  {isPremium
                    ? '⚡ AURORA PRO · UNLIMITED SCANS'
                    : canUseAiScan
                      ? `📷 FREE AI SCANS · ${remainingScans} LEFT (${usedScans}/${MAX_FREE_SCANS} USED)`
                      : '🔒 FREE AI SCANS USED UP (3/3)'}
                </Text>
              </View>

              <Text style={styles.uploadTitle}>Point at your assignment sheet</Text>
              <Text style={styles.uploadSubtext}>
                The AI will find the deadline.{'\n'}You'll confirm before anything is saved.
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              )}

              {showLimitCard && (
                <View style={styles.limitCard}>
                  <Text style={styles.limitTitle}>Free AI scans used</Text>
                  <Text style={styles.limitText}>
                    You’ve used all 3 free AI scans. Upgrade to Pro for unlimited scans, or enter the assignment manually for free.
                  </Text>

                  <TouchableOpacity style={styles.limitPrimaryBtn} onPress={openPaywall}>
                    <LinearGradient colors={['#7b2ff7', '#00d4aa']} style={styles.limitPrimaryGradient}>
                      <Text style={styles.limitPrimaryText}>Unlock Aurora Pro</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.limitSecondaryBtn} onPress={handleManualEntry}>
                    <Text style={styles.limitSecondaryText}>Enter manually (free)</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.cameraButton, !canUseAiScan && styles.buttonDisabled]}
                onPress={handleTakePhoto}
              >
                <LinearGradient
                  colors={canUseAiScan ? ['#7b2ff7', '#00d4aa'] : ['#333', '#444']}
                  style={styles.cameraGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.cameraText}>
                    {canUseAiScan ? 'Take a photo' : 'AI scan locked'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.galleryButton, !canUseAiScan && styles.buttonDisabled]}
                onPress={handlePickImage}
              >
                <Text style={styles.galleryText}>
                  {canUseAiScan ? 'Choose from gallery' : 'AI gallery scan locked'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
                <Text style={styles.manualText}>Enter manually instead (Free forever)</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'extracting' && (
            <View style={styles.extractingArea}>
              <ActivityIndicator size="large" color="#00d4aa" />
              <Text style={styles.extractingTitle}>Reading your assignment...</Text>
              <Text style={styles.extractingSubtext}>
                The AI is finding the deadline so you don't have to type it.
              </Text>
            </View>
          )}

          {step === 'details' && (
            <Animated.View style={[styles.confirmArea, cardStyle]}>
              <Text style={styles.confirmTitle}>
                {extractedData ? 'Confirm the details' : 'Add manually'}
              </Text>

              <View style={styles.confirmCard}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Assignment</Text>
                  <TextInput
                    style={styles.confirmInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="e.g. Midterm essay"
                    placeholderTextColor={UI_COLORS.textDim}
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Course</Text>
                  <TextInput
                    style={styles.confirmInput}
                    value={editedCourse}
                    onChangeText={setEditedCourse}
                    placeholder="e.g. CS 101"
                    placeholderTextColor={UI_COLORS.textDim}
                  />
                </View>

                {safeCourses.length > 0 && (
                  <View style={styles.coursePillsRow}>
                    {safeCourses.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.coursePill,
                          editedCourse === c.name && styles.coursePillActive,
                        ]}
                        onPress={() => setEditedCourse(c.name)}
                      >
                        <Text
                          style={[
                            styles.coursePillText,
                            editedCourse === c.name && styles.coursePillTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.confirmRow}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.confirmLabel}>Due</Text>
                  <Text style={styles.confirmDeadline}>{formatDate(deadlineDate)}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={deadlineDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                />
              )}

              <Text style={styles.confirmHint}>Tap the date to change it</Text>

              <TouchableOpacity style={styles.confirmButton} onPress={goToFeeling}>
                <LinearGradient
                  colors={['#7b2ff7', '#00d4aa']}
                  style={styles.confirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmButtonText}>Next</Text>
                </LinearGradient>
              </TouchableOpacity>

              {extractedData && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => setStep('upload')}
                >
                  <Text style={styles.retryText}>Try a different photo</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          {step === 'feeling' && (
            <View style={styles.feelingArea}>
              <Text style={styles.feelingTitle}>How do you feel about this?</Text>
              <Text style={styles.feelingSub}>
                Your honest answer helps the aurora match your headspace.
              </Text>

              <View style={styles.feelingList}>
                {FEELINGS.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.feelingCard,
                      feeling === f.id && styles.feelingCardActive,
                    ]}
                    onPress={() => setFeeling(f.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.feelingEmoji}>{f.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feelingLabel}>{f.label}</Text>
                      <Text style={styles.feelingDesc}>{f.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.confirmButton, !feeling && { opacity: 0.4 }]}
                onPress={() => feeling && handleFinalSave(feeling)}
                disabled={!feeling}
              >
                <LinearGradient
                  colors={['#7b2ff7', '#00d4aa']}
                  style={styles.confirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmButtonText}>Save assignment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a1a' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: UI_COLORS.border,
  },
  backButton: { paddingVertical: 4 },
  backText: { color: '#00d4aa', fontSize: 15, fontWeight: '500' },
  headerTitle: { color: UI_COLORS.text, fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1 },

  scanBadge: {
    backgroundColor: 'rgba(0,212,170,0.12)', borderWidth: 1, borderColor: '#00d4aa',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 8,
  },
  scanBadgeLocked: {
    backgroundColor: 'rgba(255,51,102,0.12)', borderColor: '#ff3366',
  },
  scanBadgeText: { color: '#00d4aa', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  scanBadgeTextLocked: { color: '#ff6699' },

  limitCard: {
    width: '100%',
    backgroundColor: 'rgba(255,51,102,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.35)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  limitTitle: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  limitText: { color: UI_COLORS.textDim, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  limitPrimaryBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  limitPrimaryGradient: { paddingVertical: 12, alignItems: 'center' },
  limitPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  limitSecondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  limitSecondaryText: { color: UI_COLORS.text, fontSize: 13, fontWeight: '600' },

  uploadArea: { padding: 24, alignItems: 'center', gap: 14, marginTop: 10 },
  uploadTitle: { color: UI_COLORS.text, fontSize: 22, fontWeight: '600', textAlign: 'center' },
  uploadSubtext: {
    color: UI_COLORS.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 8,
  },
  errorBox: {
    backgroundColor: '#ff440015', borderWidth: 1, borderColor: '#ff4400',
    borderRadius: 12, padding: 14, width: '100%',
  },
  errorText: { color: '#ff4400', fontSize: 13, textAlign: 'center' },
  cameraButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  cameraGradient: {
    paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  cameraIcon: { fontSize: 22 },
  cameraText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  galleryButton: {
    paddingVertical: 16, paddingHorizontal: 28, backgroundColor: UI_COLORS.surface,
    borderRadius: 16, borderWidth: 1, borderColor: UI_COLORS.border, width: '100%', alignItems: 'center',
  },
  galleryText: { color: UI_COLORS.text, fontSize: 15, fontWeight: '500' },
  buttonDisabled: { opacity: 0.7 },
  manualButton: { paddingVertical: 14, alignItems: 'center' },
  manualText: { color: UI_COLORS.textDim, fontSize: 14 },
  extractingArea: { padding: 60, alignItems: 'center', gap: 20, marginTop: 40 },
  extractingTitle: { color: UI_COLORS.text, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  extractingSubtext: { color: UI_COLORS.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  confirmArea: { padding: 24, gap: 16, marginTop: 16 },
  confirmTitle: { color: UI_COLORS.text, fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  confirmCard: {
    backgroundColor: UI_COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: UI_COLORS.border, overflow: 'hidden',
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  confirmLabel: { color: UI_COLORS.textDim, fontSize: 13, width: 70, fontWeight: '500' },
  confirmInput: { flex: 1, color: UI_COLORS.text, fontSize: 14, fontWeight: '500' },
  confirmDeadline: { flex: 1, color: '#00d4aa', fontSize: 14, fontWeight: '600' },
  coursePillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 12 },
  coursePill: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: UI_COLORS.border,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  coursePillActive: { borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.15)' },
  coursePillText: { color: UI_COLORS.textDim, fontSize: 11, fontWeight: '600' },
  coursePillTextActive: { color: '#00d4aa' },

  divider: { height: 1, backgroundColor: UI_COLORS.border, marginHorizontal: 16 },
  confirmHint: { color: UI_COLORS.textDim, fontSize: 12, textAlign: 'center' },
  confirmButton: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  confirmGradient: { paddingVertical: 18, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  retryButton: { alignItems: 'center', paddingVertical: 14 },
  retryText: { color: UI_COLORS.textDim, fontSize: 14 },

  feelingArea: { padding: 24, gap: 14, marginTop: 8 },
  feelingTitle: { color: UI_COLORS.text, fontSize: 22, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  feelingSub: { color: UI_COLORS.textDim, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  feelingList: { gap: 10 },
  feelingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16,
    backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: UI_COLORS.border,
  },
  feelingCardActive: { borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)' },
  feelingEmoji: { fontSize: 28 },
  feelingLabel: { color: UI_COLORS.text, fontSize: 15, fontWeight: '600' },
  feelingDesc: { color: UI_COLORS.textDim, fontSize: 12, marginTop: 2 },
});