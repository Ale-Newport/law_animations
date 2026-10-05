/**
 * Exploded-view props for the "Custodia del original" mechanism (LAW-0038).
 *
 *  - `obliqueBox`  the archive box in a three-quarter oblique view: front
 *    face with a label plate, right side with a hand hole, an open top that
 *    shows the dark interior and the lit inner face of the back wall, the lid
 *    standing open on its back hinge, and a dashed "slot" in the opening that
 *    marks where the original stands inside the box. Returns its drawn
 *    silhouette (`outline`) so connectors can end on the real faces.
 *  - `sealStrip`   the custody seal: a paper tape strip with torn ends and a
 *    stamped impression, drawn front-on.
 *
 * Same palette as the desk kit (custodia-del-original.js) so the treatments
 * read as one motif. Geometry only; the entry owns timeline and semantics.
 * @module animations/documents/kits/custodia-del-original-exploded
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {BOX, inkMark} from './custodia-del-original.js';

const poly = pts => `M${pts.map(q => `${r(q[0])} ${r(q[1])}`).join('L')}Z`;
const FILE_FILL = '#d9c9a6';

/**
 * Oblique OPEN archive box. Local origin = front-top-left corner of the
 * front face; depth recedes up-right. Reads as open from every cue at once:
 *  - the lid stands on its back hinge, leaning back, showing its inner face;
 *  - the top is a rim ring (wall thickness) around the opening;
 *  - through the opening: the lit inner faces of the back and left walls and
 *    the tops of the files already standing inside;
 *  - a dashed, sheet-shaped placement ghost (`${prefix}-slot`) stands in the
 *    box and rises above the rim: where the original is kept.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, d:number, label?:string, showText?:boolean, lid?:boolean, slotW?:number, slotRise?:number, plateTop?:number}} o
 */
export function obliqueBox(ctx, o) {
  const th = ctx.theme;
  const {prefix: P, w, h: hh, d} = o;
  const kx = 0.62, ky = -0.5; // screen offset per unit of depth
  const dx = d * kx, dy = d * ky;
  const showText = o.showText !== false;
  const lidOn = o.lid !== false;
  const edge = shade(BOX.outer, -0.35);
  // top-plane point (u along the width, v along the depth) → screen
  const top = (u, v) => [u + v * kx, v * ky];
  // lid: hinged on the back edge, tilted back 15° from vertical
  const tilt = 0.26;
  const lidUp = d * (Math.cos(tilt) + 0.5 * Math.sin(tilt));
  const lidBack = d * kx * Math.sin(tilt);
  const BL = top(0, d), BR = top(w, d);
  const LT = [BL[0] + lidBack, BL[1] - lidUp], RT = [BR[0] + lidBack, BR[1] - lidUp];
  const lip = 10;
  const lid = lidOn ? g(null,
    h('path', {d: poly([BL, BR, RT, LT]), fill: BOX.lidInner, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    // inner rim of the lid and its shadowed lower half near the hinge
    h('path', {d: poly([[BL[0] + 14, BL[1] - 10], [BR[0] - 12, BR[1] - 10], [RT[0] - 12, RT[1] + 14], [LT[0] + 16, LT[1] + 14]]), fill: 'none', stroke: shade(BOX.lidInner, -0.25), 'stroke-width': 2.5}),
    h('path', {d: poly([BL, BR, [BR[0] + lidBack * 0.3, BR[1] - lidUp * 0.3], [BL[0] + lidBack * 0.3, BL[1] - lidUp * 0.3]]), fill: '#1f2a36', opacity: 0.14}),
    // lid lip (thickness) along the free edge
    h('path', {d: poly([LT, RT, [RT[0] + 6, RT[1] - lip], [LT[0] + 6, LT[1] - lip]]), fill: BOX.lidRim, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    // hinge tape
    h('path', {d: poly([[BL[0] + 18, BL[1] + 3], [BR[0] - 18, BR[1] + 3], [BR[0] - 18, BR[1] - 7], [BL[0] + 18, BL[1] - 7]]), fill: shade(BOX.lid, -0.18), stroke: th.ink, 'stroke-width': 1.5}),
  ) : null;
  // rim ring: outer outline of the top and the inner opening (wall thickness t)
  const t = Math.max(9, w * 0.03);
  const outer = [top(0, 0), top(w, 0), top(w, d), top(0, d)];
  const inner = [top(t, t), top(w - t, t), top(w - t, d - t), top(t, d - t)];
  const openId = `${P}-open`;
  const [iFL, iFR, iBR, iBL] = inner;
  const down = q => [q[0], q[1] + hh];
  // inner faces seen through the opening: back wall (lit), left wall (shade)
  // files already kept in the box, standing behind the ghost (drawn back to front)
  const files = [0.86, 0.68].map((v, i) => {
    const z = t + (d - 2 * t) * v;
    const a = top(t + 6, z), b = top(w - t - 6, z);
    const drop = 14 + i * 8;
    const tabU = w * (0.14 + i * 0.52);
    const ta = top(tabU, z), tb = top(tabU + w * 0.16, z);
    return g(null,
      h('path', {d: poly([[a[0], a[1] + drop], [b[0], b[1] + drop], [b[0], b[1] + hh], [a[0], a[1] + hh]]), fill: i ? '#e9dcc0' : FILE_FILL, stroke: shade(FILE_FILL, -0.4), 'stroke-width': 1.5}),
      h('path', {d: poly([[ta[0], ta[1] + drop], [tb[0], tb[1] + drop], [tb[0] - 4, tb[1] + drop - 12], [ta[0] + 4, ta[1] + drop - 12]]), fill: i ? '#e9dcc0' : FILE_FILL, stroke: shade(FILE_FILL, -0.4), 'stroke-width': 1.5}),
    );
  });
  const interior = g({'clip-path': ctx.ref(openId)},
    h('path', {d: poly(inner), fill: '#3c4651'}),
    h('path', {d: poly([iBL, iBR, down(iBR), down(iBL)]), fill: '#a3afba'}),
    h('path', {d: poly([iFL, iBL, down(iBL), down(iFL)]), fill: BOX.wallLeft}),
    files,
    // shade cast by the front wall on everything just behind it
    h('path', {d: poly([iFL, iFR, [iFR[0], iFR[1] - 16], [iFL[0], iFL[1] - 16]]), fill: '#1f2a36', opacity: 0.28}),
  );
  const rim = h('path', {d: `${poly(outer)}${poly(inner)}`, 'fill-rule': 'evenodd', fill: BOX.rim, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'});
  // placement ghost: a sheet standing inside at mid depth, rising over the rim
  const slotW = o.slotW ?? w * 0.5;
  const rise = o.slotRise ?? hh * 0.5;
  const zs = d * 0.45;
  const s0 = top((w - slotW) / 2, zs), s1 = top((w + slotW) / 2, zs);
  const slot = {x: (s0[0] + s1[0]) / 2, y: s0[1], w: slotW, rise, top: s0[1] - rise};
  // sheet-shaped ghost (folded top-right corner) standing in the slot
  const fold = Math.min(26, slotW * 0.12);
  const gTop = s0[1] - rise;
  const ghost = g({name: `${P}-slot`, opacity: 0.4},
    h('path', {d: `M${r(s0[0])} ${r(gTop)}H${r(s1[0] - fold)}L${r(s1[0])} ${r(gTop + fold)}V${r(s1[1] + 40)}H${r(s0[0])}Z`, fill: th.accent4Soft, 'fill-opacity': 0.85, stroke: th.accent4, 'stroke-width': 3, 'stroke-dasharray': '10 7', 'stroke-linejoin': 'round'}),
    // a chevron pointing down into the box
    h('path', {d: `M${r(slot.x - 16)} ${r(slot.top + rise * 0.35)}l16 14l16 -14`, fill: 'none', stroke: th.accent4, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
  const side = g(null,
    h('path', {d: poly([[w, 0], [w + dx, dy], [w + dx, hh + dy], [w, hh]]), fill: shade(BOX.outer, -0.12), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('ellipse', {cx: w + dx / 2, cy: hh * 0.3 + dy / 2, rx: dx * 0.22, ry: hh * 0.07, fill: BOX.hole, transform: `rotate(-34 ${r(w + dx / 2)} ${r(hh * 0.3 + dy / 2)})`}),
  );
  // label plate in the lower part of the front face (the upper band stays
  // free for the relation tag where the original enters the box)
  // (`plateTop` pushes it lower still when a taller tag hangs on the rim)
  const plateW = w * 0.62;
  const plateY = Math.max(hh * 0.44, o.plateTop ?? 0);
  const plateH = Math.max(hh * 0.26, Math.min(hh * 0.4, hh - 16 - plateY));
  let plateText = null;
  if (o.label) {
    // up to three lines (no ellipsis for a long box label), shrinking to fit the plate
    const size = Math.max(22, w * 0.075);
    let f = ctx.fit(o.label, {maxWidth: plateW - 22, size: Math.min(size, (plateH - 8) / 2.5), minSize: 13, maxLines: 2, weight: 700});
    if (f.truncated) f = ctx.fit(o.label, {maxWidth: plateW - 22, size: Math.min(size, (plateH - 8) / 3.7), minSize: 11, maxLines: 3, weight: 700});
    plateText = showText
      ? textBlock(f, {x: w / 2, y: plateY + (plateH - f.height) / 2, anchor: 'middle', fill: th.ink})
      : f.lines.map((ln, k) => {
        const bw = Math.min(plateW - 26, ctx.measure(ln, f.size, 700, 'sans'));
        const y = plateY + (plateH - f.height) / 2 + k * f.lineHeight + f.size * 0.5;
        return h('line', {x1: r(w / 2 - bw / 2), x2: r(w / 2 + bw / 2), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': r(f.size * 0.5), 'stroke-linecap': 'round'});
      });
  }
  const front = g(null,
    h('rect', {x: 0, y: 0, width: w, height: hh, fill: BOX.outer, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(w / 2 - plateW / 2, plateY, plateW, plateH, 6), fill: BOX.card, stroke: th.ink, 'stroke-width': 2}),
    plateText,
    h('path', {d: `M${r(w * 0.06)} ${r(hh - 14)}H${r(w * 0.94)}`, stroke: edge, 'stroke-width': 2, opacity: 0.6}),
  );
  const shadow = h('path', {d: poly([[8, hh + 4], [w + 10, hh + 4], [w + dx + 14, hh + dy + 6], [w + dx + 14, hh + dy + 20], [w + 20, hh + 18], [12, hh + 18]]), fill: th.shadow});
  const defs = h('defs', null, h('clipPath', {id: ctx.id(openId)}, h('path', {d: poly(inner)})));
  const node = g(null, defs, shadow, lid, interior, rim, ghost, side, front);
  const lidTop = Math.min(LT[1], RT[1]) - lip;
  const minY = lidOn ? Math.min(lidTop, slot.top) : Math.min(dy, slot.top);
  const maxX = lidOn ? Math.max(w + dx, RT[0] + 6) : w + dx;
  // the box as drawn, clockwise from the front face's bottom-left corner:
  // front face, left edge of the rim, the standing lid (with its lip), the
  // right side face down to its slanted bottom edge. The bounding box leaves
  // empty space under the lid's overhang and under the side face.
  const outline = lidOn
    ? [[0, hh], [0, 0], BL, LT, [LT[0] + 6, LT[1] - lip], [RT[0] + 6, RT[1] - lip], RT, BR, [w + dx, hh + dy], [w, hh]]
    : [[0, hh], [0, 0], [dx, dy], [w + dx, dy], [w + dx, hh + dy], [w, hh]];
  return {
    node, dx, dy,
    /** local bounding box (lid and ghost included) */
    bbox: {x: 0, y: minY, w: maxX, h: hh - minY},
    /** body only (no lid) */
    body: {x: 0, y: dy, w: w + dx, h: hh - dy},
    /** local silhouette polygon [[x,y]…] of the drawn box (body and lid) */
    outline: outline.map(q => [r(q[0]), r(q[1])]),
    slot,
    /** local y of the inner front edge of the rim: a sheet standing in the
     * box is hidden below this line (behind the front wall) */
    innerFrontY: t * ky,
    /** slot depth factor and screen offset per unit of depth */
    zs, kx, ky,
  };
}

/**
 * Custody seal strip: paper tape with torn ends and a stamped impression.
 * Local origin = centre.
 */
export function sealStrip(ctx, {name, w, text, color, showText = true}) {
  const th = ctx.theme;
  const mark = inkMark(ctx, {name: `${name}-ink`, text, w: w * 0.76, color: color || th.accent, rotate: -6, showText, opacity: 1});
  // the tape grows with a long (wrapped) seal text
  const hh = Math.max(w * 0.3, mark.h + 22);
  // torn (zig-zag) ends
  const n = 8;
  let path = `M${r(-w / 2)} ${r(-hh / 2)}H${r(w / 2)}`;
  for (let i = 1; i <= n; i++) path += `L${r(w / 2 - (i % 2 ? 6 : 0))} ${r(-hh / 2 + (hh * i) / n)}`;
  path += `H${r(-w / 2)}`;
  for (let i = n - 1; i >= 0; i--) path += `L${r(-w / 2 + (i % 2 ? 6 : 0))} ${r(-hh / 2 + (hh * i) / n)}`;
  path += 'Z';
  return {
    w, h: hh,
    node: g({name},
      h('path', {d: roundRectPath(-w / 2 + 6, -hh / 2 + 8, w, hh, 3), fill: th.shadow}),
      h('path', {d: path, fill: '#f5ecd6', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-w / 2 + 10)} ${r(-hh / 2 + 7)}H${r(w / 2 - 10)}M${r(-w / 2 + 10)} ${r(hh / 2 - 7)}H${r(w / 2 - 10)}`, stroke: shade('#f5ecd6', -0.18), 'stroke-width': 2}),
      g({transform: T(0, 0)}, mark.node),
    ),
  };
}
