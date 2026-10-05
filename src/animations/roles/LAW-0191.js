/**
 * LAW-0191 — Atención en registro · contrast
 *
 * Two complete registry windows (same people, window, printer, checklist and
 * choreography, same scale and timing). Exactly one supplied fact differs:
 * the status of ONE checklist item — A "Presentación recibida" (every item
 * received as supplied) vs B "documentación pendiente" (that item supplied
 * as pending). The difference changes objects and sequence, not only text:
 * B's bundle holds one sheet fewer, so one fewer sheet steps out of the fan
 * and the clerk's pen draws a dashed empty ring on that row where A's pen
 * taps a filled dot. Both clerks still print a slip and hand it back — the
 * scene draws no consequence from the pending item.
 *  0.00–0.17  base: two identical windows at rest; the filer holds a squared
 *             bundle (only its front sheet shows), so A and B look the same.
 *  0.17–0.40  change: the bundle is handed over at a shared point in both
 *             scenes; the fans open — A shows every sheet, B one fewer.
 *  0.40–0.77  parallel: row-by-row check (dot / dashed ring on the changed
 *             row), bundle laid down, slip printed and handed back, on one clock.
 *  0.77–1.00  guide: both changed rows are ringed and linked by a comparison
 *             guide; a neutral note states that no winner, score or outcome is
 *             drawn. Shared content (people, the checklist items, the slip's
 *             reference, shared facts) is drawn once in a common strip.
 * @module animations/roles/LAW-0191
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {contrastFields} from '../../schemas/fields.js';
import {connector, textBlock} from '../../primitives/annotate.js';
import {
  regFields, REG_DEFAULTS, KIT_STRINGS, RG, captionOf, itemColor, measureCard, measureSlip, stageGeometry, registryStage,
  keyChip, looksOf, legendPlate, fitWords, wchip, overlaps, badWrap, intakeTargets, intakeReach, leanFor, intakeFrame,
} from './kits/atencion-en-registro.js';

const ID = 'LAW-0191';
const DURATION = 7500;
const CHANGE = 0.17;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
/** Intake windows (shared by both scenes). */
const W = {
  bub: [0.1, 0.14], bubClose: [0.19, 0.22],
  raise: [0.17, 0.235], reachC: [0.2, 0.245], hold: [0.245, 0.27], take: [0.27, 0.305], fDrop: [0.27, 0.31],
  fan: [0.275, 0.31], penTo: [0.29, 0.315], check: [0.31, 0.53], penBack: [0.53, 0.565],
  lay: [0.535, 0.57], toKey: [0.57, 0.59], press: [0.59, 0.605], rise: [0.597, 0.63],
  toSlip: [0.605, 0.63], tear: [0.63, 0.64], carry: [0.64, 0.675], fReach: [0.637, 0.675], both: [0.675, 0.69],
  fRead: [0.69, 0.735], cBack: [0.69, 0.735],
  rings: [0.76, 0.8], guide: [0.78, 0.84], note: [0.82, 0.87], key: [0.83, 0.87],
};
const LANE = {a: '#3d5a6c', b: '#7a5c8e'};

const STRINGS = {
  en: {...KIT_STRINGS.en, people: 'Same people in both scenes', sameItems: 'Same checklist in both scenes', both: 'same in both scenes', changed: 'Changed fact'},
  es: {...KIT_STRINGS.es, people: 'Mismas personas en ambas escenas', sameItems: 'Misma lista en ambas escenas', both: 'igual en ambas escenas', changed: 'Hecho cambiado'},
};

const sceneSchema = {
  ...regFields,
  props: obj('Intake content shared by both scenes (supplied, fictional)', {
    items: list('Checklist items in order (the same in both scenes)', str('Item name', 60), 2, 4),
    changedItem: int('0-based index of the item supplied as pending in scenario B (received in A)', 0, 3),
    reference: str('Entry reference printed on both slips (fictional)', 32),
  }),
  objectLabels: obj('Labels printed with the shared strip', {checklist: str('Checklist title', 50), slip: str('Name of the slip', 40)}),
  ...contrastFields(),
};

const defaultParams = {
  ...REG_DEFAULTS,
  props: {items: ['Filing form', 'Cover letter', 'Annex 1 · site plan'], changedItem: 2, reference: 'REF-0427 (fictional)'},
  objectLabels: {checklist: 'Intake checklist', slip: 'Entry reference'},
  scenarioA: {label: 'Filing received', caption: 'Every item received as supplied'},
  scenarioB: {label: 'Documentation pending', caption: 'One item pending as supplied'},
  changedFact: 'Annex 1 · site plan: received in A, pending in B (as supplied)',
  sharedFacts: ['Same window, same clerk, same checklist', 'A slip is printed and handed back in both'],
  comparisonLabels: {guide: 'Only this row differs', neutral: 'Two supplied situations side by side: no winner, score or outcome is drawn'},
};

const CFG = {
  landscape: {size: 21, arrangement: 'row'},
  // square: the two scenes stacked in the left column, the shared strip in the right-hand column
  square: {size: 20, arrangement: 'stackL'},
  portrait: {size: 21, arrangement: 'column', namesOnCards: true},
};
/** Scene crop (stage units): from the window casing down to mid-shin (the people are seen almost whole). */
const TOP0 = -452;
const CROP = -60;

/** Pictogram speech bubble (stage units): a stack of sheets — the request, without text. */
function pictoBubble(ctx, name, {x, y, tip}) {
  const th = ctx.theme;
  const w = 104, hh = 72, rr = 18;
  const bx = Math.max(x + rr + 14, Math.min(x + w - rr - 14, tip.x + 6));
  const d = `M${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${y + hh - rr}Q${x + w} ${y + hh} ${x + w - rr} ${y + hh}H${r(bx + 12)}L${r(tip.x)} ${r(tip.y)}L${r(bx - 12)} ${y + hh}H${x + rr}Q${x} ${y + hh} ${x} ${y + hh - rr}V${y + rr}Q${x} ${y} ${x + rr} ${y}Z`;
  const sheet = (dx, dy, c) => g(null,
    h('path', {d: roundRectPath(x + 34 + dx, y + 14 + dy, 32, 42, 3), fill: th.paper, stroke: '#1f2328', 'stroke-width': 2}),
    h('rect', {x: x + 38 + dx, y: y + 19 + dy, width: 24, height: 5, rx: 2, fill: c}));
  const node = g({name, opacity: 0},
    h('path', {d, fill: th.shadow, transform: T(5, 7)}),
    h('path', {d, fill: th.card, stroke: '#3b4450', 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    // the bubble's body without its tail (an unpainted box, used by the face-clearance check)
    h('rect', {name: `${name}-body`, x, y, width: w, height: hh, fill: 'none'}),
    sheet(-10, 4, th.accent3), sheet(0, 0, th.accent2),
    h('path', {d: `M${x + 76} ${y + 36}l10 0m-5 -5l5 5l-5 5`, fill: 'none', stroke: '#1f2328', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
  return {node, box: {x, y, w, h: hh}, frame: o => ({[name]: {opacity: r(clamp(o * 3), 3), transform: o >= 1 || o <= 0 ? '' : scaleAbout(tip.x, tip.y, 0.3 + 0.7 * ease.outCubic(o))}})};
}

function tryLayout(ctx, S, k) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const C = CFG[ctx.view.shape];
  const row = C.arrangement === 'row';
  const stackL = C.arrangement === 'stackL';
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const problems = [];
  const labels = p.props.items;
  const ci = Math.min(p.props.changedItem, labels.length - 1);
  const itemsA = labels.map(label => ({label, status: 'received'}));
  const itemsB = labels.map((label, i) => ({label, status: i === ci ? 'pending' : 'received'}));
  const colors = labels.map((_, i) => itemColor(ctx, i));
  const su = S / k;

  // ---- one stage geometry for both scenes (numbers-only card: the item names are in the shared strip)
  // stacked (portrait): the item names are printed on both cards (no list block in the strip — the wider
  // scene then fills the width at a smaller scale, leaving height for the strip); otherwise numbers only
  let names = Boolean(C.namesOnCards);
  let M = null, cardW = 0;
  if (names) {
    for (const w of [240, 280, 320, 360, 400, 460, 520]) {
      const m = measureCard(ctx, {items: itemsA, title: null, su, w});
      if (!m.truncated) { M = m; cardW = w; break; }
    }
    // names too long for a card: numbers on the cards, the names in the shared list
    if (!M) names = false;
  }
  if (!names) {
    const probe = measureCard(ctx, {items: itemsA, title: null, su, w: 400, numbersOnly: true});
    const numW = Math.max(...probe.rows.map(rw => rw.fit.width));
    cardW = probe.textX + numW + probe.pad;
    M = measureCard(ctx, {items: itemsA, title: null, su, w: cardW, numbersOnly: true});
  }
  // the slip prints the supplied reference as real text (at the scene's text size; no header band)
  let SM = null, slipW = 0;
  for (const w of [130, 150, 170, 190, 215, 240, 270, 300, 330]) {
    const m = measureSlip(ctx, {su, header: null, ref: p.props.reference, w});
    if (!m.truncated && m.ref.lines.length <= 3) { SM = m; slipW = w; break; }
  }
  if (!SM) return {ok: false, problems: ['slip']};
  // a flatter fan held a little lower keeps each scene short (the window top is cropped)
  // a tall checklist: the clerk is seated higher (static — never rising during the action)
  let G = null, lean = null;
  for (const clerkLift of [0, 30, 60, 90]) {
    G = stageGeometry({cardW, cardH: M.h, slipW, slipH: SM.h, walk: 0, displayDy: 64, fan: {x: -30, y: -9}, clerkLift});
    lean = leanFor(G, M, G.card.x0);
    if (lean) break;
  }
  const xL = G.filerX - 76, xR = G.winX1 + 22;
  // the crop's top follows a tall checklist card or a higher-seated clerk (the clerk's head is never cut)
  const TOP = Math.min(TOP0, G.card.y0 - 14, G.clerk.sy - 136 * G.clerk.k - 14);
  const sw = (xR - xL) * k, sh = (CROP - TOP) * k;
  if (!lean) return {ok: false, problems: ['slot-reach']};

  // ---- scenario headers (design units): lane badge + label + caption, both at readable sizes
  const hLab = [p.scenarioA, p.scenarioB].map(sc => fitWords(sc.label, {maxWidth: sw - S * 2.6, size: S, minSize: S, maxLines: 2, weight: 800}));
  const hCap = [p.scenarioA, p.scenarioB].map(sc => (showAll && sc.caption ? fitWords(sc.caption, {maxWidth: sw - S * 2.6, size: S, minSize: S, maxLines: 2, weight: 500}) : null));
  if ([...hLab, ...hCap].some(f => f && (f.truncated || badWrap(f)))) return {ok: false, problems: ['header']};
  const headH = Math.max(...[0, 1].map(i => (showKey ? hLab[i].height : S) + (hCap[i] ? S * 0.45 + hCap[i].height : 0))) + S * 0.6;
  // stacked: the gap between the scenes holds the guide label beside the guide's vertical run
  const gProbe = showAll ? wchip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: Math.min(440, D.w * 0.55), size: S, minSize: S, maxLines: 2, weight: 700}) : null;
  const gap = row ? Math.max(30, S * 1.6) : Math.max(S * 1.2, gProbe ? gProbe.box.h + 20 : 0);
  // ---- panels
  let panels, pairW, pairH;
  if (row) {
    pairW = sw * 2 + gap;
    pairH = headH + sh;
  } else {
    pairW = sw;
    pairH = (headH + sh) * 2 + gap;
  }
  if (pairW > D.w - 12) return {ok: false, problems: ['too-wide']};
  // shared strip below (landscape / square) or below the pair (portrait)
  const stripTop0 = 8 + pairH + S * 0.9;
  const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  // stacked-left (square): the scenes hug the left edge, the shared strip takes the right-hand column
  const x0 = stackL && showKey ? 8 : (D.w - pairW) / 2;
  const colX = x0 + pairW + 28;
  if (stackL && showKey && D.w - 8 - colX < 260) return {ok: false, problems: ['too-wide']};
  const scW = sw;
  panels = [0, 1].map(i => row
    ? {x: x0 + i * (sw + gap), y: 8 + headH, hy: 8}
    : {x: x0, y: 8 + headH + i * (headH + sh + gap), hy: 8 + i * (headH + sh + gap)});
  const looks = looksOf(ctx, p);
  const mk = (pfx, items, pan) => {
    const ox = pan.x - xL * k, oy = pan.y - TOP * k;
    return registryStage(ctx, {prefix: pfx, G, looks, items, card: {M, showText: showAll}, slipM: SM, showText: showAll, colors, place: {ox, oy, k}, crop: CROP, noSign: true, cover: true});
  };
  const stA = mk('a', itemsA, panels[0]);
  const stB = mk('b', itemsB, panels[1]);
  const TR = intakeTargets(stA, G, SM);
  if (!intakeReach(G, TR, lean)) return {ok: false, problems: ['reach']};

  // ---- headers
  const hdr = [0, 1].map(i => {
    const pan = panels[i];
    const R = S * 0.95;
    const parts = [h('circle', {cx: pan.x + R, cy: pan.hy + R, r: R, fill: LANE[i ? 'b' : 'a'], stroke: th.ink, 'stroke-width': 2.5})];
    if (showKey) {
      parts.push(h('text', {x: pan.x + R, y: pan.hy + R + S * 0.42, 'text-anchor': 'middle', 'font-size': S * 1.15, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i ? 'B' : 'A'));
      parts.push(textBlock(hLab[i], {x: pan.x + R * 2 + S * 0.6, y: pan.hy + R - hLab[i].size * 0.62, fill: th.fg}));
      if (hCap[i]) parts.push(textBlock(hCap[i], {x: pan.x + R * 2 + S * 0.6, y: pan.hy + R - hLab[i].size * 0.62 + hLab[i].height + S * 0.45, fill: th.fgSoft}));
    }
    return g({name: `hdr${i}`}, parts);
  });

  // ---- filer's picto bubble (stage units, inside each scene)
  const tip = stA.filerMouthAt(G.filerX);
  const bubbles = [stA, stB].map((st, i) => {
    const b = pictoBubble(ctx, `pb${i}`, {x: G.filerX + 46, y: TOP + 6, tip});
    return b;
  });

  // ---- clip each scene to its panel (the knees are cut by the frame, like a medium shot)
  const clips = [0, 1].map(i => ({id: `scene${i}-clip`, x: xL, y: TOP, w: xR - xL, h: CROP - TOP}));

  // ---- the comparison guide: rings round the changed row in both cards, linked by a routed line
  const ringBox = st => {
    const q = st.cardSlot(ci);
    const rowM = M.rows[ci];
    const d0 = st.toD({x: st.cardBox.x + 4, y: q.y - rowM.h / 2 - 6});
    return {x: d0.x, y: d0.y, w: (st.cardBox.w - 8) * k, h: (rowM.h + 12) * k};
  };
  const rA = ringBox(stA), rB = ringBox(stB);
  let guidePts;
  if (row) {
    const yg = panels[0].y + sh + S * 0.6;
    guidePts = [{x: rA.x + rA.w / 2, y: rA.y + rA.h}, {x: rA.x + rA.w / 2, y: yg}, {x: rB.x + rB.w / 2, y: yg}, {x: rB.x + rB.w / 2, y: rB.y + rB.h}];
  } else {
    const xg = Math.min(D.w - 10, rA.x + rA.w + 16);
    guidePts = [{x: rA.x + rA.w, y: rA.y + rA.h / 2}, {x: xg, y: rA.y + rA.h / 2}, {x: xg, y: rB.y + rB.h / 2}, {x: rB.x + rB.w, y: rB.y + rB.h / 2}];
  }
  const glen = guidePts.slice(1).reduce((s0, q, i) => s0 + Math.hypot(q.x - guidePts[i].x, q.y - guidePts[i].y), 0);
  const guideD = guidePts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');

  // ---- shared strip (design units): drawn ONCE for both scenes — people and their relationship,
  // the checklist items, shared facts with the slip reference and the changed fact, legend, key and note.
  // Blocks are measured for a column width and packed into 1–4 columns (shortest column first).
  const capS = S;
  const occupied = [...panels.map(pan => ({x: pan.x, y: pan.hy, w: scW, h: headH + sh}))];
  let guideLab = null;
  const guideMaxW = row ? Math.max(220, Math.abs(guidePts[2].x - guidePts[1].x) - 40) : Math.min(440, D.w * 0.55);
  if (showAll) {
    const m0 = guidePts[1], m1 = guidePts[2];
    const probe = wchip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, anchor: 'middle', maxWidth: guideMaxW, size: capS, minSize: capS, maxLines: 2, weight: 700});
    if (probe.fit.truncated || badWrap(probe.fit)) problems.push('guide-lab');
    // beside its own line: under the horizontal run (row), left of the vertical run (column)
    const gx = row ? (m0.x + m1.x) / 2 : m0.x - 12 - probe.box.w / 2;
    const gy = row ? m0.y + 8 : (panels[0].y + sh + panels[1].hy) / 2 - probe.box.h / 2;
    guideLab = wchip(ctx, p.comparisonLabels.guide, {x: gx, y: gy, anchor: 'middle', maxWidth: guideMaxW, size: capS, minSize: capS, maxLines: 2, weight: 700, stroke: th.accent});
    if (!row && overlaps(guideLab.box, {x: 0, y: panels[1].hy, w: D.w, h: headH}, 2)) problems.push('guide-lab');
  }
  const stripY = stackL ? 8 : row ? Math.max(8 + pairH + S * 0.8, guideLab ? guideLab.box.y + guideLab.box.h + S * 0.6 : 0) : 8 + pairH + S * 0.8;
  const rel = p.relationships[0];
  const lh = S * 0.42;
  const blocks = [];
  if (showKey) {
    // people + relationship: chips joined by the relation line, the supplied label beside it
    blocks.push(w => {
      const fch = wchip(ctx, captionOf(p, 'filer'), {x: 0, y: 0, maxWidth: w, size: S, minSize: S, maxLines: 2});
      const cch = wchip(ctx, captionOf(p, 'clerk'), {x: 0, y: 0, maxWidth: w, size: S, minSize: S, maxLines: 2});
      const labText = rel.label || ctx.t[rel.kind] || rel.kind;
      const lab = showAll ? wchip(ctx, labText, {x: 0, y: 0, maxWidth: Math.max(120, w - 44), size: capS, minSize: capS, maxLines: 2, weight: 600}) : null;
      const bad = [fch, cch, ...(lab ? [lab] : [])].some(c => c.fit.truncated || badWrap(c.fit));
      const gapV = Math.max(S * 2.2, lab ? lab.box.h + 12 : 0);
      const hh = fch.box.h + gapV + cch.box.h;
      return {bad, w: Math.max(fch.box.w, cch.box.w, lab ? lab.box.w + 44 : 0), h: hh, draw: (x, y) => {
        const fN = wchip(ctx, captionOf(p, 'filer'), {x, y, maxWidth: w, size: S, minSize: S, maxLines: 2, name: 'pchip-f'});
        const cy = y + fch.box.h + gapV;
        const cN = wchip(ctx, captionOf(p, 'clerk'), {x, y: cy, maxWidth: w, size: S, minSize: S, maxLines: 2, name: 'pchip-c'});
        const A = {x: x + 26, y: y + fN.box.h}, B = {x: x + 26, y: cy};
        const fromF = rel.from === 'filer';
        relConn = connector(ctx, {name: 'rel0', from: fromF ? A : B, to: fromF ? B : A, kind: rel.kind, bend: 0, color: th.fgSoft});
        if (lab) relLab = wchip(ctx, labText, {x: x + 42, y: (A.y + B.y) / 2 - lab.box.h / 2, maxWidth: Math.max(120, w - 44), size: capS, minSize: capS, maxLines: 2, weight: 600, stroke: th.fgSoft});
        nodes.push(fN.node, cN.node);
      }};
    });
    // checklist items (the same list in both scenes), each with its swatch colour and number
    if (!names) blocks.push(w => {
      const title = fitWords(`${p.objectLabels.checklist} · ${ctx.t.sameItems}`, {maxWidth: w, size: capS, minSize: capS, maxLines: 3, weight: 800});
      const rows = labels.map((l, i) => fitWords(`${i + 1}  ${l}`, {maxWidth: w - 18, size: S, minSize: S, maxLines: 3, weight: 600}));
      const bad = [title, ...rows].some(f => f.truncated || badWrap(f));
      const hh = title.height + lh + rows.reduce((s0, f) => s0 + f.height + lh, 0) - lh;
      return {bad, w: Math.max(title.width, ...rows.map(f => f.width + 18)), h: hh, draw: (x, y) => {
        const parts = [textBlock(title, {x, y, fill: th.fg})];
        let yy = y + title.height + lh;
        rows.forEach((f, i) => {
          parts.push(h('rect', {x, y: r(yy + f.size * 0.1), width: 8, height: r(f.size), rx: 2, fill: colors[i]}));
          parts.push(textBlock(f, {x: x + 18, y: yy, fill: th.fg}));
          yy += f.height + lh;
        });
        nodes.push(g({name: 'list'}, parts));
      }};
    });
    // shared facts; then the slip's reference (same in both) with the changed fact (two blocks, so they pack)
    const factBlock = (name, list0) => w => {
      const fs = list0.map(q => ({f: fitWords(q.text, {maxWidth: w, size: S, minSize: S, maxLines: 4, weight: q.weight}), c: q.c}));
      const bad = fs.some(q => q.f.truncated || badWrap(q.f));
      const hh = fs.reduce((s0, q) => s0 + q.f.height + lh, 0) - lh;
      return {bad, w: Math.max(...fs.map(q => q.f.width)), h: hh, draw: (x, y) => {
        const parts = [];
        let yy = y;
        for (const q of fs) { parts.push(textBlock(q.f, {x, y: yy, fill: q.c})); yy += q.f.height + lh; }
        nodes.push(g({name}, parts));
      }};
    };
    if (p.sharedFacts.length) blocks.push(factBlock('facts', p.sharedFacts.map(f => ({text: `• ${f}`, weight: 500, c: th.fgSoft}))));
    blocks.push(factBlock('facts2', [
      // (item names on the cards: the checklist's title is named here, once)
      ...(names ? [{text: `${p.objectLabels.checklist} · ${ctx.t.sameItems}`, weight: 800, c: th.fg}] : []),
      {text: `${p.objectLabels.slip}: ${p.props.reference} · ${ctx.t.both}`, weight: 600, c: th.fg},
      {text: `${ctx.t.changed}: ${p.changedFact}`, weight: 700, c: th.fg},
    ]));
    // glyph legend, the key and the neutral note
    blocks.push(w => {
      const lg = legendPlate(ctx, {name: 'legend', x: 0, y: 0, S: capS, received: ctx.t.received, pending: ctx.t.pendingAs, maxW: w});
      const kc = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: w, size: capS, minSize: capS, maxLines: 2});
      const nt = showAll ? wchip(ctx, p.comparisonLabels.neutral, {x: 0, y: 0, maxWidth: w, size: capS, minSize: capS, maxLines: 4, weight: 500}) : null;
      const bad = lg.truncated || kc.fit.truncated || badWrap(kc.fit) || (nt && (nt.fit.truncated || badWrap(nt.fit)));
      const hh = lg.box.h + 10 + kc.box.h + (nt ? 10 + nt.box.h : 0);
      return {bad, w: Math.max(lg.box.w, kc.box.w, nt ? nt.box.w : 0), h: hh, draw: (x, y) => {
        legend = legendPlate(ctx, {name: 'legend', x, y, S: capS, received: ctx.t.received, pending: ctx.t.pendingAs, maxW: w});
        key = keyChip(ctx, ctx.t.key, {x, y: y + legend.box.h + 10, maxWidth: w, size: capS, minSize: capS, maxLines: 2, name: 'key'});
        if (nt) note = wchip(ctx, p.comparisonLabels.neutral, {x, y: key.box.y + key.box.h + 10, maxWidth: w, size: capS, minSize: capS, maxLines: 4, weight: 500, name: 'note'});
      }};
    });
  }
  const nodes = [];
  let relConn = null, relLab = null, legend = null, key = null, note = null;
  let yEnd = stripY;
  if (blocks.length) {
    let best = null;
    const colGap = 36;
    for (const n of stackL ? [1] : [5, 4, 3, 2, 1]) {
      const cw = stackL ? D.w - 8 - colX : (D.w - 24 - (n - 1) * colGap) / n;
      if (cw < 200) continue;
      const ms = blocks.map(f => f(cw));
      if (ms.some(m => m.bad)) continue;
      const cols = Array.from({length: n}, () => ({h: 0, items: []}));
      for (const m of ms) {
        const c = cols.reduce((a0, b0) => (b0.h < a0.h ? b0 : a0));
        c.items.push(m);
        c.h += (c.items.length > 1 ? S * 0.9 : 0) + m.h;
      }
      const hh = Math.max(...cols.map(c => c.h));
      if (!best || hh < best.hh - 0.5) best = {n, cw, cols, hh};
    }
    // one column per block with its own width: widen the tallest block while the row still fits
    if (!stackL && blocks.length > 1) {
      const avail = D.w - 24 - colGap * (blocks.length - 1);
      const ws = blocks.map(() => 200);
      let ms = blocks.map((f, i) => f(ws[i]));
      for (let i = 0; i < blocks.length; i++) while (ms[i].bad && ws[i] < avail) { ws[i] += 20; ms[i] = blocks[i](ws[i]); }
      if (!ms.some(m => m.bad)) {
        for (let guard = 0; guard < 200; guard++) {
          const tallest = ms.reduce((bi, m, i) => (m.h > ms[bi].h ? i : bi), 0);
          if (ws.reduce((a0, b0) => a0 + b0, 0) + 20 > avail) break;
          const m2 = blocks[tallest](ws[tallest] + 20);
          ws[tallest] += 20;
          if (!m2.bad) ms[tallest] = m2;
        }
        const hh = Math.max(...ms.map(m => m.h));
        if (ws.reduce((a0, b0) => a0 + b0, 0) <= avail && (!best || hh < best.hh - 0.5)) best = {n: ms.length, cols: ms.map(m => ({h: m.h, items: [m]})), hh};
      }
    }
    // stacked (portrait): blocks assigned to 2–3 columns of their own widths (exhaustive over a small grid)
    if (!row && !stackL && blocks.length > 1) {
      const WS = [];
      for (let w = 220; w <= D.w - 24; w += 40) WS.push(w);
      const cache = blocks.map(f => WS.map(w => f(w)));
      const nb = blocks.length;
      for (const n of [2, 3]) {
        const total = n ** nb;
        for (let code = 0; code < total; code++) {
          const asg = [];
          let c0 = code;
          for (let i = 0; i < nb; i++) { asg.push(c0 % n); c0 = Math.floor(c0 / n); }
          if (new Set(asg).size < n) continue;
          // each column: the narrowest width whose total height is minimal within an even share of the width
          const colsW = [];
          let okA = true;
          const colH = wi => (col => col.reduce((s0, bi, j) => s0 + cache[bi][wi].h + (j ? S * 0.9 : 0), 0));
          const members = Array.from({length: n}, (_, cI) => asg.map((a0, i) => (a0 === cI ? i : -1)).filter(i => i >= 0));
          // greedy widths: start at the smallest width with no bad block, widen the tallest column while it fits
          const wi = members.map(col => { let x = 0; while (x < WS.length && col.some(bi => cache[bi][x].bad)) x++; return x; });
          if (wi.some(x => x >= WS.length)) okA = false;
          if (!okA) continue;
          const widthOf = () => wi.reduce((s0, x) => s0 + WS[x], 0) + colGap * (n - 1);
          if (widthOf() > D.w - 24) continue;
          for (let guard = 0; guard < 60; guard++) {
            const hs = members.map((col, cI) => colH(wi[cI])(col));
            const t = hs.indexOf(Math.max(...hs));
            if (wi[t] + 1 >= WS.length) break;
            wi[t]++;
            if (widthOf() > D.w - 24 || members[t].some(bi => cache[bi][wi[t]].bad)) { wi[t]--; break; }
          }
          const hs = members.map((col, cI) => colH(wi[cI])(col));
          const hh = Math.max(...hs);
          if (!best || hh < best.hh - 0.5) {
            best = {n, cols: members.map((col, cI) => ({h: hs[cI], items: col.map(bi => blocks[bi](WS[wi[cI]]))})), hh};
          }
          colsW.length = 0;
        }
      }
    }
    if (!best) return {ok: false, problems: ['strip']};
    const used = best.cols.map(c => Math.max(...c.items.map(m => m.w), 0));
    const totalW = used.reduce((a0, b0) => a0 + b0, 0) + colGap * (best.n - 1);
    let x = stackL ? colX : Math.max(12, (D.w - totalW) / 2);
    best.cols.forEach((c, ci2) => {
      let y = stripY;
      for (const m of c.items) { m.draw(x, y); y += m.h + S * 0.9; }
      x += used[ci2] + colGap;
    });
    yEnd = stripY + best.hh;
  }

  // vertical centring of the whole composition
  const total = stackL ? Math.max(pairH, yEnd - 8) : yEnd - 8;
  if (total > D.h - 16) problems.push('too-tall');
  if (problems.length) return {ok: false, problems};
  const dy = Math.max(0, (D.h - 16 - total) / 2);

  // equal weight: both scenes share one geometry and scale
  const laneFrac = scW / ctx.design.w;
  return {
    ok: true, problems, S, k, su, G, M, SM, stA, stB, TR, lean, panels, sh, sw, headH, hdr, bubbles, clips, xL, xR,
    rA, rB, guideD, glen, guideLab, relConn, relLab, nodes, key, legend, note, dy, ci, itemsA, itemsB,
    top: TOP, colors, row, stackL, laneFrac, vFill: (total) / (D.h - 16), guidePts,
  };
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const tries = [];
    const D = ctx.design;
    for (let S = C.size; S >= 16 - 1e-6; S -= 0.5) {
      // the largest scene scale first: side by side each scene ≥ 40 % of the width, stacked ≥ 80 %
      for (let k = 1.4; k >= 0.4; k -= 0.02) {
        const L = tryLayout(ctx, S, k);
        if (L.ok) {
          // side by side each scene ≥ 40 % of the width; stacked beside the strip each ≥ 40 % of the height;
          // stacked full width ≥ 80 % of the width
          const narrow = L.row ? L.sw / D.w < 0.4 : L.stackL ? (L.headH + L.sh) / D.h < 0.4 : L.sw / D.w < 0.8;
          if (narrow) { tries.push(`${S}/${r(k)}:narrow`); break; }
          return {...L, tries};
        }
        if (L.problems.some(q => ['too-wide', 'too-tall'].includes(q))) continue;
        tries.push(`${S}/${r(k)}:${L.problems.join('+')}`);
      }
    }
    throw new Error(`${ID}: no layout fits (${tries.slice(-5).join(' | ')})`);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const scenes = [L.stA, L.stB].map((st, i) => {
      const pan = L.panels[i];
      const cp = L.clips[i];
      return g({name: `scene${i}`},
        h('defs', null, h('clipPath', {id: ctx.id(cp.id)}, h('rect', {x: cp.x, y: cp.y, width: cp.w, height: cp.h, rx: 18}))),
        g({transform: T(pan.x - L.xL * L.k, pan.y - L.top * L.k, 0, L.k)},
          g({'clip-path': ctx.ref(cp.id)}, st.node, L.bubbles[i].node),
          h('rect', {x: cp.x, y: cp.y, width: cp.w, height: cp.h, rx: 18, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2 / L.k})));
    });
    const ring = (b, name) => h('path', {name, d: roundRectPath(b.x - 3, b.y - 3, b.w + 6, b.h + 6, 10), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0});
    return g({transform: T(0, L.dy)},
      L.hdr,
      scenes,
      ring(L.rA, 'ringA'), ring(L.rB, 'ringB'),
      h('path', {name: 'guide', d: L.guideD, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.glen)} ${r(L.glen + 10)}`, 'stroke-dashoffset': r(L.glen)}),
      L.guideLab && g({name: 'guide-labg', opacity: 0}, L.guideLab.node),
      L.nodes,
      L.relConn && g({name: 'relg'}, L.relConn.node),
      L.relLab && g({name: 'rell0'}, L.relLab.node),
      L.legend && L.legend.node,
      L.key && g({name: 'keyg', opacity: 0}, L.key.node),
      L.note && g({name: 'noteg', opacity: 0}, L.note.node),
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const nodes = {};
    const look = (st, fr, pz) => ({
      bundle: fr.sem.bundleHolder, visibleSheets: fr.sem.fan.filter((v, j) => j === 0 || v > 0.02).length * (fr.sem.bundleHolder === 'filer' ? 0 : 1),
      fan: fr.sem.fan.filter(v => v > 0).map(v => r(v, 3)), dots: fr.sem.dots.map(v => r(v, 3)), rings: fr.sem.rings.map(v => r(v, 3)),
      slip: fr.sem.slipHolder, rise: r(fr.sem.slipRise, 3), bubble: r(pz, 3),
      // what is actually visible of the bundle: the neutral cover sheet in front plus every sheet that has
      // stepped out of the stack (their index-tab colours, in order) — identical in A and B while squared
      sheetsShown: ['cover', ...st.recv.filter((_, j) => (fr.sem.fan[j] || 0) > 0.02).map(i => L.colors[i])],
      sheetCountShown: 1 + fr.sem.fan.filter(v => v > 0.02).length,
    });
    const out = [];
    const bubO = seg(u, ...W.bub) * (1 - seg(u, ...W.bubClose));
    [[L.stA, L.itemsA], [L.stB, L.itemsB]].forEach(([st, items], i) => {
      const fr = intakeFrame(st, L.TR, W, u, items, L.lean, {fanAll: W.fan});
      const posed = st.pose(fr.input);
      Object.assign(nodes, posed.nodes);
      Object.assign(nodes, L.bubbles[i].frame(bubO));
      out.push({fr, posed, look: look(st, fr, bubO)});
    });
    const rings = ease.inOutSine(seg(u, ...W.rings));
    nodes.ringA = {opacity: r(rings, 3)};
    nodes.ringB = {opacity: r(rings, 3)};
    const gp = ease.inOutSine(seg(u, ...W.guide));
    nodes.guide = {'stroke-dashoffset': r(L.glen * (1 - gp))};
    if (L.guideLab) nodes['guide-labg'] = {opacity: r(seg(u, W.guide[1] - 0.02, W.guide[1] + 0.02), 3)};
    if (L.key) nodes.keyg = {opacity: r(seg(u, ...W.key), 3)};
    if (L.note) nodes.noteg = {opacity: r(seg(u, ...W.note), 3)};
    if (L.relConn) Object.assign(nodes, L.relConn.frame(1, 1));
    const [A, B] = out;
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = (x, st) => {
      const s = x.posed.semantic, f = x.fr.sem;
      return {
        filerHand: s.filerHand, clerkL: s.clerkL, pen: s.pen, bundleC: s.bundleC, slipC: s.slipC,
        gripF: f.bundleHolder === 'filer' ? s.bundleL : f.slipHolder === 'filer' ? s.slipL : null,
        gripC: f.bundleHolder === 'clerk' ? s.bundleR : f.slipHolder === 'clerk' ? s.slipR : null,
        clerkOnBundle: f.inHold ? s.bundleR : null,
        filerOnSlip: f.inSlipBoth ? s.slipL : null,
        tapTarget: f.tapping ? {x: r(st.toD(f.tapping).x), y: r(st.toD(f.tapping).y)} : null,
        received: f.dots.filter(v => v >= 1).length, pendingMarked: f.rings.filter(v => v >= 1).length,
        bundleHolder: f.bundleHolder, slipHolder: f.slipHolder, allReached: s.allReached,
      };
    };
    const a = pick(A, L.stA), b = pick(B, L.stB);
    const flat = {};
    for (const [k0, v] of Object.entries(a)) flat[`${k0}A`] = v;
    for (const [k0, v] of Object.entries(b)) flat[`${k0}B`] = v;
    return {
      nodes,
      semantic: {
        ...flat,
        a, b,
        lookA: A.look, lookB: B.look,
        beat,
        changedItem: L.ci,
        rings: r(rings, 3), guideProgress: r(gp, 3),
        guideShown: gp >= 1, noteShown: Boolean(L.note) && seg(u, ...W.note) >= 1, keyShown: Boolean(L.key) && seg(u, ...W.key) >= 1,
        allReached: a.allReached && b.allReached,
        arrangement: L.row ? 'row' : L.stackL ? 'stackL' : 'column', sceneHFrac: r((L.headH + L.sh) / ctx.design.h, 3), sceneFrac: r(L.laneFrac, 3), vFill: r(L.vFill, 3),
        labelsFit: L.ok, textSize: L.S, scale: r(L.k, 3),
        sameGeometry: true,
        laneColors: {a: LANE.a, b: LANE.b, alarm: ctx.theme.accent},
        mainActionEnd: W.fRead[1],
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
    slug: 'roles-08-contrast',
    title: 'Registry window — filing received vs documentation pending',
    titleEs: 'Atención en registro — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Atención en registro',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical registry windows run the same intake on one clock: the bundle is handed over, fanned and checked row by row against the same checklist, a slip is printed and handed back. Only the supplied status of one item differs: in B that item is pending, so its sheet is missing from the fan and its row gets a dashed empty ring where A gets a dot. A guide links the two rows; a neutral note draws no winner, score or consequence.',
    tags: ['registry', 'filing', 'contrast', 'checklist', 'pending item', 'received', 'entry reference', 'slip', 'hand-off', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/atencion-en-registro.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
