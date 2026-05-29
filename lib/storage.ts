import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function isWeb(): boolean {
  return Platform.OS === 'web';
}

async function getWebItem(key: string): Promise<string | null> {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

async function setWebItem(key: string, value: string): Promise<void> {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // ignore
  }
}

async function removeWebItem(key: string): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

async function getSecureStoreItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setSecureStoreItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore
  }
}

async function removeSecureStoreItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

async function getAsyncStorageItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function setAsyncStorageItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

async function removeAsyncStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb()) {
    return getWebItem(key);
  }

  const secureValue = await getSecureStoreItem(key);
  if (secureValue !== null) {
    return secureValue;
  }

  return getAsyncStorageItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb()) {
    await setWebItem(key, value);
    return;
  }

  await setSecureStoreItem(key, value);
  await setAsyncStorageItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (isWeb()) {
    await removeWebItem(key);
    return;
  }

  await removeSecureStoreItem(key);
  await removeAsyncStorageItem(key);
}
