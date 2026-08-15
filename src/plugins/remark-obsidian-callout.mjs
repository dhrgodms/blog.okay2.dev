/**
 * Transforms Obsidian-style callout blockquotes, e.g.
 *
 *   > [!note] Title
 *   > body...
 *
 * into a `<div class="callout" data-callout="note">` (or `<details>` when
 * foldable with `+`/`-`) so they can be styled like Obsidian callouts
 * instead of rendering as plain blockquotes.
 */

const MARKER = /^\[!([\w-]+)\]([+-])?\s?/;

function walkBlockquotes(node, visit) {
	if (!node || !Array.isArray(node.children)) return;
	for (const child of node.children) {
		if (child.type === 'blockquote') visit(child);
		walkBlockquotes(child, visit);
	}
}

function splitTitleParagraph(paragraph) {
	const children = paragraph.children ?? [];
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (child.type === 'text' && child.value.includes('\n')) {
			const index = child.value.indexOf('\n');
			const before = child.value.slice(0, index);
			const after = child.value.slice(index + 1);

			const titleChildren = children.slice(0, i);
			if (before) titleChildren.push({ type: 'text', value: before });

			const bodyChildren = [];
			if (after) bodyChildren.push({ type: 'text', value: after });
			bodyChildren.push(...children.slice(i + 1));

			return { titleChildren, bodyChildren };
		}
	}
	return { titleChildren: children, bodyChildren: [] };
}

export default function remarkObsidianCallout() {
	return (tree) => {
		walkBlockquotes(tree, (blockquote) => {
			const firstChild = blockquote.children[0];
			if (!firstChild || firstChild.type !== 'paragraph') return;

			const firstText = firstChild.children?.[0];
			if (!firstText || firstText.type !== 'text') return;

			const match = MARKER.exec(firstText.value);
			if (!match) return;

			const [marker, rawType, fold] = match;
			const type = rawType.toLowerCase();

			const { titleChildren, bodyChildren } = splitTitleParagraph(firstChild);

			// Strip the marker (`[!type]+ `) off the start of the title text.
			const strippedFirst = titleChildren[0];
			if (strippedFirst && strippedFirst.type === 'text') {
				strippedFirst.value = strippedFirst.value.slice(marker.length);
				if (!strippedFirst.value) titleChildren.shift();
			}

			const typeLabelNode = {
				type: 'emphasis',
				data: { hName: 'span', hProperties: { className: ['callout-type'] } },
				children: [{ type: 'text', value: type.toUpperCase() }],
			};

			const titleContentChildren =
				titleChildren.length > 0
					? [typeLabelNode, { type: 'text', value: ' ' }, ...titleChildren]
					: [typeLabelNode];

			const isFoldable = fold === '+' || fold === '-';

			const titleNode = {
				type: 'paragraph',
				data: {
					hName: isFoldable ? 'summary' : 'div',
					hProperties: { className: ['callout-title'] },
				},
				children: titleContentChildren,
			};

			const restChildren = blockquote.children.slice(1);
			const newBlockquoteChildren =
				bodyChildren.length > 0
					? [titleNode, { type: 'paragraph', children: bodyChildren }, ...restChildren]
					: [titleNode, ...restChildren];

			blockquote.children = newBlockquoteChildren;

			blockquote.data = blockquote.data || {};
			blockquote.data.hName = isFoldable ? 'details' : 'div';
			blockquote.data.hProperties = {
				className: ['callout'],
				'data-callout': type,
				...(isFoldable ? { open: fold === '+' } : {}),
			};
		});
	};
}
