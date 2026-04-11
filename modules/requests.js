import {GITHUB_API_URL, GITHUB_API_VERSION, GITHUB_JSON} from "./constants.js";

async function githubFetch(urn, method, token, body, cache) {
  const options = {
    method: method,
    cache: cache,
    headers: {
      'Accept': GITHUB_JSON,
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION
    }
  };
  if (body !== null && body !== undefined) {
    options.body = JSON.stringify(body);
  }
  return fetch(GITHUB_API_URL + urn, options);
}

export function post(urn, token, body, cache = 'default') {
  return githubFetch(urn, 'POST', token, body, cache);
}

export function put(urn, token, body, cache = 'default') {
  return githubFetch(urn, 'PUT', token, body, cache);
}

export function get(urn, token, cache = 'no-cache') {
  return githubFetch(urn, 'GET', token, null, cache);
}
