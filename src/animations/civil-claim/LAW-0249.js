/**
 * LAW-0249 — Presentación de demanda · story
 *
 * Storyboard (side view of a registry counter: Party A seated at the left end,
 * the registry clerk at the right end; the case file on a shelf above Party A;
 * the registry calendar hangs open on the wall; the action clock c runs from
 * u = 0.15 to u = 0.80):
 *  0.00–0.15  rest: the written filing (supplied contents and date line, a blank
 *             reference box) stands on its sled in Party A's drafts tray; the
 *             pen lies on the counter; the registry intake tray is empty; the
 *             reference stamp rests on its pad in front of the clerk; names,
 *             labels and the key are readable.
 *  0.15–0.42  Party A picks up the pen, signs the filing, puts the pen down and
 *             pushes the sled out of the drafts tray onto the groove track
 *             (hands on SOLVED points: the pen's grip, then the filing's edge).
 *  0.42–0.73  finalState "registered": the filing slides along the track into
 *             the registry intake tray (the tray lights up, neutral); the clerk
 *             takes the stamp, carries it to the filing's reference box and
 *             presses it: the supplied (fictional) reference appears in the box
 *             only after the press (cause before effect), then an entry glyph
 *             drops into the supplied day of the registry calendar.
 *             finalState "draft-not-filed": Party A signs but does not hand the
 *             filing in: it stays in the drafts tray, its reference box stays
 *             blank and the clerk does not move. A different configured state,
 *             drawn neutrally (no cross, no red).
 *  0.73–1.00  hold: stage tags (handed in · registered with the reference on
 *             the supplied day / draft, not filed), editorial callouts and the
 *             "as supplied · no conclusion drawn" key. No filing rule, fee,
 *             court, deadline or effect of registering or not is stated.
 * @module animations/civil-claim/LAW-0249
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {noteCallout, placeClear} from '../roles/kits/mediation-labels.js';
import {
  FD_DEFAULTS, FD_STRINGS, partiesField, documentsField, datesField, stagesField, propLabelProps,
  partyCaption, looksOf, outcomeText, gchip, keyChip, hit, solveFiling, choreo, placeTag, needsTextColumn,
  localizeDefaults, FD_COMMON_ES, FD_DEFAULTS_ES,
} from './kits/presentacion-demanda.js';

const ID = 'LAW-0249';
const DURATION = 6000;
const C0 = 0.15, C1 = 0.8;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// (the sent tag appears once the filing has left the tag's area: it lands at c 0.62)
const TAGS = {sent: [0.6, 0.66], outcome: [0.9, 0.96], draft: [0.6, 0.66]};
const NOTES = [0.8, 0.86];
/** base text size (design units) per layout: every text ≥ 19.5 px at 1080p in the baseline presets */
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** distance between the two seats (stage units) per layout: a real re-layout, not a scaled copy */
const SEATS = {landscape: 1360, square: 940, portrait: 780};
const ASPECT = {landscape: 0.95, square: 1.0, portrait: 1.3};
const GROW = {landscape: 640, square: 80, portrait: 0};
const CAL_COLS = {landscape: null, square: null, portrait: 2};
/** smallest stage scale (people and props size) before long text steps down */
const S_MIN = {landscape: 0.8, square: 0.5, portrait: 0.5};
const TARGETS = ['filing', 'calendar', 'intake'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  actorLabels: obj('Chip captions under each party (empty = "name · role")', {a: str('Caption for Party A', 60), b: str('Caption for the registry desk', 60)}),
  objectLabels: obj('Labels printed on the props', propLabelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the final hold: the filing is registered and carries the supplied reference, or it stays an unfiled draft. A configured state only; no legal effect is inferred', ['registered', 'draft-not-filed']),
};

const defaultParams = {
  parties: FD_DEFAULTS.parties,
  documents: FD_DEFAULTS.documents,
  stages: FD_DEFAULTS.stages,
  dates: FD_DEFAULTS.dates,
  actorLabels: {a: '', b: ''},
  objectLabels: FD_DEFAULTS.labels,
  actionProgress: 1,
  annotations: [{target: 'filing', text: 'The reference appears only after the stamp is pressed'}],
  finalState: 'registered',
};

/** Resolved stage params (the story's prop labels live in objectLabels). */
const stageParams = p => ({...p, labels: p.objectLabels});
const planOf = p => (p.finalState === 'draft-not-filed' ? 'draft' : 'registered');

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...FD_COMMON_ES,
  objectLabels: FD_DEFAULTS_ES.labels,
  annotations: [{target: 'filing', text: 'La referencia aparece solo después del sello'}],
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    return layoutOf(ctx);
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

function layoutOf(ctx) {
  const flowFor = (col, first) => {
    let L = first || compose(ctx, 0, false, 1, col);
    if (!L.fitted) { const L2 = compose(ctx, 0, false, 0.84, col); if (L2.fitted) L = L2; }
    if (L.notesClear) return L;
    const opts = [compose(ctx, L.noteBandNeed, false, 1, col)];
    if (ctx.view.shape === 'landscape' && !col) opts.push(compose(ctx, L.noteBandNeed, true));
    let ok = opts.filter(q => q.fitted);
    if (!ok.length) ok = [compose(ctx, L.noteBandNeed, false, 0.84, col)].filter(q => q.fitted);
    return (ok.length ? ok : opts).reduce((a, b) => (b.m > a.m + 1e-3 || (Math.abs(b.m - a.m) < 1e-3 && b.s > a.s) ? b : a));
  };
  const L0 = compose(ctx, 0);
  // the stage with its printed texts is kept unless it (with its callouts placed) fails a floor: then the texts
  // move to a right-hand column (needsTextColumn), and the column is taken only when it meets the floors itself
  // (head: the layout's estimate runs a few px above the rendered head — a margin over the tested 52 px)
  const floors = {head: 56, frameW: ctx.view.shape === 'portrait' ? 0.71 : 0.6};
  const ok = L => L.fitted && L.headPx >= floors.head && L.tagsClear && !L.truncated.length;
  const L1 = needsTextColumn(L0, floors) ? L0 : flowFor(false, L0);
  if (ok(L1) && !needsTextColumn(L1, floors)) return L1;
  const Lc = flowFor(true);
  if (ok(Lc)) return Lc;
  if (ok(L1)) return L1;
  // (neither meets every floor: nothing cut first, then the larger people)
  const rank = L => (L.fitted ? 2 : 0) + (L.truncated.length ? 0 : 1);
  return [L1, Lc].reduce((a, b) => (rank(b) > rank(a) || (rank(b) === rank(a) && b.headPx > a.headPx) ? b : a));
}

function compose(ctx, noteBand, side = false, lab = 1, col = false) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const pxPer0 = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const LB = B * lab;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const plan = planOf(p);
  const looks = looksOf(ctx, p);
  const sp = stageParams(p);
  const W = SEATS[shape];
  // (tall frames: the text column is stacked ABOVE the stage at full width, so the stage keeps the frame's width)
  const stacked = col && shape === 'portrait';
  const chipMax = col && !stacked ? (D.w - Math.round(D.w * (shape === 'portrait' ? 0.4 : 0.27)) - 44) / 2 : shape === 'portrait' ? D.w * 0.47 : shape === 'square' ? D.w * 0.46 : 520;
  const cap = i => (i === 0 ? p.actorLabels.a : p.actorLabels.b) || partyCaption(p, i);
  const probe = showKey ? [0, 1].map(i => gchip(ctx, cap(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: LB, minSize: LB, maxLines: 8})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 14 : 6;
  const probeKey = showKey ? keyChip(ctx, {x: 0, y: 0, maxWidth: shape === 'landscape' ? 330 : D.w - 16, size: Math.max(LB, 16.2 / pxPer0)}) : null;
  const keyMid = probeKey && probe.length ? keyChip(ctx, {x: 0, y: 0, maxWidth: D.w - 64 - probe[0].box.w - probe[1].box.w, size: Math.max(LB, 16.2 / pxPer0), maxLines: 3}) : null;
  const keyInBand = Boolean(keyMid && !keyMid.fit.truncated && keyMid.box.h <= chipBand - 10 + B && D.w - 64 - probe[0].box.w - probe[1].box.w >= B * 6);
  const sideNotes = Boolean(noteBand) && side && shape === 'landscape';
  const shareBand = Boolean(noteBand) && !sideNotes && Boolean(probeKey) && showAll;
  const nCols = p.annotations.length > 1 && shape === 'square' ? 2 : 1;
  const noteW0 = shareBand ? D.w - 16 - probeKey.box.w - 24 : 0;
  if (shareBand) {
    const hs = p.annotations.map((a, i) => gchip(ctx, `${i + 1}  ${a.text}`, {x: 0, y: 0, anchor: 'start', maxWidth: (noteW0 - (nCols - 1) * 14) / nCols, size: LB * 0.96, minSize: LB * 0.96, maxLines: 9}).box.h);
    noteBand = Math.max((nCols > 1 ? Math.max(...hs) : hs.reduce((a, b) => a + b + 10, -10)) + 16, probeKey.box.h + 14);
  }
  const keyBand = probeKey && !shareBand && ((shape !== 'landscape' && !keyInBand) || noteBand) ? probeKey.box.h + 14 : 0;
  const sideW = sideNotes ? Math.min(330, D.w * 0.17) : 0;
  // (col: long supplied texts leave the props — the filing's contents, date line and reference, and the prop labels
  // become a right-hand text column; the props keep their shapes and filler lines)
  const colW = stacked ? D.w - 16 : col ? Math.round(D.w * (shape === 'landscape' ? 0.24 : 0.27)) : 0;
  const colTexts = col && showAll ? [p.documents.filing.title, p.documents.filing.dated, plan === 'registered' ? p.documents.reference : '', p.objectLabels.calendar, p.objectLabels.drafts, p.objectLabels.intake].filter(Boolean) : [];
  const colX = stacked ? 8 : D.w - 8 - colW;
  const sideCol = col && !stacked;
  const rightEdge = sideCol ? colX - 14 : D.w - 8;
  // (stacked: the column's height — its texts and the numbered entries that tags and callouts become — is reserved
  // above the stage)
  let colReserve = 0;
  if (stacked) {
    const legendTexts = showKey ? [outcomeText(p, plan), ...(plan === 'registered' ? [p.stages.sent] : []), ...(showAll ? p.annotations.map(a => a.text) : [])] : [];
    for (const [k, t] of [...colTexts.map(t2 => [0, t2]), ...legendTexts.map((t2, i) => [1, `${i + 1}  ${t2}`])]) colReserve += gchip(ctx, t, {x: 0, y: 0, anchor: 'start', maxWidth: colW, size: LB * 0.96, minSize: LB * 0.96, maxLines: 8, weight: k ? 700 : 600}).box.h + 10;
    colReserve += 6;
  }

  const sol = solveFiling(ctx, {
    B, availW: D.w - 16 - (sideNotes ? sideW + 20 : 0) - (sideCol ? colW + 20 : 0), availH: D.h - keyBand - (sideNotes ? 0 : noteBand) - chipBand - 12 - colReserve, sMin: S_MIN[shape],
    // (wide frames: a longer counter fills the width when long texts make the stage height-bound)
    preferWide: shape === 'landscape', minWideW: shape === 'landscape' ? 0.93 * (D.w - 16 - (sideNotes ? sideW + 20 : 0) - (sideCol ? colW + 20 : 0)) : 0,
    modes: {landscape: [['middle', 'cabinet', W], ['wide', 'cabinet', W], ['middle', 'cabinet', W + 200], ['middle', 'cabinet', W + 400], ['middle', 'cabinet', W + 700], ['middle', 'cabinet', W + 1000]], square: [['above', 'shelf', W], ['above', 'shelf', 800], ['wide', 'cabinet', W]], portrait: [['above', 'shelf', W]]}[shape],
    opts: {prefix: 'st', compact: col, peopleK: col ? 1.4 : 1, wallPad: 0.5, p: sp, looks, showText: showAll, markIdx: p.dates.entryDay, calCols: CAL_COLS[shape], aspect: ASPECT[shape], grow: GROW[shape], tight: shape !== 'landscape', slotK: shape === 'portrait' ? 2.6 : 1.6, lwK: shape === 'landscape' ? 12.4 : shape === 'square' ? 9 : 10, route: col ? 200 : shape === 'landscape' ? 460 : 100},
  });
  const stage = sol.stage, s = sol.s, m = sol.m, tsMax = sol.tsMax, fitted = sol.fitted;
  const E = stage.ext;
  const ox = (D.w - (sideNotes ? sideW + 20 : 0) - (sideCol ? colW + 20 : 0) - E.w * s) / 2 - E.x * s;
  const oy0 = D.h - chipBand - 4;
  const topFree = oy0 + E.y * s - (8 + keyBand + (sideNotes ? 0 : noteBand) + 8 + colReserve);
  // (the stage and its name row are centred in the free height under the top band)
  const oy = oy0 - Math.max(0, topFree) / 2;
  const M = q => ({x: ox + q.x * s, y: oy + q.y * s});
  const Wd = stage.G.W;
  const Mb = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
  const G = stage.G;
  const bounds = {x: 6, y: 6, w: D.w - 12 - (sideCol ? colW + 14 : 0), h: D.h - 12};
  const colChips = [];
  let colFits = true;
  let colY = 8 + keyBand;
  {
    let y = colY;
    colTexts.forEach((t, i) => {
      const c = gchip(ctx, t, {x: colX, y, anchor: 'start', maxWidth: colW, size: LB * 0.96, minSize: LB * 0.96, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: i === 0 ? 700 : 600, name: `coltx${i}`});
      colChips.push(c);
      y += c.box.h + 10;
    });
    colY = y;
    colFits = y <= D.h - 8;
  }
  let legendN = 0;
  const legendEntry = (name, text, at, color) => {
    legendN += 1;
    const n = legendN;
    const c = gchip(ctx, `${n}  ${text}`, {x: colX, y: colY, anchor: 'start', maxWidth: colW, size: LB * 0.96, minSize: LB * 0.96, maxLines: 8, fill: th.card, stroke: color, color: th.ink, weight: 700, name: `${name}-chip`});
    colY += c.box.h + 10;
    colFits = colY <= D.h - 8;
    const R0 = B * 0.62;
    const node = g({name, opacity: 0},
      h('circle', {cx: r(at.x), cy: r(at.y), r: r(R0), fill: th.card, stroke: color, 'stroke-width': 2.5}),
      h('text', {x: r(at.x), y: r(at.y + B * 0.34), 'text-anchor': 'middle', 'font-size': r(B * 0.96), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(n)),
      c.node);
    return {node, box: c.box, fit: c.fit, lead: 0, clear: true, anchor: at, markBox: {x: at.x - R0, y: at.y - R0, w: 2 * R0, h: 2 * R0}};
  };

  // ---- occupied boxes at the hold (design units): every drawn prop, with the filing where the plan leaves it
  const bx = stage.boxes;
  const reg = plan === 'registered';
  const occupied = [bx.personA, bx.personB, bx.file, bx.shelf, bx.cal, reg ? bx.letterEnd : bx.letterStart, bx.trayAt, bx.draftsPlate, bx.stamp, bx.pen, ...(reg ? [bx.stampPath] : [])].map(Mb);
  // (each tray's back rises LH·0.45 over the counter; the sled under the filing)
  for (const X of [G.X1]) occupied.push(Mb({x: X - G.trayW / 2 - 8, y: G.top - 12 - G.LH * 0.45 - 8, w: G.trayW + 16, h: 12 + G.LH * 0.45 + 16}));
  occupied.push(Mb({x: (reg ? G.X1 : G.X0) - G.LW / 2 - 4, y: G.letterBottom - 4, w: G.LW + 8, h: 34}));
  const labelBoxes = [];
  const chips = [];
  if (showKey) {
    [0, 1].forEach(i => {
      const x = M({x: i ? Wd : 0, y: 0}).x;
      const w = probe[i].box.w;
      const cx = clamp(x, 8 + w / 2, rightEdge - w / 2);
      const c = gchip(ctx, cap(i), {x: cx, y: oy + 8, anchor: 'middle', maxWidth: chipMax, size: LB, minSize: LB, maxLines: 8, name: `chip-${i ? 'b' : 'a'}`});
      chips.push(c);
      occupied.push(c.box);
      labelBoxes.push({...c.box, id: `chip${i}`});
    });
  }
  let key = null;
  if (probeKey) {
    const keySize = Math.max(Math.min(LB * 0.96, stage.G.ts * s), 16.2 / pxPer0);
    const cands = (shareBand ? [[rightEdge, 8, 'end'], [8, 8, 'start']] : [[8, 8, 'start'], [rightEdge, 8, 'end']]).map(([x, y, anchor]) => keyChip(ctx, {x, y, anchor, maxWidth: shape === 'landscape' ? 330 : D.w - 16, size: keySize}));
    if (keyInBand && chips.length === 2) {
      const gx0 = chips[0].box.x + chips[0].box.w + 16, gx1 = chips[1].box.x - 16;
      const km = keyChip(ctx, {x: (gx0 + gx1) / 2, y: oy + 8, anchor: 'middle', maxWidth: Math.max(B * 6, gx1 - gx0), size: keySize, maxLines: 3});
      // (only a key that fits whole between the name chips)
      if (!km.fit.truncated) cands.unshift(km);
    }
    key = placeClear(cands, occupied, bounds, 6);
    occupied.push(key.box);
    labelBoxes.push({...key.box, id: 'key'});
  }

  // ---- stage tags: each beside its own element, with a short leader to it
  const pxPer = pxPer0;
  const tags = {};
  const tagMax = shape === 'portrait' ? D.w * 0.5 : 440;
  const addTag = (name, text, anchors, color) => {
    if (col) {
      const at = anchors.find(q => !labelBoxes.some(b => q.x > b.x - 20 && q.x < b.x + b.w + 20 && q.y > b.y - 20 && q.y < b.y + b.h + 20)) || anchors[0];
      const t = legendEntry(name, text, at, color);
      labelBoxes.push({...t.markBox, id: `${name}-mark`});
      tags[name] = t;
      return;
    }
    let t = null;
    const free = anchors.filter(q => !labelBoxes.some(b => q.x > b.x - 8 && q.x < b.x + b.w + 8 && q.y > b.y - 8 && q.y < b.y + b.h + 8));
    for (const anchor of (free.length ? free : anchors)) {
      const c = placeTag(ctx, {name, text, anchor, occupied, bounds, maxWidth: tagMax, size: LB * 0.96, color, maxLead: 38 / pxPer, narrow: true});
      if (!t || (c.clear && !t.clear)) t = c;
      if (c.clear) break;
    }
    occupied.push(t.box);
    labelBoxes.push({...t.box, id: name});
    tags[name] = t;
  };
  if (showKey) {
    if (reg) {
      // the outcome tag at the filing in the intake tray (the stamped reference), placed first: it is the one read at the hold
      const rb = Mb(bx.refEnd);
      addTag('tag-outcome', outcomeText(p, plan), [M({x: G.X1 - G.LW / 2, y: G.letterTop + G.LH * 0.3}), M({x: G.X1 - G.LW / 2 + 16, y: G.letterTop + 4}), M({x: G.X1, y: G.letterTop + 3}), M({x: G.X1 + G.LW / 2 - 16, y: G.letterTop + 6}), {x: rb.x + 4, y: rb.y + rb.h / 2}, M({x: G.X1 - G.trayW / 2 - 4, y: G.lipTop + 8})], th.accent2);
      addTag('tag-sent', p.stages.sent, [M({x: G.X0, y: G.top - 4}), M({x: bx.draftsPlate.x + bx.draftsPlate.w + 4, y: bx.draftsPlate.y + bx.draftsPlate.h / 2}), M({x: bx.draftsPlate.x - 4, y: bx.draftsPlate.y + bx.draftsPlate.h / 2}), M({x: G.X0 + G.LW / 2 + 30, y: G.top - 4}), M({x: (G.X0 + G.X1) / 2, y: G.top - 4}), M({x: G.X0 - G.LW / 2 + 20, y: G.top - 4}), M({x: G.X1 - G.trayW / 2 - 40, y: G.top - 4})], th.inkSoft);
    } else {
      addTag('tag-outcome', outcomeText(p, plan), [M({x: G.X0 + G.LW / 2, y: G.letterTop + G.LH * 0.3}), M({x: G.X0 + G.LW / 2 - 16, y: G.letterTop + 4}), M({x: G.X0, y: G.letterTop + 3}), M({x: G.X0 - G.LW / 2, y: G.letterTop + G.LH * 0.3}), M({x: G.X0 + G.LW / 2 - 8, y: G.letterBottom - 8})], th.inkSoft);
    }
  }

  // ---- editorial callouts in free space; the leader reaches the real target without crossing a label
  const notes = [];
  let notesClear = true, noteBandNeed = 0;
  if (showAll) {
    const Xf = reg ? G.X1 : G.X0;
    const tgt = {
      filing: reg ? M({x: G.refC.x - G.refBox.w / 2 + 4, y: G.refC.y}) : M({x: Xf - G.LW / 2 + 10, y: G.letterTop + G.LH * 0.35}),
      calendar: M({x: bx.cal.x + bx.cal.w * 0.5, y: bx.cal.y + bx.cal.h}),
      intake: M({x: G.X1, y: G.lipTop + 6}),
    };
    const mark = {filing: M({x: Xf - G.LW / 2 - 18, y: G.letterTop + 18}), calendar: M({x: bx.cal.x + bx.cal.w - 2, y: bx.cal.y + G.ts * 0.9 + 2}), intake: M({x: G.X1 + G.trayW / 2 + 18, y: G.lipTop + 6})};
    const inBox = (q, b) => q.x > b.x + 2 && q.x < b.x + b.w - 2 && q.y > b.y + 2 && q.y < b.y + b.h - 2;
    const leaderClear = (bxn, t) => {
      const from = {x: clamp(t.x, bxn.x + 12, bxn.x + bxn.w - 12), y: t.y > bxn.y + bxn.h ? bxn.y + bxn.h : t.y < bxn.y ? bxn.y : bxn.y + bxn.h / 2};
      const obs = occupied.filter(o2 => !inBox(t, o2));
      for (let i = 1; i < 16; i++) {
        const q = {x: from.x + (t.x - from.x) * i / 16, y: from.y + (t.y - from.y) * i / 16};
        if (obs.some(o2 => inBox(q, o2))) return false;
      }
      return Math.hypot(t.x - from.x, t.y - from.y) < 360;
    };
    const cols = nCols;
    const colW2 = sideNotes ? sideW : ((shareBand ? noteW0 : D.w - 16) - (cols - 1) * 14) / cols;
    const bandY0 = 8 + keyBand;
    for (const [i, a] of p.annotations.entries()) {
      const t = noteBand || col ? mark[a.target] : tgt[a.target];
      if (col) {
        // (the note's number keeps clear of the numbers already marking the stage: it steps down the element)
        let at = {...t};
        const R1 = B * 0.62;
        for (let k = 0; k < 8 && labelBoxes.some(b => hit({x: at.x - R1, y: at.y - R1, w: 2 * R1, h: 2 * R1}, b, 4)); k++) at = {x: at.x, y: at.y + 2 * R1 + 6};
        const e = legendEntry(`note${i}`, a.text, at, th.ink);
        labelBoxes.push({...e.markBox, id: `note${i}-mark`});
        notes.push({node: e.node, box: e.box, fit: e.fit, frame: q => ({[`note${i}`]: {opacity: r(q, 3)}})});
        continue;
      }
      if (noteBand) {
        const ci = cols > 1 ? i : 0;
        const y = cols > 1 || i === 0 ? bandY0 : notes[i - 1].box.y + notes[i - 1].box.h + 10;
        const n = gchip(ctx, `${i + 1}  ${a.text}`, {x: sideNotes ? D.w - 8 - sideW : 8 + ci * (colW2 + 14), y, anchor: 'start', maxWidth: colW2, size: LB * 0.96, minSize: LB * 0.96, maxLines: 9, fill: th.card, stroke: th.ink, color: th.ink, weight: 600, name: `note${i}-chip`});
        const R0 = B * 0.62;
        const node = g({name: `note${i}`, opacity: 0},
          n.node,
          h('circle', {cx: r(t.x), cy: r(t.y), r: r(R0), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
          h('text', {x: r(t.x), y: r(t.y + B * 0.34), 'text-anchor': 'middle', 'font-size': r(B * 0.96), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(i + 1)));
        const note = {node, box: n.box, fit: n.fit, frame: q => ({[`note${i}`]: {opacity: r(q, 3)}})};
        occupied.push(n.box);
        labelBoxes.push({...n.box, id: `note${i}`});
        notes.push(note);
        continue;
      }
      const faceZones = [bx.headA, bx.headB].map(Mb).map(f => ({x: f.x - B * 1.2, y: f.y - B * 1.2, w: f.w + B * 2.4, h: f.h + B * 2.4}));
      const mw = shape === 'portrait' ? D.w * 0.62 : 460;
      const cands = [];
      for (let dy = -480; dy <= 480; dy += 24) for (let dx = -640; dx <= 640; dx += 40) cands.push({x: t.x + dx, y: t.y + dy});
      cands.sort((q1, q2) => Math.hypot(q1.x - t.x, q1.y - t.y) - Math.hypot(q2.x - t.x, q2.y - t.y));
      let bestQ = null, mwQ = mw;
      for (const [mwi, ml] of [[mw, 3], [mw * 0.72, 4], [mw * 0.55, 5]]) {
        const probeN = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, anchor: 'middle', target: t, maxWidth: mwi, size: LB * 0.96, minSize: LB * 0.96, maxLines: ml});
        if (probeN.fit.truncated) continue;
        const pw = probeN.box.w, ph = probeN.box.h;
        for (const q of cands) {
          const box = {x: q.x - pw / 2, y: q.y, w: pw, h: ph};
          if (Math.hypot(box.x + pw / 2 - t.x, box.y + ph / 2 - t.y) < 40) continue;
          const inside = box.x >= bounds.x && box.y >= bounds.y && box.x + pw <= bounds.x + bounds.w && box.y + ph <= bounds.y + bounds.h;
          if (!inside) continue;
          if (!occupied.some(o2 => hit(box, o2, 8)) && !faceZones.some(f => hit(box, f, 0)) && leaderClear(box, t)) { bestQ = q; mwQ = [mwi, ml]; break; }
        }
        if (bestQ) break;
      }
      if (!bestQ) notesClear = false;
      const q = bestQ || {x: D.w / 2, y: 8};
      const [mwB, mlB] = bestQ ? mwQ : [mw, 3];
      const best = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: q, anchor: 'middle', target: t, maxWidth: mwB, size: LB * 0.96, minSize: LB * 0.96, maxLines: mlB});
      occupied.push(best.box);
      labelBoxes.push({...best.box, id: `note${i}`});
      notes.push(best);
    }
    if (!notesClear) {
      const hs = p.annotations.map((a, i) => gchip(ctx, `${i + 1}  ${a.text}`, {x: 0, y: 0, anchor: 'start', maxWidth: colW2, size: LB * 0.96, minSize: LB * 0.96, maxLines: 4}).box.h);
      noteBandNeed = (cols > 1 ? Math.max(...hs) : hs.reduce((a, b) => a + b + 10, 0)) + 16;
    }
  }
  const clashes = [];
  labelBoxes.forEach((b, i) => labelBoxes.forEach((c, j) => { if (j > i && hit(b, c, 2)) clashes.push(`${b.id}/${c.id}`); }));
  const labelsClear = clashes.length === 0;
  labelBoxes.push(...colChips.map((c, i) => ({...c.box, id: `col${i}`})));
  const truncated = [...stage.fits, ...colChips.map(c => c.fit), ...chips.map(c => c.fit), key && key.fit, ...Object.values(tags).map(t => t.fit), ...notes.map(n => n.fit)]
    .filter(f => f && f.truncated).map(f => f.full);
  const Xf = reg ? G.X1 : G.X0;
  const textProps = [bx.cal, bx.file, {x: Xf - G.LW / 2 + G.ts * 0.4, y: G.letterTop, w: G.LW - G.ts * 0.8, h: G.LH * 0.8}, bx.trayPlate, bx.draftsPlate].map(Mb);
  const tagsClear = Object.entries(tags).every(([n, t]) => t.clear || (!textProps.some(z => hit(t.box, z, 2)) && !labelBoxes.some(b => b.id !== n && hit(t.box, b, 2))));
  return {tagsClear, col, colChips, headPx: bx.headA.w * s * pxPer0 * 0.85, fitted: fitted && colFits, stage, s, m, ox, oy, M, plan, chips, key, tags, notes, notesClear, noteBandNeed, labelsClear, clashes, truncated, faces: [Mb(bx.headA), Mb(bx.headB)], labelBoxes,
    textPx: r(stage.G.ts * s, 2), tsMax, share: {w: r(E.w * s / D.w, 3), h: r(E.h * s / D.h, 3)},
    frameW: E.w * s * Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) / ctx.view.width};
}

function buildScene(ctx, L) {
  return g(null,
    g({transform: `${T(L.ox, L.oy)} scale(${r(L.s, 5)})`}, L.stage.node),
    L.chips.map(c => c.node),
    Object.values(L.tags).map(t => t.node),
    L.notes.map(n => n.node),
    L.key && L.key.node,
    L.colChips.map(c => c.node),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const cRaw = (u - C0) / (C1 - C0);
  const c = clamp(cRaw, 0, p.actionProgress);
  const v = choreo(c, L.plan, L.stage.G);
  const posed = L.stage.pose(v);
  const nodes = posed.nodes;
  const done = p.actionProgress >= 1;
  const reg = L.plan === 'registered';
  const tagP = {
    sent: reg ? seg(c, ...TAGS.sent) : 0,
    outcome: done ? seg(c, ...(reg ? TAGS.outcome : TAGS.draft)) : 0,
  };
  if (L.tags['tag-sent']) nodes['tag-sent'] = {opacity: r(tagP.sent, 3)};
  if (L.tags['tag-outcome']) nodes['tag-outcome'] = {opacity: r(tagP.outcome, 3)};
  const noteP = done ? seg(u, ...NOTES) : 0;
  L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
  const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
  const S = L.s;
  const W2 = q => (q ? {x: r(L.ox + q.x * S), y: r(L.oy + q.y * S)} : null);
  const sem = posed.semantic;
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), plan: L.plan, finalState: p.finalState,
      handA: W2(sem.handA), handB: W2(sem.handB), pen: W2(sem.pen), sigTip: W2(sem.sigTip),
      penGrip: W2({x: sem.pen.x + Math.cos(v.pen.ang * Math.PI / 180) * 124 * 0.36, y: sem.pen.y + Math.sin(v.pen.ang * Math.PI / 180) * 124 * 0.36}),
      letter: W2(sem.letter), letterGrip: W2(sem.letterGrip), stamp: W2(sem.stamp), stampGrip: W2(sem.stampGrip), refBox: W2(sem.refBox),
      headPx: r(L.headPx, 1), textColumn: Boolean(L.col), penHeld: v.penHeld, sig: r(v.sig, 3), docAt: v.docAt, stampAt: v.stampAt, landed: v.landed,
      referenced: v.referenced, refShown: r(v.refShown, 3), markP: sem.markP, calAllOpen: sem.calAllOpen, trayLit: r(v.lit, 3),
      tags: {sent: r(tagP.sent, 3), outcome: r(tagP.outcome, 3)},
      notes: r(noteP, 3),
      allReached: sem.allReached,
      actionCapped: p.actionProgress < 1 && cRaw > p.actionProgress,
      labelsClear: L.labelsClear, clashes: L.clashes, fitted: L.fitted, truncated: L.truncated, textPx: L.textPx, share: L.share, scale: r(L.s, 3), textMul: r(L.m, 2), tsMax: L.tsMax,
      tagLeads: Object.values(L.tags).map(t => r(t.lead, 1)),
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
    slug: 'civil-claim-03-story',
    title: 'Filing a claim — a signed filing enters a registry tray and is stamped with a reference',
    titleEs: 'Presentación de demanda — Microescena con objetos y actores',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Presentación de demanda',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a registry counter. Party A signs a written filing with supplied contents and pushes it out of her drafts tray along a groove track into the registry intake tray. The clerk takes a reference stamp and presses it on the filing’s blank reference box: the supplied (fictional) reference appears, and an entry glyph drops into the supplied day of the registry calendar. In the alternative configured state the filing stays an unfiled draft in Party A’s tray and its reference box stays blank. No filing rule, fee, court, deadline or effect of registering is stated.',
    tags: ['filing a claim', 'written filing', 'registry', 'reference', 'stamp', 'signature', 'tray', 'calendar', 'case file', 'draft'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/presentacion-demanda.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: FD_STRINGS,
  scene,
});
