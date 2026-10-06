/**
 * LAW-0515 — Orden de documentos · contrast
 *
 * Storyboard (two identical stages, A and B — side by side on wide frames, stacked on tall ones; each stage: the
 * order-list card on the left (numbered position slots), a tiered letter tray seen from the front in the middle (one
 * tier per position, level with the list slots) and the annex folders standing in a feeder rack on the right, in their
 * supplied numbering):
 *  0.00–0.15  rest: both stages identical. The list card holds the annexes whose position is shared, loose between the
 *             slots; the one annex whose position is the changed fact waits beside the card. One shared strip names the
 *             annexes (tab letter + supplied label) once, with the shared facts and the key.
 *  0.15–0.30  (identical) a loupe moves over the waiting chip.
 *  0.30–0.40  the change beat: the waiting chip enters the list — at position 1 in A ("Priority document (as
 *             supplied)") and at the configured lower position in B ("Subordinate document, as configured") — and the
 *             other chips settle into the remaining slots.
 *  0.42–0.70  in both stages, tier by tier from the top, the folder named in that list slot slides from the feeder into
 *             its tier (same timing in A and B): the changed annex's folder ends in a different tier.
 *  0.70–0.77  a guide outlines the changed chip and its folder in both stages; the guide label names the one changed
 *             fact; the neutral note stays: no winner, no outcome.
 * The order is only the supplied list; nothing prevails beyond the supplied positions; no jurisdiction.
 * @module animations/contract-terms/LAW-0515
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, int} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, schedulesField, prioritiesField, orderOf,
  localizeScene, unitPx, fitG, fitK, txt, chipG, positionDisc, tabChip, loupe, hueOf, softOf, P2, box2, shade,
} from './kits/orden-documentos.js';

const ID = 'LAW-0515';
const DURATION = 7500;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {read: [0.15, 0.28], change: [0.3, 0.4], fill: [0.42, 0.7], guide: [0.7, 0.77], loupeOut: [0.4, 0.5]};
const CHANGE = 0.3;
const ACTION_END = 0.77;

const strings = {en: {...KIT_STRINGS.en}, es: {...KIT_STRINGS.es}};

const scenario = what => obj(`Scenario ${what}`, {
  label: str(`Label of scenario ${what}, as supplied`, 60),
  position: int(`Position (1 = first listed) of the changed annex in scenario ${what} (clamped to the list)`, 1, 4),
}, ['label', 'position']);

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  schedules: schedulesField,
  priorities: prioritiesField,
  changedAnnex: int('Number of the annex whose listed position is the changed fact (1 = first annex; clamped)', 1, 4),
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  changedFact: str('Guide label naming the one changed fact (e.g. "Only the listed position of Annex B differs")', 60),
  sharedFacts: str('Note on what both scenarios share (e.g. "Same contract, same annexes, same order for the others")', 80),
  comparisonLabels: obj('Labels of the comparison', {legend: str('Heading of the shared annex legend (e.g. "Annexes (shared)")', 40)}),
  actionProgress: {type: 'number', minimum: 0, maximum: 1, description: 'How far the comparison is allowed to progress (1 = complete; lower values freeze it part-way)'},
};

const defaultParams = {
  ...CONTENT,
  changedAnnex: 2,
  scenarioA: {label: 'Priority document (as supplied)', position: 1},
  scenarioB: {label: 'Subordinate document, as configured', position: 3},
  changedFact: 'Only the listed position of Annex B differs',
  sharedFacts: 'Same contract, same annexes, same order for the others',
  comparisonLabels: {legend: 'Annexes (shared)'},
  actionProgress: 1,
};
delete defaultParams.stateLabels;
const defaultParamsEs = {
  ...CONTENT_ES,
  scenarioA: {label: 'Documento prioritario (según lo aportado)', position: 1},
  scenarioB: {label: 'Documento subordinado, según la configuración', position: 3},
  changedFact: 'Solo difiere la posición listada del Anexo B',
  sharedFacts: 'Mismo contrato, mismos anexos, mismo orden para los demás',
  comparisonLabels: {legend: 'Anexos (comunes)'},
};
delete defaultParamsEs.stateLabels;

const isStress = p => [p.scenarioA.label, p.scenarioB.label, p.changedFact, ...p.schedules.map(s => s.label)].some(t => t.length > 46) || p.sharedFacts.length > 60;

/** The two orders: the shared order of the other annexes, with the changed annex inserted at each scenario's position. */
function orders(p) {
  const n = p.schedules.length;
  const f = clamp(p.changedAnnex, 1, n) - 1;
  const others = orderOf(p).filter(i => i !== f);
  const ins = pos => { const o = others.slice(); o.splice(clamp(pos, 1, n) - 1, 0, f); return o; };
  return {f, others, A: ins(p.scenarioA.position), B: ins(p.scenarioB.position), n};
}

/* ---------------------------------------------------------------------- */
/* Layout                                                                  */
/* ---------------------------------------------------------------------- */

function geom(ctx, F, minF, arrangement) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 28, gap = 34;
  const O = orders(p);
  const n = O.n;
  // ---- the shared strip (annex legend, shared facts, key; the guide label joins at the hold)
  const fullW = D.w - 2 * m;
  const sideNotes = arrangement === 'row' && fullW > 1400; // wide frames: notes stacked beside the legend
  const stripW = sideNotes ? fullW * 0.62 : fullW;
  const legendItems = p.schedules.map((sc, i) => ({i, fit: null, sc}));
  const chipS = F * 1.4;
  const colsN = sideNotes ? 2 : arrangement === 'row' ? Math.min(n, stripW > 1500 ? 4 : 2) : 2;
  const itemW = (stripW - 40 - (colsN - 1) * 24) / colsN;
  for (const it of legendItems) it.fit = fitK(it.sc.label, {maxWidth: itemW - chipS - 14, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  if (legendItems.some(it => it.fit.bad)) why.push('legend-text');
  const head = show ? fitG(`${p.contract.reference} · ${p.clause.heading} · ${p.comparisonLabels.legend}`, {maxWidth: stripW - 40, size: F, minSize: minF, maxLines: 2, weight: 800}) : null;
  if (head && head.bad) why.push('legend-head');
  const rowsL = Math.ceil(n / colsN);
  const itemH = Math.max(chipS, ...legendItems.map(it => it.fit.height)) + 10;
  const legendH = show ? (head ? head.height + 12 : 0) + rowsL * itemH + (rowsL - 1) * 8 + 28 : 0;
  // notes row: shared facts, key, guide (guide appears at the hold, its space is reserved)
  const notes = [];
  if (show && p.sharedFacts) notes.push({name: 'shared', kind: 'shared', text: p.sharedFacts});
  if (show && p.changedFact) notes.push({name: 'guideLab', kind: 'guide', text: p.changedFact});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  const contentMin = Math.min(F, ...legendItems.map(it => it.fit.size));
  const noteW = sideNotes ? fullW - stripW - 24 : notes.length ? (stripW - (notes.length - 1) * 18) / notes.length : 0;
  const chips = notes.map(q => chipG(ctx, q.text, {x: 0, y: 0, maxWidth: noteW, size: q.kind === 'key' ? contentMin : F, minSize: Math.min(minF, contentMin), maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700}));
  if (chips.some(c => c.bad)) why.push('notes-text');
  const notesH = chips.length ? Math.max(...chips.map(c => c.box.h)) : 0;
  const notesStackH = chips.reduce((a, c) => a + c.box.h + 10, -10);
  const stripH = sideNotes ? Math.max(legendH, notesStackH + 8) : legendH + (notesH ? notesH + 14 : 0);
  // ---- panels
  const avail = {x: m, y: m, w: D.w - 2 * m, h: D.h - 2 * m - stripH - (stripH ? 18 : 0)};
  const pw = arrangement === 'row' ? (avail.w - gap) / 2 : avail.w;
  const ph = arrangement === 'row' ? avail.h : (avail.h - gap) / 2;
  const panels = arrangement === 'row' ? [{x: avail.x, y: avail.y}, {x: avail.x + pw + gap, y: avail.y}] : [{x: avail.x, y: avail.y}, {x: avail.x, y: avail.y + ph + gap}];
  const badgeR = F * 0.95;
  const hdrFits = [p.scenarioA.label, p.scenarioB.label].map(t => fitG(t, {maxWidth: pw - badgeR * 2 - 30, size: F, minSize: minF, maxLines: 2, weight: 700}));
  if (show && hdrFits.some(f => f.bad)) why.push('header-text');
  const hdrH = Math.max(badgeR * 2, show ? Math.max(...hdrFits.map(f => f.height)) : 0) + 14;
  const stage = {y: hdrH + 8, h: ph - hdrH - 8};
  // list card, tray, feeder (local x)
  const discR = F * 0.9;
  const lcW = discR * 2 + chipS + 46;
  const fw = clamp((pw - lcW - 56 - 60 - 14) / 2, 120, 330);
  const trayX = lcW + 26 + 30, feedX = trayX + fw + 34 + 26;
  if (feedX + fw > pw + 0.5) why.push('panel-width');
  const tierH = (stage.h - 24) / n;
  const fh = Math.min(tierH - 16, fw * 0.8);
  if (fh < Math.max(56, F * 2.2)) why.push('tier-height');
  const tierY = k => stage.y + 12 + k * tierH + (tierH - fh) / 2; // folder top in tier k
  const slotY = k => tierY(k) + fh / 2;
  const letterF = clamp(fh * 0.42, minF, F * 1.6);
  let ny = D.h - m - stripH;
  const placedNotes = notes.map((q, j) => ({q, c: chipG(ctx, q.text, {x: sideNotes ? m + stripW + 24 + noteW / 2 : m + j * (noteW + 18) + noteW / 2, anchor: 'middle', y: sideNotes ? (ny += (j ? chips[j - 1].box.h + 10 : 0)) : D.h - m - notesH + (notesH - chips[j].box.h) / 2, maxWidth: noteW, size: q.kind === 'key' ? contentMin : F, minSize: Math.min(minF, contentMin), maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'guide' ? ctx.theme.accent2Soft : ctx.theme.card})}));
  const legend = {x: m, y: D.h - m - stripH, w: stripW, h: legendH, head, items: legendItems, colsN, itemW, itemH, chipS};
  return {
    ok: !why.length, why, F, minF, arrangement, O, n, panels, pw, ph, badgeR, hdrFits, hdrH, stage, discR, lcW, chipS, fw, fh, trayX, feedX, tierH,
    tierY, slotY, letterF, legend, placedNotes, stress, contentMin,
  };
}

/* ---------------------------------------------------------------------- */
/* Art                                                                     */
/* ---------------------------------------------------------------------- */

function folderArt(ctx, L, si, name, show, occl) {
  const {fw, fh} = L;
  const hue = hueOf(si);
  const tabW = fw * 0.36, tabH = Math.min(fh * 0.2, 24);
  const p = ctx.params;
  return g({name, 'data-occludes': occl ? 1 : undefined},
    h('path', {d: roundRectPath(5, 7, fw, fh, 8), fill: ctx.theme.shadow}),
    h('path', {d: `M0 ${r(tabH)}V${r(fh - 8)}Q0 ${r(fh)} 8 ${r(fh)}H${r(fw - 8)}Q${r(fw)} ${r(fh)} ${r(fw)} ${r(fh - 8)}V${r(tabH + 8)}Q${r(fw)} ${r(tabH)} ${r(fw - 8)} ${r(tabH)}H${r(tabW + 14)}L${r(tabW)} 0H8Q0 0 0 8Z`, fill: softOf(si), stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M0 ${r(tabH + 6)}H${r(fw)}`, stroke: hue, 'stroke-width': 7}),
    h('path', {d: `M${r(fw * 0.5)} ${r(fh * 0.58)}h${r(fw * 0.36)}M${r(fw * 0.5)} ${r(fh * 0.76)}h${r(fw * 0.26)}`, stroke: shade(softOf(si), -0.18), 'stroke-width': 6, 'stroke-linecap': 'round'}),
    g({name: `${name}-print`},
      show
        ? h('text', {x: r(fw * 0.25), y: r(tabH + (fh - tabH) * 0.5 + L.letterF * 0.36 + 3), 'text-anchor': 'middle', 'font-size': r(L.letterF, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: shade(hue, -0.25)}, p.schedules[si].tab)
        : h('circle', {cx: r(fw * 0.25), cy: r(tabH + (fh - tabH) * 0.5 + 3), r: r(Math.min(fh * 0.2, fw * 0.12)), fill: hue, stroke: INK, 'stroke-width': 2}),
    ),
  );
}

function stageArt(ctx, L, P, which, show) {
  const th = ctx.theme;
  const {stage, n} = L;
  const parts = [];
  // header: badge + scenario label
  const color = which === 'A' ? th.accent2 : th.accent4;
  const hf = L.hdrFits[which === 'A' ? 0 : 1];
  parts.push(h('circle', {cx: r(L.badgeR), cy: r(L.hdrH / 2), r: r(L.badgeR), fill: color, stroke: INK, 'stroke-width': 2.4}));
  if (ctx.show('key')) parts.push(h('text', {x: r(L.badgeR), y: r(L.hdrH / 2 + L.badgeR * 0.4), 'text-anchor': 'middle', 'font-size': r(L.badgeR * 1.15, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, which));
  if (show) parts.push(txt(hf, {x: L.badgeR * 2 + 16, y: L.hdrH / 2 - hf.height / 2, fill: th.fg}));
  // stage floor
  parts.push(h('rect', {x: 0, y: r(stage.y), width: r(L.pw), height: r(stage.h), rx: 18, fill: '#f3ecdf', stroke: '#c9bb9f', 'stroke-width': 2}));
  // list card: numbered slots
  const lc = {x: 10, y: stage.y + 6, w: L.lcW - 20, h: stage.h - 12};
  parts.push(h('rect', {x: r(lc.x + 5), y: r(lc.y + 7), width: r(lc.w), height: r(lc.h), rx: 12, fill: th.shadow}), h('rect', {x: r(lc.x), y: r(lc.y), width: r(lc.w), height: r(lc.h), rx: 12, fill: '#fffdf7', stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('path', {d: roundRectPath(lc.x, lc.y, lc.w, 16, 8), fill: '#e9e0f2'}));
  for (let k = 0; k < n; k++) {
    const y = L.slotY(k);
    parts.push(positionDisc(ctx, lc.x + 12 + L.discR, y, L.discR, k + 1, show));
    parts.push(h('rect', {x: r(lc.x + 22 + L.discR * 2), y: r(y - L.chipS / 2 - 4), width: r(L.chipS + 8), height: r(L.chipS + 8), rx: 8, fill: 'none', stroke: '#d8ceb9', 'stroke-width': 2}));
  }
  // tray: frame and shelves, level with the list slots
  const tx = L.trayX - 16, tw = L.fw + 32;
  parts.push(h('rect', {x: r(tx + 6), y: r(stage.y + 10), width: r(tw), height: r(stage.h - 12), rx: 10, fill: th.shadow}));
  parts.push(h('rect', {x: r(tx), y: r(stage.y + 4), width: r(tw), height: r(stage.h - 12), rx: 10, fill: '#8a6a4a', stroke: INK, 'stroke-width': 2.6}));
  parts.push(h('rect', {x: r(tx + 10), y: r(stage.y + 12), width: r(tw - 20), height: r(stage.h - 28), rx: 6, fill: '#c9a273'}));
  for (let k = 0; k < n; k++) {
    const sy = L.tierY(k) + L.fh + 4;
    parts.push(h('rect', {x: r(tx + 4), y: r(sy), width: r(tw - 8), height: 9, rx: 3, fill: '#6f5136', stroke: INK, 'stroke-width': 1.6}));
  }
  // feeder rack
  const fx = L.feedX - 12, fwid = L.fw + 24;
  parts.push(h('rect', {x: r(fx), y: r(stage.y + 4), width: r(fwid), height: r(stage.h - 12), rx: 10, fill: '#e3d8c3', stroke: '#b9ab90', 'stroke-width': 2}));
  for (let k = 0; k < n; k++) parts.push(h('path', {d: `M${r(fx + 6)} ${r(L.tierY(k) + L.fh + 6)}H${r(fx + fwid - 6)}`, stroke: '#b9ab90', 'stroke-width': 4}));
  return g({name: `${which}-stage`}, parts);
}

const scene = {
  sizes: {landscape: [1800, 790], square: [1240, 960], portrait: [900, 1290]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const shape = ctx.view.shape;
    const arrs = shape === 'portrait' ? ['column'] : ['row'];
    let L = null, first = null;
    const tried = [];
    outer: for (const fpx of stress ? [23, 21.5, 20, 18.5, 17.2] : [28, 26.5, 25, 23.5, 22, 20.5]) {
      for (const a of arrs) {
        L = geom(ctx, fpx / upx, minF, a);
        if (!first) first = L;
        tried.push(`${fpx}/${a}:${L.why.join('+')}`);
        if (L.ok) break outer;
      }
    }
    if (!L.ok) L = first;
    L.upx = upx;
    L.tried = tried;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const panels = ['A', 'B'].map((which, pi) => {
      const P = L.panels[pi];
      const ord = L.O[which];
      const lcChipX = 10 + 26 + L.discR * 2;
      const chips = p.schedules.map((_, si) => g({name: `${which}-chip${si}`, transform: T(0, 0)}, tabChip(ctx, 0, 0, L.chipS, si, p.schedules[si].tab, show)));
      const low = p.schedules.map((_, si) => g({name: `${which}-fl${si}`, transform: T(L.feedX, L.tierY(si % L.n))}, folderArt(ctx, L, si, `${which}-fla${si}`, show, false)));
      const high = p.schedules.map((_, si) => g({name: `${which}-fh${si}`, transform: T(L.feedX, L.tierY(si % L.n)), opacity: 0}, folderArt(ctx, L, si, `${which}-fha${si}`, show, true)));
      const guide = g({name: `${which}-guide`, opacity: 0},
        h('rect', {name: `${which}-guideF`, x: r(L.trayX - 10), y: r(L.tierY(ord.indexOf(L.O.f)) - 10), width: r(L.fw + 20), height: r(L.fh + 20), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 5}),
        h('rect', {x: r(lcChipX - 8), y: r(L.slotY(ord.indexOf(L.O.f)) - L.chipS / 2 - 8), width: r(L.chipS + 16), height: r(L.chipS + 16), rx: 10, fill: 'none', stroke: th.accent2, 'stroke-width': 5}),
        h('path', {d: `M${r(lcChipX + L.chipS + 8)} ${r(L.slotY(ord.indexOf(L.O.f)))}H${r(L.trayX - 10)}`, stroke: th.accent2, 'stroke-width': 4}),
      );
      void lcChipX;
      return g({name: `${which}-panel`, transform: T(P.x, P.y)}, stageArt(ctx, L, P, which, show), low, chips, high, guide,
        g({name: `${which}-loupeG`, opacity: 0}, loupe(ctx, {name: `${which}-loupe`, R: L.chipS * 0.8, a: 45, handle: L.chipS * 0.9})));
    });
    // shared strip
    const lg = L.legend;
    const legendNodes = [];
    if (show) {
      legendNodes.push(h('rect', {x: r(lg.x), y: r(lg.y), width: r(lg.w), height: r(lg.h - 8), rx: 14, fill: '#fffdf7', stroke: '#c9bb9f', 'stroke-width': 2}));
      if (lg.head) legendNodes.push(txt(lg.head, {x: lg.x + 20, y: lg.y + 10, fill: INK}));
      const y0 = lg.y + 10 + (lg.head ? lg.head.height + 12 : 0);
      lg.items.forEach((it, j) => {
        const cx = lg.x + 20 + (j % lg.colsN) * (lg.itemW + 24), cy = y0 + Math.floor(j / lg.colsN) * (lg.itemH + 8);
        legendNodes.push(tabChip(ctx, cx, cy + (lg.itemH - lg.chipS) / 2, lg.chipS, it.i, p.schedules[it.i].tab, show));
        legendNodes.push(txt(it.fit, {x: cx + lg.chipS + 14, y: cy + (lg.itemH - it.fit.height) / 2, fill: INK}));
      });
    }
    const notes = L.placedNotes.map(pl => g({name: `${pl.q.name}-g`, opacity: pl.q.kind === 'guide' ? 0 : 1}, pl.c.node));
    return g({name: 'scene'}, panels, legendNodes, notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(W.read[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const nodes = {};
    const E = ease.inOutCubic;
    const n = L.n;
    const lcChipX = 10 + 26 + L.discR * 2;
    const looks = {};
    const facts = {};
    const cq = E(seg(a, ...W.change));
    for (const which of ['A', 'B']) {
      const ord = L.O[which];
      const chipsLook = [], foldLook = [];
      // chips: before the change the shared annexes sit loose between the slots; the changed one waits beside the card
      L.O.others.forEach((si, j) => {
        const pre = {x: lcChipX, y: (L.slotY(j) + L.slotY(Math.min(j + 1, n - 1))) / 2 - L.chipS / 2};
        const post = {x: lcChipX, y: L.slotY(ord.indexOf(si)) - L.chipS / 2};
        const P = {x: lerp(pre.x, post.x, cq), y: lerp(pre.y, post.y, cq)};
        nodes[`${which}-chip${si}`] = {transform: T(r(P.x, 2), r(P.y, 2))};
        chipsLook.push({si, x: r(P.x), y: r(P.y)});
      });
      const fPre = {x: L.lcW + 4, y: L.slotY(0) + (L.slotY(n - 1) - L.slotY(0)) / 2 - L.chipS / 2};
      const fPost = {x: lcChipX, y: L.slotY(ord.indexOf(L.O.f)) - L.chipS / 2};
      const arc = Math.sin(Math.PI * cq) * 30;
      const FP = {x: lerp(fPre.x, fPost.x, cq) + arc, y: lerp(fPre.y, fPost.y, cq)};
      nodes[`${which}-chip${L.O.f}`] = {transform: T(r(FP.x, 2), r(FP.y, 2))};
      chipsLook.push({si: L.O.f, x: r(FP.x), y: r(FP.y)});
      // loupe: over the waiting chip (identical), away after the change
      const rq = ease.inOutSine(seg(a, ...W.read)), oq = ease.inOutSine(seg(a, ...W.loupeOut));
      // (the loupe drifts in over the waiting chip, then lifts away; it is not drawn at rest or in the hold)
      const lRead = {x: fPre.x + L.chipS / 2, y: fPre.y + L.chipS / 2};
      const lRest = {x: lRead.x + L.chipS * 0.8, y: lRead.y + L.chipS * 1.6};
      const LP = oq > 0 ? {x: lerp(lRead.x, lRest.x, oq), y: lerp(lRead.y, lRest.y, oq)} : {x: lerp(lRest.x, lRead.x, rq), y: lerp(lRest.y, lRead.y, rq)};
      const lO = oq > 0 ? 1 - oq : clamp(rq * 3);
      nodes[`${which}-loupeG`] = {transform: T(r(LP.x, 2), r(LP.y, 2)), opacity: r(lO, 3)};
      // folders: tier by tier from the top (identical timing in A and B)
      const span = (W.fill[1] - W.fill[0]) / n;
      let seated = 0;
      for (let k = 0; k < n; k++) {
        const si = ord[k];
        const q = seg(a, W.fill[0] + k * span, W.fill[0] + (k + 0.9) * span);
        const P0 = {x: L.feedX, y: L.tierY(si)}, P1 = {x: L.trayX, y: L.tierY(k)};
        const t = E(q);
        const P = {x: lerp(P0.x, P1.x, ease.outCubic(clamp(t * 1.3))), y: lerp(P0.y, P1.y, t) - Math.sin(Math.PI * t) * 14};
        const moved = q > 0;
        nodes[`${which}-fl${si}`] = {opacity: moved ? 0 : 1};
        nodes[`${which}-fh${si}`] = {opacity: moved ? 1 : 0, transform: T(r(P.x, 2), r(P.y, 2))};
        nodes[`${which}-fha${si}-print`] = {opacity: r(q <= 0 || q >= 1 ? 1 : clamp(Math.abs(q - 0.5) * 12 - 4.6), 3)};
        if (q >= 1) seated++;
        foldLook.push({si, x: r(P.x), y: r(P.y)});
      }
      const gq = seg(a, ...W.guide);
      nodes[`${which}-guide`] = {opacity: r(gq, 3)};
      looks[which] = {chips: chipsLook.sort((x, y) => x.si - y.si), folders: foldLook.sort((x, y) => x.si - y.si), loupe: P2(LP), loupeO: r(lO, 3), guide: r(gq, 3)};
      facts[which] = {seated, tierOfChanged: ord.indexOf(L.O.f), order: ord, folderChanged: foldLook.find(f => f.si === L.O.f)};
    }
    for (const pl of L.placedNotes) if (pl.q.kind === 'guide') nodes[`${pl.q.name}-g`] = {opacity: r(seg(a, ...W.guide), 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const fA = facts.A.folderChanged, fB = facts.B.folderChanged;
    return {
      nodes,
      semantic: {
        beat, lookA: looks.A, lookB: looks.B, identical: JSON.stringify(looks.A) === JSON.stringify(looks.B),
        changed: r(cq, 3), seatedA: facts.A.seated, seatedB: facts.B.seated, tierA: facts.A.tierOfChanged, tierB: facts.B.tierOfChanged,
        orderA: facts.A.order, orderB: facts.B.order, changedAnnex: L.O.f, guideShown: looks.A.guide,
        folderA: fA, folderB: fB, dyChanged: r(Math.abs(fA.y - fB.y)),
        side: L.arrangement === 'row', textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), tried: L.ok ? undefined : L.tried.join(' | '),
        problems: L.ok ? [] : L.why, actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'contract-terms-09-contrast',
    title: 'Order of documents, without doctrine — two identical tiered trays: only the supplied position of one annex in the order list differs (listed first vs configured lower), so its folder slides into a different tier',
    titleEs: 'Orden de documentos — Comparación de dos supuestos',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Orden de documentos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical stages, A and B (side by side on wide frames, stacked on tall ones). Each has an order-list card with numbered position slots, a tiered letter tray seen from the front (one tier per position, level with the slots) and a feeder rack with the annex folders in their supplied numbering. The annexes whose position is shared sit loose in the list; the one annex whose position is the changed fact waits beside it, and a loupe reads it. At the change beat that chip enters the list at position 1 in A ("Priority document (as supplied)") and at the configured lower position in B ("Subordinate document, as configured"); the other chips settle into the remaining slots. Tier by tier, with identical timing, each folder slides from the feeder into the tier of its slot, so the changed annex\'s folder ends in a different tier. A guide outlines the changed chip and its folder in both stages; a shared strip names the annexes once, with the shared facts, the changed fact and the key "As supplied · no conclusion drawn". No winner, no outcome; nothing prevails beyond the supplied positions.',
    tags: ['order of documents', 'priority clause', 'annexes', 'schedules', 'comparison', 'contrast', 'letter tray', 'folders', 'tiers', 'changed fact', 'loupe', 'equal weight', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/orden-documentos.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
