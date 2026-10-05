/**
 * Kit for the "Hecho y regla" motif (LAW-0081..0084): geometry, field set,
 * strings and original vector parts. Each entry owns its own timeline,
 * composition and semantics; this file only draws and measures.
 *
 * Physical metaphor
 *  - FACT (hecho)      a paper index card with a pull tab. Each supplied
 *                      attribute is a row; under the card each row houses a
 *                      sliding latch BOLT that exits through the card's
 *                      facing edge.
 *  - RULE (regla)      a rigid template plate. Each supplied condition is a
 *                      row with a SOCKET cut into the facing edge; bolt i and
 *                      socket i share a tip profile (triangle, round, notched,
 *                      stepped), so the pairing reads without any label.
 *  - CONNECTOR         the bolt that spans the gap between row i of the fact
 *    (conector)        and row i of the rule. How far it travels is the
 *                      status SUPPLIED by the author, never inferred:
 *                        as-supplied → seated; the two registration halves
 *                                      (one on the bolt, one on the plate)
 *                                      close into a full target,
 *                        disputed    → stops short with a visible gap and a
 *                                      '?' disc,
 *                        pending     → stays retracted; a dashed ghost shows
 *                                      where it would go.
 *  - LUPA              a hand magnifier whose glass shows a real enlarged,
 *                      text-free copy of what lies under it.
 * Nothing here decides whether a rule applies, whether a condition is met in
 * law or what the outcome is. Texts are fictional, jurisdiction unspecified.
 * @module animations/reasoning/kits/hecho-y-regla
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, oneOf, list, obj, int} from '../../../schemas/fields.js';
import {textBlock, LINK_STYLES} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';

export const STATUSES = ['as-supplied', 'disputed', 'pending'];
export const PROFILES = ['tri', 'round', 'notch', 'step'];

/** Built-in labels (user content is never translated). */
export const HR_STRINGS = {
  en: {
    factKind: 'Fact',
    ruleKind: 'Rule · illustrative text',
    asSupplied: 'as supplied',
    disputedS: 'disputed',
    pendingS: 'pending',
    unpaired: 'no counterpart supplied',
    aligned: 'Attributes aligned as supplied',
    awaiting: 'Alignment pending — as supplied',
    noConclusion: 'no conclusion drawn',
    issue: 'Issue',
    assumed: 'Assumed',
    attribute: 'Attribute',
    condition: 'Condition',
    connector: 'Connector',
    lupa: 'Magnifier',
    analyst: 'Analyst',
    seated: 'seated',
    stopsShort: 'stops short',
    retracted: 'retracted',
    changedDetail: 'Changed detail',
  },
  es: {
    factKind: 'Hecho',
    ruleKind: 'Regla · texto ilustrativo',
    asSupplied: 'según lo aportado',
    disputedS: 'discutido',
    pendingS: 'pendiente',
    unpaired: 'sin contraparte aportada',
    aligned: 'Atributos alineados según lo aportado',
    awaiting: 'Alineación pendiente — según lo aportado',
    noConclusion: 'sin conclusión',
    issue: 'Cuestión',
    assumed: 'Se asume',
    attribute: 'Atributo',
    condition: 'Condición',
    connector: 'Conector',
    lupa: 'Lupa',
    analyst: 'Analista',
    seated: 'encajado',
    stopsShort: 'se detiene antes',
    retracted: 'retraído',
    changedDetail: 'Detalle cambiado',
  },
};

/* ------------------------------------------------------------------------ */
/* Category field set (reasoning): facts, rules, issues, assumptions        */
/* ------------------------------------------------------------------------ */

export const attributeField = obj('Attribute', {
  text: str('Attribute text printed on the fact card (fictional)', 90),
  status: oneOf('Status SUPPLIED by the author for how this attribute lines up with its condition: as-supplied (bolt seated), disputed (stops short, marked ?), pending (stays retracted). Descriptive only — never a legal finding', STATUSES),
}, ['text', 'status']);

export const hrFields = {
  facts: obj('The fact card: a title and its attributes, in order (attribute i faces rule condition i). Fictional, as supplied', {
    title: str('Title printed on the fact card', 70),
    attributes: list('Attributes of the fact (2–4)', attributeField, 2, 4),
  }, ['title', 'attributes']),
  rules: obj('The rule template: a title and its conditions, in order. Illustrative text supplied by the author; not a statement of any law', {
    title: str('Title printed on the rule plate', 70),
    conditions: list('Conditions printed on the plate (2–4); condition i faces attribute i', str('Condition text', 90), 2, 4),
  }, ['title', 'conditions']),
  issues: list('Open questions attached to an attribute (shown as callouts at its joint; never answered)', obj('Issue', {
    attribute: int('Zero-based attribute index', 0, 3),
    text: str('Question text', 90),
  }, ['attribute', 'text']), 0, 2),
  assumptions: list('Working assumptions supplied by the author, printed on the connector supports (not verified)', str('Assumption', 60), 0, 2),
};

/** Fictional default content shared by the four entries (each entry may vary it). */
export const DEFAULT_CONTENT = {
  facts: {
    title: 'Incident at Plot 12 (fictional)',
    attributes: [
      {text: 'Wheelbarrow left on the main path', status: 'as-supplied'},
      {text: 'It belongs to the Plot 12 holder', status: 'as-supplied'},
      {text: 'Seen there at 21:40', status: 'disputed'},
    ],
  },
  rules: {
    title: 'Garden rule 4 (fictional text)',
    conditions: ['An object is left on a shared path', 'by a plot holder', 'after the garden has closed'],
  },
  issues: [{attribute: 2, text: 'When did the garden close that evening?'}],
  assumptions: ['The main path counts as shared'],
};

/**
 * Rows of the assembly. Row i pairs attribute i with condition i; a row with
 * only one side keeps its bolt retracted / socket empty ("unpaired").
 * @param {{facts:any, rules:any}} p
 * @param {Record<number,string>} [statusOverride] per-row status override (entry-controlled)
 */
export function resolveRows(p, statusOverride = {}) {
  const A = p.facts.attributes;
  const C = p.rules.conditions;
  const n = Math.max(A.length, C.length);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const attr = A[i] || null;
    const cond = C[i] ?? null;
    const status = attr && cond !== null ? (statusOverride[i] ?? attr.status) : 'unpaired';
    rows.push({i, attr, cond, status, profile: PROFILES[i % PROFILES.length]});
  }
  return rows;
}

/** First disputed row, else first pending, else the last paired row. */
export function focusRowOf(rows) {
  const d = rows.find(rw => rw.status === 'disputed');
  if (d) return d.i;
  const pd = rows.find(rw => rw.status === 'pending');
  if (pd) return pd.i;
  const paired = rows.filter(rw => rw.status !== 'unpaired');
  return paired.length ? paired[paired.length - 1].i : 0;
}

/* ------------------------------------------------------------------------ */
/* Geometry                                                                 */
/* ------------------------------------------------------------------------ */

function headerFits(ctx, text, kind, width, s, show) {
  if (!show) return {kind: null, title: null, h: s * 2.3};
  const kf = ctx.fit(kind.toUpperCase(), {maxWidth: width, size: s * 0.66, minSize: 13, maxLines: 1, weight: 800});
  const tf = text ? ctx.fit(text, {maxWidth: width, size: s * 0.98, minSize: s * 0.74, maxLines: 2, weight: 700}) : null;
  return {kind: kf, title: tf, h: s * 0.5 + kf.height + (tf ? s * 0.42 + tf.height : 0) + s * 0.55};
}

/**
 * Geometry of a DOCKED assembly in world design units.
 *  axis 'x': fact card on the left, rule plate on the right, bolts travel +x.
 *  axis 'y': fact card below, rule plate above, bolts travel −y (rows become columns).
 * @param {any} ctx
 * @param {{axis:'x'|'y', x:number, y:number, rows:any[], size:number, maxLines?:number, show:boolean,
 *   kinds:{fact:string, rule:string}, titles:{fact:string, rule:string},
 *   cardW?:number, plateW?:number, width?:number, G?:number, D?:number, minP?:number,
 *   alt?:{i:number, side:'attr'|'cond', text:string}}} o
 */
export function assemblyGeometry(ctx, o) {
  const s = o.size;
  const rows = o.rows;
  const n = rows.length;
  const G = o.G ?? s * 3;
  const D = o.D ?? s * 1.2;
  const badge = s * 1.1;
  const show = o.show;
  const maxLines = o.maxLines ?? (o.axis === 'x' ? 3 : 8);
  // narrow columns: shrink a row's text so its longest word fits whole (no mid-word breaks)
  const wordSafe = (text, w) => {
    const longest = Math.max(...String(text).split(/\s+/).map(wd => ctx.measure(wd, s, 500, 'sans')));
    return longest > w ? Math.max(s * 0.7, s * (w / longest) * 0.98) : s;
  };
  const fitRow = (text, w) => {
    if (!show || text === null || text === undefined || text === '') return null;
    const sz = wordSafe(text, w);
    return ctx.fit(text, {maxWidth: w, size: sz, minSize: Math.min(sz, s * 0.78), maxLines, weight: 500});
  };
  const altFit = (i, side, w) => (o.alt && o.alt.i === i && o.alt.side === side ? fitRow(o.alt.text, w) : null);
  const hgt = f => (f ? f.height : 0);
  let geo;
  if (o.axis === 'x') {
    const CW = o.cardW, PW = o.plateW;
    const padX = s * 0.6;
    const wA = CW - padX * 2 - badge - s * 0.45;
    const wC = PW - D - padX * 2 - badge - s * 0.45;
    const fits = rows.map(rw => ({a: rw.attr ? fitRow(rw.attr.text, wA) : null, c: fitRow(rw.cond, wC), aAlt: altFit(rw.i, 'attr', wA), cAlt: altFit(rw.i, 'cond', wC)}));
    const hc = headerFits(ctx, o.titles.fact, o.kinds.fact, CW - padX * 2, s, show);
    const hp = headerFits(ctx, o.titles.rule, o.kinds.rule, PW - padX * 2, s, show);
    const HB = Math.max(hc.h, hp.h);
    const padY = s * 0.5;
    let P = o.minP ?? s * 2.7;
    for (const f of fits) P = Math.max(P, Math.max(hgt(f.a), hgt(f.c), hgt(f.aAlt), hgt(f.cAlt), badge) + padY * 2);
    const FB = s * 0.75;
    const Ht = HB + P * n + FB;
    const card = {x: o.x, y: o.y, w: CW, h: Ht};
    const plate = {x: o.x + CW + G, y: o.y, w: PW, h: Ht};
    const cells = rows.map((rw, i) => {
      const cy = o.y + HB + P * (i + 0.5);
      return {
        i, cy,
        cardRow: {x: card.x, y: o.y + HB + P * i, w: CW, h: P},
        plateRow: {x: plate.x, y: o.y + HB + P * i, w: PW, h: P},
        badgeA: {x: card.x + padX, y: cy - badge / 2, w: badge, h: badge},
        badgeC: {x: plate.x + D + padX, y: cy - badge / 2, w: badge, h: badge},
        attrAt: {x: card.x + padX + badge + s * 0.45, cy, w: wA},
        condAt: {x: plate.x + D + padX + badge + s * 0.45, cy, w: wC},
        port: {x: card.x + CW, y: cy},
        sock: {x: plate.x, y: cy},
      };
    });
    const tab = {x: card.x - s * 1.25, y: card.y + Ht * 0.5 - s * 1.5, w: s * 1.25 + 14, h: s * 3};
    geo = {
      axis: 'x', dir: {x: 1, y: 0}, angle: 0, card, plate, HB, HBc: HB, HBp: HB, P, fits, hc, hp, cells, tab,
      grip: {x: tab.x + s * 0.55, y: tab.y + tab.h / 2},
      cardHeader: {x: card.x, y: card.y, w: CW, h: HB}, plateHeader: {x: plate.x, y: plate.y, w: PW, h: HB},
      headerTextW: {fact: CW - padX * 2, rule: PW - padX * 2}, padX,
    };
  } else {
    const W = o.width;
    const sp = s * 0.45;
    const P = (W - sp * 2) / n;
    const padX = s * 0.36;
    const cw = P - padX * 2;
    const fits = rows.map(rw => ({a: rw.attr ? fitRow(rw.attr.text, cw) : null, c: fitRow(rw.cond, cw), aAlt: altFit(rw.i, 'attr', cw), cAlt: altFit(rw.i, 'cond', cw)}));
    const hc = headerFits(ctx, o.titles.fact, o.kinds.fact, W - s * 1.2, s, show);
    const hp = headerFits(ctx, o.titles.rule, o.kinds.rule, W - s * 1.2, s, show);
    const minText = s * 2.4;
    const tA = Math.max(minText, ...fits.map(f => Math.max(hgt(f.a), hgt(f.aAlt))));
    const tC = Math.max(minText, ...fits.map(f => Math.max(hgt(f.c), hgt(f.cAlt))));
    const padY = s * 0.5;
    const plateH = hp.h + padY + badge + s * 0.35 + tC + padY + D + s * 0.35;
    const cardH = hc.h + padY + badge + s * 0.35 + tA + padY + s * 0.55;
    const plate = {x: o.x, y: o.y, w: W, h: plateH};
    const card = {x: o.x, y: o.y + plateH + G, w: W, h: cardH};
    const cells = rows.map((rw, i) => {
      const cx0 = o.x + sp + P * i;
      const cx = cx0 + P / 2;
      const aTop = card.y + hc.h + padY;
      const cTop = plate.y + hp.h + padY;
      return {
        i, cx,
        cardRow: {x: cx0, y: card.y + hc.h, w: P, h: cardH - hc.h},
        plateRow: {x: cx0, y: plate.y + hp.h, w: P, h: plateH - hp.h},
        badgeA: {x: cx0 + padX, y: aTop, w: badge, h: badge},
        badgeC: {x: cx0 + padX, y: cTop, w: badge, h: badge},
        attrAt: {x: cx0 + padX, top: aTop + badge + s * 0.35, w: cw},
        condAt: {x: cx0 + padX, top: cTop + badge + s * 0.35, w: cw},
        port: {x: cx, y: card.y},
        sock: {x: cx, y: plate.y + plateH},
      };
    });
    const tab = {x: card.x + W / 2 - s * 1.5, y: card.y + cardH - 14, w: s * 3, h: s * 1.25 + 14};
    geo = {
      axis: 'y', dir: {x: 0, y: -1}, angle: -90, card, plate, HBc: hc.h, HBp: hp.h, P, fits, hc, hp, cells, tab,
      grip: {x: tab.x + tab.w / 2, y: tab.y + tab.h - s * 0.55},
      cardHeader: {x: card.x, y: card.y, w: W, h: hc.h}, plateHeader: {x: plate.x, y: plate.y, w: W, h: hp.h},
      headerTextW: {fact: W - s * 1.2, rule: W - s * 1.2}, padX: s * 0.6,
    };
  }
  const BW = Math.min(s * 1.45, geo.axis === 'x' ? geo.P * 0.46 : geo.P * 0.3);
  Object.assign(geo, {size: s, G, D, BW, BL: G + D + s * 1.1, show, rows, n, badge, maxLines});
  geo.travel = {seated: G + D + 4, disputed: 4 + G * 0.6, pending: 0, unpaired: 0, 'as-supplied': G + D + 4};
  geo.bbox = unionRect([geo.card, geo.plate, geo.tab]);
  return geo;
}

/** Travel (design units) of a row's bolt for a status. */
export function travelFor(geo, status) {
  return geo.travel[status] ?? 0;
}

export function unionRect(list) {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}

/** Translate a geometry (and all its boxes/points) by dx, dy. Returns a new object. */
export function shiftGeo(geo, dx, dy) {
  const mv = v => {
    if (Array.isArray(v)) return v.map(mv);
    if (v && typeof v === 'object') {
      if (v.lines && v.size) return v; // text fit records are position-free
      const out = {};
      for (const [k, x] of Object.entries(v)) {
        if ((k === 'x' || k === 'cx') && typeof x === 'number') out[k] = x + dx;
        else if ((k === 'y' || k === 'cy' || k === 'top') && typeof x === 'number') out[k] = x + dy;
        else out[k] = mv(x);
      }
      return out;
    }
    return v;
  };
  const keep = {fits: geo.fits, hc: geo.hc, hp: geo.hp, rows: geo.rows, travel: geo.travel, dir: geo.dir, headerTextW: geo.headerTextW};
  const moved = mv(geo);
  return Object.assign(moved, keep);
}

/* ------------------------------------------------------------------------ */
/* Profiles                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Bolt outline in canonical coords: tip at x = 0, body back to x = −L,
 * half-width w/2 (y symmetric).
 */
export function boltPath(profile, w, L) {
  const hw = w / 2;
  const tail = `M${r(-L + 8)} ${r(-hw)}`;
  const close = `L${r(-L + 8)} ${r(hw)}Q${r(-L)} ${r(hw)} ${r(-L)} ${r(hw - 8)}V${r(-hw + 8)}Q${r(-L)} ${r(-hw)} ${r(-L + 8)} ${r(-hw)}Z`;
  switch (profile) {
    case 'tri':
      return `${tail}L${r(-w * 0.62)} ${r(-hw)}L0 0L${r(-w * 0.62)} ${r(hw)}${close}`;
    case 'round':
      return `${tail}L${r(-hw)} ${r(-hw)}A${r(hw)} ${r(hw)} 0 0 1 ${r(-hw)} ${r(hw)}${close}`;
    case 'notch':
      return `${tail}L0 ${r(-hw)}L0 ${r(-w * 0.17)}L${r(-w * 0.32)} ${r(-w * 0.17)}L${r(-w * 0.32)} ${r(w * 0.17)}L0 ${r(w * 0.17)}L0 ${r(hw)}${close}`;
    case 'step':
    default:
      return `${tail}L${r(-w * 0.42)} ${r(-hw)}L${r(-w * 0.42)} ${r(-w * 0.26)}L0 ${r(-w * 0.26)}L0 ${r(w * 0.26)}L${r(-w * 0.42)} ${r(w * 0.26)}L${r(-w * 0.42)} ${r(hw)}${close}`;
  }
}

/** Socket recess in canonical coords: mouth at x = 0, recess towards +x, depth D (+clearance). */
export function socketPath(profile, w, D, c = 3) {
  const hw = w / 2 + c;
  switch (profile) {
    case 'tri':
      return `M0 ${r(-hw)}L${r(D - w * 0.62)} ${r(-hw)}L${r(D + c * 1.6)} 0L${r(D - w * 0.62)} ${r(hw)}L0 ${r(hw)}Z`;
    case 'round':
      return `M0 ${r(-hw)}L${r(D - w / 2)} ${r(-hw)}A${r(hw)} ${r(hw)} 0 0 1 ${r(D - w / 2)} ${r(hw)}L0 ${r(hw)}Z`;
    case 'notch':
      return `M0 ${r(-hw)}L${r(D + c)} ${r(-hw)}L${r(D + c)} ${r(-w * 0.17 + c)}L${r(D - w * 0.32 + c)} ${r(-w * 0.17 + c)}L${r(D - w * 0.32 + c)} ${r(w * 0.17 - c)}L${r(D + c)} ${r(w * 0.17 - c)}L${r(D + c)} ${r(hw)}L0 ${r(hw)}Z`;
    case 'step':
    default:
      return `M0 ${r(-hw)}L${r(D - w * 0.42 + c)} ${r(-hw)}L${r(D - w * 0.42 + c)} ${r(-w * 0.26 - c)}L${r(D + c)} ${r(-w * 0.26 - c)}L${r(D + c)} ${r(w * 0.26 + c)}L${r(D - w * 0.42 + c)} ${r(w * 0.26 + c)}L${r(D - w * 0.42 + c)} ${r(hw)}L0 ${r(hw)}Z`;
  }
}

/** Small profile icon (for row badges), centred on (0,0), size ~ s. */
function profileIcon(profile, s, fill, stroke) {
  const w = s * 0.46;
  return h('path', {d: boltPath(profile, w, s * 0.62), transform: T(s * 0.3, 0), fill, stroke, 'stroke-width': 1.8, 'stroke-linejoin': 'round'});
}

/** Row badge: rounded square with the row's profile icon. */
export function rowBadge(ctx, box, profile, color) {
  const th = ctx.theme;
  return g(null,
    h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, box.w * 0.24), fill: th.card, stroke: color, 'stroke-width': 2.4}),
    g({transform: T(box.x + box.w / 2, box.y + box.h / 2)}, profileIcon(profile, box.w, color, th.ink)),
  );
}

/** Colour family of the objects. */
export function hrColors(ctx) {
  const th = ctx.theme;
  return {
    fact: th.accent2, factSoft: th.accent2Soft,
    rule: th.accent4, ruleSoft: th.accent4Soft, plate: shade(th.accent4Soft, -0.04), plateDeep: shade(th.accent4, -0.35),
    bolt: th.accent2, disputed: th.accent3, disputedSoft: th.accent3Soft, pending: th.inkFaint,
  };
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

const nm = (o, k) => (o.named === false ? undefined : `${o.prefix}-${k}`);

/** Placeholder text bars (labels hidden or text-free copies). */
function bars(ctx, x, y, w, lines, s, color) {
  const out = [];
  for (let k = 0; k < lines; k++) {
    const lw = k === lines - 1 && lines > 1 ? w * 0.55 : w * 0.92;
    out.push(h('rect', {x: r(x), y: r(y + k * s * 1.2 + s * 0.2), width: r(lw), height: r(s * 0.42), rx: r(s * 0.21), fill: color}));
  }
  return out;
}

function headerArt(ctx, geo, box, hf, o, fill, textColor) {
  const th = ctx.theme;
  const s = geo.size;
  const rad = 12;
  const parts = [h('path', {d: `M${r(box.x)} ${r(box.y + box.h)}V${r(box.y + rad)}Q${r(box.x)} ${r(box.y)} ${r(box.x + rad)} ${r(box.y)}H${r(box.x + box.w - rad)}Q${r(box.x + box.w)} ${r(box.y)} ${r(box.x + box.w)} ${r(box.y + rad)}V${r(box.y + box.h)}Z`, fill})];
  parts.push(h('line', {x1: r(box.x), x2: r(box.x + box.w), y1: r(box.y + box.h), y2: r(box.y + box.h), stroke: th.ink, 'stroke-width': 2}));
  const tx = box.x + (geo.padX ?? s * 0.6);
  if (hf.kind && !o.textless) {
    parts.push(textBlock(hf.kind, {x: tx, y: box.y + s * 0.5, fill: textColor, name: nm(o, 'kind')}));
    if (hf.title) parts.push(textBlock(hf.title, {x: tx, y: box.y + s * 0.5 + hf.kind.height + s * 0.42, fill: th.ink, name: nm(o, 'title')}));
  } else {
    parts.push(...bars(ctx, tx, box.y + s * 0.45, Math.min(box.w * 0.3, s * 4), 1, s * 0.7, textColor));
    parts.push(...bars(ctx, tx, box.y + s * 1.1, box.w * 0.62, 1, s, shade(textColor, -0.2)));
  }
  return parts;
}

/**
 * The fact card (without bolts). Local coords = world docked coords; entries
 * transform the returned group as a whole. Options:
 *  prefix, named (default true), textless, skipText (row index whose text the
 *  entry draws itself), hideRow (row index drawn as an empty slot), tab (default true).
 */
export function cardArt(ctx, geo, o) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const s = geo.size;
  const C = geo.card;
  const parts = [];
  if (o.tab !== false) {
    const tb = geo.tab;
    parts.push(h('path', {d: roundRectPath(tb.x, tb.y, tb.w, tb.h, 10), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2.5}));
    const ridges = [];
    for (let k = -1; k <= 1; k++) {
      if (geo.axis === 'x') ridges.push(h('line', {x1: r(tb.x + s * 0.3), x2: r(tb.x + s * 0.8), y1: r(tb.y + tb.h / 2 + k * s * 0.42), y2: r(tb.y + tb.h / 2 + k * s * 0.42), stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
      else ridges.push(h('line', {x1: r(tb.x + tb.w / 2 + k * s * 0.42), x2: r(tb.x + tb.w / 2 + k * s * 0.42), y1: r(tb.y + tb.h - s * 0.3), y2: r(tb.y + tb.h - s * 0.8), stroke: th.inkSoft, 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
    }
    parts.push(...ridges);
  }
  parts.push(h('path', {d: roundRectPath(C.x + 7, C.y + 10, C.w, C.h, 12), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, 12), fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(...headerArt(ctx, geo, geo.cardHeader, geo.hc, o, col.factSoft, shade(col.fact, -0.25)));
  const showText = geo.show && !o.textless && !o.rowsTextless;
  geo.cells.forEach((c, i) => {
    const rw = geo.rows[i];
    const f = geo.fits[i];
    if (geo.axis === 'x' && i > 0) parts.push(h('line', {x1: r(C.x + 14), x2: r(C.x + C.w - 14), y1: r(c.cardRow.y), y2: r(c.cardRow.y), stroke: th.paperLine, 'stroke-width': 2}));
    if (geo.axis === 'y' && i > 0) parts.push(h('line', {x1: r(c.cardRow.x), x2: r(c.cardRow.x), y1: r(c.cardRow.y + 12), y2: r(C.y + C.h - 12), stroke: th.paperLine, 'stroke-width': 2}));
    if (o.hideRow === i) {
      const R = c.cardRow;
      parts.push(h('path', {d: roundRectPath(R.x + 10, R.y + 8, R.w - 20, R.h - 16, 8), fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
      return;
    }
    if (!rw.attr) {
      parts.push(...bars(ctx, c.attrAt.x, geo.axis === 'x' ? c.cy - s * 0.4 : c.attrAt.top, c.attrAt.w * 0.5, 1, s, th.paperLine));
      return;
    }
    parts.push(rowBadge(ctx, c.badgeA, rw.profile, col.fact));
    if (o.skipText === i) return;
    if (showText && f.a) {
      const y = geo.axis === 'x' ? c.cy - f.a.height / 2 : c.attrAt.top;
      parts.push(textBlock(f.a, {x: c.attrAt.x, y, fill: th.ink, name: nm(o, `attr${i}`)}));
    } else {
      const lines = f.a ? f.a.lines.length : 2;
      const y = geo.axis === 'x' ? c.cy - (lines * s * 1.2) / 2 : c.attrAt.top;
      parts.push(...bars(ctx, c.attrAt.x, y, c.attrAt.w, lines, s, th.paperLine));
    }
  });
  // channel mouths on the facing edge
  for (const c of geo.cells) {
    if (!geo.rows[c.i].attr) continue;
    parts.push(g({transform: T(c.port.x, c.port.y, geo.angle)},
      h('rect', {x: -6, y: r(-geo.BW / 2 - 4), width: 8, height: r(geo.BW + 8), rx: 3, fill: th.ink, opacity: 0.55})));
  }
  return g({name: nm(o, 'body')}, parts);
}

/**
 * The rule plate. Returns {base, top}: `base` (plate, header, rows, sockets)
 * goes below the bolts, `top` (plate registration halves and seated rims)
 * above them. Options: prefix, named, textless, skipText, hideRow.
 */
export function plateArt(ctx, geo, o) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const s = geo.size;
  const Pl = geo.plate;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(Pl.x + 8, Pl.y + 11, Pl.w, Pl.h, 14), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(Pl.x, Pl.y, Pl.w, Pl.h, 14), fill: col.plate, stroke: th.ink, 'stroke-width': th.stroke * 1.1}));
  parts.push(h('path', {d: roundRectPath(Pl.x + 7, Pl.y + 7, Pl.w - 14, Pl.h - 14, 10), fill: 'none', stroke: shade(col.plate, -0.14), 'stroke-width': 2}));
  parts.push(...headerArt(ctx, geo, geo.plateHeader, geo.hp, o, shade(col.ruleSoft, -0.1), shade(col.rule, -0.3)));
  const rowsTextless = o.rowsTextless === true;
  // screws
  for (const [sx, sy] of [[Pl.x + 16, Pl.y + Pl.h - 16], [Pl.x + Pl.w - 16, Pl.y + Pl.h - 16], [Pl.x + Pl.w - 16, Pl.y + geo.HBp - 14]]) {
    parts.push(h('circle', {cx: r(sx), cy: r(sy), r: 6.5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.6}));
    parts.push(h('line', {x1: r(sx - 3.6), x2: r(sx + 3.6), y1: r(sy - 3.6), y2: r(sy + 3.6), stroke: th.metalDark, 'stroke-width': 1.6}));
  }
  const showText = geo.show && !o.textless && !rowsTextless;
  const top = [];
  geo.cells.forEach((c, i) => {
    const rw = geo.rows[i];
    const f = geo.fits[i];
    if (geo.axis === 'x' && i > 0) parts.push(h('line', {x1: r(Pl.x + geo.D + 10), x2: r(Pl.x + Pl.w - 14), y1: r(c.plateRow.y), y2: r(c.plateRow.y), stroke: shade(col.plate, -0.16), 'stroke-width': 2}));
    if (geo.axis === 'y' && i > 0) parts.push(h('line', {x1: r(c.plateRow.x), x2: r(c.plateRow.x), y1: r(c.plateRow.y + 12), y2: r(Pl.y + Pl.h - geo.D - 10), stroke: shade(col.plate, -0.16), 'stroke-width': 2}));
    if (o.hideRow === i) {
      const R = c.plateRow;
      parts.push(h('path', {d: roundRectPath(R.x + (geo.axis === 'x' ? geo.D + 8 : 10), R.y + 8, R.w - (geo.axis === 'x' ? geo.D + 22 : 20), R.h - 16 - (geo.axis === 'y' ? geo.D : 0), 8), fill: shade(col.plate, -0.08), stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
    } else if (rw.cond !== null) {
      parts.push(rowBadge(ctx, c.badgeC, rw.profile, col.rule));
      if (o.skipText !== i) {
        if (showText && f.c) {
          const y = geo.axis === 'x' ? c.cy - f.c.height / 2 : c.condAt.top;
          parts.push(textBlock(f.c, {x: c.condAt.x, y, fill: th.ink, name: nm(o, `cond${i}`)}));
        } else {
          const lines = f.c ? f.c.lines.length : 2;
          const y = geo.axis === 'x' ? c.cy - (lines * s * 1.2) / 2 : c.condAt.top;
          parts.push(...bars(ctx, c.condAt.x, y, c.condAt.w, lines, s, shade(col.plate, -0.2)));
        }
      }
    }
    if (rw.cond === null) return;
    // socket recess
    parts.push(g({transform: T(c.sock.x, c.sock.y, geo.angle)},
      h('path', {d: socketPath(rw.profile, geo.BW, geo.D), fill: shade(col.plate, -0.42), stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      h('path', {d: socketPath(rw.profile, geo.BW * 0.8, geo.D * 0.8), transform: T(geo.D * 0.12, 0), fill: shade(col.plate, -0.55), opacity: 0.5})));
    // top layer: pending ghost, seated rim, plate registration half, '?' disc
    const fin = o.final === true;
    const seatedFinal = fin && rw.attr && rw.status === 'as-supplied';
    top.push(g({transform: T(c.sock.x, c.sock.y, geo.angle)},
      rw.attr && rw.status === 'pending'
        ? h('path', {name: nm(o, `ghost${i}`), d: boltPath(rw.profile, geo.BW, geo.G + geo.D - 4), transform: T(geo.D, 0), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-dasharray': '6 6', opacity: fin ? 1 : 0})
        : null,
      h('path', {name: nm(o, `rim${i}`), d: socketPath(rw.profile, geo.BW, geo.D), fill: 'none', stroke: col.bolt, 'stroke-width': 4.5, 'stroke-linejoin': 'round', opacity: seatedFinal ? 1 : 0}),
      regHalf(ctx, geo, 'plate', nm(o, `reg${i}`)),
      rw.attr && rw.status === 'disputed'
        ? g({transform: T(-geo.G * 0.24, 0, -geo.angle)}, doubtDisc(ctx, geo, {name: nm(o, `doubt${i}`), opacity: fin ? 1 : 0}))
        : null));
  });
  return {base: g({name: nm(o, 'plate')}, parts), top: g({name: nm(o, 'plate-top')}, top)};
}

/**
 * Registration half-mark (canonical coords: joint line at x = 0).
 * 'plate' half opens towards −x (drawn at the socket mouth); 'bolt' half is
 * drawn in bolt coords at x = −D (so it reaches the mouth when seated).
 */
export function regHalf(ctx, geo, side, name, at = 0) {
  const th = ctx.theme;
  const rm = Math.max(8, geo.BW * 0.27);
  const arm = rm + 7;
  const sg = side === 'plate' ? 1 : -1;
  const d = `M${r(at)} ${r(-rm)}A${r(rm)} ${r(rm)} 0 0 ${sg > 0 ? 1 : 0} ${r(at)} ${r(rm)}M${r(at)} 0H${r(at + sg * arm)}${side === 'bolt' ? `M${r(at)} ${r(-arm)}V${r(arm)}` : ''}`;
  return g({name},
    h('path', {d, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.9}),
    h('path', {d, fill: 'none', stroke: th.ink, 'stroke-width': 2.6, 'stroke-linecap': 'round'}));
}

/** '?' glyph as a path (a symbol, not text), centred on (0,0), height ~ s. */
export function questionGlyph(s, color) {
  const k = s / 26;
  return g(null,
    h('path', {d: `M${r(-6 * k)} ${r(-6 * k)}C${r(-6 * k)} ${r(-13 * k)} ${r(6 * k)} ${r(-13 * k)} ${r(6 * k)} ${r(-6 * k)}C${r(6 * k)} ${r(-1 * k)} 0 ${r(0)} 0 ${r(4 * k)}`, fill: 'none', stroke: color, 'stroke-width': r(3.6 * k), 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: r(10 * k), r: r(2.3 * k), fill: color}));
}

/**
 * A row's bolt (the connector). Node is positioned at the port (retracted);
 * `transform(t)` gives the node transform for travel t (design units).
 * Options: name, status (drives colour: as-supplied/pending → fact blue,
 * disputed → amber hatching), named.
 */
export function boltArt(ctx, geo, i, o) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const rw = geo.rows[i];
  const c = geo.cells[i];
  const w = geo.BW;
  const L = geo.BL;
  const disputed = o.status === 'disputed';
  const pathD = boltPath(rw.profile, w, L);
  const hatchId = `${o.name}-hatch`;
  const tipX = -4; // retracted: tip just inside the card edge
  const inner = [
    disputed ? h('defs', null, h('pattern', {id: ctx.id(hatchId), width: 11, height: 11, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)'},
      h('rect', {width: 11, height: 11, fill: col.disputedSoft}),
      h('rect', {width: 4.5, height: 11, fill: col.disputed, opacity: 0.75}))) : null,
    h('path', {d: pathD, fill: disputed ? ctx.ref(hatchId) : col.bolt, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    disputed ? null : h('path', {d: `M${r(-L + 12)} ${r(-w * 0.28)}H${r(-w * 0.9)}`, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.45}),
    // grip ridges near the tail (hidden under the card)
    h('path', {d: `M${r(-L + 16)} ${r(-w * 0.3)}v${r(w * 0.6)}M${r(-L + 24)} ${r(-w * 0.3)}v${r(w * 0.6)}`, stroke: th.ink, 'stroke-width': 1.6, opacity: 0.4}),
    regHalf(ctx, geo, 'bolt', o.named === false ? undefined : `${o.name}-reg`, -geo.D),
  ];
  const node = g({name: o.named === false ? undefined : o.name, transform: T(c.port.x + geo.dir.x * (tipX + (o.t ?? 0)), c.port.y + geo.dir.y * (tipX + (o.t ?? 0)), geo.angle)}, inner);
  const transform = t => T(c.port.x + geo.dir.x * (tipX + t), c.port.y + geo.dir.y * (tipX + t), geo.angle);
  /** world position of the bolt tip for travel t (card docked) */
  const tipAt = t => ({x: c.port.x + geo.dir.x * (tipX + t), y: c.port.y + geo.dir.y * (tipX + t)});
  return {node, transform, tipAt};
}

/** '?' disc shown in the free part of the gap where a disputed bolt stopped short (plate side, upright). */
export function doubtDisc(ctx, geo, o) {
  const col = hrColors(ctx);
  const R = Math.min(geo.G * 0.19, Math.max(13, geo.BW * 0.42));
  return g({name: o.name, opacity: o.opacity ?? 0},
    h('circle', {r: R, fill: col.disputed, stroke: ctx.theme.ink, 'stroke-width': 2.4}),
    questionGlyph(R * 1.25, '#ffffff'));
}

/**
 * Hand magnifier. `view` (world coords, clipped, holds the enlarged copy) and
 * `prop` (rim, glass, handle) are separate nodes so a hand's palm can go
 * below the prop and the thumb above it.
 * @param {any} ctx
 * @param {{name:string, R:number, handle:number, copy?:any, zoom?:number, lensFill?:string}} o
 */
export function lupaArt(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const R = o.R;
  const Lh = o.handle;
  const view = g({name: `${N}-view`, opacity: 0},
    h('defs', null, h('clipPath', {id: ctx.id(`${N}-clip`)}, h('circle', {name: `${N}-clipc`, cx: 0, cy: 0, r: r(R - 5)}))),
    g({'clip-path': ctx.ref(`${N}-clip`)},
      h('circle', {name: `${N}-bg`, cx: 0, cy: 0, r: r(R), fill: o.lensFill || th.woodTop}),
      g({name: `${N}-zoom`}, o.copy || null)));
  const shadow = h('ellipse', {name: `${N}-shadow`, cx: 0, cy: 0, rx: r(R + 4), ry: r(R + 4), fill: th.shadow});
  const handleShadow = h('rect', {name: `${N}-hshadow`, x: r(R + 4), y: -10, width: r(Lh), height: 20, rx: 10, fill: th.shadow});
  const prop = g({name: N},
    // handle (local +x), ferrule, rim, glass
    h('rect', {x: r(R + 18), y: -13, width: r(Lh - 18), height: 26, rx: 13, fill: '#3d3a36', stroke: th.ink, 'stroke-width': 2.4}),
    h('rect', {x: r(R + 30), y: -8, width: r(Lh - 40), height: 5, rx: 2.5, fill: '#ffffff', opacity: 0.18}),
    h('rect', {x: r(R + 2), y: -10, width: 22, height: 20, rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {r: r(R), fill: 'none', stroke: th.ink, 'stroke-width': 17}),
    h('circle', {r: r(R), fill: 'none', stroke: th.metal, 'stroke-width': 12}),
    h('circle', {r: r(R - 6), fill: '#d6ecf5', opacity: 0.22}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.3)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(-R * 0.2)} ${r(-R * 0.66)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.55}),
  );
  const zoom = o.zoom ?? 1.9;
  /**
   * @param {{x:number,y:number}} c lens centre
   * @param {number} angleDeg handle direction
   * @param {number} lift 0 lying on the desk → 1 held up
   * @param {number} [viewOpacity]
   * @param {{x:number,y:number}} [src] point of the copy shown at the lens centre (default: the point under the centre)
   */
  const frame = (c, angleDeg, lift, viewOpacity = 1, src = c) => {
    const k = 1 + 0.07 * lift;
    const off = {x: 6 + 18 * lift, y: 9 + 26 * lift};
    const a = (angleDeg * Math.PI) / 180;
    return {
      [N]: {transform: T(c.x, c.y, angleDeg, k)},
      [`${N}-shadow`]: {cx: r(c.x + off.x), cy: r(c.y + off.y), rx: r((R + 4) * k), ry: r((R + 4) * k), opacity: r(1 - 0.35 * lift, 3)},
      [`${N}-hshadow`]: {transform: `${T(c.x + off.x, c.y + off.y, angleDeg, k)}`, opacity: r(1 - 0.35 * lift, 3)},
      [`${N}-view`]: {opacity: r(viewOpacity, 3)},
      [`${N}-clipc`]: {cx: r(c.x), cy: r(c.y), r: r((R - 5) * k)},
      [`${N}-bg`]: {cx: r(c.x), cy: r(c.y), r: r(R * k)},
      [`${N}-zoom`]: {transform: `translate(${r(c.x)} ${r(c.y)}) scale(${r(zoom, 3)}) translate(${r(-src.x)} ${r(-src.y)})`},
      grip: {x: c.x + Math.cos(a) * (R + Lh * 0.6) * k, y: c.y + Math.sin(a) * (R + Lh * 0.6) * k},
    };
  };
  const shadows = g(null, handleShadow, shadow);
  return {view, prop, shadows, frame, R, zoom};
}

/**
 * Static, text-free copy of the docked assembly in a given state (used inside
 * the magnifier). `ext` maps row index → travel.
 */
export function assemblyCopy(ctx, geo, ext, prefix) {
  const base = {prefix, named: false, textless: true};
  const plate = plateArt(ctx, geo, {...base, final: true});
  const bolts = geo.rows.map((rw, i) => (rw.attr ? boltArt(ctx, geo, i, {name: `${prefix}-b${i}`, status: rw.status, named: false, t: ext[i] ?? 0}).node : null));
  const card = cardArt(ctx, geo, {...base, tab: false});
  return g(null, plate.base, g(null, bolts, card), plate.top);
}

/** Point on the joint of row i (middle of the gap, on the row line). */
export function jointPoint(geo, i) {
  const c = geo.cells[i];
  return {x: (c.port.x + c.sock.x) / 2, y: (c.port.y + c.sock.y) / 2};
}

/**
 * Guide jaws: two metal lips mounted on the rule plate's facing edge that run
 * along the docked card's edges and flare open at their mouth. A card that
 * slides in is squared up by them (the connector's support).
 * @param {any} geo docked geometry
 * @param {{reach:number, flareLen:number, flare:number, off?:number}} o reach = mouth distance from the plate edge
 */
export function jawsGeometry(geo, o) {
  const off = o.off ?? 13;
  const C = geo.card;
  if (geo.axis === 'x') {
    const x0 = geo.plate.x + 26;
    const mouth = geo.plate.x - o.reach;
    const yT = C.y - off, yB = C.y + C.h + off;
    return {
      a: [{x: x0, y: yT}, {x: mouth + o.flareLen, y: yT}, {x: mouth, y: yT - o.flare}],
      b: [{x: x0, y: yB}, {x: mouth + o.flareLen, y: yB}, {x: mouth, y: yB + o.flare}],
      mouth, flareLen: o.flareLen, bracketA: {x: geo.plate.x + 26, y: yT}, bracketB: {x: geo.plate.x + 26, y: yB},
    };
  }
  const y0 = geo.plate.y + geo.plate.h - 26;
  const mouth = geo.plate.y + geo.plate.h + o.reach;
  const xL = C.x - off, xR = C.x + C.w + off;
  return {
    a: [{x: xL, y: y0}, {x: xL, y: mouth - o.flareLen}, {x: xL - o.flare, y: mouth}],
    b: [{x: xR, y: y0}, {x: xR, y: mouth - o.flareLen}, {x: xR + o.flare, y: mouth}],
    mouth, flareLen: o.flareLen, bracketA: {x: xL, y: y0}, bracketB: {x: xR, y: y0},
  };
}

/** Art for one jaw lip (metal bar with a screwed bracket on the plate). */
export function jawArt(ctx, pts, bracket) {
  const th = ctx.theme;
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  return g(null,
    h('path', {d, fill: 'none', stroke: th.shadow, 'stroke-width': 17, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: 'translate(3 6)'}),
    h('path', {d, fill: 'none', stroke: th.ink, 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d, fill: 'none', stroke: th.metal, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d, fill: 'none', stroke: '#ffffff', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.45, transform: 'translate(-1 -2)'}),
    h('rect', {x: r(bracket.x - 16), y: r(bracket.y - 16), width: 32, height: 32, rx: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: r(bracket.x), cy: r(bracket.y), r: 5, fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.4}),
  );
}

/**
 * One row of the fact card or of the rule plate as a separate piece (the
 * exploded view): 'attr' = the card's row strip with its channel mouth,
 * 'cond' = the plate's row block with its socket. Drawn in docked coords.
 * Options: name, textless, textName.
 */
export function rowPieceArt(ctx, geo, i, side, o) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const s = geo.size;
  const c = geo.cells[i];
  const rw = geo.rows[i];
  const f = geo.fits[i];
  const R = side === 'attr' ? c.cardRow : c.plateRow;
  const inset = 4;
  const box = {x: R.x + inset, y: R.y + inset, w: R.w - inset * 2, h: R.h - inset * 2};
  const fill = side === 'attr' ? th.paper : col.plate;
  const parts = [
    h('path', {d: roundRectPath(box.x + 5, box.y + 7, box.w, box.h, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 8), fill, stroke: th.ink, 'stroke-width': 2.4}),
  ];
  const showText = geo.show && !o.textless;
  if (side === 'attr') {
    if (rw.attr) {
      parts.push(rowBadge(ctx, c.badgeA, rw.profile, col.fact));
      if (showText && f.a) parts.push(textBlock(f.a, {x: c.attrAt.x, y: geo.axis === 'x' ? c.cy - f.a.height / 2 : c.attrAt.top, fill: th.ink, name: o.textName}));
      else parts.push(...bars(ctx, c.attrAt.x, geo.axis === 'x' ? c.cy - s * 0.6 : c.attrAt.top, c.attrAt.w, f.a ? f.a.lines.length : 2, s, th.paperLine));
      parts.push(g({transform: T(c.port.x, c.port.y, geo.angle)}, h('rect', {x: -6, y: r(-geo.BW / 2 - 4), width: 8, height: r(geo.BW + 8), rx: 3, fill: th.ink, opacity: 0.55})));
    }
  } else if (rw.cond !== null) {
    parts.push(rowBadge(ctx, c.badgeC, rw.profile, col.rule));
    if (showText && f.c) parts.push(textBlock(f.c, {x: c.condAt.x, y: geo.axis === 'x' ? c.cy - f.c.height / 2 : c.condAt.top, fill: th.ink, name: o.textName}));
    else parts.push(...bars(ctx, c.condAt.x, geo.axis === 'x' ? c.cy - s * 0.6 : c.condAt.top, c.condAt.w, f.c ? f.c.lines.length : 2, s, shade(col.plate, -0.2)));
    parts.push(g({transform: T(c.sock.x, c.sock.y, geo.angle)},
      h('path', {d: socketPath(rw.profile, geo.BW, geo.D), fill: shade(col.plate, -0.42), stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      regHalf(ctx, geo, 'plate', undefined)));
  }
  return {node: g({name: o.name}, parts), box};
}

/**
 * Paper tag for an open issue (a question the author attaches; never answered).
 * Local origin = the tag's hole (top centre). Returns node and local box.
 */
export function issueTagArt(ctx, o) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const w = o.w, hh = o.h;
  const cut = Math.min(22, w * 0.12);
  const d = `M${r(-w / 2 + cut)} 0H${r(w / 2 - cut)}L${r(w / 2)} ${r(cut)}V${r(hh)}H${r(-w / 2)}V${r(cut)}Z`;
  return g({name: o.name},
    h('path', {d, transform: 'translate(5 7)', fill: th.shadow}),
    h('path', {d, fill: col.disputedSoft, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('circle', {cx: 0, cy: r(cut * 0.8), r: 6, fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    o.content || null);
}

/** Metal support block for an assumption (it holds the connector from below/beside). Local origin = top centre. */
export function supportArt(ctx, o) {
  const th = ctx.theme;
  const w = o.w, hh = o.h;
  return g({name: o.name},
    h('path', {d: roundRectPath(-w / 2 + 6, 8, w, hh, 8), fill: th.shadow}),
    h('path', {d: `M${r(-w / 2)} ${r(hh)}V10Q${r(-w / 2)} 0 ${r(-w / 2 + 10)} 0H${r(w / 2 - 10)}Q${r(w / 2)} 0 ${r(w / 2)} 10V${r(hh)}Z`, fill: '#e3e8ec', stroke: th.ink, 'stroke-width': 2.4}),
    h('rect', {x: r(-w / 2), y: r(hh - 12), width: r(w), height: 12, rx: 3, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: r(-w / 2 + 12), cy: 12, r: 4, fill: th.metalDark}),
    h('circle', {cx: r(w / 2 - 12), cy: 12, r: 4, fill: th.metalDark}),
    o.content || null);
}

/* ------------------------------------------------------------------------ */
/* Mechanism / contrast / inspect helpers                                   */
/* ------------------------------------------------------------------------ */

/**
 * Straight relation link between two (possibly moving) points, styled by the
 * supplied kind (relation = no arrowhead, end dots; sequence / communication /
 * causal = arrowhead at `b`). The arrowhead only appears once the line has
 * reached its end, so it never floats detached.
 * @param {any} ctx
 * @param {string} name
 * @param {'relation'|'communication'|'sequence'|'causal'} kind
 * @param {string} color
 */
export function linkSeg(ctx, name, kind, color, widthK = 1) {
  const style = LINK_STYLES[kind] || LINK_STYLES.relation;
  const w = style.width * widthK;
  const head = w * 4.2;
  const node = g({name, opacity: 0},
    // halo: keeps the line readable over objects and over a light or dark background
    h('line', {name: `${name}-halo`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: ctx.theme.card, 'stroke-width': w + 5, 'stroke-linecap': 'round', opacity: 0.85}),
    h('line', {name: `${name}-line`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': style.dash || undefined}),
    style.arrow ? h('path', {name: `${name}-head`, d: `M0 0L${r(-head)} ${r(-head * 0.55)}L${r(-head * 0.72)} 0L${r(-head)} ${r(head * 0.55)}Z`, fill: color, opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${name}-dotA`, cx: 0, cy: 0, r: r(w * 1.6), fill: color}) : null,
    style.endDots ? h('circle', {name: `${name}-dotB`, cx: 0, cy: 0, r: r(w * 1.6), fill: color, opacity: 0}) : null,
  );
  /**
   * @param {{x:number,y:number}} a start (on its element's edge)
   * @param {{x:number,y:number}} b end (on its element's edge; the arrow tip touches it)
   * @param {number} p draw progress 0..1
   * @param {number} [opacity]
   */
  const frame = (a, b, p, opacity = 1) => {
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const visible = p > 0 && L > 3 && opacity > 0;
    const ux = L ? (b.x - a.x) / L : 1, uy = L ? (b.y - a.y) / L : 0;
    const done = p >= 0.98;
    const cut = style.arrow && done ? Math.min(L, head * 0.72) : 0;
    const e = {x: a.x + (b.x - a.x) * p - ux * cut, y: a.y + (b.y - a.y) * p - uy * cut};
    const out = {
      [name]: {opacity: visible ? r(opacity, 3) : 0},
      [`${name}-line`]: {x1: r(a.x), y1: r(a.y), x2: r(e.x), y2: r(e.y)},
      [`${name}-halo`]: {x1: r(a.x), y1: r(a.y), x2: r(e.x), y2: r(e.y)},
    };
    if (style.arrow) out[`${name}-head`] = {transform: T(b.x, b.y, (Math.atan2(uy, ux) * 180) / Math.PI), opacity: done ? 1 : 0};
    if (style.endDots) {
      out[`${name}-dotA`] = {cx: r(a.x), cy: r(a.y)};
      out[`${name}-dotB`] = {cx: r(b.x), cy: r(b.y), opacity: done ? 1 : 0};
    }
    return out;
  };
  return {node, frame, color, arrow: style.arrow, kind};
}

/** Link colour per relation kind for lines drawn over light object surfaces (ink family; a halo separates them from a dark background). */
export function surfaceKindColor(ctx, kind) {
  const th = ctx.theme;
  return kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.ink : kind === 'causal' ? th.accent : th.inkSoft;
}

/** Relation kind sample for legends (line + arrowhead or end dots), origin = left end. */
export function kindSample(ctx, kind, color, len = 54) {
  const style = LINK_STYLES[kind] || LINK_STYLES.relation;
  return g(null,
    h('line', {x1: 0, x2: len, y1: 0, y2: 0, stroke: ctx.theme.card, 'stroke-width': style.width + 5, 'stroke-linecap': 'round', opacity: 0.85}),
    h('line', {x1: 0, x2: len, y1: 0, y2: 0, stroke: color, 'stroke-width': style.width, 'stroke-dasharray': style.dash || undefined, 'stroke-linecap': 'round'}),
    style.arrow ? h('path', {d: `M${len + 4} 0l-14 -8l3 8l-3 8z`, fill: color}) : h('circle', {cx: len, cy: 0, r: 5, fill: color}),
    style.arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}));
}

/**
 * Miniature of a joint in one supplied state, for state keys (origin = left
 * centre, total width ≈ 3.1·u, height ≈ 1.3·u).
 */
export function stateIcon(ctx, status, u = 22) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const bw = u * 0.62, D = u * 0.55;
  const plateX = u * 2.1;
  const parts = [
    h('path', {d: roundRectPath(plateX, -u * 0.65, u, u * 1.3, 4), fill: col.plate, stroke: th.ink, 'stroke-width': 1.8}),
    h('path', {d: socketPath('tri', bw, D, 1.5), transform: T(plateX, 0), fill: shade(col.plate, -0.42), stroke: th.ink, 'stroke-width': 1.4}),
  ];
  const bolt = tipX => h('path', {d: boltPath('tri', bw, u * 1.7), transform: T(tipX, 0), fill: status === 'disputed' ? col.disputedSoft : col.bolt, stroke: status === 'disputed' ? shade(col.disputed, -0.3) : th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'});
  if (status === 'as-supplied') parts.push(bolt(plateX + D));
  else if (status === 'disputed') {
    parts.push(bolt(plateX - u * 0.72));
    parts.push(g({transform: T(plateX - u * 0.36, -u * 0.62)}, h('circle', {r: r(u * 0.3), fill: col.disputed, stroke: th.ink, 'stroke-width': 1.4}), questionGlyph(u * 0.4, '#ffffff')));
  } else {
    parts.push(bolt(plateX - u * 0.95));
    parts.push(h('path', {d: boltPath('tri', bw, u * 0.9), transform: T(plateX + D, 0), fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.5, 'stroke-dasharray': '3 3'}));
  }
  return g(null, parts);
}

/**
 * Key/legend: items {icon:(x,y)=>node, iconW, text} laid out in rows centred on
 * at.x, first row top at at.y. Text is free-floating on the background (fg).
 * Returns node and box.
 */
export function keyArt(ctx, name, items, at, maxW, size = 24) {
  const th = ctx.theme;
  const gap = size * 1.5;
  const widths = items.map(it => it.iconW + size * 0.5 + ctx.measure(it.text, size, 500, 'sans'));
  const rows = [];
  let cur = [], wsum = 0;
  items.forEach((it, i) => {
    if (cur.length && wsum + gap + widths[i] > maxW) { rows.push(cur); cur = []; wsum = 0; }
    wsum += (cur.length ? gap : 0) + widths[i];
    cur.push(i);
  });
  if (cur.length) rows.push(cur);
  const lineH = size * 1.9;
  const parts = [];
  let minX = Infinity, maxX = -Infinity;
  rows.forEach((row, ri) => {
    const total = row.reduce((a, i) => a + widths[i], 0) + gap * (row.length - 1);
    let x = at.x - total / 2;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x + total);
    const y = at.y + ri * lineH + lineH / 2;
    for (const i of row) {
      const it = items[i];
      const f = ctx.fit(it.text, {maxWidth: widths[i] - it.iconW - size * 0.5 + 2, size, minSize: size * 0.8, maxLines: 1, weight: 500});
      parts.push(it.icon(x, y));
      parts.push(textBlock(f, {x: x + it.iconW + size * 0.5, y: y - f.size * 0.62, fill: th.fg}));
      x += widths[i] + gap;
    }
  });
  const box = {x: minX, y: at.y, w: Math.max(0, maxX - minX), h: rows.length * lineH};
  return {node: g({name, opacity: 0}, parts), box, rows: rows.length};
}

/** Height a key would take (rows × line height) without building it. */
export function keyHeight(ctx, items, maxW, size = 24) {
  const gap = size * 1.5;
  let rows = items.length ? 1 : 0, wsum = 0;
  items.forEach((it, i) => {
    const w = it.iconW + size * 0.5 + ctx.measure(it.text, size, 500, 'sans');
    if (i && wsum + gap + w > maxW) { rows++; wsum = w; } else wsum += (i ? gap : 0) + w;
  });
  return rows * size * 1.9;
}

/**
 * Detail magnifier (inspect): a hand magnifier whose glass morphs from a small
 * SOURCE circle (the joint, scale 1 — the copy sits exactly on its original
 * coordinates) to a large DEST circle, showing a real enlarged copy of the
 * content drawn in context coordinates. Cone lines keep it tied to the source.
 * `content` should contain named nodes the entry animates (the substitution).
 * @param {any} ctx
 * @param {{name:string, src:{x:number,y:number,r:number}, dest:{x:number,y:number,r:number}, content:any, handleAngle:number, color?:string, lensFill?:string}} o
 */
export function detailMagnifier(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const color = o.color ?? th.accent2;
  const node = g({name: N, opacity: 0},
    h('circle', {name: `${N}-src`, cx: r(o.src.x), cy: r(o.src.y), r: r(o.src.r), fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-dasharray': '10 7'}),
    h('line', {name: `${N}-coneA`, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7'}),
    h('line', {name: `${N}-coneB`, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7'}),
    h('ellipse', {name: `${N}-shadow`, fill: th.shadow}),
    h('rect', {name: `${N}-handle`, x: 0, y: -15, height: 30, rx: 15, fill: '#3d3a36', stroke: th.ink, 'stroke-width': 2.4}),
    h('rect', {name: `${N}-ferrule`, x: 0, y: -12, width: 26, height: 24, rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('defs', null, h('clipPath', {id: ctx.id(`${N}-clip`)}, h('circle', {name: `${N}-clipc`, cx: 0, cy: 0, r: 1}))),
    h('circle', {name: `${N}-bg`, fill: o.lensFill ?? th.paper}),
    g({'clip-path': ctx.ref(`${N}-clip`)}, g({name: `${N}-content`}, o.content)),
    h('circle', {name: `${N}-glass`, fill: '#d6ecf5', opacity: 0.16}),
    h('circle', {name: `${N}-rimO`, fill: 'none', stroke: th.ink, 'stroke-width': 19}),
    h('circle', {name: `${N}-rim`, fill: 'none', stroke: th.metal, 'stroke-width': 13}),
    h('path', {name: `${N}-glint`, fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.5}),
  );
  const S = o.src, Dd = o.dest;
  /**
   * @param {number} p 0 = collapsed onto the source (scale 1), 1 = at dest
   * @param {number} [vis] overall opacity
   */
  const frame = (p, vis = 1) => {
    const c = {x: S.x + (Dd.x - S.x) * p, y: S.y + (Dd.y - S.y) * p};
    const R = S.r + (Dd.r - S.r) * p;
    const k = R / S.r;
    const a = (o.handleAngle * Math.PI) / 180;
    const hl = R * 0.95 + 30;
    const hx = c.x + Math.cos(a) * (R + 6), hy = c.y + Math.sin(a) * (R + 6);
    // outer tangent lines between the source circle and the glass
    const d = Math.hypot(c.x - S.x, c.y - S.y);
    let cone = null;
    if (d > R - S.r + 4) {
      const base = Math.atan2(c.y - S.y, c.x - S.x);
      const off = Math.acos(Math.max(-1, Math.min(1, (S.r - R) / d)));
      const t1 = base + off, t2 = base - off;
      cone = [
        [{x: S.x + Math.cos(t1) * S.r, y: S.y + Math.sin(t1) * S.r}, {x: c.x + Math.cos(t1) * R, y: c.y + Math.sin(t1) * R}],
        [{x: S.x + Math.cos(t2) * S.r, y: S.y + Math.sin(t2) * S.r}, {x: c.x + Math.cos(t2) * R, y: c.y + Math.sin(t2) * R}],
      ];
    }
    const ln = q => (q ? {x1: r(q[0].x), y1: r(q[0].y), x2: r(q[1].x), y2: r(q[1].y), opacity: p > 0.04 ? 1 : 0} : {opacity: 0});
    return {
      [N]: {opacity: r(vis, 3)},
      [`${N}-src`]: {opacity: p > 0.02 ? 1 : 0},
      [`${N}-coneA`]: ln(cone && cone[0]),
      [`${N}-coneB`]: ln(cone && cone[1]),
      [`${N}-shadow`]: {cx: r(c.x + 8 + 10 * p), cy: r(c.y + 12 + 14 * p), rx: r(R + 10), ry: r(R + 10), opacity: r(0.6 + 0.4 * p, 3)},
      [`${N}-handle`]: {transform: T(hx, hy, o.handleAngle), width: r(hl)},
      [`${N}-ferrule`]: {transform: T(hx - Math.cos(a) * 4, hy - Math.sin(a) * 4, o.handleAngle)},
      [`${N}-clipc`]: {cx: r(c.x), cy: r(c.y), r: r(R - 3)},
      [`${N}-bg`]: {cx: r(c.x), cy: r(c.y), r: r(R)},
      [`${N}-content`]: {transform: `translate(${r(c.x)} ${r(c.y)}) scale(${r(k, 4)}) translate(${r(-S.x)} ${r(-S.y)})`},
      [`${N}-glass`]: {cx: r(c.x), cy: r(c.y), r: r(R)},
      [`${N}-rimO`]: {cx: r(c.x), cy: r(c.y), r: r(R + 3)},
      [`${N}-rim`]: {cx: r(c.x), cy: r(c.y), r: r(R + 3)},
      [`${N}-glint`]: {d: `M${r(c.x - R * 0.62)} ${r(c.y - R * 0.3)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(c.x - R * 0.2)} ${r(c.y - R * 0.66)}`},
      __lens: {c, R, k},
    };
  };
  return {node, frame};
}

/**
 * Marker clip clamped onto the facing edge of the fact card at one row (just
 * above the bolt channel). kind 'match' = blue clip with an "=" face (the
 * author supplies the attribute as coinciding); 'dispute' = amber clip with a
 * "?" face (supplied as disputed). Faces are paths, never text. Local origin =
 * the point where the clip grips the card edge; the clip points along +x.
 */
export function markerClip(ctx, o) {
  const th = ctx.theme;
  const col = hrColors(ctx);
  const s = o.size;
  const w = s * 1.25, hh = s * 1.15;
  const fill = o.kind === 'dispute' ? col.disputed : col.bolt;
  const soft = o.kind === 'dispute' ? col.disputedSoft : shade(col.factSoft, 0.1);
  const face = o.kind === 'dispute'
    ? g({transform: T(0, 0)}, questionGlyph(hh * 0.62, '#ffffff'))
    : g(null,
      h('rect', {x: r(-w * 0.26), y: r(-hh * 0.2), width: r(w * 0.52), height: r(hh * 0.12), rx: 2, fill: '#ffffff'}),
      h('rect', {x: r(-w * 0.26), y: r(hh * 0.06), width: r(w * 0.52), height: r(hh * 0.12), rx: 2, fill: '#ffffff'}));
  return g({name: o.name, opacity: o.opacity ?? 0},
    // spring hinge on the card side (the clip sits on its own row only)
    h('rect', {x: r(-w / 2 - w * 0.22), y: r(-hh * 0.18), width: r(w * 0.3), height: r(hh * 0.36), rx: r(hh * 0.12), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(-w / 2 + 4)} ${r(hh * 0.5)}L${r(-w / 2)} ${r(-hh * 0.5)}H${r(w / 2)}L${r(w / 2 - 4)} ${r(hh * 0.5)}Z`, fill, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(-w / 2 + 5), y: r(hh * 0.3), width: r(w - 10), height: r(hh * 0.16), fill: soft, opacity: 0.8}),
    face);
}

/**
 * Bar magnifier (a rectangular reading lens laid over one line of text): metal
 * frame, faint glass tint, glint and a knob handle on its right end. All parts
 * are named and positioned per frame from the lens rectangle `R` (the window
 * rectangle of frameworks/lens.js), so the frame always hugs the enlarged view.
 */
export function barMagnifierArt(ctx, name) {
  const th = ctx.theme;
  return g({name, opacity: 0},
    // handle: dark grip with a light ridge, then a metal ferrule that overlaps the rim (visibly attached)
    h('rect', {name: `${name}-knob`, fill: '#3d3a36', stroke: th.ink, 'stroke-width': 2.4}),
    h('rect', {name: `${name}-ridge`, fill: '#ffffff', opacity: 0.2}),
    h('rect', {name: `${name}-ferrule`, rx: 4, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {name: `${name}-tint`, fill: '#d6ecf5', opacity: 0.14}),
    h('rect', {name: `${name}-rimO`, fill: 'none', stroke: th.ink, 'stroke-width': 15}),
    h('rect', {name: `${name}-rim`, fill: 'none', stroke: th.metal, 'stroke-width': 10}),
    h('path', {name: `${name}-glint`, fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.5}));
}

/** Room the bar magnifier's handle takes beyond the lens rectangle (design units). */
export const BAR_HANDLE = 118;

/**
 * Frame attributes for the bar magnifier around lens rectangle R (opacity
 * vis). The handle leaves the middle of the right edge ('right'), of the left
 * edge ('left') or of the bottom edge ('down'); its ferrule overlaps the rim.
 */
export function barMagnifierFrame(name, R, vis, side = 'right') {
  const rad = Math.min(18, R.h * 0.2);
  const box = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h), rx: r(rad)};
  const scale = Math.max(0.45, Math.min(1, R.h / 150));
  const kt = 34 * scale, kl = (BAR_HANDLE - 26) * Math.max(0.7, scale), ft = 26 * scale, fl = 30 * scale;
  let knob, ferrule, ridge;
  if (side === 'down') {
    const cx = R.x + R.w / 2;
    ferrule = {x: r(cx - ft / 2), y: r(R.y + R.h - 4), width: r(ft), height: r(fl)};
    knob = {x: r(cx - kt / 2), y: r(R.y + R.h + fl - 8), width: r(kt), height: r(kl), rx: r(kt / 2)};
    ridge = {x: r(cx - kt * 0.28), y: r(R.y + R.h + fl + 4), width: r(kt * 0.14), height: r(kl - 24), rx: 2};
  } else if (side === 'left') {
    const cy = R.y + R.h / 2;
    ferrule = {x: r(R.x + 4 - fl), y: r(cy - ft / 2), width: r(fl), height: r(ft)};
    knob = {x: r(R.x - fl + 8 - kl), y: r(cy - kt / 2), width: r(kl), height: r(kt), rx: r(kt / 2)};
    ridge = {x: r(R.x - fl - 4 - (kl - 24)), y: r(cy - kt * 0.28), width: r(kl - 24), height: r(kt * 0.14), rx: 2};
  } else {
    const cy = R.y + R.h / 2;
    ferrule = {x: r(R.x + R.w - 4), y: r(cy - ft / 2), width: r(fl), height: r(ft)};
    knob = {x: r(R.x + R.w + fl - 8), y: r(cy - kt / 2), width: r(kl), height: r(kt), rx: r(kt / 2)};
    ridge = {x: r(R.x + R.w + fl + 4), y: r(cy - kt * 0.28), width: r(kl - 24), height: r(kt * 0.14), rx: 2};
  }
  return {
    [name]: {opacity: r(vis, 3)},
    [`${name}-knob`]: knob,
    [`${name}-ridge`]: ridge,
    [`${name}-ferrule`]: ferrule,
    [`${name}-tint`]: box,
    [`${name}-rimO`]: box,
    [`${name}-rim`]: box,
    [`${name}-glint`]: {d: `M${r(R.x + rad + 8)} ${r(R.y + R.h * 0.3)}Q${r(R.x + rad + 8)} ${r(R.y + 10)} ${r(R.x + Math.min(R.w * 0.2, 160))} ${r(R.y + 10)}`},
  };
}

/**
 * Connector tray (mechanism): a shallow metal parts tray with one groove per
 * bolt. Grooves run along the bolts' axis (horizontal for axis 'x', vertical
 * for axis 'y'); `slots` are the bolt centre points. Local = world coords.
 * @param {any} ctx
 * @param {{name:string, box:{x:number,y:number,w:number,h:number}, axis:'x'|'y', slots:{x:number,y:number}[], len:number, bw:number,
 *   headH?:number, head?:any, headName?:string, ghosts?:{profile:string, tip:{x:number,y:number}, angle:number}[], extra?:any}} o
 */
export function trayArt(ctx, o) {
  const th = ctx.theme;
  const b = o.box;
  // optional printed label band along the tray's top edge (the connector's name, like the card and plate headers)
  const headH = o.headH ?? 0;
  const head = headH
    ? g(null,
      h('path', {d: `M${r(b.x + 7)} ${r(b.y + headH)}V${r(b.y + 14)}Q${r(b.x + 7)} ${r(b.y + 7)} ${r(b.x + 14)} ${r(b.y + 7)}H${r(b.x + b.w - 14)}Q${r(b.x + b.w - 7)} ${r(b.y + 7)} ${r(b.x + b.w - 7)} ${r(b.y + 14)}V${r(b.y + headH)}Z`, fill: '#c9d1d8'}),
      o.head ? textBlock(o.head, {x: b.x + b.w / 2, y: b.y + (headH - o.head.height) / 2 + 3, anchor: 'middle', fill: '#2c3a46', name: o.headName}) : null)
    : null;
  const gw = o.bw * 0.62;
  const grooves = o.slots.map(q => (o.axis === 'x'
    ? h('rect', {x: r(q.x - o.len / 2 - 6), y: r(q.y - gw / 2), width: r(o.len + 12), height: r(gw), rx: r(gw / 2), fill: '#b9c2ca', stroke: '#8f9aa4', 'stroke-width': 1.6})
    : h('rect', {x: r(q.x - gw / 2), y: r(q.y - o.len / 2 - 6), width: r(gw), height: r(o.len + 12), rx: r(gw / 2), fill: '#b9c2ca', stroke: '#8f9aa4', 'stroke-width': 1.6})));
  const screws = [[b.x + 13, b.y + 13], [b.x + b.w - 13, b.y + 13], [b.x + 13, b.y + b.h - 13], [b.x + b.w - 13, b.y + b.h - 13]]
    .map(([x, y]) => h('circle', {cx: r(x), cy: r(y), r: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.4}));
  // optional dashed outlines of the parts the tray holds (they show once a part has been taken out)
  const ghosts = (o.ghosts || []).map(q => h('path', {d: boltPath(q.profile, o.bw, o.len), transform: T(q.tip.x, q.tip.y, q.angle), fill: '#e6eaee', stroke: '#6f7c88', 'stroke-width': 2.2, 'stroke-dasharray': '7 6', 'stroke-linejoin': 'round'}));
  return g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(b.x + 7, b.y + 10, b.w, b.h, 16), fill: th.shadow}),
    h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 16), fill: '#dfe4e9', stroke: th.ink, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(b.x + 7, b.y + 7, b.w - 14, b.h - 14, 11), fill: '#eef1f4', stroke: '#c5ccd3', 'stroke-width': 2}),
    head, grooves, ghosts, screws, o.extra || null);
}
