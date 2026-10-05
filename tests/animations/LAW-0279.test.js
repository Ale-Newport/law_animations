// LAW-0279 — Ordenación de cuestiones · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (the third card's supplied state: ●
// agreed in A — it stops in the nearer column — or ◆ open in B — it glides on into the farther column); no legal
// consequence is invented to complete the contrast.
// Windows (u): headers 0.17–0.24; the third card's glyph appears 0.24–0.32; changed-fact chip 0.28–0.36; action clock
// c = (u − 0.40) / 0.37 in both rooms (reach 0.06–0.22, push 0.22–0.48, glide 0.48–0.80, mark 0.84–0.94); subject
// frames 0.71–0.765 in both; guide markers and chip 0.775–0.83; neutral note 0.80–0.86.
// Floors: civil-claim measures the rendered HEAD box (SESSION_HANDOFF "PEOPLE-FLOOR MEASUREMENT CLARIFIED"): contrast
// >= 60 px off 1:1 and >= 55 px at 1:1 in the non-stress presets (as accepted LAW-0271/0275), >= 45 px under
// long-labels-stress in every ratio.
// Coordinator decision (standing rule 2026-09-26, AUTHORING item 20): the long-labels-stress preset caps its first two
// issue labels (74/75 → 52/53 characters, still longer than the baseline's 21) because at 1:1 the shared strip left the
// heads at 43.5 px (< 45) after the fallbacks; pre-cap copy production/scratch/civil-claim-10/LAW-0279.presets.precap.json.
// LEGAL: ● agreed and ◆ open are supplied states of equal weight; nothing is decided or proven; every card keeps its own
// label; no ticks, no green, no arrows; no procedure, court power, binding effect, time limit, ruling or outcome.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, NO_LONE_LINES, peopleInsideRooms} from './ordenacion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks, esDefaults, glyphGlue} from './ordenacion-common.js';
import {identicalBeforeChange} from '../harness/supplied-text.js';

const ID = 'LAW-0279';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
const GL = glyphChecks('[data-node$="-glyph"], [data-node$="-gl"], [data-node$="-mk"], [data-node$="-ga"], [data-node$="-go"], [data-node^="inset"][data-node*="-h"]');

contractSuite(ID, {
  continuity: ['handSB', 'handSA'],
  attach: [{from: 0, to: 1, a: 'gripSB', b: 'handSB', tol: 1.5}, {from: 0, to: 1, a: 'gripSA', b: 'handSA', tol: 1.5}],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.headers === 0 && s.configShown === 0 && s.changedShown === 0 && s.travelA === 0 && s.travelB === 0 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB)", label: 'base: two identical rooms at rest — the third card in its tray, no state glyph on it'},
    {at: 0.36, fn: "s.headers === 1 && s.configShown === 1 && s.changedShown > 0 && s.lookA.agreed === 1 && s.lookA.open === 0 && s.lookB.open === 1 && s.lookB.agreed === 0 && s.travelA === 0 && s.travelB === 0", label: 'change: headers; A the card shows ● (agreed), B ◆ (open); the changed fact named; nothing has moved'},
    {at: 0.53, fn: "s.phaseA === 'push' && s.travelB > 0 && s.travelA === s.travelB", label: 'parallel: both rooms push the card the same way while the paths coincide'},
    {at: 0.66, fn: "s.travelB > s.travelA && s.travelA > 0", label: 'parallel: in B the card glides on past the ● cell'},
    {at: 1, fn: "s.slottedA && s.slottedB && s.cellA === 'agreed' && s.cellB === 'open' && s.travelB > s.travelA && s.groupP === 1 && s.guide === 1 && s.note === 1 && s.allReached && s.markPB === 1 && s.markPA === 1", label: 'guide: A the card in the ● cell, B in the ◆ cell; both rows framed; the guide and the neutral note shown'},
    {at: 1, fn: 's.truncated.length === 0 && s.labelsClear && s.labelsOffFaces', label: 'layout: nothing cut; labels clear of each other, of the insets and of the people'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.cellA === 'agreed' && s.cellB === 'open' && s.lookA.agreed === 1 && s.lookB.open === 1 && s.insetProgress.every(v => v === 1)", label: 'labels hidden: the same contrast'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: "s.truncated.length === 0 && s.labelsClear && s.allReached && s.cellA === 'agreed' && s.cellB === 'open'", label: `${n}: nothing cut; labels clear; the hands reach`})),
  ],
});
identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.documents.issues, p.documents.subjects.a, p.documents.subjects.b, p.stages.agreed, p.stages.open, p.scenarioA.label, p.scenarioB.label, ...[p.scenarioA.caption, p.scenarioB.caption].filter(Boolean), p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean);",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// the two people of each room are drawn at the same scale
const PORTRAITS_EQUAL = `(() => ['sa', 'sb'].every(P => { const ks = ['pa', 'pb'].map(k => svg.querySelector('[data-node="' + P + '-' + k + '"]')).filter(Boolean).map(e => e.getScreenCTM().d); return ks.length === 2 && Math.max(...ks) / Math.min(...ks) < 1.001; }))()`;
const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]'))()`;
// the one difference reads at every size: each inset's card glyph is >= 24 px across at 1080p (A ●, B ◆) and its card
// lies in the cell under its own column glyph (A the ● cell, B the ◆ cell); no dashed mark
const INSETS_LEGIBLE = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('inset0-gl'), b = q('inset1-gl'), ca = q('inset0-c'), cb = q('inset1-c');
  if (!a || !b || !ca || !cb) return false;
  const big = e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) / K >= 24 && eff(e) > 0.9; };
  const under = (c, h) => { const r = c.getBoundingClientRect(), g = q(h).getBoundingClientRect(); const cx = (g.left + g.right) / 2; return cx > r.left && cx < r.right; };
  return big(a) && big(b) && a.querySelector('circle') && !b.querySelector('circle') && under(ca, 'inset0-h0') && under(cb, 'inset1-h1') && !under(ca, 'inset0-h1') && !under(cb, 'inset1-h0') && ![...svg.querySelectorAll('[data-node^="inset"] [stroke-dasharray]')].length;
})()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// the guide markers sit off every head and off every text they do not own
const MARKERS_CLEAR = `(() => {
  const R = e => e.getBoundingClientRect();
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const marks = [...svg.querySelectorAll('[data-node^="mark"]')].map(m => m.querySelector('circle')).filter(Boolean);
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"]')];
  const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-node^="mark"]') && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  return marks.length === 2 && marks.every(m => heads.every(h => !meet(R(m), R(h))) && texts.every(t => !meet(R(m), R(t))));
})()`;
// every card stays drawn and opaque in both scenes at every sampled u, apart from the others and of the same width
const CARDS_KEPT = `(() => ['sa', 'sb'].every(P => { const fs = [...svg.querySelectorAll('[data-node^="' + P + '-f"][data-node$="-g"]')]; if (fs.length !== 3) return false;
  const rs = fs.map(e => e.getBoundingClientRect());
  return fs.every(e => { let o = 1; for (let x = e; x && x.tagName !== 'svg'; x = x.parentElement) { const a = x.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o > 0.99 && e.getBoundingClientRect().width > 2; })
    && rs.every(b => Math.abs(b.width - rs[0].width) < 1)
    && rs.every((a, i) => rs.every((b, j) => i === j || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 0.5 || Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 0.5)); }))()`;
// exactly one fact differs at the hold: the third card's cell (A the nearer column, B the farther) and its glyph; the
// first two cards stand in the same places in both rooms (relative to each room's board)
const ONE_DIFFERENCE = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const rel = (P, n) => { const b = q(P + '-board').getBoundingClientRect(), r = q(P + '-' + n).getBoundingClientRect(); return [(r.left - b.left) / b.width, (r.top - b.top) / b.height]; };
  const same = n => { const a = rel('sa', n), b = rel('sb', n); return Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01; };
  const a2 = rel('sa', 'f2-g'), b2 = rel('sb', 'f2-g');
  return same('f0-g') && same('f1-g') && Math.abs(a2[1] - b2[1]) < 0.01 && b2[0] - a2[0] > 0.2;
})()`;

// the scenario header chips stand clear of both rooms and their props (review r2: a wrapped header ran into room A over
// its calendar and board): every header chip box keeps >= 8 px (1080p) from each room's drawn box (wall, people, board,
// calendar, tray), and both headers have the same font size and weight
const HEADERS_CLEAR = `(() => {
  const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const hs = ['hdr0-chip', 'hdr1-chip'].map(n => svg.querySelector('[data-node="' + n + '"]'));
  if (hs.some(h => !h)) return false;
  const rooms = ['sa', 'sb'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean).map(e => e.getBoundingClientRect());
  const gap = (a, b) => Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom);
  const clear = hs.every(h => rooms.every(rm => gap(h.getBoundingClientRect(), rm) / K >= 8));
  const st = hs.map(h => { const t = h.querySelector('text'); const cs = getComputedStyle(t); return cs.fontSize + '/' + cs.fontWeight; });
  return clear && st[0] === st[1];
})()`;

ratioChecks(ID, 'scenario headers clear of the rooms', [
  {at: [0.3, 1], tv: ['all'], dom: HEADERS_CLEAR, label: 'RENDERED: both scenario header chips keep >= 8 px from both rooms and their props, drawn alike'},
]);

ratioChecks(ID, 'two scenes, faces clear, in frame, figures readable, exactly one difference', [
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, header, strip item or text covers a head'},
  {at: [0.3, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // (people floors as in accepted LAW-0271/0275 — review r1: contrast 16:9 heads were 57.1 px: >= 60 off 1:1 in every
  // non-stress preset; at 1:1 >= 55 baseline / >= 45 stress; sampled every 0.1 from u = 0)
  {at: times(0, 1, 0.1), presets: BASE, ratios: ['16:9', '9:16'], dom: headsAtLeast(60), label: 'heads >= 60 px in both scenes off 1:1 (non-stress presets)'},
  {at: times(0, 1, 0.1), presets: BASE, ratios: ['1:1'], dom: headsAtLeast(55), label: 'heads >= 55 px in both scenes at 1:1 (non-stress presets)'},
  {at: times(0, 1, 0.1), presets: ['long-labels-stress'], dom: headsAtLeast(45), label: 'stress: heads >= 45 px in both scenes in every ratio'},
  {at: [1], dom: INSETS_LEGIBLE, label: 'RENDERED: the tray and the Subject B row drawn large in both insets — card glyphs >= 24 px across; A: ● card in the ● cell; B: ◆ card in the ◆ cell (labels shown or hidden)'},
  {at: [1], dom: ONE_DIFFERENCE, label: 'RENDERED: only the third card’s cell differs between the rooms (the first two cards stand alike)'},
  {at: times(0, 1, 0.1), dom: CARDS_KEPT, label: 'LEGAL: every card stays drawn, opaque, apart and of the same width in both scenes (each keeps its own label)'},
  {at: [0, 1], dom: fills(0.9, 0.55), label: 'the two scenes and the strip fill the caption-safe box (labels shown or hidden)'},
  {at: [0.85, 1], tv: ['all'], dom: MARKERS_CLEAR, label: 'RENDERED: the guide markers sit off every head and every text'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.5, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: GL.neutral, label: 'LEGAL: glyphs are only ● / ◆ — no ticks, no green'},
  {at: [1], dom: GL.equal, label: 'LEGAL: ● and ◆ have equal weight'},
  {at: [0, 1], dom: NO_ARROWS, label: 'no arrowhead markers'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.4, 0.8, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head'},
  {at: [0.1, 1], dom: PORTRAITS_EQUAL, label: 'LEGAL: the two people of each room have the same size'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

esDefaults(ID, [0.5, 1], '|only|differ|state|tray|place|Only|state');

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.6, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person'},
]);
hiddenText(ID, [0, 0.3, 0.6, 1]);

ratioChecks(ID, 'no one-word lines', [
  {at: times(0, 1, 0.05), tv: ['all'], dom: NO_LONE_LINES, label: 'RENDERED: no wrapped title, chip, tag, plate, card or label has a one-word line (every 0.05; es-only too)'},
  {at: [0.3, 0.6, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: NO_LONE_LINES, label: 'RENDERED: es-only — no one-word line'},
]);
// the changed fact reads in each room: the third card (its height) and the Subject B row's two cells it moves between
// (their width) span >= 85 px at 1080p at the hold in the baseline presets at 1:1 — about 85 px elsewhere (>= 82) — and
// >= 60 px under long-labels-stress
const changeLarge = min => `(() => { const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  return ['sa', 'sb'].every(P => { const c = svg.querySelector('[data-node="' + P + '-f2-g"]'); const f0 = svg.querySelector('[data-node="' + P + '-f0-g"]'), f1 = svg.querySelector('[data-node="' + P + '-f1-g"]'); if (!c || !f0 || !f1) return false;
    const b = c.getBoundingClientRect(), a0 = f0.getBoundingClientRect(), a1 = f1.getBoundingClientRect(); return b.height / K >= ${min} && (a1.right - a0.left) / K >= ${min}; }); })()`;
ratioChecks(ID, 'changed fact large in each room', [
  {at: [1], presets: ['default', 'baseline-illustrative'], ratios: ['1:1'], dom: changeLarge(85), label: 'RENDERED: 1:1 baseline — the third card is >= 85 px tall and the two cells it moves between >= 85 px wide (1080p)'},
  {at: [1], presets: BASE, dom: changeLarge(80), label: 'RENDERED: baseline presets, every ratio — the changed card and its row >= 80 px'},
  {at: [1], presets: ['long-labels-stress'], dom: changeLarge(60), label: 'RENDERED: stress — the changed card and its row >= 60 px'},
]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});
glyphGlue(ID);
ratioChecks(ID, 'people inside their rooms', [
  {at: times(0, 1, 0.05), dom: peopleInsideRooms(['sa', 'sb'], 3), label: 'RENDERED: every person, strokes included, stays >= 3 px inside its room’s walls (every 0.05; labels shown or hidden)'},
]);

// thin windows: the push lasts >= 600 ms in each room, B's glide >= 600 ms and the appearance of the state >= 400 ms
test(`${ID}: thin windows measured — state, push and glide`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  const rows = [];
  for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, timeMs: t}).semantic);
  expect(rows.filter(s => s.configShown > 0 && s.configShown < 1).length * 1000 / 60).toBeGreaterThanOrEqual(400);
  expect(rows.filter(s => s.phaseB === 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.phaseA === 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.travelB > 0 && !s.slottedB && s.phaseB !== 'push').length * 1000 / 60).toBeGreaterThanOrEqual(600);
  expect(rows.filter(s => s.groupP > 0 && !(s.slottedA && s.slottedB))).toEqual([]);
});

// DOM-less sweep: every preset × ratio × labels at every 0.05 of u; travel never decreases; each room shows only its
// own state; identical before the change beat
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    let pa = -1, pb = -1;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.lookA.open === 0 && s.lookB.agreed === 0, tag).toBe(true);
      if (u < 0.17) expect(JSON.stringify(s.lookA), tag).toBe(JSON.stringify(s.lookB));
      expect(s.travelA >= pa - 1e-6 && s.travelB >= pb - 1e-6, tag).toBe(true);
      pa = s.travelA; pb = s.travelB;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces, tag).toBe(true);
    }
  }
});
