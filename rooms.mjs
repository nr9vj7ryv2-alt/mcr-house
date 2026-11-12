// One definition per room: what the writer must produce (schema), how it is validated,
// how the page is laid out, and which things a human must double-check.
// To add a seventh room, add an entry here plus a brief in content/briefs/<key>.md.

import { esc } from './lib.mjs';

// ---------- small helpers ----------
const str = (v) => typeof v === 'string' && v.trim().length > 0;
const strs = (v, min = 0) => Array.isArray(v) && v.length >= min && v.every(str);
const objs = (v, min, keys) =>
  Array.isArray(v) && v.length >= min && v.every((o) => o && typeof o === 'object' && keys.every((k) => str(o[k])));
const num = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
const rangeOk = (r, lo, hi) => r && num(r.min, lo, hi) && num(r.max, lo, hi) && r.min <= r.max;

const ageLabel = (r) => (r.max >= 18 ? `Ages ${r.min}+` : r.min === r.max ? `Age ${r.min}` : `Ages ${r.min}\u2013${r.max}`);
const countLabel = (r, noun) => (r.min === r.max ? `${r.min} ${noun}` : `${r.min}\u2013${r.max} ${noun}`);

const ul = (arr, cls) =>
  arr && arr.length ? `<ul${cls ? ` class="${cls}"` : ''}>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
const section = (id, title, inner) =>
  inner ? `<section aria-labelledby="${id}-h"><h2 id="${id}-h">${esc(title)}</h2>${inner}</section>` : '';
const paras = (arr) => (arr || []).map((p) => `<p>${esc(p)}</p>`).join('');
const stepList = (arr) =>
  `<ol class="steps">${arr.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`;
const materialList = (arr, emptyText) =>
  arr.length
    ? `<ul class="materials">${arr
        .map((m, i) => `<li><input type="checkbox" id="mat-${i + 1}"> <label for="mat-${i + 1}">${esc(m.item)}${m.optional ? ' (optional)' : ''}</label></li>`)
        .join('')}</ul>`
    : `<p>${esc(emptyText)}</p>`;
const safety = (a) =>
  (a.safetyNotes && a.safetyNotes.length) || a.adultHelp
    ? `<aside class="safety-note" aria-labelledby="safety-h"><h2 id="safety-h">Safety first</h2>${
        a.adultHelp ? `<p><strong>Adult help needed:</strong> ${esc(a.adultHelp)}</p>` : ''
      }${ul(a.safetyNotes)}</aside>`
    : '';

// Validator factory: shared checks plus room-specific checks.
const validator = (fn) => (a) => {
  const errs = [];
  const bad = (problem) => errs.push({ severity: 'high', category: 'format', problem, fix: 'Return the field in the required shape.' });
  if (!str(a.title)) bad('title is missing');
  if (!str(a.summary) || a.summary.length > 240) bad('summary is missing or longer than 240 characters');
  if (!str(a.heroAlt)) bad('heroAlt (image description) is missing');
  fn(a, bad);
  return errs;
};

// Deterministic checks that flag text for a human to verify (cost no tokens).
const CLAIM_RE = /\d+\s?%|\b(studies show|research (shows|suggests|finds)|experts? (say|agree)|according to)\b/i;
const QUOTE_RE = /\b(once said|famously said|wrote that|as .{1,30} said)\b/i;
const allText = (a) => JSON.stringify(a);

// ---------- rooms ----------
export const ROOMS = {
  creative: {
    name: 'Creative Room',
    tagline: 'Art & Crafts',
    page: 'creative-room.html',
    folder: 'activities',
    contentDir: 'content/activities',
    listLabel: 'Activities',
    indexTitle: 'Creative Room activities',
    indexLede: 'Short, guided art and craft projects for families, each with a materials list and clear steps.',
    plannerHint: 'Cheap household or craft-store materials, varied techniques, seasons and age bands.',
    schema: `{
  "title": "3-8 words",
  "summary": "one or two friendly sentences, max 200 characters",
  "ageRange": { "min": number, "max": number },
  "minutes": number,
  "difficulty": "easy" | "medium",
  "adultHelp": "which steps need an adult and why, or an empty string",
  "safetyNotes": ["short sentence"],
  "materials": [{ "item": "name with quantity", "optional": false }],
  "steps": [{ "title": "2-5 words", "text": "1-3 short sentences" }],
  "tips": ["short sentence"],
  "learningConnections": ["skill children practice, e.g. fine motor control"],
  "heroAlt": "describe the finished craft for someone who cannot see it",
  "videoNarration": ["one short spoken sentence per step, in order"],
  "shotList": ["short filming note per step"]
}`,
    reviewFocus: 'Craft activity: check choking hazards for under-3s, sharp tools, hot glue, toxic or allergenic materials, and that every material used in the steps is listed.',
    validate: validator((a, bad) => {
      if (!rangeOk(a.ageRange, 0, 99)) bad('ageRange must be {min,max} numbers');
      if (!num(a.minutes, 1, 180)) bad('minutes must be a number from 1 to 180');
      if (!objs(a.materials, 1, ['item'])) bad('materials must be a non-empty list of {item}');
      if (!objs(a.steps, 3, ['title', 'text'])) bad('steps must be at least 3 items of {title,text}');
      if (!Array.isArray(a.safetyNotes)) bad('safetyNotes must be a list');
      if (!Array.isArray(a.videoNarration)) bad('videoNarration must be a list');
    }),
    meta: (a) => [ageLabel(a.ageRange), `${a.minutes} minutes`, a.difficulty || 'easy'],
    body: (a, ctx) =>
      safety(a) +
      section('materials', 'What you\u2019ll need', materialList(a.materials, '')) +
      ctx.video +
      section('steps', 'Steps', stepList(a.steps)) +
      section('tips', 'Tips', ul(a.tips)) +
      section('learn', 'What children practice', ul(a.learningConnections)),
    verifyNotes: () => [],
  },

  learning: {
    name: 'Learning Room',
    tagline: 'Books & Activities',
    page: 'learning-room.html',
    folder: 'learning',
    contentDir: 'content/learning',
    listLabel: 'Learning activities',
    indexTitle: 'Learning Room activities',
    indexLede: 'Hands-on activities and book ideas that make reading, math, science and curiosity part of everyday life.',
    plannerHint: 'Reading, early math, science, language and social-emotional skills; everyday materials; pairs well with picture books.',
    schema: `{
  "title": "3-8 words",
  "summary": "one or two friendly sentences, max 200 characters",
  "ageRange": { "min": number, "max": number },
  "minutes": number,
  "subject": "reading | math | science | language | social-emotional | art | other",
  "learningGoals": ["what children practice, in plain words"],
  "adultHelp": "which steps need an adult, or an empty string",
  "safetyNotes": ["short sentence"],
  "materials": [{ "item": "name with quantity", "optional": false }],
  "steps": [{ "title": "2-5 words", "text": "1-3 short sentences" }],
  "discussionQuestions": ["open-ended question a parent can ask"],
  "makeItEasier": ["short sentence"],
  "makeItHarder": ["short sentence"],
  "bookPairings": [{ "title": "exact title", "author": "exact author" }],
  "heroAlt": "describe the activity set-up for someone who cannot see it",
  "videoNarration": ["one short spoken sentence per step, in order"]
}
bookPairings: ONLY well-known children's books you are certain exist, with the correct author. Use an empty list if unsure. Never quote or summarize book text.`,
    reviewFocus: 'Learning activity: flag any book title or author that may not exist or may be misattributed (high). Flag guaranteed-outcome claims, copied worksheet or curriculum content, difficulty that does not fit the ages, and reliance on sight or hearing alone with no alternative.',
    validate: validator((a, bad) => {
      if (!rangeOk(a.ageRange, 0, 99)) bad('ageRange must be {min,max} numbers');
      if (!num(a.minutes, 1, 180)) bad('minutes must be a number from 1 to 180');
      if (!str(a.subject)) bad('subject is missing');
      if (!strs(a.learningGoals, 1)) bad('learningGoals must be a non-empty list of strings');
      if (!Array.isArray(a.materials) || !a.materials.every((m) => str(m.item))) bad('materials must be a list of {item}');
      if (!objs(a.steps, 3, ['title', 'text'])) bad('steps must be at least 3 items of {title,text}');
      if (!strs(a.discussionQuestions, 1)) bad('discussionQuestions must be a non-empty list of strings');
      if (!Array.isArray(a.bookPairings) || !a.bookPairings.every((b) => str(b.title) && str(b.author))) bad('bookPairings must be a list of {title,author}');
      if (!Array.isArray(a.videoNarration)) bad('videoNarration must be a list');
    }),
    meta: (a) => [ageLabel(a.ageRange), `${a.minutes} minutes`, a.subject],
    body: (a, ctx) =>
      section('goals', 'What children practice', ul(a.learningGoals)) +
      safety(a) +
      section('materials', 'What you\u2019ll need', materialList(a.materials, 'No special materials needed.')) +
      ctx.video +
      section('steps', 'How to do it', stepList(a.steps)) +
      section('talk', 'Talk about it', ul(a.discussionQuestions)) +
      section('easier', 'Make it easier', ul(a.makeItEasier)) +
      section('harder', 'Make it a bit harder', ul(a.makeItHarder)) +
      section(
        'books',
        'Books to pair with this',
        a.bookPairings.length
          ? `<ul>${a.bookPairings.map((b) => `<li><cite>${esc(b.title)}</cite> by ${esc(b.author)}</li>`).join('')}</ul>`
          : '',
      ),
    verifyNotes: (a) => a.bookPairings.map((b) => `Confirm this book exists and the author is right: "${b.title}" by ${b.author}`),
  },

  play: {
    name: 'Play Room',
    tagline: 'Games & Fun',
    page: 'play-room.html',
    folder: 'play',
    contentDir: 'content/play',
    listLabel: 'Games',
    indexTitle: 'Play Room games',
    indexLede: 'Simple games and playful ideas for home, backyard or classroom, with clear rules and ways to include everyone.',
    plannerHint: 'Indoor and outdoor games needing few or no materials; calm and active options; cooperative games; works for mixed abilities.',
    schema: `{
  "title": "3-8 words",
  "summary": "one or two friendly sentences, max 200 characters",
  "ageRange": { "min": number, "max": number },
  "minutes": number,
  "players": { "min": number, "max": number },
  "setting": "indoors" | "outdoors" | "either",
  "energy": "calm" | "medium" | "active",
  "adultHelp": "what an adult should supervise, or an empty string",
  "safetyNotes": ["short sentence"],
  "materials": [{ "item": "name with quantity", "optional": false }],
  "setup": ["short setup instruction"],
  "steps": [{ "title": "2-5 words", "text": "1-3 short sentences, the rules of play" }],
  "ending": "how the game ends; prefer cooperative or everyone-wins endings",
  "variations": ["short sentence"],
  "accessibilityTips": ["how to include children with different abilities, e.g. seated play, low vision, hearing differences"],
  "heroAlt": "describe children playing the game for someone who cannot see it, without describing specific people",
  "videoNarration": ["one short spoken sentence per step, in order"]
}
materials may be an empty list if the game needs nothing.`,
    reviewFocus: 'Game: flag injury risks (running with objects, collisions indoors, water, heights, climbing), unclear rules or no way to end, games that eliminate children early or reward only the fastest or strongest, and missing adaptations for different abilities.',
    validate: validator((a, bad) => {
      if (!rangeOk(a.ageRange, 0, 99)) bad('ageRange must be {min,max} numbers');
      if (!num(a.minutes, 1, 180)) bad('minutes must be a number from 1 to 180');
      if (!rangeOk(a.players, 1, 100)) bad('players must be {min,max} numbers');
      if (!['indoors', 'outdoors', 'either'].includes(a.setting)) bad('setting must be indoors, outdoors or either');
      if (!['calm', 'medium', 'active'].includes(a.energy)) bad('energy must be calm, medium or active');
      if (!Array.isArray(a.materials) || !a.materials.every((m) => str(m.item))) bad('materials must be a list of {item}');
      if (!Array.isArray(a.setup)) bad('setup must be a list');
      if (!objs(a.steps, 3, ['title', 'text'])) bad('steps must be at least 3 items of {title,text}');
      if (!str(a.ending)) bad('ending is missing');
      if (!Array.isArray(a.safetyNotes)) bad('safetyNotes must be a list');
      if (!strs(a.accessibilityTips, 1)) bad('accessibilityTips must be a non-empty list of strings');
      if (!Array.isArray(a.videoNarration)) bad('videoNarration must be a list');
    }),
    meta: (a) => [ageLabel(a.ageRange), countLabel(a.players, 'players'), a.setting, `${a.energy} energy`],
    body: (a, ctx) =>
      safety(a) +
      section('materials', 'What you need', materialList(a.materials, 'No materials needed.')) +
      section('setup', 'Set up', a.setup.length ? `<ol>${a.setup.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '') +
      ctx.video +
      section('play', 'How to play', stepList(a.steps)) +
      section('ending', 'How it ends', `<p>${esc(a.ending)}</p>`) +
      section('variations', 'Try a variation', ul(a.variations)) +
      section('inclusive', 'Play together, your way', ul(a.accessibilityTips)),
    verifyNotes: () => [],
  },

  parent: {
    name: 'Parent Room',
    tagline: 'Tips & Support',
    page: 'parent-room.html',
    folder: 'parent',
    contentDir: 'content/parent',
    listLabel: 'Articles',
    indexTitle: 'Parent Room articles',
    indexLede: 'Gentle, practical tips and encouragement for the everyday moments of raising and teaching children.',
    plannerHint: 'Everyday routines, big feelings, transitions, screen time balance, learning at home, parent self-care. Practical and non-judgmental. No medical topics.',
    schema: `{
  "title": "4-10 words",
  "summary": "one or two warm sentences, max 200 characters",
  "readMinutes": number,
  "audience": "who this is for, e.g. parents of toddlers",
  "intro": ["1 to 2 short paragraphs"],
  "keyTakeaways": ["3 to 5 short sentences"],
  "sections": [{ "heading": "short heading", "paragraphs": ["short paragraph"], "bullets": ["optional short bullet"] }],
  "tryThisToday": ["2 to 4 small, doable actions"],
  "whenToGetHelp": "a gentle sentence about when to talk with a pediatrician, teacher or counselor, or an empty string if not relevant",
  "heroAlt": "describe a calm illustration or photo that fits the article"
}
sections: 3 to 5 sections. No statistics, studies, or "experts say" claims. No diagnoses or medical advice.`,
    reviewFocus: 'Parent support article: flag medical, developmental or psychological claims or diagnoses (high); statistics, studies or "experts say" with no source (medium); shaming, fear-based or guilt language (medium); one-size-fits-all advice that ignores different family situations, cultures, budgets or children\'s abilities; anything unsafe; and a missing suggestion to seek professional help where it clearly applies.',
    validate: validator((a, bad) => {
      if (!num(a.readMinutes, 1, 30)) bad('readMinutes must be a number from 1 to 30');
      if (!str(a.audience)) bad('audience is missing');
      if (!strs(a.intro, 1)) bad('intro must be a non-empty list of paragraphs');
      if (!strs(a.keyTakeaways, 3)) bad('keyTakeaways must be at least 3 strings');
      if (!Array.isArray(a.sections) || a.sections.length < 3 || !a.sections.every((s) => str(s.heading) && strs(s.paragraphs, 1))) bad('sections must be at least 3 items of {heading, paragraphs[]}');
      if (!strs(a.tryThisToday, 2)) bad('tryThisToday must be at least 2 strings');
      if (typeof a.whenToGetHelp !== 'string') bad('whenToGetHelp must be a string (may be empty)');
    }),
    meta: (a) => [`${a.readMinutes} min read`, a.audience],
    body: (a) =>
      paras(a.intro) +
      section('takeaways', 'Key takeaways', ul(a.keyTakeaways)) +
      a.sections
        .map((s, i) => section(`s${i + 1}`, s.heading, paras(s.paragraphs) + ul(s.bullets)))
        .join('') +
      section('try', 'Try this today', ul(a.tryThisToday)) +
      section('help', 'When to ask for extra support', a.whenToGetHelp ? `<p>${esc(a.whenToGetHelp)}</p>` : '') +
      '<p class="disclaimer"><small>This page shares general ideas and encouragement. It is not medical, legal or professional advice.</small></p>',
    verifyNotes: (a) => (CLAIM_RE.test(allText(a)) ? ['Contains a statistic or research-style claim. Verify it or remove it.'] : []),
  },

  family: {
    name: 'Family Room',
    tagline: 'Together Time',
    page: 'family-room.html',
    folder: 'family',
    contentDir: 'content/family',
    listLabel: 'Family activities',
    indexTitle: 'Family Room activities',
    indexLede: 'Ideas for spending time together, from quick everyday rituals to cozy weekend projects.',
    plannerHint: 'Low-cost activities that work for mixed ages, different family sizes and structures, small spaces, and busy schedules; rituals, cooking-free ideas, conversation, memory-making.',
    schema: `{
  "title": "3-8 words",
  "summary": "one or two friendly sentences, max 200 characters",
  "ageRange": { "min": number, "max": number },
  "minutes": number,
  "participants": { "min": number, "max": number },
  "setting": "indoors" | "outdoors" | "either",
  "adultHelp": "what adults should supervise, or an empty string",
  "safetyNotes": ["short sentence"],
  "materials": [{ "item": "name with quantity", "optional": false }],
  "setup": ["short setup instruction"],
  "steps": [{ "title": "2-5 words", "text": "1-3 short sentences" }],
  "conversationStarters": ["open-ended question for the whole family"],
  "keepsakeIdea": "one sentence about a simple way to remember the time together, or an empty string",
  "makeItInclusive": ["how to adapt for different ages, abilities, family sizes or budgets"],
  "heroAlt": "describe the scene for someone who cannot see it, without describing specific people",
  "videoNarration": ["one short spoken sentence per step, in order"]
}
ageRange covers everyone who can join, e.g. {"min": 3, "max": 99} for all ages.`,
    reviewFocus: 'Family activity: flag assumptions about family structure, gender roles, holidays, religion or budget; activities that need everyone to participate in the same physical way; privacy risks such as posting children\'s photos online; and cost that is not low.',
    validate: validator((a, bad) => {
      if (!rangeOk(a.ageRange, 0, 99)) bad('ageRange must be {min,max} numbers');
      if (!num(a.minutes, 1, 240)) bad('minutes must be a number from 1 to 240');
      if (!rangeOk(a.participants, 1, 30)) bad('participants must be {min,max} numbers');
      if (!['indoors', 'outdoors', 'either'].includes(a.setting)) bad('setting must be indoors, outdoors or either');
      if (!Array.isArray(a.materials) || !a.materials.every((m) => str(m.item))) bad('materials must be a list of {item}');
      if (!Array.isArray(a.setup)) bad('setup must be a list');
      if (!objs(a.steps, 3, ['title', 'text'])) bad('steps must be at least 3 items of {title,text}');
      if (!strs(a.conversationStarters, 2)) bad('conversationStarters must be at least 2 strings');
      if (typeof a.keepsakeIdea !== 'string') bad('keepsakeIdea must be a string (may be empty)');
      if (!strs(a.makeItInclusive, 1)) bad('makeItInclusive must be a non-empty list of strings');
      if (!Array.isArray(a.safetyNotes)) bad('safetyNotes must be a list');
      if (!Array.isArray(a.videoNarration)) bad('videoNarration must be a list');
    }),
    meta: (a) => [ageLabel(a.ageRange), `${a.minutes} minutes`, countLabel(a.participants, 'people')],
    body: (a, ctx) =>
      safety(a) +
      section('materials', 'What you need', materialList(a.materials, 'No materials needed.')) +
      section('setup', 'Set up', a.setup.length ? `<ol>${a.setup.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : '') +
      ctx.video +
      section('steps', 'Steps', stepList(a.steps)) +
      section('talk', 'Conversation starters', ul(a.conversationStarters)) +
      section('keepsake', 'Remember the moment', a.keepsakeIdea ? `<p>${esc(a.keepsakeIdea)}</p>` : '') +
      section('inclusive', 'Make it work for your family', ul(a.makeItInclusive)),
    verifyNotes: () => [],
  },

  kindness: {
    name: 'Kindness Corner',
    tagline: 'Quotes & Ideas',
    page: 'kindness-corner.html',
    folder: 'kindness',
    contentDir: 'content/kindness',
    listLabel: 'Kindness ideas',
    indexTitle: 'Kindness Corner ideas',
    indexLede: 'Short, original messages and small acts of kindness to share, print and try together.',
    plannerHint: 'Themes like gratitude, helping, including others, patience, listening, saying sorry, courage. Original wording only.',
    schema: `{
  "title": "3-8 words",
  "summary": "one or two warm sentences, max 200 characters",
  "intro": "one short paragraph",
  "messages": [{ "text": "an ORIGINAL kind message of one short sentence", "tryIt": "a tiny kind action a child can do today" }],
  "weekChallenge": [{ "day": "Day 1", "action": "one simple kind act" }],
  "reflectionQuestions": ["open-ended question for talking together"],
  "heroAlt": "describe a calm illustration that fits the theme"
}
messages: 6 to 10 items. weekChallenge: exactly 7 items. Every message must be your own wording. Do NOT quote or attribute anything to real people, books, songs or films.`,
    reviewFocus: 'Kindness ideas: flag any quote attributed to a real person (high), any text that closely resembles a famous quote, proverb, song lyric or book line (medium), messages that guilt, compare or exclude children, and "tryIt" or challenge actions that are unsafe (for example approaching strangers) or require spending money.',
    validate: validator((a, bad) => {
      if (!str(a.intro)) bad('intro is missing');
      if (!objs(a.messages, 6, ['text', 'tryIt']) || a.messages.length > 10) bad('messages must be 6 to 10 items of {text, tryIt}');
      if (!objs(a.weekChallenge, 7, ['day', 'action']) || a.weekChallenge.length !== 7) bad('weekChallenge must be exactly 7 items of {day, action}');
      if (!strs(a.reflectionQuestions, 2)) bad('reflectionQuestions must be at least 2 strings');
    }),
    meta: (a) => [`${a.messages.length} kind messages`, 'Printable'],
    body: (a) =>
      `<p>${esc(a.intro)}</p>` +
      section(
        'messages',
        'Kind messages to share',
        `<ul class="kindness-cards">${a.messages
          .map((m) => `<li><p class="kindness-message">${esc(m.text)}</p><p class="kindness-try"><strong>Try it:</strong> ${esc(m.tryIt)}</p></li>`)
          .join('')}</ul>`,
      ) +
      section('week', 'A week of kindness', `<ol class="kindness-week">${a.weekChallenge.map((d) => `<li><strong>${esc(d.day)}:</strong> ${esc(d.action)}</li>`).join('')}</ol>`) +
      section('reflect', 'Talk about it', ul(a.reflectionQuestions)),
    verifyNotes: (a) => (QUOTE_RE.test(allText(a)) ? ['Mentions someone saying or writing something. Confirm it is not an invented attribution.'] : []),
  },
};

export const ROOM_KEYS = Object.keys(ROOMS);
