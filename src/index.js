import { login, logout, refreshToken, retrieveTokens, retrieveUserInfo } from './Core';

export { default as TokenStorage } from './TokenStorage';

export default {
  login,
  logout,
  refreshToken,
  retrieveTokens,
  retrieveUserInfo,
};
