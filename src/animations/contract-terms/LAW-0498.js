/**
 * LAW-0498 — Cláusula de terminación · mechanism
 *
 * Storyboard (top-down light table; transparent layers — capas — whose printed half-frames join):
 *  0.00–0.18  separated: on a glowing light table lies the contract sheet ("CT-731 · Contract (fictional)",
 *             "Termination clause", its supplied sections and an empty band below them). Beside it (left and right
 *             wings in 16:9 and 1:1; above it in 9:16) wait two transparent layers: "Circumstance 1 (supplied)"
 *             (amber) and "Communication 1 (supplied)" (blue). Each carries one printed half-frame — "[" on the
 *             circumstance layer, "]" on the communication layer — at the height of the supplied target. A
 *             magnifier rests on the table.
 *  0.18–0.43  the only relation drawn is the supplied one: the circumstance layer slides onto the sheet and registers,
 *             then the communication layer; their half-frames close into one outline around the supplied section
 *             (provided for) — or around the empty band below the sections (not described: no section is outlined,
 *             nothing else changes). No arrows (a plain relation, not a cause).
 *  0.43–0.75  tracer: the magnifier travels the traversal order (default: circumstance tab → joined outline →
 *             communication tab), enlarging what lies under its glass (a real 1.7× copy) and dwelling on the focus
 *             element; then it is parked back on the table, clear of all text.
 *  0.75–1.00  hold: the case chip (● "Case provided for (as supplied)" or ◆ "Case not described (as supplied)",
 *             drawn alike) and the key "As supplied · no conclusion drawn".
 * No termination doctrine: no ground or right to terminate, no notice period or time limit, no effect, no validity
 * judgement, no jurisdiction. The two cases have equal weight.
 * @module animations/contract-terms/LAW-0498
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {list, oneOf, annotation, obj, str} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, sectionField, communicationField,
  stateLabelsField, finalStateField, sectionIndex, localizeScene, unitPx, fitG, chipG, txt, caseGlyph, contractSheet,
  magnifier, lensCentre,
} from './kits/terminacion-comunicaciones.js';

const ID = 'LAW-0498';
const DURATION = 6500;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], hold: [0.75, 1]};
const W = {layerA: [0.18, 0.3], layerB: [0.3, 0.42], joined: [0.41, 0.45], trace: [0.45, 0.72], park: [0.72, 0.79], final: [0.76, 0.81], key: [0.79, 0.84], notes: [0.81, 0.86]};
const ELEMENTS = ['circumstance', 'section', 'communication'];
const ZOOM = 1.6;
const FOLD = 0.22;

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  section: sectionField,
  circumstance: obj('The supplied circumstance, printed on the amber layer (a generic, fictional placeholder)', {label: str('Label of the circumstance layer (e.g. "Circumstance 1 (supplied)")', 60)}, ['label']),
  communication: communicationField,
  stateLabels: stateLabelsField,
  focusElement: oneOf('Element the magnifier dwells on longest (it is enlarged under the glass)', ELEMENTS),
  traversalOrder: list('Order in which the magnifier visits the elements', oneOf('Element id', ELEMENTS), 2, 3),
  annotations: list('Editorial callouts shown in the final hold', annotation(ELEMENTS), 0, 2),
  finalState: finalStateField({provided: 'the two half-frames close around the supplied section', undescribed: 'the two half-frames close around the empty band below the sections; no section is outlined'}),
};

const defaultParams = {
  ...CONTENT,
  circumstance: {label: 'Circumstance 1 (supplied)'},
  focusElement: 'section',
  traversalOrder: ['circumstance', 'section', 'communication'],
  annotations: [],
  finalState: 'provided',
};
const defaultParamsEs = {
  ...CONTENT_ES,
  circumstance: {label: 'Circunstancia 1 (aportada)'},
};

const isStress = p => [...p.clauses, p.communication.label, p.circumstance.label, p.contract.title, p.stateLabels.provided, p.stateLabels.undescribed].some(t => t.length > 40) || p.annotations.length > 1;

function geom(ctx, F, minF, mode) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14;
  const portraitish = mode === 'top';
  // notes (annotations, the case chip, the key)
  const notes = [];
  if (show) p.annotations.forEach((an, i) => notes.push({name: `note${i}`, kind: 'note', text: an.text, target: an.target}));
  if (show) notes.push({name: 'final', kind: 'final', text: p.stateLabels[p.finalState]});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  const worst = q => (q.kind === 'final' ? (p.stateLabels.provided.length > p.stateLabels.undescribed.length ? p.stateLabels.provided : p.stateLabels.undescribed) : q.text);
  const chipOf = (q, x, y, w, text) => chipG(ctx, text ?? q.text, {x, y, maxWidth: w, size: F, minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name,
    glyph: q.kind === 'final' ? (gx, gy, rr) => caseGlyph(ctx, p.finalState, gx, gy, rr) : null,
    fill: q.kind === 'final' ? ctx.theme.accent2Soft : ctx.theme.card});
  const gap = 16;
  const groupH = w => notes.reduce((acc, q) => acc + chipOf(q, 0, 0, w, worst(q)).box.h + gap, 0) - (notes.length ? gap : 0);
  const R = clamp(F * 3.1, 70, 120);
  const hl = R * 1.5;
  const lupaZone = 2 * R + 36;
  let table, notesBox, lupaRest;
  if (!portraitish) {
    const nw = clamp(D.w * 0.24, 340, 500);
    table = {x: pad, y: pad, w: D.w - pad * 2 - nw - 24, h: D.h - pad * 2};
    notesBox = {x: table.x + table.w + 24, y: pad, w: nw, h: D.h - pad * 2 - lupaZone - 10};
    lupaRest = {x: notesBox.x + 6, y: D.h - pad - R - 12, a: -12};
  } else {
    const nh = notes.length ? groupH(D.w - pad * 2) : 0;
    table = {x: pad, y: pad, w: D.w - pad * 2, h: D.h - pad * 2 - lupaZone - (nh ? nh + 20 : 0)};
    lupaRest = {x: pad + 20, y: table.y + table.h + 18 + R, a: 0};
    notesBox = {x: pad, y: table.y + table.h + lupaZone, w: D.w - pad * 2, h: nh};
  }
  const fr = 22;
  const surf = {x: table.x + fr, y: table.y + fr, w: table.w - fr * 2, h: table.h - fr * 2};
  // the layers are hinged at the sheet's top edge: folded back (up) at rest, they show as a short band above the sheet
  const rowX = 40;
  const sheetH = (surf.h - 48) / (1 + FOLD);
  const sheet = {x: surf.x + 40, y: surf.y + surf.h - 26 - sheetH, w: surf.w - 80, h: sheetH};
  const rowW = sheet.w - rowX - 34;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: sheet.w - 90, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const headH = head.height + 26;
  const title = {fit: fitG(p.clauseTitle, {maxWidth: rowW, size: F, minSize: minF, maxLines: 2, weight: 700}), y: headH + 16};
  const rowsTop = title.y + title.fit.height + 22;
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: rowW - 44, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
  const halfW = rowW / 2 + 34;
  const tabW = halfW - 22;
  const tabFit = lab => fitG(lab, {maxWidth: tabW - 34, size: F, minSize: minF, maxLines: 3, weight: 700});
  const tabs = [tabFit(p.circumstance.label), tabFit(p.communication.label)];
  const tabH = Math.max(tabs[0].height, tabs[1].height) + 22;
  const tabPad = 12;
  if (head.bad || title.fit.bad || rowFits.some(f => f.bad) || tabs.some(f => f.bad)) why.push('text');
  const rowH0 = rowFits.map(f => f.height + 30);
  const blankH0 = Math.max(...rowH0);
  const need = rowH0.reduce((a2, b2) => a2 + b2, 0) + blankH0 + 18 * rowFits.length;
  const tail = 14 + tabH + tabPad + 6;
  const rowsH = sheet.h - rowsTop - tail;
  if (need > rowsH + 0.5) why.push('rows-do-not-fit');
  const spare = Math.max(0, rowsH - need);
  const n = rowFits.length + 1;
  const grow = Math.min(spare * 0.5 / n, F * 1.8);
  const rgap = 18 + Math.min((spare - grow * n) / n, F * 2);
  let y = rowsTop + Math.max(0, (rowsH - (need + grow * n + (rgap - 18) * n)) / 2);
  const rows = rowFits.map((fit, i) => { const row = {y, h: rowH0[i] + grow, fit}; y += row.h + rgap; return row; });
  const blank = {y, h: blankH0 + grow};
  const si = sectionIndex(p);
  const tgtRow = p.finalState === 'provided' ? rows[si] : blank;
  const RX = sheet.x + rowX - 12, RW = rowW + 24;
  const target = {x: RX, y: sheet.y + tgtRow.y - 10, w: RW, h: tgtRow.h + 20};
  const hinge = sheet.y - 6;
  const bottom = sheet.y + sheet.h + 6;
  const mid = RX + RW / 2;
  const layerFinal = [
    {x: RX - 22, y: hinge, w: mid + 10 - (RX - 22), h: bottom - hinge},
    {x: mid - 10, y: hinge, w: RX + RW + 22 - (mid - 10), h: bottom - hinge},
  ];
  if (hinge - FOLD * (bottom - hinge) < surf.y + 4) why.push('fold-band');
  if (notes.length && groupH(notesBox.w) > notesBox.h + 0.5) why.push('notes-do-not-fit');
  if (lupaRest.y + R > D.h - 4) why.push('lupa-rest');
  // tracer stops (lens centres)
  const stops = {
    section: {x: mid, y: target.y + target.h / 2},
    circumstance: {x: layerFinal[0].x + 22 + tabW / 2, y: bottom - tabPad - tabH / 2},
    communication: {x: layerFinal[1].x + 12 + tabW / 2, y: bottom - tabPad - tabH / 2},
  };
  const tabY = bottom - tabPad - tabH;
  // notes placement
  let notesPl = null;
  if (notes.length) {
    const hh = groupH(notesBox.w);
    let ny = notesBox.y + (portraitish ? 0 : Math.max(0, (notesBox.h - hh) / 2));
    notesPl = notes.map(q => { const c = chipOf(q, notesBox.x, ny, notesBox.w); if (c.bad) why.push('note-text'); ny += c.box.h + gap; return {q, c}; });
  }
  return {ok: !why.length, why, F, minF, mode, table, surf, sheet, rowX, rowW, head, headH, title, rows, blank, tabs, tabW, tabH, tabPad, tabY, layerFinal, hinge, target, si, mid, stops, lupa: {R, hl}, lupaRest, notesPl, notesBox};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1000], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const modes = ctx.view.shape === 'portrait' ? ['top'] : ['side', 'top'];
    let L = null;
    search: for (const fpx of stress ? [21, 19.5, 18, 17] : [25, 23, 21.5]) for (const mode of modes) {
      L = geom(ctx, fpx / upx, minF, mode);
      if (L.ok) break search;
    }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const {table, surf, sheet} = L;
    const tableNode = g(null,
      h('rect', {x: r(table.x + 10), y: r(table.y + 14), width: r(table.w), height: r(table.h), rx: 26, fill: th.shadow}),
      h('rect', {x: r(table.x), y: r(table.y), width: r(table.w), height: r(table.h), rx: 26, fill: '#3d4852', stroke: INK, 'stroke-width': 3}),
      h('rect', {x: r(surf.x), y: r(surf.y), width: r(surf.w), height: r(surf.h), rx: 12, fill: '#eef8fc', stroke: '#9fc3d3', 'stroke-width': 3}),
      h('rect', {x: r(surf.x + 16), y: r(surf.y + 16), width: r(surf.w - 32), height: r(surf.h - 32), rx: 10, fill: '#ffffff', opacity: 0.55}),
      // the registration pins (where layers register) at the corners of the sheet's rows area

    );
    const sheetArt = (named) => contractSheet(ctx, {
      w: sheet.w, h: sheet.h, head: L.head, headH: L.headH, title: L.title, rows: L.rows, rowX: L.rowX, rowW: L.rowW, F: L.F, showText: show,
      pegs: false, blank: L.blank, rowName: named ? i => `row${i}` : undefined, layers: 1,
    });
    const sheetNode = g({transform: T(sheet.x, sheet.y)}, sheetArt(true));
    const layerArt = (i, named) => layerNode(ctx, L, i, named);
    const lupa = magnifier(ctx, {name: 'lupa', R: L.lupa.R, hl: L.lupa.hl, glass: false});
    // the magnified copy under the glass: the sheet and both layers at their final places
    const lensCopy = g({name: 'lens', opacity: 0, 'data-occludes': 1},
      h('defs', null, h('clipPath', {id: ctx.id('lensclip')}, h('circle', {name: 'lens-clip', cx: 0, cy: 0, r: r(L.lupa.R * 0.92)}))),
      g({'clip-path': ctx.ref('lensclip')},
        h('circle', {name: 'lens-bg', cx: 0, cy: 0, r: r(L.lupa.R), fill: '#eef8fc'}),
        g({name: 'lens-content'}, g({transform: T(sheet.x, sheet.y)}, sheetArt(false)), layerArt(0, false), layerArt(1, false)),
      ),
    );
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    const leads = L.notesPl ? L.notesPl.filter(pl => pl.q.kind === 'note').map(pl => leader(ctx, L, pl)) : [];
    return g({name: 'scene'}, tableNode, sheetNode, layerArt(0, true), layerArt(1, true), lensCopy, lupa, leads, notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const E = ease.inOutCubic;
    const qa = E(seg(u, ...W.layerA)), qb = E(seg(u, ...W.layerB));
    const sc = q => { const v = lerp(-FOLD, 1, q); return Math.abs(v) < 0.01 ? (v < 0 ? -0.01 : 0.01) : v; };
    const sa = sc(qa), sb = sc(qb);
    const flip = v => `translate(0 ${r(L.hinge, 2)}) scale(1 ${r(v, 4)}) translate(0 ${r(-L.hinge, 2)})`;
    nodes.layer0 = {transform: flip(sa)};
    nodes.layer1 = {transform: flip(sb)};
    if (ctx.show('all')) { nodes['layer0-text'] = {opacity: r(seg(sa, 0.85, 0.98), 3)}; nodes['layer1-text'] = {opacity: r(seg(sb, 0.85, 0.98), 3)}; }
    const tabC = (i, v) => ({x: i === 0 ? L.stops.circumstance.x : L.stops.communication.x, y: L.hinge + v * (L.stops.circumstance.y - L.hinge)});
    const A = tabC(0, sa), B = tabC(1, sb);
    const joined = qa >= 1 && qb >= 1;
    const jq = seg(u, ...W.joined);
    nodes.joint = {opacity: r(joined ? jq : 0, 3)};
    // the tracer: the magnifier visits the traversal order; the focus element gets a longer dwell
    const order = p.traversalOrder;
    const stops = order.map(id => L.stops[id]);
    const rest = lensCentre(L.lupaRest, L.lupaRest.a, L.lupa);
    const pts = [rest, ...stops, rest];
    const weights = [];
    for (let i = 0; i < pts.length - 1; i++) weights.push(1); // moves
    const dwell = order.map(id => (id === p.focusElement ? 2.2 : 1));
    // timeline inside W.trace: move0, dwell0, move1, dwell1, ..., move back (in W.park)
    const segs = [];
    const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
    order.forEach((id, i) => { segs.push({kind: 'move', from: pts[i], to: pts[i + 1], w: Math.max(0.6, dist(pts[i], pts[i + 1]) / 380)}); segs.push({kind: 'dwell', at: pts[i + 1], id, w: dwell[i]}); });
    const total = segs.reduce((a, s) => a + s.w, 0);
    const tq = seg(u, ...W.trace);
    let acc = 0, c = rest, dwellId = null, moving = false;
    if (u >= W.trace[0] && u < W.trace[1]) {
      for (const s of segs) {
        const s0 = acc / total, s1 = (acc + s.w) / total;
        if (tq <= s1 || s === segs[segs.length - 1]) {
          const lq = clamp((tq - s0) / (s1 - s0));
          if (s.kind === 'move') { c = {x: lerp(s.from.x, s.to.x, ease.inOutSine(lq)), y: lerp(s.from.y, s.to.y, ease.inOutSine(lq))}; moving = true; } else { c = s.at; dwellId = s.id; }
          break;
        }
        acc += s.w;
      }
    } else if (u >= W.trace[1]) {
      const last = pts[pts.length - 2];
      const pq = ease.inOutSine(seg(u, ...W.park));
      c = {x: lerp(last.x, rest.x, pq), y: lerp(last.y, rest.y, pq)};
      moving = pq > 0 && pq < 1;
    }
    void weights;
    const out = u >= W.trace[0] && u < W.park[1];
    const ang = out ? lerp(L.lupaRest.a, -32, clamp(seg(u, W.trace[0], W.trace[0] + 0.03)) * (1 - seg(u, ...W.park))) : L.lupaRest.a;
    const a = (ang * Math.PI) / 180;
    const grip = {x: c.x - Math.cos(a) * (L.lupa.hl + L.lupa.R), y: c.y - Math.sin(a) * (L.lupa.hl + L.lupa.R)};
    nodes.lupa = {transform: T(r(grip.x, 2), r(grip.y, 2), r(ang, 2))};
    const lensOn = out && seg(u, ...W.park) < 0.5 ? 1 : 0;
    nodes.lens = {opacity: r(lensOn, 3)};
    nodes['lens-clip'] = {cx: r(c.x, 2), cy: r(c.y, 2)};
    nodes['lens-bg'] = {cx: r(c.x, 2), cy: r(c.y, 2)};
    nodes['lens-content'] = {transform: `translate(${r(c.x, 2)} ${r(c.y, 2)}) scale(${ZOOM}) translate(${r(-c.x, 2)} ${r(-c.y, 2)})`};
    // hold
    const fin = seg(u, ...W.final), keyO = seg(u, ...W.key), noteO = seg(u, ...W.notes);
    if (L.notesPl) for (const pl of L.notesPl) {
      nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'final' ? fin : pl.q.kind === 'key' ? keyO : noteO, 3)};
      if (pl.q.kind === 'note') nodes[`${pl.q.name}-lead`] = {opacity: r(noteO, 3)};
    }
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'hold';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        layerA: P2(A), layerB: P2(B), lensCentre: P2(c), lupaGrip: P2(grip),
        layerAAt: qa >= 1 ? 'registered' : qa > 0 ? 'turning' : 'folded', layerBAt: qb >= 1 ? 'registered' : qb > 0 ? 'turning' : 'folded', layerAScale: r(sa, 3), layerBScale: r(sb, 3),
        joined, outline: r(joined ? jq : 0, 3), outlines: p.finalState === 'provided' ? `section${L.si + 1}` : 'empty-band',
        tracerAt: dwellId, tracerMoving: moving, lensShown: r(lensOn, 3), zoom: ZOOM,
        lupaParked: !out,
        finalState: p.finalState, finalShown: r(fin, 3), keyShown: r(keyO, 3),
        textPx: r(L.F * L.upx, 2), mode: L.mode,
        layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        lupaBox: (() => { const cc = lensCentre(L.lupaRest, L.lupaRest.a, L.lupa); return {x: r(cc.x - L.lupa.R), y: r(cc.y - L.lupa.R), w: r(2 * L.lupa.R), h: r(2 * L.lupa.R)}; })(),
      },
    };
  },
};

/** One transparent layer: tinted acetate, its printed half-frame and its label tab. Drawn at its FINAL place. */
function layerNode(ctx, L, i, named) {
  const th = ctx.theme;
  const F0 = L.layerFinal[i];
  const col = i === 0 ? th.accent3 : th.accent2;
  const tint = i === 0 ? th.accent3Soft : th.accent2Soft;
  const tg = L.target;
  const parts = [
    h('rect', {x: r(F0.x), y: r(F0.y), width: r(F0.w), height: r(F0.h), rx: 10, fill: tint, opacity: 0.2}),
    h('rect', {x: r(F0.x), y: r(F0.y), width: r(F0.w), height: r(F0.h), rx: 10, fill: 'none', stroke: shadeHex(col), 'stroke-width': 2.4}),
    // the hinge tape along the top edge (the layer turns about it)
    h('rect', {x: r(F0.x + 16), y: r(F0.y - 9), width: r(F0.w - 32), height: 18, rx: 3, fill: '#f3e9c6', stroke: '#b9a874', 'stroke-width': 1.5, opacity: 0.95}),
  ];
  // the half-frame: "[" on the left layer, "]" on the right layer, meeting at the middle of the target
  const m = L.mid;
  const rr = 14;
  const d = i === 0
    ? `M${r(m)} ${r(tg.y)}H${r(tg.x + rr)}Q${r(tg.x)} ${r(tg.y)} ${r(tg.x)} ${r(tg.y + rr)}V${r(tg.y + tg.h - rr)}Q${r(tg.x)} ${r(tg.y + tg.h)} ${r(tg.x + rr)} ${r(tg.y + tg.h)}H${r(m)}`
    : `M${r(m)} ${r(tg.y)}H${r(tg.x + tg.w - rr)}Q${r(tg.x + tg.w)} ${r(tg.y)} ${r(tg.x + tg.w)} ${r(tg.y + rr)}V${r(tg.y + tg.h - rr)}Q${r(tg.x + tg.w)} ${r(tg.y + tg.h)} ${r(tg.x + tg.w - rr)} ${r(tg.y + tg.h)}H${r(m)}`;
  parts.push(h('path', {d, fill: 'none', stroke: '#fff', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.8}));
  parts.push(h('path', {d, fill: 'none', stroke: shadeHex(col), 'stroke-width': 6.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  // the joint mark at the meeting points (shown once both layers are registered)
  if (i === 1) {
    parts.push(g({name: named ? 'joint' : undefined, opacity: named ? 0 : 1},
      h('circle', {cx: r(m), cy: r(tg.y), r: 9, fill: '#fff', stroke: INK, 'stroke-width': 2.4}),
      h('circle', {cx: r(m), cy: r(tg.y + tg.h), r: 9, fill: '#fff', stroke: INK, 'stroke-width': 2.4}),
    ));
  }
  // the label tab
  const tab = {x: i === 0 ? F0.x + 22 : F0.x + 12, y: L.tabY, w: L.tabW, h: L.tabH};
  parts.push(h('path', {d: roundRectPath(tab.x, tab.y, tab.w, tab.h, 10), fill: '#ffffff', stroke: shadeHex(col), 'stroke-width': 3}));
  parts.push(h('rect', {x: r(tab.x), y: r(tab.y), width: 12, height: r(tab.h), rx: 5, fill: col}));
  const f = L.tabs[i];
  if (ctx.show('all')) parts.push(g({name: named ? `layer${i}-text` : undefined}, txt(f, {x: tab.x + 22 + (tab.w - 28) / 2, y: tab.y + (tab.h - f.height) / 2, anchor: 'middle', fill: INK})));
  else parts.push(h('path', {d: `M${r(tab.x + 30)} ${r(tab.y + tab.h / 2)}h${r(tab.w - 60)}`, stroke: '#cfd6dc', 'stroke-width': 9, 'stroke-linecap': 'round'}));
  return g({name: named ? `layer${i}` : undefined}, parts);
}

function shadeHex(c) {
  const n = parseInt(c.slice(1), 16);
  const f = v => Math.round(v * 0.72);
  return `#${((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}

function leader(ctx, L, pl) {
  const b = pl.c.box;
  const tg = pl.q.target === 'section' ? {x: L.target.x + L.target.w, y: L.target.y + L.target.h / 2}
    : pl.q.target === 'communication' ? {x: L.layerFinal[1].x + 12 + L.tabW, y: L.stops.communication.y}
      : {x: L.layerFinal[0].x + 22 + L.tabW / 2, y: L.stops.circumstance.y + L.tabH / 2};
  const from = {x: tg.x < b.x ? b.x : tg.x > b.x + b.w ? b.x + b.w : clamp(tg.x, b.x + 12, b.x + b.w - 12), y: tg.y < b.y ? b.y : tg.y > b.y + b.h ? b.y + b.h : b.y + b.h / 2};
  return g({name: `${pl.q.name}-lead`, opacity: 0},
    h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(tg.x)} ${r(tg.y)}`, stroke: ctx.theme.inkSoft, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(tg.x), cy: r(tg.y), r: 6, fill: ctx.theme.inkSoft, stroke: '#fff', 'stroke-width': 2}),
  );
}

export default defineAnimation({
  id: ID,
  version: '2.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-05-mechanism',
    title: 'Termination clause, without doctrine — two transparent layers on a light table join their half-frames around a section, as supplied',
    titleEs: 'Cláusula de terminación — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Top-down light table: the contract sheet with the heading "Termination clause", its supplied sections and an empty band below them. Two transparent layers — "Circumstance 1 (supplied)" and "Communication 1 (supplied)" — slide in from beside the sheet and register; their printed half-frames close into one outline around the supplied section (provided for) or around the empty band (not described). The only relation shown is the supplied one, drawn without arrows. A magnifier then travels the traversal order, enlarging what lies under its glass, and is parked. The hold shows the supplied case (● or ◆, drawn alike) and the key "As supplied · no conclusion drawn". No termination doctrine, no notice period, no validity judgement.',
    tags: ['termination clause', 'section', 'communication', 'circumstance', 'layers', 'light table', 'magnifier', 'tracer', 'contract', 'equal weight', 'mechanism'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/terminacion-comunicaciones.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
