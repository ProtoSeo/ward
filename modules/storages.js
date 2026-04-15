export function getLocalStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (value) => {
        resolve(value[key])
      });
    } catch (e) {
      reject(e);
    }
  })
}

export async function containsKey(key) {
  const value = await getLocalStorage(key)
  return value !== null && value !== undefined;
}

export function getToken() {
  return getLocalStorage('githubToken');
}

export function getRepository() {
  return getLocalStorage('repository');
}

export async function getTitles() {
  const titles = await getLocalStorage('titles');
  if (typeof titles == 'undefined') {
    return [];
  }
  return titles;
}

export function setLocalStorage(object) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(object, () => {
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  })
}

export function clearLocalStorage() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.clear(() => resolve());
    } catch (e) {
      reject(e);
    }
  })
}

// 하이라이트 저장소 (chrome.storage.session, 브라우저 종료 시 자동 삭제)
function getAllPendingHighlights() {
  return new Promise((resolve) => {
    chrome.storage.session.get('pendingHighlights', (v) => {
      resolve(v.pendingHighlights || {});
    });
  });
}

export async function getPendingHighlights(tabId) {
  const all = await getAllPendingHighlights();
  return all[tabId] || null;
}

export async function addPendingHighlight(tabId, url, text) {
  const all = await getAllPendingHighlights();
  const entry = all[tabId];
  if (!entry || entry.url !== url) {
    all[tabId] = {url, highlights: [text]};
  } else {
    entry.highlights.push(text);
    all[tabId] = entry;
  }
  await chrome.storage.session.set({pendingHighlights: all});
}

export async function removePendingHighlight(tabId, index) {
  const all = await getAllPendingHighlights();
  const entry = all[tabId];
  if (!entry) return;
  entry.highlights.splice(index, 1);
  if (entry.highlights.length === 0) {
    delete all[tabId];
  } else {
    all[tabId] = entry;
  }
  await chrome.storage.session.set({pendingHighlights: all});
}

export async function clearPendingHighlights(tabId) {
  const all = await getAllPendingHighlights();
  delete all[tabId];
  await chrome.storage.session.set({pendingHighlights: all});
}
