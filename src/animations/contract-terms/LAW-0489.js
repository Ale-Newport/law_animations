/**
 * LAW-0489 — Obligaciones recíprocas · story
 *
 * Storyboard (standing microscene; the contract board between the two parties):
 *  0.00–0.15  rest: the contract board (head band "CT-903 · Contract (fictional)", its layers behind) with two empty
 *             columns of equal size — "● Obligation of A" and "◆ Obligation of B" — and, in each column's tray, that
 *             party's performance cards (supplied, fictional placeholders), stacked. Party A stands at the left, Party B
 *             at the right, at equal weight.
 *  0.16–0.47  the columns are filled: in each pass both parties at once take their next card from their own tray and
 *             seat it in their own column (the same motion, mirrored, at the same time — neither side first). Beside
 *             the board (16:9, 1:1) the hand holds the card's outer end all the way. Under the board (9:16) the rows are
 *             out of arm's reach: each party lifts the card with a LIFTER — a slim rod with a cup at its tip, parked
 *             under the party's tray — held in the near hand at a constant distance below the card (the hand stays in
 *             front of the face; the card never moves without the rod under it).
 *  0.50–0.68  the concrete action: the two columns connect performances between the parties — each supplied link draws
 *             on from both of its ends at once (● on A's card, ◆ on B's card, the same size) and its two halves join in
 *             the middle. With the supplied configuration "listed" no link is drawn.
 *  0.73–1.00  hold: "Performances linked as supplied" (or "Listed side by side · no link supplied") and the key "As
 *             supplied · no conclusion drawn".
 * A link means only "linked as supplied": no exchange that is due, no condition, no dependency, no order of
 * performance, no breach, remedy or termination; no jurisdiction.
 * @module animations/contract-terms/LAW-0489
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r, seg, ease} from '../../core/time.js';
import {mix, roundRectPath} from '../../core/geometry.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, FINAL_STATES, PX_BASE, PX_STRESS, validLinks,
  layoutBoard, boardArt, makeRigs, nameNodes, linkNodes, cardNodes, cardAt, grabsFor, handOf, stackTextOpacity, poseLinks,
  localizeScene, headBox, figureBox, overlaps, shoulderAt, RIG, PASS,
} from './kits/obligaciones-reciprocas.js';

const ID = 'LAW-0489';
const DURATION = 6000;

const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const EV0 = 0.16, EV1 = 0.47;
const LINK = [0.5, 0.68];
const W = {final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};

/* The lifter (9:16, people under the board). The hand holding it stays FORE rig units in front of the figure (so the
 * raised arm passes in front of the face, never across it), no lower than its reach allows and no higher than HAND_TOPS
 * rig units above the floor (the lowest that fits; the arm-clearance check runs every frame). */
const FORES = [88, 84, 92, 80, 96, 76];
const HAND_TOPS = [400, 414, 428], HAND_LOW_MARGIN = 0.955;
const ROWGAPS = [1.1, 0.85, 0.65, 0.5, 0.35, 0.2, 0];
/** Head (face and hair) as a circle in rig units, for the arm-clearance check. */
const HEAD_C = {x: 5, y: -366}, HEAD_R = 47;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A', 50), b: str('Caption for Party B', 50)}),
  objectLabels: obj('Plates on the two trays', {a: str('Plate on Party A\'s tray', 30), b: str('Plate on Party B\'s tray', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['columnA', 'columnB', 'links']), 0, 2),
  finalState: oneOf('Configuration supplied for the hold: linked (the supplied links are drawn; a tag "Performances linked as supplied") or listed (the two columns side by side, no link drawn; a tag "Listed side by side · no link supplied"). Both are neutral and of equal weight; nothing is inferred from either', FINAL_STATES),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Party A', b: 'Party B'},
  objectLabels: {a: 'Tray A', b: 'Tray B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'linked',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  actorLabels: {a: 'Parte A', b: 'Parte B'},
  objectLabels: {a: 'Bandeja A', b: 'Bandeja B'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.performancesA, ...p.performancesB].some(t => t.length > 40) || p.annotations.length > 1;

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const upx = unitPx(ctx);
    const showKey = ctx.show('key'), show = ctx.show('all');
    const captions = [0, 1].map(i => (p.actorLabels[i ? 'b' : 'a'] ? `${p.parties[i].name} · ${p.actorLabels[i ? 'b' : 'a']}` : p.parties[i].name));
    const notes = [];
    if (show) notes.push({name: 'final', kind: 'final', text: p.finalState === 'listed' ? ctx.t.listed : ctx.t.linked});
    if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
    if (show) p.annotations.forEach((an, i) => notes.push({name: `note${i}`, kind: 'note', text: an.text, target: an.target}));
    const nRows = Math.max(p.performancesA.length, p.performancesB.length);
    const stress = isStress(p);
    const under = shape === 'portrait';
    const base = {
      box: {x: 6, y: 4, w: D.w - 12, h: D.h - 8}, upx, prefix: '',
      px: stress ? PX_STRESS : PX_BASE,
      headMin: 45, headTarget: shape === 'square' ? 70 : 100, kMax: under ? 1.6 : 2.2, gutter: 0.24, mode: under ? 'under' : 'beside', rowGap: under ? 1.1 : 0.6,
      texts: {a: p.performancesA, b: p.performancesB}, nRows,
      contract: `${p.contract.reference} · ${p.contract.title}`, columns: p.columns,
      names: showKey ? captions : null, plates: show ? p.objectLabels : null,
      notes, notesWhere: 'auto', trays: true, minCh: 71 / upx,
      // (the outer ●/◆ glyph ≥ 4 px clear of the print)
      glyphZone: 1.45,
    };
    const passesOf = L0 => {
      // passes: in pass i both parties seat their i-th card (a party with fewer cards waits)
      const d = (EV1 - EV0) / nRows;
      const out = {a: [], b: []};
      for (const s of ['a', 'b']) {
        const n = s === 'a' ? p.performancesA.length : p.performancesB.length;
        for (let i = 0; i < n; i++) out[s].push({i, win: [EV0 + i * d, EV0 + (i + 1) * d], from: L0.G.trayAt(s, i), to: L0.G.rowAt(s, i)});
      }
      return out;
    };
    let L = null;
    if (!under) L = layoutBoard(ctx, base);
    else {
      // under the board: the widest row spacing (up to 1.1 card heights) whose rows the lifter reaches
      // (the hand's highest hold: 400 rig units above the floor — the hand by the brow, well in front of the face —
      // and only when no spacing allows it, up to 428)
      const tried = new Map();
      for (const top of HAND_TOPS) {
        for (const rowGap of ROWGAPS) {
          for (const fore of FORES) {
            const key = `${rowGap}|${fore}`;
            let L1 = tried.get(key);
            if (L1 === undefined) { L1 = layoutBoard(ctx, {...base, rowGap, noReach: true, bandInset: fore + 14}); if (L1.ok) L1.passes = passesOf(L1); tried.set(key, L1); }
            if (!L1.ok) break;
            const lift = liftGeom(L1, fore, top);
            if (!L) L = L1;
            if (lift) { L = L1; L.lift = lift; break; }
          }
          if (L && L.lift) break;
        }
        if (L && L.lift) break;
      }
      if (L && L.ok && !L.lift) L.why.push('lifter-out-of-reach');
      L = L ?? {ok: false, why: ['no-layout-fits'], P: ''};
    }
    L.captions = captions;
    L.plates = show ? p.objectLabels : null;
    L.links = p.finalState === 'linked' ? validLinks(p) : [];
    L.nA = p.performancesA.length; L.nB = p.performancesB.length;
    if (!L.G) { L.ok = false; return L; }
    L.rigs = makeRigs(ctx, L, p.parties);
    L.passes = passesOf(L);
    // annotation leaders: from the chip's top (or bottom, in the top band) to the target's edge
    L.leads = [];
    if (L.notesPl) {
      for (const q of L.notesPl.placed) {
        if (q.it.kind !== 'note') continue;
        const G = L.G;
        const tb = q.it.target === 'columnA' ? G.cols[0] : q.it.target === 'columnB' ? G.cols[1] : G.gutter;
        const cx = q.x + q.c.box.w / 2;
        if (L.notesWhere === 'below') {
          const tx = Math.min(Math.max(cx, tb.x + 10), tb.x + tb.w - 10);
          const ty = G.board.y + G.board.h;
          L.leads.push({name: `${q.it.name}-lead`, from: {x: tx, y: q.y}, to: {x: tx, y: ty}, note: q.it.name});
        } else {
          const tx = Math.min(Math.max(cx, tb.x + 10), tb.x + tb.w - 10);
          L.leads.push({name: `${q.it.name}-lead`, from: {x: tx, y: q.y + q.c.box.h}, to: {x: tx, y: G.board.y - (tx >= G.board.x + 2 * G.layerUp ? 2 : tx >= G.board.x + G.layerUp ? 1 : 0) * G.layerUp}, note: q.it.name});
        }
      }
    }
    // checks: the people's heads clear of the board; the notes clear of the people
    const G = L.G;
    const heads = [headBox(G.figA), headBox(G.figB)];
    L.headsClear = heads.every(hb => !overlaps(hb, G.board, -1));
    L.notesClear = !L.notesPl || L.notesPl.placed.every(q => ![figureBox(G.figA), figureBox(G.figB)].some(f => overlaps(f, {x: q.x, y: q.y, w: q.c.box.w, h: q.c.box.h}, 2)));
    // (the lifters, parked at the hold, never cross a note)
    if (L.lift && L.notesPl) {
      const rods = ['a', 'b'].map(s => ({x: L.lift[s].park.x - G.F * 0.4, y: L.lift[s].park.y, w: G.F * 0.8, h: L.lift[s].Lp}));
      if (L.notesPl.placed.some(q => rods.some(rb => overlaps(rb, {x: q.x, y: q.y, w: q.c.box.w, h: q.c.box.h}, 2)))) L.notesClear = false;
    }
    if (!L.headsClear) L.why.push('head-over-board');
    if (!L.notesClear) L.why.push('notes-over-people');
    L.ok = L.ok && L.headsClear && L.notesClear && (!under || !!L.lift);
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    if (!L.G) return g({name: 'scene'});
    const th = ctx.theme;
    const notesNodes = L.notesPl ? L.notesPl.placed.map(q => g({name: q.it.name, opacity: 0, transform: T(q.x - q.c.box.x, q.y - q.c.box.y)}, q.c.node)) : [];
    const leads = L.leads.map(ld => h('line', {name: ld.name, opacity: 0, x1: r(ld.from.x), y1: r(ld.from.y), x2: r(ld.to.x), y2: r(ld.to.y), stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-linecap': 'round'}));
    // the lifters (9:16): the rod behind the cards (it passes behind the tray's stack), its cup in front of the card it holds
    const rods = [], cups = [];
    if (L.lift) for (const s of ['a', 'b']) {
      const lf = L.lift[s], F = L.G.F;
      const cw = L.G.cw * 0.16, lip = F * 0.32, rw = Math.max(6, F * 0.24);
      const cup = (nm, op) => g({name: nm, transform: T(r(lf.park.x, 2), r(lf.park.y, 2)), opacity: op},
        h('path', {d: `M${r(-cw / 2)} ${r(-lip)}V${r(rw * 0.35)}H${r(cw / 2)}V${r(-lip)}`, fill: 'none', stroke: th.woodDark, 'stroke-width': r(rw * 0.8, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
      rods.push(g({name: `lift-${s}`, transform: T(r(lf.park.x, 2), r(lf.park.y, 2))},
        h('path', {d: `M0 ${r(rw * 0.35)}V${r(lf.Lp + F * 0.5)}`, stroke: th.woodDark, 'stroke-width': r(rw, 2), 'stroke-linecap': 'round'}),
        h('path', {d: `M0 ${r(rw * 0.35)}V${r(lf.Lp + F * 0.5)}`, stroke: th.woodTop, 'stroke-width': r(rw * 0.4, 2), 'stroke-linecap': 'round'})),
      cup(`lift-${s}-cupb`, 1));
      cups.push(cup(`lift-${s}-cup`, 0));
    }
    const plates = L.lift ? [] : undefined;
    return g({name: 'scene'},
      boardArt(ctx, L, {platesOut: plates}),
      rods,
      plates ?? [],
      cardNodes(ctx, L, {a: p.performancesA, b: p.performancesB}),
      cups,
      linkNodes(ctx, L, L.links),
      L.rigs[0].node, L.rigs[1].node,
      nameNodes(ctx, L, L.captions),
      leads,
      notesNodes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    if (!L.G) return {nodes: {}, semantic: {layoutOk: false, why: L.why.join(','), problems: ['no-layout-fits']}};
    const G = L.G;
    const capU = lerp(BEATS.action[0], BEATS.hold[0] + 0.02, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const sem = {};
    const seated = {a: 0, b: 0};
    let moving = 0;
    for (const s of ['a', 'b']) {
      const pos = L.passes[s].map(ps => cardAt(G, s, ps.win, ps.from, ps.to, a));
      pos.forEach((st, i) => {
        const n = `card-${s}${i}`;
        // (a card under another in the tray is hidden; it shows once every card above it has risen clear of it)
        const above = pos.slice(0, i).map(q => q.pos);
        const op = st.where === 'tray' ? stackTextOpacity(G, st.pos, above) : 1;
        nodes[n] = {transform: T(r(st.pos.x, 2), r(st.pos.y, 2)), opacity: r(op, 3)};
        if (st.where === 'row') seated[s]++;
        if (st.moving) moving++;
        sem[`card${s.toUpperCase()}${i}`] = {x: r(st.pos.x), y: r(st.pos.y)};
      });
    }
    // hands
    const restHands = [G.figA, G.figB].map((fg, i) => L.rigs[i].frame({x: fg.x, y: fg.floor, facing: fg.f, scale: fg.k}).hands.near);
    const held = {};
    let hA, hB;
    if (L.lift) {
      const la = liftAt(L, 'a', a, restHands[0]), lb = liftAt(L, 'b', a, restHands[1]);
      for (const [s, q] of [['a', la], ['b', lb]]) {
        nodes[`lift-${s}`] = {transform: T(r(q.tip.x, 2), r(q.tip.y, 2))};
        nodes[`lift-${s}-cupb`] = {transform: T(r(q.tip.x, 2), r(q.tip.y, 2))};
        nodes[`lift-${s}-cup`] = {transform: T(r(q.tip.x, 2), r(q.tip.y, 2)), opacity: q.held !== null ? 1 : 0};
        // (the point the hand holds: the rod's foot, a constant Lp under the cup)
        held[s] = q.held !== null ? {i: q.held, grip: {x: r(q.foot.x), y: r(q.foot.y)}} : null;
      }
      hA = la.hand; hB = lb.hand;
    } else {
      hA = handOf(grabsFor(G, 'a', L.passes.a), restHands[0], a);
      hB = handOf(grabsFor(G, 'b', L.passes.b), restHands[1], a);
      for (const s of ['a', 'b']) {
        // (beside the board the hand holds the card's outer end from the end of the reach to the end of the seat)
        const ps = L.passes[s].find(q => { const d = q.win[1] - q.win[0]; return a >= q.win[0] + PASS.lift[0] * d && a <= q.win[0] + PASS.seat[1] * d; });
        held[s] = ps ? {i: ps.i, grip: (c => ({x: r(c.x), y: r(c.y)}))(G.gripOf(s, cardAt(G, s, ps.win, ps.from, ps.to, a).pos))} : null;
      }
    }
    const posedA = L.rigs[0].frame({x: G.figA.x, y: G.figA.floor, facing: 1, scale: G.k, near: hA, headTilt: moving ? -4 : 3});
    const posedB = L.rigs[1].frame({x: G.figB.x, y: G.figB.floor, facing: -1, scale: G.k, near: hB, headTilt: moving ? -4 : 3});
    Object.assign(nodes, posedA.nodes, posedB.nodes);
    const armsClear = [['A', G.figA, posedA], ['B', G.figB, posedB]].every(([N, fg, ps]) => armClear(ps.nodes, N));
    // links: once every card is seated, each supplied link draws on from both ends at once
    const lp = L.links.length ? seg(a, ...LINK) : 0;
    poseLinks(nodes, L, L.links, lp);
    // hold
    const fin = done ? seg(u, ...W.final) : 0;
    const keyO = done ? seg(u, ...W.key) : 0;
    const noteO = done ? seg(u, ...W.notes) : 0;
    if (L.notesPl) for (const q of L.notesPl.placed) nodes[q.it.name] = {opacity: r(q.it.kind === 'final' ? fin : q.it.kind === 'key' ? keyO : noteO, 3)};
    for (const ld of L.leads) nodes[ld.name] = {opacity: r(noteO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        ...sem,
        handA: P2(posedA.hands.near), handB: P2(posedB.hands.near),
        heldA: held.a, heldB: held.b, lifter: !!L.lift, armsClear, cardH: r(G.ch, 2),
        allReached: posedA.reached && posedB.reached,
        seatedA: seated.a, seatedB: seated.b, moving,
        links: L.links.length, linkProgress: r(lp, 3),
        finalState: p.finalState, finalShown: r(fin, 3), keyShown: r(keyO, 3),
        layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        textPx: r(L.F * L.upx, 2), headPx: r(90 * G.k * L.upx, 1),
        actionCapped: p.actionProgress < 1 && u > capU,
      },
    };
  },
};

/**
 * The lifter of each side (9:16, under the board) for a hand FORE rig units in front of the figure: its x on the cards
 * (relative to the card's centre), its length Lp (tip → the hand's hold) and its parked position (the cup under the
 * first tray card). Null when a row or the tray is out of the hand's reach or when the rod would sit at a card's end.
 * (The rod passes behind the cards and behind the plate hanging under the tray: the plates are drawn after it.)
 */
function liftGeom(L, fore, handTop) {
  const G = L.G, F = G.F, k = G.k;
  const out = {};
  for (const s of ['a', 'b']) {
    const fig = s === 'a' ? G.figA : G.figB;
    const x0 = fig.x + fig.f * fore * k;
    const dX = x0 - G.cardX(s);
    if (Math.abs(dX) > G.cw / 2 - G.cw * 0.14) return null;
    const tip = c => ({x: c.x + dX, y: c.y + G.ch / 2});
    const sh = shoulderAt(fig);
    const R = RIG.reach * k * HAND_LOW_MARGIN;
    const reach = q => Math.hypot(q.x - sh.x, q.y - sh.y) <= R;
    const tips = [G.trayAt(s, 0), ...L.passes[s].flatMap(ps => [ps.from, ps.to])].map(tip);
    const lowTip = Math.max(...tips.map(q => q.y)), highTip = Math.min(...tips.map(q => q.y));
    const dx = Math.abs(x0 - sh.x);
    if (dx >= R) return null;
    const yLow = sh.y + Math.sqrt(R * R - dx * dx) - F * 0.1;
    const Lp = yLow - lowTip;
    if (highTip + Lp < fig.floor - handTop * k) return null;
    if (!tips.every(q => reach({x: q.x, y: q.y + Lp}))) return null;
    out[s] = {dX, Lp, tip, park: tip(G.trayAt(s, 0)), fore};
  }
  return out;
}

/**
 * Pose a side's lifter and hand at action time a. The rod is parked under the next tray card; in each pass the hand
 * comes to the rod's foot (reach), the rod lifts the card to its row (lift, seat: the card, the rod and the hand move
 * together at a constant offset), then the rod goes back down under the next card (back, and the next pass's reach)
 * and, after the last pass, the hand returns to rest (before the links draw). Returns {tip, foot, hand, held (card index or null)}.
 */
function liftAt(L, s, a, rest) {
  const G = L.G, lf = L.lift[s];
  const passes = L.passes[s];
  const foot = t => ({x: t.x, y: t.y + lf.Lp});
  if (!passes.length) return {tip: lf.park, foot: foot(lf.park), hand: rest, held: null};
  const ph = (ps, q) => ps.win[0] + q * (ps.win[1] - ps.win[0]);
  const parkFor = j => (j < passes.length ? lf.tip(passes[j].from) : lf.park);
  let tip = lf.tip(passes[0].from), held = null;
  for (let j = 0; j < passes.length; j++) {
    const ps = passes[j];
    if (a < ph(ps, PASS.lift[0])) break;
    const st = cardAt(G, s, ps.win, ps.from, ps.to, a);
    if (a <= ph(ps, PASS.seat[1])) { tip = lf.tip(st.pos); held = st.moving ? ps.i : null; break; }
    // (the rod goes down over the back phase and the next pass's reach — the hand stays on it — so that it never
    // rushes; after the last pass it goes down over the back phase)
    const downEnd = j + 1 < passes.length ? ph(passes[j + 1], PASS.reach[1]) : ph(ps, PASS.back[1]);
    tip = mix(lf.tip(ps.to), parkFor(j + 1), ease.inOutSine(seg(a, ph(ps, PASS.back[0]), downEnd)));
  }
  const ft = foot(tip);
  const first = passes[0], last = passes[passes.length - 1];
  const lastEnd = ph(last, PASS.back[1]), restBy = Math.min(lastEnd + (last.win[1] - last.win[0]) * 0.3, LINK[0]);
  let hand;
  if (a < ph(first, PASS.reach[1])) hand = mix(rest, ft, ease.inOutSine(seg(a, ph(first, PASS.reach[0]), ph(first, PASS.reach[1]))));
  else hand = mix(ft, rest, ease.inOutSine(seg(a, lastEnd, restBy)));
  return {tip, foot: ft, hand, held};
}

/** Whether a posed person's arms (upper arm and forearm, both sides) stay clear of the head (rig units, local). */
function armClear(nodes, N) {
  const segDist = (l) => {
    const ax = l.x1, ay = l.y1, bx = l.x2, by = l.y2;
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((HEAD_C.x - ax) * vx + (HEAD_C.y - ay) * vy) / (vx * vx + vy * vy || 1)));
    return Math.hypot(ax + vx * t - HEAD_C.x, ay + vy * t - HEAD_C.y);
  };
  // (the arm's own half-width: about 9 rig units)
  return ['near', 'far'].every(key => [`${N}-${key}-u`, `${N}-${key}-l`].every(n => segDist(nodes[n]) >= HEAD_R + 9));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-03-story',
    title: 'Reciprocal obligations, without a rule — two columns of performances filled by both parties and linked as supplied',
    titleEs: 'Obligaciones recíprocas — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Obligaciones recíprocas',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties on either side of a contract board with two columns of equal size, "Obligation of A" (●) and "Obligation of B" (◆). Both parties at the same time take their own performance cards (supplied, fictional placeholders) from their trays and seat them in their own column, mirrored. Then each supplied link draws on from both ends at once — ● on A\'s card, ◆ on B\'s card — and joins in the middle. The hold shows "Performances linked as supplied" (or the columns listed side by side with no link) and the key "As supplied · no conclusion drawn". A link means only linked as supplied: no exchange that is due, no condition, no order of performance and no conclusion.',
    tags: ['reciprocal obligations', 'two columns', 'performance', 'link', 'contract', 'layers', 'tray', 'equal weight', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/obligaciones-reciprocas.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
