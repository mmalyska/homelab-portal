import AsyncStorage from "@react-native-async-storage/async-storage";
import { TokenSet } from "./types";

const KEYS = {
  accessToken: "auth.at",
  refreshToken: "auth.rt",
  idToken: "auth.it",
  expiresAt: "auth.exp",
};

export const saveTokens = async (tokens: TokenSet): Promise<void> => {
  await Promise.all([
    AsyncStorage.setItem(KEYS.accessToken, tokens.accessToken),
    AsyncStorage.setItem(KEYS.refreshToken, tokens.refreshToken),
    AsyncStorage.setItem(KEYS.idToken, tokens.idToken),
    AsyncStorage.setItem(KEYS.expiresAt, tokens.expiresAt.toString()),
  ]);
};

export const loadTokens = async (): Promise<TokenSet | null> => {
  const [at, rt, it, exp] = await Promise.all([
    AsyncStorage.getItem(KEYS.accessToken),
    AsyncStorage.getItem(KEYS.refreshToken),
    AsyncStorage.getItem(KEYS.idToken),
    AsyncStorage.getItem(KEYS.expiresAt),
  ]);
  if (!at || !rt || !it || !exp) return null;
  return {
    accessToken: at,
    refreshToken: rt,
    idToken: it,
    expiresAt: parseInt(exp, 10),
  };
};

export const clearTokens = async (): Promise<void> => {
  await Promise.all(
    Object.values(KEYS).map((key) => AsyncStorage.removeItem(key)),
  );
};
