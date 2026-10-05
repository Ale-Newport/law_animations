/**
 * LAW-0118 — Límite de una conclusión · mechanism
 *
 * Storyboard (a drafting-table plan of the parts, no hands; unlike the story
 * the outline exists first as a small TEMPLATE and is then transferred):
 *  0.00–0.18 separate  The parts sit close together and slide apart along
 *                      their own axes: the brass PLAQUE with the proposition
 *                      (rule), a clear acetate OUTLINE TEMPLATE carrying the
 *                      cord loop drawn at reduced scale over dashed ghosts of
 *                      the card places (connector), the survey MAP with the
 *                      situation cards (facts; corner brackets group the ones
 *                      supplied as covered and the ones not examined) and the
 *                      MAGNIFIER. Each part's label appears as it separates.
 *  0.18–0.43 relate    Only the SUPPLIED relationships are drawn, one after
 *                      the other, each leaving and landing on its parts'
 *                      edges: a plain relation has end dots and no arrowhead;
 *                      sequence / communication carry an arrowhead; a thick
 *                      causal arrow appears only when supplied. Each link is
 *                      captioned with its kind.
 *  0.43–0.75 trace     A tracer runs along the links in `traversalOrder`; the
 *                      focus part enlarges while the tracer is on it (links
 *                      stay attached to its edges). Then the template's loop
 *                      is transferred: the full-size cord draws itself on the
 *                      map around exactly the cards supplied as covered.
 *  0.75–1.00 gather    The parts close in (still apart, links attached).
 *                      Origin (template), transformation
 *                      (cord on the map) and state (pennants inside, dashed
 *                      rings outside, "as supplied · no conclusion drawn")
 *                      stay visible with the supplied issue and assumption.
 * Wide/square boxes: plaque, template and magnifier in a column left of the
 * map, the note on the right (square: under the map). Tall boxes: plaque on
 * top, template beside the magnifier, the map, the note at the bottom.
 * Legal content: fictional, jurisdiction unspecified; the proposition, the
 * scopes and the relationships are supplied; nothing is decided about any
 * situation, and a relation is never drawn as causation by default.
 * @module animations/reasoning/LAW-0118
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, edgeAnchor, circleAnchor, cubic} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {magnifierArt} from './kits/condiciones-acumulativas.js';
import {
  limFields, LIM_STRINGS, LIM_DEFAULTS, resolveSituations, limColors, unitsPer1080px, packZone, cardArt, cardTransform,
  plaqueGeom, plaqueArt, mapSheet, cordArt, cordFrame, noteGeom, noteArt, cordPath, track, boxBounds, distToBox, inside, hit, unionBox, fitOk,
} from './kits/limite-de-una-conclusion.js';

const ID = 'LAW-0118';
const DURATION = 7000;
const IDS = ['proposition', 'outline', 'included', 'unexamined', 'lupa'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {explode: [0.02, 0.16], labels: [0.06, 0.16], relate: [0.19, 0.42], trace: [0.45, 0.66], project: [0.62, 0.75], gather: [0.77, 0.9], lupa: [2, 2], flags: [0.78, 0.84], rings: [0.8, 0.86], state: [0.86, 0.94], notes: [0.02, 0.12]};

const EXTRA = {
  en: {elProposition: 'Proposition (rule)', elOutline: 'Outline template (connector)', elIncluded: 'Situations covered as supplied', elUnexamined: 'Situations not examined', elLupa: 'Magnifier'},
  es: {elProposition: 'Proposición (regla)', elOutline: 'Plantilla del contorno (conector)', elIncluded: 'Supuestos cubiertos según lo aportado', elUnexamined: 'Supuestos no examinados', elLupa: 'Lupa'},
};
const STRINGS = {en: {...LIM_STRINGS.en, ...EXTRA.en}, es: {...LIM_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {...limFields, ...mechanismFields(IDS)};
const defaultParams = {
  ...LIM_DEFAULTS,
  elements: [
    {id: 'proposition', label: 'Proposition (rule)'},
    {id: 'outline', label: 'Outline template (connector)'},
    {id: 'included', label: 'Situations covered as supplied'},
    {id: 'unexamined', label: 'Situations not examined'},
    {id: 'lupa', label: 'Magnifier'},
  ],
  relationships: [
    {from: 'proposition', to: 'outline', kind: 'relation'},
    {from: 'outline', to: 'included', kind: 'relation'},
    {from: 'lupa', to: 'outline', kind: 'sequence'},
  ],
  focusElement: 'outline',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['proposition', 'outline', 'included'],
};

const M = 16;
const labelOf = (ctx, id) => {
  const e = ctx.params.elements.find(x => x.id === id);
  if (e && e.label) return e.label;
  const t = ctx.t;
  return {proposition: t.elProposition, outline: t.elOutline, included: t.elIncluded, unexamined: t.elUnexamined, lupa: t.elLupa}[id];
};

function compose(ctx, s, noteLeft = false, stacked = false, lupaMode = 'plaque') {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const u = unitsPer1080px(ctx);
  const px = v => v * u;
  const shape0 = ctx.view.shape;
  const tall = shape0 === 'portrait' || stacked;
  const shape = tall ? 'portrait' : shape0;
  const G = Math.max(s * 2.6, 64); // gap between parts (exploded)
  const capS = Math.min(s, Math.max(s * 0.86, px(17)));
  const capFit = (id, w, ml = 3) => (ctx.show('all') ? ctx.fit(labelOf(ctx, id), {maxWidth: w, size: capS, minSize: capS, maxLines: ml, weight: 700}) : null);
  const capH = f => (f ? f.height + capS * 0.45 : 0);
  const sits = resolveSituations(p.facts);
  // the gap between neighbouring parts fits the widest relation caption in use (a chip always fits on its link)
  const ls = Math.min(s, Math.max(s * 0.8, px(16.5)));
  // only for side-by-side parts that are actually linked (a vertical link has room beside it for its chip)
  const pairGap = (a, b) => {
    const rels = p.relationships.filter(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
    const w = ctx.show('all') && rels.length ? Math.max(...rels.map(q => ctx.fit(p.relationLabels[q.kind] || q.kind, {maxWidth: Math.max(s * 6.5, 140), size: ls, minSize: ls, maxLines: 3, weight: 600}).width)) + ls * 1.2 : 0;
    return Math.max(s * 3.2, w + 36);
  };
  // a chip on a vertical link is wide (one or two lines); on a horizontal link narrow (up to three lines)
  const wideChip = Math.max(s * 6.5, 140, Math.min(340, D.w * 0.26));
  const pairH = (a, b) => {
    const rels = p.relationships.filter(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
    return ctx.show('all') && rels.length ? Math.max(...rels.map(q => ctx.fit(p.relationLabels[q.kind] || q.kind, {maxWidth: wideChip, size: ls, minSize: ls, maxLines: 3, weight: 600}).height)) + ls * 0.7 + 30 : 0;
  };
  const colGap = Math.max(G, pairGap('outline', 'included'));
  // (tall boxes have height to spare: extra room so a chip fits beside a short vertical link even when the parts
  // are pulled together in the gathered pose)
  const vGap = Math.max(G * 1.2, Math.max(pairH('proposition', 'outline'), pairH('lupa', 'outline')) + G * 0.3 + 16) + (tall ? G * 0.6 : 0);
  // --- regions
  let left, mapR, noteR;
  if (!tall) {
    const LW = clamp(D.w * (shape === 'square' ? (noteLeft === 'full' ? (lupaMode === 'template' ? 0.335 : 0.29) : 0.36) : 0.26), 300, 600);
    left = {x: M, y: M, w: LW, h: D.h - 2 * M};
    if (shape === 'square') {
      mapR = {x: M + LW + colGap, y: M, w: D.w - 2 * M - LW - colGap, h: 0};
      noteR = noteLeft === 'full' ? {x: M, y: 0, w: D.w - 2 * M, h: 0} : noteLeft ? {x: left.x, y: 0, w: LW, h: 0} : {x: mapR.x, y: 0, w: mapR.w, h: 0};
    } else {
      const NW = clamp(D.w * 0.2, 290, 460);
      mapR = {x: M + LW + colGap, y: M, w: D.w - 2 * M - LW - colGap - NW - s, h: D.h - 2 * M};
      noteR = {x: mapR.x + mapR.w + s, y: M, w: NW, h: D.h - 2 * M};
    }
  } else {
    left = {x: M, y: M, w: D.w - 2 * M, h: 0};
    mapR = {x: M, y: 0, w: D.w - 2 * M, h: 0};
    noteR = {x: M, y: 0, w: D.w - 2 * M, h: 0};
  }
  // --- note
  const noteS = Math.min(s, Math.max(s * 0.86, px(20)));
  let ng = noteGeom(ctx, {w: noteR.w, s: noteS, issues: p.issues, assumptions: p.assumptions, state: t.closed});
  let ng2 = null;
  if (noteLeft === 'full') {
    // a full-width strip: two cards side by side (issue + assumptions | key + state)
    const half = (noteR.w - s) / 2;
    const a = noteGeom(ctx, {w: half, s: noteS, issues: p.issues, assumptions: p.assumptions, state: t.closed, key: false});
    const b = noteGeom(ctx, {w: half, s: noteS, issues: [], assumptions: [], state: t.closed});
    if (a.rows.length && b.rows.length) { ng = {...a, h: Math.max(a.h, b.h), truncated: a.truncated || b.truncated}; ng2 = b; ng.half = half; }
  }
  // --- plaque, template, magnifier (the left column / top rows)
  const R = clamp(s * 1.9, 42, 70);
  const sqCol = shape === 'square' && (noteLeft !== 'full' || lupaMode === 'template'); // square: magnifier beside the template
  const sqBelow = shape === 'square' && noteLeft === 'full' && lupaMode === 'below'; // magnifier under the template
  const partGap = sqCol ? pairGap('outline', 'lupa') : pairGap('proposition', 'lupa');
  const plW = tall || sqCol || sqBelow ? (tall ? D.w - 2 * M : left.w) : left.w - 2 * R - partGap;
  const pg = plaqueGeom(ctx, {w: plW, s, kind: labelOf(ctx, 'proposition'), kindSize: Math.min(s, Math.max(s * 0.72, px(16.5))), title: p.rules.title, text: p.rules.proposition, maxLines: 10});
  const capP = null;
  // the template's label is printed in a band inside the acetate (links land on the acetate's edge, never on text)
  const tmplWEst = (tall ? (D.w - 2 * M) * 0.5 : sqCol ? left.w - 2 * R - partGap : left.w) - 24;
  const capO = capFit('outline', tmplWEst);
  const bandO = capO ? capO.height + capS * 0.7 : 0;
  const capL = capFit('lupa', tall ? (D.w - 2 * M) * 0.4 : sqBelow ? left.w * 0.9 : shape === 'square' ? Math.max(2 * R + s * 1.2, left.w * 0.42) : Math.max(2 * R + s * 1.2, left.w - plW - 10));
  const plaque = {x: tall ? M : left.x, y: M, w: plW, h: pg.h};
  let tmplW, tmplTop, lupaC;
  // map sizing (depends on the free height)
  let mapTop, mapH;
  if (!tall) {
    mapTop = M + (shape === 'square' ? 0 : 0);
    const noteH = shape === 'square' && (!noteLeft || noteLeft === 'full') ? ng.h : 0;
    mapH = D.h - 2 * M - (noteH ? noteH + s : 0);
    mapR.h = mapH;
    if (shape === 'square' && (!noteLeft || noteLeft === 'full')) { noteR.y = M + mapH + s; noteR.h = ng.h; }
  }
  const aspectOf = (w, hh) => hh / w;
  let capOx = capO, bandUse = bandO;
  if (!tall) for (let pass = 0; pass < 3; pass++) {
    // the magnifier stands beside the plaque; the template spans the column under both
    const sq = sqCol;
    if (sqBelow) {
      const vGapL = Math.max(G, pairH('lupa', 'outline') + G * 0.3);
      tmplTop = plaque.y + plaque.h + vGap + bandUse;
      const below = vGapL + capH(capL) + 2 * R + 10;
      tmplW = Math.min(left.w, (M + mapR.h - tmplTop - below) / aspectOf(mapR.w, mapR.h));
      lupaC = {x: left.x + Math.min(left.w, tmplW) / 2, y: tmplTop + tmplW * aspectOf(mapR.w, mapR.h) + vGapL + capH(capL) + R};
    } else {
    lupaC = sq ? {x: left.x + left.w - R - 4, y: 0} : {x: left.x + left.w - R - 4, y: plaque.y + Math.max(capH(capL) + R, plaque.h * 0.55)};
    const yT = (sq ? plaque.y + plaque.h : Math.max(plaque.y + plaque.h, lupaC.y + R + 20)) + vGap;
    tmplTop = yT + bandUse;
    const tmplMaxH = shape === 'square' ? (noteLeft === 'full' ? M + mapR.h - tmplTop : noteLeft ? D.h - M - tmplTop - ng.h - s : (D.h - 2 * M) * 0.42) : D.h - M - tmplTop;
    tmplW = Math.min(sq ? left.w - 2 * R - partGap : left.w, tmplMaxH / aspectOf(mapR.w, mapR.h));
    if (sq) lupaC.y = tmplTop + Math.max(capH(capL) + R, tmplW * aspectOf(mapR.w, mapR.h) * 0.5);
    if (shape === 'square' && noteLeft === true) { noteR.y = tmplTop + tmplW * aspectOf(mapR.w, mapR.h) + s; noteR.h = ng.h; }
    }
    // the template's label wraps to the template's real width; a taller band moves the body down (never into the gap)
    if (!capO) break;
    const fitO = ctx.fit(labelOf(ctx, 'outline'), {maxWidth: tmplW - 24, size: capS, minSize: capS, maxLines: 4, weight: 700});
    const bandNew = fitO.height + capS * 0.7;
    capOx = fitO;
    if (bandNew <= bandUse + 0.5) break;
    bandUse = bandNew;
  } else {
    // rows: plaque / (template | magnifier) / map / note
    const rowY = plaque.y + plaque.h + vGap;
    const tw = (D.w - 2 * M) * 0.5;
    const noteH = ng.h;
    const restH = D.h - M - rowY;
    // template height ≈ tw * aspect(map); the map takes the rest
    let mh = restH * 0.55;
    // the template → map gap holds the chip of the (vertical) link between them beside that link
    const gTM = Math.max(G, pairH('outline', 'included') + G * 0.3 + 16);
    for (let it = 0; it < 6; it++) {
      const th = tw * (mh / (D.w - 2 * M));
      const need = bandO + th + gTM + mh + (noteH ? s + noteH : 0);
      mh = Math.max(120, mh - (need - restH) * 0.7);
    }
    mapR.h = mh;
    tmplW = tw;
    tmplTop = rowY + bandO;
    const th = tw * (mh / (D.w - 2 * M));
    mapR.y = tmplTop + th + gTM;
    noteR.y = mapR.y + mh + s;
    noteR.h = noteH;
    lupaC = {x: D.w - M - R - 30, y: tmplTop + th / 2};
  }
  if (!tall) mapR.y = mapTop;
  if (tall && capO) capOx = capO;
  const bandX = tall ? bandO : bandUse;
  const tmpl = {x: tall ? M : left.x, y: tmplTop - bandX, w: tmplW, h: tmplW * aspectOf(mapR.w, mapR.h) + bandX, band: bandX};
  // --- the map: covered cards on one side of a corridor, the others on the other side
  const P = 22;
  const m = s < px(21) ? Math.max(40, s * 1.8) : Math.max(50, s * 2);
  const gap = m;
  const labS = capS;
  let labIn = null, labOut = null;
  const inItems = sits.filter(q => q.scope === 'included'), outItems = sits.filter(q => q.scope !== 'included');
  const tagSize = Math.min(s, Math.max(s * 0.74, px(17)));
  const kindSize = Math.min(s, Math.max(s * 0.7, px(16.5)));
  // the group brackets and their labels state the scope, so the cards carry only number, text, pennant/ring
  const cardOpts = key => ({s, maxW: s * 12.5, minW: s * 7.2, kind: null, tags: false, headK: 1.25, tagSize, kindSize, seedKey: key, gx: s * 1.1, gy: s * 0.9, maxLines: 6, jitter: 0.7});
  let best = null;
  for (const f of [0.5, 0.45, 0.55, 0.4, 0.6]) {
    const avail = mapR.w - 2 * P - 2 * m - gap;
    const wIn = inItems.length ? avail * f : avail * 0.25;
    const wOut = mapR.w - 2 * P - 2 * m - gap - wIn + m;
    const li = capFit('included', Math.max(s * 7, wIn + 2 * m - 10), 4), lo = capFit('unexamined', Math.max(s * 7, wOut + 10), 4);
    const topIn = mapR.y + P + capH(li) + 6 + m + s * 0.5;
    const zi = {x: mapR.x + P + m, y: topIn, w: wIn, h: mapR.y + mapR.h - P - m - topIn};
    const topOut = mapR.y + P + capH(lo) + 10;
    const zo = {x: zi.x + wIn + m + gap, y: topOut, w: mapR.x + mapR.w - P - (zi.x + wIn + m + gap), h: mapR.y + mapR.h - P - topOut};
    const pi = packZone(ctx, zi, inItems, cardOpts('min'));
    const po = packZone(ctx, zo, outItems, cardOpts('mout'));
    const labOk = fitOk(li) && fitOk(lo);
    const ok = pi.fits && po.fits && labOk;
    const score = (ok ? 1e6 : 0) + Math.min(inItems.length ? pi.cw : 1e4, outItems.length ? po.cw : 1e4);
    if (!best || score > best.score) best = {score, zi, zo, pi, po, ok, li, lo};
  }
  const cards = [...best.pi.cards, ...best.po.cards].sort((a, b) => a.i - b.i);
  labIn = best.li;
  labOut = best.lo;
  const fits = best.ok && !pg.truncated && !ng.truncated && [capP, capOx, capL, labIn, labOut].every(fitOk)
    && tmpl.w >= s * 5 && (!capOx || (!capOx.truncated && capOx.width <= tmpl.w - 20)) && (tall ? noteR.y + noteR.h <= D.h - M + 0.5 : true) && (tall ? lupaC.x + R <= D.w - M : true)
    && (shape !== 'square' || noteR.y + noteR.h <= D.h - M + 0.5) && (shape !== 'landscape' || ng.h <= noteR.h) && tmpl.h >= s * 4;
  const fitInfoNg2 = ng2;
  const fitInfo = {zones: best.ok, pg: !pg.truncated, ng: !ng.truncated, caps: [capP, capO, capL, labIn, labOut].every(f => !f || !f.truncated), capsD: [capOx, capL, labIn, labOut].map(f => (f ? `${f.truncated ? 'T' : ''}${Math.round(f.width)}` : '-')).join(','), capOxW: capOx ? Math.round(capOx.width) : 0, tmplW: Math.round(tmpl.w), tmplMin: Math.round(s * 6), tmplH: Math.round(tmpl.h), noteBottom: Math.round(noteR.y + noteR.h), Dh: Math.round(D.h), ngH: Math.round(ng.h), noteRh: Math.round(noteR.h), inTot: Math.round(best.pi.total || 0), inH: Math.round(best.zi.h), outTot: Math.round(best.po.total || 0), outH: Math.round(best.zo.h), noteLeft};
  return {wideChip, capO: capOx, ng2: fitInfoNg2, fitInfo, s, u, px, shape, tall, G, capS, sits, left, mapR, noteR, ng, noteS, pg, plaque, capP, capL, R, tmpl, lupaC, m, gap, labIn, labOut, labS, cards, zoneIn: best.zi, zoneOut: best.zo, fits};
}

/** The current box of a group caption (null when hidden). */
function labelBoxOf(L, name) {
  const q = (L.grpLabels || []).find(k => k.name === name);
  return q ? {x: q.x, y: q.y, w: q.fit.width, h: q.fit.height} : null;
}

/** Link geometry between two element shapes (box or circle) with a gentle bend. */
function linkGeo(A, B, kind, bend = 0.1) {
  const cA = A.circle ? A.circle : {x: A.box.x + A.box.w / 2, y: A.box.y + A.box.h / 2};
  const cB = B.circle ? B.circle : {x: B.box.x + B.box.w / 2, y: B.box.y + B.box.h / 2};
  const anc = (E, toward, pad) => {
    if (E.circle) return circleAnchor(E.circle, E.circle.r + pad, toward);
    const q = edgeAnchor(E.box, toward, pad);
    // a group's caption sits on its top edge: a link landing there comes down beside the caption, never through it
    const lab = E.label && E.label();
    if (lab && Math.abs(q.y - (E.box.y - pad)) < 1 && lab.y + lab.h <= E.box.y + 2 && q.x > lab.x - 14 && q.x < lab.x + lab.w + 14) {
      const lo = E.box.x + 14, hi = E.box.x + E.box.w - 14;
      const left = lab.x - 18, right = lab.x + lab.w + 18;
      const opts = [left, right].filter(x => x >= lo && x <= hi).sort((a, b) => Math.abs(a - q.x) - Math.abs(b - q.x));
      if (opts.length) return {x: opts[0], y: q.y};
    }
    return q;
  };
  const from = anc(A, cB, 6);
  const to = anc(B, cA, kind === 'relation' || kind === 'disputed' ? 6 : 10);
  const dx = to.x - from.x, dy = to.y - from.y;
  const c1 = {x: from.x + dx * 0.3 - dy * bend, y: from.y + dy * 0.3 + dx * bend};
  const c2 = {x: from.x + dx * 0.7 - dy * bend, y: from.y + dy * 0.7 + dx * bend};
  const pts = [];
  for (let k = 0; k <= 40; k++) pts.push(cubic(from, c1, c2, to, k / 40));
  return {from, to, c1, c2, pts, len: Math.hypot(dx, dy)};
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const C = limColors(ctx);
  const {mapR, cards, tmpl} = L;
  // --- map + cord (projected) + groups
  const covered = cards.filter(c => c.scope === 'included');
  const start = {x: mapR.x + mapR.w * 0.25, y: mapR.y};
  L.cp = cordPath(covered, start, L.m, {emptyAt: {x: L.zoneIn.x + L.zoneIn.w / 2, y: L.zoneIn.y + L.zoneIn.h / 2}});
  L.loopTrack = track(L.cp.loop);
  const grp = list => (list.length ? unionBox(list.map(c => boxBounds(c.box, {top: 8, side: 8, bottom: 8}))) : null);
  const gIn = grp(covered), gOut = grp(cards.filter(c => c.scope !== 'included'));
  const pad = 12;
  // the covered group is framed OUTSIDE its cord loop, so a link reaching it lands on a drawn edge and never has to
  // cross the cord
  const lb = covered.length ? unionBox(L.cp.loop.map(q => ({x: q.x, y: q.y, w: 0, h: 0}))) : null;
  const gIn2 = lb ? {x: lb.x - 10, y: lb.y - 10, w: lb.w + 20, h: lb.h + 20} : null;
  L.groups = {
    included: gIn2 ? {x: Math.max(mapR.x + 4, gIn2.x), y: Math.max(mapR.y + 4, gIn2.y), w: Math.min(mapR.x + mapR.w - 4, gIn2.x + gIn2.w) - Math.max(mapR.x + 4, gIn2.x), h: Math.min(mapR.y + mapR.h - 4, gIn2.y + gIn2.h) - Math.max(mapR.y + 4, gIn2.y)} : gIn ? {x: gIn.x - pad, y: gIn.y - pad, w: gIn.w + 2 * pad, h: gIn.h + 2 * pad} : {x: L.zoneIn.x, y: L.zoneIn.y, w: Math.max(40, L.zoneIn.w), h: 60},
    unexamined: gOut ? {x: gOut.x - pad, y: gOut.y - pad, w: gOut.w + 2 * pad, h: gOut.h + 2 * pad} : {x: L.zoneOut.x, y: L.zoneOut.y, w: Math.max(40, L.zoneOut.w), h: 60},
  };
  const bracket = (b, name, color) => {
    const k = Math.min(26, b.w * 0.25, b.h * 0.25);
    const d = [
      `M${r(b.x)} ${r(b.y + k)}V${r(b.y)}H${r(b.x + k)}`, `M${r(b.x + b.w - k)} ${r(b.y)}H${r(b.x + b.w)}V${r(b.y + k)}`,
      `M${r(b.x + b.w)} ${r(b.y + b.h - k)}V${r(b.y + b.h)}H${r(b.x + b.w - k)}`, `M${r(b.x + k)} ${r(b.y + b.h)}H${r(b.x)}V${r(b.y + b.h - k)}`,
    ].join('');
    // corner brackets over a thin full outline (the group's drawn edge, where links land)
    return g({name, opacity: 0},
      h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 4), fill: 'none', stroke: color, 'stroke-width': 1.6, opacity: 0.6}),
      h('path', {d, fill: 'none', stroke: color, 'stroke-width': 3.2, 'stroke-linecap': 'round'}));
  };
  L.mapNode = g({name: 'map'},
    mapSheet(ctx, {x: mapR.x, y: mapR.y, w: mapR.w, h: mapR.h, compass: Math.min(38, mapR.w * 0.05), compassAt: {x: mapR.x + mapR.w - 56, y: mapR.y + mapR.h - 56}}),
    bracket(L.groups.included, 'grp-in', C.cord), bracket(L.groups.unexamined, 'grp-out', C.ring),
    cards.map(c => cardArt(ctx, c.geo, {prefix: 'sit', i: c.i, transform: cardTransform(c.box)})),
    cordArt(ctx, 'cord', Math.max(5, L.s * 0.2)));
  // group labels: above the loop (covered) / above the bracket (not examined)
  const loopTop = Math.min(...L.cp.loop.map(q => q.y));
  L.grpLabels = [];
  if (L.labIn) L.grpLabels.push({name: 'lab-in', fit: L.labIn, x: L.groups.included.x, y: Math.min(loopTop, L.groups.included.y) - L.labIn.height - 8, color: shade2(C.cord)});
  if (L.labOut) L.grpLabels.push({name: 'lab-out', fit: L.labOut, x: L.groups.unexamined.x, y: L.groups.unexamined.y - L.labOut.height - 8, color: th.inkSoft});
  L.grpLabelNodes = null; // built after the links are known (the label keeps clear of where links land)
  // --- plaque
  L.plaqueArt = plaqueArt(ctx, L.pg, {x: 0, y: 0, name: 'plaque-art', ring: 'none'});
  // --- template: acetate with the loop at reduced scale over dashed ghosts of the card places
  const k = tmpl.w / mapR.w;
  L.tk = k;
  const ghosts = cards.map(c => h('path', {d: roundRectPath(c.box.x, c.box.y, c.box.w, c.box.h - c.geo.tagH * 0.5, 10), fill: c.scope === 'included' ? 'rgba(200,85,61,0.08)' : 'none', stroke: th.inkSoft, 'stroke-width': 2.5 / k * 0.5, 'stroke-dasharray': `${r(8 / k * 0.5)} ${r(6 / k * 0.5)}`, transform: c.box.rot ? `rotate(${r(c.box.rot, 2)} ${r(c.box.x + c.box.w / 2)} ${r(c.box.y + c.box.h / 2)})` : undefined}));
  const cross = (x, y) => h('path', {d: `M${r(x - 10)} ${r(y)}H${r(x + 10)}M${r(x)} ${r(y - 10)}V${r(y + 10)}`, stroke: '#4d7da6', 'stroke-width': 2});
  L.tmplNode = g({name: 'tmpl-art'},
    h('path', {d: roundRectPath(5, 8, tmpl.w, tmpl.h, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, tmpl.w, tmpl.h, 10), fill: 'rgba(214,232,244,0.85)', stroke: '#4d7da6', 'stroke-width': 2.4}),
    tmpl.band ? h('path', {d: `M1 ${r(tmpl.band)}H${r(tmpl.w - 1)}`, stroke: '#4d7da6', 'stroke-width': 1.6, 'stroke-dasharray': '6 5'}) : null,
    L.capO ? textBlock(L.capO, {x: 12, y: (tmpl.band - L.capO.height) / 2, fill: '#23445f', name: 'cap-outline'}) : null,
    g({transform: `translate(0 ${r(tmpl.band)}) scale(${r(k, 5)}) translate(${r(-mapR.x)} ${r(-mapR.y)})`},
      ghosts,
      h('path', {d: L.loopTrack.d(L.loopTrack.total), fill: 'none', stroke: C.cordDark, 'stroke-width': 7 / k * 0.5 + 3, 'stroke-linejoin': 'round'}),
      h('path', {d: L.loopTrack.d(L.loopTrack.total), fill: 'none', stroke: C.cord, 'stroke-width': 7 / k * 0.5, 'stroke-linejoin': 'round'})),
    cross(12, tmpl.band + 12), cross(tmpl.w - 12, tmpl.band + 12), cross(12, tmpl.h - 12), cross(tmpl.w - 12, tmpl.h - 12));
  // --- magnifier (glass drawn over whatever is under it)
  L.lupa = magnifierArt(ctx, {name: 'lupa-art', rad: L.R, handleAngle: 40});
  // hold spot on the map: on the cord in the corridor, clear of every card
  const boxes = cards.map(c => boxBounds(c.box, {top: c.geo.head * 0.5, side: 6}));
  const ext = Math.max(...L.cp.loop.map(q => q.x));
  let bestJ = null;
  for (const q of L.cp.loop) {
    if (q.x < ext - 3) continue;
    const clear = Math.min(...boxes.map(b => distToBox(q, b)), ...L.grpLabels.map(gl => distToBox(q, {x: gl.x, y: gl.y, w: gl.fit.width, h: gl.fit.height})));
    const score = (clear >= L.R * 0.8 + 6 ? 1000 : clear * 10) - Math.abs(q.y - (mapR.y + mapR.h / 2)) * 0.2;
    if (!bestJ || score > bestJ.score) bestJ = {q, clear, score};
  }
  L.J = bestJ ? {x: bestJ.q.x, y: bestJ.q.y} : {x: L.zoneIn.x + L.zoneIn.w + L.m, y: mapR.y + mapR.h / 2};
  L.lupaHoldR = clamp(bestJ ? bestJ.clear - 6 : L.R, 26, L.R);
  // --- element labels (captions) for plaque, template, magnifier
  L.caps = [];
  if (L.capL) L.caps.push({id: 'lupa', fit: L.capL, dx: -L.R, dy: -L.R - L.capL.height - L.capS * 0.35});
  L.capNodes = L.caps.map(q => g({name: `cap-${q.id}`, opacity: 0}, textBlock(q.fit, {x: 0, y: 0, fill: th.fg})));
  // --- explosion axes: every part slides away from the map (the map stays)
  const mc = {x: mapR.x + mapR.w / 2, y: mapR.y + mapR.h / 2};
  const dirTo = b => { const dx = mc.x - (b.x + b.w / 2), dy = mc.y - (b.y + b.h / 2); const l = Math.hypot(dx, dy) || 1; return {x: dx / l, y: dy / l}; };
  L.dirs = {proposition: dirTo(L.plaque), outline: dirTo(tmpl), lupa: dirTo({x: L.lupaC.x - L.R, y: L.lupaC.y - L.R, w: 2 * L.R, h: 2 * L.R})};
  L.shift = L.G * 0.65;
  // --- links (nodes; geometry per frame)
  const rels = p.relationships.filter(q => q.from !== q.to);
  L.rels = rels.map((rel, i) => ({...rel, i, style: LINK_STYLES[rel.kind] || LINK_STYLES.relation, color: kindColor(ctx, rel.kind), label: p.relationLabels[rel.kind] || rel.kind}));
  const ls = Math.min(L.s, Math.max(L.s * 0.8, L.px(16.5)));
  const Gor = geometryAt(L, {explode: 1, gather: 0, focus: 1, lupaMove: 0});
  L.linkNodes = L.rels.map(rel => {
    const st = rel.style;
    const lgo = linkGeo(Gor.el[rel.from], Gor.el[rel.to], rel.kind, 0.08);
    const vertical = Math.abs(lgo.to.y - lgo.from.y) > Math.abs(lgo.to.x - lgo.from.x);
    const lf = ctx.show('all') ? ctx.fit(rel.label, {maxWidth: vertical ? L.wideChip : Math.max(L.s * 6.5, 140), size: ls, minSize: ls, maxLines: 3, weight: 600}) : null;
    rel.fit = lf;
    rel.chipW = lf ? lf.width + ls * 1.2 : 0;
    rel.chipH = lf ? lf.height + ls * 0.7 : 0;
    return g({name: `link${rel.i}`, opacity: 0},
      h('path', {name: `link${rel.i}-line`, d: 'M0 0', fill: 'none', stroke: rel.color, 'stroke-width': st.width, 'stroke-linecap': 'round', 'stroke-dasharray': st.dash || undefined}),
      st.arrow ? h('path', {name: `link${rel.i}-head`, d: `M0 0L${r(-st.width * 4.2)} ${r(-st.width * 2.3)}L${r(-st.width * 3)} 0L${r(-st.width * 4.2)} ${r(st.width * 2.3)}Z`, fill: rel.color, opacity: 0}) : null,
      st.endDots ? h('circle', {name: `link${rel.i}-dotA`, r: r(st.width * 1.6), fill: rel.color, opacity: 0}) : null,
      st.endDots ? h('circle', {name: `link${rel.i}-dotB`, r: r(st.width * 1.6), fill: rel.color, opacity: 0}) : null,
      lf ? h('line', {name: `link${rel.i}-lead`, stroke: rel.color, 'stroke-width': 2, 'stroke-dasharray': '3 5', opacity: 0}) : null,
      lf ? g({name: `link${rel.i}-chip`, opacity: 0},
        h('path', {d: roundRectPath(-rel.chipW / 2, -rel.chipH / 2, rel.chipW, rel.chipH, Math.min(rel.chipH / 2, ls * 0.8)), fill: th.card, stroke: rel.color, 'stroke-width': 2}),
        textBlock(lf, {x: 0, y: -lf.height / 2, anchor: 'middle', fill: th.ink})) : null);
  });
  const tr0 = Math.max(16, L.s * 0.62);
  L.tracerNode = g({name: 'tracer', opacity: 0},
    h('circle', {r: r(tr0 * 2.1), fill: th.accent, opacity: 0.18}),
    h('circle', {r: r(tr0 * 1.35), fill: 'none', stroke: th.accent, 'stroke-width': 3, opacity: 0.55}),
    h('circle', {r: r(tr0), fill: th.accent, stroke: th.paper, 'stroke-width': 4}),
    h('circle', {r: r(tr0 * 0.35), fill: th.paper}));
  // --- note
  L.note = null;
  if (L.ng.rows.length) {
    const na = noteArt(ctx, L.ng, {x: L.noteR.x, y: L.noteR.y, name: 'note'});
    L.note = na.node;
    L.noteBox = na.box;
    L.stateRow = L.ng.rows.findIndex(rw => rw.kind === 'state');
    L.note2 = null;
    if (L.ng2) {
      const nb = noteArt(ctx, L.ng2, {x: L.noteR.x + L.ng.half + L.s, y: L.noteR.y, name: 'note2'});
      L.note2 = nb.node;
      L.noteBox = {x: L.noteR.x, y: L.noteR.y, w: L.noteR.w, h: Math.max(na.box.h, nb.box.h)};
      L.stateRow2 = L.ng2.rows.findIndex(rw => rw.kind === 'state');
    }
  }
  // --- link routing: each link bends so that it passes no part it does not connect (exploded, focus and gathered poses)
  const G0 = geometryAt(L, {explode: 1, gather: 0, focus: 1, lupaMove: 0});
  const G1 = geometryAt(L, {explode: 1, gather: 1, focus: 1, lupaMove: 0});
  const GF = geometryAt(L, {explode: 1, gather: 0, focus: 1.3, focusId: p.focusElement, lupaMove: 0});
  const shapeBox = e => (e.circle ? {x: e.circle.x - e.circle.r * 1.3, y: e.circle.y - e.circle.r * 1.3, w: e.circle.r * 3.6, h: e.circle.r * 3.4} : e.box);
  const textObs = () => [L.noteBox, ...L.grpLabels.map(q => ({x: q.x, y: q.y, w: q.fit.width, h: q.fit.height}))].filter(Boolean);
  // group labels: placed (and if needed re-wrapped narrower, or moved under the group) so that no link path crosses
  // them in any pose, clear of the cord and inside the map
  const placeLabels = bendOf => {
    const ptsNow = () => [G0, G1, GF].flatMap(Gx => L.rels.map(rel => linkGeo(Gx.el[rel.from], Gx.el[rel.to], rel.kind, bendOf(rel)).pts.slice(1, -1)).flat());
    const placedL = [];
    L.grpLabels.forEach(q => {
      const id = q.name === 'lab-in' ? 'included' : 'unexamined';
      const b = L.groups[id];
      const text = labelOf(ctx, id);
      let best = null;
      for (const wk of [1, 0.62, 0.46]) {
        const fit = wk === 1 ? q.fit0 || q.fit : ctx.fit(text, {maxWidth: Math.max(L.s * 5, (q.fit0 || q.fit).width * wk), size: q.fit.size, minSize: q.fit.size, maxLines: 5, weight: 700});
        if (!fitOk(fit)) continue;
        const ys = [b.y - fit.height - 8, b.y + b.h + 8];
        for (const [yi, y] of ys.entries()) {
          if (y < L.mapR.y + 4 || y + fit.height > L.mapR.y + L.mapR.h - 4) continue;
          for (const x of [b.x, b.x + b.w - fit.width, b.x + (b.w - fit.width) / 2, b.x + b.w * 0.25]) {
            const box = {x, y, w: fit.width, h: fit.height};
            const keep = {x: q.x, y: q.y, fit: q.fit};
            Object.assign(q, {x, y, fit});
            const pts = ptsNow();
            Object.assign(q, keep);
            let cost = pts.filter(pt => pt.x > x - 10 && pt.x < x + fit.width + 10 && pt.y > y - 8 && pt.y < y + fit.height + 8).length * 10;
            cost += L.cp.loop.filter(pt => distToBox(pt, box) < 8).length * 10;
            cost += L.cards.filter(c => hit(box, boxBounds(c.box), 4)).length * 20 + placedL.filter(o => hit(box, o, 6)).length * 20;
            cost += (wk < 1 ? 1 : 0) + yi * 2;
            if (!best || cost < best.cost) best = {cost, x, y, fit};
          }
        }
      }
      if (best) { q.fit0 = q.fit0 || q.fit; q.fit = best.fit; q.x = best.x; q.y = best.y; q.cost = best.cost; }
      placedL.push({x: q.x, y: q.y, w: q.fit.width, h: q.fit.height});
    });
  };
  placeLabels(() => 0.08);
  const chooseBends = () => L.rels.forEach(rel => {
    let best = null;
    for (const bend of [0.08, -0.08, 0.2, -0.2, 0.34, -0.34, 0.5, -0.5]) {
      let bad = 0;
      for (const Gx of [G0, G1, GF]) {
        const lg = linkGeo(Gx.el[rel.from], Gx.el[rel.to], rel.kind, bend);
        const obs = [...Object.entries(Gx.el).filter(([id]) => id !== rel.from && id !== rel.to).map(([, e]) => shapeBox(e)), ...textObs()];
        for (const q of lg.pts.slice(2, -2)) if (obs.some(b => distToBox(q, b) < 10)) bad++;
      }
      const score = bad * 100 + Math.abs(bend) * 10;
      if (!best || score < best.score) best = {score, bend, bad};
    }
    rel.bend = best.bend;
    rel.passesPart = best.bad > 0;
  });
  chooseBends();
  placeLabels(rel => rel.bend);
  chooseBends();
  // --- route of the tracer at the exploded pose (fixes the timing; positions are evaluated per frame)
  const order = p.traversalOrder.filter(id => G0.el[id]);
  const segs = [];
  for (let i = 1; i < order.length; i++) {
    const a = order[i - 1], b = order[i];
    const rel = L.rels.find(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
    let len;
    if (rel) {
      const lg = linkGeo(G0.el[rel.from], G0.el[rel.to], rel.kind, rel.bend);
      const s0 = rel.from === a ? lg.from : lg.to, s1 = rel.from === a ? lg.to : lg.from;
      len = Math.hypot(G0.center[a].x - s0.x, G0.center[a].y - s0.y) + lg.len * 1.05 + Math.hypot(G0.center[b].x - s1.x, G0.center[b].y - s1.y);
    } else len = Math.hypot(G0.center[a].x - G0.center[b].x, G0.center[a].y - G0.center[b].y);
    segs.push({a, b, rel: rel || null, forward: rel ? rel.from === a : true, len});
  }
  const total = segs.reduce((q, sg) => q + sg.len, 0) || 1;
  let acc = 0;
  L.route = {order, segs: segs.map(sg => { const o = {...sg, t0: acc / total}; acc += sg.len; o.t1 = acc / total; return o; })};
  L.visitT = {};
  order.forEach((id, i) => { if (L.visitT[id] === undefined) L.visitT[id] = i === 0 ? 0 : L.route.segs[i - 1].t1; });
  L.grpLabelNodes = L.grpLabels.map(q => g({name: q.name, opacity: 0}, textBlock(q.fit, {x: q.x, y: q.y, fill: q.color, anchor: 'start'})));
  // magnifier caption: the side of the magnifier that no link, part or text uses (exploded and gathered poses)
  const linkPts = Gx => L.rels.flatMap(rel => linkGeo(Gx.el[rel.from], Gx.el[rel.to], rel.kind, rel.bend).pts);
  const partBoxes = Gx => Object.values(Gx.el).map(e => (e.circle ? {x: e.circle.x - e.circle.r - 4, y: e.circle.y - e.circle.r - 4, w: 2 * e.circle.r + 8, h: 2 * e.circle.r + 8} : e.box));
  const handleBox = Gx => ({x: Gx.lupa.c.x + Gx.lupa.r * 0.6, y: Gx.lupa.c.y + Gx.lupa.r * 0.5, w: Gx.lupa.r * 2.1, h: Gx.lupa.r * 1.9});
  const inD = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= ctx.design.w - 8 && b.y + b.h <= ctx.design.h - 8;
  L.caps.forEach(q => {
    const w = q.fit.width, hh = q.fit.height, gp = L.capS * 0.35, R0 = L.R;
    const cands = [[-R0, -R0 - hh - gp], [R0 - w, -R0 - hh - gp], [-w / 2, -R0 - hh - gp], [-R0 - gp - w, -hh / 2], [-R0 - w * 0.6, R0 + gp], [R0 + gp, -R0 - hh * 0.2], [-w / 2, R0 + gp], [-R0 - w, R0 + gp], [-R0 - gp - w, -R0 - hh], [-R0 - gp - w, R0 * 0.4], [R0 - w, -R0 - hh * 2 - gp * 3], [-w + R0 * 0.3, R0 * 1.1 + gp]];
    let best = null;
    for (const [dx, dy] of cands) {
      let bad = 0;
      for (const Gx of [G0, G1]) {
        const b = {x: Gx.lupa.c.x + dx, y: Gx.lupa.c.y + dy, w, h: hh};
        if (!inD(b)) bad += 50;
        bad += linkPts(Gx).filter(pt => pt.x > b.x - 8 && pt.x < b.x + b.w + 8 && pt.y > b.y - 8 && pt.y < b.y + b.h + 8).length;
        const own = {x: Gx.lupa.c.x - Gx.lupa.r, y: Gx.lupa.c.y - Gx.lupa.r, w: 2 * Gx.lupa.r, h: 2 * Gx.lupa.r};
        const others = Object.entries(Gx.el).filter(([id]) => id !== 'lupa').map(([, e]) => e.box);
        bad += 10 * [...others, ...textObs()].filter(o => hit(b, o, 4)).length + 10 * [own, handleBox(Gx)].filter(o => hit(b, o, 0)).length;
      }
      if (!best || bad < best.bad) best = {bad, dx, dy};
      if (!bad) break;
    }
    q.dx = best.dx;
    q.dy = best.dy;
    q.clear = best.bad === 0;
  });
  // relation chips: ON their own link (sliding along it) or just beside it — never far away, never on a part or text
  const placed = [];
  L.rels.forEach(rel => {
    rel.chipFree = null;
    if (!rel.fit) { rel.side = 0; rel.chipT = 20; rel.chipBad = 0; return; }
    // exploded and gathered poses: everything; the brief focus bump (GF): only captions (a chip never lands on one)
    const poses = [G0, G1, GF];
    let best = null;
    let lastWhy = [];
    for (const ti of [20, 16, 24, 12, 28, 9, 31, 6, 34]) for (const d of [0, 1, -1, 1.6, -1.6, 2.3, -2.3]) {
      let bad = 0;
      for (const Gx of poses) {
        const lg = linkGeo(Gx.el[rel.from], Gx.el[rel.to], rel.kind, rel.bend);
        const mid = lg.pts[ti];
        const dx = lg.to.x - lg.from.x, dy = lg.to.y - lg.from.y, l = Math.hypot(dx, dy) || 1;
        const off = d * (Math.abs(-dy / l) * rel.chipW / 2 + Math.abs(dx / l) * rel.chipH / 2 + 8);
        const c = {x: mid.x + (-dy / l) * off, y: mid.y + (dx / l) * off};
        const b = {x: c.x - rel.chipW / 2, y: c.y - rel.chipH / 2, w: rel.chipW, h: rel.chipH};
        const why = [];
        if (!inD(b) && Gx !== GF) { bad += 50; why.push('out'); }
        const hits = Gx === GF ? [['text', textObs()]] : [['part', partBoxes(Gx)], ['handle', [handleBox(Gx)]], ['text', textObs()], ['cap', L.caps.map(q => capBox(L, q, Gx))], ['card', L.cards.map(cd => boxBounds(cd.box))], ['chip', placed]];
        for (const [k, list] of hits) { const n = list.filter(o => hit(b, o, 4)).length; if (n) { bad += 10 * n; why.push(k); } }
        // other links' lines under the chip
        const nl = L.rels.filter(o => o !== rel).flatMap(o => linkGeo(Gx.el[o.from], Gx.el[o.to], o.kind, o.bend).pts).filter(pt => pt.x > b.x && pt.x < b.x + b.w && pt.y > b.y && pt.y < b.y + b.h).length;
        if (nl && Gx !== GF) { bad += nl; why.push('link'); }
        lastWhy = why;
      }
      // a chip laid ON a short link would hide most of it: then it goes beside the link
      const hides = d === 0 && poses.some(Gx => {
        const lgc = linkGeo(Gx.el[rel.from], Gx.el[rel.to], rel.kind, rel.bend);
        const ux = Math.abs(lgc.to.x - lgc.from.x) / (lgc.len || 1), uy = Math.abs(lgc.to.y - lgc.from.y) / (lgc.len || 1);
        return ux * rel.chipW + uy * rel.chipH > lgc.len * 0.45;
      });
      const score = bad * 10 + Math.abs(d) + Math.abs(ti - 20) * 0.05 + (hides ? 5 : 0);
      if (!best || score < best.score) best = {score, bad, ti, d, why: lastWhy};
    }
    rel.chipWhy = best.why;
    rel.chipT = best.ti;
    rel.chipBad = best.bad;
    const lg0 = linkGeo(G0.el[rel.from], G0.el[rel.to], rel.kind, rel.bend);
    const dx = lg0.to.x - lg0.from.x, dy = lg0.to.y - lg0.from.y, l = Math.hypot(dx, dy) || 1;
    rel.side = best.d * (Math.abs(-dy / l) * rel.chipW / 2 + Math.abs(dx / l) * rel.chipH / 2 + 8);
    for (const Gx of poses) {
      const lg = linkGeo(Gx.el[rel.from], Gx.el[rel.to], rel.kind, rel.bend);
      const mid = lg.pts[rel.chipT];
      const ex = lg.to.x - lg.from.x, ey = lg.to.y - lg.from.y, el = Math.hypot(ex, ey) || 1;
      const c = {x: mid.x + (-ey / el) * rel.side, y: mid.y + (ex / el) * rel.side};
      placed.push({x: c.x - rel.chipW / 2, y: c.y - rel.chipH / 2, w: rel.chipW, h: rel.chipH});
    }
  });
  return L;
}

function shade2(c) { return c; }

/** Box of a free caption (only the magnifier's) in a given pose. */
function capBox(L, q, G) {
  return {x: G.lupa.c.x + q.dx, y: G.lupa.c.y + q.dy, w: q.fit.width, h: q.fit.height};
}

/** Positions of the parts for a pose: explode (0 close → 1 apart), gather (0 → 1 closer again), focus scale, lupa move. */
function geometryAt(L, o) {
  const off = id => {
    const d = L.dirs[id];
    const k = (1 - o.explode) * L.shift + o.gather * L.shift * 0.25;
    return {x: d.x * k, y: d.y * k};
  };
  const fs = id => (o.focusId === id ? o.focus : 1);
  const scaleBox = (b, sc) => ({x: b.x + b.w / 2 - (b.w * sc) / 2, y: b.y + b.h / 2 - (b.h * sc) / 2, w: b.w * sc, h: b.h * sc});
  const oP = off('proposition'), oT = off('outline'), oL = off('lupa');
  const plaque = scaleBox({x: L.plaque.x + oP.x, y: L.plaque.y + oP.y, w: L.plaque.w, h: L.plaque.h}, fs('proposition'));
  const tmpl = scaleBox({x: L.tmpl.x + oT.x, y: L.tmpl.y + oT.y, w: L.tmpl.w, h: L.tmpl.h}, fs('outline'));
  const lm = ease.inOutCubic(o.lupaMove || 0);
  const lc0 = {x: L.lupaC.x + oL.x, y: L.lupaC.y + oL.y};
  const lc = {x: lerp(lc0.x, L.J.x, lm), y: lerp(lc0.y, L.J.y, lm) - Math.sin(lm * Math.PI) * 40};
  const lr = lerp(L.R, L.lupaHoldR, lm) * fs('lupa');
  const grpS = id => scaleBox(L.groups[id], o.focusId === id ? 1 + (o.focus - 1) * 0.35 : 1);
  const el = {
    proposition: {box: plaque},
    outline: {box: tmpl},
    included: {box: grpS('included'), label: () => labelBoxOf(L, 'lab-in')},
    unexamined: {box: grpS('unexamined'), label: () => labelBoxOf(L, 'lab-out')},
    lupa: {circle: {x: lc.x, y: lc.y, r: lr}},
  };
  const center = Object.fromEntries(Object.entries(el).map(([id, e]) => [id, e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2}]));
  return {el, center, plaque, tmpl, lupa: {c: lc, r: lr}};
}

/** Chip centre for a link label: perpendicular offset from the curve midpoint on a side clear of every element. */
const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1400]},
  layout(ctx) {
    const s0 = 32;
    const minS = 16.3 * unitsPer1080px(ctx);
    // square: the note under the template or under the map — whichever composes with every link caption clear
    const at = sz => {
      if (ctx.view.shape !== 'square') return compose(ctx, sz, false);
      const a = compose(ctx, sz, true), b = compose(ctx, sz, false), c2 = compose(ctx, sz, false, true), c3 = compose(ctx, sz, 'full'), c4 = compose(ctx, sz, 'full', true), c5 = compose(ctx, sz, 'full', false, 'template'), c6 = compose(ctx, sz, 'full', false, 'below');
      const cands = [a, c3, c5, c6, b, c2, c4].filter(c => c.fits);
      if (!cands.length) return b;
      for (const c of cands) { const F = finishLayout(ctx, c); if (F.rels.every(rel => !rel.chipBad)) return F; }
      return cands[0];
    };
    let s = s0;
    let L = at(s);
    for (let it = 0; it < 60 && !L.fits && s > minS; it++) {
      s = Math.max(minS, s * 0.98);
      L = at(s);
    }
    for (let it = 0; it < 20 && !L.fits && s > s0 * 0.4; it++) {
      s *= 0.94;
      L = at(s);
    }
    const out = L.rels ? L : finishLayout(ctx, L);
    if (out.s < minS - 0.01) out.floorInfo = [['full', false, 'template'], ['full', false, 'below'], ['full', false, 'plaque']].map(([nl, st, lm]) => JSON.stringify(compose(ctx, minS, nl, st, lm).fitInfo));
    return out;
  },
  build(ctx, L) {
    return g(null,
      L.mapNode,
      L.grpLabelNodes,
      L.note,
      L.note2,
      g({name: 'links'}, L.linkNodes.map(n => n)),
      g({name: 'plaque'}, L.plaqueArt.node),
      g({name: 'tmpl'}, L.tmplNode),
      L.lupa,
      L.capNodes,
      L.tracerNode,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const reduced = ctx.reduced;
    const explode = ease.inOutCubic(seg(u, ...W.explode));
    const gather = ease.inOutCubic(seg(u, ...W.gather));
    const trace = seg(u, ...W.trace);
    const tracing = u >= W.trace[0] && u <= W.trace[1];
    // focus bump while the tracer passes the focus part
    const focusId = ctx.params.focusElement;
    const vt = L.visitT[focusId];
    const fu = vt === undefined ? null : W.trace[0] + (W.trace[1] - W.trace[0]) * vt;
    const bump = fu === null || reduced ? 0 : Math.exp(-Math.pow((u - fu) / 0.045, 2));
    const focus = 1 + 0.3 * bump;
    const lupaMove = seg(u, ...W.lupa);
    const G = geometryAt(L, {explode, gather, focus, focusId, lupaMove});
    // parts
    nodes.plaque = {transform: `${T(G.plaque.x, G.plaque.y)} scale(${r(G.plaque.w / L.plaque.w, 4)})`};
    nodes.tmpl = {transform: `${T(G.tmpl.x, G.tmpl.y)} scale(${r(G.tmpl.w / L.tmpl.w, 4)})`};
    nodes['lupa-art'] = {transform: `${T(G.lupa.c.x, G.lupa.c.y)} scale(${r(G.lupa.r / L.R, 4)})`};
    const capOp = r(seg(u, ...W.labels), 3);
    L.caps.forEach(q => {
      const at = capBox(L, q, G);
      nodes[`cap-${q.id}`] = {transform: T(at.x, at.y), opacity: q.id === 'lupa' ? r(capOp * (1 - lupaMove), 3) : capOp};
    });
    L.grpLabels.forEach(q => { nodes[q.name] = {opacity: capOp}; });
    nodes['grp-in'] = {opacity: capOp};
    nodes['grp-out'] = {opacity: capOp};
    // links: drawn one after another, geometry from the current pose (always on the parts' edges)
    const n = L.rels.length;
    const each = (W.relate[1] - W.relate[0]) / Math.max(1, n);
    const drawn = [], ends = [], lens = [], heads = [], curLinks = [], curChips = [];
    L.rels.forEach((rel, i) => {
      const pr = ease.inOutSine(seg(u, W.relate[0] + i * each, W.relate[0] + (i + 1) * each));
      const lg = linkGeo(G.el[rel.from], G.el[rel.to], rel.kind, rel.bend);
      const kk = Math.max(1, Math.round(40 * pr));
      const d = pr > 0 ? lg.pts.slice(0, kk + 1).map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('') : 'M0 0';
      nodes[`link${rel.i}`] = {opacity: pr > 0 ? 1 : 0};
      nodes[`link${rel.i}-line`] = {d};
      const a = Math.atan2(lg.to.y - lg.pts[38].y, lg.to.x - lg.pts[38].x);
      if (rel.style.arrow) nodes[`link${rel.i}-head`] = {transform: T(lg.to.x, lg.to.y, (a * 180) / Math.PI), opacity: pr >= 0.985 ? 1 : 0};
      if (rel.style.endDots) {
        nodes[`link${rel.i}-dotA`] = {cx: r(lg.from.x), cy: r(lg.from.y), opacity: pr > 0 ? 1 : 0};
        nodes[`link${rel.i}-dotB`] = {cx: r(lg.to.x), cy: r(lg.to.y), opacity: pr >= 0.985 ? 1 : 0};
      }
      if (rel.fit) {
        const mid = lg.pts[rel.chipT];
        const dx = lg.to.x - lg.from.x, dy = lg.to.y - lg.from.y, l = Math.hypot(dx, dy) || 1;
        const c = rel.chipFree || {x: mid.x + (-dy / l) * rel.side, y: mid.y + (dx / l) * rel.side};
        const op = r(clamp((pr - 0.55) / 0.45), 3);
        nodes[`link${rel.i}-chip`] = {transform: T(c.x, c.y), opacity: op};
        if (op > 0) curChips.push({rel, box: {x: c.x - rel.chipW / 2, y: c.y - rel.chipH / 2, w: rel.chipW, h: rel.chipH}});
        const m2 = lg.pts[20];
        nodes[`link${rel.i}-lead`] = rel.chipFree ? {x1: r(c.x), y1: r(c.y), x2: r(m2.x), y2: r(m2.y), opacity: op} : {x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0};
      }
      if (pr > 0) curLinks.push({rel, pts: lg.pts.slice(0, Math.max(1, Math.round(40 * pr)) + 1), full: pr >= 1 ? lg : null});
      drawn.push(r(pr, 3));
      const onEdge = (E, q) => (E.circle ? Math.abs(Math.hypot(q.x - E.circle.x, q.y - E.circle.y) - E.circle.r) < 12 : distToBox(q, E.box) < 12 && distToBox(q, E.box) >= 0);
      ends.push(onEdge(G.el[rel.from], lg.from) && onEdge(G.el[rel.to], lg.to));
      lens.push(r(lg.len, 1));
      heads.push(!!rel.style.arrow);
    });
    // tracer
    let tracerPos = null, visited = [];
    if (tracing && L.route.segs.length) {
      const sg = L.route.segs.find(q => trace <= q.t1 + 1e-9) || L.route.segs[L.route.segs.length - 1];
      const lt = clamp((trace - sg.t0) / Math.max(1e-6, sg.t1 - sg.t0));
      if (sg.rel) {
        const lg = linkGeo(G.el[sg.rel.from], G.el[sg.rel.to], sg.rel.kind, sg.rel.bend);
        const a0 = G.center[sg.a], b0 = G.center[sg.b];
        const s0 = sg.forward ? lg.from : lg.to, s1 = sg.forward ? lg.to : lg.from;
        const la = Math.hypot(a0.x - s0.x, a0.y - s0.y), lb = Math.hypot(b0.x - s1.x, b0.y - s1.y), lm = lg.len * 1.05;
        const fa = la / (la + lm + lb || 1), fb = lb / (la + lm + lb || 1);
        if (lt < fa) { const k2 = lt / fa; tracerPos = {x: lerp(a0.x, s0.x, k2), y: lerp(a0.y, s0.y, k2)}; }
        else if (lt > 1 - fb) { const k2 = (lt - (1 - fb)) / fb; tracerPos = {x: lerp(s1.x, b0.x, k2), y: lerp(s1.y, b0.y, k2)}; }
        else { const tt = (lt - fa) / Math.max(1e-6, 1 - fa - fb); tracerPos = cubic(lg.from, lg.c1, lg.c2, lg.to, sg.forward ? tt : 1 - tt); }
      } else {
        const a = G.center[sg.a], b = G.center[sg.b];
        tracerPos = {x: lerp(a.x, b.x, lt), y: lerp(a.y, b.y, lt)};
      }
      visited = L.route.order.filter(id => L.visitT[id] <= trace + 1e-9);
    } else if (u > W.trace[1]) visited = L.route.order.slice();
    nodes.tracer = tracerPos ? {opacity: 1, transform: T(tracerPos.x, tracerPos.y)} : {opacity: 0, transform: T(0, 0)};
    // projection of the outline onto the map
    const proj = ease.inOutSine(seg(u, ...W.project));
    Object.assign(nodes, cordFrame('cord', L.loopTrack.d(Math.max(0.5, L.loopTrack.total * proj))));
    nodes.cord = {opacity: proj > 0 ? 1 : 0};
    // markers (after the loop is closed)
    const closed = proj >= 1;
    const flags = [], rings = [];
    L.cards.forEach((c, j) => {
      if (c.scope === 'included') {
        const e = closed ? seg(u, W.flags[0] + j * 0.01, W.flags[1] + j * 0.01) : 0;
        const e2 = e > 0 ? (reduced ? ease.outCubic(e) : ease.outBack(e)) : 0;
        nodes[`sit-flag${c.i}`] = {opacity: e > 0 ? 1 : 0};
        nodes[`sit-flagS${c.i}`] = {transform: `scale(${r(Math.max(0.001, e2), 3)})`};
        if (c.geo.tIn) nodes[`sit-tagIn${c.i}`] = {opacity: r(e, 3)};
        flags.push(r(e, 3));
      } else {
        const e = closed ? seg(u, W.rings[0] + j * 0.01, W.rings[1] + j * 0.01) : 0;
        nodes[`sit-ring${c.i}`] = {opacity: r(e, 3)};
        if (c.geo.tOut) nodes[`sit-tagOut${c.i}`] = {opacity: r(e, 3)};
        rings.push(r(e, 3));
      }
    });
    if (L.note) {
      nodes.note = {opacity: r(seg(u, ...W.notes), 3)};
      if (L.stateRow >= 0) nodes[`note-row${L.stateRow}`] = {opacity: r(seg(u, ...W.state), 3)};
      if (L.note2) {
        nodes.note2 = {opacity: r(seg(u, ...W.notes), 3)};
        if (L.stateRow2 >= 0) nodes[`note2-row${L.stateRow2}`] = {opacity: r(seg(u, ...W.state), 3)};
      }
    }
    // semantics
    const labelBoxes = L.grpLabels.map(q => ({x: q.x, y: q.y, w: q.fit.width, h: q.fit.height}));
    const lupaBox = {x: G.lupa.c.x - G.lupa.r, y: G.lupa.c.y - G.lupa.r, w: 2 * G.lupa.r, h: 2 * G.lupa.r};
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      textSize: r(L.s, 2),
      fits: L.fits,
      fitInfo: L.fitInfo,
      floorInfo: L.floorInfo || null,
      explode: r(explode, 3),
      gather: r(gather, 3),
      separated: r(Math.min(distToBox({x: G.tmpl.x + G.tmpl.w, y: G.tmpl.y}, L.mapR), distToBox({x: G.plaque.x + G.plaque.w, y: G.plaque.y + G.plaque.h}, L.mapR)), 1),
      relationsDrawn: drawn,
      linkEnds: ends,
      linkLengths: lens,
      linkKinds: L.rels.map(q => q.kind),
      linksThroughParts: L.rels.filter(rel => {
        const lg = linkGeo(G.el[rel.from], G.el[rel.to], rel.kind, rel.bend);
        const others = Object.entries(G.el).filter(([id]) => id !== rel.from && id !== rel.to).map(([, e]) => (e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: 2 * e.circle.r, h: 2 * e.circle.r} : e.box));
        return lg.pts.slice(2, -2).some(q => others.some(b => distToBox(q, b) < 2));
      }).map(rel => `${rel.from}-${rel.to}`),
      chipsClear: L.rels.every(rel => !rel.chipBad),
      chipWhy: L.rels.map(rel => `${rel.from}-${rel.to}:${rel.chipBad}:${(rel.chipWhy || []).join('/')}`),
      captionClear: L.caps.every(q => q.clear),
      // (per frame) no drawn link crosses a group caption; no chip sits on one; no link crosses the cord loop
      linksCrossLabels: curLinks.filter(k => labelBoxes.some(b => k.pts.slice(1, -1).some(q => q.x > b.x - 2 && q.x < b.x + b.w + 2 && q.y > b.y - 2 && q.y < b.y + b.h + 2))).map(k => `${k.rel.from}-${k.rel.to}`),
      chipsOnLabels: curChips.filter(c => labelBoxes.some(b => hit(c.box, b, 0))).map(c => `${c.rel.from}-${c.rel.to}`),
      linksCrossCord: proj > 0 ? curLinks.filter(k => k.pts.slice(1, -1).some(q => L.cp.loop.some(pp => Math.hypot(pp.x - q.x, pp.y - q.y) < 4))).map(k => `${k.rel.from}-${k.rel.to}`) : [],
      // a chip lying on its link leaves at least half of the link visible
      linksVisible: curLinks.filter(k => k.full).every(k => {
        const ch = curChips.find(c => c.rel === k.rel);
        if (!ch) return true;
        const outside = k.full.pts.filter(q => !(q.x > ch.box.x && q.x < ch.box.x + ch.box.w && q.y > ch.box.y && q.y < ch.box.y + ch.box.h)).length;
        return outside / k.full.pts.length >= 0.5;
      }),
      captionsWhole: [L.capO, L.capL, L.labIn, L.labOut, ...L.rels.map(rel => rel.fit)].every(fitOk),
      tracerRadius: r(Math.max(16, L.s * 0.62), 2),
      arrowheads: heads,
      causalCount: L.rels.filter(q => q.kind === 'causal').length,
      tracerVisible: !!tracerPos,
      tracer: tracerPos ? {x: r(tracerPos.x), y: r(tracerPos.y)} : null,
      visited,
      visitOrder: L.route.order,
      focus: focusId,
      focusScale: r(focus, 4),
      focusU: fu === null ? null : r(fu, 4),
      projected: r(proj, 4),
      closed,
      scopes: L.cards.map(c => c.scope),
      insideLoop: L.cards.map(c => inside({x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2}, L.cp.loop)),
      cordClear: L.cards.every(c => L.cp.loop.every(q => distToBox(q, boxBounds(c.box)) > L.m * 0.55)),
      flags, rings,
      markersBeforeClose: (flags.some(v => v > 0) || rings.some(v => v > 0)) && !closed,
      lupa: {x: r(G.lupa.c.x), y: r(G.lupa.c.y)},
      lupaOnMap: lupaMove >= 1,
      lupaOverCard: L.cards.some(c => distToBox(G.lupa.c, boxBounds(c.box)) < G.lupa.r - 1),
      lupaClearOfLabels: ![...L.grpLabels.map(q => ({x: q.x, y: q.y, w: q.fit.width, h: q.fit.height})), L.noteBox].filter(Boolean).some(b => hit(lupaBox, b, 0)),
      notesVisible: !!L.note && seg(u, ...W.notes) >= 1,
      stateVisible: !!L.note && (L.stateRow >= 0 || L.stateRow2 >= 0) && seg(u, ...W.state) >= 1,
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-10-mechanism',
    title: 'Limit of a conclusion — parts of an outline: proposition, template, map and magnifier',
    titleEs: 'Límite de una conclusión — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Límite de una conclusión',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A drafting-table plan of the parts: the proposition plaque (as supplied), a clear outline template with the cord loop at reduced scale, the survey map with the situation cards grouped as supplied, and a magnifier. The parts separate, only the supplied relationships are drawn (relation without arrowhead, sequence with one; causal only when supplied), a tracer follows the supplied order while the focus part enlarges, and the template’s loop is transferred to the map around exactly the covered cards. Nothing is decided about the situations outside.',
    tags: ['reasoning', 'proposition', 'scope', 'limit', 'mechanism', 'template', 'relations', 'tracer', 'map', 'not examined'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/limite-de-una-conclusion.js', 'src/animations/reasoning/kits/condiciones-acumulativas.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
