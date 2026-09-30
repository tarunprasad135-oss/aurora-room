import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Modal, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAurora } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';
import RoomBackground from '../components/RoomBackground';
import StressToggle from '../components/StressToggle';
import TaskList from '../components/TaskList';
import StressBusterMessage from '../components/StressBusterMessage';
import DocumentUploadScreen from './DocumentUploadScreen';
import PaywallScreen from './PaywallScreen';
import SettingsModal from '../components/SettingsModal';
import FocusModal from '../components/FocusModal';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.85;
const MAX_FREE_SCANS = 3;

function AuroraIndicator({ auroraState }) {
  if (!auroraState) return null;
  return (
    <View style={styles.auroraIndicator}>
      <View style={[styles.auroraOrb, { backgroundColor: (auroraState.primary || '#00d4aa') + '60' }]}>
        <View style={[styles.auroraOrbCore, { backgroundColor: auroraState.primary || '#00d4aa' }]} />
      </View>
      <Text style={[styles.auroraLabel, { color: auroraState.primary || '#00d4aa' }]}>
        {auroraState.label || 'Aurora'}
      </Text>
    </View>
  );
}

// 100% Centered Circle Icon Button
function CircleIconButton({ label, onPress, children }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.iconButton} activeOpacity={0.8}>
      <Text style={styles.iconText}>{label}</Text>
      {children}
    </TouchableOpacity>
  );
}

export default function RoomScreen() {
  const { currentAuroraState, tasks, isPremium, aiScanCount } = useAurora();
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const drawerTranslate = useSharedValue(DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  const remainingScans = Math.max(0, MAX_FREE_SCANS - (aiScanCount || 0));
  const activeCount = (Array.isArray(tasks) ? tasks : []).filter((t) => t && !t.completed).length;

  const openDrawer = () => {
    setDrawerOpen(true);
    drawerTranslate.value = withSpring(0, { damping: 20, stiffness: 150 });
    backdropOpacity.value = withTiming(1, { duration: 250 });
  };

  const closeDrawer = () => {
    drawerTranslate.value = withTiming(DRAWER_WIDTH, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => setDrawerOpen(false), 260);
  };

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslate.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <RoomBackground>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <AuroraIndicator auroraState={currentAuroraState} />

            {/* Pinned to far right */}
            <View style={styles.topBarRight}>
              {/* ⏱️ Timer Button */}
              <CircleIconButton label="⏱️" onPress={() => setShowFocus(true)} />

              {/* ⚙ Settings Button */}
              <CircleIconButton label="⚙" onPress={() => setShowSettings(true)} />

              {/* ☰ Sidebar Button with Badge */}
              <CircleIconButton label="☰" onPress={openDrawer}>
                {activeCount > 0 && (
                  <View style={styles.taskBadge}>
                    <Text style={styles.taskBadgeText}>
                      {activeCount > 9 ? '9+' : String(activeCount)}
                    </Text>
                  </View>
                )}
              </CircleIconButton>
            </View>
          </View>

          {/* ROOM TITLE */}
          <View style={styles.roomTitle}>
            <Text style={styles.roomTitleText}>Your Study Space</Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* STRESS TOGGLE */}
          <View style={styles.floatingStressBar}>
            <BlurView intensity={40} tint="dark" style={styles.floatingStressBlur}>
              <StressToggle />
            </BlurView>
          </View>
        </SafeAreaView>
      </RoomBackground>

      <StressBusterMessage />
      <FocusModal visible={showFocus} onClose={() => setShowFocus(false)} />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
      <PaywallScreen />

      {/* SIDEBAR DRAWER */}
      {drawerOpen && (
        <>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>

          <Animated.View style={[styles.drawer, drawerStyle]}>
            <BlurView intensity={60} tint="dark" style={styles.drawerBlur}>
              <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerHeaderSpacer} />
                  <View style={styles.drawerHeaderCenter}>
                    <Text style={styles.drawerTitle}>Assignments</Text>
                    <Text style={styles.scanCounterText}>
                      {isPremium
                        ? '⚡ Pro · Unlimited AI Study Scans'
                        : `📷 ${remainingScans} free AI scan${remainingScans === 1 ? '' : 's'} left`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closeDrawer} style={styles.drawerCloseButton}>
                    <Text style={styles.drawerCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.drawerContent}>
                  <TaskList
                    onAddTask={() => {
                      closeDrawer();
                      setTimeout(() => setShowUpload(true), 300);
                    }}
                  />
                </View>
              </SafeAreaView>
            </BlurView>
          </Animated.View>
        </>
      )}

      <Modal
        visible={showUpload}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpload(false)}
      >
        <DocumentUploadScreen onClose={() => setShowUpload(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  safeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },

  auroraIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(10,10,26,0.5)',
    borderRadius: 20,
  },
  auroraOrb: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  auroraOrbCore: { width: 8, height: 8, borderRadius: 4 },
  auroraLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },

  // Pinned right
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginLeft: 'auto',
  },

  // 100% Mathematically Centered Circle Buttons
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,10,26,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
  },

  // Notification Badge
  taskBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00d4aa',
    borderWidth: 2,
    borderColor: '#0a0a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  taskBadgeText: {
    color: '#0a0a1a',
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
  },

  roomTitle: {
    alignItems: 'center',
    marginTop: 14,
  },
  roomTitleText: {
    color: UI_COLORS.textDim,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  floatingStressBar: {
    marginHorizontal: 40,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  floatingStressBlur: {
    backgroundColor: 'rgba(10,10,26,0.5)',
    paddingVertical: 4,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 50,
  },
  drawer: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 60,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  drawerBlur: {
    flex: 1,
    backgroundColor: 'rgba(10,10,26,0.85)',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifycontent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  drawerHeaderSpacer: { width: 32 },
  drawerHeaderCenter: { flex: 1, alignItems: 'center' },
  drawerTitle: {
    color: UI_COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  scanCounterText: {
    color: '#00d4aa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  drawerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifycontent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  drawerCloseText: { color: UI_COLORS.text, fontSize: 16 },
  drawerContent: { flex: 1, paddingTop: 12 },
});