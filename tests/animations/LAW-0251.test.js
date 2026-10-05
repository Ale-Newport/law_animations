// LAW-0251 — Presentación de demanda · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (whether the signed filing is handed
// in to the registry) and no legal consequence is invented (B just keeps the filing: blank reference box, no mark, no
// alarm, no outcome). A and B carry equal-weight solid badges (● circle, ◆ diamond).
// Clock c = (u − 0.17) / 0.6 in both scenes: pen held c 0.07–0.37 → u 0.212–0.392; A's push c 0.42–0.47 →
// u 0.422–0.452; A's clerk holds the stamp c 0.68–0.93 → u 0.578–0.728; A's reference appears c 0.80–0.82 → u 0.65–0.662.
// The scenes differ from c 0.37 (u 0.392: in A the hand goes to the sled, in B back to rest).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, tagsOffProps, TEXT_LINES_VISIBLE} from './presentacion-demanda-checks.js';

const ID = 'LAW-0251';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['handA_A', 'handB_A', 'handA_B', 'handB_B', 'penA', 'penB', 'letterA', 'letterB', 'stampA'],
  attach: [
    {from: 0.214, to: 0.39, a: 'penGripA', b: 'handA_A', tol: 1.5},
    {from: 0.214, to: 0.39, a: 'penGripB', b: 'handA_B', tol: 1.5},
    {from: 0.423, to: 0.451, a: 'letterGripA', b: 'handA_A', tol: 1.5},
    {from: 0.58, to: 0.727, a: 'stampGripA', b: 'handB_A', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: 's.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0 && s.changedShown === 0', label: 'base: two identical complete scenes; no scenario label or changed fact yet'},
    {at: 0.3, fn: "s.headers === 1 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.docAt === 'A'", label: 'change beat: headers and the changed fact appear; both parties sign identically'},
    {at: 0.5, fn: "s.a.docAt === 'route' && s.b.docAt === 'A' && s.a.refShown === 0 && s.b.refShown === 0", label: 'parallel: A’s filing slides to the registry; B’s stays with Party A; no reference yet'},
    {at: 0.62, fn: "s.a.stampAt === 'carried' && s.b.stampAt === 'pad' && s.a.refShown === 0", label: 'only the handing-in differs: A’s clerk carries the stamp; B’s clerk does not move'},
    {at: 0.7, fn: 's.a.refShown === 1 && s.b.refShown === 0', label: 'A’s reference appears after the press; B’s box stays blank'},
    {at: 1, fn: "s.a.docAt === 'registry' && s.a.refShown === 1 && s.a.markP === 1 && s.b.docAt === 'A' && s.b.refShown === 0 && s.b.markP === 0 && s.b.stampAt === 'pad' && s.calOpen === 1", label: 'hold: A registered with the reference on the supplied day; B a draft kept by Party A (neutral)'},
    {at: 1, fn: 's.guide === 1 && s.neutralShown === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear', label: 'guide drawn, neutral note shown, nothing cut, labels clear'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.a.docAt === 'registry' && s.a.refShown === 1 && s.b.docAt === 'A' && s.b.refShown === 0", label: 'labels hidden: the same difference is visible'},
    {at: 1, fn: "s.arrangement === 'row'", label: '16:9: the scenes stand side by side (their rendered share of the frame is checked per ratio below)'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached', label: `${n}: nothing cut, every hand reaches`})),
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "const w = p.dates.window; const day = w[Math.max(0, Math.min(w.length - 1, p.dates.entryDay))]; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.title, p.documents.filing.dated, p.documents.reference, ...w, p.stages.registered + ' · ' + day, p.stages.draft, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const EQUAL_HEADERS = "['lab', 'cap'].every(k => { const a = svg.querySelector('[data-node=\"hA-' + k + '\"]'), b = svg.querySelector('[data-node=\"hB-' + k + '\"]'); if (!a && !b) return true; if (!a || !b) return false; return a.querySelectorAll('tspan').length === b.querySelectorAll('tspan').length && Math.abs(parseFloat(a.getAttribute('font-size')) - parseFloat(b.getAttribute('font-size'))) < 0.01; })";
// equal-weight solid cues: A's badge a filled circle (●), B's a filled diamond (◆); both solid, same stroke; their drawn
// areas within 20 % of each other
const BADGES = `(() => {
  const a = svg.querySelector('[data-node="hdrA"] > circle'), b = svg.querySelector('[data-node="hdrB"] > path');
  if (!a || !b) return false;
  const solid = e => e.getAttribute('fill') && e.getAttribute('fill') !== 'none' && !/^#(d1495b|ff0000|e53935|c62828)$/i.test(e.getAttribute('fill'));
  const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  const area = (ra.width * ra.height * Math.PI / 4) / (rb.width * rb.height / 2);
  return solid(a) && solid(b) && a.getAttribute('stroke-width') === b.getAttribute('stroke-width') && area > 0.8 && area < 1.25;
})()`;
// rendered: each scene's drawn width over the rendered frame's width, by arrangement
const SCENE_SHARE = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const F = {left: p0.x, right: p1.x, top: p0.y, bottom: p1.y, width: p1.x - p0.x, height: p1.y - p0.y};
  const sc = ['sa', 'sb'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean);
  if (sc.length !== 2) return false;
  const bs = sc.map(e => e.getBoundingClientRect());
  const row = Math.abs(bs[0].top - bs[1].top) < 2;
  const full = !row && bs.every(b => b.left - F.left < F.width * 0.12 && F.right - b.right < F.width * 0.12);
  const min = row ? 0.40 : full ? 0.82 : 0.55;
  return bs.every(b => b.width / F.width >= min);
})()`;
const TAGS_OFF_PROPS = tagsOffProps(['sa', 'sb'].flatMap(q => ['letter', 'stamp', 'pen', 'tray-back', 'tray-front', 'dplate'].map(n => `${q}-${n}`)));
ratioChecks(ID, 'scenes large and equal, faces clear, cards own their text, in frame', [
  {at: [0, 1], dom: SCENE_SHARE, label: 'RENDERED share of the frame width at rest and hold: each scene >= 0.40 side by side, >= 0.55 stacked beside the text column, >= 0.82 stacked full width (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: EQUAL_HEADERS, label: 'A and B headers: same line counts and sizes (equal weight)'},
  {at: [0.3, 1], dom: BADGES, label: 'equal-weight solid cues: ● A and ◆ B'},
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, strip item, header or tag covers a head'},
  {at: [0, 0.35, 0.6, 0.8, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [1], ratios: ['1:1'], presets: ['default', 'baseline-illustrative', 'baseline-es'], dom: headsAtLeast(55), label: 'baseline presets at 1:1: heads >= 55 px at 1080p (LAW-0171 precedent)'},
  {at: [1], dom: headsAtLeast(45), label: 'people readable in both scenes (head >= 45 px at 1080p: the stress contrast floor, LAW-0447)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-']), label: 'outcome tags beside their filings (leader <= 40 px), leaders cross no text'},
  {at: [0.74, 0.8, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no outcome tag intersects any prop or any text (as it appears and at the hold)'},
  {at: times(0, 1, 0.05), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0.7, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers (the draft state is neutral)'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0.1, 0.76, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the pen, the stamp and the hands never lie over a head'},
  {at: times(0.1, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.labelsOffFaces', label: 'layout: labels clear of faces'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

// with only locale "es", every default text is shown in Spanish: no English default remains (review r2)
ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' '); return !/\\b(Party|Registry|Day \\d|fictional|Case file|Written|Handed|Registered|Draft|supplied|Reference|Sequence|Filing|Same in|Changed fact|Before|After|Datum)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

// every line of every visible label is drawn whole and on top (review r2: a tray label's second line hid behind the desk)
ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop, the counter or a person'},
]);

// review r2: the comparison guide's links run through no person, prop or text. Every leader path of the guide (dashed)
// is sampled and kept >= 12 px (1080p) from every figure, prop and text box; each outline marker lies over no text
// and no figure. (The guide links by numbered markers on the outlines; any leader added later is held to this.)
const GUIDE_CLEAR = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const vb = svg.viewBox.baseVal, K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080), pad = 12 * K;
  const guide = svg.querySelector('[data-node="guide"]');
  if (!guide || eff(guide) < 0.5) return true;
  const R = e => e.getBoundingClientRect();
  // (every drawn part of every figure — not the figure group's whole box, which spans its reach)
  const figures = [...svg.querySelectorAll('[data-node$="-pa"], [data-node$="-pb"], [data-node*="-pa-"], [data-node*="-pb-"]')].filter(e => !guide.contains(e)).flatMap(g0 => [...g0.querySelectorAll('path, circle, ellipse, rect')]).filter(e => eff(e) > 0.3 && !e.closest('clipPath, defs')).map(R).filter(b => b.width > 1);
  const props = ['letter', 'stamp', 'pen', 'tray-back', 'tray-front', 'dplate'].flatMap(n => ['sa', 'sb'].map(q => svg.querySelector('[data-node="' + q + '-' + n + '"]'))).filter(e => e && eff(e) > 0.3).map(R);
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && t.textContent.trim() && !guide.contains(t) && !t.closest('[data-layer="content-notice"]')).map(R);
  const near = (q, b) => q.x > b.left - pad && q.x < b.right + pad && q.y > b.top - pad && q.y < b.bottom + pad;
  for (const l of guide.querySelectorAll('path[stroke-dasharray], line')) {
    const m = l.getScreenCTM(), L = l.getTotalLength();
    for (let j = 1; j < 60; j++) { const q = l.getPointAtLength(L * j / 60).matrixTransform(m); if ([...figures, ...props, ...texts].some(b => near(q, b))) return false; }
  }
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  for (const c of guide.querySelectorAll('circle')) { const b = R(c); if ([...figures, ...texts].some(z => meet(b, z))) return false; }
  return true;
})()`;
ratioChecks(ID, 'guide links clear of people, props and text', [
  {at: [0.85, 1], dom: GUIDE_CLEAR, label: 'RENDERED: the comparison guide links cross no figure, prop or text (>= 12 px), its markers lie over no text or figure'},
]);
