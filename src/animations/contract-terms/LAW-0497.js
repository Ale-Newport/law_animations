/**
 * LAW-0497 — Cláusula de terminación · story
 *
 * Storyboard (a messenger at a cork board; one actor, one letter, one magnifier):
 *  0.00–0.15  rest: a cork board on an easel holds the contract sheet ("CT-731 · Contract (fictional)", two layer sheets
 *             behind it) with the heading "Termination clause" and its supplied sections as rows, each with a brass peg
 *             at its left edge. Left of the sheet is an empty pin spot; a magnifier lies on the board's ledge. The
 *             messenger stands back at the left holding the folded letter "Communication 1 (supplied)".
 *  0.15–0.30  the messenger walks up to the board, the letter carried at a constant grip.
 *  0.30–0.42  the letter is lifted onto the pin spot, unfolded (its lower half swings down showing the supplied case:
 *             ● "Case provided for (as supplied)" or ◆ "Case not described (as supplied)", drawn alike) and pinned.
 *  0.42–0.62  the messenger's hand goes to the ledge, picks up the magnifier by its handle and holds it over the case
 *             line on the pinned letter.
 *  0.58–0.68  provided for: a thread is drawn from the letter's pin to the peg of the supplied section, and that row is
 *             outlined — the section is linked with the supplied communication. Not described: no thread; the letter
 *             stays pinned, unlinked — neutral, no conclusion.
 *  0.62–0.76  the magnifier is laid back on the ledge (parked clear of all text) and the hand returns to rest.
 *  0.74–1.00  hold: "Section linked as supplied" (or "No section linked · as supplied") and the key
 *             "As supplied · no conclusion drawn".
 * No termination doctrine: no ground or right to terminate, no notice period or time limit, no effect, no validity
 * judgement, no jurisdiction.
 * @module animations/contract-terms/LAW-0497
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, obj, list, num, annotation, party} from '../../schemas/fields.js';
import {personRig} from '../../primitives/person.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, sectionField, communicationField,
  stateLabelsField, finalStateField, sectionIndex, localizeScene, unitPx, fitG, chipG, caseGlyph, contractSheet,
  pushPin, magnifier, lensCentre, letterCard, threadPath, threadNode, threadFrame, txt, overlaps,
} from './kits/terminacion-comunicaciones.js';

const ID = 'LAW-0497';
const DURATION = 6000;

const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  walk: [0.15, 0.3], lift: [0.3, 0.355], unfold: [0.355, 0.39], caseText: [0.385, 0.4], pin: [0.39, 0.42],
  toLupa: [0.42, 0.48], raise: [0.48, 0.56], thread: [0.58, 0.68], lower: [0.63, 0.7], rest: [0.7, 0.76],
  final: [0.74, 0.79], key: [0.77, 0.82], notes: [0.79, 0.84],
};
const ACTION_END = 0.76;

const sceneSchema = {
  messenger: party,
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  section: sectionField,
  communication: communicationField,
  stateLabels: stateLabelsField,
  actorLabels: obj('Role caption shown under the messenger', {a: str('Caption for the messenger', 50)}),
  objectLabels: obj('Plate on the board ledge', {ledge: str('Plate on the board ledge (e.g. "Communications")', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['letter', 'section', 'magnifier']), 0, 2),
  finalState: finalStateField({provided: 'a thread is drawn from the pinned letter to the supplied section; tag "Section linked as supplied"', undescribed: 'the letter stays pinned with no thread; tag "No section linked · as supplied"'}),
};

const defaultParams = {
  messenger: {name: 'Irene Valdés', role: 'Messenger'},
  ...CONTENT,
  actorLabels: {a: 'Messenger'},
  objectLabels: {ledge: 'Communications'},
  actionProgress: 1,
  annotations: [],
  finalState: 'provided',
};
const defaultParamsEs = {
  messenger: {name: 'Irene Valdés', role: 'Mensajera'},
  ...CONTENT_ES,
  actorLabels: {a: 'Mensajera'},
  objectLabels: {ledge: 'Comunicaciones'},
};

const isStress = p => [...p.clauses, p.communication.label, p.contract.title, p.stateLabels.provided, p.stateLabels.undescribed].some(t => t.length > 40) || p.annotations.length > 1;

const SHOULDER = {x: 12, y: -302};
const REACH = 165;

function geom(ctx, k, F, minF, forceStack = false) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14;
  const capText = p.actorLabels.a ? `${p.messenger.name} · ${p.actorLabels.a}` : p.messenger.name;
  const capW = Math.min(D.w * 0.42, 600);
  const capFit = showKey ? fitG(capText, {maxWidth: capW, size: F, minSize: minF, maxLines: 2, weight: 700}) : null;
  if (capFit && capFit.bad) why.push('caption');
  const capH = capFit ? capFit.height + 18 : 0;
  const floor = D.h - pad - capH;
  if (floor - 428 * k < pad) why.push('figure-too-tall');
  const walk = shape === 'portrait' ? 120 : Math.min(230, D.w * 0.11);
  const xA0 = pad + 56 * k;
  const xA = xA0 + walk;
  const bx = xA + 52 * k;
  const right = D.w - pad;
  const bw = right - bx;
  const fr = 16;
  const ledgeH = 18;
  const fb = Math.max(fr, F * 1.45); // the bottom rail (it carries the plate)
  const yb = floor - 64 * k; // board bottom (short feet)
  const ys = floor - 172 * k; // the shelf for the magnifier, at the messenger's hand height
  const top = pad;
  const ix = bx + fr, iy = top + fr, iw = bw - fr * 2, ih = yb - fb - iy;
  const stacked = forceStack || shape === 'portrait' || iw < 720;
  // the letter
  const lw = stacked ? clamp(Math.max(iw * 0.46, F * 10), 250, Math.max(420, F * 10)) : clamp(Math.max(iw * 0.27, F * 10), 250, Math.max(420, F * 10));
  const lpad = 18;
  const label = fitG(p.communication.label, {maxWidth: lw - lpad * 2, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 700});
  const gR = Math.min(13, F * 0.42);
  const caseFits = Object.fromEntries(['provided', 'undescribed'].map(s => [s, fitG(p.stateLabels[s], {maxWidth: lw - lpad * 2 - gR * 2 - 12, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 600})]));
  const caseFit = caseFits[p.finalState];
  const caseH = Math.max(caseFits.provided.height, caseFits.undescribed.height);
  const foldY = 26 + label.height + 20;
  const lh = foldY + caseH + 36;
  if (label.bad || caseFit.bad) why.push('letter-text');
  // the magnifier
  const R = clamp(lw * 0.15, 34, 58);
  const hl = R * 1.9;
  const lupa = {R, hl};
  const lupaRest = {x: ix + 10, y: ys - R - 2, a: 0};
  const letterFloorY = ys - 2 * R - 16; // the letter stays above the parked magnifier
  // the pin spot: the hand that holds the letter by its grip at about shoulder height
  const grip = {x: -12, y: 44};
  let spotY = floor - 292 * k - grip.y;
  const spotX = ix + 16;
  spotY = Math.min(spotY, letterFloorY - lh);
  const spot = {x: spotX, y: spotY, w: lw, h: lh};
  // (the grip slides down the letter's left edge when the letter had to be raised above the parked magnifier)
  grip.y = clamp(floor - 292 * k - spot.y, 44, Math.max(44, Math.min(foldY - 16, lh - 30)));
  // the sheet
  let sheet, rowsBox;
  const layersUp = 20;
  if (!stacked) {
    const sx = spotX + lw + 130;
    sheet = {x: sx, y: iy + layersUp + 6, w: ix + iw - 22 - sx, h: 0};
    sheet.h = yb - fb - 14 - sheet.y;
    if (spot.y < iy + 10) why.push('letter-above-board');
  } else {
    sheet = {x: ix + 18, y: iy + layersUp + 6, w: iw - 18 - 22, h: 0};
    sheet.h = spot.y - 44 - sheet.y;
  }
  if (spot.y + lh > letterFloorY + 0.5) why.push('letter-over-ledge');
  // sheet content
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: sheet.w - 90, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const headH = head.height + 26;
  const rowX = stacked ? 92 : 48;
  const pegX = rowX - 18;
  const wide = !stacked && sheet.w >= 980;
  const rowW = (wide ? sheet.w * 0.58 : sheet.w - 24) - rowX;
  const title = {fit: fitG(p.clauseTitle, {maxWidth: rowW, size: F, minSize: minF, maxLines: 2, weight: 700}), y: headH + 16};
  const rowsTop = title.y + title.fit.height + 16;
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: rowW - 40, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
  if (head.bad || title.fit.bad || rowFits.some(f => f.bad)) why.push('sheet-text');
  // notes
  const notes = [];
  const ORDER = ['letter', 'section', 'magnifier'];
  if (show) p.annotations.map((an, i) => ({name: `note${i}`, kind: 'note', text: an.text, target: an.target})).sort((a, b) => ORDER.indexOf(a.target) - ORDER.indexOf(b.target)).forEach(q => notes.push(q));
  if (show) notes.push({name: 'final', kind: 'final', text: p.finalState === 'provided' ? ctx.t.linked : ctx.t.unlinked});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  const NF = F;
  const gap = 14;
  const worst = q => (q.kind === 'final' ? (ctx.t.linked.length > ctx.t.unlinked.length ? ctx.t.linked : ctx.t.unlinked) : q.text);
  const chipOf = (q, x, y, w, text) => chipG(ctx, text ?? q.text, {x, y, maxWidth: w, size: NF, minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name,
    glyph: q.kind === 'final' ? (gx, gy, rr) => caseGlyph(ctx, p.finalState, gx, gy, rr) : null,
    fill: q.kind === 'final' ? ctx.theme.accent2Soft : ctx.theme.card});
  // (heights measured with the longer of the two final tags, so the layout does not depend on the state)
  const groupH = (items, w) => items.reduce((acc, q) => acc + chipOf(q, 0, 0, w, worst(q)).box.h + gap, 0) - (items.length ? gap : 0);
  const secA = notes.filter(q => q.kind === 'note' && q.target === 'section');
  const othA = notes.filter(q => q.kind === 'note' && q.target !== 'section');
  const tail = notes.filter(q => q.kind !== 'note');
  const rowH0 = rowFits.map(f => f.height + (stress ? 20 : 30));
  const need = rowH0.reduce((a2, b2) => a2 + b2, 0) + (stress ? 10 : 16) * (rowFits.length - 1);
  const rowsAvail = sheet.h - rowsTop - 24;
  const groups = [];
  let rowsCut = 0;
  if (notes.length) {
    const sides = wide
      ? [{x: sheet.x + rowX + rowW + 40, w: sheet.w - (rowX + rowW + 40) - 30, top: sheet.y + rowsTop, bottom: sheet.y + sheet.h - 24, align: 'top', right: true}]
      : !stacked
        ? [{x: spotX, w: lw + 30, top: ys + ledgeH + 18, bottom: yb - fb - 12, align: 'top'}, {x: spotX, w: lw, top: iy + 14, bottom: spot.y - 30, align: 'bottom'}]
        : [{x: spot.x + lw + 28, w: ix + iw - 14 - (spot.x + lw + 28), top: spot.y, bottom: letterFloorY, align: 'middle'}, {x: spotX, w: iw - 30, top: ys + ledgeH + 18, bottom: yb - fb - 12, align: 'top'}];
    const okSide = (side, items) => side.w >= 200 && groupH(items, side.w) <= side.bottom - side.top + 0.5;
    const cutOf = items => { const hh = groupH(items, rowW); return hh ? hh + 22 : 0; };
    // configurations, best first: [items beside the letter (or in the right column), items below the rows]
    const configs = wide
      ? [[notes, []], [tail, [...secA, ...othA]]]
      : [[[...othA, ...tail], secA], [othA, [...secA, ...tail]], [[], notes]];
    if (wide && othA.length) configs.unshift([[...secA, ...tail], [], othA]);
    let chosen = null;
    for (const [side, under, extra] of configs) {
      const sd = side.length ? sides.find(x0 => okSide(x0, side)) : null;
      if (side.length && !sd) continue;
      let sd2 = null;
      if (extra && extra.length) { sd2 = [{x: spotX, w: lw + 30, top: ys + ledgeH + 18, bottom: yb - fb - 12, align: 'top'}, {x: spotX, w: lw, top: iy + 14, bottom: spot.y - 30, align: 'bottom'}].find(x0 => okSide(x0, extra)); if (!sd2) continue; }
      const cut = cutOf(under);
      if (need > rowsAvail - cut + 0.5) continue;
      chosen = {side, sd, under, cut, extra, sd2};
      break;
    }
    if (!chosen) chosen = {side: [], sd: null, under: notes, cut: cutOf(notes)};
    if (chosen.sd) groups.push({items: chosen.side, ...chosen.sd, avail: chosen.sd.bottom - chosen.sd.top});
    if (chosen.sd2) groups.push({items: chosen.extra, ...chosen.sd2, avail: chosen.sd2.bottom - chosen.sd2.top});
    if (chosen.under.length) { rowsCut = chosen.cut; groups.push({items: chosen.under, x: sheet.x + rowX, w: rowW, at: 'below'}); }
  }
  rowsBox = {y: rowsTop, h: sheet.h - rowsTop - 24 - rowsCut};
  let notesPl = {placed: []};
  for (const gr of groups) {
    const hh = groupH(gr.items, gr.w);
    if (gr.avail !== undefined && hh > gr.avail + 0.5) why.push('notes-do-not-fit');
    let y = gr.at === 'below' ? sheet.y + rowsBox.y + rowsBox.h + 22
      : gr.align === 'bottom' ? gr.bottom - hh
      : gr.align === 'top' ? gr.top
      : gr.align === 'middle' ? gr.top + Math.max(0, (Math.min(gr.avail, lh) - hh) / 2) : gr.y;
    for (const q of gr.items) {
      const c = chipOf(q, gr.x, y, gr.w);
      if (c.bad) why.push('note-text');
      notesPl.placed.push({q, c, dy: 0});
      y += c.box.h + gap;
    }
  }
  if (!notesPl.placed.length) notesPl = null;
  // rows: natural height, then spread into the free space
  if (need > rowsBox.h + 0.5) why.push('rows-do-not-fit');
  const spare = Math.max(0, rowsBox.h - need);
  const grow = Math.min(spare * 0.55 / rowFits.length, F * 2.2);
  const rgap = Math.min(16 + (spare - grow * rowFits.length) / Math.max(1, rowFits.length - 1 || 1), F * 2.6);
  let y = rowsBox.y + Math.max(0, (rowsBox.h - (rowH0.reduce((a2, b2) => a2 + b2, 0) + grow * rowFits.length + rgap * (rowFits.length - 1))) / 2);
  const rows = rowFits.map((fit, i) => {
    const row = {y, h: rowH0[i] + grow, fit, pegX};
    y += row.h + rgap;
    return row;
  });
  const si = sectionIndex(p);
  const pegW = i => ({x: sheet.x + pegX, y: sheet.y + rows[i].y + rows[i].h / 2});
  // the thread: from the pin on the letter to the supplied section's peg
  const pinAt = stacked ? {x: spot.x + 26, y: spot.y + 10} : {x: spot.x + lw - 26, y: spot.y + 10};
  const tgt = pegW(si);
  const tp = stacked
    ? threadPath(pinAt, tgt, 0, {x: Math.min(pinAt.x, tgt.x) - 26, y: (pinAt.y + tgt.y) / 2})
    : threadPath(pinAt, tgt, 0, {x: pinAt.x + (tgt.x - pinAt.x) * 0.55, y: pinAt.y}, {x: tgt.x - (tgt.x - pinAt.x) * 0.55, y: tgt.y});
  // the magnifier over the case line: choose a reachable angle whose ring stays clear of the face
  const caseC = {x: spot.x + lw / 2, y: spot.y + foldY + (lh - foldY) / 2};
  const shoulder = {x: xA + SHOULDER.x * k, y: floor + SHOULDER.y * k};
  const reach = REACH * k * 0.96;
  const headC = {x: xA + 5 * k, y: floor - 366 * k};
  let raised = null;
  for (const a of [-12, 0, -25, 12, -38, 25]) {
    const rad = (a * Math.PI) / 180;
    const hand = {x: caseC.x - Math.cos(rad) * (hl + R), y: caseC.y - Math.sin(rad) * (hl + R)};
    if (Math.hypot(hand.x - shoulder.x, hand.y - shoulder.y) > reach) continue;
    if (Math.hypot(caseC.x - headC.x, caseC.y - headC.y) < R + 44 * k) continue;
    raised = {x: hand.x, y: hand.y, a};
    break;
  }
  if (!raised) { why.push('magnifier-unreachable'); raised = {x: caseC.x - (hl + R), y: caseC.y, a: 0}; }
  const restGripOk = Math.hypot(lupaRest.x - shoulder.x, lupaRest.y - shoulder.y) <= reach;
  const spotGrip = {x: spot.x + grip.x, y: spot.y + grip.y};
  if (!restGripOk) why.push('ledge-unreachable');
  if (Math.hypot(spotGrip.x - shoulder.x, spotGrip.y - shoulder.y) > reach) why.push('spot-unreachable');
  // the name caption under the messenger
  // (a caption that would fall off the left edge is shifted right: its centre follows the figure, clamped)
  return {
    ok: !why.length, why, k, F, minF, pad, floor, xA0, xA, bx, bw, top, yb, ys, fb, fr, ledgeH, ix, iy, iw, ih, stacked, wide,
    lw, lh, foldY, label, caseFit, grip, spot, sheet, head, headH, rowX, rowW, title, rows, notesPl,
    lupa, lupaRest, raised, pinAt, tp, si, tgt, caseC, capText, capW, capH, capFit,
  };
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1000], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const ks = ctx.view.shape === 'portrait' ? [1.75, 1.62, 1.5, 1.38, 1.26, 1.14, 1.02, 0.9] : [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8];
    let L = null;
    search: for (const fpx of stress ? [21, 19.5, 18, 17] : [25, 23, 21.5]) for (const k of ks) {
      const F = fpx / upx;
      for (const st of ctx.view.shape === 'portrait' ? [true] : [false, true]) {
        L = geom(ctx, k, F, minF, st);
        if (L.ok) break search;
      }
    }
    L.upx = upx;
    // (the folded letter is carried above the magnifier parked on the shelf)
    L.carryMaxY = L.ys - 2 * L.lupa.R - 14 - L.foldY + L.grip.y;
    L.look = actorLook(ctx, p.messenger, 0);
    L.rig = personRig(ctx, {name: 'A', look: L.look});
    L.cap = L.capFit ? {fit: L.capFit, node: txt(L.capFit, {x: 0, y: 0, anchor: 'middle', fill: ctx.theme.fg, name: 'cap-text'})} : null;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const {bx, bw, top, yb, ys, fb, fr, ledgeH, sheet, spot} = L;
    const wood = '#a0703f';
    // the easel legs, the board frame, the cork
    const legs = g(null,
      h('path', {d: `M${r(bx + bw * 0.18)} ${r(yb)}L${r(bx + bw * 0.12)} ${r(L.floor)}M${r(bx + bw * 0.82)} ${r(yb)}L${r(bx + bw * 0.88)} ${r(L.floor)}`, stroke: INK, 'stroke-width': 16, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(bx + bw * 0.18)} ${r(yb)}L${r(bx + bw * 0.12)} ${r(L.floor)}M${r(bx + bw * 0.82)} ${r(yb)}L${r(bx + bw * 0.88)} ${r(L.floor)}`, stroke: wood, 'stroke-width': 11, 'stroke-linecap': 'round'}),
      h('ellipse', {cx: r(bx + bw / 2), cy: r(L.floor + 4), rx: r(bw * 0.46), ry: 9, fill: INK, opacity: 0.08}),
    );
    const board = g(null,
      h('rect', {x: r(bx + 8), y: r(top + 12), width: r(bw), height: r(yb - top), rx: 14, fill: th.shadow}),
      h('rect', {x: r(bx), y: r(top), width: r(bw), height: r(yb - top), rx: 14, fill: wood, stroke: INK, 'stroke-width': 2.8}),
      h('rect', {x: r(bx + fr), y: r(top + fr), width: r(bw - fr * 2), height: r(yb - top - fr - fb), rx: 6, fill: '#d8b98a', stroke: shade2(), 'stroke-width': 2}),
      corkDots(L),
      // the pin spot: a faint outline where the letter will be pinned
      h('rect', {name: 'spot', x: r(spot.x), y: r(spot.y), width: r(spot.w), height: r(spot.h), rx: 8, fill: 'none', stroke: '#a88456', 'stroke-width': 2.5, 'stroke-dasharray': '10 8'}),
    );
    const ledge = g(null,
      h('rect', {x: r(L.ix - 4), y: r(ys + 6), width: r(L.lw + 52), height: ledgeH, rx: 4, fill: INK, opacity: 0.14}),
      h('rect', {x: r(L.ix - 4), y: r(ys), width: r(L.lw + 44), height: ledgeH, rx: 4, fill: '#8a5d33', stroke: INK, 'stroke-width': 2.6}),
      show && p.objectLabels.ledge ? plate(ctx, L, p.objectLabels.ledge) : null,
    );
    const sheetNode = g({transform: T(sheet.x, sheet.y)}, contractSheet(ctx, {
      w: sheet.w, h: sheet.h, head: L.head, headH: L.headH, title: L.title, rows: L.rows, rowX: L.rowX, rowW: L.rowW, F: L.F, showText: show,
      rowName: i => `row${i}`,
    }));
    const si = L.si;
    const row = L.rows[si];
    const rowHi = h('rect', {name: 'rowHi', x: r(sheet.x + L.rowX - 7), y: r(sheet.y + row.y - 7), width: r(L.rowW + 14), height: r(row.h + 14), rx: 12, fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});
    const letter = letterCard(ctx, {name: 'letter', w: L.lw, h: L.lh, label: L.label, caseFit: L.caseFit, state: p.finalState, showText: show, foldY: L.foldY});
    const pin = g({name: 'pinG', opacity: 0}, pushPin(ctx, 'pin', 13));
    const lupa = magnifier(ctx, {name: 'lupa', R: L.lupa.R, hl: L.lupa.hl});
    const thread = threadNode(ctx, 'thread', L.tp);
    const notes = L.notesPl ? L.notesPl.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0, transform: T(0, pl.dy || 0)}, pl.c.node)) : [];
    const leads = L.notesPl ? L.notesPl.placed.filter(pl => pl.q.kind === 'note').map(pl => leader(ctx, L, pl)) : [];
    const cap = L.cap ? g({name: 'cap'}, L.cap.node) : null;
    return g({name: 'scene'},
      legs, board, sheetNode, rowHi, ledge,
      thread,
      letter, pin,
      L.rig.node,
      lupa,
      cap,
      leads, notes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const provided = p.finalState === 'provided';
    const nodes = {};
    const {k, floor} = L;
    // the walk
    const wq = seg(a, ...W.walk);
    const x = lerp(L.xA0, L.xA, ease.inOutSine(wq));
    const bob = reduced ? 0 : -Math.abs(Math.sin(wq * Math.PI * 3)) * 7 * (wq > 0 && wq < 1 ? 1 : 0);
    const figY = floor + bob;
    // hand positions along the action
    const carry = {x: x + 64 * k, y: Math.min(figY - 252 * k, L.carryMaxY + bob)};
    const spotGrip = {x: L.spot.x + L.grip.x, y: L.spot.y + L.grip.y};
    const restHand = L.rig.frame({x: L.xA, y: floor, facing: 1, scale: k}).hands.near;
    const lift = seg(a, ...W.lift), toL = seg(a, ...W.toLupa), raise = seg(a, ...W.raise), lower = seg(a, ...W.lower), back = seg(a, ...W.rest);
    const mixP = (P, Q, t) => ({x: lerp(P.x, Q.x, t), y: lerp(P.y, Q.y, t)});
    const E = ease.inOutCubic;
    const rest = {x: L.lupaRest.x, y: L.lupaRest.y};
    const raisedP = {x: L.raised.x, y: L.raised.y};
    let hand, phase;
    if (back > 0) { hand = mixP(rest, restHand, E(back)); phase = back >= 1 ? 'rest' : 'returning'; }
    else if (lower > 0) { hand = mixP(raisedP, rest, E(lower)); phase = 'lowering'; }
    else if (raise > 0) { hand = mixP(rest, raisedP, E(raise)); phase = raise >= 1 ? 'hovering' : 'raising'; }
    else if (toL > 0) { hand = mixP(spotGrip, rest, E(toL)); phase = 'to-magnifier'; }
    else if (lift > 0) { hand = mixP(carry, spotGrip, E(lift)); phase = lift >= 1 ? 'pinning' : 'lifting'; }
    else { hand = carry; phase = wq > 0 ? 'walking' : 'rest'; }
    const holdsLetter = toL === 0;
    const holdsLupa = (raise > 0 || lower > 0) && back === 0 || (toL >= 1 && back === 0);
    const posed = L.rig.frame({x, y: figY, facing: 1, scale: k, near: hand, lean: reduced ? 0 : (wq > 0 && wq < 1 ? 3 : 0), headTilt: raise > 0 && lower < 1 ? 6 : 0});
    Object.assign(nodes, posed.nodes);
    const H = posed.hands.near;
    // the letter: carried folded at a constant grip, then pinned at the spot
    const letterPos = holdsLetter ? {x: H.x - L.grip.x, y: H.y - L.grip.y} : {x: L.spot.x, y: L.spot.y};
    nodes.letter = {transform: T(r(letterPos.x, 2), r(letterPos.y, 2))};
    const uf = ease.inOutCubic(seg(a, ...W.unfold));
    nodes['letter-low'] = {transform: `translate(0 ${r(L.foldY)}) scale(1 ${r(Math.max(0.001, uf), 4)}) translate(0 ${r(-L.foldY)})`, opacity: uf > 0.02 ? 1 : 0};
    if (ctx.show('all')) nodes['letter-case'] = {opacity: r(seg(a, ...W.caseText), 3)};
    const pinQ = seg(a, ...W.pin);
    nodes.pinG = {opacity: pinQ > 0 ? 1 : 0, transform: T(r(L.pinAt.x, 2), r(L.pinAt.y - 46 * (1 - ease.outCubic(pinQ)), 2))};
    // the magnifier: on the ledge, or in the hand by its grip
    const lupaAngle = holdsLupa ? (lower > 0 ? lerp(L.raised.a, 0, E(lower)) : lerp(0, L.raised.a, E(raise))) : 0;
    const lupaGrip = holdsLupa ? H : rest;
    nodes.lupa = {transform: T(r(lupaGrip.x, 2), r(lupaGrip.y, 2), r(lupaAngle, 2))};
    const lensC = lensCentre(lupaGrip, lupaAngle, L.lupa);
    // the thread (provided only), after the magnifier has reached the case line
    const tq = provided ? ease.inOutSine(seg(a, ...W.thread)) : 0;
    Object.assign(nodes, threadFrame('thread', L.tp, r(tq, 4)));
    nodes.rowHi = {opacity: provided ? r(seg(a, W.thread[1] - 0.03, W.thread[1]), 3) : 0};
    // the caption follows the messenger
    if (L.cap) nodes.cap = {transform: T(r(clamp(x, L.cap.fit.width / 2 + 4, ctx.design.w - L.cap.fit.width / 2 - 4), 2), r(floor + 12, 2))};
    // hold
    const fin = done ? seg(u, ...W.final) : 0, keyO = done ? seg(u, ...W.key) : 0, noteO = done ? seg(u, ...W.notes) : 0;
    if (L.notesPl) for (const pl of L.notesPl.placed) {
      nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'final' ? fin : pl.q.kind === 'key' ? keyO : noteO, 3)};
      if (pl.q.kind === 'note') nodes[`${pl.q.name}-lead`] = {opacity: r(noteO, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat, phase,
        figX: r(x), hand: P2(H), letterPos: P2(letterPos), letterGrip: P2({x: letterPos.x + L.grip.x, y: letterPos.y + L.grip.y}),
        lupaGrip: P2(lupaGrip), lensCentre: P2(lensC), caseCentre: P2(L.caseC),
        holdsLetter, holdsLupa, letterAt: !holdsLetter ? 'spot' : lift > 0 ? 'lifting' : 'carried',
        unfolded: r(uf, 3), pinned: pinQ >= 1,
        thread: r(tq, 3), linked: tq >= 1, linkedSection: provided ? L.si + 1 : null,
        lupaParked: !holdsLupa && back >= 1 || (!holdsLupa && toL === 0),
        finalState: p.finalState, finalShown: r(fin, 3), keyShown: r(keyO, 3),
        allReached: posed.reached,
        k: r(k, 3), headPx: r(72 * k * L.upx, 1), textPx: r(L.F * L.upx, 2),
        layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        actionCapped: p.actionProgress < 1 && u > capU,
        lupaBox: (() => { const c = lensCentre(rest, 0, L.lupa); return {x: r(rest.x), y: r(c.y - L.lupa.R), w: r(L.lupa.hl + 2 * L.lupa.R), h: r(2 * L.lupa.R)}; })(),
        letterBox: {x: r(L.spot.x), y: r(L.spot.y), w: r(L.lw), h: r(L.lh)},
      },
    };
  },
};

function shade2() { return '#b08e60'; }

function corkDots(L) {
  const dots = [];
  const {ix, iy, iw, ih} = L;
  for (let i = 0; i < 70; i++) {
    const fx = ((i * 0.618034) % 1), fy = ((i * 0.381966 * 1.7) % 1);
    dots.push(h('circle', {cx: r(ix + 10 + fx * (iw - 20)), cy: r(iy + 10 + fy * (ih - 20)), r: 2.2, fill: '#b8925f', opacity: 0.55}));
  }
  return g(null, dots);
}

function plate(ctx, L, text) {
  const f = fitG(text, {maxWidth: Math.min(L.bw * 0.5, 460), size: L.fb * 0.62, minSize: L.minF, maxLines: 1, weight: 700});
  const w = f.width + 30, hh = f.height + 10;
  const x = L.bx + L.bw / 2 - w / 2;
  return g(null,
    h('rect', {x: r(x), y: r(L.yb - L.fb / 2 - hh / 2), width: r(w), height: r(hh), rx: 5, fill: '#e8d6a8', stroke: INK, 'stroke-width': 1.8}),
    h('text', {x: r(x + w / 2), y: r(L.yb - L.fb / 2 - hh / 2 + 5 + f.size * 0.8), 'text-anchor': 'middle', 'font-size': r(f.size, 2), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: INK}, f.lines[0]),
  );
}

function leader(ctx, L, pl) {
  const b = pl.c.box;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  let t;
  if (pl.q.target === 'letter') {
    const S = L.spot;
    t = cy < S.y ? {x: clamp(cx, S.x + 30, S.x + L.lw - 40), y: S.y} : cy > S.y + L.lh ? {x: clamp(cx, S.x + 30, S.x + L.lw - 30), y: S.y + L.lh} : {x: S.x + L.lw, y: S.y + L.lh * 0.6};
  } else if (pl.q.target === 'section') {
    const row = L.rows[L.si];
    const rx = L.sheet.x + L.rowX, ry = L.sheet.y + row.y;
    if (cx < rx) t = {x: rx + 6, y: ry + 6};
    else if (b.x > rx + L.rowW) t = {x: rx + L.rowW, y: ry + row.h / 2};
    else {
      // below or above the rows: an elbow through the sheet's right margin, clear of the other chips
      const xr = rx + L.rowW + 12;
      t = {x: rx + L.rowW, y: ry + row.h * 0.5};
      const fy = b.y + b.h / 2;
      return g({name: `${pl.q.name}-lead`, opacity: 0},
        h('path', {d: `M${r(b.x + b.w)} ${r(fy)}H${r(xr)}V${r(t.y)}H${r(t.x)}`, fill: 'none', stroke: ctx.theme.inkSoft, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        h('circle', {cx: r(t.x), cy: r(t.y), r: 6, fill: ctx.theme.inkSoft, stroke: '#fff', 'stroke-width': 2}),
      );
    }
  } else { const c = lensCentre(L.lupaRest, 0, L.lupa); t = {x: c.x, y: c.y - L.lupa.R}; }
  const from = {x: t.x < b.x ? b.x : t.x > b.x + b.w ? b.x + b.w : clamp(t.x, b.x + 12, b.x + b.w - 12), y: t.y < b.y ? b.y : t.y > b.y + b.h ? b.y + b.h : b.y + b.h / 2};
  return g({name: `${pl.q.name}-lead`, opacity: 0},
    h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(t.x)} ${r(t.y)}`, stroke: ctx.theme.inkSoft, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(t.x), cy: r(t.y), r: 6, fill: ctx.theme.inkSoft, stroke: '#fff', 'stroke-width': 2}),
  );
}

export default defineAnimation({
  id: ID,
  version: '2.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-05-story',
    title: 'Termination clause, without doctrine — a messenger pins a letter on the contract board and a thread links it to a section, as supplied',
    titleEs: 'Cláusula de terminación — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A messenger walks up to a cork board that holds the contract sheet with the heading "Termination clause" and its supplied sections. The folded letter "Communication 1 (supplied)" is lifted onto a pin spot, unfolded to show its supplied case (● provided for or ◆ not described, drawn alike) and pinned. The messenger takes the magnifier from the ledge, holds it over the case line, and lays it back. With "provided for" a thread is drawn from the letter\'s pin to the peg of the supplied section; with "not described" no thread is drawn. The hold shows "Section linked as supplied" (or "No section linked · as supplied") and the key "As supplied · no conclusion drawn". No termination doctrine, no notice period, no validity judgement.',
    tags: ['termination clause', 'section', 'communication', 'letter', 'messenger', 'cork board', 'magnifier', 'pin', 'thread', 'contract', 'equal weight', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/terminacion-comunicaciones.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
