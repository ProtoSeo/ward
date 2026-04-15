import {
  addPendingHighlight,
  clearPendingHighlights,
  containsKey,
  getLocalStorage,
  getPendingHighlights,
  setLocalStorage
} from "./modules/storages.js";
import {
  CLIENT_ID,
  DEVICE_CODE_URL,
  DEVICE_TOKEN_URL,
  SCOPES
} from "./modules/constants.js";
import {createPullRequest, validateToken} from "./modules/github.js"

// 컨텍스트 메뉴 생성
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ward-save',
      title: 'Ward this page',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'ward-add-highlight',
      title: 'Ward 하이라이트로 추가',
      contexts: ['selection']
    });
  });
});

// 컨텍스트 메뉴 클릭 핸들러
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ward-add-highlight') {
    if (info.selectionText && tab?.id) {
      await addPendingHighlight(tab.id, tab.url, info.selectionText);
      await updateBadge(tab.id);
      await applyHighlightMark(tab.id);
    }
    return;
  }

  if (info.menuItemId !== 'ward-save') return;

  // 로그인 확인
  const hasToken = await containsKey('githubToken');
  if (!hasToken) {
    showNotification('로그인이 필요합니다', '팝업에서 로그인해주세요.');
    return;
  }

  // 토큰 유효성 확인
  const isValid = await validateToken();
  if (!isValid) {
    showNotification('로그인이 만료되었습니다', '팝업에서 다시 로그인해주세요.');
    return;
  }

  // 레포 등록 확인
  const hasRepo = await containsKey('repository');
  if (!hasRepo) {
    showNotification('레포지토리가 등록되지 않았습니다', '팝업에서 레포지토리를 등록해주세요.');
    return;
  }

  // 페이지 콘텐츠 추출 후 저장
  const [{result: pageContent}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => document.body.innerText
  });

  // 수집한 하이라이트 포함
  const entry = await getPendingHighlights(tab.id);
  const highlights = entry?.highlights || [];

  const result = await createPullRequest(tab.title, tab.url, pageContent, highlights);
  if (result.success) {
    await clearPendingHighlights(tab.id);
    await updateBadge(tab.id);
    showNotification('저장 완료!', `PR이 생성되었습니다.`);
  } else if (result.error === 'repo_not_found') {
    showNotification('레포지토리가 삭제되었습니다', '팝업에서 다시 등록해주세요.');
  } else {
    showNotification('저장 실패', '다시 시도해주세요.');
  }
});

// 탭 이벤트: 하이라이트 생명주기 관리
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await clearPendingHighlights(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  // 페이지 로딩 시작 → 하이라이트 정리 (새로고침 또는 URL 이동)
  if (changeInfo.status === 'loading') {
    const entry = await getPendingHighlights(tabId);
    if (entry) {
      await clearPendingHighlights(tabId);
      await updateBadge(tabId);
    }
  }
});

chrome.tabs.onActivated.addListener(async ({tabId}) => {
  await updateBadge(tabId);
});

async function updateBadge(tabId) {
  const entry = await getPendingHighlights(tabId);
  const count = entry?.highlights?.length || 0;
  try {
    await chrome.action.setBadgeText({tabId, text: count > 0 ? String(count) : ''});
    if (count > 0) {
      await chrome.action.setBadgeBackgroundColor({tabId, color: '#333333'});
    }
  } catch (e) {
    // tab may have been closed
  }
}

// 페이지의 현재 선택 영역에 형광펜 적용 (세션 단위, 새로고침 시 사라짐)
async function applyHighlightMark(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: {tabId},
      func: () => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        const mark = document.createElement('mark');
        mark.style.backgroundColor = '#ffeb3b';
        mark.style.color = 'inherit';
        mark.dataset.wardHighlight = 'true';
        try {
          range.surroundContents(mark);
        } catch (e) {
          // 여러 요소에 걸친 선택은 surroundContents 실패 → 추출 후 감싸기
          const contents = range.extractContents();
          mark.appendChild(contents);
          range.insertNode(mark);
        }
        selection.removeAllRanges();
      }
    });
  } catch (e) {
    // executeScript 실패 (chrome:// 페이지 등)
  }
}

// 키보드 단축키 핸들러
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'add-highlight') return;
  if (!tab?.id) return;

  // 현재 탭의 선택 영역 조회
  const [{result: selection}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => window.getSelection()?.toString() || ''
  });

  if (selection) {
    await addPendingHighlight(tab.id, tab.url, selection);
    await updateBadge(tab.id);
    await applyHighlightMark(tab.id);
  }
});

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon.png',
    title: title,
    message: message
  });
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'login') {
    await startDeviceFlow();
  } else if (message.action === 'update') {
    const highlights = message['highlights'] || [];
    const result = await createPullRequest(message['title'], message['tabUrl'], message['content'], highlights);
    if (result.success && message['tabId'] != null) {
      await clearPendingHighlights(message['tabId']);
      await updateBadge(message['tabId']);
    }
    chrome.runtime.sendMessage({
      action: 'save_result',
      success: result.success,
      prUrl: result.prUrl,
      error: result.error
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

const DEVICE_FLOW_ALARM = 'ward-device-flow-poll';

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

  // 2. device flow 상태를 storage에 저장 (service worker 재시작 대응)
  await setLocalStorage({
    'deviceFlow': {
      deviceCode: device_code,
      interval: interval || 5,
      expiresAt: Date.now() + (expires_in * 1000)
    }
  });

  // 3. popup에 user_code 전달
  chrome.runtime.sendMessage({
    action: 'device_code',
    userCode: user_code,
    verificationUri: verification_uri
  });

  // 4. alarm으로 폴링 시작 (service worker 재시작에도 유지)
  const periodInMinutes = Math.max((interval || 5) / 60, 1 / 60); // 최소 1초
  chrome.alarms.create(DEVICE_FLOW_ALARM, {
    delayInMinutes: periodInMinutes,
    periodInMinutes: periodInMinutes
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== DEVICE_FLOW_ALARM) return;

  const deviceFlow = await getLocalStorage('deviceFlow');
  if (!deviceFlow) {
    chrome.alarms.clear(DEVICE_FLOW_ALARM);
    return;
  }

  // 만료 확인
  if (Date.now() >= deviceFlow.expiresAt) {
    await stopDeviceFlow();
    chrome.runtime.sendMessage({action: 'login_failed', error: 'expired_token'});
    return;
  }

  // 토큰 폴링
  const response = await fetch(DEVICE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      device_code: deviceFlow.deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    })
  }).then(res => res.json());

  if (response.access_token) {
    await setLocalStorage({'githubToken': response.access_token});
    await stopDeviceFlow();
    sendReload();
    return;
  }

  if (response.error === 'expired_token' || response.error === 'access_denied') {
    await stopDeviceFlow();
    chrome.runtime.sendMessage({action: 'login_failed', error: response.error});
  }
  // slow_down, authorization_pending → 다음 alarm까지 대기
});

async function stopDeviceFlow() {
  await chrome.alarms.clear(DEVICE_FLOW_ALARM);
  await chrome.storage.local.remove('deviceFlow');
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
    console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
