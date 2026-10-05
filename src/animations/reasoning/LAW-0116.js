/**
 * LAW-0116 — Hecho contrafactual · inspect
 *
 * Storyboard (the diorama after the base take; a detail lens, no hands):
 *  0.00–0.20 build       The context: the diorama as the base take left it —
 *                        the parcel on the base spot under its flag, the
 *                        figurine stepped back — beside the record card
 *                        ("where the parcel is left: <before value>"), the
 *                        facts, the rule notice and the context caption.
 *  0.20–0.45 isolate     The panels step aside and the diorama shrinks into a
 *                        context thumbnail (kept in view). A lens opens from
 *                        the porch region of the thumbnail — a real enlarged
 *                        copy drawn in the thumbnail's own coordinates — to a
 *                        large window; the rest dims. A slip under the lens
 *                        reads "Before: <before value>".
 *  0.45–0.75 substitute  The before slip is struck through and slides down
 *                        (kept, traceable); then the "After: <after value>
 *                        (hypothetical)" slip takes its place. Only then the
 *                        dependent geometry moves: in the lens (and in the
 *                        thumbnail) the flag and the parcel travel from the
 *                        base spot to the new spot; a dashed ghost keeps the
 *                        old spot. Nothing else in the scene moves.
 *  0.75–1.00 return      The lens closes back onto its source, the diorama
 *                        grows back to full size with the changed spot, a Δ
 *                        marker and its tag ("<marker label> — before: …",
 *                        struck); the record card shows the new value with the
 *                        old one struck; issue, assumption and the key "outcome
 *                        of the hypothetical run: not supplied · no conclusion
 *                        drawn". Seeking back restores the old datum exactly.
 * Wide/square boxes: diorama left, panels right; thumbnail top-left, lens on
 * the right. Tall boxes: diorama on top, panels below; lens under the thumbnail.
 * Legal content: fictional, jurisdiction unspecified, illustrative text.
 * @module animations/reasoning/LAW-0116
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {changedMarker} from '../../primitives/markers.js';
import {inspectFields, obj, oneOf, int} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  HC_STRINGS, hcFields, DEFAULT_CONTENT, STAGE, SPOTS, SPOT_IDS, PW, PH, FLAG_H, fill, hcColors,
  takePlan, takeState, standX, parcelAt, flagBase,
  dioramaArt, parcelArt, ghostArt, flagArt, figurine, ruleNotice, noteChip, listCard, bars, wordSafe, spotBox,
} from './kits/hecho-contrafactual.js';

const ID = 'LAW-0116';
const DURATION = 8000;
const BEATS = {build: [0, 0.18], isolate: [0.18, 0.37], substitute: [0.37, 0.66], ret: [0.66, 1]};
// the context shrinks WHILE the lens opens (and grows back while it closes), so no frame is ever near-empty
const W = {
  rel: [0.06, 0.14], shrink: [0.18, 0.3], open: [0.21, 0.35], slipIn: [0.34, 0.38],
  strike: [0.38, 0.42], slide: [0.41, 0.47], afterIn: [0.47, 0.52], move: [0.52, 0.64],
  close: [0.67, 0.76], grow: [0.69, 0.79], marker: [0.78, 0.83], notes: [0.8, 0.87],
};
const CROP = {x: 438, y: 204, w: 544, h: 256};

const {facts, rules, issues, assumptions} = hcFields;
const sceneSchema = {
  facts, rules, issues, assumptions,
  ...inspectFields(['spot']),
  circumstance: obj('The inspected circumstance: what it is, the base spot and the substituted spot (supplied)', {
    label: {type: 'string', maxLength: 60, description: 'What the circumstance is'},
    before: oneOf('Spot before the substitution (base)', SPOT_IDS),
    after: oneOf('Spot after the substitution (hypothetical)', SPOT_IDS),
    condition: int('Zero-based rule condition the author relates this circumstance to (drawn as a plain relation)', 0, 2),
  }, ['label', 'before', 'after']),
};

const defaultParams = {
  facts: DEFAULT_CONTENT.facts,
  rules: DEFAULT_CONTENT.rules,
  issues: DEFAULT_CONTENT.issues,
  assumptions: DEFAULT_CONTENT.assumptions,
  focusTarget: 'spot',
  beforeValue: 'on the porch bench',
  afterValue: 'on the window sill',
  detailGeometry: {zoom: 2.3, placement: 'auto'},
  contextLabels: {context: 'Context: the scene after the base take', marker: 'Changed datum (as supplied)'},
  circumstance: {label: 'Where the parcel is left', before: 'bench', after: 'sill', condition: 1},
};

/* ------------------------------------------------------------------------ */

/** Record card: circumstance heading, the value row (before; after once substituted, old kept struck). */
function recordCard(ctx, o) {
  const th = ctx.theme;
  const t = ctx.t;
  const col = hcColors(ctx);
  const p = ctx.params;
  const s = o.size;
  const pad = s * 0.7;
  const inner = o.w - pad * 2;
  const K = ctx.show('key');
  const kf = ctx.fit(`${t.circumstance} · ${t.asSupplied}`.toUpperCase(), {maxWidth: inner, size: o.cap, minSize: o.cap, maxLines: 2, weight: 800});
  let y = o.y + pad * 0.9;
  const kindY = y;
  y += kf.height + s * 0.35;
  const lf = ctx.fit(p.circumstance.label, {maxWidth: inner, size: s * 1.02, minSize: s, maxLines: 3, weight: 700});
  const labY = y;
  y += lf.height + s * 0.5;
  const headEnd = y - s * 0.2;
  const dotW = s * 1.1;
  const befT = `${t.before}: ${p.beforeValue}`;
  const aftT = `${t.after}: ${fill(t.whatIfT, {x: p.afterValue})}`;
  const bf = ctx.fit(befT, {maxWidth: inner - dotW, size: wordSafe(ctx, befT, inner - dotW, s), minSize: s * 0.9, maxLines: 3, weight: 600});
  const af = ctx.fit(aftT, {maxWidth: inner - dotW, size: wordSafe(ctx, aftT, inner - dotW, s), minSize: s * 0.9, maxLines: 4, weight: 700});
  const row1 = y;
  const row2 = y + af.height + s * 0.5;
  const hh = row2 + bf.height + s * 0.6 - o.y + pad * 0.3;
  const strike = f => f.lines.map((ln, i) => h('line', {x1: 0, y1: r(i * f.lineHeight + f.size * 0.5), x2: r(ctx.measure(ln, f.size, f.weight, 'sans')), y2: r(i * f.lineHeight + f.size * 0.5), stroke: col.a, 'stroke-width': 2.4}));
  const node = g({name: o.name},
    h('path', {d: roundRectPath(o.x + 5, o.y + 7, o.w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, hh, 10), fill: '#fffdf8', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: `M${o.x + 10} ${o.y}H${o.x + o.w - 10}Q${o.x + o.w} ${o.y} ${o.x + o.w} ${o.y + 10}V${r(headEnd)}H${o.x}V${o.y + 10}Q${o.x} ${o.y} ${o.x + 10} ${o.y}Z`, fill: '#f6e3dc', stroke: th.ink, 'stroke-width': 2.4}),
    h('circle', {cx: r(o.x + o.w / 2), cy: r(o.y + 2), r: 8, fill: col.b, stroke: th.ink, 'stroke-width': 2}),
    ctx.show('all') ? textBlock(kf, {x: o.x + pad, y: kindY, fill: '#8a3b2a'}) : null,
    K ? textBlock(lf, {x: o.x + pad, y: labY, fill: th.ink}) : bars(lf, o.x + pad, labY, th.ink, 0.7),
    // before row: sits in row 1 until substituted, then (struck) in row 2
    g({name: `${o.name}-bef`, transform: T(0, 0)},
      h('circle', {cx: r(o.x + pad + s * 0.35), cy: r(row1 + bf.size * 0.5), r: r(s * 0.3), fill: col.a}),
      K ? textBlock(bf, {x: o.x + pad + dotW, y: row1, fill: th.ink}) : bars(bf, o.x + pad + dotW, row1, col.a, 0.6),
      g({name: `${o.name}-strike`, transform: T(o.x + pad + dotW, row1), opacity: 0}, K ? strike(bf) : h('line', {x1: 0, y1: r(bf.size * 0.5), x2: r(bf.width), y2: r(bf.size * 0.5), stroke: col.a, 'stroke-width': 2.4}))),
    g({name: `${o.name}-aft`, opacity: 0},
      h('circle', {cx: r(o.x + pad + s * 0.35), cy: r(row1 + af.size * 0.5), r: r(s * 0.3), fill: col.b}),
      K ? textBlock(af, {x: o.x + pad + dotW, y: row1, fill: th.ink}) : bars(af, o.x + pad + dotW, row1, col.b, 0.6)),
  );
  return {node, box: {x: o.x, y: o.y, w: o.w, h: hh}, rowDrop: row2 - row1, rowY: row1, rowH: Math.max(af.height, bf.height), befFit: bf, aftFit: af};
}

/** A datum slip (before/after) under the lens. */
function slip(ctx, name, text, o) {
  const th = ctx.theme;
  const col = hcColors(ctx);
  const s = o.size;
  const f = ctx.fit(text, {maxWidth: o.maxWidth - s * 1.4, size: s * 1.08, minSize: s, maxLines: 3, weight: 700});
  const w = f.width + s * 1.4, hh = f.height + s * 0.9;
  const x = o.x - w / 2;
  const strike = f.lines.map((ln, i) => h('line', {x1: r(x + s * 0.7), y1: r(o.y + s * 0.45 + i * f.lineHeight + f.size * 0.5), x2: r(x + s * 0.7 + ctx.measure(ln, f.size, f.weight, 'sans')), y2: r(o.y + s * 0.45 + i * f.lineHeight + f.size * 0.5), stroke: col.a, 'stroke-width': 3}));
  const node = g({name, opacity: 0},
    h('path', {d: roundRectPath(x + 4, o.y + 6, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x, o.y, w, hh, 8), fill: o.fill, stroke: o.color, 'stroke-width': 2.6, 'stroke-dasharray': o.dash || null}),
    ctx.show('key') ? textBlock(f, {x: x + s * 0.7, y: o.y + s * 0.45, fill: th.ink}) : bars(f, x + s * 0.7, o.y + s * 0.45, o.color, 0.6),
    o.struck ? g({name: `${name}-strike`, opacity: 0}, ctx.show('key') ? strike : h('line', {x1: r(x + s * 0.7), y1: r(o.y + s * 0.45 + f.size * 0.5), x2: r(x + s * 0.7 + f.width), y2: r(o.y + s * 0.45 + f.size * 0.5), stroke: col.a, 'stroke-width': 3})) : null,
  );
  return {node, box: {x, y: o.y, w, h: hh}};
}

function compose(ctx, s, k, sc) {
  const D = ctx.design;
  const p = ctx.params;
  const t = ctx.t;
  const shape = ctx.view.shape;
  const m = 24;
  const avail = D.w - 2 * m;
  const cap = Math.min(s, Math.max(s * 0.64, 15 / sc));
  const gap = s * 0.7;
  const L = {s, cap, m, fits: true, shape, gap};
  const cond = Math.min(p.circumstance.condition ?? 0, p.rules.conditions.length - 1);
  L.cond = cond;
  const noteList = [];
  if (ctx.show('all')) {
    p.issues.forEach((q, i) => noteList.push({name: `issue${i}`, text: `${t.issue}: ${q}`, color: ctx.theme.accent3}));
    p.assumptions.forEach((q, i) => noteList.push({name: `assume${i}`, text: `${t.assumed}: ${q}`, color: '#7d8b93'}));
  }
  if (ctx.show('key')) noteList.push({name: 'key', text: t.keyOutcome, color: ctx.theme.ink});
  const ctxCap = ctx.show('all') ? p.contextLabels.context : null;
  const tagText = ctx.show('key') ? `Δ ${p.contextLabels.marker}` : null;
  const stack = (x, y, w, items) => {
    const out = [];
    let yy = y;
    for (const it of items) {
      const c = it.make(x, yy, w);
      out.push({...it, c});
      yy += c.box.h + gap * 0.7;
    }
    return {out, end: yy - gap * 0.7};
  };
  const items = [
    {key: 'record', make: (x, y, w) => recordCard(ctx, {name: 'rec', x, y, w, size: s, cap})},
    {key: 'facts', make: (x, y, w) => listCard(ctx, {name: 'facts', x, y, w, size: s, cap, kind: t.factKind, title: p.facts.title, items: p.facts.events})},
    {key: 'rule', make: (x, y, w) => ruleNotice(ctx, {name: 'rule', x, y, w, size: s, cap, title: p.rules.title, conditions: p.rules.conditions, kind: t.ruleKind, highlight: cond})},
    ...noteList.map(n => ({key: n.name, name: n.name, make: (x, y, w) => noteChip(ctx, n.text, {name: n.name, x, y, size: s, minSize: s, maxWidth: w, maxLines: 5, color: n.color})})),
  ];
  const noteItems = items.filter(it => !['record', 'facts', 'rule'].includes(it.key));
  // caption row above the context: the context caption and (when it fits beside it) the short Δ tag
  const capRow = (w, stackTag = false) => {
    const c = ctxCap ? chip(ctx, ctxCap, {x: 0, y: 0, maxWidth: w, size: s, minSize: s, maxLines: 3}) : null;
    const tg = tagText ? chip(ctx, tagText, {x: 0, y: 0, maxWidth: Math.min(w * 0.46, s * 15), size: s, minSize: s, maxLines: 3, weight: 700}) : null;
    const cw = c ? c.box.w : 0;
    const inRow = !!tg && (!c || cw + gap * 1.5 + tg.box.w <= w);
    // a tag that does not fit beside the caption takes a second row (right-aligned), still outside the scene
    const stacked = !!tg && !inRow && stackTag;
    const capH = c ? c.box.h : 0;
    const hh = stacked ? capH + gap * 0.5 + tg.box.h : Math.max(capH, inRow ? tg.box.h : 0);
    return {h: hh ? hh + 10 : 0, inRow, stacked, capH, tag: tg};
  };
  // notes (and the tag when it is not in the caption row) flow under the context
  const flow = (x0, y0, w, list) => {
    const placed = [];
    let x = x0, y = y0, rowH = 0;
    for (const it of list) {
      const probe = it.make(0, 0, Math.min(w, s * 26));
      if (x > x0 && x + probe.box.w > x0 + w) { x = x0; y += rowH + gap * 0.6; rowH = 0; }
      placed.push({...it, c: it.make(x, y, Math.min(w, s * 26))});
      x += probe.box.w + gap * 0.6;
      rowH = Math.max(rowH, probe.box.h);
    }
    return {placed, h: list.length ? y + rowH - y0 : 0};
  };
  const tagItem = w => ({key: 'tagflow', make: (x, y) => chip(ctx, tagText, {x, y, maxWidth: Math.min(w * 0.46, s * 15), size: s, minSize: s, maxLines: 3, weight: 700})});
  let area;
  if (shape !== 'portrait') {
    // context left (caption row, diorama, notes under it); record, facts and rule in a column on the right
    // wide boxes: the notes join the panel column (the context takes the full height); square: under the context
    const notesRight = shape === 'landscape';
    const colW = shape === 'square' ? avail * 0.42 : Math.max(avail * 0.3, s * 16);
    const areaW = avail - colW - gap * 2;
    let dsF = (areaW / STAGE.w) * k;
    let cr = capRow(STAGE.w * dsF, true);
    const flowList = w => [...(cr.inRow || cr.stacked || !tagText ? [] : [tagItem(w)]), ...(notesRight ? [] : noteItems)];
    {
      // one pass (an iteration could collapse: a narrower context makes the notes under it taller)
      const dw0 = STAGE.w * dsF;
      cr = capRow(dw0, true);
      const nh = flow(0, 0, dw0, flowList(dw0)).h;
      dsF = Math.min(dsF, (D.h - 2 * m - 4 - cr.h - (nh ? nh + gap : 0)) / STAGE.h);
      if (dsF < (areaW / STAGE.w) * k * 0.7) L.fits = false;
    }
    const dw = STAGE.w * dsF, dh = STAGE.h * dsF;
    cr = capRow(dw, true);
    const fl = flowList(dw);
    const nh = flow(0, 0, dw, fl).h;
    const top = m + 4;
    L.full = {x: m, y: top + cr.h, k: dsF};
    L.capAt = {x: m, y: top, w: dw};
    L.capRow = cr;
    const fp = flow(m, top + cr.h + dh + gap, dw, fl);
    if (fp.h && top + cr.h + dh + gap + fp.h > D.h - m) L.fits = false;
    const px = m + dw + gap * 2, pw = D.w - m - px;
    const st = stack(px, m + 4, pw, items.filter(it => ['record', 'facts', 'rule'].includes(it.key) || (notesRight && !['record', 'facts', 'rule'].includes(it.key))));
    if (st.end > D.h - m) L.fits = false;
    L.panels = [...st.out, ...fp.placed.filter(x => x.key !== 'tagflow')];
    L.tagFlow = fp.placed.find(x => x.key === 'tagflow') || null;
    // the inspect area: everything left of the panels, from the diorama top to the frame bottom (the notes
    // only join at the return)
    area = {x: m, y: L.full.y, w: px - gap * 2 - m, bottom: D.h - m};
    L.shiftMax = 0;
  } else {
    const dsF = (avail / STAGE.w) * k;
    const dw = STAGE.w * dsF, dh = STAGE.h * dsF;
    const cr = capRow(dw, true);
    L.full = {x: m + (avail - dw) / 2, y: m + 4 + cr.h, k: dsF};
    L.capAt = {x: L.full.x, y: m + 4, w: dw};
    L.capRow = cr;
    const colW = (avail - gap * 1.4) / 2;
    let y0 = L.full.y + dh + gap;
    let tagFlow = null;
    if (tagText && !cr.inRow) {
      const tf = flow(m, y0, avail, [tagItem(avail)]);
      tagFlow = tf.placed[0];
      y0 += tf.h + gap;
    }
    const left = stack(m, y0, colW, items.filter(it => ['record', 'rule'].includes(it.key)));
    const right = stack(m + colW + gap * 1.4, y0, colW, items.filter(it => it.key === 'facts'));
    const y1 = Math.max(left.end, right.end) + gap;
    const notes = stack(m, y1, avail, noteItems);
    if (notes.end > D.h - m) L.fits = false;
    L.panels = [...left.out, ...right.out, ...notes.out];
    L.tagFlow = tagFlow;
    // during the inspection the panels slide down into the (still empty) notes room, making way for the lens
    const panelsBottom = Math.max(left.end, right.end);
    L.shiftMax = Math.max(0, D.h - m - panelsBottom);
    L.panelsTop = y0;
    area = {x: m, y: L.full.y, w: avail, bottom: y0 + L.shiftMax - gap};
  }
  // --- inspect geometry: the context shrinks in place (top-left anchor) and the lens opens below it,
  // right-aligned in the inspect area; the before/after slips sit beside the lens or under it
  const kF = L.full.k;
  const zReq = Math.max(1.4, p.detailGeometry.zoom || 2.3);
  const gapL = s * 1.2;
  const bT = `${t.before}: ${p.beforeValue}`;
  const aT = `${t.after}: ${fill(t.whatIfT, {x: p.afterValue})}`;
  const slipSize = w => {
    const a = slip(ctx, 'x', aT, {x: 0, y: 0, size: s, maxWidth: w, fill: '#fff', color: '#000'});
    const b = slip(ctx, 'x', bT, {x: 0, y: 0, size: s, maxWidth: w, fill: '#fff', color: '#000'});
    return {h: a.box.h + s * 0.5 + b.box.h, dropA: a.box.h + s * 0.5, w: Math.max(a.box.w, b.box.w)};
  };
  const solve = z => {
    const opts = [];
    // A: slips in a column left of the lens
    const sw = Math.max(s * 10, Math.min(s * 15, area.w * 0.3));
    const kA = Math.min((area.bottom - area.y - gapL) / (STAGE.h + z * CROP.h), (area.w - sw - gap * 1.5) / (z * CROP.w));
    const ssA = slipSize(sw);
    // (tall boxes keep the lens at full width: their slips go under it)
    if (shape !== 'portrait' && ssA.h <= (z * CROP.h * kA)) opts.push({kS: kA, beside: true, sw, ss: ssA});
    // B: slips under the lens
    const ssB = slipSize(Math.min(area.w, s * 26));
    const kB = Math.min((area.bottom - area.y - gapL - s * 0.8 - ssB.h) / (STAGE.h + z * CROP.h), area.w / (z * CROP.w));
    opts.push({kS: kB, beside: false, sw: Math.min(area.w, s * 26), ss: ssB});
    // C: slips beside the shrunk context (right of it, above the lens)
    const swC = Math.max(s * 10, Math.min(s * 16, area.w * 0.36));
    const ssC = slipSize(swC);
    const kC = Math.min((area.bottom - area.y - gapL) / (STAGE.h + z * CROP.h), area.w / (z * CROP.w), (area.w - swC - gap * 1.5) / STAGE.w);
    if (ssC.h <= STAGE.h * kC) opts.push({kS: kC, beside: 'context', sw: swC, ss: ssC});
    return opts.sort((a, b) => b.kS - a.kS)[0];
  };
  let z = zReq;
  let sol = solve(z);
  // keep the context large: at least ~45 % of its full size (the zoom gives way first, down to 1.4×)
  while (sol.kS < kF * 0.45 && z > 1.45) { z -= 0.1; sol = solve(z); }
  // tall boxes: when the height binds, a little more zoom gives a larger lens (≥ ~72 % of the width)
  if (shape === 'portrait') {
    while (z * CROP.w * Math.min(sol.kS, kF * 0.8) < area.w * 0.72 && z < zReq * 1.35) {
      const nx = solve(z + 0.1);
      if (nx.kS < kF * 0.46) break;
      z += 0.1;
      sol = nx;
    }
  }
  const kS = Math.min(sol.kS, kF * 0.8);
  if (kS < kF * 0.4) L.fits = false;
  L.kS = kS;
  const lw = z * CROP.w * kS, lh = lw * CROP.h / CROP.w;
  const dest = {x: area.x + area.w - lw, y: area.y + STAGE.h * kS + gapL, w: lw, h: lh};
  L.dest = dest;
  L.zoomEff = lw / (CROP.w * kS);
  L.slipBeside = sol.beside;
  const ctxR = area.x + STAGE.w * kS;
  L.slipAt = sol.beside === 'context'
    ? {x: ctxR + gap * 1.5 + (area.x + area.w - ctxR - gap * 1.5) / 2, y: area.y + Math.max(0, (STAGE.h * kS - sol.ss.h) / 2), w: area.x + area.w - ctxR - gap * 1.5}
    : sol.beside
      ? {x: area.x + (dest.x - gap * 1.5 - area.x) / 2, y: dest.y + (lh - sol.ss.h) / 2, w: dest.x - gap * 1.5 - area.x}
      : {x: dest.x + lw / 2, y: dest.y + lh + s * 0.8, w: sol.sw};
  L.slipDropH = sol.ss.dropA;
  L.inspectBottom = sol.beside ? dest.y + lh : dest.y + lh + s * 0.8 + sol.ss.h;
  L.slipMode = sol.beside;
  if (L.inspectBottom > area.bottom + 1) L.fits = false;
  L.area = area;
  // the panels move down only as far as the lens needs (portrait)
  L.shift = shape === 'portrait' ? Math.max(0, Math.min(L.shiftMax, L.inspectBottom + gap - L.panelsTop)) : 0;
  return L;
}

function finish(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const col = hcColors(ctx);
  const D = ctx.design;
  const s = L.s;
  const c = p.circumstance;
  L.same = c.before === c.after;
  // base take finished: parcel on the before spot, figurine stepped back
  const plan = takePlan(c.before, standX(c.before) - STAGE.startX);
  L.fig0 = takeState(plan, plan.tEnd);
  L.look = actorLook(ctx, {appearance: {}}, 0);
  const mk = pre => ({
    art: dioramaArt(ctx, {prefix: `${pre}d`, seedKey: 'hc-stage'}),
    parcel: parcelArt(ctx, `${pre}Parcel`),
    flag: flagArt(ctx, `${pre}Flag`, col.flag),
    ghost: ghostArt(ctx, `${pre}Ghost`, col.a),
    fig: figurine(ctx, {name: `${pre}fig`, look: L.look}),
  });
  L.c = mk('c');
  L.l = mk('l');
  const layer = (P, pre) => g(null,
    P.art.back,
    P.ghost.node,
    g({name: `${pre}ParcelT`}, P.parcel),
    g({name: `${pre}FlagT`}, P.flag),
    P.fig.node,
    P.art.boxFront,
    P.art.apron,
  );
  L.cLayer = layer(L.c, 'c');
  // the lens: a real enlarged copy of the context drawn with the context's CURRENT transform, mapped from
  // the current source rectangle (the porch region of the shrinking context) to the lens window
  const rad = 22;
  L.lensNode = g({name: 'lens'},
    h('path', {name: 'lens-dim', d: '', 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
    h('rect', {name: 'lens-src', rx: 8, fill: 'none', stroke: col.b, 'stroke-width': 4, opacity: 0}),
    h('line', {name: 'lens-coneA', stroke: col.b, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('line', {name: 'lens-coneB', stroke: col.b, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {name: 'lens-cliprect', rx: rad}))),
    g({name: 'lens-win', opacity: 0},
      h('rect', {name: 'lens-shadow', rx: rad, fill: th.shadow}),
      h('rect', {name: 'lens-bg', rx: rad, fill: th.paper}),
      g({'clip-path': ctx.ref('lens-clip')}, g({name: 'lens-content'}, g({name: 'lCtxT'}, layer(L.l, 'l')))),
      h('rect', {name: 'lens-border', rx: rad, fill: 'none', stroke: col.b, 'stroke-width': 5}),
    ),
  );
  // slips beside / under the lens (before; after in its place once the old one has slid down, struck)
  const t = ctx.t;
  const bText = `${t.before}: ${p.beforeValue}`;
  const aText = `${t.after}: ${fill(t.whatIfT, {x: p.afterValue})}`;
  const sa = L.slipAt;
  L.slipB = slip(ctx, 'slipB', bText, {x: sa.x, y: sa.y, size: s, maxWidth: sa.w, fill: '#eef3f7', color: col.a, struck: true});
  L.slipA = slip(ctx, 'slipA', aText, {x: sa.x, y: sa.y, size: s, maxWidth: sa.w, fill: '#fbeee9', color: col.b});
  L.slipDrop = L.slipDropH;
  // Δ marker beside the new spot (full view), clear of the new parcel/flag and of the old spot
  const full = L.full;
  const W2 = q => ({x: full.x + q.x * full.k, y: full.y + q.y * full.k});
  L.W2 = W2;
  const rN = 20 / full.k + 3;
  const nb = spotBox(c.after, 2), ob = spotBox(c.before, 2);
  const pb = parcelAt(c.after), fb = flagBase(c.after);
  const cands = [
    {x: fb.x, y: fb.y - FLAG_H - rN - 6},
    {x: pb.x - PW / 2 - rN - 6, y: pb.y - PH / 2},
    {x: fb.x + rN + 22, y: fb.y - FLAG_H * 0.6},
    {x: pb.x - PW / 2 - rN - 6, y: fb.y - FLAG_H - rN},
    {x: fb.x + rN + 22, y: fb.y + rN + 8},
    {x: fb.x + rN + 22, y: fb.y - FLAG_H - rN},
    {x: pb.x, y: fb.y - FLAG_H - rN * 2 - 10},
  ];
  const clearOf = (q, b) => q.x + rN < b.x || q.x - rN > b.x + b.w || q.y + rN < b.y || q.y - rN > b.y + b.h;
  // … and clear of the figurine standing where the base take left it
  const figB = {x: L.fig0.figX - 34, y: STAGE.floorY - 210, w: 68, h: 210};
  L.figBox = figB;
  const okAt = q => clearOf(q, nb) && (L.same || clearOf(q, ob)) && q.y - rN > 30 && q.x + rN < STAGE.w - 30 && q.x - rN > 40;
  const mq = cands.find(q => okAt(q) && clearOf(q, figB)) || cands.find(okAt) || cands[0];
  L.markerAt = W2(mq);
  L.markerNative = mq;
  // the short Δ tag (marker label only) sits OUTSIDE the scene: in the caption row, or first under the context
  L.tag = null;
  if (ctx.show('key')) {
    const tw = Math.min(L.capAt.w * 0.46, s * 15);
    const text = `Δ ${p.contextLabels.marker}`;
    let tc;
    if (L.capRow.inRow || L.capRow.stacked) {
      const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: tw, size: s, minSize: s, maxLines: 3, weight: 700});
      const ty = L.capRow.stacked ? L.capAt.y + L.capRow.capH + L.gap * 0.5 : L.capAt.y;
      tc = chip(ctx, text, {x: L.capAt.x + L.capAt.w - probe.box.w, y: ty, maxWidth: tw, size: s, minSize: s, maxLines: 3, fill: th.card, stroke: th.accent2, weight: 700});
    } else {
      const b0 = L.tagFlow.c.box;
      tc = chip(ctx, text, {x: b0.x, y: b0.y, maxWidth: tw, size: s, minSize: s, maxLines: 3, fill: th.card, stroke: th.accent2, weight: 700});
    }
    const b = tc.box;
    const above = b.y + b.h <= L.markerAt.y;
    const ax = clamp(L.markerAt.x, b.x + 12, b.x + b.w - 12);
    const leadFrom = {x: ax, y: above ? b.y + b.h : b.y};
    const leadTo = {x: L.markerAt.x, y: L.markerAt.y + (above ? -20 : 20)};
    L.tagLead = {x1: leadFrom.x, y1: leadFrom.y, x2: leadTo.x, y2: leadTo.y};
    L.tag = {box: b, node: g({name: 'tagG', opacity: 0},
      h('line', {x1: r(leadFrom.x), y1: r(leadFrom.y), x2: r(leadTo.x), y2: r(leadTo.y), stroke: th.accent2, 'stroke-width': 2.4, 'stroke-dasharray': '5 5'}),
      tc.node)};
  }
  // the ONE neutral "changed datum" marker: a white Δ on the blue accent2 disc (never a red/alarm disc)
  L.marker = g({name: 'marker', opacity: 0, transform: T(L.markerAt.x, L.markerAt.y)}, changedMarker(ctx, {name: 'marker-disc', radius: 16}));
  // context caption (stays above the context throughout)
  L.ctxCap = ctx.show('all') ? chip(ctx, p.contextLabels.context, {x: L.capAt.x, y: L.capAt.y, maxWidth: L.capAt.w, size: s, minSize: s, maxLines: 3, fill: th.card, stroke: th.ink, name: 'ctxCap', weight: 600}) : null;
  // relation (conector): record card ↔ rule condition, as supplied
  const rec = L.panels.find(x => x.key === 'record');
  const rule = L.panels.find(x => x.key === 'rule');
  L.rec = rec;
  L.rulePanel = rule;
  const an = rule.c.anchors[L.cond];
  const rside = rec.c.box.x + rec.c.box.w;
  const vertical = Math.abs(rec.c.box.x - rule.c.box.x) < 4;
  if (vertical) {
    const from = {x: rside, y: rec.c.box.y + rec.c.rowY - rec.c.box.y + rec.c.rowH / 2};
    const to = an.right;
    const gx = Math.max(from.x, to.x) + Math.min(26, (D.w - L.m - Math.max(from.x, to.x)) * 0.7);
    L.rel = {from, to, d: `M${r(from.x)} ${r(from.y)}C${r(gx)} ${r(from.y)} ${r(gx)} ${r(to.y)} ${r(to.x)} ${r(to.y)}`, len: Math.abs(to.y - from.y) + 80};
  } else L.rel = null;
  return L;
}

/* ------------------------------------------------------------------------ */

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1080], portrait: [900, 1400]},
  layout(ctx) {
    const D = ctx.design;
    const sc = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
    const base = 22 / sc;
    let L = null;
    const tries = [];
    // the scene keeps ≥ ~88 % of its size first (text ≥ 20 px, then down to 16 px); only then does it shrink further
    const KK = [1, 0.95, 0.9, 0.86, 0.82, 0.78, 0.745];
    for (const kk of KK) for (const k of [1, 0.94, 0.88]) tries.push([kk, k]);
    for (const k of [0.82, 0.76, 0.7, 0.64]) for (const kk of KK) tries.push([kk, k]);
    for (const [kk, k] of tries) {
      L = compose(ctx, base * kk, k, sc);
      if (L.fits) break;
    }
    L.sc = sc;
    return finish(ctx, L);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const col = hcColors(ctx);
    return g(null,
      g({name: 'panels'}, L.panels.map(x => x.c.node),
        L.rel ? h('path', {name: 'rel', d: L.rel.d, fill: 'none', stroke: col.rule, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(L.rel.len)} ${r(L.rel.len + 40)}`, 'stroke-dashoffset': r(L.rel.len)}) : null,
        L.rel ? h('circle', {name: 'relDotA', cx: r(L.rel.from.x), cy: r(L.rel.from.y), r: 6, fill: col.rule, stroke: th.ink, 'stroke-width': 1.6, opacity: 0}) : null,
        L.rel ? h('circle', {name: 'relDotB', cx: r(L.rel.to.x), cy: r(L.rel.to.y), r: 6, fill: col.rule, stroke: th.ink, 'stroke-width': 1.6, opacity: 0}) : null),
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctxT', transform: T(L.full.x, L.full.y, 0, L.full.k)}, L.cLayer),
      L.marker,
      L.tag && L.tag.node,
      L.lensNode,
      L.slipB.node,
      L.slipA.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const c = p.circumstance;
    const D = ctx.design;
    const reduced = ctx.reduced;
    const nodes = {};
    const E = reduced ? ease.outCubic : ease.inOutCubic;
    // --- context: full → smaller (in place, top-left anchor) → full; it never becomes a thumbnail
    const shrink = E(seg(u, ...W.shrink));
    const grow = E(seg(u, ...W.grow));
    const kz = shrink * (1 - grow);
    const cx = L.full.x, cy = L.full.y, ck = lerp(L.full.k, L.kS, kz);
    const ctxTf = T(cx, cy, 0, ck);
    nodes.ctxT = {transform: ctxTf};
    nodes.lCtxT = {transform: ctxTf};
    // panels stay readable; in tall boxes they slide down to make way for the lens and come back
    nodes.panels = {transform: T(0, r(L.shift * kz, 2))};
    // --- the datum: before → after (text first, geometry after)
    const strikeK = seg(u, ...W.strike);
    const slideK = E(seg(u, ...W.slide));
    const afterK = seg(u, ...W.afterIn);
    const moveK = (reduced ? ease.outCubic : ease.inOutSine)(seg(u, ...W.move));
    const datum = afterK > 0 ? 'after' : 'before';
    const pa = parcelAt(c.before), pb = parcelAt(c.after);
    const fa = flagBase(c.before), fbb = flagBase(c.after);
    const hop = Math.sin(Math.PI * moveK) * 70;
    const parcel = {x: lerp(pa.x, pb.x, moveK), y: lerp(pa.y, pb.y, moveK) - hop};
    const flag = {x: lerp(fa.x, fbb.x, moveK), y: lerp(fa.y, fbb.y, moveK) - hop};
    const fp0 = L.fig0;
    for (const pre of ['c', 'l']) {
      nodes[`${pre}ParcelT`] = {transform: T(parcel.x, parcel.y)};
      nodes[`${pre}FlagT`] = {transform: T(flag.x, flag.y)};
      nodes[`${pre}Ghost`] = {transform: T(pa.x, pa.y), opacity: r(L.same ? 0 : seg(moveK, 0.15, 0.5), 3)};
      Object.assign(nodes, L[pre].fig.pose({x: fp0.figX, lift: 0, near: fp0.near, far: fp0.far}).nodes);
      nodes[`${pre}d-play`] = {opacity: 0};
      nodes[`${pre}d-rew`] = {opacity: 0};
      nodes[`${pre}d-lampA`] = {opacity: 1};
      nodes[`${pre}d-lampB`] = {opacity: 0};
    }
    // --- lens: opens from the porch region of the shrinking context; closes back onto it as it grows
    const open = E(seg(u, ...W.open)) * (1 - E(seg(u, ...W.close)));
    const S = {x: cx + CROP.x * ck, y: cy + CROP.y * ck, w: CROP.w * ck, h: CROP.h * ck};
    const R = {x: lerp(S.x, L.dest.x, open), y: lerp(S.y, L.dest.y, open), w: lerp(S.w, L.dest.w, open), h: lerp(S.h, L.dest.h, open)};
    const kx = R.w / S.w, ky = R.h / S.h;
    const vis = open > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    // the dim covers only the context (the panels stay untouched), with a hole at the source
    const Cw = STAGE.w * ck, Ch = STAGE.h * ck;
    nodes['lens-dim'] = {d: `M${r(cx)} ${r(cy)}h${r(Cw)}v${r(Ch)}h${r(-Cw)}ZM${r(S.x)} ${r(S.y)}v${r(S.h)}h${r(S.w)}v${r(-S.h)}Z`, opacity: r(0.38 * open, 3)};
    nodes['lens-src'] = {x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), opacity: vis ? 1 : 0};
    const cone = [[S.x, S.y + S.h, R.x, R.y], [S.x + S.w, S.y + S.h, R.x + R.w, R.y]];
    nodes['lens-coneA'] = {x1: r(cone[0][0]), y1: r(cone[0][1]), x2: r(cone[0][2]), y2: r(cone[0][3]), opacity: open > 0.05 ? 1 : 0};
    nodes['lens-coneB'] = {x1: r(cone[1][0]), y1: r(cone[1][1]), x2: r(cone[1][2]), y2: r(cone[1][3]), opacity: open > 0.05 ? 1 : 0};
    nodes['lens-cliprect'] = rect;
    nodes['lens-win'] = {opacity: vis ? r(Math.min(1, open * 4), 3) : 0};
    nodes['lens-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-content'] = {transform: `${T(R.x - S.x * kx, R.y - S.y * ky)} scale(${r(kx, 4)} ${r(ky, 4)})`};
    // slips (only while the lens is open)
    const closeK = seg(u, W.close[0], W.close[0] + 0.03);
    const slipOn = seg(u, ...W.slipIn) * (1 - closeK);
    nodes.slipB = {opacity: r(slipOn, 3), transform: T(0, L.slipDrop * slideK)};
    nodes['slipB-strike'] = {opacity: r(strikeK > 0 ? 1 : 0, 3)};
    nodes.slipA = {opacity: r(afterK * (1 - closeK), 3)};
    // record card: the same substitution
    nodes['rec-bef'] = {transform: T(0, L.rec.c.rowDrop * slideK)};
    nodes['rec-strike'] = {opacity: strikeK > 0 ? 1 : 0};
    nodes['rec-aft'] = {opacity: r(afterK, 3)};
    // --- return: marker + tag, notes
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(L.same ? 0 : mk, 3)};
    if (L.tag) nodes.tagG = {opacity: r(L.same ? 0 : mk, 3)};
    const relK = ease.inOutCubic(seg(u, ...W.rel));
    if (L.rel) {
      nodes.rel = {'stroke-dashoffset': r(L.rel.len * (1 - relK))};
      nodes.relDotA = {opacity: relK > 0 ? 1 : 0};
      nodes.relDotB = {opacity: relK >= 0.98 ? 1 : 0};
    }
    nodes[`rule-hl${L.cond}`] = {opacity: r(relK, 3)};
    const nk = seg(u, ...W.notes);
    const noteKeys = L.panels.filter(x => /^(issue|assume|key)/.test(x.key));
    noteKeys.forEach((x, i) => { nodes[x.key] = {opacity: r(clamp(nk * 1.5 - i * 0.15), 3)}; });
    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const B2 = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    const ctxW = q => ({x: cx + q.x * ck, y: cy + q.y * ck});
    const inLens = q => { const a = ctxW(q); return {x: R.x + (a.x - S.x) * kx, y: R.y + (a.y - S.y) * ky}; };
    const spotOf = pt => Object.keys(SPOTS).find(k2 => Math.hypot(parcelAt(k2).x - pt.x, parcelAt(k2).y - pt.y) < 0.5) || null;
    const fullB = b => ({x: L.full.x + b.x * L.full.k, y: L.full.y + b.y * L.full.k, w: b.w * L.full.k, h: b.h * L.full.k});
    const ctxRect = {x: cx, y: cy, w: Cw, h: Ch};
    // how much of the frame carries visible content (context + open lens + panels): never near-empty
    const panelBoxes = L.panels.filter(x => ['record', 'facts', 'rule'].includes(x.key)).map(x => x.c.box);
    const visArea = Cw * Ch + (open > 0.5 ? R.w * R.h : 0) + panelBoxes.reduce((a, b) => a + b.w * b.h, 0);
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      contextFull: kz <= 0.001,
      contextInspect: kz >= 0.999,
      contextScale: r(ck / L.full.k, 3),
      lensVisible: vis,
      lensOpen: r(open, 3),
      lensAtSource: vis && open < 0.02,
      lensRect: B2(R),
      sourceRect: B2(S),
      lensScale: r(kx, 3),
      zoomEff: r(L.zoomEff, 3),
      datum,
      datumValue: datum === 'after' ? p.afterValue : p.beforeValue,
      oldValueShownIn: datum === 'after' ? (slipOn > 0 ? 'slip' : 'card') : null,
      oldStruck: strikeK > 0,
      spotNow: spotOf(parcel),
      geometryMoved: r(moveK, 3),
      movedBeforeText: moveK > 0 && afterK < 1,
      parcel: P2(ctxW(parcel)),
      parcelInLens: P2(inLens(parcel)),
      flag: P2(ctxW({x: flag.x, y: flag.y - FLAG_H})),
      ghostVisible: nodes.cGhost.opacity > 0,
      markerVisible: nodes.marker.opacity > 0,
      tagVisible: !!L.tag && nodes.tagG.opacity > 0,
      tagBox: L.tag ? B2(L.tag.box) : null,
      markerBox: B2({x: L.markerAt.x - 20, y: L.markerAt.y - 20, w: 40, h: 40}),
      // key scene elements in the full view: the new spot (parcel + flag) and the old spot (ghost)
      keyBoxes: [B2(fullB(spotBox(c.after, 2))), ...(L.same ? [] : [B2(fullB(spotBox(c.before, 2)))])],
      figBox: B2(fullB(L.figBox)),
      // colour rule (AUTHORING "Legal content"): the marker uses accent2, never the alarm accent or lane B red
      markerColors: {expected: ctx.theme.accent2, alarm: ctx.theme.accent, laneB: hcColors(ctx).b},
      tagLead: L.tagLead ? {x1: r(L.tagLead.x1), y1: r(L.tagLead.y1), x2: r(L.tagLead.x2), y2: r(L.tagLead.y2)} : null,
      // the diorama floor and plinth (full view) that the tag leader must not cross
      floorBand: B2(fullB({x: 0, y: STAGE.backBottom, w: STAGE.w, h: STAGE.h - STAGE.backBottom})),
      diorama: B2(fullB({x: 0, y: 0, w: STAGE.w, h: STAGE.h})),
      contextRect: B2(ctxRect),
      panelBoxes: panelBoxes.map(b => B2({...b, y: b.y + L.shift * kz})),
      visibleShare: r(visArea / (D.w * D.h), 3),
      panelsVisible: true,
      dimOverPanels: false,
      notes: noteKeys.map(x => x.c.fit.lines.join(' ')),
      notesVisible: nk > 0,
      relation: {kind: 'relation', condition: L.cond, drawn: r(relK, 3)},
      outcome: 'not-supplied',
      winner: null,
      complete: W.notes[1],
      textPx: r(L.s * L.sc, 2),
      full: {x: r(L.full.x), y: r(L.full.y), k: r(L.full.k, 3)},
      dest: B2(L.dest),
      design: {w: r(D.w), h: r(D.h)},
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-09-inspect',
    title: 'Counterfactual fact — a lens on the porch: one datum is swapped and only the flagged spot moves',
    titleEs: 'Hecho contrafactual — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho contrafactual',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The diorama after the base take shrinks into a context thumbnail and a lens opens from its porch region — a real enlarged copy in the thumbnail’s own coordinates. Under the lens the “Before” slip is struck and slides down (kept), the supplied “After … (hypothetical)” slip takes its place, and only then the flag and the parcel move to the new spot while a dashed ghost keeps the old one. The lens closes back onto its source, the diorama returns to full size with a Δ marker and a tag holding the struck old value; the record card shows the new value with the old one struck. Outcome of the hypothetical not supplied, no conclusion drawn; seeking back restores the old datum.',
    tags: ['reasoning', 'counterfactual', 'hypothetical', 'inspect', 'lens', 'magnify', 'substitution', 'datum', 'diorama', 'flag'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-contrafactual.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HC_STRINGS,
  scene,
});
