/**
 * LAW-0260 — Contestación estructurada · inspect
 *
 * Storyboard (context = the state produced by the story: every section of Party B's structured response is linked by
 * its thread to the allegation it answers, each with its supplied state glyph; Party A at the desk, the case file, the
 * trays and the calendar with the response day marked. The board's sheets show numbered rows; the supplied texts are
 * printed in a text column beside the scene (under it on tall frames). The context keeps its place and full size the
 * whole time; while the lens is open it dims in place):
 *  0.00–0.20  context: the scene, the name chips, the column, the single editorial caption, the datum tag on the first
 *             section's thread ("§1 · ● Admitted fact (as supplied)") and the keys.
 *  0.20–0.32  a lens opens beside the inspected thread, over the text column (the column texts under it fade out with
 *             it): a REAL second copy of the scene at the same coordinates, enlarged (zoom >= 1.5×) about the first
 *             section's thread — both pins, its lane and its state glyph — with a datum card under the window. The
 *             copy's text and the card's old value arrive with the window, in step with the context's datum tag
 *             leaving; two guides join the window to the thread.
 *  0.44–0.66  the old value on the card is struck in grey; then only the datum changes inside the lens — the thread
 *             takes the dashed (disputed) marker and its glyph turns from ● to ◆ — and the new value appears.
 *  0.66–0.72  the card text and the copy fade, the lens closes, the context brightens again.
 *  0.74–1.00  back in context the same change is applied to the thread; the datum tag shows the new value; a neutral
 *             Δ changed-datum marker and a note (marker label, struck before value, after value) stay for the hold.
 *             Seeking back before 0.44 restores the old datum exactly. No effect of admitting or disputing, burden,
 *             consequence or outcome is shown.
 * @module animations/civil-claim/LAW-0260
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, oneOf, num} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  CE_DEFAULTS, CE_DEFAULTS_ES, CE_COMMON_ES, CE_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, solveBoard, placeBoard, boardStage, choreo, sectionsOf, stateKeyText,
  localizeDefaults, stateBadge,
} from './kits/contestacion-estructurada.js';

const ID = 'LAW-0260';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_ = {
  caption: [0.02, 0.08], open: [0.2, 0.32], strike: [0.44, 0.49], geo: [0.5, 0.56], oldOut: [0.545, 0.56], newText: [0.56, 0.585],
  textOut: [0.66, 0.68], close: [0.675, 0.72], ctxGeo: [0.74, 0.8], tagIn: [0.8, 0.83], marker: [0.82, 0.88],
  // (in step with the lens: the context's datum tag and the column texts under the window leave just before the window
  // and its copy appear — the copy is legible from ~40 % open, u ≈ 0.248 — and come back just after they go)
  hideOut: [0.236, 0.247], hideIn: [0.681, 0.69],
};
/** how far the context dims in place while the lens is open */
const DIM = 0.6;
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
const S_MIN = {landscape: 0.45, square: 0.3, portrait: 0.4};
const STATES_TEXT = {admitted: '●', disputed: '◆'};

const STRINGS = {
  en: {...CE_STRINGS.en, before: 'Before', after: 'After'},
  es: {...CE_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  focusTarget: oneOf('Detail that is enlarged and substituted: "state" (the state supplied for the first section — its thread and glyph; the before/after values are the two supplied states)', ['state']),
  beforeValue: str('Value shown before the substitution (as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum, as supplied)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens relative to the context (at least 1.5)', 1.5, 4), placement: oneOf('Where the lens sits relative to the scene', ['auto', 'right', 'bottom', 'top'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial annotation)', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  parties: CE_DEFAULTS.parties,
  documents: CE_DEFAULTS.documents,
  stages: CE_DEFAULTS.stages,
  dates: CE_DEFAULTS.dates,
  focusTarget: 'state',
  beforeValue: '§1 · ● Admitted fact (as supplied)',
  afterValue: '§1 · ◆ Disputed fact (as supplied)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Each section of the response is linked to an allegation', marker: 'Datum changed'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...CE_COMMON_ES,
  beforeValue: '§1 · ● Hecho admitido (según lo aportado)',
  afterValue: '§1 · ◆ Hecho controvertido (según lo aportado)',
  contextLabels: {context: 'Cada apartado de la contestación se vincula a una alegación', marker: 'Dato cambiado'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const D = ctx.design;
    const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const floorK = 16.4 / pxPer / (SIZE[ctx.view.shape] * 0.96);
    let L = null;
    for (const k of [1, 0.92, 0.85].filter(k2 => k2 > floorK + 0.03).concat([floorK])) {
      // (square: the column is as wide as the lens, so the lens covers the column and never the scene)
      // (people scale: the compact board leaves room for larger people; the largest that fits wins)
      for (const colK of {portrait: [null], landscape: [0.32, 0.36], square: [0.42, 0.45]}[ctx.view.shape]) for (const pk of [1.5, 1.3, 1.15, 1]) {
        const q = compose(ctx, Math.max(k, floorK), colK, pk);
        if (!L || (q.ok && !L.ok) || (q.ok === L.ok && q.headPx > L.headPx)) L = q;
      }
      if (L.ok) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

const after = s => ({...s, state: s.state === 'admitted' ? 'disputed' : 'admitted'});

function compose(ctx, sizeK, colK, peopleK = 1) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const small = B * 0.96 * sizeK;
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf(ctx, p);
  // (the props' labels are not fields of this item: the locale's defaults)
  const sp = {...p, labels: (p.locale === 'es' ? CE_DEFAULTS_ES : CE_DEFAULTS).labels};
  const secs = sectionsOf(p);
  // ---- top band: the state key and the "as supplied" key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
  const stKey = showKey ? gchip(ctx, stateKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  const bandY = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
  // ---- the text column (right; under the scene on tall frames): the caption, then the texts the compact props
  // do not print
  const stacked = shape === 'portrait';
  // (labels hidden: no column — the lens's room is wall, on the right, or above the scene on tall frames)
  const hidden = !showAll;
  const colW = stacked ? D.w - 16 : Math.round(D.w * colK);
  const colTexts = showAll ? [
    {name: 'caption', text: p.contextLabels.context, weight: 700, stroke: th.ink},
    {name: 'claim-t', text: p.documents.claim.title, weight: 700},
    ...p.documents.claim.allegations.map((a, i) => ({name: `al${i}`, text: `${i + 1}  ${a}`})),
    {name: 'resp-t', text: p.documents.response.title, weight: 700},
    ...secs.map((s, i) => ({name: `sec${i}`, text: `§${i + 1}  ${s.label}`})),
    {name: 'cf', text: `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`},
    {name: 'trays', text: `${sp.labels.claimTray}  ·  ${sp.labels.responseTray}`},
    {name: 'cal', text: `${sp.labels.calendar}: ${p.dates.window.join(' · ')}`},
    // (the return's note: the marker label and the struck before value — the after value is on the datum tag — hidden
    // until the marker)
    {name: 'note-m', text: `Δ ${p.contextLabels.marker}`, weight: 700, stroke: th.accent2, late: true},
    {name: 'note-b', text: `${ctx.t.before}: ${p.beforeValue}`, late: true, strike: true},
  ] : [];
  // (placed after the stage is known: the probe gives the column's height for stacked frames)
  const mkCol = (x0, y0) => {
    let y = y0;
    return colTexts.map(it => {
      const c = gchip(ctx, it.text, {x: x0, y, anchor: 'start', maxWidth: colW, size: small, minSize: small, maxLines: 8, fill: th.card, stroke: it.stroke || th.inkSoft, color: th.ink, weight: it.weight || 600, name: it.strike ? undefined : `col-${it.name}`});
      y = c.box.y + c.box.h + 6;
      return {...it, c};
    });
  };
  const probeCol = mkCol(0, 0);
  const colH = probeCol.length ? probeCol.at(-1).c.box.y + probeCol.at(-1).c.box.h : 0;
  // ---- name chips
  const capOf = i => partyCaption(p, i);
  const availW = stacked ? D.w - 16 : D.w - 16 - colW - 20;
  const chipMax = availW * 0.46;
  const probe = showKey ? [0, 1].map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 14 : 6;
  // (a tall frame keeps room under the scene for the column and the lens: at least the lens's height)
  // (the lens's short side >= 0.37 of the frame's short side, in design units)
  const lensMin = 0.37 * Math.min(ctx.view.width, ctx.view.height) / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const below = stacked && !hidden ? Math.max(colH, lensMin + small * 4.5) + 12 : 0;
  // (tall frames with labels hidden: the lens opens over the wall above the scene — room for the whole board at 1.5×)
  const above = stacked && hidden ? Math.max(lensMin, 0.4 * (D.h - bandY)) + 16 : 0;
  const top0 = bandY + above;
  const sol = solveBoard(ctx, {B, availW, availH: D.h - top0 - chipBand - 8 - below, sMin: S_MIN[shape],
    opts: {prefix: 'st', p: sp, looks, showText: showKey, markIdx: p.dates.responseDay, compact: true, tuck: shape !== 'landscape', sections: secs, lwK: shape === 'landscape' ? 14 : 18, peopleK}});
  let stage = sol.stage;
  const s = sol.s;
  const PL = placeBoard(sol, {x0: 8, top0, availW, bottom: D.h - 4 - below, chipBand});
  if (hidden) {
    // (the room fills the box: its wall runs to the right edge — or up to the top band on tall frames — where the lens
    // opens over bare wall)
    const E0 = stage.ext;
    const right = PL.board.ox + (E0.x + E0.w) * s, topY = PL.board.oy + E0.y * s;
    const opts0 = {prefix: 'st', p: sp, looks, showText: showKey, markIdx: p.dates.responseDay, compact: true, tuck: shape !== 'landscape', sections: secs, lwK: shape === 'landscape' ? 14 : 18, peopleK, ts: sol.ts};
    stage = boardStage(ctx, {...opts0, wallExtraX: stacked ? 0 : Math.max(0, Math.round((D.w - 8 - right) / s)), wallExtra: Math.max(0, Math.round((topY - bandY) / s))});
  }
  const {ox, oy, M} = PL.board;
  const G = stage.G;
  const bx = PL.boxes;
  const colX = stacked ? 8 : D.w - 8 - colW;
  const colY = stacked ? PL.floorB + chipBand + 8 : bandY;
  const col = mkCol(colX, colY);
  const colFits = !col.length || col.at(-1).c.box.y + col.at(-1).c.box.h <= D.h - 6;
  const occupied = [bx.personA, bx.personB, bx.board, bx.file, bx.cal, ...bx.trays, bx.desk, ...col.map(q => q.c.box)];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  // ---- name chips under each party
  const chips = [];
  if (showKey) {
    const xs = [M({x: G.xB, y: 0}).x, M({x: 0, y: 0}).x];
    [0, 1].forEach(i => {
      const w = probe[i].box.w;
      const cx = clamp(xs[i], 8 + w / 2, 8 + availW - w / 2);
      const c = gchip(ctx, capOf(i), {x: cx, y: PL.floorB + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${i ? 'a' : 'b'}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  // ---- the inspected item: the first section's thread (both pins, its lane, its state glyph)
  const L0 = G.links[0];
  const pad = G.ts * 0.9;
  // (the whole board: every sheet and every thread lies wholly inside the window, so the rim cuts nothing)
  const src = {x: bx.board.x - 8, y: bx.board.y - 8, w: bx.board.w + 22, h: bx.board.h + 24};
  // ---- the context's datum tag on the thread
  const pxTag = small;
  // (the before and the after tag share one anchor — the after value takes the before value's place — and both must
  // find a free spot there, clear of the faces)
  let tag = null, tagAfter = null;
  if (showAll) {
    const bdg = M(L0.badge);
    // (on the thread's glyph first; else at the board's edge nearest the thread — under it, above it, beside it)
    const bd = bx.board, ch = bx.channel;
    const anchors = [{x: bdg.x + G.ts * s * 0.6, y: bdg.y}, {x: bdg.x, y: bdg.y}, {x: ch.x + ch.w / 2, y: bd.y + bd.h + 4}, {x: ch.x + ch.w / 2, y: bd.y - 4}, {x: bd.x + bd.w + 4, y: bdg.y}, {x: bd.x - 4, y: bdg.y}];
    const occ0 = [...occupied, {x: src.x, y: src.y, w: src.w, h: src.h}, ...[bx.headA, bx.headB].filter(f => f.w > 0)];
    const mk = (name, text, anchor) => placeTag(ctx, {name, text, anchor, occupied: occ0, bounds: {x: 6, y: 6, w: D.w - 12, h: D.h - 12}, maxWidth: Math.min(440, D.w * 0.4), size: pxTag, color: th.inkSoft, maxLead: 38 / pxPer, narrow: true});
    for (const anchor of anchors) {
      const a = mk('tag-datum', p.beforeValue, anchor), b2 = mk('tag-datum2', p.afterValue, anchor);
      const clear = a.clear && b2.clear;
      if (!tag || (clear && !(tag.clear && tagAfter.clear))) { tag = a; tagAfter = b2; }
      if (clear) break;
    }
    occupied.push(tag.box);
  }
  // ---- the lens: a window over the text column (under the scene on tall frames), its short side >= 0.37 of the
  // frame's short side, clear of the faces; a datum card under the window
  const faces = [bx.headA, bx.headB].filter(f => f.w > 0);
  const cardTs = small * 1.6;
  const cardFits = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: 10000, size: cardTs, minSize: cardTs, maxLines: 3}));
  const zoomIn = clamp(p.detailGeometry.zoom, 1.5, 4);
  let win = null;
  {
    const minSide = Math.max(lensMin, 1);
    // window: square-ish, as large as the column allows; the card band under it
    const maxW = stacked ? D.w - 16 : Math.max(colW, minSide) ;
    const wW = clamp(Math.max(minSide, (src.w + 0) * Math.max(1.5, zoomIn)), minSide, maxW);
    const cardWrapW = wW - small;
    const cardProbe = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: cardWrapW, size: cardTs, minSize: cardTs, maxLines: 4}));
    const cardH = hidden ? 0 : Math.max(...cardProbe.map(c => c.box.h)) * 1.15 + small * 1.2;
    // (the window takes the source's proportions, so it shows the inspected thread and little else)
    const maxH = (stacked ? (hidden ? above - 8 : D.h - 8 - (colY - 4)) : D.h - 8 - bandY) - cardH;
    // (the window shows the whole board at the supplied zoom when there is room; never under the minimum size)
    const wH = clamp(Math.max(wW * src.h / src.w, src.h * Math.max(1.5, zoomIn)), Math.max(minSide - cardH, wW * 0.6), Math.max(minSide - cardH, maxH));
    const x = stacked ? clamp(src.x + src.w / 2 - wW / 2, 8, D.w - 8 - wW) : D.w - 8 - wW;
    // vertical: centred on the source when that is clear of the faces; else the nearest clear place
    const totalH = wH + cardH;
    const yMin = stacked ? (hidden ? bandY : colY - 4) : bandY, yMax = stacked && hidden ? bandY : D.h - 8 - totalH;
    const cands = [];
    for (let k = 0; k <= 24; k++) cands.push(lerp(yMin, yMax, k / 24));
    cands.sort((a2, b2) => Math.abs(a2 + totalH / 2 - (src.y + src.h / 2)) - Math.abs(b2 + totalH / 2 - (src.y + src.h / 2)));
    const y = cands.find(yy => faces.every(f => !hit({x, y: yy, w: wW, h: totalH}, f, 6))) ?? cands[0];
    win = {x, y, w: wW, h: wH, cardH, cardWrapW};
  }
  // zoom: the window shows the source region enlarged; at least 1.5×, as supplied, and enough to fill the window
  // zoom: the window shows the source region; never under 1.5× nor under the supplied zoom; at most 4×
  // (the zoom that shows the whole board in the window: at most 4×; the layout is refused below 1.5×)
  const Z = Math.min(4, Math.min(win.w / src.w, win.h / src.h));
  const srcC = {x: src.x + src.w / 2, y: src.y + src.h / 2};
  const winC = {x: win.x + win.w / 2, y: win.y + win.h / 2};
  // (the region the window actually shows, in context coordinates: the source centre ± half the window over Z)
  const shown = {x: srcC.x - win.w / Z / 2, y: srcC.y - win.h / Z / 2, w: win.w / Z, h: win.h / Z};
  const lensBox = {x: win.x, y: win.y, w: win.w, h: win.h + win.cardH};
  // the lens copy: a second stage at the context's coordinates (a separate set of names)
  const lz = boardStage(ctx, {prefix: 'lz', p: sp, looks, showText: showKey, markIdx: p.dates.responseDay, compact: true, tuck: shape !== 'landscape', sections: secs, lwK: shape === 'landscape' ? 14 : 18, peopleK, ts: sol.ts, boardOnly: true});
  // column texts under the lens: hidden while it is open
  const underLens = col.filter(q => hit(q.c.box, lensBox, 2)).map(q => q.name);
  // ---- the changed-datum marker and the note (return): beside the datum tag
  const markR = small * 0.75;
  const tb = tagAfter ? tagAfter.box : {x: src.x + src.w, y: src.y, w: 0, h: 0};
  // (the marker beside the datum tag: on its left, or on its right when the left is taken)
  const mkBox = q => ({x: q.x - markR, y: q.y - markR, w: 2 * markR, h: 2 * markR});
  const markerL = {x: tb.x - markR - 6, y: tb.y + tb.h / 2}, markerR = {x: tb.x + tb.w + markR + 6, y: tb.y + tb.h / 2};
  const markerAt = occupied.some(z => z !== (tag && tag.box) && hit(mkBox(markerL), z, 2)) && !occupied.some(z => z !== (tag && tag.box) && hit(mkBox(markerR), z, 2)) ? markerR : markerL;
  const noteText = showAll ? [p.contextLabels.marker, p.beforeValue, p.afterValue] : [];
  const labelBoxes = [...chips.map(c => c.box), ...col.map(q => q.c.box), key && key.box, stKey && stKey.box, tag && tag.box].filter(Boolean);
  const truncated = [...chips.map(c => c.fit), ...col.map(q => q.c.fit), key && key.fit, stKey && stKey.fit, tag && tag.fit, tagAfter && tagAfter.fit, ...cardFits.map(c => c.fit)].filter(f => f && f.truncated).map(f => f.full);
  const labelsClear = labelBoxes.every((b2, i) => labelBoxes.every((c, j) => i === j || !hit(b2, c, 1)));
  const headPx = bx.headB.w * pxPer * 0.85;
  const visibleCtx = stacked ? 1 : Math.max(0, Math.min(win.x, PL.board.ox + (stage.ext.x + stage.ext.w) * s) - (PL.board.ox + stage.ext.x * s)) / D.w;
  const lensClearOfFaces = faces.every(f => !hit(lensBox, f, 2));
  // guides join the window to the inspected item only when they cross no face and no label
  const segHits = (a, b2, boxes) => boxes.some(z => Array.from({length: 39}, (_, i) => ({x: a.x + (b2.x - a.x) * (i + 1) / 40, y: a.y + (b2.y - a.y) * (i + 1) / 40})).some(q => q.x > z.x && q.x < z.x + z.w && q.y > z.y && q.y < z.y + z.h));
  const guideObstacles = [...faces, ...labelBoxes.filter(b2 => !col.some(q => underLens.includes(q.name) && q.c.box === b2))];
  const guidesOk = !segHits({x: shown.x + shown.w, y: shown.y}, {x: win.x, y: win.y}, guideObstacles) && !segHits({x: shown.x + shown.w, y: shown.y + shown.h}, {x: win.x, y: win.y + win.h}, guideObstacles);
  return {hidden, showAll, guidesOk, PL, stage, lz, s, G, col, chips, key, stKey, tag, tagAfter, src, shown, win, lensBox, Z, srcC, winC, underLens, markR, markerAt, noteText, cardTs, small,
    faces, labelBoxes, truncated, labelsClear, headPx, visibleCtx, lensClearOfFaces, colX, colW,
    ok: sol.fitted && colFits && Z >= 1.5 && !hit(lensBox, src, -2) && (!tag || (tag.clear && tagAfter.clear)) && !truncated.length && labelsClear && lensClearOfFaces && visibleCtx >= (stacked ? 0 : 0.5) && win.y + lensBox.h <= D.h - 4,
    textPx: r(G.ts * s, 2)};
}

/** A copy of a node tree without the filler-bar marks: the clipped copy's bars are enlarged filler under the window,
 * never under a text (their unclipped boxes would otherwise be taken for bars outside the window). */
function noBars(n) {
  if (!n || typeof n !== 'object') return n;
  if (Array.isArray(n)) return n.map(noBars);
  if (!n.tag) return n;
  const {'data-bar': _b, ...attrs} = n.attrs || {};
  return {...n, attrs, children: (n.children || []).map(noBars)};
}

/** Strike lines through each line of a chip's text (the chip as gchip draws it at (x, y)). */
function strikeLines(ctx, text, x, y, maxW, size, color) {
  const c = gchip(ctx, text, {x, y, anchor: 'start', maxWidth: maxW, size, minSize: size, maxLines: 4});
  const f = c.fit, b = c.box;
  const lh = f.lineHeight || size * 1.2;
  const padY = (b.h - f.lines.length * lh) / 2, padX = (b.w - f.width) / 2;
  return f.lines.map((ln, i) => {
    const w = ctx.measure(String(ln).replace(/\u00a0/g, ' '), size, 700, 'sans');
    const yy = b.y + padY + (i + 0.42) * lh;
    return h('line', {x1: r(b.x + padX), y1: r(yy), x2: r(b.x + padX + w), y2: r(yy), stroke: color, 'stroke-width': 3});
  });
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const font = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";
  const st = (prefix, Lk) => g({transform: `${T(Lk.PL.board.ox, Lk.PL.board.oy)} scale(${r(Lk.s, 5)})`}, prefix);
  const G = L.G;
  const L0 = G.links[0];
  // the after-state overlay of the first thread (dashed marker) and its ◆ glyph, in the context and in the copy
  // (the after state's own style: disputed — the dashed marker over its colour; admitted — a solid line)
  const toDisputed = L0.state === 'admitted';
  const overlay = (name, R0) => g({name, opacity: 0},
    h('path', {d: L0.d, fill: 'none', stroke: toDisputed ? th.accent3 : th.accent2, 'stroke-width': G.ts * 0.22, 'stroke-linecap': 'round'}),
    toDisputed ? h('path', {d: L0.d, fill: 'none', stroke: th.paper, 'stroke-width': G.ts * 0.12, 'stroke-dasharray': '12 8'}) : null,
    stateBadge(ctx, {name: `${name}-glyph`, state: L0.state === 'admitted' ? 'disputed' : 'admitted', x: L0.badge.x, y: L0.badge.y, R: G.ts * 0.42, opacity: 1}));
  const ctxStage = g({name: 'ctx-stage'}, st(g(null, L.stage.node, overlay('ctx-after', G.ts)), L));
  // the lens: window + card, a clipped copy zoomed about the source
  const W = L.win;
  const zoomT = `${T(L.winC.x, L.winC.y)} scale(${r(L.Z, 4)}) ${T(-L.srcC.x, -L.srcC.y)}`;
  const clipId = ctx.id('lens-clip');
  const cardY = W.y + W.h;
  const cardText = (name, value, color) => g({name, opacity: 0}, gchip(ctx, value, {x: W.x + L.small * 0.5, y: cardY + L.small * 0.45, anchor: 'start', maxWidth: W.cardWrapW, size: L.cardTs, minSize: L.cardTs, maxLines: 4, fill: 'none', stroke: 'none', color, weight: 700}).node);
  const lens = g({name: 'lens-win', opacity: 0, 'data-occludes': 1},
    h('defs', null, h('clipPath', {id: clipId}, h('rect', {name: 'lens-cliprect', x: r(W.x), y: r(W.y), width: r(W.w), height: r(W.h)}))),
    h('path', {name: 'lens-bg', d: roundRectPath(W.x, W.y, W.w, W.h + W.cardH, 14), fill: th.card, stroke: th.ink, 'stroke-width': 3}),
    g({'clip-path': ctx.ref('lens-clip')},
      g({name: 'lens-content', opacity: 0},
        h('rect', {x: r(W.x), y: r(W.y), width: r(W.w), height: r(W.h), fill: '#efe3cf'}),
        g({name: 'lens-zoom', transform: zoomT}, st(g(null, noBars(L.lz.node), overlay('lz-after', G.ts)), L)))),
    L.showAll && h('path', {d: `M${r(W.x)} ${r(cardY)}H${r(W.x + W.w)}`, stroke: th.ink, 'stroke-width': 2}),
    // (the datum card is label text: drawn only with labels shown)
    L.showAll && cardText('val-old', ctx.params.beforeValue, th.ink),
    L.showAll && g({name: 'val-strike', opacity: 0}, strikeLines(ctx, ctx.params.beforeValue, W.x + L.small * 0.5, cardY + L.small * 0.45, W.cardWrapW, L.cardTs, th.inkSoft)),
    L.showAll && cardText('val-new', ctx.params.afterValue, th.ink),
  );
  // guides from the source corners to the window
  const guides = g({name: 'lens-guides', opacity: 0},
    h('rect', {name: 'lens-src', x: r(L.shown.x), y: r(L.shown.y), width: r(L.shown.w), height: r(L.shown.h), rx: 6, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '8 6'}),
    L.guidesOk && h('line', {name: 'lens-coneA', x1: r(L.shown.x + L.shown.w), y1: r(L.shown.y), x2: r(W.x), y2: r(W.y), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '6 8'}),
    L.guidesOk && h('line', {name: 'lens-coneB', x1: r(L.shown.x + L.shown.w), y1: r(L.shown.y + L.shown.h), x2: r(W.x), y2: r(W.y + W.h), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '6 8'}));
  return g(null,
    g({name: 'ctx'}, ctxStage, L.chips.map(c => c.node),
      // (a struck value: the chip and its strike line in one named group, the line being the text's own decoration)
      L.col.map(q => g({name: `colg-${q.name}`, opacity: q.late ? 0 : 1}, q.strike ? g({name: `col-${q.name}`}, q.c.node, h('line', {x1: r(q.c.box.x + L.small * 0.5), y1: r(q.c.box.y + q.c.box.h / 2), x2: r(q.c.box.x + q.c.box.w - L.small * 0.5), y2: r(q.c.box.y + q.c.box.h / 2), stroke: th.inkSoft, 'stroke-width': 2.5})) : q.c.node)),
      L.tag && g({name: 'tag-datum-g'}, L.tag.node),
      L.tagAfter && g({name: 'tag-datum2-g', opacity: 0}, L.tagAfter.node),
      L.stKey && L.stKey.node, L.key && L.key.node),
    guides,
    lens,
    L.tagAfter && changedMarker(ctx, {name: 'marker', x: L.markerAt.x, y: L.markerAt.y, radius: L.markR, opacity: 0}),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const nodes = {};
  // the context: the final state of the story (every thread pinned, the day marked)
  const v = choreo(1, L.G);
  // (the copy is the board alone: only its threads and glyphs are posed)
  Object.assign(nodes, L.stage.pose(v).nodes, Object.fromEntries(Object.entries(L.lz.pose(v).nodes).filter(([k]) => /^lz-(lk|bd)/.test(k))));
  // the context's tags start as the story leaves them (the posed badges are visible)
  const open = ease.inOutCubic(seg(u, ...W_.open));
  const close = ease.inOutCubic(seg(u, ...W_.close));
  const lensP = open * (1 - close);
  const lensVis = u >= W_.open[0] && u <= W_.close[1];
  const dim = 1 - (1 - DIM) * lensP;
  nodes.ctx = {opacity: r(dim, 3)};
  // the window grows about its own centre; the copy and the card's old value arrive with it (from ~40 % open)
  const sc = 0.3 + 0.7 * lensP;
  // (the window shows only while its copy is arriving or legible: no bare card)
  nodes['lens-win'] = {opacity: r(lensVis ? Math.min(clamp((lensP - 0.3) / 0.15), 1 - seg(u, 0.67, 0.685)) : 0, 3), transform: `${T(L.winC.x, L.winC.y + L.win.cardH / 2)} scale(${r(sc, 4)}) ${T(-L.winC.x, -(L.winC.y + L.win.cardH / 2))}`};
  const copyIn = clamp((open - 0.33) / 0.15);
  const textOut = 1 - seg(u, ...W_.textOut);
  nodes['lens-content'] = {opacity: r(copyIn * textOut, 3)};
  nodes['lens-guides'] = {opacity: r(copyIn * textOut, 3)};
  // substitution inside the lens only
  const strike = seg(u, ...W_.strike);
  const geo = ease.inOutCubic(seg(u, ...W_.geo));
  const oldOut = 1 - seg(u, ...W_.oldOut);
  const newIn = seg(u, ...W_.newText);
  if (L.showAll) {
    nodes['val-old'] = {opacity: r(copyIn * oldOut * textOut, 3)};
    nodes['val-strike'] = {opacity: r(strike * oldOut * textOut, 3)};
    nodes['val-new'] = {opacity: r(newIn * textOut, 3)};
  }
  nodes['lz-after'] = {opacity: r(geo, 3)};
  // (an admitted after state drops the before state's dashed marker)
  if (L.G.links[0].state === 'disputed') { nodes['lz-lk0-dash'] = {opacity: r(1 - geo, 3)}; }
  nodes['lz-bd0'] = {opacity: r(1 - geo, 3)};
  // the context's datum (the tag) leaves just before the lens copy is legible and returns just after it goes
  const hide = seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn));
  const ctxGeo = ease.inOutCubic(seg(u, ...W_.ctxGeo));
  // (placeTag draws its tag hidden: the tag itself is shown, inside its group)
  if (L.tag) { nodes['tag-datum-g'] = {opacity: r((1 - hide) * (1 - ctxGeo), 3)}; nodes['tag-datum'] = {opacity: 1}; }
  if (L.tagAfter) { nodes['tag-datum2-g'] = {opacity: r(seg(u, ...W_.tagIn), 3)}; nodes['tag-datum2'] = {opacity: 1}; }
  // (the context glyph is the datum too: hidden while the lens holds its copy; after the return it is the after glyph)
  nodes['st-bd0'] = {opacity: r((1 - hide) * (1 - ctxGeo), 3)};
  nodes['ctx-after'] = {opacity: r(ctxGeo, 3)};
  if (L.G.links[0].state === 'disputed') nodes['st-lk0-dash'] = {opacity: r(1 - ctxGeo, 3)};
  const lateP = seg(u, ...W_.marker);
  // (the column texts under the window leave before it shows and come back once it has gone)
  const colHide = seg(u, 0.185, 0.2) * (1 - seg(u, W_.close[1], W_.close[1] + 0.01));
  L.col.forEach(q => { const base = q.late ? lateP : 1; nodes[`colg-${q.name}`] = {opacity: r(base * (L.underLens.includes(q.name) ? 1 - colHide : 1), 3)}; });
  const markerP = seg(u, ...W_.marker);
  if (L.tagAfter) nodes.marker = {opacity: r(markerP, 3)};
  const lensDatum = geo > 0 ? 'after' : 'before';
  const ctxDatum = ctxGeo > 0 ? 'after' : 'before';
  const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
  return {
    nodes,
    semantic: {
      beat, lensOpen: r(lensP, 3), zoom: r(L.Z, 3), datum: lensDatum, contextDatum: ctxDatum, focusTarget: p.focusTarget,
      oldShown: r(copyIn * oldOut * textOut, 3), newShown: r(newIn * textOut, 3), strike: r(strike, 3), contextDim: r(dim, 3), contextScale: 1,
      markerShown: r(markerP, 3), tagAfter: r(seg(u, ...W_.tagIn), 3), allReached: true,
      lensClearOfFaces: L.lensClearOfFaces, visibleContext: r(L.visibleCtx, 3), lensBox: {x: r(L.lensBox.x), y: r(L.lensBox.y), w: r(L.lensBox.w), h: r(L.lensBox.h)},
      source: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)}, statesCtx: [ctxGeo > 0 ? after(L.G.links[0]).state : L.G.links[0].state, ...L.G.links.slice(1).map(l => l.state)],
      truncated: L.truncated, labelsClear: L.labelsClear, headPx: r(L.headPx, 1), textPx: L.textPx,
      faces: L.faces.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !hit(b, f, 0))),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-05-inspect',
    title: 'Structured response — a lens on the first section’s thread: its supplied state changes from admitted to disputed',
    titleEs: 'Contestación estructurada — Inspección de detalle',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Contestación estructurada',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The state produced by the story — every section of the structured response linked by its thread to the allegation it answers, each with its supplied state glyph — with the supplied texts in a column. A lens opens beside the first section’s thread: a real enlarged copy of the scene at the same coordinates, with a datum card. Inside the lens only the supplied state changes — the thread takes the dashed marker and its glyph turns from ● to ◆ — then the context takes the same change, with a Δ changed-datum marker. Seeking back restores the old datum. No effect of admitting or disputing, burden, consequence or outcome is shown.',
    tags: ['structured response', 'inspect', 'lens', 'admitted fact', 'disputed fact', 'thread', 'datum change', 'pin board', 'calendar'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/contestacion-estructurada.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
