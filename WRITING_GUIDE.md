# 글쓰기 가이드

## 새 글 쓰기

1. `src/content/blog/`에 `.md` 파일 생성 (파일명이 URL 슬러그가 됨, 예: `my-post.md` → `/blog/my-post/`)
2. 아래 frontmatter 작성:

```md
---
title: '글 제목'
description: '한 줄 요약'
category: '카테고리명'
pubDate: 'Aug 12 2026'
---

본문 내용...
```

- `category`: Home 화면에서 이 값 기준으로 글이 묶여요. 기존 카테고리(General, Linux, Markdown 등)와 겹치면 같은 섹션에, 새 값이면 새 섹션이 생겨요.
- `pubDate`: `'Aug 12 2026'` 형식. **글을 실제로 쓴 날짜**로 넣어야 Home 상단 잔디(contribution graph)에 정확히 반영돼요.

## 이미지 넣는 법

이미지 파일은 `src/assets/blog/`에 저장. (`src/content/blog/`가 아니라 `src/assets/blog/`인 것 주의)

이미지를 보여주고 싶은 위치에 그 줄을 그대로 쓰면, 딱 그 자리에 이미지가 들어가요. 본문 아무 데나 원하는 만큼 반복해서 써도 됨:

```md
본문 내용...

![대체 텍스트](../../assets/blog/파일명.jpg)

이어지는 본문...

![다른 이미지 설명](../../assets/blog/파일명2.jpg)

계속 본문...
```

Astro가 자동으로 최적화(webp 변환, lazy loading)해줘요.

## 글 쓰고 나서

1. `npx astro dev status`로 개발 서버 떠 있는지 확인하고(안 떠 있으면 `astro dev --background`), `localhost:4321`에서 실제로 확인
2. 확인 끝나면 `/blog-review` 실행 → 팩트 점검, 오타 점검, 날짜 점검을 한 번에 처리
