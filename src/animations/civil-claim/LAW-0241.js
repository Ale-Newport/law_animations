/**
 * LAW-0241 — Requerimiento previo · story
 *
 * Storyboard (side view of one office: Party A seated at the left end of a long
 * table, Party B at the right end; the case file stands on a shelf above
 * Party A; the calendar strip — the response space — hangs folded on the wall
 * above the table; the action clock c runs from u = 0.15 to u = 0.80):
 *  0.00–0.15  rest: the letter (supplied reference, contents and date) stands
 *             on its sled in front of Party A; the pen lies on the table; B's
 *             tray and A's reply pocket are empty; names, labels and the key
 *             are readable.
 *  0.15–0.42  Party A picks up the pen, signs the letter, puts the pen down and
 *             pushes the sled onto the groove track (hands on SOLVED points:
 *             the pen's grip, then the letter's left edge).
 *  0.42–0.73  the letter slides along the track into Party B's tray; as it
 *             lands the response space opens: the calendar unfolds day by day
 *             (supplied day labels) and A's reply pocket lights up (neutral).
 *             finalState "reply-received": B tears the reply slip off the
 *             letter, lifts it clear of the tray's lip (still behind the lip
 *             while it rises) and lets go: it drops onto the return rail, runs
 *             back under the table top (never above it) and drops into A's
 *             pocket, and a paper glyph
 *             drops into the supplied day's calendar slot.
 *             finalState "reply-pending": nothing comes back; the pocket and
 *             every calendar slot stay empty (neutral dashed outlines).
 *  0.73–1.00  hold: stage tags (sent · in B's tray · reply received on the
 *             supplied day / reply pending), editorial callouts and the
 *             "as supplied · no conclusion drawn" key. No period, effect
 *             of silence or consequence is stated.
 * @module animations/civil-claim/LAW-0241
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {noteCallout, placeClear} from '../roles/kits/mediation-labels.js';
import {
  RP_DEFAULTS, RP_STRINGS, partiesField, documentsField, datesField, stagesField, propLabelProps,
  partyCaption, looksOf, outcomeText, gchip, keyChip, hit, claimStage, solveStage, choreo, placeTag, needsTextColumn,
} from './kits/requerimiento-previo.js';

const ID = 'LAW-0241';
const DURATION = 6000;
const C0 = 0.15, C1 = 0.8;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TAGS = {sent: [0.47, 0.53], delivered: [0.63, 0.69], outcome: [0.975, 1]};
const NOTES = [0.8, 0.86];
/** base text size (design units) per layout: key text ≥ 19.5 px at 1080p */
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
/** distance between the two seats (stage units) per layout: a real re-layout, not a scaled copy */
const SEATS = {landscape: 1360, square: 940, portrait: 780};
/** letter aspect cap (height / width) and seat spread when a wide letter needs a longer route */
const ASPECT = {landscape: 0.95, square: 1.0, portrait: 1.3};
const GROW = {landscape: 640, square: 80, portrait: 0};
const CAL_COLS = {landscape: null, square: null, portrait: 2};
/** smallest stage scale (people and props size) before long text steps down */
const S_MIN = {landscape: 0.8, square: 0.5, portrait: 0.5};
const TARGETS = ['letter', 'calendar', 'replyTray'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  actorLabels: obj('Chip captions under each party (empty = "name · role")', {a: str('Caption for Party A', 60), b: str('Caption for Party B', 60)}),
  objectLabels: obj('Labels printed on the props', propLabelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the final hold: a reply comes back into the supplied response space, or no reply is in the tray. No legal effect is inferred', ['reply-received', 'reply-pending']),
};

const defaultParams = {
  parties: RP_DEFAULTS.parties,
  documents: RP_DEFAULTS.documents,
  stages: RP_DEFAULTS.stages,
  dates: RP_DEFAULTS.dates,
  actorLabels: {a: '', b: ''},
  objectLabels: RP_DEFAULTS.labels,
  actionProgress: 1,
  annotations: [{target: 'calendar', text: 'The response space opens as the letter lands'}],
  finalState: 'reply-received',
};

/** Resolved stage params (the story's prop labels live in objectLabels). */
const stageParams = p => ({...p, labels: p.objectLabels});

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    // callouts go in free space beside their targets; when one cannot be placed clear of the scene and its
    // labels, a band is reserved above the scene for numbered callouts (the scene shrinks a little)
    const flowFor = (col, first) => {
      let L = first || compose(ctx, 0, false, 1, col);
      if (!L.fitted) { const L2 = compose(ctx, 0, false, 0.84, col); if (L2.fitted) L = L2; }
      if (L.notesClear) return L;
      // band beside the scene (wide frames) or above it: the one keeping the larger text, then larger scene
      const opts = [compose(ctx, L.noteBandNeed, false, 1, col)];
      if (ctx.view.shape === 'landscape' && !col) opts.push(compose(ctx, L.noteBandNeed, true));
      let ok = opts.filter(q => q.fitted);
      if (!ok.length) ok = [compose(ctx, L.noteBandNeed, false, 0.84, col)].filter(q => q.fitted);
      return (ok.length ? ok : opts).reduce((a, b) => (b.m > a.m + 1e-3 || (Math.abs(b.m - a.m) < 1e-3 && b.s > a.s) ? b : a));
    };
    // square and tall frames: when printing the long supplied texts on the props would shrink the people (or not
    // fit at all), the texts move to a right-hand column (LAW-0179/0191 fallback)
    const L0 = compose(ctx, 0);
    // (the column is a fallback: only when the stage with its printed texts fails a floor — see needsTextColumn)
    const floors = {head: 52, frameW: ctx.view.shape === 'portrait' ? 0.71 : 0.6};
    let Lc = null;
    if (needsTextColumn(L0, floors)) {
      Lc = flowFor(true);
      if (Lc.fitted && Lc.headPx >= 52) return Lc;
    }
    const L1 = flowFor(false, L0);
    // (also when the stage's own tags cannot all stand clear of printed text)
    if (!L1.tagsClear) {
      Lc = Lc || flowFor(true);
      if (Lc.fitted && Lc.headPx >= 52 && Lc.tagsClear) return Lc;
    }
    return L1;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

function compose(ctx, noteBand, side = false, lab = 1, col = false) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const pxPer0 = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const LB = B * lab; // label size (long supplied labels may step down to ~16 px when nothing else fits)
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const plan = p.finalState === 'reply-pending' ? 'pending' : 'received';
  const looks = looksOf(ctx, p);
  const sp = stageParams(p);
  const W = SEATS[shape];
  const chipMax = col ? (D.w - Math.round(D.w * (shape === 'portrait' ? 0.4 : 0.27)) - 44) / 2 : shape === 'portrait' ? D.w * 0.47 : shape === 'square' ? D.w * 0.46 : 520;
  const cap = i => (i === 0 ? p.actorLabels.a : p.actorLabels.b) || partyCaption(p, i);
  const probe = showKey ? [0, 1].map(i => gchip(ctx, cap(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: LB, minSize: LB, maxLines: 6})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 14 : 6;
  const probeKey = showKey ? keyChip(ctx, {x: 0, y: 0, maxWidth: shape === 'landscape' ? 330 : D.w - 16, size: Math.max(LB, 16.2 / pxPer0)}) : null;
  // the key sits between the two name chips when there is room (no extra band), else in a top band
  const keyMid = probeKey && probe.length ? keyChip(ctx, {x: 0, y: 0, maxWidth: D.w - 64 - probe[0].box.w - probe[1].box.w, size: Math.max(LB, 16.2 / pxPer0), maxLines: 3}) : null;
  const keyInBand = Boolean(keyMid && !keyMid.fit.truncated && keyMid.box.h <= chipBand - 10 + B && D.w - 64 - probe[0].box.w - probe[1].box.w >= B * 6);
  // wide frames keep the callout band beside the scene (a column on the right), others above it
  const sideNotes = Boolean(noteBand) && side && shape === 'landscape';
  // (a callout band above the scene shares its row with the key: the key at the right, the callouts at the left)
  const shareBand = Boolean(noteBand) && !sideNotes && Boolean(probeKey) && showAll;
  const nCols = p.annotations.length > 1 && shape === 'square' ? 2 : 1;
  const noteW0 = shareBand ? D.w - 16 - probeKey.box.w - 24 : 0;
  if (shareBand) {
    const hs = p.annotations.map((a, i) => gchip(ctx, `${i + 1}  ${a.text}`, {x: 0, y: 0, anchor: 'start', maxWidth: (noteW0 - (nCols - 1) * 14) / nCols, size: LB * 0.96, minSize: LB * 0.96, maxLines: 9}).box.h);
    noteBand = Math.max((nCols > 1 ? Math.max(...hs) : hs.reduce((a, b) => a + b + 10, -10)) + 16, probeKey.box.h + 14);
  }
  const keyBand = probeKey && !shareBand && ((shape !== 'landscape' && !keyInBand) || noteBand) ? probeKey.box.h + 14 : 0;
  const sideW = sideNotes ? Math.min(330, D.w * 0.17) : 0;
  // (col: long supplied texts leave the props — the letter, the coupon and the prop labels become a right-hand
  // text column; the props keep their shapes and filler lines. Used when printing them would shrink the people)
  const colW = col ? Math.round(D.w * (shape === 'portrait' ? 0.4 : shape === 'landscape' ? 0.24 : 0.27)) : 0;
  const colTexts = col && showAll ? [`${p.documents.letter.ref} · ${p.documents.letter.title}`, p.dates.sent, p.documents.replySlip, p.objectLabels.calendar, p.objectLabels.inTray, p.objectLabels.replyTray].filter(Boolean) : [];
  const colX = D.w - 8 - colW;

  const sol = solveStage(ctx, {
    B, availW: D.w - 16 - (sideNotes ? sideW + 20 : 0) - (col ? colW + 20 : 0), availH: D.h - keyBand - (sideNotes ? 0 : noteBand) - chipBand - 12, sMin: S_MIN[shape],
    // (height-bound wide frames: a longer table fills the width without shrinking the people)
    preferWide: shape === 'landscape',
    modes: {landscape: [['middle', 'cabinet', W], ['wide', 'cabinet', W], ['middle', 'cabinet', W + 200], ['middle', 'cabinet', W + 400]], square: [['above', 'shelf', W], ['above', 'shelf', 800], ['wide', 'cabinet', W]], portrait: [['above', 'shelf', W]]}[shape],
    opts: {prefix: 'st', railClear: true, compact: col, peopleK: col ? 1.25 : 1, slipWordK: 1, wallPad: 0.5, p: sp, looks, showText: showAll, markIdx: p.dates.replyDay, calCols: CAL_COLS[shape], aspect: ASPECT[shape], grow: GROW[shape], tight: shape !== 'landscape', slotK: shape === 'portrait' ? 2.6 : 1.6, lwK: shape === 'landscape' ? 12.4 : shape === 'square' ? 9 : 10, route: col ? 200 : shape === 'landscape' ? 460 : 100},
  });
  const stage = sol.stage, s = sol.s, m = sol.m, tsMax = sol.tsMax, fitted = sol.fitted;
  const E = stage.ext;
  const ox = (D.w - (sideNotes ? sideW + 20 : 0) - (col ? colW + 20 : 0) - E.w * s) / 2 - E.x * s;
  // floor line: the stage sits on the chip band; free height goes above (tags, key)
  // (tall frames: the stage and its name row are centred in the free height under the top band, not left at its
  // bottom with the upper part of the frame empty)
  const oy0 = D.h - chipBand - 4;
  const topFree = oy0 + E.y * s - (8 + keyBand + (sideNotes ? 0 : noteBand) + 8);
  const oy = shape === 'portrait' ? oy0 - Math.max(0, topFree) / 2 : oy0;
  const M = q => ({x: ox + q.x * s, y: oy + q.y * s});
  const Wd = stage.G.W;
  const Mb = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
  const G = stage.G;
  const bounds = {x: 6, y: 6, w: D.w - 12 - (col ? colW + 14 : 0), h: D.h - 12};
  // the text column (top to bottom, under the key band)
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
  // (col mode: stage tags and callouts become numbered entries in the column, each number marking its element)
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

  // ---- occupied boxes at the hold (design units)
  const bx = stage.boxes;
  const occupied = [bx.personA, bx.personB, bx.file, bx.shelf, bx.cal, bx.letterEnd, bx.pocket, bx.slipIn, bx.slipPath, bx.trayAt].map(Mb);
  // the coupon's ride along the return rail (a tall coupon stands above the table top as it passes)
  const rideBox = plan === 'received' ? Mb({x: G.PX - G.CW / 2 - 6, y: G.rail - G.slipH - 6, w: G.RS - G.PX + G.CW + 12, h: G.slipH + 12}) : null;
  if (rideBox) occupied.push(rideBox);
  // the pen at rest and A's resting arm
  occupied.push(Mb({x: 20, y: G.top - 34, w: 180, h: 34}));
  // the letter's sled under the letter in B's tray and the tray's own outline, with a margin (tags keep off every
  // drawn part of a prop, not only off its printed text)
  occupied.push(Mb({x: G.X1 - G.LW / 2 - 4, y: G.letterBottom - 4, w: G.LW + 8, h: 34}));
  // (the tray's back rises LH·0.45 over the table: its outline, with a margin)
  occupied.push(Mb({x: G.X1 - G.trayW / 2 - 8, y: G.top - 12 - G.LH * 0.45 - 8, w: G.trayW + 16, h: 12 + G.LH * 0.45 + 16}));
  const labelBoxes = [];
  const chips = [];
  if (showKey) {
    [0, 1].forEach(i => {
      const x = M({x: i ? Wd : 0, y: 0}).x;
      const w = probe[i].box.w;
      const cx = clamp(x, 8 + w / 2, (col ? colX - 14 : D.w - 8) - w / 2);
      const c = gchip(ctx, cap(i), {x: cx, y: oy + 8, anchor: 'middle', maxWidth: chipMax, size: LB, minSize: LB, maxLines: 6, name: `chip-${i ? 'b' : 'a'}`});
      chips.push(c);
      occupied.push(c.box);
      labelBoxes.push({...c.box, id: `chip${i}`});
    });
  }
  let key = null;
  if (probeKey) {
    // (the key is as large as the supplied text on the props, never larger: it is a caption, not content)
    const keySize = Math.max(Math.min(LB * 0.96, stage.G.ts * s), 16.2 / pxPer0);
    const cands = (shareBand ? [[col ? colX - 14 : D.w - 8, 8, 'end'], [8, 8, 'start']] : [[8, 8, 'start'], [col ? colX - 14 : D.w - 8, 8, 'end']]).map(([x, y, anchor]) => keyChip(ctx, {x, y, anchor, maxWidth: shape === 'landscape' ? 330 : D.w - 16, size: keySize}));
    if (keyInBand && chips.length === 2) {
      const gx0 = chips[0].box.x + chips[0].box.w + 16, gx1 = chips[1].box.x - 16;
      cands.unshift(keyChip(ctx, {x: (gx0 + gx1) / 2, y: oy + 8, anchor: 'middle', maxWidth: Math.max(B * 6, gx1 - gx0), size: keySize, maxLines: 3}));
    }
    key = placeClear(cands, occupied, bounds, 6);
    occupied.push(key.box);
    labelBoxes.push({...key.box, id: 'key'});
  }

  // ---- stage tags: each beside its own element, with a short leader to it
  // design units → px at 1080p (tag leaders stay within 40 px of their element)
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const tags = {};
  const tagMax = shape === 'portrait' ? D.w * 0.5 : 440;
  const addTag = (name, text, anchors, color) => {
    if (col) {
      // the marker sits on the first anchor that no placed label covers
      const at = anchors.find(q => !labelBoxes.some(b => q.x > b.x - 20 && q.x < b.x + b.w + 20 && q.y > b.y - 20 && q.y < b.y + b.h + 20)) || anchors[0];
      const t = legendEntry(name, text, at, color);
      labelBoxes.push({...t.markBox, id: `${name}-mark`});
      tags[name] = t;
      return;
    }
    // the first anchor (a point on the tag's own element) whose tag clears everything wins
    let t = null;
    // an anchor already covered by a placed label is skipped (its dot would sit under that label)
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
    addTag('tag-sent', p.stages.sent, [M({x: G.X0, y: G.top - 4}), M({x: G.X0 - G.LW / 2 + 20, y: G.top - 4}), M({x: G.X0 + G.LW / 2, y: G.top - 4}), M({x: G.X0 - G.LW / 2 - 30, y: G.top - 4}), M({x: 210, y: G.top - 4}), M({x: G.X1 - G.LW / 2 - 30, y: G.top - 4}), M({x: G.X1 - G.LW / 2 + 4, y: G.letterTop + G.LH * 0.3}), M({x: G.X1 - G.LW / 2 + 24, y: G.letterTop + 4})], th.inkSoft);
    const pk = Mb(bx.pocket);
    // (the outcome tag only shows once the slip rests in the pocket: the ride's path is free again by then)
    const ri = rideBox ? occupied.indexOf(rideBox) : -1;
    if (ri >= 0) occupied.splice(ri, 1);
    addTag('tag-outcome', outcomeText(p, plan), [{x: pk.x + pk.w - 2, y: pk.y + pk.h * 0.5}, {x: pk.x + pk.w - 2, y: pk.y + 6}, {x: pk.x + pk.w * 0.5, y: pk.y + pk.h - 2}, {x: pk.x + 2, y: pk.y + pk.h * 0.5}, {x: pk.x + pk.w * 0.7, y: pk.y + 2}, {x: pk.x + pk.w - 2, y: pk.y + pk.h * 0.8}, M({x: G.PX + G.CW * 0.3, y: G.slipRest.y - G.slipH + 2}), M({x: G.PX - G.CW * 0.3, y: G.slipRest.y - G.slipH + 2})], th.accent2);
    if (ri >= 0) occupied.push(rideBox);
    addTag('tag-delivered', p.stages.delivered, [M({x: G.X1 - G.trayW / 2 - 4, y: G.lipTop + 8}), M({x: G.X1 - G.LW / 2, y: G.letterTop + 20}), M({x: G.X1 + G.LW / 2, y: G.letterTop + 30}), M({x: G.X1 + G.trayW / 2 - 4, y: G.lipTop + 8}), M({x: G.X1, y: G.letterTop + 3})], th.accent2);
  }

  // ---- editorial callouts in free space; the leader reaches the real target without crossing a label
  const notes = [];
  let notesClear = true, noteBandNeed = 0;
  if (showAll) {
    const tgt = {
      letter: M({x: G.X1 - G.LW / 2 + 10, y: G.letterTop + G.LH * 0.35}),
      calendar: M({x: bx.cal.x + bx.cal.w * 0.5, y: bx.cal.y + bx.cal.h}),
      replyTray: M({x: G.PX, y: G.rail - 20}),
    };
    // band mode marks each target with its number beside (not on) the element
    const pkB = Mb(bx.pocket);
    // (the calendar's number sits on the strip's own top-right corner: never in empty wall space)
    const mark = {letter: M({x: G.X1 - G.LW / 2 - 18, y: G.letterTop + 18}), calendar: M({x: bx.cal.x + bx.cal.w - 2, y: bx.cal.y + G.ts * 0.9 + 2}), replyTray: {x: pkB.x - B * 0.8, y: pkB.y + pkB.h * 0.4}};
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
    const colW = sideNotes ? sideW : ((shareBand ? noteW0 : D.w - 16) - (cols - 1) * 14) / cols;
    const bandY0 = 8 + keyBand;
    for (const [i, a] of p.annotations.entries()) {
      const t = noteBand || col ? mark[a.target] : tgt[a.target];
      if (col) {
        const e = legendEntry(`note${i}`, a.text, t, th.ink);
        notes.push({node: e.node, box: e.box, fit: e.fit, frame: q => ({[`note${i}`]: {opacity: r(q, 3)}})});
        continue;
      }
      if (noteBand) {
        // band mode: a numbered callout in the band; the same number marks the target
        const col = cols > 1 ? i : 0;
        const y = cols > 1 || i === 0 ? bandY0 : notes[i - 1].box.y + notes[i - 1].box.h + 10;
        const n = gchip(ctx, `${i + 1}  ${a.text}`, {x: sideNotes ? D.w - 8 - sideW : 8 + col * (colW + 14), y, anchor: 'start', maxWidth: colW, size: LB * 0.96, minSize: LB * 0.96, maxLines: 9, fill: th.card, stroke: th.ink, color: th.ink, weight: 600, name: `note${i}-chip`});
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
      // (a callout keeps a clear margin round the faces, not just off them)
      const faceZones = [bx.headA, bx.headB].map(Mb).map(f => ({x: f.x - B * 1.2, y: f.y - B * 1.2, w: f.w + B * 2.4, h: f.h + B * 2.4}));
      const mw = shape === 'portrait' ? D.w * 0.62 : 460;
      const cands = [];
      for (let dy = -480; dy <= 480; dy += 24) for (let dx = -640; dx <= 640; dx += 40) cands.push({x: t.x + dx, y: t.y + dy});
      cands.sort((q1, q2) => Math.hypot(q1.x - t.x, q1.y - t.y) - Math.hypot(q2.x - t.x, q2.y - t.y));
      // one measured probe; candidate boxes are translations of it (cheap), only the winner is built
      // (a narrower, taller callout is tried when the wide one finds no free spot)
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
      const hs = p.annotations.map((a, i) => gchip(ctx, `${i + 1}  ${a.text}`, {x: 0, y: 0, anchor: 'start', maxWidth: colW, size: LB * 0.96, minSize: LB * 0.96, maxLines: 4}).box.h);
      noteBandNeed = (cols > 1 ? Math.max(...hs) : hs.reduce((a, b) => a + b + 10, 0)) + 16;
    }
  }
  const clashes = [];
  labelBoxes.forEach((b, i) => labelBoxes.forEach((c, j) => { if (j > i && hit(b, c, 2)) clashes.push(`${b.id}/${c.id}`); }));
  const labelsClear = clashes.length === 0;
  labelBoxes.push(...colChips.map((c, i) => ({...c.box, id: `col${i}`})));
  const truncated = [...stage.fits, ...colChips.map(c => c.fit), ...chips.map(c => c.fit), key && key.fit, ...Object.values(tags).map(t => t.fit), ...notes.map(n => n.fit)]
    .filter(f => f && f.truncated).map(f => f.full);
  // scene share of the design space (labels shown or hidden)
  // (a tag that could not be placed "clear" is only a problem when it lies over printed text: a prop that carries
  // text, or another label)
  // (the printed parts only: the letter's sheet above the tray, the tray's label plate)
  const textProps = [bx.slipIn, bx.pocket, bx.cal, bx.file, {x: G.X1 - G.LW / 2, y: G.letterTop, w: G.LW, h: G.LH * 0.75}, bx.trayPlate || bx.trayAt].map(Mb);
  const tagsClear = Object.entries(tags).every(([n, t]) => t.clear || (!textProps.some(z => hit(t.box, z, 2)) && !labelBoxes.some(b => b.id !== n && hit(t.box, b, 2))));
  return {tagsClear, col, colChips, headPx: bx.headA.w * s * pxPer0 * 0.85, fitted: fitted && colFits, stage, s, m, ox, oy, M, plan, chips, key, tags, notes, notesClear, noteBandNeed, labelsClear, clashes, truncated, faces: [Mb(bx.headA), Mb(bx.headB)], labelBoxes,
    textPx: r(stage.G.ts * s, 2), tsMax, share: {w: r(E.w * s / D.w, 3), h: r(E.h * s / D.h, 3)},
    // the stage's width as a share of the rendered frame's width
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
  const v = choreo(c, L.plan, L.stage.G, {reduced: ctx.reduced});
  const posed = L.stage.pose(v);
  const nodes = posed.nodes;
  const done = p.actionProgress >= 1;
  const tagP = {
    sent: seg(c, ...TAGS.sent),
    delivered: seg(c, ...TAGS.delivered),
    outcome: done ? seg(c, ...TAGS.outcome) : 0,
  };
  if (L.tags['tag-sent']) nodes['tag-sent'] = {opacity: r(tagP.sent, 3)};
  if (L.tags['tag-delivered']) nodes['tag-delivered'] = {opacity: r(tagP.delivered, 3)};
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
      handA: W2(sem.handA), handB: W2(sem.handB), pen: W2(sem.pen), penGrip: W2(sem.penGrip), sigTip: W2(sem.sigTip),
      letter: W2(sem.letter), letterGrip: W2(sem.letterGrip), slip: W2(sem.slip), slipGrip: W2(sem.slipGrip),
      textColumn: Boolean(L.col), penHeld: v.penHeld, sig: r(v.sig, 3), docAt: v.docAt, slipAt: v.slipAt, landed: v.landed,
      calOpen: sem.calOpen, calAllOpen: sem.calAllOpen, markP: sem.markP, pocketLit: r(v.lit, 3), pocketEmpty: r(v.pocketEmpty, 3),
      tags: {sent: r(tagP.sent, 3), delivered: r(tagP.delivered, 3), outcome: r(tagP.outcome, 3)},
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
    slug: 'civil-claim-01-story',
    title: 'Pre-claim request — a signed letter slides to the other party and opens a response space',
    titleEs: 'Requerimiento previo — Microescena con objetos y actores',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Requerimiento previo',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of an office table. Party A signs a pre-claim letter with supplied contents and pushes it along a groove track into Party B’s tray. As it lands a calendar strip unfolds day by day (supplied day labels) and Party A’s reply pocket lights up. With a supplied reply, Party B tears off the reply slip and sends it back along a return rail into Party A’s pocket, on the supplied day; with no reply the pocket and calendar slots stay empty. No period, effect of silence or consequence is stated.',
    tags: ['pre-claim request', 'letter', 'signature', 'tray', 'calendar', 'response space', 'reply slip', 'case file', 'party A', 'party B'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RP_STRINGS,
  scene,
});
