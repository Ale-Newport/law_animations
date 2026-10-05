/**
 * LAW-0504 — Limitación contractual · inspect
 *
 * Storyboard (context = the state the story leaves: the delimited category sheet; one supplied status is substituted):
 *  0.00–0.18  context: the category sheet "CT-246 · Contract (fictional) · Limitation clause" with its supplied category
 *             tiles, each showing its supplied status, and the contour drawn round them (a bay round every exclusion to
 *             be reviewed). The changed category shows the before-value (default ● "Category included (as supplied)").
 *  0.18–0.34  a lens opens from that tile's band (tile + the contour beside it) to a real enlarged copy (≥ 1.5×) beside
 *             the context, which stays in place, dimmed. The context's status line of that tile is blanked as the copy
 *             appears (the datum is legible in one place only).
 *  0.36–0.56  in the lens the one datum is substituted: the before-value lifts and fades, a small "was: …" trace keeps it
 *             traceable, the after-value (default ◆ "Exclusion to be reviewed (as supplied)") fades in and holds.
 *  0.54–0.67  only the dependent geometry follows: the contour's old route beside the tile retracts and the new route
 *             is drawn (in the lens and in the dimmed context, together): a bay forms round the tile (or closes).
 *  0.68–0.80  the lens closes back onto the tile; the context shows the after-value with the neutral changed-datum
 *             marker (white Δ on the blue disc).
 *  0.80–1.00  hold: the "was" note and the key "As supplied · no conclusion drawn". Seeking back restores the
 *             before-value exactly.
 * No doctrine on limitation or exclusion clauses: no enforceability, validity or effect, no cap or amount, no outcome.
 * Both values are supplied statuses of equal weight (● and ◆ alike).
 * @module animations/contract-terms/LAW-0504
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {list, int, oneOf, annotation} from '../../schemas/fields.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  INK, CONTENT, CONTENT_ES, STATUSES, contractField, clauseTitleField, categoriesField, statusLabelsField, sheetLabelField,
  localizeScene, unitPx, fitG, chipG, txt, statusGlyph, tileArt, tileTextX, contourGeom, contourNode, contourFrame,
} from './kits/limitacion-contractual.js';

const ID = 'LAW-0504';
const DURATION = 6500;
const BEATS = {context: [0, 0.18], isolate: [0.18, 0.36], substitute: [0.36, 0.68], ret: [0.68, 0.8], hold: [0.8, 1]};
const W = {open: [0.18, 0.32], out: [0.36, 0.44], was: [0.42, 0.47], in: [0.46, 0.53], retract: [0.55, 0.6], draw: [0.6, 0.67], close: [0.69, 0.79], ctxIn: [0.785, 0.81], marker: [0.79, 0.82], notes: [0.81, 0.85], key: [0.82, 0.86]};

const STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', was: 'was', wasNote: '{x}: was {v}'},
  es: {key: 'Según lo aportado · sin conclusión', was: 'antes', wasNote: '{x}: antes {v}'},
};

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  sheetLabel: sheetLabelField,
  categories: categoriesField,
  statusLabels: statusLabelsField,
  changedCategory: int('The category whose supplied status is substituted (1 = top; clamped to the list)', 1, 4),
  beforeValue: oneOf('Supplied status of the changed category before the substitution', STATUSES),
  afterValue: oneOf('Supplied status of the changed category after the substitution', STATUSES),
  annotations: list('Editorial callouts shown in the final hold', annotation(['tile', 'contour']), 0, 2),
};
const strip = o => { const {clauses, ...rest} = o; void clauses; return rest; };
const defaultParams = {...strip(CONTENT), changedCategory: 2, beforeValue: 'included', afterValue: 'review', annotations: []};
defaultParams.categories = CONTENT.categories.map((c, i) => (i === 1 ? {...c, status: 'included'} : c));
const defaultParamsEs = {...strip(CONTENT_ES)};
defaultParamsEs.categories = CONTENT_ES.categories.map((c, i) => (i === 1 ? {...c, status: 'included'} : c));

const isStress = p => [...p.categories.map(c => c.label), p.contract.title, p.statusLabels.included, p.statusLabels.review, p.sheetLabel, p.clauseTitle].some(t => t.length > 40) || p.annotations.length > 1;
const ciOf = p => clamp(p.changedCategory, 1, p.categories.length) - 1;
const statuses = (p, which) => p.categories.map((c, i) => (i === ciOf(p) ? p[which] : c.status));

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const tall = ctx.view.shape === 'portrait';
  const show = ctx.show('all'), showKey = ctx.show('key');
  const why = [];
  const pad = 14;
  const ci = ciOf(p);
  const n = p.categories.length;
  // notes
  const notes = [];
  if (show) notes.push({name: 'wasnote', kind: 'was', text: ctx.t.wasNote.replace('{x}', p.categories[ci].label).replace('{v}', p.statusLabels[p.beforeValue])});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const gap = 12;
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: F, minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: '#ffffff'});
  // context sheet
  let sheet, notesBox, lensArea;
  const ctxW = tall ? D.w - pad * 2 : D.w * 0.47;
  const gR = Math.min(14, F * 0.6);
  // tile text widths (independent of the tile height)
  const textMax = ctxW - 52 - clamp((ctxW - 52) * 0.12, 44, 80) - 20 - 16 - 98 - gR * 2 - 18;
  const labFits = p.categories.map(c => fitG(c.label, {maxWidth: textMax + gR * 2 + 12, size: F, minSize: minF, maxLines: 2, weight: 700}));
  const stFit = st => fitG(p.statusLabels[st], {maxWidth: textMax, size: F * 0.92, minSize: minF, maxLines: 2, weight: 600});
  const stFits = statuses(p, 'beforeValue').map(stFit);
  const afterFit = stFit(p.afterValue);
  const stH = Math.max(...[...stFits, afterFit, stFit('included'), stFit('review')].map(f => f.height));
  const labH = Math.max(...labFits.map(f => f.height));
  const head = fitG(`${p.contract.reference} · ${p.contract.title} · ${p.clauseTitle}`, {maxWidth: ctxW - 50, size: F, minSize: minF, maxLines: 2, weight: 800});
  const sh = fitG(p.sheetLabel, {maxWidth: ctxW - 50, size: F, minSize: minF, maxLines: 2, weight: 700});
  const headH = head.height + sh.height + 40;
  const tileH = labH + stH + 40;
  const notesW = tall ? D.w - pad * 2 : D.w - ctxW - pad * 2 - 30;
  const nh = notes.length ? notes.reduce((a, q) => a + chipOf(q, 0, 0, notesW).box.h + gap, -gap) : 0;
  let sheetH;
  if (tall) {
    sheetH = Math.min(D.h * 0.5, headH + 40 + n * tileH + (n - 1) * 70 + 40);
    sheet = {x: pad, y: pad, w: ctxW, h: sheetH};
    notesBox = {x: pad, y: D.h - pad - nh, w: notesW, h: nh};
    lensArea = {x: pad, y: sheet.y + sheet.h + 26, w: D.w - pad * 2, h: notesBox.y - 20 - (sheet.y + sheet.h + 26)};
  } else {
    sheet = {x: pad, y: pad, w: ctxW, h: D.h - pad * 2};
    notesBox = {x: sheet.x + sheet.w + 30, y: D.h - pad - nh, w: notesW, h: nh};
    lensArea = {x: sheet.x + sheet.w + 30, y: pad, w: notesW, h: notesBox.y - 20 - pad};
  }
  const C = {x: sheet.x + 26, y: sheet.y + headH + 14, w: sheet.w - 52, h: sheet.h - headH - 34};
  const neck = clamp(C.w * 0.12, 44, 80);
  const tileX = C.x + neck + 20, tileW = C.x + C.w - 16 - tileX;
  const free = C.h - 20 - n * tileH;
  if (free < (n - 1) * 34) why.push('tiles-do-not-fit');
  const tg = n > 1 ? Math.max(34, free / (n - 1)) : 0;
  const top = n > 1 ? C.y + 10 : C.y + (C.h - tileH) / 2;
  const tiles = p.categories.map((c, i) => ({x: tileX, y: top + i * (tileH + tg), w: tileW, h: tileH, lab: labFits[i], st: stFits[i]}));
  const rows = tiles.map(q => ({y: q.y - 8, h: q.h + 16}));
  const cgB = contourGeom(C, rows, statuses(p, 'beforeValue'), C.x + neck, 18);
  const cgA = contourGeom(C, rows, statuses(p, 'afterValue'), C.x + neck, 18);
  // the crop: the changed tile's band, from the contour's left side to the end of its text (whole fields only)
  const t = tiles[ci];
  const textEnd = t.x + tileTextX(t.h) + Math.max(t.lab.width, gR * 2 + 12 + Math.max(t.st.width, afterFit.width)) + 26;
  const vm = Math.min(tg / 2 - 2, 60);
  const src = {x: C.x - 16, y: t.y - vm, w: Math.min(C.x + C.w + 14, Math.max(textEnd, C.x + neck + 60)) - (C.x - 16), h: t.h + vm * 2};
  const k = Math.min(lensArea.w / src.w, lensArea.h / src.h, 2.6);
  if (k < 1.5) why.push('lens-small');
  const dest = {w: src.w * k, h: src.h * k};
  dest.x = lensArea.x + (lensArea.w - dest.w) / 2;
  dest.y = tall ? lensArea.y + (lensArea.h - dest.h) / 2 : clamp(src.y + src.h / 2 - dest.h / 2, lensArea.y, lensArea.y + lensArea.h - dest.h);
  if ([...labFits, ...stFits, afterFit, head, sh].some(f => f.bad)) why.push('text');
  let notesPl = null;
  if (notes.length) {
    let ny = notesBox.y;
    notesPl = notes.map(q => { const c = chipOf(q, notesBox.x, ny, notesBox.w); if (c.bad) why.push('note-text'); ny += c.box.h + gap; return {q, c}; });
  }
  return {ok: !why.length, why, F, minF, tall, sheet, head, sh, headH, C, neck, tiles, gR, cgB, cgA, ci, src, dest, k, afterFit, notesPl};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1080], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [25, 23, 21.5, 20.2]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const S = L.sheet;
    const stB = statuses(p, 'beforeValue');
    const statusLine = (t, st, fit, name, op) => {
      const y = (t.h + t.lab.height - fit.height + 10) / 2;
      return g({name, opacity: op},
        statusGlyph(ctx, st, show ? tileTextX(t.h) + L.gR : t.w - 20 - L.gR, show ? y + Math.min(fit.height, fit.lineHeight) / 2 : t.h / 2, L.gR),
        show ? txt(fit, {x: tileTextX(t.h) + L.gR * 2 + 12, y, fill: INK}) : null);
    };
    // the sheet content; prefix 'c' (context) or 'l' (lens copy)
    const content = P => g(null,
      h('rect', {x: r(S.x + 8), y: r(S.y + 12), width: r(S.w), height: r(S.h), rx: 14, fill: th.shadow}),
      h('rect', {x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 14, fill: '#f7f4ec', stroke: INK, 'stroke-width': 2.6}),
      h('rect', {x: r(S.x), y: r(S.y), width: r(S.w), height: r(L.headH - 6), rx: 14, fill: th.accent3Soft}),
      h('path', {d: `M${r(S.x)} ${r(S.y + L.headH - 6)}H${r(S.x + S.w)}`, stroke: INK, 'stroke-width': 2}),
      show ? txt(L.head, {x: S.x + 24, y: S.y + 14, fill: INK}) : h('path', {d: `M${r(S.x + 24)} ${r(S.y + 30)}h${r(S.w * 0.5)}`, stroke: '#c9b48a', 'stroke-width': 10, 'stroke-linecap': 'round'}),
      show ? txt(L.sh, {x: S.x + 24, y: S.y + 22 + L.head.height, fill: th.fgSoft ?? INK}) : null,
      L.tiles.map((t, i) => g({transform: T(t.x, t.y)},
        tileArt(ctx, {w: t.w, h: t.h, n: i + 1, fit: null, showText: show}),
        show ? txt(t.lab, {x: tileTextX(t.h), y: (t.h - t.lab.height - t.st.height - 10) / 2, fill: INK}) : null,
        i === L.ci
          ? g(null, statusLine(t, p.beforeValue, t.st, `${P}-before`, 1), statusLine(t, p.afterValue, L.afterFit, `${P}-after`, 0))
          : statusLine(t, stB[i], t.st, undefined, 1),
      )),
      contourNode(ctx, `${P}-cgB`, L.cgB, {drawn: true}),
      contourNode(ctx, `${P}-cgA`, L.cgA),
    );
    const t = L.tiles[L.ci];
    const lz = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: g(null, content('l'),
      g({name: 'l-was', opacity: 0}, show ? chipG(ctx, `${ctx.t.was}: ${p.statusLabels[p.beforeValue]}`, {x: t.x + tileTextX(t.h), y: t.y + t.h + 4, maxWidth: Math.max(120, L.src.x + L.src.w - (t.x + tileTextX(t.h)) - 4), size: L.F * 0.68 > 16.2 / L.upx / L.k ? L.F * 0.68 : 16.2 / L.upx / L.k, maxLines: 2, weight: 600, fill: '#ffffff'}).node : null)),
    frame: {x: 0, y: 0, w: ctx.design.w, h: ctx.design.h}, color: th.accent2});
    const marker = changedMarker(ctx, {name: 'marker', x: t.x + t.w - 6, y: t.y + 6, radius: 18, opacity: 0});
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'}, g({name: 'ctx'}, content('c')), marker, g({'data-occludes': 1}, lz.node), notes);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const lz = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: null, frame: {x: 0, y: 0, w: ctx.design.w, h: ctx.design.h}});
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const pq = u < W.close[0] ? open : 1 - close;
    Object.assign(nodes, lz.frame(pq, pq));
    // the copy is shown from 40 % open; the context datum is blanked in step
    const copy = clamp((pq - 0.22) / 0.2);
    nodes['lens-content'] = {...nodes['lens-content'], opacity: r(copy, 3)};
    const outQ = seg(u, ...W.out), inQ = seg(u, ...W.in);
    const sub = inQ > 0;
    nodes['l-before'] = {opacity: r(1 - outQ, 3), transform: `translate(0 ${r(-outQ * 18, 2)})`};
    nodes['l-after'] = {opacity: r(inQ, 3)};
    nodes['l-was'] = {opacity: r(seg(u, ...W.was) * (u < W.close[0] ? 1 : 1 - close), 3)};
    const ctxDatum = u < W.open[0] ? 1 : u < W.close[0] ? clamp(1 - copy * 4) : 0;
    const ctxIn = seg(u, ...W.ctxIn);
    nodes['c-before'] = {opacity: r(u < W.in[0] ? ctxDatum : 0, 3), transform: 'translate(0 0)'};
    nodes['c-after'] = {opacity: r(u < W.in[0] ? 0 : u < W.close[0] ? 0 : ctxIn, 3)};
    // dependent geometry: old route retracts, new route draws (lens copy and context together)
    const ret = seg(u, ...W.retract), drw = ease.inOutSine(seg(u, ...W.draw));
    for (const P of ['c', 'l']) { Object.assign(nodes, contourFrame(`${P}-cgB`, L.cgB, 1 - ret), contourFrame(`${P}-cgA`, L.cgA, drw)); }
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const noteO = seg(u, ...W.notes), keyO = seg(u, ...W.key);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : noteO, 3)};
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : u < BEATS.ret[1] ? 'return' : 'hold';
    const p = ctx.params;
    return {
      nodes,
      semantic: {
        beat, value: sub ? 'after' : 'before', shownValue: sub ? p.afterValue : p.beforeValue,
        lensOpen: r(pq, 3), copyShown: r(copy, 3), contextDatum: r(Math.max(u < W.in[0] ? ctxDatum : 0, nodes['c-after'].opacity), 3),
        zoom: r(L.k, 3), routeOld: r(1 - ret, 3), routeNew: r(drw, 3), markerShown: r(seg(u, ...W.marker), 3), keyShown: r(keyO, 3),
        lensBox: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)}, srcBox: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
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
    slug: 'contract-terms-06-inspect',
    title: 'Limitation clause, without doctrine — a lens isolates one category tile on the delimited sheet; its supplied status is substituted and the contour beside it re-routes',
    titleEs: 'Limitación contractual — Detalle ampliado',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Limitación contractual',
    treatment: 'inspect',
    family: 'detail-lens',
    description: 'Context: the delimited category sheet (supplied tiles, their statuses, one contour with a bay round each exclusion to be reviewed). A lens opens on one tile and the contour beside it (a real enlargement ≥ 1.5×, context dimmed in place); the supplied status is substituted (default ● "Category included" → ◆ "Exclusion to be reviewed"), a "was" trace keeps the old value, and only the contour beside the tile re-routes into (or out of) a bay. The lens closes; the context shows the new value with the neutral Δ marker; key "As supplied · no conclusion drawn". No enforceability, validity, cap or amount.',
    tags: ['limitation clause', 'liability categories', 'exclusion', 'contour', 'lens', 'substitution', 'inspect'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/limitacion-contractual.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
