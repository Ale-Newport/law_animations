/**
 * LAW-0287 — Exposición inicial · contrast
 *
 * Storyboard (two complete copies of the same generic hearing room seen from
 * above — same participants, lectern, slips, items, exhibit and configured
 * sequence — side by side on wide frames, one above the other on tall ones;
 * the shared facts are drawn once, in one panel):
 *  0.00–0.17  base: both rooms identical and at rest: the presenter at the
 *             lectern, the folded slips on it, the presentation table empty.
 *  0.17–0.40  the ONE supplied difference is introduced in both rooms at the
 *             same time and in the same place: on each lectern the slip of the
 *             contrasted item gets the cue of its supplied state — in A ● claim
 *             made, in B ◆ support supplied (same size, ink and weight); each
 *             room's header names it.
 *  0.40–0.77  the same laying out runs in parallel in both rooms (same walk,
 *             same order); only the contrasted item differs: in A its card
 *             opens with ● and no link; in B with ◆, and a line links it to the
 *             exhibit it refers to (as supplied) — a different relation.
 *  0.77–1.00  a guide links the two contrasted cards through free channels;
 *             neutral note and key. No winner, score, weight, burden or outcome.
 * @module animations/hearings/LAW-0287
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {localised, pxPerUnit, measureRow, layoutRows, R2, fitG, textAt, placeLabels, FONT} from './kits/apertura-audiencia.js';
import {stateGlyph} from './kits/hearings-art.js';
import {expoFields, EXPO_EN, EXPO_ES, resolveExpo, composeExpo, expoRoom, expoRowNode, expoSchedule, stageAt, CUE_ROW, fitM, measureRowM} from './kits/exposicion-inicial.js';

const ID = 'LAW-0287';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {tags: [0.2, 0.26], fact: [0.22, 0.28], items: [0.4, 0.76], guide: [0.78, 0.85], guideRow: [0.8, 0.84]};

const OWN_EN = {
  scenarioA: {label: 'Claim made', caption: 'the second fact (as supplied)'},
  scenarioB: {label: 'Support supplied', caption: 'the second fact (as supplied)'},
  changedItem: 1,
  changedFact: 'Only the state of the second fact differs: claim made in A, support supplied in B (as supplied)',
  sharedFacts: ['Same room, participants, items, exhibit and order'],
  comparisonLabels: {guide: 'The one supplied difference', neutral: 'No winner, no score, no outcome'},
};
const OWN_ES = {
  scenarioA: {label: 'Afirmación formulada', caption: 'el segundo hecho (según lo aportado)'},
  scenarioB: {label: 'Apoyo aportado', caption: 'el segundo hecho (según lo aportado)'},
  changedItem: 1,
  changedFact: 'Solo cambia el estado del segundo hecho: afirmación formulada en A, apoyo aportado en B (según lo aportado)',
  sharedFacts: ['Misma sala, participantes, elementos, prueba y orden'],
  comparisonLabels: {guide: 'La única diferencia aportada', neutral: 'Sin ganador, sin puntuación, sin desenlace'},
};
const {states: _s, ...CAT} = expoFields;
const {states: _e, ...CAT_EN} = EXPO_EN;
const {states: _x, ...CAT_ES} = EXPO_ES;
const EN = {...CAT_EN, ...OWN_EN};
const ES = {...CAT_ES, ...OWN_ES};

const sceneSchema = {
  ...CAT,
  scenarioA: obj('Scenario A: the state supplied for the contrasted item (● claim made) and a one-line caption', {label: str('State of the contrasted item in A (as supplied)', 50), caption: str('One-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B: the state supplied for the contrasted item (◆ support supplied) and a one-line caption', {label: str('State of the contrasted item in B (as supplied)', 50), caption: str('One-line description of B', 90)}, ['label']),
  changedItem: int('Index in `statements` of the one item whose supplied state differs (a fact; in B it refers to the first exhibit)', 0, 4),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both rooms (drawn once)', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    const P = {...P0, states: {claim: P0.scenarioA.label, support: P0.scenarioB.label}};
    const R = resolveExpo(ctx, P);
    // the contrasted item (a fact): ● claim made in A, ◆ support supplied in B (referring to the first exhibit)
    const c = Math.min(R.items.length - 1, P.changedItem);
    const itemsA = R.items.map(it => (it.i === c ? {...it, kind: 'fact', state: 'claim', exhibit: null} : it));
    const itemsB = R.items.map(it => (it.i === c ? {...it, kind: 'fact', state: 'support', exhibit: R.exhibits.length ? 0 : null} : it));
    const RA = {...R, items: itemsA}, RB = {...R, items: itemsB};
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
      if (R.items.some(it => it.kind === 'question')) rows.push({kind: 'legend', glyphKind: 'question', text: P.labels.question, name: 'lg-question'});
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
      // the items, drawn once: the cards on both tables carry their number
      R.order.forEach((i, j) => rows.push({kind: 'legend', glyphKind: 'itemcard', seqNumber: String(j + 1), text: R.items[i].text, name: `lg-item${i}`}));
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
    // ---- headers (A / B): lane disc + caption, at a room's width
    const headerFor = (F, w) => {
      if (!showKey) return {h: 0, fits: null};
      const disc = F * 0.8;
      // each header: lane disc, the state's cue (● / ◆, equal weight), the supplied state and its caption
      const fits = ['scenarioA', 'scenarioB'].map(k => fitG(`${P[k].label}: ${P[k].caption || ''}`, {maxWidth: Math.max(80, w - disc * 2 - F * 1.6), size: F, minSize: F, maxLines: 4, weight: 500}));
      const hh = Math.max(disc * 2, ...fits.map(f => f.height)) + F * 0.3;
      return {h: hh, fits, disc};
    };
    // ---- one candidate: rooms area (for the pair), arrangement, size, room scale
    const compose = (area, arr, F, scale) => {
      const chan = 28, side = arr === 'row' ? 0 : 40;
      // (side by side in a square frame the two rooms sit closer: their own walls already separate them)
      const rgap = arr === 'row' && shape === 'square' ? 8 : gap;
      const roomsW = arr === 'row' ? (area.w - rgap) / 2 : area.w - side;
      const hd = headerFor(F, roomsW);
      const roomH = arr === 'row' ? area.h - hd.h - chan : (area.h - 2 * (hd.h + chan) - gap) / 2;
      const box = {x: area.x, y: area.y + hd.h + chan, w: roomsW, h: roomH};
      const C = composeExpo(ctx, P, RB, box, F, {scale, chips: false, cardText: showKey, cardLabel: it => String(R.rank[it.i] + 1), align: {x: 0.5, y: arr === 'row' ? 0 : 0.5}});
      const problems = [...C.problems];
      // each room stays a real subject: >= 0.21 of the frame's height
      if (C.planRect.h / frameHD < (shape === 'landscape' ? 0.225 : 0.205)) problems.push('subject-short');
      const G = C.G;
      const shift = arr === 'row' ? {x: roomsW + rgap, y: 0} : {x: 0, y: roomH + hd.h + chan + gap};
      // number badges beside each participant (keyed to the shared panel), placed in A and copied to B
      const badgeR = F * 0.78;
      let badges = [];
      const posOf = i => (i === R.presenter ? G.home : G.seats[i]);
      if (showKey) {
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: C.toD(posOf(sp.index)), rad: C.rad, rim: C.rad * 0.8, prefer: sp.index === R.presenter ? 200 : G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: C.people, boxes: C.equip, ellipse: C.ellipse, anchors: R.speakers.map(sp => C.toD(posOf(sp.index)))});
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
      for (const cols of [2, 3]) arrangements.push({arr: 'row', panel: 'band', cols});
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
          for (const scale of [1, 1.15, 1.3]) {
            const cc = compose(area, A.arr, F, scale);
            const personPx = 100 * cc.C.k * px;
            cc.problems.push(...extra);
            if (personPx < minPerson) cc.problems.push('people-small');
            if (Fpx < minText) cc.problems.push('text-below-baseline');
            // (both standing floors count: text >= 19.5 px and, at 1:1, people >= 55 px — the contrast floor for baselines)
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
    const roomA = expoRoom(ctx, G, {prefix: 'ra', R: RA, Ft: G.Ft, noTether: [c], slipCue: {i: c, kind: 'dot'}});
    const roomB = expoRoom(ctx, G, {prefix: 'rb', R: RB, Ft: G.Ft, slipCue: {i: c, kind: 'diamond'}});
    const S = expoSchedule(G, R, W.items[0], W.items[1]);
    // headers: above each room, left-aligned with it
    const plan = C.planRect;
    const headers = hd.fits ? ['A', 'B'].map((letter, j) => {
      const sx = j ? shift.x : 0, sy = j ? shift.y : 0;
      return {letter, x: plan.x + sx, y: plan.y - best.chan - hd.h + sy, fit: hd.fits[j], disc: hd.disc};
    }) : [];
    // the guide: from card A (top edge, behind the table) up into the strip above room A, along it, and down into
    // card B; stacked, it runs down the right margin between the two strips — never over the rooms' floors
    const sl = G.slots[c];
    const cA = C.toD({x: sl.cx + sl.w * 0.32, y: G.ledge.y});
    const gy = plan.y - best.chan / 2;
    let pts;
    if (arr === 'row') pts = [{x: cA.x, y: cA.y}, {x: cA.x, y: gy}, {x: cA.x + shift.x, y: gy}, {x: cA.x + shift.x, y: cA.y}];
    else {
      const cx = plan.x + plan.w + best.side / 2;
      pts = [{x: cA.x, y: cA.y}, {x: cA.x, y: gy}, {x: cx, y: gy}, {x: cx, y: gy + shift.y}, {x: cA.x, y: gy + shift.y}, {x: cA.x, y: cA.y + shift.y}];
    }
    const guide = polyline(pts);
    return {P, R, RA, RB, c, F, px, C, G, S, lay, headers, roomA, roomB, shift, badges, badgeR, arr, guide, pts, log, problems: best.problems, personPx: best.personPx, showKey};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => expoRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const badgeNode = (b, name, dx, dy) => g({name},
      h('circle', {cx: r(b.box.x + b.box.w / 2 + dx), cy: r(b.box.y + b.box.h / 2 + dy), r: r(L.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
      h('text', {x: r(b.box.x + b.box.w / 2 + dx), y: r(b.box.y + b.box.h / 2 + dy + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(+b.key.slice(1) + 1)));
    const lanes = [th.accent2, th.accent4];
    return g(null,
      g({name: 'roomA', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.roomA.node),
      g({name: 'roomB', transform: `${T(C.ox + L.shift.x, C.oy + L.shift.y)} scale(${r(C.k, 5)})`}, L.roomB.node),
      L.badges.map(b => [badgeNode(b, `bA${b.key.slice(1)}`, 0, 0), badgeNode(b, `bB${b.key.slice(1)}`, L.shift.x, L.shift.y)]),
      L.headers.map((hd, j) => g({name: `hdr${hd.letter}`},
        h('circle', {cx: r(hd.x + hd.disc), cy: r(hd.y + hd.disc), r: r(hd.disc), fill: lanes[j]}),
        h('text', {x: r(hd.x + hd.disc), y: r(hd.y + hd.disc + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, hd.letter),
        // the state (cue + label + caption) arrives with the introduced difference
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
    const st = stageAt(G, R, L.S, u, {reduced: ctx.reduced});
    const tags = seg(u, ...W.tags);
    const common = {clockDeg: 36 * clamp(u / 0.8), presenter: st.presenter, cards: st.cards, slips: st.slips, slipCue: tags};
    const tA = st.tethers.map((v, i) => (i === L.c ? 0 : v));
    const fa = L.roomA.frame({...common, tethers: tA});
    const fb = L.roomB.frame({...common, tethers: st.tethers});
    Object.assign(nodes, fa.nodes, fb.nodes);
    L.headers.forEach(hd => { nodes[`hdr${hd.letter}-state`] = {opacity: r(tags, 3)}; });
    const guideP = seg(u, ...W.guide);
    nodes.guide = {opacity: guideP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.guide.total * (1 - guideP))};
    if (L.lay) for (const m of L.lay.rows) {
      if (m.name === 'changed-fact') nodes[m.name] = {opacity: r(seg(u, ...W.fact), 3)};
      if (m.name === 'guide-row') nodes[m.name] = {opacity: r(seg(u, ...W.guideRow), 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    const ser = (states, teth) => JSON.stringify({s: states, o: R.items.map(it => r(st.cards[it.i].open, 3)), t: R.items.map(it => r(teth[it.i] || 0, 3)), p: R2(st.presenter.pose)});
    const others = R.items.filter(it => it.i !== L.c);
    return {
      nodes,
      semantic: {
        beat,
        lookA: ser(st.states, tA.map((v, i) => (i === L.c ? 0 : v))),
        lookB: ser(st.states, st.tethers.map((v, i) => (i === L.c ? 0 : v))),
        // the contrasted item's link exists only in B
        linkA: 0,
        linkB: L.RB.items[L.c].exhibit !== null ? r(st.tethers[L.c], 3) : 0,
        stateA: L.RA.items[L.c].state,
        stateB: L.RB.items[L.c].state,
        tags: r(tags, 3),
        itemState: R.items.map(it => st.states[it.i]),
        othersSame: others.every(it => L.RA.items[it.i].state === L.RB.items[it.i].state && L.RA.items[it.i].exhibit === L.RB.items[it.i].exhibit),
        guide: r(guideP, 3),
        hand: R2(C.toD(st.hand)),
        active: st.active,
        allReached: fa.reached && fb.reached,
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
    slug: 'hearings-02-contrast',
    title: 'Opening statement — claim made and support supplied compared in two identical rooms',
    titleEs: 'Exposición inicial — Comparación de dos supuestos',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Exposición inicial',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical generic hearing rooms. At the same moment one supplied state is introduced for one item: in A it is a claim made (●), in B support supplied (◆). The same laying out of facts and questions then runs in both rooms; only that item differs — in B its card is linked to the exhibit it refers to (as supplied). A guide links the two cards. No winner, score, weight, burden or outcome.',
    tags: ['hearing', 'opening statement', 'contrast', 'claim made', 'support supplied', 'two rooms', 'lectern', 'presentation table', 'exhibit', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/exposicion-inicial.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
