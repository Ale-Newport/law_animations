/**
 * LAW-0307 — Declaración experta en audiencia · contrast
 *
 * Storyboard (two complete copies of the same generic hearing room seen from
 * above — same participants, specialist, board, exhibit cabinet, chart,
 * reference and configured sequence — side by side on wide frames, one above
 * the other on tall ones; the shared facts are drawn once, in one panel):
 *  0.00–0.17  base: both rooms identical and at rest (the chart on its exhibit
 *             in both).
 *  0.17–0.40  the ONE supplied difference is introduced in both rooms at the
 *             same time and in the same place, the card's place on the board:
 *             in B a ◆ marks it (an interpretation is supplied there); in A it
 *             stays plain. Each header names its state: A ● "measurement", B ◆
 *             "the specialist's interpretation".
 *  0.40–0.77  the same action runs in parallel in both rooms: the specialist
 *             points, the chart travels to the board and settles with its
 *             reference. Only in B is a span marked, does the specialist raise a
 *             hand again, does the explanation card come out of it and is a
 *             connector drawn from the span to the card — a different object,
 *             gesture and relation; in A the card's place stays empty.
 *  0.77–1.00  a guide links the empty place in A with the connected card in B
 *             through free channels; neutral note and key. No winner, score,
 *             right or wrong, rule, weight or outcome.
 * @module animations/hearings/LAW-0307
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
import {measureRowM} from './kits/interrogatorio-directo.js';
import {dxFields, DX_EN, DX_ES, resolveDx, dxRowNode, dxRoom, dxTiming, dxStageAt, composeDx} from './kits/declaracion-experta.js';

const ID = 'LAW-0307';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {tags: [0.2, 0.26], fact: [0.22, 0.28], action: [0.4, 0.75], guide: [0.78, 0.85], guideRow: [0.8, 0.84]};

const OWN_EN = {
  scenarioA: {label: 'Measurement (as supplied)'},
  scenarioB: {label: 'Specialist\'s interpretation (as supplied)'},
  changedFact: 'Only the specialist\'s interpretation differs',
  sharedFacts: [],
  comparisonLabels: {guide: 'The one supplied difference', neutral: 'Neither room is preferred'},
};
const OWN_ES = {
  scenarioA: {label: 'Medición'},
  scenarioB: {label: 'Interpretación del especialista'},
  changedFact: 'Solo cambia la interpretación del especialista',
  sharedFacts: [],
  comparisonLabels: {guide: 'La única diferencia aportada', neutral: 'Ninguna sala se prefiere'},
};
// (the two supplied states are the A / B headers here)
const {states: _s, ...CAT} = dxFields;
const {states: _e, ...CAT_EN} = DX_EN;
const {states: _x, ...CAT_ES} = DX_ES;
const EN = {...CAT_EN, ...OWN_EN};
const ES = {...CAT_ES, ...OWN_ES};

const sceneSchema = {
  ...CAT,
  scenarioA: obj('Scenario A: the measurement (● the chart) shown, no interpretation supplied, with an optional one-line caption', {label: str('State of A (as supplied)', 50), caption: str('Optional one-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B: the measurement shown and the specialist\'s interpretation (◆) connected to its span, with an optional one-line caption', {label: str('State of B (as supplied)', 50), caption: str('Optional one-line description of B', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 130),
  sharedFacts: list('Facts that stay identical in both rooms (drawn once)', str('Shared fact', 80), 0, 3),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide linking the changed place', 70), neutral: str('Neutral note (nothing follows from the difference)', 120)}),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    const P = {...P0, states: {measurement: P0.scenarioA.label, interpretation: P0.scenarioB.label}};
    const R = resolveDx(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    // ---- shared panel rows (drawn once): the reference and the explanation's caption are listed here, not in the rooms
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
      rows.push({kind: 'legend', glyphKind: 'page', text: R.items[R.docI].text, name: 'lg-reference'});
      rows.push({kind: 'legend', glyphKind: 'frame', text: R.items[R.detI].text, name: 'lg-span'});
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
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
    // ---- headers (A / B): lane disc + the state's cue + label (and caption), at a room's width
    const headerFor = (F, w) => {
      if (!showKey) return {h: 0, fits: null};
      const disc = F * 0.8;
      const fits = ['scenarioA', 'scenarioB'].map(k => fitG(P[k].caption ? `${P[k].label}: ${P[k].caption}` : P[k].label, {maxWidth: Math.max(80, w - disc * 2 - F * 1.6), size: F, minSize: F, maxLines: 4, weight: 500}));
      const hh = Math.max(disc * 2, ...fits.map(f => f.height)) + F * 0.3;
      return {h: hh, fits, disc};
    };
    // ---- one candidate: rooms area (for the pair), arrangement, size, room scale
    const compose = (area, arr, F, scale) => {
      const chan = 28, side = arr === 'row' ? 0 : 40;
      const rgap = arr === 'row' && shape === 'square' ? 2 : gap;
      const roomsW = arr === 'row' ? (area.w - rgap) / 2 : area.w - side;
      const hd = headerFor(F, roomsW);
      const roomH = arr === 'row' ? area.h - hd.h - chan : (area.h - 2 * (hd.h + chan) - gap) / 2;
      const box = {x: area.x, y: area.y + hd.h + chan, w: roomsW, h: roomH};
      // (the rooms carry no text: their plates show placeholder lines; every text is in the shared panel, once)
      const C = composeDx(ctx, P, R, box, F, {scale, chips: false, text: false, align: {x: 0.5, y: arr === 'row' ? 0 : 0.5}});
      const problems = [...C.problems];
      // each room stays a real subject: >= 0.21 of the frame's height
      if (C.planRect.h / frameHD < (shape === 'landscape' ? 0.225 : 0.205)) problems.push('subject-short');
      const G = C.G;
      const shift = arr === 'row' ? {x: roomsW + rgap, y: 0} : {x: 0, y: roomH + hd.h + chan + gap};
      // number badges beside each participant (keyed to the shared panel), placed in A and copied to B
      const badgeR = F * 0.78;
      let badges = [];
      const posOf = i => G.seats[i];
      if (showKey) {
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: C.toD(posOf(sp.index)), rad: C.rad, rim: C.rad * 0.8, prefer: sp.index === R.presenter ? 0 : G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: C.people, boxes: C.equip, ellipse: C.ellipse || {c: {x: -1e5, y: -1e5}, a: 1, b: 1}, anchors: R.speakers.map(sp => C.toD(posOf(sp.index)))});
        badges = res.labels;
        for (const f of res.fails) problems.push(`badge-${f}`);
      }
      return {C, problems, hd, box, shift, roomsW, roomH, chan, side, badges, badgeR, arr, area};
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
            for (const scale of [1, 1.15, 1.3]) {
              const cc = compose(area, A.arr, F, scale);
              const personPx = 100 * cc.C.k * px;
              cc.problems.push(...extra);
              if (personPx < minPerson) cc.problems.push('people-small');
              if (Fpx < minText) cc.problems.push('text-below-baseline');
              const score = -1000 * cc.problems.length + (Fpx >= 19.5 ? 500 : 0) + (personPx >= 55 ? 450 : 0) + Math.min(personPx, 110) + 3 * Fpx;
              log.push(`${Fpx} ${A.arr}/${A.panel}${A.cf || A.cols} s${scale} ${personPx.toFixed(2)} ${cc.problems.join('+')}`);
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
    // the same action and timing in both rooms; in A no interpretation is supplied
    const TM = dxTiming(W.action[0], W.action[1]);
    const roomA = dxRoom(ctx, G, {prefix: 'ra', R, Ft: null, noDetail: true});
    const roomB = dxRoom(ctx, G, {prefix: 'rb', R, Ft: null, zoneMark: true});
    // headers: above each room, left-aligned with it
    const plan = C.planRect;
    const headers = hd.fits ? ['A', 'B'].map((letter, j) => {
      const sx = j ? shift.x : 0, sy = j ? shift.y : 0;
      return {letter, x: plan.x + sx, y: plan.y - best.chan - hd.h + sy, fit: hd.fits[j], disc: hd.disc};
    }) : [];
    // the guide: from the card's place in A (its top edge, at the wall) up into the strip above room A, along it, and down
    // into the card in B; stacked, it runs down the right margin between the two strips
    const zA = C.toD({x: G.zone.x + G.zone.w * 0.5, y: G.board.y});
    const gy = plan.y - best.chan / 2;
    let pts;
    if (arr === 'row') pts = [{x: zA.x, y: zA.y}, {x: zA.x, y: gy}, {x: zA.x + shift.x, y: gy}, {x: zA.x + shift.x, y: zA.y}];
    else {
      const cx = plan.x + plan.w + best.side / 2;
      pts = [{x: zA.x, y: zA.y}, {x: zA.x, y: gy}, {x: cx, y: gy}, {x: cx, y: gy + shift.y}, {x: zA.x, y: gy + shift.y}, {x: zA.x, y: zA.y + shift.y}];
    }
    const guide = polyline(pts);
    return {P, R, F, px, C, G, TM, lay, headers, roomA, roomB, shift, badges, badgeR, arr, guide, pts, log, problems, personPx: best.personPx, showKey};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => dxRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    // (in A the card's place stays empty: a plain outline of it, shown with the guide)
    const z = L.G.zone;
    const empty = h('path', {name: 'ra-empty', opacity: 0, d: roundRectPath(z.x - 6, z.y - 6, z.w + 12, z.h + 12, 10), fill: 'none', stroke: th.inkSoft, 'stroke-width': r(3 / C.k, 2)});
    const badgeNode = (b, name, dx, dy) => g({name},
      h('circle', {cx: r(b.box.x + b.box.w / 2 + dx), cy: r(b.box.y + b.box.h / 2 + dy), r: r(L.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
      h('text', {x: r(b.box.x + b.box.w / 2 + dx), y: r(b.box.y + b.box.h / 2 + dy + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(+b.key.slice(1) + 1)));
    const lanes = [th.accent2, th.accent4];
    return g(null,
      g({name: 'roomA', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.roomA.node, empty),
      g({name: 'roomB', transform: `${T(C.ox + L.shift.x, C.oy + L.shift.y)} scale(${r(C.k, 5)})`}, L.roomB.node),
      L.badges.map(b => [badgeNode(b, `bA${b.key.slice(1)}`, 0, 0), badgeNode(b, `bB${b.key.slice(1)}`, L.shift.x, L.shift.y)]),
      L.headers.map((hd, j) => g({name: `hdr${hd.letter}`},
        h('circle', {cx: r(hd.x + hd.disc), cy: r(hd.y + hd.disc), r: r(hd.disc), fill: lanes[j]}),
        h('text', {x: r(hd.x + hd.disc), y: r(hd.y + hd.disc + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, hd.letter),
        // the state (cue + label) arrives with the introduced difference
        g({name: `hdr${hd.letter}-state`, opacity: 0},
          stateGlyph(ctx, {name: `hdr${hd.letter}-cue`, kind: j ? 'diamond' : 'dot', cx: hd.x + hd.disc * 2 + L.F * 0.55, cy: hd.y + hd.disc, s: L.F * 0.3, fill: th.dark ? th.fg : '#1f2328'}),
          textAt(hd.fit, hd.x + hd.disc * 2 + L.F * 1.1, hd.y + Math.max(0, hd.disc - hd.fit.height / 2), th.fg)))),
      h('path', {name: 'guide', 'data-draw': 1, d: L.guide.d(1), fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.total)} ${r(L.guide.total + 10)}`, 'stroke-dashoffset': r(L.guide.total), opacity: 0}),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C} = L;
    const nodes = {};
    const tags = seg(u, ...W.tags);
    // the same stage in both rooms; only in B is a span marked and the explanation connected
    const sA = dxStageAt(G, R, L.TM, u, {noDetail: true});
    const sB = dxStageAt(G, R, L.TM, u);
    const fa = L.roomA.frame({clockDeg: 36 * clamp(u / 0.8), doc: sA.doc, tag: sA.tag, frame: 0, zoom: 0, cap: 0, reach: sA.reach});
    const fb = L.roomB.frame({clockDeg: 36 * clamp(u / 0.8), doc: sB.doc, tag: sB.tag, frame: sB.frame, zoom: sB.zoom, link: sB.link, cap: sB.cap, reach: sB.reach, zmark: tags});
    Object.assign(nodes, fa.nodes, fb.nodes);
    L.headers.forEach(hd => { nodes[`hdr${hd.letter}-state`] = {opacity: r(tags, 3)}; });
    const guideP = seg(u, ...W.guide);
    nodes.guide = {opacity: guideP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.guide.total * (1 - guideP))};
    nodes['ra-empty'] = {opacity: r(guideP * 0.9, 3)};
    if (L.lay) for (const m of L.lay.rows) {
      if (m.name === 'changed-fact') nodes[m.name] = {opacity: r(seg(u, ...W.fact), 3)};
      if (m.name === 'guide-row') nodes[m.name] = {opacity: r(seg(u, ...W.guideRow), 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    // (the shared action: the chart's travel, its tag and the first pointing; B's second gesture is the contrasted one)
    const look = st => JSON.stringify({d: R2(st.doc), s: r(st.doc.s, 3), ds: st.docState, t: r(st.tag, 3), k: r(st.point, 3)});
    return {
      nodes,
      semantic: {
        beat,
        lookA: look(sA),
        lookB: look(sB),
        explanationA: sA.zoneState,
        explanationB: sB.zoneState,
        spanB: r(sB.frame, 3),
        cardB: r(sB.zoom, 3),
        linkB: r(sB.link, 3),
        captionB: r(sB.cap, 3),
        chartState: sA.docState,
        chartStateB: sB.docState,
        tags: r(tags, 3),
        interpretationMark: r(tags * (1 - clamp(sB.zoom)), 3),
        pointing: r(sA.k, 3),
        pointingB: r(sB.k, 3),
        gestureB: r(sB.gesture, 3),
        guide: r(guideP, 3),
        handA: fa.hands[R.presenter] ? R2(C.toD(fa.hands[R.presenter])) : null,
        handB: fb.hands[R.presenter] ? R2({x: C.toD(fb.hands[R.presenter]).x + L.shift.x, y: C.toD(fb.hands[R.presenter]).y + L.shift.y}) : null,
        allReached: fa.reached && fb.reached,
        forms: R.items.map(it => it.form),
        ops: R.items.map(it => it.op),
        roles: {specialist: R.presenter, listeners: R.listeners},
        measurementI: R.docI,
        interpretationI: R.detI,
        detailShown: true,
        finalState: 'interpretation-connected',
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
    slug: 'hearings-07-contrast',
    title: 'Expert statement at a hearing — the measurement alone and with the specialist\'s interpretation, in two identical rooms',
    titleEs: 'Declaración experta en audiencia — Comparación de dos supuestos',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Declaración experta en audiencia',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical generic hearing rooms. At the same moment one supplied difference is introduced at the card\'s place on the board: in B a ◆ marks that an interpretation is supplied there, in A it stays plain. The same action runs in both: the specialist points and the chart settles on the board with its reference (● measurement). Only in B is a span marked, does the specialist raise a hand again and does the explanation card come out of it, connected to the span (◆ the specialist\'s interpretation); in A the place stays empty. A guide links the two places. Fictional data; no winner, right or wrong, rule, weight or outcome.',
    tags: ['hearing', 'specialist', 'expert statement', 'chart', 'measurement', 'interpretation', 'contrast', 'two rooms', 'display board', 'connector', 'as supplied', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/declaracion-experta.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
