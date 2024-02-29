import {setLocalStorage} from "./modules/storages.js";
import {
  ACCESS_TOKEN_URL,
  AUTHORIZATION_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL,
  SCOPES
} from "./modules/constants.js";

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'login') {
    const code = await redirectToGithubLogin();
    if (!code) {
      return false;
    }
    const accessToken = await fetchAccessToken(code);
    sendResponse({accessToken: accessToken});
    chrome.runtime.sendMessage({action: 'reload'});
  }
  return true;
});

async function redirectToGithubLogin() {
  const scope = SCOPES.join(",");
  const authUrl = `${AUTHORIZATION_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL}&scope=${scope}`;

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  });
  if (redirectUrl === undefined) {
    console.log("redirect url is undefined.")
    return null;
  }
  const url = new URL(redirectUrl);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  console.log(error);
  console.log(code);
  if (code) {
    return code;
  }
  return null;
}

async function fetchAccessToken(code) {
  const response = await fetch(ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code
    })
  }).then(response => response.json())

  const accessToken = response['access_token'];
  setLocalStorage({'githubToken': accessToken}).then(() => console.log("save access token successful"))
  return accessToken;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
    console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
