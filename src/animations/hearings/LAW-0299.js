/**
 * LAW-0299 — Objeción procesal · contrast
 *
 * Storyboard (two complete copies of the same generic hearing room seen from
 * above — same participants, witness box, tray, rail, question, reason card,
 * exhibit and configured sequence — side by side on wide frames, one above the
 * other on tall ones; the shared facts are drawn once, in one panel):
 *  0.00–0.17  base: both rooms identical and at rest.
 *  0.17–0.40  the ONE supplied difference is introduced in both rooms at the
 *             same time and in the same place, in front of the responding
 *             participant at the shared table: in B a response slip (◆) lies
 *             there, as supplied; in A nothing is supplied. Each header names
 *             its state: A ● "intervention raised", B ◆ "response as supplied".
 *  0.40–0.77  the same action runs in parallel in both rooms: the question
 *             slides up the guide, the signal is raised and the question
 *             pauses; the editable reason card travels to the rail and opens.
 *             Only in B does the response card then travel to the rail and
 *             open — a different object and relation; in A its place stays
 *             empty.
 *  0.77–1.00  a guide links the empty place in A with the response card in B
 *             through free channels; neutral note and key. Both questions stay
 *             paused. No grounds, ruling, outcome, winner, score or hierarchy.
 * @module animations/hearings/LAW-0299
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, list, obj} from '../../schemas/fields.js';
import {localised, pxPerUnit, layoutRows, R2, fitG, textAt, placeLabels, FONT} from './kits/apertura-audiencia.js';
import {stateGlyph} from './kits/hearings-art.js';
import {composeIt, itRoom, itSchedule, measureRowM} from './kits/interrogatorio-directo.js';
import {opFields, OP_EN, OP_ES, resolveOp, opRowNode, opProps, opTiming, opStageAt, opFrame, opCorridors, opPaths} from './kits/objecion-procesal.js';

const ID = 'LAW-0299';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {tags: [0.2, 0.26], fact: [0.22, 0.28], question: [0.4, 0.52], items: 0.74, guide: [0.78, 0.85], guideRow: [0.8, 0.84]};

const OWN_EN = {
  scenarioA: {label: 'Intervention raised (as supplied)'},
  scenarioB: {label: 'Response as supplied (illustrative)'},
  changedFact: 'Only the response card differs',
  sharedFacts: [],
  comparisonLabels: {guide: 'The one supplied difference', neutral: 'Neither room is preferred'},
};
const OWN_ES = {
  scenarioA: {label: 'Intervención planteada'},
  scenarioB: {label: 'Respuesta del órgano suministrada'},
  changedFact: 'Solo cambia la tarjeta de respuesta',
  sharedFacts: [],
  comparisonLabels: {guide: 'La única diferencia aportada', neutral: 'Ninguna sala se prefiere'},
  // (a shorter pause caption, questioner label and room name: the shared panel of the pair is narrow at 1:1; the key
  // still says «según lo aportado»)
  labels: {...OP_ES.labels, paused: 'Pregunta en pausa'},
  speakers: [{label: 'Quien pregunta (ficticia)'}, ...OP_ES.speakers.slice(1)],
  hearing: {room: 'Sala 5 (ficticia)'},
};
// (the two supplied states are the A / B headers here)
const {states: _s, ...CAT} = opFields;
const {states: _e, ...CAT_EN} = OP_EN;
const {states: _x, ...CAT_ES} = OP_ES;
const EN = {...CAT_EN, ...OWN_EN};
const ES = {...CAT_ES, ...OWN_ES};

const sceneSchema = {
  ...CAT,
  scenarioA: obj('Scenario A: the intervention raised (●) and no response card supplied, with a one-line caption', {label: str('State of A (as supplied)', 50), caption: str('Optional one-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B: the intervention raised and a response card supplied (◆), with a one-line caption', {label: str('State of B (as supplied)', 50), caption: str('Optional one-line description of B', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 130),
  sharedFacts: list('Facts that stay identical in both rooms (drawn once)', str('Shared fact', 80), 0, 3),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide linking the changed place', 70), neutral: str('Neutral note (nothing follows from the difference)', 120)}),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    const P = {...P0, states: {intervention: P0.scenarioA.label, response: P0.scenarioB.label}};
    const R = resolveOp(ctx, P);
    // the contrasted place: the response card (supplied in B only); without one there is nothing to contrast
    const c = R.resI;
    const nq = R.order.filter(i => i !== R.qI);
    const num = i => nq.indexOf(i) + 1;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    // ---- shared panel rows (drawn once)
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
      // (● / ◆ are named, with the same glyph, in the A / B headers)
      if (R.intI !== null) rows.push({kind: 'legend', glyphKind: 'signal', text: P.labels.signal, name: 'lg-signal'});
      if (R.qI !== null) rows.push({kind: 'legend', glyphKind: 'pause', text: `${P.labels.paused}: “${R.items[R.qI].text}”`, name: 'lg-paused'});
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
      // the supplied cards, drawn once; the cards on both rails carry their number
      nq.forEach(i => rows.push({kind: 'legend', glyphKind: 'turncard', seqNumber: String(num(i)), text: R.items[i].text, name: `lg-item${i}`}));
    }
    if (showAll) {
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      P.sharedFacts.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'same', text: tx, name: `shared${i}`}));
    }
    if (showKey) rows.push({kind: 'text', bold: true, text: P.changedFact, name: 'changed-fact'});
    if (showAll) rows.push({kind: 'legend', glyphKind: 'guide', text: P.comparisonLabels.guide, name: 'guide-row'});
    if (showAll) rows.push({kind: 'text', text: P.comparisonLabels.neutral, name: 'neutral'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const gap = 30;
    const frameHD = ctx.view.height / fitDesign(ctx.view, D.w, D.h).scale;
    // ---- headers (A / B): lane disc + the state's cue + label and caption, at a room's width
    const headerFor = (F, w) => {
      if (!showKey) return {h: 0, fits: null};
      const disc = F * 0.8;
      const fits = ['scenarioA', 'scenarioB'].map(k => fitG(P[k].caption ? `${P[k].label}: ${P[k].caption}` : P[k].label, {maxWidth: Math.max(80, w - disc * 2 - F * 1.6), size: F, minSize: F, maxLines: 4, weight: 500}));
      const hh = Math.max(disc * 2, ...fits.map(f => f.height)) + F * 0.3;
      return {h: hh, fits, disc};
    };
    // ---- one candidate: rooms area (for the pair), arrangement, size, room scale
    const compose = (area, arr, F, scale, noBeside = false, qDrop = 40) => {
      const chan = 28, side = arr === 'row' ? 0 : 40;
      const rgap = arr === 'row' && shape === 'square' ? 2 : gap;
      const roomsW = arr === 'row' ? (area.w - rgap) / 2 : area.w - side;
      const hd = headerFor(F, roomsW);
      const roomH = arr === 'row' ? area.h - hd.h - chan : (area.h - 2 * (hd.h + chan) - gap) / 2;
      const box = {x: area.x, y: area.y + hd.h + chan, w: roomsW, h: roomH};
      const C = composeIt(ctx, P, R, box, F, {scale, chips: false, cardText: showKey, cardLabel: it => (it.i === R.qI ? '' : String(num(it.i))), noExTag: true, trayDrop: qDrop, noBeside, align: {x: 0.5, y: arr === 'row' ? 0 : 0.5}});
      const problems = [...C.problems];
      // each room stays a real subject: >= 0.21 of the frame's height
      if (C.planRect.h / frameHD < (shape === 'landscape' ? 0.225 : 0.205)) problems.push('subject-short');
      const G = C.G;
      const shift = arr === 'row' ? {x: roomsW + rgap, y: 0} : {x: 0, y: roomH + hd.h + chan + gap};
      // number badges beside each participant (keyed to the shared panel), placed in A and copied to B
      const badgeR = F * 0.78;
      let badges = [];
      const posOf = i => (i === R.questioner ? G.qHome : G.seats[i]);
      // (the floor the supplied cards travel over stays free of badges; the questioner's badge may stand a little further
      // out, since that floor runs beside the questioner)
      const corr = opCorridors(G, R, {mode: 'wall'});
      if (showKey) {
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: C.toD(posOf(sp.index)), rad: C.rad, rim: C.rad * 0.8, prefer: sp.index === R.questioner ? 200 : sp.index === R.witness ? 90 : G.seats[sp.index].angle, ...(sp.index === R.witness ? {maxGap: 72, gaps: [4, 12, 24, 36, 48, 60, 72]} : sp.index === R.questioner ? {maxGap: 56, gaps: [4, 8, 12, 16, 24, 34, 44, 56]} : {maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})})),
          {bounds: C.bounds, circles: C.people, boxes: [...C.equip, ...corr.boxes.map(C.bD)], ellipse: C.ellipse || {c: {x: -1e5, y: -1e5}, a: 1, b: 1}, anchors: R.speakers.map(sp => C.toD(posOf(sp.index)))});
        badges = res.labels;
        for (const f of res.fails) problems.push(`badge-${f}`);
      }
      // the supplied cards must find a clear route among the people, the equipment and the badges
      const avoid = badges.map(b => ({x: (b.box.x - C.ox) / C.k, y: (b.box.y - C.oy) / C.k, w: b.box.w / C.k, h: b.box.h / C.k}));
      if (!Object.values(opPaths(G, R, avoid, corr.hints)).every(q => q.clear)) problems.push('route-blocked');
      return {C, problems, hd, box, shift, roomsW, roomH, chan, side, badges, badgeR, arr, area, avoid, hints: corr.hints};
    };
    const arrangements = [];
    if (shape === 'landscape') {
      for (const cf of [0.22, 0.26, 0.3]) arrangements.push({arr: 'row', panel: 'column', cf});
      for (const cols of [3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
    } else if (shape === 'portrait') {
      for (const cols of [2, 3]) arrangements.push({arr: 'col', panel: 'band', cols});
    } else {
      for (const cols of [2, 3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
      for (const cf of [0.3, 0.36, 0.42]) arrangements.push({arr: 'col', panel: 'column', cf});
    }
    let best = null;
    const log = [];
    // standing people floors: >= 60 px; 1:1 contrast >= 55 px for every preset (composed to 57 for margin). Only when
    // no 1:1 composition reaches it (the long-labels stress load) does the stress floor of 45 px apply.
    // (passes in order: 57 px people with >= 19.5 px text, 55 px with >= 19.5 px text, 55 px, then the 45 px stress floor)
    const floors = shape === 'square' ? [[57, 19.5], [55.3, 19.5], [55.3, 0], [45, 0]] : [[61, 0]];
    for (const [minPerson, minText] of floors) {
      if (best && !best.problems.length) break;
      best = null;
      for (const force of [false, true]) {
        if (best) break;
        for (const Fpx of (force ? [16.4] : [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4])) {
          const F = Fpx / px;
          let good = false;
          for (const A of arrangements) {
            let lay = null, area = {x: 0, y: 0, w: D.w, h: D.h};
            const extra = [];
            if (rows.length) {
              if (A.panel === 'column') {
                const pw = D.w * A.cf;
                const ms = rows.map(rw => measureRowM(rw, F, pw));
                const probe = layoutRows(ms, {x: 0, y: 0, w: pw, h: 1e6}, F, 1, 28);
                if (!probe.ok || probe.usedH > D.h) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: D.w - pw, y: Math.max(0, (D.h - probe.usedH) / 2), w: pw, h: probe.usedH};
                lay = layoutRows(ms, panelBox, F, 1, 28);
                area = {x: 0, y: 0, w: D.w - pw - gap, h: D.h};
              } else {
                const colW = (D.w - 28 * (A.cols - 1)) / A.cols;
                const ms = rows.map(rw => measureRowM(rw, F, colW));
                const probe = layoutRows(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, A.cols, 28);
                if (!probe.ok || probe.usedH > D.h * 0.45) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
                lay = layoutRows(ms, panelBox, F, A.cols, 28);
                area = {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap};
              }
            }
            // (the shared table beside the questioner, or below the witness box: a narrower, taller room; the tray and the
            // questioner a little lower — clear of the cards' lane under the rail — or not)
            for (const [scale, nb, qd] of [[1, false, 40], [1, false, 20], [1, false, 0], [1.15, false, 40], [1.3, false, 40], [1, true, 40], [1.15, true, 40]]) {
              const cc = compose(area, A.arr, F, scale, nb, qd);
              const personPx = 100 * cc.C.k * px;
              cc.problems.push(...extra);
              if (personPx < minPerson) cc.problems.push('people-small');
              if (Fpx < minText) cc.problems.push('text-below-baseline');
              const score = -1000 * cc.problems.length + (Fpx >= 19.5 ? 500 : 0) + (personPx >= 55 ? 450 : 0) + Math.min(personPx, 110) + 3 * Fpx;
              log.push(`${Fpx} ${A.arr}/${A.panel}${A.cf || A.cols} s${scale}${nb ? 'N' : ''}${qd === 40 ? '' : 'q' + qd} ${personPx.toFixed(2)} ${cc.problems.join('+')}`);
              const cand = {...cc, F, lay, score, personPx, A};
              if (!best || score > best.score) best = cand;
              if (!cc.problems.length && personPx >= 70 && Fpx >= 19.5) good = true;
              if (!cc.problems.length) break;
            }
          }
          if (good) break;
        }
      }
    }
    const {C, F, lay, hd, shift, badges, badgeR, arr} = best;
    const G = C.G;
    const problems = [...best.problems];
    if (c === null) problems.push('no-response-card');
    // the same question choreography and the same timing in both rooms; in A the response card is not supplied
    const S = itSchedule(G, {...R, order: R.qI !== null ? [R.qI] : []}, W.question[0], W.question[1]);
    const TMB = opTiming(G, R, S, W.items, {avoid: best.avoid, hints: best.hints});
    const TMA = {...TMB, res: null};
    const routesClear = Object.values(TMB.paths).every(q => q.clear);
    const roomA = itRoom(ctx, G, {prefix: 'ra', R, Ft: G.Ft});
    const roomB = itRoom(ctx, G, {prefix: 'rb', R, Ft: G.Ft, slipCue: c !== null ? {i: c, kind: 'diamond'} : null});
    const propsA = opProps(ctx, 'ra'), propsB = opProps(ctx, 'rb');
    // headers: above each room, left-aligned with it
    const plan = C.planRect;
    const headers = hd.fits ? ['A', 'B'].map((letter, j) => {
      const sx = j ? shift.x : 0, sy = j ? shift.y : 0;
      return {letter, x: plan.x + sx, y: plan.y - best.chan - hd.h + sy, fit: hd.fits[j], disc: hd.disc};
    }) : [];
    // the guide: from the response card's place in A (top edge, behind the rail) up into the strip above room A, along
    // it, and down into the response card in B; stacked, it runs down the right margin between the two strips
    let guide = null, pts = [];
    if (c !== null) {
      const sl = G.slots[c];
      const cA = C.toD({x: sl.cx + sl.w * 0.32, y: G.ledge.y});
      const gy = plan.y - best.chan / 2;
      if (arr === 'row') pts = [{x: cA.x, y: cA.y}, {x: cA.x, y: gy}, {x: cA.x + shift.x, y: gy}, {x: cA.x + shift.x, y: cA.y}];
      else {
        const cx = plan.x + plan.w + best.side / 2;
        pts = [{x: cA.x, y: cA.y}, {x: cA.x, y: gy}, {x: cx, y: gy}, {x: cx, y: gy + shift.y}, {x: cA.x, y: gy + shift.y}, {x: cA.x, y: cA.y + shift.y}];
      }
      guide = polyline(pts);
    }
    return {P, R, c, F, px, C, G, S, TMA, TMB, routesClear, lay, headers, roomA, roomB, propsA, propsB, shift, badges, badgeR, arr, guide, pts, log, problems, personPx: best.personPx, showKey, num};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => opRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    // (in A the response card's place stays empty: a plain outline of its place, shown with the guide)
    const empty = L.c !== null ? (() => { const s = L.G.slots[L.c]; return h('path', {name: 'ra-empty', opacity: 0, d: roundRectPath(s.x, s.y, s.w, s.h, 8), fill: 'none', stroke: th.inkSoft, 'stroke-width': r(3 / C.k, 2)}); })() : null;
    const badgeNode = (b, name, dx, dy) => g({name},
      h('circle', {cx: r(b.box.x + b.box.w / 2 + dx), cy: r(b.box.y + b.box.h / 2 + dy), r: r(L.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
      h('text', {x: r(b.box.x + b.box.w / 2 + dx), y: r(b.box.y + b.box.h / 2 + dy + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(+b.key.slice(1) + 1)));
    const lanes = [th.accent2, th.accent4];
    return g(null,
      g({name: 'roomA', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.roomA.node, L.propsA.node, empty),
      g({name: 'roomB', transform: `${T(C.ox + L.shift.x, C.oy + L.shift.y)} scale(${r(C.k, 5)})`}, L.roomB.node, L.propsB.node),
      L.badges.map(b => [badgeNode(b, `bA${b.key.slice(1)}`, 0, 0), badgeNode(b, `bB${b.key.slice(1)}`, L.shift.x, L.shift.y)]),
      L.headers.map((hd, j) => g({name: `hdr${hd.letter}`},
        h('circle', {cx: r(hd.x + hd.disc), cy: r(hd.y + hd.disc), r: r(hd.disc), fill: lanes[j]}),
        h('text', {x: r(hd.x + hd.disc), y: r(hd.y + hd.disc + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, hd.letter),
        // the state (cue + label + caption) arrives with the introduced difference
        g({name: `hdr${hd.letter}-state`, opacity: 0},
          stateGlyph(ctx, {name: `hdr${hd.letter}-cue`, kind: j ? 'diamond' : 'dot', cx: hd.x + hd.disc * 2 + L.F * 0.55, cy: hd.y + hd.disc, s: L.F * 0.3, fill: th.dark ? th.fg : '#1f2328'}),
          textAt(hd.fit, hd.x + hd.disc * 2 + L.F * 1.1, hd.y + Math.max(0, hd.disc - hd.fit.height / 2), th.fg)))),
      L.guide ? h('path', {name: 'guide', 'data-draw': 1, d: L.guide.d(1), fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.total)} ${r(L.guide.total + 10)}`, 'stroke-dashoffset': r(L.guide.total), opacity: 0}) : null,
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C} = L;
    const nodes = {};
    const tags = seg(u, ...W.tags);
    // the same stage in both rooms; in B the response slip lies in front of the responder from the introduced difference
    const sA = opStageAt(G, R, L.S, L.TMA, u);
    const sB = opStageAt(G, R, L.S, L.TMB, u, {waitFrom: W.tags[0]});
    const fa = L.roomA.frame({clockDeg: 36 * clamp(u / 0.8), q: sA.q, w: sA.w, cards: sA.cards, slips: sA.slips});
    const fb = L.roomB.frame({clockDeg: 36 * clamp(u / 0.8), q: sB.q, w: sB.w, cards: sB.cards, slips: sB.slips, slipCue: tags});
    Object.assign(nodes, fa.nodes, fb.nodes);
    const oa = opFrame(G, R, sA, 'ra'), ob = opFrame(G, R, sB, 'rb');
    Object.assign(nodes, oa.nodes, ob.nodes);
    L.headers.forEach(hd => { nodes[`hdr${hd.letter}-state`] = {opacity: r(tags, 3)}; });
    const guideP = L.guide ? seg(u, ...W.guide) : 0;
    if (L.guide) nodes.guide = {opacity: guideP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.guide.total * (1 - guideP))};
    if (L.c !== null) nodes['ra-empty'] = {opacity: r(seg(u, ...W.guide) * 0.9, 3)};
    if (L.lay) for (const m of L.lay.rows) {
      if (m.name === 'changed-fact') nodes[m.name] = {opacity: r(seg(u, ...W.fact), 3)};
      if (m.name === 'guide-row') nodes[m.name] = {opacity: r(seg(u, ...W.guideRow), 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    const others = R.items.filter(it => it.i !== L.c);
    const ser = st => JSON.stringify({s: others.map(it => st.states[it.i]), o: others.map(it => r(st.cards[it.i].open, 3)), p: st.paused, g: r(st.sigK, 3)});
    return {
      nodes,
      semantic: {
        beat,
        lookA: ser(sA),
        lookB: ser(sB),
        changed: L.c,
        stateA: L.c !== null ? sA.states[L.c] : null,
        stateB: L.c !== null ? sB.states[L.c] : null,
        tags: r(tags, 3),
        itemState: R.items.map(it => sA.states[it.i]),
        itemStateB: R.items.map(it => sB.states[it.i]),
        open: R.items.map(it => r(sA.cards[it.i].open, 3)),
        openB: R.items.map(it => r(sB.cards[it.i].open, 3)),
        textShown: R.items.map(it => r(sA.cards[it.i].text, 3)),
        textShownB: R.items.map(it => r(sB.cards[it.i].text, 3)),
        forms: R.items.map(it => it.form),
        ops: R.items.map(it => it.op),
        roles: {questioner: R.questioner, witness: R.witness, raiser: R.raiser, responder: R.responder},
        qI: R.qI,
        intI: R.intI,
        resI: R.resI,
        paused: sA.paused,
        pausedB: sB.paused,
        signal: r(sA.sigK, 3),
        signalB: r(sB.sigK, 3),
        pauseU: r(L.TMB.pauseU, 4),
        rank: R.rank,
        guide: r(guideP, 3),
        handQA: R2(C.toD(sA.handQ)),
        handQB: R2(C.toD(sB.handQ)),
        allReached: fa.reached && fb.reached && oa.reached && ob.reached,
        routesClear: L.routesClear,
        railXA: R.items.map(it => r(C.toD({x: G.slots[it.i].cx, y: 0}).x, 2)),
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        arrangement: L.arr,
        order: R.order.join('>'),
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
    slug: 'hearings-05-contrast',
    title: 'Procedural objection — an intervention raised, with and without a supplied response card, in two identical rooms',
    titleEs: 'Objeción procesal — Comparación de dos supuestos',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Objeción procesal',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical generic hearing rooms. At the same moment one supplied difference is introduced in front of the responding participant: in B a response slip (◆ as supplied) lies there, in A nothing is supplied. The same action then runs in both rooms: the question pauses when the signal is raised and the editable reason card (● intervention raised, as supplied) reaches the rail; only in B does the response card follow and open, in A its place stays empty. A guide links the two places. Both questions stay paused. No grounds, ruling, outcome, winner, score or hierarchy.',
    tags: ['hearing', 'intervention', 'contrast', 'two rooms', 'signal', 'paused question', 'reason card', 'response card', 'as supplied', 'witness box', 'turn rail', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/objecion-procesal.js', 'src/animations/hearings/kits/interrogatorio-directo.js', 'src/animations/hearings/kits/exposicion-inicial.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
