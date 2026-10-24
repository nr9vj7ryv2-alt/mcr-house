// Turns content/<room>/*.json into <folder>/*.html (plus an index page per room)
// and runs accessibility lint checks on every generated page.
// Run on its own with: node scripts/render.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { esc } from './lib.mjs';
import { ROOMS, ROOM_KEYS } from './rooms.mjs';

const ROOT = process.cwd();
const exists = (p) => fs.access(p).then(() => true, () => false);
const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
const readSite = async () => JSON.parse(await fs.readFile(path.join(ROOT, 'content/site.json'), 'utf8'));
const readPartial = (name) => fs.readFile(path.join(ROOT, 'templates/partials', name), 'utf8');

// ---------- Accessibility lint (runs on generated HTML, costs no tokens) ----------
export function lintHtml(html) {
  const errs = [];
  if (!/<html[^>]*\blang="[a-z-]+"/i.test(html)) errs.push('Missing lang attribute on <html>');
  if (!/<title>[^<]+<\/title>/.test(html)) errs.push('Missing or empty <title>');
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) errs.push(`Expected exactly one <h1>, found ${h1s}`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]+"/.test(m[0])) errs.push('Image without non-empty alt text');
  }
  let prev = 0;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const level = Number(m[1]);
    if (prev && level > prev + 1) errs.push(`Heading level skips from h${prev} to h${level}`);
    prev = level;
  }
  for (const m of html.matchAll(/<input\b[^>]*\bid="([^"]+)"/g)) {
    if (!html.includes(`for="${m[1]}"`)) errs.push(`Input #${m[1]} has no matching <label>`);
  }
  if (/<video\b/.test(html)) {
    if (!/<track\b[^>]*kind="captions"/.test(html)) errs.push('Video has no captions track');
    if (!/class="transcript"/.test(html)) errs.push('Video has no text transcript');
  }
  return errs;
}

// ---------- Page shell ----------
async function shell({ title, description, main }) {
  const site = await readSite();
  const tpl = await fs.readFile(path.join(ROOT, 'templates/activity.html'), 'utf8');
  const header = fill(await readPartial('header.html'), { ROOT: '../' });
  const footer = fill(await readPartial('footer.html'), { ROOT: '../' });
  return fill(tpl, {
    ROOT: '../',
    STYLESHEET: site.stylesheet,
    TITLE: esc(`${title} | ${site.siteName}`),
    DESCRIPTION: esc(description),
    HEADER: header,
    MAIN: main,
    FOOTER: footer,
  });
}

// ---------- Optional media (picked up automatically if the files exist) ----------
async function mediaContext(room, a) {
  const heroPath = `assets/${room.folder}/${a.slug}.jpg`;
  const videoPath = `assets/videos/${a.slug}.mp4`;
  const vttPath = `assets/videos/${a.slug}.vtt`;
  const hasHero = await exists(path.join(ROOT, heroPath));
  const hasVideo = await exists(path.join(ROOT, videoPath));
  const hasVtt = await exists(path.join(ROOT, vttPath));
  const transcript = Array.isArray(a.videoNarration) && a.videoNarration.length
    ? `<details class="transcript"><summary>Video transcript</summary>${a.videoNarration.map((l) => `<p>${esc(l)}</p>`).join('')}</details>`
    : '';
  return {
    hero: hasHero ? `<figure class="activity-hero"><img src="../${heroPath}" alt="${esc(a.heroAlt)}"></figure>` : '',
    video: hasVideo
      ? `<section aria-labelledby="video-h"><h2 id="video-h">Watch how it\u2019s done</h2>
<video controls preload="metadata"${hasHero ? ` poster="../${heroPath}"` : ''}>
<source src="../${videoPath}" type="video/mp4">
${hasVtt ? `<track kind="captions" src="../${vttPath}" srclang="en" label="English" default>` : ''}
<p>Your browser can\u2019t play this video. Please use the text on this page instead.</p>
</video>
${transcript}</section>`
      : '',
  };
}

// ---------- One item page ----------
export async function renderItemPage(room, a) {
  const ctx = await mediaContext(room, a);
  const metaItems = room.meta(a).filter(Boolean);
  const main = `<main id="main-content">
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="../${room.page}">${esc(room.name)}</a> &rsaquo; <a href="index.html">${esc(room.listLabel)}</a> &rsaquo; <span aria-current="page">${esc(a.title)}</span>
</nav>
<article class="activity room-${esc(room.folder)}">
  <header>
    <h1>${esc(a.title)}</h1>
    <p class="lede">${esc(a.summary)}</p>
    <ul class="activity-meta">${metaItems.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
  </header>
  ${ctx.hero}
  ${room.body(a, ctx)}
</article>
</main>`;
  return shell({ title: a.title, description: a.summary, main });
}

// ---------- Index page listing everything in a room ----------
export async function renderIndexPage(room, items) {
  const cards = items
    .map(
      (a) => `    <li class="activity-card">
      <h2><a href="${esc(a.slug)}.html">${esc(a.title)}</a></h2>
      <p>${esc(a.summary)}</p>
      <p class="activity-meta-line">${room.meta(a).filter(Boolean).map(esc).join(' &middot; ')}</p>
    </li>`,
    )
    .join('\n');
  const main = `<main id="main-content">
  <nav aria-label="Breadcrumb" class="breadcrumb"><a href="../${room.page}">${esc(room.name)}</a> &rsaquo; <span aria-current="page">${esc(room.listLabel)}</span></nav>
  <h1>${esc(room.indexTitle)}</h1>
  <p class="lede">${esc(room.indexLede)}</p>
  <ul class="activity-grid">
${cards}
  </ul>
</main>`;
  return shell({ title: room.indexTitle, description: room.indexLede, main });
}

// ---------- Load + render ----------
export async function loadItems(room) {
  const dir = path.join(ROOT, room.contentDir);
  if (!(await exists(dir))) return [];
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const items = await Promise.all(
    files.map(async (f) => ({ ...JSON.parse(await fs.readFile(path.join(dir, f), 'utf8')), slug: f.replace(/\.json$/, '') })),
  );
  return items.sort((x, y) => String(y.createdAt || '').localeCompare(String(x.createdAt || '')));
}

// Renders every room (or only the keys given). Returns { "folder/slug": [lint errors] }.
export async function writePages(roomKeys = ROOM_KEYS) {
  const lint = {};
  for (const key of roomKeys) {
    const room = ROOMS[key];
    const items = await loadItems(room);
    if (!items.length) continue;
    const outDir = path.join(ROOT, room.folder);
    await fs.mkdir(outDir, { recursive: true });
    for (const a of items) {
      const errs = room.validate(a);
      if (errs.length) { lint[`${room.folder}/${a.slug}`] = errs.map((e) => `invalid content: ${e.problem}`); continue; }
      const html = await renderItemPage(room, a);
      await fs.writeFile(path.join(outDir, `${a.slug}.html`), html);
      lint[`${room.folder}/${a.slug}`] = lintHtml(html);
    }
    const indexHtml = await renderIndexPage(room, items.filter((a) => !room.validate(a).length));
    await fs.writeFile(path.join(outDir, 'index.html'), indexHtml);
    lint[`${room.folder}/index`] = lintHtml(indexHtml);
  }
  return lint;
}

// CLI: node scripts/render.mjs [room1,room2]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const keys = process.argv[2] ? process.argv[2].split(',') : ROOM_KEYS;
  const lint = await writePages(keys);
  let failed = false;
  for (const [name, errs] of Object.entries(lint)) {
    if (errs.length) { failed = true; console.error(`\u2717 ${name}: ${errs.join('; ')}`); }
    else console.log(`\u2713 ${name}`);
  }
  if (failed) process.exit(1);
}
