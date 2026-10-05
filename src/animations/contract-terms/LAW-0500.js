/**
 * LAW-0500 — Cláusula de terminación · inspect
 *
 * Storyboard (context = the state produced by the story's action: the contract board with the card "Communication 1
 * (supplied)" seated in its slot, showing its supplied case — ● "Case provided for (as supplied)" —, the sections of the
 * termination clause, the connector bracket shut on the supplied section and the connector cord drawn from it to the
 * card; the two parties stand beside the board):
 *  0.00–0.20  context at rest in its part of the frame; the other part holds a panel (headline, the ●/◆ legend at equal
 *             weight, the key).
 *  0.20–0.28  isolate: the panel leaves and a lens (the magnifier) grows at its own place: a real enlarged copy (≥ 1.6×)
 *             of the card; the context's card is left blank while the lens shows it (one legible copy at a time).
 *  0.36–0.42  the old case is struck in the lens.
 *  0.47–0.489 the datum changes: the case row turns over and comes back with the supplied alternative — ◆ "Case not
 *             described (as supplied)" — (no value legible for ≤ ~150 ms).
 *  0.50–0.56  only then, the new value legible, its dependent geometry follows in the scene: the cord is withdrawn and
 *             the bracket slides open in its track, as supplied (with the alternative not described → provided for: the
 *             bracket slides shut, then the cord is drawn). Nothing else moves; nothing is concluded.
 *  0.74–0.80  return: the lens closes onto the card, which shows the new case at once; a Δ marks it (0.80–0.81); the
 *             panel comes back with the marker label, the struck "was:" value, the legend and the key "As supplied · no
 *             conclusion drawn". Seeking back restores the old datum exactly.
 * Labels hidden: the same lens on the circumstance card — its state glyph turns ● → ◆ inside the lens (a non-text change).
 * Labels key / none at 1:1 (cf-08 / cf-10 ruling, the LAW-0472/0476/0480/0492 pattern): the context is laid out large
 * (≥ 0.55 of the frame) at rest and at the hold and shrinks only while the lens is open.
 * Texts too long for a printed card (an unbroken long word): print bars decided per card (the circumstance card, the clause
 * cards); the barred cards' texts are listed once in the panel; a barred circumstance card is printed in the lens, its print
 * filling the window. The lens crop never takes in the legs or the floor (the lens copy is clipped to the board).
 * No termination doctrine: no right or ground to terminate, no notice period or time limit, no effect, no validity
 * judgement, no jurisdiction. Provided for and not described have equal weight.
 * @module animations/contract-terms/LAW-0500
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {seg, r, ease} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {measure} from '../../core/text.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, STATES, PX_BASE, PX_STRESS,
  layoutStage, stageArt, makeRigs, nameNodes, oblNodes, eventNode, bracketNode, cordGeom, cordNode, cordFrame, stateGlyph, chipG, eventCard, measureEvent, measureObl, bracketMetrics,
  localizeScene, headBox, overlaps, fitG, widestToken, breakingWords, withWordBreaking,
} from './kits/clausula-terminacion.js';

const ID = 'LAW-0500';
const DURATION = 8000;
const W = {
  open: [0.2, 0.28], strike: [0.36, 0.42], turnOut: [0.47, 0.4795], turnIn: [0.4795, 0.489],
  dep: [0.5, 0.56], close: [0.74, 0.8], marker: [0.799, 0.812], notes: [0.81, 0.85],
  panelOut: [0.18, 0.2], panelIn: [0.8, 0.84], shiftUp: [0.14, 0.2], shiftDown: [0.8, 0.86], shrink: [0.195, 0.245], regrow: [0.75, 0.8],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, was: 'was: {v}'},
  es: {...KIT_STRINGS.es, was: 'antes: {v}'},
};

const sceneSchema = {
  ...motifFields,
  focusTarget: oneOf('The inspected object (the communication card: its supplied case row)', ['caseState']),
  beforeValue: oneOf('The supplied case before the substitution (provided = provided for, undescribed = not described)', STATES),
  afterValue: oneOf('The supplied case after the substitution (provided = provided for, undescribed = not described)', STATES),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens (≥ 1.5; the layout may use less room but never under 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'below'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context headline', 80), marker: str('Label of the changed-datum marker', 70)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  focusTarget: 'caseState',
  beforeValue: 'provided',
  afterValue: 'undescribed',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Communication card, connector and sections, as supplied', marker: 'Changed: the supplied case of communication 1'},
};

const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  contextLabels: {context: 'Tarjeta de la comunicación, conector y apartados, según lo aportado', marker: 'Cambio: el supuesto aportado de la comunicación 1'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.clauses, p.circumstance.label].some(t => t.length > 40);

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const upx = unitPx(ctx);
    const show = ctx.show('all'), showKey = ctx.show('key');
    const stress = isStress(p);
    const box = {x: 6, y: 4, w: D.w - 12, h: D.h - 8};
    const below = p.detailGeometry.placement === 'below' || (p.detailGeometry.placement === 'auto' && shape === 'portrait');
    const headMin = stress ? 45 : shape === 'square' ? 50 : 60;
    // (1:1, labels key / none — cf precedent LAW-0472/0476/0480/0492: the context is laid out large over the frame at
    // rest and at the hold — ≥ 0.55 of the frame — and eases into its part of the frame only while the lens is open: a
    // uniform scale GROW of the lens-time layout, anchored at the box's top-left corner)
    const growMode = !below && shape === 'square' && !show;
    const frameShort = Math.min(ctx.view.width, ctx.view.height);
    const shortU = (0.35 * frameShort) / (upx * frameShort / 1080);
    let best = null;
    /** The panel (rest and hold) in region plr at body size F (print-bar cards: their texts listed once in it). */
    const panelItems = (cardText, oblText) => {
      const leg = (s, pre) => ({name: `${pre}leg-${s}`, kind: 'leg', text: p.stateLabels[s], glyph: s});
      // (print-bar cards: their texts are listed once in the panel)
      // (decided per card: only the texts of the cards drawn with print bars)
      const perfs = pre => (show ? [...(cardText ? [] : [{name: `${pre}-ev`, kind: 'perf', text: `${p.panels.circumstance}: ${p.circumstance.label}`, chk: p.circumstance.label}]), ...(oblText ? [] : p.clauses.map((t, j) => ({name: `${pre}-o${j}`, kind: 'perf', text: t})))] : []);
      const restItems = [];
      if (show) restItems.push({name: 'p-head', kind: 'head', text: p.contextLabels.context}, leg('provided', 'p-'), leg('undescribed', 'p-'), ...perfs('p'));
      if (showKey) restItems.push({name: 'p-key', kind: 'key', text: ctx.t.key});
      const holdItems = [];
      if (show) holdItems.push({name: 'h-head', kind: 'head', text: p.contextLabels.context}, {name: 'h-marker', kind: 'marker', text: p.contextLabels.marker}, {name: 'h-was', kind: 'was', text: ctx.t.was.replace('{v}', p.stateLabels[p.beforeValue])}, leg('provided', 'h-'), leg('undescribed', 'h-'), ...perfs('h'));
      if (show) holdItems.push({name: 'h-final', kind: 'final', text: p.afterValue === 'provided' ? ctx.t.marked : ctx.t.unmarked});
      if (showKey) holdItems.push({name: 'h-key', kind: 'key', text: ctx.t.key});
      return {restItems, holdItems};
    };
    /** Whether every panel text's widest word fits its chip at the body size (else the panel cannot be laid out). */
    const panelWordsFit = (F, plr, cardText, oblText) => {
      const {restItems, holdItems} = panelItems(cardText, oblText);
      // (a print-bar card's listed text may carry a supplied heading word too wide for any chip: chipG breaks such a word)
      return [...restItems, ...holdItems].every(it => widestToken(it.chk ?? it.text, F, it.kind === 'head' ? 700 : 600) <= Math.max(10, plr.w - F * 0.6 - (it.glyph || it.kind === 'marker' ? F * 1.6 : 0) - F * 1.2));
    };
    const panels = (F, plr, cardText, oblText) => {
      const {restItems, holdItems} = panelItems(cardText, oblText);
      const placeCol = items => {
        if (!items.length) return {placed: [], h: 0};
        const maxW = plr.w - F * 0.6;
        const chips = items.map(it => ({it, c: chipG(ctx, it.text, {x: 0, y: 0, maxWidth: maxW - (it.glyph || it.kind === 'marker' ? F * 1.6 : 0), size: F, maxLines: 3, weight: it.kind === 'head' ? 700 : 600})}));
        const hh = chips.reduce((a, q) => a + q.c.box.h + F * 0.45, -F * 0.45);
        let y = plr.y + Math.max(0, (plr.h - hh) / 2);
        const placed = chips.map(q => { const ext = q.it.glyph || q.it.kind === 'marker' ? F * 1.6 : 0; const x = plr.x + (plr.w - q.c.box.w - ext) / 2 + ext; const o = {...q, x, y, ext}; y += q.c.box.h + F * 0.45; return o; });
        return {placed, h: hh, bad: chips.some(q => q.c.fit.bad) || hh > plr.h || chips.some(q => q.c.box.w + (q.it.glyph || q.it.kind === 'marker' ? F * 1.6 : 0) > plr.w)};
      };
      // (the panel keeps the body size: its generic captions — the key, the final tag — may never print larger than the
      // supplied texts on the board)
      const placeAt = (items, Fp) => ({...placeCol(items), F: Fp});
      return {rest: placeAt(restItems, F), hold: placeAt(holdItems, F)};
    };
    const sideShares = show ? [0.55, 0.52, 0.5, 0.495, 0.49, 0.48, 0.46, 0.455, 0.58] : [0.7, 0.67, 0.64, 0.61, 0.58, 0.565, 0.55];
    // (1:1: the board's panels side by side, or stacked — the section over the circumstance — when the side-by-side panels are too
    // narrow for the print)
    // (print bars decided per card — the circumstance card, the clause cards —: both printed first, then the clauses in
    // print bars, then the circumstance card, then both)
    for (const growTo of growMode ? [0.665, 0.655] : [1]) for (const [cardText, oblText] of [[true, true], [true, false], [false, true], [false, false]]) for (const stack of shape === 'square' ? [true, false] : [false]) for (const zt of stack ? (stress ? [2.1, 1.62, 1.57] : [1.57, 1.62, 2.1]) : [1.62, 2.1]) for (const share of below ? (show ? [0.5, 0.46, 0.55] : [0.6, 0.55, 0.5]) : stack && show ? [0.5, 0.48, 0.46, 0.52, 0.55] : sideShares) for (const px of stress ? PX_STRESS : PX_BASE) {
      if (best) break;
      // (labels hidden: the cards carry no print either way — one pass)
      if (!show && !(cardText && oblText)) continue;
      const F = px / upx;
      const grow = growMode ? growTo / share : 1;
      const cb = below ? {x: box.x, y: box.y, w: box.w, h: box.h * share} : {x: box.x, y: box.y, w: box.w * share, h: box.h / grow};
      if (growMode && box.w * share * grow > box.w * 0.8) continue;
      const lr = below ? {x: box.x, y: box.y + box.h * share + F * 0.4, w: box.w, h: box.h * (1 - share) - F * 0.4} : {x: box.x + box.w * share + F * 0.5, y: box.y, w: box.w * (1 - share) - F * 0.5, h: box.h};
      const pad = F * 0.12;
      // (the crop is the circumstance card with its grip tab and the slot's dock round it; when that crop is too short for a real
      // inspection — under 0.35 of the frame's short side once magnified — the card is laid out taller, its print centred,
      // rather than the crop taking in the heading above it)
      let Lc = null, src = null, zoom = 0, minChE = 90 / upx;
      // the panel (rest and hold) in the lens's place (grow mode: right of the LARGE context)
      const plr = grow > 1 ? (() => { const x0 = box.x + cb.w * grow + F * 0.6; return {x: x0, y: box.y, w: box.x + box.w - x0, h: box.h}; })() : lr;
      // (a panel text — a print-bar card's text listed there among them — whose widest word cannot fit its chip: skip)
      if (!breakingWords() && !panelWordsFit(F, plr, cardText, oblText)) continue;
      // (the name plates — they depend only on the context's width and the size —, and a print-bar circumstance card whose widest
      // word cannot fit the widest card even at the smallest lens print: skip at once — the same result as the search)
      if (showKey && p.parties.some(q => fitG(q.name, {maxWidth: Math.min(cb.w * 0.46, 24 * F) - F * 1.2, size: F, maxLines: 3, weight: 600}).bad)) continue;
      if (!cardText && show && !breakingWords()) {
        const s0 = (F * 1.02) / p.detailGeometry.zoom, cwMax = (Math.min(lr.w * 0.96, lr.h * 0.96 * 3) / zt) - F * 0.7 - 5;
        if (widestToken(p.circumstance.label, Math.min(s0, 17 / upx / p.detailGeometry.zoom), 700) > Math.max(10, cwMax - 0.8 * s0)
          || STATES.some(st => widestToken(p.stateLabels[st], s0, 600) > Math.max(10, cwMax - 0.8 * s0 - 1.15 * s0))) continue;
      }
      // (a printed card that cannot fit the widest card the lens allows: skip at once)
      if (cardText && show && !measureEvent(p, F, (Math.min(lr.w * 0.96, lr.h * 0.96 * 3) / zt) - F * 0.7 - 5, true, true, true)) continue;
      // (stacked: the clauses' print cannot fit the widest section panel the board allows — skip at once)
      // (side by side: the same for half the board's inner width)
      if (oblText && show) {
        const kLo = headMin / (82 * upx), Bm = bracketMetrics(F);
        const bw = cb.w - 2 * (98 * kLo + 1 + Math.max(8, F * 0.3)) - 2 * Math.max(12, F * 0.36);
        const wt = stack ? bw - (Bm.gapC + Bm.arm + Bm.gapC + F * 0.45 + Bm.knobDx + Bm.hr + F * 0.35)
          : (bw - Math.max(F, bw * 0.05) - (Bm.gapC + Bm.travel + Bm.knobDx + Bm.hr + F * 0.35)) / 2;
        if (!measureObl(p.clauses, F, wt - 2 * Math.max(6, F * 0.25), true, true)) continue;
      }
      const stageAt = mc => layoutStage(ctx, {
        box: cb, upx, prefix: 'st-', p, px: [px], headMin, headTarget: 0, kMax: show ? (shape === 'square' ? Math.min(1.4, (headMin + 30) / (90 * upx)) : 1.4) : 2, tight: true,
        names: showKey ? p.parties.map(q => q.name) : null, plates: null, notes: [], tray: false, noReach: true, cardText, oblText, stack, knobInBrace: true, eventTextGrow: true, eventFullWidth: true, noTab: true, compactTrack: stack,
        // (the circumstance card no wider than the lens can magnify ≥ 1.6× — or, failing that, ≥ 2.1×: a narrower, taller card)
        cwEMax: (Math.min(lr.w * 0.96, lr.h * 0.96 * 3) / zt) - F * 0.7 - 5,
        minCh: 71 / upx, minChE: mc,
      });
      const srcOf = G => ({x: G.slot.x - G.cwE / 2 - G.tabW - pad, y: G.slot.y - G.chE / 2 - 5 - pad, w: G.cwE + G.tabW + 5 + pad * 2, h: G.chE + 10 + pad * 2});
      for (let tries = 0; tries < 3; tries++) {
        let L1 = stageAt(minChE);
        // (a taller card that no longer fits: the tallest card between the last one that did and the one asked for)
        if (!L1.ok && Lc) {
          let lo = Lc.G.chE, hi = minChE;
          for (let it = 0; it < 5 && hi - lo > 4; it++) {
            const mid = (lo + hi) / 2, Lm = stageAt(mid);
            if (Lm.ok) { lo = mid; L1 = Lm; } else hi = mid;
          }
          if (!L1.ok) break;
          Lc = L1;
          src = srcOf(Lc.G);
          zoom = Math.min(p.detailGeometry.zoom, (lr.w * 0.96) / src.w, (lr.h * 0.96) / src.h);
          break;
        }
        if (!L1.ok) break;
        Lc = L1;
        const G = Lc.G;
        src = srcOf(G);
        zoom = Math.min(p.detailGeometry.zoom, (lr.w * 0.96) / src.w, (lr.h * 0.96) / src.h);
        // (print-bar cards: the card's print, too fine for the context, is printed at its true size — legible only through
        // the lens; the card must be tall enough for it)
        const MeL = !cardText && show ? measureEvent(p, (F * 1.02) / zoom, G.cwE, true, true, true) : null;
        if (MeL && MeL.ch > G.chE + 0.01) { minChE = Math.max(minChE + 1, MeL.ch + 1); continue; }
        if (src.h * zoom >= shortU * 1.01) break;
        minChE = Math.max(minChE + 1, (shortU * 1.03) / zoom - 10 - pad * 2);
      }
      if (!Lc) continue;
      if (src.h * zoom < shortU * 1.01) {
        // (last resort: the crop takes in the board round the card, centred on it as far as the board allows — never past
        // the board's edges (the lens copy is clipped to the board: no legs, no floor); with printed clause cards never
        // above the circumstance panel's heading, since the lens copy holds the circumstance card's print only)
        const need = (shortU * 1.03) / zoom - src.h;
        const G = Lc.G, Bd = G.board;
        const down = Math.max(0, Bd.y + Bd.h - 3 - (src.y + src.h));
        const up = Math.max(0, src.y - (show ? G.panelE.y + G.colHH + 2 : Bd.y + 3));
        if (up + down < need) continue;
        const upA = Math.min(up, need - Math.min(down, need / 2));
        src.y -= upA; src.h += need;
        zoom = Math.min(p.detailGeometry.zoom, (lr.w * 0.96) / src.w, (lr.h * 0.96) / src.h);
        if (src.h * zoom < shortU * 1.01) continue;
      }
      // (≥ 1.6 where the frame allows; the 1:1 stacked board ≥ 1.56 — the hard floor is 1.5 against the rest size at every host
      // size, LENS MAGNIFICATION MARGIN decision 2026-10-04)
      if (zoom < (show ? (stack ? 1.56 : 1.6) : growMode ? 1.52 * grow : 1.52)) continue;
      const lensM = !cardText && show ? lensPrint(p, Lc.G, F, zoom, upx) : null;
      if (!cardText && show && !lensM) continue;
      const dest = {w: src.w * zoom, h: src.h * zoom};
      dest.x = lr.x + (lr.w - dest.w) / 2;
      dest.y = lr.y + (lr.h - dest.h) / 2;
      if (Math.min(dest.w, dest.h) < shortU) continue;
      const pn = panels(F, plr, cardText, oblText);
      if (pn.rest.bad || pn.hold.bad) continue;
      best = {F, px, Lc, src, dest, zoom, lr, cb, share, cardText, oblText, grow, rest: pn.rest, hold: pn.hold, lensM};
    }
    if (!best) return {ok: false, why: ['no-layout-fits'], problems: ['no-layout-fits']};
    const {F, Lc, src, dest, zoom, lr, cb} = best;
    const L = {ok: true, why: [], F, upx, show, showKey, Lc, src, dest, zoom, lr, cb, below, box, cardText: best.cardText, oblText: best.oblText, grow: best.grow, before: p.beforeValue, after: p.afterValue, lensM: best.lensM};
    Lc.rigs = makeRigs(ctx, Lc, p.parties);
    Lc.captions = p.parties.map(q => q.name);
    rebalanceNames(Lc, F);
    L.rest = best.rest;
    L.hold = best.hold;
    L.dyRest = below ? Math.max(0, (L.lr.h - L.rest.h) / 2) : 0;
    L.dyHold = below ? Math.max(0, (L.lr.h - L.hold.h) / 2) : 0;
    if (L.rest.bad || L.hold.bad) { L.why.push('panel-overflow'); L.ok = false; }
    const heads = [headBox(Lc.G.figA), headBox(Lc.G.figB)];
    L.lensClearOfHeads = heads.every(hb => !overlaps(hb, dest, 2));
    L.lensClearOfContext = below ? dest.y >= cb.y + cb.h - 1 : dest.x >= cb.x + cb.w - 1;
    L.contextFrac = below ? 1 : cb.w / box.w;
    if (!L.lensClearOfHeads || !L.lensClearOfContext) { L.why.push('lens-over-context'); L.ok = false; }
    L.problems = L.why;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    if (!L.Lc) return g({name: 'scene'});
    const th = ctx.theme;
    const F = L.F;
    const Lc = L.Lc;
    const st = g({name: 'st-scene'}, stageArt(ctx, Lc), oblNodes(ctx, Lc, p.clauses), bracketNode(ctx, Lc, L.before === 'provided'), eventNode(ctx, Lc, L.before, {at: Lc.G.slot}), cordNode(ctx, {...Lc, P: 'st-'}, cordGeom(Lc.G)), Lc.rigs[0].node, Lc.rigs[1].node, nameNodes(ctx, Lc, Lc.captions));
    const lzL = {...Lc, P: 'lzs-'};
    const strike = L.show ? (() => {
      const G = Lc.G, M = L.lensM ?? G.ME, f = M.st[L.before], Fe = M.F;
      const x0 = G.slot.x - G.cwE / 2, y0 = G.slot.y - G.chE / 2;
      const yS = y0 + M.padY + Math.max(0, (G.chE - M.ch) / 2) + M.labH + Fe * 0.6;
      const x = x0 + M.padX + M.gz;
      // (each line struck along its own length)
      return g({name: 'lzs-strike', opacity: 0}, f.lines.map((ln, i) => h('path', {d: `M${r(x - 2)} ${r(yS + i * f.lineHeight + f.size * 0.55)}h${r(Math.min(M.tw - M.gz, measure(ln, f.size, f.weight, f.family)) + 4)}`, stroke: th.accent, 'stroke-width': r(Math.max(3, Fe * 0.12), 2), 'stroke-linecap': 'round'})));
    })() : null;
    // (print-bar cards: the lens copy also holds the card printed at its true size, shown once the lens is fully open)
    const lzPrint = L.lensM ? g({name: 'lzs-evp', transform: T(r(Lc.G.slot.x, 2), r(Lc.G.slot.y, 2)), opacity: 0}, eventCard(ctx, {name: 'lzs-evp-in', cw: Lc.G.cwE, ch: Lc.G.chE, M: L.lensM, F: L.lensM.F, state: L.before})) : null;
    // (the lens copy: the board — its clause cards as print bars unless the context prints them, the lens holding no
    // print but the circumstance card's — clipped to the board's own outline, so a crop taller than the card never shows the
    // legs or the floor)
    const Bd = Lc.G.board, upL = Lc.G.layerUp;
    const lzObl = L.show && Lc.G.oblText ? null : oblNodes(ctx, {...lzL, G: {...Lc.G, oblText: false, cardText: false}}, p.clauses);
    const lzContent = g(null,
      h('defs', null, h('clipPath', {id: ctx.id('lens-board')}, h('path', {d: roundRectPath(Bd.x - 4, Bd.y - upL * 2 - 4, Bd.w + 8, Bd.h + upL * 2 + 6, 12)}))),
      g({'clip-path': ctx.ref('lens-board')}, g({name: 'lzs-scene'}, stageArt(ctx, lzL), lzObl, eventNode(ctx, lzL, L.before, {at: Lc.G.slot}), lzPrint), strike));
    const lz = growLens(ctx, L, lzContent);
    const panel = (pl, nm) => g({name: nm, opacity: 0}, pl.placed.map(q => {
      const F = pl.F ?? L.F;
      const kids = [g({transform: T(q.x - q.c.box.x, q.y - q.c.box.y)}, q.c.node)];
      if (q.it.glyph) kids.push(stateGlyph(ctx, q.it.glyph, q.x - F * 0.85, q.y + q.c.box.h / 2, F * 0.42));
      if (q.it.kind === 'marker') kids.push(changedMarker(ctx, {x: q.x - F * 0.85, y: q.y + q.c.box.h / 2, radius: F * 0.6}));
      if (q.it.kind === 'was') kids.push(h('path', {d: `M${r(q.x + q.c.box.w * 0.08)} ${r(q.y + q.c.box.h / 2)}H${r(q.x + q.c.box.w * 0.92)}`, stroke: th.inkSoft, 'stroke-width': 2.4}));
      return g({name: q.it.name}, kids);
    }));
    // the Δ beside the circumstance card (in the gutter between the panels, level with the card's top)
    const G = Lc.G;
    // (stacked panels: beside the card, in the board's right column under the bracket's track)
    // (side by side: under the card's lower right corner when the panel has room there, else in the gutter by its top)
    const roomBelow = G.panelE.y + G.panelE.h - (G.slot.y + G.chE / 2 + 5);
    const mk = !G.stack && roomBelow >= F * 1.7 ? changedMarker(ctx, {name: 'st-delta', x: G.slot.x + G.cwE / 2 - F * 0.75, y: G.slot.y + G.chE / 2 + 5 + F * 0.8, radius: F * 0.6, opacity: 0})
      : G.stack ? stackDelta(ctx, G, F)
      : changedMarker(ctx, {name: 'st-delta', x: G.panelE.x + G.panelE.w + G.gw / 2, y: G.slot.y - G.chE / 2 + F * 0.6, radius: Math.min(F * 0.6, G.gw * 0.45), opacity: 0});
    // (the lens's tie back to its source: a soft callout wedge from the circumstance card's slot to the lens window, behind the
    // board and the people — it shows between them, so the enlarged copy reads as the card's, not as a new object)
    const link = h('path', {name: 'lens-link', d: 'M0 0', fill: th.fg, 'fill-opacity': 0.07, stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '9 7', 'stroke-linejoin': 'round', opacity: 0});
    return g({name: 'scene'}, link, st, mk, panel(L.rest, 'panel-rest'), panel(L.hold, 'panel-hold'), lz.node);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    if (!L.Lc) return {nodes: {}, semantic: {layoutOk: false, why: L.why.join(','), problems: L.problems}};
    const nodes = {};
    const Lc = L.Lc, G = Lc.G;
    const after = u >= W.turnIn[0];
    const dep = ease.inOutSine(seg(u, ...W.dep));
    const open = ease.inOutSine(seg(u, ...W.open)) * (1 - ease.inOutSine(seg(u, ...W.close)));
    const hand = handOver(open);
    for (const P of ['st-', 'lzs-']) poseCopy(nodes, L, P, u, hand);
    // the bracket (the context only): its supplied place for the before state, then for the after state
    // (and the connector cord, drawn only while the case is provided for: withdrawn before the bracket opens, drawn after
    // it has closed — cause before effect)
    const bx = s => (s === 'provided' ? G.B.closedX : G.B.openX);
    const cv = s => (s === 'provided' ? 1 : 0);
    const opening = L.before === 'provided' && L.after !== 'provided', closing = L.before !== 'provided' && L.after === 'provided';
    const brQ = opening ? seg(dep, 0.45, 1) : closing ? seg(dep, 0, 0.55) : dep;
    const cordQ = opening ? 1 - seg(dep, 0, 0.45) : closing ? seg(dep, 0.55, 1) : cv(L.before);
    const brX = bx(L.before) + (bx(L.after) - bx(L.before)) * brQ;
    Object.assign(nodes, cordFrame('st-', r(cordQ, 4)));
    nodes['st-br'] = {transform: T(r(brX, 2), r(G.B.top, 2))};
    const posed = [G.figA, G.figB].map((fg, i) => Lc.rigs[i].frame({x: fg.x, y: fg.floor, facing: fg.f, scale: fg.k, headTilt: 3}));
    posed.forEach(q => Object.assign(nodes, q.nodes));
    const gs = L.grow > 1 ? 1 + (L.grow - 1) * (u < 0.5 ? 1 - ease.inOutSine(seg(u, ...W.shrink)) : ease.inOutSine(seg(u, ...W.regrow))) : 1;
    Object.assign(nodes, lensFrame(L, open, gs).nodes);
    if (L.show) nodes['lzs-strike'] = {opacity: r(seg(u, ...W.strike) * (1 - seg(u, ...W.turnOut)) * (L.lensM ? printOn(open) : 1), 3)};
    if (L.lensM) {
      nodes['lzs-evp'] = {opacity: printOn(open)};
      poseCopy(nodes, L, 'lzs-evp-', u, hand);
    }
    nodes['panel-rest'] = {opacity: r(1 - seg(u, ...W.panelOut), 3) * (u < W.panelIn[0] ? 1 : 0)};
    nodes['panel-hold'] = {opacity: r(seg(u, ...W.panelIn), 3)};
    for (const q of L.hold.placed) nodes[q.it.name] = {opacity: q.it.kind === 'key' ? r(seg(u, ...W.notes), 3) : 1};
    for (const q of L.rest.placed) nodes[q.it.name] = {opacity: 1};
    const lift = u < 0.5 ? L.dyRest * (1 - ease.inOutSine(seg(u, ...W.shiftUp))) : L.dyHold * ease.inOutSine(seg(u, ...W.shiftDown));
    const ctxT = L.grow > 1 ? growT(L, gs) : T(0, r(lift, 2));
    nodes['st-scene'] = {transform: ctxT};
    nodes['st-delta'] = {opacity: r(seg(u, ...W.marker), 3), transform: ctxT};
    const turnV = after ? seg(u, ...W.turnIn) : 1 - seg(u, ...W.turnOut);
    const stateNow = after ? L.after : L.before;
    return {
      nodes,
      semantic: {
        lensOpen: r(open, 3), datum: after ? 'after' : 'before', dep: r(dep, 3),
        cord: r(cordQ, 3), connected: cordQ >= 1,
        bracket: dep <= 0 ? (L.before === 'provided' ? 'closed' : 'open') : dep >= 1 ? (L.after === 'provided' ? 'closed' : 'open') : 'moving',
        contextValue: hand.ctx > 0.5 ? p.stateLabels[stateNow] : null, contextState: hand.ctx > 0.5 ? stateNow : null,
        lensValue: hand.copy > 0.5 ? p.stateLabels[stateNow] : null, lensState: hand.copy > 0.5 ? stateNow : null, valueLegible: r(turnV, 3),
        zoom: r(L.zoom, 3), contextFrac: r(L.contextFrac, 3), lensClearOfHeads: L.lensClearOfHeads, lensClearOfContext: L.lensClearOfContext,
        markerVisible: seg(u, ...W.marker) >= 1, strike: r(seg(u, ...W.strike) * (1 - seg(u, ...W.turnOut)), 3),
        before: L.before, after: L.after,
        allReached: posed.every(q => q.reached), layoutOk: L.ok, why: L.why.join(','), problems: L.problems,
        textPx: r(L.F * L.upx, 2), cardText: L.cardText, oblText: L.oblText, eventPx: r(G.ME.F * L.upx, 2), headPx: r(90 * G.k * L.upx * gs, 1), contextScale: r(gs, 4), zoomVsRest: r(L.zoom / (L.grow ?? 1), 3),
      },
    };
  },
};

/**
 * The print of a print-bar circumstance card as the lens shows it (its true size, legible only through the lens): as large as
 * the card holds — from about 3.2× down to the body size once magnified — with the context card's own inner padding (at
 * least 0.6 of the print size) round it, so the state glyph never hugs the card's edge. The state row (the inspected
 * datum) is sized first; the label as large as fits beside it (≤ 1.3× the state’s size, ≥ 17 px, ≤ 3 lines; a long unbroken word
 * may hold it smaller). Null when even the body size does not fit.
 */
function lensPrint(p, G, F, zoom, upx) {
  const padIn = G.ME.padX;
  for (const kf of [3.2, 3, 2.8, 2.6, 2.4, 2.2, 2, 1.85, 1.7, 1.55, 1.4, 1.3, 1.2, 1.1, 1.02]) {
    const sz = (F * kf) / zoom;
    const padX = Math.max(padIn, sz * 0.6), padY = sz * 0.5, gz = sz * 1.15;
    const tw = G.cwE - 2 * padX;
    if (tw < sz * 6) continue;
    const st = {
      provided: fitG(p.stateLabels.provided, {maxWidth: tw - gz, size: sz, maxLines: 4, weight: 600, strict: true}),
      undescribed: fitG(p.stateLabels.undescribed, {maxWidth: tw - gz, size: sz, maxLines: 4, weight: 600, strict: true}),
    };
    if (st.provided.bad || st.undescribed.bad) continue;
    const stH = Math.max(st.provided.height, st.undescribed.height);
    // (the label as large as fits — up to 1.3× the state's size, never under 17 px once magnified)
    let label = null;
    const lMin = Math.min(F * 1.02, 17 / upx) / zoom;
    for (let ls = sz * 1.3; ls >= lMin - 1e-6; ls = ls > lMin && ls * 0.92 < lMin ? lMin : ls * 0.92) {
      // (the centred label keeps the card's own inner padding; the wider state padding is for its glyph)
      const f = fitG(p.circumstance.label, {maxWidth: G.cwE - 2 * padIn, size: ls, maxLines: 3, weight: 700, strict: true});
      if (!f.bad) { label = f; break; }
      // (a word too wide for the lens print at this size: broken — after its own hyphens, else mid-word — so the print can
      // stay large in the lens rather than shrink to fit the unbroken word)
      if (widestToken(p.circumstance.label, ls, 700) > G.cwE - 2 * padIn) {
        const fb = withWordBreaking(() => fitG(p.circumstance.label, {maxWidth: G.cwE - 2 * padIn, size: ls, maxLines: 4, weight: 700, strict: true}));
        if (!fb.bad) { label = fb; break; }
      }
    }
    if (!label) continue;
    const ch = padY + label.height + sz * 0.6 + stH + padY;
    if (ch > G.chE + 0.01) continue;
    return {label, st, stH, ch, padX, padY, gz, tw, labH: label.height, F: sz};
  }
  // (a card too narrow for that: the body size with the card's own metrics, as before)
  const M = measureEvent(p, (F * 1.02) / zoom, G.cwE, true, true, true);
  return M && M.ch <= G.chE + 0.01 ? M : null;
}

/** A wrapped block whose last line is one bare word ("Maria-Fernanda / Castellanos / Villavicencio"). */
const bareLast = lines => lines.length > 1 && lines.join(' ').split(/\s+/).length >= 3 && /^[\p{L}][\p{L}'’-]*[\p{L}][,;:.]?$/u.test(lines[lines.length - 1].trim());

/**
 * Name plates whose wrap leaves a bare last word (a narrow 1:1 context): the plate is widened — up to half the context,
 * the two plates never meeting — until the name wraps without one (never more lines than before, so the plate's height
 * reserved under the feet still holds it).
 */
function rebalanceNames(Lc, F) {
  const G = Lc.G;
  if (!G.names) return;
  const half = (Lc.box.w - F * 0.8) / 2;
  G.names = G.names.map((q, i) => {
    if (!q || !bareLast(q.fit.lines)) return q;
    for (let w = q.maxW + F * 0.5; w <= half + 1e-6; w += F * 0.5) {
      const f = fitG(Lc.captions[i], {maxWidth: w - F * 1.2, size: F, maxLines: 3, weight: 600});
      if (!f.bad && !bareLast(f.lines) && f.lines.length <= q.fit.lines.length) return {fit: f, maxW: w};
    }
    return q;
  });
}

/**
 * The Δ of the stacked board (1:1): the circumstance card spans the panel, so the Δ sits in the panel's heading band, at its
 * right end — clear of the heading's print (or its bar) and above the slot's dock — or, if the heading leaves no room
 * there, at the band's left end.
 */
function stackDelta(ctx, G, F) {
  const c = G.panelE;
  const dockTop = G.slot.y - G.chE / 2 - 5;
  const band = dockTop - c.y;
  const rad = Math.min(F * 0.6, band * 0.4);
  const f = G.headFits[0];
  const hw = f ? f.width : c.w * 0.4;
  const cy = c.y + Math.min(G.colHH, band) / 2 + 1;
  const right = c.x + c.w - rad - Math.max(6, F * 0.3);
  const x = right - rad >= c.x + c.w / 2 + hw / 2 + F * 0.3 ? right : c.x + rad + Math.max(6, F * 0.3);
  return changedMarker(ctx, {name: 'st-delta', x, y: cy, radius: rad, opacity: 0});
}

/** The lens's current size factor and the copy's current magnification (it starts at about the context's own size). */
function lensNow(L, open) {
  const s0 = 1 / L.zoom;
  const sc = s0 + (1 - s0) * open;
  return {sc, zoomNow: L.zoom * sc};
}

/** Hand-over between the context's card print and the lens copy: the context copy fades before the lens copy shows. */
function handOver(open) {
  if (open <= 0) return {ctx: 1, copy: 0};
  return {ctx: r(1 - seg(open, 0, 0.04), 3), copy: r(seg(open, 0.05, 0.12), 3)};
}

/** A lens that grows at its own place (the panel's), never over the context. (Copied from LAW-0492.) */
function growLens(ctx, L, content) {
  const th = ctx.theme;
  const clipId = 'lens-clip';
  return {node: g({name: 'lens'},
    h('path', {name: 'lens-src', d: roundRectPath(L.src.x, L.src.y, L.src.w, L.src.h, 10), fill: 'none', stroke: th.fg, 'stroke-width': 4, opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'lens-cliprect', rx: 22}))),
    g({name: 'lens-win', opacity: 0, 'data-occludes': 1},
      h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
      h('rect', {name: 'lens-bg', rx: 22, fill: th.paper}),
      g({'clip-path': ctx.ref(clipId)}, g({name: 'lens-content'}, g({name: 'lens-cfade', opacity: 0}, content))),
      h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.fg, 'stroke-width': 5})))};
}

/** The grow-mode transform of the context at scale gs (anchored at the box's top-left corner). */
function growT(L, gs) {
  const ax = L.box.x, ay = L.box.y;
  return `translate(${r(ax - ax * gs, 2)} ${r(ay - ay * gs, 2)}) scale(${r(gs, 4)})`;
}

function lensFrame(L, open, gsAt = 1) {
  const {sc, zoomNow} = lensNow(L, open);
  const D = L.dest, S = L.src;
  const cx = D.x + D.w / 2, cy = D.y + D.h / 2;
  const R = {x: cx - D.w * sc / 2, y: cy - D.h * sc / 2, w: D.w * sc, h: D.h * sc};
  const vis = open > 0.001;
  const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
  const hand = handOver(open);
  return {nodes: {
    'lens-src': {opacity: vis ? 1 : 0, transform: L.grow > 1 ? growT(L, gsAt) : ''},
    'lens-cliprect': rect,
    'lens-win': {opacity: vis ? 1 : 0},
    'lens-shadow': {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height},
    'lens-bg': rect,
    'lens-border': rect,
    'lens-content': {transform: `${T(R.x - S.x * zoomNow, R.y - S.y * zoomNow)} scale(${r(zoomNow, 4)})`},
    'lens-cfade': {opacity: hand.copy},
    'lens-link': {opacity: vis ? r(Math.min(1, open * 4), 3) : 0, d: vis ? linkPath(L, R, gsAt) : 'M0 0'},
  }, zoomNow};
}

/** The callout wedge from the source crop (where the context draws it now) to the lens window R. */
function linkPath(L, R, gs) {
  const S = L.src;
  const k = L.grow > 1 ? gs : 1, ax = L.box.x, ay = L.box.y;
  const X = x => ax + (x - ax) * k, Y = y => ay + (y - ay) * k;
  const pts = L.below
    ? [[X(S.x), Y(S.y + S.h)], [R.x, R.y], [R.x + R.w, R.y], [X(S.x + S.w), Y(S.y + S.h)]]
    : [[X(S.x + S.w), Y(S.y)], [R.x, R.y], [R.x, R.y + R.h], [X(S.x + S.w), Y(S.y + S.h)]];
  return `M${pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}Z`;
}

/** The fine print of a print-bar card: shown in one step once the lens is (almost) fully open — legible only there. */
function printOn(open) {
  return open >= 0.985 ? 1 : 0;
}

/** Pose one copy's circumstance card: the state row by the datum (turning over), blank in the context while the lens holds it. */
function poseCopy(nodes, L, P0, u, hand) {
  const lens = P0 !== 'st-';
  const P = P0 === 'lzs-evp-' ? 'lzs-evp-in' : `${P0}ev-in`;
  const after = u >= W.turnIn[0];
  const v0 = 1 - seg(u, ...W.turnOut), v1 = seg(u, ...W.turnIn);
  const ctxOn = lens ? 1 : hand.ctx;
  const same = L.before === L.after;
  nodes[`${P}-label`] = {opacity: ctxOn};
  // (one state group per state; with before = after the one group turns over in place)
  if (same) nodes[`${P}-st-${L.before}`] = {opacity: r((after ? v1 : v0) * ctxOn, 3)};
  else {
    nodes[`${P}-st-${L.before}`] = {opacity: r(after ? 0 : v0 * ctxOn, 3)};
    nodes[`${P}-st-${L.after}`] = {opacity: r(after ? v1 * ctxOn : 0, 3)};
  }
  if (P0 === 'lzs-' && L.show) {
    // (the lens copy shows no printed text but the circumstance card's: the rest of the board stays out of it)
    nodes['lzs-board-head'] = {opacity: 0};
    for (const nm of ['circumstance', 'section']) if (L.Lc.G.headFits[0]) nodes[`lzs-panel-${nm}-head`] = {opacity: 0};
  }
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-05-inspect',
    title: 'Termination clause, without doctrine — inspecting the communication card and substituting its supplied case',
    titleEs: 'Cláusula de terminación — Inspección y cambio de un dato',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The contract board after the story\'s action: the card "Communication 1 (supplied)" seated in its slot with its supplied case ● "Case provided for (as supplied)", the sections of the termination clause, a neutral connector bracket shut on the supplied section and the connector cord drawn to the card, the two parties beside the board. A lens grows beside the scene with a real enlarged copy of the card; the old case is struck, the case row turns over to the supplied alternative ◆ "Case not described (as supplied)" and only then the cord is withdrawn and the bracket slides open, as supplied. The lens closes onto the card, a Δ marks it and the panel shows the marker, the struck "was:" value, the ●/◆ legend at equal weight and the key "As supplied · no conclusion drawn". Seeking back restores the old datum. No termination doctrine and no conclusion.',
    tags: ['termination clause', 'communication', 'provided for', 'not described', 'section', 'connector', 'bracket', 'lens', 'substitution', 'changed datum', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-terminacion.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
