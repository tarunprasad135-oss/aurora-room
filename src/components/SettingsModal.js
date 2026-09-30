import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAurora } from '../context/AuroraContext';
import { PALETTES } from '../constants/palettes';
import { UI_COLORS } from '../constants/colors';
import WeeklyReportModal from './WeeklyReportModal';

export default function SettingsModal({ visible, onClose }) {
  const {
    isPremium,
    isPaletteUnlocked,
    activePaletteId,
    selectPalette,
    buySinglePalette,
    setShowPaywall,
    stressLevel,
    stressSource,
    focusStreak,
    calmStreak,
    gravity,
    tasks,
    unlockPro,
    resetPurchasesForTesting,
    resetAiScans,
  } = useAurora();

  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState('');
  const [demoTapCount, setDemoTapCount] = useState(0);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const handleFooterTap = () => {
    const nextCount = demoTapCount + 1;
    if (nextCount >= 3) {
      setShowDemoMenu(!showDemoMenu);
      setDemoTapCount(0);
      showToast(showDemoMenu ? 'Demo Sandbox Closed' : '🔓 Demo Sandbox Unlocked');
    } else {
      setDemoTapCount(nextCount);
      setTimeout(() => setDemoTapCount(0), 2000);
    }
  };

  const openPaywall = () => {
    onClose();
    setTimeout(() => setShowPaywall(true), 280);
  };

  const handlePalettePress = async (paletteId) => {
    const safePalettes = PALETTES || {};
    const palette = safePalettes[paletteId];
    if (!palette) return;

    if (isPaletteUnlocked && isPaletteUnlocked(paletteId)) {
      await selectPalette(paletteId);
      showToast(`${palette.name} equipped`);
      return;
    }

    try {
      await buySinglePalette(paletteId);
      showToast(`${palette.name} unlocked`);
    } catch (e) {
      openPaywall();
    }
  };

  const getSkyReason = () => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const activeTasks = safeTasks.filter((t) => t && !t.completed);
    const anxiousCount = activeTasks.filter((t) => t && t.feeling === 'anxious').length;

    if (stressSource === 'manual') return 'Overridden by manual stress selection';
    if (anxiousCount > 0 && gravity?.gravityLevel >= 2) {
      return `Driven by ${anxiousCount} anxious task(s) & urgent deadlines`;
    }
    if (anxiousCount > 0) return `Driven by ${anxiousCount} anxious assignment(s)`;
    if (gravity?.gravityLevel >= 2) return 'Driven by approaching deadline urgency';
    if (activeTasks.length > 0) return `${activeTasks.length} active task(s) in queue`;
    return 'All clear — serene skies ahead';
  };

  const gravityLabel =
    gravity?.gravityLevel === 0 ? 'Calm sky'
    : gravity?.gravityLevel === 1 ? 'Pulling in'
    : gravity?.gravityLevel === 2 ? 'Heavy'
    : 'Critical pull';

  const getPalettePrice = (p) => {
    if (!p) return '$0.99';
    if (p.isFree) return 'FREE';
    if (isPremium || (isPaletteUnlocked && isPaletteUnlocked(p.id))) return 'OWNED';
    return '$0.99';
  };

  const safePalettesList = Array.isArray(Object.values(PALETTES || {})) ? Object.values(PALETTES || {}) : [];

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView style={styles.safe}>
          <LinearGradient colors={['#0a0a1a', '#0d1a2e']} style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings & Themes</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusLabel}>ACCOUNT STATUS</Text>
                    <Text style={styles.statusTitle}>{isPremium ? 'Aurora Pro ✦' : 'Aurora Free'}</Text>
                  </View>
                  {!isPremium && (
                    <TouchableOpacity style={styles.upgradeBadge} onPress={openPaywall}>
                      <Text style={styles.upgradeText}>Upgrade</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />
                <View style={styles.statusRow}>
                  <Text style={styles.infoLabel}>Sky State</Text>
                  <Text style={styles.infoValue}>{String(stressLevel || 'low').toUpperCase()}</Text>
                </View>
                <Text style={styles.reasonText}>↳ {getSkyReason()}</Text>

                <View style={styles.divider} />
                <View style={styles.statusRow}>
                  <Text style={styles.infoLabel}>🔥 Focus streak</Text>
                  <Text style={styles.infoValue}>{focusStreak || 0} day{focusStreak === 1 ? '' : 's'}</Text>
                </View>
                <View style={[styles.statusRow, { marginTop: 6 }]}>
                  <Text style={styles.infoLabel}>🌊 Calm streak</Text>
                  <Text style={styles.infoValue}>{calmStreak || 0} day{calmStreak === 1 ? '' : 's'}</Text>
                </View>
                <View style={[styles.statusRow, { marginTop: 6 }]}>
                  <Text style={styles.infoLabel}>⏳ Deadline gravity</Text>
                  <Text style={styles.infoValue}>{gravityLabel}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.reportButton} onPress={() => setShowReport(true)} activeOpacity={0.85}>
                <LinearGradient
                  colors={['rgba(123,47,247,0.95)', 'rgba(0,212,170,0.85)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.reportGradient}
                >
                  <Text style={styles.reportTitle}>📊 Weekly Aurora Report</Text>
                  <Text style={styles.reportSub}>Focus ratio · distractions · streaks · sky grade</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.sectionHeader}>AURORA COLOR PALETTES</Text>
              <Text style={styles.sectionSub}>
                Changes glowing sky wave colors for every stress level. Free · $0.99 each · or all with Pro.
              </Text>
              <View style={styles.paletteGrid}>
                {safePalettesList.map((p) => {
                  if (!p || !p.id) return null;
                  const selected = activePaletteId === p.id;
                  const unlocked = isPaletteUnlocked && isPaletteUnlocked(p.id);
                  const price = getPalettePrice(p);

                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.paletteCard, selected && styles.paletteCardSelected]}
                      onPress={() => handlePalettePress(p.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.swatchContainer}>
                        <View style={[styles.swatchCircle, { backgroundColor: p.previewColor || '#00d4aa' }]} />
                        {selected ? (
                          <View style={styles.ownedPill}>
                            <Text style={styles.ownedPillText}>ON</Text>
                          </View>
                        ) : (
                          <View style={[
                            styles.pricePill,
                            price === 'FREE' && styles.pricePillFree,
                            price === 'OWNED' && styles.pricePillOwned,
                          ]}>
                            <Text style={styles.pricePillText}>{price}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.paletteName}>{p.name}</Text>
                      <Text style={styles.paletteTagline}>{p.tagline}</Text>
                      {!unlocked && !p.isFree && (
                        <Text style={styles.unlockHint}>Tap to unlock</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.legendCard}>
                <Text style={styles.legendTitle}>STUDENT PRICING</Text>
                <Text style={styles.legendLine}>• Midnight Cyan — Free</Text>
                <Text style={styles.legendLine}>• Extra Sky Themes — $0.99 each</Text>
                <Text style={styles.legendLine}>• 3 Free AI Assignment Scans</Text>
                <Text style={styles.legendLine}>• Aurora Pro — Unlimited AI Scans & All Themes ($2.99/mo)</Text>
              </View>

              {showDemoMenu && (
                <View style={styles.demoBox}>
                  <Text style={styles.demoTitle}>🛠 DEMO & TESTING SANDBOX</Text>

                  <TouchableOpacity
                    style={styles.demoBtnPro}
                    onPress={async () => {
                      if (unlockPro) await unlockPro();
                      showToast('✦ Pro Unlocked (Everything Free)');
                    }}
                  >
                    <Text style={styles.demoBtnText}>✦ Enable Pro (Unlock All)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.demoBtnReset}
                    onPress={async () => {
                      if (resetPurchasesForTesting) await resetPurchasesForTesting();
                      showToast('↺ Reset to Free Mode');
                    }}
                  >
                    <Text style={styles.demoBtnText}>↺ Reset to Free Mode</Text>
                  </TouchableOpacity>

                  {resetAiScans && (
                    <TouchableOpacity
                      style={styles.demoBtnScan}
                      onPress={async () => {
                        await resetAiScans();
                        showToast('📷 AI Scans Reset to 3/3');
                      }}
                    >
                      <Text style={styles.demoBtnText}>📷 Reset AI Scans (3 Left)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity onPress={handleFooterTap} activeOpacity={0.9} style={styles.footerInfo}>
                <Text style={styles.footerText}>Aurora Room v1.0.0</Text>
                <Text style={styles.footerText}>Shipaton 2026 · Next Gen</Text>
              </TouchableOpacity>
            </ScrollView>

            {!!toast && (
              <View style={styles.toast}>
                <Text style={styles.toastText}>{toast}</Text>
              </View>
            )}
          </LinearGradient>
        </SafeAreaView>
      </Modal>

      <WeeklyReportModal visible={showReport} onClose={() => setShowReport(false)} />
    </>
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

  statusCard: {
    backgroundColor: UI_COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: UI_COLORS.border,
    padding: 16, marginBottom: 16,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: UI_COLORS.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statusTitle: { color: '#00d4aa', fontSize: 18, fontWeight: '700', marginTop: 2 },
  upgradeBadge: { backgroundColor: '#7b2ff7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  upgradeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: UI_COLORS.border, marginVertical: 10 },
  infoLabel: { color: UI_COLORS.textDim, fontSize: 13 },
  infoValue: { color: UI_COLORS.text, fontSize: 13, fontWeight: '600' },
  reasonText: { color: '#00d4aa', fontSize: 11, fontStyle: 'italic', marginTop: 4 },

  reportButton: { borderRadius: 18, overflow: 'hidden', marginBottom: 22 },
  reportGradient: { paddingVertical: 16, paddingHorizontal: 16 },
  reportTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  reportSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },

  sectionHeader: { color: UI_COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: UI_COLORS.textDim, fontSize: 13, marginBottom: 12, lineHeight: 18 },

  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  paletteCard: {
    width: '48%', backgroundColor: UI_COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: UI_COLORS.border, padding: 14,
  },
  paletteCardSelected: { borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)' },
  swatchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  swatchCircle: { width: 32, height: 32, borderRadius: 16 },
  paletteName: { color: UI_COLORS.text, fontSize: 14, fontWeight: '600' },
  paletteTagline: { color: UI_COLORS.textDim, fontSize: 11, marginTop: 4, lineHeight: 15 },
  unlockHint: { color: '#7b2ff7', fontSize: 10, fontWeight: '700', marginTop: 8 },

  pricePill: {
    backgroundColor: 'rgba(0,212,170,0.12)', borderWidth: 1, borderColor: '#00d4aa',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  pricePillFree: { backgroundColor: 'rgba(0,212,170,0.18)', borderColor: '#00d4aa' },
  pricePillOwned: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' },
  pricePillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  ownedPill: {
    backgroundColor: 'rgba(0,212,170,0.2)', borderWidth: 1, borderColor: '#00d4aa',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  ownedPillText: { color: '#00d4aa', fontSize: 10, fontWeight: '800' },

  legendCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 14, marginBottom: 18, gap: 4,
  },
  legendTitle: { color: '#00d4aa', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  legendLine: { color: UI_COLORS.textDim, fontSize: 12, lineHeight: 18 },

  demoBox: {
    backgroundColor: 'rgba(123, 47, 247, 0.12)', borderWidth: 1, borderColor: '#7b2ff7',
    borderRadius: 16, padding: 14, marginBottom: 18, gap: 10,
  },
  demoTitle: { color: '#7b2ff7', fontSize: 12, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  demoBtnPro: { backgroundColor: '#7b2ff7', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  demoBtnReset: { backgroundColor: 'rgba(255,51,102,0.2)', borderWidth: 1, borderColor: '#ff3366', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  demoBtnScan: { backgroundColor: 'rgba(0,212,170,0.18)', borderWidth: 1, borderColor: '#00d4aa', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  demoBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  footerInfo: { alignItems: 'center', marginBottom: 30, gap: 4, marginTop: 4, paddingVertical: 10 },
  footerText: { color: UI_COLORS.textDim, fontSize: 12 },

  toast: {
    position: 'absolute', bottom: 28, left: 20, right: 20,
    backgroundColor: 'rgba(10,10,26,0.95)', borderWidth: 1, borderColor: '#00d4aa',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center',
  },
  toastText: { color: '#00d4aa', fontSize: 13, fontWeight: '700' },
});