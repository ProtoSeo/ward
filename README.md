# Ward

웹페이지를 GitHub 레포지토리에 북마크로 저장하는 Chrome 확장 프로그램.
저장 시 PR이 생성되고, GitHub Actions를 통해 AI가 페이지를 자동 요약합니다.

## 동작 방식

```
페이지 저장 클릭 → 브랜치 생성 → PR 생성 → GitHub Actions → AI 요약 → README에 반영
```

1. 확장 프로그램에서 제목/태그를 입력하고 저장
2. GitHub 레포지토리에 새 브랜치가 생성되고 PR이 열림
3. GitHub Actions 워크플로우가 자동 실행
4. 웹페이지 콘텐츠를 크롤링하고 Gemini AI로 요약
5. 요약 결과가 README.md에 추가됨
6. 사용자가 PR을 확인하고 머지

## 설치

### 1. Chrome 확장 프로그램 설치

1. 이 레포지토리를 클론
   ```bash
   git clone https://github.com/ProtoSeo/ward.git
   ```
2. Chrome에서 `chrome://extensions` 접속
3. **개발자 모드** 활성화
4. **압축해제된 확장 프로그램을 로드합니다** 클릭 후 클론한 폴더 선택

### 2. GitHub OAuth 설정

1. 확장 프로그램 아이콘 클릭
2. **Login** 버튼으로 GitHub 로그인
3. 레포지토리 이름을 입력하고 **레포지토리 등록**
   - `protoseo/ward-template` 템플릿 기반으로 레포지토리가 자동 생성됩니다

### 3. AI 요약 기능 설정 (Gemini API)

1. [Google AI Studio](https://aistudio.google.com)에서 API Key 발급 (무료)
2. 생성된 GitHub 레포지토리 > **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret** 클릭
   - Name: `GEMINI_API_KEY`
   - Secret: 발급받은 API Key

## 사용법

1. 저장하고 싶은 웹페이지에서 확장 프로그램 아이콘 클릭
2. 제목 입력 (비워두면 페이지 제목이 자동 입력됨)
3. 태그 입력 후 Enter (여러 개 추가 가능, Backspace로 삭제)
4. **해당 페이지 저장하기** 클릭
5. GitHub 레포지토리에 PR이 생성됨
6. AI 요약이 완료되면 PR에서 확인 후 머지

## 저장 파일 형식

각 북마크는 `{제목}/README.md` 경로에 다음 형식으로 저장됩니다:

```markdown
---
title: "페이지 제목"
url: https://example.com
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
├── background.js          # 서비스 워커 (OAuth, API 호출)
├── css/
│   └── popup.css          # 스타일
├── images/
│   └── icon.png           # 아이콘
└── modules/
    ├── constants.js       # GitHub OAuth/API 상수
    ├── storages.js        # Chrome Storage 관리
    ├── github.js          # GitHub API (브랜치/PR 생성)
    ├── requests.js        # HTTP 요청 래퍼
    ├── documents.js       # README 마크다운 생성
    ├── dom.js             # DOM 유틸리티
    └── utils.js           # Base64 인코딩
```

## 기술 스택

- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6 Modules)
- GitHub REST API
- Google Gemini API (GitHub Actions에서 실행)
