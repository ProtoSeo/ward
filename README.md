# Ward

웹페이지를 GitHub 레포지토리에 북마크로 저장하는 Chrome 확장 프로그램.
저장 시 PR이 생성되고, GitHub Actions에서 AI가 페이지를 자동 요약합니다.
GitHub Pages를 활성화하면 깔끔한 웹사이트로 북마크를 열람할 수 있습니다.

## 동작 방식

```
페이지 → 우클릭 또는 팝업 버튼 클릭
  → 페이지 콘텐츠 추출 → 브랜치 + PR 생성
  → GitHub Actions → Gemini AI가 제목/태그/요약 생성
  → 사용자가 PR 머지 → GitHub Pages 자동 갱신
```

## 설치

### 1. Chrome 확장 프로그램 설치

1. 이 레포지토리를 클론
   ```bash
   git clone https://github.com/ProtoSeo/ward.git
   ```
2. Chrome에서 `chrome://extensions` 접속
3. **개발자 모드** 활성화
4. **압축해제된 확장 프로그램을 로드합니다** 클릭 후 클론한 폴더 선택

### 2. GitHub 로그인 (Device Flow)

1. 확장 프로그램 아이콘 클릭
2. **Login** 버튼 클릭 → 코드가 클립보드에 자동 복사됨
3. **GitHub에서 인증하기** 클릭 → 새 탭에서 코드 붙여넣기
4. 인증 완료 후 자동으로 로그인됨

### 3. 레포지토리 등록

1. **레포지토리 등록** 버튼 클릭
2. 자동으로 `ward` 레포가 `protoseo/ward-template` 기반으로 생성됨
3. 이미 `ward`라는 이름의 레포가 있으면 다른 이름을 입력받음

### 4. Gemini API Key 설정

1. [Google AI Studio](https://aistudio.google.com)에서 API Key 발급 (무료)
2. 생성된 ward 레포 > **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret**
   - Name: `GEMINI_API_KEY`
   - Secret: 발급받은 API Key

### 5. GitHub Pages 활성화 (선택, 뷰어 사용 시)

1. ward 레포 > **Settings** > **Pages**
2. **Build and deployment** > **Source**: `Deploy from a branch`
3. **Branch**: `main` / `(root)` 선택 후 **Save**
4. 1~2분 후 첫 빌드 완료
5. 뷰어 URL: `https://{username}.github.io/ward/`

> Public 레포에서만 무료로 동작합니다. Private 레포는 GitHub Pro 이상 유료 플랜이 필요합니다.

## 사용법

### 방법 1: 우클릭 메뉴 (가장 빠름)

1. 저장하고 싶은 웹페이지에서 **우클릭**
2. **Ward this page** 선택
3. 알림으로 결과 확인

### 방법 2: 확장 프로그램 팝업

1. 확장 프로그램 아이콘 클릭
2. **해당 페이지 저장하기** 버튼 클릭
3. 생성된 PR 링크가 팝업에 표시됨

저장 후 GitHub Actions가 자동으로 AI 요약을 생성하고 PR에 반영합니다. PR을 검토 후 머지하면 GitHub Pages 뷰어에 자동으로 추가됩니다.

## 저장 파일 형식

각 북마크는 `{제목-슬러그}/README.md` 경로에 다음 형식으로 저장됩니다:

```markdown
---
title: "페이지 제목"
source_url: https://example.com
tag: tag1, tag2
---

# [페이지 제목](https://example.com)

### URL

- https://example.com

### Tag

- tag1
- tag2

### AI Summary

- AI가 생성한 요약 내용
```

## 프로젝트 구조

```
ward/
├── manifest.json          # Chrome Extension 설정 (Manifest V3)
├── popup.html             # 팝업 UI
├── popup.js               # 팝업 로직
├── background.js          # 서비스 워커 (Device Flow, API 호출, 컨텍스트 메뉴)
├── css/
│   └── popup.css          # 스타일
├── images/
│   └── icon.png           # 아이콘
└── modules/
    ├── constants.js       # GitHub API 상수 (Device Flow URL 등)
    ├── storages.js        # Chrome Storage 관리
    ├── github.js          # GitHub API (브랜치/PR 생성, 레포 등록)
    ├── requests.js        # HTTP 요청 래퍼
    ├── documents.js       # 마크다운 생성, 제목 sanitize
    ├── dom.js             # DOM 유틸리티
    └── utils.js           # Base64 인코딩
```

## 기술 스택

- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6 Modules)
- GitHub REST API + Device Flow OAuth
- Google Gemini API (GitHub Actions에서 실행)
- Jekyll + GitHub Pages (북마크 뷰어)
