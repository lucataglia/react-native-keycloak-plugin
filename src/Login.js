import * as qs from 'query-string';
import { Linking } from 'react-native';
import { encode as btoa } from 'base-64';
import AsyncStorage from '@react-native-community/async-storage';
import { getRealmURL, getLoginURL } from './Utils';
import {
  GET, POST, URL,
} from './Constants';

const basicHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

class Login {
  constructor(tokenStorage) {
    this.tokenStorage = tokenStorage;
  }

  startLoginProcess(conf, callback, scope = 'openid') {
    return new Promise(((resolve, reject) => {
      const { url, state } = getLoginURL(conf, scope);

      const listener = event => this.onOpenURL(conf, resolve, reject, state, event);
      Linking.addEventListener(URL, listener);

      const login = callback || Linking.openURL;
      login(url);
    }));
  }

  onOpenURL(conf, resolve, reject, state, event) {
    const isRedirectUrlADeepLink = event.url.startsWith(conf.appsiteUri);

    if (isRedirectUrlADeepLink) {
      const {
        state: stateFromUrl,
        code,
      } = qs.parse(qs.extract(event.url));

      if (state === stateFromUrl) {
        this.retrieveTokens(conf, code, resolve, reject, event.url);
      }
    }
  }

  async retrieveTokens(conf, code, resolve, reject, deepLinkUrl) {
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
      this.tokenStorage.saveTokens(jsonResponse);
      resolve({ tokens: jsonResponse, deepLinkUrl });
    } else {
      reject(jsonResponse);
    }
  }

  async retrieveUserInfo(conf) {
    const { realm, 'auth-server-url': authServerUrl } = conf;
    const savedTokens = await this.getTokens();

    if (savedTokens) {
      const userInfoUrl = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/userinfo`;
      const method = GET;
      const headers = { ...basicHeaders, Authorization: `Bearer ${savedTokens.access_token}` };
      const options = { headers, method };
      const fullResponse = await fetch(userInfoUrl, options);

      if (fullResponse.ok) {
        return fullResponse.json();
      }
    }
    return Promise.reject();
  }

  async refreshToken(conf) {
    const { resource, realm, 'auth-server-url': authServerUrl } = conf;
    const savedTokens = await this.getTokens();

    if (!savedTokens) {
      console.warn('Missing tokens');
      return Promise.reject();
    }

    const refreshTokenUrl = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/token`;
    const method = POST;
    const body = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: savedTokens.refresh_token,
      client_id: encodeURIComponent(resource),
    });
    const options = { headers: basicHeaders, method, body };

    const fullResponse = await fetch(refreshTokenUrl, options);
    if (fullResponse.ok) {
      const jsonResponse = await fullResponse.json();
      this.tokenStorage.saveTokens(jsonResponse);
      return jsonResponse;
    }

    return Promise.reject();
  }

  async logoutKc(conf, callback, tokensKey) {
    const { realm, 'auth-server-url': authServerUrl } = conf;
    const savedTokens = tokensKey ? await AsyncStorage.getItem(tokensKey) : await this.getTokens();
    if (!savedTokens) {
      console.warn('Token is undefined');
      return Promise.reject();
    }

    const logoutUrl = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/logout`;
    const method = GET;
    const options = { headers: basicHeaders, method };
    const fullResponse = await fetch(logoutUrl, options);

    if (fullResponse.ok) {
      if (!tokensKey) {
        this.tokenStorage.clearTokens();
      } else {
        await AsyncStorage.removeItem(tokensKey);
      }
      callback();
      return 'OK';
    }

    throw new Error(`Error during kc-logout: ${fullResponse}`);
  }


  getTokens() {
    return this.tokenStorage.loadTokens();
  }
}

export default Login;
