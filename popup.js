import {clearLocalStorage, containsKey, getLocalStorage} from './modules/storages.js';
import {createRepository, updateRepository} from "./modules/github.js";
import {displayElement, hideElement} from "./modules/utils.js";

async function checkStatus() {
  const isLoggedIn = await containsKey('githubToken');
  if (isLoggedIn) {
    displayElement('logged-in-div');
  } else {
    displayElement('logged-out-div');
  }

  const isRegisteredRepository = await containsKey('repository');
  if (isRegisteredRepository) {
    hideElement('repo-name-input');
    displayElement('registered-repo-name');
    document.getElementById('registered-repo-name').innerText = await getLocalStorage('repository');
  } else {
    displayElement('repo-register-btn');
    hideElement('save-ward-div');
  }
}

checkStatus();

document.getElementById("repo-register-btn").addEventListener("click", async () => {
  const name = document.getElementById("repo-name-input").value;
  const response = await createRepository(name);
  location.reload();
});

document.getElementById("github-login-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({action: 'login'});
});

// for test temp
document.getElementById("clear-temp-btn").addEventListener("click", () => {
  clearLocalStorage().then(() => location.reload());
});

document.getElementById("save-btn").addEventListener("click", async () => {
  const title = document.getElementById("title-input").value;
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
  const tabUrl = tab.url;
  console.log(tabUrl);
  updateRepository(title, ['쭈니', 'dog'], tabUrl);
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'reload') {
    location.reload();
  }
});
