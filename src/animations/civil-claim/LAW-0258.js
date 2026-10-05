/**
 * LAW-0258 — Contestación estructurada · mechanism
 *
 * Storyboard (a spatial composition, not a row of boxes: the case file and Party A at the left, the initial claim's
 * numbered allegations and the structured response's sections facing each other across the middle, the two trays
 * under them, Party B at the right and the calendar at the top right; connectors are anchored on the facing edges):
 *  0.00–0.18  separate: the components start gathered in the middle and move apart to their places (no state yet).
 *  0.18–0.43  only the supplied relationships are drawn, one by one, each in its kind's style — no arrowheads
 *             (relation: plain line with end dots; communication: dashed; sequence: solid; causal, with its
 *             arrowhead, only when the author supplies it) — and labelled beside its own connector.
 *  0.43–0.75  a tracer follows the supplied traversal order along the relationships; the focus element (the
 *             response by default) enlarges while the tracer is on it, and its sections are paired one by one with
 *             the allegations they answer (each response row shows the number of its allegation; the pair is
 *             highlighted in both sheets). The order is captioned "Sequence as configured (illustrative)".
 *  0.75–1.00  gather: each section shows its supplied state beside its row — ● admitted or ◆ disputed, equal
 *             weight — the calendar marks the supplied response day, and the keys stay visible. No effect of
 *             admitting or disputing, burden, consequence or outcome is shown.
 * @module animations/civil-claim/LAW-0258
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {personBadge} from '../../primitives/badges.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  CE_DEFAULTS, CE_DEFAULTS_ES, CE_COMMON_ES, CE_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, sectionsOf, stateKeyText, localizeDefaults, boardSheet, stateBadge, caseFileW,
} from './kits/contestacion-estructurada.js';
import {FD_LINK_STYLES, link} from './kits/presentacion-demanda.js';
import {caseFile, letterTray, calendarStrip, glue} from './kits/civil-claim-art.js';

const ID = 'LAW-0258';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W_ = {separate: [0.02, 0.17], relate: [0.19, 0.42], trace: [0.44, 0.72], states: [0.76, 0.82]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** share of a relation label's smaller side kept free between its two components */
const PREFILL = 0.8;
const EL = ['partyA', 'caseFile', 'claim', 'trays', 'partyB', 'response', 'calendar'];

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
  parties: CE_DEFAULTS.parties,
  documents: CE_DEFAULTS.documents,
  stages: CE_DEFAULTS.stages,
  dates: CE_DEFAULTS.dates,
  elements: [
    {id: 'caseFile', label: 'Case file'},
    {id: 'trays', label: 'Claim and response trays'},
    {id: 'calendar', label: 'Calendar (as supplied)'},
  ],
  relationships: [
    {from: 'caseFile', to: 'claim', kind: 'relation', label: 'kept in the case file'},
    {from: 'partyA', to: 'claim', kind: 'relation', label: 'filed by'},
    {from: 'claim', to: 'trays', kind: 'communication', label: 'received'},
    {from: 'trays', to: 'response', kind: 'communication', label: 'answered'},
    {from: 'partyB', to: 'response', kind: 'relation', label: 'written by'},
    {from: 'response', to: 'claim', kind: 'relation', label: 'each section answers one allegation'},
    {from: 'response', to: 'calendar', kind: 'relation', label: 'dated on a supplied day'},
  ],
  focusElement: 'response',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'then (as configured)', causal: 'causal (as supplied)'},
  traversalOrder: ['partyA', 'claim', 'trays', 'response', 'calendar'],
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...CE_COMMON_ES,
  elements: [
    {id: 'caseFile', label: 'Expediente'},
    {id: 'trays', label: 'Bandejas de demanda y contestación'},
    {id: 'calendar', label: 'Calendario (según lo aportado)'},
  ],
  relationships: [
    {from: 'caseFile', to: 'claim', kind: 'relation', label: 'en el expediente'},
    {from: 'partyA', to: 'claim', kind: 'relation', label: 'la presenta'},
    {from: 'claim', to: 'trays', kind: 'communication', label: 'se recibe'},
    {from: 'trays', to: 'response', kind: 'communication', label: 'se contesta'},
    {from: 'partyB', to: 'response', kind: 'relation', label: 'la redacta'},
    {from: 'response', to: 'claim', kind: 'relation', label: 'un apartado por alegación'},
    {from: 'response', to: 'calendar', kind: 'relation', label: 'fecha: un día aportado'},
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
    let L = null;
    // (each text size tries the composition's arrangements in turn — the alternatives only when the first leaves a
    // label without a free spot — before the text steps down)
    for (const k of [1, 0.92, 0.85].filter(k2 => k2 > floorK + 0.03).concat([floorK])) {
      // (square: the alternative arrangements only at full text size — below it the first one relaxes on its own, which
      // keeps the costly square layout within ~1 s)
      for (const pos of k >= 1 || ctx.view.shape !== 'square' ? [POS[ctx.view.shape], ...POS_ALT[ctx.view.shape]] : [POS[ctx.view.shape]]) {
        let q = compose(ctx, Math.max(k, floorK), {}, pos);
        // relation labels without a free spot: their components move further apart, and again
        const rounds = k > floorK && bad(q) >= 4 && k < 1 ? 0 : 3;
        for (let round = 0; round < rounds && bad(q) && Object.keys(q.needGap).length; round++) {
          const pg = {...q.pairGap};
          for (const [key2, v] of Object.entries(q.needGap)) pg[key2] = (pg[key2] || 0) + v;
          const q2 = compose(ctx, Math.max(k, floorK), pg, pos);
          if (bad(q2) <= bad(q)) q = q2; else break;
        }
        if (!L || bad(q) < bad(L)) L = q;
        if (!bad(L)) return L;
      }
      if (k <= floorK) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** normalized anchor positions (centre of each component) per layout */
const POS = {
  landscape: {caseFile: [0.08, 0.16], partyA: [0.09, 0.66], claim: [0.32, 0.36], trays: [0.5, 0.86], response: [0.69, 0.36], partyB: [0.92, 0.66], calendar: [0.88, 0.1]},
  square: {caseFile: [0.08, 0.12], partyA: [0.09, 0.8], claim: [0.36, 0.52], trays: [0.46, 0.91], response: [0.8, 0.56], partyB: [0.92, 0.14], calendar: [0.5, 0.07]},
  portrait: {caseFile: [0.18, 0.07], partyA: [0.18, 0.37], claim: [0.68, 0.24], trays: [0.2, 0.72], response: [0.66, 0.54], partyB: [0.82, 0.86], calendar: [0.32, 0.94]},
};

/** alternative arrangements (tried in order when the first leaves a label without a free spot) */
const POS_ALT = {
  landscape: [],
  square: [
    {caseFile: [0.08, 0.12], partyA: [0.09, 0.82], claim: [0.38, 0.58], trays: [0.5, 0.92], response: [0.8, 0.58], partyB: [0.92, 0.14], calendar: [0.48, 0.07]},
    {caseFile: [0.07, 0.12], partyA: [0.08, 0.6], claim: [0.4, 0.5], trays: [0.3, 0.92], response: [0.8, 0.56], partyB: [0.92, 0.14], calendar: [0.52, 0.07]},
  ],
  portrait: [
    {caseFile: [0.2, 0.06], partyA: [0.16, 0.34], claim: [0.66, 0.2], trays: [0.22, 0.58], response: [0.68, 0.6], partyB: [0.84, 0.88], calendar: [0.32, 0.9]},
    {caseFile: [0.18, 0.07], partyA: [0.18, 0.37], claim: [0.68, 0.24], trays: [0.22, 0.66], response: [0.64, 0.56], partyB: [0.84, 0.82], calendar: [0.4, 0.94]},
    {caseFile: [0.2, 0.07], partyA: [0.16, 0.4], claim: [0.66, 0.22], trays: [0.24, 0.74], response: [0.68, 0.5], partyB: [0.84, 0.88], calendar: [0.3, 0.94]},
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
  const secs = sectionsOf(p);
  const markIdx = Math.max(0, Math.min(p.dates.window.length - 1, p.dates.responseDay));
  // ---- top band: the state key and the "as supplied" key; the sequence caption under the state key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.4, size: keySize, name: 'key'}) : null;
  const stKey = showKey ? gchip(ctx, stateKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  const band1 = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0);
  // the order the tracer follows is captioned as configured (no institutional direction is drawn)
  const seqNote = showKey ? gchip(ctx, `◦ ${ctx.t.sequence}`, {x: 8, y: band1 + 8, anchor: 'start', maxWidth: D.w - 16, size: keySize, minSize: keySize, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: 'seq-note'}) : null;
  const top = showKey ? seqNote.box.y + seqNote.box.h + 10 : 8;
  const U = {w: D.w, h: D.h - top};
  const at = id => ({x: pos[id][0] * U.w, y: top + pos[id][1] * U.h});

  // ---- components (design units); each has a body box for connector anchoring and an optional label chip
  const labelChip = (id, text, cx, y, maxW) => gchip(ctx, text, {x: cx, y, anchor: 'middle', maxWidth: maxW, size: small, minSize: small, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: `el-${id}-lab`});
  const maxLab = shape === 'portrait' ? D.w * 0.42 : shape === 'square' ? D.w * 0.26 : D.w * 0.2;
  const sheetW = shape === 'portrait' ? D.w * 0.44 : shape === 'square' ? D.w * 0.25 : D.w * 0.22;
  const Rp = (shape === 'portrait' ? 84 : shape === 'square' ? 74 : 88) * Math.min(1, 0.5 + sizeK * 0.5);
  const buildEls = at => {
    const els = {};
    // parties: round portraits (Party A filed the claim; Party B writes the response)
    for (const [id, i, look] of [['partyA', 1, looks.b], ['partyB', 0, looks.a]]) {
      const c = at(id);
      const txt = labelOf(id) || partyCaption(p, i);
      const badge = personBadge(ctx, {name: `el-${id}-badge`, x: 0, y: 0, radius: Rp, look});
      const lab = showKey ? labelChip(id, txt, c.x, c.y + Rp + 10, maxLab) : null;
      els[id] = {id, c, body: {x: c.x - Rp, y: c.y - Rp, w: 2 * Rp, h: 2 * Rp}, circle: {x: c.x, y: c.y, r: Rp}, node: g({transform: T(c.x, c.y)}, badge.node || badge), lab};
    }
    // case file (its reference and title printed on it)
    {
      const c = at('caseFile');
      // (a long supplied title widens the file rather than overflowing it)
      const w = caseFileW(ctx, p.documents.caseFile, small, Math.max(small * (p.documents.caseFile.title.length > 40 ? 9.5 : 7.5), 170));
      const cf = caseFile(ctx, {prefix: 'el-cf', w, ref: p.documents.caseFile.ref, title: p.documents.caseFile.title, size: small, showText: showAll});
      const x0 = c.x - w / 2, y1 = c.y + cf.h / 2;
      els.caseFile = {id: 'caseFile', c, body: {x: x0, y: y1 - cf.h, w: w + small * 0.4, h: cf.h}, node: g({transform: T(x0, y1)}, cf.node),
        lab: showKey && labelOf('caseFile') ? labelChip('caseFile', labelOf('caseFile'), c.x, y1 + 10, maxLab) : null, fits: showAll ? [cf.refFit, cf.titleFit] : []};
    }
    // the two sheets: the claim's numbered allegations; the response's sections, each with the number of the
    // allegation it answers (the information that connects them) and, at the gather, its supplied state glyph
    for (const id of ['claim', 'response']) {
      const c = at(id);
      const isR = id === 'response';
      const sh = boardSheet(ctx, {prefix: `el-${id}-sh`, w: sheetW, size: small, title: isR ? p.documents.response.title : p.documents.claim.title,
        rows: isR ? secs.map(s => s.label) : p.documents.claim.allegations, marks: isR ? secs.map((s, i) => `§${i + 1}`) : null, showText: showAll, numSize: small,
        headFill: isR ? th.accent2Soft : undefined});
      const x0 = c.x - sheetW / 2, y0 = c.y - sh.h / 2;
      const rows = sh.rows.map(q => ({x: x0, y: y0 + q.y, w: sheetW, h: q.h}));
      const pins = sh.pins.map(q => ({x: x0 + q.x, y: y0 + q.y}));
      els[id] = {id, c, body: {x: x0, y: y0, w: sheetW + 6, h: sh.h + 8}, node: g({transform: T(x0, y0)}, sh.node), rows, pins,
        lab: showKey && labelOf(id) ? labelChip(id, labelOf(id), c.x, y0 + sh.h + 14, maxLab) : null, fits: showAll ? sh.fits : []};
    }
    // the two trays (claim · response), side by side
    {
      const c = at('trays');
      const w = Math.max(150, small * 6);
      const trs = [0, 1].map(k => letterTray(ctx, {prefix: `el-tr${k}`, w, lipTop: -small * 1.4, rackTop: -small * 4, label: '', size: small, showText: false, plain: true, noIcon: true}));
      const y0 = c.y + small * 2;
      const xs = [c.x - w / 2 - 10, c.x + w / 2 + 10];
      els.trays = {id: 'trays', c, body: {x: c.x - w - 18, y: y0 - small * 4 - 8, w: 2 * w + 36, h: small * 4 + 26}, node: g(null, trs.map((t, k) => g({transform: T(xs[k], y0)}, t.back, t.front))),
        lab: showKey && labelOf('trays') ? labelChip('trays', labelOf('trays'), c.x, y0 + 26, maxLab * 1.7) : null};
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
      const cw = shape === 'portrait' ? D.w * 0.5 : clamp(p.dates.window.length * dayW, D.w * 0.24, D.w * (shape === 'square' ? 0.48 : 0.3));
      let cols = p.dates.window.length;
      while (cols > 1 && cw / cols < dayW - 0.5) cols--;
      if (cols < p.dates.window.length) cols = Math.ceil(p.dates.window.length / Math.ceil(p.dates.window.length / cols));
      const opts = {prefix: 'el-cal', w: cw, cols, days: p.dates.window, title: labelOf('calendar') || '', showTitle: Boolean(labelOf('calendar')) && showKey, size: small, showText: showAll, slotH: small * 1.3};
      const probe = calendarStrip(ctx, {...opts, x: 0, y: 0});
      const cal = calendarStrip(ctx, {...opts, x: c.x - cw / 2, y: c.y - probe.h / 2});
      els.calendar = {id: 'calendar', c, body: {x: c.x - cw / 2, y: c.y - probe.h / 2 - small * 0.9, w: cw, h: probe.h + small * 0.9}, node: cal.node(markIdx), cal, lab: null, fits: showAll ? [cal.titleFit, ...cal.dayFits] : []};
    }
    return els;
  };
  // long supplied labels make the components larger than their slots: each component (with its label) is pushed
  // apart from the others until nothing overlaps, keeping the composition's order
  const groupBox = E => (E.lab ? unionBox(E.body, E.lab.box) : E.body);
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
      if (c0.x < 6) off[id].x += 6 - c0.x;
      if (c0.x + c0.w > D.w - 6) off[id].x -= c0.x + c0.w - (D.w - 6);
      if (c0.y < top) off[id].y += top - c0.y;
      if (c0.y + c0.h > D.h - 6) off[id].y -= c0.y + c0.h - (D.h - 6);
    }
    if (!moved) break;
  }
  const relaxed = ids.some(id => Math.abs(off[id].x) + Math.abs(off[id].y) > 0.5);
  const els = relaxed ? buildEls(id => { const q = at(id); return {x: q.x + off[id].x, y: q.y + off[id].y}; }) : els0;
  const groupsClear = ids.every((a, k) => ids.slice(k + 1).every(b2 => !hit(groupBox(els[a]), groupBox(els[b2]), 4)));
  const inFrame = ids.every(id => { const b = groupBox(els[id]); return b.x >= 4 && b.y >= top - 2 && b.x + b.w <= D.w - 4 && b.y + b.h <= D.h - 4; });

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
    for (let j = 3; j <= 37; j++) {
      const q = cn.at(j / 40);
      const hitE = others.find(e => inB(q, e.body));
      if (hitE) { if (note) crossed.push([hitE.id, rel.from, rel.to]); return true; }
      // (a connector never runs under a label, its own ends' labels included)
      const hitL = labs.find(b => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4);
      if (hitL) { if (note) crossed.push([Object.values(els).find(e => e.lab && e.lab.box === hitL).id, rel.from, rel.to]); return true; }
    }
    return false;
  };
  const made = [];
  const conns = p.relationships.map((rel, i) => {
    const A = els[rel.from], Bx = els[rel.to];
    if (!A || !Bx || rel.from === rel.to) return null;
    // connectors attach to the component together with its label chip (never under the label)
    const withLab = E => (E.lab ? unionBox(E.body, E.lab.box) : E.body);
    const anchor = (E, toward) => (E.circle && !(E.lab && toward.y > E.lab.box.y + E.lab.box.h) ? circlePt(E.circle, toward) : edgeAnchor(withLab(E), toward, 6));
    const from = anchor(A, Bx.c);
    const to = anchor(Bx, A.c);
    // (the bend that passes through no other component or label and crosses the fewest connectors already drawn;
    // communications are drawn solid in their own colour — in this motif a dashed line marks a disputed fact)
    let cn = null, best = Infinity;
    for (const bd of [0.12, -0.12, 0.3, -0.3, 0.45, -0.45, 0.6, -0.6]) {
      const c0 = link(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind === 'communication' ? 'sequence' : rel.kind, bend: bd, color: kindColor(ctx, rel.kind)});
      const score = (crosses(c0, rel) ? 1000 : 0) + made.reduce((n, o2) => n + crossCount(c0, o2.c), 0);
      if (score < best) { best = score; cn = c0; }
      if (score === 0) break;
    }
    crosses(cn, rel, true);
    const out = {rel, i, c: cn};
    made.push(out);
    return out;
  }).filter(Boolean);
  // connector ends are kept clear of every label
  for (const cn of conns) for (const q of [cn.c.from, cn.c.to]) occupied.push({x: q.x - 14, y: q.y - 14, w: 28, h: 28});
  // state glyphs (gather): beside each response row, on the sheet's left margin
  const R0 = small * 0.42;
  const glyphs = secs.map((s, i) => {
    const row = els.response.rows[i];
    return {i, state: s.state, x: row.x - R0 * 1.6, y: row.y + row.h / 2};
  });
  glyphs.forEach(q => occupied.push({x: q.x - R0 * 1.3, y: q.y - R0 * 1.3, w: R0 * 2.6, h: R0 * 2.6}));

  // relation labels: edge labels lying ON their own connector (the connector passes under its own label only), each
  // >= 22 px (1080p) from every other connector and clear of every component, label and connector end
  const relLabels = [];
  if (showAll) {
    const ptsOf = cn => Array.from({length: 61}, (_, jj) => cn.c.at(jj / 60));
    const allPts = conns.map(ptsOf);
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
      let t = null;
      for (const mwK of [1, 0.75, 0.55, 1.45]) {
        const mw = Math.max(baseW * mwK, wordW + small * 1.6);
        const pr = gchip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: small, minSize: small, maxLines: 6});
        for (const f of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) {
          const q = cn.c.at(f);
          const bx = {x: q.x - pr.box.w / 2, y: q.y - pr.box.h / 2, w: pr.box.w, h: pr.box.h};
          if (bx.x < 6 || bx.y < top || bx.x + bx.w > D.w - 6 || bx.y + bx.h > D.h - 6) continue;
          if (occupied.some(z => hit(bx, z, 4)) || ends.some(z => hit(bx, z, 0))) continue;
          if (others.some(P => dBox(bx, P) < 22 / pxPer)) continue;
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
          const c = placeTag(ctx, {name: `rl${cn.i}`, text, anchor, occupied: obs, bounds: {x: 6, y: top, w: D.w - 12, h: D.h - top - 6}, maxWidth: baseW, size: small, color: kindColor(ctx, cn.rel.kind), maxLead: 36 / pxPer});
          if (c.clear && others.every(P => dBox(c.box, P) >= dBox(c.box, allPts[k]) + 22 / pxPer)) { t = c; break; }
        }
      }
      if (!t) {
        // (no free spot: the label sits at the connector's middle and the layout reports it, so the components move apart)
        const q = cn.c.at(0.5);
        const c = gchip(ctx, text, {x: q.x, y: q.y, anchor: 'middle', maxWidth: Math.max(baseW, wordW + small * 1.6), size: small, minSize: small, maxLines: 6, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), color: th.ink, weight: 700, name: `rl${cn.i}-chip`});
        t = {node: g({name: `rl${cn.i}`, opacity: 0}, c.node), box: c.box, fit: c.fit, clear: false};
      }
      occupied.push(t.box);
      relLabels.push({i: cn.i, ...t});
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
  const connectorGaps = conns.map(x => r(Math.max(edgeGap(els[x.rel.from], x.c.from), edgeGap(els[x.rel.to], x.c.to)), 1));
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
  return {crossedN: crossed.length, crossedWhat: crossed.map(x => x.join('>')), hitEl, clashes, showAll, sizeK, needGap, pairGap, groupsClear, inFrame, els, conns, relLabels, key, stKey, seqNote, route, markIdx, connectorGaps, labelsClear, faces, labelBoxes, truncated, small, top, glyphs, R0, secs,
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

/** How many times two connectors cross (sampled polylines; crossings next to a shared end do not count). */
function crossCount(a, b) {
  const P = c => Array.from({length: 31}, (_, j) => c.at(j / 30));
  const pa = P(a), pb = P(b);
  const near = (q, r2) => Math.hypot(q.x - r2.x, q.y - r2.y) < 30;
  const ends = [a.from, a.to].filter(q => near(q, b.from) || near(q, b.to));
  const x = (p1, p2, p3, p4) => { const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x); if (!d) return null; const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d, u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? {x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y)} : null; };
  let n = 0;
  for (let i = 0; i < 30; i++) for (let j = 0; j < 30; j++) { const q = x(pa[i], pa[i + 1], pb[j], pb[j + 1]); if (q && !ends.some(e => Math.hypot(q.x - e.x, q.y - e.y) < 40)) n++; }
  return n;
}

function unionBox(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y};
}

function circlePt(c, toward) {
  const a = Math.atan2(toward.y - c.y, toward.x - c.x);
  return {x: c.x + (c.r + 6) * Math.cos(a), y: c.y + (c.r + 6) * Math.sin(a)};
}

/** The pairing beat: while the tracer is on the response, its sections are paired one by one with their allegations. */
function pairWindow(L) {
  const v = L.route.visits.find(x => x.id === 'response');
  const at = v ? visitU(L, 'response') : W_.states[0] - 0.01;
  // the pairing starts when the tracer reaches the response (never before) and ends by the gather
  const a = Math.min(at, W_.states[0] - 0.08);
  return [a, Math.min(a + 0.12, W_.states[0])];
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const {els} = L;
  const hl = (id, rows) => rows.map((q, k) => h('rect', {name: `hl-${id}${k}`, x: r(q.x + 2), y: r(q.y + 1), width: r(q.w - 4), height: r(q.h - 2), rx: 4, fill: 'none', stroke: th.accent2, 'stroke-width': 3.5, opacity: 0}));
  return g(null,
    L.conns.map(x => x.c.node),
    Object.values(els).map(e => g({name: `el-${e.id}`}, g({name: `el-${e.id}-in`},
      e.id === 'claim' || e.id === 'response' ? g(null, e.node, g({name: `el-${e.id}-hl`}, hl(e.id, e.rows))) : e.node,
      // each response row's answer pin carries the number of the allegation it answers
      e.id === 'response' ? L.secs.map((s, i) => g({name: `ans-${i}`, opacity: 0},
        h('circle', {cx: r(e.pins[i].x), cy: r(e.pins[i].y), r: r(L.small * 0.68), fill: th.paper, stroke: th.ink, 'stroke-width': 2.4}),
        L.showAll && h('text', {x: r(e.pins[i].x), y: r(e.pins[i].y + L.small * 0.34), 'text-anchor': 'middle', 'font-size': r(L.small), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(s.refers + 1)))) : null))),
    Object.values(els).map(e => e.lab && g({name: `el-${e.id}-labg`, opacity: 0}, e.lab.node)),
    L.glyphs.map(q => stateBadge(ctx, {name: `st-bd${q.i}`, state: q.state, x: q.x, y: q.y, R: L.R0})),
    // (the tracer runs along the connectors, under their edge labels: it never covers a label's text)
    g({name: 'tracer', opacity: 0},
      h('circle', {r: 22, fill: th.accent2, opacity: 0.18}),
      h('circle', {r: 11, fill: th.paper, stroke: th.ink, 'stroke-width': 3})),
    L.relLabels.map(t => t.node),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
    L.seqNote && g({name: 'seq-noteg', opacity: 0}, L.seqNote.node),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const nodes = {};
  const sepP = ease.inOutCubic(seg(u, ...W_.separate));
  // separate: components move out from the centre to their places
  for (const e of Object.values(L.els)) {
    const dx = (L.centre.x - e.c.x) * (1 - sepP) * 0.1, dy = (L.centre.y - e.c.y) * (1 - sepP) * 0.1;
    nodes[`el-${e.id}`] = {transform: T(dx, dy), opacity: r(0.35 + 0.65 * sepP, 3)};
    if (e.lab) nodes[`el-${e.id}-labg`] = {opacity: r(seg(u, 0.15, 0.2), 3)};
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
  nodes.tracer = {transform: T(q.x, q.y), opacity: trVis ? 1 : 0};
  const visited = tr > 0 ? L.route.visits.filter(v => trE >= v.t - 1e-6).map(v => v.id) : [];
  // focus element enlarges while the tracer is near it
  const fv = L.route.visits.find(v => v.id === p.focusElement);
  let focusScale = 1;
  if (fv && tr > 0) {
    const d = Math.abs(trE - fv.t);
    focusScale = 1 + 0.06 * clamp(1 - d / 0.12) * (u <= W_.trace[1] + 0.02 ? 1 : 0);
  }
  // pairing: section i and the allegation it answers are highlighted together, one pair at a time; each response
  // row's answer number appears with its pair and stays
  const [pa, pb] = pairWindow(L);
  const nS = L.secs.length;
  let pairActive = -1;
  L.secs.forEach((s, i) => {
    const w0 = pa + ((pb - pa) * i) / nS, w1 = pa + ((pb - pa) * (i + 1)) / nS;
    const on = u >= w0 && u < w1 ? Math.sin(Math.PI * seg(u, w0, w1)) : 0;
    if (u >= w0 && u < w1) pairActive = i;
    nodes[`ans-${i}`] = {opacity: r(seg(u, w0, w0 + (w1 - w0) * 0.5), 3)};
    nodes[`hl-response${i}`] = {opacity: r(on * 0.9, 3)};
  });
  // (a claim row lights while any section answering it is paired)
  const claimN = L.els.claim.rows.length;
  for (let k = 0; k < claimN; k++) nodes[`hl-claim${k}`] = {opacity: r(pairActive >= 0 && L.secs[pairActive].refers === k ? (nodes[`hl-response${pairActive}`].opacity) : 0, 3)};
  for (const e of Object.values(L.els)) nodes[`el-${e.id}-in`] = {transform: e.id === p.focusElement ? scaleAbout(e.c.x, e.c.y, focusScale) : ''};
  const calOpen = seg(u, 0.04, 0.16);
  const stP = seg(u, ...W_.states);
  // the supplied response day is marked at the gather, after the pairing
  const markP = seg(u, W_.states[0], W_.states[0] + 0.04);
  Object.assign(nodes, L.els.calendar.cal.frame(calOpen, markP, L.markIdx).nodes);
  L.glyphs.forEach(g0 => { nodes[`st-bd${g0.i}`] = {opacity: r(stP, 3)}; });
  if (L.seqNote) nodes['seq-noteg'] = {opacity: r(seg(u, W_.trace[0] - 0.02, W_.trace[0]), 3)};
  const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
  return {
    nodes,
    semantic: {
      beat, separated: r(sepP, 3), relationsDrawn: relP.map(v => r(v, 3)), tracerVisible: trVis, tracer: {x: r(q.x), y: r(q.y)},
      visitOrder: visited, focusScale: r(focusScale, 3), calOpen: r(calOpen, 3), markP: r(markP, 3),
      pairActive, answersShown: L.secs.map((s, i) => r(nodes[`ans-${i}`].opacity, 3)), refers: L.secs.map(s => s.refers), states: L.secs.map(s => s.state),
      stateShown: r(stP, 3), connectorGaps: L.connectorGaps,
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
    slug: 'civil-claim-05-mechanism',
    title: 'Structured response — how each section of the response is connected to the allegation it answers',
    titleEs: 'Contestación estructurada — Mecanismo o relación explicada',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Contestación estructurada',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A spatial composition of the components — the case file, Party A, the initial claim’s numbered allegations, the claim and response trays, the structured response, Party B and the calendar. Only the supplied relationships are drawn, each in its kind’s style without arrowheads (a causal link only when supplied) and labelled beside its connector; a tracer follows the supplied order, captioned “Sequence as configured (illustrative)”, while the response enlarges and pairs each section with the allegation it answers (the allegation’s number on the section’s row). At the gather each section shows its supplied state — ● admitted or ◆ disputed, equal weight — and the calendar marks the supplied day. No effect of admitting or disputing, burden, consequence or outcome is shown.',
    tags: ['structured response', 'mechanism', 'relationships', 'allegations', 'sections', 'admitted fact', 'disputed fact', 'tracer', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/contestacion-estructurada.js', 'src/animations/civil-claim/kits/presentacion-demanda.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/primitives/badges.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CE_STRINGS,
  scene,
});
