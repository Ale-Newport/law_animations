/**
 * LAW-0369 — Transferencia de custodia · story
 *
 * Storyboard (a top-down hand-off room: custodian A stands at one end, custodian B at the other — seen from above,
 * shoulders and head; each has an own steel desk with the category's green mat and an own clipboard record sheet
 * (A blue clip, B amber clip); a wooden counter between the desks carries a marked hand-off tray; the sealed evidence
 * bag with the fictional object inside, its manila tag and the ball chain to the bag's eyelet lies on A's desk; each
 * custodian's second hand holds a pen; landscape runs A → B left to right, portrait top to bottom; a legend lists
 * item, custodians, the rows of both sheets, times, captions, notes, the supplied state and the neutral key):
 *  0.00–0.15  rest: nothing moves; the bag lies on A's desk, both sheets are unwritten.
 *  0.15–0.42  the action: A's hand grips the bag's near edge and carries it onto the counter tray; B's hand reaches the
 *             far edge; both hands hold the bag on the tray (the shared hand-off point); A lets go, B carries the bag
 *             to B's desk. The tag and chain travel with the bag; nothing teleports.
 *  0.42–0.73  separate records: A's pen hand writes A's rows on sheet A (the pen tip follows the ink), then B's pen
 *             hand writes B's rows on sheet B. Cause precedes effect.
 *  0.73–1.00  hold: the bag lies on B's desk; the two sheets show their rows as supplied.
 *             finalState: recorded (each sheet carries its own entry) · gap (B's sheet is left without entry: B's pen
 *             hand never moves, the rows stay blank and a note ring marks them — a supplied documentary gap with no
 *             stated consequence). No chain-of-custody doctrine; fictional; jurisdiction unspecified.
 * @module animations/evidence-custody/LAW-0369
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {roundRectPath} from '../../core/geometry.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {localised, ringRect, noteColors, R2} from './kits/evidence-art.js';
import {
  TC_EN, TC_ES, tcFields, tcLogs, tcRecordLine, tcStage, tcPose, tcArms, bagUnit, tcSceneNodes, tcFrameNodes,
  tcWriteProps, tcPanelNode, tcPanelLayout as panelLayout,
} from './kits/transferencia-custodia.js';

const ID = 'LAW-0369';
const DURATION = 8000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  aReach: [0.15, 0.2], aCarry: [0.2, 0.3], bReach: [0.25, 0.3], aBack: [0.35, 0.41], bCarry: [0.35, 0.45], bBack: [0.45, 0.51],
  aWrite: [0.43, 0.58], bWrite: [0.57, 0.72], notes: [0.74, 0.8], state: [0.75, 0.81],
};
const TARGETS = ['bag', 'tray', 'logA', 'logB'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {
    recorded: 'The bag is with B; sheet A and sheet B each carry their own entry (as supplied)',
    gap: 'The bag is with B; sheet B has no entry for the hand-off — a documentary gap (as supplied)',
  },
  es: {
    recorded: 'La bolsa queda con B; la hoja A y la hoja B llevan cada una su propio registro (según lo aportado)',
    gap: 'La bolsa queda con B; la hoja B no tiene registro de la entrega: hueco documental (según lo aportado)',
  },
};

const OWN_EN = {
  actorLabels: {a: 'Hands of A: carry the bag to the tray, then write sheet A', b: 'Hands of B: take the bag at the tray, then write sheet B'},
  objectLabels: {bag: 'Sealed evidence bag with the object', tag: 'Tag lying on the bag', chain: 'Ball chain from the tag to the bag', counter: 'Counter with the hand-off tray'},
  annotations: [{target: 'tray', text: 'Both hands hold the bag on the tray'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos de A: llevan la bolsa a la bandeja y escriben la hoja A', b: 'Manos de B: toman la bolsa en la bandeja y escriben la hoja B'},
  objectLabels: {bag: 'Bolsa de pruebas cerrada con el objeto', tag: 'Etiqueta sobre la bolsa', chain: 'Cadena de bolas de la etiqueta a la bolsa', counter: 'Mostrador con la bandeja de entrega'},
  annotations: [{target: 'tray', text: 'Las dos manos sujetan la bolsa en la bandeja'}],
  stateCaption: '',
};
const EN = {...TC_EN, ...OWN_EN};
const ES = {...TC_ES, ...OWN_ES};

const sceneSchema = {
  ...tcFields,
  actorLabels: obj('Captions of the two custodians\' hands (legend)', {
    a: str('Caption for the hands of A', 80),
    b: str('Caption for the hands of B', 80),
  }, ['a', 'b']),
  objectLabels: obj('Captions of the props in the legend', {
    bag: str('Caption for the evidence bag', 60),
    tag: str('Caption for the tag', 60),
    chain: str('Caption for the ball chain', 60),
    counter: str('Caption for the counter and its tray', 60),
  }, ['bag', 'tag', 'chain', 'counter']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 80),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): recorded — each custodian writes an own entry; gap — sheet B is left without entry for the hand-off (documentary gap, as supplied)', ['recorded', 'gap']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 120),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'recorded'};

/** Rows as drawn: in the gap state sheet B is left unwritten. */
function drawnRows(P) {
  const rows = tcLogs(P);
  if (P.finalState === 'gap') rows.b = rows.b.map(rw => ({...rw, filled: false}));
  return rows;
}

function legendRows(ctx, P, rows) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const out = [];
  const it = P.items[0];
  if (showKey) out.push({kind: 'heading', icon: `object-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) P.custodians.forEach((c, i) => out.push({kind: 'item', icon: i === 0 ? 'cus-a' : 'cus-b', text: `${i === 0 ? 'A' : 'B'} · ${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showKey) for (const key of ['a', 'b']) if (rows[key].length) out.push({kind: 'item', icon: rows[key].some(rw => rw.filled) ? `log-${key}` : 'blank-row', text: `${key === 'a' ? P.labels.logA : P.labels.logB} · ${rows[key].map(rw => tcRecordLine(rw, P.labels.blank)).join(' · ')}`, name: `lg-rec-${key}`});
  if (showAll) P.timestamps.forEach((t, i) => out.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) out.push({kind: 'item', icon: 'bag', text: P.objectLabels.bag, name: 'lg-bag'});
  if (showAll) out.push({kind: 'item', icon: 'tag', text: `${P.objectLabels.tag} · ${P.objectLabels.chain}`, name: 'lg-tag'});
  if (showAll) out.push({kind: 'item', icon: 'counter', text: P.objectLabels.counter, name: 'lg-counter'});
  if (showAll) out.push({kind: 'item', icon: 'glove', text: P.actorLabels.a, name: 'lg-hands-a'});
  if (showAll) out.push({kind: 'item', icon: 'glove', text: P.actorLabels.b, name: 'lg-hands-b'});
  if (showAll) P.annotations.forEach((a, i) => out.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) out.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) out.push({kind: 'key', text: P.labels.key, name: 'key'});
  return out;
}

function compose(ctx, P, rows, lrows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  let stage, panel = null, PL = null;
  if (!lrows.length) stage = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [panelLayout(ctx, lrows, {w: colW, F})];
    if (cols === 2) {
      let best = null;
      for (let i = 1; i < lrows.length; i++) {
        const a = panelLayout(ctx, lrows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, lrows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      if (best) PLs = best.cols;
    }
    const ph = Math.max(...PLs.map(q => q.h));
    PL = {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW};
    stage = {x: 0, y: 0, w: DW, h: DH - ph - gap};
    panel = {x: 4, y: DH - ph};
  } else {
    const PW = DW * opt.pw;
    const one = panelLayout(ctx, lrows, {w: PW, F});
    PL = {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW};
    stage = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)};
  }
  const G = stage.h > 220 && stage.w > 220 ? tcStage(stage, opt.orient, {kind: P.items[0].kind, rowsA: rows.a.length, rowsB: rows.b.length}) : null;
  const ok = (!PL || PL.ok) && G && G.fits && G.S >= 150;
  return {F, stage, panel, PL, G, ok, problems: [PL && !PL.ok && 'panel-text', (!G || !G.fits) && 'stage-fit', (!G || G.S < 150) && 'stage-small'].filter(Boolean)};
}

function poseAt(ctx, L, u) {
  const P = L.P;
  const capU = lerp(W.aReach[0], W.bWrite[1] + 0.02, clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const s = tcPose(ctx, L.G, W, ua, {writeA: true, writeB: P.finalState !== 'gap', rows: L.rows, seed: 'tc'});
  s.capped = P.actionProgress < 1 && u > capU;
  return s;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const rows = drawnRows(P);
    const lrows = legendRows(ctx, P, rows);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1, orient: 'v'}, {mode: 'below', cols: 2, orient: 'v'}, {mode: 'below', cols: 1, orient: 'h'}, {mode: 'below', cols: 2, orient: 'h'}]
      : shape === 'square' ? [{mode: 'side', pw: 0.34, orient: 'h'}, {mode: 'side', pw: 0.38, orient: 'h'}, {mode: 'side', pw: 0.42, orient: 'h'}, {mode: 'side', pw: 0.34, orient: 'v'}, {mode: 'side', pw: 0.38, orient: 'v'}, {mode: 'side', pw: 0.42, orient: 'v'}, {mode: 'side', pw: 0.5, orient: 'v'}, {mode: 'side', pw: 0.56, orient: 'v'}, {mode: 'below', cols: 2, orient: 'h'}]
        : [{mode: 'side', pw: 0.28, orient: 'h'}, {mode: 'side', pw: 0.32, orient: 'h'}, {mode: 'side', pw: 0.36, orient: 'h'}, {mode: 'side', pw: 0.4, orient: 'h'}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) for (const opt of opts) {
      const c = compose(ctx, P, rows, lrows, F, opt);
      const score = (c.G ? c.G.S : 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
      if (c.ok && score > bestScore) { best = c; bestScore = score; }
      if (!C || c.problems.length < C.problems.length) C = c;
    }
    if (best) C = best;
    if (!C.G) C.G = tcStage(C.stage, 'h', {kind: P.items[0].kind, rowsA: rows.a.length, rowsB: rows.b.length});
    const G = C.G;
    const L0 = {P, G, C, rows};
    const samples = [];
    for (let i = 0; i <= 90; i++) samples.push(poseAt(ctx, L0, i / 90));
    const arms = tcArms(ctx, G, samples, 'st');
    const unit = bagUnit(ctx, G, 'st-bag');
    const notes = noteColors(ctx.theme);
    const pad = 12;
    const end = poseAt(ctx, L0, 1);
    const tgt = name => {
      if (name === 'bag') return {x: end.bag.x - G.B.w / 2 - pad, y: end.bag.y - G.B.h / 2 - pad, w: G.B.w + pad * 2, h: G.B.h + pad * 2};
      if (name === 'tray') return {x: G.tray.x - pad * 0.5, y: G.tray.y - pad * 0.5, w: G.tray.w + pad, h: G.tray.h + pad};
      const Lg = name === 'logA' ? G.logs.a : G.logs.b;
      return {x: Lg.x - pad, y: Lg.y - pad, w: Lg.w + pad * 2, h: Lg.h + pad * 2};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    // the gap ring around sheet B's rows (drawn with labels hidden too: it marks blank rows, not text)
    const SB = G.sheets.b;
    const gapRing = P.finalState === 'gap' && SB.rows.length ? ringRect({x: SB.paper.x - 6, y: SB.rows[0].top - 6, w: SB.paper.w + 12, h: SB.rows[SB.rows.length - 1].top + SB.pitch - SB.rows[0].top + 12}, ctx.theme.accent2, 4) : null;
    return {P, rows, C, G, arms, unit, rings, gapRing};
  },
  build(ctx, L) {
    const {C, G} = L;
    const N = tcSceneNodes(ctx, G, L, 'st', {seed: 'tc'});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, tcPanelNode(ctx, PLc))) : [];
    const clipId = 'st-win';
    return g({name: 'scene'},
      g({'clip-path': ctx.ref(clipId)},
        N.stage, N.sheets, N.shadow, N.bag,
        N.arms, N.palms, N.pens, N.thumbs, N.persons,
      ),
      windowClip(ctx, C.stage, clipId),
      g({name: 'gap-ring', opacity: 0}, L.gapRing),
      g({name: 'rings', opacity: 0}, L.rings),
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, G, P} = L;
    const s = poseAt(ctx, L, u);
    const done = P.actionProgress >= 1;
    const F = tcFrameNodes(ctx, G, s, L, 'st');
    const nodes = F.nodes;
    Object.assign(nodes, tcWriteProps('st', L.rows, s.progress));
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    nodes['gap-ring'] = {opacity: r(P.finalState === 'gap' ? noteK : 0, 3)};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const written = k => L.rows[k].map((rw, i) => rw.filled ? r(s.progress[k][i], 3) : 0);
    return {
      nodes,
      semantic: {
        beat, phase: s.phase, holder: s.holder, moving: s.moving,
        handAc: R2(s.hands.a.carry), handBc: R2(s.hands.b.carry), handAp: R2(s.hands.a.pen), handBp: R2(s.hands.b.pen),
        gripA: R2(s.grips.a), gripB: R2(s.grips.b), penGripA: R2({x: s.tips.a.x - s.pens.a.off.x, y: s.tips.a.y - s.pens.a.off.y}), penGripB: R2({x: s.tips.b.x - s.pens.b.off.x, y: s.tips.b.y - s.pens.b.off.y}),
        bag: R2(s.bag), tipA: R2(s.tips.a), tipB: R2(s.tips.b), atTray: s.atTray, atB: s.atB,
        writingA: s.writing.a, writingB: s.writing.b, writtenA: written('a'), writtenB: written('b'),
        rowsA: L.rows.a.map(rw => rw.filled), rowsB: L.rows.b.map(rw => rw.filled),
        gapRing: r(P.finalState === 'gap' ? noteK : 0, 3),
        allReached: F.allReached, finalState: P.finalState, actionCapped: s.capped,
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1), orient: G.orient,
        stage: {x: r(C.stage.x), y: r(C.stage.y), w: r(C.stage.w), h: r(C.stage.h)},
        bagStart: R2(G.bagStart), bagMid: R2(G.bagMid), bagEnd: R2(G.bagEnd),
      },
    };
  },
};

/** Stage window: clip path + frame outline. */
function windowClip(ctx, box, clipId) {
  return g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 22)}))),
    h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 22), fill: 'none', stroke: ctx.theme.ink, 'stroke-width': ctx.theme.stroke * 1.2}),
  );
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'evidence-custody-03-story',
    title: 'Custody transfer — a sealed evidence bag passes across a counter from one custodian to another, each writing an own record sheet',
    titleEs: 'Transferencia de custodia — Microescena con objetos y actores',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Transferencia de custodia',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down hand-off room. Custodian A and custodian B stand at opposite ends, each with an own desk and an own clipboard record sheet; a counter with a hand-off tray lies between them. A carries the sealed evidence bag (object inside, tag and ball chain attached) onto the tray, both hands hold it there, and B takes it to B\'s desk; then A writes sheet A and B writes sheet B. The hold shows the supplied state: both sheets written, or sheet B left without entry (a documentary gap, as supplied, with no stated consequence). No chain-of-custody doctrine; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'transfer', 'hand-off', 'evidence bag', 'record sheet', 'log', 'counter', 'custodian', 'documentary gap', 'tag', 'chain'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/transferencia-custodia.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
