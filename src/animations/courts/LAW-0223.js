/**
 * LAW-0223 — Organización de turnos · contrast
 *
 * Storyboard (two COMPLETE plans of the same generic hearing room, side by
 * side on wide frames and one above the other on tall frames, drawn at the
 * same size: the same table, the same participants with the same party badges
 * (● / ◆, equal weight), the same holder of the turn signal and the same
 * timing). The ONE changed fact is the supplied turn state of one participant
 * (the focus participant, default Participant C): in scenario A their turn is
 * active (the signal is passed to them), in scenario B their turn is pending
 * (waiting only: the signal is passed to another participant as supplied).
 *  0.00–0.17  base: two identical scenes — the holder has the signal under
 *             their hand, their lamp lit; every other lamp unlit; no header.
 *  0.17–0.40  the change, localised and explicit: in each scene the person
 *             who will receive the signal reaches a hand out, open, to the
 *             table (in A the focus participant, in B the other participant as
 *             supplied); then both scenario headers appear together (same
 *             size, same timing).
 *  0.40–0.77  in parallel, with the SAME timing in A and B, the holder pushes
 *             the token across the table and the ready hand catches it; the
 *             holder's lamp goes out when the token leaves the hand, the
 *             receiver's lamp lights after it arrives. The paths of the token
 *             differ (a different receiver), not only a colour or a text.
 *  0.77–1.00  the guide: the focus participant's lamp is ringed in both scenes
 *             (lit in A, unlit in B), the guide chip "only this turn differs"
 *             carries the same ring, and the neutral note says both are as
 *             supplied — no winner, score, outcome, rule or consequence.
 * @module animations/courts/LAW-0223
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {buildingElevation} from './kits/courts-art.js';
import {fitDesign} from '../../core/layout.js';
import {
  turnFields, TURN_EN, TURN_STRINGS, resolveTurns, planHops, turnAt, seatedPose, turnPerson, turnArt, lampFrame, tokenNode,
  seatChipNode, fitPlan, measureStack, drawStack, fitG, textAt, seatPose, lampAt, toWorld, LOCAL, hopTimeAt, pxPerUnit, R2, T, PERSON_RAD,
} from './kits/organizacion-de-turnos.js';

const ID = 'LAW-0223';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {ready: [0.19, 0.3], header: [0.32, 0.38], pass: [0.42, 0.74], guide: [0.78, 0.84], note: [0.82, 0.86]};
const SC = ['A', 'B'];
const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const STRINGS = {en: {...TURN_STRINGS.en}, es: {...TURN_STRINGS.es}};

const scenario = name => obj(`Scenario ${name}`, {
  label: str(`Short label for scenario ${name}`, 50),
  caption: str('One-line description of the scenario (as supplied)', 90),
  next: int(`Seat index of the participant the signal is passed to in scenario ${name} (as supplied)`, 0, 5),
}, ['label', 'next']);

const sceneSchema = {
  ...turnFields,
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison guide', {
    guide: str('Label of the guide ringing the changed detail in both scenes', 60),
    neutral: str('Neutral note (no winner, no outcome, no conclusion)', 110),
  }),
};

const defaultParams = {
  ...TURN_EN,
  routes: [1, 2, 3],
  scenarioA: {label: 'A · Active turn: Participant C', caption: 'The signal is passed to Participant C', next: 2},
  scenarioB: {label: 'B · Pending turn: Participant C', caption: 'The signal is passed to Participant D; C is waiting', next: 3},
  changedFact: 'Changed fact: the supplied turn state of Participant C',
  sharedFacts: ['Same room, table, people and parties', 'Same holder and the same timing'],
  comparisonLabels: {guide: 'Only this turn differs', neutral: 'Both scenes as supplied · no winner, no outcome'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const {seats, seq} = resolveTurns(ctx, p);
    const holder = seq[0];
    const posOf = si => { const q = seats.find(s => s.index === si); return q ? q.pos : -1; };
    let nA = posOf(p.scenarioA.next), nB = posOf(p.scenarioB.next);
    if (nA < 0 || nA === holder) nA = seats.findIndex((s, i) => i !== holder);
    if (nB < 0 || nB === holder) nB = nA;
    const next = {A: nA, B: nB};
    const focus = nA;
    const shape = ctx.view.shape;
    const GAP = 26 / px;
    const HG = 10 / px;
    const cols = Math.max(2, ...seats.map(s => Number(s.slot.slice(-1))));
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const restItems = [
      ...(showKey ? [{type: 'text', text: p.changedFact, weight: 600, name: 'changed-fact'}] : []),
      ...(showAll ? p.sharedFacts.map((f, i) => ({type: 'text', text: `· ${f}`, name: `shared${i}`})) : []),
      ...(showKey ? [
        {type: 'legend', kind: 'active', text: p.labels.active, weight: 600, name: 'legend-active', group: 'state'},
        {type: 'legend', kind: 'pending', text: p.labels.pending, weight: 600, name: 'legend-pending', group: 'state'},
        {type: 'chip', text: p.comparisonLabels.guide, stroke: th.accent2, weight: 700, name: 'guide-card'},
        {type: 'key', text: p.labels.key, name: 'key', group: 'key'},
        {type: 'text', text: p.comparisonLabels.neutral, italic: true, name: 'neutral', group: 'key'},
      ] : []),
      ...(showAll ? [
        {type: 'legend', kind: 'circle', text: p.labels.circle, name: 'legend-circle', group: 'party'},
        {type: 'legend', kind: 'diamond', text: p.labels.diamond, name: 'legend-diamond', group: 'party'},
      ] : []),
    ];
    const hidden = it => it.name === 'guide-card' || it.name === 'neutral';

    const headers = (F, sw) => {
      const R0 = F * 0.8;
      const hd = SC.map(k2 => {
        const s0 = k2 === 'A' ? p.scenarioA : p.scenarioB;
        if (!showKey) return {h: R0 * 2 + 4, R0};
        const tw = sw - R0 * 2 - 14;
        const lf = fitG(s0.label, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 700});
        const cf = showAll && s0.caption ? fitG(s0.caption, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 500}) : null;
        if (lf.truncated || (cf && cf.truncated) || lf.lines.some(l => l.trim().length <= 2)) return null;
        return {lf, cf, R0, h: Math.max(R0 * 2, lf.height + (cf ? F * 0.3 + cf.height : 0)) + 4 + F * 0.28};
      });
      if (hd.some(q => !q)) return null;
      return {hd, hh: Math.max(hd[0].h, hd[1].h)};
    };
    const twoCols = (items, w, F, n) => {
      let best = null;
      const N = items.length;
      const rec = (start, left, acc) => {
        if (left === 1) {
          const ms = [...acc, [start, N]].map(([a, b]) => measureStack(ctx, items.slice(a, b), w, F));
          if (ms.some(m => m.truncated)) return;
          const hh = Math.max(...ms.map(m => m.height));
          if (!best || hh < best.h) best = {h: hh, cols: ms};
          return;
        }
        for (let c = start; c <= N; c++) {
          if (c > 0 && c < N && items[c - 1].group && items[c - 1].group === items[c].group) continue;
          rec(c, left - 1, [...acc, [start, c]]);
        }
      };
      rec(0, n, []);
      return best;
    };

    const compose = (F, kind, axis, force = false) => {
      // the strip: the building beside its two name chips, then the other texts in two or three columns
      let best0 = null;
      for (const nf of [0.28, 0.34]) for (const n of kind === 'row' ? [2, 3] : [2]) {
        const usable = D.w - GAP * n;
        const bw = usable * nf;
        const aw = Math.min(bw * 0.4, 120 / px);
        const nm = measureStack(ctx, nameItems, bw - aw - 12 / px, F);
        if (nm.truncated) continue;
        const w = (usable - bw) / n;
        const b = restItems.length ? twoCols(restItems, w, F, n) : {h: 0, cols: []};
        if (!b) continue;
        const hAll = Math.max(b.h, nm.height, aw * 0.95);
        if (!best0 || hAll < best0.hAll) best0 = {...b, n, w, bw, aw, nm, hAll};
      }
      if (!best0 && force) { const m = measureStack(ctx, restItems, D.w * 0.6, F); best0 = {h: m.height, cols: [m], n: 1, w: D.w * 0.6, bw: D.w * 0.3, aw: Math.min(D.w * 0.12, 120 / px), nm: measureStack(ctx, nameItems, D.w * 0.18, F), hAll: m.height}; }
      if (!best0) return null;
      const stripH = best0.hAll;
      const sw = kind === 'row' ? (D.w - GAP) / 2 : D.w;
      let hdr = headers(F, sw);
      if (!hdr && force) {
        const R0 = F * 0.8;
        const hd = SC.map(k2 => { const s0 = k2 === 'A' ? p.scenarioA : p.scenarioB; const lf = fitG(s0.label, {maxWidth: sw - R0 * 2 - 14, size: F, minSize: F, maxLines: 2, weight: 700}); return {lf, cf: null, R0, h: Math.max(R0 * 2, lf.height) + 4 + F * 0.28}; });
        hdr = {hd, hh: Math.max(hd[0].h, hd[1].h)};
      }
      if (!hdr) return null;
      let boxes, stripY;
      if (kind === 'row') {
        const ph = D.h - stripH - GAP - hdr.hh - HG;
        boxes = [0, sw + GAP].map(x0 => ({x: x0, hy: 0, plan: {x: x0, y: hdr.hh + HG, w: sw, h: ph}}));
        stripY = D.h - stripH;
      } else {
        const ph = (D.h - stripH - 2 * GAP - 2 * (hdr.hh + HG)) / 2;
        const yB = hdr.hh + HG + ph + GAP + stripH + GAP;
        boxes = [{x: 0, hy: 0, plan: {x: 0, y: hdr.hh + HG, w: sw, h: ph}}, {x: 0, hy: yB + ph + HG, plan: {x: 0, y: yB, w: sw, h: ph}}];
        stripY = hdr.hh + HG + ph + GAP;
      }
      if (boxes[0].plan.h < 200 / px && !force) return null;
      const opts = {showKey, cols, spacings: [240, 255, 270, 285, 300, 330, 360], end: 50, ta: 150, wallGap: 14};
      let pl = fitPlan(ctx, seats, boxes[0].plan, axis, F, opts);
      if (!pl && force) { opts.showKey = false; pl = fitPlan(ctx, seats, boxes[0].plan, axis, F, opts); }
      if (!pl) return null;
      const pls = [pl, fitPlan(ctx, seats, boxes[1].plan, axis, F, opts)];
      if (!pls[1]) return null;
      const parts = [];
      const bld = {x: 0, y: stripY + (stripH - best0.aw * 0.95) / 2, w: best0.aw, h: best0.aw * 0.95};
      if (best0.nm.height) parts.push({m: best0.nm, x: best0.aw + 12 / px, y: stripY + (stripH - best0.nm.height) / 2});
      best0.cols.forEach((m, j) => parts.push({m, x: best0.bw + GAP + j * (best0.w + GAP), y: stripY}));
      return {F, kind, axis, sw, boxes, hdr, pls, parts, bld, stripY, stripH};
    };

    const Fmin = 16.6 / px;
    const LOG = [];
    let A = null;
    const kinds = shape === 'portrait' ? [['stack', 'h'], ['stack', 'v']] : shape === 'square' ? [['row', 'v'], ['row', 'h']] : [['row', 'h']];
    for (let F = 22.5 / px; F >= Fmin - 1e-6; F -= 0.8 / px) {
      const Fe = showKey ? F : Fmin;
      for (const [kind, axis] of kinds) {
        const c = compose(Fe, kind, axis);
        LOG.push(c ? `${(Fe * px).toFixed(1)}:${kind}${axis}:k${c.pls[0].k.toFixed(2)}` : `${(Fe * px).toFixed(1)}:${kind}${axis}:null`);
        if (c && (!A || c.pls[0].k > A.pls[0].k * 1.03)) A = c;
      }
      if ((A && A.pls[0].k * PERSON_RAD * 2 * px >= 61.5) || !showKey) break;
    }
    const problems = [];
    if (!A) {
      problems.push('layout');
      A = compose(Fmin, shape === 'portrait' ? 'stack' : 'row', 'h', true);
    }
    const {F, pls, boxes, hdr, parts, bld} = A;
    const G = pls[0].G, k = pls[0].k;
    const nums = {A: new Map([[holder, 1], [next.A, 2]]), B: new Map([[holder, 1], [next.B, 2]])};
    const lampR = clamp(F * 0.95 / k, 22, 36);
    const art = {}, people = {}, hops = {};
    SC.forEach((k2, i) => {
      art[k2] = turnArt(ctx, pls[i].G, {prefix: `${k2}-rm`, seats, nums: null, lampR, numSize: F / k, keepPlant: () => true});
      people[k2] = seats.map((s, j) => turnPerson(ctx, `${k2}-p${j}`, s.look));
      hops[k2] = planHops(pls[i].G, seats, [holder, next[k2]], {a: W.pass[0], b: W.pass[1]});
    });
    const panel = parts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden}));
    const building = buildingElevation(ctx, {name: 'bld', ...bld, floors: 3, bays: 5, highlight: {floor: 1, bay: 3}});
    // the guide ring: around the focus participant's lamp in each scene (design units)
    const ringAt = SC.map((k2, i) => ({...pls[i].toD(lampAt(pls[i].G, seats[focus].slot)), r: (lampR + 20) * k}));
    const share = (A.sw * fitDesign(ctx.view, D.w, D.h).scale) / ctx.view.width;
    return {F, px, k, pls, boxes, hdr, seats, holder, next, focus, art, people, hops, panel, building, ringAt, lampR, problems, log: LOG, kind: A.kind, axis: A.axis, share, showKey};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const plan = (k2, i) => {
      const pl = L.pls[i];
      return g({name: `${k2}-scene`},
        g({name: `${k2}-plan`, transform: T(pl.ox, pl.oy, 0, L.k)},
          L.art[k2].room,
          L.art[k2].lamps,
          L.art[k2].chairs,
          g({name: `${k2}-token`}, tokenNode(ctx, {name: `${k2}-token-body`, s: 42})),
          L.people[k2].map(pp => pp.node),
          L.art[k2].badges),
        // sequence numerals on the lamps (design units, only with labels): holder 1, receiver 2
        L.showKey ? g({name: `${k2}-nums`}, [L.holder, L.next[k2]].map((si, j) => {
          const q = pl.toD(lampAt(pl.G, L.seats[si].slot));
          return h('text', {x: r(q.x), y: r(q.y + L.F * 0.36), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(L.F, 2), 'font-weight': 700, fill: '#1f2328', name: `${k2}-num${j}`, opacity: 0}, String(j + 1));
        })) : null,
        pl.chips.map((c, j) => seatChipNode(ctx, c, {name: `${k2}-lab${j}`, owner: `${k2}-p${j}`})),
        h('circle', {name: `${k2}-ring`, cx: r(L.ringAt[i].x), cy: r(L.ringAt[i].y), r: r(L.ringAt[i].r), fill: 'none', stroke: th.accent2, 'stroke-width': 5, opacity: 0}),
      );
    };
    const hdrNodes = ['A', 'B'].map((k2, i) => {
      const hd = L.hdr.hd[i];
      const b = L.boxes[i];
      const hy = b.hy;
      const R0 = hd.R0;
      const glyph = g(null,
        h('circle', {cx: r(b.x + R0 + 2), cy: r(hy + R0 + 2), r: r(R0 * 0.62), fill: k2 === 'A' ? th.accent3 : '#ffffff', stroke: '#1f2328', 'stroke-width': 3}),
        k2 === 'A' ? h('circle', {cx: r(b.x + R0 + 2), cy: r(hy + R0 + 2), r: r(R0 * 0.62 + 5), fill: 'none', stroke: th.accent3, 'stroke-width': 4}) : null);
      const tx = b.x + R0 * 2 + 14;
      return g({name: `hdr${i}`, opacity: 0},
        glyph,
        hd.lf ? textAt(hd.lf, tx, hy + 2, th.fg) : null,
        hd.cf ? textAt(hd.cf, tx, hy + 2 + hd.lf.height + L.F * 0.3, th.fgSoft) : null);
    });
    return g(null,
      plan('A', 0),
      plan('B', 1),
      hdrNodes,
      L.building.node,
      L.panel.map(q => q.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const sem = {};
    const readyP = ease.inOutCubic(seg(u, ...W.ready));
    const headerP = seg(u, ...W.header);
    const guideP = seg(u, ...W.guide);
    ['A', 'B'].forEach((k2, i) => {
      const pl = L.pls[i];
      const st = turnAt(pl.G, L.seats, [L.holder, L.next[k2]], L.hops[k2], u);
      const hp = L.hops[k2][0];
      // the receiver holds an open hand out at the catch point from the change beat until the token reaches it
      const rec = L.next[k2];
      const recSide = hp.sideTo < 0 ? 'L' : 'R';
      const catchPt = hp.path.at(hp.sCatch);
      const pose = seatPose(pl.G, L.seats[rec].slot);
      const desk = toWorld(pose, LOCAL.desk(hp.sideTo).x, LOCAL.desk(hp.sideTo).y);
      const tH = clamp((u - hp.a) / (hp.b - hp.a));
      if (!(st.hands[rec][recSide]) || tH < hopTimeAt(hp.sCatch)) {
        if (readyP > 0 && st.holder !== rec) st.hands[rec][recSide] = {x: lerp(desk.x, catchPt.x, readyP), y: lerp(desk.y, catchPt.y, readyP)};
      }
      L.seats.forEach((s, j) => {
        Object.assign(nodes, seatedPose(L.people[k2][j], seatPose(pl.G, s.slot), st.hands[j]));
        Object.assign(nodes, lampFrame(`${k2}-rm-lamp${j}`, st.lamps[j], false));
        if (pl.chips[j]) nodes[`${k2}-lab${j}`] = {opacity: 1};
      });
      nodes[`${k2}-token`] = {transform: T(st.token.x, st.token.y)};
      if (L.showKey) { nodes[`${k2}-num0`] = {opacity: 1}; nodes[`${k2}-num1`] = {opacity: r(headerP, 3)}; }
      nodes[`hdr${i}`] = {opacity: r(headerP, 3)};
      nodes[`${k2}-ring`] = {opacity: r(guideP, 3)};
      const look = {
        people: L.seats.map(s => R2(seatPose(pl.G, s.slot))),
        token: R2(st.token),
        lamps: st.lamps.map(v => r(v, 3)),
        hands: st.hands.map(hh => ['L', 'R'].map(kk => (hh[kk] ? R2(hh[kk]) : null))),
        header: r(headerP, 3),
      };
      sem[`look${k2}`] = look;
      sem[k2] = {holder: st.holder === null ? null : L.seats[st.holder].label, lamps: look.lamps, phase: st.phase, reached: st.reached};
      sem[`token${k2}`] = R2(pl.toD(st.token));
    });
    if (L.showKey) {
      nodes['guide-card'] = {opacity: r(guideP, 3)};
      nodes.neutral = {opacity: r(seg(u, ...W.note), 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const focusLabel = L.seats[L.focus].label;
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        scenes: 2,
        focus: focusLabel,
        focusLit: {A: sem.A.lamps[L.focus], B: sem.B.lamps[L.focus]},
        receivers: {A: L.seats[L.next.A].label, B: L.seats[L.next.B].label},
        guide: r(guideP, 3),
        allReached: sem.A.reached && sem.B.reached,
        textPx: r(L.F * L.px, 1),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
        share: r(L.share, 3),
        arrangement: `${L.kind}-${L.axis}`,
        problems: L.problems,
        log: L.log,
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
    slug: 'courts-06-contrast',
    title: 'Turn organisation — the same hearing table with one participant’s turn active or pending',
    titleEs: 'Organización de turnos — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Organización de turnos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete plans of the same generic hearing room, drawn at the same size and with the same timing: the same table, participants and party badges (● / ◆, equal weight) and the same holder of the turn signal. Only one supplied fact differs: in A the signal is passed to the focus participant (active turn), in B it is passed to another participant as supplied and the focus participant is waiting (pending turn). The receiver reaches out, catches the token and their lamp lights; a guide rings the focus participant’s lamp in both scenes. No winner, outcome, required order or consequence is shown.',
    tags: ['contrast', 'turns', 'turn signal', 'active turn', 'pending turn', 'paired scenes', 'hearing room', 'top-down people', 'hand-off', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/organizacion-de-turnos.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
