import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useHabits } from '@/context/HabitsContext';

function xpForNextLevel(level: number) {
  return level * 120;
}

function getPerkLabel(perk: 'xpBoost' | 'questMultiplier' | 'freezeCapacity') {
  if (perk === 'xpBoost') return 'XP Boost';
  if (perk === 'questMultiplier') return 'Quest Multiplier';
  return 'Freeze Capacity';
}

function perkCost(level: number) {
  return 120 + level * 80;
}

export default function GameScreen() {
  const {
    game,
    totalCompletedToday,
    totalScheduledToday,
    claimDailyQuest,
    useStreakFreeze: consumeStreakFreeze,
    purchasePerk,
  } = useHabits();

  const pulse = useRef(new Animated.Value(1)).current;
  const levelGlow = useRef(new Animated.Value(0)).current;
  const confettiDrop = useRef(new Animated.Value(-20)).current;
  const previousLevelRef = useRef(game.level);
  const [showConfetti, setShowConfetti] = useState(false);

  const nextLevelXp = xpForNextLevel(game.level);
  const currentLevelBase = (game.level - 1) * 120;
  const progressInLevel = game.xp - currentLevelBase;
  const neededInLevel = nextLevelXp - currentLevelBase;
  const progress = Math.max(0, Math.min(1, progressInLevel / neededInLevel));

  const questReady = totalCompletedToday >= 3;
  const questText = useMemo(() => {
    if (questReady) return 'Quest ready: claim XP + freeze reward';
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

  useEffect(() => {
    if (game.level > previousLevelRef.current) {
      setShowConfetti(true);
      levelGlow.setValue(0);
      confettiDrop.setValue(-20);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(levelGlow, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(levelGlow, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]),
        Animated.timing(confettiDrop, { toValue: 50, duration: 700, useNativeDriver: true }),
      ]).start(() => setShowConfetti(false));
    }
    previousLevelRef.current = game.level;
  }, [confettiDrop, game.level, levelGlow]);

  async function onClaimQuest() {
    const result = await claimDailyQuest();
    Alert.alert(result.ok ? 'Quest' : 'Not ready', result.message);
  }

  async function onUseFreeze() {
    const result = await consumeStreakFreeze();
    Alert.alert(result.ok ? 'Freeze Used' : 'Unable', result.message);
  }

  async function onBuyPerk(perk: 'xpBoost' | 'questMultiplier' | 'freezeCapacity') {
    const result = await purchasePerk(perk);
    Alert.alert(result.ok ? 'Perk Upgraded' : 'Unable', result.message);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Game Room</Text>
      <Text style={styles.subtitle}>Make consistency fun and rewarding.</Text>

      {showConfetti ? (
        <Animated.View style={[styles.confettiRow, { transform: [{ translateY: confettiDrop }] }]}>
          <Text style={styles.confetti}>*</Text>
          <Text style={styles.confetti}>*</Text>
          <Text style={styles.confetti}>*</Text>
          <Text style={styles.confetti}>*</Text>
          <Text style={styles.confetti}>*</Text>
        </Animated.View>
      ) : null}

      <Animated.View style={{ opacity: levelGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) }}>
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
      </Animated.View>

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
        <Text style={styles.questMeta}>Today: {totalCompletedToday}/{totalScheduledToday} completed</Text>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity style={[styles.actionButton, !questReady && styles.disabled]} onPress={onClaimQuest}>
            <Text style={styles.actionText}>Claim Daily Quest</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.questCard}>
        <Text style={styles.sectionTitle}>Perk Shop</Text>
        {(['xpBoost', 'questMultiplier', 'freezeCapacity'] as const).map((perk) => {
          const level = game.perkLevels[perk];
          const cost = perkCost(level);
          return (
            <View key={perk} style={styles.perkRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkName}>{getPerkLabel(perk)}</Text>
                <Text style={styles.questMeta}>Level {level}/5</Text>
              </View>
              <TouchableOpacity style={styles.buyButton} onPress={() => onBuyPerk(perk)}>
                <Text style={styles.buyText}>{level >= 5 ? 'MAX' : `Buy ${cost}`}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.questCard}>
        <Text style={styles.sectionTitle}>Power-Ups</Text>
        <Text style={styles.questText}>Streak Freeze rescues one missed scheduled habit from yesterday.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onUseFreeze}>
          <Text style={styles.secondaryText}>Use Streak Freeze</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8' },
  content: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', color: '#103f3f' },
  subtitle: { marginTop: 6, marginBottom: 18, color: '#496d6d' },
  confettiRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  confetti: { color: '#1f7a7a', fontSize: 22, fontWeight: '900' },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#deecec', padding: 12, alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#155a5a' },
  kpiLabel: { marginTop: 4, color: '#5b7b7b', fontSize: 12 },
  progressCard: { marginTop: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#deecec', padding: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#103f3f', marginBottom: 8 },
  progressTrack: { height: 10, borderRadius: 10, backgroundColor: '#e5eeee', overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: '#23a27f' },
  progressMeta: { marginTop: 8, color: '#5b7b7b' },
  questCard: { marginTop: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#deecec', padding: 12 },
  questText: { color: '#355b5b' },
  questMeta: { marginTop: 6, color: '#5b7b7b', fontSize: 12 },
  actionButton: { marginTop: 10, backgroundColor: '#1f7a7a', borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  actionText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  perkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  perkName: { fontWeight: '700', color: '#1b4f4f' },
  buyButton: { backgroundColor: '#dff4f1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  buyText: { color: '#145f5f', fontWeight: '700' },
  secondaryButton: { marginTop: 10, backgroundColor: '#dff4f1', borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  secondaryText: { color: '#155a5a', fontWeight: '700' },
});
