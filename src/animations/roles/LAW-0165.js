/**
 * LAW-0165 — Consulta entre profesionales · story
 *
 * Storyboard (side view of a low consultation table between two seated professionals):
 *  0.00–0.15  rest: professional A (left end) and professional B (right end)
 *             sit facing each other; between them ONE shared document stands
 *             upright on a wooden reading stand, its reference, title and
 *             passages readable (rows low on the page, below chin height); each
 *             professional holds a small pad of margin flags in their own colour in
 *             the far hand. Name chips under both (one shared size).
 *  0.15–0.42  the action starts: the first professional (sequence link)
 *             peels a flag off the pad, carries it low (never above the chin,
 *             never near the face) to the page edge and
 *             presses it onto the LEFT/RIGHT margin at the shared passage; a
 *             note bubble opens with its text (bubble and text together). The other
 *             professional follows with their own flag on the other margin at
 *             the same passage.
 *  0.42–0.73  both flags sit level on the two margins: a highlighter band
 *             grows from each flag toward the middle until the halves meet
 *             (same point noted). The professional who raised the open
 *             question lays a second flag at another passage; it gets an open
 *             ring and a dashed empty outline appears on the other margin at
 *             that row (nothing supplied to match — the flag stays apart).
 *  0.73–1.00  hold: the supplied final state. The legend on the table panel
 *             reads "same point noted · as supplied", "open question · as
 *             supplied" and "as supplied · no conclusion drawn"; editorial
 *             callouts fade in. Nobody is shown to be right; no winner,
 *             conclusion or advice. Everything is fully visible from u ≈ 0.87.
 * Flags follow the SOLVED hand from pick-up to press (no teleports). Both professionals get
 * the same name size and the same note size; callouts are never larger than the supplied text.
 * @module animations/roles/LAW-0165
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {clamp, lerp, r, seg} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {
  consultFields, CONSULT_DEFAULTS, sideSpan, KIT_STRINGS, resolvePoints, firstActor, roleOf, pxUnit,
  docLayout, stageGeometry, consultStage, placementScript, fitBubble, noteBubble, legendCard, placeCallout, wchip, overlaps,
} from './kits/consulta-entre-profesionales.js';

const ID = 'LAW-0165';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action clock c: 0 at u = 0.15, 1 at u = 0.78 (main action complete). */
const C0 = 0.15, C1 = 0.78;
const W = {legend: [0.76, 0.82], notes: [0.8, 0.87]};
const TARGETS = ['document', 'samePoint', 'openQuestion'];

const sceneSchema = {
  ...consultFields,
  actorLabels: obj('Chip captions next to each professional (empty = role caption)', {a: str('Caption for professional A', 50), b: str('Caption for professional B', 50)}),
  objectLabels: obj('Names of the two comparison marks (shown in the legend with "as supplied")', {
    samePoint: str('Name of the mark where both flags sit on the same passage', 40),
    openQuestion: str('Name of the mark on a question that stays open', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the final hold: compared (flags laid and the comparison marks drawn) or laid (flags laid, marks not drawn). No conclusion is inferred', ['compared', 'laid']),
};

const defaultParams = {
  ...CONSULT_DEFAULTS,
  actorLabels: {a: '', b: ''},
  objectLabels: {samePoint: 'Same point noted', openQuestion: 'Open question'},
  actionProgress: 1,
  annotations: [{target: 'document', text: 'One shared draft; each flag is a supplied note'}],
  finalState: 'compared',
};

/** Per-shape composition (design units) at a stage scale z (1 = preferred). Flags are drawn at s = k / 1.2. */
function shapeConfig(shape, D, z) {
  if (shape === 'portrait') {
    const k = 1.32 * z, s = k / 1.2;
    const docW = Math.min(D.w - 2 * (sideSpan(k, s) + 10), 560);
    return {k, s, docW, bubbles: 'top', minDocH: 0, bubblePx: 23};
  }
  if (shape === 'square') {
    const k = 1.3 * z, s = k / 1.2;
    return {k, s, docW: Math.min(740, D.w - 2 * (sideSpan(k, s) + 12)), bubbles: 'top', minDocH: 0, bubblePx: 22};
  }
  const k = 1.66 * z;
  return {k, s: k / 1.2, docW: Math.min(640, Math.max(580, D.w * 0.32)) * Math.sqrt(z), bubbles: 'side', minDocH: 0, bubblePx: 21.5};
}

/** One composition attempt at stage scale z; `ok` when every label fits clear of the others. */
function compose(ctx, z, strategy, floorPx, lift = 0) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const U = pxUnit(ctx);
  const shape = ctx.view.shape;
  const cfg = shapeConfig(shape, D, z);
  const S = U(21.5), Smin = U(floorPx);
  const pts = resolvePoints(p.props);
  const [F, Sx] = firstActor(p.relationships);
  const by = pts.by;
  const compared = p.finalState === 'compared';
  const showKey = ctx.show('key');
  const problems = [];

  // --- name chips (their height fixes the floor line)
  const capOf = id => {
    const i = id === 'a' ? 0 : 1;
    const role = p.actorLabels[id] || roleOf(p, id);
    return role ? `${p.actors[i].name} · ${role}` : p.actors[i].name;
  };
  const chipMax = shape === 'landscape' ? Math.min(620, D.w / 2 - 30) : D.w / 2 - 16;
  // two lines (bounded shrink) before a third line
  const two = ['a', 'b'].every(id => !wchip(ctx, capOf(id), {size: S, minSize: Smin, maxLines: 2, maxWidth: chipMax, x: 0, y: 0}).fit.truncated);
  const chipOpt = two ? {size: S, minSize: Smin, maxLines: 2, maxWidth: chipMax, fill: ctx.theme.card, weight: 600} : {size: S, minSize: S, maxLines: 3, maxWidth: chipMax, fill: ctx.theme.card, weight: 600};
  // one shared size for both name chips (equal treatment of the two professionals)
  const chipSize = Math.min(...['a', 'b'].map(id => wchip(ctx, capOf(id), {...chipOpt, x: 0, y: 0}).fit.size));
  chipOpt.size = chipSize; chipOpt.minSize = chipSize;
  const chipH = showKey ? Math.max(...['a', 'b'].map(id => wchip(ctx, capOf(id), {...chipOpt, x: 0, y: 0}).box.h)) : 0;
  const hipY = D.h - 10 - (showKey ? chipH + 12 * cfg.k : 0) - 150 * cfg.k - lift;
  const G = stageGeometry({cx: D.w / 2, docW: cfg.docW, hipY, k: cfg.k, s: cfg.s});

  // --- document text (fitted to the reachable rows band)
  // passage rows sit low on the page (bottom-aligned, header above): every flagged row must be
  // below the chin, so a flag is never carried or pressed at face height
  const docOpt = {w: cfg.docW, s: cfg.s, size: S, minSize: Smin, reference: p.props.document.reference, title: p.props.document.title, passages: p.props.document.passages, wholeWords: true, rowsH: G.rowsBottom - G.rowsTop, minDocH: cfg.minDocH, spread: false};
  let doc = docLayout(ctx, docOpt);
  if (!doc.fits) doc = docLayout(ctx, {...docOpt, rowsH: G.rowsBottom - (G.hipY - 300 * G.k)});
  G.rowsTop = G.rowsBottom - doc.rowsUsed;
  if (!doc.fits) problems.push('doc');
  for (const row of [pts.same, pts.open]) {
    const y = G.rowsTop + doc.rows[row].anchor;
    if (y < G.rowsTopMax) problems.push('reach');
    if (y < G.chinY) problems.push('chin');
  }
  const flags = [
    {id: 'sameA', who: 'a', row: pts.same},
    {id: 'sameB', who: 'b', row: pts.same},
    {id: 'open', who: by, row: pts.open, ring: true},
  ];
  const stage = consultStage(ctx, {prefix: 'st', G, actors: p.actors, doc, document: p.props.document, flags, bandRow: compared ? pts.same : null, slot: compared ? {row: pts.open, side: by === 'a' ? 'b' : 'a'} : null});
  if (stage.docTop < 8) problems.push('docTop');

  // --- placements on the action clock
  const firstOf = F === 'a' ? 'sameA' : 'sameB';
  const secondOf = F === 'a' ? 'sameB' : 'sameA';
  const placements = [
    {flag: firstOf, who: F, row: pts.same, w: [0, 0.34]},
    {flag: secondOf, who: Sx, row: pts.same, w: [0.2, 0.54]},
    {flag: 'open', who: by, row: pts.open, w: by === Sx ? [0.56, 0.86] : [0.4, 0.72]},
  ];
  const openT4 = placements[2].w[0] + 0.84 * (placements[2].w[1] - placements[2].w[0]);
  const marks = compared ? {band: [0.52, 0.66], ring: [openT4 + 0.03, openT4 + 0.13], slot: [openT4 + 0.05, openT4 + 0.15]} : {};
  const script = placementScript(stage, placements, marks);

  // --- note bubbles (supplied notes, one row per flag the professional lays)
  const rowsOf = id => {
    const rows = [{text: id === 'a' ? p.props.same.noteA : p.props.same.noteB, color: stage.color(id), flag: id === 'a' ? 'sameA' : 'sameB'}];
    if (by === id) rows.push({text: p.props.open.note, color: stage.color(id), ring: true, flag: 'open'});
    return rows;
  };
  const occupied = [];
  const bubbles = {};
  const headTop = G.headTop;
  const docTop = stage.docTop;
  // top-band modes keep a band above the document free for the editorial callouts
  let band = 0;
  if (cfg.bubbles !== 'side' && strategy !== 'notesPanel' && ctx.show('all') && p.annotations.length) {
    band = p.annotations.reduce((a, x) => a + wchip(ctx, x.text, {x: 0, y: 0, maxWidth: Math.min(560, D.w * 0.62), size: S, minSize: Smin, maxLines: 3}).box.h + 18, 0) + 10;
  }
  // panel-callout strategy in the top-band modes: the legend heads the band, bubbles sit under it
  let topLegend = null;
  const topMode = cfg.bubbles === 'stack' || !(G.x0 - 34 >= 360 && (cfg.bubbles === 'side' || z < 0.95));
  if (showKey && strategy === 'notesPanel' && topMode) {
    const rowsL = compared ? [
      {kind: 'same', text: `${p.objectLabels.samePoint} · ${t.asSupplied}`},
      {kind: 'open', text: `${p.objectLabels.openQuestion} · ${t.asSupplied}`, color: stage.color(by)},
    ] : [];
    topLegend = legendCard(ctx, {name: 'legend', x: D.w / 2, y: 12, maxW: D.w - 24, maxH: docTop / 2, size: S, minSize: Smin, rows: rowsL, key: t.noConclusion, colors: [stage.color('a'), stage.color('b')]});
    if (!topLegend.ok) problems.push('legend');
  }
  const top0 = topLegend ? topLegend.box.y + topLegend.box.h + 14 : 12;
  const topH = docTop - 30 - band - (top0 - 12);
  const Sb = U(cfg.bubblePx);
  // bubbles beside the heads when the side columns are wide enough, else in the band above the page
  const sideOK = G.x0 - 34 >= 360;
  const mode = cfg.bubbles === 'stack' ? 'stack' : sideOK && (cfg.bubbles === 'side' || z < 0.95) ? 'side' : 'top';
  // two passes: fit each bubble, then both again at the smaller size (same note size for both)
  const regs = {};
  const occBase = occupied.length;
  let commonNote = null;
  for (let pass = 0; pass < 2; pass++) {
    occupied.length = occBase;
    for (const id of ['a', 'b']) {
      const left = id === 'a';
      let reg;
      if (mode === 'side') reg = left ? {x: 12, y: 12, w: G.x0 - 34, h: headTop - 40} : {x: G.x1 + 22, y: 12, w: D.w - G.x1 - 34, h: headTop - 40};
      else if (mode === 'stack') reg = left ? {x: 12, y: top0, w: D.w * 0.8, h: topH / 2 - 8} : {x: D.w * 0.2 - 12, y: top0 + topH / 2 + 8, w: D.w * 0.8, h: topH / 2 - 8};
      else {
        // the band is split in proportion to each professional's note length
        const len = q => rowsOf(q).reduce((a2, x) => a2 + x.text.length, 0);
        const fa = clamp(len('a') / (len('a') + len('b')), 0.36, 0.64);
        const wa = (D.w - 40) * fa;
        reg = left ? {x: 12, y: top0, w: wa, h: topH} : {x: 28 + wa, y: top0, w: D.w - 40 - wa, h: topH};
      }
      const rows = rowsOf(id);
      regs[id] = reg;
      let fit = fitBubble(ctx, rows, {maxW: reg.w, maxH: Math.max(10, reg.h), size: Sb, minSize: U(floorPx > 17 ? floorPx : 16.3), maxLines: 5});
      if (commonNote != null) fit = fitBubble(ctx, rows, {maxW: reg.w, maxH: Math.max(10, reg.h), size: commonNote, minSize: commonNote, maxLines: 5});
      if (!fit.ok) problems.push(`bubble-${id}`);
      const head = G.head(id);
      const bx = mode === 'stack' ? (left ? reg.x : reg.x + reg.w - fit.w) : clamp(head.x - fit.w / 2 + (left ? 60 : -60) * cfg.k, reg.x, reg.x + reg.w - fit.w);
      // stacked bubbles sit low in their band, close to the speakers (short tails)
    const by0 = mode === 'stack' ? reg.y + (reg.h - fit.h) : reg.y + reg.h - fit.h;
      const box = {x: bx, y: by0, w: fit.w, h: fit.h};
      bubbles[id] = {...noteBubble(ctx, {name: `bub-${id}`, box, tail: {x: head.x + (left ? 14 : -14) * cfg.k, y: headTop - 6 * cfg.k}, fit, rows, show: showKey, stroke: stage.color(id)}), rows, fit};
      occupied.push(box);
    }
    if (pass === 0) commonNote = Math.min(bubbles.a.fit.size, bubbles.b.fit.size);
  }
  // tails: keep callouts and leaders off them (sampled along the tail)
  const tailBoxes = [];
  for (const id of ['a', 'b']) {
    const b = bubbles[id].box, head = G.head(id);
    const tip = {x: head.x + (id === 'a' ? 14 : -14) * cfg.k, y: headTop - 6 * cfg.k};
    const base = {x: clamp(tip.x, b.x + 30, b.x + b.w - 30), y: b.y + b.h};
    for (let i = 0; i < 8; i++) {
      const q = {x: lerp(base.x, tip.x, (i + 0.5) / 8), y: lerp(base.y, tip.y, (i + 0.5) / 8)};
      tailBoxes.push({x: q.x - 26, y: q.y - Math.abs(tip.y - base.y) / 16 - 4, w: 52, h: Math.abs(tip.y - base.y) / 8 + 8});
    }
  }

  // --- name chips
  const chips = [];
  if (showKey) {
    for (const id of ['a', 'b']) {
      const hip = id === 'a' ? G.hipA : G.hipB;
      const c0 = wchip(ctx, capOf(id), {...chipOpt, x: hip.x, y: G.floor + 12 * cfg.k, anchor: 'middle'});
      const dx = c0.box.x < 10 ? 10 - c0.box.x : c0.box.x + c0.box.w > D.w - 10 ? D.w - 10 - (c0.box.x + c0.box.w) : 0;
      const c = wchip(ctx, capOf(id), {...chipOpt, x: hip.x + dx, y: G.floor + 12 * cfg.k, anchor: 'middle', name: `chip-${id}`});
      chips.push(c);
      occupied.push(c.box);
    }
    if (overlaps(chips[0].box, chips[1].box, 6)) problems.push('chips');
  }

  // people at the hold (arms resting): head/torso box up to the nose, arm box over the table
  const personBoxes = id => {
    const hip = id === 'a' ? G.hipA : G.hipB, d = id === 'a' ? 1 : -1;
    const box = (x0, x1, y0, y1) => ({x: Math.min(x0, x1), y: y0, w: Math.abs(x1 - x0), h: y1 - y0});
    return [box(hip.x - d * 70 * cfg.k, hip.x + d * 46 * cfg.k, headTop - 6, G.floor), box(hip.x, hip.x + d * 80 * cfg.k, hipY - 120 * cfg.k, G.floor)];
  };
  // --- legend card: on the table's front panel ('legendPanel'), or in free space ('notesPanel')
  let legend = null;
  const legendRows = compared ? [
    {kind: 'same', text: `${p.objectLabels.samePoint} · ${t.asSupplied}`},
    {kind: 'open', text: `${p.objectLabels.openQuestion} · ${t.asSupplied}`, color: stage.color(by)},
  ] : [];
  const pn = stage.panel;
  const mkLegend = (x, y, maxW, maxH, anchor = 'middle') => legendCard(ctx, {name: 'legend', x, y, maxW, maxH, size: S, minSize: Smin, rows: legendRows, key: t.noConclusion, colors: [stage.color('a'), stage.color('b')], anchor});
  const people = [...personBoxes('a'), ...personBoxes('b')];
  if (topLegend) {
    legend = topLegend;
    occupied.push(legend.box);
  } else if (showKey && strategy === 'legendPanel') {
    legend = mkLegend(pn.x + pn.w / 2, pn.y, pn.w, pn.h + 16 * cfg.k);
    if (!legend.ok || chips.some(c => overlaps(c.box, legend.box, 4))) problems.push('legend');
    occupied.push(legend.box);
  } else if (showKey) {
    // free space at the sides (beside the people) or above the page, first that fits clear
    const blocked = [...occupied, ...tailBoxes, stage.docBox, ...people, {x: G.tableL, y: G.tableFar, w: G.tableR - G.tableL, h: G.floor - G.tableFar}];
    const zones = [
      {x: 12, y: headTop - 20, w: G.left - 24, h: G.floor - headTop + 20},
      {x: G.right + 12, y: headTop - 20, w: D.w - G.right - 24, h: G.floor - headTop + 20},
      {x: 12, y: 12, w: D.w - 24, h: stage.docTop - 20},
    ];
    for (const zn of zones) {
      if (zn.w < S * 9 || zn.h < S * 4) continue;
      const cand = mkLegend(zn.x, 0, zn.w, zn.h, 'start');
      if (!cand.ok) continue;
      const b = cand.box;
      // slide within the zone until clear
      for (let y = zn.y; y + b.h <= zn.y + zn.h && !legend; y += 12) {
        for (const x of [zn.x, zn.x + (zn.w - b.w) / 2, zn.x + zn.w - b.w]) {
          const bb = {x, y, w: b.w, h: b.h};
          if (!blocked.some(o => overlaps(bb, o, 8))) { legend = mkLegend(x, y, zn.w, zn.h, 'start'); break; }
        }
      }
      if (legend) break;
    }
    if (!legend) { legend = mkLegend(pn.x + pn.w / 2, pn.y, pn.w, pn.h); problems.push('legend'); }
    occupied.push(legend.box);
  }

  // --- editorial callouts (free space, leaders clear of text and people)
  const notes = [];
  // placed flags (all of them, at the hold) and the empty slot
  const flagBoxes = flags.map(f => {
    const q = G.grip(f.who, stage.rowY(f.row));
    return {x: f.who === 'a' ? q.x - 36 * cfg.s : q.x - 47 * cfg.s, y: q.y - 14 * cfg.s, w: 83 * cfg.s, h: 28 * cfg.s};
  });
  // on the page only the text blocks are obstacles: a leader may run down the empty margin strip
  const obstacles = [...occupied, ...tailBoxes, ...flagBoxes, ...stage.textBoxes, ...personBoxes('a'), ...personBoxes('b'), {x: G.tableL, y: G.tableFar, w: G.tableR - G.tableL, h: G.floor - G.tableFar}];
  if (ctx.show('all')) {
    const flagTip = (who, row) => {
      const q = G.grip(who, stage.rowY(row));
      // on the paper just beyond the flag's adhesive end (reached down the margin strip)
      return {x: q.x + (who === 'a' ? 58 : -58) * cfg.s, y: q.y};
    };
    const onPanel = strategy === 'notesPanel';
    const docTarget = onPanel ? {x: G.x0 + 58 * cfg.s - 16 * cfg.s, y: G.docBottom - 6 * cfg.s} : {x: G.cx, y: docTop};
    const targetOf = a => (a.target === 'document' ? docTarget : a.target === 'samePoint' ? flagTip(F, pts.same) : flagTip(by, pts.open));
    const bounds = onPanel ? {x: pn.x - 6, y: pn.y - 4, w: pn.w + 12, h: pn.h + 22 * cfg.k} : {x: 10, y: 10, w: D.w - 20, h: D.h - 20};
    // leaders from the panel pass the stand's ledge (wood, no text)
    if (onPanel) { const i = obstacles.findIndex(o => o.y === G.tableFar); if (i >= 0) obstacles.splice(i, 1); }
    // editorial callouts are generic captions: never larger than the smallest supplied text drawn
    const capSize = Math.min(S, doc.size, bubbles.a.fit.size, bubbles.b.fit.size, ...chips.map(c => c.fit.size));
    p.annotations.forEach((a, i) => {
      const c = placeCallout(ctx, {name: `note${i}`, text: a.text, target: targetOf(a), occupied: obstacles, bounds, size: capSize, minSize: Math.min(capSize, Smin), maxW: onPanel ? Math.min(pn.w, Math.max(pn.w / p.annotations.length - 12, pn.w * 0.5)) : Math.min(560, D.w * 0.62), maxLines: 3, step: 12});
      if (!c.ok) problems.push(`note${i}`);
      notes.push(c);
      obstacles.push(c.box);
    });
  }
  // the key/legend (generic captions) never exceeds the smallest supplied text actually drawn
  if (legend) {
    const contentMin = Math.min(doc.size, ...Object.values(bubbles).map(b => b.fit.size), ...chips.map(c => c.fit.size));
    if (legend.size > contentMin + 0.01) {
      const b = legend.box;
      const again = legendCard(ctx, {name: 'legend', x: b.x, y: b.y, maxW: b.w, maxH: b.h, size: contentMin, minSize: Math.min(contentMin, Smin), rows: legendRows, key: t.noConclusion, colors: [stage.color('a'), stage.color('b')], anchor: 'start'});
      legend = {...again, box: again.box};
    }
  }
  const tops = [stage.docTop, G.headTop, ...Object.values(bubbles).map(b => b.box.y), ...notes.map(n => n.box.y), ...(legend ? [legend.box.y] : [])];
  const contentTop = Math.min(...tops);
  return {stage, script, placements, marks, bubbles, chips, legend, notes, pts, F, Sx, by, compared, G, cfg, z, strategy, floorPx, lift, contentTop, problems, labelsFit: problems.length === 0};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 920], portrait: [900, 1400]},
  layout(ctx) {
    // Recompose (smaller stage, more room for text) until every label fits.
    let L = null;
    // Try the preferred composition first; recompose (callouts on the table panel, legend beside
    // the people; then a smaller stage) until every label fits clear of the others.
    let best = null;
    const tried = [];
    // first pass keeps every text >= 19.6 px (baseline size); only then text may shrink to 16.6 px
    for (const [z, floorPx] of [1.4, 1.3, 1.2, 1.1, 1, 0.94, 0.88, 0.82, 0.76].map(q => [q, 19.6]).concat([1.3, 1.2, 1.1, 1, 0.94, 0.88, 0.82, 0.76, 0.7].map(q => [q, 16.6]))) {
      for (const strategy of ['legendPanel', 'notesPanel']) {
        L = compose(ctx, z, strategy, floorPx);
        // centre the composition vertically: lift it by half the free band above it
        if (L.labelsFit && L.contentTop > 60) {
          const L2 = compose(ctx, z, strategy, floorPx, (L.contentTop - 12) / 2);
          if (L2.labelsFit) L = L2;
        }
        tried.push(`${z}/${strategy}:${L.problems.join('+')}`);
        L.tried = tried;
        if (L.labelsFit) return L;
        if (!best || L.problems.length < best.problems.length) best = L;
      }
    }
    return best;
  },
  build(ctx, L) {
    return g(null,
      L.stage.node,
      L.chips.map(c => c.node),
      L.legend && L.legend.node,
      L.bubbles.a.node, L.bubbles.b.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const cRaw = clamp((u - C0) / (C1 - C0));
    const c = Math.min(cRaw, p.actionProgress);
    const st = L.script(c);
    const done = p.actionProgress >= 1;
    // talking: the mouth moves briefly after each flag is pressed
    for (const id of ['a', 'b']) {
      let talk = 0;
      for (const pl of L.placements.filter(q => q.who === id)) {
        const ph = st.phases[pl.flag];
        talk = Math.max(talk, seg(c, ph.t3, ph.t4) * (1 - seg(c, ph.b - 0.02, ph.b + 0.06)));
      }
      const flap = ctx.reduced ? 0.5 : 0.25 + 0.55 * Math.abs(Math.sin(timeMs * 0.014 + (id === 'a' ? 0 : 1.1)));
      st[id].mouth = c >= 1 ? 0 : talk * flap;
    }
    const posed = L.stage.pose(st);
    const nodes = posed.nodes;
    // bubbles: open with the professional's first press; each row with its own flag
    for (const id of ['a', 'b']) {
      const B = L.bubbles[id];
      const mine = L.placements.filter(q => q.who === id);
      const open = seg(c, st.phases[mine[0].flag].t3, st.phases[mine[0].flag].t4);
      // the bubble and its text appear together (never an empty bubble)
      const rowsP = B.rows.map(() => seg(open, 0.4, 1));
      Object.assign(nodes, B.frame(open, rowsP));
    }
    if (L.legend) nodes.legend = {opacity: done ? r(seg(u, ...W.legend), 3) : 0};
    const noteP = done ? seg(u, ...W.notes) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const fp = posed.flagPos;
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const rowOfY = y => {
      let best = -1, bd = 3;
      for (let i = 0; i < L.pts.n; i++) { const d = Math.abs(L.stage.rowY(i) - y); if (d < bd) { bd = d; best = i; } }
      return best;
    };
    const where = id => (st.flags[id].at === 'placed' ? rowOfY(fp[id].y) : st.flags[id].at);
    return {
      nodes,
      semantic: {
        beat,
        clock: r(c, 3),
        order: `${L.F}>${L.Sx}`,
        finalState: p.finalState,
        handA: P2(posed.hands.a), handB: P2(posed.hands.b),
        flagSameA: P2(fp.sameA), flagSameB: P2(fp.sameB), flagOpen: P2(fp.open),
        holdSameA: st.holder.sameA, holdSameB: st.holder.sameB, holdOpen: st.holder.open,
        at: {sameA: where('sameA'), sameB: where('sameB'), open: where('open')},
        aligned: st.flags.sameA.at === 'placed' && st.flags.sameB.at === 'placed' && Math.abs(fp.sameA.y - fp.sameB.y) < 0.5,
        openApart: st.flags.open.at === 'placed' && Math.abs(fp.open.y - fp.sameA.y) > 20,
        samePassage: L.pts.same, openPassage: L.pts.open, openBy: L.by,
        band: r(st.marks.band, 3), ring: r(st.marks.ring, 3), slot: r(st.marks.slot, 3),
        bubbleA: r(nodes['bub-a'].opacity, 3), bubbleB: r(nodes['bub-b'].opacity, 3),
        legendShown: L.legend ? nodes.legend.opacity : 0,
        actionCapped: p.actionProgress < 1 && cRaw > p.actionProgress,
        labelsFit: L.labelsFit,
        // a carried or pressed flag stays below the chin (never at the face)
        flagsBelowChin: ['sameA', 'sameB', 'open'].every(id => st.flags[id].at === 'pad' || fp[id].y >= L.G.chinY - 0.5),
        // equal treatment: one name size and one note size for both professionals
        equalSizes: (L.chips.length < 2 || Math.abs(L.chips[0].fit.size - L.chips[1].fit.size) < 0.01) && Math.abs(L.bubbles.a.fit.size - L.bubbles.b.fit.size) < 0.01,
        bubbleTextWithBubble: ['a', 'b'].every(id => !(nodes[`bub-${id}`].opacity > 0.3) || L.bubbles[id].rows.every((_, i) => nodes[`bub-${id}-r${i}`].opacity > 0)),
        problems: L.problems, stageScale: L.z, tried: L.tried,
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
    slug: 'roles-02-story',
    title: 'Consultation between professionals — two sets of flags on one document',
    titleEs: 'Consulta entre profesionales — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta entre profesionales',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two seated professionals share one document on a reading stand. Each picks a margin flag from their own pad and presses it onto the margin at a passage: the two flags on the shared point sit level and a highlighter band joins them; a third flag marks a question that stays open (open ring, empty outline opposite). Supplied notes appear in speech bubbles; a legend says everything is as supplied and no conclusion is drawn.',
    tags: ['consultation', 'professionals', 'notes', 'margin flags', 'sticky notes', 'shared document', 'speech bubble', 'table', 'two people', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-entre-profesionales.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
