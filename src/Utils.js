import base64 from 'base-64';
import * as qs from 'query-string';
import uuidv4 from 'uuid/v4';

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

  str = decodeURIComponent(escape(base64.decode(str)));

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

export {
  decodeToken,
  getRealmURL,
  getLoginURL,
};
