import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHabits } from '@/context/HabitsContext';
import { getCompletionRate, getCurrentStreak, getGamificationBadges, getRecentDateKeys } from '@/utils/habits';

function HeatmapRow({ name, dates, completedDates }: { name: string; dates: string[]; completedDates: string[] }) {
  return (
    <View style={styles.heatmapRow}>
      <Text style={styles.heatmapName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.heatmapCells}>
        {dates.map((dateKey) => {
          const done = completedDates.includes(dateKey);
          return <View key={dateKey} style={[styles.heatmapCell, done && styles.heatmapCellDone]} />;
        })}
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { habits } = useHabits();
  const totalStreak = habits.reduce((sum, habit) => sum + getCurrentStreak(habit), 0);
  const avgCompletion = habits.length
    ? Math.round(habits.reduce((sum, habit) => sum + getCompletionRate(habit), 0) / habits.length)
    : 0;

  const dates = useMemo(() => getRecentDateKeys(30), []);
  const badges = useMemo(() => getGamificationBadges(habits), [habits]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stats</Text>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{habits.length}</Text>
          <Text style={styles.kpiLabel}>Total Habits</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{avgCompletion}%</Text>
          <Text style={styles.kpiLabel}>30-Day Avg</Text>
        </View>
      </View>

      <View style={styles.kpiCardFull}>
        <Text style={styles.kpiValue}>{totalStreak}</Text>
        <Text style={styles.kpiLabel}>Combined Current Streak Days</Text>
      </View>

      <Text style={styles.section}>Monthly Heatmap</Text>
      <View style={styles.block}>
        {habits.length === 0 ? <Text style={styles.empty}>Add habits to see heatmap.</Text> : null}
        {habits.map((habit) => (
          <HeatmapRow
            key={habit.id}
            name={habit.name}
            dates={dates}
            completedDates={habit.completedDates}
          />
        ))}
      </View>

      <Text style={styles.section}>Badges</Text>
      <View style={styles.badgesWrap}>
        {badges.length === 0 ? <Text style={styles.empty}>No badges yet. Keep going.</Text> : null}
        {badges.map((badge) => (
          <View key={badge} style={styles.badgeChip}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Per Habit</Text>
      {habits.map((habit) => (
        <View key={habit.id} style={styles.habitRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <Text style={styles.habitMeta}>Current streak: {getCurrentStreak(habit)} days</Text>
          </View>
          <Text style={styles.rate}>{getCompletionRate(habit)}%</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8' },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#103f3f', marginBottom: 16 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderColor: '#deecec',
    borderWidth: 1,
    padding: 16,
  },
  kpiCardFull: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderColor: '#deecec',
    borderWidth: 1,
    padding: 16,
  },
  kpiValue: { fontSize: 28, fontWeight: '800', color: '#145151' },
  kpiLabel: { marginTop: 2, color: '#5b7b7b' },
  section: { marginTop: 20, marginBottom: 10, fontSize: 18, fontWeight: '700', color: '#103f3f' },
  block: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deecec',
    padding: 10,
    gap: 8,
  },
  heatmapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heatmapName: { width: 70, fontSize: 12, color: '#3d6464', fontWeight: '700' },
  heatmapCells: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, gap: 3 },
  heatmapCell: { width: 8, height: 8, borderRadius: 2, backgroundColor: '#e0ecec' },
  heatmapCellDone: { backgroundColor: '#2aa981' },
  badgesWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deecec',
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeChip: { backgroundColor: '#dff4f1', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 },
  badgeText: { color: '#145f5f', fontWeight: '700', fontSize: 12 },
  empty: { color: '#6e8a8a' },
  habitRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deecec',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitName: { fontWeight: '700', color: '#173939' },
  habitMeta: { marginTop: 4, color: '#5e7a7a', fontSize: 12 },
  rate: { fontWeight: '800', color: '#1f7a7a' },
});
