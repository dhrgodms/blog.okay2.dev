---
name: blog-review
description: Review a freshly written blog post in src/content/blog for factual accuracy, typos, and date correctness before publishing.
---

## When to use

The user just finished writing a post in `src/content/blog/*.md` and wants it checked before it's considered done.

## Target file

- If the user names a file/slug in the invocation, use that.
- Otherwise, find the post to review: `git status --short src/content/blog` for a new/modified `.md` file; if nothing there, fall back to the most recently modified `.md` file in `src/content/blog/` (excluding files with a leading underscore, which are scratch/test files).
- Read the full file before doing anything else.

## Checks

Run all seven. Report findings grouped under these exact headings, in Korean, concise (bullet points, not essays).

### 1. 파일명 확인
The file's own on-disk name (without `.md`) should already be canonical — i.e. equal to its own slugified form, matching the convention seen in sibling posts (`1-리눅스란.md`, `4-파일-시스템.md`, …). Run `node -e 'import("github-slugger").then(({slug}) => console.log(slug("basename-without-ext")))'` on the current file's basename and compare to the basename itself.
- If they differ (e.g. a stray period survives, like the file having `5.-마운트와-바인드.md` instead of `5-마운트와-바인드.md`), Astro's glob loader will still route it correctly (it slugifies again at build time), but the mismatch is confusing to maintain and is exactly the kind of drift that causes wrong links later (see 5b). Rename directly with `git mv old-name.md new-slug.md` and note the rename in the summary.
- If the post has an `src/assets/blog/{old-name}/` image folder, leave that folder's name alone — image paths in the body are plain relative paths, not routed through the slugger, so they don't need to match the post's slug.

### 2. 팩트 확인
Check factual/technical claims in the body — command syntax, flags, behavior descriptions, version-specific claims, anything stated as fact. For claims you can verify from general knowledge, verify them. For anything time-sensitive or you're not confident about, use WebSearch rather than guessing. Do **not** silently edit the file for this category — flag questionable claims with a short reason so the user can judge. If everything checks out, say so briefly instead of listing nothing.

### 3. 오타 확인
Scan for spelling mistakes, typos, and broken 조사(particles)/문법. These are safe to fix directly — apply the fixes with Edit, then list what you changed (before → after) so the user can see the diff at a glance. Don't touch phrasing/style choices that aren't actually wrong, just errors.

### 4. 날짜 확인
Compare the post's `pubDate` frontmatter against the actual date the file was written:
- Prefer `git log --follow --diff-filter=A -- <file>` (first commit date) if the file is already tracked; if it's untracked/new, use today's date.
- Flag a mismatch — this field drives the contribution-graph heatmap on the homepage (`src/components/ContributionGraph.astro`), so a wrong date means the wrong day gets credit for the post.
- Do not change `pubDate` yourself; ask the user to confirm the correct date before editing it, since backdating vs. today's date is their call.

### 5. 위키링크 확인
Two separate things can go wrong here — check both.

**a) Leftover `[[...]]` syntax.** Scan the body for any literal `[[Target]]` or `[[Target|Label]]` that survived into the published file — this should never happen, since the publish pipelines (`scripts/publish-from-obsidian.mjs` and the `blog-publish` skill) resolve every wikilink before the file lands in `src/content/blog/`. It usually means the target didn't match any published post at publish time (it may exist *now*), or the post was authored/edited directly without going through either pipeline.

**b) Already-converted links pointing at the wrong URL.** This is the more likely failure mode, and it's silent — the link looks fine in the markdown but 404s when clicked. Scan for `[label](/blog/SOMETHING/)` links and verify `SOMETHING` is the *real* routed id of an existing post: run each candidate target's filename (without `.md`) through `node -e 'import("github-slugger").then(({slug}) => console.log(slug("filename-without-ext")))'` and compare — do **not** assume a post's on-disk filename equals its route. (Concretely: `github-slugger` strips periods/parens/tildes that a naive slug wouldn't — e.g. a file named `2.-파티셔닝.md` actually routes to `/blog/2-파티셔닝/`, not `/blog/2.-파티셔닝/`. This exact class of bug shipped once already.)

For either case, once a matching post is identified: fix directly with Edit, replacing with `[Label](/blog/{real-slug}/)`. If no matching post exists, leave/replace with plain text and flag it (연결 대상 없음) so the user can decide.

If nothing is wrong, say so briefly instead of listing nothing.

### 6. 이미지 경로 확인
For every local image link `![...](../../assets/blog/...)` in the body:
- Check the referenced file actually exists on disk at that path (URL-decode the path first, since links may use `%20` etc.).
- Check the link is properly URL-encoded — no literal spaces or other characters that break a markdown link destination (e.g. `Pasted image 20260827230126.png` must appear in the link as `Pasted%20image%2020260827230126.png`). An unencoded space silently breaks the image with no build error, so it's easy to miss.
- If broken, fix directly with Edit (`encodeURIComponent` the filename portion, keep the file on disk unrenamed) and note the fix.

### 7. 관련 글 연결 확인

Read the other posts in `src/content/blog/*.md` (skip `hello.md`, `linux-commands-example.md`, `markdown-style-guide.md` — those aren't part of the content series) and look for genuine overlap with this post: a term this post uses that another post defines or expands on, a direct continuation of a prior post's topic, or a concept both posts build on from different angles. Category match alone (e.g. both tagged `Linux`) is not enough — the connection has to be about actual shared content.

For each real match:
- If there's a specific point in the body where the term/concept is used, add a short inline link there: `[label](/blog/{real-slug}/)` (use the target's real routed slug — see check 5b for how to compute it, not its raw filename).
- Maintain a `## 관련 글` section near the end of the post (create it if missing, right before the final line) listing the related posts: `- [title](/blog/{real-slug}/) — one-line reason`.
- Check whether the connection is worth reflecting the other way too — if an older sibling post doesn't yet link to this new one but clearly should (e.g. this post is the natural continuation of it, the way `6-셀프-바인드-마운트` continues `5-마운트와-바인드`), add the reciprocal link in that other file as well. This is the one check allowed to touch files besides the target post — list every other file you edited in the final summary so the user can see the full diff surface.

Skip entirely if nothing is genuinely related — don't force a `관련 글` section onto a post that doesn't have real connections, and don't link posts that only share a category.

## Output

End with a short summary: ready to publish, or N items need the user's attention (list which). Keep the whole response tight — this is a quick pre-publish pass, not a deep audit.
