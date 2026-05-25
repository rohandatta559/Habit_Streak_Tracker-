import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useHabits } from '@/context/HabitsContext';
import { getCurrentStreak, isCompletedOnDate, isScheduledForToday, getTodayKey } from '@/utils/habits';

export default function TodayScreen() {
  const { habits, toggleTodayCompletion } = useHabits();
  const todayKey = getTodayKey();
  const todayHabits = habits.filter((habit) => isScheduledForToday(habit));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.subtitle}>{todayHabits.length} habits planned</Text>

      {todayHabits.length === 0 ? (
        <Text style={styles.empty}>No habits scheduled for today.</Text>
      ) : (
        todayHabits.map((habit) => {
          const done = isCompletedOnDate(habit, todayKey);
          return (
            <TouchableOpacity
              key={habit.id}
              style={[styles.card, done && styles.cardDone]}
              onPress={() => toggleTodayCompletion(habit.id)}>
              <View>
                <Text style={styles.name}>{habit.name}</Text>
                <Text style={styles.meta}>Current streak: {getCurrentStreak(habit)} days</Text>
              </View>
              <Text style={[styles.badge, done && styles.badgeDone]}>{done ? 'Done' : 'Mark'}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8', padding: 16, paddingTop: 60 },
  title: { fontSize: 30, fontWeight: '800', color: '#103f3f' },
  subtitle: { marginTop: 6, marginBottom: 18, color: '#496d6d' },
  empty: { color: '#496d6d', marginTop: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#deecec',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDone: { backgroundColor: '#dff4f1', borderColor: '#80d3c7' },
  name: { fontSize: 16, fontWeight: '700', color: '#133434' },
  meta: { marginTop: 4, color: '#557676' },
  badge: {
    backgroundColor: '#1f7a7a',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    overflow: 'hidden',
    fontWeight: '700',
  },
  badgeDone: { backgroundColor: '#1b9b71' },
});
