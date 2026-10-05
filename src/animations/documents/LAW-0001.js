/**
 * LAW-0001 — Firma de documento · story
 * A pen travels along a signature line and the signed document passes to the
 * other party, who receives it on a folder and stamps it as received.
 * Top-down desk microscene; the pen tip follows the signature stroke exactly,
 * hands stay attached through IK, and the receiving hand holds the document's
 * edge for the whole transfer.
 * @module animations/documents/LAW-0001
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {documentsFields, storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {signingDesk, STAGE} from './kits/signing-desk.js';

const ID = 'LAW-0001';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/**
 * Action sub-windows. Signing happens inside the brief's 0.15–0.42 beat; the
 * transfer (push → glide → catch → pull) and receipt stamp complete the
 * displacement; the final state is held from 0.8.
 */
const W = {
  approach: [0.1, 0.18], write: [0.18, 0.38], putDown: [0.38, 0.43], toDoc: [0.43, 0.46],
  push: [0.46, 0.505], glide: [0.505, 0.6], reach: [0.47, 0.585], pull: [0.6, 0.68], release: [0.68, 0.73],
  stamp: [0.64, 0.8], note: [0.8, 0.88],
};
const ACTION_END = 0.8;

const sceneSchema = {
  ...documentsFields,
  ...storyFields({
    folder: str('Label printed on the receiving folder', 40),
    stamp: str('Text of the receipt stamp impression', 24),
  }, ['signature', 'document', 'folder', 'stamp'], ['passed', 'signed-retained', 'pending']),
};

const defaultParams = {
  documentId: 'DOC-104',
  documentTitle: 'Service Agreement',
  clauses: ['Scope of work', 'Fees (hypothetical)', 'Term and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  actorLabels: {a: 'Signer', b: 'Receiving party'},
  objectLabels: {folder: 'Party B file', stamp: 'RECEIVED'},
  actionProgress: 1,
  annotations: [{target: 'signature', text: 'Signature added by Party A'}],
  finalState: 'passed',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const signers = p.signers.map((sg, i) => ({...sg, role: (i === 0 ? p.actorLabels.a : p.actorLabels.b) || sg.role}));
    const passes = p.finalState === 'passed';
    const stage = signingDesk(ctx, {
      prefix: 'stage', axis,
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      signers, stampLabel: p.objectLabels.stamp, folderLabel: p.objectLabels.folder, withStamp: passes,
    });
    const hor = axis !== 'vertical';
    const where = passes ? 'B' : 'A';
    // When the free area is to the right of the document (no transfer), point at
    // the signature's right end so the leader does not cross the sheet.
    const sigX = passes || !hor ? stage.doc.sigBox.x - 8 : stage.doc.sigBox.x + stage.doc.sigBox.w + 6;
    const targets = {
      signature: stage.docPoint(where, {x: sigX, y: stage.doc.sigBox.y + stage.doc.sigBox.h * 0.62}),
      document: stage.docPoint(where, {x: stage.dw * 0.5, y: stage.dh * 0.1}),
      folder: stage.docPoint('B', {x: stage.dw * 1.02, y: stage.dh * 1.02}),
      stamp: stage.docPoint('B', stage.stampSpotLocal),
    };
    // Editorial info goes into the desk area the document does NOT occupy at the end.
    const free = passes ? stage.docA : stage.docB;
    const noteW = hor ? stage.dw * 1.05 : st.w * 0.62;
    // Each chip sits at the height of its target so the leader stays short and
    // never crosses the document's text.
    const notes = ctx.show('all') ? p.annotations.map((a, i) => {
      const tgt = targets[a.target];
      const chipAt = hor
        ? {x: free.x, y: Math.max(40, Math.min(st.h - 120, tgt.y - 30 + i * 8))}
        : {x: free.x, y: free.y + (i === 0 ? -40 : 90)};
      return callout(ctx, {name: `note${i}`, text: a.text, chipAt, target: tgt, maxWidth: noteW, size: 30});
    }) : [];
    const stateText = p.finalState === 'pending' ? ctx.t.pending : ctx.t.signed;
    const tagY = hor ? free.y - stage.dh * 0.28 : free.y - 130;
    const tag = ctx.show('key') ? statusTag(ctx, stateText, {x: free.x, y: tagY, anchor: 'middle', size: 30, name: 'state-tag', color: p.finalState === 'pending' ? ctx.theme.inkSoft : ctx.theme.accent4}) : null;
    return {stage, s, ox, oy, notes, tag, passes};
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
    const signs = p.finalState !== 'pending';
    const passes = L.passes;
    const on = (flag, w) => (flag ? seg(a, ...w) : 0);
    const v = {
      approach: seg(a, ...W.approach),
      write: on(signs, W.write),
      putDown: seg(a, ...W.putDown),
      toDoc: on(passes, W.toDoc),
      push: on(passes, W.push),
      glide: on(passes, W.glide),
      reach: on(passes, W.reach),
      pull: on(passes, W.pull),
      release: on(passes, W.release),
      stamp: on(passes, W.stamp),
      withdraw: on(!passes, W.toDoc),
      hover: !signs ? seg(a, W.write[0], W.write[1]) : 0,
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-01-story',
    title: 'Document signing — desk microscene',
    titleEs: 'Firma de documento — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Firma de documento',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down desk: party A signs with a pen whose tip follows the signature stroke; party B pulls the signed document onto a folder and stamps it as received. Final state is supplied by the author (passed, signed-retained or pending).',
    tags: ['signature', 'document', 'pen', 'folder', 'stamp', 'handoff', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/signing-desk.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
