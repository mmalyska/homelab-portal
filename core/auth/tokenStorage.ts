import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenSet } from './types';

const KEYS = {
  accessToken: 'auth.at',
  refreshToken: 'auth.rt',
  idToken: 'auth.it',
  expiresAt: 'auth.exp',
};

export const saveTokens = async (tokens: TokenSet): Promise<void> => {
  await AsyncStorage.multiSet([
    [KEYS.accessToken, tokens.accessToken],
    [KEYS.refreshToken, tokens.refreshToken],
    [KEYS.idToken, tokens.idToken],
    [KEYS.expiresAt, tokens.expiresAt.toString()],
  ]);
};

export const loadTokens = async (): Promise<TokenSet | null> => {
  const pairs = await AsyncStorage.multiGet(Object.values(KEYS));
  const [at, rt, it, exp] = pairs.map(([, v]) => v);
  if (!at || !rt || !it || !exp) return null;
  return {
    accessToken: at,
    refreshToken: rt,
    idToken: it,
    expiresAt: parseInt(exp, 10),
  };
};

export const clearTokens = (): Promise<void> =>
  AsyncStorage.multiRemove(Object.values(KEYS));
