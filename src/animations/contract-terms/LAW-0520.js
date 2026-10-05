/**
 * LAW-0520 — Cláusula de cambio · inspect
 *
 * Storyboard (context = the state the story leaves: the procedure track with every station lamp lit, the amendment
 * sheet clipped to the contract with one tab per supplied step):
 *  0.00–0.20  context: "CT-517 · Supply contract (fictional)", "Clause 18 · Changes procedure", the stations "Proposal in
 *             writing", "Reviewed by both parties", "Signed by both parties" and the clipped "Amendment 1 (fictional)".
 *  0.20–0.36  the context steps aside (scaled to about half, text-free while small — it stays a real scene) and a lens
 *             opens on the step plate of the chosen station (default step 2): a real enlarged copy (≥ 1.5×). The plate's
 *             wording is shown in the lens only.
 *  0.40–0.60  in the lens the one datum is substituted: the supplied wording lifts and fades, a small "was: …" trace
 *             keeps it traceable, the new wording (default "Reviewed in a joint meeting (fictional)") fades in and holds;
 *             a ring closes round the plate's step pips so the change reads with labels hidden.
 *  0.68–0.82  the lens closes back onto its plate and the context returns to full size, showing the new wording, the
 *             pip ring and the neutral changed-datum marker (white Δ on the blue disc). Nothing else changes.
 *  0.82–1.00  hold: the note "Only step 2 changed: was “Reviewed by both parties”" and the key "As supplied · no conclusion
 *             drawn". Seeking back restores the supplied wording exactly.
 * Only the supplied steps; no doctrine on the validity or effect of a change or of a changed procedure; no outcome.
 * @module animations/contract-terms/LAW-0520
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {str, int, list, annotation} from '../../schemas/fields.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, stepsField, proposalField, localizeScene, unitPx, T, fitG, txt, chipG,
  contractDoc, amendmentSheet, binderClip, loupe, trayBack, trayLip, notesStrip, trackGeom, stationNode, railNode, bx,
} from './kits/clausula-cambio.js';

const ID = 'LAW-0520';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.4], substitute: [0.4, 0.68], ret: [0.68, 0.82], hold: [0.82, 1]};
const W = {open: [0.2, 0.34], out: [0.42, 0.45], in: [0.45, 0.48], was: [0.48, 0.52], band: [0.48, 0.54], close: [0.68, 0.8], ctxIn: [0.795, 0.82], marker: [0.81, 0.84], notes: [0.83, 0.87], key: [0.84, 0.88]};
const STRINGS = {
  en: {...KIT_STRINGS.en, was: 'was', wasNote: 'Only step {k} changed: was “{v}”'},
  es: {...KIT_STRINGS.es, was: 'antes', wasNote: 'Solo cambió el paso {k}: antes «{v}»'},
};

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  steps: stepsField,
  proposal: proposalField,
  changedStep: int('Which supplied step\'s wording is substituted (1 = first; clamped to the list)', 1, 4),
  afterValue: str('The substituted wording of that step (fictional; the before-value is the step as supplied in steps)', 60),
  annotations: list('Editorial callouts shown in the final hold', annotation(['step', 'contract']), 0, 2),
};
const defaultParams = {...CONTENT, changedStep: 2, afterValue: 'Reviewed in a joint meeting (fictional)', annotations: []};
const defaultParamsEs = {...CONTENT_ES, afterValue: 'Revisada en una reunión conjunta (ficticia)'};

const isStress = p => [p.contract.title, p.clause, p.proposal, p.afterValue, ...p.steps].some(t => t.length > 44) || p.annotations.length > 1;
const stepIndex = p => clamp(p.changedStep, 1, p.steps.length) - 1;

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const pad = 14;
  const ck = stepIndex(p);
  const notes = [];
  if (show) notes.push({name: 'wasnote', kind: 'was', text: ctx.t.wasNote.replace('{k}', String(ck + 1)).replace('{v}', p.steps[ck])});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const ns = notesStrip(ctx, notes, F, minF, {keySize: stress ? minF : undefined});
  const A = {x: pad, y: pad + 8, w: D.w - pad * 2, h: D.h - pad * 2 - 8 - (ns.nh ? ns.nh + 20 : 0)};
  // the after-value must fit the same plate: measure both, size the plate for the larger
  const p2 = {...p, steps: p.steps.map((s, i) => (i === ck && p.afterValue.length > s.length ? p.afterValue : s))};
  const G = trackGeom(ctx, A, F, minF, p2, {stress});
  const why = [...G.why];
  const st = G.stations[ck];
  const P = st.plate;
  const stepFit = fitG(p.steps[ck], {maxWidth: P.w - (shape === 'square' ? 26 : 30), size: G.stepFits[ck].size, minSize: G.stepFits[ck].size, maxLines: 5, weight: 700});
  const afterFit = fitG(p.afterValue, {maxWidth: P.w - (shape === 'square' ? 26 : 30), size: G.stepFits[ck].size, minSize: G.stepFits[ck].size, maxLines: 5, weight: 700});
  if (stepFit.bad || afterFit.bad) why.push('text-plate');
  // step aside: landscape / square → context to the left half, lens at the right; portrait → context to the top half
  const upx = unitPx(ctx);
  const need = (0.375 * 1080) / upx; // lens smaller side (units) for ≥ 35 % of the frame's short side
  // portrait: the context steps up (top-centre anchor) and the lens opens below it; landscape / square: the context
  // steps back to the top-left corner and the lens opens in the lower-right region (diagonal staging fills the box)
  let step, area, corner = false;
  if (shape === 'portrait') {
    const cs = 0.56;
    step = {cs, ax: D.w / 2, ay: A.y};
    const y0 = A.y + A.h * 0.56 + 10;
    area = {x: pad, y: y0, w: D.w - pad * 2, h: A.y + A.h - y0};
  } else if (shape === 'square') {
    const cs = 0.47;
    step = {cs, ax: A.x, ay: A.y + A.h / 2};
    const x0 = A.x + A.w * cs + 30;
    area = {x: x0, y: A.y, w: D.w - pad - x0, h: A.h};
  } else {
    const cs = 0.62;
    step = {cs, ax: A.x, ay: A.y};
    const x0 = A.x + A.w * (shape === 'square' ? 0.22 : 0.4);
    const y0 = A.y + A.h * (shape === 'square' ? 0.4 : 0.36);
    area = {x: x0, y: y0, w: D.w - pad - x0, h: A.y + A.h - y0};
    corner = true;
  }
  const wasSize = Math.max((stress ? 16.4 : 19.8) / upx, F * 0.6);
  const wasFit0 = fitG(`${ctx.t.was}: ${p.steps[ck]}`, {maxWidth: P.w - 20, size: wasSize / 1.5, minSize: wasSize / 1.5, maxLines: 3, weight: 600});
  const wasH = wasFit0.height + 14;
  const srcW = P.w + 28;
  const baseH = P.h + 24 + wasH + 10;
  const k = shape === 'square' ? Math.min(area.w / srcW, 3) : Math.min(area.w / srcW, (area.h * 0.97) / baseH, 4.5);
  const srcH = Math.min(Math.max(baseH, need / k), area.h / k);
  const src = {x: P.x - 14, y: shape === 'square' ? P.y - 12 : P.y - 12 - Math.max(0, (srcH - baseH) / 2), w: srcW, h: srcH};
  const dest = {w: src.w * k, h: src.h * k};
  dest.x = corner ? area.x + area.w - dest.w : area.x + (area.w - dest.w) / 2;
  dest.y = corner ? area.y + area.h - dest.h : area.y + (area.h - dest.h) / 2;
  if (k < 1.5) why.push('lens-small');
  if (Math.min(dest.w, dest.h) < need * 0.94) why.push('lens-px');
  const {pl, bad} = ns.place();
  if (bad) why.push('note-text');
  return {...G, ok: !why.length, why, F, minF, A, ck, stepFit, afterFit, wasFit0, wasSize, src, dest, k, step, notesPl: pl};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1600]},
  layout(ctx) {
    const upx = unitPx(ctx);
    const stress = isStress(ctx.params);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [26, 24, 22.5, 21, 20.2]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const showAll = ctx.show('all');
    const ck = L.ck;
    const st = L.stations[ck];
    const P = st.plate;
    const textY = fit => P.y + 36 + Math.max(0, (P.h - 50 - fit.height) / 2);
    const pipR = clamp(L.discR * 0.32, 6, 9);
    const pipCy = P.y + 22;
    const ring = pre => g({name: `${pre}-band`, opacity: 0},
      h('rect', {x: r(P.x + 7), y: r(pipCy - pipR - 6), width: r((ck + 1) * pipR * 2.8 + 12), height: r(pipR * 2 + 12), rx: r(pipR + 6), fill: 'none', stroke: th.accent2, 'stroke-width': 3.5}));
    // the changed plate's wording: before / after (prefix c = context, l = lens)
    const labels = (pre, show) => (show ? g(null,
      g({name: `${pre}-before`, opacity: 1}, txt(L.stepFit, {x: P.x + 15, y: textY(L.stepFit), fill: INK})),
      g({name: `${pre}-after`, opacity: 0}, txt(L.afterFit, {x: P.x + 15, y: textY(L.afterFit), fill: INK})),
    ) : h('path', {d: `M${r(P.x + 15)} ${r(P.y + 46)}h${r(Math.min(P.w - 30, 150))}`, stroke: '#d6cfc0', 'stroke-width': 10, 'stroke-linecap': 'round'}));
    const content = (pre, show) => {
      const C = L.C, S0 = L.stops[0];
      const sts = L.stations.map(s => stationNode(ctx, L, s, `${pre}-`, show, {lampOn: true, noText: s.k === ck}));
      return g(null,
        g({transform: T(C.x, C.y)}, contractDoc(ctx, {w: C.w, h: C.h, head: L.head, headH: L.headH, headX: L.headX, clause: L.clause, attach: L.attachArea, showText: show, discR: L.discR})),
        railNode(ctx, L, `${pre}-`, 1),
        g({transform: T(S0.x, S0.y)}, trayBack(ctx, L.sw, L.sh)),
        sts.map(s => s.under), sts.map(s => s.plate),
        labels(pre, show), ring(pre),
        g({transform: T(S0.x, S0.y)}, trayLip(ctx, L.sw, L.sh)),
        sts.map(s => s.press),
        g({transform: T(L.attach.x, L.attach.y)}, amendmentSheet(ctx, {w: L.sw, h: L.sh, fit: L.propFit, showText: show, name: `${pre}-am`, n: L.n, edge: L.edge, headH: L.sheetHeadH, tabsOn: true})),
        g({transform: T(L.attach.x + L.sw * 0.16, L.attach.y)}, binderClip(ctx, undefined, Math.min(64, L.sw * 0.3))),
        g({transform: T(L.loupeRest.x, L.loupeRest.y)}, loupe(ctx, undefined, L.LR)),
      );
    };
    // lens content: a copy of the plate (same coordinates) with its labels, ring and the "was" trace
    const stCopy = stationNode(ctx, L, st, 'l-', showAll, {lampOn: true, noText: true});
    const plateCopy = g(null, stCopy.under, stCopy.plate, stCopy.press);
    const wasChip = showAll ? chipG(ctx, `${ctx.t.was}: ${p.steps[ck]}`, {x: P.x + 6, y: P.y + P.h + 8, maxWidth: P.w - 8, size: L.wasSize / 1.5, minSize: L.wasSize / 1.5, padY: 3, maxLines: 3, weight: 600, fill: '#ffffff'}).node : null;
    const lensContent = g(null, plateCopy, labels('l', showAll), ring('l'), g({name: 'l-was', opacity: 0}, wasChip));
    const lz = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: lensContent, color: th.accent2});
    const marker = changedMarker(ctx, {name: 'marker', x: P.x + P.w - 6, y: P.y + 6, radius: 17, opacity: 0});
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'},
      g({name: 'ctx'}, g({name: 'creal'}, content('c', showAll), marker), g({name: 'ghost', opacity: 0}, content('g', false))),
      h('rect', {name: 'srcS', rx: 8, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      g({'data-occludes': 1}, lz.node),
      notes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const lz = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: null});
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const pq = u < W.close[0] ? open : 1 - close;
    Object.assign(nodes, lz.frame(pq, pq));
    for (const nm of ['lens-src', 'lens-coneA', 'lens-coneB']) if (nodes[nm]) nodes[nm] = {...nodes[nm], opacity: 0};
    const copy = clamp((pq - 0.12) / 0.16);
    nodes['lens-content'] = {...nodes['lens-content'], opacity: r(copy, 3)};
    const showT = ctx.show('all');
    const outQ = seg(u, ...W.out), inQ = seg(u, ...W.in);
    const sub = inQ > 0;
    if (showT) {
      nodes['l-before'] = {opacity: r(1 - outQ, 3), transform: `translate(0 ${r(-outQ * 14, 2)})`};
      nodes['l-after'] = {opacity: r(inQ, 3)};
    }
    const bandQ = seg(u, ...W.band);
    nodes['l-band'] = {opacity: r(bandQ, 3)};
    nodes['l-was'] = {opacity: r(seg(u, ...W.was) * (1 - seg(u, W.close[0] - 0.02, W.close[0])), 3)};
    // context step-aside
    const st = L.step;
    const sc = 1 + (st.cs - 1) * ease.inOutSine(pq);
    nodes.ctx = {transform: `translate(${r(st.ax, 2)} ${r(st.ay, 2)}) scale(${r(sc, 4)}) translate(${r(-st.ax, 2)} ${r(-st.ay, 2)})`};
    const tq = clamp((sc - 0.975) / 0.025);
    nodes.creal = {opacity: r(tq, 3)};
    nodes.ghost = {opacity: r(1 - tq, 3)};
    const S2 = L.src, X = v => st.ax + (v - st.ax) * sc, Y = v => st.ay + (v - st.ay) * sc;
    nodes.srcS = {x: r(X(S2.x)), y: r(Y(S2.y)), width: r(S2.w * sc), height: r(S2.h * sc), opacity: pq > 0.05 ? 1 : 0};
    // the context copy of the datum: before until the lens takes it, after once the lens has closed
    const ctxIn = seg(u, ...W.ctxIn);
    const cb = u < W.open[0] ? 1 : u < W.in[0] ? clamp(1 - copy * 8) * tq : 0;
    const ca = u < W.close[0] ? 0 : ctxIn;
    if (showT) { nodes['c-before'] = {opacity: r(cb, 3), transform: 'translate(0 0)'}; nodes['c-after'] = {opacity: r(ca, 3)}; }
    nodes['c-band'] = {opacity: r(u < W.close[0] ? 0 : ctxIn, 3)};
    nodes['g-band'] = {opacity: r(u < W.band[0] ? 0 : 1, 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const noteO = seg(u, ...W.notes), keyO = seg(u, ...W.key);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : noteO, 3)};
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : u < BEATS.ret[1] ? 'return' : 'hold';
    const others = p.steps.filter((s, i) => i !== L.ck);
    return {
      nodes,
      semantic: {
        beat, value: sub ? 'after' : 'before', shownValue: sub ? p.afterValue : p.steps[L.ck], changedStep: L.ck + 1, others,
        lensOpen: r(pq, 3), copyShown: r(copy, 3), contextDatum: r(Math.max(cb, ca), 3), bandShown: r(bandQ, 3), contextScale: r(sc, 3),
        zoom: r(L.k, 3), markerShown: r(seg(u, ...W.marker), 3), keyShown: r(keyO, 3),
        lensBox: bx(L.dest), srcBox: bx(L.src), plateBox: bx(L.stations[L.ck].plate),
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
    slug: 'contract-terms-10-inspect',
    title: 'Change clause, procedure only — the travelled procedure track steps aside and a lens isolates one station\'s step plate; its supplied wording is substituted and the scene returns with the Δ marker',
    titleEs: 'Cláusula de cambio — Inspección y cambio de un dato',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de cambio',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the story\'s end state — the procedure track with every station lit and the amendment clipped to the contract with one tab per step. The context steps aside (about half size) and a lens (≥ 1.5×) opens on one station\'s step plate (default step 2, "Reviewed by both parties"). Its wording is substituted ("Reviewed in a joint meeting (fictional)"), a "was" trace keeps the old wording and a ring closes round the step pips. The lens closes; the context shows the new wording with the neutral Δ marker. Key "As supplied · no conclusion drawn". No doctrine, no validity or effect, no outcome.',
    tags: ['change clause', 'amendment', 'procedure step', 'inspect', 'lens', 'substitution', 'step aside'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-cambio.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
