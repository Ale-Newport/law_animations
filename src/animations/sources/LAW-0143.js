/**
 * LAW-0143 — Ámbito territorial · contrast
 *
 * Storyboard (two identical tables seen from above; brief beats in brackets):
 *  [0.00–0.17] base: the shared material is drawn once in a strip — the
 *              editable hierarchy with the fictional texts, the passage (the
 *              text placed on its zone, as supplied), the facts shared by both
 *              scenes and the key. Below it two complete, identical scenes
 *              ("Situation A" / "Situation B", same neutral badges): the same
 *              hexagonal zone board, the same slip lying on the text's zone
 *              under the amber sheet, the same fact pawn waiting in its dish
 *              with its tag and an empty zone slot.
 *  [0.17–0.40] change: in A the chip of the zone supplied for A is clipped
 *              into the tag's slot, in B the chip of the zone supplied for B
 *              (the only datum that differs); a frame closes round each chip.
 *              Only then do the headers take the supplied scenario labels.
 *  [0.40–0.77] parallel: the same hand, same release, same speed: in A the pawn
 *              is set on a tile of its zone (the text's zone: solid ring), in B
 *              it crosses the boundary to a tile of the other zone (dashed
 *              ring). The path, the final tile and the ring differ.
 *  [0.77–1.00] guide: a copy of each chip lifts into the comparison tray where
 *              a guide joins them ("only the supplied zone differs"); a neutral
 *              note: no winner, score or legal consequence. Nothing says that
 *              the text applies to either fact.
 * @module animations/sources/LAW-0143
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {deskWindow} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  territorialFields, CONTENT_EN, KIT_STRINGS, kitStrings, fitWords, brokeWord, plaqueFit, makeBoard, boardArt, placeOnBoard, pawnToken, tagSlide, tagFit, tagDims,
  keyCard, keyHeight, makeArm, pawnGrip, arcPath, R2, TOKEN_R, PAWN, ZONE_FILL, ZONE_EDGE, NEUTRAL, sheetColor, zoneDemand, pawnInterior, boxInterior,
} from './kits/ambito-territorial.js';

const ID = 'LAW-0143';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  chip: [0.19, 0.27], frame: [0.26, 0.33], headOut: [0.33, 0.36], headIn: [0.36, 0.4],
  reach: [0.4, 0.47], carry: [0.47, 0.62], set: [0.62, 0.65], rings: [0.65, 0.69], out: [0.65, 0.73],
  fly: [0.78, 0.86], guide: [0.85, 0.89], guideLabel: [0.87, 0.91], note: [0.89, 0.93],
};

const STRINGS = {
  en: {situation: 'Situation', same: 'Same in A and B', hierarchy: 'Editable hierarchy', changedFact: 'Changed fact'},
  es: {situation: 'Situación', same: 'Igual en A y B', hierarchy: 'Jerarquía editable', changedFact: 'Hecho cambiado'},
};

const sceneSchema = {
  sources: territorialFields.sources,
  hierarchy: territorialFields.hierarchy,
  passages: territorialFields.passages,
  interpretations: territorialFields.interpretations,
  zones: territorialFields.zones,
  fact: obj('The fact shared by both scenes (fictional); only the zone supplied for it differs', {
    label: str('Fact label printed on the pawn tag', 40),
  }, ['label']),
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90), zone: str('Zone supplied for the fact in A (compared verbatim with the zone names)', 50)}, ['label', 'zone']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90), zone: str('Zone supplied for the fact in B (compared verbatim with the zone names)', 50)}, ['label', 'zone']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  sources: CONTENT_EN.sources,
  hierarchy: CONTENT_EN.hierarchy,
  passages: CONTENT_EN.passages,
  interpretations: [],
  zones: CONTENT_EN.zones,
  fact: {label: 'Meeting of two parties'},
  scenarioA: {label: 'Shared zone', caption: 'Fact supplied in the zone of the text', zone: 'Zone Alder (fictional)'},
  scenarioB: {label: 'Different zones', caption: 'Fact supplied in another zone', zone: 'Zone Birch (fictional)'},
  changedFact: 'The zone supplied for the meeting',
  sharedFacts: ['Same text, same slip, same board', 'Same fact and the same hand'],
  comparisonLabels: {guide: 'Only the supplied zone differs', neutral: 'Both placements are shown as supplied; neither is ranked and no conclusion is drawn'},
};

const SIZES = {landscape: [1690, 738], portrait: [950, 1359], square: [950, 738]};
/** Per shape: arrangement, strip columns, panel dish side, right-column width / bottom-row height. */
const GEO = {
  // (RC: the desk strip right of the board holds only the fact's dish; the board takes the rest of the panel)
  // (dish in the desk's header row; the waiting pawn's tag opens to its left, inside that row, clear of the board)
  landscape: {arr: 'row', cols: [0.3, 0.23, 0.22, 0.25], perRow: 4, dish: 'top', tagInHeader: true, HD: 100, RC: 0, RB: 0, tagW: 150, sides: ['right', 'left', 'bottom', 'top'], zoneOnly: true},
  portrait: {arr: 'column', cols: [0.5, 0.5, 0.5, 0.5], perRow: 2, dish: 'top', tagInHeader: true, HD: 100, RC: 0, RB: 0, tagW: 158, sides: ['right', 'left', 'bottom', 'top'], zoneOnly: true},
  // 1:1: the two scenes stacked on the left (full column width), the shared material drawn once in a
  // compact column on the right that stays to the end, the closing card under it
  // (the zone names are drawn once too, in a zones card of that column: the boards carry the swatches only)
  square: {arr: 'column', side: true, RW: 372, cols: [], perRow: 1, RC: 0, RB: 0, tagW: 210, sides: ['right', 'left', 'bottom', 'top'], strip: 20,
    // each desk includes its header row; the fact's dish sits at the right end of that row, the board below gets the full width
    dish: 'top', HD: 100,
    // the fact's label is shared too: it heads the shared card, and each tag carries only its zone chip
    noPlaques: true, zoneOnly: true, ids: ['hier', 'passage', 'zones', 'shared', 'key']},
};
const PAD = 14;
/** Size policy during one layout pass: `min` collects the smallest supplied-content text, `cap` limits captions. */
const SZ = {min: Infinity, cap: 20, broken: []};
/** fitWords for supplied content (its size is recorded). */
const cFit = (ctx, text, o) => {
  const f = fitWords(ctx, text, o);
  SZ.min = Math.min(SZ.min, f.size);
  if (brokeWord(f)) SZ.broken.push(String(text));
  return f;
};
/** Caption size: never larger than the smallest supplied content. */
const capOf = size => Math.min(size, SZ.cap);
const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

const scene = {
  sizes: {landscape: SIZES.landscape, square: SIZES.square, portrait: SIZES.portrait},
  layout(ctx) {
    // two passes: the second caps every caption at the smallest supplied-content size of the first
    // (1:1: a layout whose open tags find no tile on the board tries the next, roomier combination)
    const run = ci0 => {
      SZ.cap = 20;
      SZ.min = Infinity;
      SZ.broken = [];
      let L = layoutOnce(ctx, ci0);
      if (SZ.min < SZ.cap - 0.3) {
        SZ.cap = Math.max(16, SZ.min);
        SZ.min = Infinity;
        SZ.broken = [];
        L = layoutOnce(ctx, ci0);
      }
      L.broken = SZ.broken.slice();
      return L;
    };
    let L = run(0);
    while (L.retryFrom !== undefined) {
      const next = run(L.retryFrom);
      if (next.retryFrom === undefined || next.retryFrom <= L.retryFrom) { L = next; break; }
      L = next;
    }
    return L;
  },
  build(ctx, L) {
    return buildScene0(ctx, L);
  },
  frame(ctx, L, u) {
    return frame0(ctx, L, u);
  },
};

function layoutOnce(ctx, ci0 = 0) {
  {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const [SW, SH] = SIZES[shape];
    const s0 = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s0) / 2, oy = (ctx.design.h - SH * s0) / 2;
    const G = GEO[shape];
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    const norm = x => String(x || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const zoneOf = x => (norm(x) ? p.zones.findIndex(z => norm(z.name) === norm(x)) : -1);
    const textZone = zoneOf(p.passages[0].zone);
    const zA = zoneOf(p.scenarioA.zone), zB = zoneOf(p.scenarioB.zone);
    const relOf = z => (z < 0 ? 'off' : z === textZone ? 'shared' : 'different');

    const names = p.zones.map(z => z.name);

    /* --- shared strip, headers, bottom row, panels ----------------------------------
       bounded fallback: the shared text steps down (never below 16 px) until the boards
       have the room the pawn (and slip) need */
    let S, strip, hdrH, bottom, panels, labelFit, zfA, zfB, dims, RB;
    // first pass: open tags on the board; if even 16 px text leaves no room, tags fold on the board instead
    let foldPlan = Boolean(G.foldOnBoard);
    let RW = G.RW || 0, keyH = 0, boardFits = false;
    // 1:1: the right column widens (the scenes keep >= 45 % of the width) before any text shrinks
    // (at 20 px the column widens first; below that, texts that already had to shrink keep the scenes wide)
    const RWS = [G.RW, G.RW + 40, G.RW + 80, G.RW + 120, G.RW + 140];
    // last resort: the key moves under the two scenes as a strip (the column gets shorter, the scenes wider)
    const combos = G.side ? [...RWS.map(rw => [rw, 20]), ...RWS.flatMap(rw => [19, 18, 17, 16].map(sz => [rw, sz])),
      ...[G.RW, G.RW + 40, G.RW + 80].flatMap(rw => [18, 17, 16].map(sz => [rw, sz, true]))] : null;
    let keyUnder = false;
    // 16:9 / 9:16: the shared text starts at its full size; it steps down only while the open tags find no tile
    const sizes = [];
    for (let sz = G.strip || 22; sz >= 16; sz -= 1) sizes.push(sz);
    for (let attempt = 0; attempt < 2; attempt++) {
    let fits = false;
    var ci = G.side ? Math.min(ci0, combos.length - 1) : Math.min(ci0, sizes.length - 1);
    for (S = G.side ? combos[ci][1] : sizes[ci]; ; ) {
      if (G.side) { RW = combos[ci][0]; keyUnder = Boolean(combos[ci][2]); }
      /* the pawn tag (identical in A and B) */
      const ts = Math.min(22, S + 2);
      labelFit = showKey ? tagFit(ctx, p.fact.label, {maxWidth: G.tagW, size: ts}) : null;
      zfA = showKey ? tagFit(ctx, p.scenarioA.zone, {maxWidth: G.tagW - 24, size: ts}) : null;
      zfB = showKey ? tagFit(ctx, p.scenarioB.zone, {maxWidth: G.tagW - 24, size: ts}) : null;
      for (const [f, tx] of [[labelFit, p.fact.label], [zfA, p.scenarioA.zone], [zfB, p.scenarioB.zone]]) if (f && brokeWord(f)) SZ.broken.push(tx);
      dims = G.zoneOnly
        ? {tw: Math.max(...[zfA, zfB].map(q => (q ? q.width + 24 : 90))) + 50, th: Math.max(...[zfA, zfB].map(q => (q ? q.height : 22))) + 22}
        : tagDims(labelFit, [zfA, zfB]);
      RB = G.dish === 'bottom' ? Math.max(dims.th + 26, 96) : 0;
      for (const f of [labelFit, zfA, zfB]) if (f) SZ.min = Math.min(SZ.min, f.size);
      // board height the pawn (tag) and the slip need; with three zones the text's zone is about half the height
      const n3 = p.zones.length === 3;
      const innerNeed = foldPlan ? (n3 ? 2 * 96 + (G.noSlip ? 0 : 76) : 96) : (n3 ? 2 : 1) * (dims.th + 46) + (G.noSlip ? 0 : 76);
      const need = innerNeed + (G.noPlaques ? 28 + (n3 ? 40 : 0) : 70 + (n3 ? 70 : 22));
      const cw = G.cols.map(f => Math.floor((SW - PAD * 2 - (G.perRow - 1) * 12) * f));
      const RX = G.side ? SW - PAD - RW : 0, LW = G.side ? RX - PAD - 18 : SW - PAD * 2;
      // a wide column pairs the passage and the zones cards side by side
      const ids0 = keyUnder ? G.ids.filter(id => id !== 'key') : G.ids;
      const sideIds = RW >= G.RW + 80 ? ids0.flatMap(id => (id === 'passage' ? [['passage', 'zones']] : id === 'zones' ? [] : [id])) : ids0;
      strip = G.side ? buildStrip(ctx, {p, t, x: RX, y: 8, widths: sideIds.map(() => RW), perRow: 1, size: S, textZone, ids: sideIds, factLine: G.zoneOnly, tight: true})
        : buildStrip(ctx, {p, t, x: PAD, y: 8, widths: cw, perRow: G.perRow, size: S, textZone, ids: G.ids, factLine: G.zoneOnly});
      hdrH = headerHeight(ctx, p, t, (G.arr === 'row' ? (SW - PAD * 2 - 20) / 2 : LW) - (G.dish === 'top' ? G.HD + 12 : 0) - (G.tagInHeader ? dims.tw + 50 : 0), S);
      if (G.tagInHeader) hdrH = Math.max(hdrH, dims.th + 20);
      if (G.dish === 'top') hdrH = Math.max(hdrH, 84);
      bottom = G.side ? sideEnd(ctx, {p, t, x: RX, w: RW, size: S}) : bottomRow(ctx, {p, t, x: PAD, w: SW - PAD * 2, zA, zB, size: S, arr: shape});
      const top = G.side ? 8 : strip.h + 8 + 12;
      // 1:1: the key is a strip under the two scenes
      keyH = keyUnder ? keyHeight(ctx, LW, capOf(18), true) : 0;
      const avail = G.side ? SH - 8 - 6 - keyH - 12 : SH - top - bottom.h - 14;
      const sideFits = !G.side || strip.h + 8 + bottom.h <= SH - 12;
      if (G.side) {
        // the desk spans the header row too (its dish sits there)
        const ph = (avail - 16) / 2;
        panels = [0, 1].map(i => ({x: PAD, y: top + i * (ph + 16), w: LW, h: ph, hy: top + i * (ph + 16)}));
      } else if (G.arr === 'row' && G.dish === 'top') {
        // each desk spans its header row (the dish sits there); the board below takes the desk's full width
        const pw = (SW - PAD * 2 - 20) / 2;
        panels = [0, 1].map(i => ({x: PAD + i * (pw + 20), y: top, w: pw, h: avail, hy: top}));
      } else if (G.dish === 'top') {
        const ph = (avail - 16) / 2;
        panels = [0, 1].map(i => ({x: PAD, y: top + i * (ph + 16), w: SW - PAD * 2, h: ph, hy: top + i * (ph + 16)}));
      } else if (G.arr === 'row') {
        const pw = (SW - PAD * 2 - 20) / 2, ph = avail - hdrH;
        panels = [0, 1].map(i => ({x: PAD + i * (pw + 20), y: top + hdrH, w: pw, h: ph, hy: top}));
      } else {
        const ph = (avail - 16) / 2 - hdrH;
        panels = [0, 1].map(i => ({x: PAD, y: top + hdrH + i * (ph + hdrH + 16), w: SW - PAD * 2, h: ph, hy: top + i * (ph + hdrH + 16)}));
      }
      const boardH = G.dish === 'right' ? panels[0].h - 16 : G.dish === 'top' ? panels[0].h - hdrH - 12 : panels[0].h - RB - 12;
      // the placement itself decides (below); the old area estimate was too coarse
      boardFits = true;
      fits = boardFits && sideFits;
      if (fits) break;
      if (G.side) {
        if (++ci >= combos.length) break;
        S = combos[ci][1];
      } else {
        if (++ci >= sizes.length) break;
        S = sizes[ci];
      }
    }
    // tags fold on the board only when even 16 px text leaves the board no room for them
    // the estimate only steers the text size: the tags fold on the board only when the actual placement fails (below)
    break;
    }
    const ciUsed = G.side ? Math.min(ci, combos.length - 1) : ci;
    const combosLeft = G.side ? ciUsed + 1 < combos.length : ciUsed + 1 < sizes.length;
    const PW = panels[0].w, PH = panels[0].h;
    const by = SH - bottom.h - 6;
    const boardRect = G.dish === 'right' ? {x: 8, y: 8, w: PW - G.RC - 12, h: Math.max(160, PH - 16), R: 34} : {x: 8, y: 8, w: PW - 16, h: Math.max(160, PH - RB - 12), R: 28};
    if (G.dish === 'top') Object.assign(boardRect, {x: 8, y: hdrH + 2, w: PW - 16, h: PH - hdrH - 10, R: 24});
    if (G.noPlaques) boardRect.bands = [14, 14];
    // three zones: side-by-side strips, so each zone is wide enough to hold a pawn clear of every border
    if (names.length === 3) boardRect.strips = true;
    else boardRect.splitRange = [0.3, 0.72];
    // the compact slip on the text's zone: its reference (the full passage is in the strip)
    // the slip is at least as wide as the longest word of its reference needs (never a word broken in two)
    const longWord = showKey ? Math.max(...String(p.passages[0].ref).split(/\s+/).map(wd => fitWords(ctx, wd, {maxWidth: 999, size: 16, minSize: 16, maxLines: 1, weight: 700}).width)) : 0;
    const slipW = Math.max(longWord + 60, G.dish === 'top' ? Math.min(200, boardRect.w * 0.38) : Math.min(250, boardRect.w * 0.44));
    const refFit = showKey ? cFit(ctx, p.passages[0].ref, {maxWidth: slipW - 52, size: S, minSize: 16, maxLines: 4, weight: 700}) : null;
    const slipH = (refFit ? refFit.height : 26) + 24;
    const res = {zones: names.map((n, j) => ({j})), textZone, facts: [{i: 0, zone: zA}, {i: 1, zone: zB}]};
    const useSlip = textZone >= 0 && !G.noSlip;
    const demand = zoneDemand(res, useSlip ? {W: slipW, H: slipH} : null, foldPlan ? [{tw: 1, th: 1}, {tw: 1, th: 1}] : [dims, dims]);
    const B = makeBoard(ctx, boardRect, names, 1, demand);
    if (showKey && !G.noPlaques) B.plaqueRange.forEach((pr, j) => {
      const pf = plaqueFit(ctx, names[j], Math.max(90, pr.x1 - pr.x0 - 16));
      SZ.min = Math.min(SZ.min, pf.size);
      if (brokeWord(pf)) SZ.broken.push(names[j]);
    });
    const pdims = foldPlan ? {tw: 1, th: 1} : dims;
    // A and B are separate scenes: each pawn is placed on its own copy of the board (same slip spot)
    // a tag may overhang the board's wooden frame (1:1) or reach onto the desk beside the board (dish on the right)
    // every pawn and the slip lie wholly inside their zone, clear of any border (interior tiles)
    const popt = {interior: true, sides: G.sides || ['right'], tagBounds: G.dish === 'right' ? {x: 6, y: B.inner.y, w: PW - 12, h: B.inner.h}
      : G.dish === 'top' ? {x: 12, y: B.inner.y - 8, w: PW - 24, h: B.inner.h + 16} : B.inner};
    const onlyA = {...res, facts: [res.facts[0], {i: 1, zone: -1}]}, onlyB = {...res, facts: [{i: 0, zone: -1}, res.facts[1]]};
    // the scene whose pawn shares the slip's zone chooses the slip spot (it is the tighter one)
    const place2 = dd => {
      const firstB = zB >= 0 && zB === textZone && zA !== textZone;
      // 1:1: the tag of the pawn waiting in the dish hangs over the board's top-right corner; the slip lies elsewhere
      // (the pawns land there only after the tag has left with its pawn)
      const ny = Math.max(44, hdrH / 2 + 2);
      const po = G.dish === 'top' && !G.tagInHeader && dd.tw > 1 ? {...popt, slipAvoid: [{x: PW - 52 - dd.tw + 34 - 6, y: ny + TOKEN_R + 6, w: dd.tw + 12, h: dd.th + 16}]} : popt;
      const p1 = placeOnBoard(B, useSlip ? {W: slipW, H: slipH} : null, firstB ? onlyB : onlyA, [dd, dd], po);
      const p2 = placeOnBoard(B, useSlip ? {W: slipW, H: slipH} : null, firstB ? onlyA : onlyB, [dd, dd], {...po, fixedSlip: p1.slipSpot});
      return firstB ? {slipSpot: p1.slipSpot, slots: [p2.slots[0], p1.slots[1]]} : {slipSpot: p1.slipSpot, slots: [p1.slots[0], p2.slots[1]]};
    };
    let placed = place2(pdims);
    // no room for the open tag: the tag text steps down (never below 16 px) before it would fold
    // (down to 18 px while a smaller shared text can still give the boards more room; 16 px only as the last step)
    const tsMin = combosLeft ? 18 : 16;
    for (let ts = Math.min(22, S + 2) - 1; !foldPlan && ts >= tsMin && ((zA >= 0 && !placed.slots[0]) || (zB >= 0 && !placed.slots[1]) || (useSlip && !placed.slipSpot)); ts -= 1) {
      labelFit = showKey ? tagFit(ctx, p.fact.label, {maxWidth: G.tagW, size: ts}) : null;
      zfA = showKey ? tagFit(ctx, p.scenarioA.zone, {maxWidth: G.tagW - 24, size: ts}) : null;
      zfB = showKey ? tagFit(ctx, p.scenarioB.zone, {maxWidth: G.tagW - 24, size: ts}) : null;
      for (const [f, tx] of [[labelFit, p.fact.label], [zfA, p.scenarioA.zone], [zfB, p.scenarioB.zone]]) if (f && brokeWord(f)) SZ.broken.push(tx);
      dims = G.zoneOnly
        ? {tw: Math.max(...[zfA, zfB].map(q => (q ? q.width + 24 : 90))) + 50, th: Math.max(...[zfA, zfB].map(q => (q ? q.height : 22))) + 22}
        : tagDims(labelFit, [zfA, zfB]);
      for (const f of [labelFit, zfA, zfB]) if (f) SZ.min = Math.min(SZ.min, f.size);
      placed = place2(dims);
    }
    // no room for an open tag on the board (dense supplied data): the tags fold on the board, as in 1:1
    let foldOnBoard = foldPlan;
    if (!foldOnBoard && ((zA >= 0 && !placed.slots[0]) || (zB >= 0 && !placed.slots[1]))) {
      foldOnBoard = true;
      placed = place2({tw: 1, th: 1});
    }
    const nest = G.dish === 'right' ? {x: PW - G.RC + 44, y: PH - Math.max(70, dims.th / 2 + 26)} : G.dish === 'top' ? {x: PW - 52, y: Math.max(44, hdrH / 2 + 2)} : {x: 50, y: PH - RB / 2 - 4};
    const dishBox = G.dish === 'top' ? {x: nest.x - 42, y: nest.y - 38, w: 84, h: 76} : G.dish === 'right' ? {x: PW - G.RC + 4, y: nest.y - 40, w: 84, h: 80} : {x: 10, y: nest.y - 40, w: 84, h: 80};
    // 1:1: the arm comes in from the right edge, level with the dish
    const armAnchor = G.dish === 'right' ? {x: PW - G.RC * 0.4, y: PH + 2600} : G.dish === 'top' ? {x: PW + 2600, y: PH * 0.35} : {x: PW * 0.3, y: PH + 2600};
    const look = actorLook(ctx, {appearance: {skin: 2, outfit: 0}}, 0);
    const slots = [placed.slots[0], placed.slots[1]];
    const targets = [pawnGrip(nest, armAnchor), ...slots.filter(Boolean).map(q => pawnGrip(q, armAnchor))];
    const scenes = ['A', 'B'].map((L, i) => buildScene(ctx, {
      P: L, i, PW, PH, B, names, textZone, slip: placed.slipSpot, slipW, slipH, refFit, labelFit, zf: [zfA, zfB][i], zone: [zA, zB][i], dimFits: [zfA, zfB],
      nest, dishBox, slot: slots[i], armAnchor, targets, look, fact: p.fact, zoneOnly: G.zoneOnly, foldOnBoard, noPlaques: G.noPlaques, startSide: G.tagInHeader ? 'left' : G.dish === 'top' ? 'bottom' : G.dish === 'right' ? 'left' : 'right', startShift: G.dish === 'top' && !G.tagInHeader ? -(dims.tw / 2 - 34) : 0,
    }));

    /* --- headers --------------------------------------------------------------------- */
    const headers = panels.map((pn, i) => (G.dish === 'top'
      ? buildHeader(ctx, {i, p, t, x: pn.x + 12, y: pn.hy + 10, w: Math.min(pn.w - G.HD - 12, nest.x - 50 - 12) - (G.tagInHeader ? dims.tw + 50 : 0), h: hdrH, S})
      : buildHeader(ctx, {i, p, t, x: pn.x, y: pn.hy, w: pn.w, h: hdrH, S})));

    /* --- comparison tray: chip copies fly there from the tags ------------------------- */
    const chipFrom = i => {
      const sc = scenes[i];
      const q = slots[i] || nest;
      if (foldOnBoard) return {x: panels[i].x + q.x, y: panels[i].y + q.y};
      const sb = sc.tokF.subBox;
      return {x: panels[i].x + q.x + sb.x + sb.w / 2, y: panels[i].y + q.y + sb.y + sb.h / 2};
    };
    // 1:1: the closing card sits at the foot of the right column; the guide runs from each tag to it
    // 1:1: the guide leaves each tag at its right-hand edge (level with the zone chip), never across its text
    const guideFrom = i => {
      const q = slots[i] || nest;
      const sb = scenes[i].tokF.subBox;
      if (foldOnBoard || !sb) return {x: panels[i].x + q.x + TOKEN_R + 10, y: panels[i].y + q.y};
      return {x: panels[i].x + q.x + Math.max(sb.x + sb.w + 6, TOKEN_R + 10), y: panels[i].y + q.y + sb.y + sb.h / 2};
    };
    const tray = G.side ? bottom.build(SH - bottom.h - 6, guideFrom, SW - PAD - RW - 9) : bottom.build(by, chipFrom);
    const bottomNode = keyUnder ? keyCard(ctx, {prefix: 'side-key', x: PAD, y: SH - 6 - keyH, w: panels[0].w, size: capOf(18), strip: true}) : null;
    const fold = null;
    // 1:1: an open tag that found no tile asks for the next combination (the fold is the last resort)
    const slipMissing = useSlip && !placed.slipSpot;
    const retryFrom = (foldOnBoard || slipMissing) && !foldPlan && combosLeft ? ciUsed + 1 : undefined;
    // every pawn (with its ring) and the slip lie wholly inside their zone: no border touches them
    const interiorOk = slots.every((q, i) => !q || pawnInterior(B, q, [zA, zB][i]))
      && (!useSlip || !placed.slipSpot || boxInterior(B, {x: placed.slipSpot.x, y: placed.slipSpot.y, w: slipW, h: slipH}, textZone));
    return {interiorOk, boardShare: boardRect.w / SW, side: Boolean(G.side), slipShown: Boolean(placed.slipSpot) && useSlip, retryFrom, s0, ox, oy, SW, SH, strip, panels, scenes, headers, tray, bottomNode, fold, t, zA, zB, relA: relOf(zA), relB: relOf(zB), textZone, B, slots, nest};
  }
}

const parts0 = {
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s0)},
      L.strip.node,
      L.bottomNode ? L.bottomNode.node : null,
      g({name: 'scenes'},
        L.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.scenes[i].node)),
        // headers above the desks (in 1:1 they are written on the desk's header row)
        L.headers.map(hd => hd.node),
        L.tray.node));
  },
  frame(ctx, L, u) {
    const nodes = {};
    const chip = seg(u, ...W.chip);
    const frameP = seg(u, ...W.frame) * (1 - seg(u, ...W.rings));
    const looks = L.scenes.map((sc, i) => {
      const v = {chip, frame: seg(u, ...W.frame), reach: seg(u, ...W.reach), carry: seg(u, ...W.carry), set: seg(u, ...W.set), rings: seg(u, ...W.rings), out: seg(u, ...W.out)};
      const posed = sc.pose(v);
      Object.assign(nodes, posed.nodes);
      return posed.look;
    });
    const sk = 1, stx = 0, sty = 0;
    const wp = q => (q ? {x: r(stx + q.x * sk), y: r(sty + q.y * sk)} : null);
    const hOut = seg(u, ...W.headOut), hIn = seg(u, ...W.headIn);
    L.headers.forEach(hd => Object.assign(nodes, hd.frame(hOut, hIn)));
    Object.assign(nodes, L.tray.frame({fly: seg(u, ...W.fly), guide: seg(u, ...W.guide), label: seg(u, ...W.guideLabel), note: seg(u, ...W.note)}));
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const a = looks[0], b = looks[1];
    // headers are part of what each scene looks like (neutral before the change)
    const hdr = hIn > 0 ? 'scenario' : 'neutral';
    return {
      nodes,
      semantic: {
        beat,
        lookA: {...a, header: hdr === 'neutral' ? 'neutral' : 'A'},
        lookB: {...b, header: hdr === 'neutral' ? 'neutral' : 'B'},
        scenes: 2,
        a: a, b: b,
        pawnA: wp({x: L.panels[0].x + a.pawn.x, y: L.panels[0].y + a.pawn.y}),
        pawnB: wp({x: L.panels[1].x + b.pawn.x, y: L.panels[1].y + b.pawn.y}),
        handA: a.hand ? wp({x: L.panels[0].x + a.hand.x, y: L.panels[0].y + a.hand.y}) : null,
        handB: b.hand ? wp({x: L.panels[1].x + b.hand.x, y: L.panels[1].y + b.hand.y}) : null,
        heldA: a.held ? wp({x: L.panels[0].x + a.held.x, y: L.panels[0].y + a.held.y}) : null,
        heldB: b.held ? wp({x: L.panels[1].x + b.held.x, y: L.panels[1].y + b.held.y}) : null,
        sceneScale: r(sk, 3),
        zoneA: L.zA, zoneB: L.zB, textZone: L.textZone, relA: L.relA, relB: L.relB,
        slotZoneA: L.slots[0] ? L.B.zoneAt(L.slots[0].x, L.slots[0].y) : -1,
        slotZoneB: L.slots[1] ? L.B.zoneAt(L.slots[1].x, L.slots[1].y) : -1,
        headers: hdr,
        trayFly: r(seg(u, ...W.fly), 3), guideShown: r(seg(u, ...W.guide), 3), noteShown: r(seg(u, ...W.note), 3),
        panelShare: r(L.panels[0].w / L.SW, 3),
        // review fixes: the slip lies on both boards, no word is split, the scenes are never rescaled
        slipOnBoards: L.slipShown,
        interior: L.interiorOk,
        boardShare: r(L.boardShare, 3),
        sceneColumn: Boolean(L.side),
        brokenWords: L.broken,
        panelsSideBySide: L.panels[0].y === L.panels[1].y,
        allReached: a.reached && b.reached,
        frameOn: r(frameP, 3),
      },
    };
  },
};

const buildScene0 = (ctx, L) => parts0.build(ctx, L);
const frame0 = (ctx, L, u) => parts0.frame(ctx, L, u);

/* ------------------------------------------------------------------ */
/* One scene                                                           */
/* ------------------------------------------------------------------ */

function buildScene(ctx, o) {
  const th = ctx.theme;
  const {P, PW, PH, B} = o;
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: PW, h: PH, radius: 22, mat: false, seedKey: 'ct-desk'});
  const spread = o.slip ? {x: o.slip.cx, y: o.slip.cy} : {x: B.inner.x, y: B.inner.y};
  const board = boardArt(ctx, B, {prefix: `${P}-board`, names: o.names, textZone: o.textZone, spreadFrom: spread, staticSheet: true, plaques: !o.noPlaques});
  // compact slip on the text's zone
  const sl = o.slip ? slipCard(ctx, {prefix: `${P}-slip`, x: o.slip.x, y: o.slip.y, w: o.slipW, h: o.slipH, fit: o.refFit, zone: o.textZone}) : null;
  const dish = g({name: `${P}-dish`},
    h('path', {d: roundRectPath(o.dishBox.x + 4, o.dishBox.y + 6, o.dishBox.w, o.dishBox.h, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(o.dishBox.x, o.dishBox.y, o.dishBox.w, o.dishBox.h, 18), fill: th.wood, stroke: th.ink, 'stroke-width': 2.2}),
    h('circle', {cx: o.nest.x, cy: o.nest.y, r: TOKEN_R + 6, fill: '#51605a', stroke: '#48554f', 'stroke-width': 1.5}));
  const tokOpts = {fact: {num: 1, label: o.fact.label}, color: PAWN[1], fit: o.labelFit, open: 1, noLabel: o.zoneOnly,
    subs: [{empty: true, fit: null, zone: -1}, {fit: o.zf, zone: o.zone}], dimFits: o.dimFits, subFrame: th.accent2};
  // in the dish the tag opens below the pawn when the dish sits in the header row (1:1), else to its right
  const startSide = o.startSide || 'right';
  const tok = pawnToken(ctx, {prefix: `${P}-tok`, side: startSide, ...tokOpts, shiftX: o.startShift || 0});
  // on the board the tag may open on another side: an identical pawn swapped in while the tag is folded
  const finalSide = o.slot ? o.slot.side : startSide;
  const tokF = finalSide !== startSide || o.startShift ? pawnToken(ctx, {prefix: `${P}-tokf`, side: finalSide, ...tokOpts, open: 0}) : tok;
  const arm = makeArm(ctx, {name: `${P}-arm`, anchor: o.armAnchor, side: 'right', W: PW, H: PH, look: o.look, targets: o.targets});
  const node = g({name: `${P}-scene`},
    desk.surface,
    g({'clip-path': desk.clip}, board.node, sl, dish, tok.node, tokF !== tok ? tokF.node : null, arm.node),
    desk.frame);
  const outP = arm.out(pawnGrip(o.nest, o.armAnchor));
  const slot = o.slot;
  function pose(v) {
    const nodes = {};
    let pos = {...o.nest}, holder = 'dish', s = 1;
    let target = outP, held = null;
    const grip = q => pawnGrip(q, o.armAnchor);
    if (v.reach > 0 && v.carry <= 0) target = arcPath(outP, grip(o.nest), 30).at(ease.inOutSine(v.reach));
    if (slot && v.carry > 0) {
      const e = ease.inOutSine(v.carry);
      const q = arcPath(o.nest, slot, 70).at(e);
      pos = {x: q.x, y: q.y};
      s = 1 + 0.08 * Math.sin(e * Math.PI);
      holder = 'hand';
      target = grip(pos);
    }
    if (slot && v.set > 0) {
      pos = {x: slot.x, y: slot.y};
      s = 1;
      holder = v.set >= 1 ? 'board' : 'hand';
      target = grip(pos);
    }
    if (slot && v.out > 0 && v.set >= 1) target = arcPath(grip(slot), arm.out(grip(slot)), 20).at(ease.inOutSine(v.out));
    const sol = arm.solve(target);
    Object.assign(nodes, sol.nodes);
    if (holder === 'hand') {
      const gq = grip(pos);
      pos = {x: pos.x + sol.hand.x - gq.x, y: pos.y + sol.hand.y - gq.y};
      held = grip(pos);
    }
    const c = clamp(v.chip);
    const rel = o.zone < 0 ? 'off' : o.zone === o.textZone ? 'shared' : 'different';
    const swap = tokF !== tok;
    // with a swap, the tag folds while the hand reaches, and opens on its new side once the pawn is set;
    // foldOnBoard: the tag folds while the hand reaches and stays folded on the board (a copy is read in the tray)
    const fold = swap || o.foldOnBoard ? clamp(v.reach * 1.6) : 0;
    const reopen = swap ? clamp(v.set * 1.5 + v.rings) : 1;
    const onF = swap && v.carry > 0;
    const tagOpen = o.foldOnBoard ? 1 - fold : !swap ? 1 : onF ? Math.min(1, reopen) : 1 - fold;
    for (const [tk, nm, vis] of [[tok, `${P}-tok`, !onF], ...(swap ? [[tokF, `${P}-tokf`, onF]] : [])]) {
      nodes[nm] = {transform: T(pos.x, pos.y, 0, s), opacity: vis ? 1 : 0};
      nodes[`${nm}-slide`] = tagSlide(tk, tagOpen);
      nodes[`${nm}-sub0`] = {opacity: r(1 - clamp(c * 2), 3)};
      nodes[`${nm}-sub1`] = {opacity: r(clamp(c * 2 - 1), 3), transform: `translate(${r(24 * (1 - clamp(c * 2 - 1)))} 0)`};
      nodes[`${nm}-subframe`] = {opacity: r(clamp(v.frame) * (1 - clamp(v.rings)), 3)};
      nodes[`${nm}-ringS`] = {opacity: r(rel === 'shared' ? v.rings : 0, 3)};
      nodes[`${nm}-ringD`] = {opacity: r(rel !== 'shared' ? v.rings : 0, 3)};
    }
    const look = {
      pawn: R2(pos), holder, chip: r(c, 3), chipZone: c > 0 ? o.zone : null, frame: r(clamp(v.frame), 3),
      ringS: r(rel === 'shared' ? v.rings : 0, 3), ringD: r(rel !== 'shared' ? v.rings : 0, 3), hand: R2(sol.hand), held: R2(held),
      pawnWorld: true, reached: sol.reached, tagOpen: r(tagOpen, 3),
    };
    return {nodes, look};
  }
  return {node, pose, tok, tokF};
}

/** Compact slip lying on the text's zone: amber header with the reference and a zone swatch. */
function slipCard(ctx, o) {
  const th = ctx.theme;
  const head = shade(sheetColor(ctx), 0.62);
  const {x, y, w, h: hh} = o;
  return g({name: o.prefix, transform: `rotate(-1.5 ${r(x + w / 2)} ${r(y + hh / 2)})`},
    h('path', {d: roundRectPath(x + 5, y + 7, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: head, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(x + w - 34, y + hh / 2 - 11, 22, 22, 5), fill: o.zone >= 0 ? ZONE_FILL[o.zone % 3] : '#fff', stroke: o.zone >= 0 ? ZONE_EDGE[o.zone % 3] : NEUTRAL, 'stroke-width': 2}),
    o.fit ? textBlock(o.fit, {x: x + 14, y: y + (hh - o.fit.height) / 2, fill: th.ink}) : h('rect', {x: x + 14, y: y + hh / 2 - 6, width: w * 0.55, height: 12, rx: 6, fill: shade(head, -0.3)}));
}

/* ------------------------------------------------------------------ */
/* Headers                                                             */
/* ------------------------------------------------------------------ */

/** Header text layout: the caption follows the label on the same line when it fits, else below it. */
function headerFits(ctx, sc, w, S = 22) {
  const avail = w - 60;
  const lf = cFit(ctx, sc.label, {maxWidth: avail, size: Math.max(S, 20), minSize: 16, maxLines: 3, weight: 700});
  if (!(sc.caption && ctx.show('all'))) return {lf, cf: null, inline: true, h: lf.height};
  const room = avail - lf.width - 18;
  const cs = capOf(Math.min(20, lf.size));
  const one = room > 140 ? fitWords(ctx, sc.caption, {maxWidth: room, size: cs, minSize: cs, maxLines: 1, weight: 500}) : null;
  if (lf.lines.length === 1 && one && !one.truncated) return {lf, cf: one, inline: true, h: lf.height};
  const cf = fitWords(ctx, sc.caption, {maxWidth: avail, size: cs, minSize: Math.min(16, cs), maxLines: 3, weight: 500});
  return {lf, cf, inline: false, h: lf.height + cf.height + 9};
}

function headerHeight(ctx, p, t, w, S = 22) {
  if (!ctx.show('key')) return 48;
  return Math.max(48, ...[p.scenarioA, p.scenarioB].map(sc => headerFits(ctx, sc, w, S).h + 12));
}

function buildHeader(ctx, o) {
  const th = ctx.theme;
  const {p, t, x, y, w, h: hh, i} = o;
  const sc = i ? p.scenarioB : p.scenarioA;
  const L = i ? 'B' : 'A';
  const lane = i ? th.accent4 : th.accent2;
  const R = 18;
  const cy = y + 4 + 11;
  const badge = (fill, name) => g({name, opacity: name.endsWith('-n') ? 1 : 0},
    h('circle', {cx: x + R + 2, cy, r: R, fill, stroke: th.ink, 'stroke-width': 2.2}),
    ctx.show('key') ? h('text', {x: x + R + 2, y: cy + 7.5, 'text-anchor': 'middle', 'font-size': 21, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, L) : null);
  const parts = [badge(NEUTRAL, `hd${i}-n`), badge(lane, `hd${i}-s`)];
  if (ctx.show('key')) {
    const nf = fitWords(ctx, `${t.situation} ${L}`, {maxWidth: w - 70, size: capOf(22), minSize: Math.min(16, capOf(22)), maxLines: 1, weight: 700});
    parts.push(g({name: `hd${i}-nt`}, textBlock(nf, {x: x + 2 * R + 14, y: y + 4, fill: th.fg})));
    const {lf, cf, inline} = headerFits(ctx, sc, w, o.S);
    const tx = x + 2 * R + 14;
    parts.push(g({name: `hd${i}-st`, opacity: 0},
      textBlock(lf, {x: tx, y: y + 4, fill: th.fg}),
      cf ? textBlock(cf, inline ? {x: tx + lf.width + 18, y: y + 4 + (lf.size - cf.size) * 0.8, fill: th.fgSoft} : {x: tx, y: y + 4 + lf.height + 9, fill: th.fgSoft}) : null));
  }
  const node = g({name: `hd${i}`}, parts);
  const frame = (out, inn) => {
    const f = {[`hd${i}-n`]: {opacity: r(1 - inn, 3)}, [`hd${i}-s`]: {opacity: r(inn, 3)}};
    if (ctx.show('key')) {
      f[`hd${i}-nt`] = {opacity: r(1 - out, 3)};
      f[`hd${i}-st`] = {opacity: r(inn, 3)};
    }
    return f;
  };
  return {node, frame};
}

/* ------------------------------------------------------------------ */
/* Strip: hierarchy + texts, passage, shared facts, key                */
/* ------------------------------------------------------------------ */

function buildStrip(ctx, o) {
  const make = cardFactory(ctx, o);
  const ids = o.ids || ['hier', 'passage', 'shared', 'key'];
  // 1:1 column: an array id is a pair of cards side by side (each half the column)
  if (ids.some(Array.isArray)) {
    const W0 = o.widths[0];
    const rows = ids.map(id => (Array.isArray(id) ? id.map(q => make[q]((W0 - 8) / 2)) : [make[id](W0)]));
    const cards = [];
    let y = o.y;
    for (const row of rows) {
      const rh = Math.max(...row.map(c => c.h));
      row.forEach((c, k) => cards.push({...c, h: row.length > 1 ? rh : c.h, at: {x: o.x + k * ((W0 - 8) / 2 + 8), y}}));
      y += rh + (o.tight ? 6 : 10);
    }
    return placeCards(ctx, cards, 'strip', y - o.y - (o.tight ? 6 : 10));
  }
  const cards = ids.map((id, i) => make[id](o.widths[i])).filter(Boolean);
  return layoutCards(ctx, cards, o.x, o.y, o.perRow, 'strip', o.tight ? 6 : 10);
}

/** Card builders of the shared material, by id: hier, passage, shared, key, end. */
function cardFactory(ctx, o) {
  const th = ctx.theme;
  const {p, t} = o;
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const S = o.size;
  const pad = o.tight ? 9 : 12;
  const make = {};
  // 1 · editable hierarchy: level plates with the texts placed there (as supplied)
  make.hier = w => {
    const levels = p.hierarchy.levels.slice(0, 2);
    const nL = levels.length;
    const place = i => clamp(Math.round(p.hierarchy.placement[i] ?? Math.min(i, nL - 1)), 0, nL - 1);
    // the plate column is as wide as its plates need (at most half the card); the books take the rest
    // narrow cards stack each plate above its books; wide ones put the books beside the plates
    const stacked = w < 400;
    const plateMax = stacked ? w - pad * 2 - 34 : w * 0.5 - 34;
    const plates = levels.map(lv => {
      if (!showKey) return null;
      let f = fitWords(ctx, lv, {maxWidth: plateMax, size: 20, minSize: 19.5, maxLines: 1, weight: 700});
      if (f.truncated || f.lines.length > 1) f = fitWords(ctx, lv, {maxWidth: plateMax, size: Math.min(20, S), minSize: 16, maxLines: 3, weight: 700});
      SZ.min = Math.min(SZ.min, f.size);
      return f;
    });
    const plateCol = stacked ? pad + 10 : Math.min(w * 0.5, Math.max(120, ...plates.filter(Boolean).map(f => f.width + 34)) + pad + 6);
    const bookW = w - plateCol - pad - 44;
    const rows = levels.map((lv, li) => {
      const plate = plates[li];
      const books = p.sources.slice(0, 2).map((sv, si) => ({sv, si})).filter(q => place(q.si) === li).map(q => ({
        si: q.si,
        tf: showKey ? cFit(ctx, q.sv.title, {maxWidth: bookW, size: S, minSize: 16, maxLines: 5, weight: 700, family: 'serif'}) : null,
        nf: showKey && q.sv.note ? cFit(ctx, q.sv.note, {maxWidth: bookW, size: Math.min(20.5, S), minSize: 16, maxLines: 4, weight: 500}) : null,
      }));
      const bh = books.reduce((acc, b) => acc + (b.tf ? b.tf.height : 24) + (b.nf ? b.nf.height + 6 : 0) + 6, 0) - 6;
      const ph = (plate ? plate.height : 24) + 12;
      return {lv, plate, books, h: stacked ? ph + 6 + Math.max(0, bh) : Math.max(ph, bh, 40)};
    });
    return {w, h: rows.reduce((a, rw) => a + rw.h + 6, 0) + pad * 2 - 6, draw: (x, y) => {
      const parts = [];
      let yy = y + pad;
      rows.forEach((rw, li) => {
        const ph = rw.plate ? rw.plate.height + 12 : 30;
        const pw = rw.plate ? rw.plate.width + 30 : w * 0.3;
        parts.push(h('path', {d: roundRectPath(x + pad, yy, pw, ph, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}));
        if (rw.plate) parts.push(textBlock(rw.plate, {x: x + pad + pw / 2, y: yy + 6, anchor: 'middle', fill: '#3d2c0c'}));
        else parts.push(...Array.from({length: li + 1}, (_, k) => h('circle', {cx: x + pad + pw / 2 + (k - li / 2) * 14, cy: yy + ph / 2, r: 4, fill: '#6c4f1a'})));
        let by = stacked ? yy + ph + 6 : yy;
        const bx = x + plateCol;
        rw.books.forEach(b => {
          const bh = (b.tf ? b.tf.height : 24) + (b.nf ? b.nf.height + 6 : 0);
          const c = b.si ? '#6b3f4f' : '#2f4a6b';
          parts.push(h('path', {d: roundRectPath(bx, by + 2, 24, Math.max(30, bh - 4), 4), fill: c, stroke: th.ink, 'stroke-width': 1.8}));
          parts.push(h('rect', {x: bx, y: by + 2, width: 7, height: Math.max(30, bh - 4), rx: 3, fill: shade(c, -0.3)}));
          if (b.tf) parts.push(textBlock(b.tf, {x: bx + 36, y: by, fill: th.ink}));
          else parts.push(h('rect', {x: bx + 36, y: by + 8, width: w * 0.4, height: 10, rx: 5, fill: th.paperLine}));
          if (b.nf) parts.push(textBlock(b.nf, {x: bx + 36, y: by + b.tf.height + 6, fill: th.inkSoft, italic: true}));
          by += bh + 6;
        });
        yy += rw.h + 6;
      });
      return parts;
    }, name: 'card-hier'};
  };
  // 2 · passage (text placed on its zone, as supplied)
  make.passage = w => {
    const pz = p.passages[0];
    const rf = showKey ? cFit(ctx, pz.ref, {maxWidth: w - pad * 2, size: S, minSize: 16, maxLines: 2, weight: 700}) : null;
    const hf = showKey ? cFit(ctx, pz.heading, {maxWidth: w - pad * 2, size: S, minSize: 16, maxLines: 3, weight: 500, family: 'serif'}) : null;
    const zf = showKey ? cFit(ctx, `${t.placedOn}: ${pz.zone}`, {maxWidth: w - pad * 2 - 34, size: S, minSize: 16, maxLines: 3, weight: 600}) : null;
    const headH = (rf ? rf.height : 24) + 14;
    const hh = headH + 8 + (hf ? hf.height : 24) + 8 + (zf ? zf.height : 24) + pad;
    return {w, h: hh, paper: shade(sheetColor(ctx), 0.62), headH, draw: (x, y) => {
      const zi = o.textZone;
      const parts = [
        rf ? textBlock(rf, {x: x + pad, y: y + 7, fill: th.ink}) : h('rect', {x: x + pad, y: y + 12, width: w * 0.5, height: 12, rx: 6, fill: th.paperLine}),
        hf ? textBlock(hf, {x: x + pad, y: y + headH + 8, fill: th.inkSoft, italic: true}) : h('rect', {x: x + pad, y: y + headH + 12, width: w * 0.6, height: 10, rx: 5, fill: th.paperLine}),
      ];
      const zy = y + headH + 8 + (hf ? hf.height : 24) + 8;
      parts.push(h('path', {d: roundRectPath(x + pad, zy + ((zf ? zf.height : 24) - 22) / 2, 22, 22, 5), fill: zi >= 0 ? ZONE_FILL[zi % 3] : '#fff', stroke: zi >= 0 ? ZONE_EDGE[zi % 3] : NEUTRAL, 'stroke-width': 2}));
      if (zf) parts.push(textBlock(zf, {x: x + pad + 34, y: zy, fill: th.ink}));
      return parts;
    }, name: 'card-passage'};
  };
  // 3 · shared facts (+ the fact label and the changed fact where the layout needs them; an attributed reading, never applied)
  make.shared = w => {
    const cap = showAll ? fitWords(ctx, t.same, {maxWidth: w - pad * 2, size: capOf(20), minSize: capOf(15), maxLines: 1, weight: 700}) : null;
    const items = [...(o.factLine ? [`1 · ${p.fact.label}`] : []), ...p.sharedFacts, ...(o.changedLine ? [`${t.changedFact}: ${p.changedFact}`] : [])];
    const fl = showKey ? items.map(sf => cFit(ctx, sf, {maxWidth: w - pad * 2 - 20, size: S, minSize: 16, maxLines: 3, weight: o.factLine && sf === items[0] ? 700 : 500})) : items.map(() => null);
    const it = p.interpretations[0];
    const rf = it && showAll ? fitWords(ctx, `${t.reading} · ${it.by}: “${it.text}” (${t.attributed})`, {maxWidth: w - pad * 2, size: capOf(19), minSize: 15, maxLines: 4, weight: 500}) : null;
    const hh = pad + (cap ? cap.height + 8 : 0) + fl.reduce((a, f) => a + (f ? f.height : 22) + 6, 0) + (rf ? rf.height + 8 : 0) + pad - 6;
    return {w, h: Math.max(hh, 60), draw: (x, y) => {
      const parts = [];
      let yy = y + pad;
      if (cap) { parts.push(textBlock(cap, {x: x + pad, y: yy, fill: th.inkSoft})); yy += cap.height + 8; }
      fl.forEach(f => {
        parts.push(h('circle', {cx: x + pad + 5, cy: yy + 11, r: 4, fill: th.ink}));
        if (f) parts.push(textBlock(f, {x: x + pad + 18, y: yy, fill: th.ink}));
        else parts.push(h('rect', {x: x + pad + 18, y: yy + 6, width: w * 0.5, height: 10, rx: 5, fill: th.paperLine}));
        yy += (f ? f.height : 22) + 6;
      });
      if (rf) parts.push(textBlock(rf, {x: x + pad, y: yy + 2, fill: th.ink, italic: true}));
      return parts;
    }, name: 'card-shared'};
  };
  // zones (1:1): each zone's name beside its swatch, drawn once for both boards
  make.zones = w => {
    const fits = p.zones.map(z => (showKey ? cFit(ctx, z.name, {maxWidth: w - pad * 2 - 36, size: S, minSize: 16, maxLines: 3, weight: 700}) : null));
    const rowsH = fits.map(f => Math.max(28, f ? f.height : 22));
    return {w, h: pad * 2 + rowsH.reduce((a, q) => a + q + 6, 0) - 6, draw: (x, y) => {
      const parts = [];
      let yy = y + pad;
      fits.forEach((f, j) => {
        const sy = yy + rowsH[j] / 2 - 12;
        parts.push(h('path', {d: roundRectPath(x + pad, sy, 24, 24, 5), fill: ZONE_FILL[j % 3], stroke: ZONE_EDGE[j % 3], 'stroke-width': 2}));
        if (j % 3 === 1) parts.push(h('circle', {cx: x + pad + 12, cy: sy + 12, r: 4, fill: ZONE_EDGE[1]}));
        if (j % 3 === 2) parts.push(h('path', {d: `M${x + pad + 12} ${sy + 6}l6 6l-6 6l-6 -6Z`, fill: 'none', stroke: ZONE_EDGE[2], 'stroke-width': 2}));
        if (f) parts.push(textBlock(f, {x: x + pad + 36, y: yy + (rowsH[j] - f.height) / 2, fill: th.ink}));
        else parts.push(h('rect', {x: x + pad + 36, y: yy + rowsH[j] / 2 - 5, width: w * 0.45, height: 10, rx: 5, fill: th.paperLine}));
        yy += rowsH[j] + 6;
      });
      return parts;
    }, name: 'card-zones'};
  };
  // 4 · key
  make.key = w => ({w, h: keyHeight(ctx, w, capOf(18), true), key: true});
  return make;
}

/** Draw cards at given positions (`at`). */
function placeCards(ctx, cards, name, H) {
  const th = ctx.theme;
  const out = [];
  const boxes = [];
  for (const c of cards) {
    const {x, y} = c.at;
    boxes.push({x, y, w: c.w, h: c.h, name: c.name});
    if (c.key) out.push(keyCard(ctx, {prefix: `${name}-key`, x, y, w: c.w, size: capOf(18), strip: true}).node);
    else {
      out.push(g({name: c.name},
        h('path', {d: roundRectPath(x + 4, y + 6, c.w, c.h, 10), fill: th.shadow}),
        h('path', {d: roundRectPath(x, y, c.w, c.h, 10), fill: '#fffdf6', stroke: th.ink, 'stroke-width': 2}),
        c.paper ? h('path', {d: `M${x + 1} ${y + c.headH}V${y + 10}Q${x + 1} ${y + 1} ${x + 10} ${y + 1}H${x + c.w - 10}Q${x + c.w - 1} ${y + 1} ${x + c.w - 1} ${y + 10}V${y + c.headH}Z`, fill: c.paper}) : null,
        c.draw(x, y)));
    }
  }
  return {node: g({name}, out), h: H, boxes};
}

/** Lay cards out in rows (x, y top-left); returns the node and the height. */
function layoutCards(ctx, cards, x0, y0, perRow, name, gap = 10) {
  const th = ctx.theme;
  const out = [];
  const boxes = [];
  let y = y0, H = 0;
  for (let r0 = 0; r0 < cards.length; r0 += perRow) {
    const row = cards.slice(r0, r0 + perRow);
    const rh = Math.max(...row.map(c => c.h));
    let x = x0;
    row.forEach(c => {
      boxes.push({x, y, w: c.w, h: c.h, name: c.name});
      if (c.key) out.push(keyCard(ctx, {prefix: `${name}-key`, x, y, w: c.w, size: capOf(18), strip: true}).node);
      else {
        out.push(g({name: c.name},
          h('path', {d: roundRectPath(x + 4, y + 6, c.w, c.h, 10), fill: th.shadow}),
          h('path', {d: roundRectPath(x, y, c.w, c.h, 10), fill: '#fffdf6', stroke: th.ink, 'stroke-width': 2}),
          c.paper ? h('path', {d: `M${x + 1} ${y + c.headH}V${y + 10}Q${x + 1} ${y + 1} ${x + 10} ${y + 1}H${x + c.w - 10}Q${x + c.w - 1} ${y + 1} ${x + c.w - 1} ${y + 10}V${y + c.headH}Z`, fill: c.paper}) : null,
          c.draw(x, y)));
      }
      x += c.w + 12;
    });
    y += rh + gap;
    H = y - y0 - gap;
  }
  return {node: g({name}, out), h: H, boxes};
}

/* ------------------------------------------------------------------ */
/* Bottom row: comparison tray + neutral note                          */
/* ------------------------------------------------------------------ */

/** 1:1 closing card (guide label, changed fact, neutral note) at the foot of the right column; a dashed
 * guide runs from the zone chip of each tag across the gutter into it, joining the two changed data. */
function sideEnd(ctx, o) {
  const th = ctx.theme;
  const {p, t, x, w, size} = o;
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const cap = capOf(Math.min(20, size));
  const gl = showAll ? fitWords(ctx, p.comparisonLabels.guide, {maxWidth: w - 26, size: cap, minSize: 16, maxLines: 3, weight: 700}) : null;
  const cf = showKey ? cFit(ctx, `${t.changedFact}: ${p.changedFact}`, {maxWidth: w - 26, size, minSize: 16, maxLines: 4, weight: 500}) : null;
  const nf = showAll ? fitWords(ctx, p.comparisonLabels.neutral, {maxWidth: w - 26, size: cap, minSize: 16, maxLines: 5, weight: 500}) : null;
  const midH = 14 + (gl ? gl.height + 6 : 0) + (cf ? cf.height : 24);
  const noteH = nf ? nf.height + 14 : 0;
  const hh = midH + (noteH ? noteH + 5 : 0);
  return {
    h: hh,
    build(y, chipFrom, gx) {
      const mid = {x, y, w, h: midH};
      const midNode = g({name: 'tray-mid', opacity: 0},
        h('path', {d: roundRectPath(mid.x, mid.y, mid.w, mid.h, 10), fill: '#fffdf6', stroke: th.accent2, 'stroke-width': 2.5}),
        gl ? textBlock(gl, {x: x + 13, y: y + 7, fill: th.ink}) : null,
        cf ? textBlock(cf, {x: x + 13, y: y + 7 + (gl ? gl.height + 6 : 0), fill: th.ink}) : h('rect', {x: x + 15, y: y + 18, width: w * 0.6, height: 10, rx: 5, fill: th.paperLine}));
      const note = nf ? g({name: 'tray-note', opacity: 0},
        h('path', {d: roundRectPath(x, y + midH + 5, w, noteH, 10), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
        textBlock(nf, {x: x + 13, y: y + midH + 5 + 7, fill: th.ink})) : null;
      // the guide: from each tag's zone chip to the gutter, down/up the gutter, into the closing card
      const my = y + midH / 2;
      const legs = [0, 1].map(i => {
        const a = chipFrom(i);
        return `M${r(a.x)} ${r(a.y)}H${r(gx)}V${r(my)}`;
      });
      const guide = h('path', {name: 'tray-guide', d: `${legs.join('')}M${r(gx)} ${r(my)}H${r(x)}`, stroke: th.accent2, 'stroke-width': 3.5, 'stroke-dasharray': '10 7', fill: 'none', opacity: 0});
      const node = g({name: 'tray'}, guide, midNode, note);
      const frame = v => {
        const f = {'tray-guide': {opacity: r(v.guide, 3)}, 'tray-mid': {opacity: r(v.label, 3)}};
        if (nf) f['tray-note'] = {opacity: r(v.note, 3)};
        return f;
      };
      return {node, frame, box: {x, y, w, h: hh}};
    },
  };
}

function bottomRow(ctx, o) {
  const th = ctx.theme;
  const {p, t, x, w, size} = o;
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const chipW = Math.min(300, w * 0.26);
  const zf = [p.scenarioA.zone, p.scenarioB.zone].map(z => (showKey ? cFit(ctx, z, {maxWidth: chipW - 64, size, minSize: 16, maxLines: 2, weight: 600}) : null));
  const chipH = Math.max(...zf.map(f => (f ? f.height : 24))) + 20;
  const cap = capOf(Math.min(20, ...zf.filter(Boolean).map(f => f.size)));
  const midW = o.arr === 'portrait' ? w - chipW * 2 - 40 : o.arr === 'landscape' ? Math.min(w - chipW * 2 - 40, 560) : w - chipW * 2 - 40;
  const gl = showAll ? fitWords(ctx, p.comparisonLabels.guide, {maxWidth: midW - 24, size: cap, minSize: 15, maxLines: 2, weight: 700}) : null;
  const cf = showKey ? cFit(ctx, `${t.changedFact}: ${p.changedFact}`, {maxWidth: midW - 24, size, minSize: 16, maxLines: 3, weight: 500}) : null;
  const midH = (gl ? gl.height + 8 : 0) + (cf ? cf.height : 0) + 20;
  const trayW = chipW * 2 + midW + 40;
  const noteW = o.arr === 'portrait' ? w : w - trayW - 16;
  const nf = showAll ? fitWords(ctx, p.comparisonLabels.neutral, {maxWidth: noteW - 30, size: cap, minSize: 15, maxLines: 3, weight: 500}) : null;
  const trayH = Math.max(chipH + 16, midH);
  const noteH = nf ? nf.height + 22 : 0;
  const hh = o.arr === 'portrait' ? trayH + (noteH ? noteH + 8 : 0) : Math.max(trayH, noteH);
  return {
    h: hh,
    build(y, chipFrom) {
      const slotY = y + (trayH - chipH) / 2;
      const slots = [{x: x + 10, y: slotY}, {x: x + trayW - 10 - chipW, y: slotY}];
      const mid = {x: x + chipW + 30, y: y + (trayH - midH) / 2, w: midW};
      const chipNode = (i, name) => {
        const zi = i ? o.zB : o.zA;
        const f = zf[i];
        const lane = i ? th.accent4 : th.accent2;
        return g({name, opacity: 0},
          h('path', {d: roundRectPath(4, 6, chipW, chipH, 10), fill: th.shadow}),
          h('path', {d: roundRectPath(0, 0, chipW, chipH, 10), fill: '#fffdf6', stroke: lane, 'stroke-width': 3}),
          h('circle', {cx: 18, cy: chipH / 2, r: 12, fill: lane, stroke: th.ink, 'stroke-width': 1.6}),
          showKey ? h('text', {x: 18, y: chipH / 2 + 6, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i ? 'B' : 'A') : null,
          h('path', {d: roundRectPath(36, chipH / 2 - 10, 20, 20, 5), fill: zi >= 0 ? ZONE_FILL[zi % 3] : '#fff', stroke: zi >= 0 ? ZONE_EDGE[zi % 3] : NEUTRAL, 'stroke-width': 2}),
          f ? textBlock(f, {x: 64, y: (chipH - f.height) / 2, fill: th.ink}) : h('rect', {x: 64, y: chipH / 2 - 5, width: chipW - 84, height: 10, rx: 5, fill: th.paperLine}));
      };
      const tray = h('path', {name: 'tray-bed', d: roundRectPath(x, y, trayW, trayH, 14), fill: shade(th.wood, 0.12), stroke: th.ink, 'stroke-width': 2, opacity: 0});
      const guide = h('path', {name: 'tray-guide', d: `M${r(slots[0].x + chipW)} ${r(slotY + chipH / 2)}H${r(slots[1].x)}`, stroke: th.accent2, 'stroke-width': 3.5, 'stroke-dasharray': '10 7', fill: 'none', opacity: 0});
      const midNode = g({name: 'tray-mid', opacity: 0},
        h('path', {d: roundRectPath(mid.x, mid.y, mid.w, midH, 10), fill: '#fffdf6', stroke: th.accent2, 'stroke-width': 2.5}),
        gl ? textBlock(gl, {x: mid.x + mid.w / 2, y: mid.y + 10, anchor: 'middle', fill: th.ink}) : null,
        cf ? textBlock(cf, {x: mid.x + mid.w / 2, y: mid.y + 10 + (gl ? gl.height + 8 : 0), anchor: 'middle', fill: th.ink}) : null);
      const noteBox = o.arr === 'portrait' ? {x, y: y + trayH + 8, w: noteW, h: noteH} : {x: x + trayW + 16, y: y + (hh - noteH) / 2, w: noteW, h: noteH};
      const note = nf ? g({name: 'tray-note', opacity: 0},
        h('path', {d: roundRectPath(noteBox.x, noteBox.y, noteBox.w, noteBox.h, 10), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
        textBlock(nf, {x: noteBox.x + 15, y: noteBox.y + 11, fill: th.ink})) : null;
      const chips = [chipNode(0, 'tray-a'), chipNode(1, 'tray-b')];
      const node = g({name: 'tray'}, tray, guide, midNode, note, chips);
      const frame = v => {
        const f = {'tray-bed': {opacity: r(clamp(v.fly * 3), 3)}, 'tray-guide': {opacity: r(v.guide, 3)}, 'tray-mid': {opacity: r(v.label, 3)}};
        if (nf) f['tray-note'] = {opacity: r(v.note, 3)};
        [0, 1].forEach(i => {
          const a = chipFrom(i);
          const b = {x: slots[i].x + chipW / 2, y: slots[i].y + chipH / 2};
          const e = ease.inOutCubic(v.fly);
          const q = arcPath(a, b, 80).at(e);
          const sc = lerp(0.7, 1, e);
          f[i ? 'tray-b' : 'tray-a'] = {opacity: v.fly > 0 ? 1 : 0, transform: `translate(${r(q.x - (chipW / 2) * sc)} ${r(q.y - (chipH / 2) * sc)}) scale(${r(sc, 4)})`};
        });
        return f;
      };
      return {node, frame, box: {x, y, w, h: hh}};
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-06-contrast',
    title: 'Territorial scope — same zone vs different zones',
    titleEs: 'Ámbito territorial — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito territorial',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical tables seen from above: the same hexagonal zone board with the article slip lying on the text’s zone under a translucent sheet, and the same fact pawn. Only the zone supplied for that fact differs: in A its chip names the text’s zone and the hand sets the pawn there (solid ring); in B the chip names another zone and the pawn crosses the boundary (dashed ring). The shared hierarchy, passage and facts are drawn once; a comparison tray joins the two chips. No winner, score or conclusion.',
    tags: ['territorial scope', 'zones', 'comparison', 'shared zone', 'different zones', 'board', 'fact pawn', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-territorial.js', 'src/animations/sources/kits/ambito-material.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
