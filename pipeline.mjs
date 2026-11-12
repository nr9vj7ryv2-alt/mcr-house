// Multi-agent content pipeline for Monserrat's Creative Room, all six rooms.
//
//   node scripts/pipeline.mjs plan  --room all --count 10     # planner agents add topic ideas
//   node scripts/pipeline.mjs write --room all --count 1      # drafts 1 item per room, end to end
//   node scripts/pipeline.mjs write --room parent,play --count 2
//
// --count is PER ROOM. --room is "all" or a comma list of: creative, learning, play, parent, family, kindness
//
// Agents:
//   Planner  (cheap model)    -> proposes new topics that fill gaps in a room's backlog
//   Writer   (cheap model)    -> drafts / revises one item as structured JSON
//   Reviewer (stronger model) -> checks safety, accuracy, accessibility, originality, room-specific risks
// Then plain code renders pages, runs accessibility lint, and flags facts a human must verify.
// A human approves the resulting pull request; nothing publishes without review.

import fs from 'node:fs/promises';
import path from 'node:path';
import { callClaude, parseJson, withRetry, MODELS, slugify } from './lib.mjs';
import { ROOMS, ROOM_KEYS } from './rooms.mjs';
import { writePages } from './render.mjs';

const ROOT = process.cwd();
const FILES = {
  topics: path.join(ROOT, 'content/topics.json'),
  style: path.join(ROOT, 'content/style-guide.md'),
  briefs: path.join(ROOT, 'content/briefs'),
  prBody: process.env.PR_BODY_PATH || path.join(ROOT, '.pipeline/pr-body.md'),
};

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const cmd = args[0] && !args[0].startsWith('--') ? args[0] : 'write';
const COUNT = Number(arg('--count', '1')) || 1;
const roomArg = arg('--room', 'all');
const TARGETS = roomArg === 'all' ? ROOM_KEYS : roomArg.split(',').map((s) => s.trim()).filter(Boolean);
const MAX_REVISIONS = 2;

for (const k of TARGETS) {
  if (!ROOMS[k]) {
    console.error(`Unknown room "${k}". Use one of: ${ROOM_KEYS.join(', ')}, or "all".`);
    process.exit(1);
  }
}

const readJson = async (p, fallback) => {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch { return fallback; }
};
const writeJson = (p, data) => fs.writeFile(p, JSON.stringify(data, null, 2) + '\n');
const readBrief = async (key) => {
  try { return await fs.readFile(path.join(FILES.briefs, `${key}.md`), 'utf8'); } catch { return ''; }
};

// ---------- Planner ----------
async function plan(topics, key, n, styleGuide) {
  const room = ROOMS[key];
  console.log(`Planner (${room.name}): asking for ${n} new topic ideas...`);
  const existing = topics.filter((t) => t.room === key).map((t) => t.title).join('\n') || '(none yet)';
  const brief = await readBrief(key);
  const system = `You plan content for the ${room.name} ("${room.tagline}") of a family website.\n\n${styleGuide}\n\n${brief}\n\nReturn ONLY a JSON array.`;
  const user = `Existing ${room.name} topics (do not repeat or closely duplicate):\n${existing}\n\nPropose ${n} new ideas. Focus: ${room.plannerHint}\nEach item: {"title": string, "theme": string, "ages": "e.g. 4-8 (or 'all' if not age specific)"}.`;
  const ideas = await withRetry(async () => {
    const out = parseJson(await callClaude({ model: MODELS.writer, system, user, maxTokens: 2000 }));
    if (!Array.isArray(out)) throw new Error('Planner did not return an array');
    return out;
  });
  const seen = new Set(topics.filter((t) => t.room === key).map((t) => slugify(t.title)));
  for (const idea of ideas) {
    const slug = slugify(idea.title || '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    topics.push({ room: key, title: idea.title, theme: idea.theme || '', ages: idea.ages || 'all', status: 'todo' });
  }
  await writeJson(FILES.topics, topics);
  return topics;
}

// ---------- Writer ----------
async function writeDraft(key, topic, styleGuide, previous, issues) {
  const room = ROOMS[key];
  const brief = await readBrief(key);
  const system = `You write ${room.name} ("${room.tagline}") content for a family website.\n\n${styleGuide}\n\n${brief}\n\nReturn ONLY one JSON object (no markdown fences) in exactly this shape:\n${room.schema}`;
  let user = `Topic: ${topic.title}\nTheme: ${topic.theme || 'any'}\nTarget ages: ${topic.ages || 'all'}`;
  if (previous) {
    user += `\n\nYour previous draft:\n${JSON.stringify(previous)}\n\nFix EVERY issue below and return the full corrected JSON:\n` +
      issues.map((i) => `- [${i.severity}/${i.category}] ${i.problem} -> ${i.fix || 'fix it'}`).join('\n');
  }
  return withRetry(async () => parseJson(await callClaude({ model: MODELS.writer, system, user, maxTokens: 3500 })));
}

// ---------- Reviewer ----------
async function reviewDraft(key, item, styleGuide) {
  const room = ROOMS[key];
  const brief = await readBrief(key);
  const system = `You are a careful reviewer of ${room.name} content for a family website that serves parents, caregivers, educators and children.\n\n${styleGuide}\n\n${brief}\n\nCheck the draft for:\n- safety: anything that could hurt a child or give unsafe advice\n- accuracy: steps or advice that would not work, missing materials, unrealistic times or ages\n- accessibility: plain language (about grade 6 reading level), nothing that relies on color, sight or hearing alone\n- originality: no copied text, no trademarked characters or brands, no invented attributions\n- tone: warm, welcoming, inclusive of different family types, cultures, budgets and abilities\n\nRoom-specific focus: ${room.reviewFocus}\n\nReturn ONLY JSON: {"summary": "one sentence", "issues": [{"severity": "high|medium|low", "category": "safety|accuracy|accessibility|originality|tone", "problem": "...", "fix": "..."}]}\nUse "high" for anything that could hurt a child or is a made-up fact, "medium" for anything that would make the content fail, mislead or confuse, "low" for polish. Return an empty issues list if the draft is good.`;
  const user = `Review this draft:\n${JSON.stringify(item)}`;
  return withRetry(async () => {
    const out = parseJson(await callClaude({ model: MODELS.reviewer, system, user, maxTokens: 1500 }));
    return { summary: out.summary || '', issues: Array.isArray(out.issues) ? out.issues : [] };
  });
}

const blocking = (issues) => issues.filter((i) => i.severity === 'high' || i.severity === 'medium');

// ---------- Draft one item for one room ----------
async function draftOne(key, topic, styleGuide) {
  const room = ROOMS[key];
  let draft = await writeDraft(key, topic, styleGuide);
  let review = { summary: '', issues: [] };
  let rounds = 0;
  let open = [];

  for (;;) {
    const formatIssues = room.validate(draft);
    review = formatIssues.length ? { summary: 'Format problems', issues: formatIssues } : await reviewDraft(key, draft, styleGuide);
    open = blocking(review.issues);
    console.log(`  review round ${rounds}: ${review.issues.length} issue(s), ${open.length} blocking`);
    if (!open.length || rounds >= MAX_REVISIONS) break;
    draft = await writeDraft(key, topic, styleGuide, draft, review.issues);
    rounds++;
  }

  const stillInvalid = room.validate(draft);
  if (stillInvalid.length) return { failed: true, notes: stillInvalid.map((i) => i.problem) };
  return { draft, review, rounds, open };
}

// ---------- Main flows ----------
async function runWrite() {
  const styleGuide = await fs.readFile(FILES.style, 'utf8');
  let topics = await readJson(FILES.topics, []);
  const report = [];

  for (const key of TARGETS) {
    const room = ROOMS[key];
    const dir = path.join(ROOT, room.contentDir);
    await fs.mkdir(dir, { recursive: true });

    try {
      if (topics.filter((t) => t.room === key && t.status === 'todo').length < COUNT) {
        topics = await plan(topics, key, Math.max(COUNT * 3, 6), styleGuide);
      }
    } catch (err) {
      console.error(`Planner failed for ${room.name}: ${err.message}`);
      report.push({ room: key, title: `${room.name} planning`, failed: true, notes: [err.message] });
      continue;
    }

    for (let n = 0; n < COUNT; n++) {
      const topic = topics.find((t) => t.room === key && t.status === 'todo');
      if (!topic) { console.log(`No ${room.name} topics left.`); break; }
      console.log(`\n=== ${room.name}: ${topic.title} ===`);

      let result;
      try {
        result = await draftOne(key, topic, styleGuide);
      } catch (err) {
        console.error(`  Failed: ${err.message}`);
        report.push({ room: key, title: topic.title, failed: true, notes: [err.message] });
        break; // likely a systematic problem (key, quota); skip rest of this room
      }
      if (result.failed) {
        topic.status = 'failed';
        report.push({ room: key, title: topic.title, failed: true, notes: result.notes });
        continue;
      }

      const { draft, review, rounds, open } = result;
      let slug = slugify(draft.title || topic.title);
      const existing = new Set((await fs.readdir(dir)).map((f) => f.replace(/\.json$/, '')));
      if (existing.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

      const item = { ...draft, createdAt: new Date().toISOString().slice(0, 10), room: key };
      await writeJson(path.join(dir, `${slug}.json`), item);
      topic.status = 'drafted';
      topic.slug = slug;
      report.push({
        room: key, title: draft.title, slug, rounds,
        summary: review.summary,
        unresolved: open,
        lowIssues: review.issues.filter((i) => i.severity === 'low'),
        verify: room.verifyNotes(item),
      });
    }
  }

  await writeJson(FILES.topics, topics);
  const lint = await writePages(TARGETS);
  await writePrBody(report, lint);
  console.log(`\nDone. PR notes written to ${FILES.prBody}`);

  const drafted = report.filter((r) => !r.failed).length;
  if (!drafted && report.some((r) => r.failed)) process.exit(1); // surface total failure in Actions
}

async function runPlan() {
  const styleGuide = await fs.readFile(FILES.style, 'utf8');
  let topics = await readJson(FILES.topics, []);
  for (const key of TARGETS) {
    const before = topics.length;
    topics = await plan(topics, key, COUNT, styleGuide);
    console.log(`${ROOMS[key].name}: added ${topics.length - before} topic(s).`);
  }
}

async function writePrBody(report, lint) {
  const lines = ['## Draft content (AI-generated, human review required)', ''];
  if (!report.length) lines.push('Nothing was drafted this run.', '');
  for (const key of ROOM_KEYS) {
    const mine = report.filter((r) => r.room === key);
    if (!mine.length) continue;
    lines.push(`## ${ROOMS[key].name}`, '');
    for (const r of mine) {
      lines.push(`### ${r.title}`);
      if (r.failed) { lines.push('**Could not be drafted:** ' + r.notes.join('; '), ''); continue; }
      const folder = ROOMS[key].folder;
      lines.push(`- Page: \`${folder}/${r.slug}.html\``);
      lines.push(`- Reviewer: ${r.summary || 'no summary'} (revision rounds: ${r.rounds})`);
      if (r.unresolved.length) {
        lines.push('- **Unresolved issues, please check before merging:**');
        for (const i of r.unresolved) lines.push(`  - [${i.severity}/${i.category}] ${i.problem}`);
      }
      if (r.verify.length) {
        lines.push('- **Please verify (facts an AI can get wrong):**');
        for (const v of r.verify) lines.push(`  - ${v}`);
      }
      if (r.lowIssues.length) {
        lines.push('- Minor suggestions:');
        for (const i of r.lowIssues) lines.push(`  - ${i.problem}`);
      }
      const errs = lint[`${folder}/${r.slug}`] || [];
      lines.push(errs.length ? `- **Accessibility lint failed:** ${errs.join('; ')}` : '- Accessibility lint: passed');
      lines.push('');
    }
  }
  lines.push('### Before merging');
  lines.push('- Read each page as a parent would. Is it safe, kind and accurate for the stated ages?');
  lines.push('- Check the Cloudflare preview link for this PR.');
  lines.push('- Optional media, picked up automatically by filename: `assets/videos/<slug>.mp4` with `<slug>.vtt` captions, and `assets/<folder>/<slug>.jpg`.');
  await fs.mkdir(path.dirname(FILES.prBody), { recursive: true });
  await fs.writeFile(FILES.prBody, lines.join('\n') + '\n');
}

try {
  if (cmd === 'plan') await runPlan();
  else if (cmd === 'write') await runWrite();
  else { console.error(`Unknown command: ${cmd} (use "plan" or "write")`); process.exit(1); }
} catch (err) {
  console.error(err);
  process.exit(1);
}
