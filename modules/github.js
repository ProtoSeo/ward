import {createDefaultReadme, createFileReadme, createUniqueTitle, updateDefaultReadme} from "./documents.js";
import {getRepository, getTitles, getToken, setLocalStorage} from "./storages.js";
import {get, patch, post} from "./requests.js";
import {base64ToString} from "./utils.js";

export async function createRepository(name) {
  const token = await getToken();
  const response = await post('/user/repos', token, {
    name: name,
    description: 'ward',
    private: false,
    auto_init: true
  });
  const json = await response.json();
  if (response.ok) {
    const repository = json['full_name'];
    const githubData = {repository, token};
    setLocalStorage({'repository': repository});
    await createInitialCommit(name, githubData);
  }
}

async function createInitialCommit(name, githubData) {
  const refObjectSHA = await getReference(githubData);
  const readme = await createBlob(githubData, 'README.md', createDefaultReadme(name));
  const tree = await createTree(githubData, refObjectSHA, [readme]);
  const commit = await createCommit(githubData, 'Initial commit', tree['sha'], undefined);
  await updateReference(githubData, commit['sha']);
}

export async function updateRepository(title, tags, tabUrl) {
  const githubData = await getGithubData();
  const titles = await getTitles();

  const prevReadme = await getRepositoryReadme(githubData);
  const createdTitle = createUniqueTitle(titles, title);

  const refObjectSHA = await getReference(githubData);
  const blobs = await Promise.all([
    createBlob(githubData, 'README.md', updateDefaultReadme(prevReadme, createdTitle, tags, tabUrl)),
    createBlob(githubData, `${createdTitle}/README.md`, createFileReadme(title, tags, tabUrl))
  ]);
  const tree = await createTree(githubData, refObjectSHA, blobs);
  const commit = await createCommit(githubData, `${title}`, tree['sha'], [refObjectSHA]);
  await updateReference(githubData, commit['sha']).then(() => {
    titles.push(createdTitle);
    setLocalStorage({'titles': titles})
  });
}

async function getGithubData() {
  const repository = await getRepository();
  const token = await getToken();
  return {
    repository: repository,
    token: token
  };
}

async function getReference(githubData) {
  const {repository, token} = githubData;
  const response = await get(`/repos/${repository}/git/ref/heads/main`, token, 'no-cache');
  const json = await response.json();
  return json['object']['sha'];
}

async function createBlob(githubData, path, content) {
  const {repository, token} = githubData;
  const response = await post(`/repos/${repository}/git/blobs`, token, {
    content: content
  });
  const json = await response.json()
  return {
    path: path,
    mode: '100644',
    type: 'blob',
    sha: json['sha']
  };
}

async function createTree(githubData, baseTree, tree) {
  const {repository, token} = githubData;
  const response = await post(`/repos/${repository}/git/trees`, token, {
    base_tree: baseTree,
    tree: tree
  });
  const json = await response.json();
  return {
    sha: json['sha']
  };
}

async function createCommit(githubData, message, tree, parents) {
  const {repository, token} = githubData;
  const response = await post(`/repos/${repository}/git/commits`, token, {
    message: message,
    tree: tree,
    parents: parents
  });
  const json = await response.json();
  return {
    sha: json['sha']
  }
}

async function updateReference(githubData, sha, force = true) {
  const {repository, token} = githubData;
  const response = await patch(`/repos/${repository}/git/refs/heads/main`, token, {
    sha: sha,
    force: force
  });
  const json = await response.json();
  console.log(json);
}

async function getRepositoryReadme(githubData) {
  const {repository, token} = githubData;
  const response = await get(`/repos/${repository}/readme`, token, 'no-cache');
  const json = await response.json();
  return base64ToString(json['content']);
}
