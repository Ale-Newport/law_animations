/**
 * LAW-0250 — Presentación de demanda · mechanism
 *
 * Storyboard (a spatial loop, not a row of boxes: the case file and Party A at
 * the left, the written filing and the registry intake tray along the top, the
 * registry clerk at the right, the stamped reference at the lower right and
 * the registry calendar in the middle, so the supplied relationships run from
 * the filing party to the reference and the entry day):
 *  0.00–0.18  separate: the components start gathered in the middle and move
 *             apart to their places (no state is shown yet).
 *  0.18–0.43  only the supplied relationships are drawn, one by one, each in
 *             its kind's style — no arrowheads (relation: plain line with end
 *             dots; communication: dashed; sequence: solid; causal, with its
 *             arrowhead, only when the author supplies it) — and labelled
 *             beside its own connector.
 *  0.43–0.75  a tracer (a small filing) follows the supplied traversal order
 *             along the relationships; the focus element (the reference by
 *             default) enlarges while the tracer is on it; the reference is
 *             stamped only when the tracer reaches it. The order is captioned
 *             "Sequence as configured (illustrative)".
 *  0.75–1.00  gather: states stay visible beside their elements — handed in at
 *             the filing, and at the reference the supplied registered state
 *             with the supplied day (the entry glyph in the calendar) — plus
 *             the "as supplied · no conclusion drawn" key. Without a supplied
 *             clerk–reference relationship the filing stays a draft (as
 *             supplied): the reference box stays blank, no entry is marked.
 *             No filing rule, deadline, fee, court or effect is shown.
 * @module animations/civil-claim/LAW-0250
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  FD_DEFAULTS, FD_STRINGS, FD_LINK_STYLES, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, entryDayLabel, filingSheet, referenceCard, link,
  localizeDefaults, FD_COMMON_ES, FD_DEFAULTS_ES,
} from './kits/presentacion-demanda.js';
import {caseFile, letterTray, calendarStrip, fitG, glue} from './kits/civil-claim-art.js';

const ID = 'LAW-0250';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W_ = {separate: [0.02, 0.17], relate: [0.19, 0.42], trace: [0.44, 0.72], states: [0.76, 0.82], key: [0.02, 0.08]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
const EL = ['partyA', 'caseFile', 'filing', 'intake', 'clerk', 'calendar', 'reference'];

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
  parties: FD_DEFAULTS.parties,
  documents: FD_DEFAULTS.documents,
  stages: FD_DEFAULTS.stages,
  dates: FD_DEFAULTS.dates,
  elements: [
    {id: 'caseFile', label: 'Case file'},
    {id: 'filing', label: 'Written filing'},
    {id: 'intake', label: 'Registry intake'},
    {id: 'calendar', label: 'Registry calendar'},
    {id: 'reference', label: 'Reference box'},
  ],
  relationships: [
    {from: 'caseFile', to: 'partyA', kind: 'relation', label: 'kept by'},
    {from: 'partyA', to: 'filing', kind: 'sequence', label: 'signs'},
    {from: 'filing', to: 'intake', kind: 'communication', label: 'handed in'},
    {from: 'intake', to: 'clerk', kind: 'relation', label: 'received at the desk'},
    {from: 'clerk', to: 'reference', kind: 'sequence', label: 'stamps the reference'},
    {from: 'reference', to: 'calendar', kind: 'relation', label: 'entry on a supplied day'},
  ],
  focusElement: 'reference',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'then (as configured)', causal: 'causal (as supplied)'},
  traversalOrder: ['partyA', 'filing', 'intake', 'clerk', 'reference', 'calendar'],
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...FD_COMMON_ES,
  elements: [
    {id: 'caseFile', label: 'Expediente'},
    {id: 'filing', label: 'Escrito'},
    {id: 'intake', label: 'Entrada del registro'},
    {id: 'calendar', label: 'Calendario del registro'},
    {id: 'reference', label: 'Casilla de referencia'},
  ],
  relationships: [
    {from: 'caseFile', to: 'partyA', kind: 'relation', label: 'lo guarda'},
    {from: 'partyA', to: 'filing', kind: 'sequence', label: 'firma'},
    {from: 'filing', to: 'intake', kind: 'communication', label: 'se entrega'},
    {from: 'intake', to: 'clerk', kind: 'relation', label: 'se recibe en la mesa'},
    {from: 'clerk', to: 'reference', kind: 'sequence', label: 'estampa la referencia'},
    {from: 'reference', to: 'calendar', kind: 'relation', label: 'asiento en un día aportado'},
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
    const bad = z => z.relLabels.filter(t => !t.clear).length + Object.values(z.states).filter(t => !t.clear).length + (z.groupsClear ? 0 : 1) + z.crossedN;
    let L = null;
    for (const k of [1, 0.92, 0.85].filter(k2 => k2 > floorK + 0.03).concat([floorK])) {
      let q = compose(ctx, Math.max(k, floorK));
      // relation labels or state tags without a free spot: their components move further apart, and again
      // (a size that leaves many labels without a spot is not worth relaxing: the next, smaller size is tried at once)
      const rounds = k > floorK && bad(q) >= 4 ? 0 : 5;
      for (let round = 0; round < rounds && (bad(q) || q.crossedN) && Object.keys(q.needGap).length; round++) {
        const pg = {...q.pairGap};
        for (const [key2, v] of Object.entries(q.needGap)) {
          if (key2.startsWith('__')) { const id = key2.slice(2); for (const o2 of Object.keys(q.els)) if (o2 !== id) pg[`${id}|${o2}`] = Math.max(pg[`${id}|${o2}`] || 0, v); } else pg[key2] = (pg[key2] || 0) + v;
        }
        const q2 = compose(ctx, Math.max(k, floorK), pg);
        if (bad(q2) <= bad(q)) q = q2; else break;
      }
      if (!L || bad(q) < bad(L)) L = q;
      if (!bad(L) || k <= floorK) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** normalized anchor positions (centre of each component) per layout */
const POS = {
  landscape: {caseFile: [0.07, 0.24], partyA: [0.11, 0.66], filing: [0.28, 0.26], intake: [0.66, 0.24], clerk: [0.9, 0.44], calendar: [0.42, 0.7], reference: [0.76, 0.84]},
  square: {caseFile: [0.1, 0.16], partyA: [0.12, 0.7], filing: [0.33, 0.3], intake: [0.8, 0.2], clerk: [0.87, 0.52], calendar: [0.5, 0.7], reference: [0.82, 0.92]},
  portrait: {caseFile: [0.2, 0.1], partyA: [0.2, 0.38], filing: [0.7, 0.1], intake: [0.78, 0.4], clerk: [0.52, 0.62], calendar: [0.5, 0.9], reference: [0.2, 0.68]},
};

function compose(ctx, sizeK = 1, pairGap = {}) {
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
  // registered only when the author supplies a clerk–reference relationship; otherwise the filing stays a draft (as supplied)
  const stamped = p.relationships.some(q => (q.to === 'reference' && q.from === 'clerk') || (q.from === 'reference' && q.to === 'clerk'));
  const plan = stamped ? 'registered' : 'draft';
  const markIdx = Math.max(0, Math.min(p.dates.window.length - 1, p.dates.entryDay));
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.4, size: Math.max(small, 16.2 / pxPer), name: 'key'}) : null;
  // the order the tracer follows is captioned as configured (no institutional direction is drawn)
  const seqNote = showKey ? gchip(ctx, `◦ ${ctx.t.sequence}`, {x: 8, y: 8, anchor: 'start', maxWidth: key ? D.w - 32 - key.box.w : D.w * 0.5, size: Math.max(small, 16.2 / pxPer), minSize: Math.max(small, 16.2 / pxPer), maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: 'seq-note'}) : null;
  const band = Math.max(key ? key.box.h : 0, seqNote ? seqNote.box.h : 0);
  const top = 8 + (key ? band + 8 : 0);
  const U = {w: D.w, h: D.h - top};
  const at = id => ({x: POS[shape][id][0] * U.w, y: top + POS[shape][id][1] * U.h});

  // ---- components (design units); each has a body box for connector anchoring and an optional label chip
  const labelChip = (id, text, cx, y, maxW) => gchip(ctx, text, {x: cx, y, anchor: 'middle', maxWidth: maxW, size: small, minSize: small, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: `el-${id}-lab`});
  const maxLab = shape === 'portrait' ? D.w * 0.42 : shape === 'square' ? D.w * 0.26 : D.w * 0.22;
  const Rp = (shape === 'portrait' ? 96 : shape === 'square' ? 92 : 100) * Math.min(1, 0.5 + sizeK * 0.5);
  const buildEls = at => {
    const els = {};
    // parties: round portraits
    for (const [id, i] of [['partyA', 0], ['clerk', 1]]) {
      const c = at(id);
      const txt = labelOf(id) || partyCaption(p, i);
      const badge = personBadge(ctx, {name: `el-${id}-badge`, x: 0, y: 0, radius: Rp, look: i ? looks.b : looks.a});
      const lab = showKey ? labelChip(id, txt, c.x, c.y + Rp + 10, maxLab) : null;
      els[id] = {id, c, body: {x: c.x - Rp, y: c.y - Rp, w: 2 * Rp, h: 2 * Rp}, circle: {x: c.x, y: c.y, r: Rp}, node: g({transform: T(c.x, c.y)}, badge.node || badge), lab};
    }
    // case file (its reference and title printed on it)
    {
      const c = at('caseFile');
      const w = Math.max(small * 8.2, 180);
      const cf = caseFile(ctx, {prefix: 'el-cf', w, ref: p.documents.caseFile.ref, title: p.documents.caseFile.title, size: small, showText: showAll});
      const x0 = c.x - w / 2, y1 = c.y + cf.h / 2;
      els.caseFile = {id: 'caseFile', c, body: {x: x0, y: y1 - cf.h, w: w + small * 0.4, h: cf.h}, node: g({transform: T(x0, y1)}, cf.node),
        lab: showKey && labelOf('caseFile') ? labelChip('caseFile', labelOf('caseFile'), c.x, y1 + 10, maxLab) : null, fits: [cf.refFit, cf.titleFit]};
    }
    // the written filing: a compact sheet (filler lines, a blank reference box); its supplied contents and date line are
    // printed on a card beside it
    {
      const c = at('filing');
      const lw = 180;
      const fs = filingSheet(ctx, {prefix: 'el-fl', w: lw, size: 18, barsOnly: true, title: 'x', dated: 'x', reference: 'x', signer: p.parties[0].name, showText: true, lipCover: 8});
      const lx = c.x - lw / 2, ly = c.y + fs.h / 2;
      const cardText = [p.documents.filing.title, p.documents.filing.dated];
      const cardW = shape === 'portrait' ? D.w * 0.44 : shape === 'square' ? D.w * 0.25 : D.w * 0.19;
      const fits = cardText.map((t, k) => fitG(t, {maxWidth: cardW - small * 1.2, size: small, minSize: small, maxLines: 9, weight: k === 0 ? 700 : 500}));
      els.filing = {id: 'filing', c, body: {x: lx, y: ly - fs.h, w: lw + 6, h: fs.h + 8}, node: g({transform: T(c.x, ly)}, fs.body),
        lab: showKey && labelOf('filing') ? labelChip('filing', labelOf('filing'), c.x, ly + 10, maxLab) : null, card: showAll ? {fits, w: cardW} : null};
    }
    // the registry intake tray (plain plate; its label is the component label); the handed-in filing appears in it
    {
      const c = at('intake');
      const w = 250;
      const tr = letterTray(ctx, {prefix: 'el-tr', w, lipTop: -34, rackTop: -120, label: '', size: 20, showText: false, plain: true, noIcon: true});
      const fs = filingSheet(ctx, {prefix: 'el-tl', w: 130, size: 14, barsOnly: true, title: 'x', dated: 'x', reference: 'x', signer: 'x', showText: true, lipCover: 8});
      const y0 = c.y + 60;
      const topY = Math.min(y0 - 132, y0 + 20 - fs.h - 4);
      els.intake = {id: 'intake', c, body: {x: c.x - w / 2 - 6, y: topY, w: w + 12, h: y0 - topY}, node: g({transform: T(c.x, y0)}, tr.back, g({name: 'el-tr-letter', opacity: 0, transform: T(0, 20)}, fs.body), tr.front),
        lab: showKey && labelOf('intake') ? labelChip('intake', labelOf('intake'), c.x, y0 + 10, maxLab) : null};
    }
    // the reference box: blank until the tracer reaches it; then (registered only) the supplied reference is stamped in
    {
      const c = at('reference');
      const w = Math.max(small * 9, Math.min(maxLab, 300));
      const rc = referenceCard(ctx, {name: 'el-ref', w, size: small, text: p.documents.reference, showText: showAll, stamped: false});
      const labH0 = showKey && labelOf('reference') ? labelChip('reference', labelOf('reference'), 0, 0, maxLab).box.h : 0;
      c.y = Math.min(c.y, D.h - 10 - rc.h / 2 - 10 - labH0);
      const x0 = c.x - w / 2, y0 = c.y - rc.h / 2;
      els.reference = {id: 'reference', c, body: {x: x0, y: y0, w: w + 4, h: rc.h + 5}, node: g({transform: T(x0, y0)}, rc.node),
        lab: showKey && labelOf('reference') ? labelChip('reference', labelOf('reference'), c.x, y0 + rc.h + 10, maxLab) : null, fits: [rc.fit]};
    }
    // the registry calendar (open from the start; the entry glyph drops in when the reference is stamped)
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
      // (square and wide frames: the strip widens a little rather than wrapping its last days onto a second row)
      const cw = shape === 'portrait' ? D.w * 0.86 : clamp(p.dates.window.length * dayW, D.w * 0.36, D.w * (shape === 'square' ? (p.dates.window.length > 5 ? 0.4 : 0.56) : 0.5));
      let cols = p.dates.window.length;
      while (cols > 1 && cw / cols < dayW) cols--;
      const probe = calendarStrip(ctx, {prefix: 'el-cal', x: 0, y: 0, w: cw, cols, days: p.dates.window, title: labelOf('calendar') || '', showTitle: Boolean(labelOf('calendar')) && showKey, size: small, showText: showAll, slotH: small * 1.3});
      const cal = calendarStrip(ctx, {prefix: 'el-cal', x: c.x - cw / 2, y: c.y - probe.h / 2, w: cw, cols, days: p.dates.window, title: labelOf('calendar') || '', showTitle: Boolean(labelOf('calendar')) && showKey, size: small, showText: showAll, slotH: small * 1.3});
      els.calendar = {id: 'calendar', c, body: {x: c.x - cw / 2, y: c.y - probe.h / 2 - small * 0.7, w: cw, h: probe.h + small * 0.7}, node: cal.node(markIdx), cal, lab: null, fits: [cal.titleFit, ...cal.dayFits]};
    }


    return els;
  };
  // long supplied labels make the components larger than their slots: each component (with its label and, for the
  // filing, its card) is pushed apart from the others until nothing overlaps, keeping the loop's order
  const groupBox = E => {
    let b = E.lab ? unionBox(E.body, E.lab.box) : E.body;
    if (E.card) {
      const hh = E.card.fits.reduce((a, f) => a + f.height, 0) + small * 1.6;
      const lb = E.lab ? E.lab.box : {x: E.body.x, y: E.body.y + E.body.h, w: E.body.w, h: 0};
      const cb = shape === 'portrait' ? {x: Math.min(E.c.x - E.card.w / 2, D.w * 0.8 - E.card.w), y: lb.y + lb.h + 12, w: E.card.w, h: hh}
        : {x: Math.max(E.body.x + E.body.w, lb.x + lb.w) + 18, y: E.body.y, w: E.card.w, h: hh};
      b = unionBox(b, cb);
    }
    return b;
  };
  const els0 = buildEls(at);
  const ids = Object.keys(els0);
  const off = Object.fromEntries(ids.map(id => [id, {x: 0, y: 0}]));
  const gb = Object.fromEntries(ids.map(id => [id, groupBox(els0[id])]));
  const cur = id => ({x: gb[id].x + off[id].x, y: gb[id].y + off[id].y, w: gb[id].w, h: gb[id].h});
  const gapK = 12;
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

  // ---- connectors (only the supplied relationships), anchored on the facing edges of their components
  const occupied = [];
  for (const e of Object.values(els)) { occupied.push(e.body); if (e.lab) occupied.push(e.lab.box); }
  if (key) occupied.push(key.box);
  if (seqNote) occupied.push(seqNote.box);
  // the filing card: beside the filing, in free space
  if (els.filing.card) {
    const e = els.filing;
    const card = e.card;
    const hh = card.fits.reduce((a, f) => a + f.height, 0) + small * 1.6;
    // below the filing's label first (the route to the tray leaves the filing's right edge), then beside it
    const lb = e.lab ? e.lab.box : {x: e.body.x, y: e.body.y + e.body.h, w: e.body.w, h: 0};
    const cands = shape === 'portrait'
      ? [[Math.min(e.c.x - card.w / 2, D.w * 0.8 - card.w), lb.y + lb.h + 12], [D.w * 0.76 - card.w, lb.y + lb.h + 12], [D.w - 8 - card.w, lb.y + lb.h + 12], [D.w - 8 - card.w, lb.y + lb.h + 40]]
      : [[Math.max(e.body.x + e.body.w, lb.x + lb.w) + 18, e.body.y], [e.body.x + e.body.w + 18, e.body.y], [e.c.x - card.w / 2, lb.y + lb.h + 12], [Math.max(e.body.x + e.body.w, lb.x + lb.w) + 18, e.body.y + 20],
        [Math.max(e.body.x + e.body.w, lb.x + lb.w) + 18, e.body.y + 60], [Math.max(e.body.x + e.body.w, lb.x + lb.w) + 18, e.body.y + 100], [e.body.x, lb.y + lb.h + 12]];
    let best = null;
    for (const [x, y] of cands) {
      const b = {x, y, w: card.w, h: hh};
      if (b.x < 6 || b.y < top || b.x + b.w > D.w - 6 || b.y + b.h > D.h - 6) continue;
      if (!occupied.some(o => hit(o, b, 8))) { best = b; break; }
      if (!best) best = b;
    }
    card.box = best || {x: e.body.x + e.body.w + 16, y: e.body.y, w: card.w, h: hh};
    occupied.push(card.box);
  }
  // does a connector pass through a component other than its own two ends?
  const crossed = [];
  const crosses = (cn, rel, note = false) => {
    const inB = (q, b) => q.x > b.x - 10 && q.x < b.x + b.w + 10 && q.y > b.y - 10 && q.y < b.y + b.h + 10;
    const others = Object.values(els).filter(e => e.id !== rel.from && e.id !== rel.to);
    for (let j = 3; j <= 37; j++) {
      const q = cn.at(j / 40);
      const hitE = others.find(e => inB(q, e.body));
      if (hitE) { if (note) crossed.push([hitE.id, rel.from, rel.to]); return true; }
    }
    return false;
  };
  const conns = p.relationships.map((rel, i) => {
    const A = els[rel.from], Bx = els[rel.to];
    if (!A || !Bx) return null;
    // connectors attach to the component together with its label chip (never under the label)
    const withLab = E => (E.lab ? unionBox(E.body, E.lab.box) : E.body);
    // (a portrait whose link leaves below its name label starts at the label's edge, never under the label)
    const anchor = (E, toward) => (E.circle && !(E.lab && toward.y > E.lab.box.y + E.lab.box.h) ? circlePt(E.circle, toward) : edgeAnchor(withLab(E), toward, 6));
    const from = anchor(A, Bx.c);
    const to = anchor(Bx, A.c);
    // the filing's route to the intake tray arcs clear of the filing card (over it on wide frames, round the right
    // margin on tall ones)
    const isLT = (rel.from === 'filing' && rel.to === 'intake') || (rel.from === 'intake' && rel.to === 'filing');
    if (isLT) {
      const Lb = els.filing.body, Tb = els.intake.body;
      let f2, t2, k1, k2;
      if (shape === 'portrait') {
        f2 = {x: Lb.x + Lb.w + 6, y: Lb.y + Lb.h * 0.35};
        t2 = {x: Tb.x + Tb.w - 30, y: Tb.y - 6};
        k1 = {x: Math.min(D.w - 14, f2.x + 110), y: f2.y + 20};
        k2 = {x: Math.min(D.w - 14, t2.x + 90), y: t2.y - 120};
      } else {
        f2 = {x: Lb.x + Lb.w - 24, y: Lb.y - 6};
        t2 = {x: Tb.x + 24, y: Tb.y - 6};
        const up = Math.max(top + 6, Math.min(Lb.y, Tb.y) - 90);
        k1 = {x: f2.x + 80, y: up};
        k2 = {x: t2.x - 80, y: up};
      }
      const [a, b] = rel.from === 'filing' ? [f2, t2] : [t2, f2];
      const [q1, q2] = rel.from === 'filing' ? [k1, k2] : [k2, k1];
      return {rel, i, c: link(ctx, {name: `rel-c${i}`, from: a, to: b, kind: rel.kind, c1: q1, c2: q2, color: kindColor(ctx, rel.kind)})};
    }
    // on tall frames the filing party's link to the filing arcs above the filing card
    const up = shape === 'portrait' && ((rel.from === 'partyA' && rel.to === 'filing') || (rel.to === 'partyA' && rel.from === 'filing'));
    const bend0 = up ? (rel.from === 'partyA' ? -0.28 : 0.28) : 0.12;
    // (a bend that passes through another component is replaced by one that does not, when there is one)
    let cn = null;
    for (const bd of [bend0, -bend0, 0.3, -0.3, 0.45, -0.45, 0.6, -0.6]) {
      const c0 = link(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind, bend: bd, color: kindColor(ctx, rel.kind)});
      if (!cn) cn = c0;
      if (!crosses(c0, rel)) { cn = c0; break; }
    }
    crosses(cn, rel, true);
    return {rel, i, c: cn};
  }).filter(Boolean);
  // connector ends are kept clear of every label
  for (const cn of conns) for (const q of [cn.c.from, cn.c.to]) occupied.push({x: q.x - 14, y: q.y - 14, w: 28, h: 28});
  // state tags first (they have only a few spots beside their own element; the relation labels can move along
  // their connectors), then the relation labels
  // state tags (gather): at the filing "handed in" (or the draft state), at the reference "registered · day"
  const states = {};
  if (showKey) {
    const allLines = conns.flatMap(cn => Array.from({length: 25}, (_, j) => { const q = cn.c.at(j / 24); return {x: q.x - 9, y: q.y - 9, w: 18, h: 18}; }));
    const add = (name, text, anchors, color) => {
      let t = null;
      // (a wider, flatter tag is tried when no anchor finds a free spot for the narrow one)
      for (const mwK of shape === 'portrait' ? [1] : [1, 1.45]) {
        for (const anchor of anchors) {
          const c = placeTag(ctx, {name, text, anchor, occupied: [...occupied, ...allLines], bounds: {x: 6, y: top, w: D.w - 12, h: D.h - top - 6}, maxWidth: shape === 'portrait' ? D.w * 0.45 : D.w * 0.2 * mwK, size: small, color, maxLead: 36 / pxPer});
          if (!t || (c.clear && !t.clear)) t = c;
          if (c.clear) break;
        }
        if (t && t.clear) break;
      }
      occupied.push(t.box);
      states[name] = t;
    };
    const fb = els.filing.body, rb = els.reference.body;
    add('st-sent', plan === 'registered' ? p.stages.sent : p.stages.draft, [{x: fb.x + fb.w * 0.5, y: fb.y + 2}, {x: fb.x + 4, y: fb.y + 8}, {x: fb.x + fb.w - 4, y: fb.y + 20}, {x: fb.x + 4, y: fb.y + fb.h * 0.5}, {x: fb.x + 4, y: fb.y + fb.h - 10}, {x: fb.x + fb.w - 4, y: fb.y + fb.h * 0.5}, {x: fb.x + fb.w * 0.3, y: fb.y + 2}], th.inkSoft);
    if (plan === 'registered') add('st-outcome', `${p.stages.registered} · ${entryDayLabel(p)}`, [{x: rb.x + 6, y: rb.y + rb.h - 8}, {x: rb.x + 6, y: rb.y + 10}, {x: rb.x + rb.w - 6, y: rb.y + 10}, {x: rb.x + rb.w - 6, y: rb.y + rb.h * 0.5}, {x: rb.x + rb.w - 6, y: rb.y + rb.h - 8}, {x: rb.x + rb.w * 0.5, y: rb.y + 4}, {x: rb.x + rb.w * 0.5, y: rb.y + rb.h - 4}], th.accent2);
  }

  // relation labels: beside their own connector (short leader from the connector midpoint)
  const relLabels = [];
  if (showAll) {
    // every other connector is an obstacle for a relation label (a label sits beside its OWN connector only)
    // (other connectors keep a margin around them, so that the nearest connector to a label is always its own)
    const lineBoxes = conns.map(cn => Array.from({length: 25}, (_, j) => { const q = cn.c.at(j / 24); return {x: q.x - 22, y: q.y - 22, w: 44, h: 44}; }));
    for (const cn of conns) {
      const text = cn.rel.label || p.relationLabels[cn.rel.kind] || cn.rel.kind;
      const others = conns.flatMap((o2, j) => (o2 === cn ? [] : lineBoxes[j]));
      // (no label over any connector's end or arrowhead, its own included)
      const ends = conns.flatMap(o2 => [o2.c.at(0), o2.c.at(1), o2.c.from, o2.c.to].filter(Boolean)).map(q => ({x: q.x - 22, y: q.y - 22, w: 44, h: 44}));
      others.push(...ends);
      // anchored on its own connector: the middle first, then further along it when the middle has no free spot
      let t = null;
      // (a wide margin round the other connectors first; a thin one when nothing is free with the wide one)
      const thin = conns.flatMap((o2, j) => (o2 === cn ? [] : o2.c ? Array.from({length: 25}, (_, jj) => { const q = o2.c.at(jj / 24); return {x: q.x - 9, y: q.y - 9, w: 18, h: 18}; }) : [])).concat(others.slice(-conns.length * 4));
      // (a label reads as its own connector's: it lies clearly nearer to it than to any other connector)
      const pts = o2 => Array.from({length: 61}, (_, jj) => o2.c.at(jj / 60));
      const ownPts = pts(cn), otherPts = conns.filter(o2 => o2 && o2 !== cn && o2.c).map(pts);
      const dBox = (b, P) => Math.min(...P.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
      const ownest = b => { const own = dBox(b, ownPts); return own <= 38 / pxPer && otherPts.every(P => dBox(b, P) >= own + 12 / pxPer); };
      // (then a wider, flatter label when the narrow one finds no free spot)
      for (const [obs, mwK] of [[others, 1], [thin, 1], [others, 1.45], [thin, 1.45]]) {
        if (mwK > 1 && shape === 'portrait') break;
        for (const f of [0.5, 0.38, 0.62, 0.28, 0.72, 0.2, 0.8]) {
          const anchor = f === 0.5 ? cn.c.mid : cn.c.at(f);
          // (never anchored where the connector runs under another label: that label would hide the leader's start)
          if (occupied.some(z => anchor.x > z.x - 2 && anchor.x < z.x + z.w + 2 && anchor.y > z.y - 2 && anchor.y < z.y + z.h + 2)) continue;
          const c = placeTag(ctx, {name: `rl${cn.i}`, text, anchor, occupied: [...occupied, ...obs], bounds: {x: 6, y: top, w: D.w - 12, h: D.h - top - 6}, maxWidth: shape === 'portrait' ? D.w * 0.45 : D.w * 0.2 * mwK, size: small, color: kindColor(ctx, cn.rel.kind), maxLead: 36 / pxPer});
          if (c.clear && !ownest(c.box)) c.clear = false;
          if (!t || (c.clear && !t.clear)) t = c;
          if (c.clear) break;
        }
        if (t && t.clear) break;
      }
      if (!t) t = placeTag(ctx, {name: `rl${cn.i}`, text, anchor: cn.c.mid, occupied, bounds: {x: 6, y: top, w: D.w - 12, h: D.h - top - 6}, maxWidth: shape === 'portrait' ? D.w * 0.45 : D.w * 0.2, size: small, color: kindColor(ctx, cn.rel.kind), maxLead: 36 / pxPer});
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
    const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    if (link) {
      const fw = link.rel.from === prev;
      pts.push(fw ? link.c.from : link.c.to);
      for (let j = 1; j <= 30; j++) pts.push(link.c.at(fw ? j / 30 : 1 - j / 30));
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
  const labelBoxes = [...Object.values(els).map(e => e.lab && e.lab.box), ...relLabels.map(t => t.box), ...Object.values(states).map(t => t.box), els.filing.card && els.filing.card.box, key && key.box, seqNote && seqNote.box].filter(Boolean);
  const labelsClear = labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)))
    && labelBoxes.every(b => Object.values(els).every(e => !hit(b, e.body, -1) || (e.lab && e.lab.box === b)));
  const faces = [els.partyA.body, els.clerk.body];
  const truncated = [...(els.caseFile.fits || []), ...(els.calendar.fits || []), ...(els.reference.fits || []), ...(els.filing.card ? els.filing.card.fits : []), ...Object.values(els).map(e => e.lab && e.lab.fit), ...relLabels.map(t => t.fit), ...Object.values(states).map(t => t.fit), key && key.fit, seqNote && seqNote.fit]
    .filter(f => f && f.truncated).map(f => f.full);
  const needGap = {};
  // a connector that could not avoid a third component: that component moves away from both ends
  for (const [id, a2, b2] of crossed) { needGap[`${id}|${a2}`] = 80; needGap[`${id}|${b2}`] = 80; }
  relLabels.forEach(t => { if (!t.clear) { const rel = p.relationships[t.i]; if (rel) needGap[`${rel.from}|${rel.to}`] = Math.min(t.box.w, t.box.h) + 24; } });
  Object.entries(states).forEach(([k2, t]) => { if (!t.clear) { const id = k2 === 'st-sent' ? 'filing' : 'reference'; for (const o2 of Object.keys(els)) if (o2 !== id) needGap[`${id}|${o2}`] = Math.max(needGap[`${id}|${o2}`] || 0, 0); needGap[`__${id}`] = Math.min(t.box.w, t.box.h) + 24; } });
  return {crossedN: crossed.length, needGap, pairGap, groupsClear, els, conns, relLabels, states, key, seqNote, route, plan, markIdx, connectorGaps, labelsClear, faces, labelBoxes, truncated, small, top,
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

function unionBox(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y};
}

function circlePt(c, toward) {
  const a = Math.atan2(toward.y - c.y, toward.x - c.x);
  return {x: c.x + (c.r + 6) * Math.cos(a), y: c.y + (c.r + 6) * Math.sin(a)};
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const {els} = L;
  const card = els.filing.card;
  let cardNode = null;
  if (card && card.box) {
    let y = card.box.y + L.small * 0.8;
    const lines = card.fits.map((f, k) => {
      const n = textBlock(f, {x: card.box.x + L.small * 0.6, y, fill: k === 0 ? th.ink : th.inkSoft});
      y += f.height + L.small * 0.35;
      return n;
    });
    cardNode = g({name: 'filing-card', opacity: 0},
      h('path', {d: roundRectPath(card.box.x, card.box.y, card.box.w, card.box.h, 12), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}), lines);
  }
  return g(null,
    L.conns.map(x => x.c.node),
    Object.values(els).map(e => g({name: `el-${e.id}`}, g({name: `el-${e.id}-in`}, e.node))),
    Object.values(els).map(e => e.lab && g({name: `el-${e.id}-labg`, opacity: 0}, e.lab.node)),
    cardNode,
    L.relLabels.map(t => t.node),
    Object.values(L.states).map(t => t.node),
    g({name: 'tracer', opacity: 0},
      h('circle', {r: 26, fill: th.accent2, opacity: 0.18}),
      h('rect', {x: -13, y: -17, width: 26, height: 34, rx: 3, fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: 'M-8 -9h16M-8 -3h16M-8 3h10', stroke: th.paperLine, 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
      h('rect', {x: 1, y: 7, width: 9, height: 6, rx: 1.5, fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 1.5})),
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
    const dx = (L.centre.x - e.c.x) * (1 - sepP) * 0.16, dy = (L.centre.y - e.c.y) * (1 - sepP) * 0.16;
    nodes[`el-${e.id}`] = {transform: T(dx, dy), opacity: r(0.35 + 0.65 * sepP, 3)};
    if (e.lab) nodes[`el-${e.id}-labg`] = {opacity: r(seg(u, 0.15, 0.2), 3)};
  }
  // relationships one by one
  const n = L.conns.length;
  const relP = L.conns.map((x, k) => ease.inOutCubic(seg(u, W_.relate[0] + (k * (W_.relate[1] - W_.relate[0])) / n, W_.relate[0] + ((k + 0.85) * (W_.relate[1] - W_.relate[0])) / n)));
  L.conns.forEach((x, k) => Object.assign(nodes, x.c.frame(relP[k], relP[k] > 0 ? 1 : 0)));
  L.relLabels.forEach(t => { const k = L.conns.findIndex(x => x.i === t.i); nodes[`rl${t.i}`] = {opacity: r(clamp((relP[k] - 0.6) / 0.4), 3)}; });
  if (L.els.filing.card) nodes['filing-card'] = {opacity: r(seg(u, 0.16, 0.2), 3)};
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
    focusScale = 1 + 0.12 * clamp(1 - d / 0.12) * (u <= W_.trace[1] + 0.02 ? 1 : 0);
  }
  for (const e of Object.values(L.els)) nodes[`el-${e.id}-in`] = {transform: e.id === p.focusElement ? scaleAbout(e.c.x, e.c.y, focusScale) : ''};
  // the registry calendar is open from the start (it unfolds while the components separate)
  const calOpen = seg(u, 0.04, 0.16);
  // registered: the reference is stamped when the tracer reaches it (never before), then the entry glyph drops into
  // the supplied day once the tracer has reached the calendar too; draft: the box stays blank, no entry
  const reg = L.plan === 'registered';
  const refAt = visitU(L, 'reference');
  const refShown = reg ? seg(u, refAt, refAt + 0.02) : 0;
  const markAt = Math.max(refAt, visitU(L, 'calendar')) + 0.01;
  const markP = reg ? seg(u, markAt, markAt + 0.04) : 0;
  Object.assign(nodes, L.els.calendar.cal.frame(calOpen, markP, L.markIdx).nodes);
  nodes['el-ref-mark'] = {opacity: r(refShown, 3)};
  // the handed-in filing appears in the intake tray when the tracer reaches the tray
  const trayAt = visitU(L, 'intake');
  nodes['el-tr-letter'] = {opacity: r(reg ? seg(u, trayAt - 0.02, trayAt + 0.02) : 0, 3)};
  if (L.seqNote) nodes['seq-noteg'] = {opacity: r(seg(u, W_.trace[0] - 0.02, W_.trace[0]), 3)};
  const stP = seg(u, ...W_.states);
  for (const k of Object.keys(L.states)) nodes[k] = {opacity: r(stP, 3)};
  const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
  return {
    nodes,
    semantic: {
      beat, separated: r(sepP, 3), relationsDrawn: relP.map(v => r(v, 3)), tracerVisible: trVis, tracer: {x: r(q.x), y: r(q.y)},
      visitOrder: visited, focusScale: r(focusScale, 3), calOpen: r(calOpen, 3), markP: r(markP, 3), refShown: r(refShown, 3), plan: L.plan,
      stateShown: r(stP, 3), connectorGaps: L.connectorGaps,
      arrows: L.conns.map(x => ({kind: x.rel.kind, arrow: FD_LINK_STYLES[x.rel.kind].arrow})),
      kinds: L.conns.map(x => x.rel.kind),
      labelsClear: L.labelsClear, groupsClear: L.groupsClear, truncated: L.truncated,
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !hit(b, f, 0))),
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
    slug: 'civil-claim-03-mechanism',
    title: 'Filing a claim — how the filing, the registry intake, the clerk and the reference relate',
    titleEs: 'Presentación de demanda — Mecanismo o relación explicada',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Presentación de demanda',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A spatial loop of the components — case file, Party A, the written filing, the registry intake tray, the registry clerk, the reference box and the registry calendar. Only the supplied relationships are drawn, each in its kind’s style without arrowheads (a causal link only when supplied) and labelled beside its connector; a small filing traces the supplied order, captioned “Sequence as configured (illustrative)”, while the focus element enlarges; the reference is stamped only when the tracer reaches it and the entry glyph drops into the supplied day. Without a supplied clerk–reference relationship the filing stays a draft (as supplied). No filing rule, deadline, fee, court or effect is shown.',
    tags: ['filing a claim', 'mechanism', 'relationships', 'registry', 'reference', 'intake tray', 'calendar', 'tracer', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/presentacion-demanda.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: FD_STRINGS,
  scene,
});
