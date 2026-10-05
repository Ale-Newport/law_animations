/**
 * Motif kit for "Contribución de la persona afectada" (LAW-0713..0716): two PARALLEL LANES of identical size, colour
 * and weight run across a ground slab toward ONE fictional event (a round pad with a generic object on it — the loss,
 * described only as supplied). Lane A carries the supplied conduct of A (a trolley with a ● flag), lane B the supplied
 * conduct of B, the affected person (an identical trolley with a ◆ flag). Each lane ends at an identical barrier; the
 * two CONNECTORS from the lane ends to the event are drawn only as a supplied description (a plain relation unless the
 * author supplies "causal"). The supplied steps of each conduct stand beside their lane as generic objects.
 *
 * Nothing is apportioned, weighed, counted against anyone or decided: no fault, no shares, no percentages, no
 * contributory-negligence doctrine. Both lanes, trolleys, barriers and connectors are drawn with the same stroke,
 * colour, size and timing; the convergence is only what the author supplies, in words.
 *
 * Original vector art (oblique top view): the SLAB (a flat ground plate with a visible front edge), two LANE strips,
 * two BARRIERS (kits/causal-chain.js barrier art in neutral metal), two TROLLEYS, the EVENT pad with a tipped vase,
 * generic step objects (crate, jar, drum, book stack, vase, pot — copied from kits/alcance-dano.js).
 *
 * Copied, not imported, from kits/alcance-dano.js (chips, flowRows, the record sheet, unwidow, gp, localizeScene,
 * sideMark, itemArt, linkIcon); read-only imports of the low-level text helpers and connector art
 * (kits/prueba-contrafactual.js, kits/dano-material.js, kits/causal-chain.js), as the earlier causation kits do.
 * The kit owns geometry, art and text measurement; each entry owns its timeline, layout and semantics.
 * @module animations/causation/kits/contribucion-afectada
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, oneOf, list, obj} from '../../../schemas/fields.js';
import {fitG, chipG, balancedG} from './prueba-contrafactual.js';
import {barrierArt as barrierArt0} from './causal-chain.js';
import {linkArt as linkArt0, tracerArt, boxExit, boxesMeet} from './dano-material.js';

export {fitG, chipG, balancedG, tracerArt, boxExit, boxesMeet};
export {clamp, ease, lerp, r, seg};

// nothing in this motif uses the theme's red accent: shared connector / barrier art goes through a neutral context
const neutral = (ctx, accent) => { const c = Object.create(ctx); c.theme = {...ctx.theme, accent, accentSoft: ctx.theme.paperShade}; return c; };
/** Connector (kits/dano-material.js linkArt) in neutral ink for supplied links. */
export const linkArt = (ctx, o) => linkArt0(neutral(ctx, ctx.theme.ink), o);
/** Striped barrier (kits/causal-chain.js) in neutral metal; local origin = bottom centre. */
export const barrierArt = (ctx, o) => barrierArt0(neutral(ctx, ctx.theme.metalDark), o);

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const caFields = {
  origin: obj('The fictional event both lanes run toward (a generic object event; nobody is drawn or injured)', {
    name: str('Name of the event, e.g. "Event X (fictional)"', 48),
  }, ['name']),
  events: list('The supplied steps of each conduct, in the supplied order (fictional, neutral, descriptive). Each stands beside the lane it is SUPPLIED for: lane A (conduct of A) or lane B (conduct of B, the affected person). Nothing is weighed or decided.', obj('Step', {
    label: str('Step text (fictional, descriptive)', 64),
    time: str('Optional fictional relative label, e.g. "Day 2" (shown as supplied; never a time limit)', 20),
    lane: oneOf('Supplied lane: a (conduct of A) or b (conduct of B)', ['a', 'b']),
  }, ['label', 'lane']), 2, 6),
  causalLinks: list('Per-lane connector data. The connector of a lane joins its end to the event; a lane not listed keeps a plain relation as supplied.', obj('Connector', {
    lane: oneOf('Lane whose connector this describes', ['a', 'b']),
    kind: oneOf('relation (default) or causal; a causal arrow is only drawn when supplied here', ['relation', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); never resolved', ['proposed', 'disputed']),
    label: str('Optional caption for this connector', 48),
  }, ['lane']), 0, 2),
  alternatives: list('Other accounts put forward by someone; drawn with a barrier icon, never decided', obj('Alternative', {
    label: str('Account put forward', 64),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label']), 0, 2),
  losses: list('The loss at the event as supplied: the first entry describes it (a placeholder, no amount, no share); an optional second entry is a noted detail.', obj('Loss', {
    label: str('Description of the loss as supplied (no amount, no share)', 72),
  }, ['label']), 1, 2),
};

export const CA_STRINGS = {
  en: {
    record: 'Record of the two conducts (as supplied)',
    laneA: 'Conduct of A (as supplied)',
    laneB: 'Conduct of B, the affected person (as supplied)',
    alsoNoted: 'Also',
    other: 'Put forward', alleged: 'alleged', proposed: 'proposed', disputed: 'disputed',
    link: 'Connector', kindCausal: 'causal (as supplied)', event: 'event',
    lanes: 'Two parallel lanes · convergence only as supplied',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    record: 'Registro de las dos conductas (según lo aportado)',
    laneA: 'Conducta de A (según lo aportado)',
    laneB: 'Conducta de B, la persona afectada (según lo aportado)',
    alsoNoted: 'También',
    other: 'Planteado', alleged: 'alegado', proposed: 'propuesto', disputed: 'discutido',
    link: 'Conector', kindCausal: 'causal (según lo aportado)', event: 'evento',
    lanes: 'Dos carriles paralelos · convergencia solo según lo aportado',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** Keep short parentheticals ("(as supplied)") on one line: their inner spaces become U+00A0 (glue-aware fitting). */
export const gp = text => String(text ?? '').replace(/\(([^()]{1,34})\)/g, (m, q) => `(${q.replace(/ /g, '\u00a0')})`);

/** Keep a number or a lane letter with its word ("Step 3", "lane A"), "·" with the word before it. */
export const glueN = text => gp(String(text ?? '').replace(/([\p{L}:]+) (\d+|[AB])(?![\p{L}])/gu, '$1 $2').replace(/ · /g, ' · '));

/**
 * No one-word lines: while a wrapped fit (fitOf(text) → {lines}) leaves a line holding a single word, that word is glued
 * (U+00A0) to its neighbour — the previous line's last word, or the next line's first — and the text is fitted again.
 * Returns the text to draw.
 */
export function unwidow(text, fitOf) {
  let t = String(text ?? '');
  for (let i = 0; i < 8; i++) {
    const f = fitOf(t);
    const lines = f.lines.map(l => l.replace(/…$/, '').trim());
    if (lines.length < 2) return t;
    const bad = lines.findIndex(l => !/[ \u00a0]/.test(l));
    if (bad < 0) return t;
    const parts = t.split(/([ \u00a0]+)/);
    const nWords = l => l.split(/[ \u00a0]+/).filter(Boolean).length;
    const k = lines.slice(0, bad).reduce((q, l) => q + nWords(l), 0);
    const tryAt = idx => { if (idx < 1 || idx >= parts.length) return null; const q = parts.slice(); q[idx] = ' '; return q.join(''); };
    const cands = (bad > 0 ? [2 * k - 1, 2 * k + 2 * nWords(lines[bad]) - 1] : [2 * k + 1]).map(tryAt).filter(Boolean);
    if (!cands.length) return t;
    t = cands.find(c => !fitOf(c).broken) ?? cands[0];
  }
  return t;
}

/** Short supplied time label kept whole. */
export const nb = s => (String(s).length <= 16 ? String(s).replace(/ /g, '\u00a0') : String(s));

/** Record / band text of a step. */
export function entryText(e) {
  return `${e.time ? `${nb(e.time)} · ` : ''}${e.label}`;
}

/** Normalize the motif data. */
export function resolveCA(p) {
  const n = p.events.length;
  const links = ['a', 'b'].map(lane => ({lane, kind: 'relation', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) { const q = links.find(x => x.lane === l.lane); if (q) Object.assign(q, {kind: l.kind || 'relation', status: l.status || 'proposed', label: l.label || ''}); }
  const alternatives = (p.alternatives || []).map(a => ({...a, status: a.status || 'alleged'}));
  const entries = p.events.map((e, i) => ({...e, i, lane: e.lane === 'b' ? 'b' : 'a'}));
  const nA = entries.filter(e => e.lane === 'a').length;
  return {n, entries, links, alternatives, losses: p.losses, nA, nB: n - nA};
}

/** Connector notes for connectors that carry supplied data ("Connector A → event: …"). */
export function linkNotes(ctx, M) {
  const t = ctx.t;
  const out = [];
  M.links.forEach(l => {
    const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputed : null, l.label || null].filter(Boolean);
    if (!bits.length) return;
    out.push({key: `lk${l.lane}`, icon: 'link', disputed: l.status === 'disputed', text: `${t.link} ${l.lane.toUpperCase()} → ${t.event}: ${bits.join(' · ')}`});
  });
  return out;
}

/** Band text of an alternative. */
export const altText = (ctx, a) => `${ctx.t.other}: ${a.label} (${a.status === 'alleged' ? ctx.t.alleged : ctx.t.proposed})`;

/** "<event> · <loss as supplied>". */
export function lossText(ctx, p) {
  return `${p.origin.name} · ${p.losses[0].label}`;
}

/* ------------------------------------------------------------------------ */
/* Field geometry                                                           */
/* ------------------------------------------------------------------------ */

/**
 * Proportions (× PH, the scale unit): side margin, lane length, connector run, event pad x-radius EV (ry = K · rx),
 * lane offset D from the middle line, lane half-thickness LT, slab margin beyond the lanes, slab thickness, step-object
 * height, trolley parts (wheel radius, body height, mast, flag head).
 */
export const FIELD = {side: 0.03, laneL: 1.5, conn: 0.34, ev: 0.2, K: 0.62, D: 0.56, LT: 0.08, marg: 0.12, margB: 0.38, plate: 0.07, item: 0.28, wheel: 0.045, body: 0.14, mast: 0.25, head: 0.17, cartW: 0.42, brace: 0.16, lead: 0.24};
/** The trolley's push-bar grip, local to its wheel contact (× PH). */
export const CART_HANDLE = {x: -(0.42 / 2 + 0.07), y: -0.36};
/** Actor height (× PH): the stylized figure walking behind a trolley. */
export const ACTOR_H = 0.72;

/**
 * An actor (stylized person rig, seeded look by index; equal size for both lanes). `frame(cx, laneY, PH)` places the
 * figure behind the trolley at cx with both hands on its push-bar grip and returns {nodes, reached, hand}.
 */
export function actorArt(ctx, {name, idx}) {
  const rig = personRig(ctx, {name, look: actorLook(ctx, null, idx)});
  return {
    node: rig.node,
    frame(cx, laneY, PH, step = 0) {
      const k = (ACTOR_H * PH) / 410;
      const hand = {x: cx + CART_HANDLE.x * PH, y: laneY + CART_HANDLE.y * PH};
      const x = cx - (FIELD.cartW * 0.5 + 0.19) * PH;
      const f = rig.frame({x, y: laneY, scale: k, lean: 6 + 2 * Math.sin(step), near: hand, far: {x: hand.x - 0.01 * PH, y: hand.y + 0.004 * PH}});
      return {nodes: f.nodes, reached: f.reached, hand, x};
    },
  };
}

/** Height of the trolley above its lane line (× PH): wheels, body, mast and flag head. */
export const CART_TOP = 2 * FIELD.wheel + FIELD.body + FIELD.mast + FIELD.head;

/** Field width / height (× PH). */
/** (the right-hand margin holds the brace beside the event pad) */
export const fieldW = () => FIELD.side + FIELD.lead + FIELD.laneL + FIELD.conn + 2 * FIELD.ev + FIELD.brace;
/** Height of the field's top above the middle line (× PH): lane A's trolley flag. */
export const fieldTop = () => FIELD.D + Math.max(CART_TOP, ACTOR_H) + 0.02;
/** Depth below the middle line to the floor (× PH). */
export const fieldBelow = () => FIELD.D + FIELD.LT + FIELD.margB + FIELD.plate;
export const fieldH = () => fieldTop() + fieldBelow();

/**
 * Field geometry for scale PH, left edge at `left`, slab standing on floorY.
 * laneY(l) = lane l's centre line; at(l, x) = the point on lane l at x; cartX(f) = a trolley's x at travel fraction f
 * (0 = parked at the start, 1 = at the barrier); stand(l) = the y where lane l's step objects stand (behind the lane);
 * pad = the event pad's centre; conn(l) = lane l's connector {from, to}; xs / xe = lane start / end; xb = barrier x.
 */
export function fieldGeom(left, floorY, PH) {
  const F = FIELD;
  const cy = floorY - fieldBelow() * PH;
  // (each lane's steps stand in FRONT of it — just below its strip — so a step can only belong to the lane above it)
  // (a lead-in before the lanes: the actors stand there behind their parked trolleys)
  const xs = left + (F.side + F.lead) * PH, xe = xs + F.laneL * PH;
  const px = xe + (F.conn + F.ev) * PH, py = cy;
  const yA = cy - F.D * PH, yB = cy + F.D * PH;
  const laneY = l => (l === 'b' ? yB : yA);
  const padR = F.ev * PH;
  const conn = l => {
    const s = l === 'b' ? 1 : -1;
    return {from: {x: xe, y: laneY(l)}, to: {x: px - padR * 0.82, y: py + s * padR * F.K * 0.5}};
  };
  return {
    PH, cy, K: F.K, xs, xe, xb: xe - 0.07 * PH, px, py, padR, yA, yB, laneY,
    LT: F.LT * PH, itemS: F.item * PH, plateT: F.plate * PH, headS: F.head * PH, cartW: F.cartW * PH,
    at: (l, x) => ({x, y: laneY(l)}),
    cartX: f => lerp(xs + 0.16 * PH, xe - 0.4 * PH, f),
    // the actor walks behind the trolley, hands on its push bar
    actorX: cx => cx - (F.cartW * 0.5 + 0.19) * PH,
    stand: l => laneY(l) + (F.LT + 0.03 + F.item) * PH,
    conn, floorY,
    x0: left, x1: left + fieldW() * PH, top: cy - fieldTop() * PH,
    slabTop: cy - (F.D + F.LT + F.marg) * PH, slabBot: cy + (F.D + F.LT + F.margB) * PH,
    bracketY: cy, braceX: px + padR + 0.07 * PH,
    plateBox: {x: left + F.side * PH, y: cy - (F.D + F.LT + F.marg) * PH, w: (fieldW() - 2 * F.side) * PH, h: (2 * (F.D + F.LT) + F.marg + F.margB) * PH + F.plate * PH},
  };
}

/**
 * Step places: each lane's steps stand in front of it (below its strip), spread evenly along [xs + 0.3, xe − 0.36] (× PH) in the supplied
 * order; `skip` = indices left out (posed by the entry). Objects shrink only when a lane holds many steps.
 */
export function itemPlaces(G, M, skip = [], from = 0.3) {
  const out = [];
  for (const l of ['a', 'b']) {
    const es = M.entries.filter(e => e.lane === l && !skip.includes(e.i));
    const x0 = G.xs + from * G.PH, x1 = G.xe - 0.36 * G.PH;
    const n = es.length;
    const step = n > 1 ? (x1 - x0) / (n - 1) : 0;
    const k = Math.min(1, n > 1 ? step / (G.itemS * 0.95) : 1);
    es.forEach((e, j) => out.push({i: e.i, lane: l, x: n > 1 ? x0 + j * step : (x0 + x1) / 2, y: G.stand(l), s: G.itemS * Math.max(0.62, k)}));
  }
  return out.sort((a, b) => a.i - b.i);
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

const SLAB = '#e7dfcf';
const SLAB_SIDE = '#c9bea8';
const LANE = '#d3cbbb';
const PAD = '#b9b2a6';

/** Solid ● (lane A) / ◆ (lane B) glyph of identical weight. Centre (cx, cy), size s. */
export function sideMark(ctx, {cx, cy, s, side}) {
  const th = ctx.theme;
  if (side === 'after' || side === 'b') return h('path', {d: `M${r(cx)} ${r(cy - s / 2)}L${r(cx + s / 2)} ${r(cy)}L${r(cx)} ${r(cy + s / 2)}L${r(cx - s / 2)} ${r(cy)}Z`, fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
  return h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.42), fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
}

/**
 * A generic fictional object, local origin = bottom centre, height s (width ~0.85 s). Kinds by index: crate, jar, drum,
 * book stack, vase, pot. Neutral fills; nothing broken, burning or red.
 */
export function itemArt(ctx, {i, s}) {
  const th = ctx.theme;
  const w = s * 0.82;
  const sw = Math.max(1.6, s * 0.03);
  const k = ((i % 6) + 6) % 6;
  switch (k) {
    case 0: return g(null, // crate
      h('path', {d: roundRectPath(-w / 2, -s * 0.86, w, s * 0.86, s * 0.05), fill: th.wood, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.86)}L${r(-w * 0.3)} ${r(-s)}H${r(w * 0.7)}L${r(w / 2)} ${r(-s * 0.86)}Z`, fill: th.woodTop || shade(th.wood, 0.15), stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.43)}H${r(w / 2)}M${r(-w * 0.15)} ${r(-s * 0.86)}V0`, stroke: th.woodDark, 'stroke-width': sw}));
    case 1: return g(null, // jar
      h('path', {d: `M${r(-w * 0.32)} ${r(-s * 0.78)}Q${r(-w * 0.55)} ${r(-s * 0.6)} ${r(-w * 0.46)} ${r(-s * 0.08)}Q${r(-w * 0.44)} 0 ${r(-w * 0.3)} 0H${r(w * 0.3)}Q${r(w * 0.44)} 0 ${r(w * 0.46)} ${r(-s * 0.08)}Q${r(w * 0.55)} ${r(-s * 0.6)} ${r(w * 0.32)} ${r(-s * 0.78)}Z`, fill: th.accent3Soft, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-w * 0.34, -s, w * 0.68, s * 0.22, s * 0.04), fill: th.metal, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-w * 0.3, -s * 0.52, w * 0.6, s * 0.2, 2), fill: th.paper, stroke: th.inkSoft, 'stroke-width': Math.max(1.2, sw * 0.7)}));
    case 2: return g(null, // drum
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.9)}V${r(-s * 0.08)}A${r(w / 2)} ${r(s * 0.08)} 0 0 0 ${r(w / 2)} ${r(-s * 0.08)}V${r(-s * 0.9)}Z`, fill: th.accent4Soft, stroke: th.ink, 'stroke-width': sw}),
      h('ellipse', {cx: 0, cy: r(-s * 0.9), rx: r(w / 2), ry: r(s * 0.09), fill: shade(th.accent4Soft, 0.2), stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.36)}A${r(w / 2)} ${r(s * 0.08)} 0 0 0 ${r(w / 2)} ${r(-s * 0.36)}M${r(-w / 2)} ${r(-s * 0.62)}A${r(w / 2)} ${r(s * 0.08)} 0 0 0 ${r(w / 2)} ${r(-s * 0.62)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': sw}));
    case 3: return g(null, // book stack
      [0, 1, 2].map(j => h('path', {d: roundRectPath(-w / 2 + (j === 1 ? w * 0.06 : 0), -s * (0.32 * (j + 1)), w * (j === 1 ? 0.88 : 1), s * 0.3, s * 0.03), fill: [th.accent2Soft, th.accent3Soft, th.paperShade][j], stroke: th.ink, 'stroke-width': sw})),
      h('path', {d: `M${r(w * 0.34)} ${r(-s * 0.3)}V${r(-s * 0.04)}M${r(w * 0.3)} ${r(-s * 0.94)}V${r(-s * 0.68)}`, stroke: th.inkSoft, 'stroke-width': sw}));
    case 4: return g(null, // vase
      h('path', {d: `M${r(-w * 0.18)} ${r(-s)}H${r(w * 0.18)}Q${r(w * 0.12)} ${r(-s * 0.8)} ${r(w * 0.42)} ${r(-s * 0.5)}Q${r(w * 0.56)} ${r(-s * 0.2)} ${r(w * 0.24)} 0H${r(-w * 0.24)}Q${r(-w * 0.56)} ${r(-s * 0.2)} ${r(-w * 0.42)} ${r(-s * 0.5)}Q${r(-w * 0.12)} ${r(-s * 0.8)} ${r(-w * 0.18)} ${r(-s)}Z`, fill: th.accent2Soft, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: `M${r(-w * 0.36)} ${r(-s * 0.42)}Q0 ${r(-s * 0.34)} ${r(w * 0.36)} ${r(-s * 0.42)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': sw}));
    default: return g(null, // pot with a plant
      h('path', {d: `M${r(-w * 0.1)} ${r(-s * 0.5)}Q${r(-w * 0.45)} ${r(-s * 0.85)} ${r(-w * 0.2)} ${r(-s)}Q${r(-w * 0.05)} ${r(-s * 0.8)} 0 ${r(-s * 0.5)}Q${r(w * 0.1)} ${r(-s * 0.9)} ${r(w * 0.32)} ${r(-s * 0.95)}Q${r(w * 0.36)} ${r(-s * 0.7)} ${r(w * 0.1)} ${r(-s * 0.5)}Z`, fill: th.accent4Soft, stroke: th.accent4, 'stroke-width': sw}),
      h('path', {d: `M${r(-w * 0.42)} ${r(-s * 0.52)}H${r(w * 0.42)}L${r(w * 0.3)} 0H${r(-w * 0.3)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-w * 0.46)} ${r(-s * 0.6)}H${r(w * 0.46)}V${r(-s * 0.5)}H${r(-w * 0.46)}Z`, fill: th.woodDark, stroke: th.ink, 'stroke-width': sw}));
  }
}

/**
 * The event: a round pad with a vase lying on its side (the loss, shown only as an object — nothing broken), local
 * origin = the pad's centre; pad x-radius R.
 */
export function eventArt(ctx, {R}) {
  const th = ctx.theme;
  const sw = Math.max(2, R * 0.05);
  const s = R * 1.05;
  return g(null,
    h('ellipse', {cx: 0, cy: 0, rx: r(R), ry: r(R * FIELD.K), fill: PAD, stroke: th.ink, 'stroke-width': sw}),
    h('ellipse', {cx: 0, cy: r(-R * 0.08), rx: r(R * 0.82), ry: r(R * FIELD.K * 0.76), fill: shade(PAD, 0.12), stroke: 'none'}),
    g({transform: T(R * 0.38, R * 0.12, -90)}, itemArt(ctx, {i: 4, s})),
  );
}

/** Elliptical pad outline path centred at (cx, cy), x-radius R. */
export const padD = (R, cx = 0, cy = 0) => `M${r(cx - R)} ${r(cy)}A${r(R)} ${r(R * FIELD.K)} 0 1 0 ${r(cx + R)} ${r(cy)}A${r(R)} ${r(R * FIELD.K)} 0 1 0 ${r(cx - R)} ${r(cy)}Z`;

/**
 * A trolley (identical for both lanes; only the flag glyph differs: ● lane A, ◆ lane B), local origin = where its
 * wheels touch the lane line; scale PH. Named parts: `${name}-flag` (the mast with its head).
 */
export function cartArt(ctx, {name, PH, side}) {
  const th = ctx.theme;
  const F = FIELD;
  const w = F.cartW * PH, bh = F.body * PH, wr = F.wheel * PH;
  const sw = Math.max(2, PH * 0.012);
  const bodyTop = -2 * wr - bh;
  const mastTop = bodyTop - F.mast * PH;
  const hs = F.head * PH;
  return g({name},
    h('ellipse', {cx: 0, cy: r(wr * 0.3), rx: r(w * 0.55), ry: r(wr * 0.8), fill: th.ink, opacity: 0.12}),
    h('path', {d: roundRectPath(-w / 2, bodyTop, w, bh, bh * 0.25), fill: th.card, stroke: th.ink, 'stroke-width': sw}),
    h('path', {d: roundRectPath(-w * 0.38, bodyTop + bh * 0.22, w * 0.5, bh * 0.56, 3), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': Math.max(1.2, sw * 0.6)}),
    h('path', {d: roundRectPath(w * 0.1, bodyTop - bh * 0.9, w * 0.32, bh * 0.9, 3), fill: th.wood, stroke: th.ink, 'stroke-width': sw}),
    [-0.3, 0.3].map(f => h('circle', {cx: r(f * w), cy: r(-wr), r: r(wr), fill: th.metalDark, stroke: th.ink, 'stroke-width': Math.max(1.5, sw * 0.8)})),
    // the push bar (the actor's hands hold its grip)
    h('path', {d: `M${r(-w / 2)} ${r(bodyTop + bh * 0.3)}L${r(CART_HANDLE.x * PH)} ${r(CART_HANDLE.y * PH)}`, stroke: th.ink, 'stroke-width': r(Math.max(3, PH * 0.016)), 'stroke-linecap': 'round'}),
    g({name: name ? `${name}-flag` : undefined},
      h('path', {d: `M${r(-w * 0.12)} ${r(bodyTop)}V${r(mastTop)}`, stroke: th.ink, 'stroke-width': r(Math.max(3, PH * 0.018)), 'stroke-linecap': 'round'}),
      sideMark(ctx, {cx: -w * 0.12, cy: mastTop - hs * 0.5, s: hs, side})),
  );
}

/** The slab with both lane strips (identical), from G. */
export function slabArt(ctx, {name, G}) {
  const th = ctx.theme;
  const b = G.plateBox;
  const top = b.h - G.plateT;
  const lane = l => {
    const y = G.laneY(l);
    return g(null,
      h('path', {d: roundRectPath(G.xs, y - G.LT, G.xe - G.xs, 2 * G.LT, G.LT * 0.5), fill: LANE, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(G.xs + G.LT)} ${r(y - G.LT * 0.45)}H${r(G.xe - G.LT)}M${r(G.xs + G.LT)} ${r(y + G.LT * 0.45)}H${r(G.xe - G.LT)}`, stroke: shade(LANE, -0.12), 'stroke-width': 1.5}));
  };
  return g({name},
    h('path', {d: roundRectPath(b.x, b.y + G.plateT, b.w, top, 10), fill: SLAB_SIDE, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(b.x, b.y, b.w, top, 10), fill: SLAB, stroke: th.ink, 'stroke-width': 2.5}),
    lane('a'), lane('b'),
  );
}

/** Floor slab from x0 to x1 at floorY. */
export function floorArt(ctx, {name, x0, x1, floorY, t = 16}) {
  const th = ctx.theme;
  return g({name}, h('rect', {x: r(x0), y: r(floorY), width: r(x1 - x0), height: t, rx: 4, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}));
}

/** A lane's end barrier (identical for both), local origin = its foot on the lane line. */
export function laneBarrier(ctx, {name, G}) {
  return g({name}, barrierArt(ctx, {name: `${name || 'lb'}-${Math.round(G.PH)}`, w: G.LT * 2.9, h: G.LT * 2.7}));
}

/** The connector of lane l (from its end to the event pad), drawn with the supplied kind. */
export function laneConnector(ctx, {name, G, l, kind = 'relation', disputed = false}) {
  const c = G.conn(l);
  return linkArt(ctx, {name, from: c.from, to: c.to, kind: kind === 'causal' ? 'causal' : 'relation', bend: l === 'b' ? -0.12 : 0.12, disputed});
}

/* ------------------------------------------------------------------------ */
/* Lane pieces and the convergence piece (mechanism)                        */
/* ------------------------------------------------------------------------ */

/** A lane piece: one lane on its own slab strip with its trolley at the barrier and its steps (static). */
const PIECE = {L: 0.8};
/** Width of a lane piece relative to its height. */
export const MINI_W = (PIECE.L + 0.14) / (CART_TOP + FIELD.LT + 0.16 + FIELD.plate);

/** Geometry of a lane piece of height H (local origin = bottom centre). */
export function miniGeom(H) {
  const PH = H / (CART_TOP + FIELD.LT + 0.16 + FIELD.plate);
  const w = MINI_W * H;
  const laneY = -(FIELD.plate + 0.1 + FIELD.LT) * PH;
  const xs = -w / 2 + 0.07 * PH, xe = xs + PIECE.L * PH;
  return {PH, w, laneY, xs, xe, LT: FIELD.LT * PH, itemS: FIELD.item * PH * 0.9, top: -H};
}

/** A lane piece (static), local origin = bottom centre, height H. side 'before' = lane A (●), 'after' = lane B (◆). */
export function miniField(ctx, {name, H, M, side}) {
  const th = ctx.theme;
  const q = miniGeom(H);
  const l = side === 'after' ? 'b' : 'a';
  const es = M.entries.filter(e => e.lane === l);
  const x0 = q.xs + 0.1 * q.PH, x1 = q.xe - 0.42 * q.PH;
  const n = es.length;
  const stp = n > 1 ? (x1 - x0) / (n - 1) : 0;
  const k = Math.min(1, n > 1 ? stp / (q.itemS * 0.95) : 1);
  return g({name},
    h('path', {d: roundRectPath(-q.w / 2, q.laneY - q.LT - 0.1 * q.PH + FIELD.plate * q.PH, q.w, 2 * q.LT + 0.2 * q.PH, 8), fill: SLAB_SIDE, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(-q.w / 2, q.laneY - q.LT - 0.1 * q.PH, q.w, 2 * q.LT + 0.2 * q.PH, 8), fill: SLAB, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(q.xs, q.laneY - q.LT, q.xe - q.xs, 2 * q.LT, q.LT * 0.5), fill: LANE, stroke: th.ink, 'stroke-width': 2}),
    es.map((e, j) => g({transform: T(n > 1 ? x0 + j * stp : (x0 + x1) / 2, q.laneY - q.LT - 0.015 * q.PH)}, itemArt(ctx, {i: e.i, s: q.itemS * Math.max(0.62, k)}))),
    g({transform: T(q.xe - 0.08 * q.PH, q.laneY)}, barrierArt(ctx, {name: `${name || 'mf'}-bar`, w: q.LT * 2.9, h: q.LT * 2.7})),
    g({transform: T(q.xe - 0.3 * q.PH, q.laneY)}, cartArt(ctx, {PH: q.PH, side: l})),
  );
}

/** Where a link to a lane piece lands: its lane end, just past the barrier (local, bottom-centre origin). */
export function miniSpot(H) {
  const q = miniGeom(H);
  return {x: q.xe, y: q.laneY};
}

/**
 * The convergence piece: on a card 2R × 2R centred at (0, 0), the two lane ends (each with its barrier) and their two
 * connectors meeting at the event pad with the vase — the convergence exactly as supplied, a description only.
 */
export function boundaryPiece(ctx, {R, M}) {
  const th = ctx.theme;
  const ex = -R * 0.38, padX = R * 0.42, padR = R * 0.3;
  const yA = -R * 0.45, yB = R * 0.45, lt = R * 0.1;
  const lane = y => h('path', {d: roundRectPath(-R * 0.86, y - lt, ex + R * 0.86, 2 * lt, lt * 0.5), fill: LANE, stroke: th.ink, 'stroke-width': 2});
  const conn = (y, s) => h('path', {d: `M${r(ex)} ${r(y)}C${r(ex + R * 0.32)} ${r(y)} ${r(padX - padR * 1.4)} ${r(s * padR * FIELD.K * 0.5)} ${r(padX - padR * 0.82)} ${r(s * padR * FIELD.K * 0.5)}`, fill: 'none', stroke: th.ink, 'stroke-width': Math.max(3, R * 0.025), 'stroke-linecap': 'round'});
  void M;
  return g(null,
    h('path', {d: roundRectPath(-R, -R, 2 * R, 2 * R, R * 0.12), fill: th.card, stroke: th.accent2, 'stroke-width': 4}),
    h('path', {d: roundRectPath(-R * 0.9, -R * 0.68, R * 1.8, R * 1.36, R * 0.08), fill: SLAB, stroke: th.ink, 'stroke-width': 2}),
    lane(yA), lane(yB),
    conn(yA, -1), conn(yB, 1),
    g({transform: T(ex - R * 0.06, yA)}, barrierArt(ctx, {name: `cvA-${Math.round(R)}`, w: lt * 2.9, h: lt * 2.7})),
    g({transform: T(ex - R * 0.06, yB)}, barrierArt(ctx, {name: `cvB-${Math.round(R)}`, w: lt * 2.9, h: lt * 2.7})),
    sideMark(ctx, {cx: -R * 0.7, cy: yA - lt - R * 0.1, s: R * 0.16, side: 'a'}),
    sideMark(ctx, {cx: -R * 0.7, cy: yB - lt - R * 0.1, s: R * 0.16, side: 'b'}),
    g({transform: T(padX, 0)}, eventArt(ctx, {R: padR})),
  );
}

/* ------------------------------------------------------------------------ */
/* Icons                                                                    */
/* ------------------------------------------------------------------------ */

/** Two linked rings (a connector note); dashed ring + "?" when disputed — neutral colours. */
export function linkIcon(ctx, {cx, cy, s, disputed}) {
  const th = ctx.theme;
  const R = s * 0.42;
  const col = disputed ? th.inkSoft : th.accent4;
  return g(null,
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: th.card, stroke: col, 'stroke-width': 3, 'stroke-dasharray': disputed ? '5 4' : null}),
    disputed
      ? h('path', {d: `M${r(cx - R * 0.3)} ${r(cy - R * 0.3)}Q${r(cx - R * 0.3)} ${r(cy - R * 0.62)} ${r(cx)} ${r(cy - R * 0.62)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.62)} ${r(cx + R * 0.32)} ${r(cy - R * 0.3)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.05)} ${r(cx)} ${r(cy + R * 0.05)}V${r(cy + R * 0.22)}M${r(cx)} ${r(cy + R * 0.45)}V${r(cy + R * 0.5)}`, fill: 'none', stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round'})
      : g(null,
        h('ellipse', {cx: r(cx - R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4}),
        h('ellipse', {cx: r(cx + R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4})),
  );
}

/** Small two-lanes icon with the ● / ◆ glyph of the given lane (or both). */
function lanesIcon(ctx, x, cy, s, side) {
  const th = ctx.theme;
  const w = s, lt = s * 0.1;
  const lane = (y, on) => h('path', {d: roundRectPath(x, y - lt, w * 0.78, 2 * lt, 2), fill: LANE, stroke: th.ink, 'stroke-width': on ? 2 : 1.2, opacity: on ? 1 : 0.5});
  return g(null,
    lane(cy - s * 0.2, side !== 'b'), lane(cy + s * 0.24, side !== 'a'),
    h('ellipse', {cx: r(x + w * 0.9), cy: r(cy + s * 0.02), rx: r(s * 0.1), ry: r(s * 0.07), fill: PAD, stroke: th.ink, 'stroke-width': 1.2}),
    side === 'both'
      ? g(null, sideMark(ctx, {cx: x + s * 0.2, cy: cy - s * 0.42, s: s * 0.24, side: 'a'}), sideMark(ctx, {cx: x + s * 0.55, cy: cy - s * 0.42, s: s * 0.24, side: 'b'}))
      : sideMark(ctx, {cx: x + s * 0.4, cy: cy - s * 0.42, s: s * 0.28, side}),
  );
}

/** Icon for a chip / record row. Kinds: laneA, laneB, lanes, item, loss, alt, link, record, event. */
export function adIcon(ctx, it, x, cy, s) {
  const th = ctx.theme;
  switch (it.icon) {
    case 'laneA': return lanesIcon(ctx, x, cy, s, 'a');
    case 'laneB': return lanesIcon(ctx, x, cy, s, 'b');
    case 'lanes': return lanesIcon(ctx, x, cy, s, 'both');
    case 'item': return g(null,
      g({transform: T(x + s * 0.42, cy + s * 0.44)}, itemArt(ctx, {i: it.item ?? 0, s: s * 0.78})),
      it.lane ? sideMark(ctx, {cx: x + s * 0.86, cy: cy - s * 0.34, s: s * 0.28, side: it.lane}) : null);
    case 'alt': return g({transform: T(x + s / 2, cy + s * 0.45)}, barrierArt(ctx, {name: `caalt-${it.key}-${Math.round(s)}`, w: s * 0.95, h: s * 0.9}));
    case 'link': return linkIcon(ctx, {cx: x + s / 2, cy, s, disputed: it.disputed});
    case 'record': return g(null,
      h('path', {d: roundRectPath(x + s * 0.18, cy - s * 0.42, s * 0.64, s * 0.84, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy - s * 0.18)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy + s * 0.18)}H${r(x + s * 0.6)}`, stroke: th.paperLine, 'stroke-width': 3}));
    case 'event': case 'loss': return g({transform: T(x + s * 0.5, cy + s * 0.1)}, eventArt(ctx, {R: s * 0.46}));
    default: return null;
  }
}

/* Chips, flowRows and the record sheet (copied from kits/alcance-dano.js)   */
/* ------------------------------------------------------------------------ */

/**
 * Measure an icon chip (icon at the left, fitted text in a rounded box).
 * @returns {{w:number,h:number,bad:boolean, build:(x:number,y:number,name:string,style?:any)=>{node:any, box:any}}}
 */
export function iconChip(ctx, it, o) {
  const th = ctx.theme;
  const size = o.size;
  const iconS = it.icon ? size * 1.5 : 0;
  const iw = it.icon ? iconS + 10 : 0;
  const mw = Math.max(size * 4, o.maxW - iw);
  const maxLines = it.maxLines ?? o.maxLines ?? 3;
  // (each text is balanced and fitted once: the unwidow pass and the final measure share the results — same output)
  const seen = new Map();
  const measureT = t0 => {
    let q = seen.get(t0);
    if (!q) { const w0 = balancedG(ctx, t0, {maxWidth: mw, size, maxLines}); q = {bw: w0, probe: chipG(ctx, t0, {x: 0, y: 0, maxWidth: w0, size, maxLines})}; seen.set(t0, q); }
    return q;
  };
  const text = unwidow(glueN(it.text), t0 => measureT(t0).probe.fit);
  const {bw, probe} = measureT(text);
  const hh = Math.max(probe.box.h, iconS);
  const w = iw + probe.box.w;
  return {
    w, h: hh, bad: probe.fit.truncated || probe.fit.broken, lines: probe.fit.lines.length,
    build(x, y, name, style = {}) {
      const c = chipG(ctx, text, {x: x + iw, y: y + (hh - probe.box.h) / 2, maxWidth: bw, size, maxLines, fill: style.fill ?? th.card, stroke: style.stroke ?? th.inkSoft, dash: style.dash, textName: style.textName});
      const icon = it.icon ? adIcon(ctx, it, x, y + hh / 2, iconS) : null;
      return {node: g({name, opacity: style.opacity ?? 0}, icon, c.node), box: {x, y, w, h: hh}, chip: c.box};
    },
  };
}

/** Flow measured items into rows (left → right, wrapping; optionally centred). */
export function flowRows(items, o) {
  const gap = o.gap ?? 16, rowGap = o.rowGap ?? 10;
  let x = o.x, y = o.y, rowH = 0;
  const placed = [];
  for (const it of items) {
    if (x > o.x && x + it.w > o.x + o.w + 0.5) { x = o.x; y += rowH + rowGap; rowH = 0; }
    placed.push({it, x, y});
    x += it.w + gap;
    rowH = Math.max(rowH, it.h);
  }
  if (o.center) {
    const rows = new Map();
    for (const pl of placed) { if (!rows.has(pl.y)) rows.set(pl.y, []); rows.get(pl.y).push(pl); }
    for (const rw of rows.values()) {
      const right = Math.max(...rw.map(pl => pl.x + pl.it.w));
      const dx = (o.x + o.w - right) / 2;
      rw.forEach(pl => { pl.x += dx; });
    }
  }
  return {placed, bottom: placed.length ? y + rowH : o.y};
}

/**
 * Measure the record sheet. Rows: {key, icon, text, item?, lane?, highlight?}. Text rows use fitG (glue-aware, never
 * breaks a word); with labels hidden each row shows simulated writing bars (a prop, not supplied text).
 */
export function recordMeasure(ctx, o) {
  const size = o.size;
  const pad = Math.max(14, size * 0.7);
  const iconS = size * 1.9;
  const textW = o.w - 2 * pad - iconS - 12;
  const noHead = o.header === null;
  const ho = {maxWidth: o.w - 2 * pad, size, minSize: size, maxLines: 2, weight: 700};
  const headFit = o.text && !noHead ? fitG(ctx, unwidow(glueN(o.header), t0 => fitG(ctx, t0, ho)), ho) : null;
  const headH = noHead ? size * 0.3 : o.text ? headFit.height + size * 0.6 : size * 1.4;
  const rows = o.rows.map(rw => {
    if (!o.text) return {...rw, fit: null, h: Math.max(iconS, size * 1.5) + size * 0.5};
    const fo = {maxWidth: textW, size, minSize: size, maxLines: rw.maxLines ?? o.maxLines ?? 3, weight: rw.weight ?? 600};
    const fit = fitG(ctx, unwidow(glueN(rw.text), t0 => fitG(ctx, t0, fo)), fo);
    return {...rw, fit, h: Math.max(iconS, fit.height) + size * 0.5};
  });
  const bad = (headFit && (headFit.truncated || headFit.broken)) || rows.some(rw => rw.fit && (rw.fit.truncated || rw.fit.broken));
  const clipH = Math.max(18, size * 0.9);
  const h0 = clipH * 0.5 + pad * 0.6 + headH + rows.reduce((s, rw) => s + rw.h, 0) + pad * 0.6;
  return {size, pad, iconS, textW, headFit, headH, rows, bad, h: h0, w: o.w, clipH, noHead};
}

/**
 * Build the record from a measurement at (x, y) (y = top of the clipboard).
 * Named nodes: `${prefix}` (whole), `${prefix}-row-${key}`, `${prefix}-txt-${key}`,
 * `${prefix}-hl-${key}` (row highlight, for rows marked `highlight`).
 */
export function recordBuild(ctx, m, o) {
  const th = ctx.theme;
  const {x, y} = o;
  const P = o.prefix;
  const {pad, iconS, size} = m;
  const w = m.w;
  const out = [];
  const nodes = [];
  let cy = y + m.clipH * 0.5 + pad * 0.6;
  if (m.headFit) nodes.push(textBlock(m.headFit, {x: x + pad, y: cy, fill: th.ink, name: `${P}-head`}));
  else if (!m.noHead) nodes.push(h('rect', {x: r(x + pad), y: r(cy + size * 0.2), width: r(w * 0.45), height: r(size * 0.5), rx: 3, fill: th.inkSoft, opacity: 0.55}));
  cy += m.headH;
  if (!m.noHead) nodes.push(h('path', {d: `M${r(x + pad)} ${r(cy - size * 0.3)}H${r(x + w - pad)}`, stroke: th.ink, 'stroke-width': 2}));
  const rowNodes = [];
  m.rows.forEach((rw, i) => {
    const top = cy;
    const icy = top + rw.h / 2 - size * 0.1;
    const tx = x + pad + iconS + 12;
    const icon = adIcon(ctx, rw, x + pad, icy, iconS);
    let textNode = null;
    let lines = [];
    if (rw.fit) {
      const ty = top + (rw.h - size * 0.5 - rw.fit.height) / 2 + size * 0.05;
      lines = rw.fit.lines.map((ln, li) => ({x: tx, y: ty + li * rw.fit.lineHeight, w: ctx.measure(ln.replace(/ /g, ' '), rw.fit.size, rw.fit.weight, rw.fit.family), h: rw.fit.size}));
      textNode = textBlock(rw.fit, {x: tx, y: ty, fill: th.ink, name: `${P}-txt-${rw.key}`});
    } else {
      const bw = m.textW;
      lines = [0, 1].map(li => ({x: tx, y: top + rw.h * 0.28 + li * size * 0.75, w: bw * (li ? 0.55 : 0.85), h: size * 0.4}));
      textNode = g(null, lines.map(ln => h('path', {d: `M${r(ln.x)} ${r(ln.y + size * 0.2)}H${r(ln.x + ln.w)}`, stroke: th.inkSoft, 'stroke-width': r(size * 0.28), 'stroke-linecap': 'round', opacity: 0.6})));
    }
    const hl = rw.highlight ? h('path', {name: `${P}-hl-${rw.key}`, d: roundRectPath(x + pad * 0.25, top + size * 0.05, w - pad * 0.5, rw.h - size * 0.4, 6), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2, opacity: 0}) : null;
    rowNodes.push(g({name: `${P}-row-${rw.key}`}, hl, g({name: `${P}-icon-${rw.key}`}, icon), textNode));
    const box = {x: x + pad * 0.5, y: top, w: w - pad, h: rw.h};
    out.push({key: rw.key, box, lines, iconBox: {x: x + pad, y: icy - iconS / 2, w: iconS, h: iconS}});
    cy += rw.h;
    if (i < m.rows.length - 1) rowNodes.push(h('path', {d: `M${r(x + pad)} ${r(cy - size * 0.25)}H${r(x + w - pad)}`, stroke: th.paperLine, 'stroke-width': 1.5}));
  });
  const H0 = m.h;
  const board = g(null,
    h('path', {d: roundRectPath(x - 10, y - 4, w + 20, H0 + 14, 10), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(x, y + m.clipH * 0.3, w, H0 - m.clipH * 0.3, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x + w / 2 - w * 0.14, y - m.clipH * 0.35, w * 0.28, m.clipH, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
  );
  return {node: g({name: P}, board, nodes, rowNodes), rows: out, box: {x: x - 10, y: y - m.clipH * 0.35, w: w + 20, h: H0 + 14 + m.clipH * 0.35}, paper: {x, y: y + m.clipH * 0.3, w, h: H0 - m.clipH * 0.3}};
}

/** Record row of a step: its object icon with the ●/◆ glyph of its supplied lane. */
export const entryRow = (e, extra = {}) => ({key: `ev${e.i}`, icon: 'item', item: e.i, lane: e.lane, text: entryText(e), ...extra});

/* Defaults (EN / ES)                                                       */
/* ------------------------------------------------------------------------ */

/** Shared English defaults of the fictional content (event, steps, loss). */
export const CA_DEFAULTS = {
  origin: {name: 'Event X (fictional)'},
  events: [
    {label: 'Step 1 (supplied): A pushes a trolley', lane: 'a'},
    {label: 'Step 2 (supplied): B walks a trolley', lane: 'b'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Loss described as supplied (no amount)'}],
};

/** Shared Spanish versions of the default fictional content. */
export const CA_ES_DEFAULTS = {
  origin: {name: 'Evento X (ficticio)'},
  events: [
    {label: 'Paso 1 (aportado): A empuja un carro', lane: 'a'},
    {label: 'Paso 2 (aportado): B lleva un carro', lane: 'b'},
  ],
  losses: [{label: 'Pérdida descrita según lo aportado (sin importe)'}],
};

/**
 * Wrap a scene so that, with locale "es", every top-level param still equal to the English default is replaced by its
 * Spanish default (the author's own values are never touched). The replacement is a view of the context: layout, build
 * and frame all see the same localised params.
 */
export function localizeScene(scene, defaults, es) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const cache = new WeakMap();
  const view = ctx => {
    const p = ctx.params;
    if (!p || p.locale !== 'es') return ctx;
    let c = cache.get(ctx);
    if (c) return c;
    const q = {...p};
    let changed = false;
    for (const [k, v] of Object.entries(es)) if (k in defaults && same(p[k], defaults[k])) { q[k] = v; changed = true; }
    c = changed ? {...ctx, params: q} : ctx;
    cache.set(ctx, c);
    return c;
  };
  return {
    ...scene,
    layout: (ctx, ...a) => scene.layout(view(ctx), ...a),
    build: (ctx, ...a) => scene.build(view(ctx), ...a),
    frame: (ctx, ...a) => scene.frame(view(ctx), ...a),
  };
}

export {shade};
