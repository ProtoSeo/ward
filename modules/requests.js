import {GITHUB_API_URL, GITHUB_API_VERSION, GITHUB_JSON} from "./constants.js";

async function githubFetch(urn, method, token, body, cache) {
  return fetch(GITHUB_API_URL + urn, {
    method: method,
    cache: cache,
    headers: {
      'Accept': GITHUB_JSON,
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION
    },
    body: JSON.stringify(body)
  });
}

export function post(urn, token, body, cache = 'default') {
  return githubFetch(urn, 'POST', token, body, cache);
}

export function put(urn, token, body, cache = 'default') {
  return githubFetch(urn, 'PUT', token, body, cache);
}
