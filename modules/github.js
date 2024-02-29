import {GITHUB_API_URL} from "./constants.js";
import {getRepositoryFullName, getTitles, setLocalStorage} from "./storages.js";
import {get, post, put} from "./requests.js";
import {stringToBase64} from "./utils.js";

/**
 * https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#get-a-tree
 * @returns {Promise<void>}
 */
export async function getTree() {
  const repoFullName = await getRepositoryFullName();
  const url = GITHUB_API_URL + `/repos/${repoFullName}/git/trees/main`;
  const response = await get(url);
  const json = await response.json();
  console.log(json)
}

function updateReadme() {

}

/**
 * https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-for-the-authenticated-user
 * @param name
 * @returns {Promise<void>}
 */
export async function createRepository(name) {
  const url = GITHUB_API_URL + '/user/repos';
  const response = await post(url, {
    name: name,
    description: 'ward',
    private: false,
    auto_init: true
  });
  const json = await response.json();
  console.log(json)
  if (response.ok) {
    setLocalStorage({'repoFullName': json['full_name']});
  } else {
    // 중복된 Repository ...?
  }
}

/**
 * https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
 * @param title
 * @param tags
 * @param tabUrl
 * @returns {Promise<void>}
 */
export async function createOrUpdateFile(title, tags, tabUrl) {
  const repoFullName = await getRepositoryFullName();
  const titles = await getTitles();
  const createdTitle = createNotDuplicateTitle(title, titles);
  const url = GITHUB_API_URL + `/repos/${repoFullName}/contents/${createdTitle}/README.md`;
  const response = await put(url, {
    message: `${title}`,
    content: stringToBase64(createReadme(title, tags, tabUrl))
  });
  const json = await response.json();
  console.log(titles)
  console.log(json)
  if (response.ok) {
    titles.push(createdTitle);
    setLocalStorage({'titles': titles});
  } else {
    // 중복된 파일 ...?
  }
}

function createReadme(title, tags, tabUrl) {
  let readme = `# [${title}](${tabUrl})\n\n### URL\n\n- ${tabUrl}\n\n`;
  if (tags.length > 0) {
    readme += '### Tag\n\n';
    tags.forEach((tag) => readme += `- ${tag}\n`);
  }
  return readme
}

function createNotDuplicateTitle(title, titles) {
  if (titles.includes(title)) {
    let number = 1;
    while (titles.includes(`${title}-${number}`)) {
      number++;
    }
    return `${title}-${number}`;
  }
  return title;
}
