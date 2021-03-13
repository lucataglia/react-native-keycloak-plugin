import { decode as atob } from 'base-64';
import * as qs from 'query-string';
import uuidv4 from 'uuid/v4';
import TokenStorage from './TokenStorage';


const decodeToken = (token) => {
  let str = token.split('.')[1];

  str = str.replace('/-/g', '+');
  str = str.replace('/_/g', '/');
  switch (str.length % 4) {
    case 0:
      break;
    case 2:
      str += '==';
      break;
    case 3:
      str += '=';
      break;
    default:
      throw new Error('Invalid token');
  }

  str = (`${str}===`).slice(0, str.length + (str.length % 4));
  str = str.replace(/-/g, '+').replace(/_/g, '/');

  str = decodeURIComponent(escape(atob(str)));

  str = JSON.parse(str);
  return str;
};

const getRealmURL = (realm, authServerUrl) => {
  const url = authServerUrl.endsWith('/') ? authServerUrl : `${authServerUrl}/`;
  return `${url}realms/${encodeURIComponent(realm)}`;
};

const getLoginURL = (conf, scope) => {
  const {
    realm, redirectUri, resource, kcIdpHint, options, 'auth-server-url': authServerUrl,
  } = conf;
  const responseType = 'code';
  const state = uuidv4();
  const url = `${getRealmURL(realm, authServerUrl)}/protocol/openid-connect/auth?${qs.stringify({
    scope,
    kc_idp_hint: kcIdpHint,
    redirect_uri: redirectUri,
    client_id: resource,
    response_type: responseType,
    options,
    state,
  })}`;

  return {
    url,
    state,
  };
};


// TokensUtils
const extractKeyFromJwtTokenPayload = (key, token) => {
  const tokenBody = token.split('.')[1];
  const decoded = atob(tokenBody);
  return JSON.parse(decoded)[key];
};

const isAccessTokenExpired = async () =>
  TokenStorage.getTokens()
    .then(({ access_token: accessToken }) => {
      const tokenExpirationTime = extractKeyFromJwtTokenPayload('exp', accessToken);
      const now = Date.now() / 1000;
      return tokenExpirationTime > now;
    }).catch((e) => {
      console.error(`Error in 'async isAccessTokenExpired()' call: ${e}`);
      Promise.reject(e);
    });

const willAccessTokenExpireInLessThan = async seconds =>
  TokenStorage.getTokens()
    .then(({ access_token: accessToken }) => {
      const tokenExpirationTime = extractKeyFromJwtTokenPayload('exp', accessToken);
      const now = Date.now() / 1000;
      return (tokenExpirationTime - now) < seconds;
    }).catch((e) => {
      console.error(`Error in 'async isAccessTokenExpired()' call: ${e}`);
      Promise.reject(e);
    });

const TokensUtils = {
  isAccessTokenExpired,
  willAccessTokenExpireInLessThan,
};


export {
  TokensUtils,
  decodeToken,
  getRealmURL,
  getLoginURL,
};
