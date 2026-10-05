/**
 * LAW-0266 — Modificación del escrito · mechanism
 *
 * Storyboard (a spatial composition, not a row of boxes: the case file holding the writing in the middle, the proposed
 * modification (◆) on Party A's side and the change history (● the earlier text, "was:") on the other side, Party A
 * and Party B at the lower corners, the two trays between them and the calendar at a top corner; connectors are
 * anchored on the facing edges):
 *  0.00–0.18  separate: the components move apart to their places; the proposal comes in from Party A's side and the
 *             earlier text moves out to the history side — both rightwards, the way the section is replaced; neither
 *             fades or is erased.
 *  0.18–0.43  only the supplied relationships are drawn, one by one, each in its kind's style without arrowheads
 *             (a causal arrowhead only when the author supplies one) and labelled on its own connector.
 *  0.43–0.75  a tracer follows the supplied traversal order along the relationships; the focus element (the case
 *             file by default) enlarges while the tracer is on it. The order is captioned "Sequence as configured
 *             (illustrative)".
 *  0.75–1.00  gather: the case file shows both glyphs side by side — ◆ the proposal for the section and ● the earlier
 *             text kept in the history, equal weight — with the supplied caption, and the calendar marks the supplied
 *             day. The proposal is only proposed: no permission, time limit, admissibility or effect is shown.
 * @module animations/civil-claim/LAW-0266
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline, cubicPolyline} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {personBadge} from '../../primitives/badges.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  ME_DEFAULTS, ME_COMMON_ES, ME_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, versionKeyText, localizeDefaults, caseFileW, claimSheet, stateGlyph, dayOf, sectionOf,
} from './kits/modificacion-escrito.js';
import {FD_LINK_STYLES, link} from './kits/presentacion-demanda.js';
import {caseFile, letterTray, calendarStrip, glue} from './kits/civil-claim-art.js';

const ID = 'LAW-0266';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W_ = {separate: [0.02, 0.17], relate: [0.19, 0.42], trace: [0.44, 0.72], states: [0.76, 0.82]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** share of a relation label's smaller side kept free between its two components */
const PREFILL = 0.8;
const EL = ['partyA', 'caseFile', 'proposal', 'trays', 'partyB', 'history', 'calendar'];
/** how far (share of the design width) the proposal and the earlier text travel in the separate beat (rightwards) */
const TRAVEL = 0.05;

const relItem = obj('A supplied relationship between two components (drawn as supplied; not a legal finding)', {
  from: oneOf('Source component id', EL),
  to: oneOf('Target component id', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the connector (empty = the caption of its kind)', 60),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  elements: list('Component labels; ids are fixed by the scene, labels are editable (a party id replaces the "name · role" caption)', obj('Component', {id: oneOf('Component id', EL), label: str('Visible label', 50)}, ['id', 'label']), 2, EL.length),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied)', relItem, 1, 8),
  focusElement: oneOf('Component enlarged while the tracer passes', EL),
  relationLabels: obj('Caption used for each relation kind', {
    relation: str('Caption for plain relations', 40), communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40), causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', EL), 2, 8),
};

const defaultParams = {
  parties: ME_DEFAULTS.parties,
  documents: ME_DEFAULTS.documents,
  stages: ME_DEFAULTS.stages,
  dates: ME_DEFAULTS.dates,
  elements: [
    {id: 'trays', label: 'Party A’s tray and the history tray'},
    {id: 'calendar', label: 'Calendar (as supplied)'},
  ],
  relationships: [
    {from: 'partyA', to: 'proposal', kind: 'relation', label: 'proposed by'},
    {from: 'proposal', to: 'caseFile', kind: 'relation', label: 'proposed for the writing'},
    {from: 'proposal', to: 'trays', kind: 'communication', label: 'from Party A’s tray'},
    {from: 'trays', to: 'history', kind: 'communication', label: 'earlier text to history'},
    {from: 'partyB', to: 'history', kind: 'relation', label: 'shown to Party B'},
    {from: 'history', to: 'caseFile', kind: 'relation', label: 'kept beside it'},
  ],
  focusElement: 'caseFile',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'then (as configured)', causal: 'causal (as supplied)'},
  traversalOrder: ['partyA', 'proposal', 'trays', 'history', 'caseFile'],
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...ME_COMMON_ES,
  elements: [
    {id: 'trays', label: 'Bandeja de la Parte A y del historial'},
    {id: 'calendar', label: 'Calendario (según lo aportado)'},
  ],
  relationships: [
    {from: 'partyA', to: 'proposal', kind: 'relation', label: 'la propone'},
    {from: 'proposal', to: 'caseFile', kind: 'relation', label: 'para el escrito'},
    {from: 'proposal', to: 'trays', kind: 'communication', label: 'desde su bandeja'},
    {from: 'trays', to: 'history', kind: 'communication', label: 'el anterior, al historial'},
    {from: 'partyB', to: 'history', kind: 'relation', label: 'a la vista de la Parte B'},
    {from: 'history', to: 'caseFile', kind: 'relation', label: 'se conserva'},
  ],
  relationLabels: {relation: 'relación', communication: 'comunicación', sequence: 'después (según la configuración)', causal: 'causal (según lo aportado)'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    // supplied text starts at ~20 px (1080p); long supplied labels that crowd the diagram step it down (never below
    // ~16.4 px) until the components, their labels and the relation labels stand clear of one another
    const D = ctx.design;
    const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const B = SIZE[ctx.view.shape];
    const floorK = 16.4 / pxPer / (B * 0.96);
    const bad = z => z.relLabels.filter(t => !t.clear).length + (z.groupsClear ? 0 : 1) + z.crossedN + (z.inFrame ? 0 : 1) + z.clashes.length;
    const hard = z => (z.groupsClear ? 0 : 1) + z.crossedN + (z.inFrame ? 0 : 1) + z.clashes.length + (z.labelsClear ? 0 : 1) + z.relLabels.filter(t => !t.nearOK).length;
    let L = null;
    // (each text size tries the composition's arrangements in turn — the alternatives only when the first leaves a
    // label without a free spot — before the text steps down)
    for (const k of [1, 0.92, 0.85].filter(k2 => k2 > floorK + 0.03).concat([floorK])) {
      // (square: every arrangement at every text size — they are few, which keeps the square layout within ~1 s)
      let kBest = null;
      for (const pos of k >= 1 || ctx.view.shape !== 'square' ? [POS[ctx.view.shape], ...POS_ALT[ctx.view.shape]] : [POS[ctx.view.shape], POS_ALT.square[0], POS_ALT.square[1]]) {
        let q = compose(ctx, Math.max(k, floorK), {}, pos);
        // relation labels without a free spot: their components move further apart, and again
        const rounds = k > floorK && bad(q) >= (k < 1 ? 4 : 6) ? 0 : 3;
        for (let round = 0; round < rounds && bad(q) && Object.keys(q.needGap).length; round++) {
          const pg = {...q.pairGap};
          for (const [key2, v] of Object.entries(q.needGap)) pg[key2] = (pg[key2] || 0) + v;
          const q2 = compose(ctx, Math.max(k, floorK), pg, pos);
          // (an equal count is taken only when it keeps the components and labels as clear)
          if ((bad(q2) < bad(q) || (bad(q2) === bad(q) && hard(q2) <= hard(q))) && (q2.groupsClear || !q.groupsClear)) q = q2; else break;
        }
        if (!L || bad(q) < bad(L)) L = q;
        if (!bad(L)) return L;
        if (!hard(q) && (!kBest || bad(q) < bad(kBest))) kBest = q;
      }
      // (no arrangement placed every relation label in a free spot, but one keeps every label clear of the others and of
      // every component — its remaining labels sit on their own connectors: the text keeps this size)
      if (kBest) return kBest;
      if (k <= floorK) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** normalized anchor positions (centre of each component) per layout */
const POS = {
  landscape: {caseFile: [0.5, 0.2], proposal: [0.25, 0.4], history: [0.75, 0.4], partyA: [0.08, 0.76], partyB: [0.92, 0.76], trays: [0.5, 0.84], calendar: [0.88, 0.08]},
  square: {caseFile: [0.5, 0.66], proposal: [0.14, 0.2], history: [0.86, 0.2], partyA: [0.09, 0.84], partyB: [0.91, 0.84], trays: [0.5, 0.9], calendar: [0.5, 0.08]},
  portrait: {caseFile: [0.24, 0.07], proposal: [0.3, 0.34], history: [0.7, 0.58], partyA: [0.16, 0.64], partyB: [0.84, 0.86], trays: [0.3, 0.86], calendar: [0.74, 0.12]},
};

/** alternative arrangements (tried in order when the first leaves a label without a free spot) */
const POS_ALT = {
  landscape: [
    {caseFile: [0.5, 0.18], proposal: [0.24, 0.44], history: [0.76, 0.44], partyA: [0.08, 0.8], partyB: [0.92, 0.8], trays: [0.5, 0.88], calendar: [0.12, 0.08]},
  ],
  square: [
    {caseFile: [0.5, 0.17], proposal: [0.13, 0.16], history: [0.87, 0.16], partyA: [0.08, 0.56], partyB: [0.92, 0.56], trays: [0.44, 0.58], calendar: [0.5, 0.92], calMax: 0.74},
    {caseFile: [0.5, 0.16], proposal: [0.22, 0.46], history: [0.78, 0.46], partyA: [0.1, 0.84], partyB: [0.9, 0.84], trays: [0.5, 0.9], calendar: [0.84, 0.08]},
  ],
  portrait: [
    {caseFile: [0.26, 0.08], proposal: [0.3, 0.32], history: [0.7, 0.58], partyA: [0.16, 0.62], partyB: [0.84, 0.88], trays: [0.3, 0.88], calendar: [0.74, 0.14]},
    {caseFile: [0.7, 0.08], proposal: [0.3, 0.26], history: [0.7, 0.52], partyA: [0.2, 0.52], partyB: [0.82, 0.8], trays: [0.3, 0.8], calendar: [0.4, 0.95]},
  ],
};

function compose(ctx, sizeK = 1, pairGap = {}, pos = POS[ctx.view.shape]) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const small = B * 0.96 * sizeK;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf(ctx, p);
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const labelOf = id => (p.elements.find(e => e.id === id) || {}).label;
  const markIdx = dayOf(p, 1);
  // ---- top band: the state key and the "as supplied" key; the sequence caption under the state key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.4, size: keySize, name: 'key'}) : null;
  const stKeyAt = mw => gchip(ctx, versionKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: mw, size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'});
  // the order the tracer follows is captioned as configured (no institutional direction is drawn)
  const seqAt = (x, y, anchor, mw) => gchip(ctx, `◦ ${ctx.t.sequence}`, {x, y, anchor, maxWidth: mw, size: keySize, minSize: keySize, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: 'seq-note'});
  let stKey = null, seqNote = null, top = 8;
  if (showKey) {
    // (the sequence caption under the state key — or, square, under the "as supplied" key when that band is lower)
    stKey = stKeyAt(D.w - 32 - key.box.w);
    seqNote = seqAt(8, 8 + Math.max(key.box.h, stKey.box.h) + 8, 'start', D.w - 16);
    top = seqNote.box.y + seqNote.box.h + 10;
    if (shape === 'square') {
      const sq = seqAt(D.w - 8, key.box.y + key.box.h + 8, 'end', D.w * 0.5);
      const st2 = stKeyAt(D.w - 32 - Math.max(key.box.w, sq.box.w));
      const top2 = Math.max(st2.box.y + st2.box.h, sq.box.y + sq.box.h) + 10;
      if (top2 < top - 1) { stKey = st2; seqNote = sq; top = top2; }
    }
  }
  const U = {w: D.w, h: D.h - top};
  const at = id => ({x: pos[id][0] * U.w, y: top + pos[id][1] * U.h});

  // ---- components (design units); each has a body box for connector anchoring and an optional label chip
  const labelChip = (id, text, cx, y, maxW) => gchip(ctx, text, {x: cx, y, anchor: 'middle', maxWidth: maxW, size: small, minSize: small, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: `el-${id}-lab`});
  const maxLab = shape === 'portrait' ? D.w * 0.42 : shape === 'square' ? D.w * 0.26 : D.w * 0.2;
  const sheetW = shape === 'portrait' ? D.w * 0.44 : shape === 'square' ? D.w * 0.2 : D.w * 0.22;
  // (square: with crowding text the portraits shrink a little more, never below the figure floors)
  const Rp = (shape === 'portrait' ? 84 : shape === 'square' ? 74 * (sizeK < 1 ? 0.85 : 1) : 88) * Math.min(1, 0.5 + sizeK * 0.5);
  const buildEls = at => {
    const els = {};
    // parties: round portraits (Party A filed the initial claim; Party B files the additional claim)
    for (const [id, i, look] of [['partyA', 0, looks.a], ['partyB', 1, looks.b]]) {
      const c = at(id);
      const txt = labelOf(id) || partyCaption(p, i);
      const badge = personBadge(ctx, {name: `el-${id}-badge`, x: 0, y: 0, radius: Rp, look});
      // (square: a party's caption may run wider, on fewer lines, so the portrait keeps room above it)
      const lab = showKey ? labelChip(id, txt, c.x, c.y + Rp + 10, shape === 'square' ? D.w * 0.34 : maxLab) : null;
      els[id] = {id, c, body: {x: c.x - Rp, y: c.y - Rp, w: 2 * Rp, h: 2 * Rp}, circle: {x: c.x, y: c.y, r: Rp}, node: g({transform: T(c.x, c.y)}, badge.node || badge), lab};
    }
    // case file (its reference and title printed on it; at the gather both claims' glyphs stand side by side on it)
    {
      const c = at('caseFile');
      // (a long supplied title widens the file rather than overflowing it)
      const w = caseFileW(ctx, p.documents.caseFile, small, Math.max(small * (p.documents.caseFile.title.length > 40 ? 9.5 : 7.5), 170));
      const cf = caseFile(ctx, {prefix: 'el-cf', w, ref: p.documents.caseFile.ref, title: p.documents.caseFile.title, size: small, showText: showAll});
      const x0 = c.x - w / 2, y1 = c.y + cf.h / 2;
      const gR = small * 0.55;
      const gl = [['additional', 0.34], ['initial', 0.62]].map(([kind, f]) => ({kind, x: x0 + w * f, y: y1 - small * 1.15, R: gR}));
      // (its drawn outline: the covers, and the reference tab above the right of the cover — connectors end on these,
      // never on its label chip, which is only shown at the gather)
      const tabW = Math.max(w * 0.46, cf.refFit.width + small * 1.1);
      const shapeBoxes = [{x: x0, y: y1 - cf.bodyH - small * 0.45, w: w + small * 0.35, h: cf.bodyH + small * 0.45}, {x: x0 + w - tabW - 6, y: y1 - cf.h, w: tabW, h: cf.h - cf.bodyH}];
      els.caseFile = {id: 'caseFile', c, body: {x: x0, y: y1 - cf.h, w: w + small * 0.4, h: cf.h}, shape: shapeBoxes, node: g({transform: T(x0, y1)}, cf.node), gl,
        // (its chip is the supplied "history" caption, shown at the gather — or the supplied component label)
        lab: showKey && (labelOf('caseFile') || p.stages.history) ? labelChip('caseFile', labelOf('caseFile') || p.stages.history, c.x, y1 + 10, maxLab * 1.3) : null, fits: showAll ? [cf.refFit, cf.titleFit] : []};
    }
    // the two texts: coloured header with the glyph (◆ the proposal · ● the earlier text, kept), caption and text
    const kSec = sectionOf(p);
    // (each sheet carries the writing's title — the kept one marked "was:" — and its own text of the section)
    const texts = {proposal: {title: p.documents.writing.title, summary: p.documents.modification.text}, history: {title: ctx.t.was, summary: p.documents.writing.sections[kSec]}};
    for (const [id, kind] of [['proposal', 'additional'], ['history', 'initial']]) {
      const c = at(id);
      const d = texts[id];
      // (never narrower than the widest word of its texts: words are never broken)
      const wordW = Math.max(...[d.title, d.summary].flatMap(t => glue(t).split(' ').filter(Boolean)).map(x => ctx.measure(x.replace(/ /g, ' '), small, 700, 'sans')));
      const w = Math.max(sheetW, wordW + small * 2.6);
      const sh = claimSheet(ctx, {prefix: `el-${id}-sh`, w, size: small, kind, title: d.title, summary: d.summary, showText: showAll});
      const x0 = c.x - w / 2, y1 = c.y + sh.h / 2;
      els[id] = {id, c, body: {x: x0, y: y1 - sh.h, w: w + 6, h: sh.h + 6}, node: g({transform: T(x0, y1)}, sh.node),
        lab: showKey && labelOf(id) ? labelChip(id, labelOf(id), c.x, y1 + 14, maxLab) : null, fits: sh.fits};
    }
    // the two trays (Party A · Party B), side by side
    {
      const c = at('trays');
      const w = Math.max(150, small * 6);
      const trs = [0, 1].map(k => letterTray(ctx, {prefix: `el-tr${k}`, w, lipTop: -small * 1.4, rackTop: -small * 4, label: '', size: small, showText: false, plain: true, noIcon: true}));
      const y0 = c.y + small * 2;
      const xs = [c.x - w / 2 - 10, c.x + w / 2 + 10];
      const lab = showKey && labelOf('trays') ? labelChip('trays', labelOf('trays'), c.x, y0 + 26, maxLab * (shape === 'square' ? 1.15 : 1.7)) : null;
      // (its body starts at the racks' drawn top: connectors from above end on the racks themselves)
      els.trays = {id: 'trays', c, body: {x: c.x - w - 18, y: y0 - small * 4, w: 2 * w + 36, h: small * 4 + 18}, node: g(null, trs.map((t, k) => g({transform: T(xs[k], y0)}, t.back, t.front))), lab};
    }
    // the calendar (open from the start; the supplied response day is marked at the gather)
    {
      const c = at('calendar');
      // (a day label may wrap onto two lines at whole words before the strip loses a column)
      const twoLine = d => {
        const w = glue(d).split(' ').filter(Boolean);
        const m = t => ctx.measure(t.replace(/\u00a0/g, ' '), small, 700, 'sans');
        if (w.length < 2) return m(w.join(' '));
        let best = Infinity;
        for (let k = 1; k < w.length; k++) best = Math.min(best, Math.max(m(w.slice(0, k).join(' ')), m(w.slice(k).join(' '))));
        return best;
      };
      const dayW = Math.max(...p.dates.window.map(twoLine)) + small * 1.2;
      let cw = shape === 'portrait' ? D.w * 0.5 : clamp(p.dates.window.length * dayW, D.w * 0.24, D.w * (pos.calMax || (shape === 'square' ? 0.48 : 0.3)));
      let cols = p.dates.window.length;
      while (cols > 1 && cw / cols < dayW - 0.5) cols--;
      if (cols < p.dates.window.length) cols = Math.ceil(p.dates.window.length / Math.ceil(p.dates.window.length / cols));
      // (a strip that wraps onto more rows is only as wide as its columns need)
      if (cols < p.dates.window.length && shape !== 'portrait') cw = Math.max(D.w * 0.24, Math.min(cw, cols * dayW * 1.08));
      const opts = {prefix: 'el-cal', w: cw, cols, days: p.dates.window, title: labelOf('calendar') || '', showTitle: Boolean(labelOf('calendar')) && showKey, size: small, showText: showAll, slotH: small * 1.3};
      const probe = calendarStrip(ctx, {...opts, x: 0, y: 0});
      const cal = calendarStrip(ctx, {...opts, x: c.x - cw / 2, y: c.y - probe.h / 2});
      els.calendar = {id: 'calendar', c, body: {x: c.x - cw / 2, y: c.y - probe.h / 2 - small * 0.9, w: cw, h: probe.h + small * 0.9}, shape: [{x: c.x - cw / 2, y: c.y - probe.h / 2, w: cw, h: probe.h}], node: cal.node(markIdx), cal, lab: null, fits: showAll ? [cal.titleFit, ...cal.dayFits] : []};
    }
    return els;
  };
  // long supplied labels make the components larger than their slots: each component (with its label) is pushed
  // apart from the others until nothing overlaps, keeping the composition's order
  const groupBox = E => (E.lab ? unionBox(E.body, E.lab.box) : E.body);
  // (a claim keeps room inside the frame for the stretch it travels in the separate beat — the initial claim comes from
  // the left, the additional claim from the right — so that it starts inside the frame)
  const sweepOf = {proposal: -D.w * TRAVEL, history: -D.w * TRAVEL};
  const swL = id => Math.min(0, sweepOf[id] || 0), swR = id => Math.max(0, sweepOf[id] || 0);
  // (two related components keep room between them for their relation label: the label's smaller side, plus a margin)
  if (showAll) {
    for (const rel of p.relationships) {
      if (!EL.includes(rel.from) || !EL.includes(rel.to) || rel.from === rel.to) continue;
      const t = rel.label || p.relationLabels[rel.kind] || rel.kind;
      const c = gchip(ctx, t, {x: 0, y: 0, anchor: 'start', maxWidth: shape === 'portrait' ? D.w * 0.45 : D.w * 0.2, size: small, minSize: small, maxLines: 5});
      const k2 = `${rel.from}|${rel.to}`;
      pairGap = {...pairGap, [k2]: Math.max(pairGap[k2] || 0, Math.min(c.box.w, c.box.h) * PREFILL)};
    }
  }
  const els0 = buildEls(at);
  const ids = Object.keys(els0);
  const off = Object.fromEntries(ids.map(id => [id, {x: 0, y: 0}]));
  const gb = Object.fromEntries(ids.map(id => [id, groupBox(els0[id])]));
  const cur = id => ({x: gb[id].x + off[id].x, y: gb[id].y + off[id].y, w: gb[id].w, h: gb[id].h});
  const gapK = 14;
  for (let it = 0; it < 200; it++) {
    let moved = false;
    for (let a = 0; a < ids.length; a++) for (let b2 = a + 1; b2 < ids.length; b2++) {
      const A = cur(ids[a]), Bb = cur(ids[b2]);
      const gk = gapK + (pairGap[`${ids[a]}|${ids[b2]}`] || pairGap[`${ids[b2]}|${ids[a]}`] || 0);
      const ox = Math.min(A.x + A.w, Bb.x + Bb.w) - Math.max(A.x, Bb.x) + gk, oy = Math.min(A.y + A.h, Bb.y + Bb.h) - Math.max(A.y, Bb.y) + gk;
      if (ox <= 0 || oy <= 0) continue;
      moved = true;
      const sx = A.x + A.w / 2 < Bb.x + Bb.w / 2 ? -1 : 1, sy = A.y + A.h / 2 < Bb.y + Bb.h / 2 ? -1 : 1;
      if (ox < oy) { off[ids[a]].x += sx * ox / 2; off[ids[b2]].x -= sx * ox / 2; } else { off[ids[a]].y += sy * oy / 2; off[ids[b2]].y -= sy * oy / 2; }
    }
    // keep every group inside the frame
    for (const id of ids) {
      const c0 = cur(id);
      if (c0.x + swL(id) < 6) off[id].x += 6 - c0.x - swL(id);
      if (c0.x + c0.w + swR(id) > D.w - 6) off[id].x -= c0.x + c0.w + swR(id) - (D.w - 6);
      if (c0.y < top) off[id].y += top - c0.y;
      if (c0.y + c0.h > D.h - 6) off[id].y -= c0.y + c0.h - (D.h - 6);
    }
    if (!moved) break;
  }
  const relaxed = ids.some(id => Math.abs(off[id].x) + Math.abs(off[id].y) > 0.5);
  const els = relaxed ? buildEls(id => { const q = at(id); return {x: q.x + off[id].x, y: q.y + off[id].y}; }) : els0;
  const groupsClear = ids.every((a, k) => ids.slice(k + 1).every(b2 => !hit(groupBox(els[a]), groupBox(els[b2]), 4)));
  const inFrame = ids.every(id => { const b = groupBox(els[id]); return b.x + swL(id) >= 4 && b.x + b.w + swR(id) <= D.w - 4 && b.y >= top - 2 && b.x + b.w <= D.w - 4 && b.y + b.h <= D.h - 4; });

  // ---- connectors (only the supplied relationships), anchored on the facing edges of their components
  const occupied = [];
  for (const e of Object.values(els)) { occupied.push(e.body); if (e.lab) occupied.push(e.lab.box); }
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  if (seqNote) occupied.push(seqNote.box);
  const crossed = [];
  const crosses = (cn, rel, note = false) => {
    const inB = (q, b) => q.x > b.x - 10 && q.x < b.x + b.w + 10 && q.y > b.y - 10 && q.y < b.y + b.h + 10;
    const others = Object.values(els).filter(e => e.id !== rel.from && e.id !== rel.to);
    const labs = Object.values(els).filter(e => e.lab).map(e => e.lab.box);
    // (nor under the keys of the top band)
    const keys = [key, stKey, seqNote].filter(Boolean).map(z => z.box);
    // (no point of it, its ends included, comes within 5 units of a label chip or a key — a chip shown only at the gather included)
    for (let j = 0; j <= 80; j++) {
      const q = cn.at(j / 80);
      if (labs.some(b => q.x > b.x - 5 && q.x < b.x + b.w + 5 && q.y > b.y - 5 && q.y < b.y + b.h + 5)) {
        if (note) crossed.push([Object.values(els).find(e => e.lab && labs.includes(e.lab.box) && q.x > e.lab.box.x - 5 && q.x < e.lab.box.x + e.lab.box.w + 5 && q.y > e.lab.box.y - 5 && q.y < e.lab.box.y + e.lab.box.h + 5).id, rel.from, rel.to]);
        return true;
      }
      if (keys.some(b => q.x > b.x - 5 && q.x < b.x + b.w + 5 && q.y > b.y - 5 && q.y < b.y + b.h + 5)) { if (note) crossed.push(['key', rel.from, rel.to]); return true; }
    }
    for (let j = 3; j <= 37; j++) {
      const q = cn.at(j / 40);
      const hitE = others.find(e => inB(q, e.body));
      if (hitE) { if (note) crossed.push([hitE.id, rel.from, rel.to]); return true; }
      // (a connector never runs under a label, its own ends' labels included)
      const hitL = labs.find(b => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4);
      if (hitL) { if (note) crossed.push([Object.values(els).find(e => e.lab && e.lab.box === hitL).id, rel.from, rel.to]); return true; }
      if (keys.some(b => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4)) { if (note) crossed.push(['key', rel.from, rel.to]); return true; }
    }
    return false;
  };
  const made = [];
  const routeOf = (rel, i, others) => {
    const A = els[rel.from], Bx = els[rel.to];
    // connectors attach to the component together with its label chip (never under the label) — except the case file,
    // whose chip is shown only at the gather: its connectors end on its drawn outline at every u
    const withLab = E => (E.lab ? unionBox(E.body, E.lab.box) : E.body);
    const anchor = (E, toward) => (E.shape ? shapeAnchor(E.shape, toward)
      : E.circle && !(E.lab && toward.y > E.lab.box.y + E.lab.box.h) ? circlePt(E.circle, toward) : edgeAnchor(withLab(E), toward, 6));
    // (on the case file, other points of its outline are tried when the facing one would run under its chip)
    // (a box also offers the facing point moved along its edge, so that two connectors leaving it can stand apart)
    const slide = (E, toward) => {
      const q = anchor(E, toward);
      if (E.circle && !(E.lab && toward.y > E.lab.box.y + E.lab.box.h)) return [q];
      const bx = E.shape ? E.shape[0] : withLab(E);
      // (walk its outline, 6 units out, from the facing point: 40 and 80 units either way, round the corners)
      const X0 = bx.x - 6, Y0 = bx.y - 6, Wd = bx.w + 12, Ht = bx.h + 12, per = 2 * (Wd + Ht);
      const at = t => { t = ((t % per) + per) % per; if (t < Wd) return {x: X0 + t, y: Y0}; t -= Wd; if (t < Ht) return {x: X0 + Wd, y: Y0 + t}; t -= Ht; if (t < Wd) return {x: X0 + Wd - t, y: Y0 + Ht}; t -= Wd; return {x: X0, y: Y0 + Ht - t}; };
      const cx = clamp(q.x, X0, X0 + Wd), cy = clamp(q.y, Y0, Y0 + Ht);
      const dT = Math.abs(cy - Y0), dR = Math.abs(cx - X0 - Wd), dB = Math.abs(cy - Y0 - Ht), dL = Math.abs(cx - X0), m = Math.min(dT, dR, dB, dL);
      const t0 = m === dT ? cx - X0 : m === dR ? Wd + cy - Y0 : m === dB ? Wd + Ht + X0 + Wd - cx : 2 * Wd + Ht + Y0 + Ht - cy;
      return [q, ...[40, -40, 80, -80].map(d => at(t0 + d))];
    };
    const cands = (E, toward) => (E.id === 'caseFile' ? shapeCands(E.shape, toward) : slide(E, toward));
    const fromC = cands(A, Bx.c), toC = cands(Bx, A.c);
    // (the bend that passes through no other component or label, crosses the fewest connectors already drawn and does
    // not run beside one that leaves the same component; communications are drawn solid in their own colour — in this
    // motif a dashed line marks a disputed fact)
    let cn = null, best = Infinity;
    for (let fi = 0; fi < fromC.length && best >= 1; fi++) for (let ti = 0; ti < toC.length && best >= 1; ti++) {
      for (const bd of [0.12, -0.12, 0.3, -0.3, 0.45, -0.45, 0.6, -0.6]) {
        // (options are weighed on their geometry alone; the connector itself is built once, for the chosen one)
        const c0 = linkGeo(fromC[fi], toC[ti], bd);
        // (scored lazily: an option is dropped as soon as it cannot beat the best so far)
        let score = (crosses(c0, rel) ? 1000 : 0) + (fi + ti) * 0.01;
        for (const o2 of others) { if (score >= best) break; score += crossCount(c0, o2.c) + (besideAt(c0, rel, o2) ? 1 : 0); }
        if (score < best) { best = score; cn = c0; }
        if (score < 1) break;
      }
    }
    return {cn: link(ctx, {name: `rel-c${i}`, from: cn.from, to: cn.to, kind: rel.kind === 'communication' ? 'sequence' : rel.kind, bend: cn.bend, color: kindColor(ctx, rel.kind)}), best};
  };
  const conns = p.relationships.map((rel, i) => {
    if (!els[rel.from] || !els[rel.to] || rel.from === rel.to) return null;
    const out = {rel, i, c: routeOf(rel, i, made).cn};
    made.push(out);
    return out;
  }).filter(Boolean);
  // (a second pass: each connector that still crosses, runs under a label or runs beside another is routed again
  // against all the others — an earlier one may give way to a later one)
  const costOf = x => (crosses(x.c, x.rel) ? 1000 : 0) + conns.reduce((n, o2) => n + (o2 === x ? 0 : crossCount(x.c, o2.c) + (besideAt(x.c, x.rel, o2) ? 1 : 0)), 0);
  for (const x of conns) {
    const now = costOf(x);
    if (now < 1) continue;
    const alt = routeOf(x.rel, x.i, conns.filter(o2 => o2 !== x));
    if (alt.best < now - 0.5) x.c = alt.cn;
  }
  for (const x of conns) crosses(x.c, x.rel, true);
  // connector ends are kept clear of every label
  for (const cn of conns) for (const q of [cn.c.from, cn.c.to]) occupied.push({x: q.x - 14, y: q.y - 14, w: 28, h: 28});

  // relation labels: edge labels lying ON their own connector (the connector passes under its own label only), each
  // >= 22 px (1080p) from every other connector and clear of every component, label and connector end
  const relLabels = [];
  if (showAll) {
    const ptsOf = cn => Array.from({length: 61}, (_, jj) => cn.c.at(jj / 60));
    const allPts = conns.map(ptsOf);
    const shad = b => ({x: b.x, y: b.y, w: b.w + 6, h: b.h + 6});
    const dBox = (b, P) => Math.min(...P.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
    const ends = conns.flatMap(o2 => [o2.c.at(0), o2.c.at(1)]).map(q => ({x: q.x - 16, y: q.y - 16, w: 32, h: 32}));
    // (the shortest connectors — the fewest free spots along them — are labelled first)
    const byLen = conns.map((cn, k) => ({cn, k})).sort((a2, b2) => a2.cn.c.total - b2.cn.c.total || a2.cn.i - b2.cn.i);
    const baseW = shape === 'portrait' ? D.w * 0.45 : D.w * 0.2;
    for (const {cn, k} of byLen) {
      const text = cn.rel.label || p.relationLabels[cn.rel.kind] || cn.rel.kind;
      // (never narrower than the label's widest word: words are never broken)
      const wordW = Math.max(...glue(text).split(' ').filter(Boolean).map(x => ctx.measure(x.replace(/\u00a0/g, ' '), small, 700, 'sans')));
      const others = allPts.filter((_, j) => j !== k);
      // (a label of one or two words placed beside its connector is never broken into one-word lines: its words are
      // kept together, so the tag is never narrower than the whole label)
      const shortW = glue(text).split(' ').filter(Boolean).length <= 2 ? ctx.measure(text.replace(/\u00a0/g, ' '), small, 700, 'sans') + small * 1.6 : 0;
      let t = null;
      for (const mwK of [1, 0.75, 0.55, 1.45]) {
        const mw = Math.max(baseW * mwK, wordW + small * 1.6);
        const pr = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: small, minSize: small, maxLines: 6});
        for (const f of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) {
          const q = cn.c.at(f);
          const bx = {x: q.x - pr.box.w / 2, y: q.y - pr.box.h / 2, w: pr.box.w, h: pr.box.h};
          if (bx.x < 6 || bx.y < top || bx.x + bx.w > D.w - 6 || bx.y + bx.h > D.h - 6) continue;
          if (occupied.some(z => hit(bx, z, 4)) || ends.some(z => hit(bx, z, 0))) continue;
          // (a chip's drawn box takes in its shadow, offset to the right and down)
          if (others.some(P => dBox(shad(bx), P) < 22 / pxPer)) continue;
          const c = gchip(ctx, text, {x: bx.x, y: bx.y, anchor: 'start', maxWidth: mw, size: small, minSize: small, maxLines: 6, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), color: th.ink, weight: 700, name: `rl${cn.i}-chip`});
          t = {node: g({name: `rl${cn.i}`, opacity: 0}, c.node), box: c.box, fit: c.fit, clear: true};
          break;
        }
        if (t) break;
      }
      if (!t) {
        // (a short connector has no room along it: the label sits beside it, with a short leader, >= 22 px nearer it than
        // any other connector)
        // (sampled sparsely: a few boxes per connector keep the placement cheap)
        const lineBoxes = others.flatMap(P => P.filter((_, jj) => jj % 3 === 0).map(q => ({x: q.x - 12, y: q.y - 12, w: 24, h: 24})));
        const own = allPts[k].filter((_, jj) => jj % 4 === 0).map(q => ({x: q.x - 7, y: q.y - 7, w: 14, h: 14}));
        const obs = [...occupied, ...ends, ...lineBoxes, ...own];
        for (const f of [0.5, 0.35, 0.65, 0.22, 0.78, 0.12, 0.88, 0.42, 0.58]) {
          const anchor = cn.c.at(f);
          if (occupied.some(z => anchor.x > z.x - 2 && anchor.x < z.x + z.w + 2 && anchor.y > z.y - 2 && anchor.y < z.y + z.h + 2)) continue;
          const c = placeTag(ctx, {name: `rl${cn.i}`, text: shortW ? text.replace(/ /g, '\u00a0') : text, anchor, occupied: obs, bounds: {x: 6, y: top, w: D.w - 12, h: D.h - top - 6}, maxWidth: Math.max(baseW, shortW), size: small, color: kindColor(ctx, cn.rel.kind), maxLead: 36 / pxPer});
          if (c.clear && others.every(P => dBox(shad(c.box), P) >= dBox(c.box, allPts[k]) + 22 / pxPer)) { t = c; break; }
        }
      }
      if (!t) {
        // (no spot far enough from the other connectors: the label sits on its own connector where it covers no component,
        // label or connector end — reported as not clear, so the components still move apart when they can)
        const pr = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: Math.max(baseW * 0.75, wordW + small * 1.6), size: small, minSize: small, maxLines: 6});
        for (const f of [0.5, 0.4, 0.6, 0.3, 0.7, 0.22, 0.78]) {
          const q = cn.c.at(f);
          const bx = {x: q.x - pr.box.w / 2, y: q.y - pr.box.h / 2, w: pr.box.w, h: pr.box.h};
          if (bx.x < 6 || bx.y < top || bx.x + bx.w > D.w - 6 || bx.y + bx.h > D.h - 6) continue;
          if (occupied.some(z => hit(bx, z, 4)) || ends.some(z => hit(bx, z, 0))) continue;
          const c = gchip(ctx, text, {x: bx.x, y: bx.y, anchor: 'start', maxWidth: Math.max(baseW * 0.75, wordW + small * 1.6), size: small, minSize: small, maxLines: 6, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), color: th.ink, weight: 700, name: `rl${cn.i}-chip`});
          t = {node: g({name: `rl${cn.i}`, opacity: 0}, c.node), box: c.box, fit: c.fit, clear: false};
          break;
        }
      }
      if (!t) {
        // (no free spot: the label sits at the connector's middle and the layout reports it, so the components move apart)
        const q = cn.c.at(0.5);
        const c = gchip(ctx, text, {x: q.x, y: q.y, anchor: 'middle', maxWidth: Math.max(baseW, wordW + small * 1.6), size: small, minSize: small, maxLines: 6, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), color: th.ink, weight: 700, name: `rl${cn.i}-chip`});
        t = {node: g({name: `rl${cn.i}`, opacity: 0}, c.node), box: c.box, fit: c.fit, clear: false};
      }
      occupied.push(t.box);
      // (the rendered rule: a relation label lies >= 20 px nearer its own connector than any other connector)
      const ownD = dBox(t.box, allPts[k]);
      const nearOK = others.every(P => dBox(shad(t.box), P) >= ownD + 21 / pxPer);
      relLabels.push({i: cn.i, ...t, nearOK});
    }
  }
  // ---- tracer route through the traversal order (along a connector when one links consecutive ids)
  const order = p.traversalOrder.filter(id => els[id]);
  const pts = [], visits = [];
  const ctr = id => els[id].c;
  order.forEach((id, k) => {
    if (k === 0) { pts.push(ctr(id)); visits.push({id, idx: 0}); return; }
    const prev = order[k - 1];
    const lk = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    if (lk) {
      const fw = lk.rel.from === prev;
      pts.push(fw ? lk.c.from : lk.c.to);
      for (let j = 1; j <= 30; j++) pts.push(lk.c.at(fw ? j / 30 : 1 - j / 30));
    }
    pts.push(ctr(id));
    visits.push({id, idx: pts.length - 1});
  });
  const poly = polyline(pts);
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
  const total = cum[cum.length - 1] || 1;
  const route = {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};

  // connector gaps (each end lies on its component's edge)
  const edgeGap = (E, q) => {
    const gc = E.circle ? Math.abs(Math.hypot(q.x - E.circle.x, q.y - E.circle.y) - E.circle.r) : Infinity;
    if (E.circle && (!E.lab || gc <= 12)) return gc;
    const b = E.lab ? unionBox(E.body, E.lab.box) : E.body;
    const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
    const inside = !dx && !dy;
    return inside ? Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y) : Math.hypot(dx, dy);
  };
  // (the case file is measured on its drawn outline, never on its label chip)
  const shapeGap = (E, q) => Math.min(...E.shape.map(b => edgeGap({body: b}, q)));
  const gapOf = (E, q) => (E.shape ? shapeGap(E, q) : edgeGap(E, q));
  const connectorGaps = conns.map(x => r(Math.max(gapOf(els[x.rel.from], x.c.from), gapOf(els[x.rel.to], x.c.to)), 1));
  const besidePairs = conns.flatMap((a2, k) => conns.slice(k + 1).filter(b2 => besideAt(a2.c, a2.rel, b2)).map(b2 => `${a2.i}~${b2.i}`));
  const labelBoxes = [...Object.values(els).map(e => e.lab && e.lab.box), ...relLabels.map(t => t.box), key && key.box, stKey && stKey.box, seqNote && seqNote.box].filter(Boolean);
  // (a round portrait is hit only where the box meets its circle, not its bounding square's corners)
  const hitEl = (b, e) => (e.circle ? Math.hypot(Math.max(b.x - e.circle.x, 0, e.circle.x - b.x - b.w), Math.max(b.y - e.circle.y, 0, e.circle.y - b.y - b.h)) < e.circle.r - 1 : hit(b, e.body, -1));
  const labelsClear = labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)))
    && labelBoxes.every(b => Object.values(els).every(e => !hitEl(b, e) || (e.lab && e.lab.box === b)));
  const faces = [els.partyA, els.partyB];
  // (what clashes, for the test messages)
  const nameOf = b => (Object.values(els).find(e => e.lab && e.lab.box === b) || {}).id || (relLabels.find(t => t.box === b) ? `rl${relLabels.find(t => t.box === b).i}` : 'key');
  const clashes = [];
  labelBoxes.forEach((b, i) => {
    labelBoxes.forEach((c, j) => { if (i < j && hit(b, c, 1)) clashes.push(`${nameOf(b)}~${nameOf(c)}`); });
    Object.values(els).forEach(e => { if (hitEl(b, e) && !(e.lab && e.lab.box === b)) clashes.push(`${nameOf(b)}/${e.id}`); });
  });
  const truncated = [...Object.values(els).flatMap(e => e.fits || []), ...Object.values(els).map(e => e.lab && e.lab.fit), ...relLabels.map(t => t.fit), key && key.fit, stKey && stKey.fit, seqNote && seqNote.fit]
    .filter(f => f && f.truncated).map(f => f.full);
  const needGap = {};
  // a connector that could not avoid a third component: that component moves away from both ends
  for (const [id, a2, b2] of crossed) { needGap[`${id}|${a2}`] = 80; needGap[`${id}|${b2}`] = 80; }
  relLabels.forEach(t => { if (!t.clear) { const rel = p.relationships[t.i]; if (rel) needGap[`${rel.from}|${rel.to}`] = Math.min(t.box.w, t.box.h) + 24; } });
  return {crossedN: crossed.length, crossedWhat: crossed.map(x => x.join('>')), hitEl, clashes, showAll, sizeK, needGap, pairGap, groupsClear, inFrame, els, conns, relLabels, key, stKey, seqNote, route, markIdx, connectorGaps, besidePairs, labelsClear, faces, labelBoxes, truncated, small, top,
    centre: {x: D.w / 2, y: top + U.h / 2}};
}

/** u at which the tracer (eased along the route) reaches component id; the gather's start when it is not visited */
function visitU(L, id) {
  const v = L.route.visits.find(x => x.id === id);
  if (!v) return W_.states[0];
  // inverse of the inOutSine easing used for the tracer
  const t = Math.acos(1 - 2 * v.t) / Math.PI;
  return lerp(W_.trace[0], W_.trace[1], t);
}

/** A connector's geometry only (the same curve as `link` draws for these ends and bend). */
function linkGeo(from, to, bend) {
  const dx = to.x - from.x, dy = to.y - from.y, nx = -dy, ny = dx;
  const poly = cubicPolyline(from, {x: from.x + dx * 0.3 + nx * bend, y: from.y + dy * 0.3 + ny * bend}, {x: from.x + dx * 0.7 + nx * bend, y: from.y + dy * 0.7 + ny * bend}, to, 60);
  return {from, to, bend, at: t => poly.at(t), total: poly.total};
}

const SAMPLES = new WeakMap();
/** How many times two connectors cross (sampled polylines; crossings next to a shared end do not count). */
function crossCount(a, b) {
  const P = c => { let v = SAMPLES.get(c); if (!v) { v = Array.from({length: 31}, (_, j) => c.at(j / 30)); SAMPLES.set(c, v); } return v; };
  const pa = P(a), pb = P(b);
  const near = (q, r2) => Math.hypot(q.x - r2.x, q.y - r2.y) < 30;
  const ends = [a.from, a.to].filter(q => near(q, b.from) || near(q, b.to));
  const x = (p1, p2, p3, p4) => { const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x); if (!d) return null; const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d, u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? {x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y)} : null; };
  let n = 0;
  for (let i = 0; i < 30; i++) for (let j = 0; j < 30; j++) { const q = x(pa[i], pa[i + 1], pb[j], pb[j + 1]); if (q && !ends.some(e => Math.hypot(q.x - e.x, q.y - e.y) < 40)) n++; }
  return n;
}

/**
 * Whether connector a (relationship rel) runs beside connector o2 from a component they share: their ends there lie
 * within 30 design units, or over the first stretch from it one stays within 40 units of the other (a near-parallel
 * pair leaving the same edge).
 */
function besideAt(a, rel, o2) {
  const shared = [rel.from, rel.to].filter(id => id === o2.rel.from || id === o2.rel.to);
  for (const id of shared) {
    const ta = id === rel.from ? 0 : 1, tb = id === o2.rel.from ? 0 : 1;
    // (either way round: one stays beside the other)
    const runs = (x, tx, y, ty) => { const P = Array.from({length: 13}, (_, j) => y.at(Math.abs(ty - j / 24)));
      return [0.05, 0.1, 0.15, 0.2, 0.25].every(t => { const q = x.at(Math.abs(tx - t)); return P.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 40); }); };
    // (nor do their ends crowd one spot of its edge)
    const ea = a.at(ta), eb = o2.c.at(tb);
    if (Math.hypot(ea.x - eb.x, ea.y - eb.y) < 30 || runs(a, ta, o2.c, tb) || runs(o2.c, tb, a, ta)) return true;
  }
  return false;
}

/** Point on a drawn outline (a union of boxes) facing toward a point, 6 units outside it. */
function shapeAnchor(boxes, toward) {
  const [cover, tab] = boxes;
  const q = edgeAnchor(cover, toward, 6);
  // (on the top edge, above the reference tab, the anchor moves up to the tab's top)
  if (tab && q.y < cover.y && q.x > tab.x - 2 && q.x < tab.x + tab.w + 2) return {x: q.x, y: tab.y - 6};
  return q;
}

/** Candidate anchors on a drawn outline: the facing point first, then points along its sides, nearest first. */
function shapeCands(boxes, toward) {
  const [cover, tab] = boxes;
  const first = shapeAnchor(boxes, toward);
  const out = [];
  for (const f of [0.25, 0.5, 0.75]) {
    out.push({x: cover.x - 6, y: cover.y + cover.h * f}, {x: cover.x + cover.w + 6, y: cover.y + cover.h * f});
    const x = cover.x + cover.w * f;
    out.push({x, y: cover.y + cover.h + 6}, tab && x > tab.x - 2 && x < tab.x + tab.w + 2 ? {x, y: tab.y - 6} : {x, y: cover.y - 6});
  }
  out.sort((a, b) => Math.hypot(a.x - toward.x, a.y - toward.y) - Math.hypot(b.x - toward.x, b.y - toward.y));
  return [first, ...out];
}

function unionBox(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y};
}

function circlePt(c, toward) {
  const a = Math.atan2(toward.y - c.y, toward.x - c.x);
  return {x: c.x + (c.r + 6) * Math.cos(a), y: c.y + (c.r + 6) * Math.sin(a)};
}

function buildScene(ctx, L) {
  return g(null,
    L.conns.map(x => g({'data-from': x.rel.from, 'data-to': x.rel.to}, x.c.node)),
    Object.values(L.els).map(e => g({name: `el-${e.id}`}, g({name: `el-${e.id}-in`}, e.node,
      // both claims' glyphs on the case file (gather), equal size and stroke
      e.id === 'caseFile' ? e.gl.map((q, k) => stateGlyph(ctx, {name: `cf-gl${k}`, kind: q.kind, x: q.x, y: q.y, R: q.R, opacity: 0})) : null))),
    Object.values(L.els).map(e => e.lab && g({name: `el-${e.id}-labg`, opacity: 0}, e.lab.node)),
    // (the tracer runs along the connectors, under their edge labels: it never covers a label's text)
    g({name: 'tracer', opacity: 0},
      h('circle', {r: 22, fill: ctx.theme.accent2, opacity: 0.18}),
      h('circle', {r: 11, fill: ctx.theme.paper, stroke: ctx.theme.ink, 'stroke-width': 3})),
    L.relLabels.map(t => t.node),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
    L.seqNote && g({name: 'seq-noteg', opacity: 0}, L.seqNote.node),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const D = ctx.design;
  const nodes = {};
  const sepP = ease.inOutCubic(seg(u, ...W_.separate));
  // separate: components move out from the centre to their places; the proposal and the earlier text both travel
  // rightwards — the proposal in from Party A's side, the earlier text out to the history side
  const travel = {proposal: -1, history: -1};
  const dxOf = {};
  for (const e of Object.values(L.els)) {
    const dir = travel[e.id];
    const dx = dir ? dir * D.w * TRAVEL * (1 - sepP) : (L.centre.x - e.c.x) * (1 - sepP) * 0.1;
    const dy = dir ? 0 : (L.centre.y - e.c.y) * (1 - sepP) * 0.1;
    dxOf[e.id] = dx;
    // (both texts are opaque throughout: neither appears to erase the other)
    nodes[`el-${e.id}`] = {transform: T(dx, dy), opacity: dir ? 1 : r(0.35 + 0.65 * sepP, 3)};
    if (e.lab && e.id !== 'caseFile') nodes[`el-${e.id}-labg`] = {opacity: r(seg(u, 0.15, 0.2), 3)};
  }
  // relationships one by one
  const n = L.conns.length;
  // (each is drawn over >= 0.05 of u (350 ms); with many relationships the draws overlap, their starts kept in order)
  const span = W_.relate[1] - W_.relate[0];
  const dR = Math.max(span / n * 0.85, 0.05);
  const stepR = n > 1 ? (span - dR) / (n - 1) : 0;
  const relP = L.conns.map((x, k) => ease.inOutCubic(seg(u, W_.relate[0] + k * stepR, W_.relate[0] + k * stepR + dR)));
  L.conns.forEach((x, k) => Object.assign(nodes, x.c.frame(relP[k], relP[k] > 0 ? 1 : 0)));
  L.relLabels.forEach(t => { const k = L.conns.findIndex(x => x.i === t.i); nodes[`rl${t.i}`] = {opacity: r(clamp((relP[k] - 0.6) / 0.4), 3)}; });
  // tracer along the traversal order
  const tr = seg(u, ...W_.trace);
  const trE = ease.inOutSine(tr);
  const q = L.route.poly.at(trE);
  const trVis = u >= W_.trace[0] && u <= W_.trace[1] + 0.02;
  // (the tracer runs along the connectors; across a component it is hidden, so that it never covers the component's text)
  const inside = Object.values(L.els).some(e => q.x > e.body.x - 20 && q.x < e.body.x + e.body.w + 20 && q.y > e.body.y - 20 && q.y < e.body.y + e.body.h + 20);
  nodes.tracer = {transform: T(q.x, q.y), opacity: trVis && !inside ? 1 : 0};
  const visited = tr > 0 ? L.route.visits.filter(v => trE >= v.t - 1e-6).map(v => v.id) : [];
  // focus element enlarges while the tracer is near it
  const fv = L.route.visits.find(v => v.id === p.focusElement);
  let focusScale = 1;
  if (fv && tr > 0) {
    const d = Math.abs(trE - fv.t);
    focusScale = 1 + 0.06 * clamp(1 - d / 0.12) * (u <= W_.trace[1] + 0.02 ? 1 : 0);
  }
  for (const e of Object.values(L.els)) nodes[`el-${e.id}-in`] = {transform: e.id === p.focusElement ? scaleAbout(e.c.x, e.c.y, focusScale) : ''};
  const calOpen = seg(u, 0.04, 0.16);
  const stP = seg(u, ...W_.states);
  // the supplied day of the additional claim is marked at the gather
  const markP = seg(u, W_.states[0], W_.states[0] + 0.04);
  Object.assign(nodes, L.els.calendar.cal.frame(calOpen, markP, L.markIdx).nodes);
  // gather: both claims' glyphs on the case file, together, and the supplied "both" caption
  L.els.caseFile.gl.forEach((x, k) => { nodes[`cf-gl${k}`] = {opacity: r(stP, 3)}; });
  if (L.els.caseFile.lab) nodes['el-caseFile-labg'] = {opacity: r(stP, 3)};
  if (L.seqNote) nodes['seq-noteg'] = {opacity: r(seg(u, W_.trace[0] - 0.02, W_.trace[0]), 3)};
  const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
  return {
    nodes,
    semantic: {
      beat, separated: r(sepP, 3), relationsDrawn: relP.map(v => r(v, 3)), tracerVisible: trVis, tracer: {x: r(q.x), y: r(q.y)},
      tracerShown: trVis && !inside, visitOrder: visited, focusScale: r(focusScale, 3), calOpen: r(calOpen, 3), markP: r(markP, 3), markIdx: L.markIdx,
      proposalDx: r(dxOf.proposal, 2), historyDx: r(dxOf.history, 2),
      textsOpacity: [1, 1], bothShown: r(stP, 3), glyphKinds: L.els.caseFile.gl.map(x => x.kind),
      connectorGaps: L.connectorGaps, besidePairs: L.besidePairs,
      arrows: L.conns.map(x => ({kind: x.rel.kind, arrow: FD_LINK_STYLES[x.rel.kind].arrow})),
      kinds: L.conns.map(x => x.rel.kind),
      labelsClear: L.labelsClear, groupsClear: L.groupsClear, inFrame: L.inFrame, truncated: L.truncated, crossed: L.crossedN, crossedWhat: L.crossedWhat,
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !L.hitEl(b, f))),
      clashes: L.clashes, textK: r(L.sizeK, 3), unplaced: L.relLabels.filter(t => !t.clear).map(t => t.i),
      tracerParked: u > W_.trace[1] + 0.02 ? true : null,
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-07-mechanism',
    title: 'Modification of a writing — how the proposed text, the earlier text kept in the history and the case file are connected',
    titleEs: 'Modificación del escrito — Mecanismo o relación explicada',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Modificación del escrito',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A spatial composition of the components — the case file holding the writing, Party A and the proposed modification (◆), the earlier text kept in the change history (●, “was:”), Party A’s tray and the history tray, Party B and the calendar. The proposal comes in from Party A’s side and the earlier text moves out to the history side; neither is erased. Only the supplied relationships are drawn, without arrowheads (a causal link only when supplied) and labelled on their connectors; a tracer follows the supplied order, captioned “Sequence as configured (illustrative)”, while the case file enlarges. At the gather the case file shows both glyphs — ◆ and ●, equal weight. The proposal is only proposed: no permission, time limit, admissibility or effect is shown.',
    tags: ['modification of a writing', 'proposed modification', 'change history', 'mechanism', 'relationships', 'case file', 'trays', 'tracer', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/modificacion-escrito.js', 'src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/presentacion-demanda.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/primitives/badges.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: ME_STRINGS,
  scene,
});
