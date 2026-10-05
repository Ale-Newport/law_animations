/**
 * "Deliberación separada" kit (LAW-0229..0232): inside a generic, fictional
 * building, a public space (the hearing room, marked ●) moves apart from an
 * ABSTRACT deliberation zone (marked ◆). The zone is an empty, tinted space
 * behind a generic partition with a door; nobody is drawn in it and nothing
 * happens in it.
 *
 * The scene is a floor plan seen from above. At rest the two spaces stand
 * side by side, joined through the door in the partition; the participants of
 * the public space (generic, fictional: "Participant A", "Participant B" …)
 * sit on the public benches. The concrete action: the door in the partition
 * closes, then the public space — its floor, walls, benches and seated
 * participants — travels along a drawn track away from the zone, leaving a
 * visible separation between them.
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md): every name is a fictional,
 * editable placeholder and the separation is shown "as configured
 * (illustrative)". Nothing here states who may attend, a secrecy or
 * confidentiality rule, a vote, a majority, a hierarchy, a time span or any
 * decision; no judge or jury is drawn. "Audiencia" (●) and "deliberación" (◆)
 * get equal visual weight: the same room size, stroke, tint lightness, chip
 * style and marker size — told apart by solid ● / ◆ cues, never by dashes.
 *
 * The kit owns fields, defaults, strings, the plan geometry (template units,
 * in a "flow" frame: +x from the public space towards the zone, y across),
 * the art (building, zone, partition door or sliding screen, the movable
 * public space with its benches), the participants, glyphs, chips and a
 * generic panel layout. Each entry owns its own timeline, composition and
 * semantics. Generic art comes from ./courts-art.js; text fitting, placers and
 * the plan mapper from ./asignacion-de-organo.js (both read-only).
 * @module animations/courts/kits/deliberacion-separada
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {changedMarker} from '../../../primitives/markers.js';
import {planColors, floorArea, wallRing, planBench, planPerson, routeTrail, PERSON} from './courts-art.js';
import {mapper, mapperAt, placeNear, unionBox, textAt, fitG as fitG0, overlaps, pxPerUnit, R2, FONT, stripNames, bake} from './asignacion-de-organo.js';

/**
 * fitG that also reports a word torn across two lines (e.g. "deliberació / n") as truncated, so layouts that would
 * split a word are rejected (harness warnings split-word / orphan-fragment).
 */
function fitG(text, o) {
  const f = fitG0(text, o);
  const norm = t => String(t).replace(/[\s\u00a0]+/g, ' ').replace(/…$/, '').trim();
  const lines = f.lines.map(norm);
  const split = norm(lines.join(' ')) !== norm(text) && !f.truncated;
  const orphan = lines.length > 1 && lines.some(l => l.length <= 2);
  return split || orphan ? {...f, truncated: true} : f;
}

export {mapper, mapperAt, placeNear, unionBox, textAt, fitG, overlaps, pxPerUnit, R2, FONT, stripNames, bake, planPerson, routeTrail, PERSON};

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

export const PMAX = 4;

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Fields shared by the four entries (brief: courts, routes, seats, labels). */
export const delibFields = {
  courts: obj('Generic, fictional spaces: the building, the public space (hearing room, ●) and the abstract deliberation zone (◆). No real court, building shape, emblem or jurisdiction', {
    building: str('Name of the building (fictional)', 60),
    hearing: str('Name of the public space — the hearing room (audiencia), marked ● (fictional)', 60),
    deliberation: str('Name of the abstract deliberation zone (deliberación), marked ◆ (fictional)', 60),
  }, ['building', 'hearing', 'deliberation']),
  routes: obj('The track and the partition (as configured)', {
    track: str('Caption of the track the public space follows when it moves apart', 60),
    partition: str('Caption of the generic partition (with its door) between the public space and the zone', 60),
  }, ['track', 'partition']),
  seats: obj('The public benches and the generic participants seated on them', {
    bench: str('Caption of the public benches', 60),
    participants: list('Generic participants of the public space (fictional); a letter badge marks each one', obj('Participant', {
      name: str('Name (fictional)', 40),
      appearance,
    }, ['name']), 2, PMAX),
  }, ['bench', 'participants']),
  labels: obj('Editable built-in captions', {
    gap: str('Caption of the separation between the public space and the zone', 60),
    sequence: str('Caption shown wherever an order is drawn', 60),
    key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 110),
  }, ['gap', 'sequence', 'key']),
};

export const DELIB_EN = {
  courts: {building: 'Generic building (fictional)', hearing: 'Hearing room · public space (fictional)', deliberation: 'Deliberation zone (abstract, fictional)'},
  routes: {track: 'Track the public space follows (as configured)', partition: 'Generic partition with a door'},
  seats: {bench: 'Public benches', participants: [{name: 'Participant A (fictional)'}, {name: 'Participant B (fictional)'}, {name: 'Participant C (fictional)'}]},
  labels: {gap: 'Separation as configured (illustrative)', sequence: 'Sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const DELIB_ES = {
  courts: {building: 'Edificio genérico (ficticio)', hearing: 'Sala de audiencia · espacio público (ficticia)', deliberation: 'Zona de deliberación (abstracta, ficticia)'},
  routes: {track: 'Recorrido del espacio público (según lo configurado)', partition: 'Tabique genérico con puerta'},
  seats: {bench: 'Bancos del público', participants: [{name: 'Participante A (ficticio)'}, {name: 'Participante B (ficticia)'}, {name: 'Participante C (ficticio)'}]},
  labels: {gap: 'Separación según lo configurado (ilustrativa)', sequence: 'Secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const DELIB_LONG = {
  courts: {
    building: 'Generic civic building with two wings, east side (fictional)',
    hearing: 'Hearing room two · public space with benches (fictional)',
    deliberation: 'Deliberation zone two, abstract separated space (fictional)',
  },
  routes: {
    track: 'Track along which the public space moves apart (configured)',
    partition: 'Generic partition with one hinged door between the spaces',
  },
  seats: {
    bench: 'Public benches of the hearing room, two rows (as configured)',
    participants: [
      {name: 'Participant A, member of the public'},
      {name: 'Participant B, member of the public'},
      {name: 'Participant C, member of the public'},
      {name: 'Participant D, member of the public'},
    ],
  },
  labels: {
    gap: 'Separation between both spaces as configured (illustrative)',
    sequence: 'Sequence exactly as configured by the author (illustrative)',
    key: 'Every name, space and caption is shown exactly as supplied by the author · no conclusion drawn',
  },
};

export const DELIB_STRINGS = {
  en: {
    apart: 'The public space stands apart from the deliberation zone (as supplied)',
    adjacent: 'The public space stays beside the deliberation zone; the partition door is closed (as supplied)',
    hearingTag: 'Hearing', delibTag: 'Deliberation',
  },
  es: {
    apart: 'El espacio público queda apartado de la zona de deliberación (según lo aportado)',
    adjacent: 'El espacio público sigue junto a la zona de deliberación; la puerta del tabique está cerrada (según lo aportado)',
    hearingTag: 'Audiencia', delibTag: 'Deliberación',
  },
};

/* ------------------------------------------------------------------ */
/* Geometry (template units, flow frame)                               */
/* ------------------------------------------------------------------ */

export const WALL = 18;      // room walls
export const BWALL = 22;     // building wall
export const RW = 420;       // room inner width (along the flow)
export const RH = 330;       // room inner depth (across)
export const MARGIN = 40;    // building margin around the spaces
export const GAP = 170;      // how far the public space moves apart
export const DOOR = 112;     // door opening in the partition
export const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * The plan in template units. The public space's inner box at rest is
 * `pub0`; it moves by −move along x. The zone's inner box is `zone`. The
 * building's inner box encloses both with the full move and a margin.
 * @param {{n?:number, gap?:number, rw?:number, rh?:number, margin?:number}} [o]
 */
export function delibGeometry(o = {}) {
  const t = WALL, tb = o.tb ?? BWALL;
  const rw = o.rw ?? RW, rh = o.rh ?? RH;
  const gap = o.gap ?? GAP;
  const m = o.margin ?? MARGIN;
  const n = clamp(o.n ?? 3, 1, PMAX);
  const pub0 = {x: 0, y: 0, w: rw, h: rh};
  const zone = {x: rw + 2 * t, y: 0, w: rw, h: rh};
  const door = {y0: rh / 2 - DOOR / 2, y1: rh / 2 + DOOR / 2, x: zone.x - t / 2};
  const building = {x: -gap - t - m, y: -t - m, w: gap + m + 2 * t + 2 * rw + t + m + t, h: rh + 2 * t + 2 * m};
  const E = {x: building.x - tb, y: building.y - tb, w: building.w + 2 * tb, h: building.h + 2 * tb};
  // two bench columns facing the partition (+x): front bench nearer the partition
  const bx = [rw - 120, rw - 300];
  const benchLen = Math.min(250, rh - 24);
  const benches = bx.map(x => ({cx: x - 6, cy: rh / 2, w: benchLen}));
  const seatPts = [
    {x: bx[0], y: rh / 2 - 60}, {x: bx[0], y: rh / 2 + 60},
    {x: bx[1], y: rh / 2 - 60}, {x: bx[1], y: rh / 2 + 60},
  ].slice(0, n).map(q => ({...q, deg: 90}));
  // letter badges sit behind each participant (towards −x), clear of the benches and of the
  // seated legs of the row behind; badgePts(Rtu) for a badge radius in template units
  const badgePts = (Rtu = 24) => seatPts.map((q, i) => (i < 2
    ? {x: (bx[1] + 62 + bx[0] - 36) / 2, y: q.y}
    : {x: Math.max(Rtu + 4, bx[1] - 36 - Rtu - 3), y: q.y}));
  /** does a badge of radius Rtu at q clear the seated people, the benches and the walls? */
  const badgeClear = (q, Rtu) => {
    const b = {x: q.x - Rtu, y: q.y - Rtu, w: 2 * Rtu, h: 2 * Rtu};
    const hit = a => b.x < a.x + a.w && a.x < b.x + b.w && b.y < a.y + a.h && a.y < b.y + b.h;
    if (b.x < 2 || b.y < 2 || b.x + b.w > rw - 2 || b.y + b.h > rh - 2) return false;
    if (seatPts.some(s => hit({x: s.x - 30, y: s.y - 44, w: 92, h: 88}))) return false;
    return !benches.some(bn => hit({x: bn.cx - 29, y: bn.cy - bn.w / 2, w: 58, h: bn.w}));
  };
  // the track: two rows of dots in the building margin, above and below the public space
  const ty = [-t - m * 0.5, rh + t + m * 0.5];
  const track = ty.map(y => [{x: -t - 10, y}, {x: -t - gap + 10, y}]);
  // ● / ◆ markers at the same relative corner of each space
  // (top corner away from the doorway and the seats: clear of every badge and seated person)
  const markerAt = box => ({x: box.x + box.w - 32, y: box.y + 28});
  return {
    t, tb, rw, rh, gap, m, n, pub0, zone, door, building, E, benches, seatPts, badgePts, badgeClear, track, bx,
    marks: {pub: markerAt(pub0), zone: markerAt(zone)},
    /** outer box (walls included) of the public space when moved by `move` */
    pubOuter: (move = 0) => ({x: -t - move, y: -t, w: rw + 2 * t, h: rh + 2 * t}),
    zoneOuter: () => ({x: zone.x - t, y: -t, w: rw + 2 * t, h: rh + 2 * t}),
    /** the separation between the two spaces (empty when move = 0) */
    gapBox: (move = 0) => ({x: rw + t - move, y: -t, w: Math.max(0, move), h: rh + 2 * t}),
  };
}

/* ------------------------------------------------------------------ */
/* Art                                                                  */
/* ------------------------------------------------------------------ */

/** Neutral tints of equal lightness for the two spaces (● public, ◆ zone). */
export const TINTS = {pub: '#e4ecf3', zone: '#eee6f0'};

/** Solid ● / ◆ glyph (same area, same ink), centred at the origin. */
export function zoneGlyph(ctx, kind, s, o = {}) {
  const fill = o.fill ?? '#1f2328';
  if (kind === 'zone') {
    const a = s * 0.5;
    return h('path', {name: o.name, d: `M0 ${r(-a)}L${r(a)} 0L0 ${r(a)}L${r(-a)} 0Z`, fill, stroke: o.stroke ?? '#fff', 'stroke-width': o.sw ?? r(s * 0.08, 2), 'stroke-linejoin': 'round'});
  }
  return h('circle', {name: o.name, r: r(s * 0.4), fill, stroke: o.stroke ?? '#fff', 'stroke-width': o.sw ?? r(s * 0.08, 2)});
}

/**
 * The partition's closure: a hinged door (leaf + faint solid swing arc) or a
 * sliding screen (two panels that part along the wall). frame(k) with k the
 * open fraction 0..1.
 */
export function partitionClosure(ctx, G, {name, kind = 'door'}) {
  const c = planColors(ctx);
  const {y0, y1, x} = G.door;
  const w = y1 - y0;
  if (kind === 'open') {
    // an open doorway: nothing closes it (frame(k) has nothing to move)
    return {node: g({name}), frame: () => ({}), kind};
  }
  if (kind === 'screen') {
    // two panels, each half the opening, sliding into the wall pockets
    const half = w / 2;
    const panel = (nm, y) => g({name: nm, transform: T(0, 0)},
      h('rect', {x: r(x - 5), y: r(y), width: 10, height: r(half), rx: 3, fill: c.glass, stroke: '#1f2328', 'stroke-width': 1.8}),
      h('path', {d: `M${r(x)} ${r(y + 6)}V${r(y + half - 6)}`, stroke: c.wallEdge, 'stroke-width': 1.4}));
    const node = g({name},
      h('path', {d: `M${r(x - 9)} ${r(y0)}V${r(y1)}M${r(x + 9)} ${r(y0)}V${r(y1)}`, stroke: c.frame, 'stroke-width': 2, opacity: 0.8}),
      panel(`${name}-p0`, y0), panel(`${name}-p1`, y0 + half));
    const frame = k => {
      const q = clamp(k) * (half - 8);
      return {[`${name}-p0`]: {transform: T(0, r(-q))}, [`${name}-p1`]: {transform: T(0, r(q))}};
    };
    return {node, frame, kind};
  }
  // hinged door: hinge at the top of the opening, closed along the wall (+y), opens into the zone (+x)
  const hinge = {x, y: y0};
  const node = g({name},
    h('path', {d: `M${r(hinge.x)} ${r(y1)}A${r(w)} ${r(w)} 0 0 0 ${r(hinge.x + w)} ${r(hinge.y)}`, fill: 'none', stroke: c.frame, 'stroke-width': 1.6, opacity: 0.45}),
    g({name: `${name}-leaf`, transform: `rotate(0 ${r(hinge.x)} ${r(hinge.y)})`},
      h('rect', {x: r(hinge.x - 5), y: r(hinge.y), width: 10, height: r(w), rx: 3, fill: c.woodDark, stroke: '#1f2328', 'stroke-width': 1.8})),
    h('circle', {cx: r(hinge.x), cy: r(hinge.y), r: 5.5, fill: c.wallEdge}),
  );
  const frame = k => ({[`${name}-leaf`]: {transform: `rotate(${r(-90 * clamp(k), 2)} ${r(hinge.x)} ${r(hinge.y)})`}});
  return {node, frame, kind};
}

/**
 * The plan art: building (floor, outer wall), the abstract zone (tint, inset
 * outline, walls with the partition opening, its closure, ◆) and the movable
 * public space (tint, walls with the matching opening, benches, ●).
 * frame(move, open) → node records.
 * @param {any} ctx
 * @param {any} G delibGeometry()
 * @param {{prefix:string, closure?:'door'|'screen', rails?:boolean}} o
 */
export function delibArt(ctx, G, o) {
  const P = o.prefix;
  const c = planColors(ctx);
  const {t, rw, rh, zone, pub0, door, building} = G;
  const gaps = [{side: 'right', a: door.y0, b: door.y1, kind: 'open'}];
  const zoneGaps = [{side: 'left', a: door.y0, b: door.y1, kind: 'open'}];
  const closure = o.closure === null ? null : partitionClosure(ctx, G, {name: `${P}-door`, kind: o.closure || 'door'});
  const dots = [];
  for (let x = zone.x + 40; x < zone.x + rw - 20; x += 44) for (let y = 40; y < rh - 20; y += 44) dots.push(`M${r(x)} ${r(y)}h0.1`);
  const rails = (o.rails ?? true) ? G.track.map((pts, i) => solidTrack(ctx, {name: `${P}-rail${i}`, pts, width: 7})) : [];
  const node = g({name: `${P}-plan`},
    // building: planked floor, outer wall ring
    g({name: `${P}-building`},
      floorArea(ctx, {name: `${P}-bfloor`, x: building.x, y: building.y, w: building.w, h: building.h, kind: 'planks', cell: 64}),
      wallRing(ctx, {name: `${P}-bwall`, x: building.x, y: building.y, w: building.w, h: building.h, t: G.tb})),
    rails.map(rl => rl.node),
    // the abstract zone: a tinted, empty space with a fine dot texture and an inset outline
    g({name: `${P}-zone`},
      h('rect', {x: r(zone.x), y: 0, width: r(rw), height: r(rh), fill: TINTS.zone}),
      h('path', {d: dots.join(''), stroke: shade(TINTS.zone, -0.18), 'stroke-width': 5, 'stroke-linecap': 'round'}),
      h('path', {d: roundRectPath(zone.x + 22, 22, rw - 44, rh - 44, 18), fill: 'none', stroke: shade(TINTS.zone, -0.3), 'stroke-width': 2.5}),
      wallRing(ctx, {name: `${P}-zwall`, x: zone.x, y: 0, w: rw, h: rh, t, gaps: zoneGaps}),
      (o.marks === undefined || o.marks === true || (o.marks && o.marks.zone)) ? g({transform: T(G.marks.zone.x, G.marks.zone.y)}, zoneGlyph(ctx, 'zone', 44, {name: `${P}-zmark`})) : null),
    closure && closure.node,
    // the movable public space
    g({name: `${P}-pub`, transform: T(0, 0)},
      h('rect', {x: 0, y: 0, width: r(rw), height: r(rh), fill: TINTS.pub}),
      floorArea(ctx, {name: `${P}-pfloor`, x: pub0.x, y: pub0.y, w: rw, h: rh, kind: 'tiles', cell: 58, fill: 'none', line: shade(TINTS.pub, -0.12)}),
      wallRing(ctx, {name: `${P}-pwall`, x: 0, y: 0, w: rw, h: rh, t, gaps}),
      G.benches.map((b, i) => planBench(ctx, {name: `${P}-bench${i}`, cx: b.cx, cy: b.cy, w: b.w, d: 58, deg: 90})),
      (o.marks === undefined || o.marks === true || (o.marks && o.marks.pub)) ? g({transform: T(G.marks.pub.x, G.marks.pub.y)}, zoneGlyph(ctx, 'pub', 44, {name: `${P}-pmark`})) : null),
  );
  const frame = (move, open, railP = 0, railOp = 0) => {
    const out = {[`${P}-pub`]: {transform: T(r(-move, 2), 0)}, ...(closure ? closure.frame(open) : {})};
    rails.forEach(rl => Object.assign(out, rl.frame(railP, railOp)));
    return out;
  };
  return {node, frame, closure, rails};
}

/**
 * A solid track line (a rail with end studs) with draw-on progress: frame(p, opacity). Solid on purpose: dashes and
 * dots mean pending / ghost across the library.
 */
export function solidTrack(ctx, o) {
  const c = planColors(ctx);
  const [a, b] = o.pts;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const w = o.width ?? 7;
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-line`, d: `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`, stroke: c.route, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len, 1)} ${r(len + 10, 1)}`, 'stroke-dashoffset': r(len, 1), fill: 'none'}),
    h('circle', {cx: r(a.x), cy: r(a.y), r: r(w * 0.9, 2), fill: c.route}),
    h('circle', {name: `${o.name}-end`, cx: r(b.x), cy: r(b.y), r: r(w * 0.9, 2), fill: c.route, opacity: 0}));
  const frame = (p, opacity = 1) => ({
    [o.name]: {opacity: r(opacity, 3)},
    [`${o.name}-line`]: {'stroke-dashoffset': r(len * (1 - clamp(p)), 1)},
    [`${o.name}-end`]: {opacity: p >= 0.99 ? 1 : 0},
  });
  return {node, frame};
}

/** The participants' looks (supplied appearance wins; seeded otherwise). */
export function participantLooks(ctx, p) {
  return p.seats.participants.map((q, i) => actorLook(ctx, q, i));
}

/** Seated pose records for a planPerson at q (flow frame), moved by −move. */
export function seatedPose(pp, q, move = 0, k = 1) {
  return pp.pose({x: q.x - move, y: q.y, deg: q.deg ?? 90, scale: k, seated: 1});
}

/* ------------------------------------------------------------------ */
/* Text: chips, badges, legend, panel                                  */
/* ------------------------------------------------------------------ */

/**
 * A name chip: optional ● / ◆ glyph + fitted text on a card. Returns
 * {w, h, fit, node(x, y, name)}.
 */
export function nameChip(ctx, text, {F, maxWidth, maxLines = 3, weight = 700, glyph = null, stroke}) {
  const th = ctx.theme;
  const gs = glyph ? F * 1.15 : 0;
  const padX = F * 0.55, padY = F * 0.36;
  const inner = maxWidth - padX * 2 - (glyph ? gs + F * 0.4 : 0);
  const fit = fitG(text, {maxWidth: inner, size: F, minSize: F, maxLines, weight});
  const w = fit.width + padX * 2 + (glyph ? gs + F * 0.4 : 0);
  const hh = Math.max(fit.height, gs) + padY * 2;
  return {
    w, h: hh, fit,
    node(x, y, name, o = {}) {
      const rad = Math.min(hh / 2, F * 0.6);
      return g({name, opacity: o.opacity},
        h('path', {name: name && `${name}-body`, d: roundRectPath(x, y, w, hh, rad), fill: th.card, stroke: stroke ?? th.ink, 'stroke-width': 2.4}),
        glyph ? g({transform: T(x + padX + gs / 2, y + hh / 2)}, zoneGlyph(ctx, glyph, gs)) : null,
        textAt(fit, x + padX + (glyph ? gs + F * 0.4 : 0), y + (hh - fit.height) / 2, th.ink, {name: name && `${name}-text`}),
      );
    },
  };
}

/**
 * A two-part card: a bold title over a regular caption, with an optional ● / ◆ glyph. Returns {w, h, fit, node}.
 */
export function cardChip(ctx, title, caption, {F, maxWidth, glyph = null, stroke}) {
  const th = ctx.theme;
  const gs = glyph ? F * 1.15 : 0;
  const padX = F * 0.55, padY = F * 0.36;
  const inner = maxWidth - padX * 2 - (glyph ? gs + F * 0.4 : 0);
  const f1 = fitG(title, {maxWidth: inner, size: F, minSize: F, maxLines: 4, weight: 700});
  const f2 = caption ? fitG(caption, {maxWidth: inner, size: F, minSize: F, maxLines: 8, weight: 500}) : null;
  const gap = F * 0.5;
  const tw = Math.max(f1.width, f2 ? f2.width : 0);
  const th2 = f1.height + (f2 ? gap + f2.height : 0);
  const w = tw + padX * 2 + (glyph ? gs + F * 0.4 : 0);
  const hh = Math.max(th2, gs) + padY * 2;
  return {
    w, h: hh, fit: {truncated: f1.truncated || Boolean(f2 && f2.truncated)},
    node(x, y, name) {
      const rad = Math.min(hh / 2, F * 0.6);
      const tx = x + padX + (glyph ? gs + F * 0.4 : 0);
      return g({name},
        h('path', {name: name && `${name}-body`, d: roundRectPath(x, y, w, hh, rad), fill: th.card, stroke: stroke ?? th.ink, 'stroke-width': 2.4}),
        glyph ? g({transform: T(x + padX + gs / 2, y + padY + gs / 2)}, zoneGlyph(ctx, glyph, gs)) : null,
        textAt(f1, tx, y + padY, th.ink, {name: name && `${name}-title`}),
        f2 ? textAt(f2, tx, y + padY + f1.height + gap, th.fg, {name: name && `${name}-caption`}) : null);
    },
  };
}

/** Letter badge (participant) centred at the origin; the letter is text. */
export function letterBadge(ctx, letter, R, o = {}) {
  const th = ctx.theme;
  return g({name: o.name, opacity: o.opacity},
    h('circle', {r: r(R), fill: th.card, stroke: '#1f2328', 'stroke-width': r(Math.max(2, R * 0.12), 2)}),
    o.text === false ? null : h('text', {x: 0, y: r(R * 0.36), 'text-anchor': 'middle', 'font-family': FONT, 'font-size': r(R * 1.05, 2), 'font-weight': 800, fill: '#1f2328'}, letter));
}

/** Legend glyphs (design units, centre at the origin). */
export function delibGlyph(ctx, kind, s, o = {}) {
  const c = planColors(ctx);
  if (kind === 'pub' || kind === 'zone') return zoneGlyph(ctx, kind, s * 0.78);
  if (kind === 'bench') return g({transform: `scale(${r(s / 90, 4)})`}, stripNames(planBench(ctx, {name: 'lg-bench', cx: 0, cy: 6, w: 84, d: 56, deg: 0})));
  if (kind === 'track') {
    return g(null,
      h('path', {d: `M${r(-s * 0.45)} 0H${r(s * 0.45)}`, fill: 'none', stroke: c.route, 'stroke-width': 6, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(-s * 0.45), cy: 0, r: 5, fill: c.route}), h('circle', {cx: r(s * 0.45), cy: 0, r: 5, fill: c.route}));
  }
  if (kind === 'partition') {
    return g(null,
      h('rect', {x: r(-s * 0.1), y: r(-s * 0.46), width: r(s * 0.2), height: r(s * 0.24), fill: c.wall}),
      h('rect', {x: r(-s * 0.1), y: r(s * 0.22), width: r(s * 0.2), height: r(s * 0.24), fill: c.wall}),
      o.screen
        ? h('rect', {x: r(-s * 0.05), y: r(-s * 0.22), width: r(s * 0.1), height: r(s * 0.44), rx: 2, fill: c.glass, stroke: '#1f2328', 'stroke-width': 1.6})
        : h('rect', {x: r(-s * 0.05), y: r(-s * 0.22), width: r(s * 0.1), height: r(s * 0.44), rx: 2, fill: c.woodDark, stroke: '#1f2328', 'stroke-width': 1.6}));
  }
  if (kind === 'gap') {
    return g(null,
      h('rect', {x: r(-s * 0.46), y: r(-s * 0.38), width: r(s * 0.16), height: r(s * 0.76), fill: c.wall}),
      h('rect', {x: r(s * 0.3), y: r(-s * 0.38), width: r(s * 0.16), height: r(s * 0.76), fill: c.wall}),
      h('rect', {x: r(-s * 0.3), y: r(-s * 0.38), width: r(s * 0.6), height: r(s * 0.76), fill: c.corridor}),
      h('path', {d: `M${r(-s * 0.22)} 0H${r(s * 0.22)}`, stroke: c.frame, 'stroke-width': 3, 'stroke-linecap': 'round'}));
  }
  if (kind === 'building') {
    return g(null,
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.34), width: r(s * 0.84), height: r(s * 0.68), fill: c.corridor, stroke: c.wall, 'stroke-width': r(s * 0.12)}));
  }
  if (kind === 'letter') return letterBadge(ctx, o.letter, s * 0.5);
  if (kind === 'marker') return changedMarker(ctx, {x: 0, y: 0, radius: s * 0.36});
  if (kind === 'same') return h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.1)}H${r(s * 0.3)}M${r(-s * 0.3)} ${r(s * 0.1)}H${r(s * 0.3)}`, stroke: '#1f2328', 'stroke-width': r(s * 0.08, 2), 'stroke-linecap': 'round'});
  if (kind === 'sequence') {
    // two numbered steps joined by a plain line (no arrowhead: an order as configured, not a direction of authority)
    const R = s * 0.26;
    return g(null,
      h('path', {d: `M${r(-s * 0.2)} 0H${r(s * 0.2)}`, stroke: '#1f2328', 'stroke-width': 2.4}),
      g({transform: T(-s * 0.24, 0)}, letterBadge(ctx, '1', R, {text: false})),
      g({transform: T(s * 0.24, 0)}, letterBadge(ctx, '2', R, {text: false})));
  }
  if (kind === 'person') {
    const pp = planPerson(ctx, {name: 'lg-person', look: o.look || actorLook(ctx, {}, 0)});
    return g({transform: `scale(${r(s / 110, 4)})`}, bake(pp.node, pp.pose({x: 0, y: 6, deg: 0, seated: 1})));
  }
  return h('circle', {r: r(s * 0.3), fill: c.frame});
}

/**
 * A legend row maker: glyph + fitted text. make(w) → {h, truncated, node(x, y)}.
 */
export function legendItem(ctx, {kind, text, F, name, weight = 500, glyphOpts = {}, opacity, maxLines = 5}) {
  const th = ctx.theme;
  return {type: 'legend', make: w => {
    const gs = F * 2.1;
    const f = fitG(text, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines, weight});
    const hh = Math.max(gs, f.height + F * 0.25);
    return {h: hh, truncated: f.truncated, node: (x, y) => g({name, opacity},
      g({transform: T(x + gs / 2, y + hh / 2)}, delibGlyph(ctx, kind, gs, glyphOpts)),
      textAt(f, x + gs + 14, y + (hh - f.height) / 2, th.fg))};
  }};
}

/** A legend row with a bold title over a caption (e.g. ● + the space's name + its caption). */
export function legendItem2(ctx, {kind, title, text, F, name, glyphOpts = {}, maxLines2 = 6}) {
  const th = ctx.theme;
  return {type: 'legend', make: w => {
    const gs = F * 2.1;
    const f1 = fitG(title, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines: 5, weight: 700});
    const f2 = fitG(text, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines: maxLines2, weight: 500});
    const th2 = f1.height + F * 0.4 + f2.height;
    const hh = Math.max(gs, th2 + F * 0.25);
    return {h: hh, truncated: f1.truncated || f2.truncated, node: (x, y) => g({name},
      g({transform: T(x + gs / 2, y + Math.min(hh / 2, gs / 2 + F * 0.3))}, delibGlyph(ctx, kind, gs, glyphOpts)),
      textAt(f1, x + gs + 14, y + (hh - th2) / 2, th.ink, {name: name && `${name}-title`}),
      textAt(f2, x + gs + 14, y + (hh - th2) / 2 + f1.height + F * 0.4, th.fg))};
  }};
}

/** A plain caption row (the single editorial note of a view). */
export function captionItem(ctx, text, F, name, maxLines = 6) {
  const th = ctx.theme;
  return {type: 'caption', make: w => {
    const f = fitG(text, {maxWidth: w - 8, size: F, minSize: F, maxLines, weight: 600});
    return {h: f.height + F * 0.3, truncated: f.truncated, node: (x, y) => g({name}, textAt(f, x, y + F * 0.15, th.ink))};
  }};
}

/** The neutral key row (italic, with a rule above). */
export function keyItem(ctx, text, F, name = 'key') {
  const th = ctx.theme;
  return {type: 'key', make: w => {
    const f = fitG(text, {maxWidth: w - 8, size: F, minSize: F, maxLines: 6, weight: 500});
    return {h: f.height + F * 0.75, truncated: f.truncated, node: (x, y) => g({name},
      h('path', {d: `M${r(x)} ${r(y)}H${r(x + Math.min(w, f.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
      textAt(f, x, y + F * 0.45, th.fgSoft, {italic: true}))};
  }};
}

/** A state card row (bold text on a card). */
export function stateItem(ctx, text, F, {name = 'state', stroke} = {}) {
  const th = ctx.theme;
  return {type: 'state', make: w => {
    const f = fitG(text, {maxWidth: w - F * 1.2, size: F, minSize: F, maxLines: 6, weight: 700});
    const hh = f.height + F * 0.76;
    return {h: hh, truncated: f.truncated, state: true, node: (x, y) => g({name, opacity: 0},
      h('path', {d: roundRectPath(x, y, f.width + F * 1.2, hh, Math.min(hh / 2, F * 0.7)), fill: th.card, stroke: stroke ?? th.accent4, 'stroke-width': 2.4}),
      textAt(f, x + F * 0.6, y + F * 0.38, th.ink))};
  }};
}

/** A note row keyed to a solid ring on the plan (colour square + text). */
export function noteItem(ctx, text, F, col, name) {
  const th = ctx.theme;
  return {type: 'note', make: w => {
    const f = fitG(text, {maxWidth: w - F * 1.9 - 12, size: F, minSize: F, maxLines: 6, weight: 500});
    return {h: f.height + F * 0.25, truncated: f.truncated, node: (x, y) => g({name, opacity: 0},
      h('rect', {x: r(x + 2), y: r(y + F * 0.05), width: r(F * 1.3), height: r(F * 1.0), rx: 5, fill: 'none', stroke: col, 'stroke-width': 4}),
      textAt(f, x + F * 1.9 + 12, y, th.fg))};
  }};
}

/**
 * Column (stacked) or band (2–3 balanced columns) panel of measured items.
 * Returns {problem, height, boxes, place(B), node, stateNode}.
 */
export function layoutPanel(items, box, F, flow, nCols) {
  const gap = F * 0.7;
  const cols = flow === 'column' ? 1 : (nCols || 2);
  const colGap = F * 1.5;
  const cw = (box.w - colGap * (cols - 1)) / cols;
  const made = items.map(it => ({it, m: it.make(cw)}));
  const problem = made.some(q => q.m.truncated) ? 'panel-trunc' : null;
  const hOf = arr => arr.reduce((a, q) => a + q.m.h, 0) + gap * Math.max(0, arr.length - 1);
  // contiguous runs (reading order kept) with the smallest tallest run (exact partition, any column count)
  let columns = [made];
  if (cols > 1 && made.length > 1) {
    const n = made.length, c = Math.min(cols, n);
    const pre = [0];
    for (const q of made) pre.push(pre[pre.length - 1] + q.m.h);
    const runH = (a, b) => pre[b] - pre[a] + gap * Math.max(0, b - a - 1);
    const best = Array.from({length: c + 1}, () => new Array(n + 1).fill(Infinity));
    const cut = Array.from({length: c + 1}, () => new Array(n + 1).fill(0));
    best[0][0] = 0;
    for (let k = 1; k <= c; k++) for (let b = 1; b <= n; b++) for (let a = k - 1; a < b; a++) {
      const v = Math.max(best[k - 1][a], runH(a, b));
      if (v < best[k][b]) { best[k][b] = v; cut[k][b] = a; }
    }
    const runs = [];
    let b = n;
    for (let k = c; k >= 1; k--) { const a = cut[k][b]; runs.unshift(made.slice(a, b)); b = a; }
    columns = runs;
  }
  const height = Math.max(0, ...columns.map(hOf));
  const out = {problem: problem || (height > box.h + 0.5 ? 'panel-height' : null), height, boxes: [], node: null, stateNode: null, cw};
  out.place = B => {
    const nodes = [];
    out.boxes = [];
    columns.forEach((col, ci) => {
      const x = B.x + ci * (cw + colGap);
      let y = B.y + Math.max(0, (B.h - hOf(col)) / 2);
      for (const q of col) {
        const nd = q.m.node(x, y);
        out.boxes.push({x, y, w: cw, h: q.m.h});
        if (q.m.state) out.stateNode = nd; else nodes.push(nd);
        y += q.m.h + gap;
      }
    });
    out.node = g({name: 'panel'}, nodes);
  };
  return out;
}

/** A leader line from a text box to the nearest point of a part (dot at the part). */
export function leader(box, part, col, name) {
  const cx = Math.max(part.x, Math.min(box.x + box.w / 2, part.x + part.w)), cy = Math.max(part.y, Math.min(box.y + box.h / 2, part.y + part.h));
  const ex = Math.max(box.x, Math.min(cx, box.x + box.w)), ey = Math.max(box.y, Math.min(cy, box.y + box.h));
  return g({name},
    h('line', {x1: r(ex), y1: r(ey), x2: r(cx), y2: r(cy), stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(cx), cy: r(cy), r: 4.5, fill: col}));
}

/** Font sizes tried by the layout searches (px at 1080p). */
export const SIZES = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6];

/**
 * Layout search: compose(v, A) for every text size v (px at 1080p) and arrangement A. Among the compositions
 * without problems, the text sizes >= 19.8 px are preferred (the baseline floor with margin); within them the
 * larger scene wins, with a small bonus for larger text (score = size(L) + 0.004 v). When no composition at
 * >= 19.8 px fits, the largest fitting size wins (stress text may go down to 16.6 px, never lower). When nothing
 * fits, the composition with the fewest problems is returned (its problems are reported, never hidden).
 * @param {(v:number, A:any)=>any} compose  returns {problems, k, ...}
 * @param {any[]} arrs
 * @param {(L:any)=>number} [size]  scene size measure (default L.k)
 */
export function searchLayout(compose, arrs, size = L => L.k) {
  const log = [];
  let best = null, pick = null;
  for (const v of SIZES) {
    if (pick && v < 19.8 - 1e-6) break;
    for (const A of arrs) {
      const L = compose(v, A);
      log.push(`${v}/${A.key || ''}:k${(L.k || 0).toFixed(2)}:${L.problems.join('+')}`);
      if (!best || L.problems.length < best.problems.length || (L.problems.length === best.problems.length && size(L) > size(best))) best = L;
      if (!L.problems.length) {
        const sc = size(L) + 0.004 * v;
        if (!pick || sc > pick.sc + 1e-6) pick = {L, sc};
      }
    }
    if (pick && v < 19.8 - 1e-6) break;
  }
  const out = pick ? pick.L : best;
  out.log = log.slice(-80);
  return out;
}

/* ------------------------------------------------------------------ */
/* The plan with its name chips and badges (shared composition step)   */
/* ------------------------------------------------------------------ */

/**
 * Map the plan into `region` (design units) with the ● / ◆ name chips beside their spaces (above the building on
 * wide plans, left of it when the plan is turned), the building's chip below it (or none when bname = 'panel'),
 * the participants (planPerson rigs) and their letter badges. Node names get `P` as a prefix.
 * The hearing chip and the badges travel with the public space: moveVec(move) is their design-space offset.
 * @returns {any} {M, k, personPx, bOuter, pubRest, zoneD, moveVec, texts, chips…, people, badges…, problems}
 */
export function planScene(ctx, p, F, px, {G, region, rot, cw = 0.3, bname = 'below', moveEnd = 0, P = '', kMax = 1.6, align = {x: 0.5, y: 0.5}, chipMax = 520, showKey = ctx.show('key'), chips = true}) {
  const th = ctx.theme;
  const D = ctx.design;
  const problems = [];
  const chipW = rot ? D.w * cw : Math.min(region.w * 0.4, chipMax);
  const hc = showKey && chips ? nameChip(ctx, p.courts.hearing, {F, maxWidth: chipW, maxLines: 3, glyph: 'pub'}) : null;
  const zc = showKey && chips ? nameChip(ctx, p.courts.deliberation, {F, maxWidth: chipW, maxLines: 3, glyph: 'zone'}) : null;
  const bc = showKey && bname !== 'panel' ? nameChip(ctx, p.courts.building, {F, maxWidth: Math.min(region.w * 0.6, 600), maxLines: 2, weight: 600, stroke: th.inkSoft}) : null;
  for (const c of [hc, zc, bc]) if (c && c.fit.truncated) problems.push('chip-trunc');
  const gapC = 16;
  let planBox;
  if (!rot) {
    const top = hc ? Math.max(hc.h, zc.h) + gapC : 0;
    const bot = bc ? bc.h + gapC : 0;
    planBox = {x: region.x, y: region.y + top, w: region.w, h: region.h - top - bot};
  } else {
    const side = hc ? Math.max(hc.w, zc.w) + gapC : 0;
    const bot = bc ? bc.h + gapC : 0;
    planBox = {x: region.x + side, y: region.y, w: region.w - side, h: region.h - bot};
  }
  const M = mapper(G.E, planBox, rot, kMax, align);
  const k = M.k;
  const toD = M.toD;
  const personPx = 2 * PERSON.half * k * px;
  const bOuter = M.box({x: G.building.x - G.tb, y: G.building.y - G.tb, w: G.building.w + 2 * G.tb, h: G.building.h + 2 * G.tb});
  const pubRest = M.box(G.pubOuter(0)), zoneD = M.box(G.zoneOuter());
  const moveVec = mv => { const a = toD({x: 0, y: 0}), b = toD({x: -mv, y: 0}); return {x: b.x - a.x, y: b.y - a.y}; };
  const invTU = q => (!rot ? {x: (q.x - M.ox) / k, y: (q.y - M.oy) / k} : {x: (M.oy - q.y) / k, y: (q.x - M.ox) / k});
  const dEnd = moveVec(moveEnd);
  const texts = [];
  const out = {hearingChipNode: null, zoneChipNode: null, buildingChipNode: null, chipLead: null, chipLeadTU: null, hb: null, zb: null, bb: null};
  const inD = b => b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= D.w + 0.5 && b.y + b.h <= D.h + 0.5;
  if (showKey && chips) {
    const place = (c, part) => (!rot
      ? {x: part.x + part.w / 2 - c.w / 2, y: bOuter.y - gapC - c.h, w: c.w, h: c.h}
      : {x: bOuter.x - gapC - c.w, y: part.y + part.h / 2 - c.h / 2, w: c.w, h: c.h});
    const hb = place(hc, pubRest), zb = place(zc, zoneD);
    // the chips never exceed their own space's extent (so they never touch each other while one moves)
    if (!rot ? (hc.w > pubRest.w + 4 || zc.w > zoneD.w + 4) : (hc.h > pubRest.h + 4 || zc.h > zoneD.h + 4)) problems.push('chip-wide');
    const hbEnd = {...hb, x: hb.x + dEnd.x, y: hb.y + dEnd.y};
    if (![hb, zb, hbEnd].every(inD)) problems.push('chip-frame');
    if (overlaps(hb, zb, 6) || overlaps(hbEnd, zb, 6)) problems.push('chip-overlap');
    // leaders end on the space's outer wall (the hearing one travels with its chip)
    const lead = (box, part) => {
      if (!rot) return {x: Math.max(part.x + 12, Math.min(box.x + box.w / 2, part.x + part.w - 12)), y: part.y};
      return {x: part.x, y: Math.max(part.y + 12, Math.min(box.y + box.h / 2, part.y + part.h - 12))};
    };
    out.chipLead = lead(hb, pubRest);
    out.chipLeadTU = invTU(out.chipLead);
    const zl = lead(zb, zoneD);
    out.hearingChipNode = g({name: `${P}hearing-chip`},
      leader(hb, {x: out.chipLead.x - 1, y: out.chipLead.y - 1, w: 2, h: 2}, th.ink),
      hc.node(hb.x, hb.y, `${P}hearing-name`));
    out.zoneChipNode = g({name: `${P}zone-chip`},
      leader(zb, {x: zl.x - 1, y: zl.y - 1, w: 2, h: 2}, th.ink),
      zc.node(zb.x, zb.y, `${P}zone-name`));
    texts.push(hb, zb);
    out.hb = hb; out.zb = zb; out.hbEnd = hbEnd;
  }
  if (showKey) {
    if (bc) {
      const bb = {x: bOuter.x + bOuter.w / 2 - bc.w / 2, y: bOuter.y + bOuter.h + gapC, w: bc.w, h: bc.h};
      if (!inD(bb)) problems.push('chip-frame');
      out.buildingChipNode = g({name: `${P}building-chip`},
        leader(bb, {x: bb.x + bb.w / 2 - 1, y: bOuter.y + bOuter.h - 2, w: 2, h: 2}, th.inkSoft),
        bc.node(bb.x, bb.y, `${P}building-name`));
      texts.push(bb);
      out.bb = bb;
    }
  }
  // participants and their letter badges (behind each seat; they travel with the space)
  const looks = participantLooks(ctx, p);
  const people = looks.map((lk, i) => planPerson(ctx, {name: `${P}p${i}`, look: lk}));
  const R = F * 1.0;
  const badgeTU = G.badgePts(R / k);
  const badgeAt = showKey ? badgeTU.map(q => toD(q)) : [];
  const badgeNodes = badgeAt.map((b, i) => g({name: `${P}badge${i}`, transform: T(r(b.x, 2), r(b.y, 2))}, letterBadge(ctx, LETTERS[i], R)));
  if (showKey && badgeTU.some(q => !G.badgeClear(q, R / k))) problems.push('badge');
  if (!inD(bOuter)) problems.push('plan-frame');
  return {M, k, toD, invTU, personPx, bOuter, pubRest, zoneD, moveVec, dEnd, texts, people, badgeTU, badgeAt, badgeNodes, R, problems, planBox, ...out};
}
