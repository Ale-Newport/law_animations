/**
 * LAW-0084 — Hecho y regla · inspect
 *
 * Storyboard (the docked assembly as full-size context; while it is
 * inspected it shrinks to a context thumbnail and a reading magnifier lifts
 * ONE row out; the old datum leaves the lens as a paper slip that is kept and
 * becomes the changed-datum tag):
 *  0.00–0.20 build       The state produced by the story is built at full size:
 *                        the fact card docked on the rule plate, each latch bolt
 *                        runs to its SUPPLIED stop (seated / stops short with a
 *                        '?' disc / pending ghost). A context caption names it.
 *  0.20–0.45 isolate     The context shrinks to a thumbnail under the caption.
 *                        A rectangular reading magnifier is laid on the focus
 *                        row (attribute text + bolt + socket mouth) at scale 1
 *                        — a real copy exactly over its source coordinates —
 *                        then lifted into the free space below, enlarging the
 *                        row while the rest of the thumbnail dims (the row's
 *                        hole stays lit; cone lines tie the lens to it).
 *  0.45–0.75 substitute  Inside the lens the supplied datum is replaced. The
 *                        old value is picked up as a paper slip, pulled down
 *                        out of the lens and struck through — it stays in view,
 *                        so the "before" is traceable. The new value (supplied)
 *                        appears in the empty row, in the lens and in the
 *                        context at once (old out first, then new in). Only
 *                        then the dependent part moves: that row's bolt travels
 *                        from the stop of the status before to the stop of the
 *                        status SUPPLIED for after (e.g. from stopping short to
 *                        seated); no other row changes.
 *  0.75–1.00 return      The magnifier is set back onto the row; the struck
 *                        slip travels up with it (always just below the
 *                        closing lens) straight into its "changed datum —
 *                        before" tag slot under the thumbnail, where the tag
 *                        frame forms around it; the lens is removed, a pin and
 *                        leader join the tag to the changed row, and the whole
 *                        context — tag included — grows back to full size (the
 *                        slip rides the context; it is never left parked).
 *                        Seeking back restores the old value.
 * The build shows the bare context enlarged and centred (no tag yet); the
 * inspection (thumbnail + lens + slip band) is centred in the room under the
 * caption, with the thumbnail as large as the lens zoom allows.
 * Every shape keeps the rows horizontal (a row is a strip the lens can hold);
 * wide boxes centre a capped-width assembly, square and tall boxes use the full
 * width with larger text (the lens band is taller there).
 * Legal content: fictional, jurisdiction unspecified; the new datum and its
 * status are supplied by the author; nothing is inferred about validity,
 * responsibility or outcome.
 * @module animations/reasoning/LAW-0084
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, oneOf, inspectFields} from '../../schemas/fields.js';
import {textBlock, chip} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {lens} from '../../frameworks/lens.js';
import {
  hrFields, HR_STRINGS, DEFAULT_CONTENT, STATUSES, resolveRows, assemblyGeometry, cardArt, plateArt, boltArt,
  hrColors, doubtDisc, boltPath, socketPath, barMagnifierArt, barMagnifierFrame, BAR_HANDLE,
} from './kits/hecho-y-regla.js';

const ID = 'LAW-0084';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  caption: [0.01, 0.08], bolts: [0.03, 0.16], shrink: [0.18, 0.25],
  settle: [0.25, 0.285], open: [0.285, 0.41], dim: [0.27, 0.36],
  detach: [0.46, 0.5], drop: [0.5, 0.57], ctxOut: [0.5, 0.555], strike: [0.57, 0.62], newIn: [0.575, 0.64], travel: [0.64, 0.73],
  notesIn: [0.05, 0.11], notesOut: [0.16, 0.19], notesBack: [0.93, 0.98],
  close: [0.76, 0.85], undim: [0.79, 0.86], away: [0.85, 0.88], grow: [0.88, 0.95], toTag: [0.76, 0.85], tag: [0.83, 0.87], lead: [0.83, 0.88], pin: [0.865, 0.9],
};
const K_OUT = 0.78; // slip scale (× lens zoom) once it has left the lens

const EXTRA = {
  en: {before: 'before', contextDefault: 'Context: the fact card docked on the rule plate', markerDefault: 'Changed datum (as supplied)', boltKey: 'Bolt stop = status as supplied', rowWord: 'row'},
  es: {before: 'antes', contextDefault: 'Contexto: la tarjeta del hecho encajada en la placa', markerDefault: 'Dato cambiado (según lo aportado)', boltKey: 'Tope del cerrojo = estado según lo aportado', rowWord: 'fila'},
};
const STRINGS = {en: {...HR_STRINGS.en, ...EXTRA.en}, es: {...HR_STRINGS.es, ...EXTRA.es}};

const insp = inspectFields(['attribute', 'condition']);
const sceneSchema = {
  ...hrFields,
  ...insp,
  focusTarget: oneOf('Which text of the focus row is substituted: the attribute on the fact card or the condition on the rule plate', ['attribute', 'condition']),
  focusRow: int('Zero-based row whose text is enlarged and substituted', 0, 3),
  afterStatus: oneOf('Status of the focus row AFTER the substitution, as supplied by the author (its bolt moves to this stop: as-supplied = seated, disputed = stops short, pending = retracted); never inferred from the new text', STATUSES),
  detailGeometry: {
    ...insp.detailGeometry,
    properties: {
      zoom: insp.detailGeometry.properties.zoom,
      placement: oneOf('Where the lens opens: below the context (auto and bottom are the same here — the row is a horizontal strip whose old value drops out beneath the lens)', ['auto', 'bottom']),
    },
  },
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  focusTarget: 'attribute',
  focusRow: 2,
  beforeValue: 'Seen there at 21:40',
  afterValue: 'Both sides agree it was there at 21:40',
  afterStatus: 'as-supplied',
  detailGeometry: {zoom: 2.5, placement: 'auto'},
  contextLabels: {context: 'Context: the fact card docked on the rule plate', marker: 'Changed datum (as supplied)'},
};

const SHAPES = {
  landscape: {size: 42, maxW: 1500, thumb: 0.6, thumbMax: 0.76, maxLines: 3},
  square: {size: 42, maxW: Infinity, thumb: 0.62, thumbMax: 0.74, maxLines: 4},
  portrait: {size: 44, maxW: Infinity, thumb: 0.6, thumbMax: 0.7, maxLines: 5},
};
const M = 30;
/** Design units per output pixel at the 1080p reference (depends only on the frame's aspect and safe box). */
function unitsPer1080px(ctx) {
  const v = ctx.view, c = v.content, D = ctx.design;
  return 1 / (Math.min(c.w / D.w, c.h / D.h) * (1080 / Math.min(v.width, v.height)));
}
const LANE = 44; // free lane beside the assembly for the marker's leader

/** Placeholder bars standing in for a text when labels are hidden (text coords: x, y = top). */
function barLines(x, y, w, n, s, color, name, opacity) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const lw = n > 1 && k === n - 1 ? w * 0.55 : w;
    out.push(h('rect', {x: r(x), y: r(y + k * s * 1.2 + s * 0.2), width: r(lw), height: r(s * 0.46), rx: r(s * 0.23), fill: color}));
  }
  return g({name, opacity}, out);
}

/** world point of a context-local point under a context transform {x, y, k} */
const tmap = (Tc, q) => ({x: Tc.x + Tc.k * q.x, y: Tc.y + Tc.k * q.y});
const tstr = Tc => `translate(${r(Tc.x)} ${r(Tc.y)}) scale(${r(Tc.k, 5)})`;

function compose(ctx, s) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = SHAPES[ctx.view.shape];
  const show = ctx.show('key');
  const showAll = ctx.show('all');
  const rows0 = resolveRows(p);
  const f = clamp(p.focusRow, 0, rows0.length - 1);
  const onAttr = p.focusTarget !== 'condition';
  const rowF = rows0[f];
  const fallback = onAttr ? (rowF.attr ? rowF.attr.text : '') : (rowF.cond ?? '');
  const beforeText = p.beforeValue || fallback;
  const afterText = p.afterValue || beforeText;
  // the row as it stands BEFORE the substitution
  const attrs = p.facts.attributes.map((a, i) => (onAttr && i === f ? {...a, text: beforeText} : a));
  const conds = p.rules.conditions.map((c, i) => (!onAttr && i === f ? beforeText : c));
  const rows = resolveRows({facts: {...p.facts, attributes: attrs}, rules: {...p.rules, conditions: conds}});
  const statusBefore = rows[f].status;
  const statusAfter = statusBefore === 'unpaired' ? 'unpaired' : p.afterStatus;
  const capSize = Math.max(24, s * 0.64);
  const capH = showAll ? capSize * 2 : 14;
  const CW = Math.min(D.w - 2 * M - LANE, S.maxW);
  const G = s * 2.8, Dd = s * 1.15;
  const cardW = (CW - G) * 0.5, plateW = CW - G - cardW;
  const x0 = (D.w - CW) / 2 + (onAttr ? LANE / 2 : -LANE / 2);
  const geoAt = y => assemblyGeometry(ctx, {
    axis: 'x', x: x0, y, rows, size: s, show, kinds: {fact: t.factKind, rule: t.ruleKind}, titles: {fact: p.facts.title, rule: p.rules.title},
    cardW, plateW, G, D: Dd, alt: {i: f, side: onAttr ? 'attr' : 'cond', text: afterText}, maxLines: S.maxLines,
  });
  const probe = geoAt(0);
  // bounded reflow: rows and titles may wrap (up to maxLines) but must not lose words to an ellipsis
  const cut = x => !!(x && x.truncated);
  const truncated = probe.fits.some(q => cut(q.a) || cut(q.c) || cut(q.aAlt) || cut(q.cAlt)) || cut(probe.hc.title) || cut(probe.hp.title);
  // the replaced text (fit records) and its slip box, in context-local text coordinates (relative to the row)
  const cP = probe.cells[f];
  const fitB = onAttr ? probe.fits[f].a : probe.fits[f].c;
  const fitA = onAttr ? probe.fits[f].aAlt : probe.fits[f].cAlt;
  const colW = onAttr ? cP.attrAt.w : cP.condAt.w;
  const barsN = 2;
  const tw = fitB ? fitB.width : colW * 0.8;
  const th0 = fitB ? fitB.height : s * 1.2 * barsN - s * 0.2;
  const pad = s * 0.34;
  const slipW = tw + 2 * pad, slipH = th0 + 1.6 * pad;
  // the changed-datum tag under the full-size context (the slip ends inside it)
  const ts = Math.max(26, s * 0.8);
  const k3 = clamp(fitB && show ? (ts * 1.15) / fitB.size : 0.9, 0.55, 1.3);
  const tp = ts * 0.55;
  const headTxt = `${p.contextLabels.marker || t.markerDefault} — ${t.before}:`;
  const head1 = showAll ? ctx.fit(headTxt, {maxWidth: D.w - 2 * M - 2 * tp, size: ts, minSize: 18, maxLines: 1, weight: 700}) : null;
  // a long tag heading takes two lines rather than making the tag (and pushing the notes) very wide
  const head = head1 && head1.width > CW * 0.42 ? ctx.fit(headTxt, {maxWidth: Math.max(CW * 0.42, slipW * k3), size: ts, minSize: 18, maxLines: 2, weight: 700}) : head1;
  const headH = head ? head.height + ts * 0.3 : ts * 0.9;
  const tagW = Math.max(head ? head.width : 0, slipW * k3) + 2 * tp;
  const tagH = tp + headH + slipH * k3 + tp;
  const tagGap = s * 1.3;
  // notes beside the tag, under the context: the key (what a bolt stop means, no conclusion), the supplied issues (with
  // their row) and assumptions. They are part of the full views (build and hold), not of the inspection.
  const legX0 = onAttr ? x0 - LANE * 0.62 : x0 + CW + LANE * 0.62;
  const tagX0 = clamp(onAttr ? legX0 - 30 : legX0 + 30 - tagW, 10, D.w - 10 - tagW);
  const nGap = s * 0.8;
  // tall boxes: the notes go under the tag across the assembly's width; otherwise beside the tag
  const below = !!S.notesBelow;
  const notesX0 = below ? x0 : onAttr ? tagX0 + tagW + nGap : x0;
  const notesX1 = below ? x0 + CW : onAttr ? x0 + CW : tagX0 - nGap;
  const notesW = Math.max(0, notesX1 - notesX0);
  const nsz = Math.max(24, 22.5 * unitsPer1080px(ctx), s * 0.6); // ≥ ~22 px at 1080p (the full views are scaled ≥ 1)
  const noteTexts = !showAll ? [] : [
    ...p.issues.map(q => ({kind: 'issue', text: `${t.issue} (${t.rowWord} ${q.attribute + 1}): ${q.text}`})),
    ...p.assumptions.map(a => ({kind: 'assumed', text: `${t.assumed}: ${a}`})),
    {kind: 'key', text: `${t.boltKey} · ${t.noConclusion}`},
  ];
  const noteChips = noteTexts.map(nt => ({...nt, box: chip(ctx, nt.text, {x: 0, y: 0, maxWidth: notesW, size: nsz, maxLines: 3}).box, fit: ctx.fit(nt.text, {maxWidth: notesW - nsz * 1.2, size: nsz, minSize: nsz * 0.75, maxLines: 3, weight: 600})}));
  const notesH = noteChips.reduce((a, c) => a + c.box.h + 8, 0);
  const notesOk = notesW >= 200 && noteChips.every(c => !c.fit.truncated);
  // full view: context + tag stacked, centred in the room under the caption
  const stackH = probe.card.h + tagGap + (below ? tagH + (notesH ? 12 + notesH : 0) : Math.max(tagH, notesH));
  const room = D.h - M - (M + capH);
  const top0 = M + capH + Math.max(0, (room - stackH) / 2);
  const geo = geoAt(top0);
  const c = geo.cells[f];
  // thumbnail view (during the inspection): the context shrinks about its top centre; the lens band opens under it.
  // The thumbnail is as large as it can be without reducing the lens zoom, and the whole inspection (thumbnail + lens +
  // slip band) is centred in the room under the caption, so the isolate/substitute beats use the frame's height.
  const gapL = s * 1.1, gapS = s * 0.45;
  const maxDW = D.w - 2 * M - BAR_HANDLE;
  const inspectAt = (kt, shift) => {
    const Tt = {x: (D.w / 2) * (1 - kt), y: M + capH + shift - kt * top0, k: kt};
    // lens source: the focus side of the row — attribute text + bolt + socket mouth (or socket + condition text) — local, then in the thumbnail
    const srcL = onAttr
      ? {x: geo.card.x + 3, y: c.cardRow.y + 3, w: geo.plate.x + Dd + s * 0.55 - geo.card.x - 3, h: geo.P - 6}
      : {x: geo.card.x + geo.card.w - s * 0.55, y: c.cardRow.y + 3, w: geo.plate.x + geo.plate.w - 3 - (geo.card.x + geo.card.w - s * 0.55), h: geo.P - 6};
    const s0 = tmap(Tt, srcL);
    const src = {x: s0.x, y: s0.y, w: srcL.w * kt, h: srcL.h * kt};
    const thumbBottom = tmap(Tt, {x: 0, y: geo.card.y + geo.card.h}).y;
    const availH = D.h - M - (thumbBottom + gapL) - gapS;
    const z = Math.max(1, Math.min(p.detailGeometry.zoom, maxDW / src.w, availH / (src.h + slipH * kt * K_OUT)));
    const bandH = src.h * z + gapS + slipH * kt * z * K_OUT;
    const destY = thumbBottom + gapL;
    return {kt, Tt, srcL, src, thumbBottom, z, bandH, destY, free: D.h - M - (destY + bandH)};
  };
  let I = inspectAt(S.thumb, 0);
  for (let kt = S.thumbMax ?? S.thumb; kt > S.thumb + 1e-6; kt -= 0.02) {
    const J = inspectAt(kt, 0);
    if (J.z >= I.z - 1e-6 && J.free >= 0) { I = J; break; }
  }
  I = inspectAt(I.kt, Math.max(0, I.free / 2));
  const {kt, Tt, srcL, src, z} = I;
  const destY = I.destY;
  // the magnifier's handle points away from the rest of the row (left of an attribute, right of a condition), so it never lies on row text
  const dest = onAttr
    ? {x: clamp((D.w - src.w * z + BAR_HANDLE) / 2, M + BAR_HANDLE, D.w - M - src.w * z), y: destY, w: src.w * z, h: src.h * z}
    : {x: clamp((D.w - src.w * z - BAR_HANDLE) / 2, M, D.w - M - BAR_HANDLE - src.w * z), y: destY, w: src.w * z, h: src.h * z};
  return {
    s, f, onAttr, rows, beforeText, afterText, statusBefore, statusAfter, geo, srcL, src, dest, z, kt, Tt, capSize, capH,
    fitB, fitA, tx: onAttr ? c.attrAt.x : c.condAt.x, ty: c.cy - th0 / 2, colW, barsN, pad, slipW, slipH, gapS,
    tag: {ts, k3, tp, head, headH, w: tagW, h: tagH, gap: tagGap},
    notes: {x0: notesX0, w: notesW, size: nsz, items: noteChips, h: notesH, below},
    truncated,
    fits: z >= Math.min(1.5, p.detailGeometry.zoom) - 1e-6 && stackH <= room + 0.5 && (!truncated || s < 18) && (notesOk || s < 18),
  };
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const geo = L.geo;
  const col = hrColors(ctx);
  const f = L.f;
  const s = L.s;
  const c = geo.cells[f];
  const show = ctx.show('key');
  const rw = L.rows[f];
  const travelOf = st => geo.travel[st] ?? 0;
  L.tBefore = travelOf(L.statusBefore);
  L.tAfter = travelOf(L.statusAfter);
  // --- the replaced text (before) and its replacement (after), as text or as placeholder bars
  const tyA = L.fitA ? c.cy - L.fitA.height / 2 : L.ty;
  const beforeNode = (name, opacity) => (show && L.fitB
    ? textBlock(L.fitB, {x: L.tx, y: L.ty, fill: th.ink, name, opacity})
    : barLines(L.tx, L.ty, L.colW * 0.8, L.barsN, s, th.paperLine, name, opacity));
  const afterNode = (name, opacity) => (show && L.fitA
    ? textBlock(L.fitA, {x: L.tx, y: tyA, fill: th.ink, name, opacity})
    : barLines(L.tx, L.ty + s * 0.3, L.colW * 0.55, 1, s, shade(col.fact, 0.25), name, opacity));

  // --- context (local coordinates; the whole group is scaled into the thumbnail and back)
  L.plate = plateArt(ctx, geo, {prefix: 'plt', skipText: L.onAttr ? undefined : f});
  L.card = cardArt(ctx, geo, {prefix: 'crd', skipText: L.onAttr ? f : undefined, tab: false});
  L.bolts = L.rows.map((row, i) => (row.attr && i !== f ? boltArt(ctx, geo, i, {name: `bolt${i}`, status: row.status}) : null));
  const hasBolt = !!rw.attr;
  L.boltF = hasBolt ? [boltArt(ctx, geo, f, {name: 'boltF', status: L.statusBefore}), boltArt(ctx, geo, f, {name: 'boltFb', status: L.statusAfter})] : null;
  const markers = pfx => g({transform: T(c.sock.x, c.sock.y, geo.angle)},
    h('path', {name: `${pfx}-rim`, d: socketPath(rw.profile, geo.BW, geo.D), fill: 'none', stroke: col.bolt, 'stroke-width': 4.5, 'stroke-linejoin': 'round', opacity: 0}),
    h('path', {name: `${pfx}-ghost`, d: boltPath(rw.profile, geo.BW, geo.G + geo.D - 4), transform: T(geo.D, 0), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-dasharray': '6 6', opacity: 0}),
    g({transform: T(-geo.G * 0.24, 0, -geo.angle)}, doubtDisc(ctx, geo, {name: `${pfx}-doubt`, opacity: 0})));
  L.ctxText = g(null, beforeNode('c-before', 1), afterNode('c-after', 0));
  L.ctxMarkers = markers('c');

  // --- lens copy: the same local coordinates under the thumbnail transform (text-free except the replaced text)
  const copyPlate = plateArt(ctx, geo, {prefix: 'zp', named: false, textless: true, skipText: L.onAttr ? undefined : f});
  const copyCard = cardArt(ctx, geo, {prefix: 'zc', named: false, textless: true, skipText: L.onAttr ? f : undefined, tab: false});
  const copyOtherBolts = L.rows.map((row, i) => (row.attr && i !== f ? boltArt(ctx, geo, i, {name: `zb${i}`, status: row.status, named: false, t: travelOf(row.status)}).node : null));
  L.zBolt = hasBolt ? [boltArt(ctx, geo, f, {name: 'zboltF', status: L.statusBefore}), boltArt(ctx, geo, f, {name: 'zboltFb', status: L.statusAfter})] : null;
  const copy = g({transform: tstr(L.Tt)}, copyPlate.base, copyOtherBolts, L.zBolt && L.zBolt.map(b => b.node), copyCard, copyPlate.top, markers('z'), beforeNode('z-before', 1), afterNode('z-after', 0));
  const b0 = tmap(L.Tt, {x: geo.card.x - 14, y: geo.card.y - 14});
  const ctxBox = {x: b0.x, y: b0.y, w: (geo.plate.x + geo.plate.w - geo.card.x + 28) * L.kt, h: (geo.card.h + 28) * L.kt};
  L.lens = lens(ctx, {name: 'lz', source: L.src, dest: L.dest, content: copy, frame: ctxBox, radius: 16, color: th.accent2});
  L.bar = barMagnifierArt(ctx, 'bar');

  // --- the old value as a paper slip (drawn in local text coordinates, placed per frame)
  const strikes = [];
  if (show && L.fitB) {
    L.fitB.lines.forEach((line, k) => {
      const lw = ctx.measure(line, L.fitB.size, L.fitB.weight, L.fitB.family);
      strikes.push({x1: L.tx - 4, y: L.ty + k * L.fitB.lineHeight + L.fitB.size * 0.52, w: lw + 8});
    });
  } else {
    for (let k = 0; k < L.barsN; k++) strikes.push({x1: L.tx - 4, y: L.ty + k * s * 1.2 + s * 0.43, w: (k === L.barsN - 1 ? L.colW * 0.8 * 0.55 : L.colW * 0.8) + 8});
  }
  L.strikes = strikes;
  const sl = {x: L.tx - L.pad, y: L.ty - L.pad * 0.8, w: L.slipW, h: L.slipH};
  L.slipNode = g({name: 'slip', opacity: 0},
    h('path', {name: 'slip-shadow', d: roundRectPath(sl.x + 4, sl.y + 6, sl.w, sl.h, 8), fill: th.shadow, opacity: 0}),
    h('path', {name: 'slip-paper', d: roundRectPath(sl.x, sl.y, sl.w, sl.h, 8), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '6 4', opacity: 0}),
    show && L.fitB ? textBlock(L.fitB, {x: L.tx, y: L.ty, fill: th.ink, name: 'slip-text'}) : barLines(L.tx, L.ty, L.colW * 0.8, L.barsN, s, th.paperLine, 'slip-text', 1),
    strikes.map((st, k) => h('line', {name: `slip-strike${k}`, x1: r(st.x1), y1: r(st.y), x2: r(st.x1), y2: r(st.y), stroke: th.accent, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0})));

  // slip poses (world {x, y} of the text's top-left + scale): in the lens, below it, and (local) in the tag
  const z = L.z, kt = L.kt;
  const q = tmap(L.Tt, {x: L.tx, y: L.ty});
  const inPose = {x: L.dest.x + (q.x - L.src.x) * z, y: L.dest.y + (q.y - L.src.y) * z, k: kt * z};
  const kOut = kt * z * K_OUT;
  const outX = clamp(inPose.x, M + L.pad * kOut, D.w - M - (sl.w - L.pad) * kOut);
  const outPose = {x: outX, y: L.dest.y + L.dest.h + L.gapS + L.pad * 0.8 * kOut, k: kOut};
  // the tag (local, under the full-size context), the pin on the row's outer edge and the leader
  const T3 = L.tag;
  const pin = L.onAttr ? {x: geo.card.x - 2, y: c.cy} : {x: geo.plate.x + geo.plate.w + 2, y: c.cy};
  const legX = L.onAttr ? geo.card.x - LANE * 0.62 : geo.plate.x + geo.plate.w + LANE * 0.62;
  const tagY = geo.card.y + geo.card.h + T3.gap;
  const tagX = clamp(L.onAttr ? legX - 30 : legX + 30 - T3.w, 10, D.w - 10 - T3.w);
  L.tagBox = {x: tagX, y: tagY, w: T3.w, h: T3.h};
  const tagPoseL = {x: tagX + T3.tp + L.pad * T3.k3, y: tagY + T3.tp + T3.headH + L.pad * 0.8 * T3.k3, k: T3.k3};
  L.poses = {inPose, outPose, tagPoseL};
  // the leader grows OUT OF the tag (tag → lane → pin), so the tag is never shown without it; it reaches the row once
  // the magnifier (whose handle lies beside the row) has been removed
  const lead = [{x: legX, y: tagY}, {x: legX, y: pin.y}, pin];
  L.leadLen = Math.abs(legX - pin.x) + Math.abs(tagY - pin.y);
  L.pin = pin;
  const flagDir = L.onAttr ? -1 : 1;
  L.pinNode = g({name: 'pin', opacity: 0},
    h('path', {name: 'pin-lead', d: lead.map((pt, i) => `${i ? 'L' : 'M'}${r(pt.x)} ${r(pt.y)}`).join(''), fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': `${r(L.leadLen)} ${r(L.leadLen + 6)}`, 'stroke-dashoffset': r(L.leadLen), 'stroke-linejoin': 'round'}),
    g({name: 'pin-head', transform: T(pin.x, pin.y)},
      h('line', {x1: 0, y1: 0, x2: 0, y2: r(-s * 1.35), stroke: th.ink, 'stroke-width': 3.4, 'stroke-linecap': 'round'}),
      h('path', {d: `M0 ${r(-s * 1.35)}L${r(flagDir * s * 1.15)} ${r(-s * 1.05)}L0 ${r(-s * 0.75)}Z`, fill: th.accent, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('circle', {cx: 0, cy: 0, r: 8, fill: th.accent, stroke: th.ink, 'stroke-width': 2.2})));
  // notes under the context beside the tag (issues, assumptions, key) — full views only
  {
    const NT = L.notes;
    let ny = NT.below ? tagY + T3.h + 12 : tagY;
    const strokeOf = k => (k === 'issue' ? col.disputed : k === 'key' ? th.ink : th.inkFaint);
    const parts = NT.items.map((it, i) => {
      const c = chip(ctx, it.text, {x: NT.x0, y: ny, maxWidth: NT.w, size: NT.size, maxLines: 3, name: `note${i}`, fill: th.card, stroke: strokeOf(it.kind), weight: it.kind === 'key' ? 700 : 600});
      ny += c.box.h + 8;
      return c.node;
    });
    L.notesBottom = ny;
    L.notesNode = parts.length ? g({name: 'notes', opacity: 0}, parts) : null;
  }
  L.tagNode = g({name: 'tag', opacity: 0},
    h('path', {d: roundRectPath(tagX + 5, tagY + 7, T3.w, T3.h, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(tagX, tagY, T3.w, T3.h, 12), fill: th.card, stroke: th.accent, 'stroke-width': 2.6}),
    T3.head
      ? textBlock(T3.head, {x: tagX + T3.tp, y: tagY + T3.tp, fill: shade(th.accent, -0.25)})
      : h('rect', {x: r(tagX + T3.tp), y: r(tagY + T3.tp + 4), width: r(Math.min(T3.w - 2 * T3.tp, T3.ts * 5)), height: r(T3.ts * 0.5), rx: r(T3.ts * 0.25), fill: th.accentSoft}));

  // --- full views: the context is enlarged to use the room under the caption. At the start (build) it has no tag yet,
  // so it is sized and centred on its own (Tf0); at the end it returns with its pin, leader and tag (Tf). The thumbnail keeps Tt.
  {
    const top = M + L.capH, bw = D.w - 2 * M, bh = D.h - M - top;
    const fitBox = (x0, x1, y0, y1, kMax) => {
      const kF = clamp(Math.min(bw / (x1 - x0), bh / (y1 - y0)), 1, kMax);
      return {x: M + (bw - kF * (x1 - x0)) / 2 - kF * x0, y: top + (bh - kF * (y1 - y0)) / 2 - kF * y0, k: kF};
    };
    const x0 = Math.min(geo.card.x - 10, pin.x - (L.onAttr ? s * 1.4 : 0), legX - 6, tagX);
    const x1 = Math.max(geo.plate.x + geo.plate.w + 10, pin.x + (L.onAttr ? 0 : s * 1.4), legX + 6, tagX + T3.w);
    L.Tf = fitBox(x0, x1, geo.card.y - 16, Math.max(tagY + T3.h, L.notesBottom) + 10, 1.45);
    L.Tf0 = fitBox(geo.card.x - 16, geo.plate.x + geo.plate.w + 16, geo.card.y - 16, (L.notesNode ? L.notesBottom : geo.card.y + geo.card.h) + 16, 1.6);
  }

  // --- context caption (fixed, above the context in both views)
  L.caption = null;
  if (ctx.show('all')) {
    const txt = p.contextLabels.context || t.contextDefault;
    const ft = ctx.fit(txt, {maxWidth: D.w - 2 * M, size: L.capSize, minSize: 18, maxLines: 1, weight: 600});
    L.caption = g({name: 'caption', opacity: 0}, textBlock(ft, {x: M, y: M + (L.capH - ft.height) / 2 - 4, fill: th.fgSoft}));
  }
  return L;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1400]},
  layout(ctx) {
    let s = SHAPES[ctx.view.shape].size;
    let L = compose(ctx, s);
    for (let it = 0; it < 24 && !L.fits; it++) {
      s *= 0.95;
      L = compose(ctx, s);
    }
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    return g(null,
      L.caption,
      g({name: 'ctx'},
        L.plate.base,
        g({name: 'bolts'}, L.bolts.map(b => b && b.node), L.boltF && L.boltF.map(b => b.node)),
        L.card,
        L.ctxText,
        L.plate.top,
        L.ctxMarkers,
        L.pinNode,
        L.notesNode,
        L.tagNode),
      L.lens.node,
      L.bar,
      L.slipNode,
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const geo = L.geo;
    const nodes = {};
    const f = L.f;
    // --- the context view: full size → thumbnail while inspecting → full size again
    const shrink = ease.inOutCubic(seg(u, ...W.shrink));
    const grow = ease.inOutCubic(seg(u, ...W.grow));
    const kc = shrink * (1 - grow);
    const TF = grow > 0 ? L.Tf : L.Tf0; // build: the bare context, centred; return: the context with its tag
    const Tc = {x: lerp(TF.x, L.Tt.x, kc), y: lerp(TF.y, L.Tt.y, kc), k: lerp(TF.k, L.Tt.k, kc)};
    nodes.ctx = {transform: tstr(Tc)};
    // --- build: bolts run to the stops of their supplied statuses (focus row: status BEFORE)
    const n = L.rows.length;
    const each = (W.bolts[1] - W.bolts[0]) / (n * 0.6 + 0.4);
    const travel = [];
    L.rows.forEach((rw, i) => {
      const k = seg(u, W.bolts[0] + i * each * 0.6, W.bolts[0] + i * each * 0.6 + each);
      const st = i === f ? L.statusBefore : rw.status;
      const target = rw.attr ? (geo.travel[st] ?? 0) : 0;
      let tr = st === 'as-supplied' ? target * (reduced ? ease.outCubic(k) : ease.outBack(k)) : target * ease.outCubic(k);
      tr = Math.min(tr, geo.travel.seated + 3);
      travel.push(r(tr, 2));
      if (L.bolts[i]) nodes[`bolt${i}`] = {transform: L.bolts[i].transform(tr)};
      if (i !== f && rw.cond !== null) nodes[`plt-rim${i}`] = {opacity: st === 'as-supplied' && k >= 1 ? 1 : 0};
      if (i !== f && st === 'disputed' && rw.attr) nodes[`plt-doubt${i}`] = {opacity: r(seg(k, 0.72, 0.95), 3)};
      if (i !== f && st === 'pending' && rw.attr) nodes[`plt-ghost${i}`] = {opacity: r(0.9 * seg(k, 0, 0.6), 3)};
    });
    // --- substitution consequence: the focus bolt moves from its before-stop to its after-stop (both supplied)
    const mv = seg(u, ...W.travel);
    const mvE = L.statusAfter === 'as-supplied' ? (reduced ? ease.outCubic(mv) : ease.outBack(mv)) : ease.inOutCubic(mv);
    const tF = mv > 0 ? lerp(L.tBefore, L.tAfter, mvE) : travel[f];
    const tFc = Math.max(0, Math.min(tF, geo.travel.seated + 3));
    // the bolt takes the after-status look the moment it starts to move (a clean swap: no half-transparent blend of the
    // hatched amber and the solid blue looks)
    const look = mv > 0 ? 1 : 0;
    if (L.boltF) {
      nodes.boltF = {transform: L.boltF[0].transform(tFc), opacity: r(1 - look, 3)};
      nodes.boltFb = {transform: L.boltF[1].transform(tFc), opacity: r(look, 3)};
      nodes.zboltF = {transform: L.zBolt[0].transform(tFc), opacity: r(1 - look, 3)};
      nodes.zboltFb = {transform: L.zBolt[1].transform(tFc), opacity: r(look, 3)};
    }
    const kB = seg(u, W.bolts[0] + f * each * 0.6, W.bolts[0] + f * each * 0.6 + each);
    const stAt = mv >= 1 ? L.statusAfter : L.statusBefore;
    const settled = mv >= 1 || (mv === 0 && kB >= 1);
    const beforeMarks = mv === 0 ? 1 : clamp(1 - mv * 3);
    for (const pfx of ['c', 'z']) {
      nodes[`${pfx}-rim`] = {opacity: settled && stAt === 'as-supplied' && L.rows[f].attr ? 1 : 0};
      nodes[`${pfx}-doubt`] = {opacity: r(L.statusBefore === 'disputed' ? seg(kB, 0.72, 0.95) * beforeMarks : 0, 3) + (L.statusAfter === 'disputed' && mv >= 1 ? 1 : 0)};
      nodes[`${pfx}-ghost`] = {opacity: r(0.9 * ((L.statusBefore === 'pending' ? seg(kB, 0, 0.6) * beforeMarks : 0) + (L.statusAfter === 'pending' ? seg(mv, 0.5, 1) : 0)), 3)};
    }
    // --- texts: the context swaps cleanly (old out, then new in); in the lens the old value leaves as a slip
    const detached = u >= W.detach[0];
    const ctxOut = seg(u, ...W.ctxOut);
    const newIn = ease.inOutSine(seg(u, ...W.newIn));
    nodes['c-before'] = {opacity: r(1 - ctxOut, 3)};
    nodes['c-after'] = {opacity: r(newIn, 3)};
    nodes['z-before'] = {opacity: detached ? 0 : 1};
    nodes['z-after'] = {opacity: r(newIn, 3)};

    // --- lens: laid on the row (scale 1), lifted to its destination, set back, removed
    const settle = seg(u, ...W.settle);
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const pOpen = open * (1 - close);
    const dim = seg(u, ...W.dim) * (1 - seg(u, ...W.undim));
    const lf = L.lens.frame(pOpen, dim);
    const away = seg(u, ...W.away);
    const vis = u < W.settle[0] ? 0 : settle * (1 - away);
    lf['lz-win'] = {opacity: r(vis, 3)};
    lf['lz-src'] = {opacity: pOpen > 0.01 && vis > 0 ? 1 : 0};
    lf['lz-coneA'].opacity = lf['lz-coneA'].opacity && vis > 0 ? r(vis, 3) : 0;
    lf['lz-coneB'].opacity = lf['lz-coneB'].opacity && vis > 0 ? r(vis, 3) : 0;
    Object.assign(nodes, lf);
    const S = L.src, Dd = L.dest;
    const R = {x: lerp(S.x, Dd.x, pOpen), y: lerp(S.y, Dd.y, pOpen), w: lerp(S.w, Dd.w, pOpen), h: lerp(S.h, Dd.h, pOpen)};
    // while the opaque lens is lifting off / settling back onto its own row, the row's text in the context would peek out
    // beside the copy in the lens (the same words twice): the context's copy of that text waits until the lens is either
    // exactly on the row (identical copy) or clear of it
    const lensOverRow = vis > 0 && pOpen > 0.001 && R.x < S.x + S.w && S.x < R.x + R.w && R.y < S.y + S.h && S.y < R.y + R.h;
    const overRow = lensOverRow;
    if (overRow) { nodes['c-before'].opacity = 0; nodes['c-after'].opacity = 0; }
    Object.assign(nodes, barMagnifierFrame('bar', R, vis, L.onAttr ? 'left' : 'right'));

    // --- the slip: picked up in the lens, pulled down out of it, struck, then carried into the tag
    const det = ease.outCubic(seg(u, ...W.detach));
    const drop = ease.inOutCubic(seg(u, ...W.drop));
    const toTag = ease.inOutCubic(seg(u, ...W.toTag));
    const strike = ease.inOutSine(seg(u, ...W.strike));
    const {inPose, outPose, tagPoseL} = L.poses;
    const tagW = {...tmap(Tc, tagPoseL), k: Tc.k * tagPoseL.k}; // the tag rides the context transform
    let pose;
    if (toTag > 0) pose = {x: lerp(outPose.x, tagW.x, toTag), y: lerp(outPose.y, tagW.y, toTag), k: lerp(outPose.k, tagW.k, toTag)};
    else pose = {x: lerp(inPose.x, outPose.x, drop), y: lerp(inPose.y, outPose.y, drop), k: lerp(inPose.k, outPose.k, drop) * (1 + 0.04 * det * (1 - drop))};
    nodes.slip = {opacity: detached ? 1 : 0, transform: `translate(${r(pose.x)} ${r(pose.y)}) scale(${r(pose.k, 4)}) translate(${r(-L.tx)} ${r(-L.ty)})`};
    nodes['slip-paper'] = {opacity: r(det, 3)};
    nodes['slip-shadow'] = {opacity: r(det * (1 - toTag), 3)};
    L.strikes.forEach((st, k) => { nodes[`slip-strike${k}`] = {x2: r(st.x1 + st.w * strike), opacity: strike > 0 ? 1 : 0}; });

    // --- changed-datum marker: pin on the row, leader, tag around the slip
    const pinP = ease.outCubic(seg(u, ...W.pin));
    // the group (leader + pin head) shows as soon as the leader starts growing out of the tag; the head pops in at the row
    nodes.pin = {opacity: seg(u, ...W.lead) > 0 || pinP > 0 ? 1 : 0};
    nodes['pin-head'] = {transform: `${T(L.pin.x, L.pin.y)} scale(${r(pinP > 0 ? 0.4 + 0.6 * pinP : 0, 3)})`};
    nodes['pin-lead'] = {'stroke-dashoffset': r(L.leadLen * (1 - seg(u, ...W.lead)))};
    nodes.tag = {opacity: r(seg(u, ...W.tag), 3)};
    if (L.caption) nodes.caption = {opacity: r(seg(u, ...W.caption), 3)};
    // notes: in the full views only (build, then the hold) — they would sit under the lens band in the thumbnail
    const notesOp = seg(u, ...W.notesIn) * (1 - seg(u, ...W.notesOut)) + seg(u, ...W.notesBack);
    if (L.notesNode) nodes.notes = {opacity: r(notesOp, 3)};

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const datum = newIn > 0 ? (newIn >= 1 ? 'after' : 'switching') : ctxOut > 0 ? 'switching' : 'before';
    const tipF = tmap(Tc, L.boltF ? L.boltF[0].tipAt(tFc) : geo.cells[f].port);
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      textSize: r(L.s, 2),
      focusRow: f,
      focusTarget: L.onAttr ? 'attribute' : 'condition',
      contextScale: r(Tc.k, 4),
      contextThumb: kc >= 1,
      contextFull: kc === 0,
      datum,
      datumValue: datum === 'after' ? L.afterText : datum === 'before' ? L.beforeText : null,
      // where the old value can be read: in the row until it is picked up, then on the slip, finally in the tag
      oldValueShownIn: detached ? (toTag >= 1 ? 'tag' : 'slip') : ctxOut < 1 ? 'row' : 'none',
      slipVisible: detached,
      slipStruck: strike >= 1,
      slipInTag: toTag >= 1,
      slip: P2(pose),
      slipHome: P2(inPose), // where the old text sits inside the open lens
      tagSlot: P2(tagW), // where the slip rests inside the changed-datum tag (rides the context)
      slipScale: r(pose.k, 3),
      statusBefore: L.statusBefore,
      statusAfter: L.statusAfter,
      focusStatus: mv >= 1 ? L.statusAfter : L.statusBefore,
      focusTravel: r(tFc, 2),
      travelBefore: r(L.tBefore, 2),
      travelAfter: r(L.tAfter, 2),
      otherTravel: travel.map((v, i) => (i === f ? null : v)),
      lensOpen: r(pOpen, 3),
      lensOverRow,
      rowTextHiddenUnderLens: overRow && (nodes['c-after'].opacity === 0 && nodes['c-before'].opacity === 0),
      tagOpacity: r(seg(u, ...W.tag), 3),
      leaderDrawn: r(seg(u, ...W.lead), 3) * (seg(u, ...W.lead) > 0 || pinP > 0 ? 1 : 0),
      focusLook: L.boltF ? (look ? L.statusAfter : L.statusBefore) : null,
      lensVisible: vis > 0.01,
      lensScale: r(R.w / S.w, 4),
      lensRect: {x: r(R.x), y: r(R.y), w: r(R.w), h: r(R.h)},
      sourceRect: {x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)},
      // the source rectangle is the focus row's own place in the (thumbnail) context
      sourceOnRow: (() => { const q = tmap(Tc, {x: L.srcL.x, y: L.srcL.y}); return Math.abs(q.x - S.x) < 0.5 && Math.abs(q.y - S.y) < 0.5 && Math.abs(L.srcL.w * Tc.k - S.w) < 0.5; })(),
      lensAtSource: Math.abs(R.x - S.x) < 0.5 && Math.abs(R.y - S.y) < 0.5 && Math.abs(R.w - S.w) < 0.5,
      lens: P2({x: R.x + R.w / 2, y: R.y + R.h / 2}),
      dim: r(dim, 3),
      zoom: r(L.z, 3),
      pinVisible: pinP >= 1,
      markerVisible: seg(u, ...W.tag) >= 1,
      notesVisible: !!L.notesNode && notesOp >= 1,
      notes: L.notes.items.map(it => it.text),
      tipF: P2(tipF),
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
    slug: 'reasoning-01-inspect',
    title: 'Fact and rule — a reading magnifier lifts one row out and a datum is replaced',
    titleEs: 'Hecho y regla — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho y regla',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the fact card docked on the rule plate with each latch bolt at its supplied stop. A rectangular reading magnifier is laid on one row (a real copy at the same coordinates) and lifted out enlarged. The old value is pulled out of the lens as a paper slip and struck through (kept in view), the supplied new value takes its place, and only that row’s bolt then moves to the stop of the status supplied for after. The lens is set back, and the struck slip becomes a changed-datum tag pinned to the row. Nothing is inferred about validity or outcome.',
    tags: ['reasoning', 'fact', 'rule', 'attribute', 'inspect', 'magnifier', 'substitution', 'before-after', 'connector', 'disputed'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-y-regla.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
