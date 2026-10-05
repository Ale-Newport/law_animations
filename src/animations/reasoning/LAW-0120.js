/**
 * LAW-0120 — Límite de una conclusión · inspect
 *
 * Storyboard (the story's end state as context; while it is inspected it
 * shrinks to a thumbnail and a rectangular reading magnifier lifts ONE
 * situation card out, with the stretch of cord beside it):
 *  0.00–0.20 build       The context: the plaque with the proposition (as
 *                        supplied), the cord knotted around the cards supplied
 *                        as covered, pennants inside, dashed rings outside, the
 *                        note with the supplied issue, assumption and key. The
 *                        focus card stands on its own between the two groups.
 *  0.20–0.45 isolate     The context shrinks to a thumbnail; the magnifier is
 *                        laid on the focus card and the cord next to it at
 *                        scale 1 — a real copy at the same coordinates — and
 *                        lifted into the free half, enlarging them while the
 *                        rest of the thumbnail dims.
 *  0.45–0.75 substitute  Inside the lens the supplied datum is replaced: the
 *                        old text is picked up as a paper slip, pulled down out
 *                        of the lens and struck through (kept in view); the new
 *                        text appears on the card (old out first, then new in).
 *                        Only then the dependent geometry changes: the cord is
 *                        re-laid to the scope supplied for AFTER (e.g. stretched
 *                        out around the card), and the card's marker follows
 *                        (dashed ring → pennant). Nothing else moves.
 *  0.75–1.00 return      The magnifier is set back and removed; the struck slip
 *                        travels into a "changed datum — before" tag under the
 *                        card, a Δ pin marks the card, and the context grows back
 *                        to full size with its note. Seeking back restores the
 *                        old datum and the old cord exactly.
 * Wide and square boxes: thumbnail on the left, lens on the right. Tall boxes:
 * thumbnail on top, lens below. The context itself uses one layout family
 * (covered cards | focus card | cards not examined), re-proportioned per box.
 * Legal content: fictional, jurisdiction unspecified; the new text and the
 * scope after the change are supplied by the author; being outside the cord
 * only means "not examined". Nothing is inferred about validity or outcome.
 * @module animations/reasoning/LAW-0120
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, oneOf, inspectFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {barMagnifierArt, barMagnifierFrame, BAR_HANDLE} from './kits/hecho-y-regla.js';
import {
  limFields, LIM_STRINGS, LIM_DEFAULTS, SCOPES, resolveSituations, limColors, unitsPer1080px, packZone, cardGeom, cardArt, cardTransform,
  plaqueGeom, plaqueArt, mapSheet, cordArt, cordFrame, noteGeom, noteArt, roundedHull, cardFootprint, loopFrom, track, boxBounds, distToBox,
  inside, boxCorners, hit,
} from './kits/limite-de-una-conclusion.js';

const ID = 'LAW-0120';
const DURATION = 9000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  // isolate (mirrors the return): the magnifier is laid on the full-size card and lifts its copy off while the
  // context shrinks to its thumbnail — the frame is never a small thumbnail on a blank page
  caption: [0.01, 0.08], notesIn: [0.03, 0.1], notesOut: [0.16, 0.2], shrink: [0.19, 0.27], settle: [0.19, 0.205], open: [0.205, 0.285], dim: [0.27, 0.34],
  detach: [0.46, 0.5], drop: [0.5, 0.57], ctxOut: [0.5, 0.55], strike: [0.57, 0.62], newIn: [0.575, 0.64], relay: [0.65, 0.73], marker: [0.71, 0.75],
  // return: the dim lifts and the struck slip sets off, sliding on the desk (under the magnifier, around the cards)
  // toward its tag; the context grows back to full size while the magnifier is set back onto its (growing) card; the
  // slip reaches its tag while the context is still growing and rides it; then the magnifier is removed, the Δ pin and
  // the notes follow (the frame is never a small thumbnail on a blank page)
  undim: [0.735, 0.765], toTag: [0.735, 0.795], close: [0.745, 0.815], grow: [0.75, 0.815], tag: [0.772, 0.795], away: [0.81, 0.822], pin: [0.815, 0.84], notesBack: [0.82, 0.85],
};
const K_OUT = 0.8;

const EXTRA = {
  en: {before: 'before', contextDefault: 'Context: the proposition outlined on the survey map', markerDefault: 'Changed datum (as supplied)'},
  es: {before: 'antes', contextDefault: 'Contexto: la proposición contorneada en el plano', markerDefault: 'Dato cambiado (según lo aportado)'},
};
const STRINGS = {en: {...LIM_STRINGS.en, ...EXTRA.en}, es: {...LIM_STRINGS.es, ...EXTRA.es}};

const insp = inspectFields(['situation']);
const sceneSchema = {
  ...limFields,
  ...insp,
  focusTarget: oneOf('Detail enlarged and substituted: the text of the focus situation card', ['situation']),
  focusSituation: int('Zero-based index of the situation card that is inspected; beforeValue replaces its printed text before the change', 0, 5),
  afterScope: oneOf('Scope of the focus situation AFTER the substitution, as supplied by the author (the cord is re-laid to it); never inferred from the new text', SCOPES),
  detailGeometry: {
    ...insp.detailGeometry,
    properties: {
      zoom: insp.detailGeometry.properties.zoom,
      placement: oneOf('Where the lens opens: auto (beside the thumbnail on wide/square boxes, below it on tall ones)', ['auto']),
    },
  },
};

const defaultParams = {
  ...LIM_DEFAULTS,
  focusTarget: 'situation',
  focusSituation: 2,
  beforeValue: 'Notice sent only by text message',
  afterValue: 'Notice sent by text message and pinned on the hall board',
  afterScope: 'included',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'Context: Note 7 outlined on the survey map', marker: 'Changed datum (as supplied)'},
};

const M = 16;
const tmap = (Tc, q) => ({x: Tc.x + Tc.k * q.x, y: Tc.y + Tc.k * q.y});
const tstr = Tc => `translate(${r(Tc.x)} ${r(Tc.y)}) scale(${r(Tc.k, 5)})`;

/** The cord loop for a set of covered cards plus a "virtual" focus footprint that grows from a point to the card (k 0 → 1). */
function loopAt(L, k) {
  const pts = L.coveredOthers.flatMap(c => cardFootprint(c));
  if (k > 0) {
    const fp = cardFootprint(L.focus);
    pts.push(...fp.map(q => ({x: lerp(L.anchor.x, q.x, k), y: lerp(L.anchor.y, q.y, k)})));
  }
  if (!pts.length) pts.push(L.anchor);
  return loopFrom(roundedHull(pts, L.m), L.ring);
}

/** The visible cord during the re-lay (e 0 → 1): pulled back along the old loop, then paid out along the new one. */
function cordAt(L, e) {
  const tot = L.retract + L.extend;
  if (tot < 1 || e >= 1) return {tr: L.trA, len: L.trA.total};
  const pos = clamp(e, 0, 1) * tot;
  return pos < L.retract ? {tr: L.trB, len: L.trB.total - pos} : {tr: L.trA, len: L.prefix + pos - L.retract};
}
/** Points along the visible stretch of the cord (every ~6 units). */
function cordPts(c) {
  const n = Math.max(2, Math.ceil(c.len / 6));
  return [...Array(n + 1).keys()].map(i => c.tr.at((c.len * i) / n));
}

const slipRect = (L, x, y, k) => ({x: x - L.pad * k, y: y - L.pad * 0.8 * k, w: L.slip.w * k, h: L.slip.h * k});
/** slip scale along its route (fraction f of the route): it reaches the tag's scale early, then only travels */
const slipK = (L, f) => {
  const q = clamp(f / 0.3, 0, 1);
  return lerp(L.route.k0, L.route.k1, q * q * (3 - 2 * q));
};

/** The two cone lines joining a source rectangle and the lens window (as the lens framework draws them). */
function coneCorners(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x;
    const rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y;
  const ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
}

/**
 * Lens frame for a source that moves (the context grows back while the lens closes): the window R between the
 * source's current place SN and the destination; the copy inside keeps mapping the thumbnail source S0 onto R, so at
 * p = 0 the window is an exact scale-1 copy on top of the card wherever the card is now.
 */
function lensFrameAt(L, S0, SN, R, p, dim) {
  const out = L.lens.frame(p, dim);
  const k = R.w / S0.w, ky = R.h / S0.h;
  const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
  const [a1, a2, b1, b2] = coneCorners(SN, R);
  out['lz-coneA'] = {...out['lz-coneA'], x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y)};
  out['lz-coneB'] = {...out['lz-coneB'], x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y)};
  out['lz-cliprect'] = rect;
  out['lz-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
  out['lz-bg'] = rect;
  out['lz-border'] = rect;
  out['lz-content'] = {transform: `${T(R.x - S0.x * k, R.y - S0.y * ky)} scale(${r(k, 4)} ${r(ky, 4)})`};
  out['lz-src'] = {...out['lz-src'], d: roundRectPath(SN.x, SN.y, SN.w, SN.h, 10)};
  return out;
}

/** The neutral Δ disc (accent2 disc, white Δ) used for the card's pin and the tag's badge. */
function pinGlyph(ctx, rad, at, name) {
  const th = ctx.theme;
  const k = rad / 0.75;
  return g({name, transform: at ? T(at.x, at.y) : undefined},
    h('circle', {name: name ? `${name}-disc` : undefined, r: r(rad), fill: th.accent2, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: `M0 ${r(-k * 0.42)}L${r(k * 0.4)} ${r(k * 0.3)}H${r(-k * 0.4)}Z`, fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linejoin': 'round'}));
}

/** Changed-datum tag node (box L.tagBox), its dashed leader to the card, and the slip's resting pose inside it. */
function buildTag(ctx, L) {
  const th = ctx.theme;
  const fb = L.focus.box, fg = L.focus.geo, pad = L.pad;
  const tb = L.tagBox;
  // dashed leader from the tag to the card. It lands on the MIDDLE of the card's left or right side (between the
  // header and the scope pill, or on the dashed ring when the card ends up outside the outline), arriving
  // horizontally, and crosses no text, no dashed ring, no pill, the plaque or the note (it may cross the cord)
  const ringOut = L.scopeAfter !== 'included' ? 11 : 0;
  const bodyTop = fb.y + fg.head, bodyBot = fb.y + fb.h - fg.tagH;
  const ay = (bodyTop + bodyBot) / 2;
  const cardAnchors = [{x: fb.x - ringOut, y: ay, dx: -1}, {x: fb.x + fb.w + ringOut, y: ay, dx: 1}];
  const focusObs = {x: fb.x - ringOut - 3, y: fb.y - ringOut - 3, w: fb.w + 2 * ringOut + 6, h: fb.h + ringOut + 6};
  const obsLd = [
    ...L.cards.filter(c => c.i !== L.fi).map(c => boxBounds(c.box, {top: 15, side: 15, bottom: 15})),
    {x: L.plaque.x - 6, y: L.plaque.y - 6, w: L.plaque.w + 12, h: L.pg.h + 12},
    ...(L.noteBox ? [{x: L.noteBox.x - 6, y: L.noteBox.y - 6, w: L.noteBox.w + 12, h: L.noteBox.h + 12}] : []),
    // the Δ pin beside the card's header
    {x: fb.x - L.s * 1.8, y: fb.y + fg.head * 0.5 - L.s * 0.85, w: L.s * 1.7, h: L.s * 1.7},
  ];
  L.leaderObs = [...obsLd, focusObs];
  const insideB = (q, b0, sh) => q.x > b0.x + sh && q.x < b0.x + b0.w - sh && q.y > b0.y + sh && q.y < b0.y + b0.h - sh;
  const segOk = (p0, p1, last) => {
    const n = Math.max(2, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) / 4));
    for (let k = 0; k <= n; k++) {
      const q = {x: p0.x + ((p1.x - p0.x) * k) / n, y: p0.y + ((p1.y - p0.y) * k) / n};
      if (obsLd.some(o => insideB(q, o, 0)) || insideB(q, tb, 1)) return false;
      if (!last && insideB(q, focusObs, 0)) return false;
      if (q.x < L.map.x + 4 && q.x < tb.x - 4) return false;
    }
    return true;
  };
  const tagAnchors = [{x: tb.x + tb.w / 2, y: tb.y}, {x: tb.x + tb.w / 2, y: tb.y + tb.h}, {x: tb.x, y: tb.y + tb.h / 2}, {x: tb.x + tb.w, y: tb.y + tb.h / 2}];
  const lanesX = [], lanesY = [];
  for (let x = L.map.x + 8; x <= Math.max(L.map.x + L.map.w, tb.x + tb.w) - 8; x += 10) lanesX.push(x);
  for (let y = L.map.y + 8; y <= Math.max(L.map.y + L.map.h, tb.y + tb.h) - 8; y += 10) lanesY.push(y);
  let leader = null;
  for (const ca of cardAnchors) {
    const pre = {x: ca.x + ca.dx * 18, y: ca.y};
    for (const ta of tagAnchors) {
      const routes = [[ta, pre], [ta, {x: pre.x, y: ta.y}, pre], [ta, {x: ta.x, y: pre.y}, pre],
        ...lanesX.map(X => [ta, {x: X, y: ta.y}, {x: X, y: pre.y}, pre]), ...lanesY.map(Y => [ta, {x: ta.x, y: Y}, {x: pre.x, y: Y}, pre])];
      for (const rt of routes) {
        const pts = [...rt, {x: ca.x, y: ca.y}];
        const len = pts.slice(1).reduce((acc, q, i) => acc + Math.hypot(q.x - pts[i].x, q.y - pts[i].y), 0) + (pts.length - 3) * 30;
        if (leader && len >= leader.len) continue;
        if (pts.slice(1).every((q, i) => segOk(pts[i], q, i === pts.length - 2))) leader = {pts, len};
      }
    }
  }
  L.tagLeaderPath = leader ? leader.pts : null;
  L.tagLeader = !!leader;
  // neutral "changed" colour (accent2, as the lens and the Δ pin); the text stays ink
  const bd = {x: tb.x + tb.w - pad - L.s * 0.55, y: tb.y + pad + L.s * 0.55};
  L.tagNode = g({name: 'tag', opacity: 0},
    leader ? h('path', {name: 'tag-leader', d: leader.pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent2, 'stroke-width': 2.4, 'stroke-dasharray': '4 4', 'stroke-linejoin': 'round'}) : null,
    leader ? h('circle', {cx: r(leader.pts[leader.pts.length - 1].x), cy: r(leader.pts[leader.pts.length - 1].y), r: 4, fill: th.accent2}) : null,
    h('path', {d: roundRectPath(tb.x + 4, tb.y + 7, tb.w, tb.h, 10), fill: th.shadow}),
    h('path', {name: 'tag-box', d: roundRectPath(tb.x, tb.y, tb.w, tb.h, 10), fill: th.card, stroke: th.accent2, 'stroke-width': 2.6}),
    L.tagHead ? textBlock(L.tagHead, {x: tb.x + pad, y: tb.y + pad, fill: th.ink}) : h('rect', {x: r(tb.x + pad), y: r(tb.y + pad + 4), width: r(tb.w * 0.6), height: r(L.s * 0.5), rx: r(L.s * 0.25), fill: th.accentSoft}),
    pinGlyph(ctx, L.s * 0.55, bd));
  L.tagPoseL = {x: tb.x + pad + L.s * 0.25, y: tb.y + pad + (L.tagHead ? L.tagHead.height + L.s * 0.35 : L.s * 0.6), k: 1};
}

/**
 * Where the changed-datum tag goes and how the struck slip reaches it. The slip travels while the context grows
 * back (and the magnifier closes onto its card), so its route is planned in the context's own coordinates — where the
 * cards stand still — and simulated frame by frame against the growing context: the slip never covers a card or the
 * plaque, stays inside the frame and never jumps. Tag spots are tried nearest-first; spots with a clear leader to the
 * card come first.
 */
function planSlip(ctx, L) {
  const D = ctx.design, Tt = L.Tt;
  const obsL = [...L.cards.map(c => boxBounds(c.box)), {x: L.plaque.x, y: L.plaque.y, w: L.plaque.w, h: L.pg.h}];
  L.slipObsL = obsL;
  // (the same timing as frame(): the context starts to grow while the slip still rests under the magnifier)
  const TcAt = u => {
    const e = ease.inOutCubic(seg(u, ...W.grow));
    return {x: lerp(Tt.x, 0, e), y: lerp(Tt.y, 0, e), k: lerp(Tt.k, 1, e)};
  };
  const T0 = TcAt(W.toTag[0]);
  const S_L = {x: (L.outPose.x - T0.x) / T0.k, y: (L.outPose.y - T0.y) / T0.k};
  L.route = {k0: L.outPose.k / T0.k, k1: 1};
  const uStart = Math.min(W.grow[0], W.toTag[0]);
  const frames = Math.max(8, Math.round(((W.toTag[1] - uStart) * DURATION) / 1000 * 60));
  const simulate = tr => {
    let prev = null;
    for (let i = 0; i <= frames; i++) {
      const uu = lerp(uStart, W.toTag[1], i / frames), Tc = TcAt(uu);
      const tau = seg(uu, ...W.toTag), eR = ease.inOutSine(tau);
      // before it sets off the slip rests in the frame (its place in the growing context changes)
      const q = tau > 0 ? tr.at(eR * tr.total) : {x: (L.outPose.x - Tc.x) / Tc.k, y: (L.outPose.y - Tc.y) / Tc.k};
      const kL = tau > 0 ? slipK(L, eR) : L.outPose.k / Tc.k;
      const RL = slipRect(L, q.x, q.y, kL);
      if (i < frames && obsL.some(o => hit(RL, o, 2))) return false;
      const Wr = {x: Tc.x + Tc.k * RL.x, y: Tc.y + Tc.k * RL.y, w: Tc.k * RL.w, h: Tc.k * RL.h};
      if (Wr.x < 2 || Wr.y < 2 || Wr.x + Wr.w > D.w - 2 || Wr.y + Wr.h > D.h - 2) return false;
      const pw = {x: Tc.x + Tc.k * q.x, y: Tc.y + Tc.k * q.y};
      if (prev && Math.hypot(pw.x - prev.x, pw.y - prev.y) > 80) return false;
      prev = pw;
    }
    return true;
  };
  // a grid of free places for the slip (at the tag's scale) in context coordinates; shortest 8-connected path
  const x0 = Math.min(S_L.x, L.map.x) - 80, x1 = Math.max(S_L.x, L.map.x + L.map.w) + 80;
  const y0 = Math.min(S_L.y, L.map.y) - 80, y1 = Math.max(S_L.y, L.map.y + L.map.h) + 80;
  const st = 20, nx = Math.ceil((x1 - x0) / st) + 1, ny = Math.ceil((y1 - y0) / st) + 1;
  const free = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const sr = slipRect(L, x0 + i * st, y0 + j * st, 1);
    free[j * nx + i] = obsL.some(o => hit(sr, o, 12)) ? 0 : 1;
  }
  const cell = q => ({i: clamp(Math.round((q.x - x0) / st), 0, nx - 1), j: clamp(Math.round((q.y - y0) / st), 0, ny - 1)});
  const gridPath = (A, B) => {
    const a = cell(A), b = cell(B);
    const dist = new Float64Array(nx * ny).fill(Infinity), prev = new Int32Array(nx * ny).fill(-1), done = new Uint8Array(nx * ny);
    const ia = a.j * nx + a.i, ib = b.j * nx + b.i;
    dist[ia] = 0;
    const open = [ia];
    while (open.length) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (dist[open[k]] < dist[open[bi]]) bi = k;
      const cur = open.splice(bi, 1)[0];
      if (done[cur]) continue;
      done[cur] = 1;
      if (cur === ib) break;
      const ci = cur % nx, cj = (cur - ci) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = ci + di, nj = cj + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue;
        const nn = nj * nx + ni;
        if (done[nn] || (!free[nn] && nn !== ib)) continue;
        const nd = dist[cur] + Math.hypot(di, dj);
        if (nd < dist[nn]) { dist[nn] = nd; prev[nn] = cur; open.push(nn); }
      }
    }
    if (!done[ib]) return null;
    const cells = [];
    for (let c = ib; c !== -1; c = prev[c]) cells.push(c);
    cells.reverse();
    // keep only the turns (a polyline through the free cells)
    const pts = [A];
    for (let k = 1; k < cells.length - 1; k++) {
      const [p0, p1, p2] = [cells[k - 1], cells[k], cells[k + 1]];
      if (p1 - p0 !== p2 - p1) pts.push({x: x0 + (p1 % nx) * st, y: y0 + Math.floor(p1 / nx) * st});
    }
    pts.push(B);
    return pts;
  };
  const routeFor = P1 => {
    const direct = track([S_L, P1]);
    if (simulate(direct)) return direct;
    const pts = gridPath(S_L, P1);
    if (!pts) return null;
    const tr = track(pts);
    return simulate(tr) ? tr : null;
  };
  const saved = {b: L.tagBox, h: L.tagHead};
  let found = null;
  for (const needLeader of [true, false]) {
    const tried = [];
    for (const c of L.tagCands || []) {
      if (tried.length >= 24) break;
      if (tried.some(t => Math.hypot(t.x - c.b.x, t.y - c.b.y) < 36)) continue;
      tried.push(c.b);
      L.tagBox = c.b;
      L.tagHead = c.headF;
      buildTag(ctx, L);
      if (needLeader && !L.tagLeader) continue;
      const tr = routeFor({x: L.tagPoseL.x, y: L.tagPoseL.y});
      if (tr) { found = {c, tr}; break; }
    }
    if (found) break;
  }
  if (!found) {
    L.tagBox = saved.b;
    L.tagHead = saved.h;
    buildTag(ctx, L);
    L.route.tr = track([S_L, {x: L.tagPoseL.x, y: L.tagPoseL.y}]);
    L.slipRouteClear = false;
  } else {
    L.tagBox = found.c.b;
    L.tagHead = found.c.headF;
    buildTag(ctx, L);
    L.route.tr = found.tr;
    L.slipRouteClear = true;
  }
}

function compose(ctx, s, wideP = false, sideNote = false, noteOnMap = false, dense = false) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const u = unitsPer1080px(ctx);
  const px = v => v * u;
  const shape = ctx.view.shape;
  const sits0 = resolveSituations(p.facts);
  const fi = clamp(p.focusSituation, 0, sits0.length - 1);
  const beforeText = p.beforeValue || sits0[fi].text;
  const afterText = p.afterValue || beforeText;
  const sits = sits0.map(q => (q.i === fi ? {...q, text: beforeText} : q));
  const scopeBefore = sits[fi].scope;
  const scopeAfter = p.afterScope;
  // caption
  const capS = Math.min(s, Math.max(s * 0.84, px(18)));
  const capFit = ctx.show('all') ? ctx.fit(p.contextLabels.context || t.contextDefault, {maxWidth: D.w - 2 * M, size: capS, minSize: capS, maxLines: 2, weight: 600}) : null;
  const capH = capFit ? capFit.height + capS * 0.6 : 10;
  // note strip
  const row = shape !== 'portrait';
  const noteS = Math.min(s, Math.max(s * 0.86, px(20)));
  // the notes go down the right side (wide boxes; square boxes when that leaves more room for the cards) or below
  const side = shape === 'landscape' || sideNote;
  const sideW = side ? clamp(D.w * (sideNote ? 0.22 : 0.24), sideNote ? 250 : 300, 470) : 0;
  const top = M + capH;
  const ngTry = w => noteGeom(ctx, {w, s: noteS, issues: p.issues, assumptions: p.assumptions, state: t.closed});
  let ng, map, noteAt;
  const P = 20;
  let plW0 = null;
  if (noteOnMap) {
    // square boxes with a lot of text: the note is pinned on the map's top-right corner beside the plaque (it is
    // hidden while the map is a thumbnail) and the cards get the whole width below both
    map = {x: M, y: top, w: D.w - 2 * M, h: D.h - M - top};
    plW0 = map.w * 0.54;
    ng = ngTry(map.w - 2 * P - plW0 - s);
    noteAt = {x: map.x + map.w - P - ng.w, y: map.y + P};
  } else if (side) {
    ng = ngTry(sideW);
    map = {x: M, y: top, w: D.w - 2 * M - sideW - s, h: D.h - M - top};
    noteAt = {x: map.x + map.w + s, y: top};
  } else {
    ng = ngTry(D.w - 2 * M);
    map = {x: M, y: top, w: D.w - 2 * M, h: D.h - M - top - (ng.h ? ng.h + s : 0)};
    noteAt = {x: M, y: map.y + map.h + s};
  }
  // plaque (top-left of the map), ring on its lower edge
  // square box with the notes at the side: a tighter cord margin and zone gap so three card columns fit
  const m = sideNote ? Math.max(36, s * 1.5) : Math.max(48, s * 1.9), gap = sideNote ? m * 0.8 : m;
  const tagSize = Math.min(s, Math.max(s * 0.74, px(17)));
  const kindSize = Math.min(s, Math.max(s * 0.7, px(16.5)));
  const plW = plW0 ?? Math.min(map.w - 2 * P, shape !== 'portrait' && !wideP ? map.w * 0.62 : map.w - 2 * P);
  const pg = plaqueGeom(ctx, {w: plW, s, kind: t.propKind, kindSize, title: p.rules.title, text: p.rules.proposition, maxLines: 5});
  const plaque = {x: map.x + P, y: map.y + P, w: plW, h: pg.h};
  const rr = Math.max(9, s * 0.36);
  const ringY = plaque.y + pg.h + rr * 2.1;
  const fp = s * 0.6;
  const zTop = Math.max(ringY + rr + 10, noteOnMap ? noteAt.y + ng.h + 10 : 0) + m + fp;
  const zH = map.y + map.h - P - m - zTop;
  const C = sits.filter(q => q.i !== fi && q.scope === 'included');
  const O = sits.filter(q => q.i !== fi && q.scope !== 'included');
  // the changed-datum tag under the focus card: header + the old text (content size)
  const tagHead = (w) => (ctx.show('all') ? ctx.fit(`${p.contextLabels.marker || t.markerDefault} — ${t.before}:`, {maxWidth: w, size: tagSize, minSize: tagSize, maxLines: 3, weight: 700}) : null);
  let best = null;
  const why = {zH: Math.round(zH)};
  const colsW = (n, cw, gx) => (n ? n * cw + (n - 1) * gx : 0);
  for (let cw = Math.min(s * 13, map.w / 3.2); cw >= s * 6.4; cw -= s * 0.4) {
    const gx = s * 1.1, gy = s * 1.3;
    // dense (last resort at the text floor): no kind line and no scope tag on the cards — the number disc, the
    // pennant / dashed ring and the note's key still carry the meaning
    // (kindRoom: the header text is drawn letter-spaced; keep it clear of the pennant planted in the header)
    const cardO = dense ? {kind: null, tags: false, headK: 1.25} : {kind: t.situation, kindRoom: s * 0.45};
    const opts = key => ({s, maxW: cw, minW: cw * 0.99, ...cardO, tagSize, kindSize, seedKey: key, gx, gy, jitter: key === 'fz' ? 0 : 0.7, maxLines: 6});
    // focus card sized for the longer of the two texts
    const longer = ctx.measure(afterText, s) > ctx.measure(beforeText, s) ? afterText : beforeText;
    const fg = cardGeom(ctx, {text: longer, n: fi + 1, w: cw, s, ...cardO, tagSize, kindSize, maxLines: 6});
    const pad = s * 0.55;
    const th = tagHead(cw - 2 * pad);
    const oldFit = ctx.show('key') ? ctx.fit(beforeText, {maxWidth: cw - 2 * pad - s * 0.5, size: s, minSize: s, maxLines: 6, weight: 500}) : null;
    const tagH = (th ? th.height + s * 0.35 : s * 0.6) + (oldFit ? oldFit.height : s * 2.2) + 2 * pad;
    const aFit = ctx.show('key') ? ctx.fit(afterText, {maxWidth: cw - 2 * pad, size: s, minSize: s, maxLines: 6, weight: 500}) : null;
    const bFit = ctx.show('key') ? ctx.fit(beforeText, {maxWidth: cw - 2 * pad, size: s, minSize: s, maxLines: 6, weight: 500}) : null;
    if (fg.truncated || (th && th.truncated) || (oldFit && oldFit.truncated) || (aFit && aFit.truncated) || (bFit && bFit.truncated)) { why.trunc = (why.trunc || 0) + 1; continue; }
    if (aFit && bFit && fg.fit && Math.max(aFit.height, bFit.height) > fg.fit.height + 0.5) { why.taller = (why.taller || 0) + 1; continue; }
    const fz = {h: fg.h + s * 0.6};
    if (fz.h > zH) { why.fz = (why.fz || 0) + 1; continue; }
    let ok = true, colsC = 0, colsO = 0, pC = null, pO = null;
    for (const [list, key] of [[C, 'C'], [O, 'O']]) {
      if (!list.length) continue;
      let found = 0;
      for (let c = 1; c <= list.length; c++) {
        const pk = packZone(ctx, {x: 0, y: 0, w: colsW(c, cw, gx), h: zH}, list, {...opts('probe'), forceCols: c});
        if (pk.fits) { found = c; break; }
      }
      if (!found) { ok = false; why['cols' + key] = (why['cols' + key] || 0) + 1; break; }
      if (key === 'C') colsC = found; else colsO = found;
    }
    if (!ok) continue;
    const needW = P + m + (C.length ? colsW(colsC, cw, gx) + m + gap : 0) + cw + (O.length ? m + gap + colsW(colsO, cw, gx) : m) + P;
    if (needW > map.w) { why.w = (why.w || 0) + 1; continue; }
    const off = (map.w - needW) / 2;
    let x = map.x + off + P + m;
    const zC = C.length ? {x, y: zTop, w: colsW(colsC, cw, gx), h: zH} : null;
    if (zC) x += zC.w + m + gap;
    const zF = {x, y: zTop, w: cw, h: zH};
    x += cw + m + gap;
    const zO = O.length ? {x, y: zTop, w: colsW(colsO, cw, gx), h: zH} : null;
    pC = zC ? packZone(ctx, zC, C, {...opts('cz'), forceCols: colsC}) : {cards: [], fits: true};
    pO = zO ? packZone(ctx, zO, O, {...opts('oz'), forceCols: colsO}) : {cards: [], fits: true};
    if (!pC.fits || !pO.fits) continue;
    // focus card: top of its column (a fixed, untilted place), the tag beneath it
    const fyTop = zTop + Math.max(0, Math.min((zH - fz.h) / 2, s * 2));
    const focus = {...sits[fi], geo: fg, box: {x: zF.x, y: fyTop, w: cw, h: fg.h, rot: 0}};
    const tagBox = {x: zF.x, y: fyTop + fg.h + s * 1.2, w: cw, h: tagH};
    best = {cw, zC, zF, zO, cards: [...pC.cards, focus, ...pO.cards].sort((a, b) => a.i - b.i), focus, tagBox, tagHead: th, oldFit, pad};
    break;
  }
  const fits = !!best && !pg.truncated && !ng.truncated && (!capFit || !capFit.truncated)
    && (noteOnMap ? noteAt.x >= map.x + P + plW + s - 0.5 : side ? noteAt.y + ng.h <= D.h - M + 0.5 : map.h > 200);
  return {noteOnMap, dense, side, sideW, why, tagSize, s, u, px, shape, row, fi, beforeText, afterText, scopeBefore, scopeAfter, capS, capFit, capH, ng, noteS, noteAt, map, P, m, gap, plaque, pg, rr, ringY, fits, ...(best || {})};
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const C = limColors(ctx);
  const show = ctx.show('key');
  L.ring = {x: L.zC ? L.zC.x + L.zC.w / 2 : L.zF.x + L.zF.w * 0.3, y: L.ringY};
  L.coveredOthers = L.cards.filter(c => c.i !== L.fi && c.scope === 'included');
  // anchor from which the focus footprint grows: the nearest covered card's centre (or a point in the covered side)
  const fc = {x: L.focus.box.x + L.focus.box.w / 2, y: L.focus.box.y + L.focus.box.h / 2};
  let anc = null;
  for (const c of L.coveredOthers) {
    const q = {x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2};
    if (!anc || Math.hypot(q.x - fc.x, q.y - fc.y) < Math.hypot(anc.x - fc.x, anc.y - fc.y)) anc = q;
  }
  L.anchor = anc || {x: L.ring.x, y: L.ring.y + L.m * 1.6};
  L.kBefore = L.scopeBefore === 'included' ? 1 : 0;
  L.kAfter = L.scopeAfter === 'included' ? 1 : 0;
  L.loopBefore = loopAt(L, L.kBefore);
  L.loopAfter = loopAt(L, L.kAfter);
  // re-lay: the cord is pulled back along the old loop to where the two loops part, then paid out along the new
  // loop, so every visible stretch of it lies on a finished loop (clear of every card and its text)
  L.trB = track(L.loopBefore);
  L.trA = track(L.loopAfter);
  {
    let pre = 0;
    const lim = Math.min(L.trB.total, L.trA.total);
    while (pre + 3 <= lim) {
      const a = L.trB.at(pre + 3), b = L.trA.at(pre + 3);
      if (Math.hypot(a.x - b.x, a.y - b.y) > 3) break;
      pre += 3;
    }
    L.prefix = pre;
    L.retract = L.trB.total - pre;
    L.extend = L.trA.total - pre;
  }
  // --- context (local coordinates; the whole group is scaled into the thumbnail and back)
  const pad = L.pad;
  const fb = L.focus.box;
  const fg = L.focus.geo;
  L.tq = {x: fb.x + pad, y: fb.y + fg.head + pad};
  const fitB = show ? ctx.fit(L.beforeText, {maxWidth: fb.w - 2 * pad, size: L.s, minSize: L.s, maxLines: 6, weight: 500}) : null;
  const fitA = show ? ctx.fit(L.afterText, {maxWidth: fb.w - 2 * pad, size: L.s, minSize: L.s, maxLines: 6, weight: 500}) : null;
  L.fitB = fitB;
  const bars = (name, n, opacity) => g({name, opacity}, [...Array(n).keys()].map(k => h('rect', {x: r(L.tq.x), y: r(L.tq.y + k * L.s * 1.2 + L.s * 0.2), width: r((fb.w - 2 * pad) * (k === n - 1 ? 0.58 : 1)), height: r(L.s * 0.46), rx: r(L.s * 0.23), fill: k === 0 ? C.cardLine : C.cardLine})));
  const textPair = pre => g(null,
    fitB ? textBlock(fitB, {x: L.tq.x, y: L.tq.y, fill: th.ink, name: `${pre}-before`}) : bars(`${pre}-before`, 2, 1),
    fitA ? textBlock(fitA, {x: L.tq.x, y: L.tq.y, fill: th.ink, name: `${pre}-after`, opacity: 0}) : bars(`${pre}-after`, 3, 0));
  const map = L.map;
  const mapNode = named => mapSheet(ctx, {name: named ? 'map' : undefined, x: map.x, y: map.y, w: map.w, h: map.h, compass: Math.min(38, map.w * 0.05), compassAt: {x: map.x + map.w - 56, y: map.y + map.h - 56}});
  const cards = (pre, named, textless) => L.cards.map(c => cardArt(ctx, c.geo, {prefix: pre, i: c.i, named, textless, transform: cardTransform(c.box), text: c.i === L.fi ? g({transform: `translate(${r(-fb.x)} ${r(-fb.y)})`}, textPair(pre)) : undefined}));
  L.plaqueNode = plaqueArt(ctx, L.pg, {x: L.plaque.x, y: L.plaque.y, name: 'plaque', ringAt: (L.ring.x - L.plaque.x) / L.plaque.w, ring: 'bottom'}).node;
  L.ctxCards = cards('c', true, false);
  L.cordW = Math.max(5, L.s * 0.2);
  L.cordNode = cordArt(ctx, 'cord', L.cordW);
  // note (context, full views only)
  L.note = null;
  if (L.ng.rows.length) {
    const na = noteArt(ctx, L.ng, {x: L.noteAt.x, y: L.noteAt.y, name: 'note'});
    L.note = na.node;
    L.noteBox = na.box;
  }
  // changed-datum tag: the free spot nearest the focus card, clear of every card, the plaque, the note and BOTH cord
  // loops (before and after), so the cord never runs across it. Spots on the map come first; with the notes at the
  // side, the free strip below the notes is used too. A Δ badge matching the card's pin marks it, and a dashed
  // leader ties it to the card when that line crosses nothing.
  {
    const obs = [...L.cards.map(c => boxBounds(c.box, {top: c.geo.head * 0.5, side: 6, bottom: 4})), {x: L.plaque.x, y: L.plaque.y, w: L.plaque.w, h: L.ringY + L.rr - L.plaque.y}];
    if (L.ng.h) obs.push({x: L.noteAt.x, y: L.noteAt.y, w: L.ng.w, h: L.ng.h}); // the note comes back at the end
    const regions = [{...map, off: 0}];
    if (L.side && !L.noteOnMap && L.ng.h) {
      const y0 = L.noteAt.y + L.ng.h + 4;
      regions.push({x: L.noteAt.x - 12, y: y0, w: L.sideW + 24, h: D.h - M + 12 - y0, off: 400});
    }
    const loops = [L.loopBefore, L.loopAfter];
    const fcx = fb.x + fb.w / 2, fcy = fb.y + fb.h / 2;
    const cands = [];
    // several tag shapes: the column width, then wider and shorter
    for (const kw of [1, 1.3, 1.65, 2]) {
      const tw = L.tagBox.w * kw;
      const headF = ctx.show('all') ? ctx.fit(`${p.contextLabels.marker || t.markerDefault} — ${t.before}:`, {maxWidth: tw - 2 * pad - L.s * 1.4, size: L.tagSize, minSize: L.tagSize, maxLines: 3, weight: 700}) : null;
      const oldF = fitB; // the slip keeps its card-width layout inside the tag
      if (headF && headF.truncated) continue;
      const thh = (headF ? headF.height + L.s * 0.35 : L.s * 0.6) + (oldF ? oldF.height : L.s * 2.2) + 2 * pad + L.s * 0.3;
      for (const rg of regions) for (let y = rg.y + 12; y + thh <= rg.y + rg.h - 12; y += 10) {
        for (let x = rg.x + 12; x + tw <= rg.x + rg.w - 12; x += 10) {
          if (obs.some(o => x < o.x + o.w + 10 && x + tw + 10 > o.x && y < o.y + o.h + 10 && y + thh + 10 > o.y)) continue;
          if (loops.some(lp => lp.some(q => q.x > x - 14 && q.x < x + tw + 14 && q.y > y - 14 && q.y < y + thh + 14))) continue;
          if (loops.some(lp => inside({x: x + tw / 2, y: y + thh / 2}, lp))) continue; // never inside an outline
          const dd = Math.hypot(x + tw / 2 - fcx, y + thh / 2 - fcy) + (kw - 1) * 60 + rg.off;
          cands.push({dd, b: {x, y, w: tw, h: thh}, headF, oldF});
        }
      }
    }
    cands.sort((q1, q2) => q1.dd - q2.dd);
    L.tagCands = cands;
    if (cands.length) { L.tagBox = cands[0].b; L.tagHead = cands[0].headF; }
    L.tagFree = cands.length > 0;
  }
  const pin = {x: fb.x - L.s * 0.95, y: fb.y + fg.head * 0.5};
  L.pinNode = g({name: 'pin', transform: T(pin.x, pin.y), opacity: 0},
    h('circle', {name: 'pin-disc', r: r(L.s * 0.75), fill: (L.pinFill = th.accent2), stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: `M0 ${r(-L.s * 0.42)}L${r(L.s * 0.4)} ${r(L.s * 0.3)}H${r(-L.s * 0.4)}Z`, fill: 'none', stroke: '#fff', 'stroke-width': 2.6, 'stroke-linejoin': 'round'}));
  // --- views: full (identity) and the thumbnail + lens band. The thumbnail is the MAP only (the notes are hidden
  // while inspecting), so the dimmed frame never shows an empty patch where the notes were.
  const mapB = {x: map.x, y: map.y, w: map.w, h: map.h};
  const top = M + L.capH;
  // lens source: the focus card with the corridor on each side (both cord positions stay in view)
  const srcL = {x: fb.x - L.m * 1.25, y: fb.y - L.m * 0.55, w: fb.w + L.m * 2.5, h: fb.h + L.m * 1.1};
  L.srcL = srcL;
  // slip size (old text on a paper slip)
  L.slip = {w: (fitB ? fitB.width : fb.w * 0.8) + pad * 2, h: (fitB ? fitB.height : L.s * 2.2) + pad * 1.6};
  const sq = L.shape === 'square';
  const zoomReq = p.detailGeometry.zoom;
  // square boxes: the lens is the subject of the inspect beat — as large as the box allows (the card shown at up to
  // 2.4× its full size), the thumbnail no smaller than 0.36 of the context (its text stays apart)
  const zCapAt = kt => (sq ? Math.max(zoomReq, 2.4 / kt) : zoomReq * 1.7);
  // (square boxes may show more of the map above and below the card, so the lens can take the height it has)
  const srcExt = e => {
    if (e === 1) return srcL;
    const hh = Math.min(mapB.h, srcL.h * e);
    const y = clamp(srcL.y + srcL.h / 2 - hh / 2, mapB.y, mapB.y + mapB.h - hh);
    return {x: srcL.x, y, w: srcL.w, h: hh};
  };
  const geomAt = (wide, kt, sL = srcL) => {
    let Tt, avail;
    if (wide) {
      Tt = {x: M - kt * mapB.x, y: top + (D.h - M - top - mapB.h * kt) / 2 - kt * mapB.y, k: kt};
      const ax = M + mapB.w * kt + L.s * 2 + BAR_HANDLE;
      avail = {x: ax, y: top, w: D.w - M - ax, h: D.h - M - top};
    } else {
      Tt = {x: (D.w - mapB.w * kt) / 2 - kt * mapB.x, y: top - kt * mapB.y, k: kt};
      const ay = top + mapB.h * kt + L.s * 1.5;
      avail = {x: M + BAR_HANDLE, y: ay, w: D.w - 2 * M - BAR_HANDLE, h: D.h - M - ay};
    }
    const s0 = tmap(Tt, sL);
    const src = {x: s0.x, y: s0.y, w: sL.w * kt, h: sL.h * kt};
    // (the struck slip under the lens is drawn at kt·z·K_OUT, so the room it needs grows with z)
    const zRoom = (avail.h - L.s * 0.6 - 6) / (src.h + kt * K_OUT * (L.pad * 0.8 + L.slip.h));
    return {kt, Tt, src, avail, wide, sL, zMax: Math.min(avail.w / src.w, zRoom)};
  };
  const plan = wide => {
    let b = null;
    if (sq) {
      // every thumbnail size: the lens at the zoom the room allows; the largest lens (a little credit for the thumbnail)
      for (const e of [1, 1.25, 1.5, 1.8]) for (let kt = 0.8; kt >= 0.36 - 1e-9; kt -= 0.02) {
        const q = geomAt(wide, kt, srcExt(e));
        const z = Math.min(zCapAt(kt), q.zMax);
        if (z < zoomReq) continue;
        // (the card itself counts: a taller window that shows the same card no larger is not better)
        const score = srcL.w * srcL.h * kt * kt * z * z + 0.3 * q.src.w * q.src.h * z * z + 0.35 * mapB.w * mapB.h * kt * kt;
        if (!b || score > b.score + 1) b = {...q, z, score};
      }
      if (b) return b;
    }
    for (let kt = 0.8; kt >= 0.34; kt -= 0.02) {
      const q = geomAt(wide, kt);
      const z = Math.min(zoomReq * (wide ? 1 : 1.5), q.zMax);
      if (!b || z > b.z + 0.02) b = {...q, z};
      // stacked (tall): leave the lens room to grow past the requested zoom, so it fills its band
      if (z >= zoomReq * (wide ? 1 : 1.5)) break;
    }
    b.score = mapB.w * mapB.h * b.kt * b.kt + b.src.w * b.src.h * b.z * b.z;
    return b;
  };
  let best = null;
  for (const wide of L.shape === 'landscape' ? [true] : L.shape === 'portrait' ? [false] : [true, false]) {
    const b = plan(wide);
    if (!best || b.score > best.score) best = b;
  }
  const {Tt, src, avail} = best;
  L.wideView = best.wide;
  if (best.sL && best.sL !== srcL) { srcL.x = best.sL.x; srcL.y = best.sL.y; srcL.w = best.sL.w; srcL.h = best.sL.h; }
  // the lens then takes the room it has (up to the cap), so it is never a small window in a large empty band
  const zFill = Math.min(best.zMax, zCapAt(best.kt));
  const z = Math.max(1.05, best.z, zFill);
  const dw = src.w * z, dh = src.h * z;
  const slipBandZ = L.slip.h * best.kt * z * K_OUT;
  const dest = {x: avail.x + (avail.w - dw) / 2, y: avail.y + Math.max(0, (avail.h - dh - L.s - slipBandZ) / 2), w: dw, h: dh};
  // stacked: the thumbnail + lens group is centred in the height it has
  if (!best.wide) {
    const groupBottom = dest.y + dest.h + L.s * 0.6 + best.kt * z * K_OUT * (L.pad * 0.8 + L.slip.h);
    const extra = (D.h - M - groupBottom) / 2;
    if (extra > 1) { Tt.y += extra; dest.y += extra; src.y += extra; avail.y += extra; }
  }
  L.Tt = Tt;
  L.kt = best.kt;
  L.src = src;
  L.dest = dest;
  L.z = z;
  L.ctxBox = mapB;
  {
    // how much of the frame below the caption the inspect band (thumbnail ∪ lens ∪ slip band) spans
    const tw = {x: Tt.x + best.kt * mapB.x, y: Tt.y + best.kt * mapB.y, w: mapB.w * best.kt, h: mapB.h * best.kt};
    const x0 = Math.min(tw.x, dest.x - BAR_HANDLE), x1 = Math.max(tw.x + tw.w, dest.x + dest.w);
    const y0 = Math.min(tw.y, dest.y), y1 = Math.max(tw.y + tw.h, dest.y + dest.h + L.s + slipBandZ);
    L.inspectCover = {w: r((x1 - x0) / (D.w - 2 * M), 3), h: r((y1 - y0) / (D.h - M - top), 3), thumb: r(best.kt, 3), zoom: r(z, 3)};
  }
  // lens copy: the context at the same local coordinates under the thumbnail transform (text-free except the focus card)
  const copy = g({transform: tstr(Tt)},
    mapNode(false),
    L.cards.filter(c => c.i !== L.fi).map(c => cardArt(ctx, c.geo, {prefix: 'zc', i: c.i, named: false, textless: true, transform: cardTransform(c.box)})),
    cardArt(ctx, L.focus.geo, {prefix: 'z', i: L.fi, transform: cardTransform(fb), text: g({transform: `translate(${r(-fb.x)} ${r(-fb.y)})`}, textPair('z'))}),
    cordArt(ctx, 'zcord', Math.max(5, L.s * 0.2)));
  const bctx = tmap(Tt, {x: mapB.x - 10, y: mapB.y - 10});
  L.dimFrame = {x: bctx.x, y: bctx.y, w: (mapB.w + 20) * best.kt, h: (mapB.h + 20) * best.kt};
  L.lens = lens(ctx, {name: 'lz', source: src, dest, content: copy, frame: L.dimFrame, radius: 16, color: th.accent2});
  L.bar = barMagnifierArt(ctx, 'bar');
  // slip poses (world {x, y} of the text's top-left + scale)
  const q = tmap(Tt, L.tq);
  L.inPose = {x: dest.x + (q.x - src.x) * z, y: dest.y + (q.y - src.y) * z, k: best.kt * z};
  const kOut = best.kt * z * K_OUT;
  L.outPose = {x: clamp(L.inPose.x, M + pad * kOut, D.w - M - (L.slip.w - pad) * kOut), y: dest.y + dest.h + L.s * 0.6 + pad * 0.8 * kOut, k: kOut};
  const strikes = [];
  if (fitB) fitB.lines.forEach((line, k) => strikes.push({x1: L.tq.x - 4, y: L.tq.y + k * fitB.lineHeight + fitB.size * 0.52, w: ctx.measure(line, fitB.size, fitB.weight, fitB.family) + 8}));
  else for (let k = 0; k < 2; k++) strikes.push({x1: L.tq.x - 4, y: L.tq.y + k * L.s * 1.2 + L.s * 0.43, w: (fb.w - 2 * pad) * (k ? 0.58 : 1) + 8});
  L.strikes = strikes;
  const sl = {x: L.tq.x - pad, y: L.tq.y - pad * 0.8, w: L.slip.w, h: L.slip.h};
  // the slip twice: above the magnifier (lifted out of it) and — once it sets off, sliding on the desk — under it
  const slipArt = pre => g({name: pre, opacity: 0},
    h('path', {name: `${pre}-shadow`, d: roundRectPath(sl.x + 4, sl.y + 6, sl.w, sl.h, 8), fill: th.shadow, opacity: 0}),
    h('path', {name: `${pre}-paper`, d: roundRectPath(sl.x, sl.y, sl.w, sl.h, 8), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '6 4', opacity: 0}),
    fitB ? textBlock(fitB, {x: L.tq.x, y: L.tq.y, fill: th.ink, name: `${pre}-text`}) : g({name: `${pre}-text`}, [0, 1].map(k => h('rect', {x: r(L.tq.x), y: r(L.tq.y + k * L.s * 1.2 + L.s * 0.2), width: r((fb.w - 2 * pad) * (k ? 0.58 : 1)), height: r(L.s * 0.46), rx: r(L.s * 0.23), fill: C.cardLine}))),
    strikes.map((st, k) => h('line', {name: `${pre}-strike${k}`, x1: r(st.x1), y1: r(st.y), x2: r(st.x1), y2: r(st.y), stroke: th.accent2, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0})));
  L.slipNode = slipArt('slip');
  L.slipNodeB = slipArt('slipB');
  // context caption
  L.caption = L.capFit ? g({name: 'caption', opacity: 0}, textBlock(L.capFit, {x: M, y: M, fill: th.fgSoft})) : null;
  // fixed geometry facts for the semantics
  L.boxes = L.cards.map(c => boxBounds(c.box, {top: c.geo.head * 0.4, side: 4}));
  return L;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1400]},
  layout(ctx) {
    const s0 = 30;
    const minS = 16.3 * unitsPer1080px(ctx);
    // a composition fits when its texts fit AND the changed-datum tag finds a spot clear of both cord loops
    const at = sz => {
      let last = null;
      const shape = ctx.view.shape;
      const combos = shape === 'portrait' ? [[false, false]] : shape === 'landscape' ? [[false, false], [true, false]]
        // square: the notes below the map first (a wide map keeps the thumbnail + lens large); near the text floor,
        // the notes at the side or pinned on the map, and at last compact cards
        : [[false, false], [true, false], ...(sz < minS * 1.08 ? [[false, true], [true, true], [false, false, true], [false, false, true, true], [true, true, false, true]] : [])];
      for (const [wideP, sideNote, onMap = false, dense = false] of combos) {
        const c = compose(ctx, sz, wideP, sideNote, onMap, dense);
        if (!c.fits) { last = last || c; continue; }
        const F = finishLayout(ctx, c);
        if (F.tagFree) return F;
        F.fits = false;
        last = F;
      }
      return last;
    };
    let s = s0;
    let L = at(s);
    for (let it = 0; it < 60 && !L.fits && s > minS; it++) {
      s = Math.max(minS, s * 0.98);
      L = at(s);
    }
    for (let it = 0; it < 30 && !L.fits && s > s0 * 0.35; it++) {
      s *= 0.95;
      L = at(s);
    }
    const out = L.lens ? L : finishLayout(ctx, L);
    planSlip(ctx, out);
    if (s < minS - 0.01) {
      out.whyAtFloor = [[false, false], [true, false], [false, true], [true, true], [false, false, true], [false, false, true, true], [true, true, false, true]].map(([wp, sn, om = false, dn = false]) => {
        const c = compose(ctx, minS, wp, sn, om, dn);
        const tf = c.fits ? finishLayout(ctx, c).tagFree : null;
        return {wp, sn, om, dn, tf, ...c.why, fits: c.fits, pg: !c.pg.truncated, ng: !c.ng.truncated, ngH: Math.round(c.ng.h), mapH: Math.round(c.map.h), cap: !c.capFit || !c.capFit.truncated, best: !!c.focus};
      });
    }
    return out;
  },
  build(ctx, L) {
    return g(null,
      L.caption,
      g({name: 'ctx'},
        L.map ? mapSheet(ctx, {name: 'map', x: L.map.x, y: L.map.y, w: L.map.w, h: L.map.h, compass: Math.min(38, L.map.w * 0.05), compassAt: {x: L.map.x + L.map.w - 56, y: L.map.y + L.map.h - 56}}) : null,
        L.plaqueNode,
        L.ctxCards,
        L.cordNode,
        L.tagNode,
        L.pinNode,
        L.note),
      L.slipNodeB,
      L.lens.node,
      L.bar,
      L.slipNode,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const reduced = ctx.reduced;
    const D = ctx.design;
    // --- context view: full → thumbnail while inspecting → full again
    const shrink = ease.inOutCubic(seg(u, ...W.shrink));
    const grow = ease.inOutCubic(seg(u, ...W.grow));
    const kc = shrink * (1 - grow);
    const TF = {x: 0, y: 0, k: 1};
    const Tc = {x: lerp(TF.x, L.Tt.x, kc), y: lerp(TF.y, L.Tt.y, kc), k: lerp(TF.k, L.Tt.k, kc)};
    nodes.ctx = {transform: tstr(Tc)};
    // --- datum swap (old out, then new in) and the dependent cord / marker
    const detached = u >= W.detach[0];
    const ctxOut = seg(u, ...W.ctxOut);
    const newIn = ease.inOutSine(seg(u, ...W.newIn));
    nodes['c-before'] = {opacity: r(1 - ctxOut, 3)};
    nodes['c-after'] = {opacity: r(newIn, 3)};
    nodes['z-before'] = {opacity: detached ? 0 : 1};
    nodes['z-after'] = {opacity: r(newIn, 3)};
    const relay = ease.inOutSine(seg(u, ...W.relay));
    const loop = relay >= 1 ? L.loopAfter : L.loopBefore;
    const cv = cordAt(L, relay);
    const d = cv.tr.d(cv.len);
    Object.assign(nodes, cordFrame('cord', d), cordFrame('zcord', d));
    const mk = seg(u, ...W.marker);
    const scopeNow = mk >= 0.5 ? L.scopeAfter : L.scopeBefore;
    L.cards.forEach(c => {
      const sc = c.i === L.fi ? scopeNow : c.scope;
      const e = c.i === L.fi && L.scopeBefore !== L.scopeAfter ? (mk < 0.5 ? 1 - mk * 2 : (mk - 0.5) * 2) : 1;
      for (const pre of c.i === L.fi ? ['c', 'z'] : ['c']) {
        nodes[`${pre}-flag${c.i}`] = {opacity: sc === 'included' && e > 0 ? 1 : 0};
        nodes[`${pre}-flagS${c.i}`] = {transform: `scale(${r(sc === 'included' ? Math.max(0.001, e) : 0.001, 3)})`};
        nodes[`${pre}-ring${c.i}`] = {opacity: r(sc !== 'included' ? e : 0, 3)};
        if (c.geo.tIn) nodes[`${pre}-tagIn${c.i}`] = {opacity: r(sc === 'included' ? e : 0, 3)};
        if (c.geo.tOut) nodes[`${pre}-tagOut${c.i}`] = {opacity: r(sc !== 'included' ? e : 0, 3)};
      }
    });
    // --- lens: laid on the card at scale 1, lifted, set back, removed
    const settle = seg(u, ...W.settle);
    const open = ease.inOutSine(seg(u, ...W.open));
    const close = ease.inOutSine(seg(u, ...W.close));
    const pOpen = open * (1 - close);
    const dim = seg(u, ...W.dim) * (1 - seg(u, ...W.undim));
    const S = L.src, Dd = L.dest;
    // the source as it is now (the context grows back while the lens closes onto the card)
    const s0 = tmap(Tc, L.srcL);
    const SN = {x: s0.x, y: s0.y, w: L.srcL.w * Tc.k, h: L.srcL.h * Tc.k};
    const R = {x: lerp(SN.x, Dd.x, pOpen), y: lerp(SN.y, Dd.y, pOpen), w: lerp(SN.w, Dd.w, pOpen), h: lerp(SN.h, Dd.h, pOpen)};
    const lf = lensFrameAt(L, S, SN, R, pOpen, dim);
    const away = seg(u, ...W.away);
    const vis = u < W.settle[0] ? 0 : settle * (1 - away);
    lf['lz-win'] = {opacity: r(vis, 3)};
    lf['lz-src'] = {opacity: pOpen > 0.01 && vis > 0 ? 1 : 0};
    lf['lz-coneA'].opacity = lf['lz-coneA'].opacity && vis > 0 ? r(vis, 3) : 0;
    lf['lz-coneB'].opacity = lf['lz-coneB'].opacity && vis > 0 ? r(vis, 3) : 0;
    Object.assign(nodes, lf);
    const lensOverSrc = vis > 0 && pOpen > 0.001 && R.x < SN.x + SN.w && SN.x < R.x + R.w && R.y < SN.y + SN.h && SN.y < R.y + R.h;
    if (lensOverSrc) { nodes['c-before'].opacity = 0; nodes['c-after'].opacity = 0; }
    // (the handle fades while the window lies on its card, so it never rests over a neighbouring card's text)
    Object.assign(nodes, barMagnifierFrame('bar', R, vis * clamp(pOpen / 0.3, 0, 1), 'left'));
    // --- the slip: picked up in the lens, pulled down out of it, struck, then carried into the tag
    const det = ease.outCubic(seg(u, ...W.detach));
    const drop = ease.inOutCubic(seg(u, ...W.drop));
    const toTagLin = seg(u, ...W.toTag);
    const toTag = ease.inOutSine(toTagLin);
    const strike = ease.inOutSine(seg(u, ...W.strike));
    const tagW = {...tmap(Tc, L.tagPoseL), k: Tc.k * L.tagPoseL.k};
    let pose, slipLocal = null;
    if (toTag >= 1) pose = tagW;
    else if (toTag > 0) {
      // along its route in the context's coordinates, carried by the growing context
      const q = L.route.tr.at(toTag * L.route.tr.total);
      const kL = slipK(L, toTag);
      slipLocal = slipRect(L, q.x, q.y, kL);
      pose = {x: Tc.x + Tc.k * q.x, y: Tc.y + Tc.k * q.y, k: Tc.k * kL};
    } else pose = {x: lerp(L.inPose.x, L.outPose.x, drop), y: lerp(L.inPose.y, L.outPose.y, drop), k: lerp(L.inPose.k, L.outPose.k, drop) * (1 + 0.04 * det * (1 - drop))};
    const onDesk = toTagLin > 0;
    for (const pre of ['slip', 'slipB']) {
      const on = pre === 'slipB' ? onDesk : !onDesk;
      nodes[pre] = {opacity: detached && on ? 1 : 0, transform: `translate(${r(pose.x)} ${r(pose.y)}) scale(${r(pose.k, 4)}) translate(${r(-L.tq.x)} ${r(-L.tq.y)})`};
      nodes[`${pre}-paper`] = {opacity: r(det * (1 - seg(u, W.tag[0], W.tag[1])), 3)};
      nodes[`${pre}-shadow`] = {opacity: r(det * (1 - toTag), 3)};
      L.strikes.forEach((st, i) => { nodes[`${pre}-strike${i}`] = {x2: r(st.x1 + st.w * strike), opacity: strike > 0 ? 1 : 0}; });
    }
    // --- marker: tag + Δ pin; caption; notes (full views only)
    nodes.tag = {opacity: r(seg(u, ...W.tag), 3)};
    const pinP = ease.outCubic(seg(u, ...W.pin));
    nodes.pin = {opacity: pinP > 0 ? 1 : 0, transform: `${T(L.focus.box.x - L.s * 0.95, L.focus.box.y + L.focus.geo.head * 0.5)} scale(${r(pinP > 0 ? (reduced ? pinP : 0.4 + 0.6 * pinP) : 0.001, 3)})`};
    if (L.caption) nodes.caption = {opacity: r(seg(u, ...W.caption), 3)};
    const notesOp = seg(u, ...W.notesIn) * (1 - seg(u, ...W.notesOut)) + seg(u, ...W.notesBack);
    if (L.note) nodes.note = {opacity: r(notesOp, 3)};
    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const datum = newIn > 0 ? (newIn >= 1 ? 'after' : 'switching') : ctxOut > 0 ? 'switching' : 'before';
    const fc = {x: L.focus.box.x + L.focus.box.w / 2, y: L.focus.box.y + L.focus.box.h / 2};
    const srcNow = tmap(Tc, {x: L.srcL.x, y: L.srcL.y});
    const semantic = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
      textSize: r(L.s, 2),
      fits: L.fits,
      why: L.whyAtFloor || null,
      focus: L.fi,
      contextScale: r(Tc.k, 4),
      contextFull: kc === 0,
      contextThumb: kc >= 1,
      datum,
      datumValue: datum === 'after' ? L.afterText : datum === 'before' ? L.beforeText : null,
      oldValueShownIn: detached ? (toTag >= 1 ? 'tag' : 'slip') : ctxOut < 1 ? 'card' : 'none',
      slip: P2(pose),
      slipHome: P2(L.inPose),
      tagSlot: P2(tagW),
      slipStruck: strike >= 1,
      slipInTag: toTag >= 1,
      scopeBefore: L.scopeBefore,
      scopeAfter: L.scopeAfter,
      scopeNow,
      relay: r(relay, 3),
      focusInsideLoop: inside(fc, loop),
      othersInsideLoop: L.cards.filter(c => c.i !== L.fi).map(c => inside({x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2}, loop)),
      otherScopes: L.cards.filter(c => c.i !== L.fi).map(c => c.scope),
      cordClear: L.cards.every(c => loop.every(q => distToBox(q, boxBounds(c.box)) > L.m * 0.5)),
      loopLen: r(track(loop).total, 1),
      lensVisible: vis > 0.01,
      lensOpen: r(pOpen, 3),
      lensScale: r(R.w / S.w, 4),
      lensAtSource: Math.abs(R.x - S.x) < 0.5 && Math.abs(R.y - S.y) < 0.5 && Math.abs(R.w - S.w) < 0.5,
      // the window lies exactly on the focus card as it is now (scale-1 copy), whatever the context's size
      lensOnCardNow: vis > 0 && Math.abs(R.x - SN.x) < 0.5 && Math.abs(R.y - SN.y) < 0.5 && Math.abs(R.w - SN.w) < 0.5,
      contextShrinking: kc > 0 && kc < 1,
      sourceOnFocus: Math.abs(srcNow.x - S.x) < 0.5 && Math.abs(srcNow.y - S.y) < 0.5 && Math.abs(L.srcL.w * Tc.k - S.w) < 0.5,
      lensRect: {x: r(R.x), y: r(R.y), w: r(R.w), h: r(R.h)},
      lens: P2({x: R.x + R.w / 2, y: R.y + R.h / 2}),
      lensOverSrc,
      rowTextHiddenUnderLens: lensOverSrc && nodes['c-before'].opacity === 0 && nodes['c-after'].opacity === 0,
      dim: r(dim, 3),
      zoom: r(L.z, 3),
      markerVisible: seg(u, ...W.tag) >= 1,
      tagFree: L.tagFree,
      // the visible cord never runs over a card (its header or text), also while it is being re-laid
      cordOverCards: cordPts(cv).some(q => L.cards.some(c => distToBox(q, boxBounds(c.box)) < L.cordW / 2)),
      // the travelling slip never covers a card, the plaque, the caption or the magnifier
      slipRouteClear: L.slipRouteClear,
      slipOverCards: !!slipLocal && toTagLin > 0.02 && toTagLin < 0.98 && L.slipObsL.some(o => hit(slipLocal, o, 0)),
      // on its way the slip slides under the magnifier (drawn beneath it): it never covers the lens's text
      slipDrawnUnderLens: onDesk,
      // the context grows back while the magnifier closes (no small thumbnail alone on a blank frame)
      growingWhileClosing: u > W.close[0] && u < W.close[1] ? kc < 1 && kc > 0 && pOpen < 1 : null,
      lensFrac: {w: r(L.dest.w / D.w, 3), h: r(L.dest.h / D.h, 3)},
      tagLeader: L.tagLeader,
      pinFill: L.pinFill,
      pinNeutral: L.pinFill === ctx.theme.accent2 && L.pinFill !== ctx.theme.accent,
      dimFrameIsMap: Math.abs(L.dimFrame.x - (L.Tt.x + L.kt * (L.map.x - 10))) < 0.5 && Math.abs(L.dimFrame.w - (L.map.w + 20) * L.kt) < 0.5 && Math.abs(L.dimFrame.h - (L.map.h + 20) * L.kt) < 0.5,
      inspectCover: L.inspectCover,
      wideView: L.wideView,
      tagClearOfCord: !loop.some(q => q.x > L.tagBox.x - 4 && q.x < L.tagBox.x + L.tagBox.w + 4 && q.y > L.tagBox.y - 4 && q.y < L.tagBox.y + L.tagBox.h + 4),
      pinVisible: pinP >= 1,
      notesVisible: !!L.note && notesOp >= 1,
      noteRows: L.ng.rows.map(rw => rw.kind),
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
    slug: 'reasoning-10-inspect',
    title: 'Limit of a conclusion — a magnifier lifts one situation card out and its datum is replaced',
    titleEs: 'Límite de una conclusión — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Límite de una conclusión',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the proposition plaque and the cord knotted around the situations supplied as covered on a survey map. The map shrinks to a thumbnail and a reading magnifier lifts one situation card and the cord beside it out (a real copy at the same coordinates). The old text leaves as a struck paper slip (kept in view), the supplied new text takes its place, and only then the cord is re-laid to the scope supplied for after, with the card’s marker following. The slip becomes a changed-datum tag under the card. Nothing is inferred about the situation.',
    tags: ['reasoning', 'proposition', 'scope', 'limit', 'inspect', 'magnifier', 'substitution', 'before-after', 'cord', 'not examined'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/limite-de-una-conclusion.js', 'src/animations/reasoning/kits/hecho-y-regla.js', 'src/frameworks/lens.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
