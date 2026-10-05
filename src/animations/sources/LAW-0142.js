/**
 * LAW-0142 — Ámbito territorial · mechanism
 *
 * Storyboard (exploded view of the territorial placement; brief beats in brackets):
 *  [0.00–0.20] separate: the three sheets, stacked, open large and centred in the
 *              frame and shrink into place while they lift apart (0.02–0.16)
 *              — the zone board (neutral hexagonal zones), the
 *              text's translucent sheet (the amber area where the text is
 *              placed, as supplied) and the fact layer (numbered pawns with their
 *              tags). Only then do the editable hierarchy (level plates), the
 *              book (source), the article slip, the magnifier (reading) and the
 *              key appear in place beside the stack (0.13–0.18), so nothing slides
 *              over any text; each part stands next to the sheet it connects to.
 *  [0.18–0.43] only the supplied relationships are drawn, one by one, anchored
 *              to the edges of their two parts and captioned by kind: plain
 *              relations have no arrow; sequences have one; causal links appear
 *              only when the author supplies them.
 *  [0.43–0.75] a tracer follows `traversalOrder` along those relationships; the
 *              focus part swells while the tracer is on it.
 *  [0.75–1.00] gather: the text's sheet and the pawns drop onto the zone board
 *              (dashed plumb lines), where the combined state stays visible —
 *              solid ring = pawn in the text's zone, dashed ring = another zone
 *              (as supplied). Origin, transformation and state stay on screen;
 *              nothing states that a text applies in a zone.
 * @module animations/sources/LAW-0142
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {mechanismFields, str} from '../../schemas/fields.js';
import {chip, textBlock, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {
  territorialFields, CONTENT_EN, KIT_STRINGS, kitStrings, resolvePlacement, fitWords, brokeWord, makeBoard, boardArt, placeOnBoard, zoneDemand,
  zoneTilesPath, boundaryPath, pawnToken, bookCover, bookNeed, articleSlip, keyCard, keyHeight, PAWN, TOKEN_R,
  ZONE_FILL, ZONE_EDGE, NEUTRAL, sheetColor, sheetDark, R2, pickNote,
} from './kits/ambito-territorial.js';
import {lupaArt} from './kits/ambito-material.js';

const ID = 'LAW-0142';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {open: [0.02, 0.16], separate: [0.05, 0.16], reveal: [0.13, 0.18], relate: [0.21, 0.42], trace: [0.44, 0.73], drop: [0.76, 0.84], land: [0.8, 0.88], hold: 0.9};
const IDS = ['hierarchy', 'source', 'article', 'text', 'zones', 'facts', 'reading'];
const SQ = 0.5; // vertical squash of the sheets seen at an angle

// (attributed readings are not part of this mechanism: the field is left out rather than never drawn)
const {interpretations: _noReadings, ...placementFields} = territorialFields;
const sceneSchema = {
  ...placementFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = str('Optional caption of this relationship (defaults to the caption of its kind)', 40);

const {interpretations: _noReadings2, ...CONTENT_NO_READINGS} = CONTENT_EN;
const defaultParams = {
  ...CONTENT_NO_READINGS,
  elements: [
    {id: 'hierarchy', label: 'Editable hierarchy'},
    {id: 'source', label: 'Book (source)'},
    {id: 'article', label: 'Article slip'},
    {id: 'text', label: 'Sheet of the text'},
    {id: 'zones', label: 'Zone board'},
    {id: 'facts', label: 'Fact layer'},
    {id: 'reading', label: 'Reading (magnifier)'},
  ],
  relationships: [
    {from: 'hierarchy', to: 'source', kind: 'relation', label: 'level as supplied'},
    {from: 'source', to: 'article', kind: 'relation', label: 'contains'},
    {from: 'article', to: 'text', kind: 'relation', label: 'names the zone'},
    {from: 'text', to: 'zones', kind: 'relation', label: 'same outline'},
    {from: 'facts', to: 'text', kind: 'relation', label: 'same zone or not'},
    {from: 'reading', to: 'facts', kind: 'relation', label: 'compares places'},
  ],
  focusElement: 'zones',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['hierarchy', 'source', 'article', 'text', 'zones', 'facts', 'reading'],
};

const SIZES = {landscape: [1690, 738], portrait: [950, 1359], square: [950, 738]};
/**
 * Per shape: the stack (flat board size, left x, the three sheet tops when apart, projected by SQ),
 * the side parts (hierarchy, source, article, reading), the key.
 */
const GEO = {
  landscape: {
    stack: {x: 584, w: 700, h: 360, top: 34, pitch: 238},
    cols: [{x: 14, w: 440, items: ['hierarchy', 'source', 'article'], y: 8}, {x: 1310, w: 366, items: ['reading'], y: 60}],
    // a lane between the column and the stack holds the captions that find no room in the column's gaps
    lane: {x: 462, w: 118},
    key: {x: 1316, w: 360, bottom: 726}, lupa: {R: 62, L: 118, rot: 0},
  },
  portrait: {
    // the hierarchy and the magnifier head the frame; the book, the slip and the key stand beside the
    // sheet each one connects to, so every connector is short and crosses no other sheet
    stack: {x: 372, w: 564, h: 500, pitch: 380, below: true},
    cols: [{x: 14, w: 450, items: ['hierarchy'], y: 8}, {x: 480, w: 456, items: ['reading'], y: 8}],
    side: {x: 14, w: 340, items: ['source', 'article', 'key'], align: ['facts', 'text', 'zones']},
    key: {x: 14, w: 340}, lupa: {R: 56, L: 110, rot: -90},
  },
  square: {
    stack: {x: 504, w: 432, h: 264, top: 36, pitch: 194},
    // the magnifier heads the column next to the fact layer it reads, the slip stands beside the text's sheet,
    // then the book and the hierarchy: every connector links neighbours and crosses no sheet
    cols: [{x: 14, w: 380, items: ['article', 'source', 'hierarchy'], y: 4}],
    // the magnifier stands upright beside the slip (its label above it), which frees the column's gaps
    beside: {id: 'reading', of: 'article', w: 96},
    // a lane between the column and the stack holds the captions of the connectors that cross it
    lane: {x: 394, w: 110},
    key: {x: 504, w: 432, bottom: 728, strip: true}, lupa: {R: 26, L: 48, rot: 0}, gap: 8, labelPad: 16, bookMin: 100,
  },
};

/** A book title and note fit whole (no ellipsis, no word split) at this cover width. */
function bookFitsWhole(ctx, sv, w, pf) {
  if (!ctx.show('key')) return true;
  const ok = f => !f.truncated && !brokeWord(f);
  // (side by side only while the titles keep their size: at least ~19.5 px, or the size the parts already use)
  const mn = Math.min(19.5, Math.max(16, 20.5 * pf));
  const tf = fitWords(ctx, sv.title, {maxWidth: w - 74, size: Math.max(16, 22 * pf), minSize: mn, maxLines: 4, weight: 700, family: 'serif'});
  const nf = sv.note ? fitWords(ctx, sv.note, {maxWidth: w - 74, size: Math.min(Math.max(16, 22 * pf), 20.5 * pf), minSize: mn, maxLines: 2, weight: 500}) : null;
  return ok(tf) && (!nf || ok(nf));
}
const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const union = (...bs) => {
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};

function layoutOnce(ctx, gapFirst) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const [SW, SH] = SIZES[shape];
    const s0 = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s0) / 2, oy = (ctx.design.h - SH * s0) / 2;
    const G = GEO[shape];
    const t = kitStrings(p.locale);
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    const res = resolvePlacement(p);
    const label = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
    const present = new Set(p.elements.map(e => e.id));
    const S = shape === 'square' ? 20 : 22;

    /* --- the flat board (shared by the three sheets) ---------------------------------------- */
    const st = G.stack;
    const names = res.zones.map(z => z.name);
    // fact tags stand upright next to their pawn: in flat units a tag is twice as tall
    // each tag has two shapes to choose from when it is laid out: one line (when it fits 300 px) or two lines
    const tagAlts = res.facts.map(f => {
      if (!showKey) return [null];
      const txt = `${f.num} · ${f.label}`;
      const two = fitWords(ctx, txt, {maxWidth: shape === 'square' ? 170 : 210, size: S, minSize: 16, maxLines: 2, weight: 600});
      const one = fitWords(ctx, txt, {maxWidth: 300, size: S, minSize: 16, maxLines: 1, weight: 600});
      const alts = one.truncated || one.lines.length > 1 || one.width <= two.width + 4 ? [two] : [two, one];
      // (a crowded fact layer may use the same text at 16 px — never smaller; captions follow it down)
      if (S > 16) {
        const two16 = fitWords(ctx, txt, {maxWidth: shape === 'square' ? 150 : 190, size: 16, minSize: 16, maxLines: 2, weight: 600});
        const one16 = fitWords(ctx, txt, {maxWidth: 300, size: 16, minSize: 16, maxLines: 1, weight: 600});
        if (!two16.truncated) alts.push(Object.assign(two16, {small: true}));
        if (!one16.truncated && one16.lines.length === 1) alts.push(Object.assign(one16, {small: true}));
      }
      return alts;
    });
    // (the pawns are placed with room for the narrower shape)
    const tagFits = tagAlts.map(a => a[0]);
    const tagDim = i => (tagFits[i] ? {tw: tagFits[i].width + 26, th: (tagFits[i].height + 16) / SQ} : {tw: 120, th: 80});
    const slipFlat = shape === 'square' ? {W: 118, H: 76} : {W: 150, H: 90};
    const flatRect = {x: 0, y: 0, w: st.w, h: st.h, R: shape === 'square' ? 30 : 36, axis: 'x', bands: [22, 22]};
    const demand = zoneDemand(res, slipFlat, res.facts.map((_, i) => tagDim(i)));
    // the flat board carries no plaques (zone names are flags on the projected sheet)
    const B = makeBoard({...ctx, show: () => false}, flatRect, names, 1, demand);
    // the pawns are placed with room for their tags when the board allows it, with less room otherwise
    // (the tags are upright notes on the clear fact layer: they are laid out afterwards, see tagPos)
    let placed = null;
    // (the slip lies on the text's sheet, not on the fact layer: the pawns need not keep clear of it)
    const slipOnly = res.textZone >= 0 ? placeOnBoard(B, slipFlat, {...res, facts: []}, [], {}) : {slipSpot: null};
    for (const k of [1, 0.9, 0.8, 0.7, 0.6, 0.45, 0.3, 0.05]) {
      const tg = res.facts.map((_, i) => ({tw: tagDim(i).tw * k, th: tagDim(i).th * k}));
      placed = placeOnBoard(B, null, res, tg, {sides: ['right', 'left'], tagBounds: {x: 6, y: 6, w: st.w - 12, h: st.h - 12}});
      if (res.facts.every((f, i) => f.zone < 0 || placed.slots[i])) break;
    }
    placed.slipSpot = slipOnly.slipSpot;
    // tag boxes in sheet coordinates (x flat, y projected): beside the pawn, clear of the other pawns and tags
    // (hard: no tag covers a part or a label beside the stack — given once the sheets' places are known)
    const tagPosFor = (textTabY, hardAbs = []) => {
      const R = TOKEN_R;
      const pawnBox = q => ({x: q.x - R - 6, y: q.y * SQ - (R + 6) * SQ, w: 2 * R + 12, h: 2 * (R + 6) * SQ});
      const pawns = placed.slots.filter(Boolean).map(pawnBox);
      // the fact layer's own tab (above it) and the text sheet's tab (in the gap below it) stay clear
      const tabBox = (id, y) => {
        if (!present.has(id) || !showKey) return null;
        const c = chip(ctx, label(id), {x: 10, y, anchor: 'start', maxWidth: 360, size: S - 2, minSize: 16, maxLines: 1, weight: 700});
        return c.box;
      };
      // tabs are text: a tag never covers one (hard); pawns and other tags are avoided as far as possible
      const tabsHard = [tabBox('facts', -40), tabBox('text', textTabY)].filter(Boolean).map(b => ({x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12}));
      const out = [];
      const sheetB = {x: 4, y: 6, w: st.w - 8, h: st.h * SQ - 12};
      const ov = (a, q, pad) => Math.max(0, Math.min(a.x + a.w, q.x + q.w) - Math.max(a.x, q.x) + pad) * Math.max(0, Math.min(a.y + a.h, q.y + q.h) - Math.max(a.y, q.y) + pad);
      res.facts.forEach((f, i) => {
        const q = placed.slots[i];
        if (!q) { out.push(null); return; }
        const cands = [];
        tagAlts[i].forEach((fit, vi) => {
        const tw = fit ? fit.width + 26 : 100, tH = fit ? fit.height + 16 : 34;
        const sides = q.side === 'left' ? ['left', 'right'] : ['right', 'left'];
        const c0 = cands.length;
        for (const side of sides) {
          for (const dy of [0, 16, -16, 32, -32, 48, -48]) cands.push({x: side === 'left' ? q.x - R - 10 - tw : q.x + R + 10, y: q.y * SQ - tH / 2 + dy, side, cost: Math.abs(dy) * 0.5 + (side === q.side ? 0 : 5)});
        }
        for (const dx of [0, 40, -40, 80, -80, 120, -120, 160, -160]) {
          cands.push({x: q.x - tw / 2 + dx, y: q.y * SQ - (R + 6) * SQ - 8 - tH, side: 'top', cost: 30 + Math.abs(dx) * 0.3});
          cands.push({x: q.x - tw / 2 + dx, y: q.y * SQ + (R + 6) * SQ + 8, side: 'bottom', cost: 30 + Math.abs(dx) * 0.3});
        }
        // anywhere free on the sheet, tied to its pawn by a short lead (costlier the farther it is)
        for (let yy = sheetB.y; yy + tH <= sheetB.y + sheetB.h; yy += 6) {
          for (let xx = sheetB.x; xx + tw <= sheetB.x + sheetB.w; xx += 12) {
            const d = Math.hypot(Math.max(xx, Math.min(q.x, xx + tw)) - q.x, Math.max(yy, Math.min(q.y * SQ, yy + tH)) - q.y * SQ);
            cands.push({x: xx, y: yy, side: 'free', cost: 80 + d * 1.2});
          }
        }
        for (let k = c0; k < cands.length; k++) Object.assign(cands[k], {tw, tH, fit, cost: cands[k].cost + (fit && fit.small ? 150 : 0)});
        });
        const scored = [];
        for (const c of cands) {
          const {tw, tH} = c;
          const bx = {x: c.x, y: c.y, w: tw, h: tH, side: c.side, fit: c.fit};
          // it may hang a little over the sheet's rim, never past the design space
          const ax = st.x + bx.x;
          if (ax < 4 || ax + tw > SW - 4) continue;
          const outX = Math.max(0, sheetB.x - bx.x) + Math.max(0, bx.x + bx.w - sheetB.x - sheetB.w);
          const outY = Math.max(0, sheetB.y - bx.y) + Math.max(0, bx.y + bx.h - sheetB.y - sheetB.h);
          const outside = outX + outY;
          // (a tag never covers a tab (text), never hangs into the gap between sheets, and keeps off every pawn)
          // (hanging past the sheet's side is allowed only a little: the lane and the parts lie there)
          const absB = {x: st.x + bx.x, y: (hardTop ?? 0) + bx.y, w: bx.w, h: bx.h};
          const sc = tabsHard.reduce((a, tb) => a + ov(bx, tb, 0), 0) * 1e6 + hardAbs.reduce((a, hb) => a + ov(absB, hb, 4), 0) * 1e6 + outside * 8 + outside * outside * 0.4 + outY * 400 + Math.max(0, outX - 6) * 1e4 + pawns.reduce((a, pb) => a + ov(bx, pb, 4), 0) * 1e4 + c.cost;
          scored.push({bx, sc, q});
        }
        scored.sort((a1, a2) => a1.sc - a2.sc);
        // distinct candidates (a spread of the best)
        const keep = [];
        for (const c of scored) { if (keep.every(k => Math.abs(k.bx.x - c.bx.x) + Math.abs(k.bx.y - c.bx.y) > 10)) keep.push(c); if (keep.length >= 40) break; }
        out.push(keep);
      });
      // the tags are laid out together: no tag covers another, and no tag's lead crosses another tag
      const leadOf = c => {
        const qx = c.q.x, qy = c.q.y * SQ, b = c.bx;
        return {a: {x: qx, y: qy}, b: {x: Math.max(b.x, Math.min(qx, b.x + b.w)), y: Math.max(b.y, Math.min(qy, b.y + b.h))}};
      };
      const segBox = (s0, bx) => {
        for (let k = 1; k < 20; k++) { const x = s0.a.x + (s0.b.x - s0.a.x) * k / 20, y = s0.a.y + (s0.b.y - s0.a.y) * k / 20; if (x > bx.x + 2 && x < bx.x + bx.w - 2 && y > bx.y + 2 && y < bx.y + bx.h - 2) return true; }
        return false;
      };
      const idx = out.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
      let bestSet = null, bestSc = Infinity;
      const pick = [];
      const dfs = (k, acc) => {
        if (acc >= bestSc) return;
        if (k === idx.length) { bestSc = acc; bestSet = pick.slice(); return; }
        for (const c of out[idx[k]]) {
          let add = c.sc;
          for (const o of pick) {
            add += ov(c.bx, o.bx, 6) * 1e5;
            if (segBox(leadOf(c), o.bx) || segBox(leadOf(o), c.bx)) add += 5e4;
          }
          if (acc + add >= bestSc) continue;
          pick.push(c);
          dfs(k + 1, acc + add);
          pick.pop();
        }
      };
      dfs(0, 0);
      const res0 = out.map(() => null);
      if (bestSet) idx.forEach((i, k) => { res0[i] = bestSet[k].bx; });
      return res0;
    };
    // (laid out again once the sheets' pitch is known: the text sheet's tab then stands at its real place)
    let hardTop = null;
    let tagPos = tagPosFor(st.h * SQ);

    /* --- projection -------------------------------------------------------------------------- */
    const LAYERS = ['facts', 'text', 'zones'];
    const proj = (li, q, lift = 0) => ({x: st.x + q.x, y: tops[li] + q.y * SQ - lift});
    const layerBox = li => ({x: st.x, y: tops[li], w: st.w, h: st.h * SQ});

    /* --- sheet art (flat, drawn inside a squashed group) ------------------------------------- */
    const edge = 12;
    // (the clear sheets are opaque while they lie on each other — no layer shows through another — and turn clear
    // once they are apart)
    const sheetFrame = (P, fill, stroke, opacity) => g(null,
      h('path', {d: roundRectPath(6, 14, st.w, st.h, 22), fill: th.shadow}),
      h('path', {name: `sheet-${P}-fill`, d: roundRectPath(0, 0, st.w, st.h, 22), fill: '#fbfaf7', 'fill-opacity': 1, stroke, 'stroke-width': 4, opacity}));
    // zone board: the real board (tiles, boundary), plus the combined state that lands on it at the gather
    const zonesArt = boardArt({...ctx, show: () => false}, B, {prefix: 'mz', names, textZone: -1, staticSheet: true, noText: true, plaques: false});
    const landSheet = res.textZone >= 0 ? g({name: 'land-sheet', opacity: 0},
      g({opacity: 0.5}, h('path', {d: zoneTilesPath(B, res.textZone), fill: sheetColor(ctx), stroke: sheetColor(ctx), 'stroke-width': 1.2})),
      h('path', {d: boundaryPath(B, res.textZone), fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.85})) : null;
    const landPawns = res.facts.map((f, i) => (placed.slots[i] ? g({name: `land-p${i}`, opacity: 0, transform: T(placed.slots[i].x, placed.slots[i].y)},
      h('circle', {r: TOKEN_R, fill: shade(PAWN[i % 3], -0.18), stroke: th.ink, 'stroke-width': 2.4}),
      h('circle', {r: TOKEN_R * 0.7, fill: PAWN[i % 3]}),
      f.rel === 'shared' ? h('circle', {r: TOKEN_R + 9, fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 6})
        : h('circle', {r: TOKEN_R + 9, fill: 'none', stroke: NEUTRAL, 'stroke-width': 4.5, 'stroke-dasharray': '7 6'})) : null));
    const clipZ = ctx.id('mz-clip');
    const zonesSheet = g({name: 'L-zones'},
      g({transform: `translate(${st.x} 0)`}, h('path', {d: roundRectPath(0, st.h * SQ, st.w, edge, 6), fill: shade(th.wood, -0.3), stroke: th.ink, 'stroke-width': 2})),
      g({name: 'L-zones-flat'}, zonesArt.node,
        h('defs', null, h('clipPath', {id: clipZ}, h('path', {d: roundRectPath(B.inner.x, B.inner.y, B.inner.w, B.inner.h, 8)}))),
        g({'clip-path': `url(#${clipZ})`}, landSheet, landPawns)));
    // the text's sheet: clear acetate, the amber area of its zone, a small slip silhouette
    const sp = placed.slipSpot;
    const textSheet = g({name: 'L-text'},
      g({name: 'L-text-flat'},
        sheetFrame('t', 'rgba(255,255,255,0.35)', th.inkSoft, 1),
        // the amber area is cut to the board's inner outline (the partial tiles at its rim stay inside)
        h('defs', null, h('clipPath', {id: ctx.id('mt-clip')}, h('path', {d: roundRectPath(B.inner.x, B.inner.y, B.inner.w, B.inner.h, 8)}))),
        res.textZone >= 0 ? g(null,
          g({'clip-path': `url(#${ctx.id('mt-clip')})`},
            g({opacity: 0.55}, h('path', {d: zoneTilesPath(B, res.textZone), fill: sheetColor(ctx), stroke: sheetColor(ctx), 'stroke-width': 1.2})),
            h('path', {d: boundaryPath(B, res.textZone), fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 9, 'stroke-linecap': 'round'})),
          sp ? h('path', {d: roundRectPath(sp.x, sp.y, slipFlat.W, slipFlat.H, 8), fill: shade(sheetColor(ctx), 0.62), stroke: th.ink, 'stroke-width': 3}) : null,
          sp ? h('path', {d: `M${sp.x + 16} ${sp.y + 30}H${sp.x + slipFlat.W - 20}M${sp.x + 16} ${sp.y + 56}H${sp.x + slipFlat.W - 50}`, stroke: th.inkSoft, 'stroke-width': 7, 'stroke-linecap': 'round'}) : null) : null,
        h('path', {d: `M18 18H${st.w - 18}V${st.h - 18}H18Z`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '10 10', opacity: 0.6})));
    // the fact layer: clear acetate with the pawns lying on it
    const factPawns = res.facts.map((f, i) => (placed.slots[i] ? g({transform: T(placed.slots[i].x, placed.slots[i].y)},
      h('ellipse', {cx: 4, cy: 8, rx: TOKEN_R + 2, ry: TOKEN_R, fill: th.shadow}),
      h('circle', {r: TOKEN_R, fill: shade(PAWN[i % 3], -0.18), stroke: th.ink, 'stroke-width': 2.4}),
      h('circle', {r: TOKEN_R * 0.7, fill: PAWN[i % 3]}),
      h('circle', {name: `fp-ring${i}`, r: TOKEN_R + 9, fill: 'none', stroke: f.rel === 'shared' ? sheetDark(ctx) : NEUTRAL, 'stroke-width': f.rel === 'shared' ? 6 : 4.5, 'stroke-dasharray': f.rel === 'shared' ? null : '7 6', opacity: 0})) : null));
    const factSheet = g({name: 'L-facts'},
      g({name: 'L-facts-flat'},
        sheetFrame('f', 'rgba(255,255,255,0.35)', th.inkSoft, 1),
        h('path', {d: `M18 18H${st.w - 18}V${st.h - 18}H18Z`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '10 10', opacity: 0.6}),
        factPawns));

    /* --- side parts: built at the origin, then stacked in their column with a label above each - */
    const parts = {};
    const colW = id => ([...G.cols, ...(G.side ? [G.side] : [])].find(c => c.items.includes(id)) || {w: 300}).w;
    // pf: text factor of the parts (1 unless a column would run past the bottom; never below 16 px)
    const partMin = {};
    const buildParts = pf => {
    {
      const Hw = colW('hierarchy');
      const levels = p.hierarchy.levels.slice(0, 2);
      const nL = levels.length;
      const place = i => clamp(Math.round(p.hierarchy.placement[i] ?? Math.min(i, nL - 1)), 0, nL - 1);
      const rows = levels.map((lv, li) => {
        const books = p.sources.slice(0, 2).map((_, si) => si).filter(si => place(si) === li);
        // the plate takes the width the row's books leave free
        const f = showKey ? fitWords(ctx, lv, {maxWidth: Hw - 66 - 34 * books.length, size: Math.max(16, 20 * pf), minSize: 16, maxLines: 2, weight: 700}) : null;
        return {f, h: Math.max(48, (f ? f.height : 24) + 18), books};
      });
      partMin.hierarchy = Math.min(99, ...rows.filter(rw => rw.f).map(rw => rw.f.size));
      const hh = rows.reduce((a, rw) => a + rw.h + 8, 0) + 16;
      const parts2 = [
        h('path', {d: roundRectPath(5, 7, Hw, hh, 12), fill: th.shadow}),
        h('path', {d: roundRectPath(0, 0, Hw, hh, 12), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2.4}),
      ];
      let yy = 12;
      rows.forEach(rw => {
        parts2.push(h('path', {d: roundRectPath(10, yy, Hw - 20, rw.h, 8), fill: '#e7dcc4', stroke: th.ink, 'stroke-width': 1.6}));
        const pw = rw.f ? rw.f.width + 34 : 130;
        parts2.push(h('path', {d: roundRectPath(20, yy + (rw.h - (rw.f ? rw.f.height + 10 : 30)) / 2, pw, rw.f ? rw.f.height + 10 : 30, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}));
        if (rw.f) parts2.push(textBlock(rw.f, {x: 20 + pw / 2, y: yy + (rw.h - rw.f.height) / 2, anchor: 'middle', fill: '#3d2c0c'}));
        rw.books.forEach((si, k) => {
          const c = si ? '#6b3f4f' : '#2f4a6b';
          const bx = Hw - 40 - k * 34;
          parts2.push(h('path', {d: roundRectPath(bx, yy + 6, 24, rw.h - 12, 4), fill: c, stroke: th.ink, 'stroke-width': 1.8}));
          parts2.push(h('rect', {x: bx, y: yy + 6, width: 7, height: rw.h - 12, rx: 3, fill: shade(c, -0.3)}));
        });
        yy += rw.h + 8;
      });
      parts.hierarchy = {art: g(null, parts2), w: Hw, h: hh};
    }
    {
      // every supplied source is a book (side by side, same height); [0] holds the article slip
      const srcs = p.sources.slice(0, 2);
      const Sw0 = colW('source') - 10;
      // side by side while each book keeps room for its title (no ellipsis, no broken word); stacked otherwise
      const sideBy = srcs.length > 1 && srcs.every(sv => bookFitsWhole(ctx, sv, (Sw0 - 14) / 2, pf));
      const Sw = sideBy ? (Sw0 - 14) / 2 : Sw0;
      const hs = srcs.map(sv => Math.max(bookNeed(ctx, sv, Sw, pf), sideBy ? G.bookMin ?? 120 : 90));
      const bh = sideBy ? Math.max(...hs) : 0;
      let yb = 0;
      const bs = srcs.map((sv, si) => {
        const b = bookCover(ctx, {prefix: `P-source-b${si}`, x: sideBy ? si * (Sw + 14) : 0, y: sideBy ? 0 : yb, w: Sw, h: sideBy ? bh : hs[si], source: sv, fs: pf, color: si ? '#6b3f4f' : undefined});
        yb += hs[si] + 14;
        return b;
      });
      parts.source = {art: g(null, bs.map(b => b.node)), w: Sw0 + 8, h: (sideBy ? bh : yb - 14) + 10};
      partMin.source = Math.min(99, ...bs.map(b => b.minSize ?? 99));
    }
    {
      const Aw = Math.min(colW('article') - 12 - (G.beside && G.beside.of === 'article' ? G.beside.w + 8 : 0), 400);
      const a = articleSlip(ctx, {prefix: 'P-article-slip', passage: res.passage, zoneIdx: res.textZone, W: Aw, fs: Math.max(16 / 22, S / 22 * pf)});
      parts.article = {art: a.node, w: a.W + 6, h: a.H + 8};
      partMin.article = a.minSize ?? 99;
    }
    };
    {
      const Lg = G.lupa;
      const lp = lupaArt(ctx, {prefix: 'P-lupa', R: Lg.R, L: Lg.L});
      const len = Lg.R + 12 + Lg.L;
      const w = Lg.rot === -90 ? len + Lg.R + 12 : 2 * Lg.R + 12, hh = Lg.rot === -90 ? 2 * Lg.R + 12 : len + Lg.R + 12;
      parts.reading = {art: g({transform: T(Lg.R + 6, Lg.R + 6, Lg.rot)}, lp.back, lp.front), w, h: hh};
    }
    const Kg = G.key;
    const keySize = Math.min(18, S - 2);
    const labelH = showKey ? S + (G.labelPad ?? 18) : 10;
    const GAP = G.gap ?? 22;
    // stack every column (label, part, gap)
    // a relationship between two neighbours of a column gets room for its caption in the gap
    const relGap = (a, b) => {
      if (!showAll || !a) return 0;
      const rl = p.relationships.find(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
      if (!rl || !present.has(a) || !present.has(b)) return 0;
      // one line across the column when it fits (the caption sits in the gap, centred on its connector)
      const cw = Math.min(360, (G.cols.find(c => c.items.includes(b)) || {w: 300}).w - 30);
      const f = fitWords(ctx, rl.label || p.relationLabels[rl.kind] || rl.kind, {maxWidth: cw, size: S - 4, minSize: 16, maxLines: 2, weight: 600});
      return f.height + 22;
    };
    // the gaps are opened (in column order) only while the column still fits its height budget
    const flagRoom = S + 44;
    const budget = st.below ? SH - (40 + 2 * st.pitch + st.h * SQ + 12 + flagRoom) : SH - 8;
    const itemH = id => (id === 'key' ? keyHeight(ctx, G.cols.find(c => c.items.includes('key')).w, keySize, false) + 14 : labelH + parts[id].h + GAP);
    const colNeed = col => col.y + col.items.reduce((a, id) => a + itemH(id), 0) - GAP;
    const withGaps = col => colNeed(col) + col.items.reduce((acc, id, k) => acc + relGap(col.items[k - 1], id), 0);
    // (0.79: the smallest factor that keeps every part's text, book notes included, at 16 px or more)
    const PFS = [1, 0.92, 0.84, 0.79];
    let pfNoGap = PFS[PFS.length - 1];
    for (const pf of PFS) {
      buildParts(pf);
      if (G.cols.every(col => colNeed(col) <= (st.below ? budget : SH - 6))) { pfNoGap = pf; break; }
    }
    if (gapFirst) {
      // the parts' text steps down until the column also holds the captions' gaps: to 16 px where the
      // text already had to shrink, never below the ~19.5 px baseline size otherwise
      for (const pf of PFS.filter(q => q <= pfNoGap || 22 * q >= 20)) {
        buildParts(pf);
        if (G.cols.every(col => withGaps(col) <= (st.below ? budget : SH - 6))) break;
        if (pf === PFS[PFS.length - 1]) buildParts(pfNoGap);
      }
    }
    const gapsOf = col => {
      let used = col.y + col.items.reduce((a, id) => a + itemH(id), 0) - GAP;
      return col.items.map((id, k) => {
        const gp = relGap(col.items[k - 1], id);
        if (!gp || used + gp > budget) return 0;
        used += gp;
        return gp;
      });
    };
    let colBottom = 0;
    for (const col of G.cols) {
      let y = col.y;
      const gaps = gapsOf(col);
      for (const [k, id] of col.items.entries()) {
        y += gaps[k];
        if (id === 'key') {
          const kh = keyHeight(ctx, col.w, keySize, false);
          parts.key = {box: {x: col.x, y: y + 6, w: col.w, h: kh}};
          y += kh + 14;
          continue;
        }
        const pt = parts[id];
        const x = id === 'reading' ? col.x + (col.w - pt.w) / 2 : col.x;
        pt.box = {x, y: y + labelH, w: pt.w, h: pt.h};
        pt.node = g({name: `P-${id}`, transform: T(x, y + labelH)}, pt.art);
        if (G.beside && G.beside.of === id) {
          // the beside part: centred in the strip right of this one, below its own (narrow) label
          const bp = parts[G.beside.id];
          const bl = showKey ? chip(ctx, label(G.beside.id), {x: 0, y: 0, anchor: 'middle', maxWidth: G.beside.w + 28, size: S - 2, minSize: 16, maxLines: 3, weight: 700}).box.h + 6 : 10;
          const bx = col.x + col.w - G.beside.w / 2 - bp.w / 2;
          // (top-aligned with the part's own label, so a connector can leave the part below it)
          const by = pt.box.y - labelH + 0.5 + bl;
          bp.box = {x: bx, y: by, w: bp.w, h: bp.h};
          bp.node = g({name: `P-${G.beside.id}`, transform: T(bx, by)}, bp.art);
          bp.labelH = bl;
        }
        y += labelH + pt.h + GAP;
      }
      colBottom = Math.max(colBottom, y);
    }
    // the stack: below the columns (portrait) or at its own top
    /* --- zone flags (on the zone board's front edge) and fact tags (upright, beside each pawn) - */
    const flags = showKey ? B.zones.map((zn, j) => {
      const xs = zn.tiles.filter(q => q.cy > B.inner.y + B.inner.h * 0.55).map(q => q.cx);
      const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : zn.centroid.x;
      // (with a caption lane beside the stack the flags stay within the stack's width: narrower, more lines)
      const fo = {maxWidth: Math.max(G.lane ? 92 : 140, (st.w + 20 - 12 * (B.n - 1)) / B.n - 40), size: S, minSize: 16, weight: 700};
      // two lines (shrinking to 16 px) before a third one
      let f = fitWords(ctx, names[j], {...fo, maxLines: 2});
      if (f.truncated || brokeWord(f)) f = fitWords(ctx, names[j], {...fo, maxLines: 3});
      if (f.truncated || brokeWord(f)) f = fitWords(ctx, names[j], {...fo, maxLines: 4});
      return {j, cx: st.x + cx, f, pw: f.width + 40, ph: f.height + 12};
    }) : [];
    // flags keep their zone's order and never overlap (their swatch names the zone)
    {
      const byX = flags.slice().sort((a, b) => a.cx - b.cx);
      byX.forEach((fl, k) => { fl.x = Math.max(fl.cx - fl.pw / 2, k ? byX[k - 1].x + byX[k - 1].pw + 12 : st.x - 10); });
      for (let k = byX.length - 1; k >= 0; k--) {
        const lim = k === byX.length - 1 ? st.x + st.w + 10 : byX[k + 1].x - 12;
        byX[k].x = Math.min(byX[k].x, lim - byX[k].pw);
      }
    }
    // the pitch shrinks (never below the room a sheet tab needs) so the flags and the key stay inside
    const top0 = st.below ? colBottom - GAP + 40 : st.top;
    const flagsH = flags.length ? Math.max(...flags.map(f => f.ph)) : 0;
    const floor = (Kg.strip ? Kg.bottom - keyHeight(ctx, Kg.w, keySize, true) - 8 : SH - 4) - flagsH - 18;
    const pitch = clamp((floor - top0 - st.h * SQ) / 2, st.h * SQ + 40, st.pitch);
    const tops = [top0, top0 + pitch, top0 + 2 * pitch];
    hardTop = top0;
    {
      const sideParts = Object.entries(parts).filter(([id]) => !['zones', 'text', 'facts'].includes(id) && parts[id].box);
      // each part with the label above it
      const withLabels = sideParts.map(([id, q]) => (id === 'key' ? q.box : {x: q.box.x, y: q.box.y - (q.labelH ?? labelH), w: Math.max(q.box.w, 120), h: q.box.h + (q.labelH ?? labelH)}));
      tagPos = tagPosFor(pitch - 40, withLabels);
    }
    // side column (portrait): each part centred on the sheet it connects to, never overlapping the previous one
    if (G.side) {
      // below the top row, with room for the caption of a relationship that links the two
      const capRoom = Math.max(0, ...G.cols.flatMap(c => c.items.map(it => relGap(it, G.side.items[0]))));
      let yMin = Math.max(top0 - 30, colBottom - GAP + capRoom + 6);
      G.side.items.forEach((id, k) => {
        const li = LAYERS.indexOf(G.side.align[k]);
        const cy = tops[li] + (st.h * SQ) / 2;
        if (id === 'key') {
          const kh = keyHeight(ctx, G.side.w, keySize, false);
          const y = Math.min(SH - 4 - kh, Math.max(yMin, cy - kh / 2));
          parts.key = {box: {x: G.side.x, y, w: G.side.w, h: kh}};
          yMin = y + kh + GAP;
          return;
        }
        const pt = parts[id];
        const blockH = labelH + pt.h;
        const y = Math.max(yMin, cy - blockH / 2);
        pt.box = {x: G.side.x, y: y + labelH, w: pt.w, h: pt.h};
        pt.node = g({name: `P-${id}`, transform: T(G.side.x, y + labelH)}, pt.art);
        yMin = y + blockH + GAP;
      });
    }
    ['zones', 'text', 'facts'].forEach(id => {
      const li = LAYERS.indexOf(id);
      parts[id] = {box: layerBox(li)};
    });

    // generic captions (part labels, sheet tabs, relation captions) never outgrow the smallest supplied content
    const contentMin = Math.min(99, ...tagPos.filter(q => q && q.fit).map(q => q.fit.size), ...flags.map(fl => fl.f.size), ...Object.values(partMin));
    const LAB = Math.max(16, Math.min(S - 2, Math.floor(contentMin * 2) / 2)), REL = Math.max(16, Math.min(S - 4, Math.floor(contentMin * 2) / 2));
    /* --- labels ------------------------------------------------------------------------------ */
    const labelNodes = [];
    const labelBoxes = [];
    const elementLabel = (id, x, y, anchor = 'start', mw = 360, ml = 2) => {
      if (!present.has(id) || !showKey) return null;
      const c = chip(ctx, label(id), {x, y, anchor, maxWidth: mw, size: LAB, minSize: 16, maxLines: ml, fill: th.card, weight: 700, name: `lab-${id}`});
      labelNodes.push(c.node);
      labelBoxes.push({id, ...c.box});
      return c;
    };
    // parts: label above each part
    for (const id of ['hierarchy', 'source', 'article']) elementLabel(id, parts[id].box.x, parts[id].box.y - labelH + 0.5);
    // sheets: a tab above the left end of each sheet (moves with the sheet)
    const tabs = {};
    LAYERS.forEach((id, li) => {
      if (!present.has(id) || !showKey) return;
      const c = chip(ctx, label(id), {x: st.x + 10, y: -40, anchor: 'start', maxWidth: 360, size: LAB, minSize: 16, maxLines: 1, fill: th.card, weight: 700, name: `lab-${id}`});
      tabs[id] = c;
    });
    const rb = parts.reading.box;
    if (parts.reading.labelH) elementLabel('reading', rb.x + rb.w / 2, rb.y - parts.reading.labelH, 'middle', G.beside.w + 28, 3);
    else elementLabel('reading', rb.x + rb.w / 2, rb.y - labelH + 0.5, 'middle');

    const tagNodes = res.facts.map((f, i) => {
      const q = placed.slots[i];
      if (!q) return null;
      const tp = tagPos[i];
      const fit = tp.fit;
      const tw = tp.w, tH = tp.h;
      const x0 = tp.x, y0 = tp.y;
      const lf = tp.side === 'left', vt = tp.side === 'top' || tp.side === 'bottom';
      const ly = clamp(q.y * SQ, y0 + 8, y0 + tH - 8);
      const fx = clamp(q.x, x0 + 6, x0 + tw - 6), fy = clamp(q.y * SQ, y0 + 4, y0 + tH - 4);
      const lead = tp.side === 'free' ? `M${r(q.x)} ${r(q.y * SQ)}L${r(fx)} ${r(fy)}` : vt ? `M${r(q.x)} ${r(q.y * SQ)}L${r(clamp(q.x, x0 + 10, x0 + tw - 10))} ${r(tp.side === 'top' ? y0 + tH - 2 : y0 + 2)}`
        : `M${r(lf ? q.x - TOKEN_R + 4 : q.x + TOKEN_R - 4)} ${r(q.y * SQ)}L${r(lf ? x0 + tw - 2 : x0 + 2)} ${r(ly)}`;
      return g({transform: `translate(${st.x} 0)`},
        h('path', {d: lead, stroke: th.inkSoft, 'stroke-width': 2.4}),
        h('path', {d: roundRectPath(x0 + 3, y0 + 4, tw, tH, 7), fill: th.shadow}),
        h('path', {d: roundRectPath(x0, y0, tw, tH, 7), fill: '#fffdf6', stroke: th.ink, 'stroke-width': 2}),
        h('rect', {x: x0 + 8, y: y0 + 7, width: 5, height: tH - 14, rx: 2.5, fill: PAWN[i % 3]}),
        fit ? textBlock(fit, {x: x0 + 19, y: y0 + 8, fill: th.ink}) : h('rect', {x: x0 + 19, y: y0 + tH / 2 - 4, width: tw - 30, height: 8, rx: 4, fill: th.paperLine}));
    });

    const kh = keyHeight(ctx, Kg.w, keySize, Kg.strip);
    const key = parts.key ? keyCard(ctx, {prefix: 'mkey', x: parts.key.box.x, y: parts.key.box.y, w: parts.key.box.w, size: keySize})
      : keyCard(ctx, {prefix: 'mkey', x: Kg.x, y: Kg.bottom - kh, w: Kg.w, size: keySize, strip: Kg.strip});
    /* --- relations ----------------------------------------------------------------------------- */
    const elements = {};
    // connectors meet a side part on its right-hand strip (the part's label sits at its top-left, so a connector
    // between two parts of a column never runs through a label); a part with a neighbour beside it is met at its
    // lower right corner, under that neighbour
    const anchorBox = id => {
      const b = parts[id].box;
      if (LAYERS.includes(id) || id === 'reading') return b;
      if (G.beside && G.beside.of === id) return {x: b.x + b.w - 44, y: b.y + b.h - 34, w: 44, h: 34};
      // (a wide part above the side column is met above that column's right-hand strip)
      const right = G.side && !G.side.items.includes(id) ? Math.min(b.x + b.w, G.side.x + G.side.w) : b.x + b.w;
      return {x: right - 44, y: b.y, w: 44, h: b.h};
    };
    for (const id of IDS) if (present.has(id)) elements[id] = {box: anchorBox(id)};
    const rels = p.relationships.filter(rl => elements[rl.from] && elements[rl.to] && rl.from !== rl.to);
    const noLabelCtx = {...ctx, show: () => false};
    // a connector between a part and a sheet never runs across another sheet: its bend is tried in turn
    // final places of everything carrying text: parts, their labels, sheet tabs, zone flags, fact tags
    const tabBoxes = Object.entries(tabs).map(([id, c]) => ({...c.box, y: c.box.y + tops[LAYERS.indexOf(id)]}));
    const flagBoxes = flags.map(fl => ({x: fl.x, y: tops[2] + st.h * SQ + 18, w: fl.pw, h: fl.ph}));
    const tagBoxes = res.facts.map((f, i) => {
      const q = placed.slots[i];
      if (!q || !tagFits[i] || !tagPos[i]) return null;
      return {x: st.x + tagPos[i].x, y: tops[0] + tagPos[i].y, w: tagPos[i].w, h: tagPos[i].h};
    }).filter(Boolean);
    // the pawns on the fact layer and the slip on the text's sheet stay uncovered too
    const pawnBoxes = placed.slots.filter(Boolean).map(q => ({x: st.x + q.x - TOKEN_R - 8, y: tops[0] + (q.y - TOKEN_R - 8) * SQ, w: 2 * TOKEN_R + 16, h: (2 * TOKEN_R + 16) * SQ}));
    const slipBox = sp ? [{x: st.x + sp.x, y: tops[1] + sp.y * SQ, w: slipFlat.W, h: slipFlat.H * SQ}] : [];
    const obst = [...pawnBoxes, ...slipBox, ...Object.entries(parts).filter(([id]) => !LAYERS.includes(id)).map(([, q]) => q.box), ...labelBoxes, ...tabBoxes, ...flagBoxes, ...tagBoxes, key.box];
    // texts and props a connector must not cross (besides its own two parts)
    const textObst = [...labelBoxes, ...tabBoxes, ...flagBoxes, ...tagBoxes, ...slipBox, key.box];
    const inside = (q, b, m = 2) => q.x > b.x + m && q.x < b.x + b.w - m && q.y > b.y + m && q.y < b.y + b.h - m;
    const crossOf = x => {
      const own = [x.rel.from, x.rel.to];
      // (its own parts too: a connector meets a part at its edge and never runs across it)
      const others = Object.entries(parts).filter(([id]) => !LAYERS.includes(id) && id !== 'key').map(([id, q]) => ({id, b: q.box}));
      for (let k = 1; k < 60; k++) {
        const q = x.c.at(k / 60);
        const tb = textObst.find(b => inside(q, b));
        if (tb) return `${x.rel.from}>${x.rel.to} over text ${[labelBoxes, tabBoxes, flagBoxes, tagBoxes, slipBox].findIndex(a => a.includes(tb))}`;
        const pb = others.find(o => inside(q, o.b));
        if (pb) return `${x.rel.from}>${x.rel.to} over ${pb.id}`;
      }
      return sheetCross(x);
    };
    const sheetCross = x => {
      const own = [x.rel.from, x.rel.to];
      // a link between two sheets runs behind the translucent sheet between them (they are layers of one stack)
      if (own.every(id => LAYERS.includes(id))) return null;
      const bad = LAYERS.filter(id => !own.includes(id) && present.has(id)).map(id => ({id, b: layerBox(LAYERS.indexOf(id))}));
      for (let k = 1; k < 40; k++) {
        const q = x.c.at(k / 40);
        const inB = bad.find(o => q.x > o.b.x + 4 && q.x < o.b.x + o.b.w - 4 && q.y > o.b.y + 4 && q.y < o.b.y + o.b.h - 4);
        if (inB) return `${x.rel.from}>${x.rel.to} over ${inB.id}`;
      }
      return null;
    };
    const BENDS = [null, 0.2, -0.2, 0.3, -0.3, 0.45, -0.45, 0.6, -0.6, 0.8, -0.8];
    const bendIdx = rels.map(() => 0);
    let graph = null;
    // a link between two sheets runs down the stack's right-hand side (clear of the tabs at the left and of the tags)
    // (or, when a tag hangs there, down its middle or its left-hand side)
    const elementsG = {...elements};
    // ('out': outside the stack, along its right-hand edges)
    const SIDES = [0.97, 'out', 0.5, 0.8, 0.3, 0.65, 0.15, 0.4, 0.88];
    for (const id of LAYERS) {
      if (!elements[id]) continue;
      const b = elements[id].box;
      SIDES.forEach(f => { if (f !== 'out') elementsG[`${id}@${f}`] = {box: {x: b.x + b.w * f - 18, y: b.y, w: 36, h: b.h}}; });
      elementsG[`${id}@out`] = {box: {x: b.x + b.w - 6, y: b.y + b.h * 0.5 - 3, w: 6, h: 6}};
    }
    // two side parts one above the other are joined at their right-hand corners, bottom of the upper to top of the lower
    // (the connector leaves and meets each part at its edge, never across it)
    const sidePart = id => !LAYERS.includes(id) && id !== 'reading' && elements[id];
    for (const id of IDS) {
      if (!sidePart(id)) continue;
      const b = anchorBox(id);
      elementsG[`${id}@top`] = {box: {x: b.x, y: parts[id].box.y, w: b.w, h: 6}};
      elementsG[`${id}@bot`] = {box: {x: b.x, y: parts[id].box.y + parts[id].box.h - 6, w: b.w, h: 6}};
    }
    const vpair = rl => {
      if (!sidePart(rl.from) || !sidePart(rl.to)) return rl;
      const up = parts[rl.from].box.y < parts[rl.to].box.y;
      return {...rl, from: `${rl.from}@${up ? 'bot' : 'top'}`, to: `${rl.to}@${up ? 'top' : 'bot'}`};
    };
    // a part meets a sheet at a point of the sheet's facing edge (tried in turn when a text is in the way)
    const EDGE = [null, 0.5, 0.25, 0.75, 0.1, 0.9];
    for (const id of LAYERS) {
      if (!elements[id]) continue;
      const b = elements[id].box;
      EDGE.slice(1).forEach(f => {
        elementsG[`${id}@L${f}`] = {box: {x: b.x, y: b.y + b.h * f - 3, w: 6, h: 6}};
        elementsG[`${id}@R${f}`] = {box: {x: b.x + b.w - 6, y: b.y + b.h * f - 3, w: 6, h: 6}};
      });
    }
    const psheet = (rl, k) => {
      if (!EDGE[k]) return rl;
      const sh = LAYERS.includes(rl.from) ? 'from' : LAYERS.includes(rl.to) ? 'to' : null;
      if (!sh) return rl;
      const other = parts[sh === 'from' ? rl.to : rl.from].box;
      const side = other.x + other.w / 2 < st.x + st.w / 2 ? 'L' : 'R';
      return {...rl, [sh]: `${rl[sh]}@${side}${EDGE[k]}`};
    };
    const sideIdx = rels.map(() => 0);
    const nAlt = rl => (LAYERS.includes(rl.from) && LAYERS.includes(rl.to) ? SIDES.length : (LAYERS.includes(rl.from) || LAYERS.includes(rl.to)) ? EDGE.length : 1);
    const relsOf = () => rels.map((rl, i) => (LAYERS.includes(rl.from) && LAYERS.includes(rl.to) ? {...rl, from: `${rl.from}@${SIDES[sideIdx[i]]}`, to: `${rl.to}@${SIDES[sideIdx[i]]}`} : psheet(vpair(rl), sideIdx[i])));
    for (let it = 0; it < BENDS.length * SIDES.length + 4; it++) {
      const relsG = relsOf();
      graph = relationGraph(noLabelCtx, {name: 'rel', elements: elementsG, relationships: relsG, relationLabels: p.relationLabels,
        bend: (rl, i) => (BENDS[bendIdx[i]] ?? (i % 2 ? 0.12 : -0.12))});
      // (the graph keeps the supplied ids: the tracer and the checks see the real parts)
      graph.conns.forEach((x, i) => { x.rel = rels[i]; });
      let again = false;
      graph.conns.forEach((x, i) => {
        if (!crossOf(x)) return;
        if (bendIdx[i] < BENDS.length - 1) { bendIdx[i]++; again = true; } else if (sideIdx[i] < nAlt(rels[i]) - 1) { sideIdx[i]++; bendIdx[i] = 0; again = true; }
      });
      if (!again) break;
    }
    const relLabels = [];
    const relLabelHits = [];
    if (showAll) {
      const placedR = [];
      // points along every connector (a caption never sits on another connector)
      const connSamples = graph.conns.flatMap((x, j) => Array.from({length: 41}, (_, k) => [j, x.c.at(k / 40)]));
      // points along the leads already drawn (a later caption never sits on them)
      const leadSamples = [];
      graph.conns.forEach((x, i) => {
        const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
        const col = kindColor(ctx, x.rel.kind);
        const cands = [];
        for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7]) {
          const m = x.c.at(tt);
          for (const d of [0, 34, -34, 60, -60, 90, -90]) cands.push({x: m.x, y: m.y - 18 + d, anchor: 'middle', maxWidth: 240, at: m});
          for (const dx of [130, -130, 190, -190]) cands.push({x: m.x + dx, y: m.y - 18, anchor: 'middle', maxWidth: 240, at: m});
        }
        // a wide one-line chip centred on the connector (in a gap opened between two parts of a column)
        for (const tt of [0.5, 0.4, 0.6]) {
          const m = x.c.at(tt);
          for (const d of [0, -8, 8]) cands.push({x: m.x, y: m.y - 16 + d, anchor: 'middle', maxWidth: 380, maxLines: 1, at: m});
        }
        // two neighbours of the column with no gap opened for their caption: the caption stands in the lane,
        // level with the narrow gap between them, and a short horizontal lead runs along that gap
        if (G.lane) {
          const colOf = id => G.cols.find(c => c.items.includes(id));
          const A = parts[x.rel.from], Bp = parts[x.rel.to];
          if (colOf(x.rel.from) && colOf(x.rel.from) === colOf(x.rel.to) && A.box && Bp.box) {
            const [up, dn] = A.box.y < Bp.box.y ? [A, Bp] : [Bp, A];
            const gy = up.box.y + up.box.h + 3;
            let best0 = null, bd0 = Infinity;
            for (let k = 0; k <= 60; k++) { const m = x.c.at(k / 60); if (Math.abs(m.y - gy) < bd0) { bd0 = Math.abs(m.y - gy); best0 = m; } }
            if (best0 && dn.box.y - labelH - gy > 0) {
              const at = {x: best0.x, y: gy};
              for (const d of [0, -20, 20, -40, 40, -70, 70]) cands.push({x: G.lane.x + G.lane.w / 2, y: gy - 30 + d, anchor: 'middle', maxWidth: G.lane.w - 4, maxLines: 5, at, lane: true});
            }
          }
        }
        // in the lane between the column and the stack, where the connector crosses it
        if (G.lane) {
          const lx = G.lane.x + G.lane.w / 2;
          for (let k = 0; k <= 40; k++) {
            const m = x.c.at(k / 40);
            if (Math.abs(m.x - lx) > 12) continue;
            for (const d of [0, -30, 30, -60, 60, -90, 90, -120, 120]) cands.push({x: lx, y: m.y - 26 + d, anchor: 'middle', maxWidth: G.lane.w - 4, maxLines: 3, at: m});
          }
        }
        // narrow, centred on the connector (in a lane between two columns)
        for (const tt of [0.5, 0.4, 0.6]) {
          const m = x.c.at(tt);
          for (const d of [0, -30, 30, -50]) cands.push({x: m.x, y: m.y - 26 + d, anchor: 'middle', maxWidth: 124, maxLines: 3, at: m});
        }
        // beside the connector (in a narrow gap between two parts of a column)
        for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7]) {
          const m = x.c.at(tt);
          for (const dy of [-16, -30, -4, -44, 10]) {
            cands.push({x: m.x + 12, y: m.y + dy, anchor: 'start', maxWidth: clamp(SW - m.x - 24, 120, 240), at: m});
            cands.push({x: m.x - 12, y: m.y + dy, anchor: 'end', maxWidth: clamp(m.x - 24, 120, 240), at: m});
          }
        }
        // a wider search round the whole connector (the caption keeps its size; only its wrap changes)
        const gridBase = {};
        for (const mw of [120, 140, 200, 260]) {
          gridBase[mw] = chip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: REL, minSize: 16, maxLines: 4, fill: th.card, stroke: col, weight: 600});
          const gb = gridBase[mw].box;
          for (let tt = 0.15; tt < 0.9; tt += 0.1) {
            const m = x.c.at(tt);
            for (let dx = -240; dx <= 240; dx += 15) for (let dy = -160; dy <= 160; dy += 10) cands.push({grid: mw, x: m.x + dx - gb.w / 2, y: m.y + dy - gb.h / 2, at: m});
          }
        }
        const build = cnd => {
          if (cnd.grid) {
            const base = gridBase[cnd.grid];
            return {node: g({name: `rl${i}`, transform: T(cnd.x, cnd.y)}, base.node), box: {...base.box, x: cnd.x, y: cnd.y}, fit: base.fit, cnd};
          }
          const c = chip(ctx, text, {x: cnd.x, y: cnd.y, anchor: cnd.anchor, maxWidth: cnd.maxWidth, size: REL, minSize: 16, maxLines: cnd.maxLines ?? 2, fill: th.card, stroke: col, weight: 600, name: `rl${i}`});
          return {...c, cnd};
        };
        let best = null;
        // clear of every text and part, then also of the sheets (first pass), of the opaque zone board (second)
        const sheetsSoft = [0, 1, 2].map(li => ({...layerBox(li), h: st.h * SQ + (li === 2 ? 12 : 0)}));
        const gapTo = (bx, at) => Math.hypot(clamp(at.x, bx.x, bx.x + bx.w) - at.x, clamp(at.y, bx.y, bx.y + bx.h) - at.y);
        for (const soft of [sheetsSoft, [sheetsSoft[2]]]) {
          let bd = Infinity;
          for (const cnd of cands) {
            const b = build(cnd);
            if (b.fit.truncated) continue;
            if (cnd.lane && !(b.box.y + 6 <= cnd.at.y && cnd.at.y <= b.box.y + b.box.h - 6)) continue;
            if (b.box.x < 4 || b.box.x + b.box.w > SW - 4 || b.box.y < 4 || b.box.y + b.box.h > SH - 4) continue;
            if (obst.some(q => hit(b.box, q, 4)) || labelBoxes.some(q => hit(b.box, q, 10)) || placedR.some(q => hit(b.box, q, 8))) continue;
            if (soft.some(q => hit(b.box, q, 2))) continue;
            // no other connector passes under it, and its lead crosses no text, no other caption and no part
            if (connSamples.some(([j, q]) => j !== i && inside(q, b.box, -3))) continue;
            if (leadSamples.some(q => inside(q, b.box, -3))) continue;
            {
              const ex = clamp(cnd.at.x, b.box.x, b.box.x + b.box.w), ey = clamp(cnd.at.y, b.box.y, b.box.y + b.box.h);
              const len = Math.hypot(ex - cnd.at.x, ey - cnd.at.y);
              let bad = false;
              for (let k = 1; k < 20 && len > 10 && !bad; k++) {
                const q = {x: lerp(cnd.at.x, ex, k / 20), y: lerp(cnd.at.y, ey, k / 20)};
                bad = [...obst, ...labelBoxes, ...placedR].some(o => inside(q, o, 0));
              }
              if (bad) continue;
            }
            // the free spot closest to its connector (short or no lead); in the second pass, the one lying least
            // over the clear sheets (seated in free space as far as it can be)
            const ovS = (a0, q) => Math.max(0, Math.min(a0.x + a0.w, q.x + q.w) - Math.max(a0.x, q.x)) * Math.max(0, Math.min(a0.y + a0.h, q.y + q.h) - Math.max(a0.y, q.y));
            const d = gapTo(b.box, cnd.at) + (soft === sheetsSoft ? 0 : sheetsSoft.reduce((a0, q) => a0 + ovS(b.box, q), 0) * 0.5);
            if (d < bd - 0.5) { bd = d; best = b; }
          }
          if (best) break;
        }
        // nothing free: the candidate that covers the least of the others
        if (!best) {
          const ov = (a, q, pad) => Math.max(0, Math.min(a.x + a.w, q.x + q.w) - Math.max(a.x, q.x) + pad) * Math.max(0, Math.min(a.y + a.h, q.y + q.h) - Math.max(a.y, q.y) + pad);
          let bs = Infinity;
          for (const cnd of cands) {
            const b = build(cnd);
            if (b.fit.truncated) continue;
            if (b.box.x < 4 || b.box.x + b.box.w > SW - 4 || b.box.y < 4 || b.box.y + b.box.h > SH - 4) continue;
            const onConn = connSamples.filter(([j, q]) => j !== i && inside(q, b.box, -3)).length + leadSamples.filter(q => inside(q, b.box, -3)).length;
            const sc = obst.reduce((a, q) => a + 10 * ov(b.box, q, 4), 0) + placedR.reduce((a, q) => a + 20 * ov(b.box, q, 6), 0) + ov(b.box, sheetsSoft[2], 0) * 3 + ov(b.box, sheetsSoft[0], 0) + ov(b.box, sheetsSoft[1], 0) + onConn * 4000;
            if (sc < bs) { bs = sc; best = b; }
          }
          if (!best) best = build(cands[0]);
        }
        placedR.push(best.box);
        // hard: over text, a part, another caption; soft: over the opaque zone board
        relLabelHits.push({label: text, text: obst.some(q => hit(best.box, q, 0)) || labelBoxes.some(q => hit(best.box, q, 0)) || placedR.slice(0, -1).some(q => hit(best.box, q, 0)), board: hit(best.box, sheetsSoft[2], -2), sheet: sheetsSoft.some(q => hit(best.box, q, -2))});
        // a dotted lead from the connector to the nearest edge of a label that sits away from it
        const at = best.cnd.at, bb = best.box;
        const ex = clamp(at.x, bb.x, bb.x + bb.w), ey = clamp(at.y, bb.y, bb.y + bb.h);
        if (Math.hypot(ex - at.x, ey - at.y) > 10) for (let k = 0; k <= 30; k++) leadSamples.push({x: lerp(at.x, ex, k / 30), y: lerp(at.y, ey, k / 30)});
        const lead = Math.hypot(ex - at.x, ey - at.y) > 10
          ? h('line', {x1: r(at.x), y1: r(at.y), x2: r(ex), y2: r(ey), stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null;
        relLabels.push(g({name: `rlg${i}`, opacity: 0}, lead, best.node));
      });
    }
    // a connector never runs across a sheet that is not one of its two ends
    const crossings = graph.conns.map(sheetCross).filter(Boolean);
    const connTextCross = graph.conns.map(crossOf).filter(Boolean);
    const order = p.traversalOrder.filter(id => elements[id]);
    const route = graph.route(order);

    /* --- key + drop lines ---------------------------------------------------------------------- */
    const drops = res.facts.map((f, i) => (placed.slots[i] ? h('line', {name: `drop${i}`, stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-dasharray': '6 6', opacity: 0}) : null));
    const dropSheet = h('line', {name: 'drop-sheet', stroke: sheetDark(ctx), 'stroke-width': 2.4, 'stroke-dasharray': '6 6', opacity: 0});

    // the opening: the stacked sheets, large and centred in the frame
    // (landscape opens larger: the stack's height is the limit there)
    const openK = Math.max(1, Math.min(shape === 'landscape' ? 2.2 : 1.7, (SW - 40) / st.w, (SH * (shape === 'landscape' ? 0.8 : 0.72)) / (st.h * SQ + 60)));
    const openC = {x: st.x + st.w / 2, y: tops[2] + (st.h * SQ) / 2};
    // each side part (with its label) fades in as soon as the shrinking stack no longer covers it: no near-empty
    // beat after the stack settles, and nothing ever lies under the stack while it moves
    const stackExt = {x: st.x - 6, y: tops[0] - 50, w: st.w + 12, h: tops[2] + st.h * SQ + 70 - (tops[0] - 50)};
    // the stack's own extent (unscaled) while its sheets are apart by `sp`: sheets with shadows and the board's edge,
    // tabs, tags and flags
    const tagExt = tagPos.filter(Boolean);
    const flagH = flags.length ? Math.max(...flags.map(f => f.ph)) : 0;
    const flagX0 = flags.length ? Math.min(...flags.map(f => f.x)) : st.x, flagX1 = flags.length ? Math.max(...flags.map(f => f.x + f.pw)) : st.x + st.w;
    const extAt = sp => {
      const ys = tops.map(tp => lerp(tops[2], tp, sp));
      let x0 = st.x, x1 = st.x + st.w + 6, y0 = ys[0], y1 = ys[2] + st.h * SQ + 14;
      Object.keys(tabs).forEach(id => { const b = tabs[id].box, yy = ys[LAYERS.indexOf(id)]; x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); y0 = Math.min(y0, yy + b.y); });
      tagExt.forEach(t => { x0 = Math.min(x0, st.x + t.x); x1 = Math.max(x1, st.x + t.x + t.w + 3); y0 = Math.min(y0, ys[0] + t.y); y1 = Math.max(y1, ys[0] + t.y + t.h + 4); });
      if (flags.length) { x0 = Math.min(x0, flagX0); x1 = Math.max(x1, flagX1); y1 = Math.max(y1, ys[2] + st.h * SQ + 18 + flagH); }
      return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
    };
    // the opening path: scale and centre eased as before, then held inside the frame (a 6 px margin): the stack is
    // shifted back (or, if it is wider than the frame, scaled down) wherever it would run past an edge
    const M = 6;
    const stackXf = uu => {
      const e = ease.inOutCubic(seg(uu, ...W.open));
      const em = ease.outCubic(seg(uu, ...W.open));
      const sp = ease.inOutCubic(seg(uu, ...W.separate));
      const E = extAt(sp);
      let k = lerp(openK, 1, e);
      k = Math.min(k, Math.max(1, (SW - 2 * M) / E.w), Math.max(1, (SH - 2 * M) / E.h));
      let cx = lerp(SW / 2, openC.x, em), cy = lerp(SH / 2, openC.y, em);
      const bx0 = cx + (E.x - openC.x) * k, bx1 = cx + (E.x + E.w - openC.x) * k;
      const by0 = cy + (E.y - openC.y) * k, by1 = cy + (E.y + E.h - openC.y) * k;
      if (bx1 > SW - M) cx -= bx1 - (SW - M); else if (bx0 < M) cx += M - bx0;
      if (by1 > SH - M) cy -= by1 - (SH - M); else if (by0 < M) cy += M - by0;
      return {k, cx, cy};
    };
    const stackAt = uu => {
      const {k, cx, cy} = stackXf(uu);
      return {x: cx + (stackExt.x - openC.x) * k, y: cy + (stackExt.y - openC.y) * k, w: stackExt.w * k, h: stackExt.h * k};
    };
    const revealAt = {};
    const partIds = ['hierarchy', 'source', 'article', 'reading', 'key'].filter(id => parts[id] && parts[id].box);
    for (const id of partIds) {
      const lb = labelBoxes.find(q => q.id === id);
      const box = lb ? union(parts[id].box, lb) : parts[id].box;
      let start = W.open[1];
      for (let uu = W.open[1]; uu >= W.open[0]; uu -= 0.002) { if (hit(stackAt(uu), box, 2)) break; start = uu; }
      revealAt[id] = Math.max(0.06, start);
    }
    const stackCovers = (id, uu) => {
      const lb = labelBoxes.find(q => q.id === id);
      const box = lb ? union(parts[id].box, lb) : parts[id].box;
      // (the settled stack is the final layout, laid out clear of every part)
      return uu < W.open[1] && hit(stackAt(uu), box, 0);
    };
    const stackFills = uu => { const b = stackAt(uu); return b.w >= SW * 0.6 && b.h >= SH * 0.45; };
    return {stackXf, stackFills, stackCovers, revealAt, connTextCross, relLabelHits, crossings, openK, openC, s0, ox, oy, SW, SH, G, st, B, res, placed, tops, LAYERS, parts, zonesSheet, textSheet, factSheet, tabs, flags, tagNodes, labelNodes,
      graph, relLabels, route, order, key, drops, dropSheet, rels, present, sp, slipFlat, S, labelBoxes};
}

const scene = {
  sizes: {landscape: SIZES.landscape, square: SIZES.square, portrait: SIZES.portrait},
  layout(ctx) {
    // first without shrinking anything for the relation captions; when a caption then has to sit on
    // text or on the board, again with the column's parts compacted (never below 16 px) to open the gaps
    const a = layoutOnce(ctx, false);
    const bad = L => L.relLabelHits.filter(q => q.text || q.board).length;
    if (!bad(a)) return a;
    const b = layoutOnce(ctx, true);
    return bad(b) < bad(a) ? b : a;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const sheetGroup = (id, art) => g({name: `S-${id}`},
      g({name: `S-${id}-flat`}, art),
      L.tabs[id] ? g({name: `S-${id}-tab`}, L.tabs[id].node) : null);
    return g({transform: T(L.ox, L.oy, 0, L.s0)},
      // connectors run behind the translucent sheets (a line to a lower sheet passes behind the upper one)
      L.graph.node,
      // the whole stack opens large and centred, then settles into its place
      g({name: 'stackAll'},
      // plumb lines run behind the sheets too, so tabs and tags stay clear of them
      L.dropSheet, L.drops,
      // back to front: zone board, text sheet, fact layer (the tags ride on the fact layer)
      sheetGroup('zones', L.zonesSheet),
      L.flags.length ? g({name: 'flags'}, L.flags.map(fl => {
        const {pw, ph, x} = fl;
        return g(null,
          h('path', {d: roundRectPath(x, 0, pw, ph, 6), fill: '#f6efdf', stroke: th.ink, 'stroke-width': 2}),
          h('path', {d: roundRectPath(x + 8, ph / 2 - 9, 18, 18, 4), fill: ZONE_FILL[fl.j % 3], stroke: ZONE_EDGE[fl.j % 3], 'stroke-width': 2}),
          textBlock(fl.f, {x: x + pw / 2 + 12, y: 6, anchor: 'middle', fill: th.ink}));
      })) : null,
      sheetGroup('text', L.textSheet),
      sheetGroup('facts', g(null, L.factSheet, g({name: 'tags'}, L.tagNodes)))),
      g({name: 'parts'}, ['hierarchy', 'source', 'article', 'reading'].filter(id => L.present.has(id)).map(id => g({name: `M-${id}`}, L.parts[id].node))),
      L.labelNodes,
      L.relLabels,
      tracer(ctx, 'tracer', ctx.theme.accent2),
      L.key.node);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const {st, tops} = L;
    const sep = ease.inOutCubic(seg(u, ...W.separate));
    const opn = ease.inOutCubic(seg(u, ...W.open));
    {
      // (the stack moves to its place a little ahead of its shrinking — held inside the frame all the way)
      const {k, cx, cy} = L.stackXf(u);
      nodes.stackAll = {transform: `translate(${r(cx)} ${r(cy)}) scale(${r(k, 4)}) translate(${r(-L.openC.x)} ${r(-L.openC.y)})`};
    }
    // the side parts, the key and their labels appear in place once the stack has settled (nothing slides over text)
    const RD = W.reveal[1] - W.reveal[0];
    const revOf = id => ease.outCubic(seg(u, L.revealAt[id] ?? W.reveal[0], (L.revealAt[id] ?? W.reveal[0]) + RD));
    const rev = revOf('hierarchy');
    nodes.mkey = {opacity: r(revOf('key') || (L.revealAt.key === undefined ? ease.outCubic(seg(u, ...W.reveal)) : 0), 3)};
    const baseTop = tops[2];
    const focusId = ctx.params.focusElement;
    /* tracer */
    const tr = seg(u, ...W.trace);
    const on = tr > 0 && tr < 1;
    const q = L.route.poly.at(ease.inOutSine(tr));
    const visited = L.route.visits.filter(v => ease.inOutSine(tr) >= v.t - 1e-6).map(v => v.id);
    const visitOf = id => L.route.visits.find(v => v.id === id);
    const fv = visitOf(focusId);
    const fp = fv && on ? Math.max(0, 1 - Math.abs(ease.inOutSine(tr) - fv.t) / 0.12) : 0;
    const focusScale = 1 + 0.08 * ease.inOutSine(fp);
    nodes.tracer = {transform: T(q.x, q.y), opacity: on ? 1 : 0};
    /* sheets: stacked → apart; the focus one swells */
    L.LAYERS.forEach((id, li) => {
      const y = lerp(baseTop, tops[li], sep);
      const sc = id === focusId ? focusScale : 1;
      const cx = st.x + st.w / 2, cy = y + (st.h * 0.5) / 2;
      nodes[`S-${id}`] = {transform: `translate(${r(cx)} ${r(cy)}) scale(${r(sc, 4)}) translate(${r(-cx)} ${r(-cy)})`};
      nodes[`S-${id}-flat`] = {transform: `translate(0 ${r(y)})`};
      // a sheet's tab appears once the sheets are apart (no sheet passes over it)
      if (L.tabs[id]) nodes[`S-${id}-tab`] = {transform: `translate(0 ${r(y)})`, opacity: r(seg(sep, 0.8, 1), 3)};
    });
    {
      const clear = seg(sep, 0.85, 1);
      nodes['sheet-t-fill'] = {'fill-opacity': r(lerp(1, 0.35, clear), 3)};
      nodes['sheet-f-fill'] = {'fill-opacity': r(lerp(1, 0.35, clear), 3)};
    }
    // flat art inside each sheet: x offset + squash
    nodes['L-zones-flat'] = {transform: `translate(${st.x} 0) scale(1 ${0.5})`};
    nodes['L-text-flat'] = {transform: `translate(${st.x} 0) scale(1 ${0.5})`};
    nodes['L-facts-flat'] = {transform: `translate(${st.x} 0) scale(1 ${0.5})`};
    if (L.flags.length) nodes.flags = {transform: `translate(0 ${r(lerp(baseTop, tops[2], sep) + st.h * 0.5 + 18)})`, opacity: r(sep, 3)};
    /* side parts slide out from the stack */
    ['hierarchy', 'source', 'article', 'reading'].forEach(id => {
      if (!L.present.has(id)) return;
      const b = L.parts[id].box;
      const sc = id === focusId ? focusScale : 1;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const rv = revOf(id);
      nodes[`M-${id}`] = {transform: `translate(${r(cx)} ${r(cy)}) scale(${r(lerp(0.9, 1, rv) * sc, 4)}) translate(${r(-cx)} ${r(-cy)})`, opacity: r(rv, 3)};
    });
    L.labelBoxes.forEach(lb => { const a0 = L.revealAt[lb.id] ?? W.reveal[0]; nodes[`lab-${lb.id}`] = {opacity: r(seg(u, a0 + 0.015, a0 + RD + 0.01), 3)}; });
    /* relations one by one */
    const nR = L.graph.conns.length;
    const rp = i => seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / Math.max(1, nR), W.relate[0] + ((i + 1) * (W.relate[1] - W.relate[0])) / Math.max(1, nR));
    Object.assign(nodes, L.graph.frame(rp));
    L.relLabels.forEach((_, i) => { nodes[`rlg${i}`] = {opacity: r(clamp((rp(i) - 0.55) / 0.45), 3)}; });
    /* rings on the fact layer appear with the tracer on the fact layer; the gather drops sheet and pawns on the board */
    const fvF = visitOf('facts');
    const ringP = fvF ? seg(ease.inOutSine(tr), fvF.t - 0.02, fvF.t + 0.06) : seg(u, ...W.trace);
    L.res.facts.forEach((f, i) => { if (L.placed.slots[i]) nodes[`fp-ring${i}`] = {opacity: r(u >= W.trace[1] ? 1 : ringP, 3)}; });
    const drop = seg(u, ...W.drop), land = seg(u, ...W.land);
    const zTop = tops[2];
    L.res.facts.forEach((f, i) => {
      const sl = L.placed.slots[i];
      if (!sl) return;
      nodes[`drop${i}`] = {x1: r(st.x + sl.x), y1: r(tops[0] + sl.y * 0.5), x2: r(st.x + sl.x), y2: r(lerp(tops[0] + sl.y * 0.5, zTop + sl.y * 0.5, drop)), opacity: drop > 0 ? 1 : 0};
      nodes[`land-p${i}`] = {opacity: r(land, 3)};
    });
    if (L.sp) {
      const cx = L.sp.x + L.slipFlat.W / 2, cy = L.sp.y + L.slipFlat.H / 2;
      nodes['drop-sheet'] = {x1: r(st.x + cx), y1: r(tops[1] + cy * 0.5), x2: r(st.x + cx), y2: r(lerp(tops[1] + cy * 0.5, zTop + cy * 0.5, drop)), opacity: drop > 0 ? 1 : 0};
    }
    if (L.res.textZone >= 0) nodes['land-sheet'] = {opacity: r(land, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const connectorsLand = L.graph.conns.every(x => {
      const A = L.parts[x.rel.from].box, Bx = L.parts[x.rel.to].box;
      const onEdge = (pt, b) => pt.x >= b.x - 16 && pt.x <= b.x + b.w + 16 && pt.y >= b.y - 16 && pt.y <= b.y + b.h + 16;
      return onEdge(x.c.from, A) && onEdge(x.c.to, Bx);
    });
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sep, 3),
        relationsDrawn: L.graph.conns.map((_, i) => r(rp(i), 3)),
        kinds: L.graph.conns.map(x => x.rel.kind),
        arrowOnPlainRelation: L.graph.conns.some(x => x.rel.kind === 'relation' && LINK_STYLES.relation.arrow),
        connectorsLand,
        tracerVisible: on,
        tracer: {x: r(q.x), y: r(q.y)},
        visitOrder: L.route.visits.map(v => v.id),
        visited,
        focus: focusId,
        focusScale: r(focusScale, 3),
        dropped: r(drop, 3),
        landed: r(land, 3),
        rels: L.res.facts.map(f => f.rel),
        slotZones: L.placed.slots.map(sl => (sl ? L.B.zoneAt(sl.x, sl.y) : -1)),
        zones: L.res.facts.map(f => f.zone),
        allPlaced: L.res.facts.every((f, i) => f.zone < 0 || Boolean(L.placed.slots[i])),
        c0: {x: r(L.parts.source.box.x), y: r(L.parts.source.box.y)},
        allReached: true,
        // opening and reveal (review fixes): the stack opens large and centred; parts appear only once it has settled
        stackCover: r((L.st.w * L.stackXf(u).k) / L.SW, 3),
        revealed: r(rev, 3),

        // the parts appear only once the stack is (within 3 %) at its own size and place: nothing slides over text
        // a part is shown only once the moving stack no longer covers it (nothing slides over text)
        revealAfterSettle: Object.keys(L.revealAt).every(id => revOf(id) === 0 || !L.stackCovers(id, u)),
        // no near-empty beat: once the stack alone no longer fills the frame, the parts are showing
        // (the frame is 'filled' while the moving stack alone spans at least 60 % of its width and 45 % of its height)
        partsFill: L.stackFills(u) || Object.values(L.revealAt).some(a0 => u >= a0) || u < W.open[0],
        connectorTextCrossings: L.connTextCross,
        tabsWhileMoving: sep > 0 && sep < 0.8 && Object.keys(L.tabs).length > 0 ? seg(sep, 0.8, 1) : 0,
        connectorCrossings: L.crossings,
        relLabelsOverText: L.relLabelHits.filter(q => q.text).map(q => q.label),
        relLabelsOnBoard: L.relLabelHits.filter(q => q.board).map(q => q.label),
        relLabelsOnSheets: L.relLabelHits.filter(q => q.sheet).map(q => q.label),
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
    slug: 'sources-06-mechanism',
    title: 'Territorial scope — the placement taken apart in layers',
    titleEs: 'Ámbito territorial — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito territorial',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: three sheets seen at an angle lift apart — the neutral zone board, the translucent sheet with the area where the text is placed, and the layer of numbered fact pawns — beside the editable hierarchy, the book, the article slip and the magnifier. Only the supplied relationships are drawn (plain relations without arrows), a tracer follows the supplied order and the focus part swells; at the end the sheet and the pawns drop onto the board and the combined placement stays visible, as supplied, with no conclusion drawn.',
    tags: ['territorial scope', 'zones', 'mechanism', 'layers', 'exploded view', 'relations', 'tracer', 'board', 'article', 'editable hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-territorial.js', 'src/animations/sources/kits/ambito-material.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
