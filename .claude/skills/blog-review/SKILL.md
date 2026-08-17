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

Run all four. Report findings grouped under these exact headings, in Korean, concise (bullet points, not essays).

### 1. 팩트 확인
Check factual/technical claims in the body — command syntax, flags, behavior descriptions, version-specific claims, anything stated as fact. For claims you can verify from general knowledge, verify them. For anything time-sensitive or you're not confident about, use WebSearch rather than guessing. Do **not** silently edit the file for this category — flag questionable claims with a short reason so the user can judge. If everything checks out, say so briefly instead of listing nothing.

### 2. 오타 확인
Scan for spelling mistakes, typos, and broken 조사(particles)/문법. These are safe to fix directly — apply the fixes with Edit, then list what you changed (before → after) so the user can see the diff at a glance. Don't touch phrasing/style choices that aren't actually wrong, just errors.

### 3. 날짜 확인
Compare the post's `pubDate` frontmatter against the actual date the file was written:
- Prefer `git log --follow --diff-filter=A -- <file>` (first commit date) if the file is already tracked; if it's untracked/new, use today's date.
- Flag a mismatch — this field drives the contribution-graph heatmap on the homepage (`src/components/ContributionGraph.astro`), so a wrong date means the wrong day gets credit for the post.
- Do not change `pubDate` yourself; ask the user to confirm the correct date before editing it, since backdating vs. today's date is their call.

### 4. 위키링크 확인
Two separate things can go wrong here — check both.

**a) Leftover `[[...]]` syntax.** Scan the body for any literal `[[Target]]` or `[[Target|Label]]` that survived into the published file — this should never happen, since the publish pipelines (`scripts/publish-from-obsidian.mjs` and the `blog-publish` skill) resolve every wikilink before the file lands in `src/content/blog/`. It usually means the target didn't match any published post at publish time (it may exist *now*), or the post was authored/edited directly without going through either pipeline.

**b) Already-converted links pointing at the wrong URL.** This is the more likely failure mode, and it's silent — the link looks fine in the markdown but 404s when clicked. Scan for `[label](/blog/SOMETHING/)` links and verify `SOMETHING` is the *real* routed id of an existing post: run each candidate target's filename (without `.md`) through `node -e 'import("github-slugger").then(({slug}) => console.log(slug("filename-without-ext")))'` and compare — do **not** assume a post's on-disk filename equals its route. (Concretely: `github-slugger` strips periods/parens/tildes that a naive slug wouldn't — e.g. a file named `2.-파티셔닝.md` actually routes to `/blog/2-파티셔닝/`, not `/blog/2.-파티셔닝/`. This exact class of bug shipped once already.)

For either case, once a matching post is identified: fix directly with Edit, replacing with `[Label](/blog/{real-slug}/)`. If no matching post exists, leave/replace with plain text and flag it (연결 대상 없음) so the user can decide.

If nothing is wrong, say so briefly instead of listing nothing.

## Output

End with a short summary: ready to publish, or N items need the user's attention (list which). Keep the whole response tight — this is a quick pre-publish pass, not a deep audit.
