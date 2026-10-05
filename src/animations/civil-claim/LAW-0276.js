/**
 * LAW-0276 — Intervención de tercero · inspect
 *
 * Storyboard (context = the represented relation with the newcomer present: Party C stands beside her tray, which holds
 * her card — the request to intervene, as supplied; on the case file's easel Party A's and Party B's cards stand in their
 * slots inside the supplied configuration — by default the initial relation (●): one frame and one spine round them — and
 * the plate names it; the third slot is empty; the calendar marks the supplied day; Party A and Party B stand at the
 * right. The compact props print no text; the supplied texts are in a text column beside the scene (under it on tall
 * frames). The context keeps its place and full size the whole time; while the lens is open it dims in place):
 *  0.00–0.20  context: the scene, the name chips, the column, the single editorial caption, the datum tag on the plate
 *             ("● Initial relation (as supplied)") and the keys.
 *  0.20–0.32  a lens opens beside the board, over the text column: a REAL second copy of Party C's tray with its card and
 *             bar and of the slots column, its cards, its configuration marks and the plate at the same coordinates,
 *             enlarged (zoom >= 1.5×), with a datum card. While the lens holds its copy, the context's copy of the datum
 *             (the tag, the marks, the plate's glyph and Party C's card) is hidden: one copy at a time.
 *  0.44–0.66  the old value on the card is struck in grey; then only the datum changes inside the lens — the initial
 *             frame goes, Party C's card slides from her tray into the third slot, one frame round all three comes
 *             (intervention requested, ◆) — and the new value appears. Party A's and Party B's cards stay where they are.
 *  0.66–0.72  the card text and the copy fade, the lens closes, the context brightens again — already in the new state.
 *  0.74–1.00  back in context the datum tag shows the new value; a neutral Δ changed-datum marker and a note (marker
 *             label, struck before value) stay for the hold. Seeking back before 0.44 restores the old datum exactly. Both
 *             configurations are supplied values: the request is never shown as granted or refused; no rule, standing
 *             test, effect or outcome.
 * @module animations/civil-claim/LAW-0276
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
  IT_DEFAULTS, IT_DEFAULTS_ES, IT_COMMON_ES, IT_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf3, gchip, keyChip, hit, placeTag, solveStage, placeStage, deskStage, choreo, configKeyText, localizeDefaults, hasLone, cardTexts,
} from './kits/intervencion-tercero.js';

const ID = 'LAW-0276';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_ = {
  open: [0.2, 0.32], strike: [0.44, 0.49], geo: [0.5, 0.56], oldOut: [0.545, 0.56], newText: [0.552, 0.577],
  textOut: [0.66, 0.68], close: [0.675, 0.72], marker: [0.82, 0.88],
  // (in step with the lens: the context's datum tag and the column texts under the window leave just before the window
  // and its copy appear and come back just after they go)
  hideOut: [0.236, 0.247], hideIn: [0.681, 0.69],
  // (the column texts under the window: back from the frame after the window's last visible frame, 0.685)
  colIn: [0.686, 0.696],
};
/** how far the context dims in place while the lens is open */
const DIM = 0.6;
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** the card's text size over the context's text size: the magnification on text */
const CARD_K = 1.7;

const STRINGS = {
  en: {...IT_STRINGS.en, before: 'Before', after: 'After'},
  es: {...IT_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  focusTarget: oneOf('Detail that is enlarged and substituted: "configuration" (the configuration of the represented relation — Party C\'s card in her tray with one frame round Party A\'s and Party B\'s cards, or her card in the third slot with one frame round all three; a value with ◆ or the "requested" caption names the intervention requested, any other value the initial relation)', ['configuration']),
  beforeValue: str('Value shown before the substitution (as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum, as supplied)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens relative to the context (at least 1.5)', 1.5, 4), placement: oneOf('Where the lens sits relative to the scene', ['auto', 'right', 'bottom', 'top'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial annotation)', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  parties: IT_DEFAULTS.parties,
  documents: IT_DEFAULTS.documents,
  stages: IT_DEFAULTS.stages,
  dates: IT_DEFAULTS.dates,
  focusTarget: 'configuration',
  beforeValue: '● Initial relation (as supplied)',
  afterValue: '◆ Intervention requested (as supplied)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'The represented relation, as supplied', marker: 'Datum changed'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...IT_COMMON_ES,
  beforeValue: '● Relación inicial (aportada)',
  afterValue: '◆ Intervención solicitada (aportada)',
  contextLabels: {context: 'La relación representada (según lo aportado)', marker: 'Dato cambiado'},
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
      // (the calendar hangs high above the tray and the board — larger people; when that leaves the datum tag no clear
      // spot beside the plate, it hangs high above Party A and Party B, then beside the board)
      for (const calHigh of [true, 'right', false]) {
        if (L && L.ok) break;
        for (const colK of {portrait: [null], landscape: [0.32, 0.36], square: [0.4, 0.44, 0.48]}[ctx.view.shape]) for (const pk of [2.4, 2, 1.6, 1.4, 1.2, 1]) {
          const q = compose(ctx, Math.max(k, floorK), colK, pk, calHigh);
          if (!L || (q.ok && !L.ok) || (q.ok === L.ok && q.figPx > L.figPx)) L = q;
        }
      }
      if (L.ok) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** The configuration a value names: the intervention requested when it carries ◆ or the "requested" caption, else the
 * initial relation. */
function stateOf(value, p) {
  const v = String(value || '');
  return v.includes('◆') || (p.stages.requested && v.includes(p.stages.requested)) ? 'requested' : 'initial';
}

/** The before / after configurations: as the values name them; the after state differs from the before state. */
function statesOf(p) {
  const before = stateOf(p.beforeValue, p);
  return {before, after: before === 'initial' ? 'requested' : 'initial'};
}

function compose(ctx, sizeK, colK, peopleK = 1, calHigh = true) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const small = B * 0.96 * sizeK;
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf3(ctx, p);
  const dd = statesOf(p);
  // (the props' labels are not fields of this item: the locale's defaults)
  const sp = {...p, labels: (p.locale === 'es' ? IT_DEFAULTS_ES : IT_DEFAULTS).labels};
  // ---- top band: the claim key and the "as supplied" key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
  const stKey = showKey ? gchip(ctx, configKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  const bandY = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
  // ---- the text column (right; under the scene on tall frames): the caption, then the texts the compact props do
  // not print
  const stacked = shape === 'portrait';
  // (labels hidden: no column — the lens's room is wall, on the right, or above the scene on tall frames)
  const hidden = !showAll;
  const colW = stacked ? D.w - 16 : Math.round(D.w * colK);
  const d = p.documents;
  const colTexts = showAll ? [
    {name: 'caption', text: p.contextLabels.context, weight: 700, stroke: th.ink},
    {name: 'cf', text: `${d.caseFile.ref} · ${d.caseFile.title}`, weight: 700},
    ...cardTexts(p).map((x, i) => ({name: `cl${i}`, text: x})),
    {name: 'trays', text: sp.labels.trays},
    {name: 'cal', text: `${sp.labels.calendar}: ${p.dates.window.join(' · ')}`},
    // (the return's note: the marker label and the struck before value — the after value is on the datum tag — hidden
    // until the marker)
    {name: 'note-m', text: `Δ ${p.contextLabels.marker}`, weight: 700, stroke: th.accent2, late: true},
    {name: 'note-b', text: `${ctx.t.before}: ${p.beforeValue}`, late: true, strike: true},
  ] : [];
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
  // (three name chips side by side under the floor: the widest that leaves no one-word line and still fits)
  const IDX = [0, 1, 2];
  const chipAt = mw => IDX.map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: small, minSize: small, maxLines: 6}));
  let chipMax = (availW - 20) / 3, probe = showKey ? chipAt(chipMax) : [], twoRows = false;
  if (showKey) {
    let found = false;
    for (const f of [0.46, 0.4, 0.36]) {
      const mw = availW * f, pr = chipAt(mw);
      if (pr.reduce((a2, c) => a2 + c.box.w, 0) + 20 <= availW && !pr.some(c => hasLone(c.fit) || c.fit.truncated)) { chipMax = mw; probe = pr; found = true; break; }
    }
    // (long captions: Party A's chip takes a second row, as wide as the scene — Party C's and Party B's stay side by side)
    if (!found) { twoRows = true; chipMax = (availW - 10) / 2; probe = chipAt(chipMax); probe[0] = gchip(ctx, capOf(0), {x: 0, y: 0, anchor: 'middle', maxWidth: availW - 10, size: small, minSize: small, maxLines: 6}); }
  }
  const row2 = twoRows ? Math.max(probe[1].box.h, probe[2].box.h) + 6 : 0;
  const chipBand = !probe.length ? 6 : twoRows ? row2 + probe[0].box.h + 14 : Math.max(...probe.map(c => c.box.h)) + 14;
  // (the lens's short side >= 0.37 of the frame's short side, in design units)
  const lensMin = 0.37 * Math.min(ctx.view.width, ctx.view.height) / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const below = stacked && !hidden ? Math.max(colH, lensMin + small * 4.5) + 12 : 0;
  // (tall frames with labels hidden: the lens opens over the wall above the scene)
  const above = stacked && hidden ? Math.max(lensMin, 0.4 * (D.h - bandY)) + 16 : 0;
  const top0 = bandY + above;
  // (square: the wall ends just past the people — a narrower room, so the people are larger)
  const tightX = shape === 'square' ? -Math.round(46 * 1.3 * peopleK) : 0;
  // (the calendar hangs high on the wall above the tray and the board: a narrower room, larger people)
  const opts = {prefix: 'st', p: sp, looks, showText: false, compact: true, lwK: shape === 'landscape' ? 8 : 10, peopleK, compactTs: 20 * Math.max(1, peopleK * 0.8), wallExtraL: tightX, wallExtraX: tightX, calHigh};
  const sol = solveStage(ctx, {B, availW, availH: D.h - top0 - chipBand - 8 - below, opts, scMin: 0.2});
  let stage = sol.stage;
  const s = sol.s;
  const PL = placeStage(sol, {x0: 8, top0, availW, bottom: D.h - 4 - below, chipBand});
  if (stacked && !hidden) {
    // (tall frames: the wall rises to the top band — the context fills the height above the column and the lens)
    const topY = PL.oy + stage.ext.y * s;
    if (topY - bandY > 2) stage = deskStage(ctx, {...opts, ts: sol.ts, wallExtra: Math.round((topY - bandY) / s)});
  }
  if (!stacked && !hidden) {
    // (wide frames: the room's wall runs out to the left edge and to the column — the context fills its share of the
    // width, no bare margin beside a narrower room)
    const E0 = stage.ext;
    const left = PL.ox + E0.x * s - 8, right = (D.w - 8 - colW - 20) - (PL.ox + (E0.x + E0.w) * s);
    if (left > 2 || right > 2) stage = deskStage(ctx, {...opts, ts: sol.ts, wallExtraL: tightX + Math.max(0, Math.round(left / s)), wallExtraX: tightX + Math.max(0, Math.round(right / s))});
  }
  if (hidden) {
    // (the room fills the box: its wall runs to the right edge — or up to the top band on tall frames — where the lens
    // opens over bare wall)
    const E0 = stage.ext;
    const right = PL.ox + (E0.x + E0.w) * s, topY = PL.oy + E0.y * s;
    stage = deskStage(ctx, {...opts, ts: sol.ts, wallExtraX: tightX + (stacked ? 0 : Math.max(0, Math.round((D.w - 8 - right) / s))), wallExtra: Math.max(0, Math.round((topY - bandY) / s))});
  }
  const {M} = PL;
  const G = stage.G;
  const bx = PL.boxes;
  const colX = stacked ? 8 : D.w - 8 - colW;
  const colY = stacked ? PL.floor + chipBand + 8 : bandY;
  const col = mkCol(colX, colY);
  const colFits = !col.length || col.at(-1).c.box.y + col.at(-1).c.box.h <= D.h - 6;
  const occupied = [bx.personA, bx.personB, bx.personC, bx.board, bx.cal, bx.rack, ...bx.plates, ...col.map(q => q.c.box)];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  // ---- name chips under each party (pushed apart when they would touch)
  const chips = [];
  if (showKey) {
    const px = [M({x: G.xA, y: 0}).x, M({x: G.xB, y: 0}).x, M({x: G.xC, y: 0}).x];
    const ws = probe.map(c => c.box.w);
    const xs = twoRows ? (() => { const q = packChips([px[1], px[2]], [ws[1], ws[2]], 8, 8 + availW); return [clamp(px[0], 8 + ws[0] / 2, 8 + availW - ws[0] / 2), q[0], q[1]]; })() : packChips(px, ws, 8, 8 + availW);
    IDX.forEach(i => {
      const c = gchip(ctx, capOf(i), {x: xs[i], y: PL.floor + 8 + (i === 0 ? row2 : 0), anchor: 'middle', maxWidth: twoRows && i === 0 ? availW - 10 : chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${'abc'[i]}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  // ---- the inspected region: Party C's tray with her card and bar, and the slots column with every card, the
  // configuration marks and the plate — wholly inside the window
  const rc = bx.focusPanel;
  const src = {x: rc.x - 10, y: rc.y - 10, w: rc.w + 26, h: rc.h + 24};
  // (what the window frames: a tighter margin round the same pieces, their shadows included — the window keeps its size
  // and place, the pieces are magnified a little more)
  const srcL = {x: rc.x - 6, y: rc.y - 6, w: rc.w + 12, h: rc.h + 14};
  // ---- the context's datum tag beside the configuration plate
  let tag = null, tagAfter = null;
  if (showAll) {
    const pb = bx.plates[1], bd = bx.board;
    // (beside the plate first — under the board, beside it — else above the board)
    const anchors = [{x: bd.x + bd.w / 2, y: bd.y + bd.h + 4}, {x: bd.x + bd.w + 4, y: pb.y + pb.h / 2}, {x: bd.x - 4, y: pb.y + pb.h / 2}, {x: bd.x + bd.w / 2, y: bd.y - 4}, {x: bd.x + bd.w + 4, y: bd.y + 8}, {x: bd.x - 4, y: bd.y + 8}];
    // (the heads widened by a fifth: hair reaches past the round head)
    const g5 = z => ({x: z.x - z.w * 0.2, y: z.y - z.h * 0.2, w: z.w * 1.4, h: z.h * 1.4});
    const occ0 = [...occupied, {x: src.x, y: src.y, w: src.w, h: src.h}, g5(bx.headA), g5(bx.headB), g5(bx.headC)];
    const mk = (name, text, anchor) => placeTag(ctx, {name, text, anchor, occupied: occ0, bounds: {x: 6, y: 6, w: D.w - 12, h: D.h - 12}, maxWidth: Math.min(440, D.w * 0.4), size: small, color: th.inkSoft, maxLead: 38 / pxPer, narrow: true, maxLines: 7});
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
  const faces = [bx.headA, bx.headB, bx.headC];
  let cardTs = small * CARD_K;
  const cardFits = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: 10000, size: cardTs, minSize: cardTs, maxLines: 3}));
  const zoomIn = clamp(p.detailGeometry.zoom, 1.5, 4);
  let win;
  {
    const minSide = Math.max(lensMin, 1);
    const maxW = stacked ? D.w - 16 : Math.max(colW, minSide);
    let wW = clamp(Math.max(minSide, src.w * Math.max(1.5, zoomIn)), minSide, maxW);
    const cardAt = ww => { const pr = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: ww - small, size: cardTs, minSize: cardTs, maxLines: 6})); return {pr, h: hidden ? 0 : Math.max(...pr.map(c => c.box.h)) * 1.15 + small * 1.2}; };
    const roomH = stacked ? (hidden ? above - 8 : D.h - 8 - (colY - 4)) : D.h - 8 - bandY;
    // (tall frames: the window is never taller than the room under the scene — at least 0.6 of its width tall, so the
    // width gives way)
    for (let i = 0; i < 12 && stacked && wW * 0.6 > roomH - cardAt(wW).h && wW > minSide; i++) wW = Math.max(minSide, wW * 0.94);
    const cardWrapW = wW - small;
    const {pr: cardProbe, h: cardH} = cardAt(wW);
    const maxH = roomH - cardH;
    const wH = clamp(Math.max(wW * src.h / src.w, src.h * Math.max(1.5, zoomIn)), Math.max(minSide - cardH, wW * 0.6), Math.max(minSide - cardH, maxH));
    const x = stacked ? clamp(src.x + src.w / 2 - wW / 2, 8, D.w - 8 - wW) : D.w - 8 - wW;
    const totalH = wH + cardH;
    const yMin = stacked ? (hidden ? bandY : colY - 4) : bandY, yMax = stacked && hidden ? bandY : D.h - 8 - totalH;
    const cands = [];
    for (let k = 0; k <= 24; k++) cands.push(lerp(yMin, yMax, k / 24));
    cands.sort((a2, b2) => Math.abs(a2 + totalH / 2 - (src.y + src.h / 2)) - Math.abs(b2 + totalH / 2 - (src.y + src.h / 2)));
    const y = cands.find(yy => faces.every(f => !hit({x, y: yy, w: wW, h: totalH}, f, 6))) ?? cands[0];
    win = {x, y, w: wW, h: wH, cardH, cardWrapW, cardFits: cardProbe.map(c => c.fit)};
  }
  // (the card's text steps down from 1.7× towards 1.6× the context's text — never below — when that keeps a value from
  // wrapping with a one-word line)
  if (showAll) {
    // (then up to 2×, when no size down to 1.6× wraps without a one-word line)
    for (const k of [...Array.from({length: 6}, (_, i) => CARD_K - i * 0.02), ...Array.from({length: 15}, (_, i) => CARD_K + 0.02 * (i + 1))]) {
      const ts2 = small * k;
      if ([p.beforeValue, p.afterValue].every(v => !hasLone(gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: win.cardWrapW, size: ts2, minSize: ts2, maxLines: 6, weight: 700}).fit))) { cardTs = ts2; break; }
    }
  }
  const cardLone = showAll && [p.beforeValue, p.afterValue].some(v => hasLone(gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: win.cardWrapW, size: cardTs, minSize: cardTs, maxLines: 6, weight: 700}).fit));
  // (the zoom that shows the whole region in the window: at most 4×; the layout is refused below 1.5×)
  const Z = Math.min(4, Math.min(win.w / srcL.w, win.h / srcL.h));
  const srcC = {x: srcL.x + srcL.w / 2, y: srcL.y + srcL.h / 2};
  const winC = {x: win.x + win.w / 2, y: win.y + win.h / 2};
  // the source frame: the framed pieces themselves (the lens copy holds only them), so the frame never reaches past what
  // the lens shows into the rest of the scene. No guide lines join it to the window: drawn across the scene they would
  // cut through the framed pieces; the frame and the window share their timing
  const shown = {x: srcL.x, y: srcL.y, w: srcL.w, h: srcL.h};
  const lensBox = {x: win.x, y: win.y, w: win.w, h: win.h + win.cardH};
  // (a name chip the open window would cover at its edge moves left, clear of it, when that keeps it clear of the other)
  chips.forEach((c, i) => {
    const over = c.box.x + c.box.w + 6 - lensBox.x;
    if (over <= 0 || !hit(c.box, lensBox, 6)) return;
    const c2 = gchip(ctx, capOf(i), {x: c.box.x + c.box.w / 2 - over, y: PL.floor + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${'abc'[i]}`});
    if (c2.box.x < 8 || chips.some((o, j) => j !== i && hit(c2.box, o.box, 4))) return;
    const k = occupied.indexOf(c.box);
    if (k >= 0) occupied[k] = c2.box;
    chips[i] = c2;
  });
  // the lens copy: the tray, its card and bar, the slots column, its cards, marks and plate of a second stage at the
  // context's coordinates (a separate set of names)
  const lz = deskStage(ctx, {...opts, prefix: 'lz', ts: sol.ts, boardOnly: 'focus'});
  const underLens = col.filter(q => hit(q.c.box, lensBox, 2)).map(q => q.name);
  // ---- the changed-datum marker beside the datum tag
  const markR = small * 0.75;
  const tb = tagAfter ? tagAfter.box : {x: src.x + src.w, y: src.y, w: 0, h: 0};
  const mkBox = q => ({x: q.x - markR, y: q.y - markR, w: 2 * markR, h: 2 * markR});
  // (beside the tag — at its sides, then at its corners — clear of everything placed and of both figures: each head box
  // widened by a third of its width, since a face and its hair reach past the round head)
  const grow = (z, k) => ({x: z.x - z.w * k, y: z.y - z.h * k, w: z.w * (1 + 2 * k), h: z.h * (1 + 2 * k)});
  // (each figure widened by an eighth of its box each side: the drawn arms and hands reach past it)
  const widen = z => ({x: z.x - z.w * 0.12, y: z.y, w: z.w * 1.24, h: z.h});
  const mkObst = [...occupied.filter(z => z !== (tag && tag.box)), grow(bx.headA, 1 / 3), grow(bx.headB, 1 / 3), grow(bx.headC, 1 / 3), widen(bx.personA), widen(bx.personB), widen(bx.personC)];
  const gapM = markR + 6;
  const markerCands = [
    {x: tb.x - gapM, y: tb.y + tb.h / 2}, {x: tb.x + tb.w + gapM, y: tb.y + tb.h / 2},
    {x: tb.x + tb.w - markR, y: tb.y - gapM}, {x: tb.x + markR, y: tb.y - gapM},
    {x: tb.x + tb.w - markR, y: tb.y + tb.h + gapM}, {x: tb.x + markR, y: tb.y + tb.h + gapM},
    {x: tb.x + tb.w + gapM, y: tb.y - markR}, {x: tb.x - gapM, y: tb.y - markR},
  ].filter(q => q.x - markR >= 6 && q.x + markR <= D.w - 6 && q.y - markR >= 6 && q.y + markR <= D.h - 6);
  const mkClear = q => !mkObst.some(z => hit(mkBox(q), z, 2));
  const markerAt = markerCands.find(mkClear) ?? markerCands[0] ?? {x: tb.x - gapM, y: tb.y + tb.h / 2};
  const markerClear = mkClear(markerAt);
  const labelBoxes = [...chips.map(c => c.box), ...col.map(q => q.c.box), key && key.box, stKey && stKey.box, tag && tag.box].filter(Boolean);
  const truncated = [...chips.map(c => c.fit), ...col.map(q => q.c.fit), key && key.fit, stKey && stKey.fit, tag && tag.fit, tagAfter && tagAfter.fit, ...cardFits.map(c => c.fit), ...(hidden ? [] : win.cardFits)].filter(f => f && f.truncated).map(f => f.full);
  const labelsClear = labelBoxes.every((b2, i) => labelBoxes.every((c, j) => i === j || !hit(b2, c, 1)));
  const figPx = bx.personB.h * pxPer;
  const headPx = Math.min(bx.headA.w, bx.headB.w, bx.headC.w) * 0.86 * pxPer;
  const visibleCtx = stacked ? 1 : Math.max(0, Math.min(win.x, PL.ox + (stage.ext.x + stage.ext.w) * s) - (PL.ox + stage.ext.x * s)) / D.w;
  const lensClearOfFaces = faces.every(f => !hit(lensBox, f, 2));
  const segHits = (a, b2, boxes) => boxes.some(z => Array.from({length: 39}, (_, i) => ({x: a.x + (b2.x - a.x) * (i + 1) / 40, y: a.y + (b2.y - a.y) * (i + 1) / 40})).some(q => q.x > z.x && q.x < z.x + z.w && q.y > z.y && q.y < z.y + z.h));
  // (the frame's edges cross no head (widened by 4 units all round), label or key — the datum tag is hidden while it is
  // shown)
  const pad4 = z => ({x: z.x - 4, y: z.y - 4, w: z.w + 8, h: z.h + 8});
  // (nor any figure: Party C stands beside her tray)
  const frameObst = [pad4(bx.headA), pad4(bx.headB), pad4(bx.headC), bx.personC, bx.personA, ...labelBoxes.filter(b2 => b2 !== (tag && tag.box))];
  const edges = [[{x: shown.x, y: shown.y}, {x: shown.x + shown.w, y: shown.y}], [{x: shown.x + shown.w, y: shown.y}, {x: shown.x + shown.w, y: shown.y + shown.h}], [{x: shown.x, y: shown.y + shown.h}, {x: shown.x + shown.w, y: shown.y + shown.h}], [{x: shown.x, y: shown.y}, {x: shown.x, y: shown.y + shown.h}]];
  const frameClear = !edges.some(([a, b2]) => segHits(a, b2, frameObst));
  return {pk: peopleK, hidden, showAll, PL, stage, lz, s, G, col, chips, key, stKey, tag, tagAfter, src, shown, win, lensBox, Z, srcC, winC, underLens, markR, markerAt, markerClear, frameClear, cardTs, cardLone, small, dd,
    faces, labelBoxes, truncated, labelsClear, figPx, headPx, visibleCtx, lensClearOfFaces, colX, colW,
    ok: sol.fitted && colFits && !cardLone && Z >= 1.62 && !hit(lensBox, src, -2) && (!tag || (tag.clear && tagAfter.clear)) && !truncated.length && labelsClear && lensClearOfFaces && visibleCtx >= (stacked ? 0 : 0.5) && win.y + lensBox.h <= D.h - 4,
    textPx: r(G.ts * s, 2)};
}

/**
 * Centres for name chips of widths ws under the people at xs, inside [lo, hi]: each as near its person as it can be,
 * in the people's order, never touching another (10 units apart).
 */
function packChips(xs, ws, lo, hi) {
  const order = xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b]);
  const c = xs.map((x, i) => clamp(x, lo + ws[i] / 2, hi - ws[i] / 2));
  for (let k = 1; k < order.length; k++) { const i = order[k], j = order[k - 1]; c[i] = Math.max(c[i], c[j] + ws[j] / 2 + 10 + ws[i] / 2); }
  for (let k = order.length - 1; k >= 0; k--) { const i = order[k]; c[i] = Math.min(c[i], k === order.length - 1 ? hi - ws[i] / 2 : c[order[k + 1]] - ws[order[k + 1]] / 2 - 10 - ws[i] / 2); }
  return c;
}

/** A copy of a node tree without the filler-bar marks (the clipped copy's bars are enlarged filler under the window). */
function noBars(n) {
  if (!n || typeof n !== 'object') return n;
  if (Array.isArray(n)) return n.map(noBars);
  if (!n.tag) return n;
  const {'data-bar': _b, ...attrs} = n.attrs || {};
  return {...n, attrs, children: (n.children || []).map(noBars)};
}

/** Strike lines through each line of a chip's text (the chip as gchip draws it at (x, y)). */
function strikeLines(ctx, text, x, y, maxW, size, color) {
  const c = gchip(ctx, text, {x, y, anchor: 'start', maxWidth: maxW, size, minSize: size, maxLines: 6, weight: 700});
  const f = c.fit, b = c.box;
  const lh = f.lineHeight || size * 1.2;
  const padY = (b.h - f.lines.length * lh) / 2;
  // (the chip centres each line: each strike runs under its own line)
  return f.lines.map((ln, i) => {
    const w = ctx.measure(String(ln).replace(/ /g, ' '), size, 700, 'sans');
    const yy = b.y + padY + (i + 0.42) * lh;
    const x0 = b.x + (b.w - w) / 2;
    return h('line', {x1: r(x0), y1: r(yy), x2: r(x0 + w), y2: r(yy), stroke: color, 'stroke-width': 3});
  });
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const st = node => g({transform: `${T(L.PL.ox, L.PL.oy)} scale(${r(L.s, 5)})`}, node);
  const ctxStage = g({name: 'ctx-stage'}, st(L.stage.node));
  const W = L.win;
  const zoomT = `${T(L.winC.x, L.winC.y)} scale(${r(L.Z, 4)}) ${T(-L.srcC.x, -L.srcC.y)}`;
  const clipId = ctx.id('lens-clip');
  const cardY = W.y + W.h;
  const cardText = (name, value, color) => g({name, opacity: 0}, gchip(ctx, value, {x: W.x + L.small * 0.5, y: cardY + L.small * 0.45, anchor: 'start', maxWidth: W.cardWrapW, size: L.cardTs, minSize: L.cardTs, maxLines: 6, fill: 'none', stroke: 'none', color, weight: 700}).node);
  const lens = g({name: 'lens-win', opacity: 0, 'data-occludes': 1},
    h('defs', null, h('clipPath', {id: clipId}, h('rect', {name: 'lens-cliprect', x: r(W.x), y: r(W.y), width: r(W.w), height: r(W.h)}))),
    h('path', {name: 'lens-bg', d: roundRectPath(W.x, W.y, W.w, W.h + W.cardH, 14), fill: th.card, stroke: th.ink, 'stroke-width': 3}),
    g({'clip-path': ctx.ref('lens-clip')},
      g({name: 'lens-content', opacity: 0},
        h('rect', {x: r(W.x), y: r(W.y), width: r(W.w), height: r(W.h), fill: '#efe3cf'}),
        g({name: 'lens-zoom', transform: zoomT}, st(noBars(L.lz.node))))),
    L.showAll && h('path', {d: `M${r(W.x)} ${r(cardY)}H${r(W.x + W.w)}`, stroke: th.ink, 'stroke-width': 2}),
    // (the datum card is label text: drawn only with labels shown)
    L.showAll && cardText('val-old', ctx.params.beforeValue, th.ink),
    L.showAll && g({name: 'val-strike', opacity: 0}, strikeLines(ctx, ctx.params.beforeValue, W.x + L.small * 0.5, cardY + L.small * 0.45, W.cardWrapW, L.cardTs, th.inkSoft)),
    L.showAll && cardText('val-new', ctx.params.afterValue, th.ink),
  );
  const guides = g({name: 'lens-guides', opacity: 0},
    h('rect', {name: 'lens-src', x: r(L.shown.x), y: r(L.shown.y), width: r(L.shown.w), height: r(L.shown.h), rx: 6, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '8 6'}));
  return g(null,
    g({name: 'ctx'}, ctxStage, L.chips.map(c => c.node),
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
  // the context: Party C at rest beside her tray, the day marked; the configuration of the relation as supplied — the
  // initial relation (her card in the tray, one frame round two cards) or the intervention requested (her card in the
  // third slot, one frame round three). No hand pushes: the card's place is the datum
  const v0 = choreo(0, L.G);
  const travel = L.G.travel;
  const inSlot = st => (st === 'requested' ? travel : 0);
  const both = (oldP, newP) => (L.dd.before === 'initial' ? {initP: oldP, reqP: newP} : {initP: newP, reqP: oldP});
  const v = {...v0, markP: 1, barStill: true};
  const open = ease.inOutCubic(seg(u, ...W_.open));
  const close = ease.inOutCubic(seg(u, ...W_.close));
  const lensP = open * (1 - close);
  const lensVis = u >= W_.open[0] && u <= W_.close[1];
  const dim = 1 - (1 - DIM) * lensP;
  nodes.ctx = {opacity: r(dim, 3)};
  const sc = 0.3 + 0.7 * lensP;
  // (the window shows only while its copy is arriving or legible: no bare card)
  nodes['lens-win'] = {opacity: r(lensVis ? Math.min(clamp((lensP - 0.3) / 0.15), 1 - seg(u, 0.67, 0.685)) : 0, 3), transform: `${T(L.winC.x, L.winC.y + L.win.cardH / 2)} scale(${r(sc, 4)}) ${T(-L.winC.x, -(L.winC.y + L.win.cardH / 2))}`};
  const copyIn = clamp((open - 0.33) / 0.15);
  const textOut = 1 - seg(u, ...W_.textOut);
  nodes['lens-content'] = {opacity: r(copyIn * textOut, 3)};
  nodes['lens-guides'] = {opacity: r(copyIn * textOut, 3)};
  // substitution inside the lens only: the mark moves to the alternative day
  const strike = seg(u, ...W_.strike);
  const geo = ease.inOutCubic(seg(u, ...W_.geo));
  const oldOut = 1 - seg(u, ...W_.oldOut);
  const newIn = seg(u, ...W_.newText);
  if (L.showAll) {
    nodes['val-old'] = {opacity: r(copyIn * oldOut * textOut, 3)};
    nodes['val-strike'] = {opacity: r(strike * oldOut * textOut, 3)};
    nodes['val-new'] = {opacity: r(newIn * textOut, 3)};
  }
  // (inside the lens the old marks go first, then Party C's card moves, then the new marks come: never both at once)
  const lensSheet = lerp(inSlot(L.dd.before), inSlot(L.dd.after), ease.inOutCubic(seg(geo, 0.3, 0.72)));
  Object.assign(nodes, Object.fromEntries(Object.entries(L.lz.pose({...v, sheetD: lensSheet, ...both(1 - seg(geo, 0, 0.28), seg(geo, 0.74, 1))}).nodes).filter(([k]) => /^lz-(f\d+-g|mi|mr|pi|pr|bar)$/.test(k))));
  const hide = seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn));
  // the context takes the change while it is hidden under the lens (after the lens's own change): as the window goes it
  // comes back already in the new state — the old state never returns
  const switched = u >= W_.geo[1];
  if (L.tag) { nodes['tag-datum-g'] = {opacity: r(1 - seg(u, ...W_.hideOut), 3)}; nodes['tag-datum'] = {opacity: 1}; }
  if (L.tagAfter) { nodes['tag-datum2-g'] = {opacity: r(switched ? 1 - hide : 0, 3)}; nodes['tag-datum2'] = {opacity: 1}; }
  // (the context's marks, the plate's glyph and Party C's card are the datum too: hidden while the lens holds its copy,
  // then changed)
  const ctxVis = 1 - hide;
  const ctxP = both(switched ? 0 : ctxVis, switched ? ctxVis : 0);
  Object.assign(nodes, L.stage.pose({...v, sheetD: inSlot(switched ? L.dd.after : L.dd.before), cardOp: ctxVis, ...ctxP}).nodes);
  const lateP = seg(u, ...W_.marker);
  // (the column under the window comes back as soon as the window has gone — not after the close)
  const colHide = seg(u, 0.185, 0.2) * (1 - seg(u, ...W_.colIn));
  L.col.forEach(q => { const base = q.late ? lateP : 1; nodes[`colg-${q.name}`] = {opacity: r(base * (L.underLens.includes(q.name) ? 1 - colHide : 1), 3)}; });
  if (L.tagAfter) nodes.marker = {opacity: r(lateP, 3)};
  const lensDatum = geo > 0 ? 'after' : 'before';
  const stateAt = q => (q >= 1 ? L.dd.after : q > 0 ? null : L.dd.before);
  const ctxDatum = switched ? 'after' : 'before';
  const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
  return {
    nodes,
    semantic: {
      beat, lensOpen: r(lensP, 3), zoom: r(L.Z, 3), datum: lensDatum, contextDatum: ctxDatum, focusTarget: p.focusTarget,
      configCtx: switched ? L.dd.after : L.dd.before, ctxShown: r(ctxVis, 3), configLens: stateAt(geo), states: L.dd, ctxMarks: r(Math.max(ctxP.initP, ctxP.reqP), 3), ctxBoth: ctxP.initP > 0 && ctxP.reqP > 0,
      ctxCard: r(inSlot(switched ? L.dd.after : L.dd.before), 2), lensCard: r(lensSheet, 2), travel: r(travel, 2), cards: L.G.n, headPx: r(L.headPx, 1), oldShown: r(copyIn * oldOut * textOut, 3), newShown: r(newIn * textOut, 3), strike: r(strike, 3), contextDim: r(dim, 3), contextScale: 1,
      markerShown: r(lateP, 3), tagAfter: r(switched ? 1 - hide : 0, 3), markerClear: L.tagAfter ? L.markerClear : null, frameClear: L.frameClear,
      lensClearOfFaces: L.lensClearOfFaces, visibleContext: r(L.visibleCtx, 3), lensBox: {x: r(L.lensBox.x), y: r(L.lensBox.y), w: r(L.lensBox.w), h: r(L.lensBox.h)},
      source: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
      layoutOk: L.ok, cardLone: L.cardLone, cardK: r(L.cardTs / L.small, 3), peopleK: L.pk, truncated: L.truncated, labelsClear: L.labelsClear, figPx: r(L.figPx, 1), textPx: L.textPx,
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
    slug: 'civil-claim-09-inspect',
    title: 'Third-party intervention (illustrative) — a lens on Party C’s tray and the case file’s slots: the supplied configuration of the relation changes',
    titleEs: 'Intervención de tercero — Inspección y cambio de un dato',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Intervención de tercero',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The represented relation with the newcomer present — Party C beside her tray, which holds her card (the request to intervene, as supplied); on the case file Party A’s and Party B’s cards in their slots inside the supplied configuration (by default the initial relation, ●: one frame round them); the third slot empty; the calendar marking the supplied day — with the supplied texts in a column. A lens opens beside the board: a real enlarged copy of the tray, the card, the slots column, its marks and plate at the same coordinates, with a datum card; while it holds the datum the context copy is hidden. Inside the lens only the configuration changes — the initial frame goes, Party C’s card slides into the third slot and one frame round all three comes (intervention requested, ◆) — then the context returns already in the new state, with a Δ changed-datum marker. Seeking back restores the old datum. Both configurations are supplied values: the request is never shown as granted or refused; no rule, standing test, effect or outcome is shown.',
    tags: ['third party', 'intervention requested', 'initial relation', 'inspect', 'lens', 'case file', 'tray', 'datum change', 'configuration'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/intervencion-tercero.js', 'src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
