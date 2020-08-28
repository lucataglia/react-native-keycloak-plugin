import AsyncStorage from '@react-native-community/async-storage';
import { TOKENS as KEY } from './Constants';

const TokenStorage = {
  saveTokens: (tokens) => {
    AsyncStorage.setItem(KEY, JSON.stringify(tokens));
  },

  loadTokens: async () => {
    const tokens = await AsyncStorage.getItem(KEY);
    return (tokens) ? JSON.parse(tokens) : undefined;
  },

  clearTokens: () => {
    AsyncStorage.removeItem(KEY);
  },
};

export default TokenStorage;
