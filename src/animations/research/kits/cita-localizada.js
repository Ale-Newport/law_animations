/**
 * "Cita localizada" kit (LAW-0045..0048): original vector art and a pose
 * solver for a reference that is broken into its locating parts
 * (source · volume · page · paragraph) and followed to a highlighted
 * paragraph.
 *
 * Art (all original geometry):
 *  - bookcase(): a three-row library shelf with seeded spines and brass
 *    shelf plates; the target slot is left empty for the travelling book;
 *  - bookRig(): one book that turns from spine view to cover view (two faces
 *    scaled by cos/sin of the turn angle about the shared hinge edge), opens
 *    (the cover flips about the hinge; its inside becomes the left page) and
 *    carries a paragraph highlight on the right page;
 *  - indexCard(): a ruled index card carrying the reference as written;
 *  - searchPanel(): a catalogue search box whose field splits into four
 *    compartments, one per reference part;
 *  - segToken() / segIcon(): colour-coded tokens for the four parts;
 *  - libraryStage(): first-person library nook (bookcase, search box,
 *    reading board, index card) with two IK arms that enter from the frame
 *    edge. The stage owns geometry and a pose solver only; each entry owns
 *    its own timeline, layout and semantics.
 *
 * Attachment rules enforced by the stage (tests read them from semantics):
 *  - the card is positioned from the SOLVED right hand (grip on its corner);
 *  - while the book is in hand it is positioned from the SOLVED left hand;
 *    while the cover opens the left hand rides the cover's free edge;
 *  - docked tokens follow their object (the volume token rides the book);
 *  - every IK target is inside arm reach (arm lengths are derived from the
 *    furthest target of each arm, `reach.*`).
 * @module animations/research/kits/cita-localizada
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, rad, dist, roundRectPath, catmullRom, polyline} from '../../../core/geometry.js';
import {textBlock, chip} from '../../../primitives/annotate.js';
import {wrap} from '../../../core/text.js';
import {shade} from '../../../primitives/paper.js';
import {topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj, int} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Parameters                                                          */
/* ------------------------------------------------------------------ */

/** The four locating parts of a reference, in reading order. */
export const SEG_KEYS = ['source', 'volume', 'page', 'paragraph'];

export const citationSchema = obj('A fictional reference split into the parts that locate a passage; an empty part marks an incomplete reference', {
  source: str('Source / collection name; the shelf whose plate carries the same name is the one it points to', 60),
  volume: str('Volume part, e.g. "Vol. 4" (empty = not given)', 30),
  page: str('Page part, e.g. "p. 112" (empty = not given)', 30),
  paragraph: str('Paragraph pinpoint, e.g. "¶ 3" (empty = not given)', 30),
}, ['source', 'volume', 'page', 'paragraph']);

/** Category field set for research motifs of this kit (brief: query, sources, citations, dates). */
export const researchFields = {
  query: str('The reference as written on the index card and entered in the search box (free text, fictional)', 90),
  sources: list('Source names on the shelf plates, top shelf first (fictional)', str('Shelf plate label', 50), 1, 3),
  citations: list('References: the first is decomposed and followed; a second one is printed on the card as a further note', citationSchema, 1, 2),
  dates: list('Descriptive date labels: [0] on the index card, [1] in the page header of the document (fictional, relative)', str('Date label', 30), 0, 2),
  pinpointRow: int('Which paragraph of the drawn page the pinpoint marks (1 = first paragraph on the page)', 1, 5),
};

/** Built-in strings for this kit. */
export const KIT_STRINGS = {
  en: {source: 'Source', volume: 'Volume', page: 'Page', paragraph: 'Paragraph', search: 'Catalogue search', card: 'Reference', researcher: 'Researcher', located: 'Paragraph located', pageOpened: 'Page opened', retrieved: 'Volume retrieved', shelf: 'Shelf identified', notGiven: 'not given', missing: 'Part not given'},
  es: {source: 'Fuente', volume: 'Volumen', page: 'Página', paragraph: 'Párrafo', search: 'Buscador del catálogo', card: 'Referencia', researcher: 'Investigadora', located: 'Párrafo localizado', pageOpened: 'Página abierta', retrieved: 'Volumen extraído', shelf: 'Estante identificado', notGiven: 'no indicado', missing: 'Parte no indicada'},
};

/** Parts of the first citation, with presence flags. */
export function citationParts(p, citation = p.citations[0]) {
  return SEG_KEYS.map(key => ({key, text: String(citation[key] || '').trim(), present: String(citation[key] || '').trim().length > 0}));
}

/**
 * How far a reference can lead given its parts: 4 = paragraph, 3 = page,
 * 2 = volume, 1 = shelf, 0 = nothing. A part only counts when every part
 * before it is present.
 */
export function locateDepth(parts) {
  let d = 0;
  for (const part of parts) {
    if (!part.present) break;
    d += 1;
  }
  return d;
}

/** Target shelf row for a source name (case-insensitive match on the plates, else the first row). */
export function targetRow(p, citation = p.citations[0]) {
  const want = String(citation.source || '').trim().toLowerCase();
  const i = p.sources.findIndex(s => s.trim().toLowerCase() === want);
  return i >= 0 ? Math.min(2, i) : 0;
}

/* ------------------------------------------------------------------ */
/* Colours and icons                                                   */
/* ------------------------------------------------------------------ */

const PAPER_CARD = '#fbf6e6';
const SPINES = ['#7d3c3c', '#3d5a6c', '#5b6e3a', '#8a6a2f', '#4f4a6b', '#9c5a3c', '#2f4f4f', '#6b4f3a', '#355c7d', '#8c4f6b'];
const TARGET_BOOK = '#2c4a6e';
const GOLD = '#d8b75a';

/** Colour set of a reference part. */
export function segColor(ctx, key) {
  const th = ctx.theme;
  const map = {
    source: [th.accent2, th.accent2Soft],
    volume: [th.accent4, th.accent4Soft],
    page: [shade(th.accent3, -0.28), th.accent3Soft],
    paragraph: [th.accent, th.accentSoft],
  };
  const [c, soft] = map[key];
  return {c, soft};
}

/**
 * Icon of a reference part, centred on (0,0), fitting a circle of radius R.
 * Drawn in `color` (usually white on the coloured token disc).
 */
export function segIcon(key, R, color) {
  const k = R / 10;
  const s = v => r(v * k, 2);
  const sw = r(Math.max(1.4, 1.6 * k), 2);
  if (key === 'source') {
    // three spines standing on a shelf line
    return g(null,
      h('rect', {x: s(-6.5), y: s(-5), width: s(3.4), height: s(10), fill: color}),
      h('rect', {x: s(-2.3), y: s(-7), width: s(3.4), height: s(12), fill: color}),
      h('rect', {x: s(1.9), y: s(-4.2), width: s(3.4), height: s(9.2), fill: color, transform: `rotate(12 ${s(3.6)} ${s(5)})`}),
      h('path', {d: `M${s(-8)} ${s(6)}H${s(8)}`, stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round'}),
    );
  }
  if (key === 'volume') {
    // one closed book with a spine band
    return g(null,
      h('path', {d: `M${s(-5)} ${s(-7)}H${s(6)}V${s(7)}H${s(-5)}Q${s(-7)} ${s(7)} ${s(-7)} ${s(5)}V${s(-5)}Q${s(-7)} ${s(-7)} ${s(-5)} ${s(-7)}Z`, fill: color}),
      h('path', {d: `M${s(-4)} ${s(-7)}V${s(7)}`, stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': sw}),
    );
  }
  if (key === 'page') {
    return g(null,
      h('path', {d: `M${s(-5.5)} ${s(-7.5)}H${s(2.5)}L${s(5.5)} ${s(-4.5)}V${s(7.5)}H${s(-5.5)}Z`, fill: color}),
      h('path', {d: `M${s(-3)} ${s(-2)}H${s(3)}M${s(-3)} ${s(1)}H${s(3)}M${s(-3)} ${s(4)}H${s(1)}`, stroke: '#000', 'stroke-opacity': 0.3, 'stroke-width': sw}),
    );
  }
  // pilcrow ¶
  return g(null,
    h('path', {d: `M${s(0.5)} ${s(-7.5)}C${s(-7.5)} ${s(-7.5)} ${s(-7.5)} ${s(2)} ${s(0.5)} ${s(2)}Z`, fill: color}),
    h('path', {d: `M${s(0.5)} ${s(-7.5)}V${s(8)}M${s(4.5)} ${s(-7.5)}V${s(8)}M${s(0.5)} ${s(-7.5)}H${s(6.5)}`, stroke: color, 'stroke-width': r(Math.max(1.6, 2.1 * k), 2), 'stroke-linecap': 'round', fill: 'none'}),
  );
}

/**
 * Colour-coded token for one reference part. Local origin = token centre.
 * With text hidden it collapses to the icon disc.
 * @returns {{node:any, w:number, h:number}}
 */
export function segToken(ctx, o) {
  const th = ctx.theme;
  const {c, soft} = segColor(ctx, o.key);
  const size = o.size ?? 26;
  const discR = size * 0.78;
  const showText = o.showText !== false && ctx.show('key') && o.text;
  if (!showText) {
    const node = g({name: o.name, opacity: o.opacity ?? 0},
      h('circle', {cx: 2, cy: 4, r: discR + 5, fill: th.shadow}),
      h('circle', {r: discR + 5, fill: soft, stroke: c, 'stroke-width': 3}),
      h('circle', {r: discR, fill: c}),
      segIcon(o.key, discR * 0.72, '#ffffff'));
    return {node, w: (discR + 5) * 2, h: (discR + 5) * 2};
  }
  const padL = discR * 2 + size * 0.55;
  const padR = size * 0.6;
  const f = ctx.fit(o.text, {maxWidth: Math.max(40, (o.maxWidth ?? 260) - padL - padR), size, minSize: size * (o.minRatio ?? 0.72), maxLines: o.maxLines ?? 2, weight: 700});
  const w = padL + f.width + padR;
  const hh = Math.max(discR * 2 + 10, f.height + size * 0.7);
  const x0 = -w / 2, y0 = -hh / 2;
  const node = g({name: o.name, opacity: o.opacity ?? 0},
    h('path', {d: roundRectPath(x0 + 3, y0 + 5, w, hh, hh / 2), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, Math.min(hh / 2, size)), fill: soft, stroke: c, 'stroke-width': 3}),
    g({transform: T(x0 + discR + 5, 0)}, h('circle', {r: discR, fill: c}), segIcon(o.key, discR * 0.72, '#ffffff')),
    textBlock(f, {x: x0 + padL + f.width / 2, y: -f.height / 2, anchor: 'middle', fill: th.ink}),
  );
  return {node, w, h: hh};
}

/* ------------------------------------------------------------------ */
/* Bookcase                                                            */
/* ------------------------------------------------------------------ */

/**
 * Three-row bookcase seen from the front. Local = stage coordinates.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, sources:string[], targetRow:number, targetFrac?:number, fs?:number, seedKey?:string, plates?:boolean}} o
 */
export function bookcase(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const seedKey = o.seedKey || 'cita-case';
  const fs = o.fs ?? 1;
  const side = Math.max(18, o.w * 0.035);
  const topB = 26;
  const board = Math.max(30, 28 * fs);
  const plinth = 36;
  const rows = 3;
  const inner = {x: o.x + side, w: o.w - side * 2};
  const rowH = (o.h - topB - plinth - board * rows) / rows;
  const rowsG = [];
  for (let i = 0; i < rows; i++) {
    const top = o.y + topB + i * (rowH + board);
    rowsG.push({top, bottom: top + rowH, boardY: top + rowH});
  }
  const wood = th.wood;
  const back = shade(wood, -0.52);
  const bookH = rowH * 0.84;
  const bookT = bookH * 0.22;
  const bookW = bookH * 0.75;
  const tRow = clamp(o.targetRow, 0, rows - 1);
  const targetX = inner.x + inner.w * (o.targetFrac ?? 0.8);
  const parts = [];
  // carcass
  parts.push(h('path', {d: roundRectPath(o.x + 8, o.y + 12, o.w, o.h, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 10), fill: wood, stroke: th.ink, 'stroke-width': th.stroke}));
  // spines per row
  let target = null;
  rowsG.forEach((row, ri) => {
    parts.push(h('rect', {x: inner.x, y: row.top, width: inner.w, height: rowH, fill: back}));
    parts.push(h('rect', {x: inner.x, y: row.top, width: inner.w, height: 10, fill: '#000', opacity: 0.18}));
    let x = inner.x + 6;
    let n = 0;
    const gap = ri === tRow ? {a: targetX - bookT - 3, b: targetX + 3} : null;
    while (x < inner.x + inner.w - 20) {
      const R = k => ctx.rng(`${seedKey}-${k}`, ri * 40 + n);
      let w = bookT * (0.7 + R('w') * 0.55);
      const hh = bookH * (0.8 + R('h') * 0.2);
      if (gap && x + w > gap.a && x < gap.b) {
        // leave the target slot empty: the travelling book lives there
        target = {x: gap.b - 3, y: row.bottom - bookH / 2, row: ri, top: row.bottom - bookH, bottom: row.bottom};
        x = gap.b + 2;
        n++;
        continue;
      }
      // only the last book of a row is trimmed to the space left (a narrow
      // case keeps its row full instead of stopping at the first thin spine)
      if (x + w > inner.x + inner.w - 6) {
        w = inner.x + inner.w - 6 - x;
        if (w < Math.max(7, bookT * 0.4)) break;
      }
      const col = SPINES[Math.floor(R('c') * SPINES.length)];
      const lean = n === 0 && ri === 1 ? 0 : 0;
      parts.push(g({transform: lean ? `rotate(${lean} ${r(x)} ${r(row.bottom)})` : null},
        h('rect', {x: r(x), y: r(row.bottom - hh), width: r(w), height: r(hh), rx: 2, fill: col, stroke: th.ink, 'stroke-width': 1.8}),
        h('rect', {x: r(x + 2), y: r(row.bottom - hh + hh * 0.1), width: r(w - 4), height: r(Math.max(4, hh * 0.035)), fill: GOLD, opacity: 0.85}),
        h('rect', {x: r(x + 2), y: r(row.bottom - hh * 0.2), width: r(w - 4), height: r(Math.max(4, hh * 0.035)), fill: GOLD, opacity: 0.85}),
        R('p') > 0.45 ? h('rect', {x: r(x + w * 0.2), y: r(row.bottom - hh * 0.62), width: r(w * 0.6), height: r(hh * 0.16), rx: 2, fill: '#f3ead3', opacity: 0.9}) : null,
      ));
      x += w + 1;
      n++;
    }
    // shelf board with a brass label plate
    parts.push(h('rect', {x: inner.x - 2, y: row.boardY, width: inner.w + 4, height: board, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('rect', {x: inner.x - 2, y: row.boardY + board - 6, width: inner.w + 4, height: 6, fill: shade(th.woodTop, -0.18)}));
  });
  if (!target) {
    const row = rowsG[tRow];
    target = {x: targetX, y: row.bottom - bookH / 2, row: tRow, top: row.bottom - bookH, bottom: row.bottom};
  }
  // plinth
  const pl = o.y + o.h - plinth;
  parts.push(h('rect', {x: inner.x, y: pl, width: inner.w, height: plinth - 8, fill: shade(wood, -0.15)}));
  // label plates (text optional)
  const plateW = Math.min(inner.w * 0.56, 300 * fs);
  const plateH = board - 8;
  const plates = rowsG.map((row, i) => {
    const px = inner.x + 16, py = row.boardY + 3;
    const label = o.sources[i] || '';
    const f = label && ctx.show('all') ? ctx.fit(label, {maxWidth: plateW - 18, size: Math.min(plateH * 0.78, 22 * fs), minSize: 12, maxLines: 1, weight: 700, family: 'serif'}) : null;
    const node = g({name: `${P}-plate${i}`},
      h('path', {d: roundRectPath(px, py, plateW, plateH, 5), fill: '#e8d9a8', stroke: shade('#e8d9a8', -0.5), 'stroke-width': 1.8}),
      h('circle', {cx: px + 6, cy: py + plateH / 2, r: 2.2, fill: shade('#e8d9a8', -0.5)}),
      h('circle', {cx: px + plateW - 6, cy: py + plateH / 2, r: 2.2, fill: shade('#e8d9a8', -0.5)}),
      h('path', {name: `${P}-plate${i}-tint`, d: roundRectPath(px, py, plateW, plateH, 5), fill: 'none', stroke: 'none', 'stroke-width': 4}),
      f ? textBlock(f, {x: px + plateW / 2, y: py + (plateH - f.size) / 2 + 1, anchor: 'middle', fill: '#3b2f14', name: `${P}-plate${i}-text`}) : null,
    );
    return {x: px, y: py, w: plateW, h: plateH, node, hasText: Boolean(f), label};
  });
  const node = g({name: P}, parts, plates.map(pn => pn.node));
  return {node, rows: rowsG, rowH, target, plates, bookH, bookT, bookW, inner, box: {x: o.x, y: o.y, w: o.w, h: o.h}};
}

/* ------------------------------------------------------------------ */
/* Book                                                                */
/* ------------------------------------------------------------------ */

/**
 * One book that turns, opens and carries a paragraph highlight.
 * Local origin: centre of the hinge line (the edge shared by the spine and
 * the front cover). Spine spans x ∈ [-t, 0]; cover / right page span
 * x ∈ [0, cw]; the left page spans x ∈ [-cw, 0]. y ∈ [-hB/2, hB/2].
 * @param {any} ctx
 * @param {{prefix:string, t:number, hB:number, cw:number, color?:string, volume?:string, source?:string, page?:string, prevPage?:string, pageAlt?:string, date?:string, showText?:boolean, rows?:number, seedKey?:string}} o
 */
export function bookRig(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {t, hB, cw} = o;
  const top = -hB / 2;
  const col = o.color || TARGET_BOOK;
  const showText = o.showText !== false && ctx.show('all');
  const seedKey = o.seedKey || 'cita-book';
  const rows = o.rows ?? 5;

  // --- spine face
  const plateH = Math.min(hB * 0.2, t * 1.1);
  const volFit = showText && o.volume ? ctx.fit(o.volume, {maxWidth: t * 0.86, size: t * 0.34, minSize: 7, maxLines: 2, weight: 700}) : null;
  const spine = g({name: `${P}-spine`},
    h('rect', {x: -t, y: top, width: t, height: hB, rx: 3, fill: col, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: -t + 2, y: top + hB * 0.07, width: t - 4, height: hB * 0.035, fill: GOLD}),
    h('rect', {x: -t + 2, y: top + hB * 0.86, width: t - 4, height: hB * 0.035, fill: GOLD}),
    h('rect', {x: -t + t * 0.14, y: top + hB * 0.3, width: t * 0.72, height: plateH, rx: 2, fill: '#f3ead3', stroke: shade(col, -0.3), 'stroke-width': 1.2}),
    volFit ? textBlock(volFit, {x: -t / 2, y: top + hB * 0.3 + (plateH - volFit.height) / 2, anchor: 'middle', fill: th.ink}) : h('rect', {x: -t * 0.66, y: top + hB * 0.3 + plateH * 0.42, width: t * 0.32, height: plateH * 0.16, fill: th.ink, opacity: 0.6}),
    h('rect', {x: -t, y: top, width: t * 0.22, height: hB, fill: '#fff', opacity: 0.12}),
  );

  // --- front cover
  const coverTitle = showText && o.source ? ctx.fit(o.source, {maxWidth: cw * 0.7, size: cw * 0.1, minSize: 6, maxLines: 3, weight: 700, family: 'serif'}) : null;
  const coverVol = showText && o.volume ? ctx.fit(o.volume, {maxWidth: cw * 0.6, size: cw * 0.09, minSize: 6, maxLines: 1, weight: 600}) : null;
  const tpY = top + hB * 0.2;
  const tpH = hB * 0.3;
  const cover = g({name: `${P}-cover`},
    h('path', {d: `M0 ${r(top)}H${r(cw - 5)}Q${r(cw)} ${r(top)} ${r(cw)} ${r(top + 5)}V${r(-top - 5)}Q${r(cw)} ${r(-top)} ${r(cw - 5)} ${r(-top)}H0Z`, fill: col, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: cw * 0.08, y: top + hB * 0.05, width: cw * 0.84, height: hB * 0.9, rx: 3, fill: 'none', stroke: GOLD, 'stroke-width': 1.6, opacity: 0.9}),
    h('rect', {x: cw * 0.14, y: tpY, width: cw * 0.72, height: tpH, rx: 2, fill: '#f3ead3', stroke: shade(col, -0.3), 'stroke-width': 1.2}),
    coverTitle ? textBlock(coverTitle, {x: cw / 2, y: tpY + (tpH - coverTitle.height) / 2, anchor: 'middle', fill: th.ink}) : h('rect', {x: cw * 0.24, y: tpY + tpH * 0.4, width: cw * 0.52, height: tpH * 0.18, fill: th.ink, opacity: 0.6}),
    coverVol ? textBlock(coverVol, {x: cw / 2, y: top + hB * 0.62, anchor: 'middle', fill: '#f3ead3'}) : null,
    h('rect', {x: 0, y: top, width: cw * 0.06, height: hB, fill: '#000', opacity: 0.18}),
  );

  // --- pages (right page lives under the cover)
  const margin = cw * 0.1;
  const textX0 = margin * 1.25, textX1 = cw - margin;
  const headY = top + hB * 0.06;
  const bodyTop = top + hB * 0.17, bodyBot = -top - hB * 0.07;
  const rowH = (bodyBot - bodyTop) / rows;
  const bar = Math.max(2.5, hB * 0.022);
  const paraBoxes = [];
  const pageBars = (x0, x1, key) => {
    const out = [];
    for (let i = 0; i < rows; i++) {
      const py = bodyTop + i * rowH;
      const lines = 3;
      const lh = (rowH * 0.78) / lines;
      paraBoxes.push({x: x0 - 4, y: py - bar * 0.6, w: x1 - x0 + 8, h: lh * (lines - 1) + bar * 2.2});
      for (let l = 0; l < lines; l++) {
        const last = l === lines - 1;
        const w = (x1 - x0) * (last ? 0.35 + ctx.rng(`${seedKey}-${key}`, i * 5 + l) * 0.35 : 0.9 + ctx.rng(`${seedKey}-${key}`, i * 5 + l) * 0.1);
        const indent = l === 0 ? (x1 - x0) * 0.06 : 0;
        out.push(h('rect', {x: r(x0 + indent), y: r(py + l * lh), width: r(w - indent), height: r(bar), rx: bar / 2, fill: th.paperLine}));
      }
      // paragraph tick in the outer margin
      out.push(h('rect', {x: r(key === 'R' ? cw - margin * 0.62 : -cw + margin * 0.38), y: r(py - bar * 0.2), width: r(margin * 0.24), height: r(bar * 1.4), rx: 1, fill: th.inkFaint || th.inkSoft, opacity: 0.8}));
    }
    return out;
  };
  const rightBars = pageBars(textX0, textX1, 'R');
  const rightParas = paraBoxes.slice(0, rows);
  paraBoxes.length = 0;
  const leftBars = pageBars(-cw + margin, -margin * 1.25, 'L');
  const hf = size => ({size, minSize: 5, maxLines: 1, weight: 600});
  const pgFit = showText && o.page ? ctx.fit(o.page, {maxWidth: cw * 0.34, ...hf(hB * 0.045)}) : null;
  const pgAltFit = showText && o.pageAlt ? ctx.fit(o.pageAlt, {maxWidth: cw * 0.34, ...hf(hB * 0.045)}) : null;
  const pnWidth = Math.max(pgFit ? pgFit.width : 0, pgAltFit ? pgAltFit.width : 0);
  const srcFit = showText && o.source ? ctx.fit(o.source, {maxWidth: Math.max(12, Math.min(cw * 0.5, (cw - margin * 0.9) - pnWidth - textX0 - 8)), size: hB * 0.036, minSize: 5, maxLines: 1, weight: 500, family: 'serif'}) : null;
  const prevFit = showText && o.prevPage ? ctx.fit(o.prevPage, {maxWidth: cw * 0.34, ...hf(hB * 0.045)}) : null;
  const dateFit = showText && o.date ? ctx.fit(o.date, {maxWidth: cw * 0.5, size: hB * 0.034, minSize: 5, maxLines: 1, weight: 500}) : null;
  const pageNumPt = {x: cw - margin * 0.9, y: headY + hB * 0.024};
  const hlBase = rightParas[0];
  const rightPage = g({name: `${P}-rpage`},
    h('rect', {x: 0, y: top, width: cw, height: hB, fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}),
    h('rect', {x: 0, y: top, width: cw * 0.07, height: hB, fill: '#000', opacity: 0.07}),
    h('rect', {name: `${P}-hl`, x: hlBase.x, y: hlBase.y, width: 0, height: hlBase.h, rx: 3, fill: th.highlight, opacity: 0.9}),
    rightBars,
    srcFit ? textBlock(srcFit, {x: textX0, y: headY, fill: th.inkSoft, italic: true}) : h('rect', {x: textX0, y: headY, width: cw * 0.34, height: bar, fill: th.paperLine}),
    pgFit ? textBlock(pgFit, {x: pageNumPt.x, y: headY, anchor: 'end', fill: th.ink, name: `${P}-pnum`}) : h('rect', {name: `${P}-pnum`, x: pageNumPt.x - cw * 0.1, y: headY, width: cw * 0.1, height: bar * 1.3, fill: th.ink, opacity: 0.7}),
    pgAltFit ? textBlock(pgAltFit, {x: pageNumPt.x, y: headY, anchor: 'end', fill: th.accent2, name: `${P}-pnum-alt`, opacity: 0}) : null,
    dateFit ? textBlock(dateFit, {x: textX0, y: -top - hB * 0.055, fill: th.inkSoft}) : null,
    h('line', {x1: textX0, x2: textX1, y1: headY + hB * 0.055, y2: headY + hB * 0.055, stroke: th.paperLine, 'stroke-width': 1.2}),
  );
  // page block (thickness) visible when the closed book lies on its back
  const blockN = 3;
  const pageBlock = g({name: `${P}-block`, opacity: 0},
    Array.from({length: blockN}, (_, i) => h('rect', {x: 2 + (blockN - i) * 1.6, y: top + (blockN - i) * 2.2, width: cw, height: hB, rx: 2, fill: i % 2 ? th.paper : th.paperShade, stroke: th.ink, 'stroke-width': 1})),
  );
  const leftPage = g({name: `${P}-lpage`, opacity: 0},
    g({name: `${P}-lpage-in`},
      h('rect', {x: -cw, y: top, width: cw, height: hB, fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}),
      h('rect', {x: -cw * 0.07, y: top, width: cw * 0.07, height: hB, fill: '#000', opacity: 0.07}),
      leftBars,
      prevFit ? textBlock(prevFit, {x: -cw + margin * 0.9, y: headY, fill: th.ink}) : h('rect', {x: -cw + margin * 0.9, y: headY, width: cw * 0.34, height: bar, fill: th.paperLine}),
      h('line', {x1: -cw + margin, x2: -margin * 1.25, y1: headY + hB * 0.055, y2: headY + hB * 0.055, stroke: th.paperLine, 'stroke-width': 1.2}),
    ),
  );
  const shadow = h('path', {name: `${P}-shadow`, d: roundRectPath(-t + 6, top + 10, t + cw, hB, 6), fill: th.shadow, opacity: 0});
  const node = g({name: P}, shadow, pageBlock, g({name: `${P}-pages`, opacity: 0}, rightPage), leftPage, spine, cover);

  /**
   * @param {{x:number, y:number, k:number, turn:number, open:number, hl?:number, hlRow?:number, hlFrom?:number, hlTo?:number, hlMove?:number, lifted?:number, pageSwap?:number}} s
   *   turn 0 = spine faces the viewer, 1 = front cover faces the viewer;
   *   open 0 = closed, 1 = cover flipped fully to the left.
   */
  function frame(s) {
    const nodes = {};
    const th0 = clamp(s.turn) * Math.PI / 2;
    const phi = clamp(s.open) * Math.PI;
    const cs = Math.cos(th0), sn = Math.sin(th0);
    const cf = Math.cos(phi);
    nodes[P] = {transform: T(s.x, s.y, 0, s.k)};
    nodes[`${P}-spine`] = {transform: `scale(${r(Math.max(0.001, cs), 4)} 1)`, opacity: cs > 0.02 ? 1 : 0};
    const coverSx = sn * Math.max(0, cf);
    nodes[`${P}-cover`] = {transform: `scale(${r(Math.max(0.001, coverSx), 4)} 1)`, opacity: coverSx > 0.01 ? 1 : 0};
    const onBack = s.turn >= 0.999;
    nodes[`${P}-pages`] = {opacity: onBack ? 1 : 0};
    nodes[`${P}-block`] = {opacity: onBack && s.open < 0.5 ? 1 : 0};
    const lsx = Math.max(0, -cf);
    nodes[`${P}-lpage`] = {opacity: lsx > 0.01 ? 1 : 0};
    nodes[`${P}-lpage-in`] = {transform: `scale(${r(Math.max(0.001, lsx), 4)} 1)`};
    // drop shadow matches the faces that are visible (spine and/or cover)
    const shL = -t * Math.max(0.001, cs), shR = cw * Math.max(0.001, coverSx);
    nodes[`${P}-shadow`] = {opacity: r(clamp(s.lifted ?? 0), 3), d: roundRectPath(r(shL + 8), r(top + 12), r(shR - shL), r(hB), 5)};
    // highlight: grows across row `hlRow`; or slides from row hlFrom to hlTo
    const rowBox = i => rightParas[clamp(Math.round(i), 1, rows) - 1];
    let hb = null;
    let wFrac = 0;
    if (s.hlFrom !== undefined) {
      const a = s.hlFrom > 0 ? rowBox(s.hlFrom) : null;
      const b = s.hlTo > 0 ? rowBox(s.hlTo) : null;
      const m = clamp(s.hlMove ?? 0);
      if (a && b) {
        const e = ease.inOutCubic(m);
        hb = {x: a.x, y: lerp(a.y, b.y, e), w: a.w, h: lerp(a.h, b.h, e)};
        wFrac = 1;
      } else if (a) {
        hb = a;
        wFrac = 1 - ease.inOutCubic(m);
      } else if (b) {
        hb = b;
        wFrac = ease.inOutCubic(m);
      }
    } else if ((s.hl ?? 0) > 0) {
      hb = rowBox(s.hlRow ?? 3);
      wFrac = ease.inOutSine(clamp(s.hl));
    }
    // no highlight: back to its build() geometry (every attribute is written each frame, so the
    // DOM never depends on which times were shown before)
    nodes[`${P}-hl`] = hb ? {x: r(hb.x), y: r(hb.y), width: r(hb.w * wFrac), height: r(hb.h)} : {x: hlBase.x, y: hlBase.y, width: 0, height: hlBase.h};
    if (pgAltFit && s.pageSwap !== undefined) {
      const out = clamp(s.pageSwap * 2), inn = clamp(s.pageSwap * 2 - 1);
      nodes[`${P}-pnum`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-6 * out)})`};
      nodes[`${P}-pnum-alt`] = {opacity: r(inn, 3), transform: `translate(0 ${r(6 * (1 - inn))})`};
    }
    return nodes;
  }

  /** local point → world for a pose {x,y,k} */
  const world = (pose, q) => ({x: pose.x + q.x * pose.k, y: pose.y + q.y * pose.k});

  return {node, frame, world, t, hB, cw, top, rightParas, pageNumPt, rows, P};
}

/* ------------------------------------------------------------------ */
/* Index card, reference strip, search panel                          */
/* ------------------------------------------------------------------ */

/** Extra leading (in em) before the last reference line when it is a separate text element. */
const TAIL_GAP = 0.3;

/**
 * Ruled index card. Local origin = card centre.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, title?:string, reference:string, note?:string, date?:string, fs?:number}} o
 */
export function indexCard(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const fs = o.fs ?? 1;
  const x0 = -w / 2, y0 = -hh / 2;
  const pad = w * 0.07;
  const parts = [
    h('path', {d: roundRectPath(x0 + 5, y0 + 8, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 6), fill: PAPER_CARD, stroke: th.ink, 'stroke-width': 2.2}),
  ];
  const headH = hh * 0.22;
  parts.push(h('line', {x1: x0 + 4, x2: x0 + w - 4, y1: y0 + headH, y2: y0 + headH, stroke: '#d9534f', 'stroke-width': 2, opacity: 0.75}));
  for (let y = y0 + headH + hh * 0.17; y < y0 + hh - 8; y += hh * 0.17) parts.push(h('line', {x1: x0 + 4, x2: x0 + w - 4, y1: r(y), y2: r(y), stroke: '#a9c4dd', 'stroke-width': 1.3}));
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const headSize = Math.min(headH * 0.55, 20 * fs);
  let titleW = 0;
  if (showAll && o.title) {
    const f = ctx.fit(o.title.toUpperCase(), {maxWidth: w * 0.5, size: headSize, minSize: 11, maxLines: 1, weight: 700});
    titleW = f.width;
    parts.push(textBlock(f, {x: x0 + pad, y: y0 + (headH - f.size) / 2 + 1, fill: th.inkSoft}));
  }
  // the date shares the header only when it fits beside the heading; otherwise it moves to the foot
  let dateAtFoot = false;
  if (showAll && o.date) {
    const room = w - pad * 2 - titleW - 16;
    const f = ctx.fit(o.date, {maxWidth: room, size: headSize * 0.9, minSize: 11, maxLines: 1, weight: 500});
    if (room >= 70 && !f.truncated) parts.push(textBlock(f, {x: x0 + w - pad, y: y0 + (headH - f.size) / 2 + 1, anchor: 'end', fill: th.inkSoft}));
    else dateAtFoot = true;
  }
  // the reference as written (handwriting-like serif), fitted to the space
  // above the foot line; the foot (date / further note) yields if needed
  const refY = y0 + headH + hh * 0.09;
  const foot = [dateAtFoot ? o.date : '', o.note || ''].filter(Boolean).join(' · ');
  const footSize = 18 * fs;
  const footY = y0 + hh - pad * 0.7 - footSize;
  const refBox = {x: x0 + pad, y: refY, w: w - pad * 2, h: hh * 0.42};
  let refFit = null;
  let footOn = showAll && Boolean(foot);
  // optional appended part (contrast): written text or an empty dashed slot
  // placed right after the reference; sized as if the text were there
  const app = o.append && o.append.text ? o.append : null;
  const combined = app ? `${o.reference} ${app.alt && app.alt.length > app.text.length ? app.alt : app.text}` : o.reference;
  let appendBox = null;
  let appendNode = null;
  if (showKey) {
    const fitIn = (text, avail) => {
      // more lines before smaller type: the written reference stays legible
      for (const [lines, minSize] of [[2, 22 * fs], [3, 20 * fs], [4, 19 * fs], [4, 16 * fs], [4, 12]]) {
        const f = ctx.fit(text, {maxWidth: refBox.w, size: 27 * fs, minSize, maxLines: lines, weight: 600, family: 'serif'});
        if (!f.truncated && f.height <= avail) return f;
      }
      return null;
    };
    const spare = app ? 27 * fs * 0.35 : 0; // room for the appended part on a line of its own
    let whole = (footOn && fitIn(combined, footY - 6 - refY - spare)) || null;
    if (!whole) {
      footOn = false;
      whole = fitIn(combined, y0 + hh - 8 - refY - spare) || ctx.fit(combined, {maxWidth: refBox.w, size: 27 * fs, minSize: 12, maxLines: 4, weight: 600, family: 'serif'});
    }
    // with an appended part: the part goes after the last line when it fits
    // there, else on a line of its own; the size drops until everything fits
    const place = sz => {
      const rf = ctx.fit(o.reference, {maxWidth: refBox.w, size: sz, minSize: sz, maxLines: 4, weight: 600, family: 'serif'});
      const aw = Math.max(ctx.measure(app.text, sz, 700, 'serif'), app.alt ? ctx.measure(app.alt, sz, 700, 'serif') : 0);
      const last = rf.lines[rf.lines.length - 1];
      // a wider gap before the appended part keeps a ring around it clear of the previous word
      let ax = refBox.x + ctx.measure(`${last} `, sz, 600, 'serif') + sz * 0.36;
      let ay = refY + (rf.lines.length - 1) * rf.lineHeight + (rf.lines.length > 1 ? sz * TAIL_GAP : 0);
      if (ax + aw > refBox.x + refBox.w) {
        ax = refBox.x;
        ay += rf.lineHeight + sz * 0.3;
      }
      return {rf, aw, ax, ay, bottom: ay + sz * 1.12 + 4};
    };
    let pl = null;
    if (app) {
      pl = place(whole.size);
      if (footOn && pl.bottom > footY - 6) footOn = false;
      while (pl.bottom > y0 + hh - 8 && pl.rf.size > 12.5) pl = place(Math.max(12, pl.rf.size * 0.95));
    }
    refFit = app ? pl.rf : whole;
    if (app && refFit.lines.length > 1) {
      // with an appended part the last line is its own text element, so the
      // part written after it never sits inside the block of the lines above
      const n = refFit.lines.length;
      const tailGap = TAIL_GAP; // separate text elements: a little more leading keeps their boxes apart
      const head = {...refFit, lines: refFit.lines.slice(0, n - 1), height: refFit.lineHeight * (n - 2) + refFit.size, truncated: false};
      const tail = {...refFit, lines: refFit.lines.slice(n - 1), height: refFit.size, truncated: false};
      parts.push(g({name: `${o.prefix}-ref`},
        textBlock(head, {x: refBox.x, y: refY, fill: '#1d3f8f'}),
        textBlock(tail, {x: refBox.x, y: refY + (n - 1) * refFit.lineHeight + refFit.size * tailGap, fill: '#1d3f8f'})));
    } else parts.push(textBlock(refFit, {x: refBox.x, y: refY, fill: '#1d3f8f', name: `${o.prefix}-ref`}));
    if (app) {
      const size = refFit.size;
      const {aw, ax, ay} = pl;
      appendBox = {x: ax - 5, y: ay - size * 0.12, w: aw + 10, h: size * 1.24};
      const col = app.color || segColor(ctx, app.key || 'paragraph').c;
      appendNode = app.mode === 'slot'
        ? h('path', {name: `${o.prefix}-add`, d: roundRectPath(appendBox.x, appendBox.y, appendBox.w, appendBox.h, 5), fill: '#fdf1ec', stroke: th.accent, 'stroke-width': 2.6, 'stroke-dasharray': '5 4', opacity: 0})
        : h('text', {name: `${o.prefix}-add`, x: ax, y: ay + size * 0.8, 'font-size': r(size, 2), 'font-weight': 700, 'font-family': "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif", fill: col, opacity: 0}, app.text);
      parts.push(appendNode);
      // optional alternate value at the same spot (inspect: before → after)
      if (app.alt !== undefined) {
        parts.push(app.alt
          ? h('text', {name: `${o.prefix}-add-alt`, x: ax, y: ay + size * 0.8, 'font-size': r(size, 2), 'font-weight': 700, 'font-family': "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif", fill: col, opacity: 0}, app.alt)
          : h('path', {name: `${o.prefix}-add-alt`, d: roundRectPath(appendBox.x, appendBox.y, appendBox.w, appendBox.h, 5), fill: '#fdf1ec', stroke: th.accent, 'stroke-width': 2.6, 'stroke-dasharray': '5 4', opacity: 0}));
      }
      parts.push(h('path', {name: `${o.prefix}-add-ring`, d: roundRectPath(appendBox.x - 4, appendBox.y - 4, appendBox.w + 8, appendBox.h + 8, 8), fill: 'none', stroke: th.accent, 'stroke-width': 3.5, opacity: 0}));
    }
  } else {
    parts.push(h('rect', {x: refBox.x, y: refY + 6, width: refBox.w * 0.92, height: 9, rx: 4.5, fill: '#1d3f8f', opacity: 0.8}));
    parts.push(h('rect', {x: refBox.x, y: refY + 30, width: refBox.w * 0.55, height: 9, rx: 4.5, fill: '#1d3f8f', opacity: 0.8}));
    if (app) {
      appendBox = {x: refBox.x + refBox.w * 0.6, y: refY + 24, w: refBox.w * 0.3, h: 22};
      appendNode = app.mode === 'slot'
        ? h('path', {name: `${o.prefix}-add`, d: roundRectPath(appendBox.x, appendBox.y, appendBox.w, appendBox.h, 5), fill: '#fdf1ec', stroke: th.accent, 'stroke-width': 2.6, 'stroke-dasharray': '5 4', opacity: 0})
        : h('rect', {name: `${o.prefix}-add`, x: appendBox.x + 4, y: appendBox.y + 6, width: appendBox.w - 8, height: 10, rx: 5, fill: segColor(ctx, app.key || 'paragraph').c, opacity: 0});
      parts.push(appendNode);
      if (app.alt !== undefined) {
        parts.push(app.alt
          ? h('rect', {name: `${o.prefix}-add-alt`, x: appendBox.x + 4, y: appendBox.y + 6, width: appendBox.w - 8, height: 10, rx: 5, fill: segColor(ctx, app.key || 'paragraph').c, opacity: 0})
          : h('path', {name: `${o.prefix}-add-alt`, d: roundRectPath(appendBox.x, appendBox.y, appendBox.w, appendBox.h, 5), fill: '#fdf1ec', stroke: th.accent, 'stroke-width': 2.6, 'stroke-dasharray': '5 4', opacity: 0}));
      }
      parts.push(h('path', {name: `${o.prefix}-add-ring`, d: roundRectPath(appendBox.x - 4, appendBox.y - 4, appendBox.w + 8, appendBox.h + 8, 8), fill: 'none', stroke: th.accent, 'stroke-width': 3.5, opacity: 0}));
    }
  }
  if (footOn) {
    const f = ctx.fit(foot, {maxWidth: w - pad * 2, size: footSize, minSize: 11, maxLines: 1, weight: 500, family: 'serif'});
    parts.push(textBlock(f, {x: x0 + pad, y: footY, fill: th.inkSoft, italic: true}));
  }
  return {node: g({name: o.prefix}, parts), w, h: hh, refBox, refFit, appendBox};
}

/**
 * Reference strip: the written reference lifted as one piece of paper.
 * Local origin = strip centre. `cuts` are x offsets (from the centre) of the
 * dashed cut lines that appear when the reference is decomposed.
 */
export function referenceStrip(ctx, o) {
  const th = ctx.theme;
  const size = o.size ?? 26;
  const showKey = ctx.show('key');
  const w = o.maxWidth;
  const hh = o.h ?? size * 1.9;
  const f = showKey ? ctx.fit(o.text, {maxWidth: w - size * 1.2, size, minSize: size * 0.6, maxLines: hh > size * 2.9 ? 2 : 1, weight: 600, family: 'serif'}) : null;
  const cuts = o.cuts || [-w / 4, 0, w / 4];
  const node = g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(-w / 2 + 4, -hh / 2 + 6, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 6), fill: PAPER_CARD, stroke: th.ink, 'stroke-width': 2}),
    f ? textBlock(f, {x: 0, y: -f.height / 2, anchor: 'middle', fill: '#1d3f8f'})
      : h('rect', {x: -w * 0.4, y: -5, width: w * 0.8, height: 10, rx: 5, fill: '#1d3f8f', opacity: 0.8}),
    g({name: `${o.name}-cuts`, opacity: 0},
      cuts.map(x => h('line', {x1: r(x), x2: r(x), y1: r(-hh / 2 - 8), y2: r(hh / 2 + 8), stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '7 6'}))),
  );
  return {node, w, h: hh};
}

/** Field geometry of a search panel (lets callers size tokens before building it). */
export function searchFieldGeometry(o) {
  const fs = o.fs ?? 1;
  const headH = Math.min(o.h * 0.3, 46 * fs);
  const pad = Math.min(24, o.w * 0.03);
  // the search button sits in the header bar, so the field (and the four
  // part compartments) can use the full width of the panel
  const btnR = headH * 0.36;
  const field = {x: o.x + pad, y: o.y + headH + (o.h - headH) * 0.12, w: o.w - pad * 2, h: (o.h - headH) * 0.76};
  return {headH, pad, btnR, field};
}

/**
 * Catalogue search box (wall panel with header, field and magnifier).
 * The field holds four compartments (widths ∝ `compWidths`); each keeps a
 * ghost icon of its part, and a missing part is drawn as an empty slot.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, label?:string, fs?:number, parts:Array<{key:string,present:boolean}>, compWidths?:number[]}} o
 */
export function searchPanel(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const fs = o.fs ?? 1;
  const {headH, pad, btnR, field} = searchFieldGeometry(o);
  const parts = [
    h('path', {d: roundRectPath(o.x + 6, o.y + 10, o.w, o.h, 16), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 16), fill: '#f4f6f8', stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: `M${o.x + 1} ${o.y + headH}V${o.y + 16}Q${o.x + 1} ${o.y + 1} ${o.x + 16} ${o.y + 1}H${o.x + o.w - 16}Q${o.x + o.w - 1} ${o.y + 1} ${o.x + o.w - 1} ${o.y + 16}V${o.y + headH}Z`, fill: '#dfe6ec'}),
    h('line', {x1: o.x, x2: o.x + o.w, y1: o.y + headH, y2: o.y + headH, stroke: th.ink, 'stroke-width': 1.5, opacity: 0.4}),
    h('path', {name: `${P}-field`, d: roundRectPath(field.x, field.y, field.w, field.h, Math.min(field.h / 2, 22)), fill: '#ffffff', stroke: th.ink, 'stroke-width': 2}),
  ];
  const mgR = headH * 0.22;
  parts.push(g({transform: T(o.x + pad + mgR, o.y + headH / 2 - 1)},
    h('circle', {r: mgR, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5}),
    h('line', {x1: mgR * 0.7, y1: mgR * 0.7, x2: mgR * 1.7, y2: mgR * 1.7, stroke: th.inkSoft, 'stroke-width': 3, 'stroke-linecap': 'round'})));
  // search button: a pill with a magnifier at the right end of the header bar
  const bw = btnR * 4.2;
  const bc = {x: o.x + o.w - pad * 0.7 - bw / 2, y: o.y + headH / 2};
  if (o.label && ctx.show('all')) {
    const f = ctx.fit(o.label, {maxWidth: Math.min(o.w * 0.72, bc.x - bw / 2 - 16 - (o.x + pad + mgR * 2 + 12)), size: Math.min(headH * 0.56, 24 * fs), minSize: 12, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: o.x + pad + mgR * 2 + 12, y: o.y + (headH - f.size) / 2, fill: th.inkSoft}));
  }
  const mr = btnR * 0.5;
  const btn = g({name: `${P}-btn`, transform: T(bc.x, bc.y)},
    h('path', {d: roundRectPath(-bw / 2, -btnR, bw, btnR * 2, btnR), fill: th.accent2, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: -mr * 0.25, cy: -mr * 0.25, r: mr * 0.62, fill: 'none', stroke: '#fff', 'stroke-width': 3}),
    h('line', {x1: mr * 0.25, y1: mr * 0.25, x2: mr * 0.85, y2: mr * 0.85, stroke: '#fff', 'stroke-width': 3.4, 'stroke-linecap': 'round'}));
  // compartments, widths proportional to what they hold
  const n = o.parts.length;
  const gap = 10;
  const avail = field.w - gap * (n + 1);
  let widths = o.compWidths ? o.compWidths.map(w => Math.max(w, avail * 0.13)) : o.parts.map(() => avail / n);
  const sum = widths.reduce((a, b) => a + b, 0);
  widths = widths.map(w => (w * avail) / sum);
  let x = field.x + gap;
  const comps = o.parts.map((part, i) => {
    const box = {x, y: field.y + 7, w: widths[i], h: field.h - 14};
    x += widths[i] + gap;
    const {c} = segColor(ctx, part.key);
    const node = g({name: `${P}-comp${i}`, opacity: 0},
      h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, Math.min(box.h / 2, 16)), fill: part.present ? '#f7f8f9' : '#fdf1ec', stroke: part.present ? c : th.accent, 'stroke-width': part.present ? 2 : 3, 'stroke-dasharray': part.present ? '7 6' : '4 6'}),
      // ghost icon of the part: shown while the compartment is empty (a
      // present part's token hides it while it sits in the compartment)
      g({transform: T(box.x + box.w / 2, box.y + box.h / 2)}, g({name: `${P}-comp${i}-icon`, opacity: part.present ? 0.35 : 0.6}, segIcon(part.key, Math.min(box.h * 0.3, 16), part.present ? c : th.accent))),
    );
    return {key: part.key, present: part.present, box, cx: box.x + box.w / 2, cy: box.y + box.h / 2, node};
  });
  const node = g({name: P}, parts, btn, comps.map(c => c.node));
  return {node, field, comps, button: bc, btnR, box: {x: o.x, y: o.y, w: o.w, h: o.h}};
}

/**
 * Build the four tokens and the search panel together: tokens are sized
 * first, compartments follow their widths, and tokens are rebuilt narrower
 * when the four do not fit the field.
 */
export function panelWithTokens(ctx, o) {
  const {field} = searchFieldGeometry(o);
  const gap = 10;
  const n = o.parts.length;
  const avail = field.w - gap * (n + 1) - 16 * n;
  const compH = field.h - 14;
  const showText = ctx.show('key');
  const sizing = o.sizeParts || o.parts;
  const S = o.tokenSize;
  const LEAD = 1.18; // fitText line advance
  const padOf = sz => sz * 0.78 * 2 + sz * 0.55 + sz * 0.6 + 4; // disc + gaps (see segToken)
  const bare = sz => (sz * 0.78 + 5) * 2;                      // text-less token (icon disc)
  const tokH = (L, sz) => Math.max(sz * 0.78 * 2 + 10, (LEAD * (L - 1) + 1.7) * sz);
  const texts = sizing.map(part => (showText && part.text ? part.text : ''));
  // narrowest text width that wraps part i onto <= L lines at size sz, never
  // breaking a word (binary search between the longest word and one line)
  const cache = new Map();
  const textW = (i, L, sz) => {
    const key = `${i}|${L}|${sz}`;
    if (cache.has(key)) return cache.get(key);
    const text = texts[i];
    const full = ctx.measure(text, sz, 700, 'sans');
    const longest = Math.max(...text.split(/\s+/).filter(Boolean).map(wd => ctx.measure(wd, sz, 700, 'sans')));
    let out = full;
    if (L > 1 && full > longest + 1) {
      let lo = longest, hi = full;
      if (wrap(text, lo + 0.5, sz, 700, 'sans').length <= L) hi = lo + 0.5;
      else {
        for (let k = 0; k < 18; k++) {
          const mid = (lo + hi) / 2;
          if (wrap(text, mid, sz, 700, 'sans').length <= L) hi = mid; else lo = mid;
        }
      }
      out = hi;
    }
    cache.set(key, out);
    return out;
  };
  const linesAt = (i, L, sz) => (texts[i] ? wrap(texts[i], textW(i, L, sz) + 0.5, sz, 700, 'sans').length : 1);
  const widthAt = (i, L, sz) => (texts[i] ? padOf(sz) + textW(i, L, sz) + 2 : bare(sz));
  const total = arr => arr.reduce((a, b) => a + b, 0);
  // Plan at size sz with at most maxL lines per token: start every token at
  // its narrowest <= maxL-line wrap, then give lines back (most lines first,
  // cheapest first) while the four still fit side by side.
  const plan = (sz, maxL) => {
    const lines = texts.map((_, i) => linesAt(i, maxL, sz));
    if (tokH(Math.max(...lines), sz) > compH) return null;
    const widths = lines.map((L, i) => widthAt(i, L, sz));
    if (total(widths) > avail) return null;
    for (;;) {
      let pick = -1, cost = Infinity;
      lines.forEach((L, i) => {
        if (L <= 1) return;
        const w1 = widthAt(i, L - 1, sz);
        const c = w1 - widths[i];
        if (total(widths) + c > avail) return;
        if (pick < 0 || L > lines[pick] || (L === lines[pick] && c < cost)) { pick = i; cost = c; }
      });
      if (pick < 0) break;
      lines[pick] -= 1;
      widths[pick] = widthAt(pick, lines[pick], sz);
      lines[pick] = linesAt(pick, lines[pick], sz);
    }
    return {sz, lines, widths};
  };
  // Preference: large type on at most two lines; then three lines; smaller
  // type only after that (key labels stay legible, words never break).
  const steps = Array.from({length: 10}, (_, k) => S * (1 - k * 0.04)).filter(sz => sz >= S * 0.62);
  let best = null;
  for (const [maxL, floor] of [[2, 0.8], [3, 0.8], [2, 0.7], [3, 0.66], [4, 0.62]]) {
    for (const sz of steps) {
      if (sz < S * floor - 1e-6) continue;
      best = plan(sz, maxL);
      if (best) break;
    }
    if (best) break;
  }
  if (!best) {
    const sz = S * 0.62;
    const lines = texts.map((_, i) => linesAt(i, 4, sz));
    best = {sz, lines, widths: lines.map((L, i) => widthAt(i, L, sz))};
  }
  const size = best.sz;
  const base = best.widths;
  // spare width goes to the tokens that would still like to be wider
  const want = texts.map((_, i) => widthAt(i, 1, size));
  const extra = Math.max(0, avail - total(base));
  const grow = want.map((w, i) => Math.max(0, w - base[i]));
  const growSum = total(grow) || 1;
  const alloc = base.map((b, i) => b + (extra * grow[i]) / growSum);
  // tokens are sized from `sizeParts` when given (a paired scene keeps the other scene's layout)
  const tokens = o.parts.map((part, i) => ({...part, size, lines: best.lines[i], alloc: alloc[i], ...segToken(ctx, {name: `${o.tokenPrefix}-${part.key}`, key: part.key, text: sizing[i].text || part.text, size, maxWidth: alloc[i], maxLines: Math.max(best.lines[i], 1) + 1, minRatio: 1})}));
  const panel = searchPanel(ctx, {...o, compWidths: tokens.map((tk, i) => (sizing[i].present ? tk.w : Math.min(90, tk.w)) + 16)});
  return {panel, tokens: tokens.map((tk, i) => ({...tk, i, comp: panel.comps[i]}))};
}

/* ------------------------------------------------------------------ */
/* First-person library stage                                          */
/* ------------------------------------------------------------------ */

/** Canonical stage sizes (design units) per axis. */
export const STAGE = {horizontal: {w: 1600, h: 900}, square: {w: 1300, h: 1100}, vertical: {w: 1000, h: 1400}};

/**
 * Geometry per axis (absolute stage units).
 * Arms: `shL` / `shR` are the torso anchors of the two shoulders, far below
 * (or beside) the window. The shoulder slides along the line from that anchor
 * to the hand so the arm is always nearly straight (`ARM_EXT` of its length)
 * and enters the window from its edge; elbows bend to the outer side (left
 * arm left, right arm right), so no V-folds or elbows on the border.
 * card.rest / card.show: [x, y, rotation°, scale]. `restHigh` is used when a
 * paragraph tag would land where the card rests; `ledge` draws a small wall
 * ledge under a card that does not rest on the reading board.
 */
const GEO = {
  horizontal: {
    fs: 1, case: [30, 30, 560, 840], search: [620, 30, 950, 212], board: [620, 262, 1570, 880], hinge: [962, 590], kB: 2.05,
    card: {w: 300, h: 196, rest: [1416, 762, -2, 1], restHigh: [1418, 374, -2, 1], show: [1270, 410, 1.5, 1.3]},
    shL: [700, 1700], shR: [1500, 1700], restL: [760, 1000], armW: 56, bendL: 1, bendR: -1,
    chip: [800, 'middle'], edgeY: 0.36,
  },
  square: {
    fs: 1.24, case: [30, 240, 450, 830], search: [30, 26, 1240, 202], board: [505, 240, 1270, 1070], hinge: [806, 612], kB: 2.0,
    // the card rests at the board's lower left, out of the left arm's path to the cover edge
    card: {w: 300, h: 196, rest: [668, 954, -2, 1], show: [1010, 372, 1.5, 1.25]},
    shL: [560, 1900], shR: [1400, 1800], restL: [600, 1200], armW: 58, bendL: 1, bendR: -1,
    chip: [1280, 'end', 380], edgeY: 0.36,
  },
  vertical: {
    fs: 1.08, tokFs: 1, case: [30, 222, 640, 612], search: [30, 30, 940, 172], board: [30, 858, 970, 1380], hinge: [482, 1094], kB: 3.0,
    card: {w: 250, h: 164, rest: [838, 566, -2, 1], show: [780, 338, 1.5, 1.3], ledge: true},
    shL: [260, 2200], shR: [1500, 1150], restL: [300, 1500], armW: 58, bendL: 1, bendR: -1,
    chip: [960, 'end', 340], edgeY: 0.36,
  },
};
/** Fraction of its full length an arm is extended to (slight natural elbow bend). */
const ARM_EXT = 0.94;

/**
 * Split beat of the reference strip (0..1): the strip (text and cut lines)
 * fades out completely before the compartments and the part tokens fade in,
 * so the old text and the new parts never share the field.
 */
export function splitFade(split, panelPrefix, comps, stripName) {
  const nodes = {};
  nodes[stripName] = {opacity: r(1 - clamp((split - 0.04) / 0.24), 3)};
  nodes[`${stripName}-cuts`] = {opacity: r(clamp(split * 4), 3)};
  // the (text-free) compartments grow out of the cut lines while the strip fades
  comps.forEach((c, i) => { nodes[`${panelPrefix}-comp${i}`] = {opacity: r(clamp((split - 0.08) / 0.3), 3)}; });
  return nodes;
}
/** Opacity of the part tokens during the split beat (only after the strip text is gone). */
splitFade.token = split => r(clamp((split - 0.3) / 0.3), 3);

/** SVG path of a polyline up to arc-length fraction t (drawn behind a moving token). */
function partialPath(poly, t) {
  const pts = poly.pts;
  const target = clamp(t) * poly.total;
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const len = dist(pts[i - 1], pts[i]);
    if (acc + len >= target) {
      const k = len ? (target - acc) / len : 0;
      out.push({x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k)});
      break;
    }
    acc += len;
    out.push(pts[i]);
  }
  if (out.length < 2) out.push(pts[0]);
  return out.map((q, i) => `${i ? 'L' : 'M'}${r(q.x, 1)} ${r(q.y, 1)}`).join('');
}

/** Distance from p along unit direction d until it leaves the rect [0,W]×[0,H]. */
function exitDistance(p, d, W, H) {
  const ts = [];
  if (d.x > 1e-6) ts.push((W - p.x) / d.x);
  if (d.x < -1e-6) ts.push(-p.x / d.x);
  if (d.y > 1e-6) ts.push((H - p.y) / d.y);
  if (d.y < -1e-6) ts.push(-p.y / d.y);
  return Math.max(0, Math.min(...ts));
}

/**
 * First-person library nook.
 * `edgeY` (fraction of the page height below the hinge) moves the hand's grip
 * on the cover's fore-edge; `paraDockInset` keeps the paragraph tag that far
 * from the stage's right border (defaults: the axis geometry, 12).
 * @param {any} ctx
 * @param {{prefix:string, axis:'horizontal'|'square'|'vertical', params:any, parts:Array<{key:string,text:string,present:boolean}>, chips?:boolean, tokenSize?:number, trails?:boolean, seedKey?:string, avoidRows?:number[], avoidTokW?:number, avoidTokH?:number, cardRest?:{x:number,y:number,rot:number,k?:number}, cardTilt?:boolean, edgeY?:number, paraDockInset?:number}} o
 */
export function libraryStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STAGE[axis];
  const p = o.params;
  const t = {...KIT_STRINGS.en, ...(KIT_STRINGS[p.locale] || {})};
  const fs = G.fs;
  const parts = o.parts;
  const citation = p.citations[0];
  const tRow = targetRow(p, citation);

  // window
  const clipId = `${P}-clip`;
  const winPath = roundRectPath(0, 0, W, H, 30);
  const wall = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: winPath}))),
    h('path', {d: winPath, fill: '#ece5d6'}),
    h('path', {d: `M0 ${r(H * 0.62)}H${W}V${H}H0Z`, fill: '#e3d9c6', 'clip-path': ctx.ref(clipId)}),
  );

  // bookcase
  const [cx, cy, cw0, ch0] = G.case;
  const bc = bookcase(ctx, {prefix: `${P}-case`, x: cx, y: cy, w: cw0, h: ch0, sources: p.sources, targetRow: tRow, targetFrac: 0.84, fs, seedKey: 'cita-case'});

  // reading board (slanted lectern top, slight perspective)
  const [bx0, by0, bx1, by1] = G.board;
  const inset = (bx1 - bx0) * 0.03;
  const boardNode = g({name: `${P}-board`},
    h('path', {d: `M${r(bx0 + inset + 8)} ${r(by0 + 12)}H${r(bx1 - inset + 8)}L${r(bx1 + 8)} ${r(by1 + 12)}H${r(bx0 + 8)}Z`, fill: th.shadow}),
    h('path', {d: `M${r(bx0 + inset)} ${by0}H${r(bx1 - inset)}L${bx1} ${by1}H${bx0}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(bx0 + inset + 14)} ${by0 + 14}H${r(bx1 - inset - 14)}L${bx1 - 18} ${by1 - 34}H${bx0 + 18}Z`, fill: shade(th.woodTop, -0.06), opacity: 0.7}),
    h('path', {d: `M${bx0} ${by1 - 22}H${bx1}V${by1}H${bx0}Z`, fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}),
  );

  // search panel + tokens
  const [sx, sy, sw, sh] = G.search;
  const tokSize = (o.tokenSize ?? 26) * (G.tokFs ?? fs);
  const {panel, tokens: toks} = panelWithTokens(ctx, {prefix: `${P}-search`, tokenPrefix: `${P}-tok`, x: sx, y: sy, w: sw, h: sh, label: p.objectLabels && p.objectLabels.search ? p.objectLabels.search : t.search, fs, parts, sizeParts: o.sizeParts, tokenSize: tokSize});

  // book
  const bookH = bc.bookH;
  const book = bookRig(ctx, {prefix: `${P}-book`, t: bc.bookT, hB: bookH, cw: bc.bookW, volume: parts[1].text, source: citation.source, page: parts[2].text, date: p.dates[1] || '', seedKey: 'cita-book', pageAlt: o.pageAlt});
  const kB = G.kB;
  const hinge = {x: G.hinge[0], y: G.hinge[1]};
  const onShelf = {x: bc.target.x, y: bc.target.y, k: 1};
  const onBoard = {x: hinge.x, y: hinge.y, k: kB};
  const pageW = bc.bookW * kB, pageH = bookH * kB;
  const spreadTop = hinge.y - pageH / 2;
  const spread = {x: hinge.x - pageW, y: spreadTop, w: pageW * 2, h: pageH};

  // card
  const card = indexCard(ctx, {prefix: `${P}-card`, w: G.card.w, h: G.card.h, title: p.objectLabels && p.objectLabels.card ? p.objectLabels.card : t.card, reference: o.cardRef ?? p.query, append: o.cardAppend, date: p.dates[0] || '', fs,
    note: p.citations[1] ? [p.citations[1].source, p.citations[1].volume, p.citations[1].page, p.citations[1].paragraph].filter(Boolean).join(' · ') : ''});
  const cardGrip = {x: G.card.w / 2 - 34, y: G.card.h / 2 - 26};
  const asPose = a => ({x: a[0], y: a[1], rot: o.cardTilt === false ? 0 : a[2], k: a[3] ?? 1});
  const cardShow = asPose(G.card.show);

  // strip: cut lines fall on the compartment boundaries
  const fieldC = {x: panel.field.x + panel.field.w / 2, y: panel.field.y + panel.field.h / 2};
  const stripW = panel.field.w - 16;
  const cuts = panel.comps.slice(1).map(c => c.box.x - 5 - fieldC.x);
  const strip = referenceStrip(ctx, {name: `${P}-strip`, text: o.stripText ?? p.query, maxWidth: stripW, h: panel.field.h - 18, size: 24 * fs, cuts});
  const tokens = toks.map(tk => ({...tk, stripAt: {x: tk.comp.cx, y: fieldC.y}}));

  // docks (static ones; the volume dock rides the book)
  const plate = bc.plates[tRow];
  const tk = key => tokens.find(x => x.key === key);
  const volTok = tk('volume'), pageTok = tk('page'), paraTok = tk('paragraph'), srcTok = tk('source');
  // the page tag lands above the right page's top edge, leaving a lane on its
  // right for the paragraph tag's flight (it never passes over the page tag)
  const pageDock = {
    x: Math.max(hinge.x + pageTok.w / 2 + 4, Math.min(hinge.x + pageW - pageTok.w / 2 + 6, W - 14 - pageTok.w / 2, W - 10 - paraTok.w * 1.12 - 34 - pageTok.w / 2)),
    y: spreadTop - pageTok.h / 2 - 8,
  };
  // keep the volume tag (riding the hinge) clear of the page tag once on the board
  const volAvoid = Math.max(-pageW + volTok.w / 2, Math.min(0, pageDock.x - pageTok.w / 2 - 12 - volTok.w / 2 - hinge.x));
  const pinRow = p.pinpointRow ?? 3;
  const pb = book.rightParas[pinRow - 1];
  const paraDockAt = (row, w) => {
    const b = book.rightParas[clamp(row, 1, book.rows) - 1];
    return {x: Math.min(hinge.x + pageW + w / 2 - 18, W - (o.paraDockInset ?? 12) - w / 2), y: hinge.y + (b.y + b.h / 2) * kB};
  };
  const paraDock = paraDockAt(pinRow, paraTok.w);
  // card rest: the default place unless a paragraph tag (at any row it will
  // occupy, see `avoidRows`) would touch it; then the alternative place
  const tagBoxes = (o.avoidRows || [pinRow]).map(row => {
    const w = Math.max(o.avoidTokW || 0, paraTok.w), hh = Math.max(o.avoidTokH || 0, paraTok.h);
    const c = paraDockAt(row, w);
    return {x: c.x - w / 2 - 12, y: c.y - hh / 2 - 14, w: w + 24, h: hh + 28};
  });
  const hitsTags = q => {
    const b = {x: q.x - G.card.w / 2, y: q.y - G.card.h / 2, w: G.card.w, h: G.card.h};
    return tagBoxes.some(a => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  };
  // `stowCard`: when the rest place would be taken by a paragraph tag, the
  // right hand takes the card away with it instead of using the alternative
  let cardRest;
  let stowed = false;
  if (o.cardRest) cardRest = {k: 1, ...o.cardRest};
  else {
    cardRest = asPose(G.card.rest);
    if (hitsTags(cardRest)) {
      if (o.stowCard) stowed = true;
      else if (G.card.restHigh) cardRest = asPose(G.card.restHigh);
    }
  }
  if (o.cardTilt === false) cardRest.rot = 0;
  const docks = {
    source: {x: plate.x + Math.max(plate.w, srcTok.w) / 2, y: plate.y + plate.h / 2},
    page: pageDock,
    paragraph: paraDock,
  };
  // the volume tag rides just above the top edge of the book (clear of the gripping hand)
  const volDock = pose => ({
    x: pose.x - (bc.bookT * pose.k * Math.cos(pose.turn * Math.PI / 2)) / 2 + volAvoid * clamp((pose.k - 1.12) / (kB - 1.12)),
    y: pose.y - (bookH * pose.k) / 2 - volTok.h / 2 - 8,
  });

  // flights: smooth routes through waypoints (arc-length sampled). The source
  // route descends beside the plates, not over them; the paragraph route runs
  // down a lane clear of the landed page tag; on tall stages the page and
  // paragraph routes run down a lane over the bookcase, clear of the card.
  const trailsOn = o.trails !== false;
  const volShelf = volDock({...onShelf, turn: 0});
  const plateRight = Math.max(...bc.plates.map(pl => pl.x + pl.w));
  const routeOf = (key, from) => {
    const to = key === 'volume' ? volShelf : docks[key];
    let pts;
    if (key === 'source') {
      const lane = Math.max(plateRight + srcTok.w / 2 + 24, to.x);
      pts = [from, {x: lerp(from.x, lane, 0.6), y: from.y + 70}, {x: lane, y: lerp(from.y + 70, to.y, 0.55)}, {x: lane, y: to.y}, to];
    } else if (axis === 'vertical' && key === 'page') {
      const lane = G.case[0] + G.case[2] - 40;
      pts = [from, {x: lane, y: from.y + 90}, {x: lane, y: to.y - 110}, to];
    } else if (axis === 'vertical' && key === 'paragraph') {
      // down the bookcase lane, across above the landed volume and page tags,
      // then down the lane right of the page tag to the paragraph
      const lane = G.case[0] + G.case[2] - 40;
      const xr = Math.min(W - paraTok.w / 2 - 10, pageDock.x + pageTok.w / 2 + paraTok.w * 0.56 + 24);
      const yc = spreadTop - 8 - Math.max(volTok.h, pageTok.h) - paraTok.h / 2 - 14;
      pts = [from, {x: lane, y: from.y + 90}, {x: lane, y: yc - 30}, {x: lerp(lane, xr, 0.5), y: yc}, {x: xr, y: yc + 40}, {x: xr, y: to.y - 50}, to];
    } else if (key === 'paragraph') {
      // (the flying tag grows by up to 10 %: the lane keeps that clear of the page tag)
      const lane = Math.min(W - paraTok.w / 2 - 10, Math.max(from.x, pageDock.x + pageTok.w / 2 + paraTok.w * 0.56 + 24));
      const y1 = Math.max(from.y + 70, pageDock.y + pageTok.h / 2 + paraTok.h / 2 + 10);
      pts = [from, {x: lane, y: from.y + 50}, {x: lane, y: Math.min(to.y - 30, Math.max(y1, from.y + 60))}, to];
    } else {
      pts = [from, {x: lerp(from.x, to.x, 0.5), y: Math.min(from.y, to.y) + Math.abs(to.y - from.y) * 0.35}, to];
    }
    return polyline(catmullRom(pts, 14));
  };
  const flights = Object.fromEntries(tokens.map(tkn => [tkn.key, routeOf(tkn.key, {x: tkn.comp.cx, y: tkn.comp.cy})]));
  const trailFull = Object.fromEntries(tokens.map(tkn => [tkn.key, flights[tkn.key].d(1)]));
  const trailNodes = trailsOn ? tokens.map(tkn => h('path', {name: `${P}-trail-${tkn.key}`, d: trailFull[tkn.key], fill: 'none', stroke: segColor(ctx, tkn.key).c, 'stroke-width': 3, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round', opacity: 0})) : [];

  // a small wall ledge carries the resting card when it does not lie on the board
  let ledgeNode = null;
  if (G.card.ledge && !o.cardRest) {
    const lx0 = cardRest.x - G.card.w / 2 - 14, lx1 = cardRest.x + G.card.w / 2 + 14;
    const ly = cardRest.y + G.card.h / 2 + 4;
    ledgeNode = g({name: `${P}-ledge`},
      h('path', {d: `M${r(lx0 + 30)} ${r(ly + 16)}l20 44h14l-6 -44Z M${r(lx1 - 30)} ${r(ly + 16)}l-20 44h-14l6 -44Z`, fill: shade(th.wood, -0.2), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('path', {d: roundRectPath(lx0 + 6, ly + 8, lx1 - lx0, 18, 4), fill: th.shadow}),
      h('path', {d: roundRectPath(lx0, ly, lx1 - lx0, 18, 4), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}));
  }

  // arms: one researcher, both arms the same look
  const lookA = actorLook(ctx, p.researcher || {appearance: {skin: 2, outfit: 5}}, 0);
  const shL = {x: G.shL[0], y: G.shL[1]}, shR = {x: G.shR[0], y: G.shR[1]};
  const restL = {x: G.restL[0], y: G.restL[1]};
  const gripOnSpine = pose => ({x: pose.x - (bc.bookT * pose.k * Math.cos(pose.turn * Math.PI / 2)) / 2, y: pose.y - bookH * 0.08 * pose.k});
  // the hand holds the cover by its lower fore-edge corner (the corner nearest the shoulder)
  const coverEdge = openP => {
    const phi = clamp(openP) * Math.PI;
    return {x: hinge.x + pageW * Math.cos(phi) * 0.96, y: hinge.y + pageH * (o.edgeY ?? G.edgeY) - Math.sin(phi) * pageH * 0.12};
  };
  const cardWorld = (pose, q) => {
    const a = rad(pose.rot);
    const k = pose.k ?? 1;
    return {x: pose.x + k * (q.x * Math.cos(a) - q.y * Math.sin(a)), y: pose.y + k * (q.x * Math.sin(a) + q.y * Math.cos(a))};
  };
  const pulled = {...onShelf, x: onShelf.x + 36, y: onShelf.y + 24, k: 1.12, turn: 0};
  const restGrip = cardWorld(cardRest, cardGrip);
  const unit = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return {x: dx / l, y: dy / l};
  };
  // the right arm slides in / out along its own axis (shoulder and hand move together)
  const outDir = unit(restGrip, shR);
  // when the hand takes the card along, it travels until the card is out of the window too
  const outD = exitDistance(restGrip, outDir, W, H) + G.armW * 2.4 + (stowed ? Math.hypot(G.card.w, G.card.h) * cardRest.k + 20 : 0);
  const targetsL = [restL, gripOnSpine({...onShelf, turn: 0}), gripOnSpine(pulled), gripOnSpine({...onBoard, turn: 1}), coverEdge(0), coverEdge(0.5), coverEdge(1)];
  const targetsR = [restGrip, cardWorld(cardShow, cardGrip)];
  const armW = G.armW;
  const HAND = 24 * 1.3 * (armW / 46);
  // Arm length: long enough that, extended to ARM_EXT towards its torso
  // anchor, the shoulder of every target pose lies outside the window (the
  // arm always enters from the frame edge).
  const lenFor = (anchor, targets) => Math.max(...targets.map(q => (exitDistance(q, unit(q, anchor), W, H) + armW * 1.6) / ARM_EXT));
  const lenL = lenFor(shL, targetsL), lenR = lenFor(shR, targetsR);
  const armSpec = len => ({upper: (len - HAND) * 0.52, lower: (len - HAND) * 0.48, width: armW, handScale: 1.3});
  const armL = topArm(ctx, {name: `${P}-armL`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'left', ...armSpec(lenL)});
  const armR = topArm(ctx, {name: `${P}-armR`, skin: lookA.skin, sleeve: lookA.outfit, handed: 'right', ...armSpec(lenR)});
  /** Shoulder for a hand position: on the line towards the torso anchor, ARM_EXT of the arm length away. */
  const shoulderFor = (anchor, hand, len) => {
    const d = unit(hand, anchor);
    return {x: hand.x + d.x * len * ARM_EXT, y: hand.y + d.y * len * ARM_EXT};
  };

  // researcher chip at the bottom edge, where the arms enter
  let chipNode = null;
  if (o.chips !== false && ctx.show('key')) {
    const size = 24 * fs;
    const text = (p.actorLabels && p.actorLabels.a) || t.researcher;
    // up to two lines (never truncated), standing on the window's bottom edge
    const opts = {x: G.chip[0], anchor: G.chip[1], maxWidth: G.chip[2] ?? W * 0.44, size, minSize: size * 0.85, maxLines: 2, name: `${P}-chip`};
    const probe = chip(ctx, text, {...opts, y: 0});
    chipNode = chip(ctx, text, {...opts, y: H - 14 - probe.box.h});
  }

  const node = g({name: P},
    wall,
    g({'clip-path': ctx.ref(clipId)},
      bc.node,
      ledgeNode,
      panel.node,
      boardNode,
      trailNodes,
      strip.node,
      book.node,
      g({name: `${P}-card-g`}, armR.palm, card.node, armR.thumb),
      armR.arm,
      armL.arm, armL.palm, armL.thumb,
      // part tags are annotations: drawn above the arms so a reaching arm never hides them
      tokens.map(x => x.node),
    ),
    h('path', {d: winPath, fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2}),
    chipNode && chipNode.node,
  );

  /**
   * Pose the stage from action values in [0,1].
   * `grab` (default 1): the right hand slides in and takes the resting card;
   * `release` (default 0): after the card is laid down the hand slides out.
   * @param {{grab?:number, release?:number, present:number, strip:number, split:number, cardDown:number, fly:{source:number,volume:number,page:number,paragraph:number}, reach:number, pull:number, carry:number, toEdge:number, open:number, retreat:number, withdraw?:number, hl:number, hlFrom?:number, hlTo?:number, hlMove?:number, pageSwap?:number, dispatch?:{source:boolean,volume:boolean,page:boolean,paragraph:boolean}}} s
   */
  function pose(s) {
    const nodes = {};
    // --- right hand and card
    const grab = s.grab ?? 1, release = s.release ?? 0;
    const carrying = stowed && grab >= 1 && release > 0; // the hand takes the card away
    const held = (grab >= 1 && release <= 0) || carrying;
    const up = ease.inOutCubic(s.present) * (1 - ease.inOutCubic(s.cardDown));
    const cPose = held && !carrying
      ? {x: lerp(cardRest.x, cardShow.x, up), y: lerp(cardRest.y, cardShow.y, up), rot: lerp(cardRest.rot, cardShow.rot, up), k: lerp(cardRest.k, cardShow.k, up)}
      : {...cardRest};
    let handTarget = cardWorld(cPose, cardGrip);
    let armOut = 0;
    if (grab < 1 || release > 0) {
      armOut = grab < 1 ? 1 - ease.inOutCubic(grab) : ease.inOutCubic(release);
      handTarget = {x: restGrip.x + outDir.x * outD * armOut, y: restGrip.y + outDir.y * outD * armOut};
    }
    const solvedR = armR.pose(shoulderFor(shR, handTarget, lenR), handTarget, G.bendR);
    Object.assign(nodes, solvedR.nodes);
    let cardC = {x: cPose.x, y: cPose.y};
    if (held) {
      // the card follows the SOLVED hand (identical when reached)
      const gw = cardWorld({...cPose, x: 0, y: 0}, cardGrip);
      cardC = {x: solvedR.hand.x - gw.x, y: solvedR.hand.y - gw.y};
    }
    const cardGone = stowed && release >= 1;
    nodes[`${P}-card`] = {transform: T(cardC.x, cardC.y, cPose.rot, cPose.k), opacity: cardGone ? 0 : 1};
    const cardNow = {...cPose, x: cardC.x, y: cardC.y};

    // --- strip: lifts off the card's reference line, slides into the field, splits
    const refW = cardWorld(cardNow, {x: 0, y: card.refBox.y + 20});
    const sp = ease.inOutCubic(s.strip);
    const stripAt = {x: lerp(refW.x, fieldC.x, sp), y: lerp(refW.y, fieldC.y, sp) - Math.sin(sp * Math.PI) * 40};
    const stripScale = lerp((card.refBox.w * cPose.k) / stripW, 1, sp);
    const splitE = ease.inOutCubic(s.split);
    // the strip is gone before the parts become opaque (no double exposure)
    Object.assign(nodes, splitFade(s.split, `${P}-search`, panel.comps, `${P}-strip`));
    nodes[`${P}-strip`] = {...nodes[`${P}-strip`], transform: T(stripAt.x, stripAt.y, 0, stripScale), opacity: s.strip > 0 ? nodes[`${P}-strip`].opacity : 0};
    const press = s.split > 0 && s.split < 0.4 ? Math.sin((s.split / 0.4) * Math.PI) : 0;
    nodes[`${P}-search-btn`] = {transform: T(panel.button.x, panel.button.y, 0, 1 - 0.12 * press)};

    // --- book pose
    let bPose;
    let holder = 'shelf';
    if (s.carry > 0) {
      const e = ease.inOutCubic(s.carry);
      const arc = Math.sin(e * Math.PI) * (axis === 'vertical' ? 50 : 80);
      bPose = {x: lerp(pulled.x, onBoard.x, e), y: lerp(pulled.y, onBoard.y, e) - arc, k: lerp(pulled.k, onBoard.k, e), turn: ease.inOutSine(clamp(s.carry * 1.15))};
      holder = s.carry >= 1 ? 'board' : 'hand';
    } else if (s.pull > 0) {
      const e = ease.inOutQuad(s.pull);
      bPose = {x: lerp(onShelf.x, pulled.x, e), y: lerp(onShelf.y, pulled.y, e), k: lerp(1, pulled.k, e), turn: 0};
      holder = 'hand';
    } else bPose = {...onShelf, turn: 0};

    // --- left hand
    let handL;
    const grip = gripOnSpine(bPose);
    if (s.retreat > 0) handL = mix(coverEdge(1), restL, ease.inOutCubic(s.retreat));
    else if (s.open > 0) handL = coverEdge(ease.inOutSine(s.open));
    else if (s.toEdge > 0) handL = mix(gripOnSpine({...onBoard, turn: 1}), coverEdge(0), ease.inOutCubic(s.toEdge));
    else if ((s.withdraw ?? 0) > 0) handL = mix(gripOnSpine({...onBoard, turn: 1}), restL, ease.inOutCubic(s.withdraw));
    else if (s.pull > 0 || s.carry > 0) handL = grip;
    else handL = mix(restL, grip, ease.inOutSine(s.reach));
    const solvedL = armL.pose(shoulderFor(shL, handL, lenL), handL, G.bendL);
    Object.assign(nodes, solvedL.nodes);
    const inHand = holder === 'hand';
    if (inHand) {
      // the book follows the SOLVED hand (identical when reached)
      bPose = {...bPose, x: bPose.x + solvedL.hand.x - grip.x, y: bPose.y + solvedL.hand.y - grip.y};
    }
    const openV = s.retreat > 0 ? 1 : s.open > 0 ? ease.inOutSine(s.open) : 0;
    Object.assign(nodes, book.frame({x: bPose.x, y: bPose.y, k: bPose.k, turn: bPose.turn, open: openV, hl: s.hl, hlRow: pinRow, hlFrom: s.hlFrom, hlTo: s.hlTo, hlMove: s.hlMove, lifted: inHand ? 1 : 0, pageSwap: s.pageSwap}));

    // --- tokens
    const dispatch = s.dispatch || {source: true, volume: true, page: true, paragraph: true};
    const tokPos = {};
    tokens.forEach(tkn => {
      const name = `${P}-tok-${tkn.key}`;
      const comp = {x: tkn.comp.cx, y: tkn.comp.cy};
      if (!tkn.present) {
        nodes[name] = {opacity: 0, transform: T(comp.x, comp.y)};
        tokPos[tkn.key] = {x: r(comp.x), y: r(comp.y)};
        if (trailsOn) nodes[`${P}-trail-${tkn.key}`] = {opacity: 0, d: trailFull[tkn.key]};
        return;
      }
      let pos;
      let sc = 1;
      const fly = dispatch[tkn.key] ? clamp(s.fly[tkn.key] || 0) : 0;
      const e = ease.inOutSine(fly);
      if (fly > 0) {
        if (tkn.key === 'volume' && fly >= 1) pos = volDock(bPose);
        else pos = flights[tkn.key].at(e);
        sc = 1 + Math.sin(e * Math.PI) * 0.1;
      } else {
        pos = mix(tkn.stripAt, comp, splitE);
        sc = lerp(0.55, 1, splitE);
      }
      nodes[name] = {transform: T(pos.x, pos.y, 0, sc), opacity: splitFade.token(s.split)};
      // the compartment's ghost icon shows only once its token has left
      nodes[`${P}-search-comp${tkn.i}-icon`] = {opacity: r(0.35 * clamp((fly - 0.08) * 6), 3)};
      tokPos[tkn.key] = {x: r(pos.x), y: r(pos.y)};
      // the dotted route is drawn behind the token, never ahead of it
      // (a hidden trail keeps its build() path, so the DOM never depends on seek order)
      if (trailsOn) nodes[`${P}-trail-${tkn.key}`] = fly > 0 ? {opacity: 0.75, d: partialPath(flights[tkn.key], e)} : {opacity: 0, d: trailFull[tkn.key]};
    });
    // the volume trail ends where the spine was; it fades once the book leaves
    if (trailsOn && s.pull > 0 && tokens[1].present) nodes[`${P}-trail-volume`] = {opacity: r(0.75 * (1 - clamp(s.pull * 2)), 3), d: flights.volume.d(1)};
    // shelf plate: its own label hides under the docked source token
    const srcFly = dispatch.source && tokens[0].present ? (s.fly.source || 0) : 0;
    const srcLanded = srcFly >= 0.85;
    // the plate's own label fades as the matching part settles over it
    if (bc.plates[tRow].hasText) nodes[`${P}-case-plate${tRow}-text`] = {opacity: r(1 - clamp((srcFly - 0.6) / 0.25), 3)};
    nodes[`${P}-case-plate${tRow}-tint`] = {stroke: srcLanded ? segColor(ctx, 'source').c : 'none'};

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const upperL = solvedL.nodes[`${P}-armL-upper`];
    const upperR = solvedR.nodes[`${P}-armR-upper`];
    return {
      nodes,
      semantic: {
        card: P2(cardC),
        cardScale: r(cPose.k, 3),
        cardHeld: held,
        cardStowed: cardGone,
        armROut: r(armOut, 3),
        handR: P2(solvedR.hand),
        cardGrip: P2(cardWorld(cardNow, cardGrip)),
        elbowR: {x: upperR.x2, y: upperR.y2},
        handL: P2(solvedL.hand),
        elbowL: {x: upperL.x2, y: upperL.y2},
        bookGrip: P2(gripOnSpine(bPose)),
        coverEdge: P2(coverEdge(openV)),
        book: P2(bPose),
        bookScale: r(bPose.k, 3),
        bookTurn: r(bPose.turn, 3),
        bookOpen: r(openV, 3),
        bookHolder: holder,
        strip: P2(stripAt),
        tokSource: tokPos.source,
        tokVolume: tokPos.volume,
        tokPage: tokPos.page,
        tokPara: tokPos.paragraph,
        highlight: r(clamp(s.hl ?? 0), 3),
        split: r(clamp(s.split), 3),
        landed: Object.fromEntries(tokens.map(tkn => [tkn.key, tkn.present && dispatch[tkn.key] && (s.fly[tkn.key] || 0) >= 1])),
        missing: tokens.filter(tkn => !tkn.present).map(tkn => tkn.key),
        reach: {L: solvedL.reached, R: solvedR.reached},
        allReached: solvedL.reached && solvedR.reached,
      },
    };
  }

  return {node, pose, W, H, axis, G, bc, book, panel, card, tokens, docks, hinge, kB, cardStows: stowed, boardNode, wallPath: winPath, volBoard: volDock({...onBoard, turn: 1}), pageW, pageH, spreadTop, spread, pinRow, tRow, volDock, onShelf, onBoard, fs, strings: t,
    chipBox: chipNode ? chipNode.box : null,
    /** card-local point → stage point with the card at rest (after it is lowered) */
    cardRestPoint: q => cardWorld(cardRest, q),
    cardRestBox: {x: cardRest.x - G.card.w / 2 - 10, y: cardRest.y - G.card.h / 2 - 12, w: G.card.w + 20, h: G.card.h + 24},
    boardBox: {x0: bx0, y0: by0, x1: bx1, y1: by1},
    /** paragraph box of a row in stage coordinates (book open on the board) */
    paraBox: row => {
      const b = book.rightParas[clamp(row, 1, book.rows) - 1];
      return {x: hinge.x + b.x * kB, y: hinge.y + b.y * kB, w: b.w * kB, h: b.h * kB};
    },
    /** paragraph tag centre for a row and tag width (stage coordinates) */
    paraDockAt,
  };
}

/* ------------------------------------------------------------------ */
/* Stand-alone document pieces (mechanism / inspect)                   */
/* ------------------------------------------------------------------ */

/**
 * A single document page with paragraph bars, header and page number.
 * Local origin = top-left of the sheet. The highlight rect is named
 * `${prefix}-hl` (x/y/width/height set per frame).
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, source?:string, page?:string, pageAlt?:string, date?:string, rows?:number, seedKey?:string, fs?:number}} o
 */
export function pageFace(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const rows = o.rows ?? 5;
  const showText = ctx.show('all');
  const margin = w * 0.1;
  const x0 = margin, x1 = w - margin * 1.2;
  const headY = hh * 0.05;
  const bodyTop = hh * 0.15, bodyBot = hh * 0.92;
  const rowH = (bodyBot - bodyTop) / rows;
  const bar = Math.max(4, hh * 0.018);
  const paras = [];
  const bars = [];
  for (let i = 0; i < rows; i++) {
    const py = bodyTop + i * rowH;
    const lines = 3;
    const lh = (rowH * 0.74) / lines;
    paras.push({x: x0 - 6, y: py - bar * 0.7, w: x1 - x0 + 12, h: lh * (lines - 1) + bar * 2.4, cy: py + lh});
    for (let l = 0; l < lines; l++) {
      const last = l === lines - 1;
      const k = ctx.rng(`${o.seedKey || 'cita-page'}-bar`, i * 5 + l);
      const bw = (x1 - x0) * (last ? 0.35 + k * 0.35 : 0.9 + k * 0.1);
      const ind = l === 0 ? (x1 - x0) * 0.06 : 0;
      bars.push(h('rect', {x: r(x0 + ind), y: r(py + l * lh), width: r(bw - ind), height: r(bar), rx: bar / 2, fill: th.paperLine}));
    }
    bars.push(h('rect', {x: r(w - margin * 0.75), y: r(py - bar * 0.2), width: r(margin * 0.3), height: r(bar * 1.4), rx: 1, fill: th.inkFaint || th.inkSoft, opacity: 0.8}));
  }
  const hf = size => ({size, minSize: Math.max(9, size * 0.7), maxLines: 1, weight: 600});
  const pgFit = showText && o.page ? ctx.fit(o.page, {maxWidth: w * 0.36, ...hf(Math.max(14, hh * 0.045))}) : null;
  const pgAltFit = showText && o.pageAlt ? ctx.fit(o.pageAlt, {maxWidth: w * 0.36, ...hf(Math.max(14, hh * 0.045))}) : null;
  const pageNumPt = {x: w - margin, y: headY + hh * 0.022};
  const pnW = Math.max(pgFit ? pgFit.width : 0, pgAltFit ? pgAltFit.width : 0);
  const srcFit = showText && o.source ? ctx.fit(o.source, {maxWidth: Math.max(30, Math.min(w * 0.52, pageNumPt.x - w * 0.1 - pnW - x0 - 12)), size: Math.max(13, hh * 0.036), minSize: 9, maxLines: 1, weight: 500, family: 'serif'}) : null;
  const dateFit = showText && o.date ? ctx.fit(o.date, {maxWidth: w * 0.6, size: Math.max(12, hh * 0.032), minSize: 9, maxLines: 1, weight: 500}) : null;
  const node = g({name: P},
    h('path', {d: roundRectPath(6, 9, w, hh, 5), fill: th.shadow}),
    h('path', {d: `M0 4Q0 0 4 0H${r(w - w * 0.1)}L${w} ${r(w * 0.1)}V${r(hh - 4)}Q${w} ${hh} ${r(w - 4)} ${hh}H4Q0 ${hh} 0 ${r(hh - 4)}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w - w * 0.1)} 0V${r(w * 0.085)}Q${r(w - w * 0.1)} ${r(w * 0.1)} ${r(w - w * 0.085)} ${r(w * 0.1)}H${w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
    h('rect', {name: `${P}-hl`, x: paras[0].x, y: paras[0].y, width: 0, height: paras[0].h, rx: 4, fill: th.highlight, opacity: 0.92}),
    bars,
    srcFit ? textBlock(srcFit, {x: x0, y: headY, fill: th.inkSoft, italic: true}) : h('rect', {x: x0, y: headY + 2, width: w * 0.36, height: bar, fill: th.paperLine}),
    pgFit ? textBlock(pgFit, {x: pageNumPt.x - w * 0.1, y: headY, anchor: 'end', fill: th.ink, name: `${P}-pnum`}) : h('rect', {name: `${P}-pnum`, x: pageNumPt.x - w * 0.22, y: headY + 2, width: w * 0.1, height: bar * 1.3, fill: th.ink, opacity: 0.7}),
    pgAltFit ? textBlock(pgAltFit, {x: pageNumPt.x - w * 0.1, y: headY, anchor: 'end', fill: th.accent2, name: `${P}-pnum-alt`, opacity: 0}) : null,
    dateFit ? textBlock(dateFit, {x: x0, y: hh * 0.94, fill: th.inkSoft}) : null,
    h('line', {x1: x0, x2: x1, y1: headY + hh * 0.05, y2: headY + hh * 0.05, stroke: th.paperLine, 'stroke-width': 1.4}),
  );
  const pnumBox = {x: pageNumPt.x - w * 0.1 - (pgFit ? pgFit.width : w * 0.1), y: headY, w: pgFit ? pgFit.width : w * 0.1, h: pgFit ? pgFit.height : bar * 1.3};
  /** highlight rect attributes for a row (1-based) and fill fraction */
  const hlAt = (row, frac) => {
    const b = paras[clamp(Math.round(row), 1, rows) - 1];
    return {x: r(b.x), y: r(b.y), width: r(b.w * clamp(frac)), height: r(b.h)};
  };
  return {node, w, h: hh, paras, rows, pnumBox, hlAt, P};
}

/**
 * Enlarged excerpt of one paragraph (the pinpointed passage): a torn-edge
 * paper strip with thick text bars, a margin marker and a sweeping
 * highlight named `${prefix}-hl`. Local origin = top-left.
 */
export function paragraphExcerpt(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, h: hh} = o;
  const lines = o.lines ?? 4;
  const pad = w * 0.08;
  const gutter = w * (o.gutter ?? 0.16);
  const bar = Math.max(8, hh * 0.07);
  const top = hh * 0.2, bot = hh * 0.82;
  const lh = (bot - top) / (lines - 1);
  // torn top and bottom edges
  const teeth = 14;
  const edge = (y, dir) => Array.from({length: teeth + 1}, (_, i) => `${r((w * i) / teeth)} ${r(y + dir * (i % 2 ? 6 : 0))}`).join('L');
  const d = `M${edge(0, 1)}L${w} ${hh}L${edge(hh, -1).split('L').reverse().join('L')}Z`;
  const bars = [];
  for (let l = 0; l < lines; l++) {
    const k = ctx.rng(`${o.seedKey || 'cita-excerpt'}`, l);
    const bw = (w - gutter - pad) * (l === lines - 1 ? 0.45 + k * 0.2 : 0.9 + k * 0.1);
    bars.push(h('rect', {x: r(gutter), y: r(top + l * lh - bar / 2), width: r(bw), height: r(bar), rx: bar / 2, fill: th.paperLine}));
  }
  const hl = {x: gutter - 10, y: top - bar * 1.3, w: w - gutter - pad + 20, h: (lines - 1) * lh + bar * 2.6};
  const node = g({name: P},
    h('path', {d, transform: 'translate(7 10)', fill: th.shadow}),
    h('path', {d, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {name: `${P}-hl`, x: hl.x, y: hl.y, width: 0, height: hl.h, rx: 6, fill: th.highlight, opacity: 0.92}),
    bars,
    h('line', {x1: gutter * 0.78, x2: gutter * 0.78, y1: top - bar, y2: bot + bar, stroke: th.paperLine, 'stroke-width': 2}),
  );
  return {node, w, h: hh, hl, gutter, markAt: {x: gutter * 0.4, y: (top + bot) / 2}, P};
}

/**
 * Fit text without ever breaking a word: the size first drops (not below
 * `minSize`) until the longest word fits `maxWidth`, then the usual fit runs.
 * @param {any} ctx
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:'sans'|'serif'|'mono'}} o
 */
export function fitWords(ctx, text, o) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const weight = o.weight ?? 600, family = o.family ?? 'sans';
  const minSize = o.minSize ?? o.size * 0.6;
  let size = o.size;
  const longest = sz => Math.max(0, ...words.map(wd => ctx.measure(wd, sz, weight, family)));
  while (size > minSize && longest(size) > o.maxWidth) size = Math.max(minSize, size * 0.94);
  return ctx.fit(text, {...o, size, minSize: Math.min(size, minSize)});
}

/**
 * Deep copy of a virtual subtree with every node name prefixed, so a second,
 * identical drawing (e.g. the content of an inspect lens) can be driven by the
 * same frame functions through `renameFrame`.
 */
export function cloneNamed(node, prefix) {
  if (!node || typeof node !== 'object') return node;
  const attrs = {...node.attrs};
  if (attrs.name) attrs.name = `${prefix}${attrs.name}`;
  return {tag: node.tag, attrs, children: node.children.map(c => cloneNamed(c, prefix))};
}

/** Prefix the node names of a frame record (see cloneNamed). */
export function renameFrame(nodes, prefix) {
  return Object.fromEntries(Object.entries(nodes).map(([k, v]) => [`${prefix}${k}`, v]));
}
