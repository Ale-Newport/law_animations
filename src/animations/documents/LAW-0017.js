/**
 * LAW-0017 — Ocultación de datos · story
 *
 * Storyboard (top-down desk, the record is the anchor and never moves):
 *  0.00–0.15  rest: a filled-in record lies on an open folder; a broad black
 *             marker rests on the desk; the reviewer's hand waits by a stamp.
 *  0.15–0.42  person A picks the marker up (hand reaches the grip first) and
 *             sweeps it along the first selected value boxes: each opaque band
 *             grows exactly under the nib, inside the box, so label and box
 *             outline — the structure — stay in place.
 *  0.42–0.73  the remaining bands are laid, the marker is put back at the same
 *             desk spot and the hand withdraws; the reviewer carries the stamp
 *             into the copy-type box and presses the copy-type mark.
 *  0.73–1.00  held final state = the supplied `finalState` (redacted / marked /
 *             unredacted) with optional callouts; no legal conclusion.
 * @module animations/documents/LAW-0017
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {statusTag} from '../../primitives/annotate.js';
import {redactionDesk, redactionDocFields, redactedIndices, noteCallout, REDACTION_STRINGS, STAGE} from './kits/ocultacion-de-datos.js';

const ID = 'LAW-0017';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (the rest beat 0–0.15 stays still; the hand only reaches for the marker from 0.15). */
const W = {pick: [0.15, 0.195], work: [0.195, 0.58], stow: [0.58, 0.645], withdraw: [0.645, 0.7], stamp: [0.585, 0.79], note: [0.8, 0.88]};
const ACTION_END = 0.79;

const sceneSchema = {
  ...redactionDocFields,
  ...storyFields({
    folder: str('Label printed on the folder tab', 40),
    stamp: str('Copy-type stamp impression applied to the redacted copy', 24),
  }, ['band', 'label', 'stamp', 'folder'], ['redacted', 'marked', 'unredacted']),
};

const defaultParams = {
  documentId: 'REC-2231',
  documentTitle: 'Client Intake Record',
  clauses: ['Client name', 'Home address', 'Account reference', 'Matter summary', 'Fee basis (hypothetical)'],
  fieldValues: ['Alex Moreno', '14 Example Lane, Northtown', 'ACC-0000-1234 (fictional)', 'Equipment lease review', 'Fixed fee of 900 (hypothetical)'],
  signers: [{name: 'Jordan Pike', role: 'Clerk'}, {name: 'Rina Solis', role: 'Reviewer'}],
  redactions: [0, 1, 2],
  actorLabels: {a: 'Applies the bands', b: 'Reviewer'},
  objectLabels: {folder: 'Copies for release', stamp: 'REDACTED COPY'},
  actionProgress: 1,
  annotations: [{target: 'band', text: 'Selected values covered'}, {target: 'label', text: 'Labels and layout kept'}],
  finalState: 'redacted',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
/** Free desk area for editorial notes per axis (stage units); the narrow portrait column allows more lines. */
const NOTES = {
  horizontal: {side: 'left', x: 24, w: 420, top: 200, bottom: 700, lines: 2, tag: {x: 24, y: 90, anchor: 'start'}},
  square: {side: 'right', x: 1180, w: 400, top: 250, bottom: 640, lines: 3, tag: {x: 30, y: 140, anchor: 'start'}},
  vertical: {side: 'right', x: 884, w: 250, top: 470, bottom: 1080, lines: 4, tag: {x: 884, y: 350, anchor: 'end'}},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const actors = p.signers.map((sg, i) => ({...sg, role: (i === 0 ? p.actorLabels.a : p.actorLabels.b) || sg.role}));
    const n = Math.min(5, p.clauses.length);
    const idx = redactedIndices(p.redactions, n);
    const mode = p.finalState === 'marked' ? 'outline' : 'cover';
    const strokes = p.finalState === 'unredacted' ? [] : idx.map(field => ({field, mode}));
    const stamped = p.finalState === 'redacted' && idx.length > 0;
    const stage = redactionDesk(ctx, {
      prefix: 'stage', axis,
      doc: {docId: p.documentId, title: p.documentTitle, labels: p.clauses, values: p.fieldValues},
      actors, stampLabel: stamped ? p.objectLabels.stamp : null, folderLabel: p.objectLabels.folder, strokes,
    });

    // Editorial notes sit in the free desk area, at the height of their target.
    const N = NOTES[axis];
    const first = idx.length ? idx[0] : 0;
    const fb = stage.fieldBox(first);
    const lb = stage.labelBox(first);
    const left = N.side === 'left';
    const targets = {
      // ends just outside the value box, beside the band (never on the band itself)
      band: left ? {x: fb.x - 11, y: fb.y + fb.h / 2} : {x: fb.x + fb.w + 11, y: fb.y + fb.h / 2},
      // the leader dot (r 6.5) ends ~8 units clear of the label text box
      label: left ? {x: lb.x - 15, y: lb.y + lb.h * 0.55} : {x: lb.x + lb.w + 15, y: lb.y + lb.h * 0.55},
      stamp: left ? {x: stage.stampSpot.x - 60, y: stage.stampSpot.y} : {x: stage.stampSpot.x + 60, y: stage.stampSpot.y},
      folder: {x: stage.folderTL.x + stage.folder.tabW * 0.5, y: stage.folderTL.y - stage.folder.tabH * 0.5},
    };
    const notes = [];
    if (ctx.show('all')) {
      const order = p.annotations.map((a, i) => ({a, i, t: targets[a.target]})).sort((x, y) => x.t.y - y.t.y);
      let floor = N.top;
      for (const {a, i, t} of order) {
        const fit = {maxWidth: N.w, size: 28, minSize: 21, maxLines: N.lines};
        const probe = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, anchor: 'start', target: t, ...fit});
        const hgt = probe.box.h;
        const y = clamp(Math.max(floor, t.y - hgt / 2), N.top, Math.max(N.top, N.bottom - hgt));
        const c = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: N.x, y}, anchor: left ? 'start' : 'end', target: t, ...fit});
        floor = y + hgt + 18;
        notes.push(c);
      }
    }
    // Leader dots (r 6.5) never touch the label or value box they point at.
    const clearOf = (q, b, pad = 3) => q.x + 6.5 < b.x - pad || q.x - 6.5 > b.x + b.w + pad || q.y + 6.5 < b.y - pad || q.y - 6.5 > b.y + b.h + pad;
    const leadersClear = p.annotations.every(a => clearOf(targets[a.target], lb) && clearOf(targets[a.target], fb));
    const S = REDACTION_STRINGS[p.locale] || REDACTION_STRINGS.en;
    const stateText = p.finalState === 'redacted' ? S.redactedCopy : p.finalState === 'marked' ? S.markedCopy : S.fullCopy;
    const tagColor = p.finalState === 'redacted' ? th.ink : p.finalState === 'marked' ? th.accent : th.accent2;
    const tag = ctx.show('key') ? statusTag(ctx, stateText, {...N.tag, size: 30, name: 'state-tag', color: tagColor, maxWidth: 380}) : null;
    return {stage, s, ox, oy, notes, tag, stamped, hasStrokes: strokes.length > 0, leadersClear};
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
    const acts = L.hasStrokes;
    const v = {
      pick: acts ? seg(a, ...W.pick) : 0,
      work: acts ? seg(a, ...W.work) : 0,
      stow: acts ? seg(a, ...W.stow) : 0,
      withdraw: acts ? seg(a, ...W.withdraw) : 0,
      stamp: L.stamped ? seg(a, ...W.stamp) : 0,
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat, reaching: v.pick > 0, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU, leadersClear: L.leadersClear, stampLines: L.stage.sheet.stampLines}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-05-story',
    title: 'Data redaction — desk microscene',
    titleEs: 'Ocultación de datos — Microescena con objetos y actores',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Ocultación de datos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down desk: a person picks up a broad marker and sweeps opaque bands over the selected value boxes of a filled-in record; each band grows under the nib inside its box, so labels and layout stay. The reviewer then stamps the copy type. Final state supplied by the author (redacted, marked or unredacted).',
    tags: ['redaction', 'data', 'record', 'marker', 'bands', 'folder', 'stamp', 'desk', 'hands', 'privacy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/ocultacion-de-datos.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: REDACTION_STRINGS,
  scene,
});
