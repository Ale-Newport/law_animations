/**
 * LAW-0018 — Ocultación de datos · mechanism
 *
 * Storyboard (exploded, layered document — not a row of boxes):
 *  0.00–0.18  separate: the full copy (original), the working copy, a marker,
 *             a copy stamp and a folder appear; a transparent redaction film
 *             lifts OUT of the working copy (it starts registered on it) to an
 *             exploded position. The film carries registration crosshairs and
 *             ghost outlines of the copy's field grid — same structure.
 *  0.18–0.43  relate: only the supplied relationships are drawn, each styled
 *             by kind (plain relation = no arrow; causal only if supplied),
 *             anchored to the real edges of their elements. Captions are
 *             placed with connector awareness (kit `relationCaptions`): on
 *             their own connector when possible, never over another
 *             connector, an element or a label, so every connector visibly
 *             starts and ends at its element.
 *  0.43–0.75  trace: a tracer follows `traversalOrder`; the focus element
 *             enlarges as it passes. Between the marker and the film the bands
 *             are drawn on the film's selected ghost boxes; between the film
 *             and the copy the same bands land on the copy's value boxes
 *             (values removed, labels/boxes kept); at the folder the redacted
 *             copy appears inside it.
 *             When the traversal does not run pen → film, the marker draws the
 *             bands once the tracer has reached it (the tracer rests there),
 *             and they land on the copy right after — never before they exist
 *             on the film.
 *  0.75–1.00  gather: origin (full copy), transformation (film with bands) and
 *             state (redacted copy; copy-type stamp only when a stamp–copy
 *             relationship is supplied) stay visible with descriptive tags.
 * @module animations/documents/LAW-0018
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r, stagger} from '../../core/time.js';
import {mechanismFields, str} from '../../schemas/fields.js';
import {chip, statusTag, textBlock} from '../../primitives/annotate.js';
import {stampTool, shade} from '../../primitives/paper.js';
import {iconBadge} from '../../primitives/badges.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {roundRectPath} from '../../core/geometry.js';
import {recordSheet, redactionMarker, redactionDocFields, redactedIndices, openFolder, relationCaptions, BAND_INK, REDACTION_STRINGS} from './kits/ocultacion-de-datos.js';

const ID = 'LAW-0018';
const DURATION = 7000;
const IDS = ['original', 'copy', 'film', 'pen', 'stamp', 'folder'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const TRACE = [0.44, 0.74];

const sceneSchema = {
  ...redactionDocFields,
  ...mechanismFields(IDS),
  stampLabel: str('Copy-type stamp impression shown on the redacted copy at the end (only when a stamp–copy relationship is supplied)', 24),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'REC-2231',
  documentTitle: 'Client Intake Record',
  clauses: ['Client name', 'Home address', 'Account reference', 'Matter summary', 'Fee basis (hypothetical)'],
  fieldValues: ['Alex Moreno', '14 Example Lane, Northtown', 'ACC-0000-1234 (fictional)', 'Equipment lease review', 'Fixed fee of 900 (hypothetical)'],
  signers: [{name: 'Jordan Pike', role: 'Clerk'}, {name: 'Rina Solis', role: 'Reviewer'}],
  redactions: [0, 1, 2],
  elements: [
    {id: 'original', label: 'Original record'},
    {id: 'copy', label: 'Working copy'},
    {id: 'film', label: 'Redaction layer'},
    {id: 'pen', label: 'Marker'},
    {id: 'stamp', label: 'Copy stamp'},
    {id: 'folder', label: 'Release folder'},
  ],
  relationships: [
    {from: 'original', to: 'copy', kind: 'sequence', label: 'duplicated'},
    {from: 'pen', to: 'film', kind: 'sequence', label: 'draws bands'},
    {from: 'film', to: 'copy', kind: 'relation', label: 'lies over selected fields'},
    {from: 'stamp', to: 'copy', kind: 'relation', label: 'marks copy type'},
    {from: 'copy', to: 'folder', kind: 'communication', label: 'filed'},
  ],
  focusElement: 'film',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['pen', 'film', 'copy', 'folder'],
  stampLabel: 'REDACTED COPY',
};

/**
 * Hand-placed component positions per shape (centres, design units). Gaps
 * between related elements leave room for each connector and its caption.
 *  - landscape: original → copy ← film ← marker along the middle band, stamp
 *    top-left, folder bottom-right;
 *  - square: same order, marker above the gap between copy and film;
 *  - portrait: three rows — marker | film, original | copy, stamp | folder.
 */
const PLACES = {
  landscape: {size: [1900, 1030], copyW: 480, origW: 320, labelMax: 380,
    original: [235, 580], copy: [820, 500], film: [1400, 400], pen: [1810, 200], stamp: [330, 175], folder: [1560, 800], legendY: 1004,
    sides: {original: 'below', copy: 'below', film: 'above', pen: 'below', stamp: 'left', folder: 'below'}},
  square: {size: [1500, 1330], copyW: 440, origW: 280, labelMax: 360,
    original: [180, 760], copy: [710, 690], film: [1300, 470], pen: [1030, 150], stamp: [190, 290], folder: [1230, 1010], legendY: 1302,
    sides: {original: 'below', copy: 'below', film: 'above', pen: 'left', stamp: 'above', folder: 'below'}},
  portrait: {size: [1040, 1720], copyW: 380, origW: 250, labelMax: 330,
    original: [165, 880], copy: [640, 880], film: [720, 310], pen: [190, 220], stamp: [200, 1400], folder: [700, 1430], legendY: 1694,
    sides: {original: 'below', copy: 'right', film: 'above', pen: 'below', stamp: 'below', folder: 'below'}},
};
const FILM_SCALE = 0.78;

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    // Spread the placements (not the element sizes) along the axis the
    // content box has spare room in, so connectors and captions get the
    // room instead of letterboxing.
    const [bw, bh] = Pl.size;
    const dr = ctx.design.w / ctx.design.h;
    const S = dr > bw / bh ? {w: Math.min(bw * 1.3, bh * dr), h: bh} : {w: bw, h: Math.min(bh * 1.3, bw / dr)};
    const kx = S.w / bw, ky = S.h / bh;
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const at = id => ({x: Pl[id][0] * kx, y: Pl[id][1] * ky});
    const showAll = ctx.show('all');
    const n = Math.min(5, p.clauses.length);
    const idx = redactedIndices(p.redactions, n);

    // --- working copy (bands land here) and the full copy (never changes)
    const cw = Pl.copyW, chh = Math.round(cw * 1.3);
    const copyC = at('copy');
    const copyBox = {x: copyC.x - cw / 2, y: copyC.y - chh / 2, w: cw, h: chh};
    const copy = recordSheet(ctx, {prefix: 'copy', w: cw, h: chh, docId: p.documentId, title: p.documentTitle, labels: p.clauses, values: p.fieldValues, showText: showAll, stampLabel: p.stampLabel, lineSeed: 'redaction-doc'});
    const ow = Pl.origW, ohh = Math.round(ow * 1.3);
    const origC = at('original');
    const origBox = {x: origC.x - ow / 2, y: origC.y - ohh / 2, w: ow, h: ohh};
    const orig = recordSheet(ctx, {prefix: 'orig', w: ow, h: ohh, docId: p.documentId, title: p.documentTitle, labels: p.clauses, values: p.fieldValues, showText: showAll, stampLabel: null, lineSeed: 'redaction-doc'});
    const crosshairs = (w, hh, color, name) => g({name}, [[14, 14], [w - 14, 14], [14, hh - 14], [w - 14, hh - 14]].map(([x, y]) => g(null,
      h('circle', {cx: x, cy: y, r: 8, fill: 'none', stroke: color, 'stroke-width': 2}),
      h('path', {d: `M${x - 13} ${y}H${x + 13}M${x} ${y - 13}V${y + 13}`, stroke: color, 'stroke-width': 2}))));
    const copyNode = g({name: 'el-copy', transform: T(copyBox.x, copyBox.y)}, g({name: 'el-copy-body'}, copy.node, crosshairs(cw, chh, th.accent2, 'copy-reg')));
    const origNode = g({name: 'el-original', transform: T(origBox.x, origBox.y)}, g({name: 'el-original-body'}, orig.node));

    // --- redaction film: same local geometry as the copy (registered), with
    // ghost outlines of every value box and a band for each selected field.
    const filmOutC = at('film');
    const filmW = cw * FILM_SCALE, filmH = chh * FILM_SCALE;
    const filmBox = {x: filmOutC.x - filmW / 2, y: filmOutC.y - filmH / 2, w: filmW, h: filmH};
    const filmParts = [
      h('path', {d: roundRectPath(0, 0, cw, chh, 10), fill: th.accent2Soft, 'fill-opacity': 0.55, stroke: th.accent2, 'stroke-width': 3.5, 'stroke-dasharray': '12 8'}),
      crosshairs(cw, chh, th.accent2, 'film-reg'),
      copy.fields.map(f => h('path', {d: roundRectPath(f.box.x, f.box.y, f.box.w, f.box.h, 5), fill: 'none', stroke: th.accent2, 'stroke-width': 1.8, 'stroke-dasharray': '6 6', opacity: 0.75})),
      idx.map(i => {
        const b = copy.fields[i].band;
        return h('rect', {name: `film-band-${i}`, x: r(b.x), y: r(b.y), width: 0, height: r(b.h), rx: 3, fill: BAND_INK});
      }),
    ];
    // the film is drawn in copy-local coordinates around its own centre
    const filmNode = g({name: 'el-film'}, g({name: 'el-film-body'}, g({transform: T(-cw / 2, -chh / 2)}, filmParts)));

    // --- marker, stamp, folder
    const mk = redactionMarker(ctx, {name: 'pen-icon', length: 150});
    const penR = 76, stampR = 68;
    const penB = iconBadge(ctx, {name: 'el-pen', x: at('pen').x, y: at('pen').y, radius: penR, icon: g({transform: T(-50, 40, -40)}, mk.node), label: ''});
    const stampB = iconBadge(ctx, {name: 'el-stamp', x: at('stamp').x, y: at('stamp').y, radius: stampR, icon: stampTool(ctx, {name: 'stamp-icon', size: 62, color: th.accent}), label: ''});
    const fwid = 280, fhei = 215;
    const fC = at('folder');
    const fold = openFolder(ctx, {w: fwid, h: fhei, label: '', showText: false});
    const mini = recordSheet(ctx, {prefix: 'mini', w: fhei * 0.78 * 0.76 * 1.05, h: fhei * 0.78 * 1.05, labels: p.clauses, values: p.fieldValues, showText: false, stampLabel: null, lineSeed: 'redaction-doc'});
    const folderNode = g({name: 'el-folder', transform: T(fC.x, fC.y)}, g({name: 'el-folder-body'},
      g({transform: T(-fwid / 2, -fhei / 2 + 16)}, fold.node),
      g({name: 'folder-copy', opacity: 0, transform: T(-mini.w / 2 + 10, -fhei / 2 + 30, -3)}, mini.node),
    ));
    const folderBox = {x: fC.x - fwid / 2, y: fC.y - fhei / 2 - fold.tabH + 16, w: fwid, h: fhei + fold.tabH};
    // Element labels on the side each shape keeps free of connectors (two
    // lines above/below, three beside), always inside the design space.
    const circleBox = c => ({x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2});
    const lab = (id, box, size = 30) => {
      if (!ctx.show('key') || !label(id)) return null;
      const where = Pl.sides[id];
      const side = where === 'left' || where === 'right';
      const maxWidth = where === 'left' ? box.x - 22 : where === 'right' ? S.w - (box.x + box.w) - 22 : Math.min(Pl.labelMax, S.w - 16);
      const o = {anchor: 'start', maxWidth, size, maxLines: side ? 3 : 2, name: `lab-${id}`};
      const m = chip(ctx, label(id), {...o, x: 0, y: 0}).box;
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      let x = where === 'left' ? box.x - 14 - m.w : where === 'right' ? box.x + box.w + 14 : cx - m.w / 2;
      x = Math.max(8, Math.min(S.w - 8 - m.w, x));
      const y = where === 'below' ? box.y + box.h + 14 : where === 'above' ? box.y - 14 - m.h : cy - m.h / 2;
      return chip(ctx, label(id), {...o, x, y});
    };
    const labOrig = lab('original', origBox);
    const labCopy = lab('copy', copyBox);
    const labFilm = lab('film', filmBox);
    const labFolder = lab('folder', folderBox);
    const labPen = lab('pen', circleBox(penB.circle), 28);
    const labStamp = lab('stamp', circleBox(stampB.circle), 28);
    const labels = [labOrig, labCopy, labFilm, labFolder, labPen, labStamp].filter(Boolean);

    const elements = {
      original: {box: origBox},
      copy: {box: copyBox},
      film: {box: filmBox},
      pen: {circle: penB.circle},
      stamp: {circle: stampB.circle},
      folder: {box: folderBox},
    };
    // Connectors + tracer route come from the graph framework; its own
    // captions are turned off and placed below with connector awareness.
    const graph = relationGraph({...ctx, show: () => false}, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels,
      bend: rel => (rel.kind === 'communication' ? 0.12 : 0.1)});
    const route = graph.route(p.traversalOrder);
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));
    // Connector ends must lie on their element edges (checked in semantics).
    const anchored = graph.conns.every(c => onEdge(elements[c.rel.from], c.c.from) && onEdge(elements[c.rel.to], c.c.to));

    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    // Legend on the bottom row, centred in the widest stretch that no element
    // or element label occupies at that height.
    const legendY = S.h - (bh - Pl.legendY);
    const blockers = [origBox, copyBox, filmBox, folderBox, circleBox(penB.circle), circleBox(stampB.circle), ...labels.map(c => c.box)];
    const span = freeSpan(blockers, {y0: legendY - 70, y1: S.h, x0: 40, x1: S.w - 40});
    const legend = showAll ? legendNode(ctx, kinds, p.relationLabels, {x: (span.x0 + span.x1) / 2, y: legendY}, span.x1 - span.x0) : null;
    const obstacles = [...blockers, legend && legend.box].filter(Boolean);
    const captions = relationCaptions(ctx, {
      name: 'rel-cap', conns: graph.conns,
      texts: graph.conns.map(x => x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind),
      colors: graph.conns.map(x => kindColor(ctx, x.rel.kind)),
      obstacles, bounds: {x: 8, y: 8, w: S.w - 16, h: (legend ? legend.box.y : S.h) - 16}, size: 28, maxWidth: 300,
    });

    // The copy-type impression is the effect of a supplied stamp–copy
    // relationship; without one the stamp stays an unconnected element.
    const stampRelated = p.relationships.some(x => (x.from === 'stamp' && x.to === 'copy') || (x.from === 'copy' && x.to === 'stamp'));
    const RS = REDACTION_STRINGS[p.locale] || REDACTION_STRINGS.en;
    // State tags are pinned on the sheets' footers (inside the elements), so
    // they never collide with relation captions.
    // Centred on the footer band (sized with the sheet) so they never cover
    // the last field row.
    const footerTag = (text, box, w, hh, size, name, color) => {
      const sz = Math.min(size, w * 0.075);
      const fh = hh * 0.085;
      return statusTag(ctx, text, {x: box.x + w / 2, y: box.y + hh - fh / 2 - (sz * 1.75) / 2, anchor: 'middle', size: sz, name, color, opacity: 0, maxWidth: w * 0.8});
    };
    const tagOrig = ctx.show('key') ? footerTag(RS.fullCopy, origBox, ow, ohh, 24, 'tag-orig', th.accent2) : null;
    const tagCopy = ctx.show('key') ? footerTag(RS.redactedCopy, copyBox, cw, chh, 26, 'tag-copy', th.ink) : null;

    // When the band effects happen (normalized time), from where the tracer is:
    //  - pen → film (bands drawn on the film) plays while the tracer runs from
    //    the pen to the film; if the traversal does not pass pen before film,
    //    it plays once the tracer has reached BOTH (the marker draws only after
    //    it has been visited), with the tracer resting there;
    //  - film → copy (bands land on the copy) plays while the tracer runs from
    //    the film to the copy, or right after the film bands otherwise.
    //    A band never lands on the copy before it exists on the film.
    const uAt = id => (visitT[id] === undefined ? null : TRACE[0] + (TRACE[1] - TRACE[0]) * Math.acos(1 - 2 * visitT[id]) / Math.PI);
    const between = (a, b) => (uAt(a) !== null && uAt(b) !== null && uAt(b) > uAt(a) ? [uAt(a), uAt(b)] : null);
    const EFFECT = 0.055;
    const reached = [uAt('pen'), uAt('film')].filter(x => x !== null);
    const filmWin = between('pen', 'film') || (() => { const a0 = reached.length ? Math.max(...reached) : TRACE[1]; return [a0, a0 + EFFECT]; })();
    const copyWin0 = between('film', 'copy');
    const copyWin = copyWin0 && copyWin0[0] >= filmWin[0] ? copyWin0 : [filmWin[1], filmWin[1] + EFFECT];
    // the tracer stays (resting on its last element) until the film bands are drawn
    const tracerEnd = Math.max(0.78, filmWin[1] + 0.01);
    const imprAt = Math.max(0.78, copyWin[1]);
    return {S, s, ox, oy, idx, copy, orig, mini, copyNode, origNode, filmNode, filmBox, filmOutC, copyC, penB, stampB, folderNode, labOrig, labCopy, labFilm, labFolder, labPen, labStamp, graph, captions, route, visitT, legend, tagOrig, tagCopy, anchored, kinds, obstacles, stampRelated, filmWin, copyWin, tracerEnd, imprAt};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      L.origNode, L.labOrig && L.labOrig.node,
      L.copyNode, L.labCopy && L.labCopy.node,
      L.folderNode, L.labFolder && L.labFolder.node,
      L.penB.node, L.labPen && L.labPen.node,
      L.stampB.node, L.labStamp && L.labStamp.node,
      L.filmNode, L.labFilm && L.labFilm.node,
      // the tracer runs along the connectors UNDER the caption chips, so a
      // caption sitting on its connector is never covered by the moving dot
      L.graph.tracerNode('tracer'),
      L.captions.node,
      L.tagOrig && L.tagOrig.node, L.tagCopy && L.tagCopy.node,
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: components appear; the film lifts out of the working copy
    const appear = seg(u, 0, 0.1);
    const lift = ease.inOutCubic(seg(u, 0.06, 0.18));
    const fp = {x: lerp(L.copyC.x, L.filmOutC.x, lift), y: lerp(L.copyC.y, L.filmOutC.y, lift)};
    const fs = lerp(1, FILM_SCALE, lift);
    for (const id of ['original', 'pen', 'stamp', 'folder']) nodes[`el-${id}`] = {opacity: r(appear, 3)};
    nodes['el-film'] = {transform: T(fp.x, fp.y, 0, fs), opacity: r(seg(u, 0.02, 0.08), 3)};
    if (L.labFilm) nodes['lab-film'] = {opacity: r(seg(u, 0.15, 0.2), 3)};
    for (const [id, lb] of [['original', L.labOrig], ['folder', L.labFolder], ['pen', L.labPen], ['stamp', L.labStamp]]) if (lb) nodes[`lab-${id}`] = {opacity: r(appear, 3)};
    // 2) relations drawn one by one
    const nRel = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / nRel, 0.18 + ((i + 1) * 0.25) / nRel));
    Object.assign(nodes, L.graph.frame(relP));
    Object.assign(nodes, L.captions.frame(relP));
    // 3) tracer along the traversal order; focus element enlarges as it passes
    const tp = seg(u, ...TRACE);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < L.tracerEnd;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    // focus pulses ease back to rest before the tracer disappears (no pop)
    const settle = 1 - seg(u, L.tracerEnd - 0.03, L.tracerEnd);
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08) * settle;
    };
    for (const id of IDS) {
      const focus = id === p.focusElement ? 0.16 : 0.06;
      const k = 1 + (reduced ? focus * 0.5 : focus) * ease.inOutSine(pulse(id));
      const pivot = id === 'copy' ? {x: L.copy.w / 2, y: L.copy.h / 2} : id === 'original' ? {x: L.orig.w / 2, y: L.orig.h / 2} : {x: 0, y: 0};
      nodes[`el-${id}-body`] = {transform: scaleAbout(pivot.x, pivot.y, k)};
    }
    // The changing parts, driven by where the tracer is (windows from layout):
    //  pen → film: bands drawn on the film; film → copy: bands land on the copy.
    const filmP = seg(u, ...L.filmWin);
    // never ahead of the film: a band lands only once it exists on the film
    const copyP = Math.min(seg(u, ...L.copyWin), filmP);
    const m = L.idx.length;
    const filmBands = [], copyBands = [];
    L.idx.forEach((i, k) => {
      const f1 = ease.inOutSine(stagger(filmP, k, m, 0, 1, 0.35));
      const f2 = ease.inOutSine(stagger(copyP, k, m, 0, 1, 0.35));
      const band = L.copy.fields[i].band;
      nodes[`film-band-${i}`] = {width: r(band.w * f1)};
      Object.assign(nodes, L.copy.bandFrame(i, band.w * f2));
      filmBands.push(r(f1, 3));
      copyBands.push(r(f2, 3));
    });
    const deliv = L.visitT.folder !== undefined ? (u >= TRACE[1] || (u >= 0.43 && tt >= L.visitT.folder) ? 1 : 0) : 0;
    nodes['folder-copy'] = {opacity: deliv};
    // the filed copy is the redacted one
    L.idx.forEach(i => Object.assign(nodes, L.mini.bandFrame(i, L.mini.fields[i].band.w)));
    // 4) gather: the copy-type stamp appears on the copy; descriptive tags
    const tagP = seg(u, 0.8, 0.88);
    const imprP = L.stampRelated && copyP >= 1 ? seg(u, L.imprAt, L.imprAt + 0.02) : 0;
    nodes['copy-impr'] = {opacity: r(0.92 * imprP, 3)};
    if (L.tagOrig) nodes['tag-orig'] = {opacity: r(tagP, 3)};
    if (L.tagCopy) nodes['tag-copy'] = {opacity: r(Math.min(tagP, seg(u, L.copyWin[1], L.copyWin[1] + 0.03)), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        film: {x: r(fp.x), y: r(fp.y)},
        filmAtGraphPosition: Math.hypot(fp.x - L.filmOutC.x, fp.y - L.filmOutC.y) < 0.5,
        filmBands,
        copyBands,
        copyBehindFilm: copyBands.every((v, k) => v <= filmBands[k] + 1e-9),
        delivered: Boolean(deliv),
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        connectorsAnchored: L.anchored,
        captionsClear: L.captions.clear,
        captions: L.captions.boxes.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
        kinds: L.kinds,
        visitOrder: L.route.visits.map(v => v.id),
        visitU: Object.fromEntries(L.route.visits.map(v => [v.id, r(TRACE[0] + (TRACE[1] - TRACE[0]) * Math.acos(1 - 2 * v.t) / Math.PI, 4)])),
        filmWindow: L.filmWin.map(x => r(x, 4)),
        copyWindow: L.copyWin.map(x => r(x, 4)),
        stampRelated: L.stampRelated,
        stampShown: imprP > 0,
        stampLines: L.copy.stampLines,
      },
    };
  },
};

/** Widest horizontal interval of [x0,x1] not covered by any box crossing the band [y0,y1]. */
function freeSpan(boxes, {y0, y1, x0, x1}) {
  const cuts = boxes.filter(b => b.y < y1 && b.y + b.h > y0).map(b => [b.x - 30, b.x + b.w + 30]).sort((a, b) => a[0] - b[0]);
  let best = {x0, x1: x0};
  let cur = x0;
  for (const [a, b] of cuts) {
    if (a > cur && Math.min(a, x1) - cur > best.x1 - best.x0) best = {x0: cur, x1: Math.min(a, x1)};
    cur = Math.max(cur, b);
  }
  if (x1 - cur > best.x1 - best.x0) best = {x0: cur, x1};
  return best;
}

/** True when point q lies on (or within 16 units outside) the element edge. */
function onEdge(e, q) {
  if (e.circle) return Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r) <= 16;
  const b = e.box;
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
  const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  const outside = Math.hypot(dx, dy);
  const inside = Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h));
  return outside > 0 ? outside <= 16 : inside <= 1;
}

function legendNode(ctx, kinds, labels, at, maxW) {
  const th = ctx.theme;
  const size = 28;
  const gap = 50;
  const items = kinds.map(k => {
    const f = ctx.fit(labels[k] || k, {maxWidth: maxW - 70, size, minSize: 20, maxLines: 1, weight: 500});
    return {k, f, w: 70 + f.width};
  });
  // wrap into rows no wider than maxW; extra rows stack upward from `at`
  const rows = [[]];
  let used = 0;
  for (const it of items) {
    const need = (rows[rows.length - 1].length ? gap : 0) + it.w;
    if (rows[rows.length - 1].length && used + need > maxW) { rows.push([]); used = 0; }
    used += (rows[rows.length - 1].length ? gap : 0) + it.w;
    rows[rows.length - 1].push(it);
  }
  const lineH = size * 1.6;
  const parts = [];
  rows.forEach((row, ri) => {
    const total = row.reduce((a, it) => a + it.w, 0) + gap * (row.length - 1);
    let x = at.x - total / 2;
    const y = at.y - (rows.length - 1 - ri) * lineH;
    for (const it of row) {
      const color = kindColor(ctx, it.k);
      const dash = it.k === 'communication' ? '10 8' : null;
      const arrow = it.k !== 'relation';
      parts.push(g({transform: T(x, y)},
        h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
        arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
        arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
        textBlock(it.f, {x: 66, y: -it.f.size * 0.45, fill: th.fg})));
      x += it.w + gap;
    }
  });
  const widest = Math.max(...rows.map(row => row.reduce((a, it) => a + it.w, 0) + gap * (row.length - 1)), 0);
  const top = at.y - (rows.length - 1) * lineH - size * 0.8;
  return {node: g({name: 'legend'}, parts), box: {x: at.x - widest / 2, y: top, w: widest, h: at.y + size * 0.8 - top}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-05-mechanism',
    title: 'Data redaction — layers and relationships',
    titleEs: 'Ocultación de datos — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Ocultación de datos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: a transparent redaction film lifts out of the working copy, keeping the same field grid. Edge-anchored connectors state each relationship by kind; as a tracer follows the traversal order, bands are drawn on the film and then land on the copy\'s selected value boxes, whose labels and boxes stay. The full copy never changes.',
    tags: ['redaction', 'mechanism', 'layers', 'exploded', 'film', 'relations', 'tracer', 'record'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/ocultacion-de-datos.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: REDACTION_STRINGS,
  scene,
});
