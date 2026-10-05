/**
 * LAW-0380 — Inventario de objetos · inspect
 *
 * Storyboard (the state produced by the inventory: a compartment rack whose cells already hold the fictional objects,
 * each cell's manila tag on its ball chain written with an entry reference, and the clipboard list; a plain line joins
 * each tag to the row whose reference it carries; a legend lists objects, custodians, times, the before/after datum,
 * the marker label and the key):
 *  0.00–0.20  context: the finished inventory at rest.
 *  0.20–0.45  a lens opens on the focus cell's tag, its line and the list rows around it — a real enlarged copy drawn
 *             at the context's coordinates; the context copy of the tag reference is hidden while the lens holds it.
 *  0.45–0.75  one datum is substituted (`beforeValue` → `afterValue`): the old reference lifts away (a small
 *             "before" trace stays), the new one is written, and only its dependent geometry changes — the line leaves
 *             the old row and is redrawn to the row carrying the new reference, or is not redrawn when no row carries
 *             it (as supplied). The new value holds still.
 *  0.75–1.00  the lens closes, the context shows the new reference and line with the changed-datum Δ marker. No
 *             validity, responsibility or outcome is inferred; seeking back restores the old datum exactly.
 * @module animations/evidence-custody/LAW-0380
 */
import {defineAnimation} from '../../core/define.js';
import {measure} from '../../core/text.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r, ease, lerp} from '../../core/time.js';
import {str, int, obj, num, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {localised, benchNode, panelLayout, fitG, textAt, WRITE_INK, INK, R2} from './kits/evidence-art.js';
import {
  ioFields, IO_EN, IO_ES, IO_LABELS_EN, IO_LABELS_ES, ioLabelFields, composeScene, stationNodes, stationProps,
  legendNodes, linkLine,
} from './kits/inventario-objetos.js';

const ID = 'LAW-0380';
const DURATION = 8000;
const W = {stepOut: [0.1, 0.2], stepBack: [0.85, 0.91], open: [0.2, 0.32], lift: [0.45, 0.51], unlink: [0.46, 0.54], trace: [0.5, 0.56], write: [0.54, 0.62], relink: [0.58, 0.68], close: [0.75, 0.85], marker: [0.89, 0.94]};

const OWN_EN = {
  labels: IO_LABELS_EN,
  focusTarget: 'tagReference',
  focusItem: 2,
  beforeValue: 'No. 2',
  afterValue: 'No. 4',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Finished inventory: each tag carries the reference of one list row', marker: 'Changed datum'},
  noMatch: 'no row on the list carries this reference (as supplied)',
  beforeLabel: 'before',
};
const OWN_ES = {
  labels: IO_LABELS_ES,
  focusTarget: 'tagReference',
  focusItem: 2,
  beforeValue: 'N.º 2',
  afterValue: 'N.º 4',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Inventario terminado: cada etiqueta lleva la referencia de una fila', marker: 'Dato cambiado'},
  noMatch: 'ninguna fila del listado lleva esta referencia (según lo aportado)',
  beforeLabel: 'antes',
};
const EN = {...IO_EN, ...OWN_EN};
const ES = {...IO_ES, ...OWN_ES};
/** Spanish defaults (used by the baseline-es preset). */
export const ES_PARAMS = ES;

const sceneSchema = {
  ...ioFields,
  ...ioLabelFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the entry reference written on the focus cell\'s tag (its line follows the row carrying that reference)', ['tagReference']),
  focusItem: int('Which cell (1 = top) is inspected', 1, 5),
  beforeValue: str('Reference on the tag before the substitution', 18),
  afterValue: str('Reference on the tag after the substitution (the alternative datum)', 18),
  detailGeometry: obj('Lens geometry', {zoom: num('Preferred magnification of the lens', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
  noMatch: str('Words shown when no list row carries the tag\'s reference', 80),
  beforeLabel: str('Word printed before the old value\'s trace', 16),
};
const defaultParams = {...EN};

const rowFor = (P, v) => (String(v || '').trim() ? P.records.findIndex(rw => rw.field === v && String(rw.value || '').trim()) : -1);

function legendRows(ctx, P, k, after) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showAll) rows.push({kind: 'heading', text: P.contextLabels.context, name: 'ctx'});
  if (showAll) P.items.forEach((it, i) => rows.push({kind: 'item', icon: `item-${it.kind}`, text: `${it.id} — ${it.label}`, name: `lg-item${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) rows.push({kind: 'state', text: `${P.contextLabels.marker}: ${P.beforeValue} → ${P.afterValue}${after < 0 ? ` · ${P.noMatch}` : ''}`, name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const n = P.items.length;
    const k = Math.min(n, P.focusItem) - 1;
    const before = rowFor(P, P.beforeValue), after = rowFor(P, P.afterValue);
    // rows: the list as supplied; the focus tag carries before/after instead of its own row's reference
    const texts = P.items.map((_, i) => { const rw = P.records[i]; return rw && String(rw.value || '').trim() ? `${rw.field}: ${rw.value}` : null; });
    // the station and legend are composed in a reduced design box so the lens always has a free side (right on wide
    // and square frames, bottom on tall ones); the lens may still overlap the dimmed legend
    const tallF = ctx.view.shape === 'portrait';
    const C = composeScene(ctx, {n, texts, title: null, rows: () => legendRows(ctx, P, k, after), noBag: true, tagText: ctx.show('key'), noExpand: true, sheetFrac: [0.4, 0.5, 0.6], minS: 30, maxS: 170, tagTextW: ctx.show('key') ? (sz => Math.max(0, ...[...P.records.map(rw => rw.field), P.beforeValue, P.afterValue].map(t => measure(String(t || ''), Math.max(17, sz), 700)))) : null}, panelLayout);
    const G = C.st.G, SF = C.st.SF;
    const X = v => C.ox + v, Y = v => C.oy + v;
    const linked = P.items.map((_, i) => i !== k && Boolean(texts[i]));
    const tagFit = v => (ctx.show('key') && String(v || '').trim() ? fitG(v, {maxWidth: G.tagW * 0.62, size: Math.max(17, Math.min(C.F, G.tagH * 0.5)), minSize: 17, maxLines: 1, weight: 700}) : null);
    const tagFits = P.items.map((_, i) => (linked[i] ? tagFit(P.records[i].field) : null));
    const mk = pref => stationNodes(ctx, G, {prefix: pref, ox: C.ox, oy: C.oy, kinds: P.items.map(it => it.kind), SF, tagFits, showText: ctx.show('key'), tagWritable: P.items.map(() => false), noBag: true});
    const N = mk('st'), NL = mk('lz');
    const fb = tagFit(P.beforeValue), fa = tagFit(P.afterValue);
    const TG = N.TG;
    const t = G.tags[k];
    const a = (t.angle * Math.PI) / 180;
    const tip = {x: X(t.hole.x) + Math.cos(a) * (TG.x1 + 4), y: Y(t.hole.y) + Math.sin(a) * (TG.x1 + 4)};
    const badge = i => ({x: X(G.sheet.x) + 14, y: Y(G.rows[i].y)});
    // lens source: the focus tag, its line and two whole list rows (focus + neighbour)
    // (the crop stops before the row text starts, so no row text is ever cut by the rim)
    const sx0 = X(G.cells[k].x + G.cells[k].w) - 4;
    // two whole row bands (the focus row and a neighbour) so the lens is tall enough to be a real inspection window
    const k2 = k + 1 < n ? k + 1 : k - 1;
    const r0 = Math.max(0, Math.min(k, k2)), r1 = Math.max(k, k2, 0);
    let src = {x: sx0, y: Y(G.rows[r0].top), w: X(G.sheet.x) + 14 + N.badgeR * 2 + 6 - sx0, h: G.rows[r1].top + G.rows[r1].h - G.rows[r0].top};
    const {w: DW, h: DH} = ctx.design;
    const gap = 18;
    // while the lens is open the context steps aside (scaled about its corner into one part of the frame); at rest
    // and in the hold it fills its full composition. Its text never drops below ~17.5 px.
    const B0 = C.bench;
    const reg = tallF ? {x: 0, y: 0, w: DW, h: DH * 0.5} : {x: 0, y: 0, w: DW * 0.56, h: DH};
    const sMin = Math.min(1, 17.5 / C.F);
    const sc = Math.min(1, Math.max(sMin, Math.min(reg.w / B0.w, reg.h / B0.h)));
    const step = {s: sc, x: reg.x - B0.x * sc + (tallF ? (reg.w - B0.w * sc) / 2 : 0), y: reg.y - B0.y * sc + (tallF ? 0 : (reg.h - B0.h * sc) / 2)};
    const srcRest = src;
    src = {x: step.x + srcRest.x * sc, y: step.y + srcRest.y * sc, w: srcRest.w * sc, h: srcRest.h * sc};
    // lens floor in design units: smaller side >= 36 % of the FRAME's short side (rendered px)
    const kpx = Math.min(ctx.view.content.w / DW, ctx.view.content.h / DH);
    const need = (0.36 * Math.min(ctx.view.width, ctx.view.height)) / kpx;
    const regions = {
      right: {x: src.x + src.w + gap, y: 4, w: DW - (src.x + src.w + gap) - 4, h: DH - 8},
      left: {x: 4, y: 4, w: src.x - gap - 4, h: DH - 8},
      bottom: {x: 4, y: src.y + src.h + gap, w: DW - 8, h: DH - (src.y + src.h + gap) - 4},
      top: {x: 4, y: 4, w: DW - 8, h: src.y - gap - 4},
    };
    let bestP = null, bz = 0;
    const pref = P.detailGeometry.placement;
    const zOf = R => (R.w <= 0 || R.h <= 0 ? 0 : Math.min(Math.max(P.detailGeometry.zoom, need / Math.min(src.h, src.w)), 5, R.w / src.w, R.h / src.h));
    // a preferred placement is honoured when it allows a real (>= 1.5x) lens; otherwise the best side is used
    const big = z => z >= 1.5 && Math.min(src.h, src.w) * z >= need;
    if (pref !== 'auto' && big(zOf(regions[pref]))) { bestP = pref; bz = zOf(regions[pref]); }
    else for (const [name, R] of Object.entries(regions)) { const z = zOf(R); if (z > bz) { bz = z; bestP = name; } }
    if (!bestP) bestP = 'right';
    const zoom = Math.max(0.5, bz);
    const R = regions[bestP];
    const dw = src.w * zoom, dh = src.h * zoom;
    const cx = clamp(src.x + src.w / 2, R.x + dw / 2, R.x + R.w - dw / 2), cy = clamp(src.y + src.h / 2, R.y + dh / 2, R.y + R.h - dh / 2);
    const dest = {x: cx - dw / 2, y: cy - dh / 2, w: dw, h: dh};
    const problems = [...C.problems];
    if (zoom < 1.5) problems.push('lens-zoom');
    if (Math.min(dw, dh) < need * 0.975) problems.push('lens-size');
    if (overlaps(dest, src)) problems.push('lens-over-source');
    if (fb && fb.size * zoom < 16) problems.push('lens-text');
    const marker = {x: X(t.hole.x) + Math.cos(a) * TG.x1, y: Y(t.hole.y) - G.tagH * 0.75};
    return {tagSmall: sc * 17 < 16.5 || sc < 0.98, P, n, k, C, G, SF, N, NL, fb, fa, tip, badge, before, after, src, srcRest, step, dest, zoom, problems, marker, place: bestP};
  },
  build(ctx, L) {
    const {C, G, P, k} = L;
    const th = ctx.theme;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const t = G.tags[k];
    const TG = L.N.TG;
    const tagText = (pref, f, name) => g({name: `${pref}-${name}`, transform: T(C.ox + t.hole.x, C.oy + t.hole.y, t.angle)}, f ? textAt(f, {x: TG.rx0 + 2, y: -f.height / 2 + 1, fill: WRITE_INK}) : null);
    const lw = Math.max(4, G.S * 0.045);
    const focusLayer = pref => {
      const parts = [];
      if (L.before >= 0) parts.push(linkLine(`${pref}-lb`, L.tip, L.badge(L.before), lw).node);
      if (L.after >= 0) parts.push(linkLine(`${pref}-la`, L.tip, L.badge(L.after), lw).node);
      parts.push(tagText(pref, L.fb, 'vb'), tagText(pref, L.fa, 'va'));
      return parts;
    };
    // the before trace (lens only): small text under the tag
    // the before trace (lens only): a small paper chip under the tag, sized to read at >= 19 px inside the lens
    const kz = L.step.s * L.zoom;
    const traceF = ctx.show('key') ? fitG(`${P.beforeLabel}: ${P.beforeValue}`, {maxWidth: 1000, size: 20 / kz, minSize: 20 / kz, maxLines: 1, weight: 600}) : null;
    const tx0 = C.ox + t.hole.x - G.tagH * 0.2, ty0 = C.oy + t.hole.y + G.tagH * 0.62;
    const trace = g({name: 'lz-trace', opacity: 0}, traceF ? [
      h('rect', {x: r(tx0 - 6 / kz), y: r(ty0 - 4 / kz), width: r(traceF.width + 12 / kz), height: r(traceF.height + 8 / kz), rx: r(6 / kz), fill: '#fbfaf6', stroke: INK, 'stroke-width': r(1.5 / kz, 3)}),
      textAt(traceF, {x: tx0, y: ty0, fill: '#4a4f55', italic: true})] : null);
    const lensContent = g(null,
      h('rect', {x: L.src.x - 400, y: L.src.y - 400, width: L.src.w + 800, height: L.src.h + 800, fill: '#3f6b5a'}),
      g({transform: T(L.step.x, L.step.y, 0, L.step.s)}, L.NL.rack, L.NL.sheet, L.NL.placed, L.NL.tags, L.NL.links, focusLayer('lz'), trace));
    L.lensObj = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: lensContent, frame: {x: 0, y: 0, w: ctx.design.w, h: ctx.design.h}});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, legendNodes(ctx, PLc))) : [];
    const lensNode = L.lensObj.node;
    lensNode.attrs['data-occludes'] = 1;
    return g({name: 'scene'},
      g({name: 'ctxg'},
        bench.surface,
        g({'clip-path': bench.clip}, L.N.rack, L.N.sheet, L.N.placed, L.N.tags, L.N.links, focusLayer('st')),
        bench.frame,
        changedMarker(ctx, {name: 'marker', x: L.marker.x, y: L.marker.y, radius: Math.max(16, G.S * 0.16), opacity: 0}),
      ),
      panels,
      lensNode,
    );
  },
  frame(ctx, L, u) {
    const {G, n, k} = L;
    if (!L.lensObj) L.lensObj = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: null, frame: {x: 0, y: 0, w: ctx.design.w, h: ctx.design.h}});
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const lifted = seg(u, ...W.lift);
    const written = seg(u, ...W.write);
    const unlink = 1 - ease.inOutCubic(seg(u, ...W.unlink));
    const relink = ease.inOutCubic(seg(u, ...W.relink));
    const lensOpen = u >= W.open[0] && u < W.close[1];
    const shown = u < W.write[0] ? 'before' : 'after';
    const items = Array.from({length: n}, (_, i) => ({state: 'placed', link: i === k ? 0 : (L.N.linkC && L.P.records[i] && String(L.P.records[i].value || '').trim() ? 1 : 0), write: 1}));
    const nodes = {...stationProps(G, L.N, {prefix: 'st', ox: L.C.ox, oy: L.C.oy, noBag: true, noCarry: true}, items), ...stationProps(G, L.NL, {prefix: 'lz', ox: L.C.ox, oy: L.C.oy, noBag: true, noCarry: true}, items)};
    for (const pref of ['st', 'lz']) {
      if (L.before >= 0) Object.assign(nodes, linkLine(`${pref}-lb`, L.tip, L.badge(L.before), 4).frame(unlink, unlink > 0 ? 1 : 0));
      if (L.after >= 0) Object.assign(nodes, linkLine(`${pref}-la`, L.tip, L.badge(L.after), 4).frame(relink, relink > 0 ? 1 : 0));
    }
    // one copy of the datum at a time: context copy only while the lens is shut
    const ctxB = !lensOpen && shown === 'before' ? 1 : 0;
    const ctxA = !lensOpen && shown === 'after' ? 1 : 0;
    const lensB = lensOpen ? 1 - lifted : 0;
    const lensA = lensOpen ? written : 0;
    nodes['st-vb'] = {opacity: ctxB};
    nodes['st-va'] = {opacity: ctxA};
    nodes['lz-vb'] = {opacity: r(lensB, 3), transform: T(L.C.ox + G.tags[k].hole.x, L.C.oy + G.tags[k].hole.y - lifted * G.tagH * 0.8, G.tags[k].angle)};
    nodes['lz-va'] = {opacity: r(lensA, 3)};
    nodes['lz-trace'] = {opacity: r(seg(u, ...W.trace), 3)};
    Object.assign(nodes, L.lensObj.frame(open, open));
    const stepK = ease.inOutCubic(seg(u, ...W.stepOut)) * (1 - ease.inOutCubic(seg(u, ...W.stepBack)));
    const sk = lerp(1, L.step.s, stepK);
    nodes.ctxg = {transform: T(L.step.x * stepK, L.step.y * stepK, 0, sk)};
    // the small cell-tag references would fall under 16 px while stepped: they fade out and back (rows keep them)
    for (let i = 0; i < n; i++) if (i !== k && L.tagSmall) nodes[`st-tt${i}`] = {opacity: r(1 - stepK, 3)};
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mk, 3)};
    if (L.C.PL) for (const col of L.C.PL.cols) for (const row of col.rows) if (row.name === 'state-tag') nodes[row.name] = {opacity: r(mk, 3)};
    // link state of the focus tag (both copies share it)
    const linkedTo = relink > 0.98 ? L.after : unlink > 0.02 ? L.before : -1;
    return {
      nodes,
      semantic: {
        phase: u < W.open[0] ? 'context' : u < W.close[0] ? 'lens' : u < W.close[1] ? 'close' : 'return',
        shown, value: shown === 'before' ? L.P.beforeValue : L.P.afterValue, lensP: r(open, 3),
        ctxBefore: ctxB, ctxAfter: ctxA, lensBefore: r(lensB, 3), lensAfter: r(lensA, 3), marker: r(mk, 3),
        linkedTo, beforeRow: L.before, afterRow: L.after, zoom: r(L.zoom, 3), source: L.src, dest: L.dest,
        tip: R2(L.tip), problems: L.problems, textPx: r(L.C.F, 1), S: r(G.S, 1), place: L.place,
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
    slug: 'evidence-custody-05-inspect',
    title: 'Object inventory — a lens enlarges one cell\'s tag and its line to the list; the tag\'s reference is substituted and only its line moves to the row carrying the new reference',
    titleEs: 'Inventario de objetos — Inspección y cambio de un dato',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Inventario de objetos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The finished inventory: fictional objects lie in the cells of a compartment rack, each cell\'s tag carries an entry reference and a plain line joins it to the list row with that reference. A lens opens on one tag, its line and the rows around it (a real enlarged copy at the same coordinates). The tag\'s reference is substituted as supplied: the old value lifts away leaving a small trace, the new one is written, and the line leaves the old row and is redrawn to the row carrying the new reference — or is not redrawn when no row carries it. The lens closes and a Δ marker keeps the changed datum visible. No validity, responsibility or outcome is inferred; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'inventory', 'list', 'tag', 'reference', 'lens', 'changed datum', 'rack'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/inventario-objetos.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
