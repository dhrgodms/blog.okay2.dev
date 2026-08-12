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

Run all three. Report findings grouped under these exact headings, in Korean, concise (bullet points, not essays).

### 1. 팩트 확인
Check factual/technical claims in the body — command syntax, flags, behavior descriptions, version-specific claims, anything stated as fact. For claims you can verify from general knowledge, verify them. For anything time-sensitive or you're not confident about, use WebSearch rather than guessing. Do **not** silently edit the file for this category — flag questionable claims with a short reason so the user can judge. If everything checks out, say so briefly instead of listing nothing.

### 2. 오타 확인
Scan for spelling mistakes, typos, and broken 조사(particles)/문법. These are safe to fix directly — apply the fixes with Edit, then list what you changed (before → after) so the user can see the diff at a glance. Don't touch phrasing/style choices that aren't actually wrong, just errors.

### 3. 날짜 확인
Compare the post's `pubDate` frontmatter against the actual date the file was written:
- Prefer `git log --follow --diff-filter=A -- <file>` (first commit date) if the file is already tracked; if it's untracked/new, use today's date.
- Flag a mismatch — this field drives the contribution-graph heatmap on the homepage (`src/components/ContributionGraph.astro`), so a wrong date means the wrong day gets credit for the post.
- Do not change `pubDate` yourself; ask the user to confirm the correct date before editing it, since backdating vs. today's date is their call.

## Output

End with a short summary: ready to publish, or N items need the user's attention (list which). Keep the whole response tight — this is a quick pre-publish pass, not a deep audit.
