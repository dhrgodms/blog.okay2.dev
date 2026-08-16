const LIST_ITEM_RE = /^\s*([-*+]|\d+[.)])\s+/;
const FENCE_RE = /^\s*(```|~~~)/;
const HEADING_RE = /^\s{0,3}#{1,6}\s/;
const HR_RE = /^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/;
const BLANK_RE = /^\s*$/;

// Obsidian outline notes never mean to write "loose" markdown lists, but a
// stray blank line inside one (e.g. after an image embedded under a bullet)
// makes CommonMark render every item in that list wrapped in <p>, which
// blows up the line spacing. This drops blank lines that sit strictly
// between list content and the next list item, leaving genuine paragraph
// breaks (blank line followed by non-list content) untouched.
export function tightenLists(body) {
	const lines = body.split('\n');
	const out = [];
	let inFence = false;
	let listOpen = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (FENCE_RE.test(line)) {
			inFence = !inFence;
			out.push(line);
			continue;
		}
		if (inFence) {
			out.push(line);
			continue;
		}

		if (BLANK_RE.test(line)) {
			let j = i;
			while (j < lines.length && BLANK_RE.test(lines[j])) j++;
			const next = lines[j];
			if (listOpen && next !== undefined && LIST_ITEM_RE.test(next)) {
				i = j - 1; // drop this blank run, list continues tight
				continue;
			}
			listOpen = false;
			out.push(line);
			continue;
		}

		if (LIST_ITEM_RE.test(line)) {
			listOpen = true;
		} else if (HEADING_RE.test(line) || HR_RE.test(line)) {
			listOpen = false;
		}
		out.push(line);
	}

	return out.join('\n');
}
