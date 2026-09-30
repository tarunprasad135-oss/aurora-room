import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAurora } from '../context/AuroraContext';
import { PALETTES } from '../constants/palettes';
import { UI_COLORS } from '../constants/colors';

export default function PaywallScreen() {
  const { showPaywall, setShowPaywall, unlockPro, selectPalette } = useAurora();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  if (!showPaywall) return null;

  const handlePurchase = async () => {
    if (unlockPro) await unlockPro();
    if (selectPalette) selectPalette('sakura');
  };

  const safePalettesList = Array.isArray(Object.values(PALETTES || {})) ? Object.values(PALETTES || {}) : [];

  return (
    <Modal
      visible={showPaywall}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPaywall && setShowPaywall(false)}
    >
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#0d0a26', '#0a0a1a', '#120d31']} style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowPaywall && setShowPaywall(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Hero banner */}
            <View style={styles.hero}>
              <Text style={styles.badge}>✦ AURORA PRO FOR STUDENTS</Text>
              <Text style={styles.title}>Ace Exams & Lower Stress</Text>
              <Text style={styles.subtitle}>
                Unlock unlimited AI Document Scans, Emergency Cram Schedulers, and all 5 glowing Aurora Sky themes.
              </Text>
            </View>

            {/* Feature List */}
            <View style={styles.featureBox}>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>⚡</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Unlimited AI Document Scans</Text>
                  <Text style={styles.featureSub}>Scan homework sheets, syllabi & study guides</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🚨</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>1-Tap Emergency Cram Scheduler</Text>
                  <Text style={styles.featureSub}>Generates hour-by-hour exam prep timetables</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🎨</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>All 5 Glowing Aurora Sky Themes</Text>
                  <Text style={styles.featureSub}>Sakura, Ember, Deep Ocean, Cosmic, Forest Dawn</Text>
                </View>
              </View>
            </View>

            {/* Pricing Cards */}
            <Text style={styles.sectionHeader}>CHOOSE YOUR PLAN</Text>
            <View style={styles.plansContainer}>
              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardActive]}
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.8}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>BEST VALUE — SAVE 44%</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Annual Student Pro</Text>
                  <Text style={styles.planPrice}>$19.99 <Text style={styles.planPeriod}>/ year</Text></Text>
                </View>
                <Text style={styles.planSub}>Just $1.66/month, billed annually</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Monthly Pro</Text>
                  <Text style={styles.planPrice}>$2.99 <Text style={styles.planPeriod}>/ mo</Text></Text>
                </View>
                <Text style={styles.planSub}>Flexible month-to-month subscription</Text>
              </TouchableOpacity>
            </View>

            {/* CTA Unlock Button */}
            <TouchableOpacity style={styles.ctaButton} onPress={handlePurchase}>
              <LinearGradient
                colors={['#7b2ff7', '#00d4aa']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.ctaText}>Unlock Aurora Pro</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPaywall && setShowPaywall(false)} style={styles.skipButton}>
              <Text style={styles.skipText}>Continue with Free Version</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0a26' },
  container: { flex: 1 },
  header: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 12 },
  closeButton: {
    width: 36, height: 32, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  hero: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  badge: {
    color: '#00d4aa', fontSize: 12, fontWeight: '700',
    letterSpacing: 2, marginBottom: 6,
  },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    color: UI_COLORS.textDim, fontSize: 14, textAlign: 'center',
    lineHeight: 20, marginTop: 6, paddingHorizontal: 10,
  },
  featureBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 16, marginBottom: 20,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  featureIcon: { fontSize: 22 },
  featureText: { flex: 1 },
  featureTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  featureSub: { color: UI_COLORS.textDim, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },
  sectionHeader: {
    color: UI_COLORS.textDim, fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 12,
  },
  plansContainer: { gap: 12, marginBottom: 20 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 16, position: 'relative',
  },
  planCardActive: {
    borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)',
  },
  popularBadge: {
    position: 'absolute', top: -10, right: 16,
    backgroundColor: '#7b2ff7', paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: 10,
  },
  popularText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  planPrice: { color: '#00d4aa', fontSize: 18, fontWeight: '700' },
  planPeriod: { fontSize: 12, color: UI_COLORS.textDim, fontWeight: '400' },
  planSub: { color: UI_COLORS.textDim, fontSize: 12, marginTop: 4 },
  ctaButton: { borderRadius: 18, overflow: 'hidden', marginTop: 4 },
  ctaGradient: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  skipButton: { alignItems: 'center', paddingVertical: 18, marginBottom: 30 },
  skipText: { color: UI_COLORS.textDim, fontSize: 13 },
});