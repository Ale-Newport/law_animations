/**
 * LAW-0195 — Consulta de expediente por auxiliar · contrast
 *
 * Storyboard (two complete, equally scaled scenes — side by side on wide frames,
 * stacked on tall ones; each: the same assistant standing behind the same desk
 * with the same roll-top step cabinet of five numbered pieces; one shared strip
 * names the request, who asked, the shared facts and the key):
 *  0.00–0.17  base: both roll-tops are closed; the two scenes are identical
 *             (nothing inside is visible yet).
 *  0.17–0.40  change: in both scenes the assistant pushes the roll-top up with
 *             the same gesture, which uncovers the supplied difference — in A
 *             the requested piece sits in its own numbered slot; in B (as
 *             supplied) its slot is an empty dashed gap and the piece stands in
 *             another slot, in front of that slot's own piece. The scenario
 *             labels appear and a neutral outline marks where the requested
 *             piece sits in each scene.
 *  0.40–0.77  parallel: the same action in both, adapted only to the changed
 *             circumstance — the open hand runs down the tabs (A stops at its
 *             slot; B passes the empty gap and goes on to the other slot, in
 *             the same time), pinches the tab, lifts the piece out, hands it
 *             to the other hand, lays it on the desk, reads it, stands it up,
 *             hands it back and slides it into its OWN numbered slot. Held
 *             pieces follow the solved hands.
 *  0.77–1.00  guide: a line joins the two outlines (where the piece was
 *             found) through free space, with the guide label and the changed
 *             fact; a neutral note. No winner, score, error glyph or
 *             consequence of where the piece sat is shown or implied.
 * @module animations/roles/LAW-0195
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, list, obj, oneOf, party, RELATION_KINDS} from '../../schemas/fields.js';
import {connector} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  pieceField, FILE_DEFAULTS, FILE_STRINGS, glueNums, captionOf, resolvePieces, measurePieces, fileGeometry, fileStage,
  consultScript, keyLayout, fitWords, wchip, overlaps, pieceBox, textBlockAt, foreignSlotHits, sideTurn,
} from './kits/consulta-de-expediente.js';

const ID = 'LAW-0195';
const DURATION = 7500;
const CHANGE = 0.17;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  toHandle: [0.17, 0.2], roll: [0.2, 0.28], fromHandle: [0.28, 0.33],
  toTabs: [0.4, 0.43], run: [0.43, 0.49], pinch: [0.49, 0.5], lift: [0.5, 0.51], carry: [0.51, 0.56],
  toEdge: [0.54, 0.56], swap: [0.56, 0.567], lay: [0.567, 0.597],
  toCover: [0.597, 0.597], open: [0.597, 0.597], read: [0.6, 0.64], toCover2: [0.64, 0.64], close: [0.64, 0.64], toEdge2: [0.64, 0.64],
  lift2: [0.645, 0.675], toTab2: [0.655, 0.675], swap2: [0.675, 0.682], carryBack: [0.682, 0.73], insert: [0.73, 0.742], release: [0.742, 0.768],
};
const HEADER = [0.2, 0.26];
const RING = [0.3, 0.36];
const GUIDE = [0.78, 0.84];
const NOTE = [0.8, 0.86];
const PEOPLE = ['requester', 'assistant'];

const STRINGS = {
  en: {...FILE_STRINGS.en, sameInBoth: 'Same in both', request: 'Request'},
  es: {...FILE_STRINGS.es, sameInBoth: 'Igual en ambos', request: 'Petición'},
};

const scenario = letter => obj(`Scenario ${letter}`, {
  label: str(`Short label for scenario ${letter}`, 50),
  caption: str('One-line description', 90),
  foundAt: int(`Number of the slot where the requested piece sits in scenario ${letter} when it is looked up (as supplied)`, 1, 9),
}, ['label', 'foundAt']);

const sceneSchema = {
  actors: list('The assistant (in both scenes) and the person who asked for the piece (named in the shared strip) — fictional people', party, 2, 2),
  roles: obj('Descriptive role captions (not a legal finding)', {
    assistant: str('Role caption for the person who consults the file', 40),
    requester: str('Role caption for the person who asked for the piece', 40),
  }),
  relationships: list('Supplied link between the requester and the assistant, drawn in the shared strip (empty = none)', obj('Link', {
    from: oneOf('Source person', PEOPLE), to: oneOf('Target person', PEOPLE),
    kind: oneOf('relation | communication | sequence | causal (causal only when supplied)', RELATION_KINDS),
    label: str('Caption of the link', 40),
  }, ['from', 'to', 'kind', 'label']), 0, 1),
  props: obj('Case-file content, identical in both scenes', {
    pieces: list('Numbered pieces in slot order: slot k (from the front) is numbered like the k-th piece', pieceField, 3, 5),
    target: int('Number of the requested piece', 1, 9),
    request: str('What was asked for (shown in the shared strip)', 80),
    fileLabel: str('Label on the case-file cabinet (fictional identifier)', 50),
  }),
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  actors: FILE_DEFAULTS.actors,
  roles: FILE_DEFAULTS.roles,
  relationships: [{from: 'requester', to: 'assistant', kind: 'communication', label: 'asks to consult'}],
  props: {pieces: FILE_DEFAULTS.props.pieces, target: 3, request: FILE_DEFAULTS.props.request, fileLabel: FILE_DEFAULTS.props.fileLabel},
  scenarioA: {label: 'Piece located', caption: 'Piece 3 sits in its own slot 3', foundAt: 3},
  scenarioB: {label: 'Piece misfiled', caption: 'As supplied, piece 3 sits in slot 5', foundAt: 5},
  changedFact: 'Where piece 3 sits when it is looked up',
  sharedFacts: ['Same request, assistant and five pieces', 'Both end with piece 3 in slot 3'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'Neither scene is ranked; no consequence of the position is drawn'},
};

function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}
const shift = (b, dx, dy) => ({...b, x: b.x + dx, y: b.y + dy});
const union = bs => {
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y));
  return {x: x0, y: y0, w: Math.max(...bs.map(b => b.x + b.w)) - x0, h: Math.max(...bs.map(b => b.y + b.h)) - y0};
};

/** Smallest card width whose titles fit in L lines at F. */
function widthFor(ctx, pieces, F, L) {
  let lo = 4 * F, hi = 40 * F;
  const ok = W0 => measurePieces(ctx, {pieces, F, W: W0, showText: true, maxLines: L}).ok;
  if (!ok(hi)) return null;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }
  return Math.ceil(hi + 2);
}

/** Slot index holding the given number (falls back to the target index). */
const slotIndex = (pieces, n, fallback) => { const i = pieces.findIndex(q => q.number === n); return i < 0 ? fallback : i; };

/**
 * Shared strip (measured at width w): the request with its link between the two people, the shared facts, the
 * neutral note and the key, flowing into rows. Returns rows of items with local boxes.
 */
/** k-column strip (wide strips): the same items sized for 1/k of the width, kept in reading order, split where
 * the tallest column is shortest. */
function stripLayoutK(ctx, p, F, w, withPieces, k, headRow = true) {
  const gapX = 1.6 * F, gapY = 0.4 * F;
  const cw = (w - gapX * (k - 1)) / k;
  const one = stripLayout(ctx, p, F, cw, withPieces);
  // the request (both chips and the link, side by side) and the quote run across the top of the strip
  const wide = stripLayout(ctx, p, F, w, withPieces);
  const wItems = wide.rows.flatMap(rw => rw.items);
  const req = wItems.find(it => it.kind === 'request'), quote = wItems.find(it => it.kind === 'quote');
  let head = [];
  if (headRow && req && !req.vertical) {
    head = [req];
    if (quote && req.w + gapX + quote.w <= w + 0.5) head.push(quote);
  }
  const headH = head.length ? Math.max(...head.map(it => it.h)) : 0;
  let hx = 0;
  for (const it of head) { it.dx = hx; it.y = (headH - it.h) / 2; hx += it.w + gapX; }
  const skip = new Set(head.map(it => it.kind));
  const items = one.rows.flatMap(rw => rw.items).filter(it => !skip.has(it.kind));
  const y0 = headH ? headH + gapY : 0;
  const colH = arr => arr.reduce((acc, it) => acc + it.h, 0) + gapY * Math.max(0, arr.length - 1);
  // all ways to cut the item list into k consecutive (possibly empty) columns
  let bestCuts = null, bestH = Infinity;
  const rec = (start, left, cuts) => {
    if (left === 1) {
      const all = [...cuts, items.length];
      let prev = 0, hh = 0;
      for (const c of all) { hh = Math.max(hh, colH(items.slice(prev, c))); prev = c; }
      if (hh < bestH) { bestH = hh; bestCuts = all; }
      return;
    }
    for (let c = start; c <= items.length; c++) rec(c, left - 1, [...cuts, c]);
  };
  rec(0, k, []);
  let prev = 0, wUsed = Math.max(0, hx - gapX);
  bestCuts.forEach((c, ci) => {
    let y = y0;
    for (const it of items.slice(prev, c)) { it.dx = ci * (cw + gapX); it.y = y; y += it.h + gapY; wUsed = Math.max(wUsed, it.dx + it.w); }
    prev = c;
  });
  const all = [...head, ...items];
  const hh = y0 + bestH;
  return {...one, ok: one.ok && wide.ok, rows: [{items: all, w: wUsed, h: hh}], h: hh, w: wUsed, cols: k};
}

function stripLayout(ctx, p, F, w, withPieces = true) {
  const items = [];
  const narrow = w < 22 * F;
  const chipO = mw => ({x: 0, y: 0, anchor: 'start', maxWidth: mw, size: F, minSize: F, maxLines: narrow ? 4 : 3});
  const capA = captionOf(p, 'assistant'), capV = captionOf(p, 'requester');
  const link = (p.relationships || [])[0];
  const quote = `${ctx.t.qOpen}${p.props.request}${ctx.t.qClose}`;
  // request group: requester chip —link— assistant chip, then the quote
  // side-by-side chips at under half the width; a chip that cannot fit there takes the full width (the pair then
  // stacks vertically, see below)
  const chipAt = t => { const c = wchip(ctx, t, chipO(narrow ? w : Math.min(w * 0.45, 22 * F))); return c.fit.truncated && !narrow ? wchip(ctx, t, chipO(w)) : c; };
  const cV = chipAt(capV);
  const cA = chipAt(capA);
  let cap = null, linkLen = 0;
  if (link && link.from !== link.to) {
    cap = wchip(ctx, link.label || ctx.t[link.kind] || link.kind, chipO(narrow ? w - 2.2 * F : Math.min(w * 0.4, 16 * F)));
    linkLen = Math.max(cap.box.w + 0.8 * F, 5 * F);
  }
  const first = link && link.from === 'assistant' ? {c: cA, t: capA, id: 'assistant'} : {c: cV, t: capV, id: 'requester'};
  const second = first.id === 'assistant' ? {c: cV, t: capV, id: 'requester'} : {c: cA, t: capA, id: 'assistant'};
  const chipH = Math.max(cV.box.h, cA.box.h);
  let reqW = first.c.box.w + (link ? linkLen : 0.8 * F) + second.c.box.w;
  let reqH = chipH + (cap ? cap.box.h + 0.35 * F : 0);
  // narrow strips: the two chips one above the other, the link running down between them, its caption beside it
  const vertical = reqW > w + 0.5;
  let linkV = 0;
  if (vertical) {
    linkV = cap ? Math.max(cap.box.h + 1.2 * F, 3.4 * F) : 0.8 * F;
    reqW = Math.max(first.c.box.w, second.c.box.w, cap ? 2.2 * F + cap.box.w : 0);
    reqH = first.c.box.h + linkV + second.c.box.h;
  }
  items.push({kind: 'request', w: reqW, h: reqH, first, second, cap, linkLen, chipH, link, vertical, linkV});
  const q = fitWords(glueNums(quote), {maxWidth: Math.min(w, 26 * F), size: F, minSize: F, maxLines: narrow ? 6 : 4, weight: 600});
  items.push({kind: 'quote', w: q.width, h: q.height, f: q});
  const list = !withPieces ? null : fitWords(glueNums(`${p.props.fileLabel}: ${p.props.pieces.map(q => `${q.number} ${q.title}`).join(' · ')}`), {maxWidth: Math.min(w - 1.6 * F, 40 * F), size: F, minSize: F, maxLines: narrow ? 12 : 6, weight: 600});
  if (list) items.push({kind: 'pieces', w: list.width + 1.6 * F, h: list.height, f: list});
  if ((p.sharedFacts || []).length) {
    const sf = fitWords(`${ctx.t.sameInBoth}: ${p.sharedFacts.join(' · ')}`, {maxWidth: Math.min(w, 34 * F), size: F, minSize: F, maxLines: narrow ? 10 : 5, weight: 500});
    items.push({kind: 'shared', w: sf.width, h: sf.height, f: sf});
  }
  const note = wchip(ctx, p.comparisonLabels.neutral, {...chipO(Math.min(w, 30 * F)), maxLines: narrow ? 8 : 4});
  items.push({kind: 'note', w: note.box.w, h: note.box.h, text: p.comparisonLabels.neutral, c: note});
  const key = keyLayout(ctx, {w: Math.min(w, 34 * F), size: F});
  items.push({kind: 'key', w: key.w, h: key.h, key});
  const gapX = 1.4 * F, gapY = 0.4 * F;
  const rows = [];
  let cur = null;
  for (const it of items) {
    if (!cur || cur.w + gapX + it.w > w + 0.5) { cur = {items: [], w: -gapX, h: 0}; rows.push(cur); }
    it.dx = cur.w + gapX;
    cur.items.push(it);
    cur.w += gapX + it.w;
    cur.h = Math.max(cur.h, it.h);
  }
  const hgt = rows.reduce((a, rw) => a + rw.h, 0) + gapY * (rows.length - 1);
  const ok = !(list && list.truncated) && !q.truncated && !note.fit.truncated && key.ok && !cV.fit.truncated && !cA.fit.truncated && !(cap && cap.fit.truncated) && items.every(it => it.w <= w + 0.5);
  return {rows, h: hgt, w: Math.max(...rows.map(rw => rw.w)), gapY, ok, capA, capV};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1100, 1000], portrait: [1000, 1500]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const {pieces, target} = resolvePieces(p.props);
    const n = pieces.length;
    // side by side (landscape, square) with the shared strip below; stacked (portrait) at full width, strip below
    const modes = ctx.view.shape === 'portrait' ? ['stack'] : D.w / D.h > 1.6 ? ['bottom', 'mid:0.455', 'mid:0.44', 'mid:0.425', 'mid:0.405'] : ['bottom', 'stack'];
    let column = false;
    const m = 10;
    const foundA = slotIndex(pieces, p.scenarioA.foundAt, target), foundB = slotIndex(pieces, p.scenarioB.foundAt, target);
    let best = null;
    const F0 = 22.5 / px, Fmin = 16.05 / px;
    const guideText = `${p.comparisonLabels.guide}: ${p.changedFact}`;
    // the largest text at which a scene reaches its share (≥ 40 % of the width side by side, ≥ 60 % stacked); else
    // the layout whose scenes are largest
    let fallback = null, bestShare = null;
    for (let F = F0; F >= Fmin - 1e-6 && !(best && best.fits); F = F - 0.5 / px < Fmin && F > Fmin + 1e-6 ? Fmin : F - 0.5 / px) {
      let fitAtF = null;
      for (const modeK of modes) {
      const mode = modeK.split(':')[0], midFrac = +(modeK.split(':')[1] || 0.405);
      const lane = 1.5 * F; // guide lane beside each cabinet
      const inner = D.w - 2 * m;
      // arrangement: panel boxes (header + stage), strip box, guide band
      let panelW, colW, stripW;
      if (mode === 'mid') { panelW = midFrac * D.w; colW = inner - 2 * panelW - 2.4 * F; stripW = colW; }
      else if (mode === 'bottom') { panelW = (inner - 1.6 * F) / 2; colW = 0; stripW = inner; }
      else { panelW = inner; colW = 0; stripW = inner; }
      const stageW = panelW;
      const hdrH = headerHeight(ctx, p, F, stageW - lane);
      const guideMax = mode === 'stack' ? Math.min(stageW - lane - 1.2 * F, 30 * F) : mode === 'bottom' ? inner * 0.8 : Math.min(inner * 0.42, 30 * F);
      const guide = wchip(ctx, guideText, {x: 0, y: 0, anchor: 'middle', maxWidth: guideMax, size: F, minSize: F, maxLines: 3, weight: 700});
      const guideBand = guide.box.h + (mode === 'mid' ? 2.0 * F : mode === 'bottom' ? 1.0 * F : 1.1 * F);
      // titled: each cabinet shows its pieces' titles (and the file label); untitled: they are listed once in the strip
      const variants = [];
      for (let L = 1; L <= 3; L++) {
        const W0 = widthFor(ctx, pieces, F, L);
        if (W0 && W0 <= stageW * 0.6) {
          const M = measurePieces(ctx, {pieces, F, W: W0, showText: true, maxLines: 3});
          const fileFit = fitWords(glueNums(p.props.fileLabel), {maxWidth: (M.W + 3.2 * F) * 0.8, size: F, minSize: F, maxLines: 2, weight: 700});
          if (!fileFit.truncated) variants.push({titled: true, M, fileFit});
        }
      }
      variants.push({titled: false, M: measurePieces(ctx, {pieces, F, W: 7.5 * F, showText: false, maxLines: 1}), fileFit: null});
      for (const vr of variants) {
      const {M, fileFit, titled} = vr;
      let strip = stripLayout(ctx, p, F, stripW, !titled);
      if (mode !== 'mid') for (let k = 2; k <= 4; k++) for (const hr of [true, false]) { const sk = stripLayoutK(ctx, p, F, stripW, !titled, k, hr); if (sk.ok && (!strip.ok || sk.h < strip.h - 0.5)) strip = sk; }
      let stageH;
      // bottom mode: the guide runs below the stages, its chip in a band between the stages and the strip
      if (mode === 'mid') stageH = D.h - 2 * m - hdrH - guideBand;
      else if (mode === 'bottom') stageH = D.h - 2 * m - hdrH - guideBand - strip.h - 0.25 * F;
      else stageH = (D.h - 2 * m - 2 * hdrH - guideBand - strip.h - 0.25 * F) / 2;
      const stripFits = mode !== 'mid' ? true : strip.h <= D.h - 2 * m - guideBand;
      for (let z = 3; z >= 0.7; z -= 0.04) {
        const G0 = fileGeometry({z, M, n, cx: 0, shY: 0, fileLabelH: fileFit ? fileFit.height : 0, visitor: null, cover: true, desk: 'closeup', panelH: 12 * z, deskDepth: 60, maxRise: mode === 'stack' ? 12 : 25, clearTop: M.tabP + 0.6 * F});
        const bb = {x: G0.bbox.x - lane, y: G0.bbox.y, w: G0.bbox.w + lane, h: G0.bbox.h};
        const why = [bb.w > stageW ? `w ${Math.round(bb.w)}>${Math.round(stageW)}` : '', bb.h > stageH + 1 ? `h ${Math.round(bb.h)}>${Math.round(stageH)}` : '', G0.reachMiss > 0 ? 'reach' : '', strip.ok ? '' : 'strip', stripFits ? '' : 'strip-h', guide.fit.truncated ? 'guide' : ''].filter(Boolean);
        const fits = !why.length && M.ok;
        const miss = Math.max(bb.w - stageW, bb.h - stageH, 0) + (G0.reachMiss > 0 ? 1e4 : 0) + (strip.ok && stripFits ? 0 : 1e4);
        let share = G0.bbox.w / D.w;
        let cand = {F, M, z, bb, fits, miss, share, strip, hdrH, panelW, stageW, stageH, colW, guide, guideBand, guideMax, lane, why, mode, titled, fileFit};
        if (fits) {
          // widen the cabinet (longer piece strips) so the scene fills its box: more scene, same height. The gap to
          // the assistant stays as it was, and the edge-on side path (edge-on width) still clears the face
          const gap0 = Math.max(0, 0.35 * F + sideTurn(M) * M.W - 28 * z);
          const extra = stageW - bb.w;
          if (extra > 4) {
            // largest widening that still fits the box and keeps every tab within reach (binary search)
            const tryW = W2 => {
              const M2 = measurePieces(ctx, {pieces, F, W: W2, showText: titled, maxLines: 3});
              const gap2 = Math.max(gap0, 0.35 * F + sideTurn(M2) * M2.W - 28 * z);
              const fit2 = titled ? fitWords(glueNums(p.props.fileLabel), {maxWidth: (M2.W + 3.2 * F) * 0.8, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
              const G2 = fileGeometry({z, M: M2, n, cx: 0, shY: 0, fileLabelH: fit2 ? fit2.height : 0, visitor: null, cover: true, desk: 'closeup', panelH: 12 * z, deskDepth: 60, maxRise: mode === 'stack' ? 12 : 25, clearTop: M2.tabP + 0.6 * F, cabGap: gap2});
              const bb2 = {x: G2.bbox.x - lane, y: G2.bbox.y, w: G2.bbox.w + lane, h: G2.bbox.h};
              const ok = M2.ok && (!fit2 || !fit2.truncated) && bb2.w <= stageW + 0.5 && bb2.h <= stageH + 1 && G2.reachMiss <= 0;
              return ok ? {M: M2, fileFit: fit2, bb: bb2, share: G2.bbox.w / D.w, cabGap: gap2} : null;
            };
            let lo = M.W, hi = M.W + extra, got = null;
            for (let it = 0; it < 9; it++) { const mid = (lo + hi) / 2; const t = tryW(mid); if (t) { got = t; lo = mid; } else hi = mid; }
            if (got) cand = {...cand, ...got};
          }
          share = cand.share;
          if (!fitAtF || share > fitAtF.share) fitAtF = cand;
          break;
        }
        if (!fallback || miss < fallback.miss) fallback = cand;
      }
      }
      }
      if (fitAtF) {
        // coordinator decision 2026-09-26: side by side ~40 % (0.38 accepted in 16:9), stacked ≥ 0.71
        const target = fitAtF.mode === 'stack' ? 0.71 : ctx.view.shape === 'landscape' ? 0.38 : 0.4;
        if (fitAtF.share >= target - 1e-9) best = fitAtF;
        else if (!bestShare || fitAtF.share > bestShare.share + 0.01) bestShare = fitAtF;
      }
    }
    if (!best) best = bestShare || fallback;
    const mode = best.mode;
    column = mode === 'stack';
    const {F, M, z, strip, hdrH, panelW, stageW, stageH, colW, guide, guideBand, lane} = best;
    const bb = best.bb;
    // panel boxes: hy = header top, stageY/stageX = the stage box
    let panels, stripAt;
    if (mode === 'stack') {
      const blockH = 2 * (hdrH + stageH) + guideBand + 0.25 * F + strip.h;
      const top = m + Math.max(0, (D.h - 2 * m - blockH) / 2);
      const sx = m;
      panels = [0, 1].map(i => {
        const hy = top + i * (hdrH + stageH + guideBand);
        return {x: m, y: hy, w: panelW, h: hdrH + stageH, hy, hx: sx + lane, stageX: sx, stageY: hy + hdrH};
      });
      stripAt = {x: m + ((D.w - 2 * m) - strip.w) / 2, y: top + 2 * (hdrH + stageH) + guideBand + 0.25 * F};
    } else {
      const blockH = hdrH + guideBand + stageH + (mode === 'bottom' ? strip.h + 0.25 * F : 0);
      const top = m + Math.max(0, (D.h - 2 * m - blockH) / 2);
      const xs = mode === 'mid' ? [m, D.w - m - panelW] : [m, m + panelW + (mode === "bottom" ? 1.6 : 2.4) * F];
      const py = mode === 'bottom' ? top : top + guideBand;
      panels = xs.map(x => ({x, y: py, w: panelW, h: hdrH + stageH, hy: py, hx: x + lane, stageX: x, stageY: py + hdrH}));
      stripAt = mode === 'mid'
        ? {x: m + panelW + 1.2 * F + (colW - strip.w) / 2, y: panels[0].hy + Math.max(0, (hdrH + stageH - strip.h) / 2)}
        : {x: m + ((D.w - 2 * m) - strip.w) / 2, y: py + hdrH + stageH + guideBand + 0.25 * F};
    }
    const panel = {w: stageW, h: stageH};
    // stages: identical geometry, placed at the same spot of each panel
    const stages = panels.map((pn, i) => {
      const dx = pn.stageX - bb.x;
      const dy = pn.stageY + (stageH - bb.h) / 2 - bb.y;
      const G = fileGeometry({z, M, n, cx: dx, shY: dy, fileLabelH: best.fileFit ? best.fileFit.height : 0, visitor: null, cover: true, desk: 'closeup', panelH: 12 * z, deskDepth: 60, maxRise: mode === 'stack' ? 12 : 25, clearTop: M.tabP + 0.6 * F, cabGap: best.cabGap});
      const found = i === 0 ? foundA : foundB;
      const occupancy = pieces.map((q, k) => [k, k]).filter(([k]) => k !== target || found === target);
      if (found !== target) occupancy.push([target, found]);
      if (found !== target) occupancy.push([target, target]);
      const st = fileStage(ctx, {prefix: i ? 'sb' : 'sa', titles: best.titled, blankPlate: !best.titled, G, M, pieces, actors: p.actors, fileLabelFit: best.fileFit, occupancy, movers: [target], cover: true, bubble: null});
      const touch = Array.from({length: found + 1}, (_, c) => c);
      const script = consultScript(st, {target, from: found, home: target, touch, final: 'returned', W, cover: true, open: false});
      return {st, script, G, M, found, pn};
    });
    // occupancy order inside a compartment: the slot's own piece first, then a piece supplied as sitting in front of it
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    const extras = [];
    // headers
    const hdrs = panels.map((pn, i) => header(ctx, {name: `hdr${i}`, letter: i ? 'B' : 'A', sc: i ? p.scenarioB : p.scenarioA, x: pn.hx, y: pn.hy, w: stageW - lane, h: hdrH, F, color: i ? ctx.theme.accent3 : ctx.theme.accent2}));
    extras.push(...hdrs.map(hd => hd.node));
    // "where the requested piece sits" outlines (equal in both scenes)
    const rings = stages.map((sg, i) => {
      const row = sg.G.rows[sg.found];
      const b = {x: sg.G.cab.innerL - 0.25 * F, y: row.stripTop + sg.M.tab.y - 0.25 * F, w: sg.G.cab.r - sg.G.cab.innerL + 0.1 * F, h: sg.M.stripH - sg.M.tab.y + 0.35 * F};
      return {b, node: h('path', {name: `ring${i}`, d: roundRectPath(b.x, b.y, b.w, b.h, 0.4 * F), fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 4, 'stroke-dasharray': '12 8', opacity: 0})};
    });
    // closing guide: from ring A to ring B through the lanes beside the cabinets and the free band above them
    const ga = rings[0].b, gb = rings[1].b;
    let pts;
    if (column) {
      const lx = Math.min(stages[0].G.cab.x, stages[1].G.cab.x) - 0.75 * F;
      pts = [{x: ga.x, y: ga.y + ga.h / 2}, {x: lx, y: ga.y + ga.h / 2}, {x: lx, y: gb.y + gb.h / 2}, {x: gb.x, y: gb.y + gb.h / 2}];
    } else {
      const gy = mode === 'bottom' ? panels[0].stageY + stageH + 0.5 * F : panels[0].y - 0.5 * F;
      const lxA = stages[0].G.cab.x - 0.75 * F, lxB = stages[1].G.cab.x - 0.75 * F;
      pts = [{x: ga.x, y: ga.y + ga.h / 2}, {x: lxA, y: ga.y + ga.h / 2}, {x: lxA, y: gy}, {x: lxB, y: gy}, {x: lxB, y: gb.y + gb.h / 2}, {x: gb.x, y: gb.y + gb.h / 2}];
    }
    const segs = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
    const gLen = segs.reduce((a, b) => a + b, 0);
    const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
    extras.push(h('path', {name: 'guide-line', d, fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(gLen)} ${r(gLen + 10)}`, 'stroke-dashoffset': r(gLen)}));
    // guide chip: on the free band beside the guide's longest free segment
    let gChip = null;
    if (showAll) {
      let gc;
      if (column) {
        const midY = (pts[1].y + pts[2].y) / 2;
        const gx = pts[1].x + 0.6 * F;
        const y0 = panels[1].hy - guideBand / 2 - guide.box.h / 2;
        gc = {x: gx + guide.box.w / 2, y: Math.min(Math.max(y0, pts[1].y + 0.4 * F), pts[2].y - guide.box.h - 0.4 * F)};
        if (!Number.isFinite(midY)) gc.y = y0;
      } else {
        gc = {x: (pts[2].x + pts[3].x) / 2, y: mode === 'bottom' ? pts[2].y + 0.45 * F : pts[2].y - 0.5 * F - guide.box.h};
      }
      // keep the (centred) chip inside the frame; it stays under/over the guide's horizontal run
      gc.x = Math.max(10 + guide.box.w / 2, Math.min(ctx.design.w - 10 - guide.box.w / 2, gc.x));
      gChip = wchip(ctx, guideText, {x: gc.x, y: gc.y, anchor: 'middle', maxWidth: best.guideMax, size: F, minSize: F, maxLines: 3, stroke: ctx.theme.accent, weight: 700});
      extras.push(g({name: 'guide-chip', opacity: 0}, gChip.node));
    }
    // shared strip (middle column, bottom strip or right column)
    const stripY = stripAt.y;
    let rel = null;
    if (showKey) {
      const built = buildStrip(ctx, strip, stripAt, showAll);
      extras.push(built.node);
      rel = built.rel;
    }
    return {mode: best.mode, titled: best.titled, stages, rings, extras, hdrs, panels, pts, gLen, gChip, rel, strip, F, M, z, n, target, foundA, foundB, pieces, column, fits: best.fits, issues: best.fits ? [] : best.why, textPx: r(F * px, 1), stripY};
  },
  build(ctx, L) {
    // B keeps a trace of what happened (also with labels hidden): a dashed path from the compartment where the
    // piece was found (as supplied) to the numbered slot it was put back in
    const trails = L.stages.map((sg, i) => {
      if (sg.found === L.target) return null;
      const G = sg.G, M = sg.M, F = L.F;
      const mid = c => G.rows[c].stripTop + M.stripH / 2;
      const x0 = G.cab.r + 0.35 * F, yF = mid(sg.found), yH = mid(L.target);
      const bx = x0 + 1.7 * F;
      return g({name: `trail${i}`, opacity: 0},
        h('path', {d: `M${r(x0)} ${r(yF)}C${r(bx)} ${r(yF)} ${r(bx)} ${r(yH)} ${r(x0 + 0.5 * F)} ${r(yH)}`, fill: 'none', stroke: ctx.theme.fgSoft, 'stroke-width': 3, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round'}),
        h('path', {d: `M${r(x0)} ${r(yH)}l${r(0.55 * F)} ${r(-0.32 * F)}v${r(0.64 * F)}z`, fill: ctx.theme.fgSoft}),
        h('circle', {cx: r(x0), cy: r(yF), r: r(0.16 * F), fill: ctx.theme.fgSoft}));
    });
    return g(null, L.stages.map(sg => sg.st.node), L.rings.map(rg => rg.node), trails, L.extras);
  },
  frame(ctx, L, u, timeMs) {
    const nodes = {};
    const sem = [];
    for (const [i, sg] of L.stages.entries()) {
      const input = sg.script(u, timeMs, ctx.reduced);
      const posed = sg.st.pose({hands: input.hands, body: undefined, pieces: {[L.target]: input.piece}, cover: input.cover, coverHeld: input.coverHeld});
      Object.assign(nodes, posed.nodes);
      const pp = posed.piecePose.get(L.target);
      const M = sg.M, G = sg.G;
      const tabW = {x: pp.x + (pp.sx ?? 1) * M.gripTab.x, y: pp.y - pp.c * (M.H - M.gripTab.y)};
      const edgeW = {x: pp.x + (pp.sx ?? 1) * M.gripEdge.x, y: pp.y - pp.s * (M.H - M.gripEdge.y)};
      const holder = input.piece.holder;
      const inSlot = input.piece.where === 'slot' && !holder && (input.piece.rise || 0) === 0;
      sem.push({input, posed, pp, tabW, edgeW, holder, inSlot, G, M, sg});
    }
    const hp = seg(u, ...HEADER);
    L.hdrs.forEach((hd, i) => { nodes[`hdr${i}`] = {opacity: r(hp, 3)}; });
    const rp = seg(u, ...RING);
    // the outlines step aside while the pieces are out of their compartments (never drawn over a moving piece)
    const away = seg(u, W.lift[0] - 0.012, W.lift[0]) * (1 - seg(u, W.insert[1], W.insert[1] + 0.012));
    L.rings.forEach((rg, i) => { nodes[`ring${i}`] = {opacity: r(rp * (1 - away), 3)}; });
    const tp = seg(u, W.insert[1], W.release[1]);
    L.stages.forEach((sg, i) => { if (sg.found !== L.target) nodes[`trail${i}`] = {opacity: r(tp, 3)}; });
    const gp = seg(u, ...GUIDE);
    nodes['guide-line'] = {'stroke-dashoffset': r(L.gLen * (1 - gp)), opacity: gp > 0 ? 1 : 0};
    if (L.gChip) nodes['guide-chip'] = {opacity: r(seg(u, GUIDE[0] + 0.03, GUIDE[1] + 0.01), 3)};
    const np = seg(u, ...NOTE);
    if (ctx.show('key')) nodes['strip-note'] = {opacity: r(np, 3)};
    if (L.rel) {
      Object.assign(nodes, L.rel.frame(1, 1));
    }
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    // what each scene shows, in its own stage coordinates (for the "identical before the change" check)
    const look = k => {
      const q = sem[k];
      const o = {x: q.G.cx, y: q.G.shY};
      const rel = pt => ({x: r(pt.x - o.x, 1), y: r(pt.y - o.y, 1)});
      return {
        cover: r(q.input.cover ?? 0, 3),
        handL: rel(q.posed.mf.hands.l), handR: rel(q.posed.mf.hands.r),
        body: {dx: r(q.posed.mf.shift.dx, 1), dy: r(q.posed.mf.shift.dy, 1)},
        header: r(hp, 3), ring: r(rp, 3),
        // contents only count once the roll-top has uncovered them
        contents: (q.input.cover ?? 0) > 0 ? {found: q.sg.found, pieceAt: q.input.piece.where, piece: rel({x: q.pp.x, y: q.pp.y})} : 'covered',
      };
    };
    const [a, b] = sem;
    // what each compartment shows at its front: the requested piece where it sits, else the slot's own piece (or empty)
    const slotsOf = q => L.pieces.map((_, c) => {
      if (q.inSlot && q.input.piece.c === c) return L.target;
      return c === L.target ? null : c;
    });
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const grips = q => ({
      gripL: q.holder === 'l' || q.input.phase === 'handoff' ? P2(q.tabW) : null,
      gripR: q.input.phase === 'handoff' ? P2(q.edgeW) : q.holder === 'r' ? P2(q.edgeW) : null,
    });
    const ga = grips(a), gb = grips(b);
    return {
      nodes,
      semantic: {
        beat,
        scenes: 2,
        lookA: look(0), lookB: look(1),
        phaseA: a.input.phase, phaseB: b.input.phase,
        handLA: P2(a.posed.mf.hands.l), handRA: P2(a.posed.mf.hands.r), handLB: P2(b.posed.mf.hands.l), handRB: P2(b.posed.mf.hands.r),
        gripLA: ga.gripL, gripRA: ga.gripR, gripLB: gb.gripL, gripRB: gb.gripR,
        pieceA: P2({x: a.pp.x, y: a.pp.y - a.pp.s * a.M.H}), pieceB: P2({x: b.pp.x, y: b.pp.y - b.pp.s * b.M.H}),
        coverA: r(a.input.cover, 3), coverB: r(b.input.cover, 3),
        handleA: P2(a.posed.handle), handleB: P2(b.posed.handle),
        foundA: L.foundA, foundB: L.foundB, target: L.target,
        slotOfTargetA: a.inSlot ? a.input.piece.c : null, slotOfTargetB: b.inSlot ? b.input.piece.c : null,
        slotsA: slotsOf(a), slotsB: slotsOf(b),
        holderA: a.holder, holderB: b.holder,
        touchedA: a.sg.found + 1, touchedB: b.sg.found + 1,
        foreignSlots: sem.map(q => foreignSlotHits(q.G, q.M, q.pp, q.input.piece.where, q.input.piece.where === 'slot' ? q.input.piece.c : (q.input.phase === 'carry' ? q.sg.found : L.target)).length),
        ringShown: r(rp * (1 - away), 3), trailB: r(L.stages[1].found !== L.target ? tp : 0, 3), guideProgress: r(gp, 3), noteShown: r(np, 3),
        faceClear: sem.every(q => !overlaps(pieceBox(q.M, q.pp), q.posed.mf.face, -2)),
        sameGeometry: a.G.z === b.G.z && a.M.W === b.M.W && Math.abs((a.G.cab.x - a.G.cx) - (b.G.cab.x - b.G.cx)) < 0.01,
        // the drawn scene (cabinet, assistant, desk) as a share of the frame width
        sceneShare: r(Math.min(a.G.bbox.w, b.G.bbox.w) / ctx.design.w, 3),
        mode: L.mode, titled: L.titled, shape: ctx.view.shape,
        column: L.column,
        layoutFits: L.fits,
        layoutIssues: L.issues,
        textPx: L.textPx,
        allReached: a.posed.reached && b.posed.reached,
      },
    };
  },
};

/** Header height for a scenario header at width w (label + caption). */
function headerHeight(ctx, p, F, w) {
  return Math.max(...[p.scenarioA, p.scenarioB].map(sc => headerFits(ctx, sc, F, w - 2.4 * F).h), 2.4 * F);
}

/** Label and caption of a scenario header: on one line when both fit, else stacked. */
function headerFits(ctx, sc, F, tw) {
  const f1 = fitWords(sc.label, {maxWidth: tw, size: F * 1.1, minSize: F * 1.1, maxLines: 2, weight: 800});
  const cap = sc.caption ? glueNums(sc.caption) : '';
  if (cap && f1.lines.length === 1) {
    const rest = tw - f1.width * 1.08 - 1.0 * F;
    const f2i = rest > 4 * F ? fitWords(cap, {maxWidth: rest, size: F, minSize: F, maxLines: 1, weight: 500}) : null;
    if (f2i && !f2i.truncated && f2i.lines.length === 1) return {f1, f2: f2i, inline: true, h: f1.height + 0.6 * F};
  }
  const f2 = cap ? fitWords(cap, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 500}) : null;
  return {f1, f2, inline: false, h: f1.height + (f2 ? f2.height + 0.45 * F : 0) + 0.6 * F};
}

/** Scenario header: lettered badge (lane colour) + label + caption. Same size for A and B. */
function header(ctx, o) {
  const F = o.F;
  const th = ctx.theme;
  const R = 0.95 * F;
  const tx = o.x + 2 * R + 0.5 * F;
  const tw = o.w - 2.4 * F;
  const parts = [h('circle', {cx: r(o.x + R), cy: r(o.y + R + 0.1 * F), r: r(R), fill: o.color, stroke: th.ink, 'stroke-width': 2.5})];
  if (ctx.show('key')) {
    parts.push(h('text', {x: r(o.x + R), y: r(o.y + R + 0.1 * F + 0.38 * F), 'text-anchor': 'middle', 'font-size': r(1.05 * F, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter));
    const hf = headerFits(ctx, o.sc, F, tw);
    parts.push(textBlockAt(hf.f1, tx, o.y, th.fg));
    if (hf.f2 && ctx.show('all')) {
      if (hf.inline) parts.push(textBlockAt(hf.f2, tx + hf.f1.width * 1.08 + 1.0 * F, o.y + (hf.f1.size - hf.f2.size) * 0.8, th.fgSoft));
      else parts.push(textBlockAt(hf.f2, tx, o.y + hf.f1.height + 0.45 * F, th.fgSoft));
    }
  }
  return {node: g({name: o.name, opacity: 0}, parts)};
}

/** Draw the measured strip at (x, y). */
function buildStrip(ctx, S, at, showAll) {
  const th = ctx.theme;
  const parts = [];
  let rel = null;
  let y = at.y;
  for (const rw of S.rows) {
    for (const it of rw.items) {
      const x = at.x + it.dx, iy = it.y != null ? y + it.y : y + (rw.h - it.h) / 2;
      if (it.kind === 'request' && it.vertical) {
        const c1 = wchip(ctx, it.first.t, {x, y: iy, anchor: 'start', maxWidth: it.first.c.box.w + 1, size: it.first.c.fit.size, minSize: it.first.c.fit.size, maxLines: 4, fill: '#f7f1e3', name: `strip-${it.first.id}`});
        const c2 = wchip(ctx, it.second.t, {x, y: iy + it.first.c.box.h + it.linkV, anchor: 'start', maxWidth: it.second.c.box.w + 1, size: it.second.c.fit.size, minSize: it.second.c.fit.size, maxLines: 4, fill: '#f7f1e3', name: `strip-${it.second.id}`});
        parts.push(c1.node, c2.node);
        if (it.link && showAll) {
          const lx = x + 1.1 * it.cap.fit.size;
          const from = {x: lx, y: c1.box.y + c1.box.h + 4}, to = {x: lx, y: c2.box.y - 14};
          rel = connector(ctx, {name: 'rel', from, to, kind: it.link.kind, bend: 0, color: kindColor(ctx, it.link.kind)});
          parts.push(rel.node);
          parts.push(wchip(ctx, it.link.label || it.link.kind, {x: lx + 0.5 * it.cap.fit.size, y: (from.y + to.y) / 2 - it.cap.box.h / 2, anchor: 'start', maxWidth: it.cap.box.w + 1, size: it.cap.fit.size, minSize: it.cap.fit.size, maxLines: 4, stroke: kindColor(ctx, it.link.kind), name: 'rel-label'}).node);
        }
      } else if (it.kind === 'request') {
        const c1 = wchip(ctx, it.first.t, {x, y: iy, anchor: 'start', maxWidth: it.first.c.box.w + 1, size: it.first.c.fit.size, minSize: it.first.c.fit.size, maxLines: 4, fill: '#f7f1e3', name: `strip-${it.first.id}`});
        const c2 = wchip(ctx, it.second.t, {x: x + it.first.c.box.w + (it.link ? it.linkLen : 0.8 * it.first.c.fit.size), y: iy, anchor: 'start', maxWidth: it.second.c.box.w + 1, size: it.second.c.fit.size, minSize: it.second.c.fit.size, maxLines: 4, fill: '#f7f1e3', name: `strip-${it.second.id}`});
        parts.push(c1.node, c2.node);
        if (it.link && showAll) {
          const ly = iy + Math.min(c1.box.h, c2.box.h) / 2;
          const from = {x: c1.box.x + c1.box.w + 4, y: ly}, to = {x: c2.box.x - 14, y: ly};
          rel = connector(ctx, {name: 'rel', from, to, kind: it.link.kind, bend: 0, color: kindColor(ctx, it.link.kind)});
          parts.push(rel.node);
          parts.push(wchip(ctx, it.link.label || it.link.kind, {x: (from.x + to.x) / 2, y: ly + 6, anchor: 'middle', maxWidth: it.cap.box.w + 1, size: it.cap.fit.size, minSize: it.cap.fit.size, maxLines: 4, stroke: kindColor(ctx, it.link.kind), name: 'rel-label'}).node);
        }
      } else if (it.kind === 'quote') {
        if (showAll) parts.push(textBlockAt(it.f, x, iy, th.fg, 'strip-quote'));
      } else if (it.kind === 'pieces') {
        const sq = 0.9 * it.f.size;
        parts.push(h('path', {d: roundRectPath(x, iy + (it.f.size - sq) / 2 + 0.1 * sq, sq * 1.2, sq, 3), fill: '#e3c16f', stroke: th.ink, 'stroke-width': 1.6}));
        parts.push(textBlockAt(it.f, x + 1.6 * it.f.size, iy, th.fg, 'strip-pieces'));
      } else if (it.kind === 'shared') {
        if (showAll) parts.push(textBlockAt(it.f, x, iy, th.fgSoft, 'strip-shared'));
      } else if (it.kind === 'note') {
        parts.push(g({name: 'strip-note', opacity: 0}, wchip(ctx, it.text, {x, y: iy, anchor: 'start', maxWidth: it.c.box.w + 1, size: it.c.fit.size, minSize: it.c.fit.size, maxLines: 8}).node));
      } else if (it.kind === 'key') {
        parts.push(it.key.build(x, iy, 'strip-key'));
      }
    }
    y += rw.h + S.gapY;
  }
  return {node: g({name: 'strip'}, parts), rel};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-09-contrast',
    title: 'Case-file consultation — the requested piece in its own slot vs supplied as sitting in another slot',
    titleEs: 'Consulta de expediente por auxiliar — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta de expediente por auxiliar',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical scenes: an assistant rolls up the cover of a step cabinet of numbered pieces. In A the requested piece sits in its own numbered slot; in B (as supplied) its slot is empty and the piece sits in another slot. The assistant runs a hand down the tabs, finds it (B searches further), takes it out, reads it at the desk and slides it back into its own slot. A guide joins the two positions; no consequence of the position is drawn.',
    tags: ['case file', 'expediente', 'numbered slot', 'misfiled piece', 'as supplied', 'comparison', 'assistant', 'index tab', 'roll-top cabinet'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-de-expediente.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
