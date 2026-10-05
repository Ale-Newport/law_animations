/**
 * LAW-0009 — Apertura de expediente · story
 *
 * Storyboard (top-down desk, the clerk sits at the bottom edge):
 *  0.00–0.15  Rest: the closed case file lies on the desk. Its file-number tab
 *             and the coloured separator tabs of the documents inside are
 *             visible; pen and stamp rest beside it.
 *  0.15–0.42  The clerk's left hand takes the free edge of the front cover,
 *             lifts it over the hinge and lets it fall open. The right hand
 *             takes the index sheet at its lower edge.
 *  0.42–0.73  The right hand draws the index sheet toward the clerk; the
 *             documents underneath follow by friction and settle as a cascade
 *             of layers, each showing its numbered header strip. The left hand
 *             takes the pen and ticks each index entry while the right hand
 *             waits on the stamp; as the last tick ends the right hand carries
 *             the stamp in from the right and presses it on the registry box.
 *  0.73–1.00  Hold: the opened file with its layers, ticks and the supplied
 *             final state. No legal effect is stated.
 * An optional absent document keeps its slot as a dashed ghost and the pen
 * passes over its box without ticking.
 * @module animations/documents/LAW-0009
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str, int} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {caseFileDesk, caseFileFields, CASE_STRINGS, STAGE, sideNote} from './kits/apertura-de-expediente.js';

const ID = 'LAW-0009';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/**
 * Action sub-windows (cause precedes effect: the cover opens before any layer
 * moves). The right hand takes the stamp and waits on it while the pen ticks;
 * it carries the stamp in from the right only as the last tick ends and presses
 * once the pen hand is already on its way back, so the two forearms never
 * converge on the index sheet at the same moment.
 */
const W = {
  reachCover: [0.07, 0.17], lift: [0.17, 0.3], fall: [0.3, 0.37], toPen: [0.33, 0.45],
  reachIndex: [0.25, 0.37], spread: [0.37, 0.53], toStamp: [0.53, 0.6], releaseR: [0.53, 0.6],
  ticks: [0.53, 0.675], penDown: [0.675, 0.72], withdrawL: [0.72, 0.76],
  stamp: [0.66, 0.79], backR: [0.79, 0.8],
  note: [0.8, 0.88],
};
const ACTION_END = 0.8;

const sceneSchema = {
  ...caseFileFields,
  ...storyFields({
    stamp: str('Text of the opening stamp pressed on the index sheet', 24),
  }, ['folder', 'layers', 'index', 'stamp'], ['opened-stamped', 'opened']),
  absentDocument: int('Index of a document listed in the index but absent from the file (-1 = none); its slot stays as a dashed ghost', -1, 4),
};

const defaultParams = {
  documentId: 'EXP-0417',
  documentTitle: 'Registration request',
  clauses: ['Application form', 'Identity document copy', 'Supporting letter', 'Fee receipt (hypothetical)'],
  signers: [{name: 'Dana Ruiz', role: 'Clerk'}, {name: 'Sam Okafor', role: 'Applicant'}],
  redactions: [],
  actorLabels: {a: 'Clerk', b: 'Applicant'},
  objectLabels: {stamp: 'OPENED'},
  actionProgress: 1,
  annotations: [{target: 'layers', text: 'Each document becomes a visible layer'}],
  finalState: 'opened-stamped',
  absentDocument: -1,
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

const scene = {
  sizes: {landscape: [STAGE.horizontal.w, STAGE.horizontal.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.vertical.w, STAGE.vertical.h]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const docs = p.clauses.map((title, i) => ({title, redacted: p.redactions.includes(i)}));
    const absent = p.absentDocument < docs.length ? p.absentDocument : -1;
    const stamped = p.finalState === 'opened-stamped';
    const applicant = p.signers[1].name;
    const stage = caseFileDesk(ctx, {
      prefix: 'stage', axis,
      file: {number: p.documentId, title: p.documentTitle, applicantLine: p.actorLabels.b ? `${p.actorLabels.b}: ${applicant}` : applicant, docs},
      absent, clerk: p.signers[0],
      clerkCaption: p.actorLabels.a ? `${p.signers[0].name} · ${p.actorLabels.a}` : p.signers[0].name,
      stampLabel: p.objectLabels.stamp, withStamp: stamped,
    });
    const {dw, n} = stage;
    const midLayer = [Math.floor((n - 1) / 2), Math.floor((n - 1) / 2) + 1, 0].find(j => j !== absent && j < n) ?? 0;
    const row0 = stage.idx.rows[0];
    const reg = stage.idx.reg;
    // the absent entry when there is one, otherwise the first entry
    const rowI = absent >= 0 ? stage.idx.rows[absent] : row0;
    const hor = axis === 'horizontal';
    // Targets: right-side anchors for notes placed right / above the cascade;
    // left-side anchors for notes placed on the inside of the opened cover.
    const targets = {
      folder: {x: stage.tabRect.x + stage.tabRect.w * 0.5, y: stage.tabRect.y + 6},
      layers: stage.layerWorld(midLayer, {x: dw - 3, y: stage.stripH * 0.5}),
      index: hor ? stage.indexWorld({x: dw - 6, y: rowI.y + rowI.h / 2}) : stage.indexWorld({x: 3, y: rowI.y + rowI.h / 2}),
      stamp: hor ? stage.indexWorld({x: reg.x + reg.w, y: reg.y + reg.h / 2}) : stage.indexWorld({x: reg.x, y: reg.y + reg.h / 2}),
    };
    // Editorial notes sit in desk areas left free by the final state:
    //  - horizontal: right-hand column, each chip at its target's height;
    //  - square / vertical: upper targets (folder, layers) in the top band,
    //    alternating right / left so a chip never lies on another's leader;
    //    lower targets (index, stamp) on the blank inside of the opened cover.
    const notes = [];
    if (ctx.show('all')) {
      if (hor) {
        let nextY = 150;
        p.annotations.forEach((a, i) => {
          const tgt = targets[a.target];
          const c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 1405, y: Math.max(nextY, Math.min(540, tgt.y - 40))}, anchor: 'middle', target: tgt, maxWidth: 350, size: 28});
          notes.push(c);
          nextY = c.box.y + c.box.h + 22;
        });
      } else {
        const sq = axis === 'square';
        const cover = stage.coverOpenRect;
        const coverX = Math.max(cover.x, 0) + 22;
        const coverW = cover.x + cover.w - coverX - 22;
        let topY = sq ? 34 : 150;
        let coverY = cover.y + cover.h * 0.42;
        // free corner left of the cascade, level with the lower targets
        // (portrait: below the resting pen and above the clerk chip)
        const chipTop = stage.clerkChipBox ? stage.clerkChipBox.y - 14 : st.h - 30;
        const low = sq ? {x: 40, y: 772, maxW: 262, yMax: 890} : {x: 24, y: 1158, maxW: 440, yMax: chipTop};
        let upper = 0;
        let minTargetX = st.w;
        p.annotations.forEach((a, i) => {
          const tgt = targets[a.target];
          if (a.target === 'index' || a.target === 'stamp') {
            const probe = sideNote(ctx, {name: `note${i}`, text: a.text, x: low.x, y: 0, maxWidth: low.maxW, size: 26, target: tgt});
            const fitsLow = low.y + probe.box.h <= low.yMax;
            const c = fitsLow
              ? sideNote(ctx, {name: `note${i}`, text: a.text, x: low.x, y: Math.max(low.y, Math.min(low.yMax - probe.box.h, tgt.y - probe.box.h / 2)), maxWidth: low.maxW, size: 26, target: tgt})
              : sideNote(ctx, {name: `note${i}`, text: a.text, x: coverX, y: coverY, maxWidth: coverW, size: 28, target: tgt});
            notes.push(c);
            if (fitsLow) low.y = c.box.y + c.box.h + 14;
            else coverY = c.box.y + c.box.h + 18;
            return;
          }
          const right = upper % 2 === 0;
          upper++;
          const maxW = right ? (sq ? 520 : st.w - 60) : Math.max(260, Math.min(sq ? 520 : st.w - 60, minTargetX - 90));
          const chipAt = right ? {x: st.w - 30, y: topY} : {x: 30, y: sq ? Math.max(topY, 112) : topY};
          const c = callout(ctx, {name: `note${i}`, text: a.text, chipAt, anchor: right ? 'end' : 'start', target: tgt, maxWidth: maxW, size: 28});
          notes.push(c);
          topY = c.box.y + c.box.h + 18;
          minTargetX = Math.min(minTargetX, tgt.x);
        });
      }
    }
    const stateText = stamped ? ctx.t.opened : ctx.t.laidOut;
    const tagAt = axis === 'horizontal' ? {x: 1405, y: 50, anchor: 'middle'} : axis === 'square' ? {x: 36, y: 40, anchor: 'start'} : {x: 450, y: 60, anchor: 'middle'};
    const tag = ctx.show('key') ? statusTag(ctx, stateText, {...tagAt, size: 30, name: 'state-tag', color: th.accent4}) : null;
    return {stage, s, ox, oy, notes, tag, stamped, absent};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const stamped = L.stamped;
    const w = k => seg(a, ...W[k]);
    const v = {
      reachCover: w('reachCover'), lift: w('lift'), fall: w('fall'), toPen: w('toPen'),
      reachIndex: w('reachIndex'), spread: w('spread'),
      toStamp: stamped ? w('toStamp') : 0, stamp: stamped ? w('stamp') : 0, backR: stamped ? w('backR') : 0,
      releaseR: stamped ? 0 : w('releaseR'),
      ticks: w('ticks'), penDown: w('penDown'), withdrawL: w('withdrawL'),
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        finalState: p.finalState,
        absentDocument: L.absent,
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
    slug: 'documents-03-story',
    title: 'Opening a case file — desk microscene',
    titleEs: 'Apertura de expediente — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Apertura de expediente',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down desk: the clerk lifts the cover of a closed case file, the index sheet is drawn out and the documents below follow into a cascade of numbered layers; the pen ticks each index entry and the stamp marks the registry box. An absent document keeps a dashed slot and is not ticked.',
    tags: ['case file', 'folder', 'layers', 'index', 'pen', 'stamp', 'desk', 'hands', 'opening'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/apertura-de-expediente.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CASE_STRINGS,
  scene,
});
