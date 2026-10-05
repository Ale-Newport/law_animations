/**
 * LAW-0103 — Condiciones alternativas · contrast
 *
 * Storyboard (two complete, identical pneumatic boards side by side, each
 * about half the width in every frame; the rule, both alternative conditions,
 * both supplied facts and the shared facts are drawn ONCE, as a compact strip
 * under the boards, because they are the same in A and B):
 *  0.00–0.17 base      Both boards identical: inlet A (upper left), inlet B
 *                      (upper right), glass tubes, shuttle valve with its ball
 *                      centred, empty receiving tray, parked desk magnifier.
 *                      Only neutral A/B badges above them — no label, colour
 *                      or capsule that could anticipate the difference.
 *  0.17–0.40 change    One localized change per board: a capsule slides in
 *                      from the top edge into inlet A in board A and into
 *                      inlet B in board B (lid opens). The scenario label and
 *                      the supplied fact (with its status) appear above each
 *                      board when its capsule reaches the bell.
 *  0.40–0.77 parallel  Same timing in both boards: each capsule runs down its
 *                      own tube; at the valve it pushes the ball against the
 *                      other seat (A → against the B seat; B → against the A
 *                      seat) and drops into the tray; the tray medallion lights
 *                      and the magnifier swings over it. A capsule whose fact
 *                      is supplied as disputed is stopped at its gate ('?'); a
 *                      pending fact sends nothing.
 *  0.77–1.00 guide     A dashed guide joins the one detail that differs (Δ
 *                      rings on the two valve windows: the ball rests against
 *                      opposite seats); it runs along the boards' free top
 *                      band, clear of tubes, cards and badges. The changed-fact
 *                      chip (with the guide's caption) and the neutral note
 *                      appear; everything is complete by 0.86 and held
 *                      (≥ 1 s). No winner, score or outcome.
 * A route used in neither scenario keeps its supplied fact in the strip,
 * marked "not sent (as supplied)".
 * Legal content: fictional, jurisdiction unspecified; states are as supplied;
 * reaching the tray is not a finding that a condition is met or of any outcome.
 * @module animations/reasoning/LAW-0103
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {oneOf, obj, contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {
  AC_STRINGS, acFields, AC_DEFAULTS, resolveRoutes, statusText, statusTokens, acColors, unitsPerPx, fill,
  rulePlaque, panel, notesLayout, notesArt, compactSystem, fitFixed, fitBalanced, fitTokens, barLines, statusPill,
} from './kits/condiciones-alternativas.js';

const ID = 'LAW-0103';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {enter: [0.19, 0.33], labels: [0.3, 0.38], travel: [0.42, 0.68], lupa: [0.68, 0.75], rings: [0.77, 0.81], guide: [0.79, 0.84], chips: [0.82, 0.86], shared: [0, 0.06]};
const M = 14;
const PX = [22, 21, 20, 19, 18, 17, 16];

const EXTRA = {
  en: {factWord: 'Fact', sameBoth: 'Same in A and B', changedFact: 'Changed fact', notSentYet: 'No fact sent in this scenario', condA: 'Route A · condition', condB: 'Route B · condition', notSentEither: 'Not sent (as supplied)', sends: 'sends'},
  es: {factWord: 'Hecho', sameBoth: 'Igual en A y B', changedFact: 'Hecho cambiado', notSentYet: 'Ningún hecho enviado en este supuesto', condA: 'Ruta A · condición', condB: 'Ruta B · condición', notSentEither: 'Sin enviar (según lo aportado)', sends: 'envía'},
};
const STRINGS = {en: {...AC_STRINGS.en, ...EXTRA.en}, es: {...AC_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...acFields,
  ...contrastFields(),
  sentRoute: obj('The ONE fact that differs: the route by which the supplied fact is sent in each scenario (the capsule behaves as that route’s fact status says)', {
    a: oneOf('Route used in scenario A', ['A', 'B', 'none']),
    b: oneOf('Route used in scenario B', ['A', 'B', 'none']),
  }, ['a', 'b']),
};

const defaultParams = {
  ...AC_DEFAULTS,
  scenarioA: {label: 'Route A', caption: 'the fact is sent by Route A'},
  scenarioB: {label: 'Route B', caption: 'the fact is sent by Route B'},
  changedFact: 'the supplied fact travels as a member’s written invitation (A) or as a partner-club card (B)',
  sharedFacts: ['Same guest and same visit day', 'Same rule G-2 and the same receiving tray'],
  comparisonLabels: {guide: 'Only the route differs', neutral: 'Both reach the same point of analysis by different routes — no ranking, no outcome'},
  sentRoute: {a: 'A', b: 'B'},
};

/**
 * The fact a scenario sends: text on the left, the status pill on the right of the same line when it fits
 * (else under the text). Same measure/draw shape as kit panel().
 */
function factCard(ctx, o) {
  const pad = o.size * 0.45;
  const ps = o.ks;
  const pillFit = o.pill ? fitTokens(ctx, o.pill.tokens, 1e6, ps) : null;
  const pillW = pillFit ? pillFit.width + ps * 2.2 : 0, pillH = pillFit ? pillFit.height + ps * 0.7 : 0;
  const inlineW = o.w - 2 * pad - (pillW ? pillW + 14 : 0);
  // balanced wrap: no lone word on the last line
  let text = fitBalanced(ctx, o.text, inlineW, o.size, {weight: 600, maxLines: 10});
  let inline = Boolean(pillFit) && text.lines.length <= 2 && inlineW > o.w * 0.45;
  if (!inline) text = fitBalanced(ctx, o.text, o.w - 2 * pad, o.size, {weight: 600, maxLines: 10});
  const pill = pillFit && !inline ? fitTokens(ctx, o.pill.tokens, o.w - 2 * pad - ps * 2.2, ps) : pillFit;
  const pw = pill ? pill.width + ps * 2.2 : 0, ph = pill ? pill.height + ps * 0.7 : 0;
  const hh = inline ? 2 * pad + Math.max(text.height, ph) : 2 * pad + text.height + (pill ? ps * 0.5 + ph : 0);
  return {
    h: hh, w: o.w,
    draw(x, y, st) {
      const ty = inline ? y + pad + Math.max(0, (ph - text.height) / 2) : y + pad;
      const px = inline ? x + o.w - pad - pw : x + pad + 4;
      const py = inline ? y + pad + Math.max(0, (text.height - ph) / 2) : y + pad + text.height + ps * 0.5;
      return g({name: st.name},
        h('path', {d: roundRectPath(x + 5, y + 7, o.w, hh, 6), fill: 'rgba(31,35,40,0.13)'}),
        h('path', {d: roundRectPath(x, y, o.w, hh, 6), fill: st.fill, stroke: st.stroke, 'stroke-width': 2.4}),
        h('path', {d: roundRectPath(x, y, 12, hh, 6), fill: st.accent}),
        o.show ? textBlock(text, {x: x + pad + 4, y: ty, fill: st.color, name: `${st.name}-body`}) : g(null, barLines(x + pad + 4, ty, text.width, text.lines.length, o.size, '#c9c2b4')),
        pill ? statusPill(ctx, {x: px, y: py, w: pw, h: ph, status: o.pill.status, color: o.pill.color, size: ps, fit: pill, show: o.show, name: `${st.name}-pill`}) : null);
    },
  };
}

/** Scenario state (route used and its supplied status). */
function scenario(p, which) {
  const route = p.sentRoute[which] === 'none' ? null : p.sentRoute[which];
  const res = resolveRoutes(p);
  const R = route ? res.routes.find(q => q.key === route) : null;
  return {route, status: R ? R.status : 'pending', fact: R ? R.fact : null};
}

function compose(ctx, cpx) {
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
  // side by side on wide and square boxes; stacked, each board (nearly) full width, on tall boxes (item 18)
  const stacked = shape === 'portrait';
  L.arr = stacked ? 'column' : 'row';
  L.shape = shape;
  const Wd = D.w - 2 * M;
  const top = M;
  const sc = {a: scenario(p, 'a'), b: scenario(p, 'b')};
  L.sc = sc;
  const res = resolveRoutes(p);
  // side by side: each about half the width; stacked: the full width less a right gutter that carries the guide
  const gap = shape === 'landscape' ? 56 : 40;
  const gutter = 44, gapV = 28;
  const bw = stacked ? Wd - gutter : (Wd - gap) / 2;
  L.gutter = gutter;
  const hw = bw;
  L.bw = bw; L.hw = hw; L.gap = gap;

  // --- headers: badge + label (+ caption); the fact this scenario sends, with its supplied status
  const badgeR = ks * 0.95;
  const head = which => {
    const S = which === 'a' ? p.scenarioA : p.scenarioB;
    const lab = ctx.fit(S.label, {maxWidth: hw - badgeR * 2 - 16, size: cs, minSize: cs, maxLines: 3, weight: 700});
    const inline = S.caption && hw - badgeR * 2 - 16 - lab.width - 16 > 240;
    const capW = inline ? hw - badgeR * 2 - 16 - lab.width - 16 : hw;
    const cap = S.caption ? ctx.fit(S.caption, {maxWidth: capW, size: gs, minSize: gs, maxLines: 4, weight: 500}) : null;
    const s = sc[which];
    const factText = s.route ? `${t.factWord} ${s.route}: ${s.fact}` : t.notSentYet;
    const fc = factCard(ctx, {w: hw, text: factText, size: cs, ks, show: showK, pill: s.route ? {tokens: statusTokens(t, s.status), status: s.status, color: col.route(s.route)} : null});
    const lineH = Math.max(badgeR * 2, lab.height, inline && cap ? cap.height : 0);
    const capBelow = cap && !inline ? cap.height + 8 : 0;
    return {lab, cap, inline, fc, lineH, capBelow, h: lineH + capBelow + 8 + fc.h};
  };
  const hA = head('a'), hB = head('b');
  const headH = Math.max(hA.h, hB.h);
  L.heads = {a: hA, b: hB};
  L.headH = headH;

  // --- compact strip (drawn once): the rule plaque and one list of the conditions and shared facts; a fact
  // that no scenario sends is listed here, marked "not sent (as supplied)"
  const used = key => sc.a.route === key || sc.b.route === key;
  const halfW = (Wd - 16) / 2;
  const plq = rulePlaque(ctx, {w: halfW, kind: t.ruleKind, headSize: ks, text: p.rules.name, size: cs, show: showK});
  const pad = cs * 0.55;
  const rowW = halfW - 2 * pad - ks * 1.1;
  const rows = res.routes.map(R => ({key: R.key, text: `${R.key === 'A' ? t.condA : t.condB}: ${R.condition}${used(R.key) ? '' : ` — ${t.factWord} ${R.key}: ${R.fact || '—'} · ${t.notSentEither}`}`}));
  rows.push({key: 'S', text: `${t.sameBoth}: ${p.sharedFacts.length ? p.sharedFacts.join(' · ') : '—'}`});
  const rowFits = rows.map(rw => fitFixed(ctx, rw.text, rowW, cs, {weight: 500, maxLines: 10}));
  const listH = pad * 2 + rowFits.reduce((a, f) => a + f.height, 0) + (rowFits.length - 1) * cs * 0.45;
  const stripH = Math.max(plq.h, listH);
  L.shared = {plq, rows, rowFits, halfW, listH, stripH, pad, used: {A: used('A'), B: used('B')}};

  // --- bottom grid: the guide's caption with the changed fact, the neutral note, the issue and the
  // footnote (assumptions + "as supplied · no conclusion drawn") — one row of four on wide boxes, 2 × 2 otherwise
  const cols = shape === 'landscape' ? 4 : 2;
  const gw = (Wd - (cols - 1) * 16) / cols;
  const footText = p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ${t.noConclusion}` : t.noConclusion;
  const cells = [
    {name: 'changed', text: `${p.comparisonLabels.guide} — ${t.changedFact}: ${p.changedFact}`, level: 'key'},
    {name: 'neutral', text: p.comparisonLabels.neutral, level: 'all'},
    p.issues.length ? {name: 'issue', text: `${t.issue}: ${p.issues[0]}`, level: 'all'} : null,
    {name: 'foot', text: footText, level: 'key'},
  ].filter(Boolean).map(c => ({...c, h: chip(ctx, c.text, {x: 0, y: 0, maxWidth: gw, size: ks, minSize: ks, maxLines: 8, weight: 500}).box.h}));
  const gridRows = [];
  for (let k = 0; k < cells.length; k += cols) gridRows.push(cells.slice(k, k + cols));
  const gridH = hidden ? 0 : gridRows.reduce((a, rw) => a + Math.max(...rw.map(c => c.h)), 0) + (gridRows.length - 1) * 12;
  L.grid = {cells, cols, gw, gridRows, gridH, footText};

  const bottom = D.h - M;
  const rest = 16 + stripH + (gridH ? 16 + gridH : 0);
  const avail = stacked ? (bottom - top - 2 * (headH + 10) - gapV - rest) / 2 : bottom - top - headH - 10 - rest;
  const stageH = Math.min(avail, bw * (stacked ? 0.72 : 1.0));
  if (stageH < bw * (shape === 'landscape' ? (cpx > 17 ? 0.42 : 0.36) : shape === 'square' ? (cpx > 16 ? 0.44 : 0.28) : 0.34) || stageH < 150) return null;
  const used2 = stacked ? 2 * (headH + 10 + stageH) + gapV + rest : headH + 10 + stageH + rest;
  const y0 = top + Math.max(0, (bottom - top - used2) / 2);
  if (stacked) {
    const yb = y0 + headH + 10 + stageH + gapV;
    L.panels = {a: {x: M, y: y0}, b: {x: M, y: yb}};
    L.stage = {a: {x: M, y: y0 + headH + 10}, b: {x: M, y: yb + headH + 10}};
    L.sharedY = yb + headH + 10 + stageH + 16;
  } else {
    L.panels = {a: {x: M, y: y0}, b: {x: M + bw + gap, y: y0}};
    L.stage = {a: {x: M, y: y0 + headH + 10}, b: {x: M + bw + gap, y: y0 + headH + 10}};
    L.sharedY = y0 + headH + 10 + stageH + 16;
  }
  L.gridY = L.sharedY + stripH + 16;
  L.stageH = stageH;
  // notes object for semantics (issue / assumptions / key are drawn in the grid)
  L.N = {issueBox: p.issues.length ? {} : null, footText};
  // --- the two boards (identical geometry, shifted)
  const letter = Math.max(ks, 18 * U);
  L.sys = {};
  for (const which of ['a', 'b']) {
    L.sys[which] = compactSystem(ctx, `${which}-`, {x: L.stage[which].x, y: L.stage[which].y, w: bw, h: stageH, show: showK, letterSize: letter, clip: true, startY: L.stage[which].y - bw * 0.1});
  }
  const v = ctx.view;
  L.boardFrac = (bw / U) / (v.width * 1080 / Math.min(v.width, v.height));
  return L;
}

function finish(ctx, L) {
  const va = L.sys.a.valve, vb = L.sys.b.valve;
  L.ringR = va.Lv + va.s * 0.4;
  const ca = va.ports.center, cb = vb.ports.center;
  // along the boards' free top band (above the bells and letter tabs, below the headers), then straight
  // down between the inlets to each valve window: it crosses no tube, card or badge
  L.guideY = L.stage.a.y + Math.max(10, L.stageH * 0.05);
  if (L.arr === 'column') {
    // stacked: along board A's free top band to the right gutter, down the gutter (beside board A and header
    // B, never over them), along board B's free top band, then down to its valve window
    L.guideYB = L.stage.b.y + Math.max(10, L.stageH * 0.05);
    L.guideX = M + L.bw + L.gutter / 2;
    L.guidePath = `M${r(ca.x)} ${r(ca.y - L.ringR)}V${r(L.guideY)}H${r(L.guideX)}V${r(L.guideYB)}H${r(cb.x)}V${r(cb.y - L.ringR)}`;
  } else {
    L.guidePath = `M${r(ca.x)} ${r(ca.y - L.ringR)}V${r(L.guideY)}H${r(cb.x)}V${r(cb.y - L.ringR)}`;
  }
  return L;
}

/** Header nodes for one scenario. */
function headerArt(ctx, L, which) {
  const th = ctx.theme;
  const col = acColors(ctx);
  const P = L.panels[which];
  const H = L.heads[which];
  const showK = ctx.show('key'), showA = ctx.show('all');
  const badgeR = L.ks * 0.95;
  const cy = P.y + H.lineH / 2;
  const letter = which === 'a' ? 'A' : 'B';
  const badge = g(null,
    h('circle', {cx: r(P.x + badgeR), cy: r(cy), r: r(badgeR), fill: th.inkSoft, stroke: th.ink, 'stroke-width': 2.2}),
    showK ? h('text', {x: r(P.x + badgeR), y: r(cy + L.ks * 0.36), 'text-anchor': 'middle', 'font-size': r(L.ks), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, letter) : null);
  const lx = P.x + badgeR * 2 + 16;
  const labNode = showK ? g({name: `${which}-label`, opacity: 0}, textBlockOf(H.lab, lx, cy - H.lab.height / 2, th.fg)) : null;
  let capNode = null;
  if (showA && H.cap) {
    capNode = H.inline
      ? g({name: `${which}-caption`, opacity: 0}, textBlockOf(H.cap, lx + H.lab.width + 16, cy - H.cap.height / 2, th.fgSoft))
      : g({name: `${which}-caption`, opacity: 0}, textBlockOf(H.cap, P.x, P.y + H.lineH + 6, th.fgSoft));
  }
  const s = L.sc[which];
  const fy = P.y + H.lineH + H.capBelow + 8;
  const fcN = g({name: `${which}-fact`, opacity: 0}, H.fc.draw(P.x, fy, {name: `${which}-factcard`, fill: th.paper, stroke: th.inkSoft, headColor: th.inkSoft, color: th.ink, radius: 6, accent: s.route ? col.route(s.route) : th.inkFaint}));
  return g(null, badge, labNode, capNode, fcN);
}

function textBlockOf(fit, x, y, fill) {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size), 'font-weight': fit.weight, fill},
    fit.lines.map((line, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight)}, line)));
}

/** The compact strip: rule plaque (left) and the list of conditions / shared facts (right), drawn once. */
function sharedArt(ctx, L) {
  const th = ctx.theme;
  const col = acColors(ctx);
  const S = L.shared;
  const x2 = M + S.halfW + 16, y = L.sharedY;
  const showK = ctx.show('key');
  const rowsN = [];
  let ry = y + S.pad;
  S.rows.forEach((rw, i) => {
    const f = S.rowFits[i];
    const c = rw.key === 'A' ? col.A : rw.key === 'B' ? col.B : th.inkSoft;
    rowsN.push(h('rect', {x: r(x2 + S.pad), y: r(ry + f.size * 0.15), width: r(L.ks * 0.6), height: r(L.ks * 0.6), rx: 3, fill: c, stroke: th.ink, 'stroke-width': 1.5}));
    rowsN.push(showK ? textBlock(f, {x: x2 + S.pad + L.ks * 1.1, y: ry, fill: th.ink, name: `list-${rw.key}`}) : g(null, barLines(x2 + S.pad + L.ks * 1.1, ry, f.width, f.lines.length, f.size, '#c9c2b4')));
    ry += f.height + L.cs * 0.45;
  });
  L.stripBoxes = [{x: M, y, w: S.halfW, h: S.plq.h}, {x: x2, y, w: S.halfW, h: S.listH}];
  return g({name: 'shared-g'},
    S.plq.draw(M, y, 'rule-plaque'),
    h('path', {d: roundRectPath(x2 + 5, y + 7, S.halfW, S.listH, 10), fill: 'rgba(31,35,40,0.13)'}),
    h('path', {d: roundRectPath(x2, y, S.halfW, S.listH, 10), fill: col.brassLight, stroke: col.brassDark, 'stroke-width': 2.4}),
    rowsN);
}

/** Bottom grid: guide caption + changed fact, neutral note, issue, footnote. */
function gridArt(ctx, L) {
  const th = ctx.theme;
  const G = L.grid;
  const out = [];
  let y = L.gridY;
  for (const rw of G.gridRows) {
    rw.forEach((c, k) => {
      const x = M + k * (G.gw + 16);
      if (!ctx.show(c.level)) return;
      const fill = c.name === 'changed' ? '#fff4e6' : c.name === 'issue' ? '#fff8dc' : th.card;
      const stroke = c.name === 'changed' ? th.accent : c.name === 'issue' ? th.accent3 : th.inkSoft;
      const ch = chip(ctx, c.text, {x, y, maxWidth: G.gw, size: L.ks, minSize: L.ks, maxLines: 8, weight: c.name === 'changed' ? 600 : 500, fill, stroke, name: c.name});
      out.push(g({name: `${c.name}-g`, opacity: 0}, ch.node));
    });
    y += Math.max(...rw.map(c => c.h)) + 12;
  }
  return g(null, out);
}

const scene = {
  sizes: {landscape: [1800, 900], square: [1100, 925], portrait: [900, 1400]},
  layout(ctx) {
    let L = null;
    for (const px of PX) { L = compose(ctx, px); if (L) break; }
    if (!L) throw new Error(`${ID}: no composition fits the ${ctx.view.shape} box`);
    return finish(ctx, L);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const board = w => {
      const S = L.sys[w];
      return g({name: `board-${w}`}, S.layers.wall, S.layers.back, S.layers.capsules, S.layers.front, S.layers.lupa, S.layers.doubt,
        h('circle', {name: `${w}-ring`, cx: r(S.valve.ports.center.x), cy: r(S.valve.ports.center.y), r: r(L.ringR), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '10 7', opacity: 0}));
    };
    return g(null,
      board('a'), board('b'),
      headerArt(ctx, L, 'a'), headerArt(ctx, L, 'b'),
      sharedArt(ctx, L),
      h('path', {name: 'guide', d: L.guidePath, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round', opacity: 0}),
      gridArt(ctx, L),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const sem = {};
    const look = {};
    for (const w of ['a', 'b']) {
      const S = L.sys[w];
      const sc = L.sc[w];
      const R = sc.route ? S.routes[sc.route] : null;
      const sends = sc.route && sc.status !== 'pending';
      let s = 0, lid = 0, ball = 0, glow = 0, travel = 0, gate = 0, doubt = 0;
      if (sends) {
        const stop = sc.status === 'disputed' ? R.sGate : R.path.total;
        const enter = ease.inOutCubic(seg(u, ...W.enter));
        const run = sc.status === 'disputed' ? ease.outCubic(seg(u, ...W.travel)) : ease.inOutCubic(seg(u, ...W.travel));
        s = enter * R.sMouth + run * (stop - R.sMouth);
        travel = u < W.enter[0] ? 0 : run >= 1 ? 1 : s / stop;
        lid = clamp(seg(u, W.enter[1] - 0.06, W.enter[1]) - seg(u, W.travel[0] + 0.03, W.travel[0] + 0.08));
        const pass = sc.status === 'supplied' ? clamp((s - (R.sPort - 40)) / 50) : 0;
        ball = (sc.route === 'A' ? 1 : -1) * ease.inOutSine(pass);
        glow = sc.status === 'supplied' ? seg(u, W.travel[1], W.travel[1] + 0.04) : 0;
        gate = sc.status === 'disputed' ? seg(u, W.travel[0] + 0.02, W.travel[0] + 0.1) : 0;
        doubt = sc.status === 'disputed' ? seg(u, W.travel[1], W.travel[1] + 0.05) : 0;
      }
      const anyReached = sc.route && sc.status === 'supplied';
      const lupa = anyReached ? ease.inOutCubic(seg(u, ...W.lupa)) : 0;
      const fr = S.frame({route: sends ? sc.route : null, status: sc.status, travel: sends ? travel : 0, lid, ball, glow, lupa, gate, doubt, capOpacity: sends && u >= W.enter[0] ? 1 : 0});
      Object.assign(nodes, fr.nodes);
      // header label/caption/fact appear when the capsule reaches the bell (the change beat)
      const lab = seg(u, ...W.labels);
      if (ctx.show('key')) nodes[`${w}-label`] = {opacity: r(lab, 3)};
      if (ctx.show('all') && L.heads[w].cap) nodes[`${w}-caption`] = {opacity: r(lab, 3)};
      nodes[`${w}-fact`] = {opacity: r(lab, 3)};
      nodes[`${w}-ring`] = {opacity: r(seg(u, ...W.rings), 3)};
      const origin = {x: L.stage[w].x, y: L.stage[w].y};
      const rel = q => (q ? {x: r(q.x - origin.x), y: r(q.y - origin.y)} : null);
      sem[w] = {route: sc.route, status: sc.status, capState: sends && u >= W.enter[0] ? fr.capState : 'none', cap: sends && u >= W.enter[0] ? rel(fr.capPt) : null, ball: r(ball, 3), glow: r(glow, 3), lid: r(lid, 3), lupa: r(lupa, 3), inTray: fr.capState === 'in-tray', stoppedAtGate: fr.capState === 'stopped-at-gate'};
      sem[`${w}Cap`] = fr.capPt && sends && u >= W.enter[0] ? {x: r(fr.capPt.x), y: r(fr.capPt.y)} : null;
      const vis = Boolean(sends && u >= W.enter[0]);
      look[w] = {cap: vis ? rel(fr.capPt) : null, capVisible: vis, ball: r(ball, 3), glow: r(glow, 3), lid: r(lid, 3), lupa: r(lupa, 3), gate: r(gate, 3), doubt: r(doubt, 3), label: r(lab, 3), ring: r(seg(u, ...W.rings), 3)};
    }
    const gd = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gd, 3)};
    const chips = r(seg(u, ...W.chips), 3);
    const sh = r(seg(u, ...W.shared), 3);
    for (const c of L.grid.cells) if (ctx.show(c.level)) nodes[`${c.name}-g`] = {opacity: c.name === 'changed' || c.name === 'neutral' ? chips : sh};
    nodes['shared-g'] = {opacity: sh};
    const p = ctx.params;
    return {
      nodes,
      semantic: {
        beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
        arrangement: L.arr,
        scenes: 2,
        a: sem.a, b: sem.b,
        aCap: sem.aCap, bCap: sem.bCap,
        lookA: look.a, lookB: look.b,
        sameGeometry: L.sys.a.box.w === L.sys.b.box.w && L.sys.a.box.h === L.sys.b.box.h,
        sentRoute: {a: p.sentRoute.a, b: p.sentRoute.b},
        differs: p.sentRoute.a !== p.sentRoute.b,
        guide: r(gd, 3),
        text: {contentPx: r(L.cs / L.U, 2), keyPx: r(L.ks / L.U, 2), captionPx: r(L.gs / L.U, 2)},
        boardFrac: r(L.boardFrac, 3),
        guideY: r(L.guideY), guideClear: guideClear(L),
        notSent: {A: !L.shared.used.A, B: !L.shared.used.B},
        notes: {issues: L.N.issueBox && ctx.show('all') ? 1 : 0, key: ctx.show('key'), footHasAssumptions: p.assumptions.every(x => L.N.footText.includes(x))},
        outcomeWords: false,
      },
    };
  },
};

/** The guide's horizontal run lies in the boards' free top band: above every bell, tube and letter tab, below the headers. */
function guideClear(L) {
  const ok = (w, y) => {
    const S = L.sys[w];
    // above each bell's mouth (its closed lid) and each letter tab
    return ['A', 'B'].every(k => y < S.routes[k].inlet.mouth.y - 12 && y < S.routes[k].tabBox.y - 6) && y > L.stage[w].y + 2;
  };
  if (L.arr === 'column') {
    // the vertical run lies in the gutter, right of both boards and both headers
    return ok('a', L.guideY) && ok('b', L.guideYB) && L.guideX > M + L.bw + 8 && L.guideX < M + L.bw + L.gutter - 8;
  }
  return ok('a', L.guideY) && ok('b', L.guideY);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-06-contrast',
    title: 'Alternative conditions — the same fact sent by Route A or by Route B reaches the same tray',
    titleEs: 'Condiciones alternativas — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones alternativas',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical pneumatic boards (two inlets, their tubes, a shuttle valve, one receiving tray and a desk magnifier). The single changed fact is the route: in A a capsule enters inlet A, in B inlet B. In parallel, each capsule pushes the valve ball against the opposite seat and lands in the same tray; a dashed guide joins the two valve windows where the only difference rests. The rule, both conditions and the shared facts are drawn once. Neutral note: no ranking, no outcome.',
    tags: ['reasoning', 'alternative conditions', 'contrast', 'either route', 'shuttle valve', 'paired scenes', 'pneumatic tube'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-alternativas.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
