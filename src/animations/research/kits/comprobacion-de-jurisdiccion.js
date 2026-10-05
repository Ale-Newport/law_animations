/**
 * Shared kit for the "Comprobación de jurisdicción" motif (LAW-0069..0072):
 * a filter separates documents according to the jurisdiction each one
 * DECLARES, against the jurisdiction the author marks as relevant on the
 * research card (ficha).
 *
 * Content rules encoded here:
 *  - jurisdictions, documents, references and dates are fictional and
 *    illustrative (jurisdiction of the scene: unspecified);
 *  - `relevant` is SUPPLIED by the author on the research card; the scene never
 *    decides which jurisdiction applies to anything. The filter only compares
 *    two supplied labels: the one printed on each document and the one on the
 *    card (same / different). No validity, effect or outcome is inferred.
 *
 * Visual code (readable with every label hidden): each jurisdiction key has
 * its own emblem SHAPE (j1 circle, j2 triangle, j3 square) and colour; the
 * seal on a document and the key on the card use the same emblem.
 *
 * Geometry + drawing only; every entry owns its own timeline and layout.
 * @module animations/research/kits/comprobacion-de-jurisdiccion
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {str, list, obj, oneOf} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';

export const JUR_KEYS = ['j1', 'j2', 'j3'];

/* ------------------------------------------------------------------ fields */

const jurisdictionField = obj('A fictional jurisdiction as it is named on documents', {
  key: oneOf('Fixed key; each key keeps its own emblem shape (j1 circle, j2 triangle, j3 square) and colour', JUR_KEYS),
  name: str('Fictional jurisdiction name printed on the documents and on the research card', 32),
}, ['key', 'name']);

const sourceField = obj('A source document kept in the library (fictional)', {
  id: str('Identifier printed on the document', 14),
  title: str('Short title printed on the document (simulated)', 60),
  declares: oneOf('Key of the jurisdiction the document itself declares (as printed on it; supplied, never inferred)', JUR_KEYS),
}, ['id', 'declares']);

/**
 * Research-category fields (query / sources / citations / dates) specialised
 * for this motif, built only from the shared builders.
 */
export const jurFields = {
  query: str('Research question written on the research card and shown by the search terminal (fictional)', 120),
  jurisdictions: list('Fictional jurisdictions that the documents may declare (2–3). The key fixes the emblem', jurisdictionField, 2, 3),
  relevant: oneOf('Key of the jurisdiction the author marks as relevant on the research card (supplied; the scene never decides which jurisdiction applies)', JUR_KEYS),
  sources: list('Source documents in library order (3–6). Each declares one jurisdiction', sourceField, 3, 6),
  citations: list('Short fictional reference printed on each source (same order as sources)', str('Reference', 40), 0, 6),
  dates: list('Date printed on each source (same order as sources; fictional)', str('Date', 24), 0, 6),
};

/** Fictional, illustrative defaults (English). */
export const JUR_DEFAULTS = {
  query: 'Delivery terms in supply contracts',
  jurisdictions: [{key: 'j1', name: 'Northvale'}, {key: 'j2', name: 'Eastmere'}, {key: 'j3', name: 'Southholm'}],
  relevant: 'j1',
  sources: [
    {id: 'DOC-11', title: 'Supply contract file', declares: 'j1'},
    {id: 'DOC-12', title: 'Freight agreement', declares: 'j2'},
    {id: 'DOC-13', title: 'Warehouse lease', declares: 'j1'},
    {id: 'DOC-14', title: 'Service terms', declares: 'j3'},
    {id: 'DOC-15', title: 'Purchase order set', declares: 'j1'},
  ],
  citations: ['Ref. 11-A', 'Ref. 12-C', 'Ref. 13-A', 'Ref. 14-B', 'Ref. 15-A'],
  dates: ['12 Mar 2019', '4 Jun 2020', '30 Sep 2020', '15 Jan 2021', '8 Jul 2021'],
};

/** Spanish counterparts for presets (fictional, illustrative). */
export const JUR_DEFAULTS_ES = {
  query: 'Plazos de entrega en contratos de suministro',
  jurisdictions: [{key: 'j1', name: 'Valnorte'}, {key: 'j2', name: 'Estemar'}, {key: 'j3', name: 'Surholm'}],
  relevant: 'j1',
  sources: [
    {id: 'DOC-11', title: 'Expediente de suministro', declares: 'j1'},
    {id: 'DOC-12', title: 'Contrato de transporte', declares: 'j2'},
    {id: 'DOC-13', title: 'Arrendamiento de almacén', declares: 'j1'},
    {id: 'DOC-14', title: 'Condiciones de servicio', declares: 'j3'},
    {id: 'DOC-15', title: 'Pedidos de compra', declares: 'j1'},
  ],
  citations: ['Ref. 11-A', 'Ref. 12-C', 'Ref. 13-A', 'Ref. 14-B', 'Ref. 15-A'],
  dates: ['12 mar 2019', '4 jun 2020', '30 sep 2020', '15 ene 2021', '8 jul 2021'],
};

/** Built-in scene strings (user content is never translated). */
export const JUR_STRINGS = {
  en: {
    library: 'Library',
    terminal: 'Search terminal',
    filter: 'Jurisdiction filter',
    card: 'Research card',
    query: 'Query',
    declared: 'Declared jurisdiction',
    relevantJur: 'Relevant jurisdiction',
    otherJur: 'Other jurisdiction',
    keyOnCard: 'Relevant (on the card)',
    separated: 'Separated by declared jurisdiction',
    pendingRun: 'Filter set · not run yet',
    same: 'same as the card',
    different: 'different from the card',
    listed: 'Listed on the card',
    setAside: 'Set aside',
    reads: 'reads',
    documents: 'documents',
  },
  es: {
    library: 'Biblioteca',
    terminal: 'Buscador',
    filter: 'Filtro de jurisdicción',
    card: 'Ficha de investigación',
    query: 'Consulta',
    declared: 'Jurisdicción declarada',
    relevantJur: 'Jurisdicción pertinente',
    otherJur: 'Otra jurisdicción',
    keyOnCard: 'Pertinente (en la ficha)',
    separated: 'Separados según la jurisdicción declarada',
    pendingRun: 'Filtro preparado · sin ejecutar',
    same: 'igual que la ficha',
    different: 'distinta de la ficha',
    listed: 'Anotado en la ficha',
    setAside: 'Apartado',
    reads: 'lee',
    documents: 'documentos',
  },
};

/**
 * Resolve the supplied content into a stable model shared by the entries.
 * A document is "relevant" only when the key it declares equals the key the
 * author marked on the card — a comparison of two supplied labels.
 * @param {any} p params
 */
export function resolveJur(p) {
  const byKey = {};
  p.jurisdictions.forEach((j, idx) => { if (!byKey[j.key]) byKey[j.key] = {key: j.key, name: j.name, idx}; });
  const jurOf = key => byKey[key] || {key, name: '', idx: -1};
  const relevant = jurOf(p.relevant);
  const docs = p.sources.map((s, i) => ({
    i,
    id: s.id,
    title: s.title || '',
    date: (p.dates || [])[i] || '',
    citation: (p.citations || [])[i] || '',
    key: s.declares,
    name: jurOf(s.declares).name,
    relevant: s.declares === p.relevant,
  }));
  return {byKey, jurOf, relevant, docs, nA: docs.filter(d => d.relevant).length, nB: docs.filter(d => !d.relevant).length};
}

/**
 * Find the jurisdiction whose name matches a free-text value (inspect
 * substitutions); returns null when the value names no listed jurisdiction.
 */
export function jurByName(p, value) {
  const v = String(value || '').trim().toLowerCase();
  const j = p.jurisdictions.find(x => x.name.trim().toLowerCase() === v);
  return j ? {key: j.key, name: j.name} : null;
}

/* ------------------------------------------------------------------- text */

/**
 * Bounded text fit that never breaks a hyphenated name inside a word when it
 * can break at a hyphen instead ("Northvale-upon-" / "Eastmere"). Falls back
 * to smaller sizes (down to minSize) before accepting a mid-word break or an
 * ellipsis. Same result shape as ctx.fit.
 * @param {any} ctx
 * @param {string} text
 * @param {any} o ctx.fit options
 */
export function fitHy(ctx, text, o) {
  const s = String(text ?? '');
  const f = ctx.fit(s, o);
  const clean = s.replace(/\s+/g, ' ').trim();
  if (f.truncated || f.lines.join(' ') === clean) return f;
  // f broke a word: `midWord` lets callers try another size or line count
  if (!s.includes('-')) return {...f, midWord: true};
  const hy = s.replace(/-(?=\S)/g, '- ');
  const minS = Math.max(8, o.minSize ?? o.size * 0.72);
  const step = Math.max(0.5, o.size * 0.04);
  for (let size = o.size; size >= minS - 0.01; size -= step) {
    const a = ctx.fit(hy, {...o, size, minSize: size});
    if (a.truncated) continue;
    const lines = a.lines.map(l => l.replace(/- /g, '-'));
    const joined = lines.reduce((acc, l) => (acc ? (acc.endsWith('-') ? acc + l : `${acc} ${l}`) : l), '');
    if (joined !== clean) continue;
    const width = Math.max(...lines.map(l => ctx.measure(l, a.size, a.weight, a.family)));
    return {...a, lines, width, full: s};
  }
  return {...f, midWord: true};
}

/** A context whose fit() uses fitHy (for chips and blocks built by shared primitives). */
export function hyCtx(ctx) {
  return ctx.fitHy ? ctx : {...ctx, fit: (t, o) => fitHy(ctx, t, o), fitHy: true};
}

/* ------------------------------------------------------------------ colour */

/** Colour pair of a jurisdiction key ('none' = neutral outline). */
export function jurColor(ctx, key) {
  const th = ctx.theme;
  if (key === 'j1') return {c: th.accent2, soft: th.accent2Soft};
  if (key === 'j2') return {c: th.accent, soft: th.accentSoft};
  if (key === 'j3') return {c: th.accent4, soft: th.accent4Soft};
  return {c: th.inkSoft, soft: th.paperShade};
}

/* ----------------------------------------------------------------- emblems */

/** Emblem outline path of size `s` centred on (0,0): circle / triangle / square. */
export function emblemPath(key, s) {
  const k = s / 2;
  if (key === 'j2') return `M0 ${r(-k * 1.02)}L${r(k * 0.98)} ${r(k * 0.74)}L${r(-k * 0.98)} ${r(k * 0.74)}Z`;
  if (key === 'j3') return roundRectPath(-k * 0.82, -k * 0.82, k * 1.64, k * 1.64, k * 0.16);
  // j1 and unknown keys: circle
  return `M${r(-k * 0.92)} 0A${r(k * 0.92)} ${r(k * 0.92)} 0 1 0 ${r(k * 0.92)} 0A${r(k * 0.92)} ${r(k * 0.92)} 0 1 0 ${r(-k * 0.92)} 0Z`;
}

/**
 * Filled emblem with a light inner mark (so it reads in the mono palette).
 * `key` 'none' draws a dashed hollow ring (no declared/listed jurisdiction).
 * @param {any} ctx
 * @param {{key:string, s:number, x?:number, y?:number, name?:string, stroke?:string, opacity?:number}} o
 */
export function emblem(ctx, o) {
  const th = ctx.theme;
  const {c} = jurColor(ctx, o.key);
  const s = o.s;
  if (o.key === 'none') {
    return g({name: o.name, transform: T(o.x ?? 0, o.y ?? 0), opacity: o.opacity},
      h('path', {d: emblemPath('j1', s), fill: 'none', stroke: th.inkSoft, 'stroke-width': Math.max(1.5, s * 0.07), 'stroke-dasharray': `${r(s * 0.14)} ${r(s * 0.11)}`}));
  }
  return g({name: o.name, transform: T(o.x ?? 0, o.y ?? 0), opacity: o.opacity},
    h('path', {d: emblemPath(o.key, s), fill: c, stroke: o.stroke ?? th.ink, 'stroke-width': Math.max(1.4, s * 0.06), 'stroke-linejoin': 'round'}),
    h('path', {d: emblemPath(o.key, s * 0.42), transform: o.key === 'j2' ? T(0, s * 0.06) : undefined, fill: 'none', stroke: '#ffffff', 'stroke-width': Math.max(1.2, s * 0.06), opacity: 0.85}),
  );
}

/**
 * Round stamp seal holding an emblem (as printed on a document).
 * @param {any} ctx
 * @param {{key:string, R:number, x:number, y:number, name?:string}} o
 */
export function seal(ctx, o) {
  const th = ctx.theme;
  const {c} = jurColor(ctx, o.key);
  return g({name: o.name, transform: T(o.x, o.y)},
    h('circle', {r: o.R, fill: th.paper, stroke: c, 'stroke-width': Math.max(2, o.R * 0.12)}),
    h('circle', {r: o.R * 0.8, fill: 'none', stroke: c, 'stroke-width': Math.max(1, o.R * 0.04), 'stroke-dasharray': `${r(o.R * 0.12)} ${r(o.R * 0.08)}`}),
    emblem(ctx, {key: o.key, s: o.R * 1.05}),
  );
}

/** Dashed empty seal ring (a declaration not yet shown). */
export function blankSeal(ctx, {R, x, y, name}) {
  const th = ctx.theme;
  return g({name, transform: T(x, y)},
    h('circle', {r: R, fill: th.paper, stroke: th.inkFaint, 'stroke-width': Math.max(1.6, R * 0.08), 'stroke-dasharray': `${r(R * 0.25)} ${r(R * 0.18)}`}),
  );
}

/* --------------------------------------------------------- source document */

/**
 * Source document sheet. Local origin = top-left corner. The declared
 * jurisdiction appears twice on the sheet: as a round seal (top-right) and as
 * a tinted declaration strip with the name.
 *
 * Named nodes (for the entry's frame): `${prefix}-txt` (id/title/footer text
 * group), `${prefix}-decl` (seal + strip of the declared jurisdiction),
 * `${prefix}-dname` (declared name text), and optionally `${prefix}-blank`
 * (dashed empty declaration) and `${prefix}-alt` / `${prefix}-aname` (a
 * substituted declaration).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, doc:{id:string,title?:string,date?:string,citation?:string},
 *   jur:{key:string,name:string}, alt?:{key:string,name:string}|null, detail?:'small'|'full',
 *   blank?:boolean, textLevel?:'key'|'all', caption?:string}} o
 */
export function sourceSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix} = o;
  const full = o.detail === 'full';
  const showTxt = ctx.show(o.textLevel ?? 'all');
  const pad = w * 0.085;
  const fold = w * 0.13;
  const R = w * (full ? 0.125 : 0.155);
  const idSize = Math.max(11, w * (full ? 0.07 : 0.1));
  const sealC = {x: w - pad - R, y: pad + R};
  const parts = [];
  parts.push(h('path', {d: roundRectPath(5, 8, w, hh, 5), fill: th.shadow}));
  parts.push(h('path', {d: `M0 4Q0 0 4 0H${r(w - 4)}Q${r(w)} 0 ${r(w)} 4V${r(hh - fold)}L${r(w - fold)} ${r(hh)}H4Q0 ${r(hh)} 0 ${r(hh - 4)}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(w)} ${r(hh - fold)}H${r(w - fold * 0.86)}Q${r(w - fold)} ${r(hh - fold)} ${r(w - fold)} ${r(hh - fold * 0.86)}V${r(hh)}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke * 0.8, 'stroke-linejoin': 'round'}));

  const txt = [];
  // identifier row
  if (showTxt && o.doc.id) {
    const f = ctx.fit(o.doc.id, {maxWidth: w - pad * 2 - R * 2 - 4, size: idSize, minSize: 9, maxLines: 1, weight: 700, family: 'mono'});
    txt.push(textBlock(f, {x: pad, y: pad * 0.9, fill: th.inkSoft}));
  } else {
    parts.push(h('rect', {x: pad, y: pad, width: w * 0.34, height: idSize * 0.6, rx: 2, fill: th.paperLine}));
  }
  let y = pad + R * 2 + (full ? pad * 0.6 : pad * 0.45);
  // declaration strip: the name may wrap (at its hyphens first, never inside a word) on two
  // lines, or three when two would need a mid-word break, an ellipsis or a much smaller size;
  // the strip grows with it
  const nameSize = Math.max(12, w * 0.088);
  const nameFit = (name, maxW) => {
    const base = {maxWidth: maxW, size: nameSize, weight: 800};
    const ok = f => !f.truncated && !f.midWord;
    const f2 = fitHy(ctx, name, {...base, minSize: Math.max(9, nameSize * 0.86), maxLines: 2});
    if (ok(f2)) return f2;
    const f3 = fitHy(ctx, name, {...base, minSize: 9, maxLines: 3});
    if (ok(f3)) return f3;
    const f2s = fitHy(ctx, name, {...base, minSize: 9, maxLines: 2});
    if (ok(f2s)) return f2s;
    return f3.truncated && !f2s.truncated ? f2s : f3;
  };
  const esFull = w * 0.3 * 0.46;
  const esSmall = w * 0.135;
  const bar = Math.max(4, w * 0.035);
  const nameMaxW = w - pad * 1.1 - bar - esFull * 1.44 - 4;
  // small sheets (story line): a larger name, two lines (or three shorter ones) before any ellipsis
  const smallSize = Math.max(11, w * 0.11);
  const smallMaxW = w - pad * 1.1 - bar - esSmall * 1.44 - 4;
  const smallFit = name => {
    const f2 = fitHy(ctx, name, {maxWidth: smallMaxW, size: smallSize, minSize: 11, maxLines: 2, weight: 800});
    if (!f2.truncated && !f2.midWord) return f2;
    const f3 = fitHy(ctx, name, {maxWidth: smallMaxW, size: Math.min(smallSize, 13.5), minSize: 9, maxLines: 3, weight: 800});
    return f3.truncated && !f2.truncated ? f2 : f3;
  };
  const jurs = [o.jur, o.alt].filter(Boolean);
  const capSize = Math.max(9, w * 0.052);
  const nameFits = full && showTxt ? jurs.map(j => (j.name ? nameFit(j.name, nameMaxW) : null)).filter(Boolean) : [];
  const nameLines = nameFits.length ? Math.max(...nameFits.map(f => f.lines.length)) : 1;
  const nameH = nameFits.length ? Math.max(...nameFits.map(f => f.height)) : 0;
  const smallH = !full && showTxt ? Math.max(...jurs.map(j => (j.name ? smallFit(j.name).height : 0))) : 0;
  const stripH = full
    ? Math.max(w * 0.3 + (nameLines - 1) * nameSize * 1.15, nameFits.length ? capSize * 1.9 + nameH + 8 : 0)
    : Math.max(w * 0.24, smallH + 12);
  // footer (date · reference) of full sheets; it is left out when the sheet has no room for it
  const fs = Math.max(10, w * 0.058);
  const footText = full && showTxt ? [o.doc.date, o.doc.citation].filter(Boolean).join(' · ') : '';
  let footOn = Boolean(footText);
  // title (full detail only): two lines, or one when the declaration would not fit below it
  if (full) {
    const tSize = Math.max(12, w * 0.085);
    const below = () => stripH + pad * 0.3 + (footOn ? fs + pad * 1.2 : pad);
    if (showTxt && o.doc.title) {
      let f = ctx.fit(o.doc.title, {maxWidth: w - pad * 2, size: tSize, minSize: 10, maxLines: 2, weight: 700, family: 'serif'});
      if (y + f.height + tSize * 0.6 + below() > hh) f = ctx.fit(o.doc.title, {maxWidth: w - pad * 2, size: tSize, minSize: 10, maxLines: 1, weight: 700, family: 'serif'});
      if (y + f.height + tSize * 0.6 + below() > hh) footOn = false;
      txt.push(textBlock(f, {x: pad, y, fill: th.ink}));
      y += f.height + tSize * 0.6;
    } else {
      parts.push(h('rect', {x: pad, y, width: (w - pad * 2) * 0.8, height: tSize * 0.62, rx: 3, fill: th.ink, opacity: 0.75}));
      y += tSize * 1.4;
      if (y + below() > hh) footOn = false;
    }
  } else {
    parts.push(h('rect', {x: pad, y: pad + idSize * 1.35, width: w * 0.36, height: Math.max(3, w * 0.035), rx: 2, fill: th.ink, opacity: 0.55}));
  }
  const strip = {x: pad * 0.55, y, w: w - pad * 1.1, h: stripH};
  const declPart = (jur, nameNode, key) => {
    const {c, soft} = jurColor(ctx, jur.key);
    const es = full ? esFull : esSmall;
    const ex = strip.x + bar + es * 0.72;
    const nodes = [
      h('path', {d: roundRectPath(strip.x, strip.y, strip.w, strip.h, 4), fill: soft, stroke: c, 'stroke-width': 1.6}),
      h('rect', {x: strip.x, y: strip.y, width: bar, height: strip.h, rx: 2, fill: c}),
      emblem(ctx, {key: jur.key, s: es, x: ex, y: strip.y + strip.h / 2}),
      seal(ctx, {key: jur.key, R, x: sealC.x, y: sealC.y}),
    ];
    const tx = ex + es * 0.72;
    const maxW = strip.x + strip.w - tx - 4;
    if (showTxt && jur.name) {
      if (full) {
        const capF = ctx.fit(o.caption ?? ctx.t.declared, {maxWidth: maxW, size: capSize, minSize: 8, maxLines: 1, weight: 600});
        const nameF = nameFit(jur.name, maxW);
        const top = strip.y + (strip.h - capF.size * 1.9 - nameF.height) / 2;
        nodes.push(g({name: nameNode},
          textBlock(capF, {x: tx, y: top, fill: th.inkSoft}),
          textBlock(nameF, {x: tx, y: top + capF.size * 1.9, fill: th.ink})));
      } else {
        const nameF = smallFit(jur.name);
        nodes.push(g({name: nameNode}, textBlock(nameF, {x: tx, y: strip.y + (strip.h - nameF.height) / 2, fill: th.ink})));
      }
    } else {
      nodes.push(g({name: nameNode}, h('rect', {x: tx, y: strip.y + strip.h * 0.38, width: Math.max(8, maxW * 0.7), height: strip.h * 0.24, rx: 2, fill: c, opacity: 0.55})));
    }
    return g({name: key}, nodes);
  };
  const blank = o.blank ? g({name: `${prefix}-blank`},
    h('path', {d: roundRectPath(strip.x, strip.y, strip.w, strip.h, 4), fill: 'none', stroke: th.inkFaint, 'stroke-width': 1.8, 'stroke-dasharray': '6 5'}),
    blankSeal(ctx, {R, x: sealC.x, y: sealC.y}),
  ) : null;
  const decl = declPart(o.jur, `${prefix}-dname`, `${prefix}-decl`);
  const alt = o.alt ? declPart(o.alt, `${prefix}-aname`, `${prefix}-alt`) : null;
  y += stripH + pad * 0.6;
  // body text bars (only where they fit: never under the footer)
  const barH = Math.max(3, w * 0.03);
  const footer = footOn ? Math.max(11, w * 0.06) * 1.8 : 0;
  const nBars = Math.max(full ? 0 : 1, Math.floor((hh - y - pad - footer - fold * 0.4) / (barH * 2.4)));
  for (let b = 0; b < Math.min(nBars, full ? 6 : 4); b++) {
    const lw = (w - pad * 2) * (b % 3 === 2 ? 0.55 : 0.9 - ctx.rng(`${prefix}-bar`, b) * 0.12);
    parts.push(h('rect', {x: pad, y: y + b * barH * 2.4, width: r(lw), height: barH, rx: barH / 2, fill: th.paperLine}));
  }
  // footer: date and reference (full detail)
  if (footOn) {
    const f = ctx.fit(footText, {maxWidth: w - pad * 2 - fold * 0.6, size: fs, minSize: 8, maxLines: 1, weight: 600, family: 'mono'});
    txt.push(textBlock(f, {x: pad, y: hh - pad - f.size, fill: th.inkSoft}));
  }
  const node = g({name: prefix}, parts, blank, decl, alt, g({name: `${prefix}-txt`}, txt));
  // nameCut: a declared name had to be cut (ellipsis) or broken inside a word
  // declText: the band of the strip that holds the caption and the declared name (full sheets)
  const declTextH = full && nameFits.length ? capSize * 1.9 + nameH : strip.h * 0.5;
  const declText = {x: strip.x, y: strip.y + (strip.h - declTextH) / 2, w: strip.w, h: declTextH};
  return {node, w, h: hh, sealC, R, strip, declText, hasText: showTxt, nameCut: nameFits.some(f => f.truncated || f.midWord)};
}

/* ----------------------------------------------------------- research card */

/**
 * Library index card (ficha) with a red header rule, ruled lines and the rod
 * hole of catalogue cards. The key row shows the relevant jurisdiction's
 * emblem and name. Local origin = top-left.
 * Named nodes: `${prefix}`, `${prefix}-txt`, `${prefix}-key`, and one
 * `${prefix}-line${i}` group per listed-reference slot.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, query:string, jur:{key:string,name:string}, lines?:string[], textLevel?:'key'|'all', compact?:boolean, reserveRight?:number}} o
 */
export function indexCard(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix} = o;
  const showTxt = ctx.show(o.textLevel ?? 'all');
  const pad = w * 0.06;
  const cardFill = '#fbf6e6';
  const parts = [
    h('path', {d: roundRectPath(5, 8, w, hh, 7), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 7), fill: cardFill, stroke: th.ink, 'stroke-width': th.stroke}),
  ];
  // header: query (the red rule sits under it)
  const qSize = Math.max(10, hh * (o.compact ? 0.13 : 0.085));
  const qFit = showTxt && o.query ? ctx.fit(`${ctx.t.query}: ${o.query}`, {maxWidth: w - pad * 2, size: qSize, minSize: Math.max(8, qSize * 0.7), maxLines: o.compact ? 1 : 2, weight: 600}) : null;
  const qTop = pad * 0.6;
  const headY = Math.max(hh * (o.compact ? 0.3 : 0.2), qTop + (qFit ? qFit.height : qSize) + hh * 0.06);
  parts.push(h('line', {x1: 3, x2: w - 3, y1: headY, y2: headY, stroke: '#c8553d', 'stroke-width': Math.max(1.6, hh * 0.012)}));
  const ruleGap = hh * 0.105;
  for (let yy = headY + ruleGap; yy < hh - ruleGap * 0.6; yy += ruleGap) parts.push(h('line', {x1: 3, x2: w - 3, y1: r(yy), y2: r(yy), stroke: '#9fbfd6', 'stroke-width': 1.1, opacity: 0.8}));
  // catalogue rod hole
  const hole = {x: w / 2, y: hh - hh * 0.09};
  parts.push(h('circle', {cx: hole.x, cy: hole.y, r: Math.max(3, hh * 0.035), fill: shade(cardFill, -0.35), stroke: th.ink, 'stroke-width': 1.4}));
  const txt = [];
  if (qFit) txt.push(textBlock(qFit, {x: pad, y: Math.max(qTop, headY - qFit.height - hh * 0.04), fill: th.ink}));
  else parts.push(h('rect', {x: pad, y: headY - qSize * 1.2, width: w * 0.6, height: qSize * 0.6, rx: 2, fill: th.inkSoft, opacity: 0.6}));
  // key row: relevant jurisdiction
  const es = hh * (o.compact ? 0.3 : 0.2);
  const keyC = {x: pad + es * 0.6, y: headY + (o.compact ? hh * 0.26 : Math.max(ruleGap * 1.7, es * 0.5 + hh * 0.08))};
  const keyNodes = [emblem(ctx, {key: o.jur.key, s: es, x: keyC.x, y: keyC.y})];
  const reserve = o.reserveRight ?? 0;
  if (showTxt) {
    const tx = keyC.x + es * 0.8;
    const maxW = w - tx - pad - reserve;
    const cap = ctx.fit(ctx.t.relevantJur, {maxWidth: maxW, size: Math.max(9, hh * (o.compact ? 0.085 : 0.062)), minSize: 8, maxLines: 1, weight: 600});
    const nmSize = Math.max(11, hh * (o.compact ? 0.13 : 0.1));
    let nm = fitHy(ctx, o.jur.name, {maxWidth: maxW, size: nmSize, minSize: 9, maxLines: 1, weight: 800});
    if (nm.truncated) nm = fitHy(ctx, o.jur.name, {maxWidth: maxW, size: nmSize * 0.9, minSize: 9, maxLines: 2, weight: 800});
    const top = keyC.y - (cap.size * 1.75 + nm.height) / 2;
    keyNodes.push(textBlock(cap, {x: tx, y: top, fill: th.inkSoft}), textBlock(nm, {x: tx, y: top + cap.size * 1.75, fill: jurColor(ctx, o.jur.key).c}));
  } else {
    keyNodes.push(h('rect', {x: keyC.x + es * 0.8, y: keyC.y - es * 0.12, width: Math.min(w * 0.4, w - keyC.x - es * 0.8 - pad - reserve), height: es * 0.26, rx: 2, fill: jurColor(ctx, o.jur.key).c, opacity: 0.6}));
  }
  // listed-reference slots (filled by the contrast entry)
  const slots = [];
  const lines = o.lines || [];
  const firstY = keyC.y + es * 0.75;
  lines.forEach((text, i) => {
    const yy = firstY + i * ruleGap * 1.25;
    const lsz = Math.max(10, ruleGap * 0.72);
    const box = {x: pad, y: yy, w: w - pad * 2 - reserve, h: lsz * 1.2};
    const nodes = [h('circle', {cx: pad + lsz * 0.35, cy: yy + lsz * 0.55, r: lsz * 0.22, fill: jurColor(ctx, o.jur.key).c})];
    if (showTxt && text) {
      const f = ctx.fit(text, {maxWidth: box.w - lsz, size: lsz, minSize: 8, maxLines: 1, weight: 600, family: 'mono'});
      nodes.push(textBlock(f, {x: pad + lsz * 0.8, y: yy, fill: th.ink}));
    } else {
      nodes.push(h('rect', {x: pad + lsz * 0.8, y: yy + lsz * 0.3, width: box.w * 0.6, height: lsz * 0.45, rx: 2, fill: th.ink, opacity: 0.55}));
    }
    slots.push(box);
    txt.push(g({name: `${prefix}-line${i}`, opacity: 0}, nodes));
  });
  const node = g({name: prefix}, parts, g({name: `${prefix}-key`}, keyNodes), g({name: `${prefix}-txt`}, txt));
  return {node, w, h: hh, keyC, keyS: es, hole, slots, headY};
}

/* ---------------------------------------------------------------- bookcase */

/**
 * Library bookcase, front view. Local origin = top-left of the carcass.
 * `rows` lists shelf compartments from the top: 'books' draws seeded spines,
 * 'open' leaves the compartment empty (for documents), 'rail' draws a dark
 * back panel for hanging files. Returns the inner box of every compartment.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, rows:Array<{kind:'books'|'open'|'rail', h:number}>, seedKey?:string}} o
 */
export function bookcase(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix} = o;
  const side = Math.max(12, w * 0.05);
  const crown = Math.max(18, hh * 0.035);
  const plinth = Math.max(16, hh * 0.03);
  const plank = Math.max(8, hh * 0.014);
  const wood = th.wood, dark = th.woodDark;
  const parts = [
    h('path', {d: roundRectPath(8, 10, w, hh, 6), fill: th.shadow}),
    h('rect', {x: 0, y: 0, width: w, height: hh, rx: 6, fill: wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: -6, y: -4, width: w + 12, height: crown, rx: 5, fill: shade(wood, 0.08), stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: -2, y: hh - plinth, width: w + 4, height: plinth, rx: 3, fill: dark, stroke: th.ink, 'stroke-width': th.stroke}),
  ];
  const innerX = side, innerW = w - side * 2;
  const total = o.rows.reduce((a, b) => a + b.h, 0);
  const avail = hh - crown - plinth - plank * (o.rows.length - 1) - 4;
  let y = crown;
  const inner = [];
  const key = o.seedKey || prefix;
  o.rows.forEach((row, i) => {
    const rh = (row.h / total) * avail;
    const box = {x: innerX, y, w: innerW, h: rh, kind: row.kind};
    inner.push(box);
    parts.push(h('rect', {x: innerX, y, width: innerW, height: rh, fill: row.kind === 'rail' ? shade(dark, -0.35) : shade(dark, -0.18), stroke: th.ink, 'stroke-width': 1.5}));
    parts.push(h('rect', {x: innerX, y, width: innerW, height: Math.max(6, rh * 0.06), fill: '#000', opacity: 0.18}));
    if (row.kind === 'books') {
      let bx = innerX + 6;
      let b = 0;
      while (bx < innerX + innerW - 14) {
        const bw = 14 + Math.floor(ctx.rng(`${key}-bw${i}`, b) * 16);
        if (bx + bw > innerX + innerW - 6) break;
        const bh = rh * (0.62 + ctx.rng(`${key}-bh${i}`, b) * 0.3);
        const col = th.cloth[Math.floor(ctx.rng(`${key}-bc${i}`, b) * th.cloth.length)];
        const lean = ctx.rng(`${key}-lean${i}`, b) > 0.9 && bx < innerX + innerW - 60;
        const by = y + rh - bh;
        const bookD = roundRectPath(bx, by, bw, bh, 2);
        parts.push(h('path', {d: bookD, fill: shade(col, -0.08), stroke: th.ink, 'stroke-width': 1.4, transform: lean ? `rotate(12 ${r(bx + bw)} ${r(y + rh)})` : undefined}));
        parts.push(h('rect', {x: bx + 2, y: by + bh * 0.16, width: bw - 4, height: Math.max(2, bh * 0.05), fill: '#ffffff', opacity: 0.45, transform: lean ? `rotate(12 ${r(bx + bw)} ${r(y + rh)})` : undefined}));
        bx += bw + (lean ? 16 : 1.5);
        b++;
      }
    }
    y += rh;
    if (i < o.rows.length - 1) {
      parts.push(h('rect', {x: innerX - 2, y, width: innerW + 4, height: plank, fill: shade(wood, 0.05), stroke: th.ink, 'stroke-width': 1.5}));
      y += plank;
    }
  });
  return {node: g({name: prefix}, parts), inner, w, h: hh, crown};
}

/* --------------------------------------------------------------- polylines */

/**
 * Polyline through `pts` with rounded (quadratic) corners of radius `rad`,
 * densely sampled so objects can travel along it by arc length.
 * @param {Array<{x:number,y:number}>} pts
 * @param {number} rad
 */
export function filleted(pts, rad) {
  const out = [pts[0]];
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const la = Math.hypot(b.x - a.x, b.y - a.y), lc = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, la / 2, lc / 2);
    const p1 = {x: b.x + ((a.x - b.x) / (la || 1)) * rr, y: b.y + ((a.y - b.y) / (la || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (lc || 1)) * rr, y: b.y + ((c.y - b.y) / (lc || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    out.push(p1);
    for (let k = 1; k <= 8; k++) {
      const t = k / 8;
      out.push({x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * b.x + t * t * p2.x, y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * b.y + t * t * p2.y});
    }
  }
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  out.push(last);
  // drop duplicate consecutive samples
  const clean = out.filter((p, i) => i === 0 || Math.hypot(p.x - out[i - 1].x, p.y - out[i - 1].y) > 0.01);
  const poly = polyline(clean);
  return {poly, d, pts: clean};
}

/** Arc length along a polyline to the sample closest to point q. */
export function arcTo(poly, q) {
  let best = Infinity, at = 0, acc = 0;
  const P = poly.pts;
  for (let i = 0; i < P.length; i++) {
    if (i) acc += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
    const d = Math.hypot(P[i].x - q.x, P[i].y - q.y);
    if (d < best) { best = d; at = acc; }
  }
  return at;
}

/** Axis-aligned overlap area fraction of box a covered by box b. */
export function coverFraction(a, b) {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return (ix * iy) / Math.max(1, a.w * a.h);
}

/** Axis-aligned box helpers. */
export const boxOf = (x, y, w, hh) => ({x, y, w, h: hh});
export const unionBox = list => {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};
export const hitBox = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** "=" or "≠" glyph drawn as strokes (text-free), centred on (x,y). */
export function relGlyph(ctx, {same, x, y, s, color}) {
  const c = color ?? ctx.theme.ink;
  const w = s, gap = s * 0.28;
  const parts = [
    h('line', {x1: x - w / 2, x2: x + w / 2, y1: y - gap / 2, y2: y - gap / 2, stroke: c, 'stroke-width': s * 0.14, 'stroke-linecap': 'round'}),
    h('line', {x1: x - w / 2, x2: x + w / 2, y1: y + gap / 2, y2: y + gap / 2, stroke: c, 'stroke-width': s * 0.14, 'stroke-linecap': 'round'}),
  ];
  if (!same) parts.push(h('line', {x1: x + w * 0.22, x2: x - w * 0.22, y1: y - s * 0.46, y2: y + s * 0.46, stroke: c, 'stroke-width': s * 0.14, 'stroke-linecap': 'round'}));
  return g(null, parts);
}

/**
 * Rack end plate: "=" or "≠" next to the card's emblem, hung on a short
 * strap. Local origin = strap top (on the rail end).
 */
export function rulePlate(ctx, {name, same, key, s = 58, x, y, strap = true}) {
  const th = ctx.theme;
  const pw = s * 2.1, ph = s * 1.05;
  const top = strap ? s * 0.35 : 0;
  return g({name, transform: T(x, y)},
    strap ? h('line', {x1: 0, y1: 0, x2: 0, y2: top, stroke: th.metalDark, 'stroke-width': 3}) : null,
    h('path', {d: roundRectPath(-pw / 2, top, pw, ph, 8), fill: th.card, stroke: th.ink, 'stroke-width': th.stroke}),
    relGlyph(ctx, {same, x: -pw * 0.22, y: top + ph / 2, s: s * 0.5, color: th.ink}),
    emblem(ctx, {key, s: s * 0.62, x: pw * 0.2, y: top + ph / 2}),
  );
}

/** Size of a rulePlate without strap. */
export const plateSize = (s = 58) => ({w: s * 2.1, h: s * 1.05});

/* ------------------------------------------------------ zone chip packing */

const inBox = (p, b) => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;

/** Leader start on a chip edge (mirrors the callout leader rule). */
export function leaderStart(b, target) {
  const from = {x: Math.max(b.x, Math.min(target.x, b.x + b.w)), y: target.y > b.y + b.h ? b.y + b.h : target.y < b.y ? b.y : b.y + b.h / 2};
  if (from.y === b.y + b.h / 2) from.x = target.x > b.x + b.w / 2 ? b.x + b.w : b.x;
  return from;
}

/** Does segment a→b cross any box (the last `skip` units may touch the target)? */
export function crosses(a, b, boxes, skip = 12) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < 1) return false;
  const steps = Math.ceil(L / 5);
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    if (L * (1 - t) < skip) break;
    const q = {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
    if (boxes.some(bx => bx && inBox(q, bx))) return true;
  }
  return false;
}

/**
 * Place a chip of one of several sizes inside free zones: every candidate
 * position on a grid inside each zone is tried; a candidate must clear the
 * obstacles (pad) and, when a target is given, its leader must not cross an
 * obstacle other than the target's own boxes. The shortest leader wins.
 * @param {Array<{w:number,h:number}>} sizes
 * @param {{x:number,y:number}|null} target
 * @param {Array<{x:number,y:number,w:number,h:number}>} zones
 * @param {Array<any>} obstacles boxes
 * @param {{own?:any[], pad?:number, step?:number, align?:'top'|'bottom', soft?:any[], softPad?:number, sizePenalty?:number, zonePenalty?:number, softCross?:number}} [o]
 * @returns {{box:any, k:number, end:{x:number,y:number}|null}|null}
 */
export function packInZones(sizes, target, zones, obstacles, o = {}) {
  const pad = o.pad ?? 10;
  const step = o.step ?? 12;
  const own = o.own || [];
  const lead = obstacles.filter(b => b && !own.includes(b));
  // soft obstacles (thin rails, routes) block the chip itself but a leader may cross them
  const soft = o.soft || [];
  const softPad = o.softPad ?? 4;
  const sizePenalty = o.sizePenalty ?? 140;
  let best = null;
  sizes.forEach((sz, k) => {
    for (const [zi, z] of zones.entries()) {
      if (sz.w > z.w + 0.5 || sz.h > z.h + 0.5) continue;
      const ys = [];
      for (let y = z.y; y <= z.y + z.h - sz.h + 0.01; y += step) ys.push(y);
      if (o.align === 'bottom') ys.reverse();
      const xs = [];
      for (let x = z.x; x <= z.x + z.w - sz.w + 0.01; x += step) xs.push(x);
      xs.push(z.x + z.w - sz.w, z.x + (z.w - sz.w) / 2);
      for (const y of ys) {
        for (const x of xs) {
          const box = {x, y, w: sz.w, h: sz.h};
          if (obstacles.some(b => b && hitBox(box, b, pad))) continue;
          if (soft.some(b => b && hitBox(box, b, softPad))) continue;
          let cost = k * sizePenalty + zi * (o.zonePenalty ?? 0);
          let end = null;
          if (target) {
            const from = leaderStart(box, target);
            const L = Math.hypot(from.x - target.x, from.y - target.y);
            if (L < 16) continue;
            if (crosses(from, target, lead)) continue;
            cost += L;
            // a leader may cross a soft obstacle (a rail), but a placement without that crossing is preferred
            if (o.softCross && crosses(from, target, soft)) cost += o.softCross;
            end = target;
          } else cost += (o.align === 'bottom' ? (z.y + z.h - y - sz.h) : (y - z.y)) + Math.abs(x + sz.w / 2 - (z.x + z.w / 2)) * 0.2;
          if (!best || cost < best.cost) best = {cost, box, k, end};
        }
      }
    }
  });
  return best;
}
