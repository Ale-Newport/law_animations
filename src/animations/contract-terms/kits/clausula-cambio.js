/**
 * Kit for the "Cláusula de cambio" motif (contract-terms-10, LAW-0517..0520). Original art, the track-scene geometry
 * and small pure helpers only: every entry owns its own staging, timeline and semantics.
 *  - story (0517): a loupe reads the contract's change clause; the procedure track it sets out lights up (start tray →
 *    one station per supplied step); the amendment sheet slides out of the tray and travels the track: at each station a
 *    press head lowers onto its edge and leaves one layer tab; after the last station the sheet joins the contract and a
 *    binder clip closes over it;
 *  - mechanism (0518): exploded layers — the contract slab at the base, the change-clause tab on it, a column of step
 *    gates rising from the tab; the amendment layer descends through the gates (each adds an edge layer) and settles on
 *    the slab as a new top layer;
 *  - contrast (0519): two identical desks (contract, short track, the same proposal card in the tray); one fact differs —
 *    the route of the card: A travels the track and is clipped to the contract; B is set down beside the contract
 *    without the track; neutral note, no conclusion;
 *  - inspect (0520): the story's end state; the context steps aside (scale ≥ 0.5) and a lens isolates one station's step
 *    plate; its supplied wording is substituted; back in context with the Δ marker.
 *
 * Objects: the CONTRACT (contrato: sheet with head band, the change-clause block — cláusulas — and filler lines), the
 * AMENDMENT SHEET (propuesta de modificación, with layer tabs — capas), the STATIONS of the supplied procedure (gantry,
 * press head with step pips, stop pad, lamp, step plate), the START TRAY, the BINDER CLIP and the LOUPE (lupa).
 * Legal content: only the supplied steps are drawn; no doctrine on the validity or effect of a documented or an informal
 * change; "informal" stays a neutral, supplied label; fictional names only.
 * @module animations/contract-terms/kits/clausula-cambio
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, obj, list} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {fitG, txt, chipG, unitPx, localizeScene} from './terminacion-comunicaciones.js';

export {fitG, txt, chipG, unitPx, localizeScene, T};
export const INK = '#1f2328';

/* ------------------------------------------------------------------------ */
/* Fields, defaults, strings                                                 */
/* ------------------------------------------------------------------------ */

export const contractField = obj('The contract sheet', {
  reference: str('Reference printed on the contract (fictional)', 32),
  title: str('Heading of the contract, as supplied (generic, e.g. "Supply contract (fictional)")', 70),
}, ['reference', 'title']);
export const clauseField = str('Heading of the change clause, as supplied (generic, e.g. "Clause 18 · Changes procedure"; never real contract text)', 64);
export const stepsField = list('The steps of the agreed change procedure, as supplied (one station each, in order; generic, fictional wording)', str('A step, as supplied', 60), 2, 4);
export const proposalField = str('Label printed on the amendment proposal sheet (objectLabels; fictional, e.g. "Amendment 1 (fictional)")', 48);

export const CONTENT = {
  contract: {reference: 'CT-517', title: 'Supply contract (fictional)'},
  clause: 'Clause 18 · Changes procedure',
  steps: ['Proposal in writing', 'Reviewed by both parties', 'Signed by both parties'],
  proposal: 'Amendment 1 (fictional)',
};
export const CONTENT_ES = {
  contract: {reference: 'CT-517', title: 'Contrato de suministro (ficticio)'},
  clause: 'Cláusula 18 · Procedimiento de cambio',
  steps: ['Propuesta por escrito', 'Revisada por ambas partes', 'Firmada por ambas partes'],
  proposal: 'Modificación 1 (ficticia)',
};
export const KIT_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn'},
  es: {key: 'Según lo aportado · sin conclusión'},
};

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export const longest = arr => arr.reduce((a, b) => (String(b).length > String(a).length ? b : a), '');
export const bx = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});

/* ------------------------------------------------------------------------ */
/* Glyphs (text-free identifiers)                                            */
/* ------------------------------------------------------------------------ */

/** Change glyph: a small page with a pencil across it, centred at (x, y), half-size s. */
export function changeGlyph(x, y, s, col = '#fff', sw = 2.4) {
  return g(null,
    h('path', {d: `M${r(x - s * 0.75)} ${r(y - s * 0.9)}H${r(x + s * 0.35)}L${r(x + s * 0.75)} ${r(y - s * 0.5)}V${r(y + s * 0.9)}H${r(x - s * 0.75)}Z`, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x - s * 0.35)} ${r(y + s * 0.55)}L${r(x + s * 0.95)} ${r(y - s * 0.75)}`, stroke: col, 'stroke-width': r(sw * 1.9), 'stroke-linecap': 'round'}),
  );
}
/** Row of k pips (the step index without text), centred at (x, y). */
export function pips(k, x, y, R, col) {
  const gap = R * 2.8;
  const x0 = x - ((k - 1) * gap) / 2;
  return g(null, Array.from({length: k}, (_, i) => h('circle', {cx: r(x0 + i * gap), cy: r(y), r: r(R), fill: col, stroke: INK, 'stroke-width': 1.4})));
}

/* ------------------------------------------------------------------------ */
/* Art                                                                       */
/* ------------------------------------------------------------------------ */

/**
 * The contract: shadow, a sheet behind, folded corner, head band with the heading, the change-clause block (glyph disc,
 * heading, simulated lines) and filler lines elsewhere (also under the attach area). Local origin = top-left.
 * `prefix` names the clause highlight `${prefix}clause-hl` (opacity 0 at rest).
 * @param {any} ctx
 * @param {{w:number, h:number, head:any, headH:number, clause:{x:number,y:number,w:number,h:number,fit:any}, attach:{x:number,y:number,w:number,h:number}, showText:boolean, prefix?:string, discR:number}} o
 */
export function contractDoc(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, clause: c} = o;
  const fold = Math.min(42, w * 0.08);
  const R = o.discR;
  const parts = [
    h('rect', {x: 10, y: 14, width: r(w), height: r(hh), rx: 10, fill: th.shadow}),
    h('rect', {x: 8, y: 6, width: r(w - 4), height: r(hh), rx: 10, fill: '#ece5d6', stroke: INK, 'stroke-width': 2, transform: `rotate(-1.1 ${r(w / 2)} ${r(hh / 2)})`}),
    h('path', {d: `M10 0H${r(w - fold)}L${r(w)} ${r(fold)}V${r(hh - 10)}Q${r(w)} ${r(hh)} ${r(w - 10)} ${r(hh)}H10Q0 ${r(hh)} 0 ${r(hh - 10)}V10Q0 0 10 0Z`, fill: '#fdfbf5', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w - fold)} 0V${r(fold - 8)}Q${r(w - fold)} ${r(fold)} ${r(w - fold + 8)} ${r(fold)}H${r(w)}`, fill: '#e9e0cc', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M10 2H${r(w - fold - 2)}V${r(o.headH - 1)}H2V10Q2 2 10 2Z`, fill: th.accent4Soft, opacity: 0.9}),
    h('path', {d: `M2 ${r(o.headH)}H${r(w - 2)}`, stroke: INK, 'stroke-width': 2}),
  ];
  const hx = o.headX ?? 22;
  if (o.showText) parts.push(txt(o.head, {x: hx, y: (o.headH - o.head.height) / 2, fill: INK}));
  else parts.push(h('path', {d: `M${r(hx)} ${r(o.headH / 2)}h${r(Math.min(w - hx - 60, w * 0.55, 300))}`, stroke: shade(th.accent4Soft, -0.3), 'stroke-width': 11, 'stroke-linecap': 'round'}));
  // filler lines outside the clause block (they continue under the attach area)
  const fl = [];
  const inClause = (x0, x1, y) => y > c.y - 14 && y < c.y + c.h + 14 && x1 > c.x - 10 && x0 < c.x + c.w + 10;
  for (let y = o.headH + 26, k = 0; y < hh - 18; y += 24, k++) {
    const x0 = 22, x1 = w - 22 - (k % 3) * w * 0.07;
    if (!inClause(x0, x1, y)) fl.push(`M${r(x0)} ${r(y)}H${r(x1)}`);
    else {
      if (c.x - 18 > x0 + 20) fl.push(`M${r(x0)} ${r(y)}H${r(c.x - 18)}`);
      if (c.x + c.w + 18 < x1 - 20) fl.push(`M${r(c.x + c.w + 18)} ${r(y)}H${r(x1)}`);
    }
  }
  if (fl.length) parts.push(h('path', {d: fl.join(''), stroke: '#e6dfcf', 'stroke-width': 5, 'stroke-linecap': 'round'}));
  // the change-clause block
  const textX = c.x + 18 + R * 2 + 14;
  const cf = [];
  const fy0 = c.y + 16 + Math.max(R * 2, c.fit.height) + 16;
  for (let y = fy0, k = 0; y < c.y + c.h - 12; y += 22, k++) cf.push(`M${r(c.x + 18)} ${r(y)}h${r((c.w - 36) * (0.94 - 0.2 * ((k * 3) % 4) / 3))}`);
  parts.push(g(null,
    o.prefix != null ? h('path', {name: `${o.prefix}clause-hl`, d: roundRectPath(c.x - 7, c.y - 7, c.w + 14, c.h + 14, 14), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3.5, opacity: 0}) : null,
    h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 10), fill: '#ffffff', stroke: '#cfc4ae', 'stroke-width': 2}),
    h('rect', {x: r(c.x), y: r(c.y), width: 9, height: r(c.h), rx: 4, fill: th.accent2}),
    h('circle', {cx: r(c.x + 18 + R), cy: r(c.y + 16 + R), r: r(R), fill: th.accent2, stroke: INK, 'stroke-width': 2.2}),
    changeGlyph(c.x + 18 + R, c.y + 16 + R, R * 0.55, '#fff', Math.max(2, R * 0.1)),
    o.showText
      ? txt(c.fit, {x: textX, y: c.y + 16 + Math.max(0, (R * 2 - c.fit.height) / 2), fill: INK})
      : h('path', {d: `M${r(textX)} ${r(c.y + 16 + R)}h${r(Math.min(c.w - (textX - c.x) - 20, 240))}`, stroke: '#cdbfa6', 'stroke-width': 10, 'stroke-linecap': 'round'}),
    cf.length ? h('path', {d: cf.join(''), stroke: '#e6dfcf', 'stroke-width': 5, 'stroke-linecap': 'round'}) : null,
  ));
  return g(null, parts);
}
/** Height a clause block needs for a fitted heading. */
export const clauseBlockH = (fit, R, fillerLines = 2) => 16 + Math.max(R * 2, fit.height) + 16 + fillerLines * 22;

/**
 * Tab positions on the amendment sheet's edge: 'top' (tabs stand up from the top edge) or 'right' (they stick out to
 * the right). Returns [{x, y, w, h}] in sheet-local coordinates (tab rectangles), plus the contact point of the press.
 */
export function tabSlots(n, sw, sh, edge, rev = false) {
  const t = clamp((edge === 'top' ? sw : sh) * 0.5 / n, 18, 40);
  const out = [];
  for (let k = 0; k < n; k++) {
    if (edge === 'top') {
      const cx = rev ? sw * (0.9 - 0.56 * (k + 0.5) / n) : sw * (0.34 + 0.56 * (k + 0.5) / n);
      out.push({x: cx - t / 2, y: -16, w: t, h: 22, cx, cy: 0});
    } else {
      const cy = sh * (0.24 + 0.62 * (k + 0.5) / n);
      out.push({x: sw - 6, y: cy - t / 2, w: 22, h: t, cx: sw, cy});
    }
  }
  return out;
}

/**
 * The amendment proposal sheet. Local origin = top-left; w × h. Header strip with a pencil glyph, the label, two
 * signature lines, a dog-ear; n layer tabs named `${name}-tab${k}` (opacity 0) on `edge`.
 * @param {any} ctx
 * @param {{w:number, h:number, fit:any, showText:boolean, name:string, n:number, edge:'top'|'right', headH:number}} o
 */
export function amendmentSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const ear = Math.min(26, w * 0.12);
  const tabs = tabSlots(o.n, w, hh, o.edge, o.rev);
  const sig = o.sig !== false;
  const labelY = o.headH + (hh - o.headH - (sig ? 34 : 4) - o.fit.height) / 2;
  return g({name: o.name},
    tabs.map((t, k) => g({name: `${o.name}-tab${k}`, opacity: 0},
      h('path', {d: roundRectPath(t.x, t.y, t.w, t.h, 5), fill: th.accent2, stroke: INK, 'stroke-width': 2}),
      o.edge === 'top'
        ? h('path', {d: `M${r(t.x + t.w * 0.3)} ${r(t.y + 6)}H${r(t.x + t.w * 0.7)}`, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round'})
        : h('path', {d: `M${r(t.x + t.w - 8)} ${r(t.y + t.h * 0.3)}V${r(t.y + t.h * 0.7)}`, stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round'}))),
    h('rect', {x: 7, y: 10, width: r(w), height: r(hh), rx: 8, fill: th.shadow}),
    h('path', {d: `M8 0H${r(w - 8)}Q${r(w)} 0 ${r(w)} 8V${r(hh - ear)}L${r(w - ear)} ${r(hh)}H8Q0 ${r(hh)} 0 ${r(hh - 8)}V8Q0 0 8 0Z`, fill: '#f6faff', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w)} ${r(hh - ear)}H${r(w - ear + 6)}Q${r(w - ear)} ${r(hh - ear)} ${r(w - ear)} ${r(hh - ear + 6)}V${r(hh)}Z`, fill: '#dbe6f1', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M8 2H${r(w - 8)}Q${r(w - 2)} 2 ${r(w - 2)} 8V${r(o.headH)}H2V8Q2 2 8 2Z`, fill: th.accent2Soft}),
    h('path', {d: `M2 ${r(o.headH)}H${r(w - 2)}`, stroke: INK, 'stroke-width': 1.8}),
    changeGlyph(14 + o.headH * 0.32, o.headH / 2, o.headH * 0.3, th.accent2, 2.2),
    o.showText
      ? txt(o.fit, {x: w / 2, y: labelY, anchor: 'middle', fill: INK})
      : h('path', {d: `M${r(w * 0.2)} ${r(labelY + o.fit.height / 2)}H${r(w * 0.8)}`, stroke: '#b9c7d6', 'stroke-width': 10, 'stroke-linecap': 'round'}),
    sig ? h('path', {d: `M${r(w * 0.1)} ${r(hh - 18)}H${r(w * 0.42)}M${r(w * 0.52)} ${r(hh - 18)}H${r(w * 0.8)}`, stroke: '#9aa7b4', 'stroke-width': 2.4, 'stroke-linecap': 'round'}) : null,
  );
}
/** Smallest sheet height for a fitted label. */
export const sheetMinH = (fit, headH) => headH + 14 + fit.height + 14 + 28;

/** Binder clip seen from above (jaw across the sheet edge at y = 0, wire handles above). Origin = jaw centre. */
export function binderClip(ctx, name, w) {
  const jh = w * 0.42;
  return g({name},
    h('path', {d: `M${r(-w * 0.32)} ${r(-jh * 0.4)}Q${r(-w * 0.36)} ${r(-jh * 1.5)} ${r(-w * 0.08)} ${r(-jh * 1.6)}M${r(w * 0.32)} ${r(-jh * 0.4)}Q${r(w * 0.36)} ${r(-jh * 1.5)} ${r(w * 0.08)} ${r(-jh * 1.6)}`, fill: 'none', stroke: '#8e98a3', 'stroke-width': 3.4, 'stroke-linecap': 'round'}),
    h('rect', {x: r(-w / 2 + 4), y: r(-jh / 2 + 6), width: r(w), height: r(jh), rx: 5, fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(-w / 2, -jh / 2, w, jh, 5), fill: '#3b4148', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(-w / 2 + 6)} ${r(-jh * 0.18)}H${r(w / 2 - 6)}`, stroke: '#7d8791', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
  );
}

/** Loupe (lupa): round glass, dark rim, a turned wooden handle toward −x+y. Origin = glass centre. */
export function loupe(ctx, name, R) {
  const hx = -Math.SQRT1_2, hy = Math.SQRT1_2;
  const p0 = {x: hx * (R + 6), y: hy * (R + 6)}, p1 = {x: hx * (R * 2.15), y: hy * (R * 2.15)};
  return g({name},
    h('circle', {cx: -6, cy: 12, r: r(R + 8), fill: INK, opacity: 0.12}),
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}L${r(p1.x)} ${r(p1.y)}`, stroke: INK, 'stroke-width': r(R * 0.44 + 4), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(p0.x)} ${r(p0.y)}L${r(p1.x)} ${r(p1.y)}`, stroke: '#946b3f', 'stroke-width': r(R * 0.44), 'stroke-linecap': 'round'}),
    h('circle', {cx: r(hx * R * 1.55), cy: r(hy * R * 1.55), r: r(R * 0.2), fill: '#c9a24a', stroke: INK, 'stroke-width': 1.6}),
    h('circle', {cx: 0, cy: 0, r: r(R), fill: '#e2f1f6', opacity: 0.3}),
    h('circle', {cx: 0, cy: 0, r: r(R * 1.06), fill: 'none', stroke: INK, 'stroke-width': r(R * 0.2 + 3)}),
    h('circle', {cx: 0, cy: 0, r: r(R * 1.06), fill: 'none', stroke: '#c9a24a', 'stroke-width': r(R * 0.12)}),
    h('path', {d: `M${r(R * 0.2)} ${r(-R * 0.62)}A${r(R * 0.65)} ${r(R * 0.65)} 0 0 1 ${r(R * 0.62)} ${r(-R * 0.2)}`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9}),
  );
}
export const loupeBox = (x, y, R) => ({x: x - R * 1.85, y: y - R * 1.25, w: R * 3.1, h: R * 3.1});

/** Start tray (open box seen from above, slightly in perspective) around a w × h pad at (0, 0). The lip is separate. */
export function trayBack(ctx, w, h0) {
  return g(null,
    h('rect', {x: -14, y: -10, width: r(w + 34), height: r(h0 + 30), rx: 12, fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(-18, -16, w + 36, h0 + 32, 12), fill: '#c9a47c', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(-8, -6, w + 16, h0 + 12, 8), fill: '#e2cfb4', stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: Array.from({length: 4}, (_, i) => `M${r(4)} ${r(h0 * (0.2 + i * 0.2))}H${r(w - 4)}`).join(''), stroke: '#cdb592', 'stroke-width': 3, 'stroke-linecap': 'round'}),
  );
}
export function trayLip(ctx, w, h0) {
  const ly = h0 * 0.8;
  return g(null,
    h('path', {d: `M-18 ${r(ly)}H${r(w + 18)}V${r(h0 + 4)}Q${r(w + 18)} ${r(h0 + 16)} ${r(w + 6)} ${r(h0 + 16)}H-6Q-18 ${r(h0 + 16)} -18 ${r(h0 + 4)}Z`, fill: '#c9a27a', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M-8 ${r(ly + 7)}H${r(w + 8)}`, stroke: '#e3c7a5', 'stroke-width': 3, 'stroke-linecap': 'round'}),
  );
}

/** Letter badge (A / B) drawn as strokes (no <text>). */
export function letterBadge(ctx, which, x, y, R) {
  const col = which === 'a' ? ctx.theme.accent2 : ctx.theme.accent3;
  const s = R * 0.55;
  const d = which === 'a'
    ? `M${r(x - s * 0.6)} ${r(y + s * 0.7)}L${r(x)} ${r(y - s * 0.75)}L${r(x + s * 0.6)} ${r(y + s * 0.7)}M${r(x - s * 0.33)} ${r(y + s * 0.15)}H${r(x + s * 0.33)}`
    : `M${r(x - s * 0.45)} ${r(y - s * 0.75)}V${r(y + s * 0.75)}H${r(x + s * 0.15)}Q${r(x + s * 0.6)} ${r(y + s * 0.75)} ${r(x + s * 0.6)} ${r(y + s * 0.38)}Q${r(x + s * 0.6)} ${r(y)} ${r(x + s * 0.1)} ${r(y)}H${r(x - s * 0.45)}M${r(x + s * 0.1)} ${r(y)}Q${r(x + s * 0.5)} ${r(y)} ${r(x + s * 0.5)} ${r(y - s * 0.38)}Q${r(x + s * 0.5)} ${r(y - s * 0.75)} ${r(x + s * 0.1)} ${r(y - s * 0.75)}H${r(x - s * 0.45)}`;
  return g(null,
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: col, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d, fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(3, R * 0.16)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
}

/* ------------------------------------------------------------------------ */
/* Notes strip (bottom chips)                                               */
/* ------------------------------------------------------------------------ */

/** Lay out note chips along the bottom of the design space. Returns {nh, place(y0) → [{q, c}], bad}. */
export function notesStrip(ctx, notes, F, minF, o = {}) {
  const D = ctx.design;
  const pad = o.pad ?? 14, gap = 12;
  const cols = notes.length > 1 ? Math.min(notes.length, o.cols ?? (ctx.view.shape === 'landscape' ? 3 : ctx.view.shape === 'square' || notes.length > 2 ? 2 : 1)) : 1;
  const cw = (D.w - pad * 2 - gap * (cols - 1)) / cols;
  const chipOf = (q, x, y) => chipG(ctx, q.text, {x, y, maxWidth: cw, size: Math.max(F * 0.95, minF), minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.fill ?? '#ffffff'});
  const rowsN = Math.ceil(notes.length / cols);
  const sizes = notes.map(q => chipOf(q, 0, 0).box.h);
  const nh = notes.length ? Array.from({length: rowsN}, (_, k) => Math.max(...sizes.slice(k * cols, k * cols + cols))).reduce((a, b) => a + b + gap, -gap) : 0;
  const place = () => {
    if (!notes.length) return {pl: null, bad: false};
    let ny = D.h - pad - nh, bad = false;
    const pl = [];
    for (let k = 0; k < rowsN; k++) {
      let rh = 0;
      notes.slice(k * cols, k * cols + cols).forEach((q, j) => { const c = chipOf(q, pad + j * (cw + gap), ny); if (c.bad) bad = true; rh = Math.max(rh, c.box.h); pl.push({q, c}); });
      ny += rh + gap;
    }
    return {pl, bad};
  };
  return {nh, place};
}

/* ------------------------------------------------------------------------ */
/* Track scene geometry (story; inspect context)                            */
/* ------------------------------------------------------------------------ */

/**
 * Geometry of the procedure-track scene in area A: the contract, the start tray, one station per step, the rail, the
 * stop positions of the amendment sheet, the attach spot on the contract, the loupe's rest and reading points.
 * Shapes: landscape — track row left, contract right, press from above, step plates below; square — track row on
 * top (step plates above the presses), contract below; portrait — track column (pads left, presses right of them,
 * step plates at the right), contract below.
 * @returns {object} geometry; `why` lists what did not fit.
 */
export function trackGeom(ctx, A, F, minF, p, o = {}) {
  const shape = ctx.view.shape;
  const stress = !!o.stress;
  const why = [];
  const n = p.steps.length;
  const discR = clamp(F * 1.05, 20, 28);
  const maxL = stress ? 3 : 2;
  const headTxt = `${p.contract.reference} · ${p.contract.title}`;
  const G = {shape, n, discR, why};
  const sheetHeadH = clamp(F * 1.5, 30, 40);
  if (shape === 'landscape') {
    const cw = A.w * 0.27;
    const C = {x: A.x + A.w - cw, y: A.y, w: cw, h: A.h};
    const head = fitG(headTxt, {maxWidth: cw - 44 - 30, size: F, minSize: minF, maxLines: maxL + 1, weight: 800});
    const headH = head.height + 28;
    const cl = {x: 18, w: cw - 36};
    const clFit = fitG(p.clause, {maxWidth: cl.w - 18 - discR * 2 - 14 - 14, size: F, minSize: minF, maxLines: 3, weight: 700});
    cl.y = headH + 20; cl.h = clauseBlockH(clFit, discR, 2); cl.fit = clFit;
    const x0 = A.x, x1 = C.x - 34;
    const slotW = (x1 - x0) / (n + 1);
    const sw = Math.min(slotW - 34, cw - 60, 300);
    const propFit = fitG(p.proposal, {maxWidth: sw - 24, size: F, minSize: minF, maxLines: 3, weight: 800});
    const stepFits = p.steps.map(s => fitG(s, {maxWidth: slotW - 14 - 30, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 700}));
    const plateTextH = Math.max(...stepFits.map(f => f.height));
    const plateH = plateTextH + 30 + 26;
    const padY = Math.max(A.y + cl.y + cl.h + 36, A.y + 190);
    const shMin = sheetMinH(propFit, sheetHeadH);
    const railGap = 26;
    const sh = Math.min(sw * 1.05, A.y + A.h - plateH - 22 - railGap - padY);
    if (sh < shMin) why.push('sheet-h');
    const railY = padY + sh + railGap * 0.55;
    const plateY = padY + sh + railGap + 12;
    const stops = [];
    for (let i = 0; i <= n; i++) stops.push({x: x0 + i * slotW + (slotW - sw) / 2, y: padY});
    const attach = {x: C.x + (cw - sw) / 2 + 6, y: padY + 4};
    if (attach.y + sh > A.y + A.h - 16) why.push('attach');
    const stations = p.steps.map((s, k) => {
      const sx = x0 + (k + 1) * slotW + 7;
      return {k, x: sx, w: slotW - 14, top: A.y + 4, plate: {x: sx, y: plateY, w: slotW - 14, h: A.y + A.h - plateY}, fit: stepFits[k], press: 'down'};
    });
    const band = A.y + A.h - plateY;
    const LR = clamp(Math.min(slotW / 3.4, (band - 6) / 3.1, 60), 26, 60);
    const loupeRest = {x: x0 + slotW / 2 + LR * 0.3, y: plateY + (band - LR * 3.1) / 2 + LR * 1.25};
    if (LR * 3.1 > band + 4) why.push('loupe');
    Object.assign(G, {C, head, headH, clause: cl, attachArea: {x: attach.x - C.x - 8, y: attach.y - C.y - 8, w: sw + 16, h: sh + 16}, slotW, sw, sh, sheetHeadH, propFit, stepFits, padY, railY, plateY, stops, attach, stations, LR, loupeRest, edge: 'top'});
    G.rail = [{x: C.x + 4, y: A.y + cl.y + cl.h / 2}, {x: C.x - 18, y: A.y + cl.y + cl.h / 2}, {x: C.x - 18, y: railY}, {x: stops[0].x + sw / 2, y: railY}];
  } else if (shape === 'square') {
    const ch0 = A.h * (stress ? 0.32 : 0.36);
    const C = {x: A.x, y: A.y + A.h - ch0, w: A.w, h: ch0};
    const head = fitG(headTxt, {maxWidth: C.w * 0.5 - 50, size: F, minSize: minF, maxLines: maxL + 1, weight: 800});
    const headH = head.height + 26;
    G.headX = 22;
    const cl = {x: 18, w: C.w * 0.5 - 30};
    const clFit = fitG(p.clause, {maxWidth: cl.w - 18 - discR * 2 - 14 - 14, size: F, minSize: minF, maxLines: 3, weight: 700});
    cl.y = headH + 18; cl.h = Math.max(clauseBlockH(clFit, discR, 1), Math.min(C.h - headH - 36, clauseBlockH(clFit, discR, 3))); cl.fit = clFit;
    if (cl.y + cl.h > C.h - 12) why.push('clause');
    const slotW = A.w / (n + 1);
    const sw = Math.min(slotW - 30, 280);
    const propFit = fitG(p.proposal, {maxWidth: sw - 22, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 800});
    const stepFits = p.steps.map(s => fitG(s, {maxWidth: slotW - 14 - 26, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 700}));
    const plateTextH = Math.max(...stepFits.map(f => f.height));
    const plateH = plateTextH + 30 + 24;
    const pressZone = stress ? 92 : 104;
    const padY = A.y + plateH + 14 + pressZone;
    const railGap = 24;
    const shMin = sheetMinH(propFit, sheetHeadH);
    const sh = Math.min(sw * 0.95, C.y - 30 - railGap - padY, C.h - headH - 26);
    if (sh < shMin) why.push('sheet-h');
    const railY = padY + sh + railGap * 0.55;
    const stops = [];
    for (let i = 0; i <= n; i++) stops.push({x: A.x + i * slotW + (slotW - sw) / 2, y: padY});
    const attach = {x: C.x + C.w * 0.5 + (C.w * 0.5 - sw) / 2, y: C.y + headH + 14};
    if (attach.y + sh > C.y + C.h - 8) why.push('attach');
    const stations = p.steps.map((s, k) => {
      const sx = A.x + (k + 1) * slotW + 7;
      return {k, x: sx, w: slotW - 14, top: A.y + plateH + 14, plate: {x: sx, y: A.y, w: slotW - 14, h: plateH}, fit: stepFits[k], press: 'down'};
    });
    const LR = clamp(slotW * 0.17, 34, 54);
    const loupeRest = {x: A.x + slotW * 0.6, y: A.y + LR * 1.5};
    Object.assign(G, {C, head, headH, clause: cl, attachArea: {x: attach.x - C.x - 8, y: attach.y - C.y - 8, w: sw + 16, h: sh + 16}, slotW, sw, sh, sheetHeadH, propFit, stepFits, padY, railY, stops, attach, stations, LR, loupeRest, edge: 'top', plateH});
    const last = stops[n];
    const rx = Math.min(last.x + sw / 2, C.x + C.w - 40);
    G.rail = [{x: C.x + cl.x + cl.w - 4, y: C.y + cl.y + 30}, {x: rx, y: C.y + cl.y + 30}, {x: rx, y: railY}, {x: stops[0].x + sw / 2, y: railY}];
    G.lastLeg = [{x: last.x, y: last.y}, {x: last.x, y: railY + 10}, {x: attach.x, y: attach.y}];
  } else {
    const C0h = A.h * (stress ? 0.27 : 0.29);
    const C = {x: A.x, y: A.y + A.h - C0h, w: A.w, h: C0h};
    const sw0 = Math.min(A.w * 0.4, 330);
    G.headX = 30 + sw0 + 34;
    const head = fitG(headTxt, {maxWidth: C.w - G.headX - 56, size: F, minSize: minF, maxLines: maxL + 1, weight: 800});
    const headH = head.height + 26;
    const cl = {x: C.w * 0.5 + 6, w: C.w * 0.5 - 24};
    const clFit = fitG(p.clause, {maxWidth: cl.w - 18 - discR * 2 - 14 - 14, size: F, minSize: minF, maxLines: 4, weight: 700});
    cl.y = headH + 18; cl.h = Math.max(clauseBlockH(clFit, discR, 1), Math.min(C.h - headH - 36, clauseBlockH(clFit, discR, 4))); cl.fit = clFit;
    if (cl.y + cl.h > C.h - 12) why.push('clause');
    const regionH = C.y - 26 - A.y;
    const slotH = regionH / (n + 1);
    const colX = A.x + 30;
    const sw = sw0;
    const propFit = fitG(p.proposal, {maxWidth: sw - 24, size: F, minSize: minF, maxLines: 3, weight: 800});
    const shMin = sheetMinH(propFit, sheetHeadH);
    const sh = Math.min(slotH - 34, sw * 0.8);
    if (sh < shMin) why.push('sheet-h');
    const pressZone = 96;
    const plateX = colX + sw + 22 + pressZone;
    const plateW = A.x + A.w - plateX;
    const stepFits = p.steps.map(s => fitG(s, {maxWidth: plateW - 30, size: F, minSize: minF, maxLines: 3, weight: 700}));
    const stops = [];
    for (let i = 0; i <= n; i++) stops.push({x: colX, y: A.y + i * slotH + (slotH - sh) / 2});
    const attach = {x: C.x + 30, y: C.y + headH + 14};
    if (attach.y + sh > C.y + C.h - 8) why.push('attach');
    if (attach.x + sw > C.x + cl.x - 12) why.push('attach-w');
    const stations = p.steps.map((s, k) => {
      const y = A.y + (k + 1) * slotH + 6;
      const ph = Math.max(stepFits[k].height + 30 + 22, slotH * 0.62);
      return {k, y, h: slotH - 12, top: y, plate: {x: plateX, y: y + (slotH - 12 - ph) / 2, w: plateW, h: ph}, fit: stepFits[k], press: 'left'};
    });
    if (stations.some(st => st.plate.h > slotH - 8)) why.push('plate-h');
    const railX = colX - 16;
    const LR = clamp(slotH * 0.22, 34, 56);
    const loupeRest = {x: plateX + plateW * 0.55, y: A.y + slotH * 0.5 - LR * 0.2};
    Object.assign(G, {C, head, headH, clause: cl, attachArea: {x: attach.x - C.x - 8, y: attach.y - C.y - 8, w: sw + 16, h: sh + 16}, slotH, sw, sh, sheetHeadH, propFit, stepFits, colX, railX, plateX, plateW, pressZone, stops, attach, stations, LR, loupeRest, edge: 'right'});
    G.rail = [{x: C.x + cl.x + cl.w * 0.5, y: C.y + 2}, {x: C.x + cl.x + cl.w * 0.5, y: C.y - 14}, {x: railX, y: C.y - 14}, {x: railX, y: stops[0].y + sh / 2}];
  }
  G.tabs = tabSlots(n, G.sw, G.sh, G.edge);
  G.reads = {x: G.C.x + G.clause.x + G.clause.w * 0.5, y: G.C.y + G.clause.y + G.clause.h * 0.5};
  G.railLen = G.rail.reduce((s, q, i) => (i ? s + Math.hypot(q.x - G.rail[i - 1].x, q.y - G.rail[i - 1].y) : 0), 0);
  // press geometry per station: rest and contact positions of the head (head = rect centred on (x, y))
  G.stations.forEach((st, k) => {
    const s = G.stops[k + 1], t = G.tabs[k];
    if (G.edge === 'top') {
      const hw = t.w + 40, hh = 60;
      st.head = {w: hw, h: hh};
      st.contact = {x: s.x + t.cx, y: s.y - hh / 2 + 10};
      st.rest = {x: s.x + t.cx, y: Math.min(st.contact.y - 46, st.top + 30 + hh / 2)};
      if (st.contact.y - st.rest.y < 30) why.push('press-travel');
    } else {
      const hw = 60, hh = t.h + 40;
      st.head = {w: hw, h: hh};
      st.contact = {x: s.x + G.sw + hw / 2 - 10, y: s.y + t.cy};
      st.rest = {x: st.contact.x + Math.max(36, G.pressZone - hw - 4), y: s.y + t.cy};
    }
  });
  [['head', G.head], ['clause', G.clause.fit], ['proposal', G.propFit], ...G.stepFits.map((f, i) => [`step${i}`, f])].forEach(([k, f]) => { if (f.bad) why.push(`text-${k}`); });
  return G;
}

/**
 * Static nodes of one station: gantry (or side bracket), stop pad, lamp `${pre}lamp${k}`, press group `${pre}press${k}`
 * (translate it in frame), the step plate with pips and text.
 */
export function stationNode(ctx, G, st, pre, show) {
  const th = ctx.theme;
  const k = st.k;
  const s = G.stops[k + 1];
  const P = st.plate;
  const parts = [];
  const pipR = clamp(G.discR * 0.32, 6, 9);
  // step plate
  const plate = g({name: `${pre}plate${k}`},
    h('rect', {x: r(P.x + 6), y: r(P.y + 8), width: r(P.w), height: r(P.h), rx: 10, fill: th.shadow}),
    h('path', {d: roundRectPath(P.x, P.y, P.w, P.h, 10), fill: '#fffdf7', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(P.x + 6, P.y + 6, P.w - 12, P.h - 12, 7), fill: 'none', stroke: th.accent2Soft, 'stroke-width': 3}),
    pips(k + 1, P.x + 16 + (k * pipR * 2.8) / 2 + pipR, P.y + 22, pipR, th.accent2),
    show ? g({name: `${pre}steptext${k}`}, txt(st.fit, {x: P.x + 15, y: P.y + 36 + Math.max(0, (P.h - 50 - st.fit.height) / 2), fill: INK})) : h('path', {d: `M${r(P.x + 15)} ${r(P.y + 46)}h${r(Math.min(P.w - 30, 150))}`, stroke: '#d6cfc0', 'stroke-width': 10, 'stroke-linecap': 'round'}),
  );
  // stop pad
  {
    const x0 = s.x - 9, y0 = s.y - 9, w0 = G.sw + 18, h0 = G.sh + 18, c = Math.min(26, G.sw * 0.14);
    parts.push(h('path', {d: roundRectPath(x0, y0, w0, h0, 12), fill: '#f2ede3', stroke: '#c9bfab', 'stroke-width': 2}));
    parts.push(h('path', {d: `M${r(x0 + 6)} ${r(y0 + 6 + c)}V${r(y0 + 6)}H${r(x0 + 6 + c)}M${r(x0 + w0 - 6 - c)} ${r(y0 + h0 - 6)}H${r(x0 + w0 - 6)}V${r(y0 + h0 - 6 - c)}M${r(x0 + w0 - 6 - c)} ${r(y0 + 6)}H${r(x0 + w0 - 6)}V${r(y0 + 6 + c)}M${r(x0 + 6)} ${r(y0 + h0 - 6 - c)}V${r(y0 + h0 - 6)}H${r(x0 + 6 + c)}`, fill: 'none', stroke: th.accent2Soft, 'stroke-width': 4, 'stroke-linecap': 'round'}));
  }
  if (G.edge === 'top') {
    const gx0 = st.x + 6, gx1 = st.x + st.w - 6;
    const by = st.top + 6;
    const bottom = G.railY + 4;
    parts.push(
      h('path', {d: `M${r(gx0)} ${r(by)}V${r(bottom)}M${r(gx1)} ${r(by)}V${r(bottom)}`, stroke: '#8a919a', 'stroke-width': 9, 'stroke-linecap': 'round'}),
      h('path', {d: roundRectPath(gx0 - 6, by - 8, gx1 - gx0 + 12, 18, 6), fill: '#6c747d', stroke: INK, 'stroke-width': 2}),
    );
    const lx = (gx0 + gx1) / 2 + (st.contact.x > (gx0 + gx1) / 2 ? -38 : 38);
    parts.push(h('circle', {cx: r(lx), cy: r(by + 1), r: 9, fill: '#d9dde1', stroke: INK, 'stroke-width': 1.6}), h('circle', {name: `${pre}lamp${k}`, cx: r(lx), cy: r(by + 1), r: 9, fill: th.accent2, stroke: INK, 'stroke-width': 1.6, opacity: 0}));
  } else {
    const bx0 = s.x + G.sw + 14, bx1 = G.plateX - 8;
    const cy = s.y + G.sh / 2;
    parts.push(
      h('path', {d: `M${r(bx0)} ${r(s.y - 2)}H${r(bx1)}M${r(bx0)} ${r(s.y + G.sh + 2)}H${r(bx1)}`, stroke: '#8a919a', 'stroke-width': 8, 'stroke-linecap': 'round'}),
      h('path', {d: roundRectPath(bx1 - 10, s.y - 10, 18, G.sh + 20, 6), fill: '#6c747d', stroke: INK, 'stroke-width': 2}),
      h('circle', {cx: r(bx1 - 1), cy: r(cy - G.sh * 0.42), r: 8, fill: '#d9dde1', stroke: INK, 'stroke-width': 1.6}),
      h('circle', {name: `${pre}lamp${k}`, cx: r(bx1 - 1), cy: r(cy - G.sh * 0.42), r: 8, fill: th.accent2, stroke: INK, 'stroke-width': 1.6, opacity: 0}),
    );
  }
  // press head (drawn at its rest position; frame translates by the offset)
  const H = st.head;
  const rod = G.edge === 'top'
    ? h('path', {d: `M0 ${r(-H.h / 2)}V${r(-H.h / 2 - 400)}`, stroke: '#59616a', 'stroke-width': 7})
    : h('path', {d: `M${r(H.w / 2)} 0H${r(H.w / 2 + 400)}`, stroke: '#59616a', 'stroke-width': 7});
  const clipLocal = `${pre}rodclip${k}`;
  const clipR = G.edge === 'top'
    ? {x: st.x, y: st.top + 4, w: st.w, h: G.padY + 14 - st.top - 4}
    : {x: s.x + G.sw - 14, y: s.y - 20, w: G.plateX - 8 - (s.x + G.sw - 14), h: G.sh + 40};
  const press = g({name: `${pre}press${k}`, transform: T(st.rest.x, st.rest.y)},
    rod,
    h('rect', {x: r(-H.w / 2 + 4), y: r(-H.h / 2 + 6), width: r(H.w), height: r(H.h), rx: 7, fill: th.shadow}),
    h('path', {d: roundRectPath(-H.w / 2, -H.h / 2, H.w, H.h, 7), fill: '#4a525b', stroke: INK, 'stroke-width': 2.2}),
    G.edge === 'top'
      ? h('path', {d: roundRectPath(-H.w / 2 + 5, H.h / 2 - 12, H.w - 10, 8, 3), fill: th.accent2})
      : h('path', {d: roundRectPath(-H.w / 2 + 4, -H.h / 2 + 5, 8, H.h - 10, 3), fill: th.accent2}),
    pips(k + 1, 0, G.edge === 'top' ? -6 : 0, Math.min(pipR, (H.w - 8) / ((k + 1) * 2.8 + 0.4) - 0.6), '#ffffff'),
  );
  return {
    under: g(null, h('defs', null, h('clipPath', {id: ctx.id(clipLocal)}, h('rect', {x: r(clipR.x), y: r(clipR.y), width: r(clipR.w), height: r(clipR.h)}))), parts),
    press: g({'clip-path': ctx.ref(clipLocal)}, press),
    plate,
  };
}

/** Rail (groove) and its lit overlay `${pre}rail-lit` (dash-drawn from the clause to the tray). */
export function railNode(ctx, G, pre, lit = 0) {
  const d = G.rail.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  const L = G.railLen;
  return g(null,
    h('path', {d, fill: 'none', stroke: '#cfc6b4', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d, fill: 'none', stroke: '#b2a68f', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {name: `${pre}rail-lit`, d, fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L + 2)} ${r(L + 40)}`, 'stroke-dashoffset': r((L + 2) * (1 - lit))}),
  );
}
export const railFrame = (pre, G, q) => ({[`${pre}rail-lit`]: {'stroke-dashoffset': r((G.railLen + 2) * (1 - clamp(q)))}});

/* ------------------------------------------------------------------------ */
/* Oblique (exploded-layer) art for the mechanism                           */
/* ------------------------------------------------------------------------ */

/** Top-face polygon of an oblique footprint: front-left (x, y), width w, depth offset (ox, -oy). */
export const facePts = (x, y, w, ox, oy) => [{x, y}, {x: x + w, y}, {x: x + w + ox, y: y - oy}, {x: x + ox, y: y - oy}];
export const ptsD = pts => pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('') + 'Z';

/**
 * Oblique slab (box seen from the front-top): top face, front face (height th), right side face. Origin = front-left
 * corner of the top face. Returns the group; the front face is a plain band where the caller may print text.
 */
export function obliqueSlab(o) {
  const {w, ox, oy, th} = o;
  const top = facePts(0, 0, w, ox, oy);
  return g({name: o.name},
    h('path', {d: ptsD([{x: 8, y: 14}, {x: w + 8, y: 14}, {x: w + ox + 8, y: 14 - oy}, {x: w + ox + 8, y: th + 14 - oy}, {x: w + 8, y: th + 14}, {x: 8, y: th + 14}]), fill: o.shadow}),
    h('path', {d: ptsD([{x: w, y: 0}, {x: w + ox, y: -oy}, {x: w + ox, y: th - oy}, {x: w, y: th}]), fill: o.side, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: ptsD([{x: 0, y: 0}, {x: w, y: 0}, {x: w, y: th}, {x: 0, y: th}]), fill: o.front, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: ptsD(top), fill: o.top, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    o.lines ? h('path', {d: o.lines, stroke: o.lineColor ?? '#e6dfcf', 'stroke-width': 4, 'stroke-linecap': 'round'}) : null,
  );
}

/**
 * Gate ring of one step (an oblique frame the amendment layer passes through), split into the part behind the layer
 * (`back`) and the part in front (`front`). Origin = front-left corner of the inner opening; the ring is `bw` wide.
 */
export function gateRing(ctx, o) {
  const {w, ox, oy, bw} = o;
  const outer = facePts(-bw, bw * 0.6, w + bw * 2, ox + bw * 0.4, oy + bw * 1.2);
  const inner = facePts(0, 0, w, ox, oy);
  const ring = ptsD(outer) + ptsD(inner);
  const frontStrip = ptsD([outer[0], outer[1], inner[1], inner[0]]);
  const fill = o.fill ?? '#c7ced6';
  return {
    back: g(null,
      h('path', {d: ring, 'fill-rule': 'evenodd', fill, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('path', {name: o.litName ? `${o.litName}-b` : undefined, d: ring, 'fill-rule': 'evenodd', fill: ctx.theme.accent2, opacity: 0}),
    ),
    front: g(null,
      h('path', {d: frontStrip, fill: shade(fill, 0.08), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('path', {name: o.litName ? `${o.litName}-f` : undefined, d: frontStrip, fill: ctx.theme.accent2, opacity: 0}),
      o.pips ? pips(o.pips, w / 2, bw * 0.3, Math.min(bw * 0.28, 6), '#ffffff') : null,
    ),
  };
}
