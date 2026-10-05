/**
 * Kit for the "Cláusula de terminación" motif (contract-terms-05, LAW-0497..0500), rebuilt from scratch.
 * Art, glue-aware text fitting and small pure helpers only: every entry owns its own staging, layout, timeline and
 * semantics (story: a messenger pins a letter on a cork board; mechanism: transparent layers on a light table;
 * contrast: a filing wall with an overhead carrier rail; inspect: a reading desk with a magnifier lens).
 *
 * Objects (original vector art, editorial-flat):
 *  - the CONTRACT SHEET: paper with a head band ("CT-731 · Contract (fictional)"), the clause heading and the supplied
 *    SECTIONS as rows (each with a small brass peg at its left edge, where a supplied link can be tied);
 *  - the COMMUNICATION (letter / slip): a paper card printed with the supplied, generic label and — where the entry
 *    shows it — its supplied CASE line: ● "Case provided for (as supplied)" or ◆ "Case not described (as supplied)".
 *    The two glyphs have the same area, colour and stroke (neither case looks deficient);
 *  - the MAGNIFIER (lupa), a push PIN, a THREAD (a plain line: a supplied link, never an arrow);
 *  - transparent LAYERS (capas) for the mechanism.
 * Legal content (very high risk: termination): no termination doctrine — no ground, right or power to terminate, no
 * notice period or time limit, no effect, no validity or sufficiency judgement, no jurisdiction. A link is drawn only
 * when it is supplied; "not described" stays neutral (no link, no conclusion). The key reads "As supplied · no
 * conclusion drawn".
 * @module animations/contract-terms/kits/terminacion-comunicaciones
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {measure} from '../../../core/text.js';
import {fitDesign} from '../../../core/layout.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {str, list, obj, int, oneOf} from '../../../schemas/fields.js';

export const INK = '#1f2328';
export const STATES = ['provided', 'undescribed'];

/* ------------------------------------------------------------------------ */
/* Fields, defaults, strings                                                 */
/* ------------------------------------------------------------------------ */

export const contractField = obj('The contract sheet', {
  reference: str('Reference printed on the contract (fictional)', 32),
  title: str('Heading of the contract, as supplied (generic, e.g. "Contract (fictional)")', 80),
}, ['reference', 'title']);
export const clauseTitleField = str('Heading of the clause, as supplied (e.g. "Termination clause")', 60);
export const clausesField = list('Sections of the clause, as supplied (generic, fictional placeholders such as "Section 1 (supplied text)"; never real contract text)', str('Section, as supplied', 70), 1, 3);
export const sectionField = int('The supplied section the communication is linked to when the case is "provided for" (1 = top; clamped to the list)', 1, 3);
export const communicationField = obj('The supplied communication (a generic, fictional placeholder; never a real notice)', {
  label: str('Label printed on the communication (e.g. "Communication 1 (supplied)")', 60),
}, ['label']);
export const stateLabelsField = obj('Wording of the two supplied cases (equal weight; ● provided for, ◆ not described)', {
  provided: str('Case "provided for", as supplied', 60),
  undescribed: str('Case "not described", as supplied', 60),
}, ['provided', 'undescribed']);
export const finalStateField = (what) => oneOf(`The supplied case: provided (provided for: ${what.provided}) or undescribed (not described: ${what.undescribed}). Both cases have equal weight; nothing is inferred from either`, STATES);

export const CONTENT = {
  contract: {reference: 'CT-731', title: 'Contract (fictional)'},
  clauseTitle: 'Termination clause',
  clauses: ['Section 1 (supplied text)', 'Section 2 (supplied text)', 'Section 3 (supplied text)'],
  section: 2,
  communication: {label: 'Communication 1 (supplied)'},
  stateLabels: {provided: 'Case provided for (as supplied)', undescribed: 'Case not described (as supplied)'},
};
export const CONTENT_ES = {
  contract: {reference: 'CT-731', title: 'Contrato (ficticio)'},
  clauseTitle: 'Cláusula de terminación',
  clauses: ['Apartado 1 (texto aportado)', 'Apartado 2 (texto aportado)', 'Apartado 3 (texto aportado)'],
  section: 2,
  communication: {label: 'Comunicación 1 (aportada)'},
  stateLabels: {provided: 'Supuesto previsto (según lo aportado)', undescribed: 'Supuesto no descrito (según lo aportado)'},
};

export const KIT_STRINGS = {
  en: {
    linked: 'Section linked as supplied',
    unlinked: 'No section linked · as supplied',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    linked: 'Apartado vinculado según lo aportado',
    unlinked: 'Ningún apartado vinculado · según lo aportado',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** The supplied linked section, clamped to the list. Zero-based. */
export const sectionIndex = p => clamp(p.section, 1, p.clauses.length) - 1;

/**
 * With locale 'es', every top-level parameter still equal to the English default is replaced by its Spanish default
 * (supplied values are never replaced).
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
    for (const [key, v] of Object.entries(es)) if (key in defaults && same(p[key], defaults[key]) && !same(p[key], v)) { q[key] = v; changed = true; }
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

/* ------------------------------------------------------------------------ */
/* Units and text                                                           */
/* ------------------------------------------------------------------------ */

/** Pixels (at 1080p) per design unit. */
export function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const GLUE = '\u0001';
/** Unbreakable tokens: a number stays with the word before it; a lone separator stays with its word. */
function tokens(text) {
  const out = [];
  for (const w of String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)) {
    if (out.length && (/^[\d§]/.test(w) && w.length <= 4 || /^[·•–—|:]$/.test(w) || /^[).,;:]+$/.test(w))) out[out.length - 1] += GLUE + w;
    else out.push(w);
  }
  return out;
}
const shown = t => t.split(GLUE).join(' ');
const FIT = new Map();

/**
 * Fit text into maxWidth × maxLines at the largest size in [size, minSize] that wraps whole words only and leaves no
 * 1–2 character line. Returns a fitText-shaped result plus `bad` when it could not be done (then truncated).
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:'sans'|'serif'|'mono', leading?:number}} o
 */
export function fitG(text, o) {
  const key = `${text}|${r(o.maxWidth, 1)}|${r(o.size, 2)}|${r(o.minSize ?? o.size, 2)}|${o.maxLines}|${o.weight}|${o.family}|${o.leading}`;
  const hit = FIT.get(key);
  if (hit) return hit;
  const full = String(text ?? '');
  const weight = o.weight ?? 600;
  const family = o.family ?? 'sans';
  const leading = o.leading ?? 1.18;
  const maxLines = o.maxLines ?? 2;
  const minSize = Math.min(o.size, o.minSize ?? o.size);
  const maxWidth = Math.max(10, o.maxWidth);
  const tk = tokens(full);
  const m = (t, sz) => measure(shown(t), sz, weight, family);
  const wrapAt = sz => {
    const lines = [];
    let cur = '';
    for (const t of tk) {
      const cand = cur ? `${cur} ${t}` : t;
      if (!cur || m(cand, sz) <= maxWidth) cur = cand;
      else { lines.push(cur); cur = t; }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  };
  const step = Math.max(0.4, o.size * 0.03);
  let res = null;
  for (let sz = o.size; sz >= minSize - 1e-6; sz -= step) {
    const lines = wrapAt(sz);
    const widest = Math.max(...tk.map(t => m(t, sz)), 0);
    const orphan = lines.length > 1 && lines.some(l => shown(l).length <= 2);
    if (lines.length <= maxLines && widest <= maxWidth && !orphan) { res = mk(lines, sz, false); break; }
  }
  if (!res) {
    let lines = wrapAt(minSize);
    let truncated = false;
    if (lines.length > maxLines) {
      truncated = true;
      lines = lines.slice(0, maxLines);
      let last = shown(lines[maxLines - 1]);
      while (last.length > 1 && measure(`${last}…`, minSize, weight, family) > maxWidth) last = last.slice(0, -1).trimEnd();
      lines[maxLines - 1] = `${last}…`;
    }
    res = mk(lines, minSize, true, truncated);
  }
  if (FIT.size > 20000) FIT.clear();
  FIT.set(key, res);
  return res;

  function mk(lines0, size, bad, truncated = false) {
    const lines = lines0.map(shown);
    const width = Math.max(...lines.map(l => measure(l, size, weight, family)));
    const lineHeight = size * leading;
    return {lines, size, lineHeight, width, height: lineHeight * (lines.length - 1) + size, truncated, full, weight, family, bad};
  }
}

/** Text node for a fitted block; y = top of the block. */
export const txt = (fit, o) => textBlock(fit, o);

/** Rounded label chip from a fitG result. Returns {node, box}. */
export function chipG(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = o.padX ?? size * 0.6, padY = o.padY ?? size * 0.38;
  const f = fitG(text, {maxWidth: o.maxWidth - padX * 2, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600});
  const w = f.width + padX * 2 + (o.glyph ? size * 1.1 : 0), hh = f.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.7)), fill: o.fill ?? th.card, stroke: o.stroke ?? th.ink, 'stroke-width': 2.2}),
    o.glyph ? o.glyph(x + padX + size * 0.4, o.y + hh / 2, size * 0.36) : null,
    txt(f, {x: x + (w + (o.glyph ? size * 1.1 : 0)) / 2, y: o.y + padY, anchor: 'middle', fill: o.color ?? th.ink}),
  );
  return {node, box: {x, y: o.y, w, h: hh}, fit: f, bad: f.bad};
}

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/* ------------------------------------------------------------------------ */
/* Art                                                                       */
/* ------------------------------------------------------------------------ */

/** The supplied-case glyph: ● provided, ◆ undescribed — same area, fill and stroke. */
export function caseGlyph(ctx, state, x, y, R, o = {}) {
  const fill = o.fill ?? ctx.theme.accent2;
  if (state === 'provided') return h('circle', {name: o.name, cx: r(x), cy: r(y), r: r(R), fill, stroke: INK, 'stroke-width': 2});
  const s = R * Math.sqrt(Math.PI / 2); // same area as the disc
  return h('path', {name: o.name, d: `M${r(x)} ${r(y - s)}L${r(x + s)} ${r(y)}L${r(x)} ${r(y + s)}L${r(x - s)} ${r(y)}Z`, fill, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'});
}

/**
 * The contract sheet with its supplied sections. Local origin = sheet top-left.
 * @param {any} ctx
 * @param {{name?:string, w:number, h:number, head:any, title:any, rows:Array<{y:number,h:number,fit:any}>, rowX:number, rowW:number, F:number, showText:boolean, layers?:number, pegs?:boolean, blank?:{y:number,h:number}|null, rowName?:(i:number)=>string}} o
 */
export function contractSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const fold = Math.min(46, w * 0.07);
  const layers = [];
  for (let i = o.layers ?? 2; i >= 1; i--) {
    layers.push(h('path', {d: roundRectPath(i * 9, -i * 9, w, hh, 6), fill: shade('#f4efe4', -0.03 * i), stroke: INK, 'stroke-width': 2}));
  }
  const headH = o.headH;
  const parts = [
    h('rect', {x: 8, y: 12, width: w, height: hh, rx: 6, fill: th.shadow}),
    layers,
    h('path', {d: `M0 6Q0 0 6 0H${r(w - fold)}L${r(w)} ${r(fold)}V${r(hh - 6)}Q${r(w)} ${r(hh)} ${r(w - 6)} ${r(hh)}H6Q0 ${r(hh)} 0 ${r(hh - 6)}Z`, fill: '#fbf8f1', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w - fold)} 0V${r(fold - 6)}Q${r(w - fold)} ${r(fold)} ${r(w - fold + 6)} ${r(fold)}H${r(w)}`, fill: '#e9e2d2', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: 0, y: 0, width: r(w - fold), height: r(headH), fill: th.accent2Soft, opacity: 0.85}),
    h('path', {d: `M0 ${r(headH)}H${r(w)}`, stroke: INK, 'stroke-width': 2}),
  ];
  if (o.showText && o.head) parts.push(txt(o.head, {x: 22, y: (headH - o.head.height) / 2, fill: INK}));
  else parts.push(h('path', {d: `M22 ${r(headH / 2)}H${r(Math.min(w * 0.55, w - fold - 30))}`, stroke: shade(th.accent2Soft, -0.35), 'stroke-width': 10, 'stroke-linecap': 'round'}));
  if (o.title) {
    if (o.showText) parts.push(txt(o.title.fit, {x: o.rowX, y: o.title.y, fill: INK}));
    else parts.push(h('path', {d: `M${r(o.rowX)} ${r(o.title.y + o.title.fit.size * 0.5)}h${r(Math.min(o.rowW * 0.5, 260))}`, stroke: '#cfc6b4', 'stroke-width': 9, 'stroke-linecap': 'round'}));
  }
  o.rows.forEach((row, i) => {
    parts.push(g({name: o.rowName ? o.rowName(i) : undefined},
      h('rect', {x: r(o.rowX), y: r(row.y), width: r(o.rowW), height: r(row.h), rx: 8, fill: '#ffffff', stroke: '#8f8676', 'stroke-width': 2}),
      h('rect', {x: r(o.rowX), y: r(row.y), width: 10, height: r(row.h), rx: 4, fill: th.accent3}),
      o.showText
        ? txt(row.fit, {x: o.rowX + 26, y: row.y + (row.h - row.fit.height) / 2, fill: INK})
        : h('path', {d: `M${r(o.rowX + 26)} ${r(row.y + row.h * 0.5)}h${r(Math.min(o.rowW - 60, 300))}`, stroke: '#d5cdbd', 'stroke-width': 8, 'stroke-linecap': 'round'}),
      o.pegs !== false ? peg(row.pegX ?? o.rowX - 4, row.y + row.h / 2) : null,
    ));
  });
  if (o.blank) {
    // a blank band (no text): the space below the supplied sections
    const b = o.blank;
    parts.push(h('rect', {x: r(o.rowX), y: r(b.y), width: r(o.rowW), height: r(b.h), rx: 8, fill: 'none', stroke: '#cfc6b4', 'stroke-width': 2, 'stroke-dasharray': '2 0'}));
    for (let k = 1; k <= 2; k++) parts.push(h('path', {d: `M${r(o.rowX + 26)} ${r(b.y + (b.h * k) / 3)}h${r(o.rowW - 52)}`, stroke: '#e6dfd0', 'stroke-width': 3}));
  }
  return g({name: o.name}, parts);
}

/** A small brass peg (where a supplied link is tied). */
export function peg(x, y, R = 9) {
  return g(null,
    h('circle', {cx: r(x), cy: r(y), r: R + 3, fill: '#7a5a22', opacity: 0.3}),
    h('circle', {cx: r(x), cy: r(y), r: R, fill: '#d6a84a', stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(x - R * 0.3), cy: r(y - R * 0.3), r: R * 0.3, fill: '#f3dc9c'}),
  );
}

/** A push pin seen from the front (origin = pin point). */
export function pushPin(ctx, name, R = 13) {
  const c = ctx.theme.accent;
  return g({name},
    h('ellipse', {cx: 3, cy: 4, rx: R * 0.9, ry: R * 0.5, fill: INK, opacity: 0.18}),
    h('circle', {cx: 0, cy: 0, r: R, fill: c, stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: -R * 0.35, cy: -R * 0.35, r: R * 0.32, fill: '#fff', opacity: 0.6}),
  );
}

/**
 * Magnifier. Origin = the grip (handle end); it points along +x: handle [0, hl], ring centred at hl + R.
 * @param {any} ctx
 * @param {{name:string, R:number, hl:number, glass?:boolean}} o
 */
export function magnifier(ctx, o) {
  const {R, hl} = o;
  const cx = hl + R;
  return g({name: o.name},
    h('rect', {x: -6, y: -R * 0.2 + 6, width: hl + 8, height: R * 0.4, rx: R * 0.2, fill: INK, opacity: 0.16}),
    h('rect', {x: 0, y: -R * 0.2, width: hl, height: R * 0.4, rx: R * 0.2, fill: '#5b3c26', stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: hl - R * 0.32, y: -R * 0.26, width: R * 0.5, height: R * 0.52, rx: 4, fill: '#9a9a9a', stroke: INK, 'stroke-width': 2}),
    o.glass === false ? null : h('circle', {cx, cy: 0, r: R, fill: '#dff1fb', opacity: 0.35}),
    h('circle', {cx, cy: 0, r: R, fill: 'none', stroke: INK, 'stroke-width': R * 0.26 + 2}),
    h('circle', {cx, cy: 0, r: R, fill: 'none', stroke: '#b9b9b9', 'stroke-width': R * 0.22}),
    h('path', {d: `M${r(cx - R * 0.55)} ${r(-R * 0.25)}A${r(R * 0.6)} ${r(R * 0.6)} 0 0 1 ${r(cx - R * 0.1)} ${r(-R * 0.6)}`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8}),
  );
}

/** World position of a magnifier's lens centre from its grip and angle (degrees). */
export function lensCentre(grip, angle, o) {
  const a = (angle * Math.PI) / 180;
  return {x: grip.x + Math.cos(a) * (o.hl + o.R), y: grip.y + Math.sin(a) * (o.hl + o.R)};
}

/**
 * The communication card (letter or slip). Local origin = top-left. The lower part (the case line) sits in its own
 * group `${name}-low` so a story can unfold it (scaleY about the fold line at `foldY`).
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, label:any, caseFit?:any, state?:string, showText:boolean, foldY?:number, tint?:string, hole?:boolean}} o
 */
export function letterCard(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const foldY = o.foldY ?? hh;
  const fill = o.tint ?? '#fffdf6';
  const pad = 18;
  const top = [
    h('rect', {x: 6, y: 9, width: w, height: r(foldY), rx: 6, fill: th.shadow}),
    h('rect', {x: 0, y: 0, width: w, height: r(foldY), rx: 6, fill, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: 0, y: 0, width: w, height: 12, rx: 4, fill: th.accent3}),
    o.hole ? h('circle', {cx: r(w / 2), cy: 26, r: 7, fill: '#e2d9c6', stroke: INK, 'stroke-width': 2}) : null,
  ];
  const ly = o.hole ? 44 : 26;
  if (o.showText) top.push(txt(o.label, {x: pad, y: ly, fill: INK}));
  else top.push(h('path', {d: `M${pad} ${r(ly + 14)}h${r(w - pad * 2)}M${pad} ${r(ly + 40)}h${r((w - pad * 2) * 0.6)}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}));
  let low = null;
  if (o.caseFit) {
    const lh = hh - foldY;
    const gR = Math.min(13, o.caseFit.size * 0.42);
    low = g({name: `${o.name}-low`},
      h('rect', {x: 6, y: r(foldY + 9), width: w, height: r(lh), rx: 6, fill: th.shadow}),
      h('rect', {x: 0, y: r(foldY - 3), width: w, height: r(lh + 3), rx: 6, fill, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M8 ${r(foldY)}H${r(w - 8)}`, stroke: '#d8ccb4', 'stroke-width': 2}),
      caseGlyph(ctx, o.state, pad + gR, foldY + (lh) / 2, gR),
      o.showText
        ? g({name: `${o.name}-case`}, txt(o.caseFit, {x: pad + gR * 2 + 12, y: foldY + (lh - o.caseFit.height) / 2, fill: INK}))
        : h('path', {d: `M${r(pad + gR * 2 + 12)} ${r(foldY + lh / 2)}h${r(w - pad * 2 - gR * 2 - 24)}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    );
  }
  return g({name: o.name}, g({name: `${o.name}-top`}, top), low);
}

/** A sagging thread from a to b (quadratic). */
export function threadPath(a, b, sag = 0.12, ctrl = null) {
  const c = ctrl ?? {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + Math.hypot(b.x - a.x, b.y - a.y) * sag};
  const L = quadLen(a, c, b);
  return {d: `M${r(a.x)} ${r(a.y)}Q${r(c.x)} ${r(c.y)} ${r(b.x)} ${r(b.y)}`, len: L, c};
}
function quadLen(a, c, b) {
  let L = 0, prev = a;
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    const q = {x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y};
    L += Math.hypot(q.x - prev.x, q.y - prev.y);
    prev = q;
  }
  return L;
}

/** A drawable thread node (draw progress via `stroke-dashoffset`). */
export function threadNode(ctx, name, tp, color) {
  return g({name, opacity: 0},
    h('path', {d: tp.d, fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.7, name: `${name}-halo`, 'stroke-dasharray': `${r(tp.len)} ${r(tp.len + 10)}`, 'stroke-dashoffset': r(tp.len)}),
    h('path', {d: tp.d, fill: 'none', stroke: color ?? ctx.theme.accent, 'stroke-width': 4.5, 'stroke-linecap': 'round', name: `${name}-line`, 'stroke-dasharray': `${r(tp.len)} ${r(tp.len + 10)}`, 'stroke-dashoffset': r(tp.len)}),
  );
}
/** Frame record for a thread drawn to progress q. */
export function threadFrame(name, tp, q) {
  const off = r(tp.len * (1 - q));
  return {[name]: {opacity: q > 0 ? 1 : 0}, [`${name}-halo`]: {'stroke-dashoffset': off}, [`${name}-line`]: {'stroke-dashoffset': off}};
}

/** Name caption (text) under a figure. */
export function nameCaption(ctx, text, o) {
  const f = fitG(text, {maxWidth: o.maxWidth, size: o.size, minSize: o.minSize ?? o.size * 0.85, maxLines: 1, weight: 700});
  return {node: txt(f, {x: o.x, y: o.y, anchor: 'middle', fill: ctx.theme.fg, name: o.name}), fit: f, box: {x: o.x - f.width / 2, y: o.y, w: f.width, h: f.height}};
}
