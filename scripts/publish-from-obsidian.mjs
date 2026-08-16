#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { tightenLists } from './lib/tighten-lists.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BLOG_DIR = join(ROOT, 'src/content/blog');
const ASSETS_DIR = join(ROOT, 'src/assets/blog');
const VAULT_PATH_FILE = join(ROOT, '.obsidian-vault-path');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const SKIP_DIRS = new Set(['.obsidian', '.trash', '.git', 'node_modules']);

function resolveVaultPath() {
	const argPath = process.argv[2];
	if (argPath) {
		writeFileSync(VAULT_PATH_FILE, argPath.trim() + '\n');
		return argPath.trim();
	}
	if (existsSync(VAULT_PATH_FILE)) {
		return readFileSync(VAULT_PATH_FILE, 'utf-8').trim();
	}
	console.error(
		'Vault 경로를 모릅니다. 처음 한 번은 경로를 인자로 주세요:\n' +
			'  npm run publish -- "/path/to/your/vault"\n' +
			'(이후에는 .obsidian-vault-path에 저장되어 npm run publish만 실행하면 됩니다.)',
	);
	process.exit(1);
}

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.') && SKIP_DIRS.has(entry.name)) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (SKIP_DIRS.has(entry.name)) continue;
			walk(full, out);
		} else {
			out.push(full);
		}
	}
	return out;
}

function buildFileIndex(allFiles) {
	const index = new Map();
	for (const f of allFiles) {
		const name = basename(f);
		if (!index.has(name)) index.set(name, f);
	}
	return index;
}

function slugify(name) {
	// Astro's content glob loader lowercases generated entry ids, so the
	// slug we write here must already be lowercase or cross-post links break.
	return name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[/\\?%*:|"<>]/g, '');
}

function formatPubDate(date) {
	const parts = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).formatToParts(
		date,
	);
	const get = (t) => parts.find((p) => p.type === t)?.value;
	return `${get('month')} ${get('day')} ${get('year')}`;
}

function autoDescription(body) {
	const plain = body
		.replace(/```[\s\S]*?```/g, '')
		.replace(/!\[\[[^\]]*\]\]/g, '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1')
		.replace(/[#>*_`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return plain.length > 120 ? plain.slice(0, 120).trim() + '...' : plain;
}

// pass 1: figure out which notes are published and what slug each will get,
// so pass 2 can tell a link to a published note from a link to nothing.
function buildPublishedIndex(mdFiles) {
	const index = new Map(); // basename (no ext) -> { slug, title }
	for (const file of mdFiles) {
		const raw = readFileSync(file, 'utf-8');
		const { data } = matter(raw);
		if (data.publish !== true) continue;
		const baseName = basename(file, '.md');
		const slug = slugify(data.slug || baseName);
		index.set(baseName, { slug, title: data.title || baseName });
	}
	return index;
}

function transformBody(body, { slug, fileIndex, publishedIndex }) {
	const missingImages = [];
	const usedImages = [];
	const linkedSlugs = new Set();
	let convertedToLinks = 0;
	let convertedToText = 0;

	let result = body.replace(/!\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, (_match, rawName) => {
		const name = rawName.trim();
		const src = fileIndex.get(name);
		if (!src || !IMAGE_EXT.has(extname(name).toLowerCase())) {
			missingImages.push(name);
			return `<!-- MISSING IMAGE: ${name} -->`;
		}
		const destDir = join(ASSETS_DIR, slug);
		mkdirSync(destDir, { recursive: true });
		copyFileSync(src, join(destDir, name));
		usedImages.push(name);
		return `![](../../assets/blog/${slug}/${name})`;
	});

	result = result.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_match, target, _aliasGroup, alias) => {
		const targetName = target.trim();
		const label = (alias || targetName).trim();
		const published = publishedIndex.get(targetName);
		if (published && published.slug !== slug) {
			convertedToLinks++;
			linkedSlugs.add(published.slug);
			return `[${label}](/blog/${published.slug}/)`;
		}
		convertedToText++;
		return label;
	});

	result = tightenLists(result);

	return { body: result, missingImages, usedImages, convertedToLinks, convertedToText, linkedSlugs };
}

function main() {
	const vaultPath = resolveVaultPath();
	if (!existsSync(vaultPath)) {
		console.error(`Vault 경로를 찾을 수 없습니다: ${vaultPath}`);
		process.exit(1);
	}

	const allFiles = walk(vaultPath);
	const mdFiles = allFiles.filter((f) => extname(f).toLowerCase() === '.md');
	const fileIndex = buildFileIndex(allFiles);
	const publishedIndex = buildPublishedIndex(mdFiles);

	let published = 0;
	let skipped = 0;
	const warnings = [];

	for (const file of mdFiles) {
		const raw = readFileSync(file, 'utf-8');
		const { data, content } = matter(raw);

		if (data.publish !== true) {
			skipped++;
			continue;
		}

		const baseName = basename(file, '.md');
		const slug = slugify(data.slug || baseName);
		const title = data.title || baseName;
		const description = data.description || autoDescription(content);
		const category = data.category || 'General';
		const pubDateSource = data.pubDate || data.date;
		const pubDate = pubDateSource ? formatPubDate(new Date(pubDateSource)) : formatPubDate(statSync(file).birthtime);

		const { body, missingImages, usedImages, convertedToLinks, convertedToText } = transformBody(content.trim(), {
			slug,
			fileIndex,
			publishedIndex,
		});

		const frontmatterLines = [
			'---',
			`title: "${title.replace(/"/g, '\\"')}"`,
			`description: "${description.replace(/"/g, '\\"')}"`,
			`category: "${category}"`,
			`pubDate: "${pubDate}"`,
			'---',
			'',
		];

		mkdirSync(BLOG_DIR, { recursive: true });
		writeFileSync(join(BLOG_DIR, `${slug}.md`), frontmatterLines.join('\n') + '\n' + body + '\n');

		published++;
		console.log(`✔ ${relative(vaultPath, file)} → src/content/blog/${slug}.md`);
		if (usedImages.length) console.log(`  이미지 ${usedImages.length}개 복사: ${usedImages.join(', ')}`);
		if (convertedToLinks) console.log(`  위키링크 ${convertedToLinks}개 → 다른 글로 연결`);
		if (convertedToText) console.log(`  위키링크 ${convertedToText}개 → 일반 텍스트로 변환 (연결 대상 미발행)`);
		if (missingImages.length) {
			warnings.push(`${baseName}: 이미지 못 찾음 - ${missingImages.join(', ')}`);
		}
		if (!data.description) warnings.push(`${baseName}: description 없어서 본문에서 자동 생성함 — 확인 필요`);
	}

	console.log(`\n${published}개 발행, ${skipped}개 건너뜀 (publish: true 아님)`);
	if (warnings.length) {
		console.log('\n확인 필요:');
		warnings.forEach((w) => console.log(`  - ${w}`));
	}
}

main();
