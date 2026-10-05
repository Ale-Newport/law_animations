/**
 * LAW-0500 — Cláusula de terminación · inspect
 *
 * Storyboard (a reading desk seen from above; one datum is inspected and substituted):
 *  0.00–0.20  context: on the desk lie the contract sheet ("CT-731 · Contract (fictional)", "Termination clause",
 *             its supplied sections, each with a brass peg at its right edge) and, beside it, the slip
 *             "Communication 1 (supplied)" whose case line reads the before-value (default ● "Case provided for (as
 *             supplied)"). With that case a thread runs from the slip's pin to the peg of the supplied section.
 *             A magnifier rests on the desk below the slip.
 *  0.13–0.34  the magnifier slides onto the slip; the lens opens from the slip's region to a real enlarged copy
 *             (≥ 1.5×) beside the context, which stays in place, dimmed. The context's case line is blanked while the
 *             lens shows it (the datum is legible in one place only).
 *  0.45–0.72  in the lens the one datum is substituted: the before-value lifts and fades, a small "was: …" trace keeps
 *             it traceable, the after-value (default ◆ "Case not described (as supplied)") fades in and holds; then
 *             only its dependent geometry follows: the thread retracts into the slip's pin (or, for the reverse change,
 *             is drawn to the supplied section).
 *  0.72–0.84  the lens closes back onto the slip; the context shows the after-value and the neutral changed-datum
 *             marker (white Δ on the blue disc); the magnifier slides back to its place.
 *  0.82–1.00  hold: "No section linked · as supplied" (or "Section linked as supplied"), the editorial note and the key
 *             "As supplied · no conclusion drawn". Seeking back restores the before-value exactly.
 * No termination doctrine: no ground or right to terminate, no notice period or time limit, no effect, no validity
 * judgement, no jurisdiction. Both values are supplied cases of equal weight (● and ◆ alike).
 * @module animations/contract-terms/LAW-0500
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, num, oneOf} from '../../schemas/fields.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, sectionField, communicationField,
  STATES, sectionIndex, localizeScene, unitPx, fitG, chipG, txt, caseGlyph, contractSheet, magnifier, lensCentre,
  threadPath, pushPin,
} from './kits/terminacion-comunicaciones.js';

const ID = 'LAW-0500';
const DURATION = 6500;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], back: [0.75, 1]};
const W = {lupaIn: [0.13, 0.22], open: [0.22, 0.34], lift: [0.45, 0.51], was: [0.5, 0.55], after: [0.53, 0.58], thread: [0.6, 0.7], close: [0.72, 0.8], lupaOut: [0.64, 0.73], marker: [0.8, 0.84], final: [0.82, 0.87], key: [0.85, 0.9]};

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  section: sectionField,
  communication: communicationField,
  focusTarget: oneOf('Detail that is enlarged and substituted (the supplied case printed on the communication slip)', ['case']),
  beforeValue: str('Case shown before the substitution, as supplied', 70),
  afterValue: str('Case shown after the substitution (the alternative supplied case)', 70),
  finalState: oneOf('The supplied case AFTER the substitution: undescribed (the thread to the supplied section retracts) or provided (a thread is drawn to the supplied section). The case before is the other one. Both have equal weight; nothing is inferred', STATES),
  detailGeometry: obj('Lens geometry', {zoom: num('Preferred magnification of the lens (it is kept ≥ 1.5×; reduced only to fit)', 1.5, 4), placement: oneOf('Where the lens opens', ['auto', 'right', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Editorial note shown in the hold', 90), marker: str('Label of the changed-datum marker', 40)}, ['context', 'marker']),
};

const defaultParams = {
  ...pick(CONTENT, ['contract', 'clauseTitle', 'clauses', 'section', 'communication']),
  focusTarget: 'case',
  beforeValue: CONTENT.stateLabels.provided,
  afterValue: CONTENT.stateLabels.undescribed,
  finalState: 'undescribed',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Only the supplied case on the slip was changed', marker: 'Changed datum'},
};
const defaultParamsEs = {
  ...pick(CONTENT_ES, ['contract', 'clauseTitle', 'clauses', 'section', 'communication']),
  beforeValue: CONTENT_ES.stateLabels.provided,
  afterValue: CONTENT_ES.stateLabels.undescribed,
  contextLabels: {context: 'Solo cambió el supuesto aportado de la ficha', marker: 'Dato cambiado'},
};

function pick(o, keys) { return Object.fromEntries(keys.map(k => [k, o[k]])); }

const isStress = p => [...p.clauses, p.communication.label, p.contract.title, p.beforeValue, p.afterValue].some(t => t.length > 40) || p.contextLabels.context.length > 60;

function geom(ctx, F, minF, place, stack = false, upx = 1) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14;
  const right = place === 'right';
  const tall = place === 'top';
  if (tall) stack = true;
  // context area (left or top) and lens area (right or bottom)
  const ctxBox = tall ? {x: pad, y: pad, w: D.w - pad * 2, h: D.h - pad * 2} : right ? {x: pad, y: pad, w: D.w * 0.53 - pad, h: D.h - pad * 2} : {x: pad, y: pad, w: D.w - pad * 2, h: D.h * 0.48 - pad};
  let lensArea = right ? {x: D.w * 0.56, y: pad, w: D.w * 0.44 - pad, h: D.h - pad * 2} : {x: pad, y: D.h * 0.5, w: D.w - pad * 2, h: D.h * 0.5 - pad};
  // the slip
  const SF = tall || stack ? F * 1.2 : F;
  const slipW = tall ? clamp(ctxBox.w * 0.46, 300, 600) : stack ? clamp(Math.max(SF * 9.6, ctxBox.w * 0.5), 240, 560) : clamp(Math.max(F * 9.6, ctxBox.w * 0.36), 240, Math.max(380, F * 10));
  const sp = 18;
  const label = fitG(p.communication.label, {maxWidth: slipW - sp * 2, size: SF, minSize: minF, maxLines: stress ? 4 : 3, weight: 700});
  const gR = Math.min(13, F * 0.42);
  const caseW = slipW - sp * 2 - gR * 2 - 12;
  const before = fitG(p.beforeValue, {maxWidth: caseW, size: SF, minSize: minF, maxLines: stress ? 4 : 3, weight: 600});
  const after = fitG(p.afterValue, {maxWidth: caseW, size: SF, minSize: minF, maxLines: stress ? 4 : 3, weight: 600});
  const wasF = Math.max(minF, SF * 0.82);
  const was = fitG(`${ctx.params.locale === 'es' ? 'antes' : 'was'}: ${p.beforeValue}`, {maxWidth: slipW - sp * 2, size: wasF, minSize: minF, maxLines: stress ? 4 : 3, weight: 500});
  const caseH = Math.max(before.height, after.height);
  const caseY = 30 + label.height + 22;
  const wasY = caseY + caseH + 14;
  const slipH = wasY + was.height + 18;
  if (label.bad || before.bad || after.bad || was.bad) why.push('slip-text');
  // the sheet
  const sheetW = stack ? ctxBox.w - 36 : ctxBox.w - slipW - 90;
  const rowX = 34;
  const rowW = sheetW - rowX - 44; // pegs at the right edge
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: sheetW - 90, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const headH = head.height + 24;
  const title = {fit: fitG(p.clauseTitle, {maxWidth: rowW, size: F, minSize: minF, maxLines: 2, weight: 700}), y: headH + 14};
  const rowsTop = title.y + title.fit.height + 16;
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: rowW - 40, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
  if (head.bad || title.fit.bad || rowFits.some(f => f.bad) || sheetW < 300) why.push('sheet-text');
  // the magnifier rests below the slip
  const R = clamp(F * 2.1, 44, 70), hl = R * 1.5;
  const sheet = {x: ctxBox.x + 18, y: ctxBox.y + 24, w: sheetW, h: tall ? D.h * 0.5 - 40 : stack ? ctxBox.h - 44 - slipH - 70 : ctxBox.h - 44};
  if (tall) lensArea = {x: pad, y: pad, w: D.w - pad * 2, h: sheet.y + sheet.h - pad};
  const rowH0 = rowFits.map(f => f.height + 28);
  const need = rowH0.reduce((a, b) => a + b, 0) + 14 * (rowFits.length - 1);
  const rowsH = sheet.h - rowsTop - 22;
  if (need > rowsH + 0.5) why.push('rows-do-not-fit');
  const spare = Math.max(0, rowsH - need);
  const grow = Math.min(spare * 0.45 / rowFits.length, F * 1.8);
  const rgap = 14 + Math.min((spare - grow * rowFits.length) / Math.max(1, rowFits.length), F * 2);
  let y = rowsTop;
  const rows = rowFits.map((fit, i) => { const row = {y, h: rowH0[i] + grow, fit, pegX: rowX + rowW + 16}; y += row.h + rgap; return row; });
  const si = sectionIndex(p);
  const peg = {x: sheet.x + rowX + rowW + 16, y: sheet.y + rows[si].y + rows[si].h / 2};
  // the slip: right of the sheet, its pin level with the supplied section's peg where possible
  let slip, pin, tp, lupaRest;
  if (!stack) {
    slip = {x: sheet.x + sheetW + 64, y: 0, w: slipW, h: slipH};
    slip.y = clamp(peg.y - 22, ctxBox.y + 12, ctxBox.y + ctxBox.h - slipH - 2 * R - 30);
    if (slip.y + slipH > ctxBox.y + ctxBox.h - 2 * R - 24) why.push('slip-low');
    if (slip.x + slipW > ctxBox.x + ctxBox.w + 2) why.push('context-wide');
    pin = {x: slip.x + 14, y: slip.y + 8};
    tp = threadPath(pin, peg, 0, {x: pin.x - (pin.x - peg.x) * 0.5, y: pin.y}, {x: peg.x + (pin.x - peg.x) * 0.5, y: peg.y});
    lupaRest = {x: slip.x + 6, y: Math.min(ctxBox.y + ctxBox.h - R - 8, slip.y + slipH + 26 + R), a: -10};
  } else {
    // the slip under the sheet, right-aligned under the pegs; the thread rises in the margin right of the pegs
    slip = {x: peg.x + 30 - slipW, y: sheet.y + sheet.h + 46, w: slipW, h: slipH};
    pin = {x: slip.x + slipW - 22, y: slip.y + 8};
    const xr = peg.x + 30;
    tp = threadPath(pin, peg, 0, {x: xr + 10, y: pin.y - (pin.y - peg.y) * 0.45}, {x: xr + 6, y: peg.y});
    lupaRest = {x: Math.max(ctxBox.x + 10, slip.x - 2 * R - hl - 40), y: slip.y + slipH / 2, a: 0};
    if (slip.x < ctxBox.x + 2 * R + hl + 20) why.push('lupa-room');
    if (sheet.h < 260) why.push('sheet-short');
  }
  // the lens source: the slip and the end of the thread at the peg
  const src = stack
    ? {x: slip.x - 16, y: slip.y - 30, w: slipW + 32, h: slipH + 46}
    : right ? {x: slip.x - 44, y: slip.y - 16, w: slipW + 60, h: slipH + 32}
      : {x: Math.min(peg.x - 18, slip.x - 18), y: Math.min(slip.y - 16, peg.y - 22), w: 0, h: 0};
  if (!stack && !right) {
    src.w = slip.x + slipW + 18 - src.x;
    src.h = Math.max(slip.y + slipH + 16, peg.y + 22) - src.y;
  }
  const zoomPref = p.detailGeometry.zoom;
  const zoom = Math.min(zoomPref, (lensArea.w - 10) / src.w, (lensArea.h - 10) / src.h);
  if (zoom < 1.5) why.push('lens-too-small');
  // (a real inspection: the lens's smaller side ≥ 36 % of the frame's short side)
  if (Math.min(src.w, src.h) * zoom * upx < 0.36 * 1080) why.push('lens-small');
  const dest = {w: src.w * zoom, h: src.h * zoom};
  dest.x = lensArea.x + (lensArea.w - dest.w) / 2;
  dest.y = right ? clamp(src.y + src.h / 2 - dest.h / 2, lensArea.y, lensArea.y + lensArea.h - dest.h) : lensArea.y + (lensArea.h - dest.h) / 2;
  // notes for the hold, placed where the lens was (empty once it has closed)
  const notes = [];
  if (show) notes.push({name: 'final', kind: 'final', text: p.finalState === 'provided' ? ctx.t.linked : ctx.t.unlinked});
  if (show) notes.push({name: 'markerNote', kind: 'marker', text: p.contextLabels.marker});
  if (show) notes.push({name: 'ctxNote', kind: 'note', text: p.contextLabels.context});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  const nb = tall ? {x: pad + 10, y: slip.y + slipH + 34, w: D.w - pad * 2 - 20, h: D.h - pad - (slip.y + slipH + 34)} : {x: lensArea.x + 10, y: lensArea.y + 10, w: lensArea.w - 20, h: lensArea.h - 20};
  let ny = nb.y;
  const placed = notes.map(q => {
    const c = chipG(ctx, q.text, {x: right ? nb.x : nb.x + nb.w / 2, anchor: right ? 'start' : 'middle', y: ny, maxWidth: nb.w, size: F, minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name,
      glyph: q.kind === 'final' ? (gx, gy, rr) => caseGlyph(ctx, p.finalState, gx, gy, rr) : q.kind === 'marker' ? (gx, gy, rr) => changedMarker(ctx, {x: gx, y: gy, radius: rr * 1.5}) : null,
      fill: q.kind === 'final' ? ctx.theme.accent2Soft : ctx.theme.card});
    if (c.bad) why.push('note-text');
    ny += c.box.h + 16;
    return {q, c};
  });
  const notesH = ny - 16 - nb.y;
  if (notesH > nb.h) why.push('notes-do-not-fit');
  // centre the notes block vertically in the lens area
  const dy = Math.max(0, (nb.h - notesH) / 2);
  placed.forEach(pl => { pl.dy = dy; });
  return {ok: !why.length, why, F, minF, place, ctxBox, lensArea, slip, label, before, after, was, caseY, wasY, gR, sp, sheet, rowX, rowW, head, headH, title, rows, si, peg, pin, tp, lupa: {R, hl}, lupaRest, src, dest, zoom, placed};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1000, 860], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const pl = p.detailGeometry.placement;
    const places = pl === 'right' ? ['right'] : pl === 'bottom' ? ['bottom'] : ctx.view.shape === 'portrait' ? ['top', 'bottom'] : ctx.view.shape === 'square' ? ['right', 'bottom'] : ['right', 'bottom'];
    let L = null;
    search: for (const fpx of stress ? [21, 19.5, 18, 17, 16.6] : [25, 23, 21.5]) for (const place of places) {
      for (const st of place === 'right' ? [false, true] : [false]) {
        L = geom(ctx, fpx / upx, minF, place, st, upx);
        if (L.ok) break search;
      }
    }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const D = ctx.design;
    const desk = g(null,
      h('rect', {x: 0, y: 0, width: r(D.w), height: r(D.h), rx: 24, fill: '#c9a273'}),
      ...[0.18, 0.41, 0.63, 0.86].map(f => h('path', {d: `M0 ${r(D.h * f)}C${r(D.w * 0.3)} ${r(D.h * f - 14)} ${r(D.w * 0.7)} ${r(D.h * f + 14)} ${r(D.w)} ${r(D.h * f)}`, fill: 'none', stroke: '#b8905f', 'stroke-width': 3, opacity: 0.6})),
      h('rect', {x: 0, y: 0, width: r(D.w), height: r(D.h), rx: 24, fill: 'none', stroke: INK, 'stroke-width': 3}),
    );
    const content = contextArt(ctx, L, 'l');
    const ln = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content, frame: {x: 0, y: 0, w: D.w, h: D.h}, color: th.accent2});
    const lupa = magnifier(ctx, {name: 'lupa', R: L.lupa.R, hl: L.lupa.hl});
    const marker = changedMarker(ctx, {name: 'marker', x: L.slip.x + L.slip.w - 4, y: L.slip.y + 4, radius: Math.max(18, L.F * 0.75), opacity: 0});
    const notes = L.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0, transform: T(0, pl.dy)}, pl.c.node));
    return g({name: 'scene'}, desk, contextArt(ctx, L, 'c'), marker, lupa, ln.node, notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const D = ctx.design;
    const nodes = {};
    const E = ease.inOutCubic;
    const afterProvided = p.finalState === 'provided';
    // lens open / close
    const op = E(seg(u, ...W.open)), cl = E(seg(u, ...W.close));
    const pOpen = u < W.close[0] ? op : 1 - cl;
    const ln = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: null, frame: {x: 0, y: 0, w: D.w, h: D.h}});
    Object.assign(nodes, ln.frame(pOpen, pOpen));
    // the enlarged copy fades in from ~55% open (no double image over the source), out on close
    const copyO = seg(pOpen, 0.55, 0.8);
    nodes['l-all'] = {opacity: r(copyO, 3)};
    // substitution (lens time); the same values drive the context copy
    const lift = seg(u, ...W.lift), wasQ = seg(u, ...W.was), aft = seg(u, ...W.after);
    const thq = E(seg(u, ...W.thread));
    // context datum: legible only while the lens is not showing it
    const ctxDatum = 1 - seg(pOpen, 0.3, 0.5);
    for (const P of ['c', 'l']) {
      const vis = P === 'c' ? ctxDatum : 1;
      nodes[`${P}-before`] = {opacity: r(vis * (1 - lift), 3), transform: T(0, r(-16 * lift, 2))};
      nodes[`${P}-after`] = {opacity: r(vis * aft, 3)};
      nodes[`${P}-was`] = {opacity: r(vis * wasQ, 3)};
      nodes[`${P}-gb`] = {opacity: r(vis * (1 - aft), 3)};
      nodes[`${P}-ga`] = {opacity: r(vis * aft, 3)};
      // the thread: before-provided → retracts; before-undescribed → drawn
      const q = afterProvided ? thq : 1 - thq;
      const off = r(L.tp.len * (1 - q), 2);
      nodes[`${P}-thread-line`] = {'stroke-dashoffset': off};
      nodes[`${P}-thread-halo`] = {'stroke-dashoffset': off};
      nodes[`${P}-thread`] = {opacity: q > 0.001 ? 1 : 0};
      nodes[`${P}-rowHi`] = {opacity: r(q >= 0.999 ? 1 : 0, 3)};
    }
    // the magnifier: rests below the slip, slides onto it while the lens is open, slides back
    const inQ = E(seg(u, ...W.lupaIn)), outQ = E(seg(u, ...W.lupaOut));
    const on = {x: L.slip.x + L.slip.w / 2, y: L.slip.y + L.caseY + 10};
    const restC = lensCentre(L.lupaRest, L.lupaRest.a, L.lupa);
    const c = outQ > 0 ? {x: lerp(on.x, restC.x, outQ), y: lerp(on.y, restC.y, outQ)} : {x: lerp(restC.x, on.x, inQ), y: lerp(restC.y, on.y, inQ)};
    const a = (L.lupaRest.a * Math.PI) / 180;
    const grip = {x: c.x - Math.cos(a) * (L.lupa.hl + L.lupa.R), y: c.y - Math.sin(a) * (L.lupa.hl + L.lupa.R)};
    nodes.lupa = {transform: T(r(grip.x, 2), r(grip.y, 2), L.lupaRest.a), opacity: r(1 - 0.85 * seg(pOpen, 0.2, 0.5), 3)};
    const mk = seg(u, ...W.marker), fin = seg(u, ...W.final), keyO = seg(u, ...W.key);
    nodes.marker = {opacity: r(mk, 3)};
    for (const pl of L.placed) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'marker' ? mk : fin, 3)};
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const value = aft >= 1 ? 'after' : lift > 0 ? 'changing' : 'before';
    return {
      nodes,
      semantic: {
        beat, value, lensOpen: r(pOpen, 3), copyShown: r(copyO, 3), contextDatum: r(ctxDatum, 3),
        zoom: r(L.zoom, 3), lensBox: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)}, srcBox: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
        thread: r(afterProvided ? thq : 1 - thq, 3), linked: (afterProvided ? thq : 1 - thq) >= 1,
        lensCentre: {x: r(c.x), y: r(c.y)}, lupaGrip: {x: r(grip.x), y: r(grip.y)}, lupaParked: inQ === 0 || outQ >= 1,
        markerShown: r(mk, 3), finalState: p.finalState, finalShown: r(fin, 3), keyShown: r(keyO, 3),
        place: L.place, textPx: r(L.F * L.upx, 2),
        layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        slipBox: {x: r(L.slip.x), y: r(L.slip.y), w: r(L.slip.w), h: r(L.slip.h)},
        lupaBox: {x: r(restC.x - L.lupa.R), y: r(restC.y - L.lupa.R), w: r(2 * L.lupa.R), h: r(2 * L.lupa.R)},
      },
    };
  },
};

/** The context (sheet, slip, thread) — drawn twice: the context ('c') and the lens copy ('l'), same coordinates. */
function contextArt(ctx, L, P) {
  const p = ctx.params;
  const th = ctx.theme;
  const show = ctx.show('all');
  const {sheet, slip} = L;
  const beforeState = p.finalState === 'provided' ? 'undescribed' : 'provided';
  const row = L.rows[L.si];
  const rowHi = h('rect', {name: `${P}-rowHi`, x: r(sheet.x + L.rowX - 7), y: r(sheet.y + row.y - 7), width: r(L.rowW + 14), height: r(row.h + 14), rx: 12, fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});
  const sheetNode = g({transform: T(sheet.x, sheet.y)}, contractSheet(ctx, {
    w: sheet.w, h: sheet.h, head: L.head, headH: L.headH, title: L.title, rows: L.rows, rowX: L.rowX, rowW: L.rowW, F: L.F, layers: 1,
    // (the lens copy draws the sheet without its text: no supplied field is ever partly inside the lens)
    showText: P === 'c' ? show : false,
  }));
  const tp = L.tp;
  const thread = g({name: `${P}-thread`},
    h('path', {name: `${P}-thread-halo`, d: tp.d, fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.7, 'stroke-dasharray': `${r(tp.len)} ${r(tp.len + 10)}`, 'stroke-dashoffset': 0}),
    h('path', {name: `${P}-thread-line`, d: tp.d, fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(tp.len)} ${r(tp.len + 10)}`, 'stroke-dashoffset': 0}),
  );
  const sp = L.sp, gR = L.gR;
  const cx = slip.x + sp + gR * 2 + 12;
  const slipNode = g(null,
    h('rect', {x: r(slip.x + 6), y: r(slip.y + 9), width: r(slip.w), height: r(slip.h), rx: 6, fill: th.shadow}),
    h('rect', {x: r(slip.x), y: r(slip.y), width: r(slip.w), height: r(slip.h), rx: 6, fill: '#fffdf6', stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(slip.x), y: r(slip.y), width: r(slip.w), height: 12, rx: 4, fill: th.accent3}),
    show ? txt(L.label, {x: slip.x + sp, y: slip.y + 30, fill: INK}) : h('path', {d: `M${r(slip.x + sp)} ${r(slip.y + 44)}h${r(slip.w - sp * 2)}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(slip.x + 10)} ${r(slip.y + L.caseY - 10)}H${r(slip.x + slip.w - 10)}`, stroke: '#d8ccb4', 'stroke-width': 2}),
    g({name: `${P}-gb`}, caseGlyph(ctx, beforeState, slip.x + sp + gR, slip.y + L.caseY + L.before.size * 0.55, gR)),
    g({name: `${P}-ga`, opacity: 0}, caseGlyph(ctx, p.finalState, slip.x + sp + gR, slip.y + L.caseY + L.after.size * 0.55, gR)),
    show ? g({name: `${P}-before`}, txt(L.before, {x: cx, y: slip.y + L.caseY, fill: INK})) : h('path', {name: `${P}-before`, d: `M${r(cx)} ${r(slip.y + L.caseY + 12)}h${r(slip.w - (cx - slip.x) - sp)}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    show ? g({name: `${P}-after`, opacity: 0}, txt(L.after, {x: cx, y: slip.y + L.caseY, fill: INK})) : h('path', {name: `${P}-after`, opacity: 0, d: `M${r(cx)} ${r(slip.y + L.caseY + 12)}h${r((slip.w - (cx - slip.x) - sp) * 0.7)}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    show ? g({name: `${P}-was`, opacity: 0}, txt(L.was, {x: slip.x + sp, y: slip.y + L.wasY, fill: th.inkSoft})) : h('path', {name: `${P}-was`, opacity: 0, d: `M${r(slip.x + sp)} ${r(slip.y + L.wasY + 10)}h${r((slip.w - sp * 2) * 0.5)}`, stroke: '#ddd3c0', 'stroke-width': 7, 'stroke-linecap': 'round'}),
  );
  const pin = g({transform: T(L.pin.x, L.pin.y)}, pushPin(ctx, undefined, 11));
  return g({name: P === 'l' ? 'l-all' : undefined}, sheetNode, rowHi, thread, slipNode, pin,
    // the peg end of the thread
    h('circle', {cx: r(L.peg.x), cy: r(L.peg.y), r: 5, fill: INK}));
}

void roundRectPath;

export default defineAnimation({
  id: ID,
  version: '2.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-05-inspect',
    title: 'Termination clause, without doctrine — a lens isolates the case printed on a communication slip, one datum is replaced and only its thread follows',
    titleEs: 'Cláusula de terminación — Inspección y cambio de un dato',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A reading desk seen from above: the contract sheet with the heading "Termination clause" and its supplied sections (pegs at their right edges) and, beside it, the slip "Communication 1 (supplied)" whose case line reads "Case provided for (as supplied)", with a thread to the supplied section. A magnifier slides onto the slip and a lens opens a real enlarged copy beside the context (≥ 1.5×). In the lens the one datum is replaced by "Case not described (as supplied)" (the old value stays traceable as "was: …") and only its dependent geometry follows: the thread retracts. The lens closes; the context shows the new value with the neutral changed-datum marker. The hold shows "No section linked · as supplied", the editorial note and the key "As supplied · no conclusion drawn". No termination doctrine, no notice period, no validity judgement.',
    tags: ['termination clause', 'section', 'communication', 'slip', 'lens', 'magnifier', 'thread', 'changed datum', 'contract', 'equal weight', 'inspect'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/terminacion-comunicaciones.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
