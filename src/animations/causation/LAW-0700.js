/**
 * LAW-0700 — Daño material · inspect
 *
 * Storyboard (the state the action produced; one real lens; one datum changes):
 *  0.00–0.20 build       The context: the altered object on its display table
 *                        (default: a vase with a crack down the side) and, on a
 *                        string from its neck, a state tag with the supplied
 *                        value ("Crack down the side (as supplied)"). Beside it
 *                        the incident record with the supplied entries; a
 *                        caption names the view.
 *  0.20–0.45 isolate     The record, caption and notes step out (0.20–0.215).
 *                        The tag's value in the scene fades out (0.212–0.222):
 *                        while the lens holds the datum the scene's tag is a
 *                        blank card. At 0.2225 an opaque lens appears EXACTLY
 *                        over its source (a real copy of the tag, the lip and
 *                        the upper body, drawn in the same coordinates) and
 *                        grows into the room the record left (0.2225–0.31) to
 *                        ≥ 1.5× the rest size; two guides stay anchored to the
 *                        source frame and the lens. Nothing is ever blank.
 *  0.45–0.75 substitute  The old value is struck (0.45–0.49), lifts away
 *                        (0.52–0.555) and the alternative value fades in
 *                        (0.56–0.595); only the dependent geometry changes with
 *                        it (default: the chip breaks from the lip and lies on
 *                        the table; panel: scratches draw in). The new value is
 *                        still from 0.595 to 0.76.
 *  0.75–1.00 return      The lens shrinks back onto its source (0.76–0.80); only
 *                        then does the scene's tag show its value again
 *                        (0.80–0.815), then the record, caption and notes come
 *                        back (0.815–0.85), a neutral Δ marker and its label
 *                        mark the changed tag, and "● Before: <old>" (struck) /
 *                        "◆ After: <new>" keep the old value traceable, with the
 *                        key "As supplied · no conclusion drawn". Nothing is
 *                        valued; no validity, liability or outcome is inferred.
 *                        Seeking back restores the old datum exactly.
 * Wide boxes (timings above): the object on its counter with the record, a
 * band under it; for the lens the context slides right along its floor (no
 * scaling) and the lens opens on its left. Tall and square boxes (W_STACK):
 * the object as large as the box allows over the record and band; for the lens
 * the record and band step out, the context steps back (shrinks toward its top
 * centre, never under 0.45 of the frame width, its tag value gone before it
 * shrinks) and the lens grows fast below it (0.2225–0.27); on the return the
 * lens closes onto its source while the context regrows (0.765–0.80), and only
 * then do the tag value, record and band come back (0.80–0.82). No transition
 * leaves half the frame blank for more than ~200 ms. Magnification is against
 * the context at rest.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0700
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields, obj, int, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  dmFields, DM_STRINGS, resolveDM, eventText, linkNotes, objectArt, objectGeom, tableArt, floorArt, OBJ_W,
  iconChip, flowRows, recordMeasure, recordBuild, fitG, CHIP_REST_ROT, CHIP_REST_DY, clamp, ease, lerp, r, seg,
} from './kits/dano-material.js';

const ID = 'LAW-0700';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_SIDE = {
  ctxIn: [0, 0.05], textIn: [0.02, 0.1],
  textOut: [0.195, 0.21], shift: [0.195, 0.222], tagOut: [0.212, 0.222], open: [0.2225, 0.31], guides: [0.3, 0.34],
  strike: [0.45, 0.49], oldOut: [0.52, 0.555], geo: [0.52, 0.58], newIn: [0.56, 0.595],
  close: [0.76, 0.8], tagIn: [0.8, 0.815], shiftBack: [0.8, 0.83], textBack: [0.83, 0.86], marker: [0.84, 0.87], trace: [0.85, 0.89], key: [0.86, 0.9],
};
// tall/square boxes (the context steps back — shrinks toward its top centre — instead of sliding): the scene tag's
// value leaves before the context is small enough to shrink it under 16 px, the lens grows fast (ease-out) so no more
// than ~200 ms pass with half the frame blank, and on the return the context regrows before any text comes back
const W_STACK = {...W_SIDE,
  textOut: [0.21, 0.222], tagOut: [0.2, 0.208], shrink: [0.195, 0.222], open: [0.2225, 0.27],
  close: [0.765, 0.795], regrow: [0.78, 0.8], tagIn: [0.8, 0.81], textBack: [0.8, 0.82],
  marker: [0.82, 0.85], trace: [0.83, 0.87], key: [0.84, 0.88],
};
const TH = 0.42;
const TW = 1.3;
const TARGETS = ['object-tag'];

const strings = {
  en: {...DM_STRINGS.en, context: 'The object and its record, as supplied', marker: 'Changed datum', beforeV: 'Before', afterV: 'After'},
  es: {...DM_STRINGS.es, context: 'El objeto y su registro, según lo aportado', marker: 'Dato cambiado', beforeV: 'Antes', afterV: 'Después'},
};

const sceneSchema = {
  ...dmFields,
  ...inspectFields(TARGETS),
  markLevels: obj('Visible marks shown with each value (0 intact · 1 first mark · 2 both marks); only this geometry changes with the datum', {
    before: int('Marks shown with the before value', 0, 2),
    after: int('Marks shown with the after value', 0, 2),
  }),
};

const defaultParams = {
  events: [
    {label: 'Paint tin lands on the vase’s lip', time: 'Day 3'},
    {label: 'Assistant notes the vase’s state', time: 'Day 3'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Vase altered as shown on its tag'}],
  object: {kind: 'vase', before: 'Ceramic vase, no marks'},
  focusTarget: 'object-tag',
  beforeValue: 'Crack down the side (as supplied)',
  afterValue: 'Crack and chipped lip (as supplied)',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'The object and its record, as supplied', marker: 'Changed datum'},
  markLevels: {before: 1, after: 2},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['side']},
  // ('stackc' — the record on the counter beside the object — is kept in the code but not offered: it left a blank
  // middle band at rest; 'stack' fills the box)
  square: {size: 24, minSize: 17, arr: ['stack', 'side']},
  portrait: {size: 25, minSize: 17, arr: ['stack']},
};
/** Frame size in design units (the design space is fitted into the caption-safe box). */
function frameUnits(ctx) {
  const v = ctx.view, D = ctx.design;
  const s = Math.min(v.content.w / D.w, v.content.h / D.h);
  return {w: v.width / s, h: v.height / s, short: Math.min(v.width, v.height) / s};
}

/** The state tag: a card with a hole, the value text (before / after), measured at one width. */
function tagMeasure(ctx, p, size, w, textOn) {
  const pad = size * 0.6;
  const fb = textOn ? fitG(ctx, p.beforeValue, {maxWidth: w - 2 * pad, size, minSize: size, maxLines: 6, weight: 700}) : null;
  const fa = textOn ? fitG(ctx, p.afterValue, {maxWidth: w - 2 * pad, size, minSize: size, maxLines: 6, weight: 700}) : null;
  const textH = textOn ? Math.max(fb.height, fa.height) : size * 2;
  const hole = size * 0.9;
  return {w, pad, hole, fb, fa, h: hole + textH + pad * 1.6, bad: textOn && (fb.truncated || fb.broken || fa.truncated || fa.broken)};
}

/** Tag art at (x, y) (top-left); names prefixed with P. Value groups: P-vb (before), P-va (after), P-strike. */
function tagArt(ctx, m, x, y, P, textOn) {
  const th = ctx.theme;
  const {w, pad, hole} = m;
  const card = h('path', {d: `M${r(x + hole * 0.9)} ${r(y)}H${r(x + w)}V${r(y + m.h)}H${r(x)}V${r(y + hole * 0.9)}Z`, fill: '#fbf3dc', stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'});
  const ring = h('circle', {cx: r(x + w - hole * 0.7), cy: r(y + hole * 0.62), r: r(hole * 0.24), fill: th.paper, stroke: th.ink, 'stroke-width': 2});
  const ty = y + hole + pad * 0.4;
  let vb, va, strike = null;
  if (textOn) {
    vb = g({name: `${P}-vb`}, textBlock(m.fb, {x: x + pad, y: ty, fill: th.ink, name: `${P}-vbt`}));
    va = g({name: `${P}-va`, opacity: 0}, textBlock(m.fa, {x: x + pad, y: ty, fill: th.ink, name: `${P}-vat`}));
    const lines = m.fb.lines.map((ln, i) => ({x: x + pad, y: ty + i * m.fb.lineHeight + m.fb.size * 0.5, w: ctx.measure(ln.replace(/\u00a0/g, ' '), m.fb.size, m.fb.weight, m.fb.family)}));
    strike = g({name: `${P}-strike`, opacity: 0}, lines.map((ln, i) => h('path', {name: `${P}-st${i}`, d: `M${r(ln.x - 3)} ${r(ln.y)}H${r(ln.x + ln.w + 3)}`, stroke: th.accent, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(ln.w + 6)} ${r(ln.w + 20)}`, 'stroke-dashoffset': r(ln.w + 6)})));
    m.strikeLines = lines;
  } else {
    const bar = (ww, yy) => h('path', {d: `M${r(x + pad)} ${r(yy)}H${r(x + pad + ww)}`, stroke: th.inkSoft, 'stroke-width': r(m.hole * 0.3), 'stroke-linecap': 'round', opacity: 0.6});
    vb = g({name: `${P}-vb`}, bar((w - 2 * pad) * 0.8, ty + pad * 0.6), bar((w - 2 * pad) * 0.45, ty + pad * 1.6));
    va = g({name: `${P}-va`, opacity: 0}, bar((w - 2 * pad) * 0.6, ty + pad * 0.6), bar((w - 2 * pad) * 0.7, ty + pad * 1.6));
  }
  return {node: g({name: P}, card, ring, g({name: `${P}-vals`}, vb, va, strike)), hole: {x: x + w - hole * 0.7, y: y + hole * 0.62}, box: {x, y, w, h: m.h}};
}

/**
 * Zone geometry at object height OH (zone-local: x from the zone's left edge, y from the floor line, up negative).
 * [tag hanging on its string] [object on the counter] ([record standing on the counter] in wide boxes).
 */
function zoneGeom(kind, OH, tg, rec, RW, arr, minW) {
  const halfW = (kind === 'vase' ? 0.31 : 0.37) * OH;
  const G = objectGeom(kind, OH);
  let objX = tg.w + 12 + halfW;
  const objBaseY = -TH * OH;
  let tabX0 = objX - 0.55 * OH;
  let recX = null, recY = null, recTop = 0;
  let tabX1;
  if (arr === 'side' || arr === 'stackc') {
    recX = objX + halfW + 40;
    tabX1 = recX + RW + 30;
    recY = objBaseY - OH * 0.1 - (rec.h + 14); // the clipboard stands on a small easel on the counter
    recTop = recY - rec.clipH * 0.35;
  } else tabX1 = objX + 0.75 * OH;
  const left = Math.min(0, tabX0);
  // the counter reaches the context's minimum width when needed (a longer display counter)
  if (tabX1 - left < minW) tabX1 = left + minW;
  const shift = -left;
  objX += shift; tabX0 += shift; tabX1 += shift;
  if (recX !== null) recX += shift;
  const tagX = shift, tagY = objBaseY - OH * 0.97;
  const top = Math.min(objBaseY - OH * 1.04, tagY, arr === 'side' || arr === 'stackc' ? recTop : 0);
  return {G, halfW, objX, objBaseY, tabX0, tabX1, recX, recY, tagX, tagY, zW: tabX1 - 0 + 6, zH: -top + 16, top};
}

function compose(ctx, base, cfg) {
  const D = ctx.design;
  const p = ctx.params;
  const {size, RW, tagW, arr} = cfg;
  const textOn = ctx.show('key');
  const memo = base.memo;
  const full = D.w - 2 * MARGIN;
  const FU = frameUnits(ctx);
  const tg = tagMeasure(ctx, p, size, tagW, textOn);
  if (tg.bad) return {bad: 'tag'};
  const rk = `${size}|${RW}`;
  let rec = memo.rec.get(rk);
  if (!rec) { rec = recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, kind: base.kind, text: textOn, maxLines: 4}); memo.rec.set(rk, rec); }
  if (rec.bad) return {bad: 'record'};
  const recW = RW + 20, recH = rec.h + 14 + rec.clipH * 0.35;
  const minCtx = 0.45 * FU.w + 4;
  // band: side = a column left of the zone (the lens later opens there); stack = full width under the record
  const flowBand = w => {
    const bk = `${size}|${Math.round(w)}`;
    let b = memo.band.get(bk);
    if (!b) {
      const sz = textOn ? base.band.map(it => ({it, ...iconChip(ctx, it, {size, maxW: Math.min(w, 760), kind: base.kind, maxLines: 4})})) : [];
      const fl = flowRows(sz, {x: 0, y: 0, w, gap: 16, rowGap: 10});
      b = {sz, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad || q.w > w + 0.5)};
      memo.band.set(bk, b);
    }
    return b;
  };
  let OHmax = arr === 'side' ? (D.h - 20) / 1.1 : D.h;
  let found = null;
  let lastWhy = '';
  for (let OH = Math.min(OHmax, 700); OH >= cfg.hMin; OH *= 0.985) {
    const zg = zoneGeom(base.kind, OH, tg, rec, RW, arr, minCtx);
    if (zg.zW > full) { lastWhy = 'zW'; continue; }
    let band, room, blockH;
    // stack + split: the band runs in a column beside the record instead of under it
    const split = Boolean(cfg.split);
    // (split widths are quantised to 24 units so the band is measured once per width step)
    const bandW = split ? Math.floor((arr === 'stack' ? full - recW - 20 : full - zg.zW - 12) / 24) * 24 : full;
    if (bandW < 240) { lastWhy = 'bandW'; continue; }
    band = flowBand(bandW);
    if (band.bad) { lastWhy = 'band'; continue; }
    if (arr === 'side') {
      // rest: the zone centred with the band under it (split: the band in the column the lens later takes);
      // lens: the zone slides right (split: it is already there), the lens opens on its left
      blockH = split ? Math.max(zg.zH, band.h) : zg.zH + (band.h ? 16 + band.h : 0);
      if (blockH > D.h) { lastWhy = `blockH${Math.round(blockH)}`; continue; }
      room = {w: full - zg.zW - 12, h: D.h};
      if (room.w < 200) { lastWhy = 'room'; continue; }
      // a band column only when the band has enough in it to hold the column at rest
      if (split && band.h < 0.35 * D.h) return {bad: 'thin-band'};
    } else {
      // rest: the zone (as large as the box allows) over the record and band. Lens: the record and band step out and
      // the context steps back — it shrinks toward its top centre, never under 0.45 of the frame width (its floor
      // spans the box) — and the lens opens in the room below it
      // (stackc: the record stands on the counter beside the object instead of under it)
      if (arr === 'stackc' && split) { lastWhy = 'split'; continue; }
      blockH = arr === 'stackc' ? zg.zH + (band.h ? 16 + band.h : 0) : zg.zH + 30 + (split ? Math.max(recH, band.h) : recH + (band.h ? 16 + band.h : 0));
      if (blockH > D.h) { lastWhy = `blockH${Math.round(blockH)}`; continue; }
      const top = Math.max(0, (D.h - blockH) / 2);
      const sBack = Math.min(1, (0.45 * FU.w + 8) / full);
      room = {w: full, h: D.h - top - zg.zH * sBack - 16, sBack, top};
    }
    // crop: the tag and the lip / upper body, then shaped toward the room's aspect (bounded growth)
    const lipX1 = zg.objX + (base.kind === 'vase' ? -0.02 : 0.1) * zg.G.W;
    const c0 = {x: zg.tagX - 8, y: Math.min(zg.tagY, zg.objBaseY - OH * 1.04) - 8};
    const c1 = {x: lipX1 + 8, y: Math.max(zg.tagY + tg.h, zg.objBaseY - OH * 0.45) + 8};
    let crop = {x: c0.x, y: c0.y, w: c1.x - c0.x, h: c1.y - c0.y};
    const ar = room.w / room.h;
    if (crop.w / crop.h < ar) { const nw = Math.min(crop.h * ar, crop.w * 1.5); crop = {...crop, x: crop.x - (nw - crop.w) * 0.15, w: nw}; }
    else { const nh = Math.min(crop.w / ar, crop.h * 1.8); crop = {...crop, h: nh}; }
    const Z = Math.min(room.w / crop.w, room.h / crop.h);
    const lensMin = Math.min(crop.w, crop.h) * Z;
    if (Z < 1.55 || lensMin < 0.4 * FU.short + 4) { lastWhy = `Z${Z.toFixed(2)}/${Math.round(lensMin)}`; continue; }
    found = {OH, zg, band, room, crop, Z, blockH, split, bandW};
    break;
  }
  if (!found) return {bad: `fit:${lastWhy}`};
  if (cfg.dry) return {OH: found.OH, size, Z: found.Z, cfg: {...cfg, dry: false}};
  return {FU, size, cfg, tg, rec, recW, recH, arr, RW, ...found, ...found.zg};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveDM(p);
    const textOn = ctx.show('key');
    const band = [
      {key: 'caption', icon: 'record', text: p.contextLabels.context || t.context, when: 'ctx'},
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`, when: 'ctx'})),
      ...linkNotes(ctx, M).map(l => ({...l, icon: 'link', when: 'ctx'})),
      {key: 'trB', icon: 'before', level: p.markLevels.before, text: `${t.beforeV}: ${p.beforeValue}`, when: 'trace'},
      {key: 'trA', icon: 'after', level: p.markLevels.after, text: `${t.afterV}: ${p.afterValue}`, when: 'trace'},
      {key: 'key', text: t.key, when: 'key'},
    ];
    const rows = [
      ...p.events.map((e, i) => ({key: `ev${i}`, icon: 'event', i, text: eventText(e)})),
      ...p.losses.map((l, j) => ({key: `ls${j}`, icon: 'object', level: p.markLevels.after, text: `${t.after}: ${l.label}`})),
    ];
    const base = {M, kind: p.object.kind, header: t.record, rows, band, memo: {rec: new Map(), band: new Map()}};
    const rws = ctx.view.shape === 'portrait' ? [440, 520, 620, 720, 900] : ctx.view.shape === 'square' ? [340, 420, 480, 640, 880] : [420, 480, 540, 600];
    const tws = ctx.view.shape === 'portrait' ? [240, 280, 320, 360] : ctx.view.shape === 'square' ? [170, 190, 210, 240] : [220, 260, 300];
    const hMin = ctx.view.shape === 'square' ? 130 : 150;
    let pick = null, best = null;
    const why = [];
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      if (best && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      for (const arr of SH.arr) for (const RW of rws) for (const tagW of tws) for (const split of [false, true]) {
        const X = compose(ctx, base, {size, RW, tagW, arr, split, hMin, dry: true});
        if (!X.cfg) { why.push(`${RW}/${tagW}@${size}:${X.bad}${X.OH ? Math.round(X.OH) : ''}${X.Z ? '/' + X.Z.toFixed(2) : ''}${X.lensMin ? '/' + Math.round(X.lensMin) : ''}`); continue; }
        if (!best) best = X;
        const sc = X.OH * Math.min(1.2, X.Z / 1.6);
        if (!pick || sc > pick.sc) pick = {...X, sc};
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    let Dv = ctx.design;
    if (!L) {
      for (let f = 1.1; f <= 4.01 && !L; f += 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const arr of ['stack', 'side']) for (const tagW of tws) {
          if (L) break;
          const X = compose(c2, base, {size: SH.minSize, RW: rws[rws.length - 1], tagW, arr, hMin: 60});
          if (X.tg) { L = X; Dv = c2.design; }
        }
      }
    }
    if (!L) throw new Error(`${ID}: no layout (${why.slice(-4).join(' ')})`);
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(0, 40);
    L.M = M;
    const full = Dv.w - 2 * MARGIN;
    const OH = L.OH;
    // ---- placement
    let zx, F, recX, recY, bandX, bandY, bandW;
    if (L.arr === 'side') {
      const top = Math.max(0, (Dv.h - L.blockH) / 2);
      zx = L.split ? MARGIN + full - L.zW : MARGIN + (full - L.zW) / 2; // at rest; it slides to the right edge for the lens
      L.zShift = MARGIN + full - L.zW - zx;
      F = top + (L.split ? (L.blockH - L.zH) / 2 : 0) + L.zH - 16;
      recX = zx + L.recX; recY = F + L.recY;
      if (L.split) { bandX = MARGIN; bandW = L.bandW; bandY = top + (L.blockH - L.band.h) / 2; } else { bandX = MARGIN; bandW = full; bandY = top + L.zH + 16; }
    } else {
      const top = L.room.top;
      L.zShift = 0;
      // the context steps back toward its top centre while the lens is open
      L.sBack = L.room.sBack;
      L.pivot = {x: MARGIN + full / 2, y: top};
      zx = MARGIN + (full - L.zW) / 2;
      F = top + L.zH - 16;
      recY = top + L.zH + 30 + L.rec.clipH * 0.35;
      if (L.arr === 'stackc') {
        recX = zx + L.recX; recY = F + L.recY;
        // the band sits at the foot of the box (the scene then spans the box at rest and at the hold)
        bandX = MARGIN; bandW = full; bandY = Math.max(top + L.zH + 16, Dv.h - L.band.h);
      } else if (L.split) {
        recX = MARGIN + 10;
        bandX = MARGIN + L.recW + 20; bandW = L.bandW; bandY = top + L.zH + 30;
      } else {
        recX = MARGIN + (full - L.recW) / 2 + 10;
        bandX = MARGIN; bandW = full; bandY = recY - L.rec.clipH * 0.35 + L.recH + 16;
      }
    }
    L.F = F; L.zx = zx;
    const wx = x => zx + x, wy = y => F + y;
    L.objBase = {x: wx(L.objX), y: wy(L.objBaseY)};
    L.tagAt = {x: wx(L.tagX), y: wy(L.tagY)};
    L.table = {x0: wx(L.tabX0), x1: wx(L.tabX1)};
    L.crop = {x: wx(L.crop.x), y: wy(L.crop.y), w: L.crop.w, h: L.crop.h};
    // lens destination: side = the band's column left of the zone, centred on the crop; stack = below the zone
    const dw = L.crop.w * L.Z, dh = L.crop.h * L.Z;
    if (L.arr === 'side') {
      const cy = Math.max(0, Math.min(Dv.h - dh, L.crop.y + L.crop.h / 2 - dh / 2));
      const roomW = full - L.zW - 12;
      L.dest = {x: MARGIN + (roomW - dw) / 2, y: cy, w: dw, h: dh};
    } else {
      const backBottom = L.pivot.y + (F + 16 - L.pivot.y) * L.sBack;
      L.dest = {x: MARGIN + (full - dw) / 2, y: Math.min(Dv.h - dh, backBottom + 14), w: dw, h: dh};
    }
    L.recOnCounter = L.arr === 'side' || L.arr === 'stackc';
    L.recNode = recordBuild(ctx, L.rec, {prefix: 'rec', x: recX, y: recY, kind: p.object.kind});
    L.bandNodes = [];
    if (L.band.sz.length) {
      // stackc: the band sits at the foot of the box, so the chips shown at rest (caption, notes) take its last rows
      const order = L.arr === 'stackc' ? [...L.band.sz.filter(q => q.it.when !== 'ctx'), ...L.band.sz.filter(q => q.it.when === 'ctx')] : L.band.sz;
      const pl = flowRows(order, {x: bandX, y: bandY, w: bandW, gap: 16, rowGap: 10, center: !L.split}).placed;
      for (const q of pl) {
        const it = q.it.it;
        const b = q.it.build(q.x, q.y, `band-${it.key}`, {});
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    // the before trace chip is struck through (every line; its old value stays traceable)
    L.trB = L.bandNodes.find(b => b.key === 'trB');
    if (L.trB) {
      const strike = v => { if (v && typeof v === 'object') { if (v.tag === 'text') v.attrs['text-decoration'] = 'line-through'; (v.children || []).forEach(strike); } };
      strike(L.trB.node);
    }
    // Δ marker on the tag's top-left corner, over the card's blank top strip (never over the value); its label goes
    // where it is clear of the tag, the object and the frame: left of the marker, else under the tag, else above it
    const mR = Math.max(16, L.size * 0.8);
    L.marker = {x: L.tagAt.x + mR * 0.9, y: L.tagAt.y + 2, R: mR};
    L.markerLabel = textOn ? {text: p.contextLabels.marker || t.marker} : null;
    if (L.markerLabel) {
      const f = fitG(ctx, L.markerLabel.text, {maxWidth: Math.max(160, Math.min(320, L.tg.w + 60)), size: L.size, minSize: L.size, maxLines: 2, weight: 600});
      const w = f.width + L.size * 1.2, hh = f.height + L.size * 0.76;
      const objBox = {x: L.objBase.x - (p.object.kind === 'vase' ? 0.31 : 0.37) * OH - 6, y: L.objBase.y - OH - 6, w: (p.object.kind === 'vase' ? 0.62 : 0.74) * OH + 12, h: OH + 6};
      const tagBox = {x: L.tagAt.x, y: L.tagAt.y, w: L.tg.w, h: L.tg.h};
      const meets = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      const inD = b => b.x >= MARGIN - 0.5 && b.y >= 0 && b.x + b.w <= Dv.w - MARGIN + 0.5 && b.y + b.h <= Dv.h;
      const cands = [
        {x: L.marker.x - mR - 10 - w, y: L.marker.y - hh / 2, w, h: hh},
        {x: L.tagAt.x, y: L.tagAt.y + L.tg.h + 12, w, h: hh},
        {x: L.tagAt.x, y: L.tagAt.y - mR - 8 - hh, w, h: hh},
        {x: L.tagAt.x + L.tg.w - w, y: L.tagAt.y - mR - 8 - hh, w, h: hh},
        {x: L.marker.x - mR - 10 - w, y: L.tagAt.y + L.tg.h - hh, w, h: hh},
      ];
      // the label must also stay clear of the band chips shown with it at the hold
      const bandBoxes = L.bandNodes.map(b => b.box);
      const box = cands.find(b => inD(b) && !meets(b, tagBox) && !meets(b, objBox) && !bandBoxes.some(q => meets(b, {x: q.x - 6, y: q.y - 6, w: q.w + 12, h: q.h + 12}))) || cands[1];
      L.markerLabel = {...L.markerLabel, fit: f, box};
    }
    L.levels = [p.markLevels.before, p.markLevels.after];
    const Dr = ctx.design;
    L.k = Math.min(1, Dr.w / Dv.w, Dr.h / Dv.h);
    L.dx = (Dr.w - Dv.w * L.k) / 2;
    L.dy = (Dr.h - Dv.h * L.k) / 2;
    L.Dv = Dv;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const OH = L.OH;
    const textOn = ctx.show('key');
    const lv0 = L.levels[0];
    // the zone (table, object, string, tag) — drawn twice: in the scene and as the lens copy
    const zone = (P, tagP) => {
      const obj = objectArt(ctx, {name: `${P}o`, kind: p.object.kind, H: OH, level: lv0});
      const tag = tagArt(ctx, L.tg, L.tagAt.x, L.tagAt.y, tagP, textOn);
      const neck = p.object.kind === 'vase' ? {x: L.objBase.x - 0.27 * L.G.W, y: L.objBase.y - 0.82 * OH} : {x: L.objBase.x - 0.5 * L.G.W, y: L.objBase.y - 0.9 * OH};
      return g(null,
        // tall/square boxes: the floor runs the whole width (the object zone stands on it)
        // tall/square boxes: the floor runs the whole width and steps back with the context; wide boxes: the context
        // slides along a fixed full-width floor drawn outside it (the lens copy draws the floor at rest)
        L.arr !== 'side' || P ? floorArt(ctx, {name: `${P}floor`, x0: MARGIN, x1: L.Dv.w - MARGIN, floorY: L.F}) : null,
        tableArt(ctx, {name: `${P}table`, x0: L.table.x0, x1: L.table.x1, topY: L.F - TH * OH, floorY: L.F}),
        g({transform: T(L.objBase.x, L.objBase.y)}, obj.node),
        obj.chip,
        h('path', {d: `M${r(neck.x)} ${r(neck.y)}Q${r((neck.x + tag.hole.x) / 2)} ${r(Math.max(neck.y, tag.hole.y) + OH * 0.06)} ${r(tag.hole.x)} ${r(tag.hole.y)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5}),
        tag.node,
      );
    };
    // wide boxes: the record stands on a small easel on the counter, part of the context
    const rb = L.recNode.box;
    const recEasel = L.recOnCounter ? g(null,
      h('path', {d: `M${r(rb.x + rb.w * 0.3)} ${r(rb.y + rb.h - 4)}L${r(rb.x + rb.w * 0.24)} ${r(L.F - TH * OH)}M${r(rb.x + rb.w * 0.7)} ${r(rb.y + rb.h - 4)}L${r(rb.x + rb.w * 0.76)} ${r(L.F - TH * OH)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.32)), 'stroke-linecap': 'round'})) : null;
    const Lc = L.crop;
    const lens = g({name: 'lz', opacity: 0, 'data-occludes': 1},
      h('defs', null, h('clipPath', {id: ctx.id('lzclip')}, h('rect', {name: 'lz-cliprect', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14}))),
      h('rect', {name: 'lz-win', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14, fill: th.paper}),
      g({'clip-path': ctx.ref('lzclip')}, g({name: 'lz-content'}, zone('lzs-', 'lzt'))),
      h('rect', {name: 'lz-border', x: r(Lc.x), y: r(Lc.y), width: r(Lc.w), height: r(Lc.h), rx: 14, fill: 'none', stroke: th.accent2, 'stroke-width': 4}),
    );
    const guides = g({name: 'guides', opacity: 0},
      h('path', {name: 'src-frame', d: roundRectPath(Lc.x, Lc.y, Lc.w, Lc.h, 10), fill: 'none', stroke: th.accent2, 'stroke-width': 3}),
      h('line', {name: 'guide0', x1: r(Lc.x), y1: r(Lc.y), x2: r(Lc.x), y2: r(Lc.y), stroke: th.accent2, 'stroke-width': 2.5}),
      h('line', {name: 'guide1', x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(Lc.x), y2: r(Lc.y + Lc.h), stroke: th.accent2, 'stroke-width': 2.5}),
    );
    const ml = L.markerLabel;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.recOnCounter ? null : g({name: 'rec-g'}, L.recNode.node),
      L.arr === 'side' ? floorArt(ctx, {name: 'floor', x0: MARGIN, x1: L.Dv.w - MARGIN, floorY: L.F}) : null,
      g({name: 'cam'}, zone('', 'tg'), L.recOnCounter ? g({name: 'rec-g'}, recEasel, L.recNode.node) : null),
      guides,
      lens,
      changedMarker(ctx, {name: 'marker', x: L.marker.x, y: L.marker.y, radius: L.marker.R, opacity: 0}),
      ml ? g({name: 'mlabel', opacity: 0},
        h('path', {d: roundRectPath(ml.box.x, ml.box.y, ml.box.w, ml.box.h, Math.min(ml.box.h / 2, L.size * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 2}),
        textBlock(ml.fit, {x: ml.box.x + L.size * 0.6, y: ml.box.y + L.size * 0.38, fill: th.ink})) : null,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const OH = L.OH;
    const textOn = ctx.show('key');
    const nodes = {};
    const stack = L.arr !== 'side';
    const W = stack ? W_STACK : W_SIDE;
    const Lr = L.crop, De = L.dest;
    // wide boxes: the context slides right (no scaling) to free the room for the lens, and back after it closes;
    // tall/square boxes: it steps back (shrinks toward its top centre) and regrows after the lens has closed
    const shP = stack ? 0 : u < W.shiftBack[0] ? ease.inOutCubic(seg(u, ...W.shift)) : 1 - ease.inOutCubic(seg(u, ...W.shiftBack));
    const sh = L.zShift * shP;
    const backP = !stack ? 0 : u < W.regrow[0] ? ease.inOutCubic(seg(u, ...W.shrink)) : 1 - ease.inOutCubic(seg(u, ...W.regrow));
    const sc = stack ? lerp(1, L.sBack, backP) : 1;
    const pv = L.pivot || {x: 0, y: 0};
    const camT = stack ? `translate(${r(pv.x)} ${r(pv.y)}) scale(${r(sc, 5)}) translate(${r(-pv.x)} ${r(-pv.y)})` : T(r(sh), 0);
    nodes.cam = {opacity: r(seg(u, ...W.ctxIn), 3), transform: camT};
    // the source (crop) where it is now
    const Lc = stack ? {x: pv.x + (Lr.x - pv.x) * sc, y: pv.y + (Lr.y - pv.y) * sc, w: Lr.w * sc, h: Lr.h * sc} : {x: Lr.x + sh, y: Lr.y, w: Lr.w, h: Lr.h};
    // lens rectangle: from the source (exact overlay) to the destination and back
    const op = stack
      // (the lens first holds exactly over its source for ~2 frames, then grows fast)
      ? ease.outCubic(seg(u, W.open[0] + 0.004, W.open[1])) * (1 - ease.inCubic(seg(u, ...W.close)))
      : ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const lensOn = u >= W.open[0] && u < W.close[1];
    const cur = {x: lerp(Lc.x, De.x, op), y: lerp(Lc.y, De.y, op), w: lerp(Lc.w, De.w, op), h: lerp(Lc.h, De.h, op)};
    const k = cur.w / Lr.w;
    nodes.lz = {opacity: lensOn ? 1 : 0};
    for (const n of ['lz-cliprect', 'lz-win', 'lz-border']) nodes[n] = {x: r(cur.x), y: r(cur.y), width: r(cur.w), height: r(cur.h)};
    nodes['lz-content'] = {transform: `translate(${r(cur.x)} ${r(cur.y)}) scale(${r(k, 5)}) translate(${r(-Lr.x)} ${r(-Lr.y)})`};
    const gOn = lensOn ? seg(u, ...W.guides) * (1 - seg(u, W.close[0], W.close[0] + 0.01)) : 0;
    nodes.guides = {opacity: r(gOn, 3)};
    // tall boxes: the lens opens below the whole object, so diagonal guides would cross it; only the source frame
    // stays (the lens visibly grows out of it)
    const gVis = L.arr === 'side' ? 1 : 0;
    nodes['src-frame'] = {transform: camT};
    // guides from the source frame's corners to the lens' matching corners (anchored at both ends)
    const leftSide = cur.x + cur.w <= Lc.x + 1;
    const ax = leftSide ? Lc.x : Lc.x, bx = leftSide ? cur.x + cur.w : cur.x;
    if (L.arr === 'side') {
      nodes.guide0 = {x1: r(ax), y1: r(Lc.y), x2: r(bx), y2: r(cur.y), opacity: gVis};
      nodes.guide1 = {x1: r(ax), y1: r(Lc.y + Lc.h), x2: r(bx), y2: r(cur.y + cur.h), opacity: gVis};
    } else {
      nodes.guide0 = {x1: r(Lc.x), y1: r(Lc.y + Lc.h), x2: r(cur.x), y2: r(cur.y), opacity: gVis};
      nodes.guide1 = {x1: r(Lc.x + Lc.w), y1: r(Lc.y + Lc.h), x2: r(cur.x + cur.w), y2: r(cur.y), opacity: gVis};
    }
    // the datum: before → after (in the scene's tag and in the lens copy together; the scene's tag is blank while the
    // lens holds the value)
    const out = seg(u, ...W.oldOut), inn = seg(u, ...W.newIn);
    const ctxVals = u < W.tagOut[1] ? 1 - seg(u, ...W.tagOut) : u < W.tagIn[0] ? 0 : seg(u, ...W.tagIn);
    for (const P of ['tg', 'lzt']) {
      nodes[`${P}-vb`] = {opacity: r(1 - out, 3), transform: T(0, -OH * 0.06 * ease.inQuad(out))};
      nodes[`${P}-va`] = {opacity: r(inn, 3)};
      if (textOn) {
        const st = seg(u, ...W.strike);
        nodes[`${P}-strike`] = {opacity: r(st > 0 ? 1 - out : 0, 3), transform: T(0, -OH * 0.06 * ease.inQuad(out))};
        (L.tg.strikeLines || []).forEach((ln, i) => { nodes[`${P}-st${i}`] = {'stroke-dashoffset': r((ln.w + 6) * (1 - st))}; });
      }
    }
    nodes['tg-vals'] = {opacity: r(ctxVals, 3)};
    // the lens copy's value shows only once the copy is drawn at >= 16.5 px (it starts over a stepped-back source)
    nodes['lzt-vals'] = {opacity: k * L.size >= 16.5 ? 1 : 0};
    // dependent geometry only: the marks of the after level (in the scene and in the lens copy)
    const [lv0, lv1] = L.levels;
    const gp = ease.inOutQuad(seg(u, ...W.geo));
    const mk = lv => ({a: lv >= 1 ? 1 : 0, b: lv >= 2 ? 1 : 0});
    const m0 = mk(lv0), m1 = mk(lv1);
    const a = lerp(m0.a, m1.a, gp), b = lerp(m0.b, m1.b, gp);
    const isVase = p.object.kind === 'vase';
    for (const P of ['', 'lzs-']) {
      const art = objectArt(ctx, {name: `${P}o`, kind: p.object.kind, H: OH, level: lv0});
      Object.assign(nodes, art.frame({a: m1.a > m0.a ? a : m0.a > m1.a ? a : m0.a, b: b > 0.0001 ? Math.max(1e-6, b) : 0}));
      if (isVase) {
        const G = L.G;
        const from = {x: L.objBase.x + G.chipFrom.x, y: L.objBase.y + G.chipFrom.y};
        const rest = {x: L.objBase.x + G.chipRest.x, y: L.objBase.y + G.chipRest.y - OH * CHIP_REST_DY};
        const s = b; // 0 = attached (or none), 1 = lying on the table
        const Q = {x: from.x - 0.12 * OH, y: from.y - 0.12 * OH};
        const pos = {x: (1 - s) ** 2 * from.x + 2 * s * (1 - s) * Q.x + s * s * rest.x, y: (1 - s) ** 2 * from.y + 2 * s * (1 - s) * Q.y + s * s * rest.y};
        // with no chip at either level the piece stays in the lip
        nodes[`${P}o-chip`] = {transform: T(pos.x, pos.y, CHIP_REST_ROT * ease.outQuad(s)), opacity: 1};
      }
    }
    // texts that step out while the lens is open, and come back after the scene's tag
    const txt = u < W.textOut[1] ? Math.min(seg(u, ...W.textIn), 1 - seg(u, ...W.textOut)) : u < W.textBack[0] ? 0 : seg(u, ...W.textBack);
    // wide boxes: the record on the counter is context and stays; otherwise it steps out with the other texts
    // (stackc: the record stands on the counter inside the context, so it leaves before the context steps back and
    // returns after it has regrown)
    const recOnCam = L.arr === 'stackc' ? (u < W.tagOut[1] ? Math.min(seg(u, ...W.textIn), 1 - seg(u, ...W.tagOut)) : u < W.textBack[0] ? 0 : seg(u, ...W.textBack)) : txt;
    nodes['rec-g'] = {opacity: r(L.arr === 'side' ? 1 : recOnCam, 3)};
    for (const bn of L.bandNodes) {
      const v = bn.when === 'ctx' ? txt : bn.when === 'trace' ? seg(u, ...W.trace) : seg(u, ...W.key);
      nodes[`band-${bn.key}`] = {opacity: r(v, 3)};
    }
    const mOn = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mOn, 3)};
    if (L.markerLabel) nodes.mlabel = {opacity: r(mOn, 3)};
    const datum = inn >= 1 ? 'after' : out > 0 || seg(u, ...W.strike) > 0 ? 'changing' : 'before';
    const frameW = L.Dv.w, frameH = L.Dv.h;
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      datum,
      tagValue: inn >= 1 ? 'after' : out <= 0 ? 'before' : 'changing',
      strike: r(seg(u, ...W.strike), 3),
      lensOpen: r(op, 3), lensOn,
      zoom: r(L.Z, 3),
      lensNow: {x: r(cur.x), y: r(cur.y), w: r(cur.w), h: r(cur.h)},
      crop: {x: r(Lc.x), y: r(Lc.y), w: r(Lc.w), h: r(Lc.h)},
      shift: r(sh),
      back: r(sc, 4),
      lensMinSide: r(Math.min(De.w, De.h) / L.FU.short, 3),
      ctxValues: r(ctxVals, 3),
      marks: {a: r(a, 3), b: r(b, 3)},
      markerVisible: mOn >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      textsOut: txt === 0,
      tag: {x: r(L.tagAt.x), y: r(L.tagAt.y), w: r(L.tg.w), h: r(L.tg.h)},
      marker: {x: r(L.marker.x), y: r(L.marker.y), R: r(L.marker.R)},
      frame: {w: r(frameW), h: r(frameH)},
      layout: {OH: r(OH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, arr: L.arr, why: L.why, Z: r(L.Z, 3)},
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
    slug: 'causation-05-inspect',
    title: 'Material damage — a lens on the object’s state tag; one supplied datum is substituted',
    titleEs: 'Daño material — Inspección y cambio de un dato',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Daño material',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The altered object on its table with a state tag on a string, beside the incident record. The record steps out, the scene’s tag goes blank and a real enlarged copy of the tag and the lip grows from its source into the freed room; the tag’s value is struck and replaced by the alternative value while only the dependent marks change (e.g. the chip breaks from the lip). The lens returns to its source; a Δ marker and a before/after trace keep the old value traceable. Nothing is valued; no validity, liability or outcome is inferred.',
    tags: ['causation', 'damage', 'material damage', 'inspect', 'lens', 'datum substitution', 'before and after', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene,
});
