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

export function getRepositoryFullName() {
  return getLocalStorage('repoFullName');
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
