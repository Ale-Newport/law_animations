/**
 * Motif kit for "Prueba contrafactual causal" (LAW-0685..0688): the same
 * toppling-chain stage as the category pilot "Cadena causal" (LAW-0681..0684,
 * whose art and solver are imported read-only), extended with what a
 * counterfactual replay needs:
 *
 *  - TWO pose solvers over ONE set of bodies: `with` (every supplied event in
 *    the model) and `without` (the selected event's tile taken out of the
 *    model). Both are the pilot's contact-driven topple solver, so a tile only
 *    moves when something really touches it.
 *  - The result of the replay is SUPPLIED (`loss-still-occurs` or
 *    `loss-does-not-occur`); the kit never infers it. The supplied result only
 *    chooses the spacing of the model (the same in both runs): with the
 *    "still occurs" spacing the tile before the gap is long enough to reach
 *    the tile after it; with the "does not occur" spacing it lies down in the
 *    empty slot and everything downstream stays standing.
 *  - A gantry over the stage: a long pendulum hangs from its beam (the
 *    trigger, released by a tether) and a trolley with a claw is parked over
 *    the selected event's slot. The claw lowers, grips the tile's top and
 *    lifts it clear of the model; a dashed outline stays in the empty slot.
 *  - Glue-aware text fitting (U+00A0 keeps "event 2" or "(as supplied)"
 *    together; the core wrap() turns U+00A0 into a plain space).
 *
 * The kit owns geometry, art and pose solvers only; each entry owns its own
 * timeline, layout, labels and semantics.
 * Legal content: every run is "the model as supplied"; no legal causation,
 * test, liability or outcome is stated or inferred.
 * @module animations/causation/kits/prueba-contrafactual
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {FONTS} from '../../../core/text.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {int, oneOf} from '../../../schemas/fields.js';
import {chainFields, CHAIN_STRINGS, tileArt, tileColor, lossArt, plinthArt, barrierArt, jointArt, dieFace} from './causal-chain.js';
import {toppleChain, bodyCorners, bodyPoint, poseTransform, rectPoly, localAt0, DEG} from './topple.js';

/* ------------------------------------------------------------------------ */
/* Schema, strings, data                                                    */
/* ------------------------------------------------------------------------ */

export const RESULTS = ['loss-still-occurs', 'loss-does-not-occur'];

export const cfFields = {
  ...chainFields,
  selectedEvent: int('Event taken out of the model for the replay (0-based index into events). It is kept between 1 and n − 2, so the removed event always has a neighbour on each side', 0, 5),
};

/** Schema field for the SUPPLIED result of the replay without the selected event. */
export const resultField = description => oneOf(description, RESULTS);

export const CF_STRINGS = {
  en: {
    ...CHAIN_STRINGS.en,
    present: 'Event present',
    removed: 'Event removed from the model',
    removedShort: 'Removed from the model',
    model: 'Model as supplied',
    key: 'As supplied · no conclusion\u00a0drawn',
    run1: 'Run with the event',
    run2: 'Replay without it',
    occurs: 'Loss still occurs (as\u00a0supplied)',
    notOccurs: 'Loss does not occur (as\u00a0supplied)',
    withOccurs: 'Loss occurs (as\u00a0supplied)',
    other: 'Other event put forward',
    event: 'Event',
    selected: 'Selected event',
    clamped: 'Event {a} cannot be taken out in this model (it needs a neighbour on each side); event {b} is used',
  },
  es: {
    ...CHAIN_STRINGS.es,
    present: 'Evento presente',
    removed: 'Evento retirado del modelo',
    removedShort: 'Retirado del modelo',
    model: 'Modelo según lo aportado',
    key: 'Según lo aportado · sin\u00a0conclusión',
    run1: 'Pasada con el evento',
    run2: 'Repetición sin él',
    occurs: 'La pérdida se produce igualmente (según lo\u00a0aportado)',
    notOccurs: 'La pérdida no se produce (según lo\u00a0aportado)',
    withOccurs: 'La pérdida se produce (según lo\u00a0aportado)',
    other: 'Otro evento planteado',
    event: 'Evento',
    selected: 'Evento seleccionado',
    clamped: 'El evento {a} no puede retirarse en este modelo (necesita un vecino a cada lado); se usa el evento {b}',
  },
};

/**
 * Note drawn when the supplied selectedEvent had to be moved to 1 … n − 2 (the removed event needs a
 * neighbour on each side); null when the supplied value is used as is.
 */
export function clampNote(ctx, p, M) {
  const want = Math.round(p.selectedEvent ?? 1);
  if (want === M.k) return null;
  return ctx.t.clamped.replace('{a}', String(want + 1)).replace('{b}', String(M.k + 1));
}

/** Model spacing (gap between neighbouring tiles × tile height) for each supplied result. */
export const GAP = {reach: 0.3, clear: 0.5};

/**
 * Normalize the model data.
 * @param {any} p params
 * @param {string} result supplied result of the replay ('loss-still-occurs' | 'loss-does-not-occur')
 */
export function resolveModel(p, result) {
  const n = p.events.length;
  const k = Math.max(1, Math.min(n - 2, Math.round(p.selectedEvent ?? 1)));
  const links = Array.from({length: n}, (_, i) => ({from: i, kind: 'sequence', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) {
    if (l.from < n) Object.assign(links[l.from], {kind: l.kind || links[l.from].kind, status: l.status || links[l.from].status, label: l.label || ''});
  }
  const alternatives = (p.alternatives || []).filter(a => a.link < n).map(a => ({...a, status: a.status || 'alleged'}));
  const reach = result === 'loss-still-occurs';
  return {n, k, events: p.events, links, alternatives, losses: p.losses, result, reach, gap: reach ? GAP.reach : GAP.clear};
}

/* ------------------------------------------------------------------------ */
/* Glue-aware text fitting                                                  */
/* ------------------------------------------------------------------------ */

const NB = '\u00a0';
/** Glue short tails and numbers to the word before them ("event\u00a02", "(as\u00a0supplied)" stays as given). */
export function glue(text) {
  const toks = String(text ?? '').split(/ +/).filter(Boolean);
  const out = [];
  for (const t of toks) {
    const bare = t.replace(/[.,;:)\]]+$/, '');
    if (out.length && (bare.length <= 2 || /^\d+[a-z]?$/i.test(bare) || /^[→·–-]$/.test(t))) out[out.length - 1] += NB + t;
    else out.push(t);
  }
  return out;
}

function wrapG(ctx, tokens, maxWidth, size, weight, family) {
  const m = s => ctx.measure(s.replace(/\u00a0/g, ' '), size, weight, family);
  const lines = [];
  let cur = '';
  let broken = false;
  for (const tok of tokens) {
    if (m(tok) > maxWidth) broken = true;
    const cand = cur ? `${cur} ${tok}` : tok;
    if (!cur || m(cand) <= maxWidth) cur = cand;
    else { lines.push(cur); cur = tok; }
  }
  if (cur) lines.push(cur);
  return {lines: lines.length ? lines : [''], broken};
}

/**
 * ctx.fit() replacement that never breaks inside a glued group and never
 * breaks a single word (it steps the size down instead, to minSize). Same
 * FitResult shape; lines keep U+00A0 (rendered as a space).
 * @param {any} ctx
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:string, leading?:number}} o
 */
export function fitG(ctx, text, o) {
  const full = String(text ?? '');
  const weight = o.weight ?? 600;
  const family = o.family ?? 'sans';
  const maxLines = o.maxLines ?? 2;
  const minSize = Math.max(8, o.minSize ?? o.size * 0.75);
  const toks = glue(full);
  const maxWidth = Math.max(10, o.maxWidth);
  let size = o.size;
  let res = wrapG(ctx, toks, maxWidth, size, weight, family);
  while ((res.lines.length > maxLines || res.broken) && size > minSize) {
    size = Math.max(minSize, size - Math.max(0.5, o.size * 0.03));
    res = wrapG(ctx, toks, maxWidth, size, weight, family);
  }
  let lines = res.lines;
  let truncated = false;
  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measure(`${last}…`.replace(/\u00a0/g, ' '), size, weight, family) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  const width = Math.max(...lines.map(l => ctx.measure(l.replace(/\u00a0/g, ' '), size, weight, family)));
  const lineHeight = size * (o.leading ?? 1.18);
  return {lines, size, lineHeight, width, height: lineHeight * (lines.length - 1) + size, truncated, broken: res.broken && size <= minSize, full, weight, family};
}

/**
 * Label chip (as primitives/annotate.js chip()) using fitG.
 * @returns {{node:any, box:{x:number,y:number,w:number,h:number,cx:number,cy:number}, fit:any}}
 */
export function chipG(ctx, text, o) {
  const size = o.size ?? 26;
  const padX = o.padX ?? size * 0.6;
  const padY = o.padY ?? size * 0.38;
  const fit = fitG(ctx, text, {maxWidth: o.maxWidth - padX * 2, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600, family: o.family ?? 'sans'});
  const w = fit.width + padX * 2;
  const hh = fit.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const y = o.y;
  const align = o.align ?? 'middle';
  const tx = align === 'start' ? x + padX : x + w / 2;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, y, w, hh, o.radius ?? Math.min(hh / 2, size * 0.7)), fill: o.fill ?? ctx.theme.card, stroke: o.stroke ?? ctx.theme.ink, 'stroke-width': o.stroke === 'none' ? 0 : (o.strokeWidth ?? 2), 'stroke-dasharray': o.dash}),
    textBlock(fit, {x: tx, y: y + padY, anchor: align, fill: o.color ?? ctx.theme.ink, name: o.textName}),
  );
  return {node, box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2}, fit};
}

/** Narrowest chipG width with the same line count and size as maxWidth gives (balanced lines). */
export function balancedG(ctx, text, o) {
  const pad = (o.padX ?? o.size * 0.6) * 2;
  const opts = w => ({maxWidth: w - pad, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600});
  const f0 = fitG(ctx, text, opts(o.maxWidth));
  if (f0.lines.length < 2 || f0.truncated) return o.maxWidth;
  let lo = Math.max(pad + 20, o.maxWidth * 0.3), hi = o.maxWidth;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const f = fitG(ctx, text, opts(mid));
    if (f.lines.length === f0.lines.length && !f.truncated && !f.broken && f.size >= f0.size - 0.01) hi = mid; else lo = mid;
  }
  return Math.min(o.maxWidth, hi + 2);
}

/* ------------------------------------------------------------------------ */
/* Stage geometry                                                           */
/* ------------------------------------------------------------------------ */

const K = {tileW: 0.2, strike: 0.46, plinthH: 0.4, vaseW: 0.3, vaseH: 0.52, jugW: 0.3, jugH: 0.28, jugGap: 0.5, shards: 0.34};
/** Beam top above the floor (× H). */
export const BEAM = 2.36;
/** Height the claw lifts the removed tile (× H): its base ends above the standing tile tops. */
export const LIFT = 1.12;
const PEND_DX = 0.42; // raised bob offset left of its hanging position (× H)
const RB = 0.12; // bob radius (× H)
const HIT = 0.74; // strike height on tile 0 (× H above the floor)
const BOARD_UP = 1.14; // alternative barrier board above the floor (× H)

/**
 * Horizontal metrics of a stage.
 * @returns {{w:number, spacing:number, pz:number, chainW:number, plinthW:number, width:number, vw:number, vh:number}}
 */
export function stageMetrics(n, H, lossCount = 1, gap = GAP.reach) {
  const w = Math.round(K.tileW * H);
  const spacing = w + gap * H;
  const chainW = (n - 1) * spacing + w;
  const vw = K.vaseW * H, vh = K.vaseH * H;
  const reach = lossCount > 1 ? Math.max(vh, K.jugGap * vh + (K.jugW + K.jugH) * H) : vh;
  const plinthW = 14 + vw + reach + 24;
  const pz = (PEND_DX + 2 * RB) * H + 46;
  const width = pz + chainW + K.strike * H - 14 + plinthW + K.shards * H + 30;
  return {w, spacing, pz, chainW, plinthW, width, vw, vh};
}

/** Vertical extent of a stage above its floor line and below it (design units). */
export const stageAbove = H => BEAM * H + 10;
export const STAGE_BELOW = 36;

/** Tile height that makes the stage fit `width`, capped at maxH. */
export function fitStageH(n, width, maxH, lossCount = 1, gap = GAP.reach) {
  const a = (stageMetrics(n, 300, lossCount, gap).width - stageMetrics(n, 200, lossCount, gap).width) / 100;
  const b = stageMetrics(n, 200, lossCount, gap).width - 200 * a;
  return Math.max(40, Math.min(maxH, (width - b) / a));
}

/* ---- two-level stage (tall boxes), after the pilot's wrap mode (LAW-0681) ---------------------
 * The first m tiles stand on an upper landing (falling right); the last of them stands at the landing
 * edge and swings over it (176°) onto the first tile of a lower row, WRAP_DROP·H below, whose tiles fall
 * LEFT, under the landing, towards the plinth. The removed event always stands on the landing with both
 * neighbours there (k ≤ m − 2), so the claw can reach it and the replay physics is the same as on one floor.
 */
export const WRAP_DROP = 1.3;
const WRAP_HIT = 0.08;

/** Relative geometry of a two-level stage (x relative to the landing edge xe). */
function wrapRel(n, m, H, lossCount, gap) {
  const mt = stageMetrics(n, H, lossCount, gap);
  const s = mt.spacing, w = mt.w;
  const row1Left = -((m - 1) * s + w); // left edge of tile 0
  const cos = 1 - (WRAP_DROP + WRAP_HIT);
  const hitX = H * Math.sqrt(Math.max(0, 1 - cos * cos));
  const p0 = hitX - w; // pivot (bottom-left) of the first lower tile (falls left)
  const lastPivot = p0 - (n - m - 1) * s;
  const vaseRight = lastPivot - K.strike * H;
  const plinthX = vaseRight + 14 - mt.plinthW;
  const left = Math.min(row1Left - mt.pz, plinthX - K.shards * H - 24);
  const right = Math.max(hitX + 20, H * 1.02) + 40;
  return {mt, row1Left, hitX, p0, lastPivot, vaseRight, plinthX, left, right, width: right - left};
}

/** Landing sizes allowed for a two-level stage with the removed event k (k ≤ m − 2 ≤ n − 3). */
export function wrapChoices(n, k) {
  const out = [];
  for (let m = k + 2; m <= n - 1; m++) out.push(m);
  return out;
}

/**
 * Horizontal and vertical extents of a stage.
 * @param {number|null} [wrapM] landing size of a two-level stage (null = one floor)
 * @returns {{width:number, above:number, below:number}}
 */
export function stageGeom(n, H, lossCount = 1, gap = GAP.reach, wrapM = null) {
  if (!wrapM) return {width: stageMetrics(n, H, lossCount, gap).width, above: stageAbove(H), below: STAGE_BELOW};
  return {width: wrapRel(n, wrapM, H, lossCount, gap).width, above: stageAbove(H), below: STAGE_BELOW + WRAP_DROP * H};
}

/** Tallest tiles whose stage fits `width` (and optionally `height`), capped at maxH. */
export function fitGeomH(n, width, maxH, lossCount = 1, gap = GAP.reach, wrapM = null, height = Infinity) {
  let lo = 40, hi = maxH;
  const ok = H => { const gm = stageGeom(n, H, lossCount, gap, wrapM); return gm.width <= width && gm.above + gm.below <= height; };
  if (ok(hi)) return hi;
  if (!ok(lo)) return lo;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
  return lo;
}

/** Pendulum angle (deg) at take time τ: held, released at 0, strikes at `start`, small recoil. */
function pendAngle(tau, start, raised, reduced) {
  if (tau <= 0) return raised;
  if (tau < start) return raised * (1 - ease.inQuad(tau / start));
  if (reduced) return 0;
  const k = clamp((tau - start) / 0.06);
  return 2.4 * Math.sin(Math.PI * k) * (1 - k * 0.3);
}

/**
 * Build a counterfactual stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {number} o.x        left edge of the stage (gantry post)
 * @param {number} o.floorY   standing line of the tiles
 * @param {number} o.H        tile height
 * @param {ReturnType<typeof resolveModel>} o.M  resolved model
 * @param {number} [o.lossCount]
 * @param {{start:number, strike:number}} o.take  take times (τ units) of the strike on tile 0 and on the loss
 * @param {boolean} [o.barriers=true] draw the alternatives as barricades behind the floor
 */
export function cfStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const M = o.M;
  const n = M.n, k = M.k;
  const H = o.H;
  const F = o.floorY;
  const lossCount = Math.min(2, o.lossCount ?? M.losses.length);
  const m = stageMetrics(n, H, lossCount, M.gap);
  const {w, spacing, vw, vh, plinthW} = m;
  const wrapM = o.wrapM && o.wrapM >= k + 2 && o.wrapM <= n - 1 ? o.wrapM : null;
  const W2 = wrapM ? wrapRel(n, wrapM, H, lossCount, M.gap) : null;
  const F2 = wrapM ? F + WRAP_DROP * H : F;
  const xe = wrapM ? o.x - W2.left : null; // landing edge (pivot of the tile that swings over it)
  const x0 = wrapM ? xe + W2.row1Left : o.x + m.pz;
  const dirL = wrapM ? -1 : 1;

  const tiles = [];
  for (let i = 0; i < (wrapM ?? n); i++) {
    const left = x0 + i * spacing;
    tiles.push({w, h: H, pivot: {x: left + w, y: F}, left, dir: 1, floor: F});
  }
  if (wrapM) {
    for (let j = 0; j < n - wrapM; j++) {
      const pv = xe + W2.p0 - j * spacing;
      tiles.push({w, h: H, pivot: {x: pv, y: F2}, left: pv, dir: -1, floor: F2});
    }
  }
  const lastPivot = tiles[n - 1].pivot.x;
  const plinthTop = F2 - K.plinthH * H;
  let vase, plinthX;
  if (dirL > 0) {
    const vaseLeft = lastPivot + K.strike * H;
    plinthX = vaseLeft - 14;
    vase = {w: vw, h: vh, pivot: {x: vaseLeft + vw, y: plinthTop}, maxDeg: 90, dir: 1};
  } else {
    const vaseRight = lastPivot - K.strike * H;
    plinthX = vaseRight + 14 - plinthW;
    vase = {w: vw, h: vh, pivot: {x: vaseRight - vw, y: plinthTop}, maxDeg: 90, dir: -1};
  }
  const losses = [vase];
  if (lossCount > 1) {
    const jw = K.jugW * H, jh = K.jugH * H;
    losses.push({w: jw, h: jh, pivot: {x: dirL > 0 ? vase.pivot.x + K.jugGap * vh + jw : vase.pivot.x - K.jugGap * vh - jw, y: plinthTop}, maxDeg: 90, dir: dirL});
  }
  const plinthPoly = rectPoly(plinthX - 4, plinthTop, plinthW + 8, F2 - plinthTop);
  const plinthRight = plinthX + plinthW;
  const width0 = wrapM ? W2.width : m.width;
  // the floor and the gantry may span a wider panel than the chain needs (o.span)
  const right = o.span ? Math.max(o.x + width0, o.span[1]) : o.x + width0;
  const floorL = (o.span ? Math.min(o.x, o.span[0]) : o.x) - 8, floorR = right - 4;
  // walkable spans of each floor (shadows stay on them)
  const landL = wrapM ? x0 - m.pz - 8 : floorL;
  const landR = wrapM ? xe - 6 : floorR;
  const spanOf = y => (y === F ? [landL, landR] : [floorL, floorR]);

  // ---- two solvers over the same bodies
  const start = o.take.start, strike = o.take.strike;
  const list = (dt, dl, skip) => [
    ...tiles.map((t, i) => ({...t, dur: dt * (wrapM && i === wrapM - 1 ? 1.35 : 1), maxDeg: wrapM && i === wrapM - 1 ? 176 : undefined, statics: i === n - 1 ? [plinthPoly] : []})).filter((_, i) => i !== skip),
    ...losses.map(b => ({...b, dur: dl})),
  ];
  const probe = toppleChain({bodies: list(1, 1, -1), start});
  const rel = probe.starts[n] - start;
  const dt = clamp((strike - start) / (Number.isFinite(rel) && rel > 0 ? rel : 1), 0.012, 0.09);
  const dl = o.take.lossDur ?? 0.034;
  const sims = {with: toppleChain({bodies: list(dt, dl, -1), start}), without: toppleChain({bodies: list(dt, dl, k), start})};
  /** original body index (tiles 0..n-1, losses n..) → index in a run's body list */
  const idx = (run, i) => (run === 'with' || i < k ? i : i - 1);
  const settled = {with: sims.with.settled(), without: sims.without.settled()};

  const landAt = {};
  for (const run of ['with', 'without']) {
    const sim = sims[run];
    landAt[run] = losses.map((_, j) => {
      const q = idx(run, n + j);
      const fin = settled[run].angles[q];
      if (!Number.isFinite(sim.starts[q]) || fin < 1 * DEG) return Infinity;
      let lo = sim.starts[q], hi = sim.starts[q] + 1;
      for (let it = 0; it < 30; it++) {
        const mid = (lo + hi) / 2;
        if (sim.at(mid).angles[q] >= fin - 0.5 * DEG) hi = mid; else lo = mid;
      }
      return hi;
    });
  }

  // ---- gantry: posts on the floor at both ends, beam across the top
  const beamY = F - BEAM * H;
  const beamH = Math.max(14, H * 0.055);
  const postL = (wrapM ? landL : floorL) + 14, postR = right - 26;
  const slotX = tiles[k].left + w / 2;
  const trolleyY = beamY + beamH;
  const trolleyH = Math.max(18, H * 0.07);
  const clawPark = F - H - LIFT * H; // grip point (tile top centre) when the claw is up
  const gripRest = F - H; // grip point on the standing tile
  const clawW = w + 26;

  // ---- pendulum hanging from the beam, striking tile 0 at HIT
  const hit = {x: tiles[0].left, y: F - HIT * H};
  const rb = RB * H;
  const pivot = {x: hit.x - rb, y: beamY + beamH + 4};
  const Lp = hit.y - pivot.y;
  const raised = -Math.asin(Math.min(0.9, (PEND_DX * H) / Lp)) / DEG;
  const bobAt = deg => ({x: pivot.x + Lp * Math.sin(deg * DEG), y: pivot.y + Lp * Math.cos(deg * DEG)});
  const raisedBob = bobAt(raised);

  // ---- nodes
  const slab = (x0s, x1, y) => g(null,
    h('path', {d: `M${r(x0s)} ${r(y - 30)}H${r(x1)}L${r(x1 + 8)} ${r(y + 12)}H${r(x0s - 8)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x0s - 8)} ${r(y + 12)}H${r(x1 + 8)}V${r(y + 34)}H${r(x0s - 8)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    [0.3, 0.62].map(f => h('path', {d: `M${r(x0s + 4)} ${r(y - 30 + 42 * f)}H${r(x1 - 4)}`, stroke: shade(th.woodTop, -0.12), 'stroke-width': 1.5})),
  );
  const post = (x, bottom) => g(null,
    h('rect', {x: r(x - 9), y: r(beamY), width: 18, height: r(bottom - 22 - beamY), rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(x - 22), y: r(bottom - 28), width: 44, height: 10, rx: 3, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
  );
  const gantry = g({name: `${P}-gantry`},
    post(postL, F), post(postR, F2),
    h('rect', {x: r(postL - 14), y: r(beamY), width: r(postR - postL + 28), height: r(beamH), rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: `M${r(postL + 4)} ${r(beamY + beamH / 2)}H${r(postR - 4)}`, stroke: th.metalDark, 'stroke-width': 2, 'stroke-dasharray': '3 9'}),
  );
  let floorArt;
  if (wrapM) {
    const riserTop = F + 34, riserBot = F2 - 24;
    const riserFill = th.dark ? shade(th.wood, -0.25) : shade(th.woodTop, 0.35);
    floorArt = g(null,
      h('path', {d: `M${r(landL)} ${r(riserTop)}H${r(landR + 8)}V${r(riserBot)}H${r(landL)}Z`, fill: riserFill, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      [0.25, 0.5, 0.75].map(f => h('path', {d: `M${r(landL + (landR - landL) * f)} ${r(riserTop + 10)}V${r(riserBot - 6)}`, stroke: shade(riserFill, -0.12), 'stroke-width': 2})),
      slab(landL + 8, landR, F),
      slab(floorL, floorR, F2));
  } else floorArt = slab(floorL, floorR, F);

  // alternatives: tall barricades behind the tiles, the board raised above the tile tops
  const barriers = (o.barriers === false ? [] : M.alternatives).map((a, j) => {
    const i = a.link;
    const A = tiles[i];
    const B = tiles[i + 1];
    const lower = wrapM && i >= wrapM - 1;
    let mid;
    if (i >= n - 1) mid = dirL > 0 ? (A.pivot.x + plinthX) / 2 : (A.pivot.x + plinthRight) / 2;
    else if (A.dir === B.dir) mid = A.dir > 0 ? (A.pivot.x + B.left) / 2 : (A.pivot.x + B.pivot.x + w) / 2;
    else mid = xe + W2.hitX / 2;
    const fy = lower ? F2 : F;
    const bw = Math.max(spacing * 0.9, H * 0.42);
    const boardH = H * 0.13;
    const groundY = fy - 20;
    const boardTop = fy - (lower ? 1.03 : BOARD_UP) * H - boardH;
    // keep the board clear of the removed tile's lifted body and of the claw cable
    const slot = {x0: tiles[k].left - 16, x1: tiles[k].pivot.x + 16};
    let cx = mid - (bw / 2 + 6);
    if (!lower && cx + bw / 2 > slot.x0 && cx - bw / 2 < slot.x1) cx = mid + (bw / 2 + 6);
    if (!lower && cx + bw / 2 > slot.x0 && cx - bw / 2 < slot.x1) cx = slot.x1 + bw / 2 + 4;
    const [s0, s1] = spanOf(fy);
    cx = clamp(cx, s0 + bw * 0.4 + 14, s1 - bw * 0.4 - 16);
    const node = g({name: `${P}-bar${j}`}, g({transform: T(cx, groundY)}, barrierArt(ctx, {name: `${P}-bar${j}-a`, w: bw, h: groundY - boardTop + 4, boardH})));
    const box = {x: cx - bw / 2, y: boardTop - 4, w: bw, h: boardH + 10};
    return {cx, top: {x: cx, y: boardTop}, box, stand: {x: cx - bw * 0.42, y: boardTop - 4, w: bw * 0.84, h: groundY - boardTop + 4}, node, link: i};
  });

  const bodies = [...tiles, ...losses];
  const shadows = bodies.map((b, i) => h('ellipse', {name: `${P}-sh${i}`, cx: r(b.pivot.x - (b.dir ?? 1) * b.w / 2), cy: r(b.pivot.y + 1), rx: r(b.w / 2 + 6), ry: 6, fill: th.ink, opacity: 0.16}));
  const tileNodes = tiles.map((t, i) => g({name: `${P}-tile${i}`, transform: poseTransform(t, 0)}, tileArt(ctx, {w, h: H, index: i, color: tileColor(ctx, i)})));
  const lossArts = losses.map((b, j) => lossArt(ctx, {name: `${P}-loss${j}-art`, w: b.w, h: b.h, kind: j ? 'jug' : 'vase', color: j ? shade(th.accent4, 0.25) : th.accent3}));
  const lossNodes = losses.map((b, j) => g({name: `${P}-loss${j}`, transform: poseTransform(b, 0)}, lossArts[j].node));
  const shardShapes = [[[0, 0], [24, -9], [12, 15]], [[0, 0], [18, 6], [3, 18]], [[0, 0], [15, -12], [21, 9]]];
  const shards = losses.map((b, j) => shardShapes.slice(0, j ? 2 : 3).map((pts, q) => h('path', {name: `${P}-shard${j}-${q}`, d: `M${pts.map(p => `${r(p[0] * H / 270)} ${r(p[1] * H / 270)}`).join('L')}Z`, fill: j ? shade(th.accent4, 0.25) : th.accent3, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0})));
  const jr = Math.max(o.jointMin ?? 23, H * 0.075); // the disputed "?" stays >= 16 px at 1080p in every ratio
  const joints = M.links.map((l, i) => jointArt(ctx, {name: `${P}-joint${i}`, disputed: l.status === 'disputed', radius: jr}));
  const bridge = jointArt(ctx, {name: `${P}-jointB`, disputed: false, radius: jr});
  // dashed outline left in the empty slot
  const slotGhost = h('path', {name: `${P}-slot`, d: roundRectPath(tiles[k].left, F - H, w, H, w * 0.14), fill: 'none', stroke: th.fgSoft, 'stroke-width': 3, 'stroke-dasharray': '9 7', opacity: 0});

  // pendulum
  const pend = g({name: `${P}-pend`},
    h('line', {name: `${P}-tether`, x1: r(postL + 9), y1: r(raisedBob.y - rb * 0.3), x2: r(raisedBob.x - rb * 0.7), y2: r(raisedBob.y), stroke: th.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '2 3'}),
    h('circle', {cx: r(pivot.x), cy: r(pivot.y), r: 6, fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    h('line', {name: `${P}-string`, x1: r(pivot.x), y1: r(pivot.y), x2: r(raisedBob.x), y2: r(raisedBob.y), stroke: th.fgSoft, 'stroke-width': 3}),
    g({name: `${P}-bob`, transform: T(raisedBob.x, raisedBob.y)},
      h('circle', {r: r(rb), fill: th.metalDark, stroke: th.ink, 'stroke-width': th.stroke}),
      h('circle', {cx: r(-rb * 0.35), cy: r(-rb * 0.35), r: r(rb * 0.28), fill: '#ffffff', opacity: 0.35})),
  );

  // trolley + cable + claw (claw local origin = grip point, the tile's top centre)
  const fingerH = Math.max(18, H * 0.1);
  const bodyH = Math.max(14, H * 0.07);
  const finger = side => h('path', {name: `${P}-claw-f${side < 0 ? 'L' : 'R'}`,
    d: `M${r(side * (w / 2 + 3))} ${r(-bodyH - 2)}V${r(fingerH * 0.62)}L${r(side * (w / 2 - 6))} ${r(fingerH * 0.62)}`,
    fill: 'none', stroke: th.ink, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  const fingerCore = side => h('path', {name: `${P}-claw-c${side < 0 ? 'L' : 'R'}`,
    d: `M${r(side * (w / 2 + 3))} ${r(-bodyH - 2)}V${r(fingerH * 0.62)}L${r(side * (w / 2 - 6))} ${r(fingerH * 0.62)}`,
    fill: 'none', stroke: th.metal, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  const trolley = g({name: `${P}-trolley`},
    h('rect', {x: r(slotX - clawW * 0.36), y: r(trolleyY - 4), width: r(clawW * 0.72), height: r(trolleyH), rx: 5, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    [-0.22, 0.22].map(f => h('circle', {cx: r(slotX + f * clawW), cy: r(beamY + 2), r: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 2})),
  );
  const cable = h('line', {name: `${P}-cable`, x1: r(slotX), y1: r(trolleyY + trolleyH - 4), x2: r(slotX), y2: r(clawPark - bodyH), stroke: th.ink, 'stroke-width': 3});
  const claw = g({name: `${P}-claw`, transform: T(slotX, clawPark)},
    finger(-1), fingerCore(-1), finger(1), fingerCore(1),
    h('path', {d: roundRectPath(-clawW / 2, -bodyH - 6, clawW, bodyH, 5), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: r(-bodyH - 6), r: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}),
  );

  const plinth = plinthArt(ctx, {x: plinthX, top: plinthTop, w: plinthW, floorY: F2 + 6});
  const back = g({name: `${P}-back`}, gantry, floorArt, barriers.map(b => b.node), shadows);
  const main = g({name: `${P}-main`}, g({name: `${P}-plinth`}, plinth), lossNodes, shards, slotGhost, tileNodes, joints, bridge, pend, trolley, cable, claw);
  const node = g({name: P}, back, main);

  // strike point of the last link on the vase (same in both runs when struck)
  const strikeLocal = run => {
    const sim = sims[run];
    const q = idx(run, n);
    const cu = sim.starts[q];
    if (!Number.isFinite(cu)) return {x: -vw, y: -vh * 0.8};
    const a = sim.at(cu).angles[q - 1];
    return localAt0(vase, bodyPoint(sim.bodies[q - 1], a, {x: 0, y: -H}));
  };
  const strikeL = {with: strikeLocal('with'), without: strikeLocal('without')};

  /** Take-time schedule of the pendulum (τ units). */
  const pendPose = (tau) => {
    const deg = pendAngle(tau, start, raised, ctx.reduced);
    const q = bobAt(deg);
    return {deg, bob: q, nodes: {
      [`${P}-string`]: {x2: r(q.x), y2: r(q.y)},
      [`${P}-bob`]: {transform: T(q.x, q.y)},
      [`${P}-tether`]: {opacity: tau <= 0 ? 1 : 0},
    }};
  };

  /**
   * Pose the stage.
   * @param {'with'|'without'} run
   * @param {number} tau  take time
   * @param {{drop?:number, grip?:number, lift?:number, slot?:number, jointOn?:number}} [s]
   *   drop 0 (claw up) → 1 (claw on the standing tile's top); grip 0 open → 1 closed;
   *   lift 0 → 1 (removed tile raised by LIFT·H; without-run only); slot = outline opacity
   */
  function pose(run, tau, s = {}) {
    const nodes = {};
    const sim = sims[run];
    const st = sim.at(Math.max(0, tau));
    const A = st.angles;
    const lift = run === 'without' ? clamp(s.lift ?? 1) : 0;
    const liftY = LIFT * H * ease.inOutCubic(lift);
    const angles = [];
    const tops = [];
    const polys = [];
    for (let i = 0; i < n + losses.length; i++) {
      const b = bodies[i];
      const isLoss = i >= n;
      let a;
      if (run === 'without' && i === k) a = 0;
      else a = A[idx(run, i)];
      angles.push(a);
      let tr;
      if (run === 'without' && i === k) tr = `translate(${r(b.pivot.x)} ${r(b.pivot.y - liftY)})`;
      else tr = poseTransform(b, a / DEG);
      nodes[isLoss ? `${P}-loss${i - n}` : `${P}-tile${i}`] = {transform: tr};
      let cs = bodyCorners(b, a);
      if (run === 'without' && i === k) cs = cs.map(q => ({x: q.x, y: q.y - liftY}));
      polys.push(cs);
      const top = bodyPoint(b, a, {x: isLoss ? -b.w / 2 : 0, y: -b.h});
      tops.push({x: r(top.x), y: r(top.y - (run === 'without' && i === k ? liftY : 0))});
      // floor shadow: the body's footprint (a lifted tile casts none)
      const xs = cs.map(q => q.x);
      const [sp0, sp1] = spanOf(b.pivot.y);
      const x0s = Math.max(sp0, Math.min(...xs)), x1 = Math.min(sp1, Math.max(...xs));
      // a tile hanging over the landing edge casts no floor shadow
      const overEdge = wrapM && i === wrapM - 1 ? clamp(1 - (a / DEG - 80) / 20) : 1;
      const up = run === 'without' && i === k ? clamp(1 - lift * 4) : 1;
      nodes[`${P}-sh${i}`] = {cx: r((x0s + Math.max(x0s, x1)) / 2), rx: r(Math.max(0, x1 - x0s) / 2 + 4), opacity: r(0.16 * up * overEdge * (x1 - x0s > 6 ? 1 : 0), 3)};
    }
    // joints: pop in at contact, then ride on the leaning tile's top corner
    const jointPts = M.links.map(() => null);
    let bridgePt = null;
    const jOn = s.jointOn ?? 1;
    const jointNode = (name, contactU, pt) => {
      const on = Number.isFinite(contactU) && tau >= contactU && jOn > 0;
      const pop = on ? seg(tau, contactU, contactU + 0.02) : 0;
      const kk = on ? (ctx.reduced ? 1 : 0.6 + 0.4 * ease.outBack(pop)) : 0.6;
      nodes[name] = {transform: T(pt.x, pt.y, 0, kk), opacity: on ? r(clamp(pop * 3) * jOn, 3) : 0};
      return on ? {x: r(pt.x), y: r(pt.y)} : null;
    };
    const lastQ = idx(run, n) - 1; // index of the last tile in this run's list
    for (let i = 0; i < n; i++) {
      // link i joins tile i to tile i+1 (or, for the last, to the loss)
      const name = `${P}-joint${i}`;
      if (run === 'without' && (i === k - 1 || i === k)) { nodes[name] = {transform: T(slotX, F - H, 0, 0.6), opacity: 0}; continue; }
      const q = idx(run, i);
      const contactU = sim.starts[q + 1];
      const pt = q === lastQ
        ? bodyPoint(vase, A[q + 1], strikeL[run])
        : bodyPoint(sim.bodies[q], A[q], {x: 0, y: -H});
      jointPts[i] = jointNode(name, contactU, pt);
    }
    if (run === 'without') {
      const q = k - 1;
      bridgePt = jointNode(`${P}-jointB`, sim.starts[q + 1], bodyPoint(sim.bodies[q], A[q], {x: 0, y: -H}));
    } else nodes[`${P}-jointB`] = {transform: T(slotX, F - H, 0, 0.6), opacity: 0};
    // cracks and shards on landing
    const cracked = [];
    const lossState = [];
    losses.forEach((b, j) => {
      const q = idx(run, n + j);
      const land = landAt[run][j];
      const art = lossArts[j];
      const cp = Number.isFinite(land) ? seg(tau, land, land + 0.03) : 0;
      nodes[`${P}-loss${j}-art-crack`] = {'stroke-dashoffset': r(art.crackLen * (1 - ease.outCubic(cp)))};
      nodes[`${P}-loss${j}-art-crackg`] = {opacity: r(clamp((cp - 0.5) * 2), 3)};
      cracked.push(r(cp, 3));
      lossState.push(A[q] <= 0 ? 'intact' : tau >= land ? 'down' : 'tipping');
      const lip = bodyPoint(b, A[q], {x: art.crackTip.x, y: art.crackTip.y});
      const count = j ? 2 : 3;
      for (let c = 0; c < count; c++) {
        const sp = Number.isFinite(land) ? seg(tau, land, land + 0.04) : 0;
        const off = (26 + c * 26 + j * 60) * (H / 270) * (dirL > 0 ? 1 : 0.58);
        const restX = dirL > 0 ? plinthRight + off : plinthX - off;
        const restY = F2 - 3 - (c % 2) * 4;
        const x = lerp(lip.x, restX, ease.outCubic(sp));
        const arcY = -Math.sin(Math.PI * Math.min(1, sp * 1.6)) * 30 * (H / 270) * (sp < 0.625 ? 1 : 0);
        const y = lerp(lip.y, restY, ease.inQuad(sp)) + arcY;
        nodes[`${P}-shard${j}-${c}`] = {transform: T(x, y, dirL * sp * (80 + c * 40)), opacity: sp > 0 ? 1 : 0};
      }
    });
    // pendulum
    const pp = pendPose(tau);
    Object.assign(nodes, pp.nodes);
    // claw
    const drop = clamp(s.drop ?? 0);
    const grip = clamp(s.grip ?? 0);
    const clawY = run === 'without' && lift > 0 ? gripRest - liftY : lerp(clawPark, gripRest, ease.inOutCubic(drop));
    const open = 1 - grip;
    nodes[`${P}-claw`] = {transform: T(slotX, clawY)};
    const fr = side => `rotate(${r(side * 14 * open)} ${r(side * (w / 2 + 3))} ${r(-bodyH - 2)})`;
    nodes[`${P}-claw-fL`] = {transform: fr(-1)};
    nodes[`${P}-claw-cL`] = {transform: fr(-1)};
    nodes[`${P}-claw-fR`] = {transform: fr(1)};
    nodes[`${P}-claw-cR`] = {transform: fr(1)};
    nodes[`${P}-cable`] = {y2: r(clawY - bodyH - 6)};
    nodes[`${P}-slot`] = {opacity: r(clamp(s.slot ?? 0), 3)};
    const started = tiles.map((_, i) => (run === 'without' && i === k ? false : st.started[idx(run, i)]));
    return {
      nodes,
      polys,
      semantic: {
        angles: angles.map(a => r(a / DEG, 2)),
        started,
        tops,
        joints: jointPts,
        bridge: bridgePt,
        lossState,
        cracked,
        bob: {x: r(pp.bob.x), y: r(pp.bob.y)},
        bobEdge: {x: r(pp.bob.x + rb), y: r(pp.bob.y)},
        claw: {x: r(slotX), y: r(clawY)},
        grip: r(grip, 3),
        lift: r(lift, 3),
      },
    };
  }

  /** Grip point on tile k (its top centre) for a given pose. */
  const gripPoint = (run, tau, lift) => {
    if (run === 'without') return {x: r(slotX), y: r(gripRest - LIFT * H * ease.inOutCubic(clamp(lift)))};
    const a = sims.with.at(Math.max(0, tau)).angles[k];
    const q = bodyPoint(tiles[k], a, {x: -w / 2, y: -H});
    return {x: r(q.x), y: r(q.y)};
  };

  return {
    node, back, main, pose, sims, settled, landAt, tiles, losses, bodies, barriers, strikeL,
    H, w, spacing, floorY: F, x0, left: floorL + 8, right, floorL, floorR, beamY, slotX, k, n,
    plinth: {x: plinthX, top: plinthTop, w: plinthW, right: plinthRight, floorY: F2},
    floorY2: F2, wrapM, landL, landR, xe,
    floorBoxes: wrapM ? [{x: landL - 8, y: F - 32, w: landR - landL + 16, h: 66}, {x: landL - 8, y: F + 30, w: landR - landL + 16, h: F2 - F - 30}, {x: floorL - 8, y: F2 - 32, w: floorR - floorL + 16, h: 70}] : [{x: floorL - 8, y: F - 32, w: floorR - floorL + 16, h: 70}],
    hangBox: {x: tiles[k].left - 6, y: F - H - LIFT * H - bodyH - 10, w: w + 12, h: H + bodyH + 12},
    clawBox: (y) => ({x: slotX - clawW / 2, y: y - bodyH - 8, w: clawW, h: bodyH + fingerH + 10}),
    clawW, gripRest, clawPark, pivot, hit, rb, raisedBob, Lp,
    gripPoint,
    /** body polygons at a pose (for label collision tests) */
    polysAt: (run, tau, lift = 1) => pose(run, tau, {lift}).polys,
    /** the vase's centre in a pose */
    lossCenter: (run, tau) => {
      const a = sims[run].at(Math.max(0, tau)).angles[idx(run, n)];
      return bodyPoint(vase, a, {x: -vw / 2, y: -vh / 2});
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Legend (die / vase / barrier icons + glue-fitted chips)                   */
/* ------------------------------------------------------------------------ */

/**
 * Legend block: rows of icon + chip, in `cols` columns (column-major).
 * @param {any} ctx
 * @param {Array<{key:string, kind:'event'|'loss'|'alt'|'link'|'pend'|'claw', i?:number, text:string, dim?:boolean}>} items
 * @param {{x:number, y:number, w:number, cols?:number, size:number, minSize?:number, maxLines?:number, iconS?:number, gap?:number, colGap?:number, prefix?:string}} o
 * @returns {{rows:Array<{key:string, node:any, box:any, icon:any, iconBox:any}>, h:number, w:number, minPx:number}}
 */
export function legend(ctx, items, o) {
  const th = ctx.theme;
  const cols = Math.max(1, o.cols ?? 1);
  const colGap = o.colGap ?? 28;
  const gap = o.gap ?? 12;
  const iconS = o.iconS ?? o.size * 1.5;
  const colW = (o.w - (cols - 1) * colGap) / cols;
  const pre = o.prefix ?? 'lg';
  const rows = [];
  let maxBottom = o.y;
  let minPx = Infinity;
  // columns balanced by height (in order): each column takes items until it reaches its share
  const iw0 = o.icons === false ? 0 : iconS + 14;
  const hs = items.map(it => Math.max(chipG(ctx, it.text, {x: 0, y: 0, maxWidth: colW - iw0, size: o.size, minSize: o.minSize, maxLines: o.maxLines ?? 3, padY: o.padY ?? o.size * 0.38}).box.h, o.icons === false ? 0 : iconS) + gap);
  const total = hs.reduce((a, b) => a + b, 0);
  const groups = [];
  let cur = [], cum = 0;
  items.forEach((it, i) => {
    if (cur.length && groups.length < cols - 1 && cum + hs[i] / 2 > total * (groups.length + 1) / cols) { groups.push(cur); cur = []; }
    cur.push(it);
    cum += hs[i];
  });
  if (cur.length) groups.push(cur);
  for (let c = 0; c < groups.length; c++) {
    let y = o.y;
    const x = o.x + c * (colW + colGap);
    for (const it of groups[c]) {
      const col = it.kind === 'loss' ? th.accent3 : it.kind === 'alt' ? th.accent : it.kind === 'link' ? th.accent4 : th.accent2;
      const noIcon = o.icons === false || it.kind === 'note';
      const iw = noIcon ? 0 : iconS + 14;
      const padY = o.padY ?? o.size * 0.38;
      const probe = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: colW - iw, size: o.size, minSize: o.minSize, maxLines: o.maxLines ?? 3, align: 'start', padY});
      const rh = Math.max(probe.box.h, noIcon ? 0 : iconS);
      const cy = y + rh / 2;
      const c2 = chipG(ctx, it.text, {x: x + iw, y: cy - probe.box.h / 2, maxWidth: colW - iw, size: o.size, minSize: o.minSize, maxLines: o.maxLines ?? 3, align: 'start', padY,
        fill: it.kind === 'loss' ? th.accent3Soft : it.kind === 'alt' ? th.accentSoft : th.card, stroke: col});
      minPx = Math.min(minPx, c2.fit.size);
      let icon = null;
      if (noIcon) icon = null;
      else if (it.kind === 'event') icon = g({transform: T(x, cy - iconS / 2)}, dieFace(ctx, {s: iconS, k: it.i + 1, fill: tileColor(ctx, it.i), pip: '#ffffff'}));
      else if (it.kind === 'loss') icon = g({transform: T(x + iconS * 0.81, cy + iconS / 2)}, lossArt(ctx, {name: `${pre}-${it.key}-vase`, w: iconS * 0.62, h: iconS, kind: 'vase'}).node);
      else if (it.kind === 'alt') icon = g({transform: T(x + iconS / 2, cy + iconS / 2)}, barrierArt(ctx, {name: `${pre}-${it.key}-bar`, w: iconS * 0.95, h: iconS * 0.9}));
      else if (it.kind === 'pend') icon = pendIcon(ctx, x, cy, iconS);
      else if (it.kind === 'claw') icon = clawIcon(ctx, x, cy, iconS);
      else icon = g({transform: T(x + iconS / 2, cy)}, jointArt(ctx, {name: `${pre}-${it.key}-j`, disputed: Boolean(it.dim), radius: Math.max(iconS * 0.42, 23)}));
      const node = g({name: `${pre}-${it.key}`, opacity: 0}, icon, c2.node);
      rows.push({key: it.key, name: `${pre}-${it.key}`, show: it.kind === 'link' && !noIcon ? [`${pre}-${it.key}-j`] : [], node, box: {x, y, w: c2.box.x + c2.box.w - x, h: rh}, chip: c2.box, iconBox: noIcon ? null : {x, y: cy - iconS / 2, w: iconS, h: iconS}});
      y += rh + gap;
    }
    maxBottom = Math.max(maxBottom, y - gap);
  }
  return {rows, h: maxBottom - o.y, w: o.w, minPx};
}

function pendIcon(ctx, x, cy, s) {
  const th = ctx.theme;
  return g(null,
    h('path', {d: `M${r(x + s * 0.1)} ${r(cy - s * 0.42)}H${r(x + s * 0.9)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(x + s * 0.5)} ${r(cy - s * 0.42)}L${r(x + s * 0.32)} ${r(cy + s * 0.18)}`, stroke: th.fgSoft, 'stroke-width': 2.5}),
    h('circle', {cx: r(x + s * 0.3), cy: r(cy + s * 0.26), r: r(s * 0.16), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
}

function clawIcon(ctx, x, cy, s) {
  const th = ctx.theme;
  const cx = x + s / 2;
  return g(null,
    h('path', {d: `M${r(cx)} ${r(cy - s * 0.5)}V${r(cy - s * 0.2)}`, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(cx - s * 0.3, cy - s * 0.22, s * 0.6, s * 0.14, 3), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: `M${r(cx - s * 0.26)} ${r(cy - s * 0.08)}V${r(cy + s * 0.18)}L${r(cx - s * 0.14)} ${r(cy + s * 0.18)}M${r(cx + s * 0.26)} ${r(cy - s * 0.08)}V${r(cy + s * 0.18)}L${r(cx + s * 0.14)} ${r(cy + s * 0.18)}`, fill: 'none', stroke: th.ink, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(cx - s * 0.1, cy + s * 0.06, s * 0.2, s * 0.44, 3), fill: th.accent2, stroke: th.ink, 'stroke-width': 1.5}));
}

/** The joint seals inside a legend row start hidden (opacity 0 in jointArt); show them with the row. */
export function legendFrame(rows, p) {
  const out = {};
  for (const rw of rows) {
    const v = typeof p === 'function' ? p(rw) : p;
    out[rw.name] = {opacity: r(clamp(v), 3)};
    for (const nm of rw.show) out[nm] = {opacity: 1};
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* Run lamps (icon-only markers of which run is playing)                     */
/* ------------------------------------------------------------------------ */

/**
 * Two run lamps and a rewind glyph between them. Lamp 1 shows a solid tile
 * (event present), lamp 2 a dashed tile lifted out of its slot (event removed
 * from the model). Labels are optional text beside each lamp.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, size:number, labels?:[string,string]|null}} o
 */
export function runLamps(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const R = o.size * 0.95;
  const gl = o.size * 2.4; // rewind glyph width
  const lampW = R * 2;
  const labels = o.labels || null;
  const fits = labels ? labels.map(t => fitG(ctx, t, {maxWidth: Math.max(o.size * 5, (o.w - gl - 2 * lampW - 60) / 2), size: o.size, minSize: o.size, maxLines: 2, weight: 700})) : null;
  const itemW = i => lampW + (fits ? 12 + fits[i].width : 0);
  const total = itemW(0) + gl + 40 + itemW(1);
  let x = o.x + (o.w - total) / 2;
  const cy = o.y + R;
  const lamp = (i, lx) => {
    const tile = i === 0
      ? h('path', {d: roundRectPath(lx + R - R * 0.22, cy - R * 0.55, R * 0.44, R * 1.1, 4), fill: th.accent2, stroke: th.ink, 'stroke-width': 2})
      : g(null,
        h('path', {d: roundRectPath(lx + R - R * 0.22, cy - R * 0.3, R * 0.44, R * 0.85, 4), fill: 'none', stroke: th.ink, 'stroke-width': 2, 'stroke-dasharray': '4 3'}),
        h('path', {d: roundRectPath(lx + R - R * 0.2, cy - R * 0.78, R * 0.4, R * 0.36, 3), fill: th.accent2, stroke: th.ink, 'stroke-width': 1.5}),
        h('path', {d: `M${r(lx + R)} ${r(cy - R * 0.36)}V${r(cy - R * 0.1)}`, stroke: th.ink, 'stroke-width': 2}));
    return g({name: `${N}-l${i}`},
      h('circle', {name: `${N}-l${i}-ring`, cx: r(lx + R), cy: r(cy), r: r(R), fill: th.card, stroke: th.inkSoft, 'stroke-width': 3}),
      tile,
      fits ? textBlock(fits[i], {x: lx + lampW + 12, y: cy - fits[i].height / 2 - fits[i].size * 0.1, fill: th.fg}) : null);
  };
  const l0x = x;
  const n0 = lamp(0, l0x);
  x += itemW(0) + 20;
  const gx = x;
  const tri = (ox) => `M${r(ox)} ${r(cy)}l${r(gl * 0.45)} ${r(-o.size * 0.55)}v${r(o.size * 1.1)}Z`;
  const glyph = g({name: `${N}-rw`},
    h('path', {d: `${tri(gx)}${tri(gx + gl * 0.45)}`, fill: th.inkSoft}));
  x += gl + 20;
  const n1 = lamp(1, x);
  const node = g({name: N, opacity: 0}, n0, glyph, n1);
  /**
   * @param {{show:number, active:0|1|null, rewind:number}} s
   */
  const frame = s => ({
    [N]: {opacity: r(clamp(s.show), 3)},
    [`${N}-l0-ring`]: {fill: s.active === 0 ? th.accent2Soft : th.card, stroke: s.active === 0 ? th.accent2 : th.inkSoft},
    [`${N}-l1-ring`]: {fill: s.active === 1 ? th.accent2Soft : th.card, stroke: s.active === 1 ? th.accent2 : th.inkSoft},
    [`${N}-rw`]: {opacity: r(0.35 + 0.65 * clamp(s.rewind), 3)},
  });
  const hh = Math.max(2 * R, ...(fits || []).map(f => f.height + 4));
  return {node, frame, box: {x: o.x + (o.w - total) / 2, y: o.y + R - hh / 2, w: total, h: hh}};
}

export {FONTS};

/**
 * Editorial callout (chip + leader + end dot) like kits/place.js calloutChip(),
 * but fitted with fitG (glued groups never split). Same node names and frame().
 * @param {any} ctx
 * @param {{name:string, text:string, chipAt:{x:number,y:number}, target:{x:number,y:number}, maxWidth:number, maxLines?:number, size?:number, color?:string, fill?:string}} o
 */
export function calloutG(ctx, o) {
  const c = chipG(ctx, o.text, {x: o.chipAt.x, y: o.chipAt.y, anchor: 'middle', maxWidth: o.maxWidth, size: o.size ?? 26, maxLines: o.maxLines ?? 2, fill: o.fill ?? ctx.theme.card, stroke: o.color ?? ctx.theme.ink, color: ctx.theme.ink, name: `${o.name}-chip`});
  const b = c.box;
  const t = o.target;
  const from = {x: Math.max(b.x, Math.min(t.x, b.x + b.w)), y: t.y > b.y + b.h ? b.y + b.h : t.y < b.y ? b.y : b.y + b.h / 2};
  if (from.y === b.y + b.h / 2) from.x = t.x > b.x + b.w / 2 ? b.x + b.w : b.x;
  const len = Math.hypot(t.x - from.x, t.y - from.y);
  const color = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(t.x), y2: r(t.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(t.x), cy: r(t.y), r: 7, fill: color, stroke: ctx.theme.card, 'stroke-width': 2.5, opacity: 0}),
    c.node,
  );
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: r(clamp((p - 0.45) / 0.55), 3)},
  });
  return {node, frame, box: b, from, fit: c.fit};
}
