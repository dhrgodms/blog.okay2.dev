# blog.okay2.dev

공부한 것들을 기록하는 블로그. [Astro](https://astro.build)로 만들었고 GitHub Pages로 배포됩니다.

## 개발

```sh
npm install
npm run dev
```

## 글쓰기

`src/content/blog/` 아래에 마크다운 파일을 추가하면 됩니다.

```md
---
title: '제목'
description: '설명'
pubDate: 'Aug 12 2026'
---

본문 내용
```

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로 빌드하고 배포합니다.
