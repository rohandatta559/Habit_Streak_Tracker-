import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitsContext';

export default function ProfileScreen() {
  const { userName, userId, authMode, logout } = useAuth();
  const { habits } = useHabits();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{userName}</Text>

        <Text style={[styles.label, { marginTop: 16 }]}>Active habits</Text>
        <Text style={styles.value}>{habits.length}</Text>

        <Text style={[styles.label, { marginTop: 16 }]}>Sync mode</Text>
        <Text style={styles.value}>{authMode === 'cloud' ? 'Cloud' : 'Local only'}</Text>
        <Text style={styles.helperText}>
          {authMode === 'cloud'
            ? 'Cloud sync active (Supabase).'
            : 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable cloud sync.'}
        </Text>

        <Text style={[styles.label, { marginTop: 16 }]}>User ID</Text>
        <Text style={styles.userId}>{userId}</Text>
      </View>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f8', padding: 16, paddingTop: 60 },
  title: { fontSize: 30, fontWeight: '800', color: '#103f3f', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderColor: '#deecec',
    borderWidth: 1,
    padding: 16,
  },
  label: { color: '#5e7a7a', fontSize: 13 },
  value: { color: '#183b3b', fontSize: 22, fontWeight: '700', marginTop: 3 },
  helperText: { color: '#5e7a7a', marginTop: 6 },
  userId: { color: '#3b5f5f', marginTop: 4, fontSize: 12 },
  logout: {
    marginTop: 18,
    backgroundColor: '#bf4343',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
