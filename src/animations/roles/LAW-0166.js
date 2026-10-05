/**
 * LAW-0166 — Consulta entre profesionales · mechanism
 *
 * Storyboard (an exploded diagram of the consultation, not a row of boxes):
 *  elements  a / b          the two professionals (bust badges + name chips)
 *            notesA / notesB each professional's notes card (their supplied notes, each
 *                            with the colour of the flag it becomes)
 *            document       the ONE shared page with its passages
 *  Wide frames: the page in the middle, each professional's column at its side (badge above,
 *  notes card below). Square and tall frames: badges in a top row, the two notes cards under
 *  them, the page below; each note's line runs in its own lane in the page's side gutter
 *  (lanes ordered so lines never cross). Every relation label sits within ~40 px of its own
 *  connector (never inside a card); captions are never larger than the notes.
 *  0.00–0.18  separate: the page, the notes cards and the badges slide apart from the
 *             centre to their places.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one, anchored to
 *             element edges and styled by kind (relation = plain line with end dots, no
 *             arrow; communication = dashed arrow; causal only when supplied). A notes card
 *             relates to the page by one line per note, from the note's own start point to
 *             the margin spot of that passage; the note's flag rides its line (630 ms) and
 *             lands on the margin (A left, B right).
 *  0.43–0.75  trace: an accent2 tracer follows `traversalOrder` along the connectors; the element it
 *             passes enlarges (focusElement strongest). When it crosses the page the
 *             comparison appears: the two flags on the shared passage are level and a band
 *             joins them (same point noted); the lone flag gets an open ring and an empty
 *             outline opposite (open question).
 *  0.75–1.00  gather: everything stays visible — origin (people, notes), transformation
 *             (connectors), state (marks) — with a legend of connection kinds and marks and
 *             the key "as supplied · no conclusion drawn". Settled by u ≈ 0.84.
 * No outcome, winner or advice; a relation is never drawn as causation unless supplied.
 * @module animations/roles/LAW-0166
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../core/time.js';
import {polyline, roundRectPath, edgeAnchor} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, textBlock, tracer, LINK_STYLES} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  consultFields, CONSULT_DEFAULTS, KIT_STRINGS, resolvePoints, roleOf, pxUnit, fitWords, wchip, overlaps,
  docLayout, pageSheet, pageFlag, emptySlot, glyphSame, glyphOpen,
} from './kits/consulta-entre-profesionales.js';

const ID = 'LAW-0166';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {separate: [0.02, 0.16], relate: [0.18, 0.4], ride: 0.09, trace: [0.46, 0.74], legend: [0.76, 0.83]};
const ELEMENTS = ['a', 'b', 'notesA', 'notesB', 'document'];

const STRINGS = {
  en: {...KIT_STRINGS.en},
  es: {...KIT_STRINGS.es},
};

const elementRelationship = obj('A relationship between two elements', {
  from: oneOf('Source element id', ELEMENTS),
  to: oneOf('Target element id', ELEMENTS),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Optional caption for this connection (empty = the caption of its kind)', 40),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  actors: consultFields.actors,
  roles: consultFields.roles,
  props: consultFields.props,
  elements: list('Element labels; ids are fixed by the scene, labels are editable', obj('Element', {
    id: oneOf('Element id', ELEMENTS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 5, 5),
  relationships: list('Explicit relationships between elements; kind sets the line style (a plain relation never gets an arrow; causal only when supplied). notesA/notesB → document is drawn as one line per note, to the passage it flags', elementRelationship, 1, 8),
  focusElement: oneOf('Element enlarged most while the tracer passes it', ELEMENTS),
  relationLabels: obj('Caption used for each relation kind (when a connection has no own label)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits the elements', oneOf('Element id', ELEMENTS), 2, 8),
};

const defaultParams = {
  actors: CONSULT_DEFAULTS.actors,
  roles: CONSULT_DEFAULTS.roles,
  props: CONSULT_DEFAULTS.props,
  elements: [
    {id: 'a', label: 'Professional A'},
    {id: 'b', label: 'Professional B'},
    {id: 'notesA', label: 'A’s notes'},
    {id: 'notesB', label: 'B’s notes'},
    {id: 'document', label: 'Shared draft'},
  ],
  relationships: [
    {from: 'a', to: 'b', kind: 'communication', label: 'consults'},
    {from: 'a', to: 'notesA', kind: 'relation', label: 'writes'},
    {from: 'b', to: 'notesB', kind: 'relation', label: 'writes'},
    {from: 'notesA', to: 'document', kind: 'relation', label: 'flags a passage'},
    {from: 'notesB', to: 'document', kind: 'relation', label: 'flags a passage'},
  ],
  focusElement: 'document',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['a', 'notesA', 'document', 'notesB', 'b'],
};

/** Notes card: title (element label) + rows of [flag swatch + supplied note]. */
function notesCard(ctx, {name, x, y, w, title, rows, size, minSize, show, footer, header, minPitch = 0}) {
  const th = ctx.theme;
  const pad = size * 0.65;
  const sw = size * 2.1;
  // card header at the notes' size (never a smaller caption)
  const tf = fitWords(title, {maxWidth: w - pad * 2, size, minSize: Math.min(size, minSize), maxLines: 2, weight: 700});
  const fits = rows.map(x2 => fitWords(x2.text, {maxWidth: w - pad * 2 - sw, size, minSize, maxLines: 6, weight: 600}));
  let yy = y + pad + tf.height + size * 0.5;
  // header: the caption of the relation arriving from the professional's badge (drawn with its line)
  let headNode = null, headFit = null;
  if (header && show) {
    headFit = fitWords(header.text, {maxWidth: w - pad * 2 - size * 2.4, size, minSize, maxLines: 3, weight: 600});
    headNode = g({name: header.name, opacity: 0},
      h('path', {d: `M${r(x + pad + 2)} ${r(yy + size * 0.55)}H${r(x + pad + size * 1.8)}`, stroke: header.color, 'stroke-width': 3, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(x + pad + 2), cy: r(yy + size * 0.55), r: 4, fill: header.color}), h('circle', {cx: r(x + pad + size * 1.8), cy: r(yy + size * 0.55), r: 4, fill: header.color}),
      textBlock(headFit, {x: x + pad + size * 2.4, y: yy, fill: th.ink}),
      h('path', {d: `M${r(x + pad)} ${r(yy + headFit.height + size * 0.3)}H${r(x + w - pad)}`, stroke: th.paperLine, 'stroke-width': 1.5, 'stroke-dasharray': '4 5'}));
    yy += headFit.height + size * 0.75;
  }
  const rowGeo = fits.map(f => {
    const hh = Math.max(f.height, size * 1.1);
    const out = {y: yy, h: hh, cy: yy + size * 0.55};
    // row pitch ≥ minPitch: each note's line leaves the card at a clearly separate point
    yy += Math.max(hh + size * 0.55, minPitch);
    return out;
  });
  // footer: the caption of the relation whose lines leave this card (drawn with the lines)
  let footNode = null, footFit = null;
  if (footer && show) {
    footFit = fitWords(footer.text, {maxWidth: w - pad * 2 - size * 2.4, size, minSize, maxLines: 3, weight: 600});
    const fy = yy - size * 0.1;
    footNode = g({name: footer.name, opacity: 0},
      h('path', {d: `M${r(x + pad)} ${r(fy - size * 0.25)}H${r(x + w - pad)}`, stroke: th.paperLine, 'stroke-width': 1.5, 'stroke-dasharray': '4 5'}),
      h('path', {d: `M${r(x + pad + 2)} ${r(fy + size * 0.6)}H${r(x + pad + size * 1.8)}`, stroke: footer.color, 'stroke-width': 3, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(x + pad + 2), cy: r(fy + size * 0.6), r: 4, fill: footer.color}), h('circle', {cx: r(x + pad + size * 1.8), cy: r(fy + size * 0.6), r: 4, fill: footer.color}),
      textBlock(footFit, {x: x + pad + size * 2.4, y: fy + size * 0.1, fill: footer.color === th.fg ? th.ink : th.ink}));
    yy += footFit.height + size * 0.55;
  }
  const hh = yy - size * 0.55 + pad - y;
  const parts = [
    h('path', {d: roundRectPath(x, y, w, hh, 14), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: `M${r(x + 10)} ${r(y + pad + tf.height + size * 0.2)}H${r(x + w - 10)}`, stroke: th.paperLine, 'stroke-width': 2}),
    show ? textBlock(tf, {x: x + pad, y: y + pad, fill: th.inkSoft}) : null,
  ];
  fits.forEach((f, i) => {
    const gy = rowGeo[i];
    const s2 = size / 22;
    parts.push(g({name: `${name}-r${i}`},
      h('path', {d: roundRectPath(x + pad, gy.cy - 9 * s2, 30 * s2, 18 * s2, 4 * s2), fill: rows[i].color, stroke: th.ink, 'stroke-width': 1.8}),
      rows[i].ring ? h('circle', {cx: r(x + pad + 13 * s2), cy: r(gy.cy), r: r(5.5 * s2), fill: 'none', stroke: '#fff', 'stroke-width': r(2.4 * s2)}) : null,
      show ? textBlock(f, {x: x + pad + sw, y: gy.y, fill: th.ink}) : g(null, f.lines.map((l, j) => h('rect', {x: r(x + pad + sw), y: r(gy.y + j * f.lineHeight + size * 0.25), width: r(Math.min(w - pad * 2 - sw, f.width)), height: r(size * 0.5), rx: r(size * 0.25), fill: th.paperLine})))));
  });
  parts.push(headNode, footNode);
  return {node: g({name}, parts), box: {x, y, w, h: hh}, rowGeo, ok: fits.every(f => !f.truncated) && !tf.truncated && !(footFit && footFit.truncated) && !(headFit && headFit.truncated), fits, tf};
}

/** One composition at text floor floorPx and stage factor z. */
function compose(ctx, floorPx, z, layoutKind, opt = {}) {
  const p = ctx.params;
  const t = ctx.t;
  const th = ctx.theme;
  const D = ctx.design;
  const U = pxUnit(ctx);
  const shape = ctx.view.shape;
  // the second (stress) pass lowers the base size too, so everything shrinks together
  const S = U(floorPx > 17 ? 21.5 : 17.4), Smin = U(floorPx);
  // generic captions (relation and element labels, names, legend) never exceed the notes' size
  const capSize = Math.min(S, opt.cap ?? S);
  // one note size for both cards (equal treatment); set by the layout's second pass
  const NS = opt.noteSz ?? S;
  // a relation label stays within ~40 px of its own connector
  const maxD = U(40);
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const problems = [];
  const pts = resolvePoints(p.props);
  const by = pts.by;
  const labelOf = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
  const looks = [0, 1].map(i => actorLook(ctx, p.actors[i], i));
  const color = id => looks[id === 'a' ? 0 : 1].outfit;
  const kinds = [...new Set(p.relationships.map(x => x.kind))];

  // --- legend strip (bottom): connection kinds used, marks, key
  const legendItems = [
    ...kinds.map(kd => ({kind: kd, text: `${p.relationLabels[kd]}`})),
    {mark: 'same', text: `${t.samePoint} · ${t.asSupplied}`},
    {mark: 'open', text: `${t.openQuestion} · ${t.asSupplied}`},
    {key: true, text: t.noConclusion},
  ];
  let lsz = capSize;
  let glyphW = lsz * 4.2;
  // legend rows for a given width (flowing items; a narrow width stacks them)
  const legendLayout = maxRowW => {
    const rows = [];
    let row = [], rowW = 0;
    // a narrow column stacks each glyph above its text (the text gets the full column width)
    const stack = maxRowW < 480;
    for (const it of legendItems) {
      const ind = it.key || stack ? 0 : glyphW + lsz * 0.5;
      const f = fitWords(it.text, {maxWidth: maxRowW - ind - (stack ? 8 : lsz * 1.4), size: lsz, minSize: Math.min(lsz, Smin), maxLines: 3, weight: it.key ? 500 : 600});
      const w = stack ? maxRowW : ind + f.width + lsz * 1.4;
      if (row.length && rowW + w > maxRowW) { rows.push(row); row = []; rowW = 0; }
      row.push({it, f, w});
      rowW += w;
      if (f.truncated) problems.push('legend');
    }
    if (row.length) rows.push(row);
    const glyphRow = it => (stack && !it.key ? lsz * 1.25 : 0);
    rows.forEach(rw => rw.forEach(x => { x.stack = stack; x.gh = glyphRow(x.it); }));
    return {rows, h: rows.reduce((a, rw) => a + Math.max(...rw.map(x => x.f.height + x.gh)) + lsz * 0.5, 0) + 16, w: maxRowW};
  };
  let legendRows = [];
  let lgH = 0;
  let legendAt = null;
  if (showKey && !opt.legendSide && !opt.legendRight) {
    // legendBeside: the band leaves the right column free for a tall notes card (hybrid only)
    const lg = legendLayout(opt.legendBeside ? D.w * 0.7 : D.w - 24);
    legendRows = lg.rows;
    lgH = lg.h;
    if (opt.legendBeside) legendAt = {x: 12, y: D.h - lg.h - 2, w: D.w * 0.7};
  }
  const areaB = D.h - lgH - 14;
  // 'columns' (wide frames): page in the middle, each professional's column at its side.
  // 'bands' (tall and square frames): badges in a top row (the consultation between them),
  // the two notes cards under them, the page below; notes → page lines run down its side gutters.
  const bands = layoutKind === 'bands';
  const hybrid = layoutKind === 'hybrid';
  const portrait = bands; // fans run down the page's side gutters
  const topRow = bands || hybrid; // the consultation runs straight between the badges

  const footerOf = id => { return null;
    const nid = id === 'a' ? 'notesA' : 'notesB';
    const ri = p.relationships.findIndex(x => (x.from === nid && x.to === 'document') || (x.from === 'document' && x.to === nid));
    if (ri < 0 || !showAll) return null;
    const rel = p.relationships[ri];
    return {name: `lab${ri}`, text: rel.label || p.relationLabels[rel.kind], color: kindColor(ctx, rel.kind)};
  };
  const headerOf = id => {
    return null;
    const nid = id === 'a' ? 'notesA' : 'notesB';
    const ri = p.relationships.findIndex(x => (x.from === id && x.to === nid) || (x.from === nid && x.to === id));
    if (ri < 0 || !showAll) return null;
    const rel = p.relationships[ri];
    return {name: `lab${ri}`, text: rel.label || p.relationLabels[rel.kind], color: kindColor(ctx, rel.kind)};
  };
  const noteRows = id => {
    const rows = [{text: id === 'a' ? p.props.same.noteA : p.props.same.noteB, color: color(id), flag: id === 'a' ? 'sameA' : 'sameB', row: pts.same}];
    if (by === id) rows.push({text: p.props.open.note, color: color(id), ring: true, flag: 'open', row: pts.open});
    return rows;
  };
  const capOf = id => {
    const i = id === 'a' ? 0 : 1;
    const role = roleOf(p, id);
    return `${labelOf(id)} · ${p.actors[i].name}${role ? ` · ${role}` : ''}`;
  };
  const s = (bands ? (shape === 'square' ? 0.95 : 1.05) : hybrid ? 0.95 : 1.15) * z;
  // label chips measured up front: gaps and gutters are sized so each relation label fits beside
  // its own connector (notes → page labels in the gutter/gap, "writes" labels between badge and card)
  const relText = rel => rel.label || p.relationLabels[rel.kind];
  const labProbe = pred => {
    const rs = p.relationships.filter(pred);
    if (!rs.length || !showAll) return {w: 0, h: 0};
    const cs = rs.map(rel => wchip(ctx, relText(rel), {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(360, D.w * 0.3), size: Math.min(S, capSize), minSize: Math.min(S, capSize, Smin), maxLines: 2}));
    return {w: Math.max(...cs.map(c => c.box.w)), h: Math.max(...cs.map(c => c.box.h))};
  };
  const isNotes = id => id === 'notesA' || id === 'notesB';
  const fanLab = labProbe(x => (isNotes(x.from) && x.to === 'document') || (x.from === 'document' && isNotes(x.to)));
  const writeLab = labProbe(x => ((x.from === 'a' || x.from === 'b') && isNotes(x.to)) || (isNotes(x.from) && (x.to === 'a' || x.to === 'b')));
  const cardLink = labProbe(x => isNotes(x.from) && isNotes(x.to));
  const cardLinkGap = bands && cardLink.h ? cardLink.h + 10 : bands && p.relationships.some(x => isNotes(x.from) && isNotes(x.to)) ? 40 : 0;
  const gutter = bands ? Math.max(150 * s, 0) : Math.max(96 * s, fanLab.w + 40);
  const G = {};
  let page, docX0, docW, chipMax, cardW;
  const docOf = (w, rowsH, minDocH, spread = true) => {
    const o2 = {w, s, size: S, minSize: Smin, reference: p.props.document.reference, title: p.props.document.title, passages: p.props.document.passages, wholeWords: true, rowsH: Math.max(60, rowsH), minDocH, spread, compact: true};
    // a one-line title when it fits (saves a line of height)
    const one = docLayout(ctx, {...o2, titleLines: 1});
    return one.fits ? one : docLayout(ctx, o2);
  };
  const chips = {};
  // label band above the badge row for the consultation arc — not needed when the badges sit far
  // apart (names under the badges): then the arrow runs straight between them, label on it
  const wideBadges = bands && (shape !== 'square' || opt.sideChips === false);
  const R = (bands ? (shape === 'square' ? 50 : 62) : hybrid ? 48 : 84) * z;
  // the consultation label fits on a straight arrow between the (close) square badges → no label band
  const consultLab = labProbe(x => (x.from === 'a' && x.to === 'b') || (x.from === 'b' && x.to === 'a'));
  const bxOffSq = Math.max(R + S * 5, D.w * 0.16);
  const straightFits = consultLab.w + 70 <= 2 * bxOffSq - 2 * R;
  const labelBand = !wideBadges && !straightFits && showAll && consultLab.h ? Math.min(S, capSize) * 1.95 : 0;
  if (hybrid) {
    // square, heavy text: badges in a top row (chips outside), notes cards in columns beside the page
    const bxOff = R + S * 3.4;
    const sideChipW = D.w / 2 - bxOff - R - 28;
    for (const id of ['a', 'b']) {
      chips[id] = wchip(ctx, capOf(id), {x: 0, y: 0, maxWidth: sideChipW, size: capSize, minSize: Math.min(capSize, Smin), maxLines: 5, fill: th.card, weight: 600});
      if (chips[id].fit.truncated) problems.push('chip');
    }
    const rowH = Math.max(R * 2, chips.a.box.h, chips.b.box.h);
    const badgeY = 12 + labelBand + rowH / 2;
    docW = D.w * (opt.pageFrac ?? 0.44);
    docX0 = (D.w - docW) / 2;
    const colW = docX0 - gutter * 0.7 - 12;
    cardW = colW;
    chipMax = sideChipW;
    const docTop = 12 + labelBand + rowH + (showAll ? S * (opt.gap ?? 2.8) : 50 * z);
    const docH = areaB - docTop - 6;
    const probe = docOf(docW, 5000, 0);
    const doc0 = docOf(docW, docH - probe.headerH - S * 1.4, docH - S * 1.2);
    if (!doc0.fits) problems.push('doc');
    page = pageSheet(ctx, {prefix: 'doc', D: doc0, x0: docX0, top: docTop, w: docW, s, bandRow: pts.same, minBottom: docTop + docH});
    if (page.bottom > areaB + 2) problems.push('doc-bottom');
    if (legendAt && opt.legendRight) {
      legendAt.y = Math.max(docTop, areaB - legendAt.h);
      if (legendAt.y + legendAt.h > D.h - 4) problems.push('legend-right');
    }
    for (const id of ['a', 'b']) {
      const x = id === 'a' ? 12 : D.w - 12 - colW;
      const card = notesCard(ctx, {name: `card-${id}`, x, y: docTop, w: colW, title: labelOf(id === 'a' ? 'notesA' : 'notesB'), rows: noteRows(id), size: NS, minSize: Math.min(Smin, NS), show: showKey, minPitch: maxD + 2, footer: footerOf(id), header: headerOf(id)});
      if (!card.ok) problems.push('card');
      const limit = opt.legendBeside && id === 'b' ? D.h - 8 : areaB;
      if (card.box.y + card.box.h > limit) problems.push('column');
      G[id] = {cx: D.w / 2 + (id === 'a' ? -1 : 1) * bxOff, badgeY, chipY: badgeY - chips[id].box.h / 2, card, chipSide: id === 'a' ? -1 : 1};
    }
    if (showKey && opt.legendSide) {
      // the legend stacks under the shorter notes card
      const lowId = G.a.card.box.h <= G.b.card.box.h ? 'a' : 'b';
      const cb = G[lowId].card.box;
      const lg = legendLayout(colW);
      legendRows = lg.rows;
      legendAt = {x: cb.x, y: cb.y + cb.h + 24, w: colW};
      if (legendAt.y + lg.h > D.h - 8) problems.push('legend-side');
    }
  } else if (!bands) {
    docW = Math.min(660, D.w * 0.34) * Math.sqrt(z);
    docX0 = (D.w - docW) / 2;
    const colW = docX0 - gutter - 24;
    chipMax = colW;
    cardW = colW;
    const docTop = 56 * z + S * 1.3;
    const sideOf = id => (id === 'a' || id === 'notesA' ? 'L' : id === 'b' || id === 'notesB' ? 'R' : 'C');
    const crossLink = p.relationships.some(x => sideOf(x.from) !== 'C' && sideOf(x.to) !== 'C' && sideOf(x.from) !== sideOf(x.to) && !((x.from === 'a' && x.to === 'b') || (x.from === 'b' && x.to === 'a')));
    const docH = areaB - docTop - 6 - (crossLink ? 150 * z : 0);
    const probe = docOf(docW, 5000, 0);
    const doc0 = docOf(docW, docH - probe.headerH - S * 1.4, docH - S * 1.2);
    if (!doc0.fits) problems.push('doc');
    page = pageSheet(ctx, {prefix: 'doc', D: doc0, x0: docX0, top: docTop, w: docW, s, bandRow: pts.same, minBottom: docTop + docH});
    for (const id of ['a', 'b']) {
      chips[id] = wchip(ctx, capOf(id), {x: 0, y: 0, maxWidth: chipMax, size: capSize, minSize: Math.min(capSize, Smin), maxLines: 4, fill: th.card, weight: 600});
      if (chips[id].fit.truncated) problems.push('chip');
      const x = id === 'a' ? 12 : D.w - 12 - colW;
      const badgeY = docTop + R - S * 0.4;
      const chipY = badgeY + R + 10;
      const card0 = notesCard(ctx, {name: 'probe', x: 0, y: 0, w: cardW, title: labelOf(id === 'a' ? 'notesA' : 'notesB'), rows: noteRows(id), size: NS, minSize: Math.min(Smin, NS), show: showKey, minPitch: maxD + 2, footer: footerOf(id), header: headerOf(id)});
      const minY = chipY + chips[id].box.h + 70 * z;
      const rowsMid = noteRows(id).reduce((a2, nr) => a2 + page.rowY(nr.row), 0) / noteRows(id).length;
      const cardY = Math.max(minY, Math.min(areaB - card0.box.h - 4, rowsMid - card0.box.h / 2));
      const card = notesCard(ctx, {name: `card-${id}`, x, y: cardY, w: cardW, title: labelOf(id === 'a' ? 'notesA' : 'notesB'), rows: noteRows(id), size: NS, minSize: Math.min(Smin, NS), show: showKey, minPitch: maxD + 2, footer: footerOf(id), header: headerOf(id)});
      if (!card.ok) problems.push('card');
      if (card.box.y + card.box.h > areaB) problems.push('column');
      G[id] = {cx: x + colW / 2, badgeY, chipY, card};
    }
  } else {
    const half = (D.w - 36) / 2;
    chipMax = half;
    cardW = half;
    for (const id of ['a', 'b']) {
      chips[id] = wchip(ctx, capOf(id), {x: 0, y: 0, maxWidth: chipMax, size: capSize, minSize: Math.min(capSize, Smin), maxLines: 4, fill: th.card, weight: 600});
      if (chips[id].fit.truncated) problems.push('chip');
    }
    // square frames: badges near the centre (the consultation between them), chips on the outer sides
    const sideChips = shape === 'square' && opt.sideChips !== false;
    const bxOff = sideChips ? Math.max(R + S * 5, D.w * 0.16) : 0;
    const sideChipW = sideChips ? D.w / 2 - bxOff - R - 28 : chipMax;
    if (sideChips) {
      for (const id of ['a', 'b']) {
        chips[id] = wchip(ctx, capOf(id), {x: 0, y: 0, maxWidth: sideChipW, size: capSize, minSize: Math.min(capSize, Smin), maxLines: 4, fill: th.card, weight: 600});
        if (chips[id].fit.truncated) problems.push('chip');
      }
    }
    const rowH = sideChips ? Math.max(R * 2, chips.a.box.h, chips.b.box.h) : 0;
    const badgeY = sideChips ? 12 + labelBand + rowH / 2 : 12 + labelBand + R;
    const chipY = sideChips ? badgeY - Math.max(chips.a.box.h, chips.b.box.h) / 2 : badgeY + R + 10;
    const chipsB = sideChips ? 12 + labelBand + rowH : chipY + Math.max(chips.a.box.h, chips.b.box.h);
    const cardY = chipsB + (showAll ? Math.max(S * 1.6, writeLab.h + 16) + cardLinkGap : 50 * z);
    const cards = {};
    for (const id of ['a', 'b']) {
      const x = id === 'a' ? 12 : D.w - 12 - cardW;
      cards[id] = notesCard(ctx, {name: `card-${id}`, x, y: cardY, w: cardW, title: labelOf(id === 'a' ? 'notesA' : 'notesB'), rows: noteRows(id), size: NS, minSize: Math.min(Smin, NS), show: showKey, minPitch: maxD + 2, footer: footerOf(id), header: headerOf(id)});
      if (!cards[id].ok) problems.push('card');
      const cx = sideChips ? D.w / 2 + (id === 'a' ? -1 : 1) * bxOff : id === 'a' ? D.w * 0.25 : D.w * 0.75;
      G[id] = {cx, badgeY, chipY, card: cards[id], chipSide: sideChips ? (id === 'a' ? -1 : 1) : 0};
    }
    const cardsB = Math.max(cards.a.box.y + cards.a.box.h, cards.b.box.y + cards.b.box.h);
    if (opt.legendRight && showKey) {
      // the legend takes a column right of the page's right gutter (frees a band of height)
      const lgW = Math.max(D.w * (opt.lgFrac ?? 0.24), S * 9);
      docW = Math.min(D.w - 2 * (gutter + 12) - lgW - 16, 640);
      docX0 = 12 + gutter;
      const lg = legendLayout(lgW);
      legendRows = lg.rows;
      legendAt = {x: D.w - 12 - lgW, y: 0, w: lgW, h: lg.h};
    } else {
      docW = Math.min(D.w - 2 * (gutter + 12), shape === 'square' ? 700 : 600);
      docX0 = (D.w - docW) / 2;
    }
    const docTop = cardsB + (showAll ? Math.max(S * 1.5, fanLab.h + 14) + (opt.gap ?? 0) : 64 * z);
    const docH = areaB - docTop - 6;
    const probe = docOf(docW, 5000, 0, false);
    const doc0 = docOf(docW, docH - probe.headerH - S * 1.4, docH - S * 1.2);
    if (!doc0.fits || docH < probe.headerH + 120) problems.push(`doc${Math.round(docTop + probe.headerH + probe.rowsUsed + S * 1.2 - areaB)}[lb${Math.round(labelBand)} row${Math.round(chipsB - labelBand - 12)} cardY${Math.round(cardY)} cardsB${Math.round(cardsB)} docTop${Math.round(docTop)} hdr${Math.round(probe.headerH)} rows${Math.round(probe.rowsUsed)} areaB${Math.round(areaB)} Dh${Math.round(D.h)} S${Math.round(S)}]`);
    page = pageSheet(ctx, {prefix: 'doc', D: doc0, x0: docX0, top: docTop, w: docW, s, bandRow: pts.same, minBottom: docTop + docH});
    if (page.bottom > areaB + 2) problems.push('doc-bottom');
    if (legendAt && opt.legendRight) {
      legendAt.y = Math.max(docTop, areaB - legendAt.h);
      if (legendAt.y + legendAt.h > D.h - 4) problems.push('legend-right');
    }
  }
  G.doc = page;

  // one name size for both professionals (equal treatment)
  const chipCommon = Math.min(chips.a.fit.size, chips.b.fit.size);
  // --- badges + chips (element boxes = badge ∪ chip)
  const badges = {};
  const elBox = {};
  for (const id of ['a', 'b']) {
    const gg = G[id];
    const badge = personBadge(ctx, {name: `badge-${id}`, x: gg.cx, y: gg.badgeY, radius: R, look: looks[id === 'a' ? 0 : 1], ring: color(id)});
    const chip = gg.chipSide
      ? wchip(ctx, capOf(id), {x: gg.cx + gg.chipSide * (R + 14), y: gg.badgeY - chips[id].box.h / 2, anchor: gg.chipSide < 0 ? 'end' : 'start', maxWidth: chips[id].box.w + 2, size: chipCommon, minSize: chipCommon, maxLines: 5, fill: th.card, weight: 600, name: `chip-${id}`})
      : wchip(ctx, capOf(id), {x: gg.cx, y: gg.chipY, anchor: 'middle', maxWidth: chipMax, size: chipCommon, minSize: chipCommon, maxLines: 4, fill: th.card, weight: 600, name: `chip-${id}`});
    const cb = showKey ? chip.box : {x: gg.cx - R, y: gg.badgeY + R, w: R * 2, h: 0};
    badges[id] = {node: g({name: `el-${id}`}, badge.node, showKey ? chip.node : null), chip: showKey ? chip : null, circle: badge.circle};
    const bx0 = Math.min(gg.cx - R, cb.x), bx1 = Math.max(gg.cx + R, cb.x + cb.w);
    elBox[id] = {x: bx0, y: gg.badgeY - R, w: bx1 - bx0, h: cb.y + cb.h - (gg.badgeY - R)};
  }
  elBox.notesA = G.a.card.box;
  elBox.notesB = G.b.card.box;
  elBox.document = page.box;
  const center = id => ({x: elBox[id].x + elBox[id].w / 2, y: elBox[id].y + elBox[id].h / 2});
  for (const [i, j] of [['a', 'notesA'], ['b', 'notesB'], ['notesA', 'document'], ['notesB', 'document'], ['a', 'document'], ['b', 'document']]) {
    if (overlaps(elBox[i], elBox[j], 4)) problems.push(`overlap-${i}-${j}`);
  }

  // --- flags on the page margin (grip = the outer tab end + 16s from the edge)
  const flagDefs = [
    {id: 'sameA', who: 'a', row: pts.same},
    {id: 'sameB', who: 'b', row: pts.same},
    {id: 'open', who: by, row: pts.open, ring: true},
  ];
  const grip = (who, row) => ({x: who === 'a' ? page.x0 - 16 * s : page.x1 + 16 * s, y: page.rowY(row)});
  const tipOf = (who, row) => {
    const q = grip(who, row);
    return {x: q.x - (who === 'a' ? 36 : -36) * s, y: q.y};
  };
  const flagNodes = flagDefs.map(f => pageFlag(ctx, {name: `flag-${f.id}`, color: color(f.who), s, ring: f.ring}));
  const slotQ = grip(by === 'a' ? 'b' : 'a', pts.open);
  const slot = g({transform: `${T(slotQ.x, slotQ.y)} scale(${by === 'a' ? -1 : 1} 1)`}, emptySlot(ctx, {name: 'slot', s}));

  // --- connectors (only the supplied relationships)
  const conns = [];
  const looseLabels = [];
  // label obstacles: each badge circle and name chip separately (their union box would also block
  // the free space between the two badges), the cards and the page
  const occupied = [elBox.notesA, elBox.notesB, elBox.document];
  for (const id of ['a', 'b']) {
    const c = badges[id].circle;
    occupied.push({x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2});
    if (badges[id].chip) occupied.push(badges[id].chip.box);
  }
  p.relationships.forEach((rel, ri) => {
    const col = kindColor(ctx, rel.kind);
    const text = rel.label || p.relationLabels[rel.kind];
    const fan = (rel.from === 'notesA' || rel.from === 'notesB') && rel.to === 'document' ? (rel.from === 'notesA' ? 'a' : 'b') : (rel.to === 'notesA' || rel.to === 'notesB') && rel.from === 'document' ? (rel.to === 'notesA' ? 'a' : 'b') : null;
    const lines = [];
    if (fan) {
      const card = G[fan].card;
      noteRows(fan).forEach((nr, k) => {
        const rg = card.rowGeo[k];
        const tip = tipOf(fan, nr.row);
        let from, c1, c2;
        if (!portrait) {
          const x = fan === 'a' ? card.box.x + card.box.w : card.box.x;
          from = {x, y: rg.cy};
          const dx = tip.x - from.x;
          c1 = {x: from.x + dx * 0.5, y: from.y};
          c2 = {x: tip.x - dx * 0.5, y: tip.y};
        } else {
          // down (A) or up (B) the page's side gutter, then into the margin
          // from the card's bottom edge, down the page's side gutter, then into the margin
          // each note gets its own lane in the page's side gutter (the higher target takes the inner
          // lane, so lines never cross) and its own start point on the card's bottom edge
          const rowsSorted = noteRows(fan).map(x => x.row).sort((x2, y2) => x2 - y2);
          const lane = rowsSorted.indexOf(nr.row);
          const off = gutter * (0.22 + 0.55 * lane);
          const gx = fan === 'a' ? page.x0 - off : page.x1 + off;
          from = {x: clamp(gx, card.box.x + 20, card.box.x + card.box.w - 20), y: card.box.y + card.box.h};
          c1 = {x: from.x, y: tip.y};
          c2 = {x: from.x, y: tip.y};
        }
        const forward = rel.from !== 'document';
        const cc = connector(ctx, {name: `c${ri}-${k}`, from: forward ? from : tip, to: forward ? tip : from, c1: forward ? c1 : c2, c2: forward ? c2 : c1, kind: rel.kind, color: col});
        lines.push({cc, flag: nr.flag, forward});
      });
    } else {
      const A = elBox[rel.from], B = elBox[rel.to];
      if (!A || !B) return;
      let from, to, c1, c2;
      if ((rel.from === 'a' && rel.to === 'b') || (rel.from === 'b' && rel.to === 'a')) {
        // over the page (wide) or down the far-left gutter (tall)
        const ca = badges[rel.from].circle, cb = badges[rel.to].circle;
        if (!topRow) {
          const topY = Math.max(10 + S * 1.4, page.top - 40 * z - S * 1.6);
          from = {x: ca.x + (ca.x < cb.x ? 1 : -1) * ca.r * 0.72, y: ca.y - ca.r * 0.72};
          to = {x: cb.x + (cb.x < ca.x ? 1 : -1) * cb.r * 0.72 * 1.0, y: cb.y - cb.r * 0.72};
          to = {x: to.x + (cb.x < ca.x ? 1 : -1) * 6, y: to.y - 6};
          c1 = {x: from.x + (to.x - from.x) * 0.2, y: topY - 30 * z};
          c2 = {x: to.x - (to.x - from.x) * 0.2, y: topY - 30 * z};
        } else {
          // leaves the top of one badge, arcs up through the label band, lands on the other badge
          const dirx = cb.x > ca.x ? 1 : -1;
          const ang = labelBand ? -Math.PI / 2 + dirx * 0.55 : (dirx > 0 ? 0 : Math.PI);
          from = {x: ca.x + Math.cos(ang) * (ca.r + 2), y: ca.y + Math.sin(ang) * (ca.r + 2)};
          const endR = cb.r + (rel.kind === 'relation' ? 2 : 10);
          const ang2 = labelBand ? -Math.PI / 2 - dirx * 0.55 : (dirx > 0 ? Math.PI : 0);
          to = {x: cb.x + Math.cos(ang2) * endR, y: cb.y + Math.sin(ang2) * endR};
          const apex = labelBand ? 12 + labelBand * 0.5 : Math.min(from.y, to.y) - 8;
          const cy = Math.min(from.y, to.y) - (Math.min(from.y, to.y) - apex) / 0.75;
          c1 = {x: lerp(from.x, to.x, 0.2), y: cy};
          c2 = {x: lerp(from.x, to.x, 0.8), y: cy};
        }
      } else if (portrait && isNotes(rel.from) && isNotes(rel.to)) {
        // cards side by side: an arc over the two cards, between their "writes" lines
        const toLeft = B.x < A.x;
        from = {x: toLeft ? A.x + 28 : A.x + A.w - 28, y: A.y - 4};
        to = {x: toLeft ? B.x + B.w - 28 : B.x + 28, y: B.y - (rel.kind === 'relation' ? 4 : 10)};
        const up = Math.max(24, cardLinkGap * 0.75);
        c1 = {x: from.x, y: from.y - up / 0.75};
        c2 = {x: to.x, y: to.y - up / 0.75};
      } else {
        from = edgeAnchor(A, center(rel.to), 6);
        to = edgeAnchor(B, center(rel.from), rel.kind === 'relation' ? 6 : 12);
        // a link between the two side columns never crosses the page: it runs in a U under it
        const crosses = [0.25, 0.5, 0.75].some(tt => {
          const q = {x: lerp(from.x, to.x, tt), y: lerp(from.y, to.y, tt)};
          return q.x > page.x0 - 20 && q.x < page.x1 + 20 && q.y > page.top - 20 && q.y < page.bottom + 20;
        });
        if (crosses) {
          from = {x: A.x + A.w / 2, y: A.y + A.h + 6};
          to = {x: B.x + B.w / 2, y: B.y + B.h + (rel.kind === 'relation' ? 6 : 12)};
          const low = Math.max(from.y, to.y, page.bottom) + 96 * z;
          c1 = {x: from.x, y: low + 20 * z};
          c2 = {x: to.x, y: low + 20 * z};
        }
      }
      const cc = connector(ctx, {name: `c${ri}-0`, from, to, c1, c2, kind: rel.kind, color: col, bend: 0.08});
      lines.push({cc, flag: null, forward: true});
    }
    // label: near the middle of the first line, moved perpendicular until clear
    let lab = null;
    const footerLab = false;
    if (showAll && lines.length) {
      const c0 = lines[0].cc;
      const inside = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= D.w - 8 && b.y + b.h <= areaB;
      const samples = l => Array.from({length: 41}, (_, q) => l.cc.at(q / 40));
      const hitsLine = (b, l) => samples(l).some(q => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4);
      // never on another connector (it may sit on its own first line)
      const lineHits = b => conns.some(cn => cn.lines.some(l => hitsLine(b, l))) || lines.slice(1).some(l => hitsLine(b, l));
      const own = samples(lines[0]);
      const distTo = b => Math.min(...own.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)))));
      const labSize = Math.min(S, capSize);
      const probe0 = wchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(360, D.w * 0.3), size: labSize, minSize: Math.min(labSize, Smin), maxLines: 2, fill: th.card, stroke: col, weight: 600});
      const bw = probe0.box.w, bh = probe0.box.h;
      const tsList = fan ? (lines[0].forward ? [0.08, 0.14, 0.2, 0.04, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8] : [0.92, 0.86, 0.8, 0.96, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]) : [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82];
      // candidates: the chip centred on its own line, or beside it (offset up to maxD + half its size)
      const offs = [];
      for (let d = 0; d <= maxD + Math.max(bw, bh) / 2; d += 6) offs.push(d);
      outer: for (const tt of tsList) {
        const mid = c0.at(tt);
        for (const d of offs) {
          for (const [ux, uy] of d ? [[0, -1], [0, 1], [1, 0], [-1, 0]] : [[0, 0]]) {
            const cx2 = mid.x + ux * d, cy2 = mid.y + uy * d;
            const b = {x: cx2 - bw / 2, y: cy2 - bh / 2, w: bw, h: bh};
            if (distTo(b) > maxD) continue;
            if (inside(b) && !occupied.some(o => overlaps(b, o, 6)) && !lineHits(b)) {
              lab = wchip(ctx, text, {x: cx2, y: b.y, anchor: 'middle', maxWidth: Math.min(360, D.w * 0.3), size: probe0.fit.size, minSize: probe0.fit.size, maxLines: 2, fill: th.card, stroke: col, weight: 600, name: `lab${ri}`});
              break outer;
            }
          }
        }
      }
      const make = (ox, oy) => wchip(ctx, text, {x: c0.at(0.5).x + ox, y: c0.at(0.5).y - bh / 2 + oy, anchor: 'middle', maxWidth: Math.min(360, D.w * 0.3), size: probe0.fit.size, minSize: probe0.fit.size, maxLines: 2, fill: th.card, stroke: col, weight: 600, name: `lab${ri}`});
      if (!lab) { lab = make(0, 0); problems.push(`label${ri}`); }
      occupied.push(lab.box);
    }
    let labDist = null;
    if (lab && lines.length) {
      const b = lab.box;
      labDist = Math.min(...Array.from({length: 41}, (_, q) => lines[0].cc.at(q / 40)).map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)))));
    }
    const originGap = lines.length > 1 ? Math.min(...lines.slice(1).map(l => Math.hypot(l.cc.from.x - lines[0].cc.from.x, l.cc.from.y - lines[0].cc.from.y))) : null;
    conns.push({rel, lines, lab, col, footerLab, labDist, originGap});
  });

  // --- tracer route along the traversal order
  const pts2 = [];
  const visits = [];
  const add = q => pts2.push({x: q.x, y: q.y});
  p.traversalOrder.forEach((id, i) => {
    if (!elBox[id]) return;
    if (i === 0) { add(center(id)); visits.push({id, idx: 0}); return; }
    const prev = p.traversalOrder[i - 1];
    const cn = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    if (cn && cn.lines.length) {
      const l = cn.lines[0].cc;
      const fwd = (cn.rel.from === prev) === cn.lines[0].forward;
      add(fwd ? l.from : l.to);
      for (let k = 1; k <= 30; k++) add(l.at(fwd ? k / 30 : 1 - k / 30));
    }
    add(center(id));
    visits.push({id, idx: pts2.length - 1});
  });
  const route = polyline(pts2.length > 1 ? pts2 : [pts2[0] || {x: 0, y: 0}, pts2[0] || {x: 0, y: 0}]);
  const cum = [0];
  for (let i = 1; i < pts2.length; i++) cum.push(cum[i - 1] + Math.hypot(pts2[i].x - pts2[i - 1].x, pts2[i].y - pts2[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / total}));
  const docVisit = visitT.find(v => v.id === 'document');

  // the legend (generic captions) never exceeds the smallest supplied text drawn
  if (legendRows.length) {
    const contentMin = Math.min(G.doc.D ? G.doc.D.size : S, page.size ?? S, ...['a', 'b'].map(id => Math.min(...G[id].card.fits.map(f => f.size))), ...['a', 'b'].map(id => chips[id].fit.size));
    if (contentMin < lsz - 0.01) {
      lsz = contentMin;
      glyphW = lsz * 4.2;
      const w0 = legendAt ? legendAt.w : D.w - 24;
      legendRows = legendLayout(w0).rows;
    }
  }
  const cardNote = Object.fromEntries(['a', 'b'].map(id => [id, Math.min(...G[id].card.fits.map(f => f.size))]));
  const noteSize = Math.min(cardNote.a, cardNote.b);
  // readable notes: a text column of at least ~12 em (never 1–3 words per line)
  if (['a', 'b'].some(id => G[id].card.box.w - S * 3.4 < noteSize * 12)) problems.push('card-narrow');
  const captionMax = Math.max(lsz, ...['a', 'b'].map(id => chips[id].fit.size), ...conns.filter(c => c.lab).map(c => c.lab.fit.size));
  if (captionMax > noteSize + 0.01 && opt.cap != null) problems.push('caption-size');
  return {cardNote, maxD, noteSize, captionMax, page, badges, conns, flagDefs, flagNodes, slot, elBox, center, route, visitT, docVisit, grip, tipOf, legendRows, lgH, lsz, glyphW, areaB, legendAt, problems, looseLabels, labelsFit: problems.length === 0, color, pts, by, G, s, kinds, z, floorPx};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 920], portrait: [900, 1400]},
  layout(ctx) {
    const shape = ctx.view.shape;
    const kinds = shape === 'landscape' ? ['columns'] : shape === 'portrait' ? ['bands'] : ['bands', 'hybrid', 'columns'];
    let best = null, loose = null;
    const tried = [];
    for (const floorPx of [19.6, 16.6]) {
      for (const z of [1, 0.9, 0.8, 0.7]) {
        for (const kind of kinds) {
          const opts = kind === 'bands' ? [{gap: 20}, {gap: 12}, {gap: 6}, {gap: 12, sideChips: false}, {gap: 0}, {gap: 20, sideChips: false}, {gap: 0, sideChips: false}, {gap: 0, legendRight: true}, {gap: 0, legendRight: true, sideChips: false}, {gap: 24, legendRight: true, sideChips: false}, {gap: 48, legendRight: true, sideChips: false}, {gap: 24, legendRight: true, sideChips: false, lgFrac: 0.3}, {gap: 24, legendRight: true, lgFrac: 0.3}] : kind === 'hybrid' ? [{pageFrac: 0.44}, {pageFrac: 0.41}, {pageFrac: 0.38}, {pageFrac: 0.41, gap: 2.1}, {pageFrac: 0.44, legendBeside: true}, {pageFrac: 0.41, legendBeside: true}, {pageFrac: 0.5, legendBeside: true, gap: 2.5}, {pageFrac: 0.5, legendBeside: true, gap: 2.1}, {pageFrac: 0.47, legendBeside: true, gap: 2.5}] : [{}];
          for (const o of opts) {
            let L = compose(ctx, floorPx, z, kind, o);
            if (Math.abs(L.cardNote.a - L.cardNote.b) > 0.01) L = compose(ctx, floorPx, z, kind, {...o, noteSz: L.noteSize});
            if (L.captionMax > L.noteSize + 0.01) L = compose(ctx, floorPx, z, kind, {...o, noteSz: L.noteSize, cap: L.noteSize});
            tried.push(`${floorPx}/${z}/${kind}/${JSON.stringify(o)}:${L.problems.join('+')}`);
            L.tried = tried;
            if (L.labelsFit && !L.looseLabels.length) return L;
            if (L.labelsFit && !loose) loose = L;
            // anything that overlaps (page into the legend, cut chips) ranks below label-placement misses
            const bad = x => x.problems.filter(q => !q.startsWith('label')).length * 10 + x.problems.length;
            if (!best || bad(L) < bad(best)) best = L;
          }
        }
      }
    }
    return loose || best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const D = ctx.design;
    // legend strip
    const legend = [];
    if (L.legendRows.length) {
      let y = L.legendAt ? L.legendAt.y : L.areaB + 12;
      L.legendRows.forEach((row, ri) => {
        const rowW = row.reduce((a, x) => a + x.w, 0);
        let x = L.legendAt ? L.legendAt.x : (D.w - rowW) / 2;
        const rh = Math.max(...row.map(x2 => x2.f.height + (x2.gh || 0)));
        for (const {it, f, w, stack, gh} of row) {
          const cy = y + (stack ? L.lsz * 0.55 : Math.min(rh, L.lsz * 1.2) / 2);
          const parts = [];
          if (it.kind) {
            const st = LINK_STYLES[it.kind];
            const col = L.conns.find(c => c.rel.kind === it.kind)?.col ?? th.fg;
            parts.push(h('path', {d: `M${r(x + 4)} ${r(cy)}H${r(x + L.glyphW - 10)}`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}));
            if (st.arrow) parts.push(h('path', {d: `M${r(x + L.glyphW - 4)} ${r(cy)}l-14 -8l4 8l-4 8z`, fill: col}));
            if (st.endDots) parts.push(h('circle', {cx: r(x + 4), cy: r(cy), r: r(st.width * 1.6), fill: col}), h('circle', {cx: r(x + L.glyphW - 10), cy: r(cy), r: r(st.width * 1.6), fill: col}));
          } else if (it.mark === 'same') parts.push(glyphSame(ctx, {x: x + L.glyphW / 2, y: cy, sz: L.lsz, colors: [L.color('a'), L.color('b')]}));
          else if (it.mark === 'open') parts.push(glyphOpen(ctx, {x: x + L.glyphW / 2, y: cy, sz: L.lsz, color: L.color(L.by)}));
          parts.push(textBlock(f, {x: it.key || stack ? x : x + L.glyphW + L.lsz * 0.5, y: y + (gh || 0), fill: it.key ? th.fgSoft : th.fg}));
          legend.push(g(null, parts));
          x += w;
        }
        y += rh + L.lsz * 0.5;
      });
    }
    return g(null,
      L.conns.map(c => c.lines.map(l => l.cc.node)),
      g({name: 'el-document'}, L.page.node, L.slot, L.flagNodes),
      g({name: 'el-notesA'}, L.G.a.card.node),
      g({name: 'el-notesB'}, L.G.b.card.node),
      L.badges.a.node, L.badges.b.node,
      L.conns.map(c => c.lab && c.lab.node),
      tracer(ctx, 'tracer', ctx.theme.accent2),
      g({name: 'legend', opacity: 0}, legend),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const D = ctx.design;
    // separate: elements slide from the centre to their places
    const sep = ease.outCubic(seg(u, ...W.separate));
    const c0 = {x: D.w / 2, y: L.page.top + L.page.box.h / 2};
    const place = id => {
      const c = L.center(id);
      return {dx: (c0.x - c.x) * (1 - sep) * 0.35, dy: (c0.y - c.y) * (1 - sep) * 0.35};
    };
    // trace + focus
    const tr = seg(u, ...W.trace);
    const tq = L.route.at(ease.inOutSine(tr));
    const focusOf = id => {
      const v = L.visitT.find(x => x.id === id);
      if (!v || tr <= 0 || tr >= 1) return 0;
      const d = Math.abs(ease.inOutSine(tr) - v.t);
      return clamp(1 - d / 0.12);
    };
    for (const id of ['a', 'b', 'notesA', 'notesB', 'document']) {
      const o = place(id);
      const c = L.center(id);
      const amp = id === p.focusElement ? 0.07 : 0.035;
      const f = 1 + amp * ease.inOutSine(focusOf(id));
      nodes[`el-${id}`] = {transform: `${T(o.dx, o.dy)} ${scaleAbout(c.x, c.y, r(f, 4))}`, opacity: r(clamp(sep * 1.5), 3)};
    }
    // relate: connectors one by one; flags ride their fan lines
    const nRel = L.conns.length || 1;
    const relW = (W.relate[1] - W.relate[0]) / nRel;
    const flagPos = {};
    L.conns.forEach((cn, i) => {
      const a = W.relate[0] + i * relW;
      const pr = ease.inOutCubic(seg(u, a, a + relW * 0.7));
      for (const l of cn.lines) {
        Object.assign(nodes, l.cc.frame(pr, pr > 0 ? 1 : 0));
        if (l.flag) {
          // the flag leaves the note's row as the line starts and lands on the margin as it ends
          const fp = ease.inOutCubic(seg(u, a + relW * 0.3, a + relW * 0.3 + W.ride));
          const q = l.cc.at(l.forward ? fp : 1 - fp);
          const f = L.flagDefs.find(x => x.id === l.flag);
          const g0 = L.grip(f.who, f.row);
          const tip = L.tipOf(f.who, f.row);
          // on the line the flag is carried by its outer tip; on arrival it slides onto the margin
          const onLine = fp < 1 ? {x: q.x + (g0.x - tip.x) * fp, y: q.y} : g0;
          flagPos[l.flag] = {x: onLine.x, y: onLine.y, t: fp};
        }
      }
      if (cn.lab || (cn.footerLab && ctx.show('all'))) nodes[`lab${i}`] = {opacity: r(seg(u, a + relW * 0.5, a + relW * 0.8), 3)};
    });
    for (const f of L.flagDefs) {
      const fp = flagPos[f.id] || {x: L.grip(f.who, f.row).x, y: L.grip(f.who, f.row).y, t: 1};
      const dir = f.who === 'a' ? 1 : -1;
      nodes[`flag-${f.id}`] = {transform: `${T(fp.x, fp.y)} scale(${dir} 1)`, opacity: fp.t > 0 ? 1 : 0};
      flagPos[f.id] = fp;
    }
    // marks when the tracer crosses the page (or at the end of the trace if the page is not visited)
    const mt = L.docVisit ? W.trace[0] + (W.trace[1] - W.trace[0]) * L.docVisit.t : W.trace[1];
    const band = seg(u, mt - 0.01, mt + 0.06);
    const ring = seg(u, mt + 0.02, mt + 0.08);
    Object.assign(nodes, L.page.bandFrame(band));
    nodes['flag-open-ring'] = {opacity: r(ring, 3)};
    nodes.slot = {opacity: r(ring, 3)};
    nodes.tracer = {transform: T(tq.x, tq.y), opacity: tr > 0 && tr < 1 ? 1 : 0};
    nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const drawn = L.conns.map((cn, i) => r(ease.inOutCubic(seg(u, W.relate[0] + i * relW, W.relate[0] + i * relW + relW * 0.7)), 3));
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    // each connector's ends sit on its elements' edges (checked on the laid-out geometry)
    const onEdge = (q, box) => {
      const dx = Math.max(box.x - q.x, 0, q.x - (box.x + box.w)), dy = Math.max(box.y - q.y, 0, q.y - (box.y + box.h));
      const inside = q.x >= box.x && q.x <= box.x + box.w && q.y >= box.y && q.y <= box.y + box.h;
      return inside ? Math.min(q.x - box.x, box.x + box.w - q.x, q.y - box.y, box.y + box.h - q.y) < 14 : Math.hypot(dx, dy) < 18;
    };
    const anchorFails = [];
    const anchored = L.conns.map((cn, ci) => cn.lines.map((l, li) => {
      const fromId = l.forward ? cn.rel.from : cn.rel.to, toId = l.forward ? cn.rel.to : cn.rel.from;
      const endBox = id => (id === 'document' ? {x: L.page.x0 - 110 * L.s, y: L.page.top, w: L.page.box.w + 220 * L.s, h: L.page.box.h} : L.elBox[id]);
      // a badge end sits on its circle (± 12), the chip under it belongs to the same element
      // a notes → page line ends exactly on the outer tip of the flag it places (margin spot)
      const onFlagTip = q => L.flagDefs.some(f => { const tq = L.tipOf(f.who, f.row); return Math.hypot(q.x - tq.x, q.y - tq.y) < 1; });
      const onEl = (q, id) => (id === 'document' && onFlagTip(q)) || ((id === 'a' || id === 'b') && Math.abs(Math.hypot(q.x - L.badges[id].circle.x, q.y - L.badges[id].circle.y) - L.badges[id].circle.r) < 12) || onEdge(q, endBox(id));
      const ok = onEl(l.cc.from, fromId) && onEl(l.cc.to, toId);
      if (!ok) anchorFails.push(`${ci}.${li}:${cn.rel.from}>${cn.rel.to}`);
      return ok;
    }).every(Boolean)).every(Boolean);
    const tracerAt = (() => {
      let last = null;
      for (const v of L.visitT) if (tr > 0 && ease.inOutSine(tr) >= v.t - 1e-6) last = v.id;
      return last;
    })();
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sep, 3),
        drawn,
        kinds: L.conns.map(c => c.rel.kind),
        arrows: L.conns.map(c => LINK_STYLES[c.rel.kind].arrow),
        anchored, anchorFails,
        tracer: P2(tq), tracerOn: tr > 0 && tr < 1, tracerAt,
        order: L.visitT.map(v => v.id),
        visitTimes: L.visitT.map(v => r(v.t, 3)),
        focus: r(focusOf(p.focusElement), 3), focusElement: p.focusElement,
        flagSameA: P2(flagPos.sameA), flagSameB: P2(flagPos.sameB), flagOpen: P2(flagPos.open),
        flagsLanded: L.flagDefs.every(f => (flagPos[f.id].t ?? 1) >= 1),
        aligned: Math.abs(flagPos.sameA.y - flagPos.sameB.y) < 0.5 && (flagPos.sameA.t ?? 1) >= 1 && (flagPos.sameB.t ?? 1) >= 1,
        band: r(band, 3), ring: r(ring, 3),
        legendShown: nodes.legend.opacity,
        labelsFit: L.labelsFit, problems: L.problems,
        // every relation label sits within ~40 px of its own connector
        labelsNear: L.conns.every(c => !c.lab || c.labDist <= L.maxD + 0.5),
        // the lines of one notes card start at clearly separate points (≥ ~40 px apart)
        linesDistinct: L.conns.every(c => c.originGap == null || c.originGap >= L.maxD),
        // generic captions are never larger than the notes
        captionsNotLarger: L.captionMax <= L.noteSize + 0.01,
        equalSizes: (!L.badges.a.chip || Math.abs(L.badges.a.chip.fit.size - L.badges.b.chip.fit.size) < 0.01) && Math.abs(L.cardNote.a - L.cardNote.b) < 0.01, looseLabels: L.looseLabels, tried: L.tried,
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-02-mechanism',
    title: 'Consultation between professionals — notes, flags and one shared page',
    titleEs: 'Consulta entre profesionales — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta entre profesionales',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded diagram: the two professionals (badges), each one’s notes card and the shared page separate, then only the supplied relationships are drawn by kind (the consultation as communication, “writes” and “flags a passage” as plain relations). Each note’s line ends on the passage it flags and its flag rides the line onto the margin. A tracer follows the supplied traversal order; as it crosses the page, the level flags are joined (same point noted) and the lone flag gets an open ring (open question). Legend of kinds and marks, as supplied, no conclusion.',
    tags: ['consultation', 'professionals', 'mechanism', 'relationships', 'notes', 'margin flags', 'shared document', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-entre-profesionales.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
