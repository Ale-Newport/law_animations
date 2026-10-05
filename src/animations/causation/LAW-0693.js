/**
 * LAW-0693 — Evento interviniente · story
 *
 * Storyboard (side view of one model stage under a gantry; only the rig moves
 * the pieces):
 *  0.00–0.15 rest     The initial sequence as supplied: one upright tile per
 *                     event (die faces = supplied order), an empty slot one
 *                     tile wide between the two events where the later event
 *                     will enter, the vase on its plinth, a pendulum held back
 *                     by a tether. The later event's tile (◆ face, own colour)
 *                     hangs from a claw under a trolley parked in the bay at
 *                     the far end of the beam. Two equal header chips name the
 *                     two sides: "● Initial sequence" and "◆ Later event".
 *  0.14–0.30 carry    The trolley carries the later event along the beam, high
 *                     above every tile and barricade. Meanwhile (when the slot
 *                     is not right after the first event) the tether drops and
 *                     the bob strikes tile 1: the initial sequence starts to
 *                     run, each tile moving only when the previous one touches
 *                     it.
 *  0.30–0.43 enter    Over the slot the claw lowers the tile until it stands on
 *                     the floor (0.30–0.36), opens (0.36–0.38) and rises clear
 *                     (0.38–0.43). No teleport: one continuous path.
 *  0.43–0.75 continue The tile before the slot reaches the later event, which
 *                     reaches the next tile, and so on per the supplied model:
 *                     with "reaches-loss" the last tile tips the vase, which
 *                     cracks; with "unresolved-at-disputed-link" the run holds
 *                     at that link (seal "?" + dashed ghost of the next pose),
 *                     never decided. The cause always precedes the visible
 *                     effect.
 *  0.75–1.00 hold     Status chip "Reaches the loss (as supplied)" (or the held
 *                     status), notes and the key "As supplied · no conclusion
 *                     drawn". Nothing says the later event breaks, replaces,
 *                     relieves or shifts anything; no legal test is named.
 * Wide boxes: stage left, text column right (or stage over a legend in
 * columns). Square/tall: stage over the legend.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0693
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, obj, list, annotation} from '../../schemas/fields.js';
import {unionBounds} from './kits/place.js';
import {
  ieFields, resultField, IE_STRINGS, resolveIE, ieStage, ieGeom, fitIeH, wrapChoices,
  chipG, ieLegend, legendFrame, modelItems, flowRows, iconChip, iconChipSize,
} from './kits/evento-interviniente.js';

const ID = 'LAW-0693';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  legend: [0, 0.1], header: [0.02, 0.1],
  carry: [0.14, 0.3], lower: [0.3, 0.36], release: [0.36, 0.38], rise: [0.38, 0.43],
  contact: 0.45,
  status: [0.76, 0.81], notes: [0.78, 0.84], key: [0.8, 0.86],
};

const sceneSchema = {
  ...ieFields,
  actorLabels: obj('Captions for the two machine actors of the model', {
    a: str('Caption for the trigger (the pendulum that starts the initial sequence)', 80),
    b: str('Caption for the crane that carries the later event into the sequence', 80),
  }),
  objectLabels: obj('Labels printed in the scene', {
    initial: str('Header chip naming the initial sequence (comparison side A)', 60),
    added: str('Header chip naming the later event (comparison side B)', 60),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['added', 'initial', 'loss']), 0, 2),
  finalState: resultField('SUPPLIED final state of the sequence after the later event has entered: it reaches the loss, or it is held unresolved at a disputed link (never decided)'),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+2 min'},
    {label: 'Display stand shakes', time: 'T+3 min'},
  ],
  addedEvent: {label: 'Cleaner nudges the stand', time: 'T+2 min', after: 1},
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  actorLabels: {a: 'Trigger: starts the initial sequence', b: 'Crane: carries the later event in'},
  objectLabels: {initial: 'Initial sequence', added: 'Later event'},
  actionProgress: 1,
  annotations: [{target: 'added', text: 'The later event enters between two supplied events'}],
  finalState: 'reaches-loss',
};

const SHAPES = {
  landscape: {size: 24, baseMin: 20, minSize: 17, modes: ['side', 'below'], maxH: 300},
  square: {size: 24, baseMin: 20, minSize: 17, modes: ['below', 'side'], maxH: 260},
  portrait: {size: 25, baseMin: 20.5, minSize: 17, modes: ['below'], maxH: 240},
};
const MARGIN = 10;
const H_MIN = 110;

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M, SH, lossCount} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const size = cfg.size;
  const iconS = size * 1.45;
  const side = cfg.mode === 'side' && keyOn;
  const full = D.w - 2 * MARGIN;
  const colW = side ? Math.round(D.w * cfg.colF) : full;
  const colX = side ? D.w - MARGIN - colW : MARGIN;
  const regionW = side ? D.w - 2 * MARGIN - colW - 28 : full;

  // ---- header: two equal chips naming the two sides of the comparison (● initial, ◆ later)
  const heads = keyOn ? [
    {key: 'hA', icon: 'initial', text: p.objectLabels.initial || t.initial, mw: Math.min(regionW / 2 - 12, 520), maxLines: 2},
    {key: 'hB', icon: 'added', text: p.objectLabels.added || t.added, mw: Math.min(regionW / 2 - 12, 520), maxLines: 2},
  ] : [];
  const headSz = heads.map(it => iconChipSize(ctx, it, size, iconS));
  if (headSz.some(s0 => s0.bad)) return {bad: 'head'};
  const headH = headSz.length ? Math.max(...headSz.map(s0 => s0.h)) : 0;
  const top = headH ? headH + 14 : 0;

  // ---- legend and band items (measured before the stage)
  const items = [];
  if (keyOn) {
    items.push(...modelItems(ctx, M));
    if (allOn && p.actorLabels.a) items.push({key: 'pend', kind: 'pend', text: p.actorLabels.a});
    if (allOn && p.actorLabels.b) items.push({key: 'crane', kind: 'crane', text: p.actorLabels.b});
  }
  const statusText = p.finalState === 'reaches-loss' ? t.reaches : t.held;
  const band = [];
  if (keyOn) {
    band.push({key: 'status', icon: 'loss', text: statusText, maxLines: 4});
    if (allOn) p.annotations.forEach((a, i) => band.push({key: `note${i}`, icon: a.target === 'loss' ? 'loss' : a.target === 'added' ? 'added' : 'initial', text: a.text, maxLines: 4, target: a.target}));
    band.push({key: 'key', text: t.key, maxLines: 3});
  }
  const bandW = side ? colW : full;
  band.forEach(it => { it.mw = Math.min(bandW, side ? bandW : 620); });
  const bandSz = band.map(it => iconChipSize(ctx, it, size, iconS));
  if (bandSz.some(s0 => s0.bad)) return {bad: 'band'};

  let lg = {rows: [], h: 0, minPx: size, truncated: false};
  const lgOpts = y => ({x: colX, y, w: colW, cols: side ? 1 : cfg.cols, size, maxLines: cfg.maxLines ?? 3, iconS, prefix: 'lg', gap: cfg.gap ?? 10});
  if (items.length) {
    lg = ieLegend(ctx, items, lgOpts(0));
    if (lg.truncated) return {bad: 'legend'};
  }
  const flowProbe = flowRows(bandSz, {x: 0, y: 0, w: bandW, gap: 20, rowGap: 10});
  const bandH = band.length ? flowProbe.bottom : 0;

  // ---- stage size
  let stageH, stageW = regionW;
  if (side) {
    const colH = lg.h + (band.length ? 18 + bandH : 0);
    if (colH > D.h) return {bad: 'col', over: colH - D.h};
    stageH = D.h - top;
  } else {
    stageH = D.h - top - (lg.h ? lg.h + 18 : 0) - (band.length ? bandH + 16 : 0);
  }
  const H = fitIeH(M.N, stageW, stageH, SH.maxH, lossCount, cfg.wrapM ?? null);
  if (!H || H < (cfg.hMin ?? H_MIN)) return {bad: 'H', H};
  if (cfg.dry) { const g0 = ieGeom(M.N, H, lossCount, cfg.wrapM ?? null); return {H, size, area: g0.width * (g0.above + g0.below), cfg: {...cfg, dry: false}}; }

  // ---- stage
  const gm = ieGeom(M.N, H, lossCount, cfg.wrapM ?? null);
  const geomW = gm.width;
  const stageX = side ? MARGIN : MARGIN + (full - geomW) / 2;
  const stageBlockH = gm.above + gm.below;
  // vertical: the stage block is centred in the room left for it
  const room = stageH;
  const F = top + Math.max(0, (room - stageBlockH) / 2) + gm.above;
  const stage = ieStage(ctx, {prefix: 'st', x: stageX, floorY: F, H, M, lossCount, take: base.take, hold: base.hold, wrapM: cfg.wrapM ?? null, span: side ? [MARGIN, MARGIN + regionW] : [MARGIN, D.w - MARGIN]});
  const stageBottom = F + gm.below;

  // header chips: A over the start of the initial sequence, B over the bay
  const hx = [Math.max(MARGIN, Math.min(stage.x0 - 20, MARGIN + regionW - headSz[0]?.w - headSz[1]?.w - 30)), 0];
  const headNodes = [];
  if (heads.length) {
    const bx = Math.max(hx[0] + headSz[0].w + 30, Math.min(stage.bayX + 20 - headSz[1].w, MARGIN + regionW - headSz[1].w));
    [hx[0], bx].forEach((x, i) => headNodes.push(iconChip(ctx, heads[i], x, (headH - headSz[i].h) / 2 + 0, size, iconS, heads[i].key, th.card, i ? th.inkSoft : th.inkSoft)));
  }

  // legend + band
  let lgY, bandY;
  if (side) {
    lgY = Math.max(0, (D.h - lg.h - (band.length ? 18 + bandH : 0)) / 2);
    bandY = lgY + lg.h + (lg.h ? 18 : 0);
  } else {
    lgY = stageBottom + 18;
    bandY = lgY + (lg.h ? lg.h + 16 : 0);
  }
  if (items.length) lg = ieLegend(ctx, items, lgOpts(lgY));
  const bandX = side ? colX : MARGIN;
  const placed = flowRows(bandSz.map((s0, i) => ({...s0, i})), {x: bandX, y: bandY, w: bandW, gap: 20, rowGap: 10}).placed;
  const bandNodes = placed.map(pl => {
    const it = band[pl.i];
    const col = it.key === 'status' ? {fill: th.accent3Soft, stroke: th.accent3} : {fill: th.card, stroke: th.inkSoft};
    const c = iconChip(ctx, it, pl.x, pl.y, size, iconS, `band-${it.key}`, col.fill, col.stroke);
    return {key: it.key, node: c.node, box: c.box, target: it.target};
  });

  const ext = unionBounds([{x: stage.left - 8, y: stage.beamY - 8, w: stage.right - stage.left + 16, h: stageBottom - stage.beamY + 8}, ...headNodes.map(n0 => n0.box), ...lg.rows.map(rw => rw.box), ...bandNodes.map(b => b.box)]);
  return {stage, heads: headNodes, lg, band: bandNodes, ext, H, size, side, F, cfg};
}

/** Last resort (nothing fits at the text floor): compose in a taller virtual box; the result is scaled into the real one (k < 1, reported). */
function fallbackCompose(ctx, base, cfgs, ok) {
  for (let f = 1; f <= 3.01; f += 0.1) {
    const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
    for (const cfg of cfgs) { const X = compose(c2, base, cfg); if (ok(X)) { X.ctx2 = c2; return X; } }
  }
  return null;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveIE(p);
    const lossCount = Math.min(2, p.losses.length);
    // unresolved: hold at the first supplied disputed link, else at the later event's out-link (marked disputed)
    let holdW = null;
    if (p.finalState === 'unresolved-at-disputed-link') {
      if (M.disputed === null) { M.links[M.k] = {...M.links[M.k], status: 'disputed'}; M.disputed = M.k; }
      holdW = M.disputed;
    }
    // timing: the tile before the slot reaches the later event at W.contact; every contact takes d
    const d = Math.min(0.042, 0.24 / Math.max(1, M.N - M.k));
    const take = {start: W.contact - M.k * d, d, swing: 0.05};
    const base = {M, SH, lossCount, take, hold: {with: holdW, without: null}};
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 1) out.push(s); out.push(b); return out; };
    const wraps = [null, ...(ctx.view.shape === 'portrait' ? wrapChoices(M.N, M.k) : [])];
    const cfgsFor = (mode, size) => (mode === 'side'
      ? [0.22, 0.26, 0.3, 0.34, 0.38, 0.42].flatMap(colF => wraps.flatMap(wrapM => [{mode, size, colF, wrapM}, {mode, size, colF, wrapM, maxLines: 5, gap: 8}]))
      : [1, 2, 3].flatMap(cols => wraps.flatMap(wrapM => [{mode, size, cols, wrapM}, {mode, size, cols, wrapM, maxLines: 5, gap: 8}])));
    let pick = null;
    const why = [];
    for (const sizes of [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)]) {
      const cands = [];
      for (const size of sizes) {
        for (const mode of ctx.show('key') ? SH.modes : ['below']) {
          for (const cfg of cfgsFor(mode, size)) {
            const X = compose(ctx, base, {...cfg, dry: true});
            if (X.cfg) cands.push(X); else why.push(`${cfg.mode}${cfg.colF ?? cfg.cols}@${size}:${X.bad}${X.H ? Math.round(X.H) : ''}${X.over ? Math.round(X.over) : ''}`);
          }
        }
      }
      if (cands.length) {
        const maxSize = Math.max(...cands.map(c => c.size));
        const lo = Math.max(sizes[sizes.length - 1], maxSize - 3);
        pick = cands.filter(c => c.size >= lo - 1e-9).sort((a, b) => b.area - a.area || b.size - a.size)[0];
        break;
      }
    }
    let L;
    if (pick) { L = compose(ctx, base, pick.cfg); L.k = 1; } else {
      L = fallbackCompose(ctx, base, [...(SH.modes.includes('side') ? [{mode: 'side', colF: 0.42}] : []), {mode: 'below', cols: 3}, {mode: 'below', cols: 2}].map(c => ({...c, size: SH.minSize, maxLines: 6, gap: 6})), X => Boolean(X.stage));
    }
    L.fallback = !pick; L.dbgPick = pick ? {H: pick.H, size: pick.size, cfg: pick.cfg} : null;
    L.why = [...new Set(why.filter(w0 => /@17:/.test(w0)))];
    L.M = M;
    L.take = take;
    const D = ctx.design;
    const e = L.ext;
    L.k = Math.min(1, D.w / e.w, D.h / e.h);
    L.dx = (D.w - e.w * L.k) / 2 - e.x * L.k;
    L.dy = (D.h - e.h * L.k) / 2 - e.y * L.k;
    return L;
  },
  build(ctx, L) {
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.stage.back,
      L.stage.main,
      L.heads.map(n0 => n0.node),
      L.lg.rows.map(rw => rw.node),
      L.band.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const M = L.M;
    const capU = lerp(W.carry[0], 0.75, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const carry = seg(a, ...W.carry), lower = seg(a, ...W.lower);
    const grip = 1 - seg(a, ...W.release), rise = seg(a, ...W.rise);
    const posed = L.stage.pose('with', a, {carry, lower, grip, rise});
    const nodes = posed.nodes;
    const S = posed.semantic;
    const lgP = seg(u, ...W.legend);
    Object.assign(nodes, legendFrame(L.lg.rows, rw => clamp(lgP * 1.5 - 0.3 * L.lg.rows.indexOf(rw) / Math.max(1, L.lg.rows.length))));
    L.heads.forEach((hd, i) => { nodes[i ? 'hB' : 'hA'] = {opacity: r(seg(u, ...W.header), 3)}; });
    for (const b of L.band) {
      const pr = b.key === 'status' ? (done ? seg(u, ...W.status) : 0) : b.key === 'key' ? seg(u, ...W.key) : (done ? seg(u, ...W.notes) : 0);
      nodes[`band-${b.key}`] = {opacity: r(pr, 3)};
    }
    const phase = a < W.carry[0] ? 'rest' : a < W.lower[0] ? 'carry' : a < W.rise[1] ? 'enter' : 'continue';
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      phase,
      finalState: p.finalState,
      k: M.k, N: M.N,
      angles: S.angles, started: S.started, joints: S.joints, lossState: S.lossState, cracked: S.cracked, ghost: S.ghost,
      bob: S.bob, claw: S.claw, addedTop: S.addedTop, placed: S.placed, carry: S.carry, lower: S.lower, grip: S.grip,
      // the claw's fingers never touch a tile other than the one it carries
      clawClear: posed.polys.every((poly, i) => i === M.k || i >= M.N || !poly.some(q => {
        const b = L.stage.clawBox(S.claw.x, S.claw.y);
        return q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
      })),
      contactAdded: r(L.stage.contactU('with', M.k - 1), 4),
      statusShown: done && seg(u, ...W.status) >= 1,
      actionCapped: p.actionProgress < 1 && u > capU,
      layout: {H: r(L.H), size: r(L.size), k: r(L.k, 3), side: L.side, fallback: L.fallback, mode: L.cfg.mode, why: L.why, pick: L.dbgPick},
    };
    S.tops.forEach((q, i) => { semantic[i < M.N ? `tile${i}` : `loss${i - M.N}`] = q; });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-04-story',
    title: 'Intervening event — a later event is carried into the running sequence',
    titleEs: 'Evento interviniente — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Evento interviniente',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side-view model stage under a gantry: a pendulum starts the initial sequence of event tiles while a crane carries a later event’s tile along the beam and lowers it into the empty slot between two supplied events; the sequence continues through it per the supplied model (it reaches the vase, or it is held unresolved at a disputed link). As supplied; no legal test, causation, liability or outcome is stated.',
    tags: ['causation', 'intervening event', 'later event', 'sequence', 'dominoes', 'crane', 'pendulum', 'loss', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/evento-interviniente.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/animations/causation/kits/prueba-contrafactual.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: IE_STRINGS,
  scene,
});
