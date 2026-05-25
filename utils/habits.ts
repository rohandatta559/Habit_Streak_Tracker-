export type HabitDifficulty = 'easy' | 'medium' | 'hard';

export type Habit = {
  id: string;
  name: string;
  days: number[];
  difficulty: HabitDifficulty;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderNotificationId?: string;
  completedDates: string[];
  createdAt: string;
};

export type HabitInput = {
  name: string;
  days: number[];
  difficulty: HabitDifficulty;
  reminderEnabled: boolean;
  reminderTime: string;
};

export function getTodayKey(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getDateKeyDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getTodayKey(date);
}

export function isScheduledForToday(habit: Habit, date = new Date()): boolean {
  return habit.days.includes(date.getDay());
}

export function isCompletedOnDate(habit: Habit, dateKey: string): boolean {
  return habit.completedDates.includes(dateKey);
}

export function getCurrentStreak(habit: Habit): number {
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = getTodayKey(cursor);
    if (!habit.completedDates.includes(key)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getCompletionRate(habit: Habit, days = 30): number {
  const end = new Date();
  let scheduled = 0;
  let completed = 0;

  for (let i = 0; i < days; i += 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - i);
    if (habit.days.includes(date.getDay())) {
      scheduled += 1;
      if (habit.completedDates.includes(getTodayKey(date))) {
        completed += 1;
      }
    }
  }

  if (scheduled === 0) {
    return 0;
  }

  return Math.round((completed / scheduled) * 100);
}

export function getRecentDateKeys(days = 30): string[] {
  const end = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - i);
    keys.push(getTodayKey(date));
  }
  return keys;
}

export function getGamificationBadges(habits: Habit[]): string[] {
  const badges = new Set<string>();
  const totalHabits = habits.length;
  const totalCurrentStreak = habits.reduce((sum, habit) => sum + getCurrentStreak(habit), 0);
  const avgCompletion = totalHabits
    ? Math.round(habits.reduce((sum, habit) => sum + getCompletionRate(habit), 0) / totalHabits)
    : 0;

  if (totalHabits >= 3) badges.add('System Builder');
  if (totalCurrentStreak >= 7) badges.add('7-Day Momentum');
  if (totalCurrentStreak >= 30) badges.add('Consistency Master');
  if (avgCompletion >= 70) badges.add('Reliable Performer');
  if (avgCompletion >= 90) badges.add('Near Perfect');

  return [...badges];
}
