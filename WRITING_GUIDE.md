# 글쓰기 가이드

## 워크플로우

1. 옵시디언 vault에서 평소처럼 자유롭게 쓴다.
2. 블로그에 올리고 싶은 노트에 frontmatter로 `publish: true`를 추가한다:

```md
---
publish: true
title: '글 제목'
description: '한 줄 요약'
category: '카테고리명'
pubDate: '2026-08-12'
---

본문 내용...
```

- `publish: true`가 없는 노트는 전부 무시됨 — vault의 다른 노트는 신경 안 써도 됨.
- `title` / `description` / `category` / `pubDate`는 없어도 동작함 (아래 "frontmatter 필드" 참고). 최소한 `publish: true`만 있어도 됨.

3. 저장소 루트에서 실행:

```sh
npm run publish
```

  처음 한 번만 vault 경로를 알려줘야 함: `npm run publish -- "/path/to/vault"` (이후엔 `.obsidian-vault-path`에 저장되어 그냥 `npm run publish`만 실행하면 됨)

4. `npx astro dev status`로 개발 서버 확인(안 떠 있으면 `astro dev --background`), `localhost:4321`에서 실제로 확인
5. `/blog-review` 실행 → 팩트 점검, 오타 점검, 날짜 점검
6. 커밋 & push

## frontmatter 필드

| 필드          | 없으면                                      |
| ------------- | -------------------------------------------- |
| `title`       | 노트 파일명 사용                             |
| `description` | 본문에서 자동 생성 (요약이 어색할 수 있어서 스크립트가 "확인 필요"로 표시함) |
| `category`    | `General`                                    |
| `pubDate`     | 노트 파일 생성일 사용 — **직접 쓴 날짜를 넣는 걸 권장** (Home 잔디 그래프에 반영되는 값이라 정확할수록 좋음) |

## 옵시디언 문법 변환

- `[[다른 노트]]`, `[[다른 노트\|별칭]]` — **그 노트도 `publish: true`면** 실제 링크로 연결됨 (`/graph`에서 선으로도 보임). 아니면 링크 없이 텍스트만 남음
- `![[사진.png]]` — vault 안에서 파일을 찾아 `src/assets/blog/<슬러그>/`로 복사하고, 일반 마크다운 이미지로 변환. 게시글 폭의 80%로 제한되어 표시됨
- 그 외(제목, 코드블록, 굵게/기울임, 목록, 표, 콜아웃 등)는 그대로 마크다운으로 처리됨

## 그래프 뷰

Home 페이지 오른쪽 위 작은 위젯에서 발행된 글들이 서로 어떻게 연결되어 있는지 볼 수 있음. 옵시디언 로컬 그래프 뷰와 비슷하지만, **발행된 글끼리의 링크만** 보여줌(비공개 노트는 애초에 안 보임). 점 클릭하면 해당 글로 이동.

## Templater 템플릿으로 새 글 시작하기

vault의 `templates/새 글.md`가 Templater 템플릿임. 새 노트 만들 때 이 템플릿을 쓰면 제목/설명/카테고리를 물어보고 frontmatter를 채워줌 (publish는 기본 `false` — 다 쓰고 검토한 다음에 `true`로 바꾸기).

**처음 설정 (한 번만):**

1. 옵시디언 설정 → Community plugins → Templater 활성화 (이미 설치돼 있음)
2. Templater 설정에서 **Template folder location**을 `templates`로 지정
3. 새 글 쓸 때: 커맨드 팔레트(Cmd+P) → `Templater: Create new note from template` → `새 글` 선택
   (또는 Templater 설정에서 단축키를 지정해두면 더 편함)

## 주의할 점

- `publish: true`를 나중에 다시 `false`로 바꿔도 이미 생성된 블로그 글 파일은 스크립트가 자동으로 지우지 않음 — 내리고 싶으면 `src/content/blog/`에서 직접 삭제
- 이미지 파일명이 vault 안에서 겹치면 먼저 찾은 파일이 쓰임 — 이미지 파일명은 가급적 고유하게
