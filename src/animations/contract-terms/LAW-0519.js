/**
 * LAW-0519 — Cláusula de cambio · contrast
 *
 * Storyboard (two identical desks; side by side on wide boxes, one above the other on tall ones):
 *  0.00–0.17  base: each desk — badge "A" / "B" with its supplied caption ("A · Documented change", "B · Informal change")
 *             — shows the same contract card ("CT-517 · Supply contract (fictional)", with the change-clause block), the
 *             same short procedure track (start tray, one small station per supplied step, the rail to the contract) and
 *             the same proposal card "Amendment 1 (fictional)" in the tray. The desks are identical.
 *  0.17–0.35  the one changed fact — the route of the proposal: in A the card enters the track; in B it is lifted out of
 *             the tray and set down beside the contract, off the track.
 *  0.35–0.70  A: at each station the press touches the card's edge and leaves a tab, then the card rises onto the
 *             contract and a clip closes over it. B: the card rests beside the contract; the track stays as it was.
 *             Both cards settle at the same moment.
 *  0.70–1.00  hold: a guide rings where each card ended; the shared step legend; the note "Only the route of the proposal
 *             differs · nothing is concluded about either" and the key "As supplied · no conclusion drawn".
 * Equal weight (same size, stroke and timing in both desks); "informal" stays the supplied neutral caption; no doctrine on
 * the validity or effect of either change; no outcome.
 * @module animations/contract-terms/LAW-0519
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, oneOf, annotation} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, stepsField, proposalField, localizeScene, unitPx, T, fitG, txt,
  contractDoc, clauseBlockH, amendmentSheet, tabSlots, binderClip, trayBack, trayLip, letterBadge, pips, notesStrip, bx,
} from './kits/clausula-cambio.js';

const ID = 'LAW-0519';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.35], consequence: [0.35, 0.7], hold: [0.7, 1]};
const W = {lift: [0.17, 0.22], side: [0.22, 0.4], travel: [0.22, 0.6], up: [0.6, 0.67], clip: [0.66, 0.7], settle: [0.66, 0.7], guide: [0.7, 0.745], note: [0.73, 0.78], key: [0.75, 0.8], ann: [0.76, 0.81]};
const ROUTES = ['procedure', 'beside'];
const STRINGS = {
  en: {...KIT_STRINGS.en, only: 'Only the route of the proposal differs · nothing is concluded about either'},
  es: {...KIT_STRINGS.es, only: 'Solo difiere el recorrido de la propuesta · no se concluye nada sobre ninguno'},
};

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  steps: stepsField,
  proposal: proposalField,
  routeA: oneOf('Route of the proposal in scenario A: procedure (through the supplied steps, then clipped to the contract) or beside (set down beside the contract, off the track)', ROUTES),
  routeB: oneOf('Route of the proposal in scenario B (procedure or beside)', ROUTES),
  scenarioLabels: obj('Scenario captions (comparison labels; neutral, as supplied)', {a: str('Caption of scenario A', 44), b: str('Caption of scenario B', 44)}, ['a', 'b']),
  annotations: list('Editorial callouts shown in the final hold', annotation(['a', 'b']), 0, 2),
};
const defaultParams = {...CONTENT, routeA: 'procedure', routeB: 'beside', scenarioLabels: {a: 'A · Documented change', b: 'B · Informal change'}, annotations: []};
const defaultParamsEs = {...CONTENT_ES, scenarioLabels: {a: 'A · Cambio documentado', b: 'B · Cambio informal'}};

const isStress = p => [p.contract.title, p.clause, p.proposal, ...p.steps, p.scenarioLabels.a, p.scenarioLabels.b].some(t => t.length > 44) || p.annotations.length > 1;

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const side = shape !== 'portrait';
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14, gapS = 34;
  const n = p.steps.length;
  const notes = [];
  if (show) notes.push({name: 'only', kind: 'note0', text: ctx.t.only, fill: ctx.theme.accentSoft});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const ns = notesStrip(ctx, notes, F, minF);
  // shared step legend (drawn once): pips + supplied step text
  const legCols = show ? (side || shape === 'square' ? n : 2) : 0;
  const pipR = clamp(F * 0.3, 6, 9);
  const legW = legCols ? (D.w - pad * 2 - 12 * (legCols - 1)) / legCols : 0;
  const legFits = show ? p.steps.map((s, i) => fitG(s, {maxWidth: legW - 30 - pipR * 2.8 * (i + 1), size: F, minSize: minF, maxLines: 3, weight: 700})) : [];
  const legRows = legCols ? Math.ceil(n / legCols) : 0;
  const legRowH = legFits.length ? Math.max(...legFits.map(f => f.height)) + 20 : 0;
  const legH = legRows ? legRows * legRowH + (legRows - 1) * 10 : 0;
  const bottom = D.h - pad - (ns.nh ? ns.nh + 16 : 0) - (legH ? legH + 16 : 0);
  const avail = {x: pad, y: pad + 6, w: D.w - pad * 2, h: bottom - pad - 6};
  const sc = side
    ? [{x: avail.x, y: avail.y, w: (avail.w - gapS) / 2, h: avail.h}, {x: avail.x + (avail.w + gapS) / 2, y: avail.y, w: (avail.w - gapS) / 2, h: avail.h}]
    : [{x: avail.x, y: avail.y, w: avail.w, h: (avail.h - gapS) / 2}, {x: avail.x, y: avail.y + (avail.h + gapS) / 2, w: avail.w, h: (avail.h - gapS) / 2}];
  const S = sc[0];
  const badgeR = Math.max(F * 0.95, 20);
  const capFits = ['a', 'b'].map(k => fitG(p.scenarioLabels[k], {maxWidth: S.w - badgeR * 2 - 24, size: F, minSize: minF, maxLines: stress ? 2 : 1, weight: 800}));
  const hh = Math.max(badgeR * 2, Math.max(capFits[0].height, capFits[1].height)) + 10;
  const discR = clamp(F * 0.95, 18, 26);
  // board: the contract at the top right (split: clause left, attach spot right; stack on narrow boards: clause above
  // the attach spot), the beside spot at its left, the track below: a bed from the start tray to the right end, with
  // one small station (gantry + press) per step; the card pauses so that the press of station k meets its tab k
  const cHead = clamp(F * 1.05, 22, 30);
  const stackC = S.w < 700;
  const cw = Math.min(S.w * (stackC ? 0.4 : 0.36), 300);
  const propFit = fitG(p.proposal, {maxWidth: cw - 18, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 800});
  const chMin = cHead + 10 + propFit.height + 10;
  const cX = stackC ? cw + 26 : S.w * 0.36, cW = S.w - cX;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: cW - 64, size: F, minSize: minF, maxLines: stress && stackC ? 5 : stress || stackC ? 3 : 2, weight: 800});
  const headH = head.height + 22;
  const clW = stackC ? cW - 32 : cW * 0.5 - 24;
  const clFit = fitG(p.clause, {maxWidth: clW - 18 - discR * 2 - 14 - 12, size: F, minSize: minF, maxLines: stress ? (stackC ? 5 : 4) : 3, weight: 700});
  const clH0 = clauseBlockH(clFit, discR, stackC ? 0 : 0);
  let pressZone = stackC ? 60 : 70;
  const cGap = stackC ? 16 : 22;
  const fixed = hh + 8 + headH + 50 + cGap + pressZone + 26 + (stackC ? clH0 + 14 : 0);
  const chFree = (S.h - fixed) / 2;
  const ch = Math.max(chMin, Math.min(chFree, cw * 0.72));
  if (chFree < chMin) why.push(`card-h:${r(chFree)}/${r(chMin)}`);
  const extra = Math.max(0, S.h - (fixed + 2 * ch) - 12);
  pressZone += Math.min(extra * 0.45, 130);
  const cExtra = Math.min(extra * 0.4, 150);
  const clH = stackC ? clH0 : Math.max(clH0, Math.min(ch, clauseBlockH(clFit, discR, 2)));
  const C = {x: cX, y: hh + 8, w: cW, h: (stackC ? headH + clH + 24 + ch + 36 : headH + Math.max(clH + 4, ch + 30) + 20) + cExtra};
  const clause = {x: 16, y: headH + 12, w: clW, h: clH, fit: clFit};
  const attach = stackC ? {x: C.x + (cW - cw) / 2, y: C.y + headH + 12 + clH + 36 + cExtra * 0.5} : {x: C.x + cW * 0.5 + (cW * 0.5 - cw) / 2, y: C.y + headH + 36 + cExtra * 0.5};
  const besideSpot = {x: Math.max(6, (cX - cw) / 2 - 4), y: attach.y};
  if (besideSpot.x + cw > cX - 8) why.push('beside');
  const trackY = C.y + C.h + cGap;
  const padY = trackY + pressZone;
  const railY = padY + ch + 16;
  if (railY + 10 > S.h + 2) why.push('board-h');
  const edge = 'top';
  const tabs = tabSlots(n, cw, ch, edge, true, true);
  const trayStop = {x: 10, y: padY};
  const step = (S.w - cw - 20) / n;
  const stops = [trayStop, ...Array.from({length: n}, (_, k) => ({x: 10 + (k + 1) * step, y: padY}))];
  const stations = Array.from({length: n}, (_, k) => {
    const st = stops[k + 1], t = tabs[k];
    const hw = t.w + 16, hgt = 44;
    const contact = {x: st.x + t.cx, y: st.y - hgt / 2 + 9};
    return {k, x: contact.x - hw / 2 - 5, w: hw + 10, head: {w: hw, h: hgt}, contact, rest: {x: contact.x, y: trackY + hgt / 2 + 6}};
  });
  if (stations.some(st => st.contact.y - st.rest.y < 16)) why.push('press');
  if (stations[0].x < trayStop.x + cw + 22) why.push('station-over-tray');
  for (let k = 1; k < n; k++) if (stations[k].x < stations[k - 1].x + stations[k - 1].w + 2) why.push('stations');
  const rail = [{x: trayStop.x + cw / 2, y: railY}, {x: Math.min(S.w - 8, stops[n].x + cw + 4), y: railY}, {x: Math.min(S.w - 8, stops[n].x + cw + 4), y: C.y + C.h - 8}];
  const bed = {x: trayStop.x + cw + 18, y: padY - 8, w: stops[n].x + cw + 8 - (trayStop.x + cw + 18), h: ch + 16};
  const railLen = rail.reduce((a, q, i) => (i ? a + Math.hypot(q.x - rail[i - 1].x, q.y - rail[i - 1].y) : 0), 0);
  // legend placement
  let legend = null;
  if (legCols) {
    const y0 = bottom + 16;
    legend = legFits.map((f, i) => ({x: pad + (i % legCols) * (legW + 12), y: y0 + Math.floor(i / legCols) * (legRowH + 10), w: legW, h: legRowH, fit: f, k: i}));
  }
  const {pl, bad} = ns.place();
  if (bad) why.push('note-text');
  [['capA', capFits[0]], ['capB', capFits[1]], ['head', head], ['clause', clFit], ['proposal', propFit], ...legFits.map((f, i) => [`leg${i}`, f])].forEach(([k, f]) => { if (f.bad) why.push(`text-${k}`); });
  return {ok: !why.length, why, F, minF, n, side, bed, edge, sc, badgeR, capFits, hh, discR, cw, ch, cHead, propFit, C, head, headH, clause, attach, besideSpot, trackY, padY, stops, railY, tabs, stations, rail, railLen, legend, pipR, notesPl: pl};
}

const routeOf = (p, P) => (P === 'a' ? p.routeA : p.routeB);

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1600]},
  layout(ctx) {
    const upx = unitPx(ctx);
    const stress = isStress(ctx.params);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [25, 23.5, 22, 21, 20.2]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const show = ctx.show('all');
    const board = (k, P) => {
      const S = L.sc[k];
      const C = L.C;
      const s0 = L.stops[0];
      const railD = L.rail.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
      return g({transform: T(S.x, S.y)},
        letterBadge(ctx, P, L.badgeR, L.badgeR + 2, L.badgeR),
        show ? txt(L.capFits[k], {x: L.badgeR * 2 + 14, y: L.badgeR + 2 - L.capFits[k].height / 2, fill: th.fg}) : null,
        g({transform: T(C.x, C.y)}, contractDoc(ctx, {w: C.w, h: C.h, head: L.head, headH: L.headH, clause: L.clause, attach: null, showText: show, discR: L.discR})),
        // rail + lit overlay
        h('path', {d: railD, fill: 'none', stroke: '#cfc6b4', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        h('path', {name: `${P}-rail`, d: railD, fill: 'none', stroke: th.accent2, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.railLen + 2)} ${r(L.railLen + 30)}`, 'stroke-dashoffset': r(L.railLen + 2)}),
        g({transform: T(s0.x, s0.y)}, trayBack(ctx, L.cw, L.ch)),
        // track bed and stations
        h('path', {d: roundRectPath(L.bed.x, L.bed.y, L.bed.w, L.bed.h, 10), fill: '#f2ede3', stroke: '#c9bfab', 'stroke-width': 2}),
        L.stations.map(st => {
          const gx0 = st.x + 4, gx1 = st.x + st.w - 4;
          return g(null,
            h('path', {d: `M${r(gx0)} ${r(L.trackY)}V${r(L.padY - 12)}M${r(gx1)} ${r(L.trackY)}V${r(L.padY - 12)}`, stroke: '#8a919a', 'stroke-width': 7, 'stroke-linecap': 'round'}),
            h('path', {d: roundRectPath(gx0 - 5, L.trackY - 7, gx1 - gx0 + 10, 15, 5), fill: '#6c747d', stroke: INK, 'stroke-width': 2}),
            h('circle', {cx: r((gx0 + gx1) / 2), cy: r(L.trackY - 16), r: 7, fill: '#d9dde1', stroke: INK, 'stroke-width': 1.4}),
            h('circle', {name: `${P}-lamp${st.k}`, cx: r((gx0 + gx1) / 2), cy: r(L.trackY - 16), r: 7, fill: th.accent2, stroke: INK, 'stroke-width': 1.4, opacity: 0}),
          );
        }),
        // the proposal card
        g({name: `${P}-card`, transform: T(s0.x, s0.y)}, amendmentSheet(ctx, {w: L.cw, h: L.ch, fit: L.propFit, showText: show, name: `${P}-am`, n: L.n, edge: L.edge, headH: L.cHead, sig: false, rev: true, narrow: true})),
        g({transform: T(s0.x, s0.y)}, trayLip(ctx, L.cw, L.ch)),
        // presses (over the card)
        L.stations.map(st => g({name: `${P}-press${st.k}`, transform: T(st.rest.x, st.rest.y)},
          h('path', {d: `M0 ${r(-st.head.h / 2)}V${r(L.trackY - st.rest.y + 2)}`, stroke: '#59616a', 'stroke-width': 6}),
          h('path', {d: roundRectPath(-st.head.w / 2, -st.head.h / 2, st.head.w, st.head.h, 6), fill: '#4a525b', stroke: INK, 'stroke-width': 2}),
          h('path', {d: roundRectPath(-st.head.w / 2 + 4, st.head.h / 2 - 10, st.head.w - 8, 6, 3), fill: th.accent2}),
          pips(st.k + 1, 0, -5, Math.min(L.pipR * 0.8, (st.head.w - 8) / ((st.k + 1) * 2.8 + 0.4) - 0.6), '#ffffff'),
        )),
        g({name: `${P}-clip`, transform: T(L.attach.x + L.cw * 0.16, L.attach.y - 50), opacity: 0}, binderClip(ctx, `${P}-clip-art`, Math.min(54, L.cw * 0.3))),
        h('path', {name: `${P}-guide`, d: roundRectPath(-14, -14, 1, 1, 1), fill: 'none', stroke: th.accent, 'stroke-width': 4.5, opacity: 0}),
      );
    };
    const legend = L.legend ? L.legend.map(c => g(null,
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 10), fill: '#fffdf7', stroke: INK, 'stroke-width': 2}),
      pips(c.k + 1, c.x + 14 + (c.k * L.pipR * 2.8) / 2 + L.pipR, c.y + c.h / 2, L.pipR, th.accent2),
      txt(c.fit, {x: c.x + 24 + L.pipR * 2.8 * (c.k + 1), y: c.y + (c.h - c.fit.height) / 2, fill: INK}),
    )) : [];
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'}, board(0, 'a'), board(1, 'b'), legend, notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const look = {};
    const n = L.n;
    const liftQ = ease.inOutSine(seg(u, ...W.lift));
    ['a', 'b'].forEach(P => {
      const route = routeOf(p, P);
      const s0 = L.stops[0];
      let cp = {x: s0.x, y: s0.y - 16 * liftQ};
      let tabs = 0;
      const presses = [];
      const [t0, t1] = W.travel;
      const d = (t1 - t0) / n;
      for (let k = 0; k < n; k++) {
        const a = t0 + k * d;
        const st = L.stations[k];
        let pq = 0;
        if (route === 'procedure') {
          const mv = ease.inOutCubic(seg(u, a, a + d * 0.5));
          if (u >= a) { const A0 = k ? L.stops[k] : {x: s0.x, y: s0.y - 16}, A1 = L.stops[k + 1]; cp = {x: lerp(A0.x, A1.x, mv), y: lerp(A0.y, A1.y, mv)}; }
          const down = ease.inOutSine(seg(u, a + d * 0.52, a + d * 0.72)), up = ease.inOutSine(seg(u, a + d * 0.74, a + d * 0.94));
          pq = down * (1 - up);
          const on = down >= 1 ? 1 : 0;
          tabs += on;
          nodes[`${P}-am-tab${k}`] = {opacity: on};
          nodes[`${P}-lamp${k}`] = {opacity: r(seg(u, a + d * 0.7, a + d * 0.8), 3)};
        } else {
          nodes[`${P}-am-tab${k}`] = {opacity: 0};
          nodes[`${P}-lamp${k}`] = {opacity: 0};
        }
        const hp = {x: lerp(st.rest.x, st.contact.x, pq), y: lerp(st.rest.y, st.contact.y, pq)};
        nodes[`${P}-press${k}`] = {transform: T(r(hp.x, 2), r(hp.y, 2))};
        presses.push(r(pq, 3));
      }
      let end;
      if (route === 'procedure') {
        const uq = ease.inOutCubic(seg(u, ...W.up));
        if (uq > 0) { const S = L.stops[n]; cp = {x: lerp(S.x, L.attach.x, uq), y: lerp(S.y, L.attach.y, uq)}; }
        end = L.attach;
        nodes[`${P}-rail`] = {'stroke-dashoffset': r((L.railLen + 2) * (1 - ease.inOutSine(seg(u, W.travel[0], W.up[1]))))};
        const cq = ease.outCubic(seg(u, ...W.clip));
        nodes[`${P}-clip`] = {transform: T(r(L.attach.x + L.cw * 0.16, 2), r(L.attach.y - 50 * (1 - cq), 2)), opacity: r(clamp(cq * 3), 3)};
      } else {
        const sq = ease.inOutSine(seg(u, ...W.side));
        if (u >= W.side[0]) { const A0 = {x: s0.x, y: s0.y - 16}; cp = {x: lerp(A0.x, L.besideSpot.x, sq), y: lerp(A0.y, L.besideSpot.y, sq) - Math.sin(sq * Math.PI) * 30}; }
        end = L.besideSpot;
        nodes[`${P}-rail`] = {'stroke-dashoffset': r(L.railLen + 2)};
        nodes[`${P}-clip`] = {transform: T(r(L.attach.x + L.cw * 0.16, 2), r(L.attach.y - 50, 2)), opacity: 0};
      }
      nodes[`${P}-card`] = {transform: T(r(cp.x, 2), r(cp.y, 2))};
      nodes[`${P}-guide`] = {d: roundRectPath(end.x - 14, end.y - 26, L.cw + 28, L.ch + 40, 14), opacity: r(seg(u, ...W.guide), 3)};
      const S = L.sc[P === 'a' ? 0 : 1];
      look[P] = {card: {x: r(cp.x), y: r(cp.y)}, cardW: {x: r(S.x + cp.x + L.cw / 2), y: r(S.y + cp.y + L.ch / 2)}, tabs, presses, route, onContract: Math.abs(cp.x - L.attach.x) < 1 && Math.abs(cp.y - L.attach.y) < 1, beside: Math.abs(cp.x - L.besideSpot.x) < 1 && Math.abs(cp.y - L.besideSpot.y) < 1};
    });
    const noteO = seg(u, ...W.note), keyO = seg(u, ...W.key), annO = seg(u, ...W.ann);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'ann' ? annO : noteO, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.consequence[1] ? 'consequence' : 'hold';
    const before = u < W.lift[0] + (W.side[0] - W.lift[0]);
    const lk = P => (before ? JSON.stringify({card: look[P].card, tabs: look[P].tabs, presses: look[P].presses}) : 'changed');
    return {
      nodes,
      semantic: {
        beat, lookA: lk('a'), lookB: lk('b'), routeA: p.routeA, routeB: p.routeB, steps: n,
        cardA: look.a.cardW, cardB: look.b.cardW, tabsA: look.a.tabs, tabsB: look.b.tabs,
        onContractA: look.a.onContract, onContractB: look.b.onContract, besideA: look.a.beside, besideB: look.b.beside,
        guideShown: r(seg(u, ...W.guide), 3), keyShown: r(keyO, 3), side: L.side,
        sceneA: bx(L.sc[0]), sceneB: bx(L.sc[1]),
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
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
    slug: 'contract-terms-10-contrast',
    title: 'Change clause, procedure only — two identical desks; only the route of the proposal differs: in A the card travels the supplied steps and is clipped to the contract, in B it is set down beside the contract',
    titleEs: 'Cláusula de cambio — Comparación de dos supuestos',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de cambio',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete, identical desks: the contract card with its change clause, a short procedure track (tray, one station per supplied step, rail) and the same proposal card in the tray. One fact differs: the route of the card. A ("Documented change"): it travels the stations, taking one tab at each, and is clipped onto the contract. B ("Informal change"): it is set down beside the contract, off the track. Both settle at the same moment; a guide rings where each card ended; shared step legend; note "Only the route of the proposal differs · nothing is concluded about either"; key "As supplied · no conclusion drawn". No doctrine, no validity or effect, no preference.',
    tags: ['change clause', 'amendment', 'informal change', 'documented change', 'contrast', 'procedure track', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-cambio.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
