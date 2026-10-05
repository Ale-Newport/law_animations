/**
 * LAW-0104 — Condiciones alternativas · inspect
 *
 * Storyboard (the pneumatic board as context; a lens enlarges the one detail
 * that tells Route A from Route B — the shuttle valve, whose ball rests
 * against the seat of the route NOT used; one supplied datum is substituted):
 *  0.00–0.20 build      The state produced by the story is built: a (neutral)
 *                       capsule runs from the inlet of the route named by the
 *                       BEFORE datum into the tray; the ball is pushed against
 *                       the other seat; that route's tube glows. The datum card
 *                       beside the board prints the before value; the reference
 *                       cards print the rule, both conditions and both facts.
 *  0.20–0.45 isolate    A lens opens from the focus region (the valve, or the
 *                       tray) — a real enlarged copy drawn in the SAME
 *                       coordinates — into the free space; the rest of the
 *                       board dims; cone lines tie the lens to its source.
 *  0.45–0.75 substitute The old value leaves the datum card as a paper slip,
 *                       drops into the "before" slot and is struck through (it
 *                       stays in view); then the new value appears in the card.
 *                       Only the dependent geometry changes, in the lens and in
 *                       the context at once: the ball crosses to the other seat
 *                       and the glow moves to the other tube. The capsule stays
 *                       in the same tray (same point of analysis).
 *  0.75–1.00 return     The lens closes back onto its source; the board
 *                       undims; a Δ pin on the changed detail and the marker
 *                       chip remain with the struck "before" slip. Seeking back
 *                       restores the old datum exactly.
 * Legal content: fictional, jurisdiction unspecified; the new datum is
 * supplied by the author; nothing is inferred about validity, responsibility
 * or outcome.
 * @module animations/reasoning/LAW-0104
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {oneOf, inspectFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  AC_STRINGS, acFields, AC_DEFAULTS, resolveRoutes, statusText, acColors, unitsPerPx, fill,
  rulePlaque, panel, notesLayout, notesArt, compactSystem, fitFixed, fitBalanced, barLines,
} from './kits/condiciones-alternativas.js';

const ID = 'LAW-0104';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {refs: [0, 0.05], travel: [0.02, 0.16], datum: [0.08, 0.14], refsOut: [0.2, 0.235], open: [0.24, 0.39], detach: [0.46, 0.53], strike: [0.53, 0.57], newIn: [0.57, 0.62], dependent: [0.62, 0.71], close: [0.73, 0.8], refsBack: [0.8, 0.83], marker: [0.8, 0.86]};
const M = 14;
const PX = [22, 21, 20, 19, 18, 17, 16];

const EXTRA = {
  en: {datumKind: 'Route datum (as supplied)', before: 'before', after: 'after', factWord: 'Fact', condWord: 'condition', contextDefault: 'Context: the capsule has reached the tray', markerDefault: 'Changed datum (as supplied)'},
  es: {datumKind: 'Dato de ruta (según lo aportado)', before: 'antes', after: 'después', factWord: 'Hecho', condWord: 'condición', contextDefault: 'Contexto: la cápsula ha llegado a la bandeja', markerDefault: 'Dato cambiado (según lo aportado)'},
};
const STRINGS = {en: {...AC_STRINGS.en, ...EXTRA.en}, es: {...AC_STRINGS.es, ...EXTRA.es}};

const insp = inspectFields(['junction', 'point']);
const sceneSchema = {
  ...acFields,
  ...insp,
  beforeRoute: oneOf('Route named by the datum BEFORE the substitution (the capsule came by it; the ball rests against the other seat)', ['A', 'B']),
  detailGeometry: {
    ...insp.detailGeometry,
    properties: {
      zoom: insp.detailGeometry.properties.zoom,
      placement: oneOf('Where the lens opens: always the free region beside/below the board chosen by the layout (auto)', ['auto']),
    },
  },
  afterRoute: oneOf('Route named by the substituted datum, as supplied by the author (only the ball and the route glow follow it; nothing else is inferred)', ['A', 'B']),
};

const defaultParams = {
  ...AC_DEFAULTS,
  focusTarget: 'junction',
  beforeValue: 'Sent by Route A — invitation note from member J. Park',
  afterValue: 'Sent by Route B — partner-club card no. 0417',
  beforeRoute: 'A',
  afterRoute: 'B',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Context: the capsule has reached the tray', marker: 'Changed datum (as supplied)'},
};

function compose(ctx, cpx, reserve = false) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const U = unitsPerPx(ctx);
  const col = acColors(ctx);
  const showK = ctx.show('key'), showA = ctx.show('all');
  const hidden = !showK && !showA;
  const cs = cpx * U, ks = Math.min(cpx, 20) * U, gs = Math.min(cpx, 19) * U;
  const L = {cpx, U, cs, ks, gs};
  const shape = ctx.view.shape;
  L.shape = shape;
  const N = notesLayout(ctx, {M, ks, collapse: hidden});
  L.N = N;
  const Wd = D.w - 2 * M;
  const top = M, bottom = N.top - 14;
  const res = resolveRoutes(p);

  // --- widths: [context column: caption, board, datum card, slip] + [reference region, where the lens opens]
  const ctxW = shape === 'landscape' ? Wd * 0.42 : shape === 'square' ? Wd * 0.47 : Wd;
  const refRegW = shape === 'portrait' ? Wd : Wd - ctxW - 28;
  // --- reference cards: rule, and per route its condition + fact (drawn once, static)
  const refW = shape === 'portrait' ? (Wd - 16) / 2 : refRegW;
  const plq = rulePlaque(ctx, {w: shape === 'portrait' ? Wd : refW, kind: t.ruleKind, headSize: ks, text: p.rules.name, size: cs, show: showK});
  const cards = res.routes.map(R => panel(ctx, {w: refW, head: `${t.route} ${R.key} · ${t.condWord}`, headSize: ks, body: `${R.condition} — ${t.factWord}: ${R.fact}`, size: cs, weight: 500, pill: {text: statusText(t, R.status), status: R.status, color: col.route(R.key)}, pillSize: ks, show: showK, balance: true}));
  L.refs = {plq, cards, refW};

  // --- datum card, slip, context caption
  const datumW = shape === 'portrait' ? (Wd - 16) / 2 : ctxW;
  const valFit = v => fitBalanced(ctx, v, datumW - 2 * cs * 0.6, cs, {weight: 600, maxLines: 8});
  const vb = valFit(p.beforeValue), va = valFit(p.afterValue);
  const headF = fitFixed(ctx, t.datumKind, datumW - 2 * cs * 0.6, ks, {weight: 700, maxLines: 3});
  const datumH = cs * 0.6 + headF.height + ks * 0.5 + Math.max(vb.height, va.height) + cs * 0.7;
  const slipW = datumW;
  const slipF = fitBalanced(ctx, p.beforeValue, slipW - 2 * cs * 0.6, cs, {weight: 600, maxLines: 8});
  const tagF = fitFixed(ctx, t.before, slipW, ks, {weight: 700, maxLines: 1});
  const slipH = ks * 0.4 + tagF.height + ks * 0.5 + slipF.height + cs * 0.5;
  const ctxCap = chip(ctx, p.contextLabels.context, {x: 0, y: 0, maxWidth: datumW, size: gs, minSize: gs, maxLines: 4, weight: 600});
  L.datum = {w: datumW, h: datumH, vb, va, headF, slipF, tagF, slipW, slipH};
  L.vOff = ks * 0.4 + tagF.height + ks * 0.5; // the slip's value line sits this far below its top
  L.ctxCapBox = ctxCap.box;
  const zoom = p.detailGeometry.zoom;

  // --- regions per shape
  let board, datumAt, refPos, capAt, refBox;
  if (shape !== 'portrait') {
    // context column on the left; the reference cards stacked on the right (the lens opens over them)
    capAt = {x: M, y: top};
    const bTop = top + ctxCap.box.h + 10;
    // optional row under the board for the changed-datum chip (when no clear spot exists on the board)
    const kR0 = clamp(ks * 0.62, 11, 16);
    const rowH = reserve ? chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: ctxW - 2 * kR0 - 10, size: ks, minSize: ks, maxLines: 4, weight: 700}).box.h + 12 : 0;
    const bh = Math.min(bottom - bTop - 14 - rowH - datumH - 12 - slipH, ctxW * (shape === 'landscape' ? 0.9 : 1.05));
    if (bh < ctxW * (shape === 'landscape' ? 0.5 : 0.62)) return null;
    board = {x: M, y: bTop, w: ctxW, h: bh};
    datumAt = {x: M, y: bTop + bh + 14 + rowH};
    if (reserve) L.markerRow = {x: M, y: bTop + bh + 10, w: ctxW};
    const rx = M + ctxW + 28;
    const refsH = plq.h + 14 + cards[0].h + 14 + cards[1].h;
    if (refsH > bottom - top) return null;
    let y = top + (bottom - top - refsH) / 2;
    refPos = [{x: rx, y}]; y += plq.h + 14;
    refPos.push({x: rx, y}); y += cards[0].h + 14;
    refPos.push({x: rx, y});
    refBox = {x: rx, y: top, w: refRegW, h: bottom - top};
  } else {
    // tall frames: caption, the board at FULL width, the reference cards under it (the lens opens over them),
    // then the datum card and the before-slip side by side
    capAt = {x: M, y: top};
    const bTop = top + ctxCap.box.h + 10;
    const refsH = plq.h + 14 + Math.max(cards[0].h, cards[1].h);
    const lowH = Math.max(datumH, slipH);
    const bh = Math.min(bottom - bTop - 20 - refsH - 20 - lowH, Wd * 0.95);
    if (bh < Wd * 0.55) return null;
    board = {x: M, y: bTop, w: Wd, h: bh};
    const ry = bTop + bh + 20;
    refPos = [{x: M, y: ry}, {x: M, y: ry + plq.h + 14}, {x: M + refW + 16, y: ry + plq.h + 14}];
    refBox = {x: M, y: ry, w: Wd, h: refsH};
    datumAt = {x: M, y: ry + refsH + 20};
  }
  // the lens window lies over the reference region (hidden while it is open). Beside the board it keeps to
  // the board's own height band, so opening and closing never sweep across the datum card under the board.
  let lensDest;
  if (shape !== 'portrait') {
    const lh = Math.min(board.h, refBox.h);
    lensDest = {x: refBox.x, y: board.y, w: Math.min(refBox.w, lh * 1.7), h: lh};
    lensDest.x = refBox.x + (refBox.w - lensDest.w) / 2;
  } else {
    lensDest = {x: refBox.x, y: refBox.y, w: refBox.w, h: refBox.h};
  }
  L.refBox = refBox;
  L.board = board;
  L.datumAt = datumAt;
  L.slipAt = shape === 'portrait' ? {x: datumAt.x + datumW + 16, y: datumAt.y} : {x: datumAt.x, y: datumAt.y + datumH + 12};
  L.lensDest = lensDest;
  L.refPos = refPos;
  L.capAt = capAt;

  // --- the context board and its lens copy (same geometry, separate named nodes)
  const letter = Math.max(ks, 18 * U);
  L.ctxSys = compactSystem(ctx, 'c-', {x: board.x, y: board.y, w: board.w, h: board.h, show: showK, letterSize: letter, neutral: true, lupa: false});
  L.lensSys = compactSystem(ctx, 'l-', {x: board.x, y: board.y, w: board.w, h: board.h, show: false, letterSize: letter, neutral: true, lupa: false});
  // --- lens source: the valve (junction) or the tray (point), same aspect as the destination
  const S = L.ctxSys;
  const fc = p.focusTarget === 'point' ? {x: S.tray.box.x + S.tray.box.w / 2, y: S.tray.box.y + S.tray.box.h * 0.35} : S.valve.ports.center;
  const sw = clamp(lensDest.w / zoom, S.valve.Lv * 2.6, board.w * 0.9);
  const sh = sw * lensDest.h / lensDest.w;
  L.source = {x: clamp(fc.x - sw / 2, board.x, board.x + board.w - sw), y: clamp(fc.y - sh / 2, board.y, board.y + board.h - sh), w: sw, h: sh};
  L.focus = fc;
  return L;
}

const scene = {
  sizes: {landscape: [1800, 900], square: [1100, 925], portrait: [900, 1400]},
  layout(ctx) {
    let L = null;
    let fallback = null;
    for (const px of PX) {
      const C = compose(ctx, px);
      if (!C) continue;
      placeMarker(ctx, C);
      if (C.markerFits) { L = C; break; }
      fallback = fallback || C;
      const Rv = ctx.view.shape === 'portrait' ? null : compose(ctx, px, true);
      if (Rv) { placeMarker(ctx, Rv); L = Rv; break; }
    }
    L = L || fallback;
    if (!L) throw new Error(`${ID}: no composition fits the ${ctx.view.shape} box`);
    const S = L.lensSys;
    const content = g(null, S.layers.wall, S.layers.back, S.layers.capsules, S.layers.front, S.layers.doubt);
    L.lens = lens(ctx, {name: 'lens', source: L.source, dest: L.lensDest, content, frame: L.board, color: ctx.theme.accent});
    // each reference card stays fully visible until the opening lens is about to reach it, and comes back as
    // soon as the closing lens has left it (never half-faded under the lens; the frame is never left empty)
    const R = L.refs;
    const pw = L.shape === 'portrait' ? ctx.design.w - 2 * M : R.refW;
    L.refCards = [
      {name: 'rule-plaque', box: {x: L.refPos[0].x, y: L.refPos[0].y, w: pw, h: R.plq.h}},
      {name: 'routeA', box: {x: L.refPos[1].x, y: L.refPos[1].y, w: R.refW, h: R.cards[0].h}},
      {name: 'routeB', box: {x: L.refPos[2].x, y: L.refPos[2].y, w: R.refW, h: R.cards[1].h}},
    ];
    const padB = b => ({x: b.x - 14, y: b.y - 14, w: b.w + 28, h: b.h + 28});
    const lpAt = u => ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    for (const c of L.refCards) {
      const pb = padB(c.box);
      c.hit = null; c.free = null;
      for (let u = W.open[0]; u <= W.open[1] + 1e-9; u += 0.0005) if (rectHit(lensRectAt(L, lpAt(u)), pb)) { c.hit = u - 0.001; break; }
      for (let u = W.close[1]; u >= W.close[0] - 1e-9; u -= 0.0005) if (rectHit(lensRectAt(L, lpAt(u)), pb)) { c.free = u + 0.001; break; }
    }
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const col = acColors(ctx);
    const showK = ctx.show('key'), showA = ctx.show('all');
    const S = L.ctxSys;
    const R = L.refs;
    const refs = g({name: 'refs'},
      R.plq.draw(L.refPos[0].x, L.refPos[0].y, 'rule-plaque'),
      R.cards[0].draw(L.refPos[1].x, L.refPos[1].y, {name: 'routeA', fill: col.brassLight, stroke: col.brassDark, headColor: '#5a4518', color: th.ink, radius: 8, accent: col.A}),
      R.cards[1].draw(L.refPos[2].x, L.refPos[2].y, {name: 'routeB', fill: col.brassLight, stroke: col.brassDark, headColor: '#5a4518', color: th.ink, radius: 8, accent: col.B}));
    // datum card: header + value slot (old value as a detachable paper slip; new value underneath)
    const Dm = L.datum;
    const pad = L.cs * 0.6;
    const dx = L.datumAt.x, dy = L.datumAt.y;
    const valY = dy + pad + Dm.headF.height + L.ks * 0.5;
    const card = g({name: 'datum'},
      h('path', {d: roundRectPath(dx + 5, dy + 7, Dm.w, Dm.h, 10), fill: 'rgba(31,35,40,0.13)'}),
      h('path', {d: roundRectPath(dx, dy, Dm.w, Dm.h, 10), fill: th.card, stroke: th.ink, 'stroke-width': 2.4}),
      h('circle', {cx: r(dx + Dm.w - 18), cy: r(dy + 18), r: 6, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2}),
      showK ? textBlock(Dm.headF, {x: dx + pad, y: dy + pad, fill: th.inkSoft}) : g(null, barLines(dx + pad, dy + pad, Math.min(Dm.headF.width, Dm.w * 0.5), Dm.headF.lines.length, L.ks, '#c9c2b4')),
      g({name: 'val-new', opacity: 0}, showK ? textBlock(Dm.va, {x: dx + pad, y: valY, fill: th.ink, name: 'val-new-text'}) : g(null, barLines(dx + pad, valY, Math.min(Dm.va.width, Dm.w - 2 * pad), Dm.va.lines.length, L.cs, '#9aa4ad'))));
    // the old value rides on a paper slip that leaves the card and parks, struck through, in the "before" slot
    const vOff = L.vOff;
    const slipBody = g(null,
      h('path', {name: 'slip-bg', d: roundRectPath(0, 0, Dm.slipW, Dm.slipH, 6), fill: '#fbf3df', stroke: th.inkSoft, 'stroke-width': 2, opacity: 0}),
      showK ? g({name: 'slip-before', opacity: 0}, textBlock(Dm.tagF, {x: L.cs * 0.6, y: L.ks * 0.4, fill: th.accent})) : null,
      showK ? g({name: 'slip-text'}, textBlock(Dm.slipF, {x: L.cs * 0.6, y: vOff, fill: th.ink})) : g(null, barLines(L.cs * 0.6, vOff, Math.min(Dm.slipF.width, Dm.slipW - L.cs * 1.2), Dm.slipF.lines.length, L.cs, '#9aa4ad')),
      h('path', {name: 'slip-strike', d: Dm.slipF.lines.map((ln, i) => `M${r(L.cs * 0.5)} ${r(vOff + i * Dm.slipF.lineHeight + Dm.slipF.size * 0.45)}h${r(Math.min(Dm.slipW - L.cs, L.cs * 0.2 + ctx.measure(ln, Dm.slipF.size, 600, 'sans')))}`).join(''), stroke: th.accent, 'stroke-width': 2.6, 'stroke-dasharray': '2000', 'stroke-dashoffset': 2000}));
    const slip = g({name: 'slip', transform: T(dx, valY - vOff)}, slipBody);
    // marker: the shared neutral Δ marker (white Δ on accent2) on the changed detail, and its chip (placed in layout)
    const {box: mkBox, mw, mR, kR, at: mAt, inBoard} = L.marker;
    const mk = chip(ctx, p.contextLabels.marker, {x: mkBox.x, y: mkBox.y, maxWidth: mw, size: L.ks, minSize: L.ks, maxLines: 4, weight: 700, fill: th.card, stroke: th.accent2});
    const kAt = {x: mkBox.x - kR - 6, y: mkBox.y + Math.min(mkBox.h / 2, kR + 6)};
    const lead0 = {x: clamp(mAt.x, mk.box.x + 8, mk.box.x + mk.box.w - 8), y: mk.box.y + mk.box.h / 2 < mAt.y ? mk.box.y + mk.box.h : mk.box.y};
    const marker = g({name: 'marker', opacity: 0},
      inBoard ? h('line', {x1: r(lead0.x), y1: r(lead0.y), x2: r(mAt.x), y2: r(mAt.y + (lead0.y < mAt.y ? -mR : mR)), stroke: th.accent2, 'stroke-width': 2.4, 'stroke-dasharray': '6 6'}) : null,
      changedMarker(ctx, {name: 'marker-delta', x: mAt.x, y: mAt.y, radius: mR}),
      showA || showK ? changedMarker(ctx, {name: 'marker-key', x: kAt.x, y: kAt.y, radius: kR}) : null,
      showA || showK ? mk.node : null);
    const cap = showA ? chip(ctx, p.contextLabels.context, {x: L.capAt.x, y: L.capAt.y, maxWidth: L.datum.w, size: L.gs, minSize: L.gs, maxLines: 4, weight: 600, fill: th.card, stroke: th.inkSoft, name: 'ctx-caption'}).node : null;
    return g(null,
      refs,
      g({name: 'board'}, S.layers.wall, S.layers.back, S.layers.capsules, S.layers.front, S.layers.doubt),
      cap,
      card,
      slip,
      L.lens.node,
      marker,
      notesArt(ctx, L.N, {ks: L.ks}),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const S = L.ctxSys;
    const before = p.beforeRoute, after = p.afterRoute;
    const R = S.routes[before];
    // build: the capsule runs from the BEFORE route's inlet into the tray; ball against the other seat
    const tr = ease.inOutCubic(seg(u, ...W.travel));
    const s = R.path.total * tr;
    const pass = clamp((s - (R.sPort - 40)) / 50);
    const dep = ease.inOutCubic(seg(u, ...W.dependent));
    const ballBefore = (before === 'A' ? 1 : -1) * ease.inOutSine(pass);
    const ballAfter = after === 'A' ? 1 : -1;
    const ball = lerp(ballBefore, ballAfter, dep);
    const haloBefore = ease.inOutSine(pass);
    const halo = {A: 0, B: 0};
    halo[before] += haloBefore * (1 - dep);
    halo[after] += dep;
    const glow = seg(u, W.travel[1] - 0.01, W.travel[1] + 0.03);
    const state = {route: before, status: 'supplied', travel: tr, lid: clamp(seg(u, 0.01, 0.03) - seg(u, 0.05, 0.08)), ball, glow, lupa: 0, gate: 0, doubt: 0, halo, capOpacity: 1};
    const f1 = S.frame(state);
    const f2 = L.lensSys.frame(state);
    Object.assign(nodes, f1.nodes, f2.nodes);
    // lens: opens, holds during the substitution, closes back onto its source
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.lens.frame(lp, lp));
    // datum: old value leaves as a slip, is struck and parked; the new value appears afterwards
    const det = ease.inOutCubic(seg(u, ...W.detach));
    const Dm = L.datum;
    const valY = L.datumAt.y + L.cs * 0.6 + Dm.headF.height + L.ks * 0.5;
    const s0 = {x: L.datumAt.x, y: valY - L.vOff};
    nodes['slip-bg'] = {opacity: r(clamp(det * 3), 3)};
    if (ctx.show('key')) nodes['slip-before'] = {opacity: r(seg(u, ...W.strike), 3)};
    const s1 = L.slipAt;
    // (a slight tilt only: a wide slip tilted further would brush the card's header line)
    const kx = det, ky = det;
    nodes.slip = {transform: T(lerp(s0.x, s1.x, kx) + Math.sin(Math.PI * det) * 18, lerp(s0.y, s1.y, ky), Math.sin(Math.PI * det) * -1)};
    nodes['slip-strike'] = {'stroke-dashoffset': r(2000 * (1 - seg(u, ...W.strike)))};
    nodes['val-new'] = {opacity: r(seg(u, ...W.newIn), 3)};
    const mkO = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mkO, 3)};
    const chipsO = r(seg(u, ...W.refs), 3);
    // per card: fully hidden while the lens covers it (never half-faded fragments), back as soon as it has left
    const FADE = 0.012;
    const cardVis = L.refCards.map(c => {
      if (c.hit === null) return 1;
      if (u < W.close[0] || c.free === null) return 1 - seg(u, c.hit - FADE, c.hit);
      return seg(u, c.free, c.free + FADE);
    });
    L.refCards.forEach((c, i) => { nodes[c.name] = {opacity: r(cardVis[i], 3)}; });
    nodes.refs = {opacity: chipsO};
    const lensR = lensRectAt(L, lp);
    const refsVis = Math.min(...cardVis);
    if (ctx.show('key')) nodes.foot = {opacity: chipsO};
    if (L.N.issueBox && ctx.show('all')) nodes['issue-g'] = {opacity: chipsO};
    // semantics
    const k = L.lensDest.w / L.source.w;
    const datum = u < W.newIn[0] ? 'before' : 'after';
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    return {
      nodes,
      semantic: {
        beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
        shape: L.shape,
        focus: p.focusTarget,
        cap: P2(f1.capPt),
        capState: f1.capState,
        lensCap: P2(f2.capPt),
        ball: r(ball, 3),
        halo: {A: r(halo.A, 3), B: r(halo.B, 3)},
        trayGlow: r(glow, 3),
        lens: r(lp, 3),
        lensZoom: r(k, 3),
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        dest: {x: r(L.lensDest.x), y: r(L.lensDest.y), w: r(L.lensDest.w), h: r(L.lensDest.h)},
        // the copy maps the source rectangle exactly onto the lens window (same coordinates, scaled)
        copyMapsSource: Math.abs(L.lensDest.h / L.source.h - k) < 1e-6,
        focusInSource: L.focus.x >= L.source.x && L.focus.x <= L.source.x + L.source.w && L.focus.y >= L.source.y && L.focus.y <= L.source.y + L.source.h,
        datum,
        datumValue: datum === 'before' ? p.beforeValue : p.afterValue,
        slip: {x: r(lerp(s0.x, s1.x, kx)), y: r(lerp(s0.y, s1.y, ky))},
        slipParked: det >= 1,
        struck: r(seg(u, ...W.strike), 3),
        marker: r(mkO, 3),
        refsOpacity: r(chipsO * refsVis, 3),
        // a reference card visible (at all) while the lens rectangle overlaps it
        refUnderLens: L.refCards.some((c, i) => cardVis[i] > 0 && rectHit(lensR, c.box)),
        // the right-hand / lower reference region is occupied by the lens or by visible reference cards
        refRegionFilled: rectHit(lensR, L.refBox) || Math.max(...cardVis) > 0,
        markerChipClear: !L.markerObstacles.some(q => rectHit(L.markerChip, q)),
        lensOverDatum: rectHit(lensRectAt(L, lp), {x: L.datumAt.x, y: L.datumAt.y, w: L.datum.w, h: L.datum.h}),
        boardFrac: r((L.board.w / L.U) / (ctx.view.width * 1080 / Math.min(ctx.view.width, ctx.view.height)), 3),
        routes: {before, after},
        text: {contentPx: r(L.cs / L.U, 2), keyPx: r(L.ks / L.U, 2), captionPx: r(L.gs / L.U, 2)},
        notes: {issues: L.N.issueBox && ctx.show('all') ? 1 : 0, key: ctx.show('key'), footHasAssumptions: p.assumptions.every(x => L.N.footText.includes(x))},
      },
    };
  },
};

/**
 * Place the changed-datum Δ marker (on the changed detail) and its chip. The chip carries the same Δ as a key.
 * It sits on the board, clear of the A/B badges, bells, valve and tray, when a clear spot exists (≤ 2 lines);
 * otherwise in a row reserved under the board (L.markerRow, see compose). Sets L.markerFits.
 */
function placeMarker(ctx, L) {
  const p = ctx.params;
  const S = L.ctxSys;
  const fcP = L.focus;
  const mR = clamp(S.valve.Lv * 0.32, 14, 24);
  const mAt = {x: fcP.x + S.valve.Lv * 0.75, y: fcP.y - S.valve.Lv * 0.55 - mR};
  const kR = clamp(L.ks * 0.62, 11, 16); // the key Δ on the chip
  const mb = L.board;
  const obst = [S.routes.A.tabBox, S.routes.B.tabBox, S.routes.A.inlet.box, S.routes.B.inlet.box, S.valve.box, S.tray.box, {x: mAt.x - mR, y: mAt.y - mR, w: 2 * mR, h: 2 * mR}];
  const hitP = (a, q, pad) => a.x < q.x + q.w + pad && a.x + a.w + pad > q.x && a.y < q.y + q.h + pad && a.y + a.h + pad > q.y;
  const probeAt = w => chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: w, size: L.ks, minSize: L.ks, maxLines: 4, weight: 700});
  let box = null, mw = 0, inBoard = false;
  if (L.markerRow) {
    const R = L.markerRow;
    mw = R.w - 2 * kR - 10;
    const pr = probeAt(mw);
    box = {x: R.x + 2 * kR + 10, y: R.y, w: pr.box.w, h: pr.box.h};
  } else {
    for (const wTry of [Math.max(160, mb.w * 0.56), mb.w * 0.46]) {
      const pr = probeAt(wTry);
      if ((pr.fit && pr.fit.truncated) || pr.fit.lines.length > 2) continue;
      const bw = pr.box.w + 2 * kR + 10, bh = pr.box.h;
      const yStart = Math.max(mb.y + 8, mAt.y - mR - 24 - bh);
      const ys = [];
      for (let y = yStart; y >= mb.y + 6; y -= 6) ys.push(y);
      for (let y = yStart + 6; y <= mb.y + mb.h - bh - 6; y += 6) ys.push(y);
      for (const y of ys) {
        for (const k of [0, -0.05, 0.05, -0.1, 0.1, -0.15, 0.15, -0.2, 0.2, -0.3, 0.3, -0.4, 0.4]) {
          const cx = clamp(mAt.x + k * mb.w, mb.x + bw / 2 + 6, mb.x + mb.w - bw / 2 - 6);
          const b = {x: cx - bw / 2, y, w: bw, h: bh};
          if (!obst.some(q => hitP(b, q, 8))) { box = {x: b.x + 2 * kR + 10, y, w: pr.box.w, h: bh}; mw = wTry; inBoard = true; break; }
        }
        if (box) break;
      }
      if (box) break;
    }
  }
  L.markerFits = Boolean(box);
  if (!box) { const pr = probeAt(mb.w * 0.56); mw = mb.w * 0.56; box = {x: mb.x + 2 * kR + 16, y: mb.y + 8, w: pr.box.w, h: pr.box.h}; inBoard = true; }
  L.marker = {box, mw, mR, kR, at: mAt, inBoard};
  // the chip together with its key Δ
  L.markerChip = {x: box.x - 2 * kR - 10, y: box.y, w: box.w + 2 * kR + 10, h: box.h};
  L.markerAt = mAt;
  L.markerObstacles = obst.slice(0, 6);
}

/** The lens window rectangle at open progress p (source → dest, as in frameworks/lens.js). */
function lensRectAt(L, p) {
  const S = L.source, D = L.lensDest;
  return p <= 0.001 ? null : {x: lerp(S.x, D.x, p), y: lerp(S.y, D.y, p), w: lerp(S.w, D.w, p), h: lerp(S.h, D.h, p)};
}
function rectHit(a, b) {
  return Boolean(a) && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-06-inspect',
    title: 'Alternative conditions — a lens on the shuttle valve while the supplied route datum is substituted',
    titleEs: 'Condiciones alternativas — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones alternativas',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A compact pneumatic board shows the state produced by the story: a capsule has come by the route named by the supplied datum and rests in the tray; the shuttle-valve ball rests against the other seat and that tube glows. A lens opens a real enlarged copy of the valve (or the tray); the datum is substituted — the old value leaves on a paper slip that is struck and kept — and only the dependent geometry follows (ball to the other seat, glow to the other tube). The lens closes and a Δ marker stays. Seeking back restores the old datum.',
    tags: ['reasoning', 'alternative conditions', 'inspect', 'lens', 'substitution', 'shuttle valve', 'route datum'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-alternativas.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
