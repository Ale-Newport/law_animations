/**
 * "Archivo judicial" kit (LAW-0233..0236): inside a generic, fictional archive
 * room, mobile shelving units on floor rails locate a case file by its
 * identifier.
 *
 * The scene is a floor plan seen from above. Two blocks of mobile shelving
 * stand against the back corners of the room, mirrored: the ● block holds
 * the files supplied as "active", the ◆ block the files supplied as
 * "archived". Each block has three units on two floor rails; the units are
 * packed together with one free aisle width on the corridor side. A counter
 * sits in the front wall with two trays (● and ◆) and the request slip that
 * carries the file's identifier; a generic clerk stands behind it. A locator
 * link (a cable in the floor) runs from the counter to a lamp on the first
 * unit of each block.
 *
 * The concrete action: the clerk reads the slip; a pulse runs along the
 * locator link to the block that holds the identifier and its lamp lights;
 * the other two units of that block roll along their rails and open the
 * aisle at the file; the clerk walks in, takes the file and brings it to the
 * tray of its state.
 *
 * Content rules (docs/LEGAL_CONTENT_POLICY.md): every name, the identifier and
 * the state are fictional, editable placeholders shown "as supplied".
 * "Archived" is only a different shelf location in this configured example:
 * nothing here states a retention period, a destruction or access rule, an
 * archiving procedure, a time span or any consequence of archiving. Active
 * (●) and archived (◆) get equal visual weight: the two blocks are mirror
 * images with the same size, stroke, tint and lamp; the two trays and
 * plaques are the same; they are told apart only by solid ● / ◆ cues, never
 * by dashes, colour, a lock or a strike.
 *
 * The kit owns fields, defaults, strings, the plan geometry (template units),
 * the art, the clerk walk legs, glyphs, chips and a panel layout. Each entry
 * owns its own timeline, composition and semantics. Generic art comes from
 * ./courts-art.js; the plan mapper, the walker, the carry pose, the file prop
 * and the text fitting from ./asignacion-de-organo.js (both read-only).
 * @module animations/courts/kits/archivo-judicial
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath, catmullRom, polyline} from '../../../core/geometry.js';
import {str, int, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {changedMarker} from '../../../primitives/markers.js';
import {planColors, floorArea, wallRing, planTable, planPerson, PERSON} from './courts-art.js';
import {
  mapper, mapperAt, placeNear, unionBox, textAt, fitG, overlaps, pxPerUnit, R2, FONT, stripNames, bake,
  makeLeg, walkAt, clerkNodes, carryPoint, fileProp, FILE, CARRY, tagGlyph,
} from './asignacion-de-organo.js';

export {mapper, mapperAt, placeNear, unionBox, textAt, fitG, overlaps, pxPerUnit, R2, FONT, stripNames, bake, makeLeg, walkAt, clerkNodes, carryPoint, fileProp, FILE, CARRY, planPerson, PERSON, changedMarker};

/* ------------------------------------------------------------------ */
/* Fields, defaults, strings                                           */
/* ------------------------------------------------------------------ */

export const STATES = ['active', 'archived'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Fields shared by the four entries (brief: courts, routes, seats, labels) plus the file. */
export const archFields = {
  courts: obj('Generic, fictional building and archive room with its two shelf blocks: ● for files supplied as active, ◆ for files supplied as archived. No real court, building shape, emblem or jurisdiction', {
    building: str('Name of the building (fictional)', 60),
    archive: str('Name of the archive room (fictional)', 60),
    active: str('Name of the ● block: shelves for files supplied as active (fictional)', 60),
    archived: str('Name of the ◆ block: shelves for files supplied as archived — only a different shelf location in this example (fictional)', 60),
  }, ['building', 'archive', 'active', 'archived']),
  routes: obj('The mobile shelving and the locator link (as configured)', {
    rails: str('Caption of the mobile shelving units on their floor rails', 60),
    locator: str('Caption of the locator link from the counter to the unit lamps', 60),
  }, ['rails', 'locator']),
  seats: obj('The counter and the generic clerk', {
    counter: str('Caption of the counter with its two trays (● and ◆)', 60),
    clerk: obj('The generic clerk (fictional)', {
      name: str('Neutral label of the clerk (fictional)', 40),
      appearance,
    }, ['name']),
  }, ['counter', 'clerk']),
  labels: obj('Editable built-in captions', {
    sequence: str('Caption shown wherever an order is drawn', 60),
    key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 110),
  }, ['sequence', 'key']),
  file: obj('The case file located by its identifier (fictional)', {
    identifier: str('Identifier printed on the request slip (fictional)', 40),
    state: oneOf('State of the file as supplied: active = kept on the ● shelves, archived = kept on the ◆ shelves (only a shelf location in this configured example)', STATES),
  }, ['identifier', 'state']),
};

export const ARCH_EN = {
  courts: {building: 'Generic building (fictional)', archive: 'Archive room (fictional)', active: 'Active files (fictional)', archived: 'Archived files (fictional)'},
  routes: {rails: 'Mobile shelving units on floor rails', locator: 'Locator link to the unit lamps (as configured)'},
  seats: {counter: 'Counter with two trays, ● and ◆', clerk: {name: 'Clerk (generic)'}},
  labels: {sequence: 'Sequence as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
  file: {identifier: 'File 24-017 (fictional)', state: 'active'},
};

export const ARCH_ES = {
  courts: {building: 'Edificio genérico (ficticio)', archive: 'Sala de archivo (ficticia)', active: 'Expedientes activos (ficticio)', archived: 'Expedientes archivados (ficticio)'},
  routes: {rails: 'Estanterías móviles sobre raíles', locator: 'Enlace del localizador (según lo configurado)'},
  seats: {counter: 'Mostrador con dos bandejas, ● y ◆', clerk: {name: 'Personal de archivo (genérico)'}},
  labels: {sequence: 'Secuencia según lo configurado (ilustrativa)', key: 'Según lo aportado · sin conclusión'},
  file: {identifier: 'Expediente 24-017 (ficticio)', state: 'active'},
};

/** Near-maximum lengths (long-labels-stress). */
export const ARCH_LONG = {
  courts: {
    building: 'Generic civic building with two wings, north (fictional)',
    archive: 'Archive room two with mobile shelving units (fictional)',
    active: 'Files supplied as active, on the first block (fictional)',
    archived: 'Files supplied as archived, on the second block (fictional)',
  },
  routes: {
    rails: 'Mobile units that roll along two floor rails in each block',
    locator: 'Locator link from the counter to each unit lamp (configured)',
  },
  seats: {
    counter: 'Service counter in the front wall with two trays, ● and ◆',
    clerk: {name: 'Archive clerk, generic staff (fictional)'},
  },
  labels: {
    sequence: 'Sequence exactly as configured by the author (illustrative)',
    key: 'Every name, identifier, state and caption is shown exactly as supplied by the author · no conclusion drawn',
  },
  file: {identifier: 'Case file 24-00017/B north (fictional)', state: 'active'},
};

export const ARCH_STRINGS = {
  en: {
    atCounter: 'The file is located and placed in the tray of its state (as supplied)',
    located: 'The file is located; the aisle stays open at its shelf (as supplied)',
    activeTag: 'Active', archivedTag: 'Archived',
  },
  es: {
    atCounter: 'El expediente se localiza y queda en la bandeja de su estado (según lo aportado)',
    located: 'El expediente se localiza; el pasillo queda abierto en su estante (según lo aportado)',
    activeTag: 'Activo', archivedTag: 'Archivado',
  },
};

/* ------------------------------------------------------------------ */
/* Geometry (template units, plan seen from above, y down)             */
/* ------------------------------------------------------------------ */

export const ARCH = {t: 18, NU: 3, RH: 412, UD: 62, UL: 200, AW: 116, Y0: 22, WY: 278, FY: 122, CW: 196};

/**
 * The plan in template units. Block 0 (●) is packed against the left wall and
 * opens to the right; block 1 (◆) mirrors it against the right wall.
 * @param {Partial<typeof ARCH>} [o]
 */
export function archGeometry(o = {}) {
  const S = {...ARCH, ...o};
  // the room is as wide as its two blocks (NU units each plus one aisle width) and the corridor between them
  S.RW = o.RW ?? 2 * (20 + S.NU * S.UD + S.AW) + S.CW;
  const {t, RW, RH, UD, UL, AW, Y0, WY, FY, NU} = S;
  const Y1 = Y0 + UL;
  const mx = x => RW - x;
  const blocks = [0, 1].map(b => {
    const dir = b ? -1 : 1;
    const wallX = b ? RW - 20 : 20;
    const units = Array.from({length: NU}, (_, i) => ({x: b ? wallX - (i + 1) * UD : wallX + i * UD, y: Y0, w: UD, h: UL}));
    const span = {x: b ? wallX - NU * UD - AW : wallX, y: Y0, w: NU * UD + AW, h: UL};
    const face = b ? wallX - UD : wallX + UD;
    return {
      b, key: STATES[b], dir, wallX, units, span, face,
      aisleX: face + (dir * AW) / 2,
      plaque: {x: span.x + span.w / 2, y: -t / 2},
      lamp: {x: b ? units[0].x + UD - 16 : units[0].x + 16, y: Y1 - 13},
      // the file spine on the inner face of the first unit
      spine: {x: face - dir * 7, y: FY},
      // the open aisle (walls of the two neighbouring units once opened)
      aisle: {x: b ? face - AW : face, y: Y0, w: AW, h: UL},
    };
  });
  const counter = {cx: RW / 2, cy: RH, w: 300, h: 52};
  const trays = [{x: RW / 2 - 75, y: RH, w: 88, h: 40}, {x: RW / 2 + 75, y: RH, w: 88, h: 40}];
  const slip = {x: RW / 2, y: RH - 2, w: 38, h: 30};
  const home = {x: RW / 2, y: RH - CARRY};
  // locator link: from the counter's inner edge up the corridor, then to each block's lamp
  const cableY = Y1 + 20;
  const cable = [0, 1].map(b => [{x: RW / 2, y: RH - counter.h / 2}, {x: RW / 2, y: cableY}, {x: blocks[b].lamp.x, y: cableY}, {x: blocks[b].lamp.x, y: Y1 - 2}]);
  // walk legs (block 0; block 1 is the mirror image)
  const outPts0 = [{x: RW / 2, y: home.y}, {x: RW / 2 - 26, y: WY + 26}, {x: RW / 2 - 110, y: WY}, {x: blocks[0].aisleX + 52, y: WY}, {x: blocks[0].aisleX, y: WY - 44}, {x: blocks[0].aisleX, y: FY}];
  const backPts0 = [{x: blocks[0].aisleX, y: FY}, {x: blocks[0].aisleX, y: WY - 48}, {x: blocks[0].aisleX + 48, y: WY}, {x: trays[0].x - 60, y: WY + 4}, {x: trays[0].x - 8, y: WY + 40}, {x: trays[0].x, y: home.y}];
  const smooth = pts => catmullRom(pts, 12);
  const legs = [0, 1].map(b => {
    const f = b ? (q => ({x: mx(q.x), y: q.y})) : (q => q);
    const faceDeg = b ? 90 : 270;
    return {
      out: makeLeg(smooth(outPts0.map(f)), 180, faceDeg),
      back: makeLeg(smooth(backPts0.map(f)), faceDeg, 180),
    };
  });
  // extents: walls, plaques above the back wall, the counter below the front wall
  const E = {x: -t - 4, y: -t / 2 - 30, w: RW + 2 * t + 8, h: RH + counter.h / 2 + 8 + t / 2 + 30};
  return {...S, Y1, blocks, counter, trays, slip, home, cable, cableY, legs, E, mx,
    inner: {x: 0, y: 0, w: RW, h: RH},
    outer: {x: -t, y: -t, w: RW + 2 * t, h: RH + 2 * t},
    counterBox: {x: counter.cx - counter.w / 2, y: counter.cy - counter.h / 2, w: counter.w, h: counter.h},
    /** where the clerk stands to set a file in tray b (facing the counter) */
    trayStand: b => ({x: trays[b].x, y: home.y}),
    /** the clerk's spot in the aisle of block b (facing the file) */
    aisleStand: b => ({x: blocks[b].aisleX, y: FY, deg: b ? 90 : 270}),
  };
}

/* ------------------------------------------------------------------ */
/* Art                                                                  */
/* ------------------------------------------------------------------ */

const STEEL = '#cfd6dd', STEEL_DK = '#5d6873', BOXES = ['#d9c7a3', '#c7b28b', '#bccad6', '#d8cfbd', '#c5d0c0', '#e0d3b8'];
/** One neutral tint for both blocks (equal weight: no colour tells them apart). */
export const BLOCK_TINT = '#e8edf1';

/** Solid ● / ◆ glyph of equal ink area, centred at the origin. kind: 'active' (●) | 'archived' (◆). */
export function stateGlyph(ctx, kind, s, o = {}) {
  const fill = o.fill ?? '#1f2328';
  const sw = o.sw ?? r(s * 0.08, 2);
  if (kind === 'archived') {
    const a = s * 0.5;
    return h('path', {name: o.name, d: `M0 ${r(-a)}L${r(a)} 0L0 ${r(a)}L${r(-a)} 0Z`, fill, stroke: o.stroke ?? '#fff', 'stroke-width': sw, 'stroke-linejoin': 'round', opacity: o.opacity});
  }
  return h('circle', {name: o.name, r: r(s * 0.4), fill, stroke: o.stroke ?? '#fff', 'stroke-width': sw, opacity: o.opacity});
}

/** One mobile shelving unit seen from above (both faces with file boxes, the end panel with a handwheel and a lamp). */
function unitArt(ctx, U, key, i) {
  const x = U.x, y = U.y, w = U.w, hh = U.h;
  const endH = 32;
  const boxes = [];
  for (let face = 0; face < 2; face++) {
    const fx = x + 5 + face * (w / 2 - 1), fw = w / 2 - 9;
    let yy = y + 6, j = 0;
    while (yy < y + hh - endH - 26) {
      const bh = 18 + Math.floor(ctx.rng(`${key}-bh${face}`, i * 40 + j) * 12);
      const hgt = Math.min(bh, y + hh - endH - 6 - yy);
      boxes.push(h('rect', {x: r(fx), y: r(yy), width: r(fw), height: r(hgt), rx: 2, fill: BOXES[Math.floor(ctx.rng(`${key}-bc${face}`, i * 40 + j) * BOXES.length)], stroke: '#6b737c', 'stroke-width': 1.1}));
      yy += bh + 3;
      j++;
    }
  }
  const ex = x + w / 2, ey = y + hh - endH / 2;
  return [
    h('path', {d: roundRectPath(x + 3, y + 6, w, hh, 5), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 5), fill: STEEL, stroke: '#1f2328', 'stroke-width': 2.2}),
    h('path', {d: `M${r(x + w / 2)} ${r(y + 4)}V${r(y + hh - endH)}`, stroke: '#8a939c', 'stroke-width': 2}),
    boxes,
    h('path', {d: roundRectPath(x + 1.5, y + hh - endH, w - 3, endH - 1.5, 4), fill: STEEL_DK}),
    // handwheel
    h('circle', {cx: r(ex + (key === 'b1' ? -8 : 8)), cy: r(ey), r: 10, fill: 'none', stroke: '#e9edf1', 'stroke-width': 3}),
    h('path', {d: `M${r(ex + (key === 'b1' ? -8 : 8))} ${r(ey - 10)}V${r(ey + 10)}M${r(ex + (key === 'b1' ? -18 : -2))} ${r(ey)}H${r(ex + (key === 'b1' ? 2 : 18))}`, stroke: '#e9edf1', 'stroke-width': 2}),
  ];
}

/**
 * The plan art. Groups (named with prefix P): P-room (floor, walls, plaques),
 * P-blk0 / P-blk1 (rails, units, lamp, the shelved file's spine), P-desk
 * (counter, trays, slip), P-cable (locator link). frame(o) → node records.
 * @param {any} ctx
 * @param {any} G archGeometry()
 * @param {{prefix:string, fileBlock?:number|null}} o
 */
export function archArt(ctx, G, o) {
  const P = o.prefix;
  const th = ctx.theme;
  const c = planColors(ctx);
  const {t, RW, RH, Y0} = G;
  const fb = o.fileBlock ?? null;
  // ---- room: floor, block tints, walls with the counter hatch, the ● / ◆ plaques on the back wall
  const room = g({name: `${P}-room`},
    floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: RW, h: RH, kind: 'tiles', cell: 58}),
    G.blocks.map(B => h('rect', {x: r(B.span.x - 6), y: r(Y0 - 8), width: r(B.span.w + 12), height: r(G.UL + 16), rx: 8, fill: BLOCK_TINT, stroke: shade(BLOCK_TINT, -0.18), 'stroke-width': 2})),
    wallRing(ctx, {name: `${P}-wall`, x: 0, y: 0, w: RW, h: RH, t, gaps: [{side: 'bottom', a: G.counter.cx - G.counter.w / 2 + 6, b: G.counter.cx + G.counter.w / 2 - 6, kind: 'open'}]}),
    G.blocks.map(B => plaqueNode(ctx, B.key, B.plaque.x, B.plaque.y, `${P}-plaque${B.b}`, `${P}-mark${B.b}`)),
  );
  // ---- the locator link (a cable in the floor)
  const cable = g({name: `${P}-cable`},
    G.cable.map(pts => h('path', {d: polyline(pts).d(1), fill: 'none', stroke: '#7d8791', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})),
    h('circle', {cx: r(RW / 2), cy: r(G.cableY), r: 6, fill: '#7d8791'}),
  );
  // ---- the blocks: rails, units (u0 fixed at the wall, u1/u2 roll), lamp on u0, the shelved file spine
  const blocks = G.blocks.map(B => blockNode(ctx, G, B, P, fb === B.b));
  // ---- the counter, its trays (● / ◆ on the counter beside them) and the request slip
  const desk = deskNode(ctx, G, P);
  // ---- the pulse on the locator link
  const pulse = h('circle', {name: `${P}-pulse`, cx: r(G.cable[0][0].x), cy: r(G.cable[0][0].y), r: 9, fill: th.accent2, stroke: '#fff', 'stroke-width': 2.4, opacity: 0});
  const node = g({name: `${P}-plan`}, room, cable, blocks, desk, pulse);
  const cablePolys = G.cable.map(pts => polyline(pts));
  /**
   * @param {{open?:number[], lit?:number[], pulse?:{b:number,p:number,op:number}|null, spine?:number, off?:Object<string,{x:number,y:number}>}} s
   *   open[b] 0..1 the aisle of block b; lit[b] lamp; spine opacity of the shelved file; off: group offsets
   */
  const frame = (s = {}) => {
    const out = {};
    G.blocks.forEach(B => Object.assign(out, blockFrame(G, B, P, (s.open && s.open[B.b]) || 0, (s.lit && s.lit[B.b]) || 0)));
    if (fb !== null) out[`${P}-spine`] = {opacity: r(s.spine ?? 1, 3)};
    const pu = s.pulse;
    if (pu && pu.op > 0) {
      const q = cablePolys[pu.b].at(clamp(pu.p));
      out[`${P}-pulse`] = {cx: r(q.x), cy: r(q.y), opacity: r(pu.op, 3)};
    } else out[`${P}-pulse`] = {cx: r(G.cable[0][0].x), cy: r(G.cable[0][0].y), opacity: 0};
    const off = s.off || {};
    for (const grp of ['room', 'cable', 'blk0', 'blk1', 'desk']) {
      const q = off[grp] || {x: 0, y: 0};
      out[`${P}-${grp}`] = {transform: T(r(q.x, 2), r(q.y, 2))};
    }
    return out;
  };
  return {node, frame};
}

/**
 * One block of mobile shelving (group `${P}-blk${b}`): rails, the three units (named `${P}-u${b}${i}`; u1/u2 roll),
 * the lamp on u0 (`${P}-lit${b}` lit overlay) and, when it holds the file, the shelved file's spine (`${P}-spine`).
 */
export function blockNode(ctx, G, B, P, withSpine) {
  const th = ctx.theme;
  const {Y0, Y1} = G;
  const railY = [Y0 + 34, Y1 - 34];
  const rails = railY.map(y => h('path', {d: `M${r(B.span.x - 4)} ${r(y)}H${r(B.span.x + B.span.w + 4)}`, stroke: '#9aa3ab', 'stroke-width': 5, 'stroke-linecap': 'round'}));
  const units = B.units.map((U, i) => g({name: `${P}-u${B.b}${i}`, transform: T(0, 0)}, unitArt(ctx, U, `b${B.b}`, i)));
  const spine = withSpine ? g({name: `${P}-spine`},
    h('rect', {x: r(B.spine.x - 6), y: r(B.spine.y - FILE.w / 2), width: 12, height: r(FILE.w), rx: 2, fill: '#e2c48c', stroke: '#1f2328', 'stroke-width': 1.8}),
    h('path', {d: `M${r(B.spine.x - 6 * B.dir)} ${r(B.spine.y - 8)}h${r(10 * B.dir)}`, stroke: th.accent3, 'stroke-width': 6, 'stroke-linecap': 'round'})) : null;
  const lamp = g(null,
    h('circle', {cx: r(B.lamp.x), cy: r(B.lamp.y), r: 6.5, fill: '#2b3036', stroke: '#e9edf1', 'stroke-width': 1.6}),
    g({name: `${P}-lit${B.b}`, opacity: 0},
      h('circle', {cx: r(B.lamp.x), cy: r(B.lamp.y), r: 17, fill: 'none', stroke: th.accent2, 'stroke-width': 4}),
      h('circle', {cx: r(B.lamp.x), cy: r(B.lamp.y), r: 8, fill: th.accent2, stroke: '#fff', 'stroke-width': 1.6})));
  return g({name: `${P}-blk${B.b}`}, rails, units[0], spine, units.slice(1), lamp);
}

/** Frame records of a block: open (0..1) rolls u1/u2 by the aisle width; lit (0..1) the lamp. */
export function blockFrame(G, B, P, open, lit) {
  const out = {};
  const op = clamp(open);
  for (let i = 0; i < B.units.length; i++) out[`${P}-u${B.b}${i}`] = {transform: T(i ? r(B.dir * G.AW * op, 2) : 0, 0)};
  out[`${P}-lit${B.b}`] = {opacity: r(clamp(lit), 3)};
  return out;
}

/** The counter (group `${P}-desk`) with its two trays (● / ◆ beside them) and, unless slip = false, the request slip. */
export function deskNode(ctx, G, P, {slip = true} = {}) {
  const c = planColors(ctx);
  return g({name: `${P}-desk`},
    planTable(ctx, {name: `${P}-counter`, cx: G.counter.cx, cy: G.counter.cy, w: G.counter.w, h: G.counter.h, seedKey: `${P}-ctr`}),
    G.trays.map((Tr, i) => g(null,
      h('path', {d: roundRectPath(Tr.x - Tr.w / 2, Tr.y - Tr.h / 2, Tr.w, Tr.h, 5), fill: shade(c.wood, 0.18), stroke: '#1f2328', 'stroke-width': 2}),
      h('path', {d: roundRectPath(Tr.x - Tr.w / 2 + 6, Tr.y - Tr.h / 2 + 6, Tr.w - 12, Tr.h - 12, 3), fill: 'none', stroke: c.woodEdge, 'stroke-width': 1.8}),
      g({transform: T(i ? Tr.x + Tr.w / 2 + 15 : Tr.x - Tr.w / 2 - 15, Tr.y)}, stateGlyph(ctx, STATES[i], 20, {name: `${P}-tmark${i}`})))),
    slip ? slipNode(`${P}-slip`, G.slip.x, G.slip.y, 1) : null,
  );
}

/** The room's floor and walls only (the faint outline the mechanism's exploded plan comes out of). */
export function floorAndWalls(ctx, G, P) {
  return g(null,
    floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: G.RW, h: G.RH, kind: 'tiles', cell: 58}),
    wallRing(ctx, {name: `${P}-wall`, x: 0, y: 0, w: G.RW, h: G.RH, t: G.t, gaps: [{side: 'bottom', a: G.counter.cx - G.counter.w / 2 + 6, b: G.counter.cx + G.counter.w / 2 - 6, kind: 'open'}]}));
}

/** The request slip (paper with lines), centre (x, y), scale s. */
export function slipNode(name, x, y, s = 1) {
  const w = 38 * s, hh = 30 * s;
  return g({name},
    h('path', {d: roundRectPath(x - w / 2, y - hh / 2, w, hh, 3 * s), fill: '#fbfaf6', stroke: '#1f2328', 'stroke-width': r(1.8 * Math.sqrt(s), 2)}),
    h('path', {d: `M${r(x - 12 * s)} ${r(y - 6 * s)}h${r(24 * s)}M${r(x - 12 * s)} ${r(y + 1 * s)}h${r(18 * s)}M${r(x - 12 * s)} ${r(y + 8 * s)}h${r(21 * s)}`, stroke: '#8c959f', 'stroke-width': r(2 * Math.sqrt(s), 2), 'stroke-linecap': 'round'}));
}

/** The ● / ◆ plaque (disc with the solid glyph), centred at (x, y). */
export function plaqueNode(ctx, key, x, y, name, markName) {
  return g({name, transform: T(x, y)},
    h('circle', {r: 25, fill: '#fbf8f1', stroke: '#1f2328', 'stroke-width': 2.4}),
    stateGlyph(ctx, key, 34, {name: markName}));
}

/**
 * The locator console (mechanism): a steel desk unit with a dark screen showing two lamps (● side and ◆ side, the
 * same size) and a keypad. Centre (cx, cy), size w × h. `${name}-lit0/1` light the screen lamps.
 */
export function consoleNode(ctx, {name, cx, cy, w = 150, h: hh = 90}) {
  const th = ctx.theme;
  const x = cx - w / 2, y = cy - hh / 2;
  const keys = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) keys.push(h('rect', {x: r(x + w * 0.62 + i * w * 0.11), y: r(y + hh * 0.3 + j * hh * 0.24), width: r(w * 0.08), height: r(hh * 0.16), rx: 2, fill: '#e9edf1', stroke: '#6b737c', 'stroke-width': 1}));
  const sx = x + w * 0.08, sy = y + hh * 0.22, sw = w * 0.46, sh = hh * 0.56;
  const lampAt = i => ({x: sx + sw * (i ? 0.72 : 0.28), y: sy + sh / 2});
  return g({name},
    h('path', {d: roundRectPath(x + 4, y + 7, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: STEEL, stroke: '#1f2328', 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(sx, sy, sw, sh, 5), fill: '#2b3036', stroke: '#1f2328', 'stroke-width': 1.6}),
    [0, 1].map(i => h('circle', {cx: r(lampAt(i).x), cy: r(lampAt(i).y), r: r(hh * 0.09), fill: '#4a525a', stroke: '#e9edf1', 'stroke-width': 1.4})),
    [0, 1].map(i => h('circle', {name: `${name}-lit${i}`, cx: r(lampAt(i).x), cy: r(lampAt(i).y), r: r(hh * 0.11), fill: th.accent2, stroke: '#fff', 'stroke-width': 1.6, opacity: 0})),
    keys,
  );
}

/** Pose of the carried / placed / shelved file prop (template units). */
export function filePose(name, q, deg, sy = 1, op = 1) {
  return {[name]: {transform: `${T(r(q.x, 2), r(q.y, 2), r(deg, 2))} scale(1 ${r(sy, 3)})`, opacity: r(op, 3)}};
}

/** The clerk's look (supplied appearance wins; seeded otherwise). */
export function clerkLook(ctx, p) {
  return actorLook(ctx, p.seats.clerk, 0);
}

/* ------------------------------------------------------------------ */
/* Text: chips, legend, panel                                          */
/* ------------------------------------------------------------------ */

/**
 * A name chip: optional glyph (● / ◆ / slip) + fitted text on a card. Returns {w, h, fit, node(x, y, name)}.
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
        glyph ? g({transform: T(x + padX + gs / 2, y + hh / 2)}, chipGlyph(ctx, glyph, gs)) : null,
        textAt(fit, x + padX + (glyph ? gs + F * 0.4 : 0), y + (hh - fit.height) / 2, th.ink, {name: name && `${name}-text`}),
      );
    },
  };
}

function chipGlyph(ctx, kind, s) {
  if (kind === 'active' || kind === 'archived') return stateGlyph(ctx, kind, s);
  if (kind === 'slip') return slipGlyph(s);
  return tagGlyph(ctx, s * 0.85);
}

/** The request slip glyph (a small paper with lines), centred at the origin. */
export function slipGlyph(s) {
  const w = s * 0.8, hh = s * 0.64;
  return g(null,
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 2), fill: '#fbfaf6', stroke: '#1f2328', 'stroke-width': 1.6}),
    h('path', {d: `M${r(-w * 0.32)} ${r(-hh * 0.18)}h${r(w * 0.64)}M${r(-w * 0.32)} ${r(hh * 0.14)}h${r(w * 0.46)}`, stroke: '#8c959f', 'stroke-width': 1.6, 'stroke-linecap': 'round'}));
}

/** Legend glyphs (design units, centre at the origin). */
export function archGlyph(ctx, kind, s, o = {}) {
  const c = planColors(ctx);
  const th = ctx.theme;
  if (kind === 'active' || kind === 'archived') return stateGlyph(ctx, kind, s * 0.78);
  if (kind === 'slip') return slipGlyph(s * 0.9);
  if (kind === 'file') return g({transform: `scale(${r(s / 86, 4)})`}, stripNames(fileProp(ctx, {name: 'lg-file'})));
  if (kind === 'unit') {
    const w = s * 0.34, hh = s * 0.9;
    return g(null,
      h('path', {d: `M${r(-s * 0.46)} ${r(hh * 0.22)}H${r(s * 0.46)}M${r(-s * 0.46)} ${r(-hh * 0.22)}H${r(s * 0.46)}`, stroke: '#9aa3ab', 'stroke-width': 3.5, 'stroke-linecap': 'round'}),
      h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 3), fill: STEEL, stroke: '#1f2328', 'stroke-width': 1.8}),
      h('rect', {x: r(-w / 2 + 1), y: r(hh / 2 - hh * 0.2), width: r(w - 2), height: r(hh * 0.2 - 1), fill: STEEL_DK}));
  }
  if (kind === 'locator') {
    return g(null,
      h('path', {d: `M${r(-s * 0.44)} ${r(s * 0.2)}H${r(s * 0.1)}V${r(-s * 0.2)}H${r(s * 0.3)}`, fill: 'none', stroke: '#7d8791', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('circle', {cx: r(s * 0.3), cy: r(-s * 0.2), r: r(s * 0.12), fill: th.accent2, stroke: '#fff', 'stroke-width': 1.4}));
  }
  if (kind === 'counter') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.46, -s * 0.2, s * 0.92, s * 0.4, 4), fill: c.wood, stroke: '#1f2328', 'stroke-width': 1.8}),
      h('path', {d: roundRectPath(-s * 0.36, -s * 0.12, s * 0.28, s * 0.24, 2), fill: shade(c.wood, 0.18), stroke: '#1f2328', 'stroke-width': 1.2}),
      h('path', {d: roundRectPath(s * 0.08, -s * 0.12, s * 0.28, s * 0.24, 2), fill: shade(c.wood, 0.18), stroke: '#1f2328', 'stroke-width': 1.2}));
  }
  if (kind === 'building') {
    return g(null,
      h('rect', {x: r(-s * 0.4), y: r(-s * 0.3), width: r(s * 0.8), height: r(s * 0.62), fill: c.stone, stroke: '#1f2328', 'stroke-width': 1.8}),
      h('rect', {x: r(-s * 0.46), y: r(-s * 0.38), width: r(s * 0.92), height: r(s * 0.1), fill: c.stoneDark, stroke: '#1f2328', 'stroke-width': 1.4}),
      [-0.22, 0, 0.22].map(fx => h('rect', {x: r(s * fx - s * 0.06), y: r(-s * 0.16), width: r(s * 0.12), height: r(s * 0.14), fill: c.glass, stroke: '#1f2328', 'stroke-width': 1})),
      h('rect', {x: r(-s * 0.08), y: r(s * 0.1), width: r(s * 0.16), height: r(s * 0.22), fill: shade(c.glass, -0.12), stroke: '#1f2328', 'stroke-width': 1}));
  }
  if (kind === 'room') {
    return g(null,
      h('rect', {x: r(-s * 0.4), y: r(-s * 0.32), width: r(s * 0.8), height: r(s * 0.64), fill: '#f5efe3', stroke: '#454b53', 'stroke-width': r(s * 0.1)}),
      h('rect', {x: r(-s * 0.28), y: r(-s * 0.22), width: r(s * 0.12), height: r(s * 0.3), fill: STEEL, stroke: '#1f2328', 'stroke-width': 1}),
      h('rect', {x: r(s * 0.16), y: r(-s * 0.22), width: r(s * 0.12), height: r(s * 0.3), fill: STEEL, stroke: '#1f2328', 'stroke-width': 1}));
  }
  if (kind === 'marker') return changedMarker(ctx, {x: 0, y: 0, radius: s * 0.36});
  if (kind.startsWith('line-')) {
    const kd = kind.slice(5);
    const col = kd === 'communication' ? th.accent2 : '#1f2328';
    const a = -s * 0.44, b = s * 0.44;
    return g(null,
      h('path', {d: `M${r(a)} 0H${r(b)}`, stroke: col, 'stroke-width': kd === 'causal' ? 4.5 : 3.5, 'stroke-linecap': 'round'}),
      kd === 'sequence'
        ? [h('circle', {cx: r(a + s * 0.1), cy: 0, r: r(s * 0.13), fill: '#1f2328', stroke: '#1f2328', 'stroke-width': 2}), h('circle', {cx: r(b - s * 0.1), cy: 0, r: r(s * 0.13), fill: th.card, stroke: '#1f2328', 'stroke-width': 2})]
        : [h('circle', {cx: r(a), cy: 0, r: r(kd === 'communication' ? s * 0.1 : s * 0.08), fill: col}), h('circle', {cx: r(b), cy: 0, r: r(kd === 'communication' ? s * 0.1 : s * 0.08), fill: col})],
      kd === 'causal' ? h('path', {d: `M${r(-s * 0.08)} ${r(-s * 0.12)}L${r(s * 0.06)} 0L${r(-s * 0.08)} ${r(s * 0.12)}`, fill: 'none', stroke: col, 'stroke-width': 3}) : null);
  }
  if (kind === 'same') return h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.1)}H${r(s * 0.3)}M${r(-s * 0.3)} ${r(s * 0.1)}H${r(s * 0.3)}`, stroke: '#1f2328', 'stroke-width': r(s * 0.08, 2), 'stroke-linecap': 'round'});
  if (kind === 'sequence') {
    // two numbered steps joined by a plain line (no arrowhead: an order as configured, not a direction of authority)
    const R = s * 0.2;
    return g(null,
      h('path', {d: `M${r(-s * 0.2)} 0H${r(s * 0.2)}`, stroke: '#1f2328', 'stroke-width': 2.4}),
      [[-0.26, '1'], [0.26, '2']].map(([fx, n]) => g({transform: T(s * fx, 0)},
        h('circle', {r: r(R), fill: th.card, stroke: '#1f2328', 'stroke-width': 2}),
        h('circle', {r: r(R * 0.32), fill: n === '1' ? '#1f2328' : 'none', stroke: '#1f2328', 'stroke-width': 1.6}))));
  }
  if (kind === 'person') {
    const pp = planPerson(ctx, {name: 'lg-person', look: o.look || actorLook(ctx, {}, 0)});
    return g({transform: `scale(${r(s / 110, 4)})`}, bake(pp.node, pp.pose({x: 0, y: 6, deg: 180})));
  }
  if (kind === 'ring') return h('rect', {x: r(-s * 0.36), y: r(-s * 0.28), width: r(s * 0.72), height: r(s * 0.56), rx: 5, fill: 'none', stroke: o.color || th.accent3, 'stroke-width': 4});
  return h('circle', {r: r(s * 0.3), fill: c.frame});
}

/** A legend row: glyph + fitted text. make(w) → {h, truncated, node(x, y)}. */
export function legendItem(ctx, {kind, text, F, name, weight = 500, glyphOpts = {}, opacity, maxLines = 4}) {
  const th = ctx.theme;
  return {type: 'legend', make: w => {
    const gs = F * 1.8;
    const f = fitG(text, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines, weight});
    const hh = Math.max(gs, f.height + F * 0.25);
    return {h: hh, truncated: f.truncated, node: (x, y) => g({name, opacity},
      g({transform: T(x + gs / 2, y + hh / 2)}, archGlyph(ctx, kind, gs, glyphOpts)),
      textAt(f, x + gs + 14, y + (hh - f.height) / 2, th.fg))};
  }};
}

/** A legend row with a bold title over a caption. */
export function legendItem2(ctx, {kind, title, text, F, name, glyphOpts = {}}) {
  const th = ctx.theme;
  return {type: 'legend', make: w => {
    const gs = F * 1.8;
    const f1 = fitG(title, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines: 3, weight: 700});
    const f2 = fitG(text, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines: 3, weight: 500});
    const th2 = f1.height + F * 0.45 + f2.height;
    const hh = Math.max(gs, th2 + F * 0.25);
    return {h: hh, truncated: f1.truncated || f2.truncated, node: (x, y) => g({name},
      g({transform: T(x + gs / 2, y + Math.min(hh / 2, gs / 2 + F * 0.3))}, archGlyph(ctx, kind, gs, glyphOpts)),
      textAt(f1, x + gs + 14, y + (hh - th2) / 2, th.ink, {name: name && `${name}-title`}),
      textAt(f2, x + gs + 14, y + (hh - th2) / 2 + f1.height + F * 0.45, th.fg))};
  }};
}

/** A plain caption row (the single editorial note of a view). */
export function captionItem(ctx, text, F, name, maxLines = 6, opacity) {
  const th = ctx.theme;
  return {type: 'caption', make: w => {
    const f = fitG(text, {maxWidth: w - 8, size: F, minSize: F, maxLines, weight: 600});
    return {h: f.height + F * 0.3, truncated: f.truncated, node: (x, y) => g({name, opacity}, textAt(f, x, y + F * 0.15, th.ink))};
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

/** A state card row (bold text on a card; hidden until its beat). */
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

/** A note row keyed to a solid ring on the plan (colour square + text; hidden until its beat). */
export function noteItem(ctx, text, F, col, name) {
  const th = ctx.theme;
  return {type: 'note', make: w => {
    const f = fitG(text, {maxWidth: w - F * 1.9 - 12, size: F, minSize: F, maxLines: 4, weight: 500});
    return {h: f.height + F * 0.25, truncated: f.truncated, node: (x, y) => g({name, opacity: 0},
      h('rect', {x: r(x + 2), y: r(y + F * 0.05), width: r(F * 1.3), height: r(F * 1.0), rx: 5, fill: 'none', stroke: col, 'stroke-width': 4}),
      textAt(f, x + F * 1.9 + 12, y, th.fg))};
  }};
}

/**
 * Column (stacked) or band (2–3 balanced columns) panel of measured items.
 * Returns {problem, height, boxes, place(B), node, stateNode, cw}.
 */
export function layoutPanel(items, box, F, flow, nCols, name = 'panel') {
  const gap = F * 0.6;
  const cols = flow === 'column' ? 1 : (nCols || 2);
  const colGap = F * 1.5;
  const cw = (box.w - colGap * (cols - 1)) / cols;
  const made = items.map(it => ({it, m: it.make(cw)}));
  const problem = made.some(q => q.m.truncated) ? 'panel-trunc' : null;
  const hOf = arr => arr.reduce((a, q) => a + q.m.h, 0) + gap * Math.max(0, arr.length - 1);
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
  const out = {problem: problem || (height > box.h + 0.5 ? 'panel-height' : null), height, boxes: [], node: null, stateNode: null, cw, named: {}};
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
    out.node = g({name}, nodes);
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
 * Layout search: compose(v, A) for every text size v (px at 1080p) and arrangement A. Compositions at >= 19.8 px are
 * preferred; within them the larger scene wins (score = size(L) + 0.004 v). When none fits at >= 19.8 px, the largest
 * fitting size wins (never below 16.6 px). When nothing fits, the composition with the fewest problems is returned
 * (its problems are reported in the semantics, never hidden).
 * @param {(v:number, A:any)=>any} compose
 * @param {any[]} arrs
 * @param {(L:any)=>number} [size]
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
  out.log = log.slice(-60);
  return out;
}

/* ------------------------------------------------------------------ */
/* The plan with its chips (shared composition step)                   */
/* ------------------------------------------------------------------ */

/**
 * Map the plan into `region` (design units). Optional ● / ◆ name chips above their plaques (chips: true), and the
 * identifier chip (with a slip glyph) below the counter, led to the slip (idChip: true).
 * @returns {any} {M, k, toD, personPx, room, texts, sectionChips, idChip, idBox, problems, planBox}
 */
export function archScene(ctx, p, F, px, {G, region, rot = false, chips = true, idChip = true, P = '', kMax = 1.8, align = {x: 0.5, y: 0.5}, chipMaxLines = 3}) {
  const th = ctx.theme;
  const D = ctx.design;
  const problems = [];
  const showKey = ctx.show('key');
  const gapC = 14;
  const blockW = G.blocks[0].span.w;
  // chips measured against the scale they will get (iterate twice: the chip heights depend on k)
  let k0 = Math.min(region.w / (rot ? G.E.h : G.E.w), region.h / (rot ? G.E.w : G.E.h), kMax);
  let sc = null, ic = null, planBox = region;
  for (let it = 0; it < 2; it++) {
    const cw = rot ? Math.max(160, D.w * 0.3) : Math.max(120, blockW * k0 + 40);
    sc = showKey && chips ? [0, 1].map(b => nameChip(ctx, b ? p.courts.archived : p.courts.active, {F, maxWidth: cw, maxLines: chipMaxLines, glyph: STATES[b]})) : null;
    ic = showKey && idChip ? nameChip(ctx, p.file.identifier, {F, maxWidth: rot ? Math.max(150, D.w * 0.26) : Math.min(region.w * 0.9, 560), maxLines: rot ? 4 : 2, weight: 700, glyph: 'slip', stroke: th.accent2}) : null;
    if (!rot) {
      const top = sc ? Math.max(sc[0].h, sc[1].h) + gapC : 0;
      const bot = ic ? ic.h + gapC + 4 : 0;
      planBox = {x: region.x, y: region.y + top, w: region.w, h: region.h - top - bot};
    } else {
      // turned plan: the back wall (with the ● / ◆ plaques) on the left, the counter on the right
      const left = sc ? Math.max(sc[0].w, sc[1].w) + gapC : 0;
      const right = ic ? ic.w + gapC + 4 : 0;
      planBox = {x: region.x + left, y: region.y, w: region.w - left - right, h: region.h};
    }
    k0 = Math.min(planBox.w / (rot ? G.E.h : G.E.w), planBox.h / (rot ? G.E.w : G.E.h), kMax);
  }
  if (planBox.w <= 10 || planBox.h <= 10) problems.push('region');
  const M = mapper(G.E, planBox, rot, kMax, align);
  const k = M.k, toD = M.toD;
  const personPx = 2 * PERSON.half * k * px;
  const room = M.box(G.outer);
  const planD = M.box(G.E);
  const texts = [];
  const inD = b => b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= D.w + 0.5 && b.y + b.h <= D.h + 0.5;
  const out = {sectionNodes: [], sectionBoxes: [], idNode: null, idBox: null};
  if (sc) {
    sc.forEach((c, b) => {
      const pl = toD(G.blocks[b].plaque);
      const bx = !rot ? {x: pl.x - c.w / 2, y: planD.y - gapC - c.h, w: c.w, h: c.h} : {x: planD.x - gapC - c.w, y: pl.y - c.h / 2, w: c.w, h: c.h};
      if (c.fit.truncated) problems.push('chip-trunc');
      if (!inD(bx)) problems.push('chip-frame');
      const plq = {x: pl.x - 25 * k, y: pl.y - 25 * k, w: 50 * k, h: 50 * k};
      out.sectionNodes.push(g({name: `${P}sec-chip${b}`}, leader(bx, plq, th.ink), c.node(bx.x, bx.y, `${P}sec-name${b}`)));
      out.sectionBoxes.push(bx);
      texts.push(bx);
    });
    if (overlaps(out.sectionBoxes[0], out.sectionBoxes[1], 8)) problems.push('chip-overlap');
  }
  if (ic) {
    const sl = toD({x: G.slip.x, y: G.slip.y});
    const cbD = M.box(G.counterBox);
    const bx = !rot ? {x: sl.x - ic.w / 2, y: cbD.y + cbD.h + gapC + 4, w: ic.w, h: ic.h} : {x: cbD.x + cbD.w + gapC + 4, y: sl.y - ic.h / 2, w: ic.w, h: ic.h};
    if (ic.fit.truncated) problems.push('chip-trunc');
    if (!inD(bx)) problems.push('chip-frame');
    const slD = M.box({x: G.slip.x - G.slip.w / 2, y: G.slip.y - G.slip.h / 2, w: G.slip.w, h: G.slip.h});
    out.idNode = g({name: `${P}id-chip`}, leader(bx, {x: slD.x + slD.w / 2 - 1, y: slD.y + slD.h / 2 - 1, w: 2, h: 2}, th.accent2), ic.node(bx.x, bx.y, `${P}id-name`));
    out.idBox = bx;
    texts.push(bx);
  }
  if (!inD(planD)) problems.push('plan-frame');
  return {M, k, toD, personPx, room, planD, texts, problems, planBox, ...out};
}

/** A person's head box (design units) at plan position q (template), for a mapper M. */
export function headBox(M, q, pad = 26) {
  const d = M.toD(q);
  const rr = pad * M.k;
  return {x: d.x - rr, y: d.y - rr, w: 2 * rr, h: 2 * rr};
}

/** Walker state of the clerk for a leg at progress q (reduced motion honoured). */
export function clerkAt(leg, q, reduced) {
  return walkAt(leg, q, reduced);
}

/** Smooth a list of points into a dense polyline (Catmull-Rom). */
export const smooth = (pts, n = 12) => catmullRom(pts, n);
