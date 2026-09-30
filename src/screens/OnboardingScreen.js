import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAurora } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';

const CORE_RELAXATION_OPTIONS = [
  { id: 'breathing', label: 'Box Breathing',       emoji: '🫁', desc: '4s inhale, hold, 4s exhale' },
  { id: 'walk',      label: '5-Minute Walk',      emoji: '🚶', desc: 'Step away from your desk' },
  { id: 'music',     label: 'Lo-fi Chill Beats',  emoji: '🎧', desc: 'Listen to ambient room beats' },
  { id: 'tea',       label: 'Warm Tea or Coffee', emoji: '☕', desc: 'Sip a warm drink mindfully' },
  { id: 'stretch',   label: 'Quick Stretch',      emoji: '🧘', desc: 'Unclench jaw & drop shoulders' },
  { id: 'water',     label: 'Glass of Cold Water',emoji: '💧', desc: 'Hydrate to reset focus' },
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState(['breathing', 'music', 'water']);
  const [customText, setCustomText] = useState('');
  const { saveStressBusterPrefs, completeOnboarding } = useAurora();

  const toggleOption = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    const payload = {
      selectedIds: selected,
      customSentence: customText.trim(),
    };
    await saveStressBusterPrefs(payload);
    await completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#0a0a1a', '#0d1a2e']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.hero}>
            <Text style={styles.badge}>WELCOME TO AURORA ROOM</Text>
            <Text style={styles.title}>How do you relax your mind?</Text>
            <Text style={styles.subtitle}>
              Select what helps you reset. Your room's aurora will remind you when deadlines get intense.
            </Text>
          </View>

          {/* 6 Core Presets */}
          <View style={styles.list}>
            {CORE_RELAXATION_OPTIONS.map((item) => {
              const active = selected.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => toggleOption(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.label}</Text>
                    <Text style={styles.cardDesc}>{item.desc}</Text>
                  </View>
                  <View style={[styles.check, active && styles.checkActive]}>
                    {active && <Text style={styles.checkText}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Write-In Box */}
          <View style={styles.customBox}>
            <Text style={styles.customLabel}>✨ ANYTHING ELSE THAT CALMS YOU DOWN?</Text>
            <TextInput
              style={styles.customInput}
              value={customText}
              onChangeText={setCustomText}
              placeholder="e.g. Call my mom, light a candle..."
              placeholderTextColor={UI_COLORS.textDim}
            />
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.button} onPress={handleFinish}>
            <LinearGradient
              colors={['#7b2ff7', '#00d4aa']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Enter Your Room 🌌</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a1a' },
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  badge: { color: '#00d4aa', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  title: { color: UI_COLORS.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: UI_COLORS.textDim, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },

  list: { gap: 10, marginBottom: 18 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16,
    backgroundColor: UI_COLORS.surface, borderWidth: 1, borderColor: UI_COLORS.border,
  },
  cardActive: { borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)' },
  emoji: { fontSize: 24 },
  cardTitle: { color: UI_COLORS.text, fontSize: 14, fontWeight: '600' },
  cardDesc: { color: UI_COLORS.textDim, fontSize: 11, marginTop: 2 },
  check: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: UI_COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkActive: { backgroundColor: '#00d4aa', borderColor: '#00d4aa' },
  checkText: { color: '#0a0a1a', fontSize: 11, fontWeight: '800' },

  customBox: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14, marginBottom: 20,
  },
  customLabel: { color: '#00d4aa', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  customInput: {
    backgroundColor: UI_COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: UI_COLORS.border,
    padding: 12, color: UI_COLORS.text, fontSize: 13,
  },

  button: { borderRadius: 18, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});