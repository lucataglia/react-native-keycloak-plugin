import AsyncStorage from '@react-native-community/async-storage';
import { TOKENS as TOKENS_KEY, CONFIG as CONFIG_KEY } from './Constants';


const TokenStorage = {
  saveConfiguration: async (conf) => {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(conf));
  },

  saveTokens: async (tokens) => {
    await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  },

  getConfiguration: async () => {
    const conf = await AsyncStorage.getItem(CONFIG_KEY);
    return (conf) ? JSON.parse(conf) : undefined;
  },

  getTokens: async () => {
    const tokens = await AsyncStorage.getItem(TOKENS_KEY);
    return (tokens) ? JSON.parse(tokens) : undefined;
  },

  clearSession: async () => {
    await AsyncStorage.clear();
  },
};

export default TokenStorage;
