import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTES } from '../constants/palettes';
import { PurchaseService } from '../services/PurchaseService';

const AuroraContext = createContext(null);

function daysUntil(deadline) {
  if (!deadline) return null;
  return (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
}

function calculateAutoStress(tasks) {
  const now = new Date();
  let score = 0;
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  safeTasks.forEach((task) => {
    if (!task || task.completed) return;

    let base = 2;
    if (task.feeling === 'anxious') base = 3;
    if (task.feeling === 'confident') base = 1;

    let multiplier = 1;
    if (task.deadline) {
      const days = (new Date(task.deadline) - now) / (1000 * 60 * 60 * 24);
      if (days < 1) multiplier = 3;
      else if (days < 3) multiplier = 2;
      else if (days < 7) multiplier = 1.5;
    }

    score += base * multiplier;
  });

  if (score >= 8) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function calculateDeadlineGravity(tasks) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const active = safeTasks.filter((t) => t && !t.completed && t.deadline);
  if (active.length === 0) {
    return { gravityLevel: 0, nearestDays: null, speedBoost: 1, darkness: 0 };
  }

  let nearest = Infinity;
  active.forEach((t) => {
    const d = daysUntil(t.deadline);
    if (d !== null && d < nearest) nearest = d;
  });

  let gravityLevel = 0;
  let speedBoost = 1;
  let darkness = 0;

  if (nearest < 1) {
    gravityLevel = 3;
    speedBoost = 1.8;
    darkness = 0.28;
  } else if (nearest < 3) {
    gravityLevel = 2;
    speedBoost = 1.45;
    darkness = 0.18;
  } else if (nearest < 7) {
    gravityLevel = 1;
    speedBoost = 1.2;
    darkness = 0.1;
  }

  return { gravityLevel, nearestDays: nearest, speedBoost, darkness };
}

const LEVEL_RANK = { calm: 0, low: 1, medium: 2, high: 3, critical: 4 };
const RANK_LEVEL = ['calm', 'low', 'medium', 'high', 'critical'];

function maxLevel(a, b) {
  return RANK_LEVEL[Math.max(LEVEL_RANK[a] ?? 0, LEVEL_RANK[b] ?? 0)];
}

function getSpeedMultiplier(level) {
  switch (level) {
    case 'low': return 0.93;
    case 'medium': return 1.4;
    case 'high': return 2.55;
    case 'critical': return 3.0;
    default: return 0.93;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function AuroraProvider({ children }) {
  const [manualStress, setManualStress] = useState('low');
  const [tasks, setTasks] = useState([]);
  const [stressBusterPrefs, setStressBusterPrefs] = useState({ selectedIds: [], customSentence: '' });
  const [hasShownStressBusterThisSession, setHasShownStressBusterThisSession] = useState(false);
  const [showStressBuster, setShowStressBuster] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Monetization & AI Scans
  const [isPremium, setIsPremium] = useState(false);
  const [unlockedPalettes, setUnlockedPalettes] = useState(['midnight']);
  const [activePaletteId, setActivePaletteId] = useState('midnight');
  const [aiScanCount, setAiScanCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  // Streaks
  const [focusStreak, setFocusStreak] = useState(0);
  const [calmStreak, setCalmStreak] = useState(0);
  const [lastFocusDate, setLastFocusDate] = useState(null);
  const [lastCalmDate, setLastCalmDate] = useState(null);
  const [focusSessions, setFocusSessions] = useState([]);

  const autoStress = calculateAutoStress(tasks);
  const stressLevel = maxLevel(manualStress, autoStress);
  const gravity = calculateDeadlineGravity(tasks);

  const safePalettes = PALETTES || {};
  const activePalette = safePalettes[activePaletteId] || safePalettes.midnight || { states: {} };
  const currentAuroraState = activePalette.states?.[stressLevel] || activePalette.states?.low || { primary: '#00d4aa', label: 'Serene' };
  const auroraSpeed = getSpeedMultiplier(stressLevel) * gravity.speedBoost;
  const pitchDarkness = gravity.darkness;
  const stressSource = LEVEL_RANK[autoStress] > LEVEL_RANK[manualStress] ? 'auto' : 'manual';

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('aurora_tasks');
      const savedPrefs = await AsyncStorage.getItem('aurora_stress_prefs');
      const savedOnboarding = await AsyncStorage.getItem('aurora_onboarding');
      const savedPalette = await AsyncStorage.getItem('aurora_palette');
      const savedScans = await AsyncStorage.getItem('aurora_ai_scans');
      const savedFocusStreak = await AsyncStorage.getItem('aurora_focus_streak');
      const savedCalmStreak = await AsyncStorage.getItem('aurora_calm_streak');
      const savedLastFocus = await AsyncStorage.getItem('aurora_last_focus_date');
      const savedLastCalm = await AsyncStorage.getItem('aurora_last_calm_date');
      const savedSessions = await AsyncStorage.getItem('aurora_focus_sessions');

      let isPro = false;
      let unlockedP = ['midnight'];
      try {
        isPro = await PurchaseService.isProUnlocked();
        unlockedP = await PurchaseService.getUnlockedPalettes();
      } catch (e) {}

      setIsPremium(!!isPro);
      setUnlockedPalettes(Array.isArray(unlockedP) ? unlockedP : ['midnight']);

      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks);
          setTasks(Array.isArray(parsed) ? parsed : []);
        } catch (e) { setTasks([]); }
      }
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          if (Array.isArray(parsed)) setStressBusterPrefs({ selectedIds: parsed, customSentence: '' });
          else if (parsed && typeof parsed === 'object') setStressBusterPrefs(parsed);
        } catch (e) {}
      }
      if (savedOnboarding) {
        try { setOnboardingComplete(JSON.parse(savedOnboarding)); } catch(e){}
      }
      if (savedPalette && safePalettes[savedPalette]) setActivePaletteId(savedPalette);
      if (savedScans) setAiScanCount(parseInt(savedScans, 10) || 0);
      if (savedFocusStreak) setFocusStreak(parseInt(savedFocusStreak, 10) || 0);
      if (savedCalmStreak) setCalmStreak(parseInt(savedCalmStreak, 10) || 0);
      if (savedLastFocus) setLastFocusDate(savedLastFocus);
      if (savedLastCalm) setLastCalmDate(savedLastCalm);
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          setFocusSessions(Array.isArray(parsed) ? parsed : []);
        } catch (e) { setFocusSessions([]); }
      }
    } catch (e) {
      console.log('Error loading saved data:', e);
    }
  };

  const isPaletteUnlocked = (paletteId) => {
    const palette = safePalettes[paletteId];
    if (!palette) return false;
    if (palette.isFree || isPremium) return true;
    return Array.isArray(unlockedPalettes) && unlockedPalettes.includes(paletteId);
  };

  const selectPalette = async (paletteId) => {
    if (!isPaletteUnlocked(paletteId)) {
      setShowPaywall(true);
      return;
    }
    setActivePaletteId(paletteId);
    await AsyncStorage.setItem('aurora_palette', paletteId);
  };

  const buySinglePalette = async (paletteId) => {
    try {
      const updated = await PurchaseService.unlockSinglePalette(paletteId);
      setUnlockedPalettes(Array.isArray(updated) ? updated : ['midnight']);
    } catch (e) {}
    setActivePaletteId(paletteId);
    await AsyncStorage.setItem('aurora_palette', paletteId);
  };

  const unlockPro = async () => {
    try { await PurchaseService.unlockPro(); } catch(e){}
    setIsPremium(true);
    setShowPaywall(false);
  };

  const resetPurchasesForTesting = async () => {
    try { await PurchaseService.resetAllForTesting(); } catch(e){}
    setIsPremium(false);
    setUnlockedPalettes(['midnight']);
    setActivePaletteId('midnight');
    setAiScanCount(0);
    await AsyncStorage.setItem('aurora_palette', 'midnight');
    await AsyncStorage.setItem('aurora_ai_scans', '0');
  };

  const resetAiScans = async () => {
    setAiScanCount(0);
    await AsyncStorage.setItem('aurora_ai_scans', '0');
  };

  const incrementAiScanCount = async () => {
    const newCount = (Number(aiScanCount) || 0) + 1;
    setAiScanCount(newCount);
    await AsyncStorage.setItem('aurora_ai_scans', String(newCount));
  };

  const updateManualStress = (level) => setManualStress(level);

  const maybeUpdateFocusStreak = async () => {
    const today = todayKey();
    const yday = yesterdayKey();
    if (lastFocusDate === today) return;
    let next = 1;
    if (lastFocusDate === yday) next = focusStreak + 1;
    setFocusStreak(next);
    setLastFocusDate(today);
    await AsyncStorage.setItem('aurora_focus_streak', String(next));
    await AsyncStorage.setItem('aurora_last_focus_date', today);
  };

  const maybeUpdateCalmStreak = async (isCalm) => {
    if (!isCalm) return;
    const today = todayKey();
    const yday = yesterdayKey();
    if (lastCalmDate === today) return;
    let next = 1;
    if (lastCalmDate === yday) next = calmStreak + 1;
    setCalmStreak(next);
    setLastCalmDate(today);
    await AsyncStorage.setItem('aurora_calm_streak', String(next));
    await AsyncStorage.setItem('aurora_last_calm_date', today);
  };

  const logFocusSession = async (session) => {
    const entry = { id: Date.now().toString(), date: todayKey(), ...session };
    const safeSessions = Array.isArray(focusSessions) ? focusSessions : [];
    const updated = [entry, ...safeSessions].slice(0, 60);
    setFocusSessions(updated);
    await AsyncStorage.setItem('aurora_focus_sessions', JSON.stringify(updated));
    await maybeUpdateFocusStreak();

    const focus = session.actualFocusMins || 0;
    const distract = session.distractionMins || 0;
    const total = focus + distract;
    const ratio = total > 0 ? focus / total : 0;

    if (ratio >= 0.6) {
      await maybeUpdateCalmStreak(true);
      updateManualStress('low');
    } else if (ratio >= 0.4) {
      updateManualStress('medium');
    } else {
      updateManualStress('high');
    }

    return { ratio, entry };
  };

  const addTask = async (task) => {
    const newTask = {
      id: Date.now().toString(),
      feeling: 'neutral',
      ...task,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const updatedTasks = [...safeTasks, newTask];
    setTasks(updatedTasks);
    await AsyncStorage.setItem('aurora_tasks', JSON.stringify(updatedTasks));

    const prefs = stressBusterPrefs?.selectedIds || [];
    if (newTask.feeling === 'anxious' && Array.isArray(prefs) && prefs.length > 0) {
      setTimeout(() => setShowStressBuster(true), 800);
    }
  };

  const completeTask = async (taskId) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const updatedTasks = safeTasks.map((t) => (t && t.id === taskId ? { ...t, completed: true } : t));
    setTasks(updatedTasks);
    await AsyncStorage.setItem('aurora_tasks', JSON.stringify(updatedTasks));
    await maybeUpdateCalmStreak(true);
  };

  const saveStressBusterPrefs = async (prefs) => {
    setStressBusterPrefs(prefs || { selectedIds: [], customSentence: '' });
    await AsyncStorage.setItem('aurora_stress_prefs', JSON.stringify(prefs));
  };

  const completeOnboarding = async () => {
    setOnboardingComplete(true);
    await AsyncStorage.setItem('aurora_onboarding', JSON.stringify(true));
  };

  const dismissStressBuster = () => setShowStressBuster(false);

  return (
    <AuroraContext.Provider
      value={{
        stressLevel,
        manualStress,
        autoStress,
        stressSource,
        auroraSpeed,
        updateManualStress,
        tasks: Array.isArray(tasks) ? tasks : [],
        addTask,
        completeTask,
        stressBusterPrefs,
        saveStressBusterPrefs,
        showStressBuster,
        dismissStressBuster,
        onboardingComplete,
        completeOnboarding,
        currentAuroraState,

        gravity,
        pitchDarkness,

        focusStreak,
        calmStreak,
        focusSessions: Array.isArray(focusSessions) ? focusSessions : [],
        logFocusSession,

        isPremium,
        unlockedPalettes: Array.isArray(unlockedPalettes) ? unlockedPalettes : ['midnight'],
        isPaletteUnlocked,
        activePaletteId,
        activePalette,
        selectPalette,
        buySinglePalette,
        aiScanCount,
        incrementAiScanCount,
        resetAiScans,
        showPaywall,
        setShowPaywall,
        unlockPro,
        resetPurchasesForTesting,
      }}
    >
      {children}
    </AuroraContext.Provider>
  );
}

export const useAurora = () => {
  const context = useContext(AuroraContext);
  if (!context) throw new Error('useAurora must be used within AuroraProvider');
  return context;
};