import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { isSupabaseEnabled, supabase } from '@/lib/supabase';
import { Habit, HabitDifficulty, HabitInput, getDateKeyDaysAgo, getTodayKey, isScheduledForToday } from '@/utils/habits';

type ChallengeState = {
  sevenDayStart: string;
  sevenDayProgress: number;
  thirtyDayStart: string;
  thirtyDayProgress: number;
};

type GameState = {
  xp: number;
  level: number;
  streakFreezes: number;
  lastQuestClaimDate: string;
  achievements: string[];
  challenges: ChallengeState;
};

type HabitsContextType = {
  isLoading: boolean;
  habits: Habit[];
  game: GameState;
  totalScheduledToday: number;
  totalCompletedToday: number;
  addHabit: (input: HabitInput) => Promise<void>;
  updateHabit: (habitId: string, input: HabitInput) => Promise<void>;
  toggleTodayCompletion: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  claimDailyQuest: () => Promise<{ ok: boolean; message: string }>;
  useStreakFreeze: () => Promise<{ ok: boolean; message: string }>;
};

const STORAGE_KEY = 'habit.items';
const GAME_STORAGE_KEY = 'habit.game';

const DEFAULT_GAME: GameState = {
  xp: 0,
  level: 1,
  streakFreezes: 1,
  lastQuestClaimDate: '',
  achievements: [],
  challenges: {
    sevenDayStart: getTodayKey(),
    sevenDayProgress: 0,
    thirtyDayStart: getTodayKey(),
    thirtyDayProgress: 0,
  },
};

const XP_BY_DIFFICULTY: Record<HabitDifficulty, number> = {
  easy: 8,
  medium: 12,
  hard: 18,
};

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function parseTime(time: string): { hour: number; minute: number } {
  const [hourText, minuteText] = time.split(':');
  return {
    hour: Number(hourText) || 20,
    minute: Number(minuteText) || 0,
  };
}

function levelFromXp(xp: number): number {
  return Math.floor(xp / 120) + 1;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function mergeAchievements(game: GameState, habits: Habit[], completedToday: number): string[] {
  const next = new Set(game.achievements);
  if (habits.length >= 1) next.add('First Habit Created');
  if (completedToday >= 1) next.add('Daily Starter');
  if (completedToday >= 3) next.add('3 Habits in One Day');
  if (game.level >= 3) next.add('Level 3 Reached');
  if (game.challenges.sevenDayProgress >= 7) next.add('7-Day Challenge Complete');
  if (game.challenges.thirtyDayProgress >= 30) next.add('30-Day Challenge Complete');
  return [...next];
}

function updateChallenges(baseGame: GameState, totalCompletedToday: number): GameState {
  const today = new Date();
  const todayKey = getTodayKey(today);

  const sevenStart = new Date(baseGame.challenges.sevenDayStart);
  const daysSinceSeven = Math.floor((today.getTime() - sevenStart.getTime()) / 86400000);

  const thirtyStart = new Date(baseGame.challenges.thirtyDayStart);
  const daysSinceThirty = Math.floor((today.getTime() - thirtyStart.getTime()) / 86400000);

  let nextChallenges = { ...baseGame.challenges };

  if (daysSinceSeven >= 7 || Number.isNaN(daysSinceSeven)) {
    nextChallenges = { ...nextChallenges, sevenDayStart: todayKey, sevenDayProgress: 0 };
  }
  if (daysSinceThirty >= 30 || Number.isNaN(daysSinceThirty)) {
    nextChallenges = { ...nextChallenges, thirtyDayStart: todayKey, thirtyDayProgress: 0 };
  }

  if (totalCompletedToday > 0) {
    nextChallenges.sevenDayProgress = Math.min(7, nextChallenges.sevenDayProgress + 1);
    nextChallenges.thirtyDayProgress = Math.min(30, nextChallenges.thirtyDayProgress + 1);
  }

  return { ...baseGame, challenges: nextChallenges };
}

async function scheduleHabitReminder(name: string, time: string): Promise<string> {
  if (Platform.OS === 'web') {
    return '';
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return '';
  }

  const { hour, minute } = parseTime(time);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Reminder',
      body: `Time to complete: ${name}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [game, setGame] = useState<GameState>(DEFAULT_GAME);

  const todayKey = getTodayKey();
  const totalScheduledToday = habits.filter((habit) => isScheduledForToday(habit)).length;
  const totalCompletedToday = habits.filter(
    (habit) => isScheduledForToday(habit) && habit.completedDates.includes(todayKey)
  ).length;

  useEffect(() => {
    async function loadHabits() {
      if (!userId) {
        setHabits([]);
        setGame(DEFAULT_GAME);
        setIsLoading(false);
        return;
      }

      try {
        const [habitsRaw, gameRaw] = await Promise.all([
          AsyncStorage.getItem(`${STORAGE_KEY}.${userId}`),
          AsyncStorage.getItem(`${GAME_STORAGE_KEY}.${userId}`),
        ]);

        if (habitsRaw) {
          setHabits(JSON.parse(habitsRaw) as Habit[]);
        } else {
          setHabits([]);
        }

        if (gameRaw) {
          const parsed = JSON.parse(gameRaw) as GameState;
          setGame({ ...DEFAULT_GAME, ...parsed, challenges: { ...DEFAULT_GAME.challenges, ...parsed.challenges } });
        } else {
          setGame(DEFAULT_GAME);
        }

        if (isSupabaseEnabled && supabase) {
          const { data } = await supabase.from('habits').select('payload').eq('user_id', userId).single();

          if (data?.payload) {
            const cloudHabits = data.payload as Habit[];
            setHabits(cloudHabits);
            await AsyncStorage.setItem(`${STORAGE_KEY}.${userId}`, JSON.stringify(cloudHabits));
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadHabits();
  }, [userId]);

  async function persistHabits(nextHabits: Habit[]) {
    setHabits(nextHabits);
    if (!userId) {
      return;
    }

    await AsyncStorage.setItem(`${STORAGE_KEY}.${userId}`, JSON.stringify(nextHabits));

    if (isSupabaseEnabled && supabase) {
      await supabase.from('habits').upsert({ user_id: userId, payload: nextHabits }, { onConflict: 'user_id' });
    }
  }

  async function persistGame(nextGame: GameState) {
    setGame(nextGame);
    if (!userId) {
      return;
    }
    await AsyncStorage.setItem(`${GAME_STORAGE_KEY}.${userId}`, JSON.stringify(nextGame));
  }

  async function addXp(amount: number, sourceHabits = habits, completedToday = totalCompletedToday) {
    const nextXp = game.xp + amount;
    const nextLevel = levelFromXp(nextXp);
    let baseGame: GameState = {
      ...game,
      xp: nextXp,
      level: nextLevel,
    };
    baseGame = updateChallenges(baseGame, completedToday);
    baseGame.achievements = mergeAchievements(baseGame, sourceHabits, completedToday);
    await persistGame(baseGame);
  }

  async function addHabit(input: HabitInput) {
    let notificationId = '';
    if (input.reminderEnabled) {
      notificationId = await scheduleHabitReminder(input.name, input.reminderTime);
    }

    const next: Habit = {
      id: `${Date.now()}`,
      name: input.name.trim(),
      days: input.days,
      difficulty: input.difficulty,
      reminderEnabled: input.reminderEnabled,
      reminderTime: input.reminderTime,
      reminderNotificationId: notificationId || undefined,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    const nextHabits = [next, ...habits];
    await persistHabits(nextHabits);
    await addXp(15, nextHabits);
  }

  async function updateHabit(habitId: string, input: HabitInput) {
    const target = habits.find((habit) => habit.id === habitId);
    let reminderNotificationId = target?.reminderNotificationId;

    if (target?.reminderNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(target.reminderNotificationId);
      reminderNotificationId = undefined;
    }

    if (input.reminderEnabled) {
      reminderNotificationId = await scheduleHabitReminder(input.name, input.reminderTime);
    }

    const nextHabits = habits.map((habit) =>
      habit.id === habitId
        ? {
            ...habit,
            name: input.name.trim(),
            days: input.days,
            difficulty: input.difficulty,
            reminderEnabled: input.reminderEnabled,
            reminderTime: input.reminderTime,
            reminderNotificationId: reminderNotificationId || undefined,
          }
        : habit
    );

    await persistHabits(nextHabits);
  }

  async function toggleTodayCompletion(habitId: string) {
    const nextHabits = habits.map((habit) => {
      if (habit.id !== habitId || !isScheduledForToday(habit)) {
        return habit;
      }

      const completed = habit.completedDates.includes(todayKey);
      return {
        ...habit,
        completedDates: completed
          ? habit.completedDates.filter((key) => key !== todayKey)
          : [...habit.completedDates, todayKey],
      };
    });

    const before = habits.find((item) => item.id === habitId);
    const wasCompleted = Boolean(before?.completedDates.includes(todayKey));

    await persistHabits(nextHabits);

    if (!wasCompleted && before) {
      const newlyCompletedToday = nextHabits.filter(
        (habit) => isScheduledForToday(habit) && habit.completedDates.includes(todayKey)
      ).length;
      await addXp(XP_BY_DIFFICULTY[before.difficulty ?? 'medium'], nextHabits, newlyCompletedToday);
    }
  }

  async function deleteHabit(habitId: string) {
    const target = habits.find((habit) => habit.id === habitId);
    if (target?.reminderNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(target.reminderNotificationId);
    }

    await persistHabits(habits.filter((habit) => habit.id !== habitId));
  }

  async function claimDailyQuest() {
    const isEligible = totalCompletedToday >= 3;
    if (!isEligible) {
      return { ok: false, message: 'Complete at least 3 habits today to claim the quest.' };
    }
    if (game.lastQuestClaimDate === todayKey) {
      return { ok: false, message: 'Daily quest already claimed today.' };
    }

    const nextXp = game.xp + 50;
    const nextLevel = levelFromXp(nextXp);
    let nextGame: GameState = {
      ...game,
      xp: nextXp,
      level: nextLevel,
      streakFreezes: game.streakFreezes + 1,
      lastQuestClaimDate: todayKey,
    };
    nextGame = updateChallenges(nextGame, totalCompletedToday);
    nextGame.achievements = mergeAchievements(nextGame, habits, totalCompletedToday);
    await persistGame(nextGame);

    return { ok: true, message: 'Quest claimed: +50 XP and +1 Streak Freeze.' };
  }

  async function useStreakFreeze() {
    if (game.streakFreezes <= 0) {
      return { ok: false, message: 'No streak freezes left.' };
    }

    const yesterdayKey = getDateKeyDaysAgo(1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const rescueTarget = habits.find(
      (habit) => habit.days.includes(yesterday.getDay()) && !habit.completedDates.includes(yesterdayKey)
    );

    if (!rescueTarget) {
      return { ok: false, message: 'No missed scheduled habit from yesterday to rescue.' };
    }

    const nextHabits = habits.map((habit) =>
      habit.id === rescueTarget.id
        ? {
            ...habit,
            completedDates: [...habit.completedDates, yesterdayKey],
          }
        : habit
    );

    await persistHabits(nextHabits);

    const xpGain = XP_BY_DIFFICULTY[rescueTarget.difficulty ?? 'medium'];
    const nextXp = game.xp + xpGain;
    const nextLevel = levelFromXp(nextXp);
    let nextGame: GameState = {
      ...game,
      streakFreezes: game.streakFreezes - 1,
      xp: nextXp,
      level: nextLevel,
    };
    nextGame = updateChallenges(nextGame, totalCompletedToday);
    nextGame.achievements = mergeAchievements(nextGame, nextHabits, totalCompletedToday);
    await persistGame(nextGame);

    return { ok: true, message: `Rescued '${rescueTarget.name}' from yesterday. +${xpGain} XP` };
  }

  const value = useMemo(
    () => ({
      isLoading,
      habits,
      game,
      totalScheduledToday,
      totalCompletedToday,
      addHabit,
      updateHabit,
      toggleTodayCompletion,
      deleteHabit,
      claimDailyQuest,
      useStreakFreeze,
    }),
    [isLoading, habits, game, totalScheduledToday, totalCompletedToday]
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits must be used within HabitsProvider');
  }
  return context;
}
