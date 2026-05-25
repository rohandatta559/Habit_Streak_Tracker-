import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useHabits } from '@/context/HabitsContext';
import { HabitDifficulty } from '@/utils/habits';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DIFFICULTY_OPTIONS: HabitDifficulty[] = ['easy', 'medium', 'hard'];

type FormState = {
  name: string;
  days: number[];
  difficulty: HabitDifficulty;
  reminderEnabled: boolean;
  reminderTime: string;
};

const initialForm: FormState = {
  name: '',
  days: [1, 2, 3, 4, 5],
  difficulty: 'medium',
  reminderEnabled: false,
  reminderTime: '20:00',
};

export default function HabitsScreen() {
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingHabitId, setEditingHabitId] = useState('');

  const canSave = useMemo(() => form.name.trim().length > 1 && form.days.length > 0, [form]);

  function toggleDay(day: number) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((item) => item !== day)
        : [...prev.days, day].sort((a, b) => a - b),
    }));
  }

  function startEdit(habitId: string) {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    setEditingHabitId(habitId);
    setForm({
      name: habit.name,
      days: habit.days,
      difficulty: habit.difficulty ?? 'medium',
      reminderEnabled: habit.reminderEnabled,
      reminderTime: habit.reminderTime,
    });
  }

  function resetForm() {
    setForm(initialForm);
    setEditingHabitId('');
  }

  async function onSaveHabit() {
    if (!canSave) {
      Alert.alert('Missing details', 'Please add habit name and at least one day.');
      return;
    }

    if (editingHabitId) {
      await updateHabit(editingHabitId, {
        name: form.name,
        days: form.days,
        difficulty: form.difficulty,
        reminderEnabled: form.reminderEnabled,
        reminderTime: form.reminderTime,
      });
    } else {
      await addHabit({
        name: form.name,
        days: form.days,
        difficulty: form.difficulty,
        reminderEnabled: form.reminderEnabled,
        reminderTime: form.reminderTime,
      });
    }

    resetForm();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Habits</Text>
      <Text style={styles.subtitle}>Create, edit, and manage your systems.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
          placeholder="Habit name"
        />

        <View style={styles.daysRow}>
          {DAYS.map((label, idx) => {
            const active = form.days.includes(idx);
            return (
              <TouchableOpacity
                key={label}
                onPress={() => toggleDay(idx)}
                style={[styles.dayChip, active && styles.dayChipActive]}>
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Difficulty</Text>
        <View style={styles.daysRow}>
          {DIFFICULTY_OPTIONS.map((item) => {
            const active = form.difficulty === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setForm((prev) => ({ ...prev, difficulty: item }))}
                style={[styles.dayChip, active && styles.dayChipActive]}>
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Reminder</Text>
          <Switch
            value={form.reminderEnabled}
            onValueChange={(value) => setForm((prev) => ({ ...prev, reminderEnabled: value }))}
          />
        </View>

        <TextInput
          style={styles.input}
          value={form.reminderTime}
          onChangeText={(value) => setForm((prev) => ({ ...prev, reminderTime: value }))}
          placeholder="HH:MM (24h)"
        />

        <TouchableOpacity style={[styles.createButton, !canSave && styles.disabled]} onPress={onSaveHabit}>
          <Text style={styles.createText}>{editingHabitId ? 'Update Habit' : 'Add Habit'}</Text>
        </TouchableOpacity>

        {editingHabitId ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryText}>Cancel Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.section}>Your Habits</Text>
      {habits.map((habit) => (
        <View key={habit.id} style={styles.habitCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <Text style={styles.habitMeta}>{habit.days.map((day) => DAYS[day]).join(', ')}</Text>
            <Text style={styles.habitDiff}>Difficulty: {habit.difficulty ?? 'medium'}</Text>
          </View>
          <TouchableOpacity onPress={() => startEdit(habit.id)}>
            <Text style={styles.edit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteHabit(habit.id)}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8' },
  content: { padding: 16, paddingTop: 60, paddingBottom: 50 },
  title: { fontSize: 30, fontWeight: '800', color: '#103f3f' },
  subtitle: { marginTop: 6, marginBottom: 18, color: '#496d6d' },
  form: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderColor: '#deecec',
    borderWidth: 1,
  },
  input: {
    backgroundColor: '#f7fbfb',
    borderColor: '#d6e8e8',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  dayChip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#ebf2f2' },
  dayChipActive: { backgroundColor: '#1f7a7a' },
  dayChipText: { color: '#375757', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  dayChipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontWeight: '700', color: '#123838', marginBottom: 8 },
  createButton: { backgroundColor: '#1f7a7a', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  createText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  secondaryButton: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  secondaryText: { color: '#1f7a7a', fontWeight: '700' },
  section: { marginTop: 20, marginBottom: 10, fontSize: 18, fontWeight: '700', color: '#103f3f' },
  habitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deecec',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitName: { fontWeight: '700', color: '#173939' },
  habitMeta: { marginTop: 4, color: '#5e7a7a', fontSize: 12 },
  habitDiff: { marginTop: 4, color: '#245b5b', fontSize: 12, textTransform: 'capitalize' },
  edit: { color: '#1f7a7a', fontWeight: '700' },
  delete: { color: '#bf4343', fontWeight: '700' },
});
