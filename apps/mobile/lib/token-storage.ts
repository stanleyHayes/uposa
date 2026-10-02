import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'uposa_alumni_token';
export const REFRESH_TOKEN_KEY = 'uposa_alumni_refresh_token';

type TokenKey = typeof TOKEN_KEY | typeof REFRESH_TOKEN_KEY;

// Access/refresh tokens live in the Keychain / Android Keystore. Expo web has
// no SecureStore, so it keeps using AsyncStorage (localStorage) there.
const secure = Platform.OS !== 'web';

let migration: Promise<void> | null = null;

// Builds before SecureStore kept tokens in AsyncStorage: move them across once
// (so nobody is logged out by the upgrade) and delete the plain-text copies.
// A copy that fails to move is left in place and retried on the next launch.
function migrateLegacyTokens(): Promise<void> {
  migration ??= (async () => {
    for (const key of [TOKEN_KEY, REFRESH_TOKEN_KEY] as const) {
      try {
        const legacy = await AsyncStorage.getItem(key);
        if (legacy == null) continue;
        await SecureStore.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
      } catch {
        // keep the AsyncStorage copy; getToken still falls back to it
      }
    }
  })();
  return migration;
}

export async function getToken(key: TokenKey): Promise<string | null> {
  if (!secure) return AsyncStorage.getItem(key);
  await migrateLegacyTokens();
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value != null) return value;
  } catch {
    // unreadable entry (e.g. keystore restored from another device) — treat as absent
  }
  // Only non-null if migrating this token failed.
  return AsyncStorage.getItem(key);
}

export async function setToken(key: TokenKey, value: string): Promise<void> {
  if (!secure) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  // Finish the migration first so it can't later overwrite this with a legacy token.
  await migrateLegacyTokens();
  await SecureStore.setItemAsync(key, value);
}

export async function removeToken(key: TokenKey): Promise<void> {
  if (secure) {
    await migrateLegacyTokens();
    await SecureStore.deleteItemAsync(key).catch(() => {});
  }
  // Also drops any un-migrated legacy copy.
  await AsyncStorage.removeItem(key);
}
