import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAurora, CAMPUS_PIN_TYPES } from '../context/AuroraContext';
import { UI_COLORS } from '../constants/colors';

const FEELING_EMOJI = {
  confident: '😌',
  neutral:   '😐',
  anxious:   '😰',
};

function HorizonCalendar({ tasks, calendarPins }) {
  const dates = [];
  const today = new Date();
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safePins = Array.isArray(calendarPins) ? calendarPins : [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  const isSameDay = (d1, dateStr) => {
    if (!dateStr) return false;
    const d2 = new Date(dateStr);
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const hasTaskOnDate = (date) => safeTasks.some((t) => t && !t.completed && isSameDay(date, t.deadline));
  const getPinOnDate = (date) => safePins.find((p) => p && isSameDay(date, p.date));

  return (
    <View style={styles.horizonContainer}>
      <Text style={styles.horizonHeader}>📅 7-DAY ACADEMIC HORIZON</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizonScrollContent}
      >
        {dates.map((date, idx) => {
          const isToday = idx === 0;
          const hasTask = hasTaskOnDate(date);
          const campusPin = getPinOnDate(date);
          const pinMeta = campusPin ? (CAMPUS_PIN_TYPES || []).find((t) => t.id === campusPin.type) : null;

          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });

          return (
            <View
              key={idx}
              style={[
                styles.horizonDayCard,
                isToday && styles.horizonTodayCard,
                hasTask && styles.horizonTaskCard,
                campusPin && styles.horizonPinCard,
              ]}
            >
              <Text style={[styles.horizonDayName, isToday && styles.horizonTodayText]}>
                {dayName}
              </Text>
              <Text style={[styles.horizonDayNum, isToday && styles.horizonTodayText]}>
                {dayNum}
              </Text>
              <Text style={[styles.horizonMonth, isToday && styles.horizonTodayText]}>
                {monthName}
              </Text>

              {/* Status indicators */}
              {campusPin ? (
                <Text style={styles.pinEmoji}>{pinMeta?.emoji || '📌'}</Text>
              ) : hasTask ? (
                <View style={styles.horizonDot} />
              ) : (
                <View style={styles.horizonEmptyDot} />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TaskItem({ task, onComplete, onOpenCram }) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtaskDone, setSubtaskDone] = useState([false, false, false]);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const getDaysUntil = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const due = new Date(deadline);
    const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDaysLabel = (days) => {
    if (days === null) return '';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today 🚨';
    if (days === 1) return 'Due tomorrow ⚡';
    return `${days} days left`;
  };

  const getDaysColor = (days) => {
    if (days === null) return UI_COLORS.textDim;
    if (days <= 0) return '#ff3366';
    if (days <= 2) return '#ffaa00';
    return '#00d4aa';
  };

  const toggleSubstep = (idx) => {
    const copy = [...subtaskDone];
    copy[idx] = !copy[idx];
    setSubtaskDone(copy);
  };

  const handleComplete = () => {
    if (!task || task.completed) return;
    glowOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0.6, { duration: 300 }),
      withTiming(0, { duration: 400 })
    );
    scale.value = withSequence(
      withTiming(0.96, { duration: 100 }),
      withSpring(1.04, { damping: 5, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    setTimeout(() => {
      translateX.value = withTiming(40, { duration: 400, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 400 }, () => {
        if (onComplete) runOnJS(onComplete)(task.id);
      });
    }, 500);
  };

  if (!task) return null;

  const days = getDaysUntil(task.deadline);
  const emoji = FEELING_EMOJI[task.feeling] || null;
  const isUrgent = days !== null && days <= 2 && !task.completed;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.taskItem, containerStyle]}>
      <Animated.View style={[styles.taskGlow, glowStyle]} />

      <TouchableOpacity
        style={styles.taskContent}
        onPress={handleComplete}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>

        <View style={styles.taskInfo}>
          <View style={styles.taskNameRow}>
            {emoji && <Text style={styles.feelingIcon}>{emoji}</Text>}
            <Text
              style={[styles.taskName, task.completed && styles.taskNameDone]}
              numberOfLines={2}
            >
              {task.name}
            </Text>
          </View>
          {task.course ? <Text style={styles.taskCourse}>{task.course}</Text> : null}
        </View>

        {days !== null && (
          <Text style={[styles.daysLabel, { color: getDaysColor(days) }]}>
            {getDaysLabel(days)}
          </Text>
        )}
      </TouchableOpacity>

      {!task.completed && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowSubtasks(!showSubtasks)}
          >
            <Text style={styles.actionBtnText}>
              📌 Sub-Steps ({subtaskDone.filter(Boolean).length}/3)
            </Text>
          </TouchableOpacity>

          {isUrgent && (
            <TouchableOpacity
              style={styles.cramBtn}
              onPress={() => onOpenCram && onOpenCram(task)}
            >
              <LinearGradient colors={['#ff0055', '#ff5500']} style={styles.cramGradient}>
                <Text style={styles.cramBtnText}>🚨 Cram Mode</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {showSubtasks && !task.completed && (
        <View style={styles.subtaskBox}>
          <Text style={styles.subtaskTitle}>MILESTONE BREAKDOWN:</Text>
          <TouchableOpacity style={styles.subtaskRow} onPress={() => toggleSubstep(0)}>
            <Text style={styles.subtaskCheck}>{subtaskDone[0] ? '☑' : '☐'}</Text>
            <Text style={[styles.subtaskText, subtaskDone[0] && styles.subtaskTextDone]}>
              Step 1: Outline & Formula / Resource Sheet
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.subtaskRow} onPress={() => toggleSubstep(1)}>
            <Text style={styles.subtaskCheck}>{subtaskDone[1] ? '☑' : '☐'}</Text>
            <Text style={[styles.subtaskText, subtaskDone[1] && styles.subtaskTextDone]}>
              Step 2: Core Practice Problems & Drafting
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.subtaskRow} onPress={() => toggleSubstep(2)}>
            <Text style={styles.subtaskCheck}>{subtaskDone[2] ? '☑' : '☐'}</Text>
            <Text style={[styles.subtaskText, subtaskDone[2] && styles.subtaskTextDone]}>
              Step 3: Final Polish & Exam Day Review
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

export default function TaskList({ onAddTask }) {
  const { tasks, calendarPins, completeTask } = useAurora();
  const [cramTask, setCramTask] = useState(null);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const activeTasks = safeTasks.filter((t) => t && !t.completed);
  const completedTasks = safeTasks.filter((t) => t && t.completed);

  return (
    <View style={styles.container}>
      <HorizonCalendar tasks={safeTasks} calendarPins={calendarPins} />

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Assignments & Exams</Text>
        <TouchableOpacity onPress={onAddTask} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.taskScroll} showsVerticalScrollIndicator={false}>
        {activeTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyText}>Clear skies ahead</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add Task" to log an assignment or exam</Text>
          </View>
        ) : (
          activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={completeTask}
              onOpenCram={(t) => setCramTask(t)}
            />
          ))
        )}

        {completedTasks.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={styles.completedHeader}>Completed ✓</Text>
            {completedTasks.slice(-3).map((task) => (
              <View key={task.id} style={styles.completedItem}>
                <Text style={styles.completedCheck}>✓</Text>
                <Text style={styles.completedName}>{task.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* CRAM MODE MODAL */}
      {cramTask && (
        <Modal
          visible={!!cramTask}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setCramTask(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.cramModalCard}>
              <Text style={styles.cramModalBadge}>🚨 EMERGENCY CRAM SCHEDULER</Text>
              <Text style={styles.cramModalTitle}>{cramTask.name}</Text>
              <Text style={styles.cramModalSub}>
                High-priority deadline approaching. Here is your stress-calibrated prep plan:
              </Text>

              <View style={styles.timetableBox}>
                <View style={styles.timetableRow}>
                  <Text style={styles.timetableTime}>BLOCK 1 (25m)</Text>
                  <Text style={styles.timetableTask}>Deep Concept & Formula Review</Text>
                </View>
                <View style={styles.timetableRow}>
                  <Text style={styles.timetableTime}>REST (5m)</Text>
                  <Text style={styles.timetableTask}>Step away & hydrate</Text>
                </View>
                <View style={styles.timetableRow}>
                  <Text style={styles.timetableTime}>BLOCK 2 (25m)</Text>
                  <Text style={styles.timetableTask}>Practice Questions / Problem Sets</Text>
                </View>
                <View style={styles.timetableRow}>
                  <Text style={styles.timetableTime}>REST (5m)</Text>
                  <Text style={styles.timetableTask}>Breathe & stretch</Text>
                </View>
                <View style={styles.timetableRow}>
                  <Text style={styles.timetableTime}>BLOCK 3 (15m)</Text>
                  <Text style={styles.timetableTask}>Final Summary & High-Yield Cards</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeCramBtn}
                onPress={() => setCramTask(null)}
              >
                <Text style={styles.closeCramText}>Let's Start Cramming 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },

  horizonContainer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  horizonHeader: {
    color: '#00d4aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  horizonScrollContent: {
    paddingHorizontal: 4,
    gap: 10,
  },
  horizonDayCard: {
    alignItems: 'center',
    justify: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 64,
  },
  horizonTodayCard: {
    backgroundColor: 'rgba(0,212,170,0.18)',
    borderColor: '#00d4aa',
  },
  horizonTaskCard: {
    borderColor: 'rgba(0,212,170,0.45)',
  },
  horizonPinCard: {
    borderColor: '#ffaa00',
    backgroundColor: 'rgba(255,170,0,0.12)',
  },
  horizonDayName: {
    color: UI_COLORS.textDim,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  horizonDayNum: {
    color: UI_COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  horizonMonth: {
    color: UI_COLORS.textDim,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  horizonTodayText: {
    color: '#00d4aa',
  },
  horizonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00d4aa',
    marginTop: 6,
  },
  horizonEmptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 6,
  },
  pinEmoji: {
    fontSize: 11,
    marginTop: 4,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: {
    color: UI_COLORS.text, fontSize: 16,
    fontWeight: '600', letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: UI_COLORS.surface, borderWidth: 1,
    borderColor: UI_COLORS.border,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  addButtonText: { color: UI_COLORS.text, fontSize: 13, fontWeight: '600' },
  taskScroll: { flex: 1 },

  taskItem: {
    backgroundColor: UI_COLORS.surface, borderWidth: 1,
    borderColor: UI_COLORS.border, borderRadius: 14,
    marginBottom: 10, overflow: 'hidden', position: 'relative',
  },
  taskGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#00d4aa', opacity: 0,
  },
  taskContent: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: UI_COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#00d4aa', borderColor: '#00d4aa' },
  checkmark: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feelingIcon: { fontSize: 15 },
  taskName: { color: UI_COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 },
  taskNameDone: { color: UI_COLORS.textDim, textDecorationLine: 'line-through' },
  taskCourse: { color: UI_COLORS.textDim, fontSize: 12, marginTop: 2 },
  daysLabel: { fontSize: 12, fontWeight: '700' },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnText: { color: '#00d4aa', fontSize: 11, fontWeight: '600' },

  cramBtn: { borderRadius: 8, overflow: 'hidden' },
  cramGradient: { paddingHorizontal: 10, paddingVertical: 5 },
  cramBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  subtaskBox: {
    backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', gap: 6,
  },
  subtaskTitle: { color: UI_COLORS.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtaskCheck: { color: '#00d4aa', fontSize: 14, fontWeight: 'bold' },
  subtaskText: { color: UI_COLORS.text, fontSize: 12, flex: 1 },
  subtaskTextDone: { color: UI_COLORS.textDim, textDecorationLine: 'line-through' },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 28, color: UI_COLORS.textDim, marginBottom: 4 },
  emptyText: { color: UI_COLORS.text, fontSize: 16, fontWeight: '500' },
  emptySubtext: { color: UI_COLORS.textDim, fontSize: 13 },
  completedSection: {
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: UI_COLORS.border,
  },
  completedHeader: {
    color: UI_COLORS.textDim, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  completedItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  completedCheck: { color: '#00d4aa', fontSize: 12 },
  completedName: { color: UI_COLORS.textDim, fontSize: 13, textDecorationLine: 'line-through' },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  cramModalCard: {
    width: '100%', backgroundColor: '#0d0a26', borderRadius: 20,
    borderWidth: 1, borderColor: '#ff0055', padding: 20, gap: 12,
  },
  cramModalBadge: { color: '#ff0055', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cramModalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  cramModalSub: { color: UI_COLORS.textDim, fontSize: 13, lineHeight: 18 },
  timetableBox: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    padding: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  timetableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timetableTime: { color: '#00d4aa', fontSize: 11, fontWeight: '800', width: 90 },
  timetableTask: { color: '#fff', fontSize: 12, flex: 1, fontWeight: '500' },
  closeCramBtn: {
    backgroundColor: '#ff0055', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  closeCramText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});