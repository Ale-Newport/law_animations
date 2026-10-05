/**
 * LAW-0101 — Condiciones alternativas · story
 *
 * Storyboard (front elevation of a wall with a pneumatic-tube system; two
 * clerks, one at each independent inlet; one receiving tray in the middle):
 *  0.00–0.15 rest     The rule plaque (the author's illustrative caption), one
 *                     brass condition plate per route (Route A, Route B) and
 *                     one paper fact card per route with its SUPPLIED status
 *                     hang on the wall. Each clerk holds a capsule (route
 *                     bands: A one, B two) in the near hand; a clerk whose
 *                     fact is pending holds nothing. The two glass tubes run
 *                     from the brass inlets into the shuttle valve (the
 *                     connector) above the tray; the desk magnifier is parked.
 *  0.15–0.42 action   Clerk A raises the capsule to inlet A, the lid opens and
 *                     the capsule is pushed in (the hand holds it until the
 *                     bell's mouth — the hand-off point — then it is drawn
 *                     into the tube). Clerk B does the same at inlet B a
 *                     moment later, independently.
 *  0.42–0.73 complete Each capsule travels its own tube. At the valve the
 *                     arriving capsule pushes the ball against the other
 *                     inlet's seat and drops through the one outlet into the
 *                     tray — the SAME point of analysis for both routes. A
 *                     disputed capsule is stopped at its route's check gate
 *                     ('?'); a pending route sends nothing. When the first
 *                     capsule lands the tray's medallion lights; then the
 *                     desk magnifier swings over the tray (its glass shows a
 *                     real enlarged copy of what lies in the tray).
 *  0.73–1.00 hold     State tag under the tray ("reached by Route A and by
 *                     Route B — as supplied"), the author's issue as a
 *                     callout on the magnifier, editorial annotations, and the
 *                     footnote "Assumed … — As supplied · no conclusion drawn".
 * finalState 'awaiting-dispatch' keeps every capsule in its clerk's hand.
 * Wide boxes: rule plaque between the two station columns, one floor.
 * Square boxes: rule plaque across the top, the columns below it, one floor.
 * Tall boxes: rule and columns on top; the clerks stand on a gallery whose
 * tubes drop through the gallery floor to the valve and the tray below.
 * Legal content: fictional, jurisdiction unspecified; reaching the tray only
 * means a route delivered its capsule to the point of analysis — no finding
 * that a condition is met, that the rule applies, or of any outcome.
 * @module animations/reasoning/LAW-0101
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, dist, roundRectPath} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {personRig} from '../../primitives/person.js';
import {actorLook} from '../../primitives/people-style.js';
import {placeChip, calloutChip, segPolys, leaderPoly} from '../causation/kits/place.js';
import {
  AC_STRINGS, acFields, AC_DEFAULTS, resolveRoutes, stateLine, statusText, acColors, unitsPerPx, fill,
  filletPoints, arcAt, tubeArt, capsuleArt, inletArt, valveArt, gateArt, trayArt, deskLupa, solveDeskLupa,
  rulePlaque, panel, unionBox,
} from './kits/condiciones-alternativas.js';

const ID = 'LAW-0101';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  chips: [0, 0.06],
  A: {raise: [0.15, 0.25], push: [0.25, 0.3], travel: [0.3, 0.53], back: [0.3, 0.4]},
  B: {raise: [0.2, 0.3], push: [0.3, 0.35], travel: [0.35, 0.6], back: [0.35, 0.45]},
  glow: [0.0, 0.06], // relative to the first arrival
  lupa: [0.61, 0.7],
  tag: [0.74, 0.8], issue: [0.76, 0.85], note: [0.8, 0.9],
};
const ACTION_END = 0.7;

const EXTRA = {
  en: {factWord: 'Fact', connectorDefault: 'Junction · either route', lupaDefault: 'Point of analysis'},
  es: {factWord: 'Hecho', connectorDefault: 'Unión · cualquiera de las rutas', lupaDefault: 'Punto de análisis'},
};
const STRINGS = {en: {...AC_STRINGS.en, ...EXTRA.en}, es: {...AC_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...acFields,
  clerks: list('The two clerks: at the Route A inlet (first) and at the Route B inlet (second); fictional', party, 2, 2),
  actorLabels: obj('Role captions shown under each clerk', {a: str('Caption for the clerk at Route A (descriptive)', 50), b: str('Caption for the clerk at Route B (descriptive)', 50)}),
  objectLabels: obj('Kind labels printed on / next to the objects', {
    fact: str('Kind word on the fact cards (followed by the route letter)', 24),
    rule: str('Kind label on the rule plaque', 40),
    connector: str('Label of the shuttle valve (the connector)', 40),
    lupa: str('Label of the receiving tray / magnifier (the point of analysis)', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['fact', 'rule', 'connector', 'lupa']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: each route behaves as its fact’s supplied status says (routes-as-supplied), or nothing is sent yet (awaiting-dispatch). No legal conclusion is drawn in either', ['routes-as-supplied', 'awaiting-dispatch']),
};

const defaultParams = {
  ...AC_DEFAULTS,
  clerks: [{name: 'Mika', role: 'Clerk'}, {name: 'Ade', role: 'Clerk'}],
  actorLabels: {a: 'sends by Route A', b: 'sends by Route B'},
  objectLabels: {fact: 'Fact', rule: 'Rule · illustrative text', connector: 'Junction · either route', lupa: 'Point of analysis'},
  actionProgress: 1,
  annotations: [],
  finalState: 'routes-as-supplied',
};

const M = 14;
const PX = [22, 21, 20, 19, 18, 17, 16];

/** Build the whole composition for one content text size (px at 1080p). */
function compose(ctx, cpx) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const U = unitsPerPx(ctx);
  const shape = ctx.view.shape;
  const col = acColors(ctx);
  const showK = ctx.show('key'), showA = ctx.show('all');
  const cs = cpx * U, ks = Math.min(cpx, 20) * U, gs = Math.min(cpx, 19) * U;
  const awaiting = p.finalState === 'awaiting-dispatch';
  const res = resolveRoutes(p);
  const L = {cpx, U, cs, ks, gs, res, awaiting, shape};

  // --- notes row at the bottom: the author's issue (a note) and the footnote (assumptions + the
  // "as supplied · no conclusion drawn" key) — side by side when both fit in two lines, else stacked
  const footText = p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ${t.noConclusion}` : t.noConclusion;
  const issueText = p.issues.length ? `${t.issue}: ${p.issues[0]}` : null;
  const full = D.w - 2 * M;
  const probe = (text, w) => chip(ctx, text, {x: 0, y: 0, maxWidth: w, size: ks, minSize: ks, maxLines: 6, weight: 500});
  L.footText = footText;
  L.issueText = issueText;
  if (issueText) {
    const half = (full - 16) / 2;
    const a = probe(issueText, half), b = probe(footText, half);
    const two = ks * 1.18 * 1 + ks + ks * 0.76 + 1;
    if (a.box.h <= two + 0.5 && b.box.h <= two + 0.5) {
      const hh = Math.max(a.box.h, b.box.h);
      L.issueBox = {x: M, y: D.h - M - hh, w: half, h: hh, mw: half};
      L.footBox = {x: M + half + 16, y: D.h - M - hh, w: half, h: hh, mw: half};
    } else {
      const fb = probe(footText, full), ib = probe(issueText, full);
      L.footBox = {x: M, y: D.h - M - fb.box.h, w: full, h: fb.box.h, mw: full};
      L.issueBox = {x: M, y: L.footBox.y - 10 - ib.box.h, w: full, h: ib.box.h, mw: full};
    }
  } else {
    const fb = probe(footText, full);
    L.footBox = {x: M, y: D.h - M - fb.box.h, w: full, h: fb.box.h, mw: full};
    L.issueBox = null;
  }
  // with every label hidden no notes row is drawn: the room is given back to the scene
  const notesTop = !showK && !showA ? D.h - M + 12 : L.issueBox ? Math.min(L.issueBox.y, L.footBox.y) : L.footBox.y;

  // --- rule plaque + station columns
  // wide and square boxes: the plaque between the two station columns; tall boxes: plaque across the top
  const wide = shape !== 'portrait';
  const ruleW = shape === 'landscape' ? clamp(D.w * 0.34, 520, 780) : wide ? clamp(D.w * 0.33, 360, 480) : D.w - 2 * M;
  const plq = rulePlaque(ctx, {w: ruleW, kind: p.objectLabels.rule || t.ruleKind, headSize: ks, text: p.rules.name, size: cs, show: showK});
  L.rule = {x: (D.w - ruleW) / 2, y: M, w: ruleW, h: plq.h, art: plq};
  const colTop = wide ? M : L.rule.y + L.rule.h + 16;
  const colW = wide ? (D.w - 2 * M - ruleW - 2 * (shape === 'landscape' ? 34 : 18)) / 2 : (D.w - 2 * M - 22) / 2;
  if (colW < 230) return null;
  const colX = {A: M, B: D.w - M - colW};
  L.cols = {};
  const plates = {}, cards = {};
  for (const R of res.routes) {
    plates[R.key] = panel(ctx, {w: colW, head: fill(t.conditionKind, R.key), headSize: ks, body: R.condition, size: cs, weight: 600, show: showK});
    cards[R.key] = panel(ctx, {w: colW, head: `${p.objectLabels.fact || t.factWord} ${R.key}`, headSize: ks, body: R.fact || '—', size: cs, weight: 500, pill: {text: statusText(t, R.status), status: R.status, color: col.route(R.key)}, pillSize: ks, show: showK});
  }
  const plateH = Math.max(plates.A.h, plates.B.h);
  const cardY = colTop + plateH + 12;
  for (const R of res.routes) {
    L.cols[R.key] = {x: colX[R.key], w: colW, plate: {x: colX[R.key], y: colTop, w: colW, h: plates[R.key].h, art: plates[R.key]}, card: {x: colX[R.key], y: cardY, w: colW, h: cards[R.key].h, art: cards[R.key]}};
  }
  const colBottom = cardY + Math.max(cards.A.h, cards.B.h);
  L.colBottom = colBottom;

  // --- floor band: who chips (left / right) and the state tag (centre) under the floor line
  const who = {};
  let whoH = 0;
  for (const [i, key] of [[0, 'A'], [1, 'B']]) {
    const c = p.clerks[i];
    const cap = key === 'A' ? p.actorLabels.a : p.actorLabels.b;
    const text = [c.name, cap].filter(Boolean).join(' · ');
    const pr = chip(ctx, text, {x: 0, y: 0, maxWidth: Math.min(colW, D.w * 0.3), size: gs, minSize: gs, maxLines: 6, weight: 600});
    who[key] = {text, w: pr.box.w, h: pr.box.h, mw: Math.min(colW, D.w * 0.3)};
    whoH = Math.max(whoH, pr.box.h);
  }
  const tagText = awaiting ? t.awaiting : stateLine(t, res);
  const tagMax = D.w - 2 * M - 2 * (Math.max(who.A.w, who.B.w) + 24);
  if (tagMax < 260) return null;
  const tagProbe = chip(ctx, tagText, {x: 0, y: 0, maxWidth: tagMax, size: ks, minSize: ks, maxLines: 3, weight: 700});
  const bandH = !showK && !showA ? 0 : Math.max(whoH, tagProbe.box.h);
  const floorY = notesTop - 12 - bandH - 12;
  L.floorY = floorY;
  L.tagText = tagText;
  L.tagMax = tagMax;
  L.who = who;
  L.bandY = floorY + 12;

  // --- clerks (and, in tall boxes, the gallery they stand on)
  const tall = shape === 'portrait';
  let k, galleryY;
  if (!tall) {
    k = clamp((floorY - colBottom - 16) / 415, 0, shape === 'landscape' ? 1.3 : 1.1);
    galleryY = floorY;
  } else {
    // gallery floor: the clerks' feet; the valve and the tray live on the lower floor below it
    const lowerNeed = 430 * clamp((floorY - colBottom) / 900, 0.8, 1.1);
    k = clamp((floorY - colBottom - 16 - lowerNeed - 30) / 415, 0, 1.0);
    galleryY = colBottom + 16 + 415 * k;
  }
  if (k < (shape === 'square' ? 0.5 : 0.55)) return null;
  L.k = k;
  L.galleryY = galleryY;
  L.tall = tall;
  const tw = 32 * clamp(k, 0.7, 1.3) * (tall ? 1.05 : 1);
  L.tw = tw;
  L.cap = {len: tw * 2.1, rad: tw * 0.4};
  const clerkX = {A: M + 78 * k, B: D.w - M - 78 * k};
  const facing = {A: 1, B: -1};
  L.clerks = {};
  for (const [i, key] of [[0, 'A'], [1, 'B']]) {
    const look = actorLook(ctx, p.clerks[i], i);
    const rig = personRig(ctx, {name: `clerk${key}`, look});
    const P = {x: clerkX[key], y: galleryY, facing: facing[key], scale: k};
    const f = facing[key];
    const shoulder = {x: clerkX[key] + f * 12 * k, y: galleryY - 302 * k};
    const mouth = {x: shoulder.x + f * 126 * k, y: shoulder.y - 62 * k};
    const rest = {x: shoulder.x + f * 44 * k, y: shoulder.y + 118 * k};
    L.clerks[key] = {rig, P, f, shoulder, mouth, rest, look, box: {x: clerkX[key] - 70 * k, y: galleryY - 418 * k, w: 140 * k, h: 418 * k}};
  }

  // --- valve, tray and tubes
  const cx = D.w / 2;
  const mouthY = L.clerks.A.mouth.y;
  const vs = tw * 0.95; // valve chamber half-height
  let jy, trayY, legs;
  const trayW = Math.min(tall ? D.w * 0.36 : D.w * 0.2, 420) + 40 * k;
  const trayH = tw * 1.7;
  const below = vs * 1.72 + tw * 1.7 + 12; // valve half + outlet nozzle + drop gap
  if (!tall) {
    jy = mouthY + clamp((floorY - mouthY) * 0.3, 56, 150);
    trayY = Math.max(jy + below, floorY - trayH - Math.max(0, (floorY - jy) * 0.22));
    legs = floorY - trayY - trayH;
  } else {
    jy = galleryY + 36 + clamp((floorY - galleryY) * 0.28, 90, 180);
    trayY = Math.max(jy + below, floorY - trayH - 90);
    legs = floorY - trayY - trayH;
  }
  if (legs < 0) return null;
  L.valve = valveArt(ctx, 'valve', {x: cx, y: jy, size: vs, colorA: col.A, colorB: col.B});
  L.tray = trayArt(ctx, 'tray', {x: cx, y: trayY, w: trayW, h: trayH, legs, capR: L.cap.rad});
  L.trayY = trayY;
  L.cx = cx;
  const nozzleEnd = {x: cx, y: Math.min(trayY - L.cap.rad * 2 - 6, L.valve.ports.out.y + tw * 1.4)};
  L.nozzle = nozzleEnd;
  L.outTube = tubeArt(ctx, 'tubeOut', filletPoints([L.valve.ports.out, nozzleEnd], 10), {width: tw, color: col.brass, every: 9999});
  L.routes = {};
  const turnDX = L.valve.Lv + vs * 0.8 + (tall ? 150 : 70) * clamp(k, 0.7, 1);
  for (const R of res.routes) {
    const key = R.key;
    const C = L.clerks[key];
    const f = C.f;
    const ang = f === 1 ? 0 : 180;
    const inlet = inletArt(ctx, `inlet${key}`, {x: C.mouth.x + f * (tw * 1.35 + 10), y: C.mouth.y, tube: tw, rot: ang, flip: f === -1, color: col.route(key)});
    const port = L.valve.ports[key];
    const xTurn = cx - f * turnDX;
    const bellEnd = {x: C.mouth.x + f * inlet.len, y: C.mouth.y};
    const runPts = filletPoints([bellEnd, {x: xTurn, y: mouthY}, {x: xTurn, y: jy}, port], Math.min(70, (jy - mouthY) / 2));
    const gateAt = mix(bellEnd, {x: xTurn, y: mouthY}, 0.5);
    const tube = tubeArt(ctx, `tube${key}`, runPts, {width: tw, color: col.route(key), skip: q => Math.abs(q.x - gateAt.x) < 40 && Math.abs(q.y - gateAt.y) < 10});
    const gate = gateArt(ctx, `gate${key}`, {x: gateAt.x, y: gateAt.y, angle: 0, tube: tw, nx: 0, ny: 1, show: showK, discR: Math.max(16, ks * 0.85)});
    const slot = L.tray.slots[key];
    const approach = {x: C.mouth.x - f * (L.cap.len / 2 + 6), y: C.mouth.y};
    const path = filletPoints([approach, C.mouth, ...runPts.slice(1), L.valve.ports.center, L.valve.ports.out, nozzleEnd, {x: nozzleEnd.x, y: slot.y}, slot], 24, 5);
    const poly = cumPoly(path);
    const sMouth = dist(approach, C.mouth);
    const sGate = arcAtCum(poly, gateAt) - L.cap.len / 2 - 8;
    const sPort = arcAtCum(poly, port);
    L.routes[key] = {key, R, inlet, tube, gate, gateAt, approach, poly, sMouth, sGate, sPort, sEnd: poly.total, runPts, xTurn, slot};
  }

  // --- desk magnifier on the tray's right end
  const lr = Math.max(46, tw * 1.9);
  const base = {x: cx + trayW / 2 - 16, y: trayY - 2};
  const l1 = Math.max(110, trayW * 0.36), l2 = Math.max(110, trayW * 0.36);
  // parked head: the first spot (up-right → right, lying lower) clear of both tubes and inside the room
  const tubeHit = q => ['A', 'B'].some(key => L.routes[key].runPts.some(pt => Math.hypot(pt.x - q.x, pt.y - q.y) < lr + tw * 0.5 + 12))
    || Math.hypot(L.valve.ports.center.x - q.x, L.valve.ports.center.y - q.y) < lr + L.valve.Lv + 20;
  const cands = [[0.62, -0.9], [0.8, -0.7], [0.95, -0.45], [1.05, -0.2], [1.1, 0]].map(([fx, fy]) => ({x: base.x + l1 * fx + lr * 0.3, y: base.y + l1 * fy}));
  const park = cands.find(q => !tubeHit(q) && q.x + lr + 10 < D.w - M && q.y + lr < floorY) || cands[cands.length - 1];
  const over = {x: cx, y: trayY - L.cap.rad * 0.6};
  L.lupa = {base, l1, l2, R: lr, park, over, z: 1.7};
  L.lupaPark = solveDeskLupa(base, park, l1, l2);
  L.lupaOver = solveDeskLupa(base, over, l1, l2, L.lupaPark);
  L.cxBox = {x: cx - trayW / 2, y: L.valve.box.y, w: trayW, h: floorY - L.valve.box.y};
  return L;
}

/** Polyline with cumulative arc lengths. */
function cumPoly(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  return {pts, cum, total: cum[cum.length - 1]};
}

/** Arc-length of the nearest polyline vertex (with cumulative lengths). */
function arcAtCum(poly, q) {
  let best = Infinity, at = 0;
  poly.pts.forEach((pt, i) => {
    const d = Math.hypot(pt.x - q.x, pt.y - q.y);
    if (d < best) { best = d; at = poly.cum[i]; }
  });
  return at;
}

/** Point and tangent angle (deg) at arc length s on a cumulative polyline. */
function pointAt(poly, s) {
  const S = clamp(s, 0, poly.total);
  let lo = 0, hi = poly.cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (poly.cum[mid] <= S) lo = mid; else hi = mid;
  }
  const a = poly.pts[lo], b = poly.pts[hi];
  const L = poly.cum[hi] - poly.cum[lo] || 1;
  const k = (S - poly.cum[lo]) / L;
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI};
}

/** Smoothed tangent (average over ±w) so the capsule turns smoothly in bends. */
function angleAt(poly, s, w = 14) {
  const p0 = pointAt(poly, s - w), p1 = pointAt(poly, s + w);
  return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
}

/** Nodes, chips and callouts for the composed geometry. */
function finish(ctx, L) {
  const p = ctx.params;
  const t = ctx.t;
  const th = ctx.theme;
  const D = ctx.design;
  const col = acColors(ctx);
  const showA = ctx.show('all'), showK = ctx.show('key');

  // capsules (+ copies for the magnifier's glass)
  L.capsules = {};
  for (const key of ['A', 'B']) {
    L.capsules[key] = capsuleArt(ctx, `cap${key}`, {len: L.cap.len, rad: L.cap.rad, color: col.route(key), key, opacity: 0});
  }
  const copy = g({name: 'lcopy'},
    L.tray.back && g(null, clone(L.tray.back)),
    ['A', 'B'].map(key => capsuleArt(ctx, `lcap${key}`, {len: L.cap.len, rad: L.cap.rad, color: col.route(key), key, opacity: 0})),
  );
  L.desk = deskLupa(ctx, 'lupa', {base: L.lupa.base, l1: L.lupa.l1, l2: L.lupa.l2, R: L.lupa.R, content: copy});

  // --- obstacles for chips
  const tubePolys = ['A', 'B'].flatMap(key => segPolys(sparse(L.routes[key].runPts, 6), L.tw + 12));
  const inletBoxes = ['A', 'B'].map(key => L.routes[key].inlet.box);
  const lupaAt = ang => {
    const j = {x: L.lupa.base.x + Math.cos(ang.a1 * Math.PI / 180) * L.lupa.l1, y: L.lupa.base.y + Math.sin(ang.a1 * Math.PI / 180) * L.lupa.l1};
    const hd = {x: j.x + Math.cos(ang.a2 * Math.PI / 180) * L.lupa.l2, y: j.y + Math.sin(ang.a2 * Math.PI / 180) * L.lupa.l2};
    return [...segPolys([L.lupa.base, j, hd], 16), {x: hd.x - L.lupa.R - 10, y: hd.y - L.lupa.R - 10, w: 2 * L.lupa.R + 20, h: 2 * L.lupa.R + 20}];
  };
  L.lupaOverPolys = lupaAt(L.lupaOver);
  const lupaPolys = [...lupaAt(L.lupaPark), ...L.lupaOverPolys];
  const clerkBoxes = ['A', 'B'].map(key => L.clerks[key].box);
  const reach = ['A', 'B'].map(key => {
    const C = L.clerks[key];
    return unionBox([{x: Math.min(C.mouth.x, C.rest.x) - 30, y: C.mouth.y - 30, w: Math.abs(C.mouth.x - C.rest.x) + 60, h: C.rest.y - C.mouth.y + 60}]);
  });
  const fixed = [
    L.rule, L.cols.A.plate, L.cols.A.card, L.cols.B.plate, L.cols.B.card, L.footBox, L.issueBox,
    L.valve.box, L.tray.box, ...inletBoxes, ...tubePolys, ...segPolys([L.valve.ports.out, L.nozzle], L.tw + 12), ...lupaPolys, ...clerkBoxes, ...reach,
    ...['A', 'B'].map(key => L.routes[key].gate.disc),
  ];
  const bounds = {x: M, y: M, w: D.w - 2 * M, h: L.floorY - M - 4};
  const placed = [];

  // --- floor band: who chips under their clerks, the state tag centred under the tray
  L.whoChips = {};
  if (showA) {
    for (const key of ['A', 'B']) {
      const w0 = L.who[key];
      const C = L.clerks[key];
      const x = key === 'A' ? M : D.w - M - w0.w;
      const y = L.tall ? L.galleryY + 30 : L.bandY;
      L.whoChips[key] = chip(ctx, w0.text, {x, y, maxWidth: w0.mw, size: L.gs, minSize: L.gs, maxLines: 6, name: `who${key}`, fill: th.card, stroke: col.route(key), weight: 600});
      placed.push(L.whoChips[key].box);
      void C;
    }
  }
  L.tagChip = null;
  if (showK) {
    const probe = chip(ctx, L.tagText, {x: 0, y: 0, maxWidth: L.tagMax, size: L.ks, minSize: L.ks, maxLines: 3, weight: 700});
    L.tagChip = chip(ctx, L.tagText, {x: L.cx - probe.box.w / 2, y: L.bandY, maxWidth: L.tagMax, size: L.ks, minSize: L.ks, maxLines: 3, name: 'state-tag', fill: th.card, stroke: shade2(th), weight: 700});
    placed.push(L.tagChip.box);
  }
  // --- object labels: junction (connector) and point of analysis
  const obst = () => [...fixed, ...placed];
  L.objLabels = [];
  if (showA) {
    const mk = (name, text, target, order, own = []) => {
      for (const mw of [330, 250, 190]) {
        const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: L.gs, minSize: L.gs, maxLines: 4, weight: 600});
        const res = placeChip({w: probe.box.w, h: probe.box.h}, target, {obstacles: obst(), bounds, order, own, gaps: [18, 34, 56, 84, 120, 170, 230]});
        if (!res) continue;
        const c = calloutChip(ctx, {name, text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: mw, maxLines: 4, size: L.gs, color: th.inkSoft});
        placed.push(c.box);
        placed.push(leaderPoly(c.box, res.end));
        return c;
      }
      return null;
    };
    const vj = L.valve.ports;
    const vb = L.valve.box;
    const tries = [
      [{x: vj.center.x - L.valve.Lv * 0.5, y: vb.y - 2}, ['aboveL', 'above', 'aboveR', 'leftHigh', 'rightHigh']],
      [{x: vb.x + vb.w * 0.3, y: vb.y + vb.h + 2}, ['belowL', 'leftLow', 'below', 'left']],
      [{x: vb.x + vb.w * 0.7, y: vb.y + vb.h + 2}, ['belowR', 'rightLow', 'below', 'right']],
    ];
    for (const [tg, order] of tries) {
      const a = mk('lbl-connector', p.objectLabels.connector || t.connectorDefault, tg, order, [vb]);
      if (a) { L.objLabels.push(a); break; }
    }
    if (!L.objLabels.length) L.labelMisses = (L.labelMisses || 0) + 1;
    const b = mk('lbl-point', p.objectLabels.lupa || t.lupaDefault, {x: L.tray.medal.x - L.tray.medal.r - 4, y: L.tray.medal.y}, ['left', 'leftLow', 'leftHigh', 'belowL', 'aboveL', 'right', 'rightLow'], [L.tray.box]);
    if (b) L.objLabels.push(b); else L.labelMisses = (L.labelMisses || 0) + 1;
  }
  // --- issue on the magnifier, annotations
  const mkCallout = (name, text, target, order, own = []) => {
    const fits = [[520, 3], [420, 4], [340, 5], [280, 6]].map(([wd, ml]) => ({wd, ml, box: chip(ctx, text, {x: 0, y: 0, maxWidth: wd, size: L.ks, minSize: L.ks, maxLines: ml}).box}));
    for (const f of fits) {
      const res = placeChip({w: f.box.w, h: f.box.h}, target, {obstacles: obst(), bounds, order, own, gaps: [24, 44, 70, 100, 140, 190, 250, 320]});
      if (res) {
        const c = calloutChip(ctx, {name, text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: f.wd, maxLines: f.ml, size: L.ks, color: th.ink});
        placed.push(c.box);
        placed.push(leaderPoly(c.box, res.end));
        return c;
      }
    }
    const f = fits[1];
    const res = placeChip({w: f.box.w, h: f.box.h}, target, {obstacles: obst(), bounds, order, leastBad: true});
    const c = calloutChip(ctx, {name, text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: f.wd, maxLines: f.ml, size: L.ks, color: th.ink});
    placed.push(c.box);
    L.badCallouts = (L.badCallouts || 0) + 1;
    return c;
  };
  L.issues = [];
  if (showA && L.issueText) {
    L.issues.push(chip(ctx, L.issueText, {x: L.issueBox.x, y: L.issueBox.y, maxWidth: L.issueBox.mw, size: L.ks, minSize: L.ks, maxLines: 6, fill: '#fff8dc', stroke: th.accent3, weight: 500, radius: 8, name: 'issue0'}));
  }
  L.notes = [];
  if (showA) {
    p.annotations.forEach((an, i) => {
      const tg = annotationTarget(L, an.target);
      L.notes.push(mkCallout(`note${i}`, an.text, tg.pt, tg.order, tg.own || []));
    });
  }
  L.placed = placed;
  return L;
}

function shade2(th) {
  return th.inkSoft;
}

/** Keep every n-th point (plus the last) of a dense polyline. */
function sparse(pts, n) {
  const out = pts.filter((_, i) => i % n === 0);
  if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
  return out;
}

/** Deep clone of a vnode tree without node names (for the magnifier's copy). */
function clone(node) {
  if (!node || typeof node !== 'object') return node;
  const attrs = {...node.attrs};
  delete attrs.name;
  return {tag: node.tag, attrs, children: node.children.map(clone)};
}

function headAt(L, ang) {
  const j = {x: L.lupa.base.x + Math.cos(ang.a1 * Math.PI / 180) * L.lupa.l1, y: L.lupa.base.y + Math.sin(ang.a1 * Math.PI / 180) * L.lupa.l1};
  return {x: j.x + Math.cos(ang.a2 * Math.PI / 180) * L.lupa.l2, y: j.y + Math.sin(ang.a2 * Math.PI / 180) * L.lupa.l2};
}

function annotationTarget(L, target) {
  if (target === 'fact') {
    const c = L.cols.A.card;
    return {pt: {x: c.x + c.w * 0.6, y: c.y + c.h + 2}, order: ['below', 'belowR', 'belowL', 'right', 'rightLow']};
  }
  if (target === 'rule') return {pt: {x: L.rule.x + L.rule.w * 0.5, y: L.rule.y + L.rule.h + 2}, order: ['below', 'belowL', 'belowR']};
  if (target === 'connector') return {pt: {x: L.valve.ports.center.x + L.valve.Lv * 0.45, y: L.valve.box.y - 2}, order: ['aboveR', 'above', 'rightHigh', 'aboveL', 'leftHigh'], own: [L.valve.box]};
  const hd = headAt(L, L.lupaOver);
  return {pt: {x: hd.x, y: hd.y, r: L.lupa.R + 10}, order: ['rightHigh', 'right', 'aboveR', 'leftHigh', 'left', 'aboveL'], own: [L.tray.box, ...L.lupaOverPolys]};
}

const scene = {
  sizes: {landscape: [1800, 900], square: [1100, 925], portrait: [900, 1400]},
  layout(ctx) {
    let L = null;
    for (const px of PX) {
      L = compose(ctx, px);
      if (L) break;
    }
    if (!L) {
      // last resort: smallest text; the composition is still built (tests report the size)
      const ctx2 = ctx;
      L = compose(ctx2, 16) || composeForced(ctx2);
    }
    return finish(ctx, L);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const D = ctx.design;
    const col = acColors(ctx);
    const wallTop = L.tall ? M : M;
    const wall = g(null,
      h('path', {d: roundRectPath(0, wallTop - 4, D.w, L.floorY - wallTop + 4, 22), fill: col.wall}),
      Array.from({length: Math.max(3, Math.floor((L.floorY - wallTop) / 90))}, (_, i) => h('path', {d: `M16 ${r(wallTop + 60 + i * 90)}H${r(D.w - 16)}`, stroke: col.wallLine, 'stroke-width': 2})),
      h('rect', {x: 0, y: r(L.floorY), width: r(D.w), height: 10, fill: col.floor, stroke: th.ink, 'stroke-width': 2}),
      L.tall ? g(null,
        h('rect', {x: 0, y: r(L.galleryY), width: r(D.w), height: 20, fill: col.floor, stroke: th.ink, 'stroke-width': 2.4}),
        h('path', {d: `M0 ${r(L.galleryY + 20)}H${r(D.w)}`, stroke: 'rgba(31,35,40,0.2)', 'stroke-width': 6})) : null,
    );
    const col2 = key => L.cols[key];
    const panelsN = ['A', 'B'].map(key => g(null,
      col2(key).plate.art.draw(col2(key).plate.x, col2(key).plate.y, {name: `plate${key}`, fill: col.brassLight, stroke: col.brassDark, headColor: '#5a4518', color: th.ink, radius: 8, accent: col.route(key)}),
      col2(key).card.art.draw(col2(key).card.x, col2(key).card.y, {name: `card${key}`, fill: th.paper, stroke: th.inkSoft, headColor: th.inkSoft, color: th.ink, radius: 6, accent: col.route(key)}),
    ));
    const lupaFrame = L.desk.frame(L.lupaPark.a1, L.lupaPark.a2);
    void lupaFrame;
    return g(null,
      wall,
      L.rule.art.draw(L.rule.x, L.rule.y, 'rule'),
      panelsN,
      L.tray.back,
      ['A', 'B'].map(key => L.clerks[key].rig.node),
      ['A', 'B'].map(key => L.routes[key].tube.back),
      L.outTube.back,
      ['A', 'B'].map(key => L.capsules[key]),
      ['A', 'B'].map(key => L.routes[key].tube.front),
      L.outTube.front,
      h('path', {d: `M${r(L.nozzle.x - L.tw * 0.62)} ${r(L.nozzle.y)}h${r(L.tw * 1.24)}l-5 12h${r(-L.tw * 1.24 + 10)}Z`, fill: col.brass, stroke: th.ink, 'stroke-width': 2.2}),
      L.tray.front,
      ['A', 'B'].map(key => L.routes[key].gate.node),
      ['A', 'B'].map(key => L.routes[key].inlet.node),
      L.valve.node,
      L.desk.node,
      ['A', 'B'].map(key => L.routes[key].gate.doubt),
      Object.values(L.whoChips).map(c => g({name: `${c.node.attrs.name}-g`, opacity: 0}, c.node)),
      L.objLabels.map(c => c.node),
      L.tagChip ? g({name: 'tag-g', opacity: 0}, L.tagChip.node) : null,
      L.issues.map(c => g({name: 'issue-g', opacity: 0}, c.node)),
      L.notes.map(c => c.node),
      ctx.show('key') ? g({name: 'foot', opacity: 0}, chip(ctx, L.footText, {x: L.footBox.x, y: L.footBox.y, maxWidth: L.footBox.mw, size: L.ks, minSize: L.ks, maxLines: 6, fill: th.card, stroke: th.inkFaint, weight: 500, radius: 8}).node) : null,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const reduced = ctx.reduced;
    const sem = {capsule: {}, hand: {}, capState: {}, lid: {}, s: {}};
    const reach = [];
    const arrivals = {};
    const passes = {};
    for (const key of ['A', 'B']) {
      const Rt = L.routes[key];
      const C = L.clerks[key];
      const w = W[key];
      const st = Rt.R.status;
      const sends = st !== 'pending' && !L.awaiting;
      const holds = st !== 'pending';
      const ang0 = C.f === 1 ? 0 : 180;
      let hand = C.rest;
      let capPos = null, capAng = ang0, s = 0, state = holds ? 'in-hand' : 'none';
      if (holds && sends) {
        const raise = ease.inOutCubic(seg(a, ...w.raise));
        const push = ease.inOutSine(seg(a, ...w.push));
        const back = ease.inOutCubic(seg(a, ...w.back));
        const stop = st === 'disputed' ? Rt.sGate : Rt.sEnd;
        const tr = seg(a, ...w.travel);
        const trE = st === 'disputed' ? ease.outCubic(tr) : ease.inOutCubic(tr);
        if (a < w.push[0]) {
          hand = mix(C.rest, Rt.approach, raise);
          s = 0;
        } else if (a < w.push[1]) {
          s = push * Rt.sMouth;
          hand = pointAt(Rt.poly, s);
          state = 'entering';
        } else {
          s = Rt.sMouth + (stop - Rt.sMouth) * trE;
          hand = mix(C.mouth, C.rest, back);
          state = tr >= 1 ? (st === 'disputed' ? 'stopped-at-gate' : 'in-tray') : 'in-tube';
        }
      } else if (holds) {
        hand = C.rest;
      }
      const pose = C.rig.frame({...C.P, near: hand, headTilt: 0});
      Object.assign(nodes, pose.nodes);
      reach.push(pose.reached);
      const handW = pose.hands.near;
      if (holds) {
        if (state === 'in-hand') {
          capPos = {x: handW.x, y: handW.y};
          capAng = ang0;
        } else {
          const q = pointAt(Rt.poly, s);
          capPos = {x: q.x, y: q.y};
          capAng = state === 'entering' ? ang0 : angleAt(Rt.poly, s);
          if (state === 'in-tray') capAng = C.f === 1 ? 180 : 0;
        }
        // on the last stretch the capsule rolls level into its slot
        if (state === 'in-tube' && s > Rt.sEnd - 60) {
          const k2 = clamp((s - (Rt.sEnd - 60)) / 60);
          const target = C.f === 1 ? 180 : 0;
          capAng = lerpAngle(capAng, target, ease.inOutSine(k2));
        }
        nodes[`cap${key}`] = {transform: T(capPos.x, capPos.y, capAng), opacity: 1};
        nodes[`lcap${key}`] = {transform: T(capPos.x, capPos.y, capAng), opacity: 1};
      } else {
        nodes[`cap${key}`] = {opacity: 0};
        nodes[`lcap${key}`] = {opacity: 0};
      }
      // lid opens while the capsule is handed in
      const lidOpen = holds && sends ? clamp(seg(a, w.raise[1] - 0.04, w.push[0]) - seg(a, w.travel[0] + 0.02, w.travel[0] + 0.07)) : 0;
      Object.assign(nodes, Rt.inlet.frame(lidOpen));
      // gate: the stop pin drops just before a disputed capsule reaches it
      const gateClose = st === 'disputed' && sends ? seg(a, w.travel[0] + (w.travel[1] - w.travel[0]) * 0.05, w.travel[0] + (w.travel[1] - w.travel[0]) * 0.3) : 0;
      const doubt = st === 'disputed' && sends ? seg(a, w.travel[1], w.travel[1] + 0.05) : 0;
      Object.assign(nodes, Rt.gate.frame(gateClose, doubt));
      sem.capsule[key] = capPos ? {x: r(capPos.x), y: r(capPos.y)} : null;
      sem.hand[key] = {x: r(handW.x), y: r(handW.y)};
      sem.capState[key] = state;
      sem.lid[key] = r(lidOpen, 3);
      sem.s[key] = r(s, 1);
      // valve pass (pressure reaches the valve) and arrival in the tray
      passes[key] = holds && sends && st === 'supplied' ? clamp((s - (Rt.sPort - 90)) / 80) : 0;
      arrivals[key] = state === 'in-tray';
    }
    // --- shuttle ball: A pushes it to the B seat (+1), then B pushes it back to the A seat (−1)
    let ball = 0;
    ball = lerp(ball, 1, ease.inOutSine(passes.A));
    ball = lerp(ball, -1, ease.inOutSine(passes.B));
    Object.assign(nodes, L.valve.frame(ball));
    // --- tray medallion lights at the first arrival
    const firstArr = ['A', 'B'].filter(k => arrivals[k]);
    const arrU = firstArr.length ? Math.min(...firstArr.map(k => W[k].travel[1])) : null;
    const glow = arrU === null ? 0 : seg(a, arrU, arrU + 0.05);
    Object.assign(nodes, L.tray.frame(glow));
    // --- desk magnifier swings over the tray once something has arrived
    const anyArrive = L.res.reached.length > 0 && !L.awaiting;
    const sw = anyArrive ? ease.inOutCubic(seg(a, ...W.lupa)) : 0;
    const a1 = lerp(L.lupaPark.a1, L.lupaOver.a1, sw), a2 = lerp(L.lupaPark.a2, L.lupaOver.a2, sw);
    const lf = L.desk.frame(a1, a2);
    Object.assign(nodes, lf.nodes);
    nodes['lupa-copy'] = {transform: `scale(${r(L.lupa.z, 3)}) translate(${r(-lf.head.x)} ${r(-lf.head.y)})`};
    // --- chips
    const chipsO = r(seg(u, ...W.chips), 3);
    for (const key of Object.keys(L.whoChips)) nodes[`who${key}-g`] = {opacity: chipsO};
    if (L.tagChip) nodes['tag-g'] = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    if (ctx.show('key')) nodes.foot = {opacity: chipsO};
    L.objLabels.forEach(c => Object.assign(nodes, c.frame(seg(u, 0.02, 0.12))));
    if (L.issues.length) nodes['issue-g'] = {opacity: chipsO};
    L.notes.forEach(c => Object.assign(nodes, c.frame(done ? seg(u, ...W.note) : 0)));
    void reduced;

    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      layout: L.tall ? 'gallery' : L.shape === 'landscape' ? 'wide' : 'square',
      statuses: {A: L.routes.A.R.status, B: L.routes.B.R.status},
      capA: sem.capsule.A, capB: sem.capsule.B,
      handA: sem.hand.A, handB: sem.hand.B,
      capState: sem.capState,
      lid: sem.lid,
      travel: sem.s,
      ball: r(ball, 3),
      inTray: firstArr,
      pointReached: glow > 0,
      glow: r(glow, 3),
      lupa: {x: r(lf.head.x), y: r(lf.head.y)},
      lupaSwing: r(sw, 3),
      lupaOverTray: sw >= 1,
      clerkScale: r(L.k, 3),
      allReached: reach.every(Boolean),
      reach,
      actionCapped: p.actionProgress < 1 && u > capU,
      text: textSem(ctx, L),
      notes: {issues: L.issues.length, annotations: L.notes.length, foot: ctx.show('key'), footHasAssumptions: p.assumptions.every(x => L.footText.includes(x)), key: L.footText.includes(ctx.t.noConclusion)},
      lupaClear: lupaClear(L, lf.head),
    };
    return {nodes, semantic};
  },
};

function lerpAngle(a, b, t) {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

/** Text sizes in px at 1080p (sizes are fixed per layout: no shrink, no ellipsis). */
function textSem(ctx, L) {
  const px = v => r(v / L.U, 2);
  return {
    contentPx: px(L.cs),
    keyPx: px(L.ks),
    captionPx: px(L.gs),
    truncated: [],
    badCallouts: L.badCallouts || 0,
    labelMisses: L.labelMisses || 0,
  };
}

/** The magnifier head never covers a card, plate, the plaque or a chip at the hold. */
function lupaClear(L, head) {
  const b = {x: head.x - L.lupa.R - 8, y: head.y - L.lupa.R - 8, w: 2 * L.lupa.R + 16, h: 2 * L.lupa.R + 16};
  const boxes = [L.rule, L.cols.A.plate, L.cols.A.card, L.cols.B.plate, L.cols.B.card, ...L.placed.filter(q => !Array.isArray(q))];
  return !boxes.some(q => q && b.x < q.x + q.w && b.x + b.w > q.x && b.y < q.y + q.h && b.y + b.h > q.y);
}

function composeForced(ctx) {
  throw new Error(`${ID}: no composition fits the ${ctx.view.shape} box`);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-06-story',
    title: 'Alternative conditions — two clerks send capsules by independent tubes into one receiving tray',
    titleEs: 'Condiciones alternativas — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones alternativas',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Front elevation of a pneumatic-tube wall: a rule plaque, one condition plate and one fact card per route (Route A, Route B). Each clerk hands a capsule into their own brass inlet; the capsules travel independent glass tubes to a shuttle valve (the connector: either inlet pushes its ball against the other seat) and drop into the same receiving tray — the point of analysis — where a desk magnifier swings over them. Pending routes send nothing; a disputed capsule is stopped at its gate. States as supplied; no conclusion drawn.',
    tags: ['reasoning', 'alternative conditions', 'either route', 'pneumatic tube', 'shuttle valve', 'fact', 'rule', 'connector', 'magnifier', 'clerks'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-alternativas.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
