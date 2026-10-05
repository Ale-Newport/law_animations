// LAW-0277 — Ordenación de cuestiones · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (Party A's hand on the push bar's grip while pushing:
// SOLVED hand position) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65. Windows (c → u): reach 0.06–0.22 → 0.189–0.293; push 0.22–0.48 → 0.293–0.462; glide
// 0.48–0.80 → 0.462–0.670; hand back 0.50–0.66 → 0.475–0.579; calendar mark 0.84–0.94 → 0.696–0.761; the subject frames
// come u 0.69–0.75; callout u 0.80–0.86.
// LEGAL: ● agreed issue and ◆ open issue are supplied states of equal weight ("agreed" only means the supplied list marks
// the issue as agreed between the parties; nothing is decided or proven); the cards are drawn alike; no arrows; no
// procedure, court power, binding effect, time limit or outcome.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, NO_LONE_LINES, peopleInsideRooms} from './ordenacion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks, esDefaults, glyphGlue} from './ordenacion-common.js';

const ID = 'LAW-0277';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['hand'],
  attach: [
    {from: 0, to: 1, a: 'grip', b: 'hand', tol: 1.5},
    {from: 0.3, to: 0.455, a: 'barGrip', b: 'hand', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.phase === 'rest' && s.travel === 0 && !s.slotted && s.glyph === 'open' && s.groupP === 0 && s.markP === 0", label: 'rest: the third card in the tray with its supplied state glyph (◆ open); no subject frame yet'},
    {at: 0.4, fn: "s.phase === 'push' && s.travel > 0 && s.barD === s.travel && s.groupP === 0 && s.overlap === 0", label: 'Party A pushes the card with the bar; the bar moves with the card'},
    {at: 0.6, fn: "s.travel > s.barD && s.groupP === 0 && s.overlap === 0", label: 'the card glides on past the tray’s end; the bar stays at the tray’s end'},
    {at: 1, fn: "s.slotted && s.column === 'open' && s.glyph === 'open' && s.groupP === 1 && s.markP === 1 && s.notes === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear && s.labelsOffFaces", label: 'hold: the card in the Subject B row, open column; one frame round each subject row; the day marked; the callout shown'},
    {at: 1, params: {finalState: 'agreed'}, fn: "s.slotted && s.column === 'agreed' && s.glyph === 'agreed' && s.groupP === 1", label: 'finalState agreed (as supplied): the card stops in the nearer (●) column; its glyph is ●'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && !s.slotted && s.groupP === 0 && s.notes === 0", label: 'actionProgress freezes the action part-way; no subject frame, no callout'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.slotted && s.column === 'open' && s.groupP === 1", label: 'labels hidden: the same transformation'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: "s.truncated.length === 0 && s.allReached && s.slotted && s.groupP === 1 && s.column === s.glyph", label: `${n}: nothing cut; the card in the column of its state`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.documents.issues, p.documents.subjects.a, p.documents.subjects.b, ...p.dates.window, p.stages.agreed, p.stages.open, p.objectLabels.calendar, p.objectLabels.trays, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const GL = glyphChecks('[data-node="st-hd0-glyph"], [data-node="st-hd1-glyph"], [data-node="st-f0-ga"], [data-node="st-f1-go"], [data-node="st-f2-ga"], [data-node="st-f2-go"]');
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
const EFFS = `const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };`;
// every card keeps its own label and the cards are drawn alike: each card whole, opaque and apart from every other card,
// all three of the same width
const LABELS_KEPT = `(() => { ${EFFS}
  const fs = [...svg.querySelectorAll('[data-node^="st-f"][data-node$="-g"]')];
  if (fs.length !== 3) return false;
  const rs = fs.map(f => f.getBoundingClientRect());
  const apart = rs.every((a, i) => rs.every((b, j) => i === j || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1 || Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1));
  const same = rs.every(b => Math.abs(b.width - rs[0].width) < 1);
  return apart && same && fs.every(f => eff(f) > 0.99 && f.getBoundingClientRect().width > 4);
})()`;
// the grouping reads with labels hidden: the subject frames drawn at the hold, every card inside the board, the third
// card in the lower row
const GROUPS_DRAWN = `(() => { ${EFFS}
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const mg = q('st-mg'); if (!mg || eff(mg) < 0.99) return false;
  const fs = [...svg.querySelectorAll('[data-node^="st-f"][data-node$="-g"]')].map(f => f.getBoundingClientRect());
  const bd = q('st-board').getBoundingClientRect();
  return fs.every(r => r.left >= bd.left - 2 && r.right <= bd.right + 2 && r.top >= bd.top - 2 && r.bottom <= bd.bottom + 2) && fs[2].top > fs[0].bottom;
})()`;
// the third card's glyph: at most one of ● / ◆ at every sampled u
const NEVER_BOTH = `(() => { ${EFFS}
  const v = n => { const e = svg.querySelector('[data-node="' + n + '"]'); return e ? eff(e) : 0; };
  return Math.min(v('st-f2-ga'), v('st-f2-go')) < 0.05 && Math.max(v('st-f2-ga'), v('st-f2-go')) > 0.95;
})()`;

// the grouping is the subject, not a thumbnail under the text block (review r1, civil-claim-10: stress 1:1 stage 0.28 H,
// Issue 3 card ~43 px): at the hold the room is >= 0.38 of the frame height and the third card >= 60 px wide (1080p)
const STAGE_NOT_THUMB = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  // (the frame's height on screen from the viewBox: the svg element may be letterboxed in its slot)
  const FH = vb.height * svg.getScreenCTM().d, st = svg.querySelector('[data-node="st"]').getBoundingClientRect();
  const c2 = svg.querySelector('[data-node="st-f2-g"]').getBoundingClientRect();
  return st.height / FH >= 0.38 && c2.width / K >= 60;
})()`;

ratioChecks(ID, 'stage share', [
  {at: [1], dom: STAGE_NOT_THUMB, label: 'RENDERED: at the hold the room is >= 0.38 H and the Issue 3 card >= 60 px wide (labels shown or hidden)'},
]);

ratioChecks(ID, 'faces, cards, frame, people, legal', [
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, note or text covers a head'},
  {at: [0, 0.4, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (civil-claim measures the rendered HEAD box: the story floor is 52 px in every preset and ratio)
  {at: [0.1, 0.5, 1], dom: headsAtLeast(52), label: 'people readable: head >= 52 px at 1080p (the civil-claim story floor), every preset and ratio'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box at rest and hold (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['note']), label: 'each callout marker sits beside its own element'},
  {at: times(0, 1, 0.05), dom: LABELS_KEPT, label: 'RENDERED: every card drawn whole, opaque, apart from every other and of the same width at every sampled u'},
  {at: [1], dom: GROUPS_DRAWN, label: 'RENDERED: at the hold the subject frames are drawn and every card is on the board, the third in the lower row (labels shown or hidden)'},
  {at: times(0, 1, 0.05), dom: NEVER_BOTH, label: 'RENDERED: the third card shows exactly one state glyph at every sampled u'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: GL.neutral, label: 'LEGAL: state glyphs are only ● / ◆ — no ticks, no green'},
  {at: [1], params: {finalState: 'agreed'}, dom: GL.neutral, label: 'LEGAL: finalState agreed — glyphs are only ● / ◆'},
  {at: [0.3, 1], dom: GL.equal, label: 'LEGAL: ● and ◆ have equal weight'},
  {at: [0, 1], dom: NO_ARROWS, label: 'no arrowhead markers'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.15, 0.8, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: times(0, 1, 0.1), dom: peopleInsideRooms(['st'], 3), label: 'RENDERED: both people, strokes included, stay >= 3 px inside the room’s walls'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});
esDefaults(ID, [0.45, 1]);

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.4, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person'},
]);
hiddenText(ID, [0, 0.4, 0.7, 1]);

ratioChecks(ID, 'no one-word lines', [
  {at: times(0, 1, 0.05), tv: ['all'], dom: NO_LONE_LINES, label: 'RENDERED: no wrapped title, chip, tag, plate, card or label has a one-word line (every 0.05; es-only too)'},
  {at: [0.3, 0.6, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: NO_LONE_LINES, label: 'RENDERED: es-only — no one-word line'},
]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});
glyphGlue(ID);

// the hold callout follows finalState: it names the column the card is grouped in (EN and ES)
const NOTE_TEXT = `[...svg.querySelectorAll('[data-node^="note"] text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')`;
ratioChecks(ID, 'hold callout follows finalState', [
  {at: [1], tv: ['all'], presets: ['default'], params: {finalState: 'open'}, dom: `(() => { const t = ${NOTE_TEXT}; return /Issue 3 is grouped under Subject B as an open issue \\(as supplied\\)/.test(t) && !/agreed/.test(t); })()`, label: 'finalState open (EN): the callout says "as an open issue"'},
  {at: [1], tv: ['all'], presets: ['default'], params: {finalState: 'agreed'}, dom: `(() => { const t = ${NOTE_TEXT}; return /Issue 3 is grouped under Subject B as an agreed issue \\(as supplied\\)/.test(t) && !/open/.test(t); })()`, label: 'finalState agreed (EN): the callout says "as an agreed issue" — never "open"'},
  {at: [1], tv: ['all'], presets: ['default'], params: {locale: 'es', finalState: 'open'}, dom: `(() => { const t = ${NOTE_TEXT}; return /como cuestión por resolver \\(aportada\\)/.test(t) && !/acordada/.test(t); })()`, label: 'finalState open (ES): "como cuestión por resolver"'},
  {at: [1], tv: ['all'], presets: ['default'], params: {locale: 'es', finalState: 'agreed'}, dom: `(() => { const t = ${NOTE_TEXT}; return /como cuestión acordada \\(aportada\\)/.test(t) && !/por resolver/.test(t); })()`, label: 'finalState agreed (ES): "como cuestión acordada" — never "por resolver"'},
  {at: [1], tv: ['all'], presets: ['baseline-es'], params: {finalState: 'agreed'}, dom: `(() => { const t = ${NOTE_TEXT}; return /cuestión acordada/.test(t) && !/por resolver/.test(t); })()`, label: 'baseline-es with finalState agreed: the callout follows the state'},
]);

// thin windows: the push lasts >= 600 ms, the glide >= 600 ms, the subject frames appear over >= 250 ms and only once
// the card is in its cell
test(`${ID}: thin windows measured — push, glide, subject frames`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const st of ['open', 'agreed']) {
    const rows = [];
    for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, params: {finalState: st}, timeMs: t}).semantic);
    expect(rows.filter(s => s.phase === 'push').length * 1000 / 60, `${st} push`).toBeGreaterThanOrEqual(600);
    expect(rows.filter(s => s.travel > 0 && !s.slotted && s.phase !== 'push').length * 1000 / 60, `${st} glide`).toBeGreaterThanOrEqual(600);
    expect(rows.filter(s => s.groupP > 0 && s.groupP < 1).length * 1000 / 60, `${st} frames`).toBeGreaterThanOrEqual(250);
    expect(rows.filter(s => s.groupP > 0 && !s.slotted)).toEqual([]);
    expect(rows.filter(s => s.aP > 0 && s.oP > 0)).toEqual([]);
  }
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; the card only moves rightwards; never both glyphs;
// nothing cut; heads at the floor
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let prev = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.overlap, tag).toBe(0);
      expect(s.travel >= prev - 1e-6, tag).toBe(true);
      expect(s.aP === 0 || s.oP === 0, tag).toBe(true);
      prev = s.travel;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
      expect(s.headPx, `${tag} head px`).toBeGreaterThanOrEqual(52);
    }
  }
});
