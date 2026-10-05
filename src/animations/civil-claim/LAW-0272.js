/**
 * LAW-0272 — Acumulación de pretensiones · inspect
 *
 * Storyboard (context = the state produced by the story: on the case file's easel every claim folder stands in its own
 * slot, each with its own label; the supplied configuration is drawn round them — by default joint handling (●): one
 * jacket frame and one spine round all of them — and named on the plate; the calendar marks the supplied day; Party A and
 * Party B stand at the ends. The compact props print no text; the supplied texts are in a text column beside the scene
 * (under it on tall frames). The context keeps its place and full size the whole time; while the lens is open it dims in
 * place):
 *  0.00–0.20  context: the scene, the name chips, the column, the single editorial caption, the datum tag on the
 *             plate ("● Joint handling (as supplied)") and the keys.
 *  0.20–0.32  a lens opens beside the board, over the text column: a REAL second copy of the slots column, its folders,
 *             its configuration marks and the plate at the same coordinates, enlarged (zoom >= 1.5×), with a datum card.
 *             While the lens holds its copy, the context's copy of the datum (the tag, the marks, the plate's glyph) is
 *             hidden: one copy at a time.
 *  0.44–0.66  the old value on the card is struck in grey; then only the datum changes inside the lens — the one frame
 *             and spine go, one frame and one clip per folder come (separate folders, ◆) — and the new value appears.
 *             The folders and their labels stay where they are.
 *  0.66–0.72  the card text and the copy fade, the lens closes, the context brightens again.
 *  0.74–1.00  back in context the same change is applied; the datum tag shows the new value; a neutral Δ changed-datum
 *             marker and a note (marker label, struck before value) stay for the hold. Seeking back before 0.44 restores
 *             the old datum exactly. Both configurations are supplied values: no rule, condition, effect or outcome.
 * @module animations/civil-claim/LAW-0272
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
  AP_DEFAULTS, AP_DEFAULTS_ES, AP_COMMON_ES, AP_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, solveStage, placeStage, deskStage, choreo, configKeyText, localizeDefaults, hasLone,
} from './kits/acumulacion-pretensiones.js';

const ID = 'LAW-0272';
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
  en: {...AP_STRINGS.en, before: 'Before', after: 'After'},
  es: {...AP_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  focusTarget: oneOf('Detail that is enlarged and substituted: "configuration" (how the claim folders are arranged on the case file — one frame and one spine round all of them, or one frame and one clip each; a value with ◆ or the "separate" caption names separate folders, any other value joint handling)', ['configuration']),
  beforeValue: str('Value shown before the substitution (as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum, as supplied)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens relative to the context (at least 1.5)', 1.5, 4), placement: oneOf('Where the lens sits relative to the scene', ['auto', 'right', 'bottom', 'top'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial annotation)', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  parties: AP_DEFAULTS.parties,
  documents: AP_DEFAULTS.documents,
  stages: AP_DEFAULTS.stages,
  dates: AP_DEFAULTS.dates,
  focusTarget: 'configuration',
  beforeValue: '● Joint handling (as supplied)',
  afterValue: '◆ Separate folders (as supplied)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Each folder keeps its own label', marker: 'Datum changed'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...AP_COMMON_ES,
  beforeValue: '● Tramitación conjunta (aportada)',
  afterValue: '◆ Carpetas separadas (aportadas)',
  contextLabels: {context: 'Cada carpeta conserva su propia etiqueta', marker: 'Dato cambiado'},
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
      for (const colK of {portrait: [null], landscape: [0.32, 0.36], square: [0.4, 0.44, 0.48]}[ctx.view.shape]) for (const pk of [2.4, 2, 1.6, 1.4, 1.2, 1]) {
        const q = compose(ctx, Math.max(k, floorK), colK, pk);
        if (!L || (q.ok && !L.ok) || (q.ok === L.ok && q.figPx > L.figPx)) L = q;
      }
      if (L.ok) break;
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** The configuration a value names: separate folders when it carries ◆ or the "separate" caption, else joint handling. */
function stateOf(value, p) {
  const v = String(value || '');
  return v.includes('◆') || (p.stages.separate && v.includes(p.stages.separate)) ? 'separate' : 'joint';
}

/** The before / after configurations: as the values name them; the after state differs from the before state. */
function statesOf(p) {
  const before = stateOf(p.beforeValue, p);
  return {before, after: before === 'joint' ? 'separate' : 'joint'};
}

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
  const dd = statesOf(p);
  // (the props' labels are not fields of this item: the locale's defaults)
  const sp = {...p, labels: (p.locale === 'es' ? AP_DEFAULTS_ES : AP_DEFAULTS).labels};
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
    ...d.claims.map((x, i) => ({name: `cl${i}`, text: x})),
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
  const chipMax = availW * 0.46;
  const probe = showKey ? [0, 1].map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 14 : 6;
  // (the lens's short side >= 0.37 of the frame's short side, in design units)
  const lensMin = 0.37 * Math.min(ctx.view.width, ctx.view.height) / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const below = stacked && !hidden ? Math.max(colH, lensMin + small * 4.5) + 12 : 0;
  // (tall frames with labels hidden: the lens opens over the wall above the scene)
  const above = stacked && hidden ? Math.max(lensMin, 0.4 * (D.h - bandY)) + 16 : 0;
  const top0 = bandY + above;
  // (square: the wall ends just past the people — a narrower room, so the people are larger)
  const tightX = shape === 'square' ? -Math.round(46 * 1.3 * peopleK) : 0;
  const opts = {prefix: 'st', p: sp, looks, showText: false, compact: true, lwK: shape === 'landscape' ? 8 : 10, peopleK, compactTs: 20 * Math.max(1, peopleK * 0.8), wallExtraL: tightX, wallExtraX: tightX};
  const sol = solveStage(ctx, {B, availW, availH: D.h - top0 - chipBand - 8 - below, opts, scMin: 0.2});
  let stage = sol.stage;
  const s = sol.s;
  const PL = placeStage(sol, {x0: 8, top0, availW, bottom: D.h - 4 - below, chipBand});
  if (stacked && !hidden) {
    // (tall frames: the wall rises to the top band — the context fills the height above the column and the lens)
    const topY = PL.oy + stage.ext.y * s;
    if (topY - bandY > 2) stage = deskStage(ctx, {...opts, ts: sol.ts, wallExtra: Math.round((topY - bandY) / s)});
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
  const occupied = [bx.personA, bx.personB, bx.board, bx.cal, bx.rack, ...bx.plates, ...col.map(q => q.c.box)];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  // ---- name chips under each party (pushed apart when they would touch)
  const chips = [];
  if (showKey) {
    const xs = [M({x: G.xA, y: 0}).x, M({x: G.xB, y: 0}).x].map((x, i) => clamp(x, 8 + probe[i].box.w / 2, 8 + availW - probe[i].box.w / 2));
    const over = xs[0] + probe[0].box.w / 2 + 10 - (xs[1] - probe[1].box.w / 2);
    if (over > 0) { xs[0] = Math.max(8 + probe[0].box.w / 2, xs[0] - over / 2); xs[1] = xs[0] + probe[0].box.w / 2 + 10 + probe[1].box.w / 2; }
    [0, 1].forEach(i => {
      const c = gchip(ctx, capOf(i), {x: xs[i], y: PL.floor + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${i ? 'b' : 'a'}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  // ---- the inspected region: the slots column with every folder, the configuration marks and the plate — wholly inside
  // the window
  const rc = bx.rowPanel;
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
    const occ0 = [...occupied, {x: src.x, y: src.y, w: src.w, h: src.h}, bx.headA, bx.headB];
    const mk = (name, text, anchor) => placeTag(ctx, {name, text, anchor, occupied: occ0, bounds: {x: 6, y: 6, w: D.w - 12, h: D.h - 12}, maxWidth: Math.min(440, D.w * 0.4), size: small, color: th.inkSoft, maxLead: 38 / pxPer, narrow: true});
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
  const faces = [bx.headA, bx.headB];
  let cardTs = small * CARD_K;
  const cardFits = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: 10000, size: cardTs, minSize: cardTs, maxLines: 3}));
  const zoomIn = clamp(p.detailGeometry.zoom, 1.5, 4);
  let win;
  {
    const minSide = Math.max(lensMin, 1);
    const maxW = stacked ? D.w - 16 : Math.max(colW, minSide);
    const wW = clamp(Math.max(minSide, src.w * Math.max(1.5, zoomIn)), minSide, maxW);
    const cardWrapW = wW - small;
    const cardProbe = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: cardWrapW, size: cardTs, minSize: cardTs, maxLines: 6}));
    const cardH = hidden ? 0 : Math.max(...cardProbe.map(c => c.box.h)) * 1.15 + small * 1.2;
    const maxH = (stacked ? (hidden ? above - 8 : D.h - 8 - (colY - 4)) : D.h - 8 - bandY) - cardH;
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
    for (let k = CARD_K; k >= 1.6 - 1e-9; k -= 0.02) {
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
    const c2 = gchip(ctx, capOf(i), {x: c.box.x + c.box.w / 2 - over, y: PL.floor + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${i ? 'b' : 'a'}`});
    if (c2.box.x < 8 || chips.some((o, j) => j !== i && hit(c2.box, o.box, 4))) return;
    const k = occupied.indexOf(c.box);
    if (k >= 0) occupied[k] = c2.box;
    chips[i] = c2;
  });
  // the lens copy: the slots column, its folders, marks and plate of a second stage at the context's coordinates (a
  // separate set of names)
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
  const mkObst = [...occupied.filter(z => z !== (tag && tag.box)), grow(bx.headA, 1 / 3), grow(bx.headB, 1 / 3), widen(bx.personA), widen(bx.personB)];
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
  const visibleCtx = stacked ? 1 : Math.max(0, Math.min(win.x, PL.ox + (stage.ext.x + stage.ext.w) * s) - (PL.ox + stage.ext.x * s)) / D.w;
  const lensClearOfFaces = faces.every(f => !hit(lensBox, f, 2));
  const segHits = (a, b2, boxes) => boxes.some(z => Array.from({length: 39}, (_, i) => ({x: a.x + (b2.x - a.x) * (i + 1) / 40, y: a.y + (b2.y - a.y) * (i + 1) / 40})).some(q => q.x > z.x && q.x < z.x + z.w && q.y > z.y && q.y < z.y + z.h));
  // (the frame's edges cross no head (widened by 4 units all round), label or key — the datum tag is hidden while it is
  // shown)
  const pad4 = z => ({x: z.x - 4, y: z.y - 4, w: z.w + 8, h: z.h + 8});
  const frameObst = [pad4(bx.headA), pad4(bx.headB), ...labelBoxes.filter(b2 => b2 !== (tag && tag.box))];
  const edges = [[{x: shown.x, y: shown.y}, {x: shown.x + shown.w, y: shown.y}], [{x: shown.x + shown.w, y: shown.y}, {x: shown.x + shown.w, y: shown.y + shown.h}], [{x: shown.x, y: shown.y + shown.h}, {x: shown.x + shown.w, y: shown.y + shown.h}], [{x: shown.x, y: shown.y}, {x: shown.x, y: shown.y + shown.h}]];
  const frameClear = !edges.some(([a, b2]) => segHits(a, b2, frameObst));
  return {pk: peopleK, hidden, showAll, PL, stage, lz, s, G, col, chips, key, stKey, tag, tagAfter, src, shown, win, lensBox, Z, srcC, winC, underLens, markR, markerAt, markerClear, frameClear, cardTs, cardLone, small, dd,
    faces, labelBoxes, truncated, labelsClear, figPx, visibleCtx, lensClearOfFaces, colX, colW,
    ok: sol.fitted && colFits && !cardLone && Z >= 1.62 && !hit(lensBox, src, -2) && (!tag || (tag.clear && tagAfter.clear)) && !truncated.length && labelsClear && lensClearOfFaces && visibleCtx >= (stacked ? 0 : 0.5) && win.y + lensBox.h <= D.h - 4,
    textPx: r(G.ts * s, 2)};
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
  // the context: the final state of the story (every folder in its slot, the day marked); the configuration as supplied
  const v = choreo(1, L.G);
  const both = (oldP, newP) => (L.dd.before === 'joint' ? {jointP: oldP, sepP: newP} : {jointP: newP, sepP: oldP});
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
  // (inside the lens the old marks go first, then the new ones come: never both at once)
  Object.assign(nodes, Object.fromEntries(Object.entries(L.lz.pose({...v, ...both(1 - seg(geo, 0, 0.5), seg(geo, 0.5, 1))}).nodes).filter(([k]) => /^lz-(f\d+-g|mj|ms|pj|ps)$/.test(k))));
  const hide = seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn));
  // the context takes the change while it is hidden under the lens (after the lens's own change): as the window goes it
  // comes back already in the new state — the old state never returns
  const switched = u >= W_.geo[1];
  if (L.tag) { nodes['tag-datum-g'] = {opacity: r(1 - seg(u, ...W_.hideOut), 3)}; nodes['tag-datum'] = {opacity: 1}; }
  if (L.tagAfter) { nodes['tag-datum2-g'] = {opacity: r(switched ? 1 - hide : 0, 3)}; nodes['tag-datum2'] = {opacity: 1}; }
  // (the context's marks and the plate's glyph are the datum too: hidden while the lens holds its copy, then changed)
  const ctxVis = 1 - hide;
  const ctxP = both(switched ? 0 : ctxVis, switched ? ctxVis : 0);
  Object.assign(nodes, L.stage.pose({...v, ...ctxP}).nodes);
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
      configCtx: switched ? L.dd.after : L.dd.before, ctxShown: r(ctxVis, 3), configLens: stateAt(geo), states: L.dd, ctxMarks: r(Math.max(ctxP.jointP, ctxP.sepP), 3), ctxBoth: ctxP.jointP > 0 && ctxP.sepP > 0,
      slotted: v.slotted, folders: L.G.n, oldShown: r(copyIn * oldOut * textOut, 3), newShown: r(newIn * textOut, 3), strike: r(strike, 3), contextDim: r(dim, 3), contextScale: 1,
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
    slug: 'civil-claim-08-inspect',
    title: 'Accumulation of claims (illustrative) — a lens on the case file’s slots: the supplied configuration changes, every folder keeps its own label',
    titleEs: 'Acumulación de pretensiones — Inspección y cambio de un dato',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Acumulación de pretensiones',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The state produced by the story — every claim folder in its own slot on the case file, each with its own label, inside the supplied configuration (by default joint handling, ●: one jacket frame and one spine round all of them), the calendar marking the supplied day — with the supplied texts in a column. A lens opens beside the board: a real enlarged copy of the slots column, its folders, marks and plate at the same coordinates, with a datum card; while it holds the datum the context copy is hidden. Inside the lens only the configuration changes — one frame and one clip per folder (separate folders, ◆); the folders and their labels stay where they are — then the context takes the same change, with a Δ changed-datum marker. Seeking back restores the old datum. Both configurations are supplied values: no rule, condition, effect or outcome is shown.',
    tags: ['claims', 'claim folders', 'joint handling', 'separate folders', 'inspect', 'lens', 'case file', 'datum change', 'configuration'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/acumulacion-pretensiones.js', 'src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
