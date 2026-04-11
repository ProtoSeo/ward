import {containsKey, getLocalStorage} from './modules/storages.js';
import {registerRepository as registerRepo} from "./modules/github.js";
import * as dom from "./modules/dom.js";

async function updateDisplay() {
  const isLoggedIn = await containsKey('githubToken');
  if (isLoggedIn) {
    dom.displayElement('logged-in-div');
  } else {
    dom.displayElement('logged-out-div');
  }

  const isRegisteredRepository = await containsKey('repository');
  if (isRegisteredRepository) {
    dom.displayElement('registered-repo-name');
    document.getElementById('registered-repo-name').innerText = await getLocalStorage('repository');
  } else {
    dom.displayElement('repo-register-btn');
    dom.hideElement('save-ward-div');
  }
}

async function registerRepository() {
  dom.disabledButton('repo-register-btn');
  const result = await registerRepo();
  if (result.needsCustomName) {
    dom.displayElement('repo-conflict-div');
    dom.hideElement('repo-register-btn');
  } else {
    location.reload();
  }
}

async function registerCustomRepository() {
  dom.disabledButton('repo-custom-register-btn');
  const name = document.getElementById("repo-name-input").value;
  if (name) {
    await registerRepo(name);
    location.reload();
  }
}

function githubLogin() {
  chrome.runtime.sendMessage({action: 'login'});
}

async function saveUrlToRepository() {
  dom.disabledButton('save-btn');

  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

  const [{result: pageContent}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => document.body.innerText
  });

  await chrome.runtime.sendMessage({
    action: 'update',
    title: tab.title,
    tabUrl: tab.url,
    content: pageContent
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateDisplay();

  document.getElementById("repo-register-btn").addEventListener("click", registerRepository);
  document.getElementById("repo-custom-register-btn").addEventListener("click", registerCustomRepository);
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
