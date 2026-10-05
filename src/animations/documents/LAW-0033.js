/**
 * LAW-0033 — Notificación documentada · story
 *
 * Storyboard (top-down, two offices separated by a wall with a service hatch):
 *  0.00–0.15  rest: the sender's OUT tray holds the window envelope with a
 *             blank acknowledgment card clipped to it; the recipient's IN tray
 *             is empty; the sender's record folder, the recipient's pen and
 *             date stamp lie ready.
 *  0.15–0.42  the sender's hand lifts the envelope out of the OUT tray and
 *             carries it to the hatch; the recipient's hand takes it there
 *             (both hands hold it at the shared point) and lays it in the IN
 *             tray.
 *  0.42–0.76  cause before effect: the recipient signs the card (pen tip on
 *             the stroke), date-stamps it, tears it off and passes it back
 *             through the hatch; the sender's hand takes it and files it in
 *             the folder — the record now exists.
 *  0.76–1.00  held final state + descriptive status tag and callouts. The
 *             final state is supplied (record filed / acknowledgment kept /
 *             no record made); no legal effect is stated.
 * @module animations/documents/LAW-0033
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {documentsFields, storyFields} from '../../schemas/fields.js';
import {callout, chip, statusTag} from '../../primitives/annotate.js';
import {notificationStage, placeFree, STAGE, NOTICE_STRINGS, noticeObjectLabels, receiptDateField, finalStateField, CARD} from './kits/notificacion-documentada.js';

const ID = 'LAW-0033';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (hand-offs: envelope 0.30–0.32, card 0.68–0.70). */
const W = {
  reachA: [0.15, 0.2], carryA: [0.2, 0.3], reachB: [0.23, 0.3], carryB: [0.32, 0.41], retreatA: [0.32, 0.41],
  penTo: [0.4, 0.43], write: [0.43, 0.51], penBack: [0.51, 0.55],
  toStamp: [0.42, 0.47], stampGo: [0.49, 0.555], stampBack: [0.555, 0.59],
  toCard: [0.59, 0.635], cardOut: [0.635, 0.685], reachA2: [0.6, 0.685], cardIn: [0.7, 0.76], retreatB: [0.7, 0.77], retreatA2: [0.77, 0.83],
  // alternative final states
  releaseB: [0.43, 0.5], settleA: [0.46, 0.53], settleB: [0.6, 0.66], settleA2: [0.6, 0.66],
  note: [0.8, 0.88],
};
const ACTION_END = 0.83;

const sceneSchema = {
  ...documentsFields,
  ...storyFields({}, ['envelope', 'record', 'signature', 'stamp'], ['record-filed', 'signed-kept', 'delivered-no-record']),
  objectLabels: noticeObjectLabels,
  finalState: finalStateField,
  receiptDate: receiptDateField,
};

const defaultParams = {
  documentId: 'NTF-207',
  documentTitle: 'Notice of Meeting',
  clauses: ['Date and place of the meeting', 'Documents enclosed', 'Contact for questions'],
  signers: [{name: 'Alex Moreno', role: 'Sender'}, {name: 'Sam Okafor', role: 'Recipient'}],
  redactions: [],
  actorLabels: {a: 'Sender', b: 'Recipient'},
  objectLabels: {outTray: 'OUT', inTray: 'IN', folder: 'Notice file', card: 'Acknowledgment', stamp: 'RECEIVED'},
  receiptDate: 'Day 3',
  actionProgress: 1,
  annotations: [{target: 'record', text: 'Signed acknowledgment filed by the sender'}],
  finalState: 'record-filed',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

/** Callout chip widths (stage units) per axis; each chip is then placed in free space. */
const NOTE_W = {horizontal: 460, square: 430, vertical: 400};

/**
 * Action values at (capped) time `a` for a final state — shared by frame()
 * and by layout(), which poses the held final state to keep annotations clear
 * of the actors' arms and hands.
 */
function actionValues(fs, a) {
  const full = fs === 'record-filed';
  const signs = fs !== 'delivered-no-record';
  const w = (flag, key) => (flag ? seg(a, ...W[key]) : 0);
  return {
    reachA: w(true, 'reachA'), carryA: w(true, 'carryA'), reachB: w(true, 'reachB'), carryB: w(true, 'carryB'), retreatA: w(true, 'retreatA'),
    penTo: w(signs, 'penTo'), write: w(signs, 'write'), penBack: w(signs, 'penBack'),
    toStamp: w(signs, 'toStamp'), stampGo: w(signs, 'stampGo'), stampBack: w(signs, 'stampBack'),
    toCard: w(full, 'toCard'), cardOut: w(full, 'cardOut'), reachA2: w(full, 'reachA2'), cardIn: w(full, 'cardIn'), retreatB: w(full, 'retreatB'), retreatA2: w(full, 'retreatA2'),
    releaseB: w(!signs, 'releaseB'),
    settleA: !signs ? seg(a, ...W.settleA) : fs === 'signed-kept' ? seg(a, ...W.settleA2) : 0,
    settleB: w(fs === 'signed-kept', 'settleB'),
  };
}

const scene = {
  sizes: {landscape: [1860, 880], square: [1200, 1140], portrait: [940, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    // portrait keeps a band above the stage for the status tag (design units)
    const BAND = axis === 'vertical' ? 92 : 0;
    const s = Math.min(ctx.design.w / st.w, (ctx.design.h - BAND) / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = axis === 'vertical' ? ctx.design.h - st.h * s : (ctx.design.h - st.h * s) / 2;
    const parties = p.signers.map((sg, i) => ({...sg, role: (i === 0 ? p.actorLabels.a : p.actorLabels.b) || sg.role}));
    const stage = notificationStage(ctx, {
      prefix: 'stage', axis,
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      parties, labels: p.objectLabels, date: p.receiptDate,
    });
    const filed = p.finalState === 'record-filed';
    const where = filed ? 'folder' : 'in';
    const cw = CARD.w, ch = CARD.h;
    const targets = {
      envelope: stage.envPoint('in', {x: -40, y: 70}),
      record: stage.cardPoint(where, {x: filed ? cw * 0.46 : -cw * 0.3, y: filed ? 0 : ch * 0.2}),
      signature: stage.cardPoint(where, {x: stage.card.sigBox.x + stage.card.sigBox.w * 0.5, y: stage.card.sigBox.y + stage.card.sigBox.h * 0.6}),
      stamp: stage.cardPoint(where, stage.card.dateSpot),
    };
    // the held final pose: annotations are placed in free space around it
    // (never over an arm, a hand, a prop, the wall or an actor chip)
    const held = stage.pose(actionValues(p.finalState, ACTION_END));
    const obstacles = stage.obstacles(held);
    const {w: SW, h: SH} = st;
    const wl = stage.wall;
    const M = 16;
    const sides = wl.vwall
      ? {A: {x: M, y: M, w: wl.a - 2 * M, h: SH - 2 * M}, B: {x: wl.b + M, y: M, w: SW - wl.b - 2 * M, h: SH - 2 * M}}
      : {A: {x: M, y: wl.b + M, w: SW - 2 * M, h: SH - wl.b - 2 * M}, B: {x: M, y: M, w: SW - 2 * M, h: wl.a - 2 * M}};
    const sideOf = q => (wl.vwall ? (q.x < wl.a ? 'A' : 'B') : (q.y > wl.b ? 'A' : 'B'));
    const noteSize = axis === 'horizontal' ? 28 : 30;
    const notes = [];
    if (ctx.show('all')) {
      p.annotations.forEach((a, n) => {
        const target = targets[a.target];
        const region = sides[sideOf(target)];
        // preferred width and size first, then wider / narrower / smaller variants until an
        // untruncated chip fits the free space (meaning is never cut to fit)
        const Wn = NOTE_W[axis];
        const tries = [[Wn, noteSize], [Wn * 1.25, noteSize], [Wn * 0.8, noteSize], [Wn * 1.25, noteSize - 3], [Wn, noteSize - 3], [Wn * 1.25, noteSize - 6], [Wn, noteSize - 6], [Wn * 0.8, noteSize - 6]];
        let made = null;
        for (const [mw, size] of tries) {
          const probe = chip(ctx, a.text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size, maxLines: 3});
          if (probe.fit.truncated) continue;
          const spot = placeFree(probe.box, {region, obstacles, near: target, gap: 48});
          if (spot) {
            made = callout(ctx, {name: `note${n}`, text: a.text, chipAt: {x: spot.x + probe.box.w / 2, y: spot.y}, target, maxWidth: mw, size, maxLines: 3});
            break;
          }
        }
        if (!made) made = callout(ctx, {name: `note${n}`, text: a.text, chipAt: {x: region.x + region.w / 2, y: region.y}, target, maxWidth: Wn * 1.25, size: noteSize - 6, maxLines: 3});
        obstacles.push(made.box);
        notes.push(made);
      });
    }
    const stateText = filed ? t.stRecordFiled : p.finalState === 'signed-kept' ? t.stSignedKept : t.stNoRecord;
    // portrait: the tag sits in a band above the stage (design units); otherwise it is
    // placed in free space on the side the supplied state concerns (the sender's record
    // folder for filed / no record, the recipient's IN tray for a kept acknowledgment)
    const inBand = axis === 'vertical';
    const tagColor = filed ? ctx.theme.accent4 : ctx.theme.inkSoft;
    const tagOpts = {size: 30, maxWidth: inBand ? ctx.design.w - 40 : 600, name: 'state-tag', color: tagColor};
    let tag = null;
    if (ctx.show('key')) {
      if (inBand) tag = statusTag(ctx, stateText, {...tagOpts, x: ctx.design.w / 2, y: Math.max(4, (oy - 52) / 2), anchor: 'middle'});
      else {
        const probe = statusTag(ctx, stateText, {...tagOpts, x: 0, y: 0});
        const kept = p.finalState === 'signed-kept';
        const near = kept ? stage.inTray : stage.folderCenter;
        const spot = placeFree(probe.box, {region: sides[kept ? 'B' : 'A'], obstacles, near, gap: 30})
          || placeFree(probe.box, {region: sides[kept ? 'A' : 'B'], obstacles, near, gap: 30});
        const at = spot || {x: sides.A.x, y: sides.A.y};
        tag = statusTag(ctx, stateText, {...tagOpts, x: at.x, y: at.y});
      }
    }
    return {stage, s, ox, oy, notes, tag, filed, inBand};
  },
  build(ctx, L) {
    return g(null,
      g({transform: T(L.ox, L.oy, 0, L.s)},
        L.stage.node,
        !L.inBand && L.tag && L.tag.node,
        L.notes.map(n => n.node),
      ),
      L.inBand && L.tag && L.tag.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const fs = p.finalState;
    const v = actionValues(fs, a);
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat, finalState: fs, actionCapped: p.actionProgress < 1 && u > capU}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-09-story',
    title: 'Documented notice — tray-to-tray hand-off with a returned acknowledgment',
    titleEs: 'Notificación documentada — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Notificación documentada',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two offices seen from above, separated by a wall with a service hatch. The sender carries a window envelope from the OUT tray to the hatch, the recipient takes it and lays it in the IN tray, signs and date-stamps the clipped acknowledgment card and passes it back; the sender files it in the record folder. The final state is supplied (record filed, acknowledgment kept, or no record made).',
    tags: ['notice', 'envelope', 'tray', 'acknowledgment', 'record', 'folder', 'stamp', 'pen', 'hand-off', 'hatch'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/notificacion-documentada.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: NOTICE_STRINGS,
  scene,
});
