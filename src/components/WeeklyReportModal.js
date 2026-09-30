import React, { useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAurora } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_W } = Dimensions.get('window');
const DIAL_SIZE = Math.min(SCREEN_W - 80, 200);
const DIAL_STROKE = 14;
const DIAL_RADIUS = (DIAL_SIZE - DIAL_STROKE) / 2;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function inLast7Days(dateLike) {
  if (!dateLike) return false;
  const d = startOfDay(new Date(dateLike));
  const from = daysAgo(6);
  const to = startOfDay(new Date());
  return d >= from && d <= to;
}

function gradeFromFocus(focusRatio) {
  if (focusRatio >= 0.75) return { label: 'Clear Skies', emoji: '🌌', color: '#00d4aa' };
  if (focusRatio >= 0.55) return { label: 'Steady Glow', emoji: '🍃', color: '#7b2ff7' };
  if (focusRatio >= 0.35) return { label: 'Mixed Lights', emoji: '🌤', color: '#ffaa00' };
  return { label: 'Storm Watch', emoji: '⚡', color: '#ff3366' };
}

function formatMins(mins) {
  if (!mins || mins <= 0) return '0m';
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Apple Fitness-style animated Focus Dial ─────────────────
function FocusDial({ ratio, color, active }) {
  const progress = Math.min(Math.max(ratio || 0, 0), 1);
  const animatedProgress = useSharedValue(0);
  const [displayPct, setDisplayPct] = React.useState(0);

  useEffect(() => {
    if (active) {
      // reset then animate up like Apple Fitness rings
      animatedProgress.value = 0;
      setDisplayPct(0);
      animatedProgress.value = withTiming(progress, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      });

      // count-up number
      const target = Math.round(progress * 100);
      const steps = 28;
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        const next = Math.round((target * i) / steps);
        setDisplayPct(Math.min(next, target));
        if (i >= steps) clearInterval(timer);
      }, 1400 / steps);

      return () => clearInterval(timer);
    } else {
      animatedProgress.value = 0;
      setDisplayPct(0);
    }
  }, [active, progress]);

  const animatedProps = useAnimatedProps(() => {
    const p = animatedProgress.value;
    return {
      strokeDashoffset: DIAL_CIRCUMFERENCE * (1 - p),
    };
  });

  return (
    <View style={styles.dialWrap}>
      <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
        {/* Track */}
        <Circle
          cx={DIAL_SIZE / 2}
          cy={DIAL_SIZE / 2}
          r={DIAL_RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={DIAL_STROKE}
          fill="none"
        />
        {/* Animated progress arc */}
        <AnimatedCircle
          cx={DIAL_SIZE / 2}
          cy={DIAL_SIZE / 2}
          r={DIAL_RADIUS}
          stroke={color}
          strokeWidth={DIAL_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${DIAL_CIRCUMFERENCE} ${DIAL_CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${DIAL_SIZE / 2}, ${DIAL_SIZE / 2}`}
        />
      </Svg>
      <View style={styles.dialCenter}>
        <Text style={[styles.dialPct, { color }]}>{displayPct}%</Text>
        <Text style={styles.dialLabel}>FOCUSED</Text>
      </View>
    </View>
  );
}

// ── 7-Day Bar Chart ──────────────────────────────────────────
function WeekBarChart({ dailyData }) {
  const maxVal = Math.max(...dailyData.map((d) => d.focus + d.distract), 1);
  const chartW = SCREEN_W - 64;
  const chartH = 110;
  const barGap = 8;
  const barW = (chartW - barGap * 6) / 7;

  return (
    <View style={styles.chartWrap}>
      <Svg width={chartW} height={chartH + 24}>
        {dailyData.map((day, i) => {
          const x = i * (barW + barGap);
          const focusH = (day.focus / maxVal) * chartH;
          const distractH = (day.distract / maxVal) * chartH;
          const totalH = focusH + distractH;
          const baseY = chartH;

          return (
            <G key={i}>
              {distractH > 0 && (
                <Rect
                  x={x}
                  y={baseY - totalH}
                  width={barW}
                  height={Math.max(distractH, 2)}
                  rx={4}
                  fill="rgba(255,170,0,0.7)"
                />
              )}
              {focusH > 0 && (
                <Rect
                  x={x}
                  y={baseY - focusH}
                  width={barW}
                  height={Math.max(focusH, 2)}
                  rx={4}
                  fill="#00d4aa"
                />
              )}
              {totalH === 0 && (
                <Rect
                  x={x}
                  y={baseY - 4}
                  width={barW}
                  height={4}
                  rx={2}
                  fill="rgba(255,255,255,0.08)"
                />
              )}
              <SvgText
                x={x + barW / 2}
                y={chartH + 18}
                fill={day.isToday ? '#00d4aa' : 'rgba(255,255,255,0.4)'}
                fontSize="11"
                fontWeight={day.isToday ? '700' : '400'}
                textAnchor="middle"
              >
                {day.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00d4aa' }]} />
          <Text style={styles.legendText}>Focus</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(255,170,0,0.7)' }]} />
          <Text style={styles.legendText}>Distraction</Text>
        </View>
      </View>
    </View>
  );
}

export default function WeeklyReportModal({ visible, onClose }) {
  const {
    tasks,
    focusSessions,
    focusStreak,
    calmStreak,
    stressLevel,
    gravity,
  } = useAurora();

  const report = useMemo(() => {
    const sessions = (focusSessions || []).filter((s) => inLast7Days(s.date));

    let focusMins = 0;
    let distractMins = 0;

    sessions.forEach((s) => {
      focusMins += s.actualFocusMins || 0;
      distractMins += s.distractionMins || 0;
    });

    const totalTracked = focusMins + distractMins;
    const focusRatio = totalTracked > 0 ? focusMins / totalTracked : 0;

    const distractionMap = {};
    sessions.forEach((s) => {
      const key = s.mainDistraction || 'other';
      distractionMap[key] = (distractionMap[key] || 0) + (s.distractionMins || 0);
    });

    let topDistraction = null;
    Object.keys(distractionMap).forEach((k) => {
      if (!topDistraction || distractionMap[k] > distractionMap[topDistraction]) {
        topDistraction = k;
      }
    });

    const distractionLabels = {
      phone: 'Social / Doomscroll',
      gaming: 'Gaming / Videos',
      wandering: 'Mind Wandering',
      other: 'Other',
    };

    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = daysAgo(i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      let dayFocus = 0;
      let dayDistract = 0;

      sessions.forEach((s) => {
        const sd = new Date(s.date);
        if (sd >= dayStart && sd <= dayEnd) {
          dayFocus += s.actualFocusMins || 0;
          dayDistract += s.distractionMins || 0;
        }
      });

      dailyData.push({
        label: DAY_LABELS[dayStart.getDay()],
        focus: dayFocus,
        distract: dayDistract,
        isToday: i === 0,
      });
    }

    const createdThisWeek = (tasks || []).filter((t) => inLast7Days(t.createdAt));
    const completedCount = (tasks || []).filter((t) => t.completed).length;
    const activeCount = (tasks || []).filter((t) => !t.completed).length;
    const anxiousActive = (tasks || []).filter((t) => !t.completed && t.feeling === 'anxious').length;

    const grade = gradeFromFocus(focusRatio);
    const sessionCount = sessions.length;

    let insight = 'Log a few focus sessions this week to unlock deeper insights.';
    if (sessionCount > 0 && focusRatio >= 0.7) {
      insight = 'You protected deep focus this week. Your sky has reasons to stay calm.';
    } else if (sessionCount > 0 && focusRatio >= 0.45) {
      insight = 'Balanced week — real work happened, with some drift. Tiny guardrails will help.';
    } else if (sessionCount > 0) {
      insight = 'Distraction pulled hard this week. One honest 25-min block tomorrow can reset the sky.';
    } else if (anxiousActive > 0) {
      insight = 'You have anxious deadlines active. A short focus block can lower the gravity.';
    } else if (activeCount === 0) {
      insight = 'Clear workload right now. Keep a light streak going while the sky is calm.';
    }

    return {
      sessionCount,
      focusMins,
      distractMins,
      totalTracked,
      focusRatio,
      topDistraction: topDistraction ? distractionLabels[topDistraction] || topDistraction : '—',
      topDistractionMins: topDistraction ? distractionMap[topDistraction] : 0,
      createdCount: createdThisWeek.length,
      completedCount,
      activeCount,
      anxiousActive,
      grade,
      insight,
      dailyData,
    };
  }, [tasks, focusSessions]);

  const gravityLabel =
    gravity?.gravityLevel === 0 ? 'Calm sky'
    : gravity?.gravityLevel === 1 ? 'Pulling in'
    : gravity?.gravityLevel === 2 ? 'Heavy'
    : 'Critical pull';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#0a0a1a', '#120d31', '#0d1a2e']} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Weekly Aurora Report</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <LinearGradient
              colors={['rgba(123,47,247,0.28)', 'rgba(0,212,170,0.10)']}
              style={styles.heroCard}
            >
              <Text style={styles.heroEyebrow}>LAST 7 DAYS</Text>
              <Text style={[styles.heroGrade, { color: report.grade.color }]}>
                {report.grade.emoji}  {report.grade.label}
              </Text>
              <Text style={styles.heroInsight}>{report.insight}</Text>
            </LinearGradient>

            <Text style={styles.sectionHeader}>FOCUS RATIO</Text>
            <View style={styles.dialCard}>
              <FocusDial
                ratio={report.focusRatio}
                color={report.grade.color}
                active={visible}
              />
              <View style={styles.dialStats}>
                <View style={styles.dialStatItem}>
                  <Text style={[styles.dialStatVal, { color: '#00d4aa' }]}>
                    {formatMins(report.focusMins)}
                  </Text>
                  <Text style={styles.dialStatLbl}>Real Focus</Text>
                </View>
                <View style={styles.dialStatDivider} />
                <View style={styles.dialStatItem}>
                  <Text style={[styles.dialStatVal, { color: '#ffaa00' }]}>
                    {formatMins(report.distractMins)}
                  </Text>
                  <Text style={styles.dialStatLbl}>Distracted</Text>
                </View>
                <View style={styles.dialStatDivider} />
                <View style={styles.dialStatItem}>
                  <Text style={styles.dialStatVal}>{report.sessionCount}</Text>
                  <Text style={styles.dialStatLbl}>Sessions</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionHeader}>DAILY BREAKDOWN</Text>
            <View style={styles.chartCard}>
              <WeekBarChart dailyData={report.dailyData} />
            </View>

            <View style={styles.wideCard}>
              <Text style={styles.wideLabel}>TOP DISTRACTION THIS WEEK</Text>
              <Text style={styles.wideValue}>{report.topDistraction}</Text>
              {report.topDistractionMins > 0 && (
                <Text style={styles.wideSub}>
                  {formatMins(report.topDistractionMins)} lost to it
                </Text>
              )}
            </View>

            <Text style={styles.sectionHeader}>WORKLOAD & EMOTION</Text>
            <View style={styles.statGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{report.createdCount}</Text>
                <Text style={styles.statLabel}>Tasks added</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{report.activeCount}</Text>
                <Text style={styles.statLabel}>Still active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#ff6699' }]}>{report.anxiousActive}</Text>
                <Text style={styles.statLabel}>Anxious active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{report.completedCount}</Text>
                <Text style={styles.statLabel}>Completed total</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>SKY PATTERNS</Text>
            <View style={styles.listCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>🔥 Focus streak</Text>
                <Text style={styles.rowValue}>{focusStreak} day{focusStreak === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>🌊 Calm streak</Text>
                <Text style={styles.rowValue}>{calmStreak} day{calmStreak === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>⏳ Deadline gravity</Text>
                <Text style={styles.rowValue}>{gravityLabel}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>🌫 Current sky</Text>
                <Text style={[styles.rowValue, { color: report.grade.color }]}>
                  {String(stressLevel || 'low').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>What this means</Text>
              <Text style={styles.noteText}>
                Aurora Room doesn't judge perfect productivity. It tracks honesty —
                how studying felt, where attention went, and whether your sky recovered.
              </Text>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <LinearGradient colors={['#7b2ff7', '#00d4aa']} style={styles.doneGradient}>
                <Text style={styles.doneText}>Back to Your Room</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: UI_COLORS.border,
  },
  headerTitle: { color: UI_COLORS.text, fontSize: 18, fontWeight: '600' },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: UI_COLORS.text, fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  heroCard: {
    borderRadius: 20, padding: 18, marginBottom: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  heroEyebrow: {
    color: '#00d4aa', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8,
  },
  heroGrade: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  heroInsight: { color: UI_COLORS.textDim, fontSize: 14, lineHeight: 20 },

  sectionHeader: {
    color: UI_COLORS.textDim, fontSize: 11, fontWeight: '800',
    letterSpacing: 1.4, marginBottom: 10, marginTop: 4,
  },

  dialCard: {
    backgroundColor: UI_COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: UI_COLORS.border,
    padding: 20, alignItems: 'center', marginBottom: 18,
  },
  dialWrap: {
    width: DIAL_SIZE, height: DIAL_SIZE,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  dialCenter: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  dialPct: { fontSize: 36, fontWeight: '800' },
  dialLabel: {
    color: UI_COLORS.textDim, fontSize: 11, fontWeight: '700',
    letterSpacing: 2, marginTop: 2,
  },
  dialStats: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
  },
  dialStatItem: { flex: 1, alignItems: 'center' },
  dialStatVal: { color: '#fff', fontSize: 18, fontWeight: '800' },
  dialStatLbl: { color: UI_COLORS.textDim, fontSize: 11, marginTop: 2 },
  dialStatDivider: {
    width: 1, height: 28, backgroundColor: UI_COLORS.border,
  },

  chartCard: {
    backgroundColor: UI_COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: UI_COLORS.border,
    padding: 16, marginBottom: 14, alignItems: 'center',
  },
  chartWrap: { alignItems: 'center' },
  legendRow: {
    flexDirection: 'row', gap: 18, marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: UI_COLORS.textDim, fontSize: 12 },

  wideCard: {
    backgroundColor: UI_COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: UI_COLORS.border,
    padding: 14, marginBottom: 18,
  },
  wideLabel: { color: UI_COLORS.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  wideValue: { color: UI_COLORS.text, fontSize: 17, fontWeight: '700' },
  wideSub: { color: '#ffaa00', fontSize: 12, marginTop: 4 },

  statGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12,
  },
  statCard: {
    width: '48%', backgroundColor: UI_COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: UI_COLORS.border, padding: 14,
  },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: UI_COLORS.textDim, fontSize: 12, marginTop: 4 },

  listCard: {
    backgroundColor: UI_COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: UI_COLORS.border,
    padding: 14, marginBottom: 18,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: UI_COLORS.textDim, fontSize: 13 },
  rowValue: { color: UI_COLORS.text, fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: UI_COLORS.border, marginVertical: 10 },

  noteBox: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14, marginBottom: 16,
  },
  noteTitle: { color: '#00d4aa', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  noteText: { color: UI_COLORS.textDim, fontSize: 13, lineHeight: 19 },

  doneButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 30 },
  doneGradient: { paddingVertical: 16, alignItems: 'center' },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});