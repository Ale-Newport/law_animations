/**
 * LAW-0252 — Presentación de demanda · inspect
 *
 * Storyboard (context = the state produced by the story: the signed filing
 * stands in the registry intake tray with the supplied (fictional) reference
 * stamped in its reference box, the stamp is back on its pad and the registry
 * calendar shows the entry glyph on the supplied day. The context keeps its
 * place and full size the whole time, with its real texts and labels; while
 * the lens is open it dims in place (LAW-0688/0204/0212 pattern). Long supplied
 * texts that the props cannot carry at 16 px move to a right-hand text column):
 *  0.00–0.20  context: stage, name tags, stage tags, the single editorial
 *             caption and the key.
 *  0.20–0.32  the context dims in place and a lens opens OVER it, on the side of
 *             the inspected item with the most room, clear of both faces, its
 *             short side >= 35 % of the frame's short side: a tight crop on the
 *             filing's reference box (focusTarget "reference") or on the two
 *             supplied day cells (focusTarget "entryDay"). The lens holds a REAL
 *             second copy of the stage at the same coordinates, enlarged (zoom
 *             >= 1.5×); the copy's printed text and the datum card's old value
 *             arrive with the window, in step with the context copy of the datum
 *             leaving; guides join the window to the item when they cross no
 *             label.
 *  0.44–0.66  the old value on the card is struck in grey, then only the datum
 *             changes inside the lens — the stamped reference is replaced by
 *             the supplied alternative (reference), or the entry glyph slides to
 *             the other supplied day (entryDay) — and the new value appears.
 *  0.66–0.72  the card text and the copy fade, the lens closes, the context
 *             brightens again.
 *  0.74–1.00  back in context the same change is applied; the outcome tag
 *             follows the datum; a neutral Δ changed-datum marker (accent 2) and
 *             a note (marker label, struck before value, after value) appear and
 *             stay for the hold. Seeking back before 0.44 restores the old datum
 *             exactly. Nothing states a filing rule, deadline, fee, court or
 *             effect; the registry and its references are fictional.
 * @module animations/civil-claim/LAW-0252
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, oneOf, num} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  FD_DEFAULTS, FD_STRINGS, partiesField, documentsField, datesField, stagesField, propLabelProps,
  partyCaption, looksOf, gchip, keyChip, hit, solveFiling, filingStage, choreo, placeTag,
  localizeDefaults, FD_COMMON_ES, FD_DEFAULTS_ES,
} from './kits/presentacion-demanda.js';
import {fitG} from './kits/civil-claim-art.js';

const ID = 'LAW-0252';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_ = {
  caption: [0.02, 0.08], open: [0.2, 0.32], oldText: [0.33, 0.37],
  strike: [0.44, 0.49], geo: [0.48, 0.58], newText: [0.555, 0.585], textOut: [0.66, 0.68], close: [0.675, 0.72],
  ctxGeo: [0.74, 0.8], tagOut: [0.74, 0.77], tagIn: [0.8, 0.84], marker: [0.82, 0.88],
  // (in step with the lens: the context copy of the datum and the texts under the window leave just before the
  // window and its copy appear — the copy is visible from ~40 % open, u ≈ 0.256 — and come back just after they go)
  hideOut: [0.244, 0.2555], hideIn: [0.681, 0.69],
};
/** how far the context dims in place while the lens is open (LAW-0688) */
const DIM = 0.6;
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
const S_MIN = {landscape: 0.6, square: 0.34, portrait: 0.45};
const STAGE_OPTS = {
  landscape: {aspect: 1.2, lwK: 11, route: 460, modes: [['middle', 'cabinet', 1200], ['middle', 'cabinet', 1500], ['wide', 'cabinet', 1300], ['above', 'shelf', 1100]]},
  square: {aspect: 0.9, lwK: 11, route: 220, modes: [['above', 'shelf', 900], ['above', 'shelf', 1050], ['above', 'shelf', 1200], ['above', 'cabinet', 1000], ['wide', 'cabinet', 1200]]},
  portrait: {aspect: 1.3, lwK: 10, route: 300, modes: [['above', 'shelf', 780], ['above', 'shelf', 700], ['above', 'shelf', 860]]},
};

const STRINGS = {
  en: {...FD_STRINGS.en, before: 'Before', after: 'After'},
  es: {...FD_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  labels: obj('Labels printed on the props', propLabelProps),
  focusTarget: oneOf('Detail that is enlarged and substituted: "reference" (the fictional reference stamped in the filing’s reference box; before/after values are the two references) or "entryDay" (the supplied day of the registry entry; before/after values name day labels of the window)', ['reference', 'entryDay']),
  beforeValue: str('Value shown before the substitution (as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum, as supplied)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens relative to the context (at least 1.5)', 1.5, 4), placement: oneOf('Where the lens sits relative to the scene', ['auto', 'right', 'bottom', 'top'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial annotation)', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  parties: FD_DEFAULTS.parties,
  documents: FD_DEFAULTS.documents,
  stages: FD_DEFAULTS.stages,
  dates: FD_DEFAULTS.dates,
  labels: FD_DEFAULTS.labels,
  focusTarget: 'reference',
  beforeValue: 'Ref. REG-0417 (fictional)',
  afterValue: 'Ref. REG-0418 (fictional)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'After the filing: the registry has stamped a reference', marker: 'Datum changed'},
};

/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...FD_COMMON_ES,
  labels: FD_DEFAULTS_ES.labels,
  beforeValue: 'Ref. REG-0417 (ficticia)',
  afterValue: 'Ref. REG-0418 (ficticia)',
  contextLabels: {context: 'Tras la presentación: el registro ha estampado una referencia', marker: 'Dato cambiado'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    return compose(ctx);
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** index of a day label in the window (whole-string match, case-insensitive), or -1 */
function dayIndex(p, value) {
  const n = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  return p.dates.window.findIndex(d => n(d) === n(value));
}

function compose(ctx) {
  // the rest/hold layout (context at full size with the hold's note beside or under it) and the lens placement
  // while the context yields room: every supplied or possible combination is tried; a fitted rest layout and a real
  // 1.5× zoom with clear guides first, then the larger full-size text, then the larger shrunk context
  const shape = ctx.view.shape;
  const pl = ctx.params.detailGeometry.placement;
  // (the lens opens over the dimmed context, on the side of its source with the most room)
  const places = pl !== 'auto' ? [pl] : ['right', 'left', 'top', 'bottom'];
  const modes = (shape === 'landscape' ? ['column'] : shape === 'square' ? ['column', 'band'] : ['band']);
  const opts = [];
  // (the rest layout does not depend on the lens placement: one stage solution per note mode)
  for (const nm of modes) {
    let sol = null;
    for (const q of places) { const L = composeAt(ctx, q, {noteMode: nm, sol}); sol = L.sol; opts.push(L); }
  }
  // (fitted, 1.5×+, lens >= 35 % of the frame's short side, clear guides, full-size text, larger context, larger lens)
  const score = q => [q.sol.fitted ? 1 : 0, q.sol.m >= 0.975 ? 1 : 0, q.zoom >= 1.5 ? 1 : 0, q.lensShort >= 0.35 ? 1 : 0, q.conesClear ? 1 : 0, Math.round(q.sol.m * 50), Math.round(q.s * q.stage.ext.w / 40), Math.round(q.lensShort * 50), q.zoom];
  const better = (a, b) => { const x = score(a), y = score(b); for (let k = 0; k < x.length; k++) { if (x[k] !== y[k]) return x[k] > y[k]; } return false; };
  let best = opts.reduce((a, b) => (better(b, a) ? b : a));
  // (reference mode: when the box alone is too flat to enlarge into a real lens, wider crops of the sheet are tried —
  // the date line above it, then the whole sheet)
  const good = q => q.sol.fitted && q.zoom >= 1.5 && q.lensShort >= 0.35;
  if (ctx.params.focusTarget !== 'entryDay' && !good(best)) {
    for (const crop of [1, 2]) {
      for (const nm of modes) { let sol = best.noteMode === nm ? best.sol : null; for (const q of places) { const L = composeAt(ctx, q, {noteMode: nm, sol, crop}); sol = L.sol; opts.push(L); } }
      best = opts.reduce((a, b) => (better(b, a) ? b : a));
      if (good(best)) break;
    }
  }
  // long supplied texts that cannot be printed on the props at 16 px: the right-hand text column
  if (!best.sol.fitted || !best.colFits) {
    const copts = [];
    // (the band is only tried when the column arrangement does not fit)
    for (const nm of ['column', 'band']) {
      let sol = null;
      for (const q of places) { const L = composeAt(ctx, q, {noteMode: nm, col: true, sol}); sol = L.sol; copts.push(L); }
      if (copts.some(q => q.sol.fitted && q.colFits && q.lensShort >= 0.35)) break;
    }
    const cb = copts.reduce((a, b) => (better(b, a) ? b : a));
    if (cb.sol.fitted && cb.colFits) best = cb;
  }
  best.options = opts.map(q => [q.noteMode, q.place, q.sol.fitted, r(q.zoom, 2), q.conesClear, r(q.sol.m, 2), r(q.lensShort, 2), q.kC]);
  // every printed text of the context and of the lens copy in its own named group, so that it can be hidden
  // whenever its current size would fall under 16 px (while the context yields room, while the lens grows)
  const owners = {};
  best.ctxTexts = nameTexts(best.stage.node, 'st-tx', owners);
  // (context texts the open lens window would lie over are hidden while it is open: a lens is never drawn over
  // visible text, dimmed or not — AUTHORING item 1; each is judged by the box of the prop it is printed on)
  best.lensHide = lensHidden(best, owners);
  // (the datum's context copy: the stamped reference text in the box — reference mode; the glyph is not a text)
  best.datumTexts = Object.entries(owners).filter(([, own]) => /-lt-refold$/.test(own || '')).map(([n]) => n);
  best.datumNewTexts = Object.entries(owners).filter(([, own]) => /-lt-refnew$/.test(own || '')).map(([n]) => n);
  best.lzTexts = nameTexts(best.lz.node, 'lz-tx');
  return best;
}

function composeAt(ctx, place, o = {}) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const small = B * 0.96;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf(ctx, p);
  const dayMode = p.focusTarget === 'entryDay';
  const side = place === 'right';
  // the datum: which day holds the entry glyph before/after (entryDay), or which reference the box carries (reference)
  const i0 = dayMode ? (dayIndex(p, p.beforeValue) >= 0 ? dayIndex(p, p.beforeValue) : p.dates.entryDay) : p.dates.entryDay;
  const i1 = dayMode ? (dayIndex(p, p.afterValue) >= 0 ? dayIndex(p, p.afterValue) : i0) : i0;
  const markIdx = Math.max(0, Math.min(p.dates.window.length - 1, i0));
  const changes = dayMode ? i1 !== i0 : p.beforeValue !== p.afterValue;

  // ---- context region / lens region
  const top = 8;
  const keyProbe = showKey ? keyChip(ctx, {x: 0, y: 0, maxWidth: D.w * 0.45, size: small}) : null;
  const capProbe = showAll && p.contextLabels.context ? gchip(ctx, p.contextLabels.context, {x: 0, y: 0, anchor: 'start', maxWidth: keyProbe ? D.w - 16 - keyProbe.box.w - 24 : D.w - 16, size: small, minSize: small, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600}) : null;
  const band = Math.max(keyProbe ? keyProbe.box.h : 0, capProbe ? capProbe.box.h : 0) + (keyProbe || capProbe ? 12 : 0);
  const cap = i => partyCaption(p, i);
  // the context keeps its place and size the whole time (dimmed in place while the lens is open); the lens window
  // opens over it on the side of the inspected item given by `place` (LAW-0688/0204/0212 pattern)
  const fullH = D.h - top - band - 8;
  // the hold's note: a column at the right (noteMode 'column') or a band at the bottom ('band')
  const noteMode = o.noteMode;
  // (o.col: the long supplied texts leave the props for a right-hand column — the note column — when printing them
  // on the props would not fit; the props keep their shapes and filler lines)
  const col = Boolean(o.col);
  // (square frames: a slightly wider column keeps the context to the left, so a lens beside it has room)
  const colW = Math.round(D.w * (shape === 'square' ? 0.4 : 0.36));
  const noteW = col && noteMode === 'column' ? colW : col ? D.w - 16 - colW - 24 : noteMode === 'column' ? Math.min(D.w * (shape === 'landscape' ? 0.24 : 0.17), 420) : D.w - 16;
  const colX = D.w - 8 - colW;
  const colChips = [];
  let colBottom = top + band;
  if (col && showAll) {
    for (const [i, t] of [p.documents.filing.title, p.documents.filing.dated, p.labels.calendar, p.labels.drafts, p.labels.intake].filter(Boolean).entries()) {
      const c = gchip(ctx, t, {x: colX, y: colBottom, anchor: 'start', maxWidth: colW, size: small, minSize: small, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: i === 0 ? 700 : 600, name: `coltx${i}`});
      colChips.push(c);
      colBottom = c.box.y + c.box.h + 10;
    }
  }
  const noteSize = showKey && noteMode !== 'none' ? noteBlock(ctx, p, {x: 0, y: 0, w: noteW, small, flow: noteMode === 'band'}) : null;
  const noteH = noteSize ? noteSize.box.h : 0;
  const ctxBox0 = col ? {x: 8, y: top + band, w: D.w - 16 - colW - 24, h: fullH - (noteMode === 'band' && noteSize ? noteH + 20 : 0)}
    : !noteSize ? {x: 8, y: top + band, w: D.w - 16, h: fullH}
    : noteMode === 'column' ? {x: 8, y: top + band, w: D.w - 16 - noteSize.box.w - 24, h: fullH}
      : {x: 8, y: top + band, w: D.w - 16, h: fullH - noteH - 20};
  const ctxBox = ctxBox0;
  const kC = 1;
  // name tags under the two parties: each up to about half the context's width
  const chipMax = ctxBox.w * 0.48;
  const nameProbe = showKey ? [0, 1].map(i => gchip(ctx, cap(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6})) : [];
  const chipBand = nameProbe.length ? Math.max(...nameProbe.map(c => c.box.h)) + 12 : 4;

  const sp = p;
  // (a static end state: a wider, shorter sheet than in the story keeps the stage low on wide frames)
  const SO = STAGE_OPTS[shape];
  // (reference mode: the box carries the supplied before value, and the after value is drawn in the same box, hidden
  // until the substitution)
  const refOpts = dayMode ? {} : {reference: p.beforeValue, altReference: p.afterValue, tightBox: true, refReal: true};
  const baseOpts = {p: sp, looks, showText: showAll, markIdx, slotK: dayMode ? 3.8 : 1.6, compact: col, peopleK: col ? 1.25 : 1, wallPad: 0.4, calCols: shape === 'portrait' && !dayMode ? 3 : null, aspect: SO.aspect, grow: 0, tight: shape !== 'landscape', lwK: SO.lwK, route: SO.route, ...refOpts};
  // (tall frames: the scene is as wide as the frame, and its people are drawn larger while the height allows it, at
  // the same text size — the scene fills the frame instead of leaving the wall above it bare)
  let sol = o.sol;
  if (!sol) {
    const solve = pk => solveFiling(ctx, {B, availW: ctxBox.w, availH: ctxBox.h - chipBand, sMin: S_MIN[shape], modes: SO.modes, opts: {prefix: 'st', ...baseOpts, peopleK: pk}});
    sol = {...solve(baseOpts.peopleK), peopleK: baseOpts.peopleK};
    if (shape === 'portrait' && !col && sol.fitted) {
      for (const pk of [1.7, 1.5, 1.3]) {
        const q = solve(pk);
        if (q.fitted && q.m >= sol.m - 1e-3 && q.stage.ext.h * q.s <= ctxBox.h - chipBand + 1) { sol = {...q, peopleK: pk}; baseOpts.peopleK = pk; break; }
      }
    }
  } else baseOpts.peopleK = sol.peopleK ?? baseOpts.peopleK;
  const stage = sol.stage;
  const s = sol.s;
  const E = stage.ext;
  const G = stage.G;
  // (the enlarged copy prints the reference in its box even on a compact sheet: the datum is legible in the lens)
  const lz = filingStage(ctx, {prefix: 'lz', ...baseOpts, showRefText: !dayMode, W: sol.W, ts: stage.G.ts * stage.k, tsMax: sol.tsMax, calMode: sol.calMode, fileMode: sol.fileMode});
  // (beside a text column the context keeps to the left edge: the lens's room is on the column's side)
  const ox = ctxBox.x + (col ? 0 : (ctxBox.w - E.w * s) / 2) - E.x * s;
  const oy = ctxBox.y + ctxBox.h - chipBand - 2;
  const M = q => ({x: ox + q.x * s, y: oy + q.y * s});
  const Mb = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
  const bx = stage.boxes;
  // (the lens copy is posed from the context at its own place and size: no scaling of the context)
  const f = 1, sL = s, oxL = ox, oyL = oy;
  const MbL = Mb;
  const ctxBoxL = ctxBox;
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  // px at 1080p of the context's smallest printed text at scale 1 (rest) — shrunk texts below 16 px are hidden
  const textPx = Math.min(...stage.fits.filter(Boolean).map(q => q.size)) * s * pxPer;

  // ---- the inspected item (source rect, design units): whole fields only
  let src;
  if (dayMode) {
    // a tight crop on the day cells between the two supplied days (both days and the glyph's move are inside)
    const cA = stage.cal.cellBox(Math.max(0, Math.min(p.dates.window.length - 1, i0)));
    const cB = stage.cal.cellBox(Math.max(0, Math.min(p.dates.window.length - 1, i1)));
    const x0 = Math.min(cA.x, cB.x), y0 = Math.min(cA.y, cB.y), x1 = Math.max(cA.x + cA.w, cB.x + cB.w), y1 = Math.max(cA.y + cA.h, cB.y + cB.h);
    // (a wide, short crop is extended down over the bare wall under the cells — never over a printed prop — so the
    // lens window is not a thin strip)
    let yb = y1 + 3;
    const printed = [bx.letterEnd, bx.trayAt, bx.file, bx.personA, bx.personB, bx.shelf];
    const clearTo = y => !printed.some(b => b.w > 0 && b.x - 4 < x1 + 3 && x0 - 3 < b.x + b.w + 4 && b.y - 4 < y && y1 < b.y + b.h);
    // (labels hidden: nothing printed can be cut, so the crop also takes the calendar's header above the cells)
    const ya = showAll ? y0 - 3 : Math.min(y0 - 3, bx.cal.y - 3);
    while (yb - ya < (x1 - x0 + 6) * (showKey ? 0.75 : 0.95) && clearTo(yb + 6)) yb += 6;
    src = MbL({x: x0 - 3, y: ya, w: x1 - x0 + 6, h: yb - ya});
  } else {
    // the filing's reference box (in the intake tray): a tight crop on the box, extended down over the blank foot of
    // the sheet and the tray's lip — never up over the printed date line, never over the tray's label plate — so the
    // window is not a thin strip
    const rb = bx.refEnd;
    let x0 = rb.x - 4, w0 = rb.w + 8;
    let ya = rb.y - 4;
    // (printed props and the heads; a hand or the counter's edge may lie in the crop — they are copied, not cut text)
    const printedP = [bx.trayPlate, bx.headA, bx.headB, bx.stamp];
    const clearDown = y => !printedP.some(b => b.w > 0 && b.x - 8 < x0 + w0 && x0 < b.x + b.w + 8 && b.y - 8 < y && ya < b.y + b.h);
    let yb = rb.y + rb.h + 4;
    while (yb - ya < w0 * 0.62 && (!showAll || clearDown(yb + 6))) yb += 6;
    // (a sheet that prints no text — compact sheet or labels hidden — may be cropped upwards too, up to its top)
    if (col || !showAll) while (yb - ya < w0 * 0.62 && ya - 6 > G.letterTop) ya -= 6;
    // (a long supplied reference makes the box a flat strip that no window can enlarge at a readable size: the crop
    // then takes the sheet's width — every printed line in it wholly inside, none cut by the rim — with the box at its foot)
    // (o.crop 1: the date line above the box too, across the sheet; 2: the whole sheet)
    if (o.crop >= 1) { x0 = G.X1 - G.LW / 2 - 4; w0 = G.LW + 8; ya = G.letterBottom + stage.filing.dateTop - 4; }
    if (o.crop >= 2) ya = G.letterTop - 4;
    src = MbL({x: x0, y: ya, w: w0, h: yb - ya});
  }
  // (nothing wider lies right under or over the inspected item: straight guides)
  const coneAvoid = null;

  // ---- the lens window: over the dimmed context, on the `place` side of the inspected item, clear of both faces;
  // as large as that room allows (>= 35 % of the frame's short side when it can be), zoom >= 1.5×
  const V = ctx.view;
  const S = Math.min(V.width, V.height) / Math.min(V.content.w / D.w, V.content.h / D.h); // frame short side (design)
  const faces0 = [Mb(bx.headA), Mb(bx.headB)].map(b => ({x: b.x - 1, y: b.y - 1, w: b.w + 2, h: b.h + 2}));
  // (the lens may rise into the top band over the context caption — hidden while the window lies over it — but never
  // over the key)
  const y0R = top + 2, y1R = D.h - 2, gapR = 6, xL = 2, xR = D.w - 2;
  const keyZone = keyProbe ? [{x: D.w - 8 - keyProbe.box.w - 10, y: 0, w: keyProbe.box.w + 18, h: top + keyProbe.box.h + 10}] : [];
  let regionBox = place === 'right' ? {x: src.x + src.w + gapR, y: y0R, w: xR - (src.x + src.w + gapR), h: y1R - y0R}
    : place === 'left' ? {x: xL, y: y0R, w: src.x - gapR - xL, h: y1R - y0R}
      : place === 'top' ? {x: xL, y: y0R, w: xR - xL, h: src.y - gapR - y0R}
        : {x: xL, y: src.y + src.h + gapR, w: xR - xL, h: y1R - (src.y + src.h + gapR)};
  // (a face inside the room cuts it: every combination of the four parts beside each face is tried, and the part
  // with the longest short side is kept)
  const cutBy = (R0, fc) => (!(R0.w > 0 && R0.h > 0) || !hit(R0, fc, 0) ? [R0] : [
    {x: R0.x, y: R0.y, w: fc.x - R0.x, h: R0.h}, {x: fc.x + fc.w, y: R0.y, w: R0.x + R0.w - fc.x - fc.w, h: R0.h},
    {x: R0.x, y: R0.y, w: R0.w, h: fc.y - R0.y}, {x: R0.x, y: fc.y + fc.h, w: R0.w, h: R0.y + R0.h - fc.y - fc.h},
  ].filter(q => q.w > 0 && q.h > 0));
  const roomOf = zones => {
    let rooms = [regionBox];
    for (const fc of zones) rooms = rooms.flatMap(R0 => cutBy(R0, fc));
    return rooms.length ? rooms.reduce((a, b) => (Math.min(b.w, b.h) > Math.min(a.w, a.h) ? b : a)) : {x: regionBox.x, y: regionBox.y, w: 0, h: 0};
  };
  // (the text column's chips are kept clear too when the room stays large enough without them)
  const colZones = colChips.map(c => ({x: c.box.x - 8, y: c.box.y - 8, w: c.box.w + 16, h: c.box.h + 16}));
  const roomA = roomOf([...faces0, ...keyZone, ...colZones]);
  // (the lens may lie over the text column's chips: those under the open window are hidden in step with it)
  regionBox = colZones.length && Math.min(roomA.w, roomA.h) >= 0.45 * S ? roomA : roomOf([...faces0, ...keyZone]);
  // (the datum card beside the copy or under it: whichever gives the larger window)
  const layoutFor = beside => {
    const cardW0 = beside ? Math.min(Math.max(regionBox.w * 0.42, small * 9), 560) : Math.max(small * 9, Math.min(regionBox.w - 32, 900));
    const fitVal = t => fitG(t, {maxWidth: cardW0 - small * 1.6, size: small, minSize: small, maxLines: 6, weight: 700});
    const vOld = fitVal(p.beforeValue), vNew = fitVal(p.afterValue);
    const cardH = showKey ? vOld.height + vNew.height + small * 2.2 : 0;
    const cardWn = showKey ? Math.max(vOld.width, vNew.width) + small * 1.6 : 0;
    const avW = regionBox.w - 16 - (beside ? cardWn + 14 : 0);
    const avH = regionBox.h - 16 - (beside ? 0 : cardH + (showKey ? 12 : 0));
    const zFit = Math.max(0, Math.min(avW / src.w, avH / src.h));
    const winFor = z => {
      const cw = src.w * z, ch = src.h * z;
      return beside ? {w: cw + cardWn + 30, h: Math.max(ch, cardH) + 16} : {w: Math.max(cw, cardWn) + 16, h: ch + (showKey ? cardH + 20 : 16)};
    };
    // the supplied zoom, raised when needed so the window's short side reaches ~45 % of the frame's short side
    let zNeed = p.detailGeometry.zoom;
    while (zNeed < 9 && Math.min(winFor(zNeed).w, winFor(zNeed).h) < 0.45 * S) zNeed += 0.1;
    const zoom = Math.min(zFit, Math.max(p.detailGeometry.zoom, zNeed));
    const wn = winFor(zoom);
    return {beside, vOld, vNew, cardH, cardWn, zoom, winFor, short: Math.min(Math.min(wn.w, regionBox.w - 1), wn.h)};
  };
  const lays = showKey ? [layoutFor(false), layoutFor(true)] : [layoutFor(false)];
  const lay = lays.reduce((a, b) => (b.short > a.short + 1 ? b : a));
  const {vOld, vNew, cardH, cardWn, zoom, winFor} = lay;
  const cardBeside = lay.beside;
  const zoomVsContext = zoom;
  const cont = {w: src.w * zoom, h: src.h * zoom};
  const win = {...winFor(zoom)};
  win.w = Math.min(win.w, Math.max(regionBox.w - 1, 0));
  // (placed in its room as close to the inspected item as it can be)
  const cxS = src.x + src.w / 2, cyS = src.y + src.h / 2;
  win.x = clamp(cxS - win.w / 2, regionBox.x + 0.5, regionBox.x + regionBox.w - 0.5 - win.w);
  win.y = clamp(cyS - win.h / 2, regionBox.y + 4, regionBox.y + regionBox.h - 4 - win.h);
  // (a window that would cut across a chip of the text column slides below it when its room allows)
  // (chips of the text column under the window are hidden while it is open — lensHidden — so it need not slide)
  const lensShort = Math.min(win.w, win.h) / S;
  const R = cardBeside ? {x: win.x + 8, y: win.y + (win.h - cont.h) / 2, w: cont.w, h: cont.h} : {x: win.x + (win.w - cont.w) / 2, y: win.y + 8, w: cont.w, h: cont.h};
  const card = cardBeside ? {x: R.x + R.w + 14, y: win.y + (win.h - cardH) / 2, w: win.x + win.w - 8 - (R.x + R.w + 14), h: cardH} : {x: win.x + 10, y: R.y + R.h + 8, w: win.w - 20, h: cardH};

  // ---- note block for the hold, in its own region beside or under the full-size context
  let note = null;
  if (noteSize) {
    const nx = col && noteMode === 'column' ? colX : col ? 8 : noteMode === 'column' ? ctxBox.x + ctxBox.w + 24 : 8 + Math.max(0, (D.w - 16 - noteSize.box.w) / 2);
    const ny = col && noteMode === 'column' ? colBottom + 6 : noteMode === 'column' ? top + band + Math.max(0, (fullH - noteH) / 2) : ctxBox.y + ctxBox.h + 20;
    note = noteBlock(ctx, p, {x: nx, y: ny, w: noteW, small, flow: noteMode === 'band'});
  }

  // ---- context labels: name chips, stage tags, caption, key
  const occupied = [bx.personA, bx.personB, bx.file, bx.shelf, bx.cal, bx.letterEnd, bx.trayAt, bx.stamp, bx.pen, bx.draftsPlate].map(Mb);
  occupied.push(Mb({x: 0, y: G.top - 70, w: 200, h: 70}));
  if (note) occupied.push({x: note.box.x - 8, y: note.box.y - 8, w: note.box.w + 16, h: note.box.h + 16});
  occupied.push(...colChips.map(c => c.box));
  let legendY = colBottom;
  const chips = [];
  if (showKey) {
    [0, 1].forEach(k => {
      const x = M({x: k ? G.W : 0, y: 0}).x;
      const w = nameProbe[k].box.w;
      let cx = clamp(x, ctxBox.x + w / 2, ctxBox.x + ctxBox.w - w / 2);
      cx = clamp(cx, ctxBox.x + w / 2, ctxBox.x + ctxBox.w - w / 2);
      cx = clamp(cx, 8 + w / 2, D.w - 8 - w / 2);
      const c = gchip(ctx, cap(k), {x: cx, y: oy + 6, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 6, name: `chip-${k ? 'b' : 'a'}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  let key = null, capChip = null;
  if (keyProbe) {
    key = keyChip(ctx, {x: D.w - 8, y: top, anchor: 'end', maxWidth: D.w * 0.45, size: Math.min(small, B * sol.m)});
    occupied.push(key.box);
  }
  if (capProbe) {
    capChip = gchip(ctx, p.contextLabels.context, {x: 8, y: top, anchor: 'start', maxWidth: key ? key.box.x - 24 - 8 : D.w - 16, size: small, minSize: small, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600, name: 'ctx-cap'});
    occupied.push(capChip.box);
  }
  const tags = {};
  const tagBounds = {x: ctxBox.x, y: ctxBox.y - band, w: ctxBox.w, h: ctxBox.h + band};
  const bestTag = (name, text, anchors0, color) => {
    let t = null;
    // an anchor already covered by another label (chip, key, caption or tag) is not used: its dot would sit under that label
    const labelled = [...chips.map(c => c.box), key && key.box, capChip && capChip.box, ...Object.values(tags).map(q => q.box)].filter(Boolean);
    const free = anchors0.filter(q => !labelled.some(b => q.x > b.x - 8 && q.x < b.x + b.w + 8 && q.y > b.y - 8 && q.y < b.y + b.h + 8));
    const anchors = free.length ? free : anchors0;
    for (const anchor of anchors) {
      const c = placeTag(ctx, {name, text, anchor, occupied, bounds: tagBounds, maxWidth: Math.min(ctxBox.w * 0.45, 420), size: small, color, maxLead: 38 / pxPer});
      if (!t || (c.clear && !t.clear)) t = c;
      if (c.clear) break;
    }
    return t;
  };
  const addTag = (name, text, anchors, color) => {
    const t = bestTag(name, text, anchors, color);
    occupied.push(t.box);
    tags[name] = t;
    return t;
  };
  // the outcome tag at the filing in the intake tray (registered · supplied day); in entry-day mode it follows the
  // datum (the before tag leaves, the after tag arrives in the same spot); in reference mode the day does not change
  const day = k => p.dates.window[Math.max(0, Math.min(p.dates.window.length - 1, k))];
  const beforeTag = `${p.stages.registered} · ${day(i0)}`;
  const afterTag = `${p.stages.registered} · ${day(i1)}`;
  const LE = Mb(bx.letterEnd);
  if (showKey) {
    // (the side facing the lens is the guides' corridor: the tag goes on the other sides first)
    const aOs = [M({x: G.X1 - G.LW / 2 + 3, y: G.letterTop + G.LH * 0.3}), M({x: G.X1 - G.LW / 2 + 24, y: G.letterTop + 3}), M({x: G.X1, y: G.letterTop + 3}), M({x: G.X1 - G.trayW / 2 - 4, y: G.lipTop + 8}), M({x: G.X1 - G.LW / 2 + 3, y: G.letterTop + G.LH * 0.6}), {x: LE.x + LE.w * 0.7, y: LE.y + 4}];
    addTag('tag-out0', beforeTag, aOs, th.accent2);
    if (dayMode && i1 !== i0) {
      const t0 = occupied.pop();
      tags['tag-out1'] = bestTag('tag-out1', afterTag, aOs, th.accent2);
      occupied.push(t0, tags['tag-out1'].box);
    }
    // (the handing-in, where the filing left Party A: at her drafts plaque on the counter's front)
    const dp = Mb(bx.draftsPlate);
    addTag('tag-sent', p.stages.sent, [{x: dp.x + dp.w + 2, y: dp.y + dp.h / 2}, {x: dp.x - 2, y: dp.y + dp.h / 2}, M({x: G.X0, y: G.top - 4}), {x: dp.x + dp.w / 2, y: dp.y + dp.h - 2}], th.inkSoft);
    // (beside the text column, a tag with no free spot beside its element becomes a numbered entry in the column,
    // its number marking the element beside the sheet, off its filler lines — as the pilot's joint stage tag)
    let n = 0;
    for (const [name, at, color] of [['tag-out0', {x: LE.x - small * 0.5, y: LE.y + small * 1.2}, th.accent2], ['tag-sent', {x: dp.x + dp.w + small * 0.8, y: dp.y + dp.h / 2}, th.inkSoft]]) {
      const t = tags[name];
      if (!col || !t || t.clear || (name === 'tag-out0' && tags['tag-out1'])) continue;
      n += 1;
      const text = name === 'tag-out0' ? beforeTag : p.stages.sent;
      const k = occupied.indexOf(t.box);
      if (k >= 0) occupied.splice(k, 1);
      const R0 = small * 0.62;
      const c = gchip(ctx, `${n}  ${text}`, {x: colX, y: legendY, anchor: 'start', maxWidth: colW, size: small, minSize: small, maxLines: 6, fill: th.card, stroke: color, color: th.ink, weight: 700, name: `${name}-chip`});
      legendY = c.box.y + c.box.h + 10;
      tags[name] = {node: g({name, opacity: 0},
        h('circle', {cx: r(at.x), cy: r(at.y), r: r(R0), fill: th.card, stroke: color, 'stroke-width': 2.5}),
        h('text', {x: r(at.x), y: r(at.y + small * 0.34), 'text-anchor': 'middle', 'font-size': r(small * 0.96), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(n)),
        c.node), box: c.box, fit: c.fit, clear: true, lead: 0, legend: true};
    }
  }

  // Δ marker on the changed item in context (clear of faces)
  let markerAt;
  if (dayMode) {
    const sb = stage.cal.slotBox(Math.max(0, Math.min(p.dates.window.length - 1, i1)));
    const q = M({x: sb.x + sb.w, y: sb.y});
    markerAt = {x: q.x - 4, y: q.y - 4};
  } else { const rb = Mb(bx.refEnd); markerAt = {x: rb.x + rb.w - 4, y: rb.y + 4}; }
  const markerR = small * 0.62;

  // geometry deltas for the substitution
  const calS = stage.cal;
  const slotA = calS.slotBox(markIdx), slotB = calS.slotBox(Math.max(0, Math.min(p.dates.window.length - 1, i1)));
  const markDelta = {x: slotB.x - slotA.x, y: slotB.y - slotA.y};

  const faces = [Mb(bx.headA), Mb(bx.headB)];
  const people = [MbL(bx.personA), MbL(bx.personB)];
  // (the two outcome tags share one spot and are never shown together)
  const labelBoxes = [...chips.map(c => c.box), ...Object.entries(tags).filter(([k]) => k !== 'tag-out1').map(([, t]) => t.box), key && key.box, capChip && capChip.box].filter(Boolean);
  // (a legend entry took the column's next slot: the note follows it)
  if (col && note && noteMode === 'column' && legendY > colBottom) note = noteBlock(ctx, p, {x: colX, y: legendY + 6, w: noteW, small, flow: false});
  const colFits = !col || Math.max(legendY, note ? note.box.y + note.box.h : 0) <= D.h - 8;
  const truncated = [...colChips.map(c => c.fit), ...stage.fits, vOld, vNew, ...(note ? note.fits : []), ...chips.map(c => c.fit), ...Object.values(tags).map(t => t.fit), key && key.fit, capChip && capChip.fit]
    .filter(f => f && f.truncated).map(f => f.full);
  // the open lens's guides (same geometry as frameScene at full opening) must cross no face and no label
  const cones = coneLines(src, {x: win.x, y: win.y, w: win.w, h: win.h}, coneAvoid);
  const inBx = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
  const holdsSrc = b => b.x <= src.x + 1 && b.y <= src.y + 1 && b.x + b.w >= src.x + src.w - 1 && b.y + b.h >= src.y + src.h - 1;
  // (the context stays in place with its labels, dimmed: heads, labels, the top band and the printed props count)
  // (heads with a margin: hair and ears reach past the head's circle)
  const grow = b => ({x: b.x - 14, y: b.y - 14, w: b.w + 28, h: b.h + 28});
  const blockers = [grow(MbL(bx.headA)), grow(MbL(bx.headB)), key && key.box, capChip && capChip.box, ...chips.map(c => c.box), ...Object.entries(tags).filter(([k]) => k !== 'tag-out1').map(([, t]) => t.box), ...colChips.map(c => c.box), ...(coneAvoid ? [coneAvoid] : []), ...[bx.letterEnd, bx.trayAt, bx.file, bx.cal].map(MbL).filter(b => !holdsSrc(b))].filter(Boolean);
  // (a day crop: the other days' cells are in the way too)

  const conesClear = cones.every(([a, b]) => { for (let i = 2; i < 38; i++) { const q = {x: a.x + (b.x - a.x) * i / 40, y: a.y + (b.y - a.y) * i / 40}; if (blockers.some(z => inBx(q, z))) return false; } return true; });
  return {kC, col, colChips, colFits, conesClear, coneAvoid, place, noteMode, ctxBoxL, oxL, oyL, sL, f, textPx, lensShort, S, pxPer, lensCtxT: `${T(oxL, oyL)} scale(${r(sL, 5)})`, contextShareV: stage.ext.w * s / D.w, stage, lz, s, ox, oy, M, sol, src, R, win, card, cont, zoom: zoomVsContext, vOld, vNew, note, chips, key, capChip, tags, markerAt, markerR,
    markDelta, dayMode, changes, i0, i1, markIdx, faces, people, labelBoxes, truncated, ctxBox, regionBox, small,
    labelsClear: labelBoxes.every((b, i) => labelBoxes.every((c, j) => i === j || !hit(b, c, 1)))};
}

/** Names of the context texts and labels that the open lens window covers (they are hidden while it is open). */
function lensHidden(L, owners) {
  const bx = L.stage.boxes, st = L.stage, Mb = b => ({x: L.ox + b.x * L.s, y: L.oy + b.y * L.s, w: b.w * L.s, h: b.h * L.s});
  const W = {x: L.win.x - 6, y: L.win.y - 6, w: L.win.w + 12, h: L.win.h + 12};
  const cellBox = n => { const m = /-ct(\d+)$/.exec(n || ''); return m && st.cal ? Mb(st.cal.cellBox(+m[1])) : null; };
  const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y}; };
  const boxOf = own => {
    if (!own) return null;
    if (/-cal-ct\d+$/.test(own)) return cellBox(own);
    if (/-cal/.test(own)) return Mb(bx.cal);
    if (/-cf$/.test(own)) return Mb(bx.file);
    // (the filing's printed texts: judged by the sheet's own box in the intake tray)
    if (/-(lt-body|letter|lt-refold|lt-refnew|lt-refmark)$/.test(own)) return Mb(bx.letterEnd);
    if (/-dplate/.test(own)) return Mb(bx.draftsPlate);
    if (/-tray/.test(own)) return Mb(bx.trayAt);
    return null;
  };
  const texts = Object.entries(owners).filter(([, own]) => { const b = boxOf(own); return !b || hit(b, W, 0); }).map(([n]) => n);
  const labels = [];
  L.chips.forEach((c, i) => { if (hit(c.box, W, 0)) labels.push(`chip-${i ? 'b' : 'a'}`); });
  for (const [k, t] of Object.entries(L.tags)) if (hit(t.box, W, 0)) labels.push(k);
  L.colChips.forEach((c, i) => { if (hit(c.box, W, 0)) labels.push(`coltx${i}`); });
  if (L.capChip && hit(L.capChip.box, W, 0)) labels.push('ctx-capg');
  return {texts, labels};
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  const {R, win, card, src, small} = L;
  const ctxT = `${T(L.ox, L.oy)} scale(${r(L.s, 5)})`;
  const lensT = L.lensCtxT;
  // datum card rows: old value (struck later) and new value
  const strike = L.vOld.lines.map((ln, k) => {
    const lw = ctx.measure(ln, L.vOld.size, 700, 'sans');
    const y = card.y + small * 0.6 + k * L.vOld.lineHeight + L.vOld.size * 0.42;
    return h('line', {x1: r(card.x + small * 0.7 - 3), x2: r(card.x + small * 0.7 + lw + 3), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': 3});
  });
  const newY = card.y + small * 0.6 + L.vOld.height + small * 0.8;
  const clipId = ctx.id('lens-clip');
  return g(null,
    g({name: 'ctx-stage', transform: ctxT}, L.stage.node),
    L.chips.map(c => c.node),
    Object.values(L.tags).map(t => t.node),
    L.capChip && g({name: 'ctx-capg', opacity: 0}, L.capChip.node),
    L.key && L.key.node,
    L.colChips.map(c => c.node),
    // lens: source outline, guides, window (bg, clipped enlarged copy, card, border)
    h('path', {name: 'lens-src', d: roundRectPath(src.x, src.y, src.w, src.h, 8), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
    h('line', {name: 'lens-coneA', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('line', {name: 'lens-coneB', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('defs', null, h('clipPath', {id: clipId}, h('rect', {name: 'lens-cliprect', x: R.x, y: R.y, width: R.w, height: R.h, rx: 14}))),
    g({name: 'lens-win', opacity: 0, 'data-occludes': 1},
      h('rect', {name: 'lens-shadow', x: win.x + 8, y: win.y + 12, width: win.w, height: win.h, rx: 22, fill: th.shadow}),
      h('rect', {name: 'lens-bg', x: win.x, y: win.y, width: win.w, height: win.h, rx: 22, fill: th.paper}),
      g({'clip-path': `url(#${clipId})`}, g({name: 'lens-content', opacity: 0}, g({name: 'lens-zoom'}, g({transform: lensT}, L.lz.node)))),
      L.card.h ? g({name: 'lens-card'},
        h('path', {d: roundRectPath(card.x, card.y, card.w, card.h, 12), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
        g({name: 'val-old', opacity: 0}, textBlock(L.vOld, {x: card.x + small * 0.7, y: card.y + small * 0.6, fill: th.ink, name: 'val-old-t'}), g({name: 'val-strike', opacity: 0}, strike)),
        g({name: 'val-new', opacity: 0}, textBlock(L.vNew, {x: card.x + small * 0.7, y: newY, fill: th.ink}))) : null,
      h('rect', {name: 'lens-border', x: win.x, y: win.y, width: win.w, height: win.h, rx: 22, fill: 'none', stroke: th.accent2, 'stroke-width': 5}),
    ),
    L.note && L.note.node,
    changedMarker(ctx, {name: 'ctx-marker', x: L.markerAt.x, y: L.markerAt.y, radius: L.markerR, opacity: 0}),
  );
}

/**
 * Wrap every <text> vnode of a tree in a named group; returns the names. `owners` (optional) receives, per name,
 * the nearest named ancestor group (the prop the text is printed on).
 */
function nameTexts(node, prefix, owners) {
  const names = [];
  const nameOf = n => (n && n.attrs && (n.attrs.name || n.attrs['data-node'])) || null;
  const walk = (n, owner) => {
    if (!n || typeof n !== 'object' || !n.children) return;
    const own = nameOf(n) || owner;
    n.children = n.children.map(c => {
      if (c && typeof c === 'object' && c.tag === 'text') {
        const name = `${prefix}${names.length}`;
        names.push(name);
        if (owners) owners[name] = own;
        return g({name}, c);
      }
      walk(c, own);
      return c;
    });
  };
  walk(node, null);
  return names;
}

/**
 * The hold's note: Δ marker with its label, the struck before value and the after value, laid out as a flow
 * (side by side when the width allows it — a short band under the context — otherwise stacked in a column).
 */
function noteBlock(ctx, p, o) {
  const th = ctx.theme;
  const {small} = o;
  const showAll = ctx.show('all');
  const Rr = small * 0.62;
  const nw = o.w, gap = 12;
  const itemMax = Math.max(small * 8, o.flow ? nw * 0.45 : nw);
  const labFit = showAll && p.contextLabels.marker ? fitG(p.contextLabels.marker, {maxWidth: itemMax - 2 * Rr - 10 - small * 1.2, size: small, minSize: small, maxLines: 3, weight: 700}) : null;
  const befFit = fitG(`${ctx.t.before}: ${p.beforeValue}`, {maxWidth: itemMax - small * 1.4, size: small, minSize: small, maxLines: 6, weight: 600});
  const aftFit = fitG(`${ctx.t.after}: ${p.afterValue}`, {maxWidth: itemMax - small * 1.4, size: small, minSize: small, maxLines: 6, weight: 700});
  const items = [
    {kind: 'lab', w: 2 * Rr + 10 + (labFit ? labFit.width + small * 1.2 : 0), h: Math.max(2 * Rr, labFit ? labFit.height + small * 0.8 : 0)},
    {kind: 'bef', w: befFit.width + small * 1.4, h: befFit.height + small * 1.0},
    {kind: 'aft', w: aftFit.width + small * 1.4, h: aftFit.height + small * 1.0},
  ];
  // flow layout
  let x = 0, y = 0, rowH = 0, maxW = 0;
  for (const it of items) {
    if (x > 0 && x + it.w > nw) { x = 0; y += rowH + 10; rowH = 0; }
    it.x = x; it.y = y; x += it.w + gap; rowH = Math.max(rowH, it.h); maxW = Math.max(maxW, it.x + it.w);
  }
  const totH = y + rowH;
  const ox = o.x, oy = o.y;
  const [li, bi, ai] = items;
  const befBox = {x: ox + bi.x, y: oy + bi.y, w: bi.w, h: bi.h}, aftBox = {x: ox + ai.x, y: oy + ai.y, w: ai.w, h: ai.h};
  const gy = oy + li.y + li.h / 2;
  const lab = labFit ? gchip(ctx, p.contextLabels.marker, {x: ox + li.x + 2 * Rr + 10, y: oy + li.y + (li.h - (labFit.height + small * 0.8)) / 2, anchor: 'start', maxWidth: itemMax - 2 * Rr - 10, size: small, minSize: small, maxLines: 3, fill: th.card, stroke: th.accent2, color: th.accent2, weight: 700, name: 'nb-label'}) : null;
  const strikeLines = befFit.lines.map((ln, k) => {
    const lw = ctx.measure(ln, befFit.size, 600, 'sans');
    const yy = befBox.y + small * 0.5 + k * befFit.lineHeight + befFit.size * 0.42;
    return h('line', {x1: r(befBox.x + small * 0.7 - 3), x2: r(befBox.x + small * 0.7 + lw + 3), y1: r(yy), y2: r(yy), stroke: th.inkSoft, 'stroke-width': 2.5});
  });
  return {
    node: g({name: 'note', opacity: 0},
      changedMarker(ctx, {x: ox + li.x + Rr, y: gy, radius: Rr}),
      lab && lab.node,
      g({name: 'nb-before'},
        h('path', {d: roundRectPath(befBox.x, befBox.y, befBox.w, befBox.h, 10), fill: th.card, stroke: th.inkFaint, 'stroke-width': 2}),
        textBlock(befFit, {x: befBox.x + small * 0.7, y: befBox.y + small * 0.5, fill: th.inkSoft}), strikeLines),
      g({name: 'nb-after'},
        h('path', {d: roundRectPath(aftBox.x, aftBox.y, aftBox.w, aftBox.h, 10), fill: th.card, stroke: th.accent2, 'stroke-width': 2.5}),
        textBlock(aftFit, {x: aftBox.x + small * 0.7, y: aftBox.y + small * 0.5, fill: th.ink}))),
    box: {x: ox, y: oy, w: maxW, h: totH},
    fits: [lab && lab.fit, befFit, aftFit].filter(Boolean),
  };
}

/** The two lens guides: from the inspected item's facing edge to the window's facing edge. */
function coneLines(src, W2, avoid) {
  const horiz = Math.abs((W2.x + W2.w / 2) - (src.x + src.w / 2)) > Math.abs((W2.y + W2.h / 2) - (src.y + src.h / 2));
  if (horiz) {
    // they leave the item's facing edge in its lower part (under the props above it) and meet the window
    const sx = W2.x > src.x ? src.x + src.w : src.x, wx = W2.x > src.x ? W2.x : W2.x + W2.w;
    const a1 = {x: sx, y: src.y + src.h * 0.45}, b1 = {x: sx, y: src.y + src.h * 0.95};
    return [[a1, {x: wx, y: Math.max(W2.y + 20, Math.min(W2.y + W2.h - 20, a1.y + 10))}], [b1, {x: wx, y: Math.max(W2.y + 40, Math.min(W2.y + W2.h - 20, b1.y - 10))}]];
  }
  const sy = W2.y > src.y ? src.y + src.h : src.y, wy = W2.y > src.y ? W2.y : W2.y + W2.h;
  if (avoid && W2.y > src.y && avoid.y >= src.y + src.h * 0.5) {
    // window below and a wider panel right under the item: the guides leave its sides above the panel and fan
    // outwards enough to pass beside the panel
    const y0 = src.y + src.h * 0.35, dy = Math.max(1, avoid.y - y0), span = wy - y0;
    const tl = src.x + (avoid.x - 6 - src.x) * span / dy, tr = src.x + src.w + (avoid.x + avoid.w + 6 - src.x - src.w) * span / dy;
    return [[{x: src.x, y: y0}, {x: Math.max(W2.x + 20, Math.min(W2.x + W2.w - 20, tl)), y: wy}], [{x: src.x + src.w, y: y0}, {x: Math.max(W2.x + 20, Math.min(W2.x + W2.w - 20, tr)), y: wy}]];
  }
  if (avoid && W2.y < src.y && avoid.y + avoid.h <= src.y + src.h * 0.5) {
    // window above and a wider panel right over the item (the calendar's header): mirrored
    const y0 = src.y + src.h * 0.65, dy = Math.max(1, y0 - (avoid.y + avoid.h)), span = y0 - wy;
    const tl = src.x + (avoid.x - 6 - src.x) * span / dy, tr = src.x + src.w + (avoid.x + avoid.w + 6 - src.x - src.w) * span / dy;
    return [[{x: src.x, y: y0}, {x: Math.max(W2.x + 20, Math.min(W2.x + W2.w - 20, tl)), y: wy}], [{x: src.x + src.w, y: y0}, {x: Math.max(W2.x + 20, Math.min(W2.x + W2.w - 20, tr)), y: wy}]];
  }
  return [[{x: src.x, y: sy}, {x: Math.max(W2.x + 20, Math.min(W2.x + W2.w - 20, src.x)), y: wy}], [{x: src.x + src.w, y: sy}, {x: Math.max(W2.x + 20, Math.min(W2.x + W2.w - 20, src.x + src.w)), y: wy}]];
}

/** Apply the datum (0 = before, 1 = after) to a posed stage's node record. */
function applyDatum(L, nodes, prefix, d, G) {
  if (!L.changes) return;
  const e = ease.inOutCubic(d);
  if (L.dayMode) {
    nodes[`${prefix}-cal-mark`] = {opacity: 1, transform: T(L.markDelta.x * e, L.markDelta.y * e)};
  } else {
    // the stamped reference is replaced in its box: the before value fades out, then the after value fades in (the
    // box and its stamp colour stay: only the datum changes)
    nodes[`${prefix}-lt-refold`] = {opacity: r(clamp(1 - e * 2), 3)};
    nodes[`${prefix}-lt-refnew`] = {opacity: r(clamp(e * 2 - 1), 3)};
  }
}

function frameScene(ctx, L, u) {
  const G = L.stage.G;
  // context and lens copy: the story's end state (registered, the reference stamped, the entry on the supplied day)
  const v = choreo(1, 'registered', G);
  const pc = L.stage.pose(v);
  const pl = L.lz.pose(v);
  const nodes = {...pc.nodes, ...pl.nodes};
  const dLens = seg(u, ...W_.geo);
  const dCtx = seg(u, ...W_.ctxGeo);
  applyDatum(L, nodes, 'st', dCtx, G);
  applyDatum(L, nodes, 'lz', dLens, G);
  if (L.capChip) nodes['ctx-capg'] = {opacity: r(seg(u, ...W_.caption), 3)};
  // the context stays in place at full size the whole time; it dims in place while the lens is open
  const cs = L.s;
  const txOp = px => r(clamp((px - 16.1) / 0.6), 3);
  const ctxTx = 1;
  // the changed datum is shown in ONE place at a time: its context copy (the stamped reference, the calendar glyph,
  // the outcome tag) leaves before the lens copy appears and, for a moved glyph, comes back only once the lens has
  // closed; context texts under the lens window leave and come back the same way
  const hideP = seg(u, ...W_.hideOut) * (1 - seg(u, ...W_.hideIn));
  const vis0 = 1 - hideP;
  const scaleOp = (n, k) => { const cur = nodes[n] || {}; nodes[n] = {...cur, opacity: r((cur.opacity ?? 1) * k, 3)}; };
  // (reference: the box stays stamped but its printed reference leaves while the lens shows it — the box never reads
  // as the after value before the substitution beat; entryDay: the glyph leaves while the lens shows it)
  if (L.dayMode) scaleOp('st-cal-mark', vis0);
  for (const n of L.datumTexts) nodes[n] = {opacity: r(vis0, 3)};
  for (const n of L.datumNewTexts || []) nodes[n] = {opacity: r(vis0, 3)};
  for (const n of L.lensHide.texts) nodes[n] = {opacity: r(vis0, 3)};
  // lens window
  const open = ease.inOutCubic(seg(u, ...W_.open));
  const close = ease.inOutCubic(seg(u, ...W_.close));
  const p = u < W_.close[0] ? open : 1 - close;
  // (the enlarged copy fades in as the window grows, from ~40 % open)
  const copyIn = clamp((open - 0.4) / 0.1);
  const copyOut = 1 - seg(u, W_.close[0], W_.close[0] + 0.006);
  const copy = u < W_.close[0] ? copyIn : copyOut;
  // (the window and its copy appear and leave together: no blank window over the scene)
  const winOp = copy;
  // (the context dims with the window, not before it)
  const dimOp = r(1 - DIM * copy, 3);
  nodes['ctx-stage'] = {opacity: dimOp};
  const {R, win, src} = L;
  const f = 0.35 + 0.65 * p;
  const cx = win.x + win.w / 2, cy = win.y + win.h / 2;
  const W2 = {x: cx - (win.w * f) / 2, y: cy - (win.h * f) / 2, w: win.w * f, h: win.h * f};
  const Rr = {x: cx + (R.x - cx) * f, y: cy + (R.y - cy) * f, w: R.w * f, h: R.h * f};
  const kz = Rr.w / src.w;
  // (the copy's printed text arrives with the window — the copy scales with the window, so a text wholly inside the
  // crop at full size is wholly inside it while it grows; a text under 16 px stays hidden)
  const lzTx = txOp(L.textPx * L.f * kz);
  for (const n of L.lzTexts) nodes[n] = {opacity: lzTx};
  const vis = p > 0.001 && winOp > 0.001;
  nodes['lens-win'] = {opacity: r(vis ? winOp : 0, 3)};
  nodes['lens-shadow'] = {x: r(W2.x + 8), y: r(W2.y + 12), width: r(W2.w), height: r(W2.h)};
  nodes['lens-bg'] = {x: r(W2.x), y: r(W2.y), width: r(W2.w), height: r(W2.h)};
  nodes['lens-border'] = {x: r(W2.x), y: r(W2.y), width: r(W2.w), height: r(W2.h)};
  nodes['lens-cliprect'] = {x: r(Rr.x), y: r(Rr.y), width: r(Rr.w), height: r(Rr.h)};
  nodes['lens-zoom'] = {transform: `${T(Rr.x - src.x * kz, Rr.y - src.y * kz)} scale(${r(kz, 5)})`};
  nodes['lens-content'] = {opacity: 1};
  nodes['lens-src'] = {opacity: vis ? r(winOp, 3) : 0};
  // guides: from the inspected item's corners to the window (facing sides)
  const horiz = Math.abs((W2.x + W2.w / 2) - (src.x + src.w / 2)) > Math.abs((W2.y + W2.h / 2) - (src.y + src.h / 2));
  const [[a1, a2], [b1, b2]] = coneLines(src, W2, L.coneAvoid);
  // (the guides join once the window has nearly reached its place: while it grows, lines to a small window would cut
  // across the props under the item)
  // (drawn only when they cross no label or printed prop of the dimmed context; the source outline always shows)
  const coneOp = vis && p >= 0.999 && L.conesClear ? r(winOp, 3) : 0;
  nodes['lens-coneA'] = {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: coneOp};
  nodes['lens-coneB'] = {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: coneOp};
  // datum card text: old value, strike, new value; everything leaves before the window closes
  const textOut = 1 - seg(u, ...W_.textOut);
  // (the card's old value arrives with the window: the card is never blank)
  const oldP = copy * textOut;
  const strikeP = seg(u, ...W_.strike);
  const newP = seg(u, ...W_.newText) * textOut;
  if (L.card.h) {
    nodes['val-old'] = {opacity: r(oldP, 3)};
    nodes['val-old-t'] = {fill: strikeP > 0.5 ? ctx.theme.inkSoft : ctx.theme.ink};
    nodes['val-strike'] = {opacity: r(strikeP, 3)};
    nodes['val-new'] = {opacity: r(newP, 3)};
  }
  // context tags: the outcome tag follows the datum (old leaves, then new arrives)
  // (the context's labels stay with it, dimmed in place with it while the lens is open)
  const labOp = dimOp;
  const hid = new Set(L.lensHide.labels);
  const labOf = n => r(labOp * (hid.has(n) ? vis0 : 1), 3);
  if (L.chips.length) for (const n of ['chip-a', 'chip-b']) nodes[n] = {opacity: labOf(n)};
  L.colChips.forEach((c, i) => { nodes[`coltx${i}`] = {opacity: labOf(`coltx${i}`)}; });
  // (the context caption leaves while the open window lies over it, in step with the window)
  if (L.capChip && hid.has('ctx-capg')) nodes['ctx-capg'] = {opacity: r(seg(u, ...W_.caption) * vis0, 3)};
  if (L.tags['tag-sent']) nodes['tag-sent'] = {opacity: labOf('tag-sent')};
  if (L.tags['tag-out0']) {
    // (the outcome tag names the entry day: in entry-day mode it is the changed datum's value text — it leaves before
    // the lens shows the datum and the after tag arrives once the context has changed; in reference mode it stays)
    nodes['tag-out0'] = {opacity: r(labOp * (L.tags['tag-out1'] ? vis0 * (1 - seg(u, ...W_.tagOut)) : (hid.has('tag-out0') ? vis0 : 1)), 3)};
    if (L.tags['tag-out1']) nodes['tag-out1'] = {opacity: r(u < W_.close[1] ? 0 : seg(u, ...W_.tagIn), 3)};
  }
  const mk = seg(u, ...W_.marker);
  nodes['ctx-marker'] = {opacity: r(L.changes ? mk : 0, 3)};
  if (L.note) nodes.note = {opacity: r(mk, 3)};
  const datum = dLens <= 0 ? 'before' : dLens >= 1 ? 'after' : 'changing';
  const ctxDatum = dCtx <= 0 ? 'before' : dCtx >= 1 ? 'after' : 'changing';
  const winBox = {x: W2.x, y: W2.y, w: W2.w, h: W2.h};
  const lensOn = vis && winOp > 0.05;
  const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
  const inside = (a, b) => a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
  return {
    nodes,
    semantic: {
      beat, lensOpen: r(p, 3), copy: r(copy, 3), bareCard: lensOn && copy < 0.5,
      datum, contextDatum: ctxDatum, focusTarget: ctx.params.focusTarget,
      zoom: r(L.zoom, 3), oldShown: r(oldP, 3), strike: r(strikeP, 3), newShown: r(newP, 3),
      markerShown: r(mk, 3), noteShown: r(mk, 3),
      refCtx: L.dayMode || !L.changes ? 'before' : dCtx <= 0 ? 'before' : dCtx >= 1 ? 'after' : 'changing', refLens: L.dayMode || !L.changes ? 'before' : dLens <= 0 ? 'before' : dLens >= 1 ? 'after' : 'changing',
      markIdxCtx: L.dayMode ? (dCtx >= 1 ? L.i1 : dCtx <= 0 ? L.i0 : null) : (dCtx >= 1 ? null : L.markIdx),
      lensCopyCoords: {src: {x: r(L.src.x, 1), y: r(L.src.y, 1)}, ctx: {x: r(L.oxL, 1), y: r(L.oyL, 1), s: r(L.sL, 4)}},
      contextScale: r(cs / L.s, 3), contextTextShown: ctxTx, copyTextShown: lzTx,
      lensClearOfPeople: !lensOn || L.people.every(q => !hit(winBox, q, 0)),
      lensClearOfFaces: !lensOn || L.faces.every(fc => !hit(winBox, fc, 0)),
      lensShort: r(L.lensShort, 3), lensShortNow: r(Math.min(winBox.w, winBox.h) / L.S, 3),
      contextDim: dimOp,
      sourceInContext: inside(L.src, L.ctxBoxL),
      cardInWindow: !L.card.h || inside(L.card, L.win),
      markerClearOfFaces: L.faces.every(fc => !hit({x: L.markerAt.x - L.markerR, y: L.markerAt.y - L.markerR, w: 2 * L.markerR, h: 2 * L.markerR}, fc, 2)),
      guidesOnSource: [a1, b1].every(q => q.x >= L.src.x - 1 && q.x <= L.src.x + L.src.w + 1 && q.y >= L.src.y - 1 && q.y <= L.src.y + L.src.h + 1),
      allReached: pc.semantic.allReached,
      labelsClear: L.labelsClear, truncated: L.truncated,
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(fc => !hit(b, fc, 0))),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-03-inspect',
    title: 'Filing a claim — inspecting the stamped reference: one supplied datum is substituted',
    titleEs: 'Presentación de demanda — Inspección y cambio de un dato',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Presentación de demanda',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The registry counter after the filing was handed in: the filing stands in the registry intake tray with a fictional reference stamped in its reference box, and the registry calendar shows the entry on the supplied day. A lens enlarges the reference box (or the calendar days); one supplied datum is substituted — the stamped reference is replaced by the supplied alternative, or the entry moves to the other supplied day — the old value is struck, the new value shown; back in context the same change is applied with a neutral Δ marker and a before/after note. No filing rule, deadline, fee, court or effect is stated.',
    tags: ['filing a claim', 'inspect', 'lens', 'reference', 'registry', 'calendar', 'datum substitution', 'before', 'after'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/presentacion-demanda.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/markers.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
