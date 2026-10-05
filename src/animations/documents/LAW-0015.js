/**
 * LAW-0015 — Redacción comparada · contrast
 *
 * Storyboard (two identical review desks, 7.5 s):
 *  0.00–0.17  base: the same desk twice — filed original in the open folder,
 *             the drafting party holding an incoming copy, the reviewer's
 *             pen and stamp waiting. Both incoming copies carry the ORIGINAL
 *             wording.
 *  0.17–0.40  change: only in scenario B the incoming copy's modified words
 *             are rewritten in place (old words lift out, revised words
 *             settle, briefly highlighted); scenario A keeps the original
 *             text. Both drafters then start laying their copy down.
 *  0.40–0.77  parallel: identical placement, row alignment, pen check and
 *             stamp in both desks. Because only the wording differs, the pen
 *             in A can only tick each aligned row (nothing to link), while
 *             in B it links each modified word pair and ticks the unchanged
 *             row — the changed fact changes the marks, not just a label.
 *  0.77–1.00  guide: rings mark EVERY differing row of both incoming copies
 *             (adjacent differing rows share one ring) and one guide joins
 *             them, branching into each ring; its label names the differing
 *             rows (`{rows}` is filled from the edits). A neutral note says
 *             both situations are shown without any outcome, winner or score.
 * @module animations/documents/LAW-0015
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields, obj, str} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {FONTS} from '../../core/text.js';
import {roundRectPath} from '../../core/geometry.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {comparedFields, compareDesk, buildDiff, alignedLayout, LINK_LEADING, COMPARE_STRINGS, STAGE} from './kits/redaccion-comparada.js';

const ID = 'LAW-0015';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  changeChip: [0.18, 0.24], morph: [0.2, 0.32], flash: [0.2, 0.4],
  place: [0.3, 0.44], release: [0.44, 0.5], bands: [0.42, 0.5],
  pen: [0.44, 0.73], withdraw: [0.73, 0.76], stamp: [0.68, 0.8],
  guide: [0.8, 0.91], note: [0.89, 0.96],
};

const sceneSchema = {
  ...comparedFields,
  ...contrastFields(),
  comparisonLabels: obj('Labels of the comparison guide', {
    guide: str('Label on the guide that rings every differing row. `{rows}` is replaced by the differing rows derived from `edits` (e.g. "rows 1 and 3" / "filas 1 y 3")', 70),
    neutral: str('Neutral note (no winner, no outcome)', 120),
  }),
  versionLabels: obj('Tab labels used identically in both scenes', {
    filed: str('Tab of the filed original (left sheet)', 40),
    incoming: str('Tab of the incoming copy (right sheet)', 40),
  }),
  stampLabel: str('Text of the comparison stamp used identically in both scenes', 24),
};

const defaultParams = {
  documentId: 'DOC-212',
  documentTitle: 'Printing Services Agreement',
  clauses: [
    'The Provider will deliver the printed brochures to the main office.',
    'Each delivery is recorded on the shared order sheet.',
    'Either party may contact the other by letter.',
  ],
  edits: [
    {clause: 0, from: 'printed', to: 'digital'},
    {clause: 0, from: 'main', to: 'branch'},
    {clause: 2, from: 'letter', to: 'email'},
  ],
  signers: [{name: 'Lena Ortiz', role: 'Drafting party'}, {name: 'Kofi Mensah', role: 'Reviewer'}],
  redactions: [],
  scenarioA: {label: 'Original text', caption: 'The incoming copy repeats the filed wording'},
  scenarioB: {label: 'Revised text', caption: 'The incoming copy carries revised wording'},
  changedFact: 'Only the wording of the incoming copy differs',
  sharedFacts: ['Same filed original', 'Same parties', 'Same check and stamp'],
  comparisonLabels: {guide: 'Changed fact: wording of {rows} of the incoming copy', neutral: 'Two situations shown side by side — no outcome is stated'},
  versionLabels: {filed: 'Filed original', incoming: 'Incoming copy'},
  stampLabel: 'COMPARED',
};

/** Built-in words used to fill the `{rows}` token of the guide label. */
const STRINGS = {
  en: {...COMPARE_STRINGS.en, rowOne: 'row', rowMany: 'rows', listAnd: 'and', noRow: 'no row'},
  es: {...COMPARE_STRINGS.es, rowOne: 'fila', rowMany: 'filas', listAnd: 'y', noRow: 'ninguna fila'},
};

/**
 * "row 1" / "rows 1 and 3" / "rows 1, 2 and 4" (1-based) for zero-based rows.
 * @param {Record<string,string>} t
 * @param {number[]} rows
 */
function rowsPhrase(t, rows) {
  const n = rows.map(i => String(i + 1));
  if (!n.length) return t.noRow;
  if (n.length === 1) return `${t.rowOne} ${n[0]}`;
  return `${t.rowMany} ${n.slice(0, -1).join(', ')} ${t.listAnd} ${n[n.length - 1]}`;
}

/**
 * Differing rows (wording changed and not withheld) grouped into runs of
 * adjacent rows, so neighbouring differing rows share one ring instead of
 * two rings that touch. With no differing row the whole row block is ringed.
 * @param {{rows:any[]}} diff
 */
function focusGroups(diff) {
  const rows = diff.rows.map((rw, ci) => (rw.changes.length && !rw.redacted ? ci : -1)).filter(ci => ci >= 0);
  const groups = [];
  for (const ci of rows) {
    const last = groups[groups.length - 1];
    if (last && last.b === ci - 1) last.b = ci;
    else groups.push({a: ci, b: ci});
  }
  if (!groups.length) groups.push({a: 0, b: diff.rows.length - 1});
  return {rows, groups};
}

/**
 * Narrowest chip width that keeps the same line count and type size as
 * `spec.maxWidth`, so a wrapped label splits into even lines instead of
 * leaving one orphaned word on its last line.
 * @param {any} ctx
 * @param {string} text
 * @param {{maxWidth:number, maxLines:number}} spec
 * @param {number} size
 */
function balancedWidth(ctx, text, spec, size) {
  const probe = w => chip(ctx, text, {x: 0, y: 0, size, ...spec, maxWidth: w}).fit;
  const base = probe(spec.maxWidth);
  if (base.lines.length < 2 || base.truncated) return spec.maxWidth;
  let best = spec.maxWidth;
  for (let w = spec.maxWidth - 12; w > spec.maxWidth * 0.4; w -= 12) {
    const f = probe(w);
    if (f.lines.length !== base.lines.length || f.size !== base.size || f.truncated) break;
    best = w;
  }
  return best;
}

/** Stage shape and arrangement per available shape. */
const ARRANGE = {
  landscape: {stage: 'landscape', arrangement: 'row'},
  square: {stage: 'portrait', arrangement: 'row'},
  portrait: {stage: 'landscape', arrangement: 'column'},
};

/**
 * Closing guide: a relation line (no arrowhead, dots at both ends) along an
 * orthogonal route with rounded corners, drawn on with a dash offset. It runs
 * only through free desk margins and bands, never across the sheets' text:
 * side-by-side desks — out of ring A to the right, up the margin beside the
 * incoming copy, across the free band above both folders, down the same
 * margin of desk B and into ring B; stacked desks — out of ring A to the
 * right, down a lane outside both desks and back into ring B.
 * When several rows differ, the trunk passes a junction level with each other
 * ring and a short straight branch leaves it into that ring. A branch is drawn
 * on as the trunk's draw-on front passes its junction (same pen speed), so the
 * held final frame shows every ring joined.
 * @param {any} ctx
 * @param {{name:string, pts:Array<{x:number,y:number}>, color:string, radius?:number,
 *   branches?:Array<{from:{x:number,y:number}, to:{x:number,y:number}}>}} o
 *   `branches[k].from` must lie on a straight segment of `pts`.
 */
function routeGuide(ctx, o) {
  const P = o.pts;
  const rad = o.radius ?? 36;
  let d = `M${r(P[0].x)} ${r(P[0].y)}`;
  let total = 0;
  let cur = P[0];
  // arc length (of the rounded path) at the start of each straight segment
  const segStart = [{at: P[0], s: 0}];
  for (let i = 1; i < P.length; i++) {
    const q = P[i];
    if (i < P.length - 1) {
      const n = P[i + 1];
      const l1 = Math.hypot(q.x - cur.x, q.y - cur.y), l2 = Math.hypot(n.x - q.x, n.y - q.y);
      const k = Math.min(rad, l1 / 2, l2 / 2);
      const a = {x: q.x + ((cur.x - q.x) / (l1 || 1)) * k, y: q.y + ((cur.y - q.y) / (l1 || 1)) * k};
      const b = {x: q.x + ((n.x - q.x) / (l2 || 1)) * k, y: q.y + ((n.y - q.y) / (l2 || 1)) * k};
      d += `L${r(a.x)} ${r(a.y)}Q${r(q.x)} ${r(q.y)} ${r(b.x)} ${r(b.y)}`;
      total += Math.hypot(a.x - cur.x, a.y - cur.y) + k * 1.58;
      cur = b;
      segStart.push({at: b, s: total});
    } else {
      d += `L${r(q.x)} ${r(q.y)}`;
      total += Math.hypot(q.x - cur.x, q.y - cur.y);
    }
  }
  // where along the trunk a junction point lies (nearest straight segment)
  const arcAt = pt => {
    let best = {dist: Infinity, s: 0};
    segStart.forEach((sg, i) => {
      const endPt = i + 1 < P.length ? P[i + 1] : P[P.length - 1];
      const vx = endPt.x - sg.at.x, vy = endPt.y - sg.at.y;
      const len2 = vx * vx + vy * vy || 1;
      const tt = clamp(((pt.x - sg.at.x) * vx + (pt.y - sg.at.y) * vy) / len2);
      const px = sg.at.x + vx * tt, py = sg.at.y + vy * tt;
      const dist = Math.hypot(pt.x - px, pt.y - py);
      if (dist < best.dist) best = {dist, s: sg.s + Math.hypot(px - sg.at.x, py - sg.at.y)};
    });
    return best.s;
  };
  const branches = (o.branches || []).map((b, k) => ({...b, k, s: arcAt(b.from), len: Math.hypot(b.to.x - b.from.x, b.to.y - b.from.y)}));
  const end = P[P.length - 1];
  const dot = (name, pt) => h('circle', {name, cx: r(pt.x), cy: r(pt.y), r: 5.5, fill: o.color, opacity: 0});
  const node = g({name: o.name},
    h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total + 2)} ${r(total + 12)}`, 'stroke-dashoffset': r(total + 2)}),
    branches.map(b => g({name: `${o.name}-br${b.k}`},
      h('path', {name: `${o.name}-br${b.k}-line`, d: `M${r(b.from.x)} ${r(b.from.y)}L${r(b.to.x)} ${r(b.to.y)}`, fill: 'none', stroke: o.color, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(b.len + 2)} ${r(b.len + 12)}`, 'stroke-dashoffset': r(b.len + 2)}),
      dot(`${o.name}-br${b.k}-join`, b.from),
      dot(`${o.name}-br${b.k}-end`, b.to),
    )),
    dot(`${o.name}-dotA`, P[0]),
    dot(`${o.name}-dotB`, end),
  );
  const frame = (p, opacity = 1) => {
    const out = {
      [o.name]: {opacity},
      [`${o.name}-line`]: {'stroke-dashoffset': r((total + 2) * (1 - p))},
      [`${o.name}-dotA`]: {opacity: p > 0 ? 1 : 0},
      [`${o.name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
    };
    for (const b of branches) {
      const bp = p >= 1 ? 1 : clamp((p * total - b.s) / (b.len || 1));
      out[`${o.name}-br${b.k}-line`] = {'stroke-dashoffset': r((b.len + 2) * (1 - bp))};
      out[`${o.name}-br${b.k}-join`] = {opacity: bp > 0 ? 1 : 0};
      out[`${o.name}-br${b.k}-end`] = {opacity: bp >= 0.985 ? 1 : 0};
    }
    return out;
  };
  const branchProgress = p => branches.map(b => (p >= 1 ? 1 : r(clamp((p * total - b.s) / (b.len || 1)), 3)));
  return {node, frame, branchProgress};
}

/**
 * Scenario header (badge + label + caption) whose label and caption may take
 * two lines each instead of being cut; `height` is what it needs.
 * @param {any} ctx
 * @param {{name:string, letter:string, label:string, caption?:string, x:number, y:number, w:number, color:string, size:number}} o
 */
function sceneHeader(ctx, o) {
  const th = ctx.theme;
  const size = o.size;
  const badgeR = size * 0.78;
  const tx = o.x + badgeR * 2 + 18;
  const maxW = o.w - badgeR * 2 - 24;
  const lab = ctx.show('key') ? ctx.fit(o.label || ' ', {maxWidth: maxW, size, minSize: size * 0.7, maxLines: 2, weight: 700}) : null;
  const cap = o.caption && ctx.show('all') ? ctx.fit(o.caption, {maxWidth: maxW, size: size * 0.62, minSize: 16, maxLines: 2, weight: 500}) : null;
  const labH = lab ? lab.size + (lab.lines.length - 1) * lab.lineHeight : size;
  const capGap = cap ? cap.size * 0.55 : 0;
  const capH = cap ? capGap + cap.size + (cap.lines.length - 1) * cap.lineHeight : 0;
  const height = Math.max(badgeR * 2, labH + capH) + 12;
  const badgeY = o.y + badgeR + 2;
  const node = g({name: o.name},
    h('circle', {cx: r(o.x + badgeR), cy: r(badgeY), r: r(badgeR), fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: r(o.x + badgeR), y: r(badgeY + size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': FONTS.sans, fill: '#fff'}, o.letter) : null,
    lab ? textBlock(lab, {x: tx, y: o.y + 2 + Math.max(0, badgeR - labH / 2 - (cap ? capH / 2 : 0)), fill: th.fg}) : null,
    cap ? textBlock(cap, {x: tx, y: o.y + 2 + Math.max(0, badgeR - labH / 2 - capH / 2) + labH + capGap, fill: th.fgSoft}) : null,
  );
  return {node, height};
}

const scene = {
  sizes: {landscape: [3270, 1270], square: [1870, 1700], portrait: [1600, 2500]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {stage: stShape, arrangement} = ARRANGE[ctx.view.shape];
    const G = STAGE[stShape];
    const row = arrangement === 'row';
    const showKey = ctx.show('key');
    const colors = [th.accent3, th.accent2];
    const scen = i => (i ? p.scenarioB : p.scenarioA);
    // scenario headers: label and caption may wrap to two lines; the strip grows to fit
    const head = (i, x, y) => sceneHeader(ctx, {name: `head-${i}`, letter: i ? 'B' : 'A', label: scen(i).label, caption: scen(i).caption, x, y, w: G.w, color: colors[i], size: 52});
    const header = Math.max(150, ...[0, 1].map(i => head(i, 0, 0).height + 20));
    // side-by-side desks: the guide runs across the free band above both
    // folders and its label sits above that run in desk B; stacked desks: the
    // label gets its own strip between desk A and header B, beside the lane
    const bandY = stShape === 'portrait' ? 420 : 165;
    const diff = buildDiff(p.clauses, p.edits, p.redactions);
    // every differing row is ringed; the guide label names them all
    const focus = focusGroups(diff);
    const guideText = String(p.comparisonLabels.guide || '').split('{rows}').join(rowsPhrase(ctx.t, focus.rows));
    const gcSpec = row
      ? {maxWidth: Math.min(1100, G.drafter.shoulder[0] - 210), maxLines: stShape === 'portrait' ? 3 : 2}
      : {maxWidth: G.w * 0.6, maxLines: 2};
    if (showKey) gcSpec.maxWidth = balancedWidth(ctx, guideText, gcSpec, 40);
    const gcProbe = showKey ? chip(ctx, guideText, {x: 0, y: 0, size: 40, ...gcSpec}) : null;
    const geo = pairedGeometry(ctx, {stage: {w: G.w, h: G.h}, arrangement, header, gap: row || !gcProbe ? 70 : 70 + gcProbe.box.h + 20});
    const lane = row ? 0 : 60;
    // footer notes (one at a time): the strip fits the tallest
    const noteMax = geo.w * 0.95;
    const footY = geo.h + 24;
    const changeChip = showKey ? chip(ctx, p.changedFact, {x: geo.w / 2, y: footY, anchor: 'middle', maxWidth: geo.w * 0.9, size: 46, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: geo.w / 2, y: footY, maxWidth: noteMax, size: 42, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: geo.w / 2, y: footY, maxWidth: noteMax, size: 42, name: 'neutral-note'}) : null;
    const footer = Math.max(140, ...[changeChip, shared, neutral].filter(Boolean).map(c => c.box.h + 40));
    const bw = geo.w + lane, bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    // one shared row-aligned layout so both desks are drawn identically
    const L = alignedLayout(ctx, {w: G.sheet[0], h: G.sheet[1], rows: diff.rows, size: G.body[0], minSize: G.body[1] * 0.8, docId: p.documentId, title: p.documentTitle, leading: LINK_LEADING});
    const common = {
      shape: stShape, diff, L, ticks: true, incomingStyle: 'B',
      doc: {docId: p.documentId, title: p.documentTitle},
      labels: {filed: p.versionLabels.filed, incoming: p.versionLabels.incoming, folder: '', stamp: p.stampLabel},
      signers: p.signers, withStamp: true, chips: false,
    };
    const stages = [
      compareDesk(ctx, {...common, prefix: 'sa', incoming: 'A'}),
      compareDesk(ctx, {...common, prefix: 'sb', incoming: 'B', morph: true}),
    ];
    const headers = geo.panels.map((pn, i) => head(i, pn.x, pn.headerY + 8).node);
    // The details that differ: one ring per run of adjacent differing rows, in
    // the same place on both incoming copies.
    const ringBox = (i, grp) => {
      const st = stages[i];
      const ra = L.rows[grp.a], rb = L.rows[grp.b];
      const pn = geo.panels[i];
      const y0 = ra.top - L.size * 0.4, y1 = rb.top + rb.h + L.size * 0.15;
      return {x: pn.x + st.bTL.x + L.pad * 0.35, y: pn.y + st.bTL.y + y0, w: st.sw - L.pad * 0.7, h: y1 - y0};
    };
    const rings = [0, 1].map(i => focus.groups.map(grp => ringBox(i, grp)));
    const pA = geo.panels[0], pB = geo.panels[1];
    const port = rg => ({x: rg.x + rg.w, y: rg.y + rg.h * 0.5});
    const nG = focus.groups.length;
    let pts, gcAt, branches;
    if (row) {
      // the margin between each incoming copy and its folder's edge, then the
      // band above the folders; the trunk ends in the LOWEST ring of each desk
      // and passes every higher ring on its way, branching into it
      const st = stages[0];
      const xm = st.bTL.x + st.sw + (G.folder[0] + G.folder[2] - (st.bTL.x + st.sw)) / 2;
      const from = port(rings[0][nG - 1]), to = port(rings[1][nG - 1]);
      pts = [from, {x: pA.x + xm, y: from.y}, {x: pA.x + xm, y: pA.y + bandY}, {x: pB.x + xm, y: pB.y + bandY}, {x: pB.x + xm, y: to.y}, to];
      branches = [
        ...rings[0].slice(0, -1).map(rg => ({from: {x: pA.x + xm, y: port(rg).y}, to: port(rg)})),
        ...rings[1].slice(0, -1).map(rg => ({from: {x: pB.x + xm, y: port(rg).y}, to: port(rg)})),
      ];
      gcAt = {x: pB.x + 40, y: pB.y + bandY - 18 - (gcProbe ? gcProbe.box.h : 0), anchor: 'start'};
    } else {
      // stacked desks: from A's top ring down the outer lane to B's lowest ring
      const lx = geo.w + lane * 0.5;
      const from = port(rings[0][0]), to = port(rings[1][nG - 1]);
      pts = [from, {x: lx, y: from.y}, {x: lx, y: to.y}, to];
      branches = [
        ...rings[0].slice(1).map(rg => ({from: {x: lx, y: port(rg).y}, to: port(rg)})),
        ...rings[1].slice(0, -1).map(rg => ({from: {x: lx, y: port(rg).y}, to: port(rg)})),
      ];
      gcAt = {x: geo.w - 20, y: pA.y + G.h + 10, anchor: 'end'};
    }
    const guide = routeGuide(ctx, {name: 'guide', pts, branches, color: th.accent});
    const guideChip = showKey ? chip(ctx, guideText, {...gcAt, size: 40, ...gcSpec, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null;
    return {geo, stages, headers, rings, guide, guideChip, guideText, changeChip, shared, neutral, s, ox, oy, arrangement, focus, diff};
  },
  build(ctx, L) {
    const th = ctx.theme;
    // desk A's rings dashed (same wording there), desk B's solid
    const ring = (i, k) => {
      const rg = L.rings[i][k];
      return h('path', {name: `ring-${i}-${k}`, d: roundRectPath(rg.x, rg.y, rg.w, rg.h, 14), fill: 'none', stroke: th.accent, 'stroke-width': 6, 'stroke-dasharray': i === 0 ? '14 11' : null, opacity: 0});
    };
    // a ring around the last row would cross the corner of the comparison
    // stamp pressed over the gutter: the stamp stays on top (the ring passes
    // beneath it, with a small clearance) so neither is drawn over the other
    const ringLayer = i => {
      const sb = L.stages[i].stampBox;
      if (!sb) return L.rings[i].map((_, k) => ring(i, k));
      const pn = L.geo.panels[i];
      const m = 10;
      const bx = -20, by = -20, bw = L.geo.w + 400, bh = L.geo.h + 400;
      return g(null,
        h('defs', null, h('mask', {id: ctx.id(`ringmask-${i}`), maskUnits: 'userSpaceOnUse', x: bx, y: by, width: r(bw), height: r(bh)},
          h('rect', {x: bx, y: by, width: r(bw), height: r(bh), fill: '#fff'}),
          h('rect', {x: r(-sb.w / 2 - m), y: r(-sb.h / 2 - m), width: r(sb.w + m * 2), height: r(sb.h + m * 2), rx: 12, fill: '#000', transform: T(pn.x + sb.cx, pn.y + sb.cy, sb.rot)}))),
        g({mask: ctx.ref(`ringmask-${i}`)}, L.rings[i].map((_, k) => ring(i, k))),
      );
    };
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      [0, 1].map(ringLayer),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    // identical action values for both desks; only B's copy is rewritten
    const v = {
      place: seg(u, ...W.place),
      release: seg(u, ...W.release),
      bands: seg(u, ...W.bands),
      pen: seg(u, ...W.pen),
      withdraw: seg(u, ...W.withdraw),
      stamp: seg(u, ...W.stamp),
    };
    const a = L.stages[0].pose({...v, morph: 0, flash: 0});
    const b = L.stages[1].pose({...v, morph: seg(u, ...W.morph), flash: seg(u, ...W.flash)});
    const nodes = {...a.nodes, ...b.nodes};
    const gp = seg(u, ...W.guide);
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    for (let i = 0; i < 2; i++) L.rings[i].forEach((_, k) => { nodes[`ring-${i}-${k}`] = {opacity: r(clamp(gp * 3), 3)}; });
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    // the footer notes share one spot: each fades out before the next fades in
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.49) / 0.04)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.54) / 0.05) * (1 - clamp((u - W.note[0] + 0.03) / 0.03)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(clamp((noteP - 0.35) / 0.65), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const side = q => ({
      wording: q.semantic.incomingWording,
      placed: q.semantic.incomingPlaced,
      links: q.semantic.linksDrawn,
      ticks: q.semantic.ticksDrawn,
      marks: q.semantic.marks.map(m => m.kind),
      stamp: q.semantic.stampApplied,
      incoming: q.semantic.incomingCenter,
    });
    return {
      nodes,
      semantic: {
        beat,
        a: side(a),
        b: side(b),
        incomingA: a.semantic.incomingCenter,
        incomingB: b.semantic.incomingCenter,
        penA: a.semantic.penTip,
        penB: b.semantic.penTip,
        strokeEndA: a.semantic.strokeEnd,
        strokeEndB: b.semantic.strokeEnd,
        handDrafterA: a.semantic.handDrafter,
        gripA: a.semantic.gripIncoming,
        handDrafterB: b.semantic.handDrafter,
        gripB: b.semantic.gripIncoming,
        stampA: a.semantic.stampTool,
        stampB: b.semantic.stampTool,
        reach: {a: a.semantic.allReached, b: b.semantic.allReached},
        allReached: a.semantic.allReached && b.semantic.allReached,
        guideProgress: r(gp, 3),
        focusRows: L.focus.rows,
        ringedRows: L.focus.groups.map(grp => [grp.a, grp.b]),
        guideBranches: L.guide.branchProgress(gp),
        guideLabel: L.guideText,
        arrangement: L.arrangement,
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
    slug: 'documents-04-contrast',
    title: 'Compared drafting — original vs revised incoming copy',
    titleEs: 'Redacción comparada — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Redacción comparada',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical review desks compare an incoming copy against the same filed original. Only the wording of the incoming copy differs (original in A, revised in B), so the same pen check ticks every row in A but links the modified words in B. A closing guide rings and joins every differing row in both desks and names those rows; no outcome, winner or score is shown.',
    tags: ['comparison', 'versions', 'side-by-side', 'stacked', 'wording', 'document', 'pen', 'stamp'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/redaccion-comparada.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
