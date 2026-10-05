// LAW-0241 — Requerimiento previo · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, object anchoring (pen, letter and slip ride SOLVED hand
// positions) and a transformation recognisable with labels hidden.
// Clock: c = (u − 0.15) / 0.65 (c = 1 at u = 0.80). Windows (c → u):
//   pen held c 0.07–0.37 → u 0.1955–0.3905; signing c 0.13–0.30 → u 0.2345–0.345;
//   push (hand on the letter's left edge) c 0.42–0.47 → u 0.423–0.4555; letter lands c 0.62 → u 0.553;
//   B holds the slip c 0.72–0.81 → u 0.618–0.677 (then lets go above the lip: it drops onto the rail); slip in
//   A's pocket from c 1 → u 0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, textSizeOverTime, baselineTextAtHold, HANDS_OFF_HEADS, HEADS_OFF_TEXT} from './requerimiento-previo-checks.js';

const P = name => presetsFor('LAW-0241').find(q => q.name === name).params;
const near = (a, b, tol = 1.5) => `Math.hypot(s.${a}.x - s.${b}.x, s.${a}.y - s.${b}.y) < ${tol}`;

contractSuite('LAW-0241', {
  continuity: ['handA', 'handB', 'pen', 'letter', 'slip'],
  attach: [
    {from: 0.197, to: 0.389, a: 'penGrip', b: 'handA', tol: 1.5},
    {from: 0.236, to: 0.344, a: 'pen', b: 'sigTip', tol: 1.5},
    {from: 0.424, to: 0.455, a: 'letterGrip', b: 'handA', tol: 1.5},
    {from: 0.619, to: 0.675, a: 'slipGrip', b: 'handB', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.docAt === 'A' && s.sig === 0 && !s.penHeld && s.calOpen === 0 && s.pocketEmpty === 1 && s.slipAt === 'letter' && s.tags.sent === 0 && s.tags.outcome === 0", label: 'rest: the unsigned letter stands at Party A, the calendar is folded, the pocket is empty'},
    {at: 0.3, fn: `s.penHeld && s.sig > 0 && s.sig < 1 && ${near('pen', 'sigTip')}`, label: 'Party A signs: the pen nib is on the signature stroke'},
    {at: 0.44, fn: `s.docAt === 'A' && ${near('letterGrip', 'handA')}`, label: 'Party A pushes the letter by its edge'},
    {at: 0.5, fn: "s.docAt === 'route' && s.calOpen === 0", label: 'the letter slides along the route; the response space is not open yet (cause before effect)'},
    {at: 0.6, fn: "s.docAt === 'trayB' && s.landed && s.calOpen > 0 && s.pocketLit > 0", label: 'as it lands in B’s tray the response space opens and A’s reply pocket lights up'},
    {at: 0.66, fn: `s.slipAt === 'handB' && ${near('slipGrip', 'handB')}`, label: 'Party B tears off the reply slip (hand on the slip)'},
    {at: 0.74, fn: "s.slipAt === 'rail' && s.calAllOpen", label: 'the slip runs back along the return rail'},
    {at: 1, fn: "s.slipAt === 'pocketA' && s.markP === 1 && s.pocketEmpty === 0 && s.calAllOpen && s.tags.outcome === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear", label: 'hold: the slip is in A’s pocket, the glyph on the supplied day, tags shown, nothing cut'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.slipAt === 'pocketA' && s.docAt === 'trayB' && s.calAllOpen", label: 'labels hidden: the same transformation is visible (letter in B’s tray, calendar open, slip back)'},
    {at: 1, params: {finalState: 'reply-pending'}, fn: "s.slipAt === 'letter' && s.pocketEmpty === 1 && s.markP === 0 && s.docAt === 'trayB' && s.calAllOpen", label: 'reply pending (as supplied): nothing comes back; pocket and slots stay empty'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.docAt === 'A' && s.tags.outcome === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0.45, fn: "s.tags.outcome === 0 && s.markP === 0", label: 'no outcome is shown before the reply beat'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached', label: `${n}: no supplied text is cut; every hand reaches its target`})),
  ],
});

suppliedTextSuite('LAW-0241', {
  fields: "const plan = p.finalState === 'reply-pending'; const w = p.dates.window; const day = w[Math.max(0, Math.min(w.length - 1, p.dates.replyDay))]; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.letter.ref, p.documents.letter.title, p.dates.sent, plan ? p.documents.replySlip : p.documents.replySlip, ...w, p.stages.sent, p.stages.delivered, plan ? p.stages.pending : p.stages.replied + ' · ' + day, p.objectLabels.calendar, p.objectLabels.inTray, p.objectLabels.replyTray, ...p.annotations.map(a => a.text)];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// rendered: at 9:16 the baseline presets stack (no text-column fallback) and the stage spans >= 0.71 of the frame's width
const STAGE_WIDE = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const st = svg.querySelector('[data-node="st"]');
  return Boolean(st) && st.getBoundingClientRect().width >= 0.71 * (p1.x - p0.x);
})()`;
// rendered: no stage tag (sent / delivered / outcome) lies over any drawn part of a prop or over any text it does not own
// — checked when each tag has fully appeared (u 0.53, 0.69) and at the hold
const TAGS_OFF_PROPS = `(() => { const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
 const R = e => e.getBoundingClientRect(); const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
 const chips = [...svg.querySelectorAll('[data-node^="tag-"][data-node$="-chip"]')].filter(e => eff(e) > 0.3);
 const groups = ['st-cf', 'st-cal', 'st-tray-back', 'st-tray-front', 'st-letter', 'st-pk-back', 'st-pk-front', 'st-slipout', 'st-pen'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean);
 // (every visible drawn part of the props: a group's box would count its hidden layers too)
 const props = groups.flatMap(g0 => [...g0.querySelectorAll('path, rect, circle, ellipse, polygon, line')].filter(e => eff(e) > 0.3 && !e.closest('clipPath, defs')).map(e => Object.assign(e, {propName: g0.dataset.node})));
 const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
 const out = [];
 for (const c of chips) { const b = R(c); for (const p of props) if (meet(b, R(p))) { out.push(c.dataset.node + '~' + p.propName); break; } for (const t of texts) if (!c.contains(t) && meet(b, R(t))) out.push(c.dataset.node + '~"' + t.textContent.slice(0, 16) + '"'); }
 return out.length === 0; })()`;
ratioChecks('LAW-0241', 'faces clear, cards own their text, in frame, people large, tags beside their elements', [
  {at: [0, 0.3, 0.5, 0.7, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or text covers a head'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [0, 0.2, 0.3, 0.45, 0.6, 0.7, 0.8, 1], dom: IN_FRAME, label: 'nothing leaves the frame'},
  {at: [1], dom: headsAtLeast(52), label: 'people are large enough to read (head >= 52 px at 1080p)'},
  {at: [1], dom: fills(0.9, 0.55), label: 'the scene fills the caption-safe box (labels shown or hidden)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-', 'note']), label: 'each tag sits beside its own element (leader <= 40 px) and its leader crosses no text'},
  {at: [0, 0.2, 0.3, 0.5, 0.62, 0.7, 0.8, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [0.53, 0.69, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no stage tag intersects any prop or any text (when each tag appears and at the hold)'},
  {at: [1], ratios: ['9:16'], presets: ['default', 'baseline-illustrative', 'baseline-es'], dom: STAGE_WIDE, label: 'RENDERED: 9:16 baseline presets keep the stacked stage (no text column), >= 0.71 of the frame width'},
  {at: [1], ratios: ['9:16'], presets: ['default', 'baseline-illustrative', 'baseline-es'], fn: '!s.textColumn', label: '9:16 baseline presets: no text-column fallback'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02: text, props, lens)'},
  {at: times(0.1, 0.72, 0.02), dom: HANDS_OFF_HEADS, label: 'RENDERED: the pen and the hands never lie over a head (signing, pushing, tearing off the slip)'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: [1], fn: 's.labelsOffFaces && s.labelsClear', label: 'layout: labels clear of each other and of the faces'},
]);

// every visible text >= 16 px at every sampled u (coordinator rule, AUTHORING 'text size at every moment')
textSizeOverTime('LAW-0241', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0241')], test, expect});

// baseline presets, baseline-es included, keep every text >= 19.5 px at the hold in every ratio (coordinator 2026-09-26)
baselineTextAtHold('LAW-0241', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0241')], test, expect});
