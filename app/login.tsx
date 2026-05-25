import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { isAuthenticated, login, signUp, authMode } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const needsCloudFields = authMode === 'cloud';
  const canSubmit = useMemo(() => {
    if (needsCloudFields) {
      return name.trim().length > 1 && email.includes('@') && password.length >= 6;
    }
    return name.trim().length > 1;
  }, [name, email, password, needsCloudFields]);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/today" />;
  }

  async function onSubmit() {
    if (!canSubmit) {
      Alert.alert('Missing details', 'Please complete all required fields.');
      return;
    }

    const response = isSignUp
      ? await signUp(name, email.trim(), password)
      : await login(name, email.trim(), password);

    if (response.error) {
      Alert.alert('Auth failed', response.error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit + Streak</Text>
      <Text style={styles.subtitle}>
        {needsCloudFields ? 'Cloud mode enabled' : 'Local mode enabled'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      {needsCloudFields && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (6+ chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </>
      )}

      <TouchableOpacity style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={onSubmit}>
        <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Continue'}</Text>
      </TouchableOpacity>

      {needsCloudFields && (
        <TouchableOpacity onPress={() => setIsSignUp((prev) => !prev)}>
          <Text style={styles.linkText}>
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f4f7f8',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#103f3f',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 16,
    color: '#496d6d',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#d4e4e4',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  button: {
    marginTop: 4,
    backgroundColor: '#1f7a7a',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 14,
    color: '#1f7a7a',
    fontWeight: '600',
  },
});
