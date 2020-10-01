import * as qs from 'query-string';
import { Linking } from 'react-native';
import { encode as btoa } from 'base-64';
import { getRealmURL, getLoginURL } from './Utils';
import {
  GET, POST, URL,
} from './Constants';
import TokenStorage from './TokenStorage';

const basicHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

// ### PRIVATE METHODS

const onOpenURL = (conf, resolve, reject, state, event, callback) => {
  const isRedirectUrlADeepLink = event.url.startsWith(conf.appsiteUri);

  if (isRedirectUrlADeepLink) {
    const {
      state: stateFromUrl,
      code,
    } = qs.parse(qs.extract(event.url));

    if (state === stateFromUrl) {
      callback(conf, code, resolve, reject, event.url);
    }
  }
};

const retrieveTokens = async (conf, code, resolve, reject, deepLinkUrl) => {
  const {
    resource, credentials, realm, redirectUri, 'auth-server-url': authServerUrl,
  } = conf;

  const tokenUrl = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/token`;
  const method = POST;

  const headers = credentials && credentials.secret
    ? { ...basicHeaders, Authorization: `Basic ${btoa(`${resource}:${credentials.secret}`)}` }
    : basicHeaders;

  const body = qs.stringify({
    grant_type: 'authorization_code', redirect_uri: redirectUri, client_id: resource, code,
  });

  const options = { headers, method, body };
  const fullResponse = await fetch(tokenUrl, options);
  const jsonResponse = await fullResponse.json();

  if (fullResponse.ok) {
    await TokenStorage.saveConfiguration(conf);
    await TokenStorage.saveTokens(jsonResponse);
    resolve({ tokens: jsonResponse, deepLinkUrl });
  } else {
    console.error('Error during kc-retrieve-tokens');
    reject(jsonResponse);
  }
};

const performLogin = async (conf, scope = 'info', username, password) => {
  const {
    resource, realm, credentials, 'auth-server-url': authServerUrl,
  } = conf;
  const url = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/token`;
  const method = POST;
  const body = qs.stringify({
    grant_type: 'password',
    username,
    password,
    client_id: encodeURIComponent(resource),
    client_secret: credentials ? credentials.secret : undefined,
    scope,
  });
  const options = { headers: basicHeaders, method, body };

  const fullResponse = await fetch(url, options);
  const jsonResponse = await fullResponse.json();

  if (fullResponse.status === 200) {
    await TokenStorage.saveConfiguration(conf);
    await TokenStorage.saveTokens(jsonResponse);
    await TokenStorage.saveCredentials({ username, password });
    return jsonResponse;
  }

  console.error(`Error during kc-api-login, ${fullResponse.status}: ${jsonResponse.url}`);
  return Promise.reject();
};


// ### PUBLIC METHODS

export const keycloakUILogin = (conf, callback, scope = 'info') => new Promise(((resolve, reject) => {
  const { url, state } = getLoginURL(conf, scope);

  const listener = event => onOpenURL(conf, resolve, reject, state, event, retrieveTokens);
  Linking.addEventListener(URL, listener);

  const doLogin = callback || Linking.openURL;
  doLogin(url);
}));

export const login = async (conf, scope = 'info', username, password) => performLogin(conf, scope, username, password);

export const refreshLogin = async (scope = 'info') => {
  const conf = await TokenStorage.getConfiguration();
  if (!conf) {
    console.error('Error during kc-refresh-login: Could not read configuration from storage');
    return Promise.reject();
  }

  const credentials = await TokenStorage.getCredentials();
  if (!credentials) {
    console.error('Error during kc-refresh-login:  Could not read from AsyncStorage');
    return Promise.reject();
  }
  const { username, password } = credentials;
  if (!username || !password) {
    console.error('Error during kc-refresh-login: Username or Password not found');
    return Promise.reject();
  }

  return performLogin(conf, scope, username, password);
};

export const retrieveUserInfo = async () => {
  const conf = await TokenStorage.getConfiguration();

  if (!conf) {
    console.error('Error during kc-retrieve-user-info: Could not read configuration from storage');
    return Promise.reject();
  }

  const { realm, 'auth-server-url': authServerUrl } = conf;
  const savedTokens = await TokenStorage.getTokens();

  if (!savedTokens) {
    console.error(`Error during kc-retrieve-user-info, savedTokens is ${savedTokens}`);
    return Promise.reject();
  }

  const userInfoUrl = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/userinfo`;
  const method = GET;
  const headers = { ...basicHeaders, Authorization: `Bearer ${savedTokens.access_token}` };
  const options = { headers, method };
  const fullResponse = await fetch(userInfoUrl, options);
  const jsonResponse = await fullResponse.json();

  if (fullResponse.ok) {
    return jsonResponse;
  }

  console.error(`Error during kc-retrieve-user-info: ${fullResponse.status}: ${fullResponse.url}`);
  return Promise.reject();
};

export const refreshToken = async () => {
  const conf = await TokenStorage.getConfiguration();

  if (!conf) {
    console.error('Could not read configuration from storage');
    return Promise.reject();
  }

  const {
    resource, realm, credentials, 'auth-server-url': authServerUrl,
  } = conf;
  const savedTokens = await TokenStorage.getTokens();

  if (!savedTokens) {
    console.error(`Error during kc-refresh-token, savedTokens is ${savedTokens}`);
    return Promise.reject();
  }

  const refreshTokenUrl = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/token`;
  const method = POST;
  const body = qs.stringify({
    grant_type: 'refresh_token',
    refresh_token: savedTokens.refresh_token,
    client_id: encodeURIComponent(resource),
    client_secret: credentials ? credentials.secret : undefined,
  });
  const options = { headers: basicHeaders, method, body };

  const fullResponse = await fetch(refreshTokenUrl, options);
  const jsonResponse = await fullResponse.json();

  if (fullResponse.ok) {
    await TokenStorage.saveTokens(jsonResponse);
    return jsonResponse;
  }

  console.error(`Error during kc-refresh-token, ${fullResponse.status}: ${fullResponse.url}`);
  return Promise.reject(jsonResponse);
};

export const logout = async () => {
  const conf = await TokenStorage.getConfiguration();

  if (!conf) {
    console.error('Could not read configuration from storage');
    return Promise.reject();
  }

  const { realm, 'auth-server-url': authServerUrl } = conf;
  const savedTokens = await TokenStorage.getTokens();

  if (!savedTokens) {
    console.error(`Error during kc-logout, savedTokens is ${savedTokens}`);
    return Promise.reject();
  }

  const logoutUrl = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/logout`;
  const method = GET;
  const options = { headers: basicHeaders, method };
  const fullResponse = await fetch(logoutUrl, options);

  if (fullResponse.ok) {
    await TokenStorage.clearSession();
    return Promise.resolve();
  }

  console.error(`Error during kc-logout: ${fullResponse.status}: ${fullResponse.url}`);
  return Promise.reject();
};
