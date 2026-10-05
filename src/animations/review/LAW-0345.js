/**
 * LAW-0345 — Sustitución de decisión · story
 *
 * Storyboard (a registry table seen from above, in a plain fictional room; on the
 * table a rail: the intake tray, a gap with engraved chevrons, then one channel
 * holding the POSITION — enclosed by a slate holder frame — and, abutting it,
 * the HISTORY POCKET with index tabs; a wall calendar is a fixture only):
 *  0.00–0.15  rest: card A (●, the initial result) lies in the position; card B
 *             (◆, the later result supplied) waits in the intake tray; the
 *             participant stands at the table's edge in front of the tray. The
 *             editable captions name the tray, the position and the pocket.
 *  0.15–0.42  the hands reach card B's near edge (the cause), then slide it
 *             along the rail towards the position; the participant walks with it.
 *  0.42–0.73  card B meets card A and pushes it: B ends in the position and A,
 *             pushed exactly one card width, ends in the history pocket — kept
 *             whole and fully visible. The hands let go; the participant steps
 *             back; a neutral history thread links the two cards (order pips:
 *             one dot supplied first, two dots supplied later).
 *  0.73–1.00  hold: the supplied states are captioned ("now in the position",
 *             "kept in the history"); no card is struck, greyed or marked.
 * Supplied state "pending": nobody moves the cards; a dashed outline of card B
 * (pending) traces the slide into the position, card A stays where it is.
 * Substitution is a supplied fact only: nothing is evaluated, no result is
 * marked right or wrong, no time limit or rule is drawn; jurisdiction unspecified.
 * @module animations/review/LAW-0345
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {actorLook} from '../../primitives/people-style.js';
import {pxPerUnit} from '../hearings/kits/apertura-audiencia.js';
import {planPerson, wallRing, floorArea, planColors} from '../courts/kits/courts-art.js';
import {reachRecords} from '../hearings/kits/hearings-art.js';
import {
  sdFields, SD_EN, SD_ES, localisedSd, fitG, textAt, cardModel, cardNode, ghostNode, railGeometry, railNode,
  calendarNode, panelLayout, panelNode, pocketLip, legendIcon, INK, R2, overlaps,
} from './kits/sustitucion-de-decision.js';

const ID = 'LAW-0345';
const DURATION = 6000;
const W = {
  reach: [0.15, 0.21], push: [0.22, 0.62], release: [0.62, 0.67], back: [0.65, 0.73],
  thread: [0.69, 0.77], states: [0.73, 0.79], ghost: [0.22, 0.62],
};
const SIZES = [28, 27, 26, 25, 24, 23, 22, 21, 20.5, 19.5, 18.5, 17.5, 16.5, 16];

const OWN_EN = {
  actorLabels: {a: 'Participant at the registry table (fictional)'},
  objectLabels: {calendar: 'Wall calendar (no date marked)', holder: 'Holder frame of the position'},
  pendingState: 'Substitution pending: shown as an outline (as supplied)',
  annotations: [],
  actionProgress: 1,
  finalState: 'substituted',
};
const OWN_ES = {
  actorLabels: {a: 'Participante en la mesa de registro (ficticio)'},
  objectLabels: {calendar: 'Calendario de pared (sin fecha marcada)', holder: 'Marco que sujeta la posición'},
  pendingState: 'Sustitución pendiente: se muestra como contorno (según lo aportado)',
  annotations: [],
  actionProgress: 1,
  finalState: 'substituted',
};
const EN = {...SD_EN, ...OWN_EN};
const ES = {...SD_ES, ...OWN_ES};

const sceneSchema = {
  ...sdFields,
  actorLabels: obj('Role caption shown under the participant', {a: str('Caption for the participant at the table', 60)}, ['a']),
  objectLabels: obj('Captions of the room objects', {
    calendar: str('Caption of the wall calendar (a fixture; no date is marked)', 60),
    holder: str('Caption of the holder frame that encloses the position', 60),
  }, ['calendar', 'holder']),
  pendingState: str('Caption shown in the position when the supplied state is "pending"', 90),
  actionProgress: num('How far the slide is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold under the caption of their target', obj('Annotation', {
    target: oneOf('Place the note belongs to', ['intake', 'position', 'history']),
    text: str('Annotation text', 80),
  }, ['target', 'text']), 0, 1),
  finalState: oneOf('The state supplied by the author: substituted (card B slid into the position, card A kept in the history) or pending (only an outline traces the slide; nothing is moved)', ['substituted', 'pending']),
};

const defaultParams = {...EN};

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

function compose(ctx, P, F, opt) {
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const problems = [];
  const wall = 16;
  const pad = shape === 'landscape' ? 26 : 20;
  // side mode (wide and square frames): the room takes the left part, the captions a text column on the right
  const roomW = opt.side ? D.w * opt.side : D.w;
  const inner = {x: wall + pad, y: wall + pad, w: roomW - 2 * (wall + pad), h: D.h - 2 * (wall + pad)};
  const panelX = roomW + 22, panelW = D.w - panelX;
  const iconW = F * 1.9;
  const ins = 10, m = 12, edge = 6;
  const gap = opt.side ? Math.max(34, F * 1.7) : Math.max(46, F * 2.3);
  const s = opt.s;
  // card width from the available rail length (3 card widths + 4 insets + gap + 2 margins)
  const avail = inner.w - 2 * edge;
  let cw = (avail - 4 * ins - gap - 2 * m) / 3;
  cw = Math.min(cw, F * opt.cwMax);
  const minF = F;
  const CM = cardModel(ctx, {w: cw, F, minF, maxLines: opt.cardLines, a: P.decisions.initial, b: P.decisions.later, showText: showKey, minH: Math.max(opt.minHAbs ?? 0, cw * Math.max(opt.minH ?? 0, showKey ? 0 : 0.9))});
  if (!CM.ok) problems.push('card-text');
  const RG = railGeometry({cw, ch: CM.h, gap, inset: ins, margin: m, axis: 'x'});
  // caption blocks over the intake, the position and the history (caption, then a reserved hold state)
  const blockW = opt.side ? {intake: panelW - iconW, position: panelW - iconW, history: panelW - iconW} : {intake: RG.intake.w, position: RG.position.w - 10, history: RG.history.w - 10};
  const block = (key, main, sub, state) => {
    const items = [];
    if (showKey && main) items.push({k: 'main', fit: fitG(main, {maxWidth: blockW[key], size: F, minSize: F, maxLines: opt.capLines ?? 3, weight: 700})});
    if (showAll && sub) items.push({k: 'sub', fit: fitG(sub, {maxWidth: blockW[key], size: F, minSize: F, maxLines: opt.capLines ?? 3, weight: 500}), italic: true});
    if (showKey && state) items.push({k: 'state', fit: fitG(state, {maxWidth: blockW[key] - F * 0.9, size: F, minSize: F, maxLines: opt.capLines ?? 3, weight: 600}), state: true});
    const ann = (P.annotations || []).filter(a => a.target === key);
    if (showAll) ann.forEach((a, i) => items.push({k: `ann${i}`, fit: fitG(a.text, {maxWidth: blockW[key] - F * 0.9, size: F, minSize: F, maxLines: 3, weight: 500}), ann: true}));
    let y = 0;
    for (const it of items) { if (!it.fit.ok) problems.push(`caption-${key}`); it.y = y; y += it.fit.height + F * (it.state || it.ann ? 0.5 : 0.35); }
    return {items, h: Math.max(0, y - F * 0.35)};
  };
  const pending = P.finalState === 'pending';
  const blocks = {
    intake: block('intake', P.routes.intake, P.grounds, null),
    position: block('position', P.decisions.position, opt.legend ? null : P.objectLabels.holder, pending ? P.pendingState : P.outcomes.position),
    history: block('history', P.routes.history, null, pending ? null : P.outcomes.history),
  };
  const bandH = opt.side ? 0 : Math.max(blocks.intake.h, blocks.position.h, blocks.history.h);
  // bottom strip: calendar + its caption (left), order note and key (right)
  const calW = Math.max(54, F * 2.6), calH = calW * 0.86;
  const keyRows = [];
  if (showAll && !opt.legend) keyRows.push({kind: 'note', text: P.labels.order, name: 'order-note'});
  if (showKey) keyRows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const calCap = showAll ? fitG(P.objectLabels.calendar, {maxWidth: opt.side ? panelW - iconW : Math.max(F * 7, inner.w * (opt.stackStrip ? 1 : 0.34)) - calW - 16, size: F, minSize: F, maxLines: 2, weight: 500}) : null;
  if (calCap && !calCap.ok) problems.push('calendar-caption');
  const keyW = opt.side ? panelW : opt.stackStrip ? inner.w : inner.w - (calW + 16 + (calCap ? calCap.width : 0)) - 40;
  const KL = panelLayout(ctx, keyRows, {w: Math.max(F * 8, keyW), F, maxLines: 3, gap: F * 0.6});
  if (!KL.ok) problems.push('key');
  const calBlockH = Math.max(calH, calCap ? calCap.height : 0);
  const stripH = opt.side ? 0 : opt.stackStrip ? calBlockH + (KL.rows.length ? F * 0.8 + KL.h : 0) : Math.max(calBlockH, KL.h);
  // actor caption under the participant
  const actor = showAll ? fitG(P.actorLabels.a, {maxWidth: opt.side ? panelW - iconW : Math.min(F * 14, cw + 2 * ins + gap * 0.8), size: F, minSize: F, maxLines: 3, weight: 600}) : null;
  if (actor && !actor.ok) problems.push('actor');
  const actorH = actor && !opt.side ? actor.height + F * 0.8 : 0;
  // legend panel (tall frames only)
  let LG = null;
  if (opt.legend && showAll) {
    const rows = [];
    if (showAll) rows.push({kind: 'item', icon: 'holder', text: P.objectLabels.holder, name: 'lg-holder'});
    if (showAll) rows.push({kind: 'item', icon: 'pips', text: P.labels.order, name: 'order-note'});
    LG = panelLayout(ctx, rows, {w: inner.w - F, F, maxLines: 3, gap: F * 0.6});
    if (!LG.ok) problems.push('legend');
  }
  // vertical stack
  const tabsUp = 12;
  const personZone = 22 * s + 52 * s + 10 + actorH;
  // side panel: the three caption blocks (each keyed by its place's icon), the calendar caption, the order note and key
  let panelH = 0;
  const by = {};
  if (opt.side) {
    for (const key of ['intake', 'position', 'history']) { by[key] = panelH; panelH += blocks[key].h + F * 0.9; }
    by.actor = panelH; if (actor) panelH += actor.height + F * 0.9;
    by.cal = panelH; if (calCap) panelH += calCap.height + F * 0.9;
    by.keys = panelH; panelH += KL.h;
    if (panelH > D.h - 20) problems.push('panel-height');
  }
  const need = bandH + 16 + tabsUp + RG.H + edge * 2 + personZone + 18 + stripH + (LG ? F * 1.4 + LG.h : 0);
  const spare = inner.h - need;
  if (spare < -0.5) problems.push('height');
  const sp = Math.max(0, spare);
  // distribute the spare height: a little above the band, more around the person and before the strip
  const gTop = sp * (!showKey ? 0.3 : LG ? 0.1 : 0.18), gBand = sp * (!showKey ? 0.05 : LG ? 0.12 : 0.2), gPerson = sp * (!showKey ? 0.3 : LG ? 0.18 : 0.32), gStrip = sp - gTop - gBand - gPerson;
  let y = inner.y + gTop;
  const band = {x: inner.x, y, h: bandH};
  y += bandH + 16 + tabsUp + gBand;
  const table = {x: inner.x, y, w: inner.w, h: RG.H + edge * 2};
  const rail = {x: inner.x + (inner.w - RG.W) / 2, y: y + edge};
  y += table.h;
  const front = y;
  const personY = front + 22 * s;
  y = personY + 52 * s + 10;
  const actorY = y;
  y += actorH + gPerson + 18;
  let legendY = null;
  if (LG) { legendY = y + gStrip * 0.3; y = legendY + LG.h + F * 1.4 + gStrip * 0.4; }
  else y += gStrip;
  const stripY = Math.min(y, inner.y + inner.h - stripH);
  // world (design) coordinates of rail parts
  const toD = b => ({x: rail.x + b.x, y: rail.y + b.y, w: b.w, h: b.h});
  const cards = {intake: toD(RG.cards.intake), position: toD(RG.cards.position), history: toD(RG.cards.history)};
  const slots = {intake: toD(RG.intake), position: toD(RG.position), history: toD(RG.history)};
  // caption block anchors (centred over their slots)
  const panelY = Math.max(10, (D.h - panelH) / 2);
  const bx = opt.side ? {intake: panelX + iconW, position: panelX + iconW, history: panelX + iconW} : {
    intake: slots.intake.x + (slots.intake.w - blockW.intake) / 2,
    position: slots.position.x + 2,
    history: slots.history.x + 8,
  };
  const byAbs = opt.side ? {intake: panelY + by.intake, position: panelY + by.position, history: panelY + by.history, actor: panelY + by.actor, cal: panelY + by.cal, keys: panelY + by.keys} : {intake: band.y, position: band.y, history: band.y};
  const bandBottom = band.y + bandH;
  return {roomW, panelX, iconW, byAbs, spare, problems, F, s, inner, wall, CM, RG, blocks, blockW, bx, band, bandBottom, table, rail, cards, slots, front, personY, actor, actorY, KL, calCap, calW, calH, stripY, stripH, LG, legendY, gap, pending, opt};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1359]},
  layout(ctx) {
    const P = localisedSd(ctx, EN, ES);
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const opts = shape === 'landscape'
      ? [{s: 1.3, cwMax: 20, cardLines: 5, capLines: 4, side: 0.64}, {s: 1.1, cwMax: 20, cardLines: 6, capLines: 5, side: 0.62}, {s: 0.95, cwMax: 20, cardLines: 5}, {s: 0.95, cwMax: 26, cardLines: 4, capLines: 4}, {s: 0.8, cwMax: 26, cardLines: 4, capLines: 4}]
      : shape === 'square'
        ? [{s: 0.85, cwMax: 16, cardLines: 8, capLines: 6, side: 0.66}, {s: 0.75, cwMax: 16, cardLines: 9, capLines: 7, side: 0.68}, {s: 0.9, cwMax: 16, minH: 0.62, cardLines: 4, capLines: 4, stackStrip: false}, {s: 0.8, cwMax: 16, cardLines: 5, capLines: 4, stackStrip: false}, {s: 0.7, cwMax: 16, cardLines: 6, capLines: 5, stackStrip: true}, {s: 0.6, cwMax: 16, cardLines: 7, capLines: 6, stackStrip: true}]
        : [{s: 1.25, cwMax: 16, minH: 1.1, cardLines: 6, capLines: 5, legend: true, stackStrip: true}, {s: 1.1, cwMax: 16, minH: 1, cardLines: 7, capLines: 6, legend: true, stackStrip: true}, {s: 1.0, cwMax: 16, cardLines: 7, capLines: 7, legend: false, stackStrip: true}];
    let best = null;
    // the side-column compositions first (the rail gets the room's full height) at any baseline size, then the rest
    const sizes = SIZES.filter(v => !ctx.show('key') || v <= (shape === 'portrait' ? 26 : 23));
    const passes = [[opts.filter(o => o.side && ctx.show('key')), (shape === 'landscape' ? [26, 25, 24, 23, 22, 21, 20.5, 19.5] : sizes.filter(v => v >= 19.5))], [opts.filter(o => !o.side), sizes], [opts.filter(o => o.side && ctx.show('key')), sizes]];
    outer:
    for (const [os, fs] of passes) {
      for (const Fp of fs) {
        for (const opt of os) {
          const L = compose(ctx, P, Fp / px, opt);
          if (!best || L.problems.length < best.problems.length) best = L;
          if (!L.problems.length) { best = L; break outer; }
        }
      }
    }
    let L = best;
    // spend the spare height on the cards themselves (the action is the subject): taller cards, then a larger participant
    if (!L.problems.length && L.spare > 8) {
      const L2 = compose(ctx, P, L.F, {...L.opt, minHAbs: L.CM.h + L.spare * 0.8, s: L.s * (ctx.view.shape === 'landscape' ? 1 : 1.12)});
      if (!L2.problems.length) L = L2;
      else { const L3 = compose(ctx, P, L.F, {...L.opt, minHAbs: L.CM.h + L.spare * 0.6}); if (!L3.problems.length) L = L3; }
    }
    L.P = P;
    L.px = px;
    L.look = actorLook(ctx, {appearance: {outfit: 0}}, 0);
    L.rig = planPerson(ctx, {name: 'rm-p0', look: L.look});
    // participant positions: in front of the intake at rest; in front of the position after the slide
    L.personX0 = L.cards.intake.x + L.cards.intake.w / 2;
    L.threadPts = {x1: L.cards.position.x + L.cards.position.w * 0.5, x2: L.cards.history.x + L.cards.history.w * 0.5, y: L.cards.position.y + L.cards.position.h + L.RG.ins * 0.55};
    L.calendar = {x: L.inner.x, y: L.stripY + (L.stripH > L.calH ? 0 : 0), w: L.calW, h: L.calH};
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const D = ctx.design;
    const P = L.P;
    const pc = planColors(ctx);
    const F = L.F;
    const parts = [];
    // room: floor and walls (the whole design space)
    parts.push(g({name: 'rm-room'},
      floorArea(ctx, {name: 'rm-floor', x: L.wall, y: L.wall, w: L.roomW - 2 * L.wall, h: D.h - 2 * L.wall, kind: 'tiles', cell: 60}),
      wallRing(ctx, {name: 'rm-walls', x: 0, y: 0, w: L.roomW, h: D.h, t: L.wall})));
    // the registry table (wood) and the rail on it
    const tb = L.table;
    parts.push(g({name: 'rm-table'},
      h('path', {d: roundRectPath(tb.x + 6, tb.y + 9, tb.w, tb.h, 16), fill: th.shadow}),
      h('path', {d: roundRectPath(tb.x, tb.y, tb.w, tb.h, 16), fill: pc.wood, stroke: INK, 'stroke-width': 2.5}),
      h('path', {d: roundRectPath(tb.x + 5, tb.y + 4, tb.w - 10, 5, 2.5), fill: pc.woodEdge, opacity: 0.8})));
    parts.push(g({transform: T(L.rail.x, L.rail.y)}, railNode(ctx, L.RG, {prefix: 'rm-rail'})));
    // history thread (under the cards' near edges)
    const cp = L.cards.position, chs = L.cards.history;
    const ty = L.threadPts.y;
    const tl = L.threadPts.x2 - L.threadPts.x1;
    parts.push(g({name: 'rm-thread', opacity: 0},
      h('line', {name: 'rm-thread-line', x1: r(L.threadPts.x1), x2: r(L.threadPts.x2), y1: r(ty), y2: r(ty), stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(tl)} ${r(tl + 4)}`, 'stroke-dashoffset': r(tl), 'data-draw': 1}),
      h('circle', {cx: r(L.threadPts.x1), cy: r(ty), r: 5, fill: th.accent2}),
      h('circle', {cx: r(L.threadPts.x2), cy: r(ty), r: 5, fill: th.accent2})));
    // pending outline (an inflated outline drawn under the cards: it rings the position at the hold and never crosses a card's text)
    parts.push(g({name: 'rm-ghost-at', transform: T(L.cards.intake.x, L.cards.intake.y)}, ghostNode(ctx, L.CM, {prefix: 'rm-ghost', side: 'b', inflate: L.RG.ins * 0.6})));
    // the cards: A (●, initial) in the position, B (◆, later) in the intake
    parts.push(g({name: 'rm-cardA', transform: T(cp.x, cp.y)}, cardNode(ctx, L.CM, {prefix: 'rm-a', side: 'a', order: 1})));
    parts.push(g({name: 'rm-cardB', transform: T(L.cards.intake.x, L.cards.intake.y)}, cardNode(ctx, L.CM, {prefix: 'rm-b', side: 'b', order: 2})));
    parts.push(g({transform: T(L.rail.x, L.rail.y)}, pocketLip(ctx, L.RG, {prefix: 'rm-lip'})));
    // caption band
    const band = [];
    for (const key of ['intake', 'position', 'history']) {
      const B = L.blocks[key];
      for (const it of B.items) {
        const x = L.bx[key];
        const y = L.byAbs[key] + it.y;
        const name = it.k === 'main' ? `cap-${key}` : it.k === 'sub' ? `cap-${key}-sub` : it.k === 'state' ? `state-${key}` : `ann-${key}-${it.k}`;
        if (it.state || it.ann) {
          band.push(g({name, opacity: 0},
            it.state ? h('circle', {cx: r(x + F * 0.32), cy: r(y + Math.min(it.fit.height, F) * 0.55), r: r(F * 0.26), fill: key === 'history' ? th.accent2 : th.accent3, stroke: INK, 'stroke-width': 1.5})
              : h('rect', {x: r(x + F * 0.08), y: r(y + F * 0.2), width: r(F * 0.5), height: r(F * 0.5), rx: 3, fill: 'none', stroke: th.fgSoft, 'stroke-width': 2}),
            textAt(it.fit, {x: x + F * 0.9, y, fill: th.fg})));
        } else band.push(textAt(it.fit, {x, y, fill: th.fg, italic: it.italic, name}));
      }
    }
    if (L.opt.side) for (const [key, icon] of [['intake', 'intake'], ['position', 'holder'], ['history', 'pocket']]) if (L.blocks[key].items.length) band.push(g({transform: T(L.panelX + F * 0.75, L.byAbs[key] + F * 0.6)}, legendIcon(ctx, icon, F * 1.2)));
    parts.push(g({name: 'band'}, band));
    // the participant (drawn over the table edge) and the caption that follows it
    parts.push(L.rig.node);
    if (L.actor && L.opt.side) {
      parts.push(g({name: 'actor-row'}, g({transform: T(L.panelX + F * 0.75, L.byAbs.actor + F * 0.6)}, legendIcon(ctx, 'person', F * 1.2, {color: L.look.outfit})), textAt(L.actor, {x: L.panelX + L.iconW, y: L.byAbs.actor, fill: th.fg})));
    } else if (L.actor) {
      parts.push(g({name: 'actor-cap', transform: T(L.personX0, L.actorY)},
        textAt(L.actor, {x: 0, y: 0, fill: th.fg, anchor: 'middle'})));
    }
    // legend (tall frames)
    if (L.LG) parts.push(g({name: 'legend', transform: T(L.inner.x, L.legendY)}, panelNode(ctx, L.LG)));
    // bottom strip: wall calendar (fixture), its caption, the order note and the key
    parts.push(g({transform: T(L.calendar.x, L.calendar.y)}, calendarNode(ctx, {prefix: 'rm-cal', w: L.calW, h: L.calH})));
    const strip = [];
    if (L.calCap && L.opt.side) strip.push(g({transform: T(L.panelX + F * 0.75, L.byAbs.cal + F * 0.6)}, legendIcon(ctx, 'calendar', F * 1.2)), textAt(L.calCap, {x: L.panelX + L.iconW, y: L.byAbs.cal, fill: th.fg, name: 'cal-cap'}));
    else if (L.calCap) strip.push(textAt(L.calCap, {x: L.inner.x + L.calW + 16, y: L.stripY + Math.max(0, (L.calH - L.calCap.height) / 2), fill: th.fg, name: 'cal-cap'}));
    parts.push(g({name: 'strip'}, strip));
    const kx = L.opt.side ? L.panelX : L.opt.stackStrip ? L.inner.x : L.inner.x + L.inner.w - Math.min(L.KL.w, L.KL.width + 4);
    const ky = L.opt.side ? L.byAbs.keys : L.opt.stackStrip ? L.stripY + Math.max(L.calH, L.calCap ? L.calCap.height : 0) + F * 0.8 : L.stripY + Math.max(0, (L.stripH - L.KL.h) / 2);
    parts.push(g({name: 'keys', transform: T(kx, ky)}, panelNode(ctx, L.KL)));
    return g(null, parts);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const s = L.s;
    const pending = L.pending;
    const cap = clamp(L.P.actionProgress);
    const pushT = seg(u, ...W.push);
    const pRaw = ease.inOutSine(pushT);
    const contactP = (L.RG.travelB - L.RG.travelA) / L.RG.travelB;
    // pending (supplied state): card B is slid up to card A and held there; the substitution itself is not made
    const p = pending ? Math.min(pRaw, cap) * contactP : Math.min(pRaw, cap);
    const travel = p * L.RG.travelB;
    const contact = L.RG.travelB - L.RG.travelA;
    const ci = L.cards.intake, cp = L.cards.position;
    const bx = ci.x + travel, by = ci.y;
    const ax = cp.x + Math.max(0, travel - contact), ay = cp.y;
    nodes['rm-cardB'] = {transform: T(bx, by)};
    nodes['rm-cardA'] = {transform: T(ax, ay)};
    // pending: only the dashed outline traces the slide (nothing is moved)
    const gp = pending ? 1 : 0;
    nodes['rm-ghost-at'] = {transform: T(ci.x + gp * L.RG.travelB, ci.y)};
    nodes['rm-ghost'] = {opacity: pending ? r(seg(u, 0.62, 0.68), 3) : 0};
    // participant: hands on card B's near edge while it slides
    const reach = seg(u, ...W.reach) * (1 - seg(u, ...W.release) * (cap >= 1 && !pending ? 1 : 0));
    const cardBottom = by + L.CM.h;
    const px0 = L.personX0;
    const back = pending ? 0 : ease.inOutCubic(seg(u, ...W.back)) * (cap >= 1 ? 1 : 0);
    const pose = {x: px0 + travel, y: L.personY + back * 14 * s, deg: 0, scale: s, phase: (travel / (34 * s)) * Math.PI, walk: (pending ? 0.4 : 0.75) * Math.sin(Math.PI * pushT) * (pRaw <= cap ? 1 : 0), seated: 0};
    Object.assign(nodes, L.rig.pose(pose));
    const hx = 50 * s;
    const tgtL = {x: bx + L.CM.w / 2 - hx, y: cardBottom - 7};
    const tgtR = {x: bx + L.CM.w / 2 + hx, y: cardBottom - 7};
    const rl = reachRecords({name: 'rm-p0'}, pose, tgtL, {arm: 'armL', k: reach});
    const rr = reachRecords({name: 'rm-p0'}, pose, tgtR, {arm: 'armR', k: reach});
    Object.assign(nodes, rl.nodes, rr.nodes);
    if (L.actor && !L.opt.side) nodes['actor-cap'] = {transform: T(pose.x, L.actorY + back * 14 * s)};
    // after the slide: thread, pocket rim and the supplied states
    const done = !pending && p >= 1 - 1e-9;
    const th = done ? ease.inOutSine(seg(u, ...W.thread)) : 0;
    const tl = L.threadPts.x2 - L.threadPts.x1;
    nodes['rm-thread'] = {opacity: th > 0 ? 1 : 0};
    nodes['rm-thread-line'] = {'stroke-dashoffset': r(tl * (1 - th))};
    nodes['rm-rail-pocket-glow'] = {opacity: r(done ? 0.85 * seg(u, ...W.thread) : 0, 3)};
    const st = seg(u, ...W.states);
    const stateOn = pending ? st : done ? st : 0;
    if (L.blocks.position.items.some(i => i.state)) nodes['state-position'] = {opacity: r(stateOn, 3)};
    if (L.blocks.history.items.some(i => i.state)) nodes['state-history'] = {opacity: r(done ? st : 0, 3)};
    for (const key of ['intake', 'position', 'history']) for (const it of L.blocks[key].items) if (it.ann) nodes[`ann-${key}-${it.k}`] = {opacity: r(st, 3)};
    const allReached = reach < 0.01 || (rl.reached && rr.reached);
    const phase = pending ? (u < W.reach[0] ? 'rest' : p <= 0 ? 'reaching' : pRaw < 1 ? 'sliding' : 'held-at-contact') : u < W.reach[0] ? 'rest' : p <= 0 ? 'reaching' : p < 1 && pRaw > p ? 'frozen' : p < 1 ? (travel < contact ? 'sliding' : 'pushing') : reach > 0.01 ? 'releasing' : 'held';
    return {
      nodes,
      semantic: {
        phase,
        mode: pending ? 'pending' : 'substituted',
        beat: u < 0.15 ? 'rest' : u < 0.42 ? 'start' : u < 0.73 ? 'complete' : 'hold',
        slide: r(p, 3),
        contactAt: r(contact / L.RG.travelB, 4),
        reaching: r(reach, 3),
        cardB: R2({x: bx, y: by}),
        cardA: R2({x: ax, y: ay}),
        bIn: travel >= L.RG.travelB - 0.5 ? 'position' : travel <= 0.5 ? 'intake' : 'rail',
        aIn: ax >= cp.x + L.RG.travelA - 0.5 ? 'history' : ax <= cp.x + 0.5 ? 'position' : 'rail',
        abut: r(ax - (bx + L.CM.w), 2),
        person: R2(pose),
        handL: R2(rl.hand),
        handR: R2(rr.hand),
        gripL: R2(tgtL),
        gripR: R2(tgtR),
        ghost: pending ? R2({x: ci.x + gp * L.RG.travelB, y: ci.y}) : null,
        thread: r(th, 3),
        states: r(stateOn, 3),
        actionCapped: cap < 1 && pRaw > cap,
        allReached,
        cardSize: {w: r(L.CM.w), h: r(L.CM.h)},
        personPx: r(100 * s * L.px, 1),
        textPx: r(L.F * L.px, 2),
        problems: L.problems,
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
    slug: 'review-07-story',
    title: 'Decision substitution — a later card slides into a position and pushes the earlier card into a history pocket, kept visible',
    titleEs: 'Sustitución de decisión — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Sustitución de decisión',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A registry table seen from above. On a rail lie an intake tray, a position enclosed by a slate holder frame and, abutting it, a history pocket with index tabs. A participant slides card B (◆, the later result supplied) out of the tray; it meets card A (●, the initial result) and pushes it, so B ends in the position and A ends, whole and fully visible, in the history pocket; a neutral thread links them and order pips show which was supplied first. Both cards have the same size, stroke and ink. Supplied state "pending": only a dashed outline traces the slide. Substitution is shown as a supplied fact: nothing is evaluated; jurisdiction unspecified.',
    tags: ['review', 'decision substitution', 'story', 'history kept', 'cards', 'rail', 'holder frame', 'history pocket', 'push', 'as supplied', 'equal weight', 'participant'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/sustitucion-de-decision.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
