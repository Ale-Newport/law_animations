/**
 * LAW-0242 — Requerimiento previo · mechanism
 *
 * Storyboard (a spatial loop, not a row of boxes: the case file and Party A at
 * the left, the letter and Party B's tray along the top, Party B at the right,
 * the calendar strip — the response space — in the middle below, and Party A's
 * reply pocket at the lower left, so the supplied relationships close a loop
 * from the sender back to the sender):
 *  0.00–0.18  separate: the components start gathered in the middle and move
 *             apart to their places (the letter still blank of states).
 *  0.18–0.43  only the supplied relationships are drawn, one by one, each in
 *             its kind's style (plain relation: no arrowhead; communication:
 *             dashed with an arrow; sequence: solid with an arrow; causal only
 *             when supplied) and labelled beside its own connector.
 *  0.43–0.75  a tracer (a small letter) follows the supplied traversal order
 *             along the relationships; the focus element (the calendar by
 *             default) enlarges and unfolds its supplied days while the tracer
 *             is on it.
 *  0.75–1.00  gather: states stay visible beside their elements — sent on the
 *             letter, in Party B's tray, the response space open with its
 *             supplied days, and at the pocket the supplied reply state (reply
 *             received on the supplied day, or reply pending) — plus the
 *             "as supplied · no conclusion drawn" key. No period, effect of
 *             silence or outcome is shown.
 * @module animations/civil-claim/LAW-0242
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, LINK_STYLES, textBlock} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  RP_DEFAULTS, RP_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, replyDayLabel,
} from './kits/requerimiento-previo.js';
import {caseFile, letterSheet, letterTray, replyPocket, calendarStrip, fitG, glue} from './kits/civil-claim-art.js';

const ID = 'LAW-0242';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W_ = {separate: [0.02, 0.17], relate: [0.19, 0.42], trace: [0.44, 0.72], states: [0.76, 0.82], key: [0.02, 0.08]};
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
const EL = ['partyA', 'caseFile', 'letter', 'trayB', 'partyB', 'calendar', 'replyPocket'];

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
  parties: RP_DEFAULTS.parties,
  documents: RP_DEFAULTS.documents,
  stages: RP_DEFAULTS.stages,
  dates: RP_DEFAULTS.dates,
  elements: [
    {id: 'caseFile', label: 'Case file'},
    {id: 'letter', label: 'Pre-claim letter'},
    {id: 'trayB', label: 'Party B’s tray'},
    {id: 'calendar', label: 'Response space'},
    {id: 'replyPocket', label: 'Party A’s reply pocket'},
  ],
  relationships: [
    {from: 'caseFile', to: 'partyA', kind: 'relation', label: 'kept by'},
    {from: 'partyA', to: 'letter', kind: 'sequence', label: 'signs, then sends'},
    {from: 'letter', to: 'trayB', kind: 'communication', label: ''},
    {from: 'trayB', to: 'calendar', kind: 'sequence', label: 'opens'},
    {from: 'partyB', to: 'replyPocket', kind: 'communication', label: 'reply slip (as supplied)'},
    {from: 'calendar', to: 'replyPocket', kind: 'relation', label: 'reply lands on a supplied day'},
  ],
  focusElement: 'calendar',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'then', causal: 'causal (as supplied)'},
  traversalOrder: ['partyA', 'letter', 'trayB', 'calendar', 'replyPocket'],
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
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
      for (let round = 0; round < 5 && (bad(q) || q.crossedN) && Object.keys(q.needGap).length; round++) {
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
  landscape: {caseFile: [0.07, 0.24], partyA: [0.11, 0.66], letter: [0.28, 0.26], trayB: [0.72, 0.24], partyB: [0.9, 0.58], calendar: [0.55, 0.62], replyPocket: [0.31, 0.87]},
  square: {caseFile: [0.1, 0.18], partyA: [0.12, 0.62], letter: [0.33, 0.3], trayB: [0.86, 0.2], partyB: [0.87, 0.58], calendar: [0.58, 0.6], replyPocket: [0.26, 0.91]},
  portrait: {caseFile: [0.2, 0.1], partyA: [0.2, 0.38], letter: [0.7, 0.1], trayB: [0.82, 0.42], partyB: [0.52, 0.68], calendar: [0.5, 0.88], replyPocket: [0.2, 0.64]},
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
  const replySupplied = p.relationships.some(q => (q.to === 'replyPocket' && q.from === 'partyB') || (q.from === 'replyPocket' && q.to === 'partyB'));
  const plan = replySupplied ? 'received' : 'pending';
  const markIdx = Math.max(0, Math.min(p.dates.window.length - 1, p.dates.replyDay));
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.4, size: Math.max(small, 16.2 / pxPer), name: 'key'}) : null;
  const top = 8 + (key && shape !== 'landscape' ? key.box.h + 8 : 0);
  const U = {w: D.w, h: D.h - top};
  const at = id => ({x: POS[shape][id][0] * U.w, y: top + POS[shape][id][1] * U.h});

  // ---- components (design units); each has a body box for connector anchoring and an optional label chip
  const labelChip = (id, text, cx, y, maxW) => gchip(ctx, text, {x: cx, y, anchor: 'middle', maxWidth: maxW, size: small, minSize: small, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: `el-${id}-lab`});
  const maxLab = shape === 'portrait' ? D.w * 0.42 : shape === 'square' ? D.w * 0.26 : D.w * 0.22;
  const Rp = (shape === 'portrait' ? 96 : shape === 'square' ? 92 : 100) * Math.min(1, 0.5 + sizeK * 0.5);
  const buildEls = at => {
    const els = {};
    // parties: round portraits
    for (const [id, i] of [['partyA', 0], ['partyB', 1]]) {
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
    // letter: a compact sheet; its supplied reference, contents, date and reply slip are printed on a card beside it
    {
      const c = at('letter');
      const lw = 180;
      const lt = letterSheet(ctx, {prefix: 'el-lt', w: lw, size: 18, refSize: 16, barsOnly: true, ref: 'x', title: 'x x x x x x', date: 'x x', slip: 'x x', signer: p.parties[0].name, showText: true, sigW: 60});
      const lx = c.x - lw / 2, ly = c.y + lt.h / 2;
      const cardText = [`${p.documents.letter.ref} · ${p.documents.letter.title}`, p.dates.sent, p.documents.replySlip];
      const cardW = shape === 'portrait' ? D.w * 0.44 : shape === 'square' ? D.w * 0.3 : D.w * 0.19;
      const fits = cardText.map((t, k) => fitG(t, {maxWidth: cardW - small * 1.2, size: small, minSize: small, maxLines: 9, weight: k === 0 ? 700 : 500}));
      els.letter = {id: 'letter', c, body: {x: lx, y: ly - lt.h - lt.slipH, w: lw + 6, h: lt.h + lt.slipH + 8}, node: g({transform: T(c.x, ly)}, g({transform: T(0, -lt.slipH)}, lt.body), lt.slip('')),
        lab: showKey && labelOf('letter') ? labelChip('letter', labelOf('letter'), c.x, ly + 10, maxLab) : null, card: showAll ? {fits, w: cardW} : null};
    }
    // Party B's tray (plain plate; its label is the component label)
    {
      const c = at('trayB');
      const w = 250;
      const tr = letterTray(ctx, {prefix: 'el-tr', w, lipTop: -34, rackTop: -120, label: '', size: 20, showText: false, icon: 'in', plain: true});
      const lt = letterSheet(ctx, {prefix: 'el-tl', w: 130, size: 14, barsOnly: true, ref: 'x', title: 'x x x', date: 'x', slip: 'x', signer: 'x', showText: true, sigW: 40});
      const y0 = c.y + 60;
      // (the body includes the delivered letter standing in the tray: tags keep off it)
      const topY = Math.min(y0 - 132, y0 + 20 - lt.slipH - lt.h - 4);
      els.trayB = {id: 'trayB', c, body: {x: c.x - w / 2 - 6, y: topY, w: w + 12, h: y0 - topY}, node: g({transform: T(c.x, y0)}, tr.back, g({name: 'el-tr-letter', opacity: 0, transform: T(0, 20)}, g({transform: T(0, -lt.slipH)}, lt.body), lt.slip('')), tr.front),
        lab: showKey && labelOf('trayB') ? labelChip('trayB', labelOf('trayB'), c.x, y0 + 10, maxLab) : null};
    }
    // reply pocket (with the returned slip when a reply is supplied); lifted when its label would leave the frame
    {
      const c = at('replyPocket');
      const labH0 = showKey && labelOf('replyPocket') ? labelChip('replyPocket', labelOf('replyPocket'), 0, 0, maxLab).box.h : 0;
      c.y = Math.min(c.y, D.h - 10 - 46 - labH0);
      const w = 250;
      const pk = replyPocket(ctx, {prefix: 'el-pk', w, depth: 46, backRise: 50, label: '', size: 20, showText: false});
      const y0 = c.y - 10;
      els.replyPocket = {id: 'replyPocket', c, body: {x: c.x - w / 2 - 4, y: y0 - 50, w: w + 8, h: 96},
        node: g({transform: T(c.x, y0)}, pk.back, g({name: 'el-pk-emptyg'}, pk.empty), g({name: 'el-pk-slip', opacity: 0}, h('rect', {x: -w * 0.38, y: -42, width: w * 0.76, height: 60, rx: 4, fill: '#f3ecdc', stroke: th.ink, 'stroke-width': 2}), h('path', {d: `M${-w * 0.3} -26h${w * 0.4}M${-w * 0.3} -12h${w * 0.26}`, stroke: th.paperLine, 'stroke-width': 4, 'stroke-linecap': 'round'}), h('path', {d: `M${-w * 0.38} -42h${w * 0.76}`, stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '4 4'})), pk.front),
        lab: showKey && labelOf('replyPocket') ? labelChip('replyPocket', labelOf('replyPocket'), c.x, y0 + 46 + 10, maxLab) : null};
    }
    // calendar (the response space; unfolds while the tracer is on it)
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
      const cw = shape === 'portrait' ? D.w * 0.86 : clamp(p.dates.window.length * dayW, D.w * 0.36, D.w * (shape === 'square' ? 0.44 : 0.5));
      let cols = p.dates.window.length;
      while (cols > 1 && cw / cols < dayW) cols--;
      const probe = calendarStrip(ctx, {prefix: 'el-cal', x: 0, y: 0, w: cw, cols, days: p.dates.window, title: labelOf('calendar') || '', showTitle: Boolean(labelOf('calendar')) && showKey, size: small, showText: showAll, slotH: small * 1.3});
      const cal = calendarStrip(ctx, {prefix: 'el-cal', x: c.x - cw / 2, y: c.y - probe.h / 2, w: cw, cols, days: p.dates.window, title: labelOf('calendar') || '', showTitle: Boolean(labelOf('calendar')) && showKey, size: small, showText: showAll, slotH: small * 1.3});
      els.calendar = {id: 'calendar', c, body: {x: c.x - cw / 2, y: c.y - probe.h / 2 - small * 0.7, w: cw, h: probe.h + small * 0.7}, node: cal.node(markIdx), cal, lab: null, fits: [cal.titleFit, ...cal.dayFits]};
    }


    return els;
  };
  // long supplied labels make the components larger than their slots: each component (with its label and, for the
  // letter, its card) is pushed apart from the others until nothing overlaps, keeping the loop's order
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
  // the letter card: beside the letter, in free space
  if (els.letter.card) {
    const e = els.letter;
    const card = e.card;
    const hh = card.fits.reduce((a, f) => a + f.height, 0) + small * 1.6;
    // below the letter's label first (the route to the tray leaves the letter's right edge), then beside it
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
    const anchor = (E, toward) => (E.circle ? circlePt(E.circle, toward) : edgeAnchor(withLab(E), toward, 6));
    const from = anchor(A, Bx.c);
    const to = anchor(Bx, A.c);
    // the letter's route to the tray arcs clear of the letter card (over it on wide frames, round the right
    // margin on tall ones)
    const isLT = (rel.from === 'letter' && rel.to === 'trayB') || (rel.from === 'trayB' && rel.to === 'letter');
    if (isLT) {
      const Lb = els.letter.body, Tb = els.trayB.body;
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
      const [a, b] = rel.from === 'letter' ? [f2, t2] : [t2, f2];
      const [q1, q2] = rel.from === 'letter' ? [k1, k2] : [k2, k1];
      return {rel, i, c: connector(ctx, {name: `rel-c${i}`, from: a, to: b, kind: rel.kind, c1: q1, c2: q2, color: kindColor(ctx, rel.kind)})};
    }
    // the reply from Party B to the pocket runs under the calendar
    let c1, c2;
    const calB0 = els.calendar.body;
    const roomUnder = calB0.y + calB0.h + 70 <= D.h - 40;
    if (shape !== 'portrait' && roomUnder && ((rel.from === 'partyB' && rel.to === 'replyPocket') || (rel.to === 'partyB' && rel.from === 'replyPocket'))) {
      const calB = els.calendar.body;
      const low = Math.min(D.h - 40, calB.y + calB.h + 70);
      const f2 = rel.from === 'partyB' ? {x: A.c.x - Rp * 0.7, y: A.c.y + Rp * 0.7} : {x: A.body.x + A.body.w, y: A.c.y};
      const pkU = Bx.lab ? unionBox(Bx.body, Bx.lab.box) : Bx.body;
      const t2 = rel.to === 'replyPocket' ? {x: pkU.x + pkU.w + 6, y: Bx.c.y} : {x: Bx.c.x - Rp * 0.7, y: Bx.c.y + Rp * 0.7};
      c1 = {x: f2.x - 20, y: low};
      c2 = {x: t2.x + 140, y: low};
      const cn = connector(ctx, {name: `rel-c${i}`, from: f2, to: t2, kind: rel.kind, c1, c2, color: kindColor(ctx, rel.kind)});
      if (!crosses(cn, rel)) return {rel, i, c: cn};
    }
    // on tall frames the tray's link to the full-width response strip drops straight down beside Party B (so it
    // never crosses B's reply route to the pocket)
    const isTC = shape === 'portrait' && ((rel.from === 'trayB' && rel.to === 'calendar') || (rel.from === 'calendar' && rel.to === 'trayB'));
    if (isTC) {
      const T0 = withLab(els.trayB), Cb = els.calendar.body;
      const x = clamp(T0.x + T0.w * 0.62, Cb.x + 30, Cb.x + Cb.w - 30);
      const f2 = {x, y: T0.y + T0.h + 6}, t2 = {x, y: Cb.y - 6};
      const [a, b] = rel.from === 'trayB' ? [f2, t2] : [t2, f2];
      const cn = connector(ctx, {name: `rel-c${i}`, from: a, to: b, kind: rel.kind, bend: 0, color: kindColor(ctx, rel.kind)});
      if (!crosses(cn, rel)) return {rel, i, c: cn};
    }
    // on tall frames the sender's link to the letter arcs above the letter card
    const up = shape === 'portrait' && ((rel.from === 'partyA' && rel.to === 'letter') || (rel.to === 'partyA' && rel.from === 'letter'));
    const bend0 = up ? (rel.from === 'partyA' ? -0.28 : 0.28) : 0.12;
    // (a bend that passes through another component is replaced by one that does not, when there is one)
    let cn = null;
    for (const bd of [bend0, -bend0, 0.3, -0.3, 0.45, -0.45, 0.6, -0.6]) {
      const c0 = connector(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind, bend: bd, color: kindColor(ctx, rel.kind)});
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
  // state tags (gather): letter "sent", tray "delivered", pocket "replied · day" / "pending"
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
    const lb = els.letter.body, tb = els.trayB.body, pb = els.replyPocket.body;
    add('st-sent', p.stages.sent, [{x: lb.x + lb.w * 0.5, y: lb.y + 2}, {x: lb.x + 4, y: lb.y + 8}, {x: lb.x + lb.w - 4, y: lb.y + 20}, {x: lb.x + 4, y: lb.y + lb.h * 0.5}, {x: lb.x + 4, y: lb.y + lb.h - 10}, {x: lb.x + lb.w - 4, y: lb.y + lb.h * 0.5}, {x: lb.x + lb.w * 0.3, y: lb.y + 2}], th.inkSoft);
    add('st-delivered', p.stages.delivered, [{x: tb.x + tb.w - 6, y: tb.y + 30}, {x: tb.x + 6, y: tb.y + 20}, {x: tb.x + tb.w * 0.5, y: tb.y + 4}, {x: tb.x + 6, y: tb.y + tb.h * 0.6}, {x: tb.x + tb.w - 6, y: tb.y + tb.h * 0.6}, {x: tb.x + tb.w * 0.3, y: tb.y + tb.h - 4}], th.accent2);
    add('st-outcome', plan === 'received' ? `${p.stages.replied} · ${replyDayLabel(p)}` : p.stages.pending, [{x: pb.x + 6, y: pb.y + pb.h - 8}, {x: pb.x + 6, y: pb.y + 10}, {x: pb.x + pb.w - 6, y: pb.y + 10}, {x: pb.x + pb.w - 6, y: pb.y + pb.h * 0.5}, {x: pb.x + pb.w - 6, y: pb.y + pb.h - 8}, {x: pb.x + pb.w * 0.5, y: pb.y + 4}], th.accent2);
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
    if (E.circle) return Math.abs(Math.hypot(q.x - E.circle.x, q.y - E.circle.y) - E.circle.r);
    const b = E.lab ? unionBox(E.body, E.lab.box) : E.body;
    const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
    const inside = !dx && !dy;
    return inside ? Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y) : Math.hypot(dx, dy);
  };
  const connectorGaps = conns.map(x => r(Math.max(edgeGap(els[x.rel.from], x.c.from), edgeGap(els[x.rel.to], x.c.to)), 1));
  const labelBoxes = [...Object.values(els).map(e => e.lab && e.lab.box), ...relLabels.map(t => t.box), ...Object.values(states).map(t => t.box), els.letter.card && els.letter.card.box, key && key.box].filter(Boolean);
  const labelsClear = labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)))
    && labelBoxes.every(b => Object.values(els).every(e => !hit(b, e.body, -1) || (e.lab && e.lab.box === b)));
  const faces = [els.partyA.body, els.partyB.body];
  const truncated = [...(els.caseFile.fits || []), ...(els.calendar.fits || []), ...(els.letter.card ? els.letter.card.fits : []), ...Object.values(els).map(e => e.lab && e.lab.fit), ...relLabels.map(t => t.fit), ...Object.values(states).map(t => t.fit), key && key.fit]
    .filter(f => f && f.truncated).map(f => f.full);
  const needGap = {};
  // a connector that could not avoid a third component: that component moves away from both ends
  for (const [id, a2, b2] of crossed) { needGap[`${id}|${a2}`] = 80; needGap[`${id}|${b2}`] = 80; }
  relLabels.forEach(t => { if (!t.clear) { const rel = p.relationships[t.i]; if (rel) needGap[`${rel.from}|${rel.to}`] = Math.min(t.box.w, t.box.h) + 24; } });
  Object.entries(states).forEach(([k2, t]) => { if (!t.clear) { const id = k2 === 'st-sent' ? 'letter' : k2 === 'st-delivered' ? 'trayB' : 'replyPocket'; for (const o2 of Object.keys(els)) if (o2 !== id) needGap[`${id}|${o2}`] = Math.max(needGap[`${id}|${o2}`] || 0, 0); needGap[`__${id}`] = Math.min(t.box.w, t.box.h) + 24; } });
  return {crossedN: crossed.length, needGap, pairGap, groupsClear, els, conns, relLabels, states, key, route, plan, markIdx, connectorGaps, labelsClear, faces, labelBoxes, truncated, small, top,
    centre: {x: D.w / 2, y: top + U.h / 2}};
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
  const card = els.letter.card;
  let cardNode = null;
  if (card && card.box) {
    let y = card.box.y + L.small * 0.8;
    const lines = card.fits.map((f, k) => {
      const n = textBlock(f, {x: card.box.x + L.small * 0.6, y, fill: k === 0 ? th.ink : th.inkSoft});
      y += f.height + L.small * 0.35;
      return n;
    });
    cardNode = g({name: 'letter-card', opacity: 0},
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
      h('rect', {x: -18, y: -13, width: 36, height: 26, rx: 3, fill: '#f4ead6', stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: 'M-16 -11L0 2L16 -11', fill: 'none', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'})),
    L.key && L.key.node,
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
  if (L.els.letter.card) nodes['letter-card'] = {opacity: r(seg(u, 0.16, 0.2), 3)};
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
  // the calendar unfolds when the tracer reaches it (or at the gather when it is not visited)
  const cv = L.route.visits.find(v => v.id === 'calendar');
  const openAt = cv ? lerp(W_.trace[0], W_.trace[1], cv.t) : W_.states[0];
  const calOpen = seg(u, openAt - 0.03, openAt + 0.05);
  const received = L.plan === 'received';
  const markP = received ? seg(u, 0.77, 0.81) : 0;
  Object.assign(nodes, L.els.calendar.cal.frame(calOpen, markP, L.markIdx).nodes);
  // tray letter and pocket slip follow the states
  const tv = L.route.visits.find(v => v.id === 'trayB');
  const trayAt = tv ? lerp(W_.trace[0], W_.trace[1], tv.t) : W_.states[0];
  nodes['el-tr-letter'] = {opacity: r(seg(u, trayAt - 0.02, trayAt + 0.02), 3)};
  nodes['el-pk-slip'] = {opacity: r(received ? seg(u, 0.77, 0.81) : 0, 3)};
  nodes['el-pk-emptyg'] = {opacity: r(received ? 1 - seg(u, 0.77, 0.81) : 1, 3)};
  const stP = seg(u, ...W_.states);
  for (const k of Object.keys(L.states)) nodes[k] = {opacity: r(stP, 3)};
  const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
  return {
    nodes,
    semantic: {
      beat, separated: r(sepP, 3), relationsDrawn: relP.map(v => r(v, 3)), tracerVisible: trVis, tracer: {x: r(q.x), y: r(q.y)},
      visitOrder: visited, focusScale: r(focusScale, 3), calOpen: r(calOpen, 3), markP: r(markP, 3), plan: L.plan,
      stateShown: r(stP, 3), connectorGaps: L.connectorGaps,
      arrows: L.conns.map(x => ({kind: x.rel.kind, arrow: LINK_STYLES[x.rel.kind].arrow})),
      kinds: L.conns.map(x => x.rel.kind),
      labelsClear: L.labelsClear, truncated: L.truncated,
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
    slug: 'civil-claim-01-mechanism',
    title: 'Pre-claim request — the loop from the sender’s letter to the response space and back',
    titleEs: 'Requerimiento previo — Mecanismo o relación explicada',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Requerimiento previo',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A spatial loop of the components — case file, Party A, the letter, Party B’s tray, Party B, the calendar strip (response space) and Party A’s reply pocket. Only the supplied relationships are drawn, each in its kind’s style and labelled beside its connector; a small letter traces the supplied order while the calendar enlarges and unfolds its supplied days; states stay visible at the end (sent, in Party B’s tray, response space open, reply received on the supplied day or reply pending). No causality is drawn unless supplied; no period or outcome is shown.',
    tags: ['pre-claim request', 'mechanism', 'relationships', 'communication', 'sequence', 'calendar', 'response space', 'tray', 'reply pocket', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RP_STRINGS,
  scene,
});
