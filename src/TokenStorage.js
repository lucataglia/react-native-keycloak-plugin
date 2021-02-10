import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKENS as TOKENS_KEY, CONFIG as CONFIG_KEY, CREDENTIALS } from './Constants';


const TokenStorage = {
  saveCredentials: async (credentials) => {
    await AsyncStorage.setItem(CREDENTIALS, JSON.stringify(credentials));
  },

  saveConfiguration: async (conf) => {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(conf));
  },

  saveTokens: async (tokens) => {
    await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  },

  getCredentials: async () => {
    const credentials = await AsyncStorage.getItem(CREDENTIALS);
    return (credentials) ? JSON.parse(credentials) : undefined;
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
