/**
 * Kit for the "Orden de documentos" motif (contract-terms-09, LAW-0513..0516). Original art, fields and small pure
 * helpers only: every entry owns its own staging, layout, timeline and semantics.
 *  - story (0513): a desk seen from above — a sliding loupe walks up the supplied order list on the contract while one
 *    hand carries the annex binders, last-listed first, onto a tray, so that they pile up in a cascade with the
 *    first-listed annex on top; numbered plates on the tray edge name each level;
 *  - mechanism (0514): an exploded isometric stack — the order list on the contract, the annex layers (capas) floating
 *    apart; plain connectors anchor each list line to its layer, a tracer walks the list, the layers drop onto the base
 *    plate in the listed order and a lens enlarges the focus layer;
 *  - contrast (0515): two identical tiered letter trays seen from the side; only the supplied position of one annex in
 *    the order list differs (listed first vs configured last), so its folder slides into a different tier;
 *  - inspect (0516): a clipboard and a shelf of binders seen spine-on; a lens isolates the position number of one annex
 *    in the order list, the supplied number is substituted and only that binder changes level.
 *
 * Objects: the CONTRACT (paper with a head band and the supplied order-of-documents clause: heading, supplied text and
 * the order list — one line per position, a numbered disc, the annex tab letter in its colour and the annex label),
 * the ANNEXES (binders / layers / folders / spines in four neutral hues — blue, ochre, violet, teal; never red/green),
 * the LUPA (a loupe) and the stacked LAYERS (capas).
 * Legal content: the order shown is only the supplied order list. No interpretation doctrine, no statement that one
 * document prevails, governs or wins beyond the supplied position, no conflict rule, no jurisdiction. The two compared
 * readings — "Priority document (as supplied)" and "Subordinate document, as configured" — have equal visual weight.
 * Positions are shown by numbers and, with labels hidden, by pips (1 pip = position 1).
 * @module animations/contract-terms/kits/orden-documentos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, int} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {fitG, txt, chipG, unitPx, localizeScene, overlaps} from './terminacion-comunicaciones.js';

export {fitG, txt, chipG, unitPx, localizeScene, overlaps, T, shade};
export const INK = '#1f2328';
export const HUES = ['#3f6e9a', '#c99a3c', '#7a5c8e', '#3f8a85'];
export const HUE_SOFT = ['#d6e3ef', '#f4e6c4', '#e4dbea', '#d3e8e5'];
export const BRASS = '#c99a3c';

/* ------------------------------------------------------------------------ */
/* Fields, defaults, strings                                                 */
/* ------------------------------------------------------------------------ */

export const contractField = obj('The contract sheet', {
  reference: str('Reference printed on the contract (fictional)', 32),
  title: str('Heading of the contract, as supplied (generic, e.g. "Services contract (fictional)")', 70),
}, ['reference', 'title']);
export const clauseField = obj('The supplied order-of-documents clause (generic, fictional placeholder; never real contract text)', {
  heading: str('Heading of the clause, as supplied (e.g. "Order of documents clause")', 60),
  text: str('Supplied clause text introducing the order list (e.g. "Documents rank in the order listed (supplied text)")', 80),
}, ['heading', 'text']);
export const schedulesField = list('The annexes (schedules) attached to the contract, in their supplied numbering', obj('An annex', {
  tab: str('Tab letter printed on the annex (e.g. "A")', 3),
  label: str('Label of the annex, as supplied (e.g. "Annex A · Technical scope")', 50),
}, ['tab', 'label']), 2, 4);
export const prioritiesField = list('The supplied order list: annex numbers (1 = first annex in the list above) from position 1 downwards. Missing annexes are appended in their numbering; repeats and out-of-range numbers are ignored', int('Annex number', 1, 4), 1, 4);
export const stateLabelsField = obj('Wording of the two compared readings (equal weight)', {
  priority: str('Label for the document listed in position 1, as supplied (e.g. "Priority document (as supplied)")', 60),
  subordinate: str('Label for a document placed lower by the configuration (e.g. "Subordinate document, as configured")', 60),
}, ['priority', 'subordinate']);

export const CONTENT = {
  contract: {reference: 'CT-208', title: 'Services contract (fictional)'},
  clause: {heading: 'Order of documents clause', text: 'Documents rank in the order listed (supplied text)'},
  schedules: [
    {tab: 'A', label: 'Annex A · Technical scope'},
    {tab: 'B', label: 'Annex B · Price list'},
    {tab: 'C', label: 'Annex C · Service levels'},
  ],
  priorities: [2, 1, 3],
  stateLabels: {priority: 'Priority document (as supplied)', subordinate: 'Subordinate document, as configured'},
};
export const CONTENT_ES = {
  contract: {reference: 'CT-208', title: 'Contrato de servicios (ficticio)'},
  clause: {heading: 'Cláusula de orden de documentos', text: 'Los documentos se ordenan según la lista (texto aportado)'},
  schedules: [
    {tab: 'A', label: 'Anexo A · Alcance técnico'},
    {tab: 'B', label: 'Anexo B · Lista de precios'},
    {tab: 'C', label: 'Anexo C · Niveles de servicio'},
  ],
  priorities: [2, 1, 3],
  stateLabels: {priority: 'Documento prioritario (según lo aportado)', subordinate: 'Documento subordinado, según la configuración'},
};

export const KIT_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', pos: 'Position', was: 'was'},
  es: {key: 'Según lo aportado · sin conclusión', pos: 'Posición', was: 'antes'},
};

/**
 * The supplied order: schedule indices (0-based) from position 1 downwards. Valid, unique entries of `priorities`
 * first, then any annex not listed, in its numbering.
 */
export function orderOf(p) {
  const n = p.schedules.length;
  const out = [];
  for (const v of p.priorities || []) { const i = (v | 0) - 1; if (i >= 0 && i < n && !out.includes(i)) out.push(i); }
  for (let i = 0; i < n; i++) if (!out.includes(i)) out.push(i);
  return out;
}
const GL = '\u2017';
/**
 * fitG with short tokens (≤ 2 characters, e.g. the annex letter "B" or "·") glued to the word before them, so a label
 * never wraps as "Annex / B · Price". The glue character is measured (slightly wider than a space) and drawn as a space.
 */
export function fitK(text, o) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ');
  const out = [];
  for (const w of words) { if (out.length && w.length <= 2) out[out.length - 1] += GL + w; else out.push(w); }
  const f = fitG(out.join(' '), o);
  if (!out.some(w => w.includes(GL))) return f;
  return {...f, lines: f.lines.map(l => l.split(GL).join(' ')), full: String(text ?? '')};
}
export const longest = arr => arr.reduce((a, b) => (String(b).length > String(a).length ? b : a), '');
export const hueOf = i => HUES[i % HUES.length];
export const softOf = i => HUE_SOFT[i % HUE_SOFT.length];

/* ------------------------------------------------------------------------ */
/* Glyphs                                                                     */
/* ------------------------------------------------------------------------ */

/** Pips for a position (1..4): small dots in a row — the label-free reading of a position number. */
export function pips(cx, cy, k, R, fill = INK) {
  const out = [];
  const gap = R * 2.6;
  for (let i = 0; i < k; i++) out.push(h('circle', {cx: r(cx + (i - (k - 1) / 2) * gap), cy: r(cy), r: r(R), fill}));
  return out;
}

/** A position disc: number when labels show, pips otherwise. Same art for every position. */
export function positionDisc(ctx, x, y, R, k, show, o = {}) {
  const F = R * 1.15;
  return g({name: o.name, opacity: o.opacity},
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: o.fill ?? '#fffaf0', stroke: INK, 'stroke-width': 2.4}),
    show
      ? h('text', {x: r(x), y: r(y + F * 0.36), 'text-anchor': 'middle', 'font-size': r(F, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: INK}, String(k))
      : pips(x, y, k, Math.max(2.6, R * (k > 2 ? 0.15 : 0.2))),
  );
}

/** Annex tab chip: the tab letter on the annex colour (a coloured square without the letter when labels are hidden). */
export function tabChip(ctx, x, y, s, i, letter, show) {
  const fill = hueOf(i);
  return g(null,
    h('rect', {x: r(x), y: r(y), width: r(s), height: r(s), rx: r(s * 0.2), fill, stroke: INK, 'stroke-width': 2}),
    show ? h('text', {x: r(x + s / 2), y: r(y + s * 0.76), 'text-anchor': 'middle', 'font-size': r(s * 0.74, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, letter)
      : h('path', {d: `M${r(x + s * 0.3)} ${r(y + s * 0.5)}h${r(s * 0.4)}`, stroke: '#ffffff', 'stroke-width': r(s * 0.12), 'stroke-linecap': 'round'}),
  );
}

/* ------------------------------------------------------------------------ */
/* The contract with its order list                                          */
/* ------------------------------------------------------------------------ */

/**
 * Text of the contract card for width w. `rowLabel(k, i)` gives the text of the list line at position k (annex i).
 * o.lead = width reserved at the left of each row (ruler/loupe), o.listOnly = draw only the order list (no clause text).
 */
export function cardText(p, order, w, F, minF, o = {}) {
  const padX = 34;
  const lead = o.lead ?? 0;
  const stress = !!o.stress;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: w - padX * 2, size: F, minSize: minF, maxLines: stress ? 4 : 2, weight: 700});
  const headH = head.height + F * 0.9;
  const heading = fitG(p.clause.heading, {maxWidth: w - padX * 2 - 30, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const text = o.noText ? null : fitG(p.clause.text, {maxWidth: w - padX * 2, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 500});
  const disc = F * 0.9;
  const tab = F * 1.4;
  const rowX = padX + lead;
  const labelX = rowX + disc * 2 + 12 + tab + 12;
  const labelW = w - labelX - 22 - (o.rightPad ?? 0);
  const rows = order.map((si, k) => fitK(o.rowText ? o.rowText(k, si) : p.schedules[si].label, {maxWidth: labelW, size: F, minSize: minF, maxLines: stress ? 5 : 3, weight: 600}));
  const rowH = rows.map(f => Math.max(f.height, disc * 2, tab) + F * 0.8);
  const headingY = headH + F * 0.75;
  const textY = headingY + heading.height + F * 0.45;
  const listY = text ? textY + text.height + F * 0.8 : textY + F * 0.2;
  const listH = rowH.reduce((a, b) => a + b, 0) + F * 0.35 * (rows.length - 1);
  const need = listY + listH + F * 0.9;
  const bad = head.bad || heading.bad || (text && text.bad) || rows.some(f => f.bad);
  return {padX, lead, head, headH, heading, headingY, text, textY, disc, tab, rowX, labelX, labelW, rows, rowH, listY, listH, need, bad, w};
}

/** Row placement inside a card of height hh: [{y, h}], spreading into spare room (bounded). */
export function placeCardRows(C, hh, F, o = {}) {
  const n = C.rows.length;
  const base = C.rowH.reduce((a, b) => a + b, 0);
  const avail = hh - C.listY - F * 0.9;
  const spare = Math.max(0, avail - base - F * 0.35 * (n - 1));
  const grow = Math.min(spare * 0.55 / n, F * (o.maxGrow ?? 2.4));
  const gap = Math.min(F * 0.35 + (spare - grow * n) * 0.6 / Math.max(1, n - 1), F * 1.8);
  let y = C.listY;
  return C.rows.map((fit, k) => { const row = {y, h: C.rowH[k] + grow, fit}; y += row.h + gap; return row; });
}

/**
 * The contract card (local origin = top-left). Rows named `${P}row${k}`; `${P}rowHi${k}` is a highlight frame (opacity
 * driven by the entry). o.rowText overrides a row's text node (for entries that substitute a datum).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, C:any, rows:Array<{y:number,h:number,fit:any}>, order:number[], show:boolean, p:any, ruler?:boolean, skipRows?:number[]}} o
 */
export function contractCard(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, C, p} = o;
  const P = o.prefix ?? '';
  const parts = [
    h('rect', {x: 10, y: 14, width: w, height: hh, rx: 12, fill: th.shadow}),
    h('rect', {x: 0, y: 0, width: w, height: hh, rx: 12, fill: '#fffdf7', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(0, 0, w, C.headH, 12), fill: '#dfe6d6'}),
    h('path', {d: `M0 ${r(C.headH)}H${r(w)}`, stroke: INK, 'stroke-width': 2}),
  ];
  if (o.show) parts.push(txt(C.head, {x: C.padX, y: (C.headH - C.head.height) / 2, fill: INK}));
  else parts.push(h('path', {d: `M${r(C.padX)} ${r(C.headH / 2)}h${r(Math.min(w * 0.55, 300))}`, stroke: '#a9b89c', 'stroke-width': 11, 'stroke-linecap': 'round'}));
  // clause heading on a folded corner tab
  const ty = C.headingY - 8, tabH = C.heading.height + 16;
  const tabW = (o.show ? C.heading.width : Math.min(w * 0.45, 260)) + 40;
  parts.push(h('path', {d: `M${r(C.padX - 14)} ${r(ty)}H${r(C.padX - 14 + tabW)}L${r(C.padX - 14 + tabW + 14)} ${r(ty + tabH / 2)}L${r(C.padX - 14 + tabW)} ${r(ty + tabH)}H${r(C.padX - 14)}Z`, fill: '#e9e0f2', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  if (o.show) parts.push(txt(C.heading, {x: C.padX + 4, y: C.headingY, fill: INK}));
  else parts.push(h('path', {d: `M${r(C.padX + 4)} ${r(ty + tabH / 2)}h${r(tabW - 50)}`, stroke: '#b9a8cc', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  if (C.text) {
    if (o.show) parts.push(txt(C.text, {x: C.padX, y: C.textY, fill: '#3b3f45'}));
    else for (let i = 0; i < C.text.lines.length; i++) parts.push(h('path', {d: `M${r(C.padX)} ${r(C.textY + i * C.text.lineHeight + C.text.size * 0.5)}h${r((w - C.padX * 2) * (0.85 - i * 0.2))}`, stroke: '#e3dccd', 'stroke-width': 8, 'stroke-linecap': 'round'}));
  }
  if (o.ruler) {
    const y0 = o.rows[0].y - 6, y1 = o.rows[o.rows.length - 1].y + o.rows[o.rows.length - 1].h + 6;
    const rx = C.padX + C.lead * 0.35;
    parts.push(h('rect', {x: r(rx - 6), y: r(y0), width: 12, height: r(y1 - y0), rx: 6, fill: shade(BRASS, 0.25), stroke: INK, 'stroke-width': 2}));
  }
  o.rows.forEach((row, k) => {
    const si = o.order[k];
    const cy = row.y + row.h / 2;
    const skip = (o.skipRows || []).includes(k);
    parts.push(g({name: `${P}row${k}`},
      h('rect', {x: r(C.rowX - 8), y: r(row.y), width: r(w - C.rowX - 14), height: r(row.h), rx: 8, fill: '#ffffff', stroke: '#d8ceb9', 'stroke-width': 1.6}),
      positionDisc(ctx, C.rowX + C.disc + 4, cy, C.disc, k + 1, o.show),
      tabChip(ctx, C.rowX + C.disc * 2 + 16, cy - C.tab / 2, C.tab, si, p.schedules[si].tab, o.show),
      skip ? null : o.show ? txt(row.fit, {x: C.labelX, y: cy - row.fit.height / 2, fill: INK}) : h('path', {d: `M${r(C.labelX)} ${r(cy)}h${r(Math.min(C.labelW - 20, 220))}`, stroke: '#cfc5b0', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    ));
    parts.push(h('rect', {name: `${P}rowHi${k}`, x: r(C.rowX - 13), y: r(row.y - 5), width: r(w - C.rowX - 4), height: r(row.h + 10), rx: 11, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}));
  });
  return g({name: `${P}card`}, parts);
}

/* ------------------------------------------------------------------------ */
/* The annexes                                                               */
/* ------------------------------------------------------------------------ */

/**
 * A ring binder seen from above (story). Local origin = top-left. The label band (white paper strip) sits at the
 * bottom of the cover so the binder can be piled in a cascade with only its band showing. Size w × hh, band height bandH.
 */
export function binderTop(ctx, o) {
  const {w, h: hh, bandH, i} = o;
  const hue = hueOf(i);
  const s = o.tabS;
  const spine = s + 14;
  const by = hh - bandH;
  const parts = [
    h('rect', {x: 7, y: 9, width: r(w), height: r(hh), rx: 10, fill: ctx.theme.shadow}),
    h('rect', {x: 0, y: 0, width: r(w), height: r(hh), rx: 10, fill: hue, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: 0, y: 0, width: r(spine), height: r(hh), rx: 8, fill: shade(hue, -0.22), stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(spine + 12)} 14H${r(w - 14)}M${r(spine + 12)} 24H${r(w * 0.6)}`, stroke: shade(hue, 0.25), 'stroke-width': 3, 'stroke-linecap': 'round'}),
  ];
  // two rings on the spine above the band
  for (const fy of [0.3, 0.72]) {
    const y = by * fy;
    if (y > 14 && y < by - 14) parts.push(h('circle', {cx: r(spine / 2), cy: r(y), r: 5.5, fill: '#e9e2d3', stroke: INK, 'stroke-width': 1.6}));
  }
  parts.push(
    h('rect', {x: r(spine + 8), y: r(by + 6), width: r(w - spine - 16), height: r(bandH - 12), rx: 7, fill: '#fffdf7', stroke: INK, 'stroke-width': 2}),
    // the tab letter sits in a window on the spine, level with the band
    tabChip(ctx, 7, by + bandH / 2 - s / 2, s, i, o.tab, o.show),
  );
  const lx = spine + 22;
  if (o.show) parts.push(txt(o.fit, {x: lx, y: by + bandH / 2 - o.fit.height / 2, fill: INK}));
  else parts.push(h('path', {d: `M${r(lx)} ${r(by + bandH / 2)}h${r(Math.min(w - lx - 30, 200))}`, stroke: '#cfc5b0', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  return g({name: o.name, opacity: o.opacity, 'data-occludes': o.occludes ? 1 : undefined}, parts);
}

/** Label geometry of a binder band for width w. */
export function binderLabel(label, w, F, minF, stress) {
  const s = F * 1.4;
  const lw = w - (s + 14 + 22) - 22;
  return {fit: fitK(label, {maxWidth: lw, size: F, minSize: minF, maxLines: stress ? 5 : 3, weight: 700}), tabS: s};
}

/* ------------------------------------------------------------------------ */
/* The loupe                                                                 */
/* ------------------------------------------------------------------------ */

/** A round loupe: ring + glass + short handle at angle `a` (degrees). Origin = ring centre. */
export function loupe(ctx, o) {
  const R = o.R;
  const a = ((o.a ?? 150) * Math.PI) / 180;
  const hx = Math.cos(a), hy = Math.sin(a);
  const L0 = R + 4, L1 = R + (o.handle ?? R * 1.4);
  return g({name: o.name, opacity: o.opacity},
    h('path', {d: `M${r(hx * L0)} ${r(hy * L0)}L${r(hx * L1)} ${r(hy * L1)}`, stroke: INK, 'stroke-width': r(R * 0.42 + 4), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(hx * L0)} ${r(hy * L0)}L${r(hx * L1)} ${r(hy * L1)}`, stroke: '#5a4636', 'stroke-width': r(R * 0.42), 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: 0, r: r(R), fill: '#eef8fa', 'fill-opacity': 0.25, stroke: INK, 'stroke-width': r(R * 0.2 + 3)}),
    h('circle', {cx: 0, cy: 0, r: r(R), fill: 'none', stroke: '#2d4f5c', 'stroke-width': r(R * 0.2)}),
    h('path', {d: `M${r(-R * 0.55)} ${r(-R * 0.3)}A${r(R * 0.62)} ${r(R * 0.62)} 0 0 1 ${r(-R * 0.15)} ${r(-R * 0.6)}`, fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.9}),
  );
}

/* ------------------------------------------------------------------------ */
/* Notes                                                                      */
/* ------------------------------------------------------------------------ */

/**
 * Greedy chip placement into free regions [{x, w, top, bottom}]. notes: [{name, text, worst?, kind}].
 * Returns {placed: [{q, c}], miss: [names]}.
 */
export function placeNotes(ctx, notes, regions, F, minF, stress, style = () => ({})) {
  const used = regions.map(rg => ({...rg, y: rg.top}));
  const placed = [], miss = [];
  for (const q of notes) {
    let ok = false;
    for (const rg of used) {
      if (rg.w < 150) continue;
      const opt = {x: rg.x, y: rg.y, maxWidth: rg.w, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, ...style(q)};
      const c0 = chipG(ctx, q.worst ?? q.text, opt);
      if (c0.bad || rg.y + c0.box.h > rg.bottom + 0.5) continue;
      const c = q.worst ? chipG(ctx, q.text, opt) : c0;
      placed.push({q, c});
      rg.y += c0.box.h + 14;
      ok = true;
      break;
    }
    if (!ok) miss.push(q.name);
  }
  return {placed, miss};
}

/** Leader from a chip box to a target point (hidden when it would be very long). */
export function leaderTo(ctx, name, b, t, max = 300) {
  const from = {x: clamp(t.x, b.x + 12, b.x + b.w - 12), y: clamp(t.y, b.y + 8, b.y + b.h - 8)};
  if (t.x < b.x) from.x = b.x; else if (t.x > b.x + b.w) from.x = b.x + b.w;
  else if (t.y < b.y) from.y = b.y; else if (t.y > b.y + b.h) from.y = b.y + b.h;
  if (Math.hypot(t.x - from.x, t.y - from.y) > max) return g({name, opacity: 0});
  return g({name, opacity: 0},
    h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(t.x)} ${r(t.y)}`, stroke: ctx.theme.inkSoft, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(t.x), cy: r(t.y), r: 6, fill: ctx.theme.inkSoft, stroke: '#fff', 'stroke-width': 2}),
  );
}

export const P2 = q => ({x: r(q.x), y: r(q.y)});
export const box2 = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
