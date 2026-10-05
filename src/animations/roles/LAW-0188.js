/**
 * LAW-0188 — Mediación entre partes · inspect
 *
 * Storyboard:
 *  0.00–0.20  context: the mediation table, large, in the state produced by
 *             the action — the first speaker holds the turn token and speaks;
 *             the agenda clipboard lies in front of the mediator. The view then
 *             pulls back to a context thumbnail to make room for the lens.
 *  0.20–0.45  a lens isolates the turn-order rows of the agenda. The lens
 *             holds a real second copy of the clipboard drawn at the SAME
 *             coordinates as the context; the lens scales it anisotropically
 *             so the sheet lying on the table is seen flat. The lens takes
 *             most of the free frame (beside the thumbnail on wide boxes,
 *             below it on square/tall ones).
 *  0.45–0.69  one datum is substituted inside the lens:
 *             firstSpeaker → the two turn rows swap (the lifted row passes
 *             beside the other one, so both markers stay visible), so the
 *             other party now has turn 1;
 *             slotLength   → the first turn's slot bar changes length
 *             (hypothetical values supplied by the author); the old value
 *             lifts and fades out before the new one fades in.
 *             A before→after annotation keeps the old value readable.
 *  0.69–1.00  the lens closes, then the camera returns to a large context
 *             (the annotation stays attached to the context: beside it on
 *             wide/square boxes, below it on tall ones). Only then, at full
 *             size, the agenda rows swap on the table and — for firstSpeaker —
 *             the mediator takes the token back and passes it to the new first
 *             speaker, who takes the floor; a "datum changed" marker is pinned
 *             to the agenda. Everything has settled by 0.915 and holds.
 * Seeking back before the substitution restores the previous datum exactly
 * (everything is a pure function of time). No validity or outcome is implied.
 * @module animations/roles/LAW-0188
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {inspectFields} from '../../schemas/fields.js';
import {caption} from '../../primitives/annotate.js';
import {wchip} from './kits/mediation-labels.js';
import {measure} from '../../core/text.js';
import {lens} from '../../frameworks/lens.js';
import {mediationRolesFields, MEDIATION_DEFAULTS, speakingOrder, roleOf} from './kits/mediation-fields.js';
import {mediationStage, turnScript, MED_STAGES} from './kits/mediation-table.js';
import {agendaClipboard} from './kits/mediation-props.js';

const ID = 'LAW-0188';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
/**
 * Timing windows (u). The return is sequential: the lens closes, the camera
 * returns to the full context, and only then the context update, the token
 * handoff (swap) and the marker play at full size; all settle by 0.915.
 */
const W = {
  ctxCaption: [0.03, 0.12], shrink: [0.12, 0.2],
  open: [0.2, 0.34], before: [0.31, 0.39],
  strike: [0.45, 0.5], change: [0.46, 0.61], after: [0.57, 0.64],
  close: [0.69, 0.745], zoom: [0.745, 0.79],
  ctxUpdate: [0.79, 0.83], swap: [0.79, 0.9], marker: [0.87, 0.915],
};

const STRINGS = {
  en: {firstSpeaker: 'Turn 1', slotLength: 'Slot for turn 1'},
  es: {firstSpeaker: 'Turno 1', slotLength: 'Tiempo del turno 1'},
};

const sceneSchema = {
  ...mediationRolesFields,
  ...inspectFields(['firstSpeaker', 'slotLength']),
};
sceneSchema.focusTarget.description = 'Detail that is enlarged and substituted: firstSpeaker swaps the two turn rows (before/after values are the labels shown for turn 1); slotLength changes the first turn’s slot bar (values are hypothetical durations; the bar scales with the first number found in each value)';

const defaultParams = {
  ...MEDIATION_DEFAULTS,
  focusTarget: 'firstSpeaker',
  beforeValue: 'Party A',
  afterValue: 'Party B',
  detailGeometry: {zoom: 3, placement: 'auto'},
  contextLabels: {context: 'Joint session, first turn in progress', marker: 'Datum changed'},
};

/**
 * Per shape (the design space is the actual one supplied by the runtime, so
 * the spare width/height of the caption-safe box is used):
 *  - side  (landscape): context thumbnail on the left, lens on the right with
 *    the annotation under it; at the return the annotation sits in a column
 *    beside the large context.
 *  - top   (square): thumbnail at the top with the annotation beside it, lens
 *    below at almost full width; the annotation stays beside the context.
 *  - stack (portrait): thumbnail, lens and annotation stacked; when the lens
 *    closes the annotation moves up under the thumbnail and then stays
 *    attached under the context while the camera returns.
 * `thumbK` = context scale while the lens is open (stage units → design).
 */
const LAYOUT = {
  landscape: {size: [2100, 1000], stage: 'landscape', mode: 'side', thumbK: 0.68},
  square: {size: [1400, 1420], stage: 'square', mode: 'top', thumbK: 0.56},
  portrait: {size: [1000, 1780], stage: 'portrait', mode: 'stack'},
};
/** Width of the annotation column (side/top modes). */
const ANN_COL = 450;
const GAP = 40;

/** First number in a string (for hypothetical slot lengths), or null. */
function num(v) {
  const m = /(-?\d+(?:[.,]\d+)?)/.exec(String(v));
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

const lerpP = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const Lo = LAYOUT[ctx.view.shape];
    const mode = Lo.mode;
    const D = {w: ctx.design.w, h: ctx.design.h};
    const target = p.focusTarget;
    const cfg = MED_STAGES[Lo.stage];
    const order = speakingOrder(p.relationships);
    const captions = {a: roleOf(p, 'a'), b: roleOf(p, 'b'), mediator: roleOf(p, 'mediator')};
    const slotMode = target === 'slotLength';
    // on the card: number + unit only; the annotation chips keep the full value (e.g. "hypothetical")
    const short = v => {
      const m = /-?\d+(?:[.,]\d+)?\s*[^\s(]*/.exec(String(v));
      return m ? m[0].trim() : String(v).slice(0, 12);
    };
    const slotTexts = slotMode ? [[short(p.beforeValue), short(p.afterValue)], [short(p.beforeValue), short(p.beforeValue)]] : null;
    const stage = mediationStage(ctx, {prefix: 'ctx', cfg, actors: p.actors, captions, props: p.props, order, slots: slotMode ? {texts: slotTexts} : undefined});
    const G = stage.G;
    // context caption at the top of the design; every view starts below it
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 10, y: 6, maxWidth: D.w - 20, size: 34, minSize: 26, maxLines: 2, name: 'ctx-caption', weight: 600}) : null;
    const top = ctxCap ? ctxCap.box.y + ctxCap.box.h + 16 : 40;
    const availH = D.h - top - 10;
    // vertical extent of the drawn context (bubbles/chair top → name chips), stage units
    const cTop = Math.max(0, Math.min(stage.bubA.box.y, stage.bubB.box.y, G.med.y - 150 * G.z) - 12);
    const cBot = Math.min(cfg.H, Math.max(stage.chipsBottom, G.floorY + 20 * G.z) + 10);
    const cH = cBot - cTop;
    // --- detail region: agenda title + the two turn rows (agenda-local, unflattened)
    const Ag = G.agenda;
    const ag = stage.agenda;
    const rows = ag.rows;
    const region = {x: -Ag.w * 0.05, y: -Ag.h * 0.1, w: Ag.w * 1.1, h: rows[1].y0 + rows[1].rowH + Ag.h * 0.14};
    const aspect = region.h / region.w;

    // --- single editorial annotation: before → after (old value stays readable).
    // Laid out around (0,0) = top centre of the block.
    const label = t[target];
    // a short value stays on one line ("Slot for turn 1:" / "5 min (hypothetical)")
    const keep = v => (String(v).length <= 28 ? String(v).replace(/ /g, ' ') : String(v));
    const mkBefore = o2 => wchip(ctx, `${label}: ${keep(p.beforeValue)}`, {size: 40, minSize: 30, maxLines: 2, fill: th.card, name: 'ann-before', ...o2});
    const mkAfter = o2 => wchip(ctx, `${label}: ${keep(p.afterValue)}`, {size: 40, minSize: 30, maxLines: 2, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after', ...o2});
    let beforeChip = null, afterChip = null, arrow = null, annBox = null;
    if (ctx.show('key')) {
      const annMax = mode === 'stack' ? Math.min(D.w - 40, 1100) : ANN_COL;
      let side = null;
      if (mode === 'stack') {
        // side by side when both fit; otherwise stacked (old above, arrow down, new below)
        const b0 = mkBefore({x: -26, y: 0, anchor: 'end', maxWidth: annMax / 2 - 20});
        const a0 = mkAfter({x: 26, y: 0, anchor: 'start', maxWidth: annMax / 2 - 20});
        if (!b0.fit.truncated && !a0.fit.truncated) side = [b0, a0];
      }
      if (side) {
        [beforeChip, afterChip] = side;
        const y = beforeChip.box.h / 2;
        arrow = `M-14 ${r(y)}h24m-10 -9l10 9l-10 9`;
      } else {
        beforeChip = mkBefore({x: 0, y: 0, anchor: 'middle', maxWidth: annMax});
        const ay = beforeChip.box.y + beforeChip.box.h + 8;
        afterChip = mkAfter({x: 0, y: ay + 36, anchor: 'middle', maxWidth: annMax});
        arrow = `M0 ${r(ay)}v26m-9 -10l9 10l9 -10`;
      }
      const bx = [beforeChip.box, afterChip.box];
      const x0 = Math.min(...bx.map(b => b.x)), x1 = Math.max(...bx.map(b => b.x + b.w));
      annBox = {x: x0, y: 0, w: x1 - x0, h: Math.max(...bx.map(b => b.y + b.h))};
    }
    const annH = annBox ? annBox.h : 0;
    const annW = annBox ? annBox.w : 0;
    const colW = annBox ? annW + GAP : 0;

    // --- camera views of the context
    const kBuild = Math.min((D.w - 20) / cfg.W, availH / cH);
    const vBuild = {x: (D.w - cfg.W * kBuild) / 2, y: top + (availH - cH * kBuild) / 2 - cTop * kBuild, k: kBuild};
    // lens magnification: the default zoom (3) and above fill the room the layout gives the lens
    const zf = clamp(0.6 + 0.4 * (p.detailGeometry.zoom - 1.5) / 1.5, 0.6, 1);
    let vLens, dest, annLens;
    if (mode === 'side') {
      const k = Math.min(Lo.thumbK, availH / cH);
      const cw = cfg.W * k;
      const colX = 10 + cw + 44, lensCol = D.w - 10 - colX;
      let lw = lensCol * zf, lh = lw * aspect;
      const maxLh = availH - (annH ? 26 + annH : 0);
      if (lh > maxLh) { lh = maxLh; lw = lh / aspect; }
      const gH = lh + (annH ? 26 + annH : 0);
      const lensY = top + (availH - gH) / 2;
      dest = {x: colX + (lensCol - lw) / 2, y: lensY, w: lw, h: lh};
      // thumbnail centred in the free band (the lens column is centred too)
      const ty = top + (availH - cH * k) / 2;
      vLens = {x: 10, y: ty - cTop * k, k};
      annLens = {x: dest.x + lw / 2, y: dest.y + lh + 26};
    } else if (mode === 'top') {
      const k = Math.min(Lo.thumbK, (D.w - 20 - colW) / cfg.W);
      const tH = cH * k;
      let lh = availH - tH - 36;
      let lw = Math.min(D.w - 40, lh / aspect) * zf;
      lh = lw * aspect;
      const gH = tH + 36 + lh;
      const y0 = top + (availH - gH) / 2;
      // thumbnail + annotation column centred as one row
      const rowW = cfg.W * k + colW;
      const x0 = Math.max(10, (D.w - rowW) / 2);
      vLens = {x: x0, y: y0 - cTop * k, k};
      dest = {x: (D.w - lw) / 2, y: y0 + tH + 36, w: lw, h: lh};
      annLens = null; // beside the thumbnail (annSide)
    } else {
      let lw = (D.w - 40) * zf, lh = lw * aspect;
      const extra = 36 + 26 + annH;
      let k = Math.min(0.75 * kBuild, (availH - extra - lh) / cH);
      if (k < 0.45) {
        k = 0.45;
        lh = availH - extra - cH * k;
        lw = lh / aspect;
      }
      const gH = cH * k + extra + lh;
      const y0 = top + (availH - gH) / 2;
      vLens = {x: (D.w - cfg.W * k) / 2, y: y0 - cTop * k, k};
      dest = {x: (D.w - lw) / 2, y: y0 + cH * k + 36, w: lw, h: lh};
      annLens = {x: D.w / 2, y: dest.y + lh + 26};
    }
    // return view: large context with the annotation beside it (side/top) or below it (stack)
    let vReturn;
    if (mode === 'stack') {
      const extra = annH ? annH + 24 : 0;
      const k1 = Math.min((D.w - 20) / cfg.W, (availH - extra) / cH);
      const y0 = top + (availH - (cH * k1 + extra)) / 2;
      vReturn = {x: (D.w - cfg.W * k1) / 2, y: y0 - cTop * k1, k: k1};
    } else {
      const k1 = Math.min((D.w - 20 - colW) / cfg.W, availH / cH);
      const rowW = cfg.W * k1 + colW;
      const y0 = top + (availH - cH * k1) / 2;
      vReturn = {x: (D.w - rowW) / 2, y: y0 - cTop * k1, k: k1};
    }
    /** annotation attached beside a context view (f: 0 top-aligned … 0.5 centred) */
    const annSide = (v, f) => ({x: v.x + cfg.W * v.k + GAP + annW / 2, y: v.y + cTop * v.k + (cH * v.k - annH) * f});
    /** annotation attached below a context view */
    const annBelow = v => ({x: v.x + (cfg.W * v.k) / 2, y: v.y + cBot * v.k + 24});

    const k = vLens.k;
    const toD = q => ({x: vLens.x + q.x * k, y: vLens.y + q.y * k});
    // context state: the swap script (first speaker speaking, then token passes)
    const script = turnScript(stage, 'swap', {ticks: false});

    const srcTL = toD(stage.agWorld({x: region.x, y: region.y}));
    const source = {x: srcTL.x, y: srcTL.y, w: region.w * k, h: region.h * Ag.f * k};
    const ctxBox = {x: vLens.x, y: vLens.y + cTop * k, w: cfg.W * k, h: cH * k};

    // --- lens content: a second clipboard at the SAME coordinates as the context one
    const markers = [0, 1].map(i => {
      const id = order[i];
      return {color: stage.looks[id === 'a' ? 0 : 1].outfit, letter: id === 'a' ? 'A' : 'B'};
    });
    const lensAg = agendaClipboard(ctx, {prefix: 'lens-ag', w: Ag.w, h: Ag.h, title: p.props.agendaTitle, items: p.props.agendaItems, markers, showText: ctx.show('all'), slots: slotMode ? {texts: slotTexts} : undefined});
    const agTransform = `${T(stage.agOrigin.x, stage.agOrigin.y)} scale(1 ${Ag.f})`;
    const lensContent = g({transform: T(vLens.x, vLens.y, 0, k)}, g({transform: agTransform}, lensAg.node));
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: ctxBox, color: th.accent});

    // strike-through: one stroke per text line of the old value, drawn line by line
    const strikes = [];
    if (beforeChip) {
      const f = beforeChip.fit;
      const padY = 40 * 0.38;
      f.lines.forEach((line, i) => {
        const lw = measure(line, f.size, f.weight, f.family) + 12;
        const y = beforeChip.box.y + padY + i * f.lineHeight + f.size * 0.52;
        strikes.push({name: `ann-strike${i}`, len: lw, node: h('line', {name: `ann-strike${i}`, x1: r(beforeChip.box.cx - lw / 2), x2: r(beforeChip.box.cx + lw / 2), y1: r(y), y2: r(y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw)} ${r(lw + 10)}`, 'stroke-dashoffset': r(lw)})});
      });
    }
    const strike = strikes.length ? g({name: 'ann-strike'}, strikes.map(x => x.node)) : null;

    // --- changed-datum marker (stage coordinates, so it follows the context view):
    // pin on the agenda, label on the table front below it; sized for the return view
    const kz = vReturn.k;
    const pin = stage.agWorld({x: Ag.w * 1.02, y: Ag.h * 0.2});
    const panelY = G.yNear + G.edge + 14 * G.z;
    // one line (bounded shrink) when possible, else two balanced lines
    const markOpts = n => ({x: pin.x, y: panelY, anchor: 'middle', maxWidth: Math.min(G.nearHalf * 1.7, (G.W - 20)), size: 30 / kz, minSize: (n > 1 ? 24 : 23) / kz, maxLines: n, fill: th.card, stroke: th.accent2});
    let markChip = ctx.show('key') ? wchip(ctx, p.contextLabels.marker, markOpts(1)) : null;
    if (markChip && markChip.fit.truncated) markChip = wchip(ctx, p.contextLabels.marker, markOpts(2));
    const pr = 18 / kz;
    const marker = g({name: 'marker', opacity: 0},
      markChip ? h('line', {x1: pin.x, y1: pin.y + pr, x2: pin.x, y2: panelY, stroke: th.accent2, 'stroke-width': 3 / kz}) : null,
      h('circle', {cx: pin.x, cy: pin.y, r: pr, fill: th.accent2, stroke: th.paper, 'stroke-width': 4 / kz}),
      h('path', {d: `M${r(pin.x - pr * 0.45)} ${r(pin.y)}l${r(pr * 0.33)} ${r(pr * 0.33)}l${r(pr * 0.6)} ${r(-pr * 0.66)}`, fill: 'none', stroke: '#fff', 'stroke-width': 4 / kz, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );

    // slot bar widths (hypothetical values → proportional bars)
    const base = 0.42;
    const nb = num(p.beforeValue), na = num(p.afterValue);
    const ratio = nb && na && nb > 0 ? na / nb : 1.6;
    const slotW = {before: base, after: clamp(base * ratio, 0.08, 1)};
    return {stage, script, L2, lensAg, source, dest, beforeChip, afterChip, strike, strikes, arrow, ctxCap, marker, vBuild, vLens, vReturn, annLens, annSide, annBelow, mode, target, order, slotW, rows, agW: Ag.w, lensCopyMatches: agTransform === `${T(stage.agOrigin.x, stage.agOrigin.y)} scale(1 ${Ag.f})`};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctx-view', transform: T(L.vBuild.x, L.vBuild.y, 0, L.vBuild.k)}, L.stage.node, L.marker),
      L.L2.node,
      L.beforeChip && g({name: 'ann'},
        L.beforeChip.node, L.strike,
        h('path', {d: L.arrow, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u, timeMs) {
    const nodes = {};
    const swapTarget = L.target === 'firstSpeaker';
    // context: swap clock runs only for the firstSpeaker substitution, after the camera has returned
    const c = swapTarget ? seg(u, ...W.swap) : 0;
    const input = L.script(c, timeMs, ctx.reduced);
    // row swap geometry (agenda-local): rows 0 and 1 exchange places
    const rowH = L.rows[1].cy - L.rows[0].cy;
    // Reorder like a lifted card: the second row is picked up (shadow, slight
    // scale) and passes to the RIGHT of the first row, which dodges a little to
    // the left while sliding down, so both speaker markers stay visible while
    // they cross.
    const swapRows = (prefix, pr) => {
      const e = ease.inOutCubic(pr);
      const arc = Math.sin(Math.PI * clamp(pr));
      const lift = clamp(arc * 3);
      const card = L.rows[1].card;
      const sc = 1 + 0.04 * lift;
      const px = card.x + card.w / 2, py = card.y + card.h / 2;
      return {
        [`${prefix}-row0`]: {transform: T(-L.agW * 0.045 * arc, rowH * e)},
        [`${prefix}-row1`]: {transform: `${T(L.agW * 0.065 * arc, -rowH * e)} translate(${r(px)} ${r(py)}) scale(${r(sc, 4)}) translate(${r(-px)} ${r(-py)})`},
        [`${prefix}-lift1`]: {opacity: r(lift, 3)},
      };
    };
    const change = seg(u, ...W.change);
    const ctxUpd = seg(u, ...W.ctxUpdate);
    if (swapTarget) input.markers = swapRows('ctx-ag', ctxUpd);
    const posed = L.stage.pose(input);
    Object.assign(nodes, posed.nodes);
    // lens
    const open = ease.inOutCubic(seg(u, ...W.open));
    // the lens and (stack mode) the annotation share this easing, so the annotation never meets the collapsing lens
    const close = ease.inOutSine(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    const hl = [1, 0, 0].slice(0, L.rows.length);
    Object.assign(nodes, L.lensAg.frame(new Array(L.rows.length).fill(0), hl));
    if (swapTarget) Object.assign(nodes, swapRows('lens-ag', change));
    // slot bars (both copies); the substitution changes turn 1's bar
    let slotLens = L.slotW.before, slotCtx = L.slotW.before;
    let slotValues = null;
    if (!swapTarget) {
      slotLens = lerp(L.slotW.before, L.slotW.after, ease.inOutCubic(change));
      slotCtx = lerp(L.slotW.before, L.slotW.after, ease.inOutCubic(ctxUpd));
      const dy = L.rows[0].rowH * 0.16;
      for (const [prefix, v, pr] of [['lens-ag', slotLens, change], ['ctx-ag', slotCtx, ctxUpd]]) {
        const lane0 = L.rows[0].slotLane, lane1 = L.rows[1].slotLane;
        nodes[`${prefix}-slot0`] = {width: r(lane0.w * v)};
        nodes[`${prefix}-slot1`] = {width: r(lane1.w * L.slotW.before)};
        if (ctx.show('all')) {
          // old value lifts and fades out first; the new one rises into place afterwards (never both at once)
          const out = ease.inOutSine(seg(pr, 0, 0.42));
          const inn = ease.inOutSine(seg(pr, 0.52, 1));
          nodes[`${prefix}-slotv0-0`] = {opacity: r(1 - out, 3), transform: T(0, -dy * out)};
          nodes[`${prefix}-slotv0-1`] = {opacity: r(inn, 3), transform: T(0, dy * (1 - inn))};
          if (prefix === 'lens-ag') slotValues = {old: r(1 - out, 3), new: r(inn, 3)};
        }
      }
    }
    // camera: build view → pulled back for the lens → large return view
    const zs = ease.inOutCubic(seg(u, ...W.shrink));
    // gentle camera: sine easing keeps the peak speed of the return low
    const zv = ease.inOutSine(seg(u, ...W.zoom));
    const {vBuild: vb, vLens: vl, vReturn: vr} = L;
    const view = zv > 0
      ? {x: lerp(vl.x, vr.x, zv), y: lerp(vl.y, vr.y, zv), k: lerp(vl.k, vr.k, zv)}
      : {x: lerp(vb.x, vl.x, zs), y: lerp(vb.y, vl.y, zs), k: lerp(vb.k, vl.k, zs)};
    nodes['ctx-view'] = {transform: T(view.x, view.y, 0, view.k)};
    // annotation: stays attached to the context it describes
    let annAt = null;
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      const sp = seg(u, ...W.strike) * L.strikes.length;
      L.strikes.forEach((x, i) => { nodes[x.name] = {'stroke-dashoffset': r(x.len * (1 - clamp(sp - i)))}; });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      if (L.mode === 'stack') {
        // under the lens → (as the lens closes, same easing) under the thumbnail → under the growing context
        annAt = zv > 0 ? L.annBelow(view) : lerpP(L.annLens, L.annBelow(vl), close);
      } else if (L.mode === 'top') {
        annAt = L.annSide(view, 0.5 * zv);
      } else {
        // from under the lens straight to its column beside the returning
        // context; it starts slowly, so the collapsing lens (moving left
        // toward its source) never passes over it
        const pa = ease.inOutSine(seg(u, W.close[0], W.zoom[1]));
        annAt = lerpP(L.annLens, L.annSide(L.vReturn, 0.5), pa);
      }
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0, transform: T(annAt.x, annAt.y)};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const [F, S] = L.order;
    const orderAt = pr => (pr >= 1 ? [S, F] : pr <= 0 ? [F, S] : null);
    const q = posed.semantic;
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        focusTarget: L.target,
        lensOrder: swapTarget ? orderAt(change) : [F, S],
        contextOrder: swapTarget ? orderAt(ctxUpd) : [F, S],
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        slotLens: r(slotLens, 3),
        slotContext: r(slotCtx, 3),
        slotValues,
        cameraK: r(view.k, 4),
        cameraReturned: zv >= 1,
        tokenAt: q.tokenAt,
        tokenHold: q.tokenHold,
        speakingA: q.speakingA, speakingB: q.speakingB,
        bubbleA: q.bubbleA, bubbleB: q.bubbleB,
        token: q.token, medL: q.medL, medR: q.medR, gripL: q.gripL, gripR: q.gripR,
        handA: q.handA, handB: q.handB, gripA: q.gripA, gripB: q.gripB,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        annAt: annAt ? {x: r(annAt.x), y: r(annAt.y)} : null,
        lensCopyMatches: L.lensCopyMatches,
        markerVisible: u >= W.marker[0],
        allReached: q.allReached,
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
    slug: 'roles-07-inspect',
    title: 'Mediation between parties — inspect the turn order',
    titleEs: 'Mediación entre partes — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Mediación entre partes',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens lifts the turn-order rows of the agenda clipboard off the mediation table, substitutes one datum (who has turn 1, or the hypothetical slot length of turn 1), keeps the previous value readable, and returns to the table where the token passes to the new first speaker and a changed-datum marker stays on the agenda.',
    tags: ['mediation', 'inspect', 'lens', 'agenda', 'turn order', 'before-after', 'substitution', 'token'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/mediation-table.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-fields.js', 'src/frameworks/lens.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
