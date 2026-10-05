/**
 * "Inventario de objetos" motif kit (evidence-custody-05, LAW-0377..0380): motif geometry, art and solvers shared by
 * the four entries. Category art (bench, gloved arm, tag, ball chain, bag, legend, glue-aware text) comes read-only
 * from ./evidence-art.js.
 *
 * The motif — an INVENTORY STATION, distinct from the earlier evidence-custody staging (tag/chain bench, seal pouch,
 * hand-off room, photo stand):
 *  - a SOURCE BAG lying open on the bench, holding several fictional objects (key, mug, box, phone, wallet, notebook);
 *  - a moulded grey COMPARTMENT RACK: one numbered cell per object, stacked in a column; each cell carries a small
 *    manila tag hung on a short ball chain from an eyelet on its right rim;
 *  - a CLIPBOARD INVENTORY LIST whose ruled rows line up with the cells, so each cell's tag can be joined to "its" row
 *    by a short plain relation line (no arrowhead: a listing is a relation, not a cause).
 * The action: a gloved hand takes the objects out of the bag one by one and puts each into its cell; a cell whose
 * object has a supplied list entry gets its tag written and joined to the entry's row; an object without an entry
 * (as supplied) stays in its cell with a blank tag and no line. No doctrine about custody, admissibility or what a
 * missing entry means.
 *
 * Kit contents: fields and defaults, three extra object drawings, the station geometry (bag / rack / tags / sheet in
 * a box, sized by a bounded search), the station renderer (three copies of each object — in the bag, carried, placed —
 * swapped only where they coincide, so nothing teleports) and the hand-route planner.
 * @module animations/evidence-custody/kits/inventario-objetos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r, seg, ease} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {
  objectModel, objectArt, tagModel, tagArt, chainD, bagModel, bagBack, bagFront, fitG, textAt,
  INK, WRITE_INK, scribble, ecFields, pathAt, legendIcon,
} from './evidence-art.js';

/* ------------------------------------------------------------------ */
/* Fields and defaults                                                 */
/* ------------------------------------------------------------------ */

export const IO_KINDS = ['key', 'cup', 'box', 'phone', 'wallet', 'notebook'];

export const ioFields = {
  items: list('Objects taken out of the bag and put into the cells, top cell first (fictional). kind picks the drawing', obj('Object', {
    id: str('Object reference (fictional)', 24),
    label: str('Short description of the object (fictional)', 60),
    kind: oneOf('Drawn object', IO_KINDS),
  }, ['id', 'label', 'kind']), 2, 5),
  custodians: ecFields.custodians,
  timestamps: ecFields.timestamps,
  records: list('Rows of the inventory list, matched to the objects in order (row 1 = top cell). An object with no row, or a row with an empty text, has no entry (as supplied)', obj('List row', {
    field: str('Entry reference, printed on the list row and written on the cell tag', 18),
    value: str('Entry text on the list (empty = no entry, as supplied)', 60),
  }, ['field', 'value']), 1, 5),
};

export const IO_EN = {
  items: [
    {id: 'Object 1 (fictional)', label: 'Brass key from a drawer', kind: 'key'},
    {id: 'Object 2 (fictional)', label: 'Mobile phone from a coat', kind: 'phone'},
    {id: 'Object 3 (fictional)', label: 'Leather wallet from a desk', kind: 'wallet'},
  ],
  custodians: [{name: 'D. Haddad (fictional)', role: 'Person making the inventory'}],
  timestamps: [{label: 'Inventory started', time: '09:40 (illustrative)'}],
  records: [
    {field: 'No. 1', value: 'Brass key'},
    {field: 'No. 2', value: 'Mobile phone, black'},
    {field: 'No. 3', value: 'Leather wallet'},
  ],
};

export const IO_ES = {
  items: [
    {id: 'Objeto 1 (ficticio)', label: 'Llave de latón de un cajón', kind: 'key'},
    {id: 'Objeto 2 (ficticio)', label: 'Teléfono móvil de un abrigo', kind: 'phone'},
    {id: 'Objeto 3 (ficticio)', label: 'Cartera de piel de un escritorio', kind: 'wallet'},
  ],
  custodians: [{name: 'D. Haddad (ficticia)', role: 'Persona que hace el inventario'}],
  timestamps: [{label: 'Inicio del inventario', time: '09:40 (ilustrativo)'}],
  records: [
    {field: 'N.º 1', value: 'Llave de latón'},
    {field: 'N.º 2', value: 'Teléfono móvil, negro'},
    {field: 'N.º 3', value: 'Cartera de piel'},
  ],
};

export const IO_LABELS_EN = {key: 'As supplied · no conclusion drawn', noEntry: 'no list entry (as supplied)'};
export const IO_LABELS_ES = {key: 'Según lo aportado · sin conclusión', noEntry: 'sin entrada en el listado (según lo aportado)'};
export const ioLabelFields = {
  labels: obj('Editable captions', {
    key: str('Neutral key (must say that no conclusion is drawn)', 80),
    noEntry: str('Words used for an object without a list entry', 60),
  }, ['key', 'noEntry']),
};

/** Entry of item i (or null when it has none, as supplied). */
export function entryOf(P, i) {
  const rw = P.records[i];
  if (!rw || !String(rw.value || '').trim()) return null;
  return rw;
}

/* ------------------------------------------------------------------ */
/* Extra objects (phone, wallet, notebook)                             */
/* ------------------------------------------------------------------ */

/** Object size model; local origin = centre. */
export function itemModel(kind, S) {
  if (kind === 'phone') return {kind, S, w: S * 0.46, h: S * 0.8};
  if (kind === 'wallet') return {kind, S, w: S * 0.82, h: S * 0.56};
  if (kind === 'notebook') return {kind, S, w: S * 0.66, h: S * 0.82};
  return objectModel(kind, S);
}

/** Object drawing; local origin = centre. */
export function itemArt(ctx, kind, S, o = {}) {
  const sw = Math.max(2, S * 0.018);
  if (kind === 'phone') {
    const w = S * 0.46, hh = S * 0.8;
    return g({name: o.name},
      h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, S * 0.07), fill: '#2f343a', stroke: INK, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-w / 2 + S * 0.035, -hh / 2 + S * 0.08, w - S * 0.07, hh - S * 0.16, S * 0.025), fill: '#5d7f9e'}),
      h('path', {d: `M${r(-w * 0.3)} ${r(-hh * 0.28)}L${r(w * 0.2)} ${r(hh * 0.05)}`, stroke: '#fff', 'stroke-width': r(S * 0.03), opacity: 0.35, 'stroke-linecap': 'round'}),
      h('rect', {x: r(-S * 0.06), y: r(-hh / 2 + S * 0.03), width: r(S * 0.12), height: r(S * 0.022), rx: 2, fill: '#15181b'}),
      h('circle', {cx: 0, cy: r(hh / 2 - S * 0.04), r: r(S * 0.022), fill: '#15181b'}),
    );
  }
  if (kind === 'wallet') {
    const w = S * 0.82, hh = S * 0.56, c = '#7b4a2e';
    return g({name: o.name},
      h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, S * 0.06), fill: c, stroke: INK, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-w / 2 + S * 0.04, -hh / 2 + S * 0.04, w - S * 0.08, hh - S * 0.08, S * 0.04), fill: 'none', stroke: shade(c, 0.35), 'stroke-width': 1.6, 'stroke-dasharray': '5 4'}),
      h('path', {d: `M${r(w * 0.08)} ${r(-hh / 2)}V${r(hh / 2)}`, stroke: shade(c, -0.3), 'stroke-width': 2}),
      h('path', {d: roundRectPath(w * 0.18, -hh * 0.16, w * 0.32, hh * 0.32, S * 0.03), fill: shade(c, -0.15), stroke: INK, 'stroke-width': 1.6}),
      h('circle', {cx: r(w * 0.42), cy: 0, r: r(S * 0.03), fill: '#c9a54a', stroke: INK, 'stroke-width': 1.2}),
    );
  }
  if (kind === 'notebook') {
    const w = S * 0.66, hh = S * 0.82, c = '#4f6f8f';
    const rings = [];
    for (let k = 0; k < 6; k++) rings.push(h('circle', {cx: r(-w / 2 + S * 0.035), cy: r(-hh / 2 + hh * (0.12 + k * 0.152)), r: r(S * 0.028), fill: '#e8e8e8', stroke: INK, 'stroke-width': 1.3}));
    return g({name: o.name},
      h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, S * 0.04), fill: c, stroke: INK, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-w * 0.18, -hh * 0.3, w * 0.56, hh * 0.22, S * 0.02), fill: '#f4efe2', stroke: INK, 'stroke-width': 1.4}),
      h('path', {d: `M${r(-w * 0.1)} ${r(-hh * 0.22)}h${r(w * 0.38)}M${r(-w * 0.1)} ${r(-hh * 0.15)}h${r(w * 0.26)}`, stroke: '#9aa3ad', 'stroke-width': 2}),
      h('path', {d: `M${r(w * 0.32)} ${r(-hh / 2)}V${r(hh / 2)}`, stroke: '#c0504d', 'stroke-width': r(S * 0.03)}),
      rings,
    );
  }
  return objectArt(ctx, objectModel(kind, S), {name: o.name});
}

/** Legend icon for an object kind (size s, centred). */
export function itemIcon(ctx, kind, s) {
  return itemArt(ctx, kind, s * 1.05);
}

/* ------------------------------------------------------------------ */
/* Colours of the rack and clipboard                                   */
/* ------------------------------------------------------------------ */

export const RACK = '#c7ccd1';
export const RACK_DARK = '#8b939b';
export const CELL = '#e9ecee';
export const BOARD = '#a77b4f';
export const SHEET = '#fbfaf6';
export const RULE = '#c3cbd2';
export const LINK = '#4f5b66';

/* ------------------------------------------------------------------ */
/* Station geometry                                                    */
/* ------------------------------------------------------------------ */

/**
 * Pure geometry of a station for object size S (design units), relative to the station's top-left (0,0).
 * bagMode: 'left' (bag beside the rack, objects in 2 columns) or 'top' (bag above, one row of objects).
 * @param {{n:number, S:number, sheetW:number, bagMode:'left'|'top', noBag?:boolean}} o
 */
export function stationGeom(o) {
  if (o.orient === 'h') return stationGeomH(o);
  const {n, S, bagMode} = o;
  const C = S * 1.24;                // cell size
  const gC = Math.max(8, S * 0.13);  // gap between cells
  const p = Math.max(10, S * 0.12);  // rack rim
  const pitch = C + gC;
  const rackW = C + p * 2;
  const rackH = n * C + (n - 1) * gC + p * 2;
  const tagH = Math.max(30, S * 0.42);
  const tagW = Math.max(S * 0.95, tagH * 2.3, (o.tagTextW || 0) / 0.6);
  const tagZone = tagW * 0.86 + S * 0.08;
  const linkGap = Math.max(56, S * 0.62);
  const clipTop = Math.max(26, S * 0.28); // clipboard clip above the first row band
  // bag
  let bag = null, B = null, bagSlots = [];
  if (!o.noBag) {
    const cols = bagMode === 'left' ? 2 : n;
    const rowsN = Math.ceil(n / cols);
    const innerW = cols * S * 0.86 + S * 0.12;
    const innerH = (rowsN - 1) * S * 0.62 + S * 0.86;
    B = bagModel(innerW / 0.84, innerH / 0.534);
    bagSlots = Array.from({length: n}, (_, i) => {
      const cx = i % cols, cy = Math.floor(i / cols);
      return {x: B.inner.x + S * 0.06 + S * 0.43 + cx * S * 0.86 + (cy % 2 ? S * 0.1 : 0), y: B.inner.y + S * 0.43 + cy * S * 0.62};
    });
  }
  const bagGap = Math.max(30, S * 0.32);
  let rackX, rackY, bagX = 0, bagY = 0;
  if (o.noBag) { rackX = 0; rackY = clipTop; }
  else if (bagMode === 'left') {
    bagX = 0; rackX = B.w + bagGap; rackY = clipTop;
  } else {
    bagX = 0; bagY = 0; rackX = 0; rackY = B.h + bagGap + clipTop;
  }
  const cells = Array.from({length: n}, (_, i) => {
    const x = rackX + p, y = rackY + p + i * pitch;
    return {x, y, w: C, h: C, cx: x + C / 2, cy: y + C / 2, eyelet: {x: x + C + p * 0.5, y: y + C * 0.2}};
  });
  const sheetX = rackX + rackW + tagZone + linkGap;
  const sheet = {x: sheetX, y: rackY - clipTop, w: o.sheetW, h: rackH + clipTop + p * 0.4};
  const rows = cells.map(c => ({y: c.cy, top: c.y - gC / 2, h: pitch}));
  let W = sheetX + o.sheetW, H = Math.max(rackY + rackH + p * 0.4, sheet.y + sheet.h);
  if (!o.noBag && bagMode === 'left') {
    // centre the bag on the rack vertically
    bagY = Math.max(0, rackY + rackH / 2 - B.h / 2);
    H = Math.max(H, bagY + B.h);
  }
  if (!o.noBag) W = Math.max(W, bagX + B.w);
  const bagBox = o.noBag ? null : {x: bagX, y: bagY, w: B.w, h: B.h};
  const slots = bagSlots.map(sl => ({x: bagX + sl.x, y: bagY + sl.y}));
  // tag hangs from the eyelet: chain to the hole, the tag body pointing right (toward the sheet)
  const chainL = Math.max(14, S * 0.16);
  const tags = cells.map(c => ({hole: {x: c.eyelet.x + chainL * 0.9, y: c.eyelet.y + chainL * 0.44}, angle: 8}));
  return {tagTextW: o.tagTextW || 0, n, S, C, gC, p, pitch, rackW, rackH, rackX, rackY, tagH, tagW, tagZone, linkGap, clipTop, cells, sheet, rows, W, H, B, bag: bagBox, slots, tags, chainL, bagMode};
}

/** Row text of item i on the sheet ("No. 1: Brass key"), or null. */
export function rowText(P, i) {
  const rw = P.records[i];
  if (!rw) return null;
  const v = String(rw.value || '').trim();
  return v ? `${rw.field}: ${v}` : null;
}

/**
 * Fit the sheet rows for a geometry: every row text inside its band (≤ 3 lines), at size F.
 * @returns {{ok:boolean, fits:Array<any>, title:any}}
 */
/**
 * Horizontal station: the rack is one row of cells; each tag hangs below its cell and the inventory list is a ledger
 * strip below the rack whose entry slots sit directly under their cells (links run straight down). The bag lies to the
 * left. Used where the station box is wide and short (stacked contrast scenes, square / tall frames).
 * @param {{n:number, S:number, sheetTextH?:number, noBag?:boolean, tagTextW?:number}} o
 */
export function stationGeomH(o) {
  const {n, S} = o;
  const C = S * 1.12, gC = Math.max(8, S * 0.13), p = Math.max(10, S * 0.12);
  const pitch = C + gC;
  const rackW = n * C + (n - 1) * gC + p * 2, rackH = C + p * 2;
  const tagH = Math.max(30, S * 0.42);
  const tagW = Math.max(S * 0.95, tagH * 2.3, (o.tagTextW || 0) / 0.6);
  const chainL = Math.max(14, S * 0.16);
  const tagZone = chainL * 0.4 + tagH * 0.62;
  const linkGap = Math.max(16, S * 0.2) + (o.extraGap || 0);
  const clipTop = 10;
  // the bag lies in one row beside the rack (two rows from 4 objects on)
  let B = null, bagSlots = [];
  const bcols = n <= 3 ? n : Math.ceil(n / 2);
  if (!o.noBag) {
    const rowsN = Math.ceil(n / bcols);
    const innerW = bcols * S * 0.86 + S * 0.12, innerH = (rowsN - 1) * S * 0.62 + S * 0.86;
    B = bagModel(innerW / 0.84, innerH / 0.534);
    bagSlots = Array.from({length: n}, (_, i) => ({x: B.inner.x + S * 0.06 + S * 0.43 + (i % bcols) * S * 0.86 + (Math.floor(i / bcols) % 2 ? S * 0.1 : 0), y: B.inner.y + S * 0.43 + Math.floor(i / bcols) * S * 0.62}));
  }
  const bagGap = Math.max(26, S * 0.3);
  const rackX = o.noBag ? 0 : B.w + bagGap, rackY = 0;
  const cells = Array.from({length: n}, (_, i) => {
    const x = rackX + p + i * pitch, y = rackY + p;
    return {x, y, w: C, h: C, cx: x + C / 2, cy: y + C / 2, eyelet: {x: x + C * 0.16, y: y + C + p * 0.5}};
  });
  const tags = cells.map(c => ({hole: {x: c.eyelet.x + chainL * 0.25, y: c.eyelet.y + chainL * 0.4 + tagH * 0.05}, angle: 4}));
  const badgeZone = 6; // the badge sits inline, left of the entry text
  const bR = Math.max(11, S * 0.11);
  const W = rackX + rackW;
  // the ledger strip runs under the whole station (bag included), so every entry slot is wider than a cell
  const sheetY = Math.max(rackY + rackH + tagZone + linkGap, o.noBag ? 0 : B.h + bagGap * 0.6);
  const sheet = {x: 0, y: sheetY, w: W, h: clipTop + badgeZone + Math.max(o.sheetTextH || 0, bR * 2) + 14};
  const slotW = W / n;
  const rows = cells.map((c, i) => ({x: i * slotW, w: slotW, y: sheetY + clipTop + badgeZone * 0.5, top: sheetY + clipTop, h: sheet.h - clipTop, badge: {x: i * slotW + 10 + bR, y: sheetY + clipTop + badgeZone + 4 + bR}, bR, textX: i * slotW + 18 + bR * 2, textY: sheetY + clipTop + badgeZone + 4}));
  const H = sheet.y + sheet.h;
  const bagY = 0;
  return {orient: 'h', noClip: true, slotW, tagTextW: o.tagTextW || 0, n, S, C, gC, p, pitch, rackW, rackH, rackX, rackY, tagH, tagW, tagZone, linkGap, clipTop, cells, sheet, rows, W, H, B,
    bag: o.noBag ? null : {x: 0, y: bagY, w: B.w, h: B.h}, slots: bagSlots.map(sl => ({x: sl.x, y: bagY + sl.y})), tags, chainL, bagMode: 'left', tagFitsCell: tagW <= pitch * 0.96};
}

export function fitSheet(G, texts, F, title) {
  if (G.orient === 'h') {
    const tw = G.slotW - 28 - G.rows[0].bR * 2;
    let ok = tw > F * 3.2 && G.tagFitsCell;
    const fits = texts.map(t => {
      if (!t) return null;
      const f = fitG(t, {maxWidth: tw, size: F, minSize: F, maxLines: 4, weight: 500});
      if (!f.ok) ok = false;
      return f;
    });
    return {ok, fits, title: null, badge: Math.max(F * 1.4, 26), tw, textH: Math.max(0, ...fits.filter(Boolean).map(f => f.height))};
  }
  const badge = G.sheet.w * 0 + Math.max(F * 1.6, 30);
  const tw = G.sheet.w - badge - F * 1.4;
  let ok = tw > F * 4;
  const fits = texts.map(t => {
    if (!t) return null;
    const f = fitG(t, {maxWidth: tw, size: F, minSize: F, maxLines: 3, weight: 500});
    if (!f.ok || f.height > G.pitch * 0.84) ok = false;
    return f;
  });
  let tf = null;
  if (title) {
    tf = fitG(title, {maxWidth: G.sheet.w - G.sheet.w * 0.34, size: Math.min(F, G.clipTop * 0.62), minSize: Math.min(16, G.clipTop * 0.62), maxLines: 1, weight: 700});
    if (!tf.ok) tf = null; // the clip bar then carries no caption (the title is repeated in the legend)
  }
  return {ok, fits, title: tf, badge, tw};
}

/**
 * Largest station that fits a box (bounded search over S). texts: per-row strings or null.
 * @param {{w:number,h:number}} box
 * @param {{n:number, texts:(string|null)[], F:number, bagMode:'left'|'top', noBag?:boolean, title?:string, sheetFrac?:number[], tagText?:boolean}} o
 */
export function fitStation(box, o) {
  let best = null;
  for (const frac of (o.orient === 'h' ? [0] : o.sheetFrac || [0.32, 0.4, 0.48, 0.56])) {
    let hi = o.maxS ?? 260, lo = o.minS ?? 40;
    // geometry scales linearly in S except the sheet width; binary search the largest S that fits
    const tryS = S => {
      const sheetW = Math.max(box.w * frac, 0);
      const ttw = o.tagTextW ? o.tagTextW(Math.max(17, Math.min(o.F, Math.max(30, S * 0.42) * 0.5))) : 0;
      let G = stationGeom({n: o.n, S, sheetW, bagMode: o.bagMode, noBag: o.noBag, tagTextW: ttw, orient: o.orient});
      if (o.orient === 'h') {
        const SF0 = fitSheet(G, o.texts, o.F, null);
        if (!SF0.ok) return null;
        G = stationGeom({n: o.n, S, noBag: o.noBag, tagTextW: ttw, orient: 'h', sheetTextH: SF0.textH});
      }
      if (G.W > box.w + 0.5 || G.H > box.h + 0.5) return null;
      if (o.tagText && G.tagH < o.F * 1.45) return null;
      const SF = fitSheet(G, o.texts, o.F, o.title);
      if (!SF.ok) return null;
      return {G, SF};
    };
    let found = null;
    // the fit is not monotonic in S (narrow slots wrap text into more lines), so scan down from an upper bound
    // instead of bisecting: the first size that fits is the largest
    for (let S = Math.min(hi, Math.max(box.w, box.h) / 1.4); S >= lo; S *= 0.965) {
      const res = tryS(S);
      if (res) { found = res; break; }
    }
    if (!found) { const res = tryS(lo); if (res) found = res; }
    if (found) {
      // give the sheet the width left over (bounded), so rows wrap less and the station spans its box
      const G0 = found.G;
      const extra = box.w - G0.W;
      if (extra > 4 && !o.noExpand && o.orient !== 'h') {
        const sheetW = Math.min(G0.sheet.w + extra, Math.max(G0.sheet.w, G0.S * 4.2));
        const G = stationGeom({n: o.n, S: G0.S, sheetW, bagMode: o.bagMode, noBag: o.noBag, tagTextW: G0.tagTextW});
        const SF = fitSheet(G, o.texts, o.F, o.title);
        if (SF.ok && G.W <= box.w + 0.5) found = {G, SF};
      }
    }
    if (found && o.orient === 'h' && box.h - found.G.H > 8) {
      const G0 = found.G;
      const G = stationGeom({n: o.n, S: G0.S, noBag: o.noBag, tagTextW: G0.tagTextW, orient: 'h', sheetTextH: found.SF.textH, extraGap: Math.min(G0.S * 1.2, (box.h - G0.H) * 0.8)});
      if (G.H <= box.h + 0.5) found = {G, SF: found.SF};
    }
    if (found && (!best || found.G.S > best.G.S)) best = found;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Station renderer                                                    */
/* ------------------------------------------------------------------ */

/**
 * Nodes of a station (design units, drawn at offset ox/oy). Layers are returned separately so an entry can put the
 * arm between them: under (rack, cells, sheet, bag back, objects in the bag, bag front, placed objects, tags, links),
 * carried (objects held by the hand) and a sheet text layer.
 * @param {any} ctx
 * @param {ReturnType<typeof stationGeom>} G
 * @param {{prefix:string, ox:number, oy:number, kinds:string[], SF:any, rowsLinked:boolean[], tagTexts:(string|null)[], tagFits?:any[], showText:boolean, noBag?:boolean, tagWritable?:boolean[]}} o
 */
const N0badge = (o, G) => Math.min(o.SF.badge * 0.42, G.pitch * 0.2);

export function stationNodes(ctx, G, o) {
  const P = o.prefix;
  const th = ctx.theme;
  const S = G.S;
  const X = v => o.ox + v, Y = v => o.oy + v;
  // rack
  const rackParts = [
    h('path', {d: roundRectPath(X(G.rackX) + 6, Y(G.rackY) + 9, G.rackW, G.rackH, G.p * 1.2), fill: '#000', opacity: 0.18}),
    h('path', {d: roundRectPath(X(G.rackX), Y(G.rackY), G.rackW, G.rackH, G.p * 1.2), fill: RACK, stroke: INK, 'stroke-width': 2.4}),
  ];
  G.cells.forEach((c, i) => {
    rackParts.push(h('path', {d: roundRectPath(X(c.x), Y(c.y), c.w, c.h, G.p * 0.7), fill: CELL, stroke: RACK_DARK, 'stroke-width': 2}));
    rackParts.push(h('path', {d: `M${r(X(c.x) + 6)} ${r(Y(c.y) + 5)}H${r(X(c.x + c.w) - 6)}`, stroke: shade(CELL, -0.18), 'stroke-width': r(Math.max(3, S * 0.04))}));
    rackParts.push(h('circle', {cx: r(X(c.eyelet.x)), cy: r(Y(c.eyelet.y)), r: r(Math.max(5, S * 0.05)), fill: '#9ea5ab', stroke: INK, 'stroke-width': 1.6}));
    // moulded cell number: pips (no text) so the cell order reads with labels hidden
    for (let k = 0; k <= i; k++) rackParts.push(h('circle', {cx: r(X(c.x) + G.p * 0.15 + 9 + k * 11), cy: r(Y(c.y + c.h) - 10), r: 3.4, fill: RACK_DARK}));
  });
  // sheet (clipboard)
  const sh = G.sheet;
  const sheetParts = [
    h('path', {d: roundRectPath(X(sh.x) + 7, Y(sh.y) + 10, sh.w, sh.h, 12), fill: '#000', opacity: 0.16}),
    h('path', {d: roundRectPath(X(sh.x), Y(sh.y), sh.w, sh.h, 12), fill: BOARD, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(X(sh.x) + 8, Y(sh.y) + G.clipTop * 0.55, sh.w - 16, sh.h - G.clipTop * 0.55 - 8, 6), fill: SHEET, stroke: shade(SHEET, -0.25), 'stroke-width': 1.5}),
    G.noClip ? null : h('path', {d: roundRectPath(X(sh.x + sh.w * 0.3), Y(sh.y) - 4, sh.w * 0.4, G.clipTop * 0.8, 8), fill: '#9ea5ab', stroke: INK, 'stroke-width': 2}),
  ];
  const badgeR = N0badge(o, G);
  const rowNodes = [];
  G.rows.forEach((rw, i) => {
    if (G.orient === 'h') {
      if (i < G.n - 1) sheetParts.push(h('line', {x1: r(X(rw.x + rw.w)), x2: r(X(rw.x + rw.w)), y1: r(Y(rw.top) + 6), y2: r(Y(sh.y + sh.h) - 14), stroke: RULE, 'stroke-width': 2}));
      const fitH = o.SF.fits[i];
      const partsH = [];
      const bxh = X(rw.badge.x), byh = Y(rw.badge.y);
      if (fitH) {
        partsH.push(h('circle', {cx: r(bxh), cy: r(byh), r: r(rw.bR), fill: '#fff', stroke: LINK, 'stroke-width': 2.4}));
        partsH.push(h('circle', {cx: r(bxh), cy: r(byh), r: r(rw.bR * 0.38), fill: LINK}));
        const tx = X(rw.textX);
        if (o.showText) partsH.push(textAt(fitH, {x: tx, y: Y(rw.textY), fill: INK}));
        else fitH.lines.forEach((_, k) => partsH.push(h('path', {d: scribble(ctx, `${P}-row${i}-${k}`, tx, tx + Math.min(o.SF.tw, fitH.width) * (k === fitH.lines.length - 1 ? 0.8 : 1), Y(rw.textY) + fitH.size * 0.62 + k * fitH.lineHeight, fitH.size * 0.32), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'})));
      }
      rowNodes.push(g({name: `${P}-row${i}`}, partsH));
      return;
    }
    const y0 = Y(rw.top + rw.h);
    if (i < G.n - 1) sheetParts.push(h('line', {x1: r(X(sh.x) + 18), x2: r(X(sh.x + sh.w) - 18), y1: r(y0), y2: r(y0), stroke: RULE, 'stroke-width': 2}));
    const bx = X(sh.x) + 14 + badgeR, by = Y(rw.y);
    const fit = o.SF.fits[i];
    const parts = [];
    if (fit) {
      parts.push(h('circle', {cx: r(bx), cy: r(by), r: r(badgeR), fill: '#fff', stroke: LINK, 'stroke-width': 2.4}));
      parts.push(h('circle', {cx: r(bx), cy: r(by), r: r(badgeR * 0.38), fill: LINK}));
      const tx = X(sh.x) + 14 + badgeR * 2 + o.SF.badge * 0.3;
      if (o.showText) parts.push(textAt(fit, {x: tx, y: by - fit.height / 2, fill: INK}));
      else {
        const lines = fit.lines.length;
        for (let k = 0; k < lines; k++) {
          const yy = by - fit.height / 2 + fit.size * 0.62 + k * fit.lineHeight;
          parts.push(h('path', {d: scribble(ctx, `${P}-row${i}-${k}`, tx, tx + Math.min(o.SF.tw, fit.width) * (k === lines - 1 ? 0.8 : 1), yy, fit.size * 0.32), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
        }
      }
    }
    rowNodes.push(g({name: `${P}-row${i}`}, parts));
  });
  if (o.SF.title && o.showText) sheetParts.push(textAt(o.SF.title, {x: X(sh.x) + 16, y: Y(sh.y) + G.clipTop * 0.62 + 6, fill: INK}));
  // bag
  let bagB = null, bagF = null;
  if (!o.noBag && G.B) {
    bagB = g({transform: T(X(G.bag.x), Y(G.bag.y))}, bagBack(ctx, G.B, {}));
    bagF = g({name: `${P}-bagfront`, transform: T(X(G.bag.x), Y(G.bag.y))}, bagFront(ctx, G.B, {}));
  }
  // objects: three copies each
  const inBag = [], placed = [], carried = [];
  o.kinds.forEach((kind, i) => {
    if (!o.noBag) inBag.push(g({name: `${P}-ib${i}`, transform: T(X(G.slots[i].x), Y(G.slots[i].y), -12 + (i % 3) * 11)}, itemArt(ctx, kind, S)));
    placed.push(g({name: `${P}-pl${i}`, transform: T(X(G.cells[i].cx), Y(G.cells[i].cy)), opacity: 0}, h('ellipse', {cx: 5, cy: 7, rx: r(S * 0.42), ry: r(S * 0.3), fill: '#000', opacity: 0.12}), itemArt(ctx, kind, S)));
    carried.push(g({name: `${P}-ca${i}`, opacity: 0}, h('ellipse', {cx: 14, cy: 20, rx: r(S * 0.4), ry: r(S * 0.28), fill: '#000', opacity: 0.16}), itemArt(ctx, kind, S)));
  });
  // tags on chains
  const TG = tagModel({w: G.tagW, h: G.tagH, rows: 1});
  const tags = [];
  G.cells.forEach((c, i) => {
    const t = G.tags[i];
    const bw = Math.max(4, S * 0.045);
    const cd = chainD({x: X(c.eyelet.x), y: Y(c.eyelet.y)}, {x: X(t.hole.x), y: Y(t.hole.y)}, 3);
    const chain = g(null,
      h('path', {d: cd, fill: 'none', stroke: '#5d656c', 'stroke-width': r(bw * 0.3, 2), 'stroke-linecap': 'round'}),
      h('path', {d: cd, fill: 'none', stroke: '#9ea5ab', 'stroke-width': bw, 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.35, 2)}`}));
    const tf = o.tagFits && o.tagFits[i];
    const body = tagArt(ctx, TG, {prefix: `${P}-tg${i}`, rows: [{filled: false, len: 0.85}], seedKey: `${P}-tag${i}`, writable: !tf && (o.tagWritable ? o.tagWritable[i] : true)});
    const txt = tf && o.showText ? g({name: `${P}-tt${i}`, opacity: 0}, textAt(tf, {x: TG.rx0 + 2, y: -tf.height / 2 + 1, fill: WRITE_INK})) : g({name: `${P}-tt${i}`, opacity: 0});
    tags.push(g(null, chain, g({transform: T(X(t.hole.x), Y(t.hole.y), t.angle)}, body, txt)));
  });
  // links: tag tip -> row badge (plain relation, no arrowhead)
  const links = G.cells.map((c, i) => {
    const t = G.tags[i];
    const a = (t.angle * Math.PI) / 180;
    const tip = {x: X(t.hole.x) + Math.cos(a) * (TG.x1 + 4), y: Y(t.hole.y) + Math.sin(a) * (TG.x1 + 4)};
    if (G.orient === 'h') {
      const from = {x: X(t.hole.x) + TG.w * 0.45, y: Y(t.hole.y) + G.tagH * 0.52};
      return linkLine(`${P}-ln${i}`, from, {x: X(G.rows[i].badge.x), y: Y(G.rows[i].badge.y) - G.rows[i].bR}, Math.max(4, S * 0.045), true);
    }
    const bx = X(sh.x) + 14, by = Y(G.rows[i].y);
    return linkLine(`${P}-ln${i}`, tip, {x: bx, y: by}, Math.max(4, S * 0.045));
  });
  return {
    rack: g({name: `${P}-rack`}, rackParts),
    sheet: g({name: `${P}-sheet`}, sheetParts, rowNodes),
    bagBack: bagB, bagFront: bagF,
    inBag: g(null, inBag), placed: g(null, placed), carried: g(null, carried),
    tags: g(null, tags), links: g(null, links.map(l => l.node)),
    linkC: links, TG, badgeR, hasW: G.cells.map((c, i) => !(o.tagFits && o.tagFits[i]) && (o.tagWritable ? o.tagWritable[i] : true)),
  };
}

/**
 * Frame props of a station. st: per item {state:'bag'|'carried'|'placed', pos?:{x,y}, angle?:number, link:number,
 * write:number, row:number}. Every animated attribute is emitted every frame.
 */
export function stationProps(G, N, o, st) {
  const P = o.prefix;
  const out = {};
  st.forEach((s, i) => {
    if (!o.noBag) out[`${P}-ib${i}`] = {opacity: s.state === 'bag' ? 1 : 0};
    out[`${P}-pl${i}`] = {opacity: s.state === 'placed' ? 1 : 0};
    const pos = s.pos || {x: o.ox + G.cells[i].cx, y: o.oy + G.cells[i].cy};
    if (!o.noCarry) out[`${P}-ca${i}`] = {opacity: s.state === 'carried' ? 1 : 0, transform: T(pos.x, pos.y, s.angle || 0)};
    Object.assign(out, N.linkC[i].frame(clamp(s.link), s.link > 0 ? 1 : 0));
    if (N.hasW[i]) out[`${P}-tg${i}-w0`] = {'stroke-dashoffset': r(100 * (1 - clamp(s.write)), 2)};
    out[`${P}-tt${i}`] = {opacity: r(clamp(s.write * 1.6 - 0.6), 3)};
    out[`${P}-row${i}`] = {opacity: r(clamp(s.row ?? 1), 3)};
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Hand route                                                          */
/* ------------------------------------------------------------------ */

/**
 * Per-item windows inside [a, b] (fractions of u) for n items: reach the bag, grip, carry, lower/release.
 * Returns {items:[{reach:[..], carry:[..], release:[..], link:[..]}], back:[..]}.
 */
export function itemWindows(n, a, b, backLen = 0.05, weights = null) {
  // the first object gets a longer slot: its reach starts from the hand's rest at the bench edge (the longest move)
  const wts = weights || Array.from({length: n}, (_, i) => (i === 0 ? 1.35 : 1));
  const unit = (b - a - backLen) / wts.reduce((x, y) => x + y, 0);
  const items = [];
  let acc = a;
  for (let i = 0; i < n; i++) {
    const s0 = acc;
    const span = unit * wts[i];
    acc += span;
    items.push({
      reach: [s0, s0 + span * (i === 0 ? 0.48 : 0.4)],
      grip: [s0 + span * (i === 0 ? 0.48 : 0.4), s0 + span * (i === 0 ? 0.52 : 0.45)],
      carry: [s0 + span * (i === 0 ? 0.52 : 0.45), s0 + span * 0.86],
      release: [s0 + span * 0.86, s0 + span * 0.93],
      link: [s0 + span * 0.9, s0 + span * 1.25],
      write: [s0 + span * 0.93, s0 + span * 1.2],
    });
  }
  return {items, back: [b - backLen, b], span: unit};
}

/**
 * Hand position and item states at u. W from itemWindows; slots/cells in world units; rest = hand rest point.
 * doPlace: number of items actually moved (finalState); doLink: whether linked rows are joined.
 * capU: actionProgress cap (u is clamped before calling).
 */
export function routeAt(W, o, u) {
  const {slots, cells, rest, n} = o;
  const lift = o.S * 0.1;
  const keys = [[0, rest]];
  const moved = o.doPlace;
  for (let i = 0; i < moved; i++) {
    const w = W.items[i];
    keys.push([w.reach[0], i === 0 ? rest : cells[i - 1]]);
    keys.push([w.reach[1], slots[i]]);
    keys.push([w.grip[1], {x: slots[i].x, y: slots[i].y - lift}]);
    keys.push([w.carry[1], {x: cells[i].x, y: cells[i].y - lift}]);
    keys.push([w.release[1], cells[i]]);
  }
  if (moved > 0) { keys.push([W.back[0], cells[moved - 1]]); keys.push([W.back[1], rest]); }
  const hand = pathAt(keys, u);
  const items = [];
  let holding = -1;
  for (let i = 0; i < n; i++) {
    const w = W.items[i];
    if (i >= moved || u < w.grip[0]) { items.push({state: 'bag', link: 0, write: 0}); continue; }
    if (u < w.release[1]) {
      holding = i;
      // grip phase: object rises with the hand; carried copy sits exactly on the hand
      items.push({state: 'carried', pos: {...hand}, angle: (-12 + (i % 3) * 11) * (1 - seg(u, w.grip[0], w.carry[1])), link: 0, write: 0});
      continue;
    }
    const linked = o.linked[i] && o.doLink;
    items.push({state: 'placed', link: linked ? ease.inOutCubic(seg(u, ...w.link)) : 0, write: linked ? seg(u, ...w.write) : 0});
  }
  return {hand, items, holding};
}

/* ------------------------------------------------------------------ */
/* Scene composer (bench with station + legend panel)                  */
/* ------------------------------------------------------------------ */

export const F_SIZES = [24, 22, 21, 20, 19.5, 18, 17, 16];

/**
 * Compose a bench holding a station plus a legend panel, choosing the arrangement and the text size that give the
 * largest objects (text below 19.5 px only when nothing else fits). Pure and bounded.
 * @param {any} ctx
 * @param {{n:number, texts:(string|null)[], title?:string, rows:(F:number)=>any[], noBag?:boolean, tagText?:boolean,
 *   benchPad?:number, opts?:any[], armRoom?:boolean}} o
 */
export function composeScene(ctx, o, panelLayoutFn) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const opts = o.opts || (shape === 'portrait'
    ? [{legend: 'below', cols: 1, bag: 'top'}, {legend: 'below', cols: 2, bag: 'top'}, {legend: 'below', cols: 1, bag: 'left'}, {legend: 'below', cols: 2, bag: 'left'}, ...(o.allowH ? [{legend: 'below', cols: 2, bag: 'left', orient: 'h'}, {legend: 'below', cols: 1, bag: 'left', orient: 'h'}] : [])]
    : shape === 'square'
      ? [{legend: 'side', pw: 0.36, bag: 'top'}, {legend: 'side', pw: 0.42, bag: 'top'}, {legend: 'below', cols: 2, bag: 'left'}, {legend: 'side', pw: 0.36, bag: 'left'}, {legend: 'below', cols: 2, bag: 'top'}, {legend: 'side', pw: 0.3, bag: 'top'}, ...(o.allowH ? [{legend: 'below', cols: 2, bag: 'left', orient: 'h'}, {legend: 'side', pw: 0.34, bag: 'left', orient: 'h'}] : [])]
      : [{legend: 'side', pw: 0.27, bag: 'left'}, {legend: 'side', pw: 0.32, bag: 'left'}, {legend: 'side', pw: 0.3, bag: 'top'}]);
  let best = null, bestScore = -1, fallback = null;
  for (const F of F_SIZES) {
    const rows = o.rows(F);
    for (const opt of opts) {
      const gap = F * 1.2;
      let bench, panel = null, PL = null;
      if (!rows.length) bench = {x: 0, y: 0, w: DW, h: DH};
      else if (opt.legend === 'below') {
        const cols = opt.cols || 1;
        const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
        const all = panelLayoutFn(ctx, rows, {w: colW, F, maxLines: 7});
        let PLs = [all];
        if (cols === 2 && rows.length > 1) {
          const half = all.h / 2;
          let idx = all.rows.findIndex(rw => rw.y + rw.h > half);
          idx = Math.max(1, Math.min(rows.length - 1, idx + 1));
          PLs = [panelLayoutFn(ctx, rows.slice(0, idx), {w: colW, F, maxLines: 7}), panelLayoutFn(ctx, rows.slice(idx), {w: colW, F, maxLines: 7})];
        }
        const ph = Math.max(...PLs.map(q => q.h));
        PL = {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW};
        bench = {x: 0, y: 0, w: DW, h: DH - ph - gap};
        panel = {x: 4, y: DH - ph};
      } else {
        const PW = DW * opt.pw;
        const one = panelLayoutFn(ctx, rows, {w: PW, F, maxLines: 7});
        PL = {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW};
        bench = {x: 0, y: 0, w: DW - PW - gap, h: DH};
        panel = {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)};
      }
      if (bench.h < 200 || bench.w < 200) continue;
      const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
      const pad = inset + (o.benchPad ?? 16);
      const box = {x: bench.x + pad, y: bench.y + pad, w: bench.w - pad * 2, h: bench.h - pad * 2 - (o.armRoom ? Math.min(60, bench.h * 0.06) : 0)};
      const st = fitStation(box, {n: o.n, texts: o.texts, F, bagMode: opt.bag, orient: opt.orient, noBag: o.noBag, title: o.title, tagText: o.tagText, noExpand: o.noExpand, sheetFrac: o.sheetFrac, minS: o.minS, maxS: o.maxS, tagTextW: o.tagTextW});
      const c = {F, opt, bench, panel, PL, st, box};
      c.ok = Boolean(st) && (!PL || PL.ok);
      c.problems = [!st && 'station-fit', PL && !PL.ok && 'panel-text'].filter(Boolean);
      if (!fallback || c.problems.length < fallback.problems.length) fallback = c;
      if (!c.ok) continue;
      const score = st.G.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
      if (score > bestScore) { best = c; bestScore = score; }
    }
  }
  const C = best || fallback;
  if (!C.st) {
    // never throw: a minimal station with its problem flagged
    const G = stationGeom({n: o.n, S: 40, sheetW: 200, bagMode: 'left', noBag: o.noBag});
    C.st = {G, SF: fitSheet(G, o.texts, C.F, null)};
  }
  const G = C.st.G;
  // centre the station in its box
  C.ox = C.box.x + (C.box.w - G.W) / 2;
  C.oy = C.box.y + (C.box.h - G.H) / 2;
  return C;
}

/** Legend panel nodes (like the category panelNode, with icons `item-<kind>` for this kit's objects). */
export function legendNodes(ctx, PL) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, PL.w, row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(PL.w), y1: r(row.y - F * 0.28), y2: r(row.y - F * 0.28), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) {
        const cy = row.y + Math.min(row.fit.height, F * 1.2) / 2;
        const icon = row.icon.startsWith('item-') ? itemIcon(ctx, row.icon.slice(5), F * 1.3) : row.icon === 'rack' ? rackIcon(F * 1.3) : row.icon === 'list' ? listIcon(F * 1.3) : legendIcon(ctx, row.icon, F * 1.3, {color: row.color, key: row.name});
        parts.push(g({transform: T(F * 0.8, cy)}, icon));
      }
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}

/** Legend icon for the rack (a two-cell tray). */
export function rackIcon(s) {
  return g(null,
    h('path', {d: roundRectPath(-s * 0.3, -s * 0.46, s * 0.6, s * 0.92, 5), fill: RACK, stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(-s * 0.22, -s * 0.38, s * 0.44, s * 0.36, 3), fill: CELL, stroke: RACK_DARK, 'stroke-width': 1.4}),
    h('path', {d: roundRectPath(-s * 0.22, s * 0.04, s * 0.44, s * 0.36, 3), fill: CELL, stroke: RACK_DARK, 'stroke-width': 1.4}),
  );
}

/** Legend icon for the clipboard list. */
export function listIcon(s) {
  return g(null,
    h('path', {d: roundRectPath(-s * 0.32, -s * 0.44, s * 0.64, s * 0.88, 4), fill: BOARD, stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(-s * 0.26), y: r(-s * 0.34), width: r(s * 0.52), height: r(s * 0.72), fill: SHEET}),
    h('path', {d: `M${r(-s * 0.18)} ${r(-s * 0.16)}h${r(s * 0.36)}M${r(-s * 0.18)} ${r(0)}h${r(s * 0.36)}M${r(-s * 0.18)} ${r(s * 0.16)}h${r(s * 0.28)}`, stroke: RULE, 'stroke-width': 2}),
  );
}

/**
 * Plain relation line (no arrowhead): a light cord with a dark outline and round end dots, drawn on with
 * stroke-dashoffset. Readable on the dark mat and on the paper sheet.
 */
export function linkLine(name, a, b, w, vertical = false) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const d = vertical ? `M${r(a.x)} ${r(a.y)}C${r(a.x)} ${r(my)} ${r(b.x)} ${r(my)} ${r(b.x)} ${r(b.y)}` : `M${r(a.x)} ${r(a.y)}C${r(mx)} ${r(a.y)} ${r(mx)} ${r(b.y)} ${r(b.x)} ${r(b.y)}`;
  const total = Math.hypot(b.x - a.x, b.y - a.y) * 1.08 + 4;
  const node = g({name},
    h('path', {name: `${name}-o`, d, fill: 'none', stroke: INK, 'stroke-width': r(w + 4, 2), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: '#f6f1e2', 'stroke-width': r(w, 2), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: r(a.x), cy: r(a.y), r: r(w * 1.1, 2), fill: LINK, stroke: INK, 'stroke-width': 1.5, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(b.x), cy: r(b.y), r: r(w * 1.1, 2), fill: LINK, stroke: INK, 'stroke-width': 1.5, opacity: 0}),
  );
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - clamp(p)));
    return {
      [name]: {opacity},
      [`${name}-o`]: {'stroke-dashoffset': off},
      [`${name}-line`]: {'stroke-dashoffset': off},
      [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
      [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
    };
  };
  return {node, frame, from: a, to: b};
}

/** Slot weights proportional to each object's hand travel (reach from the previous point + carry), bounded. */
export function travelWeights(world) {
  const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  const raw = world.slots.map((sl, i) => d(i === 0 ? world.rest : world.cells[i - 1], sl) + d(sl, world.cells[i]));
  const m = raw.reduce((x, y) => x + y, 0) / raw.length;
  return raw.map(v => clamp(v / m, 0.7, 1.8));
}
