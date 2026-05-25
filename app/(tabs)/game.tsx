import { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useHabits } from '@/context/HabitsContext';

function xpForNextLevel(level: number) {
  return level * 120;
}

export default function GameScreen() {
  const { game, totalCompletedToday, totalScheduledToday, claimDailyQuest, useStreakFreeze: consumeStreakFreeze } = useHabits();
  const pulse = useRef(new Animated.Value(1)).current;

  const nextLevelXp = xpForNextLevel(game.level);
  const currentLevelBase = (game.level - 1) * 120;
  const progressInLevel = game.xp - currentLevelBase;
  const neededInLevel = nextLevelXp - currentLevelBase;
  const progress = Math.max(0, Math.min(1, progressInLevel / neededInLevel));

  const questReady = totalCompletedToday >= 3;
  const questText = useMemo(() => {
    if (questReady) {
      return 'Quest ready: claim +50 XP and +1 Freeze';
    }
    return `Quest progress: ${totalCompletedToday}/3 habits completed today`;
  }, [questReady, totalCompletedToday]);

  useEffect(() => {
    if (!questReady) {
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, questReady]);

  async function onClaimQuest() {
    const result = await claimDailyQuest();
    Alert.alert(result.ok ? 'Quest' : 'Not ready', result.message);
  }

  async function onUseFreeze() {
    const result = await consumeStreakFreeze();
    Alert.alert(result.ok ? 'Freeze Used' : 'Unable', result.message);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Game Room</Text>
      <Text style={styles.subtitle}>Make consistency fun and rewarding.</Text>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>Lv {game.level}</Text>
          <Text style={styles.kpiLabel}>Level</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{game.xp}</Text>
          <Text style={styles.kpiLabel}>Total XP</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{game.streakFreezes}</Text>
          <Text style={styles.kpiLabel}>Freezes</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Level Progress</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressMeta}>
          {progressInLevel}/{neededInLevel} XP to level {game.level + 1}
        </Text>
      </View>

      <View style={styles.questCard}>
        <Text style={styles.sectionTitle}>Daily Quest</Text>
        <Text style={styles.questText}>{questText}</Text>
        <Text style={styles.questMeta}>
          Today: {totalCompletedToday}/{totalScheduledToday} completed
        </Text>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity style={[styles.actionButton, !questReady && styles.disabled]} onPress={onClaimQuest}>
            <Text style={styles.actionText}>Claim Daily Quest</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.questCard}>
        <Text style={styles.sectionTitle}>Power-Ups</Text>
        <Text style={styles.questText}>Streak Freeze now rescues one missed scheduled habit from yesterday.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onUseFreeze}>
          <Text style={styles.secondaryText}>Use Streak Freeze</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.questCard}>
        <Text style={styles.sectionTitle}>Challenge Mode</Text>
        <Text style={styles.questMeta}>7-Day Challenge: {game.challenges.sevenDayProgress}/7</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(game.challenges.sevenDayProgress / 7) * 100}%` }]} />
        </View>
        <Text style={[styles.questMeta, { marginTop: 8 }]}>30-Day Challenge: {game.challenges.thirtyDayProgress}/30</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(game.challenges.thirtyDayProgress / 30) * 100}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.badgesWrap}>
        {game.achievements.length === 0 ? <Text style={styles.empty}>No achievements unlocked yet.</Text> : null}
        {game.achievements.map((badge) => (
          <View key={badge} style={styles.badgeChip}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8' },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#103f3f' },
  subtitle: { marginTop: 6, marginBottom: 18, color: '#496d6d' },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deecec',
    padding: 12,
    alignItems: 'center',
  },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#155a5a' },
  kpiLabel: { marginTop: 4, color: '#5b7b7b', fontSize: 12 },
  progressCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deecec',
    padding: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#103f3f', marginBottom: 8 },
  progressTrack: { height: 10, borderRadius: 10, backgroundColor: '#e5eeee', overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: '#23a27f' },
  progressMeta: { marginTop: 8, color: '#5b7b7b' },
  questCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#deecec',
    padding: 12,
  },
  questText: { color: '#355b5b' },
  questMeta: { marginTop: 6, color: '#5b7b7b', fontSize: 12 },
  actionButton: {
    marginTop: 10,
    backgroundColor: '#1f7a7a',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: '#dff4f1',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryText: { color: '#155a5a', fontWeight: '700' },
  badgesWrap: {
    marginTop: 8,
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
});
