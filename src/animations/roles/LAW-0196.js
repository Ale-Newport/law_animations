/**
 * LAW-0196 — Consulta de expediente por auxiliar · inspect
 *
 * Storyboard (the story's end state is the context: the assistant standing at the
 * desk, hands at rest; the step cabinet with every numbered piece in its slot; a
 * value tag between the cabinet and the assistant records where the requested
 * piece sits — "found at slot 3", tied by a short line to that slot's plate):
 *  0.00–0.20  build: the context settles; a caption names it.
 *  0.20–0.45  isolate: a lens grows out of the distinguishing detail — the tabs of
 *             the requested piece and its neighbours, the slot plates and the
 *             value tag — and shows a REAL enlarged copy of the same coordinates
 *             (cropped to that detail, ≥ 1.5×) in free space away from the people;
 *             the copy fades in only once the window is clear of its source.
 *  0.45–0.75  substitute ONE datum inside the lens: the old value is struck
 *             through in grey, lifts off and stays readable as a struck "was"
 *             tag; the supplied position changes the dependent geometry only —
 *             the piece rises out of its slot and is set in the supplied slot, in
 *             front of that slot's own piece (its own slot shows a dashed gap);
 *             the new value appears and holds (≥ 400 ms). While the lens is still
 *             open the context changes the same way, so the lens closes onto an
 *             identical scene.
 *  0.75–1.00  return: the lens closes; a neutral changed-datum marker (Δ) sits by
 *             the new value, with its label and the struck old value beside it.
 *             No validity, sanction, rights or outcome follows from the position.
 * Seeking back to any earlier time restores the old datum exactly.
 * @module animations/roles/LAW-0196
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {roundRectPath} from '../../core/geometry.js';
import {shade} from '../../primitives/paper.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {str, num, int, list, obj, oneOf, party} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {
  pieceField, FILE_DEFAULTS, FILE_STRINGS, glueNums, resolvePieces, measurePieces, fileGeometry, fileStage,
  keyLayout, fitWords, wchip, overlaps, standing, textBlockAt, slotTransfer, sideTurn, pips,
} from './kits/consulta-de-expediente.js';

const ID = 'LAW-0196';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  caption: [0.04, 0.12], shrink: [0.16, 0.22], open: [0.22, 0.38], strike: [0.46, 0.5], lift: [0.51, 0.55], move: [0.55, 0.63], newIn: [0.63, 0.66],
  ctxOld: [0.66, 0.68], ctxMove: [0.66, 0.705], ctxNew: [0.705, 0.72], close: [0.73, 0.79], grow: [0.79, 0.83], marker: [0.83, 0.86], label: [0.84, 0.87],
};
const E = t => ease.inOutSine(clamp(t));
const INK = '#1f2328';
const TAGW = 8.5; // value tags wrap to two lines at this width (F units)
let SHEET_NUM = 0; // width of the sheet's number column (set per layout: 2 F)

const STRINGS = {
  en: {...FILE_STRINGS.en, was: 'was'},
  es: {...FILE_STRINGS.es, was: 'antes'},
};

const sceneSchema = {
  actors: list('The assistant in the context scene (fictional person)', party, 1, 1),
  roles: obj('Descriptive role captions (not a legal finding)', {assistant: str('Role caption for the person who consults the file', 40)}),
  relationships: list('Supplied link drawn between the value tag and the slot it names (plain relation by default)', obj('Link', {
    from: oneOf('From', ['value']), to: oneOf('To', ['slot']),
    kind: oneOf('relation | sequence (a plain relation has no arrowhead)', ['relation', 'sequence']),
    label: str('Caption of the link (shown in the key)', 40),
  }, ['from', 'to', 'kind', 'label']), 0, 1),
  props: obj('Case-file content', {
    pieces: list('Numbered pieces in slot order', pieceField, 3, 5),
    target: int('Number of the piece whose position is inspected', 1, 9),
    fileLabel: str('Label on the case-file cabinet (fictional identifier)', 50),
  }),
  focusTarget: oneOf('Detail that is enlarged and substituted: the position of the requested piece (its tab, the slot plates and the value tag)', ['position']),
  beforeValue: str('Value shown before the substitution (where the piece is found, as supplied)', 60),
  afterValue: str('Value shown after the substitution (the alternative position, as supplied)', 60),
  detailGeometry: obj('Lens geometry and the supplied positions', {
    zoom: num('Largest magnification of the lens', 1.5, 4),
    placement: oneOf('Where the lens sits', ['auto', 'left', 'bottom']),
    beforeSlot: int('Slot number where the piece sits before the substitution (as supplied)', 1, 9),
    afterSlot: int('Slot number where the piece sits after the substitution (as supplied)', 1, 9),
  }, ['zoom', 'placement', 'beforeSlot', 'afterSlot']),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 50)}),
};

const defaultParams = {
  actors: [FILE_DEFAULTS.actors[0]],
  roles: {assistant: FILE_DEFAULTS.roles.assistant},
  relationships: [{from: 'value', to: 'slot', kind: 'relation', label: 'tag names the slot'}],
  props: {pieces: FILE_DEFAULTS.props.pieces, target: 3, fileLabel: FILE_DEFAULTS.props.fileLabel},
  focusTarget: 'position',
  beforeValue: 'Piece 3 found at slot 3',
  afterValue: 'Piece 3 found at slot 5',
  detailGeometry: {zoom: 2.2, placement: 'auto', beforeSlot: 3, afterSlot: 5},
  contextLabels: {context: 'Context: piece 3 back in the file after the consultation', marker: 'Changed: where piece 3 sits (as supplied)'},
};

function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}
const slotIndex = (pieces, n, fallback) => { const i = pieces.findIndex(q => q.number === n); return i < 0 ? fallback : i; };
function widthFor(ctx, pieces, F, L) {
  let lo = 4 * F, hi = 40 * F;
  const ok = W0 => measurePieces(ctx, {pieces, F, W: W0, showText: true, maxLines: L}).ok;
  if (!ok(hi)) return null;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }
  return Math.ceil(hi + 2);
}
const inside = (a, b) => a.x >= b.x - 0.5 && a.y >= b.y - 0.5 && a.x + a.w <= b.x + b.w + 0.5 && a.y + a.h <= b.y + b.h + 0.5;

/** Value tag (chip) with a strike line and a named text; drawn in context and, again, in the lens copy. */
function valueTag(ctx, name, text, o) {
  const c = wchip(ctx, glueNums(text), {x: 0, y: 0, anchor: 'start', maxWidth: o.maxWidth, size: o.F, minSize: o.F, maxLines: 3, fill: '#fffaf0', stroke: ctx.theme.ink, weight: 700});
  const b = c.box;
  const strike = h('line', {name: `${name}-strike`, x1: r(b.x + 0.35 * o.F), x2: r(b.x + 0.35 * o.F), y1: r(b.y + b.h / 2), y2: r(b.y + b.h / 2), stroke: '#6b6b6b', 'stroke-width': 3, 'stroke-linecap': 'round'});
  return {node: g({name}, g({name: `${name}-body`}, c.node), strike), box: b, strikeLen: b.w - 0.7 * o.F};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1100, 1000], portrait: [1000, 1500]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const {pieces, target} = resolvePieces(p.props);
    const n = pieces.length;
    const m = 10;
    const portrait = ctx.view.shape === 'portrait';
    const before = slotIndex(pieces, p.detailGeometry.beforeSlot, target);
    const after = slotIndex(pieces, p.detailGeometry.afterSlot, target);
    const wantPlace = p.detailGeometry.placement;
    const zCap = Math.max(1.5, Math.min(p.detailGeometry.zoom, 4));
    const nameCap = p.roles.assistant ? `${p.actors[0].name} · ${p.roles.assistant}` : p.actors[0].name;
    const link = (p.relationships || [])[0];
    let best = null, weak = null, lastResort = null;
    const F0 = 22.5 / px, Fmin = 16.05 / px;
    // the layout never depends on label visibility: every text is measured
    for (let F = F0; F >= Fmin - 1e-6 && !best; F = F - 0.5 / px < Fmin && F > Fmin + 1e-6 ? Fmin : F - 0.5 / px) {
      // ---- bands: caption (+ relation legend) on top; key and the assistant's name at the bottom
      const capFit = fitWords(p.contextLabels.context, {maxWidth: D.w - 2 * m, size: F, minSize: F, maxLines: 3, weight: 600});
      const relFit = link ? fitWords(link.label, {maxWidth: D.w - 2 * m - 3.2 * F, size: F, minSize: F, maxLines: 2, weight: 600}) : null;
      const topH = capFit.height + (relFit ? 0.35 * F + relFit.height : 0);
      const key = keyLayout(ctx, {w: D.w - 2 * m, size: F});
      const nameC = wchip(ctx, nameCap, {x: 0, y: 0, anchor: 'start', maxWidth: D.w - 2 * m, size: F, minSize: F, maxLines: 3});
      const botH = key.h + 0.45 * F + nameC.box.h;
      const Mreg = {x: m, y: m + topH + 0.6 * F, w: D.w - 2 * m, h: D.h - 2 * m - topH - 0.6 * F - botH - 0.6 * F};
      const txtOk = !capFit.truncated && !(relFit && relFit.truncated) && key.ok && !nameC.fit.truncated;
      // value tags: the narrowest of a few widths at which both values fit in three lines
      let tagMW = TAGW * F, tagChips = null;
      for (const k of [TAGW, 11, 14, 18]) {
        tagMW = k * F;
        tagChips = [p.beforeValue, p.afterValue].map(t => wchip(ctx, glueNums(t), {x: 0, y: 0, anchor: 'start', maxWidth: tagMW, size: F, minSize: F, maxLines: 3, weight: 700}));
        if (tagChips.every(c => !c.fit.truncated)) break;
      }
      const tagW = Math.max(...tagChips.map(c => c.box.w)), tagH = Math.max(...tagChips.map(c => c.box.h));
      for (let L = 1; L <= 3 && !best; L++) {
        const W0 = widthFor(ctx, pieces, F, L);
        if (!W0 || W0 > 0.4 * D.w) continue;
        const M = measurePieces(ctx, {pieces, F, W: W0, showText: true, maxLines: 3});
        const fileFit = fitWords(glueNums(p.props.fileLabel), {maxWidth: (M.W + 3.2 * F) * 0.8, size: F, minSize: F, maxLines: 2, weight: 700});
        const RB = M.stripH + M.tabP + 0.1 * F;
        for (let z = 2.6; z >= 0.8 && !best; z -= 0.04) {
          // the index sheet (value tags) hangs in the gap between the cabinet and the assistant
          const sliver = 0.25 * F + sideTurn(M) * M.gripTab.x + 0.7 * F + 2 * F + 0.35 * F;
          const cabGap = sliver + tagW + 0.8 * F + 26 * z;
          const geo = (cx, shY) => fileGeometry({z, M, n, cx, shY, fileLabelH: fileFit.height, visitor: null, cover: false, desk: 'closeup', panelH: portrait ? 150 * z : 22 * z, cabGap});
          const G0 = geo(0, 0);
          // (the assistant does not handle the pieces here: the hands stay at rest, so no reach audit)
          const sb = G0.bbox;
          // the full view: the scene fills the middle band at scale 1 (largest z that fits)
          if (sb.w > Mreg.w + 0.5 || sb.h > Mreg.h + 0.5) continue;
          if (!txtOk || !M.ok || fileFit.truncated) continue;
          const src = srcRect(G0, M, F, before, after, target, RB, G0.cab.r + sliver, tagW, tagH);
          // ---- shared view (lens open): the context scaled by sS < 1 beside or above the lens, all inside Mreg
          const opts = [];
          for (const zoom of [Math.min(zCap, 2.2), Math.min(zCap, 1.8), 1.5]) {
            if (wantPlace !== 'bottom') {
              // left: sb.w*sS + gap + src.w*sS*zoom <= Mreg.w ; max(sb.h, src.h*zoom)*sS <= Mreg.h
              const sS = Math.min(1, (Mreg.w - 1.6 * F) / (sb.w + src.w * zoom), Mreg.h / Math.max(sb.h, src.h * zoom));
              opts.push({place: 'left', zoom, sS});
            }
            if (wantPlace !== 'left') {
              // below: the lens may cover the desk front, never the hands resting on the desk (nor anyone above)
              const hA = G0.yFar + 36 * z - sb.y;
              const sS = Math.min(1, (Mreg.h - 1.4 * F) / (hA + src.h * zoom), Mreg.h / sb.h, Mreg.w / Math.max(sb.w, src.w * zoom));
              opts.push({place: 'below', zoom, sS, hA});
            }
          }
          // the context stays a real scene (at least 60 % of its full size) and the lens as large as possible
          const Gw = geo(Mreg.x + (Mreg.w - sb.w) / 2 - sb.x, Mreg.y + (Mreg.h - sb.h) / 2 - sb.y);
          const srcW = srcRect(Gw, M, F, before, after, target, RB, Gw.cab.r + sliver, tagW, tagH);
          for (const o of opts) o.pl = sharedPlace(Gw, z, srcW, o, F, Mreg);
          const okO = opts.filter(o => o.pl.clear && o.sS >= 0.6 && F * px * o.sS >= 16.05).sort((x, y) => (y.zoom * y.sS) - (x.zoom * x.sS) || y.zoom - x.zoom);
          if (!okO.length) {
            // remembered only as a last resort: the shared context would drop below 16 px while the lens is open
            const lo = opts.filter(o => o.pl.clear && o.sS >= 0.6).sort((x, y) => (y.zoom * y.sS) - (x.zoom * x.sS))[0];
            if (lo && !lastResort) lastResort = {tagMW, F, M, z, fileFit, RB, sliver, cabGap, tagW, tagH, capFit, relFit, key, nameC, topH, botH, Mreg, sb, src, place: lo.place, zoom: lo.zoom, sS: lo.sS, hA: lo.hA, geo, smallShared: true};
            continue;
          }
          const pick = okO[0];
          const cand = {tagMW, F, M, z, fileFit, RB, sliver, cabGap, tagW, tagH, capFit, relFit, key, nameC, topH, botH, Mreg, sb, src, place: pick.place, zoom: pick.zoom, sS: pick.sS, hA: pick.hA, geo};
          if (pick.zoom >= Math.min(1.8, zCap) - 1e-9) best = cand;
          else if (!weak) weak = cand;
        }
      }
      if (!best && weak) best = weak;
    }
    if (!best && lastResort) best = lastResort;
    const fits = !!best;
    if (!best) {
      // last resort (never expected with the supplied limits): the smallest size, lens at the minimum zoom
      const F = Fmin;
      const M = measurePieces(ctx, {pieces, F, W: widthFor(ctx, pieces, F, 3) || 12 * F, showText: true, maxLines: 3});
      const fileFit = fitWords(glueNums(p.props.fileLabel), {maxWidth: (M.W + 3.2 * F) * 0.8, size: F, minSize: F, maxLines: 2, weight: 700});
      const tagW = 10 * F, z = 0.8, sliver = 0.25 * F + sideTurn(M) * M.gripTab.x + 0.7 * F + 2.35 * F, cabGap = sliver + tagW + 0.8 * F + 26 * z;
      const geo = (cx, shY) => fileGeometry({z, M, n, cx, shY, fileLabelH: fileFit.height, visitor: null, cover: false, desk: portrait ? 'full' : 'closeup', panelH: 22 * z, cabGap});
      const G0 = geo(0, 0);
      const capFit = fitWords(p.contextLabels.context, {maxWidth: D.w - 2 * m, size: F, minSize: F, maxLines: 3, weight: 600});
      const key = keyLayout(ctx, {w: D.w - 2 * m, size: F});
      const nameC = wchip(ctx, nameCap, {x: 0, y: 0, anchor: 'start', maxWidth: D.w - 2 * m, size: F, minSize: F, maxLines: 3});
      const RB = M.stripH + M.tabP + 0.1 * F;
      best = {F, M, z, fileFit, RB, sliver, cabGap, tagW, tagH: 2 * F, capFit, relFit: null, key, nameC, topH: capFit.height, botH: key.h + nameC.box.h, Mreg: {x: m, y: m + capFit.height, w: D.w - 2 * m, h: D.h - 2 * m - capFit.height - key.h - nameC.box.h}, sb: G0.bbox, src: srcRect(G0, M, F, before, after, target, RB, G0.cab.r + sliver, tagW, 2 * F), place: 'below', zoom: 1.5, sS: 0.6, geo};
    }
    const {F, M, z, fileFit, RB, sliver, tagW, capFit, relFit, key, nameC, Mreg, place} = best;
    const sS = best.sS ?? 1;
    const sb0 = best.sb;
    // ---- world coordinates = the full view: the scene centred in the middle band at scale 1
    const G = best.geo(Mreg.x + (Mreg.w - sb0.w) / 2 - sb0.x, Mreg.y + (Mreg.h - sb0.h) / 2 - sb0.y);
    const src = srcRect(G, M, F, before, after, target, RB, G.cab.r + sliver, tagW, best.tagH);
    const pl = sharedPlace(G, z, src, {place, zoom: best.zoom, sS, hA: best.hA}, F, Mreg);
    const shared = pl.shared, dest = pl.dest;
    const toWorld = q => ({x: (q.x - shared.bx) / sS, y: (q.y - shared.by) / sS, w: q.w / sS, h: q.h / sS});
    const dimFrame = toWorld({x: 0, y: 0, w: D.w, h: D.h});
    // ---- occupancy: a compartment that (as supplied) also holds the inspected piece: that piece stands BEHIND
    // the compartment's own piece, raised so its strip and tab show above it (no piece is ever hidden)
    const occupancy = [];
    pieces.forEach((q, k) => {
      if (k !== target && k === after) occupancy.push([target, after]);
      if (k !== target && k === before) occupancy.push([target, before]);
      occupancy.push([k, k]);
    });
    const tagX = G.cab.r + sliver;
    const rowMid = c => G.rows[c].stripTop + M.stripH / 2;
    const showAll = ctx.show('all'), showKey = ctx.show('key');
    const mkTags = pre => ({oldT: valueTag(ctx, `${pre}old`, p.beforeValue, {F, maxWidth: best.tagMW ?? TAGW * F}), newT: valueTag(ctx, `${pre}new`, p.afterValue, {F, maxWidth: best.tagMW ?? TAGW * F})});
    const stage = fileStage(ctx, {prefix: 'st', G, M, pieces, actors: p.actors, fileLabelFit: fileFit, occupancy, movers: [target], cover: false, bubble: null});
    const copyStage = fileStage(ctx, {prefix: 'lzs', titles: false, blankPlate: false, G, M, pieces, actors: p.actors, fileLabelFit: null, occupancy, movers: [target], cover: false, bubble: null});
    SHEET_NUM = 2 * F;
    const sheetC = indexSheet(ctx, 'ctx-sheet', G, M, F, tagX, tagW, rowMid);
    const sheetL = indexSheet(ctx, 'lz-sheet', G, M, F, tagX, tagW, rowMid);
    const tagsC = showAll ? mkTags('ctx-') : null;
    const tagsL = showAll ? mkTags('lz-') : null;
    const linkC = relLine(ctx, 'ctx-', G, M, F, tagX, rowMid);
    const linkL = relLine(ctx, 'lz-', G, M, F, tagX, rowMid);
    const copyContent = g({name: 'lzcopy'}, copyStage.node, sheetL, linkL.node, tagsL ? [tagsL.oldT.node, tagsL.newT.node] : null);
    const lz = lens(ctx, {name: 'lz', source: src, dest, content: copyContent, frame: dimFrame, radius: 18 / sS, color: ctx.theme.accent2});
    // ---- fixed labels: caption and relation legend on top; key and name chip at the bottom
    const extras = [];
    if (showKey) {
      extras.push(g({name: 'caption', opacity: 0}, textBlockAt(capFit, m, m, ctx.theme.fg)));
      const ky = D.h - m - best.botH;
      extras.push(key.build(m, ky));
      extras.push(wchip(ctx, nameCap, {x: m, y: ky + key.h + 0.45 * F, anchor: 'start', maxWidth: D.w - 2 * m, size: F, minSize: F, maxLines: 3, fill: '#f7f1e3', name: 'chipA'}).node);
    }
    if (showAll && link && relFit) {
      const lx = m, ly = m + capFit.height + 0.35 * F;
      extras.push(g({name: 'rel-legend', opacity: 0},
        h('line', {x1: r(lx + 0.2 * F), x2: r(lx + 2.2 * F), y1: r(ly + 0.55 * F), y2: r(ly + 0.55 * F), stroke: ctx.theme.fgSoft, 'stroke-width': 3}),
        h('circle', {cx: r(lx + 0.2 * F), cy: r(ly + 0.55 * F), r: 4.5, fill: ctx.theme.fgSoft}),
        h('circle', {cx: r(lx + 2.2 * F), cy: r(ly + 0.55 * F), r: 4.5, fill: ctx.theme.fgSoft}),
        textBlockAt(relFit, lx + 2.8 * F, ly, ctx.theme.fg)));
    }
    // ---- changed-datum marker (context, beside the new value) and its label under the struck old value
    const mk = {x: tagX + tagW + 0.25 * F, y: rowMid(after) - M.stripH / 2 - 0.45 * F};
    const marker = changedMarker(ctx, {name: 'marker', x: mk.x, y: mk.y, radius: 0.55 * F, opacity: 0});
    let markLabel = null;
    if (showAll) {
      const wasY = Math.max(rowMid(before), rowMid(after)) + best.tagH / 2 + 0.6 * F;
      markLabel = wchip(ctx, `Δ ${p.contextLabels.marker}`, {x: tagX, y: wasY, anchor: 'start', maxWidth: Math.max(tagW, 9 * F), size: F, minSize: F, maxLines: 5});
    }
    return {RB, stage, copyStage, sheetC, G, M, F, z, src, dest, zoom: best.zoom, lz, tagsC, tagsL, linkC, linkL, extras, tagX, tagW, rowMid, before, after, target, pieces, place, markLabel, marker, shared,
      hasRelLegend: showAll && !!link && !!relFit, fits, issues: fits ? [] : ['no layout'], textPx: r(F * px, 1), sharedTextPx: r(F * px * sS, 1), fadeCtxText: F * px * sS < 16.05, hasFileLabel: showKey, px, mk, Mreg};
  },
  build(ctx, L) {
    const parts = [L.stage.node, L.sheetC, L.linkC.node];
    if (L.tagsC) parts.push(L.tagsC.oldT.node, L.tagsC.newT.node);
    const ml = L.markLabel ? g({name: 'marklabel', opacity: 0}, L.markLabel.node) : null;
    // the context (scene, index sheet, tags, marker) is one group: full size while the lens is closed, at its shared
    // place (scale 1) while the lens is open
    const Sh = L.shared;
    return g(null, g({name: 'ctxwrap'}, parts, L.marker, ml), L.extras, g({'data-occludes': 1, name: 'lzwrap', transform: `${T(Sh.bx, Sh.by)} scale(${r(Sh.s, 4)})`}, L.lz.node));
  },
  frame(ctx, L, u) {
    const nodes = {};
    const {G, M, F, before, after, target} = L;
    // context fold: 0 = full size, 1 = shared (lens open)
    const fold = u < 0.5 ? E(seg(u, ...W.shrink)) : 1 - E(seg(u, ...W.grow));
    const Sh = L.shared;
    nodes.ctxwrap = {transform: `${T(lerp(0, Sh.bx, fold), lerp(0, Sh.by, fold))} scale(${r(lerp(1, Sh.s, fold), 4)})`};
    // lens open 0..1
    const open = u < W.close[0] ? E(seg(u, ...W.open)) : 1 - E(seg(u, ...W.close));
    Object.assign(nodes, L.lz.frame(open, open));
    const S = L.src, Dd = L.dest;
    const Rw = {x: lerp(S.x, Dd.x, open), y: lerp(S.y, Dd.y, open), w: lerp(S.w, Dd.w, open), h: lerp(S.h, Dd.h, open)};
    const overSrc = overlaps(Rw, S, 0);
    // the window is opaque as soon as it exists, so the copy never shows over a visible source (no double image);
    // the context's value tags (drawn again in the copy) hide while the window overlaps their place
    nodes['lz-win'] = {opacity: open > 0.001 ? 1 : 0};
    const copyOp = open > 0.001 ? 1 : 0;
    nodes.lzcopy = {opacity: copyOp};
    const morph = open > 0.001 && open < 0.999 && overSrc;
    // the inspected piece changes compartment without passing over any other one (see slotTransfer)
    const path = (t) => slotTransfer(G, M, before, before === target ? 0 : L.RB, after, after === target ? 0 : L.RB, t);
    const tL = seg(u, ...W.move), tC = seg(u, ...W.ctxMove);
    const rest = {left: G.restL, right: G.restR, openL: 0, openR: 0, look: 0, tilt: 0};
    const posed = L.stage.pose({hands: rest, pieces: {[target]: path(tC)}});
    Object.assign(nodes, posed.nodes);
    const posedL = L.copyStage.pose({hands: rest, pieces: {[target]: path(tL)}});
    Object.assign(nodes, posedL.nodes);
    // in the lens copy, the numbers of the compartments outside the inspected rows are left out (the rim would
    // cut them; the lens shows the inspected rows only)
    const lo = Math.min(before, after), hi = Math.max(before, after);
    for (let c = 0; c < G.n; c++) {
      if (c >= lo && c <= hi) continue;
      nodes[`lzs-plate${c}`] = {opacity: 0};
      for (const i of L.pieces.keys()) if (L.copyStage.pieceNodes.has(`${i}@${c}`)) nodes[`lzs-p${i}-c${c}-txt`] = {opacity: 0};
    }
    const tagFrame = (pre, tags, tStrike, tLift, tNew, hide) => {
      if (!tags) return;
      const yOld = L.rowMid(before) - tags.oldT.box.h / 2;
      const yNew = L.rowMid(after) - tags.newT.box.h / 2;
      nodes[`${pre}old`] = {transform: T(L.tagX, yOld), opacity: hide ? 0 : r(1 - 0.4 * tLift, 3)};
      nodes[`${pre}old-strike`] = {x2: r(tags.oldT.box.x + 0.35 * F + tags.oldT.strikeLen * tStrike)};
      nodes[`${pre}new`] = {transform: T(L.tagX, yNew), opacity: hide ? 0 : r(tNew, 3)};
    };
    const lzStrike = seg(u, ...W.strike), lzLift = seg(u, ...W.lift), lzNew = seg(u, ...W.newIn);
    const cStrike = seg(u, W.ctxOld[0], W.ctxOld[1]), cLift = seg(u, W.ctxOld[1] - 0.005, W.ctxMove[1] - 0.01), cNew = seg(u, ...W.ctxNew);
    tagFrame('lz-', L.tagsL, lzStrike, lzLift, lzNew, false);
    tagFrame('ctx-', L.tagsC, cStrike, cLift, cNew, morph);
    Object.assign(nodes, L.linkL.frame(lzNew > 0.5 ? after : before, lzNew));
    Object.assign(nodes, L.linkC.frame(cNew > 0.5 ? after : before, cNew));
    // last-resort layouts only: while the context is shrunk below 16 px its texts fade out (the lens shows the tabs,
    // plates and values enlarged) and come back as the context regrows
    if (L.fadeCtxText) {
      const mul = (name, k) => { const cur = nodes[name] && nodes[name].opacity !== undefined ? nodes[name].opacity : 1; nodes[name] = {...(nodes[name] || {}), opacity: r(cur * k, 3)}; };
      // visible only at ≥ 16 px: the context at its current scale, the lens copy at its current magnification
      const pxAt = sc => L.F * L.px * sc;
      const kC = clamp((pxAt(lerp(1, L.shared.s, fold)) - 16.05) / 1.2);
      const kL = clamp((pxAt(L.shared.s * Rw.w / S.w) - 16.05) / 1.2);
      for (const [pre, stg, k] of [['st', L.stage, kC], ['lzs', L.copyStage, kL]]) {
        if (pre === 'st' && L.hasFileLabel) mul('st-filelabel', k);
        for (let c = 0; c < G.n; c++) mul(`${pre}-plate${c}`, k);
        for (const key of stg.pieceNodes.keys()) { const [i, c] = key.split('@'); mul(`${pre}-p${i}-c${c}-txt`, k); }
        mul(`${pre}-p${target}-f-txt`, k);
      }
      if (L.tagsC) { mul('ctx-old', kC); mul('ctx-new', kC); }
      if (L.tagsL) { mul('lz-old', kL); mul('lz-new', kL); }
    }
    const mp = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mp, 3)};
    if (L.markLabel) nodes.marklabel = {opacity: r(seg(u, ...W.label), 3)};
    if (ctx.show('key')) nodes.caption = {opacity: r(seg(u, ...W.caption), 3)};
    if (L.hasRelLegend) nodes['rel-legend'] = {opacity: r(seg(u, ...W.caption), 3)};
    const datumOf = (tS, tN) => (tN >= 1 ? 'after' : tS > 0 ? 'changing' : 'before');
    const head = posed.mf.face;
    const lensBox = open > 0.001 ? Rw : null;
    // people in shared coordinates (the lens exists only while the context is at its shared place)
    const bodyBox = {x: G.cx - 95 * G.z, y: head.y, w: 190 * G.z, h: G.yFar - head.y};
    const handBoxes = [posed.mf.hands.l, posed.mf.hands.r].map(q => ({x: q.x - 22 * G.z, y: q.y - 22 * G.z, w: 44 * G.z, h: 44 * G.z}));
    const zoomNow = Dd.w / S.w;
    // pieces shown in the scene (each drawn somewhere, none hidden behind another)
    const shownPieces = L.pieces.map((q, k) => k);
    return {
      nodes,
      semantic: {
        beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
        lensOpen: r(open, 3),
        fold: r(fold, 3),
        copyShown: r(copyOp, 3),
        copyOverSource: overSrc && copyOp > 0,
        datum: datumOf(lzStrike, lzNew),
        contextDatum: datumOf(cStrike, cNew),
        lensPieceSlot: tL >= 1 ? after : tL <= 0 ? before : null,
        contextPieceSlot: tC >= 1 ? after : tC <= 0 ? before : null,
        oldValueShown: r(L.tagsC ? 1 : 0, 3),
        oldStruck: r(Math.max(lzStrike, cStrike), 3),
        zoom: r(zoomNow, 3),
        lensCopyAt: {x: r(S.x, 1), y: r(S.y, 1), w: r(S.w, 1), h: r(S.h, 1)},
        sourceHoldsDetail: inside({x: G.cab.cardX + M.tab.x, y: G.rows[Math.max(before, after)].stripTop + M.tab.y, w: M.tab.w, h: 1}, S) && inside({x: G.cab.cardX + M.tab.x, y: G.rows[Math.min(before, after)].stripTop, w: M.tab.w, h: M.stripH}, S),
        lensClearOfPeople: !lensBox || (!overlaps(lensBox, head, 0) && !overlaps(lensBox, bodyBox, 0) && !handBoxes.some(b => overlaps(lensBox, b, 0))),
        guidesOnSource: true,
        markerVisible: mp >= 1,
        markerClearOfPeople: !overlaps({x: L.mk.x - 0.6 * F, y: L.mk.y - 0.6 * F, w: 1.2 * F, h: 1.2 * F}, bodyBox, 0),
        before: L.before, after: L.after,
        pieceNumbers: L.pieces.map(q => q.number),
        shownPieces,
        pieceAt: posed.piecePose.size,
        layoutFits: L.fits,
        layoutIssues: L.issues,
        textPx: L.textPx,
        sharedTextPx: L.sharedTextPx,
        allReached: posed.reached,
      },
    };
  },
};

/**
 * Shared view (lens open): the context scaled by opt.sS (screen = sS * world + b) beside or above the lens.
 * Returns the transform, the lens destination in world coordinates and whether the growing window stays clear of
 * the assistant (head, upper body and the hands resting on the desk) all the way.
 */
function sharedPlace(G, z, src, opt, F, Mreg) {
  const sbW = G.bbox, sS = opt.sS;
  const lensWs = src.w * sS * opt.zoom, lensHs = src.h * sS * opt.zoom;
  let ctxS, destS;
  if (opt.place === 'left') {
    const tw = lensWs + 1.6 * F + sbW.w * sS;
    const x0 = Mreg.x + (Mreg.w - tw) / 2;
    ctxS = {x: x0 + lensWs + 1.6 * F, y: Mreg.y + (Mreg.h - sbW.h * sS) / 2};
    destS = {x: x0, y: Mreg.y + (Mreg.h - lensHs) / 2, w: lensWs, h: lensHs};
  } else {
    const hA = opt.hA ?? sbW.h;
    const th = Math.max(sbW.h * sS, hA * sS + 1.4 * F + lensHs);
    const y0 = Mreg.y + (Mreg.h - th) / 2;
    ctxS = {x: Mreg.x + (Mreg.w - sbW.w * sS) / 2, y: y0};
    destS = {x: Mreg.x + (Mreg.w - lensWs) / 2, y: y0 + hA * sS + 1.4 * F, w: lensWs, h: lensHs};
  }
  const shared = {s: sS, bx: ctxS.x - sS * sbW.x, by: ctxS.y - sS * sbW.y};
  const toWorld = q => ({x: (q.x - shared.bx) / sS, y: (q.y - shared.by) / sS, w: q.w / sS, h: q.h / sS});
  const body = {x: G.cx - 100 * z, y: G.face.y - 70 * z, w: 260 * z, h: G.yFar + 40 * z - (G.face.y - 70 * z)};
  const fits = d => { const w = toWorld(d); for (let q = 0; q <= 1.0001; q += 0.02) { const R = {x: lerp(src.x, w.x, q), y: lerp(src.y, w.y, q), w: lerp(src.w, w.w, q), h: lerp(src.h, w.h, q)}; if (overlaps(R, body, 0)) return false; } return true; };
  // slide the destination left (within the band) until the growing window keeps clear of the assistant
  let clear = fits(destS);
  for (let k = 1; !clear && k <= 30; k++) {
    const d = {...destS, x: Math.max(Mreg.x, destS.x - k * (destS.x - Mreg.x) / 30)};
    if (fits(d)) { destS = d; clear = true; }
  }
  return {shared, dest: toWorld(destS), clear};
}

/** Index sheet hanging beside the cabinet: one ruled row per compartment, each with its slot number in a small
 * box (pips), level with the compartments; the value tags are written on it, right of the numbers. */
function indexSheet(ctx, name, G, M, F, tagX, tagW, rowMid) {
  const th = ctx.theme;
  const x = tagX - SHEET_NUM - 0.35 * F, w = tagW + SHEET_NUM + 0.8 * F;
  const y0 = G.rows[G.n - 1].stripTop - 0.9 * F, y1 = G.rows[0].wallTop + 0.45 * F;
  const rows = [];
  for (let c = 0; c < G.n; c++) {
    const y = rowMid(c);
    const by = G.rows[c].wallTop + M.lip / 2;
    rows.push(h('line', {x1: r(x + 0.3 * F), x2: r(x + w - 0.3 * F), y1: r(by), y2: r(by), stroke: '#c9bea3', 'stroke-width': 2}));
    rows.push(h('path', {d: roundRectPath(x + 0.3 * F, y - 0.55 * F, SHEET_NUM - 0.25 * F, 1.1 * F, 4), fill: '#efe2bd', stroke: '#8a7440', 'stroke-width': 1.6}));
    rows.push(pips(c + 1, {cx: x + 0.3 * F + (SHEET_NUM - 0.25 * F) / 2, cy: y, hh: 1.0 * F, fill: '#6b5220'}));
  }
  return g({name},
    h('path', {d: roundRectPath(x + 5, y0 + 7, w, y1 - y0, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y0, w, y1 - y0, 6), fill: '#fbf6e9', stroke: INK, 'stroke-width': 2}),
    h('line', {x1: r(x + SHEET_NUM + 0.15 * F), x2: r(x + SHEET_NUM + 0.15 * F), y1: r(y0 + 0.6 * F), y2: r(y1 - 0.3 * F), stroke: '#d9a0a0', 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(x + w / 2 - 1.1 * F, y0 - 0.35 * F, 2.2 * F, 0.75 * F, 4), fill: '#b9c1c8', stroke: INK, 'stroke-width': 2}),
    rows);
}

/** Lens source: the tab column, the plates, the side path and the index sheet over the inspected rows (titles
 * stay outside); from the raised piece's tab (when it stands behind another piece) down to the lower row. */
function srcRect(G, M, F, before, after, target, RB, tagX, tagW, tagH) {
  const hiRow = Math.max(before, after), loRow = Math.min(before, after);
  const riseHi = (hiRow === after ? after : before) === target ? 0 : RB;
  const mid = c => G.rows[c].stripTop + M.stripH / 2;
  const x0 = G.cab.cardX + M.tab.x - 0.3 * F;
  const x1 = tagX + tagW + 0.65 * F;
  const y0 = Math.min(G.rows[hiRow].stripTop - riseHi + M.tab.y - 0.35 * F, mid(hiRow) - tagH / 2 - 0.3 * F);
  const y1 = Math.max(G.rows[loRow].wallTop + 0.3 * F, mid(loRow) + tagH / 2 + 0.3 * F);
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

/** Line from the current value tag to the plate of the slot it names (plain relation: dots, no arrowhead). */
function relLine(ctx, pre, G, M, F, tagX, rowMid) {
  const node = g({name: `${pre}rel`},
    h('line', {name: `${pre}rel-line`, x1: r(G.cab.r + 2), x2: r(tagX - 2), stroke: ctx.theme.fgSoft, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('circle', {name: `${pre}rel-a`, r: 4.5, fill: ctx.theme.fgSoft}),
    h('circle', {name: `${pre}rel-b`, r: 4.5, fill: ctx.theme.fgSoft}));
  return {
    node,
    frame(row, t) {
      const y = rowMid(row);
      const vis = t > 0 && t < 1 ? 0 : 1;
      return {
        [`${pre}rel-line`]: {y1: r(y), y2: r(y)}, [`${pre}rel`]: {opacity: vis},
        [`${pre}rel-a`]: {cx: r(G.cab.r + 2), cy: r(y)}, [`${pre}rel-b`]: {cx: r(tagX - 2), cy: r(y)},
      };
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-09-inspect',
    title: 'Case-file consultation — inspecting where the requested piece sits and substituting that position',
    titleEs: 'Consulta de expediente por auxiliar — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta de expediente por auxiliar',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'After a consultation, a lens enlarges the tabs, slot plates and value tag of a fictional case-file cabinet. The supplied position of the requested piece is substituted (found at slot 3 → found at slot 5): the old value stays struck and readable, the piece moves to the supplied slot, the context updates identically, and a neutral Δ marker keeps the change traceable. No consequence of the position is drawn.',
    tags: ['case file', 'expediente', 'lens', 'numbered slot', 'position', 'substitution', 'as supplied', 'changed datum'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-de-expediente.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
