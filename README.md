# react-native-keycloak-plugin
This is a fork of mahomahoxd's react-native-login-keycloak module. I started from that to build some new feature using a functional style.

This plugin exposes some util methods to interact with [KeyCloak][KeyCloakHome] in order to handle the user session. 

## Documentation

- [Install][InstallAnchor]
- [Usage][UsageAnchor]

## Install using npm

```shell
npm i --save react-native-keycloak-plugin
```

## Install using yarn

```shell
yarn add react-native-keycloak-plugin
```

## Setup

### App configuration

Please configure [Linking](https://facebook.github.io/react-native/docs/linking.html) module, including steps for handling Universal links (This might get changed due to not being able to close the tab on leave, ending up with a lot of tabs in the browser).

Also, add the applinks:<APPSITE HOST> entry to the Associated Domains Capability of your app.


### Imports
The plugin uses an export default statement, so you can import the variable with: 
```js
import KeyCloak from 'react-native-keycloak-plugin';
```
From that variable, you have access to all the util methods the plugin implements.

## API
### KeyCloak.login

```js
KeyCloak.login(conf, callback, scope)
  .then((response) => /* Your resolve */ );
  .catch((error) => /* Your reject*/ )
```
Method arguments:
  - _conf_: The JSON configuration object (see the example below).
  - _callback_: By default the plugin try to open the keycloak login url on the default browser. Using this callback you can override this behavior e.g. handling the login flow into a WebView without leaving the app.
  - _scope_: By default its value is 'info'. You can override this argument if some custom KeyCloak behavior is needed (e.g if you need to handle the KeyCloak ID_TOKEN, you have to pass 'openid info offline_access' as value).

```json
config = {
  "realm": "<real_name>",
  "auth-server-url": "https://<domain>/sso/auth/",
  "ssl-required": "string",
  "resource": "<resource_name>",
  "credentials": {
    "secret": "<secret_uuid>"
  },
  "confidential-port": "string",
}
```

Resolver arguments:
 - _response_: a JSON object containing two fields:
    - *tokens*: a JSON containing all the tokens returned by KeyCloak. If you used'info' as *scope* the JSON will be as shown below.
    - *deepLinkUrl*: The redirectUrl with some KeyCloak query params added at the end.

```json
response.tokens = {
    "access_token": "string",
    "expires_in": "number",
    "refresh_expires_in": "number",
    "refresh_token": "string",
    "token_type": "string",
    "not-before-policy": "number",
    "session_state": "string",
    "scope": "string",
}
```

#### Manually handling the tokens

```js
import KeyCloak, { TokenStorage } from 'react-native-keycloak-plugin'
```

Logging in by the login function will save the tokens information into the AsyncStorage. Through the TokenStoage object, the plugin export three methods that can be used to get, save and clear the tokens. This method are needed if you want to directly access and manage the tokens from the AsyncStorge.

### KeyCloak.retrieveUserInfo
```js
KeyCloak.retrieveUserInfo(conf)
  .then((userInfo) => /* Your resolve */ );
  .catch((error) => /* Your reject*/ )
```
Passing a configuration JSON object, makes available into the resolve funcion the JSON that describe the user inside KeyCloak.

### KeyCloak.refreshToken
```js
KeyCloak.refreshToken(conf)
  .then((response) => /* Your resolve */ );
  .catch((error) => /* Your reject*/ )
```
Passing a configuration JSON object, makes available into the resolve funcion the JSON contains the refreshed tokens. This information are also saved into the AsyncStorage described above.


### KeyCloak.logout
```js
KeyCloak.logout(conf)
  .then(() => /* Your resolve */ );
  .catch((error) => /* Your reject*/ )
```
Passing a configuration JSON object, the method call take care of logout the user and clear the AsyncStorage from the tokens information.


[UsageAnchor]: <https://github.com/lucataglia/react-native-keycloak-plugin#usage>
[InstallAnchor]: <https://github.com/lucataglia/react-native-keycloak-plugin#install>
[KeyCloakHome]: <https://www.keycloak.org/getting-started>