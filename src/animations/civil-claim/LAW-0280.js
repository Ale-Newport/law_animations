/**
 * LAW-0280 — Ordenación de cuestiones · inspect
 *
 * Storyboard (context = the state produced by the grouping: Party A at rest beside her empty tray; on the case file's
 * easel the sorting board — the ● agreed and ◆ open columns, the Subject A row with Issue 1 (●) and Issue 2 (◆), the
 * Subject B row with the third card in the column of its supplied state (by default ● agreed) — one frame round each
 * subject row; the calendar marks the supplied day; Party B stands at the right. The board keeps the geometry of its
 * printed texts but shows them as filler bars at the context's size; the supplied texts are in a text column beside the
 * scene (under it on tall frames). The context keeps its place and full size the whole time; while the lens is open it
 * dims in place):
 *  0.00–0.20  context: the scene, the name chips, the column, the single editorial caption, the datum tag beside the
 *             Subject B row ("● Agreed issue (as supplied)") and the keys.
 *  0.20–0.32  a lens opens beside the board, over the text column: a REAL second copy of the sorting board — its column
 *             headers, both subject rows, every card and the subject frames — at the same coordinates, enlarged
 *             (zoom >= 1.5×) so that its printed texts are legible, with a datum card. While the lens holds its copy,
 *             the context's copy of the datum (the tag and the third card with its glyph) is hidden: one copy at a time.
 *  0.44–0.66  the old value on the card is struck in grey; then only the datum changes inside the lens — the third
 *             card's ● glyph goes, the card slides along the Subject B row into the ◆ column and its ◆ glyph comes — and
 *             the new value appears. Issue 1 and Issue 2 stay where they are.
 *  0.66–0.72  the card text and the copy fade, the lens closes, the context brightens again — already in the new state.
 *  0.74–1.00  back in context the datum tag shows the new value; a neutral Δ changed-datum marker and a note (marker
 *             label, struck before value) stay for the hold. Seeking back before 0.44 restores the old datum exactly.
 *             Both states are supplied values of equal weight: "agreed" only means the supplied list marks the issue as
 *             agreed between the parties; nothing is decided or proven; no procedure, effect or outcome.
 * @module animations/civil-claim/LAW-0280
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
  OC_DEFAULTS, OC_DEFAULTS_ES, OC_COMMON_ES, OC_STRINGS, partiesField, documentsField, datesField, stagesField,
  partyCaption, looksOf2, gchip, keyChip, hit, placeTag, solveStage, placeStage, deskStage, choreo, configKeyText, localizeDefaults, hasLone, cardTexts,
} from './kits/ordenacion-cuestiones.js';

const ID = 'LAW-0280';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_ = {
  open: [0.2, 0.32], strike: [0.44, 0.49], geo: [0.5, 0.56],
  // (the datum card's value is swapped in one cut once the copy's glyph has gone: the struck old value is never shown with
  // the new one — no cross-fade, review r1 — and the card is never left without a value)
  swap: 0.552,
  textOut: [0.66, 0.68], close: [0.675, 0.72], marker: [0.82, 0.88],
  // (in step with the lens: the context's datum tag and the column texts under the window leave just before the window
  // and its copy appear and come back just after they go)
  hideOut: [0.236, 0.247], hideIn: [0.681, 0.69],
  // (the column texts — all of them, the column leaves as one — and, on tall frames, the name chips under the window:
  // back after the window's last visible frame, 0.685)
  colIn: [0.686, 0.696],
};
/** how far the context dims in place while the lens is open */
const DIM = 0.6;
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** the card's text size over the context's text size: the magnification on text */
const CARD_K = 2;
/** the lens's text size (px at 1080p) at the zoom target zt (ZTS, tried in turn): the board's printed texts read in the
 * lens; the context's board is drawn at LENS_TEXT / zt (its texts as filler bars) */
const LENS_TEXT = 20.5;
const ZTS = [3.6, 3.0, 2.5, 2.1];
/** further zoom targets for the portrait arrangement whose lens opens over the lower scene (a larger context board) */
const ZTS_OVER = [1.85, 1.65];

const STRINGS = {
  en: {...OC_STRINGS.en, before: 'Before', after: 'After'},
  es: {...OC_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  focusTarget: oneOf('Detail that is enlarged and substituted: "issueState" (the supplied state of the third issue card, which decides its column in the Subject B row; a value with ◆ or the "open" caption names the open issue, any other value the agreed issue)', ['issueState']),
  beforeValue: str('Value shown before the substitution (as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum, as supplied)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens relative to the context (at least 1.5)', 1.5, 4), placement: oneOf('Where the lens sits relative to the scene', ['auto', 'right', 'bottom', 'top'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial annotation)', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  parties: OC_DEFAULTS.parties,
  documents: OC_DEFAULTS.documents,
  stages: OC_DEFAULTS.stages,
  dates: OC_DEFAULTS.dates,
  focusTarget: 'issueState',
  beforeValue: '● Agreed issue (as supplied)',
  afterValue: '◆ Open issue (as supplied)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'The sorting board, as supplied', marker: 'Datum changed'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...OC_COMMON_ES,
  // (the issue cards' Spanish labels read "(según lo aportado)" here — the motif's other items read "(aportada)": the
  // lens prints the board's cards at the 19.5 px floor beside a context that keeps >= 0.45 of the frame, and a card
  // label "Cuestión 1 (aportada)" only wraps without a one-word line on a single line, which makes the board too wide
  // for that lens at 1:1 — 18.4 px measured; with "(según lo aportado)" it wraps on two lines, 21.6 px)
  documents: {...OC_COMMON_ES.documents, issues: ['Cuestión 1 (según lo aportado)', 'Cuestión 2 (según lo aportado)', 'Cuestión 3 (según lo aportado)']},
  beforeValue: '● Cuestión acordada (según lo aportado)',
  afterValue: '◆ Cuestión por resolver (según lo aportado)',
  contextLabels: {context: 'El tablero de ordenación (según lo aportado)', marker: 'Dato cambiado'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const D = ctx.design;
    const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const floorK = 16.4 / pxPer / (SIZE[ctx.view.shape] * 0.96);
    let L = null;
    const tall = ctx.view.shape === 'portrait';
    // (a layout whose people stand at the civil-claim floors — rendered head box 60 px off 1:1, 55 px at 1:1, with a
    // margin — is taken first; otherwise the ok layout with the larger people)
    const HF = ctx.view.shape === 'square' ? 56 : 61;
    const good = q => q && q.ok && q.headPx >= HF;
    const better = (q, b) => !b || (q.ok && !b.ok) || (q.ok === b.ok && (good(q) && !good(b) || (good(q) === good(b) && q.figPx > b.figPx)));
    // (the lens prints the board's texts >= 19.6 px when it can — the baseline floor — else >= 16.4 px; labels hidden,
    // the lens holds no text. The largest zoom target comes first — the smallest board in the context, the larger
    // people; a smaller one is tried only when the larger one leaves no layout that fits)
    // (portrait: -1 = the stage takes the height down to the column and the lens opens below the board, over the lower
    // scene, the name chips and the column — review r1: a lens room kept free under the scene left 0.2–0.3 of the safe
    // box blank at rest; then the lens room under the scene, 0, 0.12 or 0.24 of the height taller)
    const COLS = {portrait: [-1, 0, 0.12, 0.24], landscape: [0.32, 0.36, 0.4], square: [0.44, 0.48, 0.5, 0.52]}[ctx.view.shape];
    let ztUsed = ZTS[0];
    for (const zt of ZTS) {
      if (L && L.ok) break;
      ztUsed = zt;
      for (const minLens of ctx.show('all') ? [19.6, 16.4] : [0]) {
        if (good(L)) break;
        // (the column's text size does not change what the lens prints: the strict tier tries the full size only)
        tier: for (const k of (minLens > 19 ? [1] : [1, 0.92, 0.85]).filter(k2 => k2 > floorK + 0.03).concat([floorK])) {
          // (square: the column is as wide as the lens, so the lens covers the column and never the scene; tall frames:
          // the room under the scene grows for a taller lens when the lens needs it; the calendar hangs high above the
          // tray and the board — larger people — else high above Party B, then beside the board)
          for (const calHigh of [true, 'right', false]) {
            if (good(L)) break;
            let lensOnly = true;
            for (const colK of COLS) {
              for (const pk of [2.4, 2, 1.6, 1.4, 1.2, 1]) {
                const q = compose(ctx, Math.max(k, floorK), tall ? null : colK, pk, calHigh, minLens, tall ? colK * D.h : 0, zt);
                if (better(q, L)) L = q;
                if (!q.lensShort) lensOnly = false;
                // (people scales are tried largest first: the first that fits is this arrangement's best; when the lens
                // cannot print the board's texts large enough, smaller people do not change that)
                if (q.ok || q.lensShort) break;
              }
            }
            // (when only the lens's text size failed, the calendar's place cannot help: the next text size, whose smaller
            // datum card leaves the window taller)
            if (lensOnly) continue tier;
          }
          if (good(L)) break;
        }
        if (L.ok) break;
      }
    }
    // (then the board grows — smaller zoom targets, the same arrangement — while the people stay at their floors)
    if (good(L)) {
      const [sizeK, colK, , calHigh, minLens, extraBelow] = L.args;
      // (tall frames with the lens over the lower scene: the board may grow further — the lens still magnifies >= 1.62×)
      const zts = extraBelow < 0 ? [...ZTS, ...ZTS_OVER] : ZTS;
      for (const zt of zts.slice(zts.indexOf(ztUsed) + 1)) {
        let q2 = null;
        for (const pk of [2.4, 2, 1.6, 1.4, 1.2, 1]) {
          const q = compose(ctx, sizeK, colK, pk, calHigh, minLens, extraBelow, zt);
          if (better(q, q2)) q2 = q;
          if (q.ok || q.lensShort) break;
        }
        if (!good(q2)) break;
        L = q2;
      }
    }
    return L;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** The state a value names: the open issue when it carries ◆ or the "open" caption, else the agreed issue. */
function stateOf(value, p) {
  const v = String(value || '');
  return v.includes('◆') || (p.stages.open && v.includes(p.stages.open)) ? 'open' : 'agreed';
}

/** The before / after states: as the values name them; the after state differs from the before state. */
function statesOf(p) {
  const before = stateOf(p.beforeValue, p);
  return {before, after: before === 'agreed' ? 'open' : 'agreed'};
}

function compose(ctx, sizeK, colK, peopleK = 1, calHigh = true, minLens = 19.6, extraBelow = 0, zt = ZTS[0]) {
  const args = [sizeK, colK, peopleK, calHigh, minLens, extraBelow, zt];
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const small = B * 0.96 * sizeK;
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf2(ctx, p);
  const dd = statesOf(p);
  // (the props' labels are not fields of this item: the locale's defaults)
  const sp = {...p, labels: (p.locale === 'es' ? OC_DEFAULTS_ES : OC_DEFAULTS).labels};
  // ---- top band: the claim key and the "as supplied" key
  const keySize = Math.max(small, 16.2 / pxPer);
  const key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
  const stKey = showKey ? gchip(ctx, configKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'state-key'}) : null;
  const bandY = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
  // ---- the text column (right; under the scene on tall frames): the caption, then the texts the compact props do
  // not print
  // (square: 'stack' — the lens and the column under the scene, as on tall frames — when the lens beside the scene is
  // too narrow to print the board's texts at the floor)
  const stacked = shape === 'portrait' || colK === 'stack';
  // (labels hidden: no column — the lens's room is wall, on the right, or above the scene on tall frames)
  const hidden = !showAll;
  const colW = stacked ? D.w - 16 : Math.round(D.w * colK);
  const d = p.documents;
  const colTexts = showAll ? [
    {name: 'caption', text: p.contextLabels.context, weight: 700, stroke: th.ink},
    {name: 'cf', text: `${d.caseFile.ref} · ${d.caseFile.title}`, weight: 700},
    // (the cards as the board holds them — Issue 1 ●, Issue 2 ◆ under Subject A; the third card under Subject B without
    // its state: its state is the datum, shown on the datum tag)
    {name: 'sa', text: `${d.subjects.a}: ● ${cardTexts(p)[0]} · ◆ ${cardTexts(p)[1]}`},
    {name: 'sb', text: `${d.subjects.b}: ${cardTexts(p)[2]}`},
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
  // (two name chips side by side under the floor: the widest that leaves no one-word line and still fits)
  const IDX = [0, 1];
  const chipAt = mw => IDX.map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: small, minSize: small, maxLines: 6}));
  let chipMax = (availW - 20) / 2, probe = showKey ? chipAt(chipMax) : [], twoRows = false;
  if (showKey) {
    let found = false;
    for (const f of [0.46, 0.4, 0.36]) {
      const mw = availW * f, pr = chipAt(mw);
      if (pr.reduce((a2, c) => a2 + c.box.w, 0) + 20 <= availW && !pr.some(c => hasLone(c.fit) || c.fit.truncated)) { chipMax = mw; probe = pr; found = true; break; }
    }
    // (long captions: Party A's chip takes a second row, as wide as the scene)
    if (!found) { twoRows = true; chipMax = availW - 10; probe = chipAt(chipMax); }
  }
  const row2 = twoRows ? probe[1].box.h + 6 : 0;
  const chipBand = !probe.length ? 6 : twoRows ? row2 + probe[0].box.h + 14 : Math.max(...probe.map(c => c.box.h)) + 14;
  // (the lens's short side >= 0.37 of the frame's short side, in design units)
  const lensMin = 0.37 * Math.min(ctx.view.width, ctx.view.height) / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  // (over: the lens opens below the board, over the lower scene, the name chips and the column — no room kept for it)
  const over = stacked && !hidden && extraBelow < 0;
  const below = stacked && !hidden ? (over ? colH : Math.max(colH, lensMin + small * 4.5 + extraBelow)) + 12 : 0;
  // (tall frames with labels hidden: the lens opens over the wall above the scene)
  const above = stacked && hidden ? Math.max(lensMin, 0.4 * (D.h - bandY)) + 16 : 0;
  const top0 = bandY + above;
  // (square: the wall ends just past the people — a narrower room, so the people are larger)
  const tightX = shape === 'square' ? -Math.round(46 * 1.3 * peopleK) : 0;
  // (the calendar hangs high on the wall above the tray and the board: a narrower room, larger people)
  // (the board keeps the geometry of its printed texts, drawn as filler bars at the context's size: its text size is
  // set so that the lens, magnified >= ZT×, prints them >= ~20 px)
  const opts = {prefix: 'st', p: sp, looks, showText: true, lensGeo: true, barsOnly: true, lwK: 5, peopleK, wallExtraL: tightX, wallExtraX: tightX, calHigh, peopleMargin: 72};
  const ctxB = LENS_TEXT / pxPer / zt;
  const sol = solveStage(ctx, {B: ctxB, availW, availH: D.h - top0 - chipBand - 8 - below, opts, scMin: 0.2});
  let stage = sol.stage;
  const s = sol.s;
  // (over: a room narrower than its box stands at the box's foot — the wall rises above it to the top band — so the
  // column under it ends at the box's foot, with no blank band below)
  const free0 = over ? Math.max(0, (D.h - 4 - below) - chipBand - top0 - (stage.ext.h - 30) * s) : 0;
  const PL = placeStage(sol, {x0: 8, top0: top0 + free0, availW, bottom: D.h - 4 - below, chipBand});
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
  const occupied = [bx.personA, bx.personB, bx.board, bx.cal, bx.rack, ...bx.plates, ...col.map(q => q.c.box)];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  // ---- name chips under each party (pushed apart when they would touch)
  const chips = [];
  if (showKey) {
    const px = [M({x: G.xA, y: 0}).x, M({x: G.xB, y: 0}).x];
    const ws = probe.map(c => c.box.w);
    const xs = twoRows ? px.map((x, i) => clamp(x, 8 + ws[i] / 2, 8 + availW - ws[i] / 2)) : packChips(px, ws, 8, 8 + availW);
    IDX.forEach(i => {
      const c = gchip(ctx, capOf(i), {x: xs[i], y: PL.floor + 8 + (i === 0 ? row2 : 0), anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${'ab'[i]}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  // ---- the inspected region: the sorting board's grid — the column headers, both subject rows with every card and the
  // subject frames — wholly inside the window
  const rc = bx.focusPanel;
  const src = {x: rc.x - 10, y: rc.y - 10, w: rc.w + 26, h: rc.h + 24};
  // (what the window frames: a tighter margin round the same pieces, their shadows included — the window keeps its size
  // and place, the pieces are magnified a little more)
  const srcL = {x: rc.x - 3, y: rc.y - 3, w: rc.w + 6, h: rc.h + 8};
  // ---- the context's datum tag beside the Subject B row
  let tag = null, tagAfter = null;
  if (showAll) {
    const pb = bx.groupB, bd = bx.board;
    // (under the board first, then beside the Subject B row, else above the board)
    const anchors = [{x: bd.x + bd.w / 2, y: bd.y + bd.h + 4}, {x: bd.x + bd.w + 4, y: pb.y + pb.h / 2}, {x: bd.x - 4, y: pb.y + pb.h / 2}, {x: bd.x + bd.w / 2, y: bd.y - 4}, {x: bd.x + bd.w + 4, y: bd.y + 8}, {x: bd.x - 4, y: bd.y + 8}];
    // (the heads widened by a fifth: hair reaches past the round head)
    const g5 = z => ({x: z.x - z.w * 0.2, y: z.y - z.h * 0.2, w: z.w * 1.4, h: z.h * 1.4});
    const occ0 = [...occupied, {x: src.x, y: src.y, w: src.w, h: src.h}, g5(bx.headA), g5(bx.headB)];
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
  const faces = [bx.headA, bx.headB];
  let cardTs = small * CARD_K;
  const cardFits = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: 10000, size: cardTs, minSize: cardTs, maxLines: 3}));
  const zoomIn = clamp(p.detailGeometry.zoom, 1.5, 4);
  let win;
  {
    const minSide = Math.max(lensMin, 1);
    const maxW = stacked ? D.w - 16 : Math.max(colW, minSide);
    // (the window is wide and tall enough for the zoom at which the board's printed texts reach minLens px)
    const zNeed = minLens > 0 ? minLens / (G.ts * s * pxPer) * 1.03 : 0;
    let wW = clamp(Math.max(minSide, src.w * Math.max(1.5, zoomIn, zNeed)), minSide, maxW);
    const cardAt = ww => { const pr = [p.beforeValue, p.afterValue].map(v => gchip(ctx, v, {x: 0, y: 0, anchor: 'start', maxWidth: ww - small, size: cardTs, minSize: cardTs, maxLines: 6})); return {pr, h: hidden ? 0 : Math.max(...pr.map(c => c.box.h)) * 1.15 + small * 1.2}; };
    // (over: the window's top stays below the framed grid — the source is never covered)
    const lensTop = over ? src.y + src.h + 10 : colY - 4;
    const roomH = stacked ? (hidden ? above - 8 : D.h - 8 - lensTop) : D.h - 8 - bandY;
    // (tall frames: the window is never taller than the room under the scene — at least 0.6 of its width tall, so the
    // width gives way)
    for (let i = 0; i < 12 && stacked && wW * 0.6 > roomH - cardAt(wW).h && wW > minSide; i++) wW = Math.max(minSide, wW * 0.94);
    // (over: the window reaches down the box — the context and the lens span >= 0.85 of the height, and at least to the
    // column's foot — and widens with it,
    // keeping the framed grid's proportions, up to the box's width)
    const spanH = over ? Math.max(Math.min(D.h - 8, PL.oy + stage.ext.y * s + 0.85 * D.h), (col.length ? col.at(-1).c.box.y + col.at(-1).c.box.h : 0)) - lensTop : 0;
    if (over) for (let i = 0; i < 3; i++) wW = clamp(Math.max(wW, (spanH - cardAt(wW).h) * src.w / src.h), minSide, maxW);
    const cardWrapW = wW - small;
    const {pr: cardProbe, h: cardH} = cardAt(wW);
    const maxH = roomH - cardH;
    const wH = clamp(Math.max(wW * src.h / src.w, src.h * Math.max(1.5, zoomIn, zNeed), spanH - cardH), Math.max(minSide - cardH, wW * 0.6), Math.max(minSide - cardH, maxH));
    const x = stacked ? clamp(src.x + src.w / 2 - wW / 2, 8, D.w - 8 - wW) : D.w - 8 - wW;
    const totalH = wH + cardH;
    const yMin = stacked ? (hidden ? bandY : lensTop) : bandY, yMax = stacked && hidden ? bandY : D.h - 8 - totalH;
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
    if (over) return;
    const over2 = c.box.x + c.box.w + 6 - lensBox.x;
    if (over2 <= 0 || !hit(c.box, lensBox, 6)) return;
    const c2 = gchip(ctx, capOf(i), {x: c.box.x + c.box.w / 2 - over2, y: PL.floor + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${'ab'[i]}`});
    if (c2.box.x < 8 || chips.some((o, j) => j !== i && hit(c2.box, o.box, 4))) return;
    const k = occupied.indexOf(c.box);
    if (k >= 0) occupied[k] = c2.box;
    chips[i] = c2;
  });
  // the lens copy: the tray, its card and bar, the slots column, its cards, marks and plate of a second stage at the
  // context's coordinates (a separate set of names)
  // (the same geometry, its texts printed)
  const lz = deskStage(ctx, {...opts, prefix: 'lz', ts: sol.ts, boardOnly: 'focus', barsOnly: !showAll});
  const underLens = col.filter(q => hit(q.c.box, lensBox, 2)).map(q => q.name);
  // (over: the name chips the open window covers leave with the column and come back with it)
  const chipsUnder = over ? chips.map((c, i) => (hit(c.box, lensBox, 2) ? i : -1)).filter(i => i >= 0) : [];
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
    {x: tb.x + tb.w + gapM, y: tb.y + tb.h + markR}, {x: tb.x - gapM, y: tb.y + tb.h + markR},
    {x: tb.x + tb.w / 2, y: tb.y - gapM}, {x: tb.x + tb.w / 2, y: tb.y + tb.h + gapM},
  ].filter(q => q.x - markR >= 6 && q.x + markR <= D.w - 6 && q.y - markR >= 6 && q.y + markR <= D.h - 6);
  const mkClear = q => !mkObst.some(z => hit(mkBox(q), z, 2));
  const markerAt = markerCands.find(mkClear) ?? markerCands[0] ?? {x: tb.x - gapM, y: tb.y + tb.h / 2};
  const markerClear = mkClear(markerAt);
  const labelBoxes = [...chips.map(c => c.box), ...col.map(q => q.c.box), key && key.box, stKey && stKey.box, tag && tag.box].filter(Boolean);
  const truncated = [...lz.fits, ...chips.map(c => c.fit), ...col.map(q => q.c.fit), key && key.fit, stKey && stKey.fit, tag && tag.fit, tagAfter && tagAfter.fit, ...cardFits.map(c => c.fit), ...(hidden ? [] : win.cardFits)].filter(f => f && f.truncated).map(f => f.full);
  const labelsClear = labelBoxes.every((b2, i) => labelBoxes.every((c, j) => i === j || !hit(b2, c, 1)));
  const figPx = bx.personB.h * pxPer;
  const headPx = Math.min(bx.headA.w, bx.headB.w) * 0.86 * pxPer;
  // (the VISIBLE context — the stage left uncovered by the lens — as a share of the FRAME width, as rendered: the design
  // box is the caption-safe box, narrower than the frame; tall frames: the stage's whole width beside nothing)
  const vScale = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) / ctx.view.width;
  const visibleCtx = (stacked ? stage.ext.w * s : Math.max(0, Math.min(win.x, PL.ox + (stage.ext.x + stage.ext.w) * s) - (PL.ox + stage.ext.x * s))) * vScale;
  const lensClearOfFaces = faces.every(f => !hit(lensBox, f, 2));
  const segHits = (a, b2, boxes) => boxes.some(z => Array.from({length: 39}, (_, i) => ({x: a.x + (b2.x - a.x) * (i + 1) / 40, y: a.y + (b2.y - a.y) * (i + 1) / 40})).some(q => q.x > z.x && q.x < z.x + z.w && q.y > z.y && q.y < z.y + z.h));
  // (the frame's edges cross no head (widened by 4 units all round), label or key — the datum tag is hidden while it is
  // shown)
  const pad4 = z => ({x: z.x - 4, y: z.y - 4, w: z.w + 8, h: z.h + 8});
  // (nor any figure)
  const frameObst = [pad4(bx.headA), pad4(bx.headB), bx.personA, bx.personB, ...labelBoxes.filter(b2 => b2 !== (tag && tag.box))];
  const edges = [[{x: shown.x, y: shown.y}, {x: shown.x + shown.w, y: shown.y}], [{x: shown.x + shown.w, y: shown.y}, {x: shown.x + shown.w, y: shown.y + shown.h}], [{x: shown.x, y: shown.y + shown.h}, {x: shown.x + shown.w, y: shown.y + shown.h}], [{x: shown.x, y: shown.y}, {x: shown.x, y: shown.y + shown.h}]];
  const frameClear = !edges.some(([a, b2]) => segHits(a, b2, frameObst));
  return {pk: peopleK, over, chipsUnder, hidden, showAll, PL, stage, lz, s, G, col, chips, key, stKey, tag, tagAfter, src, shown, win, lensBox, Z, srcC, winC, underLens, markR, markerAt, markerClear, frameClear, cardTs, cardLone, small, dd,
    faces, labelBoxes, truncated, labelsClear, figPx, headPx, visibleCtx, lensClearOfFaces, colX, colW,
    lensTextPx: r(G.ts * s * Z * pxPer, 1), lensShort: G.ts * s * Z * pxPer < minLens,
    args, pxPer, minLens, lensTexts: showAll ? ['f0', 'f1', 'f2', 'sj0', 'sj1'].map(k => `lz-${k}-text`) : [],
    why: Object.entries({fit: sol.fitted, colFits, cardLone: !cardLone, Z: Z >= 1.62, lens: G.ts * s * Z * pxPer >= minLens, src: !hit(lensBox, src, -2), tag: !tag || (tag.clear && tagAfter.clear), trunc: !truncated.length, labelsClear, faces: lensClearOfFaces, vis: visibleCtx >= (hidden && stacked ? 0 : 0.46), span: !stacked || hidden || (win.y + lensBox.h - (PL.oy + stage.ext.y * s)) / D.h >= 0.82, bottom: win.y + lensBox.h <= D.h - 4}).filter(([, v]) => !v).map(([k]) => k),
    ok: sol.fitted && colFits && !cardLone && Z >= 1.62 && G.ts * s * Z * pxPer >= minLens && !hit(lensBox, src, -2) && (!tag || (tag.clear && tagAfter.clear)) && !truncated.length && labelsClear && lensClearOfFaces && visibleCtx >= (hidden && stacked ? 0 : 0.46) && (!stacked || hidden || (win.y + lensBox.h - (PL.oy + stage.ext.y * s)) / D.h >= 0.82) && win.y + lensBox.h <= D.h - 4,
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
  // the context: Party A at rest beside her empty tray, the day marked, the subject rows framed; the third card in the
  // Subject B row, in the column of the supplied state, with its glyph. No hand pushes: the card's place is the datum
  const v0 = choreo(0, L.G);
  const at = st => L.G.travelOf[st];
  const glyphs = (st, P2) => (st === 'agreed' ? {aP: P2, oP: 0} : {aP: 0, oP: P2});
  const v = {...v0, markP: 1, barStill: true, groupP: 1};
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
  const strike = seg(u, ...W_.strike);
  const geo = ease.inOutCubic(seg(u, ...W_.geo));
  const oldOut = u < W_.swap ? 1 : 0;
  const newIn = u < W_.swap ? 0 : 1;
  // (the copy's texts and the datum card's text show only once the growing window draws them at the text floor: the
  // board's printed texts from the window's scale at which they reach it, the larger datum text earlier)
  const floorPx = L.minLens > 19 ? 19.6 : 16.4;
  const tThr = Math.min(0.97, (floorPx + 0.3) / Math.max(1e-6, L.lensTextPx));
  const tP = clamp((sc - tThr) / 0.03);
  const vThr = Math.min(0.97, (floorPx + 0.3) / Math.max(1e-6, L.cardTs * L.pxPer));
  const vP = clamp((sc - vThr) / 0.03);
  L.lensTexts.forEach(n => { nodes[n] = {opacity: r(tP, 3)}; });
  if (L.showAll) {
    nodes['val-old'] = {opacity: r(copyIn * oldOut * textOut * vP, 3)};
    nodes['val-strike'] = {opacity: r(strike * oldOut * textOut * vP, 3)};
    nodes['val-new'] = {opacity: r(newIn * textOut * vP, 3)};
  }
  // (inside the lens the old glyph goes first, then the third card slides along the Subject B row into the other column,
  // then the new glyph comes: never both glyphs at once)
  const lensSheet = lerp(at(L.dd.before), at(L.dd.after), ease.inOutCubic(seg(geo, 0.3, 0.72)));
  const lg = {...glyphs(L.dd.before, 1 - seg(geo, 0, 0.28))};
  const ln = glyphs(L.dd.after, seg(geo, 0.74, 1));
  const lensGl = {aP: Math.max(lg.aP, ln.aP), oP: Math.max(lg.oP, ln.oP)};
  Object.assign(nodes, Object.fromEntries(Object.entries(L.lz.pose({...v, sheetD: lensSheet, ...lensGl}).nodes).filter(([k]) => /^lz-(f\d+-g|f2-ga|f2-go)$/.test(k))));
  const hide = seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn));
  // the context takes the change while it is hidden under the lens (after the lens's own change): as the window goes it
  // comes back already in the new state — the old state never returns
  const switched = u >= W_.geo[1];
  if (L.tag) { nodes['tag-datum-g'] = {opacity: r(1 - seg(u, ...W_.hideOut), 3)}; nodes['tag-datum'] = {opacity: 1}; }
  // (over: the datum tag lies under the window — it comes back with the column, after the window's last visible frame)
  const tagHide = L.over ? seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.colIn)) : hide;
  if (L.tagAfter) { nodes['tag-datum2-g'] = {opacity: r(switched ? 1 - tagHide : 0, 3)}; nodes['tag-datum2'] = {opacity: 1}; }
  // (the context's third card, with its glyph, is the datum too: hidden while the lens holds its copy, then changed)
  const ctxVis = 1 - hide;
  const ctxSt = switched ? L.dd.after : L.dd.before;
  const ctxP = glyphs(ctxSt, 1);
  Object.assign(nodes, L.stage.pose({...v, sheetD: at(ctxSt), cardOp: ctxVis, ...ctxP}).nodes);
  const lateP = seg(u, ...W_.marker);
  // (the column under the window comes back as soon as the window has gone — not after the close)
  // (the whole column leaves — not only the chips under the window: a chip left alone beside the lens reads as stranded,
  // review r1 — and so do, on tall frames, the name chips the window covers)
  // (they leave in step with the window appearing — with the datum tag — so no frame shows the box half empty)
  const colHide = seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.colIn));
  L.col.forEach(q => { const base = q.late ? lateP : 1; nodes[`colg-${q.name}`] = {opacity: r(base * (1 - colHide), 3)}; });
  L.chips.forEach((c, i) => { nodes[`chip-${'ab'[i]}`] = {opacity: r(L.chipsUnder.includes(i) ? 1 - colHide : 1, 3)}; });
  if (L.tagAfter) nodes.marker = {opacity: r(lateP, 3)};
  const lensDatum = geo > 0 ? 'after' : 'before';
  const colOf = d2 => (Math.abs(d2 - at('agreed')) < 0.5 ? 'agreed' : Math.abs(d2 - at('open')) < 0.5 ? 'open' : null);
  const stateAt = q => (q >= 1 ? L.dd.after : q > 0 ? null : L.dd.before);
  const ctxDatum = switched ? 'after' : 'before';
  const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
  return {
    nodes,
    semantic: {
      beat, lensOpen: r(lensP, 3), zoom: r(L.Z, 3), datum: lensDatum, contextDatum: ctxDatum, focusTarget: p.focusTarget,
      stateCtx: ctxSt, ctxShown: r(ctxVis, 3), stateLens: stateAt(geo), states: L.dd, ctxGlyph: r(ctxVis, 3), lensGlyphBoth: lensGl.aP > 0 && lensGl.oP > 0,
      ctxColumn: colOf(at(ctxSt)), lensColumn: colOf(lensSheet), lensCard: r(lensSheet, 2), cards: L.G.n, lensTextPx: L.lensTextPx, headPx: r(L.headPx, 1), oldShown: r(copyIn * oldOut * textOut, 3), newShown: r(newIn * textOut, 3), strike: r(strike, 3), contextDim: r(dim, 3), contextScale: 1,
      markerShown: r(lateP, 3), tagAfter: r(switched ? 1 - tagHide : 0, 3), markerClear: L.tagAfter ? L.markerClear : null, frameClear: L.frameClear,
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
    slug: 'civil-claim-10-inspect',
    title: 'Ordering of issues (illustrative) — a lens on the sorting board: the supplied state of the third issue card changes, and with it its column',
    titleEs: 'Ordenación de cuestiones — Inspección y cambio de un dato',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Ordenación de cuestiones',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The state produced by the grouping: Party A at rest beside her empty tray; on the case file the sorting board — ● agreed and ◆ open columns, Subject A and Subject B rows, Issue 1 and Issue 2 under Subject A and the third card under Subject B in the column of its supplied state (by default ● agreed), each subject row framed; the calendar marks the supplied day; Party B at the right; the supplied texts in a column. A lens opens beside the board: a real enlarged copy of the board’s grid at the same coordinates, where its printed texts become legible, with a datum card; while it holds the datum the context copy is hidden. Inside the lens only the datum changes — the ● glyph goes, the card slides into the ◆ column and its ◆ glyph comes — then the context returns already in the new state, with a Δ changed-datum marker. Seeking back restores the old datum. Both states have equal weight: “agreed” only means the supplied list marks the issue as agreed between the parties; nothing is decided or proven; no procedure, effect or outcome.',
    tags: ['ordering of issues', 'agreed issue', 'open issue', 'inspect', 'lens', 'case file', 'sorting board', 'datum change', 'issue state'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/ordenacion-cuestiones.js', 'src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
