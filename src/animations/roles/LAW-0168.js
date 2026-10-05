/**
 * LAW-0168 — Consulta entre profesionales · inspect
 *
 * Storyboard:
 *  0.00–0.20  context: the consultation table, large, in the state produced by
 *             the action — both flags level on the shared passage (band), the
 *             open-question flag with its ring on another passage and the empty
 *             outline opposite; both note bubbles; legend and key. The context
 *             caption sits in the bottom band.
 *  0.13–0.45  while the view pulls back to a thumbnail, a lens grows out of the
 *             margin where the open-question flag sits (never a lone thumbnail): it
 *             holds a real second copy of the stage drawn at the SAME
 *             coordinates, enlarged, so the flag, its passage ref and the hand
 *             are seen large; the window's edges fall between text lines (none is
 *             cut). A value card shows the supplied datum: the passage
 *             the flag points to (beforeValue).
 *  0.45–0.75  substitution of ONE datum: the old value is struck in the card;
 *             the same professional's hand peels the flag off its margin spot
 *             and presses it onto the passage named by afterValue (flag = solved
 *             hand the whole way). Only its dependent geometry updates: the ring
 *             travels with the flag, the empty outline opposite fades out at the
 *             old row and in at the new one; a dashed ghost keeps the old spot
 *             traceable. Then afterValue appears in the card.
 *  0.62–0.80  the context grows back while the lens is still open, then the lens
 *             retracts into its source; a Δ "datum changed" marker (changedMarker,
 *             ~22 px radius) is pinned beside the moved flag, its label clear of the
 *             page, and the before → after is docked under the scene. Everything is
 *             settled by u = 0.80.
 * Seeking back before the substitution restores the previous datum exactly.
 * No validity, responsibility or outcome is deduced.
 * @module animations/roles/LAW-0168
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {
  consultFields, CONSULT_DEFAULTS, sideSpan, KIT_STRINGS, resolvePoints, roleOf, pxUnit, passageIndex, fitWords, wchip, overlaps,
  docLayout, stageGeometry, consultStage, placementScript, fitBubble, noteBubble, legendCard, placeCallout, emptySlot,
} from './kits/consulta-entre-profesionales.js';

const ID = 'LAW-0168';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
/**
 * Timing windows (u). The context shrinks WHILE the lens opens (and grows back while it closes), so
 * the frame is never a lone thumbnail; everything is settled by u = 0.80 (1.6 s of still hold at 8 s).
 */
const W = {
  caption: [0.02, 0.1], shrink: [0.13, 0.21], open: [0.13, 0.19], card: [0.26, 0.34],
  strike: [0.42, 0.46], move: [0.45, 0.58], ghost: [0.48, 0.53], slotOut: [0.47, 0.51], slotIn: [0.55, 0.6], after: [0.55, 0.6],
  // the new value is fully visible and still in the card for 400 ms (u 0.60–0.65) before the card leaves
  cardOut: [0.65, 0.68], zoom: [0.66, 0.75], close: [0.665, 0.72], marker: [0.74, 0.79],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, flagOn: 'Open-question flag on', context: 'Context'},
  es: {...KIT_STRINGS.es, flagOn: 'Banderita de cuestión abierta en', context: 'Contexto'},
};

const sceneSchema = {
  ...consultFields,
  ...inspectFields(['openPassage']),
};
sceneSchema.focusTarget = {...sceneSchema.focusTarget, description: 'Detail that is enlarged and substituted: openPassage = the passage the open-question flag points to'};
sceneSchema.beforeValue = {...sceneSchema.beforeValue, description: 'Passage the open-question flag points to before the substitution (a passage ref such as "Cl. 3"; matched by ref, then text, then its number)'};
sceneSchema.afterValue = {...sceneSchema.afterValue, description: 'Passage the flag points to after the substitution (a passage ref; the flag is moved there by the same hand)'};

const defaultParams = {
  ...CONSULT_DEFAULTS,
  focusTarget: 'openPassage',
  beforeValue: 'Cl. 3',
  afterValue: 'Cl. 4',
  detailGeometry: {zoom: 2.5, placement: 'auto'},
  contextLabels: {context: 'Two notes on one draft; one question left open', marker: 'Datum changed'},
};

/** Context composition at stage scale z (a compact version of the table scene: no callouts). */
function composeContext(ctx, z, floorPx, rows, legendAt = 'panel', lastResort = false, hs = 1, inlineDock = false, docCap = Infinity) {
  const p = ctx.params;
  const t = ctx.t;
  const th = ctx.theme;
  const D = ctx.design;
  const U0 = pxUnit(ctx);
  // the context is drawn at scale hs at the hold (the docked card sits under it): compensate text sizes
  const U = px => U0(px) / hs;
  const shape = ctx.view.shape;
  const S = U(21.5), Smin = U(floorPx);
  const pts = rows;
  const by = pts.by;
  const showKey = ctx.show('key');
  const problems = [];
  const k = (shape === 'portrait' ? 1.3 : shape === 'square' ? 1.28 : 1.6) * z;
  const s = k / 1.2;
  // docCap: the lens must be able to show the full row at ≥ 1.5× (see layout)
  const docW = Math.min(docCap - 70 * s, shape === 'landscape' ? Math.min(640, Math.max(560, D.w * 0.31)) * Math.sqrt(z) : Math.min(shape === 'square' ? 740 : 560, D.w - 2 * (sideSpan(k, s) + 12)));

  // context caption (top band)
  // the context caption is printed in the bottom band (docked card), or — inline dock — as a top chip
  let cap = inlineDock && ctx.show('all') ? wchip(ctx, `${t.context}: ${p.contextLabels.context}`, {x: D.w / 2, y: 8, anchor: 'middle', maxWidth: D.w - 24, size: S, minSize: Smin, maxLines: 2, fill: th.card, weight: 600, name: 'ctx-cap'}) : null;
  if (cap && cap.fit.truncated) problems.push('caption');
  let top0 = cap ? cap.box.y + cap.box.h + 12 : 10;
  const legendRowsOf = color => [
    {kind: 'same', text: `${t.samePoint} · ${t.asSupplied}`},
    {kind: 'open', text: `${t.openQuestion} · ${t.asSupplied}`, color},
  ];

  // name chips
  const capOf = id => {
    const i = id === 'a' ? 0 : 1;
    const role = roleOf(p, id);
    return role ? `${p.actors[i].name} · ${role}` : p.actors[i].name;
  };
  const chipMax = shape === 'landscape' ? Math.min(620, D.w / 2 - 30) : D.w / 2 - 16;
  const two = ['a', 'b'].every(id => !wchip(ctx, capOf(id), {size: S, minSize: Smin, maxLines: 2, maxWidth: chipMax, x: 0, y: 0}).fit.truncated);
  const chipOpt = two ? {size: S, minSize: Smin, maxLines: 2, maxWidth: chipMax, fill: th.card, weight: 600} : {size: S, minSize: S, maxLines: 3, maxWidth: chipMax, fill: th.card, weight: 600};
  const chipH = showKey ? Math.max(...['a', 'b'].map(id => wchip(ctx, capOf(id), {...chipOpt, x: 0, y: 0}).box.h)) : 0;
  const hipY = D.h - 10 - (showKey ? chipH + 12 * k : 0) - 150 * k;
  const G = stageGeometry({cx: D.w / 2, docW, hipY, k, s});
  // refGap (opt-in): a wider reference–title gap, legible when the context is a thumbnail
  const docOpt = {refGap: 0.8, w: docW, s, size: S, minSize: Smin, reference: p.props.document.reference, title: p.props.document.title, passages: p.props.document.passages, wholeWords: true, rowsH: G.rowsBottom - G.rowsTop, minDocH: shape === 'portrait' ? docW * 1.3 * z : 0};
  let doc = docLayout(ctx, docOpt);
  if (!doc.fits) {
    doc = docLayout(ctx, {...docOpt, rowsH: G.rowsBottom - (G.hipY - 300 * k)});
    G.rowsTop = G.rowsBottom - doc.rowsUsed;
  }
  if (!doc.fits) problems.push('doc');
  for (const row of [pts.same, pts.before, pts.after]) if (G.rowsTop + doc.rows[row].anchor < G.rowsTopMax) problems.push('reach');
  const flags = [
    {id: 'sameA', who: 'a', row: pts.same},
    {id: 'sameB', who: 'b', row: pts.same},
    {id: 'open', who: by, row: pts.after, ring: true},
  ];
  const mk = prefix => consultStage(ctx, {prefix, G, actors: p.actors, doc, document: p.props.document, flags, bandRow: pts.same, slot: null});
  const stage = mk('cx');
  if (stage.docTop < top0) problems.push('docTop');
  if (cap && cap.fit.size > doc.size + 0.01) {
    cap = wchip(ctx, `${t.context}: ${p.contextLabels.context}`, {x: D.w / 2, y: 8, anchor: 'middle', maxWidth: D.w - 24, size: doc.size, minSize: doc.size, maxLines: 3, fill: th.card, weight: 600, name: 'ctx-cap'});
    if (cap.fit.truncated) problems.push('caption');
  }

  // legend at the top (option): the bubbles sit under it and the panel stays free for the marker label
  let topLegend = null;
  if (showKey && legendAt === 'top') {
    topLegend = legendCard(ctx, {name: 'legend', x: D.w / 2, y: top0, maxW: D.w * 0.42, maxH: 400, size: Math.min(S, doc.size), minSize: Smin, rows: legendRowsOf(stage.color(by)), key: t.noConclusion, colors: [stage.color('a'), stage.color('b')]});
  }
  // bubbles (both notes) above/beside the heads
  const occupied = cap ? [cap.box] : [];
  if (topLegend) occupied.push(topLegend.box);
  const bubbles = {};
  const sideOK = G.x0 - 34 >= 360;
  const topH = stage.docTop - 24 - top0;
  const rowsOf = id => {
    const out = [{text: id === 'a' ? p.props.same.noteA : p.props.same.noteB, color: stage.color(id)}];
    if (by === id) out.push({text: p.props.open.note, color: stage.color(id), ring: true});
    return out;
  };
  for (const id of ['a', 'b']) {
    const left = id === 'a';
    let reg;
    if (sideOK) reg = left ? {x: 12, y: top0, w: G.x0 - 34, h: G.headTop - 30 - top0} : {x: G.x1 + 22, y: top0, w: D.w - G.x1 - 34, h: G.headTop - 30 - top0};
    else if (topLegend) {
      // columns on either side of the top legend, over the whole band above the page
      const lb = topLegend.box;
      reg = left ? {x: 12, y: top0, w: lb.x - 24, h: topH} : {x: lb.x + lb.w + 12, y: top0, w: D.w - 12 - (lb.x + lb.w + 12), h: topH};
    } else if (shape === 'portrait') reg = left ? {x: 12, y: top0, w: D.w * 0.8, h: topH / 2 - 8} : {x: D.w * 0.2 - 12, y: top0 + topH / 2 + 8, w: D.w * 0.8, h: topH / 2 - 8};
    else {
      const len = q => rowsOf(q).reduce((a2, x) => a2 + x.text.length, 0);
      const fa = clamp(len('a') / (len('a') + len('b')), 0.36, 0.64);
      const wa = (D.w - 40) * fa;
      reg = left ? {x: 12, y: top0, w: wa, h: topH} : {x: 28 + wa, y: top0, w: D.w - 40 - wa, h: topH};
    }
    const rs = rowsOf(id);
    const fit = fitBubble(ctx, rs, {maxW: reg.w, maxH: Math.max(10, reg.h), size: S, minSize: U(floorPx > 17 ? floorPx : Math.min(floorPx, 16.3)), maxLines: 5});
    if (!fit.ok) problems.push(`bubble-${id}`);
    const head = G.head(id);
    const stack = !sideOK && shape === 'portrait';
    const bx = stack ? (left ? reg.x : reg.x + reg.w - fit.w) : clamp(head.x - fit.w / 2 + (left ? 60 : -60) * k, reg.x, reg.x + reg.w - fit.w);
    const box = {x: bx, y: stack ? reg.y + (reg.h - fit.h) * (left ? 0.35 : 0.65) : reg.y + reg.h - fit.h, w: fit.w, h: fit.h};
    bubbles[id] = {...noteBubble(ctx, {name: `bub-${id}`, box, tail: {x: head.x + (left ? 14 : -14) * k, y: G.headTop - 6 * k}, fit, rows: rs, show: showKey, stroke: stage.color(id)}), fitSize: fit.size};
    occupied.push(box);
  }
  // bubble tails (sampled) stay clear of labels and leaders
  const tailBoxes = [];
  for (const id of ['a', 'b']) {
    const b = bubbles[id].box, head = G.head(id);
    const tip = {x: head.x + (id === 'a' ? 14 : -14) * k, y: G.headTop - 6 * k};
    const base = {x: clamp(tip.x, b.x + 30, b.x + b.w - 30), y: b.y + b.h};
    for (let i = 0; i < 8; i++) {
      const q = {x: lerp(base.x, tip.x, (i + 0.5) / 8), y: lerp(base.y, tip.y, (i + 0.5) / 8)};
      tailBoxes.push({x: q.x - 26, y: q.y - Math.abs(tip.y - base.y) / 16 - 4, w: 52, h: Math.abs(tip.y - base.y) / 8 + 8});
    }
  }
  // name chips
  const chips = [];
  if (showKey) {
    for (const id of ['a', 'b']) {
      const hip = id === 'a' ? G.hipA : G.hipB;
      const c0 = wchip(ctx, capOf(id), {...chipOpt, x: hip.x, y: G.floor + 12 * k, anchor: 'middle'});
      const dx = c0.box.x < 10 ? 10 - c0.box.x : c0.box.x + c0.box.w > D.w - 10 ? D.w - 10 - (c0.box.x + c0.box.w) : 0;
      chips.push(wchip(ctx, capOf(id), {...chipOpt, x: hip.x + dx, y: G.floor + 12 * k, anchor: 'middle', name: `chip-${id}`}));
    }
    if (overlaps(chips[0].box, chips[1].box, 6)) problems.push('chips');
    occupied.push(...chips.map(c => c.box));
  }
  // legend: on the table panel, or beside the people (leaves the panel to the marker label)
  let legend = null;
  if (showKey) {
    const pn = stage.panel;
    const mkLegend = (x, y, maxW, maxH, anchor) => legendCard(ctx, {name: 'legend', x, y, maxW, maxH, size: Math.min(S, doc.size, ...Object.values(bubbles).map(b => b.fitSize), ...chips.map(c => c.fit.size)), minSize: Math.min(Smin, doc.size), anchor, rows: [
      {kind: 'same', text: `${t.samePoint} · ${t.asSupplied}`},
      {kind: 'open', text: `${t.openQuestion} · ${t.asSupplied}`, color: stage.color(by)},
    ], key: t.noConclusion, colors: [stage.color('a'), stage.color('b')]});
    if (topLegend) {
      // the top legend is laid out before the bubbles: cap it to the smallest supplied text drawn
      const cmin = Math.min(S, doc.size, ...Object.values(bubbles).map(b => b.fitSize), ...chips.map(c => c.fit.size));
      legend = topLegend.size > cmin + 0.01 ? legendCard(ctx, {name: 'legend', x: D.w / 2, y: topLegend.box.y, maxW: D.w * 0.42, maxH: 400, size: cmin, minSize: cmin, rows: legendRowsOf(stage.color(by)), key: t.noConclusion, colors: [stage.color('a'), stage.color('b')]}) : topLegend;
    }
    else if (legendAt === 'panel') legend = mkLegend(pn.x + pn.w / 2, pn.y, pn.w, pn.h + 16 * k, 'middle');
    else {
      const zn = {x: 12, y: G.headTop, w: G.left - 24, h: G.floor - G.headTop};
      legend = zn.w > S * 9 ? mkLegend(zn.x, zn.y, zn.w, zn.h, 'start') : null;
      if (!legend || [...occupied, ...tailBoxes].some(o => overlaps(o, legend.box, 6))) { legend = legend || mkLegend(pn.x + pn.w / 2, pn.y, pn.w, pn.h, 'middle'); problems.push('legend'); }
    }
    if (!legend.ok || chips.some(c => overlaps(c.box, legend.box, 4))) problems.push('legend');
    if (topLegend && (legend.box.y + legend.box.h > Math.min(stage.docTop, G.headTop) - 8 || Object.values(bubbles).some(b => overlaps(b.box, legend.box, 6)))) problems.push('legend-top');
    if (!topLegend) occupied.push(legend.box);
  }
  // Δ marker beside the moved flag (context coords) + its label, reached down the page margin
  const after = pts.after;
  const q1 = G.grip(by, stage.rowY(after));
  const markerR = U(22);
  // Δ marker: the first spot around the moved flag clear of hands, heads, flags and page text
  const dirM = by === 'a' ? 1 : -1;
  const mFlagBoxes = flags.map(f => { const q = G.grip(f.who, stage.rowY(f.id === 'open' ? pts.after : f.row)); return {x: f.who === 'a' ? q.x - 35 * s : q.x - 46 * s, y: q.y - 13 * s, w: 81 * s, h: 30 * s}; });
  const mHands = ['a', 'b'].flatMap(id => [G.restNear(id), G.restFar(id)]).map(q => ({x: q.x - 20 * k, y: q.y - 20 * k, w: 40 * k, h: 40 * k}));
  const mHeads = ['a', 'b'].map(id => { const hd = G.head(id); return {x: hd.x - 48 * k, y: hd.y - 52 * k, w: 96 * k, h: 104 * k}; });
  const mBlock = [...mFlagBoxes, ...mHands, ...mHeads, ...stage.textBoxes];
  const mCands = [
    {x: q1.x - dirM * (35 * s + markerR + 8), y: q1.y},
    {x: q1.x - dirM * 4 * s, y: q1.y - 13 * s - markerR - 8}, {x: q1.x - dirM * 4 * s, y: q1.y + 17 * s + markerR + 8},
    {x: q1.x - dirM * (35 * s + markerR + 8), y: q1.y - 13 * s - markerR - 8}, {x: q1.x - dirM * (35 * s + markerR + 8), y: q1.y + 17 * s + markerR + 8},
  ];
  const mBox = c => ({x: c.x - markerR - 3, y: c.y - markerR - 3, w: 2 * markerR + 6, h: 2 * markerR + 6});
  const clearCands = mCands.filter(c => !mBlock.some(b => overlaps(mBox(c), b, 0)));
  if (!clearCands.length) problems.push('marker');
  let mPos = clearCands[0] || mCands[0];
  let markLabel = null;
  let markLeaderCrossing = false;
  // the marker's label (the before → after values stay readable in the docked card)
  // inline dock: the marker's own callout carries the substitution (the context is not shrunk at the hold)
  const markText = inlineDock ? `${p.contextLabels.marker}: ${p.beforeValue} → ${p.afterValue}` : p.contextLabels.marker;
  if (ctx.show('key')) {
    const pageBox = stage.docBox;
    const flagBoxes = flags.map(f => {
      const q = G.grip(f.who, stage.rowY(f.id === 'open' ? after : f.row));
      return {x: f.who === 'a' ? q.x - 36 * s : q.x - 47 * s, y: q.y - 14 * s, w: 83 * s, h: 28 * s};
    });
    const people = ['a', 'b'].map(id => {
      const hip = id === 'a' ? G.hipA : G.hipB, d = id === 'a' ? 1 : -1;
      return {x: Math.min(hip.x - d * 70 * k, hip.x + d * 46 * k), y: G.headTop - 6, w: 116 * k, h: G.floor - G.headTop};
    });
    const pn = stage.panel;
    const tryAt = (m, last) => {
      // the leader ends on the marker itself; the label never overlaps the page
      const target = {x: m.x, y: m.y + markerR};
      const mb = {x: m.x - markerR, y: m.y - markerR, w: markerR * 2, h: markerR * 2};
      const base = {name: 'mark', text: markText, target, size: Math.min(S, doc.size), minSize: Math.min(Smin, doc.size), maxLines: 4};
      let l = placeCallout(ctx, {...base, occupied: [...occupied, ...tailBoxes, ...flagBoxes, pageBox, ...people, mb], bounds: {x: pn.x - 6, y: pn.y - 4, w: pn.w + 12, h: pn.h + 20 * k}, maxW: Math.min(700, pn.w), step: 10});
      if (!l.ok) l = placeCallout(ctx, {...base, occupied: [...occupied, ...tailBoxes, ...flagBoxes, pageBox, ...people, mb], bounds: {x: 10, y: 10, w: D.w - 20, h: D.h - 20}, maxW: Math.min(700, D.w - 24), step: 12});
      if (!l.ok && last) {
        // last resort (extreme text only): a free spot whose leader may pass over artwork (never over text)
        l = placeCallout(ctx, {...base, occupied: [...occupied, ...tailBoxes, ...flagBoxes, pageBox, mb], bounds: {x: 10, y: 10, w: D.w - 20, h: D.h - 20}, maxW: Math.min(700, D.w - 24), step: 12, leaderCheck: false});
        if (l.ok) l.crossing = true;
      }
      return l;
    };
    for (const m of clearCands.length ? clearCands : [mPos]) {
      markLabel = tryAt(m, false);
      if (markLabel.ok) { mPos = m; break; }
    }
    if (!markLabel.ok && lastResort) {
      for (const m of clearCands.length ? clearCands : [mPos]) {
        markLabel = tryAt(m, true);
        if (markLabel.ok) { mPos = m; markLeaderCrossing = true; break; }
      }
    }
    if (!markLabel.ok) problems.push('mark');
  }
  const marker = changedMarker(ctx, {name: 'marker', x: mPos.x, y: mPos.y, radius: markerR, opacity: 0});
  return {mPos, markerR, mHands, k, s, G, doc, stage, mk, flags, bubbles, chips, legend, cap, occupied, problems, S, Smin, z, marker, markLabel, markLeaderCrossing};
}


/**
 * Lens nodes for one frame (same node set as frameworks/lens.js). The window never slides over the
 * scene: it grows at its destination out of its far side (right edge on wide frames, bottom edge
 * on tall ones) and its reach is capped every frame so it never covers a head of the (moving)
 * context. The enlarged copy is at the final, fixed zoom and is shown only once the card is
 * half open (a blank opaque card before that), so no offset double image of the detail appears.
 * Returns the nodes and the effective opening.
 */
function lensFrame(L, ct, p, D) {
  const src = L.srcCtx, Dst = L.dest;
  const S = {x: ct.x + src.x * ct.s, y: ct.y + src.y * ct.s, w: src.w * ct.s, h: src.h * ct.s};
  const heads = L.headBoxes.map(b => ({x: ct.x + b.x * ct.s, y: ct.y + b.y * ct.s, w: b.w * ct.s, h: b.h * ct.s}));
  let pe = p;
  // the card grows from its far side and only into free space: never over the context scene as
  // currently drawn (people, table, page, bubbles), so it shrinks ahead of the returning context
  const sb = {x: ct.x + L.sceneBox.x * ct.s, y: ct.y + L.sceneBox.y * ct.s, w: L.sceneBox.w * ct.s, h: L.sceneBox.h * ct.s};
  // while the scene still reaches past the lens's place, the card (with its copy) sits further out in
  // the free space beyond it and slides home as the scene shrinks (never over the scene)
  const near = L.stacked ? sb.y + sb.h + 6 : sb.x + sb.w + 6;
  const home = L.stacked ? Dst.y : Dst.x, len = L.stacked ? Dst.h : Dst.w;
  const overlapX = L.stacked ? sb.x < Dst.x + Dst.w && sb.x + sb.w > Dst.x : sb.y < Dst.y + Dst.h && sb.y + sb.h > Dst.y;
  if (overlapX) pe = Math.min(p, clamp((L.freeFar - near) / len));
  for (const hb of heads) {
    if (L.stacked ? hb.x < Dst.x + Dst.w && hb.x + hb.w > Dst.x : hb.y < Dst.y + Dst.h && hb.y + hb.h > Dst.y) pe = Math.min(pe, clamp((L.freeFar - ((L.stacked ? hb.y + hb.h : hb.x + hb.w) + 6)) / len));
  }
  // the card and its copy scale up together from the far edge (no rim ever cuts a line of the copy)
  const lo0 = home + len * (1 - pe);
  const shift = overlapX ? Math.max(0, near - lo0) : 0;
  const R = L.stacked
    ? {x: Dst.x + Dst.w * (1 - pe) / 2, y: lo0 + shift, w: Dst.w * pe, h: Dst.h * pe}
    : {x: lo0 + shift, y: Dst.y + Dst.h * (1 - pe) / 2, w: Dst.w * pe, h: Dst.h * pe};
  const kx = (Dst.w / src.w) * Math.max(pe, 1e-4), ky = (Dst.h / src.h) * Math.max(pe, 1e-4);
  const vis = pe > 0.001;
  const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2}, rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  let a1, a2, b1, b2;
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x, rx = rc.x > sc.x ? R.x : R.x + R.w;
    [a1, a2, b1, b2] = [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  } else {
    const sy = rc.y > sc.y ? S.y + S.h : S.y, ry = rc.y > sc.y ? R.y : R.y + R.h;
    [a1, a2, b1, b2] = [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
  }
  // the card never overlaps its source, so the enlarged copy fades in as it grows (from ~30 % open,
  // whole by ~42 %) and stays until it is ~42 % closed: a bare card is on screen only briefly
  const copy = clamp((pe - 0.3) / 0.12);
  return {pe, copy, R, S, nodes: {
    'lens-dim': {d: `M0 0h${r(D.w)}v${r(D.h)}h${r(-D.w)}ZM${r(S.x)} ${r(S.y)}v${r(S.h)}h${r(S.w)}v${r(-S.h)}Z`, opacity: r(0.42 * pe, 3)},
    'lens-src': {d: roundRectPath(S.x, S.y, S.w, S.h, 10), opacity: vis ? 1 : 0},
    'lens-coneA': {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: pe > 0.05 ? 1 : 0},
    'lens-coneB': {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: pe > 0.05 ? 1 : 0},
    'lens-cliprect': rect,
    'lens-win': {opacity: vis ? 1 : 0},
    'lens-shadow': {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height},
    'lens-bg': rect,
    'lens-border': rect,
    'lens-occ': {x: rect.x, y: rect.y, width: rect.width, height: rect.height, opacity: vis ? 1 : 0},
    'lens-content': {transform: `${T(R.x - src.x * kx, R.y - src.y * ky)} scale(${r(kx, 4)} ${r(ky, 4)})`, opacity: r(copy, 3)},
  }};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 920], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const D = ctx.design;
    const U = pxUnit(ctx);
    const shape = ctx.view.shape;
    const P0 = resolvePoints(p.props);
    const passages = p.props.document.passages;
    let before = passageIndex(passages, p.beforeValue, P0.open);
    if (before === P0.same) before = P0.open;
    let after = passageIndex(passages, p.afterValue, before);
    const pts = {...P0, before, after};

    // bottom band: the context caption (from the start) and, at the hold, the docked substitution
    // "<flagOn>: <before, struck> → <after>" under it
    const S0 = U(21.5);
    const dockW = D.w - 24;
    const showAll = ctx.show('all');
    let dCap = showAll ? fitWords(`${t.context}: ${p.contextLabels.context}`, {maxWidth: dockW - 30, size: S0, minSize: U(16.6), maxLines: 2, weight: 600}) : null;
    let dLabel = fitWords(`${t.flagOn}:`, {maxWidth: dockW - 30, size: S0, minSize: U(16.6), maxLines: 2, weight: 600});
    const dVal = v => fitWords(v, {maxWidth: (dockW - 30 - 70) / 2, size: S0, minSize: U(16.6), maxLines: 3, weight: 700});
    const dB = dVal(p.beforeValue), dA = dVal(p.afterValue);
    const dPad = S0 * 0.55;
    const inline = dLabel.width + dB.width + dA.width + 110 + dPad * 2 <= dockW && dLabel.lines.length === 1;
    const valsH = inline ? Math.max(dLabel.height, dB.height, dA.height) : dLabel.height + S0 * 0.3 + Math.max(dB.height, dA.height);
    const showDock = ctx.show('key');
    const dockH = showDock || dCap ? dPad * 2 + (dCap ? dCap.height + S0 * 0.4 : 0) + (showDock ? valsH : 0) : 0;
    const hs = Math.min(1, (D.h - dockH - 22) / D.h);
    // widest lens region (smallest thumbnail): the context page is capped so its full row fits the lens at 1.5×
    const lensRegionW = shape === 'landscape' ? D.w - (6 + D.w * 0.36 + 20) - 12 : D.w - 24;
    const docCap = lensRegionW / 1.5 - 4;
    // context: largest stage whose labels fit (19.6 px first, then 16.6 px)
    let C = null;
    const tried = [];
    outer: for (const [floorPx, lastResort] of [[19.6, false], [16.6, false], [16.15, false], [16.15, true]]) {
      for (const z of floorPx > 17 ? [1, 0.94, 0.88, 0.82, 0.76, 0.7] : [1, 0.94, 0.88, 0.82, 0.76, 0.7, 0.64, 0.58]) {
        for (const legendAt of ['panel', 'side', 'top']) {
          C = composeContext(ctx, z, floorPx, pts, legendAt, lastResort, hs, false, docCap);
          tried.push(`${floorPx}/${z}/${legendAt}${lastResort ? '/last' : ''}:${C.problems.join('+')}`);
          if (!C.problems.length) break outer;
        }
      }
    }
    // inline dock (no bottom band): the context keeps full size at the hold and the Δ marker's callout
    // carries "<marker>: <before> → <after>"; tried only when the docked layout does not fit
    let inlineDock = false;
    if (C.problems.length) {
      outer2: for (const floorPx of [19.6, 16.6, 16.15]) {
        for (const z of [1, 0.94, 0.88, 0.82, 0.76, 0.7]) {
          for (const legendAt of ['panel', 'side', 'top']) {
            const C2 = composeContext(ctx, z, floorPx, pts, legendAt, false, 1, true, docCap);
            tried.push(`inline/${floorPx}/${z}/${legendAt}:${C2.problems.join('+')}`);
            if (!C2.problems.length) { C = C2; inlineDock = true; break outer2; }
          }
        }
      }
    }
    const {G, stage, doc, k, s} = C;
    const lensStage = C.mk('ln');
    const by = pts.by;
    const other = by === 'a' ? 'b' : 'a';
    const problems = [...C.problems];

    // the move: the same hand peels the open-question flag and presses it at the new row
    const script = placementScript(stage, [{flag: 'open', who: by, row: after, from: before, w: W.move}], {}, {placed: {sameA: pts.same, sameB: pts.same, open: before}});
    // dependent geometry drawn here: the empty outline opposite (old / new row) and the ghost of the old spot
    const slotAt = (row, name) => {
      const q = G.grip(other, stage.rowY(row));
      return g({transform: `${T(q.x, q.y)} scale(${other === 'a' ? 1 : -1} 1)`}, emptySlot(ctx, {name, s}));
    };
    const ghost = (() => {
      const q = G.grip(by, stage.rowY(before));
      return g({transform: `${T(q.x, q.y)} scale(${by === 'a' ? 1 : -1} 1)`}, emptySlot(ctx, {name: 'ghost', s, color: th.accent2}));
    })();
    const deps = pre => g(null, slotAt(before, `${pre}-slotOld`), slotAt(after, `${pre}-slotNew`));

    // thumbnail + lens geometry
    const stacked = shape !== 'landscape';
    let ts = 0.44;
    let thumb = stacked ? {x: (D.w - D.w * ts) / 2, y: 6} : {x: 6, y: (D.h - D.h * ts) / 2};
    const toThumb = q => ({x: thumb.x + q.x * ts, y: thumb.y + q.y * ts}); // reads the final ts/thumb
    // source: the owner's margin around the old and new rows, some of the passage text
    const yA = Math.min(stage.rowY(before), stage.rowY(after)), yB = Math.max(stage.rowY(before), stage.rowY(after));
    // include whole neighbouring rows (no text cut mid-line at the lens edge)
    // the window's top and bottom edges fall in the gaps between text blocks (header / rows), so
    // no line of text is ever cut: one full row above and below the changing rows is included
    const tb = stage.textBoxes; // [header, row0, row1, …]
    // cropped to the isolated detail: only the rows the flag moves between (the lens is a real zoom)
    const r0 = Math.min(pts.before, pts.after), r1 = Math.max(pts.before, pts.after);
    const above = r0 === 0 ? tb[0] : tb[r0]; // block above the first included row
    const topEdge = r0 === 0 ? (tb[0].y + tb[0].h + tb[1].y) / 2 : (tb[r0].y + tb[r0].h + tb[r0 + 1].y) / 2;
    const botEdge = r1 >= pts.n - 1 ? tb[pts.n].y + tb[pts.n].h + doc.size * 0.8 : (tb[r1 + 1].y + tb[r1 + 1].h + tb[r1 + 2].y) / 2;
    void above;
    const edge = by === 'a' ? G.x0 : G.x1;
    // the whole row width (ref chips carry the datum) plus the owner's margin flags
    const srcW = G.docW + 70 * s;
    let src = {x: by === 'a' ? edge - 66 * s : edge + 66 * s - srcW, y: topEdge, w: srcW, h: botEdge - topEdge};
    // value card (the one editorial annotation): label, old value (struck later), new value
    const S = C.S, Smin = C.Smin;
    const cardMax = stacked ? D.w - 24 : D.w - D.w * ts - 30;
    const labelFit = fitWords(`${t.flagOn}:`, {maxWidth: cardMax - 40, size: S, minSize: Smin, maxLines: 2, weight: 600});
    const valFit = v => fitWords(v, {maxWidth: (cardMax - 110) / 2, size: S * 1.1, minSize: Smin, maxLines: 3, weight: 700});
    const fb = valFit(p.beforeValue), fa = valFit(p.afterValue);
    if (labelFit.truncated || fb.truncated || fa.truncated) problems.push('card');
    const cardPad = S * 0.6;
    const cardH = cardPad * 2 + labelFit.height + S * 0.4 + Math.max(fb.height, fa.height) + S * 0.4;
    const cardW = Math.min(cardMax, Math.max(labelFit.width, fb.width + fa.width + 110) + cardPad * 2);
    // lens destination: the free side of the thumbnail, above the card; same aspect as the source
    const regionFor = (ts2, th2) => (stacked
      ? {x: 12, y: th2.y + D.h * ts2 + 16, w: D.w - 24, h: D.h - (th2.y + D.h * ts2 + 16) - cardH - 24 - dockH}
      : {x: th2.x + D.w * ts2 + 20, y: 12, w: D.w - (th2.x + D.w * ts2 + 20) - 12, h: D.h - cardH - 36 - dockH});
    // real zoom: the lens shows the detail at ≥ 1.5× its size in the hold scene; the thumbnail shrinks
    // (0.44 → 0.36 of the frame) when the free region is too small for that
    const holdS = inlineDock ? 1 : hs;
    const zoomOf = rg => Math.min(rg.w / src.w, rg.h / src.h, p.detailGeometry.zoom);
    for (const t2 of [0.44, 0.4, 0.36]) {
      const th2 = stacked ? {x: (D.w - D.w * t2) / 2, y: 6} : {x: 6, y: (D.h - D.h * t2) / 2};
      ts = t2; thumb = th2;
      if (zoomOf(regionFor(t2, th2)) >= 1.5 * holdS + 0.01) break;
    }
    const region = regionFor(ts, thumb);
    if (zoomOf(region) < 1.5 * holdS) problems.push('zoom');
    const zoomMax = p.detailGeometry.zoom;
    const srcT = {x: toThumb(src).x, y: toThumb(src).y, w: src.w * ts, h: src.h * ts};
    const zf = Math.min(region.w / srcT.w, region.h / srcT.h, zoomMax / ts * 1.0);
    const dest = {x: region.x + (region.w - srcT.w * zf) / 2, y: region.y + (region.h - srcT.h * zf) * (stacked ? 0.5 : 0.35), w: srcT.w * zf, h: srcT.h * zf};
    // the lens holds a second copy of the stage in CONTEXT coordinates; its window is driven per frame
    // from the source region as currently drawn (see lensFrame), so it can open while the context shrinks
    const lensContent = g(null, lensStage.node, deps('ln'));
    const L0 = lens(ctx, {name: 'lens', source: src, dest, content: lensContent, frame: {x: 0, y: 0, w: D.w, h: D.h}, color: th.accent2});
    const cardX = stacked ? (D.w - cardW) / 2 : dest.x + dest.w / 2 - cardW / 2;
    const cardY = dest.y + dest.h + 14;
    const cx0 = clamp(cardX, 8, D.w - 8 - cardW);
    const valY = cardY + cardPad + labelFit.height + S * 0.4;
    const bx = cx0 + cardPad, axX = bx + fb.width + 24, ax2 = axX + 50;
    const card = !ctx.show('key') ? null : g({name: 'card', opacity: 0},
      h('path', {d: roundRectPath(cx0, cardY, cardW, cardH, 14), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
      textBlock(labelFit, {x: cx0 + cardPad, y: cardY + cardPad, fill: th.ink}),
      g({name: 'card-before'}, textBlock(fb, {x: bx, y: valY, fill: th.ink})),
      fb.lines.map((_, i) => h('line', {name: `card-strike${i}`, x1: r(bx - 4), y1: r(valY + i * fb.lineHeight + fb.size * 0.52), x2: r(bx - 4), y2: r(valY + i * fb.lineHeight + fb.size * 0.52), stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round'})),
      g({name: 'card-arrow', opacity: 0}, h('path', {d: `M${r(axX)} ${r(valY + fb.size * 0.55)}H${r(ax2 - 10)}M${r(ax2 - 22)} ${r(valY + fb.size * 0.55 - 10)}L${r(ax2 - 8)} ${r(valY + fb.size * 0.55)}L${r(ax2 - 22)} ${r(valY + fb.size * 0.55 + 10)}`, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})),
      g({name: 'card-after', opacity: 0}, textBlock(fa, {x: ax2 + 10, y: valY, fill: th.accent2})),
    );
    // each line of the old value is struck (lengths measured per line)
    const strikeLens = fb.lines.map(l => ctx.measure(l, fb.size, fb.weight, fb.family) + 8);

    const {marker, markLabel} = C;
    // generic captions in the dock never exceed the clause text as drawn at the hold (item 17)
    const capMax = Math.min(C.doc.size, ...Object.values(C.bubbles).map(b => b.fitSize), ...C.chips.map(c => c.fit.size)) * (inlineDock ? 1 : hs);
    if (dCap && dCap.size > capMax + 0.01) dCap = fitWords(`${t.context}: ${p.contextLabels.context}`, {maxWidth: dockW - 30, size: capMax, minSize: capMax, maxLines: 3, weight: 600});
    if (dLabel.size > capMax + 0.01) dLabel = fitWords(`${t.flagOn}:`, {maxWidth: dockW - 30, size: capMax, minSize: capMax, maxLines: 2, weight: 600});
    const dockY = D.h - dockH - 6;
    const valsW = inline ? dLabel.width + dB.width + dA.width + 110 : Math.max(dLabel.width, dB.width + dA.width + 90);
    const dW = Math.max(dCap ? dCap.width : 0, showDock ? valsW : 0) + dPad * 2;
    const dX = (D.w - dW) / 2;
    const vy = dockY + dPad + (dCap ? dCap.height + S0 * 0.4 : 0);
    const dValY = inline ? vy + (valsH - dB.height) / 2 : vy + dLabel.height + S0 * 0.3;
    const dbx = inline ? dX + dPad + dLabel.width + 18 : dX + dPad;
    const dax = dbx + dB.width + 70;
    const dock = !inlineDock && (showDock || dCap) ? g({name: 'dock', opacity: 0},
      h('path', {d: roundRectPath(dX, dockY, dW, dockH, 14), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
      dCap ? textBlock(dCap, {x: dX + dPad, y: dockY + dPad, fill: th.ink, name: 'dock-cap'}) : null,
      showDock ? g({name: 'dock-vals', opacity: 0},
        textBlock(dLabel, {x: dX + dPad, y: inline ? dValY : vy, fill: th.ink}),
        textBlock(dB, {x: dbx, y: dValY, fill: th.inkSoft}),
        dB.lines.map((l, i) => h('line', {x1: r(dbx - 3), x2: r(dbx + ctx.measure(l, dB.size, dB.weight, dB.family) + 3), y1: r(dValY + i * dB.lineHeight + dB.size * 0.52), y2: r(dValY + i * dB.lineHeight + dB.size * 0.52), stroke: th.accent2, 'stroke-width': 3.5, 'stroke-linecap': 'round'})),
        h('path', {d: `M${r(dax - 58)} ${r(dValY + dB.size * 0.55)}H${r(dax - 16)}M${r(dax - 28)} ${r(dValY + dB.size * 0.55 - 10)}L${r(dax - 14)} ${r(dValY + dB.size * 0.55)}L${r(dax - 28)} ${r(dValY + dB.size * 0.55 + 10)}`, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        textBlock(dA, {x: dax, y: dValY, fill: th.accent2})) : null,
    ) : null;
    if (!inlineDock && dCap && dCap.truncated) problems.push('caption');
    if (!inlineDock && (dLabel.truncated || dB.truncated || dA.truncated)) problems.push('dock');
    const hsUsed = inlineDock ? 1 : hs;
    const full = {x: (D.w - D.w * hsUsed) / 2, y: 4, s: hsUsed};
    const headBoxes = ['a', 'b'].map(id => { const hd = G.head(id); return {x: hd.x - 48 * k, y: hd.y - 52 * k, w: 96 * k, h: 104 * k}; });
    // everything the context draws (people, table, page, bubbles, chips, legend, caption), in context
    // coordinates: the lens card only ever occupies space outside this box as currently drawn
    const sceneParts = [{x: G.left - 6, y: Math.min(stage.docTop, G.headTop - 30 * k) - 6, w: G.right - G.left + 12, h: G.floor + 12 - (Math.min(stage.docTop, G.headTop - 30 * k) - 6)},
      ...Object.values(C.bubbles).map(b => b.box), ...C.chips.map(c => c.box), C.legend && C.legend.box, C.cap && C.cap.box].filter(Boolean);
    const sx0 = Math.min(...sceneParts.map(b => b.x)), sy0 = Math.min(...sceneParts.map(b => b.y));
    const sceneBox = {x: sx0, y: sy0, w: Math.max(...sceneParts.map(b => b.x + b.w)) - sx0, h: Math.max(...sceneParts.map(b => b.y + b.h)) - sy0};
    // far edge of the free space the lens card may use while the scene is still large: down to the
    // dock (stacked) or the right margin (landscape); the value card below the lens is not shown then
    const freeFar = stacked ? (!inlineDock && (showDock || dCap) ? dockY - 12 : D.h - 8) : D.w - 8;
    return {headBoxes, sceneBox, freeFar, stacked, srcCtx: src, C, G, stage, lensStage, dock, dockVals: !inlineDock && showDock, inlineDock, full, hs: hsUsed, script, pts, by, other, ts, thumb, L0, srcT, dest, card, strikeLens, strikeX: bx - 4, marker, markLabel, ghost, deps: deps('cx'), problems, labelsFit: problems.length === 0, tried, zf};
  },
  build(ctx, L) {
    const C = L.C;
    return g(null,
      g({name: 'ctx'},
        C.stage.node, L.deps, L.ghost,
        C.cap && C.cap.node,
        C.chips.map(c => c.node),
        C.legend && C.legend.node,
        C.bubbles.a.node, C.bubbles.b.node,
        L.marker, L.markLabel && L.markLabel.node),
      // opaque-overlay marker for the layout heuristics: context text lying fully under the lens
      // window is hidden from the viewer (drawn before the lens copy, so the copy's text is still checked)
      h('rect', {name: 'lens-occ', 'data-occludes': 1, fill: 'none', stroke: 'none', opacity: 0}),
      L.L0.node,
      L.card,
      L.dock,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const st = L.script(u);
    const posed = L.stage.pose({...st, marks: {band: 1, ring: 1, slot: 0}});
    const posedLens = L.lensStage.pose({...st, marks: {band: 1, ring: 1, slot: 0}});
    Object.assign(nodes, posed.nodes, posedLens.nodes);
    for (const id of ['a', 'b']) Object.assign(nodes, L.C.bubbles[id].frame(1, [1, 1]));
    if (L.C.legend) nodes.legend = {opacity: 1};
    // camera: full context → thumbnail → full context
    // the pull-back starts briskly (free space for the lens opens at once), the return eases in and out
    const out = ease.outCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.zoom)));
    const sc = lerp(L.full.s, L.ts, out);
    nodes.ctx = {transform: `${T(lerp(L.full.x, L.thumb.x, out), lerp(L.full.y, L.thumb.y, out))} scale(${r(sc, 4)})`};
    if (L.dock) nodes.dock = {opacity: r(seg(u, ...W.caption), 3)};
    if (L.C.cap) nodes['ctx-cap'] = {opacity: r(seg(u, ...W.caption), 3)};
    if (L.dockVals) nodes['dock-vals'] = {opacity: r(seg(u, ...W.marker), 3)};
    // the context grows back first (lens still open over it), then the lens retracts quickly into its source
    const open = ease.outCubic(seg(u, ...W.open)) * (1 - ease.inCubic(seg(u, ...W.close)));
    const cx0 = lerp(L.full.x, L.thumb.x, out), cy0 = lerp(L.full.y, L.thumb.y, out);
    const lf = lensFrame(L, {x: cx0, y: cy0, s: sc}, open, ctx.design);
    Object.assign(nodes, lf.nodes);
    // the lens is cropped to the passage rows: its copy of the page header is never in the window
    nodes['ln-docref'] = {opacity: 0};
    nodes['ln-doctitle'] = {opacity: 0};
    // dependent geometry in both copies
    const slotOld = 1 - seg(u, ...W.slotOut), slotNew = seg(u, ...W.slotIn);
    for (const pre of ['cx', 'ln']) {
      nodes[`${pre}-slotOld`] = {opacity: r(L.pts.before === L.pts.after ? 1 : slotOld, 3)};
      nodes[`${pre}-slotNew`] = {opacity: r(L.pts.before === L.pts.after ? 0 : slotNew, 3)};
    }
    nodes.ghost = {opacity: r(L.pts.before === L.pts.after ? 0 : seg(u, ...W.ghost), 3)};
    // card
    // the value card leaves before the context grows back (no ghost over the returning scene)
    const cardOp = seg(u, ...W.card) * (1 - seg(u, ...W.cardOut));
    const strike = seg(u, ...W.strike);
    if (L.card) {
      nodes.card = {opacity: r(cardOp, 3)};
      L.strikeLens.forEach((len, i) => { nodes[`card-strike${i}`] = {x2: r(L.strikeX + len * strike, 2)}; });
      nodes['card-arrow'] = {opacity: r(seg(u, ...W.strike), 3)};
      nodes['card-after'] = {opacity: r(seg(u, ...W.after), 3)};
    }
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mk, 3)};
    if (L.markLabel) Object.assign(nodes, L.markLabel.frame(mk));
    const G = L.G;
    const fp = posed.flagPos.open;
    const rowOfY = y => {
      for (let i = 0; i < L.pts.n; i++) if (Math.abs(L.stage.rowY(i) - y) < 1) return i;
      return -1;
    };
    const at = st.flags.open.at === 'placed' ? rowOfY(fp.y) : 'hand';
    const oldGrip = G.grip(L.by, L.stage.rowY(L.pts.before));
    // lens source (thumbnail coords) contains the old flag spot → the detail keeps its source coordinates
    const oldT = {x: L.thumb.x + oldGrip.x * L.ts, y: L.thumb.y + oldGrip.y * L.ts};
    const sT = L.srcT;
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        focusTarget: ctx.params.focusTarget,
        datum: at === L.pts.after && L.pts.after !== L.pts.before ? 'after' : at === L.pts.before ? 'before' : 'moving',
        flagAt: at, before: L.pts.before, after: L.pts.after, samePassage: L.pts.same,
        hand: P2(posed.hands[L.by]), flag: P2(fp), holder: st.holder.open,
        otherFlagsFixed: rowOfY(posed.flagPos.sameA.y) === L.pts.same && rowOfY(posed.flagPos.sameB.y) === L.pts.same,
        contextScale: r(sc / L.full.s, 3), lensOpen: r(lf.pe, 3), lensCopy: r(lf.copy, 3),
        // real zoom: lens text vs the same text in the hold scene
        lensZoom: r((L.dest.w / L.srcCtx.w) / L.full.s, 3), lensDbg: `src${Math.round(L.srcCtx.w)}x${Math.round(L.srcCtx.h)} dest${Math.round(L.dest.w)}x${Math.round(L.dest.h)} hs${L.full.s.toFixed(2)}`,
        lensCoversHead: lf.pe > 0.001 && L.headBoxes.some(b => { const q = {x: cx0 + b.x * sc, y: cy0 + b.y * sc, w: b.w * sc, h: b.h * sc}; return q.x < lf.R.x + lf.R.w && lf.R.x < q.x + q.w && q.y < lf.R.y + lf.R.h && lf.R.y < q.y + q.h; }), dockShown: L.dockVals ? nodes['dock-vals'].opacity : L.inlineDock ? r(seg(u, ...W.marker), 3) : 0, inlineDock: L.inlineDock,
        // the lens copy never cuts a line of text: every text block of the page is fully inside or
        // fully outside the source window (vertically)
        markerClearOfHands: !L.C.mHands.some(b => overlaps({x: L.C.mPos.x - L.C.markerR, y: L.C.mPos.y - L.C.markerR, w: 2 * L.C.markerR, h: 2 * L.C.markerR}, b, 0)),
        lensCutsNoText: L.stage.textBoxes.every(b => b.y + b.h <= L.srcCtx.y + 0.5 || b.y >= L.srcCtx.y + L.srcCtx.h - 0.5 || (b.y >= L.srcCtx.y - 0.5 && b.y + b.h <= L.srcCtx.y + L.srcCtx.h + 0.5)),
        sourceKept: oldT.x >= sT.x && oldT.x <= sT.x + sT.w && oldT.y >= sT.y && oldT.y <= sT.y + sT.h,
        lensClearOfThumb: !(L.dest.x < L.thumb.x + ctx.design.w * L.ts && L.dest.x + L.dest.w > L.thumb.x && L.dest.y < L.thumb.y + ctx.design.h * L.ts && L.dest.y + L.dest.h > L.thumb.y),
        slotOld: nodes['cx-slotOld'].opacity, slotNew: nodes['cx-slotNew'].opacity, ghost: nodes.ghost.opacity,
        struck: r(strike, 3), afterShown: r(seg(u, ...W.after), 3), cardShown: r(cardOp, 3),
        markerShown: r(mk, 3),
        labelsFit: L.labelsFit, problems: L.problems, tried: L.tried, markLeaderCrossing: L.C.markLeaderCrossing,
        allReached: posed.reached,
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-02-inspect',
    title: 'Consultation between professionals — which passage the open question points to',
    titleEs: 'Consulta entre profesionales — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta entre profesionales',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The consultation table after both professionals flagged the shared document. The view pulls back to a thumbnail and a lens enlarges the margin where the open-question flag sits. One datum is substituted — the passage that flag points to: the same hand peels the flag and presses it on the new passage; the empty outline opposite follows, a ghost keeps the old spot and a card shows the old value struck and the new one. Back in context, a Δ marker is pinned beside the moved flag. Nothing is concluded.',
    tags: ['consultation', 'professionals', 'margin flags', 'lens', 'before/after', 'changed datum', 'open question', 'shared document'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-entre-profesionales.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
