/**
 * LAW-0054 — Tratamiento de un caso · mechanism
 *
 * Storyboard (exploded view of the research objects; no stage, no flight):
 *  0.00–0.18  separate: the six components drift apart from a compact
 *             cluster to their places — search box, library, the found
 *             resolutions (a fanned stack of covers), the LABELS (one blank
 *             luggage tag per resolution, the focus element), the decision and
 *             the treatment card.
 *  0.18–0.43  only the supplied relationships are drawn, each with its kind:
 *             communication (dashed arrow), sequence (arrow) or plain relation
 *             (no arrowhead, end dots). Causal style only when supplied.
 *  0.43–0.75  a tracer follows the supplied traversal order along the drawn
 *             relationships. Each component it reaches changes state: the
 *             library's matching binders light up; the resolutions are marked
 *             found; the labels element enlarges and each blank tag receives
 *             its supplied text; the decision's ports light up; the card's rows
 *             are written.
 *  0.75–1.00  gather: everything stays anchored with origin (search, library),
 *             transformation (labels) and state (ports, written rows) visible.
 *             No ranking between labels and no legal effect is stated.
 * @module animations/research/LAW-0054
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mechanismFields, str} from '../../schemas/fields.js';
import {chip, statusTag, textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {roundRectPath, edgeAnchor} from '../../core/geometry.js';
import {caseFields, CASE_DEFAULTS, CASE_COLORS, caseArt, fitWhole, sharedSizeTags} from './kits/tratamiento-de-un-caso.js';

const ID = 'LAW-0054';
const DURATION = 7000;
const IDS = ['query', 'library', 'resolutions', 'labels', 'decision', 'card'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const STRINGS = {
  en: {recorded: 'Recorded as supplied', blank: 'label'},
  es: {recorded: 'Anotado según lo aportado', blank: 'etiqueta'},
};

// Component names come from `elements` (the library's plaque and the card's
// heading print their element label), so the scene has no separate objectLabels.
const sceneSchema = {
  ...caseFields,
  ...mechanismFields(IDS),
};
// relationships may carry their own caption
sceneSchema.relationships.items.properties.label = str('Caption for this relationship (defaults to the caption of its kind)', 40);

const {objectLabels: _unused, ...CASE_BASE} = CASE_DEFAULTS;
const defaultParams = {
  ...CASE_BASE,
  elements: [
    {id: 'query', label: 'Search box'},
    {id: 'library', label: 'Case library'},
    {id: 'resolutions', label: 'Later resolutions'},
    {id: 'labels', label: 'Supplied labels'},
    {id: 'decision', label: 'Decision D-104'},
    {id: 'card', label: 'Treatment card · D-104'},
  ],
  relationships: [
    {from: 'query', to: 'library', kind: 'communication', label: 'searches'},
    {from: 'library', to: 'resolutions', kind: 'relation', label: 'holds'},
    {from: 'resolutions', to: 'labels', kind: 'relation', label: 'each carries'},
    {from: 'labels', to: 'decision', kind: 'relation', label: 'refer to'},
    {from: 'decision', to: 'card', kind: 'sequence', label: 'then recorded on'},
  ],
  focusElement: 'labels',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['query', 'library', 'resolutions', 'labels', 'decision', 'card'],
};

/**
 * Component sizes per shape (design units). Positions are solved in `place`
 * from these sizes and from the relation captions, so every connector keeps a
 * visible run beside its caption (captions sit next to their line, never on
 * it) whatever texts are supplied. `text` scales the key text of the shape
 * (the square frame renders the design smaller).
 */
const PLACES = {
  landscape: {size: [2140, 1030], text: 1.04, q: [640, 112], lib: [340, 460], cov: [260, 116], dec: [320, 420], cardW: 760, labMax: 470, chipMax: 380, legend: 'top', beside: true,
    caps: {query: ['right', 'belowEnd'], resolutions: ['below', 'right', 'above'], labels: ['above', 'left', 'below'], decision: ['above', 'belowEnd', 'left', 'below']}},
  square: {size: [1420, 1100], text: 1.08, q: [560, 96], lib: [300, 360], cov: [230, 116], dec: [260, 360], cardW: 740, labMax: 440, chipMax: 260, legend: 'bottom', beside: true,
    caps: {query: ['right', 'belowEnd'], resolutions: ['rightLow', 'right', 'below'], labels: ['below', 'above', 'right'], decision: ['above', 'left', 'belowEnd']}},
  portrait: {size: [1100, 1720], text: 1, q: [660, 104], lib: [330, 400], cov: [260, 116], dec: [236, 340], cardW: 1000, labMax: 470, chipMax: 380, legend: 'bottom',
    caps: {query: ['right', 'belowEnd'], resolutions: ['above', 'right', 'below'], labels: ['below', 'above'], decision: ['right', 'above', 'below']}},
};

const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const bend = rel => (rel.kind === 'communication' ? -0.16 : 0.08);

/** Same connector geometry as frameworks/graph.js (edge anchors + cubic), sampled. */
function connectorPath(A, B, rel) {
  const from = edgeAnchor(A, center(B), 8);
  const to = edgeAnchor(B, center(A), rel.kind === 'relation' ? 8 : 14);
  const dx = to.x - from.x, dy = to.y - from.y;
  const k = bend(rel);
  const c1 = {x: from.x + dx * 0.3 - dy * k, y: from.y + dy * 0.3 + dx * k};
  const c2 = {x: from.x + dx * 0.7 - dy * k, y: from.y + dy * 0.7 + dx * k};
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, u = 1 - t;
    pts.push({x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x, y: u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y});
  }
  return {from, to, pts, len: pts.reduce((a, q, i) => (i ? a + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0), 0)};
}

/** Minimum visible run (design units) a connector keeps at each end beside its caption. */
const RUN = 50;

/** Point at arc-length fraction t of a sampled path. */
function pointAt(pts, t) {
  const seg2 = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  let target = seg2.reduce((a, b) => a + b, 0) * t;
  for (let i = 0; i < seg2.length; i++) {
    if (target <= seg2[i]) { const k = seg2[i] ? target / seg2[i] : 0; return {x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k}; }
    target -= seg2[i];
  }
  return pts[pts.length - 1];
}

/**
 * Visible run of a sampled path from its start and from its end before it
 * passes under any of the boxes, plus the visible share of its length.
 */
function runs(pts, boxes) {
  const under = q => boxes.some(b => q.x > b.x - 2 && q.x < b.x + b.w + 2 && q.y > b.y - 2 && q.y < b.y + b.h + 2);
  const d = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  const total = d.reduce((a, b) => a + b, 0) || 1;
  let a = 0;
  for (let i = 1; i < pts.length && !under(pts[i]); i++) a += d[i - 1];
  let z = 0;
  for (let i = pts.length - 2; i >= 0 && !under(pts[i]); i--) z += d[i];
  const vis = d.reduce((acc, v, i) => acc + (under(pts[i]) || under(pts[i + 1]) ? 0 : v), 0);
  return [a, z, vis / total];
}

/** Distance from a box to the nearest sampled point of a path. */
function boxToPath(b, pts) {
  return Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)))));
}

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const n = p.sources.length;
    const showKey = ctx.show('key');
    const tx = Pl.text || 1;
    const chipSize = 28 * tx;
    const chipMax = Pl.chipMax * tx;

    /* ---------- 1) content-dependent sizes ---------- */
    // labels (focus): every tag shares one size; long labels wrap (up to 3 lines) instead of shrinking
    let tags, rowH;
    for (const size of [32, 30, 28, 26, 24]) {
      tags = sharedSizeTags(sz => p.sources.map((src, i) => (src.label ? caseArt.tag(ctx, `lab-t${i}`, src.label, {size: sz, maxWidth: 340}) : null)), size * tx);
      rowH = Math.max(Math.round(size * tx * 2.3), ...tags.filter(Boolean).map(t => t.H + 16));
      if (rowH * n + 24 <= Pl.labMax * tx) break;
    }
    const tagW = Math.max(150, ...tags.filter(Boolean).map(t => t.W));
    const labSz = {w: tagW + 68, h: rowH * n + 24};
    const [cw, chh] = Pl.cov;
    const step = Math.round(chh * 0.56);
    const resSz = {w: cw, h: chh + step * (n - 1)};
    // card rows share one text size; one line each when it stays legible, else two
    const cardW = Pl.cardW;
    const rowText = src => (src.label ? `${src.citation} · ${src.label}` : src.citation);
    const fitRows = o => p.sources.map(src => fitWhole(ctx, rowText(src), {maxWidth: cardW - 70, weight: 600, ...o}));
    let rowLines = 1;
    let rowFits = fitRows({size: 30 * tx, minSize: 27 * tx, maxLines: 1});
    if (rowFits.some(f => f.truncated)) { rowLines = 2; rowFits = fitRows({size: 30 * tx, minSize: 26 * tx, maxLines: 2}); }
    const rowSize = Math.min(...rowFits.map(f => f.size));
    rowFits = fitRows({size: rowSize, minSize: rowSize, maxLines: rowLines + 1});
    const rowHs = rowFits.map(f => f.height + 16);
    const cardSz = {w: cardW, h: 96 + rowHs.reduce((a, b) => a + b, 0) + 34};
    const qSz = {w: Pl.q[0], h: Pl.q[1]};
    const libSz = {w: Pl.lib[0], h: Pl.lib[1]};
    const decSz = {w: Pl.dec[0], h: Pl.dec[1]};

    // relation captions (as relationGraph draws them) and element captions, measured
    const relText = rel => rel.label || p.relationLabels[rel.kind] || rel.kind;
    const relBetween = (a, b) => p.relationships.find(x => (x.from === a && x.to === b) || (x.from === b && x.to === a));
    const relChip = (a, b) => {
      const rel = relBetween(a, b);
      if (!rel || !ctx.show('all')) return {w: 0, h: 0};
      const c = chip(ctx, relText(rel), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: chipSize, maxLines: 2, weight: 600});
      return {w: c.box.w, h: c.box.h};
    };
    // horizontal neighbours: the caption sits above/below the line inside the gap;
    // vertical neighbours: the caption may sit on the line when a visible run of
    // at least RUN is left on both sides (relationGraph hangs a chip from
    // 0.95·size above the midpoint, so a two-line chip reaches further down)
    const gapH = (a, b, min = 170) => Math.max(min, relChip(a, b).w + 50);
    // (`beside` shapes keep vertical gaps short: their captions always sit beside the line)
    const gapV = (a, b, min = 130) => {
      const c = relChip(a, b);
      if (!c.h) return min;
      const half = Math.max(c.h - 0.95 * chipSize, 0.95 * chipSize);
      return Math.max(min, Pl.beside ? 2 * half + 44 : 2 * (half + RUN + 4) + 22);
    };
    const cap = (id, x, y, anchor = 'middle', max = 320, name = `cap-${id}`) => (showKey && label(id) ? chip(ctx, label(id), {x, y, anchor, maxWidth: max, size: 30 * tx, maxLines: 3, name}) : null);
    const capH = (id, max = 320) => { const c = cap(id, 0, 0, 'middle', max); return c ? c.box.h : 0; };
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legendSize = 28 * tx;

    /* ---------- 2) positions ---------- */
    const B = {};
    let S = {w: Pl.size[0], h: Pl.size[1]};
    const legendBand = ctx.show('all') ? legendSize * 2 + 16 : 0;
    if (shape === 'landscape') {
      // zigzag: search ↓ library → stack ↗ labels → decision ↓ card
      const top = 34 + legendBand;
      B.query = {x: 90, y: 40, ...qSz};
      B.library = {x: 60, y: 330, ...libSz};
      B.resolutions = {x: B.library.x + B.library.w + gapH('library', 'resolutions'), y: 0, ...resSz};
      // the labels stay right of the stack (the design widens when the texts need it)
      const decX = Math.max(S.w - 80 - decSz.w, B.resolutions.x + B.resolutions.w + gapH('resolutions', 'labels', 60) + labSz.w + gapH('labels', 'decision'));
      B.decision = {x: decX, y: Math.max(150, top + capH('decision') + 18), ...decSz};
      B.labels = {x: B.decision.x - gapH('labels', 'decision') - labSz.w, y: 0, ...labSz};
      const underQuery = B.labels.x < B.query.x + B.query.w + 40;
      B.labels.y = Math.max(top + capH('labels') + 30, underQuery ? B.query.y + B.query.h + 60 : 0, B.decision.y + B.decision.h * 0.42 - labSz.h / 2);
      const overRes = B.labels.x < B.resolutions.x + B.resolutions.w + 40;
      B.resolutions.y = Math.max(overRes ? B.labels.y + B.labels.h + gapV('resolutions', 'labels', 110) : 0, 720 - resSz.h / 2);
      const cx0 = Math.max(B.resolutions.x + B.resolutions.w + 120, B.decision.x + B.decision.w - cardSz.w - 160);
      B.card = {x: cx0, y: 0, ...cardSz};
      const overDec = hit({...B.card, y: B.decision.y, h: B.decision.h}, B.decision, 0);
      const overLab = hit({...B.card, y: B.labels.y, h: B.labels.h}, B.labels, 0);
      B.card.y = Math.max(overDec ? B.decision.y + B.decision.h + gapV('decision', 'card', 150) : B.decision.y + B.decision.h * 0.7, overLab ? B.labels.y + B.labels.h + 70 : 0);
      S = {w: Math.max(S.w, B.decision.x + B.decision.w + 80), h: Math.max(S.h, B.card.y + B.card.h + 76, B.resolutions.y + B.resolutions.h + capH('resolutions') + 40)};
    } else if (shape === 'square') {
      // clockwise loop: search → library → stack (left column) → labels (centre)
      // → decision (top right) → wide card (bottom right); legend at the bottom
      const top = 30;
      B.query = {x: 40, y: 16, ...qSz};
      B.library = {x: 110, y: B.query.y + B.query.h + gapV('query', 'library', 140), ...libSz};
      B.resolutions = {x: 120, y: B.library.y + B.library.h + gapV('library', 'resolutions', 120), ...resSz};
      B.labels = {x: 0, y: 0, ...labSz};
      B.decision = {x: 0, y: Math.max(160, top + capH('decision') + 18), ...decSz};
      // the search box caption sits right of the bar: the labels (and their caption) start below it
      const qCapH = capH('query', 330);
      const lx0 = B.library.x + B.library.w + gapH('library', 'labels', 90);
      B.decision.x = Math.max(S.w - 50 - decSz.w, lx0 + labSz.w + gapH('labels', 'decision', 150));
      const lx1 = B.decision.x - gapH('labels', 'decision', 150);
      B.labels.x = Math.max(lx0, lx1 - labSz.w - 20);
      // (the labels caption hangs under the panel)
      B.labels.y = Math.max(B.query.y + Math.max(B.query.h, qCapH + 20) + 40, B.decision.y + B.decision.h * 0.5 - labSz.h / 2);
      const W2 = B.decision.x + B.decision.w + 50;
      B.card = {x: W2 - 20 - cardSz.w, y: 0, ...cardSz};
      B.card.y = Math.max(B.decision.y + B.decision.h + gapV('decision', 'card', 150), hit({...B.card, y: B.labels.y}, B.labels, 20) ? B.labels.y + B.labels.h + capH('labels') + 44 : 0);
      B.resolutions.y = Math.max(B.resolutions.y, B.labels.y + B.labels.h + gapV('resolutions', 'labels', 110) * 0.6);
      S = {w: Math.max(S.w, W2), h: Math.max(S.h, Math.max(B.card.y + B.card.h + 56, B.resolutions.y + B.resolutions.h + 16) + legendBand + 16)};
    } else {
      // zigzag: search ↓ library → stack ↙ labels → decision ↓ card (full width)
      B.query = {x: 40, y: 30, ...qSz};
      B.library = {x: 40, y: B.query.y + B.query.h + gapV('query', 'library', 120), ...libSz};
      B.resolutions = {x: 0, y: 0, ...resSz};
      B.resolutions.x = Math.min(S.w - 60 - resSz.w, Math.max(B.library.x + B.library.w + gapH('library', 'resolutions'), 700 - resSz.w / 2));
      B.resolutions.y = Math.max(B.library.y + B.library.h / 2 - resSz.h / 2, B.query.y + B.query.h + capH('resolutions', 340) + 40);
      B.labels = {x: 40, y: Math.max(B.library.y + B.library.h, B.resolutions.y + B.resolutions.h) + gapV('resolutions', 'labels', 130), ...labSz};
      B.decision = {x: 0, y: 0, ...decSz};
      B.decision.x = Math.min(S.w - 70 - decSz.w, B.labels.x + B.labels.w + gapH('labels', 'decision'));
      B.decision.y = Math.max(B.resolutions.y + B.resolutions.h + capH('decision', 300) + 40, B.labels.y + B.labels.h / 2 - decSz.h / 2);
      B.card = {x: (S.w - cardSz.w) / 2, y: 0, ...cardSz};
      B.card.y = Math.max(B.decision.y + B.decision.h + gapV('decision', 'card'), B.labels.y + B.labels.h + capH('labels', 400) + 44);
      S = {w: S.w, h: Math.max(S.h, B.card.y + B.card.h + 60 + legendBand + 20)};
    }
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const centreOf = id => center(B[id]);

    /* ---------- 3) component art ---------- */
    // search box (query already typed: it is a component, not an action here)
    const qBox = B.query;
    const bar = caseArt.searchBar(ctx, 'q', qBox, p.query, null, 1.12 * tx, 2);
    const qMag = caseArt.magnifier(ctx, 'q-mag', 44);
    const qNode = g(null, bar.node, g({transform: T(bar.socket.x, bar.socket.y, 0, (qBox.h * 0.36) / 44)}, qMag));
    const barFrame = bar.frame(1);

    // library (mini bookcase) with the matching binders
    const lBox = B.library;
    const lib = caseArt.bookcase(ctx, 'lib', lBox, 3, n + 1, label('library'), 'case-mech');
    // the mini bookcase is too small for a legible spine citation: label windows stay blank
    // (the matching binders are identified by their highlight when the tracer reaches them)
    const binders = lib.binders.map((b, i) => g({transform: T(b.x, b.y)}, caseArt.spine(ctx, b.w, b.h, '', i < n ? `lib-b${i}` : null)));

    // resolutions: a fanned stack of covers
    const rBox = B.resolutions;
    const covers = p.sources.map((src, i) => {
      const cx = rBox.x + cw / 2;
      const cy = rBox.y + chh / 2 + i * step;
      return g({transform: T(cx, cy)},
        h('path', {name: `res-found${i}`, d: roundRectPath(-cw / 2 - 8, -chh / 2 - 8, cw + 16, chh + 16, 12), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
        // fanned: each cover hides the lower part of the previous one, so only
        // citations are printed (dates stay on the story / inspect covers)
        caseArt.cover(ctx, `res-cv${i}`, cw, chh, src.citation, '', 1).node);
    });

    // labels (focus): one tag per resolution, threaded on its own short string
    const labBox = B.labels;
    const lab = centreOf('labels');
    const labRows = p.sources.map((src, i) => {
      const y = labBox.y + 12 + rowH * (i + 0.5);
      const hx = lab.x - tagW / 2 + 20;
      return g(null,
        h('line', {x1: labBox.x + 6, x2: labBox.x + labBox.w - 6, y1: y, y2: y, stroke: CASE_COLORS.string, 'stroke-width': 3, 'stroke-linecap': 'round'}),
        g({transform: T(hx, y)}, caseArt.ghost(ctx, `lab-gh${i}`, tags[i] ? tags[i].W : 150, {x: 0, y: 0}, 0, 1, th.inkSoft, tags[i] ? tags[i].H : 46)),
        tags[i] ? g({name: `lab-tw${i}`, transform: T(hx, y), opacity: 0}, tags[i].node) : null);
    });
    const labPanel = h('path', {d: roundRectPath(labBox.x, labBox.y, labBox.w, labBox.h, 18), fill: th.card, stroke: th.ink, 'stroke-width': 2.5});

    // decision
    const dBox = B.decision;
    const dc = centreOf('decision');
    const dec = caseArt.decisionDoc(ctx, 'dec', {cx: dc.x, cy: dc.y, w: dBox.w, h: dBox.h}, p.decision, 1);

    // treatment card: one row per resolution (citation · label), written on
    const cBox = B.card;
    const card = caseArt.card(ctx, 'card', cBox, label('card'), 0.95 * tx, 0.92);
    let yAcc = cBox.y + 84 + 14;
    const cardRows = p.sources.map((src, i) => {
      const y = yAcc;
      yAcc += rowHs[i];
      const cid = `card-row${i}`;
      const f = rowFits[i];
      return g(null,
        h('defs', null, h('clipPath', {id: ctx.id(cid)}, h('rect', {name: `${cid}-clip`, x: cBox.x + 20, y: y - 2, width: 0, height: rowHs[i]}))),
        g({'clip-path': ctx.ref(cid)},
          showKey ? textBlock(f, {x: cBox.x + 34, y: y + 6, fill: th.ink}) : h('rect', {x: cBox.x + 34, y: y + 10, width: cardW * 0.6, height: 12, rx: 6, fill: th.inkSoft, opacity: 0.6})));
    });
    const recTag = showKey ? statusTag(ctx, ctx.t.recorded, {x: cBox.x + cBox.w, y: cBox.y + cBox.h + 12, anchor: 'end', size: 28 * tx, maxWidth: cardW - 40, name: 'tag-recorded', color: th.accent4, opacity: 0}) : null;

    /* ---------- 4) connectors, legend, captions ---------- */
    const elements = Object.fromEntries(IDS.map(id => [id, {box: B[id]}]));
    const paths = p.relationships.map(rel => connectorPath(B[rel.from], B[rel.to], rel));
    // every connector is an obstacle for every caption: captions sit beside lines, never on them
    // a caption may sit on its own line only when that line stays visible for RUN
    // units on both sides of it; otherwise the line is an obstacle and the caption
    // is placed beside it (a short dotted leader ties it to the line)
    const chipOnLine = (rel, pa) => {
      const c = relChip(rel.from, rel.to);
      if (!c.w) return null;
      const m = pointAt(pa.pts, 0.5);
      return {x: m.x - c.w / 2, y: m.y - chipSize * 0.95, w: c.w, h: c.h};
    };
    const blocking = p.relationships.map((rel, i) => {
      const b = chipOnLine(rel, paths[i]);
      if (!b) return false;
      const [a, z] = runs(paths[i].pts, [b]);
      return Math.min(a, z) < RUN;
    });
    const allPathBoxes = paths.map(pa => pa.pts.slice(2, -2).map(q => ({x: q.x - 6, y: q.y - 6, w: 12, h: 12})));
    const pathBoxes = allPathBoxes.flat();
    const blockBoxes = allPathBoxes.filter((_, i) => blocking[i]).flat();
    const legendAt = Pl.legend === 'bottom' ? {x: S.w / 2, y: S.h - legendSize - 10} : {x: S.w, y: 40};
    const legendG = ctx.show('all') ? legendNode(ctx, kinds, p.relationLabels, legendAt, legendSize, S.w) : null;
    const tapes = [{x: cBox.x - 16, y: cBox.y - 24, w: 100, h: 48}, {x: cBox.x + cBox.w - 84, y: cBox.y - 24, w: 100, h: 48}];
    const fixed = [...Object.values(B), recTag && recTag.box, legendG && legendG.box, ...tapes].filter(Boolean);
    const inside = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= S.w - 8 && b.y + b.h <= S.h - 8;
    const caps = {library: null, card: null}; // printed on the bookcase plaque and as the card heading
    const placedCaps = [];
    const capAt = (id, side) => {
      const b = B[id];
      const gap = 14;
      const sideMax = sd => (sd === 'left' ? Math.min(330, b.x - 20) : sd === 'right' ? Math.min(330, S.w - (b.x + b.w) - 20) : 340);
      const max = Math.max(160, sideMax(side));
      const probe = cap(id, 0, 0, 'middle', max);
      if (!probe) return null;
      const {w, h: hh} = probe.box;
      const pos = {
        above: [b.x + b.w / 2, b.y - gap - hh, 'middle'], below: [b.x + b.w / 2, b.y + b.h + gap, 'middle'],
        belowEnd: [b.x + b.w, b.y + b.h + gap, 'end'], belowStart: [b.x, b.y + b.h + gap, 'start'],
        left: [b.x - gap, Math.max(10, b.y + b.h / 2 - hh / 2 - 20), 'end'], right: [b.x + b.w + gap, Math.max(10, b.y + b.h / 2 - hh / 2 - 20), 'start'],
        rightLow: [b.x + b.w + gap, b.y + b.h - hh, 'start'],
      }[side];
      void w;
      return cap(id, pos[0], pos[1], pos[2], max);
    };
    for (const id of ['query', 'resolutions', 'labels', 'decision']) {
      const cands = (Pl.caps[id] || ['below']).map(sd => capAt(id, sd)).filter(Boolean);
      if (!cands.length) { caps[id] = null; continue; }
      const cost = c => (inside(c.box) ? 0 : 1e6) + [...fixed, ...placedCaps].reduce((a, q) => a + (hit(c.box, q, 10) ? 1000 : 0), 0)
        + allPathBoxes.reduce((a, pb) => a + (pb.some(q => hit(c.box, q, 4)) ? 300 : 0), 0);
      const best = cands.reduce((a, c) => (cost(c) < cost(a) ? c : a));
      caps[id] = best;
      placedCaps.push(best.box);
    }
    const capBoxes = Object.values(caps).filter(Boolean).map(c => c.box);
    const obstacles = [...capBoxes, recTag && recTag.box, legendG && legendG.box, ...tapes, ...blockBoxes].filter(Boolean);
    const graph = relationGraph(ctx, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize, chipMax, obstacles, separateLabels: true,
      bounds: {x: 0, y: 0, w: S.w, h: S.h}, bend});
    const route = graph.route(p.traversalOrder);
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    // decision ports: on the edge that faces the relation arriving from the labels
    // (else the first relation touching the decision); that relation lands on a port
    const portRel = graph.conns.find(x => (x.rel.to === 'decision' && x.rel.from === 'labels') || (x.rel.from === 'decision' && x.rel.to === 'labels'))
      || graph.conns.find(x => x.rel.to === 'decision') || graph.conns.find(x => x.rel.from === 'decision');
    const land = portRel ? (portRel.rel.to === 'decision' ? portRel.c.to : portRel.c.from) : {x: dBox.x - 8, y: dc.y};
    const dists = {left: Math.abs(land.x - dBox.x), right: Math.abs(land.x - (dBox.x + dBox.w)), top: Math.abs(land.y - dBox.y), bottom: Math.abs(land.y - (dBox.y + dBox.h))};
    const edge = Object.keys(dists).reduce((a, k2) => (dists[k2] < dists[a] ? k2 : a));
    const vertEdge = edge === 'left' || edge === 'right';
    const along = vertEdge ? land.y : land.x;
    const lo = (vertEdge ? dBox.y : dBox.x) + 30, hi = (vertEdge ? dBox.y + dBox.h : dBox.x + dBox.w) - 30;
    const pstep = n > 1 ? Math.min(42, (hi - lo) / (n - 1)) : 0;
    const mid = Math.floor((n - 1) / 2);
    // the middle port sits exactly where the relation lands; the strip stays on the edge
    const shift = Math.min(0, hi - (along + (n - 1 - mid) * pstep)) + Math.max(0, lo - (along - mid * pstep));
    const portAt = i => {
      const a = along + (i - mid) * pstep + shift;
      const e = edge === 'left' ? dBox.x : edge === 'right' ? dBox.x + dBox.w : edge === 'top' ? dBox.y : dBox.y + dBox.h;
      return vertEdge ? {x: e, y: a} : {x: a, y: e};
    };
    const portPts = p.sources.map((_, i) => portAt(i));
    const stripA = portPts[0], stripB = portPts[n - 1];
    const portStrip = h('path', {d: vertEdge
      ? roundRectPath(stripA.x - 7, stripA.y - 16, 14, stripB.y - stripA.y + 32, 7)
      : roundRectPath(stripA.x - 16, stripA.y - 7, stripB.x - stripA.x + 32, 14, 7), fill: CASE_COLORS.string, opacity: 0.85});
    const ports = portPts.map((q, i) => h('circle', {name: `dec-port${i}`, cx: q.x, cy: q.y, r: 9, fill: CASE_COLORS.tag, stroke: th.ink, 'stroke-width': 2, opacity: 0.25}));
    const portLanding = r(Math.min(...portPts.map(q => Math.hypot(q.x - land.x, q.y - land.y))), 1);

    // connector end → element edge distances (acceptance: every connector lands on its element)
    const edgeDist = (pt, b) => Math.hypot(Math.max(b.x - pt.x, 0, pt.x - (b.x + b.w)), Math.max(b.y - pt.y, 0, pt.y - (b.y + b.h)));
    const ends = graph.conns.map(x => ({from: r(edgeDist(x.c.from, B[x.rel.from]), 1), to: r(edgeDist(x.c.to, B[x.rel.to]), 1)}));
    // every relation caption sits beside its own line (close, not on any line) and clear of the others
    const chipBoxes = graph.conns.map(x => x.lab && x.lab.box);
    const chipGaps = graph.conns.map((x, i) => (x.lab ? r(boxToPath(x.lab.box, paths[i].pts), 1) : null));
    // visible run of every connector at its start and end, and its visible share,
    // with all relation captions and element captions drawn over it
    const covers2 = [...chipBoxes.filter(Boolean), ...capBoxes];
    const connectorRuns = paths.map(pa => runs(pa.pts, covers2).map(v => r(v)));
    const chipsOffLines = chipBoxes.every((b, i) => !b || paths.every((pa, j) => j === i || boxToPath(b, pa.pts.slice(1, -1)) >= 3));
    const chipsClear = chipBoxes.every((b, i) => !b || (![...Object.values(B), ...capBoxes, legendG && legendG.box, recTag && recTag.box].filter(Boolean).some(q => hit(b, q, 2))
      && !chipBoxes.some((c, j) => j !== i && c && hit(b, c, 2))));
    const connectorLengths = paths.map(pa => r(pa.len));

    const groups = {
      query: {node: qNode, box: qBox},
      library: {node: g(null, lib.node, binders), box: lBox},
      resolutions: {node: g(null, covers), box: rBox},
      labels: {node: g(null, labPanel, labRows), box: labBox},
      decision: {node: g(null, dec.node, portStrip, ports), box: dBox},
      card: {node: g(null, card.node, cardRows), box: cBox},
    };
    // at its largest focus pulse every element keeps its caption clear of its own body
    const grow = (b, k) => ({x: b.x + b.w / 2 - (b.w * k) / 2, y: b.y + b.h / 2 - (b.h * k) / 2, w: b.w * k, h: b.h * k});
    const capsClearAtPulse = Object.entries(caps).filter(([, c]) => c).every(([id, c]) => {
      const k = 1 + (id === p.focusElement ? 0.2 : 0.06);
      const b = B[id];
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const moved = {x: c.box.x + (c.box.cx - cx) * (k - 1), y: c.box.y + (c.box.cy - cy) * (k - 1), w: c.box.w, h: c.box.h};
      return !hit(moved, grow(b, k));
    });
    const centre = {x: S.w / 2, y: S.h / 2};
    return {S, s, ox, oy, groups, caps, graph, route, visitT, legend: legendG && legendG.node, recTag, ends, n, centre, tags, cardW, barFrame, capsClearAtPulse,
      chipGaps, chipsOffLines, chipsClear, connectorLengths, connectorRuns, portLanding, portEdge: edge};
  },
  build(ctx, L) {
    const el = id => {
      const G = L.groups[id];
      // the caption stays outside the scaled body so the focus pulse never pushes it into a neighbour
      return g({name: `el-${id}`, opacity: 0}, g({name: `el-${id}-body`}, G.node), L.caps[id] && g({name: `el-${id}-cap`}, L.caps[id].node));
    };
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      // the tracer runs on the connectors and passes under the components and
      // the relation captions, so it never blots their text
      L.graph.tracerNode('tracer'),
      IDS.map(el),
      L.recTag && L.recTag.node,
      L.graph.labelsNode,
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {...L.barFrame};
    const reduced = ctx.reduced;
    const n = L.n;
    // 1) separate: components drift out of a compact cluster to their places
    const sep = ease.outCubic(seg(u, 0.02, 0.17));
    for (const id of IDS) {
      const G = L.groups[id];
      const c = {x: G.box.x + G.box.w / 2, y: G.box.y + G.box.h / 2};
      const off = {x: (L.centre.x - c.x) * 0.22 * (1 - sep), y: (L.centre.y - c.y) * 0.22 * (1 - sep)};
      nodes[`el-${id}`] = {opacity: r(seg(u, 0, 0.1), 3), transform: T(off.x, off.y)};
    }
    // 2) relations drawn one by one
    const nr = p.relationships.length;
    const drawn = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.24) / nr, 0.18 + ((i + 1) * 0.24) / nr));
    Object.assign(nodes, L.graph.frame(drawn));
    // 3) tracer along the traversal order; reached components change state
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.77;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const reached = id => (L.visitT[id] === undefined ? 0 : u >= 0.74 ? 1 : tracerOn ? clamp((tt - L.visitT[id]) / 0.05) : 0);
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.09);
    };
    for (const id of IDS) {
      const G = L.groups[id];
      const c = {x: G.box.x + G.box.w / 2, y: G.box.y + G.box.h / 2};
      const k = id === p.focusElement ? 0.2 : 0.06;
      const sc = 1 + (reduced ? k * 0.5 : k) * ease.inOutSine(pulse(id));
      nodes[`el-${id}-body`] = {transform: scaleAbout(c.x, c.y, sc)};
      // the caption (not scaled, stays legible) moves out with the growing edge
      const cp = L.caps[id];
      if (cp) nodes[`el-${id}-cap`] = {transform: T(r((cp.box.cx - c.x) * (sc - 1), 2), r((cp.box.cy - c.y) * (sc - 1), 2))};
    }
    const rLib = reached('library'), rRes = reached('resolutions'), rLab = reached('labels'), rDec = reached('decision'), rCard = reached('card');
    for (let i = 0; i < n; i++) {
      const st = (x, i2) => clamp(x * n - i2 * 0.6);
      nodes[`lib-b${i}-hl`] = {opacity: r(clamp(rLib * 1.5), 3)};
      nodes[`res-found${i}`] = {opacity: r(clamp(rRes * 1.5), 3)};
      if (L.tags[i]) {
        const f = st(rLab, i);
        nodes[`lab-tw${i}`] = {opacity: r(f, 3)};
        Object.assign(nodes, L.tags[i].frame(1));
        nodes[`lab-gh${i}`] = {opacity: r(1 - f, 3)};
      } else nodes[`lab-gh${i}`] = {opacity: 1};
      nodes[`dec-port${i}`] = {opacity: r(p.sources[i].label ? lerp(0.25, 1, st(rDec, i)) : 0.25, 3)};
      nodes[`card-row${i}-clip`] = {width: r((L.cardW - 30) * ease.inOutSine(st(rCard, i)))};
    }
    // 4) gather: descriptive state tag on the card
    if (L.recTag) nodes['tag-recorded'] = {opacity: r(seg(u, 0.8, 0.88) * (rCard >= 1 ? 1 : 0), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const filled = p.sources.filter((src, i) => src.label && clamp(rLab * n - i * 0.6) >= 1).length;
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        separated: r(sep, 3),
        relationsDrawn: p.relationships.map((_, i) => r(drawn(i), 3)),
        visitOrder: L.route.visits.map(v => v.id),
        labelsFilled: filled,
        rowsWritten: p.sources.filter((_, i) => clamp(rCard * n - i * 0.6) >= 1).length,
        bindersLit: rLib >= 1,
        focus: p.focusElement,
        focusScale: r(1 + 0.2 * ease.inOutSine(pulse(p.focusElement)), 3),
        connectorEnds: L.ends,
        connectorLengths: L.connectorLengths,
        chipGaps: L.chipGaps,
        connectorRuns: L.connectorRuns,
        chipsOffLines: L.chipsOffLines,
        chipsClear: L.chipsClear,
        portLanding: L.portLanding,
        portEdge: L.portEdge,
        capsClearAtPulse: L.capsClearAtPulse,
        kinds: p.relationships.map(x => x.kind),
        arrowheads: p.relationships.map(x => Boolean(LINK_STYLES[x.kind].arrow)),
      },
    };
  },
};

function legendNode(ctx, kinds, labels, at0, size = 28, maxX = Infinity) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const gap = 50;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  // keep the whole legend inside the design space
  const at = {x: Math.max(total / 2 + 12, Math.min(at0.x, maxX - total / 2 - 12)), y: at0.y};
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return {node: g({name: 'legend'}, parts), box: {x: at.x - total / 2 - 10, y: at.y - size, w: total + 20, h: size * 2}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-04-mechanism',
    title: 'Case treatment — components and supplied links',
    titleEs: 'Tratamiento de un caso — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Tratamiento de un caso',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: search box, library, later resolutions, the supplied labels, the decision and the treatment card, linked only by the supplied relationships (styled by kind; plain relations carry no arrowhead). A tracer follows the traversal order; the labels element enlarges and receives the supplied texts; the decision’s ports light up and the card rows are written.',
    tags: ['case treatment', 'mechanism', 'exploded', 'relations', 'tracer', 'labels', 'library', 'index card'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/tratamiento-de-un-caso.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
