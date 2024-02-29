import {GITHUB_API_VERSION, GITHUB_JSON} from "./constants.js";
import {getToken} from "./storages.js";

async function githubFetch(url, method, body) {
  const token = await getToken();
  return fetch(url, {
    method: method,
    headers: {
      'Accept': GITHUB_JSON,
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION
    },
    body: JSON.stringify(body)
  });
}

export function post(url, body) {
  return githubFetch(url, 'POST', body);
}

export function put(url, body) {
  return githubFetch(url, 'PUT', body);
}

export function get(url) {
  return githubFetch(url, 'GET');
}
