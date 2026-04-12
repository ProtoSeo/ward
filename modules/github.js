import {createUniqueTitle, sanitizeTitle} from "./documents.js";
import {getRepository, getTitles, getToken, setLocalStorage} from "./storages.js";
import {get, post, put} from "./requests.js";
import {stringToBase64} from "./utils.js";

export async function validateToken() {
  const token = await getToken();
  if (!token) return false;
  const response = await get('/user', token);
  return response.ok;
}

export async function registerRepository(customName) {
  const token = await getToken();

  // username 조회
  const userResponse = await get('/user', token);
  const userJson = await userResponse.json();
  const username = userJson['login'];

  const repoName = customName || 'ward';

  // 레포 존재 여부 확인
  const repoResponse = await get(`/repos/${username}/${repoName}`, token);

  if (repoResponse.ok) {
    // 레포가 존재 → ward-template 기반인지 확인
    const workflowResponse = await get(`/repos/${username}/${repoName}/contents/.github/workflows/warding.yml`, token);

    if (workflowResponse.ok) {
      // ward-template 기반 → 그대로 연결
      await setLocalStorage({'repository': `${username}/${repoName}`});
      return {success: true};
    } else {
      // ward-template 기반 아님 → 커스텀 이름 필요
      return {success: false, needsCustomName: true};
    }
  }

  // 레포가 없음 → 새로 생성
  return await createRepositoryByTemplate(repoName);
}

async function createRepositoryByTemplate(name) {
  const token = await getToken();
  const response = await post('/repos/protoseo/ward-template/generate', token, {
    name: name,
    description: 'ward'
  });
  const json = await response.json();
  if (response.ok) {
    const repository = json['full_name'];
    await setLocalStorage({'repository': repository});
    return {success: true};
  }
  return {success: false};
}

export async function createPullRequest(title, tabUrl, content) {
  const {repository, token} = await getGithubData();
  const titles = await getTitles();
  const sanitizedTitle = sanitizeTitle(title);
  const createdTitle = createUniqueTitle(titles, sanitizedTitle);

  // 초기 README는 URL만 포함 (제목/태그/요약은 워크플로우에서 AI가 생성)
  const readme = `---\nsource_url: ${tabUrl}\n---\n\n# [${title}](${tabUrl})\n`;

  // 1. default branch 확인 (레포 존재 여부도 함께 검증)
  const repoResponse = await get(`/repos/${repository}`, token);
  if (repoResponse.status === 404) {
    // 레포가 삭제됨 → storage 정리
    await chrome.storage.local.remove('repository');
    return {success: false, error: 'repo_not_found'};
  }
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
  const prResponse = await post(`/repos/${repository}/pulls`, token, {
    title: `Ward: ${createdTitle}`,
    body: prBody,
    head: branchName,
    base: defaultBranch
  });

  if (prResponse.ok) {
    const prJson = await prResponse.json();
    // titles에 저장
    titles.push(createdTitle);
    await setLocalStorage({'titles': titles});
    return {success: true, prUrl: prJson['html_url']};
  }
  return {success: false};
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
