/**
 * Kit for the "Cláusula de indemnidad" motif (contract-terms-07, LAW-0505..0508). Original art and small pure helpers
 * only: every entry owns its own staging, layout, timeline and semantics
 *  - story (0505): a desk seen from above — one hand carries the claim slip to the contract and plugs its brass prong
 *    into the socket of the supplied promise line, then reads the joint with a rectangular reading lens;
 *  - mechanism (0506): an exploded assembly along one axis — contract plate, clause plate and promise plate (capas)
 *    slide together, the claim's prong seats in the socket and a scope collar slides over the joint;
 *  - contrast (0507): two identical pegboard benches where the claim slides along a rail to the contract card and a
 *    brass caliper closes over the joint — only the supplied scope status differs (jaws closed / jaws held apart);
 *  - inspect (0508): a reading stand; the lens isolates the scope tag hanging from the joint and one supplied status
 *    is substituted.
 *
 * Objects: the CONTRACT (paper with a perforated binding strip, a head band, the clause heading on a ribbon tab and
 * the supplied clause lines; the line holding the supplied promise of cover carries a printed rail to a brass SOCKET on
 * the sheet edge), the CLAIM SLIP (a paper slip with a dotted tear-off stub and a brass PRONG; label as supplied, an
 * optional amount always labelled hypothetical), the READING LENS (lupa: a rectangular magnifier) and the SCOPE
 * OUTLINE (one closed line around the promise line and the claim).
 * Legal content (very high risk: indemnity): no indemnity doctrine, no statement on whether a claim is covered beyond
 * the supplied datum, no duty to pay, no amount unless supplied and labelled hypothetical, no outcome. The two supplied
 * statuses have equal weight: ● "claim covered as per supplied data" and ◆ "scope disputed (as supplied)" — same glyph
 * area, colour and stroke; the scope outline has the same colour and width in both, drawn solid or dashed (the
 * library's convention for "disputed"). Nothing is crossed out or coloured red.
 * @module animations/contract-terms/kits/clausula-indemnidad
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, int, oneOf} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {fitG, txt, chipG, unitPx, localizeScene} from './terminacion-comunicaciones.js';
import {roundedLoop} from './limitacion-contractual.js';

export {fitG, txt, chipG, unitPx, localizeScene, roundedLoop};
export const INK = '#1f2328';
export const STATES = ['covered', 'disputed'];
export const BRASS = '#c99a3c';
export const SCOPE = '#23466b';

/* ------------------------------------------------------------------------ */
/* Fields, defaults, strings                                                 */
/* ------------------------------------------------------------------------ */

export const contractField = obj('The contract sheet', {
  reference: str('Reference printed on the contract (fictional)', 32),
  title: str('Heading of the contract, as supplied (generic, e.g. "Supply contract (fictional)")', 70),
}, ['reference', 'title']);
export const clauseTitleField = str('Heading of the clause, as supplied (e.g. "Indemnity clause")', 60);
export const clausesField = list('Lines of the supplied clause text (generic, fictional placeholders such as "Clause 14.2 (supplied text)"; never real contract text)', str('Clause line, as supplied', 70), 1, 3);
export const promiseField = int('The supplied clause line that holds the promise of cover the claim is connected to (1 = first; clamped to the list)', 1, 3);
export const claimField = obj('The supplied claim (a generic, fictional placeholder)', {
  label: str('Label printed on the claim slip (e.g. "Claim 1 (supplied)")', 60),
  amount: str('Optional amount, drawn only when supplied and always after the words "Hypothetical amount" (e.g. "1,000 units"); empty = no amount', 30),
}, ['label']);
export const stateLabelsField = obj('Wording of the two supplied statuses (equal weight: ● covered as per supplied data, ◆ scope disputed)', {
  covered: str('Status "claim covered as per supplied data", as supplied', 60),
  disputed: str('Status "scope disputed", as supplied (stays an allegation: nothing is decided)', 60),
}, ['covered', 'disputed']);
export const finalStateField = what => oneOf(`The supplied status: covered (${what.covered}) or disputed (${what.disputed}). Both have equal weight; nothing is inferred from either`, STATES);

export const CONTENT = {
  contract: {reference: 'CT-412', title: 'Supply contract (fictional)'},
  clauseTitle: 'Indemnity clause',
  clauses: ['Clause 14.1 (supplied text)', 'Clause 14.2 (supplied text)', 'Clause 14.3 (supplied text)'],
  promise: 2,
  claim: {label: 'Claim 1 (supplied)', amount: ''},
  stateLabels: {covered: 'Claim covered as per supplied data', disputed: 'Scope disputed (as supplied)'},
};
export const CONTENT_ES = {
  contract: {reference: 'CT-412', title: 'Contrato de suministro (ficticio)'},
  clauseTitle: 'Cláusula de indemnidad',
  clauses: ['Cláusula 14.1 (texto aportado)', 'Cláusula 14.2 (texto aportado)', 'Cláusula 14.3 (texto aportado)'],
  promise: 2,
  claim: {label: 'Reclamación 1 (aportada)', amount: ''},
  stateLabels: {covered: 'Reclamación cubierta según los datos aportados', disputed: 'Alcance discutido (según lo aportado)'},
};

export const KIT_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', hypo: 'Hypothetical amount', was: 'was'},
  es: {key: 'Según lo aportado · sin conclusión', hypo: 'Importe hipotético', was: 'antes'},
};

export const promiseIndex = p => clamp(p.promise, 1, p.clauses.length) - 1;
export const amountText = (ctx, p) => (p.claim.amount && p.claim.amount.trim() ? `${ctx.t.hypo}: ${p.claim.amount.trim()}` : null);
const longest = arr => arr.reduce((a, b) => (b.length > a.length ? b : a), '');
export const worstState = p => longest([p.stateLabels.covered, p.stateLabels.disputed]);

/* ------------------------------------------------------------------------ */
/* Glyphs                                                                     */
/* ------------------------------------------------------------------------ */

/** Status glyph: ● covered as per supplied data, ◆ scope disputed — same area, fill and stroke. */
export function stateGlyph(ctx, state, x, y, R, o = {}) {
  const fill = o.fill ?? ctx.theme.accent2;
  if (state === 'covered') return h('circle', {name: o.name, cx: r(x), cy: r(y), r: r(R), fill, stroke: INK, 'stroke-width': 2});
  const s = R * Math.sqrt(Math.PI / 2);
  return h('path', {name: o.name, d: `M${r(x)} ${r(y - s)}L${r(x + s)} ${r(y)}L${r(x)} ${r(y + s)}L${r(x - s)} ${r(y)}Z`, fill, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'});
}

/* ------------------------------------------------------------------------ */
/* The contract                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Natural sizes of the contract's text blocks for a sheet width. Returns fits and the height the content needs.
 * @param {any} p params; @param {number} w sheet width; @param {number} F font; @param {number} minF
 * @param {{stress?:boolean, rail?:number, show?:boolean}} o  rail = width kept free at the right for the rail
 */
export function sheetText(p, w, F, minF, o = {}) {
  const padX = 64;
  const rail = o.rail ?? 0;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: w - padX - 30, size: F, minSize: minF, maxLines: o.stress ? 3 : 2, weight: 700});
  const headH = head.height + F * 0.9;
  const title = fitG(p.clauseTitle, {maxWidth: w - padX - 70 - rail, size: F, minSize: minF, maxLines: 2, weight: 700});
  const rowW = w - padX - 26 - rail;
  const rows = p.clauses.map(c => fitG(c, {maxWidth: rowW - 30, size: F, minSize: minF, maxLines: o.stress ? 3 : 2, weight: 600}));
  const rowH = rows.map(f => f.height + F * 0.95);
  const titleY = headH + F * 0.8;
  const rowsTop = titleY + title.height + F * 0.75;
  const need = rowsTop + rowH.reduce((a, b) => a + b, 0) + F * 0.5 * (rows.length - 1) + F * 0.9;
  const bad = head.bad || title.bad || rows.some(f => f.bad);
  return {padX, rail, head, headH, title, titleY, rowW, rows, rowH, rowsTop, need, bad};
}

/** Place the rows inside a sheet of height hh (spread into spare space). Returns [{y,h,fit}]. */
export function placeRows(S, hh, F) {
  const n = S.rows.length;
  const base = S.rowH.reduce((a, b) => a + b, 0);
  const avail = hh - S.rowsTop - F * 0.9;
  const spare = Math.max(0, avail - base - F * 0.5 * (n - 1));
  const grow = Math.min(spare * 0.5 / n, F * 1.6);
  const gap = Math.min(F * 0.5 + (spare - grow * n) / Math.max(1, n), F * 2);
  let y = S.rowsTop + Math.max(0, (avail - (base + grow * n + gap * (n - 1))) * 0.35);
  return S.rows.map((fit, i) => { const row = {y, h: S.rowH[i] + grow, fit}; y += row.h + gap; return row; });
}

/**
 * The contract sheet. Local origin = sheet top-left. A layer sheet lies behind it (capas). The rows are named
 * `${P}row${i}`; the promise row gets a printed rail (`${P}rail`, a path in local coordinates given by o.railD).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, S:any, rows:Array<{y:number,h:number,fit:any}>, showText:boolean, railD?:string, promise:number}} o
 */
export function contractSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, S} = o;
  const P = o.prefix ?? '';
  const parts = [
    h('rect', {x: 12, y: 16, width: w, height: hh, rx: 10, fill: th.shadow}),
    h('rect', {x: 16, y: 9, width: w - 4, height: hh, rx: 10, fill: '#ebe3d2', stroke: INK, 'stroke-width': 2, transform: `rotate(1.6 ${r(w / 2)} ${r(hh / 2)})`}),
    h('rect', {x: 0, y: 0, width: w, height: hh, rx: 10, fill: '#fffdf7', stroke: INK, 'stroke-width': 2.6}),
    // perforated binding strip
    h('path', {d: `M30 ${r(S.headH)}V${r(hh - 10)}`, stroke: '#d9d1c0', 'stroke-width': 2}),
  ];
  for (let y = S.headH + 26; y < hh - 18; y += 46) parts.push(h('circle', {cx: 16, cy: r(y), r: 6.5, fill: '#e9e2d3', stroke: '#a89f8c', 'stroke-width': 1.6}));
  parts.push(
    h('path', {d: roundRectPath(0, 0, w, S.headH, 10), fill: '#cfe1dd'}),
    h('path', {d: `M0 ${r(S.headH)}H${r(w)}`, stroke: INK, 'stroke-width': 2}),
  );
  if (o.showText) parts.push(txt(S.head, {x: S.padX - 18, y: (S.headH - S.head.height) / 2, fill: INK}));
  else parts.push(h('path', {d: `M${r(S.padX - 18)} ${r(S.headH / 2)}h${r(Math.min(w * 0.5, 320))}`, stroke: '#9fbcb6', 'stroke-width': 11, 'stroke-linecap': 'round'}));
  // clause heading on a ribbon tab
  const tabH = S.title.height + 16;
  const tabW = (o.showText ? S.title.width : Math.min(w * 0.42, 260)) + 46;
  const ty = S.titleY - 8;
  parts.push(
    h('path', {d: `M${r(S.padX - 14)} ${r(ty)}H${r(S.padX - 14 + tabW)}L${r(S.padX - 14 + tabW - 16)} ${r(ty + tabH / 2)}L${r(S.padX - 14 + tabW)} ${r(ty + tabH)}H${r(S.padX - 14)}Z`, fill: '#f6e3b4', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  );
  if (o.showText) parts.push(txt(S.title, {x: S.padX, y: S.titleY, fill: INK}));
  else parts.push(h('path', {d: `M${r(S.padX)} ${r(ty + tabH / 2)}h${r(tabW - 60)}`, stroke: '#c9ad6a', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  if (o.railD) parts.push(h('path', {name: `${P}rail`, d: o.railD, fill: 'none', stroke: '#b9ad94', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  o.rows.forEach((row, i) => {
    const pr = i === o.promise;
    parts.push(g({name: `${P}row${i}`},
      h('rect', {x: r(S.padX - 10), y: r(row.y), width: r(S.rowW + 10), height: r(row.h), rx: 7, fill: pr ? '#fff4d6' : '#ffffff', stroke: pr ? '#b79a55' : '#d8ceb9', 'stroke-width': pr ? 2.4 : 1.6}),
      o.showText
        ? txt(row.fit, {x: S.padX + 6, y: row.y + (row.h - row.fit.height) / 2, fill: INK})
        : h('path', {d: `M${r(S.padX + 6)} ${r(row.y + row.h / 2)}h${r(Math.min(S.rowW - 50, 320))}`, stroke: '#cfc5b0', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    ));
  });
  // decorative filler lines below the rows (simulated text)
  const last = o.rows[o.rows.length - 1];
  for (let y = last.y + last.h + 30; y < hh - (o.fillerStop ?? 24); y += 28) parts.push(h('path', {d: `M${r(S.padX)} ${r(y)}h${r((S.rowW - 40) * (0.5 + 0.4 * (((y * 7) | 0) % 10) / 10))}`, stroke: '#ebe4d5', 'stroke-width': 5, 'stroke-linecap': 'round'}));
  return g({name: `${P}sheet`}, parts);
}

/**
 * Brass socket mounted on a sheet edge. Origin = the mouth centre; `dir` is where the mouth opens ('right' | 'down').
 * The ring `${name}-ring` is hidden until the prong seats.
 */
export function socketArt(ctx, name, dir, s = 1) {
  const rot = dir === 'down' ? 90 : 0;
  return g({name, transform: `rotate(${rot})`},
    h('rect', {x: r(-30 * s), y: r(-24 * s), width: r(34 * s), height: r(48 * s), rx: r(6 * s), fill: BRASS, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(-30 * s), y: r(-24 * s), width: r(10 * s), height: r(48 * s), rx: r(4 * s), fill: shade(BRASS, -0.2)}),
    h('rect', {x: r(-12 * s), y: r(-9 * s), width: r(16 * s), height: r(18 * s), rx: r(3 * s), fill: '#3a3226'}),
    h('circle', {cx: r(-22 * s), cy: r(-15 * s), r: r(3 * s), fill: '#6b5524'}),
    h('circle', {cx: r(-22 * s), cy: r(15 * s), r: r(3 * s), fill: '#6b5524'}),
    h('rect', {name: `${name}-ring`, x: r(-36 * s), y: r(-30 * s), width: r(46 * s), height: r(60 * s), rx: r(10 * s), fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': 5, opacity: 0}),
  );
}

/* ------------------------------------------------------------------------ */
/* The claim slip                                                            */
/* ------------------------------------------------------------------------ */

/** Text and size of a claim slip of width w. */
export function slipText(ctx, p, w, F, minF, stress, minH = 0) {
  const label = fitG(p.claim.label, {maxWidth: w - 52, size: F, minSize: minF, maxLines: stress ? 4 : 2, weight: 700});
  const at = amountText(ctx, p);
  const amount = at ? fitG(at, {maxWidth: w - 52, size: F * 0.92, minSize: Math.min(minF, F * 0.92), maxLines: 3, weight: 600}) : null;
  const stub = Math.max(34, F * 1.25);
  const textH = stub + 22 + label.height + (amount ? 14 + amount.height : 0);
  const hh = Math.max(textH + 26, minH);
  return {label, amount, stub, textH, h: hh, w, bad: label.bad || (amount && amount.bad)};
}

/**
 * Claim slip. Local origin = the prong tip; `side` is where the prong sticks out ('left': the body runs along +x;
 * 'top': the body hangs below, along +y). prong = prong length. Returns the node; body box via slipBox().
 * @param {any} ctx
 * @param {{name:string, T:any, side:'left'|'top', prong:number, showText:boolean, tint?:string}} o
 */
export function claimSlip(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, stub} = o.T;
  const pr = o.prong;
  const bx = o.side === 'left' ? pr : -w / 2;
  const by = o.side === 'left' ? -hh * (o.T.prongAt ?? 0.5) : pr;
  const tint = o.tint ?? '#f3d7c4';
  const dots = [];
  for (let x = bx + 14; x < bx + w - 10; x += 16) dots.push(h('circle', {cx: r(x), cy: r(by + stub), r: 2.4, fill: '#b49a86'}));
  const prongD = o.side === 'left'
    ? `M${r(pr + 2)} -13H10Q0 -13 0 -6V6Q0 13 10 13H${r(pr + 2)}Z`
    : `M-13 ${r(pr + 2)}V10Q-13 0 -6 0H6Q13 0 13 10V${r(pr + 2)}Z`;
  const ridges = o.side === 'left'
    ? `M${r(pr * 0.45)} -13V13M${r(pr * 0.7)} -13V13`
    : `M-13 ${r(pr * 0.45)}H13M-13 ${r(pr * 0.7)}H13`;
  const fold = 26;
  const parts = [
    h('path', {d: roundRectPath(bx + 8, by + 10, w, hh, 10), fill: th.shadow}),
    h('path', {d: prongD, fill: BRASS, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: ridges, stroke: shade(BRASS, -0.35), 'stroke-width': 2}),
    h('path', {d: `M${r(bx + 10)} ${r(by)}H${r(bx + w - fold)}L${r(bx + w)} ${r(by + fold)}V${r(by + hh - 10)}Q${r(bx + w)} ${r(by + hh)} ${r(bx + w - 10)} ${r(by + hh)}H${r(bx + 10)}Q${r(bx)} ${r(by + hh)} ${r(bx)} ${r(by + hh - 10)}V${r(by + 10)}Q${r(bx)} ${r(by)} ${r(bx + 10)} ${r(by)}Z`, fill: '#fffaf3', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(bx + 10)} ${r(by)}H${r(bx + w - fold)}L${r(bx + w)} ${r(by + fold)}V${r(by + stub)}H${r(bx)}V${r(by + 10)}Q${r(bx)} ${r(by)} ${r(bx + 10)} ${r(by)}Z`, fill: tint}),
    h('path', {d: `M${r(bx + w - fold)} ${r(by)}V${r(by + fold)}H${r(bx + w)}Z`, fill: '#e3cdb9', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(bx + 10)} ${r(by)}H${r(bx + w - fold)}L${r(bx + w)} ${r(by + fold)}V${r(by + hh - 10)}Q${r(bx + w)} ${r(by + hh)} ${r(bx + w - 10)} ${r(by + hh)}H${r(bx + 10)}Q${r(bx)} ${r(by + hh)} ${r(bx)} ${r(by + hh - 10)}V${r(by + 10)}Q${r(bx)} ${r(by)} ${r(bx + 10)} ${r(by)}Z`, fill: 'none', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    ...dots,
  ];
  const ty = by + stub + 22;
  // simulated body text below the supplied lines (decorative)
  for (let y = by + o.T.textH + 30, i = 0; y < by + hh - 22; y += 24, i++) parts.push(h('path', {d: `M${r(bx + 26)} ${r(y)}h${r((w - 70) * (0.55 + 0.4 * ((i * 7) % 5) / 5))}`, stroke: '#eadfd4', 'stroke-width': 6, 'stroke-linecap': 'round'}));
  if (o.showText) {
    parts.push(txt(o.T.label, {x: bx + 26, y: ty, fill: INK}));
    if (o.T.amount) parts.push(txt(o.T.amount, {x: bx + 26, y: ty + o.T.label.height + 14, fill: '#4a3b30'}));
  } else {
    parts.push(h('path', {d: `M${r(bx + 26)} ${r(ty + o.T.label.size * 0.5)}h${r(Math.min(w - 70, 240))}`, stroke: '#d8c7b8', 'stroke-width': 11, 'stroke-linecap': 'round'}));
    if (o.T.amount) parts.push(h('path', {d: `M${r(bx + 26)} ${r(ty + o.T.label.height + 14 + o.T.amount.size * 0.5)}h${r(Math.min(w - 100, 170))}`, stroke: '#e2d5c9', 'stroke-width': 9, 'stroke-linecap': 'round'}));
  }
  return g({name: o.name}, parts);
}
/** The slip body box relative to the prong tip. */
export const slipBox = (T0, side, prong) => (side === 'left' ? {x: prong, y: -T0.h * (T0.prongAt ?? 0.5), w: T0.w, h: T0.h} : {x: -T0.w / 2, y: prong, w: T0.w, h: T0.h});

/* ------------------------------------------------------------------------ */
/* The reading lens (lupa)                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Rectangular reading magnifier seen from above. Origin = the grip; the handle runs along +x to the lens frame,
 * whose centre lies at (hl + lw / 2, 0). Size: lens lw × lh.
 */
export function readingLens(ctx, o) {
  const {lw, lh, hl} = o;
  const x0 = hl, cx = hl + lw / 2;
  return g({name: o.name},
    h('rect', {x: r(x0 + 8), y: r(-lh / 2 + 10), width: r(lw), height: r(lh), rx: 16, fill: INK, opacity: 0.1}),
    h('path', {d: `M${r(-lh * 0.12)} ${r(-lh * 0.13)}H${r(hl + 6)}V${r(lh * 0.13)}H${r(-lh * 0.12)}Q${r(-lh * 0.24)} 0 ${r(-lh * 0.12)} ${r(-lh * 0.13)}Z`, fill: '#5a4636', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(hl * 0.25)} ${r(-lh * 0.13)}V${r(lh * 0.13)}M${r(hl * 0.45)} ${r(-lh * 0.13)}V${r(lh * 0.13)}`, stroke: '#3b2d22', 'stroke-width': 2}),
    h('rect', {x: r(x0), y: r(-lh / 2), width: r(lw), height: r(lh), rx: 16, fill: '#eef8fa', 'fill-opacity': 0.72, stroke: INK, 'stroke-width': r(lh * 0.1 + 3)}),
    h('rect', {x: r(x0), y: r(-lh / 2), width: r(lw), height: r(lh), rx: 16, fill: 'none', stroke: '#2d4f5c', 'stroke-width': r(lh * 0.1)}),
    h('path', {d: `M${r(x0 + lw * 0.12)} ${r(-lh * 0.28)}L${r(x0 + lw * 0.3)} ${r(-lh * 0.28)}M${r(x0 + lw * 0.12)} ${r(-lh * 0.12)}L${r(x0 + lw * 0.2)} ${r(-lh * 0.12)}`, stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9}),
    h('circle', {cx: r(cx), cy: r(-lh / 2 - 1), r: 4, fill: BRASS, stroke: INK, 'stroke-width': 1.4}),
  );
}
/** World centre of the reading lens held at `grip` with angle `deg`. */
export function lensCentreOf(grip, deg, o) {
  const a = (deg * Math.PI) / 180;
  const d = o.hl + o.lw / 2;
  return {x: grip.x + Math.cos(a) * d, y: grip.y + Math.sin(a) * d};
}

/* ------------------------------------------------------------------------ */
/* The scope outline                                                         */
/* ------------------------------------------------------------------------ */

/** A scope outline drawn on progressively (the visible part is the path up to q). Solid or dashed, same width/colour. */
export function scopeNode(name, loop, dashed, o = {}) {
  return g({name},
    h('path', {name: `${name}-halo`, d: 'M0 0', fill: 'none', stroke: '#ffffff', 'stroke-width': (o.width ?? 6) + 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85}),
    h('path', {name: `${name}-line`, d: 'M0 0', fill: 'none', stroke: o.color ?? SCOPE, 'stroke-width': o.width ?? 6, 'stroke-linecap': dashed ? 'butt' : 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dashed ? '20 13' : undefined}),
  );
}
/** Frame record: the outline drawn to q (0..1). */
export function scopeFrame(name, loop, q) {
  q = clamp(q);
  if (q <= 0.001) return {[`${name}-halo`]: {d: 'M0 0', opacity: 0}, [`${name}-line`]: {d: 'M0 0', opacity: 0}};
  const n = loop.pts.length;
  const k = Math.max(2, Math.round(n * q));
  const pts = loop.pts.slice(0, k);
  const d = `M${pts.map(p => `${r(p.x, 1)} ${r(p.y, 1)}`).join('L')}${q >= 0.999 ? 'Z' : ''}`;
  return {[`${name}-halo`]: {d, opacity: 0.85}, [`${name}-line`]: {d, opacity: 1}};
}

/** Rounded rectangle box test. */
export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export {T, shade};
