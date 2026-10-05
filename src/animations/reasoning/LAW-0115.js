/**
 * LAW-0115 — Hecho contrafactual · contrast
 *
 * Storyboard (two complete tabletop dioramas of the same scene, no hands):
 *  0.00–0.17 base      Two identical dioramas: the figurine holds the parcel at
 *                      the garden end, the pennant flag stands on the same spot
 *                      (A's spot) in both, reels still, take lamps off. The
 *                      headers show only two neutral grey badges "A" and "B".
 *                      The shared facts card and the rule plate (drawn ONCE,
 *                      shared by both scenes) sit below.
 *  0.17–0.40 change    Only in B: the flag lifts off and hops to the other
 *                      spot (the ONE changed circumstance, a localized visual
 *                      change). As it lands, the badges take their colours and
 *                      the headers show "Base scenario" / "What if …
 *                      (hypothetical)" with their captions.
 *  0.40–0.77 parallel  Both takes run with the same speed and timing: the
 *                      figurines walk in lockstep; B's figurine stops at the
 *                      nearer spot and leaves its parcel there while A's walks
 *                      on to its spot (geometry and sequence differ only where
 *                      the circumstance differs).
 *  0.77–1.00 guide     A dashed comparison guide rises from the two parcels
 *                      and joins them over the rooftops with the guide label;
 *                      the changed fact is related (plain relation, no arrow)
 *                      to the rule condition it concerns, as supplied. Neutral
 *                      note, issue, assumption and the key "outcome of the
 *                      hypothetical run: not supplied · no conclusion drawn".
 *                      No winner, score or consequence.
 * Wide and square boxes: the scenes side by side, shared band below.
 * Tall boxes: the scenes stacked, the guide running down the right margin.
 * Legal content: fictional, jurisdiction unspecified, illustrative text.
 * @module animations/reasoning/LAW-0115
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {contrastFields, obj, oneOf, int} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {roundRectPath} from '../../core/geometry.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  HC_STRINGS, hcFields, DEFAULT_CONTENT, STAGE, SPOTS, SPOT_IDS, PW, PH, FLAG_H, fill, hcColors,
  takePlan, takeState, standX, parcelAt, flagBase,
  dioramaArt, parcelArt, flagArt, figurine, reelAngle, ruleNotice, noteChip, bars, wordSafe,
} from './kits/hecho-contrafactual.js';

const ID = 'LAW-0115';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {shared: [0.02, 0.1], hop: [0.19, 0.33], headers: [0.3, 0.38], run: [0.41, 0.765], guide: [0.77, 0.84], rel: [0.8, 0.86], notes: [0.82, 0.88], key: [0.84, 0.9]};

const {facts, rules, issues, assumptions} = hcFields;
const sceneSchema = {
  facts, rules, issues, assumptions,
  ...contrastFields(),
  spots: obj('Where the parcel is left in each scene (the single changed circumstance)', {
    a: oneOf('Spot in scenario A (base)', SPOT_IDS),
    b: oneOf('Spot in scenario B (hypothetical)', SPOT_IDS),
  }, ['a', 'b']),
  condition: int('Zero-based rule condition the author relates the changed fact to (drawn as a plain relation)', 0, 2),
};

const defaultParams = {
  facts: DEFAULT_CONTENT.facts,
  rules: DEFAULT_CONTENT.rules,
  issues: DEFAULT_CONTENT.issues,
  assumptions: DEFAULT_CONTENT.assumptions,
  scenarioA: {label: 'Base scenario', caption: 'Parcel left on the porch bench'},
  scenarioB: {label: 'What if (hypothetical)', caption: 'Parcel left on the window sill'},
  changedFact: 'Where the parcel is left: porch bench / window sill',
  sharedFacts: ['Same courier, route and timing', 'Same house and same rule text'],
  comparisonLabels: {guide: 'Only the spot changes', neutral: 'Two supplied variants side by side — no winner, no outcome'},
  spots: {a: 'bench', b: 'sill'},
  condition: 1,
};

/* ------------------------------------------------------------------------ */

const hypLabel = (ctx, label) => (label.toLowerCase().includes(ctx.t.hypothetical.toLowerCase()) ? label : `${label} (${ctx.t.hypothetical})`);

function headerParts(ctx, which, w, s) {
  const p = ctx.params;
  const sc = which === 'A' ? p.scenarioA : p.scenarioB;
  const label = which === 'A' ? sc.label : hypLabel(ctx, sc.label);
  const badgeR = s * 0.95;
  const tw = w - badgeR * 2 - s * 0.6;
  const lf = ctx.fit(label, {maxWidth: tw, size: s * 1.05, minSize: s, maxLines: 4, weight: 700});
  let cf = sc.caption ? ctx.fit(sc.caption, {maxWidth: tw, size: s, minSize: s, maxLines: 6, weight: 500}) : null;
  // label and caption share one line when they fit (saves height for the scenes)
  const inline = !!cf && lf.lines.length === 1 && cf.lines.length === 1 && lf.width + s * 0.8 + cf.width <= tw;
  const hh = Math.max(badgeR * 2, inline ? lf.height : lf.height + (cf ? s * 0.3 + cf.height : 0)) + s * 0.3;
  return {badgeR, tw, lf, cf, h: hh, inline};
}

function header(ctx, which, x, y, w, s) {
  const th = ctx.theme;
  const col = hcColors(ctx);
  const P = headerParts(ctx, which, w, s);
  const bx = x + P.badgeR, by = y + P.badgeR;
  const tx = x + P.badgeR * 2 + s * 0.6;
  const K = ctx.show('key');
  const node = g({name: `hdr${which}`},
    h('circle', {cx: r(bx), cy: r(by), r: r(P.badgeR), fill: '#8a8f94', stroke: th.ink, 'stroke-width': 2.4}),
    h('circle', {name: `hdr${which}-col`, cx: r(bx), cy: r(by), r: r(P.badgeR), fill: which === 'A' ? col.a : col.b, stroke: th.ink, 'stroke-width': 2.4, opacity: 0}),
    K ? h('text', {x: r(bx), y: r(by + P.badgeR * 0.4), 'text-anchor': 'middle', 'font-size': r(P.badgeR * 1.15), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, which) : null,
    g({name: `hdr${which}-txt`, opacity: 0},
      K ? textBlock(P.lf, {x: tx, y: y + s * 0.1, fill: th.fg}) : bars(P.lf, tx, y + s * 0.1, which === 'A' ? col.a : col.b, 0.7),
      P.cf ? (ctx.show('all') ? textBlock(P.cf, P.inline ? {x: tx + P.lf.width + s * 0.8, y: y + s * 0.1 + (P.lf.size - P.cf.size) * 0.8, fill: th.fgSoft} : {x: tx, y: y + s * 0.1 + P.lf.height + s * 0.3, fill: th.fgSoft}) : null) : null),
  );
  return {node, box: {x, y, w, h: P.h}, textBox: {x: tx, y, w: P.inline ? P.lf.width + s * 0.8 + P.cf.width : Math.max(P.lf.width, P.cf ? P.cf.width : 0), h: P.h}};
}

/** Height of the strip above the side-by-side scenes where the guide and its label run. */
function guideStrip(ctx, s, w) {
  if (!ctx.show('all')) return s * 2;
  const c = chip(ctx, ctx.params.comparisonLabels.guide, {x: 0, y: 0, maxWidth: w, size: s, minSize: s, maxLines: 4});
  return Math.max(s * 2.2, c.box.h + s * 0.8);
}

/**
 * The shared text, drawn ONCE as a compact card: "Same in A and B · as supplied", the facts title and one
 * paragraph with the supplied events and shared facts (each one kept whole inside the paragraph).
 */
function sameCard(ctx, o) {
  const p = ctx.params;
  const th = ctx.theme;
  const s = o.s;
  const pad = s * 0.6;
  const inner = o.w - pad * 2;
  const K = ctx.show('key');
  let y = o.y + pad * 0.8;
  const kf = ctx.fit(ctx.t.sameInAB.toUpperCase(), {maxWidth: inner, size: o.cap, minSize: o.cap, maxLines: 2, weight: 800});
  const kindY = y;
  y += kf.height + s * 0.3;
  const tf = ctx.fit(p.facts.title, {maxWidth: inner, size: s, minSize: s, maxLines: 4, weight: 700});
  const titleY = y;
  y += tf.height + s * 0.3;
  const para = [...p.facts.events.map((ev, i) => `${i + 1} ${ev}`), ...p.sharedFacts].join(' · ');
  const sz = wordSafe(ctx, para, inner, s);
  const pf = ctx.fit(para, {maxWidth: inner, size: sz, minSize: sz, maxLines: 14, weight: 500});
  const paraY = y;
  y += pf.height + pad * 0.7;
  const hh = y - o.y;
  const node = g({name: 'same'},
    h('path', {d: roundRectPath(o.x + 5, o.y + 6, o.w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, hh, 10), fill: '#fffdf8', stroke: th.ink, 'stroke-width': 2.4}),
    ctx.show('all') ? textBlock(kf, {x: o.x + pad, y: kindY, fill: '#3d5566'}) : null,
    K ? textBlock(tf, {x: o.x + pad, y: titleY, fill: th.ink}) : bars(tf, o.x + pad, titleY, th.ink, 0.75),
    K ? textBlock(pf, {x: o.x + pad, y: paraY, fill: th.ink, name: 'same-para'}) : bars(pf, o.x + pad, paraY, th.paperLine, 1),
  );
  return {node, box: {x: o.x, y: o.y, w: o.w, h: hh}, fits: !pf.truncated && !tf.truncated};
}

/** Notes of the shared strip; the changed fact comes first (it is related to the rule condition). */
function noteItems(ctx) {
  const p = ctx.params;
  const t = ctx.t;
  const col = hcColors(ctx);
  const notes = [];
  if (ctx.show('key')) notes.push({name: 'changed', text: `${t.changedFact}: ${p.changedFact}`, color: col.b, weight: 700});
  if (ctx.show('all')) {
    p.issues.forEach((q, i) => notes.push({name: `issue${i}`, text: `${t.issue}: ${q}`, color: ctx.theme.accent3}));
    p.assumptions.forEach((q, i) => notes.push({name: `assume${i}`, text: `${t.assumed}: ${q}`, color: '#7d8b93'}));
    notes.push({name: 'neutral', text: p.comparisonLabels.neutral, color: ctx.theme.ink});
  }
  if (ctx.show('key')) notes.push({name: 'key', text: t.keyOutcome, color: ctx.theme.ink});
  return notes;
}

/**
 * Pack the shared strip: the ordered items [same, rule, changed fact, issues, assumptions, neutral, key] flow
 * through a few columns (optionally below a full-width "same" row). Every contiguous split is tried and the
 * lowest strip wins. The rule is never in the last column and the changed fact always starts the column
 * right after the rule's, so the plain relation runs straight from it to the condition row.
 */
function packStrip(ctx, o, widthSets) {
  const p = ctx.params;
  const s = o.s;
  const gap = s * 0.9;
  const vgap = s * 0.5;
  const notes = noteItems(ctx);
  const cond = Math.min(p.condition, p.rules.conditions.length - 1);
  const orders = [
    [{kind: 'same'}, {kind: 'rule'}, ...notes.map(n => ({kind: 'note', n}))],
    [{kind: 'rule'}, {kind: 'same'}, ...notes.map(n => ({kind: 'note', n}))],
  ];
  const make = (it, x, y, w) => {
    if (it.kind === 'same') return sameCard(ctx, {x, y, w, s, cap: o.cap});
    if (it.kind === 'rule') return {...ruleNotice(ctx, {name: 'rule', x, y, w, size: s, cap: o.cap, title: p.rules.title, conditions: p.rules.conditions, kind: ctx.t.ruleKind, highlight: Math.min(p.condition, p.rules.conditions.length - 1)}), fits: true};
    const c = noteChip(ctx, it.n.text, {name: it.n.name, x, y, size: s, minSize: s, maxLines: 7, maxWidth: w, color: it.n.color, weight: it.n.weight});
    return {...c, fits: !c.fit.truncated};
  };
  const cache = new Map();
  let best = null;
  for (const items of orders) {
  const hOf = (i, w) => {
    const key = `${items[i].kind}${items[i].n ? items[i].n.name : ''}:${Math.round(w)}`;
    if (!cache.has(key)) {
      const c = make(items[i], 0, 0, w);
      cache.set(key, {h: c.box.h, ok: c.fits !== false, ay: c.anchors ? c.anchors[cond].right.y : 0});
    }
    return cache.get(key);
  };
  const changedIdx = items.findIndex(it => it.kind === 'note' && it.n.name === 'changed');
  for (const set of widthSets) {
    const top = set.top ? 1 : 0; // a full-width "same" row first
    if (top && items[0].kind !== 'same') continue;
    const cols = set.cols;
    const n = cols.length;
    const wTot = o.w - gap * (n - 1);
    const ws = cols.map(f => wTot * f);
    const topH = top ? hOf(0, o.w) : null;
    if (top && !topH.ok) continue;
    const first = top ? 1 : 0;
    const count = items.length - first;
    // choose n-1 break points in (first, items.length)
    const breaks = [];
    const rec = (start, k, acc) => {
      if (k === 0) { breaks.push(acc); return; }
      for (let b = start + 1; b <= items.length - k; b++) rec(b, k - 1, [...acc, b]);
    };
    if (count < n) continue;
    rec(first, n - 1, []);
    for (const br of breaks) {
      const bounds = [first, ...br, items.length];
      let ok = true, hMax = 0, ruleCol = -1, changedCol = -1, changedFirst = false, ruleAy = 0, chY = 0;
      for (let c = 0; c < n && ok; c++) {
        let hh = 0;
        for (let i = bounds[c]; i < bounds[c + 1]; i++) {
          const m = hOf(i, ws[c]);
          if (!m.ok) { ok = false; break; }
          if (items[i].kind === 'rule') { ruleCol = c; ruleAy = hh + m.ay; }
          if (i === changedIdx) { changedCol = c; changedFirst = i === bounds[c]; chY = hh + m.h / 2; }
          hh += m.h + vgap;
        }
        hMax = Math.max(hMax, hh - vgap);
      }
      if (!ok) continue;
      if (changedIdx >= 0 && (changedCol !== ruleCol + 1 || !changedFirst)) continue;
      const total = (top ? topH.h + vgap * 1.4 : 0) + hMax;
      // among the strips that fit the room: a short, level relation, few (wide) columns, then the lowest
      const fitsRoom = total <= (o.maxH ?? Infinity);
      const score = (fitsRoom ? 0 : 1e6 + total * 10) + Math.abs(chY - ruleAy) * 0.7 + n * s * 2.5 + total * 0.1;
      if (!best || score < best.score) best = {score, h: total, top, bounds, ws, n, items};
    }
  }
  }
  if (!best) return null;
  const items = best.items;
  // place the winner
  const out = {same: null, rule: null, notes: [], h: best.h, fits: true};
  let y0 = o.y;
  if (best.top) {
    out.same = make(items[0], o.x, y0, o.w);
    y0 += out.same.box.h + vgap * 1.4;
  }
  let x = o.x;
  for (let c = 0; c < best.n; c++) {
    let y = y0;
    for (let i = best.bounds[c]; i < best.bounds[c + 1]; i++) {
      const it = make(items[i], x, y, best.ws[c]);
      if (items[i].kind === 'same') out.same = it;
      else if (items[i].kind === 'rule') out.rule = it;
      else out.notes.push({name: items[i].n.name, c: it});
      y += it.box.h + vgap;
    }
    x += best.ws[c] + gap;
  }
  return out;
}

const STRIPS = {
  landscape: [
    {cols: [0.3, 0.3, 0.4]}, {cols: [0.26, 0.26, 0.24, 0.24]}, {cols: [0.3, 0.24, 0.23, 0.23]}, {cols: [0.34, 0.33, 0.33]},
    {top: true, cols: [0.34, 0.33, 0.33]}, {cols: [0.5, 0.5]}, {cols: [1]},
  ],
  square: [
    {cols: [0.34, 0.33, 0.33]}, {cols: [0.4, 0.3, 0.3]}, {cols: [0.52, 0.48]}, {cols: [0.26, 0.26, 0.24, 0.24]}, {cols: [0.32, 0.24, 0.22, 0.22]},
    {top: true, cols: [0.5, 0.5]}, {top: true, cols: [0.34, 0.33, 0.33]}, {cols: [1]},
  ],
  portrait: [
    {top: true, cols: [0.5, 0.5]}, {cols: [0.5, 0.5]}, {cols: [0.55, 0.45]}, {top: true, cols: [0.55, 0.45]}, {cols: [0.36, 0.32, 0.32]}, {cols: [1]},
  ],
};

/** Stage rows of empty sky hidden above each diorama (the guide runs in its own strip). */
const CROP_TOP = 110;
const VIEW_H = STAGE.h - CROP_TOP;

function compose(ctx, s, k, sc) {
  const D = ctx.design;
  const shape = ctx.view.shape;
  const m = 24;
  const avail = D.w - 2 * m;
  const cap = Math.min(s, Math.max(s * 0.64, 15 / sc));
  const gap = s * 0.7;
  const L = {s, cap, m, fits: true, shape, k};
  const topY = m + 4;
  // the smallest strip for this text size wins
  const strip = (y, w) => {
    return packStrip(ctx, {x: m, y, w, s, cap, maxH: D.h - m - y}, STRIPS[shape]);
  };
  if (shape !== 'portrait') {
    // scenes A | B side by side, each ≥ 40 % of the safe width; the shared strip below
    const gD = s * 1.4;
    const colW = (avail - gD) / 2;
    const hdrH = Math.max(headerParts(ctx, 'A', colW, s).h, headerParts(ctx, 'B', colW, s).h);
    const ds = (colW / STAGE.w) * k;
    L.guideW = Math.max(s * 10, avail * 0.6);
    const guideRoom = guideStrip(ctx, s, L.guideW);
    const dw = STAGE.w * ds, dh = VIEW_H * ds;
    const dy = topY + hdrH + s * 0.4 + guideRoom;
    const cA = m, cB = m + colW + gD;
    L.dio = {A: {x: cA + (colW - dw), y: dy, k: ds}, B: {x: cB, y: dy, k: ds}, w: dw, h: dh};
    L.hdr = {A: header(ctx, 'A', cA + (colW - dw), topY, dw, s), B: header(ctx, 'B', cB, topY, dw, s)};
    const hdrH2 = Math.max(L.hdr.A.box.h, L.hdr.B.box.h);
    L.dio.A.y = L.dio.B.y = topY + hdrH2 + s * 0.4 + guideRoom;
    L.colW = dw;
    if (dw / D.w < 0.4) L.fits = false;
    L.guideY = topY + hdrH2 + s * 0.4 + guideRoom * 0.45;
    L.layout = 'row';
  } else {
    // scenes stacked at (nearly) full width; a narrow gutter on the right carries the guide
    const gut = s * 1.5;
    const dw = (avail - gut) * k;
    const ds = dw / STAGE.w;
    const dh = VIEW_H * ds;
    const hA = header(ctx, 'A', m, topY, dw, s);
    const yA = topY + hA.box.h + s * 0.3;
    const probe = ctx.show('all') ? chip(ctx, ctx.params.comparisonLabels.guide, {x: 0, y: 0, maxWidth: Math.max(s * 8, avail * 0.42), size: s, minSize: s, maxLines: 3}) : null;
    const hbW = probe ? avail - probe.box.w - s * 1.2 : dw;
    const yHB = yA + dh + s * 0.6;
    const hB = header(ctx, 'B', m, yHB, Math.min(dw, hbW), s);
    const rowB = Math.max(hB.box.h, probe ? probe.box.h : 0);
    const yB = yHB + rowB + s * 0.3;
    L.dio = {A: {x: m, y: yA, k: ds}, B: {x: m, y: yB, k: ds}, w: dw, h: dh};
    L.hdr = {A: hA, B: hB};
    L.guideX = m + dw + gut * 0.5;
    L.guideChipAt = probe ? {x: D.w - m - probe.box.w / 2, y: yHB + (rowB - probe.box.h) / 2, w: Math.max(s * 8, avail * 0.42)} : null;
    L.layout = 'column';
    if (dw / D.w < 0.8) L.fits = false;
  }
  const sy = L.dio.B.y + L.dio.h + s * 0.9;
  const st = strip(sy, avail);
  if (!st || sy + st.h > D.h - m) L.fits = false;
  if (st) {
    L.sameCard = st.same;
    L.rule = st.rule;
    L.notes = st.notes;
    L.stripBottom = sy + st.h;
  }
  return L;
}

function finish(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const col = hcColors(ctx);
  const s = L.s;
  const D = ctx.design;
  const a = p.spots.a, b = p.spots.b;
  L.same = a === b;
  const dMax = Math.max(standX(a), standX(b)) - STAGE.startX;
  L.plan = {A: takePlan(a, dMax), B: takePlan(b, dMax)};
  L.spot = {A: a, B: b};
  L.look = actorLook(ctx, {appearance: {}}, 0);
  L.parts = {};
  for (const X of ['A', 'B']) {
    L.parts[X] = {
      art: dioramaArt(ctx, {prefix: `d${X}`, seedKey: 'hc-stage'}),
      parcel: parcelArt(ctx, `parcel${X}`),
      flag: flagArt(ctx, `flag${X}`, col.flag),
      fig: figurine(ctx, {name: `fig${X}`, look: L.look}),
    };
  }
  const W2 = (X, q) => ({x: L.dio[X].x + q.x * L.dio[X].k, y: L.dio[X].y + (q.y - CROP_TOP) * L.dio[X].k});
  L.W2 = W2;
  // --- comparison guide: from each placed parcel up (or across) to a shared path, joined by the guide label
  const pA = W2('A', {x: parcelAt(a).x, y: parcelAt(a).y - PH / 2 - 4});
  const pB = W2('B', {x: parcelAt(b).x, y: parcelAt(b).y - PH / 2 - 4});
  let path;
  if (L.layout === 'row') {
    const gW = L.guideW;
    const probe = ctx.show('all') ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: gW, size: s, minSize: s, maxLines: 4}) : null;
    const gy = L.guideY;
    path = [pA, {x: pA.x, y: gy}, {x: pB.x, y: gy}, pB];
    const mid = (pA.x + pB.x) / 2;
    L.guideChip = probe ? chip(ctx, p.comparisonLabels.guide, {x: clamp(mid, L.m + probe.box.w / 2, D.w - L.m - probe.box.w / 2), y: gy - probe.box.h / 2, anchor: 'middle', maxWidth: gW, size: s, minSize: s, maxLines: 4, fill: th.card, stroke: col.b, name: 'guideChip', weight: 700}) : null;
    L.guideChipLead = null;
  } else {
    // down the right gutter: out from each parcel, along the gutter; the label sits on the gutter beside header B
    const xr = L.guideX;
    path = [pA, {x: xr, y: pA.y}, {x: xr, y: pB.y}, pB];
    const at = L.guideChipAt;
    L.guideChip = at ? chip(ctx, p.comparisonLabels.guide, {x: at.x, y: at.y, anchor: 'middle', maxWidth: at.w, size: s, minSize: s, maxLines: 3, fill: th.card, stroke: col.b, name: 'guideChip', weight: 700}) : null;
    L.guideChipLead = null;
  }
  L.guidePath = path;
  L.guideLen = path.slice(1).reduce((acc, q, i) => acc + Math.hypot(q.x - path[i].x, q.y - path[i].y), 0);
  // --- relation (plain, no arrow): the changed-fact note ↔ the rule condition it concerns
  const cond = Math.min(p.condition, p.rules.conditions.length - 1);
  L.cond = cond;
  const ch = L.notes.find(n => n.name === 'changed');
  const an = L.rule.anchors[cond];
  if (ch) {
    const right = ch.c.box.x >= L.rule.box.x + L.rule.box.w - 1;
    const from = right ? {x: ch.c.box.x, y: ch.c.box.y + ch.c.box.h / 2} : {x: ch.c.box.x + ch.c.box.w, y: ch.c.box.y + ch.c.box.h / 2};
    const to = right ? an.right : an.left;
    const mx = (from.x + to.x) / 2;
    const c1 = {x: mx, y: from.y}, c2 = {x: mx, y: to.y};
    L.rel = {from, to, d: `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`, len: Math.hypot(to.x - from.x, to.y - from.y) * 1.25 + 20};
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
    // the scenes stay large (side by side: each ≥ 40 % of the safe width; stacked: near full width);
    // the text first keeps ≥ ~20 px while the scenes shrink a little, then goes down towards 16 px
    const kMin = ctx.view.shape === 'portrait' ? 0.88 : 0.86;
    const ks = [1, 0.96, 0.92, 0.89, 0.86].filter(v => v >= kMin - 1e-9);
    const tries = [];
    // large scenes first (k ≥ 0.92) with ≥ ~20 px text, then smaller scenes, then smaller text
    for (const k of ks.filter(v => v >= 0.92)) for (const kk of [1, 0.95, 0.9]) tries.push([kk, k]);
    for (const k of ks.filter(v => v < 0.92)) for (const kk of [1, 0.95, 0.9]) tries.push([kk, k]);
    for (const kk of [0.86, 0.82, 0.78, 0.745, 0.73]) for (const k of ks) tries.push([kk, k]);
    let L = null;
    for (const [kk, k] of tries) {
      L = compose(ctx, base * kk, k, sc);
      if (L.fits) break;
    }
    if (!L.fits || !L.rule) L = compose(ctx, base * 0.73, kMin, sc);
    L.sc = sc;
    return finish(ctx, L);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const col = hcColors(ctx);
    const scn = X => {
      const P = L.parts[X];
      const d = L.dio[X];
      const cid = `crop${X}`;
      return g(null,
        h('defs', null, h('clipPath', {id: ctx.id(cid)}, h('rect', {x: r(d.x - 4), y: r(d.y), width: r(L.dio.w + 8), height: r(L.dio.h + 4)}))),
        g({'clip-path': ctx.ref(cid)}, g({name: `scene${X}`, transform: T(d.x, d.y - CROP_TOP * d.k, 0, d.k)},
          P.art.back,
          g({name: `parcel${X}T`}, P.parcel),
          g({name: `flag${X}T`}, P.flag),
          P.fig.node,
          P.art.boxFront,
          P.art.apron,
        )),
        // the cropped view keeps a wooden top rim so each diorama still reads as a framed box
        h('path', {d: `M${r(d.x)} ${r(d.y)}H${r(d.x + L.dio.w)}V${r(d.y + 10)}H${r(d.x)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.4}),
      );
    };
    const gp = L.guidePath;
    return g(null,
      g({name: 'shared', opacity: 0}, L.sameCard.node, L.rule.node),
      scn('A'), scn('B'),
      L.hdr.A.node, L.hdr.B.node,
      h('path', {name: 'guide', d: `M${gp.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`, fill: 'none', stroke: col.b, 'stroke-width': 4, 'stroke-dasharray': `${r(L.guideLen)} ${r(L.guideLen + 20)}`, 'stroke-dashoffset': r(L.guideLen), 'stroke-linejoin': 'round'}),
      h('circle', {name: 'guideDotA', cx: r(gp[0].x), cy: r(gp[0].y), r: 7, fill: col.a, stroke: th.ink, 'stroke-width': 2, opacity: 0}),
      h('circle', {name: 'guideDotB', cx: r(gp[3].x), cy: r(gp[3].y), r: 7, fill: col.b, stroke: th.ink, 'stroke-width': 2, opacity: 0}),
      L.guideChipLead ? h('line', {name: 'guideLead', ...L.guideChipLead, stroke: col.b, 'stroke-width': 3, 'stroke-dasharray': '4 6', opacity: 0}) : null,
      L.guideChip && g({name: 'guideChipG', opacity: 0}, L.guideChip.node),
      L.rel ? h('path', {name: 'rel', d: L.rel.d, fill: 'none', stroke: col.rule, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(L.rel.len)} ${r(L.rel.len + 20)}`, 'stroke-dashoffset': r(L.rel.len)}) : null,
      L.rel ? h('circle', {name: 'relDotA', cx: r(L.rel.from.x), cy: r(L.rel.from.y), r: 6, fill: col.rule, stroke: th.ink, 'stroke-width': 1.6, opacity: 0}) : null,
      L.rel ? h('circle', {name: 'relDotB', cx: r(L.rel.to.x), cy: r(L.rel.to.y), r: 6, fill: col.rule, stroke: th.ink, 'stroke-width': 1.6, opacity: 0}) : null,
      L.notes.map(n => n.c.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const D = ctx.design;
    const reduced = ctx.reduced;
    const nodes = {};
    nodes.shared = {opacity: r(seg(u, ...W.shared), 3)};
    // --- change: only B's flag hops from the base spot to its own spot
    const hop = (reduced ? ease.outCubic : ease.inOutCubic)(seg(u, ...W.hop));
    const fa = flagBase(L.spot.A), fb = flagBase(L.spot.B);
    const fB = {x: lerp(fa.x, fb.x, hop), y: lerp(fa.y, fb.y, hop) - Math.sin(Math.PI * hop) * 90};
    nodes.flagAT = {transform: T(fa.x, fa.y)};
    nodes.flagBT = {transform: T(fB.x, fB.y)};
    const hk = seg(u, ...W.headers);
    for (const X of ['A', 'B']) {
      nodes[`hdr${X}-col`] = {opacity: r(hk, 3)};
      nodes[`hdr${X}-txt`] = {opacity: r(hk, 3)};
    }
    // --- parallel takes with identical timing (one shared walking curve)
    const tau = seg(u, ...W.run) * 1.0;
    const running = u >= W.run[0] && u < W.run[1] + 0.01;
    const st = {};
    const semantics = {};
    let reached = true;
    for (const X of ['A', 'B']) {
      const s1 = takeState(L.plan[X], tau);
      st[X] = s1;
      const fp = L.parts[X].fig.pose({x: s1.figX, lift: reduced ? 0 : s1.lift, near: s1.near, far: s1.far});
      reached = reached && fp.reached;
      Object.assign(nodes, fp.nodes);
      nodes[`parcel${X}T`] = {transform: T(s1.parcel.x, s1.parcel.y)};
      const turns = tau * 3;
      nodes[`d${X}-reelL`] = {transform: `${T(L.parts[X].art.reels.left.x, L.parts[X].art.reels.left.y)} rotate(${reelAngle(turns)})`};
      nodes[`d${X}-reelR`] = {transform: `${T(L.parts[X].art.reels.right.x, L.parts[X].art.reels.right.y)} rotate(${reelAngle(turns * 0.8)})`};
      nodes[`d${X}-play`] = {opacity: running ? 1 : 0};
      nodes[`d${X}-rew`] = {opacity: 0};
      nodes[`d${X}-lampA`] = {opacity: X === 'A' && u >= W.run[0] ? 1 : 0};
      nodes[`d${X}-lampB`] = {opacity: X === 'B' && u >= W.run[0] ? 1 : 0};
      semantics[X] = {fp, s1};
    }
    // --- guide and relation
    const gk = ease.inOutCubic(seg(u, ...W.guide));
    nodes.guide = {'stroke-dashoffset': r(L.guideLen * (1 - gk))};
    nodes.guideDotA = {opacity: gk > 0 ? 1 : 0};
    nodes.guideDotB = {opacity: gk >= 0.98 ? 1 : 0};
    if (L.guideChipLead) nodes.guideLead = {opacity: r(seg(gk, 0.6, 1), 3)};
    if (L.guideChip) nodes.guideChipG = {opacity: r(seg(gk, 0.55, 1), 3)};
    const rk = ease.inOutCubic(seg(u, ...W.rel));
    if (L.rel) {
      nodes.rel = {'stroke-dashoffset': r(L.rel.len * (1 - rk))};
      nodes.relDotA = {opacity: rk > 0 ? 1 : 0};
      nodes.relDotB = {opacity: rk >= 0.98 ? 1 : 0};
    }
    nodes[`rule-hl${L.cond}`] = {opacity: r(rk, 3)};
    const nk = seg(u, ...W.notes);
    L.notes.forEach((n, i) => { nodes[n.name] = {opacity: r(n.name === 'key' ? seg(u, ...W.key) : clamp(nk * 1.5 - i * 0.12), 3)}; });

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const spotOf = pt => Object.keys(SPOTS).find(k => Math.hypot(parcelAt(k).x - pt.x, parcelAt(k).y - pt.y) < 0.5) || null;
    const look = X => ({
      flag: X === 'A' ? P2(fa) : P2(fB),
      fig: r(st[X].figX, 3),
      lift: r(st[X].lift, 3),
      parcel: P2(st[X].parcel),
      holder: st[X].holder,
      badgeColour: r(hk, 3),
      labels: r(hk, 3),
      play: running,
      lamp: u >= W.run[0],
    });
    const lookA = look('A'), lookB = look('B');
    // before the change beat the two scenes must be the same, look for look (lamps are take-specific: both off)
    const sameBase = JSON.stringify({...lookA, lamp: null}) === JSON.stringify({...lookB, lamp: null});
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      scenes: 2,
      lookA, lookB,
      identical: sameBase,
      flagSpotA: L.spot.A,
      flagSpotB: hop >= 1 ? L.spot.B : hop <= 0 ? L.spot.A : null,
      hop: r(hop, 3),
      tau: r(tau, 4),
      figA: P2(L.W2('A', {x: st.A.figX, y: STAGE.floorY - st.A.lift})),
      figB: P2(L.W2('B', {x: st.B.figX, y: STAGE.floorY - st.B.lift})),
      parcelA: P2(L.W2('A', st.A.parcel)),
      parcelB: P2(L.W2('B', st.B.parcel)),
      flagB: P2(L.W2('B', {x: fB.x, y: fB.y - FLAG_H})),
      figXA: r(st.A.figX, 3),
      figXB: r(st.B.figX, 3),
      phaseA: st.A.phase,
      phaseB: st.B.phase,
      parcelSpotA: st.A.holder === 'spot' ? spotOf(st.A.parcel) : null,
      parcelSpotB: st.B.holder === 'spot' ? spotOf(st.B.parcel) : null,
      differingCircumstances: L.spot.A === L.spot.B ? 0 : 1,
      guide: r(gk, 3),
      relation: {kind: 'relation', condition: L.cond, drawn: r(rk, 3)},
      notes: L.notes.map(n => n.c.fit.lines.join(' ')),
      outcome: 'not-supplied',
      winner: null,
      score: null,
      allReached: reached,
      textPx: r(L.s * L.sc, 2),
      layout: L.layout,
      dio: {x: r(L.dio.A.x), y: r(L.dio.A.y), k: r(L.dio.A.k, 3), w: r(L.dio.w), h: r(L.dio.h), bx: r(L.dio.B.x)},
      stripTop: r(Math.min(L.sameCard.box.y, L.rule.box.y)),
      // AUTHORING item 18: each scene's share of the safe width (the design box spans the safe area)
      sceneShare: r(L.dio.w / D.w, 3),
      stacked: L.layout === 'column',
      boxes: Object.fromEntries([
        ['sceneA', {x: L.dio.A.x, y: L.dio.A.y, w: L.dio.w, h: L.dio.h}],
        ['sceneB', {x: L.dio.B.x, y: L.dio.B.y, w: L.dio.w, h: L.dio.h}],
        ['hdrA', L.hdr.A.textBox], ['hdrB', L.hdr.B.textBox],
        ['same', L.sameCard.box], ['rule', L.rule.box],
        ...(L.guideChip ? [['guideChip', L.guideChip.box]] : []),
        ...L.notes.map(n => [n.name, n.c.box]),
      ].map(([k2, b2]) => [k2, {x: r(b2.x), y: r(b2.y), w: r(b2.w), h: r(b2.h)}])),
      design: {w: r(D.w), h: r(D.h)},
      relEnds: L.rel ? {from: P2(L.rel.from), to: P2(L.rel.to), anchorL: P2(L.rule.anchors[L.cond].left), anchorR: P2(L.rule.anchors[L.cond].right)} : null,
      complete: W.key[1],
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
    slug: 'reasoning-09-contrast',
    title: 'Counterfactual fact — two identical dioramas, one flag moved: the same take runs in lockstep to two spots',
    titleEs: 'Hecho contrafactual — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho contrafactual',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete tabletop dioramas of the same scene start identical (neutral badges only). In B alone the pennant flag hops to another spot — the one changed circumstance — and the headers name the base scenario and the hypothetical. Both takes then run with identical timing: the figurines walk in lockstep and each leaves the parcel at its own flagged spot. A dashed guide joins the two parcels over the rooftops; the changed fact is related (plain relation) to the rule condition the author names. Shared facts and the rule plate are drawn once; neutral note, issue, assumption; the hypothetical’s outcome is not supplied and no winner or conclusion is shown.',
    tags: ['reasoning', 'counterfactual', 'hypothetical', 'contrast', 'paired', 'diorama', 'figurine', 'flag', 'guide', 'rule'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-contrafactual.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HC_STRINGS,
  scene,
});
