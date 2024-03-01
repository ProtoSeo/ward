import {GITHUB_API_URL, GITHUB_API_VERSION, GITHUB_JSON} from "./constants.js";
import {getToken} from "./storages.js";

async function githubFetch(urn, method, body) {
  const token = await getToken();
  return fetch(GITHUB_API_URL + urn, {
    method: method,
    headers: {
      'Accept': GITHUB_JSON,
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': GITHUB_API_VERSION
    },
    body: JSON.stringify(body)
  });
}

export function post(urn, body) {
  return githubFetch(urn, 'POST', body);
}

export function patch(urn, body) {
  return githubFetch(urn, 'PATCH', body);
}

export function put(urn, body) {
  return githubFetch(urn, 'PUT', body);
}

export function get(urn) {
  return githubFetch(urn, 'GET');
}
