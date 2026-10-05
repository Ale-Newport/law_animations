/**
 * Motif kit for "Mapa de proposiciones" (evidence-analysis-01, LAW-0401..0404): geometry shared by the four entries —
 * the proposition board's card layout (claims along the top, labelled evidence along the bottom), link ports
 * (one eyelet per link on each card, spread so no two threads share a pin), the card nodes and the common legend rows.
 * Each entry owns its own staging, timeline and semantics.
 *
 * Legal: links are supplied by the author. A direct link is drawn as a solid thread, a disputed inference as a dashed
 * thread (same colour and weight). Nothing weighs evidence, judges credibility or applies a proof standard.
 * @module animations/evidence-analysis/kits/mapa-proposiciones
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {str, obj} from '../../../schemas/fields.js';
import {
  fitG, claimCardArt, evidenceArt, exhibitTag, pushpin, noteColors,
} from './analysis-art.js';

export const MP_LABELS_EN = {
  direct: 'Direct support (as supplied)',
  disputed: 'Disputed inference (as supplied)',
  key: 'Links as supplied · no weighing of evidence, no conclusion drawn',
};
export const MP_LABELS_ES = {
  direct: 'Apoyo directo (según lo aportado)',
  disputed: 'Inferencia discutida (según lo aportado)',
  key: 'Vínculos según lo aportado · sin valorar la prueba ni extraer conclusiones',
};

export const mpLabelFields = {
  labels: obj('Built-in captions of the link styles and the neutral key', {
    direct: str('Caption of a solid thread (link supplied as direct support)', 60),
    disputed: str('Caption of a dashed thread (link supplied as a disputed inference)', 60),
    key: str('Neutral key (nothing is weighed or concluded)', 110),
  }, ['direct', 'disputed', 'key']),
};

/**
 * Card layout on a board's inner area. Claims are spread along the top band, evidence cards along the bottom band
 * (inside `evRange`, a fraction range of the inner width). Ports: each link gets its own eyelet on its claim's lower
 * edge and on its evidence card's upper edge, ordered by the other end's x so threads do not cross at the cards.
 * @param {{x:number,y:number,w:number,h:number}} inner
 * @param {any} P  resolved params (claims, evidence)
 * @param {Array<{e:number,c:number,kind:string,n:number}>} links
 * @param {{evRange?:[number,number], claimRange?:[number,number], cardScale?:number}} [o]
 */
export function boardLayout(inner, P, links, o = {}) {
  const nC = P.claims.length, nE = P.evidence.length;
  const [ca, cb] = o.claimRange || [0, 1];
  const [ea, eb] = o.evRange || [0, 1];
  const pad = Math.min(inner.w, inner.h) * 0.06;
  const cw0 = (inner.w * (cb - ca) - pad * 2) / nC;
  const k = o.cardScale ?? 1;
  const cw = Math.min(cw0 * 0.8, inner.h * 0.5) * k;
  const ch = cw * 0.6;
  const ew0 = (inner.w * (eb - ea) - pad * 2) / nE;
  const ew = Math.min(ew0 * 0.5, inner.h * 0.3) * k;
  const eh = ew * 1.22;
  const tw = ew * 0.62, th = Math.max(26, ew * 0.3);
  const claims = P.claims.map((c, i) => {
    const cx = inner.x + inner.w * ca + pad + cw0 * (i + 0.5);
    const x = cx - cw / 2, y = inner.y + pad * 0.9;
    return {i, x, y, w: cw, h: ch, cx, pin: {x: cx, y: y + Math.max(8, ch * 0.08)}};
  });
  const evid = P.evidence.map((e, j) => {
    const cx = inner.x + inner.w * ea + pad + ew0 * (j + 0.5) - tw * 0.3;
    const y = inner.y + inner.h - pad * 0.6 - eh - th * 0.55;
    const x = cx - ew / 2;
    return {j, x, y, w: ew, h: eh, cx, kind: e.kind, pin: {x: x + ew * 0.16, y: y + Math.max(9, eh * 0.09)}, tag: {x: x + ew - ew * 0.06, y: y + eh * 0.62, tw, th}};
  });
  // ports
  const cPorts = claims.map(() => []), ePorts = evid.map(() => []);
  for (const l of links) { cPorts[l.c].push(l); ePorts[l.e].push(l); }
  const portOf = {};
  claims.forEach((C, i) => {
    const ls = cPorts[i].slice().sort((a, b) => evid[a.e].cx - evid[b.e].cx || a.n - b.n);
    ls.forEach((l, q) => {
      const fx = ls.length === 1 ? 0.5 : 0.2 + (0.6 * q) / (ls.length - 1);
      (portOf[l.n] = portOf[l.n] || {}).c = {dx: C.w * fx, dy: C.h - Math.max(6, C.h * 0.08)};
    });
    C.ports = ls.map(l => portOf[l.n].c.dx);
  });
  evid.forEach((E, j) => {
    const ls = ePorts[j].slice().sort((a, b) => claims[a.c].cx - claims[b.c].cx || a.n - b.n);
    ls.forEach((l, q) => {
      const fx = ls.length === 1 ? 0.66 : 0.42 + (0.46 * q) / (ls.length - 1);
      (portOf[l.n] = portOf[l.n] || {}).e = {dx: E.w * fx, dy: Math.max(7, E.h * 0.07)};
    });
    E.ports = ls.map(l => portOf[l.n].e.dx);
  });
  const ends = links.map(l => ({
    c: {x: claims[l.c].x + portOf[l.n].c.dx, y: claims[l.c].y + portOf[l.n].c.dy},
    e: {x: evid[l.e].x + portOf[l.n].e.dx, y: evid[l.e].y + portOf[l.n].e.dy},
    eLocal: portOf[l.n].e,
  }));
  return {inner, claims, evid, ends, portOf, cw, ch, ew, eh, tw, th, pad};
}

/**
 * Fit the ids printed on the cards (claim band, exhibit tag). `ok` = every id fits at >= floor.
 * @param {any} P
 * @param {ReturnType<typeof boardLayout>} BL
 * @param {number} s  render scale of the board (design units → frame px at 1080p ≈ 1)
 */
export function idFits(P, BL, s = 1) {
  const floor = 20 / s;
  const band = Math.max(26, BL.ch * 0.3);
  let ok = true;
  const claim = P.claims.map(c => {
    const f = fitG(c.id, {maxWidth: BL.cw * 0.62, size: Math.max(floor, band * 0.62), minSize: floor, maxLines: 1, weight: 800});
    if (!f.ok || band * 0.92 < f.size) ok = false;
    return f;
  });
  const ev = P.evidence.map(e => {
    const f = fitG(e.id, {maxWidth: BL.tw * 0.66, size: Math.max(floor, BL.th * 0.6), minSize: floor, maxLines: 1, weight: 800});
    if (!f.ok || BL.th * 0.95 < f.size) ok = false;
    return f;
  });
  return {claim, ev, ok};
}

/**
 * Card nodes (local origin = top-left of each card; the caller places them with a transform).
 * @param {any} ctx
 * @param {ReturnType<typeof boardLayout>} BL
 * @param {any} P
 * @param {{prefix:string, ids?:ReturnType<typeof idFits>|null, looks?:any[], pins?:boolean}} o
 */
export function cardNodes(ctx, BL, P, o) {
  const show = ctx.show('key') && o.ids;
  const claims = BL.claims.map((C, i) => g({name: `${o.prefix}-c${i}`, transform: T(C.x, C.y)},
    claimCardArt(ctx, {w: C.w, h: C.h, index: i, idFit: show ? o.ids.claim[i] : null, ports: C.ports}),
    o.pins !== false ? g({transform: T(C.w / 2, Math.max(8, C.h * 0.08))}, pushpin(Math.max(6, C.h * 0.075))) : null,
  ));
  const evid = BL.evid.map((E, j) => {
    const look = (o.looks || [])[j];
    return g({name: `${o.prefix}-e${j}`, transform: T(E.x, E.y)},
      evidenceArt(ctx, {kind: E.kind, w: E.w, h: E.h, ports: E.ports, look}),
      g({transform: T(E.w - E.w * 0.06, E.h * 0.62)}, exhibitTag(ctx, {tw: BL.tw, th: BL.th, idFit: show ? o.ids.ev[j] : null})),
      g({name: `${o.prefix}-e${j}-pin`, transform: T(E.w * 0.16, Math.max(9, E.h * 0.09)), opacity: o.pinOpacity ?? 1}, pushpin(Math.max(6, E.h * 0.06))),
    );
  });
  return {claims, evid};
}

/** Box of an evidence card including its hanging tag, at card position (x, y). */
export function evidenceBox(BL, x, y) {
  return {x: x - 6, y: y - 6, w: BL.ew * 0.94 + BL.tw * 1.25 + 12, h: Math.max(BL.eh, BL.eh * 0.62 + BL.th * 1.5) + 12};
}

/** Faint slot outlines where evidence cards will be pinned (solid, light: not a dispute marker). */
export function slotNodes(BL, name) {
  return g({name}, BL.evid.map(E => h('rect', {x: r(E.x - 4), y: r(E.y - 4), width: r(E.w + 8), height: r(E.h + 8), rx: 8, fill: '#000', opacity: 0.06})));
}

/* ------------------------------------------------------------------ */
/* Legend rows shared by the four entries                              */
/* ------------------------------------------------------------------ */

/** `E1 → P1 · caption` for a link. */
export function linkLine(P, l, kind = l.kind) {
  return `${P.evidence[l.e].id} → ${P.claims[l.c].id} · ${kind === 'disputed' ? P.labels.disputed : P.labels.direct}`;
}

/**
 * Rows: claims, evidence, links (optional), open points (optional).
 * @param {any} ctx
 * @param {any} P
 * @param {any[]} links
 * @param {{links?:boolean, open?:boolean, looks?:any[], skipLink?:number}} [o]
 */
export function contentRows(ctx, P, links, o = {}) {
  const rows = [];
  if (!ctx.show('key')) return rows;
  P.claims.forEach((c, i) => rows.push({kind: 'item', icon: 'claim', index: i, text: `${c.id} — ${c.text}`, name: `lg-c${i}`}));
  P.evidence.forEach((e, j) => rows.push({kind: 'item', icon: `ev-${e.kind}`, look: (o.looks || [])[j], text: `${e.id} — ${e.label}`, name: `lg-e${j}`}));
  if (o.links !== false) links.forEach(l => { if (l.n !== o.skipLink) rows.push({kind: 'item', icon: `line-${l.kind}`, text: linkLine(P, l), name: `lg-l${l.n}`}); });
  if (o.open !== false && ctx.show('all')) P.uncertainties.forEach((u, i) => rows.push({kind: 'item', icon: 'open', text: u, name: `lg-u${i}`}));
  return rows;
}

export {noteColors, clamp};
