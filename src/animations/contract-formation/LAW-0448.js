/**
 * LAW-0448 — Aceptación y contrapropuesta · inspect
 *
 * Storyboard (context = the state produced by the story's action: the copy set
 * has arrived in the reply, so the reply carries every supplied piece; Party B
 * still holds a blank piece; Party A waits by the rail):
 *  0.00–0.20  context: the whole term board at rest; the inspected reply piece
 *             shows the supplied before value (the copy of the offer's piece).
 *  0.20–0.32  isolate: a lens grows out of that reply row (a real enlarged
 *             copy of the stage — board, pieces, spine, B's hands — cropped to
 *             the row, ≥ 1.5×) and settles over the offer area, never over a
 *             person; guides join lens and row; the scene is dimmed. The lens
 *             is opaque from its first frame (no double image).
 *  0.35–0.41  the old value is struck, line by line, inside the lens.
 *  0.43–0.66  the datum changes IN THE SCENE and the lens shows it live: B's
 *             far hand opens the row's latch, lifts the copy out (turning it
 *             face-down in its slot, so no text crosses the rim) and holds it at
 *             the side; B's near hand seats the blank piece in the empty slot and
 *             turns it face-up there: the supplied after value. It stays still
 *             ≥ 400 ms in the open lens.
 *  0.74–1.00  return: the lens closes onto the identical row; a neutral Δ on
 *             the new piece, the Δ key with the supplied marker label, the
 *             struck "was:" value and the "as supplied · no conclusion drawn"
 *             key. The offer still shows its printed piece. Seeking back
 *             restores the old datum exactly. No validity or outcome is drawn.
 * @module animations/contract-formation/LAW-0448
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {str, num, obj, oneOf, list} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {
  motifFields, responseItem, DEFAULT_CONTENT, KIT_STRINGS, solveStage, buildStage, chipW, fitW, overlaps, insideBox,
  unionBox, legendChip, peopleBoxes, headBox, figureBox, SHEET, TILE, pieceArt, tabColor,
} from './kits/aceptacion-contrapropuesta.js';

const ID = 'LAW-0448';
const DURATION = 8000;
const W = {
  open: [0.2, 0.28], strike: [0.35, 0.41], remove: [0.43, 0.58], insert: [0.5, 0.62], turn: [0.62, 0.66], nearBack: [0.67, 0.74],
  close: [0.74, 0.8], marker: [0.8, 0.84], notes: [0.83, 0.88],
  // the panel (context caption, legend, key) fills the lens's part of the frame at rest and at the hold; it leaves
  // before the lens opens there and returns after it has closed
  // (a tight hand-over: the panel is gone as the lens starts, and back as the lens ends — never ~200 ms with neither)
  panelOut: [0.18, 0.2], panelIn: [0.8, 0.84],
};
const FOCUS = ['term-1', 'term-2', 'term-3', 'term-4'];

const STRINGS = {
  en: {...KIT_STRINGS.en, was: 'was', legPrinted: 'Printed piece on the offer', legCopy: 'Copy carried by the reply', legHeld: 'Piece the answering party holds (as supplied)'},
  es: {...KIT_STRINGS.es, was: 'antes', legPrinted: 'Pieza impresa en la oferta', legCopy: 'Copia que lleva la respuesta', legHeld: 'Pieza que sostiene la parte que responde (según lo aportado)'},
};

const sceneSchema = {
  ...motifFields,
  responses: list('The response in the context (the story\'s reply; its reference is printed on the reply sheet)', responseItem, 1, 2),
  focusTarget: oneOf('Which reply piece is enlarged and substituted (term-1 = first supplied term)', FOCUS),
  beforeValue: str('Value the inspected reply piece shows before the substitution (the copy of the offer\'s piece)', 60),
  afterValue: str('Value printed on the piece that replaces it (the alternative datum)', 60),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens (≥ 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'above', 'left'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 70)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  responses: [{reference: 'RE-2041', mode: 'same-terms'}],
  focusTarget: 'term-2',
  beforeValue: 'Day 10',
  afterValue: 'Day 14',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'Reply RE-2041 on the term board (as supplied)', marker: 'Changed: the delivery piece in the reply'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}
const range = (a, b, step) => { const out = []; for (let v = a; v >= b - 1e-9; v -= step) out.push(Math.round(v * 1000) / 1000); return out; };

/** Terms as the context shows them: the inspected reply piece carries the supplied before value. */
function contextTerms(p, k) {
  return p.terms.map((t, i) => (i === k ? {...t, value: p.beforeValue} : t));
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const upx = unitPx(ctx);
    const k = Math.min(p.terms.length - 1, FOCUS.indexOf(p.focusTarget));
    // geometry: the reply carries every copy; B holds the piece with the after value
    const R = {reference: p.responses[0].reference, substituted: true, k, value: p.afterValue, label: p.terms[k].label};
    const terms = contextTerms(p, k);
    const captions = [0, 1].map(i => (p.parties[i].role ? `${p.parties[i].name} · ${p.parties[i].role}` : p.parties[i].name));
    const first = shape === 'portrait' ? [{F: 30, FL: 25, min: 24, chip: 23}, {F: 26, FL: 22.5, min: 21.5, chip: 21.5}] : [{F: 24, FL: 21, min: 20.5, chip: 20.5}, {F: 22, FL: 20.5, min: 20, chip: 20}];
    const pxSets = [...first, {F: 21, FL: 19.8, min: 19.6, chip: 19.6}, {F: 19, FL: 17, min: 16.5, chip: 16.5}, {F: 17.5, FL: 16.5, min: 16.2, chip: 16.2}, {F: 16.6, FL: 16.1, min: 16.05, chip: 16.05}];
    // the context keeps one part of the frame at rest; the lens opens in the free part beside it (right) or under it
    const fr = [0.46, 0.5, 0.54, 0.58, 0.62, 0.66, 0.7];
    const splits = shape === 'landscape' ? [...fr.map(f => ({dir: 'right', frac: f})), ...fr.map(f => ({dir: 'right', frac: f, stackFirst: true}))]
      // (tall: also the stacked board with the lens at its right, for a narrow, tall crop)
      : shape === 'portrait' ? [...fr.map(f => ({dir: 'below', frac: f})), ...fr.map(f => ({dir: 'below', frac: f, stackFirst: true})), ...[0.5, 0.54, 0.58].map(f => ({dir: 'right', frac: f, stackFirst: true}))]
        // (square, lens at the right: the stacked board — the offer's row right above the reply's — makes a narrow crop)
        : [...fr.map(f => ({dir: 'right', frac: f, stackFirst: true})), ...fr.map(f => ({dir: 'below', frac: f})), ...fr.map(f => ({dir: 'right', frac: f})), ...fr.map(f => ({dir: 'below', frac: f, stackFirst: true}))];
    const cache = new Map();
    // splits nearest the middle first; each search step is a dry layout (geometry, crop and checks only); the chosen
    // one is then built once
    const mid = shape === 'square' ? 0.54 : 0.54;
    splits.sort((a1, b1) => Math.abs(a1.frac - mid) - Math.abs(b1.frac - mid));
    const rank = c => [c.ok ? 1 : 0, c.G.ok ? 1 : 0, Math.min(1.5, c.zoom), -c.why.length, c.score];
    const better = (a1, b1) => { const x1 = rank(a1), y1 = rank(b1); for (let i = 0; i < x1.length; i++) if (x1[i] !== y1[i]) return x1[i] > y1[i]; return false; };
    let best = null;
    // one text size: the first fitting layout (splits nearest the middle first), else the least-bad one
    const atPx = px => {
      let bestP = null;
      for (const split of splits) {
        // narrow pieces first (a narrower crop: a lens that fits), then wider ones; last, pieces on up to four lines
        for (const [tws, valueLines] of [[[4, 5, 6, 7], 3], [[4, 5, 6, 7, 8.5, 10, 12], 3], [[5, 6, 7, 8.5, 10, 12, 14, 17, 20, 24], 3], [[5, 6, 7, 8.5, 10], 4]]) {
          // the people's scale steps down from the largest that fits: a smaller scene makes a smaller crop
          let cap = 2.6;
          for (let step = 0; step < 8; step++) {
            const args = {upx, R, terms, px, split, captions, cache, k, cap, tws, valueLines, dry: true};
            const C = compose(ctx, p, args);
            if (!C) break;
            C.args = args;
            if (!bestP || better(C, bestP)) bestP = C;
            if (C.ok) return bestP;
            if (!C.G.ok || C.G.k <= 0.75) break;
            cap = C.G.k - 0.2;
          }
        }
      }
      return bestP;
    };
    // the largest text size that fits: a binary search over the sizes (a smaller text makes a smaller crop)
    let lo = 0, hi = pxSets.length - 1;
    const tried = new Map();
    const tryPx = i => { if (!tried.has(i)) tried.set(i, atPx(pxSets[i])); return tried.get(i); };
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      const C = tryPx(m);
      if (C && C.ok) hi = m; else lo = m + 1;
    }
    // (text first: the largest size that fits; else the least-bad layout found)
    const atLo = tryPx(lo);
    if (atLo && atLo.ok) best = atLo;
    else for (const C of tried.values()) if (C && (!best || better(C, best))) best = C;
    best = best ? compose(ctx, p, {...best.args, dry: false}) : null;
    return {...best, k, upx};
  },
  build(ctx, L) {
    return g({'data-stack': L.split.dir}, L.S.node, L.marker, L.lz.node, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    const v = {slide: 1, swap: true, remove: s('remove'), insert: s('insert'), turn: s('turn'), nearBack: s('nearBack'), headB: 7, headA: lerp(0, 5, s('insert'))};
    const posed = L.S.pose(v);
    const copy = L.C.pose(v);
    const nodes = {...posed.nodes};
    // ---- the lens copy mirrors the context exactly (same pose, copy node names)
    Object.assign(nodes, copy.nodes);
    // (no lens that magnifies fits this frame: the change is shown in the scene only, and the layout reports it)
    // (the lens grows fast at first and shrinks fast at the end: its copy is readable within ~30 ms of the rim
    // appearing, and until ~20 ms before it goes)
    const open = L.zoom < 1 ? 0 : ease.outCubic(s('open')) * (1 - ease.inCubic(s('close')));
    Object.assign(nodes, L.lz.frame(open, open));
    // the lens grows at its own place (never as a blank card over the scene): from 70 % of its size to full (so its copy is ≥ 1× the scene, and shown, within ~150 ms of the rim appearing)
    const S0 = L.src, D0 = L.dest;
    const q = 0.7 + 0.3 * open;
    const Rw = {x: D0.x + D0.w * (1 - q) / 2, y: D0.y + D0.h * (1 - q) / 2, w: D0.w * q, h: D0.h * q};
    const kx = Rw.w / S0.w, ky = Rw.h / S0.h;
    const rect = {x: r(Rw.x), y: r(Rw.y), width: r(Rw.w), height: r(Rw.h)};
    nodes['lens-cliprect'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(Rw.x + 8), y: r(Rw.y + 12), width: rect.width, height: rect.height};
    nodes['lens-content'] = {transform: `${T(Rw.x - S0.x * kx, Rw.y - S0.y * ky)} scale(${r(kx, 4)} ${r(ky, 4)})`};
    const cone = (a, b) => ({x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: open > 0.05 ? 1 : 0});
    const right = L.split.dir === 'right';
    nodes['lens-coneA'] = right ? cone({x: S0.x + S0.w, y: S0.y}, {x: Rw.x, y: Rw.y}) : cone({x: S0.x, y: S0.y + S0.h}, {x: Rw.x, y: Rw.y});
    nodes['lens-coneB'] = right ? cone({x: S0.x + S0.w, y: S0.y + S0.h}, {x: Rw.x, y: Rw.y + Rw.h}) : cone({x: S0.x + S0.w, y: S0.y + S0.h}, {x: Rw.x + Rw.w, y: Rw.y});
    nodes['lens-win'] = {opacity: open > 0.001 ? 1 : 0};
    // the enlarged copy fades in as the lens grows past 40 %, and out as it shrinks; the changed datum is shown in one
    // place at a time: its context copy (the reply piece's value, the held piece's value) fades out before the lens
    // copy fades in, and back only after it has gone
    // (its text never shows smaller than the context's: the copy appears once the lens is ≥ 1× the scene, which is
    // within ~200 ms of the lens appearing)
    // hand-over (sequenced both ways): the context copy is hidden by 5 % open (< 0.15 from 4.25 %); the lens copy starts
    // at 5 % open (reaches 0.15 at 6.2 %), so the two are never both legible (≥ 0.15) at once; on close the reverse
    nodes['lens-cfade'] = {opacity: r(Math.min(clamp((L.zoom * q - 1.02) / 0.12), clamp((open - 0.05) / 0.08)), 3)};
    const ctxDatum = 1 - clamp(open / 0.05);
    for (const n of L.datumNodes) nodes[n] = {opacity: r(Math.min(nodes[n] && nodes[n].opacity !== undefined ? nodes[n].opacity : 1, ctxDatum), 3)};
    // strike over each line of the old value (lens annotation); it leaves with the old value
    const strike = s('strike');
    const oldShown = s('remove') < 0.47;
    L.strikes.forEach((qq, j) => { nodes[`lens-strike${j}`] = {x2: r(lerp(qq.x0, qq.x1, strike)), opacity: strike > 0 && oldShown ? 1 : 0}; });
    if (L.markerNode) nodes['cx-marker'] = {opacity: r(s('marker'), 3)};
    const notesIn = s('notes');
    const panel = 1 - s('panelOut') + s('panelIn');
    L.notes.forEach(n => { nodes[n.name] = {opacity: r(n.hold ? notesIn : panel, 3)}; });
    const sem = posed.sem;
    const rem = s('remove'), ins = s('insert'), turn = s('turn');
    const datum = rem <= 0 ? 'before' : ins >= 1 && turn >= 1 ? 'after' : 'changing';
    const lensBox = open > 0.001 ? Rw : null;
    const P2 = qq => (qq ? {x: r(qq.x), y: r(qq.y)} : null);
    const inCrop = b => !b || (b.x >= S0.x - 0.5 && b.y >= S0.y - 0.5 && b.x + b.w <= S0.x + S0.w + 0.5 && b.y + b.h <= S0.y + S0.h + 0.5);
    const pieceBox = pp => (pp ? {x: pp.x - L.G.tw, y: pp.y - L.G.th / 2, w: L.G.tw, h: L.G.th} : null);
    const vertBox = pp => (pp ? {x: pp.x - L.G.th / 2 - 4, y: pp.y - 6, w: L.G.th + 8, h: L.G.tw + 12} : null);
    return {
      nodes,
      semantic: {
        lensOpen: r(open, 3),
        datum,
        contextValue: datum === 'after' ? ctx.params.afterValue : ctx.params.beforeValue,
        lensValue: open > 0.001 ? (datum === 'after' ? ctx.params.afterValue : ctx.params.beforeValue) : null,
        zoom: r(L.zoom, 3),
        strike: r(strike, 3),
        lensCopyAt: P2(L.rowAt), contextRowAt: P2(L.rowAt),
        source: {x: r(S0.x), y: r(S0.y), w: r(S0.w), h: r(S0.h)},
        lensBox: lensBox ? {x: r(Rw.x), y: r(Rw.y), w: r(Rw.w), h: r(Rw.h)} : null,
        lensClearOfPeople: !lensBox || !L.people.some(b => overlaps(lensBox, b, 0)),
        lensClearOfHeads: !lensBox || !L.heads.some(b => overlaps(lensBox, b, 0)),
        lensClearOfRows: !lensBox || !L.rowsCompared.some(b => overlaps(lensBox, b, 0)),
        // the crop keeps the offer's row, the reply's row and B's working space (the lifted copy and the held piece)
        cropHasRows: L.cropHasRows,
        cropHasWork: open <= 0.001 || (inCrop(sem.oldPiece && vertBox(sem.oldPiece)) && inCrop(sem.spare && (sem.spareIn ? pieceBox(sem.spare) : vertBox(sem.spare)))),
        lensShortFrac: r(L.lensShortFrac, 3),
        contextFrac: r(L.contextFrac, 3),
        restFill: r(L.restFill ?? 0, 3),
        restReach: r(L.restReach ?? 0, 3),
        stack: L.split.dir,
        coverFrac: r(L.coverFrac, 3),
        changedFieldWhole: L.fieldWhole,
        markerVisible: s('marker') >= 1,
        oldPiece: sem.oldPiece, oldGrip: sem.oldGrip, handB: sem.handB, handBn: sem.handBn, spare: sem.spare, spareIn: sem.spareIn, spareFaceUp: sem.spareFaceUp,
        allReached: sem.allReached,
        // (a frame with no magnifying lens is a failure, never a silent fallback)
        lensDrawn: L.zoom >= 1.5 - 1e-9,
        layoutOk: L.ok && L.zoom >= 1.5 - 1e-9,
        why: L.why.join(','),
        headPx: r(88 * L.G.k * L.upx, 1),
        k: r(L.G.k, 3),
        focusTarget: ctx.params.focusTarget,
        mirror: JSON.stringify(Object.keys(copy.nodes).length) === JSON.stringify(Object.keys(posed.nodes).length),
      },
    };
  },
};

/** Stage + lens + editorial layer for one attempt (split = where the context stays and where the lens opens). */
function compose(ctx, p, o) {
  const th = ctx.theme;
  const DW = ctx.design.w, DH = ctx.design.h;
  const {upx, R, px, k, split} = o;
  const F = Math.min(px.chip, px.min + 0.4) / upx;
  const right = split.dir === 'right';
  const stageBox = right ? {x: 8, y: 6, w: DW * split.frac - 16, h: DH - 12} : {x: 8, y: 6, w: DW - 16, h: DH * split.frac - 12};
  const region = right ? {x: DW * split.frac + 4, y: 6, w: DW * (1 - split.frac) - 12, h: DH - 12} : {x: 8, y: DH * split.frac + 2, w: DW - 16, h: DH * (1 - split.frac) - 8};
  const G = solveStage(ctx, {
    box: stageBox, upx, terms: o.terms, offer: p.offer, parties: p.parties, response: R, latch: false, replySwap: true, replyTag: ctx.params.locale === 'es' ? 'Respuesta' : 'Reply',
    captions: o.captions, chipPx: px.chip, chipMax: stageBox.w * 0.5, chipLines: 4, pullBack: false,
    variants: [true, false], pxTries: [px], ks: range(o.cap ?? 2.6, 0.5, 0.05),
    tws: o.tws, valueLines: o.valueLines, lws: [0, 4, 5, 6.5, 8, 10], hws: [6, 7.5, 9, 11],
    align: 'spread', cache: o.cache, steps: [0, 0.14, 0.28, 0.42, 0.56], extraValues: [p.beforeValue, p.afterValue],
    // offer and reply side by side, rows aligned (B beside the reply): the offer's row, the reply's row and B's hands
    // lie in one band, which the lens crops
    sides: split.stackFirst ? [null, 'reply-right'] : ['reply-right', null], sideCompact: true,
    plateText: `${p.offer.title} · ${ctx.t.from}: ${p.parties[0].name} · ${ctx.t.to}: ${p.parties[1].name}`,
  });
  if (!G) return null;
  const why = [...G.why];
  const {tw, th: hh} = G;
  const rowY = G.Ry + G.rowYR(k);
  const rdx = G.rdx || 0;
  // ---- crop: the offer's piece k (with its label), the reply's piece k with its spine latch, and B's working space
  // (the piece B holds at the side and the copy B lifts out, both hanging at B's side while the lens is open)
  const gripO = G.xSp - SHEET.spW / 2, gripR = G.xSp + rdx - SHEET.spW / 2;
  // (side by side the rows are aligned; stacked, the offer's row k lies above the reply)
  const oY = G.Oy + G.rowY(k);
  const offerRow = G.M.labelsAbove ? {x: gripO - tw, y: oY - hh / 2 - G.labGap, w: tw, h: hh + G.labGap} : {x: gripO - tw, y: oY - hh / 2, w: tw, h: hh};   // (a label column: the offer's piece; its label stays out)
  const replyRow = {x: gripR - tw, y: rowY - hh / 2, w: tw + SHEET.spW + 20, h: hh};
  const holdFar = {x: G.B.x - 34 * G.k, y: G.B.floor - 236 * G.k};
  const oldBox = {x: holdFar.x - hh / 2 - 4, y: holdFar.y - 6, w: hh + 8, h: tw + 12};
  // the paths of the two pieces (the kit's swap poses): the held piece swings from B's side into the slot, turning
  // level; the lifted copy leaves the slot for B's side, turning upright — every sampled pose stays in the crop
  const rs = {x: gripR - 2, y: rowY}, pre = {x: rs.x + 34, y: rs.y};
  const pieceBoxAt = (gx, gy, rot) => {
    const a0 = rot * Math.PI / 180, c = Math.cos(a0), sn = Math.sin(a0);
    const pts = [[-tw, -hh / 2], [0, -hh / 2], [-tw, hh / 2], [0, hh / 2]].map(([px0, py0]) => ({x: gx + px0 * c - py0 * sn, y: gy + px0 * sn + py0 * c}));
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    return {x: Math.min(...xs) - 4, y: Math.min(...ys) - 4, w: Math.max(...xs) - Math.min(...xs) + 8, h: Math.max(...ys) - Math.min(...ys) + 8};
  };
  const pathBoxes = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const qn = ease.inOutCubic(Math.min(1, t / 0.8));
    const hn = t < 0.8 ? {x: lerp(G.pts.hold.x, pre.x, qn), y: lerp(G.pts.hold.y, pre.y, qn) - Math.sin(Math.PI * qn) * 30 * G.k} : {x: lerp(pre.x, rs.x, (t - 0.8) / 0.2), y: rs.y};
    pathBoxes.push(pieceBoxAt(hn.x + 2, hn.y, -90 * (1 - ease.inOutCubic(Math.min(1, t / 0.7)))));
    const hf = {x: lerp(rs.x + 4, holdFar.x, t), y: lerp(rs.y - 6, holdFar.y, t)};
    pathBoxes.push(pieceBoxAt(hf.x - 4, hf.y + 6, -90 * ease.inOutCubic(t)));
  }
  const work = [G.spareBox, oldBox, ...pathBoxes].filter(Boolean);
  const crop0 = unionBox([offerRow, replyRow, ...work]);
  const pad = 14;
  let src = {x: crop0.x - pad, y: crop0.y - pad, w: crop0.w + 2 * pad, h: crop0.h + 2 * pad};
  // ---- lens: as large as the free part allows (≥ 1.5×, short side ≥ 35 % of the frame's short side), near the source;
  // a crop too flat for that short side takes in more of the working space around the row (fields the rim would cut
  // are left out of the copy)
  const need = 0.35 * 1080 / upx + 2;
  const zFit = q => Math.min((region.w - 8) / q.w, (region.h - 8) / q.h, 3.2);
  let zoom = Math.max(1.5, Math.min(zFit(src), Math.max(p.detailGeometry.zoom, 2)));
  for (let it = 0; it < 4; it++) {
    const shortIsH = src.h * zoom <= src.w * zoom;
    const cur = Math.min(src.w, src.h) * zoom;
    if (cur >= need) break;
    if (shortIsH) { const h2 = need / zoom; src = {...src, y: src.y - (h2 - src.h) / 2, h: h2}; } else { const w2 = need / zoom; src = {...src, x: src.x - (w2 - src.w) / 2, w: w2}; }
    zoom = Math.max(1.5, Math.min(zFit(src), zoom));
  }
  const zMax = zFit(src);
  // (no layout reaches 1.5×: the lens stays inside its part of the frame, smaller, and the layout reports it)
  if (zoom > zMax + 1e-6) { why.push('lens'); zoom = Math.max(0.5, zMax); }
  const dw = src.w * zoom, dh = src.h * zoom;
  const dest = right
    ? {x: region.x + (region.w - dw) / 2, y: clamp(src.y + src.h / 2 - dh / 2, region.y, region.y + region.h - dh), w: dw, h: dh}
    : {x: clamp(src.x + src.w / 2 - dw / 2, region.x, region.x + region.w - dw), y: region.y + Math.max(0, Math.min(40, (region.h - dh) / 2)), w: dw, h: dh};
  const lensShortFrac = Math.min(dw, dh) * upx / 1080;
  if (lensShortFrac < 0.35 - 1e-6) why.push('lensSmall');
  const people = peopleBoxes(G);
  const heads = [G.headA, G.headB];
  if (heads.some(b => overlaps(dest, b, 4))) why.push('lensHead');
  // ---- context and lens shares of the frame (rendered: design lengths × the fit scale over the frame)
  const f = fitDesign(ctx.view, DW, DH);
  const ext = G.extent;
  const contextFrac = right ? ext.w * f.scale / ctx.view.width : ext.w * f.scale / ctx.view.width;
  const coverFrac = right ? (ext.w + dw) * f.scale / (ctx.view.content.w) : (ext.h + dh) * f.scale / (ctx.view.content.h);
  if (contextFrac < 0.45) why.push('context');
  if (coverFrac < 0.8) why.push('cover');
  // ---- the panel in the lens's part of the frame (LAW-0696 / LAW-0212 pattern): at rest and at the hold it carries
  // the context caption, a legend of the three kinds of piece and the key; at the hold the changed-datum label and the
  // struck old value join it. It leaves before the lens opens there and returns after the lens has closed.
  const items = [];
  if (ctx.show('all')) items.push({kind: 'context', text: p.contextLabels.context});
  if (ctx.show('all')) items.push({kind: 'mlabel', text: p.contextLabels.marker, hold: true});
  if (ctx.show('all')) items.push({kind: 'was', text: `${ctx.t.was}: ${p.beforeValue}`, hold: true});
  if (ctx.show('all')) items.push({kind: 'leg0', text: ctx.t.legPrinted, glyph: 'printed'}, {kind: 'leg1', text: ctx.t.legCopy, glyph: 'copy'}, {kind: 'leg2', text: ctx.t.legHeld, glyph: 'spare'});
  // (labels hidden: the legend is drawn with its three piece glyphs only, large — the panel still fills its part)
  else items.push({kind: 'leg0', glyph: 'printed'}, {kind: 'leg1', glyph: 'copy'}, {kind: 'leg2', glyph: 'spare'});
  if (ctx.show('key')) items.push({kind: 'key', text: ctx.t.key});
  const colW = Math.min(region.w - 16, 820);
  // the panel's text: as large as fits its part (up to 1.5× the scene's), never smaller than the scene's
  let PF = F;
  const F0 = F;
  const chipOf = (it, x, y) => {
    // (supplied texts — the context caption, the marker label, the old value — may be larger; the generic legend and key
    // stay at the scene's size, never larger than supplied text)
    const F = it.kind === 'context' || it.kind === 'mlabel' || it.kind === 'was' ? PF : F0, gw = Math.max(2.4 * F, TILE.tabW + TILE.padL + TILE.gripM + 24), gh = 1.3 * F;
    if (it.kind === 'mlabel') return legendChip(ctx, it.text, {x, y, maxWidth: colW, size: F, name: 'mlabel', maxLines: 4});
    if (it.glyph && !it.text) {
      const bw = Math.min(colW, Math.max(6 * PF, region.w * 0.5), region.h * 0.9), bh = Math.min(bw * 0.36, region.h * 0.24);
      const art = pieceArt(ctx, {tw: bw, th: bh, kind: it.glyph, tab: tabColor(ctx, k), value: null, bars: 0.6});
      return {node: g({name: it.kind, opacity: 0}, g({transform: T(x + bw, y + bh / 2)}, art.front)), box: {x, y, w: bw, h: bh}, fit: null, bad: false};
    }
    if (it.glyph) {
      const c0 = chipW(ctx, it.text, {x: 0, y: 0, maxWidth: colW - gw - 12, size: F, maxLines: 4, weight: 600, stroke: th.inkSoft});
      const hgt = Math.max(c0.box.h, gh);
      const c = chipW(ctx, it.text, {x: x + gw + 12, y: y + (hgt - c0.box.h) / 2, maxWidth: colW - gw - 12, size: F, maxLines: 4, weight: 600, stroke: th.inkSoft});
      const art = pieceArt(ctx, {tw: gw, th: gh, kind: it.glyph, tab: tabColor(ctx, k), value: null, bars: 0.6});
      const node = g({name: it.kind, opacity: 0}, g({transform: T(x + gw, y + hgt / 2)}, art.front), c.node);
      c.node.attrs.opacity = undefined;
      return {node, box: {x, y, w: gw + 12 + c.box.w, h: hgt}, fit: c.fit, bad: c.fit.bad};
    }
    return chipW(ctx, it.text, {x, y, maxWidth: colW, size: F, maxLines: 4, weight: it.kind === 'context' ? 700 : 600, stroke: it.kind === 'context' ? th.ink : th.inkSoft, name: it.kind, opacity: 0});
  };
  let probe = [], sumH = 0;
  for (const m of [1.5, 1.4, 1.3, 1.2, 1.1, 1]) {
    PF = F * m;
    probe = items.map(it => ({it, c: chipOf(it, 0, 0)}));
    sumH = probe.reduce((a, q) => a + q.c.box.h, 0);
    if (!probe.some(q => q.c.bad) && sumH + 16 * Math.max(0, probe.length - 1) <= region.h * (right ? 0.9 : 0.96)) break;
  }
  // spread over the part (gaps 10–48): the panel fills it, and at rest its last item (the key) sits at the far end
  const gap = probe.length > 1 ? clamp((region.h * (right ? 0.92 : 1) - 4 - sumH) / (probe.length - 1), 10, right ? 56 : 110) : 0;
  const colH = sumH + gap * Math.max(0, probe.length - 1);
  let yy = region.y + Math.max(0, (region.h - colH) / 2);
  const notes = [];
  for (const q of probe) {
    const cx = region.x + (region.w - q.c.box.w) / 2;
    const c = chipOf(q.it, cx, yy);
    let node = c.node;
    if (q.it.kind === 'was') {
      // strike the old value inside the "was:" chip (every line after the prefix)
      const ff = c.fit;
      const skip = ctx.measure(`${ctx.t.was}: `, ff.size, ff.weight, 'sans');
      const lines = ff.lines.map((ln, j) => {
        const lw = ctx.measure(ln, ff.size, ff.weight, 'sans');
        const x0 = c.box.cx - lw / 2 + (j === 0 ? skip : 0);
        const yl = c.box.y + (c.box.h - ff.height) / 2 + j * ff.lineHeight + ff.size * 0.52;
        return h('line', {x1: r(x0), x2: r(c.box.cx + lw / 2), y1: r(yl), y2: r(yl), stroke: th.inkSoft, 'stroke-width': 2.4});
      });
      node = g({name: 'was', opacity: 0}, g(null, c.node.children), lines);
    }
    notes.push({kind: q.it.kind, name: q.it.kind, hold: Boolean(q.it.hold), node, box: c.box, bad: Boolean(c.bad || (c.fit && c.fit.bad))});
    yy += c.box.h + gap;
  }
  const bounds = {x: 4, y: 2, w: DW - 8, h: DH - 4};
  if (notes.some(n => n.bad) || !notes.every(n => insideBox(n.box, bounds) && insideBox(n.box, region, 2))) why.push('notes');
  // the scene at rest and at the hold (context + panel) spans ≥ 0.71 of the frame in the stacking direction
  const restItems = notes.filter(n => !n.hold).map(n => n.box);
  const restBox = unionBox([ext, ...restItems]);
  // (reach as in LAW-0696: the far edge of the scene from the frame's near edge; extent: the scene's own span)
  const restFill = right ? restBox.w * f.scale / ctx.view.width : restBox.h * f.scale / ctx.view.height;
  const restReach = right ? (f.ox + (restBox.x + restBox.w) * f.scale) / ctx.view.width : (f.oy + (restBox.y + restBox.h) * f.scale) / ctx.view.height;
  if (restReach < 0.72 || restFill < 0.66) why.push('restFill');
  if (o.dry) {
    const bounds0 = {x: 4, y: 2, w: DW - 8, h: DH - 4};
    return {G, src, dest, zoom, why, ok: why.length === 0, score: G.k * 1000 + zoom, lensShortFrac, contextFrac, coverFrac, restFill, restReach, bounds0};
  }
  // ---- stages: context + lens copy (identical pose every frame)
  const S = buildStage(ctx, G, {prefix: 'st', swapRow: k});
  const C = buildStage(ctx, G, {prefix: 'lzs', swapRow: k, looks: S.looks});
  // the lens copy leaves out every field the rim would cut: the other rows' labels and pieces, the sheets' headers,
  // the plate and the name chips (only the inspected row and B's working space are its subject)
  const hide = new Set();
  G.terms.forEach((t, i) => { if (i !== k) { hide.add(`lzs-pr${i}-front`); hide.add(`lzs-ol${i}`); hide.add(`lzs-c${i}`); } });
  const hidePrefix = ['lzs-oh-', 'lzs-rh-', 'lzs-plate', 'lzs-chip'];
  const markHidden = n => {
    if (Array.isArray(n)) { n.forEach(markHidden); return; }
    if (!n || typeof n !== 'object') return;
    const nm = n.attrs && n.attrs.name;
    if (nm && (hide.has(nm) || hidePrefix.some(pf => nm.startsWith(pf)))) { n.attrs.opacity = 0; n.attrs['data-lens-hidden'] = 1; }
    (n.children || []).forEach(markHidden);
  };
  markHidden(C.node);
  // strike lines over the old value (in the lens copy's coordinates = context coordinates)
  const strikes = [];
  const vf = G.M.values[k];
  if (vf && ctx.show('all')) {
    const tx = gripR - tw + TILE.tabW + TILE.padL;
    const y0 = rowY - vf.height / 2;
    vf.lines.forEach((ln, j) => {
      const lw = ctx.measure(ln, vf.size, vf.weight, 'sans');
      strikes.push({x0: tx - 3, x1: tx + lw + 3, y: y0 + j * vf.lineHeight + vf.size * 0.52});
    });
  }
  const strikeNodes = g(null, strikes.map((q, j) => h('line', {name: `lens-strike${j}`, x1: r(q.x0), x2: r(q.x0), y1: r(q.y), y2: r(q.y), stroke: th.inkSoft, 'stroke-width': Math.max(3, vf ? vf.size * 0.12 : 3), 'stroke-linecap': 'round', opacity: 0})));
  const frameBox = unionBox([G.board, ...people]);
  const lz = lens(ctx, {name: 'lens', source: src, dest, content: g({name: 'lens-cfade', opacity: 0}, C.node, strikeNodes), frame: {x: frameBox.x - 12, y: frameBox.y - 12, w: frameBox.w + 24, h: frameBox.h + 24}, color: th.accent2});
  const markOcclude = n => { if (n && n.attrs && n.attrs.name === 'lens-win') n.attrs['data-occludes'] = 1; (n.children || []).forEach(c => typeof c === 'object' && markOcclude(c)); };
  markOcclude(lz.node);
  // the context copy of the changed datum (shown in one place at a time)
  // (the reply piece's value, the piece B holds and the offer's own piece of that row, which prints the same value:
  // while the lens holds them, their context copies are hidden — blank cards in place — never merely dimmed)
  const datumNodes = ctx.show('all') ? [`st-cp${k}-val`, ...(G.M.values[k] ? [`st-pr${k}-val`] : []), ...(G.M.spare ? ['st-sp-val'] : [])] : [];
  // fields wholly inside the lens: the changed row's value in the reply and in the offer
  const fieldWhole = [offerRow, replyRow].every(b => b.x >= src.x && b.y >= src.y && b.x + b.w <= src.x + src.w && b.y + b.h <= src.y + src.h);
  if (!fieldWhole) why.push('field');
  const cropHasRows = fieldWhole;
  // ---- Δ marker on the new piece (top-left corner, over its tab)
  const mR = Math.max(14, F * 0.62);
  const markerNode = changedMarker(ctx, {name: 'cx-marker', x: gripR - tw + 3, y: rowY - hh / 2 + 3, radius: mR, opacity: 0});
  const rowsCompared = [offerRow, replyRow];
  const score = G.k * 1000 + zoom;
  return {G, S, C, lz, src, dest, zoom, strikes, markerNode, marker: markerNode, notes, people, heads: heads.map(hb => ({...hb})), rowsCompared, fieldWhole, cropHasRows,
    rowAt: {x: G.xSp + rdx, y: rowY}, datumNodes, lensShortFrac, contextFrac, coverFrac, restFill, restReach, split, score, ok: why.length === 0, why};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-02-inspect',
    title: 'Acceptance and counter-offer — inspecting one reply piece and substituting its value',
    titleEs: 'Aceptación y contrapropuesta — Inspección y cambio de un dato',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Aceptación y contrapropuesta',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The term board after the copy set has reached the reply. A lens enlarges one reply piece (a real copy of the scene, ≥ 1.5×); its value is struck, then in the scene Party B lifts that copy out (turned face-down) and seats a different piece, turned face-up in the slot with the supplied alternative value. The lens closes onto the identical row; a Δ marks the new piece and the struck old value stays readable. Nothing is concluded.',
    tags: ['offer', 'reply', 'lens', 'substitution', 'changed marker', 'pieces', 'terms'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/aceptacion-contrapropuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
