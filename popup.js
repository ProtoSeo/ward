import {clearLocalStorage, containsKey, getLocalStorage} from './modules/storages.js';
import {createRepositoryByTemplate} from "./modules/github.js";
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
    dom.hideElement('repo-name-input');
    dom.displayElement('registered-repo-name');
    document.getElementById('registered-repo-name').innerText = await getLocalStorage('repository');
  } else {
    dom.displayElement('repo-register-btn');
    dom.hideElement('save-ward-div');
  }
}

function handleTagInputKeyDown(event) {
  if (event.isComposing) {
    return;
  }
  const tagContainer = document.getElementById('tag-container');
  const tagInput = document.getElementById('tag-input');
  const tags = Array.from(tagContainer.getElementsByClassName('tag')).map(tag => tag.textContent.trim());

  if (event.key === 'Backspace' && tags.length > 0 && tagInput.value === '') {
    event.preventDefault();
    const lastTag = tagContainer.lastChild;
    lastTag.remove();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const tagText = tagInput.value.trim();
    if (tagText !== '' && !tags.includes(tagText)) {
      const tag = document.createElement('li');
      tag.className = 'tag';
      tag.textContent = tagText;
      tagContainer.insertBefore(tag, null);
      tagInput.value = '';
    }
  }
}

async function registerRepository() {
  dom.disabledButton('repo-register-btn');
  const name = document.getElementById("repo-name-input").value;
  await createRepositoryByTemplate(name);
  location.reload();
}

function githubLogin() {
  chrome.runtime.sendMessage({action: 'login'});
}

async function saveUrlToRepository() {
  dom.disabledButton('save-btn');
  const title = document.getElementById("title-input").value;
  const tags = Array.from(document.getElementById('tag-container')
      .getElementsByClassName('tag')
  ).map(tag => tag.textContent.trim());

  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const tabUrl = tab.url;
  const tabTitle = tab.title;
  await chrome.runtime.sendMessage({
    action: 'update',
    title: (title === undefined || title.length === 0) ? tabTitle : title,
    tags: tags,
    tabUrl: tabUrl
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateDisplay();

  document.getElementById('tag-input').addEventListener('keydown', handleTagInputKeyDown);
  document.getElementById("repo-register-btn").addEventListener("click", registerRepository);
  document.getElementById("github-login-btn").addEventListener("click", githubLogin);
  document.getElementById("save-btn").addEventListener("click", saveUrlToRepository);

  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'reload') {
      location.reload();
    }
  });
});

// clear localstorage function for test
document.getElementById("clear-temp-btn").addEventListener("click", () => {
  clearLocalStorage().then(() => location.reload());
});
