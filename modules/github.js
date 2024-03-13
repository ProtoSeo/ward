import {createFileReadme, createUniqueTitle} from "./documents.js";
import {getRepository, getTitles, getToken, setLocalStorage} from "./storages.js";
import {post, put} from "./requests.js";
import {stringToBase64} from "./utils.js";

export async function createRepositoryByTemplate(name) {
  const token = await getToken();
  const response = await post('/repos/protoseo/ward-template/generate', token, {
    name: name,
    description: 'ward'
  });
  const json = await response.json();
  if (response.ok) {
    const repository = json['full_name'];
    setLocalStorage({'repository': repository});
  }
}

export async function createOrUpdateFile(title, tags, tabUrl) {
  const {repository, token} = await getGithubData();
  const titles = await getTitles();
  const createdTitle = createUniqueTitle(titles, title);
  const readme = createFileReadme(title, tags, tabUrl);

  const response = await put(`/repos/${repository}/contents/${createdTitle}/README.md`, token, {
    message: createdTitle,
    content: stringToBase64(readme)
  });
  if (response.ok) {
    await createRepositoryDispatch(title, tags, tabUrl);
  }
}

async function createRepositoryDispatch(title, tags, tabUrl) {
  const {repository, token} = await getGithubData();
  const response = await post(`/repos/${repository}/dispatches`, token, {
    event_type: "warding",
    client_payload: {
      title: title,
      url: tabUrl,
      tags: tags.join(", ")
    }
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
