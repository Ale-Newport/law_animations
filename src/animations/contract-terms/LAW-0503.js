/**
 * LAW-0503 — Limitación contractual · contrast
 *
 * Storyboard (two identical peg trays, side by side on wide boxes, one above the other on tall ones):
 *  0.00–0.17  base: each scene — badge "A" / "B" — shows the same contract slip ("CT-246 · Contract (fictional)",
 *             "Limitation clause", the clause line of the changed category) and the same peg tray holding the same
 *             supplied category tiles; four brass pegs stand at the tray's corners and a cord bobbin waits at the
 *             bottom-left peg. Both scenes are identical.
 *  0.17–0.35  the one changed fact arrives: on each slip a status line slides in for the changed category —
 *             A: ● "Category included (as supplied)", B: ◆ "Exclusion to be reviewed (as supplied)". In B four extra
 *             pegs rise round the left of that tile (where its band starts and ends).
 *  0.35–0.70  in both trays the bobbin lays the cord round the pegs at the same pace (one contour each): in A it runs
 *             straight down the right side; in B it steps in round the changed tile, which is left in a bay outside.
 *  0.70–1.00  each tile shows its supplied status; a closing guide rings the changed tile in both trays, with the
 *             neutral note "Only Category 2's supplied status differs" and the key "As supplied · no conclusion drawn".
 * No doctrine on limitation or exclusion clauses: no enforceability, validity or effect, no cap or amount, no outcome,
 * no preference between the scenes (same size, weight and timing).
 * @module animations/contract-terms/LAW-0503
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, int, oneOf, annotation} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, STATUSES, contractField, clauseTitleField, clausesField, categoriesField, statusLabelsField,
  localizeScene, unitPx, fitG, chipG, txt, statusGlyph, tileArt, tileTextX, contourGeom, contourNode, contourFrame,
  brassPeg, clauseOf, worstStatus,
} from './kits/limitacion-contractual.js';

const ID = 'LAW-0503';
const DURATION = 6500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.35], consequence: [0.35, 0.7], hold: [0.7, 1]};
const W = {line: [0.18, 0.26], pegs: [0.25, 0.33], cord: [0.36, 0.68], status: [0.69, 0.74], guide: [0.73, 0.78], note: [0.76, 0.81], key: [0.78, 0.83]};

const STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', only: 'Only {x}’s supplied status differs', a: 'Scenario A', b: 'Scenario B'},
  es: {key: 'Según lo aportado · sin conclusión', only: 'Solo difiere el estado aportado de {x}', a: 'Escenario A', b: 'Escenario B'},
};

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  categories: categoriesField,
  statusLabels: statusLabelsField,
  changedCategory: int('The category whose supplied status differs between the scenes (1 = top; clamped to the list)', 1, 4),
  statusA: oneOf('Supplied status of the changed category in scenario A', STATUSES),
  statusB: oneOf('Supplied status of the changed category in scenario B', STATUSES),
  scenarioLabels: obj('Scenario captions', {a: str('Caption of scenario A', 40), b: str('Caption of scenario B', 40)}, ['a', 'b']),
  annotations: list('Editorial callouts shown in the final hold', annotation(['a', 'b']), 0, 2),
};
const defaultParams = {
  ...CONTENT,
  categories: CONTENT.categories.map(c => ({...c, status: 'included'})),
  changedCategory: 2, statusA: 'included', statusB: 'review',
  scenarioLabels: {a: 'Scenario A', b: 'Scenario B'},
  annotations: [],
};
const defaultParamsEs = {
  ...CONTENT_ES,
  categories: CONTENT_ES.categories.map(c => ({...c, status: 'included'})),
  scenarioLabels: {a: 'Escenario A', b: 'Escenario B'},
};
const noSheet = o => { const {sheetLabel, ...rest} = o; void sheetLabel; return rest; };

const isStress = p => [...p.clauses, ...p.categories.map(c => c.label), p.contract.title, p.statusLabels.included, p.statusLabels.review, p.clauseTitle].some(t => t.length > 45) || p.annotations.length > 1;
const statusesOf = (p, which) => { const ci = clamp(p.changedCategory, 1, p.categories.length) - 1; return p.categories.map((c, i) => (i === ci ? (which === 'a' ? p.statusA : p.statusB) : c.status)); };

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const side = ctx.view.shape !== 'portrait';
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14, gapS = 34;
  const ci = clamp(p.changedCategory, 1, p.categories.length) - 1;
  const n = p.categories.length;
  const t = ctx.t;
  // bottom notes (neutral note, key, annotations) in one row (wide) or a column (tall)
  const notes = [];
  if (show) notes.push({name: 'only', kind: 'note0', text: t.only.replace('{x}', p.categories[ci].label)});
  if (showKey) notes.push({name: 'key', kind: 'key', text: t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text, target: an.target}));
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: Math.max(F * 0.95, minF), minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'note0' ? ctx.theme.accent3Soft : '#ffffff'});
  const gap = 12;
  const nw = D.w - pad * 2;
  const cols = notes.length > 1 && side ? Math.min(notes.length, ctx.view.shape === 'landscape' ? 3 : 2) : 1;
  const cw = (nw - gap * (cols - 1)) / cols;
  const sizes = notes.map(q => chipOf(q, 0, 0, cw).box.h);
  const rowsN = Math.ceil(notes.length / cols);
  const nh = notes.length ? Array.from({length: rowsN}, (_, k) => Math.max(...sizes.slice(k * cols, k * cols + cols))).reduce((a, b) => a + b + gap, -gap) : 0;
  const avail = {x: pad, y: pad, w: D.w - pad * 2, h: D.h - pad * 2 - (nh ? nh + 18 : 0)};
  const sc = side
    ? [{x: avail.x, y: avail.y, w: (avail.w - gapS) / 2, h: avail.h}, {x: avail.x + (avail.w + gapS) / 2, y: avail.y, w: (avail.w - gapS) / 2, h: avail.h}]
    : [{x: avail.x, y: avail.y, w: avail.w, h: (avail.h - gapS) / 2}, {x: avail.x, y: avail.y + (avail.h + gapS) / 2, w: avail.w, h: (avail.h - gapS) / 2}];
  const S = sc[0];
  // within a scene: header (badge + caption), slip, tray
  const badgeR = Math.max(F * 0.95, 20);
  const capFits = [fitG(p.scenarioLabels.a, {maxWidth: S.w - badgeR * 2 - 30, size: F, minSize: minF, maxLines: 1, weight: 800}), fitG(p.scenarioLabels.b, {maxWidth: S.w - badgeR * 2 - 30, size: F, minSize: minF, maxLines: 1, weight: 800})];
  const headH = badgeR * 2 + 10;
  // tall layout: slip at left of the tray (side by side inside the scene); wide: slip above the tray
  const slipBeside = false;
  const slipW = slipBeside ? S.w * 0.4 : S.w;
  const slipPad = 18;
  const slipHead = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: slipW - slipPad * 2, size: F, minSize: minF, maxLines: 2, weight: 700});
  const clauseIdx = clauseOf(p, p.categories[ci]);
  const slipClause = fitG(`${p.clauseTitle} · ${p.clauses[clauseIdx]}`, {maxWidth: slipW - slipPad * 2, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600});
  const gR = Math.min(14, F * 0.6);
  const lineFit = st => fitG(`${p.categories[ci].label}: ${p.statusLabels[st]}`, {maxWidth: slipW - slipPad * 2 - gR * 2 - 12, size: F, minSize: minF, maxLines: 3, weight: 700});
  const lines = [lineFit(p.statusA), lineFit(p.statusB)];
  const lineWorst = [lineFit('included'), lineFit('review')].reduce((a, b) => (b.height > a.height ? b : a));
  const slipH = slipHead.height + slipClause.height + lineWorst.height + slipPad * 2 + 30;
  const tray = slipBeside
    ? {x: slipW + 20, y: headH, w: S.w - slipW - 20, h: S.h - headH}
    : {x: 0, y: headH + slipH + 16, w: S.w, h: S.h - headH - slipH - 16};
  if (slipBeside && slipH > S.h - headH) why.push('slip');
  if (tray.h < 120) why.push('tray-small');
  const C = {x: tray.x + 26, y: tray.y + 24, w: tray.w - 52, h: tray.h - 48};
  const neck = clamp(C.w * 0.13, 44, 84);
  const tileX = C.x + neck + 20, tileW = C.x + C.w - 16 - tileX;
  const labFits = p.categories.map(c => fitG(c.label, {maxWidth: tileW - tileTextX(200) - gR * 2 - 30, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700}));
  const tileH0 = Math.max(...labFits.map(f => f.height)) + 26;
  const minGap = 34;
  if (n * tileH0 + (n - 1) * minGap + 20 > C.h) why.push('tiles-do-not-fit');
  const tileH = Math.min(tileH0 + F * 1.2, (C.h - 20 - (n - 1) * minGap) / n);
  const tg = n > 1 ? (C.h - 20 - n * tileH) / (n - 1) : 0;
  const tiles = p.categories.map((c, i) => ({x: tileX, y: C.y + 10 + i * (tileH + tg), w: tileW, h: tileH, lab: labFits[i]}));
  const rows = tiles.map(q => ({y: q.y - 6, h: q.h + 12}));
  const cgs = [contourGeom(C, rows, statusesOf(p, 'a'), C.x + neck, 16), contourGeom(C, rows, statusesOf(p, 'b'), C.x + neck, 16)];
  const outer = contourGeom(C, rows, p.categories.map(() => 'included'), C.x + neck, 16).corners;
  if ([...capFits, slipHead, slipClause, ...lines, lineWorst, ...labFits].some(f => f.bad)) why.push('text');
  // notes placement
  let notesPl = null;
  if (notes.length) {
    let ny = D.h - pad - nh;
    notesPl = [];
    for (let k = 0; k < rowsN; k++) {
      const row = notes.slice(k * cols, k * cols + cols);
      let rh = 0;
      row.forEach((q, j) => { const c = chipOf(q, pad + j * (cw + gap), ny, cw); if (c.bad) why.push('note-text'); rh = Math.max(rh, c.box.h); notesPl.push({q, c}); });
      ny += rh + gap;
    }
  }
  return {ok: !why.length, why, F, minF, side, sc, S, badgeR, capFits, headH, slipW, slipPad, slipHead, slipClause, lines, lineWorst, slipH, slipBeside, tray, C, neck, tiles, cgs, outer, gR, ci, notesPl};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1600]},
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
    const sceneNode = (k) => {
      const which = k === 0 ? 'a' : 'b';
      const P = which;
      const st = statusesOf(p, which);
      const S = L.sc[k];
      const slip = {x: 0, y: L.headH, w: L.slipW, h: L.slipH};
      const lineY = slip.y + L.slipPad + L.slipHead.height + 12 + L.slipClause.height + 18;
      const lf = L.lines[k];
      const tr = L.tray;
      const pegsBay = L.cgs[k].corners.filter(c => !L.outer.some(o => Math.abs(o.x - c.x) < 0.5 && Math.abs(o.y - c.y) < 0.5));
      return g({transform: T(S.x, S.y)},
        // header: badge + caption
        h('circle', {cx: r(L.badgeR), cy: r(L.badgeR + 2), r: r(L.badgeR), fill: k === 0 ? th.accent2 : th.accent3, stroke: INK, 'stroke-width': 2.4}),
        h('path', {d: k === 0 ? letterA(L.badgeR, L.badgeR + 2, L.badgeR * 0.55) : letterB(L.badgeR, L.badgeR + 2, L.badgeR * 0.55), fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(3, L.badgeR * 0.16)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        show ? txt(L.capFits[k], {x: L.badgeR * 2 + 16, y: L.badgeR + 2 - L.capFits[k].height / 2, fill: th.fg}) : null,
        // the contract slip
        h('rect', {x: r(slip.x + 6), y: r(slip.y + 9), width: r(slip.w), height: r(slip.h), rx: 10, fill: th.shadow}),
        h('rect', {x: r(slip.x), y: r(slip.y), width: r(slip.w), height: r(slip.h), rx: 10, fill: '#fdfbf5', stroke: INK, 'stroke-width': 2.4}),
        h('rect', {x: r(slip.x), y: r(slip.y), width: 12, height: r(slip.h), rx: 5, fill: th.accent3}),
        show ? txt(L.slipHead, {x: L.slipPad + 6, y: slip.y + L.slipPad, fill: INK}) : h('path', {d: `M${L.slipPad + 6} ${r(slip.y + L.slipPad + 12)}h${r(Math.min(220, slip.w * 0.5))}`, stroke: '#c9bea8', 'stroke-width': 10, 'stroke-linecap': 'round'}),
        show ? txt(L.slipClause, {x: L.slipPad + 6, y: slip.y + L.slipPad + L.slipHead.height + 12, fill: INK}) : h('path', {d: `M${L.slipPad + 6} ${r(slip.y + L.slipPad + L.slipHead.height + 26)}h${r(Math.min(280, slip.w * 0.6))}`, stroke: '#ddd3c0', 'stroke-width': 9, 'stroke-linecap': 'round'}),
        g({name: `${P}-line`, opacity: 0},
          h('path', {d: `M${L.slipPad} ${r(lineY - 9)}H${r(slip.w - 10)}`, stroke: '#e6dccb', 'stroke-width': 2}),
          statusGlyph(ctx, p[which === 'a' ? 'statusA' : 'statusB'], L.slipPad + 6 + L.gR, lineY + Math.min(lf.height, lf.lineHeight) / 2, L.gR),
          show ? txt(lf, {x: L.slipPad + 6 + L.gR * 2 + 12, y: lineY, fill: INK}) : h('path', {d: `M${r(L.slipPad + 6 + L.gR * 2 + 12)} ${r(lineY + 12)}h${r(Math.min(200, slip.w * 0.45))}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}),
        ),
        // the peg tray
        h('rect', {x: r(tr.x + 8), y: r(tr.y + 12), width: r(tr.w), height: r(tr.h), rx: 16, fill: th.shadow}),
        h('rect', {x: r(tr.x), y: r(tr.y), width: r(tr.w), height: r(tr.h), rx: 16, fill: '#b98d5f', stroke: INK, 'stroke-width': 2.6}),
        h('rect', {x: r(tr.x + 10), y: r(tr.y + 10), width: r(tr.w - 20), height: r(tr.h - 20), rx: 10, fill: '#d9b98c'}),
        // peg holes (a grid of holes; identical in both trays)
        holes(L),
        L.tiles.map((t, i) => g({transform: T(t.x, t.y)},
          tileArt(ctx, {w: t.w, h: t.h, n: i + 1, fit: t.lab, showText: show, status: st[i], glyphR: L.gR, stName: `${P}-st${i}`, stOpacity: 0}),
        )),
        // pegs: the four corners (both trays), the bay pegs (only where the status is "review"; they rise at the change)
        L.outer.map(c => brassPeg(c.x, c.y, 10)),
        g({name: `${P}-pegs`, opacity: 0}, pegsBay.map(c => brassPeg(c.x, c.y, 10))),
        contourNode(ctx, `${P}-cord`, L.cgs[k], {color: '#7a3f2a', width: 6}),
        g({name: `${P}-bob`}, h('circle', {cx: 0, cy: 0, r: 17, fill: '#7a3f2a', stroke: INK, 'stroke-width': 2.4}), h('circle', {cx: 0, cy: 0, r: 7, fill: '#e8d6b4', stroke: INK, 'stroke-width': 1.6})),
        // closing guide round the changed tile
        g({name: `${P}-guide`, opacity: 0}, h('path', {d: roundRectPath(L.tiles[L.ci].x - 9, L.tiles[L.ci].y - 9, L.tiles[L.ci].w + 18, L.tiles[L.ci].h + 18, 16), fill: 'none', stroke: th.accent, 'stroke-width': 4.5})),
      );
    };
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'}, sceneNode(0), sceneNode(1), notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const lineO = seg(u, ...W.line), pegO = seg(u, ...W.pegs);
    const cq = ease.inOutSine(seg(u, ...W.cord));
    const look = {};
    ['a', 'b'].forEach((P, k) => {
      const st = statusesOf(p, P);
      nodes[`${P}-line`] = {opacity: r(lineO, 3)};
      nodes[`${P}-pegs`] = {opacity: r(pegO, 3), transform: `translate(0 ${r((1 - ease.outCubic(pegO)) * 14, 2)})`};
      Object.assign(nodes, contourFrame(`${P}-cord`, L.cgs[k], cq));
      const b = L.cgs[k].at(cq);
      const parked = u < W.cord[0] || u >= W.cord[1];
      nodes[`${P}-bob`] = {transform: T(r(b.x, 2), r(b.y, 2))};
      L.tiles.forEach((_, i) => { nodes[`${P}-st${i}`] = {opacity: r(seg(u, W.status[0] + i * 0.008, W.status[0] + i * 0.008 + 0.03), 3)}; });
      nodes[`${P}-guide`] = {opacity: r(seg(u, ...W.guide), 3)};
      look[P] = {bob: {x: r(b.x), y: r(b.y)}, cord: r(cq, 3), line: r(lineO, 3), pegs: r(pegO, 3), bays: u >= W.pegs[0] ? st.filter(s => s === 'review').length : 0, parked};
    });
    const noteO = seg(u, ...W.note), keyO = seg(u, ...W.key);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : noteO, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.consequence[1] ? 'consequence' : 'hold';
    // the "look" before the change beat: what is visible, identical in both scenes
    const lookA = u < W.line[0] ? JSON.stringify({cord: look.a.cord, line: look.a.line, pegs: look.a.pegs, bob: look.a.bob}) : 'changed';
    const lookB = u < W.line[0] ? JSON.stringify({cord: look.b.cord, line: look.b.line, pegs: look.b.pegs, bob: look.b.bob}) : 'changed';
    return {
      nodes,
      semantic: {
        beat, bobA: look.a.bob, bobB: look.b.bob, cord: r(cq, 3), lookA, lookB,
        lineShown: r(lineO, 3), bayPegs: r(pegO, 3), baysA: look.a.bays, baysB: look.b.bays,
        lenA: r(L.cgs[0].len), lenB: r(L.cgs[1].len), statusA: p.statusA, statusB: p.statusB, changed: L.ci + 1,
        guideShown: r(seg(u, ...W.guide), 3), keyShown: r(keyO, 3), side: L.side,
        sceneA: {x: r(L.sc[0].x), y: r(L.sc[0].y), w: r(L.sc[0].w), h: r(L.sc[0].h)}, sceneB: {x: r(L.sc[1].x), y: r(L.sc[1].y), w: r(L.sc[1].w), h: r(L.sc[1].h)},
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
      },
    };
  },
};

function holes(L) {
  const out = [];
  const tr = L.tray;
  for (let x = tr.x + 30; x < tr.x + tr.w - 20; x += 46) for (let y = tr.y + 30; y < tr.y + tr.h - 20; y += 46) out.push(`M${r(x)} ${r(y)}m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`);
  return h('path', {d: out.join(''), fill: '#9c7448', opacity: 0.55});
}
const letterA = (x, y, s) => `M${r(x - s * 0.6)} ${r(y + s * 0.7)}L${r(x)} ${r(y - s * 0.75)}L${r(x + s * 0.6)} ${r(y + s * 0.7)}M${r(x - s * 0.33)} ${r(y + s * 0.15)}H${r(x + s * 0.33)}`;
const letterB = (x, y, s) => `M${r(x - s * 0.45)} ${r(y - s * 0.75)}V${r(y + s * 0.75)}H${r(x + s * 0.15)}Q${r(x + s * 0.6)} ${r(y + s * 0.75)} ${r(x + s * 0.6)} ${r(y + s * 0.38)}Q${r(x + s * 0.6)} ${r(y)} ${r(x + s * 0.1)} ${r(y)}H${r(x - s * 0.45)}M${r(x + s * 0.1)} ${r(y)}Q${r(x + s * 0.5)} ${r(y)} ${r(x + s * 0.5)} ${r(y - s * 0.38)}Q${r(x + s * 0.5)} ${r(y - s * 0.75)} ${r(x + s * 0.1)} ${r(y - s * 0.75)}H${r(x - s * 0.45)}`;
void lerp;

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-06-contrast',
    title: 'Limitation clause, without doctrine — two identical peg trays; one supplied status differs and the cord laid round the pegs leaves that category in a bay in one tray only',
    titleEs: 'Limitación contractual — Contraste entre dos escenarios',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Limitación contractual',
    treatment: 'contrast',
    family: 'paired-scenes',
    description: 'Two complete, identical scenes — a contract slip and a peg tray of supplied category tiles. One fact changes: the supplied status of one category (A: "Category included", B: "Exclusion to be reviewed"). In B extra pegs rise beside that tile, and when a bobbin lays the cord round the pegs in both trays at the same pace, B\'s cord steps in round the tile, leaving it in a bay outside the contour. A closing guide rings the changed tile in both trays; a neutral note says only that status differs; key "As supplied · no conclusion drawn". No enforceability, validity, cap, amount or preference.',
    tags: ['limitation clause', 'liability categories', 'exclusion', 'contrast', 'peg tray', 'cord', 'contour', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/limitacion-contractual.js'],
  }),
  sceneSchema,
  defaultParams: noSheet(defaultParams),
  strings: STRINGS,
  scene: localizeScene(scene, noSheet(defaultParams), noSheet(defaultParamsEs)),
});
