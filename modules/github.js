import {createUniqueTitle} from "./documents.js";
import {getRepository, getTitles, getToken, setLocalStorage} from "./storages.js";
import {get, post, put} from "./requests.js";
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

export async function createPullRequest(title, tabUrl, content) {
  const {repository, token} = await getGithubData();
  const titles = await getTitles();
  const createdTitle = createUniqueTitle(titles, title);

  // 초기 README는 URL만 포함 (제목/태그/요약은 워크플로우에서 AI가 생성)
  const readme = `---\nurl: ${tabUrl}\n---\n\n# [${title}](${tabUrl})\n`;

  // 1. default branch 확인
  const repoResponse = await get(`/repos/${repository}`, token);
  const repoJson = await repoResponse.json();
  const defaultBranch = repoJson['default_branch'];

  // 2. 최신 커밋 SHA 조회
  const refResponse = await get(`/repos/${repository}/git/ref/heads/${defaultBranch}`, token);
  const refJson = await refResponse.json();
  const baseSha = refJson['object']['sha'];

  // 3. 새 브랜치 생성
  const branchName = `ward/${sanitizeBranchName(createdTitle)}-${Date.now()}`;
  await post(`/repos/${repository}/git/refs`, token, {
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });

  // 4. 브랜치에 파일 생성
  await put(`/repos/${repository}/contents/${createdTitle}/README.md`, token, {
    message: createdTitle,
    content: stringToBase64(readme),
    branch: branchName
  });

  // 5. PR 생성 (페이지 콘텐츠를 body에 포함)
  const truncatedContent = content ? content.substring(0, 60000) : '';
  const prBody = `## Warded Page\n\n- **URL**: ${tabUrl}\n\n## Page Content\n\n${truncatedContent}`;
  await post(`/repos/${repository}/pulls`, token, {
    title: `Ward: ${createdTitle}`,
    body: prBody,
    head: branchName,
    base: defaultBranch
  });
}

function sanitizeBranchName(name) {
  return name
      .replace(/[^a-zA-Z0-9\-_\/]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
}

async function getGithubData() {
  const repository = await getRepository();
  const token = await getToken();
  return {
    repository: repository,
    token: token
  };
}
