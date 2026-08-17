---
name: blog-publish
description: Publish a single markdown file the user hands over directly (e.g. from a laptop without access to the Obsidian vault) into src/content/blog, mirroring scripts/publish-from-obsidian.mjs, then commit and (with confirmation) push.
---

## When to use

The user gives you one markdown file (and maybe some images) to publish, instead of running `npm run publish` against the full Obsidian vault. This is the workflow for "옵시디언 없이 글 하나만 올리고 싶을 때."

## 1. Find the source file

- If the user gave a path, use it.
- Otherwise look in `inbox/` at the repo root (gitignored drop zone) for `.md` files:
  - Exactly one → use it.
  - Multiple → ask which one.
  - None → tell the user to save the `.md` file (and any images it references) into `inbox/`, then run this again. This is the answer to "어디에 파일 올려?" — `inbox/` is the drop zone, created for this skill.
- Read the full file before doing anything else.

## 2. Read frontmatter (same shape as the Obsidian vault notes)

Fields, all optional except title falling back to filename:
- `title` — falls back to the filename (without extension).
- `description` — if missing, auto-generate from the body: strip code fences, image embeds, wikilinks (keep label), and markdown symbols, collapse whitespace, take first 120 chars + `...` if longer. Flag it in your summary as auto-generated so the user can confirm.
- `category` — defaults to `"General"`.
- `pubDate` or `date` — format as `Mon D YYYY` (e.g. `Aug 14 2026`). If neither is present, **ask the user for the date** rather than guessing — a handed-over file's mtime doesn't reflect when it was actually written, unlike a vault note. Default suggestion: today.
- `slug` — if missing, derive from the filename using the **exact same algorithm Astro's glob loader uses to generate the post's routed id** (`github-slugger`'s `slug()` — see `getContentEntryIdAndSlug` in `astro/dist/content/utils.js`), not a hand-rolled approximation: run `node -e 'import("github-slugger").then(({slug}) => console.log(slug("filename-without-ext")))'`. This matters because github-slugger strips punctuation a naive lowercase-and-strip pass wouldn't (periods, parentheses, tildes, etc.) — get this wrong and the file publishes fine but any link pointing at `/blog/{slug}/` 404s. `scripts/publish-from-obsidian.mjs` uses this same import; keep both in sync.
- Ignore any `publish:` flag — a file handed to you directly is implicitly meant to be published.

## 3. Transform the body

Match `scripts/publish-from-obsidian.mjs` behavior, but resolve against files on disk instead of a vault index:

- **Image embeds** `![[name]]`: look for a file named `name` in the same directory as the source md, and in `inbox/`. If found, copy it to `src/assets/blog/{slug}/name` and replace with `![](../../assets/blog/{slug}/name)`. If not found, replace with `<!-- MISSING IMAGE: name -->` and warn the user.
- **Wikilinks** `[[Target]]` or `[[Target|Label]]`: check if `Target` matches the title, filename, or existing `slug:` frontmatter of an existing post in `src/content/blog/*.md`. If it matches, replace with `[Label](/blog/{slug}/)` where `{slug}` is that existing post's filename run through `github-slugger`'s `slug()` (its filename alone may not equal its real routed id — see above), not the raw filename. Otherwise replace with just the label as plain text.
- Leave standard markdown images/links (`![]()`, `[]()`) untouched.
- **Tighten lists**: run the body through `tightenLists` from `scripts/lib/tighten-lists.mjs` (e.g. `node -e 'import("./scripts/lib/tighten-lists.mjs").then(({tightenLists}) => console.log(tightenLists(body)))'`, or just apply the same rule by hand). Obsidian outline notes often leave a stray blank line inside a bulleted list (commonly right after an image embedded under a bullet, or between a nested sub-bullet and the next top-level bullet). CommonMark treats any such blank line as making the *whole* list "loose," which wraps every item in `<p>` and blows up the line spacing on the published page. Drop blank lines that sit between list content and the next list item; keep blank lines that separate a list from actual non-list content.

## 4. Write the post

Write `src/content/blog/{slug}.md` with frontmatter in this exact field order (matches the existing pipeline's output):

```
---
title: "..."
description: "..."
category: "..."
pubDate: "Mon D YYYY"
---

{transformed body}
```

Show the user a short summary before committing: slug, title, pubDate, any auto-generated description, any missing images, any wikilinks converted to plain text.

## 5. Commit

- `git add` the new post file plus any newly copied images under `src/assets/blog/{slug}/`.
- Commit with a concise message (Korean is fine, match the repo's existing commit style — short imperative summary, no filler).
- **Do not add a `Co-Authored-By: Claude` trailer to this commit** — the user explicitly asked to keep Claude out of the contributor list for blog posts. This overrides the usual default for this skill only.

## 6. Push — ask first

Pushing `main` triggers `.github/workflows/deploy.yml`, which deploys straight to the live GitHub Pages site. After committing, tell the user what was committed and ask whether to push now. Only run `git push` after they confirm.

## 7. Cleanup

After a successful push, ask whether to delete the source file (and any images) from `inbox/`, rather than deleting it unprompted.
