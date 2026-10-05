/**
 * Motif kit for "Evento interviniente" (LAW-0693..0696): a supplied initial
 * sequence (conduct → … → result) into which one additional, later event
 * enters, shown as a physical model and never judged.
 *
 * Physical model (original vector art; the event tiles, die faces, vase,
 * plinth, link seals and striped barricades are the category pilot's art,
 * imported read-only from ./causal-chain.js; the contact-driven toppling
 * solver is ./topple.js):
 *
 *  - The INITIAL SEQUENCE is a row of upright event tiles on one floor (a die
 *    face gives each tile's place in the supplied order, with ● pips). A
 *    pendulum hanging from a gantry beam starts the first tile (the conduct);
 *    each tile only moves when the previous one touches it; the last one
 *    tips the vase on its plinth (the loss as described).
 *  - Between the two supplied events where the ADDITIONAL (later) event
 *    enters, the floor has an empty slot one tile wide (same spacing as every
 *    other gap, so nothing about the slot says the sequence needs it or not).
 *  - The additional event is its own tile (a ◆ face, its own colour) hanging
 *    from a claw under a trolley that is parked at a bay at the far end of the
 *    beam. When it enters, the trolley CARRIES it along the beam, high above
 *    every tile and barricade, stops over the slot, lowers it until it stands
 *    on the floor, opens the claw and rises: no teleport, one continuous path.
 *  - Two pose solvers over ONE set of bodies: `with` (the additional tile
 *    stands in its slot, so the sequence runs through it) and `without` (it
 *    stays in the bay; the tile before the slot reaches the tile after it).
 *    Both are the pilot's contact solver: nothing moves before it is touched.
 *  - Unresolved mode (`hold`): the run holds at a supplied disputed link (the
 *    tile leans on the next one, the seal shows "?" / a dashed ring) and a
 *    dashed ghost shows the next tile's pose if it went on — never decided.
 *  - Alternatives put forward are striped barricades behind the floor, with
 *    their board raised above the tile tops (never touching the run) and
 *    below the carry height.
 *
 * The result of each run is SUPPLIED (reaches the loss, or held unresolved at
 * a disputed link); the kit never infers it and never says that the later
 * event interrupts, replaces, relieves or shifts anything.
 * The kit owns geometry, art, the pose solver and small text helpers; each
 * entry owns its own timeline, layout, labels and semantics.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/kits/evento-interviniente
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {str, int, oneOf, list, obj} from '../../../schemas/fields.js';
import {CHAIN_STRINGS, tileArt, tileColor, lossArt, plinthArt, barrierArt, jointArt, dieFace} from './causal-chain.js';
import {toppleChain, bodyCorners, bodyPoint, poseTransform, rectPoly, localAt0, DEG} from './topple.js';
import {fitG, chipG, balancedG, calloutG} from './prueba-contrafactual.js';

export {fitG, chipG, balancedG, calloutG, DEG};

/* ------------------------------------------------------------------------ */
/* Schema, strings, data                                                    */
/* ------------------------------------------------------------------------ */

export const RESULTS = ['reaches-loss', 'unresolved-at-disputed-link'];

export const ieFields = {
  events: list('Initial sequence: the supplied events in order, from the conduct (first) to the last event before the loss (3–6)', obj('Event', {
    label: str('Event label (fictional, descriptive)', 90),
    time: str('Optional relative time label, e.g. "T+2 min" (shown as supplied)', 24),
  }, ['label']), 3, 6),
  addedEvent: obj('The additional, later event that enters the sequence (fictional, as supplied)', {
    label: str('Label of the additional event (fictional, descriptive)', 90),
    time: str('Optional relative time label (shown as supplied)', 24),
    after: int('It enters right after this event of the initial sequence (0-based). Kept between 0 and n − 2, so it always enters between two supplied events', 0, 4),
  }, ['label']),
  causalLinks: list('Per-link data over the sequence AFTER the additional event has entered: link i joins piece i to piece i + 1 (the additional event counts as one piece; the last link joins the last piece to the loss). Links not listed are proposed sequence links.', obj('Link', {
    from: int('Index (0-based) of the piece where the link starts', 0, 6),
    kind: oneOf('sequence (default) or causal; a causal link is only drawn as such when supplied here', ['sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); the animation never resolves it', ['proposed', 'disputed']),
    label: str('Optional caption for this link', 60),
  }, ['from']), 0, 7),
  alternatives: list('Other events put forward by someone; drawn as a barricade beside a link, never decided', obj('Alternative', {
    label: str('Alternative event label', 80),
    link: int('Index of the link (as in causalLinks) it is put forward against', 0, 6),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label', 'link']), 0, 2),
  losses: list('Loss as described. The first entry is the object that is struck; an optional second entry is a smaller object beside it.', obj('Loss', {
    label: str('Description of the loss (label hypothetical amounts as hypothetical)', 90),
  }, ['label']), 1, 2),
};

/** Schema field for a SUPPLIED result. */
export const resultField = description => oneOf(description, RESULTS);

export const IE_STRINGS = {
  en: {
    ...CHAIN_STRINGS.en,
    initial: 'Initial sequence',
    added: 'Later event',
    addedShort: 'later event',
    lossShort: 'loss',
    other: 'Other event put forward',
    event: 'Event',
    key: 'As supplied · no conclusion drawn',
    reaches: 'Reaches the loss (as supplied)',
    held: 'Held at the disputed link · unresolved (as supplied)',
    clamped: 'The later event can only enter between two supplied events; it enters after event {b} here',
    trigger: 'Trigger',
    crane: 'Crane',
    enters: 'enters after event {a}',
  },
  es: {
    ...CHAIN_STRINGS.es,
    initial: 'Secuencia inicial',
    added: 'Evento posterior',
    addedShort: 'evento posterior',
    lossShort: 'pérdida',
    other: 'Otro evento planteado',
    event: 'Evento',
    key: 'Según lo aportado · sin conclusión',
    reaches: 'Llega a la pérdida (según lo aportado)',
    held: 'Detenida en el eslabón discutido · sin resolver (según lo aportado)',
    clamped: 'El evento posterior solo puede entrar entre dos eventos aportados; aquí entra tras el evento {b}',
    trigger: 'Disparador',
    crane: 'Grúa',
    enters: 'entra tras el evento {a}',
  },
};

/**
 * Normalize the model: the full sequence after entry has N = n + 1 pieces; the
 * additional event is piece k = after + 1. Link j joins piece j to piece j + 1
 * (link N − 1 joins the last piece to the loss).
 * @param {any} p params
 */
export function resolveIE(p) {
  const n = p.events.length;
  const want = Math.round(p.addedEvent?.after ?? 0);
  const after = Math.max(0, Math.min(n - 2, want));
  const k = after + 1;
  const N = n + 1;
  const pieces = [];
  for (let j = 0; j < N; j++) pieces.push(j < k ? {kind: 'event', i: j} : j === k ? {kind: 'added'} : {kind: 'event', i: j - 1});
  const links = Array.from({length: N}, (_, j) => ({from: j, kind: 'sequence', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) {
    if (l.from < N) Object.assign(links[l.from], {kind: l.kind || links[l.from].kind, status: l.status || links[l.from].status, label: l.label || ''});
  }
  const alternatives = (p.alternatives || []).filter(a => a.link < N).map(a => ({...a, status: a.status || 'alleged'}));
  const d = links.findIndex(l => l.status === 'disputed');
  return {n, N, k, after, clamped: want !== after, want, events: p.events, added: p.addedEvent, pieces, links, alternatives, losses: p.losses, disputed: d === -1 ? null : d};
}

/** Short name of piece j (die number, "later event") or of the loss (j = N). */
export function pieceName(t, M, j) {
  if (j >= M.N) return t.lossShort;
  const pc = M.pieces[j];
  return pc.kind === 'added' ? t.addedShort : String(pc.i + 1);
}

/** Note drawn when the supplied `after` had to be moved into 0 … n − 2 (null when used as is). */
export function clampNote(ctx, M) {
  return M.clamped ? ctx.t.clamped.replace('{b}', String(M.after + 1)) : null;
}

/**
 * Link index in a run's body list for a full-sequence link j (the `without`
 * run has no piece k; its links k − 1 and k collapse into the link across the
 * slot).
 */
export function runLink(run, M, j) {
  if (run === 'with') return j;
  if (j < M.k - 1) return j;
  if (j <= M.k) return M.k - 1;
  return j - 1;
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

/** Colour of the additional event's tile. */
export const addedColor = ctx => (ctx.theme.cloth && ctx.theme.cloth[3]) || shade(ctx.theme.accent2, -0.3);

/** Face with a white ◆ (the additional event's marker, no text). Local origin = top-left. */
export function diamondFace(ctx, {s, fill, mark}) {
  const th = ctx.theme;
  const c = s / 2, q = s * 0.3;
  return g(null,
    h('path', {d: roundRectPath(0, 0, s, s, s * 0.2), fill: fill ?? th.paper, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(c)} ${r(c - q)}L${r(c + q * 0.82)} ${r(c)}L${r(c)} ${r(c + q)}L${r(c - q * 0.82)} ${r(c)}Z`, fill: mark ?? th.ink}),
  );
}

/**
 * Event tile (the pilot's tile art, as in ./causal-chain.js tileArt) whose die face keeps a readable size on narrow
 * tiles: the pilot's face is w − 14 wide (a few pixels on small stages); here it is at least 0.78·w.
 * Local origin = pivot (bottom-right).
 */
export function eventTileArt(ctx, {w, h: hh, index, color}) {
  if (w - 14 >= 0.78 * w) return tileArt(ctx, {w, h: hh, index, color});
  const th = ctx.theme;
  const s = 0.78 * w, m = (w - s) / 2;
  return g(null,
    h('path', {d: roundRectPath(-w, -hh, w, hh, w * 0.14), fill: color, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(-w + 3, -hh + s + m + 4, w * 0.26, hh - s - m - 8, w * 0.1), fill: '#ffffff', opacity: 0.2}),
    h('rect', {x: r(-w + 2), y: r(-hh * 0.1 + 1), width: r(w - 4), height: r(hh * 0.1 - 3), rx: 2, fill: shade(color, -0.2)}),
    g({transform: T(-w + m, -hh + m)}, dieFace(ctx, {s, k: index + 1})),
  );
}

/** The additional event's tile (same body as the pilot's tiles, ◆ face). Local origin = pivot (bottom-right). */
export function addedTileArt(ctx, {w, h: hh}) {
  const th = ctx.theme;
  const color = addedColor(ctx);
  const s = Math.max(w - 14, 0.78 * w), m = (w - s) / 2;
  return g(null,
    h('path', {d: roundRectPath(-w, -hh, w, hh, w * 0.14), fill: color, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(-w + 5, -hh + 6, w * 0.26, hh - 12, w * 0.1), fill: '#ffffff', opacity: 0.2}),
    h('rect', {x: r(-w + 2), y: r(-hh * 0.1 + 1), width: r(w - 4), height: r(hh * 0.1 - 3), rx: 3, fill: shade(color, -0.2)}),
    h('path', {d: `M${r(-w * 0.72)} ${r(-hh * 0.38)}H${r(-w * 0.28)}M${r(-w * 0.72)} ${r(-hh * 0.3)}H${r(-w * 0.4)}`, stroke: shade(color, 0.45), 'stroke-width': 4, 'stroke-linecap': 'round'}),
    g({transform: T(-w + (w - 14 >= 0.78 * w ? 7 : m), -hh + (w - 14 >= 0.78 * w ? 8 : m))}, diamondFace(ctx, {s})),
  );
}

/** Legend/icon marker of the initial sequence (● die face) or of the later event (◆ face). Local origin = top-left. */
export function sideMark(ctx, {s, added}) {
  return added ? diamondFace(ctx, {s, fill: addedColor(ctx), mark: '#ffffff'}) : dieFace(ctx, {s, k: 1, fill: tileColor(ctx, 0), pip: '#ffffff'});
}

/* ------------------------------------------------------------------------ */
/* Stage geometry                                                           */
/* ------------------------------------------------------------------------ */

const K = {tileW: 0.2, gap: 0.3, strike: 0.46, plinthH: 0.4, vaseW: 0.3, vaseH: 0.52, jugW: 0.3, jugH: 0.28, jugGap: 0.5, shards: 0.34};
/** Beam top above the floor (× H). */
export const BEAM = 2.42;
/** The carried tile’s base above the floor (× H): above every standing tile top (barricade boards stand behind the floor, in a plane further back). */
export const CARRY = 1.16;
const PEND_DX = 0.36; // raised bob offset left of its hanging position (× H)
const RB = 0.12; // bob radius (× H)
const HIT = 0.74; // strike height on tile 0 (× H above the floor)
const BOARD_UP = 1.1; // alternative barricade board above the floor (× H): over the tile tops, under the carry
export const STAGE_BELOW = 36;

/**
 * Horizontal metrics of a stage with N pieces.
 * @returns {{w:number, spacing:number, pz:number, chainW:number, plinthW:number, clawW:number, width:number, vw:number, vh:number, tail:number}}
 */
export function ieMetrics(N, H, lossCount = 1) {
  const w = Math.round(K.tileW * H);
  const spacing = w + K.gap * H;
  const chainW = (N - 1) * spacing + w;
  const vw = K.vaseW * H, vh = K.vaseH * H;
  const reach = lossCount > 1 ? Math.max(vh, K.jugGap * vh + (K.jugW + K.jugH) * H) : vh;
  const plinthW = 14 + vw + reach + 24;
  const pz = (PEND_DX + 2 * RB) * H + 46;
  const clawW = w + 26;
  // right of the plinth: the shard zone, with the parking bay of the later event above it
  const tail = Math.max(K.shards * H + 30, clawW + 40);
  const width = pz + chainW + K.strike * H - 14 + plinthW + tail;
  return {w, spacing, pz, chainW, plinthW, clawW, width, vw, vh, tail};
}

/** Vertical extent above the floor line. */
export const ieAbove = H => BEAM * H + 10;

/* ---- two-level stage (tall boxes), after the pilot's wrap mode (LAW-0681/0685) ---------------------
 * The first m pieces stand on an upper landing (falling right); the last of them stands at the landing edge
 * and swings over it (176°) onto the first piece of a lower row, WRAP_DROP·H below, whose tiles fall LEFT,
 * under the landing, towards the plinth. The later event always enters on the landing with both neighbours
 * there (k ≤ m − 2), so the crane reaches its slot.
 */
export const WRAP_DROP = 1.3;
const WRAP_HIT = 0.08;

/** Relative geometry of a two-level stage (x relative to the landing edge xe). */
function wrapRel(N, m, H, lossCount) {
  const mt = ieMetrics(N, H, lossCount);
  const s = mt.spacing, w = mt.w;
  const row1Left = -((m - 1) * s + w);
  const cos = 1 - (WRAP_DROP + WRAP_HIT);
  const hitX = H * Math.sqrt(Math.max(0, 1 - cos * cos));
  const p0 = hitX - w;
  const lastPivot = p0 - (N - m - 1) * s;
  const vaseRight = lastPivot - K.strike * H;
  const plinthX = vaseRight + 14 - mt.plinthW;
  const left = Math.min(row1Left - mt.pz, plinthX - K.shards * H - 24);
  const right = Math.max(hitX + 20, H * 1.02) + 40 + mt.clawW / 2;
  return {mt, row1Left, hitX, p0, lastPivot, vaseRight, plinthX, left, right, width: right - left};
}

/** Landing sizes allowed for a two-level stage (the later event k and its next neighbour on the landing). */
export function wrapChoices(N, k) {
  const out = [];
  for (let m = k + 2; m <= N - 1; m++) out.push(m);
  return out;
}

/** Width and vertical extents of a stage (one floor, or two levels with wrapM pieces on the landing). */
export function ieGeom(N, H, lossCount = 1, wrapM = null) {
  if (!wrapM) return {width: ieMetrics(N, H, lossCount).width, above: ieAbove(H), below: STAGE_BELOW};
  return {width: wrapRel(N, wrapM, H, lossCount).width, above: ieAbove(H), below: STAGE_BELOW + WRAP_DROP * H};
}

/** Tallest tiles whose stage fits width × height, capped at maxH (null when even 40 does not fit). */
export function fitIeH(N, width, height, maxH, lossCount = 1, wrapM = null) {
  const ok = H => { const gm = ieGeom(N, H, lossCount, wrapM); return gm.width <= width && gm.above + gm.below <= height; };
  let lo = 40, hi = maxH;
  if (ok(hi)) return hi;
  if (!ok(lo)) return null;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
  return lo;
}

/**
 * Build an intervening-event stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {number} o.x        left edge of the stage (left gantry post)
 * @param {number} o.floorY   standing line of the tiles
 * @param {number} o.H        tile height
 * @param {ReturnType<typeof resolveIE>} o.M
 * @param {number} [o.lossCount]
 * @param {{start:number, d:number, swing?:number, lossDur?:number}} o.take
 *   start = u at which the bob strikes tile 0; d = u between two tile contacts; swing = bob swing time
 * @param {{with?:number|null, without?:number|null}} [o.hold]  full-sequence link index each run holds at (unresolved)
 * @param {boolean} [o.barriers=true]
 * @param {[number, number]} [o.span]  floor/gantry span wider than the stage
 */
export function ieStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const M = o.M;
  const N = M.N, k = M.k;
  const H = o.H;
  const F = o.floorY;
  const lossCount = Math.min(2, o.lossCount ?? M.losses.length);
  const mt = ieMetrics(N, H, lossCount);
  const {w, spacing, vw, vh, plinthW, clawW} = mt;
  const wrapM = o.wrapM && o.wrapM >= k + 2 && o.wrapM <= N - 1 ? o.wrapM : null;
  const W2 = wrapM ? wrapRel(N, wrapM, H, lossCount) : null;
  const F2 = wrapM ? F + WRAP_DROP * H : F;
  const xe = wrapM ? o.x - W2.left : null; // landing edge (pivot of the piece that swings over it)
  const x0 = wrapM ? xe + W2.row1Left : o.x + mt.pz;
  const dirL = wrapM ? -1 : 1;

  const tiles = [];
  for (let j = 0; j < (wrapM ?? N); j++) {
    const left = x0 + j * spacing;
    tiles.push({w, h: H, pivot: {x: left + w, y: F}, left, dir: 1, floor: F, added: j === k});
  }
  if (wrapM) {
    for (let j = 0; j < N - wrapM; j++) {
      const pv = xe + W2.p0 - j * spacing;
      tiles.push({w, h: H, pivot: {x: pv, y: F2}, left: pv, dir: -1, floor: F2, added: false});
    }
  }
  const lastPivot = tiles[N - 1].pivot.x;
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
  const right0 = o.x + (wrapM ? W2.width : mt.width);
  const right = o.span ? Math.max(right0, o.span[1]) : right0;
  const floorL = (o.span ? Math.min(o.x, o.span[0]) : o.x) - 8, floorR = right - 4;
  // walkable spans of each floor (shadows stay on them)
  const landL = wrapM ? x0 - mt.pz - 8 : floorL;
  const landR = wrapM ? xe - 6 : floorR;
  const spanOf = y => (Math.abs(y - F) < 0.5 ? [landL, landR] : [floorL, floorR]);

  // ---- timing: every tile-to-tile contact takes d (u units)
  const take = o.take;
  const start = take.start;
  const swing = take.swing ?? 0.05;
  const dl = take.lossDur ?? 0.034;
  const list = (dt, skip) => [
    ...tiles.map((t, j) => ({...t, dur: dt * (wrapM && j === wrapM - 1 ? 1.35 : 1), maxDeg: wrapM && j === wrapM - 1 ? 176 : undefined, statics: j === N - 1 ? [plinthPoly] : []})).filter((_, j) => j !== skip),
    ...losses.map(b => ({...b, dur: dl})),
  ];
  const probe = toppleChain({bodies: list(1, -1), start: 0});
  const rel = probe.starts[1];
  const dt = clamp(take.d / (Number.isFinite(rel) && rel > 0 ? rel : 1), 0.004, 0.5);
  const holdOf = run => (o.hold && o.hold[run] !== null && o.hold[run] !== undefined ? runLink(run, M, o.hold[run]) : null);
  const sims = {
    with: toppleChain({bodies: list(dt, -1), start, stopAtLink: holdOf('with')}),
    without: toppleChain({bodies: list(dt, k), start, stopAtLink: holdOf('without')}),
  };
  const free = {with: toppleChain({bodies: list(dt, -1), start}), without: toppleChain({bodies: list(dt, k), start})};
  const freeSettled = {with: free.with.settled(), without: free.without.settled()};
  const idx = (run, j) => (run === 'with' || j < k ? j : j - 1);
  const held = {with: holdOf('with'), without: holdOf('without')};
  const settled = {with: sims.with.settled(), without: sims.without.settled()};
  const landAt = {};
  for (const run of ['with', 'without']) {
    const sim = sims[run];
    landAt[run] = losses.map((_, q) => {
      const b = idx(run, N + q);
      const fin = settled[run].angles[b];
      if (!Number.isFinite(sim.starts[b]) || fin < 1 * DEG || (held[run] !== null && b > held[run])) return Infinity;
      let lo = sim.starts[b], hi = sim.starts[b] + 1;
      for (let it = 0; it < 30; it++) {
        const mid = (lo + hi) / 2;
        if (sim.at(mid).angles[b] >= fin - 0.5 * DEG) hi = mid; else lo = mid;
      }
      return hi;
    });
  }

  // ---- gantry: posts at both ends, beam across the top, parking bay at the right end
  const beamY = F - BEAM * H;
  const beamH = Math.max(14, H * 0.055);
  const postL = (wrapM ? landL : floorL) + 22, postR = right - 26;
  const slotX = tiles[k].left + w / 2;
  const bayX = dirL > 0 ? Math.min(postR - clawW / 2 - 24, plinthRight + clawW / 2 + 12) : postR - clawW / 2 - 24;
  const trolleyY = beamY + beamH;
  const trolleyH = Math.max(18, H * 0.07);
  const liftY = CARRY * H; // carried tile raised by this much above its standing pose
  const gripRest = F - H; // grip point (tile top centre) on the standing tile
  const gripUp = gripRest - liftY;
  const fingerH = Math.max(18, H * 0.1);
  const bodyH = Math.max(14, H * 0.07);
  const clawUp = gripUp; // the empty claw rises back to the carry height

  // ---- pendulum hanging from the beam, striking tile 0 at HIT
  const hit = {x: tiles[0].left, y: F - HIT * H};
  const rb = RB * H;
  const pivot = {x: hit.x - rb, y: beamY + beamH + 4};
  const Lp = hit.y - pivot.y;
  const raised = -Math.asin(Math.min(0.9, (PEND_DX * H) / Lp)) / DEG;
  const bobAt = deg => ({x: pivot.x + Lp * Math.sin(deg * DEG), y: pivot.y + Lp * Math.cos(deg * DEG)});
  const raisedBob = bobAt(raised);

  // ---- nodes
  const slab = (xa, xb, y, guides) => g(null,
    h('path', {d: `M${r(xa)} ${r(y - 30)}H${r(xb)}L${r(xb + 8)} ${r(y + 12)}H${r(xa - 8)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(xa - 8)} ${r(y + 12)}H${r(xb + 8)}V${r(y + 34)}H${r(xa - 8)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    [0.3, 0.62].map(f => h('path', {d: `M${r(xa + 4)} ${r(y - 30 + 42 * f)}H${r(xb - 4)}`, stroke: shade(th.woodTop, -0.12), 'stroke-width': 1.5})),
    // the slot where the later event may stand: two small floor guides (solid, neutral)
    guides && [-1, 1].map(s => h('path', {d: roundRectPath(slotX + s * (w / 2 + 5) - (s < 0 ? 8 : 0), y - 5, 8, 5, 2), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5})),
  );
  const post = (x, bottom) => g(null,
    h('rect', {x: r(x - 9), y: r(beamY), width: 18, height: r(bottom - 22 - beamY), rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(x - 22), y: r(bottom - 28), width: 44, height: 10, rx: 3, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
  );
  const bumperX = bayX + clawW * 0.36 + 6;
  // bay latch: a pin in the beam on the slot side of the parked trolley; lowered, it keeps the trolley in the bay
  const latchX = bayX - clawW * 0.36 - 16;
  const latch = g({name: `${P}-latch`, transform: T(0, r(-trolleyH, 2))},
    h('path', {d: roundRectPath(latchX - 5, beamY - 4, 10, beamH + trolleyH - 2, 3), fill: th.accent2, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: r(latchX), cy: r(beamY + beamH + trolleyH - 12), r: 3, fill: '#ffffff'}));
  const gantry = g({name: `${P}-gantry`},
    latch,
    post(postL, F), post(postR, F2),
    h('rect', {x: r(postL - 14), y: r(beamY), width: r(postR - postL + 28), height: r(beamH), rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: `M${r(postL + 4)} ${r(beamY + beamH / 2)}H${r(postR - 4)}`, stroke: th.metalDark, 'stroke-width': 2, 'stroke-dasharray': '3 9'}),
    // bay end stop
    h('rect', {x: r(bumperX), y: r(beamY + beamH - 2), width: 12, height: r(trolleyH + 2), rx: 3, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
  );

  // alternatives: tall barricades behind the tiles, the board between the tile tops and the carry height
  const barriers = (o.barriers === false ? [] : M.alternatives).map((a, j) => {
    const i = a.link;
    const A = tiles[Math.min(i, N - 1)];
    const lower = wrapM && i >= wrapM - 1;
    let mid;
    if (i >= N - 1) mid = dirL > 0 ? (A.pivot.x + plinthX) / 2 : (A.pivot.x + plinthRight) / 2;
    else if (A.dir === tiles[i + 1].dir) mid = A.dir > 0 ? (A.pivot.x + tiles[i + 1].left) / 2 : (A.pivot.x + tiles[i + 1].pivot.x + w) / 2;
    else mid = xe + W2.hitX / 2;
    const fy = lower ? F2 : F;
    const bw = Math.max(spacing * 0.9, H * 0.42);
    const boardH = H * 0.12;
    const groundY = fy - 20;
    const boardTop = fy - (lower ? 1.03 : BOARD_UP) * H - boardH;
    // keep the board clear of the corridor where the later event is lowered
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
  let die = 0;
  const tileNodes = tiles.map((t, j) => g({name: `${P}-tile${j}`, transform: poseTransform(t, 0)}, t.added ? addedTileArt(ctx, {w, h: H}) : eventTileArt(ctx, {w, h: H, index: die, color: tileColor(ctx, die++)})));
  const lossArts = losses.map((b, q) => lossArt(ctx, {name: `${P}-loss${q}-art`, w: b.w, h: b.h, kind: q ? 'jug' : 'vase', color: q ? shade(th.accent4, 0.25) : th.accent3}));
  const lossNodes = losses.map((b, q) => g({name: `${P}-loss${q}`, transform: poseTransform(b, 0)}, lossArts[q].node));
  const shardShapes = [[[0, 0], [24, -9], [12, 15]], [[0, 0], [18, 6], [3, 18]], [[0, 0], [15, -12], [21, 9]]];
  const shards = losses.map((b, q) => shardShapes.slice(0, q ? 2 : 3).map((pts, c) => h('path', {name: `${P}-shard${q}-${c}`, d: `M${pts.map(pp => `${r(pp[0] * H / 270)} ${r(pp[1] * H / 270)}`).join('L')}Z`, fill: q ? shade(th.accent4, 0.25) : th.accent3, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0})));
  const jr = Math.max(o.jointMin ?? 23, H * 0.075); // the disputed "?" stays >= 16 px at 1080p
  const joints = M.links.map((l, j) => jointArt(ctx, {name: `${P}-joint${j}`, disputed: l.status === 'disputed', radius: jr}));
  // the link across the empty slot (without run only): its status is the one of the link into the slot
  const bridgeDisputed = M.links[k - 1].status === 'disputed' || M.links[k].status === 'disputed';
  const bridge = jointArt(ctx, {name: `${P}-jointB`, disputed: bridgeDisputed, radius: jr});
  // ghost of the pose the next piece would take if a held run went on (dashed = pending, never decided)
  const ghost = h('path', {name: `${P}-ghost`, d: 'M0 0', fill: 'none', stroke: th.fgSoft, 'stroke-width': 3, 'stroke-dasharray': '9 7', opacity: 0});

  // pendulum
  const pend = g({name: `${P}-pend`},
    h('line', {name: `${P}-tether`, x1: r(postL + 9), y1: r(raisedBob.y - rb * 0.3), x2: r(raisedBob.x - rb * 0.7), y2: r(raisedBob.y), stroke: th.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '2 3'}),
    h('circle', {cx: r(pivot.x), cy: r(pivot.y), r: 6, fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    h('line', {name: `${P}-string`, x1: r(pivot.x), y1: r(pivot.y), x2: r(raisedBob.x), y2: r(raisedBob.y), stroke: th.fgSoft, 'stroke-width': 3}),
    g({name: `${P}-bob`, transform: T(raisedBob.x, raisedBob.y)},
      h('circle', {r: r(rb), fill: th.metalDark, stroke: th.ink, 'stroke-width': th.stroke}),
      h('circle', {cx: r(-rb * 0.35), cy: r(-rb * 0.35), r: r(rb * 0.28), fill: '#ffffff', opacity: 0.35})),
  );

  // trolley + cable + claw (claw local origin = grip point, the carried tile's top centre)
  const fingerD = side => `M${r(side * (w / 2 + 3))} ${r(-bodyH - 2)}V${r(fingerH * 0.62)}L${r(side * (w / 2 - 6))} ${r(fingerH * 0.62)}`;
  const finger = side => h('path', {name: `${P}-claw-f${side < 0 ? 'L' : 'R'}`, d: fingerD(side), fill: 'none', stroke: th.ink, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  const fingerCore = side => h('path', {name: `${P}-claw-c${side < 0 ? 'L' : 'R'}`, d: fingerD(side), fill: 'none', stroke: th.metal, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  const trolley = g({name: `${P}-trolley`, transform: T(bayX, 0)},
    h('rect', {x: r(-clawW * 0.36), y: r(trolleyY - 4), width: r(clawW * 0.72), height: r(trolleyH), rx: 5, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    [-0.22, 0.22].map(f => h('circle', {cx: r(f * clawW), cy: r(beamY + 2), r: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 2})),
  );
  const cable = h('line', {name: `${P}-cable`, x1: r(bayX), y1: r(trolleyY + trolleyH - 4), x2: r(bayX), y2: r(gripUp - bodyH - 6), stroke: th.ink, 'stroke-width': 3});
  const claw = g({name: `${P}-claw`, transform: T(bayX, gripUp)},
    finger(-1), fingerCore(-1), finger(1), fingerCore(1),
    h('path', {d: roundRectPath(-clawW / 2, -bodyH - 6, clawW, bodyH, 5), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: r(-bodyH - 6), r: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}),
  );

  const plinth = plinthArt(ctx, {x: plinthX, top: plinthTop, w: plinthW, floorY: F2 + 6});
  let floorArt;
  if (wrapM) {
    const riserTop = F + 34, riserBot = F2 - 24;
    const riserFill = th.dark ? shade(th.wood, -0.25) : shade(th.woodTop, 0.35);
    floorArt = g({name: `${P}-floor`},
      h('path', {d: `M${r(landL)} ${r(riserTop)}H${r(landR + 8)}V${r(riserBot)}H${r(landL)}Z`, fill: riserFill, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      [0.25, 0.5, 0.75].map(f => h('path', {d: `M${r(landL + (landR - landL) * f)} ${r(riserTop + 10)}V${r(riserBot - 6)}`, stroke: shade(riserFill, -0.12), 'stroke-width': 2})),
      slab(landL + 8, landR, F, true),
      slab(floorL, floorR, F2, false));
  } else floorArt = g({name: `${P}-floor`}, slab(floorL, floorR, F, true));
  const back = g({name: `${P}-back`}, gantry, floorArt, barriers.map(b => b.node), shadows);
  const main = g({name: `${P}-main`}, g({name: `${P}-plinth`}, plinth), lossNodes, shards, ghost, tileNodes, joints, bridge, pend, trolley, cable, claw);
  const node = g({name: P}, back, main);

  // strike point of the last link on the vase (per run)
  const strikeLocal = run => {
    const sim = free[run];
    const q = idx(run, N);
    const cu = sim.starts[q];
    if (!Number.isFinite(cu)) return {x: -vw, y: -vh * 0.8};
    const a = sim.at(cu).angles[q - 1];
    return localAt0(vase, bodyPoint(sim.bodies[q - 1], a, {x: 0, y: -H}));
  };
  const strikeL = {with: strikeLocal('with'), without: strikeLocal('without')};

  /** Pendulum at u: held, released at start − swing, strikes at start, small recoil. */
  const pendPose = u => {
    const u0 = start - swing;
    let deg;
    if (u <= u0) deg = raised;
    else if (u < start) deg = raised * (1 - ease.inQuad((u - u0) / swing));
    else if (ctx.reduced) deg = 0;
    else { const kk = clamp((u - start) / 0.04); deg = 2.4 * Math.sin(Math.PI * kk) * (1 - kk * 0.3); }
    const q = bobAt(deg);
    return {deg, bob: q, nodes: {
      [`${P}-string`]: {x2: r(q.x), y2: r(q.y)},
      [`${P}-bob`]: {transform: T(q.x, q.y)},
      [`${P}-tether`]: {opacity: u <= u0 ? 1 : 0},
    }};
  };

  /** Where the carried tile and the claw are: c = carry 0 (bay) → 1 (over the slot); lower 0 (up) → 1 (standing). */
  const carryAt = (c, lower) => {
    const x = lerp(bayX, slotX, ease.inOutCubic(clamp(c)));
    const up = liftY * (1 - ease.inOutCubic(clamp(lower)));
    return {x, up, grip: {x, y: gripRest - up}};
  };

  /**
   * Pose the stage.
   * @param {'with'|'without'} run   with = the later event stands in its slot once lowered
   * @param {number} u               time (u units)
   * @param {{carry?:number, lower?:number, grip?:number, rise?:number, ghost?:number}} [s]
   *   carry 0 → 1 (bay → slot), lower 0 → 1 (carry height → standing), grip 1 closed → 0 open,
   *   rise 0 → 1 (the empty claw back up to the carry height; only after release)
   */
  function pose(run, u, s = {}) {
    const nodes = {};
    const sim = sims[run];
    const st = sim.at(Math.max(0, u));
    const A = st.angles;
    const carry = run === 'with' ? clamp(s.carry ?? 1) : 0;
    const lower = run === 'with' ? clamp(s.lower ?? 1) : 0;
    const placed = run === 'with' && carry >= 1 && lower >= 1;
    const cp = carryAt(carry, lower);
    const angles = [];
    const tops = [];
    const polys = [];
    for (let i = 0; i < N + losses.length; i++) {
      const b = bodies[i];
      const isLoss = i >= N;
      const isX = i === k;
      const a = isX && !placed ? 0 : isX && run === 'without' ? 0 : A[idx(run, i)] ?? 0;
      angles.push(a);
      let tr;
      let cs;
      if (isX && !placed) {
        tr = `translate(${r(cp.x + w / 2)} ${r(F - cp.up)})`;
        cs = bodyCorners({...b, pivot: {x: cp.x + w / 2, y: F - cp.up}}, 0);
      } else {
        tr = poseTransform(b, a / DEG);
        cs = bodyCorners(b, a);
      }
      nodes[isLoss ? `${P}-loss${i - N}` : `${P}-tile${i}`] = {transform: tr};
      polys.push(cs);
      const top = isX && !placed ? {x: cp.x, y: F - H - cp.up} : bodyPoint(b, a, {x: isLoss ? -b.w / 2 : -b.w / 2, y: -b.h});
      tops.push({x: r(top.x), y: r(top.y)});
      // floor shadow (a lifted tile casts none)
      const xs = cs.map(q => q.x);
      const [sp0, sp1] = spanOf(b.pivot.y);
      const x0s = Math.max(sp0, Math.min(...xs)), x1 = Math.min(sp1, Math.max(...xs));
      const up = isX && !placed ? clamp(1 - (cp.up / (0.25 * H))) : 1;
      const overEdge = wrapM && i === wrapM - 1 ? clamp(1 - (a / DEG - 80) / 20) : 1;
      nodes[`${P}-sh${i}`] = {cx: r((x0s + Math.max(x0s, x1)) / 2), rx: r(Math.max(0, x1 - x0s) / 2 + 4), opacity: r(0.16 * up * overEdge * (x1 - x0s > 6 ? 1 : 0), 3)};
    }
    // link seals: pop in at contact, then ride on the leaning tile's top corner
    const jointPts = M.links.map(() => null);
    let bridgePt = null;
    const jointNode = (name, contactU, pt) => {
      const on = Number.isFinite(contactU) && u >= contactU;
      const pop = on ? seg(u, contactU, contactU + 0.02) : 0;
      const kk = on ? (ctx.reduced ? 1 : 0.6 + 0.4 * ease.outBack(pop)) : 0.6;
      nodes[name] = {transform: T(pt.x, pt.y, 0, kk), opacity: on ? r(clamp(pop * 3), 3) : 0};
      return on ? {x: r(pt.x), y: r(pt.y)} : null;
    };
    const lastQ = idx(run, N) - 1;
    const hq = held[run];
    for (let j = 0; j < N; j++) {
      const name = `${P}-joint${j}`;
      if (run === 'without' && (j === k - 1 || j === k)) { nodes[name] = {transform: T(slotX, F - H, 0, 0.6), opacity: 0}; continue; }
      const q = idx(run, j);
      const contactU = hq !== null && q > hq ? Infinity : sim.starts[q + 1];
      const pt = q === lastQ ? bodyPoint(vase, A[q + 1], strikeL[run]) : bodyPoint(sim.bodies[q], A[q], {x: 0, y: -H});
      jointPts[j] = jointNode(name, contactU, pt);
    }
    if (run === 'without') {
      const q = k - 1;
      const contactU = hq !== null && q > hq ? Infinity : sim.starts[q + 1];
      bridgePt = jointNode(`${P}-jointB`, contactU, bodyPoint(sim.bodies[q], A[q], {x: 0, y: -H}));
    } else nodes[`${P}-jointB`] = {transform: T(slotX, F - H, 0, 0.6), opacity: 0};
    // ghost of the next piece's pose when a held run has reached its disputed link
    let ghostOn = 0;
    if (hq !== null && Number.isFinite(sim.starts[hq + 1]) && u >= sim.starts[hq + 1] && hq + 1 < lastQ + 1) {
      const nb = sim.bodies[hq + 1];
      const fa = freeSettled[run].angles[hq + 1];
      const gcs = bodyCorners(nb, fa);
      nodes[`${P}-ghost`] = {d: `M${gcs.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}Z`, opacity: r(clamp(seg(u, sim.starts[hq + 1] + 0.02, sim.starts[hq + 1] + 0.06)) * (s.ghost ?? 1), 3)};
      ghostOn = 1;
    } else nodes[`${P}-ghost`] = {d: 'M0 0', opacity: 0};
    // cracks and shards on landing
    const cracked = [];
    const lossState = [];
    losses.forEach((b, q) => {
      const bi = idx(run, N + q);
      const land = landAt[run][q];
      const art = lossArts[q];
      const cpq = Number.isFinite(land) ? seg(u, land, land + 0.03) : 0;
      nodes[`${P}-loss${q}-art-crack`] = {'stroke-dashoffset': r(art.crackLen * (1 - ease.outCubic(cpq)))};
      nodes[`${P}-loss${q}-art-crackg`] = {opacity: r(clamp((cpq - 0.5) * 2), 3)};
      cracked.push(r(cpq, 3));
      lossState.push(!(A[bi] > 0) ? 'intact' : u >= land ? 'down' : 'tipping');
      const lip = bodyPoint(b, A[bi] ?? 0, {x: art.crackTip.x, y: art.crackTip.y});
      const count = q ? 2 : 3;
      for (let c = 0; c < count; c++) {
        const sp = Number.isFinite(land) ? seg(u, land, land + 0.04) : 0;
        const off = (26 + c * 26 + q * 60) * (H / 270) * (dirL > 0 ? 1 : 0.58);
        const restX = dirL > 0 ? plinthRight + off : plinthX - off;
        const restY = F2 - 3 - (c % 2) * 4;
        const x = lerp(lip.x, restX, ease.outCubic(sp));
        const arcY = -Math.sin(Math.PI * Math.min(1, sp * 1.6)) * 30 * (H / 270) * (sp < 0.625 ? 1 : 0);
        const y = lerp(lip.y, restY, ease.inQuad(sp)) + arcY;
        nodes[`${P}-shard${q}-${c}`] = {transform: T(x, y, dirL * sp * (80 + c * 40)), opacity: sp > 0 ? 1 : 0};
      }
    });
    const pp = pendPose(u);
    Object.assign(nodes, pp.nodes);
    // trolley, cable and claw: they carry the tile, lower it, open, and the empty claw rises again
    const grip = clamp(s.grip ?? 1);
    const rise = run === 'with' ? clamp(s.rise ?? 0) : 0;
    const clawY = placed ? lerp(gripRest, clawUp, ease.inOutCubic(rise)) : cp.grip.y;
    const cx = run === 'with' ? cp.x : bayX;
    const open = run === 'with' ? 1 - grip : 0;
    nodes[`${P}-trolley`] = {transform: T(r(cx), 0)};
    nodes[`${P}-latch`] = {transform: T(0, r(-trolleyH * (1 - ease.inOutCubic(clamp(s.latch ?? 0))), 2))};
    nodes[`${P}-claw`] = {transform: T(cx, clawY)};
    const fr = side => `rotate(${r(side * 14 * open)} ${r(side * (w / 2 + 3))} ${r(-bodyH - 2)})`;
    nodes[`${P}-claw-fL`] = {transform: fr(-1)};
    nodes[`${P}-claw-cL`] = {transform: fr(-1)};
    nodes[`${P}-claw-fR`] = {transform: fr(1)};
    nodes[`${P}-claw-cR`] = {transform: fr(1)};
    nodes[`${P}-cable`] = {x1: r(cx), x2: r(cx), y2: r(clawY - bodyH - 6)};
    const started = tiles.map((_, j) => (j === k && !placed ? false : run === 'without' && j === k ? false : Boolean(st.started[idx(run, j)])));
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
        ghost: ghostOn,
        bob: {x: r(pp.bob.x), y: r(pp.bob.y)},
        claw: {x: r(cx), y: r(clawY)},
        addedTop: tops[k],
        placed,
        carry: r(carry, 3),
        lower: r(lower, 3),
        grip: r(grip, 3),
        latch: r(clamp(s.latch ?? 0), 3),
      },
    };
  }

  /** Claw finger box at a claw position (for clearance checks). */
  const clawBox = (x, y) => ({x: x - clawW / 2, y: y - bodyH - 8, w: clawW, h: bodyH + fingerH + 10});

  return {
    node, back, main, pose, sims, free, settled, landAt, tiles, losses, bodies, barriers, strikeL, held,
    H, w, spacing, floorY: F, x0, left: floorL + 8, right, floorL, floorR, beamY, slotX, bayX, k, N,
    plinth: {x: plinthX, top: plinthTop, w: plinthW, right: plinthRight, floorY: F2},
    floorY2: F2, wrapM, xe, landL, landR,
    clawW, gripRest, gripUp, pivot, hit, rb, raisedBob, Lp, bodyH, fingerH, clawBox, carryAt,
    /** boxes of the fixed rig, for label placement */
    rigBoxes: [
      {x: floorL - 20, y: beamY - 6, w: right - floorL + 40, h: beamH + trolleyH + 12},
      {x: postL - 14, y: beamY, w: 28, h: F - beamY},
      {x: postR - 14, y: beamY, w: 28, h: F2 - beamY},
      {x: Math.min(raisedBob.x, pivot.x) - rb - 6, y: pivot.y, w: Math.abs(hit.x - raisedBob.x) + 2 * rb + 12, h: Math.max(raisedBob.y, hit.y) + rb - pivot.y + 10},
      ...(wrapM ? [{x: landL - 8, y: F - 32, w: landR - landL + 16, h: 66}, {x: landL - 8, y: F + 30, w: landR - landL + 16, h: F2 - F - 30}, {x: floorL - 8, y: F2 - 32, w: floorR - floorL + 16, h: 70}] : [{x: floorL - 8, y: F - 32, w: floorR - floorL + 16, h: 70}]),
      {x: plinthX - 4, y: plinthTop, w: plinthW + 8, h: F2 - plinthTop + 30},
    ],
    /** the corridor the later event travels through (bay → slot, then down) */
    carryBoxes: [
      {x: Math.min(slotX, bayX) - clawW / 2 - 6, y: gripUp - bodyH - 12, w: Math.abs(bayX - slotX) + clawW + 12, h: H + bodyH + 18},
      {x: slotX - clawW / 2 - 6, y: gripUp - bodyH - 12, w: clawW + 12, h: F - gripUp + bodyH + 12},
    ],
    polysAt: (run, u, s) => pose(run, u, s).polys,
    /** the vase's centre in a pose */
    lossCenter: (run, u) => {
      const a = sims[run].at(Math.max(0, u)).angles[idx(run, N)];
      return bodyPoint(vase, a, {x: -vw / 2, y: -vh / 2});
    },
    /** contact time (u) of full-sequence link j in a run (Infinity when held before it) */
    contactU: (run, j) => {
      const q = runLink(run, M, j);
      if (held[run] !== null && q > held[run]) return Infinity;
      return sims[run].starts[q + 1];
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Legend (die / ◆ / vase / barrier / seal icons + glue-fitted chips)        */
/* ------------------------------------------------------------------------ */

function pendIcon(ctx, x, cy, s) {
  const th = ctx.theme;
  return g(null,
    h('path', {d: `M${r(x + s * 0.1)} ${r(cy - s * 0.42)}H${r(x + s * 0.9)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(x + s * 0.5)} ${r(cy - s * 0.42)}L${r(x + s * 0.32)} ${r(cy + s * 0.18)}`, stroke: th.fgSoft, 'stroke-width': 2.5}),
    h('circle', {cx: r(x + s * 0.3), cy: r(cy + s * 0.26), r: r(s * 0.16), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
}

function craneIcon(ctx, x, cy, s) {
  const th = ctx.theme;
  const cx = x + s / 2;
  return g(null,
    h('path', {d: `M${r(x + s * 0.02)} ${r(cy - s * 0.46)}H${r(x + s * 0.98)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(cx)} ${r(cy - s * 0.42)}V${r(cy - s * 0.22)}`, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(cx - s * 0.26, cy - s * 0.24, s * 0.52, s * 0.12, 3), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: roundRectPath(cx - s * 0.13, cy - s * 0.1, s * 0.26, s * 0.58, 3), fill: addedColor(ctx), stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: `M${r(cx - s * 0.2)} ${r(cy - s * 0.12)}V${r(cy + s * 0.04)}M${r(cx + s * 0.2)} ${r(cy - s * 0.12)}V${r(cy + s * 0.04)}`, stroke: th.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round'}));
}

/**
 * Icon for a legend row, drawn with its top-left at (x, cy − s/2).
 * kinds: event (die, i), added (◆ face), initial (● die face), loss, alt, link (dim = disputed), pend, crane.
 */
export function legendIcon(ctx, it, x, cy, s, name) {
  const th = ctx.theme;
  if (it.kind === 'event') return g({transform: T(x, cy - s / 2)}, dieFace(ctx, {s, k: it.i + 1, fill: tileColor(ctx, it.i), pip: '#ffffff'}));
  if (it.kind === 'added') return g({transform: T(x, cy - s / 2)}, sideMark(ctx, {s, added: true}));
  if (it.kind === 'initial') return g({transform: T(x, cy - s / 2)}, sideMark(ctx, {s, added: false}));
  if (it.kind === 'loss') return g({transform: T(x + s * 0.81, cy + s / 2)}, lossArt(ctx, {name: `${name}-vase`, w: s * 0.62, h: s, kind: 'vase'}).node);
  if (it.kind === 'alt') return g({transform: T(x + s / 2, cy + s / 2)}, barrierArt(ctx, {name: `${name}-bar`, w: s * 0.95, h: s * 0.9}));
  if (it.kind === 'pend') return pendIcon(ctx, x, cy, s);
  if (it.kind === 'crane') return craneIcon(ctx, x, cy, s);
  if (it.kind === 'link') return g({transform: T(x + s / 2, cy)}, jointArt(ctx, {name: `${name}-j`, disputed: Boolean(it.dim), radius: Math.max(s * 0.42, 23)}));
  return null;
}

/** Chip fill/stroke of a legend row. */
function rowColors(ctx, kind) {
  const th = ctx.theme;
  if (kind === 'loss') return {fill: th.accent3Soft, stroke: th.accent3};
  if (kind === 'alt') return {fill: th.accentSoft, stroke: th.accent};
  if (kind === 'link') return {fill: th.card, stroke: th.accent4};
  if (kind === 'added') return {fill: th.card, stroke: addedColor(ctx)};
  if (kind === 'event' || kind === 'initial') return {fill: th.card, stroke: th.accent2};
  return {fill: th.card, stroke: th.inkSoft};
}

/**
 * Legend block: rows of icon + chip, in `cols` columns (column-major, balanced by height).
 * @param {any} ctx
 * @param {Array<{key:string, kind:string, i?:number, text:string, dim?:boolean}>} items
 * @param {{x:number, y:number, w:number, cols?:number, size:number, maxLines?:number, iconS?:number, gap?:number, colGap?:number, prefix?:string, icons?:boolean, padY?:number}} o
 * @returns {{rows:Array<{key:string, name:string, show:string[], node:any, box:any, chip:any, iconBox:any}>, h:number, minPx:number, truncated:boolean}}
 */
export function ieLegend(ctx, items, o) {
  const cols = Math.max(1, o.cols ?? 1);
  const colGap = o.colGap ?? 28;
  const gap = o.gap ?? 12;
  const iconS = o.iconS ?? o.size * 1.45;
  const colW = (o.w - (cols - 1) * colGap) / cols;
  const pre = o.prefix ?? 'lg';
  const padY = o.padY ?? o.size * 0.38;
  const noIcon = it => o.icons === false || it.kind === 'note';
  const probeOf = it => {
    const iw = noIcon(it) ? 0 : iconS + 14;
    return chipG(ctx, it.text, {x: 0, y: 0, maxWidth: colW - iw, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 3, padY, align: 'start'});
  };
  const probes = items.map(probeOf);
  const hs = items.map((it, i) => Math.max(probes[i].box.h, noIcon(it) ? 0 : iconS) + gap);
  const total = hs.reduce((a, b) => a + b, 0);
  const groups = [];
  let cur = [], cum = 0;
  items.forEach((it, i) => {
    if (cur.length && groups.length < cols - 1 && cum + hs[i] / 2 > total * (groups.length + 1) / cols) { groups.push(cur); cur = []; }
    cur.push(i);
    cum += hs[i];
  });
  if (cur.length) groups.push(cur);
  const rows = [];
  let maxBottom = o.y;
  let minPx = Infinity;
  let truncated = false;
  for (let c = 0; c < groups.length; c++) {
    let y = o.y;
    const x = o.x + c * (colW + colGap);
    for (const i of groups[c]) {
      const it = items[i];
      const iw = noIcon(it) ? 0 : iconS + 14;
      const pr = probes[i];
      const rh = Math.max(pr.box.h, noIcon(it) ? 0 : iconS);
      const cy = y + rh / 2;
      const col = rowColors(ctx, it.kind);
      const c2 = chipG(ctx, it.text, {x: x + iw, y: cy - pr.box.h / 2, maxWidth: colW - iw, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 3, align: 'start', padY, fill: col.fill, stroke: col.stroke});
      minPx = Math.min(minPx, c2.fit.size);
      truncated = truncated || c2.fit.truncated || c2.fit.broken;
      const name = `${pre}-${it.key}`;
      const icon = noIcon(it) ? null : legendIcon(ctx, it, x, cy, iconS, name);
      const node = g({name, opacity: 0}, icon, c2.node);
      rows.push({key: it.key, kind: it.kind, name, show: it.kind === 'link' && !noIcon(it) ? [`${name}-j`] : [], node, box: {x, y, w: c2.box.x + c2.box.w - x, h: rh}, chip: c2.box, iconBox: noIcon(it) ? null : {x, y: cy - iconS / 2, w: iconS, h: iconS}});
      y += rh + gap;
    }
    maxBottom = Math.max(maxBottom, y - gap);
  }
  return {rows, h: maxBottom - o.y, minPx, truncated};
}

/** Legend rows' frame (the seals inside link rows start hidden in jointArt; show them with the row). */
export function legendFrame(rows, p) {
  const out = {};
  for (const rw of rows) {
    const v = typeof p === 'function' ? p(rw) : p;
    out[rw.name] = {opacity: r(clamp(v), 3)};
    for (const nm of rw.show) out[nm] = {opacity: 1};
  }
  return out;
}

/** A short supplied time label ("T+2 min") kept on one line (U+00A0; glue-aware fitting keeps it whole). */
export const nb = s => (String(s).length <= 16 ? String(s).replace(/ /g, '\u00a0') : String(s));

/**
 * Standard legend items for a resolved model: events (die), the later event (◆), losses, alternatives, links with
 * supplied data, and the clamp note.
 */
export function modelItems(ctx, M) {
  const t = ctx.t;
  const items = [];
  M.events.forEach((e, i) => items.push({key: `ev${i}`, kind: 'event', i, text: `${i + 1}. ${e.label}${e.time ? ` · ${nb(e.time)}` : ''}`}));
  const ad = M.added;
  items.push({key: 'added', kind: 'added', text: `${t.added}: ${ad.label}${ad.time ? ` · ${nb(ad.time)}` : ''} (${t.enters.replace('{a}', String(M.after + 1))})`});
  M.losses.forEach((l, j) => items.push({key: `loss${j}`, kind: 'loss', text: `${t.lossAs}: ${l.label}`}));
  M.alternatives.forEach((a, j) => items.push({key: `alt${j}`, kind: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`}));
  M.links.forEach(l => {
    const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputedLink : null, l.label || null].filter(Boolean);
    if (bits.length) items.push({key: `lk${l.from}`, kind: 'link', dim: l.status === 'disputed', text: `${t.link} ${pieceName(t, M, l.from)} → ${pieceName(t, M, l.from + 1)}: ${bits.join(' · ')}`});
  });
  const cn = clampNote(ctx, M);
  if (cn) items.push({key: 'clamp', kind: 'note', text: cn});
  return items;
}

/**
 * Flow chips into rows (left to right, wrapping), each item {w, h}; returns placed items and the bottom.
 * @param {Array<{w:number,h:number}>} items
 * @param {{x:number, y:number, w:number, gap?:number, rowGap?:number}} o
 */
export function flowRows(items, o) {
  const gap = o.gap ?? 18, rowGap = o.rowGap ?? 10;
  let x = o.x, y = o.y, rowH = 0;
  const placed = [];
  for (const it of items) {
    if (x > o.x && x + it.w > o.x + o.w + 0.5) { x = o.x; y += rowH + rowGap; rowH = 0; }
    placed.push({...it, x, y});
    x += it.w + gap;
    rowH = Math.max(rowH, it.h);
  }
  return {placed, bottom: placed.length ? y + rowH : o.y};
}

/** Chip with an icon (header chips, band notes). */
export function iconChip(ctx, it, x, y, size, iconS, name, fill, stroke) {
  const mw = it.mw - (it.icon ? iconS + 12 : 0);
  const bw = balancedG(ctx, it.text, {maxWidth: mw, size, maxLines: it.maxLines ?? 4});
  const probe = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size, maxLines: it.maxLines ?? 4});
  const hh = Math.max(probe.box.h, it.icon ? iconS : 0);
  const iw = it.icon ? iconS + 12 : 0;
  const c = chipG(ctx, it.text, {x: x + iw, y: y + (hh - probe.box.h) / 2, maxWidth: bw, size, maxLines: it.maxLines ?? 4, fill, stroke});
  const icon = it.icon ? legendIcon(ctx, {kind: it.icon}, x, y + hh / 2, iconS, name) : null;
  return {node: g({name, opacity: 0}, icon, c.node), box: {x, y, w: iw + c.box.w, h: hh}, chip: c.box, fit: c.fit};
}

/** Size (w, h) of an iconChip without building nodes. */
export function iconChipSize(ctx, it, size, iconS) {
  const mw = it.mw - (it.icon ? iconS + 12 : 0);
  const bw = balancedG(ctx, it.text, {maxWidth: mw, size, maxLines: it.maxLines ?? 4});
  const c = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size, maxLines: it.maxLines ?? 4});
  return {w: (it.icon ? iconS + 12 : 0) + c.box.w, h: Math.max(c.box.h, it.icon ? iconS : 0), bad: c.fit.truncated || c.fit.broken};
}


export {seg, clamp, ease, lerp, r};
