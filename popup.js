import {
  containsKey,
  getLocalStorage,
  getPendingHighlights,
  removePendingHighlight
} from './modules/storages.js';
import {registerRepository as registerRepo} from "./modules/github.js";
import * as dom from "./modules/dom.js";

let currentTabId = null;

async function updateDisplay() {
  const isLoggedIn = await containsKey('githubToken');
  if (isLoggedIn) {
    dom.displayElement('logged-in-div');
  } else {
    dom.displayElement('logged-out-div');
  }

  const isRegisteredRepository = await containsKey('repository');
  if (isRegisteredRepository) {
    dom.displayElement('registered-repo-div');
    document.getElementById('registered-repo-name').innerText = await getLocalStorage('repository');
  } else {
    dom.displayElement('repo-register-div');
    dom.hideElement('save-ward-div');
  }

  // 현재 탭의 하이라이트 로드
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  if (tab) {
    currentTabId = tab.id;
    const entry = await getPendingHighlights(tab.id);
    if (entry && entry.url === tab.url && entry.highlights.length) {
      renderHighlights(entry.highlights);
    }
  }
}

function renderHighlights(highlights) {
  const listEl = document.getElementById('highlights-list');
  const countEl = document.getElementById('highlights-count');
  listEl.innerHTML = '';
  highlights.forEach((text, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'highlight-text';
    span.textContent = text;
    const btn = document.createElement('button');
    btn.className = 'highlight-remove-btn';
    btn.textContent = '×';
    btn.addEventListener('click', () => removeHighlight(i));
    li.appendChild(span);
    li.appendChild(btn);
    listEl.appendChild(li);
  });
  countEl.textContent = highlights.length;
  if (highlights.length > 0) {
    dom.displayElement('highlights-div');
  } else {
    dom.hideElement('highlights-div');
  }
}

async function removeHighlight(index) {
  if (currentTabId == null) return;
  await removePendingHighlight(currentTabId, index);
  const entry = await getPendingHighlights(currentTabId);
  renderHighlights(entry?.highlights || []);
}

async function registerRepository() {
  dom.disabledButton('repo-register-btn');
  const name = document.getElementById("repo-name-input").value.trim();
  if (!name) return;

  const result = await registerRepo(name);
  if (result.needsCustomName) {
    document.getElementById('repo-error-message').textContent =
        `'${name}' 레포지토리가 이미 존재하지만 Ward 템플릿 기반이 아닙니다. 다른 이름을 입력하세요.`;
    dom.displayElement('repo-error-message');
    document.getElementById('repo-register-btn').disabled = false;
  } else if (result.success) {
    location.reload();
  }
}

async function disconnectRepository() {
  await chrome.storage.local.remove('repository');
  location.reload();
}

function githubLogin() {
  chrome.runtime.sendMessage({action: 'login'});
}

async function saveUrlToRepository() {
  dom.disabledButton('save-btn');
  dom.displayElement('save-loading-div');
  dom.hideElement('save-result-div');

  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  const [{result: pageContent}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => document.body.innerText
  });

  const entry = await getPendingHighlights(tab.id);
  const highlights = (entry && entry.url === tab.url) ? entry.highlights : [];

  await chrome.runtime.sendMessage({
    action: 'update',
    title: tab.title,
    tabUrl: tab.url,
    content: pageContent,
    highlights: highlights,
    tabId: tab.id
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateDisplay();

  document.getElementById("repo-register-btn").addEventListener("click", registerRepository);
  document.getElementById("repo-disconnect-btn").addEventListener("click", disconnectRepository);
  document.getElementById("github-login-btn").addEventListener("click", githubLogin);
  document.getElementById("save-btn").addEventListener("click", saveUrlToRepository);

  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'reload') {
      location.reload();
    } else if (message.action === 'device_code') {
      dom.displayElement('device-code-div');
      document.getElementById('user-code').textContent = message.userCode;
      navigator.clipboard.writeText(message.userCode);
      const link = document.getElementById('verification-link');
      link.href = message.verificationUri;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({url: message.verificationUri});
      });
    } else if (message.action === 'login_failed') {
      dom.hideElement('device-code-div');
    } else if (message.action === 'save_result') {
      dom.hideElement('save-loading-div');
      dom.displayElement('save-result-div');
      const msgEl = document.getElementById('save-result-message');
      const linkEl = document.getElementById('save-result-link');
      if (message.success) {
        msgEl.textContent = '저장 완료!';
        linkEl.textContent = 'PR 확인하기';
        linkEl.href = message.prUrl;
        linkEl.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({url: message.prUrl});
        });
      } else if (message.error === 'repo_not_found') {
        msgEl.textContent = '레포지토리가 삭제되었습니다. 팝업을 다시 열어 등록해주세요.';
        linkEl.hidden = true;
      } else {
        msgEl.textContent = '저장에 실패했습니다.';
        linkEl.hidden = true;
      }
    }
  });
});
