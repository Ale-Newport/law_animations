/**
 * LAW-0283 — Apertura de audiencia · contrast
 *
 * Storyboard (two complete copies of the same generic hearing room seen from
 * above — same participants, cards, exhibit, statement and configured
 * sequence — side by side on wide frames, one above the other on tall ones;
 * the shared facts are drawn once, in one panel):
 *  0.00–0.17  base: both rooms identical and at rest: lights off, the wall
 *             display blank, the switch lever in the middle, the name cards in
 *             the tray. Participants carry a number badge (the configured
 *             sequence) keyed to the shared panel.
 *  0.17–0.40  the ONE supplied difference is introduced in both rooms at the
 *             same time and in the same place: in A the switch goes to ● and
 *             the display shows the supplied started state (solid frame); in B
 *             the switch goes to ◆ and the display shows the supplied pending
 *             state (dashed frame: pending only). A's power line carries its
 *             pulse and A's lamps come on (the activation); B's room waits.
 *  0.40–0.77  the same hand-over runs in parallel in both rooms: in the
 *             configured sequence each participant takes their card and sets it
 *             upright. Only the contrasted circumstance differs.
 *  0.77–1.00  a guide links the two displays (the detail that differs) through
 *             a free channel; neutral note and key. No winner, score or legal
 *             consequence of "pending" (only a waiting state of this example).
 * @module animations/hearings/LAW-0283
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {polyline} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {
  aperturaFields, APERTURA_EN, APERTURA_ES, localised, resolveApertura, pxPerUnit, composeRoom, hearingRoom, cardAt,
  measureRow, layoutRows, rowNode, R2, fitG, textAt, placeLabels, FONT,
} from './kits/apertura-audiencia.js';

const ID = 'LAW-0283';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  switch: [0.18, 0.22], text: [0.22, 0.26], fact: [0.2, 0.25], pulse: [0.24, 0.32], lamps: [0.27, 0.36],
  cards: [0.4, 0.75], guide: [0.77, 0.84], guideRow: [0.79, 0.83],
};
const CARD_WIN = 0.15;

const {session: _s, ...CAT} = aperturaFields;
const {session: _e, ...CAT_EN} = APERTURA_EN;
const {session: _x, ...CAT_ES} = APERTURA_ES;
const OWN_EN = {
  scenarioA: {label: 'Session started', caption: 'The room is activated (as supplied)'},
  scenarioB: {label: 'Session pending', caption: 'The room waits to be activated (as supplied)'},
  changedFact: 'Only the session state differs: started in A, pending in B (as supplied)',
  sharedFacts: ['Same room, same participants and name cards', 'Same exhibit, statement and sequence'],
  comparisonLabels: {guide: 'The one supplied difference', neutral: 'No winner, no score, no outcome'},
};
const OWN_ES = {
  scenarioA: {label: 'Sesión iniciada', caption: 'La sala se activa (según lo aportado)'},
  scenarioB: {label: 'Sesión pendiente', caption: 'La sala espera a activarse (según lo aportado)'},
  changedFact: 'Solo cambia el estado de la sesión: iniciada en A, pendiente en B (según lo aportado)',
  sharedFacts: ['Misma sala, mismos participantes y tarjetas', 'Misma prueba, declaración y secuencia'],
  comparisonLabels: {guide: 'La única diferencia aportada', neutral: 'Sin ganador, sin puntuación, sin desenlace'},
};
const EN = {...CAT_EN, ...OWN_EN};
const ES = {...CAT_ES, ...OWN_ES};

const sceneSchema = {
  ...CAT,
  scenarioA: obj('Scenario A: its supplied session state (shown on room A’s display) and a one-line caption', {label: str('State shown on the display in A (as supplied)', 50), caption: str('One-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B: its supplied session state (shown on room B’s display) and a one-line caption; pending is only a waiting state', {label: str('State shown on the display in B (as supplied)', 50), caption: str('One-line description of B', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both rooms (drawn once)', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    const P = {...P0, session: {started: P0.scenarioA.label, pending: P0.scenarioB.label}};
    const R = resolveApertura(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    // ---- shared panel rows (drawn once)
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      R.order.forEach((i, j) => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(j + 1), text: R.speakers[i].label, name: `lg-p${i}`}));
    }
    if (showAll) {
      R.speakers.forEach(sp => sp.statements.forEach((tx, q) => rows.push({kind: 'legend', glyphKind: 'statement', seqNumber: String(R.rank[sp.index] + 1), numberFill: '#1f2328', text: tx, name: `lg-st${sp.index}-${q}`})));
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', text: tx, name: `lg-ex${i}`}));
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      P.sharedFacts.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'same', text: tx, name: `shared${i}`}));
    }
    if (showKey) rows.push({kind: 'text', bold: true, text: P.changedFact, name: 'changed-fact'});
    if (showAll) rows.push({kind: 'legend', glyphKind: 'guide', text: P.comparisonLabels.guide, name: 'guide-row'});
    if (showAll) rows.push({kind: 'text', text: P.comparisonLabels.neutral, name: 'neutral'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const gap = 30;
    // ---- headers (A / B): lane disc + caption, at a room's width
    const headerFor = (F, w) => {
      if (!showKey) return {h: 0, fits: null};
      const disc = F * 0.8;
      const fits = ['scenarioA', 'scenarioB'].map(k => fitG(P[k].caption || '', {maxWidth: Math.max(80, w - disc * 2 - F * 0.6), size: F, minSize: F, maxLines: 3, weight: 500}));
      const hh = Math.max(disc * 2, ...fits.map(f => f.height)) + F * 0.3;
      return {h: hh, fits, disc};
    };
    // ---- one candidate: rooms area (for the pair), arrangement, size, room scale
    const compose = (area, arr, F, scale) => {
      // guide channels: a strip above each room (both arrangements) and, stacked, a margin right of the rooms
      const chan = 26, side = arr === 'row' ? 0 : 38;
      const roomsW = arr === 'row' ? (area.w - gap) / 2 : area.w - side;
      const hd = headerFor(F, roomsW);
      const roomH = arr === 'row' ? area.h - hd.h - chan : (area.h - 2 * (hd.h + chan) - gap) / 2;
      const box = {x: area.x, y: area.y + hd.h + chan, w: roomsW, h: roomH};
      const C = composeRoom(ctx, P, R, box, F, {chips: false, exhibitChips: false, scale, minScale: 0.8, compact: true, align: {x: 0.5, y: arr === 'row' ? 0 : 0.5}});
      const problems = [...C.problems];
      // room B: same composition, shifted
      const plan = C.planRect;
      const shift = arr === 'row' ? {x: roomsW + gap, y: 0} : {x: 0, y: roomH + hd.h + chan + gap};
      // number badges beside each participant (the configured sequence), placed in room A and copied to B
      const badgeR = F * 0.78;
      let badges = [];
      if (showKey) {
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: C.toD(C.G.seats[sp.index]), rad: C.rad, rim: C.rad * 0.8, prefer: C.G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: C.people, boxes: C.equip.slice(0, -1), ellipse: C.ellipse, anchors: C.G.seats.map(q => C.toD(q))});
        badges = res.labels;
        for (const f of res.fails) problems.push(`badge-${f}`);
      }
      return {C, problems, hd, box, shift, plan, roomsW, roomH, chan, side, badges, badgeR, arr, area};
    };
    const arrangements = [];
    const rowsOk = (F, pw, cols) => {
      const ms = rows.map(rw => measureRow(rw, F, (pw - 28 * (cols - 1)) / cols));
      return {ms};
    };
    // candidate arrangements of the pair and the panel
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
    // standing people floors (production/SESSION_HANDOFF.md): >= 60 px; 1:1 contrast >= 55 px baseline, >= 45 px stress.
    // The module cannot tell a baseline from a stress preset: < 45 px (1:1) is a problem, and >= 55 px is preferred.
    const minPerson = shape === 'square' ? 45 : 60;
    // a second pass (only when nothing fits) keeps the smallest text and flags the panel overflow instead of throwing
    for (const force of [false, true]) {
    if (best) break;
    for (const Fpx of (force ? [16.4] : [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4])) {
      const F = Fpx / px;
      let good = false;
      for (const A of arrangements) {
        let lay = null, area = {x: 0, y: 0, w: D.w, h: D.h}, panelBox = null;
        const extra = [];
        if (rows.length) {
          if (A.panel === 'column') {
            const pw = D.w * A.cf;
            const ms = rows.map(rw => measureRow(rw, F, pw));
            const probe = layoutRows(ms, {x: 0, y: 0, w: pw, h: 1e6}, F, 1, 28);
            if (!probe.ok || probe.usedH > D.h) { if (!force) continue; extra.push('panel-overflow'); }
            panelBox = {x: D.w - pw, y: Math.max(0, (D.h - probe.usedH) / 2), w: pw, h: probe.usedH};
            lay = layoutRows(ms, panelBox, F, 1, 28);
            area = {x: 0, y: 0, w: D.w - pw - gap, h: D.h};
          } else {
            const colW = (D.w - 28 * (A.cols - 1)) / A.cols;
            const ms = rows.map(rw => measureRow(rw, F, colW));
            const probe = layoutRows(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, A.cols, 28);
            if (!probe.ok || probe.usedH > D.h * 0.45) { if (!force) continue; extra.push('panel-overflow'); }
            panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
            lay = layoutRows(ms, panelBox, F, A.cols, 28);
            area = {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap};
          }
        }
        for (const scale of [1, 1.15, 1.3]) {
          const c = compose(area, A.arr, F, scale);
          const personPx = 100 * c.C.k * px;
          c.problems.push(...extra);
          if (personPx < minPerson) c.problems.push('people-small');
          const score = -1000 * c.problems.length + (Fpx >= 19.5 ? 500 : 0) + (personPx >= 55 ? 300 : 0) + Math.min(personPx, 110) + 3 * Fpx;
          log.push(`${Fpx} ${A.arr}/${A.panel}${A.cf || A.cols} s${scale} ${personPx.toFixed(0)} ${c.problems.join('+')}`);
          const cand = {...c, F, lay, panelBox, score, personPx, A};
          if (!best || score > best.score) best = cand;
          if (!c.problems.length && personPx >= 70 && Fpx >= 19.5) good = true;
          if (!c.problems.length) break;
        }
      }
      if (good) break;
    }
    }
    const {C, F, lay, hd, shift, badges, badgeR, arr} = best;
    const G = C.G;
    const dispText = showKey ? {started: C.dt.started, pending: C.dt.pending} : null;
    const roomA = hearingRoom(ctx, G, {prefix: 'ra', R, dispText, glyphS: C.dt.gS});
    const roomB = hearingRoom(ctx, G, {prefix: 'rb', R, dispText, glyphS: C.dt.gS});
    // headers: above each room, left-aligned with it
    const plan = C.planRect;
    const headers = hd.fits ? ['A', 'B'].map((letter, j) => {
      const sx = j ? shift.x : 0, sy = j ? shift.y : 0;
      const top = plan.y - best.chan - hd.h + sy;
      return {letter, x: plan.x + sx, y: top, fit: hd.fits[j], disc: hd.disc};
    }) : [];
    // the guide: from display A to display B through a free channel
    const dA = C.toD({x: G.W / 2, y: G.display.y});
    let pts;
    // (the guide leaves display A upwards into the strip above room A and enters display B from the strip above room B;
    // stacked, it runs down the right margin between the two strips — never over the rooms' floors)
    const gy = plan.y - best.chan / 2;
    if (arr === 'row') {
      pts = [{x: dA.x, y: dA.y}, {x: dA.x, y: gy}, {x: dA.x + shift.x, y: gy}, {x: dA.x + shift.x, y: dA.y}];
    } else {
      const cx = plan.x + plan.w + best.side / 2;
      pts = [{x: dA.x, y: dA.y}, {x: dA.x, y: gy}, {x: cx, y: gy}, {x: cx, y: gy + shift.y}, {x: dA.x, y: gy + shift.y}, {x: dA.x, y: dA.y + shift.y}];
    }
    const guide = polyline(pts);
    return {P, R, F, px, C, G, lay, headers, roomA, roomB, shift, badges, badgeR, arr, guide, pts, log, problems: best.problems, personPx: best.personPx, showKey};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const badgeNode = (b, name, i, dx, dy) => g({name},
      h('circle', {cx: r(b.box.x + b.box.w / 2 + dx), cy: r(b.box.y + b.box.h / 2 + dy), r: r(L.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
      h('text', {x: r(b.box.x + b.box.w / 2 + dx), y: r(b.box.y + b.box.h / 2 + dy + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(L.R.rank[i] + 1)));
    const lanes = [th.accent2, th.accent4];
    return g(null,
      g({name: 'roomA', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.roomA.node),
      g({name: 'roomB', transform: `${T(C.ox + L.shift.x, C.oy + L.shift.y)} scale(${r(C.k, 5)})`}, L.roomB.node),
      L.badges.map((b, i) => [badgeNode(b, `bA${i}`, i, 0, 0), badgeNode(b, `bB${i}`, i, L.shift.x, L.shift.y)]),
      L.headers.map((hd, j) => g({name: `hdr${hd.letter}`},
        h('circle', {cx: r(hd.x + hd.disc), cy: r(hd.y + hd.disc), r: r(hd.disc), fill: lanes[j]}),
        h('text', {x: r(hd.x + hd.disc), y: r(hd.y + hd.disc + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, hd.letter),
        textAt(hd.fit, hd.x + hd.disc * 2 + L.F * 0.5, hd.y + Math.max(0, hd.disc - hd.fit.height / 2), th.fg))),
      h('path', {name: 'guide', 'data-draw': 1, d: L.guide.d(1), fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.total)} ${r(L.guide.total + 10)}`, 'stroke-dashoffset': r(L.guide.total), opacity: 0}),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C} = L;
    const nodes = {};
    const sw = seg(u, ...W.switch);
    const tx = seg(u, ...W.text);
    const pulse = seg(u, ...W.pulse);
    const lampsA = seg(u, ...W.lamps);
    // cards (same timing in both rooms)
    const n = R.n;
    const span = W.cards[1] - W.cards[0] - CARD_WIN;
    const step = n > 1 ? span / (n - 1) : 0;
    const cards = [], people = [], states = [];
    for (let i = 0; i < n; i++) {
      const s0 = W.cards[0] + R.rank[i] * step;
      const st = cardAt(G, i, seg(u, s0, s0 + CARD_WIN), ctx.reduced);
      cards.push(st.card);
      people.push({seated: 1, reach: st.reach});
      states.push(st.state);
    }
    const lookA = {lights: lampsA, switchK: 0.5 + 0.5 * sw, frames: {solid: tx, dashed: 0}, text: {started: tx, pending: 0}, pulse: pulse > 0 && pulse < 1 ? pulse : null};
    const lookB = {lights: 0, switchK: 0.5 - 0.5 * sw, frames: {solid: 0, dashed: tx}, text: {started: 0, pending: tx}, pulse: null};
    const common = {started: 0, clockDeg: 36 * clamp(u / 0.8), cards, people};
    const fa = L.roomA.frame({...common, ...lookA});
    const fb = L.roomB.frame({...common, ...lookB});
    Object.assign(nodes, fa.nodes, fb.nodes);
    const guideP = seg(u, ...W.guide);
    nodes.guide = {opacity: guideP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.guide.total * (1 - guideP))};
    if (L.lay) for (const m of L.lay.rows) {
      if (m.name === 'changed-fact') nodes[m.name] = {opacity: r(seg(u, ...W.fact), 3)};
      if (m.name === 'guide-row') nodes[m.name] = {opacity: r(seg(u, ...W.guideRow), 3)};
    }
    const ser = o => JSON.stringify({l: r(o.lights, 3), s: r(o.switchK, 3), f: [r(o.frames.solid, 3), r(o.frames.dashed, 3)], t: [r(o.text.started, 3), r(o.text.pending, 3)], p: o.pulse === null ? null : r(o.pulse, 3)});
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    const hA = fa.hands.map(q => R2(C.toD(q)));
    return {
      nodes,
      semantic: {
        beat,
        lookA: ser(lookA) + JSON.stringify(states),
        lookB: ser(lookB) + JSON.stringify(states),
        lightsA: r(lampsA, 3), lightsB: 0,
        switchA: r(lookA.switchK, 3), switchB: r(lookB.switchK, 3),
        stateA: tx >= 1 ? 'started' : tx > 0 ? 'changing' : 'blank',
        stateB: tx >= 1 ? 'pending' : tx > 0 ? 'changing' : 'blank',
        cardState: states,
        received: states.filter(q => q === 'placed').length,
        guide: r(guideP, 3),
        hands: hA,
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
    slug: 'hearings-01-contrast',
    title: 'Opening of a hearing — session started and session pending compared in two identical rooms',
    titleEs: 'Apertura de audiencia — Comparación de dos supuestos',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Apertura de audiencia',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical generic hearing rooms. At the same moment one supplied fact is introduced: in A the switch goes to ● and the display shows the started state, the lamps come on; in B the switch goes to ◆ and the display shows the pending state (a waiting state only). The same hand-over of name cards then runs in both rooms. A guide links the two displays. No winner, score or outcome.',
    tags: ['hearing', 'opening', 'contrast', 'session started', 'session pending', 'two rooms', 'status display', 'switch', 'name cards', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
