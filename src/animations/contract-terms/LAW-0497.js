/**
 * LAW-0497 — Cláusula de terminación · story
 *
 * Storyboard (standing microscene; the contract board between the two parties):
 *  0.00–0.15  rest: the contract board (head band "CT-523 · Contract (fictional)", its layers behind) with two panels —
 *             "Circumstances and communications" (an empty slot; below it, in the tray, the card "Communication 1
 *             (supplied)" printed with its supplied case: ● "Case provided for (as supplied)" or ◆ "Case not described
 *             (as supplied)", drawn alike) and "Termination clause" (its supplied sections seated in rows). Right of the
 *             sections the connector bracket stands open in its track. Party A stands at the left, Party B at the right.
 *  0.16–0.40  Party A's hand takes the circumstance card by its outer end and seats it in the slot (constant grip).
 *  0.44–0.66  the concrete action, shown only as the supplied configuration: with "provided for" Party B's hand takes
 *             the bracket by its knob and slides it shut on the supplied section (from…to);
 *  0.66–0.73  then the connector cord is drawn from the clasped bracket to the socket on the seated card: the section is
 *             connected with the supplied communication. With "not described" the bracket stays open and no cord is
 *             drawn, as supplied — neutral, no conclusion.
 *  0.73–1.00  hold: "Section connected as supplied" (or "No connection supplied") and the key "As supplied · no
 *             conclusion drawn".
 * No termination doctrine: no ground or right to terminate, no notice period or time limit, no effect, no validity
 * judgement, no jurisdiction. The two cases have equal weight (● and ◆ of the same area, colour and stroke).
 * @module animations/contract-terms/LAW-0497
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r, seg} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, STATES, PX_BASE, PX_STRESS,
  layoutStage, stageArt, makeRigs, nameNodes, oblNodes, eventNode, bracketNode, cordGeom, cordNode, cordFrame, moveAt, grabFor, handOf, holding,
  localizeScene, headBox, figureBox, overlaps, armClear,
} from './kits/clausula-terminacion.js';

const ID = 'LAW-0497';
const DURATION = 6000;

const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const EV = [0.16, 0.4];
const BR = [0.44, 0.66];
const CORD = [0.66, 0.73];
const W = {final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A', 50), b: str('Caption for Party B', 50)}),
  objectLabels: obj('Plate on the circumstance tray', {tray: str('Plate on the circumstance tray', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['circumstance', 'section', 'bracket']), 0, 2),
  finalState: oneOf('The supplied case at the hold: provided (provided for: the bracket is slid shut on the supplied section and the connector cord drawn to the card; a tag "Section connected as supplied") or undescribed (not described: the bracket stays open, no cord; a tag "No connection supplied"). Both are supplied cases of equal weight; nothing is inferred from either', STATES),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Party A', b: 'Party B'},
  objectLabels: {tray: 'Communications tray'},
  actionProgress: 1,
  annotations: [],
  finalState: 'provided',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  actorLabels: {a: 'Parte A', b: 'Parte B'},
  objectLabels: {tray: 'Bandeja'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.clauses, p.circumstance.label].some(t => t.length > 40) || p.annotations.length > 1;

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
    // (the annotations first, ordered by their target from left to right: the first row, nearest the board, holds them)
    const ORDER = ['circumstance', 'section', 'bracket'];
    if (show) p.annotations.map((an, i) => ({name: `note${i}`, kind: 'note', text: an.text, target: an.target})).sort((x, y) => ORDER.indexOf(x.target) - ORDER.indexOf(y.target)).forEach(q => notes.push(q));
    if (show) notes.push({name: 'final', kind: 'final', text: p.finalState === 'undescribed' ? ctx.t.unmarked : ctx.t.marked});
    if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
    const notesAlt = notes.map(q => (q.kind === 'final' ? {...q, text: p.finalState === 'undescribed' ? ctx.t.marked : ctx.t.unmarked} : q));
    const stress = isStress(p);
    // (the circumstance panel's share of the board: even, or — where the print does not fit — wider or narrower)
    let L = null;
    for (const eventShare of [0.5, 0.56, 0.44]) {
      L = layoutStage(ctx, {
      box: {x: 6, y: 4, w: D.w - 12, h: D.h - 8}, upx, prefix: '', p,
      px: stress ? PX_STRESS : PX_BASE,
      headMin: stress ? 45 : shape === 'square' ? 55 : 60, headTarget: shape === 'square' ? 70 : 100, kMax: 2.2,
      names: showKey ? captions : null, plates: show ? p.objectLabels : null,
      notes, notesAlt, notesWhere: 'auto', tray: true, minCh: 71 / upx, minChE: 90 / upx, stack: shape === 'portrait', leadGap: p.annotations.length && show ? 0.8 : 0.4,
      eventShare,
      });
      if (L.ok) break;
    }
    L.captions = captions;
    L.plates = show ? p.objectLabels : null;
    if (!L.G) { L.ok = false; return L; }
    L.rigs = makeRigs(ctx, L, p.parties);
    const G = L.G;
    L.cord = cordGeom(G);
    // annotation leaders: from the chip's top (or bottom, in the top band) to the target's edge
    L.leads = [];
    if (L.notesPl) {
      for (const q of L.notesPl.placed) {
        if (q.it.kind !== 'note') continue;
        const tb = q.it.target === 'circumstance' ? G.panelE : q.it.target === 'section' ? G.panelT : G.rail;
        // (a leader from the chip's edge to the target panel's edge: up (or down) from the chip, across in the gap between
        // the board and the chips, then on to the target)
        const tx = Math.min(Math.max(q.x + q.c.box.w / 2, tb.x + 10), tb.x + tb.w - 10);
        const cx = Math.min(Math.max(tx, q.x + 12), q.x + q.c.box.w - 12);
        if (L.notesWhere === 'below') {
          const yb = G.board.y + G.board.h, ym = (yb + L.notesPl.placed.reduce((m0, z) => Math.min(m0, z.y), Infinity)) / 2;
          L.leads.push({name: `${q.it.name}-lead`, d: `M${r(cx)} ${r(q.y)}V${r(ym)}H${r(tx)}V${r(yb)}`});
        } else {
          const yt = G.board.y - 2 * G.layerUp, ym = (yt + L.notesPl.placed.reduce((m0, z) => Math.max(m0, z.y + z.c.box.h), -Infinity)) / 2;
          L.leads.push({name: `${q.it.name}-lead`, d: `M${r(cx)} ${r(q.y + q.c.box.h)}V${r(ym)}H${r(tx)}V${r(yt)}`});
        }
      }
    }
    L.headsClear = [headBox(G.figA), headBox(G.figB)].every(hb => !overlaps(hb, G.board, -1));
    L.notesClear = !L.notesPl || L.notesPl.placed.every(q => ![figureBox(G.figA), figureBox(G.figB)].some(f => overlaps(f, {x: q.x, y: q.y, w: q.c.box.w, h: q.c.box.h}, 2)));
    if (!L.headsClear) L.why.push('head-over-board');
    if (!L.notesClear) L.why.push('notes-over-people');
    L.ok = L.ok && L.headsClear && L.notesClear;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    if (!L.G) return g({name: 'scene'});
    const th = ctx.theme;
    const notesNodes = L.notesPl ? L.notesPl.placed.map(q => g({name: q.it.name, opacity: 0, transform: T(q.x - q.c.box.x, q.y - q.c.box.y)}, q.c.node)) : [];
    const leads = L.leads.map(ld => h('path', {name: ld.name, opacity: 0, d: ld.d, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    return g({name: 'scene'},
      stageArt(ctx, L),
      oblNodes(ctx, L, p.clauses),
      bracketNode(ctx, L, false),
      eventNode(ctx, L, p.finalState),
      cordNode(ctx, L, L.cord),
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
    const provided = p.finalState === 'provided';
    // the circumstance card: from the tray to the slot in Party A's hand
    const ev = moveAt(EV, G.trayE, G.slot, a);
    nodes.ev = {transform: T(r(ev.pos.x, 2), r(ev.pos.y, 2))};
    // the bracket: slid shut on the section in Party B's hand (provided); open, as supplied (undescribed)
    const brFrom = {x: G.B.openX, y: G.B.top}, brTo = {x: G.B.closedX, y: G.B.top};
    const br = moveAt(provided ? BR : null, brFrom, brTo, a);
    nodes.br = {transform: T(r(br.pos.x, 2), r(br.pos.y, 2))};
    // hands
    const rest = [G.figA, G.figB].map((fg, i) => L.rigs[i].frame({x: fg.x, y: fg.floor, facing: fg.f, scale: fg.k}).hands.near);
    const hA = handOf([grabFor(EV, G.trayE, G.slot, G.gripE)], rest[0], a);
    const knob = q => G.knobAt(q.x);
    const hB = provided ? handOf([grabFor(BR, brFrom, brTo, knob)], rest[1], a) : null;
    const posedA = L.rigs[0].frame({x: G.figA.x, y: G.figA.floor, facing: 1, scale: G.k, near: hA, headTilt: ev.moving ? -4 : 3});
    const posedB = L.rigs[1].frame({x: G.figB.x, y: G.figB.floor, facing: -1, scale: G.k, near: hB, headTilt: br.moving ? -4 : 3});
    Object.assign(nodes, posedA.nodes, posedB.nodes);
    const armsClear = armClear(posedA.nodes, 'A') && armClear(posedB.nodes, 'B');
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const heldA = holding(EV, a) ? {i: 0, grip: P2(G.gripE(ev.pos))} : null;
    const heldB = provided && holding(BR, a) ? {i: 0, grip: P2(knob(br.pos))} : null;
    // hold
    const fin = done ? seg(u, ...W.final) : 0;
    const keyO = done ? seg(u, ...W.key) : 0;
    const noteO = done ? seg(u, ...W.notes) : 0;
    if (L.notesPl) for (const q of L.notesPl.placed) nodes[q.it.name] = {opacity: r(q.it.kind === 'final' ? fin : q.it.kind === 'key' ? keyO : noteO, 3)};
    for (const ld of L.leads) nodes[ld.name] = {opacity: r(noteO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const brClosed = br.where === 'to';
    // the connector cord: drawn on only after the bracket has clasped the section (provided for), never otherwise
    const cordQ = provided ? seg(a, ...CORD) : 0;
    Object.assign(nodes, cordFrame(L.P, r(cordQ, 4)));
    return {
      nodes,
      semantic: {
        beat,
        evPos: P2(ev.pos), brPos: P2(br.pos),
        handA: P2(posedA.hands.near), handB: P2(posedB.hands.near),
        heldA, heldB, armsClear, cardH: r(G.chE, 2), lifter: false,
        allReached: posedA.reached && posedB.reached,
        cardAt: ev.where === 'to' ? 'slot' : ev.where === 'from' ? 'tray' : 'moving',
        bracket: brClosed ? 'closed' : br.moving ? 'moving' : 'open',
        cord: r(cordQ, 3), connected: cordQ >= 1,
        section: [G.tr.from, G.tr.to],
        finalState: p.finalState, finalShown: r(fin, 3), keyShown: r(keyO, 3),
        layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        textPx: r(L.F * L.upx, 2), headPx: r(90 * G.k * L.upx, 1),
        actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'contract-terms-05-story',
    title: 'Termination clause, without doctrine — a communication card seated and a section of the clause connected to it, as supplied',
    titleEs: 'Cláusula de terminación — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties on either side of a contract board with two panels, "Circumstances and communications" and "Termination clause". Party A takes the card "Communication 1 (supplied)" (printed with its supplied case: ● provided for or ◆ not described, drawn alike) from the tray and seats it in the slot. With "provided for" Party B slides a neutral connector bracket shut on the supplied section of the clause and a connector cord is drawn from the bracket to the seated card: the section is connected with the supplied communication. With "not described" the bracket stays open and no cord is drawn. The hold shows "Section connected as supplied" (or "No connection supplied") and the key "As supplied · no conclusion drawn". No termination doctrine, no notice period, no validity judgement, no conclusion.',
    tags: ['termination clause', 'section', 'communication', 'circumstance', 'connector', 'bracket', 'contract', 'layers', 'equal weight', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-terminacion.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
