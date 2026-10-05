// LAW-0184 — Interpretación lingüística · inspect. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: the detail keeps its source coordinates (the lens is a uniform enlarged copy
// drawn at the context's coordinates, zoom ≥ 1.5), the change is localised (one supplied label and its
// dependent glyph and colour; speakers, bubbles and words unchanged), and seeking back restores exactly
// the previous datum.
// Windows (LAW-0184.js W): lens opens 0.20–0.34; in the lens strike 0.38–0.43, grey 0.42–0.46, tab grows
// 0.44–0.50, new label 0.47–0.54; lens closes 0.64–0.72 while the context update runs: strike 0.68–0.71,
// grow 0.69–0.72, new label 0.70–0.74, Δ marker 0.74–0.77 and its label 0.74–0.78 (main action by 0.78).
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {NO_CARD_ON_FACE, NO_DOUBLE, NO_RIM_CUT, LABEL_OWNS_CONNECTOR, LENS_OFF_PEOPLE, CONES_CLEAR, COPY_WHOLE, NO_HALF_COVER, strikeEveryLine, MIN_HEAD_PX, FRAME} from './interpretacion-linguistica-checks.js';

// Round 2 (coordinator): the scene fills wide frames (table + both bubbles span ≥ 80 % of the caption-safe
// width, as in LAW-0200) and the rendering's words stay readable while the lens is open (effective opacity
// ≥ 0.35 at every sampled u — dimmed with the context, never blanked).
const SCENE_WIDTH = `(() => {
  const vb = svg.viewBox.baseVal, k = 1 / svg.getScreenCTM().a;
  const bs = ['st-top', 'bubS', 'bubR'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean).map(e => e.getBoundingClientRect());
  if (bs.length < 3) return false;
  return (Math.max(...bs.map(b => b.right)) - Math.min(...bs.map(b => b.left))) * k >= 0.8 * vb.width * (1 - 0.06 - 0.06);
})()`;
// Round 3: every visible relationship link ends on a visible name chip (within 14 px at 1080p) — with labels
// hidden the map is not drawn at all, so no link ends in empty space.
const LINK_ENDS_ON_NODES = `(() => {
  const k = 1 / svg.getScreenCTM().a * 1080 / Math.min(svg.viewBox.baseVal.width, svg.viewBox.baseVal.height);
  const eff = el => { let o = 1; for (let e = el; e && e !== svg; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const chips = [...svg.querySelectorAll('[data-node^="chip-"]')].filter(c => eff(c) > 0.3).map(c => c.getBoundingClientRect());
  for (const path of svg.querySelectorAll('[data-conn^="rl"]')) {
    if (eff(path) <= 0.3) continue;
    const m = path.getScreenCTM(), L = path.getTotalLength();
    for (const t of [0, L]) {
      const q = path.getPointAtLength(t).matrixTransform(m);
      const near = chips.some(b => Math.hypot(Math.max(b.left - q.x, 0, q.x - b.right), Math.max(b.top - q.y, 0, q.y - b.bottom)) * k <= 14);
      if (!near) return false;
    }
  }
  return true;
})()`;
// Round 4: tall frames are filled — the scene (people, table, bubbles) plus the relation map cover ≥ 80 % of
// the caption-safe height at rest and at the hold.
const TALL_FILL = `(() => {
  const vb = svg.viewBox.baseVal, k = 1 / svg.getScreenCTM().a;
  const eff = el => { let o = 1; for (let e = el; e && e !== svg; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const els = [...svg.querySelectorAll('[data-node="st"], [data-node="bubS"], [data-node="bubR"], [data-node="relmap"]')].filter(e => eff(e) > 0.3);
  if (!els.length) return false;
  const rs = els.map(e => e.getBoundingClientRect());
  // (default caption-safe box: top 6 %, bottom 20 % of the frame)
  return (Math.max(...rs.map(r => r.bottom)) - Math.min(...rs.map(r => r.top))) * k >= 0.8 * vb.height * (1 - 0.06 - 0.2);
})()`;
const RENDERING_VISIBLE = `(() => {
  const t = svg.querySelector('[data-node="bubR-txt"]');
  if (!t) return false;
  let o = 1;
  for (let e = t; e && e !== svg; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (e.getAttribute('display') === 'none') return false; }
  return o >= 0.35 && t.getBoundingClientRect().width > 0;
})()`;

const dense = (a, b, step) => Array.from({length: Math.round((b - a) / step) + 1}, (_, i) => Math.round((a + i * step) * 1000) / 1000);

contractSuite('LAW-0184', {
  // the lens window is an opaque enlarged copy over the dimmed context; only the copy's texts carry a
  // zero-width mark, so no other label pair is exempted from the overlap heuristic
  allowTextOverlap: ['​'],
  continuity: ['handA', 'handB', 'handIL', 'handIR', 'pen'],
  continuityLimit: 45,
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.lensCopyMatches && s.markerShown === 0", label: 'context: the state produced by the exchange; the lens copy uses the context coordinates'},
    {at: 0.28, fn: "s.lensOpen > 0 && s.lensOpen < 1 && s.datum === 'before'", label: 'isolate: the lens grows out of the language tab (nothing changed yet)'},
    {at: 0.36, fn: "s.lensOpen === 1 && s.datum === 'before' && s.lens.strike === 0 && s.zoom >= 1.5", label: 'lens fully open on the unchanged label, a real magnification (≥ 1.5×)'},
    {at: 0.45, fn: "s.datum === 'changing' && s.lens.strike === 1 && s.lens.old >= 0.5 && s.contextDatum === 'before'", label: 'substitution inside the lens only; the old label stays readable (traceable)'},
    {at: 0.62, fn: "s.datum === 'after' && s.lens.reveal === 1 && s.lensOpen === 1 && s.contextDatum === 'before' && s.lensCopyVisible === 1", label: 'new label and its dependent glyph shown in the lens; held open ≥ 300 ms'},
    {at: 0.69, fn: "s.lensOpen > 0 && s.lensOpen < 0.5 && s.contextDatum === 'changing' && s.lensCopyVisible === 0", label: 'the context update overlaps the lens close; the copy has faded before the window reaches the source'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.markerShown === 1 && s.mainActionEnd <= 0.8", label: 'main action complete by u = 0.8'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.markerShown === 1 && s.oldTraceable && s.allReached && s.labelsFit && s.speakersUnchanged", label: 'hold: changed datum marked, old label traceable, labels fit'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.markerShown === 0 && s.context.grow === 0", label: 'seeking back (after the end) restores the old datum and geometry exactly'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.contextDatum === 'after' && s.markerShown === 1", label: 'labels hidden: the same localised change (glyph and colour) is visible'},
    {at: 1, params: {relationships: [{from: 'a', to: 'b', kind: 'relation', label: 'Same room'}, {from: 'a', to: 'interpreter', kind: 'sequence', label: 'First to her'}]}, fn: 's.labelsFit && s.zoom >= 1.5', label: 'relationships are editable (kinds and labels follow the parameter; the layout still fits)'},
    {at: 1, params: {afterValue: 'Language 2'}, fn: "s.values.before === s.values.after && s.contextDatum === 'after'", label: 'the substituted value is the SUPPLIED one (equal values stay equal)'},
  ],
});

suppliedTextSuite('LAW-0184', {
  fields: `return [p.actors[0].name, p.actors[1].name, p.actors[2].name, p.roles.a, p.roles.b, p.roles.interpreter, p.props.sourceLanguage, ...p.relationships.map(q => q.label),
      p.props.utterance, p.props.rendering, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión'] : ['As supplied · no conclusion drawn']`,
});

ratioChecks('LAW-0184', 'real zoom; no double image; no rim cut; no card over a face; marker label beside its marker', [
  {at: [1], fn: 's.labelsFit && s.lensCopyMatches && s.zoom >= 1.5', label: 'labels fit; the lens is a uniform real copy at ≥ 1.5×'},
  {at: [0, 0.4, 0.66, 0.7, 0.75, 1], fn: 's.allReached', label: 'every IK target reached'},
  {at: [1], fn: 's.markNoteGap !== null && s.markNoteGap <= 16 && s.markLabelShown === 1', label: 'the changed-datum label sits on the changed datum: beside its marker or against the changed tab (no leader)', tv: ['all']},
  {at: [...dense(0.18, 0.38, 0.01), ...dense(0.6, 0.8, 0.005)], dom: NO_DOUBLE, label: 'rendered: no two visible copies of the same text overlap (lens open / close)', tv: ['all']},
  {at: [0.3, 0.36, 0.45, 0.5, 0.55, 0.62, 0.66], dom: NO_RIM_CUT, label: 'rendered: no text is cut by the lens rim', tv: ['all']},
  {at: [0, 0.3, 0.5, 0.7, 0.8, 1], dom: NO_CARD_ON_FACE, label: 'rendered: no bubble, tab or card covers a head or face'},
  // review round 2 (coordinator), dense over the whole lens phase, labels shown and hidden
  {at: dense(0.15, 0.8, 0.01), dom: LENS_OFF_PEOPLE, label: 'rendered: the lens window never covers a head or a body'},
  {at: dense(0.15, 0.8, 0.01), dom: CONES_CLEAR, label: 'rendered: the cone lines cross no face and no text'},
  {at: dense(0.15, 0.8, 0.01), dom: COPY_WHOLE, label: 'rendered: nothing in the lens copy (text, tab outline, glyph, strike) is cut by the rim'},
  {at: dense(0.15, 0.8, 0.01), dom: NO_HALF_COVER, label: 'rendered: the open window covers no context text partly (wholly or not at all)'},
  {at: [1], dom: LABEL_OWNS_CONNECTOR, label: 'rendered: every relationship label sits on or beside its own link', tv: ['all']},
  {at: [0.45, 0.5, 0.6], dom: strikeEveryLine('ls'), label: 'rendered (lens): the strike crosses every line of the old value through its middle', tv: ['all']},
  {at: [0.75, 1], dom: strikeEveryLine('cs'), label: 'rendered (context): the strike crosses every line of the old value through its middle', tv: ['all']},
  {at: [0.45, 1], params: {beforeValue: 'Language 2 as supplied by the author'}, dom: `(${strikeEveryLine('ls')}) && (${strikeEveryLine('cs')})`, label: 'a long old value wraps and every one of its lines is struck', tv: ['all']},
  {at: [0.62], fn: 's.zoom >= 2.1 || s.lensFallback', label: 'the lens magnifies 2.1–2.4× (a smaller last-resort lens only for very long labels in small boxes)'},
  // round 2 (coordinator): people as large as LAW-0164/0172's (smallest head, px at 1080p) — the relation map
  // uses the band above the scene, never the people's size
  {at: [1], dom: `(${MIN_HEAD_PX}) >= ({landscape: 120, portrait: 120, square: 90})[${FRAME}]`, label: 'rendered: heads ≥ 120 / 120 / 90 px (16:9 / 9:16 / 1:1)', presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es']},
  {at: [1], dom: `(${MIN_HEAD_PX}) >= ({landscape: 100, portrait: 100, square: 60})[${FRAME}]`, label: 'rendered: under stress heads ≥ 100 / 100 / 60 px', presets: ['long-labels-stress']},
  {at: [0.1, 1], ratios: ['16:9'], dom: SCENE_WIDTH, label: 'rendered: table + bubbles span ≥ 80 % of the caption-safe width at rest and hold'},
  {at: [0.1, 1], ratios: ['9:16'], dom: TALL_FILL, label: 'rendered: 9:16 — scene plus map cover ≥ 80 % of the safe height at rest and hold'},
  {at: [0.1, 0.5, 1], dom: LINK_ENDS_ON_NODES, label: 'rendered: every visible relationship link ends on a visible name chip (labels on and off)'},
  {at: dense(0, 1, 0.02), dom: RENDERING_VISIBLE, label: 'rendered: the rendering’s words stay visible (opacity ≥ 0.35) throughout', tv: ['all']},
]);
