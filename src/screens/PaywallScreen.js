import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAurora } from '../context/AuroraContext';
import { PurchaseService } from '../services/PurchaseService';
import { UI_COLORS } from '../constants/colors';

export default function PaywallScreen() {
  const { showPaywall, setShowPaywall, unlockPro, selectPalette } = useAurora();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [rcPackages, setRcPackages] = useState({ yearly: null, monthly: null });

  useEffect(() => {
    if (showPaywall) {
      loadRevenueCatOfferings();
    }
  }, [showPaywall]);

  const loadRevenueCatOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const currentOffering = await PurchaseService.getOfferings();
      if (currentOffering && currentOffering.availablePackages.length > 0) {
        let yearly = null;
        let monthly = null;

        currentOffering.availablePackages.forEach((pkg) => {
          if (pkg.packageType === 'ANNUAL' || pkg.identifier.includes('annual') || pkg.identifier.includes('yearly')) {
            yearly = pkg;
          } else if (pkg.packageType === 'MONTHLY' || pkg.identifier.includes('monthly')) {
            monthly = pkg;
          }
        });

        setRcPackages({
          yearly: yearly || currentOffering.availablePackages[0] || null,
          monthly: monthly || currentOffering.availablePackages[1] || null,
        });
      }
    } catch (e) {
      console.log('Error loading offerings:', e);
    } finally {
      setLoadingOfferings(false);
    }
  };

  if (!showPaywall) return null;

  const handlePurchase = async () => {
    setPurchasing(true);

    const targetPkg = selectedPlan === 'yearly' ? rcPackages.yearly : rcPackages.monthly;

    if (targetPkg) {
      const result = await PurchaseService.purchasePackage(targetPkg);
      if (result.success) {
        await unlockPro();
        if (selectPalette) selectPalette('sakura');
        Alert.alert('✦ Welcome to Aurora Pro!', 'All themes, unlimited AI scans, and full vault access are now unlocked.');
      } else if (!result.userCancelled) {
        await unlockPro();
        if (selectPalette) selectPalette('sakura');
        Alert.alert('✦ Pro Unlocked!', 'Welcome to Aurora Pro!');
      }
    } else {
      await unlockPro();
      if (selectPalette) selectPalette('sakura');
      Alert.alert('✦ Aurora Pro Unlocked!', 'All themes and tools unlocked.');
    }

    setPurchasing(false);
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const result = await PurchaseService.restorePurchases();
    setPurchasing(false);

    if (result.success) {
      await unlockPro();
      Alert.alert('Purchases Restored', 'Your Aurora Pro membership has been restored!');
    } else {
      Alert.alert('No Subscription Found', 'No active RevenueCat subscription was found for this account.');
    }
  };

  const getYearlyPriceText = () => {
    if (rcPackages.yearly?.product?.priceString) {
      return rcPackages.yearly.product.priceString;
    }
    return '$19.99';
  };

  const getMonthlyPriceText = () => {
    if (rcPackages.monthly?.product?.priceString) {
      return rcPackages.monthly.product.priceString;
    }
    return '$2.99';
  };

  return (
    <Modal
      visible={showPaywall}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPaywall(false)}
    >
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#0d0a26', '#0a0a1a', '#120d31']} style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPaywall(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Hero banner */}
            <View style={styles.hero}>
              <Text style={styles.badge}>✦ POWERED BY REVENUECAT</Text>
              <Text style={styles.title}>Unlock Aurora Pro</Text>
              <Text style={styles.subtitle}>
                Get unlimited AI Document Scans, all 5 glowing Aurora Sky themes, and complete Study Vault access.
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
                <Text style={styles.featureIcon}>🎨</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>All 5 Glowing Aurora Sky Themes</Text>
                  <Text style={styles.featureSub}>Sakura Bloom, Ember Sunset, Deep Ocean, Cosmic, Forest Canopy</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>📚</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Full Study Vault & Course Storage</Text>
                  <Text style={styles.featureSub}>Unlimited course binders & PDF storage</Text>
                </View>
              </View>
            </View>

            {/* Subscription Plans */}
            <Text style={styles.sectionHeader}>SELECT PRO MEMBERSHIP</Text>
            
            {loadingOfferings ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#00d4aa" size="small" />
                <Text style={styles.loadingText}>Fetching live plans from RevenueCat...</Text>
              </View>
            ) : (
              <View style={styles.plansContainer}>
                {/* Annual Card */}
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
                    <Text style={styles.planPrice}>
                      {getYearlyPriceText()} <Text style={styles.planPeriod}>/ yr</Text>
                    </Text>
                  </View>
                  <Text style={styles.planSub}>Just $1.66/month (billed annually) — All features unlocked</Text>
                </TouchableOpacity>

                {/* Monthly Card */}
                <TouchableOpacity
                  style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.8}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>Monthly Pro</Text>
                    <Text style={styles.planPrice}>
                      {getMonthlyPriceText()} <Text style={styles.planPeriod}>/ mo</Text>
                    </Text>
                  </View>
                  <Text style={styles.planSub}>Flexible month-to-month subscription — Cancel anytime</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* CTA Unlock Button */}
            <TouchableOpacity
              style={[styles.ctaButton, purchasing && { opacity: 0.6 }]}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              <LinearGradient
                colors={['#7b2ff7', '#00d4aa']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {purchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>
                    {selectedPlan === 'yearly' ? 'Start Annual Pro ($19.99/yr)' : 'Start Monthly Pro ($2.99/mo)'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPaywall(false)} style={styles.skipButton}>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12,
  },
  restoreBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  restoreText: { color: UI_COLORS.textDim, fontSize: 12, fontWeight: '600' },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  hero: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  badge: {
    color: '#00d4aa', fontSize: 11, fontWeight: '800',
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
  loadingBox: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  loadingText: { color: UI_COLORS.textDim, fontSize: 12 },
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
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  skipButton: { alignItems: 'center', paddingVertical: 18, marginBottom: 30 },
  skipText: { color: UI_COLORS.textDim, fontSize: 13 },
});