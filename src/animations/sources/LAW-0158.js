/**
 * LAW-0158 — Regla transitoria · mechanism
 *
 * Storyboard (exploded view of the band desk; no hands):
 *  0.00–0.18  separate: the parts start packed together as they lie on the
 *             desk — the editable hierarchy rack, the two bound versions, the
 *             milestone post with its tag, the transitional band (printed
 *             passage over its lane), the case cards and the timeline ruler —
 *             and slide apart row by row, each tagged with its editable
 *             element label.
 *  0.18–0.43  relate: only the supplied relationships are drawn, as straight
 *             links landing on the real edges of the parts (a link to the cases
 *             lands on one card; the timeline–cases relation is drawn as one
 *             thread per card, from the card to its pin at its supplied day),
 *             in the style of their kind (a plain relation has no arrowhead; a
 *             sequence has one; "causal" only if the author supplies it); each
 *             label sits beside its line.
 *  0.43–0.75  trace: a tracer ring runs along the links in the supplied
 *             traversal order and around the outside of each part (never over
 *             text); the focus part is haloed and enlarges while the tracer is
 *             on it. When the tracer reaches the milestone a plumb line drops
 *             from the band's split to the milestone day on the ruler and the
 *             lane is marked (amber hatch before / blue dots after); when it
 *             reaches the cases, each card's strip shows only its position
 *             against the supplied milestone.
 *  0.75–1.00  gather: every part, connector and label stays visible with the
 *             states shown; the neutral key says positions are as supplied and
 *             no conclusion is drawn on which version applies.
 * @module animations/sources/LAW-0158
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {kindColor} from '../../frameworks/graph.js';
import {textBlock, chip, connector} from '../../primitives/annotate.js';
import {roundRectPath, edgeAnchor, polyline} from '../../core/geometry.js';
import {deskWindow} from '../../primitives/desk.js';
import {fitWords, segmentHitsBox} from './kits/ambito-temporal.js';
import {
  transitionFields, RT_DEFAULTS, RT_STRINGS, rtData, sizeStageW, stageFit, levelRack, versionBook, versionPlateH, milestoneTag,
  postArt, bandPiece, sideSlots, measureCase, caseCard, rulerGeo, rulerArt, pinArt, noteChip, noteChipSize, sidePatterns,
  badFit, rtReadingNote,
} from './kits/regla-transitoria.js';

const ID = 'LAW-0158';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W_ = {sep: [0.02, 0.16], rel: [0.19, 0.42], trace: [0.45, 0.74], key: [0.78, 0.86]};
const KEY_PX = 20.6;
const ELEMENT_IDS = ['hierarchy', 'version1', 'version2', 'band', 'milestone', 'cases', 'timeline'];

const sceneSchema = {
  ...transitionFields,
  ...mechanismFields(ELEMENT_IDS),
};

const defaultParams = {
  ...RT_DEFAULTS,
  elements: [
    {id: 'hierarchy', label: 'Editable hierarchy'},
    {id: 'version1', label: 'Earlier version'},
    {id: 'version2', label: 'Later version'},
    {id: 'band', label: 'Transitional band'},
    {id: 'milestone', label: 'Configurable milestone'},
    {id: 'cases', label: 'Supplied cases'},
    {id: 'timeline', label: 'Relative timeline'},
  ],
  relationships: [
    {from: 'hierarchy', to: 'version1', kind: 'relation'},
    {from: 'version1', to: 'band', kind: 'relation'},
    {from: 'band', to: 'version2', kind: 'relation'},
    {from: 'milestone', to: 'band', kind: 'sequence'},
    {from: 'band', to: 'cases', kind: 'sequence'},
    {from: 'timeline', to: 'cases', kind: 'relation'},
  ],
  focusElement: 'milestone',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence (as supplied)', causal: 'causal (as supplied)'},
  traversalOrder: ['version1', 'band', 'milestone', 'band', 'cases', 'timeline'],
};

const MODE = {landscape: 'wide', square: 'square', portrait: 'tall'};
const STAGE_W = {wide: 1900, square: 1120, tall: 900};

/* ---- small geometry helpers ------------------------------------------- */
const unionOf = list => {
  const x = Math.min(...list.map(b => b.x)), y = Math.min(...list.map(b => b.y));
  return {x, y, w: Math.max(...list.map(b => b.x + b.w)) - x, h: Math.max(...list.map(b => b.y + b.h)) - y};
};
const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const expand = (b, e) => ({x: b.x - e, y: b.y - e, w: b.w + 2 * e, h: b.h + 2 * e});
/** distance from point q to the border of box b (0 on the border) */
const borderDist = (q, b) => {
  const inside = q.x >= b.x && q.x <= b.x + b.w && q.y >= b.y && q.y <= b.y + b.h;
  if (inside) return Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y);
  return Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h));
};
const segDist = (q, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
  const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / L2);
  return Math.hypot(q.x - (a.x + dx * t), q.y - (a.y + dy * t));
};
/** perimeter parameter of a point on (or projected to) the border of b, clockwise from the top-left corner */
function perim(b, q) {
  const x = clamp(q.x, b.x, b.x + b.w), y = clamp(q.y, b.y, b.y + b.h);
  const dT = Math.abs(y - b.y), dR = Math.abs(b.x + b.w - x), dB = Math.abs(b.y + b.h - y), dL = Math.abs(x - b.x);
  const mn = Math.min(dT, dR, dB, dL);
  if (mn === dT) return x - b.x;
  if (mn === dR) return b.w + (y - b.y);
  if (mn === dB) return b.w + b.h + (b.x + b.w - x);
  return 2 * b.w + b.h + (b.y + b.h - y);
}
function perimPt(b, s) {
  const P = 2 * (b.w + b.h);
  s = ((s % P) + P) % P;
  if (s <= b.w) return {x: b.x + s, y: b.y};
  if (s <= b.w + b.h) return {x: b.x + b.w, y: b.y + s - b.w};
  if (s <= 2 * b.w + b.h) return {x: b.x + b.w - (s - b.w - b.h), y: b.y + b.h};
  return {x: b.x, y: b.y + b.h - (s - 2 * b.w - b.h)};
}
/** points along the border of b from q0 to q1, in the direction with fewer hits on `avoid`, then the shorter */
function borderWalk(b, q0, q1, avoid) {
  const P = 2 * (b.w + b.h);
  const s0 = perim(b, q0), s1 = perim(b, q1);
  const build = dir => {
    const len = dir > 0 ? ((s1 - s0) % P + P) % P : ((s0 - s1) % P + P) % P;
    const pts = [];
    const n = Math.max(2, Math.ceil(len / 12));
    for (let k = 0; k <= n; k++) pts.push(perimPt(b, s0 + dir * len * (k / n)));
    const hits = pts.filter(q => avoid.some(a => q.x > a.x - 6 && q.x < a.x + a.w + 6 && q.y > a.y - 6 && q.y < a.y + a.h + 6)).length;
    return {pts, len, hits};
  };
  const a = build(1), c = build(-1);
  return (a.hits - c.hits || a.len - c.len) <= 0 ? a.pts : c.pts;
}

/** Build the exploded diagram at stage width W and key text size K (stage units). */
function buildDiagram(ctx, p, d, W, K, mode) {
  const th = ctx.theme;
  const t = ctx.t;
  const m = 16;
  const wide = mode !== 'tall';
  const cap = K; // captions (relation labels, key) at the content size: never the smallest text on screen
  const LINK = K * (mode === 'tall' ? 2.8 : mode === 'square' ? 1.6 : 2.3);
  const labelOf = id => (p.elements.find(e => e.id === id) || {}).label || '';
  const pat = sidePatterns(ctx, 'mx');
  const fits = [];
  const tabFit = (id, maxW) => {
    const f = fitWords(ctx, labelOf(id), {maxWidth: Math.max(K * 5, maxW - K * 1.2), size: K, minSize: K, floorSize: K, maxLines: 3, weight: 800});
    fits.push(f);
    return {f, w: f.width + K * 1.2, h: f.height + K * 0.55};
  };
  const probeBand = bandPiece(ctx, {P: 'probe', x: m, y: 0, w: W - 2 * m, K, d, pat});
  const mX = probeBand.along(d.milestone);
  const KR = K * 0.95;
  const tagFit = fitWords(ctx, d.milestoneText(d.milestone), {maxWidth: mode === 'wide' ? K * 16 : K * 10.5, size: K, minSize: K, floorSize: K, maxLines: 3, weight: 800});
  fits.push(tagFit);
  const tagM = milestoneTag(ctx, {K, fit: tagFit});
  const PLm = K * 1.1;
  const postW = Math.max(tagM.w, KR * 2), postH = tagM.h + 4 + PLm + KR;
  const rackW = !wide ? Math.round((W - 2 * m - 24) * 0.5) : Math.round(W * (mode === 'wide' ? 0.24 : 0.35));
  const noteW = !wide ? W - 2 * m - 24 - rackW : Math.round(W * (mode === 'wide' ? 0.34 : 0.37));
  const rack = levelRack(ctx, {name: 'el-rack', prefix: 'mx', w: rackW, K, levels: d.levels, versions: d.versions});
  fits.push(...rack.fits);
  const withNote = d.readings.length > 0;
  const note = withNote ? rtReadingNote(ctx, {w: noteW, head: t.readingProposed, by: `${t.byWord} ${d.readings[0].by}`, text: d.readings[0].text, size: K, bodyGapF: 1}) : null;
  if (note) fits.push(...note.fits);
  const bookW = Math.max(K * 8.2, mode === 'wide' ? 240 : mode === 'square' ? 196 : Math.min(260, (W - 2 * m) * 0.3));
  const plateHs = d.versions.map(v => versionPlateH(ctx, v.label, bookW, K, K * 10));
  const bookH = Math.max(...plateHs) + 16 + 46;
  const tabs = {
    hierarchy: tabFit('hierarchy', rackW),
    // (stacked: a version tab stays narrower than its book so a link can land beside it)
    version1: tabFit('version1', bookW - K * 2.2),
    version2: tabFit('version2', bookW - K * 2.2),
    milestone: tabFit('milestone', Math.max(postW + 40, K * 15)),
    band: tabFit('band', W * 0.4),
    cases: tabFit('cases', W * 0.4),
    timeline: tabFit('timeline', W * 0.4),
  };
  const relW = kind => chip(ctx, p.relationLabels[kind] || kind, {x: 0, y: 0, maxWidth: K * 14, size: cap, maxLines: 2}).box;
  const pos = {};
  const tabPos = {};
  let y = m;
  let band, bandTabSide;
  if (wide) {
    const top1 = y + Math.max(tabs.hierarchy.h, tabs.milestone.h) + 4;
    pos.hierarchy = {x: m, y: top1, w: rackW, h: rack.h};
    if (note) pos.note = {x: W - m - noteW, y: top1, w: noteW, h: note.h};
    const px = clamp(mX, m + rackW + postW / 2 + 30, W - m - noteW - postW / 2 - 30);
    pos.milestone = {x: px - postW / 2, y: top1, w: postW, h: postH};
    const b1 = top1 + Math.max(rack.h, note ? note.h : 0, postH);
    const top2 = b1 + LINK + Math.max(tabs.band.h, tabs.version1.h, tabs.version2.h) + 4;
    // the gaps between the books and the band carry their relation label above the link
    const bookLinks = p.relationships.filter(q => ['version1', 'version2'].includes(q.from === 'band' ? q.to : q.to === 'band' ? q.from : ''));
    const needGx = bookLinks.length ? Math.max(...bookLinks.map(q => relW(q.kind).w)) + 28 : 0;
    const gx = Math.max(K * 3.2, needGx);
    const bx = m + bookW + gx, bw = W - 2 * m - 2 * (bookW + gx);
    band = bandPiece(ctx, {P: 'mx-band', x: bx, y: top2, w: bw, K, d, pat, dayAxis: {x0: m, x1: W - m}, postDays: []});
    const rowH = Math.max(bookH, band.h);
    pos.version1 = {x: m, y: top2 + (rowH - bookH) / 2, w: bookW, h: bookH};
    pos.version2 = {x: W - m - bookW, y: top2 + (rowH - bookH) / 2, w: bookW, h: bookH};
    pos.band = {x: bx, y: top2 + (rowH - band.h) / 2, w: bw, h: band.h};
    if (pos.band.y !== top2) band = bandPiece(ctx, {P: 'mx-band', x: bx, y: pos.band.y, w: bw, K, d, pat, dayAxis: {x0: m, x1: W - m}, postDays: []});
    bandTabSide = mX < bx + bw / 2 ? 'tr' : 'tl';
    tabPos.version1 = 'tl';
    tabPos.version2 = 'tr';
    y = top2 + rowH;
    pos.rows = {hierarchy: 0, note: 0, milestone: 0, version1: 1, version2: 1, band: 1, cases: 2, timeline: 3};
  } else {
    const top1 = y + tabs.hierarchy.h + 4;
    pos.hierarchy = {x: m, y: top1, w: rackW, h: rack.h};
    if (note) pos.note = {x: W - m - noteW, y: top1, w: noteW, h: note.h};
    const b1 = top1 + Math.max(rack.h, note ? note.h : 0);
    const top2 = b1 + LINK + Math.max(tabs.version1.h, tabs.version2.h, tabs.milestone.h) + 4;
    pos.version1 = {x: m, y: top2, w: bookW, h: bookH};
    pos.version2 = {x: W - m - bookW, y: top2, w: bookW, h: bookH};
    const px = clamp(mX, m + bookW + postW / 2 + 20, W - m - bookW - postW / 2 - 20);
    pos.milestone = {x: px - postW / 2, y: top2, w: postW, h: postH};
    const bandY = top2 + Math.max(bookH, postH) + LINK;
    band = bandPiece(ctx, {P: 'mx-band', x: m, y: bandY, w: W - 2 * m, K, d, pat});
    pos.band = {x: m, y: bandY, w: W - 2 * m, h: band.h};
    bandTabSide = mX < W / 2 ? 'br' : 'bl';
    tabPos.version1 = 'tl';
    tabPos.version2 = 'tr';
    y = bandY + band.h + tabs.band.h + 4;
    pos.rows = {hierarchy: 0, note: 0, version1: 1, version2: 1, milestone: 1, band: 2, cases: 3, timeline: 4};
  }
  tabPos.hierarchy = 'tl';
  tabPos.milestone = 'tc';
  tabPos.band = bandTabSide;
  tabPos.timeline = 'bl';
  fits.push(...band.fits);
  // cases: before-cards left of the milestone, after-cards right of it, with an open lane at the milestone day
  const n = d.cases.length;
  const gap = K * 0.62;
  const laneGap = K * 1.4;
  const cw = Math.min(mode === 'tall' ? 340 : K * 19, (W - 2 * m - (n - 1) * gap - laneGap) / n);
  const meas = d.cases.map(c => measureCase(ctx, c, {w: cw, K, t, dayText: d.dayText(c.day)}));
  meas.forEach(q => fits.push(q.labelFit, q.dayFit, ...Object.values(q.stripFits)));
  const ch = Math.max(...meas.map(q => q.h));
  const pinXs = d.cases.map(c => band.along(c.day));
  const slots = sideSlots(d, pinXs, mX, cw, gap, m, W - m, laneGap);
  const casesTabSide = bandTabSide === 'bl' || bandTabSide === 'tl' ? 'tr' : 'tl';
  tabPos.cases = casesTabSide;
  const casesY = y + LINK + tabs.cases.h + 4;
  const cardBoxes = slots.xs.map(cx => ({x: cx - cw / 2, y: casesY, w: cw, h: ch}));
  pos.cases = unionOf(cardBoxes);
  // (the thread gap also holds the relation label beside one thread)
  const rulerY = casesY + ch + Math.max(LINK, cap * 1.76 + K * 1.2);
  const RT = K * 2.45;
  const geo = rulerGeo({x: m, y: rulerY, w: W - 2 * m, h: RT, a0: band.a0, a1: band.a1, from: d.from, to: d.to, unit: d.unit, K});
  pos.timeline = {x: m, y: rulerY, w: W - 2 * m, h: RT};
  // the timeline tab and the neutral key go into the free part of the thread gap above the ruler when they fit
  // (clear of every thread and pin); otherwise into a footer under the ruler
  const threadSegs0 = cardBoxes.map((b, i) => ({a: {x: b.x + b.w / 2, y: b.y + b.h}, b: {x: pinXs[i], y: rulerY}}));
  const gapTop = casesY + ch, gapBot = rulerY;
  const freeIn = box => box.y >= gapTop + 6 && box.y + box.h <= gapBot - 2 && !threadSegs0.some(sg => segmentHitsBox(sg.a, sg.b, box, 6)) && !pinXs.some(px => px > box.x - 14 && px < box.x + box.w + 14);
  let tlBox = null;
  for (const side of ['l', 'r']) {
    const b = {x: side === 'l' ? m : W - m - tabs.timeline.w, y: rulerY - tabs.timeline.h - 4, w: tabs.timeline.w, h: tabs.timeline.h};
    if (freeIn(b)) { tlBox = b; tabPos.timeline = `t${side}`; break; }
  }
  const keyS = noteChipSize(ctx, t.key, {size: cap, maxWidth: Math.min(W - 2 * m, K * 24)});
  let keyBox = null;
  for (let x = W - m - keyS.w; x >= m && !keyBox; x -= 12) {
    const b = {x, y: gapBot - keyS.h - 6, w: keyS.w, h: keyS.h};
    if (freeIn(b) && !(tlBox && hit(b, tlBox, 12)) && Math.abs(b.x + b.w / 2 - mX) > 0 && !(mX > b.x - 20 && mX < b.x + b.w + 20)) keyBox = b;
  }
  const footY = rulerY + RT + 4;
  if (!tlBox) tabPos.timeline = 'bl';
  // (square: the key may run the full footer beside the timeline tab, on one line when it fits)
  const keyW = Math.min(mode === 'square' ? W : K * 24, Math.max(K * 12, W - 2 * m - (tlBox ? 0 : tabs.timeline.w + K)));
  if (!keyBox) {
    const ks = noteChipSize(ctx, t.key, {size: cap, maxWidth: keyW});
    keyBox = {x: W - m - ks.w, y: footY + 4, w: ks.w, h: ks.h};
  }
  const H = Math.max(rulerY + RT, tlBox ? 0 : footY + tabs.timeline.h, keyBox.y + keyBox.h) + m;

  // --- tab boxes
  const tabBox = id => {
    const b = pos[id], tb = tabs[id], side = tabPos[id];
    const x = side === 'tc' ? b.x + b.w / 2 - tb.w / 2 : side[1] === 'l' ? b.x : b.x + b.w - tb.w;
    const yy = side[0] === 't' ? b.y - tb.h - 4 : b.y + b.h + 4;
    return {x, y: yy, w: tb.w, h: tb.h};
  };
  const tabBoxes = Object.fromEntries(ELEMENT_IDS.map(id => [id, tabBox(id)]));

  // --- parts and links
  const pc = {x: pos.milestone.x + postW / 2, knobY: pos.milestone.y + postH - KR};
  const parts = {...Object.fromEntries(ELEMENT_IDS.map(id => [id, pos[id]]))};
  const obstacleParts = [pos.hierarchy, pos.version1, pos.version2, pos.milestone, pos.band, ...cardBoxes, pos.timeline, ...(pos.note ? [pos.note] : []), keyBox];
  const links = [];
  const usedX = [];
  const usedY = [];
  const plumbX = mX;
  const keepX = [{a: plumbX - 26, b: plumbX + 26}];
  const facingTab = (id, edge) => {
    const tb = tabBoxes[id], side = tabPos[id];
    if (!tb) return null;
    const top = side[0] === 't';
    return (edge === 'top' && top) || (edge === 'bottom' && !top) ? tb : null;
  };
  const straight = (idA, A, idB, B, prefer) => {
    const ox0 = Math.max(A.x, B.x), ox1 = Math.min(A.x + A.w, B.x + B.w);
    const oy0 = Math.max(A.y, B.y), oy1 = Math.min(A.y + A.h, B.y + B.h);
    if (ox1 - ox0 >= 30 && (A.y + A.h <= B.y || B.y + B.h <= A.y)) {
      const up = A.y + A.h <= B.y ? {id: idA, b: A} : {id: idB, b: B};
      const lo = up.b === A ? {id: idB, b: B} : {id: idA, b: A};
      const block = [facingTab(up.id, 'bottom'), facingTab(lo.id, 'top')].filter(Boolean).map(tb => ({a: tb.x - 14, b: tb.x + tb.w + 14}));
      const bad = x => block.some(k => x > k.a && x < k.b) || keepX.some(k => x > k.a && x < k.b) || usedX.some(u => Math.abs(u - x) < 50);
      const c0 = prefer ?? (ox0 + ox1) / 2;
      const cands = [];
      for (let x = ox0 + 16; x <= ox1 - 16; x += 6) if (!bad(x)) cands.push(x);
      if (cands.length) {
        const x = cands.sort((p1, p2) => Math.abs(p1 - c0) - Math.abs(p2 - c0))[0];
        usedX.push(x);
        const a = {x, y: up.b === A ? A.y + A.h : A.y}, bpt = {x, y: up.b === B ? B.y + B.h : B.y};
        return {from: a, to: bpt, dir: 'v'};
      }
    }
    if (oy1 - oy0 >= 20 && (A.x + A.w <= B.x || B.x + B.w <= A.x)) {
      const yy = (oy0 + oy1) / 2;
      usedY.push(yy);
      return {from: {x: A.x + A.w <= B.x ? A.x + A.w : A.x, y: yy}, to: {x: B.x + B.w <= A.x ? B.x + B.w : B.x, y: yy}, dir: 'h'};
    }
    const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
    return {from: edgeAnchor(A, cb), to: edgeAnchor(B, ca), dir: 'd'};
  };
  const casesTab = tabBoxes.cases;
  const cardFor = other => {
    const oc = other.x + other.w / 2;
    const ok = cardBoxes.map((b, i) => ({b, i})).filter(q => !(q.b.x < casesTab.x + casesTab.w + 14 && q.b.x + q.b.w > casesTab.x - 14 && casesTabSide[0] === 't'));
    const list = ok.length ? ok : cardBoxes.map((b, i) => ({b, i}));
    return list.sort((p1, p2) => Math.abs(p1.b.x + p1.b.w / 2 - oc) - Math.abs(p2.b.x + p2.b.w / 2 - oc))[0];
  };
  const rels = p.relationships.filter(q => q.from !== q.to && ELEMENT_IDS.includes(q.from) && ELEMENT_IDS.includes(q.to));
  const arrowKind = k => k === 'sequence' || k === 'causal' || k === 'communication';
  rels.forEach((rel, ri) => {
    const pair = [rel.from, rel.to];
    if (pair.includes('cases') && pair.includes('timeline')) {
      // one thread per card, from the card to its pin at its supplied day
      cardBoxes.forEach((b, i) => {
        const cardPt = {x: b.x + b.w / 2, y: b.y + b.h}, pinPt = {x: pinXs[i], y: rulerY};
        const fromCard = rel.from === 'cases';
        links.push({ri, rel, from: fromCard ? cardPt : pinPt, to: fromCard ? pinPt : cardPt, fromBox: fromCard ? b : pos.timeline, toBox: fromCard ? pos.timeline : b, thread: i, dir: 'd'});
      });
      return;
    }
    const boxFor = (id, other) => (id === 'cases' ? cardFor(other).b : pos[id]);
    const A0 = pos[rel.from], B0 = pos[rel.to];
    const A = boxFor(rel.from, B0), B = boxFor(rel.to, A0);
    const prefer = rel.from === 'milestone' || rel.to === 'milestone' ? pc.x : undefined;
    const s = straight(rel.from, A, rel.to, B, prefer);
    links.push({ri, rel, from: s.from, to: s.to, fromBox: A, toBox: B, dir: s.dir});
  });
  // arrowheads stop just short of the edge they point at
  for (const l of links) {
    if (!arrowKind(l.rel.kind)) continue;
    const dx = l.to.x - l.from.x, dy = l.to.y - l.from.y, len = Math.hypot(dx, dy) || 1;
    l.to = {x: l.to.x - (dx / len) * 5, y: l.to.y - (dy / len) * 5};
  }
  const segs = links.map(l => ({a: l.from, b: l.to, ri: l.ri}));
  // plumb line: from the band's split down to the milestone day on the ruler (skipping any card in the way)
  const plumbTop = pos.band.y + pos.band.h, plumbBot = rulerY;
  const plumbParts = [];
  let y0 = plumbTop;
  for (const b of cardBoxes.filter(b => plumbX > b.x - 4 && plumbX < b.x + b.w + 4).sort((a, c) => a.y - c.y)) {
    if (b.y > y0) plumbParts.push([y0, b.y - 4]);
    y0 = b.y + b.h + 4;
  }
  if (plumbBot > y0) plumbParts.push([y0, plumbBot]);
  const plumbSegs = plumbParts.map(([a, b]) => ({a: {x: plumbX, y: a}, b: {x: plumbX, y: b}}));

  // relation labels beside their line (one per relationship)
  const chips = [];
  const tabList = Object.values(tabBoxes);
  const bounds = {x: 8, y: 8, w: W - 16, h: H - 16};
  const inB = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  const labelled = new Set();
  const order = links.map((l, k) => k).sort((a, b) => (links[a].thread ?? -1) - (links[b].thread ?? -1));
  const allSegs = [...segs, ...plumbSegs.map(sg => ({...sg, ri: -1}))];
  const spotFor = (l, w, hh) => {
    const dx = l.to.x - l.from.x, dy = l.to.y - l.from.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const cands = [];
    for (const tt of [0.5, 0.35, 0.65, 0.25, 0.75]) {
      const q = {x: l.from.x + dx * tt, y: l.from.y + dy * tt};
      for (const sgn of [1, -1]) {
        for (const off of [10, 22, 36, 56, 80]) {
          const e = off + (Math.abs(nx) * w + Math.abs(ny) * hh) / 2;
          cands.push({x: q.x + nx * sgn * e - w / 2, y: q.y + ny * sgn * e - hh / 2, w, h: hh, d: off + Math.abs(tt - 0.5) * 40});
          // plain side / above-below spots next to the same point
          cands.push({x: sgn > 0 ? q.x + off : q.x - off - w, y: q.y - hh / 2, w, h: hh, d: off + 4 + Math.abs(tt - 0.5) * 40});
          cands.push({x: q.x - w / 2, y: sgn > 0 ? q.y + off : q.y - off - hh, w, h: hh, d: off + 4 + Math.abs(tt - 0.5) * 40});
        }
      }
    }
    const ok = cands.filter(b2 => inB(b2) && !obstacleParts.some(o => hit(b2, o, 6)) && !tabList.some(o => hit(b2, o, 6)) && !chips.some(c => hit(b2, c.box, 8))
      && !allSegs.some(sg => segmentHitsBox(sg.a, sg.b, b2, 3)));
    return ok.sort((p1, p2) => p1.d - p2.d)[0] || null;
  };
  for (const ri of ctx.show('all') ? [...new Set(links.map(l => l.ri))] : []) {
    const ks = links.map((l, k) => k).filter(k => links[k].ri === ri);
    // (threads: the middle one first)
    ks.sort((p1, p2) => Math.abs(p1 - ks[Math.floor(ks.length / 2)]) - Math.abs(p2 - ks[Math.floor(ks.length / 2)]));
    const l0 = links[ks[0]];
    const text = p.relationLabels[l0.rel.kind] || l0.rel.kind;
    const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: K * 14, size: cap, maxLines: 2});
    const w = probe.box.w, hh = probe.box.h;
    let best = null, k = ks[0];
    for (const kk of ks) {
      best = spotFor(links[kk], w, hh);
      if (best) { k = kk; break; }
    }
    const l = links[k];
    const at = best || {x: (l.from.x + l.to.x) / 2 - w / 2, y: (l.from.y + l.to.y) / 2 - hh / 2, w, h: hh};
    const c = chip(ctx, text, {x: at.x, y: at.y, maxWidth: K * 14, size: cap, maxLines: 2, fill: th.card, stroke: kindColor(ctx, l.rel.kind), name: `rl${l.ri}`, weight: 600});
    chips.push({ri: l.ri, box: c.box, node: c.node, link: k, beside: Boolean(best)});
    labelled.add(l.ri);
  }

  // --- nodes per element
  const tabNode = id => {
    const b = tabBoxes[id], f = tabs[id].f;
    return g(null,
      h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 8), fill: th.ink}),
      ctx.show('key') ? textBlock(f, {x: b.x + K * 0.6, y: b.y + K * 0.28, fill: '#ffffff', name: `el-${id}-tab`}) : h('rect', {x: b.x + 10, y: b.y + b.h / 2 - 4, width: b.w - 20, height: 8, rx: 4, fill: '#ffffff', opacity: 0.7}));
  };
  const focusBox = id => expand(id === 'cases' ? pos.cases : pos[id], 12);
  const groups = {};
  const mk = (id, inner) => {
    const fb = focusBox(id);
    groups[id] = g({name: `el-${id}`},
      id === p.focusElement ? h('path', {name: 'mx-focus', d: roundRectPath(fb.x, fb.y, fb.w, fb.h, 16), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 6, opacity: 0}) : null,
      g({name: `el-${id}-in`}, inner), tabNode(id));
  };
  mk('hierarchy', g({transform: T(pos.hierarchy.x, pos.hierarchy.y)}, rack.node));
  d.versions.forEach((v, i) => {
    const id = i === 0 ? 'version1' : 'version2';
    const bk = versionBook(ctx, {name: `mx-book${i}`, x: pos[id].x, y: pos[id].y, w: bookW, h: bookH, title: v.label, index: i, K, plateMaxH: K * 10, strapFromBottom: 26});
    fits.push(bk.fit);
    mk(id, bk.node);
  });
  const tagNode = milestoneTag(ctx, {name: 'mx-tag', K, fit: tagFit});
  mk('milestone', g(null,
    g({transform: T(pc.x, pc.knobY)}, postArt(ctx, {name: 'mx-post', R: KR, L: PLm})),
    g({transform: T(pc.x, pc.knobY - PLm)}, tagNode.node)));
  mk('band', band.node);
  const cards = d.cases.map((c, i) => caseCard(ctx, {P: `mx-c${i}`, w: cw, h: ch, K, m: meas[i], icon: c.icon, hatch: pat.hatch, dayName: `mx-c${i}-day`, labelName: `mx-c${i}-lab`}));
  mk('cases', d.cases.map((c, i) => g({transform: T(cardBoxes[i].x, casesY)}, cards[i].parts)));
  const pins = d.cases.map((c, i) => g({transform: T(pinXs[i], rulerY + 1)}, pinArt(ctx, `mx-pin${i}`, K * 0.45)));
  mk('timeline', g(null, rulerArt(ctx, {name: 'mx-ruler', geo}), h('path', {d: `M${r(mX)} ${r(rulerY + 3)}V${r(rulerY + K * 0.5)}`, stroke: th.ink, 'stroke-width': 5, 'stroke-linecap': 'round'}), pins));

  const broken = fits.filter(badFit).length + chips.filter(c => !c.beside).length;
  return {W, H, K, broken, brokenList: [...fits.filter(badFit).map(f => f.full), ...chips.filter(c => !c.beside).map(c => `label ${c.ri} not beside its link`)],
    keyBox, keyW: keyBox.w + 2, pos, groups, tabBoxes, rack, note, band, mX, KR, pc, cards, slots, cardBoxes, cw, ch, casesY, pinXs, geo, cap, wide, pat,
    links, segs, chips, plumbSegs, plumbX, rulerY, rels, tabPos};
}

const scene = {
  sizes: {landscape: [1900, 900], square: [1120, 940], portrait: [900, 1340]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const mode = MODE[ctx.view.shape];
    const d = rtData(p);
    let sized = sizeStageW(ctx, (W, K) => buildDiagram(ctx, p, d, W, K, mode), mode === 'tall' ? [STAGE_W.tall] : (mode === 'square' ? [0.9, 1, 1.12, 1.25, 1.4, 1.55] : [1, 1.12, 1.25, 1.4]).map(f => STAGE_W[mode] * f), KEY_PX);
    // fine refinement (quarter-unit steps, slightly wider stages) when the target size was not reached
    // (tall: the single-width search stops at the target while the stage is still width-bound and short;
    // keep growing the text so the diagram fills the portrait frame)
    if (sized.px < KEY_PX - 0.1 || mode === 'tall') {
      const W0 = sized.desk.W, K0 = sized.K;
      for (const fw of mode === 'tall' ? [1] : [0.97, 1, 1.03, 1.06, 1.1, 1.15]) {
        for (let k = K0 + 0.25; k <= K0 * (mode === 'tall' ? 1.45 : 1.1); k += 0.25) {
          const desk = buildDiagram(ctx, p, d, W0 * fw, k, mode);
          if (desk.broken) continue;
          const fit = stageFit(ctx, desk.W, desk.H);
          if (k * fit.pxu > sized.px) sized = {desk, fit, px: k * fit.pxu, K: k};
        }
      }
    }
    const D = sized.desk;
    const K = D.K;
    const rowOf = D.pos.rows;
    const packDy = id => -(K * (mode === 'tall' ? 2.8 : mode === 'square' ? 1.6 : 2.3) - 8) * (rowOf[id] ?? 0);
    // connector nodes (straight, styled by kind) — relation links draw no arrowhead
    const conns = D.links.map((l, k) => {
      const c1 = {x: lerp(l.from.x, l.to.x, 1 / 3), y: lerp(l.from.y, l.to.y, 1 / 3)}, c2 = {x: lerp(l.from.x, l.to.x, 2 / 3), y: lerp(l.from.y, l.to.y, 2 / 3)};
      return connector(ctx, {name: `lk${k}`, from: l.from, to: l.to, c1, c2, kind: l.rel.kind, color: kindColor(ctx, l.rel.kind)});
    });
    // tracer route: along the links in the supplied order, and around the OUTSIDE of each part between links
    const avoid = [...Object.values(D.tabBoxes), ...D.chips.map(c => c.box)];
    // (the outline wraps the part AND its name tab, so the ring never passes over the tab's text)
    const outline = id => expand(unionOf([id === 'cases' ? D.pos.cases : D.pos[id], D.tabBoxes[id]]), 6);
    const endOn = (l, id) => (l.rel.from === id ? l.from : l.to);
    const pts = [];
    const visits = [];
    const push = q => { if (!pts.length || Math.hypot(q.x - pts[pts.length - 1].x, q.y - pts[pts.length - 1].y) > 0.5) pts.push({x: q.x, y: q.y}); };
    const order = p.traversalOrder;
    const linkBetween = (a, b) => {
      const ls = D.links.filter(l => (l.rel.from === a && l.rel.to === b) || (l.rel.from === b && l.rel.to === a));
      if (!ls.length) return null;
      const lab = D.chips.find(c => ls.some(l => l.ri === c.ri));
      return lab ? D.links[lab.link] : ls[0];
    };
    const onOutline = (id, q) => {
      const b = outline(id);
      const s = perim(b, q);
      return perimPt(b, s);
    };
    let cur = null;
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      if (!D.pos[id]) continue;
      if (i === 0) {
        const nl = order[1] ? linkBetween(id, order[1]) : null;
        cur = onOutline(id, nl ? endOn(nl, id) : {x: D.pos[id].x, y: D.pos[id].y});
        push(cur);
        visits.push({id, n: pts.length - 1});
        continue;
      }
      const prev = order[i - 1];
      const l = linkBetween(prev, id);
      if (l) {
        const a = endOn(l, prev), b = endOn(l, id);
        for (const q of borderWalk(outline(prev), cur, onOutline(prev, a), avoid)) push(q);
        push(a);
        push(b);
        cur = onOutline(id, b);
        push(cur);
      } else {
        const tgt = onOutline(id, cur);
        push(tgt);
        cur = tgt;
      }
      visits.push({id, n: pts.length - 1});
    }
    const poly = polyline(pts.length > 1 ? pts : [pts[0] || {x: 0, y: 0}, pts[0] || {x: 0, y: 0}]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    const vis = visits.map(v => ({id: v.id, t: cum[v.n] / total}));
    const visitT = id => {
      const v = vis.find(q => q.id === id);
      return v ? lerp(W_.trace[0], W_.trace[1], v.t) : null;
    };
    const key = noteChip(ctx, ctx.t.key, {name: 'mx-key', x: D.keyBox.x, y: D.keyBox.y, size: D.cap, maxWidth: D.keyW, color: th.inkSoft, dashed: true, opacity: 0});
    return {D, sized, fit: sized.fit, d, conns, poly, vis, visitT, packDy, key, avoid};
  },
  build(ctx, L) {
    const D = L.D;
    const th = ctx.theme;
    const win = deskWindow(ctx, {prefix: 'mx-win', x: 0, y: 0, w: D.W, h: D.H, radius: 26, seedKey: 'rt-desk'});
    const K = D.K;
    return g({transform: T(L.fit.ox, L.fit.oy, 0, L.fit.s)},
      win.surface,
      D.pat.defs,
      // the tracer ring runs UNDER every text-bearing layer (parts, tabs, links, labels): it never covers text
      g({name: 'mx-tracer', opacity: 0},
        h('circle', {r: r(K * 1.0), fill: th.accent, opacity: 0.25}),
        h('circle', {r: r(K * 0.5), fill: th.accent, stroke: th.paper, 'stroke-width': 3.5})),
      D.note ? g({name: 'el-note', transform: T(D.pos.note.x, D.pos.note.y)}, D.note.node) : null,
      g({name: 'mx-plumb', opacity: 0}, D.plumbSegs.map((s, k) => h('path', {name: `mx-plumb${k}`, d: `M${r(s.a.x)} ${r(s.a.y)}V${r(s.b.y)}`, stroke: th.accent2, 'stroke-width': 3.5, 'stroke-dasharray': '9 7', fill: 'none'}))),
      ELEMENT_IDS.map(id => D.groups[id]),
      L.conns.map(c => c.node),
      D.chips.map(c => g({name: `rlw${c.ri}`, opacity: 0}, c.node)),
      L.key.node,
      win.frame,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const D = L.D;
    const d = L.d;
    const nodes = {};
    const sep = ease.inOutCubic(seg(u, ...W_.sep));
    const tr = seg(u, ...W_.trace);
    const pt = L.poly.at(tr);
    const focusT = L.visitT(p.focusElement);
    const focusK = focusT === null ? 0 : clamp(1 - Math.abs(u - focusT) / 0.08) * (u >= W_.trace[0] && u <= W_.trace[1] + 0.02 ? 1 : 0);
    const looks = {};
    for (const id of [...ELEMENT_IDS, 'note']) {
      if (id === 'note' && !D.pos.note) continue;
      const dy = L.packDy(id) * (1 - sep);
      const b = id === 'cases' ? D.pos.cases : D.pos[id];
      const k = id === p.focusElement ? 1 + 0.14 * ease.inOutSine(focusK) : 1;
      const tf = `${T(0, dy)}${k !== 1 ? ` ${scaleAbout(b.x + b.w / 2, b.y + b.h / 2, k)}` : ''}`;
      nodes[id === 'note' ? 'el-note' : `el-${id}`] = {transform: id === 'note' ? `${T(0, dy)} ${T(b.x, b.y)}` : tf};
      looks[id] = {dy: r(dy), k: r(k, 3)};
    }
    nodes['mx-focus'] = {opacity: r(ease.inOutSine(focusK), 3)};
    // relations draw on one after another (a relationship's threads together), each label once its line is drawn
    const nRel = Math.max(1, D.rels.length);
    const relP = ri => {
      const a = lerp(W_.rel[0], W_.rel[1] - 0.06, nRel > 1 ? ri / (nRel - 1) : 0);
      return seg(u, a, a + 0.06);
    };
    L.conns.forEach((c, k) => {
      const pr = relP(D.links[k].ri);
      Object.assign(nodes, c.frame(pr, pr > 0 ? 1 : 0));
    });
    D.chips.forEach(c => { nodes[`rlw${c.ri}`] = {opacity: r(clamp((relP(c.ri) - 0.6) / 0.4), 3)}; });
    const tOn = u >= W_.trace[0] && u <= W_.trace[1] + 0.015;
    nodes['mx-tracer'] = {transform: T(pt.x, pt.y), opacity: tOn ? 1 : 0};
    // states: the milestone ties the band split to its day (plumb line + lane marking) when the tracer reaches it;
    // the case strips when it reaches the cases
    const zT = L.visitT('milestone') ?? W_.trace[1];
    const cT = Math.max(zT + 0.02, L.visitT('cases') ?? W_.trace[1]);
    const z = seg(u, zT, zT + 0.06);
    Object.assign(nodes, D.band.zones(D.mX, z, D.KR));
    nodes['mx-plumb'] = {opacity: r(z, 3)};
    const strips = d.cases.map((c, i) => seg(u, cT + i * 0.015, cT + i * 0.015 + 0.04));
    d.cases.forEach((c, i) => {
      const sp = strips[i];
      const P = `mx-c${i}`;
      nodes[`${P}-sb`] = {opacity: c.side === 'before' ? r(sp, 3) : 0};
      nodes[`${P}-sa`] = {opacity: c.side === 'after' ? r(sp, 3) : 0};
      nodes[`${P}-so`] = {opacity: c.side === 'on' ? r(sp, 3) : 0};
      nodes[`${P}-s0`] = {opacity: r(1 - sp, 3)};
      nodes[`mx-pin${i}-b`] = {opacity: c.side === 'before' ? r(sp, 3) : 0};
      nodes[`mx-pin${i}-a`] = {opacity: c.side === 'after' ? r(sp, 3) : 0};
      nodes[`mx-pin${i}-o`] = {opacity: c.side === 'on' ? r(sp, 3) : 0};
    });
    nodes['mx-key'] = {opacity: r(seg(u, ...W_.key), 3)};
    // --- semantics: every link's two ends on their parts; its label beside it; the tracer off text
    const onEdgeOf = (q, b, tol) => borderDist(q, b) <= tol && !(q.x > b.x + tol && q.x < b.x + b.w - tol && q.y > b.y + tol && q.y < b.y + b.h - tol);
    const conns = D.links.map(l => ({
      from: l.rel.from, to: l.rel.to, kind: l.rel.kind, thread: l.thread ?? null,
      arrow: l.rel.kind === 'sequence' || l.rel.kind === 'causal' || l.rel.kind === 'communication',
      endsOk: onEdgeOf(l.from, l.fromBox, 2) && onEdgeOf(l.to, l.toBox, 8),
      len: r(Math.hypot(l.to.x - l.from.x, l.to.y - l.from.y) / D.K, 2),
    }));
    const labels = D.chips.map(c => {
      const l = D.links[c.link];
      const cc = {x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2};
      let gap = Infinity;
      for (let k = 0; k <= 24; k++) {
        const q = {x: lerp(l.from.x, l.to.x, k / 24), y: lerp(l.from.y, l.to.y, k / 24)};
        gap = Math.min(gap, Math.hypot(Math.max(c.box.x - q.x, 0, q.x - c.box.x - c.box.w), Math.max(c.box.y - q.y, 0, q.y - c.box.y - c.box.h)));
      }
      return {ri: c.ri, beside: c.beside, onLine: segmentHitsBox(l.from, l.to, c.box, 0), gap: r(gap, 1)};
    });
    const inside = b => pt.x > b.x + 4 && pt.x < b.x + b.w - 4 && pt.y > b.y + 4 && pt.y < b.y + b.h - 4;
    const onText = ['hierarchy', 'version1', 'version2', 'band', 'timeline'].some(id => inside(D.pos[id])) || D.cardBoxes.some(inside) || (D.pos.note && inside(D.pos.note));
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {nodes, semantic: {
      beat, tracer: {x: r(pt.x), y: r(pt.y)}, tracerOn: tOn, tracerOnText: tOn && onText, sep: r(sep, 3), looks,
      conns, labels, threads: conns.filter(c => c.thread !== null).length, cases: d.cases.length,
      plumb: {x: r(D.plumbX), rulerDayX: r(D.geo.along(d.milestone)), shown: r(z, 3), top: r(D.plumbSegs.length ? D.plumbSegs[0].a.y : 0), bandBottom: r(D.pos.band.y + D.pos.band.h), bottom: r(D.plumbSegs.length ? D.plumbSegs[D.plumbSegs.length - 1].b.y : 0), rulerTop: r(D.rulerY)},
      visits: L.vis.map(v => v.id), focus: p.focusElement, focusScale: looks[p.focusElement] ? looks[p.focusElement].k : 1, focusHalo: r(ease.inOutSine(focusK), 3),
      zones: r(z, 3), sides: d.cases.map((c, i) => (strips[i] >= 1 ? c.side : 'neutral')), expectedSides: d.cases.map(c => c.side),
      cardsLeftOfPost: d.cases.map((c, i) => D.slots.xs[i] < D.mX), sidesKept: D.slots.kept,
      relationsDrawn: D.rels.map((q, ri) => r(relP(ri), 2)),
      textPx: r(L.sized.px, 2), stage: [r(D.W), r(D.H), r(D.K, 2)], broken: D.brokenList, keyShown: r(seg(u, ...W_.key), 3),
    }};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-10-mechanism',
    title: 'Transitional rule — the parts of the band and how they are linked',
    titleEs: 'Regla transitoria — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Regla transitoria',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view of the band desk: hierarchy rack, the two bound versions, the milestone post and tag, the transitional band, the case cards and the timeline ruler separate, then only the supplied relationships are drawn by kind; a tracer follows the supplied traversal order while the focus part enlarges, and the lane and case strips show positions against the supplied milestone only.',
    tags: ['sources', 'transitional rule', 'mechanism', 'versions', 'milestone', 'band', 'timeline', 'relations', 'tracer', 'hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/regla-transitoria.js', 'src/animations/sources/kits/ambito-temporal.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RT_STRINGS,
  scene,
});
