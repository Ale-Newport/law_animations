/**
 * LAW-0016 — Redacción comparada · inspect
 *
 * Storyboard (context → zoom → substitute → return, 8 s):
 *  0.00–0.20  build: the state produced by the comparison — both versions
 *             aligned in the open folder, every modified word looped and
 *             linked across the gutter (links are drawn in), pen at rest.
 *  0.20–0.45  isolate: the camera really enlarges the scene around the
 *             focused word pair (same coordinates, no copy; its view never
 *             leaves the desk), while a live reduced copy of the whole desk
 *             appears as a context minimap with a viewport frame showing
 *             where we are, in the corner that leaves the enlarged words and
 *             the version tabs uncovered.
 *  0.45–0.75  substitute: ONE datum — the focused word(s) on the revised (or
 *             original) sheet — is replaced by the preset's alternative: the
 *             old words lift out, the new ones settle, the rest of that line
 *             re-flows, and the pen link re-anchors to the new words (or, if
 *             the new words equal their counterpart, the link and highlights
 *             retract: that pair no longer differs). A single editorial
 *             annotation in the band below the desk window keeps the old
 *             value readable, struck through.
 *  0.75–1.00  return: the camera pulls back to the whole desk; the minimap
 *             leaves and a "changed datum" marker stays pinned to the words.
 * Seeking to any time before the swap shows the previous datum exactly.
 * @module animations/documents/LAW-0016
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {inspectFields, int} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {pen as penTool} from '../../primitives/paper.js';
import {deskWindow} from '../../primitives/desk.js';
import {roundRectPath} from '../../core/geometry.js';
import {
  comparedFields, buildDiff, alignedLayout, sheetNode, segments, tokensNode, highlightNode, folderSpread,
  linkPoints, assignLanes, laneY, replacePhrase, markNode, tabGeometry, LINK_LEADING, COMPARE_STRINGS, STAGE,
} from './kits/redaccion-comparada.js';

const ID = 'LAW-0016';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  links: [0.03, 0.16], caption: [0.02, 0.1], zoomIn: [0.22, 0.4], mini: [0.22, 0.3],
  before: [0.4, 0.46], strike: [0.47, 0.52], swap: [0.5, 0.66], after: [0.62, 0.7],
  zoomOut: [0.76, 0.88], miniOut: [0.78, 0.86], marker: [0.86, 0.93],
};

const STRINGS = {
  en: {...COMPARE_STRINGS.en, revisedWord: 'Revised text', originalWord: 'Original text', context: 'Context'},
  es: {...COMPARE_STRINGS.es, revisedWord: 'Texto revisado', originalWord: 'Texto original', context: 'Contexto'},
};

const sceneSchema = {
  ...comparedFields,
  ...inspectFields(['revised', 'original']),
  focusEdit: int('Index (in `edits`) of the modified wording that is enlarged; its words on the focused sheet are the datum substituted', 0, 3),
};
sceneSchema.detailGeometry.properties.placement.description = 'Corner of the context minimap (auto = the corner that leaves the enlarged words uncovered, top right first; left / right = top corners; top = top right; bottom = bottom right)';

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
  signers: [{name: 'Lena Ortiz', role: 'Party A'}, {name: 'Kofi Mensah', role: 'Party B'}],
  redactions: [],
  focusTarget: 'revised',
  focusEdit: 0,
  beforeValue: 'digital',
  afterValue: 'online',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'Aligned versions after the comparison', marker: 'Datum changed'},
};

const norm = v => String(v).trim().toLowerCase();

/** A copy of a desk geometry with every vertical position moved by dy. */
function shiftStage(G, dy) {
  const y = v => v + dy;
  return {...G, A: [G.A[0], y(G.A[1])], B: [G.B[0], y(G.B[1])], folder: [G.folder[0], y(G.folder[1]), G.folder[2], G.folder[3]], pen: {...G.pen, rest: [G.pen.rest[0], y(G.pen.rest[1])]}};
}

/**
 * Per shape: how far the context moves up (the story's desk keeps free space
 * for the incoming sheet, not needed here) and the height of the desk window
 * that remains. The context caption sits in a strip above the window and the
 * before → after annotation in a band below it — both outside the camera, so
 * neither ever covers the enlarged text or a label inside the desk.
 */
const FRAME = {
  landscape: {dy: -120, deskH: 860},
  square: {dy: -110, deskH: 968},
  portrait: {dy: -300, deskH: 1062},
};

const scene = {
  sizes: {landscape: [STAGE.landscape.w, STAGE.landscape.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.portrait.w, STAGE.portrait.h]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    // The context moves up into a shorter desk window; the band below the
    // window holds the before → after annotation.
    const Fr = FRAME[shape];
    const G = shiftStage(STAGE[shape], Fr.dy);
    const SW = G.w; // design width
    const DH = Fr.deskH; // desk window (camera) height
    // context caption strip above the window (outside the camera)
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 10, y: 6, maxWidth: SW - 20, size: 32, maxLines: 2, name: 'ctx-caption', weight: 600}) : null;
    const capH = ctxCap ? ctxCap.box.h + 22 : 0;
    const showKey = ctx.show('key');
    const diff = buildDiff(p.clauses, p.edits, p.redactions);

    // --- the focused change and its two values (falls back to the first linked change)
    const linkedIds = diff.order;
    const fi = linkedIds.includes(p.focusEdit) ? p.focusEdit : (linkedIds[0] ?? -1);
    const side = p.focusTarget === 'original' ? 'A' : 'B';
    const other = side === 'A' ? 'B' : 'A';
    const fc = fi >= 0 ? diff.changes[fi] : null;
    const focusRow = fc ? fc.clause : 0;
    const rows = diff.rows.map(row => ({...row}));
    let beforeTok = null, afterTok = null;
    if (fc) {
      beforeTok = replacePhrase(rows[focusRow][side], fi, p.beforeValue);
      afterTok = replacePhrase(rows[focusRow][side], fi, p.afterValue);
      rows[focusRow] = {...rows[focusRow], [side]: beforeTok};
    }
    const counterpart = fc ? (side === 'B' ? fc.from : fc.to) : '';
    const differsBefore = fc ? norm(p.beforeValue) !== norm(counterpart) : false;
    const differsAfter = fc ? norm(p.afterValue) !== norm(counterpart) : false;

    const [sw, sh] = G.sheet;
    const L = alignedLayout(ctx, {w: sw, h: sh, rows, size: G.body[0], minSize: G.body[1] * 0.8, docId: p.documentId, title: p.documentTitle, leading: LINK_LEADING,
      extra: fc ? {[focusRow]: [afterTok]} : undefined});
    const aTL = {x: G.A[0] - sw / 2, y: G.A[1] - sh / 2};
    const bTL = {x: G.B[0] - sw / 2, y: G.B[1] - sh / 2};
    const TL = {A: aTL, B: bTL};
    const place = key => L.place.map(q => q[key]);
    const placedBefore = fc ? L.place[focusRow][side] : null;
    const placedAfter = fc ? L.place[focusRow].extra[0] : null;
    const world = (tl, b) => ({x: tl.x + b.x, y: tl.y + b.y, w: b.w, h: b.h, lineTop: tl.y + b.lineTop, row: b.row, line: b.line});
    const segBefore = fc ? world(TL[side], segments(placedBefore, fi, L.size)[0]) : null;
    const segAfter = fc ? world(TL[side], segments(placedAfter, fi, L.size)[0]) : null;
    const segOther = fc ? world(TL[other], segments(L.place.flatMap(q => q[other]), fi, L.size)[0]) : null;
    const xR = aTL.x + sw - L.pad * 0.3;
    const xL = bTL.x + L.pad * 0.3;

    // pen links of the other changes (static); lanes planned for all links at once
    const tokA = L.place.flatMap(q => q.A), tokB = L.place.flatMap(q => q.B);
    const pairsAB = linkedIds.map(i => ({i, sa: segments(tokA, i, L.size)[0], sb: segments(tokB, i, L.size)[0]})).filter(x => x.sa && x.sb);
    const lanes = assignLanes(L, pairsAB);
    const links = [];
    let focusSides = {A: 'above', B: 'above'};
    pairsAB.forEach(({i, sa, sb}, k) => {
      const ln = lanes[k];
      if (i === fi) { focusSides = {A: ln.A, B: ln.B}; return; }
      links.push({i, m: linkPoints(ctx, world(aTL, sa), world(bTL, sb), {size: L.size, xR, xL, laneSideA: ln.A, laneSideB: ln.B, laneA: aTL.y + ln.laneA, laneB: bTL.y + ln.laneB, key: `insp-link${i}`})});
    });
    // lanes of the focused link before / after the substitution (the datum may re-flow to another line)
    const segLocal = sg => ({row: sg.row, line: sg.line, lineTop: sg.lineTop - TL[side].y});
    const belowSide = focusSides[side] === 'below', belowOther = focusSides[other] === 'below';
    const laneSide0 = fc ? TL[side].y + laneY(L, segLocal(segBefore), belowSide) : 0;
    const laneSide1 = fc ? TL[side].y + laneY(L, segLocal(segAfter), belowSide) : 0;
    const laneOther = fc ? TL[other].y + laneY(L, {row: segOther.row, line: segOther.line, lineTop: segOther.lineTop - TL[other].y}, belowOther) : 0;
    const focusLink = q => {
      const moving = {x: lerp(segBefore.x, segAfter.x, q), y: lerp(segBefore.y, segAfter.y, q), w: lerp(segBefore.w, segAfter.w, q), h: segBefore.h, lineTop: lerp(segBefore.lineTop, segAfter.lineTop, q)};
      const A = side === 'A' ? moving : segOther;
      const B = side === 'B' ? moving : segOther;
      const laneMoving = lerp(laneSide0, laneSide1, q);
      return linkPoints(ctx, A, B, {size: L.size, xR, xL, laneSideA: focusSides.A, laneSideB: focusSides.B, laneA: side === 'A' ? laneMoving : laneOther, laneB: side === 'B' ? laneMoving : laneOther, key: `insp-link${fi}`});
    };

    // focused row split: prefix (static), phrase before/after, suffix (slide or cross-fade)
    let split = null;
    if (fc) {
      const idxB = placedBefore.findIndex(q => q.change === fi);
      const idxA = placedAfter.findIndex(q => q.change === fi);
      const lastB = placedBefore.map(q => q.change).lastIndexOf(fi);
      const lastA = placedAfter.map(q => q.change).lastIndexOf(fi);
      const pre = placedBefore.slice(0, idxB);
      const phraseB = placedBefore.slice(idxB, lastB + 1);
      const phraseA = placedAfter.slice(idxA, lastA + 1);
      const postB = placedBefore.slice(lastB + 1);
      const postA = placedAfter.slice(lastA + 1);
      const lineOfPhrase = phraseB.length ? phraseB[phraseB.length - 1].line : 0;
      const lineAfter = phraseA.length ? phraseA[phraseA.length - 1].line : 0;
      // the rest of the line can simply slide when no word changes line
      const sameLines = lineOfPhrase === lineAfter && postB.length === postA.length && postB.every((q, k) => q.line === postA[k].line);
      const kk = postB.findIndex(q => q.line === lineOfPhrase);
      const shift = sameLines && kk >= 0 ? postA[kk].x - postB[kk].x : 0;
      split = {pre, phraseB, phraseA, postB, postA, sameLines, shift, lineOfPhrase};
    }

    // --- one composition, built twice: the live context (camera) and the minimap copy
    const build = (P, showText, full) => {
      const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: SW, h: DH, radius: 30});
      const [fx, fy, fw, fh] = G.folder;
      const spineX = (aTL.x + sw + bTL.x) / 2 - fx;
      const labelsShown = showText && showKey;
      const sheet = key => sheetNode(ctx, L, {prefix: `${P}-${key}`, tokens: place(key), side: key, tab: key === 'A' ? t.original : t.revised, showText: labelsShown, showKey: labelsShown,
        hlOpacity: 1, omitRows: key === side && fc ? [focusRow] : [], skipHl: []}).node;
      // words of the row + highlights of any OTHER modified words sharing it
      const part = (toks, attrs) => {
        const others = [...new Set(toks.filter(q => q.change >= 0 && q.change !== fi).map(q => q.change))];
        return g(attrs, others.map(j => highlightNode(ctx, L, undefined, segments(toks, j, L.size), side, 1, toks.some(q => q.change === j && q.gap))), tokensNode(ctx, L, toks, labelsShown));
      };
      const focusRowNode = !fc ? null : g({transform: T(TL[side].x, TL[side].y)},
        highlightNode(ctx, L, `${P}-fhl0`, segments(placedBefore, fi, L.size), side, 1, placedBefore.some(q => q.change === fi && q.gap)),
        highlightNode(ctx, L, `${P}-fhl1`, segments(placedAfter, fi, L.size), side, 0, placedAfter.some(q => q.change === fi && q.gap)),
        part(split.pre, null),
        tokensNode(ctx, L, split.phraseB, labelsShown, {name: `${P}-ph0`}),
        tokensNode(ctx, L, split.phraseA, labelsShown, {name: `${P}-ph1`, opacity: 0}),
        split.sameLines
          ? g(null,
            part(split.postB.filter(q => q.line === split.lineOfPhrase), {name: `${P}-post-slide`}),
            part(split.postB.filter(q => q.line !== split.lineOfPhrase), null))
          : g(null,
            part(split.postB, {name: `${P}-post0`}),
            part(split.postA, {name: `${P}-post1`, opacity: 0})),
      );
      const bands = g({opacity: 1}, L.rows.map((row, ci) => h('rect', {x: r(aTL.x + L.pad * 0.5), y: r(aTL.y + row.top - L.size * 0.22), width: r(bTL.x + sw - L.pad * 0.5 - aTL.x - L.pad * 0.5), height: r(row.h + L.size * 0.1), rx: 8, fill: ci % 2 ? th.accent2Soft : th.accent3Soft, opacity: 0.34})));
      const ink = Math.max(3, L.size * 0.13);
      const penNode = penTool(ctx, {name: `${P}-pen`, length: Math.round(sw * 0.36), body: th.accent}).node;
      return {
        desk,
        node: g(null,
          desk.surface,
          g({'clip-path': desk.clip},
            g({transform: T(fx, fy)}, folderSpread(ctx, {w: fw, h: fh, label: '', showKey: false, spineX})),
            g({transform: T(aTL.x, aTL.y)}, sheet('A')),
            g({transform: T(bTL.x, bTL.y)}, sheet('B')),
            focusRowNode,
            bands,
            links.map(k => markNode(`${P}-link${k.i}`, k.m, th.accent, ink)),
            fc ? h('path', {name: `${P}-flink`, fill: 'none', stroke: th.accent, 'stroke-width': ink, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}) : null,
            g({transform: T(G.pen.rest[0], G.pen.rest[1], 62)}, penNode),
          ),
          full ? desk.frame : h('path', {d: roundRectPath(0, 0, SW, DH, 30), fill: 'none', stroke: th.ink, 'stroke-width': 6}),
        ),
      };
    };
    const main = build('c', true, true);
    const mini = build('m', false, false);

    // --- region to enlarge: the pair (old words, new words and their
    // counterpart, with the link between them) when it can still be enlarged;
    // otherwise the focused row of the focused sheet and the gutter its link crosses
    const port = shape === 'portrait';
    const pad = L.size * 1.6;
    const unionBox = boxes => {
      const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
      const x1 = Math.max(...boxes.map(b => b.x + b.w)), y1 = Math.max(...boxes.map(b => b.y + b.h));
      return {x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2};
    };
    const wanted = p.detailGeometry.zoom;
    const fitIn = (b, fr) => Math.min(fr.w * 0.92 / b.w, fr.h * 0.8 / b.h);
    const pairRegion = fc ? unionBox([segBefore, segAfter, segOther]) : {x: SW * 0.3, y: DH * 0.3, w: SW * 0.4, h: DH * 0.3};
    const gxm = (aTL.x + sw + bTL.x) / 2;
    const rowRegion = fc ? unionBox([segBefore, segAfter, {x: TL[side].x + L.pad * 0.4, y: TL[side].y + L.rows[focusRow].top, w: sw - L.pad * 0.8, h: L.rows[focusRow].h}, {x: gxm - 20, y: segBefore.lineTop, w: 40, h: 10}]) : pairRegion;

    // --- minimap corner + camera. The camera never shows beyond the desk (its
    // view is clamped to the window) and the enlarged region must stay clear
    // of the minimap: each allowed corner (and the free part beside or
    // below/above it) is tried; the plan that leaves the region uncovered and
    // enlarges it most wins.
    const mw = port ? SW * 0.32 : SW * 0.22;
    const mk = mw / SW;
    const mh = DH * mk;
    const placement = p.detailGeometry.placement;
    const CORNERS = {tr: [SW - mw - 24, 24], tl: [24, 24], br: [SW - mw - 24, DH - mh - 24], bl: [24, DH - mh - 24]};
    const allowed = placement === 'left' ? ['tl'] : placement === 'right' || placement === 'top' ? ['tr'] : placement === 'bottom' ? ['br'] : ['tr', 'tl', 'br', 'bl'];
    const overlapArea = (a2, b2) => Math.max(0, Math.min(a2.x + a2.w, b2.x + b2.w) - Math.max(a2.x, b2.x)) * Math.max(0, Math.min(a2.y + a2.h, b2.y + b2.h) - Math.max(a2.y, b2.y));
    // version tabs (labels) should not end up under the minimap either
    const tabBoxes = ['A', 'B'].map(k2 => {
      const tg2 = tabGeometry(ctx, L, k2 === 'A' ? t.original : t.revised);
      return {x: TL[k2].x + tg2.box.x, y: TL[k2].y + tg2.box.y, w: tg2.box.w, h: tg2.box.h};
    });
    const plan = reg => {
      let best = null;
      const rc = {x: reg.x + reg.w / 2, y: reg.y + reg.h / 2};
      for (const key of allowed) {
        const [cmx, cmy] = CORNERS[key];
        const mini2 = {x: cmx - 16, y: cmy - 16, w: mw + 32, h: mh + 32};
        const beside = cmx < SW / 2 ? {x: cmx + mw + 32, y: 0, w: SW - cmx - mw - 32, h: DH} : {x: 0, y: 0, w: cmx - 32, h: DH};
        const band = cmy > DH / 2 ? {x: 0, y: 0, w: SW, h: cmy - 24} : {x: 0, y: cmy + mh + 24, w: SW, h: DH - cmy - mh - 24};
        for (const free of [beside, band]) {
          const K = Math.max(1.2, Math.min(wanted, fitIn(reg, free)));
          const want = {x: free.x + free.w / 2, y: free.y + free.h / 2};
          const V = {x: clamp(rc.x - want.x / K, 0, SW - SW / K), y: clamp(rc.y - want.y / K, 0, DH - DH / K)};
          const mapped = {x: (reg.x - V.x) * K, y: (reg.y - V.y) * K, w: reg.w * K, h: reg.h * K};
          const tabsCover = tabBoxes.reduce((acc, tb) => acc + overlapArea({x: (tb.x - V.x) * K, y: (tb.y - V.y) * K, w: tb.w * K, h: tb.h * K}, mini2), 0);
          const cover = overlapArea(mapped, mini2) + 0.5 * tabsCover;
          if (!best || cover < best.cover - 1 || (Math.abs(cover - best.cover) <= 1 && K > best.K + 1e-6)) best = {key, mx: cmx, my: cmy, K, V, cover, region: reg};
        }
      }
      return best;
    };
    // the word pair with its link when it can be enlarged enough; else the focused row
    const pairPlan = plan(pairRegion);
    const cam = pairPlan.K >= Math.min(wanted, 1.4) - 1e-6 || !fc ? pairPlan : plan(rowRegion);
    const region = cam.region;
    const focusC = {x: region.x + region.w / 2, y: region.y + region.h / 2};
    const {mx, my} = cam;
    const zoom = cam.K;
    const view1 = cam.V;
    const screenC = {x: (focusC.x - view1.x) * zoom, y: (focusC.y - view1.y) * zoom};
    const miniNode = g({name: 'mini', opacity: 0},
      h('path', {d: roundRectPath(mx - 8, my - 8, mw + 16, mh + 16, 16), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      g({transform: T(mx, my, 0, mk)}, mini.node,
        h('rect', {name: 'mini-view', fill: 'none', stroke: th.accent2, 'stroke-width': r(5 / mk), rx: r(8 / mk)})),
    );

    // --- single editorial annotation (before → after) in the band below the window:
    // side by side on wide boxes, stacked on tall ones; the old value is struck through
    const label = side === 'B' ? t.revisedWord : t.originalWord;
    const bandTop = capH + DH + 18;
    const annSpec = port ? {maxWidth: SW - 80} : {maxWidth: (SW - 100) / 2 - 40};
    const afterStyle = {fill: side === 'B' ? th.accent2Soft : th.accentSoft, stroke: side === 'B' ? th.accent2 : th.accent};
    const mkChip = (text, at, anchor, extra) => chip(ctx, text, {x: at.x, y: at.y, anchor, size: 34, maxLines: 2, fill: th.card, ...annSpec, ...extra});
    let beforeChip = null, afterChip = null, arrowD = null;
    let bandH = 30;
    if (showKey) {
      const b0 = mkChip(`${label}: ${p.beforeValue}`, {x: 0, y: 0}, 'middle', {});
      const a0 = mkChip(`${label}: ${p.afterValue}`, {x: 0, y: 0}, 'middle', afterStyle);
      if (port) {
        const gap = 52;
        const y0 = bandTop + 6;
        bandH = b0.box.h + gap + a0.box.h + 30;
        beforeChip = mkChip(`${label}: ${p.beforeValue}`, {x: SW / 2, y: y0}, 'middle', {name: 'ann-before'});
        afterChip = mkChip(`${label}: ${p.afterValue}`, {x: SW / 2, y: y0 + b0.box.h + gap}, 'middle', {...afterStyle, name: 'ann-after'});
        const ay0 = y0 + b0.box.h + 10, ay1 = y0 + b0.box.h + gap - 10;
        arrowD = `M${r(SW / 2)} ${r(ay0)}V${r(ay1)}m-9 -10l9 10l9 -10`;
      } else {
        const hh = Math.max(b0.box.h, a0.box.h);
        const yb = bandTop + 4;
        bandH = hh + 26;
        beforeChip = mkChip(`${label}: ${p.beforeValue}`, {x: SW / 2 - 36, y: yb + (hh - b0.box.h) / 2}, 'end', {name: 'ann-before'});
        afterChip = mkChip(`${label}: ${p.afterValue}`, {x: SW / 2 + 36, y: yb + (hh - a0.box.h) / 2}, 'start', {...afterStyle, name: 'ann-after'});
        const ay = yb + hh / 2;
        arrowD = `M${r(SW / 2 - 16)} ${r(ay)}h30m-10 -9l10 9l-10 9`;
      }
    }
    const SH = bandTop + bandH; // design height: caption strip + window + annotation band
    const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s) / 2, oy = (ctx.design.h - SH * s) / 2;
    // strike-through of the old value, line by line
    const strikes = beforeChip ? beforeChip.fit.lines.map((ln, j) => {
      const f = beforeChip.fit;
      const lw = ctx.measure(ln, f.size, f.weight || 600, 'sans');
      const padY = 34 * 0.38;
      const y = beforeChip.box.y + padY + j * f.lineHeight + f.size * 0.5;
      return {x1: beforeChip.box.cx - lw / 2 - 6, x2: beforeChip.box.cx + lw / 2 + 6, y, len: lw + 12};
    }) : [];
    const strikeNodes = strikes.map((q, j) => h('line', {name: `ann-strike-${j}`, x1: r(q.x1), x2: r(q.x2), y1: r(q.y), y2: r(q.y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(q.len)} ${r(q.len + 10)}`, 'stroke-dashoffset': r(q.len)}));

    // --- changed-datum marker pinned to the words (inside the camera group).
    // Its label sits above the sheet; the dotted leader leaves the pin into the
    // line gap above the words, runs to the sheet's outer margin (away from
    // the gutter the links cross) and climbs that margin, so it crosses no text.
    let marker = g({name: 'marker', opacity: 0});
    if (fc) {
      const outerRight = side === 'B';
      const pin = outerRight ? {x: segAfter.x + segAfter.w + 6, y: segAfter.lineTop - L.size * 0.2} : {x: segAfter.x - 6, y: segAfter.lineTop - L.size * 0.2};
      const laneW = TL[side].y + laneY(L, segLocal(segAfter), false);
      const xm = outerRight ? TL[side].x + sw - L.pad * 0.42 : TL[side].x + L.pad * 0.42;
      const tg = tabGeometry(ctx, L, side === 'A' ? t.original : t.revised);
      let leader = null, markChip = null;
      if (showKey) {
        // one line when it fits (it then stays clear of the caption strip's side of the desk), else two
        const one = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: Math.min(660, SW - 40), size: 26, maxLines: 1});
        const mSpec = one.fit.truncated ? {maxWidth: Math.min(460, SW - 40), maxLines: 2} : {maxWidth: Math.min(660, SW - 40), maxLines: 1};
        const probe = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, size: 26, ...mSpec});
        const cw = probe.box.w, chH = probe.box.h;
        let cx = outerRight ? xm + 24 - cw : xm - 24;
        cx = clamp(cx, 16, SW - 16 - cw);
        // just above the sheet, or above its tab when the label would overlap the tab
        const tabX0 = TL[side].x + tg.box.x, tabX1 = tabX0 + tg.box.w;
        const overTab = cx < tabX1 + 8 && cx + cw > tabX0 - 8;
        const cy = TL[side].y - 12 - chH - (overTab ? tg.box.h : 0);
        markChip = chip(ctx, p.contextLabels.marker, {x: cx, y: cy, anchor: 'start', size: 26, ...mSpec, fill: th.card, stroke: th.accent2});
        const pts = [{x: pin.x + (outerRight ? 12 : -12), y: pin.y - 12}, {x: pin.x + (outerRight ? 12 : -12), y: laneW}, {x: xm, y: laneW}, {x: xm, y: cy + chH}];
        leader = h('path', {d: `M${pts.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '6 6', 'stroke-linejoin': 'round'});
      }
      marker = g({name: 'marker', opacity: 0},
        leader,
        h('circle', {cx: r(pin.x), cy: r(pin.y), r: 17, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
        h('path', {d: `M${r(pin.x)} ${r(pin.y - 7)}l7 12.25h-14z`, fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        markChip && markChip.node,
      );
    }

    return {SW, SH, DH, capH, s, ox, oy, L, main, mini, miniNode, links, fc, fi, side, split, focusLink, differsBefore, differsAfter, region, zoom, focusC, screenC, view1, mx, my, mk, miniCorner: cam.key,
      beforeChip, afterChip, arrowD, strikes, strikeNodes, ctxCap, marker, focusRow, segBefore, segAfter};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.ctxCap && L.ctxCap.node,
      g({transform: T(0, L.capH)},
        g({'clip-path': L.main.desk.clip}, g({name: 'cam'}, L.main.node, L.marker)),
        L.main.desk.frame,
        L.miniNode),
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strikeNodes,
        h('path', {name: 'ann-arrow', d: L.arrowD, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const reduced = ctx.reduced;
    // camera
    const zin = ease.inOutCubic(seg(u, ...W.zoomIn));
    const zout = ease.inOutCubic(seg(u, ...W.zoomOut));
    const zp = zin * (1 - zout);
    // zoom-to-rect: scale and view origin move together, so the view never leaves the desk
    const k = lerp(1, L.zoom, zp);
    const v0 = {x: lerp(0, L.view1.x, zp), y: lerp(0, L.view1.y, zp)};
    nodes.cam = {transform: `scale(${r(k, 4)}) translate(${r(-v0.x, 2)} ${r(-v0.y, 2)})`};
    const view = {x: v0.x, y: v0.y, w: L.SW / k, h: L.DH / k};
    nodes['mini-view'] = {x: r(view.x), y: r(view.y), width: r(view.w), height: r(view.h)};
    nodes.mini = {opacity: r(seg(u, ...W.mini) * (1 - seg(u, ...W.miniOut)), 3)};
    // links of the context are drawn in during the build beat
    const lp = ease.inOutSine(seg(u, ...W.links));
    for (const P of ['c', 'm']) {
      L.links.forEach(k2 => {
        nodes[`${P}-link${k2.i}`] = {'stroke-dashoffset': r(k2.m.poly.total * (1 - lp)), opacity: lp > 0 ? 1 : 0};
      });
    }
    // substitution of the single datum
    const sw = ease.inOutSine(seg(u, ...W.swap));
    const datum = u < W.swap[0] ? 'before' : u >= W.swap[1] ? 'after' : 'changing';
    let linkState = 'none';
    let linkEnd = null;
    if (L.fc) {
      const m = L.focusLink(sw);
      // link drawn with the others; retracts (or grows back) when the pair stops (or starts) differing
      const differ = lerp(L.differsBefore ? 1 : 0, L.differsAfter ? 1 : 0, clamp(sw * 1.4 - 0.2));
      const drawn = lp * differ;
      linkState = drawn >= 0.999 ? 'linked' : drawn <= 0.001 ? 'unlinked' : 'changing';
      const q = m.poly.at(1);
      linkEnd = {x: r(q.x), y: r(q.y)};
      for (const P of ['c', 'm']) {
        nodes[`${P}-flink`] = {d: m.poly.d(1), 'stroke-dasharray': `${r(m.poly.total)} ${r(m.poly.total + 24)}`, 'stroke-dashoffset': r(m.poly.total * (1 - drawn)), opacity: drawn > 0.001 ? 1 : 0};
        const out = clamp(sw * 2), inn = clamp(sw * 2 - 1);
        nodes[`${P}-ph0`] = {opacity: r(1 - out, 3), transform: T(0, reduced ? 0 : -L.L.size * 0.5 * out)};
        nodes[`${P}-ph1`] = {opacity: r(inn, 3), transform: T(0, reduced ? 0 : L.L.size * 0.5 * (1 - inn))};
        nodes[`${P}-fhl0`] = {opacity: r((1 - sw) * (L.differsBefore ? 1 : 0), 3)};
        nodes[`${P}-fhl1`] = {opacity: r(sw * (L.differsAfter ? 1 : 0), 3)};
        if (L.split.sameLines) nodes[`${P}-post-slide`] = {transform: T(L.split.shift * sw, 0)};
        else {
          nodes[`${P}-post0`] = {opacity: r(1 - clamp(sw * 2), 3)};
          nodes[`${P}-post1`] = {opacity: r(clamp(sw * 2 - 1), 3)};
        }
        // the counterpart word keeps its highlight only while the pair differs
        const otherKey = L.side === 'B' ? 'A' : 'B';
        nodes[`${P}-${otherKey}-hl-${L.fi}`] = {opacity: r(differ, 3)};
      }
    }
    // annotation, caption, marker
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      L.strikes.forEach((q, j) => { nodes[`ann-strike-${j}`] = {'stroke-dashoffset': r(q.len * (1 - seg(u, ...W.strike)))}; });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      // the arrow appears as the old value is struck, pointing to the new one
      nodes['ann-arrow'] = {opacity: r(seg(u, ...W.strike), 3)};
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.caption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const p = ctx.params;
    const srcC = {x: L.focusC.x, y: L.focusC.y};
    const onScreen = {x: (srcC.x - v0.x) * k, y: (srcC.y - v0.y) * k};
    return {
      nodes,
      semantic: {
        beat,
        zoom: r(k, 3),
        zoomProgress: r(zp, 3),
        datum,
        shownValue: datum === 'after' ? p.afterValue : datum === 'before' ? p.beforeValue : null,
        focusTarget: L.side === 'B' ? 'revised' : 'original',
        focusEdit: L.fi,
        focusSource: {x: r(L.region.x), y: r(L.region.y), w: r(L.region.w), h: r(L.region.h)},
        focusOnScreen: {x: r(onScreen.x), y: r(onScreen.y)},
        screenTarget: {x: r(L.screenC.x), y: r(L.screenC.y)},
        viewport: {x: r(view.x), y: r(view.y), w: r(view.w), h: r(view.h)},
        linkState,
        linkEnd,
        otherLinksDrawn: r(lp, 3),
        otherLinks: L.links.length,
        minimapVisible: nodes.mini.opacity > 0,
        minimapCorner: L.miniCorner,
        markerVisible: u >= W.marker[0],
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
    slug: 'documents-04-inspect',
    title: 'Compared drafting — zoom into one modified word and replace it',
    titleEs: 'Redacción comparada — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Redacción comparada',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The finished comparison (aligned versions with every modified word linked) is enlarged around one linked word pair while a live minimap keeps the context. One datum — the focused words — is replaced: its line re-flows and the pen link re-anchors, or retracts when the new words equal their counterpart. The old value stays readable in a single annotation, and the camera returns to the context with a changed-datum marker.',
    tags: ['comparison', 'inspect', 'zoom', 'minimap', 'before-after', 'substitution', 'wording', 'document'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/redaccion-comparada.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
