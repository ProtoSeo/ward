import {setLocalStorage} from "./modules/storages.js";
import {
  CLIENT_ID,
  DEVICE_CODE_URL,
  DEVICE_TOKEN_URL,
  SCOPES
} from "./modules/constants.js";
import {createPullRequest} from "./modules/github.js"

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'login') {
    await startDeviceFlow();
  } else if (message.action === 'update') {
    const result = await createPullRequest(message['title'], message['tabUrl'], message['content']);
    chrome.runtime.sendMessage({
      action: 'save_result',
      success: result.success,
      prUrl: result.prUrl
    });
  }
});

function sendReload() {
  chrome.runtime.getContexts({contextTypes: ['POPUP']}, (contexts) => {
    if (contexts.length > 0) {
      chrome.runtime.sendMessage({action: 'reload'});
    }
  });
}

async function startDeviceFlow() {
  // 1. device code 요청
  const response = await fetch(DEVICE_CODE_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: SCOPES.join(' ')
    })
  }).then(res => res.json());

  const {device_code, user_code, verification_uri, interval, expires_in} = response;

  // 2. popup에 user_code 전달
  chrome.runtime.sendMessage({
    action: 'device_code',
    userCode: user_code,
    verificationUri: verification_uri
  });

  // 3. 폴링으로 토큰 수령
  await pollForToken(device_code, interval, expires_in);
}

async function pollForToken(deviceCode, interval, expiresIn) {
  const pollInterval = (interval || 5) * 1000;
  const expiresAt = Date.now() + (expiresIn * 1000);

  while (Date.now() < expiresAt) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const response = await fetch(DEVICE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    }).then(res => res.json());

    if (response.access_token) {
      await setLocalStorage({'githubToken': response.access_token});
      sendReload();
      return;
    }

    if (response.error === 'slow_down') {
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else if (response.error === 'expired_token' || response.error === 'access_denied') {
      chrome.runtime.sendMessage({action: 'login_failed', error: response.error});
      return;
    }
    // authorization_pending → 계속 폴링
  }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
    console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
